(function() {
    'use strict';

    const STYLE_TAG = 'cardbtn-style';
    const ORDER_STORAGE = 'cardbtn_order';
    const HIDE_STORAGE = 'cardbtn_hidden';
    const RENAME_STORAGE = 'cardbtn_renamed';
    let currentCard = null;
    let currentActivity = null;
    let renameModalActive = false;

    const DEFAULT_LABELS = {
        'button--play': () => Lampa.Lang.translate('title_watch'),
        'button--book': () => Lampa.Lang.translate('settings_input_links'),
        'button--reaction': () => Lampa.Lang.translate('title_reactions'),
        'button--subscribe': () => Lampa.Lang.translate('title_subscribe'),
        'button--options': () => Lampa.Lang.translate('more'),
        'view--torrent': () => Lampa.Lang.translate('full_torrents'),
        'view--trailer': () => Lampa.Lang.translate('full_trailers')
    };

    function addStyles() {
        if (document.getElementById(STYLE_TAG)) return;
        const css = `
            .card-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            .card-button-hidden {
                display: none !important;
            }
            .card-icons-only span {
                display: none;
            }
            .card-always-text span {
                display: block !important;
            }
            .head__action.edit-card svg {
                width: 26px;
                height: 26px;
            }
            .menu-edit-list__rename {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 26px;
                height: 26px;
                margin-right: 10px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            .menu-edit-list__rename:hover {
                opacity: 1;
            }
            .menu-edit-list__rename svg {
                width: 18px;
                height: 18px;
            }
        `;
        $('head').append(`<style id="${STYLE_TAG}">${css}</style>`);
    }

    function getStoredArray(key) {
        const data = Lampa.Storage.get(key);
        if (Array.isArray(data)) return data.slice();
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return data.split(',').map(v => v.trim()).filter(Boolean);
            }
        }
        return [];
    }

    function getRenamedButtons() {
        const data = Lampa.Storage.get(RENAME_STORAGE);
        return data && typeof data === 'object' ? data : {};
    }

    function getCardContainer(e) {
        if (e && e.body) return e.body;
        if (e && e.link && e.link.html) return e.link.html;
        if (e && e.object && e.object.activity && typeof e.object.activity.render === 'function') return e.object.activity.render();
        return null;
    }

    function findActiveCard() {
        const active = $('.full-start-new').first();
        return active.length ? active : null;
    }

    function extractButtonKey($element) {
        const classes = ($element.attr('class') || '').split(/\s+/);
        const keyClass = classes.find(c => c.startsWith('button--') && c !== 'button--priority') ||
                       classes.find(c => c.startsWith('view--'));
        if (keyClass) return keyClass;
        const dataKey = $element.data('id') || $element.data('name') || $element.attr('data-name');
        if (dataKey) return `data:${dataKey}`;
        const textKey = $element.text().trim();
        if (textKey) return `text:${textKey}`;
        return `hash:${Lampa.Utils.hash($element.clone().removeClass('focus').prop('outerHTML'))}`;
    }

    function extractButtonLabel(key, $element) {
        const renamed = getRenamedButtons();
        if (renamed[key]) return renamed[key];
        
        // Берем текст из span или из всей кнопки
        const spanText = $element.find('span').first().text().trim();
        if (spanText) return spanText;
        
        const fullText = $element.text().trim();
        if (fullText) return fullText;
        
        if (DEFAULT_LABELS[key]) return DEFAULT_LABELS[key]();
        return key;
    }

    function collectButtons(container, remove) {
        const mainArea = container.find('.full-start-new__buttons');
        const extraArea = container.find('.buttons--container');
        const keys = [];
        const elements = {};
        
        function process($items) {
            $items.each(function() {
                const $item = $(this);
                if ($item.hasClass('button--play') || $item.hasClass('button--priority')) return;
                const key = extractButtonKey($item);
                if (!key || elements[key]) return;
                elements[key] = remove ? $item.detach() : $item;
                keys.push(key);
            });
        }
        
        process(mainArea.find('.full-start__button'));
        process(extraArea.find('.full-start__button'));
        
        return {
            keys,
            elements,
            mainArea,
            extraArea
        };
    }

    function buildOrder(saved, available) {
        const result = [];
        const known = new Set(available);
        saved.forEach(k => {
            if (known.has(k)) result.push(k);
        });
        available.forEach(k => {
            if (!result.includes(k)) result.push(k);
        });
        return result;
    }

    function hideButtons(elements) {
        const hidden = new Set(getStoredArray(HIDE_STORAGE));
        Object.keys(elements).forEach(k => {
            elements[k].toggleClass('card-button-hidden', hidden.has(k));
        });
    }

    function rebuildCard(container) {
        if (Lampa.Storage.get('cardbtn_showall') !== true) return;

        if (!container || !container.length) return;

        addStyles();

        const header = container.find('.head__actions');
        if (header.length) {
            let pencil = header.find('.edit-card');
            if (pencil.length === 0) {
                pencil = $(`
                    <div class="head__action selector edit-card">
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                `);

                header.find('.open--settings').after(pencil);

                pencil.on('hover:enter', () => {
                    startEditor(container, false);
                });
            }
        }

        const priorityBtn = container.find('.full-start-new__buttons .button--priority').detach();
        container.find('.full-start-new__buttons .button--play').remove();

        const collected = collectButtons(container, true);
        const { keys, elements, mainArea } = collected;

        const saved = getStoredArray(ORDER_STORAGE);
        let ordered = buildOrder(saved, keys);

        if (saved.length === 0) {
            ordered.sort((a, b) => {
                const aOnline = a.startsWith('button--');
                const bOnline = b.startsWith('button--');
                if (aOnline && !bOnline) return -1;
                if (!aOnline && bOnline) return 1;
                return 0;
            });
        }

        mainArea.empty();
        if (priorityBtn.length) mainArea.append(priorityBtn);
        
        // Получаем переименованные кнопки
        const renamedButtons = getRenamedButtons();
        
        ordered.forEach(k => {
            if (elements[k]) {
                const $btn = elements[k];
                // Применяем переименованное название если есть
                if (renamedButtons[k]) {
                    const span = $btn.find('span').first();
                    if (span.length) {
                        span.text(renamedButtons[k]);
                    } else {
                        // Если нет span, создаем его
                        const icon = $btn.find('svg').first();
                        if (icon.length) {
                            icon.after(`<span>${renamedButtons[k]}</span>`);
                        } else {
                            $btn.append(`<span>${renamedButtons[k]}</span>`);
                        }
                    }
                }
                mainArea.append($btn);
            }
        });

        const mode = Lampa.Storage.get('cardbtn_viewmode', 'default');
        mainArea.removeClass('card-icons-only card-always-text');
        if (mode === 'icons') mainArea.addClass('card-icons-only');
        if (mode === 'always') mainArea.addClass('card-always-text');

        mainArea.addClass('card-buttons');
        hideButtons(elements);

        Lampa.Controller.toggle("full_start");

        if (currentActivity && currentActivity.html && container[0] === currentActivity.html[0]) {
            const first = mainArea.find('.full-start__button.selector').not('.hide').not('.card-button-hidden').first();
            if (first.length) currentActivity.last = first[0];
        }
    }

    // Упрощенная функция переименования
    function openRenameModal(key, currentLabel, callback) {
        renameModalActive = true;
        
        const cleanLabel = currentLabel.replace(/<[^>]*>/g, '');
        
        // Используем стандартный Input.edit от Lampa
        Lampa.Input.edit({
            free: true,
            title: 'Переименовать кнопку',
            nosave: false,
            value: cleanLabel,
            nomic: true,
            maxlength: 50,
            placeholder: 'Введите новое название'
        }, function(newName) {
            renameModalActive = false;
            if (newName && newName.trim() !== cleanLabel) {
                const trimmedName = newName.trim();
                callback(trimmedName);
                
                // Сохраняем в хранилище
                const renamedButtons = getRenamedButtons();
                renamedButtons[key] = trimmedName;
                Lampa.Storage.set(RENAME_STORAGE, renamedButtons);
                
                // Немедленно обновляем текущую карточку
                if (currentCard && currentCard.length) {
                    rebuildCard(currentCard);
                }
            }
        }, function() {
            renameModalActive = false;
        });
    }

    function startEditor(container, fromSettings = false) {
        if (!container || !container.length) return;

        const collected = collectButtons(container, false);
        const { keys, elements } = collected;

        const ordered = buildOrder(getStoredArray(ORDER_STORAGE), keys);
        const hidden = new Set(getStoredArray(HIDE_STORAGE));
        const renamed = getRenamedButtons();

        const editorList = $('<div class="menu-edit-list"></div>');

        ordered.forEach(k => {
            const $elem = elements[k];
            if (!$elem || !$elem.length) return;

            // Используем переименованное название если есть, иначе оригинальное
            const label = renamed[k] || extractButtonLabel(k, $elem);
            const svg = $elem.find('svg').first().prop('outerHTML') || '';

            const row = $(`
                <div class="menu-edit-list__item" data-id="${k}">
                    <div class="menu-edit-list__icon"></div>
                    <div class="menu-edit-list__title">${label}</div>
                    <div class="menu-edit-list__rename selector" title="Переименовать">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                    <div class="menu-edit-list__move move-up selector">
                        <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="menu-edit-list__move move-down selector">
                        <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="menu-edit-list__toggle toggle selector">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>
                            <path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="0" stroke-linecap="round"/>
                        </svg>
                    </div>
                </div>
            `);

            if (svg) row.find('.menu-edit-list__icon').append(svg);

            row.toggleClass('menu-edit-list__item-hidden', hidden.has(k));
            row.find('.dot').attr('opacity', hidden.has(k) ? 0 : 1);

            row.find('.menu-edit-list__rename').on('hover:enter', (e) => {
                e.stopPropagation();
                Lampa.Modal.close(); // Закрываем редактор перед открытием переименования
                setTimeout(() => {
                    openRenameModal(k, label, (newName) => {
                        // Сохраняем новое название
                        const renamedButtons = getRenamedButtons();
                        renamedButtons[k] = newName;
                        Lampa.Storage.set(RENAME_STORAGE, renamedButtons);
                        
                        // Обновляем карточку
                        if (currentCard && currentCard.length) {
                            rebuildCard(currentCard);
                        }
                        
                        // Снова открываем редактор с обновленными названиями
                        setTimeout(() => {
                            startEditor(container, fromSettings);
                        }, 100);
                    });
                }, 100);
            });

            row.find('.move-up').on('hover:enter', () => {
                const prev = row.prev();
                if (prev.length) row.insertBefore(prev);
            });

            row.find('.move-down').on('hover:enter', () => {
                const next = row.next();
                if (next.length) row.insertAfter(next);
            });

            row.find('.toggle').on('hover:enter', () => {
                row.toggleClass('menu-edit-list__item-hidden');
                row.find('.dot').attr('opacity', row.hasClass('menu-edit-list__item-hidden') ? 0 : 1);
                
                // Немедленно сохраняем состояние скрытия
                const hiddenButtons = getStoredArray(HIDE_STORAGE);
                const index = hiddenButtons.indexOf(k);
                if (row.hasClass('menu-edit-list__item-hidden')) {
                    if (index === -1) hiddenButtons.push(k);
                } else {
                    if (index !== -1) hiddenButtons.splice(index, 1);
                }
                Lampa.Storage.set(HIDE_STORAGE, hiddenButtons);
                
                // Немедленно применяем к карточке
                if (currentCard && currentCard.length) {
                    const elements = collectButtons(currentCard, false).elements;
                    if (elements[k]) {
                        elements[k].toggleClass('card-button-hidden', row.hasClass('menu-edit-list__item-hidden'));
                    }
                }
            });

            editorList.append(row);
        });

        // Открываем модальное окно редактора
        Lampa.Modal.open({
            title: 'Редактировать кнопки',
            html: editorList,
            size: 'small',
            scroll_to_center: true,
            onBack: () => {
                // Сохраняем изменения порядка перед закрытием
                const newOrder = [];
                editorList.find('.menu-edit-list__item').each(function() {
                    const k = $(this).data('id');
                    if (k) newOrder.push(k);
                });
                Lampa.Storage.set(ORDER_STORAGE, newOrder);
                
                // Закрываем модальное окно
                Lampa.Modal.close();
                
                // Перестраиваем карточку
                if (container && container.length) {
                    rebuildCard(container);
                }
                
                // Возвращаемся в нужное место
                setTimeout(() => {
                    if (fromSettings) {
                        Lampa.Controller.toggle("settings_component");
                    } else {
                        Lampa.Controller.toggle("full_start");
                    }
                }, 100);
            }
        });
    }

    function startEditorFromSettings() {
        if (!currentCard || !currentCard.length || !document.body.contains(currentCard[0])) {
            const active = findActiveCard();
            if (active && active.length) {
                currentCard = active;
            }
        }

        if (!currentCard || !currentCard.length) {
            Lampa.Modal.open({
                title: Lampa.Lang.translate('title_error'),
                html: Lampa.Template.get('error', {
                    title: Lampa.Lang.translate('title_error'),
                    text: 'Редактировать кнопки можно только после открытия карточки фильма'
                }),
                size: 'small',
                onBack: () => {
                    Lampa.Modal.close();
                    setTimeout(() => {
                        Lampa.Controller.toggle("settings_component");
                    }, 100);
                }
            });
            return;
        }

        startEditor(currentCard, true);
    }

    function cardListener() {
        Lampa.Listener.follow('full', e => {
            if (e.type === 'build' && e.name === 'start' && e.item && e.item.html) {
                currentActivity = e.item;
            }
            if (e.type === 'complite') {
                const container = getCardContainer(e);
                if (!container) return;
                currentCard = container;
                rebuildCard(container);
            }
        });
    }

    const CardHandler = {
        run: cardListener,
        fromSettings: startEditorFromSettings
    };

    function setupSettings() {
        Lampa.SettingsApi.addComponent({
            component: "cardbtn",
            name: 'Кнопки в карточке',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: "cardbtn",
            param: {
                name: "cardbtn_showall",
                type: "trigger",
                default: false
            },
            field: {
                name: 'Все кнопки в карточке',
                description: 'Требуется перезагрузить приложение после включения'
            },
            onChange: () => {
                Lampa.Settings.update();
            }
        });

        if (Lampa.Storage.get('cardbtn_showall') === true) {
            Lampa.SettingsApi.addParam({
                component: "cardbtn",
                param: {
                    name: "cardbtn_viewmode",
                    type: "select",
                    values: {
                        default: 'Стандартный',
                        icons: 'Только иконки кнопок',
                        always: 'Текст в кнопках'
                    },
                    default: 'default'
                },
                field: {
                    name: 'Режим отображения кнопок'
                },
                onChange: () => {
                    Lampa.Settings.update();
                }
            });

            Lampa.SettingsApi.addParam({
                component: "cardbtn",
                param: {
                    name: "cardbtn_editor",
                    type: "button"
                },
                field: {
                    name: 'Редактировать кнопки',
                    description: 'Изменить порядок, скрыть или переименовать кнопки'
                },
                onChange: () => {
                    CardHandler.fromSettings();
                }
            });
        }
    }

    const SettingsConfig = {
        run: setupSettings
    };

    const pluginInfo = {
        type: "other",
        version: "1.1.5",
        author: '@custom',
        name: "Кастомные кнопки карточки",
        description: "Управление кнопками действий в карточке фильма/сериала",
        component: "cardbtn"
    };

    function loadPlugin() {
        Lampa.Manifest.plugins = pluginInfo;
        SettingsConfig.run();
        if (Lampa.Storage.get('cardbtn_showall') === true) {
            CardHandler.run();
        }
    }

    function init() {
        window.plugin_cardbtn_ready = true;
        if (window.appready) loadPlugin();
        else {
            Lampa.Listener.follow("app", e => {
                if (e.type === "ready") loadPlugin();
            });
        }
    }

    if (!window.plugin_cardbtn_ready) init();

})();
