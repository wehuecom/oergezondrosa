"use strict";

const https = require("https");
const cfg = require("../config.js");

const TOKEN = cfg.TELEGRAM_TOKEN;
const CHAT_ID = cfg.TELEGRAM_CHAT_ID;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function tgRequest(method, body) {
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${TOKEN}/${method}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(bodyStr) },
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

/**
 * Stuur tekstbericht naar Telegram (splitst automatisch bij >4000 tekens).
 */
async function sendText(text, chatId = CHAT_ID) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, 4000));
    remaining = remaining.slice(4000);
  }
  for (const chunk of chunks) {
    await tgRequest("sendMessage", { chat_id: chatId, text: chunk, parse_mode: "Markdown" });
    await sleep(500);
  }
}

/**
 * Stuur foto naar Telegram.
 */
async function sendPhoto(buffer, caption = "", replyMarkup = null, chatId = CHAT_ID) {
  const boundary = "----FormBoundary" + Date.now();
  const parts = [
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`),
  ];
  if (caption) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`));
  }
  if (replyMarkup) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reply_markup"\r\n\r\n${JSON.stringify(replyMarkup)}\r\n`));
  }
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="post.png"\r\nContent-Type: image/png\r\n\r\n`));
  parts.push(buffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${TOKEN}/sendPhoto`,
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": body.length },
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Stuur bericht met inline knoppen.
 */
async function sendButtons(text, buttons, chatId = CHAT_ID) {
  await tgRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: buttons },
  });
}

module.exports = { sendText, sendPhoto, sendButtons, tgRequest, sleep };
