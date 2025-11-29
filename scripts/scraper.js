import fs from "fs";
import puppeteer from "puppeteer";

async function scrape() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://www.football-coefficient.eu/", {
    waitUntil: "networkidle2",
  });

  // Tablonun tamamen yüklenmesini bekle
  await page.waitForSelector("table.el-table");

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

      const teamsTd = tds[7];
      const teamLinks = teamsTd.querySelectorAll("a");

      const teams = [];
      teamLinks.forEach((a) => {
        const text = a.innerText.trim();
        const parts = text.split(/\s+/);
        const value = Number(parts.pop());
        const name = parts.join(" ");
        if (!isNaN(value)) {
          teams.push({ team: name, value });
        }
      });

      results.push({
        countryRank: rank,
        country,
        totalPoints,
        seasonPoints,
        teams,
      });
    });

    return results;
  });

  await browser.close();

  fs.writeFileSync("./data/countries.json", JSON.stringify(data, null, 2));
  console.log("✔ Veriler güncellendi:", data.length);
}

scrape();
