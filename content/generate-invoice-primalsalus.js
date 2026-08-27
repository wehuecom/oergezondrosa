const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ---- Invoice data ----
const inv = {
  number: 'WEHU-2026-001',
  date: '14 July 2026',
  due: '13 August 2026',
  currency: '€',
  from: {
    name: 'WEHU ECOM - FZCO',
    lines: [
      'Dubai Digital Park, Building A1',
      'Dubai Silicon Oasis',
      'Dubai, United Arab Emirates',
      'Email: contact@oergezond.com',
    ],
  },
  to: {
    name: 'Primalsalus LLC',
    lines: [
      '30 N Gould St, Ste R',
      'Sheridan, WY 82801',
      'United States of America',
    ],
  },
  items: [
    { desc: 'Bonus marketing services', qty: 1, price: 2500.00 },
  ],
  vatRate: 0, // export of services from UAE — out of scope
  vatNote: 'VAT 0% — Out of scope (export of services outside the UAE, Art. 45 UAE VAT Law).',
  bank: [
    'Bank name:      [invullen]',
    'Account name:   WEHU ECOM - FZCO',
    'IBAN / Acc no.: [invullen]',
    'SWIFT / BIC:    [invullen]',
  ],
  terms: 'Payment due within 30 days of invoice date.',
};

const c = { black: '#1a1a1a', dark: '#2d2d2d', accent: '#1A2E1A', light: '#666', line: '#d0d0d0', soft: '#eef0eb' };
const ml = 60, mr = 535, pw = mr - ml;

const doc = new PDFDocument({ size: 'A4', margins: { top: 55, bottom: 55, left: ml, right: 60 } });
doc.pipe(fs.createWriteStream(path.join(__dirname, '..', 'invoices', 'invoice-primalsalus-WEHU-2026-001.pdf')));

const money = (n) => inv.currency + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---- Header ----
doc.fontSize(26).font('Helvetica-Bold').fillColor(c.accent).text('INVOICE', ml, 55);
doc.fontSize(9).font('Helvetica').fillColor(c.light);
doc.text('Invoice no.', mr - 200, 58, { width: 110, align: 'right' });
doc.text('Invoice date', mr - 200, 72, { width: 110, align: 'right' });
doc.text('Due date', mr - 200, 86, { width: 110, align: 'right' });
doc.font('Helvetica-Bold').fillColor(c.dark);
doc.text(inv.number, mr - 85, 58, { width: 85, align: 'right' });
doc.text(inv.date, mr - 85, 72, { width: 85, align: 'right' });
doc.text(inv.due, mr - 85, 86, { width: 85, align: 'right' });

doc.moveTo(ml, 115).lineTo(mr, 115).strokeColor(c.line).lineWidth(1).stroke();

// ---- From / To ----
let y = 135;
doc.fontSize(8.5).font('Helvetica-Bold').fillColor(c.accent).text('FROM', ml, y);
doc.text('BILL TO', ml + pw / 2, y);
y += 15;
doc.fontSize(11).font('Helvetica-Bold').fillColor(c.black).text(inv.from.name, ml, y, { width: pw / 2 - 20 });
doc.text(inv.to.name, ml + pw / 2, y, { width: pw / 2 - 10 });
y += 16;
doc.fontSize(9).font('Helvetica').fillColor(c.dark);
const fromStart = y, toStart = y;
inv.from.lines.forEach((l, i) => doc.text(l, ml, fromStart + i * 13, { width: pw / 2 - 20 }));
inv.to.lines.forEach((l, i) => doc.text(l, ml + pw / 2, toStart + i * 13, { width: pw / 2 - 10 }));

y = Math.max(fromStart + inv.from.lines.length * 13, toStart + inv.to.lines.length * 13) + 25;

// ---- Table header ----
doc.rect(ml, y, pw, 22).fill(c.soft);
doc.fontSize(9).font('Helvetica-Bold').fillColor(c.accent);
doc.text('Description', ml + 10, y + 7, { width: 260 });
doc.text('Qty', ml + 285, y + 7, { width: 40, align: 'right' });
doc.text('Unit price', ml + 330, y + 7, { width: 65, align: 'right' });
doc.text('Amount', mr - 90, y + 7, { width: 80, align: 'right' });
y += 22;

// ---- Table rows ----
let subtotal = 0;
doc.fontSize(9.5).font('Helvetica').fillColor(c.dark);
inv.items.forEach((it) => {
  const amount = it.qty * it.price;
  subtotal += amount;
  doc.text(it.desc, ml + 10, y + 9, { width: 260 });
  doc.text(String(it.qty), ml + 285, y + 9, { width: 40, align: 'right' });
  doc.text(money(it.price), ml + 330, y + 9, { width: 65, align: 'right' });
  doc.text(money(amount), mr - 90, y + 9, { width: 80, align: 'right' });
  y += 28;
  doc.moveTo(ml, y).lineTo(mr, y).strokeColor('#eee').lineWidth(0.5).stroke();
});

// ---- Totals ----
const vat = subtotal * inv.vatRate;
const total = subtotal + vat;
y += 12;
const labelX = mr - 250, valX = mr - 90;
doc.fontSize(9.5).font('Helvetica').fillColor(c.dark);
doc.text('Subtotal', labelX, y, { width: 150, align: 'right' });
doc.text(money(subtotal), valX, y, { width: 80, align: 'right' });
y += 16;
doc.text('VAT (0%)', labelX, y, { width: 150, align: 'right' });
doc.text(money(vat), valX, y, { width: 80, align: 'right' });
y += 8;
doc.moveTo(labelX, y + 8).lineTo(mr, y + 8).strokeColor(c.line).lineWidth(0.5).stroke();
y += 16;
doc.rect(labelX - 10, y - 4, (mr - labelX) + 10, 26).fill(c.accent);
doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
doc.text('TOTAL', labelX, y + 3, { width: 150, align: 'right' });
doc.text(money(total), valX, y + 3, { width: 80, align: 'right' });
y += 45;

// ---- VAT note ----
doc.fontSize(8.5).font('Helvetica-Oblique').fillColor(c.light).text(inv.vatNote, ml, y, { width: pw });
y += 30;

// ---- Payment details ----
doc.fontSize(9).font('Helvetica-Bold').fillColor(c.accent).text('PAYMENT DETAILS', ml, y);
y += 15;
doc.fontSize(9).font('Helvetica').fillColor(c.dark);
inv.bank.forEach((l) => { doc.text(l, ml, y, { width: pw }); y += 13; });
y += 10;
doc.font('Helvetica-Bold').fillColor(c.dark).text(inv.terms, ml, y, { width: pw });

// ---- Footer ----
doc.fontSize(8).font('Helvetica').fillColor(c.light)
  .text('WEHU ECOM - FZCO  |  Dubai Silicon Oasis, UAE  |  contact@oergezond.com', ml, 790, { width: pw, align: 'center' });

doc.end();
console.log('Invoice saved');
