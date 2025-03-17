require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.BOT_TOKEN).catch((error) => {
    console.error("❌ Login failed:", error);
});


//AUTO ROLE

const AUTO_ROLE_ID = '1349303248867164234'; // Replace with your role ID

client.on('guildMemberAdd', async (member) => {
    try {
        console.log(`New member joined: ${member.user.tag}`);
        const role = member.guild.roles.cache.get(AUTO_ROLE_ID);
        
        // Check if the role exists
        if (!role) {
            console.log("❌ Role not found! Check the role ID.");
            return;
        }
        
        console.log(`Attempting to assign role ${role.name} to ${member.user.tag}`);

        // Attempt to assign the role
        await member.roles.add(role);
        console.log(`✅ Successfully assigned role ${role.name} to ${member.user.tag}`);
    } catch (error) {
        console.error(`❌ Error giving role: ${error}`);
    }
});


//TWITCH

const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const liveStatusPath = './liveStatus.json';

// Function to get the saved live status
function getLiveStatus() {
    try {
        const data = fs.readFileSync(liveStatusPath);
        return JSON.parse(data).isLive;
    } catch (error) {
        return false; // Default to false if file doesn't exist
    }
}

// Function to save the live status
function setLiveStatus(status) {
    fs.writeFileSync(liveStatusPath, JSON.stringify({ isLive: status }, null, 2));
}

// Function to get Twitch OAuth token
async function getTwitchOAuthToken() {
    const url = "https://id.twitch.tv/oauth2/token";
    const params = new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
    });

    const response = await fetch(url, {
        method: "POST",
        body: params,
    });

    const data = await response.json();
    return data.access_token;
}

// Function to check if the user is live on Twitch
async function isLive() {
    const token = await getTwitchOAuthToken();
    const url = `https://api.twitch.tv/helix/streams?user_login=${process.env.TWITCH_CHANNEL_NAME}`;

    const response = await fetch(url, {
        headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            "Authorization": `Bearer ${token}`,
        },
    });

    const data = await response.json();
    return data.data.length > 0 ? data.data[0] : null;
}

// Function to check and send live notifications
async function checkLiveStatus() {
    const liveStream = await isLive();
    const wasLive = getLiveStatus();
    const discordChannel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);

    if (liveStream && !wasLive) {
        setLiveStatus(true); //update live status
        if (discordChannel) {
            discordChannel.send(`@everyone\n🎥 **${process.env.TWITCH_CHANNEL_NAME}** is now live on Twitch!\n📺 Watch here: https://www.twitch.tv/${process.env.TWITCH_CHANNEL_NAME}`);
            }
    } else if (!liveStream) {
        setLiveStatus(false); // Reset when the stream ends
    }

    // Check every 5 minutes
    setTimeout(checkLiveStatus, 300000);
}

// Start the bot and begin checking live status
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    checkLiveStatus(); // Start checking Twitch
});


client.login(process.env.BOT_TOKEN);



//someone joins the server
client.on('guildMemberAdd', (member) => {
    const channel = member.guild.systemChannel || member.guild.channels.cache.find(ch => ch.name === 'moderator-only'); 
    if (channel) {
        channel.send(`👋 Welcome, ${member}!`);
    }
});

//someone leaves the server
client.on('guildMemberRemove', (member) => {
    const channel = member.guild.systemChannel || member.guild.channels.cache.find(ch => ch.name === 'moderator-only'); 
    if (channel) {
        channel.send(`😢 ${member.user.tag} has left the server.`);
    }
});

//someone edited a message
client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.author.bot) return;
    const logChannel = oldMessage.guild.channels.cache.find(ch => ch.name === 'moderator-only'); 
    if (logChannel) {
        logChannel.send(`✏️ **Message edited** by ${oldMessage.author.tag} in ${oldMessage.channel}:\n**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`);
    }
});

//someone deleted a message
client.on('messageDelete', (message) => {
    if (message.author.bot) return;
    const logChannel = message.guild.channels.cache.find(ch => ch.name === 'moderator-only'); 
    if (logChannel) {
        logChannel.send(`🗑 **Message deleted** by ${message.author.tag} in ${message.channel}:\n**Content:** ${message.content}`);
    }
});


