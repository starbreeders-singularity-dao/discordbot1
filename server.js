const http = require('http');
const discordBot = require('./discordBot');

console.log('Starting Discord bot...');
discordBot.start();

http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
}).listen(8080);
