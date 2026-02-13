(function () {
    'use strict';

    var network = new Lampa.Reguest();
    var cache = new Map();
    var studiosCache = new Map();
    var pluginInitialized = false;
    var currentCardId = null;

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

                allowedCountryCodes.forEach(countryCode => {
                    if (data.results?.[countryCode]) {
                        providers.push(
                            ...(data.results[countryCode].flatrate || []),
                            ...(data.results[countryCode].rent || []),
                            ...(data.results[countryCode].buy || [])
                        );
                    }
                });

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

    // Получение сетей или студий с кэшированием
    function getNetworks(object, callback) {
        if (!object?.card) {
            return callback([]);
        }

        const cardId = object.card.id;
        
        if (studiosCache.has(cardId)) {
            return callback(studiosCache.get(cardId));
        }

        let studios = [];

        if (object.card.networks?.length) {
            studios = object.card.networks;
        } 
        else if (object.card.production_companies?.length) {
            studios = object.card.production_companies.filter(studio => studio.logo_path);
        }

        studiosCache.set(cardId, studios);
        callback(studios);
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

    // Создание кнопки студии - С ПРИНУДИТЕЛЬНЫМИ СТИЛЯМИ
    function createStudioButton(network, type, cardId) {
        const imgSrc = Lampa.TMDB.image(`t/p/w154${network.logo_path}`);
        const imgAlt = (network.name || '').replace(/"/g, '"');

        const btn = $('<div>')
            .addClass('full-start__button selector button--network')
            .attr('data-card-id', cardId)
            .attr('data-studio-id', network.id)
            .css({
                'display': 'inline-block !important',
                'margin': '0 0.5em 0.5em 0 !important',
                'vertical-align': 'middle !important',
                'height': '2.94em !important',
                'padding': '.3em !important',
                'position': 'relative !important',
                'background': 'none !important',
                'border': 'none !important'
            })
            .append(
                $('<div>')
                    .addClass('network-innie')
                    .css({
                        'background-color': '#fff !important',
                        'width': '100% !important',
                        'height': '100% !important',
                        'border-radius': '.7em !important',
                        'display': 'flex !important',
                        'align-items': 'center !important',
                        'justify-content': 'center !important',
                        'padding': '0 1em !important',
                        'min-width': '3.5em !important'
                    })
                    .append(
                        $('<img>')
                            .attr('src', imgSrc)
                            .attr('alt', imgAlt)
                            .css({
                                'height': '100% !important',
                                'max-height': '1.5em !important',
                                'max-width': '4.5em !important',
                                'object-fit': 'contain !important',
                                'display': 'block !important',
                                'border-radius': '0 !important'
                            })
                            .on('error', function() {
                                $(this).parent().parent().remove();
                            })
                    )
            )
            .on('hover:enter', function() {
                showNetworkMenu(network, type, this);
            });

        return btn;
    }

    // Функция для добавления кнопки в tmdb-networks
    function addButtonToNetworksContainer(render, btn, cardId) {
        if (!render || !btn) return false;
        
        const networksContainer = $('.tmdb-networks', render);
        if (!networksContainer.length) return false;
        
        const tagsContainer = networksContainer.find('.full-descr__tags');
        if (!tagsContainer.length) return false;
        
        // Удаляем старые элементы
        tagsContainer.find(`.button--network[data-card-id="${cardId}"]`).remove();
        tagsContainer.find('.studios-static').remove();
        
        // Находим platforms-static
        const platformsStatic = tagsContainer.find('.platforms-static');
        
        if (platformsStatic.length) {
            btn.insertAfter(platformsStatic);
        } else {
            tagsContainer.append(btn);
        }
        
        // Добавляем надпись Studios
        const studiosStatic = $('<div class="studios-static">' +
            '<span class="studios-static__text">Studios</span>' +
        '</div>').css({
            'display': 'inline-block !important',
            'height': '2.94em !important',
            'border-radius': '0.6em !important',
            'padding': '0 0.3em !important',
            'margin-left': '0.3em !important',
            'vertical-align': 'middle !important',
            'line-height': '2.94em !important'
        });
        
        btn.after(studiosStatic);
        
        return true;
    }

    // Добавление кнопки студии
    function addNetworkButton(render, networks, type, cardId) {
        if (!networks?.length || !networks[0]?.logo_path) return;

        if ($(`.button--network[data-card-id="${cardId}"]`, render).length) return;

        const network = networks[0];
        const btn = createStudioButton(network, type, cardId);

        let attempts = 0;
        const maxAttempts = 30;
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (addButtonToNetworksContainer(render, btn, cardId)) {
                clearInterval(checkInterval);
                console.log('Studio button added');
                
                // ПРИНУДИТЕЛЬНО ПРИМЕНЯЕМ СТИЛИ
                setTimeout(() => {
                    const addedBtn = $(`.button--network[data-card-id="${cardId}"]`, render);
                    addedBtn.css({
                        'display': 'inline-block !important',
                        'visibility': 'visible !important',
                        'opacity': '1 !important'
                    });
                    addedBtn.find('.network-innie').css({
                        'background-color': '#fff !important',
                        'visibility': 'visible !important',
                        'opacity': '1 !important'
                    });
                    addedBtn.find('img').css({
                        'visibility': 'visible !important',
                        'opacity': '1 !important'
                    });
                }, 50);
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
            }
        }, 100);
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
        
        console.log('Studio plugin initializing...');

        //СТИЛИ CSS
        if ($('style#network-plugin-fixed').length === 0) {
            $('<style>')
                .attr('id', 'network-plugin-fixed')
                .html(`
                    .tmdb-networks .full-descr__tags .button--network,
                    .full-descr__tags .button--network {
                        display: inline-block !important;
                        margin: 0 0.5em 0.5em 0 !important;
                        vertical-align: middle !important;
                        height: 2.94em !important;
                        padding: .3em !important;
                        position: relative !important;
                        background: none !important;
                        border: none !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    
                    .tmdb-networks .full-descr__tags .button--network .network-innie,
                    .full-descr__tags .button--network .network-innie {
                        background-color: #fff !important;
                        width: 100% !important;
                        height: 100% !important;
                        border-radius: .7em !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        padding: 0 1em !important;
                        min-width: 3.5em !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    
                    .tmdb-networks .full-descr__tags .button--network img,
                    .full-descr__tags .button--network img {
                        height: 100% !important;
                        max-height: 1.5em !important;
                        max-width: 4.5em !important;
                        object-fit: contain !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
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
                        top: 0.5em !important;
                        margin: 0 0.5em 0.5em 0 !important;
                    }
                    
                    /* Стили для надписи Studios */
                    .studios-static {
                        display: inline-block !important;
                        height: 2.94em !important;
                        border-radius: 0.6em !important;
                        padding: 0 0.3em !important;
                        margin-left: 0.3em !important;
                        margin-top: 1em !important;
                        vertical-align: middle !important;
                        line-height: 2.94em !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    
                    .studios-static__text {
                        font-size: 1.2em !important;
                        font-weight: 400 !important;
                        color: rgba(255, 255, 255, 0.9) !important;
                    }
                    
                    /* Скрываем кнопки в неправильном месте */
                    .full-start-new__buttons .button--network {
                        display: none !important;
                    }
                `)
                .appendTo('head');
        }

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                const render = e.object.activity.render();
                const card = e.object.card;
                const cardId = card?.id || 'unknown';
                
                if (!render || !card) return;

                addOriginalTitle(card, render);

                setTimeout(() => {
                    getNetworks(e.object, networks => {
                        if (networks.length) {
                            addNetworkButton(render, networks, e.object.method, cardId);
                        }
                    });
                }, 500);
            }
            
            if (e.type === 'destroy') {
                const render = e.object?.activity?.render();
                if (render) {
                    $('.button--network, .studios-static', render).remove();
                }
                currentCardId = null;
            }
        });
        
        console.log('Studio plugin initialized - FORCED VISIBLE STYLES');
    }

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

