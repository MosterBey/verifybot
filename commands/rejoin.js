const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json'); // config import

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rejoin')
        .setDescription('Tüm yetkilendirilmiş kullanıcıları tekrar sunucuya davet eder'),
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

        let success = 0;
        let fail = 0;

        for (const userId of verifiedUsers) {
            try {
                const user = await client.users.fetch(userId).catch(() => null);
                if (!user) { fail++; continue; }

                const embed = new EmbedBuilder()
                    .setTitle('Sunucuya Tekrar Davet!')
                    .setDescription('Merhaba! Verify edilmiş olduğunuz sunucudan çıktığınız için sunucuya tekrar katılmanız için davet gönderildi.')
                    .setColor('Green')
                    .setThumbnail(interaction.guild.iconURL())
                    .addFields({ name: 'Sunucu Davet Linki', value: '[Katılmak için tıklayın](https://discord.gg/rYZmsEeZ)' })
                    .addFields({ name: 'Not', value: 'Bu link 7 gün geçerlidir. Sunucu kurallarına uymayı unutmayın! ve eğer bu bildirimi almak istemiyorsanız botu susturabilirsiniz.' })
                    .setTimestamp();

                await user.send({ embeds: [embed] });
                success++;
            } catch {
                fail++;
            }
        }

        await interaction.reply({ content: `✅ Davet gönderildi: ${success}\n❌ Gönderilemedi: ${fail}`, ephemeral: true });
    }
};
