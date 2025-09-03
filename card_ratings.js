(function() {
    'use strict';

    // Настройки плагина
    const API_KEY = '2a4a0808-81a3-40ae-b0d3-e11335ede616';
    const SEARCH_URL = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword';
    const RATING_URL = 'https://rating.kinopoisk.ru/';
    const KP_API_URL = 'https://kinopoiskapiunofficial.tech/';
    const LAMPA_RATING_URL = 'http://cub.rip/api/reactions/get/';
    const CACHE_KEY = 'kp_rating_cache_v9';
    const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 часа
    const CACHE_ERROR_TIME = 1000 * 60 * 15; // 15 минут
    const CONCURRENT_LIMIT = 4;

    // Очередь запросов
    const queue = [];
    let activeRequests = 0;
    const processedCards = new WeakSet();

    // Иконки для рейтингов
    const KP_ICON_SVG = '<svg width="12" height="12" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="120" height="120" fill="black"/><path d="M120 0L31.5771 47.3297L77.6571 0H52.1143L20.7429 43.5446V0H0V120H20.7429V76.5257L52.1143 120H77.6571L32.7737 74.1583L120 120V97.7143L40.4434 65.7977L120 71.1429V48.8571L40.9474 53.9966L120 22.2857V0Z" fill="url(#paint0_radial_4902_370)"/><defs><radialGradient id="paint0_radial_4902_370" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="rotate(45) scale(169.706)"><stop offset="0.5" stop-color="#FF5500"/><stop offset="1" stop-color="#BBFF00"/></radialGradient></defs></svg>';      

    const LAMPA_ICON_SVG = '<svg width="12" height="12" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="55" cy="55" r="55" fill="black"/><path d="M81.6744 103.11C98.5682 93.7234 110 75.6967 110 55C110 24.6243 85.3757 0 55 0C24.6243 0 0 24.6243 0 55C0 75.6967 11.4318 93.7234 28.3255 103.11C14.8869 94.3724 6 79.224 6 62C6 34.938 27.938 13 55 13C82.062 13 104 34.938 104 62C104 79.224 95.1131 94.3725 81.6744 103.11Z" fill="white"/><path d="M92.9546 80.0076C95.5485 74.5501 97 68.4446 97 62C97 38.804 78.196 20 55 20C31.804 20 13 38.804 13 62C13 68.4446 14.4515 74.5501 17.0454 80.0076C16.3618 77.1161 16 74.1003 16 71C16 49.4609 33.4609 32 55 32C76.5391 32 94 49.4609 94 71C94 74.1003 93.6382 77.1161 92.9546 80.0076Z" fill="white"/><path d="M55 89C69.3594 89 81 77.3594 81 63C81 57.9297 79.5486 53.1983 77.0387 49.1987C82.579 54.7989 86 62.5 86 71C86 88.1208 72.1208 102 55 102C37.8792 102 24 88.1208 24 71C24 62.5 27.421 54.7989 32.9613 49.1987C30.4514 53.1983 29 57.9297 29 63C29 77.3594 40.6406 89 55 89Z" fill="white"/><path d="M73 63C73 72.9411 64.9411 81 55 81C45.0589 81 37 72.9411 37 63C37 53.0589 45.0589 45 55 45C64.9411 45 73 53.0589 73 63Z" fill="white"/></svg></div>';

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
        if (Lampa.Manifest.origin !== "bylampa") return '0.0';
        
        const id = getContentId(data, card);
        if (!id) return '0.0';
        
        const type = getContentType(data, card);
        const url = `${LAMPA_RATING_URL}${type}_${id}`;
        
        try {
            const response = await fetchWithTimeout(url);
            const json = await response.json();
            const result = json.result;
            
            let positive = 0, negative = 0;
            
            result.forEach(item => {
                if (item.type === 'fire' || item.type === 'nice') {
                    positive += parseInt(item.counter, 10);
                }
                if (item.type === "think" || item.type === "bore" || item.type === 'shit') {
                    negative += parseInt(item.counter, 10);
                }
            });
            
            const total = positive + negative;
            return total > 0 ? (positive / total * 10).toFixed(1) : '0.0';
        } catch (e) {
            return '0.0';
        }
    }

    // Создание элемента рейтинга
    function createRatingElement(type) {
        const ratingEl = document.createElement('div');
        ratingEl.className = `card__rating card__rating--${type}`;
        ratingEl.style.cssText = `
            position: absolute;
            color: white;
            font-weight: bold;
            padding: 0.1em 0.2em;
            margin-left: 0;
            border-radius: 0.5em;
            z-index: 10;
            pointer-events: none;
            font-size: 1.2em;
            user-select: none;
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.3);
            min-width: max-content; 
        `;

        const iconEl = document.createElement('div');
        if (type === 'kp') {
            iconEl.innerHTML = KP_ICON_SVG;
            iconEl.style.cssText = `
                width: 0.8em;
                height: 0.8em;
                display: flex;
                align-items: center;
                justify-content: center;
                transform: translateY(0.5px);
                margin-left: 0.1em;
                margin-right: 0.1em;
            `;
            ratingEl.style.top = '0.2em';
            ratingEl.style.right = '4px';
        } else {
            iconEl.innerHTML = LAMPA_ICON_SVG;
            iconEl.style.cssText = `
                width: 1em;
                height: 0.9em;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                transform: translateY(0.5px);
                margin-top: 1px;
            `;
            ratingEl.style.bottom = '4px';
            ratingEl.style.right = '4px';
        }

        const textEl = document.createElement('span');
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

        // Создаем элементы рейтингов (Кинопоиск + Lampa на постере)
        const { element: kpElement, text: kpText } = createRatingElement('kp');
        kpText.textContent = '...';
        view.style.position = 'relative';
        view.appendChild(kpElement);

        const { element: lampaElement, text: lampaText } = createRatingElement('lampa');
        lampaText.textContent = '...';
        view.appendChild(lampaElement);

        try {
            // Получаем рейтинг Kinopoisk
            const { kp } = await searchFilmByTMDBId(data.id, getContentType(data, card), title, year);
            kpText.textContent = kp; // Будет "0.0" если рейтинга нет

            // Получаем рейтинг Lampa
            const lampaRating = await fetchLampaRating(data, card);
            lampaText.textContent = lampaRating; // Будет "0.0" если рейтинга нет
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

            // Убираем рейтинг Lampa внутри карточки (на странице описания)
            Lampa.Listener.follow('full', function(e) {
                if (e.type === 'complite') {
                    // Ничего не делаем — рейтинг Lampa не добавляется
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
