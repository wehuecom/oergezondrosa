const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const ingredients = [
  { name: 'Bentonite', cas: '1302-78-9', pct: 31 },
  { name: 'Ricinus Communis (Castor) Seed Oil', cas: '8001-79-4', pct: 28 },
  { name: 'Cocos Nucifera (Coconut) Oil', cas: '8001-31-8', pct: 24 },
  { name: 'Cera Alba (Beeswax)', cas: '8012-89-3', pct: 10 },
  { name: 'Maranta Arundinacea Root Powder', cas: '9005-25-8', pct: 7 },
];

const c = { black: '#1a1a1a', dark: '#2d2d2d', accent: '#1A2E1A', light: '#666', line: '#d0d0d0' };
const ml = 70; // left margin
const mr = 525; // right edge
const pw = mr - ml; // usable width = 455

function createDoc(filename) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: ml, right: 70 } });
  doc.pipe(fs.createWriteStream(path.join(__dirname, filename)));
  return doc;
}

function title(doc, t) { doc.fontSize(22).font('Helvetica-Bold').fillColor(c.accent).text(t); doc.moveDown(0.3); }
function h1(doc, t) { checkPage(doc, 40); doc.fontSize(12).font('Helvetica-Bold').fillColor(c.accent).text(t, ml, doc.y, { width: pw }); doc.moveDown(0.1); doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor(c.line).lineWidth(0.5).stroke(); doc.moveDown(0.2); }
function h2(doc, t) { checkPage(doc, 25); doc.fontSize(10).font('Helvetica-Bold').fillColor(c.accent).text(t, ml, doc.y, { width: pw }); doc.moveDown(0.1); }
function p(doc, t) { doc.fontSize(9).font('Helvetica').fillColor(c.dark).text(t, ml, doc.y, { lineGap: 2.5, width: pw }); doc.moveDown(0.15); }
function b(doc, t) { doc.fontSize(9).font('Helvetica-Bold').fillColor(c.black).text(t, ml, doc.y, { lineGap: 2.5, width: pw }); doc.moveDown(0.1); }
function gap(doc, n) { doc.moveDown(n || 0.2); }
function checkPage(doc, needed) { if (doc.y + needed > 780) doc.addPage(); }
function bullets(doc, arr) { arr.forEach(l => { doc.fontSize(9.5).font('Helvetica').fillColor(c.dark).text('•  ' + l, ml + 10, doc.y, { width: pw - 20, lineGap: 2 }); doc.moveDown(0.1); }); }

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
  doc.text('INCI Name', ml + 24, hy + 2, { width: 190 });
  doc.text('CAS No.', ml + 220, hy + 2, { width: 90 });
  doc.text('wt%', ml + 320, hy + 2, { width: 50 });
  doc.y = hy + 16;
  doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#ccc').lineWidth(0.3).stroke();
  doc.moveDown(0.05);

  ingredients.forEach((ing, i) => {
    checkPage(doc, 14);
    const ry = doc.y;
    doc.fontSize(8).font('Helvetica').fillColor(c.dark);
    doc.text(String(i + 1), ml + 4, ry + 1, { width: 20 });
    doc.text(ing.name, ml + 24, ry + 1, { width: 190 });
    doc.text(ing.cas, ml + 220, ry + 1, { width: 90 });
    doc.text(String(ing.pct), ml + 330, ry + 1, { width: 40 });
    doc.y = ry + 13;
    doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#eee').lineWidth(0.2).stroke();
    doc.moveDown(0.03);
  });
  // total row
  checkPage(doc, 14);
  const ty = doc.y;
  doc.fontSize(8).font('Helvetica-Bold').fillColor(c.black);
  doc.text('', ml + 4, ty + 1, { width: 20 });
  doc.text('TOTAAL', ml + 24, ty + 1, { width: 190 });
  doc.text('100', ml + 330, ty + 1, { width: 40 });
  doc.y = ty + 13;
  doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#ccc').lineWidth(0.3).stroke();
  gap(doc, 0.3);
}

// ===================== PIF PDF =====================
const pif = createDoc('haarwax-pif.pdf');

// Cover
pif.moveDown(5);
pif.fontSize(30).font('Helvetica-Bold').fillColor(c.accent).text('Product Information File', { align: 'center' });
pif.moveDown(0.3);
pif.fontSize(16).font('Helvetica').fillColor(c.dark).text('Oergezond Haarwax', { align: 'center' });
pif.moveDown(2);
pif.fontSize(10).font('Helvetica').fillColor(c.light).text('Conform EU Verordening 1223/2009', { align: 'center' });
pif.text('Versie 1.0 | 14 juli 2026', { align: 'center' });

