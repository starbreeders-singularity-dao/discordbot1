const { Client, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const dotenv = require('dotenv');
dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let isBotRunning = false;

module.exports = {
    start: () => {
        if (!DISCORD_TOKEN) {
            console.error('DISCORD_TOKEN is not set');
            process.exit(1);
        }

        client.login(DISCORD_TOKEN)
            .then(() => {isBotRunning = true;})
            .catch(err => console.error('Failed to login:', err));

        client.once('ready', () => {
            console.log('Discord bot is ready and connected!');
        });
        
        client.on('messageCreate', async message => {
            const supabase = createClient(supabaseUrl, supabaseKey);

            if (message.content === '!invite') {
                try {
                    if (!message.author?.id) throw new Error('No author ID found in message');

                    const { data, error } = await supabase
                        .from("accounts")
                        .select("*")
                        .eq("discord_id", message.author.id);
                    
                    if (error) throw new Error('Failed to get data from Supabase:', error);

                    if (data.length) {
                        message.channel.send('Your invite code is: ' + data[0].invitation_code);
                        return;
                    } else {
                        const code = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6).toUpperCase();
                        const { data, error } = await supabase
                            .from("accounts")
                            .insert([{ discord_id: message.author.id, invitation_code: code }]);

                        if (error) {
                            throw new Error('Failed to insert data to Supabase:', error);
                        }
                        
                        message.channel.send('Your invite code is: ' + code);
                    }
                } catch (err) {
                    console.error('Failed to retrieve invite code:', err);
                    message.channel.send('Failed to retrieve your invite code.');
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
