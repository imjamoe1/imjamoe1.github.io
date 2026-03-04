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
                
                const hideCompactIn = [
                    'player', 'card', 'full', 'settings', 'search',
                    'modal', 'explorer', 'online', 'torrent', 'watch'
                ];
                
                if (component && hideCompactIn.includes(component)) {
                    return true;
                }
                
                if ($('.explorer, .full-start, .full-start__buttons, .full-info, .player-wrapper, .online-player, .torrents-box').length > 0) {
                    return true;
                }
                
                return false;
            }

            // Функция получения текущего компонента
            function getCurrentComponent() {
                if (!Lampa.Activity || !Lampa.Activity.active()) return null;
                return Lampa.Activity.active().component;
            }

            // Исправленные стили
            Lampa.Template.add('menu_always_style', `
                <style id="menu_always_style">
                    /* Режим "Всегда показывать меню" - компактный режим */
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

                    /* СКРЫВАЕМ ТОЛЬКО КОМПАКТНОЕ МЕНЮ */
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

                    /* ПОЛНОЕ МЕНЮ МОЖЕТ ОТКРЫТЬСЯ */
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

                    /* Для explorer - занимаем всю ширину */
                    body.menu--always .explorer {
                        width: 100% !important;
                        max-width: 100% !important;
                    }

                    /* Исправление для постеров и контента */
                    body.menu--always .category__grid,
                    body.menu--always .scroll__content,
                    body.menu--always .layer--width {
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

            // Функция добавления параметра в настройки
            function addSettingManually() {
                if ($('.settings-param[data-name="menu_always"]').length) return;

                const checkExist = setInterval(() => {
                    const settingsInterface = $('.settings__container[data-component="interface"]');
                    if (settingsInterface.length) {
                        clearInterval(checkExist);
                        
                        const menuText = Lampa.Lang.translate('menu_always');
                        
                        const menuItem = $(`
                            <div class="settings-param selector is--tv" data-type="toggle" data-name="menu_always">
                                <div class="settings-param__name">${menuText}</div>
                                <div class="settings-param__value">${Lampa.Lang.translate(Lampa.Storage.field('menu_always') ? 'settings_param_yes' : 'settings_param_no')}</div>
                            </div>
                        `);
                        
                        const sizeParam = settingsInterface.find('div[data-name="interface_size"]').closest('.settings-param');
                        
                        if (sizeParam.length) {
                            menuItem.insertAfter(sizeParam);
                        } else {
                            settingsInterface.prepend(menuItem);
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

            // Регистрация через SettingsApi
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
                        let boolValue = value === true || value === 'true';
                        Lampa.Storage.set('menu_always', boolValue);
                        applyMenuAlways();
                    }
                });
                
                setTimeout(moveParamToCorrectPosition, 1000);
                setTimeout(moveParamToCorrectPosition, 2000);
                setTimeout(moveParamToCorrectPosition, 3000);
            }
            
            // Функция перемещения параметра
            function moveParamToCorrectPosition() {
                let menuParam = $('.settings-param[data-name="menu_always"]');
                let sizeParam = $('div[data-name="interface_size"]').closest('.settings-param');
                
                if (menuParam.length && sizeParam.length) {
                    if (menuParam.prev().find('div[data-name="interface_size"]').length === 0) {
                        menuParam.insertAfter(sizeParam);
                    }
                    
                    let nameElem = menuParam.find('.settings-param__name');
                    if (nameElem.text() === 'menu_always') {
                        nameElem.text(Lampa.Lang.translate('menu_always'));
                    }
                }
                
                if (!Lampa.Platform.screen('tv')) {
                    menuParam.addClass('hide');
                } else {
                    menuParam.removeClass('hide');
                }
            }

            // Функция пересчета размеров - ИСПРАВЛЕННАЯ
            function recalculateSizes() {
                if (!Lampa.Activity || !Lampa.Activity.active()) return;
                
                let active = Lampa.Activity.active();
                if (!active || !active.activity) return;
                
                let render = active.activity.render(true);
                if (!render) return;
                
                let target = render instanceof jQuery ? render[0] : render;
                if (!target) return;
                
                let wrap = document.querySelector('.wrap__left');
                let head = document.querySelector('.head');
                let navi = document.querySelector('.navigation-bar');
                
                let landscape = window.innerWidth > window.innerHeight && window.innerHeight < 768;
                let head_height = head ? head.getBoundingClientRect().height : 0;
                let navi_height = navi && !landscape ? navi.getBoundingClientRect().height : 0;
                let navi_width = navi && landscape ? navi.getBoundingClientRect().width : 0;
                
                // Собираем все элементы с классами ширины/высоты
                let elements = [];
                
                // Добавляем сам target если он имеет нужные классы
                if (target.classList.contains('layer--width') || 
                    target.classList.contains('layer--height') || 
                    target.classList.contains('layer--wheight')) {
                    elements.push(target);
                }
                
                // Добавляем все дочерние элементы с этими классами
                target.querySelectorAll('.layer--width, .layer--height, .layer--wheight').forEach(elem => {
                    elements.push(elem);
                });
                
                // Определяем текущее состояние меню
                let menuAlways = menuAlwaysVisible();
                let hideCompact = shouldHideCompactMenu();
                let menuOpen = document.body.classList.contains('menu--open');
                let component = getCurrentComponent();
                
                // Вычисляем offset для контента
                let menuOffset = 0;
                
                if (menuAlways) {
                    if (menuOpen) {
                        // Если меню открыто - контент сдвигается на ширину полного меню
                        menuOffset = 15 * parseFloat(getComputedStyle(document.body).fontSize); // 15em в пикселях
                    } else if (!hideCompact) {
                        // Если компактное меню видимо - контент сдвигается на ширину компактного меню
                        menuOffset = wrap ? wrap.getBoundingClientRect().width : 0;
                    }
                    // Если hideCompact=true и menuOpen=false - offset = 0
                }
                
                // Применяем размеры к каждому элементу
                elements.forEach(elem => {
                    if (elem.classList.contains('layer--width')) {
                        // Ширина: вся ширина окна минус offset меню и ширина навигации
                        let newWidth = window.innerWidth - menuOffset - navi_width;
                        elem.style.width = newWidth + 'px';
                        
                        // Для отладки
                        if (elem.classList.contains('explorer')) {
                            console.log('Menu Always: explorer width =', newWidth, 'menuOffset =', menuOffset, 'menuOpen =', menuOpen, 'hideCompact =', hideCompact);
                        }
                    }
                    
                    if (elem.classList.contains('layer--wheight')) {
                        let heig = window.innerHeight - head_height - navi_height;
                        let mheight = elem.getAttribute('mheight');
                        if (mheight) {
                            let mheightElem = document.querySelector(mheight);
                            if (mheightElem) {
                                heig -= mheightElem.getBoundingClientRect().height;
                            }
                        }
                        elem.style.height = heig + 'px';
                    }
                    
                    if (elem.classList.contains('layer--height')) {
                        let heig = window.innerHeight;
                        let mheight = elem.getAttribute('mheight');
                        if (mheight) {
                            let mheightElem = document.querySelector(mheight);
                            if (mheightElem) {
                                heig -= mheightElem.getBoundingClientRect().height;
                            }
                        }
                        elem.style.height = heig + 'px';
                    }
                });
                
                // Специальная обработка для гридов с постерами
                target.querySelectorAll('.category__grid, .scroll__content, .content__main').forEach(elem => {
                    elem.style.width = '100%';
                });
            }

            // Функция скрытия компактного меню
            function hideCompactMenu() {
                if (!menuAlwaysVisible()) return;
                
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
                } else {
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
                    setTimeout(recalculateSizes, 100); // Дополнительный пересчет после анимации
                }
            });

            Lampa.Listener.follow('router', (e) => {
                if (e.to === 'main' || e.to === 'category' || e.to === 'home') {
                    setTimeout(showCompactMenu, 100);
                    setTimeout(showCompactMenu, 300);
                    setTimeout(recalculateSizes, 400);
                } else if (e.to && (e.to.includes('online') || e.to.includes('watch') || e.to.includes('torrent') || e.to.includes('explorer'))) {
                    setTimeout(hideCompactMenu, 50);
                    setTimeout(hideCompactMenu, 100);
                    setTimeout(recalculateSizes, 200);
                } else {
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(recalculateSizes, 200);
                }
            });

            Lampa.Listener.follow('full', (e) => {
                if (e.type === 'start') {
                    setTimeout(hideCompactMenu, 50);
                    setTimeout(recalculateSizes, 100);
                } else if (e.type === 'close') {
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(recalculateSizes, 200);
                }
            });

            Lampa.Listener.follow('player', (e) => {
                if (e.type === 'start') {
                    setTimeout(hideCompactMenu, 50);
                    setTimeout(recalculateSizes, 100);
                } else if (e.type === 'stop' || e.type === 'close') {
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(recalculateSizes, 200);
                }
            });

            Lampa.Listener.follow('modal', (e) => {
                if (e.type === 'open') {
                    setTimeout(hideCompactMenu, 50);
                } else if (e.type === 'close') {
                    setTimeout(applyMenuAlways, 100);
                }
            });

            Lampa.Listener.follow('back', () => {
                setTimeout(applyMenuAlways, 100);
                setTimeout(recalculateSizes, 200);
            });

            // Следим за добавлением explorer
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) {
                                let $node = $(node);
                                if ($node.hasClass('explorer') || $node.find('.explorer').length > 0) {
                                    setTimeout(hideCompactMenu, 10);
                                    setTimeout(recalculateSizes, 50);
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
                    
                    // Дополнительный пересчет после загрузки контента
                    setTimeout(recalculateSizes, 1000);
                    setTimeout(recalculateSizes, 2000);
                    setTimeout(recalculateSizes, 3000);
                }
            });

            if (Lampa.Activity && Lampa.Activity.listener) {
                Lampa.Activity.listener.follow('change', () => {
                    setTimeout(applyMenuAlways, 100);
                    setTimeout(recalculateSizes, 200);
                    setTimeout(recalculateSizes, 500); // Дополнительный пересчет после рендера
                });
            }

            // Периодическая проверка и пересчет
            setInterval(() => {
                if (menuAlwaysVisible()) {
                    let hideCompact = shouldHideCompactMenu();
                    let currentHideCompact = $('body').hasClass('hide-compact');
                    
                    if (hideCompact !== currentHideCompact) {
                        applyMenuAlways();
                    }
                    
                    // Всегда пересчитываем размеры для корректного отображения
                    recalculateSizes();
                }
                
                moveParamToCorrectPosition();
                updateSettingValue();
            }, 1000);

            // Пересчет при скролле
            $(window).on('scroll', () => {
                clearTimeout(window.menu_always_scroll);
                window.menu_always_scroll = setTimeout(recalculateSizes, 50);
            });

            // Первоначальное применение
            addSettingManually();
            setTimeout(applyMenuAlways, 200);
            setTimeout(applyMenuAlways, 500);
            setTimeout(applyMenuAlways, 1000);
            setTimeout(applyMenuAlways, 2000);
            setTimeout(applyMenuAlways, 3000);
            setTimeout(recalculateSizes, 4000);
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
