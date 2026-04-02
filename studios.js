(function () {
    'use strict';

    var network = new Lampa.Reguest();
    var cache = new Map();
    var studiosCache = new Map();
    var pluginInitialized = false;
    var currentCardId = null;
    var activeIntervals = new Map();

    function getMovieProviders(movie, callback) {
        var cacheKey = 'providers_' + movie.id;
        if (cache.has(cacheKey)) {
            return callback(cache.get(cacheKey));
        }

        var url = Lampa.TMDB.api('movie/' + movie.id + '/watch/providers');
        network.silent(url, 
            function (data) {
                var providers = [];
                var allowedCountryCodes = ['US', 'RU'];

                allowedCountryCodes.forEach(function(countryCode) {
                    if (data.results && data.results[countryCode]) {
                        providers.push.apply(providers, data.results[countryCode].flatrate || []);
                        providers.push.apply(providers, data.results[countryCode].rent || []);
                        providers.push.apply(providers, data.results[countryCode].buy || []);
                    }
                });

                var filteredProviders = providers.filter(function(p) { return p.logo_path; });
                cache.set(cacheKey, filteredProviders);
                callback(filteredProviders);
            },
            function (error) {
                console.error('Provider fetch error:', error);
                callback([]);
            }
        );
    }

    function getNetworks(object, callback) {
        if (!object || !object.card) {
            return callback([]);
        }

        var cardId = object.card.id;
        
        if (studiosCache.has(cardId)) {
            return callback(studiosCache.get(cardId));
        }

        var studios = [];

        if (object.card.networks && object.card.networks.length) {
            studios = object.card.networks;
        } 
        else if (object.card.production_companies && object.card.production_companies.length) {
            studios = object.card.production_companies.filter(function(studio) { return studio.logo_path; });
        }

        studiosCache.set(cardId, studios);
        callback(studios);
    }

    function showNetworkMenu(network, type, element) {
        var isTv = type === 'tv';
        var controller = Lampa.Controller.enabled().name;
        var dateField = isTv ? 'first_air_date' : 'primary_release_date';
        var currentDate = new Date().toISOString().split('T')[0];

        Lampa.Select.show({
            title: network.name || 'Network',
            items: [
                { title: 'Популярные', sort: '', filter: { 'vote_count.gte': 10 } },
                { title: 'Новые', sort: dateField + '.desc', filter: { 'vote_count.gte': 10, 'vote_count.lte': currentDate } }
            ],
            onBack: function() {
                Lampa.Controller.toggle(controller);
                if (element) {
                    Lampa.Controller.collectionFocus(element, Lampa.Activity.active().activity.render());
                }
            },
            onSelect: function(action) {
                var filter = {};
                filter[isTv ? 'with_networks' : 'with_companies'] = network.id;
                
                for (var key in action.filter) {
                    if (action.filter.hasOwnProperty(key)) {
                        filter[key] = action.filter[key];
                    }
                }
                
                Lampa.Activity.push({
                    url: 'discover/' + type,
                    title: (network.name || 'Network') + ' ' + action.title,
                    component: 'category_full',
                    source: 'tmdb',
                    card_type: true,
                    page: 1,
                    sort_by: action.sort,
                    filter: filter
                });
            }
        });
    }

    function createStudioButton(network, type, cardId) {
        var imgSrc = Lampa.TMDB.image('t/p/w154' + network.logo_path);
        var imgAlt = (network.name || '').replace(/"/g, '&quot;');

        var btn = document.createElement('div');
        btn.className = 'full-start__button selector button--network';
        btn.setAttribute('data-card-id', cardId);
        btn.setAttribute('data-studio-id', network.id);
        btn.style.cssText = 'display: inline-block; margin: 0 0.5em 0.5em 0; vertical-align: middle; height: 2.94em; padding: .3em; position: relative; background: none; border: none;';
        
        var innerDiv = document.createElement('div');
        innerDiv.className = 'network-innie';
        innerDiv.style.cssText = 'background-color: #fff; width: 100%; height: 100%; border-radius: .7em; display: flex; align-items: center; justify-content: center; padding: 0 1em; min-width: 3.5em;';
        
        var img = document.createElement('img');
        img.src = imgSrc;
        img.alt = imgAlt;
        img.style.cssText = 'height: 100%; max-height: 1.5em; max-width: 4.5em; object-fit: contain; display: block; border-radius: 0;';
        
        img.onerror = function() {
            if (btn.parentNode) {
                btn.parentNode.removeChild(btn);
            }
        };
        
        innerDiv.appendChild(img);
        btn.appendChild(innerDiv);
        
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showNetworkMenu(network, type, this);
        });
        
        return btn;
    }

    function addButtonToNetworksContainer(render, btn, cardId) {
        if (!render || !btn) return false;
        
        var networksContainer = render.querySelector('.tmdb-networks');
        if (!networksContainer) return false;
        
        var tagsContainer = networksContainer.querySelector('.full-descr__tags');
        if (!tagsContainer) return false;
        
        var oldButtons = tagsContainer.querySelectorAll('.button--network[data-card-id="' + cardId + '"]');
        for (var i = 0; i < oldButtons.length; i++) {
            oldButtons[i].parentNode.removeChild(oldButtons[i]);
        }
        
        var oldStudios = tagsContainer.querySelectorAll('.studios-static');
        for (var i = 0; i < oldStudios.length; i++) {
            oldStudios[i].parentNode.removeChild(oldStudios[i]);
        }
        
        var platformsStatic = tagsContainer.querySelector('.platforms-static');
        
        if (platformsStatic) {
            tagsContainer.insertBefore(btn, platformsStatic.nextSibling);
        } else {
            tagsContainer.appendChild(btn);
        }
        
        var studiosStatic = document.createElement('div');
        studiosStatic.className = 'studios-static';
        studiosStatic.style.cssText = 'display: inline-block; height: 2.94em; border-radius: 0.6em; padding: 0 0.3em; margin-left: -0.2em; vertical-align: middle; line-height: 2.94em;';
        
        var studiosText = document.createElement('span');
        studiosText.className = 'studios-static__text';
        studiosText.textContent = 'Studios';
        studiosText.style.cssText = 'font-size: 1.2em; font-weight: 400; padding-right: 2em; color: rgba(255, 255, 255, 0.7);';
        
        studiosStatic.appendChild(studiosText);
        
        if (btn.nextSibling) {
            tagsContainer.insertBefore(studiosStatic, btn.nextSibling);
        } else {
            tagsContainer.appendChild(studiosStatic);
        }
        
        return true;
    }

    function addNetworkButton(render, networks, type, cardId) {
        if (!networks || !networks.length || !networks[0] || !networks[0].logo_path) return;
        
        if (activeIntervals.has(cardId)) {
            clearInterval(activeIntervals.get(cardId));
            activeIntervals.delete(cardId);
        }
        
        var network = networks[0];
        var btn = createStudioButton(network, type, cardId);
        
        var attempts = 0;
        var maxAttempts = 50;
        
        var interval = setInterval(function() {
            attempts++;
            
            if (addButtonToNetworksContainer(render, btn, cardId)) {
                clearInterval(interval);
                activeIntervals.delete(cardId);
                console.log('Studio button added successfully for card:', cardId);
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                activeIntervals.delete(cardId);
                console.warn('Failed to add studio button for card:', cardId);
            }
        }, 100);
        
        activeIntervals.set(cardId, interval);
    }

    function addOriginalTitle(card, render) {
        if (!card || !render) return;
        
        var titleElement = render.querySelector('.full-start-new__title');
        if (!titleElement) return;
        
        var originalTitle = card.original_title || card.original_name;
        if (originalTitle && originalTitle !== card.title && originalTitle !== card.name) {
            var existingOriginal = titleElement.querySelector('.original-title');
            if (existingOriginal) {
                existingOriginal.parentNode.removeChild(existingOriginal);
            }
            
            var originalDiv = document.createElement('div');
            originalDiv.className = 'original-title';
            originalDiv.textContent = originalTitle;
            originalDiv.style.cssText = 'font-size: 0.8em; color: rgba(255, 255, 255, 0.7); font-weight: normal; margin-top: 0.2em;';
            titleElement.appendChild(originalDiv);
        }
    }

    function cleanup(render) {
        if (!render) return;
        
        var buttons = render.querySelectorAll('.button--network, .studios-static');
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].parentNode) {
                buttons[i].parentNode.removeChild(buttons[i]);
            }
        }
    }

    function initPlugin() {
        if (pluginInitialized) return;
        pluginInitialized = true;
        
        console.log('Studio plugin initializing...');

        if (!document.querySelector('#network-plugin-fixed')) {
            var style = document.createElement('style');
            style.id = 'network-plugin-fixed';
            style.textContent = '\n' +
                '.tmdb-networks .full-descr__tags .button--network,\n' +
                '.full-descr__tags .button--network {\n' +
                '    display: inline-block !important;\n' +
                '    margin: 0 0.5em 0.5em 0 !important;\n' +
                '    vertical-align: middle !important;\n' +
                '    height: 2.94em !important;\n' +
                '    padding: .3em !important;\n' +
                '    position: relative !important;\n' +
                '    background: none !important;\n' +
                '    border: none !important;\n' +
                '    visibility: visible !important;\n' +
                '    opacity: 1 !important;\n' +
                '    cursor: pointer !important;\n' +
                '}\n' +
                '\n' +
                '.tmdb-networks .full-descr__tags .button--network .network-innie,\n' +
                '.full-descr__tags .button--network .network-innie {\n' +
                '    background-color: #fff !important;\n' +
                '    width: 100% !important;\n' +
                '    height: 100% !important;\n' +
                '    border-radius: .7em !important;\n' +
                '    display: flex !important;\n' +
                '    align-items: center !important;\n' +
                '    justify-content: center !important;\n' +
                '    padding: 0 1em !important;\n' +
                '    min-width: 3.5em !important;\n' +
                '    visibility: visible !important;\n' +
                '    opacity: 1 !important;\n' +
                '}\n' +
                '\n' +
                '.tmdb-networks .full-descr__tags .button--network img,\n' +
                '.full-descr__tags .button--network img {\n' +
                '    height: 100% !important;\n' +
                '    max-height: 1.5em !important;\n' +
                '    max-width: 4.5em !important;\n' +
                '    object-fit: contain !important;\n' +
                '    display: block !important;\n' +
                '    visibility: visible !important;\n' +
                '    opacity: 1 !important;\n' +
                '}\n' +
                '\n' +
                '.full-start-new__title {\n' +
                '    position: relative;\n' +
                '    margin-bottom: 0.6em !important;\n' +
                '}\n' +
                '\n' +
                '.full--tagline {\n' +
                '    margin-bottom: 0.6em !important;\n' +
                '}\n' +
                '\n' +
                '.full-descr__tags .button--network.focus {\n' +
                '    box-shadow: 0 0 0 0.1em rgb(255, 255, 255);\n' +
                '}\n' +
                '\n' +
                '.full-start-new__buttons .button--network {\n' +
                '    display: none !important;\n' +
                '}\n';
            document.head.appendChild(style);
        }

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity ? e.object.activity.render() : null;
                var card = e.object.card;
                var cardId = card ? (card.id || 'unknown') : 'unknown';
                
                if (!render || !card) return;
                
                currentCardId = cardId;
                addOriginalTitle(card, render);
                
                setTimeout(function() {
                    getNetworks(e.object, function(networks) {
                        if (networks && networks.length) {
                            addNetworkButton(render, networks, e.object.method, cardId);
                        }
                    });
                }, 300);
            }
            
            if (e.type === 'destroy') {
                var render = e.object && e.object.activity ? e.object.activity.render() : null;
                if (render) {
                    cleanup(render);
                }
                
                if (currentCardId && activeIntervals.has(currentCardId)) {
                    clearInterval(activeIntervals.get(currentCardId));
                    activeIntervals.delete(currentCardId);
                }
                currentCardId = null;
            }
        });
        
        console.log('Studio plugin initialized successfully');
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
