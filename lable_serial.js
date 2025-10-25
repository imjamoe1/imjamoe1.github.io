(function() {
    'use strict';

    var style = document.createElement('style');
    style.textContent = [
        /* Удаляем стили для .card__type (метка TV) */
        '.card__type { display: none !important; }', // Скрываем метку TV

        /* Оставляем стили для статусов */
        '.card__status {',
        '    position: absolute;',
        '    left: 0.5em;',
        '    top: 0.25em;',
        '    padding: 0.2em 0.3em;',
        '    font-size: 0.9em;',
        '    border-radius: 0.5em;',
        '    font-weight: bold;',
        '    z-index: 2;',
        '    box-shadow: 0 2px 8px rgba(0,0,0,0.15);',
        '    letter-spacing: 0.04em;',
        '    line-height: 1;',
        '}',
        '.card__status[data-status="ended"] {',
        '    background: #F44336;',
        '    color: #fff;',
        '}',
        '.card__status[data-status="airing"] {',
        '    background: #2196F3;',
        '    color: #fff;',
        '}',
        '.card__status[data-status="paused"] {',
        '    background: #FFC107;',
        '    color: #222;',
        '}',
        '.card__status[data-status="canceled"] {',
        '    background: #FFC107;',
        '    color: #222;',
        '}',
        /* Добавляем рамку для постера (опционально) */
        '.card[data-type="tv"] .card__poster:after,',
        '.card--tv .card__poster:after {',
        '    content: "";',
        '    position: absolute;',
        '    left: 0;',
        '    top: 0;',
        '    height: 100%;',
        '    width: 3px;',
        '    background: #2196F3;', // Синяя полоса (можно изменить цвет)
        '    z-index: 1;',
        '}'
    ].join('\n');
    document.head.appendChild(style);

    var processedCards = new WeakSet();
    var observer;
    var pendingScan = false;

    function addStatusToCard(card) {    
        var cardElement;  
        if (card && card.card && card.card.querySelector) {  
            cardElement = card.card;  
        } else if (card && card.querySelector) {  
            cardElement = card;  
        } else {  
            return;  
        }  
        
        if (processedCards.has(cardElement)) return;  
        
        var cardView = cardElement.querySelector('.card__view');    
        if (!cardView) return;    
        
        var data = cardElement.card_data || card.data || {};
        var typeElement = cardView.querySelector('.card__type');    
    
        var isTv = data.type === 'tv' ||       
            data.first_air_date ||      
            data.number_of_seasons ||      
            cardElement.classList.contains('card--tv') ||  
            (typeElement && typeElement.textContent.trim().toUpperCase() === 'TV');  
        
        if (!isTv) return;    
    
        var existingStatus = (data.status || (data.movie && data.movie.status) || '').toLowerCase();    
        if (existingStatus) {    
            addStatusToCardView(existingStatus, cardView, card);    
            return;    
        }    
     
        if (data.id && !data.status) {      
            fetchSeriesStatusFromTMDB(data.id, function(status) {      
                if (status) {      
                    data.status = status.toLowerCase();       
                    addStatusToCardView(status.toLowerCase(), cardView, card);    
                } else {    
                    addStatusToCardView(null, cardView, card);
                }    
            });      
        } else {    
            addStatusToCardView(null, cardView, card);
        }    
    
        processedCards.add(card); 
    }  
    
    function addStatusToCardView(status, cardView, card) {    
        var old = cardView.querySelectorAll('.card__type, .card__status');    
        for (var i = 0; i < old.length; i++) {    
            old[i].parentNode.removeChild(old[i]);    
        }    
    
        var typeElem = document.createElement('div');    
        typeElem.className = 'card__type';    
        typeElem.textContent = 'TV';    
        cardView.appendChild(typeElem);    
    
        if (status) {    
            var statusElement = document.createElement('div');    
            statusElement.className = 'card__status';    
            
            if (status === 'ended') {    
                statusElement.setAttribute('data-status', 'ended');    
                statusElement.textContent = 'Сериал';    
            } else if (status === 'on hiatus' || status === 'paused') {    
                statusElement.setAttribute('data-status', 'paused');    
                statusElement.textContent = 'Сериал';    
            } else if (status === 'canceled') {    
                statusElement.setAttribute('data-status', 'canceled');    
                statusElement.textContent = 'Сериал';    
            } else if (status === 'returning series' || status === 'airing' || status === 'in production') {    
                statusElement.setAttribute('data-status', 'airing');    
                statusElement.textContent = 'Сериал';    
            } else {    
                processedCards.add(card); 
                return;    
            }    
            
            cardView.appendChild(statusElement);    
        }    
        
        processedCards.add(card); 
    }

    function fetchSeriesStatusFromTMDB(seriesId, callback) {  
        var url = 'tv/' + seriesId + '?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language', 'ru');  
        
        var network = new Lampa.Reguest();  
        network.timeout(1000 * 5);  
        network.silent(Lampa.TMDB.api(url), function(json) {  
            callback(json.status || null);  
        }, function() {  
            callback(null);  
        });  
    }  

    function scanCards(selector) {
        if (pendingScan) return;
        pendingScan = true;
        setTimeout(function() {
            var cards = document.querySelectorAll(selector || '.card');
            for (var i = 0; i < cards.length; i++) {
                if (!processedCards.has(cards[i])) {
                    addStatusToCard(cards[i]);
                }
            }
            pendingScan = false;
        }, 0);
    }

    function handleMoreButton() {
        Lampa.Listener.follow('line', function (event) {
            if (event.type === 'append') {
                var moreButtons = document.querySelectorAll('.items-line__more.selector');
                moreButtons.forEach(function(moreButton) {
                    moreButton.addEventListener('click', function() {
                        setTimeout(function() {
                            scanCards('.selector__body .card');
                        }, 300);
                    });
                });
            }
        });
    }

    function initObserver() {
        if (observer) observer.disconnect();
        observer = new MutationObserver(function(mutations) {
            for (var m = 0; m < mutations.length; m++) {
                var mutation = mutations[m];
                for (var n = 0; n < mutation.addedNodes.length; n++) {
                    var node = mutation.addedNodes[n];
                    if (node.nodeType !== 1) continue;
                    if (node.classList && node.classList.contains('card')) {
                        addStatusToCard(node);
                    } else if (node.querySelectorAll) {
                        var cards = node.querySelectorAll('.card');
                        for (var i = 0; i < cards.length; i++) {
                            if (!processedCards.has(cards[i])) {
                                addStatusToCard(cards[i]);
                            }
                        }
                    }
                    if (node.classList && node.classList.contains('items-line__more')) {
                        handleMoreButton();
                    }
                }
            }

            if (document.querySelector('.category-full, .items-cards')) {
                scanCards('.category-full .card, .items-cards .card');
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (typeof Lampa !== 'undefined') {
        Lampa.Listener.follow('activity', function(event) {
            initObserver();
            handleMoreButton();
            
            if (event.component === 'category' || event.component === 'category_full' || event.component === 'catalog') {
                setTimeout(function() {
                    scanCards('.category-full .card, .items-cards .card');
                }, 300);
                
                setTimeout(function() {
                    scanCards('.category-full .card, .items-cards .card');
                }, 1000);
            }
        });

        Lampa.Listener.follow('line', function(event) {
            if (event.type === 'append' && event.items) {
                for (var i = 0; i < event.items.length; i++) {
                    if (!processedCards.has(event.items[i])) {
                        addStatusToCard(event.items[i]);
                    }
                }
            }
        });

        initObserver();
        handleMoreButton();
        
        setTimeout(function() {
            scanCards();
        }, 500);
        
        setTimeout(function() {
            scanCards();
        }, 1500);
    }
})();
