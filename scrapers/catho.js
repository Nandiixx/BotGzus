const axios = require("axios");
const cheerio = require("cheerio");

// Catho blocks all bot traffic. Replaced with Vagas.com.br —
// major Brazilian job board with server-side rendered pages (no JS needed).

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  Referer: "https://www.google.com.br/",
  Connection: "keep-alive",
};

async function scrape(keywords, location) {
  const jobs = [];
  const seen = new Set();

  for (const kw of keywords) {
    try {
      const keyword = kw.toLowerCase().replace(/\s+/g, "-");
      const loc = location
        ? `-em-${encodeURIComponent(location.toLowerCase().replace(/\s+/g, "-"))}`
        : "";

      const { data } = await axios.get(
        `https://www.vagas.com.br/vagas-de-${keyword}${loc}`,
        { headers: HEADERS, timeout: 15000 },
      );

      const $ = cheerio.load(data);
      $("li.vaga").each((_, el) => {
        const anchor = $(el).find("a.link-detalhes-vaga").first();
        const title = anchor.text().trim().replace(/\s+/g, " ");
        const href = anchor.attr("href") || "";
        const jobId = anchor.attr("data-id-vaga") || href.replace(/\D/g, "");
        const company = $(el).find(".emprVaga").first().text().trim();
        const loc = $(el)
          .find(".vaga-local")
          .first()
          .text()
          .trim()
          .split("\n")[0]
          .trim();

        if (!title || !href || seen.has(jobId)) return;
        seen.add(jobId);
        jobs.push({
          id: `vagas_${jobId}`,
          title,
          company,
          location: loc || location,
          url: `https://www.vagas.com.br${href}`,
          postedAt: "Recentemente",
          site: "Vagas.com.br",
        });
      });
    } catch (err) {
      console.error(
        `[Vagas.com.br] Erro ao fazer scraping (${kw}):`,
        err.message,
      );
    }
  }
  return jobs;
}

module.exports = { scrape };
