console.log("Bot is starting...");  // <-- This will confirm if the code is executing

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

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

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

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    checkLiveStatus(); // Start checking immediately
});

// Function to check Twitch live status and send a message
async function checkLiveStatus() {
    const liveStream = await isLive();

    if (liveStream) {
        const discordChannel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
        if (discordChannel) {
            discordChannel.send(`🎥 **${process.env.TWITCH_CHANNEL_NAME}** is now live on Twitch!\n📺 Watch here: https://www.twitch.tv/${process.env.TWITCH_CHANNEL_NAME}`);
        }
    } else {
        console.log("Not live.");
    }

    // Check every 5 minutes
    setTimeout(checkLiveStatus, 300000);
}

client.login(process.env.BOT_TOKEN);

