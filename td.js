(function () {
    'use strict';

    var PLUGIN = 'lampa_universal_download';
    var STORAGE_KEY = PLUGIN + '_items';
    var MAX_ITEMS = 100;
    var rememberedSources = {};
    var lastDirectSource = null;
    var browserTasks = {};

    if (!window.Lampa || !window.$) {
        console.warn('[' + PLUGIN + '] Lampa or jQuery is unavailable');
        return;
    }

    function safeJson(value, fallback) {
        try { return JSON.parse(value); } catch (_) { return fallback; }
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeFileName(value) {
        return String(value || 'video')
            .replace(/[\\/:*?"<>|]+/g, '_')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 120) || 'video';
    }

    function isHttpUrl(value) {
        return /^https?:\/\//i.test(String(value || ''));
    }

    function nowId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function getItems() {
        var items = safeJson(localStorage.getItem(STORAGE_KEY) || '[]', []);
        var bridge = androidBridge();
        if (!bridge || typeof bridge.downloadList !== 'function') return items;
        try {
            var nativeItems = safeJson(bridge.downloadList() || '[]', []);
            return items.map(function (item) {
                var nativeItem = nativeItems.filter(function (candidate) {
                    return String(candidate.id) === String(item.nativeId);
                })[0];
                return nativeItem ? Object.assign({}, item, nativeItem, { id: item.id, nativeId: item.nativeId }) : item;
            });
        } catch (_) {
            return items;
        }
    }

    function setItems(items) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS))); } catch (_) {}
    }

    function addItem(source, status, nativeId) {
        var item = {
            id: nowId(),
            title: source.title || 'Видео',
            url: source.url,
            fileName: source.fileName || '',
            poster: source.poster || '',
            status: status || 'started',
            nativeId: nativeId || '',
            createdAt: Date.now()
        };
        var items = getItems();
        items.unshift(item);
        setItems(items);
        return item;
    }

    function deleteItem(id) {
        var task = browserTasks[id];
        if (task && task.controller) task.controller.abort();
        if (task && task.objectUrl) URL.revokeObjectURL(task.objectUrl);
        delete browserTasks[id];
        setItems(getItems().filter(function (item) { return item.id !== id; }));
    }

    function updateItem(id, changes) {
        var items = safeJson(localStorage.getItem(STORAGE_KEY) || '[]', []);
        items = items.map(function (item) {
            return item.id === id ? Object.assign({}, item, changes) : item;
        });
        setItems(items);
    }

    function notify(text) {
        try { Lampa.Noty.show(text); } catch (_) { console.log('[' + PLUGIN + ']', text); }
    }

    function androidBridge() {
        return window.AndroidJS && typeof AndroidJS.downloadStart === 'function' ? AndroidJS : null;
    }

    function tizenAvailable() {
        return window.tizen && tizen.download && typeof tizen.download.start === 'function' &&
            typeof tizen.DownloadRequest === 'function';
    }

    function saveBrowserFile(item, blob) {
        var link = document.createElement('a');
        var objectUrl = URL.createObjectURL(blob);
        browserTasks[item.id] = browserTasks[item.id] || {};
        browserTasks[item.id].objectUrl = objectUrl;
        updateItem(item.id, { status: 'completed', percent: 100, localUrl: objectUrl, sizeBytes: blob.size });
        link.href = objectUrl;
        link.download = safeFileName(item.fileName || item.title);
        link.rel = 'noopener';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(function () { link.remove(); }, 0);
    }

    function browserDownload(source) {
        var item = addItem(source, 'downloading');
        var controller = window.AbortController ? new AbortController() : null;
        browserTasks[item.id] = { controller: controller, source: source };
        var options = { headers: source.headers || {} };
        if (controller) options.signal = controller.signal;

        fetch(source.url, options).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            var total = Number(response.headers.get('content-length')) || 0;
            if (!response.body || !response.body.getReader) return response.blob().then(function (blob) {
                updateItem(item.id, { percent: 100, sizeBytes: blob.size });
                return blob;
            });
            var reader = response.body.getReader();
            var chunks = [];
            var received = 0;
            function read() {
                return reader.read().then(function (part) {
                    if (part.done) return new Blob(chunks, { type: response.headers.get('content-type') || 'video/*' });
                    chunks.push(part.value);
                    received += part.value.byteLength;
                    updateItem(item.id, {
                        percent: total ? Math.min(99, Math.round(received * 100 / total)) : 0,
                        sizeBytes: received
                    });
                    return read();
                });
            }
            return read();
        }).then(function (blob) {
            saveBrowserFile(item, blob);
            notify('Загрузка завершена');
        }).catch(function (error) {
            if (error && error.name === 'AbortError') {
                updateItem(item.id, { status: 'paused' });
                return;
            }
            console.warn('[' + PLUGIN + '] browser download failed', error);
            updateItem(item.id, { status: 'failed', error: String(error.message || error) });
            notify('Ошибка загрузки: ' + (error.message || error));
        });
        return item.id;
    }

    function openInBrowser(source) {
        var opened = window.open(source.url, '_blank', 'noopener');
        if (!opened) window.location.href = source.url;
    }

    function startTizenDownload(source) {
        var request = new tizen.DownloadRequest(
            source.url,
            'downloads',
            safeFileName(source.fileName || source.title)
        );
        tizen.download.start(request, {
            oncompleted: function () { notify('Загрузка завершена'); },
            onfailed: function () { notify('Не удалось скачать файл'); }
        });
    }

    function startDownload(source) {
        if (!source || !isHttpUrl(source.url)) {
            notify('Нужна прямая ссылка на файл по HTTP или HTTPS');
            return;
        }

        var bridge = androidBridge();
        try {
            if (bridge) {
                var id = bridge.downloadStart(JSON.stringify({
                    url: source.url,
                    title: source.title || 'Видео',
                    poster: source.poster || '',
                    headers: source.headers || {}
                }));
                if (!id) throw new Error('Android downloadStart returned no id');
                addItem(source, 'downloading', id);
                notify('Загрузка запущена. Смотри в «Загрузки».');
                return;
            }

            if (tizenAvailable()) {
                startTizenDownload(source);
                addItem(source, 'downloading');
                notify('Загрузка запущена. Смотри в «Загрузки».');
                return;
            }

            browserDownload(source);
            notify('Загрузка запущена. Смотри в «Загрузки».');
        } catch (error) {
            console.warn('[' + PLUGIN + '] download failed', error);
            openInBrowser(source);
            addItem(source, 'opened');
            notify('Открыта прямая ссылка на файл');
        }
    }

    function normalizeSource(source, card) {
        if (typeof source === 'string') source = { url: source };
        source = source || {};
        if (!isHttpUrl(source.url)) return null;
        return {
            url: source.url,
            title: source.title || card.title || card.name || 'Видео',
            fileName: source.fileName || '',
            poster: source.poster || card.img || card.poster || card.poster_path || '',
            headers: source.headers || {}
        };
    }

    function cardKey(card) {
        return String(card.id || card.card_id || card.tmdb_id || card.imdb_id || '');
    }

    function collectSources(value, card, result, depth) {
        if (depth > 3 || !value) return;
        if (typeof value === 'string') {
            var direct = normalizeSource(value, card);
            if (direct) result.push(direct);
            return;
        }
        if (Array.isArray(value)) {
            value.forEach(function (item) { collectSources(item, card, result, depth + 1); });
            return;
        }
        if (typeof value !== 'object') return;

        var direct = normalizeSource({
            url: value.url || value.link || value.file || value.src || value.stream_url || value.video_url,
            title: value.title || value.name || value.label,
            fileName: value.fileName || value.filename,
            poster: value.poster,
            headers: value.headers
        }, card);
        if (direct) result.push(direct);

        ['sources', 'downloads', 'download_urls', 'playlist', 'streams', 'qualities', 'files', 'items', 'data']
            .forEach(function (field) { collectSources(value[field], card, result, depth + 1); });
    }

    function cardSources(card) {
        var result = [];
        collectSources({
            sources: [
                card.downloads, card.download_urls, card.downloadUrl, card.download_url,
                card.sources, card.source, card.playlist, card.streams, card.stream,
                card.video_url, card.stream_url, card.file, card.link, card.url
            ]
        }, card, result, 0);
        var seen = {};
        return result.filter(function (source) {
            if (seen[source.url]) return false;
            seen[source.url] = true;
            return true;
        });
    }

    function resolveSources(card) {
        var sources = cardSources(card);
        if (sources.length) return Promise.resolve(sources);

        var key = cardKey(card);
        if (key && rememberedSources[key]) return Promise.resolve([rememberedSources[key]]);
        if (lastDirectSource) return Promise.resolve([lastDirectSource]);

        // Подключите свой легальный каталог прямых URL до загрузки этого файла:
        // window.LampaDownloadResolver = function (card) {
        //   return Promise.resolve([{ url: 'https://example.org/video.mp4', title: card.title }]);
        // };
        if (typeof window.LampaDownloadResolver !== 'function') return Promise.resolve([]);
        try {
            return Promise.resolve(window.LampaDownloadResolver(card)).then(function (list) {
                if (!Array.isArray(list)) list = [list];
                return list.map(function (source) { return normalizeSource(source, card); }).filter(Boolean);
            });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    function storageValue(key) {
        try { return Lampa.Storage && Lampa.Storage.get ? Lampa.Storage.get(key, '') : ''; } catch (_) { return ''; }
    }

    function httpUrl(value) {
        value = String(value || '').trim();
        if (!value) return '';
        return /^https?:\/\//i.test(value) ? value.replace(/\/+$/, '') : 'http://' + value.replace(/\/+$/, '');
    }

    function torrentConfig() {
        var custom = window.LampaUniversalDownloadConfig || {};
        return {
            torrServerUrl: httpUrl(custom.torrServerUrl || custom.torrserver_url || storageValue('torrserver_url')),
            torrServerLogin: String(custom.torrServerLogin || custom.torrserver_login || storageValue('torrserver_login') || ''),
            torrServerPassword: String(custom.torrServerPassword || custom.torrserver_password || storageValue('torrserver_password') || ''),
            jackettUrl: httpUrl(custom.jackettUrl || custom.jackett_url || storageValue('jackett_url')),
            jackettApiKey: String(custom.jackettApiKey || custom.jackett_key || storageValue('jackett_key') || '')
        };
    }

    function torrentAuth(config) {
        if (!config.torrServerLogin && !config.torrServerPassword) return {};
        return { Authorization: 'Basic ' + btoa(config.torrServerLogin + ':' + config.torrServerPassword) };
    }

    function torrentSearch(card, config) {
        var title = card.title || card.name || '';
        var originalTitle = card.original_title || card.original_name || title;
        var year = String(card.release_date || card.first_air_date || '').slice(0, 4);
        var serial = card.number_of_seasons || card.first_air_date ? '1' : '0';
        var category = serial === '1' ? '5000' : '2000';
        var query = (originalTitle + ' ' + title).trim();
        var url = config.jackettUrl + '/api/v2.0/indexers/all/results?apikey=' +
            encodeURIComponent(config.jackettApiKey) + '&Query=' + encodeURIComponent(query) +
            '&title=' + encodeURIComponent(title) + '&title_original=' + encodeURIComponent(originalTitle) +
            (year ? '&year=' + encodeURIComponent(year) : '') + '&is_serial=' + serial + '&Category[]=' + category;

        return fetch(url, { mode: 'cors', headers: { Accept: 'application/json' } })
            .then(function (response) {
                if (!response.ok) throw new Error('Jackett HTTP ' + response.status);
                return response.json();
            })
            .then(function (payload) {
                return ((payload && payload.Results) || []).map(function (item) {
                    return {
                        title: item.Title || item.title || 'Без названия',
                        magnet: item.MagnetUri || item.Link || item.magnetLink || '',
                        size: item.Size || item.size || 0,
                        seeders: item.Seeders || item.seeders || 0
                    };
                }).filter(function (item) { return item.magnet; })
                    .sort(function (a, b) { return b.seeders - a.seeders; });
            });
    }

    function torrentCall(config, payload) {
        var headers = {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        };
        var auth = torrentAuth(config);
        if (auth.Authorization) headers.Authorization = auth.Authorization;
        return fetch(config.torrServerUrl + '/torrents', {
            method: 'POST', headers: headers, body: JSON.stringify(payload)
        }).then(function (response) {
            if (!response.ok) throw new Error('TorrServer HTTP ' + response.status);
            return response.json();
        });
    }

    function torrentFiles(config, hash) {
        var attempt = 0;
        function read() {
            attempt++;
            return torrentCall(config, { action: 'get', hash: hash }).then(function (payload) {
                var files = payload && (payload.file_stats || payload.files || (payload.torrent && payload.torrent.file_stats)) || [];
                if (files.length || attempt >= 30) {
                    return files.map(function (file, index) {
                        return { path: file.path || file.name || ('file_' + index), id: file.id != null ? file.id : index, size: file.length || file.size || 0 };
                    });
                }
                return new Promise(function (resolve) { setTimeout(resolve, 500); }).then(read);
            });
        }
        return read();
    }

    function bytes(value) {
        if (!value) return '';
        var units = ['B', 'KB', 'MB', 'GB', 'TB'];
        var unit = 0;
        while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
        return value.toFixed(value < 10 && unit ? 1 : 0) + ' ' + units[unit];
    }

    function torrentStreamUrl(config, hash, file) {
        var fileName = encodeURIComponent(String(file.path).split('/').pop().split('\\').pop());
        return config.torrServerUrl + '/stream/' + fileName + '?link=' + encodeURIComponent(hash) + '&index=' + encodeURIComponent(file.id) + '&play';
    }

    function torrentPicker(card) {
        var config = torrentConfig();
        if (!config.jackettUrl || !config.torrServerUrl) {
            notify('Укажите адреса Jackett и TorrServer в настройках Lampa');
            return;
        }
        Lampa.Loading.start(function () {});
        torrentSearch(card, config).then(function (items) {
            Lampa.Loading.stop();
            if (!items.length) { notify('Раздачи не найдены'); return; }
            Lampa.Select.show({
                title: 'Выберите раздачу',
                items: items.slice(0, 40).map(function (item) {
                    return { title: item.title, subtitle: bytes(item.size) + '  S: ' + item.seeders, _torrent: item };
                }),
                onSelect: function (item) { selectTorrentFile(card, config, item._torrent); },
                onBack: function () { Lampa.Controller.toggle('content'); }
            });
        }).catch(function (error) {
            Lampa.Loading.stop();
            console.warn('[' + PLUGIN + '] torrent search failed', error);
            notify('Ошибка Jackett: ' + (error.message || error));
        });
    }

    function selectTorrentFile(card, config, torrent) {
        Lampa.Loading.start(function () {});
        torrentCall(config, { action: 'add', link: torrent.magnet, title: torrent.title, save_to_db: false })
            .then(function (payload) {
                var hash = payload.hash || (payload.torrent && payload.torrent.hash);
                if (!hash) throw new Error('TorrServer не вернул hash');
                return torrentFiles(config, hash).then(function (files) { return { hash: hash, files: files }; });
            }).then(function (result) {
                Lampa.Loading.stop();
                var videos = result.files.filter(function (file) { return /\.(mkv|mp4|avi|webm|m4v|ts|mov|flv)$/i.test(file.path); });
                if (!videos.length) { notify('В раздаче нет видеофайлов'); return; }
                function start(file) {
                    startDownload({
                        url: torrentStreamUrl(config, result.hash, file),
                        title: (card.title || card.name || torrent.title) + (videos.length > 1 ? ' - ' + String(file.path).split('/').pop() : ''),
                        poster: card.img || card.poster_path || '',
                        headers: torrentAuth(config)
                    });
                }
                if (videos.length === 1) { start(videos[0]); return; }
                Lampa.Select.show({
                    title: 'Выберите файл',
                    items: videos.map(function (file) { return { title: String(file.path).split('/').pop(), subtitle: bytes(file.size), _file: file }; }),
                    onSelect: function (item) { start(item._file); },
                    onBack: function () { Lampa.Controller.toggle('content'); }
                });
            }).catch(function (error) {
                Lampa.Loading.stop();
                console.warn('[' + PLUGIN + '] TorrServer failed', error);
                notify('Ошибка TorrServer: ' + (error.message || error));
            });
    }

    function sourcePicker(card) {
        Lampa.Loading.start(function () {});
        resolveSources(card).then(function (sources) {
            Lampa.Loading.stop();
            if (!sources.length) {
                torrentPicker(card);
                return;
            }
            if (sources.length === 1) {
                startDownload(sources[0]);
                return;
            }
            Lampa.Select.show({
                title: 'Выберите файл',
                items: sources.map(function (source) {
                    return { title: source.title, subtitle: source.fileName || '', _source: source };
                }),
                onSelect: function (item) { startDownload(item._source); },
                onBack: function () { Lampa.Controller.toggle('content'); }
            });
        }).catch(function (error) {
            Lampa.Loading.stop();
            console.warn('[' + PLUGIN + '] source resolver failed', error);
            notify('Не удалось получить ссылки для загрузки');
        });
    }

    function injectButton(activity) {
        var render = activity && activity.activity && typeof activity.activity.render === 'function' && activity.activity.render();
        if (!render || !render.find) return;
        var buttons = render.find('.full-start-new__buttons, .full-start__buttons, .full-start__button-container, .buttons--container').first();
        if (!buttons.length || buttons.find('.universal-download').length) return;

        var card = activity.movie || activity.card || {};
        var button = $('<div class="full-start__button selector universal-download" role="button" tabindex="0">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
            '<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg><span>Скачать</span></div>');
        function open() { sourcePicker(card); }
        button.on('hover:enter click', open);
        buttons.append(button);
    }

    function ensureMenu() {
        var menu = $('.menu .menu__list').first();
        if (!menu.length || menu.find('.universal-download-menu').length) return;
        var item = $('<li class="menu__item selector universal-download-menu">' +
            '<div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
            '<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg></div><div class="menu__text">Загрузки</div></li>');
        item.on('hover:enter click', function () {
            Lampa.Activity.push({ url: '', title: 'Загрузки', component: PLUGIN, page: 1 });
        });
        menu.append(item);
    }

    function DownloadsComponent() {
        var self = this;
        var body = $('<div class="content__body" style="padding:1.5em"><div class="universal-download-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(13em,1fr));gap:1.5em 1em"></div></div>');
        var html = $('<div class="scroll"><div class="scroll__body"></div></div>');
        html.find('.scroll__body').append(body);
        var timer = null;

        function statusText(entry) {
            if (entry.status === 'completed') return bytes(entry.sizeBytes) || 'Готово';
            if (entry.status === 'failed') return 'Ошибка';
            if (entry.status === 'paused') return 'Пауза';
            return (entry.percent || 0) + '%';
        }

        function play(entry, inner) {
            var url = entry.localPath ? 'file://' + entry.localPath : (entry.localUrl || entry.url);
            try {
                Lampa.Player.play({ url: url, title: entry.title || '', quality: {}, launch_player: inner ? 'inner' : undefined });
            } catch (_) {
                openInBrowser(entry);
            }
        }

        function nativeId(entry) { return entry.nativeId || entry.id; }

        function pause(entry) {
            var bridge = androidBridge();
            try {
                if (bridge && typeof bridge.downloadCancel === 'function' && entry.nativeId) bridge.downloadCancel(nativeId(entry));
                else if (browserTasks[entry.id] && browserTasks[entry.id].controller) browserTasks[entry.id].controller.abort();
                else updateItem(entry.id, { status: 'paused' });
            } catch (_) {}
        }

        function resume(entry) {
            var bridge = androidBridge();
            try {
                if (bridge && typeof bridge.downloadResume === 'function' && entry.nativeId) {
                    bridge.downloadResume(nativeId(entry));
                    return;
                }
            } catch (_) {}
            deleteItem(entry.id);
            browserDownload(entry);
        }

        function remove(entry) {
            var bridge = androidBridge();
            try {
                if (bridge && typeof bridge.downloadDelete === 'function' && entry.nativeId) bridge.downloadDelete(nativeId(entry));
            } catch (_) {}
            deleteItem(entry.id);
        }

        function actions(entry) {
            var choices = [];
            if (entry.status === 'completed' || entry.status === 'downloading' || entry.status === 'queued' || entry.status === 'paused') {
                choices.push({ title: 'Смотреть', action: 'play' });
                choices.push({ title: 'Смотреть во встроенном плеере', action: 'inner' });
            }
            if (entry.status === 'downloading' || entry.status === 'queued') choices.push({ title: 'Приостановить', action: 'pause' });
            if (entry.status === 'paused') choices.push({ title: 'Продолжить', action: 'resume' });
            if (entry.status === 'failed') choices.push({ title: 'Повторить', action: 'resume' });
            choices.push({ title: 'Открыть ссылку', action: 'open' });
            choices.push({ title: 'Удалить', action: 'delete' });
            Lampa.Select.show({
                title: entry.title,
                items: choices,
                onSelect: function (choice) {
                    if (choice.action === 'play') play(entry, false);
                    if (choice.action === 'inner') play(entry, true);
                    if (choice.action === 'pause') pause(entry);
                    if (choice.action === 'resume') resume(entry);
                    if (choice.action === 'open') openInBrowser(entry);
                    if (choice.action === 'delete') remove(entry);
                    setTimeout(render, 150);
                },
                onBack: function () { Lampa.Controller.toggle('content'); }
            });
        }

        function render() {
            var items = getItems();
            var list = body.find('.universal-download-list').empty();
            if (!items.length) {
                list.append('<div style="opacity:.7">Список загрузок пуст.</div>');
                return;
            }
            items.forEach(function (entry) {
                var progress = entry.status === 'completed' ? 100 : Math.max(0, Math.min(100, Number(entry.percent) || 0));
                var color = entry.status === 'failed' ? '#e05050' : entry.status === 'completed' ? '#48a868' : '#e50914';
                var poster = entry.poster || './img/img_load.svg';
                var card = $('<div class="card selector universal-download-card" style="width:14em">' +
                    '<div class="card__view" style="position:relative;padding-bottom:150%">' +
                    '<img class="card__img" src="' + escapeHtml(poster) + '" style="object-fit:cover">' +
                    '<div style="position:absolute;top:.4em;right:.4em;background:rgba(0,0,0,.75);padding:.2em .5em;z-index:2">' + escapeHtml(statusText(entry)) + '</div>' +
                    '<div style="position:absolute;left:0;right:0;bottom:0;height:5px;background:rgba(0,0,0,.5);z-index:2"><div style="height:100%;width:' + progress + '%;background:' + color + '"></div></div>' +
                    '</div><div class="card__title" style="margin-top:.4em;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(entry.title || 'Без названия') + '</div></div>');
                card.on('hover:enter click', function () { actions(entry); });
                list.append(card);
            });
        }

        this.create = function () { return html; };
        this.start = function () {
            render();
            Lampa.Controller.add('content', {
                toggle: function () { Lampa.Controller.collectionSet(html); Lampa.Controller.collectionFocus(false, html); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
            timer = setInterval(function () {
                if (getItems().some(function (item) { return item.status === 'downloading' || item.status === 'queued'; })) render();
            }, 1000);
        };
        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };
        this.destroy = function () { if (timer) clearInterval(timer); self = null; html.remove(); };
    }

    try { Lampa.Component.add(PLUGIN, DownloadsComponent); } catch (error) {
        console.warn('[' + PLUGIN + '] component registration failed', error);
    }

    Lampa.Listener.follow('full', function (event) {
        if (event && (event.type === 'complite' || event.type === 'build')) injectButton(event.object || event);
    });
    Lampa.Listener.follow('app', function (event) {
        if (event && event.type === 'ready') setTimeout(ensureMenu, 300);
    });

    // Большинство Lampa-плагинов передают прямой URL только в момент запуска
    // плеера. Запоминаем его, чтобы после выбора источника он стал доступен
    // кнопке «Скачать» без привязки к конкретному провайдеру.
    if (Lampa.Player && typeof Lampa.Player.play === 'function' && !Lampa.Player.play.__universalDownload) {
        var originalPlay = Lampa.Player.play;
        var wrappedPlay = function (data) {
            var source = normalizeSource(data || {}, data || {});
            if (source) {
                lastDirectSource = source;
                var key = cardKey(data || {});
                if (key) rememberedSources[key] = source;
            }
            return originalPlay.apply(this, arguments);
        };
        wrappedPlay.__universalDownload = true;
        Lampa.Player.play = wrappedPlay;
    }

    window.LampaUniversalDownloads = {
        start: startDownload,
        list: getItems,
        remove: deleteItem,
        resolve: resolveSources
    };
})();
