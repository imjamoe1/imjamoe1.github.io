(function () {
  'use strict';

  const API_KEY = '4ef0d7355d9ffb5151e987764708ce96'; // 🔐 API КЛЮЧ TMDB
  const API_URL = id => `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`;
  const SEASON_URL = (id, season) => `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${API_KEY}`;

const STYLE = `
    .card__series-label {
      position: absolute;
      bottom: 0.3em;
      left: 0.3em;
      background: rgba(0,0,0,0.5);
      color: #fff;
      font-size: 0.9em !important;
      font-weight: bold;
      padding: 0.3em 0.5em !important;
      border-radius: 1em !important;
      z-index: 2;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 0.4em;
      min-height: 1.6em;
      box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.7);
    }
    
    .card__series-completed,
    .card__series-ongoing {
      display: flex;
      align-items: center;
      gap: 0.3em;
    }
    
    .card__series-completed span,
    .card__series-ongoing span {
      display: inline-block;
      line-height: 1;
      vertical-align: baseline;
      font-size: 0.95em;
    }
    
    /* Универсальные размеры SVG через em */
    .card__series-completed-svg {
      width: 1.2em !important;
      height: 1.2em !important;
      display: inline-block;
      vertical-align: middle;
      position: relative;
      top: 0.05em;
    }
    
    .card__series-ongoing-svg {
      width: 1.1em !important;
      height: 1.4em !important;
      display: inline-block;
      vertical-align: middle;
      position: relative;
      top: 0.05em;
    }
    
    /* Адаптация для разных размеров экрана */
    @media (max-width: 768px) {
      .card__series-label {
        font-size: 0.85em !important;
        padding: 0.25em 0.4em !important;
        gap: 0.3em;
      }
      .card__series-completed-svg {
        width: 1em !important;
        height: 1em !important;
      }
      .card__series-ongoing-svg {
        width: 0.9em !important;
        height: 1.2em !important;
      }
    }
    
    @media (min-width: 1920px) {
      .card__series-label {
        font-size: 1em !important;
        padding: 0.35em 0.6em !important;
        gap: 0.5em;
      }
    }
  `;

  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: STYLE }));

  const cache = {};
  const seasonCache = {};
  const processed = new WeakSet();

  async function fetchSeasonInfo(id, season) {
    const cacheKey = `${id}-${season}`;
    if (seasonCache[cacheKey]) return seasonCache[cacheKey];

    try {
      const res = await fetch(SEASON_URL(id, season));
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();

      if (json?.episodes) {
        const totalEpisodes = json.episodes.length;
        seasonCache[cacheKey] = totalEpisodes;
        return totalEpisodes;
      }
    } catch (e) {
      console.error(`❌ TMDB season fetch error for ID ${id} season ${season}:`, e);
    }

    seasonCache[cacheKey] = null;
    return null;
  }

  async function fetchEpisodeInfo(id) {
    if (cache[id]) return cache[id];

    try {
      const res = await fetch(API_URL(id));
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();

      if (json?.last_episode_to_air) {
        const { season_number, episode_number } = json.last_episode_to_air;
        const totalEpisodes = await fetchSeasonInfo(id, season_number);
        
        // Проверяем статус сериала
        const isCompleted = json.status === 'Ended' || json.status === 'Canceled';
        const isOngoing = json.status === 'Returning Series' || !isCompleted;
        
        return cache[id] = {
          season: season_number,
          episode: episode_number,
          totalEpisodes: totalEpisodes,
          isCompleted: isCompleted,
          isOngoing: isOngoing,
          status: json.status
        };
      }
    } catch (e) {
      console.error(`❌ TMDB fetch error for ID ${id}:`, e);
    }

    return cache[id] = null;
  }

  // Функция для проверки, является ли карточка сериалом
  function isTvSeries(card) {
    let data = card.card_data || (card.dataset?.card && JSON.parse(card.dataset.card));
    
    // Проверяем различные признаки сериала
    if (data?.type === 'tv') return true;
    if (data?.first_air_date) return true;
    if (data?.number_of_seasons) return true;
    if (data?.number_of_episodes) return true;
    if (card.classList?.contains('card--tv')) return true;
    
    // Проверяем по наличию TV метки в интерфейсе
    const tvLabel = card.querySelector('.card__type');
    if (tvLabel && tvLabel.textContent === 'TV') return true;
    
    return false;
  }

  async function renderStatus(card) {
    if (processed.has(card)) return;
    
    // Проверяем, что это сериал
    if (!isTvSeries(card)) return;

    let data = card.card_data || (card.dataset?.card && JSON.parse(card.dataset.card));
    if (!data?.id) return;

    const view = card.element?.querySelector('.card__view') || card.querySelector('.card__view');
    if (!view) return;

    const info = await fetchEpisodeInfo(data.id);
    if (!info) return;

    const label = document.createElement('div');
    label.className = 'card__series-label';
    
    // Добавляем классы в зависимости от статуса
    if (info.isCompleted) {
      label.classList.add('card__series-completed');
    } else if (info.isOngoing) {
      label.classList.add('card__series-ongoing');
    }
    
    // Форматируем текст с учетом статуса сериала
    let labelText = `S${info.season}E${info.episode}`;
    if (info.totalEpisodes) {
      labelText += `/${info.totalEpisodes}`;
    }
    
    if (info.isCompleted) {
      // Для завершенных сериалов добавляем текст и SVG галочку
      const textSpan = document.createElement('span');
      textSpan.textContent = labelText;
      
      const svg = document.createElement('div');
      svg.className = 'card__series-completed-svg';
      // 🔽 SVG КОД ДЛЯ ЗАВЕРШЁН
      svg.innerHTML = `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="980" height="980" viewBox="0 0 980 980" preserveAspectRatio="xMidYMid meet"><g transform="translate(0,980) scale(0.1,-0.1)" fill="#ffffff" stroke="none"><path d="M4560 9789 c-824 -56 -1659 -338 -2350 -794 -295 -195 -496 -360 -771 -634 -207 -207 -329 -346 -474 -541 -945 -1272 -1215 -2924 -723 -4440 194 -597 500 -1146 922 -1650 98 -117 370 -393 496 -504 1328 -1166 3158 -1531 4825 -962 895 305 1700 879 2281 1627 671 863 1035 1924 1034 3014 0 275 -34 639 -84 896 l-21 114 -288 3 c-158 1 -287 -1 -287 -6 0 -4 9 -48 19 -97 69 -315 95 -568 94 -920 0 -301 -13 -467 -59 -733 -200 -1179 -895 -2234 -1904 -2895 -580 -379 -1219 -605 -1932 -683 -187 -21 -655 -24 -833 -5 -906 94 -1699 423 -2382 989 -152 127 -394 365 -520 513 -577 679 -920 1479 -1019 2381 -24 210 -24 666 0 876 112 1017 535 1911 1241 2618 730 732 1629 1156 2680 1265 154 16 635 16 790 0 440 -45 840 -142 1233 -300 l52 -21 0 303 0 303 -175 57 c-588 190 -1221 268 -1845 226z" stroke="#ffffff" stroke-width="300"/><path d="M9199 8842 c-1501 -952 -3021 -2236 -4324 -3653 -201 -218 -420 -467 -565 -642 -58 -69 -107 -126 -110 -126 -3 -1 -102 76 -220 170 -118 95 -332 265 -475 379 -143 113 -415 330 -605 481 -545 434 -684 544 -697 552 -12 8 -888 -697 -888 -714 0 -11 3444 -3569 3455 -3569 4 0 15 21 25 48 45 119 198 459 306 677 691 1404 1815 3073 2998 4455 431 503 765 858 1269 1351 l203 198 -101 238 c-56 131 -104 241 -109 246 -4 4 -77 -37 -162 -91z" stroke="#ffffff" stroke-width="300"/></g></svg>`;
      
      label.appendChild(textSpan);
      label.appendChild(svg);
    } else if (info.isOngoing) {
      // Для онгоингов добавляем текст и SVG
      const textSpan = document.createElement('span');
      textSpan.textContent = labelText;
      
      const svg = document.createElement('div');
      svg.className = 'card__series-ongoing-svg';
      // 🔽 SVG КОД ДЛЯ ИДЕТ ОНГОИНГ     
      svg.innerHTML = `<svg width="135" height="147" viewBox="0 0 135 147" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M121.5 96.8823C139.5 86.49 139.5 60.5092 121.5 50.1169L41.25 3.78454C23.25 -6.60776 0.750004 6.38265 0.750001 27.1673L0.75 51.9742C4.70314 35.7475 23.6209 26.8138 39.0547 35.7701L94.8534 68.1505C110.252 77.0864 111.909 97.8693 99.8725 109.369L121.5 96.8823Z" fill="#FFFFFF"/><path d="M63 84.9836C80.3333 94.991 80.3333 120.01 63 130.017L39.75 143.44C22.4167 153.448 0.749999 140.938 0.75 120.924L0.750001 94.0769C0.750002 74.0621 22.4167 61.5528 39.75 71.5602L63 84.9836Z" fill="#FFFFFF"/></svg>`;
      
      label.appendChild(textSpan);
      label.appendChild(svg);
    } else {
      label.textContent = labelText;
    }
    
    view.appendChild(label);
    processed.add(card);
  }

  function init() {
    // Для старых карточек
    Lampa.Listener.follow('card', (event) => {
      if (event.type === 'build' && event.card) {
        renderStatus(event.card);
      }
    });

    // Для новых карточек
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.card:not(.processed-series)').forEach(card => {
        card.classList.add('processed-series');
        renderStatus(card);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (typeof Lampa !== 'undefined') {
    init();
  } else {
    document.addEventListener('lampaReady', init);
  }
})();






































