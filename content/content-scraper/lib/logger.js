"use strict";

function log(msg) {
  const time = new Date().toLocaleTimeString("nl-NL");
  console.log(`[${time}] ${msg}`);
}

module.exports = { log };
