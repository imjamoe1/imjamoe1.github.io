// ============================================
// fix_pluginsBack.js - Исправление ошибки localStorage для Tizen
// Приоритет: выполняется ДО modification.js
// Установка: добавить в список плагинов первым
// ============================================

(function() {
    console.log('[Fix] Загрузка исправления pluginsBack...');

    // 1. Исправляем ошибку в window.lampa_settings
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

    // 2. Перехватываем localStorage.setItem
    var originalSetItem = Storage.prototype.setItem;
    
    Storage.prototype.setItem = function(key, value) {
        // Перехватываем запись в pluginsBack
        if (key === 'pluginsBack') {
            console.log('[Fix] Перехвачена запись в pluginsBack, размер:', 
                       new Blob([value]).size, 'байт');
            
            // Проверяем размер
            var size = new Blob([value]).size;
            
            // Если данные > 4 МБ - не сохраняем
            if (size > 4000000) {
                console.warn('[Fix] pluginsBack слишком большой (' + size + ' байт), пропускаем запись');
                
                // Если есть старые данные, очищаем их
                if (this.getItem('pluginsBack')) {
                    this.removeItem('pluginsBack');
                }
                
                // Показываем уведомление (опционально)
                try {
                    if (typeof Lampa !== 'undefined' && Lampa.Bell) {
                        Lampa.Bell.push({
                            text: '⚠️ Очищен кэш pluginsBack (превышен лимит)',
                            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#ff9800"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'
                        });
                    }
                } catch(e) {}
                
                return; // Не сохраняем
            }
            
            // Если размер нормальный, но данные - это строка "[object Array]" или пусто
            if (value === '[]' || value === '' || value === 'null' || value === 'undefined') {
                console.log('[Fix] pluginsBack пустой, пропускаем запись');
                return;
            }
            
            // Пытаемся сжать данные - оставляем только 100 последних записей
            try {
                var parsed = JSON.parse(value);
                if (Array.isArray(parsed) && parsed.length > 100) {
                    console.log('[Fix] Сжатие pluginsBack: было ' + parsed.length + ' записей, оставляем 100');
                    parsed = parsed.slice(-100);
                    value = JSON.stringify(parsed);
                }
            } catch(e) {
                // Если не парсится - возможно это уже строка, ничего не делаем
            }
        }
        
        // Вызываем оригинальный метод
        try {
            return originalSetItem.call(this, key, value);
        } catch(e) {
            // Если ошибка квоты - очищаем проблемные ключи
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.warn('[Fix] Ошибка квоты для ключа:', key);
                
                // Очищаем самый большой ключ
                var maxKey = '';
                var maxSize = 0;
                for (var i = 0; i < this.length; i++) {
                    var k = this.key(i);
                    var v = this.getItem(k);
                    var s = new Blob([v]).size;
                    if (s > maxSize && k !== 'pluginsBack') {
                        maxSize = s;
                        maxKey = k;
                    }
                }
                
                if (maxKey) {
                    console.log('[Fix] Удаляем большой ключ:', maxKey, 'размер:', maxSize);
                    this.removeItem(maxKey);
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

    // 3. Очищаем pluginsBack при старте (если он слишком большой)
    try {
        var backData = localStorage.getItem('pluginsBack');
        if (backData) {
            var size = new Blob([backData]).size;
            if (size > 4000000) {
                console.log('[Fix] Очистка большого pluginsBack (' + size + ' байт)');
                localStorage.removeItem('pluginsBack');
            }
        }
    } catch(e) {}

    // 4. Защита от двойной записи - делаем поле только для чтения
    Object.defineProperty(localStorage, 'pluginsBack', {
        get: function() {
            return localStorage.getItem('pluginsBack');
        },
        set: function(value) {
            // Перехватываем прямую запись через свойство
            console.log('[Fix] Перехвачена прямая запись в pluginsBack');
            var size = new Blob([value]).size;
            if (size < 4000000) {
                localStorage.setItem('pluginsBack', value);
            } else {
                console.warn('[Fix] Блокировка прямой записи в pluginsBack (слишком большой)');
            }
        },
        configurable: true
    });

    // 5. Патчим Lampa.Storage.set для безопасности
    if (typeof Lampa !== 'undefined' && Lampa.Storage) {
        var originalStorageSet = Lampa.Storage.set;
        
        Lampa.Storage.set = function(name, value) {
            if (name === 'pluginsBack') {
                console.log('[Fix] Перехват Lampa.Storage.set для pluginsBack');
                var size = new Blob([JSON.stringify(value)]).size;
                if (size > 4000000) {
                    console.warn('[Fix] Блокировка Lampa.Storage.set для pluginsBack');
                    return;
                }
            }
            return originalStorageSet.call(this, name, value);
        };
    }

    // 6. Добавляем кнопку очистки в консоль (для отладки)
    window.fixClearPluginsBack = function() {
        localStorage.removeItem('pluginsBack');
        console.log('[Fix] pluginsBack очищен');
        try {
            if (typeof Lampa !== 'undefined' && Lampa.Bell) {
                Lampa.Bell.push({
                    text: '✅ pluginsBack очищен',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#4caf50"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
                });
            }
        } catch(e) {}
    };

    console.log('[Fix] Исправление pluginsBack успешно загружено!');
    console.log('[Fix] Для очистки введите: fixClearPluginsBack()');
    
    // 7. Автоочистка при первом запуске
    setTimeout(function() {
        try {
            var backData = localStorage.getItem('pluginsBack');
            if (backData && new Blob([backData]).size > 3000000) {
                console.log('[Fix] Автоочистка pluginsBack при запуске');
                localStorage.removeItem('pluginsBack');
            }
        } catch(e) {}
    }, 1000);

})();
