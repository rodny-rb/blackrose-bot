// server.js
const express = require("express");
const cors = require("cors");
const { Telegraf } = require("telegraf");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

const SITE_URL = "https://rodny.free.nf";
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Health check
app.get("/", (req, res) => {
  res.send("BLACK ROSE BOT IS RUNNING! 🖤");
});

// Telegram webhook
app.post("/telegram", (req, res) => {
  bot.handleUpdate(req.body, res);
});

// Send message from website to Telegram
app.post("/send-alert", async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({
        ok: false,
        error: "chatId and message are required"
      });
    }

    await bot.telegram.sendMessage(chatId, message);

    return res.json({
      ok: true,
      sent: true
    });
  } catch (error) {
    console.error("Send alert error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to send Telegram message"
    });
  }
});

// /stats command
bot.command("stats", async (ctx) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${SITE_URL}/api/stats.php`, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error("HTTP error");

    const data = await response.json();

    const text = `📊 Live Stats\n\nViews: ${data.views}\nUsers: ${data.users}\nPosts: ${data.posts}`;
    await ctx.reply(text);
  } catch (error) {
    console.error("Stats error:", error);
    await ctx.reply("❌ Site offline or timeout.");
  }
});

// /start command
bot.command("start", async (ctx) => {
  await ctx.reply("🖤 Welcome to BLACK ROSE Alert!\nUse /stats for analytics.\nVisit: https://rodny.free.nf");
});

// Approve callback
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith("approve:")) {
    const id = data.split(":")[1];
    try {
      await fetch(`${SITE_URL}/api/approve.php?id=${id}`);
      await ctx.answerCbQuery();
      await ctx.editMessageText(`✅ Post ${id} Approved!`);
    } catch (error) {
      await ctx.answerCbQuery();
      await ctx.editMessageText(`❌ Failed to approve ${id}.`);
    }
  }
});

// Mini app page
app.get("/miniapp", (req, res) => {
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Black Rose</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
      body {
        background: #0f0f12;
        color: white;
        font-family: sans-serif;
        text-align: center;
        padding: 20px;
      }
      h1 { color: #6d4aff; }
      .card {
        background: #1e1e24;
        padding: 15px;
        border-radius: 10px;
        margin: 10px 0;
      }
      .val {
        font-size: 24px;
        font-weight: bold;
        color: #6d4aff;
      }
    </style>
  </head>
  <body>
    <h1>🖤 Black Rose CMS</h1>
    <div class="card"><h3>Views</h3><div id="v" class="val">Loading...</div></div>
    <div class="card"><h3>Users</h3><div id="u" class="val">Loading...</div></div>
    <button onclick="window.Telegram.WebApp.close()" style="background:#6d4aff;color:white;border:none;padding:10px 20px;border-radius:5px;">Close</button>
    <script>
      window.Telegram.WebApp.expand();
      fetch('/api/stats.php').then(r => r.json()).then(d => {
        document.getElementById('v').innerText = d.views;
        document.getElementById('u').innerText = d.users;
      }).catch(() => {
        document.getElementById('v').innerText = 'Offline';
        document.getElementById('u').innerText = 'Offline';
      });
    </script>
  </body>
  </html>`;

  res.send(html);
});

// Start web server
app.listen(PORT, () => {
  console.log(`✅ Web server listening on port ${PORT}`);
});

// Set Telegram Webhook
const WEBHOOK_PATH = "/telegram";
let domain = process.env.RENDER_EXTERNAL