const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

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
 * Builds an embed for a single job within a paginated list.
 * @param {Object} job
 * @param {number} page - 0-based index
 * @param {number} total - total number of jobs
 * @returns {EmbedBuilder}
 */
function buildJobEmbed(job, page, total) {
  return new EmbedBuilder()
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
    .setFooter({
      text: `Vaga ${page + 1} de ${total} • Publicado em: ${job.postedAt || "Recentemente"}`,
    })
    .setTimestamp(job.postedAt ? new Date(job.postedAt) : null);
}

/**
 * Builds a navigation ActionRow with Prev/Next buttons.
 * @param {number} page - current 0-based page
 * @param {number} total - total number of jobs
 * @returns {ActionRowBuilder}
 */
function buildNavRow(page, total) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("job_prev")
      .setLabel("◀ Anterior")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId("job_next")
      .setLabel("Próxima ▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === total - 1),
  );
}

/**
 * Sends a paginated embed for a list of jobs.
 * Users can navigate between jobs using ◀/▶ buttons.
 * Buttons are disabled after 30 minutes of inactivity.
 *
 * @param {import("discord.js").TextChannel} channel
 * @param {Object[]} jobs
 */
async function postJobsPaginated(channel, jobs) {
  if (!jobs || jobs.length === 0) return;

  let page = 0;
  const hasMultiple = jobs.length > 1;

  const message = await channel.send({
    embeds: [buildJobEmbed(jobs[0], 0, jobs.length)],
    components: hasMultiple ? [buildNavRow(0, jobs.length)] : [],
  });

  if (!hasMultiple) return;

  // 30-minute idle collector — resets on each interaction
  const collector = message.createMessageComponentCollector({
    idle: 30 * 60 * 1000,
  });

  collector.on("collect", async (interaction) => {
    await interaction.deferUpdate();

    if (interaction.customId === "job_prev" && page > 0) page--;
    else if (interaction.customId === "job_next" && page < jobs.length - 1)
      page++;

    await message
      .edit({
        embeds: [buildJobEmbed(jobs[page], page, jobs.length)],
        components: [buildNavRow(page, jobs.length)],
      })
      .catch(console.error);
  });

  collector.on("end", () => {
    // Disable both buttons after collector expires
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("job_prev")
        .setLabel("◀ Anterior")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("job_next")
        .setLabel("Próxima ▶")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
    );
    message.edit({ components: [disabledRow] }).catch(() => {});
  });
}

module.exports = { postJobsPaginated };
