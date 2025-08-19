(function(){
  'use strict';

  if(typeof window.Lampa === 'undefined') {
    document.addEventListener('lampa:start', initContinueWatchPlugin);
    return;
  }

  initContinueWatchPlugin();

  function initContinueWatchPlugin() {
    console.log('Инициализация плагина Continue Watch');

    const API_KEY = '4ef0d7355d9ffb5151e987764708ce96';
    const API_URL = id => `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=ru`;

    // ——— Утилиты ——————————————————————————————————————————————————————————————
    function cardTitle(card = {}) {
      return card.original_title
          || card.original_name
          || card.title
          || card.name
          || '';
    }

    function makeKey(data, card) {
      // 1) сериал: явно заданы season/episode
      if (data.season != null && data.episode != null) {
        return String(Lampa.Utils.hash(`${data.season}:${data.episode}:${cardTitle(card)}`));
      }
      // 2) эпизод/фильм: есть timeline.hash
      if (data.timeline && data.timeline.hash) {
        return String(data.timeline.hash);
      }
      // 3) фолбэк по названию
      return String(Lampa.Utils.hash(cardTitle(card)));
    }

    // ——— Переопределяем Player.play для сохранения ————————————————————————————
    (function(){
      const origPlay = Lampa.Player.play;
      Lampa.Player.play = function(data){
        const key = makeKey(data, data.card);
        const map = Lampa.Storage.get('resume_file', {});
        map[key] = data;
        Lampa.Storage.set('resume_file', map);
        return origPlay.call(this, data);
      };
    })();

    // Функция для получения информации о сериале
    async function getTvShowInfo(id) {
      try {
        const res = await fetch(API_URL(id));
        return await res.json();
      } catch(e) {
        return null;
      }
    }

    // Функция для получения последней серии
    async function getLastEpisode(cardData) {
      try {
        const tvInfo = await getTvShowInfo(cardData.id);
        if (tvInfo && tvInfo.last_episode_to_air) {
          return {
            season: tvInfo.last_episode_to_air.season_number,
            episode: tvInfo.last_episode_to_air.episode_number
          };
        }
      } catch(e) {
        console.error('Error getting last episode:', e);
      }
      return null;
    }

    // Функция для запроса к серверу Timecode
    async function fetchTimecodeData(card_id, timelineHash) {
      try {
        const response = await fetch(`/timecode/all?card_id=${encodeURIComponent(card_id)}`);
        const data = await response.json();
        
        if (data && data[timelineHash]) {
          try {
            return JSON.parse(data[timelineHash]);
          } catch(e) {
            console.error('Error parsing timecode data:', e);
          }
        }
      } catch(e) {
        console.error('Error fetching timecode data:', e);
      }
      return null;
    }

    // Функция для продолжения просмотра
    async function continueWatching(cardData, season, episode) {
      try {
        // Получаем информацию о последней серии для сериалов
        let episodeInfo = null;
        if ((cardData.name || cardData.original_name) && !season && !episode) {
          episodeInfo = await getLastEpisode(cardData);
        }

        const keyData = {
          season: season || episodeInfo?.season,
          episode: episode || episodeInfo?.episode,
          timeline: null
        };

        const timelineHash = makeKey(keyData, cardData);
        const card_id = (cardData.id || 0) + '_' + (cardData.name ? 'tv' : 'movie');
        
        // 1. Проверяем локальное хранилище
        const views = Lampa.Storage.get('file_view', {});
        const files = Lampa.Storage.get('resume_file', {});
        const localResume = views[timelineHash];
        const localData = files[timelineHash];
        
        if (localResume && localData && localResume.time > 0 && localResume.time < localResume.duration - 60) {
          return playFromData(localData, localResume, timelineHash);
        }

        // 2. Проверяем сервер Timecode
        const timecodeData = await fetchTimecodeData(card_id, timelineHash);
        if (timecodeData && timecodeData.time > 0 && timecodeData.time < timecodeData.duration - 60) {
          // Создаем данные для воспроизведения
          const playData = {
            card: cardData,
            timeline: {
              hash: timelineHash,
              time: timecodeData.time,
              duration: timecodeData.duration
            }
          };
          
          Lampa.Player.play(playData);
          return true;
        }

      } catch(e) {
        console.error('Continue error:', e);
      }
      
      return false;
    }

    // Воспроизведение из данных
    function playFromData(data, resume, timelineHash) {
      // Для сериалов добавляем информацию о сезонах
      if (data.card && data.card.seasons) {
        data.card.seasons = data.card.seasons;
      }
      
      // восстанавливаем timeline и запускаем
      const tl = data.timeline || Lampa.Timeline.view(timelineHash);
      tl.time = resume.time;
      tl.duration = resume.duration;
      Lampa.Timeline.update(tl);

      Lampa.Player.play(Object.assign({}, data, {timeline: tl}));
      return true;
    }

    // ——— Основная функция обработки клика —————————————————————————————————————
    async function handleCardClick(card_data, season, episode) {
      if (await continueWatching(card_data, season, episode)) {
        return true;
      }
      return false;
    }

    // ——— Перехват кликов на карточках ————————————————————————————————————————
    
    // 1. Перехватываем создание карточек в ленте
    Lampa.Listener.follow('line', function(e) {
      if (e.items) {
        e.items.forEach(function(card) {
          if (card.onEnter) {
            var originalOnEnter = card.onEnter;
            
            card.onEnter = async function(target, card_data) {
              if (!(await handleCardClick(card_data))) {
                originalOnEnter(target, card_data);
              }
            };
          }
        });
      }
    });

    // 2. Перехватываем клики на постерах
    $(document).on('click', '.card, .poster, [data-card]', async function(e) {
      var cardData = $(this).data('card');
      if (cardData && (await handleCardClick(cardData))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    // 3. Перехватываем открытие карточки
    var originalCardOpen = Lampa.Card.open;
    Lampa.Card.open = async function(card_data, element, options) {
      if (!(await handleCardClick(card_data))) {
        originalCardOpen.call(this, card_data, element, options);
      }
    };

    // 4. Перехватываем Lampac (эпизоды сериалов)
    Lampa.Listener.follow('lampac', function(e) {
      if (e.type === 'complite') {
        const item = e.object.activity.object.item || {};
        const card = e.object.card;
        
        // Добавляем обработчик клика на элементы эпизодов
        setTimeout(() => {
          $('.episodes__item, .episode-item').off('click').on('click', async function(evt) {
            const episodeData = $(this).data();
            if (episodeData && card && (await handleCardClick(card, item.season, episodeData.episode))) {
              evt.preventDefault();
              evt.stopPropagation();
              return false;
            }
          });
        }, 100);
      }
    });

    console.log('Continue Watch plugin initialized - click on poster to continue');
  }
})();
