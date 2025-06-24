!function() {
    "use strict";
    
    var PLUGIN_NAME = "maxsm_rik";
    var JSON_URL = "https://lampa.ruzha.ru/rikparser.json";
    var CACHE_TIME = 1000 * 60 * 30;
    var CACHE_KEY = "maxsm_rik_cache_v6";
    var ICON_SVG = '<svg fill="#fff" width="800px" height="800px" viewBox="0 0 14 14" role="img" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="m 6.5590634,4.41475 c -0.42968,0.083 -1.14736,0.4199 -1.46463,0.6835 -0.76654,0.6347 -1.14246,1.4842 -1.14246,2.5582 0,0.669 0.0781,1.0253 0.36612,1.5965 0.56144,1.118 1.74296,1.8797 3.53478,2.2654 0.42968,0.098 0.67862,0.1123 2.10908,0.1319 l 1.6257796,0.02 0.22947,-0.1367 c 0.21967,-0.127 1.22536,-1.0741 1.1814,-1.1132 -0.01,0 -0.19531,0 -0.41009,0.024 -0.21478,0.02 -0.88862,0.063 -1.49401,0.093 -2.3141896,0.1074 -3.6957996,-0.1172 -4.8138896,-0.7909 -0.32707,-0.2002 -0.83977,-0.7275 -0.98132,-1.0204 -0.5029,-1.0449 -0.21478,-2.2751 0.67372,-2.8707 1.04964,-0.6982 2.48501,-0.4297 3.16375,0.5956 l 0.12208,0.1806 0.46874,-0.249 c 0.25874,-0.1415 0.4785396,-0.2587 0.4882096,-0.2685 0.0587,-0.049 -0.20988,-0.4248 -0.5565296,-0.7762 -0.32229,-0.332 -0.46874,-0.4394 -0.85434,-0.6298 -0.72748,-0.3565 -1.43059,-0.4494 -2.24586,-0.2931 z m -0.17094,-1.4501 c -1.53308,0.249 -2.84636,1.2401 -3.51518,2.6511 -0.6103,1.2791 -0.55164,2.9294 0.15134,4.311 0.50781,0.996 1.37684,1.8552 2.40689,2.3727 l 0.38572,0.1904 1.70879,0 c 1.84067,0 2.15794,-0.029 2.8903196,-0.2734 0.35155,-0.1123 0.66392,-0.2637 0.39539,-0.1904 -0.23437,0.068 -2.1628396,0.034 -2.7096996,-0.044 -2.83167,-0.415 -4.53556,-2.0944 -4.53556,-4.4721 0,-0.5517 0.0147,-0.6543 0.14645,-1.0351 0.27343,-0.7958 0.77143,-1.4501 1.42067,-1.865 0.63955,-0.4101 1.25474,-0.586 2.03586,-0.5762 0.57123,0 1.03017,0.093 1.53295,0.2978 0.20021,0.083 0.37103,0.1416 0.37592,0.1368 0.01,0 0.11719,-0.2197 0.23927,-0.4687 0.25874,-0.5224 0.25874,-0.5224 -0.17094,-0.6885 -0.63466,-0.2489 -1.12287,-0.3466 -1.83088,-0.3661 -0.37555,-0.01 -0.79066,3e-4 -0.92731,0.02 z m -0.61029,-1.367 c -1.33275,0.2783 -2.38252,0.9228 -3.36384,2.0799 -0.66882,0.786 -1.19132,1.9821 -1.35234,3.1002 -0.21967495,1.5526 0.14645,3.0221 1.11797,4.4771 0.27343,0.4101 0.33197,0.4687 0.62009,0.6152 0.55654,0.2929 1.08381,0.4589 1.89431,0.5908 0.083,0.015 0.15624,0.019 0.15624,0.01 0,-0.01 -0.12208,-0.1123 -0.27833,-0.2246 -0.43935,-0.3321 -1.14736,-1.0791 -1.46462,-1.5478 -0.78601,-1.1474 -1.03018,-1.9968 -0.97642,-3.3834 0.0196,-0.5615 0.0537,-0.7909 0.15135,-1.1083 0.64923,-2.1237 2.41178,-3.5786 4.35494,-3.5981 l 0.40029,0 0.0293,-0.3174 c 0.0196,-0.1757 0.044,-0.4199 0.0635,-0.5516 l 0.0293,-0.2295 -0.48331,0 c -0.26853,0 -0.66894,0.044 -0.89841,0.088 z"/></svg>';
    
    Lampa.Lang.add({
        maxsm_rik_title: {
            ru: "РиК",
            en: "RiK",
            uk: "RiK",
            be: "RiK",
            pt: "RiK",
            zh: "RiK",
            he: "RiK",
            cs: "RiK",
            bg: "RiK",
        },
        maxsm_rik_cache: {
            ru: "Очистить кэш",
            en: "Clear cache",
            uk: "Очистити кеш"
        },
        maxsm_rik_cleared: {
            ru: "Кэш очищен",
            en: "Cache cleared",
            uk: "Кеш очищено"
        }
    });
    
    // Функция перевода качества
    var translateQuality = function(q) {
        if (!q) return ''; 
        if (q === '4K') return '4K';
        if (q === '4k') return '4K';
        if (q === '2160p') return '4K';
        if (q === '1080p') return 'FHD';
        if (q === '720p') return 'HD';
        return 'SD'; 
    };
    
    // Инициализация кэша
    function initCache() {
        if (!localStorage[CACHE_KEY]) {
            localStorage[CACHE_KEY] = JSON.stringify({
                data: {},
                timestamp: Date.now(),
                version: "v1"
            });
        }
    }
    
    // Получение данных из кэша
    function getCache() {
        return null;
        try {
            return JSON.parse(localStorage[CACHE_KEY] || null);
        } catch (e) {
            return null;
        }
    }
    
    // Сохранение данных в кэш
    function setCache(data) {
        localStorage[CACHE_KEY] = JSON.stringify({
            data: data,
            timestamp: Date.now(),
            version: "v1"
        });
    }
    
    // Принудительная очистка кэша
    function clearCache() {
        localStorage.removeItem(CACHE_KEY);
        initCache();
        return true;
    }
    
    function CategorizedService() {
        var self = this;
        var network = new Lampa.Reguest();
        var categoriesData = {};
        
        // Загрузка данных
        self.loadData = function(onComplete, onError) {
            var cached = getCache();
            if (cached && cached.version === "v1" && Date.now() - cached.timestamp < CACHE_TIME) {
                categoriesData = cached.data;
                onComplete();
                return;
            }
            
            network.silent(JSON_URL, function(json) {
                if (!json || !json.categories || !Array.isArray(json.categories)) {
                    onError(new Error("Invalid JSON format"));
                    return;
                }
                
                // Преобразуем в нужный формат
                var normalizedData = {};
                for (var i = 0; i < json.categories.length; i++) {
                    var category = json.categories[i];
                    normalizedData[category.id] = {
                        title: category.title,
                        items: category.items.map(normalizeItem)
                    };
                }
                
                categoriesData = normalizedData;
                setCache(normalizedData);
                onComplete();
            }, function(error) {
                onError(error || new Error("Network error"));
            });
        };
        
        // Нормализация элемента
        function normalizeItem(item) {
                     var dataItem = {
                        id: item.id,
                        poster_path: item.poster_path || item.poster || '',
                        img: item.img,
                        overview: item.overview || item.description || '',
                        vote_average: item.vote_average || 0,
                        backdrop_path: item.backdrop_path || item.backdrop || '',
                        background_image: item.background_image,
                        source: 'tmdb'
                    };

                    if (!!item.release_quality) dataItem.release_quality = translateQuality(item.release_quality);

                    if (!!item.name) dataItem.name = item.name;
                    if (!!item.title) dataItem.title = item.title;
                    if (!!item.original_name) dataItem.original_name = item.original_name;
                    if (!!item.original_title) dataItem.original_title = item.original_title;

                    if (!!item.release_date) dataItem.release_date = item.release_date;
                    if (!!item.first_air_date) dataItem.first_air_date = item.first_air_date;
                    if (!!item.number_of_seasons) dataItem.number_of_seasons = item.number_of_seasons;
                    if (!!item.last_air_date) dataItem.last_air_date = item.last_air_date;
                    if (!!item.last_episode_to_air) dataItem.last_episode_to_air = item.last_episode_to_air;

                    dataItem.promo_title = dataItem.name || dataItem.title || dataItem.original_name || dataItem.original_title;
                    dataItem.promo = dataItem.overview;
            
                    return dataItem;
        }
        
        // Метод для получения данных категории
        self.list = function(params, onComplete, onError) {
            var parts = (params.url || "").split('__');
            var categoryId = parts[1];
            var page = parseInt(params.page) || 1;
            var pageSize = 20;
            
            if (!categoriesData[categoryId]) {
                self.loadData(function() {
                    sendCategoryPage(categoryId, page, pageSize, onComplete);
                }, onError);
            } else {
                sendCategoryPage(categoryId, page, pageSize, onComplete);
            }
        };
        
        function sendCategoryPage(categoryId, page, pageSize, onComplete) {
            var category = categoriesData[categoryId] || { items: [] };
            var startIndex = (page - 1) * pageSize;
            var endIndex = startIndex + pageSize;
            var items = category.items.slice(startIndex, endIndex);
            
            onComplete({
                results: items,
                page: page,
                total_pages: Math.ceil(category.items.length / pageSize),
                total_results: category.items.length
            });
        }
        
        // Метод для построения главной страницы
        self.category = function(params, onSuccess, onError) {
            self.loadData(function() {
                var sections = [];
                
                // Создаем разделы для всех категорий из JSON
                for (var categoryId in categoriesData) {
                    if (categoriesData.hasOwnProperty(categoryId)) {
                        var category = categoriesData[categoryId];
                        var categoryItems = category.items || [];
                        
                        sections.push({
                            url: PLUGIN_NAME + '__' + categoryId,
                            title: category.title + ' - ' + Lampa.Lang.translate('maxsm_rik_title'),
                            page: 1,
                            total_results: categoryItems.length,
                            total_pages: Math.ceil(categoryItems.length / 20),
                            results: categoryItems.slice(0, 20),
                            source: PLUGIN_NAME,
                            more: categoryItems.length > 20
                        });
                    }
                }
                
                onSuccess(sections);
            }, onError);
        };
        
        // Остальные методы API
        self.full = function(params, onSuccess, onError) {
            if (!params.card) return onError(new Error("Card data missing"));
            
            Lampa.Api.sources.tmdb.full({
                id: params.card.id,
                method: params.card.type === "tv" ? "tv" : "movie",
                card: params.card
            }, onSuccess, onError);
        };
        
        self.clear = function() {};
        self.person = Lampa.Api.sources.tmdb.person;
        self.seasons = Lampa.Api.sources.tmdb.seasons;
    }

    function startPlugin() {
        initCache();
        
        // Добавляем кнопку очистки кэша
        Lampa.SettingsApi.addParam({
            component: "main",
            param: {
                name: "maxsm_clear_cache",
                type: "trigger",
                default: false
            },
            field: {
                name: Lampa.Lang.translate('maxsm_clear_cache'),
                description: Lampa.Lang.translate('maxsm_cache_cleared')
            },
            onChange: function() {
                clearCache();
                Lampa.Noty.show(Lampa.Lang.translate('maxsm_cache_cleared'));
            }
        });
        
        var service = new CategorizedService();
        Lampa.Api.sources[PLUGIN_NAME] = service;
        
        var menuItem = $(
            '<li class="menu__item selector" data-action="' + PLUGIN_NAME + '">' +
                '<div class="menu__ico">' + ICON_SVG + '</div>' +
                '<div class="menu__text">' + Lampa.Lang.translate('maxsm_rik_title') + '</div>' +
            '</li>'
        );
        
        menuItem.on("hover:enter", function() {
            Lampa.Activity.push({
                title: Lampa.Lang.translate('maxsm_rik_title'),
                component: "category",
                source: PLUGIN_NAME,
                page: 1
            });
        });
        
        $(".menu .menu__list").eq(0).append(menuItem);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') startPlugin();
    });
}();