// Page 2
pif.addPage();
h1(pif, '1. Productidentificatie');
simpleRow(pif, 'Productnaam', 'Oergezond Haarwax');
simpleRow(pif, 'Producttype', 'Leave-on stylingwax voor het haar (cosmetisch product)');
simpleRow(pif, 'Toepassing', 'Aanbrengen op droog haar voor grip, textuur en een matte finish');
simpleRow(pif, 'Doelgroep', 'Volwassenen, alle haartypes');
simpleRow(pif, 'Verpakking', 'Pot/blik met schroefdeksel');
simpleRow(pif, 'Inhoud', '70 g');
simpleRow(pif, 'Houdbaarheid', '24 maanden ongeopend / 12 maanden na opening (PAO 12M)');
simpleRow(pif, 'Batchcodering', 'Op verpakking vermeld');
gap(pif, 0.4);

h1(pif, '2. Verantwoordelijke personen');
h2(pif, '2.1 Merkeigenaar');
simpleRow(pif, 'Bedrijfsnaam', 'WEHU ECOM - FZCO');
simpleRow(pif, 'Adres', 'Dubai Digital Park, Building A1, Dubai Silicon Oasis, United Arab Emirates');
simpleRow(pif, 'Merknaam', 'Oergezond');
simpleRow(pif, 'Website', 'www.oergezond.com');
simpleRow(pif, 'E-mail', 'contact@oergezond.com');
gap(pif, 0.3);

h2(pif, '2.2 Responsible Person (EU)');
simpleRow(pif, 'Naam', 'Rosa van Huffel');
simpleRow(pif, 'Bedrijfsnaam', 'Oergezond');
simpleRow(pif, 'EU-adres', 'Belkmerweg 58, 1753 GD Sint Maartensvlotbrug, Nederland');
simpleRow(pif, 'Rol', 'Responsible Person conform EU Verordening 1223/2009, Art. 4');
gap(pif, 0.3);

h2(pif, '2.3 Producent');
simpleRow(pif, 'Bedrijfsnaam', '[Producent naam invullen indien van toepassing]');
simpleRow(pif, 'Adres', '[Adres invullen]');
simpleRow(pif, 'GMP Status', 'Productie conform ISO 22716 (GMP voor cosmetica)');
gap(pif, 0.4);

h1(pif, '3. Kwalitatieve en kwantitatieve samenstelling');
p(pif, 'Volledige INCI-lijst met CAS-nummers en concentraties:');
gap(pif, 0.15);
ingTable(pif);
p(pif, 'Totaal: 100 wt%. Alle ingredienten zijn van cosmetische kwaliteit. Het product is 100% watervrij en bestaat uit minerale klei, plantaardige olien, bijenwas en plantaardig zetmeel. Het bevat geen nanomaterialen, geen CMR-stoffen, geen etherische olien en geen in de EU verboden ingredienten.');
gap(pif, 0.4);

h1(pif, '4. Fysisch-chemische specificaties');
simpleRow(pif, 'Uiterlijk', 'Zachte, kneedbare wax/pasta met matte finish');
simpleRow(pif, 'Kleur', 'Gebroken wit tot lichtgrijs/beige (natuurlijke kleiketint)');
simpleRow(pif, 'Geur', 'Mild, karakteristiek (kokos en bijenwas)');
simpleRow(pif, 'pH', 'N.v.t. (watervrij product)');
simpleRow(pif, 'Dichtheid', '[invullen] g/ml');
simpleRow(pif, 'Oplosbaarheid', 'Niet oplosbaar in water; dispergeert in olien');
simpleRow(pif, 'Stabiliteit', 'Stabiel bij kamertemperatuur (15-25°C). Kan verzachten bij temperaturen boven 30°C. Beschermen tegen hitte en direct zonlicht.');
gap(pif, 0.4);

h1(pif, '5. Microbiologische kwaliteit');
p(pif, 'Het product is 100% watervrij (klei, olien, was en zetmeel zonder waterige fase). De wateractiviteit (aw) is laag, waardoor het risico op microbiologische groei zeer laag is. Er zijn geen conserveermiddelen nodig.');
simpleRow(pif, 'Totaal kiemgetal', '< 100 KVE/g');
simpleRow(pif, 'Gisten en schimmels', '< 10 KVE/g');
simpleRow(pif, 'E. coli', 'Afwezig in 1g');
simpleRow(pif, 'Pseudomonas aeruginosa', 'Afwezig in 1g');
simpleRow(pif, 'Staphylococcus aureus', 'Afwezig in 1g');
gap(pif, 0.4);

