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

/** Keywords that indicate a fully remote / location-agnostic listing. */
const REMOTE_TERMS = [
  "remote",
  "remoto",
  "worldwide",
  "anywhere",
  "global",
  "home office",
];

/**
 * Normalises a string for comparison: lowercase + remove diacritics.
 * @param {string} str
 * @returns {string}
 */
function normalise(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Returns true when the job's location is compatible with the user's filter.
 *
 * Rules:
 *  1. No filter → always pass.
 *  2. Job location is "Não informado" / empty → pass (benefit of the doubt).
 *  3. Job is explicitly remote/worldwide → pass (remote jobs are always relevant).
 *  4. Any significant token (> 2 chars) of the filter appears in the job location → pass.
 *
 * @param {string} jobLocation
 * @param {string} filterLocation
 * @returns {boolean}
 */
function matchesLocation(jobLocation, filterLocation) {
  if (!filterLocation) return true;

  const jobLoc = normalise(jobLocation || "");

  if (!jobLoc || jobLoc === "nao informado") return true;

  if (REMOTE_TERMS.some((t) => jobLoc.includes(t))) return true;

  const filterNorm = normalise(filterLocation);
  // Split on commas, slashes and whitespace; keep tokens longer than 2 chars
  const tokens = filterNorm.split(/[\s,/]+/).filter((t) => t.length > 2);

  return tokens.some((token) => jobLoc.includes(token));
}

/**
 * Runs all scrapers in parallel for the given keywords and location.
 * Returns a deduplicated, location-filtered flat array of job objects.
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

  const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  if (!location) return all;

  const filtered = all.filter((job) => matchesLocation(job.location, location));
  console.log(
    `[scrapeAll] Filtro de localização "${location}": ${all.length} → ${filtered.length} vagas.`,
  );
  return filtered;
}

module.exports = { scrapeAll };
