/*
  Объединённый плагин рейтингов для Lampa: MDBList + расширенные рейтинги/качество (OMDb, Кинопоиск, JacRed).
  Работает со всеми источниками, поддерживает настройки, кеш, качество, multi-language.
*/

(function() {
    'use strict';
    // -------------------------- ЛОКАЛИЗАЦИЯ --------------------------
    if (window.Lampa && Lampa.Lang) {
        Lampa.Lang.add({
            mdblist_api_key_desc: {
                ru: "Введите ваш API ключ с сайта MDBList.com",
                en: "Enter your API key from MDBList.com"
            },
            additional_ratings_title: {
                ru: "Дополнительные Рейтинги", 
                en: "Additional Ratings"
            },
            maxsm_ratings: {
                ru: 'Рейтинг и качество',
                en: 'Rating & Quality'
            },
            maxsm_ratings_cc: {
                ru: 'Очистить локальный кеш',
                en: 'Clear local cache'
            },
            maxsm_ratings_critic: {
                ru: 'Оценки критиков',
                en: 'Critic Ratings'
            },
            maxsm_ratings_mode: {
                ru: 'Средний рейтинг',
                en: 'Average rating'
            },
            maxsm_ratings_mode_normal: {
                ru: 'Показывать средний рейтинг',
                en: 'Show average rating'
            },
            maxsm_ratings_mode_simple: {
                ru: 'Только средний рейтинг',
                en: 'Only average rating'
            },
            maxsm_ratings_mode_noavg: {
                ru: 'Без среднего рейтинга',
                en: 'No average'
            },
            maxsm_ratings_icons: {
                ru: 'Значки',
                en: 'Icons'
            },
            maxsm_ratings_colors: {
                ru: 'Цвета',
                en: 'Colors'
            },
            maxsm_ratings_avg: {
                ru: 'ИТОГ',
                en: 'TOTAL'
            },
            maxsm_ratings_avg_simple: {
                ru: 'Оценка',
                en: 'Rating'
            },
            maxsm_ratings_loading: {
                ru: 'Загрузка',
                en: 'Loading'
            },
            maxsm_ratings_oscars: { 
                ru: 'Оскар',
                en: 'Oscar'
            },
            maxsm_ratings_emmy: {
                ru: 'Эмми',
                en: 'Emmy'
            },
            maxsm_ratings_awards: {
                ru: 'Награды',
                en: 'Awards'
            },
            maxsm_ratings_quality: {
                ru: 'Качество внутри карточек',
                en: 'Quality inside cards'
            },
            maxsm_ratings_quality_inlist: {
                ru: 'Качество на карточках',
                en: 'Quality on cards'
            },
            maxsm_ratings_quality_tv: {
                ru: 'Качество для сериалов',
                en: 'Quality for series'
            }
        });
    }

    // -------------------------- НАСТРОЙКИ --------------------------
    if (window.Lampa && Lampa.SettingsApi) {
        Lampa.SettingsApi.addComponent({
            component: "maxsm_ratings",
            name: Lampa.Lang.translate("maxsm_ratings"),
            icon: '<svg viewBox="5 5 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="white" stroke-width="2" d="M32 18.7461L36.2922 27.4159L46.2682 28.6834L38.9675 35.0577L40.9252 44.9166L32 39.7884L23.0748 44.9166L25.0325 35.0577L17.7318 28.6834L27.7078 27.4159L32 18.7461Z"></path></svg>'
        });

        var modeValue = {};
        modeValue[0] = Lampa.Lang.translate("maxsm_ratings_mode_normal");
        modeValue[1] = Lampa.Lang.translate("maxsm_ratings_mode_simple");
        modeValue[2] = Lampa.Lang.translate("maxsm_ratings_mode_noavg");

        var isPortrait = window.innerHeight > window.innerWidth;
        if (!isPortrait) {
            Lampa.SettingsApi.addParam({
                component: "maxsm_ratings",
                param: {
                    name: "maxsm_ratings_mode",
                    type: 'select',
                    values: modeValue,
                    default: 0
                },
                field: {
                    name: Lampa.Lang.translate("maxsm_ratings_mode"),
                    description: ''
                },
                onChange: function(value) {}
            });
        }

        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: {
                name: "maxsm_ratings_awards",
                type: "trigger",
                default: true
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_awards"),
                description: ''
            }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: {
                name: "maxsm_ratings_critic",
                type: "trigger",
                default: true
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_critic"),
                description: ''
            }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: {
                name: "maxsm_ratings_colors",
                type: "trigger",
                default: true
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_colors"),
                description: ''
            }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: {
                name: "maxsm_ratings_icons",
                type: "trigger",
                default: true
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_icons"),
                description: ''
            }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: {
                name: "maxsm_ratings_quality",
                type: "trigger",
                default: true
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_quality"),
                description: ''
            }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: {
                name: "maxsm_ratings_quality_inlist",
                type: "trigger",
                default: true
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_quality_inlist"),
                description: ''
            },
            onChange: function(value) {
                if (value === 'true') {
                    observer.observe(document.body, { childList: true, subtree: true });
                } else {
                    observer.disconnect();
                }
            }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: {
                name: "maxsm_ratings_quality_tv",
                type: "trigger",
                default: false
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_quality_tv"),
                description: ''
            }
        });
        Lampa.SettingsApi.addParam({
            component: 'maxsm_ratings',
            param: {
                name: 'maxsm_ratings_cc',
                type: 'button'
            },
            field: {
                name: Lampa.Lang.translate('maxsm_ratings_cc')
            },
            onChange: function() {
                localStorage.removeItem('maxsm_ratings_omdb_cache');
                localStorage.removeItem('maxsm_ratings_kp_cache');
                localStorage.removeItem('maxsm_ratings_id_mapping_cache');
                localStorage.removeItem('maxsm_ratings_quality_cache');
                window.location.reload();
            }
        });

        // MDBList API Key
        Lampa.SettingsApi.addComponent({
            component: 'additional_ratings',
            name: Lampa.Lang.translate('additional_ratings_title'),
            icon: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24" xml:space="preserve" width="32" height="32" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>'
        });
        Lampa.SettingsApi.addParam({
            component: 'additional_ratings',
            param: {
                name: 'mdblist_api_key',
                type: 'input',
                'default': '',
                values: {},
                placeholder: 'Enter your MDBList API Key'
            },
            field: {
                name: 'MDBList API Key',
                description: Lampa.Lang.translate('mdblist_api_key_desc')
            },
            onChange: function() {
                Lampa.Settings.update();
            }
        });
    }

    // -------------------------- MDBList FETCHER --------------------------
    var MDBLIST_CONFIG = {
        api_url: 'https://api.mdblist.com/tmdb/',
        cache_time: 60 * 60 * 12 * 1000,
        cache_key: 'mdblist_ratings_cache',
        cache_limit: 500,
        request_timeout: 10000
    };
    var network = (window.Lampa && Lampa.Reguest) ? new Lampa.Reguest() : null;
    function getCacheMDB(tmdb_id) {
        if (!window.Lampa || !Lampa.Storage) return false;
        var timestamp = new Date().getTime();
        var cache = Lampa.Storage.cache(MDBLIST_CONFIG.cache_key, MDBLIST_CONFIG.cache_limit, {});
        if (cache[tmdb_id]) {
            if ((timestamp - cache[tmdb_id].timestamp) > MDBLIST_CONFIG.cache_time) {
                delete cache[tmdb_id];
                Lampa.Storage.set(MDBLIST_CONFIG.cache_key, cache);
                return false;
            }
            return cache[tmdb_id].data;
        }
        return false;
    }
    function setCacheMDB(tmdb_id, data) {
        if (!window.Lampa || !Lampa.Storage) return;
        var timestamp = new Date().getTime();
        var cache = Lampa.Storage.cache(MDBLIST_CONFIG.cache_key, MDBLIST_CONFIG.cache_limit, {});
        cache[tmdb_id] = { timestamp: timestamp, data: data };
        Lampa.Storage.set(MDBLIST_CONFIG.cache_key, cache);
    }
    function fetchRatingsMDBList(movieData, callback) {
        if (!network) { callback({ error: "Network component unavailable" }); return; }
        if (!window.Lampa || !Lampa.Storage) { callback({ error: "Storage component unavailable" }); return; }
        if (!movieData || !movieData.id || !movieData.method || !callback) { callback({ error: "Invalid input data" }); return; }
        var tmdb_id = movieData.id;
        var cached_ratings = getCacheMDB(tmdb_id);
        if (cached_ratings) { callback(cached_ratings); return; }
        var apiKey = Lampa.Storage.get('mdblist_api_key');
        if (!apiKey) { callback({ error: "MDBList API Key not configured in Additional Ratings settings" }); return; }
        var media_type = movieData.method === 'tv' ? 'show' : 'movie';
        var api_url = MDBLIST_CONFIG.api_url + media_type + "/" + tmdb_id + "?apikey=" + apiKey;
        network.clear();
        network.timeout(MDBLIST_CONFIG.request_timeout);
        network.silent(api_url, function (response) {
            var ratingsResult = { error: null };
            if (response && response.ratings && Array.isArray(response.ratings)) {
                response.ratings.forEach(function(rating) {
                    if (rating.source && rating.value !== null) {
                        ratingsResult[rating.source] = rating.value;
                    }
                });
            } else if (response && response.error) {
                ratingsResult.error = "MDBList API Error: " + response.error;
            } else {
                ratingsResult.error = "Invalid response format from MDBList";
            }
            if (ratingsResult.error === null ||
                (ratingsResult.error && !ratingsResult.error.toLowerCase().includes("invalid api key"))) {
                setCacheMDB(tmdb_id, ratingsResult);
            }
            callback(ratingsResult);
        }, function (xhr, status) {
            var errorMessage = "MDBList request failed";
            if (status) { errorMessage += " (Status: " + status + ")"; }
            var errorResult = { error: errorMessage };
            if (status !== 401 && status !== 403) {
                setCacheMDB(tmdb_id, errorResult);
            }
            callback(errorResult);
        });
    }

    // -------------------------- OMDb + Кинопоиск + JacRed + Качество --------------------------
    var OMDB_CACHE = 'maxsm_ratings_omdb_cache';
    var KP_CACHE = 'maxsm_ratings_kp_cache';
    var ID_MAPPING_CACHE = 'maxsm_ratings_id_mapping_cache';
    var QUALITY_CACHE = 'maxsm_ratings_quality_cache';
    var OMDB_API_KEYS = ['18a1eec9', 'd3a7a896']; // ваши OMDb ключи
    var KP_API_KEYS = ['ae8d6b29-b4ea-4f44-ad64-e99cb243289a', '5421e2f6-e0ed-4c08-aee9-492334f88937'];
    var JACRED_PROTOCOL = 'https://';
    var JACRED_URL = 'parser.ruzha.ru';
    var JACRED_API_KEY = 'BCqr1JX01ISh';
    var PROXY_LIST = [
        'https://cors.bwa.workers.dev/',
        'https://api.allorigins.win/raw?url='
    ];
    var CACHE_TIME = 3 * 24 * 60 * 60 * 1000;
    var Q_CACHE_TIME = 24 * 60 * 60 * 1000;
    var AGE_RATINGS = {
        'G': '3+',
        'PG': '6+',
        'PG-13': '13+',
        'R': '17+',
        'NC-17': '18+',
        'TV-Y': '0+',
        'TV-Y7': '7+',
        'TV-G': '3+',
        'TV-PG': '6+',
        'TV-14': '14+',
        'TV-MA': '17+'
    };
    var WEIGHTS = { imdb: 0.35, tmdb: 0.15, kp: 0.20, mc: 0.15, rt: 0.15 };

    function getRandomToken(arr) {
        if (!arr || !arr.length) return '';
        return arr[Math.floor(Math.random() * arr.length)];
    }
    function parseAwards(awardsText) {
        if (typeof awardsText !== 'string') return null;
        var result = { oscars: 0, awards: 0 };
        var oscarMatch = awardsText.match(/Won (\d+) Oscars?/i);
        if (oscarMatch && oscarMatch[1]) result.oscars = parseInt(oscarMatch[1], 10);
        var emmyMatch = awardsText.match(/Won (\d+) Primetime Emmys?/i);
        if (emmyMatch && emmyMatch[1]) result.emmy = parseInt(emmyMatch[1], 10);
        var otherMatch = awardsText.match(/Another (\d+) wins?/i);
        if (otherMatch && otherMatch[1]) result.awards = parseInt(otherMatch[1], 10);
        if (result.awards === 0) {
            var simpleMatch = awardsText.match(/(\d+) wins?/i);
            if (simpleMatch && simpleMatch[1]) result.awards = parseInt(simpleMatch[1], 10);
        }
        return result;
    }
    function fetchWithProxy(url, callback) {
        var currentProxy = 0, callbackCalled = false;
        function tryNextProxy() {
            if (currentProxy >= PROXY_LIST.length) {
                if (!callbackCalled) { callbackCalled = true; callback(new Error('All proxies failed')); }
                return;
            }
            var proxyUrl = PROXY_LIST[currentProxy] + encodeURIComponent(url);
            var timeoutId = setTimeout(function() {
                if (!callbackCalled) { currentProxy++; tryNextProxy(); }
            }, 5000);
            fetch(proxyUrl)
                .then(function(response) { clearTimeout(timeoutId); if (!response.ok) throw new Error('Proxy error: ' + response.status); return response.text(); })
                .then(function(data) { if (!callbackCalled) { callbackCalled = true; clearTimeout(timeoutId); callback(null, data); } })
                .catch(function() { clearTimeout(timeoutId); if (!callbackCalled) { currentProxy++; tryNextProxy(); } });
        }
        tryNextProxy();
    }
    function getKPRatings(normalizedCard, apiKey, callback) {
        if (normalizedCard.kinopoisk_id) return fetchRatings(normalizedCard.kinopoisk_id);
        var queryTitle = (normalizedCard.original_title || normalizedCard.title || '').replace(/[:\-–—]/g, ' ').trim();
        var year = '';
        if (normalizedCard.release_date && typeof normalizedCard.release_date === 'string') {
            year = normalizedCard.release_date.split('-')[0];
        }
        if (!year) { callback(null); return; }
        var encodedTitle = encodeURIComponent(queryTitle);
        var searchUrl = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodedTitle;
        fetch(searchUrl, {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) { if (!response.ok) throw new Error('HTTP error: ' + response.status); return response.json(); })
        .then(function(data) {
            if (!data.films || !data.films.length) { callback(null); return; }
            var bestMatch = null;
            for (var j = 0; j < data.films.length; j++) {
                var film2 = data.films[j];
                if (!film2.year) continue;
                var filmYear = parseInt(film2.year.substring(0, 4), 10);
                var targetYear = parseInt(year, 10);
                if (isNaN(filmYear)) continue;
                if (isNaN(targetYear)) continue;
                if (filmYear === targetYear) { bestMatch = film2; break; }
            }
            if (!bestMatch) {
                for (var k = 0; k < data.films.length; k++) {
                    var film2 = data.films[k];
                    if (!film2.year) continue;
                    var filmYear = parseInt(film2.year.substring(0, 4), 10);
                    var targetYear = parseInt(year, 10);
                    if (isNaN(filmYear)) continue;
                    if (isNaN(targetYear)) continue;
                    if (Math.abs(filmYear - targetYear) <= 1) { bestMatch = film2; break; }
                }
            }
            if (!bestMatch || !bestMatch.filmId) { callback(null); return; }
            fetchRatings(bestMatch.filmId);
        })
        .catch(function() { callback(null); });
        function fetchRatings(filmId) {
            var xmlUrl = 'https://rating.kinopoisk.ru/' + filmId + '.xml';
            fetchWithProxy(xmlUrl, function(error, xmlText) {
                if (!error && xmlText) {
                    try {
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(xmlText, "text/xml");
                        var kpRatingNode = xmlDoc.getElementsByTagName("kp_rating")[0];
                        var imdbRatingNode = xmlDoc.getElementsByTagName("imdb_rating")[0];
                        var kpRating = kpRatingNode ? parseFloat(kpRatingNode.textContent) : null;
                        var imdbRating = imdbRatingNode ? parseFloat(imdbRatingNode.textContent) : null;
                        var hasValidKp = !isNaN(kpRating) && kpRating > 0;
                        var hasValidImdb = !isNaN(imdbRating) && imdbRating > 0;
                        if (hasValidKp || hasValidImdb) {
                            return callback({
                                kinopoisk: hasValidKp ? kpRating : null,
                                imdb: hasValidImdb ? imdbRating : null
                            });
                        }
                    } catch (e) {}
                }
                fetch('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + filmId, {
                    headers: { 'X-API-KEY': apiKey }
                })
                .then(function(response) { if (!response.ok) throw new Error('API error'); return response.json(); })
                .then(function(data) {
                    callback({
                        kinopoisk: data.ratingKinopoisk || null,
                        imdb: data.ratingImdb || null
                    });
                })
                .catch(function() { callback(null); });
            });
        }
    }
    function getOmdbCache(key) {
        var cache = Lampa.Storage.get(OMDB_CACHE) || {};
        var item = cache[key];
        return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null;
    }
    function saveOmdbCache(key, data) {
        var cache = Lampa.Storage.get(OMDB_CACHE) || {};
        cache[key] = { 
            rt: data.rt,
            mc: data.mc,
            imdb: data.imdb,
            ageRating: data.ageRating,
            oscars: data.oscars || null,
            emmy: data.emmy || null,
            awards: data.awards || null,
            timestamp: Date.now() 
        };
        Lampa.Storage.set(OMDB_CACHE, cache);
    }
    function getKpCache(key) {
        var cache = Lampa.Storage.get(KP_CACHE) || {};
        var item = cache[key];
        return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null;
    }
    function saveKpCache(key, data) {
        var cache = Lampa.Storage.get(KP_CACHE) || {};
        cache[key] = {
            kp: data.kp || null,
            imdb: data.imdb || null,
            timestamp: Date.now()
        };
        Lampa.Storage.set(KP_CACHE, cache);
    }
    function getQualityCache(key) {
        var cache = Lampa.Storage.get(QUALITY_CACHE) || {};
        var item = cache[key];
        return item && (Date.now() - item.timestamp < Q_CACHE_TIME) ? item : null;
    }
    function saveQualityCache(key, data) {
        var cache = Lampa.Storage.get(QUALITY_CACHE) || {};
        cache[key] = {
            quality: data.quality || null,
            timestamp: Date.now()
        };
        Lampa.Storage.set(QUALITY_CACHE, cache); 
    }
    function getImdbIdFromTmdb(tmdbId, type, callback) {
        if (!tmdbId) return callback(null);
        var cleanType = type === 'movie' ? 'movie' : 'tv';
        var cacheKey = cleanType + '_' + tmdbId;
        var cache = Lampa.Storage.get(ID_MAPPING_CACHE) || {};
        if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TIME)) {
            return callback(cache[cacheKey].imdb_id);
        }
        var mainPath = cleanType + '/' + tmdbId + '/external_ids?api_key=' + Lampa.TMDB.key();
        var mainUrl = Lampa.TMDB.api(mainPath);
        new Lampa.Reguest().silent(mainUrl, function(data) {
            if (data && data.imdb_id) {
                cache[cacheKey] = { imdb_id: data.imdb_id, timestamp: Date.now() };
                Lampa.Storage.set(ID_MAPPING_CACHE, cache);
                callback(data.imdb_id);
            } else {
                if (cleanType === 'tv') {
                    var altPath = 'tv/' + tmdbId + '?api_key=' + Lampa.TMDB.key();
                    var altUrl = Lampa.TMDB.api(altPath);
                    new Lampa.Reguest().silent(altUrl, function(altData) {
                        var imdbId = (altData && altData.external_ids && altData.external_ids.imdb_id) || null;
                        if (imdbId) {
                            cache[cacheKey] = { imdb_id: imdbId, timestamp: Date.now() };
                            Lampa.Storage.set(ID_MAPPING_CACHE, cache);
                        }
                        callback(imdbId);
                    }, function() { callback(null); });
                } else {
                    callback(null);
                }
            }
        }, function(xhr) { callback(null); });
    }
    function fetchOmdbRatings(card, cacheKey, callback) {
        if (!card.imdb_id) { callback(null); return; }
        var url = 'https://www.omdbapi.com/?apikey=' + getRandomToken(OMDB_API_KEYS) + '&i=' + card.imdb_id;
        new Lampa.Reguest().silent(url, function(data) {
            if (data && data.Response === 'True' && (data.Ratings || data.imdbRating)) {
                var parsedAwards = parseAwards(data.Awards || '');
                callback({
                    rt: extractRating(data.Ratings, 'Rotten Tomatoes'),
                    mc: extractRating(data.Ratings, 'Metacritic'),
                    imdb: data.imdbRating || null,
                    ageRating: data.Rated || null,
                    oscars: parsedAwards.oscars,
                    emmy: parsedAwards.emmy,
                    awards: parsedAwards.awards
                });
            } else {
                callback(null);
            }
        }, function() { callback(null); });
    }
    function extractRating(ratings, source) {
        if (!ratings || !Array.isArray(ratings)) return null;
        for (var i = 0; i < ratings.length; i++) {
            if (ratings[i].Source === source) {
                try {
                    return source === 'Rotten Tomatoes' 
                        ? parseFloat(ratings[i].Value.replace('%', '')) 
                        : parseFloat(ratings[i].Value.split('/')[0]);
                } catch(e) { return null; }
            }
        }
        return null;
    }
    // -------------- JacRed Качество (упрощённо) -----------------
    function getBestReleaseFromJacred(normalizedCard, callback) {
        var MAX_QUALITY = 2160;
        var stopWords = ['camrip', 'камрип', 'ts', 'telecine', 'telesync', 'telesynch', 'upscale', 'tc', 'тс'];
        var stopWordsPatterns = null;
        function translateQuality(quality) {
            switch(quality) {
                case 2160: return '4K';
                case 1080: return 'FHD';
                case 720: return 'HD';
                case 'TS': return 'TS';
                default: return quality >= 720 ? 'HD' : 'SD';
            }
        }
        function hasLetters(str) { return /[a-zа-яё]/i.test(str || ''); }
        function onlyDigits(str) { return /^\d+$/.test(str); }
        function isScreenCopy(title) {
            if (!title) return false;
            var lower = title.toLowerCase();
            if (stopWordsPatterns === null) { stopWordsPatterns = stopWords.map(function(word) { return new RegExp('\\b' + word + '\\b', 'i'); }); }
            for (var i = 0; i < stopWordsPatterns.length; i++) {
                if (stopWordsPatterns[i].test(lower)) { return true; }
            }
            return false;
        }
        var year = '';
        var dateStr = normalizedCard.release_date || '';
        if (dateStr.length >= 4) { year = dateStr.substring(0, 4); }
        if (!year || isNaN(year)) { callback(null); return; }
        var uid = Lampa.Storage.get('lampac_unic_id', '');
        var apiUrl = JACRED_PROTOCOL + JACRED_URL + '/api/v2.0/indexers/all/results?' +
            'apikey=' + JACRED_API_KEY +
            '&uid=' + uid +
            '&year=' + year;
        var hasTitle = false;
        if (normalizedCard.title && (hasLetters(normalizedCard.title) || onlyDigits(normalizedCard.title))) {
            apiUrl += '&title=' + encodeURIComponent(normalizedCard.title.trim());
            hasTitle = true;
        }
        if (normalizedCard.original_title && (hasLetters(normalizedCard.original_title) || onlyDigits(normalizedCard.original_title))) {
            apiUrl += '&title_original=' + encodeURIComponent(normalizedCard.original_title.trim());
            hasTitle = true;
        }
        if (!hasTitle) { callback(null); return; }
        new Lampa.Reguest().silent(apiUrl, function(response) {
            if (!response) { callback(null); return; }
            try {
                var data = typeof response === 'string' ? JSON.parse(response) : response;
                var torrents = data.Results || [];
                if (!Array.isArray(torrents)) { torrents = []; }
                if (torrents.length === 0) { callback(null); return; }
                var bestQuality = -1, bestTorrent = null, findStopWords = false;
                var searchYearNum = parseInt(year, 10);
                var prevYear = searchYearNum - 1;
                for (var i = 0; i < torrents.length; i++) {
                    var t = torrents[i];
                    var info = t.info || t.Info || {};
                    var usedQuality = info.quality;
                    var usedYear = info.relased;
                    var titleForCheck = t.Title || '';
                    if (typeof usedQuality !== 'number' || usedQuality === 0) { continue; }
                    var yearValid = false, parsedYear = 0;
                    if (usedYear && !isNaN(usedYear)) { parsedYear = parseInt(usedYear, 10); if (parsedYear > 1900) { yearValid = true; } }
                    if (!yearValid) { continue; }
                    if (parsedYear !== searchYearNum && parsedYear !== prevYear) { continue; }
                    if (isScreenCopy(titleForCheck)) { findStopWords = true; continue; }
                    if (usedQuality === MAX_QUALITY) {
                        callback({ quality: translateQuality(usedQuality), title: titleForCheck });
                        return;
                    }
                    if (usedQuality > bestQuality) {
                        bestQuality = usedQuality;
                        bestTorrent = { title: titleForCheck, quality: usedQuality, year: parsedYear };
                    }
                }
                if (bestTorrent) {
                    var translatedQuality = translateQuality(bestTorrent.quality);
                    callback({ quality: translatedQuality, title: bestTorrent.title });
                } else if (findStopWords) {
                    callback({ quality: translateQuality('TS'), title: "NOT SAVED" });
                } else {
                    callback(null);
                }
            } catch (e) { callback(null); }
        });
    }

    // -------------- ОБРАБОТКА КАРТОЧЕК --------------
    function getCardType(card) {
        var type = card.media_type || card.type;
        if (type === 'movie' || type === 'tv') return type;
        return card.name || card.original_name ? 'tv' : 'movie';
    }
    function fetchAdditionalRatings(card, render) {
        if (!render) return;
        var normalizedCard = {
            id: card.id,
            tmdb: card.vote_average || null,
            kinopoisk_id: card.kinopoisk_id,
            imdb_id: card.imdb_id || card.imdb || null,
            title: card.title || card.name || '',
            original_title: card.original_title || card.original_name || '',
            type: getCardType(card),
            release_date: card.release_date || card.first_air_date || ''
        };
        var cacheKey = normalizedCard.type + '_' + (normalizedCard.imdb_id || normalizedCard.id);
        var qCacheKey = normalizedCard.type + '_' + (normalizedCard.id || normalizedCard.imdb_id);
        var ratingsData = {};
        var cachedData = getOmdbCache(cacheKey);
        var cachedKpData = getKpCache(cacheKey);
        var cacheQualityData = getQualityCache(qCacheKey);
        // КАЧЕСТВО
        if (localStorage.getItem('maxsm_ratings_quality') === 'true' && !(localStorage.getItem('maxsm_ratings_quality_tv') === 'false' && normalizedCard.type === 'tv')) {
            if (cacheQualityData) {
                updateQualityElement(cacheQualityData.quality, render);
            } else {
                fetchQualitySequentially(normalizedCard, qCacheKey, render);
            }
        }
        // Кинопоиск
        if (cachedKpData) {
            ratingsData.kp = cachedKpData.kp;
            ratingsData.imdb_kp = cachedKpData.imdb;
            processNextStep();
        } else {
            getKPRatings(normalizedCard, getRandomToken(KP_API_KEYS), function(kpRatings) {
                if (kpRatings) {
                    if (kpRatings.kinopoisk) ratingsData.kp = kpRatings.kinopoisk;
                    if (kpRatings.imdb) ratingsData.imdb_kp = kpRatings.imdb;
                    saveKpCache(cacheKey, { kp: kpRatings.kinopoisk, imdb: kpRatings.imdb });
                }
                processNextStep();
            });
            return;
        }
        function processNextStep() {
            updateHiddenElements(ratingsData, render);
            // OMDb
            if (cachedData) {
                ratingsData.rt = cachedData.rt;
                ratingsData.mc = cachedData.mc;
                ratingsData.imdb = cachedData.imdb;
                ratingsData.ageRating = cachedData.ageRating;
                ratingsData.oscars = cachedData.oscars;
                ratingsData.emmy = cachedData.emmy;
                ratingsData.awards = cachedData.awards;
                updateUI();
            } else if (normalizedCard.imdb_id) {
                fetchOmdbRatings(normalizedCard, cacheKey, function(omdbData) {
                    if (omdbData) {
                        ratingsData.rt = omdbData.rt;
                        ratingsData.mc = omdbData.mc;
                        ratingsData.imdb = omdbData.imdb;
                        ratingsData.ageRating = omdbData.ageRating;
                        ratingsData.oscars = omdbData.oscars;
                        ratingsData.emmy = omdbData.emmy;
                        ratingsData.awards = omdbData.awards;
                        saveOmdbCache(cacheKey, omdbData);
                    }
                    updateUI();
                });
            } else {
                getImdbIdFromTmdb(normalizedCard.id, normalizedCard.type, function(newImdbId) {
                    if (newImdbId) {
                        normalizedCard.imdb_id = newImdbId;
                        fetchOmdbRatings(normalizedCard, cacheKey, function(omdbData) {
                            if (omdbData) {
                                ratingsData.rt = omdbData.rt;
                                ratingsData.mc = omdbData.mc;
                                ratingsData.imdb = omdbData.imdb;
                                ratingsData.ageRating = omdbData.ageRating;
                                ratingsData.oscars = omdbData.oscars;
                                ratingsData.emmy = omdbData.emmy;
                                ratingsData.awards = omdbData.awards;
                                saveOmdbCache(cacheKey, omdbData);
                            }
                            updateUI();
                        });
                    } else {
                        updateUI();
                    }
                });
            }
        }
        function updateUI() {
            updateHiddenElements(ratingsData, render);
            calculateAverageRating(render);
        }
    }
    function updateHiddenElements(ratings, render) {
        if (!render) return;
        var pgElement = $('.full-start__pg.hide', render);
        if (pgElement.length && ratings.ageRating) {
            var invalidRatings = ['N/A', 'Not Rated', 'Unrated', 'NR'];
            var isValid = invalidRatings.indexOf(ratings.ageRating) === -1;
            if (isValid) {
                var localizedRating = AGE_RATINGS[ratings.ageRating] || ratings.ageRating;
                pgElement.removeClass('hide').text(localizedRating);
            }
        }
        var imdbElement = $('.rate--imdb', render);
        if (imdbElement.length) {
            var imdbRating;
            if (ratings.imdb && !isNaN(ratings.imdb)) {
                imdbRating = parseFloat(ratings.imdb).toFixed(1);
                imdbElement.removeClass('hide').find('> div').eq(0).text(imdbRating);
            }
            else if (ratings.imdb_kp && !isNaN(ratings.imdb_kp)) {
                imdbRating = parseFloat(ratings.imdb_kp).toFixed(1);
                imdbElement.removeClass('hide').find('> div').eq(0).text(imdbRating);
            }
        }
        var kpElement = $('.rate--kp', render);
        if (kpElement.length && ratings.kp && !isNaN(ratings.kp)) {
            var kpRating = parseFloat(ratings.kp).toFixed(1);
            kpElement.removeClass('hide').find('> div').eq(0).text(kpRating);
        }
    }
    function updateQualityElement(quality, render) {
        if (!render) return;
        var element = $('.full-start__status.maxsm-quality', render);
        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length) return;
        if (element.length) {
            element.text(quality).css('opacity', '1');
        } else {
            var div = document.createElement('div');
            div.className = 'full-start__status maxsm-quality';
            div.textContent = quality;
            rateLine.append(div);
        }
    }
    function fetchQualitySequentially(normalizedCard, qCacheKey, render) {
        getBestReleaseFromJacred(normalizedCard, function(jrResult) {
            var quality = (jrResult && jrResult.quality) || null;
            if (quality && quality !== 'NO') {
                saveQualityCache(qCacheKey, { quality: quality });
                updateQualityElement(quality, render);
                return;
            }
        });
    }
    function calculateAverageRating(render) {
        if (!render) return;
        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length) return;
        var ratings = {
            imdb: parseFloat($('.rate--imdb div:first', rateLine).text()) || 0,
            tmdb: parseFloat($('.rate--tmdb div:first', rateLine).text()) || 0,
            kp: parseFloat($('.rate--kp div:first', rateLine).text()) || 0,
            mc: (parseFloat($('.rate--mc div:first', rateLine).text()) || 0) / 10,
            rt: (parseFloat($('.rate--rt div:first', rateLine).text()) || 0) / 10
        };
        var totalWeight = 0;
        var weightedSum = 0;
        var ratingsCount = 0;
        for (var key in ratings) {
            if (ratings.hasOwnProperty(key) && !isNaN(ratings[key]) && ratings[key] > 0) {
                weightedSum += ratings[key] * WEIGHTS[key];
                totalWeight += WEIGHTS[key];
                ratingsCount++;
            }
        }
        $('.rate--avg', rateLine).remove();
        var mode = parseInt(localStorage.getItem('maxsm_ratings_mode'), 10);
        var isPortrait = window.innerHeight > window.innerWidth;
        if (isPortrait) mode = 1;
        if (totalWeight > 0 && (ratingsCount > 1 ||  mode === 1)) {
            var averageRating = ( weightedSum / totalWeight ).toFixed(1);
            var avgLabel = Lampa.Lang.translate("maxsm_ratings_avg");
            if (mode === 1) {
                avgLabel = Lampa.Lang.translate("maxsm_ratings_avg_simple");
                $('.full-start__rate', rateLine).not('.rate--oscars, .rate--avg, .rate--awards').hide();
            } 
            var avgElement = $(
                '<div class="full-start__rate rate--avg">' +
                    '<div>' + averageRating + '</div>' +
                    '<div class="source--name">' + avgLabel + '</div>' +
                '</div>'
            );
            $('.full-start__rate:first', rateLine).before(avgElement);
        }
    }
    function updateCards(cards) {
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            if (card.hasAttribute('data-quality-added')) continue;
            var cardView = card.querySelector('.card__view');
            if (localStorage.getItem('maxsm_ratings_quality_tv') === 'false') {
                if (cardView) {
                    var typeElements = cardView.getElementsByClassName('card__type');
                    if (typeElements.length > 0) continue;
                }
            }
            (function(currentCard) {
                var data = currentCard.card_data;
                if (!data) return;
                var normalizedCard = {
                    id: data.id || '',
                    title: data.title || data.name || '',
                    original_title: data.original_title || data.original_name || '',
                    release_date: data.release_date || data.first_air_date || '',
                    imdb_id: data.imdb_id || data.imdb || null,
                    type: getCardType(data)
                };     
                var qCacheKey = normalizedCard.type + '_' + (normalizedCard.id || normalizedCard.imdb_id); 
                var cacheQualityData = getQualityCache(qCacheKey); 
                if (cacheQualityData) {
                    applyQualityToCard(currentCard, cacheQualityData.quality, 'Cache');
                } else {
                    applyQualityToCard(currentCard, '...', 'Pending');
                    getBestReleaseFromJacred(normalizedCard, function(jrResult) {
                        var quality = (jrResult && jrResult.quality) || null;
                        applyQualityToCard(currentCard, quality, 'JacRed', qCacheKey);
                    });
                }
            })(card);
        }
    }
    function applyQualityToCard(card, quality, source, qCacheKey) {
        if (!document.body.contains(card)) return;
        card.setAttribute('data-quality-added', 'true');
        var cardView = card.querySelector('.card__view');
        var qualityElements = null;
        if (source === 'JacRed' && quality && quality !== 'NO') {
            saveQualityCache(qCacheKey, { quality: quality });
        }
        if (quality && quality !== 'NO') {
            if (cardView) {
                var hasQuality = false;
                qualityElements = cardView.getElementsByClassName('card__quality');
                if (qualityElements.length > 0) hasQuality = true;
                var qualityDiv, qualityInner;
                if (!hasQuality) {
                    qualityDiv = document.createElement('div');
                    qualityDiv.className = 'card__quality';
                    qualityInner = document.createElement('div');
                    qualityInner.textContent = quality;
                    qualityDiv.appendChild(qualityInner);
                    cardView.appendChild(qualityDiv);
                } else {
                    qualityDiv = qualityElements[0];
                    var innerElement = qualityDiv.firstElementChild;
                    if (innerElement) {
                        innerElement.textContent = quality;
                    } else {
                        qualityInner = document.createElement('div');
                        qualityInner.textContent = quality;
                        qualityDiv.innerHTML = '';
                        qualityDiv.appendChild(qualityInner);
                    }
                }
            }
        } else {
            if (cardView) {
                qualityElements = cardView.getElementsByClassName('card__quality');
                var elementsToRemove = [];
                for (var j = 0; j < qualityElements.length; j++) {
                    elementsToRemove.push(qualityElements[j]);
                }
                for (var k = 0; k < elementsToRemove.length; k++) {
                    var el = elementsToRemove[k];
                    if (el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                }
            }
        }
    }
    // -------------------------- OBSERVER --------------------------
    var observer = new MutationObserver(function(mutations) {
        var newCards = [];
        for (var m = 0; m < mutations.length; m++) {
            var mutation = mutations[m];
            if (mutation.addedNodes) {
                for (var j = 0; j < mutation.addedNodes.length; j++) {
                    var node = mutation.addedNodes[j];
                    if (node.nodeType !== 1) continue;
                    if (node.classList && node.classList.contains('card')) {
                        newCards.push(node);
                    }
                    var nestedCards = node.querySelectorAll('.card');
                    for (var k = 0; k < nestedCards.length; k++) {
                        newCards.push(nestedCards[k]);
                    }
                }
            }
        }
        if (newCards.length) updateCards(newCards);
    });

    // -------------------------- ИНИЦИАЛИЗАЦИЯ --------------------------
    if (!window.maxsmRatingsPlugin) {
        if (!localStorage.getItem('maxsm_ratings_awards')) localStorage.setItem('maxsm_ratings_awards', 'true');
        if (!localStorage.getItem('maxsm_ratings_critic')) localStorage.setItem('maxsm_ratings_critic', 'true');
        if (!localStorage.getItem('maxsm_ratings_colors')) localStorage.setItem('maxsm_ratings_colors', 'true');
        if (!localStorage.getItem('maxsm_ratings_icons')) localStorage.setItem('maxsm_ratings_icons', 'true');
        if (!localStorage.getItem('maxsm_ratings_mode')) localStorage.setItem('maxsm_ratings_mode', '0');
        if (!localStorage.getItem('maxsm_ratings_quality')) localStorage.setItem('maxsm_ratings_quality', 'true');
        if (!localStorage.getItem('maxsm_ratings_quality_inlist')) localStorage.setItem('maxsm_ratings_quality_inlist', 'true');
        if (!localStorage.getItem('maxsm_ratings_quality_tv')) localStorage.setItem('maxsm_ratings_quality_tv', 'false');
        window.maxsmRatingsPlugin = true;
        if (localStorage.getItem('maxsm_ratings_quality_inlist') === 'true') {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            var render = e.object.activity.render();
            fetchAdditionalRatings(e.data.movie, render);
        }
    });
})();
