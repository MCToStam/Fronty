# Fronty 🤖

![License](https://img.shields.io/github/license/MCToStam/GloryStaff)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Contributions welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)

**Fronty** is a Discord bot designed to provide useful information and tools related to **OpenFront.io**.

The goal of Fronty is to make OpenFront data easier to access directly from Discord, allowing players and communities to quickly get information without leaving their server.

## ✨ Features

- 🌍 **OpenFront information access**
  - Retrieve useful information about OpenFront.
  - Access clan-related data.
  - Provide game-related utilities directly inside Discord.

- 🏰 **Clan support**
  - Search and display clan information.
  - Work with OpenFront clan data.

- 🌐 **Multi-language support**
  - 🇬🇧 English
  - 🇫🇷 French

- ⚡ **Scalable Discord architecture**
  - Supports Discord sharding.
  - Supports clustering for large bot deployments.
  - Designed with multi-machine support in mind.

## 🚀 Installation

### Requirements

Before installing Fronty, make sure you have:

- Node.js (recommended: latest LTS version)
- MongoDB database
- A Discord application and bot token
- An OpenFront refresh token (if required by your features)

### Clone the repository

```bash
git clone https://github.com/MCToStam/Fronty.git
cd Fronty
```

### Install dependencies

```bash
npm install
```

### Environment configuration

Create a `.env` file based on `.env.example`:

```env
DISCORD_TOKEN=

CROSS_HOST=false
TOTAL_SHARDS=auto
SHARDS_PER_CLUSTER=5
TOTAL_CLUSTERS=auto

# ---- Multi-machine mode (enable when needed) ----
# CROSS_HOST=
# BRIDGE_HOST=
# BRIDGE_PORT=
# BRIDGE_AUTH_TOKEN=
# TOTAL_MACHINES=
# TOTAL_SHARDS=

MONGO_URI=

OPENFRONT_REFRESH_TOKEN=
```

## ⚙️ Configuration

### Discord

`DISCORD_TOKEN`

Your Discord bot token.

You can create a Discord bot application from the Discord Developer Portal.

### Database

`MONGO_URI`

MongoDB connection string used to store and retrieve bot data.

### OpenFront API

`OPENFRONT_REFRESH_TOKEN`

Refresh token used to access OpenFront authenticated endpoints.

### Sharding and clustering

Fronty supports scalable Discord deployments:

```env
TOTAL_SHARDS=auto
SHARDS_PER_CLUSTER=5
TOTAL_CLUSTERS=auto
```

- `TOTAL_SHARDS`: Number of Discord shards.
- `SHARDS_PER_CLUSTER`: Amount of shards handled by one cluster.
- `TOTAL_CLUSTERS`: Number of bot clusters.

For larger deployments, multi-machine mode can be enabled.

## 🖥️ Multi-machine support

Fronty includes configuration options for running across multiple machines:

```env
CROSS_HOST=
BRIDGE_HOST=
BRIDGE_PORT=
BRIDGE_AUTH_TOKEN=
TOTAL_MACHINES=
TOTAL_SHARDS=
```

This allows horizontal scaling when a single machine is no longer enough.

## ▶️ Running the bot

Start Fronty with:

```bash
npm start
```

## 🛠️ Development

The project is structured to keep features separated and maintainable.

Main components include:

- Discord interaction handlers
- OpenFront API integration
- MongoDB models
- Localization system
- Sharding and clustering management

## 🌎 Localization

Fronty currently supports:

- English (`en`)
- French (`fr`)

The localization system is designed to make adding new languages easier in the future.

## 🤝 Contributing

Contributions are welcome!

If you want to improve Fronty:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Submit a pull request.

Please make sure your code is clean and follows the existing project structure.

## 📜 License

This project is distributed under the Apache License 2.0.

## 💙 Credits

Built for the **OpenFront.io community**.

Fronty is an independent Discord bot and is not affiliated with the official OpenFront.io development team.
