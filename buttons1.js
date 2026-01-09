(function() {
    'use strict';

    var LAMPAC_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z" fill="#2196f3"></path></svg>';
    
    var EXCLUDED_CLASSES = ['button--play', 'button--edit-order', 'button--folder'];
    
    var DEFAULT_GROUPS = [
        { name: 'online', patterns: ['online', 'lampac', 'modss', 'showy'], label: 'Онлайн' },
        { name: 'torrent', patterns: ['torrent'], label: 'Торренты' },
        { name: 'trailer', patterns: ['trailer', 'rutube'], label: 'Трейлеры' },
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

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

    function findButton(btnId) {
        var btn = allButtonsOriginal.find(function(b) { return getButtonId(b) === btnId; });
        if (!btn) {
            btn = allButtonsCache.find(function(b) { return getButtonId(b) === btnId; });
        }
        return btn;
    }

    function getButtonsInFolders() {
        var folders = getFolders();
        var buttonsInFolders = [];
        folders.forEach(function(folder) {
            buttonsInFolders = buttonsInFolders.concat(folder.buttons);
        });
        return buttonsInFolders;
    }

    // ========== ХРАНЕНИЕ ДАННЫХ ==========

    function getCustomOrder() {
        return Lampa.Storage.get('button_custom_order', []);
    }

    function setCustomOrder(order) {
        Lampa.Storage.set('button_custom_order', order);
    }

    function getItemOrder() {
        return Lampa.Storage.get('button_item_order', []);
    }

    function setItemOrder(order) {
        Lampa.Storage.set('button_item_order', order);
    }

    function getHiddenButtons() {
        return Lampa.Storage.get('button_hidden', []);
    }

    function setHiddenButtons(hidden) {
        Lampa.Storage.set('button_hidden', hidden);
    }

    function getFolders() {
        return Lampa.Storage.get('button_folders', []);
    }

    function setFolders(folders) {
        Lampa.Storage.set('button_folders', folders);
    }

    function getViewMode() {
        return Lampa.Storage.get('buttons_viewmode', 'default');
    }

    function setViewMode(mode) {
        Lampa.Storage.set('buttons_viewmode', mode);
    }

    function getRenamedButtons() {
        var renamed = Lampa.Storage.get('button_renamed', {});
        // Проверяем что это объект
        if (typeof renamed !== 'object' || renamed === null) {
            renamed = {};
        }
        return renamed;
    }

    function setRenamedButtons(renamed) {
        // Сохраняем как объект
        if (typeof renamed === 'object' && renamed !== null) {
            Lampa.Storage.set('button_renamed', renamed);
        } else {
            Lampa.Storage.set('button_renamed', {});
        }
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
                // Пустая строка - удаляем текст
                if (renamed[id] === '') {
                    btn.addClass('button-empty');
                    btn.find('span').remove();
                    // Удаляем текстовые узлы
                    btn.contents().filter(function() {
                        return this.nodeType === 3 && this.textContent.trim() !== '';
                    }).remove();
                } else {
                    btn.removeClass('button-empty');
                    var span = btn.find('span').first();
                    if (span.length) {
                        span.text(renamed[id]);
                    } else {
                        // Если нет span, создаем его
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
        var allButtons = container.find('.full-start__button').not('.button--edit-order, .button--folder, .button--play');
        
        var categories = {
            online: [],
            torrent: [],
            trailer: [],
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
            
            // Замена иконки для lampac
            if (type === 'online' && $btn.hasClass('lampac--button') && !$btn.hasClass('modss--button') && !$btn.hasClass('showy--button')) {
                var svgElement = $btn.find('svg').first();
                if (svgElement.length && !svgElement.hasClass('modss-online-icon')) {
                    svgElement.replaceWith(LAMPAC_ICON);
                }
            }
            
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
        
        // Сортировка приоритетных кнопок
        priority.sort(function(a, b) {
            var idA = getButtonId(a);
            var idB = getButtonId(b);
            if (idA === 'modss_online_button') return -1;
            if (idB === 'modss_online_button') return 1;
            if (idA === 'showy_online_button') return -1;
            if (idB === 'showy_online_button') return 1;
            return 0;
        });
        
        // Если нет пользовательского порядка, сортируем по типам
        if (!customOrder.length) {
            regular.sort(function(a, b) {
                var typeOrder = ['online', 'torrent', 'trailer', 'favorite', 'subscribe', 'book', 'reaction', 'other'];
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

        // Сортировка по пользовательскому порядку
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

    function createEditButton() {
        var btn = $('<div class="full-start__button selector button--edit-order" style="order: 9999;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 29" fill="none"><use xlink:href="#sprite-edit"></use></svg>' +
            '</div>');

        btn.on('hover:enter', function() {
            openEditDialog();
        });

        // Проверяем настройку и скрываем кнопку если редактор выключен
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

        // Возвращаем переименованное название если оно есть
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

    // ========== ПАПКИ ==========

    function createFolderButton(folder) {
        var firstBtnId = folder.buttons[0];
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
        
        var hasName = folder.name && folder.name.trim();
        var btn = $('<div class="full-start__button selector button--folder' + (!hasName ? ' folder--no-name' : '') + 
                    '" data-folder-id="' + folder.id + '">' +
            icon +
            (hasName ? '<span>' + folder.name + '</span>' : '') +
        '</div>');

        btn.on('hover:enter', function() {
            openFolderMenu(folder);
        });

        return btn;
    }

    function openFolderMenu(folder) {
        var items = [];
        
        folder.buttons.forEach(function(btnId) {
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
            title: folder.name || 'Папка',
            items: items,
            onSelect: function(item) {
                item.button.trigger('hover:enter');
            },
            onBack: function() {
                Lampa.Controller.toggle('full_start');
            }
        });
    }

    function openFolderEditDialog(folder) {
        var list = $('<div class="menu-edit-list"></div>');
        
        folder.buttons.forEach(function(btnId) {
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
                        saveFolderButtonOrder(folder, list);
                    }
                });

                item.find('.move-down').on('hover:enter', function() {
                    var next = item.next();
                    if (next.length) {
                        item.insertAfter(next);
                        saveFolderButtonOrder(folder, list);
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
                            // Ключевое исправление: newName может быть null при отмене или пустой строкой
                            // Принимаем любую строку, включая пустую
                            if (newName !== null) {
                                var renamedButtons = getRenamedButtons();
                                renamedButtons[btnId] = newName.trim();
                                setRenamedButtons(renamedButtons);
                                Lampa.Noty.show('Кнопка переименована');
                            }
                            openFolderEditDialog(folder);
                        });
                    }, 100);
                });

                list.append(item);
            }
        });

        Lampa.Modal.open({
            title: 'Порядок кнопок в папке',
            html: list,
            size: 'small',
            scroll_to_center: true,
            onBack: function() {
                Lampa.Modal.close();
                updateFolderIcon(folder);
                openEditDialog();
            }
        });
    }

    function saveFolderButtonOrder(folder, list) {
        var newOrder = [];
        list.find('.menu-edit-list__item').each(function() {
            var btnId = $(this).data('btnId');
            newOrder.push(btnId);
        });
        
        folder.buttons = newOrder;
        
        var folders = getFolders();
        for (var i = 0; i < folders.length; i++) {
            if (folders[i].id === folder.id) {
                folders[i].buttons = newOrder;
                break;
            }
        }
        setFolders(folders);
        
        updateFolderIcon(folder);
    }

    function updateFolderIcon(folder) {
        if (!folder.buttons || folder.buttons.length === 0) return;
        
        var folderBtn = currentContainer.find('.button--folder[data-folder-id="' + folder.id + '"]');
        if (folderBtn.length) {
            var firstBtnId = folder.buttons[0];
            var firstBtn = findButton(firstBtnId);
            
            if (firstBtn) {
                var iconElement = firstBtn.find('svg').first();
                if (iconElement.length) {
                    var btnIcon = iconElement.clone();
                    folderBtn.find('svg').replaceWith(btnIcon);
                }
            } else {
                var defaultIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
                '</svg>';
                folderBtn.find('svg').replaceWith(defaultIcon);
            }
        }
    }

    function createFolder(name, buttonIds) {
        var folders = getFolders();
        var folder = {
            id: 'folder_' + Date.now(),
            name: name,
            buttons: buttonIds
        };
        folders.push(folder);
        setFolders(folders);
        return folder;
    }

    function deleteFolder(folderId) {
        var folders = getFolders();
        folders = folders.filter(function(f) { return f.id !== folderId; });
        setFolders(folders);
    }

    // ========== ДИАЛОГИ ==========

    function openCreateFolderDialog() {
        Lampa.Input.edit({
            free: true,
            title: 'Название папки',
            nosave: true,
            value: '',
            nomic: true,
            placeholder: 'Оставьте пустым для папки без названия'
        }, function(folderName) {
            // Ключевое исправление: принимаем любую строку, включая пустую
            if (folderName !== null) {
                openSelectButtonsDialog(folderName.trim());
            } else {
                openEditDialog();
            }
        });
    }

    function openSelectButtonsDialog(folderName) {
        var selectedButtons = [];
        var list = $('<div class="menu-edit-list"></div>');
        
        var buttonsInFolders = getButtonsInFolders();
        var sortedButtons = sortByCustomOrder(allButtonsOriginal.slice());

        sortedButtons.forEach(function(btn) {
            var btnId = getButtonId(btn);
            
            if (buttonsInFolders.indexOf(btnId) !== -1) {
                return;
            }
            
            var displayName = getButtonDisplayName(btn, sortedButtons);
            var iconElement = btn.find('svg').first();
            var icon = iconElement.length ? iconElement.clone() : $('<svg></svg>');

            var item = $('<div class="menu-edit-list__item">' +
                '<div class="menu-edit-list__icon"></div>' +
                '<div class="menu-edit-list__title">' + displayName + '</div>' +
                '<div class="menu-edit-list__toggle selector">' +
                    '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
                        '<path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="0" stroke-linecap="round"/>' +
                    '</svg>' +
                '</div>' +
            '</div>');

            item.find('.menu-edit-list__icon').append(icon);

            item.find('.menu-edit-list__toggle').on('hover:enter', function() {
                var index = selectedButtons.indexOf(btnId);
                if (index !== -1) {
                    selectedButtons.splice(index, 1);
                    item.find('.dot').attr('opacity', '0');
                } else {
                    selectedButtons.push(btnId);
                    item.find('.dot').attr('opacity', '1');
                }
            });

            list.append(item);
        });

        var confirmText = folderName && folderName.trim() ? 
            'Создать папку "' + folderName + '"' : 
            'Создать папку без названия';
        
        var createBtn = $('<div class="selector folder-create-confirm">' +
            '<div style="text-align: center; padding: 1em;">' + confirmText + '</div>' +
        '</div>');
        
        createBtn.on('hover:enter', function() {
            if (selectedButtons.length < 2) {
                Lampa.Noty.show('Выберите минимум 2 кнопки');
                return;
            }

            var folder = createFolder(folderName, selectedButtons);
            
            var itemOrder = getItemOrder();
            
            if (itemOrder.length === 0) {
                currentButtons.forEach(function(btn) {
                    itemOrder.push({
                        type: 'button',
                        id: getButtonId(btn)
                    });
                });
            }
            
            var folderAdded = false;
            
            for (var i = 0; i < selectedButtons.length; i++) {
                var btnId = selectedButtons[i];
                
                for (var j = 0; j < itemOrder.length; j++) {
                    if (itemOrder[j].type === 'button' && itemOrder[j].id === btnId) {
                        if (!folderAdded) {
                            itemOrder[j] = {
                                type: 'folder',
                                id: folder.id
                            };
                            folderAdded = true;
                        } else {
                            itemOrder.splice(j, 1);
                            j--;
                        }
                        break;
                    }
                }
                
                for (var k = 0; k < currentButtons.length; k++) {
                    if (getButtonId(currentButtons[k]) === btnId) {
                        currentButtons.splice(k, 1);
                        break;
                    }
                }
            }
            
            if (!folderAdded) {
                itemOrder.push({
                    type: 'folder',
                    id: folder.id
                });
            }
            
            setItemOrder(itemOrder);
            
            Lampa.Modal.close();
            var notifyText = folderName && folderName.trim() ? 
                'Папка "' + folderName + '" создана' : 
                'Папка без названия создана';
            Lampa.Noty.show(notifyText);
            
            if (currentContainer) {
                currentContainer.data('buttons-processed', false);
                reorderButtons(currentContainer);
            }
            refreshController();
        });

        list.append(createBtn);

        Lampa.Modal.open({
            title: 'Выберите кнопки для папки',
            html: list,
            size: 'medium',
            scroll_to_center: true,
            onBack: function() {
                Lampa.Modal.close();
                openEditDialog();
            }
        });
    }

    function openEditDialog() {
        if (currentContainer) {
            var categories = categorizeButtons(currentContainer);
            var allButtons = []
                .concat(categories.online)
                .concat(categories.torrent)
                .concat(categories.trailer)
                .concat(categories.favorite)
                .concat(categories.subscribe)
                .concat(categories.book)
                .concat(categories.reaction)
                .concat(categories.other);
            
            allButtons = sortByCustomOrder(allButtons);
            allButtonsCache = allButtons;
            
            var folders = getFolders();
            var buttonsInFolders = [];
            folders.forEach(function(folder) {
                buttonsInFolders = buttonsInFolders.concat(folder.buttons);
            });
            
            var filteredButtons = allButtons.filter(function(btn) {
                return buttonsInFolders.indexOf(getButtonId(btn)) === -1;
            });
            
            currentButtons = filteredButtons;
        }
        
        var list = $('<div class="menu-edit-list"></div>');
        var hidden = getHiddenButtons();
        var folders = getFolders();
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

        function createFolderItem(folder) {
            var item = $('<div class="menu-edit-list__item folder-item">' +
                '<div class="menu-edit-list__icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
                    '</svg>' +
                '</div>' +
                '<div class="menu-edit-list__title">' + (folder.name || 'Папка') + ' <span style="opacity:0.5">(' + folder.buttons.length + ')</span></div>' +
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

            item.data('folderId', folder.id);
            item.data('itemType', 'folder');

            item.find('.menu-edit-list__edit-content').on('hover:enter', function() {
                Lampa.Modal.close();
                setTimeout(function() {
                    openFolderEditDialog(folder);
                }, 100);
            });

            item.find('.move-up').on('hover:enter', function() {
                var prev = item.prev();
                while (prev.length && (prev.hasClass('menu-edit-list__create-folder') || prev.hasClass('viewmode-switch'))) {
                    prev = prev.prev();
                }
                if (prev.length) {
                    item.insertBefore(prev);
                    saveItemOrder();
                }
            });

            item.find('.move-down').on('hover:enter', function() {
                var next = item.next();
                while (next.length && next.hasClass('folder-reset-button')) {
                    next = next.next();
                }
                if (next.length && !next.hasClass('folder-reset-button')) {
                    item.insertAfter(next);
                    saveItemOrder();
                }
            });

            item.find('.menu-edit-list__rename').on('hover:enter', function() {
                Lampa.Modal.close();
                setTimeout(function() {
                    Lampa.Input.edit({
                        title: 'Переименовать папку',
                        value: folder.name || '',
                        free: true,
                        nosave: true,
                        nomic: true,
                        placeholder: 'Оставьте пустым для папки без названия'
                    }, function(newName) {
                        // Ключевое исправление: принимаем любую строку, включая пустую
                        if (newName !== null) {
                            var folders = getFolders();
                            var targetFolder = folders.find(function(f) { return f.id === folder.id; });
                            if (targetFolder) {
                                targetFolder.name = newName.trim();
                                setFolders(folders);
                                Lampa.Noty.show('Папка переименована');
                            }
                        }
                        openEditDialog();
                    });
                }, 100);
            });

            item.find('.menu-edit-list__delete').on('hover:enter', function() {
                var folderId = folder.id;
                var folderButtons = folder.buttons.slice();
                
                deleteFolder(folderId);
                
                var itemOrder = getItemOrder();
                var newItemOrder = [];
                
                for (var i = 0; i < itemOrder.length; i++) {
                    if (itemOrder[i].type === 'folder' && itemOrder[i].id === folderId) {
                        continue;
                    }
                    if (itemOrder[i].type === 'button') {
                        var isInFolder = false;
                        for (var j = 0; j < folderButtons.length; j++) {
                            if (itemOrder[i].id === folderButtons[j]) {
                                isInFolder = true;
                                break;
                            }
                        }
                        if (isInFolder) {
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
                    for (var j = 0; j < folderButtons.length; j++) {
                        if (customOrder[i] === folderButtons[j]) {
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
                Lampa.Noty.show('Папка удалена');
                
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
                while (prev.length && (prev.hasClass('menu-edit-list__create-folder') || prev.hasClass('viewmode-switch'))) {
                    prev = prev.prev();
                }
                if (prev.length && !prev.hasClass('menu-edit-list__create-folder')) {
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
                while (next.length && next.hasClass('folder-reset-button')) {
                    next = next.next();
                }
                if (next.length && !next.hasClass('folder-reset-button')) {
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
                // Убираем "(без текста)" из текущего названия
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
                        // Ключевое исправление: newName может быть null при отмене или пустой строкой
                        // Принимаем любую строку, включая пустую
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

        var createFolderBtn = $('<div class="menu-edit-list__item menu-edit-list__create-folder selector">' +
            '<div class="menu-edit-list__icon">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
                    '<line x1="12" y1="11" x2="12" y2="17"></line>' +
                    '<line x1="9" y1="14" x2="15" y2="14"></line>' +
                '</svg>' +
            '</div>' +
            '<div class="menu-edit-list__title">Создать папку</div>' +
        '</div>');

        createFolderBtn.on('hover:enter', function() {
            Lampa.Modal.close();
            openCreateFolderDialog();
        });

        list.append(createFolderBtn);
        
        if (itemOrder.length > 0) {
            itemOrder.forEach(function(item) {
                if (item.type === 'folder') {
                    var folder = folders.find(function(f) { return f.id === item.id; });
                    if (folder) {
                        list.append(createFolderItem(folder));
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
            
            folders.forEach(function(folder) {
                var found = itemOrder.some(function(item) {
                    return item.type === 'folder' && item.id === folder.id;
                });
                if (!found) {
                    list.append(createFolderItem(folder));
                }
            });
        } else {
            folders.forEach(function(folder) {
                list.append(createFolderItem(folder));
            });
            
            currentButtons.forEach(function(btn) {
                list.append(createButtonItem(btn));
            });
        }

        var resetBtn = $('<div class="selector folder-reset-button">' +
            '<div style="text-align: center; padding: 1em;">Сбросить по умолчанию</div>' +
        '</div>');
        
        resetBtn.on('hover:enter', function() {
            Lampa.Storage.set('button_renamed', {});
            Lampa.Storage.set('button_custom_order', []);
            Lampa.Storage.set('button_hidden', []);
            Lampa.Storage.set('button_folders', []);
            Lampa.Storage.set('button_item_order', []);
            Lampa.Storage.set('buttons_viewmode', 'default');
            Lampa.Modal.close();
            Lampa.Noty.show('Настройки сброшены');
            
            setTimeout(function() {
                if (currentContainer) {
                    currentContainer.find('.button--play, .button--edit-order, .button--folder').remove();
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

    function saveOrder() {
        var order = [];
        currentButtons.forEach(function(btn) {
            order.push(getButtonId(btn));
        });
        setCustomOrder(order);
    }

    function saveItemOrder() {
        var order = [];
        var items = $('.menu-edit-list .menu-edit-list__item').not('.menu-edit-list__create-folder, .viewmode-switch, .folder-reset-button');
        
        items.each(function() {
            var $item = $(this);
            var itemType = $item.data('itemType');
            
            if (itemType === 'folder') {
                order.push({
                    type: 'folder',
                    id: $item.data('folderId')
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

    // ========== ОСНОВНАЯ ЛОГИКА ==========

    function applyChanges() {
        if (!currentContainer) return;
        
        var categories = categorizeButtons(currentContainer);
        var allButtons = []
            .concat(categories.online)
            .concat(categories.torrent)
            .concat(categories.trailer)
            .concat(categories.favorite)
            .concat(categories.subscribe)
            .concat(categories.book)
            .concat(categories.reaction)
            .concat(categories.other);
        
        allButtons = sortByCustomOrder(allButtons);
        allButtonsCache = allButtons;
        
        var folders = getFolders();
        var foldersUpdated = false;
        
        // Обновляем кнопки в папках
        folders.forEach(function(folder) {
            var updatedButtons = [];
            var usedButtons = [];
            
            folder.buttons.forEach(function(oldBtnId) {
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
            
            if (updatedButtons.length !== folder.buttons.length || 
                updatedButtons.some(function(id, i) { return id !== folder.buttons[i]; })) {
                folder.buttons = updatedButtons;
                foldersUpdated = true;
            }
        });
        
        if (foldersUpdated) {
            setFolders(folders);
        }
        
        var buttonsInFolders = [];
        folders.forEach(function(folder) {
            buttonsInFolders = buttonsInFolders.concat(folder.buttons);
        });
        
        var filteredButtons = allButtons.filter(function(btn) {
            return buttonsInFolders.indexOf(getButtonId(btn)) === -1;
        });
        
        currentButtons = filteredButtons;
        applyHiddenButtons(filteredButtons);
        
        var targetContainer = currentContainer.find('.full-start-new__buttons');
        if (!targetContainer.length) return;

        targetContainer.find('.full-start__button').not('.button--edit-order').detach();
        
        var itemOrder = getItemOrder();
        var visibleButtons = [];
        var folders = getFolders();
        var buttonsInFolders = [];
        folders.forEach(function(folder) {
            buttonsInFolders = buttonsInFolders.concat(folder.buttons);
        });
        
        // Применяем переименованные названия
        applyRenamedButtons(allButtons);
        
        if (itemOrder.length > 0) {
            var addedFolders = [];
            var addedButtons = [];
            
            itemOrder.forEach(function(item) {
                if (item.type === 'folder') {
                    var folder = folders.find(function(f) { return f.id === item.id; });
                    if (folder) {
                        var folderBtn = createFolderButton(folder);
                        targetContainer.append(folderBtn);
                        visibleButtons.push(folderBtn);
                        addedFolders.push(folder.id);
                    }
                } else if (item.type === 'button') {
                    var btnId = item.id;
                    if (buttonsInFolders.indexOf(btnId) === -1) {
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
                if (addedButtons.indexOf(btnId) === -1 && !btn.hasClass('hidden') && buttonsInFolders.indexOf(btnId) === -1) {
                    var insertBefore = null;
                    var btnType = getButtonType(btn);
                    var typeOrder = ['online', 'torrent', 'trailer', 'favorite', 'subscribe', 'book', 'reaction', 'other'];
                    var btnTypeIndex = typeOrder.indexOf(btnType);
                    if (btnTypeIndex === -1) btnTypeIndex = 999;
                    
                    if (btnId === 'modss_online_button' || btnId === 'showy_online_button') {
                        var firstNonPriority = targetContainer.find('.full-start__button').not('.button--edit-order, .button--folder').filter(function() {
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
                        targetContainer.find('.full-start__button').not('.button--edit-order, .button--folder').each(function() {
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
            
            folders.forEach(function(folder) {
                if (addedFolders.indexOf(folder.id) === -1) {
                    var folderBtn = createFolderButton(folder);
                    targetContainer.append(folderBtn);
                    visibleButtons.push(folderBtn);
                }
            });
        } else {
            currentButtons.forEach(function(btn) {
                var btnId = getButtonId(btn);
                if (!btn.hasClass('hidden') && buttonsInFolders.indexOf(btnId) === -1) {
                    targetContainer.append(btn);
                    visibleButtons.push(btn);
                }
            });
            
            folders.forEach(function(folder) {
                var folderBtn = createFolderButton(folder);
                targetContainer.append(folderBtn);
                visibleButtons.push(folderBtn);
            });
        }

        // Применяем режим отображения
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
        
        setTimeout(function() {
            if (currentContainer) {
                setupButtonNavigation(currentContainer);
            }
        }, 100);
    }

    function reorderButtons(container) {
        var targetContainer = container.find('.full-start-new__buttons');
        if (!targetContainer.length) return false;

        currentContainer = container;
        container.find('.button--play, .button--edit-order, .button--folder').remove();

        var categories = categorizeButtons(container);
        
        var allButtons = []
            .concat(categories.online)
            .concat(categories.torrent)
            .concat(categories.trailer)
            .concat(categories.favorite)
            .concat(categories.subscribe)
            .concat(categories.book)
            .concat(categories.reaction)
            .concat(categories.other);

        allButtons = sortByCustomOrder(allButtons);
        allButtonsCache = allButtons;
        
        if (allButtonsOriginal.length === 0) {
            allButtons.forEach(function(btn) {
                allButtonsOriginal.push(btn.clone(true, true));
            });
        }

        var folders = getFolders();
        var buttonsInFolders = [];
        folders.forEach(function(folder) {
            buttonsInFolders = buttonsInFolders.concat(folder.buttons);
        });

        var filteredButtons = allButtons.filter(function(btn) {
            return buttonsInFolders.indexOf(getButtonId(btn)) === -1;
        });

        currentButtons = filteredButtons;
        applyHiddenButtons(filteredButtons);

        targetContainer.children().detach();
        
        var visibleButtons = [];
        var itemOrder = getItemOrder();
        
        // Применяем переименованные названия
        applyRenamedButtons(allButtons);
        
        if (itemOrder.length > 0) {
            var addedFolders = [];
            var addedButtons = [];
            
            itemOrder.forEach(function(item) {
                if (item.type === 'folder') {
                    var folder = folders.find(function(f) { return f.id === item.id; });
                    if (folder) {
                        var folderBtn = createFolderButton(folder);
                        targetContainer.append(folderBtn);
                        visibleButtons.push(folderBtn);
                        addedFolders.push(folder.id);
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
                    var typeOrder = ['online', 'torrent', 'trailer', 'favorite', 'subscribe', 'book', 'reaction', 'other'];
                    var btnTypeIndex = typeOrder.indexOf(btnType);
                    if (btnTypeIndex === -1) btnTypeIndex = 999;
                    
                    if (btnId === 'modss_online_button' || btnId === 'showy_online_button') {
                        var firstNonPriority = targetContainer.find('.full-start__button').not('.button--edit-order, .button--folder').filter(function() {
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
                        targetContainer.find('.full-start__button').not('.button--edit-order, .button--folder').each(function() {
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
            
            folders.forEach(function(folder) {
                if (addedFolders.indexOf(folder.id) === -1) {
                    var folderBtn = createFolderButton(folder);
                    targetContainer.append(folderBtn);
                    visibleButtons.push(folderBtn);
                }
            });
        } else {
            folders.forEach(function(folder) {
                var folderBtn = createFolderButton(folder);
                targetContainer.append(folderBtn);
                visibleButtons.push(folderBtn);
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

        // Применяем режим отображения
        var viewmode = getViewMode();
        targetContainer.removeClass('icons-only always-text');
        if (viewmode === 'icons') targetContainer.addClass('icons-only');
        if (viewmode === 'always') targetContainer.addClass('always-text');

        applyButtonAnimation(visibleButtons);
        
        setTimeout(function() {
            setupButtonNavigation(container);
        }, 100);

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
            '.button--folder { cursor: pointer; }' +
            '.full-start-new__buttons { ' +
                'display: flex !important; ' +
                'flex-direction: row !important; ' +
                'flex-wrap: wrap !important; ' +
                'gap: 0.5em !important; ' +
            '}' +
            '.full-start-new__buttons.buttons-loading .full-start__button { visibility: hidden !important; }' +
            '.full-start-new__buttons.icons-only .full-start__button:not(.button--folder) span,' +
            '.full-start-new__buttons.icons-only .button--folder span {' +
                'display: none;' +
            '}' +
            '.full-start-new__buttons.always-text .full-start__button span {' +
                'display: block !important;' +
            '}' +
            '.menu-edit-list__create-folder { background: rgba(100,200,100,0.2); }' +
            '.menu-edit-list__create-folder.focus { background: rgba(100,200,100,0.3); border: 3px solid rgba(255,255,255,0.8); }' +
            '.menu-edit-list__delete, .menu-edit-list__rename, .menu-edit-list__edit-content { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }' +
            '.menu-edit-list__delete svg, .menu-edit-list__rename svg, .menu-edit-list__edit-content svg { width: 1.2em !important; height: 1.2em !important; }' +
            '.menu-edit-list__delete.focus, .menu-edit-list__rename.focus, .menu-edit-list__edit-content.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }' +
            '.folder-item .menu-edit-list__move { margin-right: 0; }' +
            '.folder-create-confirm { background: rgba(100,200,100,0.3); margin-top: 1em; border-radius: 0.3em; }' +
            '.folder-create-confirm.focus { border: 3px solid rgba(255,255,255,0.8); }' +
            '.folder-reset-button { background: rgba(200,100,100,0.3); margin-top: 1em; border-radius: 0.3em; }' +
            '.folder-reset-button.focus { border: 3px solid rgba(255,255,255,0.8); }' +
            '.menu-edit-list__toggle.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }' +
            '.viewmode-switch { background: rgba(100,100,255,0.3); margin: 0 0 1em 0; border-radius: 0.3em; }' +
            '.viewmode-switch.focus { border: 3px solid rgba(255,255,255,0.8); }' +
            '.button--folder.folder--no-name { min-width: 3.5em; max-width: 3.5em; justify-content: center; }' +
            '.button--folder.folder--no-name > span { display: none; }' +
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
                                targetContainer.removeClass('buttons-loading');
                            }
                            refreshController();
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
