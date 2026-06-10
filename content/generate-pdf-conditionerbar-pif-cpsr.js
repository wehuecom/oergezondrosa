const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const ingredients = [
  { name: 'Cetearyl Alcohol', cas: '67762-27-0', pct: 45.5 },
  { name: 'Butyrospermum Parkii (Shea) Butter', cas: '194043-92-4', pct: 20 },
  { name: 'Theobroma Cacao (Cocoa) Seed Butter', cas: '8002-31-1', pct: 19.7 },
  { name: 'Cocos Nucifera (Coconut) Oil', cas: '8001-31-8', pct: 8 },
  { name: 'Simmondsia Chinensis (Jojoba) Seed Oil', cas: '61789-91-1', pct: 6.1 },
  { name: 'Tocopherol (Vitamin E)', cas: '59-02-9', pct: 0.3 },
  { name: 'Lavandula Angustifolia (Lavender) Oil', cas: '8000-28-0', pct: 0.2 },
  { name: 'Citrus Aurantium Bergamia (Bergamot) Peel Oil', cas: '8007-75-8', pct: 0.2 },
];

const c = { black: '#1a1a1a', dark: '#2d2d2d', accent: '#1A2E1A', light: '#666', line: '#d0d0d0' };
const ml = 70, mr = 525, pw = mr - ml;

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
  checkPage(doc, 14); const y = doc.y; const valX = ml + 120; const valW = mr - valX - 5;
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(c.dark).text(label, ml + 4, y, { width: 115 });
  doc.fontSize(8.5).font('Helvetica').fillColor(c.dark).text(value, valX, y, { width: valW });
  doc.y = y + Math.max(12, doc.heightOfString(value, { width: valW, fontSize: 8.5 }) + 3);
  doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#eee').lineWidth(0.3).stroke(); doc.moveDown(0.04);
}
function ingTable(doc) {
  checkPage(doc, 20); const hy = doc.y;
  doc.rect(ml, hy - 2, pw, 16).fill('#eef0eb');
  doc.fontSize(8).font('Helvetica-Bold').fillColor(c.accent);
  doc.text('#', ml + 4, hy + 2, { width: 20 });
  doc.text('INCI Name', ml + 24, hy + 2, { width: 210 });
  doc.text('CAS No.', ml + 240, hy + 2, { width: 80 });
  doc.text('wt%', ml + 330, hy + 2, { width: 50 });
  doc.y = hy + 16;
  doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#ccc').lineWidth(0.3).stroke(); doc.moveDown(0.05);
  ingredients.forEach((ing, i) => {
    checkPage(doc, 14); const ry = doc.y;
    doc.fontSize(8).font('Helvetica').fillColor(c.dark);
    doc.text(String(i + 1), ml + 4, ry + 1, { width: 20 });
    doc.text(ing.name, ml + 24, ry + 1, { width: 210 });
    doc.text(ing.cas, ml + 240, ry + 1, { width: 80 });
    doc.text(String(ing.pct), ml + 340, ry + 1, { width: 40 });
    doc.y = ry + 13;
    doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#eee').lineWidth(0.2).stroke(); doc.moveDown(0.03);
  });
  gap(doc, 0.3);
}
function bullets(doc, items) {
  items.forEach(item => { doc.fontSize(9).font('Helvetica').fillColor(c.dark).text('\u2022  ' + item, ml + 10, doc.y, { width: pw - 20, lineGap: 2 }); doc.moveDown(0.1); });
}

// ===================== PIF =====================
const pif = createDoc('conditionerbar-pif.pdf');
pif.moveDown(5);
pif.fontSize(30).font('Helvetica-Bold').fillColor(c.accent).text('Product Information File', { align: 'center' });
pif.moveDown(0.3);
pif.fontSize(16).font('Helvetica').fillColor(c.dark).text('Oergezond Conditioner Bar', { align: 'center' });
pif.moveDown(2);
pif.fontSize(10).font('Helvetica').fillColor(c.light).text('Conform EU Verordening 1223/2009', { align: 'center' });
pif.text('Versie 1.0 | 4 juni 2026', { align: 'center' });

