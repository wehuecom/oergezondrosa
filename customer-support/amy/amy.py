#!/usr/bin/env python3
"""
Amy — Oergezond Customer Support Bot
=====================================
Vervangt n8n workflows volledig.
Draait als Python script via PowerShell.

Starten: python amy.py
Stoppen: Ctrl+C
"""

import json
import re
import time
import os
from datetime import datetime
from pathlib import Path

import requests

# ============================================================
# CONFIGURATIE — geladen vanuit config.js (niet in Git)
# ============================================================

BASE_DIR = Path(__file__).parent

def _load_config() -> dict:
    """Laad credentials vanuit config.js (zelfde bestand als amy.js gebruikt)."""
    config_file = BASE_DIR / "config.js"
    if not config_file.exists():
        raise RuntimeError(
            f"config.js niet gevonden in {BASE_DIR}\n"
            "Maak config.js aan op basis van config.js.example"
        )
    content = config_file.read_text(encoding="utf-8")
    # Verwijder module.exports = { ... } wrapper en parse als JSON
    match = re.search(r"module\.exports\s*=\s*(\{.*\})", content, re.DOTALL)
    if not match:
        raise RuntimeError("config.js heeft onverwacht formaat")
    # Zet JS object om naar JSON (verwijder trailing commas en comments)
    js_obj = match.group(1)
    js_obj = re.sub(r",\s*\n(\s*\})", r"\n\1", js_obj)   # trailing commas
    js_obj = re.sub(r"//[^\n]*", "", js_obj)              # line comments
    js_obj = re.sub(r"(\w+):", r'"\1":', js_obj)          # unquoted keys
    return json.loads(js_obj)

_cfg = _load_config()

# Microsoft OAuth2
MS_CLIENT_ID = _cfg["MS_CLIENT_ID"]
MS_CLIENT_SECRET = _cfg["MS_CLIENT_SECRET"]
MS_TENANT_ID = _cfg["MS_TENANT_ID"]
MS_REFRESH_TOKEN_FILE = BASE_DIR / "ms_refresh_token.txt"
MS_SCOPE = "https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access"

# Airtable
AIRTABLE_API_KEY = _cfg["AIRTABLE_API_KEY"]
AIRTABLE_BASE_ID = _cfg["AIRTABLE_BASE_ID"]
AIRTABLE_TABLE_ID = _cfg["AIRTABLE_TABLE_ID"]
AIRTABLE_URL = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_TABLE_ID}"
AIRTABLE_HEADERS = {
    "Authorization": f"Bearer {AIRTABLE_API_KEY}",
    "Content-Type": "application/json",
}

# Telegram
TELEGRAM_TOKEN = _cfg["TELEGRAM_TOKEN"]
TELEGRAM_CHAT_ID = _cfg["TELEGRAM_CHAT_ID"]
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"

# Claude (Anthropic)
CLAUDE_API_KEY = _cfg["CLAUDE_API_KEY"]

# State
STATE_FILE = BASE_DIR / "amy_state.json"

# Poll intervals
EMAIL_POLL_INTERVAL = 180   # 3 minuten
TELEGRAM_POLL_INTERVAL = 5  # 5 seconden

# Auto-senders overslaan
AUTO_SENDER_PATTERNS = [
    "noreply", "no-reply", "donotreply", "do-not-reply",
    "mailer-daemon", "postmaster", "bounce@", "automated",
    "notifications@", "shopify.com", "bol.com", "klarna",
    "newsletter", "info@sendgrid", "amazonses",
]

# ============================================================
# KNOWLEDGE BASE (ingebouwd vanuit prompts/ en knowledge/)
# ============================================================

SYSTEM_PROMPT = """Je bent Amy, de klantenservice medewerker van Oergezond.

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
- Betaalgeschil of fraude"""

HOLDING_REPLY_TEMPLATE = """Hi {voornaam},

Dank voor je bericht. We willen dit graag zorgvuldig voor je oppakken.

We kijken dit intern even goed na zodat we je het juiste antwoord kunnen geven. Zodra we dit helder hebben, komen we bij je terug.

Met gezonde groet,

Amy - Klantenservice
www.oergezond.com | @oergezond | contact@oergezond.com"""


# ============================================================
# STATE MANAGEMENT
# ============================================================