h1(pif, '6. Ongewenste effecten en ernstige bijwerkingen');
p(pif, 'Er zijn geen ernstige ongewenste effecten of bijwerkingen gerapporteerd bij normaal gebruik van dit product.');
p(pif, 'Mogelijke milde reacties bij gevoelige personen: contactirritatie of overgevoeligheid voor een van de plantaardige olien of bijenwas. Het product bevat geen etherische olien en geen van de 26 in de EU te declareren parfumallergenen.');
p(pif, 'Bentoniet (klei) kan bij herhaald gebruik een licht uitdrogend effect op de huid hebben door de absorberende werking. Dit is normaal en niet schadelijk.');
gap(pif, 0.4);

h1(pif, '7. Etikettering');
p(pif, 'Het etiket vermeldt conform EU Verordening 1223/2009, Art. 19:');
bullets(pif, [
  'Naam en adres van de Responsible Person',
  'Nominale inhoud in gewicht (70 g)',
  'Houdbaarheidsdatum of PAO-symbool (12M)',
  'Gebruiksaanwijzing indien nodig voor veilig gebruik',
  'Batchnummer',
  'Productfunctie (haarwax / stylingwax)',
  'Volledige INCI-ingredientenlijst',
  'Land van oorsprong'
]);
gap(pif, 0.3);
h2(pif, 'INCI-lijst voor op het etiket');
p(pif, 'Bentonite, Ricinus Communis (Castor) Seed Oil, Cocos Nucifera (Coconut) Oil, Cera Alba, Maranta Arundinacea Root Powder.');
gap(pif, 0.4);

h1(pif, '8. Bewijs van het effect (claims)');
p(pif, 'Claims dienen te voldoen aan EU Verordening 655/2013 (Common Criteria). Alle claims zijn gebaseerd op de bekende eigenschappen van de gebruikte ingredienten:');
simpleRow(pif, 'Geeft grip en houvast', 'Bentoniet en bijenwas geven textuur, structuur en fixatie aan het haar');
simpleRow(pif, 'Matte finish', 'Bentoniet en arrowroot absorberen overtollig vet en geven een matte, niet-vette uitstraling');
simpleRow(pif, 'Voedt en verzacht', 'Castorolie en kokosolie zijn rijk aan vetzuren die het haar verzachten');
simpleRow(pif, '100% natuurlijk / watervrij', 'De formule bestaat uitsluitend uit natuurlijke minerale en plantaardige ingredienten, zonder water of synthetische toevoegingen');
gap(pif, 0.4);

h1(pif, '9. Dierproeven');
p(pif, 'Dit product en de afzonderlijke ingredienten zijn niet op dieren getest, conform het EU-verbod op dierproeven voor cosmetische producten (Verordening 1223/2009, Art. 18).');
gap(pif, 0.4);

h1(pif, '10. Documentbeheer');
simpleRow(pif, 'Versie', '1.0');
simpleRow(pif, 'Datum', '14 juli 2026');
simpleRow(pif, 'Opgesteld door', 'Oergezond');
simpleRow(pif, 'Volgende herziening', '14 juli 2027');
simpleRow(pif, 'Bewaartermijn', 'Minimaal 10 jaar na laatste batch op de markt (Art. 11)');

pif.end();
console.log('PIF saved');

// ===================== CPSR PDF =====================
const cpsr = createDoc('haarwax-cpsr.pdf');

// Cover
cpsr.moveDown(5);
cpsr.fontSize(28).font('Helvetica-Bold').fillColor(c.accent).text('Cosmetic Product', { align: 'center' });
cpsr.fontSize(28).font('Helvetica-Bold').fillColor(c.accent).text('Safety Report', { align: 'center' });
cpsr.moveDown(0.3);
cpsr.fontSize(16).font('Helvetica').fillColor(c.dark).text('Oergezond Haarwax', { align: 'center' });
cpsr.moveDown(2);
cpsr.fontSize(10).font('Helvetica').fillColor(c.light).text('Conform EU Verordening 1223/2009, Art. 10 & Bijlage I', { align: 'center' });
cpsr.text('Versie 1.0 | 14 juli 2026', { align: 'center' });

