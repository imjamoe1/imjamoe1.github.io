(function() {
    'use strict';

    const STORAGE_KEY = 'lampa_tv_menu_order';
    let isEditMode = false;
    let currentItem = null;
    let holdTimer = null;
    const HOLD_DURATION = 1000; // 1 секунда для активации

    // 1. Находим контейнер меню (TV-версия)
    function getMenuContainer() {
        // Основные селекторы для TV-интерфейса Lampa
        return document.querySelector([
            '.selector__body',       // Основное меню
            '.settings-section',     // Настройки
            '[data-component="menu"]', // Альтернативный селектор
            '.settings-list'         // Дополнительный вариант
        ].join(','));
    }

    // 2. Надёжное сохранение порядка для TV
    function saveOrder() {
        const container = getMenuContainer();
        if (!container) return;

        const items = Array.from(container.children);
        const order = items.map(item => {
            // Создаём уникальный идентификатор для TV-элементов
            return item.id || item.dataset.id || 
                   item.getAttribute('data-name') || 
                   (item.textContent || '').trim().substring(0, 20);
        }).filter(Boolean);

        if (order.length > 0) {
            // Используем хранилище Lampa
            Lampa.Storage.set(STORAGE_KEY, JSON.stringify({
                order: order,
                savedAt: new Date().getTime()
            }));
            console.log('[TV Menu] Порядок сохранён');
        }
    }

    // 3. Восстановление порядка (TV-оптимизированное)
    function restoreOrder() {
        try {
            const savedData = Lampa.Storage.get(STORAGE_KEY);
            if (!savedData) return;

            const { order } = JSON.parse(savedData);
            const container = getMenuContainer();
            if (!container || !order) return;

            const items = Array.from(container.children);
            if (items.length !== order.length) return;

            const itemsMap = {};
            items.forEach(item => {
                const key = item.id || item.dataset.id || 
                           item.getAttribute('data-name') || 
                           (item.textContent || '').trim().substring(0, 20);
                if (key) itemsMap[key] = item;
            });

            // Пересобираем в сохранённом порядке
            container.innerHTML = '';
            order.forEach(key => {
                if (itemsMap[key]) container.appendChild(itemsMap[key]);
            });
            
            console.log('[TV Menu] Порядок восстановлен');
        } catch (e) {
            console.error('[TV Menu] Ошибка восстановления:', e);
        }
    }

    // 4. TV-режим редактирования
    function startEditMode(item) {
        if (isEditMode) return;
        
        isEditMode = true;
        currentItem = item;
        item.classList.add('tv-edit-highlight');
        
        // Фокус для TV-управления
        setTimeout(() => item.focus(), 50);
    }

    function stopEditMode() {
        if (!isEditMode) return;
        
        if (currentItem) {
            currentItem.classList.remove('tv-edit-highlight');
            currentItem = null;
        }
        isEditMode = false;
        saveOrder();
    }

    // 5. Обработчики для TV-пульта
    function handleKeyDown(e) {
        // Долгое нажатие OK (Enter)
        if (e.keyCode === 13 && !isEditMode) { // 13 = Enter (OK)
            const focused = document.activeElement;
            const item = focused.closest([
                '.selector__item',
                '.settings-item',
                '[data-component]'
            ]);
            
            if (item) {
                holdTimer = setTimeout(() => {
                    startEditMode(item);
                }, HOLD_DURATION);
            }
        }
        
        // Управление в режиме редактирования
        if (isEditMode && currentItem) {
            e.preventDefault();
            e.stopPropagation();
            
            switch (e.keyCode) {
                case 38: // Вверх
                    if (currentItem.previousElementSibling) {
                        currentItem.parentNode.insertBefore(
                            currentItem, 
                            currentItem.previousElementSibling
                        );
                    }
                    break;
                    
                case 40: // Вниз
                    if (currentItem.nextElementSibling) {
                        currentItem.parentNode.insertBefore(
                            currentItem.nextElementSibling, 
                            currentItem
                        );
                    }
                    break;
                    
                case 13: // OK - сохранить
                case 27: // Back - отмена
                    stopEditMode();
                    break;
            }
        }
    }

    function handleKeyUp(e) {
        if (e.keyCode === 13 && holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
    }

    // 6. TV-стили
    function addTVStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tv-edit-highlight {
                position: relative;
                z-index: 9999;
                animation: tv-pulse 1s infinite;
                outline: 2px solid #ff3366 !important;
                box-shadow: 0 0 10px rgba(255, 51, 102, 0.7) !important;
            }
            @keyframes tv-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.03); }
            }
        `;
        document.head.appendChild(style);
    }

    // 7. Инициализация TV-версии
    function initTV() {
        addTVStyles();
        
        // Ждём полной загрузки TV-интерфейса
        setTimeout(() => {
            restoreOrder();
            
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
            
            console.log('[TV Menu] Готово для Android TV');
        }, 2000); // Увеличенная задержка для TV
    }

    // Запуск только для TV
    if (/android|smart-tv|tv|googletv|appletv|webos|tizen/i.test(navigator.userAgent)) {
        if (window.appready) {
            initTV();
        } else {
            Lampa.Listener.follow('app', (e) => {
                if (e.type === 'ready') initTV();
            });
        }
    }
})();
