(function() {
    // Плагин для сохранения домена cub.red (без замены)
    
    var plugin = {
        id: 'cubred_preserver',
        name: 'Cub.Red Preserver',
        version: '1.0',
        description: 'Сохраняет домен cub.red без изменений',
        
        // Высокий приоритет для запуска до других плагинов
        priority: 10,
        
        // Задержка перед запуском
        delay: 500,
        
        init: function() {
            var self = this;
            
            // Запускаем с задержкой
            setTimeout(function() {
                self.preserveCubRed();
            }, self.delay);
        },
        
        preserveCubRed: function() {
            try {
                // Получаем текущие плагины
                var plugins = Lampa.Storage.get('plugins', '[]');
                var modified = false;
                
                // Проходим по каждому плагину
                plugins.forEach(function(plug) {
                    // Проверяем, содержит ли URL cub.red
                    if (plug.url && plug.url.indexOf('cub.red') !== -1) {
                        // Убеждаемся, что URL НЕ изменен на cub.bylampa.online
                        if (plug.url.indexOf('cub.bylampa.online') !== -1) {
                            // Восстанавливаем оригинальный домен
                            plug.url = plug.url.replace(/cub\.bylampa\.online/g, 'cub.red');
                            modified = true;
                            console.log('[Cub.Red Preserver] Восстановлен домен cub.red для:', plug.url);
                        }
                        
                        // Устанавливаем высокий приоритет для этого плагина
                        plug.priority = 10;
                        modified = true;
                    }
                });
                
                // Сохраняем изменения, если они были
                if (modified) {
                    Lampa.Storage.set('plugins', plugins);
                    console.log('[Cub.Red Preserver] Домен cub.red сохранен для всех плагинов');
                }
                
                // Защита от будущих изменений
                this.protectCubRed();
                
            } catch (e) {
                console.error('[Cub.Red Preserver] Ошибка:', e);
            }
        },
        
        protectCubRed: function() {
            // Перехватываем метод сохранения плагинов
            var originalSet = Lampa.Storage.set;
            var self = this;
            
            Lampa.Storage.set = function(key, value) {
                // Если сохраняются плагины
                if (key === 'plugins' && value) {
                    // Проверяем, не пытаются ли изменить cub.red
                    if (typeof value === 'string') {
                        try {
                            var plugins = JSON.parse(value);
                            var changed = false;
                            
                            plugins.forEach(function(plug) {
                                if (plug.url && plug.url.indexOf('cub.red') !== -1) {
                                    // Если кто-то пытается заменить домен - блокируем
                                    if (plug.url.indexOf('cub.bylampa.online') !== -1) {
                                        plug.url = plug.url.replace(/cub\.bylampa\.online/g, 'cub.red');
                                        changed = true;
                                    }
                                }
                            });
                            
                            if (changed) {
                                value = JSON.stringify(plugins);
                                console.log('[Cub.Red Preserver] Защита сработала - домен cub.red сохранен');
                            }
                        } catch (e) {
                            console.error('[Cub.Red Preserver] Ошибка при защите:', e);
                        }
                    }
                }
                
                // Вызываем оригинальный метод
                return originalSet.call(this, key, value);
            };
        }
    };
    
    // Регистрируем плагин в Lampa
    if (typeof Lampa !== 'undefined' && Lampa.Plugin) {
        Lampa.Plugin.add(plugin);
        console.log('[Cub.Red Preserver] Плагин зарегистрирован - домен cub.red будет сохранен');
    } else {
        // Если Lampa еще не загружена, ждем
        var waitForLampa = setInterval(function() {
            if (typeof Lampa !== 'undefined' && Lampa.Plugin) {
                clearInterval(waitForLampa);
                Lampa.Plugin.add(plugin);
                console.log('[Cub.Red Preserver] Плагин зарегистрирован (с задержкой)');
            }
        }, 500);
    }
})();