// PART A
cpsr.addPage();
cpsr.fontSize(18).font('Helvetica-Bold').fillColor(c.accent).text('DEEL A — Veiligheidsinformatie');
cpsr.moveDown(0.5);

h1(cpsr, '1. Kwantitatieve en kwalitatieve samenstelling');
p(cpsr, 'Het product is een leave-on stylingwax voor het haar, bestaande uit minerale klei (bentoniet), plantaardige olien (castor, kokos), bijenwas en plantaardig zetmeel (arrowroot). Het bevat geen water, geen conserveermiddelen, geen etherische olien en geen synthetische geur- of kleurstoffen.');
gap(cpsr, 0.15);
ingTable(cpsr);

h1(cpsr, '2. Fysische/chemische eigenschappen');
simpleRow(cpsr, 'Uiterlijk', 'Zachte, kneedbare wax/pasta met matte finish');
simpleRow(cpsr, 'Kleur', 'Gebroken wit tot lichtgrijs/beige (natuurlijke kleiketint)');
simpleRow(cpsr, 'Geur', 'Mild, karakteristiek (kokos en bijenwas)');
simpleRow(cpsr, 'pH', 'N.v.t. (watervrij product)');
simpleRow(cpsr, 'Consistentie', 'Halfvaste wax, kneedbaar bij kamertemperatuur');
simpleRow(cpsr, 'Stabiliteit', 'Stabiel bij 15-25°C, minimaal 24 maanden. Kan verzachten boven 30°C. Beschermen tegen hitte en direct zonlicht.');
gap(cpsr, 0.4);

h1(cpsr, '3. Microbiologische kwaliteit');
p(cpsr, 'Het product is watervrij (klei, olien, was en zetmeel). De wateractiviteit (aw) is laag, waardoor microbiologische groei vrijwel onmogelijk is. Conserveermiddelen zijn niet nodig.');
p(cpsr, 'Challenge testing is niet vereist voor watervrije producten conform ISO 11930. Aangezien bentoniet en arrowroot minerale respectievelijk plantaardige poeders zijn, wordt per batch een microbiologische controle van de grondstoffen en het eindproduct aanbevolen om conformiteit met de limieten uit EU Verordening 1223/2009, Bijlage I, punt 3 te bevestigen.');
gap(cpsr, 0.4);

h1(cpsr, '4. Onzuiverheden, sporen, verpakkingsmateriaal');
h2(cpsr, '4.1 Onzuiverheden en zware metalen');
p(cpsr, 'Bijzondere aandacht geldt voor bentoniet (31%): natuurlijke kleimineralen bevatten van nature sporen zware metalen. Een actueel Certificate of Analysis (CoA) van de kleileverancier is vereist om aan te tonen dat de gehalten onder de toxicologisch aanvaardbare drempelwaarden blijven (technisch onvermijdbare sporen conform Art. 17):');
simpleRow(cpsr, 'Lood (Pb)', '< 10 ppm');
simpleRow(cpsr, 'Arseen (As)', '< 3 ppm');
simpleRow(cpsr, 'Cadmium (Cd)', '< 1 ppm');
simpleRow(cpsr, 'Kwik (Hg)', '< 1 ppm');
simpleRow(cpsr, 'Antimoon (Sb)', '< 5 ppm');
p(cpsr, 'De plantaardige olien en het arrowrootzetmeel voldoen aan de gebruikelijke cosmetische grondstofspecificaties. Pesticideresiduen in de plantaardige grondstoffen dienen binnen de limieten van EU Verordening 396/2005 te blijven.');
gap(cpsr, 0.2);
h2(cpsr, '4.2 Verpakkingsmateriaal');
p(cpsr, 'Pot of blik (aluminium of PP) met schroefdeksel, 70 g. Het verpakkingsmateriaal is inert en reageert niet met de watervrije formulering. Bij een PP-pot: food-grade, vrij van BPA en ftalaten. Bij een aluminium blik: voorzien van een inerte binnencoating.');
gap(cpsr, 0.4);

