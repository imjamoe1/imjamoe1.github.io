(function() {
    'use strict';

    var EXCLUDED_CLASSES = ['button--play', 'button--edit-order', 'button--color'];
    
    var DEFAULT_GROUPS = [
        { name: 'online', patterns: ['online', 'lampac', 'modss', 'showy'], label: 'Онлайн' },
        { name: 'torrent', patterns: ['torrent'], label: 'Торренты' },
        { name: 'trailer', patterns: ['trailer', 'rutube'], label: 'Трейлеры' },
        { name: 'rating', patterns: ['rating'], label: 'Оценить' },
        { name: 'favorite', patterns: ['favorite'], label: 'Избранное' },
        { name: 'subscribe', patterns: ['subscribe'], label: 'Подписка' },
        { name: 'book', patterns: ['book'], label: 'Закладки' },
        { name: 'reaction', patterns: ['reaction'], label: 'Реакции' },
        { name: 'network', patterns: ['network'], label: 'Network' },
        { name: 'plaftorms', patterns: ['plaftorms', 'platforms'], label: 'Платформы' },
        { name: 'other', patterns: [], label: 'Другие' }
    ];

    var MODES = {
        default: 'Стандартный',
        icons: 'Только иконки',
        always: 'С текстом'
    };

    var currentButtons = [];
    var allButtonsCache = [];
    var allButtonsOriginal = [];
    var currentContainer = null;
    var platformsObserver = null;

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

    function findButton(btnId) {
        var btn = allButtonsOriginal.find(function(b) { return getButtonId(b) === btnId; });
        if (!btn) {
            btn = allButtonsCache.find(function(b) { return getButtonId(b) === btnId; });
        }
        return btn;
    }

    function getButtonsInColors() {
        var colors = getColors();
        var buttonsInColors = [];
        colors.forEach(function(color) {
            buttonsInColors = buttonsInColors.concat(color.buttons);
        });
        return buttonsInColors;
    }

    // ========== ХРАНЕНИЕ ДАННЫХ ==========

    function getCustomOrder() {
        return Lampa.Storage.get('button_custom_order', []) || [];
    }

    function setCustomOrder(order) {
        Lampa.Storage.set('button_custom_order', order || []);
    }

    function getItemOrder() {
        return Lampa.Storage.get('button_item_order', []) || [];
    }

    function setItemOrder(order) {
        Lampa.Storage.set('button_item_order', order || []);
    }

    function getHiddenButtons() {
        return Lampa.Storage.get('button_hidden', []) || [];
    }

    function setHiddenButtons(hidden) {
        Lampa.Storage.set('button_hidden', hidden || []);
    }

    function getColors() {
        return Lampa.Storage.get('button_colors', []) || [];
    }

    function setColors(colors) {
        Lampa.Storage.set('button_colors', colors || []);
    }

    function getViewMode() {
        return Lampa.Storage.get('buttons_viewmode', 'default');
    }

    function setViewMode(mode) {
        Lampa.Storage.set('buttons_viewmode', mode);
    }

    function getRenamedButtons() {
        var renamed = Lampa.Storage.get('button_renamed', {});
        if (typeof renamed !== 'object' || renamed === null) {
            renamed = {};
        }
        return renamed;
    }

    function setRenamedButtons(renamed) {
        if (typeof renamed === 'object' && renamed !== null) {
            Lampa.Storage.set('button_renamed', renamed);
        } else {
            Lampa.Storage.set('button_renamed', {});
        }
    }

    function getColoredLogos() {
        return Lampa.Storage.get('buttons_colored_logos', false);
    }

    function setColoredLogos(enabled) {
        Lampa.Storage.set('buttons_colored_logos', enabled);
        applyColoredIcons();
    }

    // ========== ФУНКЦИИ ДЛЯ ЦВЕТНЫХ ИКОНОК ==========

    function applyColoredIcons() {
        if (!currentContainer) return;
        
        var coloredLogos = getColoredLogos();
        
        if (coloredLogos) {
            // Включаем цветные иконки
            replaceIcons();
            
            // Наблюдатель за изменениями DOM
            setupIconObserver();
        } else {
            // Выключаем цветные иконки - возвращаем оригинальные
            restoreOriginalIcons();
            
            // Останавливаем наблюдение
            if (window.iconObserver) {
                window.iconObserver.disconnect();
                window.iconObserver = null;
            }
        }
    }

    function replaceIcons() {
        if (!currentContainer) return;
        
        // Замена онлайн-иконок
        currentContainer.find('.full-start__button.view--online svg').each(function() {
            var svg = $(this);
            if (!svg.attr('data-replaced')) {
                var newSvg = `
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' data-replaced='true'>
                        <path fill='#2196f3' d='M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z'/>
                    </svg>
                `;
                svg.replaceWith(newSvg);
            }
        });

        // Замена торрент-иконок
        currentContainer.find('.full-start__button.view--torrent svg').each(function() {
            var svg = $(this);
            if (!svg.attr('data-replaced')) {
                var newSvg = `
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='2 2 42 42' width='48' height='48' data-replaced='true'>
                        <path fill='#4caf50' fill-rule='evenodd' d='M23.501,44.125c11.016,0,20-8.984,20-20 c0-11.015-8.984-20-20-20c-11.016,0-20,8.985-20,20C3.501,35.141,12.485,44.125,23.501,44.125z' clip-rule='evenodd'/>
                        <path fill='#fff' fill-rule='evenodd' d='M43.252,27.114C39.718,25.992,38.055,19.625,34,11l-7,1.077 c1.615,4.905,8.781,16.872,0.728,18.853C20.825,32.722,17.573,20.519,15,14l-8,2l10.178,27.081c1.991,0.67,4.112,1.044,6.323,1.044 c0.982,0,1.941-0.094,2.885-0.232l-4.443-8.376c6.868,1.552,12.308-0.869,12.962-6.203c1.727,2.29,4.089,3.183,6.734,3.172 C42.419,30.807,42.965,29.006,43.252,27.114z' clip-rule='evenodd'/>
                    </svg>
                `;
                svg.replaceWith(newSvg);
            }
        });

        // Замена трейлер-иконок
        currentContainer.find('.full-start__button.view--trailer svg').each(function() {
            var svg = $(this);
            if (!svg.attr('data-replaced')) {
                var newSvg = `
                    <svg height='70' viewBox='0 0 80 70' fill='#f44336' xmlns='http://www.w3.org/2000/svg' data-replaced='true'>
                        <path fill-rule='evenodd' clip-rule='evenodd' d='M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955Z'/>
                        <path fill='white' d='M55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z'/>
                    </svg>
                `;
                svg.replaceWith(newSvg);
            }
        });

        // Замена платформы-иконок
        currentContainer.find('.full-start__button.button--plaftorms svg').each(function() {
            var svg = $(this);
            if (!svg.attr('data-replaced')) {
                var newSvg = `
                    <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="512.000000pt" height="512.000000pt" viewBox="0 0 512.000000 512.000000">
                        <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="currentColor">
                            <path d="M895 4306 c-16 -7 -59 -44 -95 -82 -284 -302 -487 -669 -586 -1060 -57 -227 -69 -330 -69 -604 0 -274 12 -377 69 -604 86 -339 253 -666 483 -943 156 -189 209 -225 300 -208 49 9 109 69 118 118 13 67 -1 103 -72 180 -389 422 -583 908 -583 1457 0 551 193 1032 584 1459 45 48 67 81 72 105 24 131 -102 234 -221 182z"/>
                            <path d="M4095 4306 c-41 -18 -83 -69 -91 -111 -12 -65 3 -102 73 -178 388 -422 583 -909 583 -1457 0 -548 -195 -1035 -583 -1457 -71 -77 -85 -113 -72 -180 9 -49 69 -109 118 -118 77 -15 105 -1 199 96 272 279 482 659 583 1053 58 225 70 331 70 606 0 275 -12 381 -70 606 -101 394 -301 756 -585 1058 -88 94 -148 116 -225 82z"/>
                            <path d="M1525 3695 c-83 -28 -274 -269 -364 -458 -53 -111 -95 -234 -123 -358 -20 -91 -23 -130 -23 -319 0 -189 3 -228 23 -319 28 -124 70 -247 123 -358 92 -193 290 -440 371 -461 102 -27 198 46 198 151 0 60 -8 76 -83 157 -32 36 -83 101 -112 145 -142 215 -205 425 -205 685 0 260 63 470 205 685 29 44 80 109 112 145 75 81 83 97 83 158 0 107 -103 181 -205 147z"/>
                            <path d ="M3513 3700 c-76 -17 -123 -76 -123 -153 0 -60 8 -76 83 -157 153 -168 262 -390 302 -614 19 -114 19 -318 0 -432 -40 -224 -149 -446 -302 -614 -75 -81 -83 -97 -83 -157 0 -105 96 -178 198 -151 81 21 279 268 371 461 53 111 95 234 123 358 20 91 23 130 23 319 0 189 -3 228 -23 319 -61 273 -193 531 -367 719 -88 95 -133 118 -202 102z"/>
                            <path d="M2435 3235 c-417 -77 -668 -518 -519 -912 111 -298 421 -488 723 -445 326 46 557 277 603 603 41 289 -136 595 -412 710 -130 55 -260 69 -395 44z m197 -316 c77 -17 137 -50 190 -107 57 -61 83 -110 98 -190 22 -111 -12 -222 -96 -312 -138 -148 -359 -156 -510 -18 -96 88 -138 210 -114 330 16 82 42 132 99 191 52 55 97 81 174 102 65 17 92 18 159 4z"/>
                        </g>
                    </svg>
                `;
                svg.replaceWith(newSvg);
            }
        });
    }

    function restoreOriginalIcons() {
        if (!currentContainer) return;
        
        // Удаляем замененные иконки
        currentContainer.find('svg[data-replaced="true"]').each(function() {
            var $this = $(this);
            var $button = $this.closest('.full-start__button');
            
            // Находим оригинальную иконку
            var btnId = getButtonId($button);
            var originalBtn = findButton(btnId);
            
            if (originalBtn) {
                var originalIcon = originalBtn.find('svg').first();
                if (originalIcon.length) {
                    $this.replaceWith(originalIcon.clone());
                }
            }
        });
    }

    function setupIconObserver() {
        if (window.iconObserver) {
            window.iconObserver.disconnect();
        }
        
        // Наблюдатель за изменениями DOM для обновления иконок
        var observer = new MutationObserver(function(mutations) {
            var shouldUpdate = false;
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        if (node.nodeType === 1) {
                            var $node = $(node);
                            if ($node.hasClass('full-start__button') || 
                                $node.find('.full-start__button').length > 0) {
                                shouldUpdate = true;
                                break;
                            }
                        }
                    }
                }
            });
            
            if (shouldUpdate) {
                setTimeout(function() {
                    if (getColoredLogos()) {
                        replaceIcons();
                    }
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        window.iconObserver = observer;
    }

    // ========== РАБОТА С КНОПКАМИ ==========

    function generateButtonId(button) {
        var classes = button.attr('class') || '';
        var text = button.find('span').text().trim().replace(/\s+/g, '_');
        var subtitle = button.attr('data-subtitle') || '';
        
        if (classes.indexOf('modss') !== -1 || text.indexOf('MODS') !== -1 || text.indexOf('MOD') !== -1) {
            return 'modss_online_button';
        }
        
        if (classes.indexOf('showy') !== -1 || text.indexOf('Showy') !== -1) {
            return 'showy_online_button';
        }
        
        var viewClasses = classes.split(' ').filter(function(c) { 
            return c.indexOf('view--') === 0 || c.indexOf('button--') === 0; 
        }).join('_');
        
        if (!viewClasses && !text) {
            return 'button_unknown_' + Math.random().toString(36).substr(2, 9);
        }
        
        var id = viewClasses + '_' + text;
        
        if (subtitle) {
            id = id + '_' + subtitle.replace(/\s+/g, '_').substring(0, 30);
        }
        
        return id;
    }

    function getButtonId(button) {
        var stableId = button.attr('data-stable-id');
        if (!stableId) {
            stableId = generateButtonId(button);
            button.attr('data-stable-id', stableId);
        }
        return stableId;
    }

    function applyRenamedButtons(buttons) {
        var renamed = getRenamedButtons();
        buttons.forEach(function(btn) {
            var id = getButtonId(btn);
            if (renamed.hasOwnProperty(id)) {
                if (renamed[id] === '') {
                    btn.addClass('button-empty');
                    btn.find('span').remove();
                    btn.contents().filter(function() {
                        return this.nodeType === 3 && this.textContent.trim() !== '';
                    }).remove();
                } else {
                    btn.removeClass('button-empty');
                    var span = btn.find('span').first();
                    if (span.length) {
                        span.text(renamed[id]);
                    } else {
                        var icon = btn.find('svg').first();
                        if (icon.length) {
                            icon.after('<span>' + renamed[id] + '</span>');
                        } else {
                            btn.append('<span>' + renamed[id] + '</span>');
                        }
                    }
                }
            }
        });
    }

    function getButtonType(button) {
        var classes = button.attr('class') || '';
        
        for (var i = 0; i < DEFAULT_GROUPS.length; i++) {
            var group = DEFAULT_GROUPS[i];
            for (var j = 0; j < group.patterns.length; j++) {
                if (group.patterns[j] && classes.indexOf(group.patterns[j]) !== -1) {
                    return group.name;
                }
            }
        }
        
        return 'other';
    }

    function isExcluded(button) {
        var classes = button.attr('class') || '';
        for (var i = 0; i < EXCLUDED_CLASSES.length; i++) {
            if (classes.indexOf(EXCLUDED_CLASSES[i]) !== -1) {
                return true;
            }
        }
        return false;
    }

    function categorizeButtons(container) {
        var allButtons = container.find('.full-start__button').not('.button--edit-order, .button--color, .button--play');
        
        var categories = {
            online: [],
            torrent: [],
            trailer: [],
            rating: [],
            favorite: [],
            subscribe: [],
            book: [],
            reaction: [],
            network: [],
            plaftorms: [],
            other: []
        };

        allButtons.each(function() {
            var $btn = $(this);
            
            if (isExcluded($btn)) return;

            var type = getButtonType($btn);
            
            if (categories[type]) {
                categories[type].push($btn);
            } else {
                categories.other.push($btn);
            }
        });

        return categories;
    }

    function sortByCustomOrder(buttons) {
        var customOrder = getCustomOrder();
        
        var priority = [];
        var regular = [];
        
        buttons.forEach(function(btn) {
            var id = getButtonId(btn);
            if (id === 'modss_online_button' || id === 'showy_online_button') {
                priority.push(btn);
            } else {
                regular.push(btn);
            }
        });
        
        priority.sort(function(a, b) {
            var idA = getButtonId(a);
            var idB = getButtonId(b);
            if (idA === 'modss_online_button') return -1;
            if (idB === 'modss_online_button') return 1;
            if (idA === 'showy_online_button') return -1;
            if (idB === 'showy_online_button') return 1;
            return 0;
        });
        
        if (!customOrder.length) {
            regular.sort(function(a, b) {
                var typeOrder = ['online', 'torrent', 'trailer', 'rating', 'favorite', 'subscribe', 'book', 'reaction', 'network', 'plaftorms', 'other'];
                var typeA = getButtonType(a);
                var typeB = getButtonType(b);
                var indexA = typeOrder.indexOf(typeA);
                var indexB = typeOrder.indexOf(typeB);
                if (indexA === -1) indexA = 999;
                if (indexB === -1) indexB = 999;
                return indexA - indexB;
            });
            return priority.concat(regular);
        }

        var sorted = [];
        var remaining = regular.slice();

        customOrder.forEach(function(id) {
            for (var i = 0; i < remaining.length; i++) {
                if (getButtonId(remaining[i]) === id) {
                    sorted.push(remaining[i]);
                    remaining.splice(i, 1);
                    break;
                }
            }
        });

        return priority.concat(sorted).concat(remaining);
    }

    function applyHiddenButtons(buttons) {
        var hidden = getHiddenButtons();
        buttons.forEach(function(btn) {
            var id = getButtonId(btn);
            btn.toggleClass('hidden', hidden.indexOf(id) !== -1);
        });
    }

    function applyButtonAnimation(buttons) {
        buttons.forEach(function(btn, index) {
            // Пропускаем кнопку платформ
            if (btn.hasClass('button--plaftorms')) {
                btn.css('opacity', '1');  // Сразу делаем видимой
                return;
            }
            btn.css({
                'opacity': '0',
                'animation': 'button-fade-in 0.4s ease forwards',
                'animation-delay': (index * 0.08) + 's'
            });
        });
    }

    // ========== ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ==========

    function createEditButton() {
        var btn = $('<div class="full-start__button selector button--edit-order" style="order: 9999;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 29" fill="none"><use xlink:href="#sprite-edit"></use></svg>' +
            '</div>');

        btn.on('hover:enter', function() {
            openEditDialog();
        });

        if (Lampa.Storage.get('buttons_editor_enabled') === false) {
            btn.hide();
        }

        return btn;
    }

    function capitalize(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function getButtonDisplayName(btn, allButtons) {
        var btnId = getButtonId(btn);
        var renamedButtons = getRenamedButtons();

        if (renamedButtons.hasOwnProperty(btnId)) {
            if (renamedButtons[btnId] === '') {
                return '<span style="opacity:0.5"><i>(без текста)</i></span>';
            }
            return renamedButtons[btnId];
        }

        var text = btn.find('span').text().trim();
        var classes = btn.attr('class') || '';
        var subtitle = btn.attr('data-subtitle') || '';
        
        if (!text) {
            var viewClass = classes.split(' ').find(function(c) { 
                return c.indexOf('view--') === 0 || c.indexOf('button--') === 0; 
            });
            if (viewClass) {
                text = viewClass.replace('view--', '').replace('button--', '').replace(/_/g, ' ');
                text = capitalize(text);
            } else {
                text = 'Кнопка';
            }
            return text;
        }
        
        var sameTextCount = 0;
        allButtons.forEach(function(otherBtn) {
            if (otherBtn.find('span').text().trim() === text) {
                sameTextCount++;
            }
        });
        
        if (sameTextCount > 1) {
            if (subtitle) {
                return text + ' <span style="opacity:0.5">(' + subtitle.substring(0, 30) + ')</span>';
            }
            
            var viewClass = classes.split(' ').find(function(c) { 
                return c.indexOf('view--') === 0; 
            });
            if (viewClass) {
                var identifier = viewClass.replace('view--', '').replace(/_/g, ' ');
                identifier = capitalize(identifier);
                return text + ' <span style="opacity:0.5">(' + identifier + ')</span>';
            }
        }
        
        return text;
    }

    // ========== СОХРАНЕНИЕ ПОРЯДКА ==========

    function saveOrder() {
        var order = [];
        currentButtons.forEach(function(btn) {
            order.push(getButtonId(btn));
        });
        setCustomOrder(order);
    }

    function saveItemOrder() {
        var order = [];
        var items = $('.menu-edit-list .menu-edit-list__item').not('.colored-logos-switch, .viewmode-switch, .color-reset-button');
        
        items.each(function() {
            var $item = $(this);
            var itemType = $item.data('itemType');
            
            if (itemType === 'color') {
                order.push({
                    type: 'color',
                    id: $item.data('colorId')
                });
            } else if (itemType === 'button') {
                order.push({
                    type: 'button',
                    id: $item.data('buttonId')
                });
            }
        });
        
        setItemOrder(order);
    }

    // ========== ДИАЛОГИ ==========

    function openEditDialog() {
        if (currentContainer) {
            var categories = categorizeButtons(currentContainer);
            var allButtons = []
                .concat(categories.online)
                .concat(categories.torrent)
                .concat(categories.trailer)
                .concat(categories.rating)
                .concat(categories.favorite)
                .concat(categories.subscribe)
                .concat(categories.book)
                .concat(categories.reaction)
                .concat(categories.network)
                .concat(categories.plaftorms)
                .concat(categories.other);
            
            allButtons = sortByCustomOrder(allButtons);
            allButtonsCache = allButtons;
            
            var colors = getColors();
            var buttonsInColors = [];
            colors.forEach(function(color) {
                buttonsInColors = buttonsInColors.concat(color.buttons);
            });
            
            var filteredButtons = allButtons.filter(function(btn) {
                return buttonsInColors.indexOf(getButtonId(btn)) === -1;
            });
            
            currentButtons = filteredButtons;
        }
        
        var list = $('<div class="menu-edit-list"></div>');
        var hidden = getHiddenButtons();
        var colors = getColors();
        var itemOrder = getItemOrder();

        // Добавляем переключатель режимов отображения
        var currentMode = getViewMode();
        var modeBtn = $('<div class="selector viewmode-switch">' +
            '<div style="text-align: center; padding: 1em;">Вид кнопок: ' + MODES[currentMode] + '</div>' +
            '</div>');
        
        modeBtn.on('hover:enter', function() {
            var modes = Object.keys(MODES);
            var idx = modes.indexOf(currentMode);
            idx = (idx + 1) % modes.length;
            currentMode = modes[idx];
            setViewMode(currentMode);
            $(this).find('div').text('Вид кнопок: ' + MODES[currentMode]);
            
            if (currentContainer) {
                var target = currentContainer.find('.full-start-new__buttons');
                target.removeClass('icons-only always-text');
                if (currentMode === 'icons') target.addClass('icons-only');
                if (currentMode === 'always') target.addClass('always-text');
            }
        });
        
        list.append(modeBtn);

        // Добавляем переключатель цветных логотипов
        var coloredLogos = getColoredLogos();
        var logosBtn = $('<div class="selector colored-logos-switch">' +
            '<div style="text-align: center; padding: 1em;">Цветные лого: ' + (coloredLogos ? 'Да' : 'Нет') + '</div>' +
            '</div>');
        
        logosBtn.on('hover:enter', function() {
            var newValue = !coloredLogos;
            setColoredLogos(newValue);
            coloredLogos = newValue;
            $(this).find('div').text('Цветные лого: ' + (coloredLogos ? 'Да' : 'Нет'));
        });
        
        list.append(logosBtn);

        function createColorItem(color) {
            var item = $('<div class="menu-edit-list__item color-item">' +
                '<div class="menu-edit-list__icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
                    '</svg>' +
                '</div>' +
                '<div class="menu-edit-list__title">' + (color.name || 'Цвет') + ' <span style="opacity:0.5">(' + color.buttons.length + ')</span></div>' +
                '<div class="menu-edit-list__move move-up selector">' +
                    '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="menu-edit-list__move move-down selector">' +
                    '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="menu-edit-list__edit-content selector">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<line x1="8" y1="6" x2="21" y2="6"></line>' +
                        '<line x1="8" y1="12" x2="21" y2="12"></line>' +
                        '<line x1="8" y1="18" x2="21" y2="18"></line>' +
                        '<line x1="3" y1="6" x2="3.01" y2="6"></line>' +
                        '<line x1="3" y1="12" x2="3.01" y2="12"></line>' +
                        '<line x1="3" y1="18" x2="3.01" y2="18"></line>' +
                    '</svg>' +
                '</div>' +
                '<div class="menu-edit-list__rename selector">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" fill="none"><use xlink:href="#sprite-edit"></use></svg>' +
                '</div>' +
                '<div class="menu-edit-list__delete selector">' +
                    '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
                        '<path d="M9.5 9.5L16.5 16.5M16.5 9.5L9.5 16.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
                    '</svg>' +
                '</div>' +
            '</div>');

            item.data('colorId', color.id);
            item.data('itemType', 'color');

            item.find('.menu-edit-list__edit-content').on('hover:enter', function() {
                Lampa.Modal.close();
                setTimeout(function() {
                    openColorEditDialog(color);
                }, 100);
            });

            item.find('.move-up').on('hover:enter', function() {
                var prev = item.prev();
                while (prev.length && (prev.hasClass('colored-logos-switch') || prev.hasClass('viewmode-switch'))) {
                    prev = prev.prev();
                }
                if (prev.length) {
                    item.insertBefore(prev);
                    saveItemOrder();
                }
            });

            item.find('.move-down').on('hover:enter', function() {
                var next = item.next();
                while (next.length && next.hasClass('color-reset-button')) {
                    next = next.next();
                }
                if (next.length && !next.hasClass('color-reset-button')) {
                    item.insertAfter(next);
                    saveItemOrder();
                }
            });

            item.find('.menu-edit-list__rename').on('hover:enter', function() {
                Lampa.Modal.close();
                setTimeout(function() {
                    Lampa.Input.edit({
                        title: 'Переименовать цвет',
                        value: color.name || '',
                        free: true,
                        nosave: true,
                        nomic: true,
                        placeholder: 'Оставьте пустым для цвета без названия'
                    }, function(newName) {
                        if (newName !== null) {
                            var colors = getColors();
                            var targetColor = colors.find(function(f) { return f.id === color.id; });
                            if (targetColor) {
                                targetColor.name = newName.trim();
                                setColors(colors);
                                Lampa.Noty.show('Цвет переименован');
                            }
                        }
                        openEditDialog();
                    });
                }, 100);
            });

            item.find('.menu-edit-list__delete').on('hover:enter', function() {
                var colorId = color.id;
                var colorButtons = color.buttons.slice();
                
                deleteColor(colorId);
                
                var itemOrder = getItemOrder();
                var newItemOrder = [];
                
                for (var i = 0; i < itemOrder.length; i++) {
                    if (itemOrder[i].type === 'color' && itemOrder[i].id === colorId) {
                        continue;
                    }
                    if (itemOrder[i].type === 'button') {
                        var isInColor = false;
                        for (var j = 0; j < colorButtons.length; j++) {
                            if (itemOrder[i].id === colorButtons[j]) {
                                isInColor = true;
                                break;
                            }
                        }
                        if (isInColor) {
                            continue;
                        }
                    }
                    newItemOrder.push(itemOrder[i]);
                }
                
                setItemOrder(newItemOrder);
                
                var customOrder = getCustomOrder();
                var newCustomOrder = [];
                for (var i = 0; i < customOrder.length; i++) {
                    var found = false;
                    for (var j = 0; j < colorButtons.length; j++) {
                        if (customOrder[i] === colorButtons[j]) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        newCustomOrder.push(customOrder[i]);
                    }
                }
                setCustomOrder(newCustomOrder);
                
                item.remove();
                Lampa.Noty.show('Цвет удален');
                
                setTimeout(function() {
                    if (currentContainer) {
                        currentContainer.data('buttons-processed', false);
                        reorderButtons(currentContainer);
                        setTimeout(function() {
                            openEditDialog();
                        }, 100);
                    }
                }, 50);
            });
            
            return item;
        }

        function createButtonItem(btn) {
            var displayName = getButtonDisplayName(btn, currentButtons);
            var icon = btn.find('svg').clone();
            var btnId = getButtonId(btn);
            var isHidden = hidden.indexOf(btnId) !== -1;

            var item = $('<div class="menu-edit-list__item">' +
                '<div class="menu-edit-list__icon"></div>' +
                '<div class="menu-edit-list__title">' + displayName + '</div>' +
                '<div class="menu-edit-list__move move-up selector">' +
                    '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="menu-edit-list__move move-down selector">' +
                    '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="menu-edit-list__rename selector">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" fill="none"><use xlink:href="#sprite-edit"></use></svg>' +
                '</div>' +
                '<div class="menu-edit-list__toggle toggle selector">' +
                    '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
                        '<path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="' + (isHidden ? '0' : '1') + '" stroke-linecap="round"/>' +
                    '</svg>' +
                '</div>' +
            '</div>');

            item.find('.menu-edit-list__icon').append(icon);
            item.data('button', btn);
            item.data('buttonId', btnId);
            item.data('itemType', 'button');

            item.find('.move-up').on('hover:enter', function() {
                var prev = item.prev();
                while (prev.length && (prev.hasClass('colored-logos-switch') || prev.hasClass('viewmode-switch'))) {
                    prev = prev.prev();
                }
                if (prev.length) {
                    item.insertBefore(prev);
                    var btnIndex = currentButtons.indexOf(btn);
                    if (btnIndex > 0) {
                        currentButtons.splice(btnIndex, 1);
                        currentButtons.splice(btnIndex - 1, 0, btn);
                    }
                    saveItemOrder();
                }
            });

            item.find('.move-down').on('hover:enter', function() {
                var next = item.next();
                while (next.length && next.hasClass('color-reset-button')) {
                    next = next.next();
                }
                if (next.length && !next.hasClass('color-reset-button')) {
                    item.insertAfter(next);
                    var btnIndex = currentButtons.indexOf(btn);
                    if (btnIndex < currentButtons.length - 1) {
                        currentButtons.splice(btnIndex, 1);
                        currentButtons.splice(btnIndex + 1, 0, btn);
                    }
                    saveItemOrder();
                }
            });

            item.find('.menu-edit-list__rename').on('hover:enter', function() {
                var currentName = getButtonDisplayName(btn, currentButtons).replace(/<[^>]*>/g, '');
                currentName = currentName.replace('(без текста)', '').trim();
                
                Lampa.Modal.close();
                setTimeout(function() {
                    Lampa.Input.edit({
                        free: true,
                        title: 'Новое название кнопки',
                        nosave: true,
                        value: currentName,
                        nomic: true,
                        placeholder: 'Оставьте пустым для удаления текста'
                    }, function(newName) {
                        if (newName !== null) {
                            var renamedButtons = getRenamedButtons();
                            renamedButtons[btnId] = newName.trim();
                            setRenamedButtons(renamedButtons);
                            Lampa.Noty.show('Кнопка переименована');
                        }
                        openEditDialog();
                    });
                }, 100);
            });

            item.find('.toggle').on('hover:enter', function() {
                var hidden = getHiddenButtons();
                var index = hidden.indexOf(btnId);
                
                if (index !== -1) {
                    hidden.splice(index, 1);
                    btn.removeClass('hidden');
                    item.find('.dot').attr('opacity', '1');
                } else {
                    hidden.push(btnId);
                    btn.addClass('hidden');
                    item.find('.dot').attr('opacity', '0');
                }
                
                setHiddenButtons(hidden);
            });
            
            return item;
        }
        
        if (itemOrder.length > 0) {
            itemOrder.forEach(function(item) {
                if (item.type === 'color') {
                    var color = colors.find(function(f) { return f.id === item.id; });
                    if (color) {
                        list.append(createColorItem(color));
                    }
                } else if (item.type === 'button') {
                    var btn = currentButtons.find(function(b) { return getButtonId(b) === item.id; });
                    if (btn) {
                        list.append(createButtonItem(btn));
                    }
                }
            });
            
            currentButtons.forEach(function(btn) {
                var btnId = getButtonId(btn);
                var found = itemOrder.some(function(item) {
                    return item.type === 'button' && item.id === btnId;
                });
                if (!found) {
                    list.append(createButtonItem(btn));
                }
            });
            
            colors.forEach(function(color) {
                var found = itemOrder.some(function(item) {
                    return item.type === 'color' && item.id === color.id;
                });
                if (!found) {
                    list.append(createColorItem(color));
                }
            });
        } else {
            colors.forEach(function(color) {
                list.append(createColorItem(color));
            });
            
            currentButtons.forEach(function(btn) {
                list.append(createButtonItem(btn));
            });
        }

        var resetBtn = $('<div class="selector color-reset-button">' +
            '<div style="text-align: center; padding: 1em;">Сбросить по умолчанию</div>' +
        '</div>');
        
        resetBtn.on('hover:enter', function() {
            Lampa.Storage.set('button_renamed', {});
            Lampa.Storage.set('button_custom_order', []);
            Lampa.Storage.set('button_hidden', []);
            Lampa.Storage.set('button_colors', []);
            Lampa.Storage.set('button_item_order', []);
            Lampa.Storage.set('buttons_viewmode', 'default');
            Lampa.Storage.set('buttons_colored_logos', false);
            Lampa.Modal.close();
            Lampa.Noty.show('Настройки сброшены');
            
            setTimeout(function() {
                if (currentContainer) {
                    currentContainer.find('.button--play, .button--edit-order, .button--color').remove();
                    currentContainer.data('buttons-processed', false);
                    
                    var targetContainer = currentContainer.find('.full-start-new__buttons');
                    var existingButtons = targetContainer.find('.full-start__button').toArray();
                    
                    allButtonsOriginal.forEach(function(originalBtn) {
                        var btnId = getButtonId(originalBtn);
                        var exists = false;
                        
                        for (var i = 0; i < existingButtons.length; i++) {
                            if (getButtonId($(existingButtons[i])) === btnId) {
                                exists = true;
                                break;
                            }
                        }
                        
                        if (!exists) {
                            var clonedBtn = originalBtn.clone(true, true);
                            clonedBtn.css({
                                'opacity': '1',
                                'animation': 'none'
                            });
                            targetContainer.append(clonedBtn);
                        }
                    });
                    
                    reorderButtons(currentContainer);
                    refreshController();
                }
            }, 100);
        });

        list.append(resetBtn);

        Lampa.Modal.open({
            title: 'Порядок кнопок',
            html: list,
            size: 'small',
            scroll_to_center: true,
            onBack: function() {
                Lampa.Modal.close();
                applyChanges();
                Lampa.Controller.toggle('full_start');
            }
        });
    }

    // ========== ОСНОВНАЯ ЛОГИКА ==========

    function applyChanges() {
        if (!currentContainer) return;
        
        var categories = categorizeButtons(currentContainer);
        var allButtons = []
                .concat(categories.online)
                .concat(categories.torrent)
                .concat(categories.trailer)
                .concat(categories.rating)
                .concat(categories.favorite)
                .concat(categories.subscribe)
                .concat(categories.book)
                .concat(categories.reaction)
                .concat(categories.network)
                .concat(categories.plaftorms)
                .concat(categories.other);
        
        allButtons = sortByCustomOrder(allButtons);
        allButtonsCache = allButtons;
        
        var colors = getColors();
        var colorsUpdated = false;
        
        colors.forEach(function(color) {
            var updatedButtons = [];
            var usedButtons = [];
            
            color.buttons.forEach(function(oldBtnId) {
                var found = false;
                
                for (var i = 0; i < allButtons.length; i++) {
                    var btn = allButtons[i];
                    var newBtnId = getButtonId(btn);
                    
                    if (usedButtons.indexOf(newBtnId) !== -1) continue;
                    
                    if (newBtnId === oldBtnId) {
                        updatedButtons.push(newBtnId);
                        usedButtons.push(newBtnId);
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    for (var i = 0; i < allButtons.length; i++) {
                        var btn = allButtons[i];
                        var newBtnId = getButtonId(btn);
                        
                        if (usedButtons.indexOf(newBtnId) !== -1) continue;
                        
                        var text = btn.find('span').text().trim();
                        var classes = btn.attr('class') || '';
                        
                        if ((oldBtnId.indexOf('modss') !== -1 || oldBtnId.indexOf('MODS') !== -1) &&
                            (classes.indexOf('modss') !== -1 || text.indexOf('MODS') !== -1)) {
                            updatedButtons.push(newBtnId);
                            usedButtons.push(newBtnId);
                            found = true;
                            break;
                        } else if ((oldBtnId.indexOf('showy') !== -1 || oldBtnId.indexOf('Showy') !== -1) &&
                                   (classes.indexOf('showy') !== -1 || text.indexOf('Showy') !== -1)) {
                            updatedButtons.push(newBtnId);
                            usedButtons.push(newBtnId);
                            found = true;
                            break;
                        }
                    }
                }
                
                if (!found) {
                    updatedButtons.push(oldBtnId);
                }
            });
            
            if (updatedButtons.length !== color.buttons.length || 
                updatedButtons.some(function(id, i) { return id !== color.buttons[i]; })) {
                color.buttons = updatedButtons;
                colorsUpdated = true;
            }
        });
        
        if (colorsUpdated) {
            setColors(colors);
        }
        
        var buttonsInColors = [];
        colors.forEach(function(color) {
            buttonsInColors = buttonsInColors.concat(color.buttons);
        });
        
        var filteredButtons = allButtons.filter(function(btn) {
            return buttonsInColors.indexOf(getButtonId(btn)) === -1;
        });
        
        currentButtons = filteredButtons;
        applyHiddenButtons(filteredButtons);
        
        var targetContainer = currentContainer.find('.full-start-new__buttons');
        if (!targetContainer.length) return;

        targetContainer.find('.full-start__button').not('.button--edit-order').detach();
        
        var itemOrder = getItemOrder();
        var visibleButtons = [];
        var colors = getColors();
        var buttonsInColors = [];
        colors.forEach(function(color) {
            buttonsInColors = buttonsInColors.concat(color.buttons);
        });
        
        applyRenamedButtons(allButtons);
        
        if (itemOrder.length > 0) {
            var addedColors = [];
            var addedButtons = [];
            
            itemOrder.forEach(function(item) {
                if (item.type === 'color') {
                    var color = colors.find(function(f) { return f.id === item.id; });
                    if (color) {
                        var colorBtn = createColorButton(color);
                        targetContainer.append(colorBtn);
                        visibleButtons.push(colorBtn);
                        addedColors.push(color.id);
                    }
                } else if (item.type === 'button') {
                    var btnId = item.id;
                    if (buttonsInColors.indexOf(btnId) === -1) {
                        var btn = currentButtons.find(function(b) { return getButtonId(b) === btnId; });
                        if (btn && !btn.hasClass('hidden')) {
                            targetContainer.append(btn);
                            visibleButtons.push(btn);
                            addedButtons.push(btnId);
                        }
                    }
                }
            });
            
            currentButtons.forEach(function(btn) {
                var btnId = getButtonId(btn);
                if (addedButtons.indexOf(btnId) === -1 && !btn.hasClass('hidden') && buttonsInColors.indexOf(btnId) === -1) {
                    var insertBefore = null;
                    var btnType = getButtonType(btn);
                    var typeOrder = ['online', 'torrent', 'trailer', 'rating', 'favorite', 'subscribe', 'book', 'reaction', 'network', 'plaftorms', 'other'];
                    var btnTypeIndex = typeOrder.indexOf(btnType);
                    if (btnTypeIndex === -1) btnTypeIndex = 999;
                    
                    if (btnId === 'modss_online_button' || btnId === 'showy_online_button') {
                        var firstNonPriority = targetContainer.find('.full-start__button').not('.button--edit-order, .button--color').filter(function() {
                            var id = getButtonId($(this));
                            return id !== 'modss_online_button' && id !== 'showy_online_button';
                        }).first();
                        
                        if (firstNonPriority.length) {
                            insertBefore = firstNonPriority;
                        }
                        
                        if (btnId === 'showy_online_button') {
                            var modsBtn = targetContainer.find('.full-start__button').filter(function() {
                                return getButtonId($(this)) === 'modss_online_button';
                            });
                            if (modsBtn.length) {
                                insertBefore = modsBtn.next();
                                if (!insertBefore.length || insertBefore.hasClass('button--edit-order')) {
                                    insertBefore = null;
                                }
                            }
                        }
                    } else {
                        targetContainer.find('.full-start__button').not('.button--edit-order, .button--color').each(function() {
                            var existingBtn = $(this);
                            var existingId = getButtonId(existingBtn);
                            
                            if (existingId === 'modss_online_button' || existingId === 'showy_online_button') {
                                return true;
                            }
                            
                            var existingType = getButtonType(existingBtn);
                            var existingTypeIndex = typeOrder.indexOf(existingType);
                            if (existingTypeIndex === -1) existingTypeIndex = 999;
                            
                            if (btnTypeIndex < existingTypeIndex) {
                                insertBefore = existingBtn;
                                return false;
                            }
                        });
                    }
                    
                    if (insertBefore && insertBefore.length) {
                        btn.insertBefore(insertBefore);
                    } else {
                        var editBtn = targetContainer.find('.button--edit-order');
                        if (editBtn.length) {
                            btn.insertBefore(editBtn);
                        } else {
                            targetContainer.append(btn);
                        }
                    }
                    visibleButtons.push(btn);
                }
            });
            
            colors.forEach(function(color) {
                if (addedColors.indexOf(color.id) === -1) {
                    var colorBtn = createColorButton(color);
                    targetContainer.append(colorBtn);
                    visibleButtons.push(colorBtn);
                }
            });
        } else {
            currentButtons.forEach(function(btn) {
                var btnId = getButtonId(btn);
                if (!btn.hasClass('hidden') && buttonsInColors.indexOf(btnId) === -1) {
                    targetContainer.append(btn);
                    visibleButtons.push(btn);
                }
            });
            
            colors.forEach(function(color) {
                var colorBtn = createColorButton(color);
                targetContainer.append(colorBtn);
                visibleButtons.push(colorBtn);
            });
        }

        var viewmode = getViewMode();
        targetContainer.removeClass('icons-only always-text');
        if (viewmode === 'icons') targetContainer.addClass('icons-only');
        if (viewmode === 'always') targetContainer.addClass('always-text');

        applyButtonAnimation(visibleButtons);

        var editBtn = targetContainer.find('.button--edit-order');
        if (editBtn.length) {
            editBtn.detach();
            targetContainer.append(editBtn);
        }

        saveOrder();
        
        // Применяем цветные иконки если нужно
        if (getColoredLogos()) {
            setTimeout(function() {
                replaceIcons();
                setupIconObserver();
            }, 100);
        }
        
        setTimeout(function() {
            if (currentContainer) {
                setupButtonNavigation(currentContainer);
            }
        }, 100);
    }

    // ========== ЦВЕТА ==========

    function createColorButton(color) {
        var firstBtnId = color.buttons[0];
        var firstBtn = findButton(firstBtnId);
        var icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
            '</svg>';
        
        if (firstBtn) {
            var btnIcon = firstBtn.find('svg').first();
            if (btnIcon.length) {
                icon = btnIcon.prop('outerHTML');
            }
        }
        
        var hasName = color.name && color.name.trim();
        var btn = $('<div class="full-start__button selector button--color' + (!hasName ? ' color--no-name' : '') + 
                    '" data-color-id="' + color.id + '">' +
            icon +
            (hasName ? '<span>' + color.name + '</span>' : '') +
        '</div>');

        btn.on('hover:enter', function() {
            openColorMenu(color);
        });

        return btn;
    }

    function openColorMenu(color) {
        var items = [];
        
        color.buttons.forEach(function(btnId) {
            var btn = findButton(btnId);
            if (btn) {
                var displayName = getButtonDisplayName(btn, allButtonsOriginal);
                var iconElement = btn.find('svg').first();
                var icon = iconElement.length ? iconElement.prop('outerHTML') : '';
                var subtitle = btn.attr('data-subtitle') || '';
                
                var item = {
                    title: displayName.replace(/<[^>]*>/g, ''),
                    button: btn,
                    btnId: btnId
                };
                
                if (icon) {
                    item.template = 'selectbox_icon';
                    item.icon = icon;
                }
                
                if (subtitle) {
                    item.subtitle = subtitle;
                }
                
                items.push(item);
            }
        });

        Lampa.Select.show({
            title: color.name || 'Цвет',
            items: items,
            onSelect: function(item) {
                item.button.trigger('hover:enter');
            },
            onBack: function() {
                Lampa.Controller.toggle('full_start');
            }
        });
    }

    function openColorEditDialog(color) {
        var list = $('<div class="menu-edit-list"></div>');
        
        color.buttons.forEach(function(btnId) {
            var btn = findButton(btnId);
            if (btn) {
                var displayName = getButtonDisplayName(btn, allButtonsOriginal);
                var iconElement = btn.find('svg').first();
                var icon = iconElement.length ? iconElement.clone() : $('<svg></svg>');

                var item = $('<div class="menu-edit-list__item">' +
                    '<div class="menu-edit-list__icon"></div>' +
                    '<div class="menu-edit-list__title">' + displayName + '</div>' +
                    '<div class="menu-edit-list__move move-up selector">' +
                        '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                            '<path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                        '</svg>' +
                    '</div>' +
                    '<div class="menu-edit-list__move move-down selector">' +
                        '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                            '<path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                        '</svg>' +
                    '</div>' +
                    '<div class="menu-edit-list__rename selector">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" fill="none"><use xlink:href="#sprite-edit"></use></svg>' +
                    '</div>' +
                '</div>');

                item.find('.menu-edit-list__icon').append(icon);
                item.data('btnId', btnId);

                item.find('.move-up').on('hover:enter', function() {
                    var prev = item.prev();
                    if (prev.length) {
                        item.insertBefore(prev);
                        saveColorButtonOrder(color, list);
                    }
                });

                item.find('.move-down').on('hover:enter', function() {
                    var next = item.next();
                    if (next.length) {
                        item.insertAfter(next);
                        saveColorButtonOrder(color, list);
                    }
                });

                item.find('.menu-edit-list__rename').on('hover:enter', function() {
                    var currentName = getButtonDisplayName(btn, allButtonsOriginal).replace(/<[^>]*>/g, '');
                    Lampa.Modal.close();
                    setTimeout(function() {
                        Lampa.Input.edit({
                            free: true,
                            title: 'Новое название кнопки',
                            nosave: true,
                            value: currentName,
                            nomic: true,
                            placeholder: 'Оставьте пустым для удаления текста'
                        }, function(newName) {
                            if (newName !== null) {
                                var renamedButtons = getRenamedButtons();
                                renamedButtons[btnId] = newName.trim();
                                setRenamedButtons(renamedButtons);
                                Lampa.Noty.show('Кнопка переименована');
                            }
                            openColorEditDialog(color);
                        });
                    }, 100);
                });

                list.append(item);
            }
        });

        Lampa.Modal.open({
            title: 'Порядок кнопок в цвете',
            html: list,
            size: 'small',
            scroll_to_center: true,
            onBack: function() {
                Lampa.Modal.close();
                updateColorIcon(color);
                openEditDialog();
            }
        });
    }

    function saveColorButtonOrder(color, list) {
        var newOrder = [];
        list.find('.menu-edit-list__item').each(function() {
            var btnId = $(this).data('btnId');
            newOrder.push(btnId);
        });
        
        color.buttons = newOrder;
        
        var colors = getColors();
        for (var i = 0; i < colors.length; i++) {
            if (colors[i].id === color.id) {
                colors[i].buttons = newOrder;
                break;
            }
        }
        setColors(colors);
        
        updateColorIcon(color);
    }

    function updateColorIcon(color) {
        if (!color.buttons || color.buttons.length === 0) return;
        
        var colorBtn = currentContainer.find('.button--color[data-color-id="' + color.id + '"]');
        if (colorBtn.length) {
            var firstBtnId = color.buttons[0];
            var firstBtn = findButton(firstBtnId);
            
            if (firstBtn) {
                var iconElement = firstBtn.find('svg').first();
                if (iconElement.length) {
                    var btnIcon = iconElement.clone();
                    colorBtn.find('svg').replaceWith(btnIcon);
                }
            } else {
                var defaultIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
                '</svg>';
                colorBtn.find('svg').replaceWith(defaultIcon);
            }
        }
    }

    function createColor(name, buttonIds) {
        var colors = getColors();
        var color = {
            id: 'color_' + Date.now(),
            name: name,
            buttons: buttonIds
        };
        colors.push(color);
        setColors(colors);
        return color;
    }

    function deleteColor(colorId) {
        var colors = getColors();
        colors = colors.filter(function(f) { return f.id !== colorId; });
        setColors(colors);
    }

    function reorderButtons(container) {
        var targetContainer = container.find('.full-start-new__buttons');
        if (!targetContainer.length) return false;

        currentContainer = container;
        container.find('.button--play, .button--edit-order, .button--color').remove();

        // ДОБАВЛЯЕМ ЗАДЕРЖКУ ЗАГРУЗКИ КОНТЕЙНЕРА КНОПОК - 500 миллисекунд (0.5 секунды)
        setTimeout(function() {
            var categories = categorizeButtons(container);
            
            var allButtons = []
                .concat(categories.online)
                .concat(categories.torrent)
                .concat(categories.trailer)
                .concat(categories.rating)
                .concat(categories.favorite)
                .concat(categories.subscribe)
                .concat(categories.book)
                .concat(categories.reaction)
                .concat(categories.network)
                .concat(categories.plaftorms)
                .concat(categories.other);

            var visibleButtons = [];

            allButtons = sortByCustomOrder(allButtons);
            allButtonsCache = allButtons;
            
            if (allButtonsOriginal.length === 0) {
                allButtons.forEach(function(btn) {
                    allButtonsOriginal.push(btn.clone(true, true));
                });
            }

            var colors = getColors();
            var buttonsInColors = [];
            colors.forEach(function(color) {
                buttonsInColors = buttonsInColors.concat(color.buttons);
            });

            var filteredButtons = allButtons.filter(function(btn) {
                return buttonsInColors.indexOf(getButtonId(btn)) === -1;
            });

            currentButtons = filteredButtons;
            applyHiddenButtons(filteredButtons);

            targetContainer.children().detach();
            
            var visibleButtons = [];
            var itemOrder = getItemOrder();
            
            applyRenamedButtons(allButtons);
            
            if (itemOrder.length > 0) {
                var addedColors = [];
                var addedButtons = [];
                
                itemOrder.forEach(function(item) {
                    if (item.type === 'color') {
                        var color = colors.find(function(f) { return f.id === item.id; });
                        if (color) {
                            var colorBtn = createColorButton(color);
                            targetContainer.append(colorBtn);
                            visibleButtons.push(colorBtn);
                            addedColors.push(color.id);
                        }
                    } else if (item.type === 'button') {
                        var btn = filteredButtons.find(function(b) { return getButtonId(b) === item.id; });
                        if (btn && !btn.hasClass('hidden')) {
                            targetContainer.append(btn);
                            visibleButtons.push(btn);
                            addedButtons.push(getButtonId(btn));
                        }
                    }
                });
                
                filteredButtons.forEach(function(btn) {
                    var btnId = getButtonId(btn);
                    if (addedButtons.indexOf(btnId) === -1 && !btn.hasClass('hidden')) {
                        var insertBefore = null;
                        var btnType = getButtonType(btn);
                        var typeOrder = ['online', 'torrent', 'trailer', 'rating', 'favorite', 'subscribe', 'book', 'reaction', 'network', 'plaftorms', 'other'];
                        var btnTypeIndex = typeOrder.indexOf(btnType);
                        if (btnTypeIndex === -1) btnTypeIndex = 999;
                        
                        if (btnId === 'modss_online_button' || btnId === 'showy_online_button') {
                            var firstNonPriority = targetContainer.find('.full-start__button').not('.button--edit-order, .button--color').filter(function() {
                                var id = getButtonId($(this));
                                return id !== 'modss_online_button' && id !== 'showy_online_button';
                            }).first();
                            
                            if (firstNonPriority.length) {
                                insertBefore = firstNonPriority;
                            }
                            
                            if (btnId === 'showy_online_button') {
                                var modsBtn = targetContainer.find('.full-start__button').filter(function() {
                                    return getButtonId($(this)) === 'modss_online_button';
                                });
                                if (modsBtn.length) {
                                    insertBefore = modsBtn.next();
                                    if (!insertBefore.length || insertBefore.hasClass('button--edit-order')) {
                                        insertBefore = null;
                                    }
                                }
                            }
                        } else {
                            targetContainer.find('.full-start__button').not('.button--edit-order, .button--color').each(function() {
                                var existingBtn = $(this);
                                var existingId = getButtonId(existingBtn);
                                
                                if (existingId === 'modss_online_button' || existingId === 'showy_online_button') {
                                    return true;
                                }
                                
                                var existingType = getButtonType(existingBtn);
                                var existingTypeIndex = typeOrder.indexOf(existingType);
                                if (existingTypeIndex === -1) existingTypeIndex = 999;
                                
                                if (btnTypeIndex < existingTypeIndex) {
                                    insertBefore = existingBtn;
                                    return false;
                                }
                            });
                        }
                        
                        if (insertBefore && insertBefore.length) {
                            btn.insertBefore(insertBefore);
                        } else {
                            targetContainer.append(btn);
                        }
                        visibleButtons.push(btn);
                    }
                });
                
                colors.forEach(function(color) {
                    if (addedColors.indexOf(color.id) === -1) {
                        var colorBtn = createColorButton(color);
                        targetContainer.append(colorBtn);
                        visibleButtons.push(colorBtn);
                    }
                });
            } else {
                colors.forEach(function(color) {
                    var colorBtn = createColorButton(color);
                    targetContainer.append(colorBtn);
                    visibleButtons.push(colorBtn);
                });
                
                filteredButtons.forEach(function(btn) {
                    if (!btn.hasClass('hidden')) {
                        targetContainer.append(btn);
                        visibleButtons.push(btn);
                    }
                });
            }

            var editButton = createEditButton();
            targetContainer.append(editButton);
            visibleButtons.push(editButton);

            var viewmode = getViewMode();
            targetContainer.removeClass('icons-only always-text');
            if (viewmode === 'icons') targetContainer.addClass('icons-only');
            if (viewmode === 'always') targetContainer.addClass('always-text');

            applyButtonAnimation(visibleButtons);
            
            // Применяем цветные иконки если нужно
            if (getColoredLogos()) {
                setTimeout(function() {
                    replaceIcons();
                    setupIconObserver();
                }, 100);
            }
            
            setTimeout(function() {
                setupButtonNavigation(container);
            }, 100);
        }, 100); // ЗДЕСЬ ЗАДЕРЖКА 500 МИЛЛИСЕКУНД

        return true;
    }

    // ========== НАВИГАЦИЯ И ОБНОВЛЕНИЕ ==========

    function setupButtonNavigation(container) {
        if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
            try {
                Lampa.Controller.toggle('full_start');
            } catch(e) {}
        }
    }

    function refreshController() {
        if (!Lampa.Controller || typeof Lampa.Controller.toggle !== 'function') return;
        
        setTimeout(function() {
            try {
                Lampa.Controller.toggle('full_start');
                
                if (currentContainer) {
                    setTimeout(function() {
                        setupButtonNavigation(currentContainer);
                    }, 100);
                }
            } catch(e) {}
        }, 50);
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========

    function init() {
        var style = $('<style>' +
            '@keyframes button-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }' +
            '.full-start__button { opacity: 0; }' +
            '.full-start__button.hidden { display: none !important; }' +
            '.button--color { cursor: pointer; }' +
            '.full-start-new__buttons { ' +
                'display: flex !important; ' +
                'flex-direction: row !important; ' +
                'flex-wrap: wrap !important; ' +
                'gap: 0.5em !important; ' +
            '}' +
            '.full-start-new__buttons.buttons-loading .full-start__button { visibility: hidden !important; }' +
            '.full-start-new__buttons.icons-only .full-start__button:not(.button--color) span,' +
            '.full-start-new__buttons.icons-only .button--color span {' +
                'display: none;' +
            '}' +
            '.full-start-new__buttons.always-text .full-start__button span {' +
                'display: block !important;' +
            '}' +
            '.colored-logos-switch, .viewmode-switch { background: rgba(100,100,255,0.3); margin: 0 0 1em 0; border-radius: 0.3em; }' +
            '.colored-logos-switch.focus, .viewmode-switch.focus { border: 3px solid rgba(255,255,255,0.8); }' +
            '.menu-edit-list__delete, .menu-edit-list__rename, .menu-edit-list__edit-content { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }' +
            '.menu-edit-list__delete svg, .menu-edit-list__rename svg, .menu-edit-list__edit-content svg { width: 1.2em !important; height: 1.2em !important; }' +
            '.menu-edit-list__delete.focus, .menu-edit-list__rename.focus, .menu-edit-list__edit-content.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }' +
            '.color-item .menu-edit-list__move { margin-right: 0; }' +
            '.color-reset-button { background: rgba(200,100,100,0.3); margin-top: 1em; border-radius: 0.3em; }' +
            '.color-reset-button.focus { border: 3px solid rgba(255,255,255,0.8); }' +
            '.menu-edit-list__toggle.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }' +
            '.button--color.color--no-name { min-width: 3.5em; max-width: 3.5em; justify-content: center; }' +
            '.button--color.color--no-name > span { display: none; }' +
            '.button-empty span { display: none !important; }' +
        '</style>');
        $('body').append(style);

        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;

            var container = e.object.activity.render();
            var targetContainer = container.find('.full-start-new__buttons');
            if (targetContainer.length) {
                targetContainer.addClass('buttons-loading');
            }

            setTimeout(function() {
                try {
                    if (!container.data('buttons-processed')) {
                        container.data('buttons-processed', true);
                        if (reorderButtons(container)) {
                            if (targetContainer.length) {
                                setTimeout(function() {
                                    targetContainer.removeClass('buttons-loading');
                                }, 150); // Чуть больше чем задержка в reorderButtons
                                refreshController();
                            }
                        }
                    }
                } catch(err) {
                    if (targetContainer.length) {
                        targetContainer.removeClass('buttons-loading');
                    }
                }
            }, 400);
        });
    }

    // ========== НАСТРОЙКИ ==========

    if (Lampa.SettingsApi) {
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'buttons_editor_enabled',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Редактор кнопок'
            },
            onChange: function(value) {
                setTimeout(function() {
                    var currentValue = Lampa.Storage.get('buttons_editor_enabled', true);
                    if (currentValue) {
                        $('.button--edit-order').show();
                        Lampa.Noty.show('Редактор кнопок включен');
                    } else {
                        $('.button--edit-order').hide();
                        Lampa.Noty.show('Редактор кнопок выключен');
                    }
                }, 100);
            },
            onRender: function(element) {
                setTimeout(function() {
                    var lastElement = $('div[data-name="interface_size"]');
                    if (lastElement.length) {
                        element.insertAfter(lastElement);
                    } else {
                        var lastElement = $('div[data-component="interface"] .settings-param').last();
                        if (lastElement.length) {
                            element.insertAfter(lastElement);
                        }
                    }
                }, 0);
            }
        });
    }

    init();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {};
    }
})();
