"use strict";
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  const logoB64 = fs.readFileSync(path.join(__dirname, "templates", "logo-light.png")).toString("base64");

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 200, height: 260 });

  await page.setContent(`<!DOCTYPE html>
<html><body style="margin:0;padding:0;">
<canvas id="c" width="200" height="260"></canvas>
</body></html>`);

  const result = await page.evaluate((b64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const W = img.width, H = img.height;
        const c = document.getElementById("c");
        c.width = W; c.height = H;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, W, H);
        const px = d.data;
        const visited = new Uint8Array(W * H);

        function colorDist(i, r, g, b) {
          const dr = px[i] - r, dg = px[i+1] - g, db = px[i+2] - b;
          return Math.sqrt(dr*dr + dg*dg + db*db);
        }

        // Flood fill vanaf een startpositie met tolerantie
        function floodFill(startX, startY, tolerance) {
          const idx = (startY * W + startX) * 4;
          const seedR = px[idx], seedG = px[idx+1], seedB = px[idx+2];
          const stack = [startX + startY * W];
          while (stack.length) {
            const pos = stack.pop();
            if (visited[pos]) continue;
            visited[pos] = 1;
            const pi = pos * 4;
            if (colorDist(pi, seedR, seedG, seedB) > tolerance) continue;
            px[pi+3] = 0; // transparant
            const x = pos % W, y = Math.floor(pos / W);
            if (x > 0)   stack.push(pos - 1);
            if (x < W-1) stack.push(pos + 1);
            if (y > 0)   stack.push(pos - W);
            if (y < H-1) stack.push(pos + W);
          }
        }

        const tol = 120;
        floodFill(0,     0,     tol);
        floodFill(W-1,   0,     tol);
        floodFill(0,     H-1,   tol);
        floodFill(W-1,   H-1,   tol);

        // Stap 1: verwijder alle semi-transparante pixels
        for (let i = 3; i < px.length; i += 4) {
          if (px[i] > 0 && px[i] < 200) px[i] = 0;
        }

        // Stap 2: erosie — verwijder zichtbare pixels die grenzen aan een transparant pixel
        const copy = new Uint8Array(px);
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            if (copy[i + 3] === 0) continue; // al transparant
            // Check buren
            const neighbors = [
              x > 0   ? (y * W + x - 1) * 4 : -1,
              x < W-1 ? (y * W + x + 1) * 4 : -1,
              y > 0   ? ((y-1) * W + x) * 4 : -1,
              y < H-1 ? ((y+1) * W + x) * 4 : -1,
            ];
            if (neighbors.some(n => n >= 0 && copy[n + 3] === 0)) {
              px[i + 3] = 0; // rand pixel weghalen
            }
          }
        }

        ctx.putImageData(d, 0, 0);
        resolve(c.toDataURL("image/png").split(",")[1]);
      };
      img.src = "data:image/png;base64," + b64;
    });
  }, logoB64);

  fs.writeFileSync(path.join(__dirname, "templates", "logo-light-transparent.png"), Buffer.from(result, "base64"));
  console.log("✓ logo-light-transparent.png opgeslagen");
  await browser.close();
})().catch(console.error);
