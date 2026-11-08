// Vistes i enrutador (hash). Sense dependències ni build: es pot migrar a
// Astro/Next més endavant reaprofitant Store i el CSS tal qual.
(function () {
  const { catalog, pricing, cart, carriers, payments, quotes, tracking, config, history, recommend } = window.Store;
  const { t } = window.I18N;
  const main = document.getElementById('main');
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const m = (n) => pricing.money(n);
  const vatLabel = () => t(pricing.showNet ? 'sense IVA' : 'IVA inclòs');
  const fullName = (p) => `${p.name} ${p.variant}`;
  const CONTACT = { email: 'fundicatsl@gmail.com', phone: '623 008 521', phoneIntl: '+34623008521' };

  // ---------- Imatge de producte ----------
  // Si el producte té `image`, es fa servir la foto real. Si no, un bodegó
  // neutre provisional sobre fons gris (com una foto d'estudi).
  const SHAPES = {
    bag: (l) => `<path d="M62 44h76l10 122a6 6 0 0 1-6 6H58a6 6 0 0 1-6-6z" fill="var(--art-a)"/><path d="M62 44h76l-5 14H67z" fill="var(--art-b)"/><rect x="70" y="92" width="60" height="48" rx="2" fill="var(--art-label)"/><text x="100" y="104" text-anchor="middle" class="art-b">FUNDICAT</text><text x="100" y="121" text-anchor="middle" class="art-t">PetroBond</text><text x="100" y="133" text-anchor="middle" class="art-s">${l}</text>`,
    kit: () => `<rect x="40" y="76" width="120" height="92" rx="4" fill="var(--art-a)"/><path d="M40 76l14-20h92l14 20z" fill="var(--art-b)"/><rect x="70" y="104" width="60" height="32" rx="2" fill="var(--art-label)"/><text x="100" y="116" text-anchor="middle" class="art-b">FUNDICAT</text><text x="100" y="129" text-anchor="middle" class="art-t">Kit</text>`,
    crucible: () => `<path d="M66 62h68l-9 98a8 8 0 0 1-8 7H83a8 8 0 0 1-8-7z" fill="#5a5a5e"/><ellipse cx="100" cy="62" rx="34" ry="8" fill="#48484c"/><ellipse cx="100" cy="63" rx="26" ry="5" fill="#2c2c2e"/>`,
    flask: () => `<rect x="48" y="66" width="104" height="42" rx="3" fill="#c7c7cc"/><rect x="48" y="112" width="104" height="42" rx="3" fill="#aeaeb2"/><rect x="40" y="80" width="8" height="60" rx="2" fill="#8e8e93"/><rect x="152" y="80" width="8" height="60" rx="2" fill="#8e8e93"/>`,
    jar: (l) => `<rect x="70" y="58" width="60" height="14" rx="3" fill="#48484c"/><rect x="64" y="70" width="72" height="98" rx="10" fill="#e5e5ea"/><rect x="72" y="100" width="56" height="36" rx="2" fill="#fff"/><text x="100" y="114" text-anchor="middle" class="art-b">FUNDICAT</text><text x="100" y="127" text-anchor="middle" class="art-s">${l}</text>`,
    furnace: () => `<rect x="58" y="70" width="84" height="96" rx="8" fill="#3a3a3c"/><rect x="66" y="78" width="68" height="60" rx="5" fill="#2c2c2e"/><ellipse cx="100" cy="82" rx="26" ry="5" fill="#48484c"/><rect x="72" y="146" width="40" height="10" rx="2" fill="#1c1c1e"/><circle cx="124" cy="151" r="5" fill="#8e8e93"/><rect x="58" y="62" width="84" height="12" rx="4" fill="#636366"/>`,
    ingot: () => `<path d="M44 104h112l-10 40H54z" fill="#8e8e93"/><path d="M44 104h112v-6H44z" fill="#aeaeb2"/><rect x="58" y="108" width="18" height="24" rx="2" fill="#636366"/><rect x="82" y="108" width="18" height="24" rx="2" fill="#636366"/><rect x="106" y="108" width="18" height="24" rx="2" fill="#636366"/><rect x="130" y="108" width="12" height="24" rx="2" fill="#636366"/>`,
    antler: () => `<ellipse cx="66" cy="164" rx="13" ry="7" fill="#b9a57f"/><g fill="none" stroke-linecap="round"><path d="M68 162 C 76 122 98 92 142 46 M90 122 L 56 98 M106 98 L 90 62 M124 74 L 150 66" stroke="#cdb994" stroke-width="13"/><path d="M68 160 C 76 122 98 92 140 48 M90 120 L 58 99 M106 96 L 91 64 M124 73 L 148 67" stroke="#e9ddc4" stroke-width="5"/></g>`,
    sepia: () => `<g transform="rotate(-22 100 108)"><ellipse cx="100" cy="108" rx="34" ry="62" fill="#f5f0e5" stroke="#d8cdb8" stroke-width="2"/><ellipse cx="100" cy="112" rx="24" ry="48" fill="none" stroke="#e4dac7" stroke-width="2"/><ellipse cx="100" cy="116" rx="14" ry="34" fill="none" stroke="#e4dac7" stroke-width="2"/></g>`,
    wood: () => `<path d="M48 92l70-18 36 14-70 18z" fill="#c48d55"/><path d="M48 92l36 14v58l-36-14z" fill="#8a5c30"/><path d="M84 106l70-18v58l-70 18z" fill="#a8743f"/><path d="M92 118c18-6 34-2 54-10M92 134c20-4 30 2 54-8M92 150c16-6 36-2 54-10" fill="none" stroke="#7d5129" stroke-width="2" opacity=".7"/>`,
    horn: () => `<rect x="54" y="66" width="44" height="106" rx="16" fill="#2b2420" transform="rotate(-8 76 119)"/><rect x="104" y="62" width="44" height="106" rx="16" fill="#3a302a" transform="rotate(6 126 115)"/><path d="M66 80c2 26 0 54-4 80M116 76c4 28 4 56 0 82" stroke="#6b5a4e" stroke-width="3" opacity=".6" fill="none"/>`,
    nacre: () => `<defs><linearGradient id="fc-nacre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef3f7"/><stop offset=".35" stop-color="#f6e8f1"/><stop offset=".65" stop-color="#e5f3ec"/><stop offset="1" stop-color="#f3efe0"/></linearGradient></defs>${[[52, 70], [104, 70], [52, 118], [104, 118]].map(([x, y]) => `<rect x="${x}" y="${y}" width="44" height="40" rx="6" fill="url(#fc-nacre)" stroke="#d5d8de"/>`).join('')}`,
    grain: () => `<ellipse cx="100" cy="160" rx="62" ry="12" fill="#9a6630"/>${[[70, 150], [86, 146], [102, 148], [118, 146], [134, 152], [78, 136], [94, 132], [110, 134], [126, 138], [88, 120], [104, 118], [118, 124], [98, 106]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="9" fill="${['#c98d45', '#b07a3a', '#d9a05a'][i % 3]}"/>`).join('')}`,
    wax: () => `<path d="M46 108l52-14 30 12-52 14z" fill="#6aa883"/><path d="M46 108l30 12v46l-30-12z" fill="#3f7d5a"/><path d="M76 120l52-14v46l-52 14z" fill="#54946d"/><path d="M92 82l44-12 24 10-44 12z" fill="#7c9fc9"/><path d="M92 82l24 10v34l-24-10z" fill="#4c6f9c"/><path d="M116 92l44-12v34l-44 12z" fill="#6086b6"/>`,
    goldleaf: () => `<defs><linearGradient id="fc-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d77a"/><stop offset=".5" stop-color="#d4a93a"/><stop offset="1" stop-color="#f0cf68"/></linearGradient></defs><rect x="56" y="58" width="92" height="112" rx="4" fill="#efe6d2" stroke="#d8ccb2"/><rect x="66" y="70" width="72" height="72" fill="url(#fc-gold)"/><text x="102" y="160" text-anchor="middle" class="art-b">FUNDICAT</text>`,
    damascus: () => `<g transform="rotate(-18 100 118)"><path d="M30 104h120l20 14-20 14H30z" fill="#9a9aa0"/><path d="M34 110c14-6 22 6 36 0s22 6 36 0 22 6 36 0M34 118c14-6 22 6 36 0s22 6 36 0 22 6 36 0M34 126c14-6 22 6 36 0s22 6 36 0 22 6 36 0" fill="none" stroke="#5f5f64" stroke-width="2"/><path d="M34 114c14-6 22 6 36 0s22 6 36 0 22 6 36 0M34 122c14-6 22 6 36 0s22 6 36 0 22 6 36 0" fill="none" stroke="#d1d1d6" stroke-width="2"/></g>`,
    tongs: () => `<path d="M46 150L132 70" stroke="#636366" stroke-width="8" stroke-linecap="round"/><path d="M46 122l86 30" stroke="#8e8e93" stroke-width="8" stroke-linecap="round"/><path d="M132 70c16-5 27 6 25 22M132 152c16 3 25-8 23-24" stroke="#636366" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  };
  const art = (p, { wide = false, cls = '' } = {}) => {
    const img = p.images?.[0] || p.image;
    if (img) return `<img class="art ${cls}" src="${esc(img)}" alt="${esc(fullName(p))}" loading="lazy">`;
    const vb = wide ? '-60 0 320 200' : '0 0 200 200';
    return `<svg class="art ${cls}" viewBox="${vb}" role="img" aria-label="${esc(fullName(p))}"><rect x="-60" width="320" height="200" fill="var(--art-bg)"/><ellipse cx="100" cy="174" rx="58" ry="5" fill="#000" opacity=".08"/>${SHAPES[p.art](esc(p.variant))}</svg>`;
  };

  const tag = (p) => (p.badge ? `<span class="tag">${esc(p.badge)}</span>` : p.exemple ? `<span class="tag tag-muted">${t('Producte d\'exemple')}</span>` : '');
  const addLabel = (p) => esc(t('Afegeix {name} a la cistella', { name: fullName(p) }));

  const card = (p) => `
    <article class="card">
      <a href="#/producte/${p.slug}" class="card-media">${art(p)}</a>
      <div class="card-body">
        ${tag(p)}
        <h3><a href="#/producte/${p.slug}">${esc(p.name)}</a></h3>
        <span class="variant">${esc(p.variant)}</span>
        <div class="card-foot">
          <span class="price">${m(p.price)}</span>
          <button class="btn btn-sm btn-secondary" data-add="${p.id}" aria-label="${addLabel(p)}">${t('Afegeix')}</button>
        </div>
      </div>
    </article>`;

  // ---------- Recomanacions (estil marketplace) ----------
  const bigPrice = (gross) => {
    const parts = new Intl.NumberFormat(window.I18N.locale(), { style: 'currency', currency: config.currency }).formatToParts(pricing.display(gross));
    let int = ''; let dec = ''; let cur = ''; let curFirst = false;
    parts.forEach((x) => {
      if (x.type === 'integer' || x.type === 'group') int += x.value;
      else if (x.type === 'decimal' || x.type === 'fraction') dec += x.value;
      else if (x.type === 'currency') { cur = x.value; curFirst = !int; }
    });
    return `<span class="pp">${curFirst ? `<span class="pp-dec">${cur}</span>` : ''}<span class="pp-int">${int}</span><span class="pp-dec">${dec}${curFirst ? '' : ` ${cur}`}</span></span>`;
  };
  const bestTier = (p) => (p.tiers && p.tiers.length ? p.tiers[p.tiers.length - 1] : null);

  const rcard = (p) => {
    const best = bestTier(p);
    return `
      <article class="rcard">
        <a href="#/producte/${p.slug}" class="rcard-media">${art(p)}</a>
        <div class="rcard-body">
          <h3><a href="#/producte/${p.slug}">${esc(p.name)} <span>${esc(p.variant)}</span></a></h3>
          ${bigPrice(p.price)}
          ${best ? `<span class="save small">${t('−{pct}% a partir de {min} unitats', { pct: Math.round(best.off * 100), min: best.min })}</span>` : ''}
          <span class="small muted">${t('Rep-lo {date}', { date: recommend.deliveryDate() })}</span>
          ${p.stock < 10 ? `<span class="small low">${t('Només en queden {n}', { n: p.stock })}</span>` : ''}
          <span class="grow"></span>
          <button class="btn btn-sm btn-block" data-add="${p.id}" aria-label="${addLabel(p)}">${t('Afegeix a la cistella')}</button>
        </div>
      </article>`;
  };

  let rowSeq = 0;
  const row = (title, items, { sub = '', link = '', linkText = 'Veure-ho tot' } = {}) => {
    if (!items.length) return '';
    const id = `row-${++rowSeq}`;
    return `
      <section class="rrow">
        <div class="rrow-head">
          <div><h2>${t(title)}</h2>${sub ? `<p>${t(sub)}</p>` : ''}</div>
          <div class="rrow-tools">
            ${link ? `<a class="link" href="${link}">${t(linkText)}</a>` : ''}
            <button class="arrow" data-scroll="${id}" data-dir="-1" aria-label="${t('Anteriors')}">‹</button>
            <button class="arrow" data-scroll="${id}" data-dir="1" aria-label="${t('Següents')}">›</button>
          </div>
        </div>
        <div class="carousel" id="${id}">${items.map(rcard).join('')}</div>
      </section>`;
  };

  const bundle = (id) => {
    const items = recommend.boughtTogether(id);
    if (items.length < 2) return '';
    const total = items.reduce((s, p) => s + p.price, 0);
    return `
      <section class="bundle">
        <h2>${t('Es compren junts sovint')}</h2>
        <div class="bundle-body">
          <div class="bundle-items">
            ${items.map((p, i) => `${i ? '<span class="plus" aria-hidden="true">+</span>' : ''}<a href="#/producte/${p.slug}" class="bundle-item">${art(p)}</a>`).join('')}
          </div>
          <div class="bundle-buy">
            <p>${t('Preu total:')} <b>${m(total)}</b></p>
            <button class="btn" data-add-many="${items.map((p) => p.id).join(',')}">${t('Afegeix els {n} a la cistella', { n: items.length })}</button>
            <ul>${items.map((p, i) => `<li>${i === 0 ? `<b>${t('Aquest producte:')}</b> ` : ''}<a href="#/producte/${p.slug}">${esc(fullName(p))}</a> <span>${m(p.price)}</span></li>`).join('')}</ul>
          </div>
        </div>
      </section>`;
  };

  const quickCard = (catId) => {
    const items = catalog.list({ cat: catId }).slice(0, 4);
    if (!items.length) return '';
    return `
      <article class="qcard">
        <h3>${esc(catalog.category(catId).name)}</h3>
        <div class="qgrid">${items.map((p) => `<a href="#/producte/${p.slug}">${art(p)}<span>${esc(p.name)}</span></a>`).join('')}</div>
        <a class="link small" href="#/botiga?cat=${catId}">${t('Veure\'n més')}</a>
      </article>`;
  };

  const ICON = {
    truck: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 9h18v15H3zM21 14h6l5 5v5H21z"/><circle cx="9" cy="26" r="2.5" fill="var(--alt)"/><circle cx="26" cy="26" r="2.5" fill="var(--alt)"/></svg>',
    stack: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M18 5l13 7-13 7-13-7z"/><path d="M5 18l13 7 13-7M5 24l13 7 13-7"/></svg>',
    doc: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M9 4h13l6 6v22H9z"/><path d="M22 4v6h6M13 17h11M13 22h11M13 27h7"/></svg>',
    gear: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><circle cx="18" cy="18" r="5"/><path d="M18 3v5M18 28v5M3 18h5M28 18h5M7.4 7.4l3.5 3.5M25.1 25.1l3.5 3.5M7.4 28.6l3.5-3.5M25.1 10.9l3.5-3.5"/><circle cx="18" cy="18" r="10"/></svg>',
    pour: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M6 6h14l-2 12a4 4 0 0 1-4 3h-2a4 4 0 0 1-4-3z" transform="rotate(-25 13 13)"/><path d="M22 16c0 4 2 6 2 9"/><path d="M8 28h22v4H8z"/></svg>',
    mill: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M14 3h8v6h-8zM16 9h4v10h-4z"/><path d="M17 19l1 4 1-4"/><path d="M5 26h26v6H5z"/><path d="M11 26v-2h14v2"/></svg>',
    cad: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M18 4l12 7v14l-12 7-12-7V11z"/><path d="M6 11l12 7 12-7M18 18v14"/></svg>',
    print: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M4 4h28M8 4v28M28 4v28M4 32h28"/><path d="M14 10h8v4h-8zM18 14v3"/><path d="M13 24h10v4H13zM14 20h8v4h-8z"/></svg>',
  };

  const quoteForm = (selected = '') => `
      <form class="wrap quote" id="quote" novalidate>
        <div class="quote-head">
          <h2>${t('Demana pressupost.')}</h2>
          <p class="lead">${t('Et responem en 24 hores laborables.')}</p>
        </div>
        <div class="field-row">
          <label class="field"><span>${t('Nom o empresa')}</span><input name="name" required></label>
          <label class="field"><span>${t('Correu electrònic')}</span><input name="email" type="email" required></label>
        </div>
        <div class="field-row">
          <label class="field"><span>${t('Servei')}</span><select name="service">${catalog.services().map((s) => `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
          <label class="field"><span>${t('Unitats')}</span><input name="qty" type="number" min="1" value="1" required></label>
        </div>
        <label class="field"><span>${t('Què necessites')}</span><input name="part" required placeholder="${esc(t('Casquet guia Ø 3,80 mm, recanvi de bronze, prototip…'))}"></label>
        <label class="field"><span>${t('Plànol, model o foto')} <em>${t('(PDF, STEP, DXF, STL o JPG)')}</em></span><input name="file" type="file" accept=".pdf,.step,.stp,.iges,.igs,.dxf,.stl,.jpg,.jpeg,.png"></label>
        <label class="field"><span>${t('Detalls')}</span><textarea name="notes" rows="4" placeholder="${esc(t('Material, mides, toleràncies, acabat i data de lliurament'))}"></textarea></label>
        <button class="btn btn-lg btn-block" type="submit">${t('Envia la sol·licitud')}</button>
      </form>`;

  // ---------- Anuncis (gestionats des del panell) ----------
  // Només enllaços interns o web (mai "javascript:"), encara que la base de dades en tingui un altre.
  const safeHref = (u) => (/^(#\/|https?:\/\/|\/(?!\/))/.test(String(u || '').trim()) ? String(u).trim() : '');
  const promos = () => {
    const list = catalog.announcements('home');
    if (!list.length) return '';
    return `<section class="promos">${list.map((a) => `
      <a class="promo ${a.image ? 'has-image' : ''}" href="${esc(safeHref(a.link) || '#/botiga')}">
        <div><h2>${esc(a.title)}</h2>${a.subtitle ? `<p>${esc(a.subtitle)}</p>` : ''}${a.cta ? `<span class="link">${esc(a.cta)}</span>` : ''}</div>
        ${a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy">` : ''}
      </a>`).join('')}</section>`;
  };
  function paintBar() {
    const bar = catalog.announcements('bar')[0];
    $('#announce').innerHTML = bar && bar.text ? `<div class="announce-bar">${safeHref(bar.link) ? `<a href="${esc(safeHref(bar.link))}">${esc(bar.text)}</a>` : esc(bar.text)}</div>` : '';
  }

  // ---------- Vistes ----------
  const views = {};

  // Il·lustració del hero: crisol abocant metall fos dins un flascó de sorra.
  const POUR_ART = (label) => `
    <svg class="pour-art" viewBox="150 20 880 580" role="img" aria-label="${esc(label)}">
      <defs>
        <linearGradient id="fc-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4cf"/><stop offset=".3" stop-color="#ffc247"/><stop offset="1" stop-color="#ff6a00"/></linearGradient>
        <radialGradient id="fc-heat" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff7a1a" stop-opacity=".5"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
        <linearGradient id="fc-graphite" x1="0" x2="1"><stop offset="0" stop-color="#2c2c2e"/><stop offset=".55" stop-color="#5a5a5e"/><stop offset="1" stop-color="#232325"/></linearGradient>
        <linearGradient id="fc-alu" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e3e3e8"/><stop offset="1" stop-color="#9c9ca2"/></linearGradient>
        <filter id="fc-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
      </defs>
      <ellipse cx="660" cy="566" rx="400" ry="22" fill="#000" opacity=".7"/>
      <ellipse class="heat" cx="700" cy="400" rx="230" ry="150" fill="url(#fc-heat)"/>
      <rect x="520" y="404" width="360" height="74" rx="6" fill="url(#fc-alu)"/>
      <rect x="520" y="482" width="360" height="74" rx="6" fill="#86868c"/>
      <rect x="500" y="424" width="20" height="112" rx="4" fill="#5e5e63"/>
      <rect x="880" y="424" width="20" height="112" rx="4" fill="#5e5e63"/>
      <path d="M520 479h360" stroke="#5e5e63" stroke-width="2"/>
      <ellipse cx="700" cy="405" rx="24" ry="6" fill="#ffb347"/>
      <ellipse cx="800" cy="405" rx="9" ry="3" fill="#3a3a3c"/>
      <path class="stream-glow" d="M572 212 C 620 236 690 286 692 402 L 708 402 C 708 280 650 228 596 204 Z" fill="#ff8a1f" filter="url(#fc-blur)" opacity=".8"/>
      <path class="stream" d="M576 212 C 622 238 692 288 694 402 L 706 402 C 706 284 646 230 594 206 Z" fill="url(#fc-metal)"/>
      <g fill="#ffcf70">
        <circle class="spark s1" cx="664" cy="384" r="3"/><circle class="spark s2" cx="744" cy="378" r="2.2"/>
        <circle class="spark s3" cx="724" cy="356" r="2.6"/><circle class="spark s4" cx="676" cy="362" r="1.8"/>
      </g>
      <path d="M470 236 L 190 312 M 488 276 L 214 362" stroke="#4a4a4e" stroke-width="11" stroke-linecap="round"/>
      <g transform="translate(468 116) rotate(40)">
        <path d="M0 0h150l-14 150a14 14 0 0 1-14 12H28a14 14 0 0 1-14-12z" fill="url(#fc-graphite)"/>
        <ellipse cx="75" cy="0" rx="75" ry="15" fill="#48484c"/>
        <ellipse cx="78" cy="2" rx="60" ry="9" fill="url(#fc-metal)"/>
      </g>
    </svg>`;

  const PIN = '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M18 32s10-9.5 10-17a10 10 0 0 0-20 0c0 7.5 10 17 10 17z"/><circle cx="18" cy="15" r="3.5"/></svg>';

  views.home = () => {
    const kit = catalog.byId('kit-inici');
    const freeFrom = config.shipping.zones?.[0]?.freeFrom || 0;
    const free = pricing.rawMoney(freeFrom);
    const hasTiers = catalog.list({}).some((p) => (p.tiers || []).length);
    const cats = catalog.categories().map((c) => ({ c, p: catalog.list({ cat: c.id })[0] })).filter((x) => x.p || x.c.image);
    const h = catalog.home();
    return `
    <section class="hero-dark ${h.heroImage ? 'has-photo' : ''}">
      ${h.heroImage ? `<img class="hero-photo" src="${esc(h.heroImage)}" alt="">` : ''}
      <div class="wrap hero-copy">
        <h1>${esc(h.heroTitle || t('Tot per fondre metall.'))}</h1>
        <p class="lead">${esc(h.heroLead || t('Sorres, crisols, forns i peces a mida. Fet i enviat des de Manresa.'))}</p>
        <div class="cta-row">
          <a class="btn btn-lg btn-light" href="#/botiga">${t('Compra ara')}</a>
          <a class="btn btn-lg btn-outline-light" href="#/#serveis">${t('Encarrega una peça')}</a>
        </div>
      </div>
      ${h.heroImage ? '' : `<div class="hero-art">${POUR_ART(t('Il·lustració d\'un crisol abocant metall fos en un motlle de sorra'))}</div>`}
    </section>

    <section class="trust">
      <div class="wrap trust-grid">
        <div>${ICON.truck}<span><b>${t('Tria el transportista')}</b>${freeFrom > 0 ? t('Gratis a partir de {free}.', { free }) : t('Preu real de cada transportista, al pagament.')}</span></div>
        ${hasTiers ? `<div>${ICON.stack}<span><b>${t('Preus per volum')}</b>${t('Descompte automàtic a la cistella.')}</span></div>` : `<div>${ICON.stack}<span><b>${t('Pagament segur')}</b>${t('Amb targeta, a la pàgina segura de Stripe.')}</span></div>`}
        <div>${ICON.doc}<span><b>${t('Factura d\'empresa')}</b>${t('Amb NIF i preus sense IVA.')}</span></div>
        <div>${PIN}<span><b>${t('Fet a Manresa')}</b>${t('Taller propi a la Catalunya central.')}</span></div>
      </div>
    </section>

    <section class="svc-home" id="serveis">
      <div class="wide">
        <div class="svc-home-head">
          <div>
            <h2>${t('Fabriquem la teva peça.')}</h2>
            <p>${t('Fundició, mecanitzat, disseny CAD/CAM i impressió 3D en un sol taller. Resposta en 24 hores.')}</p>
          </div>
          <a class="btn btn-lg" href="#/#pressupost-rapid">${t('Demana pressupost')}</a>
        </div>
        <div class="svc-grid">
          ${catalog.services().map((x) => `
            <article class="svc-card">
              ${ICON[x.icon]}
              <h3>${esc(x.name)}</h3>
              <p>${esc(x.short)}</p>
              <div class="svc-links">
                <a class="link" href="#/servei/${x.slug}">${t('Més informació')}</a>
                <a class="link" href="#/servei/${x.slug}#pressupost">${t('Demana pressupost')}</a>
              </div>
            </article>`).join('')}
        </div>
        <div class="quick" id="pressupost-rapid">
          <div class="quick-how">
            <h3>${t('Com funciona')}</h3>
            <ol>
              ${[
                ['Explica\'ns què necessites', 'Un plànol, una foto, una mostra o només la idea.'],
                ['Rep el pressupost', 'Preu per unitat i per volum, sense compromís.'],
                ['Fabriquem i t\'ho enviem', 'Des del nostre taller de Manresa.'],
              ].map(([h, p], i) => `<li><span class="n">${i + 1}</span><div><b>${t(h)}</b><span>${t(p)}</span></div></li>`).join('')}
            </ol>
            ${catalog.customParts()[0] ? `<p class="quick-proof">${t('Preus de referència: {part}, des de {price}/u.', { part: esc(catalog.customParts()[0].name), price: pricing.rawMoney(catalog.customParts()[0].unit) })}</p>` : ''}
          </div>
          <form class="quick-form" id="quote" novalidate>
            <h3>${t('Pressupost ràpid')}</h3>
            <p class="muted small">${t('Sense compromís. Et responem en 24 hores laborables.')}</p>
            <div class="field-row">
              <label class="field"><span>${t('Nom o empresa')}</span><input name="name" required></label>
              <label class="field"><span>${t('Correu electrònic')}</span><input name="email" type="email" required></label>
            </div>
            <label class="field"><span>${t('Servei')}</span><select name="service">${catalog.services().map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
            <label class="field"><span>${t('Què necessites')}</span><textarea name="part" rows="3" required placeholder="${esc(t('Casquet guia Ø 3,80 mm, recanvi de bronze, prototip…'))}"></textarea></label>
            <button class="btn btn-lg btn-block" type="submit">${t('Envia la sol·licitud')}</button>
          </form>
        </div>
      </div>
    </section>

    <section class="section cats-section">
      <div class="wide">
        <div class="section-title"><h2>${t('Compra per categoria.')}</h2></div>
        <div class="cat-tiles">
          ${cats.map(({ c, p }) => `
            <a class="cat-tile" href="#/botiga?cat=${c.id}">
              ${c.image ? `<img class="art" src="${esc(c.image)}" alt="" loading="lazy">` : art(p)}
              <span><b>${esc(c.name)}</b><span class="link">${t('Veure-ho tot')}</span></span>
            </a>`).join('')}
        </div>
      </div>
    </section>

    ${promos()}

    <section class="tiles">
      ${kit ? `<article class="tile">
        <h2>${t('Kit d\'iniciació')}</h2>
        <p>${t('Tot el que cal per a la primera colada.')}</p>
        <div class="cta-row">
          <button class="btn" data-add="${kit.id}">${t('Compra')}</button>
          <a class="link" href="#/producte/${kit.slug}">${t('Més informació')}</a>
        </div>
        ${art(kit)}
      </article>` : `<article class="tile">
        <h2>${t('Peces a mida')}</h2>
        <p>${t('Fundició, mecanitzat, CAD/CAM i impressió 3D per encàrrec.')}</p>
        <div class="cta-row">
          <a class="btn" href="#/#pressupost-rapid">${t('Demana pressupost')}</a>
        </div>
      </article>`}
      <article class="tile tile-dark">
        <h2>${t('Guia de fosa en sorra')}</h2>
        <p>${t('Aprèn a fondre en sis passos.')}</p>
        <div class="cta-row">
          <a class="btn" href="#/guia">${t('Llegeix la guia')}</a>
        </div>
        <ol class="spec-list guide-mini">
          ${['Prepara la sorra', 'Fes el motlle', 'Obre els canals', 'Treu el model', 'Fon i cola', 'Desemmotlla'].map((x, i) => `<li><span>${i + 1}. ${t(x)}</span></li>`).join('')}
        </ol>
      </article>
    </section>

    <div class="wide" style="padding-block:72px 96px">${row(recommend.personalised() ? 'Recomanats per a tu' : 'Imprescindibles del taller', recommend.forYou(10), { link: '#/botiga', linkText: 'Veure tota la botiga' })}</div>`;
  };

  // Els recomanats ara viuen dins la botiga.
  views.recomanats = () => { location.replace('#/botiga'); return ''; };

  views.botiga = (params) => {
    const cat = params.get('cat') || '';
    const q = params.get('q') || '';
    const sort = params.get('sort') || '';
    const items = catalog.list({ cat, q, sort });
    const current = cat ? catalog.category(cat) : null;
    const chip = (id, name) => `<a class="chip ${cat === id ? 'is-on' : ''}" href="#/botiga${id ? `?cat=${id}` : ''}">${esc(name)}</a>`;
    return `
    <section class="wrap page-head">
      <h1>${current ? esc(current.name) : t('Botiga')}</h1>
      <p class="lead">${current ? esc(current.blurb) : t('Material de fosa provat al nostre taller.')}</p>
    </section>
    <section class="wrap" style="padding-bottom:96px">
      <div class="toolbar">
        <div class="chips">${chip('', t('Tot'))}${catalog.categories().map((c) => chip(c.id, c.name)).join('')}</div>
        <div class="toolbar-right">
          <label class="search"><span class="sr">${t('Cerca')}</span><input type="search" id="q" placeholder="${t('Cerca')}" value="${esc(q)}"></label>
          <label><span class="sr">${t('Ordena')}</span>
            <select id="sort">
              <option value="">${t('Destacats')}</option>
              <option value="preu-asc" ${sort === 'preu-asc' ? 'selected' : ''}>${t('Preu: de menys a més')}</option>
              <option value="preu-desc" ${sort === 'preu-desc' ? 'selected' : ''}>${t('Preu: de més a menys')}</option>
            </select>
          </label>
        </div>
      </div>
      ${!q && !cat ? `<div class="shop-recs">${row(recommend.personalised() ? 'Recomanats per a tu' : 'Imprescindibles del taller', recommend.forYou(10), { sub: recommend.personalised() ? 'Complements del que has mirat.' : 'Per començar a fondre.' })}</div>` : ''}
      <p class="muted count">${t(items.length === 1 ? '{n} producte · preus {vat}' : '{n} productes · preus {vat}', { n: items.length, vat: vatLabel() })}</p>
      ${items.length ? `<div class="grid">${items.map(card).join('')}</div>` : q
        ? `<div class="empty"><h3>${t('Cap resultat per a “{q}”', { q: esc(q) })}</h3><p>${t('Prova una altra cerca o <a href="#/contacte">demana-ho a mida</a>.')}</p></div>`
        : `<div class="empty"><h3>${t('Aviat hi haurà productes aquí.')}</h3><p>${t('Si busques alguna cosa concreta, <a href="#/contacte">demana-ho</a> i te la busquem.')}</p></div>`}
    </section>`;
  };

  views.producte = (_, slug) => {
    const p = catalog.bySlug(slug);
    if (!p) return views.notFound();
    const related = catalog.list().filter((x) => x.id !== p.id).slice(0, 4);
    const tiers = p.tiers || [];
    return `
    <nav class="wrap crumbs" aria-label="${t('Ruta')}"><a href="#/botiga">${t('Botiga')}</a> › <a href="#/botiga?cat=${p.category}">${esc(catalog.category(p.category).name)}</a></nav>
    <section class="wrap pdp">
      <div>
        <div class="pdp-media" data-main-image>${art(p)}</div>
        ${(p.images || []).length > 1 ? `<div class="thumbs">${p.images.map((src, i) => `<button type="button" class="thumb ${i ? '' : 'is-on'}" data-thumb="${esc(src)}" aria-label="${esc(fullName(p))} ${i + 1}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div class="pdp-info">
        ${tag(p)}
        <h1>${esc(p.name)}<span class="variant">${esc(p.variant)}</span></h1>
        <p class="lead">${esc(p.short)}</p>
        <div class="pdp-price">
          <span class="price" data-unit>${m(p.price)}</span>
          <span class="small">${vatLabel()} · ${t('Ref.')} ${esc(p.sku)}</span>
        </div>
        ${tiers.length ? `
        <table class="tiers">
          <caption>${t('Preu per volum')}</caption>
          <tr><th>${t('Unitats')}</th><th>${t('Preu per unitat')}</th><th>${t('Estalvi')}</th></tr>
          <tr><td>1–${tiers[0].min - 1}</td><td>${m(p.price)}</td><td>—</td></tr>
          ${tiers.map((x, i) => `<tr><td>${x.min}${tiers[i + 1] ? `–${tiers[i + 1].min - 1}` : t(' o més')}</td><td>${m(p.price * (1 - x.off))}</td><td class="save">${Math.round(x.off * 100)}%</td></tr>`).join('')}
        </table>` : ''}
        <div class="buy">
          <div class="qty" data-qty>
            <button type="button" data-step="-1" aria-label="${t('Menys')}">−</button>
            <input type="number" min="1" max="99" value="1" aria-label="${t('Quantitat')}" id="qty">
            <button type="button" data-step="1" aria-label="${t('Més')}">+</button>
          </div>
          <button class="btn btn-lg" data-add-qty="${p.id}">${t('Afegeix a la cistella')}</button>
        </div>
        <div class="delivery">
          ${p.stock < 10 ? `<span class="low">${t('Només en queden {n}.', { n: p.stock })}</span>` : `<span class="ok">${t('En estoc.')}</span>`}
          <span><b>${t('Enviament:')}</b> ${p.oversize
            ? t('per agència, {price} a la Península.', { price: m(p.shipFixed || 0) })
            : config.shipping.packlink?.enabled ? t('el tries al pagament, amb el preu real de cada transportista.')
            : (config.shipping.zones?.[0]?.freeFrom || 0) > 0 ? t('des de {price} a la Península, gratuït a partir de {free}.', { price: m(SHIP.fromPrice(config.shipping, p) ?? 0), free: pricing.rawMoney(config.shipping.zones[0].freeFrom) })
            : t('des de {price} a la Península.', { price: m(SHIP.fromPrice(config.shipping, p) ?? 0) })} ${t('Entrega estimada a la Península: {range}.', { range: etaRange('peninsula', 'home') })}</span>
          ${config.shipping.pickup?.enabled ? `<span><b>${t('Recollida:')}</b> ${t('gratuïta al taller de Manresa.')}</span>` : ''}
          <span><b>${t('Devolucions:')}</b> ${t('14 dies.')}</span>
        </div>
        <div class="specs"><h2>${t('Especificacions')}</h2><dl style="margin:0">${Object.entries(p.specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>
        <div class="prose">${p.description.map((d) => `<p>${esc(d)}</p>`).join('')}</div>
      </div>
    </section>
    <div class="wrap">${bundle(p.id)}</div>
    <section class="section section-alt">
      <div class="wrap">
        <div class="section-title"><h2>${t('També et pot interessar.')}</h2></div>
        <div class="grid">${related.map(card).join('')}</div>
      </div>
    </section>`;
  };

  views.cistella = () => {
    const lines = cart.detail();
    if (!lines.length) {
      return `<section class="wrap empty-cart"><h1>${t('La cistella és buida.')}</h1><p class="lead">${t('La PetroBond és un bon punt de partida.')}</p><a class="btn btn-lg" href="#/botiga">${t('Continua comprant')}</a></section>`;
    }
    const tot = cart.totals();
    const freeFrom = config.shipping.zones?.[0]?.freeFrom || 0;
    const pct = freeFrom > 0 ? Math.min(100, (tot.subtotal / freeFrom) * 100) : 0;
    return `
    <section class="wrap page-head"><h1>${t('Cistella')}</h1><p class="lead">${t('Total: {total}', { total: m(tot.total) })}</p></section>
    <section class="wrap checkout-grid">
      <div>
        ${freeFrom > 0 ? `<div class="ship-meter">
          <p>${tot.toFree > 0 ? t('Afegeix {amount} més per tenir enviament gratuït.', { amount: pricing.rawMoney(tot.toFree) }) : t('Tens enviament gratuït.')}</p>
          <div class="meter"><span style="width:${pct}%"></span></div>
        </div>` : ''}
        <ul class="lines">
          ${lines.map((l) => `
          <li class="line">
            <a href="#/producte/${l.product.slug}" class="line-media">${art(l.product)}</a>
            <div class="line-info">
              <h3><a href="#/producte/${l.product.slug}">${esc(l.product.name)}</a></h3>
              <p>${esc(l.product.variant)}</p>
              <p>${t('{price} per unitat', { price: m(l.unit) })}${l.saved > 0 ? ` · <span class="save">${t('estalvies {amount}', { amount: m(l.saved) })}</span>` : ''}</p>
            </div>
            <div class="qty qty-sm" data-line="${l.id}">
              <button type="button" data-step="-1" aria-label="${t('Menys')}">−</button>
              <input type="number" min="1" max="99" value="${l.qty}" aria-label="${t('Quantitat')}">
              <button type="button" data-step="1" aria-label="${t('Més')}">+</button>
            </div>
            <span class="line-total">${m(l.total)}</span>
            <button class="icon-btn" data-remove="${l.id}" aria-label="${esc(t('Treu {name}', { name: l.product.name }))}">✕</button>
          </li>`).join('')}
        </ul>
      </div>
      ${summary(tot, `<a class="btn btn-lg btn-block" href="#/checkout">${t('Tramita la comanda')}</a>`, t('Enviament estimat (Península)'))}
    </section>
    <div class="wide" style="padding-bottom:72px">${row('Completa la teva compra', recommend.completeCart(), { sub: 'Complements del que tens a la cistella.' })}</div>`;
  };

  // ---------- Enviament ----------
  const SHIP_LABEL = {
    home: ['Enviament a domicili', 'Entrega en 24–72 h laborables.'],
    express: ['Express 24 h', 'Entrega prioritària en 24 h laborables.'],
    pickup: ['Recollida al taller', 'Et diem quan està a punt per recollir a {place}.'],
  };
  const shipName = (id) => t(SHIP_LABEL[id]?.[0] || 'Enviament');
  const SHIP = window.FundicatShipping;

  // Dates estimades d'entrega (dies laborables; els paràmetres es canvien al panell).
  const fmtDay = (d) => d.toLocaleDateString(window.I18N.lang, { weekday: 'short', day: 'numeric', month: 'short' });
  function etaRange(zoneId, method, shippedAt, hours) {
    const e = hours
      ? SHIP.etaHours(config.shipping, hours, new Date(), shippedAt ? new Date(shippedAt) : null)
      : SHIP.eta(config.shipping, zoneId, method === 'carrier' ? 'home' : method, new Date(), shippedAt ? new Date(shippedAt) : null);
    const a = fmtDay(e.from); const b = fmtDay(e.to);
    return a === b ? a : `${a} – ${b}`;
  }

  function shipOptionsHTML(q, selected) {
    const warn = q.unavailable === 'zone'
      ? t('De moment no enviem a aquesta adreça. Pots recollir la comanda al taller o escriure\'ns a {email}.', { email: `<a href="mailto:${CONTACT.email}">${CONTACT.email}</a>` })
      : q.unavailable === 'heavy'
        ? t('La comanda pesa més de 30 kg. Escriu-nos a {email} i et preparem l\'enviament.', { email: `<a href="mailto:${CONTACT.email}">${CONTACT.email}</a>` })
        : '';
    const hasCarriers = q.options.some((o) => o.kind === 'carrier');
    const loading = !hasCarriers && carriers.loading;
    return `${warn && !hasCarriers ? `<p class="ship-warn">${warn}</p>` : ''}
      ${loading ? `<p class="muted small">${t('Consultant els preus dels transportistes…')}</p>` : ''}
      <div class="pay-options">${q.options.map((o) => `
        <label class="pay ship-opt">
          <input type="radio" name="shipping" value="${esc(o.id)}" ${o.id === selected ? 'checked' : ''}>
          <span>${o.kind === 'carrier' ? `${esc(o.carrier)}${o.name ? ` · ${esc(o.name)}` : ''}` : shipName(o.id)}<small>${o.id === 'pickup' ? t(SHIP_LABEL[o.id][1], { place: esc(config.shipping.pickup?.address || 'Manresa') }) : o.kind === 'carrier' ? t('Entrega estimada: {range}.', { range: etaRange(q.zoneId, 'carrier', null, o.hours || 24) }) : t('Entrega estimada: {range}.', { range: etaRange(q.zoneId, o.id) })}</small></span>
          <b>${o.price ? m(o.price) : t('Gratuït')}</b>
        </label>`).join('')}
      </div>`;
  }

  function summary(tot, action, shipLabel = t('Enviament')) {
    return `
      <aside class="summary" data-summary>
        <h2>${t('Resum')}</h2>
        <dl>
          <div><dt>${t('Subtotal')}</dt><dd>${m(tot.subtotal)}</dd></div>
          ${tot.saved > 0 ? `<div class="save"><dt>${t('Descompte per volum')}</dt><dd>−${m(tot.saved)}</dd></div>` : ''}
          <div><dt>${shipLabel}</dt><dd>${tot.shipping ? m(tot.shipping) : t('Gratuït')}</dd></div>
          <div class="total"><dt>${t('Total')}</dt><dd>${m(tot.total)}</dd></div>
        </dl>
        <p class="muted small">${pricing.showNet ? t('Cal afegir-hi un IVA del 21%: {vat}.', { vat: pricing.rawMoney(tot.vat) }) : t('Inclou {vat} d\'IVA.', { vat: pricing.rawMoney(tot.vat) })}</p>
        ${action}
        <ul class="assure small muted">
          <li>${t('Pagament segur amb targeta, Apple Pay, Google Pay o transferència.')}</li>
          <li>${t('Factura amb NIF a cada comanda.')}</li>
          <li>${t('Devolucions en 14 dies.')}</li>
        </ul>
      </aside>`;
  }

  views.checkout = () => {
    if (!cart.count()) { location.hash = '#/cistella'; return ''; }
    const tot = cart.totals();
    return `
    <section class="wrap page-head"><h1>${t('Tramitació')}</h1></section>
    <form class="wrap checkout-grid" id="checkout" novalidate>
      <div>
        <fieldset>
          <legend>${t('Contacte')}</legend>
          <div class="field-row">
            <label class="field"><span>${t('Nom i cognoms')}</span><input name="name" required autocomplete="name"></label>
            <label class="field"><span>${t('Correu electrònic')}</span><input name="email" type="email" required autocomplete="email"></label>
          </div>
          <div class="field-row">
            <label class="field"><span>${t('Telèfon')}</span><input name="phone" type="tel" autocomplete="tel" required minlength="9" maxlength="20" pattern="[0-9 +()\-]{9,20}" title="${t('El transportista el necessita per lliurar el paquet.')}"></label>
            <label class="field"><span>${t('NIF o CIF')} <em>${t('(opcional)')}</em></span><input name="nif"></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>${t('Adreça d\'enviament')}</legend>
          <label class="field"><span>${t('Adreça')}</span><input name="address" required autocomplete="street-address"></label>
          <div class="field-row field-row-3">
            <label class="field"><span>${t('Codi postal')}</span><input name="zip" required autocomplete="postal-code" inputmode="numeric"></label>
            <label class="field"><span>${t('Població')}</span><input name="city" required autocomplete="address-level2"></label>
            <label class="field"><span>${t('País')}</span><select name="country">${config.countries.map((c) => `<option value="${c}">${t(c)}</option>`).join('')}</select></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>${t('Enviament')}</legend>
          <div id="ship-options">${shipOptionsHTML(tot.quote, tot.option?.id)}</div>
        </fieldset>
        <fieldset>
          <legend>${t('Pagament')}</legend>
          <div class="pay-options">
            ${payments.methods.map((pm, i) => `
              <label class="pay"><input type="radio" name="method" value="${pm.id}" ${i === 0 ? 'checked' : ''}><span>${t(pm.name)}<small>${t(pm.note)}</small></span></label>`).join('')}
          </div>
        </fieldset>
        <p class="form-error" id="form-error" hidden>${t('Revisa els camps marcats.')}</p>
      </div>
      ${checkoutSummary(tot)}
    </form>`;
  };
  const checkoutSummary = (tot) => summary(tot, `<button class="btn btn-lg btn-block" type="submit" ${tot.option ? '' : 'disabled'}>${t('Paga {total}', { total: m(tot.total) })}</button><p class="muted small legal-note">${t('En pagar acceptes les {link}.', { link: `<a href="#/legal/condicions">${t('condicions de venda')}</a>` })}</p>`, tot.option ? (tot.option.kind === 'carrier' ? esc(tot.option.carrier) : shipName(tot.option.id)) : t('Enviament'));

  views.comanda = (params) => {
    const o = payments.lastOrder();
    if (!o) return views.notFound();
    // Tornada de Stripe després de pagar: ara sí, es buida la cistella.
    const paid = params.get('pagat') === '1' && params.get('n') === o.number;
    if (paid && cart.count()) setTimeout(() => cart.clear());
    const bank = config.bank || {};
    const transfer = o.method === 'transfer';
    return `
    <section class="wrap done">
      <div class="done-mark" aria-hidden="true">✓</div>
      <h1>${t(paid ? 'Pagament rebut. Gràcies!' : 'Gràcies per la comanda.')}</h1>
      <p class="lead">${t('Comanda {number}. T\'enviarem la confirmació a {email}.', { number: esc(o.number), email: esc(o.customer.email) })}</p>
      ${transfer ? `
      <div class="bank-box">
        <h2>${t('Dades per a la transferència')}</h2>
        ${bank.iban ? `<dl>
          <div><dt>${t('Titular')}</dt><dd>${esc(bank.holder || 'Fundicat SL')}</dd></div>
          <div><dt>IBAN</dt><dd class="mono">${esc(bank.iban)}</dd></div>
          <div><dt>${t('Import')}</dt><dd>${pricing.rawMoney(o.totals.total)}</dd></div>
          <div><dt>${t('Concepte')}</dt><dd class="mono">${esc(o.number)}</dd></div>
        </dl>` : `<p>${t('T\'enviarem les dades bancàries per correu.')}</p>`}
        <p class="muted small">${t('Prepararem la comanda quan rebem la transferència.')}</p>
      </div>` : ''}
      ${o.delivery && o.delivery.method !== 'pickup' && !transfer ? `<p>${t('Entrega estimada: {range}.', { range: etaRange(o.delivery.zone || 'peninsula', o.delivery.method, null, o.delivery.transitHours) })}</p>` : ''}
      ${o.delivery && o.delivery.method !== 'pickup' && tracking.available ? `<p class="muted small">${t('Quan tinguis el paquet, pots seguir-lo a <a href="#/seguiment">Seguiment</a> amb el número de comanda i el correu.')}</p>` : ''}
      <p class="muted small">${t('Total')} ${pricing.rawMoney(o.totals.total)} · ${t(payments.methods.find((x) => x.id === o.method)?.name || '')}${o.delivery ? ` · ${o.delivery.method === 'carrier' ? esc(o.delivery.name || '') : shipName(o.delivery.method)}` : ''}</p>
      <a class="btn" href="#/botiga">${t('Continua comprant')}</a>
    </section>`;
  };

  // Cada servei té la seva pàgina; l'antiga llista porta al bloc de serveis de la portada
  // (o al formulari de contacte si l'enllaç anava al pressupost).
  views.serveis = () => {
    location.replace(parse().anchor === 'pressupost' ? '#/contacte#pressupost' : '#/#serveis');
    return '';
  };

  views.servei = (_, slug) => {
    const s = catalog.service(slug);
    if (!s) return views.notFound();
    const parts = catalog.customParts();
    const others = catalog.services().filter((x) => x.id !== s.id);
    return `
    <nav class="wrap crumbs" aria-label="${t('Ruta')}"><a href="#/#serveis">${t('Serveis')}</a></nav>
    <section class="hero">
      <div class="wrap" style="padding-bottom:72px">
        <div class="svc-hero-icon">${ICON[s.icon]}</div>
        <h1>${esc(s.name)}</h1>
        <p class="lead" style="max-width:680px;margin-inline:auto">${esc(s.lead)}</p>
        <div class="cta-row"><a class="btn" href="#/servei/${s.slug}#pressupost">${t('Demana pressupost')}</a></div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="wrap">
        <div class="points">${s.points.map(([h, p]) => `<div><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
        ${s.showPrices ? `
        <div class="ref-prices">
          <h2>${t('Preus de referència')}</h2>
          <p class="muted">${t('Preus de comandes recents, sense IVA. Com més unitats, millor és el preu.')}</p>
          <table class="table">
            <tr><th>${t('Peça')}</th><th>${t('Unitats')}</th><th>${t('Preu per unitat')}</th></tr>
            ${parts.map((p) => `<tr><td>${esc(p.name)}</td><td>${p.qty}</td><td>${pricing.rawMoney(p.unit)}</td></tr>`).join('')}
          </table>
        </div>` : ''}
        <div class="uses"><h3>${t('Aplicacions')}</h3><ul>${s.uses.map((u) => `<li>${esc(u)}</li>`).join('')}</ul></div>
      </div>
    </section>
    <section class="section" id="pressupost">${quoteForm(s.id)}</section>
    <section class="section section-alt">
      <div class="wrap">
        <div class="section-title"><h2>${t('Altres serveis.')}</h2></div>
        <div class="svc-grid svc-grid-4">${others.map((o) => `<a class="svc-card" href="#/servei/${o.slug}">${ICON[o.icon]}<h3>${esc(o.name)}</h3><p>${esc(o.short)}</p></a>`).join('')}</div>
      </div>
    </section>`;
  };

  // Enllaços antics
  views['a-mida'] = () => views.servei(null, 'mecanitzat');

  const GUIDE = [
    ['Prepara la sorra', 'Tamisa la PetroBond i desfés els grumolls. Ha de compactar-se a la mà i trencar-se net.'],
    ['Fes el motlle', 'Posa el model a la meitat inferior del flascó, aplica pols separadora i compacta la sorra fins dalt.'],
    ['Obre els canals', 'Gira el flascó, col·loca la meitat superior, torna a compactar i obre el bebedor i els respiradors.'],
    ['Treu el model', 'Separa les meitats amb cura, treu el model i torna a tancar el flascó amb les guies.'],
    ['Fon i cola', 'Fon el metall al crisol amb una mica de bòrax i aboca\'l d\'una sola vegada.'],
    ['Desemmotlla', 'Deixa refredar la peça, obre el flascó i guarda la sorra per a la propera colada.'],
  ];

  views.guia = () => `
    <section class="wrap page-head center">
      <h1>${t('Guia de fosa en sorra')}</h1>
      <p class="lead">${t('Sis passos per a la primera colada amb PetroBond. Treballa sempre amb ulleres, guants i bona ventilació.')}</p>
    </section>
    <section class="wrap guide">
      ${GUIDE.map(([h, p], i) => `<article class="guide-step"><span class="n">${t('Pas {n}', { n: i + 1 })}</span><h3>${t(h)}</h3><p>${t(p)}</p></article>`).join('')}
    </section>
    <section class="section center">
      ${catalog.byId('kit-inici')
        ? `<a class="btn btn-lg" href="#/producte/${catalog.byId('kit-inici').slug}">${t('Veure el kit d\'iniciació')}</a>`
        : `<a class="btn btn-lg" href="#/botiga">${t('Veure el material de fosa')}</a>`}
    </section>`;

  // ---------- Seguiment de la comanda ----------
  // El client escriu número de comanda + correu; la base de dades només respon si coincideixen
  // i només torna estat i seguiment (mai adreça, telèfon ni productes).
  views.seguiment = (params) => {
    const last = payments.lastOrder();
    const number = params.get('n') || last?.number || '';
    const email = last && last.number === number ? last.customer?.email || '' : '';
    return `
    <section class="wrap page-head"><h1>${t('Segueix la teva comanda')}</h1><p class="lead">${t('Escriu el número de comanda i el correu amb què has comprat.')}</p></section>
    <section class="wrap track">
      <form id="track-form" class="track-form" novalidate>
        <div class="field-row">
          <label class="field"><span>${t('Número de comanda')}</span><input name="number" required autocomplete="off" placeholder="FC-2026-0001" value="${esc(number)}" maxlength="30"></label>
          <label class="field"><span>${t('Correu electrònic')}</span><input name="email" type="email" required autocomplete="email" value="${esc(email)}"></label>
        </div>
        <button class="btn" type="submit">${t('Consulta la comanda')}</button>
      </form>
      <div id="track-result" aria-live="polite"></div>
    </section>`;
  };

  const TRACK_STEPS = ['Comanda rebuda', 'Preparant', 'En camí', 'Lliurada'];
  const TRACK_INDEX = { nova: 0, pagada: 1, enviada: 2, lliurada: 3 };
  function trackHTML(r) {
    const day = (iso) => new Date(iso).toLocaleDateString(window.I18N.lang, { weekday: 'long', day: 'numeric', month: 'long' });
    const cancelled = r.status === 'cancel·lada';
    const idx = TRACK_INDEX[r.status] ?? 0;
    const pickup = r.method === 'pickup';
    const steps = pickup ? ['Comanda rebuda', 'Preparant', 'Lliurada'] : TRACK_STEPS;
    const cur = pickup && idx === 3 ? 2 : idx;
    const url = /^https:\/\//.test(r.trackingUrl || '') ? r.trackingUrl : '';
    const expected = !cancelled && !pickup && r.status !== 'lliurada' && r.status !== 'nova'
      ? `<p class="track-eta"><b>${t('Entrega estimada: {range}.', { range: etaRange(r.zone || 'peninsula', r.method, r.shippedAt, r.transitHours) })}</b></p>` : '';
    return `
    <div class="track-card">
      <h2>${esc(r.number)}${r.status === 'nova' ? ` <span class="track-tag">${t('Pendent de pagament')}</span>` : ''}</h2>
      ${cancelled ? `<p>${t('Aquesta comanda s\'ha cancel·lat.')}</p>` : `
      <ol class="track-steps">${steps.map((s, i) => `<li class="${i < cur ? 'is-done' : i === cur ? 'is-now' : ''}"><span></span>${t(pickup && s === 'Lliurada' ? 'Recollida al taller' : s)}</li>`).join('')}</ol>
      ${expected}
      ${r.shippedAt ? `<p class="muted">${t('Sortida: {date}', { date: day(r.shippedAt) })}</p>` : ''}
      ${r.deliveredAt ? `<p class="muted">${t('Lliurada el {date}', { date: day(r.deliveredAt) })}</p>` : ''}
      ${r.carrierStatus ? `<p class="muted">${t('Estat del transportista: {status}', { status: esc(r.carrierStatus) })}</p>` : ''}
      ${r.tracking ? `<dl class="track-dl">
        ${r.carrier ? `<div><dt>${t('Transportista')}</dt><dd>${esc(r.carrier)}</dd></div>` : ''}
        <div><dt>${t('Número de seguiment')}</dt><dd class="mono">${esc(r.tracking)}</dd></div>
      </dl>${url ? `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${t('Segueix el paquet al transportista')}</a>` : ''}`
        : (!pickup && r.status === 'pagada' ? `<p class="muted">${t('Encara no ha sortit. Quan el paquet surti, aquí hi veuràs el seguiment.')}</p>` : '')}`}
    </div>`;
  }

  views.contacte = () => `
    <section class="hero">
      <div class="wrap" style="padding-bottom:56px">
        <h1>${t('Parla amb nosaltres.')}</h1>
        <p class="lead" style="max-width:620px;margin-inline:auto">${t('Escriu-nos, truca\'ns o demana pressupost. Responem en 24 hores laborables.')}</p>
      </div>
    </section>
    <section class="wrap contact-cards">
      <a class="contact-card" href="mailto:${CONTACT.email}">
        <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="28" height="20" rx="3"/><path d="M5 10l13 10 13-10"/></svg>
        <span>${t('Correu')}</span><b>${CONTACT.email}</b>
      </a>
      <a class="contact-card" href="tel:${CONTACT.phoneIntl}">
        <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M10 4h6l2 7-4 3a18 18 0 0 0 8 8l3-4 7 2v6a3 3 0 0 1-3 3C15 29 7 21 7 7a3 3 0 0 1 3-3z"/></svg>
        <span>${t('Telèfon')}</span><b>${CONTACT.phone}</b>
      </a>
      <div class="contact-card">
        <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M18 32s10-9.5 10-17a10 10 0 0 0-20 0c0 7.5 10 17 10 17z"/><circle cx="18" cy="15" r="3.5"/></svg>
        <span>${t('Taller')}</span><b>${t('Manresa (Barcelona)')}</b>
      </div>
    </section>
    <section class="section" id="pressupost">${quoteForm()}</section>`;

  // ---------- Textos legals (js/legal.js) ----------
  views.legal = (_, page) => {
    const L = window.FundicatLegal;
    if (!L || !L.pages.includes(page)) return views.notFound();
    const lang = window.I18N.lang;
    return `<article class="wrap legal"><h1>${esc(L.title(page, lang))}</h1>${L.html(page, lang, config)}</article>`;
  };

  views.notFound = () => `<section class="wrap empty-cart"><h1>${t('No hem trobat aquesta pàgina.')}</h1><a class="btn" href="#/">${t('Torna a l\'inici')}</a></section>`;

  // ---------- Enrutador ----------
  function parse() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [pathPart, query = ''] = raw.split('?');
    const [path, anchor] = pathPart.split('#');
    const [name, arg] = path.split('/');
    return { name: name || 'home', arg, params: new URLSearchParams(query), anchor };
  }

  function render() {
    const { name, arg, params, anchor } = parse();
    const view = views[name] || views.notFound;
    rowSeq = 0;
    paintBar();
    main.innerHTML = view(params, arg);
    const navKey = name === 'botiga' && params.get('cat') ? params.get('cat') : ['servei', 'a-mida'].includes(name) ? 'serveis' : name;
    const svcId = name === 'servei' ? catalog.service(arg)?.id : null;
    $$('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === navKey || a.dataset.nav === svcId));
    closeMenus();
    if (anchor) document.getElementById(anchor)?.scrollIntoView(); // salt directe: la vista s'acaba de pintar
    else window.scrollTo(0, 0);
    bind(name, arg);
    updateCount();
  }

  function markInvalid(form) {
    const invalid = $$('[required]', form).filter((f) => !f.checkValidity());
    $$('.field', form).forEach((f) => f.classList.remove('is-bad'));
    invalid.forEach((f) => f.closest('.field').classList.add('is-bad'));
    if (invalid.length) invalid[0].focus();
    return invalid.length > 0;
  }

  function bind(name, arg) {
    if (name === 'seguiment') {
      const form = $('#track-form'); const out = $('#track-result');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (markInvalid(form)) return;
        const btn = $('button', form); btn.disabled = true; btn.textContent = t('Consultant…'); out.innerHTML = '';
        try {
          const r = await tracking.lookup(form.number.value, form.email.value);
          out.innerHTML = r ? trackHTML(r) : `<p class="ship-warn">${t('No trobem cap comanda amb aquestes dades. Revisa el número i el correu amb què vas comprar.')}</p>`;
        } catch (err) {
          out.innerHTML = `<p class="ship-warn">${esc(err.message)}</p>`;
        }
        btn.disabled = false; btn.textContent = t('Consulta la comanda');
      });
    }

    if (name === 'botiga') {
      const go = () => {
        const params = parse().params;
        const q = $('#q').value.trim();
        const sort = $('#sort').value;
        q ? params.set('q', q) : params.delete('q');
        sort ? params.set('sort', sort) : params.delete('sort');
        const s = params.toString();
        window.history.replaceState(null, '', `#/botiga${s ? `?${s}` : ''}`);
        render();
        const input = $('#q'); input.focus(); input.setSelectionRange(input.value.length, input.value.length);
      };
      let timer;
      $('#q').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(go, 250); });
      $('#sort').addEventListener('change', go);
    }

    if (name === 'producte') {
      $$('[data-thumb]').forEach((b) => b.addEventListener('click', () => {
        $('[data-main-image] .art').src = b.dataset.thumb;
        $$('[data-thumb]').forEach((x) => x.classList.toggle('is-on', x === b));
      }));
      const p = catalog.bySlug(arg);
      const input = $('#qty');
      if (!p || !input) return;
      history.view(p.id);
      const refresh = () => { $('[data-unit]').textContent = m(pricing.unit(p, +input.value || 1)); };
      input.addEventListener('input', refresh);
      $$('[data-qty] [data-step]').forEach((b) => b.addEventListener('click', () => {
        input.value = Math.max(1, Math.min(99, (+input.value || 1) + +b.dataset.step)); refresh();
      }));
    }

    if (name === 'cistella') {
      $$('[data-line]').forEach((box) => {
        const id = box.dataset.line; const input = $('input', box);
        $$('[data-step]', box).forEach((b) => b.addEventListener('click', () => cart.setQty(id, (+input.value || 1) + +b.dataset.step)));
        input.addEventListener('change', () => cart.setQty(id, +input.value || 1));
      });
      $$('[data-remove]').forEach((b) => b.addEventListener('click', () => cart.remove(b.dataset.remove)));
    }

    if (name === 'checkout') {
      const form = $('#checkout');
      if (!form) return;
      // Les opcions i el resum es recalculen en canviar el codi postal, el país o l'opció.
      let selected = cart.totals().option?.id;
      const refresh = (repaintOptions) => {
        const dest = { country: form.elements.country.value, zip: form.elements.zip.value };
        const tot = cart.totals(dest, selected);
        selected = tot.option?.id;
        if (repaintOptions) $('#ship-options').innerHTML = shipOptionsHTML(tot.quote, selected);
        $('[data-summary]', form).outerHTML = checkoutSummary(tot);
      };
      // Transportistes amb preu real: es consulten quan l'adreça ja té sentit (espera 600 ms després d'escriure).
      let carrierTimer;
      const loadCarriers = () => {
        clearTimeout(carrierTimer);
        if (!carriers.enabled()) return;
        carrierTimer = setTimeout(async () => {
          const dest = { country: form.elements.country.value, zip: form.elements.zip.value };
          if (carriers.key === carriers.destKey(dest)) return;
          const pending = carriers.load(dest);
          refresh(true); // ensenya «Consultant els preus…» mentre espera
          await pending;
          if (location.hash.startsWith('#/checkout')) refresh(true);
        }, 600);
      };
      form.elements.zip.addEventListener('input', () => { refresh(true); loadCarriers(); });
      form.elements.country.addEventListener('change', () => { refresh(true); loadCarriers(); });
      $('#ship-options').addEventListener('change', (e) => { if (e.target.name === 'shipping') { selected = e.target.value; refresh(false); } });
      refresh(true);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bad = markInvalid(form);
        $('#form-error').hidden = !bad;
        if (bad) return;
        const btn = $('[type=submit]', form); btn.disabled = true; btn.textContent = t('Processant…');
        const data = Object.fromEntries(new FormData(form));
        try {
          const { redirect } = await payments.pay({ method: data.method, customer: data, shipping: data.shipping });
          if (redirect) { btn.textContent = t('Obrint el pagament segur…'); location.href = redirect; return; }
          location.hash = '#/comanda';
        } catch (err) {
          $('#form-error').textContent = err.message; $('#form-error').hidden = false;
          btn.disabled = false; btn.textContent = t('Paga {total}', { total: m(cart.totals().total) });
        }
      });
    }

    const form = $('#quote');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (markInvalid(form)) return;
        const data = Object.fromEntries(new FormData(form));
        delete data.file;
        const btn = $('[type=submit]', form);
        btn.disabled = true;
        let ref;
        try { ({ ref } = await quotes.submit(data)); } catch (err) { btn.disabled = false; alert(err.message); return; }
        form.innerHTML = `<div class="quote-done"><div class="done-mark">✓</div><h2>${t('Sol·licitud {ref} rebuda.', { ref })}</h2><p class="lead">${t('Et respondrem a {email} en 24 hores laborables.', { email: esc(data.email) })}</p><p class="muted small">${t('Si tens pressa, escriu-nos a {email}.', { email: `<a href="mailto:${CONTACT.email}">${CONTACT.email}</a>` })}</p></div>`;
      });
    }
  }

  // ---------- Global ----------
  function updateCount() {
    const n = cart.count();
    $$('[data-cart-count]').forEach((el) => { el.textContent = n; el.hidden = !n; });
  }

  let toastTimer;
  function toast(msg) {
    const el = $('.toast');
    el.innerHTML = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 3000);
  }
  const toCart = () => `<a href="#/cistella">${t('Veure la cistella')}</a>`;

  document.addEventListener('click', (e) => {
    const arrow = e.target.closest('[data-scroll]');
    if (arrow) {
      const track = document.getElementById(arrow.dataset.scroll);
      track.scrollBy({ left: +arrow.dataset.dir * track.clientWidth * 0.9, behavior: 'smooth' });
      return;
    }
    const many = e.target.closest('[data-add-many]');
    if (many) {
      const ids = many.dataset.addMany.split(',');
      ids.forEach((id) => cart.add(id, 1));
      toast(`<span>${t('S\'han afegit {n} productes a la cistella.', { n: ids.length })}</span>${toCart()}`);
      return;
    }
    const add = e.target.closest('[data-add], [data-add-qty]');
    if (!add) return;
    const id = add.dataset.add || add.dataset.addQty;
    const qty = add.dataset.addQty ? Math.max(1, +$('#qty').value || 1) : 1;
    cart.add(id, qty);
    toast(`<span>${t('{name} s\'ha afegit a la cistella.', { name: esc(fullName(catalog.byId(id))) })}</span>${toCart()}`);
  });

  // Selector d'idioma. Els accessos als apartats són sempre visibles a la
  // barra blanca; al mòbil es desplacen en horitzontal.
  const langBtn = $('.lang-btn');
  const langMenu = $('#lang-menu');
  function closeMenus() {
    langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false');
    $('.main-nav a.is-active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function paintLang() {
    $('[data-lang-current]').textContent = window.I18N.lang.toUpperCase();
    langMenu.innerHTML = window.I18N.langs.map((l) => `<li><button type="button" role="menuitemradio" aria-checked="${l.id === window.I18N.lang}" data-lang="${l.id}" lang="${l.id}">${l.label}</button></li>`).join('');
  }
  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = langMenu.hidden;
    closeMenus();
    langMenu.hidden = !open; langBtn.setAttribute('aria-expanded', String(open));
    if (open) langMenu.querySelector('[aria-checked="true"]')?.focus();
  });
  langMenu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (b) { window.I18N.set(b.dataset.lang); langBtn.focus(); }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.lang')) { langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !langMenu.hidden) { closeMenus(); langBtn.focus(); } });

  window.I18N.subscribe(() => {
    paintLang();
    const y = window.scrollY; render(); window.scrollTo(0, y);
  });

  const vat = $('#vat-toggle');
  vat.checked = pricing.showNet;
  vat.addEventListener('change', () => pricing.setNet(vat.checked));

  window.Store.subscribe(() => {
    const { name } = parse();
    if (name === 'checkout' || $('#quote')) { updateCount(); return; } // no esborrar formularis
    const y = window.scrollY; render(); window.scrollTo(0, y);
  });

  // ---------- App a la pantalla d'inici ----------
  // Android/Chrome: el navegador ens dona un avís d'instal·lació que mostrem
  // quan toca. iPhone/iPad: no n'hi ha, així que n'expliquem els passos.
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const installBox = $('.install');
  const installLink = $('.install-link');
  let deferredInstall = null;
  const DISMISS_KEY = 'fc.installDismissed';
  const dismissedRecently = () => { try { return Date.now() - (+localStorage.getItem(DISMISS_KEY) || 0) < 30 * 864e5; } catch { return false; } };
  const SHARE_ICON = `<svg class="share-ico" viewBox="0 0 24 24" role="img" aria-label="${t('Comparteix')}"><path d="M12 3v12M8 7l4-4 4 4M6 11v9h12v-9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function showInstall(force = false) {
    if (standalone || (!force && dismissedRecently())) return;
    if (!deferredInstall && !isIOS) return;
    installBox.innerHTML = `
      <img src="/marca/icon-192.png" alt="" width="48" height="48">
      <div class="install-text">
        <b id="install-title">${t('Instal·la Fundicat')}</b>
        <span>${deferredInstall ? t('Obre la botiga des de la pantalla d\'inici, com una app.') : t('Toca {icon} i després «Afegeix a la pantalla d\'inici».', { icon: SHARE_ICON })}</span>
      </div>
      <div class="install-actions">
        ${deferredInstall ? `<button type="button" class="btn btn-sm" data-install>${t('Instal·la')}</button>` : ''}
        <button type="button" class="btn btn-sm btn-secondary" data-install-close>${t('Ara no')}</button>
      </div>`;
    installBox.hidden = false;
  }
  installBox.addEventListener('click', async (e) => {
    if (e.target.closest('[data-install]') && deferredInstall) {
      deferredInstall.prompt();
      await deferredInstall.userChoice.catch(() => {});
      deferredInstall = null;
      installBox.hidden = true;
    }
    if (e.target.closest('[data-install-close]')) {
      installBox.hidden = true;
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* mode privat */ }
    }
  });
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    installLink.hidden = false;
    setTimeout(() => showInstall(), 4000); // no a la primera mirada
  });
  window.addEventListener('appinstalled', () => { installBox.hidden = true; installLink.hidden = true; deferredInstall = null; });
  installLink.addEventListener('click', () => showInstall(true));
  if (isIOS && !standalone) {
    installLink.hidden = false;
    setTimeout(() => showInstall(), 6000);
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  window.I18N.subscribe(() => { if (!installBox.hidden) showInstall(true); });

  window.I18N.applyStatic();
  paintLang();
  window.addEventListener('hashchange', render);
  render();
})();
