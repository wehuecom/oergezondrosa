const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 60, bottom: 60, left: 55, right: 55 }
});

const output = path.join(__dirname, 'nieuwsbrief-ultrabewerkt-voedsel.pdf');
doc.pipe(fs.createWriteStream(output));

const c = {
  black: '#1a1a1a',
  dark: '#2d2d2d',
  accent: '#4a7c59',
  light: '#666666',
  line: '#e0e0e0'
};

function heading(text) {
  doc.fontSize(16).font('Helvetica-Bold').fillColor(c.accent).text(text);
  doc.moveDown(0.4);
}

function body(text, opts = {}) {
  doc.fontSize(11).font('Helvetica').fillColor(c.dark).text(text, { lineGap: 4, ...opts });
  doc.moveDown(0.4);
}

function bold(text, opts = {}) {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(c.black).text(text, { lineGap: 4, ...opts });
  doc.moveDown(0.4);
}

function separator() {
  doc.moveDown(0.3);
  doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor(c.line).lineWidth(1).stroke();
  doc.moveDown(0.8);
}

// --- TITLE ---
doc.fontSize(26).font('Helvetica-Bold').fillColor(c.black)
   .text('De helft van wat je eet is geen eten.', { align: 'left' });
doc.fontSize(26).font('Helvetica-Bold').fillColor(c.accent)
   .text('Het is een industrieel product.', { align: 'left' });

doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica').fillColor(c.light)
   .text('Florida Atlantic University + European Society of Cardiology \u00B7 2026', { align: 'left' });

separator();

// --- INTRO ---
body('Twee grote onderzoeken in 2026 bevestigen wat steeds moeilijker te negeren is: ultra-bewerkt voedsel maakt je ziek. De cijfers zijn bikkelhard.');

doc.moveDown(0.4);

// --- DE CIJFERS ---
heading('De cijfers');

body('Een groot Amerikaans onderzoek onder bijna 5.000 volwassenen laat zien: mensen die het meest ultra-bewerkt voedsel eten, hebben 47% meer kans op een hartaanval of beroerte. Zelfs nadat ze corrigeerden voor leeftijd, geslacht, roken en inkomen.');

bold('47 procent. Bijna de helft meer risico. Door wat je eet.');

body('In mei 2026 publiceerde de European Society of Cardiology een rapport dat alle beschikbare onderzoeken samenbracht. Hun conclusie:');

const stats = [
  ['19%', 'hoger risico op hartziekten'],
  ['13%', 'hoger risico op hartritmestoornissen'],
  ['65%', 'hoger risico op overlijden aan hart- en vaatziekten']
];

stats.forEach(([pct, desc]) => {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(c.accent)
     .text(pct + ' ', { continued: true });
  doc.font('Helvetica').fillColor(c.dark).text(desc, { lineGap: 3 });
  doc.moveDown(0.15);
});

doc.moveDown(0.3);
body('Ze roepen artsen op om patienten actief te vragen hoeveel ultra-bewerkt voedsel ze eten. Dat is hoe serieus dit is.');

doc.moveDown(0.4);

// --- WAT IS HET ---
heading('Wat is ultra-bewerkt voedsel eigenlijk?');

body('Het zijn industrieel gemodificeerde producten. Volgestopt met toegevoegde vetten, suikers, zetmelen, zouten en chemische toevoegingen zoals emulgatoren. Van frisdrank tot verpakte snacks, van bewerkt vlees tot kant-en-klaarmaaltijden.');

body('Het probleem: deze producten zijn gestript van natuurlijke voedingsstoffen. Wat overblijft is een product dat je lichaam niet herkent als echt voedsel.');

bold('Ultra-bewerkt voedsel maakt 60% uit van wat volwassenen eten. Bij kinderen is dat 70%.');

body('Meer dan de helft van wat je eet is technisch gezien geen eten meer.');

doc.moveDown(0.4);

// --- WAAROM GEVAARLIJK ---
heading('Waarom dit zo gevaarlijk is');

