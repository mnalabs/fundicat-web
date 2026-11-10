// Capa de dades del panell d'administració. El panell (admin.js) només parla
// amb window.AdminBackend; aquí hi ha les dues implementacions:
//   supabase → Supabase Auth + base de dades + emmagatzematge de fotos
//   local    → servidor Node d'aquest ordinador (fundicat/server.js)
// Errors de sessió: es llança un Error amb .auth = true i el panell torna a demanar l'accés.
(function () {
  const B = window.FUNDICAT_BACKEND || { type: 'local' };
  // La sessió dura mentre la pestanya és oberta; si es marca "Recorda'm en aquest
  // dispositiu" (l'app del mòbil), es guarda al dispositiu fins que es tanca la sessió.
  const REMEMBER = 'fc.remember';
  const remembered = () => { try { return localStorage.getItem(REMEMBER) === '1'; } catch { return false; } };
  const session = {
    get(k) {
      try { return JSON.parse(sessionStorage.getItem(k) || (remembered() ? localStorage.getItem(k) : null)); } catch { return null; }
    },
    set(k, v) {
      try {
        const keep = remembered();
        for (const s of [sessionStorage, localStorage]) {
          if (v == null || (s === localStorage && !keep)) s.removeItem(k); else s.setItem(k, JSON.stringify(v));
        }
      } catch { /* mode privat */ }
    },
    remember(on) { try { on ? localStorage.setItem(REMEMBER, '1') : localStorage.removeItem(REMEMBER); } catch { /* mode privat */ } },
  };
  const authError = (msg = 'La sessió ha caducat.') => Object.assign(new Error(msg), { auth: true });
  const rand = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function checkImage(file) {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error(`${file.name}: fes servir JPG, PNG, WebP o GIF.`);
    if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name}: la imatge supera els 8 MB.`);
  }

  // Etiqueta de prova imprimible (10 × 15 cm), mentre no hi hagi Sendcloud.
  function testLabelsHTML(list, sender) {
    const bars = (code) => [...code].map((ch) => `<i style="width:${(ch.charCodeAt(0) % 3) + 1}px"></i>`).join('');
    return `<!doctype html><meta charset="utf-8"><title>Etiquetes</title><style>
      @page { size: 100mm 150mm; margin: 0 } body { margin: 0; font: 13px/1.35 Arial, sans-serif; }
      .l { width: 100mm; height: 150mm; box-sizing: border-box; padding: 6mm; page-break-after: always; display: flex; flex-direction: column; gap: 4mm; border: 1px dashed #bbb; }
      .w { font-size: 18px; font-weight: 700; letter-spacing: 3px; } .t { font-size: 22px; font-weight: 700; }
      .box { border: 2px solid #000; padding: 3mm; } .s { color: #555; font-size: 11px; } .bc { display: flex; gap: 2px; height: 22mm; }
      .bc i { background: #000; display: block; } .test { background: #000; color: #fff; text-align: center; font-weight: 700; padding: 2mm; }
    </style>${list.map((o) => `<section class="l">
      <div class="test">ETIQUETA DE PROVA · NO VÀLIDA PER ENVIAR</div>
      <div class="s">Remitent: Fundicat · ${esc(sender)}</div>
      <div class="box"><div class="s">Destinatari</div><div class="t">${esc(o.customer.name)}</div>${esc(o.customer.address)}<br>${esc(o.customer.zip)} ${esc(o.customer.city)}<br>${esc(o.customer.country)}${o.customer.phone ? `<br>Tel. ${esc(o.customer.phone)}` : ''}</div>
      <div>Comanda <b>${esc(o.number)}</b> · ${o.delivery?.kg ?? '?'} kg · ${esc(o.delivery?.name || '')}</div>
      <div class="bc">${bars(o.label.tracking)}</div><div class="w">${esc(o.label.tracking)}</div>
    </section>`).join('')}<script>window.onload = () => window.print()<\/script>`;
  }

  // ---------- Neteja del catàleg abans de desar (abans ho feia el servidor) ----------
  const str = (v, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : '');
  const num = (v, min = 0) => (Number.isFinite(+v) && +v >= min ? +v : min);
  const round2 = (n) => Math.round(n * 100) / 100;
  const safeImage = (v) => { const s = str(v, 500).trim(); return /^https:\/\//.test(s) || /^\/uploads\/[\w.-]+$/.test(s) ? s : ''; };
  const safeLink = (v) => { const s = str(v, 500).trim(); return /^(#\/|https?:\/\/|\/(?!\/))/.test(s) ? s : ''; };
  const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const LANGS = ['es', 'en', 'it'];
  const cleanI18n = (obj, fields) => Object.fromEntries(LANGS.map((l) => [l, Object.fromEntries(fields.map((f) => {
    const v = obj?.[l]?.[f];
    return [f, Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : str(v)];
  }).filter(([, v]) => (Array.isArray(v) ? v.length : v)))]));

  function cleanProduct(p, catIds) {
    const name = str(p.name, 200).trim();
    if (!name) throw new Error('Tots els productes necessiten un títol.');
    const out = {
      id: str(p.id, 80) || `p-${rand().toLowerCase()}`,
      slug: slugify(str(p.slug) || `${name} ${str(p.variant)}`) || rand().toLowerCase(),
      sku: str(p.sku, 80), name, variant: str(p.variant, 200),
      category: catIds.includes(p.category) ? p.category : catIds[0],
      price: round2(num(p.price)), stock: Math.floor(num(p.stock)),
      status: p.status === 'draft' ? 'draft' : 'active',
      art: str(p.art, 20) || 'bag',
      images: (Array.isArray(p.images) ? p.images : []).map(safeImage).filter(Boolean).slice(0, 12),
      weight: Math.round(num(p.weight ?? 1) * 1000) / 1000 || 0.1,
      short: str(p.short, 500),
      description: (Array.isArray(p.description) ? p.description : []).map((x) => str(x)).filter(Boolean),
      specs: Object.fromEntries(Object.entries(p.specs || {}).map(([k, v]) => [str(k, 60), str(v, 200)]).filter(([k]) => k)),
      tiers: (Array.isArray(p.tiers) ? p.tiers : []).map((t) => ({ min: Math.max(2, Math.floor(num(t.min, 2))), off: Math.min(0.9, num(t.off)) })).filter((t) => t.off > 0).sort((a, b) => a.min - b.min),
      related: (Array.isArray(p.related) ? p.related : []).map((x) => str(x, 80)).slice(0, 6),
      i18n: cleanI18n(p.i18n, ['name', 'variant', 'short', 'description']),
    };
    if (p.badge) out.badge = str(p.badge, 40);
    if (p.exemple) out.exemple = true;
    if (p.oversize) { out.oversize = true; out.shipFixed = round2(num(p.shipFixed)); }
    else {
      // Mides de la caixa (cm). Si en falta alguna, no es desen i es fa servir la caixa estàndard.
      const dim = (v) => Math.min(300, Math.round(num(v) * 10) / 10);
      const d = { l: dim(p.dims?.l), w: dim(p.dims?.w), h: dim(p.dims?.h) };
      if (d.l > 0 && d.w > 0 && d.h > 0) out.dims = d;
    }
    return out;
  }
  const cleanAnnouncement = (a) => ({
    id: str(a.id, 80) || `a-${rand().toLowerCase()}`, placement: a.placement === 'home' ? 'home' : 'bar', active: !!a.active,
    link: safeLink(a.link), image: safeImage(a.image), text: str(a.text, 200), title: str(a.title, 120),
    subtitle: str(a.subtitle, 240), cta: str(a.cta, 40), i18n: cleanI18n(a.i18n, ['text', 'title', 'subtitle', 'cta']),
  });
  function cleanCatalog(draft) {
    const catIds = draft.categories.map((c) => c.id);
    const products = draft.products.map((p) => cleanProduct(p, catIds));
    const seen = new Set();
    products.forEach((p) => { while (seen.has(p.slug)) p.slug += '-2'; seen.add(p.slug); });
    const s = draft.config.shipping || {};
    const config = {
      ...draft.config,
      vat: Math.min(0.5, num(draft.config.vat)),
      cancel: { hours: Math.min(720, Math.max(1, Math.round(Number(draft.config.cancel?.hours)) || 24)) },
      company: (() => { const c = draft.config.company || {}; return { name: str(c.name, 120) || 'Fundicat', nif: str(c.nif, 20).toUpperCase().replace(/\s+/g, ''), address: str(c.address, 200), registry: str(c.registry, 200), email: str(c.email, 120), phone: str(c.phone, 30) }; })(),
      shipping: {
        autoLabel: !!s.autoLabel,
        pickup: { enabled: !!s.pickup?.enabled, address: str(s.pickup?.address, 200) || 'Manresa (Barcelona)' },
        sendcloud: { methodHome: str(s.sendcloud?.methodHome, 20).replace(/\D/g, ''), methodExpress: str(s.sendcloud?.methodExpress, 20).replace(/\D/g, '') },
        zones: (s.zones || []).map((z) => ({
          id: z.id, name: z.name, enabled: !!z.enabled,
          rates: [0, 1, 2, 3, 4].map((i) => round2(num(z.rates?.[i]))), freeFrom: num(z.freeFrom), express: num(z.express),
          // Dies laborables de trànsit [mínim, màxim] per a l'estimació d'entrega.
          days: (() => { const a = Math.min(30, Math.max(1, Math.round(num(z.days?.[0])) || 1)); const b = Math.min(30, Math.max(a, Math.round(num(z.days?.[1])) || a)); return [a, b]; })(),
        })),
        // Preus reals de transportistes (Packlink): s'activa només des del panell.
        packlink: {
          enabled: !!s.packlink?.enabled,
          marginPct: Math.min(100, Math.max(0, round2(num(s.packlink?.marginPct)))),
          marginFixed: Math.min(50, Math.max(0, round2(num(s.packlink?.marginFixed)))),
          addVat: !!s.packlink?.addVat,
          disabled: [...new Set((Array.isArray(s.packlink?.disabled) ? s.packlink.disabled : []).map((n) => str(n, 60)).filter(Boolean))].slice(0, 60),
          box: { l: Math.min(300, Math.max(1, num(s.packlink?.box?.l, 30))), w: Math.min(300, Math.max(1, num(s.packlink?.box?.w, 20))), h: Math.min(300, Math.max(1, num(s.packlink?.box?.h, 15))) },
        },
        prepDays: Math.min(10, Math.max(0, s.prepDays === '' || s.prepDays == null ? 1 : Math.round(num(s.prepDays)))),
      },
    };
    const h = draft.home || {};
    return {
      ...draft, config, products,
      announcements: (draft.announcements || []).map(cleanAnnouncement),
      home: { heroImage: safeImage(h.heroImage), heroTitle: str(h.heroTitle, 120), heroLead: str(h.heroLead, 300), i18n: cleanI18n(h.i18n, ['heroTitle', 'heroLead']) },
      categories: draft.categories.map((c) => ({ ...c, image: safeImage(c.image) })),
    };
  }

  // =====================================================================
  // Supabase
  // =====================================================================
  function supabaseBackend() {
    const KEY = 'fc.sb';
    let auth = session.get(KEY); // { access_token, refresh_token, expires_at, email }

    async function authRequest(path, body) {
      const res = await fetch(`${B.url}/auth/v1/${path}`, { method: 'POST', headers: { apikey: B.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error_description || data.msg || data.message || '';
        throw new Error(/invalid login|invalid_grant|credentials/i.test(msg + data.error_code) ? 'Correu o contrasenya incorrectes.' : msg || 'No s\'ha pogut entrar.');
      }
      return data;
    }
    const keep = (data) => {
      auth = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + (data.expires_in || 3600) * 1000, email: data.user?.email || auth?.email };
      session.set(KEY, auth);
    };
    async function token() {
      if (!auth) throw authError('Cal iniciar sessió.');
      if (Date.now() > auth.expires_at - 60_000) {
        try { keep(await authRequest('token?grant_type=refresh_token', { refresh_token: auth.refresh_token })); } catch { auth = null; session.set(KEY, null); throw authError(); }
      }
      return auth.access_token;
    }
    async function rest(path, { method = 'GET', body, prefer } = {}) {
      const res = await fetch(`${B.url}/rest/v1/${path}`, {
        method,
        headers: { apikey: B.key, Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 401) throw authError();
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.message || `Error de la base de dades (${res.status}).`);
      return data;
    }
    const inList = (ids) => `in.(${ids.map((x) => `"${String(x).replace(/"/g, '')}"`).join(',')})`;
    const mapOrder = (o) => ({
      number: o.number, date: o.created_at, status: o.status, method: o.method, customer: o.customer, lines: o.lines,
      subtotal: +o.subtotal, shipping: +o.shipping, total: +o.total, vat: +o.vat, delivery: o.delivery,
      label: o.label || undefined, labelError: o.label_error || undefined, carrierStatus: o.carrier_status || undefined,
      payment: o.payment || undefined, emailLog: o.email_log || undefined, invoiceNumber: o.invoice_number || undefined, creditNumber: o.credit_number || undefined, invoiceToken: o.invoice_token || undefined, cancelledAt: o.cancelled_at || undefined, cancelBy: o.cancel_by || undefined, refund: o.refund || undefined, shippedAt: o.shipped_at || undefined, deliveredAt: o.delivered_at || undefined,
    });
    const mapQuote = (q) => ({ ...q, date: q.created_at });

    async function loadCatalog() {
      const [store, products, announcements] = await Promise.all([
        rest('store?select=key,value'),
        rest('products?select=data,status&order=position.asc'),
        rest('announcements?select=data,active&order=position.asc'),
      ]);
      const s = Object.fromEntries(store.map((r) => [r.key, r.value]));
      return {
        config: s.config, categories: s.categories || [], services: s.services || [], customParts: s.customParts || [], home: s.home || {},
        products: products.map((r) => ({ ...r.data, status: r.status })),
        announcements: announcements.map((r) => ({ ...r.data, active: r.active })),
      };
    }
    const loadOrders = async () => (await rest('orders?select=*&order=created_at.desc')).map(mapOrder);

    // Funció "botiga" (Edge Function): Stripe i Sendcloud amb claus secretes.
    async function fn(path, { method = 'GET', body } = {}) {
      const res = await fetch(`${B.url}/functions/v1/botiga/${path}`, {
        method,
        headers: { apikey: B.key, Authorization: `Bearer ${await token()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      return res;
    }
    let connected = { stripe: false, sendcloud: false, push: false, packlink: false, email: false };
    let methods = [];
    let methodsError = '';

    return {
      mode: 'supabase',
      needsEmail: true,
      get sendcloudMethods() { return methods; },
      get sendcloudError() { return methodsError; },
      get sendcloud() { return connected.sendcloud; },
      get stripe() { return connected.stripe; },
      get pushReady() { return connected.push; },
      get packlink() { return connected.packlink; },
      get email() { return connected.email; },
      hasSession: () => !!auth,
      async login({ email, password, remember }) {
        session.remember(!!remember);
        keep(await authRequest('token?grant_type=password', { email, password }));
        const isAdmin = await rest('rpc/is_admin', { method: 'POST', body: {} });
        if (!isAdmin) { await this.logout(); throw new Error('Aquest usuari no té permís per administrar la botiga.'); }
      },
      async logout() {
        if (auth) fetch(`${B.url}/auth/v1/logout`, { method: 'POST', headers: { apikey: B.key, Authorization: `Bearer ${auth.access_token}` } }).catch(() => {});
        auth = null; session.set(KEY, null); session.remember(false);
      },
      // Només comandes i pressupostos (per refrescar el panell sense tocar el catàleg).
      async loadLive() {
        const [orders, quotes] = await Promise.all([loadOrders(), rest('quotes?select=*&order=created_at.desc')]);
        return { orders, quotes: quotes.map(mapQuote) };
      },
      // ----- Avisos al mòbil (Web Push) -----
      push: {
        async key() {
          const r = await fetch(`${B.url}/functions/v1/botiga/push-key`, { headers: { apikey: B.key } });
          const d = await r.json().catch(() => ({}));
          if (!r.ok || !d.key) throw new Error(d.error || 'Els avisos encara no estan preparats al servidor.');
          return d.key;
        },
        async save(subscription, device) {
          const r = await fn('push-subscribe', { method: 'POST', body: { subscription, device } });
          if (r.status === 401) throw authError();
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'No s\'ha pogut activar l\'avís.');
        },
        async remove(endpoint) {
          await fn('push-unsubscribe', { method: 'POST', body: { endpoint } }).catch(() => {});
        },
        async test() {
          const r = await fn('push-test', { method: 'POST', body: {} });
          const d = await r.json().catch(() => ({}));
          if (r.status === 401) throw authError();
          if (!r.ok) throw new Error(d.error || 'No s\'ha pogut enviar l\'avís de prova.');
          return d;
        },
      },
      async loadAll() {
        const [catalog, orders, quotes, status] = await Promise.all([
          loadCatalog(), loadOrders(), rest('quotes?select=*&order=created_at.desc'),
          fn('status').then((r) => (r.ok ? r.json() : {})).catch(() => ({})), // funció encara no desplegada → res connectat
        ]);
        connected = { stripe: !!status.stripe, sendcloud: !!status.sendcloud, push: !!status.push, packlink: !!status.packlink, email: !!status.email };
        if (connected.sendcloud) {
          methodsError = '';
          methods = await fn('sendcloud-methods')
            .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) methodsError = d.error || 'Sendcloud no respon.'; return d.methods || []; })
            .catch(() => { methodsError = 'Sendcloud no respon.'; return []; });
        }
        return { catalog, orders, quotes: quotes.map(mapQuote) };
      },
      async markPaid(number) {
        const o = await rest('rpc/admin_mark_paid', { method: 'POST', body: { p_number: number } });
        return mapOrder(o);
      },
      async saveCatalog(draft, saved) {
        const c = cleanCatalog(draft);
        const now = new Date().toISOString();
        await rest('store?on_conflict=key', {
          method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
          body: [['config', c.config], ['categories', c.categories], ['home', c.home]].map(([key, value]) => ({ key, value, updated_at: now })),
        });
        if (c.products.length) {
          await rest('products?on_conflict=id', {
            method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
            body: c.products.map((p, i) => ({ id: p.id, position: i, status: p.status, data: p, updated_at: now })),
          });
        }
        const goneProducts = saved.products.map((p) => p.id).filter((id) => !c.products.some((p) => p.id === id));
        if (goneProducts.length) await rest(`products?id=${inList(goneProducts)}`, { method: 'DELETE' });
        if (c.announcements.length) {
          await rest('announcements?on_conflict=id', {
            method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
            body: c.announcements.map((a, i) => ({ id: a.id, position: i, active: a.active, data: a, updated_at: now })),
          });
        }
        const goneAnn = (saved.announcements || []).map((a) => a.id).filter((id) => !c.announcements.some((a) => a.id === id));
        if (goneAnn.length) await rest(`announcements?id=${inList(goneAnn)}`, { method: 'DELETE' });
        return loadCatalog();
      },
      async upload(file) {
        checkImage(file);
        const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[file.type];
        const name = `${Date.now().toString(36)}-${rand().toLowerCase()}.${ext}`;
        const res = await fetch(`${B.url}/storage/v1/object/imatges/${name}`, {
          method: 'POST', headers: { apikey: B.key, Authorization: `Bearer ${await token()}`, 'Content-Type': file.type, 'Cache-Control': '31536000' }, body: file,
        });
        if (res.status === 401) throw authError();
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'No s\'ha pogut pujar la imatge.');
        return `${B.url}/storage/v1/object/public/imatges/${name}`;
      },
      async setOrderStatus(number, status) {
        const [o] = await rest(`orders?number=eq.${encodeURIComponent(number)}`, { method: 'PATCH', body: { status }, prefer: 'return=representation' });
        return mapOrder(o);
      },
      // Cancel·la la comanda i, si és de targeta ja cobrada, la reemborsa a Stripe (funció "botiga").
      async cancelOrder(number) {
        const res = await fn('cancel', { method: 'POST', body: { number } });
        if (res.status === 401) throw authError();
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'No s\'ha pogut cancel·lar la comanda.');
        return { ...data, orders: await loadOrders() };
      },
      // Tots els preus que ofereixen ara els transportistes (Packlink) per a un destí i un paquet.
      async packlinkPrices(query) {
        const res = await fn('packlink-prices', { method: 'POST', body: query });
        if (res.status === 401) throw authError();
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'No s\'han pogut consultar els preus.');
        return data;
      },
      // Avisa el client per correu (només el primer cop de cada tipus): 'shipped' o 'delivered'.
      async notifyCustomer(number, kind) {
        const res = await fn('order-mail', { method: 'POST', body: { number, kind } });
        if (res.status === 401) throw authError();
        return res.json().catch(() => ({}));
      },
      async setQuoteStatus(ref, status) {
        const [q] = await rest(`quotes?ref=eq.${encodeURIComponent(ref)}`, { method: 'PATCH', body: { status }, prefer: 'return=representation' });
        return mapQuote(q);
      },
      // Amb Sendcloud connectat, etiquetes reals (funció "botiga");
      // si no, etiquetes de prova desades a la comanda.
      async createLabels(numbers) {
        if (connected.sendcloud) {
          const res = await fn('labels', { method: 'POST', body: { numbers } });
          const data = await res.json().catch(() => ({}));
          if (res.status === 401) throw authError();
          if (!res.ok) throw new Error(data.error || 'No s\'han pogut crear les etiquetes.');
          return { results: data.results, orders: await loadOrders() };
        }
        const results = [];
        for (const number of numbers) {
          const label = { provider: 'prova', carrier: 'PROVA', tracking: `TEST${rand()}${rand()}`, createdAt: new Date().toISOString() };
          try {
            await rest(`orders?number=eq.${encodeURIComponent(number)}&label=is.null`, { method: 'PATCH', body: { label }, prefer: 'return=minimal' });
            results.push({ number, ok: true });
          } catch (e) { if (e.auth) throw e; results.push({ number, ok: false, error: e.message }); }
        }
        return { results, orders: await loadOrders() };
      },
      async labelsDocument(numbers, sender) {
        const list = (await loadOrders()).filter((o) => numbers.includes(o.number) && o.label);
        if (!list.length) throw new Error('No hi ha etiquetes per imprimir.');
        const real = list.filter((o) => o.label.provider === 'sendcloud');
        if (!real.length) return new Blob([testLabelsHTML(list, sender)], { type: 'text/html' });
        if (real.length > 1) throw new Error('Les etiquetes de Sendcloud s\'imprimeixen totes juntes des del panell de Sendcloud, o d\'una en una des de cada comanda.');
        const res = await fn(`label?n=${encodeURIComponent(real[0].number)}`);
        if (res.status === 401) throw authError();
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'No s\'ha pogut descarregar l\'etiqueta.');
        return res.blob();
      },
      async markShipped(numbers) {
        await rest(`orders?number=${inList(numbers)}&status=in.(nova,pagada)`, { method: 'PATCH', body: { status: 'enviada' }, prefer: 'return=minimal' });
        return loadOrders();
      },
      // Seguiment posat a mà (qualsevol transportista). No toca les etiquetes de Sendcloud.
      async setTracking(number, { carrier, tracking, trackingUrl, ship }) {
        const t = String(tracking || '').trim().slice(0, 60);
        if (!t) throw new Error('Escriu el número de seguiment.');
        const url = String(trackingUrl || '').trim();
        if (url && !/^https:\/\/[^\s]+$/.test(url)) throw new Error('L\'enllaç de seguiment ha de començar per https://');
        const label = { provider: 'manual', carrier: String(carrier || '').trim().slice(0, 40), tracking: t, trackingUrl: url, createdAt: new Date().toISOString() };
        const body = ship ? { label, status: 'enviada' } : { label };
        const [o] = await rest(`orders?number=eq.${encodeURIComponent(number)}&or=(label.is.null,label->>provider.eq.manual,label->>provider.eq.prova)`, { method: 'PATCH', body, prefer: 'return=representation' });
        if (!o) throw new Error('Aquesta comanda ja té una etiqueta de Sendcloud.');
        return mapOrder(o);
      },
      async changePassword(current, next) {
        if (next.length < 10) throw new Error('La nova contrasenya ha de tenir com a mínim 10 caràcters.');
        try { await authRequest('token?grant_type=password', { email: auth.email, password: current }); } catch { throw new Error('La contrasenya actual no és correcta.'); }
        const res = await fetch(`${B.url}/auth/v1/user`, { method: 'PUT', headers: { apikey: B.key, Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: next }) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).msg || 'No s\'ha pogut canviar la contrasenya.');
      },
    };
  }

  // =====================================================================
  // Servidor local (fundicat/server.js)
  // =====================================================================
  function localBackend() {
    const KEY = 'fc.admin';
    let tok = session.get(KEY);
    async function api(path, { method = 'GET', body } = {}) {
      const res = await fetch(path, {
        method,
        headers: { Authorization: `Bearer ${tok}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 && path !== '/api/login') { tok = null; session.set(KEY, null); throw authError(); }
      if (!res.ok) throw new Error(data.error || 'Error del servidor.');
      return data;
    }
    let sendcloud = false;
    return {
      mode: 'local',
      needsEmail: false,
      get sendcloud() { return sendcloud; },
      hasSession: () => !!tok,
      async login({ password }) {
        const { token } = await api('/api/login', { method: 'POST', body: { password } });
        tok = token; session.set(KEY, tok);
      },
      async logout() {
        if (tok) fetch('/api/admin/logout', { method: 'POST', headers: { Authorization: `Bearer ${tok}` } }).catch(() => {});
        tok = null; session.set(KEY, null);
      },
      async loadAll() {
        const [catalog, orders, quotes, status] = await Promise.all([api('/api/admin/catalog'), api('/api/admin/orders'), api('/api/admin/quotes'), api('/api/admin/shipping/status').catch(() => ({}))]);
        sendcloud = !!status.sendcloud;
        return { catalog, orders, quotes };
      },
      async loadLive() {
        const [orders, quotes] = await Promise.all([api('/api/admin/orders'), api('/api/admin/quotes')]);
        return { orders, quotes };
      },
      pushReady: false,
      saveCatalog: (draft) => api('/api/admin/catalog', { method: 'PUT', body: draft }),
      async upload(file) {
        checkImage(file);
        const res = await fetch('/api/admin/upload', { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': file.type }, body: file });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) throw authError();
        if (!res.ok) throw new Error(data.error || 'No s\'ha pogut pujar la imatge.');
        return data.url;
      },
      notifyCustomer: async () => ({ sent: 0 }),
      cancelOrder: () => Promise.reject(new Error('Cancel·lar amb reemborsament només funciona amb Supabase.')),
      packlinkPrices: () => Promise.reject(new Error('Només funciona amb Supabase.')),
      setOrderStatus: (number, status) => api(`/api/admin/orders/${encodeURIComponent(number)}`, { method: 'PATCH', body: { status } }),
      markPaid: (number) => api(`/api/admin/orders/${encodeURIComponent(number)}`, { method: 'PATCH', body: { status: 'pagada' } }),
      stripe: false,
      setQuoteStatus: (ref, status) => api(`/api/admin/quotes/${encodeURIComponent(ref)}`, { method: 'PATCH', body: { status } }),
      createLabels: (numbers) => api('/api/admin/labels', { method: 'POST', body: { numbers } }),
      async labelsDocument(numbers) {
        const res = await fetch(`/api/admin/labels/print?n=${encodeURIComponent(numbers.join(','))}`, { headers: { Authorization: `Bearer ${tok}` } });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'No s\'han pogut obrir les etiquetes.');
        return res.blob();
      },
      markShipped: (numbers) => api('/api/admin/orders/shipped', { method: 'POST', body: { numbers } }),
      async setTracking() { throw new Error('El seguiment manual només funciona amb Supabase.'); },
      changePassword: (current, next) => api('/api/admin/password', { method: 'POST', body: { current, next } }),
    };
  }

  window.AdminBackend = B.type === 'supabase' ? supabaseBackend() : localBackend();
})();
