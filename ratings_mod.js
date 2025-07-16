// == Combined Ratings Plugin ==

// == Movie Logos | Clean and Working  ==
(function () {
    'use strict';
    
    // --- Fetcher Configuration ---
    var config = {
        api_url: 'https://api.mdblist.com/tmdb/', // Base URL for MDBList TMDB endpoint
        // api_key is now configured via Lampa Settings -> Additional Ratings
        cache_time: 60 * 60 * 12 * 1000, // 12 hours cache duration
        cache_key: 'mdblist_ratings_cache', // Unique storage key for ratings data
        cache_limit: 500, // Max items in cache
        request_timeout: 10000 // 10 seconds request timeout
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
            },
            logo_toggle_name: {
                ru: "Логотип вместо заголовка",
                en: "Logo Instead of Title",
                uk: "Логотип замість заголовка"
            },
            logo_toggle_desc: {
                ru: "Заменяет текстовый заголовок фильма логотипом",
                en: "Replaces movie text title with a logo",
                uk: "Замінює текстовий заголовок логотипом"
            },
            settings_show: {
                ru: "Показать",
                en: "Show", // Or "On" if you prefer
                uk: "Показати"
            },
            settings_hide: {
                ru: "Скрыть",
                en: "Hide", // Or "Off" if you prefer
                uk: "Приховати"
            },
            full_notext: { 
                en: 'No description', 
                ru: 'Нет описания',
                uk: 'Немає опису'
            },
            info_panel_logo_height_name: {
                ru: "Размер логотипа",
                en: "Logo Size",
                uk: "Висота логотипу"
            },
            info_panel_logo_height_desc: {
                ru: "Максимальная высота логотипа",
                en: "Maximum logo height",
                uk: "Максимальна висота логотипу"
            }
        });
    }


    // --- Settings UI Registration ---
    if (window.Lampa && Lampa.SettingsApi) {
        // 1. Add the new Settings Category
        Lampa.SettingsApi.addComponent({
            component: 'additional_ratings',
            name: Lampa.Lang.translate('additional_ratings_title'),
            icon: '' // Simple placeholder icon
        });

        // 2. Add the API Key parameter under the new category
        Lampa.SettingsApi.addParam({
            component: 'additional_ratings', // <-- Target the new component
            param: {
                name: 'mdblist_api_key', // Storage key for the API key
                type: 'input',          // Input field type
                'default': '',          // Default value (empty)
                values: {},             // Keep this from previous attempt, just in case
                placeholder: 'Enter your MDBList API Key' // Placeholder text
            },
            field: {
                name: 'MDBList API Key', // Display name in settings
                description: Lampa.Lang.translate('mdblist_api_key_desc') // Use translated description
            },
            onChange: function() {
                // Optional: Clear cache if API key changes? For now, just update settings.
                Lampa.Settings.update();
            }
        });

        // 3. Add Button to Open Rating Selection
        Lampa.SettingsApi.addParam({
            component: 'additional_ratings', // Target category
            param: {
                name: 'select_ratings_button', // Unique name for this settings parameter
                type: 'button'                 // Set type to button
            },
            field: {
                // Use translated text for the button row
                name: Lampa.Lang.translate('select_ratings_button_name'),
                description: Lampa.Lang.translate('select_ratings_button_desc')
            },
            // onChange for button type = action on click/enter
            onChange: function () {
                // Call our helper function to show the selection dialog
                showRatingProviderSelection();
            }
        });
                
        // 4. Add Toggle for Replacing Title with Logo (with explicit save)
        Lampa.SettingsApi.addParam({
            component: 'additional_ratings',        // Target the same category
            param: {
                name: 'show_logo_instead_of_title', // The key used for storage
                type: 'select',                     // Use select for On/Off toggle
                values: {                           // Define the options
                    'true': Lampa.Lang.translate('settings_show'), // "Show" / "On"
                    'false': Lampa.Lang.translate('settings_hide') // "Hide" / "Off"
                },
                'default': 'false'                  // Default value is Off
            },
            field: {
                name: Lampa.Lang.translate('logo_toggle_name'), // Use translation key for name
                description: Lampa.Lang.translate('logo_toggle_desc') // Use translation key for description
            },
                
            onChange: function(value) {
                var storageKey = 'show_logo_instead_of_title'; // Make sure this matches param.name
                Lampa.Storage.set(storageKey, value); // Save to storage
            }


        });
                
        // 5. Add Setting for Info Panel Logo Height
        Lampa.SettingsApi.addParam({
            component: 'additional_ratings', // Keep in the same settings section
            param: {
                name: 'info_panel_logo_max_height', // Storage key
                type: 'select',
                values: {
                    '50': '50px',
                    '75': '75px',
                    '100': '100px',
                    '125': '125px',
                    '150': '150px',
                    '175': '175px',
                    '200': '200px',
                    '225': '225px',
                    '250': '250px',
                    '300': '300px',
                    '350': '350px',
                    '400': '400px',
                    '450': '450px',
                    '500': '500px'
                },
                'default': '100'
            },
            field: {
                name: Lampa.Lang.translate('info_panel_logo_height_name'), // Use new translation
                description: Lampa.Lang.translate('info_panel_logo_height_desc') // Use new translation
            },
            onChange: function(value) {
                // Explicitly save the selected value
                Lampa.Storage.set('info_panel_logo_max_height', value);
            }
        });



    } else {
        console.error("MDBLIST_Fetcher: Lampa.SettingsApi not available. Cannot create API Key setting.");
    }

    // --- Network Instance ---
    // Use Lampa.Reguest if available for consistency and potential benefits
    var network = (window.Lampa && Lampa.Reguest) ? new Lampa.Reguest() : null;

    // --- Caching Functions ---
    function getCache(tmdb_id) {
        // Ensure Lampa Storage is available for caching
        if (!window.Lampa || !Lampa.Storage) return false;
        var timestamp = new Date().getTime();
        var cache = Lampa.Storage.cache(config.cache_key, config.cache_limit, {}); // Use Lampa's cache utility

        if (cache[tmdb_id]) {
            // Check if cache entry has expired
            if ((timestamp - cache[tmdb_id].timestamp) > config.cache_time) {
                delete cache[tmdb_id];
                Lampa.Storage.set(config.cache_key, cache); // Update storage after removing expired entry
                return false;
            } 
          return cache[tmdb_id].data; // Return cached data { imdb: ..., tmdb: ..., etc... }
        }
        return false;
    }

    function setCache(tmdb_id, data) {
        // Ensure Lampa Storage is available
        if (!window.Lampa || !Lampa.Storage) return;
        var timestamp = new Date().getTime();
        var cache = Lampa.Storage.cache(config.cache_key, config.cache_limit, {});
        // Store data along with a timestamp
        cache[tmdb_id] = {
            timestamp: timestamp,
            data: data
        };
        Lampa.Storage.set(config.cache_key, cache); // Save updated cache to storage
      }

    // --- Core Fetching Logic ---
    /**
     * Fetches ratings for a given movie/show from MDBList.
     * @param {object} movieData - Object containing movie details. Requires 'id' (TMDB ID) and 'method' ('movie' or 'tv').
     * @param {function} callback - Function to call with the result object (e.g., {imdb: 7.5, tmdb: 8.0, error: null}) or error ({error: 'message'}).
     */
    function fetchRatings(movieData, callback) {
        // Check if Lampa components are available
        if (!network) {
             console.error("MDBLIST_Fetcher: Lampa.Reguest not available.");
             if (callback) callback({ error: "Network component unavailable" });
             return;
        }
        if (!window.Lampa || !Lampa.Storage) {
             console.error("MDBLIST_Fetcher: Lampa.Storage not available.");
             if (callback) callback({ error: "Storage component unavailable" });
             return;
        }

        // Validate input data
        if (!movieData || !movieData.id || !movieData.method || !callback) {
             console.error("MDBLIST_Fetcher: Invalid input - requires movieData object with 'id' and 'method' ('movie'/'tv'), and a callback function.");
             if (callback) callback({ error: "Invalid input data" });
             return;
        }

        var tmdb_id = movieData.id;

        // 1. Check Cache
        var cached_ratings = getCache(tmdb_id);
        if (cached_ratings) {
            // If valid cache exists, return it immediately via callback
            callback(cached_ratings);
            return;
        }

        // 2. Get API Key from Storage
        var apiKey = Lampa.Storage.get('mdblist_api_key');
        if (!apiKey) {
            // No need to cache this error, as it depends on user config
            // Updated error message to reflect 'Additional Ratings' section
            callback({ error: "MDBList API Key not configured in Additional Ratings settings" });
            return;
        }

        // 3. Prepare API Request
        // MDBList uses 'show' for TV series
        var media_type = movieData.method === 'tv' ? 'show' : 'movie';
        // Construct URL using the retrieved API key
        var api_url = "".concat(config.api_url).concat(media_type, "/").concat(tmdb_id, "?apikey=").concat(apiKey);

        
        // 4. Make Network Request using Lampa.Request
        network.clear(); // Clear previous requests on this instance
        network.timeout(config.request_timeout);
        network.silent(api_url, function (response) {
            // --- Success Callback ---
            var ratingsResult = { error: null }; // Initialize result object

            if (response && response.ratings && Array.isArray(response.ratings)) {
                 // Populate result object dynamically from the ratings array
                 response.ratings.forEach(function(rating) {
                     // Use source name directly as key, only if value is not null
                     if (rating.source && rating.value !== null) {
                          ratingsResult[rating.source] = rating.value;
                     }
                 });
            } else if (response && response.error) {
                // Handle specific errors from MDBList API (e.g., invalid key)
                console.error("MDBLIST_Fetcher: API Error from MDBList for TMDB ID:", tmdb_id, response.error);
                ratingsResult.error = "MDBList API Error: " + response.error;
            }
             else {
                 console.error("MDBLIST_Fetcher: Invalid response format received from MDBList for TMDB ID:", tmdb_id, response);
                 ratingsResult.error = "Invalid response format from MDBList";
            }

            // Cache the processed result (even if it's just {error: ...})
            // Only cache successful results or non-auth related errors
            if (ratingsResult.error === null || (ratingsResult.error && !ratingsResult.error.toLowerCase().includes("invalid api key"))) {
                 setCache(tmdb_id, ratingsResult);
            }
            // Execute the original callback with the result
            callback(ratingsResult);

        }, function (xhr, status) {
            // --- Error Callback ---
            var errorMessage = "MDBList request failed";
            if (status) { errorMessage += " (Status: " + status + ")"; }
            // Avoid logging the full URL which contains the API key
            console.error("MDBLIST_Fetcher:", errorMessage, "for TMDB ID:", tmdb_id);

            var errorResult = { error: errorMessage };

            // Cache the error state to prevent rapid retries on persistent failures
            // Avoid caching auth-related errors (like 401 Unauthorized) caused by bad keys
            if (status !== 401 && status !== 403) {
                setCache(tmdb_id, errorResult);
            }
            // Execute the original callback with the error result
            callback(errorResult);
        }); // End network.silent
    } // End fetchRatings

    // --- MDBList Fetcher State ---
    var mdblistRatingsCache = {};
    var mdblistRatingsPending = {};
    // -----------------------------


    // Function to display the multi-select dialog for rating providers
    function showRatingProviderSelection() {
        // Define the available rating providers
        // 'id' MUST match the Lampa.Storage key used by create.draw (e.g., 'show_rating_imdb')
        // 'default' MUST match the default value defined for the original trigger
        const providers = [
            { title: 'IMDb', id: 'show_rating_imdb', default: true },
            { title: 'TMDB', id: 'show_rating_tmdb', default: true },
            // { title: 'KinoPoisk', id: 'show_rating_kp', default: true }, // 
            { title: 'Rotten Tomatoes (Critics)', id: 'show_rating_tomatoes', default: false },
            { title: 'Rotten Tomatoes (Audience)', id: 'show_rating_audience', default: false },
            { title: 'Metacritic', id: 'show_rating_metacritic', default: false },
            { title: 'Trakt', id: 'show_rating_trakt', default: false },
            { title: 'Letterboxd', id: 'show_rating_letterboxd', default: false },
            { title: 'Roger Ebert', id: 'show_rating_rogerebert', default: false }
        ];

        // Prepare items array for Lampa.Select.show
        let selectItems = providers.map(provider => {
            let storedValue = Lampa.Storage.get(provider.id, provider.default);
            let isChecked = (storedValue === true || storedValue === 'true');
            return {
                title: provider.title,
                id: provider.id,          // Use the storage key as the item ID
                checkbox: true,         // Display as a checkbox
                checked: isChecked,       // Set initial state based on storage
                default: provider.default // Pass default for toggle logic in onCheck
            };
        });

        // Get current controller context to return correctly with 'Back'
        var currentController = Lampa.Controller.enabled().name;

        // Use Lampa's built-in Select component
        Lampa.Select.show({
            title: Lampa.Lang.translate('select_ratings_dialog_title'), // Translated title
            items: selectItems,                                        // Items with checkboxes
            onBack: function () {                                      // Handler for Back button
                Lampa.Controller.toggle(currentController || 'settings');
            },
            onCheck: function (item) { // Handler for when ANY checkbox is toggled
                // Read the definitive OLD state from storage using item's ID
                let oldValue = Lampa.Storage.get(item.id, item.default);
                let oldStateIsChecked = (oldValue === true || oldValue === 'true');

                // Calculate the NEW state
                let newStateIsChecked = !oldStateIsChecked;

                // Save the NEW state directly to Lampa.Storage under the specific key (e.g., 'show_rating_imdb')
                Lampa.Storage.set(item.id, newStateIsChecked);

                // Update the visual state of the checkbox in the dialog UI
                item.checked = newStateIsChecked;

                // NOTE: We don't call Lampa.Settings.update() here. We're saving directly.
                // The draw function will read these storage keys next time it runs.
            }
        });
    } // End of showRatingProviderSelection function
  
    // --- create function (Info Panel Handler) ---
    // UNCHANGED create function...
    function create() { 
        
        var html;
        var timer; 
        var network = new Lampa.Reguest(); 
        var loaded = {}; 
        
        this.create = function () { // --- Original this.create --- //
             
        }; 
        
        this.update = function(data) { // Called on focus change with new movie data
            var _this = this; // Keep if needed by fetchRatings callback's use of this.draw

            // Ensure 'html' panel element is ready before doing anything
            if (!html) {
                console.error("create.update: 'html' element not ready.");
                return;
            }
            // Ensure 'data' has minimum required fields (like id, title for fallbacks)
            if (!data || !data.id || !data.title) {
                 console.warn("create.update: Received incomplete 'data'.", data);
                 // Clear relevant fields if data is bad? Or return? Returning is safer.
                 return;
            }

            // --- Standard updates (non-title, non-description text) ---
            html.find('.new-interface-info__head, .new-interface-info__details').text('---'); // Placeholder
            Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200'));
            delete mdblistRatingsCache[data.id]; // Existing logic for ratings
            delete mdblistRatingsPending[data.id]; // Existing logic for ratings
            // --- End Standard updates ---

            // --- Set Description Text ---
            // Set the actual description text content first
            var descriptionText = data.overview || Lampa.Lang.translate('full_notext');
            html.find('.new-interface-info__description').text(descriptionText);
            // --- End Set Description Text ---


            // --- Determine Logo Setting ---
            var storageKey = 'show_logo_instead_of_title';
            var showLogos = (Lampa.Storage.get(storageKey, 'false') === 'true' || Lampa.Storage.get(storageKey, false) === true);
            

            // --- Adjust Description Line Clamp Based on Setting ---
            var descElement = html.find('.new-interface-info__description');
            if (descElement.length) {
                var targetLineClamp = showLogos ? '2' : '4'; // Determine target clamp value
                descElement.css({ // Apply styles directly
                    '-webkit-line-clamp': targetLineClamp,
                    'line-clamp': targetLineClamp
                    // 'display': '-webkit-box' // This should be set by the main CSS rule already
                });
            }
            // --- End Adjust Line Clamp ---


            // --- Title Handling ---
            if (showLogos && data.method && data.title) { // Ensure method exists for logo fetch
                            // --- End Title Handling ---


            // --- Ratings Fetch (existing logic) ---
            if (data.id && data.method) {
                mdblistRatingsPending[data.id] = true;
                fetchRatings(data, function(mdblistResult) {
                    mdblistRatingsCache[data.id] = mdblistResult;
                    delete mdblistRatingsPending[data.id];
                    var tmdb_url = Lampa.TMDB.api((data.name ? 'tv' : 'movie') + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get('language'));
                    // Ensure 'loaded' is defined/accessible in this scope if used here
                    // Check if 'loaded' was defined within 'create' scope originally
                    if (typeof loaded !== 'undefined' && loaded[tmdb_url]) {
                         _this.draw(loaded[tmdb_url]);
                    }
                });
            }
            // --- End Ratings Fetch ---


            // --- Load supplementary TMDB data (existing logic) ---
            this.load(data);

        }; // --- END of this.update function ---

        this.draw = function (data) {
            var create_year = ((data.release_date || data.first_air_date || '0000') + '').slice(0, 4);
            var vote = parseFloat((data.vote_average || 0) + '').toFixed(1);
            var head = [];
            // ** Initialize separate arrays for layout lines **
            var lineOneDetails = []; // To hold Ratings, Runtime, PG
            var genreDetails = [];   // To hold only Genres string
            var countries = Lampa.Api.sources.tmdb.parseCountries(data);
            var pg = Lampa.Api.sources.tmdb.parsePG(data);

            // --- Logo URLs --- 
            
            
            
            
            
            
            
            
            
            
            

            // --- Rating Toggles State --- (Unchanged - read all needed for line 1)
            let imdbStored = Lampa.Storage.get('show_rating_imdb', true);
            const showImdb = (imdbStored === true || imdbStored === 'true');
            let tmdbStored = Lampa.Storage.get('show_rating_tmdb', true);
            const showTmdb = (tmdbStored === true || tmdbStored === 'true');
            // No need to read KP toggle anymore
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

            // --- Build Head --- (Unchanged)
            if (create_year !== '0000') head.push('<span>' + create_year + '</span>');
            if (countries.length > 0) head.push(countries.join(', '));

            // --- Get MDBList Rating Results --- (Unchanged)
            var mdblistResult = mdblistRatingsCache[data.id];

            // --- Build Line 1 Details (Ratings) ---
            // Push all active rating divs into lineOneDetails
            if (showImdb) {
                var imdbRating = mdblistResult && mdblistResult.imdb !== null && typeof mdblistResult.imdb === 'number' ? parseFloat(mdblistResult.imdb || 0).toFixed(1) : '0.0';
            }
            if (showTmdb) {
            }
            if (showTomatoes) {
            }
            if (showAudience) {
            }
            if (showMetacritic) {
            }
            if (showTrakt) {
            }
            if (showLetterboxd) {
            }
            if (showRogerebert) {
            }


            // --- Build Line 1 Details (Runtime, PG) ---
            // Push Runtime and PG into lineOneDetails array
            if (data.runtime) {
                lineOneDetails.push(Lampa.Utils.secondsToTime(data.runtime * 60, true));
            }
            if (pg) {
                lineOneDetails.push('<span class="full-start__pg" style="font-size: 0.9em;">' + pg + '</span>');
            }

            // --- Build Genre Details ---
            // Push ONLY the Genres string into genreDetails array
            if (data.genres && data.genres.length > 0) {
                genreDetails.push(data.genres.map(function (item) { return Lampa.Utils.capitalizeFirstLetter(item.name); }).join(' | '));
            }

            // --- Update HTML ---
            html.find('.new-interface-info__head').empty().append(head.join(', '));

            // ** Construct final details HTML with specific lines **
            let lineOneHtml = lineOneDetails.join('<span class="new-interface-info__split">&#9679;</span>');
            // Genres string is already joined by '|', so just get the first element if it exists
            let genresHtml = genreDetails.length > 0 ? genreDetails[0] : '';

            let finalDetailsHtml = '';
            // Add line 1 (Ratings, Runtime, PG) if it has content
            if (lineOneDetails.length > 0) {
                 finalDetailsHtml += `<div class="line-one-details">${lineOneHtml}</div>`;
            }
            // Add line 2 (Genres) if it has content
             if (genresHtml) {
                 finalDetailsHtml += `<div class="genre-details-line">${genresHtml}</div>`;
             }

            // Set the new HTML structure into the details element
            html.find('.new-interface-info__details').html(finalDetailsHtml);
        }; // End draw function
                       
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
            // --- Helper Method INSIDE create() ---
        this.displayLogoOrTitle = function(movieData) {
            // 'html' is accessible here from the outer 'create' scope
            if (!html) return; // Ensure panel element exists
            var titleElement = html.find('.new-interface-info__title');
            if (!titleElement.length) return; // Ensure title element exists

            // Ensure movieData is valid before proceeding
            if (!movieData || !movieData.id || !movieData.method || !movieData.title) {
                console.warn("displayLogoOrTitle: Invalid movieData received.");
                titleElement.empty(); // Clear title area if data is bad
                return;
            }

            var id = movieData.id;
            titleElement.text(movieData.title); // Set text placeholder immediately

            // Use the global network instance (ensure it's defined and accessible)
            if (!network) { console.error("displayLogoOrTitle: Global network missing."); return; }

            var method = movieData.method;
            var apiKey = Lampa.TMDB.key();
            var language = Lampa.Storage.get('language');
            var apiUrl = Lampa.TMDB.api((method === 'tv' ? 'tv/' : 'movie/') + id + '/images?api_key=' + apiKey + '&language=' + language);


            network.clear(); // Clear previous logo requests on the global instance
            network.timeout(config.request_timeout || 7000);
            network.silent(apiUrl, function (response) { // SUCCESS CALLBACK
                var logoPath = null;
                // Find the best logo path from response
                if (response && response.logos && response.logos.length > 0) {
                    var pngLogo = response.logos.find(logo => logo.file_path && !logo.file_path.endsWith('.svg'));
                    logoPath = pngLogo ? pngLogo.file_path : response.logos[0].file_path;
                }

                // --- Find element AGAIN inside callback and update ---
                // Use the 'html' variable from the outer 'create' scope
                var currentTitleElement = html ? html.find('.new-interface-info__title') : null;

                if (currentTitleElement && currentTitleElement.length) {
                    if (logoPath) {
                         // --- Read Height Setting and Build Style ---
                         var selectedHeight = Lampa.Storage.get('info_panel_logo_max_height', '100'); // Read saved height, default 100
                         // Basic validation to ensure it's a number string, default to '100' otherwise
                         if (!/^\d+$/.test(selectedHeight)) {
                             console.warn(`Invalid logo height '${selectedHeight}' found in storage, using default '100'.`); // Optional warning
                             selectedHeight = '100';
                         }

                         var imageSize = 'original'; // Request a decent size image source
                         // Dynamically create the style string using the selected height
                         var styleAttr = `max-height: ${selectedHeight}px; max-width: 100%; vertical-align: middle; margin-bottom: 0.1em;`;
                         // --- End Style Building ---

                         var imgUrl = Lampa.TMDB.image('/t/p/' + imageSize + logoPath);
                         currentTitleElement.empty().html(imgTagHtml); // Update with fresh reference
                    } else {
                         currentTitleElement.text(movieData.title); // Ensure text is set if no logo
                    }
                } else {
                     // Cannot update UI if element is gone
                }

            }, function(xhr, status) { // ERROR CALLBACK
                 console.error(`displayLogoOrTitle (ID ${id}): API Error ${status}. Ensuring text remains.`);
                 // Ensure text title is displayed on error
                 var currentTitleElement = html ? html.find('.new-interface-info__title') : null;
                  if (currentTitleElement && currentTitleElement.length) {
                      // Check movieData exists before accessing title
                      if(movieData && movieData.title) {
                           currentTitleElement.text(movieData.title);
                      } else {
                           currentTitleElement.empty(); // Clear if no title available
                      }
                  }
            }); // End network.silent
        }; // --- End of displayLogoOrTitle ---
        
        this.empty = function () {};
        
        this.destroy = function () { // --- ORIGINAL this.destroy --- //
            html.remove(); 
            loaded = {}; 
            html = null; 
            mdblistRatingsCache = {}; 
            mdblistRatingsPending = {}; 
        }; 
    }


    // --- component function (Main List Handler) ---
    // ORIGINAL FUNCTION - UNCHANGED
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
                url: element.url, card_small: true, cardClass: element.cardClass, genres: object.genres, object: object, card_wide: true, nomore: element.nomore 
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
        // UNCHANGED Initialization setup...
        if (!window.Lampa || !Lampa.Utils || !Lampa.Lang || !Lampa.Storage || !Lampa.TMDB || !Lampa.Template || !Lampa.Reguest || !Lampa.Api || !Lampa.InteractionLine || !Lampa.Scroll || !Lampa.Activity || !Lampa.Controller) { 
            console.error("NewInterface Adjust Padding: Missing Lampa components"); 
            return; 
        }
        
        window.plugin_interface_ready = true; 
        var old_interface = Lampa.InteractionMain; 
        var new_interface = component;
        
        // --- Add Listener for Full Card Logo Replacement (Complete Logic) ---
        if (Lampa.Listener && network) { // Check Listener and global network
            Lampa.Listener.follow("full", function(eventData) {
                var storageKey = 'show_logo_instead_of_title';
                try {
                    // Check if logo display is enabled
                    var showLogos = (Lampa.Storage.get(storageKey, 'false') === 'true' || Lampa.Storage.get(storageKey, false) === true);

                    // Only proceed if the view is complete and logos should be shown
                    if (eventData.type === 'complite' && showLogos) {
                        var movie = eventData.data.movie;

                        // Check for essential movie data
                        if (movie && movie.id && movie.title) {
                            movie.method = movie.name ? 'tv' : 'movie'; // Determine method if needed
                            var id = movie.id;

                            // Find the target element where the title/logo goes
                            // We need to potentially re-find this inside callbacks
                            var initialTargetElement = $(eventData.object.activity.render()).find(".full-start-new__title");

                            if (initialTargetElement.length > 0) {
                                // --- Set text title as placeholder immediately ---
                                initialTargetElement.text(movie.title);

                                // --- Fetch the logo ---
                                if (!network) { console.error("Listener (Full): Global network missing."); return; }

                                var apiKey = Lampa.TMDB.key();
                                var language = Lampa.Storage.get('language');
                                var apiUrl = Lampa.TMDB.api((movie.method === 'tv' ? 'tv/' : 'movie/') + id + '/images?api_key=' + apiKey + '&language=' + language);

                                network.clear(); // Clear previous requests on the global instance
                                network.timeout(config.request_timeout || 7000);
                                network.silent(apiUrl, function (response) { // SUCCESS CAL
                                    var logoPath = null;
                                    // Find the best logo path
                                    if (response && response.logos && response.logos.length > 0) {
                                        var pngLogo = response.logos.find(logo => logo.file_path && !logo.file_path.endsWith('.svg'));
                                        logoPath = pngLogo ? pngLogo.file_path : response.logos[0].file_path;
                                    }

                                    // --- Re-find the element inside callback and update ---
                                    // Use the eventData again to ensure we have the right context
                                    var currentTargetElement = $(eventData.object.activity.render()).find(".full-start-new__title");

                                    if (currentTargetElement.length > 0) {
                                        if (logoPath) {
                                            // --- Read Height Setting
                                            var selectedHeight = Lampa.Storage.get('info_panel_logo_max_height', '60'); // Read same setting, default 60
                                            if (!/^\d+$/.test(selectedHeight)) { selectedHeight = '75'; } // Basic validation
                                            var imageSize = 'original'; // Size suitable for details page title
                                            var styleAttr = `margin-top: 5px; max-height: ${selectedHeight}px; max-width: 100%; vertical-align: middle;`; // Use selectedHeight
                                            var imgUrl = Lampa.TMDB.image('/t/p/' + imageSize + logoPath);
                                            currentTargetElement.empty().html(imgTagHtml); // Update with fresh reference
                                        } else {
                                            currentTargetElement.text(movie.title); // Ensure text is set if no logo
                                        }
                                    } else {
                                    }

                                }, function(xhr, status) { // ERROR CALLBACK
                                     console.error(`Listener (Full ID: ${id}): API Error ${status}. Ensuring text remains.`);
                                     // Ensure text title is displayed on error by re-finding element
                                     var currentTargetElement = $(eventData.object.activity.render()).find(".full-start-new__title");
                                      if (currentTargetElement && currentTargetElement.length) {
                                          currentTargetElement.text(movie.title);
                                      }
                                }); // End network.silent

                            } // End if initialTargetElement found
                        } // End if movie data valid
                    } // End if complite and showLogos
                } catch (e) { console.error("Logo Listener (Full): Error in callback:", e); }
            }); // End Lampa.Listener.follow
        } else {
             console.error("Logo Feature: Lampa.Listener or Global Network Instance not available. Full card logo disabled.");
        }
        // --- End Listener for Full Card ---
    
        // --- Override Lampa.InteractionMain --- (existing code)
        Lampa.InteractionMain = function (object) { 
            var use = new_interface; 
            if (!(object.source == 'tmdb' || object.source == 'cub')) use = old_interface; 
            if (window.innerWidth < 767) use = old_interface; 
            if (!Lampa.Account.hasPremium()) use = old_interface; 
            if (Lampa.Manifest.app_digital < 153) use = old_interface; 
            return new use(object); 
        };

        // **MODIFIED CSS**: Adjusted padding for number divs
        var style_id = 'new_interface_style_adjusted_padding'; // Style ID
        if (!$('style[data-id="' + style_id + '"]').length) {
             $('style[data-id^="new_interface_style_"]').remove(); // Clean up previous

            Lampa.Template.add(style_id, `
            <style data-id="${style_id}">
            /* Base styles... (kept from pivot point script) */
            .new-interface .card--small.card--wide { width: 18.3em; }
            .new-interface-info { position: relative; padding: 1.5em; height: 24em; } /* original was 24em*/
            /* ... rest of base styles identical to pivot script ... */
            .new-interface-info__body { width: 80%; padding-top: 1.1em; }
            .new-interface-info__head { color: rgba(255, 255, 255, 0.6); margin-bottom: 1em; font-size: 1.3em; min-height: 1em; }
            .new-interface-info__head span { color: #fff; }
            .new-interface-info__title { font-size: 4em; font-weight: 600; margin-bottom: 0.3em; overflow: hidden; text-overflow: "."; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; margin-left: -0.03em; line-height: 1.3; }
            /* .new-interface-info__details { margin-bottom: 1.6em; display: flex; align-items: center; flex-wrap: wrap; min-height: 1.9em; font-size: 1.1em; } */
                        
            .new-interface-info__details {
                margin-bottom: 1em; 
                display: block;
                min-height: 1.9em;
                font-size: 1.1em;
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
            .new-interface-info__description { font-size: 1.2em; font-weight: 300; line-height: 1.5; overflow: hidden; text-overflow: "."; display: -webkit-box; -webkit-line-clamp: 4; line-clamp: 4; -webkit-box-orient: vertical; width: 70%; }
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
                font-size: 1.3em;        /* Lampa Source base size is 1.3, we had it 1.45 */
                margin-right: 0em;        /* modified was 1em */
                display: inline-flex;
                align-items: center;
                vertical-align: middle;
                background-color: rgba(255, 255, 255, 0.12); /* Light wrapper background */
                padding: 0 0.2em 0 0; /* Zero Left Padding */
                border-radius: 0.3em;  /* Smoother edges */
                gap: 0.4em; /* modified was 0.5 */
                overflow: hidden;
                height: auto;
            }
            /* Style for the Number Div (common to all ratings) */
            .new-interface .full-start__rate > div {
                font-weight: normal;      /* Normal weight */
                font-size: 0.9em;         /* Changing back to original from 0.9 */
                justify-content: center;  /* From source analysis */
                background-color: rgba(0, 0, 0, 0.4); /* Darker background */
                color: #ffffff;
                padding: 0em 0.2em;     /* ** MODIFIED: Narrower L/R padding (was 0.3em) ** */
                border-radius: 0.3em;       /* Smoother edges */
                line-height: 1;          /* MODIFIED: Was 1.3 */
                order: 1;
                display: flex;
                align-items: center;
                flex-shrink: 0;
            }
         
            /* General Logo Style - UNCHANGED from pivot point */
            .rating-logo {
                height: 1.1em;
                width: auto;
                max-width: 75px; /* changed from 55 */
                vertical-align: middle;
                order: 2;
                line-height: 0;
            }
             /* Specific Logo Adjustments - UNCHANGED from pivot point */
            .tmdb-logo { height: 0.9em; }
            .rt-logo { height: 1.1em; }
            /* --- End Rating Box Styles --- */

            </style>
            `);
          $('body').append(Lampa.Template.get(style_id, {}, true));
        }
    }

    // Original check before starting
    if (!window.plugin_interface_ready) startPlugin();

})();


