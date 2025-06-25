"use strict";

(function () {
  'use strict';

  function start() {
    // Функция для продолжения просмотра
    function continueWatching(card_data) {
      const card = card_data || {};
      const baseHash = String(
        Lampa.Utils.hash(
          card.original_title||card.original_name||card.title||card.name||''
        )
      );
      let tlHash = '';
      if(card_data.item && card_data.item.timeline && card_data.item.timeline.hash) {
        tlHash = String(card_data.item.timeline.hash);
      }
      const key = tlHash || baseHash;

      const views = Lampa.Storage.get('file_view', {});
      const files = Lampa.Storage.get('resume_file', {});
      const resume = views[key];
      const data   = files[key];
      
      if(resume && data) {
        // Восстанавливаем timeline и запускаем
        const tl = data.timeline || Lampa.Timeline.view(key);
        tl.time     = resume.time;
        tl.duration = resume.duration;
        Lampa.Timeline.update(tl);

        Lampa.Player.play(Object.assign({}, data, {timeline: tl}));
        return true;
      }
      return false;
    }

    // Модифицируем обработку клика на карточку в ленте
    Lampa.Listener.follow('line', (e) => {
      if(e.items) {
        e.items.forEach((card) => {
          const origOnEnter = card.onEnter;
          card.onEnter = function(target, card_data) {
            // Пытаемся продолжить просмотр
            if(!continueWatching(card_data)) {
              // Если нечего продолжать - стандартное поведение
              if(origOnEnter) origOnEnter.call(this, target, card_data);
              else Lampa.Player.play(card_data);
            }
          };
        });
      }
    });

    // Модифицируем обработку открытия полной карточки
    Lampa.Listener.follow('full', function (e) {
      if (e.data && e.type == 'complite' && e.subtype !== 'load_buttons') {
        var card_data = e.object;
        
        // Пытаемся продолжить просмотр сразу при открытии карточки
        if(!continueWatching(card_data.card)) {
          // Если нечего продолжать - стандартное поведение
          Lampa.Player.play(card_data.card);
        }
      }
    });

    // Настройка активности (оставляем как было)
    Lampa.Listener.follow('activity', function (e) {
      if (e.type == 'start' && (e.component == 'lampac' || e.component == 'showy' || e.component == 'online_mod' || e.component == 'modss_online')) {
        if ($('.activity--active .explorer-card__head').next('.full-start-new__buttons').length == 0) {
          $('.activity--active .explorer-card__head').after('<div class="full-start-new__buttons" style="margin-bottom: 1em"></div>');
          $('.activity--active .explorer-card__head').css('margin-bottom', '1.3em');
          $('.activity--active .explorer-card__descr').css('overflow-y', 'auto');
          Lampa.Listener.send('full', {
            type: 'complite',
            subtype: 'load_buttons',
            object: {
              activity: Lampa.Activity.active().activity,
              method: Lampa.Activity.active().movie.first_air_date ? 'tv' : 'movie'
            },
            data: Lampa.Activity.active()
          });
        }
      }
    }, false);
  }

  if (window.appready) start();
  else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type == 'ready') {
        start();
      }
    });
  }
})();