(function () {
    "use strict";
    function initPlugin() {
        if (!window.Lampa) return;
        
        // Регистрируем наш плеер внутри каталога Lampa
        Lampa.Player.listener.follow('open', function (e) {
            if (e.player === 'torrentplayer_wgt') {
                var streamUrl = e.url;
                console.log('[Lampa Plugin] Opening stream in TorrentPlayer:', streamUrl);
                
                // Передаем ссылку напрямую в глобальное ядро нашего плеера
                if (window.TorrentApp && typeof window.TorrentApp.playUrl === 'function') {
                    Lampa.Player.close(); // Закрываем стандартный плеер Lampa
                    window.TorrentApp.playUrl(streamUrl);
                } else {
                    Lampa.Noty.show('TorrentPlayer не найден или еще не загружен!');
                }
            }
        });

        // Добавляем TorrentPlayer в список доступных плееров Lampa
        Lampa.Player.add('torrentplayer_wgt', {
            name: 'TorrentPlayer (WGT)',
            description: 'Внешний плеер для нативного воспроизведения TorServe'
        });
    }

    if (window.Lampa) initPlugin();
    else {
        var timer = setInterval(function () {
            if (window.Lampa) { clearInterval(timer); initPlugin(); }
        }, 200);
    }
})();
