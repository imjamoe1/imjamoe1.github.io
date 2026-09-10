!function() {
    "use strict";

    // Проверяем наличие jQuery
    if (typeof $ === "undefined") {
        console.error("[PlayerInfoLogo] Ошибка: jQuery не найден");
        return;
    }

    // Добавляем CSS стили
    var customStyles = `
        <style>
        .player-info__logo {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            margin-bottom: 8px !important;
            padding: 0 !important;
            text-align: center !important;
        }
        .player-info__logo img {
            max-height: 120px;
            max-width: 400px;
        }
        </style>
    `;

    // Добавляем стили в head
    $('head').append(customStyles);

    // Переменные для контроля состояния
    var currentTitle = "";
    var isLoading = false;
    var logoTimeout = null;
    var uniqueLogoId = 0;

    // Функция очистки старых логотипов
    function clearAllLogos() {
        $(".player-info__logo").remove();
        console.log("[PlayerInfoLogo] Все логотипы удалены");
    }

    // Функция создания логотипа
    function createImageLogo(logoPath) {
        var logoId = ++uniqueLogoId;
        var logoHtml = '<div class="player-info__logo" data-logo-id="' + logoId + '">' +
            '<img src="' + logoPath + '" alt="Logo" />' +
            '</div>';
        return logoHtml;
    }

    // Поиск точного совпадения
    function findBestMatch(results, originalTitle) {
        if (!results || results.length === 0) return null;

        var cleanOriginal = originalTitle.toLowerCase()
            .replace(/\s*\(\d{4}\).*$/, '')
            .replace(/\s*s\d+.*$/i, '')
            .replace(/\s*сезон.*$/i, '')
            .replace(/[^\w\s]/g, '')
            .trim();

        for (var i = 0; i < results.length; i++) {
            var item = results[i];
            var title = (item.title || item.name || "").toLowerCase()
                .replace(/[^\w\s]/g, '')
                .trim();
            var origTitle = (item.original_title || item.original_name || "").toLowerCase()
                .replace(/[^\w\s]/g, '')
                .trim();

            if (title === cleanOriginal || origTitle === cleanOriginal) {
                return item;
            }
        }
        return null;
    }

    // Основная функция отображения логотипа
    function displayPlayerInfoLogo() {
        try {
            if (isLoading) return;

            var $playerInfoName = $(".player-info__name");
            if (!$playerInfoName.length) return;

            var $playerTitle = $(".player-footer-card__title");
            if (!$playerTitle.length) {
                $playerTitle = $(".card__title, .player-title, .media-title, .title, [class*=title]");
            }

            var title = $playerTitle.length ? $playerTitle.text().trim() : "";
            if (!title) return;

            var cleanTitle = title
                .replace(/\s*\(\d{4}\).*$/, '')
                .replace(/\s*S\d+.*$/i, '')
                .replace(/\s*Сезон.*$/i, '')
                .replace(/\s*(trailer|трейлер|teaser|тизер|official|featurette).*$/i, '')
                .replace(/\s*-.*$/, '')
                .replace(/[^\w\s\u0400-\u04FF]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            if (currentTitle === cleanTitle) return;

            if (logoTimeout) clearTimeout(logoTimeout);

            clearAllLogos();
            isLoading = true;
            currentTitle = cleanTitle;

            var apiKey = "06936145fe8e20be28b02e26b55d3ce6";
            var searchUrl = "https://api.themoviedb.org/3/search/multi?api_key=" + apiKey + "&query=" + encodeURIComponent(cleanTitle) + "&language=ru&page=1";

            logoTimeout = setTimeout(function() {
                if (isLoading) isLoading = false;
            }, 5000);

            $.get(searchUrl).done(function(data) {
                if (!isLoading) return;

                var bestMatch = findBestMatch(data.results, cleanTitle);
                if (!bestMatch) {
                    clearTimeout(logoTimeout);
                    isLoading = false;
                    return;
                }

                var isSerial = bestMatch.media_type === "tv";
                var id = bestMatch.id;
                var apiPath = isSerial ? "tv/" + id : "movie/" + id;
                var logoUrl = "https://api.themoviedb.org/3/" + apiPath + "/images?api_key=" + apiKey;

                $.get(logoUrl).done(function(e) {
                    if (!isLoading) return;
                    clearTimeout(logoTimeout);
                    isLoading = false;

                    if (e.logos && e.logos.length > 0) {
                        var logo = e.logos.find(function(l) { return l.iso_639_1 === "ru"; }) ||
                                   e.logos.find(function(l) { return l.iso_639_1 === "en"; }) ||
                                   e.logos.find(function(l) { return !l.iso_639_1; }) ||
                                   e.logos[0];

                        if (logo && logo.file_path) {
                            var logoPath = "https://image.tmdb.org/t/p/w300" + logo.file_path.replace(".svg", ".png");

                            if (!$(".player-info__logo").length) {
                                $playerInfoName.before(createImageLogo(logoPath));
                            }
                        }
                    }
                }).fail(function() {
                    if (!isLoading) return;
                    clearTimeout(logoTimeout);
                    isLoading = false;
                });
            }).fail(function() {
                if (!isLoading) return;
                clearTimeout(logoTimeout);
                isLoading = false;
            });
        } catch (e) {
            isLoading = false;
            if (logoTimeout) clearTimeout(logoTimeout);
        }
    }

    // Полная очистка
    function clearLogo() {
        clearAllLogos();
        currentTitle = "";
        isLoading = false;
        if (logoTimeout) {
            clearTimeout(logoTimeout);
            logoTimeout = null;
        }
    }

    // Принудительное обновление
    function forceUpdateLogo() {
        clearLogo();
        setTimeout(function() {
            displayPlayerInfoLogo();
        }, 1000);
    }

    // Подписка на события Lampa
    try {
        if (Lampa && Lampa.Listener) {
            Lampa.Listener.follow('player', function(e) {
                if (e.type === 'start' || e.type === 'loading') {
                    clearLogo();
                    setTimeout(displayPlayerInfoLogo, 2000);
                } else if (e.type === 'end' || e.type === 'stop') {
                    clearLogo();
                }
            });

            Lampa.Listener.follow('card', function(e) {
                if (e.type === 'start' || e.type === 'loading') {
                    clearLogo();
                    setTimeout(displayPlayerInfoLogo, 2000);
                }
            });

            Lampa.Listener.follow('activity', function(e) {
                if (e.type === 'start') {
                    forceUpdateLogo();
                } else if (e.type === 'destroy') {
                    clearLogo();
                }
            });

            Lampa.Listener.follow('torrent', function(e) {
                if (e.type === 'start') {
                    forceUpdateLogo();
                }
            });
        }
    } catch (e) {
        console.error("[PlayerInfoLogo] Ошибка событий:", e.message);
    }

    // DOM Observer
    var observer = new MutationObserver(function(mutations) {
        var shouldUpdate = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        if (node.classList && (
                            node.classList.contains('player-info__name') ||
                            node.classList.contains('player-footer-card__title') ||
                            $(node).find('.player-info__name, .player-footer-card__title').length
                        )) {
                            shouldUpdate = true;
                        }
                    }
                });
            }
        });
        if (shouldUpdate) {
            setTimeout(forceUpdateLogo, 500);
        }
    });

    try {
        observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
        console.error("[PlayerInfoLogo] Ошибка Observer:", e.message);
    }

    // Инициализация
    try {
        setTimeout(function checkDOM() {
            displayPlayerInfoLogo();
            if (!$(".player-info__name").length) {
                setTimeout(checkDOM, 2000);
            }
        }, 1500);
    } catch (e) {
        console.error("[PlayerInfoLogo] Ошибка инициализации:", e.message);
    }

    // Периодическая проверка
    setInterval(function() {
        if ($(".player-info__name").length && !$(".player-info__logo").length && !isLoading) {
            displayPlayerInfoLogo();
        }
    }, 10000);
}();
