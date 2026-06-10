const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
const output = path.join(__dirname, 'voedselveiligheidsplan-oergezond.pdf');
doc.pipe(fs.createWriteStream(output));

const c = { black: '#1a1a1a', dark: '#2d2d2d', accent: '#1A2E1A', light: '#666', line: '#d0d0d0', bg: '#f5f5f0' };
const pw = 495; // page width for content

function title(t) { doc.fontSize(22).font('Helvetica-Bold').fillColor(c.accent).text(t); doc.moveDown(0.3); }
function h1(t) { checkPage(60); doc.fontSize(14).font('Helvetica-Bold').fillColor(c.accent).text(t); doc.moveDown(0.2); doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(c.line).lineWidth(0.5).stroke(); doc.moveDown(0.3); }
function h2(t) { checkPage(40); doc.fontSize(11).font('Helvetica-Bold').fillColor(c.accent).text(t); doc.moveDown(0.2); }
function p(t) { doc.fontSize(9.5).font('Helvetica').fillColor(c.dark).text(t, { lineGap: 3, width: pw }); doc.moveDown(0.25); }
function b(t) { doc.fontSize(9.5).font('Helvetica-Bold').fillColor(c.black).text(t, { lineGap: 3, width: pw }); doc.moveDown(0.2); }
function gap(n) { doc.moveDown(n || 0.3); }
function checkPage(needed) { if (doc.y + needed > 770) doc.addPage(); }

function tableRow(cols, widths, bold) {
  checkPage(20);
  const y = doc.y;
  const font = bold ? 'Helvetica-Bold' : 'Helvetica';
  const color = bold ? c.accent : c.dark;
  const bgColor = bold ? '#eef0eb' : null;
  let x = 50;
  if (bgColor) { doc.rect(x, y - 2, pw, 18).fill(bgColor); }
  cols.forEach((col, i) => {
    doc.fontSize(8.5).font(font).fillColor(color).text(col, x + 4, y + 2, { width: widths[i] - 8 });
    x += widths[i];
  });
  doc.y = y + Math.max(18, doc.heightOfString(cols.join(''), { width: 100, fontSize: 8.5 }) + 6);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0e0e0').lineWidth(0.3).stroke();
  doc.moveDown(0.05);
}

function simpleRow(label, value) {
  checkPage(18);
  const y = doc.y;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.dark).text(label, 54, y, { width: 160 });
  doc.fontSize(9).font('Helvetica').fillColor(c.dark).text(value, 220, y, { width: 320 });
  doc.y = y + Math.max(14, doc.heightOfString(value, { width: 320, fontSize: 9 }) + 4);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#eee').lineWidth(0.3).stroke();
  doc.moveDown(0.08);
}