/*

Для получения данных с кинопоиск используется https://kinopoiskapiunofficial.tech/ - получите API ключ 
Для получения данных Metacritic, Tomatoes, наград испольузется https://www.omdbapi.com/ - получите API ключ 

Можно использовать одиночный ключ или массив ключей, после получения API ключей передайте их как массивы через:
    window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.OMDB_API_KEYS
Или просто введите ниже в коде плагина:
    var OMDB_API_KEYS = (window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.OMDB_API_KEYS) || ['YOU_KEY']; // api ключи массивом
    var KP_API_KEYS   = (window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.KP_API_KEYS)   || ['YOU_KEY']; // api ключи массивом

Для получения данных о качестве используется jacred парсер, по умолчанию плагин настроен на получение адреса и ключа вашего введеного jacred,
вы можете изменить это в переменных:
    var JACRED_PROTOCOL = 'https://'; // Протокол JacRed
    var JACRED_URL = Lampa.Storage.get('jackett_url'); // Адрес JacRed для получения информации о карточках без протокола (jacred.xyz)
    var JACRED_API_KEY = Lampa.Storage.get('jackett_key'); // api ключ JacRed

*/

(function() {
    'use strict';
  
    
    
    
    
        
    
    
    
    
    

    
    Lampa.Lang.add({
         maxsm_ratings: {
            ru: 'Рейтинг и качество',
            en: 'Rating & Quality',
            uk: 'Рейтинг і якість',
            be: 'Рэйтынг і якасць',
            pt: 'Classificação e Qualidade',
            zh: '评分与画质',
            he: 'דירוג ואיכות',
            cs: 'Hodnocení a kvalita',
            bg: 'Рейтинг и качество'
        },
        maxsm_ratings_cc: {
            ru: 'Очистить локальный кеш',
            en: 'Clear local cache',
            uk: 'Очистити локальний кеш',
            be: 'Ачысціць лакальны кэш',
            pt: 'Limpar cache local',
            zh: '清除本地缓存',
            he: 'נקה מטמון מקומי',
            cs: 'Vymazat místní mezipaměť',
            bg: 'Изчистване на локалния кеш'
        },
        maxsm_ratings_critic: {
            ru: 'Оценки критиков',
            en: 'Critic Ratings',
            uk: 'Оцінки критиків',
            be: 'Ацэнкі крытыкаў',
            pt: 'Avaliações da crítica',
            zh: '影评人评分',
            he: 'דירוגי מבקרים',
            cs: 'Hodnocení kritiků',
            bg: 'Оценки на критиците'
        },
        maxsm_ratings_mode: {
            ru: 'Средний рейтинг',
            en: 'Average rating',
            uk: 'Середній рейтинг',
            be: 'Сярэдні рэйтынг',
            pt: 'Classificação média',
            zh: '平均评分',
            he: 'דירוג ממוצע',
            cs: 'Průměrné hodnocení',
            bg: 'Среден рейтинг'
        },
        maxsm_ratings_mode_normal: {
            ru: 'Показывать средний рейтинг',
            en: 'Show average rating',
            uk: 'Показувати середній рейтинг',
            be: 'Паказваць сярэдні рэйтынг',
            pt: 'Mostrar classificação média',
            zh: '显示平均评分',
            he: 'הצג דירוג ממוצע',
            cs: 'Zobrazit průměrné hodnocení',
            bg: 'Показване на среден рейтинг'
        },
        maxsm_ratings_mode_simple: {
            ru: 'Только средний рейтинг',
            en: 'Only average rating',
            uk: 'Лише середній рейтинг',
            be: 'Толькі сярэдні рэйтынг',
            pt: 'Apenas classificação média',
            zh: '仅显示平均评分',
            he: 'רק דירוג ממוצע',
            cs: 'Pouze průměrné hodnocení',
            bg: 'Само среден рейтинг'
        },
        maxsm_ratings_mode_noavg: {
            ru: 'Без среднего рейтинга',
            en: 'No average',
            uk: 'Без середнього рейтингу',
            be: 'Без сярэдняга рэйтынгу',
            pt: 'Sem média',
            zh: '无平均值',
            he: 'ללא ממוצע',
            cs: 'Bez průměru',
            bg: 'Без среден рейтинг'
        }, 
        maxsm_ratings_icons: {
            ru: 'Значки',
            en: 'Icons',
            uk: 'Значки',
            be: 'Значкі',
            pt: 'Ícones',
            zh: '图标',
            he: 'סמלים',
            cs: 'Ikony',
            bg: 'Икони'
        },
        maxsm_ratings_colors: {
            ru: 'Цвета',
            en: 'Colors',
            uk: 'Кольори',
            be: 'Колеры',
            pt: 'Cores',
            zh: '颜色',
            he: 'צבעים',
            cs: 'Barvy',
            bg: 'Цветове'
        },
        maxsm_ratings_avg: {
            ru: 'ИТОГ',
            en: 'TOTAL',
            uk: 'ПІДСУМОК',
            be: 'ВЫНІК',
            pt: 'TOTAL',
            zh: '总评',
            he: 'סה"כ',
            cs: 'VÝSLEDEK',
            bg: 'РЕЗУЛТАТ'
        },
        maxsm_ratings_avg_simple: {
            ru: 'Оценка',
            en: 'Rating',
            uk: 'Оцінка',
            be: 'Ацэнка',
            pt: 'Avaliação',
            zh: '评分',
            he: 'דירוג',
            cs: 'Hodnocení',
            bg: 'Оценка'
        },
        maxsm_ratings_loading: {
            ru: 'Загрузка',
            en: 'Loading',
            uk: 'Завантаження',
            be: 'Загрузка',
            pt: 'Carregando',
            zh: '加载中',
            he: 'טוען',
            cs: 'Načítání',
            bg: 'Зареждане'
        },
        maxsm_ratings_oscars: { 
            ru: 'Оскар',
            en: 'Oscar',
            uk: 'Оскар',
            be: 'Оскар',
            pt: 'Oscar',
            zh: '奥斯卡奖',
            he: 'אוסקר',
            cs: 'Oscar',
            bg: 'Оскар'
        },
        maxsm_ratings_emmy: {
            ru: 'Эмми',
            en: 'Emmy',
            uk: 'Еммі',
            be: 'Эммі',
            pt: 'Emmy',
            zh: '艾美奖',
            he: 'אמי',
            cs: 'Emmy',
            bg: 'Еми'
        },
        maxsm_ratings_awards: {
            ru: 'Награды',
            en: 'Awards',
            uk: 'Нагороди',
            be: 'Узнагароды',
            pt: 'Prêmios',
            zh: '奖项',
            he: 'פרסים',
            cs: 'Ocenění',
            bg: 'Награди'
        },
        maxsm_ratings_quality: {
            ru: 'Качество внутри карточек',
            en: 'Quality inside cards',
            uk: 'Якість всередині карток',
            be: 'Якасць унутры картак',
            pt: 'Qualidade dentro dos cartões',
            zh: '卡片内的质量',
            he: 'איכות בתוך כרטיסים',
            cs: 'Kvalita uvnitř karet',
            bg: 'Качество вътре в картите'
        },
        maxsm_ratings_quality_inlist: {
            ru: 'Качество на карточках',
            en: 'Quality on cards',
            uk: 'Якість на картках',
            be: 'Якасць на картках',
            pt: 'Qualidade nos cartões',
            zh: '卡片上的质量',
            he: 'איכות בכרטיסים',
            cs: 'Kvalita na kartách',
            bg: 'Качество по картите'
        },
        maxsm_ratings_quality_tv: {
            ru: 'Качество для сериалов',
            en: 'Quality for series',
            uk: 'Якість для серіалів',
            be: 'Якасць для серыялаў',
            pt: 'Qualidade para séries',
            zh: '剧集的质量',
            he: 'איכות לסדרות',
            cs: 'Kvalita pro seriály',
            bg: 'Качество за сериали'
        }
    });

    // Стили
    var modalStyle = "<style id=\"maxsm_ratings_modal\">" +
        ".maxsm-quality {" +
        "background: #FFD700;" +
        "color: #000;" +
        "font-weight: bold;" +
        ".maxsm-modal-ratings {" +
        "    padding: 1.25em;" +
        "    font-size: 1.4em;" +
        "    line-height: 1.6;" +
        "}" +
        ".maxsm-modal-rating-line {" +
        "    padding: 0.5em 0;" +
        "    border-bottom: 0.0625em solid rgba(255, 255, 255, 0.1);" +
        "}" +
        ".maxsm-modal-rating-line:last-child {" +
        "    border-bottom: none;" +
        "}" +
        ".maxsm-modal-imdb { color: #f5c518; }" +
        ".maxsm-modal-kp { color: #4CAF50; }" +
        ".maxsm-modal-tmdb { color: #01b4e4; }" +
        ".maxsm-modal-rt { color: #fa320a; }" +
        ".maxsm-modal-mc { color: #6dc849; }" +
        ".maxsm-modal-oscars, .maxsm-modal-emmy, .maxsm-modal-awards { color: #FFD700; }" +
        "</style>";
    
    Lampa.Template.add('maxsm_ratings_modal', modalStyle);
    $('body').append(Lampa.Template.get('maxsm_ratings_modal', {}, true));
    
    var style = "<style id=\"maxsm_ratings\">" +
        ".full-start-new__rate-line {" +
        "visibility: hidden;" +
        //"flex-wrap: wrap;" +
        //"gap: 0.4em 0;" +
        "}" +
        ".full-start-new__rate-line > * {" +
        "margin-right: 0.5em !important;" +
        "}" +
        ".rate--green  { color: #4caf50; }" +
        ".rate--lime   { color: #cddc39; }" +
        ".rate--orange { color: #ff9800; }" +
        ".rate--red    { color: #f44336; }" +
        ".rate--gold   { color: gold; }" +
        ".rate--icon    { height: 1.8em; }" +
        ".full-start__rate > div:last-child { padding: 0.2em 0.4em; }" +
        ".jr { min-width: 5.0em; }" +
        ".rutor { min-width: 7.0em; }" +
        ".maxsm-quality { min-width: 2.8em; text-align: center; }" +
        "</style>";
    
    Lampa.Template.add('maxsm_ratings_css', style);
    $('body').append(Lampa.Template.get('maxsm_ratings_css', {}, true));
        
    var loadingStyles = "<style id=\"maxsm_ratings_loading_animation\">" +
                    ".loading-dots-container {" +
                    "    position: absolute;" +
                    "    top: 50%;" +
                    "    left: 0;" +
                    "    right: 0;" +
                    "    text-align: left;" +
                    "    transform: translateY(-50%);" +
                    "    z-index: 10;" +
                    "}" +
                    ".full-start-new__rate-line {" +
                    "    position: relative;" +
                    "}" +
                    ".loading-dots {" +
                    "    display: inline-flex;" +
                    "    align-items: center;" +
                    "    gap: 0.4em;" +
                    "    color: #ffffff;" +
                    "    font-size: 1em;" +
                    "    background: rgba(0, 0, 0, 0.3);" +
                    "    padding: 0.6em 1em;" +
                    "    border-radius: 0.5em;" +
                    "}" +
                    ".loading-dots__text {" +
                    "    margin-right: 1em;" +
                    "}" +
                    ".loading-dots__dot {" +
                    "    width: 0.5em;" +
                    "    height: 0.5em;" +
                    "    border-radius: 50%;" +
                    "    background-color: currentColor;" +
                    "    opacity: 0.3;" +
                    "    animation: loading-dots-fade 1.5s infinite both;" + 
                    "}" +
                    ".loading-dots__dot:nth-child(1) {" +
                    "    animation-delay: 0s;" +
                    "}" +
                    ".loading-dots__dot:nth-child(2) {" +
                    "    animation-delay: 0.5s;" + 
                    "}" +
                    ".loading-dots__dot:nth-child(3) {" +
                    "    animation-delay: 1s;" +   
                    "}" +
                    "@keyframes loading-dots-fade {" +
                    "    0%, 90%, 100% { opacity: 0.3; }" + 
                    "    35% { opacity: 1; }" +             
                    "}" +
                    "@media screen and (max-width: 480px) { .loading-dots-container { -webkit-justify-content: center; justify-content: center; text-align: center; max-width: 100%; }}" +
                    "</style>";


    Lampa.Template.add('maxsm_ratings_loading_animation_css', loadingStyles);
    $('body').append(Lampa.Template.get('maxsm_ratings_loading_animation_css', {}, true));
    
    // Глобальная переменная текущей карточки (сейчас не используется)
    var globalCurrentCard = null;

    // Перепемнные настройки 
    var C_LOGGING = false;  // Общий логгинг 
    var Q_LOGGING = false;  // Логгинг качества
    var CACHE_TIME = 3 * 24 * 60 * 60 * 1000;  // Время, которое кеш считается валидным
    var Q_CACHE_TIME = 24 * 60 * 60 * 1000;  // Время, которое кеш считается валидным
    var OMDB_CACHE = 'maxsm_ratings_omdb_cache';
    var KP_CACHE = 'maxsm_ratings_kp_cache';
    var ID_MAPPING_CACHE = 'maxsm_ratings_id_mapping_cache';
    var QUALITY_CACHE = 'maxsm_ratings_quality_cache';
    var OMDB_API_KEYS = (window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.OMDB_API_KEYS) || ['18a1eec9']; // api ключи массивом
    var KP_API_KEYS   = (window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.KP_API_KEYS)   || ['ae8d6b29-b4ea-4f44-ad64-e99cb243289a']; // api ключи массивом
    var PROXY_TIMEOUT = 5000; // Таймаут прокси
    var JACRED_PROTOCOL = 'https://'; // Протокол JacRed
    //var JACRED_URL = Lampa.Storage.get('jackett_url'); // Адрес JacRed для получения информации о карточках без протокола (jacred.xyz)
    //var JACRED_API_KEY = Lampa.Storage.get('jackett_key'); // api ключ JacRed
    //var JACRED_URL = 'jacred.xyz'; 
    var JACRED_URL = 'parser.ruzha.ru';
    var JACRED_API_KEY = 'BCqr1JX01ISh';
    var PROXY_LIST = [  // Корс прокси для запросов 
        'https://cors.bwa.workers.dev/',
        'https://api.allorigins.win/raw?url='
    ];
    
    // Словарь возрастных рейтингов
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
    
    // Весовые коэффициенты для источников рейтингов
    var WEIGHTS = {
        imdb: 0.35,
        tmdb: 0.15,
        kp: 0.20,
        mc: 0.15,
        rt: 0.15
    };
    
    // Берем случайный токен из массива
    function getRandomToken(arr) {
      if (!arr || !arr.length) return '';
      return arr[Math.floor(Math.random() * arr.length)];
    }
    
    // Получаем количество наград
    function parseAwards(awardsText, localCurrentCard) {
        if (typeof awardsText !== 'string') return null;
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Parse awards: " + awardsText);
    
        var result = {
            oscars: 0,
            awards: 0
        };
    
        var oscarMatch = awardsText.match(/Won (\d+) Oscars?/i);
        if (oscarMatch && oscarMatch[1]) {
            result.oscars = parseInt(oscarMatch[1], 10);
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Oscars: " + result.oscars);
        }

        var emmyMatch = awardsText.match(/Won (\d+) Primetime Emmys?/i);
        if (emmyMatch && emmyMatch[1]) {
            result.emmy = parseInt(emmyMatch[1], 10);
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Emmy: " + result.emmy);
        }
    
        var otherMatch = awardsText.match(/Another (\d+) wins?/i);
        if (otherMatch && otherMatch[1]) {
            result.awards = parseInt(otherMatch[1], 10);
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Awards (Another): " + result.awards);
        }
    
        if (result.awards === 0) {
            var simpleMatch = awardsText.match(/(\d+) wins?/i);
            if (simpleMatch && simpleMatch[1]) {
                result.awards = parseInt(simpleMatch[1], 10);
                if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Awards (Simple): " + result.awards);
            }
        }

        return result;
    }
    
    // Получение данных через прокси
    function fetchWithProxy(url, localCurrentCard, callback) {
        var currentProxy = 0;
        var callbackCalled = false;
        
        function tryNextProxy() {
            if (currentProxy >= PROXY_LIST.length) {
                if (!callbackCalled) {
                    callbackCalled = true;
                    callback(new Error('All proxies failed'));
                }
                return;
            }
            
            var proxyUrl = PROXY_LIST[currentProxy] + encodeURIComponent(url);
                if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Fetch with proxy: " + proxyUrl);
            
            var timeoutId = setTimeout(function() {
                if (!callbackCalled) {
                    currentProxy++;
                    tryNextProxy();
                }
            }, PROXY_TIMEOUT);
            
            fetch(proxyUrl)
                .then(function(response) {
                    clearTimeout(timeoutId);
                    if (!response.ok) throw new Error('Proxy error: ' + response.status);
                    return response.text();
                })
                .then(function(data) {
                    if (!callbackCalled) {
                        callbackCalled = true;
                        clearTimeout(timeoutId);
                        callback(null, data);
                    }
                })
                .catch(function() {
                    clearTimeout(timeoutId);
                    if (!callbackCalled) {
                        currentProxy++;
                        tryNextProxy();
                    }
                });
        }
        
        tryNextProxy();
    }
//-----------------------------------------------------get---kinopoisk-------------------------------------
    function getKPRatings(normalizedCard, apiKey, localCurrentCard, callback) {
        // Если есть kinopoisk_id - сразу переходим к запросу рейтингов
        if (normalizedCard.kinopoisk_id) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Using provided kinopoisk_id: " + normalizedCard.kinopoisk_id);
            return fetchRatings(normalizedCard.kinopoisk_id, localCurrentCard);
        }
    
        // Старая логика поиска по названию/году
        var queryTitle = (normalizedCard.original_title || normalizedCard.title || '').replace(/[:\-–—]/g, ' ').trim();
        var year = '';
        if (normalizedCard.release_date && typeof normalizedCard.release_date === 'string') {
            year = normalizedCard.release_date.split('-')[0];
        }
        
        if (!year) {
            callback(null);
            return;
        }
        
        var encodedTitle = encodeURIComponent(queryTitle);
        var searchUrl = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodedTitle;
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Find information in KP by title and year");        
        fetch(searchUrl, {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP error: ' + response.status);
            return response.json();
        })
        .then(function(data) {
            if (!data.films || !data.films.length) {
                callback(null);
                return;
            }
            
            var bestMatch = null;
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Match KP inf");
            var filmYear;
            var targetYear;
            var film2;
            // Сначала пытаемся найти точное совпадение
            for (var j = 0; j < data.films.length; j++) {
                film2 = data.films[j];
                if (!film2.year) continue;
                
                filmYear = parseInt(film2.year.substring(0, 4), 10);
                targetYear = parseInt(year, 10);
                
                // Двойная проверка на валидность чисел
                if (isNaN(filmYear)) continue;
                if (isNaN(targetYear)) continue;
                
                if (filmYear === targetYear) {
                    bestMatch = film2;
                    if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", KP EXACT match for: " + queryTitle + " / " + year + " is id: " + bestMatch.filmId + " / " + film2.nameRu + " / " + film2.nameEn + " / " + film2.year);
                    break;
                }
            }
            
            // Если точное совпадение не найдено, ищем +- год
            if (!bestMatch) {
                for (var k = 0; k < data.films.length; k++) {
                    film2 = data.films[k];
                    if (!film2.year) continue;
                    
                    filmYear = parseInt(film2.year.substring(0, 4), 10);
                    targetYear = parseInt(year, 10);
                    
                    // Двойная проверка на валидность чисел
                    if (isNaN(filmYear)) continue;
                    if (isNaN(targetYear)) continue;
                    
                    if (Math.abs(filmYear - targetYear) <= 1) {
                        bestMatch = film2;
                        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", KP APPROXIMATE match for: " + queryTitle + " / " + year + " is id: " + bestMatch.filmId + " / " + film2.nameRu + " / " + film2.nameEn + " / " + film2.year);
                        break;
                    }
                }
            }
            
            if (!bestMatch || !bestMatch.filmId) {
                callback(null);
                return;
            }
            
            fetchRatings(bestMatch.filmId, localCurrentCard);
        })
        .catch(function() {
            console.warn("MAXSM-RATINGS", "card: " + localCurrentCard + "Kinopoisk API request failed");
            callback(null);
        });
    
        // Общая функция получения рейтингов по ID
        function fetchRatings(filmId, localCurrentCard) {
            var xmlUrl = 'https://rating.kinopoisk.ru/' + filmId + '.xml';
            
            fetchWithProxy(xmlUrl, localCurrentCard, function(error, xmlText) {
                if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Try to get KP ratings from XML");
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
                            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Got KP ratings from XML");
                            return callback({
                                kinopoisk: hasValidKp ? kpRating : null,
                                imdb: hasValidImdb ? imdbRating : null
                            });
                        }
                    } catch (e) {
                        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", XML parse error, fallback to API");
                    }
                }
                
                // Fallback к API
                if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Try to get KP ratings from API");
                fetch('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + filmId, {
                    headers: { 'X-API-KEY': apiKey }
                })
                    .then(function(response) {
                        if (!response.ok) throw new Error('API error');
                        return response.json();
                    })
                    .then(function(data) {
                        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Got KP ratings from API");
                        callback({
                            kinopoisk: data.ratingKinopoisk || null,
                            imdb: data.ratingImdb || null
                        });
                    })
                    .catch(function() {
                        callback(null);
                    });
            });
        }
    }
