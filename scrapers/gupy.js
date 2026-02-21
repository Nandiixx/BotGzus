const axios = require("axios");

// Gupy expõe uma API pública centralizada que agrega vagas de todos os
// portais de empresas com domínio próprio (ex.: empresa.gupy.io).
// Assim não precisamos lidar com subdomínios individuais.
// Endpoint: https://portal.api.gupy.io/api/v1/jobs
// Nenhuma chave de API necessária.

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Accept: "application/json",
};

async function scrape(keywords, location) {
  const jobs = [];
  const seen = new Set();

  for (const kw of keywords) {
    try {
      const params = {
        jobName: kw,
        limit: 20,
        offset: 0,
        isPublished: true,
      };

      // A API aceita "city" com o nome da cidade como texto livre.
      // Usa apenas o primeiro segmento (antes da vírgula) para evitar
      // que "São Paulo, Brasil" não retorne nenhum resultado.
      if (location) {
        params.city = location.split(",")[0].trim();
      }

      const { data } = await axios.get(
        "https://portal.api.gupy.io/api/v1/jobs",
        {
          params,
          headers: HEADERS,
          timeout: 15000,
        },
      );

      for (const job of data?.data || []) {
        if (!job.name || seen.has(job.id)) continue;
        // Ignora vagas que não estão abertas para candidatura
        if (job.isPublished === false) continue;
        if (job.status && job.status !== "published") continue;
        seen.add(job.id);

        // jobUrl já vem como URL completa tipo https://empresa.gupy.io/jobs/123
        // fallback: monta a partir do careerPageUrl
        const jobUrl =
          job.jobUrl ||
          (job.careerPageUrl
            ? `https://${job.careerPageUrl}/jobs/${job.id}`
            : null);

        if (!jobUrl) continue;

        const loc =
          [job.city, job.state].filter(Boolean).join(", ") ||
          location ||
          "Não informado";

        jobs.push({
          id: `gupy_${job.id}`,
          title: job.name,
          company: job.careerPageName || "",
          location: loc,
          url: jobUrl,
          postedAt: job.publishedDate
            ? new Date(job.publishedDate).toLocaleDateString("pt-BR")
            : "Recentemente",
          site: "Gupy",
        });
      }
    } catch (err) {
      console.error(`[Gupy] Erro ao fazer scraping (${kw}):`, err.message);
    }
  }

  return jobs;
}

module.exports = { scrape };
