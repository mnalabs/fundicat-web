// Càlcul d'enviament per pes i zona. El mateix codi el fan servir la botiga
// (per mostrar opcions i preus) i el servidor (per cobrar-los): així el client
// no pot pagar un enviament diferent del que veu.
(function (root) {
  const BRACKETS = [2, 5, 10, 20, 30]; // kg, inclosos
  const COUNTRY_ZONE = { Espanya: 'peninsula', Portugal: 'portugal', 'Itàlia': 'ue', 'França': 'ue', Alemanya: 'ue' };
  const COUNTRY_ISO = { Espanya: 'ES', Portugal: 'PT', 'Itàlia': 'IT', 'França': 'FR', Alemanya: 'DE' };
  const round = (n) => Math.round(n * 100) / 100;

  const DEFAULTS = {
    autoLabel: false,
    pickup: { enabled: true, address: 'Manresa (Barcelona)' },
    sendcloud: { methodHome: '', methodExpress: '' },
    zones: [
      { id: 'peninsula', name: 'Península', enabled: true, rates: [3.95, 4.95, 6.95, 9.95, 12.95], freeFrom: 60, express: 4 },
      { id: 'balears', name: 'Balears', enabled: true, rates: [7.95, 9.95, 12.95, 17.95, 24.95], freeFrom: 120, express: 0 },
      { id: 'portugal', name: 'Portugal', enabled: true, rates: [7.95, 9.95, 13.95, 19.95, 26.95], freeFrom: 0, express: 0 },
      { id: 'ue', name: 'Itàlia, França i Alemanya', enabled: true, rates: [11.95, 14.95, 19.95, 27.95, 36.95], freeFrom: 0, express: 0 },
    ],
  };

  // Zona segons país i codi postal. Canàries, Ceuta i Melilla, de moment no (duana).
  function zoneFor(country, zip = '') {
    if (country === 'Espanya') {
      const p = String(zip).trim().slice(0, 2);
      if (p === '07') return 'balears';
      if (['35', '38', '51', '52'].includes(p)) return null;
      return 'peninsula';
    }
    return COUNTRY_ZONE[country] || null;
  }

  // lines: [{ product, qty, total }]
  function parcel(lines) {
    let kg = 0; let fixed = 0; let oversize = false;
    lines.forEach(({ product: p, qty }) => {
      if (p.oversize) { oversize = true; fixed += (p.shipFixed || 0) * qty; } else kg += (p.weight || 1) * qty;
    });
    return { kg: round(kg), fixed: round(fixed), oversize };
  }

  // Opcions disponibles per a una destinació. Sense destinació: estimació a la Península.
  function quote(cfg, lines, dest) {
    const s = { ...DEFAULTS, ...(cfg || {}) };
    const subtotal = lines.reduce((t, l) => t + l.total, 0);
    const zoneId = dest ? zoneFor(dest.country, dest.zip) : 'peninsula';
    const zone = (s.zones || []).find((z) => z.id === zoneId && z.enabled);
    const { kg, fixed, oversize } = parcel(lines);
    const options = [];
    let unavailable = null;

    if (!zone) unavailable = 'zone';
    else {
      const i = BRACKETS.findIndex((b) => kg <= b);
      if (kg > 0 && i < 0) unavailable = 'heavy';
      else {
        const base = kg > 0 ? zone.rates[i] : 0;
        const free = zone.freeFrom > 0 && subtotal >= zone.freeFrom;
        options.push({ id: 'home', price: round((free ? 0 : base) + fixed), free: free && !fixed });
        if (zone.express > 0 && !oversize) options.push({ id: 'express', price: round(base + zone.express) });
      }
    }
    if (s.pickup?.enabled) options.push({ id: 'pickup', price: 0 });
    return {
      zoneId, zoneName: zone?.name || '', kg, oversize, unavailable, options,
      freeFrom: zone?.freeFrom || 0,
      toFree: zone?.freeFrom ? Math.max(0, round(zone.freeFrom - subtotal)) : null,
    };
  }

  // Preu més baix a domicili a la Península per a un producte (per a la fitxa).
  function fromPrice(cfg, product) {
    const q = quote(cfg, [{ product, qty: 1, total: 0 }]);
    return q.options.find((o) => o.id === 'home')?.price ?? null;
  }

  // ---------- Dies d'entrega (estimació) ----------
  // Dies laborables de trànsit per zona. Es poden canviar al panell (Configuració → Enviaments)
  // i es desen a zone.days = [mínim, màxim]. L'express és sempre 1 dia.
  const DEFAULT_DAYS = { peninsula: [1, 2], balears: [2, 4], portugal: [2, 4], ue: [3, 6] };
  const DEFAULT_PREP = 1; // dies laborables per preparar la comanda al taller

  function days(cfg, zoneId, method) {
    const s = { ...DEFAULTS, ...(cfg || {}) };
    const zone = (s.zones || []).find((z) => z.id === zoneId);
    const prep = Number.isFinite(+s.prepDays) && s.prepDays !== '' && s.prepDays != null ? Math.max(0, Math.round(+s.prepDays)) : DEFAULT_PREP;
    const d = Array.isArray(zone?.days) && zone.days.length === 2 ? zone.days : (DEFAULT_DAYS[zoneId] || [2, 5]);
    const transit = method === 'express' ? [1, 1] : [Math.max(1, +d[0] || 1), Math.max(+d[0] || 1, +d[1] || 1)];
    return { prep, min: prep + transit[0], max: prep + transit[1] };
  }

  // Suma dies laborables (dilluns a divendres; els festius no es tenen en compte).
  function addBusinessDays(from, n) {
    const d = new Date(from);
    let left = Math.max(0, n);
    while (left > 0) {
      d.setDate(d.getDate() + 1);
      const wd = d.getDay();
      if (wd !== 0 && wd !== 6) left -= 1;
    }
    return d;
  }

  // Interval de dates { from, to } per a una comanda feta a partir de `start`.
  // Si la comanda ja ha sortit (shippedAt), només compta el trànsit.
  function eta(cfg, zoneId, method, start = new Date(), shippedAt = null) {
    const d = days(cfg, zoneId, method);
    if (shippedAt) {
      const t = days(cfg, zoneId, method);
      const lo = t.min - t.prep; const hi = t.max - t.prep;
      return { from: addBusinessDays(shippedAt, lo), to: addBusinessDays(shippedAt, hi), days: { min: lo, max: hi } };
    }
    return { from: addBusinessDays(start, d.min), to: addBusinessDays(start, d.max), days: d };
  }

  // Per als transportistes amb preu real: el transportista dona les hores de trànsit.
  // Es compta un dia més com a marge i, si la comanda encara no ha sortit, el dia de preparació.
  function etaHours(cfg, hours, start = new Date(), shippedAt = null) {
    const prep = shippedAt ? 0 : days(cfg, 'peninsula', 'home').prep;
    const d = Math.max(1, Math.ceil((Number(hours) || 24) / 24));
    const base = shippedAt ? new Date(shippedAt) : start;
    return { from: addBusinessDays(base, prep + d), to: addBusinessDays(base, prep + d + 1), days: { min: prep + d, max: prep + d + 1 } };
  }

  const api = { BRACKETS, DEFAULTS, DEFAULT_DAYS, DEFAULT_PREP, COUNTRY_ISO, zoneFor, parcel, quote, fromPrice, days, addBusinessDays, eta, etaHours };
  root.FundicatShipping = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
