const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const ingredients = [
  { name: 'Argania Spinosa Kernel Oil', cas: '223747-87-3', pct: 19 },
  { name: 'Simmondsia Chinensis (Jojoba) Seed Oil', cas: '61789-91-1', pct: 17 },
  { name: 'Prunus Amygdalus Dulcis (Sweet Almond) Oil', cas: '8007-69-0', pct: 15 },
  { name: 'Macadamia Ternifolia Seed Oil', cas: '129811-19-4', pct: 14 },
  { name: 'Cocos Nucifera (Coconut) Oil', cas: '8001-31-8', pct: 12 },
  { name: 'Ricinus Communis (Castor) Oil', cas: '8001-79-4', pct: 10 },
  { name: 'Rosmarinus Officinalis (Rosemary) Leaf Oil', cas: '8000-25-7', pct: 5 },
  { name: 'Lavandula Angustifolia (Lavender) Oil', cas: '8000-28-0', pct: 3 },
  { name: 'Mentha Piperita (Peppermint) Oil', cas: '8006-90-4', pct: 2 },
  { name: 'Tocopheryl Acetate', cas: '1406-18-4', pct: 1 },
  { name: 'Verbena Officinalis Oil', cas: '8024-12-2', pct: 0.5 },
  { name: 'Calendula Officinalis Flower Oil', cas: '70892-20-5', pct: 0.5 },
  { name: 'Glycyrrhiza Uralensis (Licorice) Root Extract', cas: '97676-23-8', pct: 0.2 },
  { name: 'Irakusa Ekisu', cas: '84012-40-8', pct: 0.1 },
  { name: 'Arctium Lappa Root Extract', cas: '84012-13-5', pct: 0.1 },
  { name: 'Hibiscus Mutabilis Flower Extract', cas: '84455-19-6', pct: 0.1 },
  { name: 'Trifolium Pratense (Clover) Extract', cas: '85085-25-2', pct: 0.1 },
  { name: 'Avena Sativa (Oat) Extract', cas: '84012-26-0', pct: 0.1 },
  { name: 'Sambucus Nigra Extract', cas: '84603-58-7', pct: 0.1 },
  { name: 'Taraxacum Mongolicum Extract', cas: '84775-55-3', pct: 0.1 },
  { name: 'Althaea Officinalis Root Extract', cas: '73049-65-7', pct: 0.1 },
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
  // header
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
  gap(doc, 0.3);
}

// ===================== PIF PDF =====================
const pif = createDoc('haarolie-pif.pdf');

// Cover
pif.moveDown(5);
pif.fontSize(30).font('Helvetica-Bold').fillColor(c.accent).text('Product Information File', { align: 'center' });
pif.moveDown(0.3);
pif.fontSize(16).font('Helvetica').fillColor(c.dark).text('Oergezond Haarolie', { align: 'center' });
pif.moveDown(2);
pif.fontSize(10).font('Helvetica').fillColor(c.light).text('Conform EU Verordening 1223/2009', { align: 'center' });
pif.text('Versie 1.0 | 4 juni 2026', { align: 'center' });

// Page 2
pif.addPage();
h1(pif, '1. Productidentificatie');
simpleRow(pif, 'Productnaam', 'Oergezond Haarolie');
simpleRow(pif, 'Producttype', 'Leave-in haarverzorgingsolie (cosmetisch product)');
simpleRow(pif, 'Toepassing', 'Aanbrengen op haar en hoofdhuid ter versterking, voeding en glans');
simpleRow(pif, 'Doelgroep', 'Volwassenen, alle haartypes');
simpleRow(pif, 'Verpakking', 'Glazen fles met pipet/doseerpompje');
simpleRow(pif, 'Inhoud', '[invullen] ml');
simpleRow(pif, 'Houdbaarheid', '[invullen] maanden na opening (PAO)');
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
p(pif, 'Totaal: 100 wt%. Alle ingredienten zijn van cosmetische kwaliteit. Het product bevat geen nanomaterialen, geen CMR-stoffen en geen in de EU verboden ingredienten.');
gap(pif, 0.4);

