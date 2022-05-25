const {SlashCommandBuilder} = require('@discordjs/builders');
const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const {Client, Intents} = require('discord.js');

const commands = [
    new SlashCommandBuilder()
    .setName('e')
    .setDescription('Elevator Bot')
    .addStringOption(option => {
        return option
        .setName('voice-channel')
        .setDescription('Voice channel')
        .setRequired(true);
    })
    .toJSON()
];

const rest = new REST({
    version: '9'
}).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('Refreshing application "/" commands');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            {
                body: commands
            }
        );

        console.log('Successfully refreshed application "/" commands');
    } catch (error) {
        console.error(error);
    }
})();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

client.on('ready', () => {
    console.log('Ready!');
});

async function elevator(interaction, targetVCh, vChannels) {
    let position = interaction.member.voice.channel.rawPosition;
    const direction = targetVCh.rawPosition > position ? 1 : -1;
    let timer = Date.now();

    while (targetVCh.rawPosition != position) {
        const now = Date.now();

        if (now - timer < 1500) {
            continue;
        }

        position += direction;
        timer = now;

        let fail;

        await interaction.member.voice.setChannel(vChannels.at(position)).catch(() => fail = true);

        if (fail) {
            interaction.reply('Something went wrong.');

            break;
        }
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    if (interaction.commandName != 'e') {
        return;
    }

    if (!interaction.member.voice.channel) {
        interaction.reply('You are not in a voice channel!');

        return;
    }

    const targetVChName = interaction.options.getString('voice-channel').toLowerCase();
    const vChannels = interaction.guild.channels.cache.filter(channel => channel.type == 'GUILD_VOICE').sort((chA, chB) => chA.rawPosition > chB.rawPosition ? 1 : -1);

    const targetVCh_ = vChannels.filter(channel => channel.name.toLowerCase() == targetVChName);

    if (targetVCh_.size <= 0) {
        interaction.reply(`Voice channel not found: ${targetVChName}`);

        return;
    }

    const targetVCh = targetVCh_.at(0);

    elevator(interaction, targetVCh, vChannels);

    interaction.reply(`Elevator: ${targetVChName}`);
});

client.login(process.env.BOT_TOKEN);