def load_state() -> dict:
    default = {
        "last_update_id": 0,
        "ms_access_token": None,
        "ms_token_expires": 0,
        "pending_callbacks": {},
        "extra_instructions": "",
    }
    if STATE_FILE.exists():
        try:
            data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            # Migreer Node.js camelCase state naar Python snake_case
            migrated = dict(default)
            migrated["last_update_id"] = (
                data.get("last_update_id") or data.get("lastUpdateId") or 0
            )
            migrated["ms_access_token"] = (
                data.get("ms_access_token") or data.get("msAccessToken")
            )
            migrated["ms_token_expires"] = (
                data.get("ms_token_expires") or data.get("msTokenExpires") or 0
            )
            migrated["extra_instructions"] = (
                data.get("extra_instructions") or data.get("extraInstructions") or ""
            )
            # Behoud alleen Python-gegenereerde callbacks (herkenbaar aan snake_case keys)
            raw_cbs = data.get("pending_callbacks") or data.get("pendingCallbacks") or {}
            migrated["pending_callbacks"] = {
                k: v for k, v in raw_cbs.items()
                if isinstance(v, dict) and "record_id" in v
            }
            return migrated
        except Exception:
            pass
    return default


def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


# ============================================================
# MICROSOFT GRAPH — TOKEN
# ============================================================

