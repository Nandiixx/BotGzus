const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setFilters } = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setfilters")
    .setDescription(
      "Define os filtros de busca de vagas (palavras-chave e localização).",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt
        .setName("keywords")
        .setDescription(
          "Palavras-chave separadas por vírgula (ex: desenvolvedor, programador, react)",
        )
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("localizacao")
        .setDescription("Localização (ex: São Paulo, Brasil, Remote)")
        .setRequired(false),
    ),

  async execute(interaction) {
    const rawKeywords = interaction.options.getString("keywords");
    const location = interaction.options.getString("localizacao") || "";

    const keywords = rawKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (keywords.length === 0) {
      return interaction.reply({
        content: "❌ Informe ao menos uma palavra-chave.",
        ephemeral: true,
      });
    }

    setFilters(interaction.guildId, keywords, location);

    await interaction.reply({
      content: `✅ Filtros definidos!\n**Keywords:** ${keywords.join(", ")}\n**Localização:** ${location || "Não definida"}\n\nAs vagas serão buscadas na próxima execução horária.`,
      ephemeral: true,
    });
  },
};
