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

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_OAUTH_TOKEN = process.env.TWITCH_OAUTH_TOKEN;
const TWITCH_USERNAME = process.env.TWITCH_USERNAME;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

let wasLive = false; // Variable to track live status

// Function to check if the user is live on Twitch
async function isLive() {
  const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USERNAME}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${TWITCH_OAUTH_TOKEN}`,
    },
  });

  const data = await response.json();

  // Return true if the stream is live, false if not
  return data.data && data.data.length > 0;
}

// Function to check live status and send a message if the status changes
async function checkLiveStatus() {
  const live = await isLive();

  if (live && !wasLive) {
    // If you go live and it hasn't been recorded yet, send the message
    wasLive = true; // Set flag that you're live
    const channel = client.channels.cache.get(DISCORD_CHANNEL_ID);
    channel.send(`@everyone I\'m live yippiiii! Check it out here: https://www.twitch.tv/${TWITCH_USERNAME}`);
  } else if (!live && wasLive) {
    // If you go offline and then back live, reset the flag
    wasLive = false; // Set flag that you're no longer live
  }
}

// Log in to Discord bot
client.once('ready', () => {
  console.log('Bot is ready!');
  
  // Check the live status every minute
  setInterval(checkLiveStatus, 60000); // Check every 60 seconds
});

client.login(process.env.BOT_TOKEN);

