const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getGuild, isJobPosted, markJobPosted } = require("../utils/db");
const { scrapeAll } = require("../scrapers");
const { postJob } = require("../utils/poster");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("scrape")
    .setDescription(
      "Busca vagas de emprego agora e as posta no canal configurado.",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const config = getGuild(interaction.guildId);

    if (!config?.channelId) {
      return interaction.reply({
        content: "❌ Nenhum canal configurado. Use `/setchannel` primeiro.",
        ephemeral: true,
      });
    }

    const { keywords = [], location = "" } = config.filters || {};
    if (keywords.length === 0) {
      return interaction.reply({
        content: "❌ Nenhum filtro configurado. Use `/setfilters` primeiro.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const channel = await interaction.client.channels
      .fetch(config.channelId)
      .catch(() => null);
    if (!channel) {
      return interaction.editReply({
        content: "❌ Canal não encontrado. Reconfigure com `/setchannel`.",
      });
    }

    const jobs = await scrapeAll(keywords, location);

    let posted = 0;
    for (const job of jobs) {
      if (!job.id || isJobPosted(job.id)) continue;
      try {
        await postJob(channel, job);
        markJobPosted(job.id);
        posted++;
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`[/scrape] Erro ao postar vaga ${job.id}:`, err.message);
      }
    }

    await interaction.editReply({
      content: `✅ Busca concluída!\n**Total encontrado:** ${jobs.length}\n**Novas vagas postadas:** ${posted}\n**Já postadas anteriormente:** ${jobs.length - posted}`,
    });
  },
};
