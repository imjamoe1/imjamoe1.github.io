(function () {
    'use strict';

    // ========================================================================
    // КОНФИГУРАЦИЯ И КЭШ
    // ========================================================================
    var MEMORY_CACHE = null;
    var TORRSERVER_CACHE = null;
    var FILES_CACHE = {};

    var ACCOUNT_READY = !!window.appready;
    var ACTIVE_STORAGE_KEY = null;
    var SYNCED_STORAGE_KEY = null;
    var MIGRATION_FLAG_KEY = 'continue_watch_params__migrated_to_profiles';

    var TIMERS = {
        save: null,
        debounce_click: null
    };

    var LISTENERS = {
        player_start: null,
        player_destroy: null,
        initialized: false
    };

    var STATE = {
        building_playlist: false
    };

    var ACTIVE_PLAY_STORAGE_HASH = null;
    var TIME_TRACKER = null;
    var LAST_MOVIE = null;
    var ACTIVE_PLAY_TIMELINE_HASH = null;
    var CURRENT_CARD_MOVIE = null; // Для обновления кнопок

    // ========================================================================
    // ПРОФИЛИ: ключ хранилища + синхронизация ключа
    // ========================================================================
    function getStorageKey() {
        try {
            if (
                ACCOUNT_READY &&
                Lampa.Account &&
                Lampa.Account.Permit &&
                Lampa.Account.Permit.sync &&
                Lampa.Account.Permit.account &&
                Lampa.Account.Permit.account.profile &&
                typeof Lampa.Account.Permit.account.profile.id !== 'undefined'
            ) {
                return 'continue_watch_params_' + Lampa.Account.Permit.account.profile.id;
            }
        } catch (e) {}
        return 'continue_watch_params';
    }

    function getActiveStorageKey() {
        var key = getStorageKey();
        if (ACTIVE_STORAGE_KEY !== key) {
            ACTIVE_STORAGE_KEY = key;
            MEMORY_CACHE = null;
        }
        return key;
    }

    function ensureStorageSync() {
        var key = getActiveStorageKey();
        if (SYNCED_STORAGE_KEY !== key) {
            try {
                Lampa.Storage.sync(key, 'object_object');
            } catch (e) {}
            SYNCED_STORAGE_KEY = key;
        }
    }

    // ========================================================================
    // 1. ХРАНИЛИЩЕ
    // ========================================================================

    ensureStorageSync();

    Lampa.Storage.listener.follow('change', function (e) {
        if (e.name && typeof e.name === 'string' && e.name.indexOf('continue_watch_params') === 0) {
            MEMORY_CACHE = null;
            
            // ОБНОВЛЯЕМ КНОПКИ, ЕСЛИ КАРТОЧКА ОТКРЫТА
            if (CURRENT_CARD_MOVIE) {
                updateContinueButtons(CURRENT_CARD_MOVIE);
            }
        }

        if (e.name === 'account') {
            MEMORY_CACHE = null;
            ensureStorageSync();
            migrateOldData();
        }

        if (e.name === 'torrserver_url' || e.name === 'torrserver_url_two' || e.name === 'torrserver_use_link') {
            TORRSERVER_CACHE = null;
        }
    });

    function getParams() {
        ensureStorageSync();
        if (!MEMORY_CACHE) MEMORY_CACHE = Lampa.Storage.get(getActiveStorageKey(), {});
        return MEMORY_CACHE;
    }

    function setParams(data, force) {
        ensureStorageSync();
        MEMORY_CACHE = data;
        clearTimeout(TIMERS.save);

        var key = getActiveStorageKey();

        if (force) {
            Lampa.Storage.set(key, data);
        } else {
            TIMERS.save = setTimeout(function () {
                Lampa.Storage.set(key, data);
            }, 1000);
        }
    }

    function startOwnTimeTracker() {
        if (TIME_TRACKER) clearInterval(TIME_TRACKER);

        TIME_TRACKER = setInterval(function () {
            if (!ACTIVE_PLAY_STORAGE_HASH) return;

            try {
                var video = $('video').get(0);
                if (!video || !video.currentTime || !video.duration) return;

                var time = Math.floor(video.currentTime);
                var duration = Math.floor(video.duration);
                if (time < 1) return;

                updateContinueWatchParams(ACTIVE_PLAY_STORAGE_HASH, {
                    time: time,
                    duration: duration,
                    percent: Math.round(time / duration * 100)
                }, true);
            } catch (e) {}
        }, 1000);
    }

    function updateContinueWatchParams(hash, data, force) {
        var params = getParams();
        if (!params[hash]) params[hash] = {};

        var changed = false;
        for (var key in data) {
            if (params[hash][key] !== data[key]) {
                params[hash][key] = data[key];
                changed = true;
            }
        }

        if (changed || !params[hash].timestamp) {
            params[hash].timestamp = Date.now();
            var isCritical = (data.percent && data.percent > 90);
            setParams(params, force || isCritical);
        }
    }

    function getTorrServerUrl() {
        if (!TORRSERVER_CACHE) {
            var url = Lampa.Storage.get('torrserver_url');
            var url_two = Lampa.Storage.get('torrserver_url_two');
            var use_two = Lampa.Storage.field('torrserver_use_link') == 'two';
            var final_url = use_two ? (url_two || url) : (url || url_two);
            if (final_url) {
                if (!final_url.match(/^https?:\/\//)) final_url = 'http://' + final_url;
                final_url = final_url.replace(/\/$/, '');
            }
            TORRSERVER_CACHE = final_url;
        }
        return TORRSERVER_CACHE;
    }

    // ========================================================================
    // 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ========================================================================

    function formatTime(seconds) {
        if (!seconds) return '';
        var h = Math.floor(seconds / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor(seconds % 60);
        return h > 0 ? h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s : m + ':' + (s < 10 ? '0' : '') + s;
    }

    function cleanupOldParams() {
        setTimeout(function () {
            try {
                var params = getParams();
                var now = Date.now();
                var changed = false;
                var max_age = 60 * 24 * 60 * 60 * 1000;

                Object.keys(params).forEach(function (hash) {
                    if (params[hash].timestamp && now - params[hash].timestamp > max_age) {
                        delete params[hash];
                        changed = true;
                    }
                });

                if (changed) setParams(params);
            } catch (e) { console.error('CleanUp Error', e); }
        }, 10000);
    }

    function isTypeMatch(params, type) {
        if (!params) return false;
        if (!type) return true;
        if (type === 'online') return !!params.is_online;
        if (type === 'torrent') return !params.is_online;
        return true;
    }

    function getMovieTitles(movie) {
        var titles = [];
        ['original_name', 'original_title', 'name', 'title'].forEach(function (key) {
            if (movie && movie[key] && titles.indexOf(movie[key]) === -1) titles.push(movie[key]);
        });
        return titles;
    }

    function sameMovie(params, movie) {
        if (!params || !movie) return false;

        if (params.movie_id && movie.id && params.movie_id == movie.id) return true;
        if (params.tmdb_id && movie.tmdb_id && params.tmdb_id == movie.tmdb_id) return true;
        if (params.imdb_id && movie.imdb_id && params.imdb_id == movie.imdb_id) return true;
        if (params.kinopoisk_id && movie.kinopoisk_id && params.kinopoisk_id == movie.kinopoisk_id) return true;

        var titles = getMovieTitles(movie);
        var savedTitles = [
            params.title,
            params.original_title,
            params.original_name,
            params.name
        ].filter(Boolean);

        for (var i = 0; i < savedTitles.length; i++) {
            for (var j = 0; j < titles.length; j++) {
                var a = (savedTitles[i] + '').toLowerCase().trim();
                var b = (titles[j] + '').toLowerCase().trim();

                if (a === b) return true;
                if (a.length > 3 && b.length > 3 && (a.indexOf(b) !== -1 || b.indexOf(a) !== -1)) return true;
            }
        }

        return false;
    }

    function getStreamParams(movie, type) {
        if (!movie) return null;
        var title = movie.original_name || movie.original_title || movie.name || movie.title;
        if (!title) return null;

        var params = getParams();

        if (movie.number_of_seasons) {
            var latestEpisode = null;
            var latestTimestamp = 0;

            Object.keys(params).forEach(function (hash) {
                var p = params[hash];

                if (isTypeMatch(p, type) && sameMovie(p, movie) && p.season && p.episode) {
                    if (p.timestamp && p.timestamp > latestTimestamp) {
                        latestTimestamp = p.timestamp;
                        latestEpisode = p;
                    }
                }
            });

            return latestEpisode;
        } else {
            var directHash = Lampa.Utils.hash(title);

            if (params[directHash] && isTypeMatch(params[directHash], type)) {
                return params[directHash];
            }

            var latestMovie = null;
            var latestTimestamp = 0;

            Object.keys(params).forEach(function (hash) {
                var p = params[hash];

                if (isTypeMatch(p, type) && sameMovie(p, movie) && !p.season && !p.episode) {
                    if (p.timestamp && p.timestamp > latestTimestamp) {
                        latestTimestamp = p.timestamp;
                        latestMovie = p;
                    }
                }
            });

            return latestMovie;
        }
    }

    function buildStreamUrl(params) {
        if (!params || !params.file_name || !params.torrent_link) return null;
        var server_url = getTorrServerUrl();
        if (!server_url) {
            Lampa.Noty.show('TorrServer не настроен');
            return null;
        }
        var url = server_url + '/stream/' + encodeURIComponent(params.file_name);
        var query = [];
        if (params.torrent_link) query.push('link=' + params.torrent_link);
        query.push('index=' + (params.file_index || 0));
        query.push('play');
        return url + '?' + query.join('&');
    }

    function buildPlayableUrl(params) {
        if (params && params.is_online && params.online_url) return params.online_url;
        return buildStreamUrl(params);
    }

    function generateHash(movie, season, episode) {
        var title = movie.original_name || movie.original_title || movie.name || movie.title;
        if (movie.number_of_seasons && season && episode) {
            var separator = season > 10 ? ':' : '';
            return Lampa.Utils.hash([season, separator, episode, title].join(''));
        }
        return Lampa.Utils.hash(title);
    }

    // ========================================================================
    // 3. ОТСЛЕЖИВАНИЕ И TIMELINE
    // ========================================================================
    function setupTimelineSaving() {
        Lampa.Timeline.listener.follow('update', function (e) {
            var hash = e.data.hash;
            var road = e.data.road;

            if (hash && road && typeof road.percent !== 'undefined') {
                var params = getParams();

                if (
                    ACTIVE_PLAY_STORAGE_HASH &&
                    ACTIVE_PLAY_TIMELINE_HASH === hash &&
                    params[ACTIVE_PLAY_STORAGE_HASH]
                ) {
                    updateContinueWatchParams(ACTIVE_PLAY_STORAGE_HASH, {
                        percent: road.percent,
                        time: road.time,
                        duration: road.duration
                    });
                } else if (params[hash]) {
                    updateContinueWatchParams(hash, {
                        percent: road.percent,
                        time: road.time,
                        duration: road.duration
                    });
                }
            }
        });
    }

    function wrapTimelineHandler(timeline, params) {
        if (!timeline) return timeline;
        if (timeline._wrapped_continue) return timeline;

        var originalHandler = timeline.handler;
        var lastUpdate = 0;

        timeline.handler = function (percent, time, duration) {
            if (originalHandler) originalHandler(percent, time, duration);

            var now = Date.now();
            if (now - lastUpdate > 1000) {
                lastUpdate = now;
                updateContinueWatchParams(params.storage_hash || timeline.hash, {
                    file_name: params.file_name,
                    torrent_link: params.torrent_link,
                    file_index: params.file_index,
                    title: params.title,
                    season: params.season,
                    episode: params.episode,
                    episode_title: params.episode_title,
                    percent: percent,
                    time: time,
                    duration: duration
                });
            }
        };
        timeline._wrapped_continue = true;
        return timeline;
    }

    // ========================================================================
    // 4. ПЛЕЙЛИСТ И ЗАГРУЗКА
    // ========================================================================

    function buildPlaylist(movie, currentParams, currentUrl, quietMode, callback) {
        if (STATE.building_playlist && !quietMode) {     
            callback([]);
            return;
        }

        if (!quietMode) STATE.building_playlist = true;

        var title = movie.original_name || movie.original_title || movie.name || movie.title;
        var allParams = getParams();
        var playlist = [];
        var ABORT_CONTROLLER = false;

        var finalize = function (resultList) {
            ABORT_CONTROLLER = true;
            if (!quietMode) {
                Lampa.Loading.stop();
                STATE.building_playlist = false;
            }
            callback(resultList);
        };

        for (var hash in allParams) {
            var p = allParams[hash];
            if (!p.is_online && p.title === title && p.season && p.episode) {
                var episodeHash = generateHash(movie, p.season, p.episode);
                var timeline = Lampa.Timeline.view(episodeHash);
                if (timeline) wrapTimelineHandler(timeline, p);

                var isCurrent = (p.season === currentParams.season && p.episode === currentParams.episode);
                var item = {
                    title: p.episode_title || ('S' + p.season + ' E' + p.episode),
                    season: p.season,
                    episode: p.episode,
                    timeline: timeline,
                    torrent_hash: p.torrent_hash || p.torrent_link,
                    card: movie,
                    url: buildStreamUrl(p),
                    position: isCurrent ? (timeline ? (timeline.time || -1) : -1) : -1
                };
                if (isCurrent) item.url = currentUrl;
                playlist.push(item);
            }
        }

        if (!currentParams.torrent_link) { finalize(playlist); return; }

        var processFiles = function (files) {
            if (!FILES_CACHE[currentParams.torrent_link]) {
                FILES_CACHE[currentParams.torrent_link] = files;
                setTimeout(function () { delete FILES_CACHE[currentParams.torrent_link]; }, 300000);
            }

            var uniqueEpisodes = new Set();
            playlist.forEach(function (p) { uniqueEpisodes.add(p.season + '_' + p.episode); });

            files.forEach(function (file) {
                if (ABORT_CONTROLLER) return;
                try {
                    var episodeInfo = Lampa.Torserver.parse({
                        movie: movie, files: [file], filename: file.path.split('/').pop(), path: file.path, is_file: true
                    });

                    if (!movie.number_of_seasons || (episodeInfo.season === currentParams.season)) {
                        var epKey = episodeInfo.season + '_' + episodeInfo.episode;

                        if (!uniqueEpisodes.has(epKey)) {
                            var episodeHash = generateHash(movie, episodeInfo.season, episodeInfo.episode);
                            var timeline = Lampa.Timeline.view(episodeHash);
                            if (!timeline) timeline = { hash: episodeHash, percent: 0, time: 0, duration: 0 };

                            if (!allParams[episodeHash]) {
                                updateContinueWatchParams(episodeHash, {
                                    file_name: file.path,
                                    torrent_link: currentParams.torrent_link,
                                    file_index: file.id || 0,
                                    title: title,
                                    season: episodeInfo.season,
                                    episode: episodeInfo.episode,
                                    percent: 0, time: 0, duration: 0
                                });
                            }

                            var isCurrent = (episodeInfo.season === currentParams.season && episodeInfo.episode === currentParams.episode);
                            var item = {
                                title: movie.number_of_seasons ? ('S' + episodeInfo.season + ' E' + episodeInfo.episode) : (movie.title || title),
                                season: episodeInfo.season,
                                episode: episodeInfo.episode,
                                timeline: timeline,
                                torrent_hash: currentParams.torrent_link,
                                card: movie,
                                url: buildStreamUrl({
                                    file_name: file.path,
                                    torrent_link: currentParams.torrent_link,
                                    file_index: file.id || 0
                                }),
                                position: isCurrent ? (timeline ? (timeline.time || -1) : -1) : -1
                            };
                            if (isCurrent || (file.id === currentParams.file_index && !movie.number_of_seasons)) item.url = currentUrl;
                            playlist.push(item);
                            uniqueEpisodes.add(epKey);
                        }
                    }
                } catch (e) { }
            });

            if (movie.number_of_seasons) playlist.sort(function (a, b) { return a.episode - b.episode; });
            finalize(playlist);
        };

        if (FILES_CACHE[currentParams.torrent_link]) { processFiles(FILES_CACHE[currentParams.torrent_link]); return; }

        if (!quietMode) Lampa.Loading.start(function () { ABORT_CONTROLLER = true; finalize([]); }, 'Подготовка...');

        Lampa.Torserver.hash({
            link: currentParams.torrent_link,
            title: title,
            poster: movie.poster_path,
            data: { lampa: true, movie: movie }
        }, function (torrent) {
            if (ABORT_CONTROLLER) return;
            var retryCount = 0;
            var maxRetries = 5;

            var fetchFiles = function () {
                if (ABORT_CONTROLLER) return;
                Lampa.Torserver.files(torrent.hash, function (json) {
                    if (ABORT_CONTROLLER) return;
                    if (json && json.file_stats && json.file_stats.length > 0) {
                        processFiles(json.file_stats);
                    } else if (retryCount < maxRetries) {
                        retryCount++;
                        if (!quietMode) Lampa.Loading.setText('Ожидание файлов (' + retryCount + '/' + maxRetries + ')...');
                        setTimeout(fetchFiles, retryCount * 1000);
                    } else { finalize(playlist); }
                }, function () {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(fetchFiles, retryCount * 1000);
                    } else { if (!ABORT_CONTROLLER) finalize(playlist); }
                });
            };
            fetchFiles();
        }, function () { if (!ABORT_CONTROLLER) finalize(playlist); });
    }

    // ========================================================================
    // 5. ЛОГИКА ПЛЕЕРА И ХУКИ
    // ========================================================================

    function launchPlayer(movie, params) {
        var url = buildPlayableUrl(params);
        if (!url) return;

        var currentHash = params.timeline_hash || generateHash(movie, params.season, params.episode);
        var timeline = Lampa.Timeline.view(currentHash);

        if (!timeline || (!timeline.time && !timeline.percent)) {
            timeline = timeline || { hash: currentHash };
            timeline.time = params.time || 0;
            timeline.percent = params.percent || 0;
            timeline.duration = params.duration || 0;
        } else if (params.time > timeline.time) {
            timeline.time = params.time;
            timeline.percent = params.percent;
        }

        wrapTimelineHandler(timeline, params);
        updateContinueWatchParams(params.storage_hash || currentHash, {
            percent: timeline.percent,
            time: timeline.time,
            duration: timeline.duration
        });

        var player_type = params.is_online ? Lampa.Storage.field('player') : Lampa.Storage.field('player_torrent');
        var force_inner = !params.is_online && (player_type === 'inner');
        var isExternalPlayer = !force_inner && (player_type !== 'lampa');

        var playerData = {
            url: url, title: params.episode_title || params.title || movie.title,
            card: movie, torrent_hash: params.torrent_link, timeline: timeline,
            season: params.season, episode: params.episode, position: timeline.time || -1
        };

        if (params.is_online) {
            playerData.isonline = true;
            playerData.quality = params.quality;
            playerData.headers = params.headers;
            playerData.subtitles = params.subtitles;
            playerData.segments = params.segments;
            playerData.thumbnail = params.thumbnail;
            playerData.voice_name = params.voice_name;
            delete playerData.torrent_hash;
        }

        if (force_inner) {
            delete playerData.torrent_hash;
            var original_platform_is = Lampa.Platform.is;
            Lampa.Platform.is = function (what) { return what === 'android' ? false : original_platform_is(what); };
            setTimeout(function () { Lampa.Platform.is = original_platform_is; }, 500);
            Lampa.Storage.set('internal_torrclient', true);
        }

        if (params.is_online) {
            if (timeline.time > 0) Lampa.Noty.show('Восстанавливаем: ' + formatTime(timeline.time));
            Lampa.Player.play(playerData);
            setupPlayerListeners();
            Lampa.Player.callback(function () { Lampa.Controller.toggle('content'); });
        } else if (isExternalPlayer) {
            buildPlaylist(movie, params, url, false, function (playlist) {
                if (playlist.length === 0 && !params.torrent_link) return;
                playerData.playlist = playlist.length ? playlist : null;
                Lampa.Player.play(playerData);
                Lampa.Player.callback(function () { Lampa.Controller.toggle('content'); });
            });
        } else {
            var tempPlaylist = [{ url: url, title: params.episode_title || ('S' + params.season + ' E' + params.episode), timeline: timeline, season: params.season, episode: params.episode, card: movie }];
            if (movie.number_of_seasons) tempPlaylist.push({ title: 'Загрузка списка...', url: '', timeline: {} });
            playerData.playlist = tempPlaylist;

            if (timeline.time > 0) Lampa.Noty.show('Восстанавливаем: ' + formatTime(timeline.time));
            Lampa.Player.play(playerData);
            setupPlayerListeners();
            Lampa.Player.callback(function () { Lampa.Controller.toggle('content'); });

            if (movie.number_of_seasons && params.season && params.episode) {
                buildPlaylist(movie, params, url, true, function (playlist) {
                    if (playlist.length > 1) { Lampa.Player.playlist(playlist); Lampa.Noty.show('Плейлист загружен (' + playlist.length + ' эп.)'); }
                });
            }
        }
    }

    function setupPlayerListeners() {
        if (LISTENERS.initialized) cleanupPlayerListeners();
        LISTENERS.player_start = function (data) {
            if (data.card) {
                var hash = generateHash(data.card, data.season, data.episode);
                var matchFile = data.url.match(/\/stream\/([^?]+)/);
                if (matchFile) {
                    updateContinueWatchParams(hash, {
                        file_name: decodeURIComponent(matchFile[1]),
                        title: data.card.original_name || data.card.original_title || data.card.title,
                        season: data.season, episode: data.episode
                    });
                }
            }
        };
        LISTENERS.player_destroy = function () { 
            cleanupPlayerListeners(); 
        };
        Lampa.Player.listener.follow('start', LISTENERS.player_start);
        Lampa.Player.listener.follow('destroy', LISTENERS.player_destroy);
        LISTENERS.initialized = true;
    }

    function cleanupPlayerListeners() {
        if (LISTENERS.player_start) { Lampa.Player.listener.remove('start', LISTENERS.player_start); LISTENERS.player_start = null; }
        if (LISTENERS.player_destroy) { Lampa.Player.listener.remove('destroy', LISTENERS.player_destroy); LISTENERS.player_destroy = null; }
        LISTENERS.initialized = false;
    }

    function patchPlayer() {
        var originalPlay = Lampa.Player.play;

        Lampa.Player.play = function (params) {
            try {
                if (params && typeof params.url === 'string') {
                    var active = Lampa.Activity.active && Lampa.Activity.active();
                    var movie = params.card ||
                        (active && active.movie) ||
                        LAST_MOVIE;

                    if (movie) {
                        var url = params.url;
                        var isTorrent = !!params.torrent_hash || url.indexOf('/stream/') !== -1;
                        var isOnline = !!params.isonline || !isTorrent;

                        var hash = isOnline && params.timeline && params.timeline.hash
                            ? params.timeline.hash
                            : generateHash(movie, params.season, params.episode);

                        var timelineHash = hash;
                        var storageHash = hash + (isTorrent ? '_torrent' : '_online');

                        ACTIVE_PLAY_STORAGE_HASH = storageHash;
                        startOwnTimeTracker();

                        ACTIVE_PLAY_TIMELINE_HASH = timelineHash;
                        ACTIVE_PLAY_STORAGE_HASH = storageHash;

                        var timeline = hash ? (Lampa.Timeline.view(hash) || params.timeline) : params.timeline;
                        var title = movie.original_name || movie.original_title || movie.name || movie.title;

                        if (hash && isTorrent) {
                            var matchFile = url.match(/\/stream\/([^?]+)/);
                            var matchLink = url.match(/[?&]link=([^&]+)/);
                            var matchIndex = url.match(/[?&]index=(\d+)/);

                            if (matchFile) {
                                updateContinueWatchParams(storageHash, {
                                    is_online: false,
                                    timeline_hash: timelineHash,
                                    storage_hash: storageHash,
                                    file_name: decodeURIComponent(matchFile[1]),
                                    torrent_link: matchLink ? decodeURIComponent(matchLink[1]) : (params.torrent_hash || ''),
                                    file_index: matchIndex ? parseInt(matchIndex[1]) : 0,
                                    title: title,
                                    season: params.season,
                                    episode: params.episode,
                                    episode_title: params.title || params.episode_title,
                                    percent: getParams()[storageHash] ? getParams()[storageHash].percent || 0 : 0,
                                    time: getParams()[storageHash] ? getParams()[storageHash].time || 0 : 0,
                                    duration: getParams()[storageHash] ? getParams()[storageHash].duration || 0 : 0,
                                    movie_id: movie.id,
                                    tmdb_id: movie.tmdb_id,
                                    imdb_id: movie.imdb_id,
                                    kinopoisk_id: movie.kinopoisk_id,
                                    original_title: movie.original_title,
                                    original_name: movie.original_name,
                                    name: movie.name
                                }, true);
                            }
                        }

                        if (hash && isOnline) {
                            updateContinueWatchParams(storageHash, {
                                is_online: true,
                                online_url: url,
                                timeline_hash: timelineHash,
                                storage_hash: storageHash,
                                title: title,
                                season: params.season,
                                episode: params.episode,
                                episode_title: params.title || params.episode_title,
                                voice_name: params.voice_name,
                                quality: params.quality,
                                headers: params.headers,
                                subtitles: params.subtitles,
                                segments: params.segments,
                                thumbnail: params.thumbnail,
                                percent: getParams()[storageHash] ? getParams()[storageHash].percent || 0 : 0,
                                time: getParams()[storageHash] ? getParams()[storageHash].time || 0 : 0,
                                duration: getParams()[storageHash] ? getParams()[storageHash].duration || 0 : 0,
                                movie_id: movie.id,
                                tmdb_id: movie.tmdb_id,
                                imdb_id: movie.imdb_id,
                                kinopoisk_id: movie.kinopoisk_id,
                                original_title: movie.original_title,
                                original_name: movie.original_name,
                                name: movie.name
                            }, true);
                        }

                        console.log('[ContinueWatch] saved launch', {
                            type: isTorrent ? 'torrent' : 'online',
                            hash: hash,
                            movie: title,
                            url: url
                        });
                    } else {
                        console.log('[ContinueWatch] no movie for player params', params);
                    }
                }
            } catch (e) {
                console.log('[ContinueWatch] patchPlayer save error', e);
            }

            return originalPlay.call(this, params);
        };
    }

    // ========================================================================
    // 6. UI: КНОПКИ (С ОБНОВЛЕНИЕМ)
    // ========================================================================

    function updateContinueButtons(movie) {
        // Обновляем кнопки на текущей карточке
        var active = Lampa.Activity.active();
        if (!active || !active.render) return;
        
        var render = active.render();
        if (!render) return;
        
        render.find('.continue--online, .continue--torrent').remove();
        
        var onlineParams = getStreamParams(movie, 'online');
        var torrentParams = getStreamParams(movie, 'torrent');
        
        if (!onlineParams && !torrentParams) return;
        
        var buttonsContainer = render.find('.full-start-new__buttons, .full-start__buttons').first();
        if (!buttonsContainer.length) return;
        
        if (onlineParams) {
            buttonsContainer.append(createContinueButton(movie, onlineParams, 'online'));
        }
        
        if (torrentParams) {
            buttonsContainer.append(createContinueButton(movie, torrentParams, 'torrent'));
        }
    }

    function handleContinueClick(movieData, buttonElement, forcedParams) {
        if (TIMERS.debounce_click) return;

        var params = forcedParams || getStreamParams(movieData);
        if (!params) { Lampa.Noty.show('Нет истории'); return; }

        if (buttonElement) $(buttonElement).css('opacity', 0.5);
        TIMERS.debounce_click = setTimeout(function () {
            TIMERS.debounce_click = null;
            if (buttonElement) $(buttonElement).css('opacity', 1);
        }, 1000);

        launchPlayer(movieData, params);
    }

    function createContinueButton(movie, params, type) {
        var percent = 0;
        var timeStr = "";
        var hash = params.timeline_hash || generateHash(movie, params.season, params.episode);
        
        // Получаем свежие данные из таймлайна
        var view = Lampa.Timeline.view(hash);
        if (view && view.percent > 0) {
            percent = view.percent;
            timeStr = formatTime(view.time);
        } else if (params.time) {
            percent = params.percent || 0;
            timeStr = formatTime(params.time);
        }

        var isOnline = type === 'online';
        var color = '#ffffff';
        var labelText = isOnline ? 'Online' : 'Torrent';

        if (params.season && params.episode) labelText += ' S' + params.season + ' E' + params.episode;
        if (timeStr) labelText += ' <span style="opacity:0.7;font-size:0.9em">(' + timeStr + ')</span>';

        var dashArray = (percent * 65.97 / 100).toFixed(2);

        var svgIcon = isOnline
            ? `
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" style="margin-right: 0.5em">
                    <path d="M8 5v14l11-7L8 5z" fill="#2196f3"/>
                    <circle cx="12" cy="12" r="10.5" stroke="currentColor" stroke-width="1.5" fill="none"
                        stroke-dasharray="${dashArray} 65.97" transform="rotate(-90 12 12)" style="opacity: 0.55"/>
                </svg>`
            : `
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" style="margin-right: 0.5em">
                    <path d="M8 5v14l11-7L8 5z" fill="#4caf50"/>
                    <circle cx="12" cy="12" r="10.5" stroke="currentColor" stroke-width="1.5" fill="none"
                        stroke-dasharray="${dashArray} 65.97" transform="rotate(-90 12 12)" style="opacity: 0.55"/>
                </svg>`;

        var uniqueClass = isOnline ? 'continue--online view--continue-online' : 'continue--torrent view--continue-torrent';
        var uniqueId = isOnline ? 'continue-watch-online' : 'continue-watch-torrent';
        var stableId = isOnline ? 'continue_watch_online' : 'continue_watch_torrent';

        var html = `
            <div id="${uniqueId}" data-stable-id="${stableId}" class="full-start__button selector button--continue-watch ${uniqueClass} button--continue-watch-${type}" data-type="${type}" style="padding-left:1em; color:${color}; display:flex; align-items:center;">
                ${svgIcon}
                <div>${labelText}</div>
            </div>
        `;

        var btn = $(html);
        btn.on('hover:enter', function () {
            handleContinueClick(movie, this, params);
        });

        return btn;
    }

    function setupContinueButton() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                LAST_MOVIE = e.data.movie;
                CURRENT_CARD_MOVIE = e.data.movie; // Сохраняем текущий фильм

                // СБРАСЫВАЕМ КЭШ ПРИ ОТКРЫТИИ КАРТОЧКИ
                MEMORY_CACHE = null;

                requestAnimationFrame(function () {
                    var render = e.object.activity.render();
                    render.find('.continue--online, .continue--torrent').remove();

                    var onlineParams = getStreamParams(e.data.movie, 'online');
                    var torrentParams = getStreamParams(e.data.movie, 'torrent');

                    if (!onlineParams && !torrentParams) return;

                    if (torrentParams && torrentParams.torrent_link && !FILES_CACHE[torrentParams.torrent_link]) {
                        Lampa.Torserver.files(torrentParams.torrent_link, function (json) {
                            if (json && json.file_stats) FILES_CACHE[torrentParams.torrent_link] = json.file_stats;
                        });
                    }

                    var buttonsContainer = render.find('.full-start-new__buttons, .full-start__buttons').first();
                    if (!buttonsContainer.length) return;

                    if (onlineParams) {
                        buttonsContainer.append(createContinueButton(e.data.movie, onlineParams, 'online'));
                    }

                    if (torrentParams) {
                        buttonsContainer.append(createContinueButton(e.data.movie, torrentParams, 'torrent'));
                    }
                });
            }
        });
    }

    // ========================================================================
    // ПРОФИЛИ: слушатель смены профиля + миграция
    // ========================================================================

    function setupProfileListener() {
        Lampa.Listener.follow('profile_select', function () {
            MEMORY_CACHE = null;
            TORRSERVER_CACHE = null;
            FILES_CACHE = {};
            ensureStorageSync();
            migrateOldData();
            console.log('[ContinueWatch] Profile changed, caches cleared');
        });
    }

    function migrateOldData() {
        try {
            if (!(ACCOUNT_READY && Lampa.Account && Lampa.Account.Permit && Lampa.Account.Permit.sync)) return;

            if (Lampa.Storage.get(MIGRATION_FLAG_KEY, false)) return;

            var oldKey = 'continue_watch_params';
            var oldData = Lampa.Storage.get(oldKey, {});
            var newKey = getActiveStorageKey();
            var newData = Lampa.Storage.get(newKey, {});

            if (Object.keys(oldData).length > 0 && Object.keys(newData).length === 0) {
                Lampa.Storage.set(newKey, oldData);
                Lampa.Storage.set(MIGRATION_FLAG_KEY, true);
                console.log('[ContinueWatch] Migrated old data to profile key:', newKey);
            } else {
                if (Object.keys(oldData).length === 0) Lampa.Storage.set(MIGRATION_FLAG_KEY, true);
            }
        } catch (e) {}
    }

    // ========================================================================
    // INIT
    // ========================================================================

    function add() {
        ensureStorageSync();
        patchPlayer();

        try {
            Lampa.Player.listener.follow('ready', function (data) {
                savePlayerLaunch(data);
            });

            Lampa.Player.listener.follow('external', function (data) {
                savePlayerLaunch(data);
            });
        } catch (e) {}

        cleanupOldParams();
        setupContinueButton();
        setupTimelineSaving();
        setupProfileListener();
        migrateOldData();
        
        // ========================================================================
        // ИСПРАВЛЕНИЕ: Принудительное сохранение при выходе из плеера
        // ========================================================================
        Lampa.Player.listener.follow('destroy', function () {
            if (TIME_TRACKER) {
                clearInterval(TIME_TRACKER);
                TIME_TRACKER = null;
            }
            
            // Принудительно сохраняем последнюю позицию
            if (ACTIVE_PLAY_STORAGE_HASH) {
                var params = getParams();
                if (params[ACTIVE_PLAY_STORAGE_HASH]) {
                    try {
                        var video = $('video').get(0);
                        if (video && video.currentTime && video.duration) {
                            params[ACTIVE_PLAY_STORAGE_HASH].time = Math.floor(video.currentTime);
                            params[ACTIVE_PLAY_STORAGE_HASH].percent = Math.round(video.currentTime / video.duration * 100);
                            params[ACTIVE_PLAY_STORAGE_HASH].timestamp = Date.now();
                        }
                    } catch(e) {}
                    setParams(params, true); // force = true
                }
            }
            
            MEMORY_CACHE = null; // Сбрасываем кэш
            ACTIVE_PLAY_STORAGE_HASH = null;
        });

        console.log("[ContinueWatch] v72 Loaded. Fixed time update issue. Profile support enabled.");
    }

    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') {
            ACCOUNT_READY = true;
            ensureStorageSync();
            migrateOldData();
        }
    });

    if (window.appready) add();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') add(); });
})();
