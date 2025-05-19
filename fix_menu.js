(function() {
    'use strict';

    const STORAGE_KEY = 'lampa_custom_menu_order';
    let isEditMode = false;
    let currentItem = null;
    let pressTimer = null;
    const LONG_PRESS_DURATION = 800; // 0.8 секунды для активации

    // 1. Находим контейнер меню (автоподбор для разных версий Lampa)
    function getMenuContainer() {
        return document.querySelector([
            '.settings-section__content', // Основные настройки
            '.selector__body', // Меню плагинов
            '[data-component="plugins"]', // Альтернативный селектор
            '.settings-list' // Дополнительный вариант
        ].join(','));
    }

    // 2. Сохраняем порядок с проверкой
    function saveOrder() {
        const container = getMenuContainer();
        if (!container) return;
        
        const items = Array.from(container.children);
        const order = items.map(item => 
            item.id || item.dataset.id || item.className.split(' ')[0] || item.textContent.trim()
        ).filter(Boolean);
        
        if (order.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
            console.log('Порядок сохранен:', order);
        }
    }

    // 3. Восстанавливаем порядок с защитой от ошибок
    function restoreOrder() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;
            
            const container = getMenuContainer();
            if (!container) return;
            
            const order = JSON.parse(saved);
            const items = Array.from(container.children);
            
            // Создаем карту элементов
            const itemsMap = {};
            items.forEach(item => {
                const key = item.id || item.dataset.id || item.className.split(' ')[0] || item.textContent.trim();
                if (key) itemsMap[key] = item;
            });
            
            // Перестраиваем в сохраненном порядке
            container.innerHTML = '';
            order.forEach(key => {
                if (itemsMap[key]) container.appendChild(itemsMap[key]);
            });
            
            console.log('Порядок восстановлен');
        } catch (e) {
            console.error('Ошибка восстановления:', e);
        }
    }

    // 4. Визуальные эффекты
    function highlightItem(item) {
        if (currentItem) currentItem.classList.remove('lampa-edit-mode');
        currentItem = item;
        item.classList.add('lampa-edit-mode');
    }

    function removeHighlight() {
        if (currentItem) {
            currentItem.classList.remove('lampa-edit-mode');
            currentItem = null;
        }
    }

    // 5. Обработчики для Enter (фикс)
    function handleEnterStart(e) {
        if (e.key === 'Enter' && !isEditMode) {
            const item = e.target.closest([
                '.selector__item', 
                '.settings-item',
                '[data-component]',
                '.settings-section__item'
            ].join(','));
            
            if (item) {
                pressTimer = setTimeout(() => {
                    isEditMode = true;
                    highlightItem(item);
                    console.log('Режим редактирования (Enter)');
                }, LONG_PRESS_DURATION);
            }
        }
    }

    function handleEnterEnd(e) {
        if (e.key === 'Enter' && pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }

    // 6. Обработчики для мыши
    function handleMouseStart(e) {
        if (e.button === 2) { // ПКМ
            const item = e.target.closest([
                '.selector__item', 
                '.settings-item',
                '[data-component]'
            ].join(','));
            
            if (item) {
                pressTimer = setTimeout(() => {
                    isEditMode = true;
                    highlightItem(item);
                    console.log('Режим редактирования (ПКМ)');
                }, LONG_PRESS_DURATION);
            }
        }
    }

    function handleMouseEnd(e) {
        if (e.button === 2 && pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }

    // 7. Управление в режиме редактирования
    function handleNavigation(e) {
        if (!isEditMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        switch (e.key) {
            case 'ArrowUp':
                if (currentItem.previousElementSibling) {
                    currentItem.parentNode.insertBefore(currentItem, currentItem.previousElementSibling);
                }
                break;
                
            case 'ArrowDown':
                if (currentItem.nextElementSibling) {
                    currentItem.parentNode.insertBefore(currentItem.nextElementSibling, currentItem);
                }
                break;
                
            case 'Enter':
            case 'Escape':
                isEditMode = false;
                removeHighlight();
                saveOrder();
                break;
        }
    }

    // 8. Добавляем стили
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .lampa-edit-mode {
                position: relative;
                outline: 2px solid #ff0000 !important;
                outline-offset: 2px !important;
                animation: lampa-blink 1s infinite;
            }
            @keyframes lampa-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
    }

    // 9. Инициализация
    function init() {
        addStyles();
        restoreOrder();
        
        // Обработчики клавиатуры
        document.addEventListener('keydown', handleEnterStart);
        document.addEventListener('keyup', handleEnterEnd);
        document.addEventListener('keydown', handleNavigation);
        
        // Обработчики мыши
        document.addEventListener('mousedown', handleMouseStart);
        document.addEventListener('mouseup', handleMouseEnd);
        document.addEventListener('contextmenu', (e) => {
            if (isEditMode) e.preventDefault();
        });
        
        console.log('Lampa Menu Reorder: Инициализировано');
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