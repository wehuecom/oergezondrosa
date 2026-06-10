const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const ingredients = [
  { name: 'Water (Aqua)', cas: '7732-18-5', pct: 19.54 },
  { name: 'Sodium Hydroxide (superfat 6%)', cas: '1310-73-2', pct: 9.78 },
  { name: 'Tallow (Grass-Fed)', cas: '\u2014', pct: 24.32 },
  { name: 'Cocos Nucifera (Coconut) Oil', cas: '8001-31-8', pct: 17.37 },
  { name: 'Olea Europaea (Olive) Fruit Oil', cas: '8001-25-0', pct: 20.85 },
  { name: 'Ricinus Communis (Castor) Seed Oil', cas: '8001-79-4', pct: 6.95 },
  { name: 'Camellia Sinensis (Matcha) Leaf Powder', cas: '84650-60-2', pct: 0.69 },
  { name: 'Melaleuca Alternifolia (Tea Tree) Leaf Oil', cas: '68647-73-4', pct: 0.25 },
  { name: 'Rosmarinus Officinalis (Rosemary) Leaf Extract', cas: '84604-14-8', pct: 0.25 },
];

const c = { black: '#1a1a1a', dark: '#2d2d2d', accent: '#1A2E1A', light: '#666', line: '#d0d0d0' };
const ml = 70;
const mr = 525;
const pw = mr - ml;

function createDoc(filename) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: ml, right: 70 } });
  doc.pipe(fs.createWriteStream(path.join(__dirname, filename)));
  return doc;
}

function h1(doc, t) { checkPage(doc, 40); doc.fontSize(12).font('Helvetica-Bold').fillColor(c.accent).text(t, ml, doc.y, { width: pw }); doc.moveDown(0.1); doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor(c.line).lineWidth(0.5).stroke(); doc.moveDown(0.2); }
function h2(doc, t) { checkPage(doc, 25); doc.fontSize(10).font('Helvetica-Bold').fillColor(c.accent).text(t, ml, doc.y, { width: pw }); doc.moveDown(0.1); }
function p(doc, t) { doc.fontSize(9).font('Helvetica').fillColor(c.dark).text(t, ml, doc.y, { lineGap: 2.5, width: pw }); doc.moveDown(0.15); }
function b(doc, t) { doc.fontSize(9).font('Helvetica-Bold').fillColor(c.black).text(t, ml, doc.y, { lineGap: 2.5, width: pw }); doc.moveDown(0.1); }
function gap(doc, n) { doc.moveDown(n || 0.2); }
function checkPage(doc, needed) { if (doc.y + needed > 780) doc.addPage(); }

function simpleRow(doc, label, value) {
  checkPage(doc, 14);
  const y = doc.y;
  const valX = ml + 120;
  const valW = mr - valX - 5;
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(c.dark).text(label, ml + 4, y, { width: 115 });
  doc.fontSize(8.5).font('Helvetica').fillColor(c.dark).text(value, valX, y, { width: valW });
  doc.y = y + Math.max(12, doc.heightOfString(value, { width: valW, fontSize: 8.5 }) + 3);
  doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#eee').lineWidth(0.3).stroke();
  doc.moveDown(0.04);
}

function ingTable(doc) {
  checkPage(doc, 20);
  const hy = doc.y;
  doc.rect(ml, hy - 2, pw, 16).fill('#eef0eb');
  doc.fontSize(8).font('Helvetica-Bold').fillColor(c.accent);
  doc.text('#', ml + 4, hy + 2, { width: 20 });
  doc.text('INCI Name', ml + 24, hy + 2, { width: 210 });
  doc.text('CAS No.', ml + 240, hy + 2, { width: 80 });
  doc.text('wt%', ml + 330, hy + 2, { width: 50 });
  doc.y = hy + 16;
  doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#ccc').lineWidth(0.3).stroke();
  doc.moveDown(0.05);
  ingredients.forEach((ing, i) => {
    checkPage(doc, 14);
    const ry = doc.y;
    doc.fontSize(8).font('Helvetica').fillColor(c.dark);
    doc.text(String(i + 1), ml + 4, ry + 1, { width: 20 });
    doc.text(ing.name, ml + 24, ry + 1, { width: 210 });
    doc.text(ing.cas, ml + 240, ry + 1, { width: 80 });
    doc.text(String(ing.pct), ml + 340, ry + 1, { width: 40 });
    doc.y = ry + 13;
    doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#eee').lineWidth(0.2).stroke();
    doc.moveDown(0.03);
  });
  gap(doc, 0.3);
}

