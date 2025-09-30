// Плагин KUV studios для Lampa.

// Добавляет кнопку студии/телесети (источник — TMDb) в карточку.
// Добавляет оригинальное название второй строкой в карточку.
// Добавляет логотип фильма/сериала (источник — TMDb) в карточку в портретном режиме.
// Подходит как для отдельного использования, так и в комплексе с kuv-style.

// Частично основано на плагине tmdb-networks v2.0.3 от levende (https://t.me/levende)
// https://levende.github.io/lampa-plugins/tmdb-networks.js

(function () {
    'use strict';

    var network = new Lampa.Reguest();
    var cache = {
        data: new Map(),
        ttl: 3600000, // 1 час в миллисекундах
        set: function(key, value) {
            this.data.set(key, {
                value: value,
                timestamp: Date.now()
            });
        },
        get: function(key) {
            var item = this.data.get(key);
            if (item && Date.now() - item.timestamp < this.ttl) {
                return item.value;
            }
            this.data.delete(key);
            return null;
        }
    };

    // Функция для проверки типа интерфейса
    function isNewInterface(render) {
        return $('.full-start-new', render).length > 0;
    }

    function getMovieProviders(movie, callback) {
        var cacheKey = 'providers_' + movie.id;
        var cachedData = cache.get(cacheKey);
        if (cachedData) {
            return callback(cachedData);
        }

        var url = Lampa.TMDB.api('movie/' + movie.id + '/watch/providers');
        network.silent(url, 
            function(data) {
                var providers = [];
                var allowedCountryCodes = ['US', 'RU'];

                allowedCountryCodes.forEach(function(countryCode) {
                    var countryData = data.results && data.results[countryCode];
                    if (countryData) {
                        if (countryData.flatrate) providers = providers.concat(countryData.flatrate);
                        if (countryData.rent) providers = providers.concat(countryData.rent);
                        if (countryData.buy) providers = providers.concat(countryData.buy);
                    }
                });

                var filteredProviders = providers.filter(function(p) {
                    return p.logo_path;
                });
                cache.set(cacheKey, filteredProviders);
                callback(filteredProviders);
            },
            function() {
                callback([]);
            }
        );
    }

    function getNetworks(object, callback) {
        if (!object || !object.card || object.card.source !== 'tmdb') {
            return callback([]);
        }

        if (object.card.networks && object.card.networks.length) {
            return callback(object.card.networks);
        }
        if (object.card.production_companies && object.card.production_companies.length) {
            return callback(object.card.production_companies);
        }

        getMovieProviders(object.card, callback);
    }

    function showNetworkMenu(network, type, element) {
        var isTv = type === 'tv';
        var controller = Lampa.Controller.enabled().name;
        var dateField = isTv ? 'first_air_date' : 'primary_release_date';
        var currentDate = new Date().toISOString().split('T')[0];

        var menuItems = [
            { 
                title: 'Популярные', 
                sort: '', 
                filter: { 'vote_count.gte': 10 } 
            },
            { 
                title: 'Новые', 
                sort: dateField + '.desc', 
                filter: { 
                    'vote_count.gte': 10
                } 
            }
        ];
        // Добавляем дату динамически для избежания проблем с ES5
        menuItems[1].filter[dateField + '.lte'] = currentDate;

        Lampa.Select.show({
            title: network.name || 'Network',
            items: menuItems,
            onBack: function() {
                Lampa.Controller.toggle(controller);
                if (element) {
                    Lampa.Controller.collectionFocus(
                        element, 
                        Lampa.Activity.active().activity.render()
                    );
                }
            },
            onSelect: function(action) {
                var filter = { 'vote_count.gte': action.filter['vote_count.gte'] };
                filter[isTv ? 'with_networks' : 'with_companies'] = network.id;
                if (action.filter[dateField + '.lte']) {
                    filter[dateField + '.lte'] = action.filter[dateField + '.lte'];
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

    function addNetworkButton(render, networks, type) {
        $('.button--network, .button--studio', render).remove();

        if (!networks || !networks.length || !networks[0] || !networks[0].logo_path) return;

        var network = networks[0];
        var imgSrc = Lampa.TMDB.image('t/p/w154' + network.logo_path);
        var imgAlt = (network.name || '').replace(/"/g, '"');

        var $networkButton = $('<div>')
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
            );

        $networkButton.on('hover:enter', function() {
            showNetworkMenu(network, type, this);
        });

        // Добавляем кнопку в зависимости от интерфейса
        if (isNewInterface(render)) {
            $('.full-start-new__buttons', render).append($networkButton);
        } else {
            $('.full-start__buttons', render).append($networkButton);
        }
    }

    function addOriginalTitle(render, card) {
        var $titleElement = isNewInterface(render) 
            ? $('.full-start-new__title', render) 
            : $('.full-start__title', render);
            
        if (!$titleElement.length || !card) return;

        var originalTitle = card.original_title || card.original_name;
        var currentTitle = card.title || card.name;

        if (originalTitle && originalTitle !== currentTitle) {
            $titleElement.find('.original-title').remove();
            $('<div>')
                .addClass('original-title')
                .text(originalTitle)
                .appendTo($titleElement);
        }
    }

    // Функция для применения логотипа к карточке
    function applyLogo(render, $poster, logoPath) {
        var isNew = isNewInterface(render);
        var $titleElement = isNew 
            ? $('.full-start-new__title', render) 
            : $('.full-start__title', render);
        
        // Удаляем старый логотип если есть
        $('.logo-container').remove();
        
        // Находим именно название (первый текстовый узел)
        $titleElement.contents().filter(function() {
            return this.nodeType === 3;
        }).wrap('<span class="title-text"></span>');
        
        // Скрываем только обёрнутый текст
        $('.title-text', $titleElement).hide();
        
        $poster.css('position', 'relative');

        var $container = $('<div>')
            .addClass('logo-container')
            .css({
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: '999'
            });

        $('<img>')
            .attr('src', Lampa.TMDB.image('/t/p/w300' + logoPath))
            .css({
                'max-width': '20em',
                'max-height': '10em',
                'object-fit': 'contain',
                'filter': 'drop-shadow(0px 0px 1em rgba(0,0,0,0.8))'
            })
            .appendTo($container);

        $poster.append($container);
    }

    // Функция добавления логотипа с кэшированием
    function addLogo(render, movie) {
        if (!$('body').hasClass('orientation--portrait') || !$('body').hasClass('true--mobile')) return;

        var isNew = isNewInterface(render);
        var $poster = isNew 
            ? $('.full-start-new__poster', render) 
            : $('.full-start__poster', render);
            
        if (!$poster.length) return;

        // Проверяем кэш для логотипа
        var cacheKey = 'logo_' + movie.id;
        var cachedLogo = cache.get(cacheKey);
        
        if (cachedLogo) {
            if (cachedLogo.logo_path) {
                applyLogo(render, $poster, cachedLogo.logo_path);
            }
            return;
        }

        var url = Lampa.TMDB.api((movie.name ? 'tv' : 'movie') + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language'));
        
        $.get(url, function(response) {
            var logoData = { logo_path: null };
            if (response.logos && response.logos[0]) {
                logoData.logo_path = response.logos[0].file_path;
            }
            cache.set(cacheKey, logoData);

            if (logoData.logo_path) {
                applyLogo(render, $poster, logoData.logo_path);
            }
        });
    }

    // Обработчик изменения ориентации экрана
    function handleOrientation() {
        if ($('body').hasClass('orientation--portrait')) {
            var e = Lampa.Activity.active();
            if (e && e.activity.render()) {
                addLogo(e.activity.render(), e.card);
            }
        } else {
            $('.logo-container').remove();
            $('.title-text').show();
        }
    }

    function initPlugin() {
        // Добавление CSS-стилей (однократно)
        if ($('style#network-plugin').length === 0) {
            $('<style>')
                .attr('id', 'network-plugin')
                .html([
                    '.button--network, .button--studio { padding: .3em; }',
                    '.network-innie {',
                    '    background-color: #fff;',
                    '    width: 100%;',
                    '    height: 100%;',
                    '    border-radius: .7em;',
                    '    display: flex;',
                    '    align-items: center;',
                    '    padding: 0 1em;',
                    '}',
                    '.button--network img, .button--studio img {',
                    '    height: 100%;',
                    '    max-height: 1.5em;',
                    '    max-width: 4.5em;',
                    '    object-fit: contain;',
                    '}',
                    '.full-start-new__title, .full-start__title {',
                    '    position: relative;',
                    '    margin-bottom: 0.6em !important;',
                    '}',
                    '.full--tagline {',
                    '    margin-bottom: 0.6em !important;',
                    '}',
                    '.original-title {',
                    '    font-size: 0.8em;',
                    '    color: rgba(255, 255, 255, 0.7);',
                    '    font-weight: normal;',
                    '}'
                ].join('\n'))
                .appendTo('head');
        }

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                
                addOriginalTitle(render, e.object.card);
                addLogo(render, e.data.movie);
                
                getNetworks(e.object, function(networks) {
                    if (networks.length) {
                        addNetworkButton(render, networks, e.object.method);
                    }
                });
            }
        });

        // Слушатель изменения ориентации
        $('body').on('class', function() {
            handleOrientation();
        });
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