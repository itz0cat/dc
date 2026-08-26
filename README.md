# 🛡️ R.O.T.I Bot - Discord Community Management & Fun Bot

<div align="center">

![R.O.T.I Banner](https://img.shields.io/badge/R.O.T.I-v2.0.0-00A896?style=for-the-badge&logo=discord&logoColor=white)
![Theme Color](https://img.shields.io/badge/Theme-Teal%20Blue%20%2300A896-00A896?style=for-the-badge)
![Created By](https://img.shields.io/badge/Made%20by-itz0cat-00A896?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**The premier all-in-one Discord bot featuring Moderation, Ticket Systems, AutoMod, Giveaways, Suggestions, Starboard, Reaction/Button Roles, Mini-Games, and Utilities.**

</div>

---

## 🎨 Theme & Branding
- **Primary Color:** Teal Blue (`#00A896`)
- **Default Prefix:** `r!` (or Slash Commands `/`)
- **Developer:** `itz0cat`
- **Documentation Reference:** [https://docs.letsroti.com/](https://docs.letsroti.com/)

---

## ⚡ Features & Command Directory

### 🛠️ Server Management
- `/welcome [channel] [message] [embed] [image]` - Configure custom welcome cards with placeholders (`?member`, `?server`, `?size`).
- `/stickyroles [on/off]` - Automatically reassign roles when members leave and rejoin.
- `/mediaonly <on/off/list>` - Restrict channels to images, videos, and media files.
- `/linkonly <on/off/list>` - Restrict channels to links only.
- `/prefix <set/list/remove>` - Customize the server command prefix.
- `/modrole <set/remove/view>` - Set required moderator role.
- `/starboard <set/enable/disable/ignore>` - Full starboard system with reaction thresholds.
- `/memechannel <set/remove>` - Designate automatic meme channels.
- `/log <set/disable/view>` - Server event logging (message edits, deletes, member joins, mod actions).
- `/ticket <setup/config/add/remove/close/rename/stats/leaderboard>` - Comprehensive interactive ticket panel with HTML transcripts, claim buttons, and category organization.
- `/suggestion <set/submit/accept/decline/config/info>` - Suggestions system with voting buttons, discussion threads, and anonymous mode.
- `/tag <create/delete/list/info/get>` - Custom tag management system.
- `/trigger <create/delete/list>` - Auto-responder triggers.

### 🛡️ User Management & Moderation
- `/ban <user> [reason] [delete_days]` - Ban a user with optional message purge.
- `/softban <user> [reason]` - Softban a user (kick and clean messages).
- `/tempban <user> <duration> [reason]` - Temporarily ban a user.
- `/unban <user_id> [reason]` - Unban a user by ID.
- `/kick <user> [reason]` - Kick a member from the server.
- `/vkick <user> [votes]` - Community vote kick.
- `/timeout <user> <duration> [reason]` - Timeout/mute a member.
- `/removetimeout <user>` - Remove timeout from a member.
- `/warn <user> [reason]` - Issue a warning to a member.
- `/warnings <user>` - View all warnings for a user.
- `/delwarn <id>` - Delete a specific warning.
- `/clearwarns <user>` - Clear all warnings for a user.
- `/case <id>` - View moderation case details.
- `/reason <case_id> <new_reason>` - Update moderation action reason.
- `/modlogs <user>` - View infraction history of a user.
- `/lock [channel]` - Lock down a channel.
- `/unlock [channel]` - Unlock a locked channel.
- `/slowmode <time>` - Set channel slowmode.
- `/purge <amount> [filter]` - Bulk delete messages with optional filters (bots, links, media, user).
- `/nickname <user> [nickname]` - Change or reset a user's nickname.
- `/decancer <user>` - Remove zalgo / unreadable characters from nickname.
- `/note <set/get/remove/clear>` - Moderator notes on users.
- `/voicemove <from> <to>` - Mass move voice channel users.
- `/emoji <add/list>` - Add custom emojis to the server.

### 🎭 Role Administration
- `/buttonrole <role> [label] [emoji]` - Interactive button role panels.
- `/selectrole <roles...> [placeholder]` - Dropdown select menu self-roles.
- `/reactionrole <add/remove/removeall>` - Classic reaction roles.
- `/temprole <user> <role> <duration>` - Temporary timed role assignment.
- `/role <create/delete/update/info/members/list/removeall>` - Comprehensive role management.

### 🤖 AutoMod Protection
- `/automod [feature] [on/off]` - Toggle Anti-Invite links, Anti-Links, Anti-Spam, Anti-Caps (>70%), Anti-Mass Mention.
- `/banword <add/remove/list/clear>` - Blacklisted words auto-deletion.

### 🎉 Giveaways & Highlights
- `/giveaway start <duration> <winners> <prize> [required_role]` - Timed giveaways with interactive enter button (`🎉`).
- `/giveaway drop <prize> <winners>` - Fast reaction drop giveaway.
- `/giveaway end`, `/giveaway reroll`, `/giveaway delete`, `/giveaway list`.
- `/highlight <add/remove/list/removeall/ignorechannel/ignoreuser>` - Direct message keyword mention alerts.

### 🎮 Mini-Games & Entertainment
- `/blackjack` - Interactive Blackjack card game vs the dealer.
- `/tictactoe <opponent>` - 3x3 interactive button Tic-Tac-Toe.
- `/connectfour <opponent>` - Connect 4 game against a friend.
- `/snake` - Directional button Snake game.
- `/rockpaperscissor [opponent]` - RPS against bot or member.
- `/8ball <question>` - Magic 8-ball fortune answers.
- `/captcha` - Typing speed captcha challenge.
- `/choose <choices>` - Random option picker.
- `/dice [sides] [count]` - Roll dice.
- `/emojify <text>` - Convert text to letter emojis.
- `/enlarge <emoji>` - Enlarge custom emoji.
- `/flip` - Coin flipper.
- `/password [length]` - Secure password generator.
- `/poll <question> | [options]` - Create polls with reaction voting.
- `/quote <message_id>` - Quote previous messages.
- `/snipe` - Retrieve last deleted message.
- `/meme` - Random memes from Reddit.

### ⚙️ Utilities & Miscellaneous
- `/help [command]` - Interactive command directory.
- `/ping` - Check bot and API latency.
- `/afk <set/clear/list>` - AFK system with mention alerts and auto-return.
- `/announce <channel> <message> [ping]` - Send server announcements.
- `/embed <channel> <title> | <desc>` - Custom embed generator.
- `/remindme <time> <reason>` - Timed DM & channel reminders.
- `/avatar [user]`, `/banner [user]`, `/servericon`, `/serverinfo`, `/userinfo`, `/lookup [id]`, `/membercount`.
- `/calc <expression>` - Safe mathematical calculator.
- `/github <repo>` - GitHub repository statistics lookup.
- `/urban <word>` - Urban dictionary definitions.
- `/stats`, `/uptime`, `/invite`, `/report <issue>`.

---

## 🚀 Installation & Running

```bash
# 1. Clone repository
git clone https://github.com/itz0cat/dc.git
cd dc

# 2. Install dependencies
npm install

# 3. Start bot
npm start
```

---

<div align="center">
Made with ❤️ by <b>itz0cat</b>
</div>
