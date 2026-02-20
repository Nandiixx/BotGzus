const { EmbedBuilder } = require("discord.js");

const SITE_COLORS = {
  LinkedIn: 0x0077b5,
  Remotive: 0x4353ff,
  Arbeitnow: 0x00c896,
  "Vagas.com.br": 0xe8242a,
  Jobicy: 0xff6600,
  Gupy: 0x00b2a9,
  Sólides: 0x6c3bbf,
};

const SITE_ICONS = {
  LinkedIn: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
  Remotive: "https://remotive.com/favicon.ico",
  Arbeitnow: "https://www.arbeitnow.com/favicon.ico",
  "Vagas.com.br": "https://www.vagas.com.br/favicon.ico",
  Jobicy: "https://jobicy.com/favicon.ico",
  Gupy: "https://portal.gupy.io/favicon.ico",
  Sólides: "https://vagas.solides.com.br/favicon.ico",
};

/**
 * Sends a job embed to the given channel.
 * @param {import("discord.js").TextChannel} channel
 * @param {Object} job
 */
async function postJob(channel, job) {
  const embed = new EmbedBuilder()
    .setColor(SITE_COLORS[job.site] || 0x5865f2)
    .setTitle(job.title)
    .setURL(job.url)
    .setAuthor({ name: job.site, iconURL: SITE_ICONS[job.site] })
    .addFields(
      {
        name: "🏢 Empresa",
        value: job.company || "Não informado",
        inline: true,
      },
      {
        name: "📍 Localização",
        value: job.location || "Não informado",
        inline: true,
      },
    )
    .setFooter({ text: `Publicado em: ${job.postedAt || "Recentemente"}` })
    .setTimestamp(job.postedAt ? new Date(job.postedAt) : null);

  await channel.send({ embeds: [embed] });
}

module.exports = { postJob };