function bullets(doc, items) {
  items.forEach(item => {
    doc.fontSize(9).font('Helvetica').fillColor(c.dark).text('\u2022  ' + item, ml + 10, doc.y, { width: pw - 20, lineGap: 2 });
    doc.moveDown(0.1);
  });
}

// ===================== PIF =====================
const pif = createDoc('shampoobar-pif.pdf');

pif.moveDown(5);
pif.fontSize(30).font('Helvetica-Bold').fillColor(c.accent).text('Product Information File', { align: 'center' });
pif.moveDown(0.3);
pif.fontSize(16).font('Helvetica').fillColor(c.dark).text('Oergezond Shampoo Bar', { align: 'center' });
pif.fontSize(12).font('Helvetica').fillColor(c.light).text('Matcha Grass-Fed Tallow', { align: 'center' });
pif.moveDown(2);
pif.fontSize(10).font('Helvetica').fillColor(c.light).text('Conform EU Verordening 1223/2009', { align: 'center' });
pif.text('Versie 1.0 | 4 juni 2026', { align: 'center' });

pif.addPage();
h1(pif, '1. Productidentificatie');
simpleRow(pif, 'Productnaam', 'Oergezond Shampoo Bar (Matcha Grass-Fed Tallow)');
simpleRow(pif, 'Producttype', 'Vaste shampoo bar (cosmetisch product, rinse-off)');
simpleRow(pif, 'Toepassing', 'Haar wassen. Nat maken, opschuimen in de handen of direct op het haar, inmasseren en uitspoelen.');
simpleRow(pif, 'Doelgroep', 'Volwassenen, alle haartypes');
simpleRow(pif, 'Verpakking', 'Kartonnen doosje / papieren wikkel');
simpleRow(pif, 'Inhoud', '[invullen] g');
simpleRow(pif, 'Houdbaarheid', '[invullen] maanden na opening (PAO)');
simpleRow(pif, 'Batchcodering', 'Op verpakking vermeld');
simpleRow(pif, 'MSDS referentie', 'JY2026020109');
gap(pif, 0.3);

h1(pif, '2. Verantwoordelijke personen');
h2(pif, '2.1 Merkeigenaar');
simpleRow(pif, 'Bedrijfsnaam', 'WEHU ECOM - FZCO');
simpleRow(pif, 'Adres', 'Dubai Digital Park, Building A1, Dubai Silicon Oasis, United Arab Emirates');
simpleRow(pif, 'Merknaam', 'Oergezond');
simpleRow(pif, 'Website', 'www.oergezond.com');
simpleRow(pif, 'E-mail', 'contact@oergezond.com');
gap(pif, 0.2);

h2(pif, '2.2 Responsible Person (EU)');
simpleRow(pif, 'Naam', 'Rosa van Huffel');
simpleRow(pif, 'Bedrijfsnaam', 'Oergezond');
simpleRow(pif, 'EU-adres', 'Belkmerweg 58, 1753 GD Sint Maartensvlotbrug, Nederland');
simpleRow(pif, 'Rol', 'Responsible Person conform EU Verordening 1223/2009, Art. 4');
gap(pif, 0.2);

h2(pif, '2.3 Producent');
simpleRow(pif, 'Bedrijfsnaam', 'Guangdong Qiaoerna Biotechnology Co., Ltd.');
simpleRow(pif, 'Adres', 'Building 2, Junda Technology, No.5 Zhihui Road, Guangzhou (Qingyuan) Industrial Transfer Park, Qingcheng District, Qingyuan City, China');
simpleRow(pif, 'GMP Status', 'Productie conform ISO 22716 (GMP voor cosmetica)');
gap(pif, 0.3);

