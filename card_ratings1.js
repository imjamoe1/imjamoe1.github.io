(function () {
  'use strict';

    // Настройки плагина
    const API_KEY = '34abd082-4543-44a2-84fb-2169f49ce93e'; // Используем работающий ключ
    const TMDB_API_KEY = '4ef0d7355d9ffb5151e987764708ce96';
    const TMDB_API_URL = 'https://api.themoviedb.org/3/';
    const KP_RATING_URL = 'https://rating.kinopoisk.ru/';
    const KP_API_URL = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/';
    const LAMPA_RATING_URL = 'http://cub.rip/api/reactions/get/';
    const CACHE_KEY = 'kp_rating_cache_v3';
    const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 часа
    const CONCURRENT_LIMIT = 3;

    // Очередь запросов
    const queue = [];
    let activeRequests = 0;
    const processedCards = new WeakSet();

    // Иконки для рейтингов
    const KP_ICON_SVG = '<svg width="20" height="20" viewBox="0 0 110 110" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="55" cy="55" r="40" fill="black"/><g transform="translate(10, 10) scale(0.4)"><path fill="white" d="M215 121.415l-99.297-6.644 90.943 36.334a106.416 106.416 0 0 0 8.354-29.69z"/><path fill="white" d="M194.608 171.609C174.933 197.942 143.441 215 107.948 215 48.33 215 0 166.871 0 107.5 0 48.13 48.33 0 107.948 0c35.559 0 67.102 17.122 86.77 43.539l-90.181 48.07L162.57 32.25h-32.169L90.892 86.862V32.25H64.77v150.5h26.123v-54.524l39.509 54.524h32.169l-56.526-57.493 88.564 46.352z"/><path d="M206.646 63.895l-90.308 36.076L215 93.583a106.396 106.396 0 0 0-8.354-29.688z" fill="white"/></g></svg>';      
    const LAMPA_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg"><circle cx="55" cy="55" r="55" fill="black"/><path d="M81.6744 103.11C98.5682 93.7234 110 75.6967 110 55C110 24.6243 85.3757 0 55 0C24.6243 0 0 24.6243 0 55C0 75.6967 11.4318 93.7234 28.3255 103.11C14.8869 94.3724 6 79.224 6 62C6 34.938 27.938 13 55 13C82.062 13 104 34.938 104 62C104 79.224 95.1131 94.3725 81.6744 103.11Z" fill="white"/><path d="M92.9546 80.0076C95.5485 74.5501 97 68.4446 97 62C97 38.804 78.196 20 55 20C31.804 20 13 38.804 13 62C13 68.4446 14.4515 74.5501 17.0454 80.0076C16.3618 77.1161 16 74.1003 16 71C16 49.4609 33.4609 32 55 32C76.5391 32 94 49.4609 94 71C94 74.1003 93.6382 77.1161 92.9546 80.0076Z" fill="white"/><path d="M55 89C69.3594 89 81 77.3594 81 63C81 57.9297 79.5486 53.1983 77.0387 49.1987C82.579 54.7989 86 62.5 86 71C86 88.1208 72.1208 102 55 102C37.8792 102 24 88.1208 24 71C24 62.5 27.421 54.7989 32.9613 49.1987C30.4514 53.1983 29 57.9297 29 63C29 77.3594 40.6406 89 55 89Z" fill="white"/><path d="M73 63C73 72.9411 64.9411 81 55 81C45.0589 81 37 72.9411 37 63C37 53.0589 45.0589 45 55 45C64.9411 45 73 53.0589 73 63Z" fill="white"/></svg>';

    // Вспомогательные функции
    function cleanTitle(str) {
        return (str || '')
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[\s.,:;'`!?]+/g, ' ')
            .trim();
    }

    function normalizeTitle(str) {
        return cleanTitle(str)
            .replace(/[^\w\sа-яё]/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getCache(key) {
        try {
            const cache = Lampa.Storage.get(CACHE_KEY, {});
            const entry = cache[key];
            if (entry && Date.now() - entry.timestamp < CACHE_TIME) {
                return entry;
            }
        } catch (e) {}
        return null;
    }

    function setCache(key, data) {
        try {
            const cache = Lampa.Storage.get(CACHE_KEY, {});
            cache[key] = { ...data, timestamp: Date.now() };
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
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(res.status);
            return res;
        } finally {
            clearTimeout(timeout);
        }
    }

    // Альтернативный способ получения рейтинга Kinopoisk через внешний сервис
    async function getKpRatingByExternalService(title, year) {
        try {
            // Пробуем найти через Yandex Search API
            const query = encodeURIComponent(`${title} ${year} кинопоиск рейтинг`);
            const url = `https://yandex.com/search/xml?query=${query}&l10n=ru&sortby=tm.order%3Dascending&groupby=attr%3D%22%22.mode%3Dflat.groups-on-page%3D10.docs-in-group%3D1`;
            
            const response = await enqueue(() => fetchWithTimeout(url));
            const text = await response.text();
            
            // Пытаемся найти рейтинг в ответе
            const ratingMatch = text.match(/(\d{1,2}[.,]\d)/);
            if (ratingMatch) {
                return parseFloat(ratingMatch[1].replace(',', '.')).toFixed(1);
            }
        } catch (e) {
            console.log('External service error:', e);
        }
        return null;
    }

    // Основная функция получения рейтинга Kinopoisk
    async function fetchKpRating(filmId) {
        if (!filmId) return '0.0';

        try {
            // Пробуем XML endpoint
            const xmlUrl = `${KP_RATING_URL}${filmId}.xml`;
            const xmlResponse = await enqueue(() => fetchWithTimeout(xmlUrl));
            const xmlText = await xmlResponse.text();
            
            const kpMatch = xmlText.match(/<kp_rating[^>]*>([\d.]+)<\/kp_rating>/);
            if (kpMatch) {
                return parseFloat(kpMatch[1]).toFixed(1);
            }
        } catch (e) {}

        try {
            // Пробуем API v2.2
            const apiUrl = `${KP_API_URL}${filmId}`;
            const headers = { 
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            };
            
            const apiResponse = await enqueue(() => fetchWithTimeout(apiUrl, { headers }));
            const apiData = await apiResponse.json();
            
            if (apiData.ratingKinopoisk) {
                return parseFloat(apiData.ratingKinopoisk).toFixed(1);
            }
            if (apiData.rating) {
                return parseFloat(apiData.rating).toFixed(1);
            }
        } catch (e) {
            console.log('Kinopoisk API v2.2 error:', e);
        }

        return '0.0';
    }

    // Улучшенный поиск фильма на Kinopoisk
    async function searchFilmOnKinopoisk(title, year) {
        if (!title || title.length < 2) {
            return { kp: '0.0', filmId: null };
        }

        const cacheKey = `search_${normalizeTitle(title)}_${year}`;
        const cached = getCache(cacheKey);
        if (cached) return cached;

        try {
            // Метод 1: Поиск через API v2.1
            const searchUrl = `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(title)}&page=1`;
            const headers = { 'X-API-KEY': API_KEY };
            
            const response = await enqueue(() => fetchWithTimeout(searchUrl, { headers }));
            const data = await response.json();
            
            if (data && data.films && data.films.length > 0) {
                let bestMatch = null;
                
                // Ищем точное совпадение по году и названию
                for (const film of data.films) {
                    const filmTitle = film.nameRu || film.nameEn || '';
                    const filmYear = film.year || '';
                    
                    // Проверяем совпадение года
                    if (year && filmYear.toString() === year.toString()) {
                        bestMatch = film;
                        break;
                    }
                    
                    // Если год не совпадает, проверяем схожесть названий
                    const cleanFilmTitle = normalizeTitle(filmTitle);
                    const cleanSearchTitle = normalizeTitle(title);
                    
                    if (cleanFilmTitle.includes(cleanSearchTitle) || 
                        cleanSearchTitle.includes(cleanFilmTitle)) {
                        bestMatch = film;
                        break;
                    }
                }
                
                // Если не нашли точного совпадения, берем первый результат
                if (!bestMatch && data.films.length > 0) {
                    bestMatch = data.films[0];
                }
                
                if (bestMatch) {
                    const filmId = bestMatch.filmId || bestMatch.kinopoiskId;
                    if (filmId) {
                        const kpRating = await fetchKpRating(filmId);
                        const result = { kp: kpRating, filmId: filmId };
                        setCache(cacheKey, result);
                        return result;
                    }
                }
            }
        } catch (e) {
            console.log('Search method 1 failed:', e);
        }

        try {
            // Метод 2: Прямой поиск по TMDB ID через внешний сервис
            // Ищем по названию и году через DuckDuckGo или подобный сервис
            const query = encodeURIComponent(`${title} ${year} kinopoisk id`);
            const ddgUrl = `https://api.duckduckgo.com/?q=${query}&format=json&pretty=1`;
            
            const ddgResponse = await enqueue(() => fetchWithTimeout(ddgUrl));
            const ddgData = await ddgResponse.json();
            
            // Пытаемся найти ID в инфобоксе
            if (ddgData.Abstract && ddgData.Abstract.includes('kinopoisk.ru')) {
                const idMatch = ddgData.Abstract.match(/kinopoisk\.ru\/(?:film|series)\/(\d+)/);
                if (idMatch) {
                    const kpRating = await fetchKpRating(idMatch[1]);
                    const result = { kp: kpRating, filmId: idMatch[1] };
                    setCache(cacheKey, result);
                    return result;
                }
            }
        } catch (e) {
            console.log('Search method 2 failed:', e);
        }

        // Метод 3: Пробуем получить рейтинг через внешний сервис
        try {
            const externalRating = await getKpRatingByExternalService(title, year);
            if (externalRating && externalRating !== '0.0') {
                const result = { kp: externalRating, filmId: null };
                setCache(cacheKey, result);
                return result;
            }
        } catch (e) {
            console.log('External rating search failed:', e);
        }

        // Если ничего не нашли
        const fallback = { kp: '0.0', filmId: null };
        setCache(cacheKey, fallback);
        return fallback;
    }

    // Получение рейтинга Lampa
    async function fetchLampaRating(data, card) {
        const id = data.id || card.getAttribute('data-id') || card.getAttribute('id');
        if (!id) return '0.0';

        const type = data.type || (card.classList.contains('card--tv') ? 'tv' : 'movie');
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
            padding: 0.1em 0.18em;
            margin: 0;
            border-radius: 1em;
            z-index: 1;
            pointer-events: none;
            font-size: 1.2em;
            user-select: none;
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.5);
            min-width: max-content;
        `;

        const iconEl = document.createElement('div');
        if (type === 'kp') {
            iconEl.innerHTML = KP_ICON_SVG;
            iconEl.style.cssText = `
                width: 1em;
                height: 1em;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                margin-right: 0.1px;
                transform: translateY(0);
            `;
            ratingEl.style.top = '0.2em';
            ratingEl.style.right = '0.2em';
        } else {
            iconEl.innerHTML = LAMPA_ICON_SVG;
            iconEl.style.cssText = `
                width: 1em;
                height: 1em;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                margin-right: 0.1px;
                transform: translateX(0.5px) translateY(2px);
            `;
            ratingEl.style.bottom = '0.2em';
            ratingEl.style.right = '0.2em';
        }

        const textEl = document.createElement('span');
        ratingEl.appendChild(iconEl);
        ratingEl.appendChild(textEl);

        return { element: ratingEl, text: textEl };
    }
    
    // Скрытие стандартного рейтинга TMDB
    function hideTmdbRating(card) {
        const view = card.querySelector('.card__view');
        if (!view) return;

        const voteContainer = view.querySelector('.card__vote');
        if (voteContainer) {
            voteContainer.style.display = 'none';
            voteContainer.style.visibility = 'hidden';
        }
    }

    // Отрисовка рейтингов на карточке
    async function renderRating(card) {
        if (processedCards.has(card)) return;

        const cardTitle = card.querySelector('.card__title, .card__name')?.textContent || '';
        const isCategory = card.querySelector('.card__count');
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

        if (!data || !data.id) return;

        const title = data.title || data.name || data.original_title || data.original_name;
        if (!title || title.length < 2) return;

        const year = data.year || '';
        const view = card.querySelector('.card__view');
        if (!view) return;

        // Проверяем, не добавлены ли уже элементы
        if (view.querySelector('.card__rating--kp') || view.querySelector('.card__rating--lampa')) {
            return;
        }

        // Создаем элементы рейтингов
        const { element: kpElement, text: kpText } = createRatingElement('kp');
        kpText.textContent = '...';
        view.style.position = 'relative';
        view.appendChild(kpElement);

        const { element: lampaElement, text: lampaText } = createRatingElement('lampa');
        lampaText.textContent = '...';
        view.appendChild(lampaElement);

        // Запускаем асинхронную загрузку рейтингов
        setTimeout(async () => {
            try {
                // Получаем рейтинг Kinopoisk
                const result = await searchFilmOnKinopoisk(title, year);
                kpText.textContent = result.kp;

                // Получаем рейтинг Lampa
                const lampaRating = await fetchLampaRating(data, card);
                lampaText.textContent = lampaRating;
            } catch (e) {
                console.log('Error fetching ratings:', e);
                kpText.textContent = '0.0';
                lampaText.textContent = '0.0';
            }
        }, 0);
    }

    // Инициализация плагина
    function init() {
        if (Lampa.Manifest.origin !== "bylampa") {
            console.log("Рейтинги доступны только на origin bylampa");
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
                    hideTmdbRating(e.card);
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
