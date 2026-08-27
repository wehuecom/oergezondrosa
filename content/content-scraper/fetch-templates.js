const https = require("https");
const fs = require("fs");
const path = require("path");

const API_KEY = "pk_UXNDxC_f620eb347ee8d07f8a7df8e9eaa0e6ca9d";
const dir = path.join(__dirname, "templates");
fs.mkdirSync(dir, { recursive: true });

const templates = [
  { id: "Y5yrBe", file: "fastfashion-email.html" },
  { id: "XapmLt", file: "zaadolien-email.html" },
  { id: "UJWrDm", file: "slaap-email.html" },
  { id: "XGMa3G", file: "maagzuur-email.html" },
  { id: "TuUkq7", file: "labvoedsel-email.html" },
];

function fetchTemplate(id) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: "a.klaviyo.com",
      path: "/api/templates/" + id,
      headers: { Authorization: "Klaviyo-API-Key " + API_KEY, revision: "2025-07-15" },
    }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(JSON.parse(d)));
    }).on("error", reject);
  });
}

async function main() {
  for (const t of templates) {
    const data = await fetchTemplate(t.id);
    const html = data.data?.attributes?.html || "";
    fs.writeFileSync(path.join(dir, t.file), html);
    console.log(t.file + ": " + html.length + " chars");
  }
}
main();
