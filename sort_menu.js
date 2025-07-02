(function() {
    const PLUGIN_NAME = 'SettingsMenuEditor';
    const STORAGE_KEY = 'lampa_settings_order';
    const HIDDEN_KEY = 'lampa_hidden_settings';
    const ACTIVE_CLASS = 'settings-item--active';
    const EDIT_MODE_CLASS = 'settings--edit-mode';
    const HIDDEN_CLASS = 'settings-item--hidden';

    let editMode = false;
    let currentItem = null;

    function init() {
        console.log(`[${PLUGIN_NAME}] Initializing...`);

        Lampa.Listener.follow('app', e => {
            if (e.type !== 'ready') return;

            // Добавляем кнопку редактирования
            addEditButton();
            
            // Загружаем сохраненные настройки
            loadSettings();
            
            // Настраиваем обработчики
            setupHandlers();
            
            // Добавляем стили
            addStyles();
        });
    }

    function addEditButton() {
        const $editBtn = $(`
            <div class="settings-folder" data-action="edit_settings">
                <div class="settings-folder__ico">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                        <path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75 1.84-1.83zM3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
                    </svg>
                </div>
                <div class="settings-folder__name">Редактировать</div>
            </div>
        `);
        
        $('.settings-folder[data-action="settings"]').after($editBtn);
        
        $editBtn.on('hover:enter', () => {
            toggleEditMode();
        });
    }

    function toggleEditMode() {
        editMode = !editMode;
        
        if (editMode) {
            $('.settings__content').addClass(EDIT_MODE_CLASS);
            currentItem = $('.settings-folder:visible').not('[data-action="edit_settings"]').first();
            highlightItem(currentItem);
        } else {
            $('.settings__content').removeClass(EDIT_MODE_CLASS);
            $('.settings-folder').removeClass(ACTIVE_CLASS);
            currentItem = null;
            saveSettings();
        }
    }

    function setupHandlers() {
        // Обработка кнопок пульта
        Lampa.Listener.follow('keyboard', e => {
            if (!editMode || !currentItem) return;

            switch (e.key) {
                case 'up':
                    moveSelection(-1);
                    break;
                    
                case 'down':
                    moveSelection(1);
                    break;
                    
                case 'ok':
                    toggleVisibility(currentItem);
                    break;
                    
                case 'back':
                    toggleEditMode();
                    break;
                    
                case 'left':
                case 'right':
                    moveItem(e.key === 'left' ? -1 : 1);
                    break;
            }
        });
    }

    function moveSelection(direction) {
        const $items = $('.settings-folder:visible').not('[data-action="edit_settings"]');
        const currentIndex = $items.index(currentItem);
        let newIndex = currentIndex + direction;

        if (newIndex < 0) newIndex = $items.length - 1;
        if (newIndex >= $items.length) newIndex = 0;

        highlightItem($items.eq(newIndex));
    }

    function highlightItem($item) {
        $('.settings-folder').removeClass(ACTIVE_CLASS);
        currentItem = $item.addClass(ACTIVE_CLASS);
    }

    function toggleVisibility($item) {
        $item.toggleClass(HIDDEN_CLASS);
    }

    function moveItem(direction) {
        if (direction === -1) {
            currentItem.insertBefore(currentItem.prev());
        } else {
            currentItem.insertAfter(currentItem.next());
        }
    }

    function loadSettings() {
        // Загрузка порядка
        const order = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (order) {
            const $container = $('.settings-folder').parent();
            order.forEach(id => {
                $container.append($(`.settings-folder[data-component="${id}"]`));
            });
        }

        // Загрузка скрытых элементов
        const hidden = JSON.parse(localStorage.getItem(HIDDEN_KEY)) || [];
        hidden.forEach(id => {
            $(`.settings-folder[data-component="${id}"]`).addClass(HIDDEN_CLASS);
        });
    }

    function saveSettings() {
        // Сохраняем порядок
        const order = [];
        $('.settings-folder').each(function() {
            order.push($(this).data('component'));
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(order));

        // Сохраняем скрытые элементы
        const hidden = [];
        $(`.${HIDDEN_CLASS}`).each(function() {
            hidden.push($(this).data('component'));
        });
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));
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
                transform: scale(1.02);
            }
            
            .${HIDDEN_CLASS} {
                opacity: 0.3;
            }
            
            .${EDIT_MODE_CLASS} .${ACTIVE_CLASS}::after {
                content: "✚";
                position: absolute;
                right: 15px;
                color: orange;
                font-size: 20px;
            }
            
            .${EDIT_MODE_CLASS} .${ACTIVE_CLASS}.${HIDDEN_CLASS}::after {
                content: "✖";
                color: red;
            }
        `;
        $('<style>').html(css).appendTo('head');
    }

    init();
})();
