const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 55, right: 55 } });
const output = path.join(__dirname, 'nieuwsbrief-ashwagandha.pdf');
doc.pipe(fs.createWriteStream(output));

const c = { black: '#1a1a1a', dark: '#2d2d2d', accent: '#1A2E1A', light: '#666666', line: '#e0e0e0', green: '#a8c090' };

function h(t) { doc.fontSize(15).font('Helvetica-Bold').fillColor(c.accent).text(t); doc.moveDown(0.3); }
function p(t) { doc.fontSize(10.5).font('Helvetica').fillColor(c.dark).text(t, { lineGap: 3 }); doc.moveDown(0.3); }
function b(t) { doc.fontSize(10.5).font('Helvetica-Bold').fillColor(c.black).text(t, { lineGap: 3 }); doc.moveDown(0.3); }
function sep() { doc.moveDown(0.15); doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor(c.line).lineWidth(1).stroke(); doc.moveDown(0.4); }

// TITLE
doc.fontSize(26).font('Helvetica-Bold').fillColor(c.black).text('Nederland verbiedt ashwagandha.', { align: 'left' });
doc.fontSize(26).font('Helvetica-Bold').fillColor(c.accent).text('En bijna niemand weet waarom.', { align: 'left' });
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica').fillColor(c.light).text('Ministerie van VWS + RIVM risicobeoordeling', { align: 'left' });
sep();

// INTRO
p('Het populairste supplement van de afgelopen jaren wordt verboden in Nederland. Ashwagandha \u2014 het kruid dat miljoenen mensen dagelijks slikken tegen stress, slaapproblemen en vermoeidheid. Weg. Verboden.');
p('Het ministerie van Volksgezondheid (VWS) heeft het besluit genomen. Maar de reden die ze geven is opvallend dun.');
doc.moveDown(0.4);

// WAT IS HET
h('Wat is ashwagandha eigenlijk?');
p('Ashwagandha (Withania somnifera) is een plant die al duizenden jaren wordt gebruikt in de ayurvedische geneeskunde. Het is een zogenaamd adaptogeen \u2014 een stof die je lichaam helpt om beter met stress om te gaan.');
p('De afgelopen jaren is het in het Westen enorm populair geworden. Tegen stress. Tegen slaapproblemen. Voor je schildklier. Voor je hormonen. Je vindt het in elk supplementenschap bij de drogist.');
b('En nu wil Nederland het verbieden.');
doc.moveDown(0.3);

// WAAROM
h('Waarom het verbod?');
p('Het RIVM heeft een risicobeoordeling gedaan. Hun conclusie: ashwagandha kan mogelijk leiden tot leverschade, schildklierproblemen en onderdrukking van je bijniersysteem. Met nadruk op "mogelijk" en "bij gevoelige personen."');
p('De basis? Vier meldingen van leverschade bij het bijwerkingencentrum Lareb. Vier. In vijf jaar tijd. Tussen november 2018 en augustus 2023.');
p('Bij die vier meldingen is niet eens bewezen dat ashwagandha de oorzaak was. Het is onduidelijk of er andere factoren meespeelden \u2014 medicijngebruik, andere supplementen, onderliggende ziektes.');
doc.moveDown(0.3);

// HORMONEN
h('Wat doet het met je hormonen?');
p('Hier wordt het interessant. Want ashwagandha doet wel degelijk iets met je hormonen. Dat is precies waarom mensen het slikken, maar ook waarom het niet voor iedereen geschikt is.');

b('Schildklier');
p('Ashwagandha kan de productie van schildklierhormonen verhogen. Goed als je een trage schildklier hebt. Potentieel gevaarlijk als je schildklier al overactief is.');

b('Bijnier');
p('Het kruid beinvloedt je HPA-as, het systeem dat je stressrespons regelt. Het verlaagt cortisol. Maar bij langdurig gebruik kan het je bijnierfunctie onderdrukken.');

