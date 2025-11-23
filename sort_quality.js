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

    // Основная функция сортировки
    function sortQualityItems() {
        const selectBoxBody = document.querySelector('.selectbox__body .scroll__body');
        if (!selectBoxBody) {
            return;
        }

        const qualityItems = Array.from(selectBoxBody.querySelectorAll('.selectbox-item'));
        if (qualityItems.length === 0) {
            return;
        }

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

        // Если порядок изменился, применяем сортировку
        if (currentOrder !== sortedOrder) {
            sortedItems.forEach(item => selectBoxBody.appendChild(item));
        }
    }

    // Наблюдатель за изменениями DOM
    const domObserver = new MutationObserver(function (mutations) {
        let hasQualityItems = false;
        
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.classList?.contains('selectbox-item') || 
                        node.querySelector?.('.selectbox-item')) {
                        hasQualityItems = true;
                    }
                });
            }
        });
        
        if (hasQualityItems) {
            sortQualityItems();
        }
    });

    // Настройки наблюдателя
    const observerConfig = {
        childList: true,
        subtree: true
    };

    // Запускаем наблюдение
    domObserver.observe(document.body, observerConfig);
    
    // Дополнительная проверка каждые 3 секунды
    setInterval(sortQualityItems, 3000);

})();
