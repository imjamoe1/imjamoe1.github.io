(function() {
    'use strict';

    function initPlugin() {
        if (window.label_tv_plugin) {
            return;
        }
        
        window.label_tv_plugin = true;

        // Добавляем переводы
        Lampa.Lang.add({
            'label_tv_caption': {
                'ru': "Сериал",
                'en': "Series", 
                'uk': "Серіал"
            },
            'label_movie_caption': {
                'ru': "Фильм",
                'en': "Film", 
                'uk': "Фільм"
            },
            'label_cartoon_caption': {
                'ru': "Мульт",
                'en': "Cartoon", 
                'uk': "Мульт"
            }
        });

        // Добавляем стили
        function addStyles() {
            var tvLabelText = Lampa.Lang.translate('label_tv_caption');
            var movieLabelText = Lampa.Lang.translate('label_movie_caption');
            var cartoonLabelText = Lampa.Lang.translate('label_cartoon_caption');
            
            var styles = [
                "<style id=\"custom_label_styles\">",
                /* Стили для сериалов - заменяем родной лейбл */
                ".card--tv .card__type {",
                "    font-size: 0.9em;",
                "    background: transparent;", 
                "    color: transparent;",
                "    z-index: 10;",
                "}",
                ".card--tv .card__type::after {",
                "    content: \"" + tvLabelText + "\";",
                "    color: #fff;",
                "    position: absolute;",
                "    left: 0;",
                "    top: 0;", 
                "    padding: 0.4em 0.4em;",
                "    border-radius: 0.5em;",
                "    font-weight: 600;",
                "    border: 1px solid #fff !important;",
                "    background-color: rgba(0, 0, 0, 0.7) !important;",
                "    font-size: 0.95em;",
                "    z-index: 15;",
                "}",
                /* Стили для фильмов */
                ".card--movie .custom-label {",
                "    color: #fff;",
                "    position: absolute;",
                "    left: -0.8em;",
                "    top: 1.4em;", 
                "    padding: 0.3em 0.4em;",
                "    border-radius: 0.5em;",
                "    font-weight: 600;",
                "    border: 1px solid #fff !important;",
                "    background-color: rgba(0, 0, 0, 0.7) !important;",
                "    font-size: 0.95em;",
                "    z-index: 15 !important;",
                "}",
                /* Стили для мультфильмов */
                ".card--cartoon .custom-label {",
                "    color: #fff;",
                "    position: absolute;",
                "    left: -0.8em;",
                "    top: 1.4em;", 
                "    padding: 0.3em 0.4em;",
                "    border-radius: 0.5em;",
                "    font-weight: 600;",
                "    border: 1px solid #fff !important;",
                "    background-color: rgba(0, 0, 0, 0.7) !important;",
                "    font-size: 0.95em;",
                "    z-index: 15 !important;",
                "}",
                "</style>"
            ].join('\n');
            
            $("body").append(styles);
        }

        function getMovieType(cardData) {
            // Проверяем жанры на наличие мультфильма (жанр 16)
            if (cardData.genre_ids && cardData.genre_ids.includes(16)) {
                return 'cartoon';
            }
            if (cardData.genres && cardData.genres.some(g => g.id === 16)) {
                return 'cartoon';
            }
            // Проверяем, есть ли название сериала
            if (cardData.name) {
                return 'tv';
            }
            // Иначе фильм
            return 'movie';
        }

        function addLabel(cardElement, cardData) {
            // Определяем тип контента
            const movieType = getMovieType(cardData);
            
            // Для сериалов используем стандартный card__type (заменяем родной лейбл)
            if (movieType === 'tv') {
                // Убеждаемся что у карточки есть класс card--tv
                if (!cardElement.classList.contains('card--tv')) {
                    cardElement.classList.add('card--tv');
                }
                return; // Стили применятся через CSS
            }
            
            // Для фильмов и мультфильмов добавляем кастомный лейбл
            // Удаляем существующий лейбл, если есть
            const existingLabel = cardElement.querySelector('.custom-label');
            if (existingLabel) {
                existingLabel.remove();
            }
            
            let labelText = '';
            switch(movieType) {
                case 'cartoon':
                    labelText = Lampa.Lang.translate('label_cartoon_caption');
                    cardElement.classList.add('card--cartoon');
                    break;
                default:
                    labelText = Lampa.Lang.translate('label_movie_caption');
                    cardElement.classList.add('card--movie');
            }

            // Создаем лейбл
            const label = document.createElement('div');
            label.className = 'custom-label';
            label.textContent = labelText;
            
            // Находим элемент с изображением и добавляем лейбл
            const viewElement = cardElement.querySelector('.card__view');
            if (viewElement) {
                viewElement.style.position = 'relative';
                viewElement.appendChild(label);
            }
        }

        function processCard(cardElement) {
            // Получаем данные карточки
            let cardData = null;
            try {
                if (cardElement.card_data) {
                    cardData = cardElement.card_data;
                } else if (window.$) {
                    cardData = $(cardElement).data('card') || $(cardElement).data('json');
                }
            } catch(e) {}
            
            if (!cardData) return;
            
            // Добавляем лейбл
            addLabel(cardElement, cardData);
        }

        function processAllCards() {
            // Обрабатываем все карточки на странице
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                // Проверяем, не обработана ли уже карточка
                if (!card.hasAttribute('data-custom-label-processed')) {
                    processCard(card);
                    card.setAttribute('data-custom-label-processed', 'true');
                }
            });
        }

        // Наблюдатель за появлением новых карточек
        function observeNewCards() {
            const observer = new MutationObserver(function(mutations) {
                let needProcess = false;
                
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                        needProcess = true;
                    }
                });
                
                if (needProcess) {
                    setTimeout(processAllCards, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        // Следим за сменой активности
        function bindActivityListener() {
            if (window.Lampa && Lampa.Listener) {
                Lampa.Listener.follow('activity', function(e) {
                    if (e.type === 'start' || e.type === 'activity') {
                        setTimeout(processAllCards, 200);
                    }
                });
                
                Lampa.Listener.follow('full', function(e) {
                    if (e.type === 'complite') {
                        setTimeout(processAllCards, 200);
                    }
                });
            }
        }

        // Добавляем стили
        addStyles();
        
        // Инициализация
        setTimeout(processAllCards, 500);
        observeNewCards();
        bindActivityListener();
    }

    // Запуск плагина
    if (window.appready) {
        initPlugin();
    } else {
        if (window.Lampa && Lampa.Listener) {
            Lampa.Listener.follow('app', function(event) {
                if (event.type == 'ready') {
                    initPlugin();
                }
            });
        } else {
            document.addEventListener('DOMContentLoaded', initPlugin);
        }
    }
})();
