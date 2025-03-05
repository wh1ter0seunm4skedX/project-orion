# Project Orion: Telegram Bot

A simple Telegram bot webhook implementation powered by Express.js and the Telegram Bot API.

## Current Implementation

- Webhook-based Telegram bot for receiving messages
- Command handling (/start, /help)
- Callback query handling for button interactions
- Express API with debug endpoints

## Setup

1. Create a Telegram bot using BotFather
2. Copy the API token to `.env` file (see Environment Variables section below)
3. For local development, use a tunneling service like ngrok
4. For production, deploy to Vercel (see Deployment section)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
NODE_ENV=development
PORT=3000
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build

# Run in production mode
npm start
```

## Deployment to Vercel

This project includes a `vercel.json` configuration file for easy deployment to Vercel.

### Pre-deployment Steps

1. Make sure your code is committed to a Git repository (GitHub, GitLab, etc.)
2. Build the project locally first to make sure everything compiles correctly:
   ```bash
   npm run build
   ```

### Deployment Steps

1. Install Vercel CLI (optional, you can also use the Vercel web interface):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. Set up environment variables in the Vercel dashboard:
   - Go to your project settings
   - Add the `TELEGRAM_BOT_TOKEN` environment variable
   - Set `NODE_ENV` to `production`

5. After deployment, get your Vercel domain (e.g., `https://your-project.vercel.app`)

6. Set the Telegram webhook to your Vercel domain:
   ```bash
   curl -F "url=https://your-project.vercel.app/api/webhook" https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook
   ```

7. Verify the webhook was set successfully:
   ```bash
   curl https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo
   ```

## License

MIT