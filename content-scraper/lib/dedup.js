"use strict";

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const USED_TOPICS_FILE = path.join(DATA_DIR, ".used-topics.json");
const LAST_RUN_FILE = path.join(DATA_DIR, ".last-run");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsedTopics() {
  try { return JSON.parse(fs.readFileSync(USED_TOPICS_FILE, "utf8")); }
  catch { return []; }
}

function saveUsedTopics(topics) {
  ensureDataDir();
  const unique = [...new Set(topics)].slice(-60);
  fs.writeFileSync(USED_TOPICS_FILE, JSON.stringify(unique, null, 2), "utf8");
}

function alreadyRanToday() {
  try {
    const last = fs.readFileSync(LAST_RUN_FILE, "utf8").trim();
    return last === new Date().toISOString().slice(0, 10);
  } catch { return false; }
}

function markRanToday() {
  ensureDataDir();
  fs.writeFileSync(LAST_RUN_FILE, new Date().toISOString().slice(0, 10), "utf8");
}

module.exports = { loadUsedTopics, saveUsedTopics, alreadyRanToday, markRanToday };
