(function () {
  'use strict';

  // Инициализация TV-платформы Lampa
  Lampa.Platform.tv();

  // Основная функция плагина
  (function () {
    'use strict';

    // Главная функция плагина
    function initializePlugin() {
      // Проверяем, не был ли плагин уже активирован
      if (window.original_title_display) {
        return;
      }
      
      // Помечаем плагин как активированный
      window.original_title_display = true;

      // Подписываемся на события полноэкранного просмотра
      Lampa.Listener.follow("full", function (event) {
        // Работаем только при завершении загрузки контента
        if (event.type !== "complite") {
          return;
        }

        // Получаем текущую активность
        var activity = Lampa.Activity.active();
        var renderContainer = activity.activity.render();
        var card = activity.card;

        // Проверяем наличие карточки и оригинального названия
        if (!card || !card.original_title) {
          return;
        }

        // Ищем элемент с основным заголовком
        var titleElement = $('.full-start-new__title', renderContainer);
        if (titleElement.length === 0) {
          return;
        }

        // Удаляем предыдущие отображения оригинального названия
        $('.original-title-display', renderContainer).remove();

        // Создаем элемент для отображения оригинального названия
        var originalTitleElement = $(
          "<div class=\"original-title-display\" style=\"" +
          "color: #b0b1b1; " +
          "font-size: 1.5em; " +
          "margin-top: 0.3em; " +
          "margin-bottom: 0.3em;\">" + 
          card.original_title + 
          "</div>"
        );

        // Вставляем оригинальное название перед основным заголовком
        titleElement.before(originalTitleElement);
      });
    }

    // Запускаем плагин при готовности приложения
    if (window.appready) {
      // Если приложение уже готово, запускаем сразу
      initializePlugin();
    } else {
      // Иначе ждем события готовности приложения
      Lampa.Listener.follow("app", function (event) {
        if (event.type === 'ready') {
          initializePlugin();
        }
      });
    }
  })();
})();