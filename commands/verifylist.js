const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json'); // ← config import

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verifylist')
        .setDescription('Verify olmuş kullanıcıları listeler'),
    async execute(interaction, client, db) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir!', ephemeral: true });
        }

        const allData = await db.all();
        const verifiedUsers = allData
            .filter(entry => entry.value?.verified)
            .map(entry => entry.id.replace('verify_', ''));

        if (verifiedUsers.length === 0) {
            return interaction.reply({ content: '✅ Henüz verify edilmiş kullanıcı yok.', ephemeral: true });
        }

        const guild = await client.guilds.fetch(config.guildID);
        const memberList = [];

        for (const userId of verifiedUsers) {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) memberList.push(`<@${member.id}>`);
        }

        const embed = new EmbedBuilder()
            .setTitle('✅ Verify Olmuş Kullanıcılar')
            .setDescription(memberList.length > 0 ? memberList.join('\n') : 'Sunucuda verify olmuş kullanıcı yok.')
            .addFields({ name: 'Toplam', value: `${memberList.length}`, inline: true })
            .setColor('Blue')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
