(function () {
    'use strict';

    if (window.vimu_iptv_plugin) return;
    window.vimu_iptv_plugin = true;

    var TAG = '[VimuIPTV]';

    function log() {
        try { console.log.apply(console, [TAG].concat([].slice.call(arguments))); } catch (e) {}
    }
    function error() {
        try { console.error.apply(console, [TAG].concat([].slice.call(arguments))); } catch (e) {}
    }

    function isAndroid() {
        return typeof AndroidJS !== 'undefined' ||
            typeof Android !== 'undefined' ||
            (Lampa.Platform && Lampa.Platform.is && Lampa.Platform.is('android'));
    }

    function buildPlaylistFromIptv(data) {
        var urls = [];
        var titles = [];
        var total = parseInt(data.total, 10) || 0;
        var startIndex = parseInt(data.position, 10) || 0;

        log('build: total=', total, 'position=', startIndex, 'has onGetChannel=', typeof data.onGetChannel);

        if (typeof data.onGetChannel === 'function' && total > 0) {
            for (var i = 0; i < total; i++) {
                try {
                    var ch = data.onGetChannel(i);
                    if (!ch) continue;
                    var u = String(ch.url || ch.stream || ch.link || '').trim();
                    if (!u) continue;
                    urls.push(u);
                    titles.push(String(ch.name || ch.title || ch.channel || ('Channel ' + (i + 1))).trim());
                } catch (e) {
                    error('onGetChannel(' + i + ')', e && (e.message || e));
                }
            }
        }

        if (!urls.length && data.playlist && data.playlist.length) {
            data.playlist.forEach(function (item) {
                var u = String((item && (item.url || item.stream)) || '').trim();
                if (!u) return;
                urls.push(u);
                titles.push(String((item && (item.name || item.title)) || 'Channel').trim());
            });
        }

        if (!urls.length && data.url) {
            urls.push(String(data.url).trim());
            titles.push(String(data.title || data.name || 'Channel').trim());
            startIndex = 0;
        }

        if (startIndex > 0 && startIndex < urls.length) {
            urls = urls.slice(startIndex).concat(urls.slice(0, startIndex));
            titles = titles.slice(startIndex).concat(titles.slice(0, startIndex));
            startIndex = 0;
        }

        log('built channels=', urls.length);
        return { urls: urls, titles: titles, index: startIndex };
    }

    function openPlayer(urls, titles, originalData) {
        if (!urls.length) {
            Lampa.Noty.show('Vimu: no URL');
            return false;
        }

        var playlist = urls.map(function (u, i) {
            return { url: u, title: titles[i] || ('Channel ' + (i + 1)) };
        });

        var payload = {
            title: titles[0] || 'IPTV',
            url: urls[0],
            playlist: playlist,
            iptv: true,
            tv: true
        };

        if (originalData && originalData.headers) payload.headers = originalData.headers;

        log('openPlayer N=', urls.length, 'first=', urls[0].substring(0, 70));

        try {
            if (Lampa.Android && typeof Lampa.Android.openPlayer === 'function') {
                Lampa.Android.openPlayer(urls[0], payload);
                Lampa.Noty.show('Vimu: ' + urls.length + ' channels');
                return true;
            }
            if (typeof AndroidJS !== 'undefined' && typeof AndroidJS.openPlayer === 'function') {
                AndroidJS.openPlayer(urls[0], JSON.stringify(payload));
                Lampa.Noty.show('Vimu: ' + urls.length + ' channels');
                return true;
            }
            if (typeof Android !== 'undefined' && typeof Android.openPlayer === 'function') {
                Android.openPlayer(urls[0], JSON.stringify(payload));
                Lampa.Noty.show('Vimu: ' + urls.length + ' channels');
                return true;
            }
            error('немає openPlayer bridge');
            Lampa.Noty.show('Vimu: no Android bridge');
        } catch (e) {
            error('openPlayer', e && (e.message || e), e);
            Lampa.Noty.show('Vimu error: ' + (e.message || e));
        }
        return false;
    }

    function launch(data) {
        if (!isAndroid() || !data) return false;
        var pl = buildPlaylistFromIptv(data);
        if (!pl.urls.length) return false;
        return openPlayer(pl.urls, pl.titles, data);
    }

    function init() {

        if (!Lampa.Player || typeof Lampa.Player.iptv !== 'function') {
            error('Player.iptv missing');
            Lampa.Noty.show('Vimu: Player.iptv not found');
            return;
        }

        var origIptv = Lampa.Player.iptv.bind(Lampa.Player);

        Lampa.Player.iptv = function (data) {
            log('Player.iptv', {
                url: data && data.url ? String(data.url).substring(0, 60) : null,
                position: data && data.position,
                total: data && data.total,
                hasGet: data && typeof data.onGetChannel
            });

            var p = Lampa.Storage.field('player_iptv') || Lampa.Storage.field('player') || '';
            log('player_iptv=', p);

            if (isAndroid() && (p === 'android' || p === 'external')) {
                if (launch(data)) {
                    log('open outside, internal iptv canceled');
                    return;
                }
                error('launch failed, fallback origIptv');
            }

            if (isAndroid() && data) {
                var pl = buildPlaylistFromIptv(data);
                if (pl.urls.length > 1) {
                    data.playlist = pl.urls.map(function (u, i) {
                        return { url: u, title: pl.titles[i] };
                    });
                    data.launch_player = 'android';
                    log('added data.playlist=', data.playlist.length);
                }
            }

            return origIptv(data);
        };

        if (Lampa.Player.listener) {
            Lampa.Player.listener.follow('create', function (e) {
                if (!e || !e.data) return;
                if (!(e.data.iptv || e.data.tv)) return;
                if (!isAndroid()) return;

                var p = Lampa.Storage.field('player_iptv') || '';
                if (p !== 'android' && p !== 'external') return;

                if (e.data.playlist && e.data.playlist.length > 1) return;

                if (launch(e.data)) {
                    if (typeof e.abort === 'function') e.abort();
                }
            });
        }
    }

    if (window.appready) init();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
