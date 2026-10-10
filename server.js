
const express = require('express');
const cors = require('cors');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 3000;

const SITE_URL = 'https://rodny.free.nf';
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const WEBHOOK_PATH = '/telegram';

if (!TELEGRAM_TOKEN) {
  throw new Error('Missing TELEGRAM_TOKEN environment variable');
}

const bot = new Telegraf(TELEGRAM_TOKEN);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('BLACK ROSE BOT IS RUNNING! 🖤');
});

// Telegram webhook
app.post(WEBHOOK_PATH, async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    if (!res.headersSent) {
      res.sendStatus(500);
    }
  }
});

// Send a message from your website to Telegram
app.post('/send-alert', async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!chatId || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'chatId and a non-empty message are required'
      });
    }

    await bot.telegram.sendMessage(chatId, message);

    return res.json({ ok: true, sent: true });
  } catch (error) {
    console.error('Send alert error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to send Telegram message'
    });
  }
});

// Bot command: /stats
bot.command('stats', async (ctx) => {
  let timeout;

  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${SITE_URL}/api/stats.php`, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Stats API returned HTTP ${response.status}`);
    }

    const data = await response.json();

    await ctx.reply(
      `📊 BLACK ROSE Live Stats\n\n` +
      `Views: ${data.views ?? 0}\n` +
      `Users: ${data.users ?? 0}\n` +
      `Posts: ${data.posts ?? 0}`
    );
  } catch (error) {
    console.error('Stats error:', error);
    await ctx.reply('❌ Could not retrieve site statistics.');
  } finally {
    if (timeout) clearTimeout(timeout);
  }
});

// Bot command: /start
bot.command('start', async (ctx) => {
  await ctx.reply(
    '🖤 Welcome to BLACK ROSE Alert!\n\n' +
    'Use /stats for analytics.\n' +
    'Visit: https://rodny.free.nf'
  );
});

// Approve-post callback
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data || '';

  if (!data.startsWith('approve:')) {
    return ctx.answerCbQuery();
  }

  const id = data.slice('approve:'.length);

  // Only allow a positive integer ID.
  if (!/^[1-9]\d*$/.test(id)) {
    return ctx.answerCbQuery('Invalid post ID');
  }

  try {
    const url = new URL(`${SITE_URL}/api/approve.php`);
    url.searchParams.set('id', id);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Approval API returned HTTP ${response.status}`);
    }

    await ctx.answerCbQuery('Post approved');
    await ctx.editMessageText(`✅ Post ${id} approved!`);
  } catch (error) {
    console.error('Approval error:', error);
    await ctx.answerCbQuery('Approval failed');
  }
});

// BLACK ROSE Telegram Mini App
app.get('/miniapp', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BLACK ROSE CMS</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #0f0f12;
      color: #fff;
      font-family: Arial, sans-serif;
      text-align: center;
    }
    h1 { color: #b6a0ff; }
    .card {
      background: #1e1e24;
      border: 1px solid #33333d;
      padding: 18px;
      border-radius: 12px;
      margin: 14px 0;
    }
    .val {
      font-size: 28px;
      font-weight: bold;
      color: #b6a0ff;
    }
    button {
      background: #6d4aff;
      color: white;
      border: 0;
      padding: 12px 22px;
      border-radius: 8px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>🖤 BLACK ROSE</h1>
  <div class="card">
    <h3>Views</h3>
    <div id="v" class="val">Loading...</div>
  </div>
  <div class="card">
    <h3>Users</h3>
    <div id="u" class="val">Loading...</div>
  </div>
  <button id="close">Close</button>

  <script>
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    document.getElementById('close').addEventListener('click', () => {
      tg.close();
    });

    fetch('${SITE_URL}/api/stats.php')
      .then(response => {
        if (!response.ok) throw new Error('Stats unavailable');
        return response.json();
      })
      .then(data => {
        document.getElementById('v').textContent = data.views ?? 0;
        document.getElementById('u').textContent = data.users ?? 0;
      })
      .catch(() => {
        document.getElementById('v').textContent = 'Offline';
        document.getElementById('u').textContent = 'Offline';
      });
  </script>
</body>
</html>`;

  res.type('html').send(html);
});

// Start server and register webhook
async function startServer() {
  const server = app.listen(PORT, async () => {
    console.log(`🖤 BLACK ROSE server listening on port ${PORT}`);
  });

  server.on('error', (error) => {
    console.error('HTTP server error:', error);
    process.exitCode = 1;
  });

  const renderUrl = process.env.RENDER_EXTERNAL_URL;

  if (!renderUrl) {
    console.error('Missing RENDER_EXTERNAL_URL; webhook not registered.');
    return;
  }

  const webhookUrl = new URL(WEBHOOK_PATH, renderUrl).toString();

  try {
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`✅ Telegram webhook registered: ${webhookUrl}`);
    console.log('🖤 BLACK ROSE bot is ready.');
  } catch (error) {
    console.error('Telegram webhook registration failed:', error);
  }
}

startServer();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));