//-------------------------------------------------end---get---kinopoisk-----------------------------------
    function addLoadingAnimation(localCurrentCard, render) {
        //var render = Lampa.Activity.active().activity.render();
        if (!render) return;
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Add loading animation");
        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length || $('.loading-dots-container', rateLine).length) return;

        rateLine.append(
            '<div class="loading-dots-container">' +
                '<div class="loading-dots">' +
                    '<span class="loading-dots__text">' + Lampa.Lang.translate("maxsm_ratings_loading") + '</span>' +
                    '<span class="loading-dots__dot"></span>' +
                    '<span class="loading-dots__dot"></span>' +
                    '<span class="loading-dots__dot"></span>' +
                '</div>' +
            '</div>'
        );

        $('.loading-dots-container', rateLine).css({
            'opacity': '1',
            'visibility': 'visible'
        });
    }

    // Улучшенная функция удаления анимации
    function removeLoadingAnimation(localCurrentCard, render) {
        if (!render) return;
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Remove animation");
        // Ищем контейнеры с анимацией только внутри render
        var containers = $('.loading-dots-container', render);
        containers.each(function(index, element) {
            element.parentNode.removeChild(element);
        });
    }

    
    // Вспомогательные функции
    function getCardType(card) {
        var type = card.media_type || card.type;
        if (type === 'movie' || type === 'tv') return type;
        return card.name || card.original_name ? 'tv' : 'movie';
    }
    
    function getRatingClass(rating) {
        if (rating >= 8.5) return 'rate--green';
        if (rating >= 7.0) return 'rate--lime';
        if (rating >= 5.0) return 'rate--orange';
        return 'rate--red';
    }
    
