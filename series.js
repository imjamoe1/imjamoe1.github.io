(function () {
  'use strict';

  const API_KEY = '4ef0d7355d9ffb5151e987764708ce96'; // 🔐 API КЛЮЧ TMDB
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
    .card__series-completed {
      background: rgba(0,0,0,0.5) !important;
      padding: 0.1em 0.3em !important;
    }
    .card__series-completed-svg {
      width: 12px;
      height: 12px;
      display: inline-block;
      //margin-left: 0.1em;
    }
    .card__series-ongoing {
      display: flex;
      align-items: center;
      gap: 0.3em;
    }
    .card__series-ongoing-svg {
      width: 10px;
      height: 12px;
      display: inline-block;
      //filter: brightness(0) invert(1);
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
      svg.innerHTML = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100" height="100" viewBox="0 0 822 822" enable-background="new 0 0 992 992" xml:space="preserve"><path fill="#FFFFFF" opacity="1.000000" stroke="none" d="M464.363800,798.981506 C428.742523,794.628967 394.881531,785.557312 363.400726,769.178955 C277.603180,724.541748 223.505264,655.053284 201.948975,560.637878 C195.987778,534.528259 194.046005,507.860168 195.912125,481.212982 C202.869919,381.859344 247.534729,303.561218 329.220367,246.671066 C367.621155,219.926758 410.517792,203.781052 456.833679,198.035522 C544.517212,187.158325 623.204407,209.129379 691.948730,265.187256 C696.593628,268.975006 700.936523,273.130951 705.488464,277.035614 C707.924622,279.125427 707.992920,280.891113 705.619263,283.210175 C696.565308,292.056061 687.598938,300.993225 678.704834,310.000031 C676.176880,312.559937 674.544922,311.331238 672.475464,309.417755 C652.127197,290.603363 629.414673,275.317871 604.140503,263.882629 C578.282959,252.183456 551.278564,244.815948 522.989868,242.177643 C467.310577,236.984756 415.184631,248.301300 367.208801,276.932495 C315.628998,307.714508 279.155029,351.569885 257.507538,407.635284 C244.099884,442.360168 238.556763,478.558014 241.607437,515.454834 C248.080307,593.741882 282.853302,657.103333 345.657928,704.598083 C377.985596,729.045349 414.456909,744.584656 454.356781,751.222534 C512.398315,760.878418 567.752502,752.300415 619.709412,724.141602 C668.723572,697.577515 705.334045,659.023865 729.774109,608.994568 C742.971252,581.979858 750.945129,553.425964 753.822327,523.439636 C757.772278,482.274200 752.592102,442.413208 737.165344,403.986206 C735.767517,400.504181 735.943848,397.890106 738.350586,394.867035 C747.067078,383.918304 755.526611,372.765167 764.093811,361.697418 C764.792603,360.794556 765.354858,359.693756 766.823975,359.508789 C769.011169,360.152435 769.298523,362.409790 770.109009,364.099884 C783.580566,392.192841 793.036133,421.501740 797.483459,452.436279 C800.718201,474.936127 802.068726,497.458771 800.242737,520.120178 C794.943970,585.878662 771.556335,644.263306 728.478638,694.432861 C683.291016,747.059753 626.688538,780.552734 558.726074,794.669373 C532.494568,800.118042 505.944489,801.434021 479.238617,800.207947 C474.423767,799.986938 469.623840,799.440002 464.363800,798.981506 z"/><path fill="#FFFFFF" opacity="1.000000" stroke="none" d="M420.081299,580.880493 C390.338959,540.056885 360.804504,499.524719 331.261230,458.998962 C326.144684,451.980347 326.239441,444.237335 331.577026,437.334900 C347.462341,416.792480 373.558197,410.984375 399.669647,422.058197 C414.063263,428.162506 425.145630,437.930817 434.048523,450.774963 C453.884949,479.392944 474.142853,507.718994 494.263580,536.139526 C498.095276,541.551819 499.129150,541.515259 503.416229,536.251465 C530.982117,502.404388 556.916748,467.257080 585.288879,434.046814 C620.833618,392.440887 658.660278,353.058014 698.596313,315.654968 C761.353760,256.877930 828.656616,203.758392 898.761108,154.097824 C902.839050,151.209106 906.923157,148.327179 911.064514,145.531219 C912.354370,144.660431 913.484924,143.174484 915.730164,143.800293 C914.606689,147.144257 911.966492,149.268738 909.871033,151.660843 C861.231079,207.186356 813.810974,263.727631 767.775391,321.435028 C731.092041,367.419067 695.468323,414.203156 661.121094,461.953186 C632.905640,501.178711 606.073120,541.352905 579.762146,581.872803 C570.551453,596.057556 560.534790,609.521057 547.267273,620.196350 C518.426147,643.402405 477.225891,642.832947 449.189331,618.734802 C440.246918,611.048584 434.893921,600.379578 427.668732,591.254211 C425.085236,587.991333 422.740143,584.539612 420.081299,580.880493 z"/></svg>`;
      
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