pif.addPage();
h1(pif, '1. Productidentificatie');
simpleRow(pif, 'Productnaam', 'Oergezond Conditioner Bar');
simpleRow(pif, 'Producttype', 'Vaste conditioner bar (cosmetisch product, rinse-off)');
simpleRow(pif, 'Toepassing', 'Na het wassen aanbrengen op nat haar, kort laten inwerken en uitspoelen.');
simpleRow(pif, 'Doelgroep', 'Volwassenen, alle haartypes');
simpleRow(pif, 'Verpakking', 'Kartonnen doosje / papieren wikkel');
simpleRow(pif, 'Inhoud', '[invullen] g');
simpleRow(pif, 'Houdbaarheid', '[invullen] maanden na opening (PAO)');
simpleRow(pif, 'Batchcodering', 'Op verpakking vermeld');
simpleRow(pif, 'MSDS referentie', 'JY2026020108');
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
ingTable(pif);
p(pif, 'Totaal: 100 wt%. Het product bevat geen water, geen synthetische conserveermiddelen, geen kleurstoffen en geen sulfaten. Cetearyl alcohol is een vetalcohol (emulgator/verdikker), geen drogend alcohol.');
gap(pif, 0.3);

h1(pif, '4. Fysisch-chemische specificaties');
simpleRow(pif, 'Uiterlijk', 'Vaste bar, licht platte ronde blokken');
simpleRow(pif, 'Kleur', 'Beige tot lichtgeel');
simpleRow(pif, 'Geur', 'Karakteristiek bloemig (lavendel, bergamot)');
simpleRow(pif, 'pH', '6.5 - 8.5 (bij gebruik in water)');
simpleRow(pif, 'Oplosbaarheid', 'Smelt bij huidcontact, emulgeert in water');
simpleRow(pif, 'Stabiliteit', 'Stabiel bij kamertemperatuur (15-25\u00B0C), droog bewaren');
gap(pif, 0.3);

h1(pif, '5. Microbiologische kwaliteit');
p(pif, 'Het product is watervrij (100% vetten, boters, wassen en olien). De wateractiviteit (aw) is < 0.6, waardoor microbiologische groei vrijwel onmogelijk is. Conserveermiddelen zijn niet nodig.');
simpleRow(pif, 'Totaal kiemgetal', '< 100 KVE/g');
simpleRow(pif, 'Gisten en schimmels', '< 10 KVE/g');
simpleRow(pif, 'E. coli', 'Afwezig in 1g');
simpleRow(pif, 'Pseudomonas aeruginosa', 'Afwezig in 1g');
simpleRow(pif, 'Staphylococcus aureus', 'Afwezig in 1g');
gap(pif, 0.3);

h1(pif, '6. Ongewenste effecten en ernstige bijwerkingen');
p(pif, 'Er zijn geen ernstige ongewenste effecten of bijwerkingen gerapporteerd bij normaal gebruik.');
p(pif, 'Mogelijke milde reacties: lichte productopbouw bij overmatig gebruik zonder goed uitspoelen. Het product bevat lavendelolie en bergamotolie in lage concentraties (elk 0.2%). Natuurlijke allergenen (linalool, limonene, linalyl acetaat, bergapten-vrij bergamotolie) zijn aanwezig in spoorhoeveelheden.');
gap(pif, 0.3);

h1(pif, '7. Etikettering');
p(pif, 'Het etiket vermeldt conform EU Verordening 1223/2009, Art. 19:');
bullets(pif, [
  'Naam en adres van de Responsible Person',
  'Nominale inhoud in gewicht',
  'Houdbaarheidsdatum of PAO-symbool',
  'Gebruiksaanwijzing',
  'Batchnummer',
  'Productfunctie (conditioner bar)',
  'Volledige INCI-ingredientenlijst',
  'Land van oorsprong'
]);
gap(pif, 0.3);