h1(pif, '3. Kwalitatieve en kwantitatieve samenstelling');
p(pif, 'Volledige INCI-lijst met CAS-nummers en concentraties:');
gap(pif, 0.1);
ingTable(pif);
p(pif, 'Totaal: 100 wt%. Cold process zeep met 6% superfat. Na het verzepingsproces is er geen vrij natriumhydroxide meer aanwezig. Het product bevat geen synthetische conserveermiddelen, kleurstoffen of geurstoffen.');
gap(pif, 0.3);

h1(pif, '4. Fysisch-chemische specificaties');
simpleRow(pif, 'Uiterlijk', 'Vaste zeep, licht platte ronde blokken');
simpleRow(pif, 'Kleur', 'Beige tot lichtgeel (met groene matcha-zweem)');
simpleRow(pif, 'Geur', 'Karakteristiek, licht kruidig (tea tree, rozemarijn)');
simpleRow(pif, 'pH', '6.5 - 8.5 (1% oplossing in water)');
simpleRow(pif, 'Oplosbaarheid', 'Oplosbaar in water bij gebruik');
simpleRow(pif, 'Stabiliteit', 'Stabiel bij kamertemperatuur (15-25\u00B0C), droog bewaren');
gap(pif, 0.3);

h1(pif, '5. Microbiologische kwaliteit');
p(pif, 'Het product is een vaste zeep met een alkalisch pH (6.5-8.5) en lage wateractiviteit na uitharding. Het risico op microbiologische groei is zeer laag. Het product bevat tea tree olie en rozemarijnextract die van nature antimicrobiele eigenschappen hebben.');
simpleRow(pif, 'Totaal kiemgetal', '< 1000 KVE/g');
simpleRow(pif, 'Gisten en schimmels', '< 100 KVE/g');
simpleRow(pif, 'E. coli', 'Afwezig in 1g');
simpleRow(pif, 'Pseudomonas aeruginosa', 'Afwezig in 1g');
simpleRow(pif, 'Staphylococcus aureus', 'Afwezig in 1g');
gap(pif, 0.3);

h1(pif, '6. Ongewenste effecten en ernstige bijwerkingen');
p(pif, 'Er zijn geen ernstige ongewenste effecten of bijwerkingen gerapporteerd bij normaal gebruik van dit product.');
p(pif, 'Mogelijke milde reacties bij gevoelige personen: lichte droogheid van de hoofdhuid bij overmatig gebruik, milde irritatie bij personen met overgevoeligheid voor tea tree olie.');
p(pif, 'Het product bevat tea tree olie (0.25%) in een laag-allergene dosering. Natuurlijke allergenen uit tea tree olie en rozemarijnextract (o.a. limonene, linalool) zijn aanwezig in spoorhoeveelheden.');
gap(pif, 0.3);

h1(pif, '7. Etikettering');
p(pif, 'Het etiket vermeldt conform EU Verordening 1223/2009, Art. 19:');
bullets(pif, [
  'Naam en adres van de Responsible Person',
  'Nominale inhoud in gewicht',
  'Houdbaarheidsdatum of PAO-symbool',
  'Gebruiksaanwijzing',
  'Batchnummer',
  'Productfunctie (shampoo bar)',
  'Volledige INCI-ingredientenlijst',
  'Land van oorsprong'
]);
gap(pif, 0.3);

h1(pif, '8. Bewijs van het effect (claims)');
p(pif, 'Claims conform EU Verordening 655/2013:');
simpleRow(pif, 'Reinigt het haar', 'Verzepte olien (tallow, kokos, olijf) vormen een milde zeep die vuil en overtollig vet verwijdert');
simpleRow(pif, 'Voedt de hoofdhuid', '6% superfat zorgt voor niet-verzepte olien die het haar en de hoofdhuid voeden');
simpleRow(pif, 'Antioxidant werking', 'Matcha (groene thee) poeder is rijk aan catechinen en antioxidanten');
simpleRow(pif, 'Kalmeert de hoofdhuid', 'Tea tree olie en rozemarijnextract staan bekend om kalmerende en zuiverende eigenschappen');
gap(pif, 0.3);

