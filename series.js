(function () {
  'use strict';

  const API_KEY = '4ef0d7355d9ffb5151e987764708ce96';
  const API_URL = id => `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`;
  const SEASON_URL = (id, season) => `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${API_KEY}`;

  const STYLE = `
    .card__series-label {
      position: absolute;
      bottom: 0.3em;
      left: 0.5em;
      background: rgba(0,0,0,0.5);
      color: #fff;
      font-size: 0.9em;
      font-weight: bold;
      padding: 0.2em 0.3em;
      border-radius: 0.5em;
      z-index: 2;
      pointer-events: none;
      transform: translateY(0.5px);  
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
        
        return cache[id] = {
          season: season_number,
          episode: episode_number,
          totalEpisodes: totalEpisodes
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
    label.textContent = `S${info.season}E${info.episode}${info.totalEpisodes ? `/${info.totalEpisodes}` : ''}`;
    
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
