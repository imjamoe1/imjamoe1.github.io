

  // Функция для удаления и сортировки элементов в настройках
function removeSettingsComponents() {
  var settingsToggled = false;

  Lampa.Settings.listener.follow('open', function(e) {
    if (e.name === 'main' && !settingsToggled) {
      settingsToggled = true;

      // сортируем меню
      setTimeout(function() {
        $('div[data-component="interface"]').before($('div[data-component="surs"]'));
        $('div[data-component="sisi"]').after($('div[data-component="account"]'));
      }, 10);

      setTimeout(function() {
        var hiddenSelectors = [
          'div[data-component="account"]',
          'div[data-component="plugins"]', 
          'div[data-component="tmdb"]', 
          'div[data-component="parser"]', 
         'div[data-component="server"]', 
          'div[data-component="parental_control"]',

          'div[data-component="backup"]'
        ];

        hiddenSelectors.forEach(function(selector) {
          $(selector).hide();
        });

        Lampa.Controller.toggle('settings');
      }, 40);
    }
  });

  // Отслеживание комбинации клавиш
  var keySequence = [38, 38, 39, 39, 40, 40, 38];
  var keyIndex = 0;

  $(document).on('keydown', function(e) {
    if (e.keyCode === keySequence[keyIndex]) {
      keyIndex++;
      if (keyIndex === keySequence.length) {
        keyIndex = 0;

        // Показываем скрытые пункты меню
        var hiddenSelectors = [
          'div[data-component="account"]',
          'div[data-component="plugins"]', 
          'div[data-component="tmdb"]', 
          'div[data-component="parser"]', 
          'div[data-component="server"]', 
          'div[data-component="parental_control"]',

          'div[data-component="backup"]'
        ];

        hiddenSelectors.forEach(function(selector) {
          $(selector).show();
        });

        Lampa.Noty.show('Алохамора... Скрытые пункты меню отображены');
      }
    } else {
      keyIndex = 0; // Сброс при неправильной клавише
    }
  });
  }
