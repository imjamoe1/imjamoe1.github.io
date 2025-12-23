(function () {
    'use strict';

    Lampa.Platform.tv();
    
    // Проверяем версию Lampa
    if (Lampa.Manifest.app_digital >= 300) {
        // Для версии 3.0+ используем новый API
        (function() {
            'use strict';
            
            if (window.plugin_interface_ready_v3) {
                return;
            }
            window.plugin_interface_ready_v3 = true;

            // --- Fetcher Configuration ---
            var config = {
                api_url: 'https://api.mdblist.com/tmdb/',
                cache_time: 60 * 60 * 12 * 1000,
                cache_key: 'mdblist_ratings_cache',
                cache_limit: 500,
                request_timeout: 10000,
                kp_api_url: 'https://kinopoiskapiunofficial.tech/',
                kp_rating_url: 'https://rating.kinopoisk.ru/',
                kp_api_key: '2a4a0808-81a3-40ae-b0d3-e11335ede616',
                xml_timeout: 5000
            };

            // --- Language Strings ---
            Lampa.Lang.add({
                mdblist_api_key_desc: {
                    ru: "Введите ваш API ключ с сайта MDBList.com",
                    en: "Enter your API key from MDBList.com",
                    uk: "Введіть ваш API ключ з сайту MDBList.com"
                },
                additional_ratings_title: {
                    ru: "Дополнительные Рейтинги", 
                    en: "Additional Ratings",
                    uk: "Додаткові Рейтинги"
                },
                select_ratings_button_name: {
                    en: "Select Rating Providers",
                    ru: "Выбрать Источники Рейтингов",
                    uk: "Обрати Джерела Рейтингів"
                },
                select_ratings_button_desc: {
                    en: "Choose which ratings to display",
                    ru: "Выберите, какие рейтинги отображать",
                    uk: "Оберіть, які рейтинги відображати"
                },
                select_ratings_dialog_title: {
                    en: "Select Ratings",
                    ru: "Выбор Рейтингов",
                    uk: "Вибір Рейтингів"
                },
                full_notext: { 
                    en: 'No description', 
                    ru: 'Нет описания',
                    uk: 'Немає опису'
                }
            });

            // --- Caching Functions ---
            function getCache(tmdb_id) {
                if (!window.Lampa || !Lampa.Storage) return false;
                var timestamp = new Date().getTime();
                var cache = Lampa.Storage.cache(config.cache_key, config.cache_limit, {});

                if (cache[tmdb_id]) {
                    if ((timestamp - cache[tmdb_id].timestamp) > config.cache_time) {
                        delete cache[tmdb_id];
                        Lampa.Storage.set(config.cache_key, cache);
                        return false;
                    } 
                    return cache[tmdb_id].data;
                }
                return false;
            }

            function setCache(tmdb_id, data) {
                if (!window.Lampa || !Lampa.Storage) return;
                var timestamp = new Date().getTime();
                var cache = Lampa.Storage.cache(config.cache_key, config.cache_limit, {});
                cache[tmdb_id] = {
                    timestamp: timestamp,
                    data: data
                };
                Lampa.Storage.set(config.cache_key, cache);
            }

            // --- Kinopoisk Caching ---
            function getKPCache(tmdb_id) {
                if (!window.Lampa || !window.Lampa.Storage) return false;
                var timestamp = new Date().getTime();
                var cache = Lampa.Storage.cache('kp_ratings_cache', config.cache_limit, {});
                if (cache[tmdb_id]) {
                    if ((timestamp - cache[tmdb_id].timestamp) > config.cache_time) {
                        delete cache[tmdb_id];
                        Lampa.Storage.set('kp_ratings_cache', cache);
                        return false;
                    }
                    return cache[tmdb_id];
                }
                return false;
            }

            function setKPCache(tmdb_id, data) {
                if (!window.Lampa || !window.Lampa.Storage) return;
                var timestamp = new Date().getTime();
                var cache = Lampa.Storage.cache('kp_ratings_cache', config.cache_limit, {});
                data.timestamp = timestamp;
                cache[tmdb_id] = data;
                Lampa.Storage.set('kp_ratings_cache', cache);
            }

            // --- Helper Functions for Kinopoisk ---
            function cleanTitle(str) {
                return (str || '').replace(/[\s.,:;'`!?]+/g, ' ').trim();
            }

            function kpCleanTitle(str) {
                return cleanTitle(str).replace(/^[ \/\\]+/, '').replace(/[ \/\\]+$/, '').replace(/\+( *[+\/\\])+/g, '+').replace(/([+\/\\] *)+\+/g, '+').replace(/( *[\/\\]+ *)+/g, '+');
            }

            function normalizeTitle(str) {
                return cleanTitle((str || '').toLowerCase().replace(/[\-\u2010-\u2015\u2E3A\u2E3B\uFE58\uFE63\uFF0D]+/g, '-').replace(/ё/g, 'е'));
            }

            function equalTitle(t1, t2) {
                return typeof t1 === 'string' && typeof t2 === 'string' && normalizeTitle(t1) === normalizeTitle(t2);
            }

            function containsTitle(str, title) {
                return typeof str === 'string' && typeof title === 'string' && normalizeTitle(str).indexOf(normalizeTitle(title)) !== -1;
            }

            // --- Core Fetching Logic ---
            function fetchRatings(movieData, callback) {
                var network = new Lampa.Reguest();
                if (!network) {
                    if (callback) callback({ error: "Network component unavailable" });
                    return;
                }
                if (!window.Lampa || !Lampa.Storage) {
                    if (callback) callback({ error: "Storage component unavailable" });
                    return;
                }

                if (!movieData || !movieData.id || !callback) {
                    if (callback) callback({ error: "Invalid input data" });
                    return;
                }

                var tmdb_id = movieData.id;
                var cached_ratings = getCache(tmdb_id);
                if (cached_ratings) {
                    callback(cached_ratings);
                    return;
                }

                var apiKey = Lampa.Storage.get('mdblist_api_key');
                if (!apiKey) {
                    callback({ error: "MDBList API Key not configured in Additional Ratings settings" });
                    return;
                }

                var media_type = movieData.media_type === 'tv' || movieData.name ? 'show' : 'movie';
                var api_url = config.api_url + media_type + "/" + tmdb_id + "?apikey=" + apiKey;

                network.clear();
                network.timeout(config.request_timeout);
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

                    if (ratingsResult.error === null || (ratingsResult.error && !ratingsResult.error.toLowerCase().includes("invalid api key"))) {
                        setCache(tmdb_id, ratingsResult);
                    }
                    callback(ratingsResult);

                }, function (xhr, status) {
                    var errorMessage = "MDBList request failed";
                    if (status) { errorMessage += " (Status: " + status + ")"; }
                    var errorResult = { error: errorMessage };

                    if (status !== 401 && status !== 403) {
                        setCache(tmdb_id, errorResult);
                    }
                    callback(errorResult);
                });
            }

            // --- Kinopoisk Fetching Logic ---
            function fetchKPRatings(movieData, callback) {
                var network = new Lampa.Reguest();
                if (!network) {
                    console.error("KinopoiskFetcher: Lampa.Reguest not available.");
                    if (callback) callback({ kp: 0, error: "Network unavailable" });
                    return;
                }
                
                if (!movieData || !movieData.id || !movieData.title || !callback) {
                    console.error("KinopoiskFetcher: Invalid input data or missing callback.");
                    if (callback) callback({ kp: 0, error: "Invalid input" });
                    return;
                }

                var tmdb_id = movieData.id;

                var cached_ratings = getKPCache(tmdb_id);
                if (cached_ratings) {
                    callback(cached_ratings);
                    return;
                }

                var clean_title = kpCleanTitle(movieData.title);
                var search_date = movieData.release_date || movieData.first_air_date || '0000';
                var search_year = parseInt((search_date + '').slice(0, 4));
                var orig_title = movieData.original_title || movieData.original_name;
                var imdb_id_from_tmdb = movieData.imdb_id;

                searchFilmOnKP();

                function searchFilmOnKP() {
                    var base_url = config.kp_api_url;
                    var headers = { 'X-API-KEY': config.kp_api_key };
                    var url_by_title = base_url + 'api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(clean_title);
                    var search_url;

                    if (imdb_id_from_tmdb) {
                        search_url = base_url + 'api/v2.2/films?imdbId=' + encodeURIComponent(imdb_id_from_tmdb);
                    } else {
                        search_url = url_by_title;
                    }

                    network.clear();
                    network.timeout(config.request_timeout);
                    network.silent(search_url, function (json) {
                        var items = [];
                        if (json.items && json.items.length) items = json.items;
                        else if (json.films && json.films.length) items = json.films;

                        if (!items.length && search_url !== url_by_title) {
                            network.clear();
                            network.timeout(config.request_timeout);
                            network.silent(url_by_title, function (json_title) {
                                if (json_title.items && json_title.items.length) chooseFilmFromKP(json_title.items);
                                else if (json_title.films && json_title.films.length) chooseFilmFromKP(json_title.films);
                                else chooseFilmFromKP([]);
                            }, function (a, c) { handleFinalError("Title search failed"); }, false, { headers: headers });
                        } else {
                            chooseFilmFromKP(items);
                        }
                    }, function (a, c) {
                        if (search_url !== url_by_title) {
                            network.clear();
                            network.timeout(config.request_timeout);
                            network.silent(url_by_title, function (json_title) {
                                if (json_title.items && json_title.items.length) chooseFilmFromKP(json_title.items);
                                else if (json_title.films && json_title.films.length) chooseFilmFromKP(json_title.films);
                                else chooseFilmFromKP([]);
                            }, function(a_title, c_title){ handleFinalError("Title search fallback failed"); }, false, { headers: headers });
                        } else {
                            handleFinalError("Initial search failed");
                        }
                    }, false, { headers: headers });
                }

                function chooseFilmFromKP(items) {
                    if (!items || !items.length) {
                        return handleFinalError("No matches found");
                    }
                    var film_id_to_use = null;
                    var matched_film = null;
                    items.forEach(function (c) {
                        var year = c.start_date || c.year || '0000';
                        c.tmp_year = parseInt((year + '').slice(0, 4));
                        c.kp_id_unified = c.kp_id || c.kinopoisk_id || c.kinopoiskId || c.filmId;
                    });
                    var filtered = items;
                    if (imdb_id_from_tmdb) {
                        var imdb_match = filtered.filter(function(item) { return (item.imdb_id || item.imdbId) === imdb_id_from_tmdb; });
                        if (imdb_match.length === 1) matched_film = imdb_match[0];
                        else if (imdb_match.length > 1) filtered = imdb_match;
                    }
                    if (!matched_film) {
                        var title_matches = filtered.filter(function(item) { 
                            return equalTitle(item.title || item.ru_title || item.nameRu, movieData.title) || 
                                   equalTitle(item.orig_title || item.nameOriginal, orig_title) || 
                                   equalTitle(item.en_title || item.nameEn, orig_title); 
                        });
                        if (title_matches.length > 0) filtered = title_matches;
                        else {
                            var contains_matches = filtered.filter(function(item) { 
                                return containsTitle(item.title || item.ru_title || item.nameRu, movieData.title) || 
                                       containsTitle(item.orig_title || item.nameOriginal, orig_title) || 
                                       containsTitle(item.en_title || item.nameEn, orig_title); 
                            });
                            if (contains_matches.length > 0) filtered = contains_matches;
                        }
                    }
                    if (!matched_film && filtered.length > 1 && search_year > 0) {
                        var year_matches = filtered.filter(function(c) { return c.tmp_year === search_year; });
                        if (year_matches.length > 0) filtered = year_matches;
                        else {
                            var nearby_year_matches = filtered.filter(function(c) { return c.tmp_year && Math.abs(c.tmp_year - search_year) <= 1; });
                            if (nearby_year_matches.length > 0) filtered = nearby_year_matches;
                        }
                    }
                    if (matched_film) film_id_to_use = matched_film.kp_id_unified;
                    else if (filtered.length === 1) film_id_to_use = filtered[0].kp_id_unified;
                    else if (filtered.length > 1) film_id_to_use = filtered[0].kp_id_unified;

                    if (film_id_to_use) fetchRatingsForKPID(film_id_to_use);
                    else handleFinalError("Could not determine unique film ID");
                }

                function fetchRatingsForKPID(kp_id) {
                    var xml_url = config.kp_rating_url + kp_id + '.xml';
                    network.clear();
                    network.timeout(config.xml_timeout);
                    network.native(xml_url, function (xml_str) {
                        var kp_rating = 0, found = false;
                        try {
                            if (xml_str && xml_str.indexOf('<rating>') !== -1) {
                                const kpMatch = xml_str.match(/<kp_rating[^>]*>([\d.]+)<\/kp_rating>/);
                                if (kpMatch && kpMatch[1]) { 
                                    kp_rating = parseFloat(kpMatch[1]) || 0; 
                                    found = true; 
                                }
                            }
                        } catch (e) { }

                        if (found) {
                            handleFinalSuccess({ kp: kp_rating });
                        } else {
                            fetchRatingsFromApiV22(kp_id);
                        }
                    }, function (a, c) {
                        fetchRatingsFromApiV22(kp_id);
                    }, false, { dataType: 'text' });
                }

                function fetchRatingsFromApiV22(kp_id) {
                    var api_v22_url = config.kp_api_url + 'api/v2.2/films/' + kp_id;
                    var headers = { 'X-API-KEY': config.kp_api_key };
                    network.clear();
                    network.timeout(config.request_timeout);
                    network.silent(api_v22_url, function (data) {
                        handleFinalSuccess({
                            kp: data.ratingKinopoisk || 0
                        });
                    }, function (a, c) {
                        handleFinalError("API v2.2 fetch failed");
                    }, false, { headers: headers });
                }

                function handleFinalSuccess(ratings) {
                    setKPCache(tmdb_id, ratings);
                    callback(ratings);
                }

                function handleFinalError(errorMessage) {
                    var emptyRatings = { kp: 0, error: errorMessage };
                    setKPCache(tmdb_id, emptyRatings);
                    callback(emptyRatings);
                }
            }

            // --- MDBList Fetcher State ---
            var mdblistRatingsCache = {};
            var mdblistRatingsPending = {};
            var kpRatingsCache = {};
            var kpRatingsPending = {};

            // --- Settings UI Registration ---
            Lampa.SettingsApi.addComponent({
                component: 'additional_ratings',
                name: Lampa.Lang.translate('additional_ratings_title'),
                icon: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 29 29" xml:space="preserve" width="32" height="32" fill="currentColor"><rect x="18" y="26" width="8" height="2"/><rect x="18" y="22" width="12" height="2"/><rect x="18" y="18" width="12" height="2"/><polygon points="20.549 11.217 16 2 11.451 11.217 1.28 12.695 8.64 19.87 6.902 30 14 26.269 14 24.009 9.559 26.344 10.611 20.208 10.789 19.171 10.036 18.438 5.578 14.091 11.739 13.196 12.779 13.045 13.245 12.102 16 6.519 18.755 12.102 19.221 13.045 20.261 13.196 27.715 14.281 28 12.3 20.549 11.217"/></svg>'
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

            Lampa.SettingsApi.addParam({
                component: 'additional_ratings',
                param: {
                    name: 'select_ratings_button',
                    type: 'button'
                },
                field: {
                    name: Lampa.Lang.translate('select_ratings_button_name'),
                    description: Lampa.Lang.translate('select_ratings_button_desc')
                },
                onChange: function () {
                    showRatingProviderSelection();
                }
            });

            function showRatingProviderSelection() {
                const providers = [
                    { title: 'TMDB', id: 'show_rating_tmdb', default: true },
                    { title: 'IMDb', id: 'show_rating_imdb', default: true },
                    { title: 'KinoPoisk', id: 'show_rating_kp', default: true },
                    { title: 'Rotten Tomatoes (Critics)', id: 'show_rating_tomatoes', default: false },
                    { title: 'Rotten Tomatoes (Audience)', id: 'show_rating_audience', default: false },
                    { title: 'Metacritic', id: 'show_rating_metacritic', default: false },
                    { title: 'Trakt', id: 'show_rating_trakt', default: false },
                    { title: 'Letterboxd', id: 'show_rating_letterboxd', default: false },
                    { title: 'Roger Ebert', id: 'show_rating_rogerebert', default: false }
                ];

                let selectItems = providers.map(provider => {
                    let storedValue = Lampa.Storage.get(provider.id, provider.default);
                    let isChecked = (storedValue === true || storedValue === 'true');
                    return {
                        title: provider.title,
                        id: provider.id,
                        checkbox: true,
                        checked: isChecked,
                        default: provider.default
                    };
                });

                var currentController = Lampa.Controller.enabled().name;

                Lampa.Select.show({
                    title: Lampa.Lang.translate('select_ratings_dialog_title'),
                    items: selectItems,
                    onBack: function () {
                        Lampa.Controller.toggle(currentController || 'settings');
                    },
                    onCheck: function (item) {
                        let oldValue = Lampa.Storage.get(item.id, item.default);
                        let oldStateIsChecked = (oldValue === true || oldValue === 'true');
                        let newStateIsChecked = !oldStateIsChecked;
                        Lampa.Storage.set(item.id, newStateIsChecked);
                        item.checked = newStateIsChecked;
                    }
                });
            }

            // --- Класс для нового интерфейса (адаптированный для Lampa 3.0+) ---
            function NewInterfaceInfo() {
                this.html = null;
                this.timer = null;
                this.network = new Lampa.Reguest();
                this.loaded = {};
                this.currentUrl = null;
                this.isDestroyed = false;
            }

            NewInterfaceInfo.prototype.create = function() {
                this.html = $("<div class=\"new-interface-info\">\n            <div class=\"new-interface-info__body\">\n                <div class=\"new-interface-info__head\"></div>\n                <div class=\"new-interface-info__title\"></div>\n                <div class=\"new-interface-info__details\"></div>\n                <div class=\"new-interface-info__description\"></div>\n            </div>\n        </div>");
            };

            NewInterfaceInfo.prototype.render = function(asElement) {
                if (!this.html) {
                    this.create();
                }
                return asElement ? this.html[0] : this.html;
            };

            NewInterfaceInfo.prototype.update = function(data) {
                if (this.isDestroyed || !data || !this.html) {
                    return;
                }

                this.html.find(".new-interface-info__head,.new-interface-info__details").text("---");
                this.html.find('.new-interface-info__title').text(data.title || data.name || '');
                this.html.find('.new-interface-info__description').text(data.overview || Lampa.Lang.translate('full_notext'));
                
                Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200'));
                
                // Fetch ratings
                if (data.id) {
                    var movieData = {
                        id: data.id,
                        title: data.title || data.name,
                        release_date: data.release_date,
                        first_air_date: data.first_air_date,
                        original_title: data.original_title,
                        original_name: data.original_name,
                        media_type: data.name ? 'tv' : 'movie',
                        imdb_id: data.imdb_id
                    };

                    // Fetch MDBList ratings
                    mdblistRatingsPending[data.id] = true;
                    fetchRatings(movieData, function(mdblistResult) {
                        mdblistRatingsCache[data.id] = mdblistResult;
                        delete mdblistRatingsPending[data.id];
                    });

                    // Fetch Kinopoisk ratings
                    kpRatingsPending[data.id] = true;
                    fetchKPRatings(movieData, function(kpResult) {
                        kpRatingsCache[data.id] = kpResult;
                        delete kpRatingsPending[data.id];
                    });
                }

                this.load(data);
            };

            NewInterfaceInfo.prototype.load = function(data) {
                if (this.isDestroyed || !data || !data.id) {
                    return;
                }

                var media_type = data.name ? 'tv' : 'movie';
                var url = Lampa.TMDB.api(media_type + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get('language'));
                this.currentUrl = url;
                
                if (this.loaded[url]) {
                    this.draw(this.loaded[url]);
                    return;
                }

                clearTimeout(this.timer);
                var self = this;
                this.timer = setTimeout(function() {
                    self.network.clear();
                    self.network.timeout(5000);
                    self.network.silent(url, function(movie) {
                        self.loaded[url] = movie;
                        if (self.currentUrl === url) {
                            self.draw(movie);
                        }
                    });
                }, 300);
            };

            NewInterfaceInfo.prototype.draw = function(data) {
                if (this.isDestroyed || !data || !this.html) {
                    return;
                }

                var create_year = ((data.release_date || data.first_air_date || '0000') + '').slice(0, 4);
                var vote = parseFloat((data.vote_average || 0) + '').toFixed(1);
                var head = [];
                var lineOneDetails = [];
                var genreDetails = [];
                var countries = Lampa.Api.sources.tmdb.parseCountries(data);
                var pg = Lampa.Api.sources.tmdb.parsePG(data);

                // Logo URLs
                const tmdbLogoUrl = 'https://psahx.github.io/ps_plug/TMDB.svg';
                const imdbLogoUrl = 'https://psahx.github.io/ps_plug/IMDb_3_2_Logo_GOLD.png';
                const kpLogoUrl = 'https://psahx.github.io/ps_plug/kinopoisk-icon-main.svg';
                const rtFreshLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes.svg';
                const rtRottenLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes_rotten.svg';
                const rtAudienceFreshLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes_positive_audience.svg';
                const rtAudienceSpilledLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes_negative_audience.svg';
                const metacriticLogoUrl = 'https://psahx.github.io/ps_plug/Metacritic_M.png';
                const traktLogoUrl = 'https://psahx.github.io/ps_plug/Trakt.svg';
                const letterboxdLogoUrl = 'https://psahx.github.io/ps_plug/letterboxd-decal-dots-pos-rgb.svg';
                const rogerEbertLogoUrl = 'https://psahx.github.io/ps_plug/Roger_Ebert.jpeg';

                // Rating Toggles State
                let tmdbStored = Lampa.Storage.get('show_rating_tmdb', true);
                const showTmdb = (tmdbStored === true || tmdbStored === 'true');
                let imdbStored = Lampa.Storage.get('show_rating_imdb', true);
                const showImdb = (imdbStored === true || imdbStored === 'true');
                let kpStored = Lampa.Storage.get('show_rating_kp', true);
                const showKp = (kpStored === true || kpStored === 'true');
                let tomatoesStored = Lampa.Storage.get('show_rating_tomatoes', false);
                const showTomatoes = (tomatoesStored === true || tomatoesStored === 'true');
                let audienceStored = Lampa.Storage.get('show_rating_audience', false);
                const showAudience = (audienceStored === true || audienceStored === 'true');
                let metacriticStored = Lampa.Storage.get('show_rating_metacritic', false);
                const showMetacritic = (metacriticStored === true || metacriticStored === 'true');
                let traktStored = Lampa.Storage.get('show_rating_trakt', false);
                const showTrakt = (traktStored === true || traktStored === 'true');
                let letterboxdStored = Lampa.Storage.get('show_rating_letterboxd', false);
                const showLetterboxd = (letterboxdStored === true || letterboxdStored === 'true');
                let rogerEbertStored = Lampa.Storage.get('show_rating_rogerebert', false);
                const showRogerebert = (rogerEbertStored === true || rogerEbertStored === 'true');

                // Build Head
                if (create_year !== '0000') head.push('<span>' + create_year + '</span>');
                if (countries.length > 0) head.push(countries.join(', '));

                // Get MDBList Rating Results
                var mdblistResult = mdblistRatingsCache[data.id] || {};
                var kpResult = kpRatingsCache[data.id] || {};

                // Build Line 1 Details (Ratings)
                if (showTmdb) {
                    lineOneDetails.push('<div class="full-start__rate tmdb-rating-item">' + '<div>' + vote + '</div>' + '<img src="' + tmdbLogoUrl + '" class="rating-logo tmdb-logo" alt="TMDB" draggable="false">' + '</div>');
                }
                if (showImdb) {
                    var imdbRating = mdblistResult && mdblistResult.imdb !== null && typeof mdblistResult.imdb === 'number' ? parseFloat(mdblistResult.imdb || 0).toFixed(1) : '0.0';
                    lineOneDetails.push('<div class="full-start__rate imdb-rating-item">' + '<div>' + imdbRating + '</div>' + '<img src="' + imdbLogoUrl + '" class="rating-logo imdb-logo" alt="IMDB" draggable="false">' + '</div>');
                }
                if (showKp) {
                    var kpRating = kpResult && kpResult.kp !== null && typeof kpResult.kp === 'number' ? parseFloat(kpResult.kp || 0).toFixed(1) : '0.0';
                    lineOneDetails.push('<div class="full-start__rate kp-rating-item">' + '<div>' + kpRating + '</div>' + '<img src="' + kpLogoUrl + '" class="rating-logo kp-logo" alt="Kinopoisk" draggable="false">' + '</div>');
                }
                if (showTomatoes) {
                    if (mdblistResult && typeof mdblistResult.tomatoes === 'number' && mdblistResult.tomatoes !== null) { 
                        let score = mdblistResult.tomatoes; 
                        let logoUrl = ''; 
                        if (score >= 60) { logoUrl = rtFreshLogoUrl; } 
                        else if (score >= 0) { logoUrl = rtRottenLogoUrl; } 
                        if (logoUrl) { 
                            lineOneDetails.push('<div class="full-start__rate rt-rating-item">' + '<div class="rt-score">' + score + '</div>' + '<img src="' + logoUrl + '" class="rating-logo rt-logo" alt="RT Critics" draggable="false">' + '</div>'); 
                        } 
                    }
                }
                if (showAudience) {
                    if (mdblistResult && mdblistResult.popcorn != null) { 
                        let parsedScore = parseFloat(mdblistResult.popcorn); 
                        if (!isNaN(parsedScore)) { 
                            let score = parsedScore; 
                            let logoUrl = ''; 
                            if (score >= 60) { logoUrl = rtAudienceFreshLogoUrl; } 
                            else if (score >= 0) { logoUrl = rtAudienceSpilledLogoUrl; } 
                            if (logoUrl) { 
                                lineOneDetails.push('<div class="full-start__rate rt-audience-rating-item">' + '<div class="rt-audience-score">' + score + '</div>' + '<img src="' + logoUrl + '" class="rating-logo rt-audience-logo" alt="RT Audience" draggable="false">' + '</div>'); 
                            } 
                        } 
                    }
                }
                if (showMetacritic) {
                    if (mdblistResult && typeof mdblistResult.metacritic === 'number' && mdblistResult.metacritic !== null) { 
                        let score = mdblistResult.metacritic; 
                        if (score >= 0) { 
                            lineOneDetails.push('<div class="full-start__rate metacritic-rating-item">' + '<div class="metacritic-score">' + score + '</div>' + '<img src="' + metacriticLogoUrl + '" class="rating-logo metacritic-logo" alt="Metacritic" draggable="false">' + '</div>'); 
                        } 
                    }
                }
                if (showTrakt) {
                    if (mdblistResult && mdblistResult.trakt != null) { 
                        let parsedScore = parseFloat(mdblistResult.trakt); 
                        if (!isNaN(parsedScore)) { 
                            let score = parsedScore; 
                            if (score >= 0) { 
                                lineOneDetails.push('<div class="full-start__rate trakt-rating-item">' + '<div class="trakt-score">' + score + '</div>' + '<img src="' + traktLogoUrl + '" class="rating-logo trakt-logo" alt="Trakt" draggable="false">' + '</div>'); 
                            } 
                        } 
                    }
                }
                if (showLetterboxd) {
                    if (mdblistResult && mdblistResult.letterboxd != null) { 
                        let parsedScore = parseFloat(mdblistResult.letterboxd); 
                        if (!isNaN(parsedScore)) { 
                            let score = parsedScore.toFixed(1); 
                            if (parsedScore >= 0) { 
                                lineOneDetails.push('<div class="full-start__rate letterboxd-rating-item">' + '<div class="letterboxd-score">' + score + '</div>' + '<img src="' + letterboxdLogoUrl + '" class="rating-logo letterboxd-logo" alt="Letterboxd" draggable="false">' + '</div>'); 
                            } 
                        } 
                    }
                }
                if (showRogerebert) {
                    if (mdblistResult && mdblistResult.rogerebert != null) { 
                        let parsedScore = parseFloat(mdblistResult.rogerebert); 
                        if (!isNaN(parsedScore)) { 
                            let score = parsedScore.toFixed(1); 
                            if (parsedScore >= 0) { 
                                lineOneDetails.push('<div class="full-start__rate rogerebert-rating-item">' + '<div class="rogerebert-score">' + score + '</div>' + '<img src="' + rogerEbertLogoUrl + '" class="rating-logo rogerebert-logo" alt="Roger Ebert" draggable="false">' + '</div>'); 
                            } 
                        } 
                    }
                }

                if (data.genres && data.genres.length > 0) {
                    var genresText = data.genres.map(function (item) { 
                        return Lampa.Utils.capitalizeFirstLetter(item.name); 
                    }).join(' | ');

                    var additionalInfo = [];
        
                    if (data.runtime) {
                        additionalInfo.push(Lampa.Utils.secondsToTime(data.runtime * 60, true));
                    }
                    if (pg) {
                        additionalInfo.push('<span class="full-start__pg" style="font-size: 0.9em;">' + pg + '</span>');
                    }
        
                    if (additionalInfo.length > 0) {
                        genresText += ' <span class="new-interface-info__split">●</span> ' + additionalInfo.join(' <span class="new-interface-info__split">&#9679;</span> ');
                    }
        
                    genreDetails.push(genresText);
                }

                // Update HTML
                this.html.find('.new-interface-info__head').empty().append(head.join(', '));

                let lineOneHtml = lineOneDetails.join('<span class="new-interface-info__split">&#9679;</span>');
                let genresHtml = genreDetails.length > 0 ? genreDetails[0] : '';

                let finalDetailsHtml = '';
                if (genresHtml) {
                    finalDetailsHtml += `<div class="genre-details-line">${genresHtml}</div>`;
                }
                if (lineOneDetails.length > 0) {
                    finalDetailsHtml += `<div class="line-one-details">${lineOneHtml}</div>`;
                }

                this.html.find('.new-interface-info__details').html(finalDetailsHtml);
            };

            NewInterfaceInfo.prototype.empty = function() {
                if (this.html) {
                    this.html.find(".new-interface-info__head,.new-interface-info__details").text("---");
                }
            };

            NewInterfaceInfo.prototype.destroy = function() {
                this.isDestroyed = true;
                clearTimeout(this.timer);
                this.network.clear();
                this.loaded = {};
                this.currentUrl = null;
                if (this.html) {
                    this.html.remove();
                    this.html = null;
                }
            };

            // --- Patch для Lampa 3.0+ ---
            // Нужно найти и модифицировать класс _0x1a834f из второго плагина
            // или создать новый интерфейс
            
            // Получаем доступ к Maker API
            if (Lampa.Maker && Lampa.Maker.map) {
                var MainItems = Lampa.Maker.map("Main");
                if (MainItems && MainItems.Items) {
                    // Сохраняем оригинальные методы
                    var originalOnInit = MainItems.Items.onInit;
                    var originalOnCreate = MainItems.Create ? MainItems.Create.onCreate : null;
                    
                    // Переопределяем onInit
                    MainItems.Items.onInit = function() {
                        if (originalOnInit) originalOnInit.apply(this, arguments);
                        
                        // Проверяем, подходит ли этот объект для нового интерфейса
                        var object = this.object;
                        var useNewInterface = false;
                        
                        if (object && (object.source === "tmdb" || object.source === 'cub')) {
                            if (window.innerWidth >= 767) {
                                if (!Lampa.Platform.screen("mobile")) {
                                    if (object.title !== "Избранное") {
                                        useNewInterface = true;
                                    }
                                }
                            }
                        }
                        
                        this.__newInterfaceEnabled = useNewInterface;
                        
                        if (useNewInterface && !this.__newInterfaceState) {
                            this.__newInterfaceState = new NewInterfaceInfo();
                            this.__newInterfaceState.create();
                        }
                    };
                    
                    // Переопределяем onCreate
                    if (originalOnCreate) {
                        MainItems.Create.onCreate = function() {
                            if (originalOnCreate) originalOnCreate.apply(this, arguments);
                            
                            if (this.__newInterfaceEnabled && this.__newInterfaceState) {
                                // Прикрепляем HTML к основному элементу
                                var mainRender = this.render(true);
                                if (mainRender) {
                                    mainRender.classList.add('new-interface');
                                    var infoElement = this.__newInterfaceState.render(true);
                                    if (infoElement && infoElement.parentNode !== mainRender) {
                                        mainRender.insertBefore(infoElement, mainRender.firstChild);
                                    }
                                    this.scroll.minus(infoElement);
                                }
                            }
                        };
                    }
                    
                    // Также нужно перехватить события карточек для обновления информации
                }
            }

            // --- Добавляем стили для нового интерфейса ---
            var style_id = 'new_interface_style_adjusted_padding_v3';
            if (!$('style[data-id="' + style_id + '"]').length) {
                $('style[data-id^="new_interface_style_"]').remove();

                Lampa.Template.add(style_id, `
                <style data-id="${style_id}">
                .new-interface .card--small.card--wide { width: 18.3em; }
                .new-interface-info { position: relative; padding: 1.5em; height: 19em; }
                .new-interface-info__body { width: 80%; padding-top: 1.1em; }
                .new-interface-info__head { color: rgba(255, 255, 255, 0.6); margin-bottom: 1em; font-size: 1.3em; min-height: 1em; }
                .new-interface-info__head span { color: #fff; }
                .new-interface-info__title { font-size: 4em; font-weight: 600; margin-bottom: 0.3em; overflow: hidden; text-overflow: "."; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; margin-left: -0.03em; line-height: 1.3; }
                .new-interface-info__description {
                    font-style: italic;
                }
                .new-interface-info__details {
                    margin-bottom: 1em; 
                    display: block;
                    min-height: 1.9em;
                    font-size: 1.1em;
                }
                .new-interface-logo {
                    margin-top: 0.3em;
                    margin-bottom: 0.3em;
                    max-width: 7em;
                    max-height: 2em;
                    object-fit: contain;
                    width: auto;
                    height: auto;
                    min-height: 1em;
                    filter: drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.4));
                    will-change: opacity;
                }
                .line-one-details {
                    margin-top: 0.5em;
                    line-height: 1.5;
                }
                .genre-details-line {
                    margin-bottom: 0.6em;
                    font-size: 1.5em;
                    font-weight: 700;
                    word-spacing: -3px;
                    text-shadow: 1px 1px 2px #C0C0C0;
                }
                .card__quality {
                    font-weight: bold !important;
                }    
                .new-interface-info__split { margin: 0 0.5em; font-size: 0.7em; }
                .new-interface .card-more__box { padding-bottom: 95%; }
                .new-interface .full-start__background { height: 108%; top: -6em; }
                .new-interface .card__promo { display: none; }
                .new-interface .card.card--wide+.card-more .card-more__box { padding-bottom: 95%; }
                .new-interface .card.card--wide .card-watched { display: none !important; }
                body.light--version .new-interface-info__body { width: 69%; padding-top: 1.5em; }
                body.light--version .new-interface-info { height: 25.3em; }
                body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.focus .card__view { animation: animation-card-focus 0.2s; }
                body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.animate-trigger-enter .card__view { animation: animation-trigger-enter 0.2s forwards; }

                /* --- Rating Box Styles --- */
                .new-interface .full-start__pg {
                    font-size: 0.7em !important;
                    font-weight: bold !important;
                }
                .new-interface .full-start__rate {
                    font-size: 1.5em;
                    margin-right: 0;
                    display: inline-flex;
                    align-items: center;
                    vertical-align: middle;
                    background-color: rgba(255, 255, 255, 0.12);
                    padding: 0 0.2em 0 0;
                    border-radius: 0.3em;
                    gap: 0.4em;
                    overflow: hidden;
                    height: auto;
                }
                .full-start__rate {
                    font-weight: bold;
                }
                /* Фон - переопределяем стандартную анимацию на fade */
                .full-start__background {
                    height: calc(100% + 6em);
                    left: 0 !important;
                    opacity: 0 !important;
                    transition: opacity 0.6s ease-out, filter 0.3s ease-out !important;
                    animation: none !important;
                    transform: none !important;
                    will-change: opacity, filter;
                }
                .full-start__background.loaded:not(.dim) {
                    opacity: 1 !important;
                }
                .full-start__background.dim {
                  filter: blur(30px);
                }
                /* Удерживаем opacity при загрузке нового фона */
                .full-start__background.loaded.applecation-animated {
                    opacity: 1 !important;
                }
               /* body:not(.menu--open) .full-start__background {
                    mask-image: none;
                } */
                /* Отключаем стандартную анимацию Lampa для фона */
                body.advanced--animation:not(.no--animation) .full-start__background.loaded {
                    animation: none !important;
                }
                .new-interface-info__description {
                    position: absolute;
                    top: 1em;
                    right: 1em;
                    max-width: 32%;
                    max-height: 6em;
                    font-size: 1.5em;
                    font-weight: 700;
                    font-style: italic;
                    color: #ffffff;
                    background: none;
                    padding: 0.5em;
                    border-radius: 0.3em;
                    box-shadow: none;
                    overflow: hidden;
                    text-shadow: 5px 5px 5px #000;
                    letter-spacing: normal;
                    line-height: 1em; }

                .new-interface-info__description-inner {
                    display: inline-block;
                    animation: scrollCredits 35s linear infinite;
                    padding-right: 1em; } 

                @keyframes scrollCredits {
                    0% {
                        transform: translateY(0);
                    }
                    100% {
                        transform: translateY(-100%);
                    }
                }
                .new-interface .full-start__rate > div {
                    font-weight: bold;
                    font-size: 0.9em;
                    justify-content: center;
                    background-color: rgba(0, 0, 0, 0.4);
                    color: #ffffff;
                    padding: 0em 0.2em;
                    border-radius: 0.3em;
                    line-height: 1;
                    order: 1;
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }
                .card__vote {
                    position: absolute;
                    bottom: 0 !important;
                    right: 0 !important;
                    width: 2.2em;
                    height: 1.2em;
                    padding: 0.05em 0.4em;
                    font-size: 1.1em !important;
                    font-weight: bold !important;
                    background-color: rgba(0, 0, 0, 0.5) !important;
                    border-radius:  0.5em 0 0.9em 0 !important;
                }
                .card--quality {
                    background: linear-gradient(135deg, #FFD700, #FFA500) !important;
                    color: #000000 !important;
                    border: 2px solid #FF8C00 !important;
                    font-weight: bold !important;
                    padding: 4px 6px !important;
                    border-radius: 6px !important;
                    display: inline-block !important;
                    position: relative !important;
                    z-index: 10 !important;
                    box-shadow: 0 2px 8px rgba(255, 140, 0, 0.4) !important;
                    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.3) !important;
                }
                .rating-logo {
                    height: 1.1em;
                    width: auto;
                    max-width: 75px;
                    vertical-align: middle;
                    order: 2;
                    line-height: 0;
                }
                .tmdb-logo { height: 0.9em; }
                .rt-logo { height: 1.1em; }
                </style>
                `);
                $('body').append(Lampa.Template.get(style_id, {}, true));
            }

            console.log("New Interface Plugin loaded for Lampa 3.0+");
        })();
    } else {
        // Для версий ниже 3.0 используем оригинальный код первого плагина
        (function () {
            'use strict';

            // Оригинальный код первого плагина...
            // Здесь должен быть полный код вашего первого плагина
            // который вы изначально предоставили
            
            if (window.plugin_interface_ready) {
                return;
            }
            window.plugin_interface_ready = true;

            // ... весь остальной код первого плагина ...

        })();
    }
})();
