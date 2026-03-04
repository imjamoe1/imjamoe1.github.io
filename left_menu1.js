(function() {
    'use strict';

    function startPlugin() {
        if (window.plugin_menu_always_ready) return;
        window.plugin_menu_always_ready = true;

        function initialize() {
            console.log('Menu Always: инициализация');

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

            function shouldHideCompactMenu() {
                if (!Lampa.Activity.active()) return false;
                
                let active = Lampa.Activity.active();
                let component = active.component;
                
                const hideCompactIn = [
                    'full'
                ];

                if (component && hideCompactIn.includes(component)) return true;
                if ($('.explorer').length > 0) return true;
                
                return false;
            }

            Lampa.Template.add('menu_always_style', `
                <style id="menu_always_style">
                    body.menu--always .wrap__left {
                        width: 6%;
                        min-width: 70px;
                        max-width: 100px;
                        margin-left: 0;
                        transform: translate3d(0, 0, 0);
                        visibility: visible !important;
                        position: relative;
                        z-index: 10;
                        transition: opacity 0.2s, width 0.2s, transform 0.2s;
                    }

                    body.menu--always .wrap__content {
                        transform: translate3d(0, 0, 0);
                        width: calc(100% - 6%);
                        flex: 1;
                        margin-left: -2%;
                        padding-left: 0;
                        transition: width 0.2s, transform 0.2s;
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
                        max-width: 100% !important;
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

            function applyMenuAlways() {
                let enabled = Lampa.Storage.field('menu_always') === true;
                let isTv = Lampa.Platform.screen('tv');
                
                if (!document.querySelector('#menu_always_style')) {
                    $('body').append(Lampa.Template.get('menu_always_style', {}, true));
                }
                
                if (isTv && enabled) {
                    let hideCompact = shouldHideCompactMenu();
                    
                    $('body').addClass('menu--always');
                    $('body').toggleClass('hide-compact', hideCompact);
                } else {
                    $('body').removeClass('menu--always hide-compact');
                    
                    if (!$('body').hasClass('menu--open')) {
                        $('.wrap__left').addClass('wrap__left--hidden');
                    } else {
                        $('.wrap__left').removeClass('wrap__left--hidden');
                    }
                }
                
                $('.settings-param[data-name="menu_always"] .settings-param__value').text(
                    Lampa.Lang.translate(enabled ? 'settings_param_yes' : 'settings_param_no')
                );
                
                $(window).trigger('resize');
                Lampa.Layer?.update?.();
            }

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
                        
                        if (Lampa.Platform.screen('tv')) {
                            $('body').toggleClass('menu--always', boolValue);
                        }
                    }
                });
            }

            Lampa.Storage.listener.follow('change', (e) => {
                if (e.name === 'menu_always') applyMenuAlways();
            });

            // Основной обработчик изменений - минимальная задержка
            if (Lampa.Activity?.listener) {
                Lampa.Activity.listener.follow('change', () => {
                    setTimeout(applyMenuAlways, 50);
                });
            }

            setInterval(() => {
                if (menuAlwaysVisible()) {
                    let shouldHide = shouldHideCompactMenu();
                    let isHidden = $('body').hasClass('hide-compact');
                    if (shouldHide !== isHidden) applyMenuAlways();
                }
            }, 3000);

            if (window.appready) {
                applyMenuAlways();
            } else {
                Lampa.Listener.follow('app', (e) => {
                    if (e.type === 'ready') applyMenuAlways();
                });
            }

            $(window).on('resize', () => {
                clearTimeout(window.menu_always_resize);
                window.menu_always_resize = setTimeout(() => {
                    $(window).trigger('resize');
                }, 100);
            });
        }

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
