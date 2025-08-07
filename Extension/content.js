let isExporting = false;
let exportInterval = null;
let lastSavedIndex = -1;
let previousHeight = 0;
let scrollContainer = null;
let settings = {
  SCROLL_HEIGHT: 300,
  TICK_DELAY: 100,
  FINAL_CHECK_DELAY: 2000
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_PLAYLIST") {
    const container = findScrollContainer();
    sendResponse({ found: !!container });
  }

  if (message.type === "START_EXPORT") {
    if (isExporting) return;
    settings = message.settings;
    isExporting = true;
    lastSavedIndex = -1;
    previousHeight = 0;
    localStorage.removeItem("music_tracks");
    scrollContainer = findScrollContainer();
    if (scrollContainer) {
      window.scrollTo({ top: 0, behavior: "auto" });
      scrollContainer.scrollTop = 0;
      setTimeout(() => Tick(), 500);
    } else {
      chrome.runtime.sendMessage({ type: "EXPORT_ERROR" });
    }
  }

  if (message.type === "STOP_EXPORT") {
    	isExporting = false;
	localStorage.removeItem("music_tracks");
  }
});

function findScrollContainerByStyle() {
  const divs = Array.from(document.querySelectorAll("div"));
  return divs.find(div => {
    const style = getComputedStyle(div);
    return (
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      div.scrollHeight > div.clientHeight &&
      div.querySelector("div[data-index]")
    );
  });
}

function findScrollContainer() {
  const known =
    document.querySelector('[data-test-id="virtuoso-scroller"]') ||
    document.querySelector('div[class*="R82T6DkaZ0LqUcIf5cQQ"]');

  if (known && known.querySelector("div[data-index]")) return known;

  return findScrollContainerByStyle();
}

function collectNewTracks() {
  const trackContainers = document.querySelectorAll("div[data-index]");
  const newTracks = [];

  trackContainers.forEach(trackContainer => {
    const dataIndex = parseInt(trackContainer.getAttribute("data-index"), 10);
    if (dataIndex > lastSavedIndex) {
      newTracks.push({ container: trackContainer, index: dataIndex });
    }
  });

  return newTracks;
}

function getGlobalArtist() {
  const separatedArtists = document.querySelector('[class^="SeparatedArtists_root_"]');
  if (separatedArtists) {
    const links = separatedArtists.querySelectorAll("a");
    return Array.from(links).map(a => a.textContent.trim()).join(", ");
  }

  const albumTitle = document.querySelector("h1 span")?.textContent?.trim();
  const possibleArtist = document.querySelector("h1 + h2 span")?.textContent?.trim();
  if (possibleArtist && possibleArtist !== albumTitle) return possibleArtist;

  return null;
}

function saveTracks(newTracks) {
  const collected = [];
  const globalArtist = getGlobalArtist();

  newTracks.forEach(({ container, index }) => {
    const trackLink = container.querySelector('a[href*="/track/"]');
    const artistContainer = container.querySelector('[class^="SeparatedArtists_root_"]');

    let title = null;
    let artists = [];

    if (trackLink) {
      const titleElement = trackLink.querySelector("span");
      title = titleElement ? titleElement.textContent.trim() : null;
    }

    if (artistContainer) {
      artists = Array.from(artistContainer.querySelectorAll("a")).map(a => a.textContent.trim());
    } else if (globalArtist) {
      artists = [globalArtist];
    }

    const uniqueArtists = [...new Set(artists)].join(", ");

    if (title && uniqueArtists) {
      collected.push(`${uniqueArtists} - ${title}`);
      lastSavedIndex = Math.max(lastSavedIndex, index);
    }
  });

  if (collected.length) {
    const previousTracks = localStorage.getItem("music_tracks")?.split("\n") || [];
    const newSet = [...new Set([...previousTracks, ...collected])];
    localStorage.setItem("music_tracks", newSet.join("\n"));
  }

  return collected.length > 0;
}

function Tick() {
  if (!isExporting) return;

  scrollContainer.scrollTop += settings.SCROLL_HEIGHT;

  setTimeout(() => {
    const newTracks = collectNewTracks();

    if (newTracks.length) saveTracks(newTracks);

    if (scrollContainer.scrollTop === previousHeight) {
      setTimeout(() => {
        const finalTracks = collectNewTracks();
        if (finalTracks.length) saveTracks(finalTracks);
        finish();
      }, settings.FINAL_CHECK_DELAY);
    } else {
      previousHeight = scrollContainer.scrollTop;
      scheduleNextTick();
    }
  }, settings.TICK_DELAY);
}

function scheduleNextTick() {
  setTimeout(() => {
    Tick();
  }, settings.TICK_DELAY);
}

function finish() {
  isExporting = false;
  const tracksList = localStorage.getItem("music_tracks") || "";
  const trackCount = tracksList.split("\n").filter(t => t.trim()).length;
  const blob = new Blob([tracksList], { type: "text/plain; charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = (document.querySelector("h1 span")?.textContent.trim() || "playlist") + ".txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  localStorage.removeItem("music_tracks");

  chrome.runtime.sendMessage({ type: "EXPORT_DONE", count: trackCount });
}
