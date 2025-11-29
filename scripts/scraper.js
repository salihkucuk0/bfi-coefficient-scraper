import fs from "fs";
import puppeteer from "puppeteer";
import { JSDOM } from "jsdom";

async function scrape() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.goto("https://www.football-coefficient.eu/", {
    waitUntil: "networkidle2",
  });

  const html = await page.content();
  await browser.close();

  // DEBUG KAYDI
  fs.writeFileSync("./data/debug.html", html);

  // DOM Parse
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const rows = document.querySelectorAll("table.el-table tbody tr");

  const result = [];

  rows.forEach((row) => {
    const tds = row.querySelectorAll("td");
    if (tds.length < 7) return;

    const rank = Number(tds[0].textContent.trim());
    const totalPoints = Number(tds[2].textContent.trim());
    const seasonPoints = Number(tds[3].textContent.trim());

    // COUNTRY → flag img alt="England" şeklinde
    const img = tds[1].querySelector("img");
    const countryName = img ? img.alt.trim() : null;

    // TAKIMLAR
    const teamLinks = tds[6].querySelectorAll("a");
    const teams = [];

    teamLinks.forEach((a) => {
      const nameDiv = a.querySelector("div > div:first-child");
      const valDiv = a.querySelector("div > div:last-child");

      if (!nameDiv || !valDiv) return;

      const team = nameDiv.textContent.trim();
      const value = Number(valDiv.textContent.trim());

      teams.push({ team, value });
    });

    result.push({
      rank,
      country: countryName,
      totalPoints,
      seasonPoints,
      teams,
    });
  });

  fs.writeFileSync("./data/countries.json", JSON.stringify(result, null, 2));

  console.log("✔ BİTTİ! Ülke sayısı:", result.length);
}

scrape();
