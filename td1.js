/**
 * Lampa BS — плагин загрузок фильмов.
 *
 * Что делает:
 *  1. Кнопка «⬇ Скачать» в карточке фильма/сериала (component: full).
 *  2. Поиск раздачи через JacRed/Jackett.
 *  3. Добавление магнета в TorrServer.
 *  4. Выбор видеофайла, если в раздаче их несколько.
 *  5. Скачивание с докачкой через Range.
 *  6. Экран «Загрузки» в левом меню Lampa.
 *  7. ПРОСМОТР ВО ВРЕМЯ ЗАГРУЗКИ — играем поток TorrServer.
 *  8. ПРОСМОТР ПОСЛЕ ЗАГРУЗКИ — файл открывается локально.
 *
 * Настройки TorrServer и JacRed берутся ИЗ САМОЙ LAMPA — те же ключи,
 * что использует её меню «Настройки → TorrServer» и «Настройки → Парсер»:
 *   torrserver_url, torrserver_login, torrserver_password,
 *   torrserver_auth, jackett_url, jackett_key.
 *
 * Пункта настроек у плагина НЕТ — всё читается из Lampa автоматически.
 */

(function () {
'use strict';

if (typeof Lampa === 'undefined') {
    console.log('[LampaBS downloads] нет Lampa — плагин не запущен');
    return;
}

// =====================================================================
// === Конфигурация: всё из Lampa ======================================
// =====================================================================

/** Пустое ли значение. Ловим и 'null'/'undefined' строкой. */
function isBlank(v) {
    return v === null || v === undefined || v === '' ||
        v === 'null' || v === 'undefined';
}

/** Достроить http://, если в настройках написали «jac.red» без схемы. */
function httpUrl(u) {
    if (!u) return '';
    u = String(u).trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    return 'http://' + u;
}

/** Значение из настроек Lampa. */
function lampaOpt(key) {
    try {
        var v = Lampa.Storage.get(key, '');
        return isBlank(v) ? '' : v;
    } catch (e) { return ''; }
}

/** Адрес TorrServer — из настроек Lampa. */
function torrServerUrl() {
    var url = httpUrl(lampaOpt('torrserver_url'));
    if (!url) return '';
    return url.replace(/\/+$/, '');
}

/** Адрес JacRed — из настроек Lampa. */
function jackettUrl() {
    var url = httpUrl(lampaOpt('jackett_url'));
    if (!url) return '';
    return url.replace(/\/+$/, '');
}

/** Заголовок Basic-Auth для TorrServer, если в Lampa включена авторизация. */
function tsAuthHeader() {
    var auth = lampaOpt('torrserver_auth');
    var login = String(lampaOpt('torrserver_login') || '');
    var pass = String(lampaOpt('torrserver_password') || '');
    var needAuth = (auth === true || auth === 'true' || auth === 1 || auth === '1');
    if (!needAuth || (!login && !pass)) return {};
    try { return { Authorization: 'Basic ' + btoa(login + ':' + pass) }; }
    catch (e) { return {}; }
}

/** Заголовки для POST-запросов к TorrServer. */
function tsHeaders() {
    var h = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };
    var auth = tsAuthHeader();
    if (auth.Authorization) h.Authorization = auth.Authorization;
    return h;
}

// =====================================================================
// === Мост: Electron или браузер ======================================
// =====================================================================

var HAS_BRIDGE = (typeof AndroidJS !== 'undefined' &&
    typeof AndroidJS.downloadStart === 'function');

// =====================================================================
// === TorrServer ======================================================
// =====================================================================

function tsBase() { return torrServerUrl(); }

function tsCall(payload) {
    var base = tsBase();
    if (!base) return Promise.reject(new Error('TorrServer не настроен'));
    return fetch(base + '/torrents', {
        method: 'POST',
        headers: tsHeaders(),
        body: JSON.stringify(payload),
    }).then(function (r) {
        if (!r.ok) throw new Error('TorrServer HTTP ' + r.status);
        return r.json();
    });
}

function tsAdd(magnet, title, poster) {
    return tsCall({
        action: 'add',
        link: magnet,
        title: title || '',
        poster: poster || '',
        save_to_db: false,
    }).then(function (j) {
        return j.hash || (j.torrent && j.torrent.hash) || '';
    });
}

/** Файлы раздачи. Ждём до 15 сек, пока file_stats заполнится. */
function tsFiles(hash) {
    var attempts = 0, MAX = 30, DELAY = 500;
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
            tsCall({ action: 'get', hash: hash }).then(function (j) {
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

function tsPlayUrl(hash, fileName, fileId) {
    var base = tsBase();
    if (!base) return '';
    var name = encodeURIComponent(fileName.split('/').pop().split('\\').pop());
    return base + '/stream/' + name +
        '?link=' + hash + '&index=' + fileId + '&play';
}

// =====================================================================
// === JacRed ==========================================================
// =====================================================================

function jackettSearch(card) {
    var base = jackettUrl();
    if (!base) return Promise.reject(new Error('Парсер раздач не настроен в Lampa'));

    var titleRu = card.title || card.name || '';
    var titleEn = card.original_title || card.original_name || titleRu;
    var year = ((card.release_date || card.first_air_date || '').slice(0, 4)) || '';
    var isSerial = (card.number_of_seasons || card.first_air_date) ? 1 : 0;
    var genres = (card.genres || []).map(function (g) { return g.name || g; }).join(',');
    var query = (titleEn + ' ' + titleRu).trim();
    var category = isSerial ? '5000' : '2000';
    var key = lampaOpt('jackett_key') || '';
    var url = base + '/api/v2.0/indexers/all/results?apikey=' +
        encodeURIComponent(key) +
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
        if (!r.ok) throw new Error('JacRed HTTP ' + r.status);
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
            });
        }
        return out;
    });
}

