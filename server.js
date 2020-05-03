/* Setup

   1. Create a .env file (click add file then remane it to .env)

   2. Put "token=" (without quotes) into the .env file followed by your Discord Bot token (No spaces!)

   3. Replace the textChannelId variable with the id of the text channel that you want the bot to work in

*/

require('dotenv').config()
let globalVars = {}

globalVars.serverDir = "/home/romankubiv101/Documents/minecraft-server"
globalVars.textChannelId = "572028973668630532"
globalVars.botToken = process.env.token
globalVars.roleTag = true  ? "@minecraft" + " " : ""
globalVars.onlyOneChanelMode = true;
globalVars.autostartMinecraftServer = true;
globalVars.maxChannelConnectRetries = 5;

globalVars.autostopWhenEmpty = false;
globalVars.minTilAutoStopWhenEmpty = 1;

globalVars.mcMemoryMin = '1G'
globalVars.mcMemoryMax = '8G'




const terminal = require('./components/terminal')(globalVars);
const discord = require('./components/discord')(globalVars);
const minecraft = require('./components/minecraft')(globalVars);

terminal.setDiscord(discord)
terminal.setMinecraft(minecraft)

discord.setMinecraft(minecraft)
minecraft.setDiscord(discord)






