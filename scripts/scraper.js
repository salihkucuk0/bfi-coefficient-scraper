import fs from "fs";
import * as cheerio from "cheerio";

const URL = "https://www.football-coefficient.eu/";

async function scrapeCountries() {
  const res = await fetch(URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });
  const html = await res.text();

  const $ = cheerio.load(html);

  const rows = $("table.el-table tbody tr");
  const result = [];

  rows.each((i, row) => {
    const tds = $(row).find("td");
    if (tds.length < 5) return;

    const rank = Number($(tds[0]).text().trim());
    if (!rank || isNaN(rank)) return;

    const countryName = $(tds[1]).text().trim();
    const totalPoints = Number($(tds[2]).text().trim());
    const seasonPoints = Number($(tds[3]).text().trim());

    // TAKIMLAR
    const teams = [];
    const teamLinks = $(tds[4]).find("a");

    teamLinks.each((j, a) => {
      const raw = $(a).text().trim();  
      const parts = raw.split(" ");
      const value = Number(parts.pop());
      const name = parts.join(" ");
      if (!isNaN(value)) {
        teams.push({ team: name, value });
      }
    });

    result.push({
      countryRank: rank,
      country: countryName,
      totalPoints,
      seasonPoints,
      teams,
    });
  });

  return result;
}

async function run() {
  const countries = await scrapeCountries();

  fs.writeFileSync("./data/countries.json", JSON.stringify(countries, null, 2));

  console.log("✔ countries.json güncellendi! Ülke sayısı:", countries.length);
}

run();
