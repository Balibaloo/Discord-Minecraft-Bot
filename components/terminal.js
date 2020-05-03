var readline = require('readline');

module.exports = (globalVars) => {
    this.minecraft = {}
    this.discord = {}
    this.globalVars = globalVars

    this.setDiscord = (discord) => {this.discord = discord}
    this.setMinecraft = (minecraft) => {this.minecraft = minecraft}

    this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    this.stopServer = () => {
        if (this.minecraft != {} && this.discord != {}) {
            this.minecraft.writeCommand("/stop")
            this.discord.setStatus('idle')

        } else {
            console.log("cannot stop server yet")
        }
    }

    this.isConnected = () => {
        return !this.isEmptyObj(this.discord) && !this.isEmptyObj(this.minecraft)
    }

    this.isEmptyObj = (obj) => {
        for (var prop in obj) {return false}
        return true;
    }

    // create interface to read terminal input
    this.rl.on('line', (line) => {

        if (line.startsWith("discord ")) {

            if (!this.isEmptyObj(this.discord) && this.discord.isConnected) {
                
                this.discord.client.channels.fetch(globalVars.textChannelId).then(channel => {
                    channel.send(line.substring(8))
                }).catch(e => {
                    console.log(e)
                })

            } else {
                console.log("discord has not connected yet")
            }


        } else if (!this.isConnected()) {
            console.log("discord or mc has not connected yet")

        } else if (line.startsWith("/stop")) {

            // instantly stop server
            if (line.startsWith("/stop now")) {

                this.minecraft.writeCommand("/kick @a Stopped For Emergency Maintenance")
                this.minecraft.writeCommand("/stop")
                this.discord.client.user.setStatus('idle')

            } else {

                // set a flag that is checked when the mcServer stops
                if (line.split(" ")[2] == "a") {
                    stopAll = true;
                }

                // check if the minutes till stop parameter is a number
                minTillStop = line.split(" ")[1]
                minTillStop = Number.isInteger(Number.parseInt(minTillStop)) ? Number.parseInt(minTillStop) : 3


                this.minecraft.writeCommand("/say SERVER STOPPING IN " + minTillStop + " MINUTE" + (minTillStop != 1 ? "S" : ""))
                setTimeout(() => {
                    this.minecraft.writeCommand("/say SERVER STOPPING IN 30 SECONDS")
                    setTimeout(() => {
                        this.stopServer();
                    }, 30 * 1000)
                }, minTillStop * 60 * 1000)
            }

        } else if (line.startsWith("/start")) {
            this.minecraft.startServer();

        } else if (line.startsWith("/")) {
            this.minecraft.writeCommand(line.toString())

        } else if (line.startsWith("help")) {
            console.log(`
      discord - message discord channel
      
      /start - start server
      /stop (delay in minutes || now - to stop immediatly)
      any other command starting with / will be sent to the minecraft server 
      `)
        }


    })

    return this;
}

