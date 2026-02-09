(function () {
    'use strict';

    var network = new Lampa.Reguest();
    var cache = new Map();
    var pluginInitialized = false;

    // Получение провайдеров (по странам) с логотипами
    function getMovieProviders(movie, callback) {
        const cacheKey = `providers_${movie.id}`;
        if (cache.has(cacheKey)) {
            return callback(cache.get(cacheKey));
        }

        const url = Lampa.TMDB.api(`movie/${movie.id}/watch/providers`);
        network.silent(url, 
            function (data) {
                const providers = [];
                const allowedCountryCodes = ['US', 'RU'];

                // Добавление доступных провайдеров
                allowedCountryCodes.forEach(countryCode => {
                    if (data.results?.[countryCode]) {
                        providers.push(
                            ...(data.results[countryCode].flatrate || []),
                            ...(data.results[countryCode].rent || []),
                            ...(data.results[countryCode].buy || [])
                        );
                    }
                });

                // Фильтрация по наличию логотипа
                const filteredProviders = providers.filter(p => p.logo_path);
                cache.set(cacheKey, filteredProviders);
                callback(filteredProviders);
            },
            function (error) {
                console.error('Provider fetch error:', error);
                callback([]);
            }
        );
    }

    // Получение сетей или студий (в зависимости от типа карточки)
    function getNetworks(object, callback) {
        if (!object?.card) {
            return callback([]);
        }

        if (object.card.networks?.length) {
            return callback(object.card.networks);
        }
        if (object.card.production_companies?.length) {
            return callback(object.card.production_companies);
        }

        getMovieProviders(object.card, callback);
    }

    // Меню фильтрации по студии/сети
    function showNetworkMenu(network, type, element) {
        const isTv = type === 'tv';
        const controller = Lampa.Controller.enabled().name;
        const dateField = isTv ? 'first_air_date' : 'primary_release_date';
        const currentDate = new Date().toISOString().split('T')[0];

        Lampa.Select.show({
            title: network.name || 'Network',
            items: [
                { title: 'Популярные', sort: '', filter: { 'vote_count.gte': 10 } },
                { title: 'Новые', sort: `${dateField}.desc`, filter: { 'vote_count.gte': 10, [`${dateField}.lte`]: currentDate } }
            ],
            onBack: function() {
                Lampa.Controller.toggle(controller);
                if (element) {
                    Lampa.Controller.collectionFocus(element, Lampa.Activity.active().activity.render());
                }
            },
            onSelect: function(action) {
                // Переход к фильтрованной категории
                Lampa.Activity.push({
                    url: `discover/${type}`,
                    title: `${network.name || 'Network'} ${action.title}`,
                    component: 'category_full',
                    source: 'tmdb',
                    card_type: true,
                    page: 1,
                    sort_by: action.sort,
                    filter: {
                        [isTv ? 'with_networks' : 'with_companies']: network.id,
                        ...action.filter
                    }
                });
            }
        });
    }

    // Функция для перемещения кнопки в правильный контейнер
    function moveButtonToNetworksContainer(render) {
        if (!render) return false;
        
        const studioButton = $('.button--network', render);
        const networksContainer = $('.tmdb-networks', render);
        
        if (studioButton.length && networksContainer.length) {
            // Находим контейнер с логотипами платформ
            const platformsContainer = networksContainer.find('.full-descr__tags');
            
            if (platformsContainer.length) {
                // Проверяем, не находится ли уже кнопка в правильном месте
                if (!studioButton.closest('.full-descr__tags').length) {
                    // Удаляем старую надпись Studios, если она уже существует
                    platformsContainer.find('.studios-static').remove();
                    
                    // Создаем элемент с надписью Studios
                    const studiosStatic = $('<div class="studios-static">' +
                        '<span class="studios-static__text">Studios</span>' +
                    '</div>');
                    
                    // Добавляем кнопку и надпись в контейнер с платформами
                    const platformsStatic = platformsContainer.find('.platforms-static');
                    if (platformsStatic.length) {
                        // Добавляем логотип студии после платформ, а надпись Studios после логотипа
                        studioButton.insertAfter(platformsStatic);
                        studiosStatic.insertAfter(studioButton);
                    } else {
                        // Добавляем сначала логотип, потом надпись Studios
                        platformsContainer.prepend(studioButton);
                        studioButton.after(studiosStatic);
                    }
                    
                    console.log('Studio button moved to platforms container with Studios label after logo');
                    return true;
                } else {
                    // Если кнопка уже на месте, но нет надписи Studios - добавляем ее
                    if (!platformsContainer.find('.studios-static').length) {
                        const studiosStatic = $('<div class="studios-static">' +
                            '<span class="studios-static__text">Studios</span>' +
                        '</div>');
                        
                        studioButton.after(studiosStatic);
                        console.log('Added Studios label to existing studio button');
                    }
                }
            }
        }
        return false;
    }

    // Добавление кнопки студии/сети в карточку
    function addNetworkButton(render, networks, type) {
        $('.button--network, .button--studio', render).remove();

        if (!networks?.length || !networks[0]?.logo_path) return;

        const network = networks[0];
        const imgSrc = Lampa.TMDB.image(`t/p/w154${network.logo_path}`);
        const imgAlt = (network.name || '').replace(/"/g, '"');

        const btn = $('<div>')
            .addClass('full-start__button selector button--network')
            .append(
                $('<div>')
                    .addClass('network-innie')
                    .append(
                        $('<img>')
                            .attr('src', imgSrc)
                            .attr('alt', imgAlt)
                            .on('error', function() {
                                $(this).parent().parent().remove();
                            })
                    )
            )
            .on('hover:enter', function() {
                showNetworkMenu(network, type, this);
            });

        // Сначала добавляем кнопку в стандартное место
        $('.full-start-new__buttons', render).append(btn);
        
        // Пытаемся переместить ее сразу
        if (!moveButtonToNetworksContainer(render)) {
            // Если не удалось, запускаем проверку через небольшой таймаут
            let checkCount = 0;
            const maxChecks = 10;
            const checkInterval = setInterval(() => {
                if (moveButtonToNetworksContainer(render) || checkCount >= maxChecks) {
                    clearInterval(checkInterval);
                }
                checkCount++;
            }, 500);
        }
    }

    // Добавление оригинального названия
    function addOriginalTitle(card, render) {
        if (!card || !render) return;
        
        const titleElement = $('.full-start-new__title', render);
        if (!titleElement.length) return;
        
        const originalTitle = card.original_title || card.original_name;
        if (originalTitle && originalTitle !== card.title && originalTitle !== card.name) {
            titleElement.find('.original-title').remove();
            $('<div>')
                .addClass('original-title')
                .text(originalTitle)
                .appendTo(titleElement);
        }
    }

    // Инициализация плагина
    function initPlugin() {
        if (pluginInitialized) return;
        pluginInitialized = true;
        
        console.log('Network plugin initializing...');

        // Добавление CSS-стилей (однократно)
        if ($('style#network-plugin').length === 0) {
            $('<style>')
                .attr('id', 'network-plugin')
                .html(`
                    .button--network, .button--studio { 
                        position: relative !important;
                        top: 1em !important;
                        padding: .3em;
                        display: inline-block !important;
                        margin-right: 0.5em !important;
                        margin-bottom: 0.5em !important;
                        vertical-align: middle !important;
                    }
                    
                    .network-innie {
                        background-color: #fff;
                        width: 100%;
                        height: 100%;
                        border-radius: .7em;
                        display: flex;
                        align-items: center;
                        padding: 0 1em;
                    }
                    
                    .button--network img,
                    .button--studio img {
                        height: 100%;
                        max-height: 1.5em;
                        max-width: 4.5em;
                        object-fit: contain;
                    }

                    .full-start-new__title {
                        position: relative;
                        margin-bottom: 0.6em !important;
                    }
                    
                    .full--tagline {
                        margin-bottom: 0.6em !important;
                    }

                    .original-title {
                        font-size: 0.8em;
                        color: rgba(255, 255, 255, 0.7);
                        font-weight: normal;
                        margin-top: 0.2em;
                    }
                    
                    /* Стили для кнопки в контейнере с платформами */
                    .full-descr__tags .button--network {
                        position: relative !important;
                        top: 0.5em !important;
                        margin: 0 0.5em 0.5em 0 !important;
                        vertical-align: top !important;
                    }
                    
                    /* Дополнительное выравнивание для логотипа внутри */
                    .full-descr__tags .button--network .network-innie {
                        align-items: center !important;
                        justify-content: center !important;
                        height: 2.2em !important;
                        min-width: 3.5em !important;
                    }
                    
                    .full-descr__tags .button--network img {
                        max-height: 1.3em !important;
                        max-width: 3.5em !important;
                    }
                    
                    /* Стили для надписи Studios */
                    .studios-static {
                        position: relative !important;
                        display: inline-block !important;
                        height: 2.94em !important;
                        border-radius: 0.6em !important;
                        margin-left: 0.3em !important;
                        padding: 0 0.3em !important;
                        top: 0.5em !important; 
                        vertical-align: middle !important;
                        line-height: 2.94em !important;
                    } 
                    
                    .studios-static__text { 
                        font-size: 1.2em !important;
                        font-weight: 600 !important;
                        color: rgba(255, 255, 255, 0.9) !important;
                    } 
                    
                    /* Для совместимости с другими элементами */
                    .full-descr__tags .studios-static {
                        margin-left: 0 !important;
                        margin-right: 0.5em !important;
                    }
                `)
                .appendTo('head');
        }

        // Глобальная проверка для уже открытых карточек
        let globalCheckCount = 0;
        const globalCheckInterval = setInterval(() => {
            const activeActivity = Lampa.Activity.active();
            if (activeActivity && activeActivity.activity && activeActivity.activity.render()) {
                moveButtonToNetworksContainer(activeActivity.activity.render());
            }
            globalCheckCount++;
            if (globalCheckCount > 10) { // Останавливаем через 10 секунд
                clearInterval(globalCheckInterval);
            }
        }, 1000);

        // Слушаем событие открытия карточки
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                const render = e.object.activity.render();
                const card = e.object.card;
                
                if (!render || !card) return;

                // Добавление оригинального названия
                addOriginalTitle(card, render);

                // Добавление кнопки студии или телесети
                getNetworks(e.object, networks => {
                    if (networks.length) {
                        addNetworkButton(render, networks, e.object.method);
                    }
                });
            }
        });
        
        console.log('Network plugin initialized');
    }

    // Инициализация при готовности приложения
    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                initPlugin();
            }
        });
    }
})();
