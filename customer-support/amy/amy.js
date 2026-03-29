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
const LOCK_FILE  = path.join(BASE_DIR, "amy.lock");

// Voorkom meerdere instanties tegelijk
(function acquireLock() {
  try {
    // Controleer of er al een lopend proces is
    if (fs.existsSync(LOCK_FILE)) {
      const pid = parseInt(fs.readFileSync(LOCK_FILE, "utf8").trim());
      // Check of dat proces nog bestaat
      try { process.kill(pid, 0); } catch {
        // Proces bestaat niet meer — verwijder stale lock
        fs.unlinkSync(LOCK_FILE);
      }
      if (fs.existsSync(LOCK_FILE)) {
        console.error(`[STOP] Amy draait al (PID ${pid}). Stop die instantie eerst.`);
        process.exit(1);
      }
    }
    fs.writeFileSync(LOCK_FILE, String(process.pid), "utf8");
    // Verwijder lockfile bij afsluiten
    const cleanup = () => { try { fs.unlinkSync(LOCK_FILE); } catch {} };
    process.on("exit", cleanup);
    process.on("SIGINT", () => { cleanup(); process.exit(0); });
    process.on("SIGTERM", () => { cleanup(); process.exit(0); });
  } catch (e) {
    console.error("[WARN] Lock aanmaken mislukt:", e.message);
  }
})();

// Poll intervals
const EMAIL_POLL_INTERVAL_MS = 1 * 60 * 1000;  // 1 minuut
const TELEGRAM_POLL_INTERVAL_MS = 5 * 1000;     // 5 seconden