// ------------------------------------------------------------JacRed------------------------------------------------------------------------------   
    function getBestReleaseFromJacred(normalizedCard, localCurrentCard, callback) {
        if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Optimized search");
    
        var MAX_QUALITY = 2160;
        var stopWords = ['camrip', 'камрип', 'ts', 'telecine', 'telesync', 'telesynch', 'upscale', 'tc', 'тс'];
        var stopWordsPatterns = null;
    
        // Упрощенная функция перевода качества (работает с числами)
        function translateQuality(quality) {
            switch(quality) {
                case 2160: return '4K';
                case 1080: return 'FHD';
                case 720: return 'HD';
                case 'TS': return 'TS'; // Специальный случай
                default: 
                    // Для всех остальных числовых значений
                    return quality >= 720 ? 'HD' : 'SD';
            }
        }
    
        function hasLetters(str) {
            return /[a-zа-яё]/i.test(str || '');
        }
        function onlyDigits(str) {
            return /^\d+$/.test(str);
        }
        function isScreenCopy(title) {
            if (!title) return false;
            var lower = title.toLowerCase();
            
            if (stopWordsPatterns === null) {
                stopWordsPatterns = stopWords.map(function(word) {
                    return new RegExp('\\b' + word + '\\b', 'i');
                });
            }
    
            for (var i = 0; i < stopWordsPatterns.length; i++) {
                if (stopWordsPatterns[i].test(lower)) {
                    return true;
                }
            }
            return false;
        }
    
        // Извлечение года
        var year = '';
        var dateStr = normalizedCard.release_date || '';
        if (dateStr.length >= 4) {
            year = dateStr.substring(0, 4);
        }
    
        if (!year || isNaN(year)) {
            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Missing/invalid year");
            callback(null);
            return;
        }
    
        var uid = Lampa.Storage.get('lampac_unic_id', '');
        var apiUrl = JACRED_PROTOCOL + JACRED_URL + '/api/v2.0/indexers/all/results?' +
                     'apikey=' + JACRED_API_KEY +
                     '&uid=' + uid +
                     '&year=' + year;
    
        // Добавляем оба заголовка если они есть
        var hasTitle = false;
        if (normalizedCard.title && (hasLetters(normalizedCard.title) || onlyDigits(normalizedCard.title))) {
            apiUrl += '&title=' + encodeURIComponent(normalizedCard.title.trim());
            hasTitle = true;
        }
        if (normalizedCard.original_title && (hasLetters(normalizedCard.original_title) || onlyDigits(normalizedCard.original_title))) {
            apiUrl += '&title_original=' + encodeURIComponent(normalizedCard.original_title.trim());
            hasTitle = true;
        }
    
        if (!hasTitle) {
            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: No valid titles");
            callback(null);
            return;
        }
    
        if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Unified Request URL: " + apiUrl);
    
        new Lampa.Reguest().silent(apiUrl, function(response) {
            if (!response) {
                if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Request failed");
                callback(null);
                return;
            }
    
            try {
                
                // ЛОГИРОВАНИЕ ПОЛНОГО ОТВЕТА
                /*
                if (Q_LOGGING) {
                    console.log("MAXSM-RATINGS JacRed FULL RESPONSE", response);
        
                }
                */
                
                // Парсим ответ и извлекаем Results
                var data = typeof response === 'string' ? JSON.parse(response) : response;
                var torrents = data.Results || [];
                
                if (!Array.isArray(torrents)) {
                    torrents = [];
                }
    
                if (torrents.length === 0) {
                    if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Empty response");
                    callback(null);
                    return;
                }
    
                var bestQuality = -1;
                var bestTorrent = null;
                var findStopWords = false;
                var searchYearNum = parseInt(year, 10);
                var prevYear = searchYearNum - 1;
    
                for (var i = 0; i < torrents.length; i++) {
                    var t = torrents[i];
                    var info = t.info || t.Info || {};
                    var usedQuality = info.quality;
                    var usedYear = info.relased;
                    var titleForCheck = t.Title || '';
                    
                    // ЛОГИРОВАНИЕ ДЕТАЛЕЙ ТОРРЕНТА
                    /*
                    if (Q_LOGGING) {
                        console.log('MAXSM-RATINGS Processing torrent [${i+1}/${torrents.length}]: ${titleForCheck');
                        console.log("Raw data:", {
                            quality: usedQuality,
                            year: usedYear,
                            title: titleForCheck,
                            info: info
                        });
                    } 
                    */
    
                    // Пропускаем торренты без информации о качестве
                    if (typeof usedQuality !== 'number' || usedQuality === 0) {
                        continue;
                    }
    
                    // Проверяем валидность года
                    var yearValid = false;
                    var parsedYear = 0;
                    
                    if (usedYear && !isNaN(usedYear)) {
                        parsedYear = parseInt(usedYear, 10);
                        if (parsedYear > 1900) {
                            yearValid = true;
                        }
                    }
                    
                    if (!yearValid) {
                        continue;
                    }
    
                    // Проверяем соответствие года (текущий или предыдущий)
                    if (parsedYear !== searchYearNum && parsedYear !== prevYear) {
                        continue;
                    }
    
                    // Проверяем на стоп-слова
                    if (isScreenCopy(titleForCheck)) {
                        findStopWords = true;
                        continue;
                    }
    
                    // Проверяем максимальное качество
                    if (usedQuality === MAX_QUALITY) {
                        if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Found MAX quality: " + usedQuality);
                        callback({ 
                            quality: translateQuality(usedQuality),
                            title: titleForCheck 
                        });
                        return;
                    }
    
                    // Обновляем лучший торрент
                    if (usedQuality > bestQuality) {
                        bestQuality = usedQuality;
                        bestTorrent = {
                            title: titleForCheck,
                            quality: usedQuality,
                            year: parsedYear
                        };
                    }
                }
    
                if (bestTorrent) {
                    var translatedQuality = translateQuality(bestTorrent.quality);
                    if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + 
                        ", quality: JacRed: Found torrent: " + bestTorrent.title + 
                        " quality: " + translatedQuality + " (" + bestTorrent.quality + "p)" +
                        " year: " + bestTorrent.year);
                    callback({ 
                        quality: translatedQuality, 
                        title: bestTorrent.title 
                    });
                } else if (findStopWords) {
                    if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Screen copy detected");
                    callback({ 
                        quality: translateQuality('TS'),
                        title: "NOT SAVED" 
                    });
                } else {
                    if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: No suitable torrents found");
                    callback(null);
                }
            } catch (e) {
                if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Processing error: " + e.message);
                callback(null);
            }
        });
    }
