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
                    en: 'Always show the left menu'
                }
            });

            Lampa.Template.add('menu_always_style', `
                <style id="menu_always_style">
                    .wrap__left, .wrap__content {
                        transition: none !important;
                    }
                    
                    body.menu--always .wrap__left {
                        width: 6em !important;
                        margin-left: 0 !important;
                        transform: translate3d(0, 0, 0) !important;
                        visibility: visible !important;
                        display: flex !important;
                        flex-shrink: 0 !important;
                    }

                    body.menu--always .wrap__content {
                        transform: translate3d(0, 0, 0) !important;
                        margin-left: -3em !important;
                        padding-left: 1em !important;
                    }

                    body.menu--always:not(.menu--open) .menu__list .menu__item {
                        margin-left: -1em !important;
                        //width: 90% !important;
                    }

                    body.menu--always:not(.menu--open) .menu__list .menu__item:hover,
                    body.menu--always:not(.menu--open) .menu__list .menu__item:focus {
                        margin-left: -0.5em !important;
                        width: 60% !important;
                    }

                    body.menu--always .menu__text {
                        display: none;
                    }

                    body.menu--always.hide-compact .wrap__left:not(.menu--open) {
                        width: 0 !important;
                        min-width: 0 !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                    }

                    body.menu--always.hide-compact .wrap__content {
                        width: 100% !important;
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                    }

                    body.menu--always.hide-compact.menu--open .wrap__left,
                    body.menu--always.menu--open .wrap__left {
                        width: 15em !important;
                        min-width: 15em !important;
                        margin-left: 0 !important;
                        transform: none !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }

                    body.menu--always.hide-compact.menu--open .wrap__left .menu__text,
                    body.menu--always.menu--open .wrap__left .menu__text {
                        display: block !important;
                    }

                    body.menu--always.hide-compact.menu--open .wrap__content,
                    body.menu--always.menu--open .wrap__content {
                        transform: none !important;
                        width: calc(100% - 15em) !important;
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                    }

                    body.menu--always:not(.hide-compact) .wrap__left {
                        width: 6em !important;
                    }
                </style>
            `);

            function applyMenuState(hide) {
                if (hide) {
                    $('body').addClass('hide-compact');
                } else {
                    $('body').removeClass('hide-compact');
                }
            }

            if (!document.querySelector('#menu_always_style')) {
                $('body').append(Lampa.Template.get('menu_always_style', {}, true));
            }

            function updateMenuState() {
                if (Lampa.Storage.field('menu_always') !== true) {
                    $('body').removeClass('menu--always hide-compact');
                    return;
                }

                $('body').addClass('menu--always');

                let active = Lampa.Activity.active();
                if (!active) return;

                if (active.component === 'main') {
                    applyMenuState(false);
                } else {
                    applyMenuState(true);
                }
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
                    onChange: function(value) {
                        let boolValue = value === 'true' || value === true;
                        Lampa.Storage.set('menu_always', boolValue);
                        updateMenuState();
                    }
                });
            }

            Lampa.Listener.follow('activity', (e) => {
                if (e.type === 'destroy' || e.type === 'start') {
                    setTimeout(updateMenuState, 10);
                }
            });

            Lampa.Listener.follow('router', (e) => {
                if (e.to === 'main') {
                    setTimeout(() => {
                        if (Lampa.Storage.field('menu_always') === true) {
                            applyMenuState(false);
                        }
                    }, 10);
                }
            });

            Lampa.Listener.follow('full', (e) => {
                if (e.type === 'start') {
                    setTimeout(() => {
                        if (Lampa.Storage.field('menu_always') === true) {
                            applyMenuState(true);
                        }
                    }, 10);
                }
            });

            Lampa.Storage.listener.follow('change', (e) => {
                if (e.name === 'menu_always') {
                    updateMenuState();
                }
            });

            setTimeout(updateMenuState, 100);
        }

        if (window.appready) initialize();
        else Lampa.Listener.follow('app', (e) => { 
            if (e.type === 'ready') initialize();
        });
    }

    startPlugin();
})();