def get_access_token(state: dict) -> str:
    """Geeft een geldig access token terug. Refresht automatisch als verlopen."""
    now = time.time()
    if state.get("ms_access_token") and state.get("ms_token_expires", 0) > now + 60:
        return state["ms_access_token"]

    if not MS_REFRESH_TOKEN_FILE.exists():
        raise RuntimeError(
            f"Geen refresh token gevonden!\n"
            f"Zet de Microsoft refresh token in: {MS_REFRESH_TOKEN_FILE}"
        )

    refresh_token = MS_REFRESH_TOKEN_FILE.read_text(encoding="utf-8").strip()

    resp = requests.post(
        f"https://login.microsoftonline.com/{MS_TENANT_ID}/oauth2/v2.0/token",
        data={
            "grant_type": "refresh_token",
            "client_id": MS_CLIENT_ID,
            "client_secret": MS_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "scope": MS_SCOPE,
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()

    state["ms_access_token"] = data["access_token"]
    state["ms_token_expires"] = now + data.get("expires_in", 3600) - 60

    # Sla nieuw refresh token op als Microsoft er een stuurt
    if "refresh_token" in data:
        MS_REFRESH_TOKEN_FILE.write_text(data["refresh_token"], encoding="utf-8")

    save_state(state)
    return state["ms_access_token"]


def ms_headers(state: dict) -> dict:
    return {
        "Authorization": f"Bearer {get_access_token(state)}",
        "Content-Type": "application/json",
    }


# ============================================================
# EMAIL OPHALEN VIA MICROSOFT GRAPH
# ============================================================

def get_klantvragen_folder_id(state: dict) -> str | None:
    """Zoek het ID van de 'Klantvragen' map."""
    resp = requests.get(
        "https://graph.microsoft.com/v1.0/me/mailFolders?$top=50",
        headers=ms_headers(state),
        timeout=30,
    )
    if resp.ok:
        for folder in resp.json().get("value", []):
            if "klantvragen" in folder.get("displayName", "").lower():
                return folder["id"]
    return None


def fetch_unread_emails(state: dict) -> list[dict]:
    """Haal ongelezen emails op uit inbox én klantvragen."""
    headers = ms_headers(state)
    all_emails = []

    folder_ids = ["inbox"]
    kv_id = get_klantvragen_folder_id(state)
    if kv_id:
        folder_ids.append(kv_id)

    select_fields = "id,subject,from,body,receivedDateTime,toRecipients,conversationId,parentFolderId"

    for folder_id in folder_ids:
        url = f"https://graph.microsoft.com/v1.0/me/mailFolders/{folder_id}/messages"
        params = {
            "$filter": "isRead eq false",
            "$select": select_fields,
            "$top": 25,
            "$orderby": "receivedDateTime asc",
        }
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        if resp.ok:
            emails = resp.json().get("value", [])
            all_emails.extend(emails)
            print(f"  Map '{folder_id[:20]}...': {len(emails)} ongelezen")
        else:
            print(f"  [WARN] Map '{folder_id[:20]}' ophalen mislukt: {resp.status_code}")

    return all_emails


def mark_as_read(state: dict, email_id: str):
    requests.patch(
        f"https://graph.microsoft.com/v1.0/me/messages/{email_id}",
        headers=ms_headers(state),
        json={"isRead": True},
        timeout=15,
    )


def send_reply(state: dict, original_email_id: str, to_email: str, subject: str, body_text: str) -> bool:
    """Stuur een reply op een bestaande email."""
    headers = ms_headers(state)

    # Zet platte tekst om naar HTML (newlines → <br>)
    body_html = body_text.replace("\n", "<br>")

    reply_subject = subject if subject.lower().startswith("re:") else f"Re: {subject}"

    payload = {
        "message": {
            "subject": reply_subject,
            "body": {"contentType": "HTML", "content": body_html},
            "toRecipients": [{"emailAddress": {"address": to_email}}],
        },
        "comment": "",
    }

    resp = requests.post(
        f"https://graph.microsoft.com/v1.0/me/messages/{original_email_id}/reply",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if not resp.ok:
        # Fallback: nieuwe mail sturen
        print(f"  [WARN] Reply mislukt ({resp.status_code}), probeer sendMail...")
        resp2 = requests.post(
            "https://graph.microsoft.com/v1.0/me/sendMail",
            headers=headers,
            json={
                "message": {
                    "subject": reply_subject,
                    "body": {"contentType": "HTML", "content": body_html},
                    "toRecipients": [{"emailAddress": {"address": to_email}}],
                },
                "saveToSentItems": True,
            },
            timeout=30,
        )
        return resp2.ok

    return True


# ============================================================
# AUTO-SENDER FILTER
# ============================================================

def is_auto_sender(email: dict) -> bool:
    addr = email.get("from", {}).get("emailAddress", {}).get("address", "").lower()
    name = email.get("from", {}).get("emailAddress", {}).get("name", "").lower()
    for pattern in AUTO_SENDER_PATTERNS:
        if pattern in addr or pattern in name:
            return True
    return False


# ============================================================
# AIRTABLE
# ============================================================

def airtable_find_duplicate(email_id: str) -> dict | None:
    resp = requests.get(
        AIRTABLE_URL,
        headers=AIRTABLE_HEADERS,
        params={"filterByFormula": f"{{Email ID}} = '{email_id}'", "maxRecords": 1},
        timeout=15,
    )
    if resp.ok:
        records = resp.json().get("records", [])
        return records[0] if records else None
    return None


def airtable_create(fields: dict) -> dict | None:
    resp = requests.post(
        AIRTABLE_URL,
        headers=AIRTABLE_HEADERS,
        json={"fields": fields},
        timeout=15,
    )
    if resp.ok:
        return resp.json()
    print(f"  [WARN] Airtable create mislukt: {resp.status_code} {resp.text[:200]}")
    return None


def airtable_update(record_id: str, fields: dict) -> bool:
    resp = requests.patch(
        f"{AIRTABLE_URL}/{record_id}",
        headers=AIRTABLE_HEADERS,
        json={"fields": fields},
        timeout=15,
    )
    return resp.ok


def airtable_get(record_id: str) -> dict | None:
    resp = requests.get(f"{AIRTABLE_URL}/{record_id}", headers=AIRTABLE_HEADERS, timeout=15)
    return resp.json() if resp.ok else None


def airtable_get_open_emails(max_records: int = 20) -> list[dict]:
    """Haal alle openstaande emails op (status Nieuw, Concept Klaar of Aanpassen)."""
    resp = requests.get(
        AIRTABLE_URL,
        headers=AIRTABLE_HEADERS,
        params={
            "filterByFormula": "OR({Status}='Nieuw',{Status}='Concept Klaar',{Status}='Aanpassen')",
            "fields[]": ["Klant Naam", "Van", "Onderwerp", "Status", "Ontvangen Op", "Email ID"],
            "sort[0][field]": "Ontvangen Op",
            "sort[0][direction]": "desc",
            "maxRecords": max_records,
        },
        timeout=15,
    )
    return resp.json().get("records", []) if resp.ok else []


def airtable_find_by_name(name: str) -> list[dict]:
    """Zoek een open email op klantnaam (gedeeltelijke match)."""
    formula = (
        f"AND("
        f"SEARCH(LOWER('{name}'),LOWER({{Klant Naam}})),"
        f"OR({{Status}}='Nieuw',{{Status}}='Concept Klaar',{{Status}}='Aanpassen')"
        f")"
    )
    resp = requests.get(
        AIRTABLE_URL,
        headers=AIRTABLE_HEADERS,
        params={"filterByFormula": formula, "maxRecords": 5},
        timeout=15,
    )
    return resp.json().get("records", []) if resp.ok else []


# ============================================================
# CLAUDE API
# ============================================================

def claude(prompt: str, system: str = SYSTEM_PROMPT, max_tokens: int = 1200) -> str:
    resp = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": "claude-opus-4-6",
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["content"][0]["text"].strip()


def classify_and_generate(
    from_name: str,
    from_email: str,
    subject: str,
    body: str,
    extra_instructions: str = "",
) -> dict:
    """
    Classificeert de email en genereert een concept-antwoord in één Claude-call.
    Retourneert dict met: intent, sentiment, risk, concept_subject, concept_body
    """
    extra = f"\nExtra instructies van het team: {extra_instructions}" if extra_instructions else ""

    prompt = f"""Email van: {from_name} ({from_email})
Onderwerp: {subject}
Bericht:
{body[:2500]}
{extra}

Geef je output EXACT in dit formaat (geen extra tekst erbuiten):

INTENT: <klacht|bestelling|vraag|retour|betaling|overig>
SENTIMENT: <positief|neutraal|negatief|urgent>
RISK: <low|medium|high>
SUBJECT: Re: {subject}
EMAIL:
<volledige emailtekst hier>"""

    response = claude(prompt)
    return _parse_structured_response(response, from_name)


def _parse_structured_response(text: str, from_name: str) -> dict:
    """Parseer het gestructureerde Claude-antwoord."""
    result = {
        "intent": "vraag",
        "sentiment": "neutraal",
        "risk": "low",
        "subject": "Re: (onderwerp)",
        "body": text,
    }

    lines = text.strip().split("\n")
    email_lines = []
    in_email = False

    for line in lines:
        if line.startswith("INTENT:"):
            result["intent"] = line.split(":", 1)[1].strip().lower()
        elif line.startswith("SENTIMENT:"):
            result["sentiment"] = line.split(":", 1)[1].strip().lower()
        elif line.startswith("RISK:"):
            result["risk"] = line.split(":", 1)[1].strip().lower()
        elif line.startswith("SUBJECT:"):
            result["subject"] = line.split(":", 1)[1].strip()
        elif line.startswith("EMAIL:"):
            in_email = True
        elif in_email:
            email_lines.append(line)

    if email_lines:
        result["body"] = "\n".join(email_lines).strip()

    return result


def revise_concept(original: str, feedback: str, from_name: str, subject: str, extra: str = "") -> str:
    """Pas een bestaand concept aan op basis van feedback."""
    extra_str = f"\nExtra instructies: {extra}" if extra else ""
    prompt = f"""Pas het onderstaande emailconcept aan op basis van de feedback.
Behoud de Oergezond toon (direct, rustig, menselijk, geen marketingtaal).

Oorspronkelijk concept:
{original}

Feedback:
{feedback}

Klant: {from_name}
Onderwerp: {subject}{extra_str}

Geef ALLEEN de herziene emailtekst terug (zonder INTENT/RISK/etc. headers)."""

    return claude(prompt, system=SYSTEM_PROMPT)


# ============================================================
# TELEGRAM
# ============================================================

def tg_send(text: str, reply_markup: dict = None, parse_mode: str = "HTML") -> dict | None:
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": parse_mode,
    }
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup)
    resp = requests.post(f"{TELEGRAM_API}/sendMessage", json=payload, timeout=15)
    if resp.ok:
        return resp.json().get("result", {})
    print(f"  [WARN] Telegram send mislukt: {resp.status_code} {resp.text[:200]}")
    return None


def tg_edit(message_id: int, text: str, reply_markup: dict = None):
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML",
    }
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup)
    requests.post(f"{TELEGRAM_API}/editMessageText", json=payload, timeout=15)


