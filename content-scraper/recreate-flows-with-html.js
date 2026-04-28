#!/usr/bin/env node
"use strict";
const https = require("https");
const fs = require("fs");
const path = require("path");

const API_KEY = "pk_UXNDxC_f620eb347ee8d07f8a7df8e9eaa0e6ca9d";

function req(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const str = body ? JSON.stringify(body) : null;
    const headers = { Authorization: "Klaviyo-API-Key " + API_KEY, revision: "2025-07-15" };
    if (str) { headers["Content-Type"] = "application/json"; headers["Content-Length"] = Buffer.byteLength(str); }
    const r = https.request({ hostname: "a.klaviyo.com", path: "/api" + apiPath, method, headers }, (res) => {
      let d = ""; res.on("data", (c) => (d += c)); res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    r.on("error", reject);
    if (str) r.write(str);
    r.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const flows = [
  { name: "Fast Fashion Gids - Welcome", listId: "Y9trXj", subject: "Hier is je Fast Fashion Gifgids", preview: "Alles over toxische stoffen in je kleding", htmlFile: "fastfashion-email.html", oldId: "UMsFHd" },
  { name: "Zaadolien Gids - Welcome", listId: "RVTdXW", subject: "Hier is je Zaadoliën Gids", preview: "Welke oliën je moet vermijden en waarom", htmlFile: "zaadolien-email.html", oldId: "SK93ay" },
  { name: "Slaapprotocol - Welcome", listId: "WU2ALr", subject: "Hier is je Oer Slaapprotocol", preview: "5 stappen naar beter slapen zonder pillen", htmlFile: "slaap-email.html", oldId: "Svfg8n" },
  { name: "Maagzuur Protocol - Welcome", listId: "UuzEDj", subject: "Hier is je Darmherstel Protocol", preview: "Herstel je maagzuur natuurlijk", htmlFile: "maagzuur-email.html", oldId: "X6fmkq" },
  { name: "Lab-Voedsel Gids - Welcome", listId: "SBwwMs", subject: "Hier is je Lab-Voedsel Gids", preview: "Waarom echt eten onvervangbaar is", htmlFile: "labvoedsel-email.html", oldId: "Ub2T8W" },
];

async function main() {
  const templateDir = path.join(__dirname, "templates");

  // Delete old flows
  console.log("Oude flows verwijderen...");
  for (const f of flows) {
    const res = await req("DELETE", "/flows/" + f.oldId);
    console.log("  Delete " + f.oldId + ": " + res.status);
    await sleep(1500);
  }

  await sleep(3000);

  // Create new flows with HTML body directly in the email message
  console.log("\nNieuwe flows aanmaken met HTML content...");
  for (const f of flows) {
    const htmlPath = path.join(templateDir, f.htmlFile);
    let html = "";
    if (fs.existsSync(htmlPath)) {
      html = fs.readFileSync(htmlPath, "utf8");
    } else {
      console.log("  SKIP " + f.name + " - geen template bestand: " + htmlPath);
      continue;
    }

    const res = await req("POST", "/flows", {
      data: {
        type: "flow",
        attributes: {
          name: f.name,
          definition: {
            triggers: [{ type: "list", id: f.listId }],
            actions: [
              {
                type: "send-email",
                temporary_id: "a1",
                data: {
                  message: {
                    subject_line: f.subject,
                    preview_text: f.preview,
                    from_email: "contact@oergezond.com",
                    from_label: "Oergezond",
                    reply_to_email: "contact@oergezond.com",
                    cc_email: "",
                    bcc_email: "",
                    name: f.name + " Email",
                    smart_sending_enabled: false,
                    transactional: false,
                    add_tracking_params: false,
                    custom_tracking_params: null,
                    additional_filters: null,
                    body: html,
                  },
                  status: "live",
                },
                links: { next: null },
              },
            ],
            entry_action_id: "a1",
          },
        },
      },
    });

    const j = JSON.parse(res.body);
    if (res.status === 201) {
      console.log("  OK: " + f.name + " (ID: " + j.data.id + ")");
    } else {
      // If body field is rejected, try html_body or template approach
      const err = j.errors?.[0]?.detail || "";
      console.log("  FOUT " + f.name + ": " + err);

      if (err.includes("body")) {
        // Try without body field - create with template_id instead
        console.log("  Retry zonder body, met template...");

        // First create a template with this HTML
        const tRes = await req("POST", "/templates", {
          data: { type: "template", attributes: { name: f.name + " Template", editor_type: "CODE", html: html } }
        });
        const tId = JSON.parse(tRes.body).data?.id;
        console.log("  Template: " + tId);

        await sleep(1500);

        // Create flow referencing template
        const fRes = await req("POST", "/flows", {
          data: { type: "flow", attributes: { name: f.name, definition: {
            triggers: [{ type: "list", id: f.listId }],
            actions: [{ type: "send-email", temporary_id: "a1", data: {
              message: {
                subject_line: f.subject, preview_text: f.preview,
                from_email: "contact@oergezond.com", from_label: "Oergezond",
                reply_to_email: "contact@oergezond.com", cc_email: "", bcc_email: "",
                name: f.name + " Email", template_id: tId,
                smart_sending_enabled: false, transactional: false,
                add_tracking_params: false, custom_tracking_params: null, additional_filters: null,
              }, status: "live" }, links: { next: null } }],
            entry_action_id: "a1"
          }}}
        });
        const fj = JSON.parse(fRes.body);
        if (fRes.status === 201) {
          // Check if template was actually linked
          const actions = fj.data.attributes.definition.actions;
          const msgTemplateId = actions[0]?.data?.message?.template_id;
          console.log("  OK (retry): " + f.name + " (template in message: " + msgTemplateId + ")");
        } else {
          console.log("  FOUT (retry): " + (fj.errors?.[0]?.detail || fRes.body.slice(0,200)));
        }
      }
    }
    await sleep(2000);
  }

  console.log("\nKlaar!");
}

main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
