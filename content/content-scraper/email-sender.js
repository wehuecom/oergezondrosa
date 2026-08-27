#!/usr/bin/env node
/**
 * Email Sender API — ontvangt subscribe requests van de landers,
 * voegt toe aan Klaviyo lijst en stuurt de juiste gids-email.
 *
 * Draait via pm2 op de Mac Mini.
 * POST /subscribe { email, listId }
 */

"use strict";

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Microsoft 365 SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: "contact@oergezond.com",
    pass: "LeeuwBeets6366!",
  },
});

// Klaviyo config
const KLAVIYO_PRIVATE_KEY = "pk_UXNDxC_f620eb347ee8d07f8a7df8e9eaa0e6ca9d";
const KLAVIYO_COMPANY_ID = "UXNDxC";

// Email templates per listId
const emailConfig = {
  RVTdXW: {
    subject: "Hier is je Zaadoliën Gids",
    templateFile: "templates/zaadolien-email.html",
  },
  WU2ALr: {
    subject: "Hier is je Oer Slaapprotocol",
    templateFile: "templates/slaap-email.html",
  },
  UuzEDj: {
    subject: "Hier is je Darmherstel Protocol",
    templateFile: "templates/maagzuur-email.html",
  },
  Y9trXj: {
    subject: "Hier is je Fast Fashion Gifgids",
    templateFile: "templates/fastfashion-email.html",
  },
  SBwwMs: {
    subject: "Hier is je Lab-Voedsel Gids",
    templateFile: "templates/labvoedsel-email.html",
  },
};

// Load email templates from Klaviyo API (cached)
const templateCache = {};

async function getKlaviyoTemplate(listId) {
  if (templateCache[listId]) return templateCache[listId];

  const config = emailConfig[listId];
  if (!config) return null;

  // Try local file first
  const localPath = path.join(__dirname, config.templateFile);
  if (fs.existsSync(localPath)) {
    templateCache[listId] = fs.readFileSync(localPath, "utf8");
    return templateCache[listId];
  }

  return null;
}

// Subscribe to Klaviyo list
function subscribeToKlaviyo(email, listId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      data: {
        type: "subscription",
        attributes: {
          custom_source: "Lander Email Sender",
          profile: { data: { type: "profile", attributes: { email } } },
        },
        relationships: { list: { data: { type: "list", id: listId } } },
      },
    });

    const req = https.request(
      {
        hostname: "a.klaviyo.com",
        path: "/client/subscriptions/?company_id=" + KLAVIYO_COMPANY_ID,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          revision: "2024-02-15",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve({ status: res.statusCode, body: d }));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// API endpoint
app.post("/subscribe", async (req, res) => {
  const { email, listId } = req.body;

  if (!email || !listId) {
    return res.status(400).json({ error: "email and listId required" });
  }

  if (!emailConfig[listId]) {
    return res.status(400).json({ error: "unknown listId" });
  }

  console.log(`[${new Date().toLocaleTimeString("nl-NL")}] Subscribe: ${email} → ${listId}`);

  try {
    // 1. Add to Klaviyo list
    await subscribeToKlaviyo(email, listId);
    console.log(`  Klaviyo: OK`);

    // 2. Send email via SMTP
    const template = await getKlaviyoTemplate(listId);
    const config = emailConfig[listId];

    if (template) {
      const html = template.replace(/\{\{\s*first_name\|default:""\s*\}\}/g, "");
      await transporter.sendMail({
        from: '"Oergezond" <contact@oergezond.com>',
        to: email,
        subject: config.subject,
        html: html,
      });
      console.log(`  Email verstuurd: ${config.subject}`);
    } else {
      console.log(`  Geen template gevonden voor ${listId}`);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(`  FOUT: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = 3847;
app.listen(PORT, () => {
  console.log(`Email Sender API draait op port ${PORT}`);
});
