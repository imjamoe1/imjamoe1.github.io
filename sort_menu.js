(function() {
    // Ждем полной загрузки Lampa
    if (!window.Lampa || !Lampa.Listener) {
        setTimeout(arguments.callee, 100);
        return;
    }

    const PLUGIN_NAME = 'SettingsMenuEditorPro';
    const STORAGE_KEY = 'lampa_settings_custom_order';
    const HIDDEN_KEY = 'lampa_hidden_settings_items';
    const ACTIVE_CLASS = 'focus';
    const TRAVERSE_CLASS = 'traverse';
    const EDIT_MODE_CLASS = 'editable';
    const HIDDEN_CLASS = 'hidden';

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
        settingsContainer.toggleClass(EDIT_MODE_CLASS, editMode);
        
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
        
        // Добавляем стрелки для перемещения
        if (editMode) {
            currentItem.addClass(TRAVERSE_CLASS);
        }
        
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
        if (currentItem) {
            currentItem.removeClass(ACTIVE_CLASS);
            currentItem.removeClass(TRAVERSE_CLASS);
        }
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
        return settingsContainer.find('.settings-folder');
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
            
            .editable .settings-folder.focus:not(.traverse)::after {
                content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 492.49284 492'%3E%3Cpath d='m304.140625 82.472656-270.976563 270.996094c-1.363281 1.367188-2.347656 3.09375-2.816406 4.949219l-30.035156 120.554687c-.898438 3.628906.167969 7.488282 2.816406 10.136719 2.003906 2.003906 4.734375 3.113281 7.527344 3.113281.855469 0 1.730469-.105468 2.582031-.320312l120.554688-30.039063c1.878906-.46875 3.585937-1.449219 4.949219-2.8125l271-270.976562zm0 0' fill='%23000000'%3E%3C/path%3E%3Cpath d='m476.875 45.523438-30.164062-30.164063c-20.160157-20.160156-55.296876-20.140625-75.433594 0l-36.949219 36.949219 105.597656 105.597656 36.949219-36.949219c10.070312-10.066406 15.617188-23.464843 15.617188-37.714843s-5.546876-27.648438-15.617188-37.71875zm0 0' fill='%23000000'%3E%3C/path%3E%3C/svg%3E");
                position: absolute;
                right: 0.7em;
                top: 50%;
                color: #000;
                width: 1em;
                height: 1em;
                margin-top: -0.5em;
            }
            
            body.light--version .settings-folder {
                border-radius: 0.3em;
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
