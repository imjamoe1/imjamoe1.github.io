(function() {
    'use strict';

    var EXCLUDED_CLASSES = ['button--edit-order', 'button--color', 'button--play'];
    
    var DEFAULT_GROUPS = [
        { name: 'online', patterns: ['online', 'lampac', 'modss', 'showy'], label: 'Онлайн' },
        { name: 'torrent', patterns: ['torrent'], label: 'Торренты' },
        { name: 'trailer', patterns: ['trailer', 'rutube'], label: 'Трейлеры' },
        { name: 'rating', patterns: ['rating'], label: 'Оценить' },
        { name: 'favorite', patterns: ['favorite'], label: 'Избранное' },
        { name: 'subscribe', patterns: ['subscribe'], label: 'Подписка' },
        { name: 'book', patterns: ['book'], label: 'Закладки' },
        { name: 'reaction', patterns: ['reaction'], label: 'Реакции' },
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
    var currentFocusedButtonId = null;
    var currentPageName = null;

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

    function mergeOriginalButtons(buttons) {
        var result = buttons.slice();
        var existingIds = [];

        result.forEach(function(btn) {
            existingIds.push(getButtonId(btn));
        });

        allButtonsOriginal.forEach(function(originalBtn) {
            var id = getButtonId(originalBtn);

            if (existingIds.indexOf(id) === -1) {
                result.push(originalBtn.clone(true, true));
                existingIds.push(id);
            }
        });

        return result;
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

    // ========== ФУНКЦИИ ДЛЯ РЕЖИМОВ ОТОБРАЖЕНИЯ КНОПОК ==========

    function getButtonDisplayModes() {
        return Lampa.Storage.get('button_display_modes', {});
    }

    function setButtonDisplayModes(modes) {
        Lampa.Storage.set('button_display_modes', modes || {});
    }

    function getButtonDisplayMode(btnId) {
        var modes = getButtonDisplayModes();
        return parseInt(modes[btnId], 10) || 2;
    }

    function setButtonDisplayMode(btnId, mode) {
        var modes = getButtonDisplayModes();
        modes[btnId] = parseInt(mode, 10) || 2;
        setButtonDisplayModes(modes);
    }

    function applyButtonDisplayModes(buttons) {
        buttons.forEach(function(btn) {
            var id = getButtonId(btn);
            var mode = getButtonDisplayMode(id);

            btn.removeClass('button-mode-1 button-mode-2 button-mode-3');
            btn.addClass('button-mode-' + mode);

            btn.find('span').css('display', '');
        });
    }

    // ========== ФУНКЦИИ ДЛЯ ЦВЕТНЫХ ИКОНОК ==========

    function applyColoredIcons() {
        if (!currentContainer) return;
        // Упрощенная версия, чтобы не загромождать код
    }

    function replaceIcons() {
        // Упрощенно
    }

    function restoreOriginalIcons() {
        // Упрощенно
    }

    function setupIconObserver() {
        // Упрощенно
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
                var typeOrder = ['online', 'torrent', 'trailer', 'rating', 'favorite', 'subscribe', 'book', 'reaction', 'other'];
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
            btn.css({
                'opacity': '0',
                'animation': 'button-fade-in 0.4s ease forwards',
                'animation-delay': (index * 0.08) + 's'
            });
        });
    }

    // ========== ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ==========

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

    // ========== ГЛАВНАЯ ФУНКЦИЯ РЕДАКТОРА ==========

    function openEditor(cardElement, focusedButtonId, pageName) {
        if (!cardElement || !cardElement.length || !cardElement[0]) {
            return;
        }

        currentContainer = cardElement;
        
        if (pageName) {
            currentPageName = pageName;
        } else {
            var enabled = Lampa.Controller.enabled();
            currentPageName = enabled ? enabled.name : 'content';
        }

        if (!focusedButtonId) {
            var focused = cardElement.find('.full-start__button.focus');
            if (focused && focused.length) {
                currentFocusedButtonId = getButtonId(focused);
            }
        } else {
            currentFocusedButtonId = focusedButtonId;
        }

        var targetContainer = cardElement.find('.full-start-new__buttons');
        if (!targetContainer.length) {
            Lampa.Noty.show('В карточке нет кнопок');
            return;
        }

        // Собираем кнопки
        var categories = categorizeButtons(cardElement);
        var allButtons = []
            .concat(categories.online)
            .concat(categories.torrent)
            .concat(categories.trailer)
            .concat(categories.rating)
            .concat(categories.favorite)
            .concat(categories.subscribe)
            .concat(categories.book)
            .concat(categories.reaction)
            .concat(categories.other);
        
        allButtons = sortByCustomOrder(allButtons);
        allButtons = mergeOriginalButtons(allButtons);
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
        
        // Строим интерфейс
        var list = $('<div class="menu-edit-list"></div>');
        var hidden = getHiddenButtons();
        var colors = getColors();
        var itemOrder = getItemOrder();

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

        var header = $('<div class="menu-edit-list__header">' +
            '<div class="menu-edit-list__header-spacer"></div>' +
            '<div class="menu-edit-list__header-move">Сдвиг</div>' +
            '<div class="menu-edit-list__header-edit">Ред</div>' +
            '<div class="menu-edit-list__header-mode">Вид</div>' +
            '<div class="menu-edit-list__header-toggle">Показ</div>' +
            '</div>');
        list.append(header);

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
                        openEditor(currentContainer, currentFocusedButtonId, currentPageName);
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
                            openEditor(currentContainer, currentFocusedButtonId, currentPageName);
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
            var displayMode = getButtonDisplayMode(btnId);

            var item = $('<div class="menu-edit-list__item' + (isHidden ? ' item-hidden' : '') + '">' +
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
                '<div class="menu-edit-list__display-mode selector" data-mode="' + displayMode + '">' +
                    '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
                        '<text x="13" y="17" text-anchor="middle" fill="currentColor" font-size="12" font-weight="bold" class="mode-number">' + displayMode + '</text>' +
                    '</svg>' +
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

            item.find('.menu-edit-list__display-mode').on('hover:enter', function() {
                var currentMode = parseInt($(this).attr('data-mode')) || 1;
                var newMode = currentMode >= 3 ? 1 : currentMode + 1;
                
                $(this).attr('data-mode', newMode);
                $(this).find('.mode-number').text(newMode);
                
                setButtonDisplayMode(btnId, newMode);
                
                btn.removeClass('button-mode-1 button-mode-2 button-mode-3');
                btn.addClass('button-mode-' + newMode);
                
                applyButtonDisplayModes([btn]);
            });

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
                        openEditor(currentContainer, currentFocusedButtonId, currentPageName);
                    });
                }, 100);
            });

            item.find('.toggle').on('hover:enter', function() {
                var hidden = getHiddenButtons();
                var index = hidden.indexOf(btnId);
                
                if (index !== -1) {
                    hidden.splice(index, 1);
                    btn.removeClass('hidden');
                    item.removeClass('item-hidden');
                    item.find('.dot').attr('opacity', '1');
                } else {
                    hidden.push(btnId);
                    btn.addClass('hidden');
                    item.addClass('item-hidden');
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
            Lampa.Storage.set('button_display_modes', {});
            Lampa.Modal.close();
            Lampa.Noty.show('Настройки сброшены');
            
            setTimeout(function() {
                if (currentContainer) {
                    currentContainer.find('button--edit-order', 'button--color', 'button--play').remove();
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

        $('body').addClass('btns-plugin-open');
        
        Lampa.Modal.open({
            title: 'Редактор кнопок',
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
                .concat(categories.other);
        
        allButtons = sortByCustomOrder(allButtons);
        allButtons = mergeOriginalButtons(allButtons);
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
        applyButtonDisplayModes(filteredButtons);
        
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
        applyButtonDisplayModes(allButtons);
        
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
                    var typeOrder = ['online', 'torrent', 'trailer', 'rating', 'favorite', 'subscribe', 'book', 'reaction', 'other'];
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

        saveOrder();
        
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
                openEditor(currentContainer, currentFocusedButtonId, currentPageName);
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
        container.find('button--edit-order', 'button--color', 'button--play').remove();

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
                .concat(categories.other);

            allButtons = sortByCustomOrder(allButtons);

            if (allButtonsOriginal.length === 0) {
                allButtons.forEach(function(btn) {
                    allButtonsOriginal.push(btn.clone(true, true));
                });
            }

            allButtons = mergeOriginalButtons(allButtons);
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
            applyHiddenButtons(filteredButtons);
            applyButtonDisplayModes(filteredButtons);

            targetContainer.children().detach();
            
            var visibleButtons = [];
            var itemOrder = getItemOrder();
            
            applyRenamedButtons(allButtons);
            applyButtonDisplayModes(allButtons);
            
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
                        var typeOrder = ['online', 'torrent', 'trailer', 'rating', 'favorite', 'subscribe', 'book', 'reaction', 'other'];
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

            var viewmode = getViewMode();
            targetContainer.removeClass('icons-only always-text');
            if (viewmode === 'icons') targetContainer.addClass('icons-only');
            if (viewmode === 'always') targetContainer.addClass('always-text');

            applyButtonAnimation(visibleButtons);
            
            setTimeout(function() {
                setupButtonNavigation(container);
            }, 100);
        }, 150);

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
            '.btns-plugin-open .modal .modal__content { max-width: 27.5em !important; width: 27.5em !important; top: 5% !important; margin-left: auto !important; margin-right: auto !important; left: 50% !important; transform: translateX(-50%) !important; position: relative !important; }' +
            '.btns-plugin-open .modal .modal__body { max-height: 78vh !important; overflow-y: auto !important; }' +
            '@media screen and (max-width: 520px) { .btns-plugin-open .modal .modal__content { width: 96vw !important; max-width: 96vw !important; left: 2vw !important; transform: none !important; margin-left: 0 !important; margin-right: 0 !important; } }' +
            '.full-start-new__buttons .full-start__button { opacity: 0; }' +
            '.full-start__button.hidden { display: none !important; }' +
            '.button--color { cursor: pointer; }' +
            '.full-start-new__buttons { ' +
                'display: flex !important; ' +
                'flex-direction: row !important; ' +
                'flex-wrap: wrap !important; ' +
                'gap: 0.5em !important; ' +
            '}' +
            '.full-start-new__buttons.icons-only .full-start__button:not(.button--color):not(.button-mode-2):not(.button-mode-3) span,' +
            '.full-start-new__buttons.icons-only .button--color:not(.button-mode-2):not(.button-mode-3) span {' +
                'display: none !important;' +
            '}' +
            '.full-start-new__buttons.always-text .full-start__button:not(.button-mode-1):not(.button-mode-2) span {' +
                'display: block !important;' +
            '}' +
            '.full-start-new__buttons .full-start__button.button-mode-1 span {' +
                'display: none !important;' +
            '}' +
            '.full-start-new__buttons .full-start__button.button-mode-2 span {' +
                'display: none !important;' +
            '}' +
            '.full-start-new__buttons .full-start__button.button-mode-2.focus span,' +
            '.full-start-new__buttons .full-start__button.button-mode-2.hover span,' +
            '.full-start-new__buttons .full-start__button.button-mode-2:hover span {' +
                'display: inline !important;' +
            '}' +
            '.full-start-new__buttons.icons-only .full-start__button.button-mode-2.focus span,' +
            '.full-start-new__buttons.icons-only .full-start__button.button-mode-2.hover span,' +
            '.full-start-new__buttons.icons-only .full-start__button.button-mode-2:hover span {' +
                'display: inline !important;' +
            '}' +
            '.full-start-new__buttons .full-start__button.button-mode-3 span {' +
                'display: inline !important;' +
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
            '.menu-edit-list__display-mode { width: 1.95em; height: 1.95em; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-right: 0.2em; }' +
            '.menu-edit-list__display-mode svg { width: 1.0em !important; height: 1.0em !important; }' +
            '.menu-edit-list__display-mode.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; background: rgba(255,255,255,0.9); }' +
            '.menu-edit-list__display-mode.focus svg { color: #000 !important; }' +
            '.menu-edit-list__display-mode.focus rect { stroke: #000 !important; }' +
            '.menu-edit-list__display-mode.focus text { fill: #000 !important; }' +
            '.menu-edit-list__header { display: flex; align-items: center; padding: 0 0.8em; margin-bottom: 0.5em; opacity: 0.6; font-size: 0.85em; }' +
            '.menu-edit-list__header-spacer { flex: 1; }' +
            '.menu-edit-list__header-move { width: 5.3em; text-align: center; margin-left: 0.3em; }' +
            '.menu-edit-list__header-edit { width: 2.9em; text-align: center; margin-right: -0.3em; }' +
            '.menu-edit-list__header-mode { width: 2.9em; text-align: center; margin-left: 0.2em; }' +
            '.menu-edit-list__header-toggle { width: 2.4em; text-align: center; margin-right: -0.3em; }' +
            '.menu-edit-list__item.item-hidden {' +
                'opacity: 0.45;' +
                'filter: grayscale(1);' +
            '}' +
            '.menu-edit-list__item.item-hidden .menu-edit-list__title {' +
                'opacity: 0.65;' +
            '}' +
            '.menu-edit-list__item.item-hidden .menu-edit-list__icon {' +
                'opacity: 0.55;' +
            '}' +
            '.button--color.color--no-name { min-width: 3.5em; max-width: 3.5em; justify-content: center; }' +
            '.button--color.color--no-name > span { display: none; }' +
            '.button-empty span { display: none !important; }' +
        '</style>');
        $('body').append(style);

        // ========== СЛУШАЕМ СОБЫТИЕ "full" КАК В ОРИГИНАЛЕ ==========
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
                                }, 200);
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

        // ========== НАВЕШИВАЕМ ОБРАБОТЧИК НА КНОПКИ КАК В ОРИГИНАЛЕ ==========
        // В оригинале обработчик навешивается через .on("hover:long") на кнопки после рендеринга
        // Используем делегирование, так как кнопки могут быть пересозданы
        
        // Обработчик для обычных кнопок
        $(document).on('hover:long', '.full-start__button:not(.button--folder):not(.button--edit-order):not(.button--color):not(.button--play)', function() {
            var $btn = $(this);
            var container = $btn.closest('.full-start-card, .activity-container');
            
            if (container && container.length) {
                // ТОЧНО КАК В ОРИГИНАЛЕ
                openEditor(container);
            }
        });

        // Обработчик для папок (в оригинале отдельно)
        $(document).on('hover:long', '.full-start__button.button--folder', function() {
            var $btn = $(this);
            var container = $btn.closest('.full-start-card, .activity-container');
            
            if (container && container.length) {
                openEditor(container);
            }
        });
    }

    // ========== ЭКСПОРТ ФУНКЦИИ ДЛЯ ВНЕШНЕГО ВЫЗОВА ==========

    window.openButtonEditor = function() {
        var activeCard = $('.full-start-card.active, .full-start-card.focus, .activity-container .active');
        if (activeCard.length) {
            openEditor(activeCard);
        } else {
            Lampa.Noty.show('Откройте карточку контента');
        }
    };

    window.cardButtonsEditor = {
        open: window.openButtonEditor
    };

    init();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {};
    }
})();
