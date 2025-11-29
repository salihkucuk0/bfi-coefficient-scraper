import fs from "fs";
import puppeteer from "puppeteer";

async function scrape() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  );

  console.log("📥 Sayfa yükleniyor...");
  await page.goto("https://www.football-coefficient.eu/", {
    waitUntil: "networkidle2",
    timeout: 0,
  });

  // SAYFANIN TAM HTML’İ
  const html = await page.content();

  // DEBUG HTML KAYDI
  fs.writeFileSync("./data/debug.html", html);
  console.log("🐞 debug.html oluşturuldu!");

  // SCRAPE
  const rows = await page.$$eval("table.el-table tbody tr", (rows) =>
    rows.map((row) => {
      const tds = row.querySelectorAll("td");
      if (tds.length < 5) return null;

      const rank = Number(tds[0].innerText.trim());
      if (!rank) return null;

      const countryName = tds[1].innerText.trim();
      const totalPoints = Number(tds[2].innerText.trim());
      const seasonPoints = Number(tds[3].innerText.trim());

      const teamLinks = [...tds[4].querySelectorAll("a")];

      const teams = teamLinks.map((a) => {
        const full = a.innerText.trim(); // "Arsenal 16" gibi
        const parts = full.split(" ");
        const value = Number(parts.pop());
        const name = parts.join(" ");
        return { team: name, value };
      });

      return {
        countryRank: rank,
        country: countryName,
        totalPoints,
        seasonPoints,
        teams,
      };
    }).filter(Boolean)
  );

  await browser.close();

  fs.writeFileSync("./data/countries.json", JSON.stringify(rows, null, 2));
  console.log("✔ countries.json oluşturuldu!");
}

scrape();
