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

            // Функция проверки - нужно ли скрывать компактное меню
            function shouldHideCompactMenu() {
                if (!Lampa.Activity.active()) return false;
                
                let active = Lampa.Activity.active();
                let component = active.component;
                
                // Компоненты, где компактное меню должно быть скрыто
                const hideCompactIn = [
                    'player',        // Плеер
                    'card',          // Карточка фильма
                    'full',          // Полная информация
                    'settings',      // Настройки
                    'search',        // Поиск
                    'modal',         // Модальные окна
                    'explorer',      // Онлайн просмотр
                    'online',        // Онлайн
                    'torrent',       // Торренты
                    'watch'          // Просмотр
                ];
                
                // Проверяем компонент
                if (component && hideCompactIn.includes(component)) {
                    console.log('Menu Always: hiding compact menu because component =', component);
                    return true;
                }
                
                // Проверяем наличие explorer в DOM
                if ($('.explorer').length > 0) {
                    console.log('Menu Always: hiding compact menu because explorer found');
                    return true;
                }
                
                // Проверяем наличие full-screen элементов
                if ($('.full-start, .full-start__buttons, .full-info, .player-wrapper, .online-player, .torrents-box').length > 0) {
                    console.log('Menu Always: hiding compact menu because full-screen element');
                    return true;
                }
                
                return false;
            }

            // Исправленные стили
            Lampa.Template.add('menu_always_style', `
                    /* Режим "Всегда показывать меню" - компактный режим */
                    body.menu--always .wrap__left {
                        width: 6% !important;
                        margin-left: 0 !important;
                        transform: translate3d(0, 0, 0) !important;
                        visibility: visible !important;
                        display: flex !important;
                        flex-shrink: 0 !important;
                    }

                    body.menu--always .wrap__content {
                        transform: translate3d(0, 0, 0) !important;
                        margin-left: -6% !important;
                        padding-left: 6% !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }

                    /* Когда меню открыто поверх всегда видимого - как в оригинале */
                    body.menu--always.menu--open .wrap__left {
                        width: 15em !important;
                        margin-left: -15em !important;
                        transform: translate3d(15em, 0, 0) !important;
                    }

                    body.menu--always.menu--open .wrap__content {
                        transform: translate3d(15em, 0, 0) !important;
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                        width: calc(100% - 15em) !important;
                    }

                    /* Скрываем меню когда оно не нужно */
                    body:not(.menu--always) .wrap__left.wrap__left--hidden {
                        visibility: hidden !important;
                    }
                    
                    /* Для правильного позиционирования контента */
                    body.menu--always .wrap__content .scroll__content,
                    body.menu--always .wrap__content .content__main {
                        width: 100% !important;
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
                
                // Определяем offset для меню
                let menuOffset = 0;
                if (menuAlwaysVisible() && !shouldHideCompactMenu()) {
                    menuOffset = menu_width;
                }
                
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

            // Функция скрытия компактного меню
            function hideCompactMenu() {
                if (!menuAlwaysVisible()) return;
                
                console.log('Menu Always: hiding compact menu');
                
                $('body').addClass('menu--always hide-compact');
                
                setTimeout(() => {
                    recalculateSizes();
                    $(window).trigger('resize');
                    
                    if (Lampa.Layer && Lampa.Layer.update) {
                        Lampa.Layer.update();
                    }
                }, 10);
            }

            // Функция показа компактного меню
            function showCompactMenu() {
                if (!menuAlwaysVisible()) return;
                
                console.log('Menu Always: showing compact menu');
                
                $('body').addClass('menu--always');
                $('body').removeClass('hide-compact');
                
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
                    let hideCompact = shouldHideCompactMenu();
                    
                    $('body').addClass('menu--always');
                    
                    if (hideCompact) {
                        console.log('Menu Always: hiding compact menu');
                        $('body').addClass('hide-compact');
                    } else {
                        console.log('Menu Always: showing compact menu');
                        $('body').removeClass('hide-compact');
                    }
                } else {
                    console.log('Menu Always: disabled');
                    $('body').removeClass('menu--always hide-compact');
                    
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
                    setTimeout(showCompactMenu, 100);
                    setTimeout(showCompactMenu, 300);
                    setTimeout(showCompactMenu, 500);
                } else if (e.to && (e.to.includes('online') || e.to.includes('watch') || e.to.includes('torrent') || e.to.includes('explorer'))) {
                    // При переходе на онлайн режим - скрываем компактное меню
                    setTimeout(hideCompactMenu, 50);
                    setTimeout(hideCompactMenu, 100);
                    setTimeout(hideCompactMenu, 200);
                } else {
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(applyMenuAlways, 300);
                }
            });

            Lampa.Listener.follow('full', (e) => {
                console.log('Full event:', e.type);
                if (e.type === 'start') {
                    setTimeout(hideCompactMenu, 50);
                    setTimeout(hideCompactMenu, 100);
                    setTimeout(hideCompactMenu, 200);
                } else if (e.type === 'close') {
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(applyMenuAlways, 300);
                }
            });

            Lampa.Listener.follow('player', (e) => {
                console.log('Player event:', e.type);
                if (e.type === 'start') {
                    setTimeout(hideCompactMenu, 50);
                    setTimeout(hideCompactMenu, 100);
                    setTimeout(hideCompactMenu, 200);
                } else if (e.type === 'stop' || e.type === 'close') {
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(applyMenuAlways, 300);
                }
            });

            Lampa.Listener.follow('modal', (e) => {
                console.log('Modal event:', e.type);
                if (e.type === 'open') {
                    setTimeout(hideCompactMenu, 50);
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
                                    setTimeout(hideCompactMenu, 10);
                                    setTimeout(hideCompactMenu, 50);
                                    setTimeout(hideCompactMenu, 100);
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
                    let hideCompact = shouldHideCompactMenu();
                    let currentHideCompact = $('body').hasClass('hide-compact');
                    
                    if (hideCompact !== currentHideCompact) {
                        console.log('Menu Always: fixing state mismatch');
                        applyMenuAlways();
                    }
                }
                
                moveParamToCorrectPosition();
                updateSettingValue();
            }, 1000);

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
