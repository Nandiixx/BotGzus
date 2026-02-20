const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setGuildInterval, getGuildInterval } = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setinterval")
    .setDescription(
      "Define o intervalo de tempo entre as buscas automáticas de vagas.",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption((opt) =>
      opt
        .setName("horas")
        .setDescription(
          "Intervalo em horas entre cada busca automática (1–168)",
        )
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(168),
    ),

  async execute(interaction) {
    const hours = interaction.options.getInteger("horas");
    const guildId = interaction.guildId;

    const previous = getGuildInterval(guildId);
    setGuildInterval(guildId, hours);

    const label = hours === 1 ? "1 hora" : `${hours} horas`;
    const previousLabel = previous === 1 ? "1 hora" : `${previous} horas`;

    await interaction.reply({
      content:
        `✅ Intervalo de busca atualizado de **${previousLabel}** para **${label}**.\n` +
        `As vagas serão buscadas automaticamente a cada **${label}**.`,
      ephemeral: true,
    });
  },
};