body('Je lichaam is gebouwd om echt voedsel te verwerken. Vlees, vis, groenten, fruit, noten, eieren. Voedsel dat je overgrootouders zouden herkennen.');

body('Ultra-bewerkt voedsel bestaat pas een paar decennia. Je lichaam heeft geen idee wat het ermee moet. Het resultaat: chronische ontsteking, insulineresistentie, beschadigde bloedvaten en een immuunsysteem dat continu in de overdrive staat.');

doc.addPage();

// Quote box
const quoteY = doc.y;
doc.rect(55, quoteY, 485, 65).fill('#f0f5f1');
doc.fontSize(10.5).font('Helvetica-Oblique').fillColor(c.dark)
   .text('"Dit gaat niet alleen om individuele keuzes \u2014 het gaat om het creeren van een omgeving waarin de gezonde optie de makkelijke optie is."', 70, quoteY + 12, { width: 455, lineGap: 3 });
doc.fontSize(9.5).font('Helvetica').fillColor(c.light)
   .text('\u2014 Prof. Charles Hennekens, Florida Atlantic University', 70, quoteY + 46, { width: 455 });

doc.y = quoteY + 75;
doc.moveDown(0.5);

body('Maar tot die omgeving er is, moet je het zelf doen.');

doc.moveDown(0.4);

// --- WAT KUN JE DOEN ---
heading('Wat kun je doen?');

body('De oplossing is niet ingewikkeld. Het is alleen niet makkelijk in een wereld die je continu ultra-bewerkte troep aanbiedt.');

doc.moveDown(0.2);

const tips = [
  ['Lees etiketten.', 'Als er ingredienten in staan die je niet kunt uitspreken, leg het terug.'],
  ['Kook zelf.', 'Echt voedsel hoeft niet ingewikkeld te zijn. Vlees, groenten, goede vetten. Klaar.'],
  ['Vervang stap voor stap.', 'Begin met een maaltijd per dag die 100% echt voedsel is.'],
  ['Kijk ook naar je huid.', 'Dezelfde industriele troep die in je voedsel zit, zit ook in de meeste cosmetica.']
];

tips.forEach(([title, desc]) => {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(c.black)
     .text(title + ' ', { continued: true });
  doc.font('Helvetica').fillColor(c.dark).text(desc, { lineGap: 3 });
  doc.moveDown(0.25);
});

doc.moveDown(0.5);
separator();

// --- BRONVERMELDING ---
doc.fontSize(9).font('Helvetica-Bold').fillColor(c.light).text('DE FEITEN OP EEN RIJ');
doc.moveDown(0.4);

doc.fontSize(9.5).font('Helvetica-Bold').fillColor(c.accent).text('Amerikaans onderzoek (februari 2026)');
doc.moveDown(0.15);
const refs1 = [
  ['Uitgevoerd door', 'Florida Atlantic University'],
  ['Gepubliceerd in', 'The American Journal of Medicine'],
  ['Steekproef', '4.787 volwassenen (NHANES data 2021-2023)'],
  ['Conclusie', '47% hoger risico op hartaanval/beroerte bij hoogste UPF-inname']
];
refs1.forEach(([label, value]) => {
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.light).text(label + ': ', { continued: true });
  doc.font('Helvetica').text(value, { lineGap: 2 });
  doc.moveDown(0.1);
});

doc.moveDown(0.3);
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(c.accent).text('Europees rapport (mei 2026)');
doc.moveDown(0.15);
const refs2 = [
  ['Uitgevoerd door', 'European Society of Cardiology'],
  ['Gepubliceerd in', 'European Heart Journal'],
  ['Type', 'Klinische consensusverklaring op basis van alle beschikbare onderzoeken'],
  ['Conclusie', 'Tot 65% hoger risico op cardiovasculair overlijden bij hoogste UPF-inname']
];
refs2.forEach(([label, value]) => {
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.light).text(label + ': ', { continued: true });
  doc.font('Helvetica').text(value, { lineGap: 2 });
  doc.moveDown(0.1);
});

doc.end();
console.log('PDF saved to:', output);
