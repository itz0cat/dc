# 🐱 Cat Discord Bot - Premier All-in-One Community, Music & Management Bot

<div align="center">

![Cat Banner](https://img.shields.io/badge/Cat%20Bot-v2.5.0-00A896?style=for-the-badge&logo=discord&logoColor=white)
![Theme Color](https://img.shields.io/badge/Theme-Teal%20Blue%20%2300A896-00A896?style=for-the-badge)
![Created By](https://img.shields.io/badge/Made%20by-itz0cat-00A896?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Visibility](https://img.shields.io/badge/Visibility-Public-green?style=for-the-badge)

**The ultimate all-in-one Discord bot featuring Music with Audio Filters, Falcon Growth & Activity Tracking, VoiceMaster Temp Voice, Anti-Nuke, Tickets with HTML Transcripts, Moderation, AutoMod, Giveaways, Mini-Games, and Utilities.**

</div>

---

## 🎨 Theme & Identity
- **Bot Name:** **Cat**
- **Primary Color:** Teal Blue (`#00A896`)
- **Default Prefix:** `?` (also supports Slash Commands `/`)
- **Developer:** `itz0cat`
- **Total Commands:** **140 Active Commands & 154 Aliases**

---

## ⚡ Feature Suites & Command Modules

### 🎵 1. Music & Audio Suite
- `?play <song/URL>` — Play music from Spotify, YouTube Music, SoundCloud, or search terms with real album art & platform badges.
- `?filter <8d/nightcore/lofi/bassboost/slowed/karaoke/reset>` — Real-time audio filters.
- `?search <query>` — Interactive track selection dropdown menu with top 10 results.
- `?playlist <create/add/remove/list/view/play/delete/savequeue>` — Custom user & server saved playlists.
- `?like` / `?showliked` / `?playliked` / `?clearliked` — Favourites and liked tracks manager.
- `?radio <lofi/synthwave/gaming/piano>` — 24/7 high-fidelity live stream stations.
- `?nowplaying` (`?np`) — Live track card with ASCII progress bar and controller buttons.
- `?bump <pos>` / `?remove <pos/dupes>` / `?move <from> <to>` / `?previous` / `?history` / `?voteskip` / `?247` / `?dj`.

---

### 📊 2. Falcon Tracking & Activity Suite
- `?invites [user]` — Real-time invite counts (regular, fake, left, and bonus).
- `?inviter [user]` — Identify who invited a specific member.
- `?topinvites` — Server invite leaderboard.
- `?inviteroles` — Automated milestone role rewards based on invite counts.
- `?messages [user]` — Message activity tracker (daily, weekly, total).
- `?topmessages` — Most active chatters leaderboard.
- `?voicetime [user]` — Voice channel activity time tracker.
- `?topvoice` — Voice activity leaderboard.
- `?voiceroles` — Milestone role rewards for voice channel time.

---

### 🔊 3. VoiceMaster (Join-to-Create Temporary Voice Channels)
- `?voicemaster setup` — Automated Hub creation for temporary voice channels.
- `lock`, `unlock`, `name`, `limit`, `permit`, `reject`, `claim` — Complete voice channel ownership controls.

---

### 🛡️ 4. Anti-Nuke & Server Security
- `?antinuke <setup/enable/disable/whitelist/settings>` — Automated protection against unauthorized bot adds, mass kicks, mass bans, channel purges, and role deletions.
- `?verification <setup/channel/role/panel>` — Interactive button verification gateway.
- `?vanityrole <set/remove/view>` — Automatic role rewards for users displaying server vanity in their custom status.

---

### 🛠️ 5. Server Management & Tickets
- `?welcome [channel] [message]` — Custom welcome cards with `{inviter}`, `{invites}`, and `{count}` variables.
- `?ticket <setup/archive/reopen/transcript/close>` — Full ticket lifecycle management with HTML transcripts and category archiving.
- `?suggestion <submit/accept/decline>` — Interactive suggestion system with voting buttons.
- `?starboard` / `?tag` / `?trigger` / `?stickyroles` / `?linkonly` / `?mediaonly` / `?log`.

---

### 🔨 6. Moderation & AutoMod
- `?ban`, `?softban`, `?tempban`, `?unban`, `?kick`, `?timeout`, `?removetimeout`.
- `?warn`, `?warnings`, `?delwarn`, `?clearwarns`, `?case`, `?reason`, `?modlogs`.
- `?lock`, `?unlock`, `?slowmode`, `?purge <amount> [filter]`.
- `?automod <anti-invite/anti-link/anti-spam/caps>` and `?banword`.

---

### 🎮 7. Mini-Games, Fun & Social
- `?blackjack`, `?tictactoe`, `?connectfour`, `?snake`, `?trivia`, `?rockpaperscissor`.
- `?giveaway <start/drop/reroll>`, `?highlight <add/list/remove>`.
- `?8ball`, `?meme`, `?cat`, `?dog`, `?joke`, `?quote`, `?hug`, `?kiss`, `?slap`, `?cuddle`.

---

### ⚙️ 8. Utility & Integrations
- `?lastfm <login/view/logout>` — Last.fm scrobble card integration.
- `?spotify [user]` — Inspect live Spotify track cards.
- `?crypto [coin]` — Real-time cryptocurrency prices.
- `?wikipedia <query>`, `?dictionary <word>`, `?weather <city>`, `?worldclock`.
- `?translate`, `?qr`, `?shorten`, `?avatar`, `?banner`, `?userinfo`, `?serverinfo`, `?calc`, `?ping`.

---

## 🚀 Installation & Running

### Requirements
- Node.js v18+ (tested on Node.js 26)
- SQLite3 (`node:sqlite` built-in)

### Setup
```bash
git clone https://github.com/itz0cat/dc.git
cd dc
npm install
```

### Configuration
Create a `.env` file in the root directory:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
OWNER_ID=your_discord_user_id
DEFAULT_PREFIX=?
```

### Start Bot
```bash
npm start
```

---

<div align="center">

Made with ❤️ by [itz0cat](https://github.com/itz0cat)

</div>
