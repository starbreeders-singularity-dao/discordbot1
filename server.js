const http = require('http');
const discordBot = require('./discordBot');

function startServer() {
    const server = http.createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
    }).listen(8080);

    console.log('Server running');
    return server;
}

discordBot.start();

startServer();

function handleExit(signal) {
    console.log(`Received ${signal}. Stopping discordBot...`);
    discordBot.stop(() => {
        console.log('discordBot stopped.');
        process.exit(0);
    });
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('exit', handleExit);
