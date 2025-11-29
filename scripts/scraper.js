import fs from "fs";
import puppeteer from "puppeteer";

async function scrape() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
  );

  await page.goto("https://www.football-coefficient.eu/", {
    waitUntil: "networkidle2",
  });

  // DEBUG 1 → HTML dump
  const html = await page.content();
  fs.writeFileSync("./data/debug.html", html);

  // DEBUG 2 → Ekran görüntüsü
  await page.screenshot({ path: "./data/screen.png", fullPage: true });

  // tablo varsa scrape etmeye devam
  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll("table.el-table tbody tr");
    const results = [];

    rows.forEach((row) => {
      const tds = row.querySelectorAll("td");
      if (tds.length < 8) return;

      const rank = Number(tds[0].innerText.trim());
      if (!rank) return;

      const country = tds[1].innerText.trim();
      const totalPoints = Number(tds[2].innerText.trim());
      const seasonPoints = Number(tds[3].innerText.trim());

      const teams = [];
      tds[7].querySelectorAll("a").forEach((a) => {
        const text = a.innerText.trim();
        const parts = text.split(/\s+/);
        const value = Number(parts.pop());
        const name = parts.join(" ");
        if (!isNaN(value)) teams.push({ team: name, value });
      });

      results.push({ countryRank: rank, country, totalPoints, seasonPoints, teams });
    });

    return results;
  });

  await browser.close();

  fs.writeFileSync("./data/countries.json", JSON.stringify(data, null, 2));
  console.log("SCRAPE RESULT:", data.length);
}

scrape();
