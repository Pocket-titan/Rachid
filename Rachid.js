import search from "youtube-search";
import Discord from "discord.js";
import ytdl from "ytdl-core";
import { token, youtube_api_key } from "./auth.json";

const client = new Discord.Client();
const broadcast = client.createVoiceBroadcast();

const mdwekmegID = "240902201868812289";
const pppppID = "689084892692086784";
const server_ID_to_operate_in = pppppID;

const rachidID = "365107994033258496";

let channels = [];
let voice_connection = null;
let currently_playing = null;
let volume = 7;

const send = async (message, channel) => {
  try {
    await channel.send(message);
    console.log(`Sent message: ${message}`);
  } catch (error) {
    console.error(error);
  }
};

const join_channel = async (voice_channel) => {
  if (voice_connection) {
    if (voice_connection.channel.id === voice_channel.id) {
      return voice_connection;
    }
  }

  let connection = await voice_channel.join();
  voice_connection = connection;

  return connection;
};

const stopPlaying = async () => {
  if (currently_playing) {
    currently_playing.pause();
    currently_playing = null;
  }
};

const playFile = async (voice_channel, filename, user_options = {}) => {
  if (!voice_channel) {
    console.log("Not in a voice channel");
    return;
  }
  console.log(`Playing file ${filename}`);

  const default_options = {
    seek: 0,
    volume: volume / 100,
    passes: 1,
    bitrate: 48000,
  };

  const options = {
    ...default_options,
    ...user_options,
  };

  const dispatcher = (await join_channel(voice_channel)).playFile(
    `./mp3/${filename}`,
    options
  );

  dispatcher.on("finish", () => {
    currently_playing = null;
  });

  currently_playing = dispatcher;
};

const playStream = async (voice_channel, link, user_options = {}) => {
  const default_ytdl_options = {
    filter: "audioonly",
    quality: "highest",
  };

  const ytdl_options = {
    ...default_ytdl_options,
    ...user_options,
  };

  const stream = ytdl(link, ytdl_options).on("error", (err) => console.log(err));

  const dispatcher = (await join_channel(voice_channel)).playStream(stream, {
    volume: volume / 100,
  });

  dispatcher.on("finish", () => {
    currently_playing = null;
  });

  currently_playing = dispatcher;
};

const find_channel = (id) => {
  return channels.find((channel) => channel.id === id);
};

client.on("ready", async () => {
  console.log(`ik ben ${client.user.tag}`);
  const { guilds } = client;
  let guild = guilds.get(server_ID_to_operate_in);
  channels.push(...Array.from(guild.channels.values()));

  const current_voice_channels = client.channels
    .filter(({ type }) => type === "voice")
    .filter(({ members }) => members.some(({ user }) => user.id === rachidID))
    .map(({ id }) => id);
  const already_in_voice_channel = current_voice_channels.length > 0;

  if (already_in_voice_channel) {
    // can we even be in more than one at the same time?
    const channel_id = current_voice_channels[0];
    const channel = find_channel(channel_id);
    let connection = await join_channel(channel);
    voice_connection = connection;
  }
});

client.on("message", async (message) => {
  const emoji = (name) => message.guild.emojis.find("name", name);

  try {
    // trigger handling
    for (let trigger of triggers) {
      // string or regex matching
      let match =
        typeof trigger.q === "string"
          ? message.content.toLowerCase().match(trigger.q.toLowerCase())
          : typeof trigger.q === "function"
          ? trigger.q(message.content.toLowerCase())
          : message.content.match(trigger.q);

      // if we match shit
      if (match && match[0].length > 2) {
        // don't listen to bots
        if (message.author.bot) {
          return;
        }

        const voice_channel_ID = message?.member?.voiceChannelID;
        const voice_channel = find_channel(voice_channel_ID);

        // there's different trigger types
        switch (trigger.type) {
          case "text":
            return await trigger.a(message.channel);
          case "voice":
            return await trigger.a(voice_channel, trigger.q);
          case "url":
            return await trigger.a(voice_channel, match[0]);
          case "search":
            return await trigger.a(voice_channel, match["input"]);
          case "volume":
            return await trigger.a(match[1]);
          default:
            return await trigger.a();
        }
      }
    }
  } catch (e) {
    console.warn(`ERROR BIJ TEKST: ${message.content}`);
    console.warn(e.stack);
  }
});

// Ctrl+c makes rachid leave the call (otherwise bugs)
process.on("SIGINT", () => {
  client.destroy();
  process.exit();
});