// v1
/*
    function getBestReleaseFromJacred(normalizedCard, localCurrentCard, callback) {
        if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Optimized search");
    
        var MAX_QUALITY = 2160;
        var stopWords = ['camrip', 'камрип', 'ts', 'telecine', 'telesync', 'telesynch', 'upscale']; // Релизы с данными словами игнорируются
        var findStopWords = false;
        var stopWordsPatterns = null;
    
        function hasLetters(str) {
            return /[a-zа-яё]/i.test(str || '');
        }
        function onlyDigits(str) {
            return /^\d+$/.test(str);
        }
        function isScreenCopy(title) {
            if (!title) return false;
            var lower = title.toLowerCase();
            
            if (stopWordsPatterns === null) {
                stopWordsPatterns = stopWords.map(function(word) {
                    return new RegExp('\\b' + word + '\\b', 'i');
                });
            }
    
            for (var i = 0; i < stopWordsPatterns.length; i++) {
                if (stopWordsPatterns[i].test(lower)) {
                    return true;
                }
            }
            return false;
        }
    
        // Извлечение года
        var year = '';
        var dateStr = normalizedCard.release_date || '';
        if (dateStr.length >= 4) {
            year = dateStr.substring(0, 4);
        }
    
        if (!year || isNaN(year)) {
            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Missing/invalid year");
            callback(null);
            return;
        }
    
        // Основная функция поиска
        function searchJacred(searchTitle, searchYear, exact, stepName, callback) {
            var uid = Lampa.Storage.get('lampac_unic_id', '');
            var apiUrl = JACRED_PROTOCOL + JACRED_URL + '/api/v1.0/torrents?search=' + 
                         encodeURIComponent(searchTitle) + 
                         '&year=' + searchYear + 
                         '&apikey=' + JACRED_API_KEY +
                         (exact ? '&exact=true' : '') +
                         '&uid=' + uid;
        
            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: " + stepName + " URL: " + apiUrl);
        
            new Lampa.Reguest().silent(apiUrl, function(response) {
                if (!response) {
                    if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: " + stepName + " failed");
                    callback(null);
                    return;
                }
        
                try {
                    if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: analizing answer...");
                    var torrents = typeof response === 'string' ? JSON.parse(response) : response;
                    if (!Array.isArray(torrents) || torrents.length === 0) {
                        callback(null);
                        return;
                    }
        
                    var bestQuality = -1;
                    var bestTorrent = null;
                    var findStopWords = false;
                    var searchYearNum = parseInt(searchYear, 10);
                        

        
                    for (var i = 0; i < torrents.length; i++) {
                        var t = torrents[i];
                        var usedQuality = t.quality;
                        var usedYear = t.relased;
                        var qualitySource = "original";
                        var yearSource = "original";
                        var yearStatus = "valid";
                        
                        // Обработка качества: если оригинальное качество 0 - пропускаем
                        if (typeof t.quality !== 'number' || t.quality === 0) {
                            // Временное отключение парсинга качества
                            continue; // Пропускаем релизы без качества
                        }
                        
                        // Обработка года: если оригинальный год невалиден - пропускаем
                        var yearValid = false;
                        var parsedYear = 0;
                        
                        if (usedYear && !isNaN(usedYear)) {
                            parsedYear = parseInt(usedYear, 10);
                            if (parsedYear > 1900) {
                                yearValid = true;
                            }
                        }
                        

                        
                        if (!yearValid) {
                            yearStatus = "invalid/missing";
                            continue; // Пропускаем релизы без года
                        }
                        
                        // Проверка соответствия года (если год известен)
                        if (yearValid) {
                            if (!isNaN(searchYearNum)) {
                                if (parsedYear === searchYearNum) {
                                    yearStatus = "match (" + parsedYear + " vs " + searchYearNum + ")";
                                } else {
                                    yearStatus = "mismatch (" + parsedYear + " vs " + searchYearNum + ")";
                                    continue; // Пропускаем торренты с несоответствующим годом
                                }
                            } else {
                                yearStatus = "no_search_year";
                            }
                        }
                        
                        // Проверка на screen copy
                        if (isScreenCopy(t.title)) {
                            findStopWords = true;
                            continue;
                        }
                        
                        
                        if (usedQuality === MAX_QUALITY) {
                            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Found MAX quality in " + stepName);
                            callback({
                                quality: usedQuality,
                                title: t.title
                            });
                            return;
                        }
                        
                        if (usedQuality > bestQuality) {
                            bestQuality = usedQuality;
                            bestTorrent = t;
                        }
                    }
        
                    if (bestTorrent) {
                        if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Found in " + stepName + ": torrent: " + bestTorrent.title + " quality: " + bestQuality + "p");
                        callback({
                            quality: bestQuality,
                            title: bestTorrent.title
                        });
                    } else {
                        if (findStopWords) {
                            callback({
                                quality: "TS",
                                title: "NOT SAVED"
                            });                            
                        } else {
                            callback(null);
                        }
                    }
                } catch (e) {
                    if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: " + stepName + " error: " + e.message);
                    callback(null);
                }
            });
        }
        
        // Последовательные стратегии поиска
        var searchStrategies = [];
        
        // Стратегия 1: По original_title (точное совпадение)
        if (normalizedCard.original_title && (hasLetters(normalizedCard.original_title) || onlyDigits(normalizedCard.original_title))) {
            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: Strategy added: OriginalTitle Exact Year");
            searchStrategies.push({
                title: normalizedCard.original_title.trim(),
                year: year,
                exact: true,
                name: "OriginalTitle Exact Year"
            });
        }
        
        // Стратегия 2: По original_title (точное совпадение) -1год
        if (normalizedCard.original_title && (hasLetters(normalizedCard.original_title) || onlyDigits(normalizedCard.original_title))) {
            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: Strategy added: OriginalTitle Exact Year-1");
            searchStrategies.push({
                title: normalizedCard.original_title.trim(),
                year: String(Number(year) - 1),
                exact: true,
                name: "OriginalTitle Exact Year-1"
            });
        }
        
        // Стратегия 3: По title (точное совпадение)
        if (normalizedCard.title && (hasLetters(normalizedCard.title) || onlyDigits(normalizedCard.title))) {
            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: Strategy added: Title Exact Year");
            searchStrategies.push({
                title: normalizedCard.title.trim(),
                year: year,
                exact: true,
                name: "Title Exact Year"
            });
        }
        
        // Стратегия 4: По title (точное совпадение) -1год
        if (normalizedCard.title && (hasLetters(normalizedCard.title) || onlyDigits(normalizedCard.title))) {
            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: Strategy added: Title Exact Year-1");
            searchStrategies.push({
                title: normalizedCard.title.trim(),
                year: String(Number(year) - 1),
                exact: true,
                name: "Title Exact Year-1"
            });
        }
        
        // Рекурсивная проверка стратегий
        function tryNextStrategy(index) {
            if (index >= searchStrategies.length) {
                if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: All strategies failed");
                callback(null);
                return;
            }
            
            var strategy = searchStrategies[index];
            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Trying " + strategy.name);
            
            searchJacred(strategy.title, strategy.year, strategy.exact, strategy.name, function(result) {
                if (result !== null) {
                    // ДОБАВЛЕН ЛОГ С НАЗВАНИЕМ РАЗДАЧИ
                    // if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: Selected torrent: \"" + result.title + "\"");
                    callback({ quality: result.quality + "p" });
                } else {
                    tryNextStrategy(index + 1);
                }
            });
        }
        
        // Запуск первой стратегии
        if (searchStrategies.length > 0) {
            tryNextStrategy(0);
        } else {
            if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: JacRed: No valid titles");
            callback(null);
        }
    }
    */
