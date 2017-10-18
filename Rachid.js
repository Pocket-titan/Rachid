const Discord = require("discord.js")
const ytdl = require("ytdl-core")
const client = new Discord.Client()
const broadcast = client.createVoiceBroadcast()
const search = require("youtube-search")

const auth = require("./auth.json")
const token = auth.token
const youtube_api_key = auth.youtube_api_key

const botsChannelID = "281062127928868864"

let channels = null
let current_voice_connection = null
let currently_playing = null
let current_volume = 70

const send = (message, channel) => {
  channel
    .send(message)
    .then(message => console.log(`Sent message: ${message.content}`))
    .catch(console.error)
}

const join_channel = async voice_channel => {
  if (current_voice_connection) {
    if (current_voice_connection.channel.id === voice_channel.id) {
      return current_voice_connection
    }
  }
  let voice_connection = await voice_channel.join()
  current_voice_connection = await voice_connection

  return voice_connection
}

const playFile = async (voice_channel, filename, user_options = {}) => {
  if (!voice_channel) return
  const default_options = {
    seek: 0,
    volume: current_volume/100,
    passes: 1,
    bitrate: 48000,
  }
  const options = {
    ...default_options,
    ...user_options,
  }
  const dispatcher = (await join_channel(voice_channel)).playFile(`./mp3/${filename}`, options)
  dispatcher.on('end', () => {
    currently_playing = null
  })
  currently_playing = dispatcher
}

const playStream = async (voice_channel, link, user_options = {}) => {
  const default_ytdl_options = {
    filter: "audioonly",
    quality: "highest",
  }
  const ytdl_options = {
    ...default_ytdl_options,
    ...user_options,
  }
  const stream = ytdl(link, ytdl_options).on("error", err => console.log(err))
  const dispatcher = (await join_channel(voice_channel)).playStream(stream, {volume: current_volume/100})
  dispatcher.on('end', () => {
    currently_playing = null
  })
  currently_playing = dispatcher
}

const find_channel = id => channels.find(channel => channel.id === id)

client.on("ready", () => {
  console.log(`ik ben ${client.user.tag}`)
  channels = Array.from(client.channels.values())
})

client.on("message", async msg => {
  try {
    const emoji = name => msg.guild.emojis.find("name", name)
    // trigger handling
    for (let trigger of triggers) {
      // string or regex matching
      match =
        typeof trigger.q === "string"
          ? msg.content.toLowerCase().match(trigger.q.toLowerCase())
          : msg.content.match(trigger.q)
      // if we match shit
      if (match && match[0].length > 2) {
        // don't listen to bots
        if (msg.author.bot) return
        const channelID = msg.author.lastMessage.member.voiceChannelID
        const voice_channel = channelID
          ? find_channel(channelID)
          : (current_voice_connection ? current_voice_connection : null)
        // there's different trigger types
        if (trigger.type === "text")
          await trigger.a(msg.channel)
        else if (trigger.type === "voice")
          await trigger.a(voice_channel, trigger.q)
        else if (trigger.type === "url")
          await trigger.a(voice_channel, match[0])
        else if (trigger.type === "search")
          await trigger.a(voice_channel, match["input"])
        else if (trigger.type === "volume")
          await trigger.a(match[1])
      }
    }
  }
  catch (e) {
    console.warn(`ERROR BIJ TEKST: ${msg.content}`)
    console.warn(e.stack)
  }
})

// Ctrl+c makes rachid leave the call (otherwise bugs)
process.on("SIGINT", () => {
  client.destroy()
  process.exit()
})

// rachid can talk
let stdin = process.openStdin()
stdin.addListener("data", d => {
  let message = d.toString().trim()
  send(message, find_channel(botsChannelID))
})

// every trigger is composed of a Question (q) and Answer (a),
// an action that rachid will do on receiving the question
const triggers = [
  {
    q: "why are we still here",
    a: channel => send("just to suffer?", channel),
    type: "text",
  },
  {
    q: "rachid wie ben je",
    a: channel => send("ik ben rachid", channel),
    type: "text",
  },
  {
    q: "rachid kom",
    a: (voice_channel, q) => playFile(voice_channel, "ikbenrachid.mp3", { seek: 51 }),
    type: "voice",
  },
  {
    q: "rachid heb je even voor mij",
    a: (voice_channel, q) => playFile(voice_channel, "hebjeevenvoormij.mp3"),
    type: "voice",
  },
  {
    q: "rachid fatoe",
    a: (voice_channel, q) => playFile(voice_channel, "fatoe.mp3"),
    type: "voice",
  },
  {
    q: /^rachid klep (([1-9][0-9]*)|ff)/,
    a: (number) => {
      if (number == 'ff') number = 0
      current_volume = number
      if (currently_playing) {
        // setVolume takes 1 for normal vol, 0.5 for half, 2 for double :/
        currently_playing.setVolume(current_volume/100)
      }
    },
    type: "volume",
  },
  {
    q: "rachid help",
    a: channel => send(triggers.map(trigger => '`'+trigger.q+'`'), channel),
    type: "text",
  },
  {
    q: /^rachid.*ga .*weg($| )/,
    a: voice_channel => {
      if (current_voice_connection) {
        current_voice_connection.disconnect()
        current_voice_connection = null
      }
    },
    type: "voice",
  },
  {
    q: "rachid kanker",
    a: (voice_channel, q) => playFile(voice_channel, "kanker.mp3"),
    type: "voice",
  },
  {
    q: "rachid kankerheet",
    a: (voice_channel, q) => playFile(voice_channel, "kankerheet.mp3"),
    type: "voice",
  },
  {
    q: "rachid bolt",
    a: (voice_channel, q) => playFile(voice_channel, "bolt.mp3"),
    type: "voice",
  },
  {
    q: "rachid 5 euro",
    a: (voice_channel, q) => playFile(voice_channel, "5euro.mp3"),
    type: "voice",
  },
  {
    q: /^rachid (?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/,
    a: (voice_channel, url) => {
      let regex = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/
      let match = url.match(regex)
      if (match && match[1].length == 11) playStream(voice_channel, match[0])
    },
    type: "url",
  },
  {
    q: /^rachid play .*/,
    a: (voice_channel, query) => {
      const options = {
        maxResults: 5,
        key: youtube_api_key,
      }
      search(
        query.replace("rachid play", "").trim(),
        options,
        (err, results) => {
          if (err) return console.log(err)
          playStream(
            voice_channel,
            results.filter(result => result.kind === "youtube#video")[0].link
          )
        }
      )
    },
    type: "search",
  },
  {
    q: /^rachid s+h*($|s)/,
    a: async () => {
      if (current_voice_connection && current_voice_connection.dispatcher) {
        current_voice_connection.dispatcher.end()
      }
    },
    type: "voice",
  },
]

client.login(token)