// rachid can talk
let stdin = process.openStdin();
stdin.addListener("data", (d) => {
  let message = d.toString().trim();
  let bots_channel = channels.find((channel) => channel.name.includes("bots"));
  if (bots_channel) {
    send(message, bots_channel);
  }
});

// every trigger is composed of a Question (q) and Answer (a),
// an action that rachid will do on receiving the question
const triggers = [
  {
    q: "why are we still here",
    a: (channel) => send("just to suffer?", channel),
    type: "text",
  },
  {
    q: "rachid wie ben je",
    a: (channel) => send("ik ben rachid", channel),
    type: "text",
  },
  {
    q: "rachid kom",
    a: (voice_channel, q) =>
      playFile(voice_channel, "ikbenrachid.mp3", { seek: 51, volume: 0.07 }),
    type: "voice",
  },
  {
    q: "rachid heb je even voor mij",
    a: (voice_channel, q) =>
      playFile(voice_channel, "hebjeevenvoormij.mp3", { volume: 0.01 }),
    type: "voice",
  },
  {
    q: "rachid fatoe",
    a: (voice_channel, q) => playFile(voice_channel, "fatoe.mp3", { volume: 0.1 }),
    type: "voice",
  },
  {
    q: /^rachid klep (([1-9][0-9]*)|ff)/,
    a: (number) => {
      if (number == "ff") number = 0;
      volume = number;
      if (currently_playing) {
        // setVolume takes 1 for normal vol, 0.5 for half, 2 for double :/
        currently_playing.setVolume(volume / 100);
      }
    },
    type: "volume",
  },
  {
    q: "rachid help",
    a: (channel) =>
      send(
        triggers.map((trigger) => "`" + trigger.q + "`"),
        channel
      ),
    type: "text",
  },
  {
    q: (message) => {
      if (["rachid", "ga"].every((word) => message.includes(word))) {
        return [["rachid", "ga", "weg"]];
      }

      return null;
    },
    a: (voice_channel) => {
      console.log("doei");

      if (voice_connection) {
        voice_connection.disconnect();
        voice_connection = null;
      }
    },
    type: "voice",
  },
  {
    q: "rachid kankerheet",
    a: (voice_channel, q) => playFile(voice_channel, "kankerheet.mp3", { volume: 0.1 }),
    type: "voice",
  },
  {
    q: "rachid kanker",
    a: (voice_channel, q) => playFile(voice_channel, "kanker.mp3", { volume: 0.2 }),
    type: "voice",
  },
  {
    q: "rachid bolt",
    a: (voice_channel, q) => playFile(voice_channel, "bolt.mp3", { volume: 0.2 }),
    type: "voice",
  },
  {
    q: "rachid 5 euro",
    a: (voice_channel, q) => playFile(voice_channel, "5euro.mp3"),
    type: "voice",
  },
  {
    q: "rachid bitconnect",
    a: (voice_channel, q) => playFile(voice_channel, "bitconnect.mp3"),
    type: "voice",
  },
  {
    q: "rachid sonata",
    a: (voice_channel, q) => playFile(voice_channel, "bitonnect_sonata.mp3"),
    type: "voice",
  },
  {
    q: "rachid hey",
    a: (voice_channel, q) => playFile(voice_channel, "hey.mp3"),
    type: "voice",
  },
  {
    q: "rachid wusup",
    a: (voice_channel, q) => playFile(voice_channel, "wusup.mp3"),
    type: "voice",
  },
  {
    q: "rachid nonono",
    a: (voice_channel, q) => playFile(voice_channel, "nonono.mp3"),
    type: "voice",
  },
  {
    q: /^rachid (?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/,
    a: (voice_channel, url) => {
      let regex = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/;
      let match = url.match(regex);
      if (match && match[1].length == 11) playStream(voice_channel, match[0]);
    },
    type: "url",
  },
  {
    q: /^rachid play .*/,
    a: (voice_channel, query) => {
      const options = {
        maxResults: 5,
        key: youtube_api_key,
      };
      search(query.replace("rachid play", "").trim(), options, (err, results) => {
        if (err) return console.log(err);
        playStream(
          voice_channel,
          results.filter((result) => result.kind === "youtube#video")[0].link
        );
      });
    },
    type: "search",
  },
  {
    q: /^rachid s+h*($|s)/,
    a: () => stopPlaying(),
  },
  {
    q: "rachid stop",
    a: () => stopPlaying(),
  },
];

client.login(token);