h1(pif, '9. Dierproeven');
p(pif, 'Dit product en de afzonderlijke ingredienten zijn niet op dieren getest, conform het EU-verbod op dierproeven voor cosmetische producten (Verordening 1223/2009, Art. 18).');
gap(pif, 0.3);

h1(pif, '10. Documentbeheer');
simpleRow(pif, 'Versie', '1.0');
simpleRow(pif, 'Datum', '4 juni 2026');
simpleRow(pif, 'Opgesteld door', 'Oergezond');
simpleRow(pif, 'Volgende herziening', '4 juni 2027');
simpleRow(pif, 'Bewaartermijn', 'Minimaal 10 jaar na laatste batch op de markt (Art. 11)');

pif.end();
console.log('PIF saved');

// ===================== CPSR =====================
const cpsr = createDoc('shampoobar-cpsr.pdf');

cpsr.moveDown(5);
cpsr.fontSize(28).font('Helvetica-Bold').fillColor(c.accent).text('Cosmetic Product', { align: 'center' });
cpsr.fontSize(28).font('Helvetica-Bold').fillColor(c.accent).text('Safety Report', { align: 'center' });
cpsr.moveDown(0.3);
cpsr.fontSize(16).font('Helvetica').fillColor(c.dark).text('Oergezond Shampoo Bar', { align: 'center' });
cpsr.fontSize(12).font('Helvetica').fillColor(c.light).text('Matcha Grass-Fed Tallow', { align: 'center' });
cpsr.moveDown(2);
cpsr.fontSize(10).font('Helvetica').fillColor(c.light).text('Conform EU Verordening 1223/2009, Art. 10 & Bijlage I', { align: 'center' });
cpsr.text('Versie 1.0 | 4 juni 2026', { align: 'center' });

cpsr.addPage();
cpsr.fontSize(18).font('Helvetica-Bold').fillColor(c.accent).text('DEEL A \u2014 Veiligheidsinformatie', ml, cpsr.y, { width: pw });
cpsr.moveDown(0.5);

h1(cpsr, '1. Kwantitatieve en kwalitatieve samenstelling');
p(cpsr, 'Het product is een cold process vaste shampoo bar bestaande uit verzepte plantaardige olien en grasgevoerd talg, met matcha poeder, tea tree olie en rozemarijnextract als actieve toevoegingen. 6% superfat (niet-verzepte olien blijven in het eindproduct).');
gap(cpsr, 0.1);
ingTable(cpsr);
p(cpsr, 'Na het verzepingsproces (cold process, NaOH + olien/vetten) is er geen vrij natriumhydroxide meer aanwezig in het eindproduct. De NaOH reageert volledig met de vetzuren tot zeep (natriumzouten van vetzuren) en glycerine.');

h1(cpsr, '2. Fysische/chemische eigenschappen');
simpleRow(cpsr, 'Uiterlijk', 'Vaste zeep, licht platte ronde blokken');
simpleRow(cpsr, 'Kleur', 'Beige tot lichtgeel');
simpleRow(cpsr, 'Geur', 'Karakteristiek kruidig (tea tree, rozemarijn)');
simpleRow(cpsr, 'pH', '6.5 - 8.5 (1% oplossing in water)');
simpleRow(cpsr, 'Stabiliteit', 'Stabiel bij 15-25\u00B0C, droog bewaren. Min. 12 maanden houdbaar.');
gap(cpsr, 0.3);

h1(cpsr, '3. Microbiologische kwaliteit');
p(cpsr, 'Vaste zeep met alkalisch pH en lage wateractiviteit na uitharding. Risico op microbiologische groei is zeer laag. Tea tree olie en rozemarijnextract bieden aanvullende antimicrobiele bescherming. Conserveermiddelen zijn niet nodig.');
p(cpsr, 'Omdat het product een rinse-off product is (kort huidcontact, uitspoelen), is het microbiologische risico additioneel verlaagd.');
gap(cpsr, 0.3);