// ------------------------------------------------------------END--JacRed-------------------------------------------------------------------------     
    // Функции работы с качеством
    // Удаляем качество с карточки если есть
    function clearQualityElements(localCurrentCard, render) {
        if (render) $('.full-start__status.maxsm-quality', render).remove();
    }
    // Плейсхолдер качества
    function showQualityPlaceholder(localCurrentCard, render) {
        if (!render) return;
        
        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length) return;
        
        // Проверяем, не добавлен ли уже плейсхолдер
        if (!$('.full-start__status.maxsm-quality', render).length) {
            var placeholder = document.createElement('div');
            placeholder.className = 'full-start__status maxsm-quality';
            placeholder.textContent = '...';
            placeholder.style.opacity = '0.7';
            rateLine.append(placeholder);
        } 
    }
    // Получаем касество
    function fetchQualitySequentially(normalizedCard, localCurrentCard, qCacheKey, render) {
        if (Q_LOGGING) console.log('MAXSM-RATINGS', ' card: ' + localCurrentCard + ', quality: Starting JacRed request');
        getBestReleaseFromJacred(normalizedCard, localCurrentCard, function(jrResult) {
            if (Q_LOGGING) console.log('MAXSM-RATINGS', ' card: ' + localCurrentCard + ', quality: JacRed callback received');
            var quality = (jrResult && jrResult.quality) || null;
            if (quality && quality !== 'NO') {
                if (Q_LOGGING) console.log('MAXSM-RATINGS', ' card: ' + localCurrentCard + ', quality: JacRed found quality: ' + quality);
                saveQualityCache(qCacheKey, { quality: quality }, localCurrentCard);
                updateQualityElement(quality, localCurrentCard, render);
                return;
            }
            clearQualityElements(localCurrentCard, render);
        });
    }
    // Обновляем качество в карточке
    function updateQualityElement(quality, localCurrentCard, render) {
        if (!render) return;
        var element = $('.full-start__status.maxsm-quality', render);
        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length) return;
        
        if (element.length) {
            if (Q_LOGGING) console.log('MAXSM-RATINGS', ' card: ' + localCurrentCard + ', quality: Updating existing element with quality "' + quality + '" (displayed as "' + quality + '")');
            element.text(quality).css('opacity', '1');
        } else {
            if (Q_LOGGING) console.log('MAXSM-RATINGS', ' card: ' + localCurrentCard + ', quality: Creating new element with quality "' + quality + '" (displayed as "' + quality + '")');
            var div = document.createElement('div');
            div.className = 'full-start__status maxsm-quality';
            div.textContent = quality;
            rateLine.append(div);
        }
    }

    // Основная функция
    function fetchAdditionalRatings(card, render) {
        if (!render) return;
        var localCurrentCard = card.id; 
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Start - card data: ", card);
        
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
        
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", imdb id: " + normalizedCard.imdb_id + " title: " + normalizedCard.title + " orig: " + normalizedCard.original_title + " type: " + normalizedCard.type + " date: " + normalizedCard.release_date);
        
        var rateLine = $('.full-start-new__rate-line', render);
        if (rateLine.length) {
            rateLine.css('visibility', 'hidden');
            rateLine.addClass('done'); 
            addLoadingAnimation(localCurrentCard, render);
        }
        
        var cacheKey = normalizedCard.type + '_' + (normalizedCard.imdb_id || normalizedCard.id);
        var qCacheKey = normalizedCard.type + '_' + (normalizedCard.id || normalizedCard.imdb_id); 
        var cachedData = getOmdbCache(cacheKey);
        var cachedKpData = getKpCache(cacheKey);
        var cacheQualityData = getQualityCache(qCacheKey);
        var ratingsData = {};
        
        // Оптимищируем ли запросы 1 - экономия, 0 - точность (не избегаем запросов ксли на карточке есть IMDb и KP)
        // var optimize = parseInt(localStorage.getItem('maxsm_ratings_optimize'));

        // Статусы рейтингов
        var kpElement = $('.rate--kp:not(.hide)', render);
        var imdbElement = $('.rate--imdb:not(.hide)', render);
        
        // Проверяем, что оба рейтинга уже есть и содержат числовые значения
        var kpExists = kpElement.length > 0 && !!kpElement.find('> div').eq(0).text().trim();
        var imdbExists = imdbElement.length > 0 && !!imdbElement.find('> div').eq(0).text().trim();
            // Асинхронно ищем качество 
            if (localStorage.getItem('maxsm_ratings_quality') === 'true' && !(localStorage.getItem('maxsm_ratings_quality_tv') === 'false' && normalizedCard.type === 'tv')) {
                if (Q_LOGGING) console.log('MAXSM-RATINGS', ' card: ' + localCurrentCard + ', quality: Start quality');
                // 1. Обрабатываем кеш качества
                if (cacheQualityData) {
                    if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: Get Quality data from cache");
                    updateQualityElement(cacheQualityData.quality, localCurrentCard, render);
                } else {
                    clearQualityElements(localCurrentCard, render);
                    showQualityPlaceholder(localCurrentCard, render);
                    fetchQualitySequentially(normalizedCard, localCurrentCard, qCacheKey, render);
                }
            } 
                
        // 1. Обрабатываем кеш Кинопоиска
        if (cachedKpData) {
            ratingsData.kp = cachedKpData.kp;
            ratingsData.imdb_kp = cachedKpData.imdb; 
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Get KP ratings from cache");
            processNextStep();
        } else {
            getKPRatings(normalizedCard, getRandomToken(KP_API_KEYS), localCurrentCard, function(kpRatings) {
                if (kpRatings) {
                    if (kpRatings.kinopoisk) {
                        ratingsData.kp = kpRatings.kinopoisk;
                    }
                    if (kpRatings.imdb) {
                        ratingsData.imdb_kp = kpRatings.imdb; // если хочешь сохранить отдельно, или сравнить
                    }
                    saveKpCache(cacheKey, { kp: kpRatings.kinopoisk, imdb: kpRatings.imdb }, localCurrentCard);
                }
                processNextStep();
            });
            return; // Выходим, продолжим в колбэке
        }
        
        function processNextStep() {

            updateHiddenElements(ratingsData, localCurrentCard, render);
            // 2. Обрабатываем кеш OMDB
            if (cachedData) {
                ratingsData.rt = cachedData.rt;
                ratingsData.mc = cachedData.mc;
                ratingsData.imdb = cachedData.imdb;
                ratingsData.ageRating = cachedData.ageRating;
                ratingsData.oscars = cachedData.oscars;
                ratingsData.emmy = cachedData.emmy;
                ratingsData.awards = cachedData.awards;
                if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Get OMDB ratings from cache");
                updateUI();
            } else if (normalizedCard.imdb_id) {
                fetchOmdbRatings(normalizedCard, cacheKey, localCurrentCard, render, function(omdbData) {
                    if (omdbData) {
                        ratingsData.rt = omdbData.rt;
                        ratingsData.mc = omdbData.mc;
                        ratingsData.imdb = omdbData.imdb;
                        ratingsData.ageRating = omdbData.ageRating;
                        ratingsData.oscars = omdbData.oscars;
                        ratingsData.emmy = omdbData.emmy;
                        ratingsData.awards = omdbData.awards;
                        saveOmdbCache(cacheKey, omdbData, localCurrentCard);
                    }
                    updateUI();
                });
            } else {
                getImdbIdFromTmdb(normalizedCard.id, normalizedCard.type, localCurrentCard, function(newImdbId) {
                    if (newImdbId) {
                        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", imdb id is: " + newImdbId);
                        normalizedCard.imdb_id = newImdbId;
                        cacheKey = normalizedCard.type + '_' + newImdbId;
                        fetchOmdbRatings(normalizedCard, cacheKey, localCurrentCard, render, function(omdbData) {
                            if (omdbData) {
                                ratingsData.rt = omdbData.rt;
                                ratingsData.mc = omdbData.mc;
                                ratingsData.imdb = omdbData.imdb;
                                ratingsData.ageRating = omdbData.ageRating;
                                ratingsData.oscars = omdbData.oscars;
                                ratingsData.emmy = omdbData.emmy;
                                ratingsData.awards = omdbData.awards;
                                saveOmdbCache(cacheKey, omdbData, localCurrentCard);
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
            // Вставляем рейтинги RT и MC
            insertRatings(ratingsData.rt, ratingsData.mc, ratingsData.oscars, ratingsData.awards, ratingsData.emmy, localCurrentCard, render);
            
            // Обновляем скрытые элементы
            updateHiddenElements(ratingsData, localCurrentCard, render);
            
            var mode = parseInt(localStorage.getItem('maxsm_ratings_mode'), 10);
            var isPortrait = window.innerHeight > window.innerWidth;
            if (isPortrait) mode = 1;
            
            // Считаем и отображаем средний рейтинг
            if (mode !== 2)
                calculateAverageRating(localCurrentCard, render);
            
            //Меняем лейблы на иконки если надо
            var showIcons = localStorage.getItem('maxsm_ratings_icons')  === 'true';
            if (showIcons) insertIcons(localCurrentCard, render);
            
            // Убираем анимацию и возвращаем строку рейтингов     
            removeLoadingAnimation(localCurrentCard, render);
            rateLine.css('visibility', 'visible');
            
            // Добавляем обработчик для портретного режима
            if (isPortrait) {
                var rateElement = $('.full-start__rate', render);
                rateElement.off('click.ratings-modal').on('click.ratings-modal', function(e) {
                    e.stopPropagation();
                    showRatingsModal(localCurrentCard, render);
                });
            }
            
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", RATE DONE");
       }
    }
    
//-------------------------------------------MODALKA---------------------------------------------------------
    function showRatingsModal(cardId, render) {
        // Проверяем настройку цветов
        var showColors = localStorage.getItem('maxsm_ratings_colors') === 'true';
        
        // Создаем контейнер для модального окна
        var modalContent = $('<div class="maxsm-modal-ratings"></div>');
        
        // Находим строку рейтингов
        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length) return;
        
        // Порядок отображения рейтингов
        var ratingOrder = [
            'rate--avg',
            'rate--oscars',
            'rate--emmy',
            'rate--awards',
            'rate--tmdb',
            'rate--imdb',
            'rate--kp',
            'rate--rt',
            'rate--mc'
        ];
        
        // Собираем рейтинги в нужном порядке
        ratingOrder.forEach(function(className) {
            var element = $('.' + className, rateLine);
            if (element.length) {
                // Берем значение из первого дочернего элемента
                var value = element.children().eq(0).text().trim();
                var numericValue = parseFloat(value);
                
                // Определяем название рейтинга
                var label = '';
                switch(className) {
                    case 'rate--avg': 
                        label = Lampa.Lang.translate("maxsm_ratings_mode");
                        break;
                    case 'rate--oscars': 
                        label = Lampa.Lang.translate("maxsm_ratings_oscars");
                        break;
                    case 'rate--emmy': 
                        label = Lampa.Lang.translate("maxsm_ratings_emmy");
                        break;
                    case 'rate--awards': 
                        label = Lampa.Lang.translate("maxsm_ratings_awards");
                        break;
                    case 'rate--tmdb': 
                        label = 'TMDB';
                        break;
                    case 'rate--imdb': 
                        label = 'IMDb';
                        break;
                    case 'rate--kp': 
                        label = 'Кинопоиск';
                        break;
                    case 'rate--rt': 
                        label = 'Rotten Tomatoes';
                        break;
                    case 'rate--mc': 
                        label = 'Metacritic';
                        break;
                }
                
                // Создаем элемент строки с префиксными классами
                var item = $('<div class="maxsm-modal-rating-line"></div>');
                // Применяем цветовые классы если включена настройка
                if (showColors) {                
                var colorClass;
                    // Для среднего рейтинга используем специальную функцию
                    if (className === 'rate--avg') {
                        colorClass = getRatingClass(numericValue);
                        if (colorClass) {
                            item.addClass(colorClass);
                        }
                    }
                    // Для остальных рейтингов используем префиксные классы
                    else {
                        colorClass = 'maxsm-modal-' + className.replace('rate--', '');
                        item.addClass(colorClass);
                    }
                }
                item.text(value + ' - ' + label);
                modalContent.append(item);
            }
        });
        
        // Создаем модальное окно
        Lampa.Modal.open({
            title: Lampa.Lang.translate("maxsm_ratings_avg_simple"),
            html: modalContent,
            width: 600,
            onBack: function() {
                Lampa.Modal.close();
                Lampa.Controller.toggle('content');
                return true;
            }
        });
    }
//------------------------------------------------------------------------------------------------------------------------
    //Меняем лейблы на иконки
    function insertIcons(localCurrentCard, render) {
        if (!render) return;   
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert icons");       
        
        function replaceIcon(className, svg) {
            var Element = $('.' + className, render);
            //var Element = $('.' + className);
            if (Element.length) {
                var sourceNameElement = Element.find('.source--name');
                if (sourceNameElement.length) {
                    sourceNameElement.html(svg).addClass('rate--icon');
                    if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert " + className);
                } else {
                    // Если не нашли .source--name, пробуем найти второй дочерний div
                    var childDivs = Element.children('div');
                    if (childDivs.length >= 2) {
                        $(childDivs[1]).html(svg).addClass('rate--icon');
                        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert " + className);
                    }
                }
            }
        }
        
        replaceIcon('rate--imdb', imdb_svg);
        replaceIcon('rate--kp', kp_svg);
        replaceIcon('rate--tmdb', tmdb_svg);
        replaceIcon('rate--oscars', "");
        replaceIcon('rate--emmy', "");
        replaceIcon('rate--awards', awards_svg);
        replaceIcon('rate--rt', rt_svg);
        replaceIcon('rate--mc', mc_svg);
        replaceIcon('rate--avg', "");
    }
    
    // Функции работы с кешем
    function getOmdbCache(key) {
        var cache = Lampa.Storage.get(OMDB_CACHE) || {};
        var item = cache[key];
        return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null;
    }

    function saveOmdbCache(key, data, localCurrentCard) {
        // Проверяем валидные рейтинги
        var hasValidRating = (
            (data.rt && data.rt !== "N/A") ||
            (data.mc && data.mc !== "N/A") ||
            (data.imdb && data.imdb !== "N/A")
        );
        
        // Проверяем валидный возрастной рейтинг
        var hasValidAgeRating = (
            data.ageRating && 
            data.ageRating !== "N/A" && 
            data.ageRating !== "Not Rated"
        );
        
        // Также считаем наличие Оскаров поводом кешировать
        var hasOscars = typeof data.oscars === 'number' && data.oscars > 0;
        var hasEmmy = typeof data.emmy === 'number' && data.emmy > 0;
        var hasAwards = typeof data.awards === 'number' && data.awards > 0;
        
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Save OMDB cache");
        
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

    // Функции для работы с кешем Кинопоиска
    function getKpCache(key) {
        var cache = Lampa.Storage.get(KP_CACHE) || {};
        var item = cache[key];
        return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null;
    }
    
    function saveKpCache(key, data, localCurrentCard) {
        // Оптимищируем ли запросы 1 - экономия, 0 - точность (Сохраняем в кеш на N  дней и пустые результаты)
        //var optimize = parseInt(localStorage.getItem('maxsm_ratings_optimize'));
        
        // if (optimize === 0 && (!data || (!data.kp && !data.imdb))) return;
        
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Save KP cache");
    
        var cache = Lampa.Storage.get(KP_CACHE) || {};
    
        cache[key] = {
            kp: data.kp || null,
            imdb: data.imdb || null,
            timestamp: Date.now()
        };
    
        Lampa.Storage.set(KP_CACHE, cache);
    }
    
    // Функции для работы с кешем качества
    function getQualityCache(key) {
        var cache = Lampa.Storage.get(QUALITY_CACHE) || {};
        var item = cache[key];
        return item && (Date.now() - item.timestamp < Q_CACHE_TIME) ? item : null;
    }
    
    function saveQualityCache(key, data, localCurrentCard) {
        if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: Save quality cache");
    
        var cache = Lampa.Storage.get(QUALITY_CACHE) || {};
    
        cache[key] = {
            quality: data.quality || null,
            timestamp: Date.now()
        };
    
        Lampa.Storage.set(QUALITY_CACHE, cache); 
    }
    
    // Получаем IMDB id из TMDB id по API
    function getImdbIdFromTmdb(tmdbId, type, localCurrentCard, callback) {
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Get IMDb id From TMDB");
        if (!tmdbId) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", TMDB id is empty - aborting");
            return callback(null);
        }
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Get IMDb id From TMDB for id:" + tmdbId);
        
        var cleanType = type === 'movie' ? 'movie' : 'tv';
        var cacheKey = cleanType + '_' + tmdbId;
        var cache = Lampa.Storage.get(ID_MAPPING_CACHE) || {};
        
        if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TIME)) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", find in cache imdb id is: " + cache[cacheKey].imdb_id);
            return callback(cache[cacheKey].imdb_id);
        }
        else if (cache[cacheKey]) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", cached entry expired for: " + cacheKey);
        }
    
        // Формируем основной URL с использованием Lampa.TMDB.api()
        var mainPath = cleanType + '/' + tmdbId + '/external_ids?api_key=' + Lampa.TMDB.key();
        var mainUrl = Lampa.TMDB.api(mainPath);
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", formed main API URL: " + mainUrl);
    
        // Используем только silent запрос
        new Lampa.Reguest().silent(mainUrl, function(data) {
            if (data && data.imdb_id) {
                if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", received IMDb id: " + data.imdb_id);
                cache[cacheKey] = {
                    imdb_id: data.imdb_id,
                    timestamp: Date.now()
                };
                Lampa.Storage.set(ID_MAPPING_CACHE, cache);
                callback(data.imdb_id);
            } else {
                if (C_LOGGING) {
                    console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", no IMDb id in main response");
                    if (data) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", main response data:", data);
                }
                
                if (cleanType === 'tv') {
                    if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", trying alternative TV method");
                    
                    // Формируем альтернативный URL для TV
                    var altPath = 'tv/' + tmdbId + '?api_key=' + Lampa.TMDB.key();
                    var altUrl = Lampa.TMDB.api(altPath);
                    if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", formed alternative API URL: " + altUrl);
                    
                    new Lampa.Reguest().silent(altUrl, function(altData) {
                        var imdbId = (altData && altData.external_ids && altData.external_ids.imdb_id) || null;
                        if (imdbId) {
                            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", alternative method found IMDb: " + imdbId);
                            cache[cacheKey] = {
                                imdb_id: imdbId,
                                timestamp: Date.now()
                            };
                            Lampa.Storage.set(ID_MAPPING_CACHE, cache);
                        } else {
                            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", alternative method NO IMDb id");
                        }
                        callback(imdbId);
                    }, function() {
                        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", alternative request failed");
                        callback(null);
                    });
                } else {
                    if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", not TV type - skipping alternative");
                    callback(null);
                }
            }
        }, function(xhr) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", main request failed. Status: " + (xhr ? xhr.status : 'unknown'));
            callback(null);
        });
    }
    
    // Модифицируем fetchOmdbRatings для поддержки callback
    function fetchOmdbRatings(card, cacheKey, localCurrentCard, render, callback) {
        //var render = Lampa.Activity.active().activity.render();
        if (!render) return;   
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Fetch OMDB ratings");        
        // Статусы рейтингов
        var pgElement = $('.full-start__pg:not(.hide)', render);
        var imdbElement = $('.rate--imdb:not(.hide)', render);
        
        // Проверяем, что оба рейтинга уже есть и содержат числовые значения
        var pgExists = pgElement.length > 0 && !!pgElement.text().trim();
        var imdbExists = imdbElement.length > 0 && !!imdbElement.find('> div').eq(0).text().trim();
        
        if (!card.imdb_id) {
            callback(null);
            return;
        }
        
        var url = 'https://www.omdbapi.com/?apikey=' + getRandomToken(OMDB_API_KEYS) + '&i=' + card.imdb_id;
        
        new Lampa.Reguest().silent(url, function(data) {
            if (data && data.Response === 'True' && (data.Ratings || data.imdbRating)) {
                if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Got OMDB ratings from API");
                var parsedAwards = parseAwards(data.Awards || '', localCurrentCard);
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
                if (data && data.Response === 'False' && data.Error) {
                    if (C_LOGGING) console.warn("MAXSM-RATINGS", "card: " + localCurrentCard + ", OMDB error: " + data.Error);
                }
                callback(null);
            }
        }, function() {
            if (C_LOGGING) console.warn("MAXSM-RATINGS", "card: " + localCurrentCard + ", OMDB request failed");
            callback(null);
        });
    }
    
    function updateHiddenElements(ratings, localCurrentCard, render) {
        if (!render) return;
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Update hidden elements");        
        
        // Обновление возрастного рейтинга с проверкой "Not Rated"
         var pgElement = $('.full-start__pg.hide', render);
        //var pgElement = $('.full-start__pg.hide');
        if (pgElement.length && ratings.ageRating) {
            var invalidRatings = ['N/A', 'Not Rated', 'Unrated', 'NR'];
            var isValid = invalidRatings.indexOf(ratings.ageRating) === -1;
            
            if (isValid) {
                if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert PG");
                var localizedRating = AGE_RATINGS[ratings.ageRating] || ratings.ageRating;
                pgElement.removeClass('hide').text(localizedRating);
            }
        }
        
        // Заполняем IMDb рейтинга
        var imdbElement = $('.rate--imdb', render);
        if (imdbElement.length) {
            var imdbRating;
            if (ratings.imdb && !isNaN(ratings.imdb)) {
                if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert IMDB from OMDB");
                imdbRating = parseFloat(ratings.imdb).toFixed(1);
                imdbElement.removeClass('hide').find('> div').eq(0).text(imdbRating);
            }
            else if (ratings.imdb_kp && !isNaN(ratings.imdb_kp)) {
                if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert IMDB from KP");
                imdbRating = parseFloat(ratings.imdb_kp).toFixed(1);
                imdbElement.removeClass('hide').find('> div').eq(0).text(imdbRating);
            }
        }
        
        var kpElement = $('.rate--kp', render);
        if (kpElement.length && ratings.kp && !isNaN(ratings.kp)) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert KP");
            var kpRating = parseFloat(ratings.kp).toFixed(1);
            kpElement.removeClass('hide').find('> div').eq(0).text(kpRating);
        }
    }
    
    // Вспомогательные функции
    function extractRating(ratings, source) {
        if (!ratings || !Array.isArray(ratings)) return null;
        
        for (var i = 0; i < ratings.length; i++) {
            if (ratings[i].Source === source) {
                try {
                    return source === 'Rotten Tomatoes' 
                        ? parseFloat(ratings[i].Value.replace('%', '')) 
                        : parseFloat(ratings[i].Value.split('/')[0]);
                } catch(e) {
                    console.warn('Ошибка при парсинге рейтинга:', e);
                    return null;
                }
            }
        }
        return null;
    }
    
    function insertRatings(rtRating, mcRating, oscars, awards, emmy, localCurrentCard, render) {
        if (!render) return;
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert OMDB ratings");  
        
        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length) return;

        var lastRate = $('.full-start__rate:last', rateLine);
        
        var showRT = localStorage.getItem('maxsm_ratings_critic')  === 'true';
        var showMC = localStorage.getItem('maxsm_ratings_critic')  === 'true';
        var showAwards = localStorage.getItem('maxsm_ratings_awards') === 'true';
        var showOscar =  localStorage.getItem('maxsm_ratings_awards')  === 'true';
        var showColors = localStorage.getItem('maxsm_ratings_colors')  === 'true';    
        var showEmmy = localStorage.getItem('maxsm_ratings_awards')  === 'true';
        
        var elemLabel;
        
        if (showRT && rtRating && !isNaN(rtRating) && !$('.rate--rt', rateLine).length) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert Tomatoes");
            var rtElement = $(
                '<div class="full-start__rate rate--rt">' +
                    '<div>' + rtRating + '</div>' +
                    '<div class="source--name">Tomatoes</div>' +
                '</div>'
            );
            
            if (lastRate.length) {
                rtElement.insertAfter(lastRate);
            } else {
                rateLine.prepend(rtElement);
            }
        }
    
        if (showMC && mcRating && !isNaN(mcRating) && !$('.rate--mc', rateLine).length) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert Metacritic");
            var insertAfter = $('.rate--rt', rateLine).length ? $('.rate--rt', rateLine) : lastRate;
            var mcElement = $(
                '<div class="full-start__rate rate--mc">' +
                    '<div>' + mcRating + '</div>' +
                    '<div class="source--name">Metacritic</div>' +
                '</div>'
            );
            
            if (insertAfter.length) {
                mcElement.insertAfter(insertAfter);
            } else {
                rateLine.prepend(mcElement);
            }
        }

        if (showAwards && awards && !isNaN(awards) && awards > 0 && !$('.rate--awards', rateLine).length) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert Awards");
            var awardsElement = $(
                '<div class="full-start__rate rate--awards rate--gold">' +
                    '<div>' + awards + '</div>' +
                    '<div class="source--name">' + Lampa.Lang.translate("maxsm_ratings_awards") + '</div>' +
                '</div>'
            );
            if (!showColors) { 
                awardsElement.removeClass('rate--gold'); 
            }
            rateLine.prepend(awardsElement); // Просто вставляем в начало
        }
    
        if (showOscar && oscars && !isNaN(oscars) && oscars > 0 && !$('.rate--oscars', rateLine).length) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert Oscars");
            var oscarsElement = $(
                '<div class="full-start__rate rate--oscars rate--gold">' +
                    '<div>' + oscars + '</div>' +
                    '<div class="source--name">' + Lampa.Lang.translate("maxsm_ratings_oscars") + '</div>' +
                '</div>'
            );
            if (!showColors) { 
                oscarsElement.removeClass('rate--gold'); 
            }
            rateLine.prepend(oscarsElement); // Просто вставляем в начало
        }
        
        if (showEmmy && emmy && !isNaN(emmy) && emmy > 0 && !$('.rate--emmy', rateLine).length) {
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Insert Emmy");
            var emmyElement = $(
                '<div class="full-start__rate rate--emmy rate--gold">' +
                    '<div>' + emmy + '</div>' +
                    '<div class="source--name">' + Lampa.Lang.translate("maxsm_ratings_emmy") + '</div>' +
                '</div>'
            );
            if (!showColors) { 
                emmyElement.removeClass('rate--gold'); 
            }
            rateLine.prepend(emmyElement); // Просто вставляем в начало
        }
    }
    
    function calculateAverageRating(localCurrentCard, render) {
        if (!render) return;
        if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Calculate avarage rating");   
    
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
            var colorClass = getRatingClass(averageRating);
            
            if (C_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", Average rating: " + averageRating);
            
            var avgLabel = Lampa.Lang.translate("maxsm_ratings_avg");
            
            if (mode === 1) {
                avgLabel = Lampa.Lang.translate("maxsm_ratings_avg_simple");
                $('.full-start__rate', rateLine).not('.rate--oscars, .rate--avg, .rate--awards').hide();
            } 

            var avgElement = $(
                '<div class="full-start__rate rate--avg ' + colorClass + '">' +
                    '<div>' + averageRating + '</div>' +
                    '<div class="source--name">' + avgLabel + '</div>' +
                '</div>'
            );

            var showColors = localStorage.getItem('maxsm_ratings_colors')  === 'true';
            
            if (!showColors) { 
                avgElement.removeClass(colorClass); 
            }
            
            $('.full-start__rate:first', rateLine).before(avgElement);
        }

    }
