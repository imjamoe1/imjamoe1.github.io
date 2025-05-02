
(function () {
    'use strict';

    function createFreePlugin() {
        const sources = [
            {
                name: 'Eneyida',
                url: 'https://eneyida.tv/',
                parser: function (query) {
                    return `${this.url}?do=search&q=${encodeURIComponent(query)}`;
                }
            },
            {
                name: 'UAKino',
                url: 'https://uakino.me/',
                parser: function (query) {
                    return `${this.url}search/?q=${encodeURIComponent(query)}`;
                }
            },
            {
                name: 'GidOnline',
                url: 'https://gidonline.net/',
                parser: function (query) {
                    return `${this.url}index.php?do=search&subaction=search&q=${encodeURIComponent(query)}`;
                }
            }
        ];

        Lampa.Component.add('free_plugin', function () {
            this.create = function () {
                this.activity.loader(true);
                const query = this.activity.query;
                const searchResults = [];

                let completedRequests = 0;
                sources.forEach(source => {
                    const url = source.parser(query);
                    Lampa.Network.silent(url, (response) => {
                        searchResults.push({
                            source: source.name,
                            url,
                            content: response
                        });
                        completedRequests++;
                        if (completedRequests === sources.length) {
                            this.showResults(searchResults);
                        }
                    }, () => {
                        completedRequests++;
                        if (completedRequests === sources.length) {
                            this.showResults(searchResults);
                        }
                    });
                });
            };

            this.showResults = function (results) {
                this.activity.loader(false);
                if (results.length === 0) {
                    Lampa.Noty.show('Результати не знайдені.');
                    return;
                }

                results.forEach(result => {
                    const item = Lampa.Template.get('button', {
                        title: `${result.source} - Перейти`,
                        description: result.url
                    });

                    item.on('hover:enter', () => {
                        Lampa.Platform.openURL(result.url);
                    });

                    this.append(item);
                });
            };
        });
    }

    createFreePlugin();
})();


        Lampa.Component.add('free_plugin', function () {
            this.create = function () {
                this.activity.loader(true);
                const query = this.activity.query;
                const searchResults = [];

                let completedRequests = 0;
                sources.forEach(source => {
                    const url = source.parser(query);
                    Lampa.Network.silent(url, (response) => {
                        searchResults.push({
                            source: source.name,
                            url,
                            content: response
                        });
                        completedRequests++;
                        if (completedRequests === sources.length) {
                            this.showResults(searchResults);
                        }
                    }, () => {
                        completedRequests++;
                        if (completedRequests === sources.length) {
                            this.showResults(searchResults);
                        }
                    });
                });
            };

            this.showResults = function (results) {
                this.activity.loader(false);
                if (results.length === 0) {
                    Lampa.Noty.show('Результати не знайдені.');
                    return;
                }

                results.forEach(result => {
                    const item = Lampa.Template.get('button', {
                        title: `${result.source} - Перейти`,
                        description: result.url
                    });

                    item.on('hover:enter', () => {
                        Lampa.Platform.openURL(result.url);
                    });

                    this.append(item);
                });
            };
        });
    }

    createFreePlugin();
})();
