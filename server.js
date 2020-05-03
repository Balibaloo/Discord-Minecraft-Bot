require('dotenv').config()
let globalVars = process.env

const terminal = require('./components/terminal')(globalVars);
const discord = require('./components/discord')(globalVars);
const minecraft = require('./components/minecraft')(globalVars);

terminal.setDiscord(discord)
terminal.setMinecraft(minecraft)

discord.setMinecraft(minecraft)
minecraft.setDiscord(discord)