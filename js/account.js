// Compte de client (Supabase Auth). Serveix per guardar les dades d'enviament i veure les
// comandes pròpies. No és obligatori per comprar i mai guarda cap targeta.
// La sessió es guarda al navegador (localStorage, clau fc.cust); l'administrador té la seva a part.
(function () {
  const B = window.FUNDICAT_BACKEND || { type: 'local' };
  const KEY = 'fc.cust';
  const enabled = B.type === 'supabase';
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn());

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const write = (v) => { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch { /* mode privat */ } };
  let auth = enabled ? read() : null; // { access_token, refresh_token, expires_at, id, email, name }
  let profile; // undefined = encara no carregat, null = sense dades
  let recovering = false;

  const fail = (res, data, fallback) => {
    const msg = String(data?.msg || data?.error_description || data?.message || data?.error || '');
    if (/invalid login/i.test(msg)) return new Error('El correu o la contrasenya no són correctes.');
    if (/already|registered/i.test(msg)) return new Error('Aquest correu ja té un compte. Entra amb la teva contrasenya.');
    if (/at least|weak|short/i.test(msg)) return new Error('La contrasenya ha de tenir com a mínim 8 caràcters.');
    if (res.status === 429 || /rate limit/i.test(msg)) return new Error('Massa intents seguits. Torna-ho a provar d\'aquí a una estona.');
    return new Error(fallback);
  };

  async function authCall(path, body, { method = 'POST', token } = {}) {
    const res = await fetch(`${B.url}/auth/v1/${path}`, {
      method,
      headers: { apikey: B.key, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw fail(res, data, 'No s\'ha pogut fer. Torna-ho a provar.');
    return data;
  }

  function keep(data) {
    if (!data.access_token) return false;
    auth = {
      access_token: data.access_token, refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
      id: data.user?.id || auth?.id, email: data.user?.email || auth?.email,
      name: data.user?.user_metadata?.name || auth?.name || '',
    };
    write(auth);
    return true;
  }

  // Si l'usuari torna d'un correu de "He oblidat la contrasenya", Supabase posa la sessió al hash de l'adreça.
  (function readRecovery() {
    if (!enabled || !/access_token=/.test(location.hash) || !/type=recovery/.test(location.hash)) return;
    const p = new URLSearchParams(location.hash.replace(/^#\/?/, ''));
    auth = { access_token: p.get('access_token'), refresh_token: p.get('refresh_token') || '', expires_at: Date.now() + (Number(p.get('expires_in')) || 3600) * 1000, id: '', email: '', name: '' };
    recovering = true;
    history.replaceState(null, '', `${location.pathname}#/compte`);
    authCall('user', null, { method: 'GET', token: auth.access_token }).then((u) => { auth.id = u.id; auth.email = u.email; auth.name = u.user_metadata?.name || ''; write(auth); emit(); }).catch(() => { auth = null; recovering = false; emit(); });
  })();

  async function token() {
    if (!auth) return null;
    if (Date.now() > auth.expires_at - 60e3 && auth.refresh_token) {
      try { keep(await authCall('token?grant_type=refresh_token', { refresh_token: auth.refresh_token })); } catch { auth = null; write(null); profile = undefined; emit(); return null; }
    }
    return auth?.access_token || null;
  }

  async function rest(path, { method = 'GET', body, prefer } = {}) {
    const tk = await token();
    if (!tk) throw new Error('Cal iniciar sessió.');
    const res = await fetch(`${B.url}/rest/v1/${path}`, {
      method,
      headers: { apikey: B.key, Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || 'No s\'ha pogut desar. Torna-ho a provar.');
    return data;
  }

  const clean = (p) => ({
    name: String(p.name || '').trim().slice(0, 200), phone: String(p.phone || '').trim().slice(0, 60), nif: String(p.nif || '').trim().slice(0, 30),
    address: String(p.address || '').trim().slice(0, 300), zip: String(p.zip || '').trim().slice(0, 20), city: String(p.city || '').trim().slice(0, 120),
    country: String(p.country || 'Espanya').trim().slice(0, 60),
  });

  const Account = {
    enabled,
    get loggedIn() { return !!auth && !!auth.id; },
    get email() { return auth?.email || ''; },
    get name() { return auth?.name || ''; },
    get recovering() { return recovering; },
    token,
    subscribe: (fn) => listeners.add(fn),

    // Crea el compte. Si a Supabase té activada la confirmació per correu, no entra directament.
    async signUp({ email, password, name }) {
      if (String(password || '').length < 8) throw new Error('La contrasenya ha de tenir com a mínim 8 caràcters.');
      const data = await authCall('signup', { email: String(email).trim(), password, data: { name: String(name || '').trim().slice(0, 200) } });
      profile = undefined;
      if (keep(data)) {
        emit();
        // Correu de benvinguda (si falla, no passa res)
        fetch(`${B.url}/functions/v1/botiga/welcome`, { method: 'POST', keepalive: true, headers: { apikey: B.key, Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: window.I18N?.lang }) }).catch(() => {});
        return { signedIn: true };
      }
      return { signedIn: false }; // cal confirmar el correu (o el correu ja existia)
    },
    async signIn(email, password) {
      keep(await authCall('token?grant_type=password', { email: String(email).trim(), password }));
      profile = undefined; emit();
    },
    async signOut() {
      const tk = auth?.access_token;
      auth = null; write(null); profile = undefined; recovering = false; emit();
      if (tk) authCall('logout', null, { token: tk }).catch(() => {});
    },
    async recover(email) {
      await authCall(`recover?redirect_to=${encodeURIComponent(location.origin + '/')}`, { email: String(email).trim() });
    },
    async setPassword(password) {
      if (String(password || '').length < 8) throw new Error('La contrasenya ha de tenir com a mínim 8 caràcters.');
      const tk = await token();
      await authCall('user', { password }, { method: 'PUT', token: tk });
      recovering = false; emit();
    },

    // Dades d'enviament guardades
    async profile(force) {
      if (!this.loggedIn) return null;
      if (profile !== undefined && !force) return profile;
      const rows = await rest(`customers?user_id=eq.${auth.id}&select=*`);
      profile = rows[0] || null;
      return profile;
    },
    async saveProfile(p) {
      if (!this.loggedIn) throw new Error('Cal iniciar sessió.');
      const row = { user_id: auth.id, ...clean(p), updated_at: new Date().toISOString() };
      const rows = await rest('customers?on_conflict=user_id', { method: 'POST', body: row, prefer: 'resolution=merge-duplicates,return=representation' });
      profile = rows[0] || row;
      return profile;
    },
    orders: () => rest('orders?select=number,created_at,status,total,lines,delivery&order=created_at.desc&limit=50'),
    // Lliga al compte la comanda que s'acaba de fer sense sessió.
    async claim(order) {
      if (!order?.number || !order?.claim_token) return false;
      return rest('rpc/claim_order', { method: 'POST', body: { p_number: order.number, p_token: order.claim_token } });
    },
    async deleteAccount() {
      await rest('rpc/delete_my_account', { method: 'POST', body: {} });
      auth = null; write(null); profile = undefined; emit();
    },
  };
  window.Account = Account;
})();