def tg_answer_callback(callback_query_id: str, text: str = ""):
    requests.post(
        f"{TELEGRAM_API}/answerCallbackQuery",
        json={"callback_query_id": callback_query_id, "text": text},
        timeout=10,
    )


def tg_get_updates(offset: int = 0) -> list[dict]:
    resp = requests.get(
        f"{TELEGRAM_API}/getUpdates",
        params={"offset": offset, "timeout": 3, "limit": 100},
        timeout=10,
    )
    return resp.json().get("result", []) if resp.ok else []


def concept_keyboard(record_id: str, email_id: str) -> dict:
    return {
        "inline_keyboard": [[
            {"text": "✅ Verstuur", "callback_data": f"send|{record_id}|{email_id}"},
            {"text": "✏️ Aanpassen", "callback_data": f"edit|{record_id}|{email_id}"},
        ]]
    }


def send_concept_to_telegram(
    state: dict,
    from_name: str,
    from_email: str,
    subject: str,
    risk: str,
    concept_body: str,
    record_id: str,
    email_id: str,
) -> int | None:
    """Stuur concept naar Telegram met inline keyboard. Retourneert message_id."""
    urgency_emoji = "🔴" if risk == "high" else "🟡"
    risk_label = {"low": "Laag", "medium": "Medium", "high": "HOOG"}.get(risk, risk)

    preview = concept_body[:700] + ("..." if len(concept_body) > 700 else "")

    text = (
        f"{urgency_emoji} <b>Nieuwe email — {from_name}</b>\n"
        f"📧 {from_email}\n"
        f"📌 {subject}\n"
        f"⚠️ Risico: {risk_label}\n\n"
        f"<b>Concept antwoord:</b>\n"
        f"{preview}"
    )

    result = tg_send(text, reply_markup=concept_keyboard(record_id, email_id))
    return result.get("message_id") if result else None