// Auto-senders overslaan
const AUTO_SENDER_PATTERNS = [
  // Systeem-afzenders
  "noreply", "no-reply", "donotreply", "do-not-reply",
  "mailer-daemon", "postmaster", "bounce@", "automated",
  "notifications@", "sendgrid", "amazonses",
  // Bekende niet-klant domeinen
  "shopify.com", "bol.com", "klarna", "aliexpress", "amazon.",
  "airtable.com", "klaviyo.com", "hubspot.com", "channeldock.com",
  "faire.com", "wonnda.com", "gitguardian.io", "skool.com",
  "creativeos", "wispr", "wisp.ai", "freepik", "linktree",
  "openai.com", "anthropic.com", "github.com", "microsoft.com",
  "oergezond.com", "oergezondnl@",
  "wetracked", "1clickagency", "tapflow",
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

const SYSTEM_PROMPT = `Je bent de operationele AI-assistent voor Oergezond en ondersteunt foutloos bij:
1. email klantenservice
2. email marketing
3. opvolging van klantvragen
4. ordervragen
5. trackingvragen
6. conceptmails opstellen
7. interne escalaties
8. 2+1 bundel-vragen
9. productvragen
10. Telegram follow-up concepten
11. Trello escalaties bij verzendproblemen

Je werkt alsof je een senior customer support + retention + email marketing medewerker bent die Oergezond volledig begrijpt. Je maakt geen aannames als het gaat om orderdetails, trackingstatus, productkeuze of bundels. Je bent extreem precies, klantgericht, duidelijk en praktisch. Je schrijft altijd professioneel, vriendelijk, duidelijk en menselijk Nederlands. Geen wollige taal. Geen overdreven marketingtaal in supportmails. Geen emoji's. Geen vetgedrukte tekst in klantmails.

==================================================
BEDRIJFSCONTEXT OERGEZOND
==================================================

Oergezond is een merk rondom oervoeding, natuurlijke verzorging en een ancestral lifestyle. De merkpositionering is:
- natuurlijk, onbewerkt, functioneel, eerlijk, helder, praktisch
- modern probleem oplossen met natuurlijke oplossingen

Tone of voice: direct, warm, professioneel, behulpzaam, concreet, vertrouwenwekkend, nooit vaag.

==================================================
PRODUCTEN + INGREDIËNTEN
==================================================

1. OERCRÈME (60 ml)
Varianten:
- Naturel: Tallow, Simmondsia Chinensis Seed Oil
- Vanille/Sinaasappel: Tallow, Simmondsia Chinensis Seed Oil, Vanilla Planifolia Fruit Oil, Citrus Sinensis Peel Oil, Citrus Aurantium Amara Leaf/Twig Oil
- Vanilla Spice: Tallow, Simmondsia Chinensis Seed Oil, Vanilla Planifolia Fruit Oil, Citrus Sinensis Peel Oil, Styrax Tonkinensis Resin Oil
Veilige claims: helpt de huid voeden, ondersteunt droge/gevoelige huid, ondersteunt huidbarrière, maakt huid zacht en soepel, korte en natuurlijke ingrediëntenlijst.

2. OERCRÈME VITAMINE E (60 ml)
Ingrediënten: Grassfed Tallow, Vitamin E oil, Simmondsia Chinensis Seed Oil, Vanilla Planifolia Fruit Oil, Citrus Sinensis Peel Oil, Citrus Aurantium Amara Leaf/Twig Oil
Veilige claims: voedt de huid, ondersteunt huidbarrière, helpt huid soepel houden, vitamine E staat bekend als verzorgend ingrediënt.

3. SHAMPOO BAR
Ingrediënten: Sodium cocoyl isethionate, Shea butter, Moroccan lava clay, Jojoba oil, Aloe vera powder, Hydrolyzed rice protein, Moringa powder, Rosemary, Lemon.
Veilige claims: reinigt mild, ondersteunt verzorging haar en hoofdhuid, bevat voedende ingrediënten. Gewenningsperiode 2-4 weken normaal.

4. CONDITIONER BAR
Ingrediënten: Behentrimoniummethosulfaat, Cetearyl Alcohol, Cetyl Alcohol, Shea butter, Coconut oil, Avocado, Orange, Lavender.
Veilige claims: helpt haar verzorgen, maakt haar zachter, helpt bij doorkambaarheid.

5. HAAROLIE (100 ml)
Ingrediënten: Jojoba seed oil, Rozemarijn, Kamille, Brandnetel, Calendula, Vitamine E.
Allergenen: Geraniol, Citronellol, Limonene, Linalool.
Veilige claims: ondersteunt verzorging van hoofdhuid en haar, helpt haar gevoed aanvoelen.
Niet doen: geen claim dat het gegarandeerd haargroei herstelt, geen medische claim bij haaruitval.

6. OERBRIL
Functie: blauwlichtfilterbril, blokkeert >99,9% blauw licht tot ca. 560 nm, bedoeld voor avond/nacht, niet geschikt voor overdag of autorijden.
Veilige claims: ondersteunt vermindering blootstelling blauw licht in de avond, kan helpen bij avondrust, hulpmiddel binnen slaaproutine.
Niet doen: niet claimen dat het slapeloosheid geneest of slaap gegarandeerd verbetert.

NOOIT: medische claims, diagnoses, speculeren, beloftes die je niet kunt nakomen.
Bij vragen over producten bij medische huidaandoening: voorzichtig reageren — uitleggen dat veel klanten het gebruiken bij gevoelige/droge huid, maar dat wij geen medisch advies geven, en bij twijfel overleg met behandelaar verstandig is.

==================================================
TRACKING / VERTRAGING – BESLISBOOM
==================================================

Vertraging max. ~2 dagen: geruststellen, aangeven dat wij op tijd hebben verzonden, vertraging bij DHL benoemen, klant vragen nog 2 dagen geduld.
Vertraging paar dagen langer: pakket nog bij DHL, nog enkele dagen afwachten, dan opnieuw contact opnemen.
Vertraging >5 dagen: interne escalatie. Trello-regel aanmaken met:
  Bestelnummer: [nummer] | Naam: [naam] | Tracking: [trackingnummer] | Probleem: pakket langer dan 5 dagen vertraagd
Belangrijk: benoem altijd dat wij op tijd hebben verstuurd als dat klopt. Vertraging ligt bij DHL, niet bij Oergezond. Blijf feitelijk.

==================================================
2+1 ACTIE / BUNDEL
==================================================

De 2+1 actie: klant bestelt via bundelpagina en kiest daadwerkelijk 3 potjes. Bundelprijs geldt voor 3 geselecteerde potjes. Alle 3 moeten echt worden aangeklikt anders staat de bundel niet volledig in de bestelling.
Stappenplan voor klant: 1) open bundel/actiepagina, 2) kies eerste pot, 3) kies tweede pot, 4) kies derde pot, 5) controleer of alle 3 geselecteerd zijn, 6) voeg toe aan winkelmand.

==================================================
STIJLREGELS KLANTMAILS
==================================================

- Houd mails zo kort mogelijk: beantwoord de vraag direct in 2-4 zinnen. Geen onnodige inleiding, geen herhaling van de vraag, geen opvulling. Alleen wat de klant nodig heeft.
- Vriendelijk, duidelijk, geen smileys, geen vetgedrukte tekst, professioneel, nooit defensief.
- Gebruik: "Vervelend om te horen" / "Dank voor je bericht" / "We kijken graag met je mee" / "Dat pakken we graag voor je op" / "Wij hebben je bestelling op tijd verzonden" / "Vertraging lijkt bij DHL te zitten"
- Vermijd: agressieve toon, speculatie, medische beloftes, vage antwoorden, te veel marketing in supportmail.
- Sluit altijd af met: Met gezonde groet,\n\nAmy - Klantenservice\nwww.oergezond.com | @oergezond | contact@oergezond.com

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
    // Alleen emails van na de laatste check (of laatste uur bij eerste start)
    const fallback = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const since = state.lastEmailSince || fallback;
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

  // Dedupliceer op conversationId — zelfde email kan in inbox én Klantvragen zitten met ander ID
  const seen = new Set();
  return allEmails.filter(e => {
    const key = e.conversationId || e.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function markAsRead(state, emailId) {
  await patch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
    headers: msHeaders(state),
    json: { isRead: true },
  });
}

const AMY_CAT_GREEN  = "Amy: Afgehandeld";
const AMY_CAT_ORANGE = "Amy: Follow-up";

async function ensureOutlookCategories(state) {
  const headers = msHeaders(state);
  const resp = await get("https://graph.microsoft.com/v1.0/me/outlook/masterCategories", { headers });
  if (!resp.ok) return;
  const existing = (resp.json().value || []).map(c => c.displayName);

  if (!existing.includes(AMY_CAT_GREEN)) {
    await post("https://graph.microsoft.com/v1.0/me/outlook/masterCategories", {
      headers, json: { displayName: AMY_CAT_GREEN, color: "preset4" }, // DarkGreen
    });
  }
  if (!existing.includes(AMY_CAT_ORANGE)) {
    await post("https://graph.microsoft.com/v1.0/me/outlook/masterCategories", {
      headers, json: { displayName: AMY_CAT_ORANGE, color: "preset1" }, // Orange
    });
  }
}

async function markEmailCategory(state, emailId, color) {
  if (!emailId || emailId.length < 50) return; // geen geldig email ID
  const categoryName = color === "green" ? AMY_CAT_GREEN : AMY_CAT_ORANGE;
  await patch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
    headers: msHeaders(state),
    json: { categories: [categoryName] },
  });
}

async function sendReply(state, originalEmailId, toEmail, subject, bodyText) {
  const headers = msHeaders(state);
  const bodyHtml = bodyText.replace(/\n/g, "<br>");

  // Stap 1: maak een reply-draft (Microsoft bewaart threading automatisch)
  const createResp = await post(
    `https://graph.microsoft.com/v1.0/me/messages/${originalEmailId}/createReply`,
    { headers, json: {} }
  );

  if (!createResp.ok) {
    console.log(`  [WARN] createReply mislukt (${createResp.status}): ${createResp.text}`);
    return false;
  }

  const draft = createResp.json();
  const draftId = draft?.id;
  if (!draftId) {
    console.log(`  [WARN] createReply gaf geen draft ID terug`);
    return false;
  }

  // Stap 2: zet de HTML body in de draft (geen subject override — threading blijft intact)
  await patch(`https://graph.microsoft.com/v1.0/me/messages/${draftId}`, {
    headers,
    json: { body: { contentType: "HTML", content: bodyHtml } },
  });

  // Stap 3: verstuur de draft (precies één keer)
  const sendResp = await post(
    `https://graph.microsoft.com/v1.0/me/messages/${draftId}/send`,
    { headers, json: {} }
  );

  if (!sendResp.ok) {
    console.log(`  [WARN] Draft versturen mislukt (${sendResp.status}): ${sendResp.text}`);
    return false;
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

async function atIsKnownSender(fromEmail) {
  // Alleen echte klanten tellen: we hebben ze eerder een antwoord gestuurd (Afgehandeld)
  const safe = fromEmail.replace(/'/g, "\\'");
  const resp = await get(AIRTABLE_URL, {
    headers: atHeaders,
    params: {
      filterByFormula: `AND({Afzender} = '${safe}', {Status} = 'Afgehandeld')`,
      maxRecords: "1",
      "fields[]": ["Afzender"],
    },
  });
  if (resp.ok) return (resp.json().records || []).length > 0;
  return false;
}

async function atFindDuplicate(emailId) {
  // Sla een korte hash op als unieke sleutel zodat exacte match werkt
  const key = emailIdToKey(emailId);
  const resp = await get(AIRTABLE_URL, {
    headers: atHeaders,
    params: {
      filterByFormula: `{Notities} = '${key}'`,
      maxRecords: "1",
    },
  });
  if (resp.ok) {
    const records = resp.json().records || [];
    return records[0] || null;
  }
  return null;
}

function emailIdToKey(emailId) {
  // Sla alleen de laatste 40 chars op — uniek genoeg, geen false positives
  return emailId.slice(-40).replace(/'/g, "");
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
  const result = {
    intent: "vraag", risk: "low", subject: "", body: text,
    categorie: "", samenvatting: "", actie: "", followup: "nee", trello: "nee",
  };
  const lines = text.split("\n");
  let inEmail = false;
  const emailLines = [];

  for (const line of lines) {
    if (line.startsWith("INTENT:")) result.intent = line.split(":")[1].trim().toLowerCase();
    else if (line.startsWith("RISK:")) result.risk = line.split(":")[1].trim().toLowerCase();
    else if (line.startsWith("CATEGORIE:")) result.categorie = line.split(":").slice(1).join(":").trim();
    else if (line.startsWith("SAMENVATTING:")) result.samenvatting = line.split(":").slice(1).join(":").trim();
    else if (line.startsWith("ACTIE:")) result.actie = line.split(":").slice(1).join(":").trim();
    else if (line.startsWith("FOLLOWUP:")) result.followup = line.split(":")[1].trim().toLowerCase();
    else if (line.startsWith("TRELLO:")) result.trello = line.split(":").slice(1).join(":").trim();
    else if (line.startsWith("SUBJECT:")) result.subject = line.split(":").slice(1).join(":").trim();
    else if (line.startsWith("EMAIL:")) inEmail = true;
    else if (inEmail) emailLines.push(line);
  }

  if (emailLines.length > 0) {
    result.body = emailLines.join("\n").trim();
  }
  return result;
}

async function isCustomerEmail(fromEmail, subject, body) {
  // Snelle check: is dit een echte klantvraag? Gebruik haiku voor snelheid + kosten.
  const prompt = `Is dit een echte klantvraag/klantmail voor een webshop die huidverzorging verkoopt?
Beantwoord ALLEEN met JA of NEE.

Van: ${fromEmail}
Onderwerp: ${subject}
Bericht (eerste 300 tekens): ${body.substring(0, 300)}`;

  try {
    const resp = await post("https://api.anthropic.com/v1/messages", {
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      json: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 5,
        messages: [{ role: "user", content: prompt }],
      },
    });
    const answer = resp.json()?.content?.[0]?.text?.trim().toUpperCase() || "NEE";
    return answer.startsWith("JA");
  } catch {
    return true; // Bij twijfel: wel verwerken
  }
}

async function classifyAndGenerate(fromName, fromEmail, subject, body, extraInstructions = "") {
  const extra = extraInstructions ? `\nExtra instructies van het team: ${extraInstructions}` : "";

  const prompt = `Email van: ${fromName} (${fromEmail})
Onderwerp: ${subject}
Bericht:
${body.substring(0, 2500)}
${extra}

Geef je output EXACT in dit formaat (geen extra tekst erbuiten):

INTENT: <klacht|bestelling|vraag|retour|tracking|bundel|productvraag|escalatie|overig>
RISK: <low|medium|high>
CATEGORIE: <korte categorieomschrijving in het Nederlands>
SAMENVATTING: <1-2 zinnen wat de klant vraagt of meldt>
ACTIE: <welke stap je nu neemt>
FOLLOWUP: <ja|nee>
TRELLO: <nee|ja — Bestelnummer: [nr] | Naam: [naam] | Tracking: [nr] | Probleem: [beschrijving]>
SUBJECT: Re: ${subject}
EMAIL:
<volledige emailtekst hier>`;

  const response = await claudeComplete(prompt, SYSTEM_PROMPT, 2000);
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

async function tgEdit(messageId, text, replyMarkup = null, removeKeyboard = false) {
  const payload = { chat_id: TELEGRAM_CHAT_ID, message_id: messageId, text, parse_mode: "HTML" };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  else if (removeKeyboard) payload.reply_markup = { inline_keyboard: [] };
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
    inline_keyboard: [
      [{ text: "✅ Verstuur", callback_data: `send|${recordId}` }],
      [{ text: "✏️ Aanpassen", callback_data: `edit|${recordId}` }],
    ],
  };
}

async function sendConceptToTelegram(fromName, fromEmail, subject, risk, conceptBody, recordId, meta = {}) {
  const emoji = risk === "high" ? "🔴" : risk === "medium" ? "🟠" : "🟡";
  const riskLabel = { low: "Laag", medium: "Medium", high: "HOOG" }[risk] || risk;

  const categorieStr = meta.categorie ? `\n📂 ${meta.categorie}` : "";
  const samenvattingStr = meta.samenvatting ? `\n💬 ${meta.samenvatting}` : "";
  const actieStr = meta.actie ? `\n✏️ Actie: ${meta.actie}` : "";
  const followupStr = meta.followup === "ja" ? "\n🔔 Follow-up nodig" : "";
  const trelloStr = meta.trello && meta.trello !== "nee" ? `\n📋 Trello: ${meta.trello}` : "";

  const header = `${emoji} <b>Nieuwe email — ${fromName}</b>\n📧 ${fromEmail}\n📌 ${subject}\n⚠️ Risico: ${riskLabel}\n⏳ Nog versturen${categorieStr}${samenvattingStr}${actieStr}${followupStr}${trelloStr}`;

  // Telegram max = 4096 tekens per bericht. Splits header + concept als het te lang wordt.
  const TG_MAX = 4096;
  const combined = `${header}\n\n<b>Concept antwoord:</b>\n${conceptBody}`;

  let result;
  if (combined.length <= TG_MAX) {
    result = await tgSend(combined, conceptKeyboard(recordId));
  } else {
    // Stuur header eerst, dan concept met knoppen in tweede bericht
    await tgSend(header);
    const chunks = [];
    for (let i = 0; i < conceptBody.length; i += TG_MAX) {
      chunks.push(conceptBody.substring(i, i + TG_MAX));
    }
    for (let i = 0; i < chunks.length - 1; i++) {
      await tgSend(chunks[i]);
    }
    result = await tgSend(chunks[chunks.length - 1], conceptKeyboard(recordId));
  }

  return result ? result.message_id : null;
}

// ============================================================
// EMAIL VERWERKINGSPIPELINE
// ============================================================

// Herkent een Shopify contactformulier en haalt naam, email en bericht eruit.
// Retourneert null als het geen contactformulier is.
function parseContactForm(bodyText) {
  const lower = bodyText.toLowerCase();
  if (!lower.includes("contactformulier") && !lower.includes("contact form")) return null;

  // E-mail adres — "E-mail:", "E-mailadres:", "Email:"
  const emailMatch = bodyText.match(/e-?mail(?:adres)?\s*:\s*([^\s\n,]+)/i);
  if (!emailMatch) return null;

  // Naam — probeer "Voornaam" + "Achternaam" eerst, dan "Naam:"
  let customerName = "";
  const voornaamMatch = bodyText.match(/voornaam\s*:\s*([^\n]+)/i);
  const achternaamMatch = bodyText.match(/achternaam\s*:\s*([^\n]+)/i);
  if (voornaamMatch || achternaamMatch) {
    customerName = [(voornaamMatch?.[1] || ""), (achternaamMatch?.[1] || "")].join(" ").trim();
  } else {
    const naamMatch = bodyText.match(/naam\s*:\s*([^\n]+)/i) || bodyText.match(/name\s*:\s*([^\n]+)/i);
    customerName = naamMatch?.[1]?.trim() || "";
  }

  // Bericht — meerdere mogelijke veldnamen
  const msgMatch = bodyText.match(/laat hier een berichtje achter\s*:\s*([\s\S]+)/i) ||
                   bodyText.match(/bericht\s*:\s*([\s\S]+)/i) ||
                   bodyText.match(/message\s*:\s*([\s\S]+)/i) ||
                   bodyText.match(/opmerkingen?\s*:\s*([\s\S]+)/i);

  return {
    customerEmail: emailMatch[1].trim(),
    customerName,
    message: msgMatch ? msgMatch[1].trim().substring(0, 2000) : bodyText,
  };
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
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
  const received = email.receivedDateTime || "";
  const rawBody = email.body?.content || "";
  const fullBodyText = stripHtml(rawBody);

  // 0. Shopify contactformulier — vóór auto-sender filter
  const senderAddress = email.from?.emailAddress?.address || "";
  const isShopifyMailer = senderAddress.toLowerCase().includes("mailer@shopify.com") ||
                          senderAddress.toLowerCase().includes("shopify.com");
  const contactForm = isShopifyMailer ? parseContactForm(fullBodyText) : null;
  const isContactForm = isShopifyMailer; // Altijd contactformulier als het van Shopify komt

  let fromEmail = senderAddress;
  let fromName = email.from?.emailAddress?.name || fromEmail.split("@")[0];
  let bodyText = fullBodyText.substring(0, 3000);

  if (isContactForm && contactForm) {
    fromEmail = contactForm.customerEmail;
    fromName = contactForm.customerName || fromEmail.split("@")[0];
    bodyText = contactForm.message;
    console.log(`  Contactformulier van ${fromName} (${fromEmail})`);
  } else if (isContactForm) {
    // Shopify mail maar parsing mislukt — log de body voor diagnose
    console.log(`  Contactformulier van Shopify — body parsing mislukt, body: ${fullBodyText.substring(0, 200)}`);
  }

  const logTag = `[${fromName.substring(0,15)}] [${subject.substring(0,25)}]`;

  // 1. Harde auto-sender filter — contactformulieren worden overgeslagen
  if (!isContactForm && isAutoSender(email)) {
    console.log(`  SKIP ${logTag} — auto-sender`);
    await markAsRead(state, emailId);
    return;
  }

  // 2. Duplicate check (zelfde email ID al verwerkt?)
  const existing = await atFindDuplicate(emailId);
  if (existing) {
    console.log(`  SKIP ${logTag} — al in Airtable (${existing.fields?.Status})`);
    return;
  }

  // 3. Bekende klant? (heeft eerder een antwoord ontvangen) → sla Claude pre-check over
  const knownSender = await atIsKnownSender(fromEmail);

  // 4. Claude pre-check: is dit een echte klantvraag? (alleen voor onbekende afzenders)
  if (!knownSender) {
    const isCustomer = await isCustomerEmail(fromEmail, subject, bodyText);
    if (!isCustomer) {
      console.log(`  SKIP ${logTag} — geen klantvraag (Claude)`);
      await markAsRead(state, emailId);
      return;
    }
  }

  console.log(`  VERWERKEN ${logTag}`);

  // 3. Classificeer + concept genereren
  const extra = state.extraInstructions || "";
  const result = await classifyAndGenerate(fromName, fromEmail, subject, bodyText, extra);
  const { intent, risk, body: conceptBody, categorie: categorieLabel, samenvatting, actie, followup, trello } = result;

  // Zet intent om naar Airtable Categorie keuze
  const categorieMap = {
    klacht: "complaint", bestelling: "order_status", vraag: "product_question",
    retour: "return_request", tracking: "order_status", bundel: "product_question",
    productvraag: "product_question", escalatie: "complaint", betaling: "other", overig: "other",
  };
  const categorieAirtable = categorieMap[intent] || "other";

  // 4. Log naar Airtable
  const record = await atCreate({
    "Naam": fromName,
    "Afzender": fromEmail,
    "Onderwerp": subject,
    "Originele Email": bodyText.substring(0, 5000),
    "Status": "In behandeling",
    "Urgentie": risk === "high" ? "?? Hoog" : "?? Normaal",
    "Categorie": categorieAirtable,
    "Concept": conceptBody,
    "Datum": received,
    "Notities": emailIdToKey(emailId),  // Unieke sleutel voor duplicate check
  });

  if (!record) {
    console.log(`  ERROR: Airtable aanmaken mislukt voor ${emailId}`);
    return;
  }

  const recordId = record.id;

  // 5. Markeer als gelezen + oranje (concept klaar, actie nodig)
  await markAsRead(state, emailId);
  await markEmailCategory(state, emailId, "orange");

  // 6. Stuur naar Telegram
  const msgId = await sendConceptToTelegram(
    fromName, fromEmail, subject, risk, conceptBody, recordId,
    { categorie: categorieLabel, samenvatting, actie, followup, trello }
  );

  if (msgId) {
    // emailId hoeft niet in pendingCallbacks — wordt opgehaald uit Airtable via recordId
    state.pendingCallbacks[String(msgId)] = {
      recordId, emailId, fromEmail, fromName, subject, concept: conceptBody, followup, isContactForm,
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
    // Niet opnieuw versturen als al afgehandeld
    if (f["Status"] === "Afgehandeld") return null;
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

const _sendingInProgress = new Set();

async function handleSend(state, cq, recordId) {
  const msgId = cq.message.message_id;

  // Bevestig direct aan Telegram zodat hij niet opnieuw stuurt
  await tgAnswerCallback(cq.id, _sendingInProgress.has(msgId) ? "⏳ Bezig met versturen..." : "⏳ Versturen...");

  // Voorkom dubbele verzending bij snelle dubbele klik
  if (_sendingInProgress.has(msgId)) {
    return;
  }
  _sendingInProgress.add(msgId);

  try {
    await _doSend(state, cq, recordId, msgId);
  } finally {
    _sendingInProgress.delete(msgId);
  }
}

async function _doSend(state, cq, recordId, msgId) {
  const info = await getCallbackInfo(state, msgId, recordId);

  if (!info) {
    await tgAnswerCallback(cq.id, "✅ Al verstuurd");
    return;
  }

  const emailId = info.emailId;
  console.log(`  VERSTUREN naar ${info.fromEmail}...`);
  // Zorg dat het token geldig is voor versturen
  try { await getAccessToken(state); } catch (e) {
    await tgAnswerCallback(cq.id, "❌ Token fout — herstart Amy");
    console.log(`  [ERROR] Token refresh mislukt: ${e.message}`);
    return;
  }
  // Contactformulieren of emails zonder geldig emailId: stuur direct via sendMail
  const hasValidEmailId = emailId && emailId.length > 50;
  let ok;
  if (info.isContactForm || !hasValidEmailId) {
    const headers = msHeaders(state);
    const bodyHtml = info.concept.replace(/\n/g, "<br>");
    const resp = await post("https://graph.microsoft.com/v1.0/me/sendMail", {
      headers,
      json: {
        message: {
          subject: `Re: ${info.subject}`,
          body: { contentType: "HTML", content: bodyHtml },
          toRecipients: [{ emailAddress: { address: info.fromEmail } }],
        },
        saveToSentItems: true,
      },
    });
    ok = resp.ok;
  } else {
    ok = await sendReply(state, emailId, info.fromEmail, info.subject, info.concept);
  }

  if (ok) {
    await atUpdate(recordId, { Status: "Afgehandeld" });
    // Kleur: oranje als follow-up nodig, groen als volledig afgehandeld.
    const needsFollowup = info.followup === "ja";
    try { await markEmailCategory(state, emailId, needsFollowup ? "orange" : "green"); } catch {}
    const kleurLabel = needsFollowup ? "🟠 Follow-up nodig" : "🟢 Afgehandeld";
    const sentAt = new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    await tgEdit(msgId, `✅ <b>Verstuurd — ${info.fromName}</b>\n📌 ${info.subject}\n📧 ${info.fromEmail}\n${kleurLabel} · ${sentAt}`, null, true);
    delete state.pendingCallbacks[String(msgId)];
    saveState(state);
    console.log(`  OK — Email verstuurd naar ${info.fromEmail}`);
  } else {
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
  const feedbackText = (message.text || "").trim();
  if (!feedbackText) return false;

  let info = null;
  let cbKey = null;

  const replyTo = message.reply_to_message;
  if (replyTo) {
    const replyToId = replyTo.message_id;

    // 1. Directe match: reply op het "Wat moet er aangepast worden?" bericht
    const directKey = `feedback_${replyToId}`;
    if (state.pendingCallbacks[directKey]) {
      cbKey = directKey;
      info = state.pendingCallbacks[cbKey];
    }

    // 2. Reply op het originele concept bericht
    if (!info) {
      for (const [k, v] of Object.entries(state.pendingCallbacks)) {
        if (k.startsWith("feedback_") && v && v.originalMsgId === replyToId) {
          cbKey = k;
          info = v;
          break;
        }
      }
    }
  }

  // 3. Fallback: als er precies één open feedback-sessie is, gebruik die
  if (!info) {
    const openSessions = Object.entries(state.pendingCallbacks)
      .filter(([k, v]) => k.startsWith("feedback_") && v && v.recordId);
    if (openSessions.length === 1) {
      [cbKey, info] = openSessions[0];
    }
  }

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
  const text = `✏️ <b>Herzien concept — ${fromName}</b>\n📌 ${subject}\n📧 ${fromEmail}\n⏳ Nog versturen\n\n${preview}`;
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

      // Check op feedback (ook zonder reply_to_message via fallback)
      const handled = await handleFeedbackReply(state, msg);
      if (handled) continue;

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
    console.log("  Microsoft token OK");
  } catch (e) {
    console.error(`  [ERROR] Token refresh mislukt: ${e.message}`);
    process.exit(1);
  }

  // Zorg dat Outlook categorieën bestaan met de juiste kleur
  try {
    await ensureOutlookCategories(state);
    console.log("  Outlook categorieën OK\n");
  } catch (e) {
    console.log(`  [WARN] Outlook categorieën aanmaken mislukt: ${e.message}\n`);
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
        // Alleen bijwerken als de check gelukt is — bij connectiefout blijft de oude timestamp staan
        state.lastEmailSince = new Date().toISOString();
        saveState(state);
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
