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

            // Функция проверки
            function menuAlwaysVisible() {
                return Lampa.Platform.screen('tv') && Lampa.Storage.field('menu_always');
            }

            // Функция проверки - нужно ли скрывать меню
            function shouldHideMenu() {
                if (!Lampa.Activity.active()) return false;
                
                let active = Lampa.Activity.active();
                let component = active.component;
                let activity = active.activity;
                
                // Компоненты, где меню должно быть скрыто
                const hideComponents = [
                    'player',        // Плеер
                    'card',          // Карточка фильма
                    'full',          // Полная информация
                    'settings',      // Настройки
                    'search',        // Поиск
                    'modal',         // Модальные окна
                    'explorer',      // ОНЛАЙН ПРОСМОТР - главный компонент
                    'online',        // Онлайн просмотр
                    'torrent',       // Торренты
                    'watch'          // Просмотр
                ];
                
                // Проверяем компонент
                if (component && hideComponents.includes(component)) {
                    console.log('Menu Always: hiding because component =', component);
                    return true;
                }
                
                // Проверяем наличие explorer в DOM
                if ($('.explorer').length > 0) {
                    console.log('Menu Always: hiding because explorer found');
                    return true;
                }
                
                // Проверяем наличие full-screen элементов
                if ($('.full-start, .full-start__buttons, .full-info, .player-wrapper, .online-player, .torrents-box, .explorer').length > 0) {
                    console.log('Menu Always: hiding because full-screen element');
                    return true;
                }
                
                // Проверяем, есть ли классы, указывающие на полноэкранный режим
                if ($('body').hasClass('player--open') || $('body').hasClass('modal--open') || $('body').hasClass('full--open')) {
                    console.log('Menu Always: hiding because body class');
                    return true;
                }
                
                // Проверяем URL или роутер
                let currentRoute = Lampa.Router && Lampa.Router.current ? Lampa.Router.current().url : '';
                if (currentRoute && (currentRoute.includes('online') || currentRoute.includes('watch') || currentRoute.includes('torrent') || currentRoute.includes('explorer'))) {
                    console.log('Menu Always: hiding because route =', currentRoute);
                    return true;
                }
                
                return false;
            }

            // Функция проверки - можно ли показывать меню
            function shouldShowMenu() {
                if (!menuAlwaysVisible()) return false;
                if (shouldHideMenu()) return false;
                return true;
            }

            // Исправленные стили
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
                        transition: opacity 0.2s, width 0.2s;
                    }

                    body.menu--always .wrap__content {
                        transform: translate3d(0, 0, 0);
                        width: calc(100% - 6%);
                        flex: 1;
                        margin-left: -1%;
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

                    /* ПОЛНОЕ СКРЫТИЕ МЕНЮ */
                    body.menu--always.hide-menu-now .wrap__left,
                    body.menu--always .explorer ~ .wrap__left,
                    body.menu--always:has(.explorer) .wrap__left {
                        width: 0 !important;
                        min-width: 0 !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                        visibility: hidden !important;
                        display: none !important;
                    }

                    body.menu--always.hide-menu-now .wrap__content,
                    body.menu--always .explorer ~ .wrap__content,
                    body.menu--always:has(.explorer) .wrap__content {
                        width: 100% !important;
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                        transform: translate3d(0, 0, 0) !important;
                    }

                    /* Для explorer - занимаем всю ширину */
                    body.menu--always .explorer {
                        width: 100% !important;
                        max-width: 100% !important;
                    }

                    body.menu--always .explorer.layer--width {
                        width: 100% !important;
                    }

                    /* Контент внутри */
                    body.menu--always .wrap__content .layer,
                    body.menu--always .wrap__content .scroll__container,
                    body.menu--always .wrap__content .scroll__content {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                    }

                    /* Когда меню открыто */
                    body.menu--always.menu--open .wrap__left {
                        width: 15em;
                        min-width: 15em;
                        margin-left: -15em;
                        transform: translate3d(15em, 0, 0);
                        opacity: 1 !important;
                        pointer-events: auto !important;
                        visibility: visible !important;
                        display: flex !important;
                    }

                    body.menu--always.menu--open .wrap__left .menu__text {
                        display: block;
                    }

                    body.menu--always.menu--open .wrap__content {
                        transform: translate3d(15em, 0, 0);
                        width: calc(100% - 15em);
                    }

                    body.light--version .wrap__left {
                        visibility: visible;
                    }
                </style>
            `);

            // Функция добавления параметра вручную
            function addSettingManually() {
                if ($('.settings-param[data-name="menu_always"]').length) return;

                const checkExist = setInterval(() => {
                    const settingsInterface = $('.settings__container[data-component="interface"]');
                    if (settingsInterface.length) {
                        clearInterval(checkExist);
                        
                        const menuText = Lampa.Lang.translate('menu_always');
                        
                        console.log('Menu Always: перевод =', menuText);
                        
                        const menuItem = $(`
                            <div class="settings-param selector is--tv" data-type="toggle" data-name="menu_always">
                                <div class="settings-param__name">${menuText}</div>
                                <div class="settings-param__value">${Lampa.Lang.translate(Lampa.Storage.field('menu_always') ? 'settings_param_yes' : 'settings_param_no')}</div>
                            </div>
                        `);
                        
                        const sizeParam = settingsInterface.find('div[data-name="interface_size"]').closest('.settings-param');
                        
                        if (sizeParam.length) {
                            menuItem.insertAfter(sizeParam);
                            console.log('Menu Always: пункт добавлен после размера интерфейса');
                        } else {
                            settingsInterface.prepend(menuItem);
                            console.log('Menu Always: пункт добавлен в начало');
                        }
                        
                        if (!Lampa.Platform.screen('tv')) {
                            menuItem.addClass('hide');
                        }
                        
                        menuItem.on('hover:enter', function() {
                            let currentVal = Lampa.Storage.field('menu_always');
                            let newVal = !currentVal;
                            
                            Lampa.Storage.set('menu_always', newVal);
                            
                            menuItem.find('.settings-param__value').text(
                                Lampa.Lang.translate(newVal ? 'settings_param_yes' : 'settings_param_no')
                            );
                            
                            applyMenuAlways();
                        });
                        
                        if (Lampa.Platform.screen('tv')) {
                            menuItem.removeClass('hide');
                        }
                    }
                }, 500);
            }

            // Также пробуем через SettingsApi
            if (Lampa.SettingsApi && Lampa.SettingsApi.addParam) {
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
                        console.log('Menu Always: onChange', value);
                        let boolValue = value === true || value === 'true';
                        Lampa.Storage.set('menu_always', boolValue);
                        applyMenuAlways();
                    }
                });
                
                console.log('Menu Always: параметр зарегистрирован через SettingsApi');
                
                setTimeout(moveParamToCorrectPosition, 1000);
                setTimeout(moveParamToCorrectPosition, 2000);
                setTimeout(moveParamToCorrectPosition, 3000);
            }
            
            // Функция перемещения параметра в правильное место
            function moveParamToCorrectPosition() {
                let menuParam = $('.settings-param[data-name="menu_always"]');
                let sizeParam = $('div[data-name="interface_size"]').closest('.settings-param');
                
                if (menuParam.length && sizeParam.length) {
                    if (menuParam.prev().find('div[data-name="interface_size"]').length === 0) {
                        menuParam.insertAfter(sizeParam);
                        console.log('Menu Always: параметр перемещен после размера интерфейса');
                    }
                    
                    let nameElem = menuParam.find('.settings-param__name');
                    if (nameElem.text() === 'menu_always') {
                        nameElem.text(Lampa.Lang.translate('menu_always'));
                        console.log('Menu Always: обновлен текст параметра');
                    }
                }
                
                if (!Lampa.Platform.screen('tv')) {
                    menuParam.addClass('hide');
                } else {
                    menuParam.removeClass('hide');
                }
            }

            // Функция пересчета размеров
            function recalculateSizes() {
                if (!Lampa.Activity.active()) return;
                
                let active = Lampa.Activity.active();
                if (!active.activity) return;
                
                let render = active.activity.render(true);
                if (!render) return;
                
                let target = render instanceof jQuery ? render[0] : render;
                if (!target) return;
                
                // Если есть explorer, не нужно пересчитывать ширину - он сам занимает всё
                if ($('.explorer').length > 0) {
                    return;
                }
                
                let wrap = document.querySelector('.wrap__left');
                let head = document.querySelector('.head');
                let navi = document.querySelector('.navigation-bar');
                
                let landscape = window.innerWidth > window.innerHeight && window.innerHeight < 768;
                let menu_width = wrap ? wrap.getBoundingClientRect().width : 0;
                let head_height = head ? head.getBoundingClientRect().height : 0;
                let navi_height = navi && !landscape ? navi.getBoundingClientRect().height : 0;
                let navi_width = navi && landscape ? navi.getBoundingClientRect().width : 0;
                
                let layer_width = [];
                let layer_height = [];
                let layer_wheight = [];
                
                if (target.classList.contains('layer--width')) layer_width.push(target);
                if (target.classList.contains('layer--height')) layer_height.push(target);
                if (target.classList.contains('layer--wheight')) layer_wheight.push(target);
                
                target.querySelectorAll('.layer--width, .layer--height, .layer--wheight').forEach(elem => {
                    if (elem.classList.contains('layer--width')) layer_width.push(elem);
                    if (elem.classList.contains('layer--height')) layer_height.push(elem);
                    if (elem.classList.contains('layer--wheight')) layer_wheight.push(elem);
                });
                
                let menuOffset = shouldShowMenu() ? menu_width : 0;
                
                layer_width.forEach(elem => {
                    let newWidth = window.innerWidth - (Lampa.Platform.screen('light') ? menu_width : menuOffset) - navi_width;
                    elem.style.width = newWidth + 'px';
                });
                
                layer_wheight.forEach(elem => {
                    let heig = window.innerHeight - head_height - navi_height;
                    let mheight = elem.getAttribute('mheight');
                    if (mheight) {
                        let mheightElem = document.querySelector(mheight);
                        if (mheightElem) {
                            heig -= mheightElem.getBoundingClientRect().height;
                        }
                    }
                    elem.style.height = heig + 'px';
                });
                
                layer_height.forEach(elem => {
                    let heig = window.innerHeight;
                    let mheight = elem.getAttribute('mheight');
                    if (mheight) {
                        let mheightElem = document.querySelector(mheight);
                        if (mheightElem) {
                            heig -= mheightElem.getBoundingClientRect().height;
                        }
                    }
                    elem.style.height = heig + 'px';
                });
            }

            // Функция принудительного скрытия меню
            function forceHideMenu() {
                if (!menuAlwaysVisible()) return;
                
                console.log('Menu Always: forcing menu hide');
                
                $('body').addClass('menu--always hide-menu-now');
                $('.wrap__left').addClass('wrap__left--hidden');
                
                // Если есть explorer, применяем дополнительные стили
                if ($('.explorer').length > 0) {
                    $('.explorer').css('width', '100%');
                }
                
                setTimeout(() => {
                    recalculateSizes();
                    $(window).trigger('resize');
                    
                    if (Lampa.Layer && Lampa.Layer.update) {
                        Lampa.Layer.update();
                    }
                }, 10);
            }

            // Функция принудительного показа меню
            function forceShowMenu() {
                if (!menuAlwaysVisible()) return;
                
                console.log('Menu Always: forcing menu show');
                
                $('body').addClass('menu--always');
                $('body').removeClass('hide-menu-now');
                $('.wrap__left').removeClass('wrap__left--hidden');
                
                setTimeout(() => {
                    recalculateSizes();
                    $(window).trigger('resize');
                    
                    if (Lampa.Layer && Lampa.Layer.update) {
                        Lampa.Layer.update();
                    }
                }, 50);
            }

            // Функция применения настроек
            function applyMenuAlways() {
                let enabled = Lampa.Storage.field('menu_always') === true;
                let isTv = Lampa.Platform.screen('tv');
                
                console.log('Menu Always: applying, enabled =', enabled, 'isTv =', isTv);
                
                if (!document.querySelector('#menu_always_style')) {
                    $('body').append(Lampa.Template.get('menu_always_style', {}, true));
                }
                
                if (isTv && enabled) {
                    let hide = shouldHideMenu();
                    
                    $('body').addClass('menu--always');
                    
                    if (hide) {
                        console.log('Menu Always: hiding menu');
                        $('body').addClass('hide-menu-now');
                        $('.wrap__left').addClass('wrap__left--hidden');
                        
                        // Если есть explorer, применяем дополнительные стили
                        if ($('.explorer').length > 0) {
                            $('.explorer').css('width', '100%');
                        }
                    } else {
                        console.log('Menu Always: showing menu');
                        $('body').removeClass('hide-menu-now');
                        $('.wrap__left').removeClass('wrap__left--hidden');
                    }
                } else {
                    console.log('Menu Always: disabled');
                    $('body').removeClass('menu--always hide-menu-now');
                    
                    if (!$('body').hasClass('menu--open')) {
                        $('.wrap__left').addClass('wrap__left--hidden');
                    } else {
                        $('.wrap__left').removeClass('wrap__left--hidden');
                    }
                }
                
                setTimeout(() => {
                    recalculateSizes();
                    $(window).trigger('resize');
                    
                    if (Lampa.Layer && Lampa.Layer.update) {
                        Lampa.Layer.update();
                    }
                }, 50);
            }

            // Обновляем значение в настройках
            function updateSettingValue() {
                let value = Lampa.Storage.field('menu_always');
                $(`.settings-param[data-name="menu_always"] .settings-param__value`).text(
                    Lampa.Lang.translate(value ? 'settings_param_yes' : 'settings_param_no')
                );
                
                $(`.settings-param[data-name="menu_always"] .settings-param__name`).each(function() {
                    if ($(this).text() === 'menu_always') {
                        $(this).text(Lampa.Lang.translate('menu_always'));
                    }
                });
            }

            // Следим за событиями
            Lampa.Listener.follow('menu', (e) => {
                if (e.type === 'toggle') {
                    setTimeout(applyMenuAlways, 50);
                }
            });

            Lampa.Listener.follow('router', (e) => {
                console.log('Route changed:', e.from, '->', e.to);
                
                if (e.to === 'main' || e.to === 'category' || e.to === 'home') {
                    setTimeout(forceShowMenu, 100);
                    setTimeout(forceShowMenu, 300);
                    setTimeout(forceShowMenu, 500);
                } else if (e.to && (e.to.includes('online') || e.to.includes('watch') || e.to.includes('torrent') || e.to.includes('explorer'))) {
                    // При переходе на онлайн режим - принудительно скрываем
                    setTimeout(forceHideMenu, 50);
                    setTimeout(forceHideMenu, 100);
                    setTimeout(forceHideMenu, 200);
                    setTimeout(forceHideMenu, 500);
                } else {
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(applyMenuAlways, 300);
                }
            });

            Lampa.Listener.follow('full', (e) => {
                console.log('Full event:', e.type);
                if (e.type === 'start') {
                    setTimeout(forceHideMenu, 50);
                    setTimeout(forceHideMenu, 100);
                    setTimeout(forceHideMenu, 200);
                    setTimeout(forceHideMenu, 500);
                } else if (e.type === 'close') {
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(applyMenuAlways, 300);
                }
            });

            Lampa.Listener.follow('player', (e) => {
                console.log('Player event:', e.type);
                if (e.type === 'start') {
                    setTimeout(forceHideMenu, 50);
                    setTimeout(forceHideMenu, 100);
                    setTimeout(forceHideMenu, 200);
                    setTimeout(forceHideMenu, 500);
                } else if (e.type === 'stop' || e.type === 'close') {
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(applyMenuAlways, 300);
                }
            });

            Lampa.Listener.follow('modal', (e) => {
                console.log('Modal event:', e.type);
                if (e.type === 'open') {
                    setTimeout(forceHideMenu, 50);
                } else if (e.type === 'close') {
                    setTimeout(applyMenuAlways, 100);
                }
            });

            Lampa.Listener.follow('back', () => {
                console.log('Back event');
                setTimeout(applyMenuAlways, 100);
                setTimeout(applyMenuAlways, 300);
            });

            // Следим за добавлением explorer в DOM
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) { // Element node
                                let $node = $(node);
                                if ($node.hasClass('explorer') || $node.find('.explorer').length > 0) {
                                    console.log('Menu Always: explorer detected in DOM');
                                    setTimeout(forceHideMenu, 10);
                                    setTimeout(forceHideMenu, 50);
                                    setTimeout(forceHideMenu, 100);
                                    setTimeout(forceHideMenu, 200);
                                }
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            Lampa.Storage.listener.follow('change', (e) => {
                if (e.name === 'menu_always') {
                    console.log('Menu Always: storage change', e.value);
                    applyMenuAlways();
                    updateSettingValue();
                }
            });

            Lampa.Listener.follow('app', (e) => {
                if (e.type === 'ready') {
                    addSettingManually();
                    
                    setTimeout(applyMenuAlways, 200);
                    setTimeout(applyMenuAlways, 500);
                    setTimeout(applyMenuAlways, 1000);
                    setTimeout(applyMenuAlways, 2000);
                    setTimeout(applyMenuAlways, 3000);
                    
                    setTimeout(updateSettingValue, 500);
                    setTimeout(updateSettingValue, 1000);
                    setTimeout(updateSettingValue, 2000);
                    setTimeout(moveParamToCorrectPosition, 1500);
                    
                    $(window).on('resize', () => {
                        clearTimeout(window.menu_always_resize);
                        window.menu_always_resize = setTimeout(recalculateSizes, 150);
                    });
                }
            });

            if (Lampa.Activity && Lampa.Activity.listener) {
                Lampa.Activity.listener.follow('change', (e) => {
                    console.log('Activity changed:', e);
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(applyMenuAlways, 300);
                });
            }

            // Периодическая проверка
            setInterval(() => {
                if (menuAlwaysVisible()) {
                    let hide = shouldHideMenu();
                    let currentHide = $('body').hasClass('hide-menu-now');
                    
                    if (hide !== currentHide) {
                        console.log('Menu Always: fixing state mismatch');
                        applyMenuAlways();
                    }
                    
                    // Если explorer есть, но меню видно - скрываем принудительно
                    if ($('.explorer').length > 0 && !currentHide) {
                        console.log('Menu Always: explorer found but menu visible, forcing hide');
                        forceHideMenu();
                    }
                }
                
                moveParamToCorrectPosition();
                updateSettingValue();
            }, 500);

            // Первоначальное применение
            addSettingManually();
            setTimeout(applyMenuAlways, 200);
            setTimeout(applyMenuAlways, 500);
            setTimeout(applyMenuAlways, 1000);
            setTimeout(applyMenuAlways, 2000);
            setTimeout(applyMenuAlways, 3000);
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
