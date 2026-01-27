(function() {
    'use strict';
    
    Lampa.Listener.follow('full', function(e) {
        if (e.type === 'complite') {
            setTimeout(function() {
                try {
                    var buttons = document.querySelector('.full-start-new__buttons');
                    if (!buttons) return;
                    
                    // Создаем контейнер для наших кнопок (без жёлтой полосы)
                    var movedButtons = document.createElement('div');
                    movedButtons.className = 'maxsm-fav-buttons';
                    movedButtons.style.cssText = 'display: flex; flex-wrap: wrap; top: 70px !important; gap: 8px; margin: 15px 0;';
                    
                    // Перемещаем кнопки
                    ['subscribe', 'book', 'plaftorms', 'reaction', 'rating', 'options'].forEach(function(name) {
                        var btn = buttons.querySelector('.full-start__button.button--' + name);
                        if (btn && btn.offsetParent !== null) {
                            var clone = btn.cloneNode(true);
                            movedButtons.appendChild(clone);
                            btn.style.display = 'none';
                        }
                    });
                    
                    // Если нашли кнопки - вставляем контейнер НАД оригинальным buttons
                    if (movedButtons.children.length > 0) {
                        buttons.parentNode.insertBefore(movedButtons, buttons);
                        console.log('MAXSM: Перемещено ' + movedButtons.children.length + ' кнопок над оригинальным контейнером');
                    } else {
                        // Отладочная информация если кнопки не найдены
                        console.log('MAXSM: Кнопки не найдены, проверяю содержимое...');
                        
                        var debugDiv = document.createElement('div');
                        debugDiv.innerHTML = '<div style="color:orange; padding:5px; background:#222; margin:5px 0; font-size:12px;">Отладка MAXSM - найденные кнопки:</div>';
                        
                        var allButtons = buttons.querySelectorAll('.full-start__button');
                        allButtons.forEach(function(btn, i) {
                            var text = btn.textContent.trim() || 'без текста';
                            var classes = btn.className || 'без классов';
                            var isVisible = btn.offsetParent !== null ? '✓' : '✗';
                            
                            var btnInfo = document.createElement('div');
                            btnInfo.style.cssText = 'color:#aaa; padding:2px 10px; font-size:11px; font-family:monospace;';
                            btnInfo.textContent = isVisible + ' ' + (i+1) + '. "' + text + '" - ' + classes;
                            debugDiv.appendChild(btnInfo);
                        });
                        
                        buttons.parentNode.insertBefore(debugDiv, buttons);
                    }
                    
                } catch(err) {
                    console.error('MAXSM: Ошибка', err);
                }
            }, 1000);
        }
    });
    
})();