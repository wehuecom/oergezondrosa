const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margins: { top: 45, bottom: 45, left: 55, right: 55 } });
const output = path.join(__dirname, 'financiele-analyse-oergezond.pdf');
doc.pipe(fs.createWriteStream(output));

const c = { black: '#1a1a1a', dark: '#2d2d2d', accent: '#1A2E1A', light: '#666', line: '#d0d0d0', red: '#c0392b', green: '#27ae60' };
const ml = 55, mr = 540, pw = mr - ml;

function h1(t) { checkPage(45); doc.fontSize(13).font('Helvetica-Bold').fillColor(c.accent).text(t, ml, doc.y, { width: pw }); doc.moveDown(0.1); doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor(c.line).lineWidth(0.5).stroke(); doc.moveDown(0.2); }
function h2(t) { checkPage(25); doc.fontSize(10).font('Helvetica-Bold').fillColor(c.accent).text(t, ml, doc.y, { width: pw }); doc.moveDown(0.1); }
function p(t) { doc.fontSize(9).font('Helvetica').fillColor(c.dark).text(t, ml, doc.y, { lineGap: 2.5, width: pw }); doc.moveDown(0.12); }
function b(t) { doc.fontSize(9).font('Helvetica-Bold').fillColor(c.black).text(t, ml, doc.y, { lineGap: 2.5, width: pw }); doc.moveDown(0.1); }
function gap(n) { doc.moveDown(n || 0.2); }
function checkPage(needed) { if (doc.y + (needed || 30) > 770) doc.addPage(); }

function tableRow(cols, widths, header) {
  checkPage(16);
  const y = doc.y;
  const font = header ? 'Helvetica-Bold' : 'Helvetica';
  const color = header ? c.accent : c.dark;
  const bg = header ? '#eef0eb' : null;
  if (bg) doc.rect(ml, y - 1, pw, 14).fill(bg);
  let x = ml;
  cols.forEach((col, i) => {
    const align = i > 0 && !header ? 'right' : 'left';
    doc.fontSize(8).font(font).fillColor(color).text(col, x + 3, y + 2, { width: widths[i] - 6, align });
    x += widths[i];
  });
  doc.y = y + 14;
  doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#e0e0e0').lineWidth(0.2).stroke();
  doc.moveDown(0.02);
}

function simpleRow(label, value, bold) {
  checkPage(14);
  const y = doc.y;
  doc.fontSize(8.5).font(bold ? 'Helvetica-Bold' : 'Helvetica-Bold').fillColor(c.dark).text(label, ml + 4, y, { width: 200 });
  doc.fontSize(8.5).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? c.accent : c.dark).text(value, ml + 210, y, { width: pw - 214 });
  doc.y = y + 13;
  doc.moveTo(ml, doc.y).lineTo(mr, doc.y).strokeColor('#eee').lineWidth(0.2).stroke();
  doc.moveDown(0.03);
}

// ===== COVER =====
doc.moveDown(4);
doc.fontSize(32).font('Helvetica-Bold').fillColor(c.accent).text('Financiele Analyse', { align: 'center' });
doc.moveDown(0.2);
doc.fontSize(16).font('Helvetica').fillColor(c.dark).text('Oergezond', { align: 'center' });
doc.moveDown(1.5);
doc.fontSize(11).font('Helvetica').fillColor(c.light).text('Periode: 1 april - 5 juni 2026 (~66 dagen)', { align: 'center' });
doc.text('Op basis van Wise-afschriften, Shopify-omzet en inventaris', { align: 'center' });
doc.moveDown(3);
doc.fontSize(9).font('Helvetica').fillColor(c.light).text('Vertrouwelijk — Alleen voor intern gebruik', { align: 'center' });

// ===== PAGE 2: TOTAALOVERZICHT =====
doc.addPage();
h1('1. Totaaloverzicht');
simpleRow('Shopify-omzet (incl. BTW)', '\u20AC94.500');
simpleRow('Shopify-omzet (excl. BTW 21%)', '\u20AC78.099');
simpleRow('Aantal orders', '1.857');
simpleRow('Gemiddelde orderwaarde (incl. BTW)', '\u20AC50,89');
simpleRow('Omzet per dag', '\u20AC1.432/dag');
simpleRow('Orders per dag', '~28/dag');
simpleRow('Investering ontvangen (apart)', '\u20AC20.000');
gap(0.3);

