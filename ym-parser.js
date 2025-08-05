(function collectAllTracks() {
    const SCROLL_HEIGHT = 300;
    const TICK_DELAY = 100;
    const FINAL_CHECK_DELAY = 2000;

    let lastSavedIndex = -1;
    let previousHeight = 0;
    let scrollContainer = null;

    function findScrollContainerByStyle() {
        const divs = Array.from(document.querySelectorAll('div'));
        return divs.find(div => {
            const style = getComputedStyle(div);
            return (
                (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                div.scrollHeight > div.clientHeight &&
                div.querySelector('div[data-index]')
            );
        });
    }

    function findScrollContainer() {
        const known = document.querySelector('[data-test-id="virtuoso-scroller"]') ||
                      document.querySelector('div[class*="R82T6DkaZ0LqUcIf5cQQ"]');

        if (known && known.querySelector('div[data-index]')) return known;

        return findScrollContainerByStyle();
    }

    function collectNewTracks() {
        const trackContainers = document.querySelectorAll('div[data-index]');
        const newTracks = [];

        trackContainers.forEach(trackContainer => {
            const dataIndex = parseInt(trackContainer.getAttribute('data-index'), 10);
            if (dataIndex > lastSavedIndex) {
                newTracks.push({container: trackContainer, index: dataIndex});
            }
        });

        return newTracks;
    }

    function getGlobalArtist() {
        const separatedArtists = document.querySelector('[class^="SeparatedArtists_root_"]');
        if (separatedArtists) {
            const links = separatedArtists.querySelectorAll('a');
            return Array.from(links).map(a => a.textContent.trim()).join(', ');
        }

        // Альбом: берем исполнителя из h2 после h1
        const albumTitle = document.querySelector('h1 span')?.textContent?.trim();
        const possibleArtist = document.querySelector('h1 + h2 span')?.textContent?.trim();

        if (possibleArtist && possibleArtist !== albumTitle) {
            return possibleArtist;
        }

        return null;
    }

    function saveTracks(newTracks) {
        const collected = [];
        const globalArtist = getGlobalArtist();

        newTracks.forEach(({container, index}) => {
            const trackLink = container.querySelector('a[href*="/track/"]');
            const artistContainer = container.querySelector('[class^="SeparatedArtists_root_"]');

            let title = null;
            let artists = [];

            if (trackLink) {
                const titleElement = trackLink.querySelector('span');
                title = titleElement ? titleElement.textContent.trim() : null;
            }

            if (artistContainer) {
                artists = Array.from(artistContainer.querySelectorAll('a')).map(a => a.textContent.trim());
            } else if (globalArtist) {
                artists = [globalArtist];
            }

            const uniqueArtists = [...new Set(artists)].join(', ');

            if (title && uniqueArtists) {
                collected.push(`${uniqueArtists} - ${title}`);
                lastSavedIndex = Math.max(lastSavedIndex, index);
            }
        });

        if (collected.length) {
            const previousTracks = localStorage.getItem('music_tracks')?.split('\n') || [];
            const newSet = [...new Set([...previousTracks, ...collected])];
            localStorage.setItem('music_tracks', newSet.join('\n'));
        }

        return collected.length > 0;
    }

    const playlistTitle = document.querySelector('h1 span')?.textContent.trim() || 'playlist';

    function Tick() {
        if (!scrollContainer) {
            console.error("Скроллер не найден. Прерывание.");
            return;
        }

        scrollContainer.scrollTop += SCROLL_HEIGHT;

        setTimeout(() => {
            const newTracks = collectNewTracks();

            if (newTracks.length) {
                saveTracks(newTracks);
            }

            if (scrollContainer.scrollTop === previousHeight) {
                console.log("Прокрутка завершена, финальная проверка...");
                setTimeout(() => {
                    const finalTracks = collectNewTracks();
                    if (finalTracks.length) {
                        saveTracks(finalTracks);
                    }
                    finish();
                }, FINAL_CHECK_DELAY);
            } else {
                previousHeight = scrollContainer.scrollTop;
                scheduleNextTick();
            }
        }, TICK_DELAY);
    }

    function scheduleNextTick() {
        setTimeout(() => {
            Tick();
        }, TICK_DELAY);
    }

    function finish() {
        const tracksList = localStorage.getItem('music_tracks') || '';
        const trackCount = tracksList.split('\n').filter(t => t.trim()).length;
        const blob = new Blob([tracksList], {type: 'text/plain; charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = playlistTitle + '.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("Скачано " + trackCount + " уникальных треков!");

        localStorage.removeItem('music_tracks');
    }

    function startWhenReady() {
        scrollContainer = findScrollContainer();

        if (scrollContainer) {
            console.log("Скроллер найден. Прокручиваем вверх...");
            window.scrollTo({ top: 0, behavior: 'auto' });
            scrollContainer.scrollTop = 0;

            setTimeout(() => {
                console.log("Начинаем сбор треков...");
                Tick();
            }, 500);
        } else {
            console.log("Скроллер ещё не готов, ждём...");
            setTimeout(startWhenReady, 2000);
        }
    }

    console.log("Поиск контейнера для прокрутки и треков...");
    localStorage.removeItem('music_tracks');
    startWhenReady();
})();
