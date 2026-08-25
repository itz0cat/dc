# DC Bot - All-Rounder Discord Bot

A fully customizable, feature-packed all-rounder Discord bot built with **Discord.js v14** and **SQLite**, inspired by CalypsoBot.

## 🚀 Features

- **120+ Commands** spanning **8 Categories**:
  - 🛠️ **Administration:** `setprefix`, `settings`, `togglecommand`, `toggletype`, `setadminrole`, `setmodrole`, `setmuterole`, `setautorole`, `setautokick`, `togglerandomcolor`, `togglepoints`, `setwelcomechannel`, `setwelcomemessage`, `setfarewellchannel`, `setfarewellmessage`, `setverificationchannel`, `setverificationmessage`, `setverificationrole`, `setstarboardchannel`, `setsystemchannel`, `setmodchannels`, `setmodlog`, `setmemberlog`, `setrolelog`, `setmessageeditlog`, `setmessagedeletelog`.
  - 🛡️ **Moderation:** `ban`, `softban`, `unban`, `kick`, `mute`, `unmute`, `warn`, `warns`, `warnpurge`, `clearwarns`, `purge`, `purgebot`, `slowmode`, `setnickname`, `addrole`, `removerole`.
  - 🎮 **Fun & Games:** `trivia`, `solotrivia`, `topics` (with 24 trivia topics), `meme`, `emojify`, `8ball`, `roll`, `rps`, `say`, `thouart`, `yesno`, `yomomma`, `trumptweet`, `youtube`, and animal commands (`cat`, `dog`, `bird`, `duck`, `fox`, `shibe`, `catfact`, `dogfact`).
  - ℹ️ **Information:** `help`, `commands`, `aliases`, `botinfo`, `serverinfo`, `userinfo`, `roleinfo`, `channelinfo`, `serverstaff`, `admins`, `mods`, `members`, `servericon`, `avatar`, `ping`, `stats`, `uptime`, `emojis`, `github`, `inviteme`.
  - 🏆 **Points & Economy:** `points`, `totalpoints`, `givepoints`, `leaderboard`, `position`, `pointsper`, `explainpoints`, `crown` (automatic weekly winner rotation).
  - 🎨 **Color Roles:** `color`, `colors`, `createcolor`, `createdefaultcolors`, `deletecolor`, `randomcolor`.
  - 👑 **Owner:** `eval`, `servers`, `blast`, `leaveguild`, `wipepoints`, `wipetotalpoints`, `wipeallpoints`, `wipealltotalpoints`.
  - 📌 **Miscellaneous:** `feedback`, `reportbug`, `nickname`.
- 📊 **Server Automation:**
  - Auto-role assignment on member join
  - Reaction verification system
  - Welcome and Farewell custom messages with placeholders (`?member`, `?username`, `?tag`, `?size`)
  - Full Mod Logging system with auto-incrementing case tracking
  - Starboard integration
  - Dynamic Voice & Message point accumulation
  - Reaction-based interactive menus (`ReactionMenu`)
- 💾 **High Performance Storage:** Native SQLite (`node:sqlite`) with zero external C++ build fragility.

---

## ⚙️ Configuration

Create a `config.json` (or `.env` file) in the root directory:

### `config.json`
```json
{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "ownerId": "YOUR_DISCORD_USER_ID",
  "bugReportChannelId": "CHANNEL_ID",
  "feedbackChannelId": "CHANNEL_ID",
  "serverLogId": "CHANNEL_ID",
  "apiKeys": {
    "catApi": "",
    "googleApi": ""
  }
}
```

### `.env`
```env
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
OWNER_ID=YOUR_DISCORD_USER_ID
BUG_REPORT_CHANNEL_ID=
FEEDBACK_CHANNEL_ID=
SERVER_LOG_ID=
CAT_API_KEY=
GOOGLE_API_KEY=
```

---

## 📦 Installation & Running

```bash
# Install dependencies
npm install

# Start the bot
node app.js
```

---

## 📜 License
GPL-3.0
