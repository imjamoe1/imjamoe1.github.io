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
                    en: 'Always show the left menu',
                    be: 'Заўсёды паказваць левае меню',
                    kz: 'Әрқашан сол жақ мәзірді көрсету'
                }
            });

            function menuAlwaysVisible() {
                return Lampa.Platform.screen('tv') && Lampa.Storage.field('menu_always');
            }

            // Функция проверки - нужно ли скрывать компактное меню
            function shouldHideCompactMenu() {
                if (!Lampa.Activity.active()) return true; // По умолчанию скрываем
                
                let active = Lampa.Activity.active();
                let component = active.component;
                
                console.log('Menu Always: current component =', component);
                
                // ПОКАЗЫВАЕМ ТОЛЬКО НА ГЛАВНОЙ СТРАНИЦЕ (main)
                if (component === 'main') {
                    return false; // НЕ скрываем - показываем меню
                }
                
                // Для всех остальных компонентов - скрываем
                return true;
            }

            // Функция пересчета размеров
            function recalculateSizes() {
                if (!Lampa.Activity.active()) return;
                
                let render = Lampa.Activity.active().activity?.render(true);
                if (!render) return;
                
                $(window).trigger('resize');
            }

            // Стили для меню
            Lampa.Template.add('menu_always_style', `
                <style id="menu_always_style">
                    body.menu--always .wrap__left {
                        width: 6em !important;
                        margin-right: 0.5em !important;
                        transform: translate3d(0, 0, 0) !important;
                        visibility: visible !important;
                        display: flex !important;
                        flex-shrink: 0 !important;
                    }

                    body.menu--always .wrap__content {
                        transform: translate3d(0, 0, 0) !important;
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                        //width: 100% !important;
                        //box-sizing: border-box !important;
                    }

                    body.menu--always .wrap__content > * {
                        width: 100% !important;
                        max-width: 100% !important;
                    }

                    body.menu--always .menu__text {
                        display: none;
                    }

                    body.menu--always.hide-compact .wrap__left:not(.menu--open) {
                        width: 0 !important;
                        min-width: 0 !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                        visibility: hidden !important;
                    }

                    body.menu--always.hide-compact .wrap__content {
                        width: 100% !important;
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                    }

                    body.menu--always.hide-compact.menu--open .wrap__left {
                        width: 15em !important;
                        min-width: 15em !important;
                        margin-left: -15em !important;
                        transform: translate3d(15em, 0, 0) !important;
                        opacity: 1 !important;
                        pointer-events: auto !important;
                        visibility: visible !important;
                    }

                    body.menu--always.hide-compact.menu--open .wrap__content {
                        transform: translate3d(15em, 0, 0) !important;
                        width: calc(100% - 15em) !important;
                    }

                    body.menu--always .explorer {
                        width: 100% !important;
                    }

                    body.menu--always.menu--open .wrap__left {
                        width: 15em;
                        min-width: 15em;
                        margin-left: -15em;
                        transform: translate3d(15em, 0, 0);
                    }

                    body.menu--always.menu--open .wrap__left .menu__text {
                        display: block;
                    }

                    body.menu--always.menu--open .wrap__content {
                        transform: translate3d(15em, 0, 0);
                        width: calc(100% - 15em);
                    }
                </style>
            `);

            // Добавляем debounce для applyMenuAlways
            let applyTimeout;
            function debouncedApplyMenuAlways() {
                clearTimeout(applyTimeout);
                applyTimeout = setTimeout(() => {
                    applyMenuAlways();
                }, 20);
            }

            function applyMenuAlways() {
                let enabled = Lampa.Storage.field('menu_always') === true;
                let isTv = Lampa.Platform.screen('tv');
                
                if (!document.querySelector('#menu_always_style')) {
                    $('body').append(Lampa.Template.get('menu_always_style', {}, true));
                }
                
                if (isTv && enabled) {
                    let hideCompact = shouldHideCompactMenu();
                    
                    $('body').addClass('menu--always');
                    
                    if (hideCompact) {
                        $('body').addClass('hide-compact');
                    } else {
                        $('body').removeClass('hide-compact');
                    }
                    
                    console.log('Menu Always: hideCompact =', hideCompact, 'component =', Lampa.Activity.active()?.component);
                } else {
                    $('body').removeClass('menu--always hide-compact');
                    
                    if (!$('body').hasClass('menu--open')) {
                        $('.wrap__left').addClass('wrap__left--hidden');
                    } else {
                        $('.wrap__left').removeClass('wrap__left--hidden');
                    }
                }
                
                // Обновляем текст в настройках
                $('.settings-param[data-name="menu_always"] .settings-param__value').text(
                    Lampa.Lang.translate(enabled ? 'settings_param_yes' : 'settings_param_no')
                );
                
                recalculateSizes();
            }

            // Добавляем параметр в настройки
            if (Lampa.SettingsApi?.addParam) {
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
                        setTimeout(function() {
                            let target = $('div[data-name="interface_size"]');
                            if (target.length) {
                                let parent = target.closest('.settings-param');
                                if (parent.length) item.insertAfter(parent);
                            }
                            
                            if (!Lampa.Platform.screen('tv')) item.addClass('hide');
                            
                            let value = Lampa.Storage.field('menu_always');
                            item.find('.settings-param__value').text(
                                Lampa.Lang.translate(value ? 'settings_param_yes' : 'settings_param_no')
                            );
                        }, 50);
                    },
                    onChange: function(value) {
                        let boolValue = value === 'true' || value === true;
                        Lampa.Storage.set('menu_always', boolValue);
                        applyMenuAlways();
                    }
                });
            }

            // Специализированные обработчики событий
            Lampa.Listener.follow('full', (e) => {
                if (e.type === 'start') {
                    $('body').addClass('hide-compact');
                    recalculateSizes();
                }
                if (e.type === 'close') {
                    setTimeout(applyMenuAlways, 100);
                }
            });

            Lampa.Listener.follow('router', (e) => {
                console.log('Router changed:', e.from, '->', e.to);
                
                // При переходе на главную - показываем меню
                if (e.to === 'main') {
                    setTimeout(() => {
                        $('body').removeClass('hide-compact');
                        recalculateSizes();
                    }, 50);
                } else {
                    // На всех остальных страницах - скрываем
                    setTimeout(() => {
                        $('body').addClass('hide-compact');
                        recalculateSizes();
                    }, 50);
                }
            });

            // Следим за добавлением explorer
            new MutationObserver((mutations) => {
                mutations.forEach(m => {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (node.classList?.contains('explorer') || node.querySelector?.('.explorer'))) {
                            $('body').addClass('hide-compact');
                            recalculateSizes();
                        }
                    });
                });
            }).observe(document.body, { childList: true, subtree: true });

            Lampa.Storage.listener.follow('change', (e) => {
                if (e.name === 'menu_always') {
                    applyMenuAlways();
                    $('.settings-param[data-name="menu_always"] .settings-param__value').text(
                        Lampa.Lang.translate(e.value ? 'settings_param_yes' : 'settings_param_no')
                    );
                }
            });

            Lampa.Listener.follow('app', (e) => {
                if (e.type === 'ready') {
                    setTimeout(applyMenuAlways, 200);
                    
                    $(window).on('resize', () => {
                        clearTimeout(window.menu_always_resize);
                        window.menu_always_resize = setTimeout(recalculateSizes, 150);
                    });
                }
            });

            if (Lampa.Activity?.listener) {
                Lampa.Activity.listener.follow('change', (e) => {
                    console.log('Activity changed:', e);
                    debouncedApplyMenuAlways();
                });
            }

            // Периодическая проверка
            setInterval(() => {
                if (menuAlwaysVisible()) {
                    let shouldHide = shouldHideCompactMenu();
                    let isHidden = $('body').hasClass('hide-compact');
                    if (shouldHide !== isHidden) {
                        console.log('Menu Always: fixing state mismatch');
                        applyMenuAlways();
                    }
                }
            }, 3000);

            setTimeout(applyMenuAlways, 200);
        }

        if (window.appready) initialize();
        else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') initialize(); });
    }

    startPlugin();
})();
