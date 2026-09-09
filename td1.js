// Lampa Download Plugin
(function() {
    'use strict';
    
    console.log('[Download] Plugin starting...');
    
    // Проверка AndroidJS
    if (typeof AndroidJS === 'undefined' || typeof AndroidJS.downloadStart !== 'function') {
        console.log('[Download] AndroidJS not available');
        return;
    }
    
    console.log('[Download] AndroidJS detected');
    
    // === Конфигурация ===
    var CONFIG = {
        torrserver_url: 'http://free.torrservera.net:7788',
        torrserver_login: 'ts',
        torrserver_password: 'ts',
        jackett_url: 'http://jac.red'
    };
    
    // === Вспомогательные функции ===
    function humanBytes(bytes) {
        if (!bytes || bytes <= 0) return '—';
        var units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
        var i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return bytes.toFixed(bytes < 10 ? 1 : 0) + ' ' + units[i];
    }
    
    function getAuthHeader() {
        return 'Basic ' + btoa(CONFIG.torrserver_login + ':' + CONFIG.torrserver_password);
    }
    
    function getCardId(card) {
        if (card.id) return card.id;
        if (card.card_id) return card.card_id;
        if (card.movie_id) return card.movie_id;
        return '';
    }
    
    // === Поиск раздач через Jackett ===
    function searchTorrents(card) {
        var titleRu = card.title || card.name || '';
        var titleEn = card.original_title || card.original_name || titleRu;
        var year = (card.release_date || card.first_air_date || '').slice(0, 4) || '';
        var isSerial = (card.number_of_seasons || card.first_air_date) ? 1 : 0;
        var genres = (card.genres || []).map(function(g) { return g.name || g; }).join(',');
        var query = (titleEn + ' ' + titleRu).trim();
        var category = isSerial ? '5000' : '2000';
        
        var url = CONFIG.jackett_url.replace(/\/+$/, '') +
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
            headers: { Accept: 'application/json, text/javascript, */*; q=0.01' }
        })
        .then(function(r) {
            if (!r.ok) throw new Error('Jackett HTTP ' + r.status);
            return r.json();
        })
        .then(function(data) {
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
                    seeders: item.Seeders || item.seeders || 0,
                    leechers: item.Peers || item.peers || item.Leechers || 0,
                    tracker: item.Tracker || item.tracker || ''
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
        return fetch(CONFIG.torrserver_url.replace(/\/+$/, '') + '/torrents', {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Authorization': getAuthHeader()
            },
            body: JSON.stringify(payload)
        })
        .then(function(r) {
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
            save_to_db: false
        })
        .then(function(data) {
            return data.hash || (data.torrent && data.torrent.hash) || '';
        });
    }
    
    function getTorrentFiles(hash) {
        var attempts = 0;
        var MAX_ATTEMPTS = 30;
        var DELAY = 500;
        
        return new Promise(function(resolve, reject) {
            function check() {
                attempts++;
                tsRequest({ action: 'get', hash: hash })
                .then(function(data) {
                    var files = extractFiles(data);
                    if (files) {
                        resolve(files);
                        return;
                    }
                    if (attempts >= MAX_ATTEMPTS) {
                        resolve([]);
                        return;
                    }
                    setTimeout(check, DELAY);
                })
                .catch(function(err) {
                    if (attempts >= MAX_ATTEMPTS) {
                        reject(err);
                        return;
                    }
                    setTimeout(check, DELAY);
                });
            }
            
            function extractFiles(data) {
                var raw = data && (data.file_stats || data.files || 
                    (data.torrent && data.torrent.file_stats) || []);
                if (!raw.length) return null;
                
                return raw.map(function(file, index) {
                    return {
                        path: file.path || file.name || ('file_' + index),
                        length: file.length || file.size || 0,
                        id: file.id != null ? file.id : index
                    };
                });
            }
            
            check();
        });
    }
    
    function getStreamUrl(hash, fileName, fileId) {
        var name = encodeURIComponent(fileName.split('/').pop().split('\\').pop());
        return CONFIG.torrserver_url.replace(/\/+$/, '') + '/stream/' + name +
            '?link=' + hash + '&index=' + fileId + '&play';
    }
    
    // === Диалог выбора раздачи ===
    function showTorrentPicker(card) {
        var title = card.title || card.name || '';
        if (!title && !(card.original_title || card.original_name)) {
            Lampa.Noty.show('Нет названия для поиска');
            return;
        }
        
        Lampa.Loading.start(function() {});
        
        searchTorrents(card)
        .then(function(torrents) {
            Lampa.Loading.stop();
            
            if (!torrents.length) {
                Lampa.Noty.show('Раздачи не найдены');
                return;
            }
            
            torrents.sort(function(a, b) {
                if (b.seeders !== a.seeders) return b.seeders - a.seeders;
                return (b.quality || 0) - (a.quality || 0);
            });
            
            var items = torrents.slice(0, 30).map(function(t) {
                var parts = [];
                var quality = getQualityLabel(t.quality);
                if (quality) parts.push(quality);
                parts.push(t.sizeText || humanBytes(t.sizeBytes));
                parts.push('S:' + t.seeders);
                if (t.tracker) parts.push(t.tracker);
                
                return {
                    title: t.title,
                    subtitle: parts.join(' • '),
                    _torrent: t
                };
            });
            
            Lampa.Select.show({
                title: 'Выберите раздачу — ' + title,
                items: items,
                onSelect: function(item) {
                    startDownload(item._torrent, card);
                },
                onBack: function() {
                    Lampa.Controller.toggle('content');
                }
            });
        })
        .catch(function(err) {
            Lampa.Loading.stop();
            Lampa.Noty.show('Ошибка поиска: ' + (err.message || err));
        });
    }
    
    // === Запуск загрузки ===
    function startDownload(torrent, card) {
        var title = card.title || card.name || torrent.title;
        var poster = card.img || card.poster_path || '';
        if (poster && poster.charAt(0) === '/') {
            poster = 'https://image.tmdb.org/t/p/w500' + poster;
        }
        
        Lampa.Loading.start(function() {});
        
        addTorrent(torrent.magnet, torrent.title, poster)
        .then(function(hash) {
            if (!hash) throw new Error('TorrServer не вернул hash');
            return getTorrentFiles(hash).then(function(files) {
                return { hash: hash, files: files };
            });
        })
        .then(function(result) {
            Lampa.Loading.stop();
            
            var videos = result.files.filter(function(f) {
                return /\.(mkv|mp4|avi|webm|m4v|ts|mov|flv)$/i.test(f.path);
            });
            
            if (!videos.length) {
                Lampa.Noty.show('В раздаче нет видеофайлов');
                return;
            }
            
            function startFile(file) {
                var url = getStreamUrl(result.hash, file.path, file.id);
                var id = AndroidJS.downloadStart(JSON.stringify({
                    url: url,
                    title: title + (videos.length > 1 ? ' — ' + file.path.split('/').pop() : ''),
                    poster: poster,
                    headers: { Authorization: getAuthHeader() }
                }));
                
                if (id) {
                    Lampa.Noty.show('Загрузка запущена!');
                    ensureMenuButton();
                    try { Lampa.Activity.backward(); } catch(e) {}
                } else {
                    Lampa.Noty.show('Не удалось запустить загрузку');
                }
            }
            
            if (videos.length === 1) {
                startFile(videos[0]);
                return;
            }
            
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
                    Lampa.Controller.toggle('content');
                }
            });
        })
        .catch(function(err) {
            Lampa.Loading.stop();
            Lampa.Noty.show('Ошибка: ' + (err.message || err));
        });
    }
    
    // === Внедрение кнопки в карточку ===
    function injectDownloadButton(activity) {
        console.log('[Download] injectDownloadButton called');
        
        try {
            var $render = activity.activity && activity.activity.render && activity.activity.render();
            if (!$render) {
                console.log('[Download] No render');
                return;
            }
            
            console.log('[Download] Render found');
            
            // Ищем контейнер кнопок
            var selectors = [
                '.full-start-new__buttons',
                '.full-start__buttons',
                '.full-start__button-container',
                '.buttons--container',
                '.full-start__buttons-container',
                '.full-start-new__buttons-container',
                '.full-start__button-block'
            ];
            
            var $buttons = null;
            for (var i = 0; i < selectors.length; i++) {
                var $found = $render.find(selectors[i]).first();
                if ($found.length) {
                    $buttons = $found;
                    console.log('[Download] Found buttons with selector:', selectors[i]);
                    break;
                }
            }
            
            if (!$buttons || !$buttons.length) {
                // Fallback - ищем родителя кнопок
                var $btn = $render.find('.full-start__button').first();
                if ($btn.length) {
                    $buttons = $btn.parent();
                    console.log('[Download] Found buttons via fallback');
                }
            }
            
            if (!$buttons || !$buttons.length) {
                console.log('[Download] No buttons container found');
                // Выводим часть HTML для отладки
                var html = $render[0] && $render[0].outerHTML || '';
                console.log('[Download] Render HTML preview:', html.substring(0, 300));
                return;
            }
            
            if ($buttons.find('.lampa-download-btn').length) {
                console.log('[Download] Button already exists');
                return;
            }
            
            var card = (activity.movie || activity.card) || {};
            console.log('[Download] Card:', card.title || card.name || 'No title');
            
            var $newBtn = $(
                '<div class="full-start__button selector lampa-download-btn">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg>' +
                '<span>Скачать</span>' +
                '</div>'
            );
            
            $newBtn.on('hover:enter', function() {
                console.log('[Download] Button clicked');
                showTorrentPicker(card);
            });
            
            $buttons.append($newBtn);
            console.log('[Download] Button injected successfully');
            
        } catch(e) {
            console.log('[Download] Error injecting button:', e);
        }
    }
    
    // === Следим за карточкой ===
    // Способ 1: Событие full
    Lampa.Listener.follow('full', function(e) {
        console.log('[Download] full event:', e && e.type);
        if (e && (e.type === 'complite' || e.type === 'build' || e.type === 'complete')) {
            setTimeout(function() {
                injectDownloadButton(e.object || e);
            }, 300);
        }
    });
    
    // Способ 2: Событие activity
    Lampa.Listener.follow('activity', function(e) {
        if (e && e.type === 'start') {
            var act = e.object || e;
            if (act && act.component === 'full') {
                console.log('[Download] activity start for full component');
                setTimeout(function() {
                    injectDownloadButton(act);
                }, 500);
            }
        }
    });
    
    // Способ 3: Принудительная проверка
    setInterval(function() {
        try {
            var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
            if (act && act.component === 'full') {
                injectDownloadButton(act);
            }
        } catch(e) {}
    }, 3000);
    
    // Способ 4: После загрузки приложения
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            console.log('[Download] App ready');
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
    
    // === Пункт меню "Загрузки" ===
    function ensureMenuButton() {
        try {
            var items = [];
            try {
                var raw = AndroidJS.downloadList();
                items = raw ? JSON.parse(raw) : [];
            } catch(e) {}
            
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
                Lampa.Activity.push({
                    url: '',
                    title: 'Загрузки',
                    component: 'lampa_downloads',
                    page: 1
                });
            });
            
            $menu.append($item);
            try { Lampa.Controller.collectionSet('menu'); } catch(e) {}
            
        } catch(e) {}
    }
    
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            setTimeout(ensureMenuButton, 500);
        }
    });
    
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
            var items = [];
            try {
                var raw = AndroidJS.downloadList();
                items = raw ? JSON.parse(raw) : [];
            } catch(e) {}
            
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
                        Lampa.Player.play({
                            url: 'file://' + item.localPath,
                            title: item.title || '',
                            quality: {}
                        });
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
                    Lampa.Controller.toggle('content');
                }
            });
        }
        
        this.create = function() { return $html; };
        this.start = function() {
            render();
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render());
                    if (cards.length) {
                        try { Navigator.focus(cards[0]); } catch(e) {}
                    }
                },
                back: function() { Lampa.Activity.backward(); },
                left: function() {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else { try { Lampa.Controller.toggle('menu'); } catch(e) {} }
                },
                right: function() {
                    if (Navigator.canmove('right')) Navigator.move('right');
                },
                up: function() {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else { try { Lampa.Controller.toggle('head'); } catch(e) {} }
                },
                down: function() {
                    if (Navigator.canmove('down')) Navigator.move('down');
                }
            });
            Lampa.Controller.toggle('content');
            
            self._timer = setInterval(function() {
                try {
                    var raw = AndroidJS.downloadList();
                    var items = raw ? JSON.parse(raw) : [];
                    if (items.some(function(x) {
                        return x.status === 'downloading' || x.status === 'queued';
                    })) {
                        render();
                    }
                } catch(e) {}
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
        Lampa.Component.add('lampa_downloads', DownloadsComponent);
        console.log('[Download] Component registered');
    } catch(e) {
        console.log('[Download] Component registration failed:', e);
    }
    
    // Периодическая проверка меню
    setInterval(ensureMenuButton, 2000);
    
    console.log('[Download] Plugin loaded successfully!');
    
})();
