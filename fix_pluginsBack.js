// ============================================
// fix_pluginsBack.js - Минимальное исправление для Tizen
// ============================================
(function() {
    console.log('[Fix] Загрузка...');

    // 1. Исправляем ошибку window..txt
    if (window.lampa_settings) {
        if (!window.lampa_settings.disable_features) {
            window.lampa_settings.disable_features = {};
        }
    } else {
        window.lampa_settings = {
            disable_features: {}
        };
    }

    // 2. Сохраняем оригинальный метод
    var originalSetItem = Storage.prototype.setItem;

    // 3. Перехватываем setItem
    Storage.prototype.setItem = function(key, value) {
        if (key === 'pluginsBack') {
            // Проверяем размер (5 МБ)
            var size = String(value).length;
            
            // Если слишком большой - очищаем
            if (size > 5000000) {
                console.log('[Fix] Очистка pluginsBack (' + size + ' байт)');
                try {
                    this.removeItem('pluginsBack');
                } catch(e) {}
                return;
            }
            
            // Сжимаем до 100 записей
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
                this.removeItem('pluginsBack');
                this.removeItem('plugins');
            }
        }
    };

    // 4. Очистка при старте (5 МБ)
    try {
        var data = localStorage.getItem('pluginsBack');
        if (data && data.length > 5000000) {
            localStorage.removeItem('pluginsBack');
        }
    } catch(e) {}

    console.log('[Fix] Готово');
})();