# ============================================================
# EMAIL VERWERKINGSPIPELINE
# ============================================================

def process_email(state: dict, email: dict):
    email_id = email["id"]
    subject = email.get("subject", "(geen onderwerp)")
    from_info = email.get("from", {}).get("emailAddress", {})
    from_email = from_info.get("address", "")
    from_name = from_info.get("name", "") or from_email.split("@")[0]
    received = email.get("receivedDateTime", "")

    # Platte tekst uit HTML body
    raw_body = email.get("body", {}).get("content", "")
    body_text = re.sub(r"<[^>]+>", " ", raw_body)
    body_text = re.sub(r"\s+", " ", body_text).strip()

    log_prefix = f"[{from_name[:20]}] [{subject[:30]}]"

    # 1. Auto-sender filter
    if is_auto_sender(email):
        print(f"  SKIP {log_prefix} — auto-sender")
        mark_as_read(state, email_id)
        return

    # 2. Duplicate check
    existing = airtable_find_duplicate(email_id)
    if existing:
        print(f"  SKIP {log_prefix} — al in Airtable (status: {existing['fields'].get('Status')})")
        return

    print(f"  VERWERKEN {log_prefix}")

    # 3. Classificeer + genereer concept in één call
    extra = state.get("extra_instructions", "")
    result = classify_and_generate(from_name, from_email, subject, body_text, extra)

    intent = result["intent"]
    risk = result["risk"]
    concept_body = result["body"]

    # 4. Log naar Airtable
    record = airtable_create({
        "Email ID": email_id,
        "Klant Naam": from_name,
        "Van": from_email,
        "Onderwerp": subject,
        "Email Body": body_text[:5000],
        "Status": "Concept Klaar",
        "Urgentie": "Hoog" if risk == "high" else "Normaal",
        "Type": intent.capitalize(),
        "Concept": concept_body,
        "Ontvangen Op": received,
    })

    if not record:
        print(f"  ERROR: Airtable aanmaken mislukt voor {email_id}")
        return

    record_id = record["id"]

    # 5. Markeer als gelezen
    mark_as_read(state, email_id)

    # 6. Stuur naar Telegram
    msg_id = send_concept_to_telegram(
        state, from_name, from_email, subject, risk, concept_body, record_id, email_id
    )

    if msg_id:
        state["pending_callbacks"][str(msg_id)] = {
            "record_id": record_id,
            "email_id": email_id,
            "from_email": from_email,
            "from_name": from_name,
            "subject": subject,
            "concept": concept_body,
        }
        save_state(state)
        print(f"  OK — Telegram bericht verstuurd (msg_id: {msg_id})")
    else:
        print(f"  WARN — Email verwerkt maar Telegram mislukt")


