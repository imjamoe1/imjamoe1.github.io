(function() {
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
        console.log(`[${PLUGIN_NAME}] Initializing advanced settings editor...`);

        // Ожидаем инициализации компонента настроек
        Settings.listener.follow('open', (e) => {
            if (!settingsContainer && e.body) {
                settingsContainer = e.body.find('.scroll__body > div');
                setupEditor();
            }
        });

        // Обработчик клавиш
        Controller.add('settings_editor', {
            up: () => editMode && moveSelection(-1),
            down: () => editMode && moveSelection(1),
            left: () => editMode && toggleVisibility(currentItem),
            right: () => editMode && toggleVisibility(currentItem),
            back: () => editMode && toggleEditMode(),
            ok: () => editMode && showItemActions()
        });
    }

    function setupEditor() {
        // Добавляем кнопку редактирования
        addEditButton();
        
        // Загружаем сохраненные настройки
        loadSettings();
        
        // Добавляем стили
        addStyles();
    }

    function addEditButton() {
        if (settingsContainer.find('[data-action="settings_editor"]').length) return;

        const editBtn = $(`
            <div class="settings-folder selector" data-action="settings_editor">
                <div class="settings-folder__ico">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                        <path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75 1.84-1.83zM3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
                    </svg>
                </div>
                <div class="settings-folder__name">${Lang.translate('menu_editor') || 'Редактировать'}</div>
            </div>
        `);

        editBtn.on('hover:enter', toggleEditMode);
        settingsContainer.append(editBtn);
    }

    function toggleEditMode() {
        editMode = !editMode;
        
        if (editMode) {
            $('body').addClass(EDIT_MODE_CLASS);
            Controller.toggle('settings_editor');
            const items = getVisibleItems();
            if (items.length > 0) {
                currentItem = items.eq(0);
                highlightItem(currentItem);
            }
        } else {
            $('body').removeClass(EDIT_MODE_CLASS);
            Controller.toggle('settings');
            clearHighlight();
            saveSettings();
        }
    }

    function moveSelection(direction) {
        const items = getVisibleItems();
        const currentIndex = items.index(currentItem);
        let newIndex = (currentIndex + direction + items.length) % items.length;
        
        highlightItem(items.eq(newIndex));
    }

    function highlightItem(item) {
        clearHighlight();
        currentItem = item;
        currentItem.addClass(ACTIVE_CLASS);
        currentItem[0].scrollIntoView({block: 'nearest', behavior: 'smooth'});
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
            {title: Lang.translate('move_up'), key: 'up'},
            {title: Lang.translate('move_down'), key: 'down'},
            {title: currentItem.hasClass(HIDDEN_CLASS) ? Lang.translate('show_item') : Lang.translate('hide_item'), key: 'toggle'}
        ];

        Select.show({
            title: Lang.translate('item_actions'),
            items: actions,
            onSelect: (action) => {
                switch (action.key) {
                    case 'up':
                        currentItem.insertBefore(currentItem.prev());
                        break;
                    case 'down':
                        currentItem.insertAfter(currentItem.next());
                        break;
                    case 'toggle':
                        toggleVisibility(currentItem);
                        break;
                }
                saveSettings();
            }
        });
    }

    function getVisibleItems() {
        return settingsContainer.find('.settings-folder:not([data-action="settings_editor"])').filter(':visible');
    }

    function loadSettings() {
        // Загрузка порядка
        const order = JSON.parse(Storage.get(STORAGE_KEY, '[]'));
        if (order.length) {
            order.forEach(id => {
                const item = settingsContainer.find(`[data-component="${id}"]`);
                if (item.length) settingsContainer.append(item);
            });
        }

        // Загрузка скрытых элементов
        const hidden = JSON.parse(Storage.get(HIDDEN_KEY, '[]'));
        hidden.forEach(id => {
            settingsContainer.find(`[data-component="${id}"]`).addClass(HIDDEN_CLASS);
        });
    }

    function saveSettings() {
        // Сохраняем порядок
        const order = [];
        settingsContainer.find('.settings-folder').each(function() {
            order.push($(this).data('component'));
        });
        Storage.set(STORAGE_KEY, JSON.stringify(order));

        // Сохраняем скрытые элементы
        const hidden = [];
        settingsContainer.find(`.${HIDDEN_CLASS}`).each(function() {
            hidden.push($(this).data('component'));
        });
        Storage.set(HIDDEN_KEY, JSON.stringify(hidden));
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
            
            .${EDIT_MODE_CLASS} .${ACTIVE_CLASS}::after {
                content: "✓";
                position: absolute;
                right: 15px;
                color: orange;
                font-size: 20px;
                font-weight: bold;
            }
            
            .${EDIT_MODE_CLASS} .${ACTIVE_CLASS}.${HIDDEN_CLASS}::after {
                content: "✕";
                color: #ff3d3d;
            }
        `;
        
        $('<style>').html(css).appendTo('head');
    }

    // Инициализация после загрузки Lampa
    Lampa.Listener.follow('app', e => {
        if (e.type === 'ready') {
            init();
        }
    });

})();