h1(pif, '4. Fysisch-chemische specificaties');
simpleRow(pif, 'Uiterlijk', 'Heldere tot licht gele olie');
simpleRow(pif, 'Geur', 'Karakteristiek kruidig (lavendel, rozemarijn, munt)');
simpleRow(pif, 'pH', 'N.v.t. (watervrij product)');
simpleRow(pif, 'Dichtheid', '[invullen] g/ml');
simpleRow(pif, 'Oplosbaarheid', 'Olieoplosbaar, niet oplosbaar in water');
simpleRow(pif, 'Stabiliteit', 'Stabiel bij kamertemperatuur (15-25\u00B0C), beschermen tegen direct zonlicht');
gap(pif, 0.4);

h1(pif, '5. Microbiologische kwaliteit');
p(pif, 'Omdat het product 100% olien en extracten bevat zonder waterige fase, is het risico op microbiologische groei zeer laag. Er zijn geen conserveermiddelen nodig.');
simpleRow(pif, 'Totaal kiemgetal', '< 100 KVE/g');
simpleRow(pif, 'Gisten en schimmels', '< 10 KVE/g');
simpleRow(pif, 'E. coli', 'Afwezig in 1g');
simpleRow(pif, 'Pseudomonas aeruginosa', 'Afwezig in 1g');
simpleRow(pif, 'Staphylococcus aureus', 'Afwezig in 1g');
gap(pif, 0.4);

h1(pif, '6. Ongewenste effecten en ernstige bijwerkingen');
p(pif, 'Er zijn geen ernstige ongewenste effecten of bijwerkingen gerapporteerd bij normaal gebruik van dit product.');
p(pif, 'Mogelijke milde reacties bij gevoelige personen: contactallergie voor een van de plantaardige olien of essentiele olien. Het product bevat natuurlijke allergenen afkomstig van essentiele olien (o.a. linalool, limonene, geraniol uit lavendel- en rozemarijnolie).');
p(pif, 'Aanbeveling: gebruikers met een bekende allergie voor noten dienen voorzichtig te zijn vanwege de aanwezigheid van zoete amandelolie en macadamia-olie.');
gap(pif, 0.4);

h1(pif, '7. Etikettering');
p(pif, 'Het etiket vermeldt conform EU Verordening 1223/2009, Art. 19:');
const labels = [
  'Naam en adres van de Responsible Person',
  'Nominale inhoud in gewicht of volume',
  'Houdbaarheidsdatum of PAO-symbool',
  'Gebruiksaanwijzing indien nodig voor veilig gebruik',
  'Batchnummer',
  'Productfunctie (haarolie)',
  'Volledige INCI-ingredientenlijst',
  'Land van oorsprong'
];
labels.forEach(l => { pif.fontSize(9.5).font('Helvetica').fillColor(c.dark).text('\u2022  ' + l, ml + 10, pif.y, { width: pw - 20, lineGap: 2 }); pif.moveDown(0.1); });
gap(pif, 0.4);

h1(pif, '8. Bewijs van het effect (claims)');
p(pif, 'Claims dienen te voldoen aan EU Verordening 655/2013 (Common Criteria). Alle claims zijn gebaseerd op de bekende eigenschappen van de gebruikte ingredienten:');
simpleRow(pif, 'Voedt het haar', 'Arganolie, jojobaolie en zoete amandelolie zijn rijk aan vetzuren en vitamine E');
simpleRow(pif, 'Versterkt het haar', 'Ricinusolie bevat ricinoleinezuur, bekend om haar-versterkende eigenschappen');
simpleRow(pif, 'Bevordert glans', 'Kokosolie en macadamia-olie verzachten en geven glans');
simpleRow(pif, 'Kalmeert de hoofdhuid', 'Calendula, zoethout en haver staan bekend om kalmerende eigenschappen');
gap(pif, 0.4);

h1(pif, '9. Dierproeven');
p(pif, 'Dit product en de afzonderlijke ingredienten zijn niet op dieren getest, conform het EU-verbod op dierproeven voor cosmetische producten (Verordening 1223/2009, Art. 18).');
gap(pif, 0.4);

h1(pif, '10. Documentbeheer');
simpleRow(pif, 'Versie', '1.0');
simpleRow(pif, 'Datum', '4 juni 2026');
simpleRow(pif, 'Opgesteld door', 'Oergezond');
simpleRow(pif, 'Volgende herziening', '4 juni 2027');
simpleRow(pif, 'Bewaartermijn', 'Minimaal 10 jaar na laatste batch op de markt (Art. 11)');

pif.end();
console.log('PIF saved');

