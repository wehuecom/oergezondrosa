#!/usr/bin/env node
/**
 * Amy — Oergezond Customer Support Bot
 * =====================================
 * Draait via Node.js in PowerShell.
 * Starten: node amy.js
 * Stoppen: Ctrl+C
 */

"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// ============================================================
// CONFIGURATIE
// ============================================================

const BASE_DIR = __dirname;

// Secrets laden uit config.js (staat niet in Git)
const cfg = require("./config.js");

// Microsoft OAuth2
const MS_CLIENT_ID = cfg.MS_CLIENT_ID;
const MS_CLIENT_SECRET = cfg.MS_CLIENT_SECRET;
const MS_TENANT_ID = cfg.MS_TENANT_ID;
const MS_REFRESH_TOKEN_FILE = path.join(BASE_DIR, "ms_refresh_token.txt");
const MS_SCOPE = "https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access";

// Airtable
const AIRTABLE_API_KEY = cfg.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = cfg.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = cfg.AIRTABLE_TABLE_ID;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

// Telegram
const TELEGRAM_TOKEN = cfg.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = cfg.TELEGRAM_CHAT_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Claude (Anthropic)
const CLAUDE_API_KEY = cfg.CLAUDE_API_KEY;

// State
const STATE_FILE = path.join(BASE_DIR, "amy_state.json");

// Poll intervals
const EMAIL_POLL_INTERVAL_MS = 1 * 60 * 1000;  // 1 minuut
const TELEGRAM_POLL_INTERVAL_MS = 5 * 1000;     // 5 seconden

// Auto-senders overslaan
const AUTO_SENDER_PATTERNS = [
  "noreply", "no-reply", "donotreply", "do-not-reply",
  "mailer-daemon", "postmaster", "bounce@", "automated",
  "notifications@", "shopify.com", "bol.com", "klarna",
  "newsletter", "sendgrid", "amazonses", "info@", "sales@",
  "marketing@", "promo@", "deals@", "offers@",
];

// Promo/spam subject keywords overslaan
const SPAM_SUBJECT_PATTERNS = [
  "korting", "aanbieding", "sale", "% off", "% korting",
  "gratis verzending", "limited time", "flash sale",
  "exclusief aanbod", "unsubscribe", "uitschrijven",
  "nieuwsbrief", "newsletter",
];

// ============================================================
// KNOWLEDGE BASE
// ============================================================

const SYSTEM_PROMPT = `Je bent Amy, de klantenservice medewerker van Oergezond.

TAAK:
Schrijf een antwoord op de klantemail in het Nederlands.

TOON:
- Direct, rustig, duidelijk, menselijk
- Niet wollig, niet te commercieel, niet overdreven empathisch
- Geen smileys, geen bold tekst, korte alinea's
- Helder antwoord zo vroeg mogelijk in de mail

GEBRUIK DEZE ZINNEN:
✓ "Vervelend om te horen"
✓ "Dank voor je bericht"
✓ "We kijken graag met je mee"
✓ "Dat pakken we graag voor je op"

VERMIJD DEZE ZINNEN:
✗ "Wat ontzettend vervelend"
✗ "Ik hoop dat het goed met je gaat"
✗ "Geen zorgen"
✗ "We begrijpen volledig hoe frustrerend"
✗ Alle marketingtaal

NOOIT:
- Medische claims maken
- Beloftes doen die je niet kunt nakomen
- Beleid improviseren

SLUIT ALTIJD AF MET:
Met gezonde groet,

Amy - Klantenservice
www.oergezond.com | @oergezond | contact@oergezond.com

FAQ KENNIS:
- Oercrème hard/korrelig = normaal bij kou, geen kwaliteitsprobleem. Opwarmen in handpalm.
- 2+1 actie: klant moet zelf 3 potjes in winkelwagen doen. Derde potje = €4,95 via betaalverzoek.
- Droge huid → Regulier | Eczeem/gevoelig → Naturel | Acne → Naturel of Vit E | Baby → Naturel
- Huidreactie: vraag welk product + overgevoeligheden. Roodheid/irritatie → ESCALEER.
- Verzending: €4,95 BENELUX, gratis vanaf €45. Geen verzending buiten BENELUX.
- Shampoo bar: 2-4 weken gewenning normaal.
- Oerbril: alleen avond/nacht, niet autorijden.

ESCALEER (schrijf holding reply) wanneer:
- Ernstige allergische/medische reactie
- Juridische dreiging
- Pers/social media dreiging
- Roodheid of irritatie door product
- Betaalgeschil of fraude`;

