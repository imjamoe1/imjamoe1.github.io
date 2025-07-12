// ==UserScript==
// @name         Lampa Settings Menu Sort
// @namespace    http://lampa.mx/
// @version      1.1
// @description  Сортировка и скрытие пунктов меню настроек (наподобие главного) для Lampa
// @author       imjamoe1 + copilot
// @match        http://lampa.mx/*
// @match        http://bylampa.online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Ждем появления Lampa
    function waitForLampa(cb) {
        if (!window.Lampa || !Lampa.Listener) {
            setTimeout(() => waitForLampa(cb), 200);
            return;
        }
        cb();
    }

    waitForLampa(init);

    function init() {
        // Ключи для localStorage
        const STORAGE_KEY = 'settings_menu_sort_v2';
        const HIDDEN_KEY = 'settings_menu_hidden_v2';
        const ACTIVE_CLASS = 'focus';
        const TRAVERSE_CLASS = 'traverse';
        const EDIT_MODE_CLASS = 'editable';
        const HIDDEN_CLASS = 'hidden';

        let editMode = false;
        let currentItem = null;
        let settingsContainer = null;

        // Добавляем стили
        addStyles();

        // При открытии настроек ищем контейнер пунктов
        Lampa.Settings.listener.follow('open', function(e) {
            let cont = e.body && (e.body.find('.scroll__body > div').length ? e.body.find('.scroll__body > div') : e.body.find('.settings__body'));
            if (!settingsContainer && cont && cont.length) {
                settingsContainer = cont;
                setTimeout(setupEditor, 300);
            }
        });

        // Контроллер для сортировки
        Lampa.Controller.add('settings_sort', {
            toggle: () => {
                if (currentItem) {
                    Lampa.Controller.collectionFocus(currentItem[0]);
                }
            },
            up: () => editMode ? moveItem(-1) : moveSelection(-1),
            down: () => editMode ? moveItem(1) : moveSelection(1),
            left: () => editMode && toggleVisibility(currentItem),
            right: () => editMode && toggleVisibility(currentItem),
            back: () => {
                if (editMode) toggleEditMode(false);
            },
            ok: () => {
                if (editMode) showItemActions();
            }
        });

        function setupEditor() {
            if (!settingsContainer) return;
            bindLongPress();
            loadSettings();
        }

        function bindLongPress() {
            settingsContainer.find('.settings-folder')
                .off('hover:long')
                .on('hover:long', function() {
                    if (!editMode) {
                        toggleEditMode(true);
                        currentItem = $(this);
                        highlightItem(currentItem);
                    }
                });
        }

        function toggleEditMode(enable) {
            editMode = enable;
            if (!settingsContainer) return;
            settingsContainer.toggleClass(EDIT_MODE_CLASS, editMode);

            if (editMode) {
                Lampa.Controller.toggle('settings_sort');
            } else {
                Lampa.Controller.toggle('settings');
                saveSettings();
                clearHighlight();
            }
        }

        function moveSelection(direction) {
            if (!settingsContainer) return;
            const items = getVisibleItems();
            if (!currentItem || items.length === 0) return;
            let idx = items.index(currentItem);
            let newIdx = (idx + direction + items.length) % items.length;
            highlightItem(items.eq(newIdx));
        }

        function moveItem(direction) {
            if (!settingsContainer || !currentItem) return;
            if (direction === -1) {
                let prev = currentItem.prev('.settings-folder');
                if (prev.length) {
                    currentItem.insertBefore(prev);
                    highlightItem(currentItem);
                    saveSettings();
                }
            } else if (direction === 1) {
                let next = currentItem.next('.settings-folder');
                if (next.length) {
                    currentItem.insertAfter(next);
                    highlightItem(currentItem);
                    saveSettings();
                }
            }
        }

        function highlightItem(item) {
            clearHighlight();
            currentItem = item;
            currentItem.addClass(ACTIVE_CLASS);
            if (editMode) currentItem.addClass(TRAVERSE_CLASS);

            // Автопрокрутка
            const container = settingsContainer.parent();
            const itemPos = currentItem.position().top;
            const containerHeight = container.height();
            const scrollPos = container.scrollTop();

            // Прокрутка к элементу
            if (itemPos < 0 || itemPos > containerHeight) {
                container.animate({
                    scrollTop: scrollPos + itemPos - containerHeight / 2
                }, 200);
            }
        }

        function clearHighlight() {
            if (currentItem) {
                currentItem.removeClass(ACTIVE_CLASS).removeClass(TRAVERSE_CLASS);
            }
            currentItem = null;
        }

        function toggleVisibility(item) {
            if (!settingsContainer || !item) return;
            item.toggleClass(HIDDEN_CLASS);
            saveSettings();
        }

        function showItemActions() {
            if (!currentItem) return;
            const actions = [
                { title: 'Переместить вверх', key: 'up' },
                { title: 'Переместить вниз', key: 'down' },
                {
                    title: currentItem.hasClass(HIDDEN_CLASS) ? 'Показать' : 'Скрыть',
                    key: 'toggle'
                }
            ];
            Lampa.Modal.close();
            Lampa.Select.show({
                title: 'Действия',
                items: actions,
                onSelect: (action) => {
                    switch (action.key) {
                        case 'up':
                            moveItem(-1);
                            break;
                        case 'down':
                            moveItem(1);
                            break;
                        case 'toggle':
                            toggleVisibility(currentItem);
                            break;
                    }
                    Lampa.Controller.toggle('settings_sort');
                },
                onBack: () => {
                    Lampa.Controller.toggle('settings_sort');
                }
            });
        }

        function getVisibleItems() {
            if (!settingsContainer) return $();
            return settingsContainer.find('.settings-folder');
        }

        function loadSettings() {
            if (!settingsContainer) return;
            try {
                // Порядок
                const order = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                if (order.length) {
                    order.forEach(id => {
                        const item = settingsContainer.find(`[data-component="${id}"]`);
                        if (item.length) settingsContainer.append(item);
                    });
                }
                // Скрытые
                const hidden = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
                hidden.forEach(id => {
                    settingsContainer.find(`[data-component="${id}"]`).addClass(HIDDEN_CLASS);
                });
            } catch (e) {
                localStorage.setItem(STORAGE_KEY, '[]');
                localStorage.setItem(HIDDEN_KEY, '[]');
            }
        }

        function saveSettings() {
            if (!settingsContainer) return;
            try {
                // Порядок
                const order = [];
                settingsContainer.find('.settings-folder').each(function() {
                    const cmp = $(this).data('component');
                    if (cmp) order.push(cmp);
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
                // Скрытые
                const hidden = [];
                settingsContainer.find('.' + HIDDEN_CLASS).each(function() {
                    const cmp = $(this).data('component');
                    if (cmp) hidden.push(cmp);
                });
                localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));
            } catch (e) {}
        }

        function addStyles() {
            if ($('#settings-sort-style').length) return;
            const css = `
            .settings-folder {
                display: flex;
                align-items: center;
                color: #ddd;
                position: relative;
                padding: 0.9em 1em;
                border-radius: 1em;
                margin: 0.1em 0;
            }
            .settings-folder.focus,
            .settings-folder.traverse,
            .settings-folder.hover {
                background-color: #fff;
                color: #000;
            }
            .settings-folder.traverse::before,
            .settings-folder.traverse::after {
                position: absolute;
                left: 27%;
                margin-left: -0.5em;
                color: #fff;
            }
            .settings-folder.traverse::before {
                content: '▲';
                top: -1.1em;
            }
            .settings-folder.traverse::after {
                content: '▼';
                bottom: -1.1em;
            }
            .editable .settings-folder.hidden {
                opacity: 0.5;
            }
            `;
            $('<style id="settings-sort-style">').html(css).appendTo('head');
        }
    }
})();
