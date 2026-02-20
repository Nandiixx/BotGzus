const linkedin = require("./linkedin");
const indeed = require("./indeed");
const glassdoor = require("./glassdoor");
const catho = require("./catho");
const infojobs = require("./infojobs");
const gupy = require("./gupy");
const solides = require("./solides");

const SCRAPERS = {
  linkedin,
  indeed,
  glassdoor,
  catho,
  infojobs,
  gupy,
  solides,
};

/**
 * Runs all scrapers in parallel for the given keywords and location.
 * Returns a deduplicated flat array of job objects.
 * @param {string[]} keywords
 * @param {string} location
 * @returns {Promise<Object[]>}
 */
async function scrapeAll(keywords, location) {
  const results = await Promise.allSettled(
    Object.entries(SCRAPERS).map(([name, scraper]) =>
      scraper.scrape(keywords, location).catch((err) => {
        console.error(`[${name}] Falha:`, err.message);
        return [];
      }),
    ),
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

module.exports = { scrapeAll };
