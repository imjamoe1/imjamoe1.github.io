(function() {
    'use strict';

    function startPlugin() {
        if (window.plugin_menu_always_ready) return;
        window.plugin_menu_always_ready = true;

        function initialize() {
            console.log('Menu Always: инициализация');

            // Добавляем переводы
            Lampa.Lang.add({
                menu_always: {
                    ru: 'Всегда показывать левое меню',
                    uk: 'Завжди показувати ліве меню',
                    en: 'Always show the left menu'
                }
            });

            // Добавляем стили
            Lampa.Template.add('menu_always_style', `
                <style id="menu_always_style">
                    /* Режим "Всегда показывать меню" */
                    body.menu--always .wrap__left {
                        width: 5% !important;
                        margin-left: 0 !important;
                        transform: translate3d(0, 0, 0) !important;
                        visibility: visible !important;
                        display: flex !important;
                    }

                    body.menu--always .wrap__content {
                        transform: translate3d(0, 0, 0) !important;
                        margin-left: -6.5% !important;
                        padding-left: 6% !important;
                    }

                    /* Когда меню открыто поверх всегда видимого */
                    body.menu--always.menu--open .wrap__left {
                        width: 15em !important;
                        margin-left: -15em !important;
                        transform: translate3d(15em, 0, 0) !important;
                    }

                    body.menu--always.menu--open .wrap__content {
                        transform: translate3d(15em, 0, 0) !important;
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                    }

                    /* Скрываем меню только когда оно не нужно и не активно */
                    body:not(.menu--always) .wrap__left.wrap__left--hidden {
                        visibility: hidden !important;
                    }
                </style>
            `);

            // Добавляем параметр в настройки
            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: {
                    name: 'menu_always',
                    type: 'trigger',
                    default: false
                },
                field: {
                    name: Lampa.Lang.translate('menu_always')
                },
                onRender: function(item) {
                    // Перемещаем после "Размер интерфейса"
                    setTimeout(function() {
                        let target = $('div[data-name="interface_size"]');
                        if (target.length) {
                            let parent = target.closest('.settings-param');
                            if (parent.length) {
                                item.insertAfter(parent);
                            }
                        }
                        
                        // Добавляем класс is--tv (только для ТВ)
                        if (!Lampa.Platform.screen('tv')) {
                            item.addClass('hide');
                        }
                    }, 50);
                    
                    // Принудительно обновляем отображение значения
                    setTimeout(() => {
                        let value = Lampa.Storage.field('menu_always');
                        let valueElem = item.find('.settings-param__value');
                        if (valueElem.length) {
                            valueElem.text(Lampa.Lang.translate(value ? 'settings_param_yes' : 'settings_param_no'));
                        }
                    }, 100);
                },
                onChange: function(value) {
                    console.log('Menu Always: значение изменено на', value);
                    
                    // Преобразуем строковое значение в булево
                    let boolValue = value === 'true' || value === true;
                    
                    // Сохраняем правильно
                    Lampa.Storage.set('menu_always', boolValue);
                    
                    applyMenuAlways();
                    
                    // Обновляем класс на body
                    if (Lampa.Platform.screen('tv')) {
                        $('body').toggleClass('menu--always', boolValue);
                    }
                }
            });

            // Функция применения настроек
            function applyMenuAlways() {
                let enabled = Lampa.Storage.field('menu_always') === true;
                let isTv = Lampa.Platform.screen('tv');
                
                console.log('Menu Always: applying, enabled =', enabled, 'isTv =', isTv);
                
                // Добавляем/удаляем основной класс
                $('body').toggleClass('menu--always', isTv && enabled);
                
                // Добавляем стили если их нет
                if (!document.querySelector('#menu_always_style')) {
                    $('body').append(Lampa.Template.get('menu_always_style', {}, true));
                }
                
                // Синхронизация с состоянием меню
                if (isTv && enabled) {
                    $('.wrap__left').removeClass('wrap__left--hidden');
                }
                
                // Обновляем все элементы настроек с этим параметром
                $('.settings-param[data-name="menu_always"]').each(function() {
                    let val = Lampa.Storage.field('menu_always');
                    let valueElem = $(this).find('.settings-param__value');
                    if (valueElem.length) {
                        valueElem.text(Lampa.Lang.translate(val ? 'settings_param_yes' : 'settings_param_no'));
                    }
                });
                
                // Принудительно обновляем layout
                setTimeout(() => {
                    $(window).trigger('resize');
                }, 10);
            }

            // Следим за изменениями в меню (открытие/закрытие)
            Lampa.Listener.follow('menu', (e) => {
                if (e.type === 'toggle' || e.type === 'open' || e.type === 'close') {
                    setTimeout(applyMenuAlways, 50);
                }
            });

            // Следим за роутером (смена страниц)
            Lampa.Listener.follow('router', (e) => {
                if (e.type === 'change') {
                    setTimeout(applyMenuAlways, 100);
                }
            });

            // Следим за изменением настроек
            Lampa.Storage.listener.follow('change', (e) => {
                if (e.name === 'menu_always') {
                    console.log('Menu Always: storage change detected', e.value);
                    applyMenuAlways();
                }
            });

            // При загрузке приложения
            Lampa.Listener.follow('app', (e) => {
                if (e.type === 'ready') {
                    setTimeout(applyMenuAlways, 200);
                    
                    $(window).on('resize', () => {
                        clearTimeout(window.menu_always_resize);
                        window.menu_always_resize = setTimeout(applyMenuAlways, 150);
                    });
                }
            });

            // Первоначальное применение
            setTimeout(applyMenuAlways, 200);
        }

        // Запуск
        if (window.appready) {
            initialize();
        } else {
            Lampa.Listener.follow('app', (e) => {
                if (e.type === 'ready') initialize();
            });
        }
    }

    startPlugin();
})();