h1(cpsr, '5. Normaal en redelijkerwijs te verwachten gebruik');
p(cpsr, 'Het product is bedoeld als leave-on stylingwax. Toepassing: een kleine hoeveelheid (erwtgrootte) tussen de handpalmen opwarmen en verdelen door droog haar voor grip, textuur en fixatie. Niet uitspoelen.');
p(cpsr, 'Doelgroep: volwassenen, alle haartypes. Niet bedoeld voor kinderen onder 3 jaar. Uitsluitend voor uitwendig gebruik. Redelijkerwijs voorzienbaar verkeerd gebruik: onbedoeld contact met ogen of inname. Beide risico\'s zijn laag gezien de samenstelling van voedingsgrade olien en inerte klei.');
gap(cpsr, 0.4);

h1(cpsr, '6. Blootstelling aan het product');
simpleRow(cpsr, 'Toepassingsgebied', 'Haar en hoofdhuid (indirect)');
simpleRow(cpsr, 'Frequentie', 'Dagelijks, 1 keer per dag');
simpleRow(cpsr, 'Hoeveelheid per toepassing', 'ca. 0.5-1.0 g');
simpleRow(cpsr, 'Type product', 'Leave-on (niet uitspoelen)');
simpleRow(cpsr, 'Blootstellingsroute', 'Dermaal (voornamelijk haarschacht, beperkt hoofdhuidcontact)');
simpleRow(cpsr, 'Retentiefactor', '1.0 (leave-on)');
gap(cpsr, 0.4);

h1(cpsr, '7. Blootstelling aan stoffen');
p(cpsr, 'Toxicologische beoordeling per ingredient:');
gap(cpsr, 0.15);

h2(cpsr, '7.1 Bentonite (31 wt%)');
p(cpsr, 'Natuurlijk kleimineraal (montmorilloniet). Inert, niet-toxisch en niet-irriterend bij dermaal gebruik. Wordt breed toegepast in cosmetica als absorberend en textuurgevend ingredient (CIR: veilig bevonden voor cosmetisch gebruik). Wordt niet door de huid opgenomen. Aandachtspunt is de zuiverheid ten aanzien van zware metalen (zie 4.1). De deeltjesgrootte is groter dan 100 nm; bentoniet wordt niet als nanomateriaal beschouwd.');
gap(cpsr, 0.2);

h2(cpsr, '7.2 Ricinus Communis (Castor) Seed Oil (28 wt%)');
p(cpsr, 'Castorolie (de olie, niet de boon) is vrij van ricine en heeft een uitstekend veiligheidsprofiel. CIR-eindbeoordeling: veilig voor cosmetisch gebruik. Niet-irriterend, niet-sensibiliserend bij de gebruikte concentratie. Opgenomen in de CosIng-database.');
gap(cpsr, 0.2);

h2(cpsr, '7.3 Cocos Nucifera (Coconut) Oil (24 wt%)');
p(cpsr, 'Kokosolie, rijk aan laurine- en myristinezuur. Breed gebruikt in cosmetica met een lange geschiedenis van veilig gebruik. Niet-toxisch, verzachtend. Kokos wordt in de EU niet geclassificeerd als een te declareren allergeen.');
gap(cpsr, 0.2);

h2(cpsr, '7.4 Cera Alba / Beeswax (10 wt%)');
p(cpsr, 'Bijenwas, een natuurlijke was gebruikt als structuur- en filmvormend middel. Uitstekend veiligheidsprofiel, niet-irriterend en niet-sensibiliserend. Opgenomen in de CosIng-database, geen beperkingen onder Verordening 1223/2009.');
gap(cpsr, 0.2);

h2(cpsr, '7.5 Maranta Arundinacea Root Powder / Arrowroot (7 wt%)');
p(cpsr, 'Plantaardig zetmeel uit de arrowrootwortel, gebruikt als absorberend en matterend ingredient. Inert, niet-toxisch en niet-irriterend. Lange geschiedenis van veilig gebruik in cosmetica en levensmiddelen.');
gap(cpsr, 0.4);

h1(cpsr, '8. Toxicologisch profiel van de stoffen');
p(cpsr, 'Alle ingredienten zijn opgenomen in de CosIng-database van de Europese Commissie en/of hebben een GRAS-status. Geen van de ingredienten staat op Bijlage II (verboden stoffen) van Verordening 1223/2009. Het product bevat geen etherische olien en dus geen van de 26 te declareren parfumallergenen uit Bijlage III.');
gap(cpsr, 0.2);
p(cpsr, 'Er zijn geen CMR-stoffen (kankerverwekkend, mutageen, reproductietoxisch) aanwezig in de formulering. Er zijn geen nanomaterialen gebruikt. Het enige relevante toxicologische aandachtspunt is de zware-metaalzuiverheid van de bentonietklei, die via een CoA per batch geborgd wordt (zie 4.1).');
gap(cpsr, 0.4);