h1('2. Wise-rekening: Geld IN');
const w3 = [250, 120, 115];
tableRow(['Bron', 'USD', 'EUR'], w3, true);
tableRow(['Shopify uitbetalingen', '$29.882', '\u20AC25.400'], w3);
tableRow(['Investering (Slash/Primalsa)', '$2.000', '\u20AC1.700'], w3);
tableRow(['Alibaba refund', '$3.000', '\u20AC2.550'], w3);
tableRow(['Overig', '$234', '\u20AC199'], w3);
tableRow(['TOTAAL IN', '$35.116', '\u20AC29.849'], w3, true);
gap(0.3);

h1('3. Wise-rekening: Geld UIT');
const w4 = [200, 50, 100, 135];
tableRow(['Categorie', 'Tx', 'USD', 'EUR'], w4, true);
tableRow(['Meta Ads (Facebook)', '66', '$6.634', '\u20AC5.649'], w4);
tableRow(['Google Ads', '4', '$986', '\u20AC838'], w4);
tableRow(['NH Fulfillment', '1', '$5.082', '\u20AC4.303'], w4);
tableRow(['Fulfillment (Winning + Jojoli)', '14', '$2.550', '\u20AC2.167'], w4);
tableRow(['Alibaba (productinkoop)', '5', '$3.101', '\u20AC2.636'], w4);
tableRow(['Shopify fees', '4', '$573', '\u20AC487'], w4);
tableRow(['Transfers naar WeHu', '2', '$2.100', '\u20AC1.788'], w4);
tableRow(['Administratie (HFD)', '1', '$140', '\u20AC118'], w4);
tableRow(['Klaviyo', '2', '$170', '\u20AC145'], w4);
tableRow(['Tools & Software', '22', '$646', '\u20AC549'], w4);
tableRow(['Persoonlijk/Overig', '10', '$852', '\u20AC724'], w4);
tableRow(['Omwisselingen USD>EUR', '12', '$12.404', 'naar EUR-rek'], w4);
tableRow(['TOTAAL UIT', '147', '$36.253', ''], w4, true);
gap(0.15);
b('Wise eindsaldo: $0,00');
gap(0.3);

// ===== KOSTEN ALS % VAN OMZET =====
h1('4. Kostenverdeling (% van omzet)');
const w5 = [250, 120, 115];
tableRow(['Kostenpost', 'Bedrag (EUR)', '% van omzet'], w5, true);
tableRow(['BTW (21%)', '\u20AC16.401', '17,4%'], w5);
tableRow(['Meta Ads', '\u20AC5.649', '6,0%'], w5);
tableRow(['Google Ads', '\u20AC838', '0,9%'], w5);
tableRow(['NH Fulfillment', '\u20AC4.303', '4,6%'], w5);
tableRow(['Verzending (Winning + Jojoli)', '\u20AC2.167', '2,3%'], w5);
tableRow(['Shopify fees', '\u20AC487', '0,5%'], w5);
tableRow(['Klaviyo', '\u20AC145', '0,2%'], w5);
tableRow(['Tools & Software', '\u20AC549', '0,6%'], w5);
tableRow(['Nieuwe voorraad', '\u20AC4.950', '5,2%'], w5);
tableRow(['Overig', '\u20AC842', '0,9%'], w5);
tableRow(['TOTAAL KOSTEN', '~\u20AC36.331', '~38%'], w5, true);
gap(0.3);

// ===== WINSTGEVENDHEID =====
h1('5. Winstgevendheid');
simpleRow('Netto omzet (excl. BTW)', '\u20AC78.099');
simpleRow('Minus: COGS (geschat ~\u20AC5,50/order)', '-\u20AC10.214');
simpleRow('Bruto winst', '\u20AC67.885', true);
simpleRow('Minus: Ads (Meta + Google)', '-\u20AC6.487');
simpleRow('Minus: Fulfillment + verzending', '-\u20AC6.470');
simpleRow('Minus: Shopify + Klaviyo + tools', '-\u20AC1.181');
simpleRow('Minus: Administratie + overig', '-\u20AC842');
simpleRow('Geschatte netto winst', '\u20AC52.905', true);
simpleRow('Netto winstmarge', '~56%', true);
gap(0.3);

