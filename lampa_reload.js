(() => {
    const plugin = {
        name: 'ReloadAndExitLampa',
        version: '1.0',
        description: 'Кнопки для перезагрузки и выхода из приложения Lampa с поддержкой TV-пульта',
        
        init() {
            setTimeout(() => {
                const buttonsContainer = document.createElement('div');
                buttonsContainer.style.cssText = `
                    position: fixed;
                    top: 12px;
                    right: 1px;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    z-index: 9999;
                `;

                const reloadButton = document.createElement('div');
                reloadButton.innerText = '🔄';
                reloadButton.style.cssText = `
                    position: fixed;
                    top: 1px;
                    right: 1px;
                    color: white;
                    padding: 1px;
                    border-radius: 8px;
                    z-index: 9999;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.2s;
                `;
                reloadButton.onclick = () => {
                    if (typeof Lampa !== 'undefined') {
                        if (Lampa.Activity?.restart) {
                            Lampa.Activity.restart();
                        } else {
                            location.reload();
                        }
                    } else {
                        location.reload();
                    }
                };

                const exitButton = document.createElement('div');
                exitButton.innerText = '⏻';
                exitButton.style.cssText = `
                    position: fixed;
                    top: 22px;
                    right: 4px;
                    color: red;
                    background: none;
                    padding: 1px;
                    border-radius: 8px;
                    z-index: 9999;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.2s;
                `;
                exitButton.onclick = () => {
                    if (typeof Lampa !== 'undefined' && Lampa.Activity?.finish) {
                        Lampa.Activity.finish();
                    } else if (window.navigator.app?.exitApp) {
                        window.navigator.app.exitApp();
                    } else {
                        alert('Выход невозможен. Закройте приложение вручную.');
                    }
                };

                // Добавляем стили для фокуса (TV-пульт)
                reloadButton.addEventListener('focus', () => {
                    reloadButton.style.transform = 'scale(1.2)';
                    reloadButton.style.color = '#6200EE';
                    reloadButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                });
                reloadButton.addEventListener('blur', () => {
                    reloadButton.style.transform = 'scale(1)';
                    reloadButton.style.color = 'white';
                    reloadButton.style.backgroundColor = 'transparent';
                });

                exitButton.addEventListener('focus', () => {
                    exitButton.style.transform = 'scale(1.2)';
                    exitButton.style.color = '#FF0000';
                    exitButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                });
                exitButton.addEventListener('blur', () => {
                    exitButton.style.transform = 'scale(1)';
                    exitButton.style.color = 'red';
                    exitButton.style.backgroundColor = 'transparent';
                });

                // Делаем кнопки фокусируемыми (для пульта)
                reloadButton.setAttribute('tabindex', '0');
                exitButton.setAttribute('tabindex', '0');

                buttonsContainer.appendChild(reloadButton);
                buttonsContainer.appendChild(exitButton);
                document.body.appendChild(buttonsContainer);
            }, 2000);
        }
    };

    if (typeof Lampa !== 'undefined' && Lampa.Plugin?.register) {
        Lampa.Plugin.register(plugin);
    } else {
        plugin.init();
    }
})();