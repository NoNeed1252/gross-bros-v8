/**
 * Guardian Discord Integration
 * Lightweight handler for Discord communications
 */
const { Client, GatewayIntentBits, WebhookClient } = require('discord.js');

class GuardianDiscord {
    constructor(token, webhookUrl) {
        this.token = token;
        this.webhook = webhookUrl ? new WebhookClient({ url: webhookUrl }) : null;
        this.client = token ? new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] }) : null;
    }

    // Initialize full bot if token is provided
    async init() {
        if (!this.client) return console.log('[GUARDIAN] No token provided, bot mode disabled.');
        
        this.client.once('ready', () => {
            console.log(`[GUARDIAN] Terminal online as ${this.client.user.tag}`);
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            if (message.content.toLowerCase().startsWith('!status')) {
                message.reply('System: Online. Status: Gritty. Perspective: Watching the floor.');
            }
        });

        await this.client.login(this.token);
    }

    // Direct transmission (Webhook mode - lightweight)
    async transmit(content) {
        if (!this.webhook) return console.error('[GUARDIAN] No webhook configured.');
        try {
            await this.webhook.send({
                content: `> **[GUARDIAN TRANSMISSION]**\n> ${content}`,
                username: 'Guardian',
                avatarURL: 'https://grossbros.vercel.app/favicon.ico'
            });
        } catch (err) {
            console.error('[GUARDIAN] Transmission failure:', err.message);
        }
    }
}

module.exports = GuardianDiscord;