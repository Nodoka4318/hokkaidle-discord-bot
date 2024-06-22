import { Client, Collection, Events, GatewayIntentBits, REST, Routes } from "discord.js"

const Discord = require("discord.js")


const config = require('../config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// サーバーコマンド登録
client.commands = new Collection();

const rest = new REST().setToken(config.token);
const command = require("./hokkaidle");

client.commands.set(command.data.name, command);

(async () => {
    try {
        const data = await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: [command.data.toJSON()] },
        );
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log('Ready!');
    console.log(client.user?.tag);

    client.user?.setActivity("/hokkaidle");
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(config.token);

