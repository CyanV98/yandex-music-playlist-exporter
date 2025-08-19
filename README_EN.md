# 🎵 Yandex.Music Playlist Exporter
Browser extension for collecting tracks from a playlist on Yandex.Music

**✅ Suitable for archiving, analyzing, or transferring music to other services**

# [RU](https://github.com/CyanV98/yandex-music-playlist-exporter/blob/main/README.md)
## 💡 Description
This extension allows you to collect a list of all tracks from any public or private Yandex.Music playlist that you have access to. Works with the new design. The result is saved to a .txt file

## 📌 Features
🔁 Automatic track collection

🚫 Duplicate removal

✨ Works with any type of playlists

📄 Export to .txt (format: Artist - Title)

📝 Saved with the playlist name

🕒 Works in real-time via DevTools Console

## 🛠 How to Use
1) Download the latest version crx extension file from [releases](https://github.com/CyanV98/yandex-music-playlist-exporter/releases/latest)
2) Open in your browser `browser://extensions/`
3) Turn on developer mode (usually in the top right corner)
4) Drag and drop the downloaded file into the active tab

## ‼️ Possible Issues
- The browser tab must remain open during the extension operation
  > You can switch to other applications or open other tabs in another window, but the tab running the extension must not "go to sleep"
- The playlist shows N tracks, but the script found fewer
    > There may be two main reasons:
    > - Scrolling too fast so some tracks don't have time to load, or low connection speed
    >   In this case, there are settings in the extension panel:
    >   - `SCROLL_HEIGHT` - controls scroll height. Try reducing it
    >   - `TICK_DELAY` - how often the page is checked and scrolled. Try increasing it
    > - Some tracks are hidden or removed by the artist or their representative
- The last tracks of the playlist are not recorded
    > In settings, try increasing the `FINAL_CHECK_DELAY` parameter
- [Report an issue](https://github.com/CyanV98/yandex-music-playlist-exporter/issues/new)

## 🧩 Development
Want to improve the project?
> Fork the repository and make your changes. Then create a pull request to the main repository

## 🚀 Possible Features:
- CSV / JSON export
- Standalone website version
