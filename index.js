require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { HookClientFactory, Defaults } = require('evernode-js-client');
const schedule = require('node-schedule');

// Set default configuration for Evernode
Defaults.set({
    governorAddress: "rBvKgF3jSZWdJcwSsmoJspoXLLDVLDp6jg",
    rippledServer: "wss://xahau.network",
    stateIndexId: "evernodeprod",
    networkID: 21337
});

// Telegram Bot Token and Chat ID from .env file
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const allowedUserId = 5242456536;

// Hosts to monitor
const hostsToMonitor = new Set([
    "raddress",
    "raddress",
    "raddress",
    "raddress",
    
]);

function formatDomain(domain) {
    // Insert a zero-width space after the dot
    return domain.replace(/\./g, '.\u200B');
}

// Query the Xahau Ledger for active and inactive hosts
async function queryXahauLedger() {
    try {
        const registryClient = await HookClientFactory.create('REGISTRY');
        await registryClient.connect();

        const allHosts = await registryClient.getAllHostsFromLedger();
        let output = '*Hosts Report*\n\n';
        let totalAccumulatedReward = 0;
        let inactiveHostsOutput = '\n*Inactive Hosts*\n\n';

        allHosts.forEach(host => {
            if (hostsToMonitor.has(host.address)) {
                const formattedDomain = formatDomain(host.domain);
                let rewardFormatted = parseFloat(host.accumulatedRewardAmount);

                if (isNaN(rewardFormatted)) {
                    rewardFormatted = 'Data Unavailable';
                } else {
                    rewardFormatted = rewardFormatted.toFixed(2);
                }

                // Truncate address to last 8 digits
                const truncatedAddress = host.address.slice(-8);

                const activeOutput = `*Domain*: \`${formattedDomain}\`\n` +
                    `*Address*: ${truncatedAddress}\n` +
                    `*Active*: ${host.active ? 'True' : 'False'}\n` +
                    `*Accumulated Reward*: ${rewardFormatted}\n` +
                    `*Max Instances*: ${host.maxInstances}\n` +
                    `*Active Instances*: ${host.activeInstances}\n\n`;

                if (host.active) {
                    output += activeOutput;
                    if (!isNaN(rewardFormatted)) {
                        totalAccumulatedReward += parseFloat(rewardFormatted);
                    }
                } else {
                    inactiveHostsOutput += activeOutput;
                }
            }
        });

        output += `*Total Accumulated Reward for Active Hosts*: ${totalAccumulatedReward.toFixed(2)}\n`;
        output += inactiveHostsOutput;

        await registryClient.disconnect();
        return output || '_No matching hosts found._';
    } catch (error) {
        console.error('Error in queryXahauLedger:', error);
        return '_Error processing your request._';
    }
}

// Scheduled task to fetch ledger data
schedule.scheduleJob('50 * * * *', async function () {
    console.log('Running scheduled task to fetch ledger data');
    const ledgerData = await queryXahauLedger();
    if (ledgerData) {
        bot.sendMessage(chatId, ledgerData, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, 'No data available or an error occurred.');
    }
});

// Handle Telegram commands
bot.on('message', async (msg) => {
    if (msg.from.id === allowedUserId && msg.text === '/query') {
        bot.sendMessage(msg.chat.id, "Processing your request...");
        const ledgerData = await queryXahauLedger();
        if (ledgerData) {
            bot.sendMessage(chatId, ledgerData, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, 'No data available or an error occurred.');
        }
    }
});

// Start the bot
bot.on('polling_error', (error) => {
    console.log(error);
});
