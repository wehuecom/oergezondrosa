const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 60, bottom: 60, left: 55, right: 55 }
});

const output = path.join(__dirname, 'nieuwsbrief-harvard-darmen-depressie.pdf');
doc.pipe(fs.createWriteStream(output));

const colors = {
  black: '#1a1a1a',
  dark: '#2d2d2d',
  accent: '#4a7c59',
  light: '#666666',
  line: '#e0e0e0',
  bg: '#f5f5f0'
};

// --- TITLE ---
doc.fontSize(26).font('Helvetica-Bold').fillColor(colors.black)
   .text('Je slechte humeur begint niet in je hoofd.', { align: 'left' });
doc.fontSize(26).font('Helvetica-Bold').fillColor(colors.accent)
   .text('Het begint in je darmen.', { align: 'left' });

doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica').fillColor(colors.light)
   .text('Harvard Medical School · Journal of the American Chemical Society · 2025', { align: 'left' });

doc.moveDown(0.3);
doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor(colors.line).lineWidth(1).stroke();
doc.moveDown(0.8);

// --- INTRO ---
doc.fontSize(11).font('Helvetica').fillColor(colors.dark)
   .text('Harvard-onderzoekers hebben voor het eerst het exacte mechanisme blootgelegd waardoor een darmbacterie depressie kan veroorzaken. Geen vaag verband. Een concreet, moleculair pad van je darmen naar je brein.', {
     lineGap: 4
   });

doc.moveDown(1);

// --- WAT ZE ONTDEKTEN ---
doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.accent)
   .text('Wat ze ontdekten');
doc.moveDown(0.4);

doc.fontSize(11).font('Helvetica').fillColor(colors.dark)
   .text('De bacterie Morganella morganii — die van nature in je darmen leeft — maakt een vetachtig molecuul aan. Normaal gesproken onschuldig.', { lineGap: 4 });
doc.moveDown(0.4);
doc.text('Maar zodra die bacterie in aanraking komt met diethanolamine (DEA), een chemische stof die voorkomt in schoonmaakmiddelen, landbouwproducten en cosmetica, verandert alles.', { lineGap: 4 });
doc.moveDown(0.4);
doc.text('De bacterie bouwt DEA in dat molecuul in. En dat aangepaste molecuul? Dat lijkt op cardiolipine — een stof die je immuunsysteem herkent als gevaar.', { lineGap: 4 });
doc.moveDown(0.4);
doc.text('Je lichaam slaat alarm. Het pompt ontstekingseiwitten naar buiten, met name interleukine-6 (IL-6). En precies dat eiwit is al jaren gelinkt aan depressie.', { lineGap: 4 });

doc.moveDown(1);

// --- SIMPEL GEZEGD ---
doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.accent)
   .text('Simpel gezegd');
doc.moveDown(0.4);

const steps = [
  'Je darmbacterie komt in contact met een gifstof uit je omgeving',
  'Die gifstof verandert een onschuldig molecuul in een ontstekingstrigger',
  'Je immuunsysteem reageert met chronische ontsteking',
  'Die ontsteking bereikt je brein',
  'Resultaat: depressieve klachten'
];

steps.forEach((step, i) => {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.accent)
     .text(`${i + 1}.  `, { continued: true });
  doc.font('Helvetica').fillColor(colors.dark)
     .text(step, { lineGap: 3 });
  doc.moveDown(0.15);
});

doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.black)
   .text('Geen chemische onbalans in je hoofd. Een ontstekingsreactie die begint in je darmen.', { lineGap: 4 });

doc.moveDown(1);

// --- WAAROM DIT ALLES VERANDERT ---
doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.accent)
   .text('Waarom dit alles verandert');
doc.moveDown(0.4);

doc.fontSize(11).font('Helvetica').fillColor(colors.dark)
   .text('Tot nu toe werd depressie behandeld als een hersenprobleem. Te weinig serotonine, pillen erbij, klaar. Maar dit onderzoek laat zien dat tenminste een deel van depressie eigenlijk een auto-immuunreactie is. Veroorzaakt door wat er in je darmen gebeurt.', { lineGap: 4 });

doc.moveDown(0.6);

// Quote box
const quoteY = doc.y;
doc.rect(55, quoteY, 485, 65).fill('#f0f5f1');
doc.fontSize(10.5).font('Helvetica-Oblique').fillColor(colors.dark)
   .text('"Er was al een verhaal dat de darmen linkt aan depressie. Deze studie gaat een stap verder — naar een echt begrip van de moleculaire mechanismen achter die link."', 70, quoteY + 12, { width: 455, lineGap: 3 });
doc.fontSize(9.5).font('Helvetica').fillColor(colors.light)
   .text('— Prof. Jon Clardy, Harvard Medical School', 70, quoteY + 46, { width: 455 });

doc.y = quoteY + 75;
doc.moveDown(1);

// --- WAT BETEKENT DIT VOOR JOU ---
doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.accent)
   .text('Wat betekent dit voor jou?');
doc.moveDown(0.4);

doc.fontSize(11).font('Helvetica').fillColor(colors.dark)
   .text('Dit onderzoek bevestigt wat wij al langer zeggen: je gezondheid begint in je darmen. Niet in een pillendoos.', { lineGap: 4 });
doc.moveDown(0.4);
doc.text('Wat je eet, bepaalt welke bacteriën floreren. Wat je op je huid smeert en waarmee je je huis schoonmaakt, bepaalt aan welke giftige stoffen die bacteriën worden blootgesteld.', { lineGap: 4 });
doc.moveDown(0.4);
doc.text('Ultra-bewerkt voedsel, schoonmaakmiddelen vol chemicaliën, cosmetica met hormoonverstorende stoffen — het is allemaal onderdeel van dezelfde puzzel.', { lineGap: 4 });

doc.moveDown(0.6);
doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.black)
   .text('De oplossing is niet ingewikkeld:');
doc.moveDown(0.3);

const solutions = [
  'Eet echt voedsel. Geen industriële producten.',
  'Gebruik producten die je lichaam herkent. Geen synthetische troep.',
  'Geef je darmen de kans om te herstellen in plaats van ze dagelijks te vergiftigen.'
];

solutions.forEach(s => {
  doc.fontSize(11).font('Helvetica').fillColor(colors.dark)
     .text(`→  ${s}`, { lineGap: 3 });
  doc.moveDown(0.15);
});

doc.moveDown(1);
doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor(colors.line).lineWidth(1).stroke();
doc.moveDown(0.6);

// --- BRONVERMELDING ---
doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.light)
   .text('OVER HET ONDERZOEK');
doc.moveDown(0.3);

const refs = [
  ['Uitgevoerd door', 'Harvard Medical School (Blavatnik Institute) & Massachusetts General Hospital'],
  ['Hoofdonderzoeker', 'Prof. Jon Clardy'],
  ['Gepubliceerd in', 'Journal of the American Chemical Society'],
  ['Bacterie', 'Morganella morganii'],
  ['Gifstof', 'Diethanolamine (DEA) — in cosmetica, schoonmaakmiddelen, landbouwproducten'],
  ['Mechanisme', 'DEA → ingebouwd in bacterieel molecuul → lijkt op cardiolipine → immuunreactie → IL-6 ontsteking → depressie']
];

refs.forEach(([label, value]) => {
  doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.light)
     .text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(value, { lineGap: 2 });
  doc.moveDown(0.1);
});

doc.end();
console.log('PDF saved to:', output);
