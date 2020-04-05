const Discord = require('discord.js');
const TuneIn = require('node-tunein-radio');
const _ = require('lodash');
const axios = require('axios');
const ytdl = require('ytdl-core');
require('dotenv').config();

const tunein = new TuneIn();
const client = new Discord.Client();

client.once('ready', async () => {
    console.log('DJ Discord at the wheels of steel');

    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    const connection = await channel.join();
    const mention_tag = new RegExp(`<@[!&#]?${client.user.id}>`);

    function play(url) {
        connection.play(url, {volume: false, bitrate: 64, plp: 10, fec: true });
    }

    client.on('message', async message => {
        if (message.author.bot) return;

        if (!mention_tag.test(message.content) && !(message.channel instanceof Discord.DMChannel)) {
            return;
        }

        let msg = message.content.replace(mention_tag, '').trim();
        console.log('< ' + msg);

        switch(msg.toLowerCase()) {
            case 'stop':
            case 'stahp':
            case 'staahp':
            case 'staaahp':
            case 'staaaahp':
                message.channel.send('Stopping');
                if (connection.dispatcher) {
                    connection.dispatcher.end();
                }
                return;
            case 'rr':
            case 'dj bakvis':
                msg = 'https://www.youtube.com/watch?v=TzXXHVhGXTQ';
                break;
            case '?':
            case 'help':
                message.channel.send('You can send me any stream or youtube URL or the name of a Tunein.FM radio station.');
                return;
        }

        if (msg.startsWith('http')) {
            ytdl.getInfo(msg, (err, info) => {
                if (err) {
                    message.channel.send('Playing: ' + msg);
                    play(msg);
                    return;
                }
                message.channel.send('Playing: ' + info.title);
                play(ytdl(info.video_url));
            });
            return;
        }

        tunein.search(msg).then(function(results) {
            const res = _.filter(results.body, function(item) { return item.item == 'station' });
            const single = _.filter(res, function(item) { return item.text.toUpperCase() === msg.toUpperCase() });

            if (res.length == 1 && single.length != 1) {
                single[0] = res[0];
            }
            if (single.length == 1) {
                message.channel.send('Playing: ' + single[0].text);
                axios.get(single[0].URL).then(res => {
                    const url = res.data.split("\n")[0].trim();
                    play(url);
                });
                return;
            }

            if (res.length > 1) {
                message.channel.send("To many results ("+res.length+"), please specify");
                if (res.length < 10) {
                    message.channel.send(_.map(res, item => `• ${item.text}`).join('\n'));
                }
            }

            if (res.length < 1) {
                message.channel.send("No results");
            }
        });
    });
});

client.login(process.env.CLIENT_ID);
