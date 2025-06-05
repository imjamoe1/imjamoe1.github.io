(function () {
    'use strict';

    var plugin = {
        name: 'ReloadAndExitLampa',
        version: '1.0',
        description: 'Кнопки для перезагрузки и выхода из приложения Lampa с TV-фокусом',
        
        init() {
            if (window.plugin_reload_exit_ready) return;
            window.plugin_reload_exit_ready = true;

            if (window.appready) {
                this.createButtons();
            } else {
                Lampa.Listener.follow('app', (e) => {
                    if (e.type === 'ready') this.createButtons();
                });
            }
        },

        createButtons() {
            // Контейнер для кнопок (в правом верхнем углу)
            let container = $(`<div class="head__action reload-exit-buttons"></div>`);
            $('.head__actions').prepend(container);

            // Кнопка "Перезагрузка"
            let reloadBtn = $(`<div class="source-logo" style="font-weight: bold;">🔄</div>`);
            container.append(reloadBtn);

            // Кнопка "Выход"
            let exitBtn = $(`<div class="source-logo" style="font-weight: bold; color: red;">⏻</div>`);
            container.append(exitBtn);

            // Обработчики TV-фокуса и нажатий
            reloadBtn.on('hover:enter click', () => {
                if (typeof Lampa !== 'undefined' && Lampa.Activity?.restart) {
                    Lampa.Activity.restart();
                } else {
                    location.reload();
                }
            });

            exitBtn.on('hover:enter click', () => {
                if (typeof Lampa !== 'undefined' && Lampa.Activity?.finish) {
                    Lampa.Activity.finish();
                } else if (window.navigator.app?.exitApp) {
                    window.navigator.app.exitApp();
                } else {
                    Lampa.Noty.show('Выход невозможен. Закройте приложение вручную.');
                }
            });

            // Стили для фокуса (аналогично другим элементам Lampa)
            reloadBtn.on('hover:focus', (e) => {
                reloadBtn.css('transform', 'scale(1.2)');
                reloadBtn.css('color', '#6200EE');
            });
            reloadBtn.on('hover:blur', () => {
                reloadBtn.css('transform', 'scale(1)');
                reloadBtn.css('color', 'white');
            });

            exitBtn.on('hover:focus', () => {
                exitBtn.css('transform', 'scale(1.2)');
                exitBtn.css('color', '#FF0000');
            });
            exitBtn.on('hover:blur', () => {
                exitBtn.css('transform', 'scale(1)');
                exitBtn.css('color', 'red');
            });
        }
    };

    // Регистрация плагина
    if (typeof Lampa !== 'undefined' && Lampa.Plugin?.register) {
        Lampa.Plugin.register(plugin);
    } else {
        plugin.init();
    }

    console.log("🚀 Lampa Plugin Loaded: Кнопки 'Перезагрузка' и 'Выход' добавлены в верхнюю панель");
})();
