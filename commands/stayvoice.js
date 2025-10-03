const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json'); // ← config import
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stayvoice')
        .setDescription('Botu belirli bir sesli kanalda tutar')
        .addChannelOption(option => option.setName('channel').setDescription('Sesli kanal').setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
                if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: '❌ Sadece bot sahibi kullanabilir!', ephemeral: true });
        }
        if (!channel || channel.type !== 2) // 2 = GUILD_VOICE
            return interaction.reply({ content: '❌ Lütfen bir sesli kanal seçin!', ephemeral: true });

        try {
            joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            await interaction.reply({ content: `✅ Bot artık <#${channel.id}> kanalında kalacak!`, ephemeral: true });
        } catch (err) {
            console.log(err);
            await interaction.reply({ content: '❌ Bot kanala katılamadı!', ephemeral: true });
        }
    }
};
