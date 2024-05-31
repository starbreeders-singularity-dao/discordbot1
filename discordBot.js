const { Client, GatewayIntentBits } = require('discord.js');
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
        
        client.on('messageCreate', message => {
            console.log(`Received message: ${message.content}`);
            if (message.content === '!invite') {
                message.channel.send('Your invite code is: YOUR_INVITE_CODE');
                console.log('Sent invite code');
            }
        });
    },
    stop: () => {
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
