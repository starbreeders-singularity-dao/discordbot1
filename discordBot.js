const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let isBotRunning = false;

module.exports = {
    start: () => {
        if (!DISCORD_TOKEN) {
            console.error('DISCORD_TOKEN is not set');
            process.exit(1);
        }

        client.login(DISCORD_TOKEN)
            .then(() => { isBotRunning = true; })
            .catch(err => console.error('Failed to login:', err));

        client.once('ready', async () => {
            console.log('Discord bot is ready and connected!');

            const commands = [
                new SlashCommandBuilder()
                    .setName('invite')
                    .setDescription('Get your invite code'),
            ].map(command => command.toJSON());

            const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

            try {
                console.log('Started refreshing application (/) commands.');

                await rest.put(
                    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                    { body: commands },
                );

                console.log('Successfully reloaded application (/) commands.');
            } catch (error) {
                console.error(error);
            }
        });

        client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;

            const { commandName } = interaction;

            if (commandName === 'invite') {
                const supabase = createClient(supabaseUrl, supabaseKey);

                try {
                    if (!interaction.user?.id) throw new Error('No author ID found in interaction');

                    const { data, error } = await supabase
                        .from("accounts")
                        .select("*")
                        .eq("discord_id", interaction.user.id);

                    if (error) throw new Error('Failed to get data from Supabase:', error);

                    if (data.length) {
                        await interaction.reply({ content: 'Your invite code is: ' + data[0].invitation_code, ephemeral: true });
                        return;
                    } else {
                        const code = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6).toUpperCase();
                        const { data, error } = await supabase
                            .from("accounts")
                            .insert([{ discord_id: interaction.user.id, invitation_code: code }]);

                        if (error) {
                            throw new Error('Failed to insert data to Supabase:', error);
                        }

                        await interaction.reply({ content: 'Your invite code is: ' + code, ephemeral: true });
                    }
                } catch (err) {
                    console.error('Failed to retrieve invite code:', err);
                    await interaction.reply({ content: 'Failed to retrieve your invite code.', ephemeral: true });
                }
            }
        });
    },
    stop: (callback) => {
        if (!isBotRunning) {
            console.log('Discord bot is not running.');
            if (callback) callback();
            return;
        }

        client.destroy().then(() => {
            console.log('Discord bot stopped.');
            isBotRunning = false;
            if (callback) callback();
        }).catch(err => {
            console.error('Failed to stop Discord bot:', err);
            if (callback) callback(err);
        });
    }
};
