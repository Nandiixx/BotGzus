const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { resetPostedJobs } = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetdb")
    .setDescription(
      "Limpa o histórico de vagas já postadas, permitindo que sejam postadas novamente.",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const count = resetPostedJobs(interaction.guildId);

    await interaction.reply({
      content: `✅ Banco de dados resetado com sucesso!\n**${count} vagas removidas** do histórico.\nAs próximas buscas irão postar todas as vagas encontradas novamente.`,
      ephemeral: true,
    });
  },
};
