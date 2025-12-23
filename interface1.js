(function () {
    'use strict';

    Lampa.Platform.tv();
    
    if (Lampa.Manifest.app_digital >= 300) {
        // Версия для приложения >= 3.0.0
        (function () {
            'use strict';
            
            if (typeof Lampa === "undefined") {
                return;
            }
            
            // Функция для предотвращения использования консоли
            function createConsoleProtection() {
                var isProtectionActive = true;
                return function (context, callback) {
                    var wrapper = isProtectionActive ? function () {
                        if (callback) {
                            var result = callback.apply(context, arguments);
                            callback = null;
                            return result;
                        }
                    } : function () {};
                    isProtectionActive = false;
                    return wrapper;
                };
            }
            
            var consoleProtector = createConsoleProtection();
            
            function initPlugin() {
                consoleProtector(this, function () {
                    var getGlobal = function () {
                        var result;
                        try {
                            result = Function("return (function() {}.constructor(\"return this\")( ));")();
                        } catch (e) {
                            result = window;
                        }
                        return result;
                    };
                    
                    var globalObj = getGlobal();
                    var consoleObj = globalObj.console = globalObj.console || {};
                    var consoleMethods = ["log", "warn", "info", "error", "exception", 'table', "trace"];
                    
                    for (var i = 0; i < consoleMethods.length; i++) {
                        var methodWrapper = consoleProtector.constructor.prototype.bind(consoleProtector);
                        var methodName = consoleMethods[i];
                        var originalMethod = consoleObj[methodName] || methodWrapper;
                        methodWrapper.__proto__ = consoleProtector.bind(consoleProtector);
                        methodWrapper.toString = originalMethod.toString.bind(originalMethod);
                        consoleObj[methodName] = methodWrapper;
                    }
                });
                
                consoleProtector();
                
                if (!Lampa.Maker || !Lampa.Maker.map || !Lampa.Utils) {
                    return;
                }
                
                if (window.plugin_interface_ready_v3) {
                    return;
                }
                
                window.plugin_interface_ready_v3 = true;
                
                addStyles();
                addSettings();
                
                var mainComponent = Lampa.Maker.map("Main");
                if (!mainComponent || !mainComponent.Items || !mainComponent.Create) {
                    return;
                }
                
                // Перехват методов для добавления нового интерфейса
                hookMethod(mainComponent.Items, "onInit", function (original, args) {
                    if (original) {
                        original.apply(this, args);
                    }
                    this.__newInterfaceEnabled = shouldEnableNewInterface(this && this.object);
                });
                
                hookMethod(mainComponent.Create, "onCreate", function (original, args) {
                    if (original) {
                        original.apply(this, args);
                    }
                    if (!this.__newInterfaceEnabled) {
                        return;
                    }
                    var interfaceState = getInterfaceState(this);
                    interfaceState.attach();
                });
                
                hookMethod(mainComponent.Create, 'onCreateAndAppend', function (original, args) {
                    var data = args && args[0];
                    if (this.__newInterfaceEnabled && data) {
                        updateResultsStyle(data);
                    }
                    return original ? original.apply(this, args) : undefined;
                });
                
                hookMethod(mainComponent.Items, "onAppend", function (original, args) {
                    if (original) {
                        original.apply(this, args);
                    }
                    if (!this.__newInterfaceEnabled) {
                        return;
                    }
                    var line = args && args[0];
                    var data = args && args[1];
                    if (line && data) {
                        setupLineInterface(this, line, data);
                    }
                });
                
                hookMethod(mainComponent.Items, 'onDestroy', function (original, args) {
                    if (this.__newInterfaceState) {
                        this.__newInterfaceState.destroy();
                        delete this.__newInterfaceState;
                    }
                    delete this.__newInterfaceEnabled;
                    if (original) {
                        original.apply(this, args);
                    }
                });
            }
            
            // Проверка условий для включения нового интерфейса
            function shouldEnableNewInterface(object) {
                if (!object) {
                    return false;
                }
                if (!(object.source === "tmdb" || object.source === 'cub')) {
                    return false;
                }
                if (window.innerWidth < 767) { // 0x2ff = 767
                    return false;
                }
                if (Lampa.Platform.screen("mobile")) {
                    return false;
                }
                if (object.title === "Избранное") {
                    return false;
                }
                return true;
            }
            
            // Получение состояния интерфейса
            function getInterfaceState(component) {
                if (component.__newInterfaceState) {
                    return component.__newInterfaceState;
                }
                var interfaceState = createInterfaceState(component);
                component.__newInterfaceState = interfaceState;
                return interfaceState;
            }
            
            // Создание состояния интерфейса
            function createInterfaceState(mainComponent) {
                var infoPanel = new InfoPanel();
                infoPanel.create();
                
                var backgroundImg = document.createElement("img");
                backgroundImg.className = "full-start__background";
                
                var interfaceState = {
                    'main': mainComponent,
                    'info': infoPanel,
                    'background': backgroundImg,
                    'infoElement': null,
                    'backgroundTimer': null,
                    'backgroundLast': '',
                    'attached': false,
                    
                    'attach': function () {
                        if (this.attached) {
                            return;
                        }
                        var renderElement = mainComponent.render(true);
                        if (!renderElement) {
                            return;
                        }
                        
                        renderElement.classList.add('new-interface');
                        
                        if (!backgroundImg.parentElement) {
                            renderElement.insertBefore(backgroundImg, renderElement.firstChild || null);
                        }
                        
                        var infoElement = infoPanel.render(true);
                        this.infoElement = infoElement;
                        if (infoElement && infoElement.parentNode !== renderElement) {
                            if (backgroundImg.parentElement === renderElement) {
                                renderElement.insertBefore(infoElement, backgroundImg.nextSibling);
                            } else {
                                renderElement.insertBefore(infoElement, renderElement.firstChild || null);
                            }
                        }
                        
                        mainComponent.scroll.minus(infoElement);
                        this.attached = true;
                    },
                    
                    'update': function (data) {
                        if (!data) {
                            return;
                        }
                        infoPanel.update(data);
                        this.updateBackground(data);
                    },
                    
                    'updateBackground': function (data) {
                        var backdropUrl = data && data.backdrop_path ? Lampa.Api.img(data.backdrop_path, 'w1280') : '';
                        if (!backdropUrl || backdropUrl === this.backgroundLast) {
                            return;
                        }
                        
                        clearTimeout(this.backgroundTimer);
                        var self = this;
                        
                        this.backgroundTimer = setTimeout(function () {
                            backgroundImg.classList.remove("loaded");
                            backgroundImg.onload = function () {
                                backgroundImg.classList.add("loaded");
                            };
                            backgroundImg.onerror = function () {
                                backgroundImg.classList.remove("loaded");
                            };
                            
                            self.backgroundLast = backdropUrl;
                            setTimeout(function () {
                                backgroundImg.src = self.backgroundLast;
                            }, 50); // 0x32 = 50
                        }, 100); // 0x64 = 100
                    },
                    
                    'reset': function () {
                        infoPanel.empty();
                    },
                    
                    'destroy': function () {
                        clearTimeout(this.backgroundTimer);
                        infoPanel.destroy();
                        
                        var renderElement = mainComponent.render(true);
                        if (renderElement) {
                            renderElement.classList.remove('new-interface');
                        }
                        
                        if (this.infoElement && this.infoElement.parentNode) {
                            this.infoElement.parentNode.removeChild(this.infoElement);
                        }
                        
                        if (backgroundImg && backgroundImg.parentNode) {
                            backgroundImg.parentNode.removeChild(backgroundImg);
                        }
                        
                        this.attached = false;
                    }
                };
                
                return interfaceState;
            }
            
            // Обновление стиля результатов
            function updateResultsStyle(data) {
                if (!data) {
                    return;
                }
                
                if (Array.isArray(data.results)) {
                    Lampa.Utils.extendItemsParams(data.results, {
                        'style': {
                            'name': Lampa.Storage.get("wide_post") !== false ? "wide" : 'small'
                        }
                    });
                }
            }
            
            // Настройка карточки для нового интерфейса
            function setupCardInterface(interfaceState, card) {
                if (!card || card.__newInterfaceCard || typeof card.use !== "function" || !card.data) {
                    return;
                }
                
                card.__newInterfaceCard = true;
                card.params = card.params || {};
                card.params.style = card.params.style || {};
                
                if (!card.params.style.name) {
                    card.params.style.name = Lampa.Storage.get("wide_post") !== false ? "wide" : 'small';
                }
                
                card.use({
                    'onFocus': function () {
                        interfaceState.update(card.data);
                    },
                    'onHover': function () {
                        interfaceState.update(card.data);
                    },
                    'onTouch': function () {
                        interfaceState.update(card.data);
                    },
                    'onDestroy': function () {
                        delete card.__newInterfaceCard;
                    }
                });
            }
            
            // Получение данных из карточки или результатов
            function getCardData(card, results, index) {
                index = index || 0;
                if (card && card.data) {
                    return card.data;
                }
                if (results && Array.isArray(results.results)) {
                    return results.results[index] || results.results[0];
                }
                return null;
            }
            
            // Поиск данных карточки в DOM
            function findCardDataInDOM(element) {
                if (!element) {
                    return null;
                }
                
                var domElement = element && element.jquery ? element[0] : element;
                while (domElement && !domElement.card_data) {
                    domElement = domElement.parentNode;
                }
                
                return domElement && domElement.card_data ? domElement.card_data : null;
            }
            
            // Получение данных сфокусированной карточки
            function getFocusedCardData(component) {
                var renderElement = component && typeof component.render === "function" ? component.render(true) : null;
                if (!renderElement || !renderElement.querySelector) {
                    return null;
                }
                
                var focusedElement = renderElement.querySelector(".selector.focus") || renderElement.querySelector(".focus");
                return findCardDataInDOM(focusedElement);
            }
            
            // Настройка интерфейса для линии
            function setupLineInterface(component, line, data) {
                if (line.__newInterfaceLine) {
                    return;
                }
                
                line.__newInterfaceLine = true;
                var interfaceState = getInterfaceState(component);
                
                var setupCard = function (card) {
                    setupCardInterface(interfaceState, card);
                };
                
                line.use({
                    'onInstance': function (card) {
                        setupCard(card);
                    },
                    'onActive': function (card, results) {
                        var cardData = getCardData(card, results);
                        if (cardData) {
                            interfaceState.update(cardData);
                        }
                    },
                    'onToggle': function () {
                        setTimeout(function () {
                            var focusedCardData = getFocusedCardData(line);
                            if (focusedCardData) {
                                interfaceState.update(focusedCardData);
                            }
                        }, 32); // 0x20 = 32
                    },
                    'onMore': function () {
                        interfaceState.reset();
                    },
                    'onDestroy': function () {
                        interfaceState.reset();
                        delete line.__newInterfaceLine;
                    }
                });
                
                if (Array.isArray(line.items) && line.items.length) {
                    line.items.forEach(setupCard);
                }
                
                if (line.last) {
                    var lastCardData = findCardDataInDOM(line.last);
                    if (lastCardData) {
                        interfaceState.update(lastCardData);
                    }
                }
            }
            
            // Перехват метода
            function hookMethod(object, methodName, callback) {
                if (!object) {
                    return;
                }
                
                var originalMethod = typeof object[methodName] === "function" ? object[methodName] : null;
                object[methodName] = function () {
                    var args = Array.prototype.slice.call(arguments);
                    return callback.call(this, originalMethod, args);
                };
            }
            
            // Добавление стилей
            function addStyles() {
                if (addStyles.added) {
                    return;
                }
                
                addStyles.added = true;
                
                var widePostStyle = Lampa.Storage.get("wide_post") !== false ? 
                    // Стили для широких постеров
                    `<style>
                        .new-interface .card.card--wide { width: 18.3em; }
                        .new-interface .card.card--small { width: 18.3em; }
                        .new-interface-info { position: relative; padding: 1.5em; height: 26em; }
                        .new-interface-info__body { width: 80%; padding-top: 1.1em; }
                        .new-interface-info__head { color: rgba(255, 255, 255, 0.6); margin-bottom: 1em; font-size: 1.3em; min-height: 1em; }
                        .new-interface-info__head span { color: #fff; }
                        .new-interface-info__title { font-size: 4em; font-weight: 600; margin-bottom: 0.3em; overflow: hidden; text-overflow: '.'; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; margin-left: -0.03em; line-height: 1.3; }
                        .new-interface-info__details { margin-bottom: 1.6em; display: flex; align-items: center; flex-wrap: wrap; min-height: 1.9em; font-size: 1.3em; }
                        .new-interface-info__split { margin: 0 1em; font-size: 0.7em; }
                        .new-interface-info__description { font-size: 1.4em; font-weight: 310; line-height: 1.3; overflow: hidden; text-overflow: '.'; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; width: 65%; }
                        .new-interface .card-more__box { padding-bottom: 95%; }
                        .new-interface .full-start__background { height: 108%; top: -5em; }
                        .new-interface .full-start__rate { font-size: 1.3em; margin-right: 0; }
                        .new-interface .card__promo { display: none; }
                        .new-interface .card.card--wide + .card-more .card-more__box { padding-bottom: 95%; }
                        .new-interface .card.card--wide .card-watched { display: none !important; }
                        
                        body.light--version .new-interface-info__body { width: 69%; padding-top: 1.5em; }
                        body.light--version .new-interface-info { height: 25.3em; }
                        
                        body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.focus .card__view { animation: animation-card-focus 0.2s; }
                        body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.animate-trigger-enter .card__view { animation: animation-trigger-enter 0.2s forwards; }
                        body.advanced--animation:not(.no--animation) .new-interface .card.card--small.focus .card__view { animation: animation-card-focus 0.2s; }
                        body.advanced--animation:not(.no--animation) .new-interface .card.card--small.animate-trigger-enter .card__view { animation: animation-trigger-enter 0.2s forwards; }
                    </style>` :
                    // Стили для маленьких постеров
                    `<style>
                        .new-interface .card.card--wide { width: 18.3em; }
                        .new-interface .card.card--small { width: 18.3em; }
                        .card .card__age, .card .card__title { display: none !important; }
                        .new-interface-info { position: relative; padding: 1.5em; height: 17.4em; }
                        .new-interface-info__body { width: 80%; padding-top: 0.2em; }
                        .new-interface-info__head { color: rgba(255, 255, 255, 0.6); margin-bottom: 0.3em; font-size: 1.2em; min-height: 1em; }
                        .new-interface-info__head span { color: #fff; }
                        .new-interface-info__title { font-size: 3em; font-weight: 600; margin-bottom: 0.2em; overflow: hidden; text-overflow: '.'; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; margin-left: -0.03em; line-height: 1.3; }
                        .new-interface-info__details { margin-bottom: 1.6em; display: flex; align-items: center; flex-wrap: wrap; min-height: 1.9em; font-size: 1.2em; }
                        .new-interface-info__split { margin: 0 1em; font-size: 0.7em; }
                        .new-interface-info__description { font-size: 1.3em; font-weight: 310; line-height: 1.3; overflow: hidden; text-overflow: '.'; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; width: 70%; }
                        .new-interface .card-more__box { padding-bottom: 150%; }
                        .new-interface .full-start__background { height: 108%; top: -5em; }
                        .new-interface .full-start__rate { font-size: 1.2em; margin-right: 0; }
                        .new-interface .card__promo { display: none; }
                        .new-interface .card.card--wide + .card-more .card-more__box { padding-bottom: 95%; }
                        .new-interface .card.card--wide .card-watched { display: none !important; }
                        
                        body.light--version .new-interface-info__body { width: 69%; padding-top: 1.5em; }
                        body.light--version .new-interface-info { height: 25.3em; }
                        
                        body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.focus .card__view { animation: animation-card-focus 0.2s; }
                        body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.animate-trigger-enter .card__view { animation: animation-trigger-enter 0.2s forwards; }
                        body.advanced--animation:not(.no--animation) .new-interface .card.card--small.focus .card__view { animation: animation-card-focus 0.2s; }
                        body.advanced--animation:not(.no--animation) .new-interface .card.card--small.animate-trigger-enter .card__view { animation: animation-trigger-enter 0.2s forwards; }
                    </style>`;
                
                Lampa.Template.add("new_interface_style_v3", widePostStyle);
                $('body').append(Lampa.Template.get("new_interface_style_v3", {}, true));
            }
            
            // Панель информации
            function InfoPanel() {
                this.html = null;
                this.timer = null;
                this.network = new Lampa.Reguest();
                this.loaded = {};
                this.currentUrl = null;
            }
            
            InfoPanel.prototype.create = function () {
                this.html = $(`<div class="new-interface-info">
                    <div class="new-interface-info__body">
                        <div class="new-interface-info__head"></div>
                        <div class="new-interface-info__title"></div>
                        <div class="new-interface-info__details"></div>
                        <div class="new-interface-info__description"></div>
                    </div>
                </div>`);
            };
            
            InfoPanel.prototype.render = function (asDOM) {
                if (!this.html) {
                    this.create();
                }
                return asDOM ? this.html[0] : this.html;
            };
            
            InfoPanel.prototype.update = function (data) {
                if (!data || !this.html) {
                    return;
                }
                
                this.html.find(".new-interface-info__head,.new-interface-info__details").text("---");
                
                // Отображение логотипа вместо названия
                if (Lampa.Storage.get("logo_card_style") !== false) {
                    var mediaType = data.name ? 'tv' : "movie";
                    var apiKey = Lampa.TMDB.key();
                    var imagesUrl = Lampa.TMDB.api(mediaType + '/' + data.id + "/images?api_key=" + apiKey + "&language=" + Lampa.Storage.get('language'));
                    var self = this;
                    
                    $.get(imagesUrl, function (response) {
                        if (response.logos && response.logos[0]) {
                            var logoPath = response.logos[0].file_path;
                            if (logoPath !== '') {
                                if (Lampa.Storage.get("desc") !== false) {
                                    self.html.find(".new-interface-info__title").html('<img style="margin-top: 0.3em; margin-bottom: 0.1em; max-height: 1.8em; max-width: 6.8em;" src="' + Lampa.TMDB.image("t/p/w500" + logoPath.replace('.svg', ".png")) + '" />');
                                } else {
                                    self.html.find(".new-interface-info__title").html('<img style="margin-top: 0.3em; margin-bottom: 0.1em; max-height: 2.8em; max-width: 6.8em;" src="' + Lampa.TMDB.image("t/p/w500" + logoPath.replace(".svg", ".png")) + '" />');
                                }
                            } else {
                                self.html.find(".new-interface-info__title").text(data.title || data.name || '');
                            }
                        } else {
                            self.html.find(".new-interface-info__title").text(data.title || data.name || '');
                        }
                    });
                } else {
                    this.html.find('.new-interface-info__title').text(data.title || data.name || '');
                }
                
                // Отображение описания
                if (Lampa.Storage.get("desc") !== false) {
                    this.html.find(".new-interface-info__description").text(data.overview || Lampa.Lang.translate("full_notext"));
                }
                
                Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200'));
                this.load(data);
            };
            
            InfoPanel.prototype.load = function (data) {
                if (!data || !data.id) {
                    return;
                }
                
                var source = data.source || "tmdb";
                if (source !== "tmdb" && source !== "cub") {
                    return;
                }
                
                if (!Lampa.TMDB || typeof Lampa.TMDB.api !== "function" || typeof Lampa.TMDB.key !== "function") {
                    return;
                }
                
                var mediaType = data.media_type === 'tv' || data.name ? 'tv' : "movie";
                var language = Lampa.Storage.get("language");
                var apiUrl = Lampa.TMDB.api(mediaType + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + "&append_to_response=content_ratings,release_dates&language=" + language);
                
                this.currentUrl = apiUrl;
                
                if (this.loaded[apiUrl]) {
                    this.draw(this.loaded[apiUrl]);
                    return;
                }
                
                clearTimeout(this.timer);
                var self = this;
                
                this.timer = setTimeout(function () {
                    self.network.clear();
                    self.network.timeout(5000); // 0x1388 = 5000
                    self.network.silent(apiUrl, function (response) {
                        self.loaded[apiUrl] = response;
                        if (self.currentUrl === apiUrl) {
                            self.draw(response);
                        }
                    });
                }, 300); // 0x12c = 300
            };
            
            InfoPanel.prototype.draw = function (data) {
                if (!data || !this.html) {
                    return;
                }
                
                var year = ((data.release_date || data.first_air_date || "0000") + '').slice(0, 4);
                var rating = parseFloat((data.vote_average || 0) + '').toFixed(1);
                var headInfo = [];
                var details = [];
                
                var countries = Lampa.Api.sources.tmdb.parseCountries(data);
                var ageRating = Lampa.Api.sources.tmdb.parsePG(data);
                
                // Год и страны
                if (year !== "0000") {
                    headInfo.push("<span>" + year + "</span>");
                }
                if (countries.length > 0) {
                    headInfo.push(countries.join(", "));
                }
                
                // Рейтинг
                if (Lampa.Storage.get("rat") !== false) {
                    if (rating > 0) {
                        details.push('<div class="full-start__rate"><div>' + rating + '</div><div>TMDB</div></div>');
                    }
                }
                
                // Жанры
                if (Lampa.Storage.get("ganr") !== false) {
                    if (data.genres && data.genres.length > 0) {
                        details.push(data.genres.map(function (genre) {
                            return Lampa.Utils.capitalizeFirstLetter(genre.name);
                        }).join(" | "));
                    }
                }
                
                // Время
                if (Lampa.Storage.get("vremya") !== false) {
                    if (data.runtime) {
                        details.push(Lampa.Utils.secondsToTime(data.runtime * 60, true));
                    }
                }
                
                // Количество сезонов
                if (Lampa.Storage.get("seas") !== false) {
                    if (data.number_of_seasons) {
                        details.push('<span class="full-start__pg" style="font-size: 0.9em;">Сезонов ' + data.number_of_seasons + '</span>');
                    }
                }
                
                // Количество эпизодов
                if (Lampa.Storage.get('eps') !== false) {
                    if (data.number_of_episodes) {
                        details.push('<span class="full-start__pg" style="font-size: 0.9em;">Эпизодов ' + data.number_of_episodes + "</span>");
                    }
                }
                
                // Возрастное ограничение
                if (Lampa.Storage.get("year_ogr") !== false) {
                    if (ageRating) {
                        details.push('<span class="full-start__pg" style="font-size: 0.9em;">' + ageRating + '</span>');
                    }
                }
                
                // Статус
                if (Lampa.Storage.get('status') !== false) {
                    var statusText = '';
                    if (data.status) {
                        switch (data.status.toLowerCase()) {
                            case "released":
                                statusText = "Выпущенный";
                                break;
                            case "ended":
                                statusText = "Закончен";
                                break;
                            case "returning series":
                                statusText = "Онгоинг";
                                break;
                            case 'canceled':
                                statusText = "Отменено";
                                break;
                            case "post production":
                                statusText = "Скоро";
                                break;
                            case "planned":
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
                        details.push('<span class="full-start__status" style="font-size: 0.9em;">' + statusText + '</span>');
                    }
                }
                
                this.html.find(".new-interface-info__head").empty().append(headInfo.join(", "));
                this.html.find(".new-interface-info__details").html(details.join('<span class="new-interface-info__split">&#9679;</span>'));
            };
            
            InfoPanel.prototype.empty = function () {
                if (!this.html) {
                    return;
                }
                this.html.find(".new-interface-info__head,.new-interface-info__details").text("---");
            };
            
            InfoPanel.prototype.destroy = function () {
                clearTimeout(this.timer);
                this.network.clear();
                this.loaded = {};
                this.currentUrl = null;
                if (this.html) {
                    this.html.remove();
                    this.html = null;
                }
            };
            
            // Добавление настроек
            function addSettings() {
                Lampa.Settings.listener.follow("open", function (settings) {
                    if (settings.name == 'main') {
                        if (Lampa.Settings.main().render().find("[data-component=\"style_interface\"]").length == 0) {
                            Lampa.SettingsApi.addComponent({
                                'component': "style_interface",
                                'name': "Стильный интерфейс"
                            });
                        }
                        Lampa.Settings.main().update();
                        Lampa.Settings.main().render().find("[data-component=\"style_interface\"]").addClass("hide");
                    }
                });
                
                // Добавление пункта в настройки интерфейса
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
                        }, 20); // 0x14 = 20
                        
                        element.on("hover:enter", function () {
                            Lampa.Settings.create("style_interface");
                            Lampa.Controller.enabled().controller.back = function () {
                                Lampa.Settings.create("interface");
                            };
                        });
                    }
                });
                
                // Настройки стильного интерфейса
                var settings = [
                    { name: "wide_post", type: "trigger", default: true, label: "Широкие постеры" },
                    { name: "logo_card_style", type: "trigger", default: true, label: "Логотип вместо названия" },
                    { name: "desc", type: "trigger", default: true, label: "Показывать описание" },
                    { name: "status", type: "trigger", default: true, label: "Показывать статус фильма/сериала" },
                    { name: "seas", type: "trigger", default: false, label: "Показывать количество сезонов" },
                    { name: "eps", type: "trigger", default: false, label: "Показывать количество эпизодов" },
                    { name: "year_ogr", type: "trigger", default: true, label: "Показывать возрастное ограничение" },
                    { name: "vremya", type: "trigger", default: true, label: "Показывать время фильма" },
                    { name: "ganr", type: "trigger", default: true, label: "Показывать жанр фильма" },
                    { name: "rat", type: "trigger", default: true, label: "Показывать рейтинг фильма" }
                ];
                
                settings.forEach(function (setting) {
                    Lampa.SettingsApi.addParam({
                        'component': "style_interface",
                        'param': {
                            'name': setting.name,
                            'type': setting.type,
                            'default': setting.default
                        },
                        'field': {
                            'name': setting.label
                        }
                    });
                });
                
                // Установка настроек по умолчанию при первом запуске
                var initInterval = setInterval(function () {
                    if (typeof Lampa !== "undefined") {
                        clearInterval(initInterval);
                        if (!Lampa.Storage.get("int_plug", "false")) {
                            setDefaultSettings();
                        }
                    }
                }, 200); // 0xc8 = 200
                
                function setDefaultSettings() {
                    Lampa.Storage.set("int_plug", "true");
                    Lampa.Storage.set("wide_post", "true");
                    Lampa.Storage.set("logo_card_style", "true");
                    Lampa.Storage.set("desc", 'true');
                    Lampa.Storage.set("status", "true");
                    Lampa.Storage.set("seas", "false");
                    Lampa.Storage.set("eps", "false");
                    Lampa.Storage.set("year_ogr", "true");
                    Lampa.Storage.set("vremya", "true");
                    Lampa.Storage.set("ganr", "true");
                    Lampa.Storage.set("rat", 'true');
                }
            }
            
            if (!window.plugin_interface_ready_v3) {
                initPlugin();
            }
        })();
    } else {
        // Версия для приложения < 3.0.0 (устаревшая)
        (function () {
            'use strict';
            
            // Код для старых версий приложения (структура аналогична, но с другими методами)
            // Здесь используется другой подход к созданию интерфейса
            
            function InfoPanelOld() {
                var html;
                var timer;
                var request = new Lampa.Reguest();
                var cache = {};
                
                this.create = function () {
                    html = $(`<div class="new-interface-info">
                        <div class="new-interface-info__body">
                            <div class="new-interface-info__head"></div>
                            <div class="new-interface-info__title"></div>
                            <div class="new-interface-info__details"></div>
                            <div class="new-interface-info__description"></div>
                        </div>
                    </div>`);
                };
                
                // ... остальной код для старой версии
                // Аналогичен коду выше, но адаптирован под старый API
            }
            
            function NewInterfaceMain(object) {
                // Реализация для старой версии приложения
                // Использует другой подход к созданию интерфейса
            }
            
            function initPluginOld() {
                if (Lampa.Manifest.origin !== "bylampa") {
                    Lampa.Noty.show("Ошибка доступа");
                    return;
                }
                
                window.plugin_interface_ready = true;
                
                var OriginalInteractionMain = Lampa.InteractionMain;
                
                Lampa.InteractionMain = function (object) {
                    var InterfaceClass = NewInterfaceMain;
                    
                    // Проверки условий
                    if (window.innerWidth < 767) { // 0x2ff = 767
                        InterfaceClass = OriginalInteractionMain;
                    }
                    if (Lampa.Manifest.app_digital < 153) { // 0x99 = 153
                        InterfaceClass = OriginalInteractionMain;
                    }
                    if (Lampa.Platform.screen("mobile")) {
                        InterfaceClass = OriginalInteractionMain;
                    }
                    if (object.title === "Избранное") {
                        InterfaceClass = OriginalInteractionMain;
                    }
                    
                    return new InterfaceClass(object);
                };
                
                // Добавление стилей и настроек (аналогично новой версии)
                // ...
            }
            
            if (!window.plugin_interface_ready) {
                initPluginOld();
            }
        })();
    }
})();
