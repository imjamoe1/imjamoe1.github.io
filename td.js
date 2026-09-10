(function () {
    'use strict';

    var PLUGIN = 'lampa_universal_download';
    var STORAGE_KEY = PLUGIN + '_items';
    var MAX_ITEMS = 100;

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
        return safeJson(localStorage.getItem(STORAGE_KEY) || '[]', []);
    }

    function setItems(items) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS))); } catch (_) {}
    }

    function addItem(source, status) {
        var item = {
            id: nowId(),
            title: source.title || 'Видео',
            url: source.url,
            poster: source.poster || '',
            status: status || 'started',
            createdAt: Date.now()
        };
        var items = getItems();
        items.unshift(item);
        setItems(items);
        return item;
    }

    function deleteItem(id) {
        setItems(getItems().filter(function (item) { return item.id !== id; }));
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

    function browserDownload(source) {
        var link = document.createElement('a');
        link.href = source.url;
        link.download = safeFileName(source.fileName || source.title);
        link.rel = 'noopener';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(function () { link.remove(); }, 0);
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
                addItem(source, 'downloading');
                notify('Загрузка началась');
                return;
            }

            if (tizenAvailable()) {
                startTizenDownload(source);
                addItem(source, 'downloading');
                notify('Загрузка началась');
                return;
            }

            browserDownload(source);
            addItem(source, 'sent-to-browser');
            notify('Ссылка передана в загрузчик устройства');
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

    function cardSources(card) {
        var raw = card.downloads || card.download_urls || card.downloadUrl || card.download_url || [];
        if (!Array.isArray(raw)) raw = [raw];
        return raw.map(function (source) { return normalizeSource(source, card); }).filter(Boolean);
    }

    function resolveSources(card) {
        var sources = cardSources(card);
        if (sources.length) return Promise.resolve(sources);

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

    function sourcePicker(card) {
        Lampa.Loading.start(function () {});
        resolveSources(card).then(function (sources) {
            Lampa.Loading.stop();
            if (!sources.length) {
                notify('Для этого фильма нет доступной ссылки для загрузки');
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
            '<span class="full-start__icon">&#8659;</span><span>Скачать</span></div>');
        function open() { sourcePicker(card); }
        button.on('hover:enter click', open);
        buttons.append(button);
    }

    function ensureMenu() {
        var menu = $('.menu .menu__list').first();
        if (!menu.length || menu.find('.universal-download-menu').length) return;
        var item = $('<li class="menu__item selector universal-download-menu">' +
            '<div class="menu__ico">&#8659;</div><div class="menu__text">Загрузки</div></li>');
        item.on('hover:enter click', function () {
            Lampa.Activity.push({ url: '', title: 'Загрузки', component: PLUGIN, page: 1 });
        });
        menu.append(item);
    }

    function DownloadsComponent() {
        var self = this;
        var body = $('<div class="content__body" style="padding:1.5em"></div>');
        var html = $('<div class="scroll"><div class="scroll__body"></div></div>');
        html.find('.scroll__body').append(body);

        function render() {
            var items = getItems();
            body.empty();
            if (!items.length) {
                body.append('<div style="opacity:.7">Список загрузок пуст.</div>');
                return;
            }
            items.forEach(function (entry) {
                var row = $('<div class="selector" style="display:flex;align-items:center;gap:1em;padding:.75em 0;border-bottom:1px solid rgba(255,255,255,.12)">' +
                    (entry.poster ? '<img src="' + escapeHtml(entry.poster) + '" style="width:3em;height:4.5em;object-fit:cover">' : '') +
                    '<div style="min-width:0;flex:1"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(entry.title) + '</div>' +
                    '<div style="opacity:.65;font-size:.85em">' + escapeHtml(entry.status) + '</div></div></div>');
                row.on('hover:enter click', function () {
                    Lampa.Select.show({
                        title: entry.title,
                        items: [
                            { title: 'Открыть ссылку', action: 'open' },
                            { title: 'Удалить из списка', action: 'delete' }
                        ],
                        onSelect: function (choice) {
                            if (choice.action === 'open') openInBrowser(entry);
                            if (choice.action === 'delete') { deleteItem(entry.id); render(); }
                        },
                        onBack: function () { Lampa.Controller.toggle('content'); }
                    });
                });
                body.append(row);
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
        };
        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };
        this.destroy = function () { self = null; html.remove(); };
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

    window.LampaUniversalDownloads = {
        start: startDownload,
        list: getItems,
        remove: deleteItem,
        resolve: resolveSources
    };
})();
