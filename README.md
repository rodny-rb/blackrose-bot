# 🖤 BLACK ROSE Alert Bot

> **The ultimate Telegram companion for your CMS.**  
> Real-time alerts, live analytics, workflow automation, and a custom Mini-App dashboard – all in one secure bot.

![Status](https://img.shields.io/badge/Status-Live-green)
![Platform](https://img.shields.io/badge/Platform-Telegram%20%7C%20Render-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Overview

**BLACK ROSE Alert** is a powerful Telegram bot designed to bridge the gap between your content management system (CMS) and your mobile device. Whether you are managing a blog, an e-commerce store, or a custom web platform, this bot keeps you informed and in control from anywhere.

Built with **Node.js**, **Express**, and **Telegraf**, and deployed on **Render.com**, it leverages Telegram's **Webhook** architecture for instant, low-latency notifications.

### ✨ Key Features

*   **📢 Instant Notifications:** Receive real-time alerts for new posts, security breaches, system errors, and user activity.
*   **📊 Live Analytics:** Check your site's traffic, user counts, and post statistics instantly via `/stats`.
*   **⚡ Workflow Automation:** Approve drafts, publish posts, or trigger system actions directly from inline buttons in Telegram.
*   **📱 Telegram Mini-App:** A built-in visual dashboard (`/miniapp`) showing real-time charts and stats without leaving the app.
*   **🔒 Secure & Scalable:** Uses environment variables for secrets, runs on serverless infrastructure, and supports role-based access.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Language** | JavaScript (Node.js 24+) |
| **Framework** | Express.js (Web Server) + Telegraf (Bot Logic) |
| **Hosting** | Render.com (Free Tier) |
| **Database Bridge** | PHP (for legacy CMS integration) |
| **Frontend** | Telegram Web App SDK (HTML/JS) |
| **Version Control** | GitHub |

---

## 📦 Installation & Setup

### 1. Prerequisites
*   A **Telegram Bot Token** (from [@BotFather](https://t.me/BotFather)).
*   A **Telegram User ID** (from [@userinfobot](https://t.me/userinfobot)).
*   A **Render.com** account (free tier is sufficient).
*   A **GitHub** account.
*   Access to your CMS hosting (e.g., `rodny.free.nf`).

### 2. Clone & Configure
1.  **Fork/Clone** this repository to your GitHub account.
2.  **Set Environment Variables** in your Render Dashboard:
    *   Go to your Service → **Environment**.
    *   Add `TELEGRAM_TOKEN`: Your bot's API token.
    *   Add `ADMIN_ID`: Your numeric Telegram User ID.
    *   (Optional) Add `CMS_API_KEY` if using secured endpoints.

### 3. Deploy to Render
1.  Connect your GitHub repo to Render.
2.  **Build Command:** `npm install`
3.  **Start Command:** `node server.js`
4.  Click **Deploy**. The bot will automatically set its webhook upon startup.

---

## 📱 Usage Guide

### Basic Commands
| Command | Description |
| :--- | :--- |
| `/start` | Initialize the bot and see the welcome message. |
| `/stats` | Fetch live analytics (Views, Users, Posts) from your CMS. |
| `/help` | Display a list of available commands and features. |

### Interactive Features
*   **Approval Workflow:** When a draft is published, the bot sends a message with `[✅ Approve]` and `[❌ Reject]` buttons.
*   **Mini-App Dashboard:** Tap the **"Open App"** button (configured in BotFather) to launch a rich UI dashboard with live data visualization.

### Integrating with Your CMS
To enable alerts, add a simple PHP script to your CMS root (`trigger_webhook.php`) that sends a POST request to your Render URL:
```php
<?php
$webhook_url = "https://your-bot.onrender.com/webhook";
$data = ["event" => "post_published", "title" => "New Post", "id" => 123];
// ... cURL logic to send $data to $webhook_url
?>