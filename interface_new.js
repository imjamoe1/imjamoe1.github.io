(function () {
	"use strict";
	Lampa.Platform.tv();

	if (typeof Lampa === "undefined") return;

	if (!Lampa.Maker || !Lampa.Maker.map || !Lampa.Utils) return;
	if (window.plugin_interface_ready_v3) return;

	window.plugin_interface_ready_v3 = true;

	var globalInfoCache = {};

	// --- Fetcher Configuration ---
	var config = {
		api_url: 'https://api.mdblist.com/tmdb/', // Base URL for MDBList TMDB endpoint
		cache_time: 60 * 60 * 12 * 1000, // 12 hours cache duration
		cache_key: 'mdblist_ratings_cache', // Unique storage key for ratings data
		cache_limit: 500, // Max items in cache
		request_timeout: 10000, // 10 seconds request timeout
		// Kinopoisk API configuration
		kp_api_url: 'https://kinopoiskapiunofficial.tech/',
		kp_rating_url: 'https://rating.kinopoisk.ru/',
		kp_api_key: '2a4a0808-81a3-40ae-b0d3-e11335ede616',
		xml_timeout: 5000 // 5 seconds for faster XML endpoint
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

	// --- Settings UI Registration for Additional Ratings ---
	if (window.Lampa && Lampa.SettingsApi) {
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
	}

	// --- Rating Provider Selection Function ---
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

	// --- Core Fetching Logic ---
	function fetchRatings(movieData, callback) {
		if (!Lampa.Reguest) {
			if (callback) callback({ error: "Network component unavailable" });
			return;
		}
		
		var network = new Lampa.Reguest();
		
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

	// --- Kinopoisk Fetching Logic ---
	function fetchKPRatings(movieData, callback) {
		if (!Lampa.Reguest) {
			console.error("KinopoiskFetcher: Lampa.Reguest not available.");
			if (callback) callback({ kp: 0, error: "Network unavailable" });
			return;
		}
		
		var network = new Lampa.Reguest();
		
		// Basic validation of input
		if (!movieData || !movieData.id || !movieData.title || !callback) {
			console.error("KinopoiskFetcher: Invalid input data or missing callback.");
			if (callback) callback({ kp: 0, error: "Invalid input" });
			return;
		}

		var tmdb_id = movieData.id;

		// 1. Check Cache
		var cached_ratings = getKPCache(tmdb_id);
		if (cached_ratings) {
			callback(cached_ratings);
			return;
		}

		// 2. Prepare Search Parameters
		var clean_title = kpCleanTitle(movieData.title);
		var search_date = movieData.release_date || movieData.first_air_date || '0000';
		var search_year = parseInt((search_date + '').slice(0, 4));
		var orig_title = movieData.original_title || movieData.original_name;
		var imdb_id_from_tmdb = movieData.imdb_id;

		// Network request logic
		searchFilmOnKP();

		// --- Nested Functions for Fetching ---
		function searchFilmOnKP() {
			var base_url = config.kp_api_url;
			var headers = { 'X-API-KEY': config.kp_api_key };
			var url_by_title = Lampa.Utils.addUrlComponent(base_url + 'api/v2.1/films/search-by-keyword', 'keyword=' + encodeURIComponent(clean_title));
			var search_url;

			if (imdb_id_from_tmdb) {
				search_url = Lampa.Utils.addUrlComponent(base_url + 'api/v2.2/films', 'imdbId=' + encodeURIComponent(imdb_id_from_tmdb));
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
				var title_matches = filtered.filter(function(item) { return equalTitle(item.title || item.ru_title || item.nameRu, movieData.title) || equalTitle(item.orig_title || item.nameOriginal, orig_title) || equalTitle(item.en_title || item.nameEn, orig_title); });
				if (title_matches.length > 0) filtered = title_matches;
				else {
					var contains_matches = filtered.filter(function(item) { return containsTitle(item.title || item.ru_title || item.nameRu, movieData.title) || containsTitle(item.orig_title || item.nameOriginal, orig_title) || containsTitle(item.en_title || item.nameEn, orig_title); });
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
			network["native"](xml_url, function (xml_str) {
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

	Lampa.Storage.set("interface_size", "small");

	addStyles();
	initializeSettings();

	setupVoteColorsObserver();
	setupVoteColorsForDetailPage();
	setupPreloadObserver();

	var mainMaker = Lampa.Maker.map("Main");
	if (!mainMaker || !mainMaker.Items || !mainMaker.Create) return;

	wrapMethod(mainMaker.Items, "onInit", function (originalMethod, args) {
		this.__newInterfaceEnabled = shouldEnableInterface(this && this.object);

		if (this.__newInterfaceEnabled) {
			if (this.object) this.object.wide = false;
			this.wide = false;
		}

		if (originalMethod) originalMethod.apply(this, args);
	});

	wrapMethod(mainMaker.Create, "onCreate", function (originalMethod, args) {
		if (originalMethod) originalMethod.apply(this, args);
		if (!this.__newInterfaceEnabled) return;

		var state = getOrCreateState(this);
		state.attach();
	});

	wrapMethod(mainMaker.Create, "onCreateAndAppend", function (originalMethod, args) {
		var data = args && args[0];
		if (this.__newInterfaceEnabled && data) {
			data.wide = false;

			if (!data.params) data.params = {};
			if (!data.params.items) data.params.items = {};
			data.params.items.view = 12;
			data.params.items_per_row = 12;
			data.items_per_row = 12;

			extendResultsWithStyle(data);
		}
		return originalMethod ? originalMethod.apply(this, args) : undefined;
	});

	wrapMethod(mainMaker.Items, "onAppend", function (originalMethod, args) {
		if (originalMethod) originalMethod.apply(this, args);
		if (!this.__newInterfaceEnabled) return;

		var element = args && args[0];
		var data = args && args[1];

		if (element && data) {
			handleLineAppend(this, element, data);
		}
	});

	wrapMethod(mainMaker.Items, "onDestroy", function (originalMethod, args) {
		if (this.__newInterfaceState) {
			this.__newInterfaceState.destroy();
			delete this.__newInterfaceState;
		}
		delete this.__newInterfaceEnabled;
		if (originalMethod) originalMethod.apply(this, args);
	});

	function shouldEnableInterface(object) {
		if (!object) return false;
		if (window.innerWidth < 767) return false;
		if (Lampa.Platform.screen("mobile")) return false;
		if (object.title === "Избранное") return false;
		return true;
	}

	function getOrCreateState(createInstance) {
		if (createInstance.__newInterfaceState) {
			return createInstance.__newInterfaceState;
		}
		var state = createState(createInstance);
		createInstance.__newInterfaceState = state;
		return state;
	}

	function createState(mainInstance) {
		var infoPanel = new InfoPanel();
		infoPanel.create();

		var backgroundWrapper = document.createElement("div");
		backgroundWrapper.className = "full-start__background-wrapper";

		var bg1 = document.createElement("img");
		bg1.className = "full-start__background";
		var bg2 = document.createElement("img");
		bg2.className = "full-start__background";

		backgroundWrapper.appendChild(bg1);
		backgroundWrapper.appendChild(bg2);

		var state = {
			main: mainInstance,
			info: infoPanel,
			background: backgroundWrapper,
			infoElement: null,
			backgroundTimer: null,
			backgroundLast: "",
			attached: false,

			attach: function () {
				if (this.attached) return;

				var container = mainInstance.render(true);
				if (!container) return;

				container.classList.add("new-interface");

				if (!backgroundWrapper.parentElement) {
					container.insertBefore(backgroundWrapper, container.firstChild || null);
				}

				var infoElement = infoPanel.render(true);
				this.infoElement = infoElement;

				if (infoElement && infoElement.parentNode !== container) {
					if (backgroundWrapper.parentElement === container) {
						container.insertBefore(infoElement, backgroundWrapper.nextSibling);
					} else {
						container.insertBefore(infoElement, container.firstChild || null);
					}
				}

				mainInstance.scroll.minus(infoElement);
				this.attached = true;
			},

			update: function (data) {
				if (!data) return;
				infoPanel.update(data);
				this.updateBackground(data);
			},

			updateBackground: function (data) {
				var BACKGROUND_DEBOUNCE_DELAY = 300;
				var self = this;

				clearTimeout(this.backgroundTimer);

				if (this._pendingImg) {
					this._pendingImg.onload = null;
					this._pendingImg.onerror = null;
					this._pendingImg = null;
				}

				var show_bg = Lampa.Storage.get("show_background", true);
				var bg_resolution = Lampa.Storage.get("background_resolution", "original");
				var backdropUrl = data && data.backdrop_path && show_bg ? Lampa.Api.img(data.backdrop_path, bg_resolution) : "";

				if (backdropUrl === this.backgroundLast) return;

				this.backgroundTimer = setTimeout(function () {
					if (!backdropUrl) {
						bg1.classList.remove("active");
						bg2.classList.remove("active");
						self.backgroundLast = "";
						return;
					}

					var nextLayer = bg1.classList.contains("active") ? bg2 : bg1;
					var prevLayer = bg1.classList.contains("active") ? bg1 : bg2;

					var img = new Image();
					self._pendingImg = img;

					img.onload = function () {
						if (self._pendingImg !== img) return;
						if (backdropUrl !== self.backgroundLast) return;

						self._pendingImg = null;
						nextLayer.src = backdropUrl;
						nextLayer.classList.add("active");

						setTimeout(function () {
							if (backdropUrl !== self.backgroundLast) return;
							prevLayer.classList.remove("active");
						}, 100);
					};

					self.backgroundLast = backdropUrl;
					img.src = backdropUrl;
				}, BACKGROUND_DEBOUNCE_DELAY);
			},

			reset: function () {
				infoPanel.empty();
			},

			destroy: function () {
				clearTimeout(this.backgroundTimer);
				infoPanel.destroy();

				var container = mainInstance.render(true);
				if (container) {
					container.classList.remove("new-interface");
				}

				if (this.infoElement && this.infoElement.parentNode) {
					this.infoElement.parentNode.removeChild(this.infoElement);
				}

				if (backgroundWrapper && backgroundWrapper.parentNode) {
					backgroundWrapper.parentNode.removeChild(backgroundWrapper);
				}

				this.attached = false;
			},
		};

		return state;
	}

	function extendResultsWithStyle(data) {
		if (!data) return;

		if (Array.isArray(data.results)) {
			data.results.forEach(function (card) {
				if (card.wide !== false) {
					card.wide = false;
				}
			});

			Lampa.Utils.extendItemsParams(data.results, {
				style: {
					name: Lampa.Storage.get("wide_post") !== false ? "wide" : "small",
				},
			});
		}
	}

	function handleCard(state, card) {
		if (!card || card.__newInterfaceCard) return;
		if (typeof card.use !== "function" || !card.data) return;

		card.__newInterfaceCard = true;
		card.params = card.params || {};
		card.params.style = card.params.style || {};

		var targetStyle = Lampa.Storage.get("wide_post") !== false ? "wide" : "small";
		card.params.style.name = targetStyle;

		if (card.render && typeof card.render === "function") {
			var element = card.render(true);
			if (element) {
				var node = element.jquery ? element[0] : element;
				if (node && node.classList) {
					if (targetStyle === "wide") {
						node.classList.add("card--wide");
						node.classList.remove("card--small");
					} else {
						node.classList.add("card--small");
						node.classList.remove("card--wide");
					}
				}
			}
		}

		card.use({
			onFocus: function () {
				state.update(card.data);
			},
			onHover: function () {
				state.update(card.data);
			},
			onTouch: function () {
				state.update(card.data);
			},
			onDestroy: function () {
				delete card.__newInterfaceCard;
			},
		});
	}

	function getCardData(card, results, index) {
		index = index || 0;

		if (card && card.data) return card.data;
		if (results && Array.isArray(results.results)) {
			return results.results[index] || results.results[0];
		}

		return null;
	}

	function findCardData(element) {
		if (!element) return null;

		var node = element && element.jquery ? element[0] : element;

		while (node && !node.card_data) {
			node = node.parentNode;
		}

		return node && node.card_data ? node.card_data : null;
	}

	function getFocusedCard(items) {
		var container = items && typeof items.render === "function" ? items.render(true) : null;
		if (!container || !container.querySelector) return null;

		var focusedElement = container.querySelector(".selector.focus") || container.querySelector(".focus");
		return findCardData(focusedElement);
	}

	function handleLineAppend(items, line, data) {
		if (line.__newInterfaceLine) return;
		line.__newInterfaceLine = true;

		var state = getOrCreateState(items);

		line.items_per_row = 12;
		line.view = 12;
		if (line.params) {
			line.params.items_per_row = 12;
			if (line.params.items) line.params.items.view = 12;
		}

		var processCard = function (card) {
			handleCard(state, card);
		};

		line.use({
			onInstance: function (instance) {
				processCard(instance);
			},
			onActive: function (card, results) {
				var cardData = getCardData(card, results);
				if (cardData) state.update(cardData);
			},
			onToggle: function () {
				setTimeout(function () {
					var focusedCard = getFocusedCard(line);
					if (focusedCard) state.update(focusedCard);
				}, 32);
			},
			onMore: function () {
				state.reset();
			},
			onDestroy: function () {
				state.reset();
				delete line.__newInterfaceLine;
			},
		});

		if (Array.isArray(line.items) && line.items.length) {
			line.items.forEach(processCard);
		}

		if (line.last) {
			var lastCardData = findCardData(line.last);
			if (lastCardData) state.update(lastCardData);
		}
	}

	function wrapMethod(object, methodName, wrapper) {
		if (!object) return;

		var originalMethod = typeof object[methodName] === "function" ? object[methodName] : null;

		object[methodName] = function () {
			var args = Array.prototype.slice.call(arguments);
			return wrapper.call(this, originalMethod, args);
		};
	}

	function addStyles() {
		if (addStyles.added) return;
		addStyles.added = true;

		var styles = Lampa.Storage.get("wide_post") !== false ? getWideStyles() : getSmallStyles();

		Lampa.Template.add("new_interface_style_v3", styles);
		$("body").append(Lampa.Template.get("new_interface_style_v3", {}, true));
	}

	function getWideStyles() {
		// Logo URLs for ratings
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

		return `<style>
					.items-line__title .full-person__photo {
						width: 1.8em !important;
						height: 1.8em !important;
					}
					.items-line__title .full-person--svg .full-person__photo {
						padding: 0.5em !important;
						margin-right: 0.5em !important;
					}
					.items-line__title .full-person__photo {
						margin-right: 0.5em !important;
					}
					.items-line {
						padding-bottom: 4em !important;
					}
					.new-interface-info__head, .new-interface-info__ratings, .new-interface-info__details{ opacity: 0; transition: opacity 0.5s ease; min-height: 2.2em !important;}
					.new-interface-info__head.visible, .new-interface-info__ratings.visible, .new-interface-info__details.visible{ opacity: 1; }
					.new-interface .card.card--wide {
						width: 18.3em;
					}
					.new-interface .card.card--small {
						width: 18.3em;
					}
					.new-interface-info {
						position: relative;
						padding: 1.5em;
						height: 27.5em;
					}
					.new-interface-info__body {
						position: absolute;
						z-index: 9999999;
						width: 80%;
						padding-top: 1.1em;
					}
					.new-interface-info__head {
						color: rgba(255, 255, 255, 0.6);
						font-size: 1.3em;
						min-height: 1em;
						margin-bottom: 1em;
					}
					.new-interface-info__head span {
						color: #fff;
					}
					.new-interface-info__title {
						font-size: 4em;
						font-weight: 600;
						margin-bottom: 0.3em;
						overflow: hidden;
						-o-text-overflow: '.';
						text-overflow: '.';
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
						display: -webkit-box;
						-webkit-line-clamp: 1;
						line-clamp: 1;
						-webkit-box-orient: vertical;
						margin-left: -0.03em;
						line-height: 1.3;
					}
					.new-interface-info__ratings {
						margin-bottom: 0.8em;
						display: flex;
						align-items: center;
						flex-wrap: wrap;
						min-height: 2.5em;
						font-size: 1.3em;
					}
					.new-interface-info__details {
						margin-bottom: 1.6em;
						display: flex;
						align-items: center;
						flex-wrap: wrap;
						min-height: 1.9em;
						font-size: 1.3em;
					}
					.new-interface-info__split {
						margin: 0 0.5em;
						font-size: 0.7em;
					}
					.new-interface-info__description {
						font-size: 1.4em;
						font-weight: 600;
						line-height: 1.3;
						overflow: hidden;
						-o-text-overflow: '.';
						text-overflow: '.';
						text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
						display: -webkit-box;
						-webkit-line-clamp: 3;
						line-clamp: 3;
						-webkit-box-orient: vertical;
						width: 65%;
					}
					.new-interface-info__description:empty,
					.new-interface-info__description.hidden {
						display: none !important;
						height: 0;
						margin: 0;
					}
					.new-interface .card-more__box {
						padding-bottom: 95%;
					}
					.new-interface .full-start__background-wrapper {
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						z-index: -1;
						pointer-events: none;
					}
					.new-interface .full-start__background {
						position: absolute;
						height: calc(100% + 6em);
						width: 100%;
						top: -5em;
						left: 0;
						opacity: 0;
						object-fit: cover;
						transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
					}
					.new-interface .full-start__background.active {
						opacity: 1;
					}
					/* --- Rating Box Styles --- */
					.new-interface .full-start__rate {
						font-size: 1.3em;
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
						margin-bottom: 0.2em;
						margin-right: 0.5em;
					}
					.full-start__rate {
						font-weight: bold;
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
					/* Logo styling */
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
					.logo-fade-in {
						animation: fadeIn 0.5s ease-in;
					}
					@keyframes fadeIn {
						from { opacity: 0; }
						to { opacity: 1; }
					}
					.new-interface .card__promo {
						display: none;
					}
					.new-interface .card.card--wide + .card-more .card-more__box {
						padding-bottom: 95%;
					}
					.new-interface .card.card--wide .card-watched {
						display: none !important;
					}
					body.light--version .new-interface-info__body {
						position: absolute;
						z-index: 9999999;
						width: 69%;
						padding-top: 1.5em;
					}
					body.light--version .new-interface-info {
						height: 25.3em;
					}
					body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.focus .card__view {
						animation: animation-card-focus 0.2s;
					}
					body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.animate-trigger-enter .card__view {
						animation: animation-trigger-enter 0.2s forwards;
					}
					body.advanced--animation:not(.no--animation) .new-interface .card.card--small.focus .card__view {
						animation: animation-card-focus 0.2s;
					}
					body.advanced--animation:not(.no--animation) .new-interface .card.card--small.animate-trigger-enter .card__view {
						animation: animation-trigger-enter 0.2s forwards;
					}
					.logo-moved-head { transition: opacity 0.4s ease; }
					.logo-moved-separator { transition: opacity 0.4s ease; }
					${Lampa.Storage.get("hide_captions", true) ? ".card:not(.card--collection) .card__age, .card:not(.card--collection) .card__title { display: none !important; }" : ""}
				</style>`;
	}

	function getSmallStyles() {
		// Logo URLs for ratings
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

		return `<style>
					.new-interface-info__head, .new-interface-info__ratings, .new-interface-info__details{ opacity: 0; transition: opacity 0.5s ease; min-height: 2.2em !important;}
					.new-interface-info__head.visible, .new-interface-info__ratings.visible, .new-interface-info__details.visible{ opacity: 1; }
					.new-interface .card.card--wide{
						width: 18.3em;
					}
					.items-line__title .full-person__photo {
						width: 1.8em !important;
						height: 1.8em !important;
					}
					.items-line__title .full-person--svg .full-person__photo {
						padding: 0.5em !important;
						margin-right: 0.5em !important;
					}
					.items-line__title .full-person__photo {
						margin-right: 0.5em !important;
					}
					.new-interface-info {
						position: relative;
						padding: 1.5em;
						height: 22.8em;
					}
					.new-interface-info__body {
						position: absolute;
						z-index: 9999999;
						width: 80%;
						padding-top: 0.2em;
					}
					.new-interface-info__head {
						color: rgba(255, 255, 255, 0.6);
						margin-bottom: 0.3em;
						font-size: 1.2em;
						min-height: 1em;
					}
					.new-interface-info__head span {
						color: #fff;
					}
					.new-interface-info__title {
						font-size: 3em;
						font-weight: 600;
						margin-bottom: 0.2em;
						overflow: hidden;
						-o-text-overflow: '.';
						text-overflow: '.';
						display: -webkit-box;
						-webkit-line-clamp: 1;
						line-clamp: 1;
						-webkit-box-orient: vertical;
						margin-left: -0.03em;
						line-height: 1.3;
					}
					.new-interface-info__ratings {
						margin-bottom: 0.8em;
						display: flex;
						align-items: center;
						flex-wrap: wrap;
						min-height: 2.5em;
						font-size: 1.2em;
					}
					.new-interface-info__details {
						margin-bottom: 1.6em;
						display: flex;
						align-items: center;
						flex-wrap: wrap;
						min-height: 1.9em;
						font-size: 1.2em;
					}
					.new-interface-info__split {
						margin: 0 0.5em;
						font-size: 0.7em;
					}
					.new-interface-info__description {
						font-size: 1.3em;
						font-weight: 600;
						line-height: 1.3;
						overflow: hidden;
						-o-text-overflow: '.';
						text-overflow: '.';
						text-shadow: 1px 1px 2px #000;
						display: -webkit-box;
						-webkit-line-clamp: 2;
						line-clamp: 2;
						-webkit-box-orient: vertical;
						width: 70%;
					}
					.new-interface-info__description:empty,
					.new-interface-info__description.hidden {
						display: none !important;
						height: 0;
						margin: 0;
					}
					.new-interface .card-more__box {
						padding-bottom: 150%;
					}
					.new-interface .full-start__background-wrapper {
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						z-index: -1;
						pointer-events: none;
					}
					.new-interface .full-start__background {
						position: absolute;
						height: calc(100% + 6em);
						width: 100%;
						top: -5em;
						left: 0;
						opacity: 0;
						object-fit: cover;
						transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
					}
					.new-interface .full-start__background.active {
						opacity: 1;
					}
					/* --- Rating Box Styles --- */
					.new-interface .full-start__rate {
						font-size: 1.2em;
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
						margin-bottom: 0.2em;
						margin-right: 0.5em;
					}
					.full-start__rate {
						font-weight: bold;
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
					/* Logo styling */
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
					.logo-fade-in {
						animation: fadeIn 0.5s ease-in;
					}
					@keyframes fadeIn {
						from { opacity: 0; }
						to { opacity: 1; }
					}
					.new-interface .card__promo {
						display: none;
					}
					.new-interface .card.card--wide + .card-more .card-more__box {
						padding-bottom: 95%;
					}
					.new-interface .card.card--wide .card-watched {
						display: none !important;
					}
					body.light--version .new-interface-info__body {
						position: absolute;
						z-index: 9999999;
						width: 69%;
						padding-top: 1.5em;
					}
					body.light--version .new-interface-info {
						height: 25.3em;
					}
					body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.focus .card__view {
						animation: animation-card-focus 0.2s;
					}
					body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.animate-trigger-enter .card__view {
						animation: animation-trigger-enter 0.2s forwards;
					}
					body.advanced--animation:not(.no--animation) .new-interface .card.card--small.focus .card__view {
						animation: animation-card-focus 0.2s;
					}
					body.advanced--animation:not(.no--animation) .new-interface .card.card--small.animate-trigger-enter .card__view {
						animation: animation-trigger-enter 0.2s forwards;
					}
					.logo-moved-head { transition: opacity 0.4s ease; }
					.logo-moved-separator { transition: opacity 0.4s ease; }
					${Lampa.Storage.get("hide_captions", true) ? ".card:not(.card--collection) .card__age, .card:not(.card--collection) .card__title { display: none !important; }" : ""}
				</style>`;
	}

	function preloadData(data, silent) {
		if (!data || !data.id) return;
		var source = data.source || "tmdb";
		if (source !== "tmdb" && source !== "cub") return;

		var mediaType = data.media_type === "tv" || data.name ? "tv" : "movie";
		var language = Lampa.Storage.get("language") || "ru";
		var apiUrl = Lampa.TMDB.api(mediaType + "/" + data.id + "?api_key=" + Lampa.TMDB.key() + "&append_to_response=content_ratings,release_dates&language=" + language);

		if (!globalInfoCache[apiUrl]) {
			var network = new Lampa.Reguest();
			network.silent(apiUrl, function (response) {
				globalInfoCache[apiUrl] = response;
			});
		}
	}

	var preloadTimer = null;
	function preloadAllVisibleCards() {
		if (!Lampa.Storage.get("async_load", true)) return;

		clearTimeout(preloadTimer);
		preloadTimer = setTimeout(function () {
			var layer = $(".layer--visible");
			if (!layer.length) return;

			var cards = layer.find(".card");
			var count = 0;

			cards.each(function () {
				var data = findCardData(this);
				if (data) {
					preloadData(data, true);
					count++;
				}
			});
		}, 800);
	}

	function setupPreloadObserver() {
		var observer = new MutationObserver(function (mutations) {
			if (!Lampa.Storage.get("async_load", true)) return;

			var hasNewCards = false;
			for (var i = 0; i < mutations.length; i++) {
				var added = mutations[i].addedNodes;
				for (var j = 0; j < added.length; j++) {
					var node = added[j];
					if (node.nodeType === 1) {
						if (node.classList.contains("card") || node.querySelector(".card")) {
							hasNewCards = true;
							break;
						}
					}
				}
				if (hasNewCards) break;
			}

			if (hasNewCards) {
				preloadAllVisibleCards();
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}
	
	function InfoPanel() {
		this.html = null;
		this.timer = null;
		this.fadeTimer = null;
		this.network = new Lampa.Reguest();
		this.loaded = globalInfoCache;
		this.currentUrl = null;
		this.lastRenderId = null;
	}

	InfoPanel.prototype.create = function () {
		this.html = $(`<div class="new-interface-info">
							<div class="new-interface-info__body">
								<div class="new-interface-info__head"></div>
								<div class="new-interface-info__title"></div>
								<div class="new-interface-info__ratings"></div>
								<div class="new-interface-info__details"></div>
								<div class="new-interface-info__description"></div>
							</div>
						</div>`);
	};

	InfoPanel.prototype.render = function (asElement) {
		if (!this.html) this.create();
		return asElement ? this.html[0] : this.html;
	};

	InfoPanel.prototype.update = function (data) {
		if (!data || !this.html) return;

		this.lastRenderId = Date.now();
		var currentRenderId = this.lastRenderId;

		this.html.find(".new-interface-info__head,.new-interface-info__ratings,.new-interface-info__details").removeClass("visible");

		var title = this.html.find(".new-interface-info__title");
		var desc = this.html.find(".new-interface-info__description");

		// Проверяем настройку desc перед отображением описания
		if (Lampa.Storage.get("desc", true) !== false) {
			desc.text(data.overview || Lampa.Lang.translate("full_notext"));
			desc.removeClass("hidden");
		} else {
			desc.text(""); 
			desc.addClass("hidden");
		}

		clearTimeout(this.fadeTimer);

		Lampa.Background.change(Lampa.Api.img(data.backdrop_path, "original"));

		// Запускаем загрузку дополнительных рейтингов
		if (data.id && data.method) {
			var tmdb_id = data.id;
			
			// Загружаем рейтинги MDBList
			if (!mdblistRatingsPending[tmdb_id]) {
				mdblistRatingsPending[tmdb_id] = true;
				fetchRatings(data, function(mdblistResult) {
					mdblistRatingsCache[tmdb_id] = mdblistResult;
					delete mdblistRatingsPending[tmdb_id];
					// Обновляем отображение если данные уже загружены
					if (currentRenderId === this.lastRenderId) {
						var apiUrl = Lampa.TMDB.api((data.name ? 'tv' : 'movie') + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get('language'));
						if (this.loaded[apiUrl]) {
							this.draw(this.loaded[apiUrl]);
						}
					}
				}.bind(this));
			}

			// Загружаем рейтинги Kinopoisk
			if (!kpRatingsPending[tmdb_id] && data.title) {
				kpRatingsPending[tmdb_id] = true;
				fetchKPRatings(data, function(kpResult) {
					kpRatingsCache[tmdb_id] = kpResult;
					delete kpRatingsPending[tmdb_id];
					// Обновляем отображение если данные уже загружены
					if (currentRenderId === this.lastRenderId) {
						var apiUrl = Lampa.TMDB.api((data.name ? 'tv' : 'movie') + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get('language'));
						if (this.loaded[apiUrl]) {
							this.draw(this.loaded[apiUrl]);
						}
					}
				}.bind(this));
			}
		}

		this.load(data);

		if (Lampa.Storage.get("logo_show", true)) {
			title.text(data.title || data.name || "");
			title.css({ opacity: 1 });
			this.showLogo(data, currentRenderId);
		} else {
			title.text(data.title || data.name || "");
			title.css({ opacity: 1 });
		}
	};

	InfoPanel.prototype.showLogo = function (data, renderId) {
		var _this = this;

		var FADE_OUT_TEXT = 300;
		var MORPH_HEIGHT = 400;
		var FADE_IN_IMG = 400;
		var TARGET_WIDTH = "7em";
		var PADDING_TOP_EM = 0;
		var PADDING_BOTTOM_EM = 0.2;

		var title_elem = this.html.find(".new-interface-info__title");
		var head_elem = this.html.find(".new-interface-info__head");
		var ratings_elem = this.html.find(".new-interface-info__ratings");
		var details_elem = this.html.find(".new-interface-info__details");
		var dom_title = title_elem[0];

		function animateHeight(element, start, end, duration, callback) {
			var startTime = null;
			function step(timestamp) {
				if (!startTime) startTime = timestamp;
				var progress = timestamp - startTime;
				var percent = Math.min(progress / duration, 1);
				var ease = 1 - Math.pow(1 - percent, 3);
				element.style.height = start + (end - start) * ease + "px";
				if (progress < duration) {
					requestAnimationFrame(step);
				} else {
					if (callback) callback();
				}
			}
			requestAnimationFrame(step);
		}

		function animateOpacity(element, start, end, duration, callback) {
			var startTime = null;
			function step(timestamp) {
				if (!startTime) startTime = timestamp;
				var progress = timestamp - startTime;
				var percent = Math.min(progress / duration, 1);
				var ease = 1 - Math.pow(1 - percent, 3);
				element.style.opacity = start + (end - start) * ease;
				if (progress < duration) {
					requestAnimationFrame(step);
				} else {
					if (callback) callback();
				}
			}
			requestAnimationFrame(step);
		}

		function applyFinalStyles(img, text_height) {
			img.style.marginTop = "0";
			img.style.marginLeft = "0";
			img.style.paddingTop = PADDING_TOP_EM + "em";
			img.style.paddingBottom = PADDING_BOTTOM_EM + "em";

			img.style.imageRendering = "-webkit-optimize-contrast";

			if (text_height) {
				img.style.height = text_height + "px";
				img.style.width = "auto";
				img.style.maxWidth = "100%";
				img.style.maxHeight = "none";
			} else if (window.innerWidth < 768) {
				img.style.width = "100%";
				img.style.height = "auto";
				img.style.maxWidth = "100%";
				img.style.maxHeight = "none";
			} else {
				img.style.width = TARGET_WIDTH;
				img.style.height = "auto";
				img.style.maxHeight = "none";
				img.style.maxWidth = "100%";
			}

			img.style.boxSizing = "border-box";
			img.style.display = "block";
			img.style.objectFit = "contain";
			img.style.objectPosition = "left bottom";
			img.style.transition = "none";
		}

		function startLogoAnimation(img_url, fromCache) {
			if (renderId && renderId !== _this.lastRenderId) return;

			var img = new Image();
			img.src = img_url;

			var start_text_height = 0;
			if (dom_title) start_text_height = dom_title.getBoundingClientRect().height;

			if (fromCache) {
				if (dom_title) start_text_height = dom_title.getBoundingClientRect().height;

				applyFinalStyles(img, start_text_height);

				title_elem.empty().append(img);
				title_elem.css({ opacity: "1", transition: "none" });

				if (dom_title) {
					dom_title.style.display = "block";
					dom_title.style.height = "";
					dom_title.style.transition = "none";
				}
				img.style.opacity = "1";
				return;
			}

			applyFinalStyles(img, start_text_height);
			img.style.opacity = "0";

			img.onload = function () {
				if (renderId && renderId !== _this.lastRenderId) return;

				setTimeout(function () {
					if (renderId && renderId !== _this.lastRenderId) return;

					if (dom_title) start_text_height = dom_title.getBoundingClientRect().height;

					title_elem.css({
						transition: "opacity " + FADE_OUT_TEXT / 1000 + "s ease",
						opacity: "0",
					});

					setTimeout(function () {
						if (renderId && renderId !== _this.lastRenderId) return;

						title_elem.empty();
						title_elem.append(img);
						title_elem.css({ opacity: "1", transition: "none" });

						var target_container_height = dom_title.getBoundingClientRect().height;

						dom_title.style.height = start_text_height + "px";
						dom_title.style.display = "block";
						dom_title.style.overflow = "hidden";
						dom_title.style.boxSizing = "border-box";

						void dom_title.offsetHeight;

						dom_title.style.transition = "height " + MORPH_HEIGHT / 1000 + "s cubic-bezier(0.4, 0, 0.2, 1)";

						requestAnimationFrame(function () {
							if (renderId && renderId !== _this.lastRenderId) return;
							dom_title.style.height = target_container_height + "px";

							setTimeout(
								function () {
									if (renderId && renderId !== _this.lastRenderId) return;
									img.style.transition = "opacity " + FADE_IN_IMG / 1000 + "s ease";
									img.style.opacity = "1";
								},
								Math.max(0, MORPH_HEIGHT - 100),
							);

							setTimeout(
								function () {
									if (renderId && renderId !== _this.lastRenderId) return;
									applyFinalStyles(img, start_text_height);
									dom_title.style.height = "";
								},
								MORPH_HEIGHT + FADE_IN_IMG + 50,
							);
						});
					}, FADE_OUT_TEXT);
				}, 200);
			};

			img.onerror = function () {
				title_elem.css({ opacity: "1", transition: "none" });
			};
		}

		if (data.id) {
			var type = data.name ? "tv" : "movie";
			var language = Lampa.Storage.get("language");
			var cache_key = "logo_cache_v2_" + type + "_" + data.id + "_" + language;
			var cached_url = Lampa.Storage.get(cache_key);

			if (cached_url && cached_url !== "none") {
				var img_cache = new Image();
				img_cache.src = cached_url;

				if (img_cache.complete || Lampa.Storage.get("async_load", true)) {
					startLogoAnimation(cached_url, true);
				} else {
					startLogoAnimation(cached_url, false);
				}
			} else {
				var url = Lampa.TMDB.api(type + "/" + data.id + "/images?api_key=" + Lampa.TMDB.key() + "&include_image_language=" + language + ",en,null");

				$.get(url, function (data_api) {
					if (renderId && renderId !== _this.lastRenderId) return;

					var final_logo = null;
					if (data_api.logos && data_api.logos.length > 0) {
						for (var i = 0; i < data_api.logos.length; i++) {
							if (data_api.logos[i].iso_639_1 == language) {
								final_logo = data_api.logos[i].file_path;
								break;
							}
						}
						if (!final_logo) {
							for (var j = 0; j < data_api.logos.length; j++) {
								if (data_api.logos[j].iso_639_1 == "en") {
									final_logo = data_api.logos[j].file_path;
									break;
								}
							}
						}
						if (!final_logo) final_logo = data_api.logos[0].file_path;
					}

					if (final_logo) {
						var img_url = Lampa.TMDB.image("/t/p/original" + final_logo.replace(".svg", ".png"));
						Lampa.Storage.set(cache_key, img_url);
						startLogoAnimation(img_url, false);
					} else {
						Lampa.Storage.set(cache_key, "none");
					}
				}).fail(function () {});
			}
		}
	};

	InfoPanel.prototype.load = function (data) {
		if (!data || !data.id) return;

		var source = data.source || "tmdb";
		if (source !== "tmdb" && source !== "cub") return;

		if (!Lampa.TMDB || typeof Lampa.TMDB.api !== "function" || typeof Lampa.TMDB.key !== "function") return;

		var mediaType = data.media_type === "tv" || data.name ? "tv" : "movie";
		var language = Lampa.Storage.get("language");
		var apiUrl = Lampa.TMDB.api(mediaType + "/" + data.id + "?api_key=" + Lampa.TMDB.key() + "&append_to_response=content_ratings,release_dates&language=" + language);

		this.currentUrl = apiUrl;

		if (this.loaded[apiUrl]) {
			this.draw(this.loaded[apiUrl]);
			return;
		}

		clearTimeout(this.timer);
		var self = this;

		this.timer = setTimeout(function () {
			self.network.clear();
			self.network.timeout(5000);
			self.network.silent(apiUrl, function (response) {
				self.loaded[apiUrl] = response;
				if (self.currentUrl === apiUrl) {
					self.draw(response);
				}
			});
		}, 300);
	};

	InfoPanel.prototype.draw = function (data) {
		if (!data || !this.html) return;

		// Очищаем перемещенные элементы из details
		this.html.find(".new-interface-info__details .logo-moved-head, .new-interface-info__details .logo-moved-separator").remove();

		// Проверяем настройку desc перед отображением описания
		if (Lampa.Storage.get("desc", true) !== false && data.overview) {
			this.html.find(".new-interface-info__description").text(data.overview);
		}

		var year = ((data.release_date || data.first_air_date || "0000") + "").slice(0, 4);

		var rating = parseFloat((data.vote_average || 0) + "").toFixed(1);

		var headInfo = [];
		var ratingsInfo = [];
		var detailsInfo = [];

		var countries = Lampa.Api.sources.tmdb.parseCountries(data);
		if (countries.length > 2) countries = countries.slice(0, 2);

		var ageRating = Lampa.Api.sources.tmdb.parsePG(data);

		var show_logo = Lampa.Storage.get("logo_show", true);

		// Год и страны переносим в верхний блок (headInfo)
		if (year !== "0000") {
			headInfo.push("<span>" + year + "</span>");
		}
		if (countries.length > 0) {
			headInfo.push(countries.join(", "));
		}

		// Получаем дополнительные рейтинги из кэша
		var tmdb_id = data.id;
		var mdblistResult = mdblistRatingsCache[tmdb_id];
		var kpResult = kpRatingsCache[tmdb_id];

		// Logo URLs для рейтингов
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

		// Проверяем какие рейтинги показывать
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

		// ========== РЕЙТИНГИ (первая строка под названием) ==========
		// TMDB рейтинг
		if (Lampa.Storage.get("rat") !== false && showTmdb) {
			if (rating > 0) {
				var rate_style = "";

				if (Lampa.Storage.get("colored_ratings", true)) {
					var vote_num = parseFloat(rating);
					var color = "";

					if (vote_num >= 0 && vote_num <= 3) {
						color = "red";
					} else if (vote_num > 3 && vote_num < 6) {
						color = "orange";
					} else if (vote_num >= 6 && vote_num < 7) {
						color = "cornflowerblue";
					} else if (vote_num >= 7 && vote_num < 8) {
						color = "darkmagenta";
					} else if (vote_num >= 8 && vote_num <= 10) {
						color = "lawngreen";
					}

					if (color) rate_style = ' style="color: ' + color + '"';
				}

				ratingsInfo.push('<div class="full-start__rate tmdb-rating-item"' + rate_style + '><div>' + rating + '</div><img src="' + tmdbLogoUrl + '" class="rating-logo tmdb-logo" alt="TMDB" draggable="false"></div>');
			}
		}

		// IMDb рейтинг
		if (showImdb) {
			var imdbRating = mdblistResult && mdblistResult.imdb !== null && typeof mdblistResult.imdb === 'number' ? parseFloat(mdblistResult.imdb || 0).toFixed(1) : '0.0';
			ratingsInfo.push('<div class="full-start__rate imdb-rating-item"><div>' + imdbRating + '</div><img src="' + imdbLogoUrl + '" class="rating-logo imdb-logo" alt="IMDB" draggable="false"></div>');
		}

		// Kinopoisk рейтинг
		if (showKp) {
			var kpRating = kpResult && kpResult.kp !== null && typeof kpResult.kp === 'number' ? parseFloat(kpResult.kp || 0).toFixed(1) : '0.0';
			ratingsInfo.push('<div class="full-start__rate kp-rating-item"><div>' + kpRating + '</div><img src="' + kpLogoUrl + '" class="rating-logo kp-logo" alt="Kinopoisk" draggable="false"></div>');
		}

		// Rotten Tomatoes (Critics)
		if (showTomatoes) {
			if (mdblistResult && typeof mdblistResult.tomatoes === 'number' && mdblistResult.tomatoes !== null) { 
				let score = mdblistResult.tomatoes; 
				let logoUrl = ''; 
				if (score >= 60) { logoUrl = rtFreshLogoUrl; } 
				else if (score >= 0) { logoUrl = rtRottenLogoUrl; } 
				if (logoUrl) { 
					ratingsInfo.push('<div class="full-start__rate rt-rating-item"><div class="rt-score">' + score + '</div><img src="' + logoUrl + '" class="rating-logo rt-logo" alt="RT Critics" draggable="false"></div>'); 
				} 
			}
		}

		// Rotten Tomatoes (Audience)
		if (showAudience) {
			if (mdblistResult && mdblistResult.popcorn != null) { 
				let parsedScore = parseFloat(mdblistResult.popcorn); 
				if (!isNaN(parsedScore)) { 
					let score = parsedScore; 
					let logoUrl = ''; 
					if (score >= 60) { logoUrl = rtAudienceFreshLogoUrl; } 
					else if (score >= 0) { logoUrl = rtAudienceSpilledLogoUrl; } 
					if (logoUrl) { 
						ratingsInfo.push('<div class="full-start__rate rt-audience-rating-item"><div class="rt-audience-score">' + score + '</div><img src="' + logoUrl + '" class="rating-logo rt-audience-logo" alt="RT Audience" draggable="false"></div>'); 
					} 
				} 
			}
		}

		// Metacritic
		if (showMetacritic) {
			if (mdblistResult && typeof mdblistResult.metacritic === 'number' && mdblistResult.metacritic !== null) { 
				let score = mdblistResult.metacritic; 
				if (score >= 0) { 
					ratingsInfo.push('<div class="full-start__rate metacritic-rating-item"><div class="metacritic-score">' + score + '</div><img src="' + metacriticLogoUrl + '" class="rating-logo metacritic-logo" alt="Metacritic" draggable="false"></div>'); 
				} 
			}
		}

		// Trakt
		if (showTrakt) {
			if (mdblistResult && mdblistResult.trakt != null) { 
				let parsedScore = parseFloat(mdblistResult.trakt); 
				if (!isNaN(parsedScore)) { 
					let score = parsedScore; 
					if (score >= 0) { 
						ratingsInfo.push('<div class="full-start__rate trakt-rating-item"><div class="trakt-score">' + score + '</div><img src="' + traktLogoUrl + '" class="rating-logo trakt-logo" alt="Trakt" draggable="false"></div>'); 
					} 
				} 
			}
		}

		// Letterboxd
		if (showLetterboxd) {
			if (mdblistResult && mdblistResult.letterboxd != null) { 
				let parsedScore = parseFloat(mdblistResult.letterboxd); 
				if (!isNaN(parsedScore)) { 
					let score = parsedScore.toFixed(1); 
					if (parsedScore >= 0) { 
						ratingsInfo.push('<div class="full-start__rate letterboxd-rating-item"><div class="letterboxd-score">' + score + '</div><img src="' + letterboxdLogoUrl + '" class="rating-logo letterboxd-logo" alt="Letterboxd" draggable="false"></div>'); 
					} 
				} 
			}
		}

		// Roger Ebert
		if (showRogerebert) {
			if (mdblistResult && mdblistResult.rogerebert != null) { 
				let parsedScore = parseFloat(mdblistResult.rogerebert); 
				if (!isNaN(parsedScore)) { 
					let score = parsedScore.toFixed(1); 
					if (parsedScore >= 0) { 
						ratingsInfo.push('<div class="full-start__rate rogerebert-rating-item"><div class="rogerebert-score">' + score + '</div><img src="' + rogerEbertLogoUrl + '" class="rating-logo rogerebert-logo" alt="Roger Ebert" draggable="false"></div>'); 
					} 
				} 
			}
		}

		// ========== ДЕТАЛИ (вторая строка под рейтингами) ==========
		if (Lampa.Storage.get("ganr") !== false) {
			if (data.genres && data.genres.length > 0) {
				detailsInfo.push(
					data.genres
						.slice(0, 2)
						.map(function (genre) {
							return Lampa.Utils.capitalizeFirstLetter(genre.name);
						})
						.join(" | "),
				);
			}
		}

		if (Lampa.Storage.get("vremya") !== false) {
			if (data.runtime) {
				if (detailsInfo.length > 0) detailsInfo.push('<span class="new-interface-info__split">&#9679;</span>');
				detailsInfo.push(Lampa.Utils.secondsToTime(data.runtime * 60, true));
			}
		}

		if (Lampa.Storage.get("seas", false) && data.number_of_seasons) {
			if (detailsInfo.length > 0) detailsInfo.push('<span class="new-interface-info__split">&#9679;</span>');
			detailsInfo.push('<span class="full-start__pg" style="font-size: 0.9em;">Сезонов ' + data.number_of_seasons + "</span>");
		}

		if (Lampa.Storage.get("eps", false) && data.number_of_episodes) {
			if (detailsInfo.length > 0) detailsInfo.push('<span class="new-interface-info__split">&#9679;</span>');
			detailsInfo.push('<span class="full-start__pg" style="font-size: 0.9em;">Эпизодов ' + data.number_of_episodes + "</span>");
		}

		if (Lampa.Storage.get("year_ogr") !== false) {
			if (ageRating) {
				if (detailsInfo.length > 0) detailsInfo.push('<span class="new-interface-info__split">&#9679;</span>');
				detailsInfo.push('<span class="full-start__pg" style="font-size: 0.9em;">' + ageRating + "</span>");
			}
		}

		if (Lampa.Storage.get("status") !== false) {
			var statusText = "";

			if (data.status) {
				switch (data.status.toLowerCase()) {
					case "released":
						statusText = "Выпущенный";
						break;
					case "ended":
						statusText = "Закончен";
						break;
					case "returning series":
						statusText = "Онгоинг";
						break;
					case "canceled":
						statusText = "Отменено";
						break;
					case "post production":
						statusText = "Скоро";
						break;
					case "planned":
						statusText = "Запланировано";
						break;
					case "in production":
						statusText = "В производстве";
						break;
					default:
						statusText = data.status;
						break;
				}
			}

			if (statusText) {
				if (detailsInfo.length > 0) detailsInfo.push('<span class="new-interface-info__split">&#9679;</span>');
				detailsInfo.push('<span class="full-start__status" style="font-size: 0.9em;">' + statusText + "</span>");
			}
		}

		// Отображаем все блоки
		this.html
			.find(".new-interface-info__head")
			.empty()
			.append(headInfo.join(", "))
			.toggleClass("visible", headInfo.length > 0);
		
		this.html
			.find(".new-interface-info__ratings")
			.html(ratingsInfo.join(''))
			.toggleClass("visible", ratingsInfo.length > 0);
		
		this.html
			.find(".new-interface-info__details")
			.html(detailsInfo.join(''))
			.toggleClass("visible", detailsInfo.length > 0);
	};

	InfoPanel.prototype.empty = function () {
		if (!this.html) return;
		this.html.find(".new-interface-info__head,.new-interface-info__ratings,.new-interface-info__details").text("").removeClass("visible");
		// Очищаем перемещенные элементы
		this.html.find(".new-interface-info__details .logo-moved-head, .new-interface-info__details .logo-moved-separator").remove();
	};

	InfoPanel.prototype.destroy = function () {
		clearTimeout(this.fadeTimer);
		clearTimeout(this.timer);
		this.network.clear();
		this.currentUrl = null;

		if (this.html) {
			this.html.remove();
			this.html = null;
		}
	};

	function getColorByRating(vote) {
		if (isNaN(vote)) return "";
		if (vote >= 0 && vote <= 3) return "red";
		if (vote > 3 && vote < 6) return "orange";
		if (vote >= 6 && vote < 7) return "cornflowerblue";
		if (vote >= 7 && vote < 8) return "darkmagenta";
		if (vote >= 8 && vote <= 10) return "lawngreen";
		return "";
	}

	function applyColorByRating(element) {
		var $el = $(element);
		var voteText = $el.text().trim();

		if (/^\d+(\.\d+)?K$/.test(voteText)) return;

		var match = voteText.match(/(\d+(\.\d+)?)/);
		if (!match) return;

		var vote = parseFloat(match[0]);
		var color = getColorByRating(vote);

		if (color && Lampa.Storage.get("colored_ratings", true)) {
			$el.css("color", color);

			// Применяем обводку только к элементам страницы деталей, исключая карточки
			if (Lampa.Storage.get("rating_border", false) && !$el.hasClass("card__vote")) {
				// Для элементов типа .rate--kp, .rate--imdb, .rate--cub применяем обводку только к родителю
				if ($el.parent().hasClass("full-start__rate")) {
					$el.parent().css("border", "1px solid " + color);
					$el.css("border", "");
				} else if ($el.hasClass("full-start__rate") || $el.hasClass("full-start-new__rate") || $el.hasClass("info__rate")) {
					$el.css("border", "1px solid " + color);
				} else {
					$el.css("border", "");
				}
			} else {
				$el.css("border", "");
				if ($el.parent().hasClass("full-start__rate")) {
					$el.parent().css("border", "");
				}
			}
		} else {
			$el.css("color", "");
			$el.css("border", "");
			if ($el.parent().hasClass("full-start__rate")) {
				$el.parent().css("border", "");
			}
		}
	}

	function updateVoteColors() {
		if (!Lampa.Storage.get("colored_ratings", true)) return;

		$(".card__vote").each(function () {
			applyColorByRating(this);
		});

		$(".full-start__rate, .full-start-new__rate").each(function () {
			applyColorByRating(this);
		});

		$(".info__rate, .card__imdb-rate, .card__kinopoisk-rate").each(function () {
			applyColorByRating(this);
		});

		$(".rate--kp, .rate--imdb, .rate--cub").each(function () {
			applyColorByRating($(this).find("> div").eq(0));
		});
	}

	function setupVoteColorsObserver() {
		updateVoteColors();

		var pendingUpdate = null;
		var observer = new MutationObserver(function (mutations) {
			if (!Lampa.Storage.get("colored_ratings", true)) return;

			for (var i = 0; i < mutations.length; i++) {
				var added = mutations[i].addedNodes;
				for (var j = 0; j < added.length; j++) {
					var node = added[j];
					if (node.nodeType === 1) {
						var $node = $(node);
						$node.find(".card__vote, .full-start__rate, .full-start-new__rate, .info__rate, .card__imdb-rate, .card__kinopoisk-rate").each(function () {
							applyColorByRating(this);
						});
						$node.find(".rate--kp, .rate--imdb, .rate--cub").each(function () {
							applyColorByRating($(this).find("> div").eq(0));
						});
						if ($node.hasClass("card__vote") || $node.hasClass("full-start__rate") || $node.hasClass("info__rate")) {
							applyColorByRating(node);
						}
						if ($node.hasClass("rate--kp") || $node.hasClass("rate--imdb") || $node.hasClass("rate--cub")) {
							applyColorByRating($node.find("> div").eq(0));
						}
					}
				}
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	function setupVoteColorsForDetailPage() {
		if (!window.Lampa || !Lampa.Listener) return;

		Lampa.Listener.follow("full", function (data) {
			if (data.type === "complite") {
				updateVoteColors();
			}
		});

		Lampa.Listener.follow("activity", function (e) {
			if (e.type === "active" || e.type === "start") {
				setTimeout(preloadAllVisibleCards, 1000);
			}
		});

		Lampa.Listener.follow("target", function (e) {
			if (e.target && $(e.target).hasClass("card")) {
				preloadAllVisibleCards();
			}
		});
	}

	function initializeSettings() {
		Lampa.Settings.listener.follow("open", function (event) {
			if (event.name == "main") {
				if (Lampa.Settings.main().render().find('[data-component="style_interface"]').length == 0) {
					Lampa.SettingsApi.addComponent({
						component: "style_interface",
						name: "Стильный интерфейс",
					});
				}

				Lampa.Settings.main().update();
				Lampa.Settings.main().render().find('[data-component="style_interface"]').addClass("hide");
			}
		});

		Lampa.SettingsApi.addParam({
			component: "interface",
			param: {
				name: "style_interface",
				type: "static",
				default: true,
			},
			field: {
				name: "Стильный интерфейс",
				description: "Настройки элементов",
			},
			onRender: function (item) {
				setTimeout(function () {
					$('.settings-param > div:contains("Стильный интерфейс")').parent().insertAfter($('div[data-name="interface_size"]'));
				}, 20);

				item.on("hover:enter", function () {
					Lampa.Settings.create("style_interface");
					Lampa.Controller.enabled().controller.back = function () {
						Lampa.Settings.create("interface");
					};
				});
			},
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "wide_post", type: "trigger", default: true },
			field: { name: "Широкие постеры", description: "Лампа будет перезагружена" },
			onChange: function () {
				window.location.reload();
			},
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "logo_show", type: "trigger", default: true },
			field: { name: "Показывать логотип вместо названия" },
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "desc", type: "trigger", default: true },
			field: { name: "Показывать описание" },
			onChange: function (value) {
				// При изменении настройки обновляем все видимые информационные панели
				setTimeout(function() {
					$('.new-interface-info__description').each(function() {
						if (!value) {
							$(this).text('').addClass('hidden');
						} else {
							$(this).removeClass('hidden');
						}
					});
				}, 100);
			}
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "show_background", type: "trigger", default: true },
			field: { name: "Отображать постеры на фоне" },
			onChange: function (value) {
				if (!value) {
					$(".full-start__background").removeClass("active");
				}
			},
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "status", type: "trigger", default: true },
			field: { name: "Показывать статус фильма/сериала" },
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "seas", type: "trigger", default: false },
			field: { name: "Показывать количество сезонов" },
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "eps", type: "trigger", default: false },
			field: { name: "Показывать количество эпизодов" },
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "year_ogr", type: "trigger", default: true },
			field: { name: "Показывать возрастное ограничение" },
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "vremya", type: "trigger", default: true },
			field: { name: "Показывать время фильма" },
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "ganr", type: "trigger", default: true },
			field: { name: "Показывать жанр фильма" },
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "rat", type: "trigger", default: true },
			field: { name: "Показывать рейтинг фильма" },
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "colored_ratings", type: "trigger", default: true },
			field: { name: "Цветные рейтинги" },
			onChange: function (value) {
				if (value) {
					updateVoteColors();
				} else {
					$(".card__vote, .full-start__rate, .full-start-new__rate, .info__rate, .card__imdb-rate, .card__kinopoisk-rate").css("color", "").css("border", "");
					$(".full-start__rate").css("border", "");
				}
			},
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "rating_border", type: "trigger", default: false },
			field: { name: "Обводка рейтингов" },
			onChange: function (value) {
				updateVoteColors();
			},
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "async_load", type: "trigger", default: true },
			field: { name: "Включить асинхронную загрузку данных" },
			onChange: function (value) {
				if (value) preloadAllVisibleCards();
			},
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "background_resolution", type: "select", default: "original", values: { w300: "w300", w780: "w780", w1280: "w1280", original: "original" } },
			field: { name: "Разрешение фона", description: "Качество загружаемых фоновых изображений" },
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "hide_captions", type: "trigger", default: true },
			field: { name: "Скрывать названия и год", description: "Лампа будет перезагружена" },
			onChange: function () {
				window.location.reload();
			},
		});

		Lampa.SettingsApi.addParam({
			component: "style_interface",
			param: { name: "int_clear_logo_cache", type: "static" },
			field: { name: "Очистить кеш логотипов", description: "Лампа будет перезагружена" },
			onRender: function (item) {
				item.on("hover:enter", function () {
					Lampa.Select.show({
						title: "Очистить кеш логотипов?",
						items: [{ title: "Да", confirm: true }, { title: "Нет" }],
						onSelect: function (a) {
							if (a.confirm) {
								var keys = [];
								for (var i = 0; i < localStorage.length; i++) {
									var key = localStorage.key(i);
									if (key.indexOf("logo_cache_v2_") !== -1) {
										keys.push(key);
									}
								}
								keys.forEach(function (key) {
									localStorage.removeItem(key);
								});
								window.location.reload();
							} else {
								Lampa.Controller.toggle("settings_component");
							}
						},
						onBack: function () {
							Lampa.Controller.toggle("settings_component");
						},
					});
				});
			},
		});

		var initInterval = setInterval(function () {
			if (typeof Lampa !== "undefined") {
				clearInterval(initInterval);
				if (!Lampa.Storage.get("int_plug", false)) {
					setDefaultSettings();
				}
			}
		}, 200);

		function setDefaultSettings() {
			Lampa.Storage.set("int_plug", "true");
			Lampa.Storage.set("wide_post", "true");
			Lampa.Storage.set("logo_show", "true");
			Lampa.Storage.set("desc", 'true');
			Lampa.Storage.set("show_background", "true");
			Lampa.Storage.set("background_resolution", "original");
			Lampa.Storage.set("status", "true");
			Lampa.Storage.set("seas", "false");
			Lampa.Storage.set("eps", "false");
			Lampa.Storage.set("year_ogr", "true");
			Lampa.Storage.set("vremya", "true");
			Lampa.Storage.set("ganr", "true");
			Lampa.Storage.set("rat", "true");
			Lampa.Storage.set("colored_ratings", "true");
			Lampa.Storage.set("async_load", "true");
			Lampa.Storage.set("hide_captions", "true");
			Lampa.Storage.set("rating_border", "false");
			Lampa.Storage.set("interface_size", "small");
			
			// Default rating settings
			Lampa.Storage.set("show_rating_tmdb", "true");
			Lampa.Storage.set("show_rating_imdb", "true");
			Lampa.Storage.set("show_rating_kp", "true");
			Lampa.Storage.set("show_rating_tomatoes", "false");
			Lampa.Storage.set("show_rating_audience", "false");
			Lampa.Storage.set("show_rating_metacritic", "false");
			Lampa.Storage.set("show_rating_trakt", "false");
			Lampa.Storage.set("show_rating_letterboxd", "false");
			Lampa.Storage.set("show_rating_rogerebert", "false");
		}
	}
})();
