(function () {
    'use strict';

    var PLUGIN_ID = 'lampaua_source_order';
    var STORAGE_KEY = 'lampaua_source_order_v1';
    var isWindows = navigator.userAgent.toLowerCase().indexOf('windows') !== -1;
    var UA_FLAG = isWindows ? '[UA]' : '🇺🇦';
    var EN_FLAG = isWindows ? '[EN]' : '🇬🇧';
    var FALLBACK_ICON = '▶';

    // ============================================================
    // Добавляем ПЕРЕВОДЫ ЧЕРЕЗ Lampa.Lang.add
    // ============================================================
    Lampa.Lang.add({
        source_order_title: {
            ru: 'Редактировать источники',
            uk: 'Редагувати джерела',
            en: 'Edit Sources'
        },
        source_order_reset: {
            ru: 'Сбросить по умолчанию',
            uk: 'Скинути за замовчуванням',
            en: 'Reset to Default'
        },
        source_order_reset_noty: {
            ru: 'Порядок источников сброшен',
            uk: 'Порядок джерел скинуто',
            en: 'Source order reset'
        },
        source_order_input_title: {
            ru: 'Название источника',
            uk: 'Назва джерела',
            en: 'Source Name'
        },
        source_order_icon_title: {
            ru: 'Иконка источника',
            uk: 'Іконка джерела',
            en: 'Source Icon'
        },
        source_order_icon_empty: {
            ru: 'Без иконки',
            uk: 'Без іконки',
            en: 'No icon'
        },
        source_order_icon_custom: {
            ru: 'Своя иконка / текст',
            uk: 'Своя іконка / текст',
            en: 'Custom icon / text'
        },
        source_order_icon_input: {
            ru: 'Иконка или короткий текст',
            uk: 'Іконка або короткий текст',
            en: 'Icon or short text'
        },
        source_order_filter_button: {
            ru: 'Сортировать',
            uk: 'Сортувати',
            en: 'Sort'
        },
        source_order_action_name: {
            ru: 'Название',
            uk: 'Назва',
            en: 'Name'
        },
        source_order_action_icon: {
            ru: 'Иконка',
            uk: 'Іконка',
            en: 'Icon'
        },
        source_order_action_up: {
            ru: 'Выше',
            uk: 'Вище',
            en: 'Up'
        },
        source_order_action_down: {
            ru: 'Ниже',
            uk: 'Нижче',
            en: 'Down'
        },
        source_order_action_reset: {
            ru: 'Сбросить',
            uk: 'Скинути',
            en: 'Reset'
        },
        source_order_group_viewer: {
            ru: 'Зритель',
            uk: 'Глядач',
            en: 'Viewer'
        },
        source_order_group_premium: {
            ru: 'Премиум',
            uk: 'Преміум',
            en: 'Premium'
        },
        source_order_group_mezenat: {
            ru: 'Меценат',
            uk: 'Меценат',
            en: 'Patron'
        }
    });

    // ============================================================
    // ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ПЕРЕВОДОВ
    // ============================================================
    function t(key) {
        return Lampa.Lang.translate(key);
    }

    // ============================================================
    // ГРУППЫ С ЛОКАЛИЗАЦИЕЙ
    // ============================================================
    var GROUP_NAMES = {
        0: t('source_order_group_viewer'),
        1: t('source_order_group_premium'),
        2: t('source_order_group_premium'),
        3: t('source_order_group_premium')
    };

    function refreshGroupNames() {
        GROUP_NAMES[0] = t('source_order_group_viewer');
        GROUP_NAMES[1] = t('source_order_group_premium');
        GROUP_NAMES[2] = t('source_order_group_premium');
        GROUP_NAMES[3] = t('source_order_group_premium');
    }

    // ============================================================
    // ОСНОВНАЯ ЛОГИКА
    // ============================================================

    var DEFAULTS = {
        makhno: { title: 'Makhno ~ 1080', icon: UA_FLAG, order: 1 },
        lme_makhno: { title: 'Makhno ~ 1080', icon: UA_FLAG, order: 1 },
		petlura: { title: 'Petlura ~ 1080', icon: UA_FLAG, order: 2 },
		lme_petlura: { title: 'Petlura ~ 1080', icon: UA_FLAG, order: 2 },
        uaflix: { title: 'Uaflix ~ 1080', icon: UA_FLAG, order: 3 },
        lme_uaflix: { title: 'Uaflix ~ 1080', icon: UA_FLAG, order: 3 },
        klonfun: { title: 'KlonFUN ~ 1080', icon: UA_FLAG, order: 4 },
        lme_klonfun: { title: 'KlonFUN ~ 1080', icon: UA_FLAG, order: 4 },
        uakino: { title: 'UaKino ~ 1080', icon: UA_FLAG, order: 5 },
        lme_uakino: { title: 'UaKino ~ 1080', icon: UA_FLAG, order: 5 },
        uafilmme: { title: 'UafilmME ~ 1080', icon: UA_FLAG, order: 6 },
        lme_uafilmme: { title: 'UafilmME ~ 1080', icon: UA_FLAG, order: 6 },
        uafilm: { title: 'UAFilm ~ 1080', icon: UA_FLAG, order: 7 },
        lme_uafilm: { title: 'UAFilm ~ 1080', icon: UA_FLAG, order: 7 },
        kinoukr: { title: 'KinoUkr ~ 1080', icon: UA_FLAG, order: 8 },
        lme_kinoukr: { title: 'KinoUkr ~ 1080', icon: UA_FLAG, order: 8 },
        ashdi: { title: 'Ashdi ~ 1080', icon: UA_FLAG, order: 9 },
        lme_ashdi: { title: 'Ashdi ~ 1080', icon: UA_FLAG, order: 9 },
        eneyida: { title: 'Eneyida ~ 1080', icon: UA_FLAG, order: 10 },
        lme_eneyida: { title: 'Eneyida ~ 1080', icon: UA_FLAG, order: 10 },
        mirage: { title: 'Mirage ~ 4K', icon: '👑', order: 11 },
        lme_mirage: { title: 'Mirage ~ 4K', icon: '👑', order: 11 },
        spectre: { title: 'Spectre ~ 4K', icon: '👑', order: 12 },
        lme_spectre: { title: 'Spectre ~ 4K', icon: '👑', order: 12 },
        phantom: { title: 'Phantom ~ 4K', icon: '👑', order: 13 },
        lme_phantom: { title: 'Phantom ~ 4K', icon: '👑', order: 13 },
        jacktor: { title: 'JackTor ~ 4K', icon: '👑', order: 14 },
        lme_jacktor: { title: 'JackTor ~ 4K', icon: '👑', order: 14 },
        pidtor: { title: 'PidTor ~ 4K', icon: '👑', order: 15 },
        lme_pidtor: { title: 'PidTor ~ 4K', icon: '👑', order: 15 },
        bamboo: { title: 'Bamboo', icon: '🌸', order: 16 },
        lme_bamboo: { title: 'Bamboo', icon: '🌸', order: 16 },
        animeon: { title: 'AnimeON', icon: '🌸', order: 17 },
        lme_animeon: { title: 'AnimeON', icon: '🌸', order: 17 },
        mikai: { title: 'Mikai', icon: '🌸', order: 18 },
        lme_mikai: { title: 'Mikai', icon: '🌸', order: 18 },
        unimay: { title: 'Unimay', icon: '🌸', order: 19 },
        lme_unimay: { title: 'Unimay', icon: '🌸', order: 19 },
        moonanime: { title: 'MoonAnime', icon: '🌸', order: 20 },
        lme_moonanime: { title: 'MoonAnime', icon: '🌸', order: 20 },
        nmoonanime: { title: 'New MoonAnime', icon: '🌸', order: 21 },
        lme_nmoonanime: { title: 'New MoonAnime', icon: '🌸', order: 21 },
        aniliberty: { title: 'AniLiberty', icon: '🌸', order: 22 },
        lme_aniliberty: { title: 'AniLiberty', icon: '🌸', order: 22 },
        filmix: { title: 'Filmix [ Prem ]', icon: '🍿', order: 23 },
        lme_filmix: { title: 'Filmix [ Prem ]', icon: '🍿', order: 23 },
        rezka: { title: 'Rezka ~ 4K', icon: '🍿', order: 24 },
        pizatoadhd: { title: 'Rezka ~ 4K', icon: '🍿', order: 24 },
        zetflix: { title: 'Zetflix', icon: '🍿', order: 25 },
        lme_zetflix: { title: 'Zetflix', icon: '🍿', order: 25 },
        starlight: { title: 'StarLight', icon: '⭐', order: 26 },
        lme_starlight: { title: 'StarLight', icon: '⭐', order: 26 },
        streamdata: { title: 'StreamData', icon: '⭐', order: 27 },
        lme_streamdata: { title: 'StreamData', icon: '⭐', order: 27 },		
		xullys: { title: 'EN Xullys ~ 4k', icon: EN_FLAG, order: 28 },
        lmg_xullys: { title: 'EN Xullys ~ 4k', icon: EN_FLAG, order: 28 },
		
        sisi: { title: 'Sisi', icon: '🍓', order: 29 }
    };

    var ICONS = [
        '', '👑', '💎', '🍿', '⭐', '🌸', '⚡', '🔥',
        '🎬', '▶', '📺', '📁', '🔎', '🎞', '🧩', '🟢', '🟡', '🔴'
    ];

    var lastTitles = {};
    var filterPatched = false;
    var editorReturnController = 'settings_component';

    refreshGroupNames();

    var SOURCE_GROUPS = {
		jacktor: 3,
        lme_jacktor: 3,
        mirage: 3,
        lme_mirage: 3,
        uakino: 3,
        ashdi: 3,
        lme_ashdi: 3,
        kinoukr: 3,
        lme_kinoukr: 3,
        eneyida: 3,
        lme_eneyida: 3,
        uafilm: 3,
        lme_uafilm: 3,
        pidtor: 3,
        lme_pidtor: 3,
        spectre: 3,
        lme_spectre: 3,
        phantom: 3,
        lme_phantom: 3,
        zetflix: 3,
        lme_zetflix: 3,
        makhno: 3,
        lme_makhno: 3,
		lme_uakino: 3,
		rezka: 3,
        pizatoadhd: 3,
		xullys: 3,
		lmg_xullys: 3,
		sisi: 3,
		petlura: 0,
        lme_petlura: 0,
        uaflix: 0,
        lme_uaflix: 0,
        klonfun: 0,
        lme_klonfun: 0,
        lme_uafilmme: 0,
        lme_streamdata: 0,
        lme_starlight: 0,
        starlight: 0,
        streamdata: 0,
        filmix: 0,
        lme_filmix: 0,
        bamboo: 0,
        lme_bamboo: 0,
        animeon: 0,
        lme_animeon: 0,
        mikai: 0,
        lme_mikai: 0,
        unimay: 0,
        lme_unimay: 0,
        moonanime: 0,
        lme_moonanime: 0,
        nmoonanime: 0,
        lme_nmoonanime: 0,
        aniliberty: 0,
        lme_aniliberty: 0
    };

    // ============================================================
    // ОСНОВНЫЕ ФУНКЦИИ
    // ============================================================

    function storage() {
        var value = Lampa.Storage.get(STORAGE_KEY, null);
        if (!value || typeof value !== 'object') {
            value = { order: [], items: {}, known: {} };
        }
        value.order = Array.isArray(value.order) ? value.order : [];
        value.items = value.items && typeof value.items === 'object' ? value.items : {};
        value.known = value.known && typeof value.known === 'object' ? value.known : {};
        return value;
    }

    function saveStorage(value) {
        Lampa.Storage.set(STORAGE_KEY, value);
    }

    function html(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function stripLock(title) {
        return String(title || '').replace(/\s*🔒.*$/g, '').trim();
    }

    function lockSuffix(title) {
        var match = String(title || '').match(/\s*🔒.*$/);
        return match ? match[0] : '';
    }

    function groupName(value) {
        return GROUP_NAMES[value] || GROUP_NAMES[0];
    }

    function groupFromTitle(title) {
        var suffix = lockSuffix(title);
        if (!suffix) return null;

        if (suffix.indexOf('Patron') >= 0) return t('source_order_group_mezenat');
        if (suffix.indexOf('Premium') >= 0) return t('source_order_group_premium');
        if (suffix.indexOf('Viewer') >= 0) return t('source_order_group_viewer');

        return null;
    }

    function sourceGroupTitle(key, originalTitle) {
        return groupFromTitle(originalTitle) || groupName(SOURCE_GROUPS[key] == null ? 0 : SOURCE_GROUPS[key]);
    }

    function defaultTitle(key, fallback) {
        if (DEFAULTS[key]) return DEFAULTS[key].title;
        return stripLock(fallback || key);
    }

    function defaultIcon(key) {
        return DEFAULTS[key] ? DEFAULTS[key].icon : FALLBACK_ICON;
    }

    function defaultOrder(key) {
        return DEFAULTS[key] ? DEFAULTS[key].order : 10000;
    }

    function sortByDefaultOrder(keys) {
        return keys.slice().sort(function (a, b) {
            var ao = defaultOrder(a);
            var bo = defaultOrder(b);
            if (ao !== bo) return ao - bo;

            var at = defaultTitle(a, a).toLowerCase();
            var bt = defaultTitle(b, b).toLowerCase();
            if (at !== bt) return at.localeCompare(bt);

            return a.localeCompare(b);
        });
    }

    function ensureOrder(config, keys) {
        var seen = {};
        var next = [];

        config.order.forEach(function (key) {
            if (keys.indexOf(key) !== -1 && !seen[key]) {
                next.push(key);
                seen[key] = true;
            }
        });

        keys.slice().sort(function (a, b) {
            var ao = defaultOrder(a);
            var bo = defaultOrder(b);
            if (ao !== bo) return ao - bo;
            return a.localeCompare(b);
        }).forEach(function (key) {
            if (!seen[key]) {
                next.push(key);
                seen[key] = true;
            }
        });

        config.order = next;
    }

    function mergeOrder(config, keys) {
        var map = {};

        (config.order || []).forEach(function (key) { map[key] = true; });
        (keys || []).forEach(function (key) { if (key) map[key] = true; });

        ensureOrder(config, Object.keys(map));
    }

    function registerSources(items) {
        var config = storage();
        var keys = [];
        var changed = false;

        items.forEach(function (item) {
            var key = item && item.source;
            if (!key) return;

            keys.push(key);
            lastTitles[stripLock(item.title)] = key;
            lastTitles[item.title] = key;

            if (!config.known[key]) {
                config.known[key] = stripLock(item.title || key);
                changed = true;
            }
        });

        if (keys.length) {
            mergeOrder(config, keys);
            changed = true;
        }

        if (changed) saveStorage(config);
    }

    function sourceKeys(config) {
        var map = {};
        Object.keys(config.known || {}).forEach(function (key) { map[key] = true; });

        if (!Object.keys(map).length) {
            Object.keys(DEFAULTS).forEach(function (key) {
                if (key.indexOf('lme_') !== 0 && key !== 'pizatoadhd') map[key] = true;
            });
        }

        ensureOrder(config, Object.keys(map));
        return config.order.slice();
    }

    function defaultProfileConfig() {
        var current = storage();
        var known = current.known || {};
        var keys = Object.keys(known);

        if (!keys.length) {
            keys = Object.keys(DEFAULTS).filter(function (key) {
                return key.indexOf('lme_') !== 0 && key !== 'pizatoadhd';
            });
        }

        var next = {
            order: sortByDefaultOrder(keys),
            items: {},
            known: known
        };
        return next;
    }

    function customTitle(key, original) {
        var config = storage();
        var item = config.items[key] || {};
        var title = item.title || defaultTitle(key, config.known[key] || original);
        var icon = typeof item.icon === 'string' ? item.icon : defaultIcon(key);
        var suffix = lockSuffix(original);

        lastTitles[title] = key;
        lastTitles[(icon ? icon + ' ' : '') + title] = key;

        return (icon ? icon + ' ' : '') + title + suffix;
    }

    function applyToSortItems(items) {
        if (!items || !items.some(function (item) { return item && item.source; })) return items;

        registerSources(items);

        var config = storage();
        var position = {};
        mergeOrder(config, items.map(function (item) { return item.source; }).filter(Boolean));
        config.order.forEach(function (key, index) { position[key] = index; });

        items.forEach(function (item) {
            if (!item || !item.source) return;
            var originalTitle = item.title;
            item.subtitle = sourceGroupTitle(item.source, originalTitle);
            item.title = customTitle(item.source, item.title);
            item._lampaua_source_order = position[item.source] == null ? 99999 : position[item.source];
        });

        items.sort(function (a, b) {
            var ag = a && a.ghost ? 1 : 0;
            var bg = b && b.ghost ? 1 : 0;
            if (ag !== bg) return ag - bg;

            var ao = a && a._lampaua_source_order != null ? a._lampaua_source_order : 99999;
            var bo = b && b._lampaua_source_order != null ? b._lampaua_source_order : 99999;
            if (ao !== bo) return ao - bo;

            return String(a.title || '').localeCompare(String(b.title || ''));
        });

        saveStorage(config);
        return items;
    }

    function chosenTitle(title) {
        var key = lastTitles[title] || lastTitles[stripLock(title)];
        if (!key) {
            var normalized = stripLock(title).toLowerCase();
            Object.keys(DEFAULTS).some(function (candidate) {
                var data = DEFAULTS[candidate];
                if (normalized.indexOf(candidate) !== -1 || normalized.indexOf(data.title.toLowerCase()) !== -1) {
                    key = candidate;
                    return true;
                }
                return false;
            });
        }
        return key ? customTitle(key, title) : title;
    }

    function patchFilter() {
        if (filterPatched) return;
        if (!window.Lampa || !Lampa.Filter) {
            setTimeout(patchFilter, 300);
            return;
        }
        filterPatched = true;

        var OriginalFilter = Lampa.Filter;

        Lampa.Filter = function (object) {
            var filter = new OriginalFilter(object);
            var originalSet = filter.set;
            var originalChosen = filter.chosen;

            filter.set = function (type, items) {
                if (type === 'sort' && Array.isArray(items)) {
                    items = applyToSortItems(items);
                    return originalSet.call(this, type, items);
                }
                return originalSet.apply(this, arguments);
            };

            filter.chosen = function (type, selected) {
                if (type === 'sort' && Array.isArray(selected)) {
                    selected = selected.map(chosenTitle);
                    return originalChosen.call(this, type, selected);
                }
                return originalChosen.apply(this, arguments);
            };

            return filter;
        };

        Object.keys(OriginalFilter).forEach(function (key) {
            Lampa.Filter[key] = OriginalFilter[key];
        });
        Lampa.Filter.prototype = OriginalFilter.prototype;
    }

    // ============================================================
    // ФУНКЦИИ РЕДАКТОРА С ЛОКАЛИЗАЦИЕЙ
    // ============================================================

    function saveOrderFromDom(list) {
        var config = storage();
        config.order = [];
        list.find('.source-order-item').each(function () {
            config.order.push($(this).attr('data-key'));
        });
        saveStorage(config);
    }

    function updateRow(row, key) {
        var config = storage();
        var item = config.items[key] || {};
        var title = item.title || defaultTitle(key, config.known[key]);
        var icon = typeof item.icon === 'string' ? item.icon : defaultIcon(key);

        row.find('.source-order-icon')
            .text(icon || ' ')
            .toggleClass('source-order-icon--text', icon && icon.length > 2);
        row.find('.source-order-name').text(title);
        row.find('.source-order-key').text(sourceGroupTitle(key, config.known[key]));
    }

    function reopenEditorSoon() {
        setTimeout(function () {
            openEditor({ returnController: editorReturnController });
        }, 120);
    }

    function closeEditorForOverlay(row) {
        if (row && row.length) saveOrderFromDom(row.parent());
        Lampa.Modal.close();
    }

    function editName(key, row) {
        var config = storage();
        var item = config.items[key] || {};
        var value = item.title || defaultTitle(key, config.known[key]);

        closeEditorForOverlay(row);

        setTimeout(function () {
            Lampa.Input.edit({
                title: t('source_order_input_title'),
                value: value,
                free: true
            }, function (next) {
                if (next !== undefined) {
                    next = String(next || '').trim();

                    config = storage();
                    config.items[key] = config.items[key] || {};
                    if (next && next !== defaultTitle(key, config.known[key])) config.items[key].title = next;
                    else delete config.items[key].title;
                    saveStorage(config);
                }

                reopenEditorSoon();
            });
        }, 120);
    }

    function editIcon(key, row) {
        var config = storage();
        var current = config.items[key] && typeof config.items[key].icon === 'string' ? config.items[key].icon : defaultIcon(key);
        var items = ICONS.map(function (icon) {
            return {
                title: icon || t('source_order_icon_empty'),
                icon: icon,
                selected: icon === current
            };
        });

        items.push({ title: t('source_order_icon_custom'), custom: true });

        closeEditorForOverlay(row);

        setTimeout(function () {
            Lampa.Select.show({
                title: t('source_order_icon_title'),
                items: items,
                onBack: function () {
                    reopenEditorSoon();
                },
                onSelect: function (item) {
                    if (item.custom) {
                        setTimeout(function () {
                            Lampa.Input.edit({
                                title: t('source_order_icon_input'),
                                value: current || '',
                                free: true
                            }, function (value) {
                                if (value !== undefined) {
                                    setIcon(key, String(value || '').trim());
                                }
                                reopenEditorSoon();
                            });
                        }, 120);
                        return;
                    }

                    setIcon(key, item.icon);
                    reopenEditorSoon();
                }
            });
        }, 120);
    }

    function setIcon(key, icon, row) {
        var config = storage();
        config.items[key] = config.items[key] || {};
        if (icon !== defaultIcon(key)) config.items[key].icon = icon;
        else delete config.items[key].icon;
        saveStorage(config);
        if (row && row.length) updateRow(row, key);
    }

    function resetSource(key, row) {
        var config = storage();
        delete config.items[key];
        saveStorage(config);
        updateRow(row, key);
    }

    function buildRow(key) {
        var row = $(
            '<div class="menu-edit-list__item source-order-item" data-key="' + html(key) + '">' +
                '<div class="source-order-main selector">' +
                    '<div class="menu-edit-list__icon source-order-icon"></div>' +
                    '<div class="source-order-text">' +
                        '<div class="menu-edit-list__title source-order-name"></div>' +
                        '<div class="source-order-key"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="source-order-actions">' +
                    '<div class="menu-edit-list__move source-order-action selector" data-action="name" title="' + t('source_order_action_name') + '">✏️</div>' +
                    '<div class="menu-edit-list__move source-order-action selector" data-action="icon" title="' + t('source_order_action_icon') + '">🖼️</div>' +
                    '<div class="menu-edit-list__move source-order-action selector" data-action="up" title="' + t('source_order_action_up') + '">🔼</div>' +
                    '<div class="menu-edit-list__move source-order-action selector" data-action="down" title="' + t('source_order_action_down') + '">🔽</div>' +
                    '<div class="menu-edit-list__move source-order-action selector" data-action="reset" title="' + t('source_order_action_reset') + '">🔄</div>' +
                '</div>' +
            '</div>'
        );

        updateRow(row, key);

        row.find('.source-order-main').on('hover:enter', function () {
            editName(key, row);
        });

        row.find('.source-order-action').on('hover:enter', function () {
            var action = $(this).attr('data-action');
            var list = row.parent();

            if (action === 'name') editName(key, row);
            if (action === 'icon') editIcon(key, row);
            if (action === 'reset') resetSource(key, row);
            if (action === 'up') {
                var prev = row.prev('.source-order-item');
                if (prev.length) {
                    row.insertBefore(prev);
                    saveOrderFromDom(list);
                }
            }
            if (action === 'down') {
                var next = row.next('.source-order-item');
                if (next.length) {
                    row.insertAfter(next);
                    saveOrderFromDom(list);
                }
            }
        });

        return row;
    }

    function closeEditor(list) {
        if (list && list.length) saveOrderFromDom(list);
        Lampa.Modal.close();
        if (editorReturnController && Lampa.Controller) {
            Lampa.Controller.toggle(editorReturnController);
        }
    }

    function openEditor(options) {
        options = options || {};
        editorReturnController = options.returnController || editorReturnController || 'settings_component';

        var config = storage();
        var keys = sourceKeys(config);
        saveStorage(config);

        var wrap = $('<div class="source-order-wrap"></div>');
        var list = $('<div class="menu-edit-list source-order-list"></div>');

        keys.forEach(function (key) {
            list.append(buildRow(key));
        });

        var reset = $('<div class="source-order-reset selector">' + t('source_order_reset') + '</div>');

        reset.on('hover:enter', function () {
            Lampa.Storage.set(STORAGE_KEY, defaultProfileConfig());
            Lampa.Noty.show(t('source_order_reset_noty'));
            Lampa.Modal.close();
            openEditor({ returnController: editorReturnController });
        });

        wrap.append(list);
        wrap.append(reset);

        Lampa.Modal.open({
            title: t('source_order_title'),
            html: wrap,
            size: 'small',
            scroll_to_center: true,
            onBack: function () {
                closeEditor(list);
            }
        });
    }

    function openFromContent() {
        openEditor({ returnController: 'content' });
    }

    function addFilterButton(root) {
        var scope = root ? $(root) : $(document);
        var filters = scope.is && scope.is('.torrent-filter')
            ? scope
            : scope.find('.torrent-filter');

        filters.each(function () {
            var filter = $(this);
            if (filter.find('.source-order-filter-button').length) return;

            var sort = filter.find('.filter--sort').first();
            var filterButton = filter.find('.filter--filter').first();
            if (!sort.length || !filterButton.length) return;

            var button = $('<div class="simple-button simple-button--filter selector source-order-filter-button"><span>' + t('source_order_filter_button') + '</span></div>');
            button.on('hover:enter', openFromContent);
            button.insertAfter(sort);
        });
    }

    function observeUi() {
        addFilterButton(document);

        var attempts = 0;
        var retry = setInterval(function () {
            attempts++;
            addFilterButton(document);
            if (attempts > 40) clearInterval(retry);
        }, 500);

        if (window.lampaua_source_order_observer || typeof MutationObserver === 'undefined') return;
        window.lampaua_source_order_observer = true;

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    var node = mutation.addedNodes[i];
                    if (!node || node.nodeType !== 1) continue;
                    addFilterButton(node);
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function addStyle() {
        if (document.getElementById('lampaua-source-order-style')) return;

        var style = document.createElement('style');
        style.id = 'lampaua-source-order-style';
        style.innerHTML = [
            '.source-order-wrap{width:100%;max-width:31em;margin:0 auto;box-sizing:border-box;}',
            '.source-order-list{padding-right:0;margin-right:0;}',
            '.source-order-item{display:flex;align-items:center;padding:.34em .45em;border-radius:.3em;}',
            '.source-order-item:nth-child(even){background:rgba(255,255,255,.1);}',
            '.source-order-main{display:flex;align-items:center;min-width:0;flex:1;border-radius:.3em;}',
            '.source-order-main.focus{background:rgba(255,255,255,.12);}',
            '.source-order-icon{font-size:1.15em;text-align:center;white-space:nowrap;overflow:hidden;}',
            '.source-order-icon--text{font-size:.72em!important;letter-spacing:0;}',
            '.source-order-icon:not(:empty){background:rgba(255,255,255,.08);}',
            '.source-order-icon:empty:before{content:"";}',
            '.source-order-icon{font-weight:700;}',
            '.source-order-icon{font-size:clamp(.72em,1.15em,1.15em);}',
            '.source-order-text{min-width:0;flex:1;}',
            '.source-order-name{font-size:1.18em;font-weight:300;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
            '.source-order-key{font-size:.68em;line-height:1.15;opacity:.42;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
            '.source-order-actions{display:flex;align-items:center;gap:.05em;margin-left:.45em;flex-shrink:0;}',
            '.source-order-action{background:transparent;font-size:1.02em;}',
            '.source-order-action svg{width:1em!important;height:1em!important;}',
            '.source-order-action.focus{background:#fff!important;color:#000!important;border-radius:.3em;}',
            '.source-order-reset{text-align:center;margin-top:.75em;border-radius:.3em;padding:.82em 1em;font-weight:700;}',
            '.source-order-reset{background:rgba(160,70,70,.45);}',
            '.source-order-reset.focus{outline:.16em solid rgba(255,255,255,.85);outline-offset:.08em;}',
            '.source-order-filter-button{margin-left:.7em;}',
            '@media(max-width:600px){.source-order-wrap{max-width:100%;}.source-order-name{font-size:1.05em;}.source-order-actions{margin-left:.25em;}.source-order-action{width:2em;height:2em;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function init() {
        if (!window.Lampa || !window.$) {
            setTimeout(init, 300);
            return;
        }

        addStyle();
        patchFilter();
        observeUi();

        window.LampaUaSourceOrder = {
            open: openEditor,
            config: storage,
            reset: function () {
                Lampa.Storage.set(STORAGE_KEY, defaultProfileConfig());
            }
        };
    }

    init();
})();
