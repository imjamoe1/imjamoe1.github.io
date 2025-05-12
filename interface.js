(function () {
    'use strict';

    function create() {
        var html;
        var network = new Lampa.Reguest();

        this.create = function () {
            html = $("<div class='new-interface-info'>\n <div class='new-interface-info__body'>\n <div class='new-interface-info__head'></div>\n <div class='new-interface-info__title'></div>\n <div class='new-interface-info__details'></div>\n <div class='new-interface-info__description'></div>\n </div>\n</div>");
        };

        this.update = function (data) {
            if (!html) return;

            const logoSetting = Lampa.Storage.get('logo_glav2') || 'show_all';
            const type = data.name ? 'tv' : 'movie';
            const url = Lampa.TMDB.api(type + '/' + data.id + '/images?api_key=' + Lampa.TMDB.key());

            network.silent(url, (images) => {
                const titleElement = html.find('.new-interface-info__title');
                if (!titleElement.length) return;

                if (images.logos && images.logos.length > 0) {
                    let bestLogo = null;
                    if (logoSetting === 'ru_only') {
                        bestLogo = images.logos.find(logo => logo.iso_639_1 === 'ru') || images.logos[0];
                    } else if (logoSetting === 'show_all') {
                        bestLogo = images.logos.sort((a, b) => b.vote_average - a.vote_average)[0];
                    }

                    if (bestLogo && bestLogo.file_path) {
                        const imageUrl = Lampa.TMDB.image("/t/p/w500" + bestLogo.file_path);
                        titleElement.html(`<img class='new-interface-logo' src='${imageUrl}' alt='${data.title}' />`);
                    } else {
                        titleElement.text(data.title);
                    }
                } else {
                    titleElement.text(data.title);
                }
            });

            this.load(data);
        };

        this.load = function (data) {
            const url = Lampa.TMDB.api((data.name ? 'tv' : 'movie') + '/' + data.id + '?api_key=' + Lampa.TMDB.key());
            network.silent(url, (movie) => this.draw(movie));
        };

        this.draw = function (data) {
            const head = [(data.release_date || data.first_air_date || '0000').slice(0, 4)];
            const details = [];
            if (data.vote_average) details.push(`<div class='full-start__rate'>${parseFloat(data.vote_average).toFixed(1)} TMDB</div>`);

            html.find('.new-interface-info__head').html(head.join(', '));
            html.find('.new-interface-info__details').html(details.join('<span class="new-interface-info__split">&#9679;</span>'));
        };

        this.render = function () { return html; };
        this.destroy = function () { html.remove(); html = null; };
    }

    function component(data) {
        var html = $('<div class="new-interface"><img class="full-start__background"></div>');
        var scroll = new Lampa.Scroll({ mask: true, over: true, scroll_by_item: true });

        var info = new create();
        info.create();

        data.slice(0, 7).forEach((item) => {
            var element = new Lampa.InteractionLine(item);
            element.create();
            scroll.append(element.render());
        });

        html.append(info.render());
        html.append(scroll.render());

        return html;
    }

    Lampa.InteractionMain = function (object) { return new component(object.data); };
})();