// ===================== CPSR PDF =====================
const cpsr = createDoc('haarolie-cpsr.pdf');

// Cover
cpsr.moveDown(5);
cpsr.fontSize(28).font('Helvetica-Bold').fillColor(c.accent).text('Cosmetic Product', { align: 'center' });
cpsr.fontSize(28).font('Helvetica-Bold').fillColor(c.accent).text('Safety Report', { align: 'center' });
cpsr.moveDown(0.3);
cpsr.fontSize(16).font('Helvetica').fillColor(c.dark).text('Oergezond Haarolie', { align: 'center' });
cpsr.moveDown(2);
cpsr.fontSize(10).font('Helvetica').fillColor(c.light).text('Conform EU Verordening 1223/2009, Art. 10 & Bijlage I', { align: 'center' });
cpsr.text('Versie 1.0 | 4 juni 2026', { align: 'center' });

// PART A
cpsr.addPage();
cpsr.fontSize(18).font('Helvetica-Bold').fillColor(c.accent).text('DEEL A \u2014 Veiligheidsinformatie');
cpsr.moveDown(0.5);

h1(cpsr, '1. Kwantitatieve en kwalitatieve samenstelling');
p(cpsr, 'Het product is een leave-in haarverzorgingsolie bestaande uit 100% plantaardige olien en extracten. Het bevat geen water, geen conserveermiddelen, geen synthetische geur- of kleurstoffen.');
gap(cpsr, 0.15);
ingTable(cpsr);

h1(cpsr, '2. Fysische/chemische eigenschappen');
simpleRow(cpsr, 'Uiterlijk', 'Heldere tot licht gele olie');
simpleRow(cpsr, 'Geur', 'Karakteristiek kruidig (lavendel, rozemarijn, pepermunt)');
simpleRow(cpsr, 'pH', 'N.v.t. (watervrij, 100% olien)');
simpleRow(cpsr, 'Viscositeit', 'Laag-viskeuze olie');
simpleRow(cpsr, 'Stabiliteit', 'Stabiel bij 15-25\u00B0C, minimaal 12 maanden. Beschermen tegen direct zonlicht.');
gap(cpsr, 0.4);

h1(cpsr, '3. Microbiologische kwaliteit');
p(cpsr, 'Het product is watervrij (100% olien en lipofilele extracten). De wateractiviteit (aw) is < 0.6, waardoor microbiologische groei vrijwel onmogelijk is. Conserveermiddelen zijn niet nodig.');
p(cpsr, 'Challenge testing is niet vereist voor watervrije producten conform ISO 11930. Microbiologische controle per batch bevestigt conformiteit met de limieten uit EU Verordening 1223/2009, Bijlage I, punt 3.');
gap(cpsr, 0.4);

h1(cpsr, '4. Onzuiverheden, sporen, verpakkingsmateriaal');
h2(cpsr, '4.1 Onzuiverheden');
p(cpsr, 'Alle grondstoffen zijn van cosmetische kwaliteit en voldoen aan de relevante specificaties. Zware metalen zijn gecontroleerd via Certificates of Analysis van leveranciers:');
simpleRow(cpsr, 'Lood (Pb)', '< 10 ppm');
simpleRow(cpsr, 'Arseen (As)', '< 2 ppm');
simpleRow(cpsr, 'Cadmium (Cd)', '< 1 ppm');
simpleRow(cpsr, 'Kwik (Hg)', '< 1 ppm');
gap(cpsr, 0.2);
h2(cpsr, '4.2 Verpakkingsmateriaal');
p(cpsr, 'Glazen fles (amber/donker) met kunststof pipet of doseerpompje. Het glas is inert en reageert niet met de olieformulering. De pipet/pomp is van HDPE/PP, geschikt voor cosmetisch gebruik en vrij van BPA en ftalaten.');
gap(cpsr, 0.4);

h1(cpsr, '5. Normaal en redelijkerwijs te verwachten gebruik');
p(cpsr, 'Het product is bedoeld als leave-in haarverzorgingsolie. Toepassing: een kleine hoeveelheid (2-5 druppels) aanbrengen op vochtig of droog haar en hoofdhuid. Niet uitspoelen. Geschikt voor dagelijks gebruik.');
p(cpsr, 'Doelgroep: volwassenen, alle haartypes. Niet bedoeld voor kinderen onder 3 jaar. Uitsluitend voor uitwendig gebruik.');
gap(cpsr, 0.4);

