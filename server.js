/* Setup

   1. Create a .env file (click add file then remane it to .env)

   2. Put "token=" (without quotes) into the .env file followed by your Discord Bot token (No spaces!)

   3. Replace the textChannelId variable with the id of the text channel that you want the bot to work in
*/


var readline = require('readline');

const Discord = require('discord.js');
const client = new Discord.Client();

const serverDir = "/home/romankubiv101/Documents/minecraft-server"
const textChannelId = "572028973668630532"
const onlyOneChanelMode = false;
const autostartMinecraftServer = true;
const maxChannelConnectRetries = 5;

const minTilAutoStopWhenEmpty = 1;

const mcMemoryMin = '1G'
const mcMemoryMax = '8G'


require('dotenv').config()


//__________________________________________________________________________________
//#region discord-setup
//__________________________________________________________________________________

let stringHasAll = (string, words) => {
  return words.map((word) => {
    return string.indexOf(word) != -1
  }).every(val => val)
}

client.on('ready', () => {
  client.user.setStatus(autostartMinecraftServer ? 'idle' : 'dnd')

  console.log(`Logged in as ${client.user.tag}!`);
});


client.on('message', message => {

  // check that the message is in the specified channel
  if (!onlyOneChanelMode || message.channel.id == textChannelId) {

    messageText = message.content

    if (messageText.indexOf("is the server up?") != -1) {
      message.channel.send(mcServerProcess != null ? "Yea!" : "Nah G");


    } else if (stringHasAll(message.content, ["start", "server", "please"])) {
      startMcServer();

    } else if (stringHasAll(message.content, ["start", "server"])) {
      sendDiscordMessage("not even a please? smh")

    } else if (message.content.startsWith("@mc ")) {
      //.filter((char) => {return !(char in ["/"])})
      writeMcCommand("/say [" + message.author.username + "] " + message.content.substring(3))
    }

  }
});

// login
client.login(process.env.token);


// get a discord channel instance
let discordChannel;
let fetchChannel = (callback, iteration = 1) => {

  if (iteration > maxChannelConnectRetries) {
    console.log("connection timmed out")

  } else {
    client.channels.fetch(textChannelId)
      .then(channel => {

        if (channel == null) {
          // wait and try again
          setTimeout(() => {
            iteration++;
            fetchChannel(callback, iteration)
          }, 1000)

        } else {
          discordChannel = channel;

          try {
            callback();

          } catch (error) {
            console.log(error)
          }
        }

      }, e => console.log(e))

  }


}

let sendDiscordMessage = (message) => {
  try {
    if (discordChannel == null) {
      fetchChannel(() => {
        discordChannel.send(message)
      })

    } else {
      discordChannel.send(message)
    }

  } catch (error) {
    console.log(error)
  }

}

//__________________________________________________________________________________
// #endregion discord-setup
//__________________________________________________________________________________

//__________________________________________________________________________________
// #region minecraft-setup 
//__________________________________________________________________________________


//create server child process
const {
  spawn
} = require('child_process');

let mcServerProcess;
let noPlayersOnTimeAgo = false;
let stopAll = false;

let startMcServer = () => {
  noPlayersOnTimeAgo = false;
  stopAll = false;

  console.log("Server Starting")

  mcServerProcess = spawn(`java`,
    [`-Xmx${mcMemoryMax}`, `-Xms${mcMemoryMin}`, "-jar", `server.jar`, "nogui"],

    // set working directory
    {
      cwd: serverDir
    });


  mcServerProcess.stdout.on('data', (data) => {
    line = data.toString()

    console.log("M " + line)

    if (stringHasAll(line, ["[Server thread/INFO]:", "left the game"])) {
      writeMcCommand("/list")

    } else if (line.indexOf("[Server thread/INFO]: Done (") != -1) {
      sendDiscordMessage("The server is up")
      client.user.setStatus('online')

      // wait half the time to auto stop then check if anyone has joined
      setTimeout(() => {
        writeMcCommand("/list")
      }, (minTilAutoStopWhenEmpty * 60 * 1000) / 2)

    } else if (line.indexOf("[Server thread/INFO]: There are") != -1) {
      if (line.split(" ")[5] == 0) {
        if (noPlayersOnTimeAgo) {
          writeMcCommand("/stop")
          client.user.setStatus('idle')

        } else {
          sendDiscordMessage(`The server is empty, will shut down in ${minTilAutoStopWhenEmpty} min`)
          noPlayersOnTimeAgo = true;

          setTimeout(() => {
            writeMcCommand("/list")
          }, minTilAutoStopWhenEmpty * 60 * 1000)
        }
      } else {
        noPlayersOnTimeAgo = false;
      }

    } else if (stringHasAll(line, ["<", ">"])) {

      if (line.split(">")[1].startsWith(" @d ")) {
        splitLine = line.split(new RegExp("<|>", "g"))
        sendDiscordMessage("[" + splitLine[1] + "] " + splitLine[2].substring(4))
      }


    }


  });

  // on error
  mcServerProcess.stderr.on('data', (chunk) => {
    console.log("error : " + chunk.toString())
  });

  // on server stop
  mcServerProcess.on('close', (code) => {

    // stop the process
    mcServerProcess.kill()

    console.log(`server stopped with code ${code}`);
    client.user.setStatus('dnd')

    if (stopAll) {
      throw new Error("bot stopped")
    }
  });

}

if (autostartMinecraftServer) {
  startMcServer();
}



let writeMcCommand = (command) => {
  mcServerProcess.stdin.write(command + "\n")
}

//__________________________________________________________________________________
//#endregion minecraft-setup
//__________________________________________________________________________________

//__________________________________________________________________________________
//#region terminal-setup
//__________________________________________________________________________________

// create interface to read terminal input
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let stopServer = () => {
  writeMcCommand("/stop")
  client.user.setStatus('idle')
}

rl.on('line', function (line) {

  if (line.startsWith("discord ")) {

    client.channels.fetch(textChannelId).then(channel => {
      channel.send(line.substring(3))
    }).catch(e => {
      console.log(e)
    })

  } else if (line.startsWith("/stop")) {

    // instantly stop server
    if (line.startsWith("/stop now")) {

      writeMcCommand("/kick @a Stopped For Emergency Maintenance")
      writeMcCommand("/stop")
      client.user.setStatus('idle')

    } else {

      // flag that is checked when the mcServer stops
      if (line.split(" ")[2] == "a") {
        stopAll = true;
      }

      // check if the minutes till stop parameter is a number
      minTillStop = line.split(" ")[1]
      minTillStop = Number.isInteger(Number.parseInt(minTillStop)) ? Number.parseInt(minTillStop) : 3

      writeMcCommand("/say SERVER STOPPING IN " + minTillStop + " MINUTE" + (minTillStop != 1 ? "S" : ""))
      setTimeout(() => {
        writeMcCommand("/say SERVER STOPPING IN 30 SECONDS")
        setTimeout(() => {
          stopServer();
        }, 30 * 1000)
      }, minTillStop * 60 * 1000)
    }

  } else if (line.startsWith("/start")) {
    startMcServer();

  } else if (line.startsWith("/")) {
    writeMcCommand(line.toString())

  } else if (line.startsWith("help")) {
    console.log(`
    discord - message discord channel
    
    /start - start server
    /stop (delay in minutes || now - to stop immediatly)
    any other command starting with / will be sent to the minecraft server 
    `)
  }


})

//__________________________________________________________________________________
//#endregion terminal-setup
//__________________________________________________________________________________