# ============================================================
# TELEGRAM CALLBACK HANDLERS
# ============================================================

def get_callback_info(state: dict, msg_id: int, record_id: str) -> dict | None:
    """Haal callback info op. Eerst uit state, dan uit Airtable als fallback."""
    info = state["pending_callbacks"].get(str(msg_id))
    if info:
        return info

    # Fallback: haal op uit Airtable
    rec = airtable_get(record_id)
    if rec:
        f = rec.get("fields", {})
        return {
            "record_id": record_id,
            "email_id": f.get("Email ID") or f.get("Notities", ""),
            "from_email": f.get("Van", ""),
            "from_name": f.get("Klant Naam", ""),
            "subject": f.get("Onderwerp", ""),
            "concept": f.get("Concept", ""),
        }
    return None


def handle_send(state: dict, cq: dict, record_id: str, email_id: str):
    """Verwerk 'Verstuur' knop."""
    msg_id = cq["message"]["message_id"]
    info = get_callback_info(state, msg_id, record_id)

    if not info:
        tg_answer_callback(cq["id"], "❌ Emaildata niet gevonden")
        return

    print(f"  VERSTUREN naar {info['from_email']}...")

    ok = send_reply(state, info.get("email_id") or email_id, info["from_email"], info["subject"], info["concept"])

    if ok:
        airtable_update(record_id, {"Status": "Verstuurd"})
        tg_edit(
            msg_id,
            f"✅ <b>Verstuurd naar {info['from_name']}</b>\n📌 {info['subject']}",
        )
        tg_answer_callback(cq["id"], "✅ Email verstuurd!")
        state["pending_callbacks"].pop(str(msg_id), None)
        save_state(state)
        print(f"  OK — Email verstuurd naar {info['from_email']}")
    else:
        tg_answer_callback(cq["id"], "❌ Versturen mislukt!")
        print(f"  ERROR — Email versturen mislukt")


def handle_edit(state: dict, cq: dict, record_id: str, email_id: str):
    """Verwerk 'Aanpassen' knop — vraag om feedback."""
    msg_id = cq["message"]["message_id"]
    tg_answer_callback(cq["id"], "Geef je feedback...")

    # Stuur reply-force bericht
    result = tg_send(
        "✏️ <b>Wat moet er aangepast worden?</b>\n\nReply op dit bericht met je feedback.",
        reply_markup={"force_reply": True, "selective": False},
    )

    if result:
        feedback_msg_id = result.get("message_id")
        state["pending_callbacks"][f"feedback_{feedback_msg_id}"] = {
            "record_id": record_id,
            "email_id": email_id,
            "original_msg_id": msg_id,
        }
        save_state(state)


