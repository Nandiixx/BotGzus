const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { stopScheduler, isSchedulerRunning } = require("../utils/scheduler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stopscrape")
    .setDescription("Para o agendador automático de busca de vagas neste bot.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!isSchedulerRunning()) {
      return interaction.reply({
        content:
          "⚠️ O agendador já está parado. Reinicie o bot para retomar as buscas automáticas.",
        ephemeral: true,
      });
    }

    stopScheduler();

    await interaction.reply({
      content:
        "🛑 Agendador de busca de vagas parado com sucesso!\nAs buscas automáticas foram interrompidas. Reinicie o bot para retomá-las, ou use `/scrape` para realizar buscas manuais.",
      ephemeral: true,
    });
  },
};