//------------------------------------------------- Лепим на карточки ярлыки качества (через получение с JacRed)
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
                
                if (Q_LOGGING) console.log("MAXSM-RATINGS", "CARDLIST: card data: ", data);
                
                var normalizedCard = {
                    id: data.id || '',
                    title: data.title || data.name || '',
                    original_title: data.original_title || data.original_name || '',
                    release_date: data.release_date || data.first_air_date || '',
                    imdb_id: data.imdb_id || data.imdb || null,
                    type: getCardType(data)
                };     
                
                var localCurrentCard = normalizedCard.id;
                var qCacheKey = normalizedCard.type + '_' + (normalizedCard.id || normalizedCard.imdb_id); 
                var cacheQualityData = getQualityCache(qCacheKey); 
                
                // Если есть кеш - сразу применяем
                if (cacheQualityData) {
                    if (Q_LOGGING) console.log("MAXSM-RATINGS", "card: " + localCurrentCard + ", quality: Get Quality data from cache");
                    applyQualityToCard(currentCard, cacheQualityData.quality, 'Cache');
                } 
                // Если нет кеша - запрашиваем у JacRed
                else {
                    applyQualityToCard(currentCard, '...', 'Pending');
					getBestReleaseFromJacred(normalizedCard, localCurrentCard, function(jrResult) {
                        if (Q_LOGGING) console.log('MAXSM-RATINGS', ' card: ' + localCurrentCard + ', CARDLIST: JacRed callback received');
                        var quality = (jrResult && jrResult.quality) || null;
                        applyQualityToCard(currentCard, quality, 'JacRed', qCacheKey);
                    });
                }
            })(card);
        }
    }

    // Общая функция для применения качества к карточке
    function applyQualityToCard(card, quality, source, qCacheKey) {
        if (!document.body.contains(card)) {
            if (Q_LOGGING) console.log('MAXSM-RATINGS', 'Card removed from DOM:', card.card_data?.id);
            return;
        }
        
        card.setAttribute('data-quality-added', 'true');
        
        var cardView = card.querySelector('.card__view');
        var qualityElements = null;
        
        // Сохраняем в кеш если данные от JacRed
        if (source === 'JacRed' && quality && quality !== 'NO') {
            saveQualityCache(qCacheKey, { quality: quality }, card.card_data?.id);
        }
        
        if (quality && quality !== 'NO') {
            if (Q_LOGGING) console.log('MAXSM-RATINGS', ' card: ' + (card.card_data?.id) + ', CARDLIST: ' + source + ' found quality: ' + quality);
            
            if (cardView) {
                var hasQuality = false;
                qualityElements = cardView.getElementsByClassName('card__quality');
                if (qualityElements.length > 0) hasQuality = true;
                
                var qualityDiv;
                var innerElement;
                var qualityInner;
                
                if (!hasQuality) {
                    qualityDiv = document.createElement('div');
                    qualityDiv.className = 'card__quality';
                    qualityInner = document.createElement('div');
                    qualityInner.textContent = quality;
                    qualityDiv.appendChild(qualityInner);
                    cardView.appendChild(qualityDiv);
                } else {
                    qualityDiv = qualityElements[0];
                    innerElement = qualityDiv.firstElementChild;
                    
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
    
    // Обсервер DOM для новых карт
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
        
    // Инициализация плагина
    function startPlugin() {
        if (C_LOGGING) console.log("MAXSM-RATINGS", " Hello!"); 
        window.maxsmRatingsPlugin = true;
        
        if (!localStorage.getItem('maxsm_ratings_awards')) {
            localStorage.setItem('maxsm_ratings_awards', 'true');
        }
        if (!localStorage.getItem('maxsm_ratings_critic')) {
            localStorage.setItem('maxsm_ratings_critic', 'true');
        }
        if (!localStorage.getItem('maxsm_ratings_colors')) {
            localStorage.setItem('maxsm_ratings_colors', 'true');
        }
        
        if (!localStorage.getItem('maxsm_ratings_icons')) {
            localStorage.setItem('maxsm_ratings_icons', 'true');
        }
    
        if (!localStorage.getItem('maxsm_ratings_mode')) {
            localStorage.setItem('maxsm_ratings_mode', '0');
        }
        
        if (!localStorage.getItem('maxsm_ratings_quality')) {
            localStorage.setItem('maxsm_ratings_quality', 'true');
        }  

        if (!localStorage.getItem('maxsm_ratings_quality_inlist')) {
            localStorage.setItem('maxsm_ratings_quality_inlist', 'true');
        }  
        
        if (!localStorage.getItem('maxsm_ratings_quality_tv')) {
            localStorage.setItem('maxsm_ratings_quality_tv', 'false');
        }  
        
        Lampa.SettingsApi.addComponent({
            component: "maxsm_ratings",
            name: Lampa.Lang.translate("maxsm_ratings"),
            icon: ""
        });

        // Создание объекта для значений выбора режима
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
                onChange: function(value) {
    
                }
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
            },
            onChange: function(value) {
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
            },
            onChange: function(value) {
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
            },
            onChange: function(value) {
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
            },
            onChange: function(value) {
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
            },
            onChange: function(value) {
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
                console.log('MAXSM-RATINGS: observer value' + value);
                if (value === 'true') {
                    observer.observe(document.body, { childList: true, subtree: true });
                    console.log('MAXSM-RATINGS: observer Start');
                } else {
                    observer.disconnect();
                    console.log('MAXSM-RATINGS: observer Stop');
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
            },
            onChange: function(value) {
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
                localStorage.removeItem(OMDB_CACHE);
                localStorage.removeItem(KP_CACHE);
                localStorage.removeItem(ID_MAPPING_CACHE);
                localStorage.removeItem(QUALITY_CACHE);
                window.location.reload();
            }
        });
        
        if (localStorage.getItem('maxsm_ratings_quality_inlist') === 'true') {
            // Вызов наблюдателя
            observer.observe(document.body, { childList: true, subtree: true });
            console.log('MAXSM-RATINGS: observer Start');
        }
        
        // Попадания внутри карточки
		Lampa.Listener.follow('full', function (e) {
			if (e.type == 'complite') {
				var render = e.object.activity.render();
				globalCurrentCard = e.data.movie.id;
                fetchAdditionalRatings(e.data.movie, render);
			}
		});
    }

    if (!window.maxsmRatingsPlugin) startPlugin();
})();
