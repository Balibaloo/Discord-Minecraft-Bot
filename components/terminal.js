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
    this.rl.on('line', terminalInputHandler)

    let terminalInputHandler = (line) => {

        if (line.startsWith("discord ")) {

            if (!this.isEmptyObj(this.discord) && this.discord.isConnected) {
                this.discord.sendMessage(line.substring(8))

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
                this.discord.setStatus('idle')

            } else {

                // check if user wants to also stop the bot process
                if (line.split(" ")[2] == "a") {
                    stopAll = true;
                }

                // get minutes till stop parameter
                minTillStop = line.split(" ")[1]
                minTillStop = Number.isInteger(Number.parseInt(minTillStop)) ? Number.parseInt(minTillStop) : globalVars.defaultMinTillStop


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


    }

    return this;
}

