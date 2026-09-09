(function() {
    'use strict';

    function startPlugin() {
        if (window.fix_pluginsBack_loaded) {
            return;
        }
        window.fix_pluginsBack_loaded = true;

        // Исправляем ошибку window..txt
        if (window.lampa_settings) {
            if (!window.lampa_settings.disable_features) {
                window.lampa_settings.disable_features = {};
            }
        } else {
            window.lampa_settings = {
                disable_features: {}
            };
        }

        // Сохраняем оригинальный метод
        var originalSetItem = Storage.prototype.setItem;

        // Перехватываем setItem
        Storage.prototype.setItem = function(key, value) {
            if (key === 'pluginsBack') {
                var size = String(value).length;
                
                if (size > 5000000) {
                    console.log('[Fix] Очистка pluginsBack (' + size + ' байт)');
                    try {
                        this.removeItem('pluginsBack');
                    } catch(e) {}
                    return;
                }
                
                try {
                    var parsed = JSON.parse(value);
                    if (Array.isArray(parsed) && parsed.length > 100) {
                        parsed = parsed.slice(-100);
                        value = JSON.stringify(parsed);
                    }
                } catch(e) {}
            }
            
            try {
                return originalSetItem.call(this, key, value);
            } catch(e) {
                if (e.name === 'QuotaExceededError') {
                    console.log('[Fix] Ошибка квоты, очищаем pluginsBack');
                    this.removeItem('pluginsBack');
                    this.removeItem('plugins');
                }
            }
        };

        try {
            var data = localStorage.getItem('pluginsBack');
            if (data && data.length > 5000000) {
                console.log('[Fix] Очистка большого pluginsBack при старте');
                localStorage.removeItem('pluginsBack');
            }
        } catch(e) {}
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function(event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }
})();