def handle_feedback_reply(state: dict, message: dict) -> bool:
    """Verwerk feedback reply voor concept revisie."""
    feedback_text = message.get("text", "").strip()
    if not feedback_text:
        return False

    info = None
    cb_key = None

    # 1. Directe match: reply op het "Wat moet er aangepast worden?" bericht
    reply_to = message.get("reply_to_message", {})
    if reply_to:
        reply_to_id = reply_to.get("message_id")
        direct_key = f"feedback_{reply_to_id}"
        if state["pending_callbacks"].get(direct_key):
            cb_key = direct_key
            info = state["pending_callbacks"][cb_key]

        # 2. Reply op het originele concept bericht
        if not info:
            for k, v in state["pending_callbacks"].items():
                if k.startswith("feedback_") and isinstance(v, dict):
                    if v.get("original_msg_id") == reply_to_id:
                        cb_key = k
                        info = v
                        break

    # 3. Fallback: als er precies één open feedback-sessie is, gebruik die
    if not info:
        open_sessions = [
            (k, v) for k, v in state["pending_callbacks"].items()
            if k.startswith("feedback_") and isinstance(v, dict) and "record_id" in v
        ]
        if len(open_sessions) == 1:
            cb_key, info = open_sessions[0]

    if not info:
        return False

    record_id = info["record_id"]
    email_id = info["email_id"]
    original_msg_id = info.get("original_msg_id")

    # Haal huidig concept op uit Airtable
    rec = airtable_get(record_id)
    if not rec:
        tg_send("❌ Kon emaildata niet ophalen.")
        return True

    fields = rec.get("fields", {})
    original_concept = fields.get("Concept", "")
    from_name = fields.get("Klant Naam", "")
    from_email = fields.get("Van", "")
    subject = fields.get("Onderwerp", "")

    tg_send("⏳ Amy herziet het concept...")

    extra = state.get("extra_instructions", "")
    new_concept = revise_concept(original_concept, feedback_text, from_name, subject, extra)

    # Update Airtable
    airtable_update(record_id, {"Concept": new_concept, "Status": "Concept Klaar"})

    # Stuur herzien concept
    preview = new_concept[:700] + ("..." if len(new_concept) > 700 else "")
    text = (
        f"✏️ <b>Herzien concept — {from_name}</b>\n"
        f"📌 {subject}\n\n"
        f"{preview}"
    )
    result = tg_send(text, reply_markup=concept_keyboard(record_id, email_id))

    if result:
        new_msg_id = result.get("message_id")
        state["pending_callbacks"][str(new_msg_id)] = {
            "record_id": record_id,
            "email_id": email_id,
            "from_email": from_email,
            "from_name": from_name,
            "subject": subject,
            "concept": new_concept,
        }

    # Opruimen
    state["pending_callbacks"].pop(cb_key, None)
    if original_msg_id:
        state["pending_callbacks"].pop(str(original_msg_id), None)
    save_state(state)
    return True


# ============================================================
# TELEGRAM COMMANDO-INTERFACE
# ============================================================

def handle_command(state: dict, text: str) -> bool:
    """
    Herkent en verwerkt commando's van Jorn/Rosa in Telegram.

    Ondersteunde commando's:
    - "welke emails staan open" / "open emails"
    - "beantwoord email van [naam]"
    - "instructie: [tekst]"
    """
    lower = text.lower().strip()

    # Openstaande emails tonen
    if any(kw in lower for kw in ["welke emails", "open emails", "staan open", "openstaand"]):
        cmd_list_open()
        return True

    # Specifieke email opnieuw openen / concept tonen
    match = re.search(r"beantwoord(?:\s+email)?\s+van\s+(.+)", lower)
    if match:
        name = match.group(1).strip().title()
        cmd_reply_to(state, name)
        return True

    # Extra instructie opslaan
    match = re.match(r"instructie[:\s]+(.+)", text, flags=re.IGNORECASE | re.DOTALL)
    if match:
        instruction = match.group(1).strip()
        cmd_instruction(state, instruction)
        return True

    return False


def cmd_list_open():
    """Toon alle openstaande emails."""
    records = airtable_get_open_emails()
    if not records:
        tg_send("✅ Geen openstaande emails.")
        return

    lines = [f"📋 <b>{len(records)} openstaande email(s):</b>\n"]
    for i, rec in enumerate(records, 1):
        f = rec.get("fields", {})
        naam = f.get("Klant Naam", "?")
        onderwerp = f.get("Onderwerp", "?")[:50]
        status = f.get("Status", "?")
        datum = (f.get("Ontvangen Op") or "")[:10]
        lines.append(f"{i}. <b>{naam}</b> — {onderwerp}\n   {status} | {datum}")

    tg_send("\n".join(lines))