// ============================================================
// HTTP HELPER
// ============================================================

function httpRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: options.headers || {},
      timeout: options.timeout || 30000,
    };

    const body = options.body;
    if (body && typeof body === "string") {
      reqOptions.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = lib.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: data,
          json: () => {
            try { return JSON.parse(data); } catch { return null; }
          },
        });
      });
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });

    if (body) req.write(body);
    req.end();
  });
}

function get(url, { headers = {}, params = {} } = {}) {
  const u = new URL(url);
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach(vi => u.searchParams.append(k, vi));
    } else {
      u.searchParams.set(k, v);
    }
  });
  return httpRequest(u.toString(), { method: "GET", headers });
}

function post(url, { headers = {}, json: body, form } = {}) {
  let bodyStr, contentType;
  if (body !== undefined) {
    bodyStr = JSON.stringify(body);
    contentType = "application/json";
  } else if (form) {
    bodyStr = new URLSearchParams(form).toString();
    contentType = "application/x-www-form-urlencoded";
  }
  return httpRequest(url, {
    method: "POST",
    headers: { "Content-Type": contentType, ...headers },
    body: bodyStr,
  });
}

function patch(url, { headers = {}, json: body } = {}) {
  return httpRequest(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

// ============================================================
// STATE MANAGEMENT
// ============================================================

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch {}
  return {
    lastUpdateId: 0,
    msAccessToken: null,
    msTokenExpires: 0,
    pendingCallbacks: {},  // msgId -> callback info
    extraInstructions: "",
  };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

// ============================================================
// MICROSOFT GRAPH — TOKEN
// ============================================================

async function getAccessToken(state) {
  const now = Date.now() / 1000;
  if (state.msAccessToken && state.msTokenExpires > now + 60) {
    return state.msAccessToken;
  }

  if (!fs.existsSync(MS_REFRESH_TOKEN_FILE)) {
    throw new Error(`Geen refresh token gevonden! Zet het in: ${MS_REFRESH_TOKEN_FILE}`);
  }

  const refreshToken = fs.readFileSync(MS_REFRESH_TOKEN_FILE, "utf8").trim();

  const resp = await post(
    `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      form: {
        grant_type: "refresh_token",
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        refresh_token: refreshToken,
        scope: MS_SCOPE,
      },
    }
  );

  if (!resp.ok) {
    throw new Error(`Token refresh mislukt: ${resp.status} ${resp.text.substring(0, 200)}`);
  }

  const data = resp.json();
  state.msAccessToken = data.access_token;
  state.msTokenExpires = now + (data.expires_in || 3600) - 60;

  if (data.refresh_token) {
    fs.writeFileSync(MS_REFRESH_TOKEN_FILE, data.refresh_token, "utf8");
  }

  saveState(state);
  return state.msAccessToken;
}

function msHeaders(state) {
  return {
    Authorization: `Bearer ${state.msAccessToken}`,
    "Content-Type": "application/json",
  };
}

// ============================================================
// EMAIL OPHALEN
// ============================================================

async function getKlantvragenFolderId(state) {
  const resp = await get("https://graph.microsoft.com/v1.0/me/mailFolders?$top=50", {
    headers: msHeaders(state),
  });
  if (resp.ok) {
    const folders = resp.json().value || [];
    const kv = folders.find(f => f.displayName.toLowerCase().includes("klantvragen"));
    return kv ? kv.id : null;
  }
  return null;
}

async function fetchUnreadEmails(state) {
  const headers = msHeaders(state);
  const allEmails = [];

  const folderIds = ["inbox"];
  const kvId = await getKlantvragenFolderId(state);
  if (kvId) folderIds.push(kvId);

  const selectFields = "id,subject,from,body,receivedDateTime,toRecipients,conversationId";

  for (const folderId of folderIds) {
    const url = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages`;
    // Emails van de afgelopen 14 dagen, gelezen of ongelezen
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const resp = await get(url, {
      headers,
      params: {
        "$filter": `receivedDateTime ge ${since}`,
        "$select": selectFields,
        "$top": "50",
        "$orderby": "receivedDateTime desc",
      },
    });
    if (resp.ok) {
      const emails = resp.json().value || [];
      allEmails.push(...emails);
      console.log(`  Map '${folderId.substring(0,20)}...': ${emails.length} ongelezen`);
    } else {
      console.log(`  [WARN] Map '${folderId.substring(0,20)}' ophalen mislukt: ${resp.status}`);
    }
  }

  return allEmails;
}

async function markAsRead(state, emailId) {
  await patch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
    headers: msHeaders(state),
    json: { isRead: true },
  });
}

