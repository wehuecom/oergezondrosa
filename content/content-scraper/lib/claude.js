"use strict";

const https = require("https");
const cfg = require("../config.js");

const CLAUDE_API_KEY = cfg.CLAUDE_API_KEY;

function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

/**
 * Roep Claude API aan met retry logic.
 * @param {string} prompt - User prompt
 * @param {object} opts - { model, maxTokens, system }
 * @returns {string} Claude's response text
 */
async function callClaude(prompt, opts = {}) {
  const model = opts.model || "claude-sonnet-4-6";
  const maxTokens = opts.maxTokens || 4000;

  const messages = [{ role: "user", content: prompt }];
  const payload = { model, max_tokens: maxTokens, messages };
  if (opts.system) payload.system = opts.system;

  const body = JSON.stringify(payload);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await httpsRequest({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    }, body);

    if (res.status === 200) return res.body.content[0].text;

    const isOverloaded = res.status === 529 ||
      (res.body?.error?.type === "overloaded_error");

    if (isOverloaded && attempt < 3) {
      const wait = attempt * 15;
      console.log(`  Claude overloaded — poging ${attempt}/3, wacht ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }

    throw new Error(`Claude API ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
  }
}

/**
 * Parse JSON uit Claude response (kan markdown code blocks bevatten).
 */
function parseJson(raw) {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  if (!match) throw new Error("Geen JSON gevonden in Claude response");
  return JSON.parse(match[1] || match[0]);
}

module.exports = { callClaude, parseJson, httpsRequest };
