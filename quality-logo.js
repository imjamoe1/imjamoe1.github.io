(function() {
    'use strict';
    
    function initializePlugin() {
        // Добавление пользовательских стилей
        function addCustomStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .card__quality {      
                    position: absolute;      
                    left: 0.3em;
                    bottom: 0.3em;
                    transform: translateX(0.8em) translateY(2.5em);
                    padding: 0.2em 0.3em;      
                    background: transparent;      
                    color: #000000;
                    z-index: 12 !important;      
                    font-size: 1em;
                    -webkit-border-radius: 0.3em;
                    -moz-border-radius: 0.3em;      
                    border-radius: 0.9em;  
                    max-width: calc(100% - 0.6em);  
                    overflow: hidden;  
                }
                /* Убираем прозрачный фон для определенных качеств */
                .card__quality:has(img[src*="4K"]),
                .card__quality:has(img[src*="FHD"]),
                .card__quality:has(img[src*="HD"]) {
                    background: none !important;
                }       
                .card__quality img {
                    width: 43px;  
                    height: 23px;
                    border-radius: 0.25em;  
                    display: inline-block;
                    margin: 0 1px;   
                }           
                @media screen and (max-width: 480px) {  
                    .card__quality img {  
                        max-width: 40px;  
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