async function sendReply(state, originalEmailId, toEmail, subject, bodyText) {
  const headers = msHeaders(state);
  const bodyHtml = bodyText.replace(/\n/g, "<br>");
  const replySubject = subject.toLowerCase().startsWith("re:") ? subject : `Re: ${subject}`;

  const resp = await post(
    `https://graph.microsoft.com/v1.0/me/messages/${originalEmailId}/reply`,
    {
      headers,
      json: {
        message: {
          subject: replySubject,
          body: { contentType: "HTML", content: bodyHtml },
          toRecipients: [{ emailAddress: { address: toEmail } }],
        },
        comment: "",
      },
    }
  );

  if (!resp.ok) {
    console.log(`  [WARN] Reply mislukt (${resp.status}), probeer sendMail...`);
    const resp2 = await post("https://graph.microsoft.com/v1.0/me/sendMail", {
      headers,
      json: {
        message: {
          subject: replySubject,
          body: { contentType: "HTML", content: bodyHtml },
          toRecipients: [{ emailAddress: { address: toEmail } }],
        },
        saveToSentItems: true,
      },
    });
    return resp2.ok;
  }

  return true;
}

// ============================================================
// AUTO-SENDER FILTER
// ============================================================

function isAutoSender(email) {
  const addr = (email.from?.emailAddress?.address || "").toLowerCase();
  const name = (email.from?.emailAddress?.name || "").toLowerCase();
  const subject = (email.subject || "").toLowerCase();

  if (AUTO_SENDER_PATTERNS.some(p => addr.includes(p) || name.includes(p))) return true;
  if (SPAM_SUBJECT_PATTERNS.some(p => subject.includes(p))) return true;
  return false;
}

// ============================================================
// AIRTABLE
// ============================================================

const atHeaders = {
  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  "Content-Type": "application/json",
};

