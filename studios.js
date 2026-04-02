(function () {
    'use strict';
    
    console.log('Studio plugin loading...');
    
    // Функция получения студий из карточки
    function getStudioFromCard() {
        try {
            var activity = Lampa.Activity.active();
            if (!activity || !activity.activity) return null;
            
            var card = activity.activity.card;
            if (!card) return null;
            
            console.log('Card data:', card);
            
            // Ищем студии
            var studios = card.production_companies || card.networks || [];
            console.log('Found studios:', studios);
            
            // Ищем студию с логотипом
            var studio = null;
            for (var i = 0; i < studios.length; i++) {
                if (studios[i].logo_path) {
                    studio = studios[i];
                    break;
                }
            }
            
            return studio;
        } catch(e) {
            console.error('Error getting studio:', e);
            return null;
        }
    }
    
    // Создание кнопки студии
    function createStudioButton(studio, isTv) {
        var btn = document.createElement('div');
        btn.className = 'full-start__button selector';
        btn.style.cssText = 'display: inline-block; margin: 0 0.5em 0.5em 0; vertical-align: middle; height: 2.94em; padding: .3em; cursor: pointer;';
        
        var inner = document.createElement('div');
        inner.style.cssText = 'background-color: #fff; border-radius: .7em; display: flex; align-items: center; justify-content: center; padding: 0 1em; min-width: 3.5em; height: 100%;';
        
        var img = document.createElement('img');
        img.src = Lampa.TMDB.image('t/p/w154' + studio.logo_path);
        img.style.cssText = 'max-height: 1.5em; max-width: 4.5em; object-fit: contain; display: block;';
        img.alt = studio.name;
        
        img.onerror = function() {
            console.log('Logo failed to load');
            if (btn.parentNode) btn.parentNode.removeChild(btn);
        };
        
        inner.appendChild(img);
        btn.appendChild(inner);
        
        // Обработчик клика
        btn.onclick = function(e) {
            e.stopPropagation();
            
            var dateField = isTv ? 'first_air_date' : 'primary_release_date';
            var currentDate = new Date().toISOString().split('T')[0];
            
            Lampa.Select.show({
                title: studio.name,
                items: [
                    { title: 'Популярные', sort: 'popularity.desc' },
                    { title: 'Новые', sort: dateField + '.desc' }
                ],
                onSelect: function(item) {
                    var filter = {};
                    filter[isTv ? 'with_networks' : 'with_companies'] = studio.id;
                    
                    if (item.title === 'Новые') {
                        filter[dateField + '.lte'] = currentDate;
                        filter.vote_count = { gte: 10 };
                    }
                    
                    Lampa.Activity.push({
                        url: 'discover/' + (isTv ? 'tv' : 'movie'),
                        title: studio.name + ' ' + item.title,
                        component: 'category_full',
                        source: 'tmdb',
                        sort_by: item.sort,
                        filter: filter
                    });
                }
            });
        };
        
        return btn;
    }
    
    // Добавление надписи Studios
    function createStudiosLabel() {
        var label = document.createElement('span');
        label.textContent = 'Studios';
        label.style.cssText = 'display: inline-block; height: 2.94em; line-height: 2.94em; margin-left: 0.5em; padding-right: 1em; color: rgba(255,255,255,0.7); font-size: 1.1em; vertical-align: middle;';
        return label;
    }
    
    // Главная функция добавления
    function addStudioToContainer() {
        console.log('addStudioToContainer called');
        
        // Ищем контейнер
        var container = document.querySelector('.full-descr__tags');
        if (!container) {
            console.log('Container .full-descr__tags not found');
            return false;
        }
        
        // Получаем студию
        var studio = getStudioFromCard();
        if (!studio) {
            console.log('No studio with logo found');
            return false;
        }
        
        console.log('Adding studio:', studio.name);
        
        // Определяем тип (фильм или сериал)
        var activity = Lampa.Activity.active();
        var isTv = activity && activity.activity && activity.activity.method === 'tv';
        
        // Удаляем старые кнопки
        var oldButtons = container.querySelectorAll('.studio-plugin-btn, .studio-plugin-label');
        for (var i = 0; i < oldButtons.length; i++) {
            oldButtons[i].parentNode.removeChild(oldButtons[i]);
        }
        
        // Создаем новые элементы
        var btn = createStudioButton(studio, isTv);
        btn.classList.add('studio-plugin-btn');
        
        var label = createStudiosLabel();
        label.classList.add('studio-plugin-label');
        
        // Вставляем после platforms-static
        var platformsStatic = container.querySelector('.platforms-static');
        if (platformsStatic && platformsStatic.nextSibling) {
            container.insertBefore(btn, platformsStatic.nextSibling);
            container.insertBefore(label, btn.nextSibling);
        } else {
            container.appendChild(btn);
            container.appendChild(label);
        }
        
        console.log('Studio button added successfully!');
        return true;
    }
    
    // Следим за открытием карточки
    var lastCardId = null;
    
    function checkAndAdd() {
        var activity = Lampa.Activity.active();
        if (!activity || !activity.activity) return;
        
        var card = activity.activity.card;
        if (!card) return;
        
        var currentCardId = card.id;
        
        // Если новая карточка
        if (lastCardId !== currentCardId) {
            lastCardId = currentCardId;
            console.log('New card detected:', card.title || card.name);
            
            // Ждем загрузки интерфейса
            setTimeout(function() {
                addStudioToContainer();
            }, 1000);
            
            // Повторяем попытку через 2 секунды если не добавилось
            setTimeout(function() {
                addStudioToContainer();
            }, 2000);
        }
    }
    
    // Запуск слежения
    function init() {
        console.log('Studio plugin init');
        
        // Проверяем каждую секунду
        setInterval(checkAndAdd, 1000);
        
        // Также следим за событием full
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                console.log('Full event complite');
                setTimeout(function() {
                    addStudioToContainer();
                }, 1000);
            }
        });
    }
    
    // Старт
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                init();
            }
        });
    }
})();
