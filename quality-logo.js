(function() {
    'use strict';
    
    function initializePlugin() {
        // Добавление пользовательских стилей
        function addCustomStyles() {
            const style = document.createElement('style');
            style.textContent = `
                /* Убираем прозрачный фон для определенных качеств */
                .card__quality:has(img[src*="4K"]),
                .card__quality:has(img[src*="FHD"]),
                .card__quality:has(img[src*="HD"]) {
                    background: none !important;
                }       
                .card__quality {
                    border-radius: 0.25em;
                    display: inline-block;
                    margin: 0 1px;
                    z-index: 10;
                }
                .card__quality img {
                    display: inline-block;
                    border: 1px solid rgba(255, 255, 255, 1);
                    width: 2.7em;  
                    height: 1.7em;
                } 
                @media screen and (max-width: 480px) {  
                    .card__quality img {  
                        max-width: 2.5em;  
                    }  
                }  
            `;
            document.head.appendChild(style);
        }

        // Замена текста на изображения
        function replaceQualityText() {
            const qualityMap = {
                '4K': 'https://imjamoe1.github.io/quality/4K.png',
                'FHD': 'https://imjamoe1.github.io/quality/FHD.png',
                'HD': 'https://imjamoe1.github.io/quality/HD.png',
                'TS': 'https://imjamoe1.github.io/quality/HD.png',
                'TC': 'https://imjamoe1.github.io/quality/HD.png',
                'SD': 'https://imjamoe1.github.io/quality/HD.png',
                'CAMRIP': 'https://imjamoe1.github.io/quality/HD.png',
                'BD': 'https://imjamoe1.github.io/quality/FHD.png',
                'WEBDL': 'https://imjamoe1.github.io/quality/FHD.png',
                'WEB-DLRIP': 'https://imjamoe1.github.io/quality/FHD.png'
            };

            const qualityElements = document.querySelectorAll('.card__quality');
            qualityElements.forEach(element => {
                const textContent = element.textContent.trim().toUpperCase();
                
                if (qualityMap[textContent]) {
                    element.innerHTML = `<img src="${qualityMap[textContent]}" alt="${textContent}">`;
                }
            });
        }

        // Инициализация
        addCustomStyles();
        replaceQualityText();

        // Наблюдатель за изменениями
        const observer = new MutationObserver(() => {
            replaceQualityText();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Запуск пагина
    if (window.appready) {
        initializePlugin();
    } else {
        Lampa.Listener.follow('app', (event) => {
            if (event.type === 'ready') {
                initializePlugin();
            }
        });
    }
})();
