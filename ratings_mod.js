(() => {
  // ИНИЦИАЛИЗАЦИЯ
  const OMDB_API_KEYS = ['YOUR_OMDB_KEY'];
  const KP_API_KEYS = ['YOUR_KP_KEY'];
  const JACRED_PROTOCOL = 'https://';
  const JACRED_URL = 'parser.ruzha.ru';
  const JACRED_API_KEY = 'YOUR_JACRED_KEY';

  const addLogo = (rateElement, source) => {
    const logos = {
      imdb: '⭐',
      kp: '🎬',
      tmdb: '🎞️',
      rt: '🍅',
      mc: '📊',
      oscars: '🏆',
      emmy: '📺',
      awards: '🎖️',
      avg: '📈'
    };
    const icon = logos[source] || '';
    if (rateElement && icon) rateElement.prepend(icon + ' ');
  };

  const insertRating = (render, name, value, source) => {
    if (!render) return;
    const line = render.querySelector('.full-start-new__rate-line');
    if (!line || line.querySelector('.rate--' + name)) return;
    const el = document.createElement('div');
    el.className = 'full-start__rate rate--' + name;
    el.innerHTML = `<div>${value}</div><div>${source}</div>`;
    addLogo(el, name);
    line.appendChild(el);
  };

  const getAverage = (data) => {
    const weights = { imdb: 0.35, tmdb: 0.15, kp: 0.20, mc: 0.15, rt: 0.15 };
    let total = 0, weight = 0;
    Object.entries(data).forEach(([key, val]) => {
      if (!isNaN(val) && weights[key]) {
        total += val * weights[key];
        weight += weights[key];
      }
    });
    return weight > 0 ? (total / weight).toFixed(1) : null;
  };

  const fetchOMDB = (id, callback) => {
    const key = OMDB_API_KEYS[0];
    fetch(`https://www.omdbapi.com/?apikey=${key}&i=${id}`)
      .then(r => r.json())
      .then(data => {
        const rt = data?.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value.replace('%','');
        const mc = data?.Ratings?.find(r => r.Source === 'Metacritic')?.Value?.split('/')?.[0];
        const imdb = data?.imdbRating;
        callback({ rt: parseFloat(rt), mc: parseFloat(mc), imdb: parseFloat(imdb) });
      }).catch(() => callback(null));
  };

  const fetchKP = (title, year, callback) => {
    const key = KP_API_KEYS[0];
    fetch(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(title)}`, {
      headers: { 'X-API-KEY': key }
    }).then(r => r.json()).then(data => {
      const match = data.films.find(f => f.year?.startsWith(year));
      if (!match) return callback(null);
      fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${match.filmId}`, {
        headers: { 'X-API-KEY': key }
      }).then(r => r.json()).then(film => {
        callback({ kp: film?.ratingKinopoisk, imdb_kp: film?.ratingImdb });
      });
    }).catch(() => callback(null));
  };

  const fetchQuality = (title, year, callback) => {
    const url = `${JACRED_PROTOCOL}${JACRED_URL}/api/v2.0/indexers/all/results?apikey=${JACRED_API_KEY}&uid=maxsm&year=${year}&title=${encodeURIComponent(title)}`;
    fetch(url).then(r => r.json()).then(data => {
      const q = data?.Results?.map(t => t?.info?.quality).filter(q => q >= 720)?.sort((a,b)=>b-a)?.[0];
      callback(q ? `${q}p` : null);
    }).catch(() => callback(null));
  };

  Lampa.Listener.follow('full', e => {
    if (e.type !== 'complite') return;
    const render = e.object?.activity?.render();
    const card = e.data?.movie;
    if (!card || !render) return;

    const imdb_id = card.imdb_id || card.imdb;
    const title = card.original_title || card.title || card.name;
    const year = (card.release_date || card.first_air_date || '').slice(0, 4);

    if (imdb_id) {
      fetchOMDB(imdb_id, omdb => {
        if (omdb) {
          if (omdb.imdb) insertRating(render, 'imdb', omdb.imdb, 'IMDb');
          if (omdb.rt) insertRating(render, 'rt', omdb.rt, 'Tomatoes');
          if (omdb.mc) insertRating(render, 'mc', omdb.mc, 'Metacritic');
          const avg = getAverage({ imdb: omdb.imdb, rt: omdb.rt/10, mc: omdb.mc/10 });
          if (avg) insertRating(render, 'avg', avg, 'Average');
        }
      });
    }

    if (title && year) {
      fetchKP(title, year, kp => {
        if (kp) {
          if (kp.kp) insertRating(render, 'kp', kp.kp, 'Кинопоиск');
          if (!imdb_id && kp.imdb_kp) insertRating(render, 'imdb', kp.imdb_kp, 'IMDb');
        }
      });

      fetchQuality(title, year, quality => {
        if (quality) {
          const q = document.createElement('div');
          q.className = 'full-start__status maxsm-quality';
          q.textContent = quality;
          const line = render.querySelector('.full-start-new__rate-line');
          if (line) line.appendChild(q);
        }
      });
    }
  });
})();
