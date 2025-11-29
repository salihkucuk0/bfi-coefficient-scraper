import fs from "fs";
import https from "https";
import * as cheerio from "cheerio";
import path from "path";

const dataDir = "./data";
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    });
  });
}

async function scrape() {
  const url = "https://www.football-coefficient.eu/";

  console.log("➡ HTML çekiliyor...");
  const html = await fetchHtml(url);

  // DEBUG HTML
  fs.writeFileSync("./data/debug.html", html);
  console.log("✔ debug.html kaydedildi!");

  const $ = cheerio.load(html);

  const rows = $("table.el-table tbody tr");
  const result = [];

  rows.each((i, row) => {
    const tds = $(row).find("td");
    if (tds.length < 5) return;

    const rank = Number($(tds[0]).text().trim());
    if (!rank) return;

    const countryName = $(tds[1]).find("img").attr("alt")?.trim() || "";
    const totalPoints = Number($(tds[2]).text().trim());
    const seasonPoints = Number($(tds[3]).text().trim());

    const teams = [];
    $(tds[4])
      .find("a")
      .each((_, a) => {
        const raw = $(a).text().trim();
        const parts = raw.split(" ");
        const value = Number(parts.pop());
        const name = parts.join(" ");
        if (!isNaN(value)) teams.push({ team: name, value });
      });

    result.push({
      countryRank: rank,
      country: countryName,
      totalPoints,
      seasonPoints,
      teams,
    });
  });

  fs.writeFileSync("./data/countries.json", JSON.stringify(result, null, 2));
  console.log("✔ countries.json oluşturuldu:", result.length);
}

scrape();
