const axios = require("axios");

// Glassdoor blocks all bot traffic (Cloudflare). Replaced with Arbeitnow —
// free public JSON API, no key required: https://www.arbeitnow.com/api/job-board-api
// Arbeitnow is English-only so Portuguese tech keywords are auto-translated.

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
  const translated = translate(keywords);
  try {
    const { data } = await axios.get(
      "https://www.arbeitnow.com/api/job-board-api",
      {
        params: { search: translated.join(" ") },
        timeout: 15000,
      },
    );
    for (const job of data?.data || []) {
      if (!job.title || !job.url) continue;
      // post-filter: title must contain at least one translated keyword
      const titleLower = job.title.toLowerCase();
      if (!translated.some((k) => titleLower.includes(k.toLowerCase())))
        continue;
      jobs.push({
        id: `arbeitnow_${job.slug}`,
        title: job.title,
        company: job.company_name || "",
        location: job.location || (job.remote ? "Remote" : "Não informado"),
        url: job.url,
        postedAt: job.created_at
          ? new Date(job.created_at * 1000).toLocaleDateString("pt-BR")
          : "Recentemente",
        site: "Arbeitnow",
      });
    }
  } catch (err) {
    console.error("[Arbeitnow] Erro ao fazer scraping:", err.message);
  }
  return jobs;
}

module.exports = { scrape };