def cmd_reply_to(state: dict, name: str):
    """Toon concept voor een specifieke klant."""
    records = airtable_find_by_name(name)
    if not records:
        tg_send(f"❌ Geen open email gevonden van '{name}'.")
        return

    rec = records[0]
    record_id = rec["id"]
    fields = rec.get("fields", {})
    from_name = fields.get("Klant Naam", name)
    from_email = fields.get("Van", "")
    subject = fields.get("Onderwerp", "")
    body = fields.get("Email Body", "")
    email_id = fields.get("Email ID", "")
    concept = fields.get("Concept", "")

    if not concept:
        tg_send(f"⏳ Concept genereren voor {from_name}...")
        extra = state.get("extra_instructions", "")
        result = classify_and_generate(from_name, from_email, subject, body, extra)
        concept = result["body"]
        airtable_update(record_id, {"Concept": concept, "Status": "Concept Klaar"})

    preview = concept[:700] + ("..." if len(concept) > 700 else "")
    text = f"🟡 <b>Concept voor {from_name}</b>\n📌 {subject}\n\n{preview}"
    result = tg_send(text, reply_markup=concept_keyboard(record_id, email_id))

    if result:
        msg_id = result.get("message_id")
        state["pending_callbacks"][str(msg_id)] = {
            "record_id": record_id,
            "email_id": email_id,
            "from_email": from_email,
            "from_name": from_name,
            "subject": subject,
            "concept": concept,
        }
        save_state(state)


def cmd_instruction(state: dict, instruction: str):
    """Sla een extra instructie op voor toekomstige concepten."""
    state["extra_instructions"] = instruction
    save_state(state)
    tg_send(
        f"✅ <b>Instructie opgeslagen:</b>\n{instruction}\n\n"
        f"Amy past dit toe op alle nieuwe en herziene concepten."
    )


# ============================================================
# TELEGRAM UPDATES VERWERKEN
# ============================================================

def process_telegram_updates(state: dict):
    updates = tg_get_updates(offset=state.get("last_update_id", 0) + 1)

    for update in updates:
        update_id = update["update_id"]
        state["last_update_id"] = max(state.get("last_update_id", 0), update_id)

        # Callback query (knop ingedrukt)
        if "callback_query" in update:
            cq = update["callback_query"]
            data = cq.get("data", "")
            parts = data.split("|")
            action = parts[0] if parts else ""
            record_id = parts[1] if len(parts) > 1 else ""
            email_id = parts[2] if len(parts) > 2 else ""

            if action == "send":
                handle_send(state, cq, record_id, email_id)
            elif action == "edit":
                handle_edit(state, cq, record_id, email_id)
            else:
                tg_answer_callback(cq["id"])

        # Tekstbericht
        elif "message" in update:
            msg = update["message"]
            text = msg.get("text", "").strip()
            if not text:
                continue

            # Check op feedback reply (eerst — ook zonder reply_to_message via fallback)
            if handle_feedback_reply(state, msg):
                continue

            # Check op commando
            handle_command(state, text)

    if updates:
        save_state(state)


# ============================================================
# MAIN LOOP
# ============================================================

def main():
    print("=" * 60)
    print("  Amy — Oergezond Customer Support Bot")
    print("=" * 60)
    print(f"  Gestart: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Email polling: elke {EMAIL_POLL_INTERVAL // 60} minuten")
    print(f"  Telegram polling: elke {TELEGRAM_POLL_INTERVAL} seconden")
    print("  Ctrl+C om te stoppen.\n")

    state = load_state()

    # Stuur startbericht naar Telegram
    tg_send(
        f"🤖 <b>Amy is gestart</b>\n"
        f"Email check elke 3 min | Telegram polling actief\n"
        f"Commando's: 'welke emails staan open', 'beantwoord email van [naam]', 'instructie: [tekst]'"
    )

    last_email_check = 0
    telegram_error_count = 0

    while True:
        now = time.time()

        # ── Email check ──────────────────────────────────────
        if now - last_email_check >= EMAIL_POLL_INTERVAL:
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"\n[{timestamp}] Email check...")
            try:
                emails = fetch_unread_emails(state)
                new_count = len(emails)
                print(f"  {new_count} ongelezen email(s)")
                for email in emails:
                    process_email(state, email)
            except Exception as e:
                print(f"  [ERROR] Email check: {e}")
            last_email_check = now

        # ── Telegram polling ─────────────────────────────────
        try:
            process_telegram_updates(state)
            telegram_error_count = 0
        except Exception as e:
            telegram_error_count += 1
            print(f"  [ERROR] Telegram poll ({telegram_error_count}x): {e}")
            if telegram_error_count > 10:
                print("  [WARN] Te veel Telegram fouten — wacht 60 seconden")
                time.sleep(60)
                telegram_error_count = 0

        time.sleep(TELEGRAM_POLL_INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nAmy gestopt.")
