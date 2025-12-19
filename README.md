<p align="center"><a href="https://github.com/DuckCIT/AllReacts-for-Facebook-Stories" target="_blank" rel="noreferrer noopener"><img width="90" alt="AllReacts Logo" src="icons/icon128.png"></a></p>
<p align="center">AllReacts for Facebook Stories <strong>enhances</strong> your Facebook experience by letting you <strong>react with any emoji</strong> and <strong>view Stories unseen</strong>.</p>
<br/>
<p align="center">
  <a rel="noreferrer noopener"><img alt="Chrome Web Store" src="https://img.shields.io/badge/Chrome-141e24.svg?&style=for-the-badge&logo=google-chrome&logoColor=white"></a>
  <a rel="noreferrer noopener" href="https://addons.mozilla.org/firefox/addon/allreacts-for-facebook-stories/"><img alt="Firefox Add-ons" src="https://img.shields.io/badge/Firefox-141e24.svg?&style=for-the-badge&logo=firefox-browser&logoColor=white"></a>
  <a rel="noreferrer noopener"><img alt="Edge Addons" src="https://img.shields.io/badge/Edge-141e24.svg?&style=for-the-badge&logo=microsoft-edge&logoColor=white"></a>
</p>

<h2 align="center">AllReacts for Facebook Stories</h2>
<p align="center"><strong>v2.0.1</strong> - Compatibility update for Facebook's latest GraphQL changes</p>
<br/>
<p align="center">AllReacts is an <strong>open-source</strong> MIT-licensed <strong>browser extension</strong> that lets you react to Facebook Stories with any emoji, going beyond the default reactions. It also allows you to view Stories without marking them as "seen," offering more flexibility and privacy.</p>
<br/>

## ✅ What's New in v2.0.1
- **Fixed Facebook GraphQL update**: Updated story reaction request to match Facebook's latest GraphQL parameters and headers.
- **No more instant 429 rate-limit**: Adds missing request headers/tokens used by Facebook (e.g. `x-fb-lsd`, `x-asbd-id`) to improve reliability.
- **Smoother reactions**: Reduced the minimum interval between reactions for faster multi-react.

## 🎉 What's New in v2.0.0
- **🗂️ Emoji Categories**: 9 organized categories for easy browsing
- **🔍 Smart Search**: Find emojis by name with optimized performance
- **⏱️ Recent Emojis**: Quick access to your 30 most used emojis
- **🌍 Global Support**: Works on all Facebook domains worldwide
- **🔔 Update Notifications**: Badge indicator when new version is available

## Latest Updates
For the latest features and improvements, check out the [CHANGELOG](CHANGELOG.md).

## Features
- **React with Any Emoji**: Break free from Facebook's default reactions and use any emoji to express yourself on Stories.
- **1800+ Emojis**: Massive emoji library organized in 9 categories.
- **Smart Search**: Quickly find the perfect emoji by typing its name.
- **Recent Emojis**: Your frequently used emojis are always at hand.
- **Unseen Stories**: View Stories discreetly without notifying the poster.
- **User-Friendly Interface**: Enjoy a simple, intuitive design for seamless interaction.

## Installation
### Option 1: Install from Browser Stores
- **Firefox**: Download from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/allreacts-for-facebook-stories/).
- Once installed, the AllReacts icon will appear in your browser toolbar.

### Option 2: Manual Installation (For Developers)
1. **Clone the Repository** (or **`Download ZIP`**):
    ```bash
    git clone https://github.com/DuckCIT/AllReacts-for-Facebook-Stories.git
2. **Load the Extension:**
- Open `chrome://extensions/` (Chrome), `about:debugging#/runtime/this-firefox` (Firefox), or `edge://extensions/` (Edge).
- Enable **Developer Mode** (Chrome/Edge) or click **Load Temporary Add-on** (Firefox).
- Select **Load Unpacked** (Chrome/Edge) or choose the manifest.json file (Firefox) from the project folder.
3. **Launch:** Look for the AllReacts icon in your browser toolbar.

## How to Use

### Reacting to Stories
1. Open a Facebook Story.
2. Click the **Plus** icon in the reactions footer. <p align="center"><img src="screenshot/shot-1.png" width="400"/></p>
3. Pick your favorite emoji and react!

### Hiding "Seen" Status
1. Click the AllReacts icon in your browser toolbar. <p align="center"><img src="screenshot/shot-2.png" width="400"/></p>
2. Toggle the **Hide the seen status on Facebook Stories** option.

## Copyright
© 2024 by Nguyen Trong Duc (DuckCIT). All rights reserved. Feel free to build upon this project, but please credit the original author.

## Contact
Questions or feedback? Reach out via the <a href="https://duckcit.netlify.app" target="_blank">Contact Page</a> or leave a comment on [GitHub](https://github.com/DuckCIT/AllReacts-for-Facebook-Stories).

## License
This project is licensed under the MIT License. See the  file for details.

## Contributing
AllReacts is a solo project by Nguyen Trong Duc, built for personal use and shared with the community. As a single developer, I’d love your help to make it even better! You can contribute by:
- Reporting bugs or suggesting new features on [GitHub Issues](https://github.com/DuckCIT/AllReacts-for-Facebook-Stories/issues).
- If you're a developer, feel free to fork the repo and submit pull requests.
---