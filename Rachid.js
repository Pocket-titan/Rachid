const Discord = require("discord.js")
const client = new Discord.Client()
// change this when you clone rachid
const token = 'MzY1MTA3OTk0MDMzMjU4NDk2.DLZg-w.XjW16JqgjvTaumV7Bb1q1_h2LDY'

let channels = null
let currentVoiceChannel = null

const botsChannelID = '281062127928868864'

const send = (message, channel) => {
  channel.send(message)
    .then(message => console.log(`Sent message: ${message.content}`))
    .catch(console.error)
}

const playFile = (connection, filename) => {
  const dispatcher = connection.playFile(filename)
  dispatcher.on('end', () => {
    dispatcher.destroy()
  })
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
    if (msg.content.toLowerCase().includes(trigger.q.toLowerCase())) {
      if (msg.author.bot) {
        return
      }
      if (trigger.q.type === 'text') {
        trigger.a(msg.channel)
      }
      else if (trigger.type === 'voice') {
        trigger.a(findChannel(msg.author.lastMessage.member.voiceChannelID))
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
    a: channel => {
      send('just to suffer?', channel)
    },
    type: 'text',
  },
  {
    q: 'rachid wie ben je',
    a: channel => {
      send('ik ben rachid', channel)
    },
    type: 'text',
  },
  {
    q: 'rachid kom',
    a: voiceChannel => {
      voiceChannel.join()
        .then(connection => playFile(connection, './mp3/ikbenrachid.mp3'))
        .catch(console.error)
    },
    type: 'voice',
  },
  {
    q: 'rachid heb je even voor mij',
    a: voiceChannel => {
      voiceChannel.join()
        .then(connection => playFile(connection, './mp3/hebjeevenvoormij.mp3'))
        .catch(console.error)
    },
    type: 'voice',
  },
  {
    q: 'rachid fatoe',
    a: voiceChannel => {
      voiceChannel.join()
        .then(connection => playFile(connection, './mp3/fatoe.mp3'))
        .catch(console.error)
    },
    type: 'voice',
  },
  {
    q: 'rachid ga weg',
    a: voiceChannel => {
      if (voiceChannel) {
          voiceChannel.leave()
      }
    },
    type: 'voice',
  }
]

client.login(token)
