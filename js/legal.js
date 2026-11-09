// Textos legals de la botiga (LSSI, RGPD i condicions de venda a consumidors).
// Agafen les dades de l'empresa de Configuració → Empresa (config.company).
// Català i castellà; en anglès i italià es mostra la versió castellana.
// És una base estàndard: convé que la revisi la gestoria abans de vendre molt.
(function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function company(config) {
    const c = config.company || {};
    const pend = { ca: '(pendent)', es: '(pendiente)' };
    return (lang) => ({
      name: esc(c.name || 'FUNDICAT SL'),
      nif: esc(c.nif || pend[lang]),
      address: esc(c.address || pend[lang]),
      registry: esc(c.registry || ''),
      email: esc(c.email || 'fundicatsl@gmail.com'),
      phone: esc(c.phone || '623 008 521'),
    });
  }

  const T = {
    ca: {
      titles: { avis: 'Avís legal', privadesa: 'Política de privadesa', condicions: 'Condicions de venda' },
      updated: 'Darrera actualització: novembre de 2026.',
      avis: (d) => `
        <h2>Titular de la web</h2>
        <p>En compliment de la Llei 34/2002 de serveis de la societat de la informació (LSSI), us informem que aquesta web és de:</p>
        <ul><li><b>${d.name}</b></li><li>NIF: ${d.nif}</li><li>Domicili: ${d.address}</li>${d.registry ? `<li>${d.registry}</li>` : ''}<li>Correu: <a href="mailto:${d.email}">${d.email}</a> · Telèfon: ${d.phone}</li></ul>
        <h2>Objecte</h2>
        <p>Aquesta web serveix per informar dels productes i serveis de ${d.name} i per vendre'ls en línia. L'ús de la web implica l'acceptació d'aquest avís.</p>
        <h2>Propietat intel·lectual</h2>
        <p>Els textos, imatges, logotips i el disseny de la web són de ${d.name} o s'utilitzen amb permís. No es poden copiar ni reutilitzar sense autorització.</p>
        <h2>Responsabilitat</h2>
        <p>Treballem perquè la informació sigui correcta i estigui al dia, però pot contenir errors puntuals. Si en detecteu algun, escriviu-nos. No ens fem responsables del contingut de webs externes enllaçades.</p>
        <h2>Llei aplicable</h2>
        <p>Aquest avís es regeix per la legislació espanyola.</p>`,
      privadesa: (d) => `
        <h2>Qui tracta les vostres dades</h2>
        <p><b>${d.name}</b>, NIF ${d.nif}, ${d.address}. Contacte: <a href="mailto:${d.email}">${d.email}</a>.</p>
        <h2>Quines dades i per a què</h2>
        <ul>
          <li><b>Comandes:</b> nom, correu, telèfon, adreça d'enviament i, si ho indiqueu, el NIF. Per preparar i enviar la comanda, fer la factura i atendre incidències o devolucions.</li>
          <li><b>Pressupostos i contacte:</b> nom, correu, telèfon i el que ens expliqueu. Per respondre-us i preparar el pressupost.</li>
          <li><b>Seguiment de la comanda:</b> el número de comanda i el correu, només per mostrar-vos l'estat de l'enviament.</li>
        </ul>
        <p>No fem servir les dades per a publicitat ni les venem a ningú.</p>
        <h2>Base legal</h2>
        <p>L'execució del contracte de compra o de la petició de pressupost que ens feu, i el compliment de les obligacions fiscals i comptables.</p>
        <h2>Quant de temps les guardem</h2>
        <p>Mentre duri la relació comercial i, després, el temps que exigeix la llei (per exemple, sis anys per a la documentació comptable).</p>
        <h2>Qui més les pot veure</h2>
        <p>Només els proveïdors que necessitem per funcionar, amb contracte d'encàrrec de tractament: Supabase (base de dades), Stripe (pagaments amb targeta: les dades de la targeta les gestiona Stripe i nosaltres no les veiem), GitHub (allotjament de la web), Packlink i el transportista que trieu (enviament). Alguns d'aquests proveïdors poden tractar dades fora de la Unió Europea, amb les garanties que preveu el RGPD (clàusules contractuals tipus o el Marc de Privadesa de Dades UE–EUA).</p>
        <h2>Els vostres drets</h2>
        <p>Podeu demanar l'accés, la rectificació, la supressió, l'oposició, la limitació i la portabilitat de les vostres dades escrivint a <a href="mailto:${d.email}">${d.email}</a>. Si creieu que no les tractem bé, podeu reclamar a l'Agència Espanyola de Protecció de Dades (aepd.es).</p>
        <h2>Galetes</h2>
        <p>Aquesta web no fa servir galetes de publicitat ni d'analítica. Només guarda al vostre navegador la cistella i l'idioma triat, que són necessaris perquè la botiga funcioni.</p>`,
      condicions: (d) => `
        <h2>Venedor</h2>
        <p><b>${d.name}</b>, NIF ${d.nif}, ${d.address}. Correu: <a href="mailto:${d.email}">${d.email}</a> · Telèfon: ${d.phone}.</p>
        <h2>Preus</h2>
        <p>Els preus són en euros i inclouen l'IVA. El cost de l'enviament es mostra abans de pagar, segons el transportista que trieu i l'adreça d'entrega. També podeu recollir la comanda al taller de Manresa sense cost.</p>
        <h2>Com es fa la compra</h2>
        <p>Afegiu els productes a la cistella, ompliu les dades, trieu l'enviament i la forma de pagament. En pagar rebreu el número de comanda. Si alguna dada no és correcta, escriviu-nos com més aviat millor.</p>
        <h2>Pagament</h2>
        <ul><li><b>Targeta:</b> el pagament es fa a la pàgina segura de Stripe. La comanda queda confirmada en el moment.</li><li><b>Transferència:</b> us donem el compte bancari. Preparem la comanda quan rebem l'import.</li></ul>
        <h2>Enviament i entrega</h2>
        <p>Enviem a la Península i a les zones que es mostren al pagament. Els dies d'entrega que indiquem són una estimació en dies laborables des que la comanda surt del taller. Podeu consultar l'estat a la pàgina de seguiment amb el número de comanda i el correu.</p>
        <h2>Cancel·lació de la comanda</h2>
        <p>Podeu cancel·lar la comanda vosaltres mateixos des de la pàgina de Seguiment, amb el número de comanda i el correu, mentre no hagi sortit del taller i dins del termini que s'indica a la mateixa pàgina. Us tornem tot l'import a la mateixa targeta amb què heu pagat.</p>
        <h2>Dret de desistiment</h2>
        <p>Si compreu com a consumidor, teniu 14 dies naturals des que rebeu el paquet per tornar-lo sense donar explicacions. Escriviu-nos a <a href="mailto:${d.email}">${d.email}</a> indicant el número de comanda. El producte ha de tornar en bon estat i en el seu embalatge. El cost de la devolució va a càrrec vostre, llevat que el producte sigui defectuós o erroni. Us retornarem l'import, inclòs l'enviament inicial estàndard, en un màxim de 14 dies des que rebem el producte, pel mateix mitjà de pagament.</p>
        <p>No hi ha dret de desistiment en les peces fabricades a mida o per encàrrec, ni en les compres fetes per empreses o professionals.</p>
        <h2>Garantia</h2>
        <p>Els productes tenen la garantia legal de conformitat de tres anys per als consumidors. Si un producte arriba malmès o amb un defecte, escriviu-nos amb fotos i ho solucionarem.</p>
        <h2>Peces a mida</h2>
        <p>Els treballs de fundició, mecanitzat, disseny i impressió 3D es fan amb pressupost previ. El preu, el termini i les condicions de cada treball són els del pressupost acceptat.</p>
        <h2>Reclamacions</h2>
        <p>Podeu fer-nos qualsevol reclamació a <a href="mailto:${d.email}">${d.email}</a>. Si no quedeu satisfets, us podeu adreçar a l'Agència Catalana del Consum o a la Junta Arbitral de Consum. Aquestes condicions es regeixen per la legislació espanyola.</p>`,
    },
    es: {
      titles: { avis: 'Aviso legal', privadesa: 'Política de privacidad', condicions: 'Condiciones de venta' },
      updated: 'Última actualización: noviembre de 2026.',
      avis: (d) => `
        <h2>Titular de la web</h2>
        <p>En cumplimiento de la Ley 34/2002 de servicios de la sociedad de la información (LSSI), le informamos de que esta web pertenece a:</p>
        <ul><li><b>${d.name}</b></li><li>NIF: ${d.nif}</li><li>Domicilio: ${d.address}</li>${d.registry ? `<li>${d.registry}</li>` : ''}<li>Correo: <a href="mailto:${d.email}">${d.email}</a> · Teléfono: ${d.phone}</li></ul>
        <h2>Objeto</h2>
        <p>Esta web sirve para informar de los productos y servicios de ${d.name} y para venderlos en línea. El uso de la web implica la aceptación de este aviso.</p>
        <h2>Propiedad intelectual</h2>
        <p>Los textos, imágenes, logotipos y el diseño de la web son de ${d.name} o se utilizan con permiso. No se pueden copiar ni reutilizar sin autorización.</p>
        <h2>Responsabilidad</h2>
        <p>Trabajamos para que la información sea correcta y esté actualizada, pero puede contener errores puntuales. Si detecta alguno, escríbanos. No nos hacemos responsables del contenido de webs externas enlazadas.</p>
        <h2>Ley aplicable</h2>
        <p>Este aviso se rige por la legislación española.</p>`,
      privadesa: (d) => `
        <h2>Quién trata sus datos</h2>
        <p><b>${d.name}</b>, NIF ${d.nif}, ${d.address}. Contacto: <a href="mailto:${d.email}">${d.email}</a>.</p>
        <h2>Qué datos y para qué</h2>
        <ul>
          <li><b>Pedidos:</b> nombre, correo, teléfono, dirección de envío y, si lo indica, el NIF. Para preparar y enviar el pedido, emitir la factura y atender incidencias o devoluciones.</li>
          <li><b>Presupuestos y contacto:</b> nombre, correo, teléfono y lo que nos explique. Para responderle y preparar el presupuesto.</li>
          <li><b>Seguimiento del pedido:</b> el número de pedido y el correo, solo para mostrarle el estado del envío.</li>
        </ul>
        <p>No usamos los datos para publicidad ni los vendemos a nadie.</p>
        <h2>Base legal</h2>
        <p>La ejecución del contrato de compra o de la solicitud de presupuesto que nos hace, y el cumplimiento de las obligaciones fiscales y contables.</p>
        <h2>Cuánto tiempo los guardamos</h2>
        <p>Mientras dure la relación comercial y, después, el tiempo que exige la ley (por ejemplo, seis años para la documentación contable).</p>
        <h2>Quién más puede verlos</h2>
        <p>Solo los proveedores que necesitamos para funcionar, con contrato de encargo de tratamiento: Supabase (base de datos), Stripe (pagos con tarjeta: los datos de la tarjeta los gestiona Stripe y nosotros no los vemos), GitHub (alojamiento de la web), Packlink y el transportista que elija (envío). Algunos de estos proveedores pueden tratar datos fuera de la Unión Europea, con las garantías que prevé el RGPD (cláusulas contractuales tipo o el Marco de Privacidad de Datos UE–EE. UU.).</p>
        <h2>Sus derechos</h2>
        <p>Puede solicitar el acceso, la rectificación, la supresión, la oposición, la limitación y la portabilidad de sus datos escribiendo a <a href="mailto:${d.email}">${d.email}</a>. Si considera que no los tratamos correctamente, puede reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
        <h2>Cookies</h2>
        <p>Esta web no usa cookies de publicidad ni de analítica. Solo guarda en su navegador la cesta y el idioma elegido, que son necesarios para que la tienda funcione.</p>`,
      condicions: (d) => `
        <h2>Vendedor</h2>
        <p><b>${d.name}</b>, NIF ${d.nif}, ${d.address}. Correo: <a href="mailto:${d.email}">${d.email}</a> · Teléfono: ${d.phone}.</p>
        <h2>Precios</h2>
        <p>Los precios están en euros e incluyen el IVA. El coste del envío se muestra antes de pagar, según el transportista que elija y la dirección de entrega. También puede recoger el pedido en el taller de Manresa sin coste.</p>
        <h2>Cómo se hace la compra</h2>
        <p>Añada los productos a la cesta, rellene los datos y elija el envío y la forma de pago. Al pagar recibirá el número de pedido. Si algún dato no es correcto, escríbanos lo antes posible.</p>
        <h2>Pago</h2>
        <ul><li><b>Tarjeta:</b> el pago se hace en la página segura de Stripe. El pedido queda confirmado en el momento.</li><li><b>Transferencia:</b> le damos la cuenta bancaria. Preparamos el pedido cuando recibimos el importe.</li></ul>
        <h2>Envío y entrega</h2>
        <p>Enviamos a la Península y a las zonas que se muestran al pagar. Los días de entrega que indicamos son una estimación en días laborables desde que el pedido sale del taller. Puede consultar el estado en la página de seguimiento con el número de pedido y el correo.</p>
        <h2>Cancelación del pedido</h2>
        <p>Puede cancelar el pedido usted mismo desde la página de Seguimiento, con el número de pedido y el correo, mientras no haya salido del taller y dentro del plazo que se indica en la misma página. Le devolvemos todo el importe a la misma tarjeta con la que ha pagado.</p>
        <h2>Derecho de desistimiento</h2>
        <p>Si compra como consumidor, tiene 14 días naturales desde que recibe el paquete para devolverlo sin dar explicaciones. Escríbanos a <a href="mailto:${d.email}">${d.email}</a> indicando el número de pedido. El producto debe volver en buen estado y en su embalaje. El coste de la devolución corre de su cuenta, salvo que el producto sea defectuoso o erróneo. Le devolveremos el importe, incluido el envío inicial estándar, en un máximo de 14 días desde que recibamos el producto, por el mismo medio de pago.</p>
        <p>No hay derecho de desistimiento en las piezas fabricadas a medida o por encargo, ni en las compras hechas por empresas o profesionales.</p>
        <h2>Garantía</h2>
        <p>Los productos tienen la garantía legal de conformidad de tres años para los consumidores. Si un producto llega dañado o con un defecto, escríbanos con fotos y lo solucionaremos.</p>
        <h2>Piezas a medida</h2>
        <p>Los trabajos de fundición, mecanizado, diseño e impresión 3D se hacen con presupuesto previo. El precio, el plazo y las condiciones de cada trabajo son los del presupuesto aceptado.</p>
        <h2>Reclamaciones</h2>
        <p>Puede hacernos cualquier reclamación en <a href="mailto:${d.email}">${d.email}</a>. Si no queda satisfecho, puede dirigirse a la Agència Catalana del Consum o a la Junta Arbitral de Consumo. Estas condiciones se rigen por la legislación española.</p>`,
    },
  };

  window.FundicatLegal = {
    pages: ['avis', 'privadesa', 'condicions'],
    title(page, lang) { return (T[lang] || T.es).titles[page]; },
    html(page, lang, config) {
      const L = T[lang === 'ca' ? 'ca' : 'es'];
      const d = company(config)(lang === 'ca' ? 'ca' : 'es');
      return `${L[page](d)}<p class="muted small">${L.updated}</p>`;
    },
  };
})();
