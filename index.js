const { Client, GatewayIntentBits, Partials, Collection, Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes } = require('discord.js');
const fs = require('fs');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// Kod üretme fonksiyonu
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Ready
client.once(Events.ClientReady, async c => {
    console.log(`✅ Bot hazır! Kullanıcı: ${c.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(config.token);
    const commandsArray = [];
    const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());
    }

    try {
        console.log(`Slash komutları ${config.guildID} sunucusuna yükleniyor...`);
        await rest.put(
            Routes.applicationGuildCommands(c.user.id, config.guildID),
            { body: commandsArray }
        );
        console.log('Slash komutları yüklendi!');
    } catch (err) {
        console.error(err);
    }
});

// InteractionCreate
client.on(Events.InteractionCreate, async interaction => {

    // Slash komutlar
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try { await command.execute(interaction, client, db); }
        catch (err) { console.error(err); await interaction.reply({ content: 'Komut çalıştırılamadı!', ephemeral: true }); }
    }

    // Verify butonuna basınca DM ve ephemeral buton
    if (interaction.isButton() && interaction.customId === 'verify_button') {
        const code = generateCode();
        await db.set(`verify_${interaction.user.id}`, { verified: false, code, attempts: 0, timestamp: Date.now() });

        try { await interaction.user.send(`Doğrulama kodunuz: **${code}** (10 dakika geçerlidir)`); } 
        catch(err){ console.log('DM açılamadı:', interaction.user.id); }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_modal_button')
                    .setLabel('Kod Gir ve Doğrula')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ content: '✅ DM’de aldığınız kodu girmek için aşağıdaki butona basın.', components: [row], ephemeral: true });
    }

    // Sunucudaki modal butonu
    if (interaction.isButton() && interaction.customId === 'verify_modal_button') {
        const modal = new ModalBuilder()
            .setCustomId('verify_modal')
            .setTitle('Doğrulama Kodu');

        const codeInput = new TextInputBuilder()
            .setCustomId('code_input')
            .setLabel('DM’den aldığınız kodu girin')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(codeInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    // Modal submit
    if (interaction.isModalSubmit() && interaction.customId === 'verify_modal') {
        const dbData = await db.get(`verify_${interaction.user.id}`);
        if (!dbData) return interaction.reply({ content: 'Doğrulama başlatılmamış!', ephemeral: true });
        if (dbData.verified) return interaction.reply({ content: 'Zaten doğrulanmışsınız!', ephemeral: true });

        const userCode = interaction.fields.getTextInputValue('code_input');

        if (Date.now() - dbData.timestamp > 10*60*1000) {
            await db.delete(`verify_${interaction.user.id}`);
            return interaction.reply({ content: '❌ Kodun süresi doldu! Yeni verify başlatın.', ephemeral: true });
        }

        if(userCode !== dbData.code) {
            await db.add(`verify_${interaction.user.id}.attempts`, 1);
            const attempts = (await db.get(`verify_${interaction.user.id}.attempts`)) || 0;

            const guild = await client.guilds.fetch(config.guildID);
            const logChannel = guild.channels.cache.get(config.logChannelID);
            if(logChannel) logChannel.send(`❌ <@${interaction.user.id}> yanlış kod denedi. (${attempts}/3)`);

            if(attempts >= 3){
                await db.delete(`verify_${interaction.user.id}`);
                return interaction.reply({ content: '❌ 3 yanlış deneme yaptınız! Kod iptal edildi, yeni verify başlatın.', ephemeral: true });
            }

            return interaction.reply({ content: `❌ Kod yanlış! Kalan hakkınız: ${3-attempts}`, ephemeral: true });
        }

        await db.set(`verify_${interaction.user.id}.verified`, true);

        const guild = await client.guilds.fetch(config.guildID);
        const member = await guild.members.fetch(interaction.user.id).catch(()=>null);
        if(member){
            try{ await member.roles.add(config.verifyRoleID); } catch(err){ console.log(err); }
        }

        const logChannel = guild.channels.cache.get(config.logChannelID);
        if(logChannel) logChannel.send(`✅ <@${interaction.user.id}> başarıyla doğrulandı ve rol verildi! Hoş geldin!`);

        await interaction.reply({ content: '✅ Doğrulama başarılı, rolünüz verildi!', ephemeral: true });
    }
});

client.login(config.token);
