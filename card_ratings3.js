(function() {
    'use strict';

    const API_KEY = '2a4a0808-81a3-40ae-b0d3-e11335ede616';
    const CACHE_KEY = 'kp_rating_cache_v5';
    const CACHE_TIME = 1000 * 60 * 60 * 6;
    const CONCURRENT_LIMIT = 3;

    const queue = [];
    let activeRequests = 0;
    const processedCards = new WeakSet();

    // Иконки
    const KP_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 110 110" fill="currentColor"><circle cx="55" cy="55" r="40" fill="black"/><g transform="translate(10, 10) scale(0.4)"><path fill="white" d="M215 121.415l-99.297-6.644 90.943 36.334a106.416 106.416 0 0 0 8.354-29.69z"/><path fill="white" d="M194.608 171.609C174.933 197.942 143.441 215 107.948 215 48.33 215 0 166.871 0 107.5 0 48.13 48.33 0 107.948 0c35.559 0 67.102 17.122 86.77 43.539l-90.181 48.07L162.57 32.25h-32.169L90.892 86.862V32.25H64.77v150.5h26.123v-54.524l39.509 54.524h32.169l-56.526-57.493 88.564 46.352z"/><path d="M206.646 63.895l-90.308 36.076L215 93.583a106.396 106.396 0 0 0-8.354-29.688z" fill="white"/></g></svg>';

    const LAMPA_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 130 135" fill="currentColor"><circle cx="55" cy="55" r="55" fill="black"/><path d="M81.6744 103.11C98.5682 93.7234 110 75.6967 110 55C110 24.6243 85.3757 0 55 0C24.6243 0 0 24.6243 0 55C0 75.6967 11.4318 93.7234 28.3255 103.11C14.8869 94.3724 6 79.224 6 62C6 34.938 27.938 13 55 13C82.062 13 104 34.938 104 62C104 79.224 95.1131 94.3725 81.6744 103.11Z" fill="white"/><path d="M92.9546 80.0076C95.5485 74.5501 97 68.4446 97 62C97 38.804 78.196 20 55 20C31.804 20 13 38.804 13 62C13 68.4446 14.4515 74.5501 17.0454 80.0076C16.3618 77.1161 16 74.1003 16 71C16 49.4609 33.4609 32 55 32C76.5391 32 94 49.4609 94 71C94 74.1003 93.6382 77.1161 92.9546 80.0076Z" fill="white"/><path d="M55 89C69.3594 89 81 77.3594 81 63C81 57.9297 79.5486 53.1983 77.0387 49.1987C82.579 54.7989 86 62.5 86 71C86 88.1208 72.1208 102 55 102C37.8792 102 24 88.1208 24 71C24 62.5 27.421 54.7989 32.9613 49.1987C30.4514 53.1983 29 57.9297 29 63C29 77.3594 40.6406 89 55 89Z" fill="white"/><path d="M73 63C73 72.9411 64.9411 81 55 81C45.0589 81 37 72.9411 37 63C37 53.0589 45.0589 45 55 45C64.9411 45 73 53.0589 73 63Z" fill="white"/></svg>';

    // Вспомогательные функции
    function getCache(key) {
        try {
            const cache = Lampa.Storage.get(CACHE_KEY, {});
            return cache[key]?.timestamp > Date.now() - CACHE_TIME ? cache[key].data : 0.0;
        } catch (e) {
            return 0.0;
        }
    }

    function setCache(key, data) {
        try {
            const cache = Lampa.Storage.get(CACHE_KEY, {});
            cache[key] = { data, timestamp: Date.now() };
            Lampa.Storage.set(CACHE_KEY, cache);
        } catch (e) {}
    }

    async function fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        try {
            const response = await fetch(url, { 
                ...options, 
                signal: controller.signal 
            });
            clearTimeout(timeout);
            return response;
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    }

    // Получение рейтинга Kinopoisk
    async function getKpRating(kpId, title, year) {
        const cacheKey = `kp_${kpId || title}_${year}`;
        const cached = getCache(cacheKey);
        if (cached) return cached;

        try {
            if (kpId) {
                const response = await fetchWithTimeout(
                    `https://kinopoiskapiunofficial.tech/api/v2.2/films/${kpId}`, 
                    {
                        headers: {
                            'X-API-KEY': API_KEY,
                            'Accept': 'application/json'
                        }
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    const result = {
                        kp: data.ratingKinopoisk || '0.0',
                        imdb: data.ratingImdb || '0.0',
                        source: 'api'
                    };
                    setCache(cacheKey, result);
                    return result;
                }
            }

            if (title) {
                const searchUrl = `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(title)}${year ? `&yearFrom=${year}&yearTo=${year}` : ''}`;
                
                const response = await fetchWithTimeout(searchUrl, {
                    headers: {
                        'X-API-KEY': API_KEY,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.films?.length > 0) {
                        const film = data.films.find(f => 
                            f.nameRu?.toLowerCase() === title.toLowerCase() || 
                            f.nameEn?.toLowerCase() === title.toLowerCase()
                        ) || data.films[0];
                        
                        const result = {
                            kp: film.rating || '0.0',
                            imdb: film.ratingImdb || '0.0',
                            source: 'search'
                        };
                        setCache(cacheKey, result);
                        return result;
                    }
                }
            }

            return { kp: '0.0', imdb: '0.0', source: 'error' };

        } catch (error) {
            return { kp: '0.0', imdb: '0.0', source: 'error' };
        }
    }

    // Получение рейтинга Lampa
    async function getLampaRating(data, card) {
        if (Lampa.Manifest.origin !== "bylampa") return '0.0';
        
        const id = data.id || data.kinopoisk_id || data.kp_id || card.getAttribute('data-id');
        if (!id) return '0.0';
        
        const type = data.type || (card.classList.contains('card--tv') ? 'tv' : 'movie');
        const url = `http://cub.bylampa.online/api/reactions/get/${type}_${id}`;
        
        try {
            const response = await fetchWithTimeout(url);
            const json = await response.json();
            const result = json.result || [];
            
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
            return '0.0';
        }
    }

    // Создание элемента рейтинга
    function createRatingElement(rating, type = 'kp', position = 'top') {
        const element = document.createElement('div');
        element.className = `card__rating card__rating--${type}`;
        
        const icon = type === 'kp' ? KP_ICON_SVG : LAMPA_ICON_SVG;
        
        element.innerHTML = `
            <div style="display: flex; align-items: center; gap: 4px; padding: 2px 4px;">
                ${icon}
                <span style="font-size: 11px; font-weight: bold;">${rating}</span>
            </div>
        `;
        
        element.style.cssText = `
            position: absolute;
            ${position === 'top' ? 'top: 4px;' : 'bottom: 4px;'}
            right: 4px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 4px;
            color: white;
            z-index: 10;
            pointer-events: none;
        `;
        
        return element;
    }

    // Скрытие TMDB рейтинга
    function hideTmdbRating(card) {
        const tmdbRating = card.querySelector('.card__vote, .card__rating--tmdb');
        if (tmdbRating) {
            tmdbRating.style.display = 'none';
        }
        
        // Также скрываем в карточках Lampa
        const lampaRating = card.querySelector('.card__rating');
        if (lampaRating && !lampaRating.classList.contains('card__rating--kp') && 
            !lampaRating.classList.contains('card__rating--lampa')) {
            lampaRating.style.display = 'none';
        }
    }

    // Обработка карточки
    async function processCard(card) {
        if (processedCards.has(card)) return;
        processedCards.add(card);

        // Скрываем TMDB рейтинг сразу
        hideTmdbRating(card);

        try {
            const cardView = card.querySelector('.card__view');
            if (!cardView) return;

            // Проверяем, не добавлены ли уже наши рейтинги
            if (cardView.querySelector('.card__rating--kp') || cardView.querySelector('.card__rating--lampa')) {
                return;
            }

            // Получаем данные карточки
            let data = card.card_data || (card.dataset?.card && JSON.parse(card.dataset.card)) || {};
            if (!data) {
                const titleEl = card.querySelector('.card__title, .card__name');
                const yearEl = card.querySelector('.card__year');
                if (titleEl) {
                    data = {
                        title: titleEl.textContent,
                        year: yearEl ? yearEl.textContent.match(/\d{4}/)?.[0] : '',
                        name: titleEl.textContent
                    };
                }
            }

            if (!data || !data.title) return;

            const title = data.title || data.name || data.original_title || data.original_name || '';
            const year = data.year || '';
            const kpId = data.kinopoisk_id || data.kp_id || card.getAttribute('data-id') || '';

            // Создаем элементы рейтингов
            const kpElement = createRatingElement('...', 'kp', 'top');
            const lampaElement = createRatingElement('...', 'lampa', 'bottom');

            cardView.style.position = 'relative';
            cardView.appendChild(kpElement);
            cardView.appendChild(lampaElement);

            // Получаем рейтинги асинхронно
            Promise.all([
                getKpRating(kpId, title, year),
                getLampaRating(data, card)
            ]).then(([kpData, lampaRating]) => {
                // Обновляем KP рейтинг
                const kpRatingValue = kpData.kp !== '0.0' ? kpData.kp : '0.0';
                kpElement.querySelector('span').textContent = kpRatingValue;
                
                if (kpData.kp !== '0.0' || kpData.imdb !== '0.0') {
                    kpElement.title = `КиноПоиск: ${kpData.kp} | IMDB: ${kpData.imdb}`;
                    kpElement.style.cursor = 'help';
                    kpElement.style.pointerEvents = 'auto';
                }

                // Обновляем Lampa рейтинг
                lampaElement.querySelector('span').textContent = lampaRating !== '0.0' ? lampaRating : '0.0';
                
                if (lampaRating !== '0.0') {
                    lampaElement.title = `Рейтинг Lampa: ${lampaRating}`;
                    lampaElement.style.cursor = 'help';
                    lampaElement.style.pointerEvents = 'auto';
                }
            });

        } catch (error) {
            console.error('Error processing card:', error);
        }
    }

    // Инициализация
    function init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    processCard(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '50px' });

        // Обработка существующих карточек
        document.querySelectorAll('.card').forEach(card => {
            observer.observe(card);
            hideTmdbRating(card); // Скрываем TMDB сразу
        });

        // Наблюдатель за новыми карточками
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.classList.contains('card')) {
                            observer.observe(node);
                            hideTmdbRating(node);
                        }
                        node.querySelectorAll?.('.card').forEach(card => {
                            observer.observe(card);
                            hideTmdbRating(card);
                        });
                    }
                });
            });
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Дополнительно скрываем TMDB рейтинги при изменении DOM
        setInterval(() => {
            document.querySelectorAll('.card').forEach(card => {
                if (!processedCards.has(card)) {
                    hideTmdbRating(card);
                }
            });
        }, 1000);
    }

    // Запуск
    if (typeof Lampa !== 'undefined') {
        init();
    } else {
        document.addEventListener('lampaReady', init);
    }
})();