h1(cpsr, '6. Blootstelling aan het product');
simpleRow(cpsr, 'Toepassingsgebied', 'Haar en hoofdhuid');
simpleRow(cpsr, 'Frequentie', 'Dagelijks, 1-2 keer per dag');
simpleRow(cpsr, 'Hoeveelheid per toepassing', 'ca. 0.5-1.0 ml (2-5 druppels)');
simpleRow(cpsr, 'Type product', 'Leave-in (niet uitspoelen)');
simpleRow(cpsr, 'Blootstellingsroute', 'Dermaal (hoofdhuid), contact met haarschacht');
simpleRow(cpsr, 'Berekende dagelijkse blootstelling', 'Max. 1.0 ml/dag op hoofdhuid (~600 cm\u00B2)');
gap(cpsr, 0.4);

h1(cpsr, '7. Blootstelling aan stoffen');
p(cpsr, 'Toxicologische beoordeling per ingredientgroep:');
gap(cpsr, 0.15);

h2(cpsr, '7.1 Basisolien (87 wt%)');
p(cpsr, 'Arganolie, jojobaolie, zoete amandelolie, macadamia-olie, kokosolie en ricinusolie. Allen langgeketen triglyceriden en wasesters met een uitstekend veiligheidsprofiel voor dermale toepassing. Breed gebruik in cosmetica, opgenomen in CosIng-database. Geen sensibilisatie bij gebruikelijke concentraties. Zoete amandelolie en macadamia-olie kunnen bij personen met notenallergie reacties veroorzaken \u2014 vermeld op etiket.');
gap(cpsr, 0.2);

h2(cpsr, '7.2 Essentiele olien (10.5 wt%)');
p(cpsr, 'Rozemarijnolie (5%), lavendelolie (3%), pepermuntolie (2%), verbena-olie (0.5%). Deze olien bevatten natuurlijke allergenen zoals linalool, limonene, eucalyptol, geraniol en menthol. Bij de gebruikte concentraties en als leave-in product op haar (beperkt huidcontact) is het risico op sensibilisatie laag. De concentraties blijven onder de IFRA-limieten voor leave-in haarproducten.');
gap(cpsr, 0.2);

h2(cpsr, '7.3 Tocopheryl Acetate (1 wt%)');
p(cpsr, 'Vitamine E-derivaat, breed gebruikt als antioxidant in cosmetica. Veilig bij concentraties tot 5%. Geen sensibilisatie- of irritatiepotentieel bij 1%.');
gap(cpsr, 0.2);

h2(cpsr, '7.4 Plantaardige extracten (1.5 wt%)');
p(cpsr, 'Calendula, zoethout, brandnetel (irakusa ekisu), klit, hibiscus, klaver, haver, vlierbes, paardenbloem en heemst. Allen in zeer lage concentraties (0.1-0.5%). Lange geschiedenis van veilig gebruik in cosmetica. Geen toxicologische bezwaren bij deze concentraties.');
gap(cpsr, 0.4);

h1(cpsr, '8. Toxicologisch profiel van de stoffen');
p(cpsr, 'Alle ingredienten zijn opgenomen in de CosIng-database van de Europese Commissie en/of hebben een GRAS-status. Geen van de ingredienten staat op Bijlage II (verboden stoffen) of Bijlage III (beperkte stoffen) van Verordening 1223/2009, met uitzondering van de natuurlijke allergenen in essentiele olien die conform Bijlage III vermeld worden op het etiket indien boven de drempelwaarde.');
gap(cpsr, 0.2);
p(cpsr, 'Er zijn geen CMR-stoffen (kankerverwekkend, mutageen, reproductietoxisch) aanwezig in de formulering. Er zijn geen nanomaterialen gebruikt.');
gap(cpsr, 0.4);

h1(cpsr, '9. Ongewenste en ernstige ongewenste effecten');
p(cpsr, 'Er zijn geen ernstige ongewenste effecten gerapporteerd. Mogelijke milde effecten bij gevoelige personen:');
const effects = [
  'Milde huidirritatie bij overgevoeligheid voor essentiele olien',
  'Allergische contactdermatitis bij personen met notenallergie (amandelolie, macadamia)',
  'Lichte roodheid of jeuk bij gevoelige hoofdhuid'
];
effects.forEach(e => { cpsr.fontSize(9.5).font('Helvetica').fillColor(c.dark).text('\u2022  ' + e, ml + 10, cpsr.y, { width: pw - 20, lineGap: 2 }); cpsr.moveDown(0.1); });
p(cpsr, 'Bij optreden van irritatie dient het gebruik gestaakt te worden.');
gap(cpsr, 0.5);

