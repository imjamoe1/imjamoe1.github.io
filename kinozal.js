!function() {
    "use strict";
    
    var PLUGIN_NAME = "kinozal_parser";
    var CACHE_TIME = 1000 * 60 * 30; // 30 минут
    var CACHE_KEY = "kinozal_cache_v1";
    
    // Конфигурация URL для парсинга (аналогично вашему KINOZAL_URLS)
    var KINOZAL_CATEGORIES = {
        movies_4k: {
            url: 'https://kinozal.tv/browse.php',
            params: {c: '1002', v: '7'},
            title: 'Фильмы 4K'
        },
        movies_fhd: {
            url: 'https://kinozal.tv/browse.php',
            params: {c: '1002', v: '3001'},
            title: 'Фильмы FHD'
        },
        tv_4k: {
            url: 'https://kinozal.tv/browse.php',
            params: {c: '1001', v: '7'},
            title: 'Сериалы 4K'
        },
        tv_fhd: {
            url: 'https://kinozal.tv/browse.php',
            params: {c: '1001', v: '3001'},
            title: 'Сериалы FHD'
        }
    };
    
    // Добавление переводов
    Lampa.Lang.add({
        kinozal_title: {
            ru: "Кинозал.tv",
            en: "Kinozal.tv"
        }
    });
    
    // Функция парсинга страницы Кинозала (адаптированная для браузера)
    async function parseKinozalPage(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml',
                    'Accept-Language': 'ru-RU,ru;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br'
                }
            });
            
            // Для декодирования win1251 в браузере
            const arrayBuffer = await response.arrayBuffer();
            const decoder = new TextDecoder('windows-1251');
            const html = decoder.decode(arrayBuffer);
            
            // Парсинг HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const results = [];
            const rows = doc.querySelectorAll('table.t_peer.w100p tr.bg');
            
            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                if (cols.length < 8) return;
                
                const titleElem = cols[1].querySelector('a[class^="r"]');
                if (!titleElem) return;
                
                const rawName = titleElem.textContent.trim();
                const releaseDate = cols[6].textContent.trim();
                
                // Парсинг названия и года (ваша функция parseKinozalTitles)
                const parsed = parseKinozalTitles(rawName);
                
                // Определение качества
                let quality = '';
                if (rawName.match(/2160p|4K|UHD|4к/i)) quality = '4K';
                else if (rawName.match(/1080p|FullHD|1080/i)) quality = 'FHD';
                
                results.push({
                    title: parsed.russianTitle || parsed.originalTitle,
                    original_title: parsed.originalTitle,
                    name: parsed.russianTitle || parsed.originalTitle,
                    poster_path: '', // Можно оставить пустым или получить из TMDB
                    overview: '',
                    vote_average: 0,
                    release_date: parsed.year ? `${parsed.year}-01-01` : '',
                    type: url.includes('c=1001') ? 'tv' : 'movie',
                    quality: quality,
                    source: PLUGIN_NAME,
                    _raw: rawName,
                    _date: parseKinozalDate(releaseDate)
                });
            });
            
            return results;
            
        } catch (error) {
            console.error('Ошибка парсинга:', error);
            return [];
        }
    }
    
    // Функции парсинга из вашего кода (адаптированные)
    function parseKinozalDate(dateStr) {
        // Ваша реализация parseKinozalDate
        // ...
    }
    
    function parseKinozalTitles(rawName) {
        // Ваша реализация parseKinozalTitles
        // ...
    }
    
    // Сервис плагина
    function KinozalService() {
        var self = this;
        var categoriesData = {};
        
        // Загрузка данных для категории
        self.loadCategory = async function(categoryId) {
            var category = KINOZAL_CATEGORIES[categoryId];
            if (!category) return [];
            
            // Проверка кэша
            var cacheKey = CACHE_KEY + '_' + categoryId;
            var cached = localStorage.getItem(cacheKey);
            if (cached) {
                var cacheData = JSON.parse(cached);
                if (Date.now() - cacheData.timestamp < CACHE_TIME) {
                    return cacheData.data;
                }
            }
            
            // Парсинг данных
            var url = category.url + '?' + new URLSearchParams(category.params).toString();
            var items = await parseKinozalPage(url);
            
            // Кэширование
            if (items.length > 0) {
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: items,
                    timestamp: Date.now()
                }));
            }
            
            return items;
        };
        
        // Метод для получения списка (pagination)
        self.list = function(params, onComplete, onError) {
            var parts = (params.url || "").split('__');
            var categoryId = parts[1];
            var page = parseInt(params.page) || 1;
            var pageSize = 20;
            
            self.loadCategory(categoryId).then(items => {
                var startIndex = (page - 1) * pageSize;
                var endIndex = startIndex + pageSize;
                var pageItems = items.slice(startIndex, endIndex);
                
                onComplete({
                    results: pageItems,
                    page: page,
                    total_pages: Math.ceil(items.length / pageSize),
                    total_results: items.length
                });
            }).catch(onError);
        };
        
        // Метод для построения главной страницы
        self.category = function(params, onSuccess, onError) {
            Promise.all(Object.keys(KINOZAL_CATEGORIES).map(async (categoryId) => {
                var category = KINOZAL_CATEGORIES[categoryId];
                var items = await self.loadCategory(categoryId);
                
                return {
                    url: PLUGIN_NAME + '__' + categoryId,
                    title: category.title,
                    page: 1,
                    total_results: items.length,
                    total_pages: Math.ceil(items.length / 20),
                    results: items.slice(0, 20),
                    source: PLUGIN_NAME,
                    more: items.length > 20
                };
            })).then(sections => {
                onSuccess(sections);
            }).catch(onError);
        };
        
        // Остальные методы API (можно использовать TMDB или оставить заглушки)
        self.full = function(params, onSuccess, onError) {
            // Если нужно детальная информация, можно использовать TMDB
            // Или просто вернуть базовые данные
            if (params.card && params.card.id) {
                onSuccess({
                    ...params.card,
                    overview: params.card.overview || 'Описание отсутствует'
                });
            } else {
                onError(new Error("Card data missing"));
            }
        };
        
        self.clear = function() {};
        self.person = function(params, onSuccess, onError) {
            onSuccess([]);
        };
        
        self.seasons = function(params, onSuccess, onError) {
            onSuccess([]);
        };
    }
    
    // Инициализация плагина
    function startPlugin() {
        var service = new KinozalService();
        Lampa.Api.sources[PLUGIN_NAME] = service;
        
        // Добавление пункта в меню
        var menuItem = $(
            '<li class="menu__item selector" data-action="' + PLUGIN_NAME + '">' +
                '<div class="menu__ico">' +
                    '<svg height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>' +
                '</div>' +
                '<div class="menu__text">' + Lampa.Lang.translate('kinozal_title') + '</div>' +
            '</li>'
        );
        
        menuItem.on("hover:enter", function() {
            Lampa.Activity.push({
                title: Lampa.Lang.translate('kinozal_title'),
                component: "category",
                source: PLUGIN_NAME,
                page: 1
            });
        });
        
        $(".menu .menu__list").eq(0).append(menuItem);
    }
    
    // Запуск плагина
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') startPlugin();
    });
    
})();
