const axios = require("axios");
const cheerio = require("cheerio");
const { isWithinSixMonths } = require("../utils/dateFilter");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

async function scrape(keywords, location) {
  const jobs = [];
  const keyword = keywords.join(" ");
  const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&f_TPR=r3600&start=0`;

  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    $(".base-card").each((_, el) => {
      const title = $(el).find(".base-search-card__title").text().trim();
      const company = $(el).find(".base-search-card__subtitle").text().trim();
      const loc = $(el).find(".job-search-card__location").text().trim();
      const link = $(el).find("a.base-card__full-link").attr("href") || "";
      const postedAt = $(el).find("time").attr("datetime") || "Recentemente";

      if (!title || !link) return;
      if (!isWithinSixMonths(postedAt)) return;

      const id = `linkedin_${link.split("?")[0].split("/").pop()}`;
      jobs.push({
        id,
        title,
        company,
        location: loc,
        url: link.split("?")[0],
        postedAt,
        site: "LinkedIn",
      });
    });
  } catch (err) {
    console.error("[LinkedIn] Erro ao fazer scraping:", err.message);
  }

  return jobs;
}

module.exports = { scrape };
