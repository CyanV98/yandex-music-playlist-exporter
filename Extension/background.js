const CURRENT_VERSION = "1.2";
const GITHUB_RELEASES_API = "https://api.github.com/repos/CyanV98/yandex-music-playlist-exporter/releases/latest";

// Проверка обновлений на GitHub
async function checkForUpdate() {
  try {
    const res = await fetch(GITHUB_RELEASES_API);
    if (!res.ok) throw new Error("GitHub API error");

    const data = await res.json();
    const latestVersion = data.tag_name;

    const isUpdateAvailable = latestVersion !== CURRENT_VERSION;

    chrome.storage.local.set({
      updateAvailable: isUpdateAvailable,
      updateUrl: data.html_url || null
    });
  } catch (err) {
    console.warn("Failed to check for updates:", err);
    chrome.storage.local.set({
      updateAvailable: false,
      updateUrl: null
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  checkForUpdate();
});

chrome.runtime.onStartup.addListener(() => {
  checkForUpdate();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updateIconForTab(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    updateIconForTab(tabId, tab.url);
  });
});

function updateIconForTab(tabId, url) {
  const isYandexMusic = url && url.includes("music.yandex.ru");

  chrome.action.setIcon({
    tabId,
    path: isYandexMusic
      ? {
          "16": "icon16.png",
          "48": "icon48.png",
          "128": "icon128.png"
        }
      : {
          "16": "icon16_gray.png",
          "48": "icon48_gray.png",
          "128": "icon128_gray.png"
        }
  });
}

