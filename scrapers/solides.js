const axios = require("axios");
const cheerio = require("cheerio");
const { isWithinSixMonths } = require("../utils/dateFilter");

// Sólides Vagas — portal brasileiro com SSR, sem autenticação necessária.
// URL de busca: https://vagas.solides.com.br/vagas/todos/{keyword}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  Referer: "https://www.google.com.br/",
};

/**
 * Converte textos relativos do Sólides em Date absoluto.
 * "Postada hoje" → hoje
 * "Postada há 3 dias" → 3 dias atrás
 * "Postada há 2 semanas" → 2 semanas atrás
 * "Postada há 1 mês" → 1 mês atrás
 * Retorna null quando não parseável (filtro inclui a vaga por segurança).
 */
function parseRelativeDate(text) {
  if (!text) return null;
  const t = text.toLowerCase().trim();

  if (t.includes("hoje") || t.includes("agora")) return new Date();

  const match = t.match(
    /h[aá]\s+(\d+)\s+(dia|dias|semana|semanas|m[eê]s|meses)/,
  );
  if (!match) return null;

  const n = parseInt(match[1], 10);
  const unit = match[2];
  const d = new Date();

  if (unit.startsWith("dia")) {
    d.setDate(d.getDate() - n);
  } else if (unit.startsWith("semana")) {
    d.setDate(d.getDate() - n * 7);
  } else {
    d.setMonth(d.getMonth() - n);
  }

  return d;
}

async function scrape(keywords, location) {
  const jobs = [];
  const seen = new Set();

  for (const kw of keywords) {
    try {
      const slug = kw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");

      const { data } = await axios.get(
        `https://vagas.solides.com.br/vagas/todos/${encodeURIComponent(slug)}`,
        { headers: HEADERS, timeout: 15000 },
      );

      const $ = cheerio.load(data);

      // Cada card de vaga contém um <a href="/vaga/{id}/{slug}">
      // Usamos Set por jobId para evitar duplicatas quando um card
      // tem dois links apontando para a mesma vaga (título + "Ver mais").
      $('a[href*="/vaga/"]').each((_, el) => {
        const href = $(el).attr("href") || "";
        const idMatch = href.match(/\/vaga\/(\d+)\//);
        if (!idMatch) return;

        const jobId = `solides_${idMatch[1]}`;
        if (seen.has(jobId)) return;

        const title = $(el).text().trim().replace(/\s+/g, " ");
        if (!title || title.toLowerCase() === "ver mais detalhes") return;

        const jobUrl = href.startsWith("http")
          ? href
          : `https://vagas.solides.com.br${href}`;

        // Sobe para o card pai tentando article > div > li
        const card = $(el)
          .closest("article, li, [class*='card'], [class*='job']")
          .first();
        const ctx = card.length ? card : $(el).parent().parent();
        const cardText = ctx.text();

        // Empresa: subdomínio *.vagas.solides.com.br no card
        let company = "";
        ctx.find('a[href*=".vagas.solides.com.br"]').each((_, a) => {
          const h = $(a).attr("href") || "";
          const m = h.match(/https?:\/\/([^.]+)\.vagas\.solides/);
          if (m && m[1] !== "vagas") {
            company = m[1].replace(/-/g, " ");
            return false; // break
          }
        });

        // Localização: padrão "Cidade - UF" ou "Cidade/UF"
        const locMatch = cardText.match(
          /([A-ZÀ-Úa-zà-ú][A-ZÀ-Úa-zà-ú\s]+[-\/][A-Z]{2})/,
        );
        const loc = locMatch ? locMatch[1].trim() : location || "Não informado";

        // Filtro por localização (quando definida pelo usuário)
        if (location && loc !== "Não informado") {
          const cityFilter = location.split(",")[0].toLowerCase().trim();
          if (!loc.toLowerCase().includes(cityFilter)) return;
        }

        // Data de postagem
        const dateMatch = cardText.match(/Postada\s+(.+?)(?:\n|\s{2,}|$)/i);
        const rawDate = dateMatch ? dateMatch[1].trim() : null;
        const parsedDate = parseRelativeDate(rawDate);

        if (!isWithinSixMonths(parsedDate)) return;

        seen.add(jobId);
        jobs.push({
          id: jobId,
          title,
          company,
          location: loc,
          url: jobUrl,
          postedAt: parsedDate
            ? parsedDate.toLocaleDateString("pt-BR")
            : rawDate || "Recentemente",
          site: "Sólides",
        });
      });
    } catch (err) {
      console.error(`[Sólides] Erro ao fazer scraping (${kw}):`, err.message);
    }
  }

  return jobs;
}

module.exports = { scrape };
