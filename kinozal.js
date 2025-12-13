!function() {
    "use strict";
    
    var PLUGIN_NAME = "kinozal_tv";
    var CACHE_TIME = 1000 * 60 * 30; // 30 минут кэша
    var CACHE_PREFIX = "kinozal_cache_";
    var ICON_SVG = '<svg height="30" viewBox="0 0 38 30" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="35" height="27" rx="1.5" stroke="currentColor" stroke-width="3"></rect><path d="M18.105 22H15.2936V16H9.8114V22H7V8H9.8114V13.6731H15.2936V8H18.105V22Z" fill="currentColor"></path><path d="M20.5697 22V8H24.7681C25.9676 8 27.039 8.27885 27.9824 8.83654C28.9321 9.38782 29.6724 10.1763 30.2034 11.2019C30.7345 12.2212 31 13.3814 31 14.6827V15.3269C31 16.6282 30.7376 17.7853 30.2128 18.7981C29.6943 19.8109 28.9602 20.5962 28.0105 21.1538C27.0609 21.7115 25.9895 21.9936 24.7962 22H20.5697ZM23.3811 10.3365V19.6827H24.7399C25.8395 19.6827 26.6798 19.3141 27.2608 18.5769C27.8419 17.8397 28.1386 16.7853 28.1511 15.4135V14.6731C28.1511 13.25 27.8637 12.1731 27.289 11.4423C26.7142 10.7051 25.8739 10.3365 24.7681 10.3365H23.3811Z" fill="currentColor"></path></svg>';
    
    // Категории Кинозал.тв
    var KINOZAL_CATEGORIES = {
        movies_4k: {
            id: 'movies_4k',
            title: 'Фильмы 4K',
            url: 'https://kinozal.tv/browse.php?c=1002&v=7',
            type: 'movie',
            quality: '4K'
        },
        movies_fhd: {
            id: 'movies_fhd',
            title: 'Фильмы FHD',
            url: 'https://kinozal.tv/browse.php?c=1002&v=3001',
            type: 'movie',
            quality: 'FHD'
        },
        movies_hd: {
            id: 'movies_hd',
            title: 'Фильмы HD',
            url: 'https://kinozal.tv/browse.php?c=1002&v=3002',
            type: 'movie',
            quality: 'HD'
        },
        tv_4k: {
            id: 'tv_4k',
            title: 'Сериалы 4K',
            url: 'https://kinozal.tv/browse.php?c=1001&v=7',
            type: 'tv',
            quality: '4K'
        },
        tv_fhd: {
            id: 'tv_fhd',
            title: 'Сериалы FHD',
            url: 'https://kinozal.tv/browse.php?c=1001&v=3001',
            type: 'tv',
            quality: 'FHD'
        },
        tv_hd: {
            id: 'tv_hd',
            title: 'Сериалы HD',
            url: 'https://kinozal.tv/browse.php?c=1001&v=3002',
            type: 'tv',
            quality: 'HD'
        },
        mult_4k: {
            id: 'mult_4k',
            title: 'Мультфильмы 4K',
            url: 'https://kinozal.tv/browse.php?c=1003&v=7',
            type: 'movie',
            quality: '4K'
        },
        mult_fhd: {
            id: 'mult_fhd',
            title: 'Мультфильмы FHD',
            url: 'https://kinozal.tv/browse.php?c=1003&v=3001',
            type: 'movie',
            quality: 'FHD'
        },
        anime_4k: {
            id: 'anime_4k',
            title: 'Аниме 4K',
            url: 'https://kinozal.tv/browse.php?c=20&v=7',
            type: 'tv',
            quality: '4K'
        },
        anime_fhd: {
            id: 'anime_fhd',
            title: 'Аниме FHD',
            url: 'https://kinozal.tv/browse.php?c=20&v=3001',
            type: 'tv',
            quality: 'FHD'
        }
    };
    
    // Добавление переводов
    Lampa.Lang.add({
        kinozal_title: {
            ru: "Кинозал.тв",
            en: "Kinozal.tv",
            uk: "Кінозал.тв"
        },
        kinozal_clear_cache: {
            ru: "Очистить кэш Кинозал",
            en: "Clear Kinozal cache",
            uk: "Очистити кеш Кінозал"
        },
        kinozal_cache_cleared: {
            ru: "Кэш Кинозал очищен",
            en: "Kinozal cache cleared",
            uk: "Кеш Кінозал очищено"
        },
        kinozal_settings: {
            ru: "Настройки Кинозал",
            en: "Kinozal settings",
            uk: "Налаштування Кінозал"
        }
    });
    
    // =========== УТИЛИТЫ ===========
    
    // Декодирование win1251
    function decodeWin1251(arrayBuffer) {
        var bytes = new Uint8Array(arrayBuffer);
        var win1251 = "ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’" + "•" + "–—" + "™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬ ®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя";
        var result = "";
        
        for (var i = 0; i < bytes.length; i++) {
            var code = bytes[i];
            if (code < 128) {
                result += String.fromCharCode(code);
            } else if (code >= 192) {
                result += win1251.charAt(code - 192);
            } else {
                result += "?";
            }
        }
        return result;
    }
    
    // Парсинг даты Кинозал
    function parseKinozalDate(dateStr) {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        var months = {
            'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3,
            'май': 4, 'июн': 5, 'июл': 6, 'авг': 7,
            'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
        };
        
        try {
            var lowerDateStr = dateStr.toLowerCase().trim();
            
            if (lowerDateStr.includes('сегодня')) {
                var timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                    today.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
                }
                return today.toISOString();
            }
            
            if (lowerDateStr.includes('вчера')) {
                var timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                    yesterday.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
                }
                return yesterday.toISOString();
            }
            
            var parts = dateStr.split(' ').filter(function(p) { return p.trim() !== ''; });
            if (parts.length >= 3) {
                var day = parseInt(parts[0]);
                var month = months[parts[1].toLowerCase().substr(0, 3)];
                var year = parts[2];
                
                if (year.length === 2) {
                    year = 2000 + parseInt(year);
                } else {
                    year = parseInt(year);
                }
                
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    return new Date(year, month, day).toISOString();
                }
            }
            
            return new Date().toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }
    
    // Парсинг названий
    function parseKinozalTitles(rawName) {
        var cleanTitle = function(title) {
            return title
                .replace(/\s*\([^)]*(?:сезон|серии|серия|из)[^)]*\)/gi, '')
                .split(/(?:\s{2,}|\s+\|\s+| от | by )/i)[0]
                .replace(/\b(BDRemux|WEB[-]?DL|Blu[-]?Ray|HDRip|WEBRip|HDTV|iTunes|AVC|HEVC|AAC|MP3|DTS|FLAC|DDP5\.1|Dolby.*|HDR|4K|1080p|2160p)\b/gi, '')
                .replace(/\[.*?\]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        };
        
        // Шаблон: Русское название / Оригинальное название / Год / Детали
        var pattern = /^(.*?)\s*\/\s*(.*?)\s*\/\s*(\d{4})\s*\/\s*(.*)/;
        var match = rawName.match(pattern);
        
        if (match) {
            return {
                russianTitle: cleanTitle(match[1].trim()),
                originalTitle: cleanTitle(match[2].trim()),
                year: match[3],
                details: match[4]
            };
        }
        
        // Шаблон без русского названия: Оригинальное название / Год / Детали
        var altPattern = /^(.*?)\s*\/\s*(\d{4})\s*\/\s*(.*)/;
        var altMatch = rawName.match(altPattern);
        
        if (altMatch) {
            return {
                russianTitle: '',
                originalTitle: cleanTitle(altMatch[1].trim()),
                year: altMatch[2],
                details: altMatch[3]
            };
        }
        
        // Извлечение года из скобок
        var yearMatch = rawName.match(/\((\d{4})\)/);
        var year = yearMatch ? yearMatch[1] : null;
        
        // Ручной парсинг
        var parts = rawName.split('/').map(function(p) { return cleanTitle(p.trim()); });
        var russianTitle = '';
        var originalTitle = '';
        
        if (parts.length > 1) {
            russianTitle = parts[0];
            originalTitle = parts[1];
        } else {
            originalTitle = parts[0];
        }
        
        return { 
            russianTitle: russianTitle, 
            originalTitle: originalTitle, 
            year: year 
        };
    }
    
    // Определение качества
    function detectQuality(rawName) {
        if (rawName.match(/2160p|4K|UHD|4к/i)) return '4K';
        if (rawName.match(/1080p|FullHD|1080/i)) return 'FHD';
        if (rawName.match(/720p|HD720/i)) return 'HD';
        return 'SD';
    }
    
    // =========== ПАРСЕР ===========
    
    async function parseKinozalCategory(category) {
        var cacheKey = CACHE_PREFIX + category.id;
        var now = Date.now();
        
        // Проверка кэша
        try {
            var cached = localStorage.getItem(cacheKey);
            if (cached) {
                var cacheData = JSON.parse(cached);
                if (now - cacheData.timestamp < CACHE_TIME && cacheData.data && cacheData.data.length > 0) {
                    console.log('[Kinozal] Используем кэш для:', category.title);
                    return cacheData.data;
                }
            }
        } catch (e) {
            console.warn('[Kinozal] Ошибка чтения кэша:', e);
        }
        
        console.log('[Kinozal] Парсим:', category.title, 'URL:', category.url);
        
        try {
            var response = await fetch(category.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml',
                    'Accept-Language': 'ru-RU,ru;q=0.9',
                    'Referer': 'https://kinozal.tv/'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            
            var arrayBuffer = await response.arrayBuffer();
            var html = decodeWin1251(arrayBuffer);
            
            // Парсим HTML
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var results = [];
            
            // Ищем таблицу с раздачами
            var tables = doc.querySelectorAll('table');
            var targetTable = null;
            
            for (var i = 0; i < tables.length; i++) {
                var table = tables[i];
                if (table.className.includes('t_peer') && table.className.includes('w100p')) {
                    targetTable = table;
                    break;
                }
            }
            
            if (!targetTable) {
                console.warn('[Kinozal] Не найдена таблица на странице');
                return [];
            }
            
            // Парсим строки таблицы
            var rows = targetTable.querySelectorAll('tr.bg');
            
            for (var j = 0; j < rows.length; j++) {
                var row = rows[j];
                var cols = row.querySelectorAll('td');
                
                if (cols.length < 8) continue;
                
                // Название (ячейка 1)
                var titleElem = cols[1].querySelector('a[class^="r"]');
                if (!titleElem) continue;
                
                var rawName = titleElem.textContent.trim();
                var releaseDateRaw = cols[6].textContent.trim();
                
                // Парсим названия
                var parsed = parseKinozalTitles(rawName);
                var quality = detectQuality(rawName);
                
                // Определяем тип
                var mediaType = category.type;
                
                // Если в названии есть указания на сериал
                if (rawName.match(/[Сс]езон|[Сс]ерии|[Сс]ерия|[Tt]ом\s\d|[Ss]eason|[Ee]pisode/i)) {
                    mediaType = 'tv';
                }
                
                // Создаем элемент
                var item = {
                    id: 'kz_' + Date.now() + '_' + j,
                    title: parsed.russianTitle || parsed.originalTitle || rawName,
                    name: parsed.russianTitle || parsed.originalTitle || rawName,
                    original_title: parsed.originalTitle || '',
                    original_name: parsed.originalTitle || '',
                    overview: '',
                    vote_average: 0,
                    release_date: parsed.year ? parsed.year + '-01-01' : '',
                    first_air_date: parsed.year ? parsed.year + '-01-01' : '',
                    media_type: mediaType,
                    type: mediaType,
                    quality: quality,
                    release_quality: quality,
                    poster_path: '',
                    backdrop_path: '',
                    source: PLUGIN_NAME,
                    _raw: rawName,
                    _date: parseKinozalDate(releaseDateRaw),
                    _category: category.id
                };
                
                results.push(item);
                
                // Ограничиваем количество
                if (results.length >= 100) break;
            }
            
            console.log('[Kinozal] Найдено раздач:', results.length, 'в категории', category.title);
            
            // Сохраняем в кэш
            if (results.length > 0) {
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        data: results,
                        timestamp: now,
                        category: category.id
                    }));
                } catch (e) {
                    console.warn('[Kinozal] Ошибка сохранения в кэш:', e);
                }
            }
            
            return results;
            
        } catch (error) {
            console.error('[Kinozal] Ошибка парсинга', category.title, ':', error);
            
            // Пробуем вернуть старые кэшированные данные
            try {
                var cached = localStorage.getItem(cacheKey);
                if (cached) {
                    var cacheData = JSON.parse(cached);
                    if (cacheData.data && cacheData.data.length > 0) {
                        console.log('[Kinozal] Используем старый кэш при ошибке');
                        return cacheData.data;
                    }
                }
            } catch (e) {}
            
            return [];
        }
    }
    
    // =========== СЕРВИС ПЛАГИНА ===========
    
    function KinozalService() {
        var self = this;
        var network = new Lampa.Reguest();
        
        // Загрузка данных категории
        self.loadCategoryData = async function(categoryId) {
            var category = KINOZAL_CATEGORIES[categoryId];
            if (!category) return [];
            
            return await parseKinozalCategory(category);
        };
        
        // Метод для пагинации
        self.list = function(params, onComplete, onError) {
            var parts = (params.url || "").split('__');
            var categoryId = parts[1];
            var page = parseInt(params.page) || 1;
            var pageSize = 20;
            
            self.loadCategoryData(categoryId).then(function(items) {
                var startIndex = (page - 1) * pageSize;
                var endIndex = startIndex + pageSize;
                var pageItems = items.slice(startIndex, endIndex);
                
                onComplete({
                    results: pageItems,
                    page: page,
                    total_pages: Math.ceil(items.length / pageSize),
                    total_results: items.length
                });
            }).catch(function(error) {
                onError(error || new Error("Ошибка загрузки категории"));
            });
        };
        
        // Главная страница с категориями
        self.category = function(params, onSuccess, onError) {
            var sections = [];
            var categoryIds = Object.keys(KINOZAL_CATEGORIES);
            
            // Загружаем данные для всех категорий
            var promises = categoryIds.map(function(categoryId) {
                return self.loadCategoryData(categoryId).then(function(items) {
                    var category = KINOZAL_CATEGORIES[categoryId];
                    
                    sections.push({
                        url: PLUGIN_NAME + '__' + categoryId,
                        title: category.title + ' (' + items.length + ')',
                        page: 1,
                        total_results: items.length,
                        total_pages: Math.ceil(items.length / 20),
                        results: items.slice(0, 20),
                        source: PLUGIN_NAME,
                        more: items.length > 20
                    });
                });
            });
            
            Promise.all(promises).then(function() {
                // Сортируем секции по количеству элементов
                sections.sort(function(a, b) {
                    return b.total_results - a.total_results;
                });
                
                onSuccess(sections);
            }).catch(onError);
        };
        
        // Детальная информация (используем TMDB если есть)
        self.full = function(params, onSuccess, onError) {
            if (!params.card) {
                return onError(new Error("Card data missing"));
            }
            
            var card = params.card;
            
            // Если в карточке есть TMDB ID, используем TMDB
            if (card.id && card.id.toString().startsWith('kz_')) {
                // Для элементов Кинозал просто возвращаем то что есть
                onSuccess({
                    ...card,
                    overview: card.overview || 'Нет описания. Источник: Кинозал.тв',
                    runtime: card.runtime || 120,
                    genres: card.genres || [{id: 0, name: 'Фильм'}]
                });
            } else {
                // Иначе пробуем TMDB
                Lampa.Api.sources.tmdb.full(params, onSuccess, onError);
            }
        };
        
        // Очистка
        self.clear = function() {};
        
        // Актеры (заглушка)
        self.person = function(params, onSuccess, onError) {
            onSuccess([]);
        };
        
        // Сезоны (заглушка)
        self.seasons = function(params, onSuccess, onError) {
            onSuccess([]);
        };
    }
    
    // =========== ИНИЦИАЛИЗАЦИЯ ПЛАГИНА ===========
    
    function startPlugin() {
        console.log('[Kinozal] Инициализация плагина');
        
        // Добавляем настройку очистки кэша
        Lampa.SettingsApi.addParam({
            component: "main",
            param: {
                name: "kinozal_clear_cache",
                type: "trigger",
                default: false
            },
            field: {
                name: Lampa.Lang.translate('kinozal_clear_cache'),
                description: Lampa.Lang.translate('kinozal_cache_cleared')
            },
            onChange: function() {
                // Удаляем все кэши Кинозал
                for (var key in KINOZAL_CATEGORIES) {
                    localStorage.removeItem(CACHE_PREFIX + KINOZAL_CATEGORIES[key].id);
                }
                Lampa.Noty.show(Lampa.Lang.translate('kinozal_cache_cleared'));
            }
        });
        
        // Регистрируем сервис
        var service = new KinozalService();
        Lampa.Api.sources[PLUGIN_NAME] = service;
        
        // Создаем пункт меню
        var menuItem = $(
            '<li class="menu__item selector" data-action="' + PLUGIN_NAME + '">' +
                '<div class="menu__ico">' + ICON_SVG + '</div>' +
                '<div class="menu__text">' + Lampa.Lang.translate('kinozal_title') + '</div>' +
            '</li>'
        );
        
        // Обработчик клика
        menuItem.on("hover:enter", function() {
            Lampa.Activity.push({
                title: Lampa.Lang.translate('kinozal_title'),
                component: "category",
                source: PLUGIN_NAME,
                page: 1,
                url: PLUGIN_NAME
            });
        });
        
        // Добавляем в меню
        var menuList = $(".menu .menu__list").eq(0);
        if (menuList.length) {
            menuList.append(menuItem);
            console.log('[Kinozal] Пункт меню добавлен');
        } else {
            // Если меню еще не загружено, ждем
            setTimeout(function() {
                $(".menu .menu__list").eq(0).append(menuItem);
            }, 1000);
        }
        
        console.log('[Kinozal] Плагин успешно инициализирован');
    }
    
    // Запускаем плагин
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                setTimeout(startPlugin, 1000); // Даем Lampa время на полную загрузку
            }
        });
    }
    
})();
