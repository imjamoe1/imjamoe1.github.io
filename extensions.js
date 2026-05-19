// ==UserScript==
// @name         Lampa - Мои расширения с категориями
// @version      1.11
// @description  Добавляет категории в Расширения через extensions.appendLine()
// @author       Custom
// @match        *://lampa.*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (window.__lampaMyExtensionCategoriesLoaded) return;
    window.__lampaMyExtensionCategoriesLoaded = true;

    var CATEGORIES = [
        { key: 'favorite', title: 'Избранное' },
        { key: 'my', title: 'Мои' },
        { key: 'online', title: 'Онлайн' },
        { key: 'bylampa', title: 'ByLampa' }
    ];
    var addingFromCategory = false;
    var categoryLines = {};
    var installedLine = null;
    var currentMenuContext = null;
    var moveState = null;
    var suppressMenuUntil = 0;

    function log() {
        try {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('[MyExt]');
            console.log.apply(console, args);
        } catch (e) {}
    }

    function tr(key, fallback) {
        try {
            return Lampa.Lang.translate(key) || fallback || key;
        } catch (e) {
            return fallback || key;
        }
    }

    function getList(category) {
        try {
            return JSON.parse(localStorage.getItem('lampa_' + category + '_extensions') || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveList(category, list) {
        localStorage.setItem('lampa_' + category + '_extensions', JSON.stringify(list));
    }

    function normalizeUrl(url) {
        return String(url || '').trim();
    }

    function findInstalledPlugin(url) {
        var target = normalizeUrl(url);
        var plugins = [];

        if (!target) return null;

        try {
            if (Lampa.Plugins && Lampa.Plugins.get) plugins = Lampa.Plugins.get() || [];
        } catch (e) {}

        if (!plugins.length) {
            try {
                plugins = JSON.parse(localStorage.getItem('plugins') || '[]') || [];
            } catch (e) {
                plugins = [];
            }
        }

        return plugins.find(function (item) {
            return normalizeUrl(item && (item.url || item.link)) === target;
        }) || null;
    }

    function findCategoryByUrl(url) {
        var target = normalizeUrl(url);
        var found = null;

        if (!target) return null;

        CATEGORIES.some(function (category) {
            var has = getList(category.key).some(function (item) {
                return normalizeUrl(item && (item.url || item.link)) === target;
            });

            if (has) found = category;
            return has;
        });

        return found;
    }

    function showInstallBlockedMessage(url, category) {
        var installed = findInstalledPlugin(url);
        var inCategory = findCategoryByUrl(url);

        if (inCategory) {
            if (inCategory.key === category.key) notify('Плагин уже есть в этом разделе');
            else notify('Плагин уже есть в разделе ' + inCategory.title);
            return true;
        }

        if (installed) {
            if (installed.status === 0) notify('Плагин уже установлен, но отключен в расширениях!');
            else notify('Плагин уже установлен!');
            return true;
        }

        return false;
    }

    function removeFromCategoryLists(url) {
        if (!url) return;

        CATEGORIES.forEach(function (category) {
            var list = getList(category.key);
            var filtered = list.filter(function (item) {
                return (item.url || item.link) !== url;
            });

            if (filtered.length !== list.length) saveList(category.key, filtered);
        });
    }

    function updateCategoryItem(url, patch) {
        if (!url) return;

        CATEGORIES.forEach(function (category) {
            var changed = false;
            var list = getList(category.key).map(function (item) {
                if ((item.url || item.link) !== url) return item;

                changed = true;
                return Object.assign({}, item, patch);
            });

            if (changed) saveList(category.key, list);
        });
    }

    function normalizePlugin(item, category) {
        return {
            url: item.url || item.link,
            link: item.link || item.url,
            name: item.name || tr('extensions_no_name', 'No name'),
            author: item.author || category.title,
            descr: item.descr || item.description || item.url || item.link,
            status: item.status === 0 ? 0 : 1,
            my_ext_category: category.key
        };
    }

    function categoryData(category) {
        return getList(category.key)
            .filter(function (item) {
                return item && (item.url || item.link);
            })
            .map(function (item) {
                return normalizePlugin(item, category);
            });
    }

    function allCategoryUrls() {
        var urls = [];

        CATEGORIES.forEach(function (category) {
            getList(category.key).forEach(function (item) {
                var url = item && (item.url || item.link);
                if (url && urls.indexOf(url) < 0) urls.push(url);
            });
        });

        return urls;
    }

    function filterInstalledDuplicates(data) {
        var urls = allCategoryUrls();

        if (!urls.length || !data || !data.filter) return data;

        return data.filter(function (item) {
            var url = item && (item.url || item.link);
            return !url || urls.indexOf(url) < 0;
        });
    }

    function removePluginFromStorageByUrl(url) {
        if (!url) return;

        try {
            var raw = localStorage.getItem('plugins') || '[]';
            var list = JSON.parse(raw);

            if (!Array.isArray(list)) return;

            var filtered = list.filter(function (item) {
                return item && item.url !== url && item.link !== url;
            });

            if (filtered.length !== list.length) {
                localStorage.setItem('plugins', JSON.stringify(filtered));
            }
        } catch (e) {}
    }

    function ensureDefaults() {
        CATEGORIES.forEach(function (category) {
            if (!localStorage.getItem('lampa_' + category.key + '_extensions')) {
                saveList(category.key, []);
            }
        });
    }

    function restoreCategoriesFromPlugins() {
        var plugins = [];
        var changed = {};

        try {
            plugins = JSON.parse(localStorage.getItem('plugins') || '[]') || [];
        } catch (e) {
            plugins = [];
        }

        plugins.forEach(function (plugin) {
            var categoryKey = plugin && plugin.my_ext_category;
            var category = CATEGORIES.find(function (item) {
                return item.key === categoryKey;
            });
            var list;
            var url;

            if (!category) return;

            url = normalizeUrl(plugin.url || plugin.link);
            if (!url) return;

            list = getList(category.key);

            if (list.some(function (item) {
                return normalizeUrl(item && (item.url || item.link)) === url;
            })) return;

            list.push(normalizePlugin(plugin, category));
            saveList(category.key, list);
            changed[category.key] = true;
        });

        return changed;
    }

    function syncCategoryMarkersToPlugins() {
        var plugins = [];
        var changed = false;

        try {
            plugins = JSON.parse(localStorage.getItem('plugins') || '[]') || [];
        } catch (e) {
            plugins = [];
        }

        CATEGORIES.forEach(function (category) {
            getList(category.key).forEach(function (categoryItem) {
                var url = normalizeUrl(categoryItem && (categoryItem.url || categoryItem.link));
                var plugin;

                if (!url) return;

                plugin = plugins.find(function (item) {
                    return normalizeUrl(item && (item.url || item.link)) === url;
                });

                if (plugin) {
                    if (plugin.my_ext_category !== category.key) {
                        plugin.my_ext_category = category.key;
                        changed = true;
                    }
                } else {
                    plugins.push(normalizePlugin(categoryItem, category));
                    changed = true;
                }
            });
        });

        if (changed) localStorage.setItem('plugins', JSON.stringify(plugins));
    }

    function notify(text) {
        try {
            if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(text);
        } catch (e) {}
    }

    function injectMoveStyle() {
        if (document.getElementById('lampa-my-ext-move-style')) return;

        var style = document.createElement('style');
        style.id = 'lampa-my-ext-move-style';
        style.textContent =
            '@keyframes lampaMyExtMoveBlink{' +
                '0%,100%{outline:0.18em solid rgba(255,214,0,1);filter:brightness(1.25)}' +
                '50%{outline:0.18em solid rgba(255,214,0,0.1);filter:brightness(0.75)}' +
            '}' +
            '.lampa-my-ext-moving{' +
                'animation:lampaMyExtMoveBlink .75s linear infinite!important;' +
                'outline-offset:-0.18em!important;' +
            '}';

        document.head.appendChild(style);
    }

    function categoryByTitle(title) {
        return CATEGORIES.find(function (category) {
            return title && title.trim() === category.title;
        }) || null;
    }

    function categoryByBlock(block) {
        var title = block && block.querySelector('.extensions__block-title');
        return categoryByTitle(title && title.textContent);
    }

    function isInstalledBlock(block) {
        var title = block && block.querySelector('.extensions__block-title');
        var text = title && title.textContent;

        return !!(text && (
            text.indexOf(tr('extensions_from_memory', 'Установленные в память')) >= 0 ||
            text.indexOf('Установленные') >= 0
        ));
    }

    function moveContextByBlock(block, url) {
        var category = categoryByBlock(block);

        if (category) {
            return {
                type: 'category',
                category: category,
                url: normalizeUrl(url)
            };
        }

        if (isInstalledBlock(block)) {
            return {
                type: 'installed',
                url: normalizeUrl(url)
            };
        }

        return null;
    }

    function itemUrl(itemObject) {
        return normalizeUrl(itemObject && itemObject.data && (itemObject.data.url || itemObject.data.link));
    }

    function lineItemElement(itemObject) {
        try {
            return itemObject && itemObject.render ? itemObject.render() : null;
        } catch (e) {
            return null;
        }
    }

    function saveLineOrder(line, category) {
        if (!line || !line.items || !category) return;

        saveList(category.key, line.items.map(function (item) {
            return normalizePlugin(item.data || {}, category);
        }));
    }

    function saveInstalledLineOrder(line) {
        var list;

        if (!line || !line.items) return;

        list = line.items.map(function (item) {
            return pluginDataFromItem(item, true);
        }).reverse();

        localStorage.setItem('plugins', JSON.stringify(list));
    }

    function saveMoveOrder(state) {
        if (!state) return;

        if (state.type === 'installed') saveInstalledLineOrder(state.line);
        else saveLineOrder(state.line, state.category);
    }

    function pluginDataFromItem(item, clearCategory) {
        var data = Object.assign({}, item && item.data || {});

        data.url = data.url || data.link;
        data.link = data.link || data.url;
        data.status = data.status === 0 ? 0 : 1;
        if (clearCategory) delete data.my_ext_category;

        return data;
    }

    function pushUniquePlugin(list, data) {
        var url = normalizeUrl(data && (data.url || data.link));

        if (!url) return;
        if (list.some(function (item) {
            return normalizeUrl(item && (item.url || item.link)) === url;
        })) return;

        list.push(data);
    }

    function savePluginsStorageOrder() {
        var plugins = [];

        if (installedLine && installedLine.items) {
            installedLine.items.map(function (item) {
                return pluginDataFromItem(item, true);
            }).reverse().forEach(function (item) {
                pushUniquePlugin(plugins, item);
            });
        }

        CATEGORIES.forEach(function (category) {
            var line = categoryLines[category.key];

            if (line && line.items) {
                line.items.map(function (item) {
                    return normalizePlugin(item.data || {}, category);
                }).forEach(function (item) {
                    pushUniquePlugin(plugins, item);
                });
            } else {
                categoryData(category).forEach(function (item) {
                    pushUniquePlugin(plugins, item);
                });
            }
        });

        localStorage.setItem('plugins', JSON.stringify(plugins));
    }

    function saveAllMoveOrders() {
        CATEGORIES.forEach(function (category) {
            saveLineOrder(categoryLines[category.key], category);
        });

        savePluginsStorageOrder();
    }

    function removeUrlFromLine(line, url) {
        var target = normalizeUrl(url);
        var removed = false;

        if (!line || !line.items || !target) return false;

        line.items = line.items.filter(function (item) {
            var keep = itemUrl(item) !== target;
            if (!keep) removed = true;
            return keep;
        });

        if (removed) {
            line.data = line.items.map(function (item) {
                return item.data;
            });
            line.active = Math.max(0, Math.min(line.active || 0, line.items.length - 1));
        }

        return removed;
    }

    function removeUrlFromVisibleLines(url) {
        var removed = false;

        removed = removeUrlFromLine(installedLine, url) || removed;

        CATEGORIES.forEach(function (category) {
            removed = removeUrlFromLine(categoryLines[category.key], url) || removed;
        });

        return removed;
    }

    function orderedMoveTargets() {
        var targets = [];

        if (installedLine) {
            targets.push({
                type: 'installed',
                category: null,
                line: installedLine
            });
        }

        CATEGORIES.forEach(function (category) {
            var line = categoryLines[category.key];

            if (line) {
                targets.push({
                    type: 'category',
                    category: category,
                    line: line
                });
            }
        });

        return targets;
    }

    function setMovingElement(element) {
        document.querySelectorAll('.lampa-my-ext-moving').forEach(function (node) {
            node.classList.remove('lampa-my-ext-moving');
        });

        if (element) element.classList.add('lampa-my-ext-moving');
    }

    function closeActionMenu() {
        try {
            if (Lampa.Select && Lampa.Select.close) Lampa.Select.close();
        } catch (e) {}

        try {
            if (Lampa.Modal && Lampa.Modal.close) Lampa.Modal.close();
        } catch (e) {}
    }

    function commitMovePosition(message) {
        if (!moveState) return;

        saveAllMoveOrders();
        suppressMenuUntil = Date.now() + 900;
        currentMenuContext = null;

        if (message) notify(message);
    }

    function stopMoveMode(save, exitExtensions) {
        if (!moveState) return;

        if (save) commitMovePosition('Порядок сохранен');

        setMovingElement(null);
        closeActionMenu();

        try {
            if (moveState.line && moveState.line.toggle) moveState.line.toggle();
        } catch (e) {}

        moveState = null;

        if (exitExtensions) {
            try {
                if (Lampa.Controller && Lampa.Controller.back) Lampa.Controller.back();
                else if (Lampa.Controller && Lampa.Controller.enabled && Lampa.Controller.enabled().controller && Lampa.Controller.enabled().controller.back) {
                    Lampa.Controller.enabled().controller.back();
                }
            } catch (e) {}
        }
    }

    function moveActiveItem(step) {
        var line;
        var items;
        var from;
        var to;
        var active;
        var target;
        var activeElement;
        var targetElement;
        var body;

        if (!moveState) return;

        line = moveState.line;
        items = line && line.items;
        if (!items || !items.length) return;

        from = moveState.index;
        if (moveState.item) {
            from = items.indexOf(moveState.item);
            if (from < 0) from = moveState.index;
        }
        if (from < 0 || from > items.length - 1) return;
        to = from + step;

        if (to < 0 || to > items.length - 1) return;

        active = items[from];
        moveState.item = active;
        target = items[to];
        activeElement = lineItemElement(active);
        targetElement = lineItemElement(target);
        body = line.scroll && line.scroll.body && line.scroll.body(true);

        if (!activeElement || !targetElement || !body) return;

        if (step > 0) body.insertBefore(targetElement, activeElement);
        else body.insertBefore(activeElement, targetElement);

        items[from] = target;
        items[to] = active;
        line.data = items.map(function (item) { return item.data; });
        line.active = to;
        moveState.index = to;

        setMovingElement(activeElement);

        try {
            line.last = activeElement;
            if (line.scroll && line.scroll.update) line.scroll.update(activeElement, true);
        } catch (e) {}
    }

    function insertElementIntoLine(line, element, index) {
        var body;
        var refItem;
        var refElement;
        var addButton;
        var nextNode;

        body = line && line.scroll && line.scroll.body && line.scroll.body(true);
        if (!body || !element) return false;

        refItem = line.items && line.items[index];
        refElement = lineItemElement(refItem);

        if (refElement && refElement.parentNode === body) {
            body.insertBefore(element, refElement);
            keepAddButtonFirst(line);
            return true;
        }

        addButton = body.querySelector('.extensions__block-add');

        if (addButton && addButton.parentNode === body) {
            nextNode = addButton.nextSibling;
            if (nextNode) body.insertBefore(element, nextNode);
            else body.appendChild(element);
        }
        else body.appendChild(element);

        return true;
    }

    function keepAddButtonFirst(line) {
        var body;
        var addButton;

        body = line && line.scroll && line.scroll.body && line.scroll.body(true);
        if (!body) return;

        addButton = body.querySelector('.extensions__block-add');

        if (addButton && addButton.parentNode === body && body.firstChild !== addButton) {
            body.insertBefore(addButton, body.firstChild);
        }
    }

    function moveActiveItemToLine(step) {
        var targets;
        var currentTargetIndex;
        var target;
        var sourceLine;
        var targetLine;
        var sourceItems;
        var targetItems;
        var fromIndex;
        var toIndex;
        var active;
        var activeElement;

        if (!moveState) return;

        targets = orderedMoveTargets();
        currentTargetIndex = targets.findIndex(function (item) {
            return item.line === moveState.line;
        });

        if (currentTargetIndex < 0) return;

        target = targets[currentTargetIndex + step];
        if (!target || !target.line) return;

        sourceLine = moveState.line;
        targetLine = target.line;
        sourceItems = sourceLine.items || [];
        targetItems = targetLine.items || [];
        fromIndex = moveState.index;
        active = sourceItems[fromIndex];
        if (moveState.item) {
            fromIndex = sourceItems.indexOf(moveState.item);
            if (fromIndex < 0) fromIndex = moveState.index;
            active = sourceItems[fromIndex];
        }
        if (fromIndex < 0 || fromIndex > sourceItems.length - 1) return;
        activeElement = lineItemElement(active);

        if (!active || !activeElement) return;

        toIndex = Math.min(fromIndex, targetItems.length);

        sourceItems.splice(fromIndex, 1);
        targetItems.splice(toIndex, 0, active);

        sourceLine.data = sourceItems.map(function (item) { return item.data; });
        targetLine.data = targetItems.map(function (item) { return item.data; });
        sourceLine.active = Math.max(0, Math.min(fromIndex, sourceItems.length - 1));
        targetLine.active = toIndex;

        insertElementIntoLine(targetLine, activeElement, toIndex);
        keepAddButtonFirst(targetLine);

        moveState.type = target.type;
        moveState.category = target.category;
        moveState.line = targetLine;
        moveState.index = toIndex;
        moveState.item = active;

        setMovingElement(activeElement);

        try {
            targetLine.last = activeElement;
            if (targetLine.scroll && targetLine.scroll.update) targetLine.scroll.update(activeElement, true);
        } catch (e) {}
    }

    function startMoveMode(context) {
        var category;
        var line;
        var index;
        var element;

        if (!context || !context.url) return;

        category = context.category;
        line = context.type === 'installed' ? installedLine : categoryLines[category.key];

        if (!line || !line.items || !line.items.length) {
            notify(context.type === 'installed' ? 'В установленных нечего перемещать' : 'В этом разделе нечего перемещать');
            return;
        }

        index = line.items.findIndex(function (item) {
            return itemUrl(item) === normalizeUrl(context.url);
        });

        if (index < 0) {
            notify('Не удалось найти плагин в разделе');
            return;
        }

        element = lineItemElement(line.items[index]);
        moveState = {
            type: context.type,
            category: category,
            line: line,
            index: index,
            item: line.items[index]
        };

        setMovingElement(element);
        notify('Режим перемещения: влево/вправо - в разделе, вверх/вниз - между разделами, OK - сохранить, Back - отменить');

        try {
            line.last = element;
            if (line.toggle) line.toggle();
        } catch (e) {}
    }

    function handleMoveKeys(event) {
        var key = event.key;
        var code = event.keyCode || event.which;
        var left = key === 'ArrowLeft' || code === 37;
        var right = key === 'ArrowRight' || code === 39;
        var up = key === 'ArrowUp' || code === 38;
        var down = key === 'ArrowDown' || code === 40;
        var accept = key === 'Enter' || key === 'OK' || code === 13;
        var back = key === 'Escape' || key === 'Backspace' || code === 8 || code === 27 || code === 461 || code === 10009;

        if (!moveState) return;
        if (!left && !right && !up && !down && !accept && !back) return;
        if (event.__myExtMoveHandled) return;

        event.__myExtMoveHandled = true;

        event.preventDefault();
        event.stopPropagation();
        event.cancelBubble = true;
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();

        if (left) moveActiveItem(-1);
        else if (right) moveActiveItem(1);
        else if (up) moveActiveItemToLine(-1);
        else if (down) moveActiveItemToLine(1);
        else if (accept) stopMoveMode(true, false);
        else stopMoveMode(false, false);
    }

    function controllerBackToCurrent() {
        try {
            if (Lampa.Controller && Lampa.Controller.enabled && Lampa.Controller.toggle) {
                Lampa.Controller.toggle(Lampa.Controller.enabled().name);
            }
        } catch (e) {}
    }

    function createCategoryAddButton(category, line) {
        var button = document.createElement('div');
        button.classList.add('extensions__block-add');
        button.classList.add('selector');
        button.innerText = tr('extensions_add', 'Добавить');

        button.addEventListener('hover:enter', function () {
            try {
                Lampa.Input.edit({
                    title: tr('extensions_set_url', 'Ссылка на расширение'),
                    value: '',
                    free: true,
                    nosave: true,
                    nomic: true
                }, function (url) {
                    var list;
                    var data;

                    if (!url) {
                        if (line && line.toggle) line.toggle();
                        return;
                    }

                    url = normalizeUrl(url);

                    if (url.length > 300) {
                        notify(tr('account_export_fail_600', 'Слишком длинная ссылка'));
                        if (line && line.toggle) line.toggle();
                        return;
                    }

                    if (showInstallBlockedMessage(url, category)) {
                        if (line && line.toggle) line.toggle();
                        return;
                    }

                    list = getList(category.key);

                    data = normalizePlugin({
                        url: url,
                        name: tr('extensions_no_name', 'No name'),
                        author: category.title,
                        status: 1
                    }, category);

                    list.unshift(data);
                    saveList(category.key, list);

                    try {
                        if (Lampa.Plugins && Lampa.Plugins.add) {
                            addingFromCategory = true;
                            Lampa.Plugins.add({
                                url: data.url,
                                name: data.name,
                                author: data.author,
                                status: data.status,
                                my_ext_category: category.key
                            });
                        }
                    } catch (e) {
                    } finally {
                        addingFromCategory = false;
                    }

                try {
                    if (line && line.append) {
                        line.data.unshift(data);
                        line.append(data);
                        keepAddButtonFirst(line);
                        line.last = button;
                        if (Lampa.Layer && Lampa.Layer.visible) Lampa.Layer.visible(line.render());
                    }
                } catch (e) {}

                    try {
                        cleanupInstalledDuplicates(document);
                    } catch (e) {}

                    if (line && line.toggle) line.toggle();
                });
            } catch (e) {
                log('category add failed', e && e.message);
            }
        });

        return button;
    }

    function attachCategoryAddButton(extensions, category) {
        var line = extensions.items && extensions.items[extensions.items.length - 1];
        var button;

        if (!line || line.__myExtAddButtonAttached) return;

        categoryLines[category.key] = line;
        button = createCategoryAddButton(category, line);

        try {
            line.scroll.body(true).insertBefore(button, line.scroll.body(true).firstChild);
            line.last = button;
            line.__myExtAddButtonAttached = true;
        } catch (e) {
            log('attach add button failed', e && e.message);
        }
    }

    function cleanupInstalledDuplicates(root) {
        var urls = allCategoryUrls();

        if (!root || !urls.length) return;

        Array.prototype.slice.call(root.querySelectorAll('.extensions__block')).forEach(function (block) {
            var title = block.querySelector('.extensions__block-title');
            var isInstalled = title && title.textContent.indexOf(tr('extensions_from_memory', 'Установленные в память')) >= 0;

            if (!isInstalled && title && title.textContent.indexOf('Установленные') >= 0) isInstalled = true;
            if (!isInstalled) return;

            Array.prototype.slice.call(block.querySelectorAll('.extensions__item')).forEach(function (item) {
                var descr = item.querySelector('.extensions__item-descr');
                var url = descr && descr.textContent;

                if (url && urls.indexOf(url) >= 0) item.style.display = 'none';
            });
        });
    }

    function patchExtensionMenus(root) {
        if (!root || root.__myExtMenuPatched) return;
        root.__myExtMenuPatched = true;

        root.addEventListener('hover:enter', function (event) {
            var item = event.target && event.target.closest && event.target.closest('.extensions__item.selector');
            var block = item && item.closest('.extensions__block');
            var descr = item && item.querySelector('.extensions__item-descr');
            var url = descr && descr.textContent;
            var context = moveContextByBlock(block, url);

            if (!item || !url) return;

            if (Date.now() < suppressMenuUntil) {
                event.preventDefault();
                event.stopPropagation();
                if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                return;
            }

            item.__myExtLastUrl = url;
            currentMenuContext = context;
        }, true);

        cleanupInstalledDuplicates(root);
    }

    function injectNativeLines(extensions) {
        if (!extensions || extensions.__myExtLinesWrapped) return;
        extensions.__myExtLinesWrapped = true;

        var originalAppendLine = extensions.appendLine.bind(extensions);
        var injected = false;
        var appendCount = 0;

        extensions.appendLine = function (data, params) {
            if (appendCount === 0 && params && params.type === 'installs') {
                data = filterInstalledDuplicates(data);
            }

            var result = originalAppendLine(data, params);

            appendCount++;

            if (!injected && appendCount === 1) {
                injected = true;
                installedLine = extensions.items && extensions.items[extensions.items.length - 1];

                CATEGORIES.forEach(function (category) {
                    originalAppendLine(categoryData(category), {
                        title: category.title,
                        type: 'installs',
                        autocheck: true,
                        my_ext_category: category.key
                    });

                    attachCategoryAddButton(extensions, category);
                });
            }

            return result;
        };
    }

    function hookExtensionsOpen() {
        if (!Lampa.Extensions || !Lampa.Extensions.listener) return false;
        if (Lampa.Extensions.listener.__myExtHooked) return true;

        Lampa.Extensions.listener.follow('open', function (event) {
            if (!event || !event.extensions) return;

            injectNativeLines(event.extensions);

            setTimeout(function () {
                try {
                    patchExtensionMenus(event.extensions.render && event.extensions.render());
                } catch (e) {}
            }, 500);
        });

        Lampa.Extensions.listener.__myExtHooked = true;
        return true;
    }

    function hookSelectMoveMenu() {
        if (!Lampa.Select || typeof Lampa.Select.show !== 'function') return false;
        if (Lampa.Select.show.__myExtMoveWrapped) return true;

        var originalShow = Lampa.Select.show;

        Lampa.Select.show = function (params) {
            var originalOnSelect;
            var insertIndex;
            var hasMove;
            var context = currentMenuContext;

            if (context && params && params.items && params.items.find) {
                hasMove = params.items.some(function (item) {
                    return item && item.my_ext_move;
                });

                if (!hasMove) {
                    insertIndex = params.items.findIndex(function (item) {
                        return item && item.change === 'url';
                    });

                    if (insertIndex >= 0) {
                        params.items.splice(insertIndex + 1, 0, {
                            title: 'Переместить',
                            my_ext_move: true
                        });
                    }
                }

                originalOnSelect = params.onSelect;
                params.onSelect = function (action) {
                    if (action && action.my_ext_move) {
                        closeActionMenu();
                        suppressMenuUntil = Date.now() + 300;
                        currentMenuContext = null;
                        startMoveMode(context);
                        return;
                    }

                    if (originalOnSelect) originalOnSelect.apply(this, arguments);
                };
            }

            return originalShow.call(this, params);
        };

        Lampa.Select.show.__myExtMoveWrapped = true;
        return true;
    }

    function hookPluginsAdd() {
        return true;
    }

    function hookPluginsRemove() {
        if (!Lampa.Plugins || typeof Lampa.Plugins.remove !== 'function') return false;
        if (Lampa.Plugins.remove.__myExtWrapped) return true;

        var originalRemove = Lampa.Plugins.remove;

        Lampa.Plugins.remove = function (data) {
            var url = data && (data.url || data.link);
            var actual;
            var removedFromLines;
            var result = originalRemove.apply(this, arguments);

            try {
                if (url && Lampa.Plugins.get) {
                    actual = Lampa.Plugins.get().find(function (item) {
                        return item && (item.url === url || item.link === url);
                    });

                    if (actual && actual !== data) {
                        originalRemove.call(this, actual);
                    }
                }

                removedFromLines = removeUrlFromVisibleLines(url);
                removeFromCategoryLists(url);

                if (removedFromLines) saveAllMoveOrders();
                else removePluginFromStorageByUrl(url);
            } catch (e) {}

            return result;
        };

        Lampa.Plugins.remove.__myExtWrapped = true;
        return true;
    }

    function hookPluginsSave() {
        if (!Lampa.Plugins || typeof Lampa.Plugins.save !== 'function') return false;
        if (Lampa.Plugins.save.__myExtWrapped) return true;

        var originalSave = Lampa.Plugins.save;

        Lampa.Plugins.save = function (data) {
            var oldUrl = data && (data.url || data.link);
            var result = originalSave.apply(this, arguments);

            try {
                if (data && oldUrl) {
                    updateCategoryItem(oldUrl, {
                        url: data.url || data.link,
                        link: data.link || data.url,
                        name: data.name,
                        author: data.author,
                        descr: data.descr || data.description || data.url || data.link,
                        status: data.status === 0 ? 0 : 1
                    });
                }
            } catch (e) {}

            return result;
        };

        Lampa.Plugins.save.__myExtWrapped = true;
        return true;
    }

    function start() {
        if (!window.Lampa || !Lampa.Extensions || !Lampa.Plugins) {
            setTimeout(start, 500);
            return;
        }

        ensureDefaults();
        restoreCategoriesFromPlugins();
        syncCategoryMarkersToPlugins();
        injectMoveStyle();
        hookExtensionsOpen();
        hookSelectMoveMenu();
        hookPluginsAdd();
        hookPluginsRemove();
        hookPluginsSave();

        if (!window.__lampaMyExtensionMoveKeysBound) {
            window.__lampaMyExtensionMoveKeysBound = true;
            document.addEventListener('keydown', handleMoveKeys, true);
            window.addEventListener('keydown', handleMoveKeys, true);
        }

        log('ready');
    }

    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (event) {
            if (event && event.type === 'ready') start();
        });
        setTimeout(start, 1000);
    } else {
        var wait = setInterval(function () {
            if (window.Lampa && Lampa.Listener) {
                clearInterval(wait);
                Lampa.Listener.follow('app', function (event) {
                    if (event && event.type === 'ready') start();
                });
                setTimeout(start, 1000);
            }
        }, 300);
    }
})();
