(function() {
    // Ждем полной загрузки Lampa
    if (!window.Lampa || !Lampa.Listener) {
        setTimeout(arguments.callee, 100);
        return;
    }

    const PLUGIN_NAME = 'SettingsMenuEditorPro';
    const STORAGE_KEY = 'lampa_settings_custom_order';
    const HIDDEN_KEY = 'lampa_hidden_settings_items';
    const ACTIVE_CLASS = 'settings-folder--active';
    const EDIT_MODE_CLASS = 'settings--edit-mode';
    const HIDDEN_CLASS = 'settings-folder--hidden';

    let editMode = false;
    let currentItem = null;
    let settingsContainer = null;

    function init() {
        console.log(`[${PLUGIN_NAME}] Initializing...`);

        // Подписываемся на открытие настроек
        Lampa.Settings.listener.follow('open', function(e) {
            if (!settingsContainer && e.body) {
                settingsContainer = e.body.find('.scroll__body > div');
                
                // Добавляем небольшую задержку для гарантированной инициализации
                setTimeout(() => {
                    setupEditor();
                }, 300);
            }
        });

        // Создаем контроллер
        Lampa.Controller.add('settings_editor', {
            toggle: () => {
                if (currentItem) {
                    Lampa.Controller.collectionFocus(currentItem[0]);
                }
            },
            up: () => editMode && moveSelection(-1),
            down: () => editMode && moveSelection(1),
            left: () => editMode && toggleVisibility(currentItem),
            right: () => editMode && toggleVisibility(currentItem),
            back: () => editMode && toggleEditMode(false),
            ok: () => editMode && showItemActions()
        });
    }

    function setupEditor() {
        try {
            addStyles();
            bindLongPress();
            loadSettings();
        } catch (e) {
            console.error(`[${PLUGIN_NAME}] Setup error:`, e);
        }
    }

    function bindLongPress() {
        settingsContainer.find('.settings-folder').off('hover:long').on('hover:long', function() {
            if (!editMode) {
                toggleEditMode(true);
                currentItem = $(this);
                highlightItem(currentItem);
            }
        });
    }

    function toggleEditMode(enable) {
        editMode = enable;
        $('body').toggleClass(EDIT_MODE_CLASS, editMode);
        
        if (editMode) {
            Lampa.Controller.toggle('settings_editor');
            console.log(`[${PLUGIN_NAME}] Edit mode activated`);
        } else {
            Lampa.Controller.toggle('settings');
            saveSettings();
            console.log(`[${PLUGIN_NAME}] Edit mode deactivated`);
        }
    }

    function moveSelection(direction) {
        const items = getVisibleItems();
        if (items.length === 0) return;

        const currentIndex = items.index(currentItem);
        let newIndex = (currentIndex + direction + items.length) % items.length;
        
        highlightItem(items.eq(newIndex));
    }

    function highlightItem(item) {
        clearHighlight();
        currentItem = item;
        currentItem.addClass(ACTIVE_CLASS);
        
        // Плавная прокрутка к элементу
        const container = settingsContainer.parent();
        const itemPos = currentItem.position().top;
        const containerHeight = container.height();
        const scrollPos = container.scrollTop();
        
        if (itemPos < 0 || itemPos > containerHeight) {
            container.animate({
                scrollTop: scrollPos + itemPos - containerHeight/2
            }, 200);
        }
    }

    function clearHighlight() {
        if (currentItem) currentItem.removeClass(ACTIVE_CLASS);
        currentItem = null;
    }

    function toggleVisibility(item) {
        item.toggleClass(HIDDEN_CLASS);
        saveSettings();
    }

    function showItemActions() {
        if (!currentItem) return;

        const actions = [
            {title: Lampa.Lang.translate('move_up') || 'Переместить вверх', key: 'up'},
            {title: Lampa.Lang.translate('move_down') || 'Переместить вниз', key: 'down'},
            {title: currentItem.hasClass(HIDDEN_CLASS) ? 
                (Lampa.Lang.translate('show_item') || 'Показать') : 
                (Lampa.Lang.translate('hide_item') || 'Скрыть'), 
             key: 'toggle'}
        ];

        Lampa.Modal.close();
        
        Lampa.Select.show({
            title: Lampa.Lang.translate('item_actions') || 'Действия',
            items: actions,
            onSelect: (action) => {
                switch (action.key) {
                    case 'up':
                        if (currentItem.prev().length) {
                            currentItem.insertBefore(currentItem.prev());
                            saveSettings();
                        }
                        break;
                    case 'down':
                        if (currentItem.next().length) {
                            currentItem.insertAfter(currentItem.next());
                            saveSettings();
                        }
                        break;
                    case 'toggle':
                        toggleVisibility(currentItem);
                        break;
                }
                Lampa.Controller.toggle('settings_editor');
            },
            onBack: () => {
                Lampa.Controller.toggle('settings_editor');
            }
        });
    }

    function getVisibleItems() {
        return settingsContainer.find('.settings-folder').not('[data-action="settings_editor"]');
    }

    function loadSettings() {
        try {
            // Загрузка порядка
            const order = JSON.parse(Lampa.Storage.get(STORAGE_KEY) || '[]');
            if (order.length) {
                order.forEach(id => {
                    const item = settingsContainer.find(`[data-component="${id}"]`);
                    if (item.length) settingsContainer.append(item);
                });
            }

            // Загрузка скрытых элементов
            const hidden = JSON.parse(Lampa.Storage.get(HIDDEN_KEY) || '[]');
            hidden.forEach(id => {
                settingsContainer.find(`[data-component="${id}"]`).addClass(HIDDEN_CLASS);
            });
        } catch (e) {
            console.error(`[${PLUGIN_NAME}] Load settings error:`, e);
            // Сбрасываем некорректные настройки
            Lampa.Storage.set(STORAGE_KEY, JSON.stringify([]));
            Lampa.Storage.set(HIDDEN_KEY, JSON.stringify([]));
        }
    }

    function saveSettings() {
        try {
            // Сохраняем порядок
            const order = [];
            settingsContainer.find('.settings-folder').each(function() {
                const component = $(this).data('component');
                if (component) order.push(component);
            });
            Lampa.Storage.set(STORAGE_KEY, JSON.stringify(order));

            // Сохраняем скрытые элементы
            const hidden = [];
            settingsContainer.find(`.${HIDDEN_CLASS}`).each(function() {
                const component = $(this).data('component');
                if (component) hidden.push(component);
            });
            Lampa.Storage.set(HIDDEN_KEY, JSON.stringify(hidden));
        } catch (e) {
            console.error(`[${PLUGIN_NAME}] Save settings error:`, e);
        }
    }

    function addStyles() {
        const css = `
            .${EDIT_MODE_CLASS} .settings-folder {
                position: relative;
                transition: all 0.2s;
            }
            .${ACTIVE_CLASS} {
                background: rgba(255,165,0,0.3) !important;
                border-left: 3px solid orange !important;
            }
            .${HIDDEN_CLASS} {
                opacity: 0.4;
                filter: grayscale(80%);
            }
            .${EDIT_MODE_CLASS} .settings-folder::after {
                content: "✓";
                position: absolute;
                right: 15px;
                color: orange;
                font-size: 20px;
            }
            .${EDIT_MODE_CLASS} .${HIDDEN_CLASS}::after {
                content: "✕";
                color: #ff3d3d;
            }
        `;
        
        if (!$('#settings-editor-styles').length) {
            $('<style id="settings-editor-styles">').html(css).appendTo('head');
        }
    }

    // Запускаем инициализацию
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            init();
        }
    });
})();