// ===== PRODUCTMARGES =====
h1('6. Productmarges');
const w6 = [140, 65, 55, 55, 50, 50];
tableRow(['Product', 'Verkoop', 'Excl BTW', 'Inkoop', 'Marge', '%'], w6, true);
tableRow(['Oercreme Naturel', '\u20AC28,95', '\u20AC23,93', '\u20AC5,55', '\u20AC18,38', '77%'], w6);
tableRow(['Oercreme Van.Sin.', '\u20AC28,95', '\u20AC23,93', '\u20AC3,44', '\u20AC20,49', '86%'], w6);
tableRow(['Oercreme Vit.E', '\u20AC32,50', '\u20AC26,86', '\u20AC4,44', '\u20AC22,42', '83%'], w6);
tableRow(['Haarolie', '\u20AC29,95', '\u20AC24,75', '\u20AC3,80', '\u20AC20,95', '85%'], w6);
tableRow(['Shampoo Bar', '\u20AC17,95', '\u20AC14,83', '\u20AC3,30', '\u20AC11,53', '78%'], w6);
tableRow(['Conditioner Bar', '\u20AC17,95', '\u20AC14,83', '\u20AC3,30', '\u20AC11,53', '78%'], w6);
tableRow(['Lippenbalsem', '\u20AC7,95', '\u20AC6,57', '\u20AC1,75', '\u20AC4,82', '73%'], w6);
tableRow(['Luierzalf', '\u20AC22,95', '\u20AC18,97', '\u20AC5,00', '\u20AC13,97', '74%'], w6);
tableRow(['Deodorant', '\u20AC18,95', '\u20AC15,66', '\u20AC7,03', '\u20AC8,63', '55%'], w6);
tableRow(['Oerbril', '\u20AC39,95', '\u20AC33,02', '\u20AC8,10', '\u20AC24,92', '75%'], w6);
tableRow(['Oerboullion', '\u20AC4,95', '\u20AC4,09', '\u20AC2,66', '\u20AC1,43', '35%'], w6);
tableRow(['Oerbars Pouch', '\u20AC4,95', '\u20AC4,09', '\u20AC0,57', '\u20AC3,52', '86%'], w6);
tableRow(['Detox Starter', '\u20AC49,95', '\u20AC41,28', '\u20AC15,00', '\u20AC26,28', '64%'], w6);
tableRow(['Afwasmiddel', '\u20AC8,95', '\u20AC7,40', '\u20AC4,43', '\u20AC2,97', '40%'], w6);
gap(0.15);
p('Beste marges: Oercreme varianten (83-86%), Haarolie (85%), Oerbars (86%). Slechtste marges: Oerboullion (35%), Afwasmiddel (40%), Deodorant (55%).');
gap(0.3);

// ===== AD PERFORMANCE =====
h1('7. Ad Performance');
simpleRow('Meta Ads spend', '\u20AC5.649 (~\u20AC161/dag)');
simpleRow('Google Ads spend', '\u20AC838 (~\u20AC24/dag)');
simpleRow('Totaal ads', '\u20AC6.487 (~\u20AC185/dag)');
simpleRow('Blended ROAS', '~14,6x', true);
gap(0.15);
p('Zelfs als slechts 50% van de omzet van ads komt, is de ROAS ~7x. Dit is ver boven gemiddeld en duidt op winstgevende campagnes.');
gap(0.3);

// ===== VOORRAAD =====
h1('8. Voorraad');
const w7 = [170, 70, 90, 155];
tableRow(['Product', 'Stuks', 'Inkoopwaarde', 'Verkoopwaarde'], w7, true);
tableRow(['Oercreme Vit.E (Kamille)', '586', '\u20AC2.602', '\u20AC19.045'], w7);
tableRow(['Haarolie', '497', '\u20AC1.889', '\u20AC14.885'], w7);
tableRow(['Lippenbalsem (alle)', '520', '\u20AC910', '\u20AC4.134'], w7);
tableRow(['Oercreme Naturel', '244', '\u20AC1.354', '\u20AC7.064'], w7);
tableRow(['Deodorant', '240', '\u20AC1.687', '\u20AC4.548'], w7);
tableRow(['Oerbril', '214', '\u20AC1.733', '\u20AC8.549'], w7);
tableRow(['Oerbars Pouch', '319', '\u20AC182', '\u20AC1.579'], w7);
tableRow(['Oercreme Van.Sin.', '170', '\u20AC585', '\u20AC4.922'], w7);
tableRow(['Oerboullion (alle)', '190', '\u20AC505', '\u20AC941'], w7);
tableRow(['Overig', 'divers', '~\u20AC2.452', '~\u20AC10.354'], w7);
tableRow(['TOTAAL', '', '~\u20AC13.899', '~\u20AC76.021'], w7, true);
gap(0.15);
p('Let op: Conditioner Bar bijna op (13 stuks), Shampoo Bar op 0. Nieuwe voorraad (500+500) is besteld.');
gap(0.3);

