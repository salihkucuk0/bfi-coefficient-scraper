import fs from "fs";
import cheerio from "cheerio";

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
    if (!rank) return;

    const countryName = $(tds[1]).text().trim();
    const totalPoints = Number($(tds[2]).text().trim());
    const seasonPoints = Number($(tds[3]).text().trim());

    // TAKIMLAR
    const teams = [];
    $(tds[4])
      .find("a")
      .each((j, a) => {
        const full = $(a).text().trim();
        const parts = full.split(" ");
        const value = Number(parts.pop());
        const name = parts.join(" ");
        teams.push({ team: name, value });
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

  fs.writeFileSync(
    "./data/countries.json",
    JSON.stringify(countries, null, 2)
  );

  console.log("OK → countries.json güncellendi. Toplam:", countries.length);
}

run();
