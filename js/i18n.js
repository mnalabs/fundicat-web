// Idiomes de la botiga. El català és l'idioma font: les claus del diccionari
// són el text en català, i t() torna la traducció o, si no n'hi ha, el català.
// Amb backend, aquestes taules poden viure a la base de dades (una fila per idioma).
(function () {
  const LANGS = [
    { id: 'ca', label: 'Català', locale: 'ca-ES' },
    { id: 'es', label: 'Español', locale: 'es-ES' },
    { id: 'en', label: 'English', locale: 'en-GB' },
    { id: 'it', label: 'Italiano', locale: 'it-IT' },
  ];
  const ORDER = ['ca', 'es', 'en', 'it'];

  // [català, castellà, anglès, italià]
  const S = [
    // Capçalera i peu
    ['Botiga', 'Tienda', 'Shop', 'Negozio'],
    ['Recomanats', 'Recomendados', 'Recommended', 'Consigliati'],
    ['Equips', 'Equipos', 'Equipment', 'Attrezzature'],
    ['Serveis', 'Servicios', 'Services', 'Servizi'],
    ['Fundició', 'Fundición', 'Casting', 'Fonderia'],
    ['Guia', 'Guía', 'Guide', 'Guida'],
    ['Cistella', 'Cesta', 'Basket', 'Carrello'],
    ['Menú', 'Menú', 'Menu', 'Menu'],
    ['Idioma', 'Idioma', 'Language', 'Lingua'],
    ['Salta al contingut', 'Saltar al contenido', 'Skip to content', 'Vai al contenuto'],
    ['Prototip. Productes d\'exemple i pagament simulat.', 'Prototipo. Productos de ejemplo y pago simulado.', 'Prototype. Sample products and simulated payment.', 'Prototipo. Prodotti di esempio e pagamento simulato.'],
    ['Preus amb IVA inclòs, llevat que s\'indiqui el contrari. Enviament de 2,99 € a la Península, gratuït en comandes a partir de 60 €. Les empreses poden veure els preus sense IVA amb l\'opció de sota.', 'Precios con IVA incluido, salvo que se indique lo contrario. Envío de 2,99 € a la Península, gratuito en pedidos a partir de 60 €. Las empresas pueden ver los precios sin IVA con la opción de abajo.', 'Prices include VAT unless stated otherwise. Shipping €2.99 to mainland Spain, free on orders over €60. Businesses can view prices excluding VAT with the option below.', 'Prezzi IVA inclusa, salvo diversa indicazione. Spedizione 2,99 € in Spagna peninsulare, gratuita per ordini da 60 €. Le aziende possono vedere i prezzi senza IVA con l\'opzione qui sotto.'],
    ['Sorres de motlleig', 'Arenas de moldeo', 'Moulding sands', 'Sabbie da formatura'],
    ['Eines i crisols', 'Herramientas y crisoles', 'Tools and crucibles', 'Utensili e crogioli'],
    ['Kits', 'Kits', 'Kits', 'Kit'],
    ['Consumibles', 'Consumibles', 'Consumables', 'Consumabili'],
    ['Solucions industrials', 'Soluciones industriales', 'Industrial solutions', 'Soluzioni industriali'],
    ['Servei de fundició', 'Servicio de fundición', 'Casting service', 'Servizio di fonderia'],
    ['Mecanitzat', 'Mecanizado', 'CNC machining', 'Lavorazione meccanica'],
    ['Disseny CAD/CAM', 'Diseño CAD/CAM', 'CAD/CAM design', 'Progettazione CAD/CAM'],
    ['Impressió 3D', 'Impresión 3D', '3D printing', 'Stampa 3D'],
    ['Demana pressupost', 'Pide presupuesto', 'Request a quote', 'Richiedi un preventivo'],
    ['Empreses', 'Empresas', 'Business', 'Aziende'],
    ['Mostra preus sense IVA', 'Mostrar precios sin IVA', 'Show prices excl. VAT', 'Mostra prezzi senza IVA'],
    ['Ajuda', 'Ayuda', 'Help', 'Assistenza'],
    ['Guia de fosa', 'Guía de fundición', 'Casting guide', 'Guida alla fusione'],
    ['Enviaments i devolucions', 'Envíos y devoluciones', 'Shipping and returns', 'Spedizioni e resi'],
    ['Contacte', 'Contacto', 'Contact', 'Contatti'],
    ['Manresa, Barcelona', 'Manresa, Barcelona', 'Manresa, Barcelona, Spain', 'Manresa, Barcellona'],
    ['Copyright © 2026 Fundicat SL. Tots els drets reservats.', 'Copyright © 2026 Fundicat SL. Todos los derechos reservados.', 'Copyright © 2026 Fundicat SL. All rights reserved.', 'Copyright © 2026 Fundicat SL. Tutti i diritti riservati.'],
    ['Avís legal', 'Aviso legal', 'Legal notice', 'Note legali'],
    ['Privadesa', 'Privacidad', 'Privacy', 'Privacy'],
    ['Condicions de venda', 'Condiciones de venta', 'Terms of sale', 'Condizioni di vendita'],
    ['Marca', 'Marca', 'Brand', 'Marchio'],
    ['Accés', 'Acceso', 'Staff login', 'Accesso'],

    // Comuns
    ['sense IVA', 'sin IVA', 'excl. VAT', 'IVA esclusa'],
    ['IVA inclòs', 'IVA incluido', 'incl. VAT', 'IVA inclusa'],
    ['Producte d\'exemple', 'Producto de ejemplo', 'Sample product', 'Prodotto di esempio'],
    ['Afegeix', 'Añadir', 'Add', 'Aggiungi'],
    ['Afegeix a la cistella', 'Añadir a la cesta', 'Add to basket', 'Aggiungi al carrello'],
    ['Afegeix {name} a la cistella', 'Añadir {name} a la cesta', 'Add {name} to basket', 'Aggiungi {name} al carrello'],
    ['Compra', 'Comprar', 'Buy', 'Acquista'],
    ['Més informació', 'Más información', 'Learn more', 'Scopri di più'],
    ['Veure-ho tot', 'Ver todo', 'See all', 'Vedi tutto'],
    ['Anteriors', 'Anteriores', 'Previous', 'Precedenti'],
    ['Següents', 'Siguientes', 'Next', 'Successivi'],
    ['−{pct}% a partir de {min} unitats', '−{pct}% a partir de {min} unidades', '−{pct}% from {min} units', '−{pct}% da {min} unità'],
    ['Rep-lo {date}', 'Recíbelo el {date}', 'Get it by {date}', 'Ricevilo {date}'],
    ['Només en queden {n}', 'Solo quedan {n}', 'Only {n} left', 'Ne restano solo {n}'],
    ['Només en queden {n}.', 'Solo quedan {n}.', 'Only {n} left.', 'Ne restano solo {n}.'],
    ['Es compren junts sovint', 'Se compran juntos a menudo', 'Frequently bought together', 'Spesso acquistati insieme'],
    ['Preu total:', 'Precio total:', 'Total price:', 'Prezzo totale:'],
    ['Afegeix els {n} a la cistella', 'Añadir los {n} a la cesta', 'Add all {n} to basket', 'Aggiungi tutti e {n} al carrello'],
    ['Aquest producte:', 'Este producto:', 'This item:', 'Questo prodotto:'],
    ['Veure\'n més', 'Ver más', 'See more', 'Vedi altri'],
    ['Demana pressupost.', 'Pide presupuesto.', 'Request a quote.', 'Richiedi un preventivo.'],
    ['Et responem en 24 hores laborables.', 'Te respondemos en 24 horas laborables.', 'We reply within 24 working hours.', 'Rispondiamo entro 24 ore lavorative.'],
    ['Nom o empresa', 'Nombre o empresa', 'Name or company', 'Nome o azienda'],
    ['Correu electrònic', 'Correo electrónico', 'Email', 'Email'],
    ['Servei', 'Servicio', 'Service', 'Servizio'],
    ['Unitats', 'Unidades', 'Units', 'Unità'],
    ['Què necessites', 'Qué necesitas', 'What do you need', 'Di cosa hai bisogno'],
    ['Casquet guia Ø 3,80 mm, recanvi de bronze, prototip…', 'Casquillo guía Ø 3,80 mm, recambio de bronce, prototipo…', 'Ø 3.80 mm guide bushing, bronze spare part, prototype…', 'Boccola di guida Ø 3,80 mm, ricambio in bronzo, prototipo…'],
    ['Plànol, model o foto', 'Plano, modelo o foto', 'Drawing, model or photo', 'Disegno, modello o foto'],
    ['(PDF, STEP, DXF, STL o JPG)', '(PDF, STEP, DXF, STL o JPG)', '(PDF, STEP, DXF, STL or JPG)', '(PDF, STEP, DXF, STL o JPG)'],
    ['Detalls', 'Detalles', 'Details', 'Dettagli'],
    ['Material, mides, toleràncies, acabat i data de lliurament', 'Material, medidas, tolerancias, acabado y fecha de entrega', 'Material, dimensions, tolerances, finish and delivery date', 'Materiale, misure, tolleranze, finitura e data di consegna'],
    ['Envia la sol·licitud', 'Enviar la solicitud', 'Send request', 'Invia la richiesta'],
    ['Sol·licitud {ref} rebuda.', 'Solicitud {ref} recibida.', 'Request {ref} received.', 'Richiesta {ref} ricevuta.'],
    ['Et respondrem a {email} en 24 hores laborables.', 'Te responderemos a {email} en 24 horas laborables.', 'We\'ll reply to {email} within 24 working hours.', 'Risponderemo a {email} entro 24 ore lavorative.'],

    // Portada
    ['Encarrega una peça', 'Encarga una pieza', 'Order a custom part', 'Ordina un pezzo'],
    ['Fabriquem la teva peça.', 'Fabricamos tu pieza.', 'We make your part.', 'Realizziamo il tuo pezzo.'],
    ['Fundició, mecanitzat, disseny CAD/CAM i impressió 3D en un sol taller. Resposta en 24 hores.', 'Fundición, mecanizado, diseño CAD/CAM e impresión 3D en un solo taller. Respuesta en 24 horas.', 'Casting, machining, CAD/CAM design and 3D printing in one workshop. Reply within 24 hours.', 'Fonderia, lavorazione meccanica, CAD/CAM e stampa 3D in un\'unica officina. Risposta in 24 ore.'],
    ['Com funciona', 'Cómo funciona', 'How it works', 'Come funziona'],
    ['Explica\'ns què necessites', 'Cuéntanos qué necesitas', 'Tell us what you need', 'Raccontaci di cosa hai bisogno'],
    ['Un plànol, una foto, una mostra o només la idea.', 'Un plano, una foto, una muestra o solo la idea.', 'A drawing, a photo, a sample or just the idea.', 'Un disegno, una foto, un campione o solo l\'idea.'],
    ['Rep el pressupost en 24 h', 'Recibe el presupuesto en 24 h', 'Get a quote within 24 h', 'Ricevi il preventivo in 24 h'],
    ['Preu per unitat i per volum, sense compromís.', 'Precio por unidad y por volumen, sin compromiso.', 'Unit and volume pricing, no obligation.', 'Prezzo unitario e per quantità, senza impegno.'],
    ['Fabriquem i t\'ho enviem', 'Fabricamos y te lo enviamos', 'We make it and ship it', 'Lo produciamo e te lo spediamo'],
    ['Normalment en una setmana, des de Manresa.', 'Normalmente en una semana, desde Manresa.', 'Usually within a week, from Manresa.', 'Di solito in una settimana, da Manresa.'],
    ['Preus de referència: {part}, des de {price}/u.', 'Precios de referencia: {part}, desde {price}/ud.', 'Reference prices: {part}, from {price} each.', 'Prezzi di riferimento: {part}, da {price} cad.'],
    ['Pressupost ràpid', 'Presupuesto rápido', 'Quick quote', 'Preventivo rapido'],
    ['Sense compromís. Et responem en 24 hores laborables.', 'Sin compromiso. Te respondemos en 24 horas laborables.', 'No obligation. We reply within 24 working hours.', 'Senza impegno. Rispondiamo entro 24 ore lavorative.'],
    ['Pressupost', 'Presupuesto', 'Get a quote', 'Preventivo'],
    ['Aprèn a fondre en sis passos.', 'Aprende a fundir en seis pasos.', 'Learn to cast in six steps.', 'Impara a fondere in sei passi.'],
    ['Llegeix la guia', 'Lee la guía', 'Read the guide', 'Leggi la guida'],
    ['Tot per fondre metall.', 'Todo para fundir metal.', 'Everything you need to cast metal.', 'Tutto per fondere il metallo.'],
    ['Sorres, crisols, forns i peces a mida. Fet i enviat des de Manresa.', 'Arenas, crisoles, hornos y piezas a medida. Hecho y enviado desde Manresa.', 'Sands, crucibles, furnaces and custom parts. Made and shipped from Manresa, Spain.', 'Sabbie, crogioli, forni e pezzi su misura. Prodotto e spedito da Manresa.'],
    ['Compra ara', 'Comprar ahora', 'Shop now', 'Acquista ora'],
    ['Il·lustració d\'un crisol abocant metall fos en un motlle de sorra', 'Ilustración de un crisol vertiendo metal fundido en un molde de arena', 'Illustration of a crucible pouring molten metal into a sand mould', 'Illustrazione di un crogiolo che versa metallo fuso in uno stampo di sabbia'],
    ['Gratis a partir de {free}.', 'Gratis a partir de {free}.', 'Free over {free}.', 'Gratis da {free}.'],
    ['Descompte automàtic a la cistella.', 'Descuento automático en la cesta.', 'Automatic discount in your basket.', 'Sconto automatico nel carrello.'],
    ['Amb NIF i preus sense IVA.', 'Con NIF y precios sin IVA.', 'With VAT number and prices excl. VAT.', 'Con partita IVA e prezzi senza IVA.'],
    ['Fet a Manresa', 'Hecho en Manresa', 'Made in Manresa', 'Prodotto a Manresa'],
    ['Taller propi a la Catalunya central.', 'Taller propio en la Cataluña central.', 'Our own workshop in central Catalonia.', 'Officina propria nella Catalogna centrale.'],
    ['Compra per categoria.', 'Compra por categoría.', 'Shop by category.', 'Acquista per categoria.'],
    ['Sorra de fosa aglutinada amb oli. Precisa, neta i reutilitzable.', 'Arena de fundición aglutinada con aceite. Precisa, limpia y reutilizable.', 'Oil-bonded casting sand. Precise, clean and reusable.', 'Sabbia da fonderia legata a olio. Precisa, pulita e riutilizzabile.'],
    ['Des de {price}. Enviament gratuït a partir de {free}.', 'Desde {price}. Envío gratuito a partir de {free}.', 'From {price}. Free shipping on orders over {free}.', 'Da {price}. Spedizione gratuita da {free}.'],
    ['Kit d\'iniciació', 'Kit de iniciación', 'Starter kit', 'Kit per iniziare'],
    ['Tot el que cal per a la primera colada.', 'Todo lo necesario para la primera colada.', 'Everything you need for your first pour.', 'Tutto il necessario per la prima colata.'],
    ['Serveis industrials', 'Servicios industriales', 'Industrial services', 'Servizi industriali'],
    ['Del disseny a la peça acabada, en un sol taller.', 'Del diseño a la pieza acabada, en un solo taller.', 'From design to finished part, in one workshop.', 'Dal progetto al pezzo finito, in un\'unica officina.'],
    ['Tots els serveis', 'Todos los servicios', 'All services', 'Tutti i servizi'],
    ['Recomanats per a tu', 'Recomendados para ti', 'Recommended for you', 'Consigliati per te'],
    ['Imprescindibles del taller', 'Imprescindibles del taller', 'Workshop essentials', 'Essenziali per l\'officina'],
    ['Veure recomanats', 'Ver recomendados', 'See recommendations', 'Vedi i consigliati'],
    ['Tot per al taller.', 'Todo para el taller.', 'Everything for the workshop.', 'Tutto per l\'officina.'],
    ['Sorres, crisols, flascons i consumibles.', 'Arenas, crisoles, cajas de moldeo y consumibles.', 'Sands, crucibles, flasks and consumables.', 'Sabbie, crogioli, staffe e consumabili.'],
    ['Veure tota la botiga', 'Ver toda la tienda', 'Browse the whole shop', 'Vedi tutto il negozio'],
    ['Enviament en 24–48 h', 'Envío en 24–48 h', 'Ships in 24–48 h', 'Spedizione in 24–48 h'],
    ['Des de Manresa. {flat}, o gratis a partir de {free}.', 'Desde Manresa. {flat}, o gratis a partir de {free}.', 'From Manresa. {flat}, or free over {free}.', 'Da Manresa. {flat}, o gratis da {free}.'],
    ['Preus per volum', 'Precios por volumen', 'Volume pricing', 'Prezzi per quantità'],
    ['Com més unitats, menys pagues. Descompte aplicat automàticament.', 'Cuantas más unidades, menos pagas. Descuento aplicado automáticamente.', 'The more you buy, the less you pay. Discount applied automatically.', 'Più unità, meno paghi. Sconto applicato automaticamente.'],
    ['Factura d\'empresa', 'Factura de empresa', 'Business invoice', 'Fattura aziendale'],
    ['Factura amb NIF a cada comanda i preus sense IVA per a professionals.', 'Factura con NIF en cada pedido y precios sin IVA para profesionales.', 'VAT invoice with every order and prices excl. VAT for professionals.', 'Fattura con partita IVA per ogni ordine e prezzi senza IVA per i professionisti.'],

    // Recomanats
    ['Productes recomanats', 'Productos recomendados', 'Recommended products', 'Prodotti consigliati'],
    ['Segons el que has mirat i el que tens a la cistella.', 'Según lo que has visto y lo que tienes en la cesta.', 'Based on what you\'ve viewed and what\'s in your basket.', 'In base a ciò che hai visto e al tuo carrello.'],
    ['Una selecció per equipar el taller de fosa.', 'Una selección para equipar el taller de fundición.', 'A selection to equip your casting workshop.', 'Una selezione per attrezzare il laboratorio di fusione.'],
    ['Si fas la comanda ara, la reps el <b>{date}</b>. Enviament gratuït a partir de {free}.', 'Si haces el pedido ahora, lo recibes el <b>{date}</b>. Envío gratuito a partir de {free}.', 'Order now and get it by <b>{date}</b>. Free shipping over {free}.', 'Ordina ora e ricevi entro <b>{date}</b>. Spedizione gratuita da {free}.'],
    ['Complements del que has mirat.', 'Complementos de lo que has visto.', 'Goes with what you\'ve viewed.', 'Complementi di ciò che hai visto.'],
    ['Per començar a fondre.', 'Para empezar a fundir.', 'To get you started.', 'Per iniziare a fondere.'],
    ['Estalvia comprant per volum', 'Ahorra comprando por volumen', 'Save when you buy in bulk', 'Risparmia acquistando in quantità'],
    ['El descompte s\'aplica sol a la cistella.', 'El descuento se aplica solo en la cesta.', 'The discount is applied automatically in the basket.', 'Lo sconto si applica da solo nel carrello.'],
    ['Equips i eines', 'Equipos y herramientas', 'Equipment and tools', 'Attrezzature e utensili'],
    ['Vistos recentment', 'Vistos recientemente', 'Recently viewed', 'Visti di recente'],
    ['Necessites una peça a mida?', '¿Necesitas una pieza a medida?', 'Need a custom part?', 'Ti serve un pezzo su misura?'],
    ['Fundició, mecanitzat, disseny CAD/CAM i impressió 3D en un sol taller.', 'Fundición, mecanizado, diseño CAD/CAM e impresión 3D en un solo taller.', 'Casting, machining, CAD/CAM design and 3D printing in one workshop.', 'Fonderia, lavorazione meccanica, CAD/CAM e stampa 3D in un\'unica officina.'],
    ['Veure els serveis', 'Ver los servicios', 'See our services', 'Vedi i servizi'],
    ['Completa la teva compra', 'Completa tu compra', 'Complete your order', 'Completa il tuo acquisto'],
    ['Complements del que tens a la cistella.', 'Complementos de lo que tienes en la cesta.', 'Goes with what\'s in your basket.', 'Complementi di ciò che hai nel carrello.'],

    // Botiga
    ['Material de fosa provat al nostre taller.', 'Material de fundición probado en nuestro taller.', 'Casting supplies tested in our own workshop.', 'Materiale da fonderia provato nella nostra officina.'],
    ['Tot', 'Todo', 'All', 'Tutto'],
    ['Cerca', 'Buscar', 'Search', 'Cerca'],
    ['Ordena', 'Ordenar', 'Sort', 'Ordina'],
    ['Destacats', 'Destacados', 'Featured', 'In evidenza'],
    ['Preu: de menys a més', 'Precio: de menor a mayor', 'Price: low to high', 'Prezzo: crescente'],
    ['Preu: de més a menys', 'Precio: de mayor a menor', 'Price: high to low', 'Prezzo: decrescente'],
    ['{n} producte · preus {vat}', '{n} producto · precios {vat}', '{n} product · prices {vat}', '{n} prodotto · prezzi {vat}'],
    ['{n} productes · preus {vat}', '{n} productos · precios {vat}', '{n} products · prices {vat}', '{n} prodotti · prezzi {vat}'],
    ['Cap resultat per a “{q}”', 'Ningún resultado para “{q}”', 'No results for “{q}”', 'Nessun risultato per “{q}”'],
    ['Prova una altra cerca o <a href="#/contacte">demana-ho a mida</a>.', 'Prueba otra búsqueda o <a href="#/contacte">pídelo a medida</a>.', 'Try another search or <a href="#/contacte">ask for a custom part</a>.', 'Prova un\'altra ricerca o <a href="#/contacte">chiedilo su misura</a>.'],

    // Fitxa
    ['Ruta', 'Ruta', 'Breadcrumb', 'Percorso'],
    ['Ref.', 'Ref.', 'Ref.', 'Rif.'],
    ['Preu per volum', 'Precio por volumen', 'Volume pricing', 'Prezzo per quantità'],
    ['Preu per unitat', 'Precio por unidad', 'Unit price', 'Prezzo unitario'],
    ['Estalvi', 'Ahorro', 'Saving', 'Risparmio'],
    [' o més', ' o más', ' or more', ' o più'],
    ['Menys', 'Menos', 'Less', 'Meno'],
    ['Més', 'Más', 'More', 'Più'],
    ['Quantitat', 'Cantidad', 'Quantity', 'Quantità'],
    ['En estoc.', 'En stock.', 'In stock.', 'Disponibile.'],
    ['Enviament:', 'Envío:', 'Shipping:', 'Spedizione:'],
    ['surt en 24–48 h laborables des de Manresa.', 'sale en 24–48 h laborables desde Manresa.', 'dispatched from Manresa within 24–48 working hours.', 'parte da Manresa in 24–48 ore lavorative.'],
    ['Devolucions:', 'Devoluciones:', 'Returns:', 'Resi:'],
    ['14 dies.', '14 días.', '14 days.', '14 giorni.'],
    ['Especificacions', 'Especificaciones', 'Specifications', 'Specifiche'],
    ['També et pot interessar.', 'También te puede interesar.', 'You might also like.', 'Potrebbe interessarti anche.'],

    // Cistella i pagament
    ['La cistella és buida.', 'La cesta está vacía.', 'Your basket is empty.', 'Il carrello è vuoto.'],
    ['La PetroBond és un bon punt de partida.', 'La PetroBond es un buen punto de partida.', 'PetroBond is a good place to start.', 'La PetroBond è un buon punto di partenza.'],
    ['Continua comprant', 'Seguir comprando', 'Continue shopping', 'Continua lo shopping'],
    ['Total: {total}', 'Total: {total}', 'Total: {total}', 'Totale: {total}'],
    ['Afegeix {amount} més per tenir enviament gratuït.', 'Añade {amount} más para tener envío gratuito.', 'Add {amount} more for free shipping.', 'Aggiungi altri {amount} per la spedizione gratuita.'],
    ['Tens enviament gratuït.', 'Tienes envío gratuito.', 'You\'ve got free shipping.', 'Hai la spedizione gratuita.'],
    ['{price} per unitat', '{price} por unidad', '{price} each', '{price} cad.'],
    ['estalvies {amount}', 'ahorras {amount}', 'you save {amount}', 'risparmi {amount}'],
    ['Treu {name}', 'Quitar {name}', 'Remove {name}', 'Rimuovi {name}'],
    ['Tramita la comanda', 'Tramitar pedido', 'Checkout', 'Procedi all\'ordine'],
    ['Resum', 'Resumen', 'Summary', 'Riepilogo'],
    ['Subtotal', 'Subtotal', 'Subtotal', 'Subtotale'],
    ['Descompte per volum', 'Descuento por volumen', 'Volume discount', 'Sconto quantità'],
    ['Enviament', 'Envío', 'Shipping', 'Spedizione'],
    ['Gratuït', 'Gratuito', 'Free', 'Gratuita'],
    ['Total', 'Total', 'Total', 'Totale'],
    ['Cal afegir-hi un IVA del 21%: {vat}.', 'Hay que añadir un IVA del 21%: {vat}.', 'Plus 21% VAT: {vat}.', 'Da aggiungere IVA al 21%: {vat}.'],
    ['Inclou {vat} d\'IVA.', 'Incluye {vat} de IVA.', 'Includes {vat} VAT.', 'Include {vat} di IVA.'],
    ['Pagament segur amb targeta, Apple Pay, Google Pay o transferència.', 'Pago seguro con tarjeta, Apple Pay, Google Pay o transferencia.', 'Secure payment by card, Apple Pay, Google Pay or bank transfer.', 'Pagamento sicuro con carta, Apple Pay, Google Pay o bonifico.'],
    ['Visa, Mastercard, Apple Pay o Google Pay. Pagament segur amb Stripe.', 'Visa, Mastercard, Apple Pay o Google Pay. Pago seguro con Stripe.', 'Visa, Mastercard, Apple Pay or Google Pay. Secure payment with Stripe.', 'Visa, Mastercard, Apple Pay o Google Pay. Pagamento sicuro con Stripe.'],
    ['Obrint el pagament segur…', 'Abriendo el pago seguro…', 'Opening secure payment…', 'Apertura del pagamento sicuro…'],
    ['Pagament rebut. Gràcies!', 'Pago recibido. ¡Gracias!', 'Payment received. Thank you!', 'Pagamento ricevuto. Grazie!'],
    ['Comanda {number}. T\'enviarem la confirmació a {email}.', 'Pedido {number}. Te enviaremos la confirmación a {email}.', 'Order {number}. We\'ll send the confirmation to {email}.', 'Ordine {number}. Invieremo la conferma a {email}.'],
    ['Dades per a la transferència', 'Datos para la transferencia', 'Bank transfer details', 'Dati per il bonifico'],
    ['Titular', 'Titular', 'Account holder', 'Intestatario'],
    ['Import', 'Importe', 'Amount', 'Importo'],
    ['Concepte', 'Concepto', 'Reference', 'Causale'],
    ['T\'enviarem les dades bancàries per correu.', 'Te enviaremos los datos bancarios por correo.', 'We\'ll email you our bank details.', 'Ti invieremo i dati bancari via email.'],
    ['Prepararem la comanda quan rebem la transferència.', 'Prepararemos el pedido cuando recibamos la transferencia.', 'We\'ll prepare your order once the transfer arrives.', 'Prepareremo l\'ordine quando riceveremo il bonifico.'],
    ['Factura amb NIF a cada comanda.', 'Factura con NIF en cada pedido.', 'VAT invoice with every order.', 'Fattura con partita IVA per ogni ordine.'],
    ['Devolucions en 14 dies.', 'Devoluciones en 14 días.', '14-day returns.', 'Resi entro 14 giorni.'],
    ['Tramitació', 'Tramitación', 'Checkout', 'Cassa'],
    ['Nom i cognoms', 'Nombre y apellidos', 'Full name', 'Nome e cognome'],
    ['Telèfon', 'Teléfono', 'Phone', 'Telefono'],
    ['NIF o CIF', 'NIF o CIF', 'VAT or tax ID', 'Partita IVA o codice fiscale'],
    ['(opcional)', '(opcional)', '(optional)', '(facoltativo)'],
    ['Adreça d\'enviament', 'Dirección de envío', 'Shipping address', 'Indirizzo di spedizione'],
    ['Adreça', 'Dirección', 'Address', 'Indirizzo'],
    ['Codi postal', 'Código postal', 'Postcode', 'CAP'],
    ['Població', 'Población', 'Town or city', 'Città'],
    ['País', 'País', 'Country', 'Paese'],
    ['Pagament', 'Pago', 'Payment', 'Pagamento'],
    ['Revisa els camps marcats.', 'Revisa los campos marcados.', 'Please check the highlighted fields.', 'Controlla i campi evidenziati.'],
    ['Paga {total}', 'Pagar {total}', 'Pay {total}', 'Paga {total}'],
    ['Processant…', 'Procesando…', 'Processing…', 'Elaborazione…'],
    ['Gràcies per la comanda.', 'Gracias por tu pedido.', 'Thank you for your order.', 'Grazie per il tuo ordine.'],
    ['Comanda {number}. Hem enviat la confirmació a {email}. Rebràs la factura quan el paquet surti del taller.', 'Pedido {number}. Hemos enviado la confirmación a {email}. Recibirás la factura cuando el paquete salga del taller.', 'Order {number}. We\'ve sent the confirmation to {email}. You\'ll receive the invoice when the parcel leaves the workshop.', 'Ordine {number}. Abbiamo inviato la conferma a {email}. Riceverai la fattura quando il pacco lascerà l\'officina.'],
    ['(simulat)', '(simulado)', '(simulated)', '(simulato)'],
    ['Targeta', 'Tarjeta', 'Card', 'Carta'],
    ['Transferència', 'Transferencia', 'Bank transfer', 'Bonifico'],
    ['Visa, Mastercard, Apple Pay, Google Pay', 'Visa, Mastercard, Apple Pay, Google Pay', 'Visa, Mastercard, Apple Pay, Google Pay', 'Visa, Mastercard, Apple Pay, Google Pay'],
    ['Pagament instantani des del mòbil', 'Pago instantáneo desde el móvil', 'Instant payment from your phone (Spain)', 'Pagamento istantaneo dal cellulare (Spagna)'],
    ['Per a empreses · enviament en rebre el pagament', 'Para empresas · envío al recibir el pago', 'For businesses · ships once payment is received', 'Per aziende · spedizione al ricevimento del pagamento'],
    ['Espanya', 'España', 'Spain', 'Spagna'],
    ['Itàlia', 'Italia', 'Italy', 'Italia'],
    ['França', 'Francia', 'France', 'Francia'],
    ['Portugal', 'Portugal', 'Portugal', 'Portogallo'],
    ['Alemanya', 'Alemania', 'Germany', 'Germania'],

    // Serveis
    ['Un sol taller per a tot el procés.<br>Del disseny a la peça acabada.', 'Un solo taller para todo el proceso.<br>Del diseño a la pieza acabada.', 'One workshop for the whole process.<br>From design to finished part.', 'Un\'unica officina per tutto il processo.<br>Dal progetto al pezzo finito.'],
    ['De la idea a la peça.', 'De la idea a la pieza.', 'From idea to part.', 'Dall\'idea al pezzo.'],
    ['Els serveis es poden contractar per separat o encadenats en un sol projecte.', 'Los servicios se pueden contratar por separado o encadenados en un solo proyecto.', 'Book each service on its own or combine them in a single project.', 'I servizi si possono richiedere separatamente o combinati in un unico progetto.'],
    ['Preus de referència', 'Precios de referencia', 'Reference prices', 'Prezzi di riferimento'],
    ['Preus de comandes recents, sense IVA. Com més unitats, millor és el preu.', 'Precios de pedidos recientes, sin IVA. Cuantas más unidades, mejor precio.', 'Prices from recent orders, excl. VAT. The more units, the better the price.', 'Prezzi di ordini recenti, IVA esclusa. Più unità, miglior prezzo.'],
    ['Peça', 'Pieza', 'Part', 'Pezzo'],
    ['Aplicacions', 'Aplicaciones', 'Applications', 'Applicazioni'],
    ['Altres serveis.', 'Otros servicios.', 'Other services.', 'Altri servizi.'],

    // Guia
    ['Guia de fosa en sorra', 'Guía de fundición en arena', 'Sand casting guide', 'Guida alla fusione in sabbia'],
    ['Sis passos per a la primera colada amb PetroBond. Treballa sempre amb ulleres, guants i bona ventilació.', 'Seis pasos para la primera colada con PetroBond. Trabaja siempre con gafas, guantes y buena ventilación.', 'Six steps to your first pour with PetroBond. Always wear goggles and gloves and work in a well-ventilated area.', 'Sei passi per la prima colata con PetroBond. Lavora sempre con occhiali, guanti e buona ventilazione.'],
    ['Pas {n}', 'Paso {n}', 'Step {n}', 'Passo {n}'],
    ['Prepara la sorra', 'Prepara la arena', 'Prepare the sand', 'Prepara la sabbia'],
    ['Tamisa la PetroBond i desfés els grumolls. Ha de compactar-se a la mà i trencar-se net.', 'Tamiza la PetroBond y deshaz los grumos. Debe compactarse en la mano y romperse limpia.', 'Sieve the PetroBond and break up any lumps. It should hold together in your hand and break cleanly.', 'Setaccia la PetroBond e sciogli i grumi. Deve compattarsi in mano e rompersi netta.'],
    ['Fes el motlle', 'Haz el molde', 'Make the mould', 'Prepara lo stampo'],
    ['Posa el model a la meitat inferior del flascó, aplica pols separadora i compacta la sorra fins dalt.', 'Coloca el modelo en la mitad inferior de la caja, aplica polvo separador y compacta la arena hasta arriba.', 'Place the pattern in the lower half of the flask, dust with parting powder and ram the sand to the top.', 'Metti il modello nella metà inferiore della staffa, applica polvere distaccante e compatta la sabbia fino in cima.'],
    ['Obre els canals', 'Abre los canales', 'Cut the channels', 'Apri i canali'],
    ['Gira el flascó, col·loca la meitat superior, torna a compactar i obre el bebedor i els respiradors.', 'Gira la caja, coloca la mitad superior, vuelve a compactar y abre el bebedero y los respiraderos.', 'Turn the flask over, add the top half, ram again and cut the sprue and vents.', 'Gira la staffa, posiziona la metà superiore, compatta di nuovo e apri il canale di colata e gli sfiati.'],
    ['Treu el model', 'Saca el modelo', 'Remove the pattern', 'Togli il modello'],
    ['Separa les meitats amb cura, treu el model i torna a tancar el flascó amb les guies.', 'Separa las mitades con cuidado, saca el modelo y vuelve a cerrar la caja con las guías.', 'Carefully split the halves, lift out the pattern and close the flask again using the guides.', 'Separa le metà con cura, togli il modello e richiudi la staffa con le guide.'],
    ['Fon i cola', 'Funde y cuela', 'Melt and pour', 'Fondi e cola'],
    ['Fon el metall al crisol amb una mica de bòrax i aboca\'l d\'una sola vegada.', 'Funde el metal en el crisol con un poco de bórax y viértelo de una sola vez.', 'Melt the metal in the crucible with a little borax and pour in one go.', 'Fondi il metallo nel crogiolo con un po\' di borace e versalo in un\'unica volta.'],
    ['Desemmotlla', 'Desmolda', 'Shake out', 'Sforma'],
    ['Peces a mida', 'Piezas a medida', 'Custom parts', 'Pezzi su misura'],
    ['El transportista el necessita per lliurar el paquet.', 'El transportista lo necesita para entregar el paquete.', 'The courier needs it to deliver your parcel.', 'Il corriere ne ha bisogno per consegnare il pacco.'],
    ['Fundició, mecanitzat, CAD/CAM i impressió 3D per encàrrec.', 'Fundición, mecanizado, CAD/CAM e impresión 3D por encargo.', 'Casting, machining, CAD/CAM and 3D printing to order.', 'Fusione, lavorazione meccanica, CAD/CAM e stampa 3D su commissione.'],
    ['Veure el material de fosa', 'Ver el material de fundición', 'See casting supplies', 'Vedi il materiale per fusione'],
    ['Aviat hi haurà productes aquí.', 'Pronto habrá productos aquí.', 'Products coming soon.', 'Presto ci saranno prodotti qui.'],
    ['Si busques alguna cosa concreta, <a href="#/contacte">demana-ho</a> i te la busquem.', 'Si buscas algo concreto, <a href="#/contacte">pídelo</a> y te lo buscamos.', 'Looking for something specific? <a href="#/contacte">Ask us</a> and we\'ll find it.', 'Cerchi qualcosa di preciso? <a href="#/contacte">Chiedicelo</a> e lo troviamo noi.'],
    ['Deixa refredar la peça, obre el flascó i guarda la sorra per a la propera colada.', 'Deja enfriar la pieza, abre la caja y guarda la arena para la próxima colada.', 'Let the casting cool, open the flask and keep the sand for next time.', 'Lascia raffreddare il pezzo, apri la staffa e conserva la sabbia per la prossima colata.'],
    ['Entrega estimada: {range}.', 'Entrega estimada: {range}.', 'Estimated delivery: {range}.', 'Consegna stimata: {range}.'],
    ['Entrega estimada a la Península: {range}.', 'Entrega estimada en la Península: {range}.', 'Estimated delivery to mainland Spain: {range}.', 'Consegna stimata in Spagna continentale: {range}.'],
    ['Seguiment', 'Seguimiento', 'Track order', 'Tracciamento'],
    ['Segueix la teva comanda', 'Sigue tu pedido', 'Track your order', 'Segui il tuo ordine'],
    ['Escriu el número de comanda i el correu amb què has comprat.', 'Escribe el número de pedido y el correo con el que compraste.', 'Enter your order number and the email you used to buy.', 'Inserisci il numero d\'ordine e l\'e-mail usata per l\'acquisto.'],
    ['Número de comanda', 'Número de pedido', 'Order number', 'Numero d\'ordine'],
    ['Consulta la comanda', 'Consultar el pedido', 'Check order', 'Controlla l\'ordine'],
    ['Consultant…', 'Consultando…', 'Checking…', 'Controllo…'],
    ['No trobem cap comanda amb aquestes dades. Revisa el número i el correu amb què vas comprar.', 'No encontramos ningún pedido con estos datos. Revisa el número y el correo con el que compraste.', 'We couldn\'t find an order with these details. Check the number and the email you used to buy.', 'Nessun ordine trovato con questi dati. Controlla il numero e l\'e-mail usata per l\'acquisto.'],
    ['Comanda rebuda', 'Pedido recibido', 'Order received', 'Ordine ricevuto'],
    ['Preparant', 'Preparando', 'Preparing', 'In preparazione'],
    ['En camí', 'En camino', 'On its way', 'In viaggio'],
    ['Lliurada', 'Entregado', 'Delivered', 'Consegnato'],
    ['Pendent de pagament', 'Pendiente de pago', 'Awaiting payment', 'In attesa di pagamento'],
    ['Aquesta comanda s\'ha cancel·lat.', 'Este pedido se ha cancelado.', 'This order has been cancelled.', 'Questo ordine è stato annullato.'],
    ['Transportista', 'Transportista', 'Carrier', 'Corriere'],
    ['Número de seguiment', 'Número de seguimiento', 'Tracking number', 'Numero di tracciamento'],
    ['Segueix el paquet al transportista', 'Sigue el paquete en el transportista', 'Track the parcel with the carrier', 'Segui il pacco sul sito del corriere'],
    ['Encara no ha sortit. Quan el paquet surti, aquí hi veuràs el seguiment.', 'Aún no ha salido. Cuando salga el paquete, verás aquí el seguimiento.', 'It hasn\'t shipped yet. When the parcel leaves, you\'ll see the tracking here.', 'Non è ancora partito. Quando il pacco partirà, vedrai qui il tracciamento.'],
    ['Sortida: {date}', 'Salida: {date}', 'Shipped: {date}', 'Partenza: {date}'],
    ['Lliurada el {date}', 'Entregado el {date}', 'Delivered on {date}', 'Consegnato il {date}'],
    ['Estat del transportista: {status}', 'Estado del transportista: {status}', 'Carrier status: {status}', 'Stato del corriere: {status}'],
    ['Recollida al taller', 'Recogida en el taller', 'Pickup at the workshop', 'Ritiro in officina'],
    ['Quan tinguis el paquet, pots seguir-lo a <a href="#/seguiment">Seguiment</a> amb el número de comanda i el correu.', 'Cuando salga el paquete, puedes seguirlo en <a href="#/seguiment">Seguimiento</a> con el número de pedido y el correo.', 'Once it ships, you can follow it under <a href="#/seguiment">Track order</a> with your order number and email.', 'Quando parte il pacco, puoi seguirlo in <a href="#/seguiment">Tracciamento</a> con il numero d\'ordine e l\'e-mail.'],
    ['Consultant els preus dels transportistes…', 'Consultando los precios de los transportistas…', 'Checking carrier prices…', 'Controllo i prezzi dei corrieri…'],
    ['Veure el kit d\'iniciació', 'Ver el kit de iniciación', 'See the starter kit', 'Vedi il kit per iniziare'],
    ['No hem trobat aquesta pàgina.', 'No hemos encontrado esta página.', 'We couldn\'t find this page.', 'Pagina non trovata.'],
    ['Torna a l\'inici', 'Volver al inicio', 'Back to home', 'Torna alla home'],

    // Contacte
    ['Solucions', 'Soluciones', 'Solutions', 'Soluzioni'],
    ['Parla amb nosaltres.', 'Habla con nosotros.', 'Get in touch.', 'Parla con noi.'],
    ['Escriu-nos, truca\'ns o demana pressupost. Responem en 24 hores laborables.', 'Escríbenos, llámanos o pide presupuesto. Respondemos en 24 horas laborables.', 'Email us, call us or request a quote. We reply within 24 working hours.', 'Scrivici, chiamaci o richiedi un preventivo. Rispondiamo entro 24 ore lavorative.'],
    ['Correu', 'Correo', 'Email', 'Email'],
    ['Taller', 'Taller', 'Workshop', 'Officina'],
    ['Manresa (Barcelona)', 'Manresa (Barcelona)', 'Manresa, Barcelona (Spain)', 'Manresa (Barcellona)'],
    ['Si tens pressa, escriu-nos a {email}.', 'Si tienes prisa, escríbenos a {email}.', 'In a hurry? Email us at {email}.', 'Hai fretta? Scrivici a {email}.'],

    // Enviament
    ['Enviament a domicili', 'Envío a domicilio', 'Home delivery', 'Consegna a domicilio'],
    ['Entrega en 24–72 h laborables.', 'Entrega en 24–72 h laborables.', 'Delivered in 1–3 working days.', 'Consegna in 24–72 ore lavorative.'],
    ['Express 24 h', 'Exprés 24 h', 'Express 24 h', 'Express 24 h'],
    ['Entrega prioritària en 24 h laborables.', 'Entrega prioritaria en 24 h laborables.', 'Priority delivery within 24 working hours.', 'Consegna prioritaria in 24 ore lavorative.'],
    ['Recollida al taller', 'Recogida en el taller', 'Collect from our workshop', 'Ritiro in officina'],
    ['Et diem quan està a punt per recollir a {place}.', 'Te avisamos cuando esté listo para recoger en {place}.', 'We\'ll let you know when it\'s ready to collect in {place}.', 'Ti avvisiamo quando è pronto da ritirare a {place}.'],
    ['De moment no enviem a aquesta adreça. Pots recollir la comanda al taller o escriure\'ns a {email}.', 'De momento no enviamos a esta dirección. Puedes recoger el pedido en el taller o escribirnos a {email}.', 'We don\'t ship to this address yet. You can collect your order from our workshop or email us at {email}.', 'Per ora non spediamo a questo indirizzo. Puoi ritirare l\'ordine in officina o scriverci a {email}.'],
    ['La comanda pesa més de 30 kg. Escriu-nos a {email} i et preparem l\'enviament.', 'El pedido pesa más de 30 kg. Escríbenos a {email} y te preparamos el envío.', 'Your order weighs over 30 kg. Email us at {email} and we\'ll arrange shipping.', 'L\'ordine pesa più di 30 kg. Scrivici a {email} e organizziamo la spedizione.'],
    ['Enviament estimat (Península)', 'Envío estimado (Península)', 'Estimated shipping (mainland Spain)', 'Spedizione stimata (Spagna peninsulare)'],
    ['per agència, {price} a la Península.', 'por agencia, {price} en la Península.', 'by courier, {price} to mainland Spain.', 'con corriere, {price} in Spagna peninsulare.'],
    ['des de {price} a la Península, gratuït a partir de {free}.', 'desde {price} en la Península, gratis a partir de {free}.', 'from {price} to mainland Spain, free over {free}.', 'da {price} in Spagna peninsulare, gratis da {free}.'],
    ['Surt en 24–48 h laborables des de Manresa.', 'Sale en 24–48 h laborables desde Manresa.', 'Ships from Manresa within 24–48 working hours.', 'Parte da Manresa in 24–48 ore lavorative.'],
    ['Recollida:', 'Recogida:', 'Collection:', 'Ritiro:'],
    ['gratuïta al taller de Manresa.', 'gratis en el taller de Manresa.', 'free from our workshop in Manresa.', 'gratuito presso l\'officina di Manresa.'],

    // Avisos
    ['Instal·la Fundicat', 'Instala Fundicat', 'Install Fundicat', 'Installa Fundicat'],
    ['Obre la botiga des de la pantalla d\'inici, com una app.', 'Abre la tienda desde la pantalla de inicio, como una app.', 'Open the shop from your home screen, like an app.', 'Apri il negozio dalla schermata Home, come un\'app.'],
    ['Instal·la', 'Instalar', 'Install', 'Installa'],
    ['Toca {icon} i després «Afegeix a la pantalla d\'inici».', 'Toca {icon} y después «Añadir a pantalla de inicio».', 'Tap {icon}, then “Add to Home Screen”.', 'Tocca {icon} e poi «Aggiungi alla schermata Home».'],
    ['Ara no', 'Ahora no', 'Not now', 'Non ora'],
    ['Instal·la l\'app', 'Instalar la app', 'Install the app', 'Installa l\'app'],
    ['Comparteix', 'Compartir', 'Share', 'Condividi'],
    ['{name} s\'ha afegit a la cistella.', '{name} se ha añadido a la cesta.', '{name} has been added to your basket.', '{name} è stato aggiunto al carrello.'],
    ['S\'han afegit {n} productes a la cistella.', 'Se han añadido {n} productos a la cesta.', '{n} items have been added to your basket.', 'Sono stati aggiunti {n} prodotti al carrello.'],
    ['Veure la cistella', 'Ver la cesta', 'View basket', 'Vedi il carrello'],

    // Materials difícils de trobar
    ['Difícils de trobar', 'Difíciles de encontrar', 'Hard to find', 'Introvabili'],
    ['Difícil de trobar', 'Difícil de encontrar', 'Hard to find', 'Introvabile'],
    ['Origen', 'Origen', 'Origin', 'Origine'],
    ['Banya natural', 'Asta natural', 'Natural antler', 'Palco naturale'],
    ['Europa', 'Europa', 'Europe', 'Europa'],
    ['Mànecs · joieria', 'Mangos · joyería', 'Handles · jewellery', 'Manici · gioielleria'],
    ['Fosa de joieria', 'Fundición de joyería', 'Jewellery casting', 'Fusione di gioielli'],
    ['2 unitats', '2 unidades', '2 pieces', '2 pezzi'],
    ['Fusta i resina', 'Madera y resina', 'Wood and resin', 'Legno e resina'],
    ['Mànecs · torn', 'Mangos · torno', 'Handles · turning', 'Manici · tornio'],
    ['Catalunya', 'Cataluña', 'Catalonia', 'Catalogna'],
    ['Talla · torn · mànecs', 'Talla · torno · mangos', 'Carving · turning · handles', 'Intaglio · tornio · manici'],
    ['Parell', 'Par', 'Pair', 'Coppia'],
    ['Mànecs · incrustacions', 'Mangos · incrustaciones', 'Handles · inlays', 'Manici · intarsi'],
    ['4 plaques', '4 placas', '4 blanks', '4 placchette'],
    ['Incrustacions · joieria', 'Incrustaciones · joyería', 'Inlays · jewellery', 'Intarsi · gioielleria'],
    ['Bronze al silici', 'Bronce al silicio', 'Silicon bronze', 'Bronzo al silicio'],
    ['Fosa artística', 'Fundición artística', 'Art casting', 'Fusione artistica'],
    ['Blocs', 'Bloques', 'Blocks', 'Blocchi'],
    ['Joieria · escultura', 'Joyería · escultura', 'Jewellery · sculpture', 'Gioielleria · scultura'],
    ['25 fulls', '25 hojas', '25 leaves', '25 fogli'],
    ['Or de 22 quirats', 'Oro de 22 quilates', '22-carat gold', 'Oro a 22 carati'],
    ['Daurat', 'Dorado', 'Gilding', 'Doratura'],
    ['Acer damasc', 'Acero damasco', 'Damascus steel', 'Acciaio damasco'],
    ['Ganiveteria', 'Cuchillería', 'Knifemaking', 'Coltelleria'],

    // Especificacions (claus i valors)
    ['Pes', 'Peso', 'Weight', 'Peso'],
    ['Aglutinant', 'Aglutinante', 'Binder', 'Legante'],
    ['Ús', 'Uso', 'Use', 'Uso'],
    ['Reutilitzable', 'Reutilizable', 'Reusable', 'Riutilizzabile'],
    ['Inclou', 'Incluye', 'Includes', 'Include'],
    ['Flascó', 'Caja de moldeo', 'Flask', 'Staffa'],
    ['Crisol', 'Crisol', 'Crucible', 'Crogiolo'],
    ['Nivell', 'Nivel', 'Level', 'Livello'],
    ['Capacitat', 'Capacidad', 'Capacity', 'Capacità'],
    ['Material', 'Material', 'Material', 'Materiale'],
    ['Temp. màx.', 'Temp. máx.', 'Max. temp.', 'Temp. max.'],
    ['Mida', 'Medida', 'Size', 'Misura'],
    ['Peces', 'Piezas', 'Parts', 'Pezzi'],
    ['Fabricació', 'Fabricación', 'Made in', 'Produzione'],
    ['Aplicació', 'Aplicación', 'Application', 'Applicazione'],
    ['Format', 'Formato', 'Form', 'Formato'],
    ['Llargada', 'Longitud', 'Length', 'Lunghezza'],
    ['Crisols', 'Crisoles', 'Crucibles', 'Crogioli'],
    ['Alimentació', 'Alimentación', 'Power', 'Alimentazione'],
    ['Control', 'Control', 'Control', 'Controllo'],
    ['Combustible', 'Combustible', 'Fuel', 'Combustibile'],
    ['Revestiment', 'Revestimiento', 'Lining', 'Rivestimento'],
    ['Cavitats', 'Cavidades', 'Cavities', 'Cavità'],
    ['Oli', 'Aceite', 'Oil', 'Olio'],
    ['Sí', 'Sí', 'Yes', 'Sì'],
    ['Joieria · fosa artística', 'Joyería · fundición artística', 'Jewellery · art casting', 'Gioielleria · fusione artistica'],
    ['Taller · fosa artística', 'Taller · fundición artística', 'Workshop · art casting', 'Officina · fusione artistica'],
    ['4 elements', '4 elementos', '4 items', '4 elementi'],
    ['Principiant', 'Principiante', 'Beginner', 'Principiante'],
    ['1 kg (plata)', '1 kg (plata)', '1 kg (silver)', '1 kg (argento)'],
    ['3 kg (plata)', '3 kg (plata)', '3 kg (silver)', '3 kg (argento)'],
    ['Grafit', 'Grafito', 'Graphite', 'Grafite'],
    ['Forn elèctric o de gas', 'Horno eléctrico o de gas', 'Electric or gas furnace', 'Forno elettrico o a gas'],
    ['Alumini', 'Aluminio', 'Aluminium', 'Alluminio'],
    ['2 + guies', '2 + guías', '2 + guides', '2 + guide'],
    ['Mecanitzat a Manresa', 'Mecanizado en Manresa', 'Machined in Manresa', 'Lavorato a Manresa'],
    ['Separació de motlles', 'Separación de moldes', 'Mould parting', 'Distacco stampi'],
    ['Saquet de tela', 'Saquito de tela', 'Cloth bag', 'Sacchetto di tela'],
    ['Or · plata · bronze', 'Oro · plata · bronce', 'Gold · silver · bronze', 'Oro · argento · bronzo'],
    ['Or · plata · bronze · alumini', 'Oro · plata · bronce · aluminio', 'Gold · silver · bronze · aluminium', 'Oro · argento · bronzo · alluminio'],
    ['Pols', 'Polvo', 'Powder', 'Polvere'],
    ['Acer', 'Acero', 'Steel', 'Acciaio'],
    ['Digital PID', 'Digital PID', 'Digital PID', 'Digitale PID'],
    ['Fins a 6 kg', 'Hasta 6 kg', 'Up to 6 kg', 'Fino a 6 kg'],
    ['Propà', 'Propano', 'Propane', 'Propano'],
    ['Refractari', 'Refractario', 'Refractory', 'Refrattario'],
    ['Exterior', 'Exterior', 'Outdoors', 'Esterno'],
  ];

  // Contingut del catàleg (camps que no són especificacions).
  const DATA_TR = {
    es: {
      categories: {
        sorres: ['Arenas de moldeo', 'PetroBond y arenas verdes para fundición en molde de arena.'],
        eines: ['Herramientas y crisoles', 'Crisoles, cajas de moldeo, pinzas y accesorios de taller.'],
        kits: ['Kits', 'Todo lo necesario para hacer la primera colada.'],
        consumibles: ['Consumibles', 'Fundentes, polvo separador y recambios.'],
        equips: ['Equipos', 'Hornos de fusión y aparatos para el taller de fundición.'],
        singulars: ['Difíciles de encontrar', 'Materiales singulares para artesanos: asta de ciervo, hueso de sepia, maderas estabilizadas, nácar, pan de oro y más.'],
      },
      products: {
        'petrobond-5': { name: 'Arena PetroBond', badge: 'Más vendido', short: 'Arena aglutinada con aceite para fundición de joyería, bronce, aluminio y plata.', description: ['La PetroBond es una arena fina aglutinada con aceite: no hay que humedecerla y conserva la forma después de cada colada. Es la base para hacer moldes de arena precisos en casa o en el taller.', 'Ideal para joyería, medallas, pequeñas piezas de aluminio, bronce, latón y plata. Se puede reutilizar muchas veces tamizándola y compactándola de nuevo.'] },
        'petrobond-10': { name: 'Arena PetroBond', short: 'El formato de taller: el doble de arena para cajas de moldeo más grandes.', description: ['La misma arena que el formato de 5 kg, pensada para quien hace coladas a menudo o trabaja con cajas grandes.'] },
        'kit-inici': { name: 'Kit de iniciación a la fundición', badge: 'Nuevo', variant: 'PetroBond 5 kg + caja + crisol', short: 'Arena, caja de moldeo de aluminio de dos piezas, crisol de grafito y polvo separador.', description: ['Todo lo que necesitas para hacer tu primera pieza. Incluye una guía paso a paso.'] },
        'crisol-1': { name: 'Crisol de grafito', short: 'Crisol de grafito de alta densidad para metales no férricos.', description: ['Crisol robusto para fundir oro, plata, bronce, latón y aluminio.'] },
        'flasco-150': { name: 'Caja de moldeo', variant: 'Aluminio · 150 × 100 mm', short: 'Caja de molde de dos piezas con guías de centrado.', description: ['Caja mecanizada en nuestro taller. Las guías aseguran que las dos mitades cierren siempre en el mismo sitio.'] },
        'pols-sep': { name: 'Polvo separador', short: 'Evita que las dos mitades del molde se peguen.', description: ['Polvo fino para separar las mitades del molde y sacar el modelo limpio.'] },
        borax: { name: 'Bórax fundente', short: 'Fundente para limpiar el metal fundido y mejorar la colada.', description: ['Ayuda a eliminar óxidos e impurezas del baño de metal.'] },
        pinces: { name: 'Pinzas para crisol', variant: 'Acero · 40 cm', short: 'Pinzas de acero para manipular crisoles de 1 a 2 kg con seguridad.', description: ['Pico curvado que abraza el crisol para verter con control.'] },
        'forn-electric': { name: 'Horno de fusión eléctrico', variant: '3 kg · hasta 1.150 °C', short: 'Horno de sobremesa con control de temperatura para fundir plata, bronce y aluminio.', description: ['Horno compacto para joyería y pequeñas coladas. Calentamiento rápido y temperatura estable.'] },
        'forn-gas': { name: 'Horno de gas', variant: 'Para crisoles de hasta 6 kg', short: 'Horno de propano con revestimiento refractario para coladas más grandes.', description: ['Pensado para aluminio y bronce en cantidades de taller. Debe usarse en el exterior.'] },
        lingotera: { name: 'Lingotera', variant: 'Acero · 4 cavidades', short: 'Molde de acero para hacer lingotes con el metal sobrante.', description: ['Guarda el metal sobrante en lingotes limpios, listos para la próxima colada.'] },
      },
      parts: ['Casquillo guía Ø 3,75 mm', 'Casquillo guía Ø 3,80 mm', 'Soporte de rodamiento frontal'],
      services: {
        solucions: { name: 'Soluciones industriales', short: 'Recambios, utillaje y mejoras de maquinaria.', lead: 'Resolvemos problemas de producción: piezas descatalogadas, utillaje a medida y adaptaciones de máquina. Del diagnóstico al montaje.', points: [['Recambios descatalogados', 'Reproducimos piezas que ya no se fabrican a partir de una muestra o de un plano antiguo.'], ['Utillaje y plantillas', 'Útiles de sujeción, plantillas de montaje y galgas de control para la línea.'], ['Mejoras de maquinaria', 'Adaptaciones y piezas reforzadas para alargar la vida de la máquina.'], ['Proyecto completo', 'Diseño, fabricación y entrega coordinados por un solo taller.']], uses: ['Mantenimiento industrial', 'Líneas de producción', 'Maquinaria agrícola', 'Automoción'] },
        fundicio: { name: 'Servicio de fundición', short: 'Piezas en aluminio, bronce y latón.', lead: 'Fundición en molde de arena, desde una sola pieza hasta series cortas. En bruto o acabada en nuestro taller de mecanizado.', points: [['Fundición en arena', 'Moldes de arena aglutinada para piezas únicas y series cortas.'], ['Modelos a medida', 'Hacemos el modelo a partir de tu plano, de una pieza existente o de una impresión 3D.'], ['Metales no férricos', 'Aluminio, bronce y latón, según el uso de la pieza.'], ['Acabado incluido', 'Podemos entregar la pieza mecanizada, pulida y lista para montar.']], uses: ['Recambios industriales', 'Escultura y pieza artística', 'Joyería', 'Restauración'] },
        mecanitzat: { name: 'Mecanizado', short: 'Del plano a la pieza en una semana.', lead: 'Recambios y series cortas para la industria y para particulares: casquillos, guías, soportes, cajas de moldeo y utillaje.', points: [['Materiales', 'Aluminio, acero, inoxidable, latón, bronce y plásticos técnicos.'], ['Precisión', 'Ajustes para guías y alojamientos de rodamiento.'], ['Cantidades', 'Desde una sola pieza hasta centenares de unidades.'], ['Plazo', 'Normalmente, una semana desde que se acepta el presupuesto.']], uses: ['Recambios', 'Series cortas', 'Prototipos', 'Utillaje'] },
        cadcam: { name: 'Diseño CAD/CAM', short: 'De la idea al modelo 3D y al programa de fabricación.', lead: 'Convertimos una idea, un boceto o una pieza física en un modelo 3D, planos técnicos y el programa para fabricarla.', points: [['Modelado 3D', 'Diseño de piezas y conjuntos con planos acotados para fabricar.'], ['Ingeniería inversa', 'Medimos una pieza existente y hacemos su modelo digital.'], ['Programación CAM', 'Trayectorias de mecanizado preparadas para la máquina.'], ['Formatos estándar', 'Entregamos en STEP, IGES, DXF, STL y PDF.']], uses: ['Nuevos productos', 'Recambios sin plano', 'Preparación para fundición', 'Documentación técnica'] },
        impressio3d: { name: 'Impresión 3D', short: 'Prototipos, modelos para fundición y piezas funcionales.', lead: 'Prototipos rápidos para validar un diseño, modelos para fundición y piezas funcionales en plásticos técnicos, sin necesidad de molde.', points: [['Prototipos', 'Valida la forma y el montaje antes de fabricar en metal.'], ['Modelos para fundición', 'Patrones impresos para hacer el molde de arena sin tallar madera.'], ['Piezas funcionales', 'Soportes, carcasas y recambios en plásticos técnicos.'], ['Series cortas', 'Decenas de unidades sin el coste de un molde.']], uses: ['Prototipado', 'Patrones de fundición', 'Recambios de plástico', 'Maquetas'] },
      },
    },
    en: {
      categories: {
        sorres: ['Moulding sands', 'PetroBond and green sands for sand casting.'],
        eines: ['Tools and crucibles', 'Crucibles, flasks, tongs and workshop accessories.'],
        kits: ['Kits', 'Everything you need for your first pour.'],
        consumibles: ['Consumables', 'Fluxes, parting powder and spares.'],
        equips: ['Equipment', 'Melting furnaces and equipment for the casting workshop.'],
        singulars: ['Hard to find', 'Unusual materials for makers: deer antler, cuttlefish bone, stabilised wood, mother-of-pearl, gold leaf and more.'],
      },
      products: {
        'petrobond-5': { name: 'PetroBond sand', badge: 'Best seller', short: 'Oil-bonded sand for casting jewellery, bronze, aluminium and silver.', description: ['PetroBond is a fine oil-bonded sand: it needs no water and holds its shape after every pour. It\'s the basis for precise sand moulds at home or in the workshop.', 'Ideal for jewellery, medals and small parts in aluminium, bronze, brass and silver. It can be reused many times by sieving and ramming it again.'] },
        'petrobond-10': { name: 'PetroBond sand', short: 'The workshop size: twice the sand for larger flasks.', description: ['The same sand as the 5 kg pack, for those who pour often or work with large flasks.'] },
        'kit-inici': { name: 'Sand casting starter kit', badge: 'New', variant: 'PetroBond 5 kg + flask + crucible', short: 'Sand, two-part aluminium flask, graphite crucible and parting powder.', description: ['Everything you need to make your first casting. Includes a step-by-step guide.'] },
        'crisol-1': { name: 'Graphite crucible', short: 'High-density graphite crucible for non-ferrous metals.', description: ['A sturdy crucible for melting gold, silver, bronze, brass and aluminium.'] },
        'flasco-150': { name: 'Moulding flask', variant: 'Aluminium · 150 × 100 mm', short: 'Two-part mould flask with centring guides.', description: ['Machined in our workshop. The guides make sure both halves always close in the same position.'] },
        'pols-sep': { name: 'Parting powder', short: 'Stops the two mould halves from sticking.', description: ['Fine powder to separate the mould halves and lift the pattern out cleanly.'] },
        borax: { name: 'Borax flux', short: 'Flux to clean the molten metal and improve the pour.', description: ['Helps remove oxides and impurities from the melt.'] },
        pinces: { name: 'Crucible tongs', variant: 'Steel · 40 cm', short: 'Steel tongs to handle 1–2 kg crucibles safely.', description: ['Curved jaws grip the crucible for a controlled pour.'] },
        'forn-electric': { name: 'Electric melting furnace', variant: '3 kg · up to 1,150 °C', short: 'Benchtop furnace with temperature control for melting silver, bronze and aluminium.', description: ['A compact furnace for jewellery and small pours. Fast heat-up and stable temperature.'] },
        'forn-gas': { name: 'Gas furnace', variant: 'For crucibles up to 6 kg', short: 'Propane furnace with refractory lining for larger pours.', description: ['Designed for aluminium and bronze in workshop quantities. For outdoor use only.'] },
        lingotera: { name: 'Ingot mould', variant: 'Steel · 4 cavities', short: 'Steel mould for casting leftover metal into ingots.', description: ['Store leftover metal as clean ingots, ready for your next pour.'] },
      },
      parts: ['Guide bushing Ø 3.75 mm', 'Guide bushing Ø 3.80 mm', 'Front bearing housing'],
      services: {
        solucions: { name: 'Industrial solutions', short: 'Spare parts, tooling and machine upgrades.', lead: 'We solve production problems: discontinued parts, custom tooling and machine modifications. From diagnosis to installation.', points: [['Discontinued spares', 'We reproduce parts that are no longer made, from a sample or an old drawing.'], ['Tooling and jigs', 'Fixtures, assembly jigs and inspection gauges for your line.'], ['Machine upgrades', 'Modifications and reinforced parts to extend machine life.'], ['End-to-end projects', 'Design, manufacturing and delivery coordinated by one workshop.']], uses: ['Industrial maintenance', 'Production lines', 'Agricultural machinery', 'Automotive'] },
        fundicio: { name: 'Casting service', short: 'Parts in aluminium, bronze and brass.', lead: 'Sand casting, from a single part to short runs. As cast or finished in our machine shop.', points: [['Sand casting', 'Bonded sand moulds for one-off parts and short runs.'], ['Custom patterns', 'We make the pattern from your drawing, an existing part or a 3D print.'], ['Non-ferrous metals', 'Aluminium, bronze and brass, depending on how the part will be used.'], ['Finishing included', 'We can deliver the part machined, polished and ready to fit.']], uses: ['Industrial spares', 'Sculpture and art pieces', 'Jewellery', 'Restoration'] },
        mecanitzat: { name: 'CNC machining', short: 'From drawing to part in one week.', lead: 'Spare parts and short runs for industry and individuals: bushings, guides, brackets, flasks and tooling.', points: [['Materials', 'Aluminium, steel, stainless steel, brass, bronze and engineering plastics.'], ['Precision', 'Fits for guides and bearing housings.'], ['Quantities', 'From a single part to hundreds of units.'], ['Lead time', 'Usually one week from quote approval.']], uses: ['Spare parts', 'Short runs', 'Prototypes', 'Tooling'] },
        cadcam: { name: 'CAD/CAM design', short: 'From idea to 3D model and toolpaths.', lead: 'We turn an idea, a sketch or a physical part into a 3D model, technical drawings and the program to make it.', points: [['3D modelling', 'Parts and assemblies designed with dimensioned drawings ready for manufacture.'], ['Reverse engineering', 'We measure an existing part and build its digital model.'], ['CAM programming', 'Machining toolpaths ready for the machine.'], ['Standard formats', 'Delivered as STEP, IGES, DXF, STL and PDF.']], uses: ['New products', 'Spares without drawings', 'Casting preparation', 'Technical documentation'] },
        impressio3d: { name: '3D printing', short: 'Prototypes, casting patterns and functional parts.', lead: 'Rapid prototypes to validate a design, casting patterns and functional parts in engineering plastics, with no mould needed.', points: [['Prototypes', 'Check form and fit before making it in metal.'], ['Casting patterns', 'Printed patterns for sand moulds, no woodwork needed.'], ['Functional parts', 'Brackets, housings and spares in engineering plastics.'], ['Short runs', 'Dozens of units without the cost of a mould.']], uses: ['Prototyping', 'Casting patterns', 'Plastic spares', 'Models'] },
      },
    },
    it: {
      categories: {
        sorres: ['Sabbie da formatura', 'PetroBond e terre verdi per la fusione in sabbia.'],
        eines: ['Utensili e crogioli', 'Crogioli, staffe, pinze e accessori da officina.'],
        kits: ['Kit', 'Tutto il necessario per la prima colata.'],
        consumibles: ['Consumabili', 'Fondenti, polvere distaccante e ricambi.'],
        equips: ['Attrezzature', 'Forni fusori e attrezzature per il laboratorio di fusione.'],
        singulars: ['Introvabili', 'Materiali particolari per artigiani: palco di cervo, osso di seppia, legni stabilizzati, madreperla, foglia d\'oro e altro.'],
      },
      products: {
        'petrobond-5': { name: 'Sabbia PetroBond', badge: 'Più venduto', short: 'Sabbia legata a olio per fusione di gioielli, bronzo, alluminio e argento.', description: ['La PetroBond è una sabbia fine legata a olio: non va inumidita e mantiene la forma dopo ogni colata. È la base per stampi in sabbia precisi a casa o in officina.', 'Ideale per gioielli, medaglie e piccoli pezzi in alluminio, bronzo, ottone e argento. Si riutilizza molte volte setacciandola e compattandola di nuovo.'] },
        'petrobond-10': { name: 'Sabbia PetroBond', short: 'Il formato da officina: il doppio della sabbia per staffe più grandi.', description: ['La stessa sabbia del formato da 5 kg, pensata per chi fa colate spesso o lavora con staffe grandi.'] },
        'kit-inici': { name: 'Kit per iniziare la fusione', badge: 'Novità', variant: 'PetroBond 5 kg + staffa + crogiolo', short: 'Sabbia, staffa in alluminio in due parti, crogiolo in grafite e polvere distaccante.', description: ['Tutto il necessario per realizzare il primo pezzo. Include una guida passo passo.'] },
        'crisol-1': { name: 'Crogiolo in grafite', short: 'Crogiolo in grafite ad alta densità per metalli non ferrosi.', description: ['Crogiolo robusto per fondere oro, argento, bronzo, ottone e alluminio.'] },
        'flasco-150': { name: 'Staffa da formatura', variant: 'Alluminio · 150 × 100 mm', short: 'Staffa in due parti con guide di centraggio.', description: ['Lavorata nella nostra officina. Le guide fanno chiudere le due metà sempre nella stessa posizione.'] },
        'pols-sep': { name: 'Polvere distaccante', short: 'Evita che le due metà dello stampo si attacchino.', description: ['Polvere fine per separare le metà dello stampo ed estrarre il modello pulito.'] },
        borax: { name: 'Borace fondente', short: 'Fondente per pulire il metallo fuso e migliorare la colata.', description: ['Aiuta a eliminare ossidi e impurità dal bagno di metallo.'] },
        pinces: { name: 'Pinze per crogiolo', variant: 'Acciaio · 40 cm', short: 'Pinze in acciaio per maneggiare crogioli da 1 a 2 kg in sicurezza.', description: ['Becco curvo che abbraccia il crogiolo per versare con controllo.'] },
        'forn-electric': { name: 'Forno fusorio elettrico', variant: '3 kg · fino a 1.150 °C', short: 'Forno da banco con controllo della temperatura per fondere argento, bronzo e alluminio.', description: ['Forno compatto per gioielleria e piccole colate. Riscaldamento rapido e temperatura stabile.'] },
        'forn-gas': { name: 'Forno a gas', variant: 'Per crogioli fino a 6 kg', short: 'Forno a propano con rivestimento refrattario per colate più grandi.', description: ['Pensato per alluminio e bronzo in quantità da officina. Da usare all\'esterno.'] },
        lingotera: { name: 'Lingottiera', variant: 'Acciaio · 4 cavità', short: 'Stampo in acciaio per fare lingotti con il metallo avanzato.', description: ['Conserva il metallo avanzato in lingotti puliti, pronti per la prossima colata.'] },
      },
      parts: ['Boccola di guida Ø 3,75 mm', 'Boccola di guida Ø 3,80 mm', 'Supporto cuscinetto frontale'],
      services: {
        solucions: { name: 'Soluzioni industriali', short: 'Ricambi, attrezzature e migliorie per macchinari.', lead: 'Risolviamo problemi di produzione: pezzi fuori produzione, attrezzature su misura e modifiche alle macchine. Dalla diagnosi al montaggio.', points: [['Ricambi fuori produzione', 'Riproduciamo pezzi non più fabbricati partendo da un campione o da un vecchio disegno.'], ['Attrezzature e maschere', 'Attrezzi di bloccaggio, maschere di montaggio e calibri di controllo per la linea.'], ['Migliorie ai macchinari', 'Modifiche e pezzi rinforzati per allungare la vita della macchina.'], ['Progetto completo', 'Progettazione, produzione e consegna coordinate da un\'unica officina.']], uses: ['Manutenzione industriale', 'Linee di produzione', 'Macchine agricole', 'Automotive'] },
        fundicio: { name: 'Servizio di fonderia', short: 'Pezzi in alluminio, bronzo e ottone.', lead: 'Fusione in staffa con sabbia, da un solo pezzo a piccole serie. Grezzo o finito nella nostra officina meccanica.', points: [['Fusione in sabbia', 'Stampi in sabbia legata per pezzi unici e piccole serie.'], ['Modelli su misura', 'Realizziamo il modello dal tuo disegno, da un pezzo esistente o da una stampa 3D.'], ['Metalli non ferrosi', 'Alluminio, bronzo e ottone, secondo l\'uso del pezzo.'], ['Finitura inclusa', 'Possiamo consegnare il pezzo lavorato, lucidato e pronto da montare.']], uses: ['Ricambi industriali', 'Scultura e pezzi artistici', 'Gioielleria', 'Restauro'] },
        mecanitzat: { name: 'Lavorazione meccanica', short: 'Dal disegno al pezzo in una settimana.', lead: 'Ricambi e piccole serie per l\'industria e per privati: boccole, guide, supporti, staffe e attrezzature.', points: [['Materiali', 'Alluminio, acciaio, inox, ottone, bronzo e tecnopolimeri.'], ['Precisione', 'Accoppiamenti per guide e sedi di cuscinetti.'], ['Quantità', 'Da un solo pezzo a centinaia di unità.'], ['Tempi', 'Di solito una settimana dall\'accettazione del preventivo.']], uses: ['Ricambi', 'Piccole serie', 'Prototipi', 'Attrezzature'] },
        cadcam: { name: 'Progettazione CAD/CAM', short: 'Dall\'idea al modello 3D e al programma di produzione.', lead: 'Trasformiamo un\'idea, uno schizzo o un pezzo fisico in un modello 3D, disegni tecnici e il programma per produrlo.', points: [['Modellazione 3D', 'Progettazione di pezzi e assiemi con disegni quotati pronti per la produzione.'], ['Reverse engineering', 'Misuriamo un pezzo esistente e ne creiamo il modello digitale.'], ['Programmazione CAM', 'Percorsi utensile pronti per la macchina.'], ['Formati standard', 'Consegniamo in STEP, IGES, DXF, STL e PDF.']], uses: ['Nuovi prodotti', 'Ricambi senza disegno', 'Preparazione per la fusione', 'Documentazione tecnica'] },
        impressio3d: { name: 'Stampa 3D', short: 'Prototipi, modelli per fonderia e pezzi funzionali.', lead: 'Prototipi rapidi per validare un progetto, modelli per fonderia e pezzi funzionali in tecnopolimeri, senza bisogno di stampo.', points: [['Prototipi', 'Verifica forma e montaggio prima di produrre in metallo.'], ['Modelli per fonderia', 'Modelli stampati per lo stampo in sabbia, senza lavorare il legno.'], ['Pezzi funzionali', 'Supporti, carter e ricambi in tecnopolimeri.'], ['Piccole serie', 'Decine di unità senza il costo di uno stampo.']], uses: ['Prototipazione', 'Modelli per fonderia', 'Ricambi in plastica', 'Plastici'] },
      },
    },
  };

  const dict = {};
  S.forEach((row) => { dict[row[0]] = row; });

  let lang = 'ca';
  try { lang = localStorage.getItem('fc.lang') || ''; } catch { /* mode privat */ }
  if (!ORDER.includes(lang)) {
    const nav = (navigator.language || 'ca').slice(0, 2);
    lang = ORDER.includes(nav) ? nav : 'ca';
  }

  const fill = (str, vars) => (vars ? str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`)) : str);
  const t = (key, vars) => {
    const row = dict[key];
    const out = row && lang !== 'ca' ? row[ORDER.indexOf(lang)] || key : key;
    return fill(out, vars);
  };

  // Sobreescriu els camps del catàleg amb la traducció, partint sempre de l'original en català.
  let base = null;
  function localizeData(DATA) {
    if (!base) base = JSON.parse(JSON.stringify({ categories: DATA.categories, products: DATA.products, services: DATA.services, customParts: DATA.customParts, announcements: DATA.announcements || [], home: DATA.home || {} }));
    const tr = DATA_TR[lang] || {};
    DATA.categories.forEach((c, i) => {
      const b = base.categories[i];
      const x = tr.categories?.[c.id];
      Object.assign(c, { name: x ? x[0] : b.name, blurb: x ? x[1] : b.blurb });
    });
    DATA.products.forEach((p, i) => {
      const b = base.products[i];
      // Traducció desada des del panell d'admin > traducció de fàbrica > català.
      const x = lang === 'ca' ? {} : { ...(tr.products?.[p.id] || {}), ...(b.i18n?.[lang] || {}) };
      if (Array.isArray(x.description) && !x.description.length) delete x.description;
      Object.assign(p, {
        name: x.name || b.name,
        variant: x.variant || b.variant,
        short: x.short || b.short,
        description: x.description || b.description,
        badge: b.badge ? x.badge || t(b.badge) : undefined,
        specs: Object.fromEntries(Object.entries(b.specs).map(([k, v]) => [t(k), t(v)])),
      });
    });
    DATA.services.forEach((s, i) => Object.assign(s, base.services[i], tr.services?.[s.id] || {}));
    DATA.customParts.forEach((p, i) => { p.name = tr.parts?.[i] || base.customParts[i].name; });
    // Textos de portada: en català, el del panell; en altres idiomes, la traducció del panell
    // o, si no n'hi ha, el text per defecte de la botiga (camp buit).
    if (DATA.home) {
      ['heroTitle', 'heroLead'].forEach((f) => { DATA.home[f] = lang === 'ca' ? base.home[f] || '' : base.home.i18n?.[lang]?.[f] || ''; });
    }
    (DATA.announcements || []).forEach((a, i) => {
      const b = base.announcements[i];
      const x = lang === 'ca' ? {} : b.i18n?.[lang] || {};
      ['text', 'title', 'subtitle', 'cta'].forEach((f) => { a[f] = x[f] || b[f]; });
    });
  }

  // Textos de l'HTML estàtic: data-i18n (text) i data-i18n-aria (aria-label).
  function applyStatic(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      if (!el.dataset.i18n) el.dataset.i18n = el.textContent.trim();
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      if (!el.dataset.i18nAria) el.dataset.i18nAria = el.getAttribute('aria-label');
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    document.documentElement.lang = lang;
  }

  const listeners = new Set();
  window.I18N = {
    langs: LANGS,
    get lang() { return lang; },
    locale: () => LANGS.find((l) => l.id === lang).locale,
    t,
    localizeData,
    applyStatic,
    set(next) {
      if (!ORDER.includes(next) || next === lang) return;
      lang = next;
      try { localStorage.setItem('fc.lang', lang); } catch { /* mode privat */ }
      if (window.FUNDICAT_DATA) localizeData(window.FUNDICAT_DATA);
      applyStatic();
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn) => listeners.add(fn),
  };
})();
