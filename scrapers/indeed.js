const axios = require("axios");

// Indeed blocks all bot traffic (Cloudflare). Replaced with Remotive —
// free public API, no key required: https://remotive.com/api/remote-jobs
// Remotive is English-only so Portuguese tech keywords are auto-translated.

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
    const { data } = await axios.get("https://remotive.com/api/remote-jobs", {
      params: { search: translated.join(" "), limit: 20 },
      timeout: 15000,
    });
    for (const job of data?.jobs || []) {
      if (!job.title || !job.url) continue;
      // post-filter: title must contain at least one translated keyword
      const titleLower = job.title.toLowerCase();
      if (!translated.some((k) => titleLower.includes(k.toLowerCase())))
        continue;
      jobs.push({
        id: `remotive_${job.id}`,
        title: job.title,
        company: job.company_name || "",
        location: job.candidate_required_location || "Remote",
        url: job.url,
        postedAt: job.publication_date
          ? new Date(job.publication_date).toLocaleDateString("pt-BR")
          : "Recentemente",
        site: "Remotive",
      });
    }
  } catch (err) {
    console.error("[Remotive] Erro ao fazer scraping:", err.message);
  }
  return jobs;
}

module.exports = { scrape };