async function atFindDuplicate(emailId) {
  // Gebruik eerste 80 chars van email ID als unieke sleutel (opgeslagen in Notities)
  const shortId = emailId.substring(0, 80).replace(/'/g, "");
  const resp = await get(AIRTABLE_URL, {
    headers: atHeaders,
    params: {
      filterByFormula: `SEARCH('${shortId}', {Notities})`,
      maxRecords: "1",
    },
  });
  if (resp.ok) {
    const records = resp.json().records || [];
    return records[0] || null;
  }
  return null;
}

async function atCreate(fields) {
  const resp = await post(AIRTABLE_URL, { headers: atHeaders, json: { fields } });
  if (resp.ok) return resp.json();
  console.log(`  [WARN] Airtable create mislukt: ${resp.status} ${resp.text.substring(0,200)}`);
  return null;
}

async function atUpdate(recordId, fields) {
  const resp = await patch(`${AIRTABLE_URL}/${recordId}`, { headers: atHeaders, json: { fields } });
  return resp.ok;
}

async function atGet(recordId) {
  const resp = await get(`${AIRTABLE_URL}/${recordId}`, { headers: atHeaders });
  return resp.ok ? resp.json() : null;
}

async function atGetOpenEmails(maxRecords = 20) {
  const resp = await get(AIRTABLE_URL, {
    headers: atHeaders,
    params: {
      filterByFormula: "OR({Status}='Nieuw',{Status}='In behandeling')",
      "fields[]": ["Naam", "Afzender", "Onderwerp", "Status", "Datum", "Notities"],
      "sort[0][field]": "Datum",
      "sort[0][direction]": "desc",
      maxRecords: String(maxRecords),
    },
  });
  return resp.ok ? (resp.json().records || []) : [];
}

async function atFindByName(name) {
  const formula = `AND(SEARCH(LOWER('${name}'),LOWER({Naam})),OR({Status}='Nieuw',{Status}='In behandeling'))`;
  const resp = await get(AIRTABLE_URL, {
    headers: atHeaders,
    params: { filterByFormula: formula, maxRecords: "5" },
  });
  return resp.ok ? (resp.json().records || []) : [];
}

// ============================================================
// CLAUDE API
// ============================================================

async function claudeComplete(prompt, systemPrompt = SYSTEM_PROMPT, maxTokens = 1200) {
  const resp = await post("https://api.anthropic.com/v1/messages", {
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    json: {
      model: "claude-opus-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    },
  });

  if (!resp.ok) {
    throw new Error(`Claude API mislukt: ${resp.status} ${resp.text.substring(0,200)}`);
  }

  return resp.json().content[0].text.trim();
}

function parseStructuredResponse(text) {
  const result = { intent: "vraag", sentiment: "neutraal", risk: "low", subject: "", body: text };
  const lines = text.split("\n");
  let inEmail = false;
  const emailLines = [];

  for (const line of lines) {
    if (line.startsWith("INTENT:")) result.intent = line.split(":")[1].trim().toLowerCase();
    else if (line.startsWith("SENTIMENT:")) result.sentiment = line.split(":")[1].trim().toLowerCase();
    else if (line.startsWith("RISK:")) result.risk = line.split(":")[1].trim().toLowerCase();
    else if (line.startsWith("SUBJECT:")) result.subject = line.split(":").slice(1).join(":").trim();
    else if (line.startsWith("EMAIL:")) inEmail = true;
    else if (inEmail) emailLines.push(line);
  }

  if (emailLines.length > 0) {
    result.body = emailLines.join("\n").trim();
  }
  return result;
}

async function classifyAndGenerate(fromName, fromEmail, subject, body, extraInstructions = "") {
  const extra = extraInstructions ? `\nExtra instructies van het team: ${extraInstructions}` : "";

  const prompt = `Email van: ${fromName} (${fromEmail})
Onderwerp: ${subject}
Bericht:
${body.substring(0, 2500)}
${extra}

Geef je output EXACT in dit formaat (geen extra tekst erbuiten):

INTENT: <klacht|bestelling|vraag|retour|betaling|overig>
SENTIMENT: <positief|neutraal|negatief|urgent>
RISK: <low|medium|high>
SUBJECT: Re: ${subject}
EMAIL:
<volledige emailtekst hier>`;

  const response = await claudeComplete(prompt);
  return parseStructuredResponse(response);
}

async function reviseConcept(original, feedback, fromName, subject, extra = "") {
  const extraStr = extra ? `\nExtra instructies: ${extra}` : "";
  const prompt = `Pas het onderstaande emailconcept aan op basis van de feedback.
Behoud de Oergezond toon (direct, rustig, menselijk, geen marketingtaal).

Oorspronkelijk concept:
${original}

Feedback:
${feedback}

Klant: ${fromName}
Onderwerp: ${subject}${extraStr}

Geef ALLEEN de herziene emailtekst terug (zonder INTENT/RISK/etc. headers).`;

  return claudeComplete(prompt);
}

// ============================================================
// TELEGRAM
// ============================================================

async function tgSend(text, replyMarkup = null, parseMode = "HTML") {
  const payload = { chat_id: TELEGRAM_CHAT_ID, text, parse_mode: parseMode };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  const resp = await post(`${TELEGRAM_API}/sendMessage`, { json: payload });
  if (resp.ok) return resp.json().result || {};
  console.log(`  [WARN] Telegram send mislukt: ${resp.status} ${resp.text.substring(0,150)}`);
  return null;
}

async function tgEdit(messageId, text, replyMarkup = null) {
  const payload = { chat_id: TELEGRAM_CHAT_ID, message_id: messageId, text, parse_mode: "HTML" };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  await post(`${TELEGRAM_API}/editMessageText`, { json: payload });
}

async function tgAnswerCallback(callbackQueryId, text = "") {
  await post(`${TELEGRAM_API}/answerCallbackQuery`, {
    json: { callback_query_id: callbackQueryId, text },
  });
}

async function tgGetUpdates(offset = 0) {
  const resp = await get(`${TELEGRAM_API}/getUpdates`, {
    params: { offset: String(offset), timeout: "3", limit: "100" },
  });
  return resp.ok ? (resp.json().result || []) : [];
}

function conceptKeyboard(recordId) {
  // Telegram callback_data max = 64 bytes. Airtable record IDs zijn ~17 chars — ruim genoeg.
  return {
    inline_keyboard: [[
      { text: "✅ Verstuur", callback_data: `send|${recordId}` },
      { text: "✏️ Aanpassen", callback_data: `edit|${recordId}` },
    ]],
  };
}

async function sendConceptToTelegram(fromName, fromEmail, subject, risk, conceptBody, recordId) {
  const emoji = risk === "high" ? "🔴" : "🟡";
  const riskLabel = { low: "Laag", medium: "Medium", high: "HOOG" }[risk] || risk;
  const preview = conceptBody.length > 700 ? conceptBody.substring(0, 700) + "..." : conceptBody;

  const text = `${emoji} <b>Nieuwe email — ${fromName}</b>\n📧 ${fromEmail}\n📌 ${subject}\n⚠️ Risico: ${riskLabel}\n\n<b>Concept antwoord:</b>\n${preview}`;
  const result = await tgSend(text, conceptKeyboard(recordId));
  return result ? result.message_id : null;
}

// ============================================================
// EMAIL VERWERKINGSPIPELINE
// ============================================================

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function processEmail(state, email) {
  const emailId = email.id;
  const subject = email.subject || "(geen onderwerp)";
  const fromEmail = email.from?.emailAddress?.address || "";
  const fromName = email.from?.emailAddress?.name || fromEmail.split("@")[0];
  const received = email.receivedDateTime || "";
  const rawBody = email.body?.content || "";
  const bodyText = stripHtml(rawBody).substring(0, 3000);

  const logTag = `[${fromName.substring(0,15)}] [${subject.substring(0,25)}]`;

  // 1. Auto-sender filter
  if (isAutoSender(email)) {
    console.log(`  SKIP ${logTag} — auto-sender`);
    await markAsRead(state, emailId);
    return;
  }

  // 2. Duplicate check
  const existing = await atFindDuplicate(emailId);
  if (existing) {
    console.log(`  SKIP ${logTag} — al in Airtable (${existing.fields?.Status})`);
    return;
  }

  console.log(`  VERWERKEN ${logTag}`);

  // 3. Classificeer + concept genereren
  const extra = state.extraInstructions || "";
  const result = await classifyAndGenerate(fromName, fromEmail, subject, bodyText, extra);
  const { intent, risk, body: conceptBody } = result;

  // Zet intent om naar Airtable Categorie keuze
  const categorieMap = {
    klacht: "complaint", bestelling: "order_status", vraag: "product_question",
    retour: "return_request", betaling: "other", overig: "other",
  };
  const categorie = categorieMap[intent] || "other";

  // 4. Log naar Airtable
  const record = await atCreate({
    "Naam": fromName,
    "Afzender": fromEmail,
    "Onderwerp": subject,
    "Originele Email": bodyText.substring(0, 5000),
    "Status": "In behandeling",
    "Urgentie": risk === "high" ? "?? Hoog" : "?? Normaal",
    "Categorie": categorie,
    "Concept": conceptBody,
    "Datum": received,
    "Notities": emailId,  // Email ID voor duplicate check
  });

  if (!record) {
    console.log(`  ERROR: Airtable aanmaken mislukt voor ${emailId}`);
    return;
  }

  const recordId = record.id;

  // 5. Markeer als gelezen
  await markAsRead(state, emailId);

  // 6. Stuur naar Telegram
  const msgId = await sendConceptToTelegram(
    fromName, fromEmail, subject, risk, conceptBody, recordId
  );

  if (msgId) {
    // emailId hoeft niet in pendingCallbacks — wordt opgehaald uit Airtable via recordId
    state.pendingCallbacks[String(msgId)] = {
      recordId, emailId, fromEmail, fromName, subject, concept: conceptBody,
    };
    saveState(state);
    console.log(`  OK — Telegram bericht verstuurd (msg_id: ${msgId})`);
  } else {
    console.log(`  WARN — Email verwerkt maar Telegram mislukt`);
  }
}

// ============================================================
// TELEGRAM CALLBACK HANDLERS
// ============================================================

async function getCallbackInfo(state, msgId, recordId) {
  const info = state.pendingCallbacks[String(msgId)];
  if (info) return info;

  // Fallback via Airtable
  const rec = await atGet(recordId);
  if (rec) {
    const f = rec.fields || {};
    return {
      recordId,
      emailId: f["Notities"] || "",
      fromEmail: f["Afzender"] || "",
      fromName: f["Naam"] || "",
      subject: f["Onderwerp"] || "",
      concept: f["Concept"] || "",
    };
  }
  return null;
}

async function handleSend(state, cq, recordId) {
  const msgId = cq.message.message_id;
  const info = await getCallbackInfo(state, msgId, recordId);

  if (!info) {
    await tgAnswerCallback(cq.id, "❌ Emaildata niet gevonden");
    return;
  }

  // email_id zit in info.emailId (opgehaald uit Airtable Notities veld)
  const emailId = info.emailId;
  console.log(`  VERSTUREN naar ${info.fromEmail}...`);
  const ok = await sendReply(state, emailId, info.fromEmail, info.subject, info.concept);

  if (ok) {
    await atUpdate(recordId, { Status: "Afgehandeld" });
    await tgEdit(msgId, `✅ <b>Verstuurd naar ${info.fromName}</b>\n📌 ${info.subject}`);
    await tgAnswerCallback(cq.id, "✅ Email verstuurd!");
    delete state.pendingCallbacks[String(msgId)];
    saveState(state);
    console.log(`  OK — Email verstuurd naar ${info.fromEmail}`);
  } else {
    await tgAnswerCallback(cq.id, "❌ Versturen mislukt!");
    console.log(`  ERROR — Versturen mislukt`);
  }
}

async function handleEdit(state, cq, recordId) {
  const msgId = cq.message.message_id;
  await tgAnswerCallback(cq.id, "Geef je feedback...");

  const result = await tgSend(
    "✏️ <b>Wat moet er aangepast worden?</b>\n\nReply op dit bericht met je feedback.",
    { force_reply: true, selective: false }
  );

  if (result) {
    const feedbackMsgId = result.message_id;
    state.pendingCallbacks[`feedback_${feedbackMsgId}`] = {
      recordId, originalMsgId: msgId,
    };
    saveState(state);
  }
}

async function handleFeedbackReply(state, message) {
  const replyTo = message.reply_to_message;
  if (!replyTo) return false;

  const replyToId = replyTo.message_id;
  const feedbackText = (message.text || "").trim();
  const cbKey = `feedback_${replyToId}`;
  const info = state.pendingCallbacks[cbKey];
  if (!info) return false;

  const { recordId, emailId, originalMsgId } = info;

  const rec = await atGet(recordId);
  if (!rec) {
    await tgSend("❌ Kon emaildata niet ophalen.");
    return true;
  }

  const fields = rec.fields || {};
  const originalConcept = fields["Concept"] || "";
  const fromName = fields["Naam"] || "";
  const fromEmail = fields["Afzender"] || "";
  const subject = fields["Onderwerp"] || "";

  await tgSend("⏳ Amy herziet het concept...");

  const extra = state.extraInstructions || "";
  const newConcept = await reviseConcept(originalConcept, feedbackText, fromName, subject, extra);

  await atUpdate(recordId, { Concept: newConcept, Status: "In behandeling" });

  const preview = newConcept.length > 700 ? newConcept.substring(0, 700) + "..." : newConcept;
  const text = `✏️ <b>Herzien concept — ${fromName}</b>\n📌 ${subject}\n\n${preview}`;
  const result = await tgSend(text, conceptKeyboard(recordId));

  if (result) {
    const newMsgId = result.message_id;
    state.pendingCallbacks[String(newMsgId)] = {
      recordId, emailId, fromEmail, fromName, subject, concept: newConcept,
    };
  }

  // Opruimen
  delete state.pendingCallbacks[cbKey];
  if (originalMsgId) delete state.pendingCallbacks[String(originalMsgId)];
  saveState(state);
  return true;
}

// ============================================================
// TELEGRAM COMMANDO-INTERFACE
// ============================================================

async function handleCommand(state, text) {
  const lower = text.toLowerCase().trim();

  // Openstaande emails
  if (["welke emails", "open emails", "staan open", "openstaand"].some(kw => lower.includes(kw))) {
    await cmdListOpen();
    return true;
  }

  // Beantwoord email van [naam]
  const replyMatch = lower.match(/beantwoord(?:\s+email)?\s+van\s+(.+)/);
  if (replyMatch) {
    const name = replyMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase());
    await cmdReplyTo(state, name);
    return true;
  }

  // Instructie: [tekst]
  const instrMatch = text.match(/^instructie[:\s]+(.+)/is);
  if (instrMatch) {
    await cmdInstruction(state, instrMatch[1].trim());
    return true;
  }

  return false;
}

async function cmdListOpen() {
  const records = await atGetOpenEmails();
  if (!records.length) {
    await tgSend("✅ Geen openstaande emails.");
    return;
  }
  const lines = [`📋 <b>${records.length} openstaande email(s):</b>\n`];
  records.forEach((rec, i) => {
    const f = rec.fields || {};
    const naam = f["Naam"] || "?";
    const onderwerp = (f["Onderwerp"] || "?").substring(0, 50);
    const status = f["Status"] || "?";
    const datum = (f["Datum"] || "").substring(0, 10);
    lines.push(`${i + 1}. <b>${naam}</b> — ${onderwerp}\n   ${status} | ${datum}`);
  });
  await tgSend(lines.join("\n"));
}

async function cmdReplyTo(state, name) {
  const records = await atFindByName(name);
  if (!records.length) {
    await tgSend(`❌ Geen open email gevonden van '${name}'.`);
    return;
  }

  const rec = records[0];
  const recordId = rec.id;
  const f = rec.fields || {};
  const fromName = f["Naam"] || name;
  const fromEmail = f["Afzender"] || "";
  const subject = f["Onderwerp"] || "";
  const body = f["Originele Email"] || "";
  const emailId = f["Notities"] || "";
  let concept = f["Concept"] || "";

  if (!concept) {
    await tgSend(`⏳ Concept genereren voor ${fromName}...`);
    const extra = state.extraInstructions || "";
    const result = await classifyAndGenerate(fromName, fromEmail, subject, body, extra);
    concept = result.body;
    await atUpdate(recordId, { Concept: concept, Status: "In behandeling" });
  }

  const preview = concept.length > 700 ? concept.substring(0, 700) + "..." : concept;
  const text = `🟡 <b>Concept voor ${fromName}</b>\n📌 ${subject}\n\n${preview}`;
  const result = await tgSend(text, conceptKeyboard(recordId));

  if (result) {
    state.pendingCallbacks[String(result.message_id)] = {
      recordId, emailId, fromEmail, fromName, subject, concept,
    };
    saveState(state);
  }
}

async function cmdInstruction(state, instruction) {
  state.extraInstructions = instruction;
  saveState(state);
  await tgSend(
    `✅ <b>Instructie opgeslagen:</b>\n${instruction}\n\nAmy past dit toe op alle nieuwe en herziene concepten.`
  );
}

// ============================================================
// TELEGRAM UPDATES VERWERKEN
// ============================================================

async function processTelegramUpdates(state) {
  const updates = await tgGetUpdates(state.lastUpdateId + 1);

  for (const update of updates) {
    state.lastUpdateId = Math.max(state.lastUpdateId, update.update_id);

    if (update.callback_query) {
      const cq = update.callback_query;
      const parts = (cq.data || "").split("|");
      const action = parts[0];
      const recordId = parts[1] || "";
      // email_id wordt niet meer in callback_data opgeslagen (te lang voor Telegram)
      // — wordt opgehaald uit Airtable via record_id

      if (action === "send") await handleSend(state, cq, recordId);
      else if (action === "edit") await handleEdit(state, cq, recordId);
      else await tgAnswerCallback(cq.id);

    } else if (update.message) {
      const msg = update.message;
      const text = (msg.text || "").trim();
      if (!text) continue;

      if (msg.reply_to_message) {
        const handled = await handleFeedbackReply(state, msg);
        if (handled) continue;
      }

      await handleCommand(state, text);
    }
  }

  if (updates.length > 0) saveState(state);
}

// ============================================================
// MAIN LOOP
// ============================================================

async function main() {
  console.log("=".repeat(60));
  console.log("  Amy — Oergezond Customer Support Bot");
  console.log("=".repeat(60));
  console.log(`  Gestart: ${new Date().toLocaleString("nl-NL")}`);
  console.log(`  Email polling: elke minuut`);
  console.log(`  Telegram polling: elke 5 seconden`);
  console.log("  Ctrl+C om te stoppen.\n");

  const state = loadState();

  // Ophalen access token bij start
  try {
    await getAccessToken(state);
    console.log("  Microsoft token OK\n");
  } catch (e) {
    console.error(`  [ERROR] Token refresh mislukt: ${e.message}`);
    process.exit(1);
  }

  let lastEmailCheck = 0;
  let telegramErrorCount = 0;

  const loop = async () => {
    const now = Date.now();

    // Email check
    if (now - lastEmailCheck >= EMAIL_POLL_INTERVAL_MS) {
      const ts = new Date().toLocaleTimeString("nl-NL");
      console.log(`\n[${ts}] Email check...`);
      try {
        await getAccessToken(state);
        const emails = await fetchUnreadEmails(state);
        console.log(`  ${emails.length} ongelezen email(s)`);
        for (const email of emails) {
          await processEmail(state, email);
        }
      } catch (e) {
        console.log(`  [ERROR] Email check: ${e.message}`);
      }
      lastEmailCheck = now;
    }

    // Telegram polling
    try {
      await processTelegramUpdates(state);
      telegramErrorCount = 0;
    } catch (e) {
      telegramErrorCount++;
      console.log(`  [ERROR] Telegram poll (${telegramErrorCount}x): ${e.message}`);
      if (telegramErrorCount > 10) {
        console.log("  [WARN] Te veel Telegram fouten — wacht 60 seconden");
        await new Promise(r => setTimeout(r, 60000));
        telegramErrorCount = 0;
      }
    }

    setTimeout(loop, TELEGRAM_POLL_INTERVAL_MS);
  };

  loop();
}

process.on("SIGINT", async () => {
  console.log("\n\nAmy gestopt.");
  process.exit(0);
});

main().catch(e => {
  console.error("[FATAL]", e.message);
  process.exit(1);
});
