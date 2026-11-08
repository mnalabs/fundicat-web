// Arrencada de la botiga: carrega el catàleg (de Supabase, del servidor local o
// d'un fitxer fix) i després els scripts que el fan servir, en ordre.
(function () {
  const B = window.FUNDICAT_BACKEND || { type: 'local' };
  const SCRIPTS = ['js/shipping.js', 'js/store.js', 'js/app.js'];

  const load = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = resolve; s.onerror = () => reject(new Error(`No s'ha pogut carregar ${src}`));
    document.body.appendChild(s);
  });

  async function fromSupabase() {
    const get = async (path) => {
      const res = await fetch(`${B.url}/rest/v1/${path}`, { headers: { apikey: B.key } });
      if (!res.ok) throw new Error(`Supabase ${res.status}`);
      return res.json();
    };
    // Cada 8 s sense resposta compta com a error (millor la còpia que una pàgina en blanc).
    const timeout = (p) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('Supabase no respon')), 8000))]);
    try {
      const [store, products, announcements] = await timeout(Promise.all([
        get('store?select=key,value'),
        get('products?select=data&status=eq.active&order=position.asc'),
        get('announcements?select=data&active=eq.true&order=position.asc'),
      ]));
      const data = Object.fromEntries(store.map((r) => [r.key, r.value]));
      window.FUNDICAT_DATA = {
        ...data,
        products: products.map((r) => r.data),
        announcements: announcements.map((r) => r.data),
      };
      try { localStorage.setItem(COPY, JSON.stringify({ at: Date.now(), data: window.FUNDICAT_DATA })); } catch { /* sense espai o mode privat */ }
    } catch (e) {
      // Si Supabase falla, l'últim catàleg vist en aquest dispositiu (de fa menys de 7 dies).
      let copy = null;
      try { copy = JSON.parse(localStorage.getItem(COPY)); } catch { /* res */ }
      if (!copy?.data || Date.now() - copy.at > 7 * 864e5) throw e;
      console.warn('Catàleg des de la còpia local:', e.message);
      window.FUNDICAT_DATA = copy.data;
    }
  }
  const COPY = 'fc.catalogCopy';

  function showError() {
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `<section class="wrap empty-cart"><h1>No hem pogut carregar la botiga.</h1>
        <p class="lead">Comprova la connexió i torna-ho a provar.</p>
        <button class="btn" type="button" id="retry">Torna-ho a provar</button></section>`;
      document.getElementById('retry').addEventListener('click', () => location.reload());
    }
  }

  (async () => {
    try {
      if (B.type === 'supabase') await fromSupabase();
      else await load(B.type === 'static' ? B.catalog : '/api/catalog.js');
      for (const src of SCRIPTS) await load(src);
    } catch (e) {
      console.error(e);
      showError();
    }
  })();
})();
