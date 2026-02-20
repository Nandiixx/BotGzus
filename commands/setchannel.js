const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setChannel } = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription("Define o canal onde as vagas de emprego serão postadas.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName("canal")
        .setDescription("Canal de texto para receber as vagas")
        .setRequired(true),
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("canal");

    if (!channel.isTextBased()) {
      return interaction.reply({
        content: "❌ Selecione um canal de texto.",
        ephemeral: true,
      });
    }

    setChannel(interaction.guildId, channel.id);

    await interaction.reply({
      content: `✅ Canal de vagas definido para ${channel}.\nUse \`/setfilters\` para configurar palavras-chave e localização.`,
      ephemeral: true,
    });
  },
};