h1(cpsr, '9. Ongewenste en ernstige ongewenste effecten');
p(cpsr, 'Er zijn geen ernstige ongewenste effecten gerapporteerd. Mogelijke milde effecten bij gevoelige personen:');
bullets(cpsr, [
  'Lichte uitdroging van de huid door de absorberende werking van bentoniet en arrowroot',
  'Overgevoeligheid of milde irritatie bij bekende allergie voor bijenwas of propolis-resten',
  'Milde irritatie bij onbedoeld oogcontact'
]);
p(cpsr, 'Bij optreden van irritatie dient het gebruik gestaakt te worden.');
gap(cpsr, 0.5);

// PART B
cpsr.addPage();
cpsr.fontSize(18).font('Helvetica-Bold').fillColor(c.accent).text('DEEL B — Veiligheidsbeoordeling');
cpsr.moveDown(0.5);

h1(cpsr, '10. Conclusie van de beoordeling');
p(cpsr, 'Op basis van de kwalitatieve en kwantitatieve samenstelling, de fysisch-chemische eigenschappen, de toxicologische profielen van de individuele ingredienten, de beoogde blootstellingsroute en -frequentie, en het ontbreken van gerapporteerde ernstige bijwerkingen, wordt geconcludeerd dat:');
gap(cpsr, 0.15);
b(cpsr, 'Het product "Oergezond Haarwax" veilig is voor de menselijke gezondheid wanneer het wordt gebruikt onder normale of redelijkerwijs te verwachten gebruiksomstandigheden, rekening houdend met de presentatie, etikettering en gebruiksaanwijzing.');
gap(cpsr, 0.3);
p(cpsr, 'Voorwaarden:');
bullets(cpsr, [
  'Het product is uitsluitend bedoeld voor uitwendig gebruik op het haar.',
  'Een actueel CoA van de bentonietleverancier bevestigt dat de zware-metaalgehalten onder de aanvaardbare drempelwaarden blijven.',
  'Personen met een bekende allergie voor bijenwas/propolis dienen het product te vermijden of vooraf een huidtest uit te voeren.',
  'Contact met ogen vermijden. Bij contact met ogen uitspoelen met water.',
  'Buiten bereik van kinderen bewaren.',
  'De INCI-lijst wordt correct op het etiket vermeld.'
]);
gap(cpsr, 0.4);

h1(cpsr, '11. Waarschuwingen en gebruiksaanwijzing op het etiket');
p(cpsr, 'De volgende tekst dient op het etiket vermeld te worden:');
bullets(cpsr, [
  'Alleen voor uitwendig gebruik.',
  'Contact met ogen vermijden; bij contact uitspoelen met water.',
  'Buiten bereik van kinderen bewaren.',
  'Niet geschikt voor kinderen onder 3 jaar.',
  'Bij irritatie gebruik staken.',
  'Koel en droog bewaren, beschermen tegen hitte.'
]);
gap(cpsr, 0.4);

h1(cpsr, '12. Gegevens van de veiligheidsbeoordelaar');
simpleRow(cpsr, 'Naam', '[Naam veiligheidsbeoordelaar]');
simpleRow(cpsr, 'Kwalificatie', '[Universitair diploma in farmacie, toxicologie of geneeskunde]');
simpleRow(cpsr, 'Adres', '[Adres]');
simpleRow(cpsr, 'Datum', '14 juli 2026');
simpleRow(cpsr, 'Handtekening', '________________________________');
gap(cpsr, 0.3);
p(cpsr, 'Opmerking: De veiligheidsbeoordeling (Deel B) dient te worden uitgevoerd en ondertekend door een gekwalificeerd persoon met een universitair diploma in farmacie, toxicologie, geneeskunde of een vergelijkbare discipline, conform Art. 10 lid 2 van Verordening 1223/2009.');
gap(cpsr, 0.4);

h1(cpsr, '13. Documentbeheer');
simpleRow(cpsr, 'Versie', '1.0');
simpleRow(cpsr, 'Datum', '14 juli 2026');
simpleRow(cpsr, 'Volgende herziening', '14 juli 2027 of bij formuleringswijziging');
simpleRow(cpsr, 'Bewaartermijn PIF', 'Minimaal 10 jaar na laatste batch op de markt');

cpsr.end();
console.log('CPSR saved');
