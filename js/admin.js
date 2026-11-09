// Panell d'administració. Treballa sobre una còpia del catàleg (draft): els
// canvis s'acumulen entre pantalles i es desen tots alhora, com a Shopify.
// Comandes i pressupostos es desen a l'instant (no formen part del catàleg).
(function () {
  const app = document.getElementById('app');
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const eur = (n) => new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
  const fmtDate = (iso) => new Date(iso).toLocaleString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 10)}`;
  const LANGS = [['es', 'Castellà'], ['en', 'Anglès'], ['it', 'Italià']];
  const ARTS = [['bag', 'Sac'], ['kit', 'Caixa'], ['crucible', 'Crisol'], ['flask', 'Flascó'], ['jar', 'Pot'], ['tongs', 'Pinces'], ['furnace', 'Forn'], ['ingot', 'Lingotera'], ['antler', 'Banya'], ['sepia', 'Os de sípia'], ['wood', 'Fusta'], ['horn', 'Plaques'], ['nacre', 'Nacre'], ['grain', 'Granalla'], ['wax', 'Cera'], ['goldleaf', "Fulla d'or"], ['damascus', "Barra d'acer"]];
  const ORDER_STATUS = { nova: ['Pendent de pagament', 'badge-warn'], pagada: ['Pagada', 'badge-ok'], enviada: ['Enviada', 'badge-ok'], lliurada: ['Lliurada', ''], 'cancel·lada': ['Cancel·lada', 'badge-bad'] };
  const QUOTE_STATUS = { nou: ['Nou', 'badge-info'], respost: ['Respost', 'badge-warn'], acceptat: ['Acceptat', 'badge-ok'], descartat: ['Descartat', 'badge-bad'] };

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { /* mode privat */ } },
  };

  const BE = window.AdminBackend; // capa de dades: Supabase o servidor local (js/admin-backend.js)
  let saved = null; // últim catàleg desat
  let draft = null; // còpia de treball
  let dirty = false;
  let orders = [];
  let quotes = [];
  const ui = { productFilter: 'all', productQuery: '', orderFilter: 'preparar', tab: {}, sec: {} };

  // Qualsevol error de sessió caducada torna a la pantalla d'accés.
  function handle(err) {
    if (err?.auth) { logout(true); return; }
    toast(err.message, true);
  }
  const upload = (file) => BE.upload(file);

  let toastTimer;
  function toast(msg, bad = false) {
    const el = $('.toast');
    el.textContent = msg; el.hidden = false; el.classList.toggle('is-bad', bad);
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 3200);
  }

  // ---------- App al mòbil ----------
  const isApp = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; $('#install-btn')?.removeAttribute('hidden'); });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    // En tocar un avís amb el panell ja obert: ves a la comanda i refresca.
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type !== 'obre') return;
      const u = new URL(e.data.url, location.href);
      if (u.hash) location.hash = u.hash;
      refreshLive(true);
    });
  }

  // ---------- Comandes al moment ----------
  // Cada minut (i en tornar a obrir l'app) es tornen a llegir comandes i
  // pressupostos. El catàleg no es toca, per no perdre canvis sense desar.
  let refreshing = false;
  async function refreshLive(force = false) {
    if (!draft || refreshing || !BE.loadLive) return;
    if (!force && document.visibilityState !== 'visible') return;
    refreshing = true;
    try {
      const before = new Set(orders.map((o) => `${o.number}:${o.status}`));
      const live = await BE.loadLive();
      const changed = live.orders.length !== orders.length || live.quotes.length !== quotes.length
        || live.orders.some((o) => !before.has(`${o.number}:${o.status}`))
        || live.quotes.some((q) => quotes.find((x) => x.ref === q.ref)?.status !== q.status);
      const fresh = live.orders.filter((o) => o.status === 'pagada' && !orders.some((x) => x.number === o.number && x.status === 'pagada'));
      orders = live.orders; quotes = live.quotes;
      if (!changed) return;
      const r = route();
      const editing = document.activeElement?.matches?.('input, textarea, select') && $('#main')?.contains(document.activeElement);
      if (['inici', 'comandes', 'seguiment', 'pressupostos'].includes(r.section) && !editing) render();
      else paintCounts();
      if (fresh.length) toast(fresh.length === 1 ? `Nova comanda pagada: ${fresh[0].number}` : `${fresh.length} comandes pagades noves`);
    } catch (err) {
      if (err?.auth) handle(err);
    } finally { refreshing = false; }
  }
  setInterval(refreshLive, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshLive(); });

  // ---------- Accés ----------
  const LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="5" y="5" width="54" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="5"/><path d="M15 13h20l-6 8h-8z" fill="currentColor"/><path d="M21 24h26v7H28v5h13v7H28v9h-7z" fill="currentColor"/></svg>';

  function showLogin(message = '') {
    app.innerHTML = `
      <div class="login">
        <form id="login" novalidate>
          <div class="brand">${LOGO} FUNDICAT</div>
          <div><h1>Administració</h1><p class="muted">Entra per gestionar la botiga.</p></div>
          ${BE.needsEmail ? '<label class="field"><span>Correu</span><input type="email" name="email" autocomplete="username" value="fundicatsl@gmail.com" required></label>' : ''}
          <label class="field"><span>Contrasenya</span><input type="password" name="password" autocomplete="current-password" required autofocus></label>
          ${BE.needsEmail ? `<label class="remember"><input type="checkbox" name="remember" ${isApp() ? 'checked' : ''}> Recorda'm en aquest dispositiu</label>` : ''}
          <p class="error" ${message ? '' : 'hidden'}>${esc(message)}</p>
          <button class="btn" type="submit" style="min-height:40px">Entra</button>
          <a href="/" class="small">← Torna a la botiga</a>
        </form>
      </div>`;
    $('#login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('button', e.target); btn.disabled = true;
      try {
        await BE.login({ email: e.target.email?.value.trim(), password: e.target.password.value, remember: !!e.target.remember?.checked });
        await boot();
      } catch (err) {
        btn.disabled = false;
        const p = $('.error'); p.textContent = err.message; p.hidden = false;
      }
    });
  }

  function logout(expired = false) {
    BE.logout();
    dirty = false;
    showLogin(expired ? 'La sessió ha caducat. Torna a entrar.' : '');
  }

  async function boot() {
    try {
      const { catalog, orders: ord, quotes: quo } = await BE.loadAll();
      saved = catalog; draft = clone(catalog); orders = ord; quotes = quo; dirty = false;
      if (!location.hash) location.hash = '#/inici';
      render();
    } catch (err) {
      showLogin(err.auth ? 'La sessió ha caducat. Torna a entrar.' : err.message);
    }
  }

  // ---------- Desar ----------
  function markDirty() {
    if (dirty) return;
    dirty = true;
    paintSavebar();
  }
  function paintSavebar() {
    const el = $('#savebar');
    if (!el) return;
    el.hidden = !dirty;
  }
  async function save() {
    const btn = $('#save'); btn.disabled = true; btn.textContent = 'Desant…';
    try {
      saved = await BE.saveCatalog(draft, saved);
      draft = clone(saved); dirty = false;
      toast('Canvis desats. Ja són visibles a la botiga.');
      render();
    } catch (err) {
      handle(err);
    } finally {
      btn.disabled = false; btn.textContent = 'Desa';
    }
  }
  function discard() {
    draft = clone(saved); dirty = false;
    const r = route();
    if (r.id && !findItem(r)) location.hash = `#/${r.section}`;
    render();
  }
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- Estructura ----------
  const ICONS = {
    inici: '<path d="M3 10.5L12 3l9 7.5V21h-6v-6H9v6H3z"/>',
    comandes: '<path d="M4 4h16v16H4zM4 9h16M9 9v11"/>',
    seguiment: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>',
    pressupostos: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
    productes: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/>',
    anuncis: '<path d="M4 10v4h3l6 4V6L7 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
    portada: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="8.5" r="1.5"/>',
    configuracio: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${ICONS[k]}</svg>`;

  function route() {
    const [section = 'inici', id] = location.hash.replace(/^#\/?/, '').split('/');
    return { section, id };
  }
  function findItem(r) {
    if (r.section === 'productes') return draft.products.find((p) => p.id === r.id);
    if (r.section === 'anuncis') return draft.announcements.find((a) => a.id === r.id);
    return null;
  }

  // Al menú: comandes pagades per preparar i pressupostos per respondre.
  const counts = () => ({ newOrders: orders.filter((o) => o.status === 'pagada').length, newQuotes: quotes.filter((q) => q.status === 'nou').length });
  function paintCounts() {
    const c = counts();
    [['comandes', c.newOrders], ['pressupostos', c.newQuotes]].forEach(([k, n]) => {
      const a = $(`.side a[href="#/${k}"]`);
      if (!a) return;
      $('.count', a)?.remove();
      if (n) a.insertAdjacentHTML('beforeend', `<span class="count">${n}</span>`);
    });
  }

  // Dies d'entrega per defecte perquè els camps de Configuració surtin plens.
  function fillShipDefaults() {
    draft.config.company = { name: "FUNDICAT SL", nif: "", address: "", registry: "", email: "fundicatsl@gmail.com", phone: "623 008 521", ...(draft.config.company || {}) };
    const s = draft.config.shipping || (draft.config.shipping = {});
    draft.config.cancel = { hours: 24, ...(draft.config.cancel || {}) };
    s.packlink = { enabled: false, marginPct: 0, marginFixed: 0, addVat: false, ...(s.packlink || {}) };
    s.packlink.box = { l: 30, w: 20, h: 15, ...(s.packlink.box || {}) };
    const SH = window.FundicatShipping;
    if (s.prepDays == null || s.prepDays === '') s.prepDays = SH.DEFAULT_PREP;
    (s.zones || []).forEach((z) => {
      if (!Array.isArray(z.days) || z.days.length !== 2) z.days = (SH.DEFAULT_DAYS[z.id] || [2, 5]).slice();
    });
  }

  function render() {
    if (!draft) return;
    const r = route();
    if (r.section === 'configuracio') fillShipDefaults();
    const { newOrders, newQuotes } = counts();
    const nav = (key, label, count) => `<a href="#/${key}" class="${r.section === key ? 'is-on' : ''}">${icon(key)}${label}${count ? `<span class="count">${count}</span>` : ''}</a>`;
    app.innerHTML = `
      <div class="savebar" id="savebar" ${dirty ? '' : 'hidden'}>
        <strong>Canvis sense desar</strong>
        <button class="btn btn-ghost" id="discard">Descarta</button>
        <button class="btn btn-save" id="save">Desa</button>
      </div>
      <header class="top">
        <button class="menu-toggle" aria-label="Menú" aria-expanded="false">☰</button>
        <span class="brand">${LOGO} FUNDICAT <small>Administració</small></span>
        <span class="spacer"></span>
        <a href="/" target="_blank" rel="noopener">Veure la botiga ↗</a>
        <button id="logout">Surt</button>
      </header>
      <div class="shell">
        <nav class="side" aria-label="Administració">
          ${nav('inici', 'Inici')}
          <p class="side-group">Vendes</p>
          ${nav('comandes', 'Comandes', newOrders)}
          ${nav('seguiment', 'Enviaments')}
          ${nav('pressupostos', 'Pressupostos', newQuotes)}
          <p class="side-group">Botiga</p>
          ${nav('productes', 'Productes')}
          ${nav('portada', 'Portada')}
          ${nav('anuncis', 'Anuncis')}
          <hr>
          ${nav('configuracio', 'Configuració')}
        </nav>
        <main class="main" id="main">${(VIEWS[r.section] || VIEWS.inici)(r.id)}</main>
      </div>`;
    $('#save').addEventListener('click', save);
    $('#discard').addEventListener('click', discard);
    $('#logout').addEventListener('click', () => {
      if (dirty && !confirm('Tens canvis sense desar. Vols sortir igualment?')) return;
      logout();
    });
    const side = $('.side');
    $('.menu-toggle').addEventListener('click', (e) => {
      const open = !side.classList.contains('is-open');
      side.classList.toggle('is-open', open); e.currentTarget.setAttribute('aria-expanded', String(open));
    });
    (BINDS[r.section] || (() => {}))(r.id);
  }
  window.addEventListener('hashchange', () => { if (draft) { render(); window.scrollTo(0, 0); } });

  // ---------- Utilitats de formulari ----------
  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
  function setPath(obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    keys.slice(0, -1).forEach((k) => { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k]; });
    o[keys[keys.length - 1]] = value;
  }
  const toParas = (v) => v.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const fromParas = (a) => (Array.isArray(a) ? a.join('\n\n') : '');

  // Enllaça els camps [data-f] d'un contenidor a un objecte del draft.
  function bindFields(root, target, onChange) {
    $$('[data-f]', root).forEach((el) => {
      const path = el.dataset.f;
      const type = el.dataset.type;
      const cur = getPath(target, path);
      if (el.type === 'checkbox') el.checked = !!cur;
      else if (type === 'paras') el.value = fromParas(cur);
      else if (type === 'percent') el.value = cur != null ? Math.round(cur * 1000) / 10 : '';
      else el.value = cur ?? '';
      el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', () => {
        let v = el.type === 'checkbox' ? el.checked : el.value;
        if (type === 'number') v = v === '' ? 0 : +v;
        if (type === 'percent') v = (+v || 0) / 100;
        if (type === 'paras') v = toParas(v);
        setPath(target, path, v);
        markDirty();
        onChange?.(path, v);
      });
    });
  }

  function bindTabs(root) {
    $$('[data-tabs]', root).forEach((tabs) => {
      const key = tabs.dataset.tabs;
      const show = (lang) => {
        ui.tab[key] = lang;
        $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.lang === lang)));
        $$(`[data-panel="${key}"]`, root).forEach((p) => { p.hidden = p.dataset.lang !== lang; });
      };
      $$('button', tabs).forEach((b) => b.addEventListener('click', () => show(b.dataset.lang)));
      show(ui.tab[key] || 'es');
    });
  }

  // Pestanyes d'apartat: amaguen els blocs [data-sec] que no toquen (els camps
  // continuen al document, així no es perd cap canvi en passar d'una a l'altra).
  const secTabs = (key, tabs) => {
    const cur = tabs.some(([k]) => k === ui.sec[key]) ? ui.sec[key] : tabs[0][0];
    return `<div class="sec-tabs" role="tablist" data-sec-tabs="${key}">${tabs.map(([k, label]) => `<button type="button" role="tab" data-sec-tab="${k}" aria-selected="${k === cur}">${label}</button>`).join('')}</div>`;
  };
  function bindSecTabs(root) {
    $$('[data-sec-tabs]', root).forEach((bar) => {
      const key = bar.dataset.secTabs;
      const show = (k) => {
        ui.sec[key] = k;
        $$('[data-sec-tab]', bar).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.secTab === k)));
        $$(`[data-sec^="${key}:"]`, root).forEach((el) => { el.hidden = !el.dataset.sec.split(' ').includes(`${key}:${k}`); });
      };
      $$('[data-sec-tab]', bar).forEach((b) => b.addEventListener('click', () => { show(b.dataset.secTab); window.scrollTo(0, 0); }));
      show($('[aria-selected="true"]', bar).dataset.secTab);
    });
  }

  function bindDrop(drop, onFiles) {
    const input = $('input[type=file]', drop);
    drop.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => { onFiles([...input.files]); input.value = ''; });
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('is-over'); onFiles([...e.dataTransfer.files]); });
  }

  const thumb = (p) => (p.images?.[0] ? `<img class="pthumb" src="${esc(p.images[0])}" alt="">` : `<span class="pthumb">${esc(p.name.slice(0, 2).toUpperCase())}</span>`);
  const statusBadge = (p) => (p.status === 'active' ? '<span class="badge badge-ok">Actiu</span>' : '<span class="badge">Esborrany</span>');
  const categoryName = (id) => draft.categories.find((c) => c.id === id)?.name || id;

  // ---------- Vistes ----------
  const VIEWS = {};
  const BINDS = {};

  VIEWS.inici = () => {
    const valid = orders.filter((o) => o.status !== 'cancel·lada');
    const sales = valid.reduce((s, o) => s + o.total, 0);
    const active = draft.products.filter((p) => p.status === 'active');
    const low = active.filter((p) => p.stock < 10).sort((a, b) => a.stock - b.stock);
    return `
      <div class="page">
        <div class="page-head"><h1>Inici</h1></div>
        <div class="kpis">
          <div class="kpi"><span>Vendes</span><b>${eur(sales)}</b><small>${valid.length} comandes</small></div>
          <a class="kpi" href="#/comandes" style="color:inherit;text-decoration:none"><span>Per preparar</span><b>${orders.filter((o) => o.status === 'pagada').length}</b><small>${orders.filter((o) => o.status === 'nova').length} pendents de pagament</small></a>
          <div class="kpi"><span>Pressupostos nous</span><b>${quotes.filter((q) => q.status === 'nou').length}</b><small>per respondre</small></div>
          <div class="kpi"><span>Productes actius</span><b>${active.length}</b><small>${draft.products.length - active.length} esborranys</small></div>
        </div>
        <div class="grid-2">
          <div class="card card-flush">
            <div class="toolbar"><h2 style="flex:1">Últimes comandes</h2><a href="#/comandes">Veure-les totes</a></div>
            ${orders.length ? ordersTable(orders.slice(0, 6), false) : '<div class="empty">Encara no hi ha comandes.</div>'}
          </div>
          <div class="col">
            <div class="card">
              <div class="card-head"><h2>Estoc baix</h2><a href="#/productes">Productes</a></div>
              ${low.length ? `<div class="checks">${low.slice(0, 6).map((p) => `<a href="#/productes/${esc(p.id)}" class="pname" style="color:inherit">${thumb(p)}<span>${esc(p.name)}<small>${esc(p.variant)} · <span class="low">${p.stock} u.</span></small></span></a>`).join('')}</div>` : '<p class="muted">Cap producte per sota de 10 unitats.</p>'}
            </div>
            <div class="card">
              <h2>Accions ràpides</h2>
              <a class="btn btn-ghost" href="#/productes/nou">Afegeix un producte</a>
              <a class="btn btn-ghost" href="#/anuncis/nou">Crea un anunci</a>
            </div>
          </div>
        </div>
      </div>`;
  };

  // ----- Productes -----
  VIEWS.productes = (id) => {
    if (id) return productEditor(id);
    const q = ui.productQuery.toLowerCase();
    const list = draft.products.filter((p) => (ui.productFilter === 'all' || p.status === ui.productFilter) && (!q || `${p.name} ${p.variant} ${p.sku}`.toLowerCase().includes(q)));
    const f = (key, label) => `<button data-filter="${key}" class="${ui.productFilter === key ? 'is-on' : ''}">${label}</button>`;
    return `
      <div class="page">
        <div class="page-head"><h1>Productes</h1><a class="btn" href="#/productes/nou">Afegeix un producte</a></div>
        <div class="card card-flush">
          <div class="toolbar">
            <div class="filters">${f('all', 'Tots')}${f('active', 'Actius')}${f('draft', 'Esborranys')}</div>
            <input type="search" id="pq" placeholder="Cerca per nom, variant o referència" value="${esc(ui.productQuery)}">
          </div>
          ${list.length ? `
          <table class="list">
            <thead><tr><th>Producte</th><th>Estat</th><th class="hide-sm">Categoria</th><th class="num">Estoc</th><th class="num">Preu</th></tr></thead>
            <tbody>${list.map((p) => `
              <tr data-href="#/productes/${esc(p.id)}">
                <td><a class="pname" href="#/productes/${esc(p.id)}" style="color:inherit;text-decoration:none">${thumb(p)}<span>${esc(p.name)}<small>${esc(p.variant)}</small></span></a></td>
                <td>${statusBadge(p)}</td>
                <td class="hide-sm">${esc(categoryName(p.category))}</td>
                <td class="num ${p.stock < 10 ? 'low' : ''}">${p.stock}</td>
                <td class="num">${eur(p.price)}</td>
              </tr>`).join('')}
            </tbody>
          </table>` : '<div class="empty">Cap producte coincideix amb la cerca.</div>'}
        </div>
      </div>`;
  };

  function productEditor(id) {
    const p = draft.products.find((x) => x.id === id);
    if (!p) return '<div class="page"><div class="empty">Aquest producte no existeix. <a href="#/productes">Torna als productes</a></div></div>';
    const others = draft.products.filter((x) => x.id !== p.id);
    const tr = (lang, f) => esc(getPath(p, `i18n.${lang}.${f}`) || '');
    return `
      <div class="page">
        <div class="page-head">
          <h1><a class="back" href="#/productes" aria-label="Torna als productes">←</a>${esc(p.name || 'Producte nou')} ${statusBadge(p)}</h1>
          ${p.status === 'active' && saved.products.some((x) => x.id === p.id) ? `<a class="btn btn-ghost" href="/#/producte/${esc(p.slug)}" target="_blank" rel="noopener">Veure a la botiga ↗</a>` : ''}
        </div>
        ${secTabs("prod", [["general", "General"], ["preu", "Preu i estoc"], ["enviament", "Enviament"], ["detalls", "Més detalls"], ["traduccions", "Traduccions"]])}
        <div class="grid-2">
          <div class="col">
            <section class="card" data-sec="prod:general">
              <label class="field"><span>Títol</span><input data-f="name" maxlength="200" required></label>
              <label class="field"><span>Variant</span><input data-f="variant" placeholder="5 kg, Acer · 40 cm…" maxlength="200"></label>
              <label class="field"><span>Resum</span><input data-f="short" maxlength="500"><small>Una frase. Surt sota el títol i a les cerques.</small></label>
              <label class="field"><span>Descripció</span><textarea data-f="description" data-type="paras" rows="6"></textarea><small>Separa els paràgrafs amb una línia en blanc.</small></label>
            </section>

            <section class="card" data-sec="prod:general">
              <div class="card-head"><h2>Multimèdia</h2><span class="muted small">La primera imatge és la principal</span></div>
              <div class="media-grid" id="media">
                ${(p.images || []).map((src, i) => `
                  <div class="media-item">
                    <img src="${esc(src)}" alt="Imatge ${i + 1}">
                    ${i === 0 ? '<span class="main-tag">Principal</span>' : ''}
                    <div class="tools">
                      ${i ? `<button type="button" data-main="${i}">Principal</button>` : ''}
                      <button type="button" data-del-img="${i}">Elimina</button>
                    </div>
                  </div>`).join('')}
                <div class="drop ${(p.images || []).length ? '' : 'wide'}" tabindex="0" role="button" aria-label="Afegeix imatges">
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple>
                  <span><b>Afegeix imatges</b><br>o arrossega-les aquí</span>
                  <span class="small">JPG, PNG o WebP · màx. 8 MB</span>
                </div>
              </div>
              ${(p.images || []).length ? '' : `<label class="field"><span>Il·lustració provisional</span><select data-f="art">${ARTS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select><small>Es mostra mentre no hi hagi cap foto.</small></label>`}
            </section>

            <section class="card" data-sec="prod:preu">
              <h2>Preu</h2>
              <div class="row">
                <label class="field"><span>Preu (IVA inclòs)</span><div class="prefix" data-suffix="€"><input data-f="price" data-type="number" type="number" min="0" step="0.01"></div></label>
                <div class="field"><span>Sense IVA</span><input class="inline-input" id="net" disabled></div>
              </div>
              <div class="card-head"><h3>Descomptes per volum</h3><button type="button" class="btn btn-plain" id="add-tier">+ Afegeix un tram</button></div>
              <div class="kv" id="tiers">
                ${(p.tiers || []).map((t) => tierRow(t)).join('') || '<p class="muted small" data-empty>Sense descomptes per volum.</p>'}
              </div>
            </section>

            <section class="card" data-sec="prod:preu">
              <h2>Inventari</h2>
              <div class="row">
                <label class="field"><span>Referència (SKU)</span><input data-f="sku" maxlength="80"></label>
                <label class="field"><span>Unitats en estoc</span><input data-f="stock" data-type="number" type="number" min="0" step="1"></label>
              </div>
            </section>

            <section class="card" data-sec="prod:enviament">
              <h2>Enviament</h2>
              <div class="row">
                <label class="field"><span>Pes amb embalatge</span><div class="prefix" data-suffix="kg"><input data-f="weight" data-type="number" type="number" min="0.05" step="0.05"></div><small>Amb el pes es calcula el preu d'enviament.</small></label>
                <div class="field"><span>&nbsp;</span><label style="display:flex;gap:8px;align-items:center;min-height:34px"><input type="checkbox" data-f="oversize"> Voluminós (va per agència)</label></div>
              </div>
              ${p.oversize ? '' : `<div class="row" style="grid-template-columns:repeat(3,1fr)">
                <label class="field"><span>Llarg</span><div class="prefix" data-suffix="cm"><input data-f="dims.l" data-type="number" type="number" min="0" step="0.5"></div></label>
                <label class="field"><span>Ample</span><div class="prefix" data-suffix="cm"><input data-f="dims.w" data-type="number" type="number" min="0" step="0.5"></div></label>
                <label class="field"><span>Alt</span><div class="prefix" data-suffix="cm"><input data-f="dims.h" data-type="number" type="number" min="0" step="0.5"></div></label>
              </div>
              <p class="muted small">Mides de la caixa amb què s'envia, per demanar preus als transportistes (Packlink). Si les deixes buides, es fa servir la caixa estàndard de Configuració.</p>`}
              ${p.oversize ? '<label class="field" style="max-width:240px"><span>Preu d\'enviament fix</span><div class="prefix" data-suffix="€"><input data-f="shipFixed" data-type="number" type="number" min="0" step="0.05"></div><small>No es crea etiqueta automàtica: la prepares tu.</small></label>' : ''}
            </section>

            <section class="card" data-sec="prod:detalls">
              <div class="card-head"><h2>Especificacions</h2><button type="button" class="btn btn-plain" id="add-spec">+ Afegeix</button></div>
              <div class="kv" id="specs">${Object.entries(p.specs || {}).map(([k, v]) => specRow(k, v)).join('') || '<p class="muted small" data-empty>Sense especificacions.</p>'}</div>
            </section>

            <section class="card" data-sec="prod:detalls">
              <h2>Es compren junts</h2>
              <p class="muted small">Fins a 6 productes. Surten a "Es compren junts sovint" i a les recomanacions.</p>
              <div class="checks" id="related">${others.map((o) => `<label><input type="checkbox" value="${esc(o.id)}" ${(p.related || []).includes(o.id) ? 'checked' : ''}> ${esc(o.name)} <span class="muted">${esc(o.variant)}</span></label>`).join('')}</div>
            </section>
            <section class="card" data-sec="prod:traduccions">
              <h2>Traduccions</h2>
              <p class="muted small">Si deixes un camp buit, es fa servir la traducció per defecte o el text en català.</p>
              <div class="tabs" data-tabs="p-tr" role="tablist">${LANGS.map(([l, n]) => `<button type="button" role="tab" data-lang="${l}">${n}</button>`).join('')}</div>
              ${LANGS.map(([l]) => `
                <div data-panel="p-tr" data-lang="${l}" class="col">
                  <label class="field"><span>Títol</span><input data-f="i18n.${l}.name" placeholder="${tr(l, 'name')}"></label>
                  <label class="field"><span>Variant</span><input data-f="i18n.${l}.variant"></label>
                  <label class="field"><span>Resum</span><input data-f="i18n.${l}.short"></label>
                  <label class="field"><span>Descripció</span><textarea data-f="i18n.${l}.description" data-type="paras" rows="4"></textarea></label>
                </div>`).join('')}
            </section>
          </div>

          <div class="col">
            <section class="card">
              <h2>Estat</h2>
              <select class="inline-input" data-f="status"><option value="active">Actiu (visible a la botiga)</option><option value="draft">Esborrany (ocult)</option></select>
            </section>
            <section class="card">
              <h2>Organització</h2>
              <label class="field"><span>Categoria</span><select data-f="category">${draft.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>
              <label class="field"><span>Etiqueta</span><input data-f="badge" placeholder="Més venut, Nou…" maxlength="40"></label>
              <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" data-f="exemple" style="width:auto;min-height:0"> <span>Marcar com a producte d'exemple</span></label>
            </section>
            <button type="button" class="btn btn-danger" id="delete">Elimina el producte</button>
          </div>
        </div>
      </div>`;
  }
  const specRow = (k = '', v = '') => `<div class="kv-row"><input class="inline-input" data-spec-k value="${esc(k)}" placeholder="Nom (p. ex. Pes)"><input class="inline-input" data-spec-v value="${esc(v)}" placeholder="Valor (p. ex. 5 kg)"><button type="button" class="icon-x" data-del-row aria-label="Elimina">✕</button></div>`;
  const tierRow = (t = { min: 5, off: 0.05 }) => `<div class="tier-row"><label class="field"><span class="small">A partir de (unitats)</span><input class="inline-input" type="number" min="2" step="1" data-tier-min value="${t.min}"></label><label class="field"><span class="small">Descompte</span><div class="prefix" data-suffix="%"><input class="inline-input" type="number" min="1" max="90" step="0.5" data-tier-off value="${Math.round(t.off * 1000) / 10}"></div></label><button type="button" class="icon-x" data-del-row aria-label="Elimina" style="align-self:end">✕</button></div>`;

  BINDS.productes = (id) => {
    if (!id) {
      $$('[data-filter]').forEach((b) => b.addEventListener('click', () => { ui.productFilter = b.dataset.filter; render(); }));
      const q = $('#pq');
      q.addEventListener('input', () => { ui.productQuery = q.value; const pos = q.selectionStart; render(); const n = $('#pq'); n.focus(); n.setSelectionRange(pos, pos); });
      $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', (e) => { if (!e.target.closest('a')) location.hash = tr.dataset.href; }));
      return;
    }
    if (id === 'nou') {
      const p = { id: uid('p'), name: 'Producte nou', variant: '', status: 'draft', price: 0, stock: 0, sku: '', category: draft.categories[0].id, art: 'bag', images: [], short: '', description: [], specs: {}, tiers: [], related: [], i18n: {} };
      draft.products.unshift(p);
      ui.sec.prod = "general";
      markDirty();
      location.replace(`#/productes/${p.id}`);
      return;
    }
    const p = draft.products.find((x) => x.id === id);
    if (!p) return;
    const main = $('#main');
    const net = () => { $('#net').value = eur(p.price / (1 + draft.config.vat)); };
    bindFields(main, p, (path) => {
      if (path === 'price') net();
      if (path === 'name') $('.page-head h1').childNodes[1].textContent = `${p.name || 'Producte nou'} `;
      if (path === 'status' || path === 'oversize') render();
    });
    net();
    bindTabs(main);
    bindSecTabs(main);

    // Imatges
    bindDrop($('.drop', main), async (files) => {
      for (const file of files) {
        try { p.images = [...(p.images || []), await upload(file)]; markDirty(); } catch (err) { handle(err); }
      }
      render();
    });
    $$('[data-main]', main).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.main; const [img] = p.images.splice(i, 1); p.images.unshift(img); markDirty(); render();
    }));
    $$('[data-del-img]', main).forEach((b) => b.addEventListener('click', () => {
      p.images.splice(+b.dataset.delImg, 1); markDirty(); render();
    }));

    // Especificacions i trams: es reconstrueixen a partir de les files.
    const readSpecs = () => {
      p.specs = Object.fromEntries($$('#specs .kv-row').map((r) => [$('[data-spec-k]', r).value.trim(), $('[data-spec-v]', r).value.trim()]).filter(([k]) => k));
      markDirty();
    };
    const readTiers = () => {
      p.tiers = $$('#tiers .tier-row').map((r) => ({ min: Math.max(2, +$('[data-tier-min]', r).value || 2), off: Math.min(0.9, (+$('[data-tier-off]', r).value || 0) / 100) })).filter((t) => t.off > 0).sort((a, b) => a.min - b.min);
      markDirty();
    };
    const wireRows = (box, read) => {
      box.addEventListener('input', read);
      box.addEventListener('click', (e) => { const x = e.target.closest('[data-del-row]'); if (x) { x.parentElement.remove(); read(); } });
    };
    wireRows($('#specs'), readSpecs);
    wireRows($('#tiers'), readTiers);
    $('#add-spec').addEventListener('click', () => { $('#specs [data-empty]')?.remove(); $('#specs').insertAdjacentHTML('beforeend', specRow()); $('#specs .kv-row:last-child input').focus(); });
    $('#add-tier').addEventListener('click', () => {
      $('#tiers [data-empty]')?.remove();
      const last = p.tiers?.[p.tiers.length - 1];
      $('#tiers').insertAdjacentHTML('beforeend', tierRow(last ? { min: last.min * 2, off: Math.min(0.9, last.off + 0.05) } : undefined));
      readTiers();
    });

    $('#related').addEventListener('change', (e) => {
      const ids = $$('#related input:checked').map((x) => x.value);
      if (ids.length > 6) { e.target.checked = false; toast('Màxim 6 productes.', true); return; }
      p.related = ids; markDirty();
    });

    $('#delete').addEventListener('click', () => {
      if (!confirm(`Vols eliminar "${p.name}"? Quan desis, desapareixerà de la botiga.`)) return;
      draft.products = draft.products.filter((x) => x.id !== p.id);
      draft.products.forEach((x) => { x.related = (x.related || []).filter((r) => r !== p.id); });
      markDirty();
      location.hash = '#/productes';
    });
  };

  // ----- Anuncis -----
  VIEWS.anuncis = (id) => {
    if (id) return announcementEditor(id);
    const list = draft.announcements;
    return `
      <div class="page page-narrow">
        <div class="page-head"><h1>Anuncis</h1><a class="btn" href="#/anuncis/nou">Crea un anunci</a></div>
        <p class="muted">La <b>barra superior</b> mostra un missatge curt a totes les pàgines (només el primer actiu). Els <b>bàners</b> surten a la portada, sota el producte destacat.</p>
        <div class="card card-flush">
          ${list.length ? `
          <table class="list">
            <thead><tr><th>Anunci</th><th>On surt</th><th class="num">Actiu</th></tr></thead>
            <tbody>${list.map((a) => `
              <tr data-href="#/anuncis/${esc(a.id)}">
                <td><a href="#/anuncis/${esc(a.id)}" style="color:inherit;font-weight:550">${esc(a.placement === 'bar' ? a.text : a.title) || '(sense text)'}</a>${a.placement === 'home' && a.subtitle ? `<br><span class="muted small">${esc(a.subtitle)}</span>` : ''}</td>
                <td><span class="badge ${a.placement === 'bar' ? 'badge-info' : 'badge-warn'}">${a.placement === 'bar' ? 'Barra superior' : 'Bàner de portada'}</span></td>
                <td class="num"><label class="switch" title="Actiu"><input type="checkbox" data-toggle="${esc(a.id)}" ${a.active ? 'checked' : ''} aria-label="Actiu"><span></span></label></td>
              </tr>`).join('')}
            </tbody>
          </table>` : '<div class="empty">No hi ha cap anunci. <a class="btn" href="#/anuncis/nou">Crea el primer</a></div>'}
        </div>
      </div>`;
  };

  function announcementEditor(id) {
    const a = draft.announcements.find((x) => x.id === id);
    if (!a) return '<div class="page"><div class="empty">Aquest anunci no existeix. <a href="#/anuncis">Torna als anuncis</a></div></div>';
    const isBar = a.placement === 'bar';
    const links = [['#/botiga', 'Botiga'], ['#/contacte', 'Contacte'], ...draft.services.map((sv) => [`#/servei/${sv.slug}`, `Servei: ${sv.name}`]), ...draft.products.filter((p) => p.status === 'active').map((p) => [`#/producte/${p.slug}`, `Producte: ${p.name} ${p.variant}`])];
    const fields = isBar ? [['text', 'Text']] : [['title', 'Títol'], ['subtitle', 'Subtítol'], ['cta', 'Text de l\'enllaç']];
    return `
      <div class="page page-narrow">
        <div class="page-head"><h1><a class="back" href="#/anuncis" aria-label="Torna als anuncis">←</a>${isBar ? 'Barra superior' : 'Bàner de portada'}</h1></div>
        <section class="card">
          <div class="status-row"><div><h2>Actiu</h2><p class="muted small">Quan desis, es mostrarà a la botiga.</p></div><label class="switch"><input type="checkbox" data-f="active" aria-label="Actiu"><span></span></label></div>
          <label class="field"><span>On surt</span><select data-f="placement"><option value="bar">Barra superior (totes les pàgines)</option><option value="home">Bàner de portada</option></select></label>
        </section>
        <section class="card">
          <h2>Contingut</h2>
          ${isBar
            ? '<label class="field"><span>Text</span><input data-f="text" maxlength="200" placeholder="Enviament gratuït a partir de 60 €"><small>Curt: una línia.</small></label>'
            : `<label class="field"><span>Títol</span><input data-f="title" maxlength="120"></label>
               <label class="field"><span>Subtítol</span><input data-f="subtitle" maxlength="240"></label>
               <label class="field"><span>Text de l'enllaç</span><input data-f="cta" maxlength="40" placeholder="Compra ara"></label>`}
          <label class="field"><span>Enllaç</span>
            <input data-f="link" list="links" placeholder="#/botiga o https://…">
            <datalist id="links">${links.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</datalist>
            <small>Tria una pàgina de la llista o enganxa una adreça.</small>
          </label>
        </section>
        ${isBar ? '' : `
        <section class="card">
          <h2>Imatge</h2>
          ${a.image ? `<div class="media-grid"><div class="media-item"><img src="${esc(a.image)}" alt="Imatge de l'anunci"><div class="tools"><button type="button" id="del-ann-img">Elimina</button></div></div></div>` : ''}
          <div class="drop wide" tabindex="0" role="button" aria-label="${a.image ? 'Canvia la imatge' : 'Afegeix una imatge'}">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif">
            <span><b>${a.image ? 'Canvia la imatge' : 'Afegeix una imatge'}</b> (opcional)</span>
          </div>
        </section>`}
        <section class="card">
          <h2>Traduccions</h2>
          <div class="tabs" data-tabs="a-tr" role="tablist">${LANGS.map(([l, n]) => `<button type="button" role="tab" data-lang="${l}">${n}</button>`).join('')}</div>
          ${LANGS.map(([l]) => `<div data-panel="a-tr" data-lang="${l}" class="col">${fields.map(([f, label]) => `<label class="field"><span>${label}</span><input data-f="i18n.${l}.${f}"></label>`).join('')}</div>`).join('')}
        </section>
        <button type="button" class="btn btn-danger" id="delete" style="justify-self:start">Elimina l'anunci</button>
      </div>`;
  }

  BINDS.anuncis = (id) => {
    if (!id) {
      $$('[data-toggle]').forEach((t) => {
        t.addEventListener('click', (e) => e.stopPropagation());
        t.addEventListener('change', () => { draft.announcements.find((a) => a.id === t.dataset.toggle).active = t.checked; markDirty(); });
      });
      $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', (e) => { if (!e.target.closest('a, label')) location.hash = tr.dataset.href; }));
      return;
    }
    if (id === 'nou') {
      const a = { id: uid('a'), placement: 'home', active: false, link: '#/botiga', image: '', text: '', title: 'Anunci nou', subtitle: '', cta: 'Més informació', i18n: {} };
      draft.announcements.push(a);
      markDirty();
      location.replace(`#/anuncis/${a.id}`);
      return;
    }
    const a = draft.announcements.find((x) => x.id === id);
    if (!a) return;
    const main = $('#main');
    bindFields(main, a, (path) => { if (path === 'placement') render(); });
    bindTabs(main);
    const drop = $('.drop', main);
    if (drop) {
      bindDrop(drop, async (files) => {
        if (!files[0]) return;
        try { a.image = await upload(files[0]); markDirty(); render(); } catch (err) { handle(err); }
      });
    }
    $('#del-ann-img')?.addEventListener('click', () => { a.image = ''; markDirty(); render(); });
    $('#delete').addEventListener('click', () => {
      if (!confirm('Vols eliminar aquest anunci?')) return;
      draft.announcements = draft.announcements.filter((x) => x.id !== a.id);
      markDirty();
      location.hash = '#/anuncis';
    });
  };

  // ----- Portada -----
  const DEFAULT_HERO = { heroTitle: 'Tot per fondre metall.', heroLead: 'Sorres, crisols, forns i peces a mida. Fet i enviat des de Manresa.' };

  VIEWS.portada = () => {
    const h = draft.home || {};
    const catThumb = (c) => {
      const p = draft.products.find((x) => x.category === c.id && x.status === 'active');
      if (c.image) return `<img class="pthumb" src="${esc(c.image)}" alt="">`;
      if (p?.images?.[0]) return `<img class="pthumb" src="${esc(p.images[0])}" alt="">`;
      return `<span class="pthumb">${esc(c.name.slice(0, 2).toUpperCase())}</span>`;
    };
    return `
      <div class="page page-narrow">
        <div class="page-head"><h1>Portada</h1><a class="btn btn-ghost" href="/" target="_blank" rel="noopener">Veure la portada ↗</a></div>

        <section class="card">
          <div class="card-head"><h2>Imatge principal</h2>${h.heroImage ? '<button type="button" class="btn btn-plain" id="hero-remove">Treu la foto</button>' : ''}</div>
          ${h.heroImage
            ? `<div class="hero-preview"><img src="${esc(h.heroImage)}" alt="Imatge principal"><div><b>${esc(h.heroTitle || DEFAULT_HERO.heroTitle)}</b><span>${esc(h.heroLead || DEFAULT_HERO.heroLead)}</span></div></div>`
            : '<p class="note">Ara es mostra la il·lustració de la colada. Si puges una foto, ocuparà tota la capçalera i el títol hi anirà a sobre.</p>'}
          <div class="drop wide" tabindex="0" role="button" aria-label="${h.heroImage ? 'Canvia la foto' : 'Puja una foto'}">
            <input type="file" accept="image/png,image/jpeg,image/webp" data-hero>
            <span><b>${h.heroImage ? 'Canvia la foto' : 'Puja una foto'}</b> o arrossega-la aquí</span>
            <span class="small">Foto horitzontal, d'almenys 2.000 px d'ample. Deixa espai a la part de dalt per al text.</span>
          </div>
        </section>

        <section class="card">
          <h2>Textos</h2>
          <label class="field"><span>Títol</span><input data-f="heroTitle" maxlength="120" placeholder="${esc(DEFAULT_HERO.heroTitle)}"><small>Buit = el títol per defecte.</small></label>
          <label class="field"><span>Subtítol</span><input data-f="heroLead" maxlength="300" placeholder="${esc(DEFAULT_HERO.heroLead)}"></label>
          <div class="tabs" data-tabs="h-tr" role="tablist">${LANGS.map(([l, n]) => `<button type="button" role="tab" data-lang="${l}">${n}</button>`).join('')}</div>
          ${LANGS.map(([l]) => `<div data-panel="h-tr" data-lang="${l}" class="col">
            <label class="field"><span>Títol</span><input data-f="i18n.${l}.heroTitle" maxlength="120"></label>
            <label class="field"><span>Subtítol</span><input data-f="i18n.${l}.heroLead" maxlength="300"></label>
          </div>`).join('')}
          <p class="muted small">Si no hi poses traducció, en aquell idioma es mostra el text per defecte.</p>
        </section>

        <section class="card card-flush">
          <div class="toolbar"><h2 style="flex:1">Imatges de categories</h2><span class="muted small">Si no n'hi ha, es fa servir la del primer producte</span></div>
          <table class="list">
            <tbody>${draft.categories.map((c) => `
              <tr style="cursor:default">
                <td><span class="pname">${catThumb(c)}<span>${esc(c.name)}${c.image ? '' : '<small>Imatge automàtica</small>'}</span></span></td>
                <td class="num">
                  <label class="btn btn-ghost">${c.image ? 'Canvia' : 'Puja una imatge'}<input type="file" accept="image/png,image/jpeg,image/webp" data-cat="${esc(c.id)}" hidden></label>
                  ${c.image ? `<button type="button" class="btn btn-plain" data-cat-remove="${esc(c.id)}">Treu</button>` : ''}
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </section>
        <p class="muted small">El bloc "Kit d'iniciació" de la portada només surt si hi ha un producte amb la referència interna <b>kit-inici</b>; si no, s'hi mostra "Peces a mida".</p>
      </div>`;
  };

  BINDS.portada = () => {
    draft.home = draft.home || {};
    const main = $('#main');
    bindFields(main, draft.home);
    bindTabs(main);
    bindDrop($('.drop', main), async (files) => {
      if (!files[0]) return;
      try { draft.home.heroImage = await upload(files[0]); markDirty(); render(); } catch (err) { handle(err); }
    });
    $('#hero-remove')?.addEventListener('click', () => { draft.home.heroImage = ''; markDirty(); render(); });
    $$('[data-cat]', main).forEach((input) => input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        draft.categories.find((c) => c.id === input.dataset.cat).image = await upload(file);
        markDirty(); render();
      } catch (err) { handle(err); }
    }));
    $$('[data-cat-remove]', main).forEach((b) => b.addEventListener('click', () => {
      draft.categories.find((c) => c.id === b.dataset.catRemove).image = '';
      markDirty(); render();
    }));
  };

  // ----- Comandes -----
  const PAID_HELP = {
    transfer: 'Quan rebis la transferència, marca-la com a pagada: es descomptarà l\'estoc i passarà a "Per preparar".',
    card: 'El client encara no ha completat el pagament amb targeta.',
  };
  const SHIP_NAMES = { home: 'Domicili', express: 'Express 24 h', pickup: 'Recollida al taller' };
  const isOpen = (o) => o.status === 'pagada'; // només es prepara el que està pagat
  const isPickup = (o) => o.delivery?.method === 'pickup';
  const isCarrier = (o) => o.delivery?.method === 'carrier'; // transportista triat pel client (Packlink)
  const shipOf = (o) => (isCarrier(o) ? (o.delivery.name || 'Transportista') : SHIP_NAMES[o.delivery?.method] || 'Domicili');
  const needsReview = (o) => !!o.delivery?.oversize;
  const toPrepare = () => orders.filter((o) => isOpen(o) && !isPickup(o));
  const toCollect = () => orders.filter((o) => isOpen(o) && isPickup(o));

  function shipCell(o) {
    if (isPickup(o)) return '<span class="badge badge-info">Recollida al taller</span>';
    const name = esc(shipOf(o));
    if (o.label) return `${name}<br><span class="small muted">${o.label.provider === 'prova' ? 'Etiqueta de prova' : esc(o.label.carrier)} · ${esc(o.label.tracking)}</span>`;
    if (needsReview(o)) return `${name}<br><span class="badge badge-warn">Revisar: voluminós</span>`;
    return `${name}<br><span class="badge">Sense etiqueta</span>`;
  }

  // Obre l'etiqueta (PDF o pàgina d'impressió) en una pestanya nova.
  async function printLabels(numbers) {
    const win = window.open('', '_blank'); // s'obre ara per evitar el bloquejador de finestres
    try {
      const url = URL.createObjectURL(await BE.labelsDocument(numbers, draft.config.shipping?.pickup?.address || 'Manresa'));
      if (win) win.location = url; else location.href = url;
    } catch (err) { win?.close(); handle(err); }
  }
  async function createLabels(numbers) {
    try {
      const { results, orders: fresh } = await BE.createLabels(numbers);
      orders = fresh;
      const bad = results.filter((r) => !r.ok);
      toast(bad.length ? `${results.length - bad.length} etiquetes creades. ${bad.length} amb error: ${bad[0].error}` : `${results.length} etiquetes creades.`, !!bad.length);
      render();
    } catch (err) { handle(err); }
  }
  async function markShipped(numbers) {
    try {
      orders = await BE.markShipped(numbers);
      toast(`${numbers.length} comandes marcades com a enviades.`);
      render();
    } catch (err) { handle(err); }
  }

  function ordersTable(list, withSelect = true) {
    return `
      <table class="list">
        <thead><tr><th>Comanda</th><th class="hide-sm">Data</th><th class="hide-xs">Client</th><th class="hide-sm">Enviament</th><th>Estat</th><th class="num">Total</th></tr></thead>
        <tbody>${list.map((o) => `
          <tr data-href="#/comandes/${esc(o.number)}">
            <td class="nowrap"><a href="#/comandes/${esc(o.number)}" style="font-weight:550">${esc(o.number)}</a><small class="show-xs muted">${esc(o.customer.name)}</small></td>
            <td class="hide-sm muted">${fmtDate(o.date)}</td>
            <td class="hide-xs">${esc(o.customer.name)}</td>
            <td class="hide-sm">${shipCell(o)}</td>
            <td>${withSelect ? statusSelect(o) : `<span class="badge ${ORDER_STATUS[o.status]?.[1] || ''}">${ORDER_STATUS[o.status]?.[0] || esc(o.status)}</span>`}</td>
            <td class="num">${eur(o.total)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }
  const statusSelect = (o) => `<select data-order-status="${esc(o.number)}" aria-label="Estat de ${esc(o.number)}">${Object.entries(ORDER_STATUS).map(([k, [l]]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;

  // Seguiment posat a mà: per quan l'envies amb un altre transportista (Correos, GLS, SEUR…).
  const trackingForm = (o) => {
    const l = o.label?.provider === 'manual' ? o.label : {};
    return `
      <form class="track-admin" data-track="${esc(o.number)}" autocomplete="off">
        <h3>Has enviat el paquet pel teu compte?</h3>
        <p class="muted small">Posa el transportista i el número de seguiment: el client el veurà a la pàgina «Segueix la teva comanda».</p>
        <div class="row">
          <label class="field"><span>Transportista</span><input name="carrier" maxlength="40" placeholder="Correos, GLS, SEUR…" value="${esc(l.carrier || '')}"></label>
          <label class="field"><span>Número de seguiment</span><input name="tracking" maxlength="60" required value="${esc(l.tracking || '')}"></label>
        </div>
        <label class="field"><span>Enllaç de seguiment (opcional)</span><input name="url" type="url" placeholder="https://…" value="${esc(l.trackingUrl || '')}"><small>Si el transportista et dona un enllaç directe, enganxa'l aquí perquè el client el pugui obrir.</small></label>
        <div class="row" style="gap:8px;justify-content:flex-start">
          <button type="submit" class="btn btn-ghost" data-ship="0">Desa el seguiment</button>
          ${o.status === 'pagada' || o.status === 'nova' ? '<button type="submit" class="btn" data-ship="1">Desa i marca com a enviada</button>' : ''}
        </div>
      </form>`;
  };

  VIEWS.comandes = (id) => {
    if (id) {
      const o = orders.find((x) => x.number === id);
      if (!o) return '<div class="page"><div class="empty">No s\'ha trobat la comanda. <a href="#/comandes">Torna a les comandes</a></div></div>';
      const c = o.customer;
      return `
        <div class="page">
          <div class="page-head"><h1><a class="back" href="#/comandes" aria-label="Torna a les comandes">←</a>${esc(o.number)} <span class="badge ${ORDER_STATUS[o.status]?.[1] || ''}">${ORDER_STATUS[o.status]?.[0] || ''}</span></h1><span class="muted">${fmtDate(o.date)}</span></div>
          <div class="grid-2">
            <div class="col">
              <section class="card">
                <h2>Productes</h2>
                <div class="lines">${o.lines.map((l) => `<div><span>${esc(l.name)} <span class="muted">${esc(l.variant)}</span><br><span class="muted small">${esc(l.sku)}</span></span><span class="muted">${l.qty} × ${eur(l.unit)}</span><b>${eur(l.total)}</b></div>`).join('')}</div>
                <div class="totals">
                  <div><span>Subtotal</span><span>${eur(o.subtotal)}</span></div>
                  <div><span>Enviament</span><span>${o.shipping ? eur(o.shipping) : 'Gratuït'}</span></div>
                  <div class="total"><span>Total</span><span>${eur(o.total)}</span></div>
                  <div class="muted small"><span>IVA inclòs</span><span>${eur(o.vat)}</span></div>
                </div>
              </section>
            </div>
            <div class="col">
              <section class="card">
                <h2>Estat</h2>
                ${statusSelect(o).replace('<select', '<select class="inline-input"')}
                <p class="muted small">Pagament: ${esc({ card: 'Targeta (Stripe)', bizum: 'Bizum', transfer: 'Transferència' }[o.method] || o.method)}${o.payment?.paidAt ? ` · cobrat el ${fmtDate(o.payment.paidAt)}` : ''}${o.payment?.paymentIntent ? ` · <a href="https://dashboard.stripe.com/payments/${esc(o.payment.paymentIntent)}" target="_blank" rel="noopener">veure a Stripe</a>` : ''}</p>
                ${o.status === 'nova' ? `<p class="muted small">${o.method === 'transfer' ? PAID_HELP.transfer : PAID_HELP.card}</p><button type="button" class="btn" data-paid="${esc(o.number)}">Marca com a pagada</button>` : ''}
                ${o.status === 'cancel·lada' ? `<p class="muted small">Cancel·lada${o.cancelledAt ? ` el ${fmtDate(o.cancelledAt)}` : ''}${o.cancelBy ? ` pel ${esc(o.cancelBy)}` : ''}.${o.refund?.amount ? ` Reemborsats ${eur(o.refund.amount)} al client.` : ''}${o.refund?.manual ? ' <b>Cal tornar els diners al client a mà</b> (no es va pagar amb targeta).' : ''}</p>` : ''}
                ${['nova', 'pagada'].includes(o.status) ? `<hr style="border:0;border-top:1px solid var(--line);margin:12px 0"><p class="muted small">${o.status === 'nova' ? 'Encara no està pagada: es cancel·la sense cap cost.' : o.method === 'card' && o.payment?.paymentIntent ? 'Reemborsa tot l\'import al client a Stripe i torna l\'estoc.' : 'No es va cobrar amb targeta: hauràs de tornar els diners a mà. L\'estoc es retorna.'}${o.label ? ' <b>Ja té etiqueta: avisa el transportista si ja l\'havies creat.</b>' : ''}</p><button type="button" class="btn btn-ghost" data-cancel-order="${esc(o.number)}">Cancel·la la comanda</button>` : ''}
              </section>
              <section class="card">
                <h2>Enviament</h2>
                <dl class="meta">
                  <div><dt>Opció</dt><dd>${esc(shipOf(o))}${o.delivery?.kg ? ` · ${o.delivery.kg} kg` : ''}</dd></div>
                  ${o.label ? `<div><dt>Seguiment</dt><dd>${/^https:\/\//.test(o.label.trackingUrl || '') ? `<a href="${esc(o.label.trackingUrl)}" target="_blank" rel="noopener">${esc(o.label.tracking)}</a>` : esc(o.label.tracking)}${o.label.provider === 'prova' ? ' <span class="badge">Prova</span>' : ''}</dd></div>` : ''}
                  ${o.carrierStatus ? `<div><dt>Transportista</dt><dd>${esc(o.carrierStatus)}</dd></div>` : ''}
                </dl>
                ${o.labelError ? `<p class="small low">Error en crear l'etiqueta automàtica: ${esc(o.labelError)}</p>` : ''}
                ${isCarrier(o) ? `<div class="notice"><p class="small"><b>El client ha triat ${esc(o.delivery.carrier || '')}${o.delivery.service ? ` · ${esc(o.delivery.service)}` : ''}</b> i ha pagat ${eur(o.shipping)} d'enviament.</p>
                  <p class="muted small">Crea l'enviament a Packlink PRO amb aquest transportista${o.delivery.packages?.[0] ? ` (paquet de ${esc(o.delivery.packages[0].length)} × ${esc(o.delivery.packages[0].width)} × ${esc(o.delivery.packages[0].height)} cm, ${esc(o.delivery.packages[0].weight)} kg)` : ''} i després desa aquí el número de seguiment.</p></div>` : ''}
                ${isPickup(o)
                  ? '<p class="muted small">El client la recull al taller: no cal etiqueta. Avisa\'l quan estigui a punt i marca-la com a lliurada.</p>'
                  : isCarrier(o) ? ''
                  : o.label
                    ? `<button type="button" class="btn btn-ghost" data-print="${esc(o.number)}">Imprimeix l'etiqueta</button>`
                    : `${needsReview(o) ? '<p class="muted small">Producte voluminós: comprova la caixa abans de crear l\'etiqueta.</p>' : ''}<button type="button" class="btn" data-label="${esc(o.number)}">Crea l'etiqueta</button>`}
                ${!isPickup(o) && o.status !== 'cancel·lada' && (!o.label || o.label.provider !== 'sendcloud') ? trackingForm(o) : ''}
              </section>
              <section class="card">
                <h2>Client</h2>
                <dl class="meta">
                  <div><dt>Nom</dt><dd>${esc(c.name)}</dd></div>
                  <div><dt>Correu</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd></div>
                  ${c.phone ? `<div><dt>Telèfon</dt><dd>${esc(c.phone)}</dd></div>` : ''}
                  ${c.nif ? `<div><dt>NIF</dt><dd>${esc(c.nif)}</dd></div>` : ''}
                  <div><dt>Adreça d'enviament</dt><dd>${esc(c.address)}<br>${esc(c.zip)} ${esc(c.city)}<br>${esc(c.country)}</dd></div>
                </dl>
              </section>
            </div>
          </div>
        </div>`;
    }
    const prep = toPrepare();
    const list = ui.orderFilter === 'preparar' ? prep
      : ui.orderFilter === 'recollir' ? toCollect()
        : orders.filter((o) => ui.orderFilter === 'all' || o.status === ui.orderFilter);
    const missing = prep.filter((o) => !o.label && !needsReview(o) && !isCarrier(o));
    const labelled = prep.filter((o) => o.label);
    return `
      <div class="page">
        <div class="page-head"><h1>Comandes</h1>${orders.length ? '<button type="button" class="btn btn-ghost" id="orders-csv">Descarrega-les (Excel)</button>' : ''}</div>
        ${ui.orderFilter === 'preparar' && prep.length ? `
        <div class="card prep-bar">
          <div><h2>Per preparar avui: ${prep.length}</h2><p class="muted small">1. Crea les etiquetes · 2. Imprimeix-les i enganxa-les · 3. Quan surtin del taller, marca-les com a enviades.</p></div>
          <div class="prep-actions">
            <button class="btn btn-ghost" data-bulk="label" ${missing.length ? '' : 'disabled'}>Crea les etiquetes (${missing.length})</button>
            <button class="btn btn-ghost" data-bulk="print" ${labelled.length ? '' : 'disabled'}>Imprimeix-les totes (${labelled.length})</button>
            <button class="btn" data-bulk="shipped" ${labelled.length ? '' : 'disabled'}>Marca-les com a enviades</button>
          </div>
        </div>` : ''}
        <div class="card card-flush">
          <div class="toolbar"><div class="filters">
            <button data-ofilter="preparar" class="${ui.orderFilter === 'preparar' ? 'is-on' : ''}">Per preparar${prep.length ? ` (${prep.length})` : ''}</button>
            <button data-ofilter="nova" class="${ui.orderFilter === 'nova' ? 'is-on' : ''}">Pendents de pagament${orders.filter((o) => o.status === 'nova').length ? ` (${orders.filter((o) => o.status === 'nova').length})` : ''}</button>
            <button data-ofilter="recollir" class="${ui.orderFilter === 'recollir' ? 'is-on' : ''}">Recollida al taller${toCollect().length ? ` (${toCollect().length})` : ''}</button>
            <button data-ofilter="all" class="${ui.orderFilter === 'all' ? 'is-on' : ''}">Totes</button>
            ${Object.entries(ORDER_STATUS).map(([k, [l]]) => `<button data-ofilter="${k}" class="${ui.orderFilter === k ? 'is-on' : ''}">${l}</button>`).join('')}
          </div></div>
          ${list.length ? ordersTable(list) : `<div class="empty">${ui.orderFilter === 'preparar' ? 'No hi ha res per preparar.' : 'No hi ha comandes amb aquest estat.'}</div>`}
        </div>
      </div>`;
  };

  async function updateOrderStatus(number, status) {
    try {
      const o = await BE.setOrderStatus(number, status);
      orders = orders.map((x) => (x.number === number ? o : x));
      toast(`${number}: ${ORDER_STATUS[status][0].toLowerCase()}.`);
      render();
    } catch (err) { handle(err); render(); }
  }
  const bindRows = () => $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', (e) => { if (!e.target.closest('a, select, label')) location.hash = tr.dataset.href; }));
  // Còpia de les comandes en un fitxer que s'obre amb Excel (separat per punts i coma).
  function downloadOrdersCsv() {
    const cell = (v) => {
      let s = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // que Excel no ho llegeixi com a fórmula
      return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const num = (n) => (Number(n) || 0).toFixed(2).replace('.', ',');
    const head = ['Comanda', 'Data', 'Estat', 'Pagament', 'Client', 'Correu', 'Telèfon', 'NIF', 'Adreça', 'CP', 'Població', 'País', 'Enviament', 'Productes', 'Subtotal', 'Enviament €', 'Total', 'IVA inclòs', 'Seguiment'];
    const rows = orders.map((o) => [
      o.number, new Date(o.date).toLocaleString('ca-ES'), ORDER_STATUS[o.status]?.[0] || o.status, { card: 'Targeta', transfer: 'Transferència' }[o.method] || o.method,
      o.customer?.name, o.customer?.email, o.customer?.phone, o.customer?.nif, o.customer?.address, o.customer?.zip, o.customer?.city, o.customer?.country,
      (o.delivery?.method ? shipOf(o) : ''), (o.lines || []).map((l) => `${l.qty} × ${l.name} ${l.variant || ''}`.trim()).join(' | '),
      num(o.subtotal), num(o.shipping), num(o.total), num(o.vat), o.label?.tracking || '',
    ]);
    const csv = `﻿${[head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `comandes-fundicat-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  BINDS.comandes = () => {
    $('#orders-csv')?.addEventListener('click', downloadOrdersCsv);
    $$('form[data-track]').forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ship = e.submitter?.dataset.ship === '1';
      const buttons = $$('button', f); buttons.forEach((b) => { b.disabled = true; });
      try {
        const o = await BE.setTracking(f.dataset.track, { carrier: f.carrier.value, tracking: f.tracking.value, trackingUrl: f.url.value, ship });
        orders = orders.map((x) => (x.number === o.number ? o : x));
        toast(ship ? `${o.number}: seguiment desat i comanda enviada.` : `${o.number}: seguiment desat.`);
        render();
      } catch (err) { handle(err); buttons.forEach((b) => { b.disabled = false; }); }
    }));
    $$('[data-paid]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm(`Confirmes que has rebut el pagament de ${b.dataset.paid}?`)) return;
      b.disabled = true;
      try {
        const o = await BE.markPaid(b.dataset.paid);
        orders = orders.map((x) => (x.number === o.number ? o : x));
        toast(`${o.number}: pagada. Ja és a "Per preparar".`);
        render();
      } catch (err) { handle(err); b.disabled = false; }
    }));
    $$('[data-cancel-order]').forEach((b) => b.addEventListener('click', async () => {
      const n = b.dataset.cancelOrder;
      if (!confirm(`Cancel·lar la comanda ${n}? Si ja estava cobrada amb targeta, es reemborsarà tot l'import al client. No es pot desfer.`)) return;
      b.disabled = true; b.textContent = 'Cancel·lant…';
      try {
        const r = await BE.cancelOrder(n);
        orders = r.orders;
        toast(r.manual ? `${n}: cancel·lada. Recorda tornar els diners al client.` : r.refunded ? `${n}: cancel·lada i reemborsats ${eur(r.refunded)}.` : `${n}: cancel·lada.`);
        render();
      } catch (err) { handle(err); b.disabled = false; b.textContent = 'Cancel·la la comanda'; }
    }));
    $$('[data-ofilter]').forEach((b) => b.addEventListener('click', () => { ui.orderFilter = b.dataset.ofilter; render(); }));
    $$('[data-label]').forEach((b) => b.addEventListener('click', () => { b.disabled = true; createLabels([b.dataset.label]); }));
    $$('[data-print]').forEach((b) => b.addEventListener('click', () => printLabels([b.dataset.print])));
    $$('[data-bulk]').forEach((b) => b.addEventListener('click', () => {
      const prep = toPrepare();
      if (b.dataset.bulk === 'label') { b.disabled = true; createLabels(prep.filter((o) => !o.label && !needsReview(o) && !isCarrier(o)).map((o) => o.number)); }
      if (b.dataset.bulk === 'print') printLabels(prep.filter((o) => o.label).map((o) => o.number));
      if (b.dataset.bulk === 'shipped') {
        const ready = prep.filter((o) => o.label).map((o) => o.number);
        if (confirm(`Marcar ${ready.length} comandes com a enviades?`)) markShipped(ready);
      }
    }));
    $$('[data-order-status]').forEach((s) => s.addEventListener('change', () => updateOrderStatus(s.dataset.orderStatus, s.value)));
    bindRows();
  };
  BINDS.inici = bindRows;

  // ----- Seguiment dels paquets -----
  // Dates previstes amb els dies d'entrega de Configuració (dies laborables, sense festius).
  const DAY_MS = 86400000;
  const dayLabel = (d) => d.toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  const daysAgo = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
  const agoText = (n) => (n === 0 ? 'avui' : n === 1 ? 'ahir' : `fa ${n} dies`);
  function trackInfo(o) {
    const zone = o.delivery?.zone || 'peninsula';
    const since = o.shippedAt || o.date;
    const e = window.FundicatShipping.eta(draft.config.shipping, zone, o.delivery?.method || 'home', null, new Date(since));
    const end = new Date(e.to); end.setHours(23, 59, 59, 999);
    return { since, from: e.from, to: e.to, late: Date.now() > end.getTime() };
  }
  const trackCell = (o) => {
    const l = o.label;
    if (!l || !l.tracking) return '<span class="muted small">Sense número</span>';
    const link = /^https:\/\//.test(l.trackingUrl || '') ? `<a href="${esc(l.trackingUrl)}" target="_blank" rel="noopener">${esc(l.tracking)}</a>` : esc(l.tracking);
    return `${l.provider === 'prova' ? '<span class="badge">Prova</span> ' : ''}${l.carrier && l.provider !== 'prova' ? `${esc(l.carrier)}<br>` : ''}<span class="small">${link}</span>`;
  };

  VIEWS.seguiment = () => {
    const sent = orders.filter((o) => o.status === 'enviada').map((o) => ({ o, i: trackInfo(o) })).sort((a, b) => new Date(a.i.since) - new Date(b.i.since));
    const late = sent.filter((x) => x.i.late);
    const waiting = orders.filter((o) => o.status === 'pagada' && !isPickup(o));
    const done = orders.filter((o) => o.status === 'lliurada' && Date.now() - new Date(o.deliveredAt || o.date).getTime() < 30 * DAY_MS)
      .sort((a, b) => new Date(b.deliveredAt || b.date) - new Date(a.deliveredAt || a.date));
    const head = '<tr><th>Comanda</th><th class="hide-sm">Transportista i seguiment</th><th>Sortida</th><th>Previst</th><th></th></tr>';
    return `
      <div class="page">
        <div class="page-head"><h1>Enviaments</h1></div>
        <div class="kpis">
          <div class="kpi"><span>En camí</span><b>${sent.length}</b></div>
          <div class="kpi"><span>Amb retard</span><b class="${late.length ? 'low' : ''}">${late.length}</b></div>
          <div class="kpi"><span>Pendents de sortir</span><b>${waiting.length}</b></div>
          <div class="kpi"><span>Lliurats (30 dies)</span><b>${done.length}</b></div>
        </div>
        <div class="card card-flush">
          <div class="toolbar"><h2 style="flex:1">En camí</h2><span class="muted small">Previsió amb els dies d'entrega de Configuració</span></div>
          ${sent.length ? `
          <table class="list">
            <thead>${head}</thead>
            <tbody>${sent.map(({ o, i }) => `
              <tr data-href="#/comandes/${esc(o.number)}">
                <td class="nowrap"><a href="#/comandes/${esc(o.number)}" style="font-weight:550">${esc(o.number)}</a><small class="muted" style="display:block">${esc(o.customer.name)}${o.customer.city ? ` · ${esc(o.customer.city)}` : ''}</small></td>
                <td class="hide-sm">${trackCell(o)}${o.carrierStatus ? `<br><span class="muted small">${esc(o.carrierStatus)}</span>` : ''}</td>
                <td class="nowrap">${dayLabel(new Date(i.since))}<small class="muted" style="display:block">${agoText(daysAgo(i.since))}</small></td>
                <td class="nowrap">${i.from.toDateString() === i.to.toDateString() ? dayLabel(i.to) : `${dayLabel(i.from)} – ${dayLabel(i.to)}`}${i.late ? '<br><span class="badge badge-bad">Amb retard</span>' : ''}</td>
                <td class="num"><button type="button" class="btn btn-ghost" data-deliver="${esc(o.number)}">Lliurada</button></td>
              </tr>`).join('')}
            </tbody>
          </table>` : '<div class="empty">Ara mateix no hi ha cap paquet en camí.</div>'}
        </div>
        ${waiting.length ? `
        <div class="card card-flush">
          <div class="toolbar"><h2 style="flex:1">Pagades, pendents de sortir</h2></div>
          <table class="list">
            <thead><tr><th>Comanda</th><th>Client</th><th>Pagada</th></tr></thead>
            <tbody>${waiting.map((o) => `
              <tr data-href="#/comandes/${esc(o.number)}">
                <td><a href="#/comandes/${esc(o.number)}" style="font-weight:550">${esc(o.number)}</a></td>
                <td>${esc(o.customer.name)}</td>
                <td class="nowrap">${agoText(daysAgo(o.payment?.paidAt || o.date))}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}
        ${done.length ? `
        <div class="card card-flush">
          <div class="toolbar"><h2 style="flex:1">Lliurades els últims 30 dies</h2></div>
          <table class="list">
            <thead><tr><th>Comanda</th><th>Client</th><th>Lliurada</th></tr></thead>
            <tbody>${done.map((o) => `
              <tr data-href="#/comandes/${esc(o.number)}">
                <td><a href="#/comandes/${esc(o.number)}" style="font-weight:550">${esc(o.number)}</a></td>
                <td>${esc(o.customer.name)}</td>
                <td class="nowrap">${dayLabel(new Date(o.deliveredAt || o.date))}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}
      </div>`;
  };
  BINDS.seguiment = () => {
    $$('[data-deliver]').forEach((b) => b.addEventListener('click', () => { b.disabled = true; updateOrderStatus(b.dataset.deliver, 'lliurada'); }));
    bindRows();
  };

  // ----- Pressupostos -----
  VIEWS.pressupostos = () => {
    const svc = (id) => draft.services.find((s) => s.id === id)?.name || id || '—';
    return `
      <div class="page">
        <div class="page-head"><h1>Pressupostos</h1></div>
        <div class="card card-flush">
          ${quotes.length ? `
          <table class="list">
            <thead><tr><th>Ref.</th><th>Client</th><th>Petició</th><th class="hide-sm">Servei</th><th>Estat</th></tr></thead>
            <tbody>${quotes.map((q) => `
              <tr style="cursor:default">
                <td><b>${esc(q.ref)}</b><br><span class="muted small">${fmtDate(q.date)}</span></td>
                <td>${esc(q.name)}<br><a href="mailto:${esc(q.email)}?subject=${encodeURIComponent(`Pressupost ${q.ref} · Fundicat`)}" class="small">${esc(q.email)}</a></td>
                <td>${esc(q.part)}${q.qty ? ` <span class="muted">· ${esc(q.qty)} u.</span>` : ''}${q.notes ? `<br><span class="muted small">${esc(q.notes)}</span>` : ''}</td>
                <td class="hide-sm">${esc(svc(q.service))}</td>
                <td><select data-quote-status="${esc(q.ref)}" aria-label="Estat de ${esc(q.ref)}">${Object.entries(QUOTE_STATUS).map(([k, [l]]) => `<option value="${k}" ${q.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
              </tr>`).join('')}
            </tbody>
          </table>` : '<div class="empty">Encara no hi ha sol·licituds de pressupost.</div>'}
        </div>
        <p class="muted small">Els plànols adjunts encara no es guarden: quan hi hagi correu configurat, arribaran per correu amb la sol·licitud.</p>
      </div>`;
  };
  BINDS.pressupostos = () => {
    $$('[data-quote-status]').forEach((s) => s.addEventListener('change', async () => {
      try {
        const q = await BE.setQuoteStatus(s.dataset.quoteStatus, s.value);
        quotes = quotes.map((x) => (x.ref === q.ref ? q : x));
        toast(`${q.ref}: ${QUOTE_STATUS[q.status][0].toLowerCase()}.`);
        render();
      } catch (err) { handle(err); }
    }));
  };

  // ----- Configuració -----
  VIEWS.configuracio = () => `
    <div class="page page-narrow">
      <div class="page-head"><h1>Configuració</h1></div>
      ${secTabs("cfg", [["enviaments", "Enviaments"], ["pagaments", "Pagaments i impostos"], ["empresa", "Empresa"], ["connexions", "Connexions i avisos"], ["compte", "Compte"]])}
      <section class="card" id="mobil" data-sec="cfg:connexions">
        <h2>Avisos i app al mòbil</h2>
        <p class="muted small">Rep un avís en aquest dispositiu cada vegada que entri una comanda pagada, una comanda per transferència o una petició de pressupost. Activa'ls a cada mòbil o ordinador on els vulguis rebre.</p>
        <div id="push-box"><p class="muted small">Comprovant…</p></div>
        <div class="install-box">
          <strong>Panell a la pantalla d'inici</strong>
          ${isApp() ? '<p class="small"><span class="badge badge-ok">Instal·lat</span> Ja l\'estàs fent servir com a app.</p>' : `
          <p class="muted small">${isIOS()
            ? 'A l\'iPhone: obre aquesta pàgina amb <b>Safari</b>, toca <b>Compartir</b> (el quadrat amb la fletxa) i després <b>Afegeix a la pantalla d\'inici</b>. A l\'iPhone, els avisos només funcionen des de l\'app instal·lada.'
            : 'A l\'Android: menú <b>⋮</b> de Chrome → <b>Instal·la l\'aplicació</b> o <b>Afegeix a la pantalla d\'inici</b>. A l\'ordinador: la icona d\'instal·lar de la barra d\'adreces.'}</p>
          <button class="btn btn-ghost" id="install-btn" type="button" ${installPrompt ? '' : 'hidden'}>Instal·la el panell</button>`}
        </div>
      </section>
      <section class="card" data-sec="cfg:connexions">
        <h2>Connexions</h2>
        <dl class="meta">
          <div><dt>Pagaments amb targeta (Stripe)</dt><dd>${BE.stripe ? '<span class="badge badge-ok">Connectat</span>' : '<span class="badge">No connectat</span> <span class="muted small">Les comandes amb targeta queden pendents de pagament.</span>'}</dd></div>
          <div><dt>Etiquetes d'enviament (Sendcloud)</dt><dd>${!BE.sendcloud ? '<span class="badge">No connectat</span> <span class="muted small">Les etiquetes són de prova.</span>'
            : BE.sendcloudError ? `<span class="badge badge-bad">Error</span> <span class="small">${esc(BE.sendcloudError)}</span>`
            : '<span class="badge badge-ok">Connectat</span>'}</dd></div>
        </dl>
        ${BE.sendcloud ? (() => {
          const list = (BE.sendcloudMethods || []).filter((m) => m.spain && m.id !== 8);
          const pick = (f) => (list.length
            ? `<select data-f="${f}"><option value="">Tria un servei…</option>${list.map((m) => `<option value="${m.id}">${esc(m.name)} (${m.minKg}–${m.maxKg} kg)</option>`).join('')}</select>`
            : `<input data-f="${f}" inputmode="numeric" placeholder="Número del servei">`);
          return `<div class="row">
          <label class="field"><span>Servei de Sendcloud: domicili</span>${pick('config.shipping.sendcloud.methodHome')}<small>El transportista que farà servir cada etiqueta normal.</small></label>
          <label class="field"><span>Servei de Sendcloud: express</span>${pick('config.shipping.sendcloud.methodExpress')}<small>Per a les comandes amb enviament express.</small></label>
        </div>`;
        })() : ''}
      </section>
      <section class="card card-flush" data-sec="cfg:enviaments">
        <div class="toolbar"><h2 style="flex:1">Tarifes d'enviament</h2><span class="muted small">IVA inclòs · per pes total de la comanda</span></div>
        <div style="overflow-x:auto">
          <table class="list ship-table">
            <thead><tr><th>Zona</th><th>Fins a 2 kg</th><th>5 kg</th><th>10 kg</th><th>20 kg</th><th>30 kg</th><th>Gratuït des de</th><th>Express +</th></tr></thead>
            <tbody>${(draft.config.shipping.zones || []).map((z, i) => `
              <tr style="cursor:default">
                <td><label style="display:flex;gap:8px;align-items:center;font-weight:550;white-space:nowrap"><input type="checkbox" data-f="config.shipping.zones.${i}.enabled"> ${esc(z.name)}</label></td>
                ${[0, 1, 2, 3, 4].map((j) => `<td><input class="inline-input" data-f="config.shipping.zones.${i}.rates.${j}" data-type="number" type="number" min="0" step="0.05" aria-label="${esc(z.name)}, tram ${j + 1}"></td>`).join('')}
                <td><input class="inline-input" data-f="config.shipping.zones.${i}.freeFrom" data-type="number" type="number" min="0" step="1" aria-label="${esc(z.name)}, gratuït a partir de"></td>
                <td><input class="inline-input" data-f="config.shipping.zones.${i}.express" data-type="number" type="number" min="0" step="0.5" aria-label="${esc(z.name)}, suplement express"></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div style="padding:12px 16px;display:grid;gap:10px">
          <p class="muted small">"Gratuït des de" a 0 vol dir que mai és gratuït. "Express +" a 0 vol dir que no s'ofereix. Els forns i equips voluminosos tenen un preu fix a la seva fitxa.</p>
          <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-f="config.shipping.pickup.enabled"> Oferir recollida gratuïta al taller</label>
          ${BE.sendcloud ? '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-f="config.shipping.autoLabel"> Crear les etiquetes automàticament quan entra una comanda</label>' : '<p class="muted small">Les etiquetes automàtiques i reals s\'activaran quan connectem Sendcloud. Mentrestant, les etiquetes són de prova.</p>'}
        </div>
      </section>
      <section class="card" data-sec="cfg:enviaments">
        <h2>Transportistes amb preu real (Packlink)</h2>
        <p class="muted small">Quan s'activa, el client veu al pagament els transportistes disponibles per a la seva adreça, amb el preu real de cadascun, i tria el que vol. Si Packlink no respon, la botiga fa servir les tarifes fixes de més amunt.</p>
        <dl class="meta"><div><dt>Connexió amb Packlink</dt><dd>${BE.packlink ? '<span class="badge badge-ok">Clau configurada</span>' : '<span class="badge">No connectat</span> <span class="muted small">Falta la clau <code>PACKLINK_API_KEY</code> a Supabase → Edge Functions → Secrets.</span>'}</dd></div></dl>
        <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-f="config.shipping.packlink.enabled"> Mostrar al client els transportistes i els seus preus</label>
        <div class="row">
          <label class="field"><span>Marge sobre el preu del transportista</span><div class="prefix" data-suffix="%"><input data-f="config.shipping.packlink.marginPct" data-type="number" type="number" min="0" max="100" step="1"></div></label>
          <label class="field"><span>Més un import fix</span><div class="prefix" data-suffix="€"><input data-f="config.shipping.packlink.marginFixed" data-type="number" type="number" min="0" max="50" step="0.05"></div><small>Per cobrir embalatge i gestió. Tot a 0 = el client paga exactament el que cobra Packlink.</small></label>
        </div>
        <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-f="config.shipping.packlink.addVat"> Els preus de Packlink no porten IVA: afegir-hi el 21%</label>
        <p class="muted small">Caixa estàndard, per als productes que no tenen mides pròpies:</p>
        <div class="row" style="grid-template-columns:repeat(3,1fr)">
          <label class="field"><span>Llarg</span><div class="prefix" data-suffix="cm"><input data-f="config.shipping.packlink.box.l" data-type="number" type="number" min="1" max="300" step="0.5"></div></label>
          <label class="field"><span>Ample</span><div class="prefix" data-suffix="cm"><input data-f="config.shipping.packlink.box.w" data-type="number" type="number" min="1" max="300" step="0.5"></div></label>
          <label class="field"><span>Alt</span><div class="prefix" data-suffix="cm"><input data-f="config.shipping.packlink.box.h" data-type="number" type="number" min="1" max="300" step="0.5"></div></label>
        </div>
      </section>
      <section class="card" data-sec="cfg:enviaments">
        <h2>Preus dels transportistes</h2>
        <p class="muted small">Consulta ara mateix què cobra cada transportista per portar un paquet a un destí. Serveix per comprovar els marges, veure si el preu porta IVA i saber quin és el més barat o el més ràpid.</p>
        ${BE.packlink ? `<form id="pl-form" class="row" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));align-items:end" novalidate>
          <label class="field"><span>País</span><select name="country" class="inline-input">${['Espanya', 'Portugal', 'Itàlia', 'França', 'Alemanya'].map((c) => `<option>${c}</option>`).join('')}</select></label>
          <label class="field"><span>Codi postal</span><input name="zip" class="inline-input" value="08001" maxlength="10"></label>
          <label class="field"><span>Pes (kg)</span><input name="kg" class="inline-input" type="number" min="0.1" max="70" step="0.1" value="5.2"></label>
          <label class="field"><span>Mides (cm)</span><input name="dims" class="inline-input" value="${esc(`${draft.config.shipping.packlink.box.l}x${draft.config.shipping.packlink.box.w}x${draft.config.shipping.packlink.box.h}`)}" placeholder="26x17x12"></label>
          <button class="btn" type="submit">Consulta els preus</button>
        </form><div id="pl-result" aria-live="polite" style="margin-top:12px"></div>` : '<p class="muted small">Cal connectar Packlink abans (clau <code>PACKLINK_API_KEY</code> a Supabase).</p>'}
      </section>
      <section class="card card-flush" data-sec="cfg:enviaments">
        <div class="toolbar"><h2 style="flex:1">Dies d'entrega</h2><span class="muted small">Dies laborables (dilluns a divendres)</span></div>
        <div style="padding:12px 16px;display:grid;gap:12px">
          <p class="muted small">Es fan servir per dir al client la data estimada d'entrega a la fitxa del producte, al pagament i a la pàgina de seguiment. Són una estimació, no una garantia: ajusta-les a com triguen els teus enviaments de debò.</p>
          <label class="field" style="max-width:320px"><span>Dies per preparar la comanda al taller</span><input class="inline-input" type="number" min="0" max="10" step="1" data-f="config.shipping.prepDays" data-type="number"><small>0 si surt el mateix dia.</small></label>
          <div style="overflow-x:auto">
            <table class="list ship-table">
              <thead><tr><th>Zona</th><th>Trànsit: mínim</th><th>màxim</th></tr></thead>
              <tbody>${(draft.config.shipping.zones || []).map((z, i) => `
                <tr style="cursor:default">
                  <td style="font-weight:550;white-space:nowrap">${esc(z.name)}</td>
                  <td><input class="inline-input" data-f="config.shipping.zones.${i}.days.0" data-type="number" type="number" min="1" max="30" step="1" aria-label="${esc(z.name)}, dies mínims"></td>
                  <td><input class="inline-input" data-f="config.shipping.zones.${i}.days.1" data-type="number" type="number" min="1" max="30" step="1" aria-label="${esc(z.name)}, dies màxims"></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <p class="muted small">L'enviament express sempre es calcula a 1 dia de trànsit.</p>
        </div>
      </section>
      <section class="card" data-sec="cfg:empresa">
        <h2>Dades de l'empresa</h2>
        <p class="muted small">Surten a l'Avís legal, la Política de privadesa i les Condicions de venda de la botiga. La llei obliga a mostrar el NIF i el domicili.</p>
        ${draft.config.company?.nif && draft.config.company?.address ? '' : '<div class="note">Falten el NIF o el domicili: ara a les pàgines legals hi surt «(pendent)».</div>'}
        <div class="row">
          <label class="field"><span>Raó social</span><input data-f="config.company.name" maxlength="120"></label>
          <label class="field"><span>NIF</span><input data-f="config.company.nif" maxlength="20" placeholder="B00000000"></label>
        </div>
        <label class="field"><span>Domicili fiscal</span><input data-f="config.company.address" maxlength="200" placeholder="Carrer, número, codi postal i població"></label>
        <label class="field"><span>Dades del Registre Mercantil</span><input data-f="config.company.registry" maxlength="200" placeholder="Inscrita al Registre Mercantil de Barcelona, tom …, foli …, full …"><small>Opcional, però recomanat per a una SL. Surt a l'escriptura o a la gestoria.</small></label>
        <div class="row">
          <label class="field"><span>Correu de contacte</span><input data-f="config.company.email" type="email" maxlength="120"></label>
          <label class="field"><span>Telèfon</span><input data-f="config.company.phone" maxlength="30"></label>
        </div>
      </section>
      <section class="card" data-sec="cfg:compte">
        <h2>Contrasenya del panell</h2>
        <form id="pw-form" class="col" autocomplete="off">
          <label class="field"><span>Contrasenya actual</span><input type="password" name="current" autocomplete="current-password" required></label>
          <div class="row">
            <label class="field"><span>Contrasenya nova</span><input type="password" name="next" autocomplete="new-password" minlength="10" required><small>Mínim 10 caràcters.</small></label>
            <label class="field"><span>Repeteix-la</span><input type="password" name="repeat" autocomplete="new-password" minlength="10" required></label>
          </div>
          <button class="btn" type="submit" style="justify-self:start">Canvia la contrasenya</button>
        </form>
      </section>
      <section class="card" data-sec="cfg:pagaments">
        <h2>Transferències</h2>
        <p class="muted small">Es mostren al client quan tria pagar per transferència.</p>
        <div class="row">
          <label class="field"><span>IBAN</span><input data-f="config.bank.iban" placeholder="ES00 0000 0000 0000 0000 0000" maxlength="40"></label>
          <label class="field"><span>Titular</span><input data-f="config.bank.holder" placeholder="Fundicat SL" maxlength="80"></label>
        </div>
      </section>
      <section class="card" data-sec="cfg:pagaments">
        <h2>Cancel·lacions</h2>
        <p class="muted small">El client pot cancel·lar ell mateix des de la pàgina de Seguiment, amb un botó, mentre la comanda no tingui etiqueta ni hagi sortit, i dins d'aquest termini després de pagar. Si ho fa, es reemborsa tot l'import a la targeta i et surt un avís al mòbil. Tu pots cancel·lar qualsevol comanda no enviada des de la fitxa de la comanda.</p>
        <label class="field" style="max-width:260px"><span>Termini per cancel·lar després de pagar</span><div class="prefix" data-suffix="hores"><input data-f="config.cancel.hours" data-type="number" type="number" min="1" max="720" step="1"></div><small>24 = un dia. Les comandes sense pagar sempre es poden cancel·lar.</small></label>
      </section>
      <section class="card" data-sec="cfg:pagaments">
        <h2>Impostos</h2>
        <label class="field" style="max-width:220px"><span>IVA</span><div class="prefix" data-suffix="%"><input data-f="config.vat" data-type="percent" type="number" min="0" max="50" step="0.5"></div><small>Els preus del catàleg ja l'inclouen.</small></label>
      </section>
      <div class="note" data-sec="cfg:connexions">Pendent de connectar: correus automàtics als clients i facturació (Verifactu).</div>
    </div>`;
  BINDS.configuracio = () => {
    bindFields($('#main'), draft);
    bindSecTabs($('#main'));
    paintPush();
    $('#pl-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target; const out = $('#pl-result'); const btn = $('button', f);
      const [l, w, h] = f.dims.value.split(/[x×*; ]+/).map(Number);
      btn.disabled = true; out.innerHTML = '<p class="muted">Consultant Packlink…</p>';
      try {
        const r = await BE.packlinkPrices({ country: f.country.value, zip: f.zip.value, kg: Number(f.kg.value), l, w, h });
        const m = r.margin;
        const rows = r.services.map((s, i) => `<tr style="cursor:default"><td>${esc(s.carrier)}${i === 0 ? ' <span class="badge badge-ok">Més barat</span>' : ''}</td><td>${esc(s.name)}</td><td>${s.hours ? (s.hours < 48 ? `${s.hours} h` : `${Math.round(s.hours / 24)} dies`) : esc(s.time) || '—'}</td><td>${eur(s.total)}${s.base ? `<br><span class="muted small">${eur(s.base)} + IVA ${eur(s.tax)}</span>` : ''}</td><td><b>${eur(s.client)}</b></td></tr>`).join('');
        out.innerHTML = r.services.length ? `<div style="overflow-x:auto"><table class="list"><thead><tr><th>Transportista</th><th>Servei</th><th>Trànsit</th><th>Cobra Packlink</th><th>Pagaria el client</th></tr></thead><tbody>${rows}</tbody></table></div>
          <p class="muted small">Paquet de ${r.parcel.kg} kg i ${r.parcel.length}×${r.parcel.width}×${r.parcel.height} cm. Marge actual: ${m.pct}% + ${eur(m.fixed)}${m.addVat ? ' i IVA afegit' : ''}. «Pagaria el client» és el que veuria al pagament. La botiga només ensenya els 6 més barats.</p>` : '<p class="muted">Cap transportista disponible per a aquest destí i paquet.</p>';
      } catch (err) { out.innerHTML = ''; handle(err); }
      btn.disabled = false;
    });
    $('#install-btn')?.addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice.catch(() => null);
      installPrompt = null;
      $('#install-btn')?.setAttribute('hidden', '');
    });
    $('#pw-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.next.value !== f.repeat.value) { toast('Les dues contrasenyes noves no coincideixen.', true); return; }
      try {
        await BE.changePassword(f.current.value, f.next.value);
        f.reset();
        toast('Contrasenya canviada.');
      } catch (err) { handle(err); }
    });
  };

  // ----- Avisos al mòbil (Web Push) -----
  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const keyBytes = (b64) => {
    const t = b64.replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(t + '='.repeat((4 - (t.length % 4)) % 4)), (c) => c.charCodeAt(0));
  };
  function deviceName() {
    const ua = navigator.userAgent;
    const os = isIOS() ? 'iPhone' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'Mac' : 'Ordinador';
    const br = /edg\//i.test(ua) ? 'Edge' : /firefox/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : '';
    return `${os}${br ? ` · ${br}` : ''}${isApp() ? ' (app)' : ''}`;
  }
  async function currentSub() {
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 4000))]);
    return reg ? reg.pushManager.getSubscription() : null;
  }

  async function paintPush() {
    const box = $('#push-box');
    if (!box) return;
    const say = (html) => { box.innerHTML = html; };
    if (!BE.push) return say('<p class="muted small">Els avisos funcionen amb la botiga a Supabase.</p>');
    if (!BE.pushReady) return say('<div class="note">Per activar-los cal executar <b>supabase/04-avisos.sql</b> i tornar a pujar la funció <b>botiga</b> (vegeu LLANCAMENT.md).</div>');
    if (!pushSupported()) {
      return say(isIOS() && !isApp()
        ? '<p class="small">Primer instal·la el panell a la pantalla d\'inici (a sota) i obre\'l des d\'allà. Després torna aquí per activar els avisos.</p>'
        : '<p class="muted small">Aquest navegador no permet avisos. Prova amb Chrome, Edge o Safari actualitzats.</p>');
    }
    if (Notification.permission === 'denied') {
      return say('<p class="small"><span class="badge badge-bad">Bloquejats</span> Has bloquejat els avisos per a aquesta web. Torna\'ls a permetre a la configuració del navegador (o de l\'app) i recarrega.</p>');
    }
    const sub = await currentSub().catch(() => null);
    if (sub) {
      say(`<p class="small"><span class="badge badge-ok">Activats en aquest dispositiu</span></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="push-test" type="button">Envia un avís de prova</button><button class="btn btn-ghost" id="push-off" type="button">Desactiva'ls aquí</button></div>`);
      $('#push-test').addEventListener('click', async (e) => {
        e.target.disabled = true;
        try {
          await BE.push.save(sub.toJSON(), deviceName()); // per si el servidor l'havia oblidat
          const r = await BE.push.test();
          toast(`Avís enviat a ${r.sent} de ${r.devices} dispositius.`);
        } catch (err) { handle(err); } finally { e.target.disabled = false; }
      });
      $('#push-off').addEventListener('click', async () => {
        await BE.push.remove(sub.endpoint);
        await sub.unsubscribe().catch(() => {});
        toast('Avisos desactivats en aquest dispositiu.');
        paintPush();
      });
      return;
    }
    say('<button class="btn" id="push-on" type="button">Activa els avisos en aquest dispositiu</button>');
    $('#push-on').addEventListener('click', async (e) => {
      e.target.disabled = true; e.target.textContent = 'Activant…';
      try {
        if (await Notification.requestPermission() !== 'granted') throw new Error('Cal permetre els avisos quan el navegador ho pregunta.');
        const key = await BE.push.key();
        const reg = await navigator.serviceWorker.ready;
        const s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
        await BE.push.save(s.toJSON(), deviceName());
        toast('Avisos activats. Prova d\'enviar-ne un.');
      } catch (err) { handle(err); }
      paintPush();
    });
  }

  // ---------- Inici ----------
  if (BE.hasSession()) boot(); else showLogin();
})();
