(function() {
    'use strict';

    // Настройки плагина
    const API_KEY = '2a4a0808-81a3-40ae-b0d3-e11335ede616';
    const SEARCH_URL = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword';
    const RATING_URL = 'https://rating.kinopoisk.ru/';
    const KP_API_URL = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/';
    const LAMPA_RATING_URL = 'http://cub.bylampa.online/api/reactions/get/';
    const CACHE_KEY = 'kp_rating_cache_v3';
    const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 часа
    const CONCURRENT_LIMIT = 4;

    // Очередь запросов
    const queue = [];
    let activeRequests = 0;
    const processedCards = new WeakSet();

    // Иконки для рейтингов
    const KP_ICON_SVG = `
        <svg width="12" height="12" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
            <path d="M120 0L31.5771 47.3297L77.6571 0H52.1143L20.7429 43.5446V0H0V120H20.7429V76.5257L52.1143 120H77.6571L32.7737 74.1583L120 120V97.7143L40.4434 65.7977L120 71.1429V48.8571L40.9474 53.9966L120 22.2857V0Z" fill="#FF5500"/>
        </svg>
    `;

    const LAMPA_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 667 622"><g transform="scale(1, -1) translate(0, -622)"><path fill="currentColor" d="M304 566c-27-3-45-7-66-15-66-24-120-75-149-139-7-15-14-37-18-55l-3-15 0-34c0-38 1-46 7-68 5-18 9-30 18-47 8-17 18-32 27-45 12-16 37-40 54-53 11-8 13-9 6-2-44 38-71 84-82 137-3 15-4 40-2 64 1 20 4 33 10 51 17 51 49 93 94 124 9 6 39 22 44 22 2 0 4 1 6 2 3 2 18 6 34 9 11 2 16 3 35 3 35 1 54-2 81-11 53-18 97-54 125-101 12-19 24-49 28-71 5-23 5-69 0-94-7-35-28-76-52-105-10-12-22-23-32-31-4-3-7-6-7-6 0 0 3 2 7 5 34 23 63 54 84 90 14 25 25 56 30 87 2 10 2 17 2 34-1 35-2 54-10 78-21 71-68 127-134 160-25 12-49 20-79 25-9 1-51 3-59 2zM299 471c-4-1-13-2-19-4-68-17-122-67-143-134-7-22-9-39-8-65 1-20 2-30 7-49 3-11 9-27 10-26 0 0 0 4-1 8-1 5-2 15-2 30-1 19 0 24 2 35 7 39 26 71 56 100 24 22 51 37 86 46 10 2 13 3 35 3 20 0 25 0 36-2 27-4 58-18 79-34 38-30 61-68 71-113 2-10 2-14 2-35-1-17-1-25-2-30-1-4-1-7-1-7 1-1 5 10 8 20 12 36 12 80 1 117-15 50-50 94-98 119-10 6-20 10-34 14-22 7-27 7-53 8-14 0-28 0-32-1zM313 353c-12-2-28-9-38-17-22-16-35-45-33-72 1-16 7-33 16-45 4-6 16-17 22-21 23-15 57-18 82-6 23 11 38 29 46 54 4 12 4 31 1 44-8 30-33 55-62 61-7 2-28 3-34 2zM210 320c-8-10-19-30-23-43-5-15-6-22-6-46 0-24 1-29 6-45 15-45 50-79 95-94 15-5 25-6 46-6 26 0 42 4 64 15 14 7 26 16 39 29 13 13 19 21 27 39 11 22 13 35 13 63 0 14-1 21-2 28-4 20-11 36-24 55-11 16-16 20-9 8 9-18 13-41 11-66-2-28-15-55-38-76-12-12-22-18-38-25-17-7-24-8-45-8-26 0-36 2-57 12-13 6-24 15-35 27-14 15-23 30-29 52-3 10-3 11-3 31 0 20 0 22 3 31 1 6 5 14 7 19 2 5 4 9 4 9 0 0-4-4-8-9z"/></g></svg>`;

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
        const timeout = setTimeout(() => controller.abort(), 3000);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(res.status);
            return res;
        } finally {
            clearTimeout(timeout);
        }
    }

    // Получение ID контента
    function getContentId(data, card) {
        return data.id || 
               data.kinopoisk_id || 
               data.kp_id || 
               card.getAttribute('data-id') || 
               card.getAttribute('id');
    }

    // Определение типа контента
    function getContentType(data, card) {
        if (data.type) return data.type;
        if (card.classList.contains('card--movie')) return 'movie';
        if (card.classList.contains('card--tv')) return 'tv';
        if (card.classList.contains('card--serial')) return 'tv';
        return 'movie'; // fallback
    }

    // Получение рейтинга Kinopoisk
    async function fetchRating(filmId) {
        try {
            const xmlRes = await enqueue(() => fetchWithTimeout(`${RATING_URL}${filmId}.xml`));
            const text = await xmlRes.text();
            const kp = text.match(/<kp_rating[^>]*>([\d.]+)<\/kp_rating>/);
            const imdb = text.match(/<imdb_rating[^>]*>([\d.]+)<\/imdb_rating>/);
            return {
                kp: kp ? parseFloat(kp[1]).toFixed(1) : null,
                imdb: imdb ? parseFloat(imdb[1]).toFixed(1) : null,
                source: 'xml'
            };
        } catch (e) {}

        try {
            const res = await enqueue(() =>
                fetchWithTimeout(`${KP_API_URL}${filmId}`, {
                    headers: { 'X-API-KEY': API_KEY }
                })
            );
            const json = await res.json();
            return {
                kp: json.ratingKinopoisk ? parseFloat(json.ratingKinopoisk).toFixed(1) : null,
                imdb: json.ratingImdb ? parseFloat(json.ratingImdb).toFixed(1) : null,
                source: 'api'
            };
        } catch (e) {
            return { kp: null, imdb: null, source: 'error' };
        }
    }

    // Поиск фильма на Kinopoisk
    async function searchFilm(title, year = '') {
        if (!title || title.length < 2) {
            return { kp: null, imdb: null, filmId: null, year: null, source: 'error' };
        }

        const cacheKey = `${normalizeTitle(title)}_${year}`;
        const cached = getCache(cacheKey);
        if (cached) return cached;

        try {
            const url = `${SEARCH_URL}?keyword=${encodeURIComponent(title)}${year ? `&yearFrom=${year}&yearTo=${year}` : ''}`;
            const res = await enqueue(() =>
                fetchWithTimeout(url, {
                    headers: { 'X-API-KEY': API_KEY }
                })
            );
            const data = await res.json();
            if (!data.films?.length) throw new Error('No results');

            let match = data.films.find(f =>
                titlesMatch(f.nameRu, title) || titlesMatch(f.nameEn, title))
                || data.films[0];

            const ratings = await fetchRating(match.filmId);
            const result = {
                ...ratings,
                filmId: match.filmId,
                year: match.year
            };

            setCache(cacheKey, result);
            return result;
        } catch (e) {
            const fallback = { kp: null, imdb: null, filmId: null, year: null, source: 'error' };
            setCache(cacheKey, fallback);
            return fallback;
        }
    }

    // Получение рейтинга Lampa
    async function fetchLampaRating(data, card) {
        if (Lampa.Manifest.origin !== "bylampa") return null;
        
        const id = getContentId(data, card);
        if (!id) return null;
        
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
            return total > 0 ? (positive / total * 10).toFixed(1) : null;
        } catch (e) {
            return null;
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
            padding: 0.12em 0.2em;
            margin-left: 0;
            border-radius: 0.55em;
            z-index: 10;
            pointer-events: none;
            font-size: 1.2em;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 0;
            text-shadow: 1px 1px 2px #000;
            background: rgba(0, 0, 0, 0.5);
            min-width: max-content; 
        `;

        const iconEl = document.createElement('div');
        if (type === 'kp') {
            iconEl.innerHTML = KP_ICON_SVG;
            iconEl.style.cssText = `
                width: 0.7em;
                height: 0.7em;
                display: flex;
                align-items: center;
                justify-content: center;
                transform: translateY(1.2px);
                 margin-left: 0.3em;
                 margin-right: 0.1em;
            `;
            ratingEl.style.top = '0.1em';
            ratingEl.style.right = '4px';
        } else {
            iconEl.innerHTML = LAMPA_ICON_SVG;
            iconEl.style.cssText = `
                width: 1m;
                height: 1em;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                transform: translateY(1.2px);
            `;
            ratingEl.style.bottom = '4px';
            ratingEl.style.right = '4px';
            ratingEl.style.gap = '0';
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
            // Получаем рейтинг Kinopoisk (оставляем без изменений)
            const { kp } = await searchFilm(title, year);
            if (kp && kp !== '0.0') {
                kpText.textContent = kp;
            } else {
                kpElement.remove();
            }

            // Получаем рейтинг Lampa (только для постера)
            const lampaRating = await fetchLampaRating(data, card);
            if (lampaRating && lampaRating !== '0.0') {
                lampaText.textContent = lampaRating;
            } else {
                lampaElement.remove();
            }
        } catch (e) {
            kpElement?.remove();
            lampaElement?.remove();
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
