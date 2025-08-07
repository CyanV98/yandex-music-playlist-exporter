const statusElem = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const settingsToggle = document.getElementById("settingsToggle");
const settingsPanel = document.getElementById("settingsPanel");

const scrollHeightInput = document.getElementById("scrollHeight");
const tickDelayInput = document.getElementById("tickDelay");
const finalCheckDelayInput = document.getElementById("finalCheckDelay");

const updateNotice = document.getElementById("updateNotice");
const GITHUB_RELEASES_URL = "https://github.com/CyanV98/yandex-music-playlist-exporter/releases/latest";
const EXTENSION_VERSION = chrome.runtime.getManifest().version;

let currentTabId = null;
let isRunning = false;

function i18n(key) {
  return chrome.i18n.getMessage(key) || key;
}

function checkForUpdate() {
  chrome.storage.local.get(["updateAvailable", "updateUrl"], ({ updateAvailable, updateUrl }) => {
    if (updateAvailable && updateUrl) {
      const updateLink = updateNotice.querySelector("a");
      updateLink.href = updateUrl;
      updateNotice.classList.remove("hidden");
    }
  });
}

function toggleSettings() {
  settingsPanel.classList.toggle("hidden");
}



function setStatus(text, color = "") {
  statusElem.textContent = text;
  statusElem.style.color = color;
}

function updateStartButtonState(enabled, text = i18n("start_button")) {
  startBtn.disabled = !enabled;
  startBtn.textContent = text;
}

function getSettings() {
  return {
    SCROLL_HEIGHT: parseInt(scrollHeightInput.value),
    TICK_DELAY: parseInt(tickDelayInput.value),
    FINAL_CHECK_DELAY: parseInt(finalCheckDelayInput.value)
  };
}

function saveSettings() {
  const settings = getSettings();
  chrome.storage.local.set({ exporterSettings: settings });
}

function loadSettings() {
  chrome.storage.local.get("exporterSettings", ({ exporterSettings }) => {
    if (exporterSettings) {
      scrollHeightInput.value = exporterSettings.SCROLL_HEIGHT || 300;
      tickDelayInput.value = exporterSettings.TICK_DELAY || 100;
      finalCheckDelayInput.value = exporterSettings.FINAL_CHECK_DELAY || 2000;
    }
  });
}

function sendMessageToContent(message) {
  chrome.tabs.sendMessage(currentTabId, message);
}

async function detectPlaylistOnPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url.includes("music.yandex.ru")) {
    setStatus(i18n("status_open_playlist"), "red");
    return;
  }

  currentTabId = tab.id;

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, { type: "CHECK_PLAYLIST" }, (response) => {
      if (response && response.found) {
        setStatus(i18n("status_playlist_found"), "green");
        updateStartButtonState(true);
        resolve(true);
      } else {
        setStatus(i18n("status_playlist_not_found"), "orange");
        updateStartButtonState(false);
        resolve(false);
      }
    });
  });
}

startBtn.addEventListener("click", () => {
  if (!isRunning) {
    isRunning = true;
    updateStartButtonState(true, i18n("stop_button"));
    setStatus(i18n("status_running"), "blue");
    saveSettings();

    sendMessageToContent({
      type: "START_EXPORT",
      settings: getSettings()
    });
  } else {
    isRunning = false;
    updateStartButtonState(true, i18n("start_button"));
    setStatus(i18n("status_stopped"), "gray");

    sendMessageToContent({
      type: "STOP_EXPORT"
    });
  }
});

settingsToggle.addEventListener("click", toggleSettings);

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "EXPORT_DONE") {
    isRunning = false;
    updateStartButtonState(true, i18n("start_button"));
    setStatus(i18n("status_done"), "green");
  } else if (message.type === "EXPORT_ERROR") {
    isRunning = false;
    updateStartButtonState(true, i18n("start_button"));
    setStatus(i18n("status_error"), "red");
  }
});

function applyI18n() {
  startBtn.textContent = i18n("start_button");
  settingsToggle.textContent = i18n("settings");
  localizeHtmlPage();
}

function localizeHtmlPage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      el.textContent = message;
    }
  });

  document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
    const key = el.getAttribute('data-i18n-tooltip');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      el.setAttribute('data-tooltip', message);
    }
  });
}

document.querySelectorAll('.tooltip').forEach(el => {
  el.addEventListener('mouseenter', () => {
    let tooltipText = el.getAttribute('data-tooltip');
    if (!tooltipText) return;

    // Создаем элемент подсказки
    let tooltipEl = document.createElement('div');
    tooltipEl.className = 'custom-tooltip';
    tooltipEl.textContent = tooltipText;
    document.body.appendChild(tooltipEl);

    // Позиционируем подсказку рядом с элементом
    const rect = el.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    // Вычисляем позицию: снизу по умолчанию
    let top = rect.bottom + 8;
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

    // Проверяем выход за правый край окна
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    // Проверяем выход за левый край окна
    if (left < 8) {
      left = 8;
    }
    // Проверяем выход за нижний край окна
    if (top + tooltipRect.height > window.innerHeight) {
      top = rect.top - tooltipRect.height - 8; // показываем сверху
    }
    // Проверяем выход за верхний край окна
    if (top < 8) {
      top = 8;
    }

    tooltipEl.style.position = 'fixed';
    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.padding = '6px 10px';
    tooltipEl.style.background = '#333';
    tooltipEl.style.color = '#fff';
    tooltipEl.style.borderRadius = '4px';
    tooltipEl.style.fontSize = '12px';
    tooltipEl.style.zIndex = '9999';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.whiteSpace = 'nowrap';
    tooltipEl.style.transition = 'opacity 0.2s';
    tooltipEl.style.opacity = '1';

    el._tooltipEl = tooltipEl;
  });

  el.addEventListener('mouseleave', () => {
    if (el._tooltipEl) {
      el._tooltipEl.remove();
      el._tooltipEl = null;
    }
  });
});


(async () => {
  applyI18n();
  loadSettings();
  await detectPlaylistOnPage();
  checkForUpdate();
})();
