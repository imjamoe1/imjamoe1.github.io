(function() {
    'use strict';

    // Настройки плагина
    const API_KEY = '2a4a0808-81a3-40ae-b0d3-e11335ede616';
    const TMDB_API_KEY = '4ef0d7355d9ffb5151e987764708ce96';
    const TMDB_API_URL = 'https://api.themoviedb.org/3/';
    const KP_RATING_URL = 'https://rating.kinopoisk.ru/';
    const KP_API_URL = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/';
    const LAMPA_RATING_URL = 'http://cub.rip/api/reactions/get/';
    const CACHE_KEY = 'kp_rating_cache_v3';
    const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 часа
    const CONCURRENT_LIMIT = 3;

    // Очередь запросов
    const queue = [];
    let activeRequests = 0;
    const processedCards = new WeakSet();

    // Иконки для рейтингов
    const KP_ICON_SVG = '<svg width="20" height="20" viewBox="0 0 110 110" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="55" cy="55" r="40" fill="black"/><g transform="translate(10, 10) scale(0.4)"><path fill="white" d="M215 121.415l-99.297-6.644 90.943 36.334a106.416 106.416 0 0 0 8.354-29.69z"/><path fill="white" d="M194.608 171.609C174.933 197.942 143.441 215 107.948 215 48.33 215 0 166.871 0 107.5 0 48.13 48.33 0 107.948 0c35.559 0 67.102 17.122 86.77 43.539l-90.181 48.07L162.57 32.25h-32.169L90.892 86.862V32.25H64.77v150.5h26.123v-54.524l39.509 54.524h32.169l-56.526-57.493 88.564 46.352z"/><path d="M206.646 63.895l-90.308 36.076L215 93.583a106.396 106.396 0 0 0-8.354-29.688z" fill="white"/></g></svg>';      
    const LAMPA_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg"><circle cx="55" cy="55" r="55" fill="black"/><path d="M81.6744 103.11C98.5682 93.7234 110 75.6967 110 55C110 24.6243 85.3757 0 55 0C24.6243 0 0 24.6243 0 55C0 75.6967 11.4318 93.7234 28.3255 103.11C14.8869 94.3724 6 79.224 6 62C6 34.938 27.938 13 55 13C82.062 13 104 34.938 104 62C104 79.224 95.1131 94.3725 81.6744 103.11Z" fill="white"/><path d="M92.9546 80.0076C95.5485 74.5501 97 68.4446 97 62C97 38.804 78.196 20 55 20C31.804 20 13 38.804 13 62C13 68.4446 14.4515 74.5501 17.0454 80.0076C16.3618 77.1161 16 74.1003 16 71C16 49.4609 33.4609 32 55 32C76.5391 32 94 49.4609 94 71C94 74.1003 93.6382 77.1161 92.9546 80.0076Z" fill="white"/><path d="M55 89C69.3594 89 81 77.3594 81 63C81 57.9297 79.5486 53.1983 77.0387 49.1987C82.579 54.7989 86 62.5 86 71C86 88.1208 72.1208 102 55 102C37.8792 102 24 88.1208 24 71C24 62.5 27.421 54.7989 32.9613 49.1987C30.4514 53.1983 29 57.9297 29 63C29 77.3594 40.6406 89 55 89Z" fill="white"/><path d="M73 63C73 72.9411 64.9411 81 55 81C45.0589 81 37 72.9411 37 63C37 53.0589 45.0589 45 55 45C64.9411 45 73 53.0589 73 63Z" fill="white"/></svg>';

    // Флаги стран
    const COUNTRY_FLAGS = {
        'ad': "https://flagcdn.com/ad.svg", // Андорра
        'ae': "https://flagcdn.com/ae.svg", // ОАЭ
        'af': "https://flagcdn.com/af.svg", // Афганистан
        'ag': "https://flagcdn.com/ag.svg", // Антигуа и Барбуда
        'al': "https://flagcdn.com/al.svg", // Албания
        'am': "https://flagcdn.com/am.svg", // Армения
        'ao': "https://flagcdn.com/ao.svg", // Ангола
        'ar': "https://flagcdn.com/ar.svg", // Аргентина
        'at': "https://flagcdn.com/at.svg", // Австрия
        'au': "https://flagcdn.com/au.svg", // Австралия
        'az': "https://flagcdn.com/az.svg", // Азербайджан
        'ba': "https://flagcdn.com/ba.svg", // Босния и Герцеговина
        'bb': "https://flagcdn.com/bb.svg", // Барбадос
        'bd': "https://flagcdn.com/bd.svg", // Бангладеш
        'be': "https://flagcdn.com/be.svg", // Бельгия
        'bf': "https://flagcdn.com/bf.svg", // Буркина-Фасо
        'bg': "https://flagcdn.com/bg.svg", // Болгария
        'bh': "https://flagcdn.com/bh.svg", // Бахрейн
        'bi': "https://flagcdn.com/bi.svg", // Бурунди
        'bj': "https://flagcdn.com/bj.svg", // Бенин
        'bn': "https://flagcdn.com/bn.svg", // Бруней
        'bo': "https://flagcdn.com/bo.svg", // Боливия
        'br': "https://flagcdn.com/br.svg", // Бразилия
        'bs': "https://flagcdn.com/bs.svg", // Багамы
        'bt': "https://flagcdn.com/bt.svg", // Бутан
        'bw': "https://flagcdn.com/bw.svg", // Ботсвана
        'by': "https://flagcdn.com/by.svg", // Беларусь
        'bz': "https://flagcdn.com/bz.svg", // Белиз
        'ca': "https://flagcdn.com/ca.svg", // Канада
        'cd': "https://flagcdn.com/cd.svg", // ДР Конго
        'cf': "https://flagcdn.com/cf.svg", // ЦАР
        'cg': "https://flagcdn.com/cg.svg", // Республика Конго
        'ch': "https://flagcdn.com/ch.svg", // Швейцария
        'ci': "https://flagcdn.com/ci.svg", // Кот-д'Ивуар
        'cl': "https://flagcdn.com/cl.svg", // Чили
        'cm': "https://flagcdn.com/cm.svg", // Камерун
        'cn': "https://flagcdn.com/cn.svg", // Китай
        'co': "https://flagcdn.com/co.svg", // Колумбия
        'cr': "https://flagcdn.com/cr.svg", // Коста-Рика
        'cu': "https://flagcdn.com/cu.svg", // Куба
        'cv': "https://flagcdn.com/cv.svg", // Кабо-Верде
        'cy': "https://flagcdn.com/cy.svg", // Кипр
        'cz': "https://flagcdn.com/cz.svg", // Чехия
        'de': "https://flagcdn.com/de.svg", // Германия
        'dj': "https://flagcdn.com/dj.svg", // Джибути
        'dk': "https://flagcdn.com/dk.svg", // Дания
        'dm': "https://flagcdn.com/dm.svg", // Доминика
        'do': "https://flagcdn.com/do.svg", // Доминикана
        'dz': "https://flagcdn.com/dz.svg", // Алжир
        'ec': "https://flagcdn.com/ec.svg", // Эквадор
        'ee': "https://flagcdn.com/ee.svg", // Эстония
        'eg': "https://flagcdn.com/eg.svg", // Египет
        'er': "https://flagcdn.com/er.svg", // Эритрея
        'es': "https://flagcdn.com/es.svg", // Испания
        'et': "https://flagcdn.com/et.svg", // Эфиопия
        'fi': "https://flagcdn.com/fi.svg", // Финляндия
        'fj': "https://flagcdn.com/fj.svg", // Фиджи
        'fm': "https://flagcdn.com/fm.svg", // Микронезия
        'fr': "https://flagcdn.com/fr.svg", // Франция
        'ga': "https://flagcdn.com/ga.svg", // Габон
        'gb': "https://flagcdn.com/gb.svg", // Великобритания
        'gd': "https://flagcdn.com/gd.svg", // Гренада
        'ge': "https://flagcdn.com/ge.svg", // Грузия
        'gh': "https://flagcdn.com/gh.svg", // Гана
        'gm': "https://flagcdn.com/gm.svg", // Гамбия
        'gn': "https://flagcdn.com/gn.svg", // Гвинея
        'gq': "https://flagcdn.com/gq.svg", // Экваториальная Гвинея
        'gr': "https://flagcdn.com/gr.svg", // Греция
        'gt': "https://flagcdn.com/gt.svg", // Гватемала
        'gw': "https://flagcdn.com/gw.svg", // Гвинея-Бисау
        'gy': "https://flagcdn.com/gy.svg", // Гайана
        'hn': "https://flagcdn.com/hn.svg", // Гондурас
        'hr': "https://flagcdn.com/hr.svg", // Хорватия
        'ht': "https://flagcdn.com/ht.svg", // Гаити
        'hu': "https://flagcdn.com/hu.svg", // Венгрия
        'id': "https://flagcdn.com/id.svg", // Индонезия
        'ie': "https://flagcdn.com/ie.svg", // Ирландия
        'il': "https://flagcdn.com/il.svg", // Израиль
        'in': "https://flagcdn.com/in.svg", // Индия
        'iq': "https://flagcdn.com/iq.svg", // Ирак
        'ir': "https://flagcdn.com/ir.svg", // Иран
        'is': "https://flagcdn.com/is.svg", // Исландия
        'it': "https://flagcdn.com/it.svg", // Италия
        'jm': "https://flagcdn.com/jm.svg", // Ямайка
        'jo': "https://flagcdn.com/jo.svg", // Иордания
        'jp': "https://flagcdn.com/jp.svg", // Япония
        'ke': "https://flagcdn.com/ke.svg", // Кения
        'kg': "https://flagcdn.com/kg.svg", // Киргизия
        'kh': "https://flagcdn.com/kh.svg", // Камбоджа
        'ki': "https://flagcdn.com/ki.svg", // Кирибати
        'km': "https://flagcdn.com/km.svg", // Коморы
        'kn': "https://flagcdn.com/kn.svg", // Сент-Китс и Невис
        'kp': "https://flagcdn.com/kp.svg", // КНДР
        'kr': "https://flagcdn.com/kr.svg", // Южная Корея
        'kw': "https://flagcdn.com/kw.svg", // Кувейт
        'kz': "https://flagcdn.com/kz.svg", // Казахстан
        'la': "https://flagcdn.com/la.svg", // Лаос
        'lb': "https://flagcdn.com/lb.svg", // Ливан
        'lc': "https://flagcdn.com/lc.svg", // Сент-Люсия
        'li': "https://flagcdn.com/li.svg", // Лихтенштейн
        'lk': "https://flagcdn.com/lk.svg", // Шри-Ланка
        'lr': "https://flagcdn.com/lr.svg", // Либерия
        'ls': "https://flagcdn.com/ls.svg", // Лесото
        'lt': "https://flagcdn.com/lt.svg", // Литва
        'lu': "https://flagcdn.com/lu.svg", // Люксембург
        'lv': "https://flagcdn.com/lv.svg", // Латвия
        'ly': "https://flagcdn.com/ly.svg", // Ливия
        'ma': "https://flagcdn.com/ma.svg", // Марокко
        'mc': "https://flagcdn.com/mc.svg", // Монако
        'md': "https://flagcdn.com/md.svg", // Молдова
        'me': "https://flagcdn.com/me.svg", // Черногория
        'mg': "https://flagcdn.com/mg.svg", // Мадагаскар
        'mh': "https://flagcdn.com/mh.svg", // Маршалловы Острова
        'mk': "https://flagcdn.com/mk.svg", // Северная Македония
        'ml': "https://flagcdn.com/ml.svg", // Мали
        'mm': "https://flagcdn.com/mm.svg", // Мьянма
        'mn': "https://flagcdn.com/mn.svg", // Монголия
        'mr': "https://flagcdn.com/mr.svg", // Мавритания
        'mt': "https://flagcdn.com/mt.svg", // Мальта
        'mu': "https://flagcdn.com/mu.svg", // Маврикий
        'mv': "https://flagcdn.com/mv.svg", // Мальдивы
        'mw': "https://flagcdn.com/mw.svg", // Малави
        'mx': "https://flagcdn.com/mx.svg", // Мексика
        'my': "https://flagcdn.com/my.svg", // Малайзия
        'mz': "https://flagcdn.com/mz.svg", // Мозамбик
        'na': "https://flagcdn.com/na.svg", // Намибия
        'ne': "https://flagcdn.com/ne.svg", // Нигер
        'ng': "https://flagcdn.com/ng.svg", // Нигерия
        'ni': "https://flagcdn.com/ni.svg", // Никарагуа
        'nl': "https://flagcdn.com/nl.svg", // Нидерланды
        'no': "https://flagcdn.com/no.svg", // Норвегия
        'np': "https://flagcdn.com/np.svg", // Непал
        'nr': "https://flagcdn.com/nr.svg", // Науру
        'nz': "https://flagcdn.com/nz.svg", // Новая Зеландия
        'om': "https://flagcdn.com/om.svg", // Оман
        'pa': "https://flagcdn.com/pa.svg", // Панама
        'pe': "https://flagcdn.com/pe.svg", // Перу
        'pg': "https://flagcdn.com/pg.svg", // Папуа — Новая Гвинея
        'ph': "https://flagcdn.com/ph.svg", // Филиппины
        'pk': "https://flagcdn.com/pk.svg", // Пакистан
        'pl': "https://flagcdn.com/pl.svg", // Польша
        'pt': "https://flagcdn.com/pt.svg", // Португалия
        'pw': "https://flagcdn.com/pw.svg", // Палау
        'py': "https://flagcdn.com/py.svg", // Парагвай
        'qa': "https://flagcdn.com/qa.svg", // Катар
        'ro': "https://flagcdn.com/ro.svg", // Румыния
        'rs': "https://flagcdn.com/rs.svg", // Сербия
        'ru': "https://flagcdn.com/ru.svg", // Россия
        'rw': "https://flagcdn.com/rw.svg", // Руанда
        'sa': "https://flagcdn.com/sa.svg", // Саудовская Аравия
        'sb': "https://flagcdn.com/sb.svg", // Соломоновы Острова
        'sc': "https://flagcdn.com/sc.svg", // Сейшелы
        'sd': "https://flagcdn.com/sd.svg", // Судан
        'se': "https://flagcdn.com/se.svg", // Швеция
        'sg': "https://flagcdn.com/sg.svg", // Сингапур
        'si': "https://flagcdn.com/si.svg", // Словения
        'sk': "https://flagcdn.com/sk.svg", // Словакия
        'sl': "https://flagcdn.com/sl.svg", // Сьерра-Леоне
        'sm': "https://flagcdn.com/sm.svg", // Сан-Марино
        'sn': "https://flagcdn.com/sn.svg", // Сенегал
        'so': "https://flagcdn.com/so.svg", // Сомали
        'sr': "https://flagcdn.com/sr.svg", // Суринам
        'ss': "https://flagcdn.com/ss.svg", // Южный Судан
        'st': "https://flagcdn.com/st.svg", // Сан-Томе и Принсипи
        'sv': "https://flagcdn.com/sv.svg", // Сальвадор
        'sy': "https://flagcdn.com/sy.svg", // Сирия
        'sz': "https://flagcdn.com/sz.svg", // Эсватини
        'td': "https://flagcdn.com/td.svg", // Чад
        'tg': "https://flagcdn.com/tg.svg", // Того
        'th': "https://flagcdn.com/th.svg", // Таиланд
        'tj': "https://flagcdn.com/tj.svg", // Таджикистан
        'tl': "https://flagcdn.com/tl.svg", // Восточный Тимор
        'tm': "https://flagcdn.com/tm.svg", // Туркменистан
        'tn': "https://flagcdn.com/tn.svg", // Тунис
        'to': "https://flagcdn.com/to.svg", // Тонга
        'tr': "https://flagcdn.com/tr.svg", // Турция
        'tt': "https://flagcdn.com/tt.svg", // Тринидад и Тобаго
        'tv': "https://flagcdn.com/tv.svg", // Тувалу
        'tw': "https://flagcdn.com/tw.svg", // Тайвань
        'tz': "https://flagcdn.com/tz.svg", // Танзания
        'ua': "https://flagcdn.com/ua.svg", // Украина
        'ug': "https://flagcdn.com/ug.svg", // Уганда
        'us': "https://flagcdn.com/us.svg", // США
        'uy': "https://flagcdn.com/uy.svg", // Уругвай
        'uz': "https://flagcdn.com/uz.svg", // Узбекистан
        'va': "https://flagcdn.com/va.svg", // Ватикан
        'vc': "https://flagcdn.com/vc.svg", // Сент-Винсент и Гренадины
        've': "https://flagcdn.com/ve.svg", // Венесуэла
        'vn': "https://flagcdn.com/vn.svg", // Вьетнам
        'vu': "https://flagcdn.com/vu.svg", // Вануату
        'ws': "https://flagcdn.com/ws.svg", // Самоа
        'ye': "https://flagcdn.com/ye.svg", // Йемен
        'za': "https://flagcdn.com/za.svg", // Южная Африка
        'zm': "https://flagcdn.com/zm.svg", // Замбия
        'zw': "https://flagcdn.com/zw.svg"  // Зимбабве
    };

    // Вспомогательные функции
    function normalizeTitle(str) {
        return (str || '')
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[\s.,:;'`!?]+/g, ' ')
            .trim();
    }

    function titlesMatch(a, b) {
        if (!a || !b) return false;
        const cleanA = normalizeTitle(a).replace(/[^a-zа-я0-9]/g, '');
        const cleanB = normalizeTitle(b).replace(/[^a-zа-я0-9]/g, '');
        return cleanA === cleanB || 
               (cleanA.length > 5 && cleanB.includes(cleanA)) ||
               (cleanB.length > 5 && cleanA.includes(cleanB));
    }

    function getCache(key) {
        try {
            const cache = Lampa.Storage.get(CACHE_KEY, {});
            const entry = cache[key];
            if (entry && Date.now() - entry.timestamp < CACHE_TIME) {
                return entry;
            }
        } catch (e) {}
        return null;
    }

    function setCache(key, data) {
        try {
            const cache = Lampa.Storage.get(CACHE_KEY, {});
            cache[key] = { ...data, timestamp: Date.now() };
            Lampa.Storage.set(CACHE_KEY, cache);
        } catch (e) {}
    }

    function enqueue(task) {
        return new Promise((resolve, reject) => {
            queue.push(() => task().then(resolve).catch(reject));
            processQueue();
        });
    }

    function processQueue() {
        if (activeRequests >= CONCURRENT_LIMIT || queue.length === 0) return;
        const next = queue.shift();
        activeRequests++;
        next().finally(() => {
            activeRequests--;
            processQueue();
        });
    }

    async function fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(res.status);
            return res;
        } finally {
            clearTimeout(timeout);
        }
    }

    // Получение полных данных фильма с TMDB
    async function fetchFullMovieData(tmdbId, type) {
        if (!tmdbId || !type) return null;
        
        const cacheKey = `tmdb_full_${type}_${tmdbId}`;
        const cached = getCache(cacheKey);
        if (cached) return cached;
        
        try {
            const url = `${TMDB_API_URL}${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=${Lampa.Storage.get('language') || 'ru'}`;
            const response = await enqueue(() => fetchWithTimeout(url));
            const data = await response.json();
            
            // Кэшируем данные
            setCache(cacheKey, data);
            return data;
        } catch (e) {
            console.log('Error fetching full movie data:', e);
            return null;
        }
    }

    // Получение кода страны из данных TMDB
    function getCountryCode(data) {
        try {
            // Если есть production_countries в данных, используем их
            if (data.production_countries && data.production_countries.length > 0) {
                const countryCode = data.production_countries[0].iso_3166_1.toLowerCase();
                console.log('Found country code:', countryCode, 'for movie:', data.title || data.name);
                return COUNTRY_FLAGS[countryCode] || null;
            }
            
            // Если есть origin_country (для сериалов)
            if (data.origin_country && data.origin_country.length > 0) {
                const countryCode = data.origin_country[0].toLowerCase();
                console.log('Found origin country:', countryCode, 'for series:', data.name);
                return COUNTRY_FLAGS[countryCode] || null;
            }
            
            console.log('No country data found for:', data.title || data.name);
        } catch (e) {
            console.log('Error parsing countries:', e);
        }
        
        return null;
    }

    // Создание элемента флага страны
const flagController = {
    flags: [],
    angle: 0,
    animationId: null,
    startTime: Date.now(),
    
    init() {
        this.animate();
    },
    
    animate() {
        const now = Date.now();
        const elapsed = (now - this.startTime) % 5000;
        const progress = elapsed / 5000;
        
        // Расчет угла для качелей
        if (progress < 0.25) {
            this.angle = 90 * (progress / 0.25);
        } else if (progress < 0.5) {
            this.angle = 90 - (90 * ((progress - 0.25) / 0.25));
        } else if (progress < 0.75) {
            this.angle = -90 * ((progress - 0.5) / 0.25);
        } else {
            this.angle = -90 + (90 * ((progress - 0.75) / 0.25));
        }
        
        // Обновляем все флаги
        this.flags.forEach(flag => {
            if (flag.isConnected) { // Проверяем что элемент еще в DOM
                flag.style.transform = `rotateY(${this.angle}deg)`;
            }
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    },
    
    addFlag(flagElement) {
        this.flags.push(flagElement);
        if (!this.animationId) {
            this.init();
        }
    }
};

// Запускаем контроллер
flagController.init();

function createCountryFlagElement(flagUrl) {
    if (!flagUrl) return null;

    const flagEl = document.createElement('img');
    flagEl.className = 'country-flag';
    flagEl.src = flagUrl;
    flagEl.alt = 'country';
    flagEl.style.cssText = `
        position: absolute;
        top: 2.6em;
        left: -0.5em;
        width: 1.6em;
        height: 1.1em;
        border-radius: 0.2em;
        z-index: 12;
        pointer-events: none;
        user-select: none;
        object-fit: cover;
        background: rgba(0,0,0,0.5);
        transform-origin: center center;
        transition: transform 0.1s linear;
    `;
    
    // Регистрируем флаг в контроллере
    flagController.addFlag(flagEl);
    
    flagEl.onerror = function() {
        this.style.display = 'none';
    };

    return flagEl;
}

    // Получение рейтинга Kinopoisk
    async function fetchKpRating(filmId) {
        try {
            const xmlRes = await enqueue(() => fetchWithTimeout(`${KP_RATING_URL}${filmId}.xml`));
            const text = await xmlRes.text();
            const kp = text.match(/<kp_rating[^>]*>([\d.]+)<\/kp_rating>/);
            return kp ? parseFloat(kp[1]).toFixed(1) : '0.0';
        } catch (e) {}

        try {
            const res = await enqueue(() =>
                fetchWithTimeout(`${KP_API_URL}${filmId}`, {
                    headers: { 'X-API-KEY': API_KEY }
                })
            );
            const json = await res.json();
            return json.ratingKinopoisk ? parseFloat(json.ratingKinopoisk).toFixed(1) : '0.0';
        } catch (e) {
            return '0.0';
        }
    }

    // Получение рейтинга Kinopoisk
    async function fetchKpRating(filmId) {
        try {
            const xmlRes = await enqueue(() => fetchWithTimeout(`${KP_RATING_URL}${filmId}.xml`));
            const text = await xmlRes.text();
            const kp = text.match(/<kp_rating[^>]*>([\d.]+)<\/kp_rating>/);
            return kp ? parseFloat(kp[1]).toFixed(1) : '0.0';
        } catch (e) {}

        try {
            const res = await enqueue(() =>
                fetchWithTimeout(`${KP_API_URL}${filmId}`, {
                    headers: { 'X-API-KEY': API_KEY }
                })
            );
            const json = await res.json();
            return json.ratingKinopoisk ? parseFloat(json.ratingKinopoisk).toFixed(1) : '0.0';
        } catch (e) {
            return '0.0';
        }
    }

    // Поиск фильма на Kinopoisk
    async function searchFilm(title, year = '') {
        if (!title || title.length < 2) {
            return { kp: '0.0', filmId: null };
        }

        const cacheKey = `${normalizeTitle(title)}_${year}`;
        const cached = getCache(cacheKey);
        if (cached) return cached;

        try {
            const url = `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(title)}${year ? `&yearFrom=${year}&yearTo=${year}` : ''}`;
            const res = await enqueue(() =>
                fetchWithTimeout(url, {
                    headers: { 'X-API-KEY': API_KEY }
                })
            );
            const data = await res.json();
            if (!data.films?.length) throw new Error('No results');

            let match = data.films.find(f =>
                titlesMatch(f.nameRu, title) || titlesMatch(f.nameEn, title))
                || data.films[0];

            const kpRating = await fetchKpRating(match.filmId);
            const result = {
                kp: kpRating,
                filmId: match.filmId
            };

            setCache(cacheKey, result);
            return result;
        } catch (e) {
            const fallback = { kp: '0.0', filmId: null };
            setCache(cacheKey, fallback);
            return fallback;
        }
    }

    // Получение рейтинга Lampa
    async function fetchLampaRating(data, card) {
        //if (Lampa.Manifest.origin !== "bylampa") return '0.0';

        const id = data.id || card.getAttribute('data-id') || card.getAttribute('id');
        if (!id) return '0.0';

        const type = data.type || (card.classList.contains('card--tv') ? 'tv' : 'movie');
        const url = `${LAMPA_RATING_URL}${type}_${id}`;

        try {
            const response = await fetchWithTimeout(url);
            const json = await response.json();
            const result = json.result;

            let positive = 0, negative = 0;

            result.forEach(item => {
                if (item.type === 'fire' || item.type === 'nice') {
                    positive += parseInt(item.counter, 10);
                }
                if (item.type === "think" || item.type === "bore" || item.type === 'shit') {
                    negative += parseInt(item.counter, 10);
                }
            });

            const total = positive + negative;
            return total > 0 ? (positive / total * 10).toFixed(1) : '0.0';
        } catch (e) {
            return '0.0';
        }
    }

    // Создание элемента рейтинга
    function createRatingElement(type) {
        const ratingEl = document.createElement('div');
        ratingEl.className = `card__rating card__rating--${type}`;
        ratingEl.style.cssText = `
            position: absolute;
            color: white;
            font-weight: bold;
            padding: 0.1em 0.18em;
            margin: 0;
            border-radius: 1em;
            z-index: 1;
            pointer-events: none;
            font-size: 1.2em;
            user-select: none;
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.5);
            min-width: max-content;
        `;

        const iconEl = document.createElement('div');
        if (type === 'kp') {
            iconEl.innerHTML = KP_ICON_SVG;
            iconEl.style.cssText = `
                width: 1em;
                height: 1em;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                margin-right: 0.1px;
                transform: translateY(0);
            `;
            ratingEl.style.top = '0.2em';
            ratingEl.style.right = '0.2em';
        } else {
            iconEl.innerHTML = LAMPA_ICON_SVG;
            iconEl.style.cssText = `
                width: 1em;
                height: 1em;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                margin-right: 0.1px;
                transform: translateX(0.5px) translateY(2px);
            `;
            ratingEl.style.bottom = '0.2em';
            ratingEl.style.right = '0.2em';
        }

        const textEl = document.createElement('span');
        ratingEl.appendChild(iconEl);
        ratingEl.appendChild(textEl);

        return { element: ratingEl, text: textEl };
    }
    
    // Скрытие стандартного рейтинга TMDB/MDBList
    function hideTmdbRating(card) {
        // Ищем все элементы с рейтингом TMDB
        const voteContainers = card.querySelectorAll('.card__vote');
    
        voteContainers.forEach(container => {
            // Проверяем, содержит ли класс "rate--tmdb" или "tmdb"
            if (container.className.includes('rate--tmdb') || 
                container.className.includes('tmdb') ||
                container.querySelector('.source--name')) {
                container.style.display = 'none';
            }
        });
    }

    // Отрисовка рейтингов на карточке
    async function renderRating(card) {
        if (processedCards.has(card)) return;

        const cardTitle = card.querySelector('.card__title, .card__name')?.textContent || '';
        const isCategory = card.querySelector('.card__count');
        if (isCategory) {
            processedCards.add(card);
            return;
        }

        const isSisiContent = card.closest('.sisi-results, .sisi-videos, .sisi-section') || 
                             card.closest('[data-component*="sisi"]') || 
                             card.closest('[data-name*="sisi"]') ||
                             window.location.href.indexOf('sisi') !== -1;
        
        if (isSisiContent) {
            processedCards.add(card);
            hideTmdbRating(card);
            return;
        }
        
        processedCards.add(card);
        hideTmdbRating(card);

        // Получаем данные карточки
        let data = card.card_data || (card.dataset?.card && JSON.parse(card.dataset.card));
        if (!data) {
            try {
                const titleEl = card.querySelector('.card__title, .card__name');
                const yearEl = card.querySelector('.card__year');
                if (titleEl) {
                    data = {
                        title: titleEl.textContent,
                        year: yearEl ? yearEl.textContent : '',
                        name: titleEl.textContent
                    };
                }
            } catch (e) {
                return;
            }
        }

        if (!data || !data.id) return;

        const title = data.title || data.name || data.original_title || data.original_name;
        if (!title || title.length < 2) return;

        const year = data.year || '';
        const view = card.querySelector('.card__view');
        if (!view) return;

        // Проверяем, не добавлены ли уже элементы
        if (view.querySelector('.card__rating--kp') || view.querySelector('.card__rating--lampa') || view.querySelector('.country-flag')) {
            return;
        }

        // Создаем элементы рейтингов
        const { element: kpElement, text: kpText } = createRatingElement('kp');
        kpText.textContent = '...';
        view.style.position = 'relative';
        view.appendChild(kpElement);

        const { element: lampaElement, text: lampaText } = createRatingElement('lampa');
        lampaText.textContent = '...';
        view.appendChild(lampaElement);

        // Получаем полные данные для определения страны
        const type = data.name ? 'tv' : 'movie';
        const fullData = await fetchFullMovieData(data.id, type);
        
        if (fullData) {
            const flagUrl = getCountryCode(fullData);
            if (flagUrl) {
                const flagElement = createCountryFlagElement(flagUrl);
                if (flagElement) {
                    view.appendChild(flagElement);
                    console.log('Flag added for:', fullData.title || fullData.name);
                }
            }
        }

        try {
            // Получаем рейтинг Kinopoisk
            const { kp } = await searchFilm(title, year);
            kpText.textContent = kp;

            // Получаем рейтинг Lampa
            const lampaRating = await fetchLampaRating(data, card);
            lampaText.textContent = lampaRating;
        } catch (e) {
            kpText.textContent = '0.0';
            lampaText.textContent = '0.0';
        }
    }

    // Инициализация плагина
    function init() {
        if (Lampa.Manifest.origin !== "bylampa") {
            console.log("Рейтинги доступны только на origin bylampa");
            return;
        }

        // Наблюдатель за видимостью карточек
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    renderRating(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '100px' });

        // Обработка существующих карточек
        document.querySelectorAll('.card').forEach(card => {
            observer.observe(card);
            hideTmdbRating(card);
        });

        // Наблюдатель за изменениями DOM
        const mo = new MutationObserver(muts => {
            muts.forEach(mut => {
                mut.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList?.contains('card')) {
                            observer.observe(node);
                            hideTmdbRating(node);
                        }
                        node.querySelectorAll?.('.card').forEach(c => {
                            observer.observe(c);
                            hideTmdbRating(c);
                        });
                    }
                });
            });
        });

        mo.observe(document.body, { childList: true, subtree: true });

        // Подписка на события Lampa
        if (Lampa.Listener) {
            Lampa.Listener.follow('card', e => {
                if (e.type === 'build' && e.card) {
                    renderRating(e.card);
                    hideTmdbRating(e.card);
                }
            });
        }
    }

    // Запуск плагина
    if (typeof Lampa !== 'undefined') {
        Lampa.Platform.tv();
        init();
    } else {
        document.addEventListener('lampaReady', function() {
            Lampa.Platform.tv();
            init();
        });
    }
})();
