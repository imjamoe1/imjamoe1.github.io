// Optimized Lampa Interface Plugin
(function () {
    'use strict';

    function create() {
        let html, timer, network = new Lampa.Reguest(), loaded = {};

        this.create = function () {
            html = $(`
                <div class="new-interface-info">
                    <div class="new-interface-info__body">
                        <div class="new-interface-info__head"></div>
                        <div class="new-interface-info__title"></div>
                        <div class="new-interface-info__details"></div>
                        <div class="new-interface-info__description"></div>
                    </div>
                </div>
            `);
        };

        this.update = function (data) {
            if (!html) return console.error('HTML element is not initialized');

            const titleElement = html.find('.new-interface-info__title');
            titleElement.text(data.title || 'Без названия');

            const descriptionElement = html.find('.new-interface-info__description');
            descriptionElement.text(data.overview || 'Описание недоступно.');

            this.loadLogo(data);
            Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200'));
            this.load(data);
        };

        this.loadLogo = function (data) {
            const logoSetting = Lampa.Storage.get('logo_glav2') || 'show_all';
            const titleElement = html.find('.new-interface-info__title');

            if (logoSetting === 'hide') return;

            const url = Lampa.TMDB.api(`${data.name ? 'tv' : 'movie'}/${data.id}/images?api_key=${Lampa.TMDB.key()}`);
            network.silent(url, (images) => {
                const bestLogo = this.selectBestLogo(images, logoSetting);
                if (bestLogo) {
                    const imageUrl = Lampa.TMDB.image("/t/p/w500" + bestLogo.file_path);
                    titleElement.html(`<img class="new-interface-logo" src="${imageUrl}" alt="${data.title}">`);
                }
            });
        };

        this.selectBestLogo = function (images, setting) {
            if (!images.logos?.length) return null;

            const russianLogos = images.logos.filter(logo => logo.iso_639_1 === 'ru');
            const englishLogos = images.logos.filter(logo => logo.iso_639_1 === 'en');

            if (setting === 'ru_only' && russianLogos.length) return russianLogos[0];

            return russianLogos[0] || englishLogos[0] || images.logos[0];
        };

        this.draw = function (data) {
            const year = (data.release_date || data.first_air_date || '').slice(0, 4);
            const vote = parseFloat(data.vote_average || 0).toFixed(1);
            const genres = data.genres?.map(g => g.name).join(' | ') || '';

            const head = [year].filter(Boolean).join(', ');
            const details = [genres, `${vote} TMDB`].filter(Boolean).join(' • ');

            html.find('.new-interface-info__head').html(head);
            html.find('.new-interface-info__details').html(details);
        };

        this.load = function (data) {
            clearTimeout(timer);
            const url = Lampa.TMDB.api(`${data.name ? 'tv' : 'movie'}/${data.id}?api_key=${Lampa.TMDB.key()}`);

            if (loaded[url]) return this.draw(loaded[url]);

            timer = setTimeout(() => {
                network.silent(url, (movie) => {
                    loaded[url] = movie;
                    this.draw(movie);
                });
            }, 600);
        };

        this.render = () => html;

        this.destroy = function () {
            html.remove();
            loaded = {};
            html = null;
        };
    }

    Lampa.Template.add('new_interface_style', `
        <style>
        .new-interface-info { padding: 1.5em; height: 20em; }
        .new-interface-info__title { font-size: 2em; font-weight: bold; }
        .new-interface-info__description { font-size: 1em; line-height: 1.5; }
        .new-interface-logo { max-width: 200px; max-height: 50px; object-fit: contain; }
        </style>
    `);

    $('body').append(Lampa.Template.get('new_interface_style', {}, true));

})();
