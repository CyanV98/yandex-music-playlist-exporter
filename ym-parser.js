(function collectAllTracks() {
    const SCROLL_HEIGHT = 300;
    const TICK_DELAY = 100;
    const FINAL_CHECK_DELAY = 2000;

    let lastSavedIndex = -1;
    let previousHeight = 0;


    function collectNewTracks() {
        const trackContainers = document.querySelectorAll('div[data-index]');
        if (!trackContainers.length) return [];

        const newTracks = [];

        trackContainers.forEach(trackContainer => {
            const dataIndex = parseInt(trackContainer.getAttribute('data-index'), 10);
            if (dataIndex > lastSavedIndex) {
                newTracks.push({container: trackContainer, index: dataIndex});
            }
        });

        if (!newTracks.length) return [];

        return newTracks;
    }
    
    function saveTracks(newTracks) {
        const collected = [];

        newTracks.forEach(({container, index}) => {
            const trackLink = container.querySelector('a[href*="/track/"]');
            const artistContainer = container.querySelector('[class^="SeparatedArtists_root_"]');

            if (!trackLink || !artistContainer) return;

            const titleElement = trackLink.querySelector('span');
            const title = titleElement ? titleElement.textContent.trim() : null;

            const artists = Array.from(artistContainer.querySelectorAll('a')).map(a =>
                a.textContent.trim()
            );
            const uniqueArtists = [...new Set(artists)].join(', ');

            if (title && uniqueArtists) {
                collected.push(`${uniqueArtists} - ${title}`);
                lastSavedIndex = Math.max(lastSavedIndex, index);
            }
        });

        if (collected.length) {
            localStorage.setItem('music_tracks', [...new Set([
                ...localStorage.getItem('music_tracks')?.split('\n') || [],
                ...collected
            ])].join('\n'));
        }

        return collected.length > 0;
    }

    const playlistContainer = document.querySelector('[data-test-id="virtuoso-scroller"]');
    if (!playlistContainer) {
        console.error("Контейнер с треками не найден");
        return;
    }

    const playlistTitle = document.querySelector('h1.PageHeaderTitle_heading__UADXi span').textContent.trim();
    
    function Tick() {
        playlistContainer.scrollTop += SCROLL_HEIGHT;

        setTimeout(() => {
            const newTracks = collectNewTracks();

            if (newTracks.length) {
                saveTracks(newTracks);
            }

            if (playlistContainer.scrollTop === previousHeight) {
                console.log("Почти все...");
                setTimeout(() => {
                    const newTracks = collectNewTracks();

                    if (newTracks.length) {
                        saveTracks(newTracks);
                    }
                    finish();
                }, FINAL_CHECK_DELAY);
            } else {
                previousHeight = playlistContainer.scrollTop;
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
        console.log("Скачивание файла начато. Найдено " + trackCount + " уникальных песен!");

        localStorage.removeItem('music_tracks');
    }

    function startWhenReady() {
        const playlistContainer = document.querySelector('[data-test-id="virtuoso-scroller"]');
        if (playlistContainer) {
            console.log("Контейнер плейлиста \"" + playlistTitle + "\" найден, начинаем сбор...");
            Tick();
        } else {
            console.log("Контейнер ещё не загружен, ждём...");
            setTimeout(startWhenReady, 2000);
        }
    }


    console.log("Ищем контейнер с треками...");
    localStorage.removeItem('music_tracks');
    startWhenReady();
})();
