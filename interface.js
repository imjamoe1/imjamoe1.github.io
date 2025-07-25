(function () {
    'use strict';

    // --- Fetcher Configuration ---
    var config = {
        api_url: 'https://api.mdblist.com/tmdb/',
        cache_time: 60 * 60 * 12 * 1000,
        cache_key: 'mdblist_ratings_cache',
        cache_limit: 500,
        request_timeout: 10000
    };
    
    // --- Language Strings ---
    if (window.Lampa && Lampa.Lang) {
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
            }          
        });
    }

    // --- Settings UI Registration ---
    if (window.Lampa && Lampa.SettingsApi) {
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
    }

    var network = (window.Lampa && Lampa.Reguest) ? new Lampa.Reguest() : null;

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

    // --- Core Fetching Logic ---
    function fetchRatings(movieData, callback) {
        if (!network) {
             if (callback) callback({ error: "Network component unavailable" });
             return;
        }
        if (!window.Lampa || !Lampa.Storage) {
             if (callback) callback({ error: "Storage component unavailable" });
             return;
        }

        if (!movieData || !movieData.id || !movieData.method || !callback) {
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

        var media_type = movieData.method === 'tv' ? 'show' : 'movie';
        var api_url = "".concat(config.api_url).concat(media_type, "/").concat(tmdb_id, "?apikey=").concat(apiKey);

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
            }
             else {
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

    // --- MDBList Fetcher State ---
    var mdblistRatingsCache = {};
    var mdblistRatingsPending = {};

    function showRatingProviderSelection() {
        const providers = [
            { title: 'IMDb', id: 'show_rating_imdb', default: true },
            { title: 'TMDB', id: 'show_rating_tmdb', default: true },
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

    // Кэширующая функция для запросов
    function fetchWithCache(network, url, callback, fallback) {
        const cacheKey = 'tmdb_cache_' + stringHash(url);
        const cached = Lampa.Storage.get(cacheKey);
        const cacheTime = 24 * 60 * 60 * 1000; // 24 часа кэширования
        
        if (cached && cached.timestamp > Date.now() - cacheTime) {
            callback(cached.data);
            return;
        }
        
        network.silent(url, (data) => {
            Lampa.Storage.set(cacheKey, {
                timestamp: Date.now(),
                data: data
            });
            callback(data);
        }, () => {
            if (cached) callback(cached.data);
            else if (fallback) fallback();
        });
    }

    // Добавляем простую функцию для создания хеша из строки
    function stringHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    // Функция для получения лучшего логотипа с учетом текущего языка
    function getBestLogo(images, logoSetting) {
        if (!images.logos || images.logos.length === 0) return null;

        const currentLanguage = Lampa.Storage.get('language') || 'en';
        const primaryLanguage = currentLanguage.split('-')[0]; // Получаем основной язык (например, 'ru' из 'ru-RU')

        // 1. Пытаемся найти логотип для текущего языка
        const currentLangLogo = images.logos.find(logo => logo.iso_639_1 === primaryLanguage);
        if (currentLangLogo) return currentLangLogo;

        // 2. Если текущий язык русский, но нет русского логотипа, ищем английский
        if (primaryLanguage === 'ru') {
            const enLogo = images.logos.find(logo => logo.iso_639_1 === 'en');
            if (enLogo) return enLogo;
        }

        // 3. Если текущий язык английский, но нет английского логотипа, ищем русский
        if (primaryLanguage === 'en') {
            const ruLogo = images.logos.find(logo => logo.iso_639_1 === 'ru');
            if (ruLogo) return ruLogo;
        }

        // 4. Если ничего не найдено, возвращаем первый доступный логотип
        return images.logos[0];
    }
  
    // --- Modified create function with Ratings Support ---
    function create() { 
        var html; 
        var timer; 
        var network = new Lampa.Reguest(); 
        var loaded = {};
        var isDestroyed = false;
        var intersectionObserver; 
        
        this.create = function () { 
            html = $("<div class=\"new-interface-info\">\n            <div class=\"new-interface-info__body\">\n                <div class=\"new-interface-info__head\"></div>\n                <div class=\"new-interface-info__title\"></div>\n                <div class=\"new-interface-info__details\"></div>\n                <div class=\"new-interface-info__description\"></div>\n            </div>\n        </div>"); 
        }; 
        
        this.update = function (data) { 
            var _this = this; 
            html.find('.new-interface-info__head,.new-interface-info__details').text('---'); 
            html.find('.new-interface-info__title').text(data.title); 
            html.find('.new-interface-info__description').text(data.overview || Lampa.Lang.translate('full_notext'));
            Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200')); 
            delete mdblistRatingsCache[data.id]; 
            delete mdblistRatingsPending[data.id];  
            if (data.id && data.method) { 
                mdblistRatingsPending[data.id] = true; 
                fetchRatings(data, function(mdblistResult) { 
                    mdblistRatingsCache[data.id] = mdblistResult; 
                    delete mdblistRatingsPending[data.id];
                    var tmdb_url = Lampa.TMDB.api((data.name ? 'tv' : 'movie') + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get('language'));
                    if (loaded[tmdb_url]) { _this.draw(loaded[tmdb_url]); }
                });
            }
 
            if (isDestroyed || !html) {
                console.warn('Cannot update - component is destroyed or HTML not initialized');
                return;
            }

            const logoSetting = Lampa.Storage.get('logo_glav2') || 'show_all';
            
            if (logoSetting !== 'hide') {
                const type = data.name ? 'tv' : 'movie';
                const url = Lampa.TMDB.api(type + '/' + data.id + '/images?api_key=' + Lampa.TMDB.key());

                fetchWithCache(network, url, (images) => {
                    if (isDestroyed || !html) return;

                    let bestLogo = null;
                    
                    if (images.logos && images.logos.length > 0) {
                        let bestRussianLogo = null;
                        let bestEnglishLogo = null;
                        let bestOtherLogo = null;

                        for (let i = 0; i < images.logos.length; i++) {
                            const logo = images.logos[i];
                            if (logo.iso_639_1 === 'ru') {
                                if (!bestRussianLogo || logo.vote_average > bestRussianLogo.vote_average) {
                                    bestRussianLogo = logo;
                                }
                            }
                            else if (logo.iso_639_1 === 'en') {
                                if (!bestEnglishLogo || logo.vote_average > bestEnglishLogo.vote_average) {
                                    bestEnglishLogo = logo;
                                }
                            }
                            else if (!bestOtherLogo || logo.vote_average > bestOtherLogo.vote_average) {
                                bestOtherLogo = logo;
                            }
                        }

                        bestLogo = bestRussianLogo || bestEnglishLogo || bestOtherLogo;

                        if (logoSetting === 'ru_only' && !bestRussianLogo) {
                            bestLogo = null;
                        }
                    }
                    
                    this.applyLogo(data, bestLogo);
                }, () => {
                    if (!isDestroyed && html) {
                        const titleElement = html.find('.new-interface-info__title');
                        if (titleElement.length) {
                            titleElement.text(data.title);
                        }
                    }
                });
            } else if (!isDestroyed && html) {
                const titleElement = html.find('.new-interface-info__title');
                if (titleElement.length) {
                    titleElement.text(data.title);
                }
            }

            if (!isDestroyed && html) {
                Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200'));
                this.load(data);
            }
        };
        
        this.applyLogo = function(data, logo) {
            if (isDestroyed || !html) return;
    
            const titleElement = html.find('.new-interface-info__title');
            if (!titleElement.length) return;
    
            if (!logo || !logo.file_path) {
                titleElement.text(data.title);
                return;
            }

            const imageUrl = Lampa.TMDB.image("/t/p/w500" + logo.file_path);

            if (titleElement.data('current-logo') === imageUrl) return;
            titleElement.data('current-logo', imageUrl);

            const tempImg = new Image();
            tempImg.src = imageUrl;

            tempImg.onload = () => {
                if (isDestroyed || !html) return;
                
                titleElement.html(`
                    <img class="new-interface-logo logo-fade-in" 
                         src="${imageUrl}" 
                         alt="${data.title}"
                         loading="lazy"
                         onerror="this.remove(); this.parentElement.textContent='${data.title.replace(/"/g, '&quot;')}'" />
                `);
            };

            tempImg.onerror = () => {
                if (isDestroyed || !html) return;
                titleElement.text(data.title);
            };
        };
     
        this.draw = function (data) {
            var create_year = ((data.release_date || data.first_air_date || '0000') + '').slice(0, 4);
            var vote = parseFloat((data.vote_average || 0) + '').toFixed(1);
            var head = [];
            var lineOneDetails = [];
            var genreDetails = [];
            var countries = Lampa.Api.sources.tmdb.parseCountries(data);
            var pg = Lampa.Api.sources.tmdb.parsePG(data);

            var descriptionText = data.overview || Lampa.Lang.translate('full_notext');
            html.find('.new-interface-info__description').html('<div class="new-interface-info__description-inner">' + descriptionText + '</div>');

            // Logo URLs
            const imdbLogoUrl = 'https://psahx.github.io/ps_plug/IMDb_3_2_Logo_GOLD.png';
            const tmdbLogoUrl = 'https://psahx.github.io/ps_plug/TMDB.svg';
            const rtFreshLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes.svg';
            const rtRottenLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes_rotten.svg';
            const rtAudienceFreshLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes_positive_audience.svg';
            const rtAudienceSpilledLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes_negative_audience.svg';
            const metacriticLogoUrl = 'https://psahx.github.io/ps_plug/Metacritic_M.png';
            const traktLogoUrl = 'https://psahx.github.io/ps_plug/Trakt.svg';
            const letterboxdLogoUrl = 'https://psahx.github.io/ps_plug/letterboxd-decal-dots-pos-rgb.svg';
            const rogerEbertLogoUrl = 'https://psahx.github.io/ps_plug/Roger_Ebert.jpeg';

            // Rating Toggles State
            let imdbStored = Lampa.Storage.get('show_rating_imdb', true);
            const showImdb = (imdbStored === true || imdbStored === 'true');
            let tmdbStored = Lampa.Storage.get('show_rating_tmdb', true);
            const showTmdb = (tmdbStored === true || tmdbStored === 'true');
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
            var mdblistResult = mdblistRatingsCache[data.id];

            // Build Line 1 Details (Ratings)
            if (showImdb) {
                var imdbRating = mdblistResult && mdblistResult.imdb !== null && typeof mdblistResult.imdb === 'number' ? parseFloat(mdblistResult.imdb || 0).toFixed(1) : '0.0';
                lineOneDetails.push('<div class="full-start__rate imdb-rating-item">' + '<div>' + imdbRating + '</div>' + '<img src="' + imdbLogoUrl + '" class="rating-logo imdb-logo" alt="IMDB" draggable="false">' + '</div>');
            }
            if (showTmdb) {
                lineOneDetails.push('<div class="full-start__rate tmdb-rating-item">' + '<div>' + vote + '</div>' + '<img src="' + tmdbLogoUrl + '" class="rating-logo tmdb-logo" alt="TMDB" draggable="false">' + '</div>');
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

            // Build Line 1 Details (Runtime, PG)
            if (data.runtime) {
                lineOneDetails.push(Lampa.Utils.secondsToTime(data.runtime * 60, true));
            }
            if (pg) {
                lineOneDetails.push('<span class="full-start__pg" style="font-size: 0.9em;">' + pg + '</span>');
            }

            // Build Genre Details
            if (data.genres && data.genres.length > 0) {
                genreDetails.push(data.genres.map(function (item) { return Lampa.Utils.capitalizeFirstLetter(item.name); }).join(' | '));
            }

            // Update HTML
            html.find('.new-interface-info__head').empty().append(head.join(', '));

            let lineOneHtml = lineOneDetails.join('<span class="new-interface-info__split">&#9679;</span>');
            let genresHtml = genreDetails.length > 0 ? genreDetails[0] : '';

            let finalDetailsHtml = '';
            if (lineOneDetails.length > 0) {
                 finalDetailsHtml += `<div class="line-one-details">${lineOneHtml}</div>`;
            }
             if (genresHtml) {
                 finalDetailsHtml += `<div class="genre-details-line">${genresHtml}</div>`;
             }

            html.find('.new-interface-info__details').html(finalDetailsHtml);
        };
                       
        this.load = function (data) {
            var _this = this; 
            clearTimeout(timer); 
            var url = Lampa.TMDB.api((data.name ? 'tv' : 'movie') + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get('language'));
            if (loaded[url]) return this.draw(loaded[url]); 
            timer = setTimeout(function () { 
                network.clear(); 
                network.timeout(5000); 
                network.silent(url, function (movie) { 
                    loaded[url] = movie; 
                    if (!movie.method) movie.method = data.name ? 'tv' : 'movie'; 
                    _this.draw(movie); 
                }); 
            }, 300); 
        };
        
        this.render = function () { 
            return html; 
        }; 
        
        this.empty = function () {};
        
        this.destroy = function () {
            html.remove(); 
            loaded = {}; 
            html = null; 
            mdblistRatingsCache = {}; 
            mdblistRatingsPending = {}; 
        };
    }

    // --- Original component function ---
    function component(object) { 
        var network = new Lampa.Reguest(); 
        var scroll = new Lampa.Scroll({ mask: true, over: true, scroll_by_item: true }); 
        var items = []; 
        var html = $('<div class="new-interface"><img class="full-start__background"></div>'); 
        var active = 0; 
        var newlampa = Lampa.Manifest.app_digital >= 166; 
        var info; 
        var lezydata; 
        var viewall = Lampa.Storage.field('card_views_type') == 'view' || Lampa.Storage.field('navigation_type') == 'mouse'; 
        var background_img = html.find('.full-start__background'); 
        var background_last = ''; 
        var background_timer; 
        
        this.create = function () {
            
        }; 
        
        this.empty = function () { 
            var button; 
            if (object.source == 'tmdb') { 
                button = $('<div class="empty__footer"><div class="simple-button selector">' + Lampa.Lang.translate('change_source_on_cub') + '</div></div>'); 
                button.find('.selector').on('hover:enter', function () { 
                    Lampa.Storage.set('source', 'cub'); 
                    Lampa.Activity.replace({ source: 'cub' }); 
                }); 
            } 
            var empty = new Lampa.Empty(); 
            html.append(empty.render(button)); 
            this.start = empty.start; 
            this.activity.loader(false); 
            this.activity.toggle(); 
        }; 
        
        this.loadNext = function () {
            var _this = this; 
            if (this.next && !this.next_wait && items.length) { 
                this.next_wait = true; 
                this.next(function (new_data) { 
                    _this.next_wait = false; 
                    new_data.forEach(_this.append.bind(_this)); 
                    Lampa.Layer.visible(items[active + 1].render(true)); 
                }, function () { 
                    _this.next_wait = false; 
                }); 
            } 
        }; 
        
        this.push = function () {}; 
        
        this.build = function (data) {
            var _this2 = this; 
            lezydata = data; 
            info = new create(object); 
            info.create(); 
            scroll.minus(info.render()); 
            data.slice(0, viewall ? data.length : 2).forEach(this.append.bind(this)); 
            html.append(info.render()); 
            html.append(scroll.render()); 
            if (newlampa) {
                Lampa.Layer.update(html); 
                Lampa.Layer.visible(scroll.render(true)); 
                scroll.onEnd = this.loadNext.bind(this); 
                scroll.onWheel = function (step) { 
                    if (!Lampa.Controller.own(_this2)) _this2.start(); 
                    if (step > 0) _this2.down(); 
                    else if (active > 0) _this2.up(); 
                }; 
            } if (items.length > 0 && items[0] && items[0].data) { 
                active = 0; info.update(items[active].data); 
                this.background(items[active].data); 
            }    
            this.activity.loader(false); 
            this.activity.toggle(); 
        }; 
        
        this.background = function (elem) {
            if (!elem || !elem.backdrop_path) return; 
            var new_background = Lampa.Api.img(elem.backdrop_path, 'w1280'); 
            clearTimeout(background_timer); 
            if (new_background == background_last) return; 
            background_timer = setTimeout(function () { 
                background_img.removeClass('loaded'); 
                background_img[0].onload = function () { 
                    background_img.addClass('loaded'); 
                }; 
                background_img[0].onerror = function () { 
                    background_img.removeClass('loaded'); 
                }; 
                background_last = new_background; 
                setTimeout(function () { 
                    if (background_img[0]) background_img[0].src = background_last; 
                }, 300); 
            }, 1000); 
        }; 
        
        this.append = function (element) {
            if (element.ready) return; 
            var _this3 = this; 
            element.ready = true; 
            var item = new Lampa.InteractionLine(element, { 
                url: element.url, card_small: true, cardClass: element.cardClass, genres: object.genres, object: object, card_wide: false, nomore: element.nomore 
            }); 
            item.create(); 
            item.onDown = this.down.bind(this); 
            item.onUp = this.up.bind(this); 
            item.onBack = this.back.bind(this); 
            item.onToggle = function () { 
                active = items.indexOf(item); 
            }; 
            if (this.onMore) item.onMore = this.onMore.bind(this); 
            item.onFocus = function (elem) { 
                if (!elem.method) elem.method = elem.name ? 'tv' : 'movie'; info.update(elem); _this3.background(elem); 
            }; 
            item.onHover = function (elem) { 
                if (!elem.method) elem.method = elem.name ? 'tv' : 'movie'; 
                info.update(elem); 
                _this3.background(elem); 
            }; 
            item.onFocusMore = info.empty.bind(info); 
            scroll.append(item.render()); 
            items.push(item); 
        }; 
        
        this.back = function () { 
            Lampa.Activity.backward(); 
        }; 
        
        this.down = function () { 
            active++; 
            active = Math.min(active, items.length - 1); 
            if (!viewall && lezydata) lezydata.slice(0, active + 2).forEach(this.append.bind(this)); 
            items[active].toggle(); 
            scroll.update(items[active].render()); 
        }; 
        
        this.up = function () { 
            active--; 
            if (active < 0) { 
                active = 0; Lampa.Controller.toggle('head'); 
            } else { 
                items[active].toggle(); scroll.update(items[active].render()); 
            } 
        }; 
        
        this.start = function () {
            var _this4 = this; 
            Lampa.Controller.add('content', { 
                link: this, toggle: function toggle() { 
                    if (_this4.activity.canRefresh()) return false; 
                    if (items.length) { 
                        items[active].toggle(); 
                    } 
                }, 
                update: function update() {}, 
                left: function left() { 
                    if (Navigator.canmove('left')) Navigator.move('left'); 
                    else Lampa.Controller.toggle('menu'); 
                }, 
                right: function right() { 
                    Navigator.move('right'); 
                }, 
                up: function up() { 
                    if (Navigator.canmove('up')) Navigator.move('up'); 
                    else Lampa.Controller.toggle('head'); 
                }, 
                down: function down() { 
                    if (Navigator.canmove('down')) Navigator.move('down'); 
                }, 
                back: this.back 
            }); 
            Lampa.Controller.toggle('content'); 
        }; 
        
        this.refresh = function () { 
            this.activity.loader(true); 
            this.activity.need_refresh = true; 
        }; 
        
        this.pause = function () {}; 
        this.stop = function () {}; 
        this.render = function () { 
            return html; 
        }; 
        
        this.destroy = function () {
            clearTimeout(background_timer); 
            network.clear(); 
            Lampa.Arrays.destroy(items); 
            scroll.destroy(); 
            if (info) info.destroy(); 
            if (html) html.remove(); 
            items = null; 
            network = null; 
            lezydata = null; 
            info = null; 
            html = null; 
        }; 
    }

    // --- Plugin Initialization Logic ---
    function startPlugin() {
        if (!window.Lampa || !Lampa.Utils || !Lampa.Lang || !Lampa.Storage || !Lampa.TMDB || !Lampa.Template || !Lampa.Reguest || !Lampa.Api || !Lampa.InteractionLine || !Lampa.Scroll || !Lampa.Activity || !Lampa.Controller) { 
            console.error("NewInterface Adjust Padding: Missing Lampa components"); 
            return; 
        }
        
        Lampa.Lang.add({ full_notext: { en: 'No description', ru: 'Нет описания'}, });
        window.plugin_interface_ready = true; 
        var old_interface = Lampa.InteractionMain; 
        var new_interface = component;
        
        Lampa.InteractionMain = function (object) { 
            var use = new_interface; 
            if (!(object.source == 'tmdb' || object.source == 'cub')) use = old_interface; 
            if (window.innerWidth < 767) use = old_interface; 
            if (!Lampa.Account.hasPremium()) use = old_interface; 
            if (Lampa.Manifest.app_digital < 153) use = old_interface; 
            return new use(object); 
        };

        Lampa.SettingsApi.addParam({
            component: "interface",
            param: {
                name: "logo_glav",
                type: "select",
                values: { 
                    "1": "Скрыть", 
                    "0": "Отображать" 
                },
                default: "0"
            },
            field: {
                name: "Логотипы вместо названий 2.0",
                description: "Отображает логотипы фильмов и сериалов вместо текста на странице просмотра"
            }
        });
        
        window.logoplugin || (window.logoplugin = !0, Lampa.Listener.follow("full", function(a) {
            if ("complite" == a.type && "1" != Lampa.Storage.get("logo_glav")) {
                var e = a.data.movie;
                var isSerial = e.name || e.first_air_date;
                var apiPath = isSerial ? "tv/" + e.id : "movie/" + e.id;
                var t = Lampa.TMDB.api(apiPath + "/images?api_key=" + Lampa.TMDB.key());
                console.log("API URL для логотипов:", t);
                $.get(t, function(e) {
                    if (e.logos && e.logos.length > 0) {
                        console.log("Все логотипы:", e.logos);
                        var logo = e.logos.find(function(l) { return l.iso_639_1 === "ru"; });
                        var isRussianLogo = !!logo;
                        if (!logo) {
                            logo = e.logos.find(function(l) { return l.iso_639_1 === "en"; });
                            console.log("Английский логотип:", logo ? "найден" : "не найден");
                        }
                        if (!logo) {
                            logo = e.logos[0];
                            console.log("Взят первый доступный логотип:", logo);
                        }
                        if (logo && logo.file_path) {
                            var logoPath = Lampa.TMDB.image("/t/p/w300" + logo.file_path.replace(".svg", ".png"));
                            console.log("Отображаем логотип:", logoPath);

                            // Если логотип не русский, запрашиваем русское название
                            if (!isRussianLogo) {
                                var titleApi = Lampa.TMDB.api(apiPath + "?api_key=" + Lampa.TMDB.key() + "&language=ru");
                                console.log("API URL для названия:", titleApi);
                                $.get(titleApi, function(data) {
                                    var russianTitle = isSerial ? data.name : data.title;
                                    console.log("Русское название из TMDB:", russianTitle);
                                    if (russianTitle) {
                                        a.object.activity.render().find(".full-start-new__title").html(
                                            '<div style="display: flex; flex-direction: column; align-items: flex-start; animation: fadeIn 0.9s ease-in;">' +
                                                '<img style="margin-top: 5px; max-height: 125px;" src="' + logoPath + '" />' +
                                                '<span style="margin-top: 5px; font-size: 32px; color: #fff;">' + russianTitle + '</span>' +
                                            '</div>' +
                                            '<style>' +
                                                '@keyframes fadeIn {' +
                                                    'from { opacity: 0; }' +
                                                    'to { opacity: 1; }' +
                                                '}' +
                                            '</style>'
                                        );
                                    } else {
                                        a.object.activity.render().find(".full-start-new__title").html(
                                            '<div style="display: flex; flex-direction: column; align-items: flex-start; animation: fadeIn 0.5s ease-in;">' +
                                                '<img style="margin-top: 5px; max-height: 125px;" src="' + logoPath + '" />' +
                                            '</div>' +
                                            '<style>' +
                                                '@keyframes fadeIn {' +
                                                    'from { opacity: 0; }' +
                                                    'to { opacity: 1; }' +
                                                '}' +
                                            '</style>'
                                        );
                                    }
                                });
                            } else {
                                a.object.activity.render().find(".full-start-new__title").html(
                                    '<div style="display: flex; flex-direction: column; align-items: flex-start; animation: fadeIn 0.5s ease-in;">' +
                                        '<img style="margin-top: 5px; max-height: 125px;" src="' + logoPath + '" />' +
                                    '</div>' +
                                    '<style>' +
                                        '@keyframes fadeIn {' +
                                            'from { opacity: 0; }' +
                                            'to { opacity: 1; }' +
                                        '}' +
                                    '</style>'
                                );
                            }
                        } else {
                            console.log("Логотип невалидный (нет file_path):", logo);
                        }
                    } else {
                        console.log("Логотипы отсутствуют для:", e.title || e.name);
                    }
                });
            }
        }));

        var style_id = 'new_interface_style_adjusted_padding';
        if (!$('style[data-id="' + style_id + '"]').length) {
             $('style[data-id^="new_interface_style_"]').remove();

            Lampa.Template.add(style_id, `
            <style data-id="${style_id}">
            .new-interface .card--small.card--wide { width: 18.3em; }
            .new-interface-info { position: relative; padding: 1.5em; height: 20em; }
            .new-interface-info__body { width: 80%; padding-top: 1.1em; }
            .new-interface-info__head { color: rgba(255, 255, 255, 0.6); margin-bottom: 1em; font-size: 1.3em; min-height: 1em; }
            .new-interface-info__head span { color: #fff; }
            .new-interface-info__title { font-size: 4em; font-weight: 600; margin-bottom: 0.3em; overflow: hidden; text-overflow: "."; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; margin-left: -0.03em; line-height: 1.3; }
document.querySelectorAll('.new-interface-info__description').forEach(el => {
    Object.assign(el.style, {
        fontStyle: 'italic',
    });
});
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
                margin-bottom: 0.6em;
                line-height: 1.5;
            }
            .genre-details-line {
                margin-top: 1em;
                line-height: 1.5;
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
            .new-interface .full-start__rate {
                font-size: 1.3em;
                margin-right: 0em;
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
                font-weight: normal;
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
    }

    if (!window.plugin_interface_ready) startPlugin();
})();
