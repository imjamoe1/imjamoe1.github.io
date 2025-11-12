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
            }
        });

        function applyStyles() {
            var labelText = Lampa.Lang.translate("lable_tv_caption");
            
            // Удаляем старые стили
            $("#lable_tv_styles").remove();
            
            // Создаем новые стили
            var styles = [
                "<style id=\"lable_tv_styles\">",
                ".card--tv .card__type {",
                "    font-size: 0.9em;",
                "    background: transparent;", 
                "    color: transparent;",
                "}",
                ".card--tv .card__type::after {",
                "    content: \"" + labelText + "\";",
                "    color: #fff;",
                "    position: absolute;",
                "    left: 0;",
                "    top: 0;", 
                "    padding: 0.4em 0.4em;",
                "    border-radius: 0.5em;",
                "    font-weight: 600;",
                "    border: 1px solid #fff !important;",
                "    background-color: rgba(0, 0, 0, 0.5);",
                "    font-size: 0.95em;",
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
