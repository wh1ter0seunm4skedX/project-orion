import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
app.use(express.json());

// Telegram bot token from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

console.log('Bot token available:', TELEGRAM_BOT_TOKEN ? 'Yes' : 'No (empty string)');

// Initialize the bot with proper options
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
  polling: false // Make sure polling is off since we're using webhooks
});

// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Webhook endpoint for Telegram
app.post('/api/webhook', async (req, res) => {
  let responseSent = false;
  
  try {
    // Log the entire request for debugging
    console.log('\n📥 WEBHOOK REQUEST:');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('Body snippet:', JSON.stringify(req.body).substring(0, 200) + '...');
    
    // Process the update
    const update: TelegramBot.Update = req.body;
    
    // Log the update
    console.log('\n📥 TELEGRAM UPDATE:');
    console.log('Update type:', 
      update.message ? 'Message' : 
      update.callback_query ? 'Callback Query' : 
      update.inline_query ? 'Inline Query' : 
      'Other');
    
    if (update.message?.text) {
      console.log(`Message from ${update.message.from?.first_name || 'unknown'} (${update.message.from?.id || 'unknown'}): "${update.message.text}"`);
    }
    
    // Send immediate response to Telegram
    res.status(200).send('OK');
    responseSent = true;
    console.log('✅ Responded to Telegram with 200 OK');
    
    // Process update asynchronously after response is sent
    if (update.message) {
      // Use a try-catch here to capture errors in the async processing
      try {
        await handleMessage(update.message);
      } catch (error) {
        console.error('❌ Error processing message asynchronously:', error);
      }
    } else if (update.callback_query) {
      try {
        await handleCallbackQuery(update.callback_query);
      } catch (error) {
        console.error('❌ Error processing callback query asynchronously:', error);
      }
    }
  } catch (error) {
    console.error('❌ Error in webhook:', error);
    // Only send response if one hasn't been sent already
    if (!responseSent) {
      res.status(200).send('OK');
    }
  }
});

// Handle incoming messages
async function handleMessage(message: TelegramBot.Message) {
  if (!message.text || !message.from) {
    console.log('⚠️ Received message without text or sender info');
    return;
  }
  
  const chatId = message.chat.id;
  const text = message.text;
  
  console.log(`\n🔄 PROCESSING MESSAGE: "${text}"`);
  console.log(`From: ${message.from.first_name} ${message.from.last_name || ''} (ID: ${message.from.id})`);
  console.log(`Chat: ${message.chat.title || 'Private'} (ID: ${chatId})`);
  
  try {
    // Validate token before attempting to send messages
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('❌ Cannot send message: Telegram Bot Token is not set');
      return;
    }
    
    // Handle commands
    if (text.startsWith('/')) {
      console.log(`🤖 Command detected: ${text}`);
      await handleCommand(chatId, text);
      return;
    }
    
    // Echo the message back for now
    console.log(`🔁 Echoing message back: "${text}"`);
    const sentMessage = await bot.sendMessage(chatId, `You said: ${text}`);
    console.log(`✅ Message sent to Telegram (Message ID: ${sentMessage.message_id})`);
    
  } catch (error) {
    console.error('❌ Error handling message:', error);
    try {
      await bot.sendMessage(
        chatId, 
        'Sorry, I encountered an error while processing your message.'
      );
    } catch (sendError) {
      console.error('❌ Failed to send error message to user:', sendError);
    }
  }
}

// Handle commands
async function handleCommand(chatId: number | string, command: string) {
  const cmd = command.split(' ')[0].toLowerCase();
  
  console.log(`\n📝 PROCESSING COMMAND: ${cmd}`);
  
  switch (cmd) {
    case '/start':
      console.log('🚀 Sending start message');
      await bot.sendMessage(
        chatId,
        'Welcome to Orion! 🌟 I\'m a simple Telegram bot. Currently, I can only echo your messages back to you, but I\'ll learn more soon!'
      );
      console.log('✅ Start message sent');
      break;
      
    case '/help':
      console.log('ℹ️ Sending help message');
      await bot.sendMessage(
        chatId,
        'Here\'s what I can do:\n\n' +
        '• Echo your messages back to you\n\n' +
        'Commands:\n' +
        '/start - Start using the bot\n' +
        '/help - Show this help message'
      );
      console.log('✅ Help message sent');
      break;
      
    default:
      // Unknown command
      console.log(`⚠️ Unknown command: ${cmd}`);
      await bot.sendMessage(
        chatId,
        'I don\'t recognize that command. Type /help to see what I can do!'
      );
      console.log('✅ Unknown command message sent');
  }
}

// Handle callback queries (button clicks) - minimal implementation
async function handleCallbackQuery(query: TelegramBot.CallbackQuery) {
  if (!query.data || !query.message) {
    console.log('⚠️ Received callback query without data or message');
    return;
  }
  
  console.log(`\n👆 CALLBACK QUERY: ${query.data}`);
  console.log(`From: ${query.from.first_name} ${query.from.last_name || ''} (ID: ${query.from.id})`);
  
  await bot.answerCallbackQuery(query.id, { text: 'Button clicked!' });
  console.log('✅ Callback query answered');
}

// Set webhook URL
export async function setWebhook(url: string) {
  try {
    // For webhook URL, we don't need to add the token in the URL
    await bot.setWebHook(`${url}/api/webhook`);
    console.log(`🔗 Webhook set to ${url}/api/webhook`);
    return true;
  } catch (error) {
    console.error('❌ Error setting webhook:', error);
    return false;
  }
}

// Add a test route to confirm the server is running
app.get('/', (req, res) => {
  res.send('Project Orion Telegram Bot is running! 🚀');
});

// Add route to check environment variables
app.get('/debug', (req, res) => {
  res.send({
    telegramTokenAvailable: Boolean(TELEGRAM_BOT_TOKEN),
    telegramTokenLength: TELEGRAM_BOT_TOKEN?.length || 0,
    nodeEnv: process.env.NODE_ENV || 'not set'
  });
});

// Start the server if running locally
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log('\n📱 For local development with ngrok:');
    console.log('  1. Run ngrok: ngrok http 3000');
    console.log('  2. Copy the https URL from ngrok');
    console.log('  3. Set the webhook using:');
    console.log(`     curl -F "url=NGROK_URL/api/webhook" https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`);
    console.log('\n⏳ Waiting for Telegram updates...');
  });
}

export default app;
