(function () {
    'use strict';

    /*** ========== МУЛЬТИЯЗЫЧНОСТЬ ========== ***/
    // Объединяем все языковые строки
    if (window.Lampa && Lampa.Lang) {
        Lampa.Lang.add({
            lq_additional_ratings: {
                ru: "Дополнительные рейтинги и качество",
                en: "Additional Ratings & Quality",
                uk: "Додаткові рейтинги та якість"
            },
            lq_api_key_mdblist: {
                ru: "Введите ключ MDBList",
                en: "Enter your MDBList API Key",
                uk: "Введіть ваш MDBList API Key"
            },
            lq_api_key_omdb: {
                ru: "Введите ключ OMDB",
                en: "Enter your OMDB API Key",
                uk: "Введіть ваш OMDB API Key"
            },
            lq_api_key_kp: {
                ru: "Введите ключ Kinopoisk",
                en: "Enter your Kinopoisk API Key",
                uk: "Введіть ваш Kinopoisk API Key"
            },
            lq_select_sources: {
                ru: "Выбрать источники рейтингов",
                en: "Select Rating Providers",
                uk: "Обрати джерела рейтингів"
            },
            lq_logo_toggle: {
                ru: "Логотип вместо заголовка",
                en: "Logo Instead of Title",
                uk: "Логотип замість заголовка"
            },
            lq_logo_height: {
                ru: "Размер логотипа",
                en: "Logo Size",
                uk: "Висота логотипу"
            },
            lq_quality: {
                ru: "Показывать качество релиза",
                en: "Show Release Quality",
                uk: "Показувати якість релізу"
            },
            lq_awards: {
                ru: "Показывать награды",
                en: "Show Awards",
                uk: "Показувати нагороди"
            },
            lq_clear_cache: {
                ru: "Очистить кэш",
                en: "Clear Cache",
                uk: "Очистити кеш"
            },
            lq_loading: {
                ru: "Загрузка...",
                en: "Loading...",
                uk: "Завантаження..."
            },
            lq_no_description: {
                ru: "Нет описания",
                en: "No description",
                uk: "Немає опису"
            }
        });
    }

    /*** ========== СТИЛИ ========== ***/
    // Весь CSS объединён
    var style_id = 'lampa_ratings_quality_style';
    if (!$('style[data-id="' + style_id + '"]').length) {
        Lampa.Template.add(style_id, `
            <style data-id="${style_id}">
            .lq-rate-line { display: flex; flex-wrap: wrap; gap: 0.5em; margin-bottom: 1em; }
            .lq-rate-box { display: flex; align-items: center; background: rgba(255,255,255,.12); border-radius: .3em; font-size: 1.2em; padding: .1em .3em; }
            .lq-rate-logo { height: 1em; margin-left: .3em; }
            .lq-awards { color: gold; }
            .lq-quality { background: #FFD700; color: #000; font-weight: bold; min-width: 2.8em; text-align: center; border-radius: .3em; padding: .1em .3em; margin-left: .5em; }
            .lq-logo-title img { max-height: 100px; max-width: 100%; vertical-align: middle; }
            .lq-loading { font-size: 1.2em; color: #fff; background: rgba(0,0,0,0.4); padding: .4em 1em; border-radius: .4em; display: inline-block; }
            </style>
        `);
        $('body').append(Lampa.Template.get(style_id, {}, true));
    }

    /*** ========== НАСТРОЙКИ ========== ***/
    // Все настройки в одну секцию
    var config = {
        mdblist: { api_url: 'https://api.mdblist.com/tmdb/', cache_key: 'lq_mdblist_cache', cache_time: 60 * 60 * 12 * 1000 },
        omdb: { api_url: 'https://www.omdbapi.com/', cache_key: 'lq_omdb_cache', cache_time: 3 * 24 * 60 * 60 * 1000 },
        kp:   { api_url: 'https://kinopoiskapiunofficial.tech/', cache_key: 'lq_kp_cache', cache_time: 3 * 24 * 60 * 60 * 1000 },
        jacred: { url: 'parser.ruzha.ru', key: 'BCqr1JX01ISh', cache_key: 'lq_quality_cache', cache_time: 24 * 60 * 60 * 1000 },
        sources: [
            { key: 'imdb',   title: 'IMDb' },
            { key: 'tmdb',   title: 'TMDB' },
            { key: 'kp',     title: 'Кинопоиск' },
            { key: 'rt',     title: 'Rotten Tomatoes' },
            { key: 'mc',     title: 'Metacritic' },
            { key: 'trakt',  title: 'Trakt' },
            { key: 'letterboxd', title: 'Letterboxd' },
            { key: 'rogerebert', title: 'Roger Ebert' }
        ]
    };

    // Инициализация настроек (SettingsApi)
    if (window.Lampa && Lampa.SettingsApi) {
        Lampa.SettingsApi.addComponent({
            component: 'lq_ratings_quality',
            name: Lampa.Lang.translate('lq_additional_ratings'),
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 54 54" fill="none"><circle cx="32" cy="32" r="25" stroke="#FFD700" stroke-width="6"/><text x="32" y="38" text-anchor="middle" font-size="18" fill="#FFD700">★</text></svg>'
        });
        // API Keys
        Lampa.SettingsApi.addParam({
            component: 'lq_ratings_quality',
            param: { name: 'mdblist_api_key', type: 'input', default: '', placeholder: 'API key' },
            field: { name: 'MDBList', description: Lampa.Lang.translate('lq_api_key_mdblist') },
            onChange: function(){ Lampa.Settings.update(); }
        });
        Lampa.SettingsApi.addParam({
            component: 'lq_ratings_quality',
            param: { name: 'omdb_api_key', type: 'input', default: '', placeholder: 'API key' },
            field: { name: 'OMDB', description: Lampa.Lang.translate('lq_api_key_omdb') },
            onChange: function(){ Lampa.Settings.update(); }
        });
        Lampa.SettingsApi.addParam({
            component: 'lq_ratings_quality',
            param: { name: 'kp_api_key', type: 'input', default: '', placeholder: 'API key' },
            field: { name: 'Kinopoisk', description: Lampa.Lang.translate('lq_api_key_kp') },
            onChange: function(){ Lampa.Settings.update(); }
        });
        // Выбор источников
        Lampa.SettingsApi.addParam({
            component: 'lq_ratings_quality',
            param: { name: 'lq_sources', type: 'button' },
            field: { name: Lampa.Lang.translate('lq_select_sources') },
            onChange: function(){
                showSourcesDialog();
            }
        });
        // Тогглы
        Lampa.SettingsApi.addParam({
            component: 'lq_ratings_quality',
            param: { name: 'lq_logo_title', type: 'trigger', default: false },
            field: { name: Lampa.Lang.translate('lq_logo_toggle') },
            onChange: function(){}
        });
        Lampa.SettingsApi.addParam({
            component: 'lq_ratings_quality',
            param: { name: 'lq_logo_height', type: 'select', default: '100', values: { '50':'50px','100':'100px','150':'150px','200':'200px','250':'250px','300':'300px' } },
            field: { name: Lampa.Lang.translate('lq_logo_height') },
            onChange: function(){}
        });
        Lampa.SettingsApi.addParam({
            component: 'lq_ratings_quality',
            param: { name: 'lq_show_quality', type: 'trigger', default: true },
            field: { name: Lampa.Lang.translate('lq_quality') },
            onChange: function(){}
        });
        Lampa.SettingsApi.addParam({
            component: 'lq_ratings_quality',
            param: { name: 'lq_show_awards', type: 'trigger', default: true },
            field: { name: Lampa.Lang.translate('lq_awards') },
            onChange: function(){}
        });
        Lampa.SettingsApi.addParam({
            component: 'lq_ratings_quality',
            param: { name: 'lq_clear_cache', type: 'button' },
            field: { name: Lampa.Lang.translate('lq_clear_cache') },
            onChange: function() {
                localStorage.removeItem(config.mdblist.cache_key);
                localStorage.removeItem(config.omdb.cache_key);
                localStorage.removeItem(config.kp.cache_key);
                localStorage.removeItem(config.jacred.cache_key);
                window.location.reload();
            }
        });
    }

    // Диалог выбора источников рейтингов
    function showSourcesDialog(){
        var items = config.sources.map(function(src){
            var checked = Lampa.Storage.get('lq_show_' + src.key, true);
            return {
                title: src.title,
                id: src.key,
                checkbox: true,
                checked: checked
            };
        });
        var ctrl = Lampa.Controller.enabled().name;
        Lampa.Select.show({
            title: Lampa.Lang.translate('lq_select_sources'),
            items: items,
            onBack: ()=>Lampa.Controller.toggle(ctrl),
            onCheck: function(item){
                Lampa.Storage.set('lq_show_' + item.id, item.checked);
            }
        });
    }

    /*** ========== КЭШ ========== ***/
    function getCache(key, cache_key, cache_time){
        var cache = Lampa.Storage.get(cache_key) || {};
        var item = cache[key];
        return item && (Date.now() - item.timestamp < cache_time) ? item.data : null;
    }
    function setCache(key, cache_key, cache_time, data){
        var cache = Lampa.Storage.get(cache_key) || {};
        cache[key] = { timestamp: Date.now(), data: data };
        Lampa.Storage.set(cache_key, cache);
    }

    /*** ========== СЕТЕВЫЕ ЗАПРОСЫ ========== ***/

    // MDBList
    function fetchMDBList(tmdb_id, type, cb){
        var api_key = Lampa.Storage.get('mdblist_api_key', '');
        if(!api_key) return cb({});
        var cache = getCache(tmdb_id, config.mdblist.cache_key, config.mdblist.cache_time);
        if(cache) return cb(cache);
        var url = config.mdblist.api_url + (type=='tv'?'show':'movie') + '/' + tmdb_id + '?apikey=' + api_key;
        new Lampa.Reguest().silent(url, function(resp){
            var out = {};
            if(resp && resp.ratings) resp.ratings.forEach(function(r){ if(r.source) out[r.source]=r.value; });
            setCache(tmdb_id, config.mdblist.cache_key, config.mdblist.cache_time, out);
            cb(out);
        }, ()=>cb({}));
    }

    // OMDB
    function fetchOMDB(imdb_id, cb){
        var api_key = Lampa.Storage.get('omdb_api_key', '');
        if(!api_key || !imdb_id) return cb({});
        var cache = getCache(imdb_id, config.omdb.cache_key, config.omdb.cache_time);
        if(cache) return cb(cache);
        var url = config.omdb.api_url + '?apikey=' + api_key + '&i=' + imdb_id;
        new Lampa.Reguest().silent(url, function(data){
            var out = {};
            if(data && data.Response === 'True'){
                out.imdb = data.imdbRating ? parseFloat(data.imdbRating) : null;
                out.rt = extractRating(data.Ratings, 'Rotten Tomatoes');
                out.mc = extractRating(data.Ratings, 'Metacritic');
                out.awards = data.Awards || '';
                out.age = data.Rated || '';
            }
            setCache(imdb_id, config.omdb.cache_key, config.omdb.cache_time, out);
            cb(out);
        }, ()=>cb({}));
    }
    function extractRating(ratings, source){
        if(!ratings) return null;
        var r = ratings.find(function(x){return x.Source===source;});
        if(!r) return null;
        if(source==='Rotten Tomatoes') return parseInt(r.Value);
        if(source==='Metacritic') return parseInt(r.Value);
        return null;
    }

    // Kinopoisk
    function fetchKP(card, cb){
        var api_key = Lampa.Storage.get('kp_api_key', '');
        if(!api_key) return cb({});
        var kp_id = card.kinopoisk_id;
        if(!kp_id){
            // Поиск по названию и году
            var title = card.original_title || card.title || '';
            var year = (card.release_date||'').slice(0,4);
            if(!title || !year) return cb({});
            var url = config.kp.api_url+'api/v2.1/films/search-by-keyword?keyword='+encodeURIComponent(title);
            fetch(url, { headers: {'X-API-KEY': api_key} })
                .then(x=>x.json()).then(data=>{
                    var f = data.films && data.films.find(f=>String(f.year)===year);
                    if(f && f.filmId) fetchKPById(f.filmId, api_key, cb); else cb({});
                }).catch(()=>cb({}));
        }else{
            fetchKPById(kp_id, api_key, cb);
        }
    }
    function fetchKPById(id, api_key, cb){
        var cache = getCache(id, config.kp.cache_key, config.kp.cache_time);
        if(cache) return cb(cache);
        fetch(config.kp.api_url+'api/v2.2/films/'+id, { headers: {'X-API-KEY': api_key} })
            .then(x=>x.json()).then(data=>{
                var out = { kp: data.ratingKinopoisk||null, imdb: data.ratingImdb||null };
                setCache(id, config.kp.cache_key, config.kp.cache_time, out);
                cb(out);
            }).catch(()=>cb({}));
    }

    // JacRed - качество
    function fetchQuality(card, cb){
        var key = card.id;
        var cache = getCache(key, config.jacred.cache_key, config.jacred.cache_time);
        if(cache) return cb(cache);
        var year = (card.release_date||'').slice(0,4);
        var title = card.original_title || card.title || '';
        if(!title || !year) return cb('');
        var url = 'https://'+config.jacred.url+'/api/v2.0/indexers/all/results?title='+encodeURIComponent(title)+'&year='+year+'&apikey='+config.jacred.key;
        new Lampa.Reguest().silent(url, function(resp){
            var q = '';
            if(resp && resp.Results){
                var best = resp.Results.reduce(function(a,b){
                    return (b.info && b.info.quality && b.info.quality > (a.info?a.info.quality:0))?b:a;
                },{});
                if(best && best.info && best.info.quality){
                    q = best.info.quality >= 2160 ? '4K' : best.info.quality >= 1080 ? 'FHD' : best.info.quality >= 720 ? 'HD' : 'SD';
                }
            }
            setCache(key, config.jacred.cache_key, config.jacred.cache_time, q);
            cb(q);
        }, ()=>cb(''));
    }

    /*** ========== ЛОГОТИПЫ ========== ***/
    function fetchLogo(card, cb){
        var api_url = Lampa.TMDB.api((card.method == 'tv' ? 'tv/' : 'movie/') + card.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language'));
        new Lampa.Reguest().silent(api_url, function(resp){
            var logo = null;
            if(resp && resp.logos && resp.logos.length) logo=resp.logos[0].file_path;
            cb(logo ? Lampa.TMDB.image('/t/p/original'+logo) : null);
        }, ()=>cb(null));
    }

    /*** ========== ОТРИСОВКА КАРТОЧКИ ========== ***/
    function renderCard(card, render){
        // 1. Логотип вместо заголовка
        var show_logo = Lampa.Storage.get('lq_logo_title', false);
        var logo_height = Lampa.Storage.get('lq_logo_height', '100');
        var titleEl = $(render).find('.new-interface-info__title, .full-start-new__title').first();
        if(show_logo && titleEl.length && card.title){
            fetchLogo(card, function(url){
                if(url){ titleEl.html('<img src="'+url+'" style="max-height:'+logo_height+'px;">'); }
                else { titleEl.text(card.title); }
            });
        }
        // 2. Описание
        var desc = card.overview || Lampa.Lang.translate('lq_no_description');
        $(render).find('.new-interface-info__description').text(desc);

        // 3. Рейтинги
        var rateLine = $(render).find('.lq-rate-line');
        if(!rateLine.length){
            rateLine = $('<div class="lq-rate-line"></div>');
            $(render).find('.new-interface-info__details').append(rateLine);
        }
        rateLine.html('<span class="lq-loading">'+Lampa.Lang.translate('lq_loading')+'</span>');

        // 4. Получить все рейтинги
        var tasks = [];
        var results = {};
        function task(name, fn){ tasks.push(new Promise(r=>fn(x=>{results[name]=x;r();}))); }

        // MDBList
        task('mdb', cb=>fetchMDBList(card.id, card.method, cb));
        // OMDB
        task('omdb', cb=>fetchOMDB(card.imdb_id, cb));
        // Kinopoisk
        task('kp', cb=>fetchKP(card, cb));
        // Качество
        var show_quality = Lampa.Storage.get('lq_show_quality', true);
        if(show_quality) task('quality', cb=>fetchQuality(card, cb));

        Promise.all(tasks).then(function(){
            rateLine.empty();
            // Выводим рейтинги согласно выбранным источникам
            config.sources.forEach(function(src){
                var show = Lampa.Storage.get('lq_show_'+src.key, true);
                var val = (src.key=='imdb')?results.omdb.imdb||(results.kp.imdb): (src.key=='kp'?results.kp.kp: results.mdb[src.key]);
                if(show && val){
                    rateLine.append('<div class="lq-rate-box">'+val+' <span class="lq-rate-logo">'+src.title+'</span></div>');
                }
            });
            // Rotten Tomatoes
            if(Lampa.Storage.get('lq_show_rt', true) && results.omdb.rt){
                rateLine.append('<div class="lq-rate-box">'+results.omdb.rt+' <span class="lq-rate-logo">RT</span></div>');
            }
            // Metacritic
            if(Lampa.Storage.get('lq_show_mc', true) && results.omdb.mc){
                rateLine.append('<div class="lq-rate-box">'+results.omdb.mc+' <span class="lq-rate-logo">MC</span></div>');
            }
            // Качество
            if(show_quality && results.quality){
                rateLine.append('<div class="lq-quality">'+results.quality+'</div>');
            }
            // Награды
            var show_awards = Lampa.Storage.get('lq_show_awards', true);
            if(show_awards && results.omdb.awards){
                var aw = results.omdb.awards;
                var oscar = aw.match(/Won (\d+) Oscars?/i);
                var emmy = aw.match(/Won (\d+) Primetime Emmys?/i);
                var other = aw.match(/Another (\d+) wins?/i);
                if(oscar) rateLine.append('<div class="lq-awards">Oscars: '+oscar[1]+'</div>');
                if(emmy) rateLine.append('<div class="lq-awards">Emmy: '+emmy[1]+'</div>');
                if(other) rateLine.append('<div class="lq-awards">Awards: '+other[1]+'</div>');
            }
        });
    }

    /*** ========== ИНИЦИАЛИЗАЦИЯ ========== ***/
    function startPlugin(){
        if(window.lampa_ratings_quality_plugin_started) return;
        window.lampa_ratings_quality_plugin_started = true;
        // "full" карточка
        Lampa.Listener.follow('full', function(e){
            if(e.type==='complite'){
                var card = e.data.movie;
                card.method = card.name?'tv':'movie';
                var render = e.object.activity.render();
                renderCard(card, render);
            }
        });
        // Для новых карточек в списках (качество)
        var observer = new MutationObserver(function(muts){
            var cards = [];
            muts.forEach(function(m){
                m.addedNodes.forEach(function(node){
                    if(node.nodeType===1 && node.classList && node.classList.contains('card')) cards.push(node);
                    $(node).find('.card').each(function(){ cards.push(this); });
                });
            });
            cards.forEach(function(card){
                if(card.hasAttribute('data-lq-quality')) return;
                var data = card.card_data;
                if(!data) return;
                var show_quality = Lampa.Storage.get('lq_show_quality', true);
                if(show_quality) fetchQuality(data, function(q){
                    card.setAttribute('data-lq-quality','true');
                    var cv = card.querySelector('.card__view');
                    if(cv && q){
                        var el = cv.querySelector('.card__quality') || document.createElement('div');
                        el.className = 'card__quality lq-quality';
                        el.textContent = q;
                        if(!cv.querySelector('.card__quality')) cv.appendChild(el);
                    }
                });
            });
        });
        observer.observe(document.body, { childList:true, subtree:true });
    }

    if(!window.lampa_ratings_quality_plugin_started) startPlugin();

})();