h1(pif, '8. Bewijs van het effect (claims)');
p(pif, 'Claims conform EU Verordening 655/2013:');
simpleRow(pif, 'Ontward het haar', 'Cetearyl alcohol (45.5%) werkt als conditionerend middel en ontwarrer');
simpleRow(pif, 'Voedt het haar', 'Sheaboter, cacaoboter en jojobaolie zijn rijk aan vetzuren en vitamines');
simpleRow(pif, 'Hydrateert', 'Kokosolie en sheaboter trekken in de haarschacht en voorkomen vochtverlies');
simpleRow(pif, 'Beschermt het haar', 'Tocopherol (vitamine E) is een natuurlijk antioxidant');
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
const cpsr = createDoc('conditionerbar-cpsr.pdf');
cpsr.moveDown(5);
cpsr.fontSize(28).font('Helvetica-Bold').fillColor(c.accent).text('Cosmetic Product', { align: 'center' });
cpsr.fontSize(28).font('Helvetica-Bold').fillColor(c.accent).text('Safety Report', { align: 'center' });
cpsr.moveDown(0.3);
cpsr.fontSize(16).font('Helvetica').fillColor(c.dark).text('Oergezond Conditioner Bar', { align: 'center' });
cpsr.moveDown(2);
cpsr.fontSize(10).font('Helvetica').fillColor(c.light).text('Conform EU Verordening 1223/2009, Art. 10 & Bijlage I', { align: 'center' });
cpsr.text('Versie 1.0 | 4 juni 2026', { align: 'center' });

cpsr.addPage();
cpsr.fontSize(18).font('Helvetica-Bold').fillColor(c.accent).text('DEEL A \u2014 Veiligheidsinformatie', ml, cpsr.y, { width: pw });
cpsr.moveDown(0.5);

h1(cpsr, '1. Kwantitatieve en kwalitatieve samenstelling');
p(cpsr, 'Het product is een watervrije vaste conditioner bar bestaande uit vetalcohol (cetearyl alcohol), plantaardige boters (shea, cacao), olien (kokos, jojoba), tocopherol (vitamine E) en essentiele olien (lavendel, bergamot). Geen water, geen conserveermiddelen, geen sulfaten.');
ingTable(cpsr);

h1(cpsr, '2. Fysische/chemische eigenschappen');
simpleRow(cpsr, 'Uiterlijk', 'Vaste bar, licht platte ronde blokken');
simpleRow(cpsr, 'Kleur', 'Beige tot lichtgeel');
simpleRow(cpsr, 'Geur', 'Bloemig (lavendel, bergamot)');
simpleRow(cpsr, 'pH', '6.5 - 8.5');
simpleRow(cpsr, 'Stabiliteit', 'Stabiel bij 15-25\u00B0C, droog bewaren. Min. 12 maanden.');
gap(cpsr, 0.3);

h1(cpsr, '3. Microbiologische kwaliteit');
p(cpsr, 'Watervrij product (aw < 0.6). Microbiologische groei is vrijwel onmogelijk. Conserveermiddelen niet nodig. Rinse-off toepassing verlaagt risico additioneel.');
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
p(cpsr, 'Kartonnen doosje of papieren wikkel. Inert, geen migratie. Recyclebaar.');
gap(cpsr, 0.3);

h1(cpsr, '5. Normaal en redelijkerwijs te verwachten gebruik');
p(cpsr, 'Vaste conditioner bar voor na het wassen van het haar. Toepassing: over nat haar wrijven of in de handen opwarmen en door de lengtes en punten aanbrengen. 1-3 minuten laten inwerken, daarna uitspoelen.');
p(cpsr, 'Doelgroep: volwassenen, alle haartypes. Rinse-off product. Niet bedoeld voor kinderen onder 3 jaar. Uitsluitend uitwendig gebruik.');
gap(cpsr, 0.3);

h1(cpsr, '6. Blootstelling aan het product');
simpleRow(cpsr, 'Toepassingsgebied', 'Haar (lengtes en punten) en licht hoofdhuidcontact');
simpleRow(cpsr, 'Frequentie', '2-4 keer per week');
simpleRow(cpsr, 'Contacttijd', 'Kort (1-3 minuten, daarna uitspoelen)');
simpleRow(cpsr, 'Type product', 'Rinse-off');
simpleRow(cpsr, 'Blootstellingsroute', 'Dermaal, kort contact');
simpleRow(cpsr, 'Hoeveelheid per gebruik', 'Ca. 1-2 g productafgifte per wasbeurt');
gap(cpsr, 0.3);

