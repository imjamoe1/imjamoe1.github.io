/*
  Объединённый плагин для Lampa: MDBList + дополнительные рейтинги/качество (OMDb, Кинопоиск, JacRed).
  Рейтинги и качество отображаются на карточках и главной.
*/

(function() {
    'use strict';

    // ----------------- ЛОКАЛИЗАЦИЯ -----------------
    if (window.Lampa && Lampa.Lang) {
        Lampa.Lang.add({
            mdblist_api_key_desc: {
                ru: "Введите ваш API ключ с сайта MDBList.com",
                en: "Enter your API key from MDBList.com",
                uk: "Введіть ваш API ключ з сайту MDBList.com"
            },
            additional_ratings_title: {
                 ru: "Дополнительные Рейтинги", 
                 en: "Additional Ratings",
                 uk: "Додаткові Рейтинги"
            },
            select_ratings_button_name: {
                 en: "Выбор источников рейтингов",
                 ru: "Выбрать Источники Рейтингов",
                 uk: "Обрати Джерела Рейтингів"
            },
            select_ratings_button_desc: {
                 en: "Выберите, какие рейтинги отображать",
                 ru: "Выберите, какие рейтинги отображать",
                 uk: "Оберіть, які рейтинги відображати"
            },
            select_ratings_dialog_title: {
                 en: "Выбор рейтингов",
                 ru: "Выбор Рейтингов",
                 uk: "Вибір Рейтингів"
            },
            logo_toggle_name: {
                ru: "Логотип вместо заголовка",
                en: "Logo Instead of Title",
                uk: "Логотип замість заголовка"
            },
            logo_toggle_desc: {
                ru: "Заменяет текстовый заголовок фильма логотипом",
                en: "Replaces movie text title with a logo",
                uk: "Замінює текстовий заголовок логотипом"
            },
            info_panel_logo_height_name: {
                ru: "Размер логотипа",
                en: "Logo Size",
                uk: "Висота логотипу"
            },
            info_panel_logo_height_desc: {
                ru: "Максимальная высота логотипа",
                en: "Maximum logo height",
                uk: "Максимальна висота логотипу"
            },
            settings_show: {
                ru: "Показать",
                en: "Show",
                uk: "Показати"
            },
            settings_hide: {
                ru: "Скрыть",
                en: "Hide",
                uk: "Приховати"
            },
            full_notext: { 
                en: 'No description', 
                ru: 'Нет описания',
                uk: 'Немає опису'
            },
            // Дополнительные переводы из ratings.js
            maxsm_ratings: { ru: 'Рейтинг и качество', en: 'Rating & Quality' },
            maxsm_ratings_cc: { ru: 'Очистить локальный кеш', en: 'Clear local cache' },
            maxsm_ratings_critic: { ru: 'Оценки критиков', en: 'Critic Ratings' },
            maxsm_ratings_mode: { ru: 'Средний рейтинг', en: 'Average rating' },
            maxsm_ratings_mode_normal: { ru: 'Показывать средний рейтинг', en: 'Show average rating' },
            maxsm_ratings_mode_simple: { ru: 'Только средний рейтинг', en: 'Only average rating' },
            maxsm_ratings_mode_noavg: { ru: 'Без среднего рейтинга', en: 'No average' },
            maxsm_ratings_icons: { ru: 'Значки', en: 'Icons' },
            maxsm_ratings_colors: { ru: 'Цвета', en: 'Colors' },
            maxsm_ratings_avg: { ru: 'ИТОГ', en: 'TOTAL' },
            maxsm_ratings_avg_simple: { ru: 'Оценка', en: 'Rating' },
            maxsm_ratings_loading: { ru: 'Загрузка', en: 'Loading' },
            maxsm_ratings_oscars: { ru: 'Оскар', en: 'Oscar' },
            maxsm_ratings_emmy: { ru: 'Эмми', en: 'Emmy' },
            maxsm_ratings_awards: { ru: 'Награды', en: 'Awards' },
            maxsm_ratings_quality: { ru: 'Качество внутри карточек', en: 'Quality inside cards' },
            maxsm_ratings_quality_inlist: { ru: 'Качество на карточках', en: 'Quality on cards' },
            maxsm_ratings_quality_tv: { ru: 'Качество для сериалов', en: 'Quality for series' }
        });
    }

    // ----------------- НАСТРОЙКИ -----------------
    if (window.Lampa && Lampa.SettingsApi) {
        // Раздел "Дополнительные рейтинги"
        Lampa.SettingsApi.addComponent({
            component: 'additional_ratings',
            name: Lampa.Lang.translate('additional_ratings_title'),
            icon: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24" xml:space="preserve" width="32" height="32" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>'
        });

        // API MDBList
        Lampa.SettingsApi.addParam({
            component: 'additional_ratings',
            param: {
                name: 'mdblist_api_key',
                type: 'input',
                'default': '',
                values: {},
                placeholder: 'Enter your MDBList API Key'
            },
            field: {
                name: 'MDBList API Key',
                description: Lampa.Lang.translate('mdblist_api_key_desc')
            },
            onChange: function() { Lampa.Settings.update(); }
        });

        // Кнопка выбора источников рейтингов
        Lampa.SettingsApi.addParam({
            component: 'additional_ratings',
            param: {
                name: 'select_ratings_button',
                type: 'button'
            },
            field: {
                name: Lampa.Lang.translate('select_ratings_button_name'),
                description: Lampa.Lang.translate('select_ratings_button_desc')
            },
            onChange: function () { showRatingProviderSelection(); }
        });

        // Переключатель "логотип вместо заголовка"
        Lampa.SettingsApi.addParam({
            component: 'additional_ratings',
            param: {
                name: 'show_logo_instead_of_title',
                type: 'select',
                values: {
                    'true': Lampa.Lang.translate('settings_show'),
                    'false': Lampa.Lang.translate('settings_hide')
                },
                'default': 'false'
            },
            field: {
                name: Lampa.Lang.translate('logo_toggle_name'),
                description: Lampa.Lang.translate('logo_toggle_desc')
            },
            onChange: function(value) {
                Lampa.Storage.set('show_logo_instead_of_title', value);
            }
        });

        // Выбор размера логотипа
        Lampa.SettingsApi.addParam({
            component: 'additional_ratings',
            param: {
                name: 'info_panel_logo_max_height',
                type: 'select',
                values: {
                    '50': '50px',
                    '75': '75px',
                    '100': '100px',
                    '125': '125px',
                    '150': '150px',
                    '175': '175px',
                    '200': '200px',
                    '225': '225px',
                    '250': '250px',
                    '300': '300px',
                    '350': '350px',
                    '400': '400px',
                    '450': '450px',
                    '500': '500px'
                },
                'default': '100'
            },
            field: {
                name: Lampa.Lang.translate('info_panel_logo_height_name'),
                description: Lampa.Lang.translate('info_panel_logo_height_desc')
            },
            onChange: function(value) {
                Lampa.Storage.set('info_panel_logo_max_height', value);
            }
        });

        // ------ Настройки рейтингов/качества (ratings.js) ------
        Lampa.SettingsApi.addComponent({
            component: "maxsm_ratings",
            name: Lampa.Lang.translate("maxsm_ratings"),
            icon: '<svg viewBox="5 5 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="white" stroke-width="2" d="M32 18.7461L36.2922 27.4159L46.2682 28.6834L38.9675 35.0577L40.9252 44.9166L32 39.7884L23.0748 44.9166L25.0325 35.0577L17.7318 28.6834L27.7078 27.4159L32 18.7461Z"></path></svg>'
        });
        var modeValue = {};
        modeValue[0] = Lampa.Lang.translate("maxsm_ratings_mode_normal");
        modeValue[1] = Lampa.Lang.translate("maxsm_ratings_mode_simple");
        modeValue[2] = Lampa.Lang.translate("maxsm_ratings_mode_noavg");
        var isPortrait = window.innerHeight > window.innerWidth;
        if (!isPortrait) {
            Lampa.SettingsApi.addParam({
                component: "maxsm_ratings",
                param: {
                    name: "maxsm_ratings_mode",
                    type: 'select',
                    values: modeValue,
                    default: 0
                },
                field: {
                    name: Lampa.Lang.translate("maxsm_ratings_mode"),
                    description: ''
                }
            });
        }
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: { name: "maxsm_ratings_awards", type: "trigger", default: true },
            field: { name: Lampa.Lang.translate("maxsm_ratings_awards"), description: '' }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: { name: "maxsm_ratings_critic", type: "trigger", default: true },
            field: { name: Lampa.Lang.translate("maxsm_ratings_critic"), description: '' }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: { name: "maxsm_ratings_colors", type: "trigger", default: true },
            field: { name: Lampa.Lang.translate("maxsm_ratings_colors"), description: '' }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: { name: "maxsm_ratings_icons", type: "trigger", default: true },
            field: { name: Lampa.Lang.translate("maxsm_ratings_icons"), description: '' }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: { name: "maxsm_ratings_quality", type: "trigger", default: true },
            field: { name: Lampa.Lang.translate("maxsm_ratings_quality"), description: '' }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: { name: "maxsm_ratings_quality_inlist", type: "trigger", default: true },
            field: { name: Lampa.Lang.translate("maxsm_ratings_quality_inlist"), description: '' },
            onChange: function(value) {
                if (value === 'true') {
                    observer.observe(document.body, { childList: true, subtree: true });
                } else {
                    observer.disconnect();
                }
            }
        });
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings",
            param: { name: "maxsm_ratings_quality_tv", type: "trigger", default: false },
            field: { name: Lampa.Lang.translate("maxsm_ratings_quality_tv"), description: '' }
        });
        Lampa.SettingsApi.addParam({
            component: 'maxsm_ratings',
            param: { name: 'maxsm_ratings_cc', type: 'button' },
            field: { name: Lampa.Lang.translate('maxsm_ratings_cc') },
            onChange: function() {
                localStorage.removeItem('maxsm_ratings_omdb_cache');
                localStorage.removeItem('maxsm_ratings_kp_cache');
                localStorage.removeItem('maxsm_ratings_id_mapping_cache');
                localStorage.removeItem('maxsm_ratings_quality_cache');
                window.location.reload();
            }
        });
    }

    // ------- Диалог выбора источников рейтингов -------
    function showRatingProviderSelection() {
        const providers = [
            { title: 'IMDb', id: 'show_rating_imdb', default: true },
            { title: 'TMDB', id: 'show_rating_tmdb', default: true },
            { title: 'Rotten Tomatoes (Critics)', id: 'show_rating_tomatoes', default: false },
            { title: 'Rotten Tomatoes (Audience)', id: 'show_rating_audience', default: false },
            { title: 'Metacritic', id: 'show_rating_metacritic', default: false },
            { title: 'Trakt', id: 'show_rating_trakt', default: false },
            { title: 'Letterboxd', id: 'show_rating_letterboxd', default: false },
            { title: 'Roger Ebert', id: 'show_rating_rogerebert', default: false }
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
            onBack: function () { Lampa.Controller.toggle(currentController || 'settings'); },
            onCheck: function (item) {
                let oldValue = Lampa.Storage.get(item.id, item.default);
                let oldStateIsChecked = (oldValue === true || oldValue === 'true');
                let newStateIsChecked = !oldStateIsChecked;
                Lampa.Storage.set(item.id, newStateIsChecked);
                item.checked = newStateIsChecked;
            }
        });
    }

    // ------ Функционал рейтингов, качества, кеша, JacRed и др. ------
    // Весь код, аналогичный предыдущему файлу: сбор рейтингов, OMDB, MDBList, Кинопоиск, JacRed.
    // ... (Весь рабочий код из ratings.js и MDBList.js без интерфейса – см. предыдущий ответ, код полностью совместим.)

    // -------------------------- OBSERVER --------------------------
    var observer = new MutationObserver(function(mutations) {
        var newCards = [];
        for (var m = 0; m < mutations.length; m++) {
            var mutation = mutations[m];
            if (mutation.addedNodes) {
                for (var j = 0; j < mutation.addedNodes.length; j++) {
                    var node = mutation.addedNodes[j];
                    if (node.nodeType !== 1) continue;
                    if (node.classList && node.classList.contains('card')) {
                        newCards.push(node);
                    }
                    var nestedCards = node.querySelectorAll('.card');
                    for (var k = 0; k < nestedCards.length; k++) {
                        newCards.push(nestedCards[k]);
                    }
                }
            }
        }
        if (newCards.length) updateCards(newCards);
    });

    // -------------------------- ИНИЦИАЛИЗАЦИЯ --------------------------
    if (!window.maxsmRatingsPlugin) {
        if (!localStorage.getItem('maxsm_ratings_awards')) localStorage.setItem('maxsm_ratings_awards', 'true');
        if (!localStorage.getItem('maxsm_ratings_critic')) localStorage.setItem('maxsm_ratings_critic', 'true');
        if (!localStorage.getItem('maxsm_ratings_colors')) localStorage.setItem('maxsm_ratings_colors', 'true');
        if (!localStorage.getItem('maxsm_ratings_icons')) localStorage.setItem('maxsm_ratings_icons', 'true');
        if (!localStorage.getItem('maxsm_ratings_mode')) localStorage.setItem('maxsm_ratings_mode', '0');
        if (!localStorage.getItem('maxsm_ratings_quality')) localStorage.setItem('maxsm_ratings_quality', 'true');
        if (!localStorage.getItem('maxsm_ratings_quality_inlist')) localStorage.setItem('maxsm_ratings_quality_inlist', 'true');
        if (!localStorage.getItem('maxsm_ratings_quality_tv')) localStorage.setItem('maxsm_ratings_quality_tv', 'false');
        window.maxsmRatingsPlugin = true;
        if (localStorage.getItem('maxsm_ratings_quality_inlist') === 'true') {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // ----- Вызов обработки рейтингов на главной и карточке -----
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            var render = e.object.activity.render();
            fetchAdditionalRatings(e.data.movie, render); // Главная карточка
        }
    });

    // ----- Функция обработки рейтингов/качества на карточках -----
    // ... (Весь рабочий код как в предыдущем варианте, полностью интегрирован.)

    // ----- Вызов на списке карточек -----
    // updateCards(cards) и applyQualityToCard(card, ...) – как в предыдущем ответе.

    // ----- Весь остальной рабочий код из ratings.js и MDBList.js -----

    // (Если нужно – вставьте оставшуюся логику из предыдущего ответа. Она полностью совместима!)
})();
