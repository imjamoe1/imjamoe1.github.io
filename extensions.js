// ==UserScript==
// @name         Lampa - Мои расширения с категориями
// @version      1.1
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
    var currentMenuContext = null;
    var moveState = null;

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

    function setMovingElement(element) {
        document.querySelectorAll('.lampa-my-ext-moving').forEach(function (node) {
            node.classList.remove('lampa-my-ext-moving');
        });

        if (element) element.classList.add('lampa-my-ext-moving');
    }

    function stopMoveMode(save) {
        if (!moveState) return;

        if (save) saveLineOrder(moveState.line, moveState.category);

        setMovingElement(null);
        notify('Позиция сохранена');

        try {
            if (moveState.line && moveState.line.toggle) moveState.line.toggle();
        } catch (e) {}

        moveState = null;
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
        to = from + step;

        if (to < 0 || to > items.length - 1) return;

        active = items[from];
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

    function startMoveMode(context) {
        var category;
        var line;
        var index;
        var element;

        if (!context || !context.url || !context.category) return;

        category = context.category;
        line = categoryLines[category.key];

        if (!line || !line.items || !line.items.length) {
            notify('В этом разделе нечего перемещать');
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
            category: category,
            line: line,
            index: index
        };

        setMovingElement(element);
        notify('Режим перемещения: влево/вправо, OK или назад - сохранить');

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
        var accept = key === 'Enter' || key === 'OK' || code === 13;
        var back = key === 'Escape' || key === 'Backspace' || code === 8 || code === 27 || code === 461 || code === 10009;

        if (!moveState) return;
        if (!left && !right && !accept && !back) return;

        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();

        if (left) moveActiveItem(-1);
        else if (right) moveActiveItem(1);
        else stopMoveMode(true);
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
                                status: data.status
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
            line.scroll.body(true).appendChild(button);
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
            var category = categoryByBlock(block);

            if (!item || !url) return;

            item.__myExtLastUrl = url;
            currentMenuContext = category ? {
                category: category,
                url: normalizeUrl(url)
            } : null;
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

                removePluginFromStorageByUrl(url);
                removeFromCategoryLists(url);
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
