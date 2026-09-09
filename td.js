(function () {
    'use strict';

    // === Определяем платформу ===
    var IS_ANDROID = typeof AndroidJS !== 'undefined' && 
                     typeof AndroidJS.downloadStart === 'function' &&
                     typeof AndroidJS.getResp !== 'function'; // На Android нет getResp

    // === 1. Эмуляция AndroidJS для ПК/браузера ===
    if (!IS_ANDROID && (typeof AndroidJS === 'undefined' || typeof AndroidJS.downloadStart !== 'function')) {
        console.log('[Lampa] AndroidJS не найден, создаём эмуляцию для браузера');
        
        window.AndroidJS = {
            _downloads: [],
            _idCounter: 0,
            
            downloadStart: function(payloadJson) {
                try {
                    var data = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson;
                    var id = ++this._idCounter;
                    var entry = {
                        id: id,
                        url: data.url,
                        title: data.title || 'download',
                        poster: data.poster || '',
                        status: 'downloading',
                        percent: 0,
                        sizeBytes: 0,
                        localPath: '',
                        headers: data.headers || {},
                        _xhr: null,
                    };
                    this._downloads.push(entry);
                    this._browserDownload(entry);
                    return id;
                } catch(e) {
                    console.error('[Download] start error:', e);
                    return null;
                }
            },
            
            _browserDownload: function(entry) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', entry.url, true);
                
                if (entry.headers) {
                    for (var key in entry.headers) {
                        xhr.setRequestHeader(key, entry.headers[key]);
                    }
                }
                
                xhr.responseType = 'blob';
                xhr.onprogress = function(e) {
                    if (e.total > 0) {
                        entry.percent = Math.round((e.loaded / e.total) * 100);
                        entry.sizeBytes = e.total;
                        entry.status = 'downloading';
                        AndroidJS._notifyUpdate();
                    }
                };
                
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        var url = URL.createObjectURL(xhr.response);
                        entry.localPath = url;
                        entry.status = 'completed';
                        entry.percent = 100;
                        entry.sizeBytes = xhr.response.size;
                        
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = entry.title + '.mp4';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        AndroidJS._notifyUpdate();
                    } else {
                        entry.status = 'failed';
                        AndroidJS._notifyUpdate();
                    }
                };
                
                xhr.onerror = function() {
                    entry.status = 'failed';
                    AndroidJS._notifyUpdate();
                };
                
                xhr.ontimeout = function() {
                    entry.status = 'failed';
                    AndroidJS._notifyUpdate();
                };
                
                xhr.timeout = 30000;
                entry._xhr = xhr;
                xhr.send();
            },
            
            downloadList: function() {
                try {
                    return JSON.stringify(this._downloads);
                } catch(e) {
                    return '[]';
                }
            },
            
            downloadCancel: function(id) {
                var entry = this._downloads.find(function(e) { return e.id === id; });
                if (entry && entry._xhr) {
                    entry._xhr.abort();
                    entry.status = 'paused';
                    AndroidJS._notifyUpdate();
                }
            },
            
            downloadDelete: function(id) {
                var idx = this._downloads.findIndex(function(e) { return e.id === id; });
                if (idx !== -1) {
                    var entry = this._downloads[idx];
                    if (entry._xhr) entry._xhr.abort();
                    if (entry.localPath && entry.localPath.startsWith('blob:')) {
                        URL.revokeObjectURL(entry.localPath);
                    }
                    this._downloads.splice(idx, 1);
                    AndroidJS._notifyUpdate();
                }
            },
            
            downloadResume: function(id) {
                var entry = this._downloads.find(function(e) { return e.id === id; });
                if (entry && (entry.status === 'paused' || entry.status === 'failed')) {
                    var url = entry.url;
                    var title = entry.title;
                    var poster = entry.poster;
                    var headers = entry.headers;
                    this.downloadDelete(id);
                    return this.downloadStart(JSON.stringify({
                        url: url, title: title, poster: poster, headers: headers
                    }));
                }
                return null;
            },
            
            downloadPartPath: function(id) {
                var entry = this._downloads.find(function(e) { return e.id === id; });
                return entry && entry.localPath ? entry.localPath : '';
            },
            
            localShareFileUrl: function(id) {
                var entry = this._downloads.find(function(e) { return e.id === id; });
                return entry && entry.localPath ? entry.localPath : '';
            },
            
            _notifyUpdate: function() {
                try {
                    if (window.Lampa && Lampa.Listener) {
                        Lampa.Listener.send('downloads_updated', {});
                    }
                } catch(e) {}
            },
            
            copyToClipboard: function(text) {
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text);
                        return true;
                    }
                    var textarea = document.createElement('textarea');
                    textarea.value = text;
                    document.body.appendChild(textarea);
                    textarea.select();
                    var result = document.execCommand('copy');
                    document.body.removeChild(textarea);
                    return result;
                } catch(e) {
                    return false;
                }
            },
            
            isOnline: function() {
                return navigator.onLine !== false;
            },
            
            networkWatchStart: function() {},
            networkWatchStop: function() {},
            
            // Публичный хелпер для скачивания
            __lampaDownloadStart: function(payloadJson) {
                var id = this.downloadStart(payloadJson);
                return id;
            }
        };
    }

    // === 2. Встроенные дефолты ===
    var DEFAULTS = {
        torrserver_url: 'http://free.torrservera.net:7788',
        torrserver_login: 'ts',
        torrserver_password: 'ts',
        torrserver_auth: true,
        parser_torrent_type: 'jackett',
        jackett_url: 'http://jac.red',
        jackett_key: '',
    };

    function hasSources() { return true; }

    function listAll() {
        try {
            var raw = AndroidJS.downloadList();
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    function humanBytes(n) {
        if (!n || n <= 0) return '—';
        var u = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']; var i = 0;
        while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
        return n.toFixed(n < 10 ? 1 : 0) + ' ' + u[i];
    }

    // --- 1. Кнопка «Скачать» в карточке -----------------------
    function injectDownloadButton(activity) {
        if (!hasSources()) return;
        var $render = activity.activity && activity.activity.render && activity.activity.render();
        if (!$render) return;
        var $buttons = $render.find(
            '.full-start-new__buttons, .full-start__buttons, ' +
            '.full-start__button-container, .buttons--container'
        ).first();
        if (!$buttons.length) return;
        if ($buttons.find('.lampa-download').length) return;

        var card = (activity.movie || activity.card) || {};
        var providerId = (card.first_air_date || card.number_of_seasons ? 'tv:' : 'movie:') +
            (card.id || card.card_id || '');
        var $btn = $('<div class="full-start__button selector lampa-download">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg><span>Скачать</span></div>');
        $btn.on('hover:enter', function () { openTorrentPicker(card, providerId); });
        $buttons.append($btn);
    }

    var OUR_TS_URL = DEFAULTS.torrserver_url;
    var OUR_TS_LOGIN = DEFAULTS.torrserver_login;
    var OUR_TS_PASSWORD = DEFAULTS.torrserver_password;
    var OUR_JACKETT_URL = DEFAULTS.jackett_url;

    function ourAuthHeader() {
        return 'Basic ' + btoa(OUR_TS_LOGIN + ':' + OUR_TS_PASSWORD);
    }

    function ourJackettSearch(card) {
        var titleRu = card.title || card.name || '';
        var titleEn = card.original_title || card.original_name || titleRu;
        var year = ((card.release_date || card.first_air_date || '').slice(0, 4)) || '';
        var isSerial = (card.number_of_seasons || card.first_air_date) ? 1 : 0;
        var genres = (card.genres || []).map(function (g) { return g.name || g; }).join(',');
        var query = (titleEn + ' ' + titleRu).trim();
        var category = isSerial ? '5000' : '2000';
        var url = OUR_JACKETT_URL.replace(/\/+$/, '') +
            '/api/v2.0/indexers/all/results?apikey=' +
            '&Query=' + encodeURIComponent(query) +
            '&title=' + encodeURIComponent(titleRu) +
            '&title_original=' + encodeURIComponent(titleEn) +
            (year ? '&year=' + encodeURIComponent(year) : '') +
            '&is_serial=' + isSerial +
            (genres ? '&genres=' + encodeURIComponent(genres) : '') +
            '&Category[]=' + category;
        return fetch(url, {
            mode: 'cors',
            headers: { Accept: 'application/json, text/javascript, */*; q=0.01' },
        }).then(function (r) {
            if (!r.ok) throw new Error('Jackett HTTP ' + r.status);
            return r.json();
        }).then(function (j) {
            var arr = (j && j.Results) || [];
            var out = [];
            for (var i = 0; i < arr.length; i++) {
                var it = arr[i];
                var mag = it.MagnetUri || it.Link || it.magnetLink || '';
                if (!mag) continue;
                var info = it.info || {};
                out.push({
                    title: it.Title || it.title || '',
                    magnet: mag,
                    sizeBytes: it.Size || it.size || 0,
                    sizeText: info.sizeName || '',
                    quality: info.quality || 0,
                    videotype: info.videotype || '',
                    voices: info.voices || [],
                    seeders: it.Seeders || it.seeders || 0,
                    leechers: it.Peers || it.peers || it.Leechers || 0,
                    tracker: it.Tracker || it.tracker || '',
                });
            }
            return out;
        });
    }

    function qualityLabel(q) {
        if (q >= 2160) return '4K';
        if (q >= 1080) return '1080p';
        if (q >= 720) return '720p';
        if (q >= 480) return '480p';
        return '';
    }

    function ourTsCall(payload) {
        return fetch(OUR_TS_URL.replace(/\/+$/, '') + '/torrents', {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Authorization': ourAuthHeader(),
            },
            body: JSON.stringify(payload),
        }).then(function (r) {
            if (!r.ok) throw new Error('TS HTTP ' + r.status);
            return r.json();
        });
    }

    function ourTsAdd(magnet, title, poster) {
        return ourTsCall({
            action: 'add',
            link: magnet,
            title: title || '',
            poster: poster || '',
            save_to_db: false,
        }).then(function (j) {
            return j.hash || (j.torrent && j.torrent.hash) || '';
        });
    }

    function ourTsFiles(hash) {
        var attempts = 0;
        var MAX = 30;
        var DELAY = 500;
        function extract(j) {
            var raw = j && (j.file_stats || j.files ||
                (j.torrent && j.torrent.file_stats) || []);
            if (!raw.length) return null;
            return raw.map(function (f, i) {
                return {
                    path: f.path || f.name || ('file_' + i),
                    length: f.length || f.size || 0,
                    id: f.id != null ? f.id : i,
                };
            });
        }
        return new Promise(function (resolve, reject) {
            function tick() {
                attempts++;
                ourTsCall({ action: 'get', hash: hash }).then(function (j) {
                    var files = extract(j);
                    if (files) return resolve(files);
                    if (attempts >= MAX) return resolve([]);
                    setTimeout(tick, DELAY);
                }, function (e) {
                    if (attempts >= MAX) return reject(e);
                    setTimeout(tick, DELAY);
                });
            }
            tick();
        });
    }

    function ourTsPlayUrl(hash, fileName, fileId) {
        var name = encodeURIComponent(fileName.split('/').pop().split('\\').pop());
        return OUR_TS_URL.replace(/\/+$/, '') + '/stream/' + name +
            '?link=' + hash + '&index=' + fileId + '&play';
    }

    function openTorrentPicker(card, providerId) {
        var title = card.title || card.name || '';
        if (!title && !(card.original_title || card.original_name)) {
            Lampa.Noty.show('Нет названия для поиска');
            return;
        }
        Lampa.Loading.start(function () {});
        ourJackettSearch(card).then(function (list) {
            Lampa.Loading.stop();
            if (!list.length) {
                Lampa.Noty.show('Раздачи не найдены'); return;
            }
            list.sort(function (a, b) {
                if (b.seeders !== a.seeders) return b.seeders - a.seeders;
                return (b.quality || 0) - (a.quality || 0);
            });
            Lampa.Select.show({
                title: 'Выберите вариант — ' + title,
                items: list.slice(0, 30).map(function (r) {
                    var parts = [];
                    var q = qualityLabel(r.quality);
                    if (q) parts.push(q + (r.videotype === 'hdr' ? ' HDR' : ''));
                    if (r.voices && r.voices.length) parts.push(r.voices.slice(0, 2).join(', '));
                    parts.push(r.sizeText || humanBytes(r.sizeBytes));
                    parts.push('S:' + r.seeders);
                    return {
                        title: r.title,
                        subtitle: parts.join(' • '),
                        _raw: r,
                    };
                }),
                onSelect: function (item) { pickFileAndStart(item._raw, card, providerId); },
                onBack: function () { Lampa.Controller.toggle('content'); },
            });
        }).catch(function (e) {
            Lampa.Loading.stop();
            Lampa.Noty.show('Ошибка поиска: ' + (e.message || e));
        });
    }

    function pickFileAndStart(raw, card, providerId) {
        var title = card.title || card.name || raw.title;
        var poster = card.img || card.poster_path || '';
        if (poster && poster.charAt(0) === '/') {
            poster = 'https://image.tmdb.org/t/p/w500' + poster;
        }
        Lampa.Loading.start(function () {});
        ourTsAdd(raw.magnet, raw.title, poster).then(function (hash) {
            if (!hash) throw new Error('TorrServer не вернул hash');
            return ourTsFiles(hash).then(function (files) { return { hash: hash, files: files }; });
        }).then(function (res) {
            Lampa.Loading.stop();
            var videos = res.files.filter(function (f) {
                return /\.(mkv|mp4|avi|webm|m4v|ts|mov|flv)$/i.test(f.path);
            });
            if (!videos.length) {
                Lampa.Noty.show('В раздаче нет видеофайлов'); return;
            }
            var start = function (file) {
                var url = ourTsPlayUrl(res.hash, file.path, file.id);
                var id = AndroidJS.downloadStart(JSON.stringify({
                    url: url,
                    providerId: providerId,
                    title: title + (videos.length > 1 ? ' — ' + file.path.split('/').pop() : ''),
                    poster: poster,
                    headers: { Authorization: ourAuthHeader() },
                }));
                if (id) {
                    Lampa.Noty.show('Загрузка запущена. Смотри в «Загрузки».');
                    setTimeout(function () { ensureMenuItem(); }, 300);
                    try { Lampa.Activity.backward(); } catch (_) {}
                } else {
                    Lampa.Noty.show('Не удалось запустить загрузку');
                }
            };
            if (videos.length === 1) { start(videos[0]); return; }
            Lampa.Select.show({
                title: 'Выберите файл',
                items: videos.map(function (f) {
                    return {
                        title: f.path.split('/').pop(),
                        subtitle: humanBytes(f.length),
                        _file: f,
                    };
                }),
                onSelect: function (item) { start(item._file); },
                onBack: function () { Lampa.Controller.toggle('content'); },
            });
        }).catch(function (e) {
            Lampa.Loading.stop();
            Lampa.Noty.show('Ошибка: ' + (e.message || e));
        });
    }

    Lampa.Listener.follow('full', function (e) {
        if (e && (e.type === 'complite' || e.type === 'build')) {
            injectDownloadButton(e.object || e);
        }
    });

    // --- 2. Пункт «Загрузки» в главном меню -------------------
    function ensureMenuItem() {
        try {
            if (!listAll().length) { $('.lampa-menu-downloads').remove(); return; }
            var $menu = $('.menu .menu__list').first();
            if (!$menu.length) return;
            if ($menu.find('.lampa-menu-downloads').length) return;
            var $item = $('<li class="menu__item selector lampa-menu-downloads">' +
                '<div class="menu__ico">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg></div>' +
                '<div class="menu__text">Загрузки</div></li>');
            $item.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '', title: 'Загрузки', component: 'lampa_downloads',
                    page: 1,
                });
            });
            $menu.append($item);
            try { Lampa.Controller.collectionSet('menu'); } catch (_) {}
        } catch (e) {}
    }
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') { setTimeout(ensureMenuItem, 500); }
    });

    // --- Component: экран «Загрузки» -------------------------
    function DownloadsComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var $body = $(
            '<div class="lampa-downloads" style="padding:1.5em">' +
            '<div class="lampa-downloads__list" ' +
            'style="display:grid;grid-template-columns:repeat(auto-fill,' +
            'minmax(13em,1fr));gap:1.5em 1em"></div>' +
            '</div>');
        scroll.body().append($body);
        var $html = scroll.render();
        var self = this;
        var activeCards = [];

        function applyPhoneScroll() {
            try {
                var $head = $('.head');
                var $navi = $('.navigation-bar');
                var minus = 0;
                if ($head.length) minus += $head[0].getBoundingClientRect().height;
                if ($navi.length && window.innerWidth <= window.innerHeight) {
                    minus += $navi[0].getBoundingClientRect().height;
                }
                var maxH = Math.max(200, window.innerHeight - minus);
                $html.find('.scroll__content').css({
                    'max-height': maxH + 'px',
                    'overflow-y': 'auto',
                });
            } catch (_) {}
        }
        applyPhoneScroll();
        $(window).on('resize.lampaDownloads', applyPhoneScroll);

        function scrollToFocused(el) {
            try {
                var box = $html.find('.scroll__content')[0];
                if (!box || !el) return;
                var pad = 24;
                var b = box.getBoundingClientRect();
                var e = el.getBoundingClientRect();
                if (e.top < b.top + pad) {
                    box.scrollTop -= (b.top + pad - e.top);
                } else if (e.bottom > b.bottom - pad) {
                    box.scrollTop += (e.bottom - (b.bottom - pad));
                }
            } catch (_) {}
        }

        function statusText(it) {
            if (it.status === 'completed') return humanBytes(it.sizeBytes);
            if (it.status === 'failed') return 'Ошибка';
            if (it.status === 'paused') return 'Пауза';
            return (it.percent || 0) + '%';
        }

        function render() {
            var items = listAll();
            var $list = $body.find('.lampa-downloads__list').empty();
            if (!items.length) {
                $list.append('<div style="padding:2em;opacity:.7">Пока ничего не скачано.</div>');
                activeCards = [];
                return;
            }
            activeCards = items.map(function (it) {
                var poster = it.poster || './img/img_load.svg';
                var progress = it.status === 'completed' ? 100 : (it.percent || 0);
                var statusColor = it.status === 'failed' ? '#f44'
                    : it.status === 'completed' ? '#4a4'
                    : '#e50914';
                var $card = $(
                    '<div class="card selector lampa-download-card" style="width:14em">' +
                    '<div class="card__view" style="position:relative;padding-bottom:150%">' +
                    '<img class="card__img" src="' + poster + '" style="object-fit:cover">' +
                    '<div class="card__status" style="position:absolute;top:.4em;right:.4em;' +
                    'background:rgba(0,0,0,.75);color:#fff;font-size:.9em;padding:.2em .5em;' +
                    'border-radius:.3em;z-index:1">' + statusText(it) + '</div>' +
                    '<div class="card__progress" style="position:absolute;bottom:0;left:0;' +
                    'right:0;height:5px;background:rgba(0,0,0,.5);' +
                    'border-bottom-left-radius:1em;border-bottom-right-radius:1em;' +
                    'overflow:hidden;z-index:1">' +
                    '<div style="height:100%;width:' + progress + '%;' +
                    'background:' + statusColor + ';transition:width .3s"></div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="card__title" style="margin-top:.4em;font-size:.95em;' +
                    'text-align:center;white-space:nowrap;overflow:hidden;' +
                    'text-overflow:ellipsis">' +
                    (it.title || '(без названия)') + '</div>' +
                    '</div>');
                $card.on('hover:focus', function (e) { scrollToFocused(e.target); });
                $card.on('hover:enter', function () { onCardEnter(it); });
                $card.on('hover:long', function () { onCardLong(it); });
                $list.append($card);
                return $card[0];
            });
        }

        function playStream(entry, useInner) {
            var completed = entry.status === 'completed' && entry.localPath;
            var url = completed ? 'file://' + entry.localPath : entry.url;
            var data = {
                url: url,
                title: entry.title || '',
                quality: {},
            };
            if (!completed) {
                try {
                    var raw = entry.headers;
                    if (raw && typeof raw === 'string') raw = JSON.parse(raw);
                    if (raw && typeof raw === 'object') data.headers = raw;
                } catch (_) {}
            }
            if (useInner) data.launch_player = 'inner';
            try {
                Lampa.Player.play(data);
            } catch (e) {
                Lampa.Noty.show('Не удалось запустить плеер');
            }
        }

        function playPart(entry, partPath) {
            try {
                Lampa.Player.play({
                    url: 'file://' + partPath,
                    title: entry.title || '',
                    quality: {},
                });
            } catch (e) {
                Lampa.Noty.show('Не удалось открыть файл');
            }
        }

        function partPathOf(entry) {
            if (entry.status === 'completed') return '';
            try {
                if (typeof AndroidJS.downloadPartPath === 'function') {
                    return AndroidJS.downloadPartPath(entry.id) || '';
                }
            } catch (e) {}
            return '';
        }

        function onCardEnter(entry) {
            if (entry.status === 'completed' && entry.localPath) {
                playStream(entry, false);
                return;
            }
            var part = partPathOf(entry);
            if (part) {
                playPart(entry, part);
                return;
            }
            onCardLong(entry);
        }

        function onCardLong(entry) {
            var items = [];
            var canPlay = (entry.status === 'completed' && entry.localPath) ||
                entry.status === 'downloading' || entry.status === 'queued' ||
                entry.status === 'paused';
            if (canPlay) {
                items.push({ title: 'Смотреть', action: 'play' });
                items.push({ title: 'Смотреть во встроенном плеере', action: 'play_inner' });
            }
            var partPath = partPathOf(entry);
            var writing = entry.status === 'downloading' || entry.status === 'queued';
            if (partPath && !writing) {
                items.unshift({
                    title: 'Смотреть скачанное (' + (entry.percent || 0) + '%)',
                    action: 'play_part',
                    partPath: partPath,
                });
            } else if (partPath && writing) {
                items.push({
                    title: 'Смотреть скачанное — нужна пауза',
                    action: 'pause_then_part',
                    partPath: partPath,
                });
            }
            if (entry.status === 'downloading' || entry.status === 'queued') {
                items.push({ title: 'Приостановить', action: 'pause' });
            }
            if (entry.status === 'paused') {
                items.push({ title: 'Продолжить', action: 'resume' });
            } else if (entry.status === 'failed') {
                items.push({ title: 'Повторить', action: 'resume' });
            }
            var shareUrl = '';
            try {
                if (typeof AndroidJS.localShareFileUrl === 'function') {
                    shareUrl = AndroidJS.localShareFileUrl(entry.id) || '';
                }
            } catch (e) {}
            if (shareUrl) {
                items.push({
                    title: 'Ссылка для другого устройства',
                    action: 'share_link',
                    url: shareUrl,
                });
            }
            items.push({ title: 'Удалить', action: 'delete' });
            items.push({ title: 'Закрыть', action: 'close' });
            Lampa.Select.show({
                title: entry.title,
                items: items,
                onSelect: function (a) {
                    if (a.action === 'delete') {
                        AndroidJS.downloadDelete(entry.id);
                        render();
                    } else if (a.action === 'pause') {
                        AndroidJS.downloadCancel(entry.id);
                        setTimeout(render, 300);
                    } else if (a.action === 'resume') {
                        try {
                            if (typeof AndroidJS.downloadResume === 'function') {
                                AndroidJS.downloadResume(entry.id);
                            } else {
                                Lampa.Noty.show('Обновите приложение для докачки');
                            }
                        } catch (e) {}
                        setTimeout(render, 300);
                    } else if (a.action === 'play') {
                        playStream(entry, false);
                    } else if (a.action === 'play_inner') {
                        playStream(entry, true);
                    } else if (a.action === 'play_part') {
                        playPart(entry, a.partPath);
                    } else if (a.action === 'share_link') {
                        var copied = false;
                        try {
                            if (typeof AndroidJS.copyToClipboard === 'function') {
                                copied = !!AndroidJS.copyToClipboard(a.url);
                            }
                        } catch (e) {}
                        Lampa.Select.show({
                            title: 'Откройте на другом устройстве',
                            items: [
                                { title: a.url },
                                { title: copied ? 'Скопировано в буфер обмена' : 'Закрыть' },
                            ],
                            onSelect: function () { Lampa.Controller.toggle('content'); },
                            onBack: function () { Lampa.Controller.toggle('content'); },
                        });
                    } else if (a.action === 'pause_then_part') {
                        try { AndroidJS.downloadCancel(entry.id); } catch (e) {}
                        Lampa.Noty.show('Загрузка приостановлена — продолжите её после просмотра');
                        setTimeout(function () { playPart(entry, a.partPath); }, 600);
                    }
                },
                onBack: function () { Lampa.Controller.toggle('content'); },
            });
        }

        this.create = function () { return $html; };
        this.start = function () {
            render();
            applyPhoneScroll();
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    var first = activeCards[0];
                    if (first && window.Navigator && typeof Navigator.focus === 'function') {
                        try { Navigator.focus(first); } catch (_) {
                            Lampa.Controller.collectionFocus(first || false, scroll.render());
                        }
                    } else {
                        Lampa.Controller.collectionFocus(first || false, scroll.render());
                    }
                },
                back: function () { Lampa.Activity.backward(); },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else { try { Lampa.Controller.toggle('menu'); } catch (_) {} }
                },
                right: function () {
                    if (Navigator.canmove('right')) Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else { try { Lampa.Controller.toggle('head'); } catch (_) {} }
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
            });
            Lampa.Controller.toggle('content');
            self._timer = setInterval(function () {
                if (listAll().some(function (x) {
                    return x.status === 'downloading' || x.status === 'queued';
                })) {
                    render();
                }
            }, 2000);
        };
        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return $html; };
        this.destroy = function () {
            if (self._timer) clearInterval(self._timer);
            try { $(window).off('resize.lampaDownloads'); } catch (_) {}
            try { scroll.destroy(); } catch (_) {}
            $html.remove();
        };
    }
    try {
        Lampa.Component.add('lampa_downloads', DownloadsComponent);
    } catch (e) { console.log('[Lampa downloads] component add failed', e); }

    // === Local share — «Устройства в сети» ============================
    function SharePeersComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var $body = $('<div class="lampa-share" style="padding:1.5em"></div>');
        scroll.body().append($body);
        var $html = scroll.render();
        var self = this;
        var activeCards = [];
        var peers = [];

        function scrollToFocused(el) {
            try {
                var box = $html.find('.scroll__content')[0];
                if (!box || !el) return;
                var pad = 24;
                var b = box.getBoundingClientRect();
                var e = el.getBoundingClientRect();
                if (e.top < b.top + pad) {
                    box.scrollTop -= (b.top + pad - e.top);
                } else if (e.bottom > b.bottom - pad) {
                    box.scrollTop += (e.bottom - (b.bottom - pad));
                }
            } catch (_) {}
        }

        function applyPhoneScroll() {
            try {
                var $head = $('.head'), $navi = $('.navigation-bar'), minus = 0;
                if ($head.length) minus += $head[0].getBoundingClientRect().height;
                if ($navi.length && window.innerWidth <= window.innerHeight) {
                    minus += $navi[0].getBoundingClientRect().height;
                }
                var maxH = Math.max(200, window.innerHeight - minus);
                $html.find('.scroll__content').css({
                    'max-height': maxH + 'px', 'overflow-y': 'auto',
                });
            } catch (_) {}
        }
        applyPhoneScroll();
        $(window).on('resize.lampaShare', applyPhoneScroll);

        function renderEmpty(msg) {
            $body.empty();
            $body.append('<div style="padding:2em;opacity:.7">' + msg + '</div>');
            activeCards = [];
        }

        function renderPeer(peer, files) {
            var $section = $('<div class="lampa-share__peer" style="margin-bottom:2em"></div>');
            $section.append('<h2 style="margin:0 0 .8em;font-size:1.3em">' + peer.name + '</h2>');
            var $grid = $('<div class="lampa-share__list" ' +
                'style="display:grid;grid-template-columns:repeat(auto-fill,' +
                'minmax(13em,1fr));gap:1.5em 1em"></div>');
            if (!files.length) {
                $grid.append('<div style="opacity:.6">Ничего не расшарено</div>');
            }
            files.forEach(function (f) {
                var poster = f.poster || './img/img_load.svg';
                var $card = $(
                    '<div class="card selector" style="width:14em">' +
                    '<div class="card__view" style="position:relative;padding-bottom:150%">' +
                    '<img class="card__img" src="' + poster + '" style="object-fit:cover">' +
                    '</div>' +
                    '<div class="card__title" style="margin-top:.4em;font-size:.95em;' +
                    'text-align:center;white-space:nowrap;overflow:hidden;' +
                    'text-overflow:ellipsis">' + (f.name || 'файл') + '</div>' +
                    '</div>');
                $card.on('hover:focus', function (e) { scrollToFocused(e.target); });
                $card.on('hover:enter', function () {
                    try {
                        Lampa.Player.play({
                            url: peer.base + f.url,
                            title: f.name || 'Локальный файл',
                            quality: {},
                        });
                    } catch (e) { Lampa.Noty.show('Не удалось запустить'); }
                });
                $grid.append($card);
                activeCards.push($card[0]);
            });
            $section.append($grid);
            $body.append($section);
        }

        function refresh() {
            activeCards = [];
            $body.empty();
            if (!peers.length) {
                renderEmpty('Ищем устройства…');
                return;
            }
            peers.forEach(function (peer) {
                var $stub = $('<div style="padding:1em;opacity:.6">' + peer.name + ' — загружаем список…</div>');
                $body.append($stub);
                var listUrl = peer.base + '/list.json';
                $.ajax({
                    url: listUrl,
                    dataType: 'json',
                    timeout: 8000,
                }).done(function (list) {
                    $stub.remove();
                    renderPeer(peer, Array.isArray(list) ? list : []);
                    setTimeout(function () {
                        try {
                            Lampa.Controller.collectionSet(scroll.render());
                            if (activeCards[0] && window.Navigator) Navigator.focus(activeCards[0]);
                        } catch (_) {}
                    }, 50);
                }).fail(function (xhr, status, err) {
                    console.log('[Lampa share] failed ' + listUrl + ' status=' + status + ' err=' + (err || '') + ' httpStatus=' + (xhr && xhr.status));
                    $stub.html(
                        '<div>' + peer.name + ' — не отвечает</div>' +
                        '<div style="font-size:.85em;opacity:.6;margin-top:.2em">' +
                        listUrl + ' · ' + (status || 'error') +
                        (xhr && xhr.status ? ' (HTTP ' + xhr.status + ')' : '') +
                        '</div>'
                    );
                });
            });
        }

        window.__lampaShareUpdate = function (list) {
            peers = list || [];
            refresh();
        };

        this.create = function () { return $html; };
        this.start = function () {
            applyPhoneScroll();
            try { AndroidJS.localShareDiscoverStart(); } catch (_) {}
            renderEmpty('Ищем устройства…');
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    if (activeCards[0] && window.Navigator) {
                        try { Navigator.focus(activeCards[0]); } catch (_) {}
                    }
                },
                back: function () { Lampa.Activity.backward(); },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else { try { Lampa.Controller.toggle('menu'); } catch (_) {} }
                },
                right: function () {
                    if (Navigator.canmove('right')) Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else { try { Lampa.Controller.toggle('head'); } catch (_) {} }
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
            });
            Lampa.Controller.toggle('content');
        };
        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return $html; };
        this.destroy = function () {
            try { AndroidJS.localShareDiscoverStop(); } catch (_) {}
            try { $(window).off('resize.lampaShare'); } catch (_) {}
            try { scroll.destroy(); } catch (_) {}
            window.__lampaShareUpdate = null;
            $html.remove();
        };
    }
    try {
        Lampa.Component.add('lampa_share_peers', SharePeersComponent);
    } catch (e) { console.log('[Lampa share] component add failed', e); }

    setInterval(function () { ensureMenuItem(); }, 2000);
    window.__lampaDownloadStart = function (payloadJson) {
        var id = AndroidJS.downloadStart(payloadJson);
        setTimeout(function () { ensureMenuItem(); }, 300);
        return id;
    };
})();
