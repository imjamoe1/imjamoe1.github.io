// ==UserScript==
// @name         Lampa - Мои расширения с категориями
// @version      1.0
// @description  Добавляет категории в родной экран расширений через extensions.appendLine()
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

                    if (url.length > 300) {
                        notify(tr('account_export_fail_600', 'Слишком длинная ссылка'));
                        if (line && line.toggle) line.toggle();
                        return;
                    }

                    list = getList(category.key);

                    if (list.some(function (item) { return (item.url || item.link) === url; })) {
                        notify('Плагин уже есть в разделе ' + category.title);
                        if (line && line.toggle) line.toggle();
                        return;
                    }

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
            var descr = item && item.querySelector('.extensions__item-descr');
            var url = descr && descr.textContent;

            if (!item || !url) return;

            item.__myExtLastUrl = url;
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

    function hookPluginsAdd() {
        if (!Lampa.Plugins || typeof Lampa.Plugins.add !== 'function') return false;
        if (Lampa.Plugins.add.__myExtWrapped) return true;

        var originalAdd = Lampa.Plugins.add;

        Lampa.Plugins.add = function (data) {
            var result = originalAdd.apply(this, arguments);

            try {
                if (!addingFromCategory && data && data.url) {
                    var list = getList('my');

                    if (!list.some(function (item) { return item.url === data.url; })) {
                        list.unshift({
                            url: data.url,
                            name: data.name || tr('extensions_no_name', 'No name'),
                            author: data.author || 'Мои',
                            descr: data.descr || data.description || data.url,
                            status: data.status === 0 ? 0 : 1
                        });

                        saveList('my', list);
                    }
                }
            } catch (e) {}

            return result;
        };

        Lampa.Plugins.add.__myExtWrapped = true;
        return true;
    }

    function hookPluginsRemove() {
        if (!Lampa.Plugins || typeof Lampa.Plugins.remove !== 'function') return false;
        if (Lampa.Plugins.remove.__myExtWrapped) return true;

        var originalRemove = Lampa.Plugins.remove;

        Lampa.Plugins.remove = function (data) {
            var url = data && (data.url || data.link);
            var result = originalRemove.apply(this, arguments);

            try {
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
        hookExtensionsOpen();
        hookPluginsAdd();
        hookPluginsRemove();
        hookPluginsSave();

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
