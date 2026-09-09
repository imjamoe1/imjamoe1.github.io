// ============================================
// fix_pluginsBack.js v2 - Исправление для Tizen
// ============================================
(function() {
    console.log('[Fix] Загрузка исправления pluginsBack для Tizen...');

    // 1. Исправляем ошибку window..txt
    if (window.lampa_settings) {
        if (window.lampa_settings.disable_features === undefined || 
            window.lampa_settings.disable_features === null) {
            window.lampa_settings.disable_features = {};
        }
    } else {
        window.lampa_settings = {
            disable_features: {}
        };
    }

    // 2. Сохраняем оригинальный метод
    var originalSetItem = Storage.prototype.setItem;
    var originalGetItem = Storage.prototype.getItem;
    var originalRemoveItem = Storage.prototype.removeItem;

    // 3. Перехватываем setItem (без defineProperty)
    Storage.prototype.setItem = function(key, value) {
        // Перехватываем только pluginsBack
        if (key === 'pluginsBack') {
            var size = 0;
            try {
                size = new Blob([value]).size;
            } catch(e) {
                size = String(value).length;
            }
            
            console.log('[Fix] Запись в pluginsBack, размер:', size, 'байт');
            
            // Пропускаем пустые значения
            if (value === '[]' || value === '' || value === 'null' || value === 'undefined') {
                console.log('[Fix] pluginsBack пустой, пропускаем');
                return;
            }
            
            // Не сохраняем большие данные
            if (size > 4000000) { // 4 МБ
                console.warn('[Fix] pluginsBack слишком большой (' + size + ' байт), очищаем');
                try {
                    originalRemoveItem.call(this, 'pluginsBack');
                } catch(e) {}
                
                // Показываем уведомление
                try {
                    if (typeof Lampa !== 'undefined' && Lampa.Bell) {
                        Lampa.Bell.push({
                            text: '⚠️ Очищен кэш pluginsBack (превышен лимит)',
                            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#ff9800"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'
                        });
                    }
                } catch(e) {}
                return;
            }
            
            // Сжимаем данные - оставляем только последние 50 записей
            try {
                var parsed = JSON.parse(value);
                if (Array.isArray(parsed) && parsed.length > 50) {
                    console.log('[Fix] Сжатие pluginsBack: было ' + parsed.length + ' записей, оставляем 50');
                    parsed = parsed.slice(-50);
                    value = JSON.stringify(parsed);
                }
            } catch(e) {
                // Если не парсится - пробуем как строку
                if (typeof value === 'string' && value.length > 10000) {
                    console.log('[Fix] Обрезаем длинную строку pluginsBack');
                    value = value.substring(0, 10000);
                }
            }
        }
        
        // Вызываем оригинальный метод
        try {
            return originalSetItem.call(this, key, value);
        } catch(e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.warn('[Fix] Ошибка квоты для ключа:', key);
                
                // Очищаем большие ключи
                var keysToRemove = ['pluginsBack', 'plugins', 'account_cache', 'torrent_cache'];
                for (var i = 0; i < keysToRemove.length; i++) {
                    try {
                        if (this.getItem(keysToRemove[i])) {
                            var size = this.getItem(keysToRemove[i]).length;
                            if (size > 100000) {
                                console.log('[Fix] Удаляем большой ключ:', keysToRemove[i], size);
                                originalRemoveItem.call(this, keysToRemove[i]);
                            }
                        }
                    } catch(e2) {}
                }
                
                // Повторяем попытку
                try {
                    return originalSetItem.call(this, key, value);
                } catch(e2) {
                    console.error('[Fix] Не удалось сохранить даже после очистки');
                }
            }
        }
    };

    // 4. Очищаем pluginsBack при старте
    try {
        var backData = localStorage.getItem('pluginsBack');
        if (backData) {
            var size = backData.length;
            if (size > 3000000) {
                console.log('[Fix] Очистка большого pluginsBack (' + size + ' байт)');
                localStorage.removeItem('pluginsBack');
            }
        }
    } catch(e) {}

    // 5. Патчим Lampa.Storage
    if (typeof Lampa !== 'undefined' && Lampa.Storage) {
        var originalStorageSet = Lampa.Storage.set;
        var originalStorageGet = Lampa.Storage.get;
        
        Lampa.Storage.set = function(name, value) {
            if (name === 'pluginsBack') {
                console.log('[Fix] Перехват Lampa.Storage.set для pluginsBack');
                var size = 0;
                try {
                    size = JSON.stringify(value).length;
                } catch(e) {
                    size = String(value).length;
                }
                if (size > 4000000) {
                    console.warn('[Fix] Блокировка Lampa.Storage.set для pluginsBack');
                    try {
                        localStorage.removeItem('pluginsBack');
                    } catch(e) {}
                    return;
                }
            }
            return originalStorageSet.call(this, name, value);
        };
    }

    // 6. Функция очистки
    window.fixClearPluginsBack = function() {
        try {
            localStorage.removeItem('pluginsBack');
            console.log('[Fix] pluginsBack очищен');
            if (typeof Lampa !== 'undefined' && Lampa.Bell) {
                Lampa.Bell.push({
                    text: '✅ pluginsBack очищен',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#4caf50"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
                });
            }
        } catch(e) {
            console.error('[Fix] Ошибка очистки:', e);
        }
    };

    // 7. Автоочистка
    setTimeout(function() {
        try {
            var backData = localStorage.getItem('pluginsBack');
            if (backData && backData.length > 2000000) {
                console.log('[Fix] Автоочистка pluginsBack при запуске');
                localStorage.removeItem('pluginsBack');
            }
        } catch(e) {}
    }, 1000);

    console.log('[Fix] Исправление pluginsBack загружено!');
    console.log('[Fix] Для очистки: fixClearPluginsBack()');
})();
