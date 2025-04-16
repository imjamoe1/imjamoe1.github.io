//----------------------------------------------------------
//  Поддержка разработки:
//  OZON Банк  +7 953 235 0002   ( Иван Л. )
//----------------------------------------------------------

(function () {
    'use strict';

    var OnlineCinemas = {
        settings: {
            hide_ru: false,
            hide_en: false,
            showActors: true,
            cinemas: {
                'ru': [
                    { name: 'Start', networkId: '2493', enabled: true },
                    { name: 'Premier', networkId: '2859', enabled: true },
                    { name: 'KION', networkId: '4085', enabled: true },
                    { name: 'Okko', networkId: '3871', enabled: true },
                    { name: 'КиноПоиск', networkId: '3827', enabled: true },
                    { name: 'Wink', networkId: '5806', enabled: true },
                    { name: 'ИВИ', networkId: '3923', enabled: true },
                    { name: 'Первый', networkId: '558', enabled: true },
                    { name: 'СТС', networkId: '806', enabled: true },
                    { name: 'ТНТ', networkId: '1191', enabled: true },
                    { name: 'Россия 1', networkId: '412', enabled: true },
                    { name: 'НТВ', networkId: '1199', enabled: true }
                ],
                'en': [
                    { name: 'Netflix', networkId: '213', enabled: true },
                    { name: 'Apple TV', networkId: '2552', enabled: true },
                    { name: 'HBO', networkId: '49', enabled: true },
                    { name: 'SyFy', networkId: '77', enabled: true },
                    { name: 'NBC', networkId: '6', enabled: true },
                    { name: 'TV New Zealand', networkId: '1376', enabled: true },
                    { name: 'Hulu', networkId: '453', enabled: true },
                    { name: 'ABC', networkId: '49', enabled: true },
                    { name: 'CBS', networkId: '16', enabled: true },
                    { name: 'Amazon Prime', networkId: '1024', enabled: true }
                ]
            }
        },

        init: function() {
            this.registerTemplates();
            this.loadSettings();
            this.createSettings();
            this.addButtons();
            this.initStorageListener();
            if(this.settings.showActors) this.addActorsButton();
        },

        registerTemplates: function() {
            Lampa.Template.add('settings_online_cinemas', `<div></div>`);
        },

        saveSettings: function() {
            const settingsToSave = {
                hide_ru: this.settings.hide_ru,
                hide_en: this.settings.hide_en,
                showActors: this.settings.showActors,
                cinemas: {
                    ru: this.settings.cinemas.ru.map(c => ({
                        networkId: String(c.networkId),
                        enabled: c.enabled
                    })),
                    en: this.settings.cinemas.en.map(c => ({
                        networkId: String(c.networkId),
                        enabled: c.enabled
                    }))
                }
            };
            Lampa.Storage.set('online_cinemas_settings', settingsToSave);
        },

        loadSettings: function() {
            const saved = Lampa.Storage.get('online_cinemas_settings');
            if (!saved) return;

            if (!saved.cinemas) {
                this.migrateV1Settings(saved);
                return;
            }

            this.settings.hide_ru = saved.hide_ru || false;
            this.settings.hide_en = saved.hide_en || false;
            this.settings.showActors = saved.showActors !== undefined ? saved.showActors : true;

            ['ru', 'en'].forEach(lang => {
                if (saved.cinemas[lang]) {
                    saved.cinemas[lang].forEach(savedCinema => {
                        const cinema = this.settings.cinemas[lang].find(c => 
                            String(c.networkId) === String(savedCinema.networkId)
                        );
                        if (cinema) cinema.enabled = savedCinema.enabled;
                    });
                }
            });
        },

        migrateV1Settings: function(oldSettings) {
            ['ru', 'en'].forEach(lang => {
                this.settings.cinemas[lang].forEach((cinema, index) => {
                    const key = `cinema_${lang}_${index}`;
                    if (oldSettings[key] !== undefined) {
                        cinema.enabled = oldSettings[key];
                    }
                });
            });
            this.settings.showActors = oldSettings.showActors || true;
            this.saveSettings();
        },

        createSettings: function() {
            const _this = this;

            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: { 
                    type: 'button',
                    component: 'online_cinemas' 
                },
                field: {
                    name: 'Настройки онлайн кинотеатров',
                    description: 'Управление источниками и элементами'
                },
                onChange: function() {
                    Lampa.Settings.create('online_cinemas', {
                        title: 'Настройки онлайн кинотеатров',
                        template: 'settings_online_cinemas',
                        onBack: function() {
                            Lampa.Settings.create('interface');
                        },
                        onShow: function(settings) {
                            settings.setTitle('Настройки онлайн кинотеатров');
                        }
                    });
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'online_cinemas',
                param: { 
                    type: 'button',
                    component: 'about' 
                },
                field: {
                    name: 'О плагине',
                    description: 'Информация и поддержка'
                },
                onChange: this.showAbout.bind(this)
            });

            Lampa.SettingsApi.addParam({
                component: 'online_cinemas',
                param: { type: 'title' },
                field: { name: 'Скрыть с главного меню' }
            });

            Lampa.SettingsApi.addParam({
                component: 'online_cinemas',
                param: {
                    name: 'hide_ru',
                    type: 'trigger',
                    default: this.settings.hide_ru
                },
                field: {
                    name: 'Скрыть RU кинотеатры'
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'online_cinemas',
                param: {
                    name: 'hide_en',
                    type: 'trigger',
                    default: this.settings.hide_en
                },
                field: {
                    name: 'Скрыть EN кинотеатры'
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'online_cinemas',
                param: {
                    name: 'show_actors',
                    type: 'trigger',
                    default: this.settings.showActors
                },
                field: {
                    name: 'Показывать актёров'
                }
            });

            this.createLanguageSettings('ru', 'Российские сервисы');
            this.createLanguageSettings('en', 'Иностранные сервисы');
        },

        createLanguageSettings: function(lang, title) {
            Lampa.SettingsApi.addParam({
                component: 'online_cinemas',
                param: { type: 'title' },
                field: { name: title }
            });

            this.settings.cinemas[lang].forEach(cinema => {
                Lampa.SettingsApi.addParam({
                    component: 'online_cinemas',
                    param: {
                        name: `cinema_${lang}_${cinema.networkId}`,
                        type: 'trigger',
                        default: cinema.enabled
                    },
                    field: {
                        name: cinema.name
                    }
                });
            });
        },

        initStorageListener: function() {
            const _this = this;
            Lampa.Storage.listener.follow('change', e => {
                if(e.name === 'hide_ru' || e.name === 'hide_en') {
                    _this.settings[e.name] = Lampa.Storage.get(e.name, false);
                    _this.saveSettings();
                    _this.refreshMenuButtons();
                }
                else if(e.name.startsWith('cinema_')) {
                    _this.updateCinemasFromStorage();
                }
                else if(e.name === 'show_actors') {
                    _this.settings.showActors = Lampa.Storage.get('show_actors', true);
                    _this.saveSettings();
                    _this.toggleActorsButton();
                }
            });
        },

        updateCinemasFromStorage: function() {
            ['ru', 'en'].forEach(lang => {
                this.settings.cinemas[lang].forEach(cinema => {
                    const value = Lampa.Storage.get(`cinema_${lang}_${cinema.networkId}`);
                    cinema.enabled = value !== undefined ? value : cinema.enabled;
                });
            });
            this.saveSettings();
            this.refreshMenuButtons();
        },

        toggleActorsButton: function() {
            $('.online-cinemas-actors').toggle(this.settings.showActors);
        },

        refreshMenuButtons: function() {
            $('[data-action="ru_movie"], [data-action="en_movie"]').remove();
            this.addButtons();
        },

        addButtons: function() {
            if(!this.settings.hide_ru) this.addLanguageButton('ru', 'Кинотеатры');
            if(!this.settings.hide_en) this.addLanguageButton('en', 'Кинотеатры');
        },

        addLanguageButton: function(lang, text) {
            const ico = `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 48 48">
                <text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="38" 
                      font-weight="700" fill="currentColor" dominant-baseline="middle">
                    ${lang.toUpperCase()}
                </text>
            </svg>`;

            const button = $(`
                <li class="menu__item selector" data-action="${lang}_movie">
                    <div class="menu__ico">${ico}</div>
                    <div class="menu__text">${text}</div>
                </li>
            `);

            button.on('hover:enter', this.onLanguageButtonClick.bind(this, lang));
            $('.menu .menu__list').eq(0).append(button);
        },

        addActorsButton: function() {
            const ico = '<svg xmlns="http://www.w3.org/2000/svg" width="2.2em" height="2.2em" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="4"><path stroke-linejoin="round" d="M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4S4 12.954 4 24s8.954 20 20 20Z"/><path d="M30 24v-4.977C30 16.226 28.136 14 24 14s-6 2.226-6 5.023V24"/><path stroke-linejoin="round" d="M30 24h-6v-4.977C24 16.226 25.864 14 30 14s6 2.226 6 5.023V24h-6Zm-18 0h6v-4.977C24 16.226 22.136 14 18 14s-6 2.226-6 5.023V24h6Z"/></g></svg>';
            const button = $(`<li class="menu__item selector online-cinemas-actors" data-action="actors">
                <div class="menu__ico">${ico}</div>
                <div class="menu__text">Актёры</div>
            </li>`);

            button.on('hover:enter', this.showActors.bind(this));
            $('.menu .menu__list').eq(0).append(button);
            this.toggleActorsButton();
        },

        showActors: function() {
            Lampa.Activity.push({
                url: "person/popular",
                title: "Актёры",
                region: "RU",
                language: "ru-RU",
                component: "category_full",
                source: "tmdb",
                card_type: "true",
                page: 1
            });
        },

        onLanguageButtonClick: function(lang) {
            const enabledCinemas = this.settings.cinemas[lang].filter(c => c.enabled);
            
            if(enabledCinemas.length === 0) {
                Lampa.Noty.show('Нет доступных онлайн кинотеатров для этого языка');
                return;
            }

            Lampa.Select.show({
                title: 'Выберите кинотеатр',
                items: enabledCinemas.map(cinema => ({
                    title: `<div class="menu____list">${cinema.name}</div>`,
                    cinema: cinema
                })),
                onSelect: a => Lampa.Activity.push({
                    url: "discover/tv",
                    title: a.cinema.name,
                    networks: a.cinema.networkId,
                    sort_by: "first_air_date.desc",
                    component: "category_full",
                    source: "tmdb",
                    card_type: "true",
                    page: 1
                }),
                onBack: () => Lampa.Controller.toggle('menu')
            });
        },

        showAbout: function() {
            Lampa.Select.show({
                title: "О плагине",
                items: [{
                    title: `
                        <div style="
                            padding: 15px;
                            line-height: 1.5;
                            font-size: 1.4em;
                            text-align: center;
                        ">
                            <div style="
                                color: #888;
                                font-size: 1.0em;
                                margin-bottom: 15px;
                                font-weight: 500;
                            ">
                                Поддержать разработку
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <div style="
                                    font-size: 1.6em;
                                    margin-bottom: 10px;
                                    color: #0033FF;
                                ">
                                    OZON Банк
                                </div>
                                <div style="
                                    font-size: 1.5em;
                                    margin-bottom: 15px;
                                    font-weight: bold;
                                ">
                                    +7 953 235 00 02
                                </div>
                                <div style="color: #FFFF33;">
                                    Владелец: Иван Л.<br><div style="color: #888;">
                                    Любая помощь мотивирует на развитие плагина!<br>
                                </div>
								</div>
                            </div>

<div style="
    border-top: 2px solid #CCCCCC;
    padding-top: 15px;
    color: #888;
    font-size: 0.5em;
">
    Версия: 1.0.2beta    ( Автор: bywolf )<br>
    <br>
    <div style="
        text-align: left;
        padding-left: 10px;
		color: #3399FF;
        margin-top: 5px;
		
    ">
	Добавлено:<br>
        • Скрытие кинотеатров с главного меню<br>
        • Улучшенно сохранения настроек
    </div>
</div>

                    `,
                    disabled: true
                }],
                onSelect: function(){},
                onBack: function(){
                    Lampa.Controller.toggle('settings');
                },
                width: 600
            });
        }
    };

    function startPlugin() {
        if(window.OnlineCinemas) return;
        window.OnlineCinemas = OnlineCinemas;

        if(window.appready) {
            OnlineCinemas.init();
        } else {
            Lampa.Listener.follow('app', e => {
                if(e.type === 'ready') OnlineCinemas.init();
            });
        }
    }

    startPlugin();
})();