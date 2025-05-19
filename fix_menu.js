(function() {
    'use strict';

    const STORAGE_KEY = 'lampa_menu_order_v3';
    let isEditMode = false;
    let currentItem = null;
    let pressTimer = null;
    const ACTIVATION_DELAY = 1000; // 1 секунда для активации
    const MENU_SELECTORS = [
        '.selector__body', 
        '.settings-section__content',
        '[data-component="plugins"]',
        '.settings-list',
        '.settings-nav'
    ];

    // 1. Улучшенный поиск меню
    function getMenuContainer() {
        let container = null;
        MENU_SELECTORS.some(selector => {
            const el = document.querySelector(selector);
            if (el) {
                container = el.parentNode;
                return true;
            }
            return false;
        });
        return container;
    }

    // 2. Надёжное сохранение порядка
    function saveOrder() {
        const container = getMenuContainer();
        if (!container) return;

        const items = Array.from(container.children);
        const order = items.map(item => {
            // Создаём уникальный идентификатор для каждого элемента
            return item.id || item.dataset.id || 
                   item.getAttribute('data-component') || 
                   item.className.split(' ').find(c => c) || 
                   item.textContent.trim().substring(0, 30);
        }).filter(Boolean);

        if (order.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                order: order,
                timestamp: Date.now()
            }));
            console.log('Menu order saved');
        }
    }

    // 3. Восстановление порядка с проверкой
    function restoreOrder() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (!savedData) return;

            const { order } = JSON.parse(savedData);
            const container = getMenuContainer();
            if (!container || !order) return;

            const items = Array.from(container.children);
            const itemsMap = {};

            items.forEach(item => {
                const key = item.id || item.dataset.id || 
                           item.getAttribute('data-component') || 
                           item.className.split(' ').find(c => c) || 
                           item.textContent.trim().substring(0, 30);
                if (key) itemsMap[key] = item;
            });

            // Проверяем, что все элементы существуют
            const validOrder = order.filter(key => itemsMap[key]);
            if (validOrder.length !== items.length) return;

            container.innerHTML = '';
            validOrder.forEach(key => {
                container.appendChild(itemsMap[key]);
            });
            console.log('Menu order restored');
        } catch (e) {
            console.error('Restore error:', e);
        }
    }

    // 4. Управление режимом редактирования
    function enableEditMode(item) {
        if (isEditMode) return;
        
        isEditMode = true;
        currentItem = item;
        item.classList.add('lampa-edit-active');
        
        // Для TV добавляем фокус
        if (/android|smart-tv|tv|googletv|appletv|webos|tizen/i.test(navigator.userAgent)) {
            item.focus();
        }
    }

    function disableEditMode() {
        if (!isEditMode) return;
        
        isEditMode = false;
        if (currentItem) {
            currentItem.classList.remove('lampa-edit-active');
            currentItem = null;
        }
        saveOrder();
    }

    // 5. Обработчики для всех платформ
    function handleActivationStart(event) {
        // Проверяем, что это нужный элемент
        const item = event.target.closest([
            '.selector__item',
            '.settings-item',
            '.settings-section__item',
            '[data-component]',
            '.settings-nav__item'
        ].join(','));
        
        if (!item) return;

        // Для мыши - только правая кнопка
        if (event.type === 'mousedown' && event.button !== 2) return;

        pressTimer = setTimeout(() => {
            enableEditMode(item);
        }, ACTIVATION_DELAY);
    }

    function handleActivationEnd(event) {
        // Для мыши - только правая кнопка
        if (event.type === 'mouseup' && event.button !== 2) return;
        
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }

    // 6. Управление в режиме редактирования
    function handleNavigation(event) {
        if (!isEditMode || !currentItem) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.key) {
            case 'ArrowUp':
                if (currentItem.previousElementSibling) {
                    currentItem.parentNode.insertBefore(
                        currentItem, 
                        currentItem.previousElementSibling
                    );
                }
                break;
                
            case 'ArrowDown':
                if (currentItem.nextElementSibling) {
                    currentItem.parentNode.insertBefore(
                        currentItem.nextElementSibling, 
                        currentItem
                    );
                }
                break;
                
            case 'Enter':
            case 'Escape':
                disableEditMode();
                break;
        }
    }

    // 7. Добавляем необходимые стили
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .lampa-edit-active {
                position: relative;
                z-index: 1000;
                outline: 2px solid #ff0000 !important;
                outline-offset: 2px !important;
                animation: lampa-edit-pulse 0.8s infinite;
            }
            @keyframes lampa-edit-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.02); }
            }
        `;
        document.head.appendChild(style);
    }

    // 8. Инициализация
    function init() {
        // Ждём полной загрузки интерфейса
        setTimeout(() => {
            addStyles();
            restoreOrder();
            
            // Универсальные обработчики
            document.addEventListener('keydown', handleActivationStart);
            document.addEventListener('keyup', handleActivationEnd);
            document.addEventListener('mousedown', handleActivationStart);
            document.addEventListener('mouseup', handleActivationEnd);
            document.addEventListener('keydown', handleNavigation);
            document.addEventListener('contextmenu', (e) => e.preventDefault());
            
            console.log('Lampa Menu Reorder: Initialized (Universal version)');
        }, 1500); // Увеличенная задержка для полной инициализации Lampa
    }

    // Запуск
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') init();
        });
    }
})();