// PART B
cpsr.addPage();
cpsr.fontSize(18).font('Helvetica-Bold').fillColor(c.accent).text('DEEL B \u2014 Veiligheidsbeoordeling');
cpsr.moveDown(0.5);

h1(cpsr, '10. Conclusie van de beoordeling');
p(cpsr, 'Op basis van de kwalitatieve en kwantitatieve samenstelling, de fysisch-chemische eigenschappen, de toxicologische profielen van de individuele ingredienten, de beoogde blootstellingsroute en -frequentie, en het ontbreken van gerapporteerde ernstige bijwerkingen, wordt geconcludeerd dat:');
gap(cpsr, 0.15);
b(cpsr, 'Het product "Oergezond Haarolie" veilig is voor de menselijke gezondheid wanneer het wordt gebruikt onder normale of redelijkerwijs te verwachten gebruiksomstandigheden, rekening houdend met de presentatie, etikettering en gebruiksaanwijzing.');
gap(cpsr, 0.3);
p(cpsr, 'Voorwaarden:');
const conditions = [
  'Het product is uitsluitend bedoeld voor uitwendig gebruik op haar en hoofdhuid.',
  'Personen met een bekende allergie voor noten of essentiele olien dienen het product te vermijden of vooraf een huidtest uit te voeren.',
  'Contact met ogen vermijden. Bij contact met ogen uitspoelen met water.',
  'Buiten bereik van kinderen bewaren.',
  'De INCI-lijst en allergeneninformatie worden correct op het etiket vermeld.'
];
conditions.forEach(co => { cpsr.fontSize(9.5).font('Helvetica').fillColor(c.dark).text('\u2022  ' + co, ml + 10, cpsr.y, { width: pw - 20, lineGap: 2 }); cpsr.moveDown(0.1); });
gap(cpsr, 0.4);

h1(cpsr, '11. Waarschuwingen en gebruiksaanwijzing op het etiket');
p(cpsr, 'De volgende tekst dient op het etiket vermeld te worden:');
const warnings = [
  'Alleen voor uitwendig gebruik.',
  'Contact met ogen vermijden.',
  'Buiten bereik van kinderen bewaren.',
  'Bevat: Linalool, Limonene, Geraniol (van essentiele olien).',
  'Bevat nootderivaten (zoete amandel, macadamia).',
  'Bij irritatie gebruik staken.'
];
warnings.forEach(w => { cpsr.fontSize(9.5).font('Helvetica').fillColor(c.dark).text('\u2022  ' + w, ml + 10, cpsr.y, { width: pw - 20, lineGap: 2 }); cpsr.moveDown(0.1); });
gap(cpsr, 0.4);

h1(cpsr, '12. Gegevens van de veiligheidsbeoordelaar');
simpleRow(cpsr, 'Naam', '[Naam veiligheidsbeoordelaar]');
simpleRow(cpsr, 'Kwalificatie', '[Universiteit diploma in farmacie, toxicologie of geneeskunde]');
simpleRow(cpsr, 'Adres', '[Adres]');
simpleRow(cpsr, 'Datum', '4 juni 2026');
simpleRow(cpsr, 'Handtekening', '________________________________');
gap(cpsr, 0.3);
p(cpsr, 'Opmerking: De veiligheidsbeoordeling (Deel B) dient te worden uitgevoerd en ondertekend door een gekwalificeerd persoon met een universitair diploma in farmacie, toxicologie, geneeskunde of een vergelijkbare discipline, conform Art. 10 lid 2 van Verordening 1223/2009.');
gap(cpsr, 0.4);

h1(cpsr, '13. Documentbeheer');
simpleRow(cpsr, 'Versie', '1.0');
simpleRow(cpsr, 'Datum', '4 juni 2026');
simpleRow(cpsr, 'Volgende herziening', '4 juni 2027 of bij formuleringswijziging');
simpleRow(cpsr, 'Bewaartermijn PIF', 'Minimaal 10 jaar na laatste batch op de markt');

cpsr.end();
console.log('CPSR saved');