h1(cpsr, '4. Onzuiverheden, sporen, verpakkingsmateriaal');
h2(cpsr, '4.1 Onzuiverheden');
p(cpsr, 'Alle grondstoffen zijn van cosmetische kwaliteit. Zware metalen conform specificaties:');
simpleRow(cpsr, 'Lood (Pb)', '< 10 ppm');
simpleRow(cpsr, 'Arseen (As)', '< 2 ppm');
simpleRow(cpsr, 'Cadmium (Cd)', '< 1 ppm');
simpleRow(cpsr, 'Kwik (Hg)', '< 1 ppm');
gap(cpsr, 0.2);
h2(cpsr, '4.2 Verpakkingsmateriaal');
p(cpsr, 'Kartonnen doosje of papieren wikkel. Geen direct contact tussen verpakking en product dat tot migratie kan leiden. Verpakkingsmateriaal is recyclebaar.');
gap(cpsr, 0.3);

h1(cpsr, '5. Normaal en redelijkerwijs te verwachten gebruik');
p(cpsr, 'Het product is bedoeld als vaste shampoo voor het wassen van het haar. Toepassing: haar nat maken, de bar opschuimen in de handen of direct op het haar aanbrengen, inmasseren en grondig uitspoelen met water.');
p(cpsr, 'Doelgroep: volwassenen, alle haartypes. Rinse-off product (kort huidcontact). Niet bedoeld voor kinderen onder 3 jaar. Uitsluitend voor uitwendig gebruik.');
gap(cpsr, 0.3);

h1(cpsr, '6. Blootstelling aan het product');
simpleRow(cpsr, 'Toepassingsgebied', 'Haar en hoofdhuid');
simpleRow(cpsr, 'Frequentie', '2-4 keer per week');
simpleRow(cpsr, 'Contacttijd', 'Kort (1-5 minuten, daarna uitspoelen)');
simpleRow(cpsr, 'Type product', 'Rinse-off (uitspoelen na gebruik)');
simpleRow(cpsr, 'Blootstellingsroute', 'Dermaal (hoofdhuid), kort contact');
simpleRow(cpsr, 'Hoeveelheid per gebruik', 'Ca. 1-3 g productafgifte per wasbeurt');
gap(cpsr, 0.3);

h1(cpsr, '7. Blootstelling aan stoffen');
h2(cpsr, '7.1 Verzepte olien/vetten (99.27 wt% grondstof)');
p(cpsr, 'Tallow, kokosolie, olijfolie en ricinusolie worden via cold process verzeping omgezet in natriumzouten van vetzuren (zeep) en glycerine. Deze stoffen hebben een uitstekend veiligheidsprofiel voor dermale toepassing en zijn breed gebruikt in cosmetische zeepproducten. 6% superfat zorgt voor huidverzorgende eigenschappen.');
gap(cpsr, 0.2);

h2(cpsr, '7.2 Natriumhydroxide (9.78 wt% grondstof)');
p(cpsr, 'NaOH wordt volledig geconsumeerd tijdens het verzepingsproces. In het eindproduct is geen vrij NaOH meer aanwezig. De pH van het eindproduct (6.5-8.5) bevestigt volledige verzeping.');
gap(cpsr, 0.2);

h2(cpsr, '7.3 Camellia Sinensis (Matcha) Leaf Powder (0.69 wt%)');
p(cpsr, 'Groene thee poeder, rijk aan catechinen en antioxidanten. Veilig voor cosmetisch gebruik, breed gedocumenteerd. Geen sensibilisatie bekend bij deze concentratie.');
gap(cpsr, 0.2);

h2(cpsr, '7.4 Tea Tree Olie (0.25 wt%) en Rozemarijnextract (0.25 wt%)');
p(cpsr, 'Beide in lage, laag-allergene concentraties. Tea tree olie kan bij hogere concentraties sensibilisatie veroorzaken, maar bij 0.25% in een rinse-off product is het risico minimaal. Bevat sporen van natuurlijke allergenen (limonene, linalool) onder de IFRA-drempelwaarde voor rinse-off producten.');
gap(cpsr, 0.3);