// ===== TOOLS =====
h1('9. Tools & Software (~\u20AC340/maand)');
const w8 = [200, 140, 145];
tableRow(['Tool', 'Kosten/maand', 'Functie'], w8, true);
tableRow(['CartDNA', '~$120', 'Shopify app'], w8);
tableRow(['Klaviyo', '~$85', 'Email marketing'], w8);
tableRow(['Manychat', '$65', 'Chat automatie'], w8);
tableRow(['Gorgias', '$60', 'Klantenservice'], w8);
tableRow(['Wetracked', '$149 (eenmalig?)', 'Ad tracking'], w8);
tableRow(['Airtable', '$24', 'Database'], w8);
tableRow(['Apify', '$29', 'Scraping'], w8);
tableRow(['Anthropic/OpenAI', '~$32', 'AI tools'], w8);
tableRow(['Overig (Fal, Eleven, etc)', '~$50', 'AI video/voice'], w8);
gap(0.3);

// ===== WAAROM GROEIT REKENING NIET =====
h1('10. Waarom groeit de bankrekening niet?');
const w9 = [300, 185];
tableRow(['Waar zit het geld?', 'Bedrag'], w9, true);
tableRow(['BTW (af te dragen)', '~\u20AC16.400'], w9);
tableRow(['Voorraad op de plank (inkoopwaarde)', '~\u20AC13.900'], w9);
tableRow(['Ads uitgegeven (Meta + Google)', '\u20AC6.487'], w9);
tableRow(['Fulfillment + verzending', '\u20AC6.470'], w9);
tableRow(['Nieuwe voorraad gekocht', '\u20AC4.950'], w9);
tableRow(['Geplande supplementenlijn', '\u20AC8.000'], w9);
tableRow(['Tools + administratie + overig', '\u20AC1.536'], w9);
tableRow(['TOTAAL "bezet" geld', '~\u20AC57.743'], w9, true);
gap(0.15);
p('Van ~\u20AC78.100 netto omzet + \u20AC20.000 investering = ~\u20AC98.100 inkomsten is ~\u20AC58K al uitgegeven of vastgelegd. Dit is normaal voor een groeiend bedrijf.');
gap(0.3);

// ===== CONCLUSIE =====
h1('11. Conclusie & Advies');
b('Het bedrijf is financieel gezond.');
gap(0.1);
p('56% netto winstmarge, 70% bruto marge, ROAS 7-14x, 28 orders per dag. De bankrekening groeit niet omdat het geld geherinvesteerd wordt in voorraad, ads en groei. Dit is normaal en gewenst.');
gap(0.2);
b('Aanbevelingen:');
const advies = [
  'Zet BTW apart op een aparte spaarrekening (\u20AC16.400 is niet van jullie)',
  'Focus ads op hoge-marge producten: Oercreme, Haarolie, Shampoo/Conditioner Bar',
  'Oerboullion (35%) en Afwasmiddel (40%) hebben lage marges - overweeg prijsverhoging',
  'Deodorant inkoopprijs (\u20AC7,03) is hoog - probeer te onderhandelen',
  'Check of alle tools nog nodig zijn (CartDNA, Higgsfield, Wetracked)',
  'Wise-rekening staat op $0 - zorg voor buffer'
];
advies.forEach(a => {
  doc.fontSize(9).font('Helvetica').fillColor(c.dark).text('\u2022  ' + a, ml + 8, doc.y, { width: pw - 16, lineGap: 2 });
  doc.moveDown(0.08);
});
gap(0.4);

doc.fontSize(8).font('Helvetica-Oblique').fillColor(c.light).text('Vertrouwelijk document. Analyse gebaseerd op Wise USD-afschriften, Shopify-omzetdata, inventaris-export en opgegeven inkoopprijzen. Voor een compleet beeld is ook het EUR-rekeningoverzicht nodig.', ml, doc.y, { width: pw, align: 'center' });

doc.end();
console.log('PDF saved to:', output);