h1(cpsr, '7. Blootstelling aan stoffen');
h2(cpsr, '7.1 Cetearyl Alcohol (45.5 wt%)');
p(cpsr, 'Vetalcohol (geen drogend alcohol). Breed gebruikt als emulgator, verdikker en conditionerend middel in cosmetica. Uitstekend veiligheidsprofiel. CIR-beoordeeld als veilig voor cosmetisch gebruik. Niet-sensibiliserend, niet-irriterend bij normale concentraties.');
gap(cpsr, 0.2);

h2(cpsr, '7.2 Plantaardige boters en olien (53.8 wt%)');
p(cpsr, 'Sheaboter (20%), cacaoboter (19.7%), kokosolie (8%) en jojobaolie (6.1%). Allen langgeketen triglyceriden en wasesters met uitstekend veiligheidsprofiel. Breed gebruikt in cosmetica, opgenomen in CosIng. Geen sensibilisatie bij gebruikelijke concentraties.');
gap(cpsr, 0.2);

h2(cpsr, '7.3 Tocopherol (0.3 wt%)');
p(cpsr, 'Natuurlijke vitamine E, antioxidant. Veilig bij concentraties tot 5%. Geen bezwaren bij 0.3%.');
gap(cpsr, 0.2);

h2(cpsr, '7.4 Essentiele olien (0.4 wt%)');
p(cpsr, 'Lavendelolie (0.2%) en bergamotolie (0.2%). Zeer lage concentraties. Bevat natuurlijke allergenen (linalool, limonene, linalyl acetaat) in spoorhoeveelheden, onder IFRA-drempelwaarden voor rinse-off producten. Bergamotolie dient bergapten-vrij (FCF) te zijn om fototoxiciteit te voorkomen.');
gap(cpsr, 0.3);

h1(cpsr, '8. Toxicologisch profiel');
p(cpsr, 'Alle ingredienten zijn opgenomen in de CosIng-database. Geen stoffen op Bijlage II of III van Verordening 1223/2009. Geen CMR-stoffen, geen nanomaterialen, geen synthetische conserveermiddelen, kleurstoffen of sulfaten.');
gap(cpsr, 0.3);

h1(cpsr, '9. Ongewenste en ernstige ongewenste effecten');
p(cpsr, 'Geen ernstige ongewenste effecten gerapporteerd. Mogelijke milde effecten:');
bullets(cpsr, [
  'Lichte productopbouw bij onvoldoende uitspoelen',
  'Milde irritatie bij overgevoeligheid voor essentiele olien (zeer zeldzaam bij 0.2%)',
  'Bij oogcontact: spoelen met water'
]);
gap(cpsr, 0.5);

cpsr.addPage();
cpsr.fontSize(18).font('Helvetica-Bold').fillColor(c.accent).text('DEEL B \u2014 Veiligheidsbeoordeling', ml, cpsr.y, { width: pw });
cpsr.moveDown(0.5);

h1(cpsr, '10. Conclusie van de beoordeling');
p(cpsr, 'Op basis van de samenstelling, fysisch-chemische eigenschappen, toxicologische profielen, de rinse-off toepassing en het ontbreken van gerapporteerde ernstige bijwerkingen, wordt geconcludeerd dat:');
gap(cpsr, 0.1);
b(cpsr, 'Het product "Oergezond Conditioner Bar" veilig is voor de menselijke gezondheid wanneer het wordt gebruikt onder normale of redelijkerwijs te verwachten gebruiksomstandigheden.');
gap(cpsr, 0.2);
p(cpsr, 'Voorwaarden:');
bullets(cpsr, [
  'Uitsluitend voor uitwendig gebruik op het haar.',
  'Uitspoelen na gebruik.',
  'Contact met ogen vermijden. Bij oogcontact uitspoelen met water.',
  'Buiten bereik van kinderen bewaren.',
  'Droog bewaren tussen gebruik.',
  'Bergamotolie dient bergapten-vrij (FCF) te zijn.',
  'INCI-lijst en allergeneninformatie correct op etiket vermeld.'
]);
gap(cpsr, 0.3);

h1(cpsr, '11. Waarschuwingen op het etiket');
bullets(cpsr, [
  'Alleen voor uitwendig gebruik.',
  'Na gebruik uitspoelen.',
  'Contact met ogen vermijden.',
  'Buiten bereik van kinderen bewaren.',
  'Bevat: Linalool, Limonene (van lavendel- en bergamotolie).',
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
