const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../config.json'); // config’de ownerID olsun

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupverify')
        .setDescription('Verify butonlu mesaj gönderir'),
    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir!', ephemeral: true });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_button')
                    .setLabel('✅ Verify Ol')
                    .setStyle(ButtonStyle.Success)
            );

        const embed = new EmbedBuilder()
            .setColor(0x00FF99)
            .setTitle('Doğrulama Gerekli - MosterDev')
            .setDescription('Sunucumuza erişim sağlamak için aşağıdaki **Verify Ol** butonuna tıklayın.')
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: 'Güvenliğiniz için doğrulama gereklidir.' });

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Verify mesajı gönderildi!', ephemeral: true });
    }
};
