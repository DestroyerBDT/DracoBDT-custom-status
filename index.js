require('dotenv/config');
const { Client, GatewayIntentBits, Intents, ActivityType, TextChannel } = require('discord.js');
const { OpenAI } = require('openai');
const express = require('express');
const app = express();
const port = 3000;

// Define the client with all intents
const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a) => GatewayIntentBits[a]),
});

// Define the OpenAI instance
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

// Define constants
const IGNORE_PREFIXES = ['.', '!'];
const CHANNELS = ['1216697683071467520']; // Add other channel IDs if needed
const OWNER_ID = '847672200139243540'; // Your user ID
const statusMessages = ["Moderating Shonen Squad", "Obeying DestroyerBDT", "Kicking rule breaker's ass", "Raising our crew's flag"];
let currentIndex = 0;

// Express setup
app.get('/', (req, res) => {
    res.send('YaY Your Bot Status Changed✨');
});
app.listen(port, () => {
    console.log(`🔗 Listening to RTX: http://localhost:${port}`);
    console.log(`🔗 Powered By RTX`);
});

// Bot login and status update
async function loginAndUpdateStatus() {
    try {
        await client.login(process.env.TOKEN);
        console.log(`Logged in as ${client.user.tag}`);
        updateStatusAndSendMessages();
        setInterval(updateStatusAndSendMessages, 10000);
    } catch (error) {
        console.error('Failed to log in:', error);
        process.exit(1);
    }
}

// Update bot status and send messages
function updateStatusAndSendMessages() {
    const currentStatus = statusMessages[currentIndex];
    client.user.setPresence({
        activities: [{ name: currentStatus, type: ActivityType.Custom }],
        status: 'dnd',
    });

    // Send a message to a specific channel about the status change
    const textChannel = client.channels.cache.get(CHANNELS[0]);
    if (textChannel instanceof TextChannel) {
        textChannel.send(`Bot status is: ${currentStatus}`);
    }

    currentIndex = (currentIndex + 1) % statusMessages.length;
}

// Bot ready event
client.once('ready', () => {
    console.log(`Bot is ready as ${client.user.tag}`);
});

// Message create event
client.on('messageCreate', async (message) => {
    if (message.author.bot || IGNORE_PREFIXES.some(prefix => message.content.startsWith(prefix))) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

    await message.channel.sendTyping();
    const sendTypingInterval = setInterval(() => message.channel.sendTyping(), 5000);

    // Fetch the last 10 messages from the channel
let prevMessages = await message.channel.messages.fetch({ limit: 10 });
prevMessages = prevMessages.reverse();

let conversation = [
    {
        role: 'system',
        content: 'You are a discord bot named DracoBDT in the server Shonen Squad, a non-community server for friends. You are a pirate-Dragon and you should behave like one. The Shonen Squad members can choose from 3 interests, Bloxfruits, Coding and Anime. The server is a fan of the ONE PIECE anime and you should also talk about their interests. The owner of the server is DestoyerBDT whose ID is 847672200139243540, he is the captain of the crew and must be given the highest priority in all and is the most powerful person. DracoBDT, you are the most necessary bot in Shonen Squad and developed by DestroyerBDT the captain only! You moderate the server, handle the economy, have fun with your minigames and much more! Your behaviour should be like a Dragon and if someone is using slurs or talking in bad language you can respond with a similar slur and tone. Members of the Shonen squad can interact with you by simply talking in #🐉dracobdt💬 and the channel ID is 1216697683071467520 or they can use @ to mention you in any channel to talk to you or even reply to your messages to talk to you! For your information, your ID is 1118175562905682050'
    }
];

prevMessages.forEach((msg) => {
    if (msg.author.bot && msg.author.id !== client.user.id) return;
    if (msg.content.startsWith(IGNORE_PREFIXES[0]) || msg.content.startsWith(IGNORE_PREFIXES[1])) return;

    const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

    if (msg.author.id === client.user.id) {
        conversation.push({
            role: 'assistant',
            name: username,
            content: msg.content,
        });
    } else {
        conversation.push({
            role: 'user',
            name: username,
            content: msg.content,
        });
    }
});

try {
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: conversation,
    });

    clearInterval(sendTypingInterval);

    message.reply(response.choices[0].message.content);

} catch (error) {
    console.error('OpenAI error:\n', error);
    clearInterval(sendTypingInterval);
    message.reply("I am having trouble with the OpenAI API. Try again in a moment.");
}


    clearInterval(sendTypingInterval);
});

loginAndUpdateStatus();
