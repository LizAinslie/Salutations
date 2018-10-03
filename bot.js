const Discord = require('discord.js');
const config = require('./config.json');
const rethinkdb = require('rethinkdbdash');
const resolveChannel = require('./util/resolveChannel.js')

const client = new Discord.Client();

const r = rethinkdb(config.rethinkdb);

client.on('message', msg => {
    if (msg.author.bot) return;
    const prefixes = ['salut ', `<@${client.user.id}>`];
    let prefix = false;
    for (const thisPrefix of prefixes) {
        if (msg.content.toLowerCase().startsWith(thisPrefix)) prefix = thisPrefix;
    }
    if (msg.content.indexOf(prefix) !== 0) return;
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    
    switch(command) {
        case 'ping':
            msg.reply(`Pong! \`latency ${client.ping}ms\``);
            break;
        case 'message':
            switch(args.shift()) {
                case 'set':
                    if(!msg.member.hasPermission('MANAGE_MESSAGES') && msg.author.id !== config.ownerID) return msg.channel.send('You don\'t have the required permissions! You need `MANAGE_MESSAGES`!');
                    switch(args.shift()) {
                        case 'text':
                            r.table('guildSettings').get(msg.guild.id).run().then(settings => {
                                if (settings) {
                                    r.table('guildSettings').get(msg.guild.id).update({
                                        welcomeText: args.join(' ')
                                    }).run((error) => {
                    					if (error) return;
                                    });
                                } else {
                                    r.table('guildSettings').insert({
                                        id: msg.guild.id,
                                        welcomeText: args.join(' '),
                                        channel: null,
                                        enabled: true
                                    }).run((error) => {
                    					if (error) return;
                                    });
                                }
                            });
                            break;
                        case 'channel':
                            resolveChannel(client, args.join(' '), msg.guild).then(channel => {
                                r.table('guildSettings').get(msg.guild.id).run().then(settings => {
                                    if (settings) {
                                        r.table('guildSettings').get(msg.guild.id).update({
                                            channel: channel.id
                                        }).run((error) => {
                        					if (error) return;
                                        });
                                    } else {
                                        r.table('guildSettings').insert({
                                            id: msg.guild.id,
                                            welcomeText: null,
                                            channel: channel.id,
                                            enabled: true
                                        }).run((error) => {
                        					if (error) return;
                                        });
                                    }
                                });
                            });
                            break;
                        default:
                            msg.channel.send('That\'s not a recognized command! Use the `help` command for more info.');
                            break;
                    }
                    break;
                case 'enable':
                    if(!msg.member.hasPermission('MANAGE_MESSAGES') && msg.author.id !== config.ownerID) return msg.channel.send('You don\'t have the required permissions! You need `MANAGE_MESSAGES`!');
                    r.table('guildSettings').get(msg.guild.id).run().then(settings => {
                        if (settings) {
                            if (!settings.channel || !settings.welcomeText) return msg.channel.send('You need to set the `Channel` and `WelcomeMessage` settings first!');
                            r.table('guildSettings').get(msg.guild.id).update({
                                enabled: true
                            }).run((error) => {
            					if (error) return;
                            });
                        } else {
                            return msg.channel.send('You need to set the `Channel` and `WelcomeMessage` settings first!');
                        }
                        msg.channel.send('Set `Enabled` to **True** for your guild.');
                    });
                    break;
                case 'disable':
                    if(!msg.member.hasPermission('MANAGE_MESSAGES') && msg.author.id !== config.ownerID) return msg.channel.send('You don\'t have the required permissions! You need `MANAGE_MESSAGES`!');
                    r.table('guildSettings').get(msg.guild.id).run().then(settings => {
                        if (settings) {
                            if (!settings.channel || !settings.welcomeText) return msg.channel.send('You need to set the `Channel` and `WelcomeMessage` settings first!');
                            r.table('guildSettings').get(msg.guild.id).update({
                                enabled: false
                            }).run((error) => {
            					if (error) return;
                            });
                        } else {
                            return msg.channel.send('You need to set the `Channel` and `WelcomeMessage` settings first!');
                        }
                        msg.channel.send('Set `Enabled` to **False** for your guild.');
                    });
                    break;
            }
            break
        case 'help':
            case 'cmds':
            case 'commands':
                const embed = new Discord.RichEmbed()
                .setTitle('Command List')
                .setColor('RANDOM')
                .addField('Message Set', `**Usage:**
\`salut message set <channel|text> <value>\`

**Description:**
Sets the bot up to function on your server.`)
                .addField('Message Enable', `**Usage:**
\`salut message enable\`

**Description:**
Enables the bot's functionality on your server`)
                .addField('Message Disable', `**Usage:**
\`salut message disable\`

**Description:**
Disables the bot on your server.`)
                .addField('Ping', `If you're looking at this, you're insane. You know how it works!`);
                msg.channel.send(embed);
    }
});

client.on('guildMemberAdd', (member) => {
    r.table('guildSettings').get(member.guild.id).run().then(settings => {
        if (!settings || !settings.enabled || !settings.welcomeText || !settings.channel) return;
        const welcomeChannel = member.guild.channels.get(settings.channel);
        
        const embed = new Discord.RichEmbed()
        .setColor('RANDOM')
        .setTimestamp(new Date())
        .setFooter(`Members: ${member.guild.memberCount}`)
        .setThumbnail(member.user.displayAvatarURL)
        .setDescription(`<@${member.user.id}>
**Welcome to ${member.guild.name}!**
${settings.welcomeText}`);
        
        welcomeChannel.send(embed);
    });
});

client.on('ready', () => {
    console.log('Ready');
});

client.login(config.token);