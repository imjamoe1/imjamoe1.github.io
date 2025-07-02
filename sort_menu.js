(function() {
    // Конфигурация
    const PLUGIN_NAME = 'SettingsMenuManager';
    const STORAGE_KEY = 'lampa_settings_menu_order';
    const HIDDEN_STORAGE_KEY = 'lampa_hidden_settings_items';
    const ACTIVE_CLASS = 'settings-item--active';
    const EDIT_MODE_CLASS = 'settings-edit-mode';

    // Инициализация
    function init() {
        console.log(`[${PLUGIN_NAME}] Initializing...`);

        // Ждем загрузки приложения
        Lampa.Listener.follow('app', e => {
            if (e.type !== 'ready') return;

            // Добавляем кнопку редактирования
            addEditButton();
            
            // Загружаем сохраненные состояния
            loadSavedState();
            
            // Добавляем стили
            addStyles();
        });
    }

    // Добавление кнопки редактирования
    function addEditButton() {
        const $settingsButton = $('[data-action="settings"]');
        if (!$settingsButton.length) return;

        const $editButton = $settingsButton.clone();
        $editButton.find('.menu__text').text('Редактировать');
        $editButton.attr('data-action', 'settings_edit');
        $editButton.insertAfter($settingsButton);

        $editButton.on('hover:enter', () => {
            toggleEditMode();
        });
    }

    // Переключение режима редактирования
    function toggleEditMode() {
        const $settingsList = $('.settings__content');
        const isEditMode = $settingsList.hasClass(EDIT_MODE_CLASS);

        if (isEditMode) {
            // Выход из режима редактирования
            $settingsList.removeClass(EDIT_MODE_CLASS);
            $('.settings-item').removeClass(ACTIVE_CLASS);
        } else {
            // Вход в режим редактирования
            $settingsList.addClass(EDIT_MODE_CLASS);
            activateFirstItem();
        }
    }

    // Активация первого элемента
    function activateFirstItem() {
        const $visibleItems = $('.settings-item:visible').not('[data-action="settings_edit"]');
        if ($visibleItems.length) {
            $visibleItems.first().addClass(ACTIVE_CLASS);
        }
    }

    // Загрузка сохраненного состояния
    function loadSavedState() {
        // Загрузка порядка
        const savedOrder = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (savedOrder) {
            const $container = $('.settings__content');
            savedOrder.forEach(id => {
                const $item = $(`.settings-item[data-component="${id}"]`);
                if ($item.length) $container.append($item);
            });
        }

        // Загрузка скрытых элементов
        const hiddenItems = JSON.parse(localStorage.getItem(HIDDEN_STORAGE_KEY)) || [];
        hiddenItems.forEach(id => {
            $(`.settings-item[data-component="${id}"]`).hide();
        });
    }

    // Сохранение состояния
    function saveState() {
        // Сохраняем порядок
        const order = [];
        $('.settings-item').each(function() {
            order.push($(this).attr('data-component'));
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(order));

        // Сохраняем скрытые элементы
        const hiddenItems = [];
        $('.settings-item').each(function() {
            if ($(this).css('display') === 'none') {
                hiddenItems.push($(this).attr('data-component'));
            }
        });
        localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(hiddenItems));
    }

    // Обработка навигации
    function setupNavigation() {
        Lampa.Listener.follow('keyboard', e => {
            const $activeItem = $(`.${ACTIVE_CLASS}`);
            if (!$activeItem.length) return;

            switch (e.key) {
                case 'up':
                    moveSelection(-1);
                    break;
                case 'down':
                    moveSelection(1);
                    break;
                case 'left':
                    toggleItemVisibility($activeItem);
                    break;
                case 'right':
                    toggleItemVisibility($activeItem);
                    break;
                case 'back':
                    toggleEditMode();
                    break;
            }
        });
    }

    // Перемещение выбора
    function moveSelection(direction) {
        const $activeItem = $(`.${ACTIVE_CLASS}`);
        const $allItems = $('.settings-item:visible').not('[data-action="settings_edit"]');
        const currentIndex = $allItems.index($activeItem);
        let newIndex = currentIndex + direction;

        if (newIndex < 0) newIndex = $allItems.length - 1;
        if (newIndex >= $allItems.length) newIndex = 0;

        $activeItem.removeClass(ACTIVE_CLASS);
        $allItems.eq(newIndex).addClass(ACTIVE_CLASS);
    }

    // Переключение видимости элемента
    function toggleItemVisibility($item) {
        if ($item.css('display') === 'none') {
            $item.show();
        } else {
            $item.hide();
        }
        saveState();
    }

    // Перемещение элемента
    function moveItem($item, direction) {
        if (direction === 'up') {
            $item.insertBefore($item.prev());
        } else {
            $item.insertAfter($item.next());
        }
        saveState();
    }

    // Добавление стилей
    function addStyles() {
        const css = `
            .${EDIT_MODE_CLASS} .settings-item {
                position: relative;
            }
            .${ACTIVE_CLASS} {
                background-color: rgba(255, 165, 0, 0.3) !important;
                border: 2px solid orange !important;
                box-shadow: 0 0 10px rgba(255, 165, 0, 0.5) !important;
            }
            .${EDIT_MODE_CLASS} .settings-item::after {
                content: "▲▼";
                position: absolute;
                right: 10px;
                color: orange;
                font-size: 12px;
            }
            .${EDIT_MODE_CLASS} .settings-item[style*="display: none"]::after {
                content: "✖";
                color: red;
            }
        `;
        $('<style>').html(css).appendTo('head');
    }

    // Инициализация навигации
    setupNavigation();

    // Запуск плагина
    init();
})();
