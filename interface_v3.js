(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;

    // Проверяем версию Lampa
    const isLampaV3 = Lampa.Manifest.app_digital >= 300;

    // Инициализируем плагин в зависимости от версии
    if (isLampaV3) {
        startPluginV3();
    } else {
        startPluginLegacy();
    }

    // ==================== ВЕРСИЯ 3.0+ ====================
    function startPluginV3() {
        if (!Lampa.Maker || !Lampa.Maker.map || !Lampa.Utils) return;
        if (window.plugin_interface_ready_v3) return;
        window.plugin_interface_ready_v3 = true;

        addStyleV3();
        addSettingsV3();

        const mainMap = Lampa.Maker.map('Main');

        if (!mainMap || !mainMap.Items || !mainMap.Create) return;

        wrap(mainMap.Items, 'onInit', function (original, args) {
            if (original) original.apply(this, args);
            this.__newInterfaceEnabled = shouldUseNewInterface(this && this.object);
        });

        wrap(mainMap.Create, 'onCreate', function (original, args) {
            if (original) original.apply(this, args);
            if (!this.__newInterfaceEnabled) return;
            const state = ensureState(this);
            state.attach();
        });

        wrap(mainMap.Create, 'onCreateAndAppend', function (original, args) {
            const element = args && args[0];
            if (this.__newInterfaceEnabled && element) {
                prepareLineData(element);
            }
            return original ? original.apply(this, args) : undefined;
        });

        wrap(mainMap.Items, 'onAppend', function (original, args) {
            if (original) original.apply(this, args);
            if (!this.__newInterfaceEnabled) return;
            const item = args && args[0];
            const element = args && args[1];
            if (item && element) attachLineHandlers(this, item, element);
        });

        wrap(mainMap.Items, 'onDestroy', function (original, args) {
            if (this.__newInterfaceState) {
                this.__newInterfaceState.destroy();
                delete this.__newInterfaceState;
            }
            delete this.__newInterfaceEnabled;
            if (original) original.apply(this, args);
        });
    }

    function shouldUseNewInterface(object) {
        if (!object) return false;
        if (object.source === 'other' && !object.backdrop_path) return false;
        if (window.innerWidth < 767) return false;
        if (object.title === "Избранное") return false;
        if (Lampa.Platform.screen("mobile")) return false;
        return true;
    }

    function ensureState(main) {
        if (main.__newInterfaceState) return main.__newInterfaceState;
        const state = createInterfaceState(main);
        main.__newInterfaceState = state;
        return state;
    }

    function createInterfaceState(main) {
        const info = new InterfaceInfoV3();
        info.create();

        const background = document.createElement('img');
        background.className = 'full-start__background';

        const state = {
            main,
            info,
            background,
            infoElement: null,
            backgroundTimer: null,
            backgroundLast: '',
            attached: false,
            attach() {
                if (this.attached) return;

                const container = main.render(true);
                if (!container) return;

                container.classList.add('new-interface');

                if (!background.parentElement) {
                    container.insertBefore(background, container.firstChild || null);
                }

                const infoNode = info.render(true);
                this.infoElement = infoNode;

                if (infoNode && infoNode.parentNode !== container) {
                    if (background.parentElement === container) {
                        container.insertBefore(infoNode, background.nextSibling);
                    } else {
                        container.insertBefore(infoNode, container.firstChild || null);
                    }
                }

                main.scroll.minus(infoNode);

                this.attached = true;
            },
            update(data) {
                if (!data) return;
                info.update(data);
                this.updateBackground(data);
            },
            updateBackground(data) {
                const path = data && data.backdrop_path ? Lampa.Api.img(data.backdrop_path, 'w1280') : '';

                if (!path || path === this.backgroundLast) return;

                clearTimeout(this.backgroundTimer);

                this.backgroundTimer = setTimeout(() => {
                    background.classList.remove('loaded');

                    background.onload = () => background.classList.add('loaded');
                    background.onerror = () => background.classList.remove('loaded');

                    this.backgroundLast = path;

                    setTimeout(() => {
                        background.src = this.backgroundLast;
                    }, 50);
                }, 100);
            },
            reset() {
                info.empty();
            },
            destroy() {
                clearTimeout(this.backgroundTimer);
                info.destroy();

                const container = main.render(true);
                if (container) container.classList.remove('new-interface');

                if (this.infoElement && this.infoElement.parentNode) {
                    this.infoElement.parentNode.removeChild(this.infoElement);
                }

                if (background && background.parentNode) {
                    background.parentNode.removeChild(background);
                }

                this.attached = false;
            }
        };

        return state;
    }

    function prepareLineData(element) {
        if (!element) return;
        if (Array.isArray(element.results)) {
            // Используем настройку wide_post для определения стиля карточек
            const useWidePosters = Lampa.Storage.get("wide_post") == true;
            const cardStyle = useWidePosters ? 'wide' : 'small';
            
            Lampa.Utils.extendItemsParams(element.results, {
                style: {
                    name: cardStyle
                }
            });
        }
    }

    function decorateCard(state, card) {
        if (!card || card.__newInterfaceCard || typeof card.use !== 'function' || !card.data) return;

        card.__newInterfaceCard = true;

        card.params = card.params || {};
        card.params.style = card.params.style || {};

        // Используем настройку wide_post для определения стиля карточек
        const useWidePosters = Lampa.Storage.get("wide_post") == true;
        card.params.style.name = useWidePosters ? 'wide' : 'small';

        // Всегда скрываем названия под постерами для обоих типов постеров
        //card.params.hide_title = true;

        card.use({
            onFocus() {
                state.update(card.data);
            },
            onHover() {
                state.update(card.data);
            },
            onTouch() {
                state.update(card.data);
            },
            onDestroy() {
                delete card.__newInterfaceCard;
            }
        });
    }

    function getCardData(card, element, index = 0) {
        if (card && card.data) return card.data;
        if (element && Array.isArray(element.results)) return element.results[index] || element.results[0];
        return null;
    }

    function getDomCardData(node) {
        if (!node) return null;

        let current = node && node.jquery ? node[0] : node;

        while (current && !current.card_data) {
            current = current.parentNode;
        }

        return current && current.card_data ? current.card_data : null;
    }

    function getFocusedCardData(line) {
        const container = line && typeof line.render === 'function' ? line.render(true) : null;
        if (!container || !container.querySelector) return null;

        const focus = container.querySelector('.selector.focus') || container.querySelector('.focus');

        return getDomCardData(focus);
    }

    function attachLineHandlers(main, line, element) {
        if (line.__newInterfaceLine) return;
        line.__newInterfaceLine = true;

        const state = ensureState(main);
        const applyToCard = (card) => decorateCard(state, card);

        line.use({
            onInstance(card) {
                applyToCard(card);
            },
            onActive(card, itemData) {
                const current = getCardData(card, itemData);
                if (current) state.update(current);
            },
            onToggle() {
                setTimeout(() => {
                    const domData = getFocusedCardData(line);
                    if (domData) state.update(domData);
                }, 32);
            },
            onMore() {
                state.reset();
            },
            onDestroy() {
                state.reset();
                delete line.__newInterfaceLine;
            }
        });

        if (Array.isArray(line.items) && line.items.length) {
            line.items.forEach(applyToCard);
        }

        if (line.last) {
            const lastData = getDomCardData(line.last);
            if (lastData) state.update(lastData);
        }
    }

    // Класс InterfaceInfo для версии 3.0+
    class InterfaceInfoV3 {
        constructor() {
            this.html = null;
            this.timer = null;
            this.network = new Lampa.Reguest();
            this.loaded = {};
        }

        create() {
            if (this.html) return;

            this.html = $(`<div class="new-interface-info">
                <div class="new-interface-info__body">
                    <div class="new-interface-info__head"></div>
                    <div class="new-interface-info__title"></div>
                    <div class="new-interface-info__details"></div>
                    <div class="new-interface-info__description"></div>
                </div>
            </div>`);
        }

        render(js) {
            if (!this.html) this.create();
            return js ? this.html[0] : this.html;
        }

        update(data) {
            if (!data) return;
            if (!this.html) this.create();

            this.html.find('.new-interface-info__head,.new-interface-info__details').text('---');
            
            // Логотип вместо названия (только если включена настройка)
            if (Lampa.Storage.get("logo_card_style") !== false) {
                var type = data.name ? 'tv' : "movie";
                var apiKey = Lampa.TMDB.key();
                var imagesUrl = Lampa.TMDB.api(type + '/' + data.id + "/images?api_key=" + apiKey + "&language=" + Lampa.Storage.get("language"));
                
                $.get(imagesUrl, (imagesData) => {
                    if (imagesData.logos && imagesData.logos[0]) {
                        var logoPath = imagesData.logos[0].file_path;
                        if (logoPath !== '') {
                            var logoUrl = Lampa.TMDB.image('t/p/w500' + logoPath.replace(".svg", ".png"));
                            var style = Lampa.Storage.get('desc') !== false ? 
                                "margin-top: 0.3em; margin-bottom: 0.1em; max-height: 1.8em; max-width: 6.8em;" : 
                                "margin-top: 0.3em; margin-bottom: 0.1em; max-height: 2.8em; max-width: 6.8em;";
                            
                            this.html.find(".new-interface-info__title").html(`<img style="${style}" src="${logoUrl}" />`);
                        } else {
                            this.html.find(".new-interface-info__title").text(data.title || data.name || '');
                        }
                    } else {
                        this.html.find('.new-interface-info__title').text(data.title || data.name || '');
                    }
                });
            } else {
                this.html.find(".new-interface-info__title").text(data.title || data.name || '');
            }

            // Описание
            if (Lampa.Storage.get("desc") !== false) {
                this.html.find('.new-interface-info__description').text(data.overview || Lampa.Lang.translate('full_notext'));
            }

            Lampa.Background.change(Lampa.Utils.cardImgBackground(data));
            this.load(data);
        }

        load(data) {
            if (!data || !data.id) return;

            const source = data.source || 'tmdb';
            if (source !== 'tmdb' && source !== 'cub') return;
            if (!Lampa.TMDB || typeof Lampa.TMDB.api !== 'function' || typeof Lampa.TMDB.key !== 'function') return;

            const type = data.media_type === 'tv' || data.name ? 'tv' : 'movie';
            const language = Lampa.Storage.get('language');
            const url = Lampa.TMDB.api(`${type}/${data.id}?api_key=${Lampa.TMDB.key()}&append_to_response=content_ratings,release_dates&language=${language}`);

            this.currentUrl = url;

            if (this.loaded[url]) {
                this.draw(this.loaded[url]);
                return;
            }

            clearTimeout(this.timer);

            this.timer = setTimeout(() => {
                this.network.clear();
                this.network.timeout(5000);
                this.network.silent(url, (movie) => {
                    this.loaded[url] = movie;
                    if (this.currentUrl === url) this.draw(movie);
                });
            }, 300);
        }

        draw(movie) {
            if (!movie || !this.html) return;

            const create = ((movie.release_date || movie.first_air_date || '0000') + '').slice(0, 4);
            const vote = parseFloat((movie.vote_average || 0) + '').toFixed(1);
            const head = [];
            const details = [];
            const sources = Lampa.Api && Lampa.Api.sources && Lampa.Api.sources.tmdb ? Lampa.Api.sources.tmdb : null;
            const countries = sources && typeof sources.parseCountries === 'function' ? sources.parseCountries(movie) : [];
            const pg = sources && typeof sources.parsePG === 'function' ? sources.parsePG(movie) : '';

            if (create !== '0000') head.push(`<span>${create}</span>`);
            if (countries && countries.length) head.push(countries.join(', '));

            // Рейтинг
            if (Lampa.Storage.get("rat") !== false) {
                if (vote > 0) {
                    details.push(`<div class="full-start__rate"><div>${vote}</div><div>TMDB</div></div>`);
                }
            }

            // Жанры
            if (Lampa.Storage.get('ganr') !== false) {
                if (Array.isArray(movie.genres) && movie.genres.length) {
                    details.push(movie.genres.map((item) => Lampa.Utils.capitalizeFirstLetter(item.name)).join(' | '));
                }
            }

            // Время
            if (Lampa.Storage.get("vremya") !== false) {
                if (movie.runtime) details.push(Lampa.Utils.secondsToTime(movie.runtime * 60, true));
            }

            // Количество сезонов
            if (Lampa.Storage.get('seas') !== false) {
                if (movie.number_of_seasons) {
                    details.push(`<span class="full-start__pg" style="font-size: 0.9em;">Сезонов ${movie.number_of_seasons}</span>`);
                }
            }

            // Количество эпизодов
            if (Lampa.Storage.get("eps") !== false) {
                if (movie.number_of_episodes) {
                    details.push(`<span class="full-start__pg" style="font-size: 0.9em;">Эпизодов ${movie.number_of_episodes}</span>`);
                }
            }

            // Возрастное ограничение
            if (Lampa.Storage.get("year_ogr") !== false) {
                if (pg) details.push(`<span class="full-start__pg" style="font-size: 0.9em;">${pg}</span>`);
            }

            // Статус
            if (Lampa.Storage.get("status") !== false) {
                var statusText = '';
                if (movie.status) {
                    switch (movie.status.toLowerCase()) {
                        case "released":
                            statusText = 'Выпущенный';
                            break;
                        case 'ended':
                            statusText = "Закончен";
                            break;
                        case "returning series":
                            statusText = 'Онгоинг';
                            break;
                        case "canceled":
                            statusText = "Отменено";
                            break;
                        case "post production":
                            statusText = 'Скоро';
                            break;
                        case 'planned':
                            statusText = 'Запланировано';
                            break;
                        case "in production":
                            statusText = "В производстве";
                            break;
                        default:
                            statusText = movie.status;
                            break;
                    }
                }
                if (statusText) {
                    details.push(`<span class="full-start__status" style="font-size: 0.9em;">${statusText}</span>`);
                }
            }

            this.html.find('.new-interface-info__head').empty().append(head.join(', '));
            this.html.find('.new-interface-info__details').html(details.join('<span class="new-interface-info__split">&#9679;</span>'));
        }

        empty() {
            if (!this.html) return;
            this.html.find('.new-interface-info__head,.new-interface-info__details').text('---');
        }

        destroy() {
            clearTimeout(this.timer);
            this.network.clear();
            this.loaded = {};
            this.currentUrl = null;

            if (this.html) {
                this.html.remove();
                this.html = null;
            }
        }
    }

    function addStyleV3() {
        if (addStyleV3.added) return;
        addStyleV3.added = true;

        const widePost = Lampa.Storage.get("wide_post") == true;
        
        if (widePost) {
            // Стили для широких постеров (без названий под постерами)
            Lampa.Template.add('new_interface_style_v3', `<style>
            .new-interface {
                position: relative;
            }

            .new-interface .card.card--wide {
                width: 18.3em;
            }

            .new-interface .card.card--small {
                width: 13.3em;
            }

            .new-interface-info {
                position: relative;
                padding: 1.5em;
                height: 26em;
            }

            .new-interface-info__body {
                width: 80%;
                padding-top: 1.1em;
            }

            .new-interface-info__head {
                color: rgba(255, 255, 255, 0.6);
                margin-bottom: 1em;
                font-size: 1.3em;
                min-height: 1em;
            }

            .new-interface-info__head span {
                color: #fff;
            }

            .new-interface-info__title {
                font-size: 4em;
                font-weight: 600;
                margin-bottom: 0.3em;
                overflow: hidden;
                -o-text-overflow: '.';
                text-overflow: '.';
                display: -webkit-box;
                -webkit-line-clamp: 1;
                line-clamp: 1;
                -webkit-box-orient: vertical;
                margin-left: -0.03em;
                line-height: 1.3;
            }

            .new-interface-info__details {
                margin-bottom: 1.6em;
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                min-height: 1.9em;
                font-size: 1.3em;
            }

            .new-interface-info__split {
                margin: 0 1em;
                font-size: 0.7em;
            }

            .new-interface-info__description {
                font-size: 1.4em;
                font-weight: 310;
                line-height: 1.3;
                overflow: hidden;
                -o-text-overflow: '.';
                text-overflow: '.';
                display: -webkit-box;
                -webkit-line-clamp: 3;
                line-clamp: 3;
                -webkit-box-orient: vertical;
                width: 65%;
            }

            .new-interface .card-more__box {
                padding-bottom: 95%;
            }

            .new-interface .full-start__background {
                height: 108%;
                top: -5em;
            }

            .new-interface .full-start__rate {
                font-size: 1.3em;
                margin-right: 0;
            }

            .new-interface .card__promo {
                display: none;
            }

            .new-interface .card.card--wide + .card-more .card-more__box {
                padding-bottom: 95%;
            }

            .new-interface .card.card--small + .card-more .card-more__box {
                padding-bottom: 150%;
            }

            .new-interface .card.card--wide .card-watched {
                display: none !important;
            }

            .new-interface .card.card--small .card-watched {
                display: none !important;
            }

            body.light--version .new-interface-info__body {
                width: 69%;
                padding-top: 1.5em;
            }

            body.light--version .new-interface-info {
                height: 25.3em;
            }

            body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.focus .card__view {
                animation: animation-card-focus 0.2s;
            }

            body.advanced--animation:not(.no--animation) .new-interface .card.card--small.focus .card__view {
                animation: animation-card-focus 0.2s;
            }

            body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.animate-trigger-enter .card__view {
                animation: animation-trigger-enter 0.2s forwards;
            }

            body.advanced--animation:not(.no--animation) .new-interface .card.card--small.animate-trigger-enter .card__view {
                animation: animation-trigger-enter 0.2s forwards;
            }
            </style>`);
        } else {
            // Стили для обычных (вертикальных) постеров (без названий под постерами)
            Lampa.Template.add('new_interface_style_v3', `<style>
            .new-interface {
                position: relative;
            }

            .new-interface .card.card--wide {
                width: 18.3em;
            }

            .new-interface .card.card--small {
                width: 13.3em;
            }

            .new-interface-info {
                position: relative;
                padding: 1.5em;
                height: 20.4em;
            }

            .new-interface-info__body {
                width: 80%;
                padding-top: 0.2em;
            }

            .new-interface-info__head {
                color: rgba(255, 255, 255, 0.6);
                margin-bottom: 0.3em;
                font-size: 1.3em;
                min-height: 1em;
            }

            .new-interface-info__head span {
                color: #fff;
            }

            .new-interface-info__title {
                font-size: 4em;
                font-weight: 600;
                margin-bottom: 0.2em;
                overflow: hidden;
                -o-text-overflow: '.';
                text-overflow: '.';
                display: -webkit-box;
                -webkit-line-clamp: 1;
                line-clamp: 1;
                -webkit-box-orient: vertical;
                margin-left: -0.03em;
                line-height: 1.3;
            }

            .new-interface-info__details {
                margin-bottom: 1.6em;
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                min-height: 1.9em;
                font-size: 1.3em;
            }

            .new-interface-info__split {
                margin: 0 1em;
                font-size: 0.7em;
            }

            .new-interface-info__description {
                font-size: 1.4em;
                font-weight: 310;
                line-height: 1.3;
                overflow: hidden;
                -o-text-overflow: '.';
                text-overflow: '.';
                display: -webkit-box;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                -webkit-box-orient: vertical;
                width: 70%;
            }

            .new-interface .card-more__box {
                padding-bottom: 150%;
            }

            .new-interface .full-start__background {
                height: 108%;
                top: -5em;
            }

            .new-interface .full-start__rate {
                font-size: 1.3em;
                margin-right: 0;
            }

            .new-interface .card__promo {
                display: none;
            }

            .new-interface .card.card--wide + .card-more .card-more__box {
                padding-bottom: 95%;
            }

            .new-interface .card.card--small + .card-more .card-more__box {
                padding-bottom: 150%;
            }

            .new-interface .card.card--wide .card-watched {
                display: none !important;
            }

            .new-interface .card.card--small .card-watched {
                display: none !important;
            }

            /* Скрываем названия под постерами */
            .new-interface .card .card__title {
                display: none !important;
            }

            /* Скрываем год под постерами */
            .new-interface .card .card__age {
                display: none !important;
            }

            body.light--version .new-interface-info__body {
                width: 69%;
                padding-top: 1.5em;
            }

            body.light--version .new-interface-info {
                height: 25.3em;
            }

            body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.focus .card__view {
                animation: animation-card-focus 0.2s;
            }

            body.advanced--animation:not(.no--animation) .new-interface .card.card--small.focus .card__view {
                animation: animation-card-focus 0.2s;
            }

            body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.animate-trigger-enter .card__view {
                animation: animation-trigger-enter 0.2s forwards;
            }

            body.advanced--animation:not(.no--animation) .new-interface .card.card--small.animate-trigger-enter .card__view {
                animation: animation-trigger-enter 0.2s forwards;
            }
            </style>`);
        }

        $('body').append(Lampa.Template.get('new_interface_style_v3', {}, true));
    }

    function addSettingsV3() {
        // Настройки для плагина
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name == 'main') {
                if (Lampa.Settings.main().render().find("[data-component=\"style_interface\"]").length == 0) {
                    Lampa.SettingsApi.addComponent({
                        'component': "style_interface",
                        'name': "Стильный интерфейс"
                    });
                }
                Lampa.Settings.main().update();
                Lampa.Settings.main().render().find("[data-component=\"style_interface\"]").addClass('hide');
            }
        });

        // Добавление параметров настроек
        const settings = [
            { name: "wide_post", label: "Широкие постеры", default: true },
            { name: "logo_card_style", label: "Логотип вместо названия", default: true },
            { name: "desc", label: "Показывать описание", default: true },
            { name: "status", label: "Показывать статус фильма/сериала", default: true },
            { name: "seas", label: "Показывать количество сезонов", default: false },
            { name: "eps", label: "Показывать количество эпизодов", default: false },
            { name: "year_ogr", label: "Показывать возрастное ограничение", default: true },
            { name: "vremya", label: "Показывать время фильма", default: true },
            { name: "ganr", label: "Показывать жанр фильма", default: true },
            { name: "rat", label: "Показывать рейтинг фильма", default: true }
        ];

        // Основной параметр интерфейса
        Lampa.SettingsApi.addParam({
            'component': "interface",
            'param': {
                'name': "style_interface",
                'type': "static",
                'default': true
            },
            'field': {
                'name': "Стильный интерфейс",
                'description': "Настройки элементов"
            },
            'onRender': function (element) {
                setTimeout(function () {
                    $(".settings-param > div:contains(\"Стильный интерфейс\")").parent().insertAfter($("div[data-name=\"interface_size\"]"));
                }, 20);
                element.on('hover:enter', function () {
                    Lampa.Settings.create('style_interface');
                    Lampa.Controller.enabled().controller.back = function () {
                        Lampa.Settings.create("interface");
                    };
                });
            }
        });

        // Добавление всех параметров настроек
        settings.forEach(setting => {
            Lampa.SettingsApi.addParam({
                'component': "style_interface",
                'param': {
                    'name': setting.name,
                    'type': "trigger",
                    'default': setting.default
                },
                'field': {
                    'name': setting.label
                }
            });
        });

        // Слушатель изменений настроек
        Lampa.Storage.listener.follow('change', function(key, value) {
            if (key === 'wide_post') {
                // При изменении настройки wide_post перезагружаем стили
                if (addStyleV3.added) {
                    // Удаляем старые стили
                    $('style').filter(function() {
                        return $(this).text().includes('new-interface-style_v3');
                    }).remove();
                    
                    // Сбрасываем флаг добавления стилей
                    addStyleV3.added = false;
                    
                    // Добавляем новые стили
                    addStyleV3();
                    
                    // Перезагружаем страницу для применения изменений
                    setTimeout(() => {
                        location.reload();
                    }, 100);
                }
            }
        });

        // Инициализация настроек по умолчанию
        var initCheck = setInterval(function () {
            if (typeof Lampa !== "undefined") {
                clearInterval(initCheck);
                if (!Lampa.Storage.get("int_plug", 'false')) {
                    initDefaultSettings();
                }
            }
        }, 200);

        function initDefaultSettings() {
            Lampa.Storage.set("int_plug", "true");
            Lampa.Storage.set("wide_post", 'true');
            Lampa.Storage.set("logo_card_style", "true");
            Lampa.Storage.set("desc", "true");
            Lampa.Storage.set("status", 'true');
            Lampa.Storage.set('seas', "false");
            Lampa.Storage.set('eps', "false");
            Lampa.Storage.set("year_ogr", "true");
            Lampa.Storage.set('vremya', 'true');
            Lampa.Storage.set('ganr', 'true');
            Lampa.Storage.set('rat', "true");
        }
    }

    function wrap(target, method, handler) {
        if (!target) return;
        const original = typeof target[method] === 'function' ? target[method] : null;
        target[method] = function (...args) {
            return handler.call(this, original, args);
        };
    }

    // ==================== ЛЕГАСИ ВЕРСИЯ (для Lampa < 3.0) ====================
    function startPluginLegacy() {
        if (window.plugin_interface_ready) return;
        window.plugin_interface_ready = true;

        const old_interface = Lampa.InteractionMain;
        const new_interface = NewInterfaceLegacy;

        Lampa.InteractionMain = function (object) {
            let use = new_interface;
            
            if (window.innerWidth < 767) use = old_interface;
            if (Lampa.Manifest.app_digital < 153) use = old_interface;
            if (Lampa.Platform.screen("mobile")) use = old_interface;
            if (object.title === "Избранное") use = old_interface;
            
            return new use(object);
        };

        addStyleLegacy();
        addSettingsLegacy();
    }

    function NewInterfaceLegacy(config) {
        var request = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({
            'mask': true,
            'over': true,
            'scroll_by_item': true
        });
        var items = [];
        var container = $(`<div class="new-interface"><img class="full-start__background"></div>`);
        var currentIndex = 0;
        var isNewVersion = Lampa.Manifest.app_digital >= 166;
        var infoPanel;
        var dataItems;
        var isWideView = Lampa.Storage.field("card_views_type") == "view" || Lampa.Storage.field("navigation_type") == "mouse";
        var background = container.find('.full-start__background');
        var currentBackground = '';
        var backgroundTimeout;

        this.create = function () {};

        this.empty = function () {
            var footer;
            if (config.source == 'tmdb') {
                footer = $(`<div class="empty__footer"><div class="simple-button selector">${Lampa.Lang.translate("change_source_on_cub")}</div></div>`);
                footer.find(".selector").on('hover:enter', function () {
                    Lampa.Storage.set("source", "cub");
                    Lampa.Activity.replace({
                        'source': 'cub'
                    });
                });
            }

            var emptyView = new Lampa.Empty();
            container.append(emptyView.render(footer));
            this.start = emptyView.start;
            this.activity.loader(false);
            this.activity.toggle();
        };

        this.loadNext = function () {
            var self = this;
            if (this.next && !this.next_wait && items.length) {
                this.next_wait = true;
                this.next(function (newItems) {
                    self.next_wait = false;
                    newItems.forEach(self.append.bind(self));
                    Lampa.Layer.visible(items[currentIndex + 1].render(true));
                }, function () {
                    self.next_wait = false;
                });
            }
        };

        this.push = function () {};

        this.build = function (itemsData) {
            var self = this;
            dataItems = itemsData;
            infoPanel = new InterfaceInfoLegacy(config);
            infoPanel.create();

            scroll.minus(infoPanel.render());
            itemsData.slice(0, isWideView ? itemsData.length : 2).forEach(this.append.bind(this));

            container.append(infoPanel.render());
            container.append(scroll.render());

            if (isNewVersion) {
                Lampa.Layer.update(container);
                Lampa.Layer.visible(scroll.render(true));
                scroll.onEnd = this.loadNext.bind(this);
                scroll.onWheel = function (direction) {
                    if (!Lampa.Controller.own(self)) {
                        self.start();
                    }
                    if (direction > 0) {
                        self.down();
                    } else {
                        if (currentIndex > 0) {
                            self.up();
                        }
                    }
                };
            }

            this.activity.loader(false);
            this.activity.toggle();
        };

        this.background = function (data) {
            var backgroundUrl = Lampa.Api.img(data.backdrop_path, "w1280");
            clearTimeout(backgroundTimeout);
            
            if (backgroundUrl == currentBackground) {
                return;
            }

            backgroundTimeout = setTimeout(function () {
                background.removeClass("loaded");
                background[0].onload = function () {
                    background.addClass("loaded");
                };
                background[0].onerror = function () {
                    background.removeClass("loaded");
                };
                currentBackground = backgroundUrl;
                setTimeout(function () {
                    background[0].src = currentBackground;
                }, 50);
            }, 100);
        };

        this.append = function (itemData) {
            var self = this;
            if (itemData.ready) {
                return;
            }
            itemData.ready = true;

            var item = new Lampa.InteractionLine(itemData, {
                'url': itemData.url,
                'card_small': true,
                'cardClass': itemData.cardClass,
                'genres': config.genres,
                'object': config,
                'card_wide': Lampa.Storage.field("wide_post"),
                'nomore': itemData.nomore,
            });

            item.create();
            item.onDown = this.down.bind(this);
            item.onUp = this.up.bind(this);
            item.onBack = this.back.bind(this);
            item.onToggle = function () {
                currentIndex = items.indexOf(item);
            };

            if (this.onMore) {
                item.onMore = this.onMore.bind(this);
            }

            item.onFocus = function (data) {
                infoPanel.update(data);
                self.background(data);
            };

            item.onHover = function (data) {
                infoPanel.update(data);
                self.background(data);
            };

            item.onFocusMore = infoPanel.empty.bind(infoPanel);
            scroll.append(item.render());
            items.push(item);
        };

        this.back = function () {
            Lampa.Activity.backward();
        };

        this.down = function () {
            currentIndex++;
            currentIndex = Math.min(currentIndex, items.length - 1);
            
            if (!isWideView) {
                dataItems.slice(0, currentIndex + 2).forEach(this.append.bind(this));
            }
            
            items[currentIndex].toggle();
            scroll.update(items[currentIndex].render());
        };

        this.up = function () {
            currentIndex--;
            if (currentIndex < 0) {
                currentIndex = 0;
                Lampa.Controller.toggle("head");
            } else {
                items[currentIndex].toggle();
                scroll.update(items[currentIndex].render());
            }
        };

        this.start = function () {
            var self = this;
            Lampa.Controller.add("content", {
                'link': this,
                'toggle': function () {
                    if (self.activity.canRefresh()) {
                        return false;
                    }
                    if (items.length) {
                        items[currentIndex].toggle();
                    }
                },
                'update': function () {},
                'left': function () {
                    if (Navigator.canmove("left")) {
                        Navigator.move('left');
                    } else {
                        Lampa.Controller.toggle("menu");
                    }
                },
                'right': function () {
                    Navigator.move("right");
                },
                'up': function () {
                    if (Navigator.canmove('up')) {
                        Navigator.move('up');
                    } else {
                        Lampa.Controller.toggle("head");
                    }
                },
                'down': function () {
                    if (Navigator.canmove('down')) {
                        Navigator.move('down');
                    }
                },
                'back': this.back
            });
            Lampa.Controller.toggle("content");
        };

        this.refresh = function () {
            this.activity.loader(true);
            this.activity.need_refresh = true;
        };

        this.pause = function () {};

        this.stop = function () {};

        this.render = function () {
            return container;
        };

        this.destroy = function () {
            request.clear();
            Lampa.Arrays.destroy(items);
            scroll.destroy();
            if (infoPanel) {
                infoPanel.destroy();
            }
            container.remove();
            items = null;
            request = null;
            dataItems = null;
        };
    }

    function InterfaceInfoLegacy() {
        var element;
        var timeoutId;
        var request = new Lampa.Reguest();
        var cache = {};

        this.create = function () {
            element = $(`<div class="new-interface-info">
                <div class="new-interface-info__body">
                    <div class="new-interface-info__head"></div>
                    <div class="new-interface-info__title"></div>
                    <div class="new-interface-info__details"></div>
                    <div class="new-interface-info__description"></div>
                </div>
            </div>`);
        };

        this.update = function (data) {
            element.find(".new-interface-info__head, .new-interface-info__details").text("---");
            
            if (Lampa.Storage.get("logo_card_style") !== false) {
                var type = data.name ? 'tv' : "movie";
                var apiKey = Lampa.TMDB.key();
                var imagesUrl = Lampa.TMDB.api(type + '/' + data.id + "/images?api_key=" + apiKey + "&language=" + Lampa.Storage.get("language"));
                
                $.get(imagesUrl, function (imagesData) {
                    if (imagesData.logos && imagesData.logos[0]) {
                        var logoPath = imagesData.logos[0].file_path;
                        if (logoPath !== '') {
                            var logoUrl = Lampa.TMDB.image('t/p/w500' + logoPath.replace(".svg", ".png"));
                            var style = Lampa.Storage.get('desc') !== false ? 
                                "margin-top: 0.3em; margin-bottom: 0.1em; max-height: 1.8em; max-width: 6.8em;" : 
                                "margin-top: 0.3em; margin-bottom: 0.1em; max-height: 2.8em; max-width: 6.8em;";
                            
                            element.find(".new-interface-info__title").html(`<img style="${style}" src="${logoUrl}" />`);
                        } else {
                            element.find(".new-interface-info__title").text(data.title);
                        }
                    } else {
                        element.find('.new-interface-info__title').text(data.title);
                    }
                });
            } else {
                element.find(".new-interface-info__title").text(data.title);
            }

            if (Lampa.Storage.get("desc") !== false) {
                element.find(".new-interface-info__description").text(data.overview || Lampa.Lang.translate('full_notext'));
            }

            Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200'));
            this.load(data);
        };

        this.draw = function (data) {
            var year = ((data.release_date || data.first_air_date || "0000") + '').slice(0, 4);
            var rating = parseFloat((data.vote_average || 0) + '').toFixed(1);
            var headerItems = [];
            var detailsItems = [];
            var countries = Lampa.Api.sources.tmdb.parseCountries(data);
            var ageRating = Lampa.Api.sources.tmdb.parsePG(data);

            if (year !== "0000") {
                headerItems.push("<span>" + year + "</span>");
            }

            if (countries.length > 0) {
                headerItems.push(countries.join(", "));
            }

            if (Lampa.Storage.get("rat") !== false) {
                if (rating > 0) {
                    detailsItems.push(`<div class="full-start__rate"><div>${rating}</div><div>TMDB</div></div>`);
                }
            }

            if (Lampa.Storage.get('ganr') !== false) {
                if (data.genres && data.genres.length > 0) {
                    detailsItems.push(data.genres.map(function (genre) {
                        return Lampa.Utils.capitalizeFirstLetter(genre.name);
                    }).join(" | "));
                }
            }

            if (Lampa.Storage.get("vremya") !== false) {
                if (data.runtime) {
                    detailsItems.push(Lampa.Utils.secondsToTime(data.runtime * 60, true));
                }
            }

            if (Lampa.Storage.get('seas') !== false) {
                if (data.number_of_seasons) {
                    detailsItems.push(`<span class="full-start__pg" style="font-size: 0.9em;">Сезонов ${data.number_of_seasons}</span>`);
                }
            }

            if (Lampa.Storage.get("eps") !== false) {
                if (data.number_of_episodes) {
                    detailsItems.push(`<span class="full-start__pg" style="font-size: 0.9em;">Эпизодов ${data.number_of_episodes}</span>`);
                }
            }

            if (Lampa.Storage.get("year_ogr") !== false) {
                if (ageRating) {
                    detailsItems.push(`<span class="full-start__pg" style="font-size: 0.9em;">${ageRating}</span>`);
                }
            }

            if (Lampa.Storage.get("status") !== false) {
                var statusText = '';
                if (data.status) {
                    switch (data.status.toLowerCase()) {
                        case "released":
                            statusText = 'Выпущенный';
                            break;
                        case 'ended':
                            statusText = "Закончен";
                            break;
                        case "returning series":
                            statusText = 'Онгоинг';
                            break;
                        case "canceled":
                            statusText = "Отменено";
                            break;
                        case "post production":
                            statusText = 'Скоро';
                            break;
                        case 'planned':
                            statusText = 'Запланировано';
                            break;
                        case "in production":
                            statusText = "В производстве";
                            break;
                        default:
                            statusText = data.status;
                            break;
                    }
                }
                if (statusText) {
                    detailsItems.push(`<span class="full-start__status" style="font-size: 0.9em;">${statusText}</span>`);
                }
            }

            element.find(".new-interface-info__head").empty().append(headerItems.join(", "));
            element.find(".new-interface-info__details").html(detailsItems.join(`<span class="new-interface-info__split">&#9679;</span>`));
        };

        this.load = function (data) {
            var self = this;
            clearTimeout(timeoutId);
            
            var type = data.name ? 'tv' : "movie";
            var detailsUrl = Lampa.TMDB.api(type + '/' + data.id + "?api_key=" + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get("language"));
            
            if (cache[detailsUrl]) {
                return this.draw(cache[detailsUrl]);
            }

            timeoutId = setTimeout(function () {
                request.clear();
                request.timeout(5000);
                request.silent(detailsUrl, function (detailsData) {
                    cache[detailsUrl] = detailsData;
                    self.draw(detailsData);
                });
            }, 300);
        };

        this.render = function () {
            return element;
        };

        this.empty = function () {};

        this.destroy = function () {
            element.remove();
            cache = {};
            element = null;
        };
    }

    function addStyleLegacy() {
        if (addStyleLegacy.added) return;
        addStyleLegacy.added = true;

        const widePost = Lampa.Storage.get("wide_post") == true;
        
        if (widePost) {
            // CSS стили для широких постеров (без названий под постерами)
            Lampa.Template.add("new_interface_style", `
            <style>
            .new-interface .card--small.card--wide {
                width: 18.3em;
            }
            
            .new-interface .card--small.card--small {
                width: 13.3em;
            }
            
            .new-interface-info {
                position: relative;
                padding: 1.5em;
                height: 26em;
            }
            
            .new-interface-info__body {
                width: 80%;
                padding-top: 1.1em;
            }
            
            .new-interface-info__head {
                color: rgba(255, 255, 255, 0.6);
                margin-bottom: 1em;
                font-size: 1.3em;
                min-height: 1em;
            }
            
            .new-interface-info__head span {
                color: #fff;
            }
            
            .new-interface-info__title {
                font-size: 4em;
                font-weight: 600;
                margin-bottom: 0.3em;
                overflow: hidden;
                -o-text-overflow: ".";
                text-overflow: ".";
                display: -webkit-box;
                -webkit-line-clamp: 1;
                line-clamp: 1;
                -webkit-box-orient: vertical;
                margin-left: -0.03em;
                line-height: 1.3;
            }
            
            .new-interface-info__details {
                margin-bottom: 1.6em;
                display: -webkit-box;
                display: -webkit-flex;
                display: -moz-box;
                display: -ms-flexbox;
                display: flex;
                -webkit-box-align: center;
                -webkit-align-items: center;
                -moz-box-align: center;
                -ms-flex-align: center;
                align-items: center;
                -webkit-flex-wrap: wrap;
                -ms-flex-wrap: wrap;
                flex-wrap: wrap;
                min-height: 1.9em;
                font-size: 1.3em;
            }
            
            .new-interface-info__split {
                margin: 0 1em;
                font-size: 0.7em;
            }
            
            .new-interface-info__description {
                font-size: 1.4em;
                font-weight: 310;
                line-height: 1.3;
                overflow: hidden;
                -o-text-overflow: ".";
                text-overflow: ".";
                display: -webkit-box;
                -webkit-line-clamp: 3;
                line-clamp: 3;
                -webkit-box-orient: vertical;
                width: 65%;
            }
            
            .new-interface .card-more__box {
                padding-bottom: 95%;
            }
            
            .new-interface .full-start__background {
                height: 108%;
                top: -5em;
            }
            
            .new-interface .full-start__rate {
                font-size: 1.3em;
                margin-right: 0;
            }
            
            .new-interface .card__promo {
                display: none;
            }
            
            .new-interface .card.card--wide+.card-more .card-more__box {
                padding-bottom: 95%;
            }
            
            .new-interface .card.card--small+.card-more .card-more__box {
                padding-bottom: 150%;
            }
            
            .new-interface .card.card--wide .card-watched {
                display: none !important;
            }
            
            .new-interface .card.card--small .card-watched {
                display: none !important;
            }
            
            body.light--version .new-interface-info__body {
                width: 69%;
                padding-top: 1.5em;
            }
            
            body.light--version .new-interface-info {
                height: 25.3em;
            }

            body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.focus .card__view{
                animation: animation-card-focus 0.2s
            }
            body.advanced--animation:not(.no--animation) .new-interface .card--small.card--small.focus .card__view{
                animation: animation-card-focus 0.2s
            }
            body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.animate-trigger-enter .card__view{
                animation: animation-trigger-enter 0.2s forwards
            }
            body.advanced--animation:not(.no--animation) .new-interface .card--small.card--small.animate-trigger-enter .card__view{
                animation: animation-trigger-enter 0.2s forwards
            }
            </style>
        `);
        } else {
            // CSS стили для обычных (вертикальных) постеров (без названий под постерами)
            Lampa.Template.add('new_interface_style', `
            <style>
            .new-interface .card--small.card--wide {
                width: 18.3em;
            }
            
            .new-interface .card--small.card--small {
                width: 13.3em;
            }
            
            .new-interface-info {
                position: relative;
                padding: 1.5em;
                height: 20.4em;
            }
            
            .new-interface-info__body {
                width: 80%;
                padding-top: 0.2em;
            }
            
            .new-interface-info__head {
                color: rgba(255, 255, 255, 0.6);
                margin-bottom: 0.3em;
                font-size: 1.3em;
                min-height: 1em;
            }
            
            .new-interface-info__head span {
                color: #fff;
            }
            
            .new-interface-info__title {
                font-size: 4em;
                font-weight: 600;
                margin-bottom: 0.2em;
                overflow: hidden;
                -o-text-overflow: ".";
                text-overflow: ".";
                display: -webkit-box;
                -webkit-line-clamp: 1;
                line-clamp: 1;
                -webkit-box-orient: vertical;
                margin-left: -0.03em;
                line-height: 1.3;
            }
            
            .new-interface-info__details {
                margin-bottom: 1.6em;
                display: -webkit-box;
                display: -webkit-flex;
                display: -moz-box;
                display: -ms-flexbox;
                display: flex;
                -webkit-box-align: center;
                -webkit-align-items: center;
                -moz-box-align: center;
                -ms-flex-align: center;
                align-items: center;
                -webkit-flex-wrap: wrap;
                -ms-flex-wrap: wrap;
                flex-wrap: wrap;
                min-height: 1.9em;
                font-size: 1.3em;
            }
            
            .new-interface-info__split {
                margin: 0 1em;
                font-size: 0.7em;
            }
            
            .new-interface-info__description {
                font-size: 1.4em;
                font-weight: 310;
                line-height: 1.3;
                overflow: hidden;
                -o-text-overflow: ".";
                text-overflow: ".";
                display: -webkit-box;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                -webkit-box-orient: vertical;
                width: 70%;
            }
            
            .new-interface .card-more__box {
                padding-bottom: 150%;
            }
            
            .new-interface .full-start__background {
                height: 108%;
                top: -5em;
            }
            
            .new-interface .full-start__rate {
                font-size: 1.3em;
                margin-right: 0;
            }
            
            .new-interface .card__promo {
                display: none;
            }
            
            .new-interface .card.card--wide+.card-more .card-more__box {
                padding-bottom: 95%;
            }
            
            .new-interface .card.card--small+.card-more .card-more__box {
                padding-bottom: 150%;
            }
            
            .new-interface .card.card--wide .card-watched {
                display: none !important;
            }
            
            .new-interface .card.card--small .card-watched {
                display: none !important;
            }
                        
            body.light--version .new-interface-info__body {
                width: 69%;
                padding-top: 1.5em;
            }
            
            body.light--version .new-interface-info {
                height: 25.3em;
            }

            body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.focus .card__view{
                animation: animation-card-focus 0.2s
            }
            body.advanced--animation:not(.no--animation) .new-interface .card--small.card--small.focus .card__view{
                animation: animation-card-focus 0.2s
            }
            body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.animate-trigger-enter .card__view{
                animation: animation-trigger-enter 0.2s forwards
            }
            body.advanced--animation:not(.no--animation) .new-interface .card--small.card--small.animate-trigger-enter .card__view{
                animation: animation-trigger-enter 0.2s forwards
            }
            </style>
        `);
        }

        $("body").append(Lampa.Template.get("new_interface_style", {}, true));
    }

    function addSettingsLegacy() {
        // Настройки для плагина
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name == 'main') {
                if (Lampa.Settings.main().render().find("[data-component=\"style_interface\"]").length == 0) {
                    Lampa.SettingsApi.addComponent({
                        'component': "style_interface",
                        'name': "Стильный интерфейс"
                    });
                }
                Lampa.Settings.main().update();
                Lampa.Settings.main().render().find("[data-component=\"style_interface\"]").addClass('hide');
            }
        });

        // Добавление параметров настроек
        const settings = [
            { name: "wide_post", label: "Широкие постеры", default: true },
            { name: "logo_card_style", label: "Логотип вместо названия", default: true },
            { name: "desc", label: "Показывать описание", default: true },
            { name: "status", label: "Показывать статус фильма/сериала", default: true },
            { name: "seas", label: "Показывать количество сезонов", default: false },
            { name: "eps", label: "Показывать количество эпизодов", default: false },
            { name: "year_ogr", label: "Показывать возрастное ограничение", default: true },
            { name: "vremya", label: "Показывать время фильма", default: true },
            { name: "ganr", label: "Показывать жанр фильма", default: true },
            { name: "rat", label: "Показывать рейтинг фильма", default: true }
        ];

        // Основной параметр интерфейса
        Lampa.SettingsApi.addParam({
            'component': "interface",
            'param': {
                'name': "style_interface",
                'type': "static",
                'default': true
            },
            'field': {
                'name': "Стильный интерфейс",
                'description': "Настройки элементов"
            },
            'onRender': function (element) {
                setTimeout(function () {
                    $(".settings-param > div:contains(\"Стильный интерфейс\")").parent().insertAfter($("div[data-name=\"interface_size\"]"));
                }, 20);
                element.on('hover:enter', function () {
                    Lampa.Settings.create('style_interface');
                    Lampa.Controller.enabled().controller.back = function () {
                        Lampa.Settings.create("interface");
                    };
                });
            }
        });

        // Добавление всех параметров настроек
        settings.forEach(setting => {
            Lampa.SettingsApi.addParam({
                'component': "style_interface",
                'param': {
                    'name': setting.name,
                    'type': "trigger",
                    'default': setting.default
                },
                'field': {
                    'name': setting.label
                }
            });
        });

        // Слушатель изменений настроек (для legacy версии)
        Lampa.Storage.listener.follow('change', function(key, value) {
            if (key === 'wide_post') {
                // При изменении настройки wide_post перезагружаем страницу
                setTimeout(() => {
                    location.reload();
                }, 100);
            }
        });

        // Инициализация настроек по умолчанию
        var initCheck = setInterval(function () {
            if (typeof Lampa !== "undefined") {
                clearInterval(initCheck);
                if (!Lampa.Storage.get("int_plug", 'false')) {
                    initDefaultSettings();
                }
            }
        }, 200);

        function initDefaultSettings() {
            Lampa.Storage.set("int_plug", "true");
            Lampa.Storage.set("wide_post", 'true');
            Lampa.Storage.set("logo_card_style", "true");
            Lampa.Storage.set("desc", "true");
            Lampa.Storage.set("status", 'true');
            Lampa.Storage.set('seas', "false");
            Lampa.Storage.set('eps', "false");
            Lampa.Storage.set("year_ogr", "true");
            Lampa.Storage.set('vremya', 'true');
            Lampa.Storage.set('ganr', 'true');
            Lampa.Storage.set('rat', "true");
        }
    }
})();
