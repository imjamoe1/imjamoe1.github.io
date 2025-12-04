(function() {
    'use strict';

    function initPlugin() {
        if (window.lable_tv_plugin) {
            return;
        }
        
        window.lable_tv_plugin = true;

        // Добавляем переводы
        Lampa.Lang.add({
            'lable_tv_caption': {
                'ru': "Сериал",
                'en': "Series", 
                'uk': "Серіал"
            },
            'lable_movie_caption': {
                'ru': "Фильм",
                'en': "Film", 
                'uk': "Фільм"
            }
        });

        function applyStyles() {
            var tvLabelText = Lampa.Lang.translate("lable_tv_caption");
            var movieLabelText = Lampa.Lang.translate("lable_movie_caption");
            
            // Удаляем старые стили
            $("#lable_tv_styles").remove();
            $("#lable_movie_styles").remove();
            
            // Создаем новые стили
            var styles = [
                "<style id=\"lable_tv_styles\">",
                ".card--tv .card__type {",
                "    font-size: 0.9em;",
                "    background: transparent;", 
                "    color: transparent;",
                "   z-index: 10;",
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
                "}",
                "</style>",
                "<style id=\"movie_type_styles\">",
                ".content-label {",
                "    font-size: 0.9em;",
                "    background: transparent;", 
                "    color: transparent;",
                "   z-index: 10;",
                "}",
                ".movie-label {",
                "    content: \"" + movieLabelText + "\";",
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
                "    z-index: 15 !important;",
                "}",
                ".serial-label {",
                "    content: \"" + tvLabelText + "\";",
                "    color: #fff;",
                "    position: absolute;",
                "    left: 0;",
                "    top: 0;", 
                "    padding: 0.4em 0.4em;",
                "    border-radius: 0.5em;",
                "    font-weight: 600;",
                "    border: 1px solid #fff !important;",
                "    background-color: rgba(0, 0, 0, 0.5) !important;",
                "    font-size: 0.95em;",
                "    z-index: 15 !important;",
                "}",
                "</style>"
            ].join('\n');
            
            $("body").append(styles);
        }

        applyStyles();
    }

    // Инициализация при загрузке
    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow("app", function(event) {
            if (event.type == "ready") {
                initPlugin();
            }
        });
    }
})();
