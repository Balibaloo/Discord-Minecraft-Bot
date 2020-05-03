const {
    spawn
} = require('child_process');


module.exports = (globalVars) => {
    this.discord = {};
    this.setDiscord = (discord) => {
        this.discord = discord
    }

    this.mcServerProcess = null;
    this.noPlayersOnTimeAgo = false;
    this.stopAll = false;
    this.mcServerProcess = null;

    this.writeCommand = (command) => {
        this.mcServerProcess.stdin.write(command + "\n")
    }

    this.stringHasAll = (string, words) => {
        return words.map((word) => {
            return string.indexOf(word) != -1
        }).every(val => val)
    }

    this.startServer = () => {
        this.discord.setStatus('idle')

        this.noPlayersOnTimeAgo = false;
        this.stopAll = false;

        console.log("Server Starting")

        //create server child process

        this.mcServerProcess = spawn(`java`,
            [`-Xmx${globalVars.mcMemoryMax}`, `-Xms${globalVars.mcMemoryMin}`, "-jar", `server.jar`, "nogui"],

            // set working directory
            {
                cwd: globalVars.serverDir
            });


        this.mcServerProcess.stdout.on('data', (data) => {
            line = data.toString()

            console.log("M " + line)

            if (this.stringHasAll(line, ["[Server thread/INFO]:", "left the game"])) {
                this.writeCommand("/list")

            } else if (line.indexOf("[Server thread/INFO]: Done (") != -1) {
                this.discord.sendMessage(globalVars.roleTag + "The server is up")
                this.discord.setStatus('online')

                // wait half the time to auto stop then check if anyone has joined
                if (globalVars.autostopWhenEmpty) {
                    setTimeout(() => {
                        this.writeCommand("/list")
                    }, (globalVars.minTilAutoStopWhenEmpty * 60 * 1000) / 2)
                }

            } else if (line.indexOf("[Server thread/INFO]: There are") != -1 && globalVars.autostopWhenEmpty) {
                if (line.split(" ")[5] == 0) {
                    if (this.noPlayersOnTimeAgo) {
                        this.writeCommand("/stop")
                        this.discord.setStatus('idle')

                    } else {
                        this.discord.sendMessage(`The server is empty, will shut down in ${globalVars.minTilAutoStopWhenEmpty} min`)
                        this.noPlayersOnTimeAgo = true;

                        setTimeout(() => {
                            this.writeCommand("/list")
                        }, globalVars.minTilAutoStopWhenEmpty * 60 * 1000)
                    }
                } else {
                    this.noPlayersOnTimeAgo = false;
                }

            } else if (this.stringHasAll(line, ["<", ">"])) {

                if (line.split(">")[1].startsWith(" @d ")) {
                    splitLine = line.split(new RegExp("<|>", "g"))
                    this.discord.sendMessage("[" + splitLine[1] + "] " + splitLine[2].substring(4))
                }
            }
        });

        // on error
        this.mcServerProcess.stderr.on('data', (chunk) => {
            console.log("error : " + chunk.toString())
        });

        // on server stop
        this.mcServerProcess.on('close', (code) => {

            // stop the process
            this.mcServerProcess.kill()

            console.log(`server stopped with code ${code}`);
            this.discord.setStatus('dnd')

            if (this.stopAll) {
                throw new Error("bot stopped")
            }
        });

    }

    return this;
}