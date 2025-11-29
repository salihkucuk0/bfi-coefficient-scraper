const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

async function scrape() {
  console.log("▶ Scraper başladı...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://www.football-coefficient.eu/", {
    waitUntil: "networkidle2",
    timeout: 0
  });

  console.log("✔ Sayfa yüklendi, tablo okunuyor...");

  const data = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("table tbody tr")];
    const countries = [];

    for (const r of rows) {
      const tds = r.querySelectorAll("td");
      if (!tds.length) continue;

      const rank = tds[0]?.innerText.trim();
      if (!rank || isNaN(Number(rank))) continue;

      const countryName = tds[1]?.innerText.trim();
      const totalPoints = Number(tds[2]?.innerText.trim());
      const seasonPoints = Number(tds[3]?.innerText.trim());

      // Takımlar
      const teams = [];
      const teamLinks = [...tds[6].querySelectorAll("a[href*='/team/']")];

      for (const a of teamLinks) {
        const raw = a.innerText.trim(); // ÖRN: "Arsenal 16"
        const parts = raw.split(" ");
        const value = Number(parts.pop());
        const name = parts.join(" ");
        teams.push({ team: name, value });
      }

      countries.push({
        countryRank: Number(rank),
        country: countryName,
        totalPoints,
        seasonPoints,
        teams,
      });
    }

    return countries;
  });

  await browser.close();

  const filePath = path.join(__dirname, "..", "data", "countries.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`✔ Kaydedildi! Toplam ülke: ${data.length}`);

  return data;
}

scrape();
