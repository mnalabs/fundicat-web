// Capa de serveis. Les vistes (app.js) només parlen amb aquest objecte, mai
// directament amb dades, localStorage o passarel·les. Per sortir de Shopify
// n'hi ha prou amb substituir cada adaptador per la seva versió real:
//   catalog  → Supabase / Medusa (productes, estoc)
//   cart     → igual en local + sincronització amb el backend quan hi hagi login
//   payments → Stripe Checkout o Redsys (targeta, Bizum)
//   quotes   → API pròpia (correu + CRM/ERP)
//   orders   → backend + facturació (Verifactu) + Sendcloud + sync Amazon
(function () {
  const DATA = window.FUNDICAT_DATA;
  const CFG = DATA.config;
  const I18N = window.I18N;
  I18N.localizeData(DATA);

  const safe = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* mode privat */ }
    },
  };

  // Amb Supabase, les comandes i els pressupostos passen per funcions de la base de
  // dades (place_order, submit_quote), que tornen a calcular preus i enviament.
  const BACKEND = window.FUNDICAT_BACKEND || { type: 'local' };
  async function api(url, body) {
    let endpoint = url;
    let payload = body;
    const headers = { 'Content-Type': 'application/json' };
    if (BACKEND.type === 'supabase') {
      endpoint = `${BACKEND.url}/rest/v1/rpc/${url.endsWith('/orders') ? 'place_order' : 'submit_quote'}`;
      payload = { payload: body };
      headers.apikey = BACKEND.key;
    }
    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "No s'ha pogut connectar amb el servidor.");
    return data;
  }

  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn());

  const catalog = {
    categories: () => DATA.categories,
    category: (id) => DATA.categories.find((c) => c.id === id),
    list({ cat, q, sort } = {}) {
      let items = DATA.products.slice();
      if (cat) items = items.filter((p) => p.category === cat);
      if (q) {
        const needle = q.toLowerCase();
        items = items.filter((p) => `${p.name} ${p.variant} ${p.short}`.toLowerCase().includes(needle));
      }
      if (sort === 'preu-asc') items.sort((a, b) => a.price - b.price);
      if (sort === 'preu-desc') items.sort((a, b) => b.price - a.price);
      return items;
    },
    bySlug: (slug) => DATA.products.find((p) => p.slug === slug),
    byId: (id) => DATA.products.find((p) => p.id === id),
    customParts: () => DATA.customParts,
    services: () => DATA.services,
    home: () => DATA.home || {},
    announcements: (placement) => (DATA.announcements || []).filter((a) => a.placement === placement),
    service: (key) => DATA.services.find((s) => s.slug === key || s.id === key),
  };

  const pricing = {
    showNet: safe.get('fc.net', false),
    setNet(v) { this.showNet = v; safe.set('fc.net', v); emit(); },
    // Els preus del catàleg porten IVA, com a Amazon.
    unit(product, qty = 1) {
      const tier = (product.tiers || []).filter((t) => qty >= t.min).pop();
      return product.price * (1 - (tier ? tier.off : 0));
    },
    display(gross) { return this.showNet ? gross / (1 + CFG.vat) : gross; },
    money(gross) {
      return new Intl.NumberFormat(I18N.locale(), { style: 'currency', currency: CFG.currency }).format(this.display(gross));
    },
    rawMoney(n) {
      return new Intl.NumberFormat(I18N.locale(), { style: 'currency', currency: CFG.currency }).format(n);
    },
  };

  // Transportistes amb preu real (Packlink): el servidor els demana i els guarda; aquí només
  // es mostren. El preu que paga el client és el que la base de dades llegeix del servidor.
  const carriers = {
    list: [], key: '', loading: false,
    enabled: () => BACKEND.type === 'supabase' && !!CFG.shipping?.packlink?.enabled,
    cartKey: () => JSON.stringify(cart.lines.map((l) => [l.id, l.qty])),
    destKey(dest) { return `${dest?.country}|${String(dest?.zip || '').trim()}|${this.cartKey()}`; },
    matching(dest) { return this.enabled() && dest && this.key === this.destKey(dest) ? this.list : []; },
    async load(dest) {
      const key = this.destKey(dest);
      if (!this.enabled() || String(dest?.zip || '').trim().length < 4) { this.list = []; this.key = ''; return false; }
      if (this.key === key) return true;
      this.loading = true;
      try {
        const res = await fetch(`${BACKEND.url}/functions/v1/botiga/shipping-quotes`, {
          method: 'POST', headers: { apikey: BACKEND.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines: cart.lines.map((l) => ({ id: l.id, qty: l.qty })), country: dest.country, zip: String(dest.zip).trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (key !== this.destKey(dest)) return false; // mentrestant l'adreça ha canviat
        this.list = res.ok && Array.isArray(data.options) ? data.options.map((o) => ({ id: `q:${o.id}`, kind: 'carrier', price: Number(o.price), carrier: o.carrier, name: o.name, hours: o.hours })) : [];
        this.key = key;
        return true;
      } catch {
        this.list = []; this.key = key; return false;
      } finally { this.loading = false; }
    },
  };

  const cart = {
    lines: safe.get('fc.cart', []),
    save() { safe.set('fc.cart', this.lines); emit(); },
    add(id, qty = 1) {
      const line = this.lines.find((l) => l.id === id);
      if (line) line.qty += qty; else this.lines.push({ id, qty });
      this.save();
    },
    setQty(id, qty) {
      const line = this.lines.find((l) => l.id === id);
      if (!line) return;
      line.qty = Math.max(1, Math.min(99, qty));
      this.save();
    },
    remove(id) { this.lines = this.lines.filter((l) => l.id !== id); this.save(); },
    clear() { this.lines = []; this.save(); },
    count() { return this.lines.reduce((n, l) => n + l.qty, 0); },
    detail() {
      return this.lines
        .map((l) => {
          const product = catalog.byId(l.id);
          if (!product) return null;
          const unit = pricing.unit(product, l.qty);
          return { ...l, product, unit, total: unit * l.qty, saved: (product.price - unit) * l.qty };
        })
        .filter(Boolean);
    },
    // Sense destinació: estimació a domicili a la Península (js/shipping.js).
    totals(dest, methodId) {
      const lines = this.detail();
      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      const saved = lines.reduce((s, l) => s + l.saved, 0);
      const q = window.FundicatShipping.quote(CFG.shipping, lines, dest);
      // Si hi ha transportistes amb preu real per a aquesta adreça, substitueixen les tarifes fixes
      // (la recollida al taller es manté).
      const extra = carriers.matching(dest);
      if (extra.length) q.options = [...extra, ...q.options.filter((o) => o.id === 'pickup')];
      const option = q.options.find((o) => o.id === methodId) || q.options[0];
      const shipping = lines.length && option ? option.price : 0;
      const total = subtotal + shipping;
      const vat = total - total / (1 + CFG.vat);
      return { subtotal, saved, shipping, total, vat, toFree: q.toFree ?? 0, quote: q, option };
    },
  };

  // Simulats: retornen promeses perquè la versió real (fetch) encaixi igual.
  const payments = {
    methods: [
      { id: 'card', name: 'Targeta', note: 'Visa, Mastercard, Apple Pay o Google Pay. Pagament segur amb Stripe.' },
      { id: 'transfer', name: 'Transferència', note: 'Per a empreses · enviament en rebre el pagament' },
    ],
    // El servidor recalcula els preus: el navegador només envia ids i quantitats.
    // Amb targeta, es crea el pagament a Stripe (funció "botiga") i es torna l'enllaç
    // a la pàgina de pagament; la cistella es buida quan Stripe confirma el cobrament.
    async pay({ method, customer, shipping }) {
      // 'q:<id>' = transportista triat amb preu real: el servidor llegeix el preu guardat.
      const byCarrier = String(shipping || '').startsWith('q:');
      const order = await api('/api/orders', { method, customer, shipping: byCarrier ? 'carrier' : shipping, quote: byCarrier ? shipping.slice(2) : undefined, lines: cart.lines });
      safe.set('fc.lastOrder', { ...order, totals: { total: order.total } });
      if (method === 'card' && BACKEND.type === 'supabase') {
        const res = await fetch(`${BACKEND.url}/functions/v1/botiga/checkout`, {
          method: 'POST',
          headers: { apikey: BACKEND.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: order.number, returnTo: location.origin + location.pathname }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) return { order, redirect: data.url };
        // Stripe encara no connectat (mentre es prepara el llançament): la comanda
        // queda registrada com a pendent de pagament.
        if (res.status !== 404 && res.status !== 503) throw new Error(data.error || 'No s\'ha pogut iniciar el pagament.');
      }
      cart.clear();
      notify({ order: order.number });
      return { order };
    },
    lastOrder: () => safe.get('fc.lastOrder', null),
  };

  // Avís al mòbil de l'administrador (comandes sense targeta i pressupostos).
  // Si falla no passa res: la comanda ja és a la base de dades.
  function notify(body) {
    if (BACKEND.type !== 'supabase') return;
    fetch(`${BACKEND.url}/functions/v1/botiga/notify`, { method: 'POST', keepalive: true, headers: { apikey: BACKEND.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});
  }

  // "On és la meva comanda?": només es veu amb el número de comanda i el correu.
  const tracking = {
    available: BACKEND.type === 'supabase',
    async lookup(number, email) {
      if (BACKEND.type !== 'supabase') throw new Error('El seguiment no està disponible en aquesta versió.');
      const res = await fetch(`${BACKEND.url}/rest/v1/rpc/track_order`, {
        method: 'POST',
        headers: { apikey: BACKEND.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_number: number, p_email: email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('No s\'ha pogut consultar la comanda. Torna-ho a provar d\'aquí a una estona.');
      return data; // null si no coincideix
    },
  };

  const quotes = {
    async submit(request) {
      const res = await api('/api/quotes', request);
      if (res?.ref) notify({ quote: res.ref });
      return res;
    },
  };

  // Recomanacions a partir del que el visitant ha mirat i té a la cistella.
  // Amb backend: substituir per les dades de vendes reals ("comprats junts").
  const history = {
    seen: () => safe.get('fc.seen', []),
    view(id) {
      const list = [id, ...this.seen().filter((x) => x !== id)].slice(0, 12);
      safe.set('fc.seen', list);
    },
  };

  const recommend = {
    recentlyViewed: () => history.seen().map(catalog.byId).filter(Boolean),
    // Complements dels productes vistos i de la cistella, ordenats per quants cops surten.
    forYou(limit = 8) {
      const base = [...cart.lines.map((l) => l.id), ...history.seen()];
      const owned = new Set(cart.lines.map((l) => l.id));
      const score = new Map();
      base.forEach((id, i) => {
        (catalog.byId(id)?.related || []).forEach((r, j) => {
          if (owned.has(r)) return;
          score.set(r, (score.get(r) || 0) + 10 / (i + 1) + 3 - j);
        });
      });
      const picked = [...score.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => catalog.byId(id)).filter(Boolean);
      const fill = DATA.products.filter((p) => !owned.has(p.id) && !picked.includes(p));
      return [...picked, ...fill].slice(0, limit);
    },
    personalised: () => cart.lines.length > 0 || history.seen().length > 0,
    boughtTogether(id) {
      const p = catalog.byId(id);
      return p ? [p, ...(p.related || []).slice(0, 2).map(catalog.byId).filter(Boolean)] : [];
    },
    completeCart(limit = 6) {
      const owned = new Set(cart.lines.map((l) => l.id));
      const ids = [...new Set(cart.lines.flatMap((l) => catalog.byId(l.id)?.related || []))].filter((x) => !owned.has(x));
      return ids.map(catalog.byId).filter(Boolean).slice(0, limit);
    },
    volumeDeals: () => DATA.products.filter((p) => p.tiers && p.tiers.length),
    // Data estimada d'arribada: 2 dies laborables (comanda abans de les 13 h).
    deliveryDate(from = new Date()) {
      const d = new Date(from);
      let add = d.getHours() < 13 ? 2 : 3;
      while (add > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6 !== 0) add--; }
      return d.toLocaleDateString(I18N.locale(), { weekday: 'long', day: 'numeric', month: 'long' });
    },
  };

  window.Store = { config: CFG, catalog, pricing, cart, carriers, payments, quotes, tracking, history, recommend, subscribe: (fn) => listeners.add(fn) };
})();
