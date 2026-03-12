Lampa.Platform.tv();

(function () {
    'use strict';

    // Функция для определения качества по названию
    function getQualityScore(title) {
        const lowerTitle = title.toLowerCase();
        
        if (lowerTitle.includes('4k') || lowerTitle.includes('hdr')) {
            return 6;
        }
        if (lowerTitle.includes('2160p')) {
            return 5;
        }
        if (lowerTitle.includes('2k') || lowerTitle.includes('1440p')) {
            return 4.5;
        }
        if (lowerTitle.includes('1080p')) {
            return 4;
        }
        if (lowerTitle.includes('720p')) {
            return 3;
        }
        if (lowerTitle.includes('web-dl') || lowerTitle.includes('bdrip')) {
            return 2;
        }
        if (lowerTitle.includes('480p') || lowerTitle.includes('360p') || lowerTitle.includes('240p')) {
            return 1;
        }
        return 0;
    }

    // Функция для сортировки элементов качества
    function sortQualityItems(force = false) {
        const selectBoxBody = document.querySelector('.selectbox__body .scroll__body');
        if (!selectBoxBody) {
            return;
        }

        const qualityItems = Array.from(selectBoxBody.querySelectorAll('.selectbox-item'));
        if (qualityItems.length === 0) {
            return;
        }

        // Получаем сохраненный порядок из localStorage
        const savedOrder = localStorage.getItem('quality_sort_order');
        
        // Проверяем текущий порядок
        const currentOrder = qualityItems.map(item => 
            getQualityScore(item.querySelector('.selectbox-item__title')?.textContent || '')
        ).join(',');

        // Сортируем по качеству (от высшего к низшему)
        const sortedItems = [...qualityItems].sort((itemA, itemB) => {
            const titleA = itemA.querySelector('.selectbox-item__title')?.textContent || '';
            const titleB = itemB.querySelector('.selectbox-item__title')?.textContent || '';
            return getQualityScore(titleB) - getQualityScore(titleA);
        });

        const sortedOrder = sortedItems.map(item => 
            getQualityScore(item.querySelector('.selectbox-item__title')?.textContent || '')
        ).join(',');

        // Применяем сортировку если:
        // 1. Нет сохраненного порядка (первый запуск после очистки кэша)
        // 2. Принудительно требуется сортировка
        // 3. Текущий порядок отличается от отсортированного
        if (force || !savedOrder || currentOrder !== sortedOrder) {
            sortedItems.forEach(item => selectBoxBody.appendChild(item));
            // Сохраняем отсортированный порядок
            localStorage.setItem('quality_sort_order', sortedOrder);
            
            // Логируем для отладки
            console.log('Quality items sorted:', sortedItems.length);
        }
    }

    // Функция для проверки и применения сортировки после загрузки страницы
    function initializeSorting() {
        // Проверяем, был ли очищен кэш (отсутствие сохраненного порядка)
        const savedOrder = localStorage.getItem('quality_sort_order');
        
        if (!savedOrder) {
            // Если кэш очищен, выполняем сортировку с задержкой для загрузки DOM
            setTimeout(() => {
                sortQualityItems(true);
            }, 500);
        }
    }

    // Наблюдатель за изменениями DOM
    const domObserver = new MutationObserver(function (mutations) {
        let hasQualityItems = false;
        let hasNewItems = false;
        
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.classList?.contains('selectbox-item') || 
                        node.querySelector?.('.selectbox-item')) {
                        hasQualityItems = true;
                        
                        // Проверяем, действительно ли это новые элементы
                        if (node.classList?.contains('selectbox-item')) {
                            hasNewItems = true;
                        }
                    }
                });
            }
        });
        
        // Сортируем если появились новые элементы качества
        if (hasQualityItems && hasNewItems) {
            sortQualityItems();
        }
    });

    // Наблюдатель за изменениями в localStorage (для отслеживания очистки кэша)
    const storageObserver = function(e) {
        if (e.key === null) { // Очистка всего localStorage
            console.log('Cache cleared, reapplying quality sort');
            setTimeout(() => {
                sortQualityItems(true);
            }, 500);
        }
    };

    // Настройки наблюдателя DOM
    const observerConfig = {
        childList: true,
        subtree: true
    };

    // Запускаем наблюдение за DOM
    domObserver.observe(document.body, observerConfig);
    
    // Наблюдаем за изменениями в localStorage
    window.addEventListener('storage', storageObserver);
    
    // Периодическая проверка (каждые 2 секунды)
    setInterval(() => {
        sortQualityItems();
    }, 2000);
    
    // Проверяем при загрузке страницы
    document.addEventListener('DOMContentLoaded', initializeSorting);
    
    // Дополнительная проверка после полной загрузки страницы
    window.addEventListener('load', () => {
        setTimeout(initializeSorting, 1000);
    });

    // Обработка кликов по элементам качества (на случай динамической подгрузки)
    document.addEventListener('click', function(e) {
        const target = e.target;
        if (target.closest('.selectbox__button') || target.closest('.selectbox-item')) {
            setTimeout(sortQualityItems, 100);
        }
    });

})();
