const axios = require("axios");

// InfoJobs BR blocks all bot traffic. Replaced with Jobicy —
// free public API, no key required: https://jobicy.com/api/v2/remote-jobs
// Jobicy is English-only so Portuguese tech keywords are auto-translated.

const PT_TO_EN = {
  desenvolvedor: "developer",
  desenvolvimento: "development",
  programador: "programmer",
  engenheiro: "engineer",
  analista: "analyst",
  arquiteto: "architect",
  gerente: "manager",
  coordenador: "coordinator",
  dados: "data",
  segurança: "security",
  infraestrutura: "infrastructure",
  suporte: "support",
  frontend: "frontend",
  backend: "backend",
  fullstack: "fullstack",
  mobile: "mobile",
  devops: "devops",
  nuvem: "cloud",
  pleno: "mid-level",
  sênior: "senior",
  júnior: "junior",
};

function translate(keywords) {
  return keywords.map((k) => PT_TO_EN[k.toLowerCase()] || k);
}

async function scrape(keywords, _location) {
  const jobs = [];
  const seen = new Set();
  const translated = translate(keywords);

  for (const kw of translated) {
    try {
      const { data } = await axios.get(
        "https://jobicy.com/api/v2/remote-jobs",
        {
          params: { tag: kw, count: 20 },
          timeout: 15000,
        },
      );
      for (const job of data?.jobs || []) {
        if (!job.jobTitle || !job.url || seen.has(job.id)) continue;
        seen.add(job.id);
        jobs.push({
          id: `jobicy_${job.id}`,
          title: job.jobTitle,
          company: job.companyName || "",
          location: job.jobGeo || "Remote",
          url: job.url,
          postedAt: job.pubDate
            ? new Date(job.pubDate).toLocaleDateString("pt-BR")
            : "Recentemente",
          site: "Jobicy",
        });
      }
    } catch (err) {
      console.error(`[Jobicy] Erro ao fazer scraping (${kw}):`, err.message);
    }
  }
  return jobs;
}

module.exports = { scrape };
