import fs from "fs";
import puppeteer from "puppeteer";

// data klasörü yoksa oluştur
const dataDir = "./data";
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function scrape() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  console.log("➡ Sayfa yükleniyor...");
  await page.goto("https://www.football-coefficient.eu/", {
    waitUntil: "networkidle2",
  });

  // HTML DEBUG KAYDET
  const html = await page.content();
  fs.writeFileSync("./data/debug.html", html);
  console.log("✔ debug.html oluşturuldu!");

  console.log("➡ Tablo DOM’dan okunuyor...");

  const result = await page.evaluate(() => {
    const rows = document.querySelectorAll("table.el-table tbody tr");
    const data = [];

    rows.forEach((row) => {
      const tds = row.querySelectorAll("td");
      if (tds.length < 5) return;

      const rank = Number(tds[0].innerText.trim());
      if (!rank) return;

      // Flags inside <img alt="England">
      const img = tds[1].querySelector("img");
      const country = img ? img.alt.trim() : "";

      const totalPoints = Number(tds[2].innerText.trim());
      const seasonPoints = Number(tds[3].innerText.trim());

      const teamLinks = tds[4].querySelectorAll("a");
      const teams = [];

      teamLinks.forEach((a) => {
        const txt = a.innerText.trim(); // "Arsenal 16"
        const parts = txt.split(" ");
        const value = Number(parts.pop());
        const name = parts.join(" ");
        if (!isNaN(value)) {
          teams.push({ team: name, value });
        }
      });

      data.push({
        countryRank: rank,
        country,
        totalPoints,
        seasonPoints,
        teams,
      });
    });

    return data;
  });

  await browser.close();

  fs.writeFileSync("./data/countries.json", JSON.stringify(result, null, 2));
  console.log("✔ countries.json yazıldı! Ülke sayısı:", result.length);
}

scrape();
