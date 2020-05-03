const Discord = require('discord.js');



module.exports = (globalVars) => {

    this.minecraft = {}
    this.isConnected = false;

    this.setMinecraft = (minecraft) => {this.minecraft = minecraft}

    this.isEmptyObj = (obj) => {
        for (var prop in obj) {return false}
        return true;
    }

    this.stringHasAll = (string, words) => {
        return words.map((word) => {
            return string.indexOf(word) != -1
        }).every(val => val)
    }

    this.client = new Discord.Client();

    this.client.on('ready', () => {
        this.setStatus('dnd')

        this.isConnected = true;
        
        console.log(`Logged in as ${this.client.user.tag}!`);

        if (globalVars.autostartMinecraftServer) {
            this.minecraft.startServer();
        }

       
    });

    this.client.on('message', message => {

        if (this.isEmptyObj(this.minecraft)) {
            console.log("minecraft is not connected yet")

        } else if (!globalVars.onlyOneChanelMode || message.channel.id == globalVars.textChannelId) {
            // check that the message is in the specified channel

            messageText = message.content
    
            if (messageText.indexOf("is the server up?") != -1) {
                message.channel.send(this.minecraft.mcServerProcess != null ? "Yea!" : "Nah G");
    
    
            } else if (this.stringHasAll(message.content, ["start", "server", "please"])) {
                minecraft.startServer();
    
            } else if (this.stringHasAll(message.content, ["start", "server"])) {
                this.sendMessage("not even a please? smh")
    
            } else if (message.content.startsWith("@mc ")) {
                //.filter((char) => {return !(char in ["/"])})
                this.minecraft.writeCommand("/say [" + message.author.username + "] " + message.content.substring(3))

            } else if (message.content.startsWith("roman help")){
                this.sendMessage(`
                is the server up? - check if the server is up
                start server please - starts server

                @mc - message the minecraft server
                `)
            }
    
        }
    });

    // login
    this.client.login(globalVars.botToken);


    // get a discord channel instance
    this.discordChannel = null;
    this.fetchChannel = (callback, iteration = 1) => {

        if (iteration > globalVars.maxChannelConnectRetries) {
            console.log("connection timmed out")
    
        } else {
            this.client.channels.fetch(globalVars.textChannelId)
                .then(channel => {
    
                    if (channel == null) {
                        // wait and try again
                        setTimeout(() => {
                            iteration++;
                            fetchChannel(callback, iteration)
                        }, 1000)
    
                    } else {
                        this.discordChannel = channel;
    
                        try {
                            callback();
    
                        } catch (error) {
                            console.log(error)
                        }
                    }
    
                }, e => console.log(e))
        }
    }

    this.sendMessage = (message) => {
        try {
            if (this.discordChannel == null) {
                this.fetchChannel(() => {
                    this.discordChannel.send(message)
                })
    
            } else {
                this.discordChannel.send(message)
            }
    
        } catch (error) {
            console.log(error)
        }
    
    }

    this.setStatus = (status) => {
        this.client.user.setStatus(status)
    }

    return this;
}















