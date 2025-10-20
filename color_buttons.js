(function() {
    setTimeout(function() {

        // Добавление CSS
        if (!document.getElementById('style')) {
            const css = `
                /* Стили для кнопок */
                .full-start__button {
                    transition: transform 0.2s ease !important;
                    position: relative;
                }
                .full-start__button:active {
                    transform: scale(0.98) !important;
                }

                .full-start__button.loading::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: rgba(255,255,255,0.5);
                    animation: loading 1s linear infinite;
                }
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                @media (max-width: 767px) {
                    .full-start__button {
                        min-height: 44px !important;
                        padding: 10px !important;
                    }
                }
            `;
            const style = document.createElement('style');
            style.id = 'style';
            style.textContent = css;
            document.head.appendChild(style);
        }

        // Функция для безопасной замены иконок
        function replaceIcons() {
            // Замена онлайн-иконок
            document.querySelectorAll('.full-start__button.view--online svg').forEach(svg => {
                if (!svg.hasAttribute('data-replaced')) {
                    const newSvg = `
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' data-replaced='true'>
                    <path fill='#2196f3' d='M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z'/>
                </svg><span>Онлайн</span>
                    `;
                    svg.outerHTML = newSvg;
                }
            });

            // Замена торрент-иконок
            document.querySelectorAll('.full-start__button.view--torrent svg').forEach(svg => {
                if (!svg.hasAttribute('data-replaced')) {
                    const newSvg = `
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='2 2 42 42' width='48' height='48' data-replaced='true'>
                            <path fill='#4caf50' fill-rule='evenodd' d='M23.501,44.125c11.016,0,20-8.984,20-20 c0-11.015-8.984-20-20-20c-11.016,0-20,8.985-20,20C3.501,35.141,12.485,44.125,23.501,44.125z' clip-rule='evenodd'/>
                            <path fill='#fff' fill-rule='evenodd' d='M43.252,27.114C39.718,25.992,38.055,19.625,34,11l-7,1.077 c1.615,4.905,8.781,16.872,0.728,18.853C20.825,32.722,17.573,20.519,15,14l-8,2l10.178,27.081c1.991,0.67,4.112,1.044,6.323,1.044 c0.982,0,1.941-0.094,2.885-0.232l-4.443-8.376c6.868,1.552,12.308-0.869,12.962-6.203c1.727,2.29,4.089,3.183,6.734,3.172 C42.419,30.807,42.965,29.006,43.252,27.114z' clip-rule='evenodd'/>
                        </svg>
                    `;
                    svg.outerHTML = newSvg;
                }
            });

            // Замена трейлер-иконок
            document.querySelectorAll('.full-start__button.view--trailer svg').forEach(svg => {
                if (!svg.hasAttribute('data-replaced')) {
                    const newSvg = `
                        <svg height='70' viewBox='0 0 80 70' fill='#f44336' xmlns='http://www.w3.org/2000/svg' data-replaced='true'>
                            <path fill-rule='evenodd' clip-rule='evenodd' d='M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955Z'/>
                            <path fill='white' d='M55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z'/>
                        </svg>
                    `;
                    svg.outerHTML = newSvg;
                }
            });
        }

        // Улучшенная инициализация с наблюдением за DOM
        function init() {
            replaceIcons();
            
            // Наблюдатель за изменениями DOM
            const observer = new MutationObserver(function(mutations) {
                let shouldUpdate = false;
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1 && (
                                node.classList?.contains('full-start__button') || 
                                node.querySelector?.('.full-start__button')
                            )) {
                                shouldUpdate = true;
                            }
                        });
                    }
                });
                if (shouldUpdate) {
                    setTimeout(replaceIcons, 100);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Дополнительные слушатели для Lampa
            if (window.Lampa && Lampa.Listener) {
                Lampa.Listener.follow('full', function() {
                    setTimeout(replaceIcons, 300);
                });
                
                Lampa.Listener.follow('component', function() {
                    setTimeout(replaceIcons, 300);
                });
            }

            // Периодическая проверка (на случай если наблюдатель пропустит изменения)
            setInterval(replaceIcons, 2000);
        }

        // Запуск инициализации
        init();

        // Регистрация плагина
        window.plugin && window.plugin('style_plugin', {
            type: 'component',
            name: 'Стили для кнопок',
            version: '2.3.2',
            author: 'Oleksandr',
            description: 'Анимации и цветные иконки для кнопок'
        });

    }, 1000);
})();
