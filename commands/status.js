const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getGuild } = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription(
      "Mostra a configuração atual do bot de vagas neste servidor.",
    ),

  async execute(interaction) {
    const config = getGuild(interaction.guildId);

    const channel = config?.channelId
      ? `<#${config.channelId}>`
      : "Não configurado";
    const keywords =
      config?.filters?.keywords?.length > 0
        ? config.filters.keywords.join(", ")
        : "Não configurado";
    const location = config?.filters?.location || "Não configurada";

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("⚙️ Status do Bot de Vagas")
      .addFields(
        { name: "📢 Canal", value: channel, inline: false },
        { name: "🔍 Keywords", value: keywords, inline: true },
        { name: "📍 Localização", value: location, inline: true },
        { name: "⏱️ Frequência", value: "A cada 1 hora", inline: false },
      )
      .setFooter({ text: "Use /setchannel e /setfilters para configurar" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
