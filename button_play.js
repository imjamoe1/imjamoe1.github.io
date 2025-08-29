(function(){
  'use strict';

  // ===============================================
  //  Play v61.2 — Movies + Series for Lampa (robust modal + HTTPS TMDB)
  //  • ЕДИНЫЙ контроллер попапа: фокус, стрелки, enter, back/esc
  //  • Lampa.Modal.open первоочередно; легкий фолбек-оверлей
  //  • ONE popup per season (все релизы/папки вместе)
  //  • TMDB: HTTPS для API и картинок (без mixed-content)
  //  • Показывает только видео ≥ 500 MB; TorrServer index 1-based
  // ===============================================

   // ---------- constants & helpers ----------
  var MIN_SEEDERS   = 3;
  var MOVIE_CATS    = '2000,2010,2020,2030,2040';
  var SERIES_CATS   = '5000,5030,5040,5050,5060,5070';
  var VIDEO_EXT     = /(\.(mkv|mp4|avi|ts|m2ts|mpg|mpeg|mov|wmv))$/i;
  var MIN_EP_BYTES  = 500 * 1024 * 1024; // 500 MB

  var PACK_COLORS = ['#60A5FA','#A78BFA','#34D399','#F59E0B','#F472B6','#4FC3F7','#F87171','#10B981','#EAB308','#C084FC'];

  function noty(m,t){ try{ if (window.Lampa && Lampa.Noty && typeof Lampa.Noty.show==='function') Lampa.Noty.show(m,{time:t||2500}); }catch(e){} }
  function ensureScheme(u){ return /^https?:\/\//i.test(u)?u:('http://'+u); }
  function trimEnd(s){ return String(s||'').replace(/\/+$/,''); }
  function safeName(s){
    var v=(s||'video').replace(/[^\w\d]+/g,'.').replace(/\.+/g,'.').replace(/^\.+|\.+$/g,'');
    return v || 'video';
  }
  function isSerial(m){
    return !!(m && m.first_air_date && !m.release_date);
  }
  function looksLikeVideo(path){ return VIDEO_EXT.test(String(path||'')); }

  function tmdbLang(){
    try{ return String((Lampa.Storage.get('language')||'ru')).toLowerCase(); }catch(e){ return 'ru'; }
  }

  // Unified HTTPS image builder for TMDB
  function tmdbImg(path, size){
    if (!path) return '';
    var p = String(path);
    if (/^https?:\/\//i.test(p)) return p;
    return 'https://image.tmdb.org/t/p/' + (size || 'w300') + p;
  }

  function tmdbUrl(path, params){
    var qp = new URLSearchParams(params||{});
    try{
      if (typeof Lampa!=='undefined' && Lampa.TMDB && typeof Lampa.TMDB.api==='function'){
        return Lampa.TMDB.api(path + (path.indexOf('?')>=0?'&':'?') + qp.toString());
      }
    }catch(e){}
    var KEY = '4ef0d7355d9ffb5151e987764708ce96';
    var base = 'https://api.themoviedb.org/3/';           // HTTPS
    if (!qp.has('api_key')) qp.set('api_key', KEY);
    if (!qp.has('language')) qp.set('language', tmdbLang());
    return base + path + (path.indexOf('?')>=0?'&':'?') + qp.toString();
  }

  // ---------- Jackett base ----------
  function jackettBase(){
    var raw='', key='';
    try{ raw = Lampa.Storage.field('jackett_url')||''; key = Lampa.Storage.field('jackett_key')||''; }catch(e){}
    if(!raw) throw new Error('Укажите jackett_url в Настройках');
    var base = ensureScheme(raw).replace(/\/jackett(\/.*)?$/,'');
    return { base: trimEnd(base), key: key };
  }

  // ---------- TorrServer base + auth ----------
  function tsBase(){
    var raw='';
    try{ raw = Lampa.Storage.field('torrserver_url')||''; }catch(e){}
    if(!raw) throw new Error('Укажите torrserver_url в Настройках');
    return trimEnd(ensureScheme(raw));
  }
  function tsAuthHeaders(){
    var token = '', user='', pass='';
    try{
      token = Lampa.Storage.field('torrserver_token') || '';
      user  = Lampa.Storage.field('torrserver_user')  || '';
      pass  = Lampa.Storage.field('torrserver_pass')  || '';
    }catch(e){}
    var headers = { 'Content-Type':'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    else if (user || pass){
      var btoaSafe = function(s){
        try{ return btoa(s); }catch(_){ try{ return (typeof Buffer!=='undefined'?Buffer.from(s,'utf-8').toString('base64'):''); }catch(_2){ return ''; } }
      };
      headers['Authorization'] = 'Basic ' + btoaSafe(user+':'+pass);
    }
    return headers;
  }
  function tsBaseForStream(){
    var base = tsBase();
    var user='', pass='';
    try{ user = Lampa.Storage.field('torrserver_user')||''; pass = Lampa.Storage.field('torrserver_pass')||''; }catch(e){}
    try{
      var u = new URL(base);
      if (user || pass){ u.username=user; u.password=pass; base=u.toString().replace(/\/$/,''); }
    }catch(e){}
    return base;
  }
  function tsStreamAuthQuery(){
    var token=''; try{ token = Lampa.Storage.field('torrserver_token')||''; }catch(e){}
    return token ? '&authorization=' + encodeURIComponent('Bearer '+token) : '';
  }

  // ---------- TMDB payload ----------
  function getMoviePayload(data){
    var m = data && data.movie; if(!m) throw new Error('Нет data.movie');
    if(isSerial(m)) throw new Error('skip-serial');
    var title = String(m.title||m.name||'').trim();
    var orig  = String(m.original_title||m.original_name||title).trim();
    var year  = String(m.release_date||'0000').slice(0,4);
    if(!title) throw new Error('Не определено название фильма');
    var poster = tmdbImg(m.poster_path, 'w342');
    return { title:title, orig:orig, year:year, poster:poster, full:m };
  }
  function getShowPayload(data){
    var m = data && data.movie; if(!m) throw new Error('Нет data.movie');
    if(!isSerial(m)) throw new Error('skip-movie');
    var title = String(m.name||m.title||'').trim();
    var orig  = String(m.original_name||m.original_title||title).trim();
    var tvId  = m.id;
    var poster= tmdbImg(m.poster_path, 'w342');
    return { title:title, orig:orig, tvId:tvId, poster:poster, full:m };
  }

  // ---------- Jackett search ----------
  function parseTorznabXML(text){
    var xml; try{ xml = new DOMParser().parseFromString(text,'application/xml'); }catch(e){ return []; }
    var items = [].slice.call(xml.querySelectorAll('item')).map(function(it){
      var xt=function(s){ var el=it.querySelector(s); return (el&&el.textContent||'').trim(); };
      var xa=function(n){
        var el=it.querySelector('torznab\\:attr[name="'+n+'"]');
        return (el && el.getAttribute('value') || '').trim();
      };
      var enc = (it.querySelector('enclosure') && it.querySelector('enclosure').getAttribute('url')) || '';
      var magnet = xa('magneturl') || xa('magnetUrl') || '';
      var link = (magnet && magnet.indexOf('magnet:')===0) ? magnet : (xt('link') || enc || '');
      var size = Number(xt('size') || xa('size') || 0);
      var seed = Number(xa('seeders') || xa('peers') || 0);
      var tracker = String(xa('jackettindexer')||xa('indexer')||'').toLowerCase();
      var trackerId= String(xa('jackettindexerid')||'').toLowerCase();
      return { title:xt('title'), link:link, magnet:magnet, dl:enc||'', size:size, seed:seed, tracker:tracker, trackerId:trackerId };
    }).filter(function(x){ return x.link && x.size>0 && x.seed>=MIN_SEEDERS; });
    var tol = items.filter(function(x){ return x.tracker.indexOf('rutracker')>=0 || x.trackerId.indexOf('rutracker')>=0; });
    if (tol.length) items = tol;
    items.sort(function(a,b){ return b.size - a.size; });
    return items;
  }
  function parseJackettJSON(json){
    var arr = (json && (Array.isArray(json)?json:(json.Results||json.results||json.items))) || [];
    var items = (arr||[]).map(function(x){
      var magnet = x.MagnetUri||x.MagnetUrl||x.magnet||'';
      var link   = (magnet && magnet.indexOf('magnet:')===0) ? magnet : (x.Link||x.link||'');
      var size   = Number(x.Size||x.size||0);
      var seed   = Number(x.Seeders||x.seeders||x.Peers||x.peers||0);
      var tracker= String(x.Tracker||x.tracker||'').toLowerCase();
      var trackerId=String(x.TrackerId||x.trackerId||'').toLowerCase();
      return { title:x.Title||x.title||'', link:link, magnet:magnet, dl:'', size:size, seed:seed, tracker:tracker, trackerId:trackerId };
    }).filter(function(x){ return x.link && x.size>0 && x.seed>=MIN_SEEDERS; });
    var tol = items.filter(function(x){ return x.tracker.indexOf('rutracker')>=0 || x.trackerId.indexOf('rutracker')>=0; });
    if (tol.length) items = tol;
    items.sort(function(a,b){ return b.size - a.size; });
    return items;
  }
  function catsToParams(csv){
    return csv.split(',').map(function(s){return s.trim();}).filter(Boolean);
  }
  async function jSearchTorznab(query, catsCSV){
    var jb = jackettBase();
    var qp = new URLSearchParams({ t:'search', q:query });
    if (jb.key) qp.set('apikey', jb.key);
    catsToParams(catsCSV).forEach(function(c){ qp.append('cat',c); });
    var url = jb.base + '/api/v2.0/indexers/all/results/torznab/?' + qp.toString();
    try{
      var r = await fetch(url,{method:'GET',credentials:'omit',mode:'cors'});
      if(!r.ok) return [];
      var txt = await r.text();
      return parseTorznabXML(txt);
    }catch(e){ return []; }
  }
  async function jSearchJSON(query, catsCSV, meta){
    var jb = jackettBase();
    var qp = new URLSearchParams();
    if (jb.key) qp.set('apikey', jb.key);
    qp.set('Query', query);
    if(meta && meta.title) qp.set('title', meta.title);
    if(meta && meta.orig)  qp.set('title_original', meta.orig);
    if(meta && meta.year)  qp.set('year', meta.year);
    if(meta && typeof meta.is_serial!=='undefined') qp.set('is_serial', String(meta.is_serial?1:0));
    catsToParams(catsCSV).forEach(function(c){ qp.append('Category[]',c); });
    var url = jb.base + '/api/v2.0/indexers/all/results?' + qp.toString();
    try{
      var r = await fetch(url,{method:'GET',credentials:'omit',mode:'cors'});
      if(!r.ok) return [];
      var json = await r.json();
      return parseJackettJSON(json);
    }catch(e){ return []; }
  }

  // ---------- TorrServer ----------
  async function tsAdd(base, addLink, metaTitle, metaPoster, metaFull){
    var url = base + '/torrents';
    var body = { action:'add', link:addLink, title:('[LAMPA] '+(metaTitle||'')).trim(), poster: metaPoster||'', data: JSON.stringify({lampa:true,movie:metaFull||{}}), save_to_db:false };
    var r = await fetch(url,{ method:'POST', headers: tsAuthHeaders(), body: JSON.stringify(body) });
    var j={}; try{ j=await r.json(); }catch(e){}
    var hash = j.hash || j.id || j.link || j.data || j.result || '';
    return { hash:hash, id:hash, raw:j };
  }
  function pickFileStats(j){
    if (!j) return [];
    if (Array.isArray(j)) return j;
    if (Array.isArray(j.file_stats)) return j.file_stats;
    if (Array.isArray(j.FileStats)) return j.FileStats;
    if (Array.isArray(j.files)) return j.files;
    if (Array.isArray(j.Files)) return j.Files;
    if (j.stats && Array.isArray(j.stats.file_stats)) return j.stats.file_stats;
    return [];
  }
  async function tsFiles(base, linkOrHash){
    var headers = tsAuthHeaders();
    try{
      var body = { action:'get' };
      if (/^(magnet:|https?:)/i.test(linkOrHash)) body.link = linkOrHash; else body.hash = linkOrHash;
      var r1 = await fetch(base+'/torrents', { method:'POST', headers: headers, body: JSON.stringify(body) });
      if (r1.ok){
        var j1 = await r1.json(); var fs1 = pickFileStats(j1);
        if (fs1.length) return { files:fs1, raw:j1 };
      }
    }catch(e){}
    try{
      var r2 = await fetch(base+'/stream/files?link='+encodeURIComponent(linkOrHash), { method:'GET', headers: headers });
      if (r2.ok){
        var j2 = await r2.json(); var fs2 = pickFileStats(j2);
        if (fs2.length) return { files:fs2, raw:j2 };
      }
    }catch(e){}
    return { files: [], raw: null };
  }

  function closeAllplayModals(){
    try{ var els=document.querySelectorAll('.play-modal'); for (var i=0;i<els.length;i++) els[i].remove(); }catch(e){}
    try{ if (window.Lampa && Lampa.Modal && typeof Lampa.Modal.close==='function') Lampa.Modal.close(); }catch(e){}
  }
  function tsPlayById(hash, file, title){
    closeAllplayModals();
    var baseForStream = tsBaseForStream();
    var fname = safeName((String(file.path||'').split('/').pop()||title||'video')) + '.mkv';
    // TorrServer index is 1-based for /stream endpoint
    var idx = 1;
    if (file && typeof file.id!=='undefined'){
      var n = Number(file.id);
      idx = isNaN(n) ? 1 : (n + 1);
    }
    var url = baseForStream + '/stream/' + encodeURIComponent(fname) + '?link=' + encodeURIComponent(hash) + '&index=' + idx + '&play=1';
    var qAuth = tsStreamAuthQuery(); if (qAuth) url += qAuth;
    try{
      if (window.Lampa && Lampa.Player && typeof Lampa.Player.play==='function'){
        Lampa.Player.play({ url:url, title: title||fname, timeline:0 });
      } else {
        location.href = url;
      }
    }catch(e){ location.href = url; }
  }

  // ---------- Styles ----------
  function injectStyles(){
    if (document.getElementById('play-style')) return;
    var css = ""
    + ".play-body{padding:4px 8px 12px 8px;overflow:auto;max-height:calc(88vh - 72px)}"
    + ".play-row{display:flex;align-items:center;gap:18px;padding:16px;border-radius:12px}"
    + ".play-row.selector{cursor:pointer}"
    + ".play-row.selector.focus{outline:none;background:rgba(255,255,255,.06)}"
    + ".play-thumb{width:200px;height:112px;border-radius:10px;background:#222 center/cover no-repeat;flex:0 0 auto}"
    + ".play-title{font-size:30px;font-weight:800}"
    + ".play-sub{opacity:.8;margin-top:6px}"
    + ".play-size{margin-left:auto;opacity:.9;font-weight:700}"
    + "@media (max-width:860px){ .play-thumb{width:160px;height:90px} .play-title{font-size:24px} }"
    + ".play-pack{--pack:#60A5FA; margin:6px 0 10px}"
    + ".play-pack-title{display:flex;align-items:center;gap:10px;padding:10px 14px;font-size:22px;font-weight:900;border-left:6px solid var(--pack);border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03));color:#fff}"
    + ".play-folder{padding:3px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);}"
    + ".play-pack .play-row{border-left:4px solid var(--pack)}"
    + ".play-pack .play-row.selector.focus{box-shadow:inset 0 0 0 2px var(--pack)}"
    + ".play-loader{display:flex;align-items:center;gap:14px;padding:22px;font-size:22px}"
    + ".play-fallback{position:fixed;left:0;right:0;top:0;bottom:0;background:rgba(0,0,0,.72);z-index:99999;display:flex;align-items:center;justify-content:center}"
    + ".play-card{width:min(1450px,94vw);max-height:88vh;overflow:hidden;border-radius:16px;background:#111;border:1px solid rgba(255,255,255,.06);box-shadow:0 10px 40px rgba(0,0,0,.5)}"
    + ".play-head{padding:20px 28px;font-size:28px;font-weight:800;letter-spacing:.3px;background:rgba(255,255,255,.04)}";
    var s=document.createElement('style'); s.id='play-style'; s.textContent=css; document.head.appendChild(s);
  }
  function injectUAStyles(){
    if (document.getElementById('play-style')) return;
    var css = ""
    + ".full-start__button.play-btn{background-image:linear-gradient()!important;color:#fff!important;border:0!important;outline:0!important;box-shadow:0 2px 8px rgba(0,0,0,.28)!important}"
    + ".full-start__button.play-btn.selector.focus,.full-start__button.play-btn:hover{filter:brightness(1.06) contrast(1.02);transform:translateY(-1px)}"
    + ".full-start__button.play-btn svg{color:currentColor}";
    var s=document.createElement('style'); s.id='play-style'; s.textContent=css; document.head.appendChild(s);
  }

  // ---------- Focus utilities (no hacks) ----------
  function setFocus(container, el){
    if(!container) return;
    var $ = window.$ || window.jQuery;
    var nodes = container.querySelectorAll('.selector');
    for (var i=0;i<nodes.length;i++) nodes[i].classList.remove('focus');
    if (el){
      try{ el.classList.add('focus'); el.setAttribute('tabindex','0'); el.focus({preventScroll:true}); }catch(e){}
      try{ el.scrollIntoView({block:'nearest', inline:'nearest'}); }catch(e){}
      if ($) $(el).trigger('hover:focus');
    }
  }
  function focusFirst(container){
    if(!container) return;
    var el = container.querySelector('.selector');
    if (el) setFocus(container, el);
  }
  function moveFocus(container, dir){
    if(!container) return;
    var nodes = Array.prototype.slice.call(container.querySelectorAll('.selector'));
    if(!nodes.length) return;
    var idx = Math.max(0, nodes.findIndex(function(n){ return n.classList.contains('focus'); }));
    if (idx<0) idx=0;
    var next = idx;
    if (dir==='down' || dir==='right') next = Math.min(nodes.length-1, idx+1);
    else if (dir==='up' || dir==='left') next = Math.max(0, idx-1);
    if (next !== idx) setFocus(container, nodes[next]);
  }

  // ---------- Modal (Lampa-first, fallback-second) ----------
  function openModal(title){
    injectStyles();
    // гарантируем один попап
    closeAllplayModals();

    var $ = window.$ || window.jQuery; // Lampa обычно предоставляет $
    var $body = $ ? $('<div class="play-body"></div>') : null;

    var usingLampa = false;
    try{
      if (window.Lampa && Lampa.Modal && typeof Lampa.Modal.open==='function' && $){
        Lampa.Modal.open({
          title: String(title||''),
          html: $body,
          size: 'large',
          onBack: function(){
            try{ Lampa.Modal.close(); }catch(e){}
            try{ Lampa.Controller.toggle('content'); }catch(e){}
          }
        });
        usingLampa = true;
      }
    }catch(e){ usingLampa = false; }

    // Fallback-overlay
    var fallback = null, fallbackBody = null, fallbackClose = function(){};
    var fallbackKeydown = null;
    if (!usingLampa){
      var root = document.createElement('div'); root.className='play-fallback play-modal';
      var card = document.createElement('div'); card.className='play-card';
      var head = document.createElement('div'); head.className='play-head'; head.textContent=String(title||'');
      var body = document.createElement('div'); body.className='play-body';
      card.appendChild(head); card.appendChild(body); root.appendChild(card);
      document.body.appendChild(root);
      fallback = root; fallbackBody = body;

      fallbackKeydown = function(e){
        var code = e.key || e.keyCode;
        // back/esc
        if (code==='Escape' || code==='Backspace' || code==='BrowserBack' || code==='GoBack' || code===8 || code===27 || code===10009 || code===461){
          e.preventDefault(); fallbackClose(); return;
        }
        // arrows
        if (code==='ArrowDown' || code===40){ e.preventDefault(); moveFocus(fallbackBody,'down'); return; }
        if (code==='ArrowUp'   || code===38){ e.preventDefault(); moveFocus(fallbackBody,'up');   return; }
        if (code==='ArrowLeft' || code===37){ e.preventDefault(); moveFocus(fallbackBody,'left'); return; }
        if (code==='ArrowRight'|| code===39){ e.preventDefault(); moveFocus(fallbackBody,'right');return; }
        // enter
        if (code==='Enter' || code===13){
          e.preventDefault();
          var cur = fallbackBody.querySelector('.selector.focus');
          if (cur){
            var $ = window.$ || window.jQuery;
            if ($) $(cur).trigger('hover:enter');
            else cur.click();
          }
        }
      };
      document.addEventListener('keydown', fallbackKeydown, true);
      fallbackClose = function(){
        try{ document.removeEventListener('keydown', fallbackKeydown, true); }catch(e){}
        try{ fallback.parentNode && fallback.parentNode.removeChild(fallback); }catch(e){}
        try{ if (window.Lampa && Lampa.Controller) Lampa.Controller.toggle('content'); }catch(e){}
      };
    }

    // Контроллер Lampa для попапа (up/down/enter/back) — чисто и изолированно
    try{
      if (usingLampa && window.Lampa && Lampa.Controller && typeof Lampa.Controller.add==='function'){
        Lampa.Controller.add('play_modal',{
          toggle: function(){
            try{
              if ($body) Lampa.Controller.collectionSet($body);
              // гарантируем фокус внутри
              focusFirst($body && $body[0]);
            }catch(e){}
          },
          up:    function(){ try{ moveFocus($body && $body[0],'up'); }catch(e){} },
          down:  function(){ try{ moveFocus($body && $body[0],'down'); }catch(e){} },
          left:  function(){ try{ moveFocus($body && $body[0],'left'); }catch(e){} },
          right: function(){ try{ moveFocus($body && $body[0],'right'); }catch(e){} },
          enter: function(){
            try{
              var el = $body && $body.find('.selector.focus').get(0);
              if (!el) el = $body && $body.find('.selector').get(0);
              if (el){
                var $ = window.$ || window.jQuery;
                if ($) $(el).trigger('hover:enter');
                else el.click();
              }
            }catch(e){}
          },
          back:  function(){
            try{
              if (usingLampa){ Lampa.Modal.close(); Lampa.Controller.toggle('content'); }
            }catch(e){}
          }
        });
        setTimeout(function(){ try{ Lampa.Controller.toggle('play_modal'); }catch(e){} }, 0);
      }
    }catch(e){}

    function setItems(itemsFragment){
      if (usingLampa){
        try{
          $body.empty().append(itemsFragment);
          Lampa.Controller.collectionSet($body);
          Lampa.Controller.toggle('play_modal');
          focusFirst($body[0]);
        }catch(e){}
      } else {
        try{
          fallbackBody.innerHTML='';
          fallbackBody.appendChild(itemsFragment);
          // первый элемент сразу в фокусе
          focusFirst(fallbackBody);
        }catch(e){}
      }
    }
    function setLoading(text){
      if (usingLampa){
        var row = $('<div class="play-loader"><div class="loader" style="width:26px;height:26px;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:plr .8s linear infinite"></div><div>'+(text||'Загрузка...')+'</div></div>');
        $body.empty().append(row);
        try{ Lampa.Controller.collectionSet($body); Lampa.Controller.toggle('play_modal'); focusFirst($body[0]); }catch(e){}
      } else {
        var d = document.createElement('div'); d.className='play-loader'; d.textContent = String(text||'Загрузка...');
        fallbackBody.innerHTML=''; fallbackBody.appendChild(d);
      }
    }
    function closeAll(){
      if (usingLampa){ try{ Lampa.Modal.close(); }catch(e){} }
      else { fallbackClose(); }
    }

    return { setItems:setItems, setLoading:setLoading, close:closeAll, bodyNode: usingLampa ? ($body && $body[0]) : fallbackBody };
  }

  // ---------- UI builders ----------
  function makePackHeader(text){
    var $ = window.$ || window.jQuery;
    if ($) return $('<div class="play-pack-title"><span class="play-folder">'+(text||'Релиз')+'</span></div>');
    var div = document.createElement('div'); div.className='play-pack-title';
    var badge=document.createElement('span'); badge.className='play-folder'; badge.textContent=String(text||'Релиз');
    div.appendChild(badge); return div;
  }
  function makeEpisodeRow(epNum, name, stillUrl, sizeText, tail){
    var $ = window.$ || window.jQuery;
    var title = 'S'+String(epNum.season||1)+'E'+String(epNum.ep||0).padStart(2,'0')+' — '+(name||('Серия '+(epNum.ep||'')));
    if ($){
      return $('<div class="play-row selector" tabindex="0">'
        +'<div class="play-thumb" style="background-image:url(\''+(stillUrl||'')+'\')"></div>'
        +'<div>'
          +'<div class="play-title">'+title+'</div>'
          +'<div class="play-sub">'+(tail||'')+'</div>'
        +'</div>'
        +'<div class="play-size">'+(sizeText||'')+'</div>'
      +'</div>');
    } else {
      var row=document.createElement('div'); row.className='play-row selector'; row.tabIndex=0;
      var th=document.createElement('div'); th.className='play-thumb'; th.style.backgroundImage="url('"+(stillUrl||"")+"')";
      var mid=document.createElement('div');
      var t=document.createElement('div'); t.className='play-title'; t.textContent=title;
      var sub=document.createElement('div'); sub.className='play-sub'; sub.textContent=String(tail||'');
      var size=document.createElement('div'); size.className='play-size'; size.textContent=String(sizeText||'');
      mid.appendChild(t); mid.appendChild(sub); row.appendChild(th); row.appendChild(mid); row.appendChild(size);
      return row;
    }
  }

  // ---------- Parsing helpers ----------
  function humanSize(bytes){
    if (bytes===null || typeof bytes==='undefined') return '';
    var u=['B','KB','MB','GB','TB']; var i=0; var n=Number(bytes);
    while(n>=1024 && i<u.length-1){ n/=1024; i++; }
    return (i>=2? n.toFixed(1):Math.round(n))+' '+u[i];
  }
  function extractSeasonsFromTitle(s){
    var str = String(s||'');
    var out = {};
    var rng = str.match(/s(?:eason)?\s*(\d{1,2})\s*[-–…]\s*(\d{1,2})/i);
    if (rng){ var a=Number(rng[1]), b=Number(rng[2]); for(var i=a;i<=b;i++) out[i]=1; }
    var re = /(?:s(?:eason)?\s*(\d{1,2})|\bS(\d{1,2})\b|(?:[^\d]|^)(\d{1,2})\s*сез)/gi, m;
    while((m=re.exec(str))!==null){ var n = Number(m[1]||m[2]||m[3]); if(n) out[n]=1; }
    var keys = Object.keys(out).map(function(x){return Number(x);});
    if (!keys.length) keys=[1];
    return keys;
  }
  function parseEpisodeNum(path, seasonHint){
    var name = String(path||'').split('/').pop();
    var m = name.match(/s(\d{1,2})e(\d{1,3})/i); if (m) return { season:Number(m[1]), ep:Number(m[2]) };
    m = name.match(/(\d{1,2})x(\d{1,3})/i);      if (m) return { season:Number(m[1]), ep:Number(m[2]) };
    m = name.match(/e[pP]?(\d{1,3})/i);          if (m) return { season:seasonHint||0, ep:Number(m[1]) };
    m = name.match(/сер(ия|ия)?\s*(\d{1,3})/i);  if (m) return { season:seasonHint||0, ep:Number(m[2]) };
    return { season:seasonHint||0, ep:0 };
  }
  function topFolderFromFiles(files){
    for(var i=0;i<(files||[]).length;i++){
      var f = files[i];
      var p = String(f.path||'').replace(/^\/+/, '');
      if (p.indexOf('/')>=0){ var seg = p.split('/')[0].trim(); if (seg) return seg; }
    }
    return '';
  }

  // ---------- SERIES flow ----------
  async function showSeasons(meta){
    var combos={ df:meta.orig, df_year:String(meta.orig), lg:meta.title, lg_df:(meta.title+' '+meta.orig) };
    var pref='df';
    try{ pref = Lampa.Storage.field('parse_lang')||'df'; }catch(e){}
    var query = String(combos[pref] || meta.orig).trim();

    noty('Play: ищу сезоны — '+query);

    var items = await jSearchTorznab(query, SERIES_CATS);
    if(!items.length) items = await jSearchJSON(query, SERIES_CATS, { title:meta.title, orig:meta.orig, is_serial:1 });
    if(!items.length) throw new Error('rutracker: нет результатов');

    var bySeason = {};
    for(var i=0;i<items.length;i++){
      var it = items[i];
      var seasons = extractSeasonsFromTitle(it.title);
      for(var k=0;k<seasons.length;k++){
        var s = seasons[k];
        if(!bySeason[s]) bySeason[s]=[];
        bySeason[s].push(it);
      }
    }

    var seasonNums = Object.keys(bySeason).map(function(x){return Number(x);}).sort(function(a,b){return a-b;});
    if(!seasonNums.length) throw new Error('Не найдено релизов сезонов');

    // Prefetch TMDB season posters (fallback to series poster)
    var posters = {};
    await Promise.all(seasonNums.map(async function(sn){
      try{
        var r = await fetch(tmdbUrl('tv/'+meta.tvId+'/season/'+sn, { language: tmdbLang() }));
        if (r.ok){
          var j = await r.json();
          posters[sn] = (j && j.poster_path) ? tmdbImg(j.poster_path, 'w300') : (meta.poster||'');
        } else posters[sn] = meta.poster||'';
      }catch(e){ posters[sn] = meta.poster||''; }
    }));

    var dlg = openModal('ВЫБЕРИ СЕЗОН');

    var $ = window.$ || window.jQuery;
    var frag = document.createDocumentFragment();

    for(var si=0; si<seasonNums.length; si++){
      var sn = seasonNums[si];
      var rels = bySeason[sn] || [];
      var bestSize = '';
      if (rels.length){
        var maxSize = 0;
        for (var ri=0;ri<rels.length;ri++){ var sz = Number(rels[ri].size||0); if (sz>maxSize) maxSize=sz; }
        bestSize = humanSize(maxSize);
      }
      var thumb = posters[sn] ? "background-image:url('"+posters[sn]+"')" : 'background:#222';
      if ($){
        var row = $('<div class="play-row selector" tabindex="0"><div class="play-thumb" style="'+thumb+'"></div><div><div class="play-title">СЕЗОН №'+sn+'</div><div class="play-sub">Вариантов: '+rels.length+'</div></div><div class="play-size">'+(bestSize||'')+'</div></div>');
        (function(snCopy, relsCopy){
          row.on('hover:enter click keydown', function(e){
            if (e.type==='keydown' && e.key!=='Enter' && e.keyCode!==13) return;
            fetchEpisodesAggregated(meta, snCopy, relsCopy);
          });
        })(sn, rels);
        frag.appendChild(row[0]);
      } else {
        var row2 = document.createElement('div'); row2.className='play-row selector'; row2.tabIndex=0;
        var th=document.createElement('div'); th.className='play-thumb'; th.style=thumb;
        var mid=document.createElement('div');
        var t=document.createElement('div'); t.className='play-title'; t.textContent='СЕЗОН №'+sn;
        var sub=document.createElement('div'); sub.className='play-sub'; sub.textContent='Вариантов: '+rels.length;
        var size=document.createElement('div'); size.className='play-size'; size.textContent=bestSize||'';
        mid.appendChild(t); mid.appendChild(sub); row2.appendChild(th); row2.appendChild(mid); row2.appendChild(size);
        (function(snCopy, relsCopy, el){
          el.addEventListener('click', function(){ fetchEpisodesAggregated(meta, snCopy, relsCopy); });
          el.addEventListener('keydown', function(e){ if (e.key==='Enter' || e.keyCode===13) fetchEpisodesAggregated(meta, snCopy, relsCopy); });
        })(sn, rels, row2);
        frag.appendChild(row2);
      }
    }

    dlg.setItems(frag);
  }

  async function fetchEpisodesAggregated(meta, sn, releases){
    var dlg = openModal('СЕЗОН '+sn+' — релизы и серии');
    dlg.setLoading('Готовлю релизы…');

    // TMDB names & stills
    var tmdbSeason=null, names={}, stills={};
    try{
      var r=await fetch(tmdbUrl('tv/'+meta.tvId+'/season/'+sn,{language:tmdbLang()}));
      if(r.ok) tmdbSeason=await r.json();
    }catch(e){}
    if (tmdbSeason && Array.isArray(tmdbSeason.episodes)){
      for (var i=0;i<tmdbSeason.episodes.length;i++){
        var e = tmdbSeason.episodes[i];
        names[e.episode_number]= e.name||'';
        stills[e.episode_number]= tmdbImg(e.still_path, 'w300');
      }
    }

    var base = tsBase();
    var groups = {}; // folder -> [{ep,file,hash,size,folder}]
    var order  = [];

    for(var ri=0;ri<releases.length;ri++){
      var rel = releases[ri];
      var link = rel.dl || rel.magnet || rel.link; var hash = link;
      try{
        var added = await tsAdd(base, link, meta.title+' (S'+sn+')', '', meta.full);
        if (added.hash) hash = added.hash;
      }catch(e){}

      try{
        var resp = await tsFiles(base, hash);
        var files = resp.files || [];
        if(!files.length) continue;
        var vids = files.filter(function(x){ return looksLikeVideo(x.path) && Number(x.length||0) >= MIN_EP_BYTES; });
        if(!vids.length) continue;

        var folder = topFolderFromFiles(vids) || rel.title || 'Релиз';
        if (!groups[folder]){ groups[folder]=[]; order.push(folder); }

        for(var fi=0;fi<vids.length;fi++){
          var f = vids[fi];
          var parsed = parseEpisodeNum(f.path, sn);
          var ep = parsed.ep||0; if(!ep) continue;
          var size = Number(f.length||0);
          var existedIndex = -1;
          for (var j=0;j<groups[folder].length;j++){ if (groups[folder][j].ep===ep){ existedIndex = j; break; } }
          if (existedIndex===-1){
            groups[folder].push({ ep:ep, file:f, hash:hash, size:size, folder:folder });
          } else {
            if (size > groups[folder][existedIndex].size){
              groups[folder][existedIndex] = { ep:ep, file:f, hash:hash, size:size, folder:folder };
            }
          }
        }
      }catch(e){}
    }

    var $ = window.$ || window.jQuery;
    var frag = document.createDocumentFragment();

    for (var oi=0; oi<order.length; oi++){
      var folder = order[oi];
      var items = groups[folder]||[];
      if (!items.length) continue;
      items.sort(function(a,b){ return a.ep - b.ep; });

      var color = PACK_COLORS[oi % PACK_COLORS.length];
      var wrap = document.createElement('div'); wrap.className='play-pack'; wrap.style.setProperty('--pack', color);

      var header = makePackHeader(folder);
      wrap.appendChild(header instanceof Element ? header : header[0]);

      for (var ii=0; ii<items.length; ii++){
        var it = items[ii];
        var row = makeEpisodeRow({season:sn, ep:it.ep}, names[it.ep]||('Серия '+it.ep), stills[it.ep]||'', humanSize(it.size), folder);
        (function(h, f, t, el){
          if ($){
            $(row).on('hover:enter click keydown', function(e){
              if (e.type==='keydown' && e.key!=='Enter' && e.keyCode!==13) return;
              tsPlayById(h, f, t);
            });
            wrap.appendChild(row[0]);
          } else {
            el.addEventListener('click', function(){ tsPlayById(h, f, t); });
            el.addEventListener('keydown', function(e){ if (e.key==='Enter'||e.keyCode===13) tsPlayById(h, f, t); });
            wrap.appendChild(el);
          }
        })(it.hash, it.file, (meta.title+' S'+sn+'E'+String(it.ep).padStart(2,'0')), (row instanceof Element?row:row[0]));
      }

      frag.appendChild(wrap);
    }

    if (!frag.children.length){
      dlg.setLoading('Не найдено серий ≥500MB для этого сезона');
      return;
    }
    dlg.setItems(frag);
  }

  // ---------- MOVIE flow ----------
  async function runMovie(data){
    var meta = getMoviePayload(data);
    var combos={
      df:meta.orig,
      df_year: (meta.orig+' '+meta.year),
      df_lg: (meta.orig+' '+meta.title),
      df_lg_year: (meta.orig+' '+meta.title+' '+meta.year),
      lg:meta.title,
      lg_year:(meta.title+' '+meta.year),
      lg_df:(meta.title+' '+meta.orig),
      lg_df_year:(meta.title+' '+meta.orig+' '+meta.year)
    };
    var pref='df_year';
    try{ pref=Lampa.Storage.field('parse_lang')||'df_year'; }catch(e){}
    var query = String(combos[pref]|| (meta.orig+' '+meta.year)).trim();

    noty('Play: ищу — '+query);

    var items = await jSearchTorznab(query, MOVIE_CATS);
    if(!items.length) items = await jSearchJSON(query, MOVIE_CATS, { title:meta.title, orig:meta.orig, year:meta.year, is_serial:0 });
    if(!items.length) throw new Error('rutracker: нет результатов');

    var best = items[0];
    var addLink = best.dl || best.magnet || best.link;

    var base = tsBase();
    var linkParam = addLink;
    try {
      var added = await tsAdd(base, addLink, meta.title, meta.poster, meta.full);
      if (added.hash) linkParam = added.hash;
    } catch(e){ linkParam = addLink; }

    noty('Запускаю воспроизведение…');
    closeAllplayModals();
    var baseForStream = tsBaseForStream();
    var fname = safeName(meta.title||'video') + '.mkv';
    var url = baseForStream + '/stream/' + encodeURIComponent(fname) + '?link=' + encodeURIComponent(linkParam) + '&index=1&play=1';
    var qAuth = tsStreamAuthQuery(); if (qAuth) url += qAuth;
    try{
      if (window.Lampa && Lampa.Player && typeof Lampa.Player.play==='function'){
        Lampa.Player.play({ url:url, title: meta.title||fname, timeline:0 });
      } else location.href = url;
    }catch(e){ location.href = url; }
  }

  // ---------- Entry points ----------
  async function runPlay(evData){
    try{
      var mv = evData && evData.movie;
      if (!mv) return;
      if (isSerial(mv)){
        var meta = getShowPayload(evData);
        await showSeasons(meta);
      } else {
        await runMovie(evData);
      }
    }catch(e){
      if (String(e && e.message)==='skip-movie' || String(e && e.message)==='skip-serial') return;
      noty('play: '+(e && e.message || e), 4000);
    }
  }

  // ---------- Button & mount ----------
  function findButtonsBar(root){
    var bar = root.find('.full-start-new__buttons').eq(0); if (bar && bar.length) return bar;
    bar = root.find('.full-start__buttons').eq(0); if (bar && bar.length) return bar;
    bar = root.find('.full-actions').eq(0); if (bar && bar.length) return bar;
    return root.find('.full-start__right, .full-start').eq(0);
  }
  function makeButton(){
    return $(`
      <div class="full-start__button selector play-btn" data-play-icon="1" tabindex="0" aria-label="Play">
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" rutracker="0 0 30.051 30.051" style="enable-background:new 0 0 512 512; transition: fill 0.3s ease;" class=""><path d="M19.982,14.438l-6.24-4.536c-0.229-0.166-0.533-0.191-0.784-0.062c-0.253,0.128-0.411,0.388-0.411,0.669v9.069   c0,0.284,0.158,0.543,0.411,0.671c0.107,0.054,0.224,0.081,0.342,0.081c0.154,0,0.31-0.049,0.442-0.146l6.24-4.532   c0.197-0.145,0.312-0.369,0.312-0.607C20.295,14.803,20.177,14.58,19.982,14.438z" fill="#5cb85c" data-original="#000000" class=""/>
    <path d="M15.026,0.002C6.726,0.002,0,6.728,0,15.028c0,8.297,6.726,15.021,15.026,15.021c8.298,0,15.025-6.725,15.025-15.021   C30.052,6.728,23.324,0.002,15.026,0.002z M15.026,27.542c-6.912,0-12.516-5.601-12.516-12.514c0-6.91,5.604-12.518,12.516-12.518   c6.911,0,12.514,5.607,12.514,12.518C27.541,21.941,21.937,27.542,15.026,27.542z" fill="#ff6600"/></svg>
        <span>Play</span>
      </div>`);
  }
  function attachButtonOnce(root, ev){
    var m = ev && ev.data && ev.data.movie; if (!m) return true;
    var bar = findButtonsBar(root); if (!bar || !bar.length) return false;
    if (bar.find('[data-play-icon="1"]').length) return true;
    var btn = makeButton();
    var click = function(){ runPlay(ev.data); };
    btn.on('hover:enter', click);
    btn.on('click', click);
    btn.on('keydown', function(e){ if(e.key==='Enter'||e.keyCode===13) click(); });
    bar.prepend(btn);
    try { Lampa.Controller.collectionSet(bar); } catch(e) {}
    return true;
  }
  function mountTVNative(){
    injectStyles();
    try{
      Lampa.Listener.follow('full', function(ev){
        if (!ev || ev.type !== 'complite' || !ev.object) return;
        var root = ev.object.activity.render();
        if (attachButtonOnce(root, ev)) return;
        try{
          var target = root[0] || root;
          var mo = new MutationObserver(function(){ if (attachButtonOnce(root, ev)) mo.disconnect(); });
          mo.observe(target, {childList:true, subtree:true});
          setTimeout(function(){ try{ mo.disconnect(); }catch(e){} }, 8000);
        }catch(e){}
      });
    }catch(e){}
  }

  if(!window.plugin_play_ready){ window.plugin_play_ready = true; try{ mountTVNative(); }catch(e){} }
})();
