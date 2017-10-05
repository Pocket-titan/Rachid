const Discord = require('discord.js')
const ytdl = require('ytdl-core');
const streamOptions = { seek: 0, volume: 1 };
const client = new Discord.Client()
const broadcast = client.createVoiceBroadcast();

// change this when you clone rachid
const token = 'MzY1MTA3OTk0MDMzMjU4NDk2.DLZg-w.XjW16JqgjvTaumV7Bb1q1_h2LDY'

let channels = null

const botsChannelID = '281062127928868864'

const ytdlOptions = {
  filter : 'audioonly',
  quality: 'highest',
}

const send = (message, channel) => {
  channel.send(message)
    .then(message => console.log(`Sent message: ${message.content}`))
    .catch(console.error)
}

const playFile = (voiceChannel, filename) => {
  voiceChannel.join()
    .then(connection => {
      const dispatcher = connection.playFile('./mp3/' + filename)
      console.log(filename)
      dispatcher.on('end', () => {
        console.log('we done')
        dispatcher.destroy()
      })
    })
    .catch(console.error)
}

const playStream = (voiceChannel, link) => {
  voiceChannel.join()
    .then(connection => {
      const stream = ytdl(link, ytdlOptions)
        .on('error', err => console.log(err))
      const dispatcher = connection.playStream(stream)
      dispatcher.on('end', () => {
        console.log('we done')
        dispatcher.destroy()
      })
    })
    .catch(console.error)
}

const findChannel = id => {
  return channels.find(channel => channel.id === id)
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  channels = Array.from(client.channels.values())
})

client.on('message', msg => {
  const emoji = name => {
      return msg.guild.emojis.find("name", name);
  }

  // trigger handling
  triggers.forEach(trigger => {
    let type = typeof trigger.q
    // string or regex matching
    match = (type === 'string')
      ? msg.content.toLowerCase().match(trigger.q.toLowerCase())
      : msg.content.match(trigger.q)

    // if we match shit
    if (match && match[0].length > 2) {
      if (msg.author.bot) {
        return
      }
      if (trigger.q.type === 'text') {
        trigger.a(msg.channel)
      }
      else if (trigger.type === 'voice') {
        trigger.a(findChannel(msg.author.lastMessage.member.voiceChannelID), trigger.q)
      }
      else if (trigger.type === 'url') {
        trigger.a(findChannel(msg.author.lastMessage.member.voiceChannelID), match[0])
      }
    }
  })
})

// rachid can talk
let stdin = process.openStdin()
stdin.addListener("data", d => {
    let message = d.toString().trim()
    send(message, findChannel(botsChannelID))
})

// every trigger is composed of a Question (q) and Answer (a),
// an action that rachid will do on receiving the question
const triggers = [
  {
    q: 'why are we still here',
    a: channel => {send('just to suffer?', channel)},
    type: 'text',
  },
  {
    q: 'rachid wie ben je',
    a: channel => {send('ik ben rachid', channel)},
    type: 'text',
  },
  {
    q: 'rachid kom',
    a: (voiceChannel, q) => {playFile(voiceChannel, audio[q])},
    type: 'voice',
  },
  {
    q: 'rachid heb je even voor mij',
    a: (voiceChannel, q) => {playFile(voiceChannel, audio[q])},
    type: 'voice',
  },
  {
    q: 'rachid fatoe',
    a: (voiceChannel, q) => {playFile(voiceChannel, audio[q])},
    type: 'voice',
  },
  {
    q: 'rachid ga weg',
    a: voiceChannel => {if (voiceChannel) {voiceChannel.leave()}},
    type: 'voice',
  },
  {
    q: 'rachid kanker',
    a: (voiceChannel, q) => {playFile(voiceChannel, audio[q])},
    type: 'voice',
  },
  {
    q: 'rachid 5 euro',
    a: (voiceChannel, q) => {playFile(voiceChannel, audio[q])},
    type: 'voice',
  },
  {
    q: /^rachid (?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/,
    a: (voiceChannel, url) => {
      let regex = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/
      let match = url.match(regex)
      if (match && match[1].length == 11) {playStream(voiceChannel, match[0])}
    },
    type: 'url',
  },
]

const audio = {
  'rachid kom': 'ikbenrachid.mp3',
  'rachid heb je even voor mij': 'hebjeevenvoormij.mp3',
  'rachid fatoe': 'fatoe.mp3',
  'rachid kanker': 'kanker.mp3',
  'rachid 5 euro': '5euro.mp3',
}

client.login(token)