// ===== COVER =====
doc.moveDown(6);
doc.fontSize(32).font('Helvetica-Bold').fillColor(c.accent).text('Voedselveiligheidsplan', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(16).font('Helvetica').fillColor(c.dark).text('Oergezond \u2014 Voedingssupplementen', { align: 'center' });
doc.moveDown(2);
doc.fontSize(10).font('Helvetica').fillColor(c.light).text('Versie 1.0 | 26 mei 2026', { align: 'center' });
doc.text('Volgende herziening: 26 mei 2027', { align: 'center' });
doc.moveDown(4);
doc.fontSize(9).font('Helvetica').fillColor(c.light).text('Collageen | Vitamine K2 D3 | Omega-3 | Magnesium Bisglycinaat', { align: 'center' });
doc.moveDown(1);
doc.fontSize(8).fillColor(c.light).text('Conform Verordening (EG) Nr. 852/2004, Verordening (EG) Nr. 178/2002,', { align: 'center' });
doc.text('Richtlijn 2002/46/EG en Codex Alimentarius HACCP-principes', { align: 'center' });

// ===== PAGE 2: Bedrijfsgegevens =====
doc.addPage();
h1('1. Bedrijfsgegevens');

h2('1.1 Verantwoordelijke partij (merkeigenaar)');
simpleRow('Bedrijfsnaam', 'Oergezond (WEHU ECOM)');
simpleRow('Adres', 'Building A1, Dubai Digital Park, Dubai Silicon Oasis, Dubai, UAE');
simpleRow('Postcode', '001 - 76415');
simpleRow('Website', 'www.oergezond.com');
simpleRow('E-mail', 'contact@oergezond.com');
simpleRow('Verantwoordelijken', 'Jorn & Rosa');
simpleRow('Rol', 'Merkeigenaar, opdrachtgever productie en distributie');
gap(0.4);

h2('1.2 Producent (contract manufacturing)');
simpleRow('Bedrijfsnaam', 'APB Holland BV');
simpleRow('Adres', 'Stevingweg 2, 4691 SM Tholen');
simpleRow('Website', 'www.apbholland.nl');
simpleRow('Rol', 'Productie, verpakking en kwaliteitscontrole in opdracht van Oergezond. Verzending naar fulfillment center.');
gap(0.4);

h2('1.3 Fulfillment center (opslag & verzending)');
simpleRow('Bedrijfsnaam', 'NH Fulfillment');
simpleRow('Adres', 'Witte Paal 202, 1742 LA Schagen, Nederland');
simpleRow('Rol', 'Opslag conform voedselveiligheidsregelgeving. Orderpicking, verpakking en verzending naar eindconsument.');
gap(0.5);

// ===== PRODUCTOVERZICHT =====
h1('2. Productoverzicht');
tableRow(['Product', 'Vorm', 'Beschrijving'], [100, 80, pw - 180], true);
tableRow(['Collageen', 'Capsules/poeder', 'Collageensupplement voor huid, gewrichten en bindweefsel'], [100, 80, pw - 180]);
tableRow(['Vitamine K2 D3', 'Capsules', 'Combinatiesupplement voor botten, immuunsysteem en calciumhuishouding'], [100, 80, pw - 180]);
tableRow(['Omega-3', 'Softgels', 'Visoliesupplement met EPA en DHA voor hart en hersenen'], [100, 80, pw - 180]);
tableRow(['Magnesium Bisglycinaat', 'Capsules', 'Hoogwaardige magnesiumvorm voor spieren, zenuwstelsel en slaap'], [100, 80, pw - 180]);
gap(0.3);
p('Alle producten worden geproduceerd door APB Holland BV in opdracht van Oergezond en vallen onder de Europese regelgeving voor voedingssupplementen (Richtlijn 2002/46/EG).');
gap(0.4);

// ===== WETTELIJK KADER =====
h1('3. Wettelijk kader');
p('Dit voedselveiligheidsplan is opgesteld conform:');
const wetten = [
  'Verordening (EG) Nr. 852/2004 \u2014 Levensmiddelenhygiene (HACCP-verplichting)',
  'Verordening (EG) Nr. 178/2002 \u2014 Algemene levensmiddelenwetgeving (traceerbaarheid)',
  'Richtlijn 2002/46/EG \u2014 Voedingssupplementen',
  'Warenwetbesluit Voedingssupplementen \u2014 Nederlandse implementatie',
  'Codex Alimentarius \u2014 HACCP-principes'
];
wetten.forEach(w => { doc.fontSize(9.5).font('Helvetica').fillColor(c.dark).text('\u2022  ' + w, 60, doc.y, { width: pw - 10, lineGap: 2 }); doc.moveDown(0.15); });
gap(0.4);

// ===== VERANTWOORDELIJKHEDEN =====
h1('4. Organisatiestructuur en verantwoordelijkheden');
h2('4.1 Rolverdeling');
tableRow(['Partij', 'Verantwoordelijkheid'], [120, pw - 120], true);
tableRow(['Oergezond', 'Merkeigenaar. Productspecificaties, receptuur, etikettering, markttoelating, klachtafhandeling en toezicht op de gehele keten.'], [120, pw - 120]);
tableRow(['APB Holland BV', 'Contractproducent. Inkoop grondstoffen, productie conform GMP, kwaliteitscontrole, batchregistratie, Certificates of Analysis (CoA) en transport naar NH Fulfillment.'], [120, pw - 120]);
tableRow(['NH Fulfillment', 'Fulfillment partner. Ontvangst, opslag onder juiste condities, FIFO-beheer, orderpicking en verzending naar eindconsument.'], [120, pw - 120]);
gap(0.3);

h2('4.2 Communicatie');
const comm = [
  'Oergezond ontvangt van APB Holland BV bij elke batch een Certificate of Analysis (CoA) en productiedossier.',
  'NH Fulfillment rapporteert afwijkingen bij ontvangst direct aan Oergezond.',
  'Klachten van consumenten worden door Oergezond geregistreerd en waar nodig gedeeld met APB Holland BV.'
];
comm.forEach(c2 => { doc.fontSize(9.5).font('Helvetica').fillColor(c.dark).text('\u2022  ' + c2, 60, doc.y, { width: pw - 10, lineGap: 2 }); doc.moveDown(0.15); });
gap(0.4);

// ===== PROCESOMSCHRIJVING =====
h1('5. Procesomschrijving');
h2('5.1 Productiefase (APB Holland BV)');
const prod = [
  'Inkoop grondstoffen \u2014 Gecertificeerde grondstoffen bij gekwalificeerde leveranciers met CoA\'s.',
  'Ingangscontrole \u2014 Controle op identiteit, zuiverheid en microbiologische veiligheid.',
  'Productie \u2014 Mengen, encapsuleren/tablettieren conform GMP en receptuur.',
  'Kwaliteitscontrole \u2014 Analyse op actieve ingredienten, zware metalen, microbiologie en allergenen.',
  'Verpakking & etikettering \u2014 Conform Verordening (EU) Nr. 1169/2011.',
  'Batchvrijgave \u2014 Vrijgave na positieve QC-resultaten. CoA per batch.',
  'Transport \u2014 Verzending in gesloten, droge en schone transportmiddelen naar NH Fulfillment.'
];
prod.forEach((s, i) => { doc.fontSize(9.5).font('Helvetica').fillColor(c.dark).text((i + 1) + '.  ' + s, 60, doc.y, { width: pw - 10, lineGap: 2 }); doc.moveDown(0.15); });
gap(0.3);

h2('5.2 Opslag & distributiefase (NH Fulfillment)');
const dist = [
  'Ontvangst \u2014 Visuele controle op verpakkingsintegriteit. Registratie batchnummers en THT-data.',
  'Opslag \u2014 Droog, koel (15-25\u00B0C), luchtvochtigheid < 65%, beschermd tegen zonlicht.',
  'Voorraadbeheer \u2014 FIFO-principe op basis van THT-datum.',
  'Orderpicking & verzending \u2014 Gepickt, verpakt en verzonden zonder blootstelling aan extreme temperaturen.',
  'Retourafhandeling \u2014 Alleen ongeopende, onbeschadigde producten terug in voorraad.'
];
dist.forEach((s, i) => { doc.fontSize(9.5).font('Helvetica').fillColor(c.dark).text((i + 1) + '.  ' + s, 60, doc.y, { width: pw - 10, lineGap: 2 }); doc.moveDown(0.15); });
gap(0.4);

// ===== HACCP =====
h1('6. Gevarenanalyse (HACCP)');
h2('6.1 Gevarenidentificatie');
tableRow(['Gevaar', 'Type', 'Beheersing'], [160, 70, pw - 230], true);
tableRow(['Microbiologische besmetting (Salmonella, E. coli)', 'Biologisch', 'Leverancierskwalificatie, ingangscontrole, GMP, analyse per batch'], [160, 70, pw - 230]);
tableRow(['Zware metalen (lood, cadmium, kwik, arseen)', 'Chemisch', 'CoA-controle, grondstofspecificaties, analyse per batch'], [160, 70, pw - 230]);
tableRow(['Allergenen (vis bij omega-3)', 'Chemisch', 'Etikettering, gescheiden opslag, allergenenbeheer'], [160, 70, pw - 230]);
tableRow(['Pesticiden/dioxinen (visolie)', 'Chemisch', 'Leverancierselectie, CoA met analyse'], [160, 70, pw - 230]);
tableRow(['Vreemde voorwerpen', 'Fysisch', 'Metaaldetectie, visuele inspectie, GMP'], [160, 70, pw - 230]);
tableRow(['Onjuiste dosering', 'Chemisch', 'Receptuurcontrole, weegprotocollen, eindanalyse'], [160, 70, pw - 230]);
tableRow(['Bederf door onjuiste opslag', 'Biol./Chem.', 'Temp/vocht-bewaking, FIFO, THT-controle'], [160, 70, pw - 230]);
gap(0.3);

h2('6.2 Critical Control Points (CCP\'s)');
tableRow(['CCP', 'Processtap', 'Kritische grens', 'Corrigerende maatregel'], [40, 140, 160, pw - 340], true);
tableRow(['1', 'Ingangscontrole grondstoffen (APB)', 'Conform specificaties en CoA', 'Afkeuring partij'], [40, 140, 160, pw - 340]);
tableRow(['2', 'Eindproductanalyse (APB)', 'Conform spec. en wettelijke limieten', 'Batch niet vrijgeven'], [40, 140, 160, pw - 340]);
tableRow(['3', 'Opslagcondities (NH Fulfillment)', '15-25\u00B0C, luchtvocht. < 65%', 'Product isoleren, melding Oergezond'], [40, 140, 160, pw - 340]);
gap(0.4);

// ===== TRACEERBAARHEID =====
h1('7. Traceerbaarheid');
b('Stap-terug (leverancier)');
p('Via APB Holland BV kan elke batch herleid worden naar grondstoffen, leveranciers en productiedatum.');
b('Stap-vooruit (klant)');
p('Via Shopify kan elke verkochte eenheid herleid worden naar klant, besteldatum en batchnummer.');
b('Interne traceerbaarheid');
p('NH Fulfillment registreert per ontvangst batchnummers en THT-data. Bij orderpicking wordt het batchnummer gekoppeld aan de klantorder.');
gap(0.3);

h2('Registraties');
tableRow(['Document', 'Verantwoordelijke', 'Bewaartermijn'], [200, 150, pw - 350], true);
tableRow(['Certificate of Analysis per batch', 'APB Holland BV', 'Min. THT + 1 jaar'], [200, 150, pw - 350]);
tableRow(['Productiedossier per batch', 'APB Holland BV', 'Min. THT + 1 jaar'], [200, 150, pw - 350]);
tableRow(['Ontvangstregistratie', 'NH Fulfillment', 'Min. THT + 1 jaar'], [200, 150, pw - 350]);
tableRow(['Opslagconditie-logs', 'NH Fulfillment', '2 jaar'], [200, 150, pw - 350]);
tableRow(['Klachtenregistratie', 'Oergezond', '2 jaar'], [200, 150, pw - 350]);
tableRow(['Orderhistorie met batchkoppeling', 'Oergezond (Shopify)', '2 jaar'], [200, 150, pw - 350]);
gap(0.4);

// ===== RECALL =====
h1('8. Recall-procedure');
p('Een recall wordt gestart wanneer een product een risico vormt voor de volksgezondheid:');
const recalls = [
  'Afwijkende analyseresultaten achteraf',
  'Meerdere klachten over dezelfde batch',
  'Melding van NVWA of andere autoriteit',
  'Melding van APB Holland BV over productieafwijking'
];
recalls.forEach(r => { doc.fontSize(9.5).font('Helvetica').fillColor(c.dark).text('\u2022  ' + r, 60, doc.y, { width: pw - 10, lineGap: 2 }); doc.moveDown(0.1); });
gap(0.3);

tableRow(['Stap', 'Actie', 'Verantwoordelijke'], [35, 310, pw - 345], true);
tableRow(['1', 'Signaal ontvangen en beoordelen', 'Oergezond'], [35, 310, pw - 345]);
tableRow(['2', 'Besluit tot recall nemen', 'Oergezond'], [35, 310, pw - 345]);
tableRow(['3', 'NH Fulfillment: batch blokkeren en isoleren', 'Oergezond > NH Fulfillment'], [35, 310, pw - 345]);
tableRow(['4', 'APB Holland BV informeren voor oorzaakanalyse', 'Oergezond > APB'], [35, 310, pw - 345]);
tableRow(['5', 'Getroffen klanten identificeren via Shopify', 'Oergezond'], [35, 310, pw - 345]);
tableRow(['6', 'Klanten informeren per e-mail', 'Oergezond'], [35, 310, pw - 345]);
tableRow(['7', 'NVWA melden indien wettelijk vereist', 'Oergezond'], [35, 310, pw - 345]);
tableRow(['8', 'Producten vernietigen of retourneren aan APB', 'NH Fulfillment / APB'], [35, 310, pw - 345]);
tableRow(['9', 'Oorzaakanalyse en preventieve maatregelen', 'Oergezond + APB'], [35, 310, pw - 345]);
gap(0.4);

// ===== KLACHTEN =====
h1('9. Klachtenprocedure');
const klachten = [
  'Klachten worden ontvangen via e-mail (contact@oergezond.com) of klantenservice.',
  'Elke klacht wordt geregistreerd met datum, productnaam, batchnummer, aard klacht en klantgegevens.',
  'Bij klachten over productveiligheid wordt APB Holland BV direct geinformeerd.',
  'Bij herhaalde klachten over dezelfde batch wordt de recall-procedure overwogen.',
  'De klant ontvangt binnen 48 uur een reactie.'
];
klachten.forEach((k, i) => { doc.fontSize(9.5).font('Helvetica').fillColor(c.dark).text((i + 1) + '.  ' + k, 60, doc.y, { width: pw - 10, lineGap: 2 }); doc.moveDown(0.15); });
gap(0.4);

// ===== ALLERGENEN =====
h1('10. Allergenen');
tableRow(['Product', 'Allergeen', 'Vermelding op etiket'], [160, 170, pw - 330], true);
tableRow(['Omega-3', 'Vis', 'Ja \u2014 "Bevat: vis"'], [160, 170, pw - 330]);
tableRow(['Collageen', 'Mogelijk vis of rund (afh. van bron)', 'Ja \u2014 bron vermeld op etiket'], [160, 170, pw - 330]);
tableRow(['Vitamine K2 D3', 'Geen bekende allergenen', 'N.v.t.'], [160, 170, pw - 330]);
tableRow(['Magnesium Bisglycinaat', 'Geen bekende allergenen', 'N.v.t.'], [160, 170, pw - 330]);
gap(0.4);

// ===== VERIFICATIE =====
h1('11. Verificatie en herziening');
tableRow(['Activiteit', 'Frequentie', 'Verantwoordelijke'], [220, 120, pw - 340], true);
tableRow(['Review voedselveiligheidsplan', 'Jaarlijks', 'Oergezond'], [220, 120, pw - 340]);
tableRow(['Controle CoA\'s en productiedossiers', 'Per batch', 'Oergezond'], [220, 120, pw - 340]);
tableRow(['Beoordeling opslagcondities NH Fulfillment', 'Halfjaarlijks', 'Oergezond'], [220, 120, pw - 340]);
tableRow(['Audit APB Holland BV', 'Jaarlijks', 'Oergezond'], [220, 120, pw - 340]);
tableRow(['Evaluatie klachtenregistratie', 'Kwartaal', 'Oergezond'], [220, 120, pw - 340]);
tableRow(['Update bij productwijzigingen', 'Bij wijziging', 'Oergezond'], [220, 120, pw - 340]);
gap(0.5);

// ===== ONDERTEKENING =====
h1('12. Ondertekening');
p('Dit voedselveiligheidsplan is vastgesteld door de verantwoordelijken van Oergezond en treedt in werking per 26 mei 2026.');
gap(0.5);

doc.fontSize(9).font('Helvetica').fillColor(c.dark);
doc.text('Naam:  ___________________________________', 50, doc.y);
doc.moveDown(0.4);
doc.text('Functie:  ___________________________________');
doc.moveDown(0.4);
doc.text('Datum:  ___________________________________');
doc.moveDown(0.4);
doc.text('Handtekening:  ___________________________________');
gap(0.8);

doc.text('Naam:  ___________________________________');
doc.moveDown(0.4);
doc.text('Functie:  ___________________________________');
doc.moveDown(0.4);
doc.text('Datum:  ___________________________________');
doc.moveDown(0.4);
doc.text('Handtekening:  ___________________________________');
gap(0.5);

doc.fontSize(8).font('Helvetica-Oblique').fillColor(c.light).text('Dit document wordt minimaal jaarlijks herzien of eerder bij significante wijzigingen in producten, processen, leveranciers of regelgeving.', { align: 'center' });

doc.end();
console.log('PDF saved to:', output);