h1(cpsr, '8. Toxicologisch profiel');
p(cpsr, 'Alle ingredienten zijn opgenomen in de CosIng-database. Geen van de ingredienten in het eindproduct staat op Bijlage II of III van Verordening 1223/2009. NaOH (Bijlage III, entry 15a) is volledig geconsumeerd in het verzepingsproces en niet aanwezig in het eindproduct.');
p(cpsr, 'Geen CMR-stoffen, geen nanomaterialen, geen synthetische conserveermiddelen of kleurstoffen.');
gap(cpsr, 0.3);

h1(cpsr, '9. Ongewenste en ernstige ongewenste effecten');
p(cpsr, 'Er zijn geen ernstige ongewenste effecten gerapporteerd. Mogelijke milde effecten:');
bullets(cpsr, [
  'Lichte droogheid bij overmatig gebruik (inherent aan zeepproducten)',
  'Milde irritatie bij overgevoeligheid voor tea tree olie (zeer zeldzaam bij 0.25%)',
  'Bij oogcontact: spoelen met water'
]);
p(cpsr, 'Bij optreden van irritatie dient het gebruik gestaakt te worden.');
gap(cpsr, 0.5);

cpsr.addPage();
cpsr.fontSize(18).font('Helvetica-Bold').fillColor(c.accent).text('DEEL B \u2014 Veiligheidsbeoordeling', ml, cpsr.y, { width: pw });
cpsr.moveDown(0.5);

h1(cpsr, '10. Conclusie van de beoordeling');
p(cpsr, 'Op basis van de samenstelling, fysisch-chemische eigenschappen, toxicologische profielen, de rinse-off toepassing (kort huidcontact), en het ontbreken van gerapporteerde ernstige bijwerkingen, wordt geconcludeerd dat:');
gap(cpsr, 0.1);
b(cpsr, 'Het product "Oergezond Shampoo Bar" veilig is voor de menselijke gezondheid wanneer het wordt gebruikt onder normale of redelijkerwijs te verwachten gebruiksomstandigheden.');
gap(cpsr, 0.2);
p(cpsr, 'Voorwaarden:');
bullets(cpsr, [
  'Uitsluitend voor uitwendig gebruik op haar en hoofdhuid.',
  'Uitspoelen na gebruik. Niet als leave-in product gebruiken.',
  'Contact met ogen vermijden. Bij oogcontact uitspoelen met water.',
  'Buiten bereik van kinderen bewaren.',
  'Droog bewaren tussen gebruik.',
  'INCI-lijst en allergeneninformatie correct op etiket vermeld.'
]);
gap(cpsr, 0.3);

h1(cpsr, '11. Waarschuwingen op het etiket');
bullets(cpsr, [
  'Alleen voor uitwendig gebruik.',
  'Contact met ogen vermijden.',
  'Buiten bereik van kinderen bewaren.',
  'Bevat: Limonene, Linalool (van tea tree olie en rozemarijnextract).',
  'Bij irritatie gebruik staken.'
]);
gap(cpsr, 0.3);

h1(cpsr, '12. Gegevens van de veiligheidsbeoordelaar');
simpleRow(cpsr, 'Naam', '[Naam veiligheidsbeoordelaar]');
simpleRow(cpsr, 'Kwalificatie', '[Universitair diploma in farmacie, toxicologie of geneeskunde]');
simpleRow(cpsr, 'Adres', '[Adres]');
simpleRow(cpsr, 'Datum', '4 juni 2026');
simpleRow(cpsr, 'Handtekening', '________________________________');
gap(cpsr, 0.2);
p(cpsr, 'De veiligheidsbeoordeling (Deel B) dient te worden uitgevoerd en ondertekend door een gekwalificeerd persoon conform Art. 10 lid 2 van Verordening 1223/2009.');
gap(cpsr, 0.3);

h1(cpsr, '13. Documentbeheer');
simpleRow(cpsr, 'Versie', '1.0');
simpleRow(cpsr, 'Datum', '4 juni 2026');
simpleRow(cpsr, 'Volgende herziening', '4 juni 2027 of bij formuleringswijziging');
simpleRow(cpsr, 'Bewaartermijn PIF', 'Minimaal 10 jaar na laatste batch op de markt');

cpsr.end();
console.log('CPSR saved');