// =====================================================================
// === Хранилище загрузок ==============================================
// =====================================================================

var STATUS = {
    QUEUED: 'queued',
    DOWNLOADING: 'downloading',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
};

function listAll() {
    if (HAS_BRIDGE) {
        try {
            var raw = AndroidJS.downloadList();
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }
    try {
        var raw2 = Lampa.Storage.get('lampabs_dl_index', '[]');
        return Array.isArray(raw2) ? raw2 : JSON.parse(raw2 || '[]');
    } catch (e) { return []; }
}

function writeAll(list) {
    if (HAS_BRIDGE) return;
    try { Lampa.Storage.set('lampabs_dl_index', list); } catch (e) {}
    emitChanged(list);
}

function upsert(entry) {
    if (HAS_BRIDGE) return entry;
    var all = listAll();
    var i = all.findIndex(function (e) { return e.id === entry.id; });
    if (i >= 0) all[i] = entry; else all.push(entry);
    writeAll(all);
    return entry;
}

function patchEntry(id, patch) {
    if (HAS_BRIDGE) return null;
    var all = listAll();
    var i = all.findIndex(function (e) { return e.id === id; });
    if (i < 0) return null;
    all[i] = Object.assign({}, all[i], patch);
    writeAll(all);
    return all[i];
}

function removeEntry(id) {
    if (HAS_BRIDGE) return;
    writeAll(listAll().filter(function (e) { return e.id !== id; }));
}

function getEntry(id) {
    return listAll().find(function (e) { return e.id === id; }) || null;
}

// =====================================================================
// === Скачивание в браузере ==========================================
// =====================================================================

var activeDownloads = {};

function newId() {
    return 'dl' + Date.now().toString(36) +
        Math.random().toString(36).slice(2, 7);
}

function pickSaveMode() {
    if (typeof window.showSaveFilePicker === 'function') return 'fs';
    return 'blob';
}

function safeFileName(entry, ext) {
    var name = (entry.title || 'video').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
    if (!/\.[a-z0-9]{2,5}$/i.test(name)) name += (ext || '.mkv');
    return name;
}

function startBrowserDownload(entry) {
    var mode = pickSaveMode();
    var state = {
        xhr: null, cancelled: false, mode: mode,
        fileHandle: null, writer: null, received: 0, total: 0,
    };
    activeDownloads[entry.id] = state;

    var start = function () { doFetch(entry, state); };

    if (mode === 'fs' && typeof window.showSaveFilePicker === 'function') {
        window.showSaveFilePicker({ suggestedName: safeFileName(entry, '.mkv') })
            .then(function (handle) {
                state.fileHandle = handle;
                return handle.createWritable();
            })
            .then(function (writer) {
                state.writer = writer;
                start();
            })
            .catch(function () {
                state.mode = 'blob';
                state.fileHandle = null;
                state.writer = null;
                start();
            });
    } else {
        start();
    }
}

function doFetch(entry, state) {
    var xhr = new XMLHttpRequest();
    state.xhr = xhr;
    xhr.open('GET', entry.url, true);
    xhr.responseType = 'arraybuffer';

    try {
        var h = entry.headers;
        if (h && typeof h === 'string') h = JSON.parse(h);
        if (h && typeof h === 'object') {
            for (var k in h) if (h.hasOwnProperty(k)) {
                try { xhr.setRequestHeader(k, h[k]); } catch (e) {}
            }
        }
    } catch (e) {}

    try {
        var auth = tsAuthHeader();
        if (auth.Authorization && !entry.headers) {
            try { xhr.setRequestHeader('Authorization', auth.Authorization); }
            catch (e) {}
        }
    } catch (e) {}

    var lastReport = 0;
    xhr.onprogress = function (e) {
        var now = Date.now();
        state.received = e.loaded;
        state.total = e.lengthComputable ? e.total : state.total;
        if (now - lastReport < 400) return;
        lastReport = now;
        var percent = state.total > 0
            ? Math.min(100, Math.floor(e.loaded * 100 / state.total))
            : 0;
        patchEntry(entry.id, {
            status: STATUS.DOWNLOADING,
            downloadedBytes: e.loaded,
            sizeBytes: state.total || 0,
            percent: percent,
        });
    };

    xhr.onload = function () {
        if (state.cancelled) return;
        if (xhr.status !== 200 && xhr.status !== 206) {
            patchEntry(entry.id, {
                status: STATUS.FAILED,
                errorReason: 'HTTP ' + xhr.status,
            });
            return;
        }
        finishBrowserDownload(entry, state, xhr.response);
    };

    xhr.onerror = function () {
        if (state.cancelled) return;
        patchEntry(entry.id, {
            status: STATUS.FAILED,
            errorReason: 'Сеть оборвалась',
        });
    };

    xhr.onabort = function () {
        if (state.cancelled) {
            patchEntry(entry.id, { status: STATUS.PAUSED });
        }
    };

    xhr.send();
}

function finishBrowserDownload(entry, state, buffer) {
    var done = function (localPath) {
        patchEntry(entry.id, {
            status: STATUS.COMPLETED,
            downloadedBytes: buffer.byteLength,
            sizeBytes: buffer.byteLength,
            percent: 100,
            localPath: localPath || '',
        });
        delete activeDownloads[entry.id];
    };

    if (state.mode === 'fs' && state.writer) {
        state.writer.write(new Uint8Array(buffer))
            .then(function () { return state.writer.close(); })
            .then(function () {
                done('fs:' + (state.fileHandle && state.fileHandle.name || ''));
            })
            .catch(function (e) {
                patchEntry(entry.id, {
                    status: STATUS.FAILED,
                    errorReason: 'Запись: ' + (e.message || e),
                });
            });
        return;
    }

    var blob = new Blob([buffer], { type: 'video/*' });
    var url = URL.createObjectURL(blob);
    done('blob:' + url);
}

function browserCancel(id) {
    var st = activeDownloads[id];
    if (!st) return false;
    st.cancelled = true;
    try { if (st.xhr) st.xhr.abort(); } catch (e) {}
    return true;
}

function browserResume(id) {
    var entry = getEntry(id);
    if (!entry) return false;
    if (activeDownloads[id]) return true;
    patchEntry(id, { status: STATUS.QUEUED, errorReason: '' });
    startBrowserDownload(entry);
    return true;
}

// =====================================================================
// === Единый API загрузок =============================================
// =====================================================================

function startDownload(payload) {
    var id = newId();
    var entry = {
        id: id,
        url: payload.url,
        providerId: payload.providerId || '',
        title: payload.title || '',
        poster: payload.poster || '',
        headers: payload.headers || null,
        addedAt: Date.now(),
        sizeBytes: 0,
        downloadedBytes: 0,
        percent: 0,
        status: STATUS.QUEUED,
        localPath: '',
        errorReason: '',
    };

    if (HAS_BRIDGE) {
        var nativeId = AndroidJS.downloadStart(JSON.stringify({
            url: entry.url,
            providerId: entry.providerId,
            title: entry.title,
            poster: entry.poster,
            headers: entry.headers,
        }));
        return nativeId || '';
    }

    upsert(entry);
    startBrowserDownload(entry);
    return id;
}

function cancelDownload(id) {
    if (HAS_BRIDGE) { AndroidJS.downloadCancel(id); return; }
    browserCancel(id);
}

function resumeDownload(id) {
    if (HAS_BRIDGE) { AndroidJS.downloadResume(id); return; }
    browserResume(id);
}

function deleteDownload(id) {
    if (HAS_BRIDGE) { AndroidJS.downloadDelete(id); return; }
    var st = activeDownloads[id];
    if (st) {
        st.cancelled = true;
        try { st.xhr.abort(); } catch (e) {}
        delete activeDownloads[id];
    }
    var e = getEntry(id);
    if (e && e.localPath && e.localPath.indexOf('blob:') === 0) {
        try { URL.revokeObjectURL(e.localPath.slice(5)); } catch (err) {}
    }
    removeEntry(id);
}

// =====================================================================
// === Шина изменений ==================================================
// =====================================================================

var listeners = [];
function emitChanged(list) {
    listeners.forEach(function (fn) {
        try { fn(list); } catch (e) {}
    });
}
function onChanged(fn) { listeners.push(fn); }

if (HAS_BRIDGE) {
    window.__lampabsDownloadsChanged = function (list) {
        emitChanged(list || []);
    };
    setInterval(function () { emitChanged(listAll()); }, 2000);
}

// =====================================================================
// === Утилиты =========================================================
// =====================================================================

function humanBytes(n) {
    if (!n || n <= 0) return '—';
    var u = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']; var i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return n.toFixed(n < 10 ? 1 : 0) + ' ' + u[i];
}

function qualityLabel(q) {
    if (q >= 2160) return '4K';
    if (q >= 1080) return '1080p';
    if (q >= 720) return '720p';
    if (q >= 480) return '480p';
    return '';
}

// =====================================================================
// === UI: кнопка «Скачать» ===========================================
// =====================================================================

function injectDownloadButton(activity) {
    var $render = activity.activity && activity.activity.render &&
        activity.activity.render();
    if (!$render) return;

    var $buttons = $render.find(
        '.full-start-new__buttons, .full-start__buttons, ' +
        '.full-start__button-container, .buttons--container'
    ).first();
    if (!$buttons.length) return;
    if ($buttons.find('.lampabs-download').length) return;

    var card = (activity.movie || activity.card) || {};
    var providerId = (card.first_air_date || card.number_of_seasons
        ? 'tv:' : 'movie:') + (card.id || card.card_id || '');

    var $btn = $('<div class="full-start__button selector lampabs-download">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg><span>Скачать</span></div>');
    $btn.on('hover:enter', function () { openTorrentPicker(card, providerId); });
    $buttons.append($btn);
}

// =====================================================================
// === UI: выбор раздачи ==============================================
// =====================================================================

function openTorrentPicker(card, providerId) {
    var title = card.title || card.name || '';
    if (!title && !(card.original_title || card.original_name)) {
        Lampa.Noty.show('Нет названия для поиска');
        return;
    }
    if (!jackettUrl()) {
        Lampa.Noty.show('Парсер раздач не настроен. Задайте адрес JacRed ' +
            'в Настройках Lampa → Парсер.');
        return;
    }
    Lampa.Loading.start(function () {});
    jackettSearch(card).then(function (list) {
        Lampa.Loading.stop();
        if (!list.length) {
            Lampa.Noty.show('Раздачи не найдены');
            return;
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
                if (r.voices && r.voices.length)
                    parts.push(r.voices.slice(0, 2).join(', '));
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
    if (!torrServerUrl()) {
        Lampa.Noty.show('TorrServer не настроен. Задайте адрес в ' +
            'Настройках Lampa → TorrServer.');
        return;
    }
    var title = card.title || card.name || raw.title;
    var poster = card.img || card.poster_path || '';
    if (poster && poster.charAt(0) === '/') {
        poster = 'https://image.tmdb.org/t/p/w500' + poster;
    }
    Lampa.Loading.start(function () {});
    tsAdd(raw.magnet, raw.title, poster).then(function (hash) {
        if (!hash) throw new Error('TorrServer не вернул hash');
        return tsFiles(hash).then(function (files) {
            return { hash: hash, files: files };
        });
    }).then(function (res) {
        Lampa.Loading.stop();
        var videos = res.files.filter(function (f) {
            return /\.(mkv|mp4|avi|webm|m4v|ts|mov|flv)$/i.test(f.path);
        });
        if (!videos.length) {
            Lampa.Noty.show('В раздаче нет видеофайлов');
            return;
        }
        var start = function (file) {
            var url = tsPlayUrl(res.hash, file.path, file.id);
            if (!url) {
                Lampa.Noty.show('TorrServer не настроен');
                return;
            }
            var headers = tsAuthHeader();
            var id = startDownload({
                url: url,
                providerId: providerId,
                title: title + (videos.length > 1
                    ? ' — ' + file.path.split('/').pop() : ''),
                poster: poster,
                headers: headers,
            });
            if (id) {
                Lampa.Noty.show('Загрузка запущена. Смотри в «Загрузки».');
                setTimeout(ensureMenuItem, 300);
                try { Lampa.Activity.backward(); } catch (e) {}
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

// =====================================================================
// === UI: пункт «Загрузки» в меню ====================================
// =====================================================================

function ensureMenuItem() {
    try {
        if (!listAll().length) { $('.lampabs-menu-downloads').remove(); return; }
        var $menu = $('.menu .menu__list').first();
        if (!$menu.length) return;
        if ($menu.find('.lampabs-menu-downloads').length) return;
        var $item = $('<li class="menu__item selector lampabs-menu-downloads">' +
            '<div class="menu__ico">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" ' +
            'xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" ' +
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg></div>' +
            '<div class="menu__text">Загрузки</div></li>');
        $item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '', title: 'Загрузки',
                component: 'lampabs_downloads', page: 1,
            });
        });
        $menu.append($item);
        try { Lampa.Controller.collectionSet('menu'); } catch (e) {}
    } catch (e) {}
}

Lampa.Listener.follow('app', function (e) {
    if (e.type === 'ready') setTimeout(ensureMenuItem, 500);
});

// =====================================================================
// === UI: экран «Загрузки» ==========================================
// =====================================================================

function DownloadsComponent() {
    var scroll = new Lampa.Scroll({ mask: true, over: true });
    var $body = $(
        '<div class="lampabs-downloads" style="padding:1.5em">' +
        '<div class="lampabs-downloads__list" ' +
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
            $html.find('.scroll__content').css({ 'max-height': maxH + 'px' });
        } catch (e) {}
    }
    applyPhoneScroll();
    $(window).on('resize.lampabsDownloads', applyPhoneScroll);

    function statusText(it) {
        if (it.status === 'completed') return humanBytes(it.sizeBytes);
        if (it.status === 'failed') return 'Ошибка';
        if (it.status === 'paused') return 'Пауза';
        return (it.percent || 0) + '%';
    }

    function render() {
        var items = listAll();
        var $list = $body.find('.lampabs-downloads__list').empty();
        if (!items.length) {
            $list.append(
                '<div style="padding:2em;opacity:.7">Пока ничего не скачано.</div>');
            activeCards = [];
            return;
        }
        activeCards = items.map(function (it) {
            var poster = it.poster || './img/img_load.svg';
            var progress = it.status === 'completed' ? 100 : (it.percent || 0);
            var statusColor = it.status === 'failed' ? '#f44'
                : it.status === 'completed' ? '#4a4' : '#e50914';
            var $card = $(
                '<div class="card selector lampabs-download-card" ' +
                'style="width:14em">' +
                '<div class="card__view" ' +
                'style="position:relative;padding-bottom:150%">' +
                '<img class="card__img" src="' + poster + '" ' +
                'style="object-fit:cover">' +
                '<div class="card__status" ' +
                'style="position:absolute;top:.4em;right:.4em;' +
                'background:rgba(0,0,0,.75);color:#fff;font-size:.9em;' +
                'padding:.2em .5em;border-radius:.3em;z-index:1">' +
                statusText(it) + '</div>' +
                '<div class="card__progress" ' +
                'style="position:absolute;bottom:0;left:0;right:0;' +
                'height:5px;background:rgba(0,0,0,.5);' +
                'border-bottom-left-radius:1em;' +
                'border-bottom-right-radius:1em;overflow:hidden;z-index:1">' +
                '<div style="height:100%;width:' + progress + '%;' +
                'background:' + statusColor + ';transition:width .3s"></div>' +
                '</div>' +
                '</div>' +
                '<div class="card__title" ' +
                'style="margin-top:.4em;font-size:.95em;text-align:center;' +
                'white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
                (it.title || '(без названия)') + '</div>' +
                '</div>');
            $card.on('hover:focus', function (e) {
                scroll.update($(e.target), true);
            });
            $card.on('hover:enter', function () { onCardEnter(it); });
            $card.on('hover:long', function () { onCardLong(it); });
            $list.append($card);
            return $card[0];
        });
    }

    function playEntry(entry) {
        var url;
        if (entry.status === 'completed' && entry.localPath) {
            if (entry.localPath.indexOf('blob:') === 0) url = entry.localPath;
            else if (entry.localPath.indexOf('fs:') === 0) url = '';
            else url = 'file://' + entry.localPath;
        } else {
            url = entry.url;
        }
        if (!url) {
            Lampa.Noty.show('Файл ещё не готов к воспроизведению в браузере — ' +
                'подождите окончания загрузки');
            return;
        }
        var data = { url: url, title: entry.title || '', quality: {} };
        if (entry.headers) {
            try {
                var h = entry.headers;
                if (typeof h === 'string') h = JSON.parse(h);
                if (h && typeof h === 'object') data.headers = h;
            } catch (e) {}
        }
        if (!data.headers || !data.headers.Authorization) {
            var auth = tsAuthHeader();
            if (auth.Authorization) {
                data.headers = data.headers || {};
                data.headers.Authorization = auth.Authorization;
            }
        }
        try { Lampa.Player.play(data); }
        catch (e) { Lampa.Noty.show('Не удалось запустить плеер'); }
    }

    function onCardEnter(entry) { playEntry(entry); }

    function onCardLong(entry) {
        var items = [];
        var canPlay = entry.status === 'completed' ||
            entry.status === 'downloading' ||
            entry.status === 'queued' ||
            entry.status === 'paused';
        if (canPlay) items.push({ title: 'Смотреть', action: 'play' });
        if (entry.status === 'downloading' || entry.status === 'queued') {
            items.push({ title: 'Приостановить', action: 'pause' });
        }
        if (entry.status === 'paused' || entry.status === 'failed') {
            items.push({ title: 'Продолжить', action: 'resume' });
        }
        items.push({ title: 'Удалить', action: 'delete' });
        items.push({ title: 'Закрыть', action: 'close' });
        Lampa.Select.show({
            title: entry.title,
            items: items,
            onSelect: function (a) {
                if (a.action === 'delete') {
                    deleteDownload(entry.id);
                    render();
                } else if (a.action === 'pause') {
                    cancelDownload(entry.id);
                    setTimeout(render, 300);
                } else if (a.action === 'resume') {
                    resumeDownload(entry.id);
                    setTimeout(render, 300);
                } else if (a.action === 'play') {
                    playEntry(entry);
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
                if (first && window.Navigator &&
                    typeof Navigator.focus === 'function') {
                    try { Navigator.focus(first); } catch (e) {
                        Lampa.Controller.collectionFocus(
                            first || false, scroll.render());
                    }
                } else {
                    Lampa.Controller.collectionFocus(
                        first || false, scroll.render());
                }
            },
            back: function () { Lampa.Activity.backward(); },
            left: function () {
                if (Navigator.canmove('left')) Navigator.move('left');
                else { try { Lampa.Controller.toggle('menu'); } catch (e) {} }
            },
            right: function () {
                if (Navigator.canmove('right')) Navigator.move('right');
            },
            up: function () {
                if (Navigator.canmove('up')) Navigator.move('up');
                else { try { Lampa.Controller.toggle('head'); } catch (e) {} }
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
        try { $(window).off('resize.lampabsDownloads'); } catch (e) {}
        try { scroll.destroy(); } catch (e) {}
        $html.remove();
    };
}

try { Lampa.Component.add('lampabs_downloads', DownloadsComponent); }
catch (e) { console.log('[LampaBS downloads] component add failed', e); }

onChanged(function () {});

console.log('[LampaBS downloads] плагин загружен, мост:',
    HAS_BRIDGE ? 'да' : 'нет (браузер)');

})();