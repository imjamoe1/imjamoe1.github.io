(function () {
    'use strict';
    
    console.log('=== STUDIO PLUGIN DEBUG ===');
    
    // Функция для отображения отладочной информации
    function showDebugInfo(studio, container) {
        var debugDiv = document.createElement('div');
        debugDiv.style.cssText = 'background: yellow; color: black; padding: 10px; margin: 10px; font-size: 12px; z-index: 9999; position: relative;';
        debugDiv.innerHTML = '<b>DEBUG INFO:</b><br>' +
            'Studio found: ' + (studio ? studio.name : 'NO') + '<br>' +
            'Has logo: ' + (studio && studio.logo_path ? 'YES (' + studio.logo_path + ')' : 'NO') + '<br>' +
            'Container: ' + (container ? 'FOUND' : 'NOT FOUND');
        
        var tagsContainer = document.querySelector('.full-descr__tags');
        if (tagsContainer) {
            tagsContainer.insertBefore(debugDiv, tagsContainer.firstChild);
            
            // Удаляем через 5 секунд
            setTimeout(function() {
                if (debugDiv.parentNode) debugDiv.parentNode.removeChild(debugDiv);
            }, 5000);
        }
    }
    
    // Получаем все данные из карточки
    function dumpCardData() {
        try {
            var activity = Lampa.Activity.active();
            if (!activity || !activity.activity) {
                console.log('No active activity');
                return null;
            }
            
            var card = activity.activity.card;
            if (!card) {
                console.log('No card in activity');
                return null;
            }
            
            console.log('=== CARD DATA DUMP ===');
            console.log('Title:', card.title || card.name);
            console.log('Type:', activity.activity.method);
            console.log('production_companies:', card.production_companies);
            console.log('networks:', card.networks);
            console.log('All card keys:', Object.keys(card));
            
            // Проверяем разные возможные места хранения студий
            var possibleStudioFields = [
                'production_companies',
                'networks', 
                'studios',
                'production_companies_data',
                'studio'
            ];
            
            var found = false;
            for (var i = 0; i < possibleStudioFields.length; i++) {
                var field = possibleStudioFields[i];
                if (card[field] && card[field].length) {
                    console.log('Found studios in field "' + field + '":', card[field]);
                    found = true;
                }
            }
            
            if (!found) {
                console.log('No studios found in any known field');
                console.log('Full card object:', JSON.stringify(card, null, 2));
            }
            
            return card;
        } catch(e) {
            console.error('Error dumping card:', e);
            return null;
        }
    }
    
    // Создаем простую кнопку с любым текстом
    function addSimpleButton(text, color) {
        var container = document.querySelector('.full-descr__tags');
        if (!container) {
            console.log('Container not found');
            return false;
        }
        
        var btn = document.createElement('div');
        btn.textContent = text;
        btn.style.cssText = 'background: ' + color + '; color: white; padding: 5px 10px; margin: 5px; display: inline-block; border-radius: 5px; cursor: pointer;';
        btn.onclick = function() { 
            dumpCardData();
            alert('Check console (F12) for card data');
        };
        
        container.appendChild(btn);
        console.log('Added button:', text);
        return true;
    }
    
    // Главная функция
    function addDebugButtons() {
        console.log('Adding debug buttons...');
        
        var container = document.querySelector('.full-descr__tags');
        if (!container) {
            console.log('Container .full-descr__tags not found');
            return;
        }
        
        // Удаляем старые кнопки
        var oldBtns = container.querySelectorAll('.debug-btn');
        for (var i = 0; i < oldBtns.length; i++) {
            oldBtns[i].parentNode.removeChild(oldBtns[i]);
        }
        
        // Добавляем кнопки
        addSimpleButton('🔍 SHOW CARD DATA', '#3498db');
        addSimpleButton('📀 TEST STUDIO (рабочая)', '#2ecc71');
        
        // Автоматически показываем данные карточки
        setTimeout(function() {
            dumpCardData();
        }, 500);
    }
    
    // Следим за карточкой
    var lastCardId = null;
    
    function checkCard() {
        var activity = Lampa.Activity.active();
        if (!activity || !activity.activity) return;
        
        var card = activity.activity.card;
        if (!card) return;
        
        var currentId = card.id;
        if (lastCardId !== currentId) {
            lastCardId = currentId;
            console.log('New card opened, ID:', currentId);
            
            setTimeout(function() {
                addDebugButtons();
            }, 1000);
        }
    }
    
    // Запуск
    setInterval(checkCard, 1000);
    
    Lampa.Listener.follow('full', function(e) {
        if (e.type === 'complite') {
            setTimeout(addDebugButtons, 1000);
        }
    });
    
    console.log('Debug plugin loaded - look for colored buttons near "Studios"');
})();
