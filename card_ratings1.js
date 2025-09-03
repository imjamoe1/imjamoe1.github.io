    // Вспомогательные функции
    function normalizeTitle(str) {
        return (str || '')
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[\s.,:;'`!?]+/g, ' ')
            .trim();
    }

    function titlesMatch(a, b) {
        if (!a || !b) return false;
        const cleanA = normalizeTitle(a).replace(/[^a-zа-я0-9]/g, '');
        const cleanB = normalizeTitle(b).replace(/[^a-zа-я0-9]/g, '');
        return cleanA === cleanB || 
               (cleanA.length > 5 && cleanB.includes(cleanA)) ||
               (cleanB.length > 5 && cleanA.includes(cleanB));
    }

    // Получение ID контента
    function getContentId(data, card) {
        return data.id || 
               data.kinopoisk_id || 
               data.kp_id || 
               card.getAttribute('data-id') || 
               card.getAttribute('id') ||
               (card.card_data && card.card_data.id);
    }

    // Определение типа контента
    function getContentType(data, card) {
        if (data.type) return data.type;
        if (card.classList.contains('card--movie')) return 'movie';
        if (card.classList.contains('card--tv')) return 'tv';
        if (card.classList.contains('card--serial')) return 'tv';
        return 'movie';
    }

    function getCache(key) {
        try {
            const cache = Lampa.Storage.get(CACHE_KEY, {});
            const entry = cache[key];
            if (entry && Date.now() - entry.timestamp < (entry.isError ? CACHE_ERROR_TIME : CACHE_TIME)) {
                return entry;
            }
        } catch (e) {}
        return null;
    }

    function setCache(key, data, cacheTime = CACHE_TIME) {
        try {
            const cache = Lampa.Storage.get(CACHE_KEY, {});
            cache[key] = { 
                ...data, 
                timestamp: Date.now(),
                isError: cacheTime === CACHE_ERROR_TIME
            };
            Lampa.Storage.set(CACHE_KEY, cache);
        } catch (e) {}
    }

    function enqueue(task) {
        return new Promise((resolve, reject) => {
            queue.push(() => task().then(resolve).catch(reject));
            processQueue();
        });
    }

    function processQueue() {
        if (activeRequests >= CONCURRENT_LIMIT || queue.length === 0) return;
        const next = queue.shift();
        activeRequests++;
        next().finally(() => {
            activeRequests--;
            processQueue();
        });
    }

    async function fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
            const res = await fetch(url, { 
                ...options, 
                signal: controller.signal,
                headers: {
                    'X-API-KEY': API_KEY,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res;
        } catch (e) {
            clearTimeout(timeout);
            throw e;
        }
    }

    // Новые функции для работы с Кинопоиском
    async function getKpRatingFromXml(kpId) {
        if (!kpId) return '0.0';
        
        try {
            const xmlUrl = `${KP_RATING_URL}${kpId}.xml`;
            const response = await fetch(xmlUrl);
            const xmlText = await response.text();
            
            const kpMatch = xmlText.match(/<kp_rating[^>]*>([\d.]+)<\/kp_rating>/);
            if (kpMatch && kpMatch[1]) {
                return parseFloat(kpMatch[1]).toFixed(1);
            }
            return await getKpRatingFromApiV22(kpId);
        } catch (e) {
            return await getKpRatingFromApiV22(kpId);
        }
    }

    async function getKpRatingFromApiV22(kpId) {
        try {
            const apiUrl = `${KP_API_URL}api/v2.2/films/${kpId}`;
            const response = await fetchWithTimeout(apiUrl);
            const filmData = await response.json();
            return (filmData.ratingKinopoisk || '0.0').toString();
        } catch (e) {
            console.log('Kinopoisk API v2.2 error:', e);
            return '0.0';
        }
    }

    // Основная функция поиска рейтинга Кинопоиска
    async function searchFilmByTMDBId(tmdbId, type, title, year) {
        const cacheKey = `kp_search_tmdb_${tmdbId}`;
        const cached = getCache(cacheKey);
        if (cached) return cached;

        try {
            let kpId = null;
            let kpRating = '0.0';

            // 1. Пытаемся получить IMDb ID из TMDB
            const tmdbUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=5f4d9ebc5f5b8e34f01e87b9c5b8e34f&language=ru`;
            const tmdbResponse = await fetch(tmdbUrl);
            const tmdbData = await tmdbResponse.json();
            const imdbId = tmdbData.imdb_id;

            // 2. Если есть IMDb ID, ищем по нему (наиболее точно)
            if (imdbId) {
                const searchUrl = `${KP_API_URL}api/v2.2/films?imdbId=${imdbId}`;
                const searchRes = await fetchWithTimeout(searchUrl);
                const searchData = await searchRes.json();

                if (searchData.items && searchData.items.length > 0) {
                    kpId = searchData.items[0].kinopoiskId;
                    kpRating = await getKpRatingFromXml(kpId);
                }
            }

            // 3. Если через IMDb не нашли, ищем по названию
            if (!kpId) {
                const searchUrl = `${KP_API_URL}api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(title)}${year ? `&yearFrom=${year}&yearTo=${year}` : ''}`;
                const searchRes = await fetchWithTimeout(searchUrl);
                const searchData = await searchRes.json();

                if (searchData.films && searchData.films.length > 0) {
                    let bestMatch = searchData.films[0];
                    for (const film of searchData.films) {
                        if (titlesMatch(film.nameRu, title) || titlesMatch(film.nameEn, title)) {
                            if (!year || !film.year || film.year.toString() === year.toString()) {
                                bestMatch = film;
                                break;
                            }
                        }
                    }
                    kpId = bestMatch.filmId;
                    kpRating = await getKpRatingFromXml(kpId);
                }
            }

            const result = {
                kp: kpRating,
                filmId: kpId,
                source: 'kinopoisk_api'
            };

            setCache(cacheKey, result);
            return result;

        } catch (e) {
            console.log('Kinopoisk search error:', e);
            const fallback = { kp: '0.0', filmId: null, source: 'error' };
            setCache(cacheKey, fallback, CACHE_ERROR_TIME);
            return fallback;
        }
    }

    // Получение рейтинга Lampa
    async function fetchLampaRating(data, card) {
        // Главная причина почему рейтинг Lampa показывает 0.0:
        // API доступно только на домене bylampa
        if (Lampa.Manifest.origin !== "bylampa") return '0.0';
        
        const id = getContentId(data, card);
        if (!id) return '0.0';
        
        const type = getContentType(data, card);
        const url = `${LAMPA_RATING_URL}${type}_${id}`;
        
        try {
            const response = await fetchWithTimeout(url);
            if (!response.ok) return '0.0';
            
            const json = await response.json();
            const result = json.result;
            
            // Проверяем, что result является массивом
            if (!Array.isArray(result)) return '0.0';
            
            let positive = 0, negative = 0;
            
            result.forEach(item => {
                if (item.type === 'fire' || item.type === 'nice') {
                    positive += parseInt(item.counter, 10) || 0;
                }
                if (item.type === "think" || item.type === "bore" || item.type === 'shit') {
                    negative += parseInt(item.counter, 10) || 0;
                }
            });
            
            const total = positive + negative;
            return total > 0 ? (positive / total * 10).toFixed(1) : '0.0';
        } catch (e) {
            console.log('Lampa rating error:', e);
            return '0.0';
        }
    }

    // Создание элемента рейтинга Кинопоиска
    function createKpRatingElement() {
        const ratingEl = document.createElement('div');
        ratingEl.className = 'card__rating card__rating--kp';
        ratingEl.style.cssText = `
            position: absolute;
            top: 3px;
            right: 4px;
            color: white;
            font-weight: 700;
            font-size: 8px;
            padding: 2px 4px;
            border-radius: 10px;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 2px;
            background: rgba(0, 0, 0, 0.5);
            min-width: 40px;
            justify-content: center;
        `;

        const iconEl = document.createElement('div');
        iconEl.innerHTML = KP_ICON_SVG;
        iconEl.style.cssText = `
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(1px, 0);
        `;

        const textEl = document.createElement('span');
        textEl.style.cssText = `
            font-size: 18px;
            font-weight: 700;
            line-height: 1;
            margin-right: 0.1px;
        `;

        ratingEl.appendChild(iconEl);
        ratingEl.appendChild(textEl);

        return { element: ratingEl, text: textEl };
    }

    // Создание элемента рейтинга Lampa
    function createLampaRatingElement() {
        const ratingEl = document.createElement('div');
        ratingEl.className = 'card__rating card__rating--lampa';
        ratingEl.style.cssText = `
            position: absolute;
            bottom: 3px;
            right: 4px;
            color: white;
            font-weight: 700;
            font-size: 8px;
            padding: 2px 4px;
            border-radius: 10px;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 2px;
            background: rgba(0, 0, 0, 0.5);
            min-width: 40px;
            justify-content: center;
        `;

        const iconEl = document.createElement('div');
        iconEl.innerHTML = LAMPA_ICON_SVG;
        iconEl.style.cssText = `
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(1px, 1px);
        `;

        const textEl = document.createElement('span');
        textEl.style.cssText = `
            font-size: 18px;
            font-weight: 700;
            line-height: 1;
            margin-right: 0.1px;
        `;

        ratingEl.appendChild(iconEl);
        ratingEl.appendChild(textEl);

        return { element: ratingEl, text: textEl };
    }

    // Скрытие стандартного рейтинга TMDB
    function hideTmdbRating(card) {
        const view = card.element?.querySelector('.card__view') || card.querySelector('.card__view');
        if (!view) return;
        
        const voteContainer = view.querySelector('.card__vote');
        if (voteContainer) {
            voteContainer.style.display = 'none';
        }
    }

    // Отрисовка рейтингов на карточке
    async function renderRating(card) {
        if (processedCards.has(card)) return;

        const cardTitle = card.querySelector('.card__title, .card__name')?.textContent || '';
        const isCategory = 
            card.classList.contains('cub-collection-card') ||
            card.querySelector('.card__count');
            
        if (isCategory) {
            processedCards.add(card);
            return;
        }
        
        const isSisiContent = card.closest('.sisi-results, .sisi-videos, .sisi-section') || 
                             card.closest('[data-component*="sisi"]') || 
                             card.closest('[data-name*="sisi"]') ||
                             window.location.href.indexOf('sisi') !== -1;
        
        if (isSisiContent) {
            processedCards.add(card);
            hideTmdbRating(card);
            return;
        }
        
        processedCards.add(card);
        hideTmdbRating(card);

        let data = card.card_data || (card.dataset?.card && JSON.parse(card.dataset.card));
        if (!data) {
            try {
                const titleEl = card.querySelector('.card__title, .card__name');
                const yearEl = card.querySelector('.card__year');
                if (titleEl) {
                    data = {
                        title: titleEl.textContent,
                        year: yearEl ? yearEl.textContent : '',
                        name: titleEl.textContent
                    };
                }
            } catch (e) {
                return;
            }
        }

        if (!data) return;

        const title = data.title || data.name || data.original_title || data.original_name;
        if (!title || title.length < 2) return;

        if (title.match(/фильмы|видео|сериалы|мультфильмы|год|года|лет|сезон/i)) {
            return;
        }

        const year = data.year || '';
        const view = card.element?.querySelector('.card__view') || card.querySelector('.card__view');
        if (!view) return;

        if (view.querySelector('.card__rating--kp') || view.querySelector('.card__rating--lampa')) return;

        const { element: kpElement, text: kpText } = createKpRatingElement();
        kpText.textContent = '...';
        view.style.position = 'relative';
        view.appendChild(kpElement);

        const { element: lampaElement, text: lampaText } = createLampaRatingElement();
        lampaText.textContent = '...';
        view.appendChild(lampaElement);

        try {
            // Используем новый метод поиска
            const { kp } = await searchFilmByTMDBId(data.id, getContentType(data, card), title, year);
            kpText.textContent = kp;
            
            const lampaRating = await fetchLampaRating(data, card);
            lampaText.textContent = lampaRating;
            
        } catch (e) {
            kpText.textContent = '0.0';
            lampaText.textContent = '0.0';
        }
    }

    // Инициализация плагина
    function init() {
        if (!Lampa.Manifest || Lampa.Manifest.origin !== "bylampa") {
            console.log("Рейтинги Lampa доступны только на origin bylampa");
            return;
        }

        console.log("Initializing ratings plugin...");

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    renderRating(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '100px' });

        document.querySelectorAll('.card').forEach(card => {
            observer.observe(card);
            hideTmdbRating(card);
        });

        const mo = new MutationObserver(muts => {
            muts.forEach(mut => {
                mut.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList?.contains('card')) {
                            observer.observe(node);
                            hideTmdbRating(node);
                        }
                        node.querySelectorAll?.('.card').forEach(c => {
                            observer.observe(c);
                            hideTmdbRating(c);
                        });
                    }
                });
            });
        });

        mo.observe(document.body, { childList: true, subtree: true });

        if (Lampa.Listener) {
            Lampa.Listener.follow('card', e => {
                if (e.type === 'build' && e.card) {
                    renderRating(e.card);
                    hideTmdbRating(e.object || e.card);
                }
            });
        }
    }

    // Запуск плагина
    if (typeof Lampa !== 'undefined') {
        setTimeout(() => {
            Lampa.Platform.tv();
            init();
        }, 1000);
    } else {
        document.addEventListener('lampaReady', function() {
            setTimeout(() => {
                Lampa.Platform.tv();
                init();
            }, 1000);
        });
    }
})();
