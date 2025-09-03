(function() {
    'use strict';

    // Настройки плагина
    const API_KEY = '2a4a0808-81a3-40ae-b0d3-e11335ede616';
    const KP_API_URL = 'https://kinopoiskapiunofficial.tech/';
    const KP_RATING_URL = 'https://rating.kinopoisk.ru/';
    const LAMPA_RATING_URL = 'http://cub.rip/api/reactions/get/';
    const CACHE_KEY = 'kp_rating_cache_v9';
    const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 часа для успешных запросов
    const CACHE_ERROR_TIME = 1000 * 60 * 15; // 15 минут для ошибок
    const CONCURRENT_LIMIT = 4;

    // Очередь запросов
    const queue = [];
    let activeRequests = 0;
    const processedCards = new WeakSet();

    // Иконки для рейтингов
    const KP_ICON_SVG = '<svg width="192" height="192" viewBox="0 0 192 192" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="white" fill-rule="nonzero"><path fill-rule="evenodd" d="M20,4 H172 A16,16 0 0 1 188,20 V172 A16,16 0 0 1 172,188 H20 A16,16 0 0 1 4,172 V20 A16,16 0 0 1 20,4 Z M20,18 H172 A2,2 0 0 1 174,20 V172 A2,2 0 0 1 172,174 H20 A2,2 0 0 1 18,172 V20 A2,2 0 0 1 20,18 Z"/><g transform="translate(-10.63, 0)"><path d="M96.5 20 L66.1 75.733 V20 H40.767 v152 H66.1 v-55.733 L96.5 172 h35.467 C116.767 153.422 95.2 133.578 80 115 c28.711 16.889 63.789 35.044 92.5 51.933 v-30.4 C148.856 126.4 108.644 115.133 85 105 c23.644 3.378 63.856 7.889 87.5 11.267 v-30.4 L85 90 c27.022-11.822 60.478-22.711 87.5-34.533 v-30.4 C143.789 41.956 108.711 63.11 80 80 L131.967 20 z"/></g></g></g></svg>';      
    const LAMPA_ICON_SVG = '<svg width="20" height="20" viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg"><circle cx="55" cy="55" r="55" fill="black"/><path d="M81.6744 103.11C98.5682 93.7234 110 75.6967 110 55C110 24.6243 85.3757 0 55 0C24.6243 0 0 24.6243 0 55C0 75.6967 11.4318 93.7234 28.3255 103.11C14.8869 94.3724 6 79.224 6 62C6 34.938 27.938 13 55 13C82.062 13 104 34.938 104 62C104 79.224 95.1131 94.3725 81.6744 103.11Z" fill="white"/><path d="M92.9546 80.0076C95.5485 74.5501 97 68.4446 97 62C97 38.804 78.196 20 55 20C31.804 20 13 38.804 13 62C13 68.4446 14.4515 74.5501 17.0454 80.0076C16.3618 77.1161 16 74.1003 16 71C16 49.4609 33.4609 32 55 32C76.5391 32 94 49.4609 94 71C94 74.1003 93.6382 77.1161 92.9546 80.0076Z" fill="white"/><path d="M55 89C69.3594 89 81 77.3594 81 63C81 57.9297 79.5486 53.1983 77.0387 49.1987C82.579 54.7989 86 62.5 86 71C86 88.1208 72.1208 102 55 102C37.8792 102 24 88.1208 24 71C24 62.5 27.421 54.7989 32.9613 49.1987C30.4514 53.1983 29 57.9297 29 63C29 77.3594 40.6406 89 55 89Z" fill="white"/><path d="M73 63C73 72.9411 64.9411 81 55 81C45.0589 81 37 72.9411 37 63C37 53.0589 45.0589 45 55 45C64.9411 45 73 53.0589 73 63Z" fill="white"/></svg></div>';

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

    // Получение рейтинга Lampa (ИСПРАВЛЕННАЯ ВЕРСИЯ)
    async function fetchLampaRating(data, card) {
        if (Lampa.Manifest.origin !== "bylampa") return '0.0';
        
        const id = data.id || data.kinopoisk_id || data.kp_id || card.getAttribute('data-id') || card.getAttribute('id');
        if (!id) return '0.0';
        
        const type = data.type || (card.classList.contains('card--tv') || card.classList.contains('card--serial') ? 'tv' : 'movie');
        const url = `${LAMPA_RATING_URL}${type}_${id}`;
        
        try {
            console.log("Fetching Lampa rating from:", url);
            const response = await fetchWithTimeout(url);
            
            if (!response.ok) {
                console.log("Lampa API response not OK:", response.status);
                return '0.0';
            }
            
            const json = await response.json();
            console.log("Lampa API response:", json);
            
            // Проверяем различные форматы ответа
            let result = json.result || json.data || json;
            
            if (!Array.isArray(result)) {
                console.log("Lampa API: result is not array", result);
                return '0.0';
            }
            
            let positive = 0, negative = 0;
            
            result.forEach(item => {
                const counter = parseInt(item.counter || item.count || 0, 10);
                
                if (item.type === 'fire' || item.type === 'nice' || item.reaction_type === 'positive') {
                    positive += counter;
                }
                if (item.type === "think" || item.type === "bore" || item.type === 'shit' || item.reaction_type === 'negative') {
                    negative += counter;
                }
            });
            
            const total = positive + negative;
            const rating = total > 0 ? (positive / total * 10).toFixed(1) : '0.0';
            
            console.log("Lampa rating calculated:", rating, "Positive:", positive, "Negative:", negative);
            return rating;
            
        } catch (e) {
            console.error("Lampa API error:", e);
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
            width: 14px;
            height: 14px;
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

    // Отрисовка рейтингов на карточке (постер)
    async function renderRating(card) {
        if (processedCards.has(card)) return;

        // Пропускаем категории и разделы
        const cardTitle = card.querySelector('.card__title, .card__name')?.textContent || '';
        const isCategory = 
            card.classList.contains('cub-collection-card') ||
            card.querySelector('.card__count');
            
        if (isCategory) {
            processedCards.add(card);
            return;
        }
        
        // Проверяем, находится ли карточка в разделе
        const isSisiContent = card.closest('.sisi-results, .sisi-videos, .sisi-section') || 
                             card.closest('[data-component*="sisi"]') || 
                             card.closest('[data-name*="sisi"]') ||
                             window.location.href.indexOf('sisi') !== -1;
        
        // Пропускаем обработку рейтингов для раздела
        if (isSisiContent) {
            processedCards.add(card);
            hideTmdbRating(card);
            return;
        }
        
        // Стандартная обработка для других разделов
        processedCards.add(card);
        hideTmdbRating(card);

        // Получаем данные карточки
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

        // Создаем элементы рейтингов
        const { element: kpElement, text: kpText } = createKpRatingElement();
        kpText.textContent = '...';
        view.style.position = 'relative';
        view.appendChild(kpElement);

        const { element: lampaElement, text: lampaText } = createLampaRatingElement();
        lampaText.textContent = '...';
        view.appendChild(lampaElement);

        try {
            // Получаем рейтинг Kinopoisk через официальное API
            const { kp } = await searchFilmByTMDBId(data.id, getContentType(data, card), title, year);
            kpText.textContent = kp;
            
            // Получаем рейтинг Lampa
            const lampaRating = await fetchLampaRating(data, card);
            lampaText.textContent = lampaRating;
        } catch (e) {
            kpText.textContent = '0.0';
            lampaText.textContent = '0.0';
        }
    }

    // Инициализация плагина
    function init() {
        if (Lampa.Manifest.origin !== "bylampa") {
            console.log("Рейтинги Lampa доступны только на origin bylampa");
            return;
        }

        // Наблюдатель за видимостью карточек
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    renderRating(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '100px' });

        // Обработка существующих карточек
        document.querySelectorAll('.card').forEach(card => {
            observer.observe(card);
            hideTmdbRating(card);
        });

        // Наблюдатель за изменениями DOM
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

        // Подписка на события Lampa
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
        Lampa.Platform.tv();
        init();
    } else {
        document.addEventListener('lampaReady', function() {
            Lampa.Platform.tv();
            init();
        });
    }
})();
