(function () {
    'use strict';
    
    console.log('[Download] Universal plugin starting...');
    
    // === Эмуляция AndroidJS для ПК/браузера ===
    if (typeof AndroidJS === 'undefined' || typeof AndroidJS.downloadStart !== 'function') {
        console.log('[Download] AndroidJS not found, creating emulation for browser/PC');
        
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
        };
    }

    // === Конфигурация ===
    var DEFAULTS = {
        torrserver_url: 'http://free.torrservera.net:7788',
        torrserver_login: 'ts',
        torrserver_password: 'ts',
        torrserver_auth: true,
        jackett_url: 'http://jac.red',
    };

    // === Вспомогательные функции ===
    function listAll() {
        try {
            var raw = AndroidJS.downloadList();
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    function humanBytes(n) {
        if (!n || n <= 0) return '—';
        var u = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']; 
        var i = 0;
        while (n >= 1024 && i < u.length - 1) { 
            n /= 1024; 
            i++; 
        }
        return n.toFixed(n < 10 ? 1 : 0) + ' ' + u[i];
    }

    function getAuthHeader() {
        return 'Basic ' + btoa(DEFAULTS.torrserver_login + ':' + DEFAULTS.torrserver_password);
    }

    // === Поиск раздач через Jackett ===
    function searchTorrents(card) {
        var titleRu = card.title || card.name || '';
        var titleEn = card.original_title || card.original_name || titleRu;
        var year = ((card.release_date || card.first_air_date || '').slice(0, 4)) || '';
        var isSerial = (card.number_of_seasons || card.first_air_date) ? 1 : 0;
        var genres = (card.genres || []).map(function (g) { return g.name || g; }).join(',');
        var query = (titleEn + ' ' + titleRu).trim();
        var category = isSerial ? '5000' : '2000';
        
        var url = DEFAULTS.jackett_url.replace(/\/+$/, '') +
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
        }).then(function (data) {
            var results = (data && data.Results) || [];
            var torrents = [];
            
            results.forEach(function(item) {
                var magnet = item.MagnetUri || item.Link || item.magnetLink || '';
                if (!magnet) return;
                
                var info = item.info || {};
                torrents.push({
                    title: item.Title || item.title || '',
                    magnet: magnet,
                    sizeBytes: item.Size || item.size || 0,
                    sizeText: info.sizeName || '',
                    quality: info.quality || 0,
                    videotype: info.videotype || '',
                    voices: info.voices || [],
                    seeders: item.Seeders || item.seeders || 0,
                    leechers: item.Peers || item.peers || item.Leechers || 0,
                    tracker: item.Tracker || item.tracker || '',
                });
            });
            
            return torrents;
        });
    }

    function getQualityLabel(q) {
        if (q >= 2160) return '4K';
        if (q >= 1080) return '1080p';
        if (q >= 720) return '720p';
        if (q >= 480) return '480p';
        return '';
    }

    // === Работа с TorrServer ===
    function tsRequest(payload) {
        return fetch(DEFAULTS.torrserver_url.replace(/\/+$/, '') + '/torrents', {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Authorization': getAuthHeader(),
            },
            body: JSON.stringify(payload),
        }).then(function (r) {
            if (!r.ok) throw new Error('TorrServer HTTP ' + r.status);
            return r.json();
        });
    }

    function addTorrent(magnet, title, poster) {
        return tsRequest({
            action: 'add',
            link: magnet,
            title: title || '',
            poster: poster || '',
            save_to_db: false,
        }).then(function (data) {
            return data.hash || (data.torrent && data.torrent.hash) || '';
        });
    }

    function getTorrentFiles(hash) {
        var attempts = 0;
        var MAX = 30;
        var DELAY = 500;
        
        return new Promise(function (resolve, reject) {
            function tick() {
                attempts++;
                tsRequest({ action: 'get', hash: hash }).then(function (data) {
                    var raw = data && (data.file_stats || data.files || 
                        (data.torrent && data.torrent.file_stats) || []);
                    
                    if (raw && raw.length) {
                        var files = raw.map(function (f, i) {
                            return {
                                path: f.path || f.name || ('file_' + i),
                                length: f.length || f.size || 0,
                                id: f.id != null ? f.id : i,
                            };
                        });
                        resolve(files);
                        return;
                    }
                    
                    if (attempts >= MAX) {
                        resolve([]);
                        return;
                    }
                    setTimeout(tick, DELAY);
                }, function (e) {
                    if (attempts >= MAX) {
                        reject(e);
                        return;
                    }
                    setTimeout(tick, DELAY);
                });
            }
            tick();
        });
    }

    function getStreamUrl(hash, fileName, fileId) {
        var name = encodeURIComponent(fileName.split('/').pop().split('\\').pop());
        return DEFAULTS.torrserver_url.replace(/\/+$/, '') + '/stream/' + name +
            '?link=' + hash + '&index=' + fileId + '&play';
    }

    // === Диалог выбора раздачи ===
    function openTorrentPicker(card) {
        var title = card.title || card.name || '';
        if (!title && !(card.original_title || card.original_name)) {
            if (Lampa.Noty) Lampa.Noty.show('Нет названия для поиска');
            return;
        }
        
        if (Lampa.Loading) Lampa.Loading.start(function() {});
        
        searchTorrents(card).then(function(torrents) {
            if (Lampa.Loading) Lampa.Loading.stop();
            
            if (!torrents.length) {
                if (Lampa.Noty) Lampa.Noty.show('Раздачи не найдены');
                return;
            }
            
            torrents.sort(function(a, b) {
                if (b.seeders !== a.seeders) return b.seeders - a.seeders;
                return (b.quality || 0) - (a.quality || 0);
            });
            
            var items = torrents.slice(0, 30).map(function(t) {
                var parts = [];
                var quality = getQualityLabel(t.quality);
                if (quality) parts.push(quality + (t.videotype === 'hdr' ? ' HDR' : ''));
                if (t.voices && t.voices.length) parts.push(t.voices.slice(0, 2).join(', '));
                parts.push(t.sizeText || humanBytes(t.sizeBytes));
                parts.push('S:' + t.seeders);
                
                return {
                    title: t.title,
                    subtitle: parts.join(' • '),
                    _torrent: t
                };
            });
            
            if (Lampa.Select) {
                Lampa.Select.show({
                    title: 'Выберите раздачу — ' + title,
                    items: items,
                    onSelect: function(item) {
                        startDownload(item._torrent, card);
                    },
                    onBack: function() {
                        if (Lampa.Controller) Lampa.Controller.toggle('content');
                    }
                });
            }
        }).catch(function(e) {
            if (Lampa.Loading) Lampa.Loading.stop();
            if (Lampa.Noty) Lampa.Noty.show('Ошибка поиска: ' + (e.message || e));
        });
    }

    // === Запуск загрузки ===
    function startDownload(torrent, card) {
        var title = card.title || card.name || torrent.title;
        var poster = card.img || card.poster_path || '';
        if (poster && poster.charAt(0) === '/') {
            poster = 'https://image.tmdb.org/t/p/w500' + poster;
        }
        
        if (Lampa.Loading) Lampa.Loading.start(function() {});
        
        addTorrent(torrent.magnet, torrent.title, poster).then(function(hash) {
            if (!hash) throw new Error('TorrServer не вернул hash');
            return getTorrentFiles(hash).then(function(files) {
                return { hash: hash, files: files };
            });
        }).then(function(result) {
            if (Lampa.Loading) Lampa.Loading.stop();
            
            var videos = result.files.filter(function(f) {
                return /\.(mkv|mp4|avi|webm|m4v|ts|mov|flv)$/i.test(f.path);
            });
            
            if (!videos.length) {
                if (Lampa.Noty) Lampa.Noty.show('В раздаче нет видеофайлов');
                return;
            }
            
            function startFile(file) {
                var url = getStreamUrl(result.hash, file.path, file.id);
                var id = AndroidJS.downloadStart(JSON.stringify({
                    url: url,
                    title: title + (videos.length > 1 ? ' — ' + file.path.split('/').pop() : ''),
                    poster: poster,
                    headers: { Authorization: getAuthHeader() },
                }));
                
                if (id) {
                    if (Lampa.Noty) Lampa.Noty.show('Загрузка запущена!');
                    setTimeout(function() { ensureMenuItem(); }, 300);
                    try { if (Lampa.Activity) Lampa.Activity.backward(); } catch(e) {}
                } else {
                    if (Lampa.Noty) Lampa.Noty.show('Не удалось запустить загрузку');
                }
            }
            
            if (videos.length === 1) {
                startFile(videos[0]);
                return;
            }
            
            if (Lampa.Select) {
                Lampa.Select.show({
                    title: 'Выберите файл',
                    items: videos.map(function(f) {
                        return {
                            title: f.path.split('/').pop(),
                            subtitle: humanBytes(f.length),
                            _file: f
                        };
                    }),
                    onSelect: function(item) {
                        startFile(item._file);
                    },
                    onBack: function() {
                        if (Lampa.Controller) Lampa.Controller.toggle('content');
                    }
                });
            }
        }).catch(function(e) {
            if (Lampa.Loading) Lampa.Loading.stop();
            if (Lampa.Noty) Lampa.Noty.show('Ошибка: ' + (e.message || e));
        });
    }

    // === Внедрение кнопки в карточку ===
    function injectDownloadButton(activity) {
        try {
            var $render = activity.activity && activity.activity.render && activity.activity.render();
            if (!$render) return;
            
            // Поиск контейнера кнопок
            var selectors = [
                '.full-start-new__buttons',
                '.full-start__buttons', 
                '.full-start__button-container',
                '.buttons--container',
                '.full-start__buttons-container',
                '.full-start-new__buttons-container',
                '.full-start__button-block',
                '[class*="buttons"]',
                '[class*="button-container"]'
            ];
            
            var $buttons = null;
            for (var i = 0; i < selectors.length; i++) {
                var $found = $render.find(selectors[i]).first();
                if ($found.length) {
                    $buttons = $found;
                    break;
                }
            }
            
            // Fallback
            if (!$buttons || !$buttons.length) {
                var $btn = $render.find('.full-start__button').first();
                if ($btn.length) {
                    $buttons = $btn.parent();
                }
            }
            
            if (!$buttons || !$buttons.length) return;
            if ($buttons.find('.lampa-download-btn').length) return;
            
            var card = (activity.movie || activity.card) || {};
            
            var $newBtn = $(
                '<div class="full-start__button selector lampa-download-btn">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg>' +
                '<span>Скачать</span>' +
                '</div>'
            );
            
            $newBtn.on('hover:enter', function() {
                openTorrentPicker(card);
            });
            
            $buttons.append($newBtn);
            console.log('[Download] Button injected');
            
        } catch(e) {
            console.log('[Download] Inject error:', e);
        }
    }

    // === Множественные способы внедрения ===
    
    // 1. Событие full
    if (Lampa.Listener) {
        Lampa.Listener.follow('full', function(e) {
            if (e && (e.type === 'complite' || e.type === 'build' || e.type === 'complete')) {
                setTimeout(function() {
                    injectDownloadButton(e.object || e);
                }, 300);
            }
        });
        
        // 2. Событие activity
        Lampa.Listener.follow('activity', function(e) {
            if (e && e.type === 'start') {
                var act = e.object || e;
                if (act && act.component === 'full') {
                    setTimeout(function() {
                        injectDownloadButton(act);
                    }, 500);
                }
            }
        });
        
        // 3. После загрузки приложения
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                setTimeout(function() {
                    try {
                        var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
                        if (act && act.component === 'full') {
                            injectDownloadButton(act);
                        }
                    } catch(e) {}
                }, 2000);
            }
        });
    }
    
    // 4. Принудительная проверка
    setInterval(function() {
        try {
            var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
            if (act && act.component === 'full') {
                injectDownloadButton(act);
            }
        } catch(e) {}
    }, 3000);

    // === Пункт меню "Загрузки" ===
    function ensureMenuItem() {
        try {
            var items = listAll();
            if (!items.length) {
                $('.lampa-downloads-menu').remove();
                return;
            }
            
            var $menu = $('.menu .menu__list').first();
            if (!$menu.length) return;
            if ($menu.find('.lampa-downloads-menu').length) return;
            
            var $item = $(
                '<li class="menu__item selector lampa-downloads-menu">' +
                '<div class="menu__ico">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg>' +
                '</div>' +
                '<div class="menu__text">Загрузки</div>' +
                '</li>'
            );
            
            $item.on('hover:enter', function() {
                if (Lampa.Activity) {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Загрузки',
                        component: 'lampa_downloads',
                        page: 1
                    });
                }
            });
            
            $menu.append($item);
            try { if (Lampa.Controller) Lampa.Controller.collectionSet('menu'); } catch(e) {}
            
        } catch(e) {}
    }

    if (Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                setTimeout(ensureMenuItem, 500);
            }
        });
    }

    // === Компонент списка загрузок ===
    function DownloadsComponent() {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var $body = $(
            '<div class="lampa-downloads-list" style="padding:1.5em">' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(13em,1fr));gap:1.5em 1em"></div>' +
            '</div>'
        );
        scroll.body().append($body);
        var $html = scroll.render();
        var self = this;
        var cards = [];
        
        function render() {
            var items = listAll();
            var $grid = $body.find('div').first().empty();
            
            if (!items.length) {
                $grid.append('<div style="padding:2em;opacity:.7">Нет активных загрузок</div>');
                cards = [];
                return;
            }
            
            cards = items.map(function(item) {
                var poster = item.poster || './img/img_load.svg';
                var progress = item.status === 'completed' ? 100 : (item.percent || 0);
                var statusText = item.status === 'completed' ? humanBytes(item.sizeBytes) :
                                item.status === 'failed' ? 'Ошибка' :
                                item.status === 'paused' ? 'Пауза' :
                                (item.percent || 0) + '%';
                
                var statusColor = item.status === 'failed' ? '#f44' :
                                 item.status === 'completed' ? '#4a4' :
                                 '#e50914';
                
                var $card = $(
                    '<div class="card selector" style="width:14em">' +
                    '<div class="card__view" style="position:relative;padding-bottom:150%">' +
                    '<img class="card__img" src="' + poster + '" style="object-fit:cover">' +
                    '<div style="position:absolute;top:.4em;right:.4em;background:rgba(0,0,0,.75);color:#fff;font-size:.9em;padding:.2em .5em;border-radius:.3em;z-index:1">' + statusText + '</div>' +
                    '<div style="position:absolute;bottom:0;left:0;right:0;height:5px;background:rgba(0,0,0,.5);overflow:hidden;z-index:1">' +
                    '<div style="height:100%;width:' + progress + '%;background:' + statusColor + ';transition:width .3s"></div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="card__title" style="margin-top:.4em;font-size:.95em;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
                    (item.title || 'Без названия') +
                    '</div>' +
                    '</div>'
                );
                
                $card.on('hover:enter', function() {
                    if (item.status === 'completed' && item.localPath) {
                        if (Lampa.Player) {
                            Lampa.Player.play({
                                url: 'file://' + item.localPath,
                                title: item.title || '',
                                quality: {}
                            });
                        }
                    } else {
                        showItemMenu(item);
                    }
                });
                
                $card.on('hover:long', function() {
                    showItemMenu(item);
                });
                
                $grid.append($card);
                return $card[0];
            });
        }
        
        function showItemMenu(item) {
            var menuItems = [];
            
            if (item.status === 'downloading' || item.status === 'queued') {
                menuItems.push({ title: 'Приостановить', action: 'pause' });
            }
            
            if (item.status === 'paused') {
                menuItems.push({ title: 'Продолжить', action: 'resume' });
            }
            
            if (item.status === 'failed') {
                menuItems.push({ title: 'Повторить', action: 'resume' });
            }
            
            menuItems.push({ title: 'Удалить', action: 'delete' });
            menuItems.push({ title: 'Закрыть', action: 'close' });
            
            if (Lampa.Select) {
                Lampa.Select.show({
                    title: item.title || 'Загрузка',
                    items: menuItems,
                    onSelect: function(opt) {
                        if (opt.action === 'delete') {
                            AndroidJS.downloadDelete(item.id);
                            render();
                        } else if (opt.action === 'pause') {
                            AndroidJS.downloadCancel(item.id);
                            setTimeout(render, 300);
                        } else if (opt.action === 'resume') {
                            try {
                                if (typeof AndroidJS.downloadResume === 'function') {
                                    AndroidJS.downloadResume(item.id);
                                }
                            } catch(e) {}
                            setTimeout(render, 300);
                        }
                    },
                    onBack: function() {
                        if (Lampa.Controller) Lampa.Controller.toggle('content');
                    }
                });
            }
        }
        
        this.create = function() { return $html; };
        this.start = function() {
            render();
            if (Lampa.Controller) {
                Lampa.Controller.add('content', {
                    toggle: function() {
                        Lampa.Controller.collectionSet(scroll.render());
                        if (cards.length) {
                            try { if (window.Navigator) Navigator.focus(cards[0]); } catch(e) {}
                        }
                    },
                    back: function() { if (Lampa.Activity) Lampa.Activity.backward(); },
                    left: function() {
                        if (window.Navigator && Navigator.canmove('left')) Navigator.move('left');
                        else { try { if (Lampa.Controller) Lampa.Controller.toggle('menu'); } catch(e) {} }
                    },
                    right: function() {
                        if (window.Navigator && Navigator.canmove('right')) Navigator.move('right');
                    },
                    up: function() {
                        if (window.Navigator && Navigator.canmove('up')) Navigator.move('up');
                        else { try { if (Lampa.Controller) Lampa.Controller.toggle('head'); } catch(e) {} }
                    },
                    down: function() {
                        if (window.Navigator && Navigator.canmove('down')) Navigator.move('down');
                    }
                });
                Lampa.Controller.toggle('content');
            }
            
            self._timer = setInterval(function() {
                var items = listAll();
                if (items.some(function(x) {
                    return x.status === 'downloading' || x.status === 'queued';
                })) {
                    render();
                }
            }, 2000);
        };
        this.render = function() { return $html; };
        this.destroy = function() {
            if (self._timer) clearInterval(self._timer);
            try { scroll.destroy(); } catch(e) {}
            $html.remove();
        };
    }

    try {
        if (Lampa.Component) {
            Lampa.Component.add('lampa_downloads', DownloadsComponent);
            console.log('[Download] Component registered');
        }
    } catch(e) {
        console.log('[Download] Component registration failed:', e);
    }

    // === Периодическая проверка меню ===
    setInterval(ensureMenuItem, 2000);

    // === Публичный API ===
    window.__lampaDownloadStart = function(payloadJson) {
        var id = AndroidJS.downloadStart(payloadJson);
        setTimeout(ensureMenuItem, 300);
        return id;
    };

    console.log('[Download] Universal plugin loaded successfully!');
    
})();
