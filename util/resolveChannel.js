module.exports = (bot, query, guild) => {
	return new Promise((resolve, reject) => {
		if (/^\d+$/.test(query)) {
			if (guild) {
				if (!guild.channels.has(query)) reject(new Error(`Guild with id ${guild.id} does not have channel: ${query}`))
				resolve(guild.channels.get(query))
			} else {
				const channel = query in bot.channelGuildMap && bot.guilds.get(bot.channelGuildMap[query]).channels.get(query)
				if (channel) return resolve(channel)
			}
		} else if (/^<#(\d+)>$/.test(query)) {
			const match = query.match(/^<#(\d+)>$/)
			if (guild) {
				if (!guild.channels.has(match[1])) reject(new Error(`Guild with id ${guild.id} does not have channel: ${match[1]}`))
				resolve(guild.channels.get(match[1]))
			} else {
				const channel = match[1] in bot.channelGuildMap && bot.guilds.get(bot.channelGuildMap[match[1]]).channels.get(match[1])
				if (channel) return resolve(channel)
			}
		} else if (guild) {
			const channels = guild.channels.filter((channel) => channel.name.toLowerCase().includes(query.toLowerCase()))
			if (channels.size > 0) return resolve(channels.first())
		}
		reject(new Error('Invalid Channel!'))
	})
}
