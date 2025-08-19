(function(){
  'use strict';

  // Функция для продолжения просмотра
  function continueWatching(cardData) {
    try {
      const baseHash = String(
        Lampa.Utils.hash(
          cardData.original_title || cardData.original_name || cardData.title || cardData.name || ''
        )
      );
      
      const views = Lampa.Storage.get('file_view', {});
      const files = Lampa.Storage.get('resume_file', {});
      const resume = views[baseHash];
      const data   = files[baseHash];
      
      // Проверяем, можно ли продолжить (просмотр был и не завершен)
      if (resume && data && resume.time > 0 && resume.time < resume.duration - 60) {
        // восстанавливаем timeline и запускаем
        const tl = data.timeline || Lampa.Timeline.view(baseHash);
        tl.time     = resume.time;
        tl.duration = resume.duration;
        Lampa.Timeline.update(tl);

        Lampa.Player.play(Object.assign({}, data, {timeline: tl}));
        return true;
      }
    } catch(e) {
      console.error('[ReturnPlugin] continue error', e);
    }
    
    return false;
  }

  // Оборачиваем Player.play, чтобы сохранять data под ключом
  (function(){
    const origPlay = Lampa.Player.play;
    Lampa.Player.play = function(data){
      const tlHash = data.timeline && data.timeline.hash
                    ? String(data.timeline.hash)
                    : '';
      const baseHash = String(
        Lampa.Utils.hash(
          (data.card && (data.card.original_title || data.card.original_name))
          || data.title || ''
        )
      );
      const key = tlHash || baseHash;
      try {
        const map = Lampa.Storage.get('resume_file', {});
        map[key] = data;
        Lampa.Storage.set('resume_file', map);
        console.log('[ReturnPlugin] resume_file saved →', key, data);
      } catch(e) {
        console.error('[ReturnPlugin] save error', e);
      }
      return origPlay.call(this, data);
    };
    console.log('[ReturnPlugin] Player.play wrapped');
  })();

  function start() {
    // Убираем старую кнопку
    $(".button--plugin-watch").remove();

    Lampa.Listener.follow('full', function (e) {
      if (e.data && e.type == 'complite' && e.subtype !== 'load_buttons') {
        var card_data = e.object;
        
        // Автоматически продолжаем просмотр при открытии карточки
        if (Lampa.Storage.field('lampastore_ux_poster_plugin') == 'yes') {
          setTimeout(function() {
            if (!continueWatching(card_data.card)) {
              // Если продолжить нельзя, открываем стандартный просмотр
              Lampa.Card.open(card_data.card);
            }
          }, 100);
        }
      }
    });

    // Перехватываем клики на карточках в ленте
    Lampa.Listener.follow('line', function(e) {
      if (e.items) {
        e.items.forEach(function(card) {
          // Сохраняем оригинальный обработчик
          var originalOnEnter = card.onEnter;
          
          card.onEnter = function(target, card_data) {
            // Пытаемся продолжить просмотр
            if (!continueWatching(card_data)) {
              // Если нельзя продолжить, вызываем оригинальный обработчик
              if (originalOnEnter) {
                originalOnEnter(target, card_data);
              } else {
                // Стандартное открытие карточки
                Lampa.Card.open(card_data);
              }
            }
          };
        });
      }
    });
  }

  if (window.appready) start();
  else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type == 'ready') start();
    });
  }
})();
