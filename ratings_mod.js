/*
    Объединённый плагин рейтингов (Kinopoisk, OMDB, JacRed, Metacritic, Tomatoes, Oscars, Emmy, Awards, TMDB, IMDb)
    + Movie Logos (логотип вместо текста) + Вертикальные постеры (дополнительная настройка) + расширенный UI выбора рейтингов
    Для Lampa TV
*/

(function () {
    'use strict';

    // ---- SVG ICONS ----
    // ... (оставьте ваши SVG-иконки как есть) ...

    // ---- LANG STRINGS ----
    Lampa.Lang.add({
        // ... все строки из ratings.js ...
        // + добавьте из Movie Logos:
        additional_ratings_title: { ru: "Дополнительные Рейтинги", en: "Additional Ratings", uk: "Додаткові Рейтинги" },
        select_ratings_button_name: { en: "Select Rating Providers", ru: "Выбрать Источники Рейтингов", uk: "Обрати Джерела Рейтингів" },
        select_ratings_button_desc: { en: "Choose which ratings to display", ru: "Выберите, какие рейтинги отображать", uk: "Оберіть, які рейтинги відображати" },
        select_ratings_dialog_title: { en: "Select Ratings", ru: "Выбор Рейтингов", uk: "Вибір Рейтингів" },
        logo_toggle_name: { ru: "Логотип вместо заголовка", en: "Logo Instead of Title", uk: "Логотип замість заголовка" },
        logo_toggle_desc: { ru: "Заменяет текстовый заголовок фильма логотипом", en: "Replaces movie text title with a logo", uk: "Замінює текстовий заголовок логотипом" },
        vertical_poster_toggle_name: { ru: "Вертикальные постеры", en: "Vertical Posters", uk: "Вертикальні постери" },
        vertical_poster_toggle_desc: { ru: "Показывать вертикальные постеры в карточке фильма", en: "Show vertical posters in the movie card", uk: "Показувати вертикальні постери в картці фільму" },
        settings_show: { ru: "Показать", en: "Show", uk: "Показати" },
        settings_hide: { ru: "Скрыть", en: "Hide", uk: "Приховати" },
        info_panel_logo_height_name: { ru: "Размер логотипа", en: "Logo Size", uk: "Висота логотипу" },
        info_panel_logo_height_desc: { ru: "Максимальная высота логотипа", en: "Maximum logo height", uk: "Максимальна висота логотипу" },
        // ... остальные строки как есть ...
    });

    // ---- SETTINGS UI ----
    Lampa.SettingsApi.addComponent({
        component: 'additional_ratings',
        name: Lampa.Lang.translate('additional_ratings_title'),
        icon: star_svg
    });

    // API Keys ...
    // ... тут ваши параметры для OMDB/KP/JacRed ...

    // ---- Movie Logos/Vertical Posters UI ----
    Lampa.SettingsApi.addParam({
        component: 'additional_ratings',
        param: {
            name: 'show_logo_instead_of_title',
            type: 'select',
            values: { 'true': Lampa.Lang.translate('settings_show'), 'false': Lampa.Lang.translate('settings_hide') },
            default: 'false'
        },
        field: {
            name: Lampa.Lang.translate('logo_toggle_name'),
            description: Lampa.Lang.translate('logo_toggle_desc')
        },
        onChange: function(value) {
            Lampa.Storage.set('show_logo_instead_of_title', value);
        }
    });

    Lampa.SettingsApi.addParam({
        component: 'additional_ratings',
        param: {
            name: 'show_vertical_posters',
            type: 'select',
            values: { 'true': Lampa.Lang.translate('settings_show'), 'false': Lampa.Lang.translate('settings_hide') },
            default: 'false'
        },
        field: {
            name: Lampa.Lang.translate('vertical_poster_toggle_name'),
            description: Lampa.Lang.translate('vertical_poster_toggle_desc')
        },
        onChange: function(value) {
            Lampa.Storage.set('show_vertical_posters', value);
        }
    });

    Lampa.SettingsApi.addParam({
        component: 'additional_ratings',
        param: {
            name: 'info_panel_logo_max_height',
            type: 'select',
            values: {
                '50': '50px', '75': '75px', '100': '100px', '125': '125px', '150': '150px',
                '175': '175px', '200': '200px', '225': '225px', '250': '250px', '300': '300px',
                '350': '350px', '400': '400px', '450': '450px', '500': '500px'
            },
            default: '100'
        },
        field: {
            name: Lampa.Lang.translate('info_panel_logo_height_name'),
            description: Lampa.Lang.translate('info_panel_logo_height_desc')
        },
        onChange: function(value) {
            Lampa.Storage.set('info_panel_logo_max_height', value);
        }
    });

    // ---- Выбор источников рейтинга (multi-select) ----
    function showRatingProviderSelection() {
        const providers = [
            { title: 'IMDb', id: 'show_rating_imdb', default: true },
            { title: 'TMDB', id: 'show_rating_tmdb', default: true },
            { title: 'Rotten Tomatoes', id: 'show_rating_tomatoes', default: false },
            { title: 'Metacritic', id: 'show_rating_metacritic', default: false },
            { title: 'Кинопоиск', id: 'show_rating_kp', default: false },
            { title: 'Oscars', id: 'show_rating_oscars', default: false },
            { title: 'Awards', id: 'show_rating_awards', default: false },
            { title: Lampa.Lang.translate('vertical_poster_toggle_name'), id: 'show_vertical_posters', default: false }
        ];
        let selectItems = providers.map(provider => {
            let storedValue = Lampa.Storage.get(provider.id, provider.default);
            let isChecked = (storedValue === true || storedValue === 'true');
            return {
                title: provider.title,
                id: provider.id,
                checkbox: true,
                checked: isChecked,
                default: provider.default
            };
        });
        var currentController = Lampa.Controller.enabled().name;
        Lampa.Select.show({
            title: Lampa.Lang.translate('select_ratings_dialog_title'),
            items: selectItems,
            onBack: function () {
                Lampa.Controller.toggle(currentController || 'settings');
            },
            onCheck: function (item) {
                let oldValue = Lampa.Storage.get(item.id, item.default);
                let oldStateIsChecked = (oldValue === true || oldValue === 'true');
                let newStateIsChecked = !oldStateIsChecked;
                Lampa.Storage.set(item.id, newStateIsChecked);
                item.checked = newStateIsChecked;
            }
        });
    }

    Lampa.SettingsApi.addParam({
        component: 'additional_ratings',
        param: { name: 'select_ratings_button', type: 'button' },
        field: {
            name: Lampa.Lang.translate('select_ratings_button_name'),
            description: Lampa.Lang.translate('select_ratings_button_desc')
        },
        onChange: showRatingProviderSelection
    });

    // ---- ВСТАВКА ВЕРТИКАЛЬНЫХ ПОСТЕРОВ ----
    function insertVerticalPosters(card, render) {
        var showPosters = (Lampa.Storage.get('show_vertical_posters', 'false') === 'true' || Lampa.Storage.get('show_vertical_posters', false) === true);
        if (!showPosters) return;

        var postersContainer = $('.vertical-posters-container', render);
        if (!postersContainer.length) {
            postersContainer = $('<div class="vertical-posters-container"></div>');
            render.append(postersContainer);
        } else {
            postersContainer.empty();
        }

        // Получаем TMDB изображения
        var apiKey = Lampa.TMDB.key();
        var language = Lampa.Storage.get('language');
        var apiUrl = Lampa.TMDB.api((card.method === 'tv' ? 'tv/' : 'movie/') + card.id + '/images?api_key=' + apiKey + '&language=' + language);

        new Lampa.Reguest().silent(apiUrl, function(response) {
            if (response && response.posters && response.posters.length > 0) {
                let posters = response.posters
                    .filter(p => p.file_path && p.aspect_ratio >= 0.65 && p.aspect_ratio <= 0.76)
                    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
                    .slice(0, 3);
                posters.forEach(function(poster) {
                    var imgUrl = Lampa.TMDB.image('/t/p/w500' + poster.file_path);
                    postersContainer.append(`<img src="${imgUrl}" style="max-width: 140px; max-height: 220px; margin-right: 10px; border-radius:8px; box-shadow:0 0 12px #000;" alt="Vertical poster" />`);
                });
            }
        });
    }

    // ---- Movie Logo вместо текста ----
    function displayLogoOrTitle(card, render) {
        const showLogo = (Lampa.Storage.get('show_logo_instead_of_title', 'false') === 'true');
        var titleElement = $('.new-interface-info__title', render);
        if (!titleElement.length) return;

        if (showLogo) {
            var apiKey = Lampa.TMDB.key();
            var language = Lampa.Storage.get('language');
            var apiUrl = Lampa.TMDB.api((card.method === 'tv' ? 'tv/' : 'movie/') + card.id + '/images?api_key=' + apiKey + '&language=' + language);

            new Lampa.Reguest().silent(apiUrl, function(response) {
                var logoPath = null;
                if (response && response.logos && response.logos.length > 0) {
                    var pngLogo = response.logos.find(logo => logo.file_path && !logo.file_path.endsWith('.svg'));
                    logoPath = pngLogo ? pngLogo.file_path : response.logos[0].file_path;
                }
                if (logoPath) {
                    var selectedHeight = Lampa.Storage.get('info_panel_logo_max_height', '100');
                    var styleAttr = `max-height: ${selectedHeight}px; max-width: 100%; vertical-align: middle; margin-bottom: 0.1em;`;
                    var imgUrl = Lampa.TMDB.image('/t/p/original' + logoPath);
                    var imgTagHtml = `<img src="${imgUrl}" style="${styleAttr}" alt="${card.title} Logo" />`;
                    titleElement.empty().html(imgTagHtml);
                } else {
                    titleElement.text(card.title);
                }
            }, function() {
                titleElement.text(card.title);
            });
        } else {
            titleElement.text(card.title);
        }
    }

    // ---- MAIN HOOK: ВСТАВКА ДАННЫХ В КАРТОЧКУ ----
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            var card = e.data.movie;
            var render = e.object.activity.render();

            // Вызов функций рейтинга (оставьте вашу логику ratings.js)
            // fetchAdditionalRatings(card, render);

            // Вставка логотипа
            displayLogoOrTitle(card, render);

            // Вставка вертикальных постеров
            insertVerticalPosters(card, render);

            // ... остальной ваш функционал ...
        }
    });

    // ---- Стили для постеров ----
    var style_id = 'vertical_posters_style';
    Lampa.Template.add(style_id, `
        <style data-id="${style_id}">
            .vertical-posters-container { display: flex; flex-direction: row; margin-top: 0.7em; }
            .vertical-posters-container img { transition: box-shadow 0.2s; }
            .vertical-posters-container img:hover { box-shadow: 0 0 24px #fff; }
        </style>
    `);
    $('body').append(Lampa.Template.get(style_id, {}, true));

    // ---- Инициализация вашего ratings.js ----
    // ... startPlugin(); ...
})();