b('Geslachtshormonen');
p('Er zijn aanwijzingen dat ashwagandha testosteron kan verhogen bij mannen. Denemarken verbood het in 2023 mede omdat het bij zwangere vrouwen een miskraam zou kunnen veroorzaken.');

doc.moveDown(0.3);

// TERECHT?
h('Is het verbod terecht?');
p('Dat is de echte vraag. En het antwoord is niet zwart-wit.');

b('Het argument voor het verbod:');
p('De meeste mensen die ashwagandha slikken, doen dat zonder begeleiding. Ze kopen het bij de drogist, lezen erover op Instagram en beginnen. Zonder te weten of ze schildklierproblemen hebben. Zonder te weten hoe het reageert met hun medicatie. Vier meldingen klinkt weinig, maar ondermeldingen bij Lareb zijn enorm \u2014 de werkelijke bijwerkingen liggen veel hoger.');

b('Het argument tegen het verbod:');
p('De supplementenindustrie wijst erop dat er 15 klinische studies zijn uitgevoerd zonder bijwerkingen \u2014 zelfs niet bij 19 keer de standaarddosering. Meer dan 700 mensen reageerden op de publieke consultatie, het overgrote deel tegen het verbod.');

doc.moveDown(0.3);

// WAT WIJ VINDEN
h('Wat wij hiervan vinden');
p('We gaan het niet hebben over of ashwagandha "goed" of "slecht" is. Dat is niet het punt.');
b('Het punt is dit: je lichaam is niet gebouwd voor pillen.');
p('Niet voor synthetische medicijnen, maar ook niet voor geisoleerde plantenextracten in capsules. Ashwagandha als kruid in de ayurvedische geneeskunde is iets heel anders dan een gestandaardiseerd extract in een capsule dat je bij de Kruidvat koopt.');
p('Het echte probleem is niet ashwagandha. Het echte probleem is dat mensen supplementen gebruiken als pleister op een leefstijl die niet werkt. Slaapproblemen? Neem ashwagandha. Stress? Neem ashwagandha. Vermoeidheid? Ashwagandha.');

b('Terwijl de oorzaak vaak simpeler is:');

const oorzaken = [
  'Te weinig slaap',
  'Te veel beeldschermtijd',
  'Te weinig beweging',
  'Te veel ultra-bewerkt voedsel',
  'Te veel troep op je huid'
];
oorzaken.forEach(o => {
  doc.fontSize(11).font('Helvetica').fillColor(c.dark).text('\u2192  ' + o, { lineGap: 3 });
  doc.moveDown(0.1);
});

doc.moveDown(0.4);
b('Fix de basis. Dan heb je geen ashwagandha nodig.');

doc.moveDown(0.5);
sep();

// FEITEN
doc.fontSize(9).font('Helvetica-Bold').fillColor(c.light).text('DE FEITEN OP EEN RIJ');
doc.moveDown(0.3);

const feiten = [
  ['Wie', 'Ministerie van Volksgezondheid, Welzijn en Sport (VWS)'],
  ['Wat', 'Voorgenomen verbod op ashwagandha als voedingssupplement'],
  ['Waarom', 'RIVM-risicobeoordeling: 4 Lareb-meldingen leverschade + zorgen schildklier/bijnier'],
  ['Denemarken', 'Verbood ashwagandha al in 2023'],
  ['Frankrijk/Duitsland', 'Hebben officiele waarschuwingen afgegeven'],
  ['Industrie', '15 klinische studies zonder bijwerkingen, noemt verbod ongefundeerd'],
  ['Publieke reactie', '700+ reacties op consultatie, overwegend tegen het verbod']
];
feiten.forEach(([l, v]) => {
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.light).text(l + ': ', { continued: true });
  doc.font('Helvetica').text(v, { lineGap: 2 });
  doc.moveDown(0.1);
});

doc.end();
console.log('PDF saved to:', output);
