(function(){
  if(document.getElementById('auth-gate-overlay')) return;
  var LS_TOK='lampac_auth_token';
  var _srvHost='https://beta.l-vid.online';
  var _embCode='';
  var _embBot='go_lampa_testbot';
  var _embQR='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAABgklEQVR42uyXsa3jMBBEh1CwIUtwJ2JnooxrjOrEJWzI4INz2NWHjDsfLviAKAZaJzZfYmuHM2Pcc8/PZyJJzTpjBoRiH1+jEAWCZhbMwgopgPQmmU8N3NgAJCnkJSSTOksTDkgQqaHa7q4gtjkAschGfuz0UuK6XuKms2w1fSj+fLJPphHW9HH3zyeTZs1cEdiQWKTI67jblxP+4hpXJDYpQpb63lwfgrgik+Y7dutZ8KgYhExcgUhu/iq21eP39CG7spuzBjvnH6l1Ppn45c9n02DPSAoeh3auJnbfnqQmNhhjdzKZ6yBo0FSD+Q5waOdqsmfG6u8CWRNfvUlcY8Pip0BCsmbRlUxq3hc0aaqpJtMORiFA1iU+vXG5L9fuJH4h6BJbtHOfcciRp9jz9B+Jfi757hTvVnPouhvxXrXsyeDf7UiFAcjeR8t3q2B98HUBMe3QXMd8RwYj3ihC9U7RndjmApupynznL1V1IPt/Ws9N73wyDrnnnv/M7wAAAP//UC+J3HQzlQQAAAAASUVORK5CYII=';
  var _embLink='https://t.me/go_lampa_testbot?';
  var _lo=window.location.origin||'';
  var origin=(_lo&&_lo!=='null'&&_lo.indexOf('http')===0&&_lo.indexOf('127.0.0.1')<0&&_lo.indexOf('localhost')<0)?_lo:_srvHost;

  // --- Helpers ---
  function getToken(){
    try{var c=document.cookie.match(/(?:^|;\s*)lampac_token=([^;]*)/);if(c)return decodeURIComponent(c[1]);}catch(e){}
    try{var v=localStorage.getItem(LS_TOK);if(v)return v;}catch(e){}
    return '';
  }
  function saveToken(tok){
    if(!tok)return;
    try{document.cookie='lampac_token='+tok+';path=/;max-age=31536000;SameSite=Lax';}catch(e){}
    try{localStorage.setItem(LS_TOK,tok);}catch(e){}
  }
  function clearToken(){
    // Aggressively clear cookies for all possible domain variants
    try{
      document.cookie='lampac_token=;path=/;max-age=0';
      var d=location.hostname;
      document.cookie='lampac_token=;path=/;max-age=0;domain='+d;
      document.cookie='lampac_token=;path=/;max-age=0;domain=.'+d;
      var pts=d.split('.');if(pts.length>2)document.cookie='lampac_token=;path=/;max-age=0;domain=.'+pts.slice(-2).join('.');
    }catch(e){}
    try{localStorage.removeItem(LS_TOK);}catch(e){}
  }
  function getUID(){
    try{var raw=localStorage.getItem('lampac_unic_id');if(raw){try{var p=JSON.parse(raw);if(typeof p==='string'&&p)return p;}catch(e){if(typeof raw==='string'&&raw)return raw;}}}catch(e){}
    return '';
  }

  // --- FNV-1a hash (matches Go server) ---
  function fnv1a(str){
    var h=0x811c9dc5;
    for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193);}
    return (h>>>0).toString(16);
  }

  // --- Device Fingerprint (survives data clear) ---
  function getFingerprint(cb){
    var parts=[];
    try{parts.push('ua:'+navigator.userAgent);}catch(e){}
    try{parts.push('plt:'+navigator.platform);}catch(e){}
    try{parts.push('lang:'+(navigator.language||navigator.userLanguage||''));}catch(e){}
    try{parts.push('tz:'+Intl.DateTimeFormat().resolvedOptions().timeZone);}catch(e){}
    try{parts.push('scr:'+screen.width+'x'+screen.height+'x'+screen.colorDepth);}catch(e){}
    try{parts.push('dpr:'+(window.devicePixelRatio||1));}catch(e){}
    try{parts.push('cores:'+(navigator.hardwareConcurrency||0));}catch(e){}
    try{parts.push('mem:'+(navigator.deviceMemory||0));}catch(e){}
    try{parts.push('touch:'+(navigator.maxTouchPoints||0));}catch(e){}
    // WebGL renderer (GPU fingerprint — very stable)
    try{
      var c=document.createElement('canvas');var gl=c.getContext('webgl')||c.getContext('experimental-webgl');
      if(gl){
        var dbg=gl.getExtension('WEBGL_debug_renderer_info');
        if(dbg){parts.push('glv:'+gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL));parts.push('glr:'+gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL));}
        parts.push('glver:'+gl.getParameter(gl.VERSION));
        parts.push('glsl:'+gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
      }
    }catch(e){}
    // Canvas fingerprint (rendering differences between GPUs)
    try{
      var cv=document.createElement('canvas');cv.width=240;cv.height=60;
      var cx=cv.getContext('2d');
      cx.textBaseline='alphabetic';cx.fillStyle='#f60';cx.fillRect(125,1,62,20);
      cx.fillStyle='#069';cx.font='11pt Arial';cx.fillText('Cwm fjord veg',2,15);
      cx.fillStyle='rgba(102,204,0,0.7)';cx.font='18pt Arial';cx.fillText('Cwm fjord veg',4,45);
      parts.push('cvs:'+cv.toDataURL().slice(-50));
    }catch(e){}
    // AudioContext fingerprint
    try{
      var actx=new(window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,44100,44100);
      var osc=actx.createOscillator();osc.type='triangle';osc.frequency.setValueAtTime(10000,actx.currentTime);
      var comp=actx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-50,actx.currentTime);comp.knee.setValueAtTime(40,actx.currentTime);
      comp.ratio.setValueAtTime(12,actx.currentTime);comp.attack.setValueAtTime(0,actx.currentTime);comp.release.setValueAtTime(0.25,actx.currentTime);
      osc.connect(comp);comp.connect(actx.destination);osc.start(0);
      actx.startRendering().then(function(buf){
        var d=buf.getChannelData(0);var sum=0;for(var i=4500;i<5000;i++)sum+=Math.abs(d[i]);
        parts.push('audio:'+sum.toFixed(6));
        cb(fnv1a(parts.join('|')));
      }).catch(function(){cb(fnv1a(parts.join('|')));});
      setTimeout(function(){cb(fnv1a(parts.join('|')));},1000);
    }catch(e){
      cb(fnv1a(parts.join('|')));
    }
  }

  // --- Auth flow ---
  function checkToken(tok){
    var xhr=new XMLHttpRequest();
    xhr.open('GET',origin+'/tg/auth/status?token='+encodeURIComponent(tok),true);
    xhr.timeout=8000;
    xhr.onload=function(){
      if(xhr.status===200){try{var r=JSON.parse(xhr.responseText);if(r&&r.authorized){saveToken(r.token||tok);return;}}catch(e){}}
      if(xhr.status===200){
        clearToken();
        // After clearing invalid cookie, check if localStorage had a DIFFERENT valid token
        try{var ls=localStorage.getItem(LS_TOK);if(ls&&ls!==tok){saveToken(ls);checkToken(ls);return;}}catch(e){}
        tryRecovery();
      }
    };
    xhr.onerror=function(){};
    xhr.ontimeout=function(){};
    xhr.send();
  }
  var token=getToken();
  if(token){
    checkToken(token);
  } else {
    tryRecovery();
  }

  function tryRecovery(){
    var uid=getUID();
    if(uid){
      var ux=new XMLHttpRequest();
      ux.open('GET',origin+'/tg/auth/status?uid='+encodeURIComponent(uid),true);
      ux.timeout=5000;
      ux.onload=function(){
        if(ux.status===200){try{var r=JSON.parse(ux.responseText);if(r&&r.authorized){saveToken(r.token||'');return;}}catch(e){}}
        tryFingerprint();
      };
      ux.onerror=function(){tryFingerprint();};
      ux.ontimeout=function(){tryFingerprint();};
      ux.send();
    } else {
      tryFingerprint();
    }
  }

  function tryFingerprint(){
    getFingerprint(function(fp){
      if(!fp){showGate();return;}
      var fx=new XMLHttpRequest();
      fx.open('GET',origin+'/tg/auth/status?fp='+encodeURIComponent(fp),true);
      fx.timeout=5000;
      fx.onload=function(){
        if(fx.status===200){try{var r=JSON.parse(fx.responseText);if(r&&r.authorized){saveToken(r.token||'');return;}}catch(e){}}
        showGate();
      };
      fx.onerror=function(){showGate();};
      fx.ontimeout=function(){showGate();};
      fx.send();
    });
  }

  function showGate(){
    // Detect if running inside Lampa app (not a plain browser).
    var isApp=!!(window.Lampa||window.appready||window.AndroidJS||typeof webOS!=='undefined'||/Tizen|WebOS|HbbTV|SMART-TV/i.test(navigator.userAgent));
    if(!isApp){
      window.location.href=origin+'/tg/auth';
      return;
    }
    // --- Inline auth UI for Lampa apps ---
    // Can't use iframe (WebView blocks cross-origin iframe from file:// origin).
    // Fetch auth code from server and render UI directly in DOM.
    if(document.getElementById('auth-gate-overlay')) return;
    var ov=document.createElement('div');
    ov.id='auth-gate-overlay';
    ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#fff;display:-webkit-flex;-webkit-align-items:center;-webkit-justify-content:center;overflow-y:auto;';
    ov.innerHTML='<div style="text-align:center;opacity:0.5">Загрузка...</div>';
    var closeBtn=document.createElement('div');
    closeBtn.tabIndex=1;
    closeBtn.setAttribute('role','button');
    closeBtn.setAttribute('aria-label','Закрыть');
    closeBtn.style.cssText='position:absolute;top:12px;right:16px;width:44px;height:44px;cursor:pointer;z-index:1000000;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,0.15);color:#fff;font-size:22px;outline:none;transition:background 0.2s;';
    closeBtn.innerHTML='&#10005;';
    closeBtn.onfocus=function(){closeBtn.style.background='rgba(255,255,255,0.35)';closeBtn.style.outline='2px solid #64ffda';};
    closeBtn.onblur=function(){closeBtn.style.background='rgba(255,255,255,0.15)';closeBtn.style.outline='none';};
    closeBtn.onclick=function(){cleanupGate();};
    closeBtn.onkeydown=function(ev){if(ev.key==='Enter'||ev.keyCode===13){ev.preventDefault();cleanupGate();}};
    ov.appendChild(closeBtn);
    // Block ALL keyboard events from reaching Lampa behind the overlay
    function blockBg(ev){if(document.getElementById('auth-gate-overlay')){ev.stopPropagation();}}
    document.addEventListener('keydown',blockBg,true);
    document.addEventListener('keyup',blockBg,true);
    // Handle back/escape keys
    function onKey(ev){if(document.getElementById('auth-gate-overlay')&&(ev.key==='Escape'||ev.key==='Backspace'||ev.keyCode===27||ev.keyCode===8||ev.keyCode===10009)){ev.preventDefault();ev.stopPropagation();cleanupGate();}}
    document.addEventListener('keydown',onKey,true);
    function cleanupGate(){ov.remove();document.removeEventListener('keydown',onKey,true);document.removeEventListener('keydown',blockBg,true);document.removeEventListener('keyup',blockBg,true);}
    if(document.body) document.body.appendChild(ov);
    else document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(ov);});

    // Auth code is embedded directly in the JS (no XHR needed — Lampa WebView blocks XHR)
    if(_embCode){
      renderAuthUI(_embCode,_embLink,_embBot);
    } else {
      ov.innerHTML='<div style="text-align:center"><h2 style="margin-bottom:16px">Ошибка</h2><p style="opacity:0.5">Код авторизации не получен</p></div>';
      ov.appendChild(closeBtn);
    }

    function renderAuthUI(code,deepLink,botName){
      var card=document.createElement('div');
      card.style.cssText='background:rgba(255,255,255,0.08);border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3);backdrop-filter:blur(20px);margin:auto;';
      card.innerHTML='<h1 style="font-size:22px;margin-bottom:8px;color:#fff">Авторизация</h1>'+
        '<p style="opacity:0.5;font-size:13px;margin-bottom:24px">Отправьте код боту в Telegram</p>'+
        '<div style="font-size:44px;font-weight:700;letter-spacing:8px;color:#64ffda;margin:20px 0;font-family:Courier New,monospace" id="auth-code">'+code+'</div>'+
        (_embQR?'<div id="auth-qr" style="margin:16px auto;text-align:center"><img src="'+_embQR+'" alt="QR" style="width:160px;height:160px;border-radius:8px;image-rendering:pixelated"><p style="opacity:0.5;font-size:11px;margin-top:6px">Отсканируйте QR</p></div>':'')+
        '<ol style="text-align:left;margin:20px auto;max-width:320px;list-style:decimal inside;line-height:2;font-size:13px;opacity:0.7">'+
        '<li>Откройте бота <b>@'+botName+'</b></li>'+
        '<li>Отправьте код <b>'+code+'</b></li>'+
        '<li>После одобрения нажмите кнопку ниже</li></ol>'+
        (deepLink?'<a href="'+deepLink+'" target="_blank" style="display:inline-block;margin-top:12px;padding:10px 28px;background:#0088cc;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">Открыть Telegram</a>':'')+
        '<div id="auth-refresh-wrap" style="margin-top:20px;text-align:center">'+
        '<button id="auth-refresh-btn" style="padding:12px 36px;background:#64ffda;color:#1a1a2e;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:8px">Я отправил код — обновить</button>'+
        '<p style="opacity:0.4;font-size:11px">Или перезапустите приложение</p></div>'+
        '<div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.12);padding-top:16px">'+
        '<p style="opacity:0.5;font-size:12px;margin-bottom:8px">Или введите промокод</p>'+
        '<div style="display:flex;gap:8px;justify-content:center">'+
        '<input id="promo-input" type="text" placeholder="P-XXXXXX" maxlength="12" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px 12px;color:#fff;font-size:14px;letter-spacing:2px;text-transform:uppercase;width:140px;text-align:center;outline:none;font-family:Courier New,monospace">'+
        '<button id="promo-btn" style="background:#10b981;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">OK</button></div>'+
        '<div id="promo-status" style="margin-top:8px;font-size:12px"></div></div>';
      ov.innerHTML='';
      ov.style.display='flex';
      ov.appendChild(card);
      ov.appendChild(closeBtn);
      var rbtn=document.getElementById('auth-refresh-btn');
      if(rbtn){rbtn.tabIndex=2;rbtn.onclick=function(){window.location.reload();};}
      var pbtn=document.getElementById('promo-btn');
      var pinp=document.getElementById('promo-input');
      if(pinp)pinp.tabIndex=3;
      if(pbtn)pbtn.tabIndex=4;
      // Focus style for all focusable elements inside gate
      var focusStyle='outline:2px solid #64ffda;outline-offset:2px;';
      var noFocusStyle='outline:none;';
      [rbtn,pbtn,pinp].forEach(function(el){if(el){el.onfocus=function(){el.style.cssText+=focusStyle;};el.onblur=function(){el.style.cssText=el.style.cssText.replace(/outline:[^;]+;?/g,'')+noFocusStyle;};}});
      // Arrow key navigation between focusable elements
      var focusEls=[closeBtn,rbtn,pinp,pbtn].filter(Boolean);
      ov.addEventListener('keydown',function(ev){
        var k=ev.key||ev.keyCode;
        if(k==='ArrowDown'||k===40||k==='ArrowRight'||k===39){
          var ci=focusEls.indexOf(document.activeElement);
          if(ci>=0&&ci<focusEls.length-1){ev.preventDefault();focusEls[ci+1].focus();}
          else if(ci<0&&focusEls.length){ev.preventDefault();focusEls[0].focus();}
        }else if(k==='ArrowUp'||k===38||k==='ArrowLeft'||k===37){
          var ci=focusEls.indexOf(document.activeElement);
          if(ci>0){ev.preventDefault();focusEls[ci-1].focus();}
        }
      },false);
      // Auto-focus first actionable button (refresh)
      setTimeout(function(){if(rbtn)rbtn.focus();else if(closeBtn)closeBtn.focus();},100);
      // Telegram link also focusable
      var tgLink=card.querySelector('a[href]');
      if(tgLink){tgLink.tabIndex=2;focusEls.splice(1,0,tgLink);tgLink.onfocus=function(){tgLink.style.cssText+=focusStyle;};tgLink.onblur=function(){tgLink.style.cssText=tgLink.style.cssText.replace(/outline:[^;]+;?/g,'')+noFocusStyle;};}
      if(pbtn&&pinp){
        function doPromo(){
          var c=pinp.value.trim();if(!c)return;
          var ps=document.getElementById('promo-status');
          pbtn.disabled=true;pbtn.textContent='...';
          var x=new XMLHttpRequest();
          x.open('POST',_srvHost+'/tg/auth/promo');
          x.setRequestHeader('Content-Type','application/json');
          x.onload=function(){
            try{var d=JSON.parse(x.responseText);
              if(d.ok&&d.token){ps.style.color='#64ffda';ps.textContent='Доступ на '+d.days+' дн.!';saveToken(d.token);setTimeout(function(){authDone(d.token)},1000);}
              else{ps.style.color='#ff6b6b';ps.textContent='Недействительный промокод';pbtn.disabled=false;pbtn.textContent='OK';}
            }catch(e){ps.style.color='#ff6b6b';ps.textContent='Ошибка';pbtn.disabled=false;pbtn.textContent='OK';}
          };
          x.onerror=function(){ps.style.color='#ff6b6b';ps.textContent='Ошибка сети';pbtn.disabled=false;pbtn.textContent='OK';};
          x.send(JSON.stringify({code:c}));
        }
        pbtn.onclick=doPromo;
        pinp.onkeydown=function(ev){if(ev.key==='Enter')doPromo();};
      }
    }

    function authDone(tok){
      if(tok){saveToken(tok);}
      try{localStorage.removeItem('activity');}catch(e){}
      ov.remove();
      window.location.reload();
    }
  }
})();
(function() {
  'use strict';

  // Batch Transcoding — pre-transcode series episodes for instant switching.
// Injected into online.js via {batch-transcoding} template variable.
// Works with ExoPlayer and any player — replaces episode URLs with HLS playlists.
(function(){
  if (!true) return;

  var _batchId = null;
  var _heartbeatTimer = null;

  function startBatch(element, playlist) {
    if (!element.isonline || !playlist || playlist.length < 2) return Promise.resolve(false);

    var episodes = [];
    for (var i = 0; i < Math.min(playlist.length, 20); i++) {
      var ep = playlist[i];
      var url = typeof ep.url === 'string' ? ep.url : '';
      if (!url || /\.(m3u8|mpd)(\?|$)/i.test(url)) continue;
      episodes.push({ url: url, title: ep.title || '', audioIndex: 0 });
    }

    if (episodes.length < 2) return Promise.resolve(false);

    return fetch('/transcoding/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ episodes: episodes, subtitles: true })
    })
    .then(function(resp) {
      if (!resp.ok) return false;
      return resp.json();
    })
    .then(function(data) {
      if (!data || !data.batchId) return false;

      _batchId = data.batchId;

      // Replace URLs in playlist with transcoded HLS playlists where available
      if (data.episodes) {
        data.episodes.forEach(function(ep) {
          if (ep.playlistUrl && ep.index < playlist.length) {
            // For ExoPlayer: replace URL with HLS playlist (method:"play")
            playlist[ep.index].url = ep.playlistUrl;
            // Remove quality map — transcoded stream is single quality
            delete playlist[ep.index].quality;
            delete playlist[ep.index].qualitys;
          }
        });

        // Also update main element if it's the first episode
        var currentIdx = 0;
        for (var j = 0; j < playlist.length; j++) {
          if (playlist[j].url === element.url || playlist[j].title === element.title) {
            currentIdx = j;
            break;
          }
        }
        if (data.episodes[currentIdx] && data.episodes[currentIdx].playlistUrl) {
          element.url = data.episodes[currentIdx].playlistUrl;
          delete element.quality;
          delete element.qualitys;
        }
      }

      // Start heartbeat
      stopBatch();
      _heartbeatTimer = setInterval(function() {
        if (_batchId) {
          fetch('/transcoding/batch/' + _batchId + '/heartbeat').catch(function(){});
        }
      }, 10000);

      // Listen for episode changes to notify server
      if (typeof Lampa !== 'undefined' && Lampa.Player && Lampa.Player.listener) {
        Lampa.Player.listener.follow('playlist', function(data) {
          if (_batchId && data && typeof data.position === 'number') {
            fetch('/transcoding/batch/' + _batchId + '/episode/' + data.position, {
              method: 'POST'
            }).then(function(resp) {
              if (!resp.ok) return;
              return resp.json();
            }).then(function(info) {
              // If episode has a playlistUrl, the batch has it ready
              if (info && info.playlistUrl) {
                console.log('[BatchTC] Episode ' + data.position + ' ready:', info.state);
              }
            }).catch(function(){});
          }
        });

        Lampa.Player.listener.follow('destroy', function() {
          stopBatch();
        });
      }

      console.log('[BatchTC] Batch started:', _batchId, 'episodes:', episodes.length);
      return true;
    })
    .catch(function(e) {
      console.warn('[BatchTC] Failed to start batch:', e);
      return false;
    });
  }

  function stopBatch() {
    if (_heartbeatTimer) {
      clearInterval(_heartbeatTimer);
      _heartbeatTimer = null;
    }
    if (_batchId) {
      fetch('/transcoding/batch/' + _batchId + '/stop').catch(function(){});
      _batchId = null;
    }
  }

  // Expose globally for player-inner.js integration
  window.__batchTranscoding = {
    start: startBatch,
    stop: stopBatch,
    active: function() { return !!_batchId; }
  };
})();


  var Defined = {
    api: 'lampac',
    localhost: 'https://beta.l-vid.online/',
    apn: ''
  };

  var balansers_with_search;
  
  var unic_id = Lampa.Storage.get('lampac_unic_id', '');
  if (!unic_id) {
    unic_id = Lampa.Utils.uid(8).toLowerCase();
    Lampa.Storage.set('lampac_unic_id', unic_id);
  }
  
    function getAndroidVersion() {
  if (Lampa.Platform.is('android')) {
    try {
      var current = AndroidJS.appVersion().split('-');
      return parseInt(current.pop());
    } catch (e) {
      return 0;
    }
  } else {
    return 0;
  }
}

var hostkey = 'https://beta.l-vid.online'.replace('http://', '').replace('https://', '');

if (!window.rch_nws || !window.rch_nws[hostkey]) {
  if (!window.rch_nws) window.rch_nws = {};

  window.rch_nws[hostkey] = {
    type: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : undefined,
    startTypeInvoke: false,
    rchRegistry: false,
    apkVersion: getAndroidVersion()
  };
}

window.rch_nws[hostkey].typeInvoke = function rchtypeInvoke(host, call) {
  if (!window.rch_nws[hostkey].startTypeInvoke) {
    window.rch_nws[hostkey].startTypeInvoke = true;

    var check = function check(good) {
      window.rch_nws[hostkey].type = Lampa.Platform.is('android') ? 'apk' : good ? 'cors' : 'web';
      call();
    };

    if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) check(true);
    else {
      var net = new Lampa.Reguest();
      net.silent('https://beta.l-vid.online'.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
        check(true);
      }, function() {
        check(false);
      }, false, {
        dataType: 'text'
      });
    }
  } else call();
};

window.rch_nws[hostkey].Registry = function RchRegistry(client, startConnection) {
  window.rch_nws[hostkey].typeInvoke('https://beta.l-vid.online', function() {

    client.invoke("RchRegistry", JSON.stringify({
      version: 151,
      host: location.host,
      rchtype: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : (window.rch_nws[hostkey].type || 'web'),
      apkVersion: window.rch_nws[hostkey].apkVersion,
      player: Lampa.Storage.field('player'),
	  account_email: Lampa.Storage.get('account_email', ''),
	  unic_id: Lampa.Storage.get('lampac_unic_id', ''),
	  profile_id: Lampa.Storage.get('lampac_profile_id', ''),
	  token: ''
    }));

    if (client._shouldReconnect && window.rch_nws[hostkey].rchRegistry) {
      if (startConnection) startConnection();
      return;
    }

    window.rch_nws[hostkey].rchRegistry = true;

    client.on('RchRegistry', function(clientIp) {
      if (startConnection) startConnection();
    });

    client.on("RchClient", function(rchId, url, data, headers, returnHeaders) {
      var network = new Lampa.Reguest();
	  
	  function sendResult(uri, html) {
	    $.ajax({
	      url: 'https://beta.l-vid.online/rch/' + uri + '?id=' + rchId,
	      type: 'POST',
	      data: html,
	      async: true,
	      cache: false,
	      contentType: false,
	      processData: false,
	      success: function(j) {},
	      error: function() {
	        client.invoke("RchResult", rchId, '');
	      }
	    });
	  }

      function result(html) {
        if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) {
          html = JSON.stringify(html);
        }

        if (typeof CompressionStream !== 'undefined' && html && html.length > 1000) {
          var compressionStream = new CompressionStream('gzip');
          var encoder = new TextEncoder();
          var readable = new ReadableStream({
            start: function(controller) {
              controller.enqueue(encoder.encode(html));
              controller.close();
            }
          });
          var compressedStream = readable.pipeThrough(compressionStream);
          new Response(compressedStream).arrayBuffer()
            .then(function(compressedBuffer) {
              var compressedArray = new Uint8Array(compressedBuffer);
              if (compressedArray.length > html.length) {
                sendResult('result', html);
              } else {
                sendResult('gzresult', compressedArray);
              }
            })
            .catch(function() {
              sendResult('result', html);
            });

        } else {
          sendResult('result', html);
        }
      }

      if (url == 'eval') {
        console.log('RCH', url, data);
        result(eval(data));
      } else if (url == 'evalrun') {
        console.log('RCH', url, data);
        eval(data);
      } else if (url == 'ping') {
        result('pong');
      } else {
        console.log('RCH', url);
        network["native"](url, result, function(e) {
          console.log('RCH', 'result empty, ' + e.status);
          result('');
        }, data, {
          dataType: 'text',
          timeout: 1000 * 8,
          headers: headers,
          returnHeaders: returnHeaders
        });
      }
    });

    client.on('Connected', function(connectionId) {
      console.log('RCH', 'ConnectionId: ' + connectionId);
      window.rch_nws[hostkey].connectionId = connectionId;
    });
    client.on('Closed', function() {
      console.log('RCH', 'Connection closed');
    });
    client.on('Error', function(err) {
      console.log('RCH', 'error:', err);
    });
  });
};
  window.rch_nws[hostkey].typeInvoke('https://beta.l-vid.online', function() {});

  function rchInvoke(json, call) {
    if (window.nwsClient && window.nwsClient[hostkey] && window.nwsClient[hostkey]._shouldReconnect){
      call();
      return;
    }
    if (!window.nwsClient) window.nwsClient = {};
    if (window.nwsClient[hostkey] && window.nwsClient[hostkey].socket)
      window.nwsClient[hostkey].socket.close();
    window.nwsClient[hostkey] = new NativeWsClient(json.nws, {
      autoReconnect: false
    });
    window.nwsClient[hostkey].on('Connected', function(connectionId) {
      window.rch_nws[hostkey].Registry(window.nwsClient[hostkey], function() {
        call();
      });
    });
    window.nwsClient[hostkey].connect();
  }

  function rchRun(json, call) {
    if (typeof NativeWsClient == 'undefined') {
      Lampa.Utils.putScript(["https://beta.l-vid.online/js/nws-client-es5.js?v18112025"], function() {}, false, function() {
        rchInvoke(json, call);
      }, true);
    } else {
      rchInvoke(json, call);
    }
  }

  // FNV-1a hash for device fingerprint
  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  }

  // ── Comprehensive device fingerprint ──
  // Survives cache clear / app reinstall (based on hardware, not storage).
  // ~15 signals: canvas, WebGL, audio, screen, hardware, timezone, math.
  var device_fp = '';
  try {
    var fp = [];

    // 1. Screen (physical properties)
    fp.push(screen.width + 'x' + screen.height + ':' + screen.availWidth + 'x' + screen.availHeight);
    fp.push(screen.colorDepth || 0);
    fp.push(window.devicePixelRatio || 1);

    // 2. Hardware
    fp.push(navigator.hardwareConcurrency || 0);
    fp.push(navigator.deviceMemory || 0);
    fp.push(navigator.maxTouchPoints || 0);

    // 3. Platform / locale
    fp.push(navigator.platform || '');
    fp.push(navigator.language || '');
    fp.push((navigator.languages || []).join(','));

    // 4. Timezone
    try { fp.push(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch(e) { fp.push(''); }
    fp.push(new Date().getTimezoneOffset());

    // 5. Math engine quirks (differ between JS engines)
    fp.push(Math.tan(-1e300));

    // 6. Canvas fingerprint (GPU + font rendering)
    try {
      var c = document.createElement('canvas');
      c.width = 280; c.height = 60;
      var x = c.getContext('2d');
      if (x) {
        x.textBaseline = 'alphabetic';
        x.fillStyle = '#f60';
        x.fillRect(125, 1, 62, 20);
        x.fillStyle = '#069';
        x.font = '14px Arial';
        x.fillText('Cwm fjordbank glyphs vext quiz', 2, 15);
        x.fillStyle = 'rgba(102,204,0,0.7)';
        x.font = '18px Times New Roman';
        x.fillText('Cwm fjordbank glyphs vext quiz', 4, 45);
        x.globalCompositeOperation = 'multiply';
        x.fillStyle = 'rgb(255,0,255)';
        x.beginPath(); x.arc(50, 50, 50, 0, Math.PI * 2, true); x.closePath(); x.fill();
        x.fillStyle = 'rgb(0,255,255)';
        x.beginPath(); x.arc(100, 50, 50, 0, Math.PI * 2, true); x.closePath(); x.fill();
        fp.push(fnv1a(c.toDataURL()));
      } else fp.push('nc');
    } catch(e) { fp.push('nc'); }

    // 7. WebGL fingerprint (GPU model + capabilities)
    try {
      var gc = document.createElement('canvas');
      var gl = gc.getContext('webgl') || gc.getContext('experimental-webgl');
      if (gl) {
        var di = gl.getExtension('WEBGL_debug_renderer_info');
        fp.push(di ? gl.getParameter(di.UNMASKED_VENDOR_WEBGL) : '');
        fp.push(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : '');
        fp.push(gl.getParameter(gl.MAX_TEXTURE_SIZE));
        fp.push(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
        fp.push(gl.getParameter(gl.MAX_VERTEX_ATTRIBS));
        fp.push(gl.getParameter(gl.MAX_VARYING_VECTORS));
        var lw = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
        fp.push(lw ? lw[0]+','+lw[1] : '');
        var ps = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
        fp.push(ps ? ps[0]+','+ps[1] : '');
        fp.push(fnv1a((gl.getSupportedExtensions() || []).join(',')));
      } else fp.push('ng');
    } catch(e) { fp.push('ng'); }

    // 8. Audio (hardware sample rate + channels)
    try {
      var ac = new (window.AudioContext || window.webkitAudioContext)();
      fp.push(ac.sampleRate);
      fp.push(ac.destination.maxChannelCount);
      ac.close();
    } catch(e) { fp.push('na'); }

    device_fp = fnv1a(fp.join('|||'));
  } catch(e) {}

  function account(url) {
    url = url + '';
    if (url.indexOf('account_email=') == -1) {
      var email = Lampa.Storage.get('account_email');
      if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
    }
    if (url.indexOf('uid=') == -1) {
      var uid = Lampa.Storage.get('lampac_unic_id', '');
      if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));
    }
    if (url.indexOf('token=') == -1) {
      var token = '';
      if (!token) {
        try { var m = document.cookie.match(/(?:^|;\s*)lampac_token=([^;]+)/); if (m) token = decodeURIComponent(m[1]); } catch(e) {}
      }
      if (!token) {
        try { token = localStorage.getItem('lampac_auth_token') || ''; } catch(e) {}
      }
      if (token) url = Lampa.Utils.addUrlComponent(url, 'token=' + encodeURIComponent(token));
    }
    if (url.indexOf('fp=') == -1 && device_fp) {
      url = Lampa.Utils.addUrlComponent(url, 'fp=' + encodeURIComponent(device_fp));
    }
    if (url.indexOf('nws_id=') == -1 && window.rch_nws && window.rch_nws[hostkey]) {
      var nws_id = window.rch_nws[hostkey].connectionId || Lampa.Storage.get('lampac_nws_id', '');
      if (nws_id) url = Lampa.Utils.addUrlComponent(url, 'nws_id=' + encodeURIComponent(nws_id));
    }
    return url;
  }
  
  var Network = Lampa.Reguest;

  function component(object) {
    var network = new Network();
    var scroll = new Lampa.Scroll({
      mask: true,
      over: true
    });
    var files = new Lampa.Explorer(object);
    var filter = new Lampa.Filter(object);
    var sources = {};
    var last;
    var source;
    var balanser;
    var initialized;
    var balanser_timer;
    var images = [];
    var number_of_requests = 0;
    var number_of_requests_timer;
    var life_wait_times = 0;
    var life_wait_timer;
    var filter_sources = {};
    var filter_translate = {
      season: Lampa.Lang.translate('torrent_serial_season'),
      voice: Lampa.Lang.translate('torrent_parser_voice'),
      source: Lampa.Lang.translate('settings_rest_source')
    };
    var filter_find = {
      season: [],
      voice: []
    };
	
    if (balansers_with_search == undefined) {
      network.timeout(10000);
      network.silent(account('https://beta.l-vid.online/lite/withsearch'), function(json) {
        balansers_with_search = json;
      }, function() {
		  balansers_with_search = [];
	  });
    }
	
    function balanserName(j) {
      var bals = j.balanser;
      var name = j.name.split(' ')[0];
      return (bals || name).toLowerCase();
    }
	
	function clarificationSearchAdd(value){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
		all[id] = value;
		
		Lampa.Storage.set('clarification_search',all);
	}
	
	function clarificationSearchDelete(){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
		delete all[id];
		
		Lampa.Storage.set('clarification_search',all);
	}
	
	function clarificationSearchGet(){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
		return all[id];
	}
	
    this.initialize = function() {
      var _this = this;
      this.loading(true);
      filter.onSearch = function(value) {
		  
		clarificationSearchAdd(value);
		
        Lampa.Activity.replace({
          search: value,
          clarification: true,
          similar: true
        });
      };
      filter.onBack = function() {
        _this.start();
      };
      filter.render().find('.selector').on('hover:enter', function() {
        clearInterval(balanser_timer);
      });
      filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
      filter.onSelect = function(type, a, b) {
        if (type == 'filter') {
          if (a.reset) {
			  clarificationSearchDelete();
			  
            _this.replaceChoice({
              season: 0,
              voice: 0,
              voice_url: '',
              voice_name: ''
            });
            setTimeout(function() {
              Lampa.Select.close();
              Lampa.Activity.replace({
				  clarification: 0,
				  similar: 0
			  });
            }, 10);
          } else {
            var url = filter_find[a.stype][b.index].url;
            var choice = _this.getChoice();
            if (a.stype == 'voice') {
              choice.voice_name = filter_find.voice[b.index].title;
              choice.voice_url = url;
            }
            choice[a.stype] = b.index;
            _this.saveChoice(choice);
            _this.reset();
            _this.request(url);
            setTimeout(Lampa.Select.close, 10);
          }
        } else if (type == 'sort') {
          Lampa.Select.close();
          object.lampac_custom_select = a.source;
          _this.changeBalanser(a.source);
        }
      };
      if (filter.addButtonBack) filter.addButtonBack();
      filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser'));
      scroll.body().addClass('torrent-list');
      files.appendFiles(scroll.render());
      files.appendHead(filter.render());
      scroll.minus(files.render().find('.explorer__files-head'));
      scroll.body().append(Lampa.Template.get('lampac_content_loading'));
      Lampa.Controller.enable('content');
      this.loading(false);
	  if(object.balanser){
		  files.render().find('.filter--search').remove();
		  sources = {};
		  sources[object.balanser] = {name: object.balanser};
		  balanser = object.balanser;
		  filter_sources = [];
		  
		  return network["native"](account(object.url.replace('rjson=','nojson=')), this.parse.bind(this), function(){
			  files.render().find('.torrent-filter').remove();
			  _this.empty();
		  }, false, {
            dataType: 'text',
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
	  } 
      this.externalids().then(function() {
        return _this.createSource();
      }).then(function(json) {
        if (!balansers_with_search.find(function(b) {
            return balanser.slice(0, b.length) == b;
          })) {
          filter.render().find('.filter--search').addClass('hide');
        }
        _this.search();
      })["catch"](function(e) {
        _this.noConnectToServer(e);
      });
    };
    this.rch = function(json, noreset) {
      var _this2 = this;
	  rchRun(json, function() {
        if (!noreset) _this2.find();
        else noreset();
	  });
    };
    this.externalids = function() {
      return new Promise(function(resolve, reject) {
        if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
          var query = [];
          query.push('id=' + encodeURIComponent(object.movie.id));
          query.push('serial=' + (object.movie.name ? 1 : 0));
          if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
          if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
          var url = Defined.localhost + 'externalids?' + query.join('&');
          network.timeout(10000);
          network.silent(account(url), function(json) {
            for (var name in json) {
              object.movie[name] = json[name];
            }
            resolve();
          }, function() {
            resolve();
          }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
        } else resolve();
      });
    };
    this.updateBalanser = function(balanser_name) {
      var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      last_select_balanser[object.movie.id] = balanser_name;
      Lampa.Storage.set('online_last_balanser', last_select_balanser);
    };
    this.changeBalanser = function(balanser_name) {
      this.updateBalanser(balanser_name);
      Lampa.Storage.set('online_balanser', balanser_name);
      var to = this.getChoice(balanser_name);
      var from = this.getChoice();
      if (from.voice_name) to.voice_name = from.voice_name;
      this.saveChoice(to, balanser_name);
      Lampa.Activity.replace();
    };
    this.requestParams = function(url) {
      var query = [];
      var card_source = object.movie.source || 'tmdb'; //Lampa.Storage.field('source')
      query.push('id=' + encodeURIComponent(object.movie.id));
      if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
      if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
	  if (object.movie.tmdb_id) query.push('tmdb_id=' + (object.movie.tmdb_id || ''));
      query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
      query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
      query.push('serial=' + (object.movie.name ? 1 : 0));
      query.push('original_language=' + (object.movie.original_language || ''));
      query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
      query.push('source=' + card_source);
      query.push('clarification=' + (object.clarification ? 1 : 0));
      query.push('similar=' + (object.similar ? true : false));
      query.push('rchtype=' + (((window.rch_nws && window.rch_nws[hostkey]) ? window.rch_nws[hostkey].type : (window.rch && window.rch[hostkey]) ? window.rch[hostkey].type : '') || ''));
      if (Lampa.Storage.get('account_email', '')) query.push('cub_id=' + Lampa.Utils.hash(Lampa.Storage.get('account_email', '')));
      return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
    };
    this.getLastChoiceBalanser = function() {
      var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      if (last_select_balanser[object.movie.id]) {
        return last_select_balanser[object.movie.id];
      } else {
        return Lampa.Storage.get('online_balanser', filter_sources.length ? filter_sources[0] : '');
      }
    };
    this.startSource = function(json) {
      return new Promise(function(resolve, reject) {
        json.forEach(function(j) {
          var name = balanserName(j);
          sources[name] = {
            url: j.url,
            name: j.name,
            show: typeof j.show == 'undefined' ? true : j.show
          };
        });
        filter_sources = Lampa.Arrays.getKeys(sources);
        if (filter_sources.length) {
          var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
          if (last_select_balanser[object.movie.id]) {
            balanser = last_select_balanser[object.movie.id];
          } else {
            balanser = Lampa.Storage.get('online_balanser', filter_sources[0]);
          }
          if (!sources[balanser]) balanser = filter_sources[0];
          if (!sources[balanser].show && !object.lampac_custom_select) balanser = filter_sources[0];
          source = sources[balanser].url;
          Lampa.Storage.set('active_balanser', balanser);
          resolve(json);
        } else {
          reject();
        }
      });
    };
    this.lifeSource = function() {
      var _this3 = this;
      return new Promise(function(resolve, reject) {
        var url = _this3.requestParams(Defined.localhost + 'lifeevents?memkey=' + (_this3.memkey || ''));
        var red = false;
        var gou = function gou(json, any) {
          if (json.accsdb) return reject(json);
          var last_balanser = _this3.getLastChoiceBalanser();
          if (!red) {
            var _filter = json.online.filter(function(c) {
              return any ? c.show : c.show && c.name.toLowerCase() == last_balanser;
            });
            if (_filter.length) {
              red = true;
              resolve(json.online.filter(function(c) {
                return c.show;
              }));
            } else if (any) {
              reject();
            }
          }
        };
        var fin = function fin(call) {
          network.timeout(3000);
          network.silent(account(url), function(json) {
            life_wait_times++;
            if (!json || !Array.isArray(json.online)) {
              if (life_wait_times > 15) { reject(); return; }
              life_wait_timer = setTimeout(fin, 1000);
              return;
            }
            filter_sources = [];
            sources = {};
            json.online.forEach(function(j) {
              var name = balanserName(j);
              sources[name] = {
                url: j.url,
                name: j.name,
                show: typeof j.show == 'undefined' ? true : j.show
              };
            });
            filter_sources = Lampa.Arrays.getKeys(sources);
            filter.set('sort', filter_sources.map(function(e) {
              return {
                title: sources[e].name,
                source: e,
                selected: e == balanser,
                ghost: !sources[e].show
              };
            }));
            filter.chosen('sort', [sources[balanser] ? sources[balanser].name : balanser]);
            gou(json);
            var lastb = _this3.getLastChoiceBalanser();
            if (life_wait_times > 15 || json.ready) {
              filter.render().find('.lampac-balanser-loader').remove();
              gou(json, true);
            } else if (!red && sources[lastb] && sources[lastb].show) {
              gou(json, true);
              life_wait_timer = setTimeout(fin, 1000);
            } else {
              life_wait_timer = setTimeout(fin, 1000);
            }
          }, function() {
            life_wait_times++;
            if (life_wait_times > 15) {
              reject();
            } else {
              life_wait_timer = setTimeout(fin, 1000);
            }
          }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
        };
        fin();
      });
    };
    this.createSource = function() {
      var _this4 = this;
      return new Promise(function(resolve, reject) {
        var url = _this4.requestParams(Defined.localhost + 'lite/events?life=true');
        network.timeout(15000);
        network.silent(account(url), function(json) {
          if (json.accsdb) return reject(json);
          if (json.life) {
			_this4.memkey = json.memkey;
			if (json.title) {
              if (object.movie.name) object.movie.name = json.title;
              if (object.movie.title) object.movie.title = json.title;
			}
            filter.render().find('.filter--sort').append('<span class="lampac-balanser-loader" style="width: 1.2em; height: 1.2em; margin-top: 0; background: url(./img/loader.svg) no-repeat 50% 50%; background-size: contain; margin-left: 0.5em"></span>');
            _this4.lifeSource().then(_this4.startSource).then(resolve)["catch"](reject);
          } else {
            _this4.startSource(json).then(resolve)["catch"](reject);
          }
        }, reject, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
      });
    };
    /**
     * Подготовка
     */
    this.create = function() {
      return this.render();
    };
    /**
     * Начать поиск
     */
    this.search = function() { //this.loading(true)
      this.filter({
        source: filter_sources
      }, this.getChoice());
      this.find();
    };
    this.find = function() {
      this.request(this.requestParams(source));
    };
    this.request = function(url) {
      number_of_requests++;
      if (number_of_requests < 10) {
        network["native"](account(url), this.parse.bind(this), this.doesNotAnswer.bind(this), false, {
          dataType: 'text',
		  headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
        });
        clearTimeout(number_of_requests_timer);
        number_of_requests_timer = setTimeout(function() {
          number_of_requests = 0;
        }, 4000);
      } else this.empty();
    };
    this.parseJsonDate = function(str, name) {
      try {
        var html = $('<div>' + str + '</div>');
        var elems = [];
        html.find(name).each(function() {
          var item = $(this);
          var data = JSON.parse(item.attr('data-json'));
          var season = item.attr('s');
          var episode = item.attr('e');
          var text = item.text();
          if (!object.movie.name) {
            if (text.match(/\d+p/i)) {
              if (!data.quality) {
                data.quality = {};
                data.quality[text] = data.url;
              }
              text = object.movie.title;
            }
            if (text == 'По умолчанию') {
              text = object.movie.title;
            }
          }
          if (episode) data.episode = parseInt(episode);
          if (season) data.season = parseInt(season);
          if (text) data.text = text;
          data.active = item.hasClass('active');
          elems.push(data);
        });
        return elems;
      } catch (e) {
        return [];
      }
    };
    this.getFileUrl = function(file, call, waiting_rch) {
	  var _this = this;
	  
      if(Lampa.Storage.field('player') !== 'inner' && file.stream && Lampa.Platform.is('apple')){
		  var newfile = Lampa.Arrays.clone(file);
		  newfile.method = 'play';
		  newfile.url = file.stream;
		  call(newfile, {});
	  }
      else if (file.method == 'play') call(file, {});
      else {
        Lampa.Loading.start(function() {
          Lampa.Loading.stop();
          Lampa.Controller.toggle('content');
          network.clear();
        });
        network["native"](account(file.url), function(json) {
			if(json.rch){
				if(waiting_rch) {
					waiting_rch = false;
					Lampa.Loading.stop();
					call(false, {});
				}
				else {
					_this.rch(json,function(){
						Lampa.Loading.stop();
						
						_this.getFileUrl(file, call, true);
					});
				}
			}
			else{
				Lampa.Loading.stop();
				call(json, json);
			}
        }, function() {
          Lampa.Loading.stop();
          call(false, {});
        }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
      }
    };
    this.toPlayElement = function(file) {
      var play = {
        title: file.title,
        url: file.url,
        quality: file.qualitys,
        timeline: file.timeline,
        subtitles: file.subtitles,
		segments: file.segments,
        callback: file.mark,
		season: file.season,
		episode: file.episode,
		voice_name: file.voice_name,
		thumbnail: file.thumbnail
      };
      return play;
    };
    this.orUrlReserve = function(data) {
      if (data.url && typeof data.url == 'string' && data.url.indexOf(" or ") !== -1) {
        var urls = data.url.split(" or ");
        data.url = urls[0];
        data.url_reserve = urls[1];
      }
    };
    this.setDefaultQuality = function(data) {
      if (Lampa.Arrays.getKeys(data.quality).length) {
        for (var q in data.quality) {
          if (parseInt(q) == Lampa.Storage.field('video_quality_default')) {
            data.url = data.quality[q];
            this.orUrlReserve(data);
          }
          if (data.quality[q].indexOf(" or ") !== -1)
            data.quality[q] = data.quality[q].split(" or ")[0];
        }
      }
    };
    this.display = function(videos) {
      var _this5 = this;
      this.draw(videos, {
        onEnter: function onEnter(item, html) {
          _this5.getFileUrl(item, function(json, json_call) {
            if (json && json.url) {
              var playlist = [];
              var first = _this5.toPlayElement(item);
              first.url = json.url;
              first.headers = json_call.headers || json.headers;
              first.quality = json_call.quality || item.qualitys;
			  first.segments = json_call.segments || item.segments;
              first.hls_manifest_timeout = json_call.hls_manifest_timeout || json.hls_manifest_timeout;
              first.subtitles = json.subtitles;
			  first.subtitles_call = json_call.subtitles_call || json.subtitles_call;
			  if (json.vast && json.vast.url) {
                first.vast_url = json.vast.url;
                first.vast_msg = json.vast.msg;
                first.vast_region = json.vast.region;
                first.vast_platform = json.vast.platform;
                first.vast_screen = json.vast.screen;
			  }
              _this5.orUrlReserve(first);
              _this5.setDefaultQuality(first);
              if (item.season) {
                videos.forEach(function(elem) {
                  var cell = _this5.toPlayElement(elem);
                  if (elem == item) cell.url = json.url;
                  else {
                    if (elem.method == 'call') {
                      if (Lampa.Storage.field('player') !== 'inner') {
                        cell.url = elem.stream;
						delete cell.quality;
                      } else {
                        cell.url = function(call) {
                          _this5.getFileUrl(elem, function(stream, stream_json) {
                            if (stream.url) {
                              cell.url = stream.url;
                              cell.quality = stream_json.quality || elem.qualitys;
							  cell.segments = stream_json.segments || elem.segments;
                              cell.subtitles = stream.subtitles;
                              _this5.orUrlReserve(cell);
                              _this5.setDefaultQuality(cell);
                              elem.mark();
                            } else {
                              cell.url = '';
                              Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
                            }
                            call();
                          }, function() {
                            cell.url = '';
                            call();
                          });
                        };
                      }
                    } else {
                      cell.url = elem.url;
                    }
                  }
                  _this5.orUrlReserve(cell);
                  _this5.setDefaultQuality(cell);
                  playlist.push(cell);
                }); //Lampa.Player.playlist(playlist) 
              } else {
                playlist.push(first);
              }
              if (playlist.length > 1) first.playlist = playlist;
              if (first.url) {
                var element = first;
				element.isonline = true;
                if (filter_find.voice && filter_find.voice.length > 1) {
                  element.voices = filter_find.voice;
                  element.voice_index = _this5.getChoice(balanser).voice || 0;
                }
                if (element.url && element.isonline) {
  // online.js
} 
else if (element.url) {
  if (false) {
    if (Platform.is('browser') && location.host.indexOf("127.0.0.1") !== -1) {
      Noty.show('Видео открыто в playerInner', {time: 3000});
      $.get('https://beta.l-vid.online/player-inner/' + element.url);
      return;
    }

    Player.play(element);
  } 
  else {
    if (true && Platform.is('browser') && location.host.indexOf("127.0.0.1") !== -1)
      Noty.show('Внешний плеер можно указать в init.conf (playerInner)', {time: 3000});
    Player.play(element);
  }
}
                if (window.__batchTranscoding && playlist.length > 1) {
                  window.__batchTranscoding.start(element, playlist).then(function(){
                    Lampa.Player.play(element);
                    Lampa.Player.playlist(playlist);
                  });
                } else {
                  Lampa.Player.play(element);
                  Lampa.Player.playlist(playlist);
                }
				if(element.subtitles_call) _this5.loadSubtitles(element.subtitles_call)
                item.mark();
                _this5.updateBalanser(balanser);
              } else {
                Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
          }, true);
        },
        onContextMenu: function onContextMenu(item, html, data, call) {
          _this5.getFileUrl(item, function(stream) {
            call({
              file: stream.url,
              quality: item.qualitys
            });
          }, true);
        }
      });
      this.filter({
        season: filter_find.season.map(function(s) {
          return s.title;
        }),
        voice: filter_find.voice.map(function(b) {
          return b.title;
        })
      }, this.getChoice());
    };
	this.loadSubtitles = function(link){
		network.silent(account(link), function(subs){
			Lampa.Player.subtitles(subs)
		}, function() {},false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  })
	}
    this.parse = function(str) {
      var json = Lampa.Arrays.decodeJson(str, {});
      if (Lampa.Arrays.isObject(str) && str.rch) json = str;
      if (json.rch) return this.rch(json);
      try {
        var items = this.parseJsonDate(str, '.videos__item');
        var buttons = this.parseJsonDate(str, '.videos__button');
        if (items.length == 1 && items[0].method == 'link' && !items[0].similar) {
          filter_find.season = items.map(function(s) {
            return {
              title: s.text,
              url: s.url
            };
          });
          this.replaceChoice({
            season: 0
          });
          this.request(items[0].url);
        } else {
          this.activity.loader(false);
          var videos = items.filter(function(v) {
            return v.method == 'play' || v.method == 'call';
          });
          var similar = items.filter(function(v) {
            return v.similar;
          });
          if (videos.length) {
            if (buttons.length) {
              filter_find.voice = buttons.map(function(b) {
                return {
                  title: b.text,
                  url: b.url
                };
              });
              var select_voice_url = this.getChoice(balanser).voice_url;
              var select_voice_name = this.getChoice(balanser).voice_name;
              var find_voice_url = buttons.find(function(v) {
                return v.url == select_voice_url;
              });
              var find_voice_name = buttons.find(function(v) {
                return v.text == select_voice_name;
              });
              var find_voice_active = buttons.find(function(v) {
                return v.active;
              }); ////console.log('b',buttons)
              ////console.log('u',find_voice_url)
              ////console.log('n',find_voice_name)
              ////console.log('a',find_voice_active)
              if (find_voice_url && !find_voice_url.active) {
                //console.log('Alpac', 'go to voice', find_voice_url);
                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_url),
                  voice_name: find_voice_url.text
                });
                this.request(find_voice_url.url);
              } else if (find_voice_name && !find_voice_name.active) {
                //console.log('Alpac', 'go to voice', find_voice_name);
                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_name),
                  voice_name: find_voice_name.text
                });
                this.request(find_voice_name.url);
              } else {
                if (find_voice_active) {
                  this.replaceChoice({
                    voice: buttons.indexOf(find_voice_active),
                    voice_name: find_voice_active.text
                  });
                }
                this.display(videos);
              }
            } else {
              this.replaceChoice({
                voice: 0,
                voice_url: '',
                voice_name: ''
              });
              this.display(videos);
            }
          } else if (items.length) {
            if (similar.length) {
              this.similars(similar);
              this.activity.loader(false);
            } else { //this.activity.loader(true)
              filter_find.season = items.map(function(s) {
                return {
                  title: s.text,
                  url: s.url
                };
              });
              var select_season = this.getChoice(balanser).season;
              var season = filter_find.season[select_season];
              if (!season) season = filter_find.season[0];
              //console.log('Alpac', 'go to season', season);
              this.request(season.url);
            }
          } else {
            this.doesNotAnswer(json);
          }
        }
      } catch (e) {
        //console.log('Alpac', 'error', e.stack);
        this.doesNotAnswer(e);
      }
    };
    this.similars = function(json) {
      var _this6 = this;
      scroll.clear();
      json.forEach(function(elem) {
        elem.title = elem.text;
        elem.info = '';
        var info = [];
        var year = ((elem.start_date || elem.year || object.movie.release_date || object.movie.first_air_date || '') + '').slice(0, 4);
        if (year) info.push(year);
        if (elem.details) info.push(elem.details);
        var name = elem.title || elem.text;
        elem.title = name;
        elem.time = elem.time || '';
        elem.info = info.join('<span class="online-prestige-split">●</span>');
        var item = Lampa.Template.get('lampac_prestige_folder', elem);
		if (elem.img) {
		  var image = $('<img style="height: 7em; width: 7em; border-radius: 0.3em;"/>');
		  item.find('.online-prestige__folder').empty().append(image);

		  if (elem.img !== undefined) {
		    if (elem.img.charAt(0) === '/')
		      elem.img = Defined.localhost + elem.img.substring(1);
		    if (elem.img.indexOf('/proxyimg') !== -1)
		      elem.img = account(elem.img);
		  }

		  Lampa.Utils.imgLoad(image, elem.img);
		}
        item.on('hover:enter', function() {
          _this6.reset();
          _this6.request(elem.url);
        }).on('hover:focus', function(e) {
          last = e.target;
          scroll.update($(e.target), true);
        });
        scroll.append(item);
      });
	  this.filter({
        season: filter_find.season.map(function(s) {
          return s.title;
        }),
        voice: filter_find.voice.map(function(b) {
          return b.title;
        })
      }, this.getChoice());
      Lampa.Controller.enable('content');
    };
    this.getChoice = function(for_balanser) {
      var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      var save = data[object.movie.id] || {};
      Lampa.Arrays.extend(save, {
        season: 0,
        voice: 0,
        voice_name: '',
        voice_id: 0,
        episodes_view: {},
        movie_view: ''
      });
      return save;
    };
    this.saveChoice = function(choice, for_balanser) {
      var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      data[object.movie.id] = choice;
      Lampa.Storage.set('online_choice_' + (for_balanser || balanser), data);
      this.updateBalanser(for_balanser || balanser);
    };
    this.replaceChoice = function(choice, for_balanser) {
      var to = this.getChoice(for_balanser);
      Lampa.Arrays.extend(to, choice, true);
      this.saveChoice(to, for_balanser);
    };
    this.clearImages = function() {
      images.forEach(function(img) {
        img.onerror = function() {};
        img.onload = function() {};
        img.src = '';
      });
      images = [];
    };
    /**
     * Очистить список файлов
     */
    this.reset = function() {
      last = false;
      clearInterval(balanser_timer);
      network.clear();
      this.clearImages();
      scroll.render().find('.empty').remove();
      scroll.clear();
      scroll.reset();
      scroll.body().append(Lampa.Template.get('lampac_content_loading'));
    };
    /**
     * Загрузка
     */
    this.loading = function(status) {
      if (status) this.activity.loader(true);
      else {
        this.activity.loader(false);
        this.activity.toggle();
      }
    };
    /**
     * Построить фильтр
     */
    this.filter = function(filter_items, choice) {
      var _this7 = this;
      var select = [];
      var add = function add(type, title) {
        var need = _this7.getChoice();
        var items = filter_items[type];
        var subitems = [];
        var value = need[type];
        items.forEach(function(name, i) {
          subitems.push({
            title: name,
            selected: value == i,
            index: i
          });
        });
        select.push({
          title: title,
          subtitle: items[value],
          items: subitems,
          stype: type
        });
      };
      filter_items.source = filter_sources;
      select.push({
        title: Lampa.Lang.translate('torrent_parser_reset'),
        reset: true
      });
      this.saveChoice(choice);
      if (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice'));
      if (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season'));
      filter.set('filter', select);
      filter.set('sort', filter_sources.map(function(e) {
        return {
          title: sources[e].name,
          source: e,
          selected: e == balanser,
          ghost: !sources[e].show
        };
      }));
      this.selected(filter_items);
    };
    /**
     * Показать что выбрано в фильтре
     */
    this.selected = function(filter_items) {
      var need = this.getChoice(),
        select = [];
      for (var i in need) {
        if (filter_items[i] && filter_items[i].length) {
          if (i == 'voice') {
            select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
          } else if (i !== 'source') {
            if (filter_items.season.length >= 1) {
              select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
            }
          }
        }
      }
      filter.chosen('filter', select);
      filter.chosen('sort', [sources[balanser].name]);
    };
    this.getEpisodes = function(season, call) {
      var episodes = [];
	  var tmdb_id = object.movie.id;
	  if (['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1) 
        tmdb_id = object.movie.tmdb_id;
      if (typeof tmdb_id == 'number' && object.movie.name) {
		  Lampa.Api.sources.tmdb.get('tv/' + tmdb_id + '/season/' + season, {}, function(data){
			  episodes = data.episodes || [];
			  
			  call(episodes);
		  }, function(){
			  call(episodes);
		  })
      } else call(episodes);
    };
    this.watched = function(set) {
      var file_id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
      var watched = Lampa.Storage.cache('online_watched_last', 5000, {});
      if (set) {
        if (!watched[file_id]) watched[file_id] = {};
        Lampa.Arrays.extend(watched[file_id], set, true);
        Lampa.Storage.set('online_watched_last', watched);
        this.updateWatched();
      } else {
        return watched[file_id];
      }
    };
    this.updateWatched = function() {
      var watched = this.watched();
      var body = scroll.body().find('.online-prestige-watched .online-prestige-watched__body').empty();
      if (watched) {
        var line = [];
        if (watched.balanser_name) line.push(watched.balanser_name);
        if (watched.voice_name) line.push(watched.voice_name);
        if (watched.season) line.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + watched.season);
        if (watched.episode) line.push(Lampa.Lang.translate('torrent_serial_episode') + ' ' + watched.episode);
        line.forEach(function(n) {
          body.append('<span>' + n + '</span>');
        });
      } else body.append('<span>' + Lampa.Lang.translate('lampac_no_watch_history') + '</span>');
    };
    /**
     * Отрисовка файлов
     */
    this.draw = function(items) {
      var _this8 = this;
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (!items.length) return this.empty();
      scroll.clear();
      if(!object.balanser)scroll.append(Lampa.Template.get('lampac_prestige_watched', {}));
      this.updateWatched();
      this.getEpisodes(items[0].season, function(episodes) {
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var serial = object.movie.name ? true : false;
        var choice = _this8.getChoice();
        var fully = window.innerWidth > 480;
        var scroll_to_element = false;
        var scroll_to_mark = false;
        items.forEach(function(element, index) {
          var episode = serial && episodes.length && !params.similars ? episodes.find(function(e) {
            return e.episode_number == element.episode;
          }) : false;
          var episode_num = element.episode || index + 1;
          var episode_last = choice.episodes_view[element.season];
          var voice_name = choice.voice_name || (filter_find.voice[0] ? filter_find.voice[0].title : false) || element.voice_name || (serial ? 'Неизвестно' : element.text) || 'Неизвестно';
          if (element.quality) {
            element.qualitys = element.quality;
            element.quality = Lampa.Arrays.getKeys(element.quality)[0];
          }
          Lampa.Arrays.extend(element, {
            voice_name: voice_name,
            info: voice_name.length > 60 ? voice_name.substr(0, 60) + '...' : voice_name,
            quality: '',
            time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true)
          });
          var hash_timeline = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var hash_behold = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title, element.voice_name].join('') : object.movie.original_title + element.voice_name);
          var data = {
            hash_timeline: hash_timeline,
            hash_behold: hash_behold
          };
          var info = [];
          if (element.season) {
            element.translate_episode_end = _this8.getLastEpisode(items);
            element.translate_voice = element.voice_name;
          }
          if (element.text && !episode) element.title = element.text;
          element.timeline = Lampa.Timeline.view(hash_timeline);
          if (episode) {
            element.title = episode.name;
            if (element.info.length < 30 && episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
              rate: parseFloat(episode.vote_average + '').toFixed(1)
            }, true));
            if (episode.air_date && fully) info.push(Lampa.Utils.parseTime(episode.air_date).full);
          } else if (object.movie.release_date && fully) {
            info.push(Lampa.Utils.parseTime(object.movie.release_date).full);
          }
          if (!serial && object.movie.tagline && element.info.length < 30) info.push(object.movie.tagline);
          if (element.info) info.push(element.info);
          if (info.length) element.info = info.map(function(i) {
            return '<span>' + i + '</span>';
          }).join('<span class="online-prestige-split">●</span>');
          var html = Lampa.Template.get('lampac_prestige_full', element);
          var loader = html.find('.online-prestige__loader');
          var image = html.find('.online-prestige__img');
		  if(object.balanser) image.hide();
          if (!serial) {
            if (choice.movie_view == hash_behold) scroll_to_element = html;
          } else if (typeof episode_last !== 'undefined' && episode_last == episode_num) {
            scroll_to_element = html;
          }
          if (serial && !episode) {
            image.append('<div class="online-prestige__episode-number">' + ('0' + (element.episode || index + 1)).slice(-2) + '</div>');
            loader.remove();
          }
		  else if (!serial && object.movie.backdrop_path == 'undefined') loader.remove();
          else {
            var img = html.find('img')[0];
            img.onerror = function() {
              img.src = './img/img_broken.svg';
            };
            img.onload = function() {
              image.addClass('online-prestige__img--loaded');
              loader.remove();
              if (serial) image.append('<div class="online-prestige__episode-number">' + ('0' + (element.episode || index + 1)).slice(-2) + '</div>');
            };
            img.src = Lampa.TMDB.image('t/p/w300' + (episode ? episode.still_path : object.movie.backdrop_path));
            images.push(img);
			element.thumbnail = img.src
          }
          html.find('.online-prestige__timeline').append(Lampa.Timeline.render(element.timeline));
          if (viewed.indexOf(hash_behold) !== -1) {
            scroll_to_mark = html;
            html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
          }
          element.mark = function() {
            viewed = Lampa.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) == -1) {
              viewed.push(hash_behold);
              Lampa.Storage.set('online_view', viewed);
              if (html.find('.online-prestige__viewed').length == 0) {
                html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
              }
            }
            choice = _this8.getChoice();
            if (!serial) {
              choice.movie_view = hash_behold;
            } else {
              choice.episodes_view[element.season] = episode_num;
            }
            _this8.saveChoice(choice);
            var voice_name_text = choice.voice_name || element.voice_name || element.title;
            if (voice_name_text.length > 30) voice_name_text = voice_name_text.slice(0, 30) + '...';
            _this8.watched({
              balanser: balanser,
              balanser_name: Lampa.Utils.capitalizeFirstLetter(sources[balanser] ? sources[balanser].name.split(' ')[0] : balanser),
              voice_id: choice.voice_id,
              voice_name: voice_name_text,
              episode: element.episode,
              season: element.season
            });
          };
          element.unmark = function() {
            viewed = Lampa.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) !== -1) {
              Lampa.Arrays.remove(viewed, hash_behold);
              Lampa.Storage.set('online_view', viewed);
              Lampa.Storage.remove('online_view', hash_behold);
              html.find('.online-prestige__viewed').remove();
            }
          };
          element.timeclear = function() {
            element.timeline.percent = 0;
            element.timeline.time = 0;
            element.timeline.duration = 0;
            Lampa.Timeline.update(element.timeline);
          };
          html.on('hover:enter', function() {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            if (params.onEnter) params.onEnter(element, html, data);
          }).on('hover:focus', function(e) {
            last = e.target;
            if (params.onFocus) params.onFocus(element, html, data);
            scroll.update($(e.target), true);
          });
          if (params.onRender) params.onRender(element, html, data);
          _this8.contextMenu({
            html: html,
            element: element,
            onFile: function onFile(call) {
              if (params.onContextMenu) params.onContextMenu(element, html, data, call);
            },
            onClearAllMark: function onClearAllMark() {
              items.forEach(function(elem) {
                elem.unmark();
              });
            },
            onClearAllTime: function onClearAllTime() {
              items.forEach(function(elem) {
                elem.timeclear();
              });
            }
          });
          scroll.append(html);
        });
        if (serial && episodes.length > items.length && !params.similars) {
          var left = episodes.slice(items.length);
          left.forEach(function(episode) {
            var info = [];
            if (episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
              rate: parseFloat(episode.vote_average + '').toFixed(1)
            }, true));
            if (episode.air_date) info.push(Lampa.Utils.parseTime(episode.air_date).full);
            var air = new Date((episode.air_date + '').replace(/-/g, '/'));
            var now = Date.now();
            var day = Math.round((air.getTime() - now) / (24 * 60 * 60 * 1000));
            var txt = Lampa.Lang.translate('full_episode_days_left') + ': ' + day;
            var html = Lampa.Template.get('lampac_prestige_full', {
              time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true),
              info: info.length ? info.map(function(i) {
                return '<span>' + i + '</span>';
              }).join('<span class="online-prestige-split">●</span>') : '',
              title: episode.name,
              quality: day > 0 ? txt : ''
            });
            var loader = html.find('.online-prestige__loader');
            var image = html.find('.online-prestige__img');
            var season = items[0] ? items[0].season : 1;
            html.find('.online-prestige__timeline').append(Lampa.Timeline.render(Lampa.Timeline.view(Lampa.Utils.hash([season, episode.episode_number, object.movie.original_title].join('')))));
            var img = html.find('img')[0];
            if (episode.still_path) {
              img.onerror = function() {
                img.src = './img/img_broken.svg';
              };
              img.onload = function() {
                image.addClass('online-prestige__img--loaded');
                loader.remove();
                image.append('<div class="online-prestige__episode-number">' + ('0' + episode.episode_number).slice(-2) + '</div>');
              };
              img.src = Lampa.TMDB.image('t/p/w300' + episode.still_path);
              images.push(img);
            } else {
              loader.remove();
              image.append('<div class="online-prestige__episode-number">' + ('0' + episode.episode_number).slice(-2) + '</div>');
            }
            html.on('hover:focus', function(e) {
              last = e.target;
              scroll.update($(e.target), true);
            });
            html.css('opacity', '0.5');
            scroll.append(html);
          });
        }
        if (scroll_to_element) {
          last = scroll_to_element[0];
        } else if (scroll_to_mark) {
          last = scroll_to_mark[0];
        }
        Lampa.Controller.enable('content');
      });
    };
    /**
     * Меню
     */
    this.contextMenu = function(params) {
      params.html.on('hover:long', function() {
        function show(extra) {
          var enabled = Lampa.Controller.enabled().name;
          var menu = [];
          if (Lampa.Platform.is('webos')) {
            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Webos',
              player: 'webos'
            });
          }
          if (Lampa.Platform.is('android')) {
            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Android',
              player: 'android'
            });
          }
          menu.push({
            title: Lampa.Lang.translate('player_lauch') + ' - Lampa',
            player: 'lampa'
          });
          menu.push({
            title: Lampa.Lang.translate('lampac_video'),
            separator: true
          });
          menu.push({
            title: Lampa.Lang.translate('torrent_parser_label_title'),
            mark: true
          });
          menu.push({
            title: Lampa.Lang.translate('torrent_parser_label_cancel_title'),
            unmark: true
          });
          menu.push({
            title: Lampa.Lang.translate('time_reset'),
            timeclear: true
          });
          if (extra) {
            menu.push({
              title: Lampa.Lang.translate('copy_link'),
              copylink: true
            });
          }
          if (window.lampac_online_context_menu)
            window.lampac_online_context_menu.push(menu, extra, params);
          menu.push({
            title: Lampa.Lang.translate('more'),
            separator: true
          });
          if (Lampa.Account.logged() && params.element && typeof params.element.season !== 'undefined' && params.element.translate_voice) {
            menu.push({
              title: Lampa.Lang.translate('lampac_voice_subscribe'),
              subscribe: true
            });
          }
          menu.push({
            title: Lampa.Lang.translate('lampac_clear_all_marks'),
            clearallmark: true
          });
          menu.push({
            title: Lampa.Lang.translate('lampac_clear_all_timecodes'),
            timeclearall: true
          });
          Lampa.Select.show({
            title: Lampa.Lang.translate('title_action'),
            items: menu,
            onBack: function onBack() {
              Lampa.Controller.toggle(enabled);
            },
            onSelect: function onSelect(a) {
              if (a.mark) params.element.mark();
              if (a.unmark) params.element.unmark();
              if (a.timeclear) params.element.timeclear();
              if (a.clearallmark) params.onClearAllMark();
              if (a.timeclearall) params.onClearAllTime();
              if (window.lampac_online_context_menu)
                window.lampac_online_context_menu.onSelect(a, params);
              Lampa.Controller.toggle(enabled);
              if (a.player) {
                Lampa.Player.runas(a.player);
                params.html.trigger('hover:enter');
              }
              if (a.copylink) {
                if (extra.quality) {
                  var qual = [];
                  for (var i in extra.quality) {
                    qual.push({
                      title: i,
                      file: extra.quality[i]
                    });
                  }
                  Lampa.Select.show({
                    title: Lampa.Lang.translate('settings_server_links'),
                    items: qual,
                    onBack: function onBack() {
                      Lampa.Controller.toggle(enabled);
                    },
                    onSelect: function onSelect(b) {
                      Lampa.Utils.copyTextToClipboard(b.file, function() {
                        Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                      }, function() {
                        Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                      });
                    }
                  });
                } else {
                  Lampa.Utils.copyTextToClipboard(extra.file, function() {
                    Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                  }, function() {
                    Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                  });
                }
              }
              if (a.subscribe) {
                Lampa.Account.subscribeToTranslation({
                  card: object.movie,
                  season: params.element.season,
                  episode: params.element.translate_episode_end,
                  voice: params.element.translate_voice
                }, function() {
                  Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_success'));
                }, function() {
                  Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_error'));
                });
              }
            }
          });
        }
        params.onFile(show);
      }).on('hover:focus', function() {
        if (Lampa.Helper) Lampa.Helper.show('online_file', Lampa.Lang.translate('helper_online_file'), params.html);
      });
    };
    /**
     * Показать пустой результат
     */
    this.empty = function() {
      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Lampa.Lang.translate('empty_title_two'));
      html.find('.online-empty__time').text(Lampa.Lang.translate('empty_text'));
      scroll.clear();
      scroll.append(html);
      this.loading(false);
    };
    this.noConnectToServer = function(er) {
      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Lampa.Lang.translate('title_error'));
      html.find('.online-empty__time').text(er && er.accsdb ? er.msg : Lampa.Lang.translate('lampac_does_not_answer_text').replace('{balanser}', (sources[balanser] ? sources[balanser].name : balanser) || ''));
      scroll.clear();
      scroll.append(html);
      this.loading(false);
    };
    this.doesNotAnswer = function(er) {
      var _this9 = this;
      this.reset();
      var html = Lampa.Template.get('lampac_does_not_answer', {
        balanser: balanser
      });
      if(er && er.accsdb) html.find('.online-empty__title').html(er.msg);
	  
      var tic = er && er.accsdb ? 10 : 5;
      html.find('.cancel').on('hover:enter', function() {
        clearInterval(balanser_timer);
      });
      html.find('.change').on('hover:enter', function() {
        clearInterval(balanser_timer);
        filter.render().find('.filter--sort').trigger('hover:enter');
      });
      scroll.clear();
      scroll.append(html);
      this.loading(false);
      balanser_timer = setInterval(function() {
        tic--;
        html.find('.timeout').text(tic);
        if (tic == 0) {
          clearInterval(balanser_timer);
          var keys = Lampa.Arrays.getKeys(sources);
          var indx = keys.indexOf(balanser);
          var next = keys[indx + 1];
          if (!next) next = keys[0];
          balanser = next;
          if (Lampa.Activity.active().activity == _this9.activity) _this9.changeBalanser(balanser);
        }
      }, 1000);
    };
    this.getLastEpisode = function(items) {
      var last_episode = 0;
      items.forEach(function(e) {
        if (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode));
      });
      return last_episode;
    };
    /**
     * Начать навигацию по файлам
     */
    this.start = function() {
      if (Lampa.Activity.active().activity !== this.activity) return;
      if (!initialized) {
        initialized = true;
        this.initialize();
      }
      Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(object.movie));
      Lampa.Controller.add('content', {
        toggle: function toggle() {
          Lampa.Controller.collectionSet(scroll.render(), files.render());
          Lampa.Controller.collectionFocus(last || false, scroll.render());
        },
        gone: function gone() {
          clearTimeout(balanser_timer);
        },
        up: function up() {
          if (Navigator.canmove('up')) {
            Navigator.move('up');
          } else Lampa.Controller.toggle('head');
        },
        down: function down() {
          Navigator.move('down');
        },
        right: function right() {
          if (Navigator.canmove('right')) Navigator.move('right');
          else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
        },
        left: function left() {
          if (Navigator.canmove('left')) Navigator.move('left');
          else Lampa.Controller.toggle('menu');
        },
        back: this.back.bind(this)
      });
      Lampa.Controller.toggle('content');
    };
    this.render = function() {
      return files.render();
    };
    this.back = function() {
      Lampa.Activity.backward();
    };
    this.pause = function() {};
    this.stop = function() {};
    this.destroy = function() {
      network.clear();
      this.clearImages();
      files.destroy();
      scroll.destroy();
      clearInterval(balanser_timer);
      clearTimeout(life_wait_timer);
    };
  }
  
  function addSourceSearch(spiderName, spiderUri) {
    var network = new Lampa.Reguest();

    var source = {
      title: spiderName,
      search: function(params, oncomplite) {
        function searchComplite(links) {
          var keys = Lampa.Arrays.getKeys(links);

          if (keys.length) {
            var status = new Lampa.Status(keys.length);

            status.onComplite = function(result) {
              var rows = [];

              keys.forEach(function(name) {
                var line = result[name];

                if (line && line.data && line.type == 'similar') {
                  var cards = line.data.map(function(item) {
                    item.title = Lampa.Utils.capitalizeFirstLetter(item.title);
                    item.release_date = item.year || '0000';
                    item.balanser = spiderUri;
                    if (item.img !== undefined) {
                      if (item.img.charAt(0) === '/')
                        item.img = Defined.localhost + item.img.substring(1);
                      if (item.img.indexOf('/proxyimg') !== -1)
                        item.img = account(item.img);
                    }

                    return item;
                  })

                  rows.push({
                    title: name,
                    results: cards
                  })
                }
              })

              oncomplite(rows);
            }

            keys.forEach(function(name) {
              network.silent(account(links[name]), function(data) {
                status.append(name, data);
              }, function() {
                status.error();
              }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  })
            })
          } else {
            oncomplite([]);
          }
        }

        network.silent(account(Defined.localhost + 'lite/' + spiderUri + '?title=' + params.query), function(json) {
          if (json.rch) {
            rchRun(json, function() {
              network.silent(account(Defined.localhost + 'lite/' + spiderUri + '?title=' + params.query), function(links) {
                searchComplite(links);
              }, function() {
                oncomplite([]);
              }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
            });
          } else {
            searchComplite(json);
          }
        }, function() {
          oncomplite([]);
        }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
      },
      onCancel: function() {
        network.clear()
      },
      params: {
        lazy: true,
        align_left: true,
        card_events: {
          onMenu: function() {}
        }
      },
      onMore: function(params, close) {
        close();
      },
      onSelect: function(params, close) {
        close();

        Lampa.Activity.push({
          url: params.element.url,
          title: 'Alpac - ' + params.element.title,
          component: 'alpac',
          movie: params.element,
          page: 1,
          search: params.element.title,
          clarification: true,
          balanser: params.element.balanser,
          noinfo: true
        });
      }
    }

    Lampa.Search.addSource(source)
  }

  function startPlugin() {
    window.lampac_plugin = true;
    var manifst = {
      type: 'video',
      version: '0.3d',
      name: 'Alpac',
      description: 'Плагин для просмотра онлайн сериалов и фильмов',
      component: 'alpac',
      onContextMenu: function onContextMenu(object) {
        return {
          name: Lampa.Lang.translate('lampac_watch'),
          description: ''
        };
      },
      onContextLauch: function onContextLauch(object) {
        resetTemplates();
        Lampa.Component.add('alpac', component);
		
		var id = Lampa.Utils.hash(object.number_of_seasons ? object.original_name : object.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
        Lampa.Activity.push({
          url: '',
          title: Lampa.Lang.translate('title_online'),
          component: 'alpac',
          search: all[id] ? all[id] : object.title,
          search_one: object.title,
          search_two: object.original_title,
          movie: object,
          page: 1,
		  clarification: all[id] ? true : false
        });
      }
    };
	addSourceSearch('Spider', 'spider');
	addSourceSearch('Anime', 'spider/anime');

	// YouTube search source — directly queries /lite/youtube and shows results
	(function(){
		var ytNet = new Lampa.Reguest();
		var ytSource = {
			title: 'YouTube',
			search: function(params, oncomplite){
				ytNet.silent(account(Defined.localhost + 'lite/youtube?title=' + params.query + '&rjson=true'), function(json){
					if(json && json.data && json.data.length){
						var cards = json.data.map(function(item){
							return {
								title: item.name || item.title,
								original_title: item.title,
								img: item.img || '',
								youtube: true,
								yt_call_url: item.url,
								balanser: 'youtube'
							};
						});
						oncomplite([{title:'YouTube', results: cards}]);
					} else {
						oncomplite([]);
					}
				}, function(){
					oncomplite([]);
				}, false, {headers:{'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey','')}});
			},
			onCancel: function(){ ytNet.clear(); },
			params: { lazy: true, align_left: true, card_events: { onMenu: function(){} } },
			onMore: function(params, close){ close(); },
			onSelect: function(params, close){
				close();
				var el = params.element;
				if(el.yt_call_url){
					// Fetch the stream URL and play directly
					ytNet.silent(account(el.yt_call_url + '&rjson=true'), function(json){
						if(json && json.data && json.data.length && json.data[0].stream){
							Lampa.Player.play({
								title: el.title || '',
								url: json.data[0].stream
							});
							Lampa.Player.playlist([{
								title: el.title || '',
								url: json.data[0].stream
							}]);
						} else {
							Lampa.Noty.show('YouTube: не удалось получить видео');
						}
					}, function(){
						Lampa.Noty.show('YouTube: ошибка загрузки');
					}, false, {headers:{'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey','')}});
				}
			}
		};
		Lampa.Search.addSource(ytSource);
	})();
    Lampa.Manifest.plugins = manifst;
    Lampa.Lang.add({
      lampac_watch: { //
        ru: 'Смотреть онлайн',
        en: 'Watch online',
        uk: 'Дивитися онлайн',
        zh: '在线观看'
      },
      lampac_video: { //
        ru: 'Видео',
        en: 'Video',
        uk: 'Відео',
        zh: '视频'
      },
      lampac_no_watch_history: {
        ru: 'Нет истории просмотра',
        en: 'No browsing history',
        ua: 'Немає історії перегляду',
        zh: '没有浏览历史'
      },
      lampac_nolink: {
        ru: 'Не удалось извлечь ссылку',
        uk: 'Неможливо отримати посилання',
        en: 'Failed to fetch link',
        zh: '获取链接失败'
      },
      lampac_balanser: { //
        ru: 'Источник',
        uk: 'Джерело',
        en: 'Source',
        zh: '来源'
      },
      helper_online_file: { //
        ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню',
        uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню',
        en: 'Hold the "OK" key to bring up the context menu',
        zh: '按住“确定”键调出上下文菜单'
      },
      title_online: { //
        ru: 'Онлайн',
        uk: 'Онлайн',
        en: 'Online',
        zh: '在线的'
      },
      lampac_voice_subscribe: { //
        ru: 'Подписаться на перевод',
        uk: 'Підписатися на переклад',
        en: 'Subscribe to translation',
        zh: '订阅翻译'
      },
      lampac_voice_success: { //
        ru: 'Вы успешно подписались',
        uk: 'Ви успішно підписалися',
        en: 'You have successfully subscribed',
        zh: '您已成功订阅'
      },
      lampac_voice_error: { //
        ru: 'Возникла ошибка',
        uk: 'Виникла помилка',
        en: 'An error has occurred',
        zh: '发生了错误'
      },
      lampac_clear_all_marks: { //
        ru: 'Очистить все метки',
        uk: 'Очистити всі мітки',
        en: 'Clear all labels',
        zh: '清除所有标签'
      },
      lampac_clear_all_timecodes: { //
        ru: 'Очистить все тайм-коды',
        uk: 'Очистити всі тайм-коди',
        en: 'Clear all timecodes',
        zh: '清除所有时间代码'
      },
      lampac_change_balanser: { //
        ru: 'Изменить балансер',
        uk: 'Змінити балансер',
        en: 'Change balancer',
        zh: '更改平衡器'
      },
      lampac_balanser_dont_work: { //
        ru: 'Поиск на ({balanser}) не дал результатов',
        uk: 'Пошук на ({balanser}) не дав результатів',
        en: 'Search on ({balanser}) did not return any results',
        zh: '搜索 ({balanser}) 未返回任何结果'
      },
      lampac_balanser_timeout: { //
        ru: 'Источник будет переключен автоматически через <span class="timeout">10</span> секунд.',
        uk: 'Джерело буде автоматично переключено через <span class="timeout">10</span> секунд.',
        en: 'The source will be switched automatically after <span class="timeout">10</span> seconds.',
        zh: '平衡器将在<span class="timeout">10</span>秒内自动切换。'
      },
      lampac_does_not_answer_text: {
        ru: 'Поиск на ({balanser}) не дал результатов',
        uk: 'Пошук на ({balanser}) не дав результатів',
        en: 'Search on ({balanser}) did not return any results',
        zh: '搜索 ({balanser}) 未返回任何结果'
      }
    });
    Lampa.Template.add('lampac_css', "\n        <style>\n        @charset 'UTF-8';.online-prestige{position:relative;-webkit-border-radius:.3em;border-radius:.3em;background-color:rgba(0,0,0,0.3);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;position:relative}@media screen and (max-width:480px){.online-prestige__body{padding:.8em 1.2em}}.online-prestige__img{position:relative;width:13em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;min-height:8.2em}.online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;-webkit-border-radius:.3em;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;-o-transition:opacity .3s;-moz-transition:opacity .3s;transition:opacity .3s}.online-prestige__img--loaded>img{opacity:1}@media screen and (max-width:480px){.online-prestige__img{width:7em;min-height:6em}}.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige__folder>svg{width:4.4em !important;height:4.4em !important}.online-prestige__viewed{position:absolute;top:1em;left:1em;background:rgba(0,0,0,0.45);-webkit-border-radius:100%;border-radius:100%;padding:.25em;font-size:.76em}.online-prestige__viewed>svg{width:1.5em !important;height:1.5em !important}.online-prestige__episode-number{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;font-size:2em}.online-prestige__loader{position:absolute;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) no-repeat center center;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__timeline{margin:.8em 0}.online-prestige__timeline>.time-line{display:block !important}.online-prestige__title{font-size:1.7em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}@media screen and (max-width:480px){.online-prestige__title{font-size:1.4em}}.online-prestige__time{padding-left:2em}.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__info>*{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.online-prestige__quality{padding-left:1em;white-space:nowrap}.online-prestige__scan-file{position:absolute;bottom:0;left:0;right:0}.online-prestige__scan-file .broadcast__scan{margin:0}.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige.focus::after{content:'';position:absolute;top:-0.6em;left:-0.6em;right:-0.6em;bottom:-0.6em;-webkit-border-radius:.7em;border-radius:.7em;border:solid .3em #fff;z-index:-1;pointer-events:none}.online-prestige+.online-prestige{margin-top:1.5em}.online-prestige--folder .online-prestige__footer{margin-top:.8em}.online-prestige-watched{padding:1em}.online-prestige-watched__icon>svg{width:1.5em;height:1.5em}.online-prestige-watched__body{padding-left:1em;padding-top:.1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.online-prestige-watched__body>span+span::before{content:' ● ';vertical-align:top;display:inline-block;margin:0 .5em}.online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige-rate>svg{width:1.3em !important;height:1.3em !important}.online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}.online-empty{line-height:1.4}.online-empty__title{font-size:1.8em;margin-bottom:.3em}.online-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em}.online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-empty__buttons>*+*{margin-left:1em}.online-empty__button{background:rgba(0,0,0,0.3);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.2em;border-radius:.2em;margin-bottom:2.4em}.online-empty__button.focus{background:#fff;color:black}.online-empty__templates .online-empty-template:nth-child(2){opacity:.5}.online-empty__templates .online-empty-template:nth-child(3){opacity:.2}.online-empty-template{background-color:rgba(255,255,255,0.3);padding:1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template>*{background:rgba(0,0,0,0.3);-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template__ico{width:4em;height:4em;margin-right:2.4em}.online-empty-template__body{height:1.7em;width:70%}.online-empty-template+.online-empty-template{margin-top:1em}\n        </style>\n    ");
    $('body').append(Lampa.Template.get('lampac_css', {}, true));

    function resetTemplates() {
      Lampa.Template.add('lampac_prestige_full', "<div class=\"online-prestige online-prestige--full selector\">\n            <div class=\"online-prestige__img\">\n                <img alt=\"\">\n                <div class=\"online-prestige__loader\"></div>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__timeline\"></div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                    <div class=\"online-prestige__quality\">{quality}</div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_content_loading', "<div class=\"online-empty\">\n            <div class=\"broadcast__scan\"><div></div></div>\n\t\t\t\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template selector\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_does_not_answer', "<div class=\"online-empty\">\n            <div class=\"online-empty__title\">\n                #{lampac_balanser_dont_work}\n            </div>\n            <div class=\"online-empty__time\">\n                #{lampac_balanser_timeout}\n            </div>\n            <div class=\"online-empty__buttons\">\n                <div class=\"online-empty__button selector cancel\">#{cancel}</div>\n                <div class=\"online-empty__button selector change\">#{lampac_change_balanser}</div>\n            </div>\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_prestige_rate', "<div class=\"online-prestige-rate\">\n            <svg width=\"17\" height=\"16\" viewBox=\"0 0 17 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M8.39409 0.192139L10.99 5.30994L16.7882 6.20387L12.5475 10.4277L13.5819 15.9311L8.39409 13.2425L3.20626 15.9311L4.24065 10.4277L0 6.20387L5.79819 5.30994L8.39409 0.192139Z\" fill=\"#fff\"></path>\n            </svg>\n            <span>{rate}</span>\n        </div>");
      Lampa.Template.add('lampac_prestige_folder', "<div class=\"online-prestige online-prestige--folder selector\">\n            <div class=\"online-prestige__folder\">\n                <svg viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"></rect>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"></path>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"></rect>\n                </svg>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_prestige_watched', "<div class=\"online-prestige online-prestige-watched selector\">\n            <div class=\"online-prestige-watched__icon\">\n                <svg width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <circle cx=\"10.5\" cy=\"10.5\" r=\"9\" stroke=\"currentColor\" stroke-width=\"3\"/>\n                    <path d=\"M14.8477 10.5628L8.20312 14.399L8.20313 6.72656L14.8477 10.5628Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"online-prestige-watched__body\">\n                \n            </div>\n        </div>");
    }
    var button = `<div class=\"full-start__button selector view--alpac alpac--button\" data-subtitle=\"".concat(manifst.name, " v").concat(manifst.version, "\">\n        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="281" height="281" viewBox="0 0 281 281">
<path d="M0 0 C0.67975891 0.00182281 1.35951782 0.00364563 2.05987549 0.00552368 C12.61226758 0.05307093 22.50630033 0.67413314 32.75 3.3125 C33.41499512 3.47347168 34.07999023 3.63444336 34.76513672 3.80029297 C51.55284956 7.91326286 67.92253584 14.86879595 81.75 25.3125 C82.58273438 25.93640625 83.41546875 26.5603125 84.2734375 27.203125 C115.47120589 51.4133806 135.73924972 84.96239583 140.75 124.3125 C140.98977043 129.60125437 140.99569557 134.89385694 141 140.1875 C141.00067474 140.92926483 141.00134949 141.67102966 141.00204468 142.43527222 C140.98624328 153.35167509 140.58945518 163.71034073 137.75 174.3125 C137.58371094 174.9528418 137.41742188 175.59318359 137.24609375 176.25292969 C131.69720636 197.18456602 121.82211133 215.87692595 107.75 232.3125 C106.68652344 233.55966797 106.68652344 233.55966797 105.6015625 234.83203125 C96.75917035 244.93097387 86.9390794 252.98747535 75.75 260.3125 C74.51830078 261.13041016 74.51830078 261.13041016 73.26171875 261.96484375 C62.64544489 268.69145761 51.08269113 273.14019565 39.0625 276.625 C38.23258545 276.86734375 37.4026709 277.1096875 36.54760742 277.359375 C24.59988123 280.66786826 12.86995609 281.67853966 0.5 281.625 C-0.18075592 281.62284485 -0.86151184 281.6206897 -1.56289673 281.61846924 C-12.09735946 281.56506454 -22.038732 281.02494422 -32.25 278.3125 C-33.03342773 278.11382324 -33.81685547 277.91514648 -34.62402344 277.71044922 C-46.59669723 274.61885937 -57.49653832 270.41199503 -68.25 264.3125 C-69.13341064 263.81314941 -69.13341064 263.81314941 -70.03466797 263.30371094 C-77.64772263 258.93937644 -84.61419872 254.04575026 -91.25 248.3125 C-92.21808594 247.47847656 -93.18617187 246.64445313 -94.18359375 245.78515625 C-119.98366244 223.09760785 -135.92729382 191.25930023 -140.25 157.3125 C-140.48977043 152.02374563 -140.49569557 146.73114306 -140.5 141.4375 C-140.50067474 140.69573517 -140.50134949 139.95397034 -140.50204468 139.18972778 C-140.48624328 128.27332491 -140.08945518 117.91465927 -137.25 107.3125 C-137.08371094 106.6721582 -136.91742188 106.03181641 -136.74609375 105.37207031 C-131.20798199 84.48108205 -121.35789321 65.67765612 -107.25 49.3125 C-106.00089844 47.86230469 -106.00089844 47.86230469 -104.7265625 46.3828125 C-78.14847336 16.15627658 -40.08205531 -0.1710366 0 0 Z " fill="#13428E" transform="translate(140.25,-0.3125)"/>
<path d="M0 0 C1 3 1 3 0.171875 5.3125 C-5.69710966 16.40552596 -13.93380272 24.33503743 -24.78515625 30.5625 C-27.25995617 31.96098988 -27.25995617 31.96098988 -29 35 C-29.17718681 37.09148548 -29.17718681 37.09148548 -28 39 C-25.14370003 40.55964255 -25.14370003 40.55964255 -21.6875 41.6875 C-20.53636719 42.10386719 -19.38523437 42.52023438 -18.19921875 42.94921875 C-15.80191596 43.73661124 -13.45865063 44.44756245 -11 45 C-11 46.32 -11 47.64 -11 49 C-9.9275 48.67 -8.855 48.34 -7.75 48 C-4 47 -4 47 0 47 C-0.08378906 47.68707031 -0.16757813 48.37414062 -0.25390625 49.08203125 C-0.35574219 49.98308594 -0.45757812 50.88414063 -0.5625 51.8125 C-0.66691406 52.70582031 -0.77132812 53.59914062 -0.87890625 54.51953125 C-1.15658709 57.13375572 -1.15658709 57.13375572 0 60 C0.99 60.33 1.98 60.66 3 61 C2.938125 62.11375 2.87625 63.2275 2.8125 64.375 C2.874375 65.57125 2.93625 66.7675 3 68 C3.99 68.66 4.98 69.32 6 70 C7.06246527 71.96752828 8.07137808 73.96587579 9 76 C7.35 76 5.7 76 4 76 C4 76.99 4 77.98 4 79 C4.66 79 5.32 79 6 79 C5.91621094 79.69867188 5.83242187 80.39734375 5.74609375 81.1171875 C5.64425781 82.02726562 5.54242188 82.93734375 5.4375 83.875 C5.33308594 84.77992187 5.22867188 85.68484375 5.12109375 86.6171875 C4.80325148 89.01653057 4.80325148 89.01653057 6 91 C6.28237651 93.32332299 6.51288882 95.65302617 6.71875 97.984375 C6.78155151 98.6775885 6.84435303 99.370802 6.90905762 100.08502197 C7.1098571 102.30635842 7.30530913 104.52812046 7.5 106.75 C7.69529301 108.9575343 7.89179094 111.16494167 8.09094238 113.37213135 C8.2723451 115.38553856 8.44975238 117.39930456 8.62695312 119.41308594 C8.96288158 122.6430996 9.43572075 125.80338117 10 129 C10.60966069 133.80800588 11.15002151 138.11926776 8.54296875 142.3828125 C6.78408818 144.3897878 4.974723 146.20710374 3 148 C0.67931615 150.13046386 0.03443198 150.89670407 -1 154 C-8.00878222 158.31309675 -16.02831113 160.30972786 -24 162 C-24.77190674 162.17490967 -25.54381348 162.34981934 -26.33911133 162.5300293 C-29.05610908 163.00991008 -31.54413658 163.11377698 -34.30078125 163.09765625 C-35.27724609 163.09443359 -36.25371094 163.09121094 -37.25976562 163.08789062 C-38.26716797 163.07951172 -39.27457031 163.07113281 -40.3125 163.0625 C-41.33923828 163.05798828 -42.36597656 163.05347656 -43.42382812 163.04882812 C-45.94927882 163.03708184 -48.47460905 163.02065565 -51 163 C-51 162.34 -51 161.68 -51 161 C-50.42894531 160.91363281 -49.85789062 160.82726562 -49.26953125 160.73828125 C-32.8366675 157.89061488 -18.86728811 150.58412072 -7 139 C-9.88704205 139.89962642 -9.88704205 139.89962642 -12.09375 140.97265625 C-19.33214915 144.25108703 -25.94020494 145.60522738 -33.671875 143.15234375 C-39.90754814 140.36518682 -43.93689402 136.4219593 -48 131 C-48.54269531 131.34933594 -49.08539063 131.69867188 -49.64453125 132.05859375 C-50.35996094 132.51363281 -51.07539062 132.96867188 -51.8125 133.4375 C-52.52019531 133.88996094 -53.22789063 134.34242188 -53.95703125 134.80859375 C-59.25604766 137.89884233 -65.05597662 137.6358035 -71 137 C-78.84458847 134.45645162 -83.46327553 128.91006668 -87.15234375 121.76953125 C-88.2862802 118.06464211 -88.21401378 114.51851611 -88.125 110.6875 C-88.11597656 109.94693359 -88.10695312 109.20636719 -88.09765625 108.44335938 C-88.07424213 106.62876533 -88.03837615 104.81433929 -88 103 C-88.94166016 102.79503906 -88.94166016 102.79503906 -89.90234375 102.5859375 C-92.41997592 101.88268829 -93.28566061 100.93794888 -95 99 C-96.67385457 97.25919124 -97.83058138 96.08470931 -100 95 C-102.42659021 107.37163206 -102.83484382 121.0243384 -96 132 C-90.06188702 140.47925668 -82.02152481 146.27916833 -72 149 C-69.36353409 149.23717162 -66.88258489 149.38067164 -64.25 149.375 C-63.54915283 149.37483887 -62.84830566 149.37467773 -62.1262207 149.37451172 C-54.7958025 149.21429321 -49.07970302 147.05313535 -43 143 C-44.71456916 148.65807823 -48.11418338 153.33452871 -53.25390625 156.30078125 C-61.63686697 160.09866296 -71.17565263 162.04522344 -80.125 158.8125 C-81.42563297 158.22788559 -82.71706337 157.62248996 -84 157 C-85.15048828 156.52433594 -85.15048828 156.52433594 -86.32421875 156.0390625 C-98.56299228 150.62095553 -107.29332127 141.21440825 -112.24609375 128.90234375 C-114.80710049 121.46744875 -115.65709519 114.82155239 -115 107 C-114.94070312 106.13117188 -114.88140625 105.26234375 -114.8203125 104.3671875 C-113.53426712 93.85925576 -107.86694879 82.97551452 -101 75 C-101.99 75 -102.98 75 -104 75 C-104 73.68 -104 72.36 -104 71 C-103.34 71 -102.68 71 -102 71 C-102 70.34 -102 69.68 -102 69 C-102.66 69 -103.32 69 -104 69 C-104.33 68.01 -104.66 67.02 -105 66 C-103.10955296 63.89950329 -101.35917537 62.59458034 -98.9375 61.0625 C-96.14062571 59.0987372 -95.12098353 58.13875387 -94 55 C-93.01 55 -92.02 55 -91 55 C-91.33 54.34 -91.66 53.68 -92 53 C-97.48566121 53.34285383 -100.90066339 56.69617822 -105 60 C-105.99 60.721875 -106.98 61.44375 -108 62.1875 C-118.14459275 70.84348403 -126.18768512 85.81952816 -128 99 C-128.90582042 111.15615919 -128.92077295 122.67900602 -124 134 C-123.43925781 135.3303125 -123.43925781 135.3303125 -122.8671875 136.6875 C-115.75326152 152.14026637 -103.53166695 162.57069355 -88 169 C-84.36752663 170.23349907 -80.75841264 171.23657243 -77 172 C-75.69095703 172.27457031 -75.69095703 172.27457031 -74.35546875 172.5546875 C-44.90088146 176.46367813 -13.85937943 169.13365601 10.4375 152 C11.283125 151.34 12.12875 150.68 13 150 C5.07268531 166.70266769 -11.950891 178.8486985 -29 185 C-50.61899256 192.61338678 -75.36935406 192.99697856 -96.45214844 183.26269531 C-103.84407255 179.60727075 -110.55014433 175.14259849 -117 170 C-117.8353125 169.36320313 -118.670625 168.72640625 -119.53125 168.0703125 C-133.20063797 156.60705993 -141.96337064 138.37644785 -145 121 C-146.65660333 97.29572005 -142.10178462 77.26867754 -127.125 58.5 C-110.71821556 39.96312299 -88.56242715 29.23345744 -64 27 C-61.73382783 26.90654702 -59.46922779 26.85833121 -57.20166016 26.8112793 C-49.0968672 26.60340039 -42.52679109 25.65745455 -35.03515625 22.3046875 C-31.90586714 20.9595362 -28.86106109 20.14607139 -25.5625 19.3125 C-20.20863035 17.71219388 -16.02241108 15.38115836 -11.5 12.1875 C-10.92451416 11.7850708 -10.34902832 11.3826416 -9.75610352 10.96801758 C-5.55823488 7.84288964 -2.87713157 4.3640074 0 0 Z " fill="#FBF7DC" transform="translate(174,40)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C0.74913936 5.17802095 -0.15640015 7.77969351 -3.99804688 11.33007812 C-4.77245117 12.00200195 -4.77245117 12.00200195 -5.5625 12.6875 C-7.49917927 14.39859333 -9.23206172 16.09808288 -11 18 C-11 19.32 -11 20.64 -11 22 C-3.82337263 22.69451233 -0.13523234 21.41937028 5.8359375 17.41015625 C8 16 8 16 11 15 C11 14.34 11 13.68 11 13 C13 11.375 13 11.375 15 10 C15.99 10.495 15.99 10.495 17 11 C16.4225 11.66 15.845 12.32 15.25 13 C10.95552103 18.72597196 8.13192104 23.62132885 9 31 C9.99 32.485 9.99 32.485 11 34 C13.66653905 34.36460453 13.66653905 34.36460453 16.625 34.1875 C17.62789062 34.16042969 18.63078125 34.13335937 19.6640625 34.10546875 C20.82035156 34.05326172 20.82035156 34.05326172 22 34 C21.01 35.32 20.02 36.64 19 38 C19.99 37.67 20.98 37.34 22 37 C21 39 20 41 19 43 C21.92602589 41.86210104 23.634659 40.7122171 25.08203125 37.890625 C25.75056539 36.17534219 26.39551138 34.45072351 27.01953125 32.71875 C27.98507252 30.04139253 29.08031412 27.46882974 30.25 24.875 C30.58515625 24.12992188 30.9203125 23.38484375 31.265625 22.6171875 C31.62914062 21.81667969 31.62914062 21.81667969 32 21 C33.09898702 24.29696105 32.87124444 25.40494903 32.0625 28.6875 C31.77052734 29.89986328 31.77052734 29.89986328 31.47265625 31.13671875 C31.23869141 32.05904297 31.23869141 32.05904297 31 33 C32.299375 32.979375 33.59875 32.95875 34.9375 32.9375 C36.29165633 32.91600546 37.64756083 32.92851801 39 33 C40 34 40 34 40.25 36.875 C40 40 40 40 38.8125 41.875 C36.43963721 43.34781139 34.74086056 43.22223194 32 43 C31.67 42.01 31.34 41.02 31 40 C30.34 40 29.68 40 29 40 C29.33 40.639375 29.66 41.27875 30 41.9375 C31 44 31 44 31 45 C32.27875 44.95875 33.5575 44.9175 34.875 44.875 C40.08872856 44.85842217 44.94007672 45.81688642 50 47 C50 46.01 50 45.02 50 44 C51.32 44 52.64 44 54 44 C55 47 56 50 57 53 C58.65 53.33 60.3 53.66 62 54 C62 55.32 62 56.64 62 58 C65.3 58 68.6 58 72 58 C72 58.66 72 59.32 72 60 C71.34 60 70.68 60 70 60 C70.99 61.98 71.98 63.96 73 66 C72.34 66 71.68 66 71 66 C70.67 66.99 70.34 67.98 70 69 C56.73410125 75.62931189 39.93025813 75.28858612 25.5 75.3125 C24.80420837 75.31599457 24.10841675 75.31948914 23.39154053 75.3230896 C11.53424541 75.35616361 11.53424541 75.35616361 8 73 C18.395 72.505 18.395 72.505 29 72 C29 71.67 29 71.34 29 71 C31.31 71 33.62 71 36 71 C36 71.66 36 72.32 36 73 C38.85432471 72.68889371 41.70845525 72.37615574 44.5625 72.0625 C45.36236328 71.97548828 46.16222656 71.88847656 46.98632812 71.79882812 C51.67256697 71.28238548 56.33680546 70.69478469 61 70 C60.01 65.545 60.01 65.545 59 61 C62.75519057 61.51207144 65.66688525 62.2175082 69 64 C68.45730469 63.71125 67.91460937 63.4225 67.35546875 63.125 C66.64003906 62.75375 65.92460937 62.3825 65.1875 62 C64.47980469 61.62875 63.77210938 61.2575 63.04296875 60.875 C60.91079271 59.80314642 60.91079271 59.80314642 58 60 C56.6459068 58.01399663 55.31542376 56.01182457 54 54 C47.69908554 48.18377127 41.90296676 47.44629314 33.52734375 47.54296875 C27.69523026 48.29862465 23.47333274 51.18208393 19.62963867 55.5612793 C16.8246698 58.03763608 13.09267758 57.73308814 9.5 58 C-0.97188518 58.95990395 -0.97188518 58.95990395 -11 62 C-11.33 62.66 -11.66 63.32 -12 64 C-11.21625 63.54625 -10.4325 63.0925 -9.625 62.625 C-1.30273565 58.89432978 6.99235458 58.72141303 16 59 C15.67 60.32 15.34 61.64 15 63 C13.80375 62.814375 12.6075 62.62875 11.375 62.4375 C9.15595247 62.29954741 9.15595247 62.29954741 7 63 C4.46833125 65.71704199 2.71795977 68.72025861 1 72 C2.98 72 4.96 72 7 72 C7 72.33 7 72.66 7 73 C-1.24003056 73.29428681 -7.73073463 72.07788057 -15 68 C-15.33 67.67 -15.66 67.34 -16 67 C-14.78250789 78.82248921 -13.28960433 90.59866907 -11.67285156 102.37304688 C-10.61635575 110.13607803 -9.65447731 117.90298686 -8.76953125 125.6875 C-8.45107116 128.42971153 -8.13122428 131.17175788 -7.8109436 133.91375732 C-7.60449394 135.71387524 -7.40422462 137.51471325 -7.21029663 139.31622314 C-6.93696063 141.85087881 -6.64244726 144.38228855 -6.34375 146.9140625 C-6.22970573 148.05270752 -6.22970573 148.05270752 -6.11335754 149.21435547 C-5.69563522 152.59692756 -5.23232929 154.7073293 -3.09179688 157.40380859 C3.85534936 162.70498064 11.53656826 164.32054842 20.12109375 164.1953125 C20.86585464 164.1924826 21.61061554 164.18965271 22.37794495 164.18673706 C24.73130101 164.17563917 27.08426109 164.1505551 29.4375 164.125 C31.04361425 164.11495672 32.64973454 164.10583324 34.25585938 164.09765625 C38.17072296 164.07573407 42.0852946 164.04127761 46 164 C37.57137291 174.07720153 27.95255226 181.82981982 17 189 C16.17886719 189.54527344 15.35773438 190.09054687 14.51171875 190.65234375 C3.89544489 197.37895761 -7.66730887 201.82769565 -19.6875 205.3125 C-20.51741455 205.55484375 -21.3473291 205.7971875 -22.20239258 206.046875 C-34.15011877 209.35536826 -45.88004391 210.36603966 -58.25 210.3125 C-58.93075592 210.31034485 -59.61151184 210.3081897 -60.31289673 210.30596924 C-70.84735946 210.25256454 -80.788732 209.71244422 -91 207 C-91.78342773 206.80132324 -92.56685547 206.60264648 -93.37402344 206.39794922 C-105.34669723 203.30635937 -116.24653832 199.09949503 -127 193 C-127.58894043 192.66709961 -128.17788086 192.33419922 -128.78466797 191.99121094 C-136.39792183 187.62676224 -143.34748837 182.71283101 -150 177 C-150.93714844 176.19691406 -151.87429687 175.39382812 -152.83984375 174.56640625 C-158.05327951 169.99642399 -158.05327951 169.99642399 -160 168 C-160 167.34 -160 166.68 -160 166 C-157.03 165.01 -157.03 165.01 -154 164 C-154 163.34 -154 162.68 -154 162 C-151.36 161.67 -148.72 161.34 -146 161 C-146 160.01 -146 159.02 -146 158 C-144.68 158 -143.36 158 -142 158 C-142 157.34 -142 156.68 -142 156 C-142.99 156.33 -143.98 156.66 -145 157 C-145.33 156.34 -145.66 155.68 -146 155 C-143.29120665 153.64560332 -140.99066732 153.93498549 -138 154 C-138 153.34 -138 152.68 -138 152 C-140.64 152.33 -143.28 152.66 -146 153 C-146.33 148.05 -146.66 143.1 -147 138 C-147.99 137.67 -148.98 137.34 -150 137 C-150 136.34 -150 135.68 -150 135 C-145.74153409 135.10646165 -143.59854196 136.13879185 -140.625 139 C-123.90588003 154.50434644 -100.99684222 158.80816425 -78.93359375 158.37109375 C-56.52970476 157.35454397 -35.38763134 146.19122625 -19.94921875 130.25390625 C-17.17121356 127.04166378 -15.08334089 123.69624997 -13 120 C-13.62003906 120.49628906 -14.24007812 120.99257812 -14.87890625 121.50390625 C-38.02934492 139.26268526 -67.32688127 144.96787205 -96 143 C-100.50976555 142.38624492 -104.67898101 141.4119386 -109 140 C-109.93585938 139.7215625 -110.87171875 139.443125 -111.8359375 139.15625 C-128.84284879 133.63019479 -140.8543981 121.67040735 -149 106 C-155.37950027 91.33639503 -156.93448195 73.02310069 -151.24609375 57.8671875 C-150.83488281 56.92101562 -150.42367187 55.97484375 -150 55 C-149.59910156 54.01257813 -149.19820312 53.02515625 -148.78515625 52.0078125 C-143.29122308 39.74599065 -133.82838486 28.55904207 -122 22 C-119.1796875 21.296875 -119.1796875 21.296875 -117 21 C-116.505 22.485 -116.505 22.485 -116 24 C-116.99 24.33 -117.98 24.66 -119 25 C-119.45375 25.78375 -119.9075 26.5675 -120.375 27.375 C-122.23677166 30.3824773 -123.85110315 31.46592205 -127 33 C-127.66 33 -128.32 33 -129 33 C-129 34.65 -129 36.3 -129 38 C-128.34 38 -127.68 38 -127 38 C-127 38.66 -127 39.32 -127 40 C-127.66 40 -128.32 40 -129 40 C-129 41.32 -129 42.64 -129 44 C-128.01 44 -127.02 44 -126 44 C-127.43480559 46.99942692 -129.09185308 49.75843218 -130.875 52.5625 C-135.23505005 59.79016244 -138.40474296 67.51758725 -139 76 C-139.07476562 76.84691406 -139.14953125 77.69382812 -139.2265625 78.56640625 C-139.87182848 91.31889975 -135.374537 103.39906637 -127 113 C-119.80988218 120.7815128 -108.79059436 127.18049759 -98.140625 128.30078125 C-90.10753221 128.33334784 -82.2407324 127.76141729 -75.625 122.75 C-72.66461688 119.64864626 -70.93998632 116.80535778 -69 113 C-69.53109375 113.34933594 -70.0621875 113.69867188 -70.609375 114.05859375 C-71.31578125 114.51363281 -72.0221875 114.96867187 -72.75 115.4375 C-73.44609375 115.88996094 -74.1421875 116.34242188 -74.859375 116.80859375 C-81.99393171 120.77946929 -92.56757276 120.01847097 -100.33203125 118.234375 C-110.66485369 114.38834411 -118.63427537 107.37759177 -123.625 97.5625 C-126.46932369 91.25730847 -127.18234857 86.51314731 -127.1875 79.6875 C-127.19974609 78.84509766 -127.21199219 78.00269531 -127.22460938 77.13476562 C-127.23583755 72.3478189 -126.856112 68.49721999 -125 64 C-122.5625 64.75 -122.5625 64.75 -120 66 C-119.1875 68.125 -119.1875 68.125 -119 70 C-116.69 70.33 -114.38 70.66 -112 71 C-112.04640625 72.134375 -112.0928125 73.26875 -112.140625 74.4375 C-112.4293321 84.41504052 -112.3938051 90.77493447 -105.6875 98.75 C-99.33144036 104.07135225 -95.26075407 105.66936667 -86.9453125 105.3984375 C-81.42155259 104.65119146 -77.54816608 102.03211072 -73 99 C-72.52691406 99.60328125 -72.05382812 100.2065625 -71.56640625 100.828125 C-66.26596091 107.23412132 -61.74050783 111.10088432 -53.40625 112.40625 C-45.03058058 112.88761031 -38.34655398 109.67327699 -31 106 C-35.86004975 117.1509771 -49.73912421 123.01860233 -60.38671875 127.390625 C-65.74035975 129.29832142 -70.31710103 130.51662718 -76 130 C-76 130.66 -76 131.32 -76 132 C-57.99917787 131.557437 -42.38524965 130.19262483 -26 122 C-25.87625 121.39414063 -25.7525 120.78828125 -25.625 120.1640625 C-24.78600246 117.2590335 -23.32685843 116.26141737 -21 114.375 C-18.04427685 112.05444701 -18.04427685 112.05444701 -16 109 C-15.46127614 101.20774422 -16.41105309 93.57611104 -17.5 85.875 C-18.48281785 78.87131605 -19.38315103 72.08119862 -19 65 C-17.125 62.75 -17.125 62.75 -15 61 C-14.65195312 59.93265625 -14.65195312 59.93265625 -14.296875 58.84375 C-12.08061129 53.98399101 -7.9954457 50.59730617 -4.23046875 46.87890625 C0.16218836 42.37480753 5 36.64688427 5 30 C4.67128906 30.45890625 4.34257812 30.9178125 4.00390625 31.390625 C0.11707667 36.40452982 -3.87934026 39.20831597 -10 41 C-11.32 41 -12.64 41 -14 41 C-14.99 38.525 -14.99 38.525 -16 36 C-17.32 36 -18.64 36 -20 36 C-20 35.34 -20 34.68 -20 34 C-15.38 32.35 -10.76 30.7 -6 29 C-6 28.34 -6 27.68 -6 27 C-6.69867188 26.87882812 -7.39734375 26.75765625 -8.1171875 26.6328125 C-9.02726563 26.46523437 -9.93734375 26.29765625 -10.875 26.125 C-11.77992188 25.96257812 -12.68484375 25.80015625 -13.6171875 25.6328125 C-16 25 -16 25 -18 23 C-18.06316957 19.86859396 -17.66716474 17.8085825 -15.64550781 15.35839844 C-13.85801265 13.6263454 -12.01741548 11.9916743 -10.125 10.375 C-8.85416731 9.26077498 -7.58585517 8.14366734 -6.3203125 7.0234375 C-5.73282227 6.50491211 -5.14533203 5.98638672 -4.54003906 5.45214844 C-2.77944185 3.79202919 -1.38248366 1.98188217 0 0 Z " fill="#080827" transform="translate(199,71)"/>
<path d="M0 0 C0.67975891 0.00182281 1.35951782 0.00364563 2.05987549 0.00552368 C12.61226758 0.05307093 22.50630033 0.67413314 32.75 3.3125 C33.41499512 3.47347168 34.07999023 3.63444336 34.76513672 3.80029297 C43.72309834 5.99498302 52.13289864 9.1429266 60.5625 12.875 C61.41690674 13.25092285 62.27131348 13.6268457 63.15161133 14.01416016 C67.37119797 15.94953259 70.72723114 17.6603327 73.75 21.3125 C72.43 21.3125 71.11 21.3125 69.75 21.3125 C69.42 22.3025 69.09 23.2925 68.75 24.3125 C67.1 24.6425 65.45 24.9725 63.75 25.3125 C63.75 23.9925 63.75 22.6725 63.75 21.3125 C58.5286608 22.93669504 58.5286608 22.93669504 55.3125 27 C55.126875 27.763125 54.94125 28.52625 54.75 29.3125 C53.76 29.3125 52.77 29.3125 51.75 29.3125 C51.75 30.3025 51.75 31.2925 51.75 32.3125 C48.78 32.8075 48.78 32.8075 45.75 33.3125 C45.75 32.3225 45.75 31.3325 45.75 30.3125 C44.76 29.9825 43.77 29.6525 42.75 29.3125 C42.75 28.6525 42.75 27.9925 42.75 27.3125 C42.09 27.3125 41.43 27.3125 40.75 27.3125 C38.96694476 24.67357824 37.75940379 22.34071137 36.75 19.3125 C34.73491642 18.57926204 34.73491642 18.57926204 32.75 18.3125 C32.83378906 18.88097656 32.91757813 19.44945313 33.00390625 20.03515625 C34.11373771 28.45020744 33.29892384 34.12226554 28.75 41.3125 C28.09 41.3125 27.43 41.3125 26.75 41.3125 C26.49605469 41.9003125 26.24210938 42.488125 25.98046875 43.09375 C22.0999544 50.09099493 13.93492079 54.53168264 6.8125 57.5625 C2.95198186 58.50793301 -0.27929337 58.51440034 -4.25 58.3125 C-5.25 57.3125 -5.25 57.3125 -5.5625 54.5 C-5.25 51.3125 -5.25 51.3125 -3.8125 49.25 C-0.7655919 46.94624021 2.43104578 45.20472852 5.82421875 43.4609375 C7.9029581 42.4558689 7.9029581 42.4558689 8.75 40.3125 C3.40560409 41.60433558 -1.92676068 42.93607374 -7.25 44.3125 C-8.18070313 44.55097656 -9.11140625 44.78945313 -10.0703125 45.03515625 C-14.97873807 46.46321735 -18.16738787 48.53719602 -21.83984375 52.10546875 C-23.25 53.3125 -23.25 53.3125 -25.25 53.3125 C-25.25 53.9725 -25.25 54.6325 -25.25 55.3125 C-30.57612027 59.3704964 -35.25308443 61.22303068 -41.875 61.625 C-48.2285324 62.16003431 -53.5112199 64.67932154 -59.25 67.3125 C-60.09175781 67.66828125 -60.93351562 68.0240625 -61.80078125 68.390625 C-66.30812129 70.29961608 -70.23105957 72.48097379 -74.25 75.3125 C-74.99894531 75.72886719 -75.74789062 76.14523438 -76.51953125 76.57421875 C-79.92763219 78.74389675 -82.74784083 81.30478109 -85.6875 84.0625 C-86.55507935 84.87473022 -86.55507935 84.87473022 -87.44018555 85.70336914 C-98.87780881 96.50925851 -109.80261678 111.30742712 -112.78515625 127.15625 C-112.93855469 127.8678125 -113.09195313 128.579375 -113.25 129.3125 C-113.91 129.6425 -114.57 129.9725 -115.25 130.3125 C-115.70037893 133.33517741 -116.02199876 136.27097482 -116.25 139.3125 C-116.31622559 140.158125 -116.38245117 141.00375 -116.45068359 141.875 C-116.64038483 144.51986341 -116.79297536 147.16480853 -116.9375 149.8125 C-116.99744141 150.69808594 -117.05738281 151.58367187 -117.11914062 152.49609375 C-117.40000571 157.73634362 -117.07570857 162.24909469 -115.69848633 167.32226562 C-115.25 169.3125 -115.25 169.3125 -115.25 173.3125 C-116.57 173.3125 -117.89 173.3125 -119.25 173.3125 C-119.25 174.6325 -119.25 175.9525 -119.25 177.3125 C-120.24 177.6425 -121.23 177.9725 -122.25 178.3125 C-121.92 178.6425 -121.59 178.9725 -121.25 179.3125 C-121.31423439 181.64829609 -121.45117424 183.98229528 -121.625 186.3125 C-121.71523437 187.59125 -121.80546875 188.87 -121.8984375 190.1875 C-122.25 193.3125 -122.25 193.3125 -123.25 194.3125 C-123.15982004 196.50300021 -123.00333792 198.690966 -122.8125 200.875 C-122.71066406 202.07253906 -122.60882813 203.27007812 -122.50390625 204.50390625 C-122.42011719 205.43074219 -122.33632812 206.35757813 -122.25 207.3125 C-122.91 207.6425 -123.57 207.9725 -124.25 208.3125 C-129.43548026 197.19524207 -134.16188552 186.20413464 -137.25 174.3125 C-137.72953125 172.52199219 -137.72953125 172.52199219 -138.21875 170.6953125 C-142.56054879 151.03661241 -142.45736052 126.75611227 -137.25 107.3125 C-137.08371094 106.6721582 -136.91742188 106.03181641 -136.74609375 105.37207031 C-131.20798199 84.48108205 -121.35789321 65.67765612 -107.25 49.3125 C-106.00089844 47.86230469 -106.00089844 47.86230469 -104.7265625 46.3828125 C-78.14847336 16.15627658 -40.08205531 -0.1710366 0 0 Z " fill="#2F86DA" transform="translate(140.25,-0.3125)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C0.74913936 5.17802095 -0.15640015 7.77969351 -3.99804688 11.33007812 C-4.77245117 12.00200195 -4.77245117 12.00200195 -5.5625 12.6875 C-7.49917927 14.39859333 -9.23206172 16.09808288 -11 18 C-11 19.32 -11 20.64 -11 22 C-3.82337263 22.69451233 -0.13523234 21.41937028 5.8359375 17.41015625 C8 16 8 16 11 15 C11 14.34 11 13.68 11 13 C13 11.375 13 11.375 15 10 C15.99 10.495 15.99 10.495 17 11 C16.4225 11.66 15.845 12.32 15.25 13 C10.95552103 18.72597196 8.13192104 23.62132885 9 31 C9.99 32.485 9.99 32.485 11 34 C13.66653905 34.36460453 13.66653905 34.36460453 16.625 34.1875 C17.62789062 34.16042969 18.63078125 34.13335937 19.6640625 34.10546875 C20.82035156 34.05326172 20.82035156 34.05326172 22 34 C21.01 35.32 20.02 36.64 19 38 C19.99 37.67 20.98 37.34 22 37 C20.5 40 20.5 40 19 43 C21.92602589 41.86210104 23.634659 40.7122171 25.08203125 37.890625 C25.75056539 36.17534219 26.39551138 34.45072351 27.01953125 32.71875 C27.98507252 30.04139253 29.08031412 27.46882974 30.25 24.875 C30.58515625 24.12992188 30.9203125 23.38484375 31.265625 22.6171875 C31.62914062 21.81667969 31.62914062 21.81667969 32 21 C33.09898702 24.29696105 32.87124444 25.40494903 32.0625 28.6875 C31.77052734 29.89986328 31.77052734 29.89986328 31.47265625 31.13671875 C31.23869141 32.05904297 31.23869141 32.05904297 31 33 C32.299375 32.979375 33.59875 32.95875 34.9375 32.9375 C36.29165633 32.91600546 37.64756083 32.92851801 39 33 C40 34 40 34 40.25 36.875 C40 40 40 40 38.8125 41.875 C36.43963721 43.34781139 34.74086056 43.22223194 32 43 C31.67 42.01 31.34 41.02 31 40 C30.34 40 29.68 40 29 40 C29.33 40.639375 29.66 41.27875 30 41.9375 C31 44 31 44 31 45 C32.27875 44.95875 33.5575 44.9175 34.875 44.875 C40.08872856 44.85842217 44.94007672 45.81688642 50 47 C50 46.01 50 45.02 50 44 C51.32 44 52.64 44 54 44 C55 47 56 50 57 53 C58.65 53.33 60.3 53.66 62 54 C62 55.32 62 56.64 62 58 C65.3 58 68.6 58 72 58 C72 58.66 72 59.32 72 60 C71.34 60 70.68 60 70 60 C70.99 61.98 71.98 63.96 73 66 C72.34 66 71.68 66 71 66 C70.67 66.99 70.34 67.98 70 69 C56.73410125 75.62931189 39.93025813 75.28858612 25.5 75.3125 C24.80420837 75.31599457 24.10841675 75.31948914 23.39154053 75.3230896 C11.53424541 75.35616361 11.53424541 75.35616361 8 73 C18.395 72.505 18.395 72.505 29 72 C29 71.67 29 71.34 29 71 C31.31 71 33.62 71 36 71 C36 71.66 36 72.32 36 73 C38.85432471 72.68889371 41.70845525 72.37615574 44.5625 72.0625 C45.36236328 71.97548828 46.16222656 71.88847656 46.98632812 71.79882812 C51.67256697 71.28238548 56.33680546 70.69478469 61 70 C60.01 65.545 60.01 65.545 59 61 C62.75519057 61.51207144 65.66688525 62.2175082 69 64 C68.45730469 63.71125 67.91460937 63.4225 67.35546875 63.125 C66.64003906 62.75375 65.92460937 62.3825 65.1875 62 C64.47980469 61.62875 63.77210938 61.2575 63.04296875 60.875 C60.91079271 59.80314642 60.91079271 59.80314642 58 60 C56.6459068 58.01399663 55.31542376 56.01182457 54 54 C47.69908554 48.18377127 41.90296676 47.44629314 33.52734375 47.54296875 C27.69523026 48.29862465 23.47333274 51.18208393 19.62963867 55.5612793 C16.8246698 58.03763608 13.09267758 57.73308814 9.5 58 C-0.97188518 58.95990395 -0.97188518 58.95990395 -11 62 C-11.33 62.66 -11.66 63.32 -12 64 C-11.21625 63.54625 -10.4325 63.0925 -9.625 62.625 C-1.30273565 58.89432978 6.99235458 58.72141303 16 59 C15.67 60.32 15.34 61.64 15 63 C13.80375 62.814375 12.6075 62.62875 11.375 62.4375 C9.15595247 62.29954741 9.15595247 62.29954741 7 63 C4.46833125 65.71704199 2.71795977 68.72025861 1 72 C2.98 72 4.96 72 7 72 C7 72.33 7 72.66 7 73 C-1.24003056 73.29428681 -7.73073463 72.07788057 -15 68 C-15.33 67.67 -15.66 67.34 -16 67 C-14.87526671 77.92175219 -13.52388527 88.80569438 -12.0625 99.6875 C-11.89041016 100.96963379 -11.71832031 102.25176758 -11.54101562 103.57275391 C-10.87149376 108.54965848 -10.19990689 113.52627738 -9.52490234 118.50244141 C-9.09644359 121.66783711 -8.67275671 124.83383855 -8.25 128 C-8.12246338 128.93030029 -7.99492676 129.86060059 -7.86352539 130.8190918 C-6.66311684 139.85374566 -6.66311684 139.85374566 -7 144 C-7.66 144.66 -8.32 145.32 -9 146 C-9.33 145.01 -9.66 144.02 -10 143 C-10.66 143 -11.32 143 -12 143 C-12 144.32 -12 145.64 -12 147 C-12.66 147.33 -13.32 147.66 -14 148 C-13.67 148.99 -13.34 149.98 -13 151 C-13.99 151.33 -14.98 151.66 -16 152 C-15.95875 153.258125 -15.9175 154.51625 -15.875 155.8125 C-15.7609626 159.29064073 -15.94074319 159.91111478 -18 163 C-18.16713569 165.62531524 -18.16713569 165.62531524 -18 168 C-20.97 168.33 -23.94 168.66 -27 169 C-27 167.68 -27 166.36 -27 165 C-27.66 165 -28.32 165 -29 165 C-29 165.66 -29 166.32 -29 167 C-30.65 167.66 -32.3 168.32 -34 169 C-33.505 172.465 -33.505 172.465 -33 176 C-35.38564077 175.42415568 -37.66682784 174.77772405 -40 174 C-39.49513181 169.65813356 -39.04988547 166.23472702 -36 163 C-32.672309 162.27005488 -29.4004621 162.07017839 -26 162 C-26 160.35 -26 158.7 -26 157 C-27.65 157 -29.3 157 -31 157 C-31 156.01 -31 155.02 -31 154 C-31.66 153.67 -32.32 153.34 -33 153 C-32.01 152.34 -31.02 151.68 -30 151 C-29.42251197 149.03638136 -29.42251197 149.03638136 -29.3125 146.875 C-29.209375 145.59625 -29.10625 144.3175 -29 143 C-29.99 143 -30.98 143 -32 143 C-32 143.66 -32 144.32 -32 145 C-38.45 149.09326923 -38.45 149.09326923 -41.234375 148.62109375 C-42.10835937 148.31365234 -42.10835937 148.31365234 -43 148 C-42.32195312 147.59910156 -41.64390625 147.19820312 -40.9453125 146.78515625 C-30.57881575 140.45326557 -19.3005356 132.31271719 -14 121 C-14.82177734 121.63615234 -14.82177734 121.63615234 -15.66015625 122.28515625 C-39.34907055 139.81110098 -70.95691062 146.4082311 -99.9609375 142.4609375 C-103.04987093 141.7932583 -105.99741258 140.98112716 -109 140 C-109.93585938 139.7215625 -110.87171875 139.443125 -111.8359375 139.15625 C-128.84284879 133.63019479 -140.8543981 121.67040735 -149 106 C-155.37950027 91.33639503 -156.93448195 73.02310069 -151.24609375 57.8671875 C-150.83488281 56.92101562 -150.42367187 55.97484375 -150 55 C-149.59910156 54.01257813 -149.19820312 53.02515625 -148.78515625 52.0078125 C-143.29122308 39.74599065 -133.82838486 28.55904207 -122 22 C-119.1796875 21.296875 -119.1796875 21.296875 -117 21 C-116.505 22.485 -116.505 22.485 -116 24 C-116.99 24.33 -117.98 24.66 -119 25 C-119.45375 25.78375 -119.9075 26.5675 -120.375 27.375 C-122.23677166 30.3824773 -123.85110315 31.46592205 -127 33 C-127.66 33 -128.32 33 -129 33 C-129 34.65 -129 36.3 -129 38 C-128.34 38 -127.68 38 -127 38 C-127 38.66 -127 39.32 -127 40 C-127.66 40 -128.32 40 -129 40 C-129 41.32 -129 42.64 -129 44 C-128.01 44 -127.02 44 -126 44 C-127.43480559 46.99942692 -129.09185308 49.75843218 -130.875 52.5625 C-135.23505005 59.79016244 -138.40474296 67.51758725 -139 76 C-139.07476562 76.84691406 -139.14953125 77.69382812 -139.2265625 78.56640625 C-139.87182848 91.31889975 -135.374537 103.39906637 -127 113 C-119.80988218 120.7815128 -108.79059436 127.18049759 -98.140625 128.30078125 C-90.10753221 128.33334784 -82.2407324 127.76141729 -75.625 122.75 C-72.66461688 119.64864626 -70.93998632 116.80535778 -69 113 C-69.53109375 113.34933594 -70.0621875 113.69867188 -70.609375 114.05859375 C-71.31578125 114.51363281 -72.0221875 114.96867187 -72.75 115.4375 C-73.44609375 115.88996094 -74.1421875 116.34242188 -74.859375 116.80859375 C-81.99393171 120.77946929 -92.56757276 120.01847097 -100.33203125 118.234375 C-110.66485369 114.38834411 -118.63427537 107.37759177 -123.625 97.5625 C-126.46932369 91.25730847 -127.18234857 86.51314731 -127.1875 79.6875 C-127.19974609 78.84509766 -127.21199219 78.00269531 -127.22460938 77.13476562 C-127.23583755 72.3478189 -126.856112 68.49721999 -125 64 C-122.5625 64.75 -122.5625 64.75 -120 66 C-119.1875 68.125 -119.1875 68.125 -119 70 C-116.69 70.33 -114.38 70.66 -112 71 C-112.04640625 72.134375 -112.0928125 73.26875 -112.140625 74.4375 C-112.4293321 84.41504052 -112.3938051 90.77493447 -105.6875 98.75 C-99.33144036 104.07135225 -95.26075407 105.66936667 -86.9453125 105.3984375 C-81.42155259 104.65119146 -77.54816608 102.03211072 -73 99 C-72.52691406 99.60328125 -72.05382812 100.2065625 -71.56640625 100.828125 C-66.26596091 107.23412132 -61.74050783 111.10088432 -53.40625 112.40625 C-45.03058058 112.88761031 -38.34655398 109.67327699 -31 106 C-35.86004975 117.1509771 -49.73912421 123.01860233 -60.38671875 127.390625 C-65.74035975 129.29832142 -70.31710103 130.51662718 -76 130 C-76 130.66 -76 131.32 -76 132 C-57.99917787 131.557437 -42.38524965 130.19262483 -26 122 C-25.87625 121.39414063 -25.7525 120.78828125 -25.625 120.1640625 C-24.78600246 117.2590335 -23.32685843 116.26141737 -21 114.375 C-18.04427685 112.05444701 -18.04427685 112.05444701 -16 109 C-15.46127614 101.20774422 -16.41105309 93.57611104 -17.5 85.875 C-18.48281785 78.87131605 -19.38315103 72.08119862 -19 65 C-17.125 62.75 -17.125 62.75 -15 61 C-14.65195312 59.93265625 -14.65195312 59.93265625 -14.296875 58.84375 C-12.08061129 53.98399101 -7.9954457 50.59730617 -4.23046875 46.87890625 C0.16218836 42.37480753 5 36.64688427 5 30 C4.67128906 30.45890625 4.34257812 30.9178125 4.00390625 31.390625 C0.11707667 36.40452982 -3.87934026 39.20831597 -10 41 C-11.32 41 -12.64 41 -14 41 C-14.99 38.525 -14.99 38.525 -16 36 C-17.32 36 -18.64 36 -20 36 C-20 35.34 -20 34.68 -20 34 C-15.38 32.35 -10.76 30.7 -6 29 C-6 28.34 -6 27.68 -6 27 C-6.69867188 26.87882812 -7.39734375 26.75765625 -8.1171875 26.6328125 C-9.02726563 26.46523437 -9.93734375 26.29765625 -10.875 26.125 C-11.77992188 25.96257812 -12.68484375 25.80015625 -13.6171875 25.6328125 C-16 25 -16 25 -18 23 C-18.06316957 19.86859396 -17.66716474 17.8085825 -15.64550781 15.35839844 C-13.85801265 13.6263454 -12.01741548 11.9916743 -10.125 10.375 C-8.85416731 9.26077498 -7.58585517 8.14366734 -6.3203125 7.0234375 C-5.73282227 6.50491211 -5.14533203 5.98638672 -4.54003906 5.45214844 C-2.77944185 3.79202919 -1.38248366 1.98188217 0 0 Z " fill="#0C112A" transform="translate(199,71)"/>
<path d="M0 0 C1.02053467 0.00418945 2.04106934 0.00837891 3.0925293 0.01269531 C10.34850632 0.12153786 16.89109571 0.81443753 23.75 3.3125 C24.60207031 3.5909375 25.45414062 3.869375 26.33203125 4.15625 C42.48252083 9.91187762 53.50534159 22.4397444 61.29296875 37.24609375 C64.79071651 45.2507434 65.20574965 52.65563565 65.25 61.3125 C65.25636475 62.39934082 65.26272949 63.48618164 65.26928711 64.60595703 C65.16329745 71.19984515 64.68585628 76.05662147 60.1015625 81.140625 C59.53179687 81.60984375 58.96203125 82.0790625 58.375 82.5625 C57.81039062 83.04203125 57.24578125 83.5215625 56.6640625 84.015625 C51.03446018 87.8299678 45.35169089 88.06290803 38.75 87.3125 C33.06286512 85.51031494 29.07543846 81.12211066 25.75 76.3125 C24.65032987 73.01348962 24.57652539 70.4385814 24.50390625 66.96484375 C24.47103516 65.72025391 24.43816406 64.47566406 24.40429688 63.19335938 C24.34301012 60.56063684 24.2857299 57.92781805 24.23242188 55.29492188 C24.19826172 54.05162109 24.16410156 52.80832031 24.12890625 51.52734375 C24.1038501 50.38386475 24.07879395 49.24038574 24.05297852 48.06225586 C24.02439435 45.16995425 24.02439435 45.16995425 21.75 43.3125 C19.35923577 43.00139503 19.35923577 43.00139503 16.5859375 43.046875 C15.54566406 43.04429688 14.50539063 43.04171875 13.43359375 43.0390625 C11.79583984 43.05066406 11.79583984 43.05066406 10.125 43.0625 C9.05636719 43.05476563 7.98773438 43.04703125 6.88671875 43.0390625 C-4.73048216 43.02358202 -4.73048216 43.02358202 -14.5625 48.625 C-15.22507813 49.24246094 -15.88765625 49.85992187 -16.5703125 50.49609375 C-18.41849982 52.36482456 -18.41849982 52.36482456 -19.9375 55.1875 C-21.25 57.3125 -21.25 57.3125 -23.6875 58.375 C-26.25 58.3125 -26.25 58.3125 -28.375 56.5625 C-28.99375 55.82 -29.6125 55.0775 -30.25 54.3125 C-31.94096488 52.55649801 -33.06447758 51.40526121 -35.25 50.3125 C-37.67659021 62.68413206 -38.08484382 76.3368384 -31.25 87.3125 C-25.31188702 95.79175668 -17.27152481 101.59166833 -7.25 104.3125 C-4.61353409 104.54967162 -2.13258489 104.69317164 0.5 104.6875 C1.20084717 104.68733887 1.90169434 104.68717773 2.6237793 104.68701172 C9.9541975 104.52679321 15.67029698 102.36563535 21.75 98.3125 C20.03543084 103.97057823 16.63581662 108.64702871 11.49609375 111.61328125 C3.11313303 115.41116296 -6.42565263 117.35772344 -15.375 114.125 C-16.67563297 113.54038559 -17.96706337 112.93498996 -19.25 112.3125 C-20.40048828 111.83683594 -20.40048828 111.83683594 -21.57421875 111.3515625 C-33.81299228 105.93345553 -42.54332127 96.52690825 -47.49609375 84.21484375 C-50.05710049 76.77994875 -50.90709519 70.13405239 -50.25 62.3125 C-50.19070312 61.44367188 -50.13140625 60.57484375 -50.0703125 59.6796875 C-48.78426712 49.17175576 -43.11694879 38.28801452 -36.25 30.3125 C-37.24 30.3125 -38.23 30.3125 -39.25 30.3125 C-39.25 28.9925 -39.25 27.6725 -39.25 26.3125 C-38.59 26.3125 -37.93 26.3125 -37.25 26.3125 C-37.25 25.6525 -37.25 24.9925 -37.25 24.3125 C-37.91 24.3125 -38.57 24.3125 -39.25 24.3125 C-39.58 23.3225 -39.91 22.3325 -40.25 21.3125 C-38.35955296 19.21200329 -36.60917537 17.90708034 -34.1875 16.375 C-31.39062571 14.4112372 -30.37098353 13.45125387 -29.25 10.3125 C-28.26 10.3125 -27.27 10.3125 -26.25 10.3125 C-27.24 8.9925 -28.23 7.6725 -29.25 6.3125 C-27.75292061 5.68053616 -26.25213297 5.05735607 -24.75 4.4375 C-23.9146875 4.08945313 -23.079375 3.74140625 -22.21875 3.3828125 C-14.65747172 0.6567727 -7.99408931 -0.04457549 0 0 Z " fill="#25162B" transform="translate(109.25,84.6875)"/>
<path d="M0 0 C2.87110893 0.30761881 3.96268285 0.96381367 6.0625 3 C11.86829374 11.98961611 12.07247823 21.71870467 10.25 32.0625 C9.21398922 36.68355526 7.62663229 41.05196204 5.90234375 45.45703125 C5.01328746 47.96255351 4.45552109 50.38427578 4 53 C13.16685235 50.05300574 21.878687 46.59141591 27.19921875 38.08203125 C28.15220199 35.60427483 28.4163141 33.39335471 28.625 30.75 C28.69976562 29.85796875 28.77453125 28.9659375 28.8515625 28.046875 C28.92503906 27.03367187 28.92503906 27.03367187 29 26 C32.6838231 28.45588207 32.90768058 29.79760447 34 34 C35.80666921 46.90726177 31.06958328 57.44173106 24 68 C24 68.66 24 69.32 24 70 C28.6127391 68.68207454 32.11593582 66.71636045 36 64 C37.82386505 62.75682741 39.65810462 61.52879898 41.5 60.3125 C42.3971875 59.71050781 43.294375 59.10851562 44.21875 58.48828125 C47.20108505 56.89239691 49.65687258 56.36872729 53 56 C52.62488281 56.4125 52.24976563 56.825 51.86328125 57.25 C46.60109694 63.18818279 40.31279514 70.46447046 39.75 78.625 C39.63598616 82.07127924 39.63598616 82.07127924 42 84 C45.48368398 83.90584638 46.86204291 83.12071245 49.5 80.8125 C51.27111387 78.8199969 52.9564756 76.82316654 54.625 74.75 C57 72 57 72 60 71 C59.72929687 71.49628906 59.45859375 71.99257812 59.1796875 72.50390625 C57.2619329 76.56167178 55.85509204 80.83027668 54.38671875 85.06835938 C52.84784011 89.32220265 51.25984111 92.73376705 48 96 C47.01 96 46.02 96 45 96 C45.66 94.35 46.32 92.7 47 91 C46.34 91 45.68 91 45 91 C45.33 90.01 45.66 89.02 46 88 C45.38511719 88.04640625 44.77023438 88.0928125 44.13671875 88.140625 C37.57256461 88.43376107 37.57256461 88.43376107 34.9375 86.4375 C33.27006859 82.10217832 33.27669193 78.76272856 35.0546875 74.4296875 C36.84705533 70.7919232 38.74954437 67.37568344 41 64 C39.02 64.99 39.02 64.99 37 66 C37 66.66 37 67.32 37 68 C34.6640625 69.69140625 34.6640625 69.69140625 31.625 71.5625 C30.62726563 72.18253906 29.62953125 72.80257812 28.6015625 73.44140625 C25.12049076 75.52691319 23.40288636 76.12004123 19.375 76.0625 C18.55773437 76.05347656 17.74046875 76.04445313 16.8984375 76.03515625 C16.27195313 76.02355469 15.64546875 76.01195313 15 76 C14.1640625 73.83984375 14.1640625 73.83984375 14 71 C15.74764108 68.93706285 17.35083106 67.30772859 19.375 65.5625 C22.54325263 62.81380558 24.77973303 60.86591188 25.8515625 56.65234375 C25.92503906 55.33943359 25.92503906 55.33943359 26 54 C25.43152344 54.65226562 24.86304688 55.30453125 24.27734375 55.9765625 C17.20849087 63.97770148 17.20849087 63.97770148 13 67.25 C10.34221803 69.39832261 10.03908521 69.85929325 9.0625 73.375 C9.0315625 74.674375 9.0315625 74.674375 9 76 C11.90092502 77.93395001 12.89674737 78.30131941 16.1875 78.625 C17.445625 78.74875 18.70375 78.8725 20 79 C20 80.32 20 81.64 20 83 C18.23141309 83.67260351 16.46003984 84.33788395 14.6875 85 C13.70136719 85.37125 12.71523437 85.7425 11.69921875 86.125 C9 87 9 87 6 87 C6 87.66 6 88.32 6 89 C7.32 89 8.64 89 10 89 C10.66 90.65 11.32 92.3 12 94 C20.54481294 91.27843147 26.866197 88.7007045 32 81 C31.44853384 89.82345851 26.99772103 95.31127285 20.7734375 101.27734375 C16.40451955 105.52116053 13.21441969 109.30577793 11 115 C8.875 116.8125 8.875 116.8125 7 118 C4.93931985 111.43158202 4.10255526 107.33816037 7 101 C6.34 101 5.68 101 5 101 C5 100.01 5 99.02 5 98 C6.32 97.67 7.64 97.34 9 97 C8.34 96.34 7.68 95.68 7 95 C7 94.01 7 93.02 7 92 C5.68 91.34 4.36 90.68 3 90 C3.0825 88.9275 3.165 87.855 3.25 86.75 C2.95285655 82.29284827 2.05234677 81.95696093 -1 79 C-1.49573145 75.03414842 -1.09491746 72.40424088 1 69 C0.29875 69.33 -0.4025 69.66 -1.125 70 C-4.26003116 71.09044562 -6.70563182 71.15322643 -10 71 C-10 69.68 -10 68.36 -10 67 C-10.763125 66.9175 -11.52625 66.835 -12.3125 66.75 C-17.96161629 65.60102719 -24.84046079 64.15953921 -29 60 C-29.125 57.75 -29.125 57.75 -28 55 C-25.52719101 52.72354309 -22.77540647 50.8872764 -20 49 C-10.70634557 42.42818656 -3.19979157 35.86292242 1 25 C1 24.34 1 23.68 1 23 C0.54625 23.825 0.0925 24.65 -0.375 25.5 C-6.08964699 34.12317699 -16.01532522 39.63913156 -25.6875 42.4375 C-30.24214037 43.78254943 -34.53038407 45.16946664 -38.8125 47.25 C-44.24947212 49.53973155 -49.73601541 49.45004808 -55.546875 49.64648438 C-77.90442416 50.46742563 -98.86494127 57.32977641 -116 72 C-116.80953125 72.61230469 -117.6190625 73.22460938 -118.453125 73.85546875 C-128.77729117 82.54867002 -135.13638027 94.64146626 -140 107 C-140.3815625 107.95777344 -140.763125 108.91554688 -141.15625 109.90234375 C-147.27237758 129.18513487 -143.0929209 150.8957894 -134.14575195 168.41479492 C-130.94967626 174.38194019 -127.27210407 179.96586714 -122.28125 184.59375 C-121.8584375 185.0578125 -121.435625 185.521875 -121 186 C-121.3125 188.1875 -121.3125 188.1875 -122 190 C-122 189.34 -122 188.68 -122 188 C-122.66 188 -123.32 188 -124 188 C-123.34515625 188.68449219 -122.6903125 189.36898437 -122.015625 190.07421875 C-119.55728268 193.6426265 -119.57715307 195.53453856 -119.75 199.8125 C-119.78609375 200.97394531 -119.8221875 202.13539063 -119.859375 203.33203125 C-119.90578125 204.21246094 -119.9521875 205.09289062 -120 206 C-117.36 205.67 -114.72 205.34 -112 205 C-112 205.66 -112 206.32 -112 207 C-115.465 207.99 -115.465 207.99 -119 209 C-118.01 209 -117.02 209 -116 209 C-116 209.66 -116 210.32 -116 211 C-117.32 211 -118.64 211 -120 211 C-120 211.99 -120 212.98 -120 214 C-122.76264289 214.59732819 -125.16032769 215 -128 215 C-128 215.66 -128 216.32 -128 217 C-130.31 217.99 -132.62 218.98 -135 220 C-140.83215317 213.43746503 -146.36791922 206.8321604 -151.125 199.4375 C-151.50261475 198.85468262 -151.88022949 198.27186523 -152.26928711 197.67138672 C-155.55325736 192.43686782 -156.1463143 188.41916183 -156.625 182.3125 C-156.72039062 181.15363281 -156.81578125 179.99476563 -156.9140625 178.80078125 C-156.94242188 177.87652344 -156.97078125 176.95226562 -157 176 C-156.67 175.67 -156.34 175.34 -156 175 C-155.7375117 172.69301952 -155.53959057 170.37852439 -155.375 168.0625 C-155.27960938 166.79535156 -155.18421875 165.52820313 -155.0859375 164.22265625 C-154.74977745 161.10803045 -154.74977745 161.10803045 -156 159 C-154.68 159 -153.36 159 -152 159 C-152 157.68 -152 156.36 -152 155 C-150.68 155 -149.36 155 -148 155 C-148.28073073 152.85270859 -148.57488499 150.70716807 -148.875 148.5625 C-149.03742188 147.36753906 -149.19984375 146.17257813 -149.3671875 144.94140625 C-149.57601562 143.97074219 -149.78484375 143.00007812 -150 142 C-150.66 141.67 -151.32 141.34 -152 141 C-151.34 141 -150.68 141 -150 141 C-150.00523682 140.44127197 -150.01047363 139.88254395 -150.01586914 139.30688477 C-150.03691719 136.72543506 -150.04974734 134.14400351 -150.0625 131.5625 C-150.07506836 130.24475586 -150.07506836 130.24475586 -150.08789062 128.90039062 C-150.10899107 123.18216923 -149.73280057 117.67199185 -149 112 C-147.515 111.505 -147.515 111.505 -146 111 C-145.89558594 110.00097656 -145.79117188 109.00195312 -145.68359375 107.97265625 C-143.09432868 90.09909856 -129.75915663 74.79434386 -117 63 C-116.3503125 62.38253906 -115.700625 61.76507813 -115.03125 61.12890625 C-111.62380697 58.02348658 -108.19005621 55.86436164 -103.9921875 53.95703125 C-101.91105804 53.00301048 -101.91105804 53.00301048 -99.73828125 51.58203125 C-96.37930951 49.64139851 -92.92469664 48.26942702 -89.3125 46.875 C-84.59508828 45.07807148 -84.59508828 45.07807148 -80 43 C-78.48108919 42.87079209 -76.95961498 42.77087093 -75.4375 42.6875 C-70.739406 42.27216125 -67.11899461 41.01518427 -62.91015625 38.9375 C-61 38 -61 38 -58 37 C-58 36.34 -58 35.68 -58 35 C-50.22740403 25.27351941 -37.59794534 23.84438794 -26 22 C-25.34 22 -24.68 22 -24 22 C-25.2648918 25.79467541 -26.51659392 26.14345512 -29.9375 28.0625 C-33.72081765 30.19623733 -33.72081765 30.19623733 -37 33 C-37.16681109 36.08347826 -37.16681109 36.08347826 -37 39 C-26.39243167 39.7857458 -19.18204679 35.61831133 -11.12890625 29 C-8.94938865 27.07265066 -8.94938865 27.07265066 -7.33984375 24.75 C-6.89769531 24.1725 -6.45554688 23.595 -6 23 C-5.34 23 -4.68 23 -4 23 C-3.690625 22.030625 -3.38125 21.06125 -3.0625 20.0625 C-2 17 -2 17 -1 16 C-0.76345976 13.8798986 -0.58548166 11.75311717 -0.4375 9.625 C-0.35371094 8.46226563 -0.26992187 7.29953125 -0.18359375 6.1015625 C-0.06335785 4.07034334 0 2.03477467 0 0 Z " fill="#F35A05" transform="translate(173,18)"/>
<path d="M0 0 C0.67975891 0.00182281 1.35951782 0.00364563 2.05987549 0.00552368 C12.61226758 0.05307093 22.50630033 0.67413314 32.75 3.3125 C33.41499512 3.47347168 34.07999023 3.63444336 34.76513672 3.80029297 C43.72309834 5.99498302 52.13289864 9.1429266 60.5625 12.875 C61.41690674 13.25092285 62.27131348 13.6268457 63.15161133 14.01416016 C67.37119797 15.94953259 70.72723114 17.6603327 73.75 21.3125 C68.23344854 19.61904699 63.21752697 17.23281933 58.05273438 14.703125 C54.08410877 12.80020311 54.08410877 12.80020311 49.75 12.3125 C50.08 13.3025 50.41 14.2925 50.75 15.3125 C50.110625 15.415625 49.47125 15.51875 48.8125 15.625 C48.131875 15.851875 47.45125 16.07875 46.75 16.3125 C46.42 17.3025 46.09 18.2925 45.75 19.3125 C44.821875 19.0340625 44.821875 19.0340625 43.875 18.75 C41.70839822 18.07563824 41.70839822 18.07563824 39.75 19.3125 C39.75 18.6525 39.75 17.9925 39.75 17.3125 C36.46303767 16.51296862 35.03976808 16.21591064 31.75 17.3125 C31.564375 18.859375 31.564375 18.859375 31.375 20.4375 C30.81110186 23.93366846 29.96317941 26.99647627 28.75 30.3125 C29.41 30.3125 30.07 30.3125 30.75 30.3125 C30.75 30.9725 30.75 31.6325 30.75 32.3125 C30.09 32.3125 29.43 32.3125 28.75 32.3125 C28.75 32.9725 28.75 33.6325 28.75 34.3125 C27.55375 34.27125 26.3575 34.23 25.125 34.1875 C21.32670047 34.17398292 18.30024382 34.89240247 14.75 36.3125 C14.75 36.9725 14.75 37.6325 14.75 38.3125 C14.09 38.3125 13.43 38.3125 12.75 38.3125 C12.75 37.6525 12.75 36.9925 12.75 36.3125 C10.8245356 35.1634288 10.8245356 35.1634288 8.75 35.3125 C5.47724974 35.3125 2.903368 35.01324844 -0.25 34.3125 C-0.25 33.6525 -0.25 32.9925 -0.25 32.3125 C-1.24 32.3125 -2.23 32.3125 -3.25 32.3125 C-3.25 33.9625 -3.25 35.6125 -3.25 37.3125 C-4.24 37.3125 -5.23 37.3125 -6.25 37.3125 C-6.25 37.9725 -6.25 38.6325 -6.25 39.3125 C-8.56 39.3125 -10.87 39.3125 -13.25 39.3125 C-13.25 37.9925 -13.25 36.6725 -13.25 35.3125 C-13.91 35.3125 -14.57 35.3125 -15.25 35.3125 C-14.92 36.3025 -14.59 37.2925 -14.25 38.3125 C-14.58 39.3025 -14.91 40.2925 -15.25 41.3125 C-16.178125 41.250625 -17.10625 41.18875 -18.0625 41.125 C-21.23395103 41.00355736 -21.23395103 41.00355736 -23.125 42.8125 C-23.49625 43.3075 -23.8675 43.8025 -24.25 44.3125 C-24.91 43.9825 -25.57 43.6525 -26.25 43.3125 C-26.91 43.23 -27.57 43.1475 -28.25 43.0625 C-30.25 42.3125 -30.25 42.3125 -31.5 39.75 C-31.7475 38.945625 -31.995 38.14125 -32.25 37.3125 C-33.5803125 38.2715625 -33.5803125 38.2715625 -34.9375 39.25 C-37.97045154 41.13844152 -39.74836676 42.02858379 -43.25 42.3125 C-44.735 41.8175 -44.735 41.8175 -46.25 41.3125 C-47.24 41.3125 -48.23 41.3125 -49.25 41.3125 C-49.25 41.9725 -49.25 42.6325 -49.25 43.3125 C-50.88631892 44.36142238 -52.55485863 45.36156703 -54.25 46.3125 C-54.58 46.6425 -54.91 46.9725 -55.25 47.3125 C-57.24958364 47.35330783 -59.25045254 47.35504356 -61.25 47.3125 C-61.25 48.3025 -61.25 49.2925 -61.25 50.3125 C-62.24 50.3125 -63.23 50.3125 -64.25 50.3125 C-64.25 49.3225 -64.25 48.3325 -64.25 47.3125 C-66.41666667 48.14583333 -66.41666667 48.14583333 -67.25 50.3125 C-69.3125 51.4375 -69.3125 51.4375 -71.25 52.3125 C-71.25 53.3025 -71.25 54.2925 -71.25 55.3125 C-70.63125 54.8175 -70.0125 54.3225 -69.375 53.8125 C-67.25 52.3125 -67.25 52.3125 -65.25 52.3125 C-65.17528266 56.1978017 -65.27763494 59.56194905 -66.25 63.3125 C-65.92 63.9725 -65.59 64.6325 -65.25 65.3125 C-67.64509338 68.21182357 -69.56245243 68.81418276 -73.25 69.3125 C-73.559375 68.508125 -73.86875 67.70375 -74.1875 66.875 C-75.01335345 64.42169595 -75.01335345 64.42169595 -76.25 63.3125 C-76.91 64.6325 -77.57 65.9525 -78.25 67.3125 C-78.745 66.3225 -78.745 66.3225 -79.25 65.3125 C-79.91 65.3125 -80.57 65.3125 -81.25 65.3125 C-81.25 65.9725 -81.25 66.6325 -81.25 67.3125 C-82.57 66.9825 -83.89 66.6525 -85.25 66.3125 C-85.61279456 65.02323008 -85.96496698 63.73096728 -86.3125 62.4375 C-86.60833984 61.35855469 -86.60833984 61.35855469 -86.91015625 60.2578125 C-87.25 58.3125 -87.25 58.3125 -86.25 56.3125 C-89.99667202 57.9452851 -89.99667202 57.9452851 -93.25 60.3125 C-96.33638202 60.64616292 -97.86536475 60.54120204 -100.5625 58.9375 C-101.119375 58.40125 -101.67625 57.865 -102.25 57.3125 C-102.25 56.6525 -102.25 55.9925 -102.25 55.3125 C-103.57 54.9825 -104.89 54.6525 -106.25 54.3125 C-106.25 53.6525 -106.25 52.9925 -106.25 52.3125 C-108.23 52.8075 -108.23 52.8075 -110.25 53.3125 C-93.51286618 29.22415446 -66.30095383 13.09235237 -38.5625 5 C-37.73210205 4.75733398 -36.9017041 4.51466797 -36.04614258 4.26464844 C-24.09773253 0.95869955 -12.37014214 -0.05278539 0 0 Z " fill="#36A3E3" transform="translate(140.25,-0.3125)"/>
<path d="M0 0 C1 3 1 3 0.171875 5.3125 C-5.69710966 16.40552596 -13.93380272 24.33503743 -24.78515625 30.5625 C-27.25995617 31.96098988 -27.25995617 31.96098988 -29 35 C-29.17718681 37.09148548 -29.17718681 37.09148548 -28 39 C-25.14370003 40.55964255 -25.14370003 40.55964255 -21.6875 41.6875 C-20.53636719 42.10386719 -19.38523437 42.52023438 -18.19921875 42.94921875 C-15.80191596 43.73661124 -13.45865063 44.44756245 -11 45 C-11 46.32 -11 47.64 -11 49 C-9.9275 48.67 -8.855 48.34 -7.75 48 C-4 47 -4 47 0 47 C-0.08378906 47.68707031 -0.16757813 48.37414062 -0.25390625 49.08203125 C-0.35574219 49.98308594 -0.45757812 50.88414063 -0.5625 51.8125 C-0.66691406 52.70582031 -0.77132812 53.59914062 -0.87890625 54.51953125 C-1.15658709 57.13375572 -1.15658709 57.13375572 0 60 C1.485 60.495 1.485 60.495 3 61 C2.9071875 62.670625 2.9071875 62.670625 2.8125 64.375 C2.9053125 66.169375 2.9053125 66.169375 3 68 C4.485 68.99 4.485 68.99 6 70 C7.06246527 71.96752828 8.07137808 73.96587579 9 76 C7.35 76 5.7 76 4 76 C4 76.99 4 77.98 4 79 C4.66 79 5.32 79 6 79 C5.87431641 80.04800781 5.87431641 80.04800781 5.74609375 81.1171875 C5.64425781 82.02726562 5.54242188 82.93734375 5.4375 83.875 C5.33308594 84.77992187 5.22867188 85.68484375 5.12109375 86.6171875 C4.80325148 89.01653057 4.80325148 89.01653057 6 91 C6.28237651 93.32332299 6.51288882 95.65302617 6.71875 97.984375 C6.78155151 98.6775885 6.84435303 99.370802 6.90905762 100.08502197 C7.1098571 102.30635842 7.30530913 104.52812046 7.5 106.75 C7.69529301 108.9575343 7.89179094 111.16494167 8.09094238 113.37213135 C8.2723451 115.38553856 8.44975238 117.39930456 8.62695312 119.41308594 C8.96288158 122.6430996 9.43572075 125.80338117 10 129 C10.60966069 133.80800588 11.15002151 138.11926776 8.54296875 142.3828125 C6.78408818 144.3897878 4.974723 146.20710374 3 148 C0.67931615 150.13046386 0.03443198 150.89670407 -1 154 C-8.00878222 158.31309675 -16.02831113 160.30972786 -24 162 C-24.77190674 162.17490967 -25.54381348 162.34981934 -26.33911133 162.5300293 C-29.05610908 163.00991008 -31.54413658 163.11377698 -34.30078125 163.09765625 C-35.27724609 163.09443359 -36.25371094 163.09121094 -37.25976562 163.08789062 C-38.26716797 163.07951172 -39.27457031 163.07113281 -40.3125 163.0625 C-41.33923828 163.05798828 -42.36597656 163.05347656 -43.42382812 163.04882812 C-45.94927882 163.03708184 -48.47460905 163.02065565 -51 163 C-51 162.34 -51 161.68 -51 161 C-50.14341797 160.87044922 -50.14341797 160.87044922 -49.26953125 160.73828125 C-32.8366675 157.89061488 -18.86728811 150.58412072 -7 139 C-9.88704205 139.89962642 -9.88704205 139.89962642 -12.09375 140.97265625 C-19.33214915 144.25108703 -25.94020494 145.60522738 -33.671875 143.15234375 C-39.90754814 140.36518682 -43.93689402 136.4219593 -48 131 C-48.54269531 131.34933594 -49.08539063 131.69867188 -49.64453125 132.05859375 C-50.35996094 132.51363281 -51.07539062 132.96867188 -51.8125 133.4375 C-52.52019531 133.88996094 -53.22789063 134.34242188 -53.95703125 134.80859375 C-59.25604766 137.89884233 -65.05597662 137.6358035 -71 137 C-77.92505312 134.75460399 -82.40867215 130.21711837 -86 124 C-89.15729656 117.42678874 -88.41707473 110.45576207 -87.5625 103.375 C-84.73845608 97.27506514 -79.5072318 90.40060799 -73 88 C-66.91676101 86.82513931 -60.9885443 86.77946235 -54.8125 86.75 C-53.72001953 86.729375 -52.62753906 86.70875 -51.50195312 86.6875 C-50.45587891 86.68234375 -49.40980469 86.6771875 -48.33203125 86.671875 C-47.38046143 86.6625293 -46.4288916 86.65318359 -45.44848633 86.64355469 C-43 87 -43 87 -41.19213867 88.13256836 C-39.46090399 90.84446967 -39.61402053 93.00728203 -39.59375 96.20703125 C-39.57183594 97.43357422 -39.54992187 98.66011719 -39.52734375 99.92382812 C-39.51832031 101.20708984 -39.50929687 102.49035156 -39.5 103.8125 C-39.48206557 106.33997331 -39.45125923 108.86739509 -39.40625 111.39453125 C-39.39916016 112.51706299 -39.39207031 113.63959473 -39.38476562 114.79614258 C-38.75018431 120.08015946 -36.60942386 123.96908717 -32.5 127.3125 C-31.9121875 127.80363281 -31.324375 128.29476562 -30.71875 128.80078125 C-26.10550476 132.01956827 -20.36806695 131.52138544 -15 131 C-9.05771846 129.25227014 -5.50551643 125.99270522 -2 121 C1.80483501 109.58549497 0.38299416 92.94177876 -4.390625 82 C-13.60943249 64.81542682 -25.45244523 53.66933553 -44.2109375 47.7265625 C-50.07296658 46.19947929 -55.85259275 45.74882783 -61.875 45.4375 C-62.65875 45.39431641 -63.4425 45.35113281 -64.25 45.30664062 C-66.16650649 45.20146649 -68.08323333 45.10032075 -70 45 C-70 44.67 -70 44.34 -70 44 C-65.71 44 -61.42 44 -57 44 C-56.34 42.68 -55.68 41.36 -55 40 C-52.79173622 39.97277483 -50.58337362 39.95350271 -48.375 39.9375 C-46.53035156 39.92009766 -46.53035156 39.92009766 -44.6484375 39.90234375 C-41.32276209 39.99136076 -38.25952412 40.36313913 -35 41 C-35.1546875 39.88625 -35.1546875 39.88625 -35.3125 38.75 C-35.209375 37.8425 -35.10625 36.935 -35 36 C-34.195625 35.4225 -33.39125 34.845 -32.5625 34.25 C-29.62027374 31.66658182 -29.57244753 30.98282453 -29.1875 27.25 C-29.10302504 25.83447371 -29.03332091 24.41765314 -29 23 C-30.0725 23.350625 -31.145 23.70125 -32.25 24.0625 C-35.78720743 24.94680186 -36.74811124 25.02880551 -40 24 C-39.02160156 23.68546875 -38.04320312 23.3709375 -37.03515625 23.046875 C-22.709946 18.39685466 -8.22548363 13.61459359 0 0 Z " fill="#FBD564" transform="translate(174,40)"/>
<path d="M0 0 C2.64 0.33 5.28 0.66 8 1 C8.03738281 1.76699219 8.07476562 2.53398437 8.11328125 3.32421875 C8.56845464 11.00861654 9.41164786 18.56903505 10.5 26.1875 C10.63059814 27.10813232 10.76119629 28.02876465 10.89575195 28.97729492 C11.40588299 32.45516739 11.88568065 35.65704195 13 39 C15.33075929 38.04134491 15.33075929 38.04134491 17 35 C20.125 34.8125 20.125 34.8125 23 35 C23 34.34 23 33.68 23 33 C23.99 33 24.98 33 26 33 C25.34 30.03 24.68 27.06 24 24 C24.99 24 25.98 24 27 24 C26.67 23.01 26.34 22.02 26 21 C23.98491642 20.26676204 23.98491642 20.26676204 22 20 C22 19.01 22 18.02 22 17 C34.375 16.505 34.375 16.505 47 16 C39.56564889 16.07902069 39.56564889 16.07902069 32.1315918 16.18017578 C30.74194214 16.18766846 30.74194214 16.18766846 29.32421875 16.1953125 C28.37635498 16.20578613 27.42849121 16.21625977 26.4519043 16.22705078 C24 16 24 16 21 14 C21 13.01 21 12.02 21 11 C23.64 11 26.28 11 29 11 C29 9.68 29 8.36 29 7 C33.03174806 7.27489191 34.56894631 7.53491576 37.375 10.5625 C37.91125 11.366875 38.4475 12.17125 39 13 C40.299375 11.515 40.299375 11.515 41.625 10 C43.98742151 7.63757849 44.64151897 7.05121158 48.0625 6.5625 C50.73541397 6.96059357 53.36915068 7.38097663 56 8 C56.103125 7.38125 56.20625 6.7625 56.3125 6.125 C57 4 57 4 60 2 C62.74341518 1.54229325 65.42742471 1.16908662 68.1875 0.875 C68.93708984 0.78863281 69.68667969 0.70226562 70.45898438 0.61328125 C72.30517412 0.40161618 74.15249344 0.19984536 76 0 C75.67 3.3 75.34 6.6 75 10 C73.5459375 9.01 73.5459375 9.01 72.0625 8 C69.4700747 5.90886852 69.4700747 5.90886852 68 6 C67.5875 6.474375 67.175 6.94875 66.75 7.4375 C64.57162486 9.38247781 62.85177436 9.61462509 60 10 C60.495 11.98 60.495 11.98 61 14 C60.34 14.33 59.68 14.66 59 15 C65.68993219 14.46048934 71.63460728 13.11293829 78 11 C76.91434445 21.54228674 75.64368769 32.05858153 74.26208496 42.56610107 C74.00457805 44.52762726 73.75079036 46.48964055 73.49707031 48.45166016 C71.11153926 66.39938347 71.11153926 66.39938347 68.33984375 70.390625 C57.08146856 78.13428206 41.0912785 78.30427828 28 77 C25.38726212 76.50737681 22.80702597 75.95559288 20.22436523 75.32446289 C17.8326973 74.97559595 16.28017135 75.25794395 14 76 C14.66 76.33 15.32 76.66 16 77 C16 79.31 16 81.62 16 84 C15.34 84 14.68 84 14 84 C14 84.99 14 85.98 14 87 C8.25 85.25 8.25 85.25 6 83 C5.57274316 80.2346988 5.24873492 77.53214609 5 74.75 C4.48247061 69.30635754 3.86146313 63.8999227 3.0703125 58.48828125 C1.96495334 50.9035487 1.03293758 43.30422199 0.14013672 35.69213867 C-0.12843676 33.40827487 -0.40201534 31.12504343 -0.67578125 28.84179688 C-0.84925919 27.37243132 -1.02244722 25.90303151 -1.1953125 24.43359375 C-1.35016113 23.12447021 -1.50500977 21.81534668 -1.66455078 20.46655273 C-1.94105558 17.60913523 -2.07081682 14.86601878 -2 12 C-1.01 12 -0.02 12 1 12 C0.67 11.67 0.34 11.34 0 11 C-0.07226502 9.14712498 -0.0838122 7.29166122 -0.0625 5.4375 C-0.05347656 4.42558594 -0.04445312 3.41367188 -0.03515625 2.37109375 C-0.02355469 1.58863281 -0.01195312 0.80617187 0 0 Z " fill="#550807" transform="translate(189,144)"/>
<path d="M0 0 C3.71000441 2.19298989 6.0236187 5.34989742 8.6953125 8.66796875 C11.35875919 11.28126687 14.07622251 12.05757073 17.64453125 12.9296875 C19.5625 13.5 19.5625 13.5 21.5625 15.5 C21.0675 16.985 21.0675 16.985 20.5625 18.5 C20.005625 17.860625 19.44875 17.22125 18.875 16.5625 C16.34183439 14.30319013 14.87908576 13.86850953 11.5625 13.5 C12.0575 17.46 12.0575 17.46 12.5625 21.5 C4.07561539 23.79967196 -3.64356372 24.92781312 -12.4375 24.5 C-12.4375 23.84 -12.4375 23.18 -12.4375 22.5 C-15.4075 22.995 -15.4075 22.995 -18.4375 23.5 C-18.4375 23.83 -18.4375 24.16 -18.4375 24.5 C-24.7075 24.83 -30.9775 25.16 -37.4375 25.5 C-7.339814 26.71333989 -7.339814 26.71333989 21.5625 19.5 C21.8925 18.84 22.2225 18.18 22.5625 17.5 C23.2225 17.5 23.8825 17.5 24.5625 17.5 C23.56168903 25.70651101 22.52616749 33.90629682 21.37890625 42.09375 C21.27804718 42.81449203 21.17718811 43.53523407 21.07327271 44.27781677 C20.53644052 48.10155261 19.99261879 51.92422825 19.44433594 55.74633789 C18.4503608 62.72868493 17.49735505 69.68603019 16.88671875 76.71484375 C15.76595487 89.27255876 14.02056329 96.94055284 5.5625 106.5 C4.32894677 108.24691074 3.09935788 109.99663225 1.875 111.75 C-0.06188744 114.49267265 -0.81727135 115.36563766 -4.14111328 116.08569336 C-9.95670745 116.8166268 -15.77046637 116.76839251 -21.625 116.8125 C-23.52088867 116.85600586 -23.52088867 116.85600586 -25.45507812 116.90039062 C-35.6132678 116.96870747 -43.91872501 115.19980556 -52.4375 109.5 C-54.84897221 105.88279168 -55.11059174 102.71887104 -55.5859375 98.51171875 C-55.6832869 97.70897018 -55.78063629 96.90622162 -55.88093567 96.07914734 C-56.08976015 94.35003831 -56.29495812 92.62048825 -56.49691772 90.89056396 C-56.92121832 87.25629255 -57.36260181 83.62416087 -57.80308533 79.99182129 C-58.02604653 78.15168008 -58.24809829 76.31142846 -58.46925354 74.47106934 C-59.45709132 66.26350091 -60.52327302 58.06796773 -61.625 49.875 C-61.77952637 48.71830811 -61.93405273 47.56161621 -62.09326172 46.36987305 C-62.70450979 41.82135117 -63.32275185 37.27537971 -63.99462891 32.73535156 C-64.17815918 31.49495117 -64.36168945 30.25455078 -64.55078125 28.9765625 C-64.72005127 27.85588379 -64.88932129 26.73520508 -65.0637207 25.58056641 C-65.3956962 22.84453319 -65.51027282 20.2512616 -65.4375 17.5 C-64.8084375 17.84933594 -64.179375 18.19867188 -63.53125 18.55859375 C-58.02771685 21.48441785 -53.66866607 23.15382411 -47.4375 23.5 C-47.19 22.778125 -46.9425 22.05625 -46.6875 21.3125 C-45.23976634 18.05509926 -44.07445221 15.92877177 -41.4375 13.5 C-38.63705607 13.07081319 -36.29453482 13.26191376 -33.4375 13.5 C-33.1075 12.51 -32.7775 11.52 -32.4375 10.5 C-48.1572498 11.50807043 -48.1572498 11.50807043 -62.4375 17.5 C-61.44394804 14.29855481 -60.47850122 13.52268152 -57.5 11.875 C-50.6448217 9.26889916 -43.52706752 8.52382898 -36.25 8.3125 C-30.66369741 7.93573251 -27.97135507 6.19893987 -24.15625 2.19140625 C-18.27308754 -3.59816044 -7.22109719 -3.2062239 0 0 Z M-58.4375 24.5 C-58.4375 25.28246094 -58.4375 26.06492188 -58.4375 26.87109375 C-58.4375 30.08072917 -58.4375 33.29036458 -58.4375 36.5 C-59.0975 36.5 -59.7575 36.5 -60.4375 36.5 C-59.7867029 46.06154899 -58.83246088 55.57030639 -57.76293945 65.0925293 C-57.50078769 67.43047515 -57.24333221 69.7689052 -56.98632812 72.10742188 C-56.07679684 80.30411478 -55.06296494 88.46600473 -53.8269043 96.62084961 C-53.4375 99.5 -53.4375 99.5 -53.30395508 101.98657227 C-53.23359598 104.35193586 -53.23359598 104.35193586 -52.4375 107.5 C-48.8971673 110.621437 -48.8971673 110.621437 -44.4375 111.5 C-44.4375 110.51 -44.4375 109.52 -44.4375 108.5 C-43.7775 108.5 -43.1175 108.5 -42.4375 108.5 C-42.27072718 105.08343976 -42.27072718 105.08343976 -42.4375 101.5 C-43.0975 100.84 -43.7575 100.18 -44.4375 99.5 C-42.66630197 99.64133499 -40.89554713 99.78823208 -39.125 99.9375 C-37.64580078 100.05931641 -37.64580078 100.05931641 -36.13671875 100.18359375 C-33.4375 100.5 -33.4375 100.5 -30.4375 101.5 C-20.22967004 102.48511919 -9.81823917 102.2008958 0.0625 99.375 C0.74908691 99.18728027 1.43567383 98.99956055 2.14306641 98.80615234 C6.0177552 97.56179046 9.12507906 95.88241179 11.57910156 92.57080078 C13.87432174 87.73761866 14.1095951 82.25655501 14.6875 77 C15.00764361 74.39711464 15.32795798 71.79425027 15.6484375 69.19140625 C15.80022461 67.8986377 15.95201172 66.60586914 16.10839844 65.27392578 C16.76498529 59.81719481 17.53955603 54.37872864 18.3125 48.9375 C18.56043427 47.18664006 18.80549659 45.43536954 19.046875 43.68359375 C19.14709961 42.96743896 19.24732422 42.25128418 19.35058594 41.51342773 C19.63228149 39.17442032 19.63228149 39.17442032 19.5625 35.5 C18.94503906 35.70496094 18.32757813 35.90992188 17.69140625 36.12109375 C11.93539724 37.95215293 6.58271684 39.01449864 0.5625 39.5 C1.2225 39.17 1.8825 38.84 2.5625 38.5 C2.0675 36.52 2.0675 36.52 1.5625 34.5 C3.8725 33.84 6.1825 33.18 8.5625 32.5 C8.8925 31.18 9.2225 29.86 9.5625 28.5 C10.738125 29.7065625 10.738125 29.7065625 11.9375 30.9375 C14.28232856 33.48690417 14.28232856 33.48690417 16.5625 34.5 C16.8925 31.2 17.2225 27.9 17.5625 24.5 C14.95692509 24.78184585 12.35349602 25.07502711 9.75 25.375 C9.01201172 25.45363281 8.27402344 25.53226563 7.51367188 25.61328125 C3.84743819 26.04460286 1.68298255 26.4196783 -1.4375 28.5 C-2.16132467 30.55925139 -2.16132467 30.55925139 -2.4375 32.5 C-3.52417969 32.28730469 -3.52417969 32.28730469 -4.6328125 32.0703125 C-10.27821355 31.03399616 -10.27821355 31.03399616 -15.50390625 32.76953125 C-17.33716098 34.58678699 -17.33716098 34.58678699 -19.4375 37.5 C-19.97375 36.695625 -20.51 35.89125 -21.0625 35.0625 C-23.86855369 32.03491576 -25.40575194 31.77489191 -29.4375 31.5 C-29.4375 32.82 -29.4375 34.14 -29.4375 35.5 C-32.0775 35.5 -34.7175 35.5 -37.4375 35.5 C-37.08963292 37.47536745 -37.08963292 37.47536745 -36.4375 39.5 C-33.82798764 40.80475618 -31.91048715 40.61301572 -28.9921875 40.59765625 C-27.5378833 40.59390991 -27.5378833 40.59390991 -26.05419922 40.59008789 C-24.81943848 40.58098389 -23.58467773 40.57187988 -22.3125 40.5625 C-18.39375 40.541875 -14.475 40.52125 -10.4375 40.5 C-19.0175 40.83 -27.5975 41.16 -36.4375 41.5 C-36.4375 42.49 -36.4375 43.48 -36.4375 44.5 C-35.798125 44.603125 -35.15875 44.70625 -34.5 44.8125 C-33.819375 45.039375 -33.13875 45.26625 -32.4375 45.5 C-32.1075 46.49 -31.7775 47.48 -31.4375 48.5 C-32.4275 48.5 -33.4175 48.5 -34.4375 48.5 C-33.7775 51.47 -33.1175 54.44 -32.4375 57.5 C-33.4275 57.5 -34.4175 57.5 -35.4375 57.5 C-35.4375 58.16 -35.4375 58.82 -35.4375 59.5 C-37.7475 59.5 -40.0575 59.5 -42.4375 59.5 C-42.7675 60.49 -43.0975 61.48 -43.4375 62.5 C-44.4275 62.995 -44.4275 62.995 -45.4375 63.5 C-47.85635201 50.89109061 -49.62839483 38.31792925 -50.4375 25.5 C-53.0775 25.17 -55.7175 24.84 -58.4375 24.5 Z " fill="#F2B057" transform="translate(247.4375,119.5)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C0.74913936 5.17802095 -0.15640015 7.77969351 -3.99804688 11.33007812 C-4.77245117 12.00200195 -4.77245117 12.00200195 -5.5625 12.6875 C-7.49917927 14.39859333 -9.23206172 16.09808288 -11 18 C-11 19.32 -11 20.64 -11 22 C-3.82337263 22.69451233 -0.13523234 21.41937028 5.8359375 17.41015625 C8 16 8 16 11 15 C11 14.34 11 13.68 11 13 C13 11.375 13 11.375 15 10 C15.99 10.495 15.99 10.495 17 11 C16.13375 11.99 16.13375 11.99 15.25 13 C10.95552103 18.72597196 8.13192104 23.62132885 9 31 C9.99 32.485 9.99 32.485 11 34 C13.66653905 34.36460453 13.66653905 34.36460453 16.625 34.1875 C18.12933594 34.14689453 18.12933594 34.14689453 19.6640625 34.10546875 C20.82035156 34.05326172 20.82035156 34.05326172 22 34 C21.01 35.32 20.02 36.64 19 38 C19.99 37.67 20.98 37.34 22 37 C21 39 20 41 19 43 C21.92602589 41.86210104 23.634659 40.7122171 25.08203125 37.890625 C25.75056539 36.17534219 26.39551138 34.45072351 27.01953125 32.71875 C27.98507252 30.04139253 29.08031412 27.46882974 30.25 24.875 C30.58515625 24.12992188 30.9203125 23.38484375 31.265625 22.6171875 C31.62914062 21.81667969 31.62914062 21.81667969 32 21 C33.09898702 24.29696105 32.87124444 25.40494903 32.0625 28.6875 C31.86785156 29.49574219 31.67320312 30.30398437 31.47265625 31.13671875 C31.23869141 32.05904297 31.23869141 32.05904297 31 33 C32.299375 32.979375 33.59875 32.95875 34.9375 32.9375 C36.29165633 32.91600546 37.64756083 32.92851801 39 33 C40 34 40 34 40.25 36.875 C40 40 40 40 38.8125 41.875 C36.43963721 43.34781139 34.74086056 43.22223194 32 43 C31.67 42.01 31.34 41.02 31 40 C30.34 40 29.68 40 29 40 C29.495 40.9590625 29.495 40.9590625 30 41.9375 C31 44 31 44 31 45 C32.27875 44.95875 33.5575 44.9175 34.875 44.875 C40.08872856 44.85842217 44.94007672 45.81688642 50 47 C50 46.01 50 45.02 50 44 C51.32 44 52.64 44 54 44 C55 47 56 50 57 53 C58.65 53.33 60.3 53.66 62 54 C62 55.32 62 56.64 62 58 C65.3 58 68.6 58 72 58 C72 58.66 72 59.32 72 60 C71.34 60 70.68 60 70 60 C70.99 61.98 71.98 63.96 73 66 C72.34 66 71.68 66 71 66 C70.67 66.99 70.34 67.98 70 69 C56.73410125 75.62931189 39.93025813 75.28858612 25.5 75.3125 C24.80420837 75.31599457 24.10841675 75.31948914 23.39154053 75.3230896 C11.53424541 75.35616361 11.53424541 75.35616361 8 73 C18.395 72.505 18.395 72.505 29 72 C29 71.67 29 71.34 29 71 C31.31 71 33.62 71 36 71 C36 71.66 36 72.32 36 73 C38.85432471 72.68889371 41.70845525 72.37615574 44.5625 72.0625 C45.36236328 71.97548828 46.16222656 71.88847656 46.98632812 71.79882812 C51.67256697 71.28238548 56.33680546 70.69478469 61 70 C60.01 65.545 60.01 65.545 59 61 C62.75519057 61.51207144 65.66688525 62.2175082 69 64 C68.45730469 63.71125 67.91460937 63.4225 67.35546875 63.125 C66.64003906 62.75375 65.92460937 62.3825 65.1875 62 C64.47980469 61.62875 63.77210938 61.2575 63.04296875 60.875 C60.91079271 59.80314642 60.91079271 59.80314642 58 60 C56.6459068 58.01399663 55.31542376 56.01182457 54 54 C47.69908554 48.18377127 41.90296676 47.44629314 33.52734375 47.54296875 C27.69523026 48.29862465 23.47333274 51.18208393 19.62963867 55.5612793 C16.8246698 58.03763608 13.09267758 57.73308814 9.5 58 C-0.97188518 58.95990395 -0.97188518 58.95990395 -11 62 C-11.495 62.99 -11.495 62.99 -12 64 C-11.21625 63.54625 -10.4325 63.0925 -9.625 62.625 C-1.30273565 58.89432978 6.99235458 58.72141303 16 59 C15.67 60.32 15.34 61.64 15 63 C13.80375 62.814375 12.6075 62.62875 11.375 62.4375 C9.15595247 62.29954741 9.15595247 62.29954741 7 63 C4.46833125 65.71704199 2.71795977 68.72025861 1 72 C2.98 72 4.96 72 7 72 C7 72.33 7 72.66 7 73 C-1.24003056 73.29428681 -7.73073463 72.07788057 -15 68 C-15.33 67.67 -15.66 67.34 -16 67 C-14.87526671 77.92175219 -13.52388527 88.80569438 -12.0625 99.6875 C-11.89041016 100.96963379 -11.71832031 102.25176758 -11.54101562 103.57275391 C-10.87149376 108.54965848 -10.19990689 113.52627738 -9.52490234 118.50244141 C-9.09644359 121.66783711 -8.67275671 124.83383855 -8.25 128 C-8.12246338 128.93030029 -7.99492676 129.86060059 -7.86352539 130.8190918 C-6.66311684 139.85374566 -6.66311684 139.85374566 -7 144 C-7.66 144.66 -8.32 145.32 -9 146 C-9.33 145.01 -9.66 144.02 -10 143 C-10.66 143 -11.32 143 -12 143 C-12 144.32 -12 145.64 -12 147 C-12.66 147.33 -13.32 147.66 -14 148 C-13.67 148.99 -13.34 149.98 -13 151 C-13.99 151.33 -14.98 151.66 -16 152 C-15.95875 153.258125 -15.9175 154.51625 -15.875 155.8125 C-15.7609626 159.29064073 -15.94074319 159.91111478 -18 163 C-18.16713569 165.62531524 -18.16713569 165.62531524 -18 168 C-20.97 168.33 -23.94 168.66 -27 169 C-27 167.68 -27 166.36 -27 165 C-27.66 165 -28.32 165 -29 165 C-29 165.66 -29 166.32 -29 167 C-31.475 167.99 -31.475 167.99 -34 169 C-33.505 172.465 -33.505 172.465 -33 176 C-35.38564077 175.42415568 -37.66682784 174.77772405 -40 174 C-39.49513181 169.65813356 -39.04988547 166.23472702 -36 163 C-32.672309 162.27005488 -29.4004621 162.07017839 -26 162 C-26 160.35 -26 158.7 -26 157 C-27.65 157 -29.3 157 -31 157 C-31 156.01 -31 155.02 -31 154 C-31.66 153.67 -32.32 153.34 -33 153 C-32.01 152.34 -31.02 151.68 -30 151 C-29.42251197 149.03638136 -29.42251197 149.03638136 -29.3125 146.875 C-29.209375 145.59625 -29.10625 144.3175 -29 143 C-29.99 143 -30.98 143 -32 143 C-32 143.66 -32 144.32 -32 145 C-38.45 149.09326923 -38.45 149.09326923 -41.234375 148.62109375 C-42.10835937 148.31365234 -42.10835937 148.31365234 -43 148 C-42.32195312 147.59910156 -41.64390625 147.19820312 -40.9453125 146.78515625 C-30.57881575 140.45326557 -19.3005356 132.31271719 -14 121 C-14.82177734 121.63615234 -14.82177734 121.63615234 -15.66015625 122.28515625 C-34.56732738 136.27338855 -56.89545712 142.42734304 -80.1875 142.125 C-81.53449847 142.1149393 -82.88150431 142.10581897 -84.22851562 142.09765625 C-87.48587021 142.07430604 -90.74283549 142.0415577 -94 142 C-94 141.67 -94 141.34 -94 141 C-92.79601562 140.93941406 -91.59203125 140.87882813 -90.3515625 140.81640625 C-88.77602923 140.73200268 -87.20050904 140.64735459 -85.625 140.5625 C-84.8309375 140.52318359 -84.036875 140.48386719 -83.21875 140.44335938 C-78.97398779 140.31106596 -78.97398779 140.31106596 -75 139 C-75.99 138.67 -76.98 138.34 -78 138 C-78 136.68 -78 135.36 -78 134 C-78.66 134 -79.32 134 -80 134 C-80 134.66 -80 135.32 -80 136 C-80.66 136 -81.32 136 -82 136 C-81.34 134.35 -80.68 132.7 -80 131 C-79.01 131 -78.02 131 -77 131 C-77 130.34 -77 129.68 -77 129 C-74.36 129 -71.72 129 -69 129 C-69 129.33 -69 129.66 -69 130 C-71.31 130 -73.62 130 -76 130 C-76 130.66 -76 131.32 -76 132 C-57.99917787 131.557437 -42.38524965 130.19262483 -26 122 C-25.87625 121.39414063 -25.7525 120.78828125 -25.625 120.1640625 C-24.78600246 117.2590335 -23.32685843 116.26141737 -21 114.375 C-18.04427685 112.05444701 -18.04427685 112.05444701 -16 109 C-15.46127614 101.20774422 -16.41105309 93.57611104 -17.5 85.875 C-18.48281785 78.87131605 -19.38315103 72.08119862 -19 65 C-17.125 62.75 -17.125 62.75 -15 61 C-14.76796875 60.2884375 -14.5359375 59.576875 -14.296875 58.84375 C-12.08061129 53.98399101 -7.9954457 50.59730617 -4.23046875 46.87890625 C0.16218836 42.37480753 5 36.64688427 5 30 C4.67128906 30.45890625 4.34257812 30.9178125 4.00390625 31.390625 C0.11707667 36.40452982 -3.87934026 39.20831597 -10 41 C-11.32 41 -12.64 41 -14 41 C-14.99 38.525 -14.99 38.525 -16 36 C-17.32 36 -18.64 36 -20 36 C-20 35.34 -20 34.68 -20 34 C-15.38 32.35 -10.76 30.7 -6 29 C-6 28.34 -6 27.68 -6 27 C-6.69867188 26.87882812 -7.39734375 26.75765625 -8.1171875 26.6328125 C-9.02726562 26.46523437 -9.93734375 26.29765625 -10.875 26.125 C-11.77992188 25.96257812 -12.68484375 25.80015625 -13.6171875 25.6328125 C-16 25 -16 25 -18 23 C-18.06316957 19.86859396 -17.66716474 17.8085825 -15.64550781 15.35839844 C-13.85801265 13.6263454 -12.01741548 11.9916743 -10.125 10.375 C-8.85416731 9.26077498 -7.58585517 8.14366734 -6.3203125 7.0234375 C-5.73282227 6.50491211 -5.14533203 5.98638672 -4.54003906 5.45214844 C-2.77944185 3.79202919 -1.38248366 1.98188217 0 0 Z " fill="#330C1E" transform="translate(199,71)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.02691685 2.45840605 1.04679802 4.91651882 1.0625 7.375 C1.07087891 8.07367188 1.07925781 8.77234375 1.08789062 9.4921875 C1.11328125 14.7734375 1.11328125 14.7734375 0 17 C0.99 17.33 1.98 17.66 3 18 C2.67 19.65 2.34 21.3 2 23 C2.99 23.33 3.98 23.66 5 24 C5 23.34 5 22.68 5 22 C6.55966218 21.491217 8.12289241 20.99336531 9.6875 20.5 C10.55761719 20.2215625 11.42773438 19.943125 12.32421875 19.65625 C14.99391677 19.00149195 17.26396684 18.88168505 20 19 C18.96780191 23.64489142 17.11857423 27.76285154 15 32 C14.67 32.99 14.34 33.98 14 35 C15.65 33.68 17.3 32.36 19 31 C19.66 31.33 20.32 31.66 21 32 C20.67 32.99 20.34 33.98 20 35 C20.99 34.505 20.99 34.505 22 34 C24.6723621 33.86584528 27.32250488 33.95681459 30 34 C30 34.99 30 35.98 30 37 C32.64 36.34 35.28 35.68 38 35 C37.855625 34.278125 37.71125 33.55625 37.5625 32.8125 C38.07096846 29.54377418 38.53027658 29.18873356 41.0625 27.25 C44.66932473 24.93236162 47.69682398 24.30197726 52 24 C53.40857665 23.83673428 54.8161658 23.66473158 56.22265625 23.484375 C57.46917969 23.32453125 58.71570313 23.1646875 60 23 C64.19630176 32.84244935 68.34088618 42.60975895 71 53 C71.2990625 54.12921875 71.598125 55.2584375 71.90625 56.421875 C76.26097143 76.17940743 76.23635531 100.44812493 71 120 C70.83371094 120.6403418 70.66742188 121.28068359 70.49609375 121.94042969 C68.31090019 130.18346539 65.29240118 138.00566123 61.875 145.8125 C61.36996948 146.96963501 61.36996948 146.96963501 60.85473633 148.15014648 C60.52884521 148.87016846 60.2029541 149.59019043 59.8671875 150.33203125 C59.57956543 150.96858643 59.29194336 151.6051416 58.99560547 152.26098633 C57.89772554 154.17864173 56.62138159 155.51053809 55 157 C54.76132289 150.152436 55.69372836 143.74636421 56.8125 137 C58.68831755 125.26989869 60.26642112 113.52835211 61.66650391 101.73291016 C61.98986519 99.08305203 62.33986994 96.43816119 62.69921875 93.79296875 C62.80347168 92.99898682 62.90772461 92.20500488 63.01513672 91.38696289 C63.20762108 89.92278591 63.40795923 88.45961101 63.61767578 86.99780273 C63.82886579 85.34040206 63.92567409 83.66914765 64 82 C63.34 81.34 62.68 80.68 62 80 C62 79.01 62 78.02 62 77 C62.66 77 63.32 77 64 77 C64 76.34 64 75.68 64 75 C63.01 75 62.02 75 61 75 C60.67 75.66 60.34 76.32 60 77 C60 76.34 60 75.68 60 75 C59.071875 75.2784375 59.071875 75.2784375 58.125 75.5625 C56 76 56 76 54 75 C54 73.68 54 72.36 54 71 C52.35 71 50.7 71 49 71 C48.67 70.01 48.34 69.02 48 68 C47.01 67.505 47.01 67.505 46 67 C46.66 67 47.32 67 48 67 C47.34 65.02 46.68 63.04 46 61 C44.68 61 43.36 61 42 61 C42 61.99 42 62.98 42 64 C41.10861328 63.89171875 41.10861328 63.89171875 40.19921875 63.78125 C33.77437359 63.06182721 27.46152127 62.88944165 21 63 C21.33 62.01 21.66 61.02 22 60 C21.67 59.01 21.34 58.02 21 57 C21.66 57 22.32 57 23 57 C23.33 57.66 23.66 58.32 24 59 C26.31 59 28.62 59 31 59 C31 56.36 31 53.72 31 51 C28.36 50.67 25.72 50.34 23 50 C22.78807779 44.80790596 23.4087311 40.873261 25 36 C24.34 36 23.68 36 23 36 C22.73058594 36.58523437 22.46117187 37.17046875 22.18359375 37.7734375 C20.99937503 40.00117569 19.71029447 41.721441 18.0625 43.625 C17.55847656 44.21539062 17.05445313 44.80578125 16.53515625 45.4140625 C15 47 15 47 12 49 C8.67759676 48.6758631 7.39223697 48.39223697 5 46 C3.80172156 38.96011414 7.13446141 33.7270344 11 28 C13.18440734 25.47550529 15.47848319 23.18581191 18 21 C11.06162109 22.81990266 6.31952592 25.6478375 0.67578125 30.0625 C-2.13105593 32.09489597 -4.79931032 33.66893343 -8 35 C-8.99 34.67 -9.98 34.34 -11 34 C-9.15234666 29.15879294 -6.81162784 24.63502895 -4.4375 20.03515625 C-2.08724548 15.0727982 -0.77571625 10.60145545 -0.375 5.125 C-0.30023438 4.15820312 -0.22546875 3.19140625 -0.1484375 2.1953125 C-0.09945312 1.47085938 -0.05046875 0.74640625 0 0 Z " fill="#0F1031" transform="translate(207,54)"/>
<path d="M0 0 C1.14605713 0.01095703 2.29211426 0.02191406 3.47290039 0.03320312 C11.98140981 0.25126131 18.70582161 1.12829717 26.125 5.5625 C27.09179688 6.13226563 28.05859375 6.70203125 29.0546875 7.2890625 C40.3251798 14.71109401 46.48832313 24.96234635 49.703125 37.88671875 C50.2609059 41.42449573 50.38773647 44.92697832 50.4375 48.5 C50.48100586 49.53543945 50.48100586 49.53543945 50.52539062 50.59179688 C50.5891722 55.76791662 49.33550141 58.56575334 46.125 62.5625 C45.135 63.5525 45.135 63.5525 44.125 64.5625 C41.30197156 64.34534397 39.61414217 63.94682599 37.375 62.1875 C34.78315999 58.81810799 35.01385762 55.53818804 35.01953125 51.4609375 C35.00470703 50.24792969 34.98988281 49.03492188 34.97460938 47.78515625 C34.95009693 45.24360245 34.94452836 42.70178714 34.95898438 40.16015625 C34.81809185 32.07377907 33.76086596 26.57501394 28.125 20.5625 C25.56750667 18.61880507 24.01713735 17.64910948 21.125 16.5625 C20.35285156 16.26601562 19.58070313 15.96953125 18.78515625 15.6640625 C7.24512387 12.054698 -8.67624225 10.87284313 -19.8125 16.125 C-22.52277134 17.74491763 -22.52277134 17.74491763 -24.875 19.5625 C-25.55433594 20.06910156 -26.23367187 20.57570313 -26.93359375 21.09765625 C-32.84835942 26.2746662 -38.26386688 35.56024446 -39.06787109 43.45678711 C-39.5645328 56.60628192 -38.84484944 66.8309299 -30.1875 77.4375 C-23.20852246 84.70671857 -14.3761862 89.71730196 -4.16479492 89.94189453 C-3.15509644 89.93971924 -3.15509644 89.93971924 -2.125 89.9375 C-1.42415283 89.93733887 -0.72330566 89.93717773 -0.0012207 89.93701172 C7.3291975 89.77679321 13.04529698 87.61563535 19.125 83.5625 C17.41043084 89.22057823 14.01081662 93.89702871 8.87109375 96.86328125 C0.48813303 100.66116296 -9.05065263 102.60772344 -18 99.375 C-19.30063297 98.79038559 -20.59206337 98.18498996 -21.875 97.5625 C-23.02548828 97.08683594 -23.02548828 97.08683594 -24.19921875 96.6015625 C-36.43799228 91.18345553 -45.16832127 81.77690825 -50.12109375 69.46484375 C-52.68210049 62.02994875 -53.53209519 55.38405239 -52.875 47.5625 C-52.81570312 46.69367188 -52.75640625 45.82484375 -52.6953125 44.9296875 C-51.1543644 32.33901404 -43.90754008 19.10444734 -34 11.296875 C-23.20664797 3.30899202 -13.54365243 -0.18311647 0 0 Z " fill="#F8EFDD" transform="translate(111.875,99.4375)"/>
<path d="M0 0 C1.33333333 0 2.66666667 0 4 0 C3.95875 1.093125 3.9175 2.18625 3.875 3.3125 C3.67925334 7.08892229 3.67925334 7.08892229 6 10 C8.58380177 10.25030977 8.58380177 10.25030977 11 10 C11.66 8.02 12.32 6.04 13 4 C14 7 14 7 14 9 C16.475 9.495 16.475 9.495 19 10 C19 10.66 19 11.32 19 12 C20.65 12 22.3 12 24 12 C24 11.34 24 10.68 24 10 C25.32 10.33 26.64 10.66 28 11 C27.41203275 16.21820931 25.68573337 20.36185656 23.5 25.0625 C21.48932538 29.41088669 19.92764765 33.28148454 19 38 C18.01 38.495 18.01 38.495 17 39 C16.54962107 42.02267741 16.22800124 44.95847482 16 48 C15.93377441 48.845625 15.86754883 49.69125 15.79931641 50.5625 C15.60961517 53.20736341 15.45702464 55.85230853 15.3125 58.5 C15.25255859 59.38558594 15.19261719 60.27117187 15.13085938 61.18359375 C14.84999429 66.42384362 15.17429143 70.93659469 16.55151367 76.00976562 C17 78 17 78 17 82 C15.68 82 14.36 82 13 82 C13 83.32 13 84.64 13 86 C11.515 86.495 11.515 86.495 10 87 C10.495 87.495 10.495 87.495 11 88 C10.93576561 90.33579609 10.79882576 92.66979528 10.625 95 C10.53476562 96.27875 10.44453125 97.5575 10.3515625 98.875 C10 102 10 102 9 103 C9.09017996 105.19050021 9.24666208 107.378466 9.4375 109.5625 C9.53933594 110.76003906 9.64117188 111.95757812 9.74609375 113.19140625 C9.87177734 114.58166016 9.87177734 114.58166016 10 116 C9.01 116.495 9.01 116.495 8 117 C2.81451974 105.88274207 -1.91188552 94.89163464 -5 83 C-5.3196875 81.80632812 -5.639375 80.61265625 -5.96875 79.3828125 C-11.76360896 53.14497885 -8.55712665 25.13021779 0 0 Z " fill="#2F1334" transform="translate(8,91)"/>
<path d="M0 0 C0 0.33 0 0.66 0 1 C-1.61068359 1.27263672 -1.61068359 1.27263672 -3.25390625 1.55078125 C-4.69018289 1.80424183 -6.12637648 2.05817328 -7.5625 2.3125 C-8.26697266 2.43044922 -8.97144531 2.54839844 -9.69726562 2.66992188 C-14.5184484 3.53640173 -18.55155396 4.95022584 -23 7 C-24.99263591 7.68836513 -26.99041337 8.36281399 -29 9 C-27.68 9.66 -26.36 10.32 -25 11 C-26.2684375 12.0209375 -26.2684375 12.0209375 -27.5625 13.0625 C-30.36410913 15.82941311 -30.36410913 15.82941311 -30.125 19.625 C-29.30363891 23.15034548 -29.30363891 23.15034548 -26.4375 24.9375 C-25.633125 25.288125 -24.82875 25.63875 -24 26 C-24 24.68 -24 23.36 -24 22 C-23.360625 22.185625 -22.72125 22.37125 -22.0625 22.5625 C-21.381875 22.706875 -20.70125 22.85125 -20 23 C-19.505 22.505 -19.505 22.505 -19 22 C-17.00041636 21.95919217 -14.99954746 21.95745644 -13 22 C-13.1875 24.3125 -13.1875 24.3125 -14 27 C-16.375 28.6875 -16.375 28.6875 -19 30 C-19.99 30.66 -20.98 31.32 -22 32 C-22.86625 32.28875 -23.7325 32.5775 -24.625 32.875 C-25.40875 33.24625 -26.1925 33.6175 -27 34 C-27.33 35.32 -27.66 36.64 -28 38 C-32.95 38.495 -32.95 38.495 -38 39 C-36.68 39.33 -35.36 39.66 -34 40 C-34 40.66 -34 41.32 -34 42 C-35.63631892 43.04892238 -37.30485863 44.04906703 -39 45 C-39.33 45.33 -39.66 45.66 -40 46 C-41.99958364 46.04080783 -44.00045254 46.04254356 -46 46 C-46 46.99 -46 47.98 -46 49 C-46.99 49 -47.98 49 -49 49 C-49 48.01 -49 47.02 -49 46 C-51.16666667 46.83333333 -51.16666667 46.83333333 -52 49 C-54.0625 50.125 -54.0625 50.125 -56 51 C-56 51.99 -56 52.98 -56 54 C-55.38125 53.505 -54.7625 53.01 -54.125 52.5 C-52 51 -52 51 -50 51 C-49.92528266 54.8853017 -50.02763494 58.24944905 -51 62 C-50.67 62.66 -50.34 63.32 -50 64 C-52.39509338 66.89932357 -54.31245243 67.50168276 -58 68 C-58.309375 67.195625 -58.61875 66.39125 -58.9375 65.5625 C-59.76335345 63.10919595 -59.76335345 63.10919595 -61 62 C-61.66 63.32 -62.32 64.64 -63 66 C-63.495 65.01 -63.495 65.01 -64 64 C-64.66 64 -65.32 64 -66 64 C-66 64.66 -66 65.32 -66 66 C-67.32 65.67 -68.64 65.34 -70 65 C-70.36279456 63.71073008 -70.71496698 62.41846728 -71.0625 61.125 C-71.35833984 60.04605469 -71.35833984 60.04605469 -71.66015625 58.9453125 C-72 57 -72 57 -71 55 C-74.74667202 56.6327851 -74.74667202 56.6327851 -78 59 C-81.08638202 59.33366292 -82.61536475 59.22870204 -85.3125 57.625 C-85.869375 57.08875 -86.42625 56.5525 -87 56 C-87 55.34 -87 54.68 -87 54 C-88.32 53.67 -89.64 53.34 -91 53 C-91 52.34 -91 51.68 -91 51 C-92.98 51.495 -92.98 51.495 -95 52 C-75.56041304 24.02224151 -42.4514807 6.76076416 -9.625 0.33984375 C-6.39950941 -0.07774209 -3.24833752 -0.06496675 0 0 Z " fill="#3EA9E3" transform="translate(125,1)"/>
<path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C1.828125 4.1015625 1.828125 4.1015625 1.25 6.625 C1.06953125 7.44226563 0.8890625 8.25953125 0.703125 9.1015625 C0.17309587 11.28646036 -0.42472447 13.45507456 -1.0546875 15.61328125 C-6.16652591 36.10885977 -0.54370159 57.32641749 10 75 C12.60312078 78.83753718 15.31272025 82.4354315 18.71875 85.59375 C19.1415625 86.0578125 19.564375 86.521875 20 87 C19.6875 89.1875 19.6875 89.1875 19 91 C19 90.34 19 89.68 19 89 C18.34 89 17.68 89 17 89 C17.65484375 89.68449219 18.3096875 90.36898437 18.984375 91.07421875 C21.44271732 94.6426265 21.42284693 96.53453856 21.25 100.8125 C21.21390625 101.97394531 21.1778125 103.13539063 21.140625 104.33203125 C21.09421875 105.21246094 21.0478125 106.09289062 21 107 C23.64 106.67 26.28 106.34 29 106 C29 106.66 29 107.32 29 108 C25.535 108.99 25.535 108.99 22 110 C22.99 110 23.98 110 25 110 C25 110.66 25 111.32 25 112 C23.68 112 22.36 112 21 112 C21 112.99 21 113.98 21 115 C18.23735711 115.59732819 15.83967231 116 13 116 C13 116.66 13 117.32 13 118 C10.69 118.99 8.38 119.98 6 121 C0.16784683 114.43746503 -5.36791922 107.8321604 -10.125 100.4375 C-10.50261475 99.85468262 -10.88022949 99.27186523 -11.26928711 98.67138672 C-14.55325736 93.43686782 -15.1463143 89.41916183 -15.625 83.3125 C-15.72039063 82.15363281 -15.81578125 80.99476563 -15.9140625 79.80078125 C-15.94242188 78.87652344 -15.97078125 77.95226562 -16 77 C-15.505 76.505 -15.505 76.505 -15 76 C-14.7375117 73.69301952 -14.53959057 71.37852439 -14.375 69.0625 C-14.27960937 67.79535156 -14.18421875 66.52820313 -14.0859375 65.22265625 C-13.74977745 62.10803045 -13.74977745 62.10803045 -15 60 C-13.68 60 -12.36 60 -11 60 C-11 58.68 -11 57.36 -11 56 C-9.68 56 -8.36 56 -7 56 C-7.28073073 53.85270859 -7.57488499 51.70716807 -7.875 49.5625 C-8.03742187 48.36753906 -8.19984375 47.17257813 -8.3671875 45.94140625 C-8.57601563 44.97074219 -8.78484375 44.00007813 -9 43 C-9.66 42.67 -10.32 42.34 -11 42 C-10.34 42 -9.68 42 -9 42 C-9.00523682 41.44127197 -9.01047363 40.88254395 -9.01586914 40.30688477 C-9.03691719 37.72543506 -9.04974734 35.14400351 -9.0625 32.5625 C-9.07506836 31.24475586 -9.07506836 31.24475586 -9.08789062 29.90039062 C-9.10897678 24.18604374 -8.89931599 18.65041933 -8 13 C-7.34 12.67 -6.68 12.34 -6 12 C-6 14.31 -6 16.62 -6 19 C-5.60167969 17.44539063 -5.60167969 17.44539063 -5.1953125 15.859375 C-4.83877553 14.48952244 -4.4819917 13.11973412 -4.125 11.75 C-3.95097656 11.06808594 -3.77695312 10.38617188 -3.59765625 9.68359375 C-2.69855538 6.25369043 -1.76630043 3.0870476 0 0 Z " fill="#48192B" transform="translate(32,117)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C4.495 0.99 4.495 0.99 5 2 C5.66 1.67 6.32 1.34 7 1 C8.79059807 4.58119613 8.18469346 8.74431683 8.1875 12.6875 C8.19974609 13.57373047 8.21199219 14.45996094 8.22460938 15.37304688 C8.2363301 20.65128201 7.72818369 25.00671038 6 30 C6.66 30 7.32 30 8 30 C8.10884119 31.41493551 8.18597617 32.83232943 8.25 34.25 C8.29640625 35.03890625 8.3428125 35.8278125 8.390625 36.640625 C7.83760796 39.98084795 6.67625054 40.95119576 4 43 C1.47909475 44.11001621 -0.81686002 44.9789376 -3.4375 45.75 C-4.16598145 45.9660791 -4.89446289 46.1821582 -5.64501953 46.40478516 C-15.07732025 48.91175495 -27.60609357 50.13130214 -37 47 C-37.99140649 35.31556633 -38.10709533 23.72098848 -38 12 C-36.68 12 -35.36 12 -34 12 C-33.67 12.66 -33.34 13.32 -33 14 C-32.2575 13.690625 -31.515 13.38125 -30.75 13.0625 C-27.79173987 11.91953586 -25.18065015 11 -22 11 C-21.67 9.35 -21.34 7.7 -21 6 C-21.66 6 -22.32 6 -23 6 C-22.67 4.35 -22.34 2.7 -22 1 C-21.01 1.33 -20.02 1.66 -19 2 C-18.01 1.7215625 -18.01 1.7215625 -17 1.4375 C-16.34 1.293125 -15.68 1.14875 -15 1 C-14.01 1.66 -13.02 2.32 -12 3 C-12 3.99 -12 4.98 -12 6 C-10.35 6 -8.7 6 -7 6 C-6.67 7.32 -6.34 8.64 -6 10 C-4.35 10 -2.7 10 -1 10 C-0.06619039 5.46859347 -0.06619039 5.46859347 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#3D0203" transform="translate(251,173)"/>
<path d="M0 0 C3.71000441 2.19298989 6.0236187 5.34989742 8.6953125 8.66796875 C11.35875919 11.28126687 14.07622251 12.05757073 17.64453125 12.9296875 C19.5625 13.5 19.5625 13.5 21.5625 15.5 C21.0675 16.985 21.0675 16.985 20.5625 18.5 C20.005625 17.860625 19.44875 17.22125 18.875 16.5625 C16.34183439 14.30319013 14.87908576 13.86850953 11.5625 13.5 C12.0575 17.46 12.0575 17.46 12.5625 21.5 C4.07561539 23.79967196 -3.64356372 24.92781312 -12.4375 24.5 C-12.4375 23.84 -12.4375 23.18 -12.4375 22.5 C-15.4075 22.995 -15.4075 22.995 -18.4375 23.5 C-18.4375 23.83 -18.4375 24.16 -18.4375 24.5 C-24.7075 24.83 -30.9775 25.16 -37.4375 25.5 C-26.2175 25.83 -14.9975 26.16 -3.4375 26.5 C-5.4375 28.5 -5.4375 28.5 -8.69384766 28.72705078 C-10.07979295 28.72673382 -11.46576301 28.71541759 -12.8515625 28.6953125 C-13.58120209 28.6924826 -14.31084167 28.68965271 -15.06259155 28.68673706 C-17.39606028 28.67553002 -19.72914703 28.6504251 -22.0625 28.625 C-23.64322363 28.61497085 -25.22395327 28.60584489 -26.8046875 28.59765625 C-30.68243914 28.57558905 -34.55990478 28.54105615 -38.4375 28.5 C-38.7675 29.49 -39.0975 30.48 -39.4375 31.5 C-40.77083333 31.83333333 -42.10416667 32.16666667 -43.4375 32.5 C-43.7675 33.49 -44.0975 34.48 -44.4375 35.5 C-46.5 36.1875 -46.5 36.1875 -48.4375 36.5 C-48.4375 37.16 -48.4375 37.82 -48.4375 38.5 C-46.4575 38.5 -44.4775 38.5 -42.4375 38.5 C-42.7675 37.51 -43.0975 36.52 -43.4375 35.5 C-41.7875 35.83 -40.1375 36.16 -38.4375 36.5 C-38.1075 37.82 -37.7775 39.14 -37.4375 40.5 C-39.04129341 40.55416188 -40.64561406 40.59286638 -42.25 40.625 C-43.14332031 40.64820313 -44.03664062 40.67140625 -44.95703125 40.6953125 C-47.4375 40.5 -47.4375 40.5 -50.4375 38.5 C-50.73046875 35.4609375 -50.73046875 35.4609375 -50.625 31.875 C-50.59792969 30.68648437 -50.57085937 29.49796875 -50.54296875 28.2734375 C-50.50816406 27.35820312 -50.47335938 26.44296875 -50.4375 25.5 C-53.0775 25.17 -55.7175 24.84 -58.4375 24.5 C-58.32360125 26.29240663 -58.19602313 28.08394835 -58.0625 29.875 C-57.99289063 30.87273437 -57.92328125 31.87046875 -57.8515625 32.8984375 C-57.67386036 35.65508879 -57.67386036 35.65508879 -55.4375 37.5 C-57.0875 37.17 -58.7375 36.84 -60.4375 36.5 C-60.32680176 37.30928955 -60.21610352 38.1185791 -60.10205078 38.95239258 C-56.33733808 66.56877359 -56.33733808 66.56877359 -55.09082031 79.25634766 C-54.62622898 83.92643657 -54.01662606 88.54711367 -53.3125 93.1875 C-52.5845852 98.03836975 -52.24155885 102.60147125 -52.4375 107.5 C-53.0975 107.17 -53.7575 106.84 -54.4375 106.5 C-54.92934159 103.88552441 -55.29174979 101.34597172 -55.5859375 98.70703125 C-55.6832869 97.90145279 -55.78063629 97.09587433 -55.88093567 96.2658844 C-56.19963086 93.61566146 -56.50585701 90.96414193 -56.8125 88.3125 C-57.14045507 85.56688528 -57.47174978 82.82168562 -57.80308533 80.07647705 C-58.0262179 78.22532882 -58.24826721 76.37404971 -58.46925354 74.52264404 C-59.4522902 66.29717016 -60.5197175 58.08483413 -61.625 49.875 C-61.77952637 48.71846924 -61.93405273 47.56193848 -62.09326172 46.37036133 C-62.7044438 41.82166688 -63.32272812 37.27554008 -63.99462891 32.73535156 C-64.17815918 31.49495117 -64.36168945 30.25455078 -64.55078125 28.9765625 C-64.72005127 27.85588379 -64.88932129 26.73520508 -65.0637207 25.58056641 C-65.3956962 22.84453319 -65.51027282 20.2512616 -65.4375 17.5 C-64.8084375 17.84933594 -64.179375 18.19867188 -63.53125 18.55859375 C-58.02771685 21.48441785 -53.66866607 23.15382411 -47.4375 23.5 C-47.19 22.778125 -46.9425 22.05625 -46.6875 21.3125 C-45.23976634 18.05509926 -44.07445221 15.92877177 -41.4375 13.5 C-38.63705607 13.07081319 -36.29453482 13.26191376 -33.4375 13.5 C-33.1075 12.51 -32.7775 11.52 -32.4375 10.5 C-48.1572498 11.50807043 -48.1572498 11.50807043 -62.4375 17.5 C-61.44394804 14.29855481 -60.47850122 13.52268152 -57.5 11.875 C-50.6448217 9.26889916 -43.52706752 8.52382898 -36.25 8.3125 C-30.66369741 7.93573251 -27.97135507 6.19893987 -24.15625 2.19140625 C-18.27308754 -3.59816044 -7.22109719 -3.2062239 0 0 Z " fill="#C5968D" transform="translate(247.4375,119.5)"/>
<path d="M0 0 C2.9664161 0.3178303 4.01076795 1.0104603 6.1875 3.125 C8.30075583 6.47706098 8.69282238 9.08348532 9 13 C8.01 12.01 8.01 12.01 7 11 C6.85304687 12.7015625 6.85304687 12.7015625 6.703125 14.4375 C5.22933659 29.84823769 5.22933659 29.84823769 1 36 C0.01 36.33 -0.98 36.66 -2 37 C-2 36.34 -2 35.68 -2 35 C-1.34 35 -0.68 35 0 35 C0.144375 34.030625 0.28875 33.06125 0.4375 32.0625 C1 29 1 29 2 28 C2.04063832 26.33382885 2.042721 24.66611905 2 23 C1.484375 23.70125 0.96875 24.4025 0.4375 25.125 C-2.44328658 28.52285084 -5.50870899 31.24886268 -9 34 C-9.93585938 34.76183594 -9.93585938 34.76183594 -10.890625 35.5390625 C-16.8377215 39.96533662 -23.13744166 41.82727787 -30.1640625 43.8359375 C-33.21082367 44.71801094 -35.95715183 45.85739159 -38.8125 47.25 C-44.24947212 49.53973155 -49.73601541 49.45004808 -55.546875 49.64648438 C-77.90442416 50.46742563 -98.86494127 57.32977641 -116 72 C-116.80695313 72.60585937 -117.61390625 73.21171875 -118.4453125 73.8359375 C-121.53539343 76.45352899 -123.95000362 79.31820681 -126.4375 82.5 C-126.91614502 83.10859863 -127.39479004 83.71719727 -127.88793945 84.34423828 C-132.11537357 89.86949969 -135.22584844 95.60891665 -138 102 C-138.99 101.34 -139.98 100.68 -141 100 C-144.07903609 108.99795982 -145.92503128 117.56573505 -147 127 C-147.33 127 -147.66 127 -148 127 C-149.0789977 106.6988581 -139.95557519 87.36357504 -126.59033203 72.42431641 C-123.52213162 69.14242091 -120.29959112 66.05008501 -117 63 C-116.3503125 62.38253906 -115.700625 61.76507813 -115.03125 61.12890625 C-111.62380697 58.02348658 -108.19005621 55.86436164 -103.9921875 53.95703125 C-101.91105804 53.00301048 -101.91105804 53.00301048 -99.73828125 51.58203125 C-96.37930951 49.64139851 -92.92469664 48.26942702 -89.3125 46.875 C-84.59508828 45.07807148 -84.59508828 45.07807148 -80 43 C-78.48108919 42.87079209 -76.95961498 42.77087093 -75.4375 42.6875 C-70.739406 42.27216125 -67.11899461 41.01518427 -62.91015625 38.9375 C-61 38 -61 38 -58 37 C-58 36.34 -58 35.68 -58 35 C-50.22740403 25.27351941 -37.59794534 23.84438794 -26 22 C-25.34 22 -24.68 22 -24 22 C-25.2648918 25.79467541 -26.51659392 26.14345512 -29.9375 28.0625 C-33.72081765 30.19623733 -33.72081765 30.19623733 -37 33 C-37.16681109 36.08347826 -37.16681109 36.08347826 -37 39 C-26.39243167 39.7857458 -19.18204679 35.61831133 -11.12890625 29 C-8.94938865 27.07265066 -8.94938865 27.07265066 -7.33984375 24.75 C-6.89769531 24.1725 -6.45554688 23.595 -6 23 C-5.34 23 -4.68 23 -4 23 C-3.690625 22.030625 -3.38125 21.06125 -3.0625 20.0625 C-2 17 -2 17 -1 16 C-0.76345976 13.8798986 -0.58548166 11.75311717 -0.4375 9.625 C-0.35371094 8.46226563 -0.26992187 7.29953125 -0.18359375 6.1015625 C-0.06335785 4.07034334 0 2.03477467 0 0 Z " fill="#FB8F0D" transform="translate(173,18)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C0.99 2.33 1.98 2.66 3 3 C3 4.98 3 6.96 3 9 C3.99 9 4.98 9 6 9 C5.67 9.99 5.34 10.98 5 12 C4.195625 12.12375 3.39125 12.2475 2.5625 12.375 C1.716875 12.58125 0.87125 12.7875 0 13 C-0.33 13.66 -0.66 14.32 -1 15 C-0.34 15 0.32 15 1 15 C1 15.99 1 16.98 1 18 C0.01 18 -0.98 18 -2 18 C-1.34 19.65 -0.68 21.3 0 23 C0.99 22.67 1.98 22.34 3 22 C3 21.01 3 20.02 3 19 C3.99 18.67 4.98 18.34 6 18 C6 18.66 6 19.32 6 20 C8.31 19.67 10.62 19.34 13 19 C13 20.98 13 22.96 13 25 C14.32 25 15.64 25 17 25 C17 21.7 17 18.4 17 15 C21 18 25 21 29 24 C28.55720703 24.40202637 28.11441406 24.80405273 27.65820312 25.21826172 C19.45472041 32.69828433 11.52062811 39.96746766 5 49 C4.00110257 50.33415955 3.00144294 51.66775009 2 53 C1.67 52.01 1.34 51.02 1 50 C-0.485 49.505 -0.485 49.505 -2 49 C-2 49.66 -2 50.32 -2 51 C-6.44870215 51.39253254 -9.14243493 50.15305957 -13 48 C-13 47.01 -13 46.02 -13 45 C-13.99 47.475 -13.99 47.475 -15 50 C-17.3125 50.25 -17.3125 50.25 -20 50 C-22.65315971 47.62130509 -22.98103345 46.32875347 -23.1875 42.75 C-23.125625 41.8425 -23.06375 40.935 -23 40 C-23.99 40.495 -23.99 40.495 -25 41 C-24.49042784 35.38014701 -22.9791762 31.22784065 -20.375 26.25 C-20.01817139 25.55406738 -19.66134277 24.85813477 -19.29370117 24.14111328 C-6.72774239 0 -6.72774239 0 0 0 Z " fill="#1D5CAA" transform="translate(34,52)"/>
<path d="M0 0 C1.02053467 0.00418945 2.04106934 0.00837891 3.0925293 0.01269531 C10.34850632 0.12153786 16.89109571 0.81443753 23.75 3.3125 C24.60207031 3.5909375 25.45414062 3.869375 26.33203125 4.15625 C36.78694662 7.88211846 48.53888337 15.66669136 54 25.58203125 C54.2475 26.15308594 54.495 26.72414063 54.75 27.3125 C51.75 28.3125 51.75 28.3125 48.75 28.3125 C48.75 28.9725 48.75 29.6325 48.75 30.3125 C47.76 30.3125 46.77 30.3125 45.75 30.3125 C45.75 30.9725 45.75 31.6325 45.75 32.3125 C41.75 32.3125 41.75 32.3125 39.5 30.1875 C38.13875 28.764375 38.13875 28.764375 36.75 27.3125 C24.66282664 16.31892804 11.59826706 15.30843353 -4.1015625 15.83984375 C-15.84082426 16.54504782 -23.81165707 21.13379686 -32.69140625 28.51953125 C-35.25 30.3125 -35.25 30.3125 -39.25 30.3125 C-39.25 28.9925 -39.25 27.6725 -39.25 26.3125 C-38.59 26.3125 -37.93 26.3125 -37.25 26.3125 C-37.25 25.6525 -37.25 24.9925 -37.25 24.3125 C-37.91 24.3125 -38.57 24.3125 -39.25 24.3125 C-39.58 23.3225 -39.91 22.3325 -40.25 21.3125 C-38.35955296 19.21200329 -36.60917537 17.90708034 -34.1875 16.375 C-31.39062571 14.4112372 -30.37098353 13.45125387 -29.25 10.3125 C-28.26 10.3125 -27.27 10.3125 -26.25 10.3125 C-27.24 8.9925 -28.23 7.6725 -29.25 6.3125 C-27.75292061 5.68053616 -26.25213297 5.05735607 -24.75 4.4375 C-23.9146875 4.08945313 -23.079375 3.74140625 -22.21875 3.3828125 C-14.65747172 0.6567727 -7.99408931 -0.04457549 0 0 Z " fill="#ED260C" transform="translate(109.25,84.6875)"/>
<path d="M0 0 C4.25846591 0.10646165 6.40145804 1.13879185 9.375 4 C26.09746195 19.5074456 48.97714773 23.77594259 71.0390625 23.38671875 C82.94737175 22.85348214 94.34693512 19.22968639 105 14 C105.66 14 106.32 14 107 14 C107 14.66 107 15.32 107 16 C106.34 16 105.68 16 105 16 C105 16.66 105 17.32 105 18 C86.84292306 25.23205607 70.43033365 26.75264281 51 27 C51 26.34 51 25.68 51 25 C49.68 25 48.36 25 47 25 C47 24.34 47 23.68 47 23 C46.39671875 23.01160156 45.7934375 23.02320313 45.171875 23.03515625 C43.97304687 23.04869141 43.97304687 23.04869141 42.75 23.0625 C41.56664063 23.07990234 41.56664063 23.07990234 40.359375 23.09765625 C38.09308998 23.00385306 36.1711105 22.63241063 34 22 C34 21.34 34 20.68 34 20 C33.278125 19.855625 32.55625 19.71125 31.8125 19.5625 C29.20833333 19.04166667 26.60416667 18.52083333 24 18 C22.88011948 21.35964157 23.28019087 23.58090665 24 27 C23.67 27.66 23.34 28.32 23 29 C23.89163577 31.11683841 23.89163577 31.11683841 25 33 C25 31.35 25 29.7 25 28 C27.64 28 30.28 28 33 28 C33.495 29.98 33.495 29.98 34 32 C31 34 31 34 28 34 C28.495 35.98 28.495 35.98 29 38 C27.02 38.495 27.02 38.495 25 39 C25 39.66 25 40.32 25 41 C27.31 40.01 29.62 39.02 32 38 C32 41 32 44 32 47 C28.91193842 48.54403079 25.80696378 47.91227801 22.41015625 47.7421875 C19.91962642 47.78381578 19.91962642 47.78381578 18.18359375 49.5078125 C17.79300781 50.00023437 17.40242188 50.49265625 17 51 C17.33 51.99 17.66 52.98 18 54 C7.5755749 50.36092797 -2.38125318 40.93369502 -10 33 C-10 32.34 -10 31.68 -10 31 C-8.02 30.34 -6.04 29.68 -4 29 C-4 28.34 -4 27.68 -4 27 C-0.04 26.505 -0.04 26.505 4 26 C4 25.01 4 24.02 4 23 C5.32 23 6.64 23 8 23 C8 22.34 8 21.68 8 21 C7.01 21.33 6.02 21.66 5 22 C4.67 21.34 4.34 20.68 4 20 C6.70879335 18.64560332 9.00933268 18.93498549 12 19 C12 18.34 12 17.68 12 17 C8.04 17.495 8.04 17.495 4 18 C3.67 13.05 3.34 8.1 3 3 C2.01 2.67 1.02 2.34 0 2 C0 1.34 0 0.68 0 0 Z " fill="#25122E" transform="translate(49,206)"/>
<path d="M0 0 C2.64 0.33 5.28 0.66 8 1 C8.03738281 1.76699219 8.07476562 2.53398437 8.11328125 3.32421875 C8.56845464 11.00861654 9.41164786 18.56903505 10.5 26.1875 C10.63059814 27.10813232 10.76119629 28.02876465 10.89575195 28.97729492 C11.40588299 32.45516739 11.88568065 35.65704195 13 39 C15.33075929 38.04134491 15.33075929 38.04134491 17 35 C20.125 34.8125 20.125 34.8125 23 35 C25.29969419 62.11314985 25.29969419 62.11314985 25 75 C21.37 75 17.74 75 14 75 C14.66 75.66 15.32 76.32 16 77 C16.125 80.625 16.125 80.625 16 84 C15.34 84 14.68 84 14 84 C14 84.99 14 85.98 14 87 C8.25 85.25 8.25 85.25 6 83 C5.57274316 80.2346988 5.24873492 77.53214609 5 74.75 C4.48247061 69.30635754 3.86146313 63.8999227 3.0703125 58.48828125 C1.96495334 50.9035487 1.03293758 43.30422199 0.14013672 35.69213867 C-0.12843676 33.40827487 -0.40201534 31.12504343 -0.67578125 28.84179688 C-0.84925919 27.37243132 -1.02244722 25.90303151 -1.1953125 24.43359375 C-1.35016113 23.12447021 -1.50500977 21.81534668 -1.66455078 20.46655273 C-1.94105558 17.60913523 -2.07081682 14.86601878 -2 12 C-1.01 12 -0.02 12 1 12 C0.67 11.67 0.34 11.34 0 11 C-0.07226502 9.14712498 -0.0838122 7.29166122 -0.0625 5.4375 C-0.05347656 4.42558594 -0.04445312 3.41367188 -0.03515625 2.37109375 C-0.02355469 1.58863281 -0.01195312 0.80617187 0 0 Z " fill="#400F14" transform="translate(189,144)"/>
<path d="M0 0 C1.09248047 -0.020625 2.18496094 -0.04125 3.31054688 -0.0625 C4.35662109 -0.06765625 5.40269531 -0.0728125 6.48046875 -0.078125 C7.43203857 -0.0874707 8.3836084 -0.09681641 9.36401367 -0.10644531 C11.8125 0.25 11.8125 0.25 13.62744141 1.28735352 C15.48202171 4.35883499 15.17942002 7.50245028 15.10546875 10.98046875 C15.10122391 11.73088943 15.09697906 12.48131012 15.09260559 13.25447083 C15.0758245 15.64918026 15.0381749 18.04304534 15 20.4375 C14.98495235 22.0618368 14.97126409 23.6861868 14.95898438 25.31054688 C14.92592305 29.29068948 14.87414594 33.27020163 14.8125 37.25 C13.8225 37.25 12.8325 37.25 11.8125 37.25 C11.1525 37.91 10.4925 38.57 9.8125 39.25 C7.04774249 39.42279734 4.46534799 39.03519814 1.8125 38.25 C0.25 36.375 0.25 36.375 -0.1875 34.25 C0.1425 33.26 0.4725 32.27 0.8125 31.25 C0.95823058 29.77034074 1.05913268 28.28596157 1.12890625 26.80078125 C1.19174805 25.52944336 1.19174805 25.52944336 1.25585938 24.23242188 C1.29517578 23.35134766 1.33449219 22.47027344 1.375 21.5625 C1.43977539 20.22348633 1.43977539 20.22348633 1.50585938 18.85742188 C1.61185353 16.65509892 1.71392051 14.45266527 1.8125 12.25 C-0.41738284 12.33750555 -2.64646005 12.44569061 -4.875 12.5625 C-6.11636719 12.62050781 -7.35773438 12.67851562 -8.63671875 12.73828125 C-13.29929106 13.41022511 -16.00369811 14.82127358 -19 18.4375 C-21.11303279 23.44205135 -20.75918803 27.56669637 -19.0625 32.5625 C-16.82369187 35.77145831 -14.78073771 36.81270492 -11.1875 38.25 C-13 38.875 -13 38.875 -15.1875 39.25 C-16.1775 38.59 -17.1675 37.93 -18.1875 37.25 C-18.1875 38.24 -18.1875 39.23 -18.1875 40.25 C-17.5275 40.25 -16.8675 40.25 -16.1875 40.25 C-15.8575 41.24 -15.5275 42.23 -15.1875 43.25 C-16.1775 43.91 -17.1675 44.57 -18.1875 45.25 C-19.34561388 46.30270463 -19.34561388 46.30270463 -20.1875 48.25 C-26.72852441 44.14582782 -30.71995156 39.65264531 -33.1875 32.25 C-33.80203861 22.47454864 -33.40597711 15.52703605 -26.8125 7.9375 C-19.12365962 -0.45850798 -10.82712057 0.05164995 0 0 Z " fill="#FAF2DE" transform="translate(119.1875,126.75)"/>
<path d="M0 0 C3.16005394 1.14561566 5.8903862 2.44095604 8.7734375 4.1640625 C9.74023438 4.73382813 10.70703125 5.30359375 11.703125 5.890625 C22.9736173 13.31265651 29.13676063 23.56390885 32.3515625 36.48828125 C32.9093434 40.02605823 33.03617397 43.52854082 33.0859375 47.1015625 C33.12944336 48.13700195 33.12944336 48.13700195 33.17382812 49.19335938 C33.2376097 54.36947912 31.98393891 57.16731584 28.7734375 61.1640625 C28.1134375 61.8240625 27.4534375 62.4840625 26.7734375 63.1640625 C23.95040906 62.94690647 22.26257967 62.54838849 20.0234375 60.7890625 C17.43159749 57.41967049 17.66229512 54.13975054 17.66796875 50.0625 C17.65314453 48.84949219 17.63832031 47.63648438 17.62304688 46.38671875 C17.59853443 43.84516495 17.59296586 41.30334964 17.60742188 38.76171875 C17.46652935 30.67534157 16.40930346 25.17657644 10.7734375 19.1640625 C8.21594417 17.22036757 6.66557485 16.25067198 3.7734375 15.1640625 C3.00128906 14.86757812 2.22914063 14.57109375 1.43359375 14.265625 C-5.52760245 12.08837856 -12.3696541 11.88246555 -19.6015625 11.8515625 C-21.02867554 11.84334473 -21.02867554 11.84334473 -22.48461914 11.83496094 C-27.4519847 11.88583181 -31.57376297 12.21113159 -36.2265625 14.1640625 C-36.2265625 13.1740625 -36.2265625 12.1840625 -36.2265625 11.1640625 C-34.9890625 10.8340625 -33.7515625 10.5040625 -32.4765625 10.1640625 C-31.43242188 9.885625 -31.43242188 9.885625 -30.3671875 9.6015625 C-28.2265625 9.1640625 -28.2265625 9.1640625 -24.2265625 9.1640625 C-24.2265625 8.5040625 -24.2265625 7.8440625 -24.2265625 7.1640625 C-25.8765625 6.8340625 -27.5265625 6.5040625 -29.2265625 6.1640625 C-29.2265625 4.5140625 -29.2265625 2.8640625 -29.2265625 1.1640625 C-30.2165625 0.8340625 -31.2065625 0.5040625 -32.2265625 0.1640625 C-24.43692177 -3.73075787 -8.32852694 -2.053317 0 0 Z " fill="#FBF3DA" transform="translate(129.2265625,100.8359375)"/>
<path d="M0 0 C1.25425781 0.02707031 2.50851563 0.05414063 3.80078125 0.08203125 C4.75339844 0.11683594 5.70601562 0.15164062 6.6875 0.1875 C6.7145491 3.25005961 6.73436298 6.3123786 6.75 9.375 C6.75837891 10.23931641 6.76675781 11.10363281 6.77539062 11.99414062 C6.79146812 16.19036769 6.76309038 20.09686886 5.6875 24.1875 C9.66733682 25.77137703 9.66733682 25.77137703 13.875 26 C17.21645459 24.50210656 18.67926666 22.19985002 20.6875 19.1875 C21.038125 20.05375 21.38875 20.92 21.75 21.8125 C24.56426194 26.71476274 28.27019803 30.38173268 33.6875 32.1875 C35.91324335 32.41201458 38.14331519 32.59532878 40.375 32.75 C41.55449219 32.83378906 42.73398438 32.91757813 43.94921875 33.00390625 C45.30466797 33.09478516 45.30466797 33.09478516 46.6875 33.1875 C46.6875 34.1775 46.6875 35.1675 46.6875 36.1875 C46.0275 36.1875 45.3675 36.1875 44.6875 36.1875 C44.6875 36.8475 44.6875 37.5075 44.6875 38.1875 C43.10782193 38.86278223 41.52358097 39.52739694 39.9375 40.1875 C39.05578125 40.55875 38.1740625 40.93 37.265625 41.3125 C34.6875 42.1875 34.6875 42.1875 30.6875 42.1875 C30.6875 42.8475 30.6875 43.5075 30.6875 44.1875 C23.24604301 43.59218344 19.11426742 40.99270633 14.3125 35.4375 C13.4299363 34.36031969 12.55218305 33.2790857 11.6875 32.1875 C10.87345703 32.71150391 10.87345703 32.71150391 10.04296875 33.24609375 C9.32753906 33.70113281 8.61210938 34.15617187 7.875 34.625 C6.81345703 35.30369141 6.81345703 35.30369141 5.73046875 35.99609375 C1.9855471 38.18003467 -1.060041 38.32292269 -5.3125 38.3125 C-6.364375 38.31507813 -7.41625 38.31765625 -8.5 38.3203125 C-11.3125 38.1875 -11.3125 38.1875 -14.3125 37.1875 C-14.3125 36.1975 -14.3125 35.2075 -14.3125 34.1875 C-14.9725 33.8575 -15.6325 33.5275 -16.3125 33.1875 C-13.3125 31.1875 -13.3125 31.1875 -11.3125 31.1875 C-11.3125 30.1975 -11.3125 29.2075 -11.3125 28.1875 C-11.9725 28.1875 -12.6325 28.1875 -13.3125 28.1875 C-13.3125 27.1975 -13.3125 26.2075 -13.3125 25.1875 C-12.3225 25.1875 -11.3325 25.1875 -10.3125 25.1875 C-11.116875 24.424375 -11.92125 23.66125 -12.75 22.875 C-16.2683831 19.18498845 -16.66796251 16.29645097 -16.59375 11.25 C-16.12413806 7.80617908 -14.54110816 5.77750408 -12.3125 3.1875 C-8.1782594 0.05728926 -5.11929377 -0.1435316 0 0 Z " fill="#F9F3D9" transform="translate(114.3125,138.8125)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-0.99 2.33 -1.98 2.66 -3 3 C-3.45375 3.78375 -3.9075 4.5675 -4.375 5.375 C-6.23677166 8.3824773 -7.85110315 9.46592205 -11 11 C-11.66 11 -12.32 11 -13 11 C-13 12.65 -13 14.3 -13 16 C-12.34 16 -11.68 16 -11 16 C-11 16.66 -11 17.32 -11 18 C-11.66 18 -12.32 18 -13 18 C-13 19.32 -13 20.64 -13 22 C-12.01 22 -11.02 22 -10 22 C-11.43480559 24.99942692 -13.09185308 27.75843218 -14.875 30.5625 C-19.23505005 37.79016244 -22.40474296 45.51758725 -23 54 C-23.07476562 54.84691406 -23.14953125 55.69382813 -23.2265625 56.56640625 C-23.88807983 69.64007763 -19.15245278 80.95432359 -11 91 C-10.195625 92.03125 -9.39125 93.0625 -8.5625 94.125 C-8.046875 94.74375 -7.53125 95.3625 -7 96 C-11.68286716 94.62603377 -13.3515925 92.58316704 -16 88.5625 C-18.63565878 84.57181503 -20.71688092 82.19361133 -25 80 C-25.495 80.99 -25.495 80.99 -26 82 C-26.33 81.67 -26.66 81.34 -27 81 C-27.433125 81.495 -27.86625 81.99 -28.3125 82.5 C-30 84 -30 84 -33 84 C-33.65043719 82.27255984 -34.29514844 80.5429631 -34.9375 78.8125 C-35.29714844 77.84957031 -35.65679687 76.88664062 -36.02734375 75.89453125 C-40.47476523 62.65943358 -39.50623254 45.66951312 -34 33 C-33.59910156 32.01257813 -33.19820312 31.02515625 -32.78515625 30.0078125 C-28.36495322 20.14243182 -12.93574094 -3.88072228 0 0 Z " fill="#1B2146" transform="translate(83,93)"/>
<path d="M0 0 C2.9777759 2.49996659 3.94548483 5.04711071 5.1875 8.6875 C5.53167969 9.68136719 5.87585938 10.67523438 6.23046875 11.69921875 C6.48441406 12.45847656 6.73835937 13.21773437 7 14 C8.32 14 9.64 14 11 14 C11.33 14.99 11.66 15.98 12 17 C14.64 17.33 17.28 17.66 20 18 C20 18.66 20 19.32 20 20 C20.928125 20.268125 21.85625 20.53625 22.8125 20.8125 C25.76240366 21.91148371 27.05615186 22.62418561 29 25 C29.70074844 21.846632 30 19.27275026 30 16 C30.66 16 31.32 16 32 16 C32 15.34 32 14.68 32 14 C33.670625 14.061875 33.670625 14.061875 35.375 14.125 C39.04366025 14.41121859 39.04366025 14.41121859 41 12 C40.67958603 9.39719432 40.67958603 9.39719432 40 7 C40.66 7 41.32 7 42 7 C42 5.35 42 3.7 42 2 C49.62224218 8.90765698 56.8090218 18.60098613 61 28 C60.505 29.485 60.505 29.485 60 31 C59.21496094 31.09796875 58.42992187 31.1959375 57.62109375 31.296875 C51.2576148 32.20259716 46.13512647 33.00601274 41 37 C40.35232207 39.57061311 40.35232207 39.57061311 40 42 C37.13462272 43.54885258 34.1698627 44.29558607 31 45 C31.33 43.68 31.66 42.36 32 41 C27.05 41.495 27.05 41.495 22 42 C21.67 41.01 21.34 40.02 21 39 C20.54625 39.495 20.0925 39.99 19.625 40.5 C18 42 18 42 16 42 C16.35171638 33.7698368 16.35171638 33.7698368 19 30.625 C19.66 30.08875 20.32 29.5525 21 29 C21.33 28.01 21.66 27.02 22 26 C21.33613281 26.2165625 20.67226562 26.433125 19.98828125 26.65625 C19.10527344 26.9346875 18.22226563 27.213125 17.3125 27.5 C16.44238281 27.7784375 15.57226562 28.056875 14.67578125 28.34375 C12.00608323 28.99850805 9.73603316 29.11831495 7 29 C7 29.66 7 30.32 7 31 C5.68 30.67 4.36 30.34 3 30 C3.33 28.35 3.66 26.7 4 25 C3.34 24.67 2.68 24.34 2 24 C2.03480469 22.28103516 2.03480469 22.28103516 2.0703125 20.52734375 C2.08908479 18.9974024 2.10728341 17.46745394 2.125 15.9375 C2.14175781 15.18533203 2.15851563 14.43316406 2.17578125 13.65820312 C2.21865121 8.70672291 1.58399375 4.69585549 0 0 Z " fill="#10235D" transform="translate(205,47)"/>
<path d="M0 0 C8.55201116 1.32703621 15.44593101 4.98119232 23 9 C22.67 10.65 22.34 12.3 22 14 C20.35 14.33 18.7 14.66 17 15 C17 13.68 17 12.36 17 11 C11.7786608 12.62419504 11.7786608 12.62419504 8.5625 16.6875 C8.376875 17.450625 8.19125 18.21375 8 19 C7.01 19 6.02 19 5 19 C5 19.99 5 20.98 5 22 C3.02 22.33 1.04 22.66 -1 23 C-1 22.01 -1 21.02 -1 20 C-2.485 19.505 -2.485 19.505 -4 19 C-4 18.34 -4 17.68 -4 17 C-4.66 17 -5.32 17 -6 17 C-7.78305524 14.36107824 -8.99059621 12.02821137 -10 9 C-12.01508358 8.26676204 -12.01508358 8.26676204 -14 8 C-13.91621094 8.56847656 -13.83242187 9.13695312 -13.74609375 9.72265625 C-12.63626229 18.13770744 -13.45107616 23.80976554 -18 31 C-18.66 31 -19.32 31 -20 31 C-20.38091797 31.88171875 -20.38091797 31.88171875 -20.76953125 32.78125 C-24.6500456 39.77849493 -32.81507921 44.21918264 -39.9375 47.25 C-43.79801814 48.19543301 -47.02929337 48.20190034 -51 48 C-52 47 -52 47 -52.3125 44.1875 C-52 41 -52 41 -50.5625 38.9375 C-47.5155919 36.63374021 -44.31895422 34.89222852 -40.92578125 33.1484375 C-38.8470419 32.1433689 -38.8470419 32.1433689 -38 30 C-53.68331342 33.26087243 -53.68331342 33.26087243 -68 40 C-68 38 -68 38 -66.5 36.0625 C-63.67291417 33.73015419 -61.16459627 32.80144966 -57.70703125 31.7109375 C-55.7937944 31.13237451 -55.7937944 31.13237451 -55 29 C-54.34 29 -53.68 29 -53 29 C-53 28.34 -53 27.68 -53 27 C-52.01 27 -51.02 27 -50 27 C-50 25.35 -50 23.7 -50 22 C-49.01 22 -48.02 22 -47 22 C-46.67 22.66 -46.34 23.32 -46 24 C-43.97536745 24.65213292 -43.97536745 24.65213292 -42 25 C-41.67 24.34 -41.34 23.68 -41 23 C-40.01 23.33 -39.02 23.66 -38 24 C-37.01 23.67 -36.02 23.34 -35 23 C-34.505 25.475 -34.505 25.475 -34 28 C-33.34 27.01 -32.68 26.02 -32 25 C-26.96450137 22.60214351 -23.31996222 23.08276513 -18 24 C-18 23.34 -18 22.68 -18 22 C-17.34 22 -16.68 22 -16 22 C-16 21.34 -16 20.68 -16 20 C-16.66 20 -17.32 20 -18 20 C-18.14188203 15.03412887 -17.86086899 10.21601746 -15 6 C-12.875 5.25 -12.875 5.25 -11 5 C-11 5.66 -11 6.32 -11 7 C-7.56889804 7.85777549 -5.38420123 7.96691464 -2 7 C-1.505 7.495 -1.505 7.495 -1 8 C-0.67 7.34 -0.34 6.68 0 6 C0.99 5.34 1.98 4.68 3 4 C2.01 2.68 1.02 1.36 0 0 Z " fill="#1E7BC4" transform="translate(187,10)"/>
<path d="M0 0 C0.98492432 0.00418945 1.96984863 0.00837891 2.98461914 0.01269531 C14.03044918 0.18393437 23.41005209 1.92478994 32.3125 8.75 C33.81852325 10.84169896 34.09618302 12.78675434 34.4375 15.3125 C30.03661894 18.3686674 30.03661894 18.3686674 27.4375 18.125 C25.99129067 17.53747746 24.56015719 16.91237724 23.13989258 16.26464844 C20.24319517 15.24403954 18.25152465 15.1291409 15.19921875 15.265625 C13.72098633 15.32943359 13.72098633 15.32943359 12.21289062 15.39453125 C10.68438477 15.47767578 10.68438477 15.47767578 9.125 15.5625 C8.11759766 15.60246094 7.11019531 15.64242187 6.07226562 15.68359375 C-5.27647288 16.12685657 -5.27647288 16.12685657 -14.875 21.625 C-15.53757812 22.24246094 -16.20015625 22.85992187 -16.8828125 23.49609375 C-18.73099982 25.36482456 -18.73099982 25.36482456 -20.25 28.1875 C-21.5625 30.3125 -21.5625 30.3125 -24 31.375 C-26.5625 31.3125 -26.5625 31.3125 -28.625 29.625 C-29.264375 28.861875 -29.90375 28.09875 -30.5625 27.3125 C-31.305 26.57 -32.0475 25.8275 -32.8125 25.0625 C-33.67875 24.19625 -33.67875 24.19625 -34.5625 23.3125 C-32.09326551 14.38426792 -25.38105369 7.83952266 -17.484375 3.25 C-16.85015625 2.940625 -16.2159375 2.63125 -15.5625 2.3125 C-14.87800781 1.94769531 -14.19351563 1.58289063 -13.48828125 1.20703125 C-9.02063449 -0.15891148 -4.64604798 -0.02651987 0 0 Z " fill="#F73906" transform="translate(109.5625,111.6875)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C0.598125 1.814375 1.19625 1.62875 1.8125 1.4375 C4 1 4 1 7 2 C7.99 2 8.98 2 10 2 C10.33 1.34 10.66 0.68 11 0 C12.98 1.98 12.98 1.98 15 4 C14.67 4.66 14.34 5.32 14 6 C14.99 5.34 15.98 4.68 17 4 C19.12109375 3.4375 19.12109375 3.4375 21.4375 3 C24.61413201 2.39799867 27.15772791 1.55386173 30 0 C26.59955454 4.31522207 23.04703259 7.88540215 18.6875 11.25 C18.08212402 11.71889648 17.47674805 12.18779297 16.85302734 12.67089844 C1.91725477 24.03200462 -13.68040152 32.05915073 -31.6875 37.3125 C-32.51789795 37.55516602 -33.3482959 37.79783203 -34.20385742 38.04785156 C-46.15202601 41.35373365 -57.88002855 42.36603973 -70.25 42.3125 C-70.93075592 42.31034485 -71.61151184 42.3081897 -72.31289673 42.30596924 C-82.8303124 42.25265096 -92.81149623 41.7566092 -103 39 C-103.83660156 38.77473633 -104.67320313 38.54947266 -105.53515625 38.31738281 C-122.04890096 33.77313292 -122.04890096 33.77313292 -129 30 C-126.75476719 29.23006397 -125.47764981 28.83074583 -123.203125 29.63671875 C-122.55859375 29.98347656 -121.9140625 30.33023437 -121.25 30.6875 C-106.19596961 37.84311642 -88.5982803 39.36483212 -72.15209961 39.31567383 C-69.93619187 39.31249813 -67.72160502 39.3361353 -65.50585938 39.36132812 C-56.93716823 39.39838405 -49.24638696 38.46095084 -41 36 C-39.50343683 35.67143507 -38.00387637 35.35577821 -36.5 35.0625 C-31.73281002 34.04095929 -27.19241444 32.42987281 -22.6015625 30.8046875 C-20 30 -20 30 -17 30 C-16.7215625 29.1028125 -16.7215625 29.1028125 -16.4375 28.1875 C-14.27726247 24.90018201 -11.64892345 24.35145313 -8 23 C-8 22.34 -8 21.68 -8 21 C-8.70125 20.87625 -9.4025 20.7525 -10.125 20.625 C-13.17656387 19.96161655 -16.05340938 19.02788045 -19 18 C-19 17.67 -19 17.34 -19 17 C-21.31 16.67 -23.62 16.34 -26 16 C-25.49396008 13.83125748 -25.00016187 12.00032373 -24 10 C-23.34 10 -22.68 10 -22 10 C-21.71125 9.4225 -21.4225 8.845 -21.125 8.25 C-20.568125 7.13625 -20.568125 7.13625 -20 6 C-19.5359375 4.9171875 -19.5359375 4.9171875 -19.0625 3.8125 C-18 2 -18 2 -15 1 C-14.01 1.495 -14.01 1.495 -13 2 C-13 3.32 -13 4.64 -13 6 C-10.525 5.505 -10.525 5.505 -8 5 C-8 4.34 -8 3.68 -8 3 C-6.68 3 -5.36 3 -4 3 C-4 2.34 -4 1.68 -4 1 C-2 0 -2 0 0 0 Z " fill="#140F34" transform="translate(211,239)"/>
<path d="M0 0 C0 6.39455649 -6.87233659 12.02735366 -11.0625 16.5 C-28.20742186 33.20680631 -51.34161156 40.4858007 -74.81933594 40.4309082 C-81.3626168 40.28823253 -87.59953931 39.33781389 -94 38 C-92.1796875 36.4765625 -92.1796875 36.4765625 -90 35 C-88.44085428 35.20336683 -86.88192157 35.42340293 -85.33984375 35.73046875 C-79.96390393 36.34973394 -74.33718461 35.79607812 -69 35 C-68.34 34.34 -67.68 33.68 -67 33 C-64.34462628 32.43479997 -61.70855287 32.26211802 -59 32 C-60.98 31.67 -62.96 31.34 -65 31 C-65 30.34 -65 29.68 -65 29 C-68.3 28.34 -71.6 27.68 -75 27 C-75 26.67 -75 26.34 -75 26 C-74.16855469 25.95101562 -73.33710937 25.90203125 -72.48046875 25.8515625 C-71.39378906 25.77679688 -70.30710937 25.70203125 -69.1875 25.625 C-67.56908203 25.52058594 -67.56908203 25.52058594 -65.91796875 25.4140625 C-62.81373814 25.18804267 -62.81373814 25.18804267 -60 23 C-57.18490737 22.54500588 -54.39029442 22.16328035 -51.5625 21.8125 C-33.18790965 19.18982923 -14.11457311 12.32360009 0 0 Z " fill="#DDBDA7" transform="translate(186,190)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C2.92776055 4.07346028 2.73240628 7.00804242 2 10 C-0.5 12.25 -0.5 12.25 -3 14 C-3.69060417 16.55588038 -3.69060417 16.55588038 -4 19 C-4.89307861 18.97643433 -4.89307861 18.97643433 -5.80419922 18.95239258 C-8.49437003 18.89014199 -11.18438957 18.85104217 -13.875 18.8125 C-15.28072266 18.77479492 -15.28072266 18.77479492 -16.71484375 18.73632812 C-17.61074219 18.72666016 -18.50664063 18.71699219 -19.4296875 18.70703125 C-20.25710449 18.6913208 -21.08452148 18.67561035 -21.93701172 18.65942383 C-22.61779785 18.77181396 -23.29858398 18.8842041 -24 19 C-24.99 20.485 -24.99 20.485 -26 22 C-28.97535086 22.45062987 -31.81953513 22.741075 -34.8125 22.9375 C-53.58944936 24.55239883 -69.76276427 31.25122611 -82.328125 45.671875 C-89.54003546 55.19600103 -94.3864459 65.35363613 -97 77 C-97.66 76.34 -98.32 75.68 -99 75 C-98.81858984 65.20385138 -94.43958582 56.05775105 -88.234375 48.62109375 C-86.78809749 46.9028435 -86.78809749 46.9028435 -86 44 C-84.4765625 42.5 -84.4765625 42.5 -82.625 41 C-80.78045235 39.49296532 -79.03934084 38.04145181 -77.3984375 36.3125 C-76 35 -76 35 -74 35 C-73.34 33.68 -72.68 32.36 -72 31 C-71.34 31 -70.68 31 -70 31 C-69.773125 30.360625 -69.54625 29.72125 -69.3125 29.0625 C-68.6628125 28.0415625 -68.6628125 28.0415625 -68 27 C-67.23816406 26.84789063 -66.47632813 26.69578125 -65.69140625 26.5390625 C-62.74143597 25.94821214 -61.11219203 24.97499151 -58.625 23.3125 C-49.93483723 17.91367133 -40.02042447 14.04498459 -30 12 C-30 11.01 -30 10.02 -30 9 C-29.34 8.67 -28.68 8.34 -28 8 C-33.94 8 -39.88 8 -46 8 C-46 7.67 -46 7.34 -46 7 C-38.46538007 5.60670403 -31.14395822 4.84860483 -23.5 4.5625 C-10.91705435 4.54734458 -10.91705435 4.54734458 0 0 Z " fill="#FCF363" transform="translate(143,62)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C0.74913936 5.17802095 -0.15640015 7.77969351 -3.99804688 11.33007812 C-4.51431641 11.77802734 -5.03058594 12.22597656 -5.5625 12.6875 C-7.49917927 14.39859333 -9.23206172 16.09808288 -11 18 C-11 19.32 -11 20.64 -11 22 C-3.82337263 22.69451233 -0.13523234 21.41937028 5.8359375 17.41015625 C8 16 8 16 11 15 C11 14.34 11 13.68 11 13 C13 11.375 13 11.375 15 10 C15.66 10.33 16.32 10.66 17 11 C16.13375 11.99 16.13375 11.99 15.25 13 C10.95552103 18.72597196 8.13192104 23.62132885 9 31 C9.66 31.99 10.32 32.98 11 34 C13.66653905 34.36460453 13.66653905 34.36460453 16.625 34.1875 C17.62789062 34.16042969 18.63078125 34.13335937 19.6640625 34.10546875 C20.82035156 34.05326172 20.82035156 34.05326172 22 34 C21.01 35.32 20.02 36.64 19 38 C19.99 37.67 20.98 37.34 22 37 C20.5 40 20.5 40 19 43 C19.99 43.495 19.99 43.495 21 44 C17.3558226 46.4294516 15.28758728 46.16179575 11 46 C10.67 45.01 10.34 44.02 10 43 C8.515 43.495 8.515 43.495 7 44 C5.77030122 47.51190809 5.77030122 47.51190809 5 51 C4.01 51 3.02 51 2 51 C1.67 52.98 1.34 54.96 1 57 C0.16855469 57.20496094 -0.66289062 57.40992188 -1.51953125 57.62109375 C-2.60621094 57.89050781 -3.69289062 58.15992188 -4.8125 58.4375 C-5.89144531 58.70433594 -6.97039062 58.97117188 -8.08203125 59.24609375 C-10.0740843 59.76077412 -12.04811524 60.34937175 -14 61 C-13.76968055 54.64803211 -8.51627267 51.03348436 -4.27929688 46.87890625 C0.14627544 42.37438879 5 36.67787575 5 30 C4.67128906 30.45890625 4.34257812 30.9178125 4.00390625 31.390625 C0.11707667 36.40452982 -3.87934026 39.20831597 -10 41 C-11.32 41 -12.64 41 -14 41 C-14.66 39.35 -15.32 37.7 -16 36 C-17.32 36 -18.64 36 -20 36 C-20 35.34 -20 34.68 -20 34 C-15.38 32.35 -10.76 30.7 -6 29 C-6 28.34 -6 27.68 -6 27 C-6.69867188 26.87882812 -7.39734375 26.75765625 -8.1171875 26.6328125 C-9.02726563 26.46523437 -9.93734375 26.29765625 -10.875 26.125 C-11.77992188 25.96257812 -12.68484375 25.80015625 -13.6171875 25.6328125 C-16 25 -16 25 -18 23 C-18.06316957 19.86859396 -17.66716474 17.8085825 -15.64550781 15.35839844 C-13.85801265 13.6263454 -12.01741548 11.9916743 -10.125 10.375 C-8.85416731 9.26077498 -7.58585517 8.14366734 -6.3203125 7.0234375 C-5.73282227 6.50491211 -5.14533203 5.98638672 -4.54003906 5.45214844 C-2.77944185 3.79202919 -1.38248366 1.98188217 0 0 Z " fill="#AF1E0D" transform="translate(199,71)"/>
<path d="M0 0 C1 3 1 3 0.171875 5.3125 C-5.69710966 16.40552596 -13.93380272 24.33503743 -24.78515625 30.5625 C-27.25995617 31.96098988 -27.25995617 31.96098988 -29 35 C-29.17718681 37.09148548 -29.17718681 37.09148548 -28 39 C-25.14370003 40.55964255 -25.14370003 40.55964255 -21.6875 41.6875 C-19.96080078 42.31205078 -19.96080078 42.31205078 -18.19921875 42.94921875 C-15.80191596 43.73661124 -13.45865063 44.44756245 -11 45 C-11 46.32 -11 47.64 -11 49 C-9.39125 48.505 -9.39125 48.505 -7.75 48 C-4 47 -4 47 0 47 C-0.08378906 47.68707031 -0.16757813 48.37414062 -0.25390625 49.08203125 C-0.35574219 49.98308594 -0.45757812 50.88414063 -0.5625 51.8125 C-0.66691406 52.70582031 -0.77132812 53.59914062 -0.87890625 54.51953125 C-1.15658709 57.13375572 -1.15658709 57.13375572 0 60 C1.485 60.495 1.485 60.495 3 61 C2.9071875 62.670625 2.9071875 62.670625 2.8125 64.375 C2.9053125 66.169375 2.9053125 66.169375 3 68 C4.485 68.99 4.485 68.99 6 70 C7.06246527 71.96752828 8.07137808 73.96587579 9 76 C7.35 76 5.7 76 4 76 C4.33 75.34 4.66 74.68 5 74 C4.67 73.34 4.34 72.68 4 72 C3.34 71.79375 2.68 71.5875 2 71.375 C1.01 70.694375 1.01 70.694375 0 70 C-0.26008582 68.01684562 -0.51112659 66.03030127 -0.65234375 64.03515625 C-1.17393136 60.98181756 -2.95802085 59.23959004 -5 57 C-5 56.34 -5 55.68 -5 55 C-10.32874205 53.22375265 -13.65253345 52.66101338 -18.875 54.75 C-23.36448207 55.27817436 -27.39132983 52.40578011 -31 50 C-32.03125 50.020625 -33.0625 50.04125 -34.125 50.0625 C-38.17699021 49.99714532 -40.95387211 49.17348344 -44.69140625 47.75390625 C-50.27743222 45.92970488 -56.05268562 45.73848405 -61.875 45.4375 C-63.050625 45.37272461 -63.050625 45.37272461 -64.25 45.30664062 C-66.16650649 45.20146649 -68.08323333 45.10032075 -70 45 C-70 44.67 -70 44.34 -70 44 C-65.71 44 -61.42 44 -57 44 C-56.34 42.68 -55.68 41.36 -55 40 C-52.79173622 39.97277483 -50.58337362 39.95350271 -48.375 39.9375 C-47.14523438 39.92589844 -45.91546875 39.91429687 -44.6484375 39.90234375 C-41.32276209 39.99136076 -38.25952412 40.36313913 -35 41 C-35.1546875 39.88625 -35.1546875 39.88625 -35.3125 38.75 C-35.209375 37.8425 -35.10625 36.935 -35 36 C-34.195625 35.4225 -33.39125 34.845 -32.5625 34.25 C-29.62027374 31.66658182 -29.57244753 30.98282453 -29.1875 27.25 C-29.10302504 25.83447371 -29.03332091 24.41765314 -29 23 C-30.0725 23.350625 -31.145 23.70125 -32.25 24.0625 C-35.78720743 24.94680186 -36.74811124 25.02880551 -40 24 C-39.02160156 23.68546875 -38.04320312 23.3709375 -37.03515625 23.046875 C-22.709946 18.39685466 -8.22548363 13.61459359 0 0 Z " fill="#FCE838" transform="translate(174,40)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C1.65 2 3.3 2 5 2 C5.33 3.98 5.66 5.96 6 8 C7.11375 7.649375 8.2275 7.29875 9.375 6.9375 C13 6 13 6 15 7 C15.33 6.01 15.66 5.02 16 4 C20.12751449 4.60698743 23.3321148 6.03810791 27 8 C27 7.01 27 6.02 27 5 C28.60488281 5.41572266 28.60488281 5.41572266 30.2421875 5.83984375 C44.11849269 9.20286157 57.75979294 9.80659595 72 10 C72 10.33 72 10.66 72 11 C67.38 11.66 62.76 12.32 58 13 C59.98 13.66 61.96 14.32 64 15 C64 15.66 64 16.32 64 17 C66.31 17 68.62 17 71 17 C70.67 17.66 70.34 18.32 70 19 C67.97456444 19.25719817 65.94649776 19.50842122 63.91015625 19.65625 C61.76477844 19.85476212 61.76477844 19.85476212 60 22 C57.36611587 22.33617833 54.83178156 22.55799378 52.1875 22.6875 C51.47529297 22.73455078 50.76308594 22.78160156 50.02929688 22.83007812 C46.14943015 23.04901603 42.78211953 22.81794452 39 22 C38.01 22.495 38.01 22.495 37 23 C24.4695256 24.6344097 11.43636867 14.84999796 1.95703125 7.70703125 C-0.3908936 5.83597689 -2.7111666 3.94266672 -5 2 C-2 0 -2 0 0 0 Z " fill="#E8D0BB" transform="translate(57,204)"/>
<path d="M0 0 C3.16115776 1.36983503 3.9927092 1.9890638 6 5 C6.99 5.33 7.98 5.66 9 6 C8.96519531 7.13888672 8.96519531 7.13888672 8.9296875 8.30078125 C8.91164063 9.29464844 8.89359375 10.28851563 8.875 11.3125 C8.84019531 12.79169922 8.84019531 12.79169922 8.8046875 14.30078125 C8.79317361 17.22406527 8.79317361 17.22406527 11 20 C13.05925139 20.72382467 13.05925139 20.72382467 15 21 C15.66 19.68 16.32 18.36 17 17 C20.17991842 20.17991842 21.17038542 22.17646028 21.25 26.5625 C21.29790263 28.89374126 21.29790263 28.89374126 22 31 C24.45439687 32.9677041 27.02361593 34.0304717 30 35 C30.33 34.34 30.66 33.68 31 33 C33.05680002 36.08520003 33.29466814 36.91273504 33.3125 40.4375 C33.32925781 41.19933594 33.34601562 41.96117187 33.36328125 42.74609375 C32.8967598 45.6405333 32.09850344 46.95624013 30 49 C23.25033652 50.62845458 17.07793744 48.81349119 11.17578125 45.5 C7.99006633 43.30374411 6.06861607 41.28125307 4 38 C4.33 37.01 4.66 36.02 5 35 C5.33 35.99 5.66 36.98 6 38 C6.66 38 7.32 38 8 38 C7.50628906 37.30132812 7.01257813 36.60265625 6.50390625 35.8828125 C5.86324219 34.97273438 5.22257812 34.06265625 4.5625 33.125 C3.92441406 32.22007812 3.28632813 31.31515625 2.62890625 30.3828125 C-0.46443277 25.8577842 -0.24377574 22.36306636 0 17 C0.32550502 15.33178677 0.65846063 13.66500443 1 12 C1.21406182 7.91635909 1.30731742 3.92195225 0 0 Z " fill="#F9D127" transform="translate(19,178)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C4.97008031 7.48976775 6.22553475 14.9129682 6 23 C5.34 23.66 4.68 24.32 4 25 C3.505 23.515 3.505 23.515 3 22 C2.34 22 1.68 22 1 22 C1 23.32 1 24.64 1 26 C0.34 26.33 -0.32 26.66 -1 27 C-0.67 27.99 -0.34 28.98 0 30 C-0.99 30.33 -1.98 30.66 -3 31 C-2.95875 32.258125 -2.9175 33.51625 -2.875 34.8125 C-2.7609626 38.29064073 -2.94074319 38.91111478 -5 42 C-5.16713569 44.62531524 -5.16713569 44.62531524 -5 47 C-9.455 47.495 -9.455 47.495 -14 48 C-14 46.68 -14 45.36 -14 44 C-14.66 44 -15.32 44 -16 44 C-16 44.66 -16 45.32 -16 46 C-17.65 46.66 -19.3 47.32 -21 48 C-20.67 50.31 -20.34 52.62 -20 55 C-22.38564077 54.42415568 -24.66682784 53.77772405 -27 53 C-26.49513181 48.65813356 -26.04988547 45.23472702 -23 42 C-19.672309 41.27005488 -16.4004621 41.07017839 -13 41 C-13 39.35 -13 37.7 -13 36 C-14.65 36 -16.3 36 -18 36 C-18 35.01 -18 34.02 -18 33 C-18.66 32.67 -19.32 32.34 -20 32 C-19.01 31.34 -18.02 30.68 -17 30 C-16.42251197 28.03638136 -16.42251197 28.03638136 -16.3125 25.875 C-16.209375 24.59625 -16.10625 23.3175 -16 22 C-16.99 22 -17.98 22 -19 22 C-19 22.66 -19 23.32 -19 24 C-25.45 28.09326923 -25.45 28.09326923 -28.234375 27.62109375 C-28.81703125 27.41613281 -29.3996875 27.21117187 -30 27 C-29.32195312 26.59910156 -28.64390625 26.19820312 -27.9453125 25.78515625 C-17.42375612 19.35855464 -8.45555853 11.59881367 -1.25 1.5625 C-0.8375 1.046875 -0.425 0.53125 0 0 Z " fill="#16081E" transform="translate(186,192)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C4.33 0.66 4.66 1.32 5 2 C5.66 1.67 6.32 1.34 7 1 C8.79059807 4.58119613 8.18469346 8.74431683 8.1875 12.6875 C8.19974609 13.57373047 8.21199219 14.45996094 8.22460938 15.37304688 C8.2363301 20.65128201 7.72818369 25.00671038 6 30 C6.66 30 7.32 30 8 30 C8.08131463 31.43655854 8.13933559 32.8744483 8.1875 34.3125 C8.23970703 35.51326172 8.23970703 35.51326172 8.29296875 36.73828125 C8 39 8 39 6.80859375 40.74609375 C4.46295975 42.37233244 2.70737992 42.53530065 -0.125 42.75 C-1.01445312 42.82734375 -1.90390625 42.9046875 -2.8203125 42.984375 C-3.53960937 42.98953125 -4.25890625 42.9946875 -5 43 C-6 42 -6 42 -6.11352539 39.49975586 C-6.10828857 38.41573486 -6.10305176 37.33171387 -6.09765625 36.21484375 C-6.09443359 35.04501953 -6.09121094 33.87519531 -6.08789062 32.66992188 C-6.07951172 31.43822266 -6.07113281 30.20652344 -6.0625 28.9375 C-6.05798828 27.70193359 -6.05347656 26.46636719 -6.04882812 25.19335938 C-6.03699608 22.12885883 -6.02051173 19.06445279 -6 16 C-6.78375 16.495 -7.5675 16.99 -8.375 17.5 C-11 19 -11 19 -13 19 C-13.66 20.32 -14.32 21.64 -15 23 C-16.32 22.67 -17.64 22.34 -19 22 C-18.67 21.01 -18.34 20.02 -18 19 C-19.98 19.99 -21.96 20.98 -24 22 C-24.25 18.6875 -24.25 18.6875 -24 15 C-22 13.1875 -22 13.1875 -20 12 C-20 11.34 -20 10.68 -20 10 C-19.34 10 -18.68 10 -18 10 C-17.67 9.01 -17.34 8.02 -17 7 C-16.34 7 -15.68 7 -15 7 C-15.99 5.68 -16.98 4.36 -18 3 C-17.67 2.34 -17.34 1.68 -17 1 C-14.525 1.99 -14.525 1.99 -12 3 C-12 3.99 -12 4.98 -12 6 C-10.35 6 -8.7 6 -7 6 C-6.67 7.32 -6.34 8.64 -6 10 C-4.35 10 -2.7 10 -1 10 C-0.06619039 5.46859347 -0.06619039 5.46859347 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#27050C" transform="translate(251,173)"/>
<path d="M0 0 C0.66 1.32 1.32 2.64 2 4 C2.66 4 3.32 4 4 4 C7.32696907 10.65393815 4.94089422 21.09427691 3 28 C2.02699551 30.84594198 0.99862732 33.656337 -0.09765625 36.45703125 C-1.19599647 39.35992334 -1.19599647 39.35992334 -2 44 C2.62 44 7.24 44 12 44 C10.50120034 46.99759932 8.19691136 47.30788674 5.14453125 48.40234375 C2.3765057 49.17376071 -0.1459642 49.21405269 -3 49 C-3 49.66 -3 50.32 -3 51 C-10.9746335 54.23608316 -18.3743491 55.55579663 -26.625 52.5 C-27.73875 52.005 -28.8525 51.51 -30 51 C-29.7178191 47.61382918 -29.38326338 46.33042253 -26.76171875 44.0703125 C-25.39466797 43.04550781 -25.39466797 43.04550781 -24 42 C-17.05654731 36.81534011 -17.05654731 36.81534011 -11.125 30.5625 C-9 28 -9 28 -6.6875 27.125 C-6.130625 27.08375 -5.57375 27.0425 -5 27 C-4.71125 25.96875 -4.4225 24.9375 -4.125 23.875 C-3.49001245 21.60718731 -2.78877838 19.43034169 -1.96875 17.21875 C-0.88747504 13.62612675 -0.58679198 10.36665836 -0.375 6.625 C-0.30023438 5.37976562 -0.22546875 4.13453125 -0.1484375 2.8515625 C-0.09945312 1.91054688 -0.05046875 0.96953125 0 0 Z " fill="#F86307" transform="translate(179,27)"/>
<path d="M0 0 C1.33333333 0 2.66666667 0 4 0 C3.95875 1.093125 3.9175 2.18625 3.875 3.3125 C3.67925334 7.08892229 3.67925334 7.08892229 6 10 C8.58380177 10.25030977 8.58380177 10.25030977 11 10 C11.66 8.02 12.32 6.04 13 4 C14 7 14 7 14 9 C16.475 9.495 16.475 9.495 19 10 C19 10.66 19 11.32 19 12 C20.65 12 22.3 12 24 12 C24 11.34 24 10.68 24 10 C25.32 10.33 26.64 10.66 28 11 C27.41203275 16.21820931 25.68573337 20.36185656 23.5 25.0625 C20.59117389 31.31201688 20.59117389 31.31201688 19 38 C17.515 38.495 17.515 38.495 16 39 C16 38.34 16 37.68 16 37 C14.515 37.495 14.515 37.495 13 38 C12.67 35.03 12.34 32.06 12 29 C10.68 29 9.36 29 8 29 C8 29.66 8 30.32 8 31 C8.66 31.33 9.32 31.66 10 32 C9.67 32.99 9.34 33.98 9 35 C7.35 34.01 5.7 33.02 4 32 C4 33.65 4 35.3 4 37 C2.35 37 0.7 37 -1 37 C-1 35.68 -1 34.36 -1 33 C-1.99 32.67 -2.98 32.34 -4 32 C-3.34 30.35 -2.68 28.7 -2 27 C-1.67 27.99 -1.34 28.98 -1 30 C-0.01 30 0.98 30 2 30 C1.649375 29.38125 1.29875 28.7625 0.9375 28.125 C0.4734375 27.073125 0.4734375 27.073125 0 26 C0.33 25.34 0.66 24.68 1 24 C-0.98 23.34 -2.96 22.68 -5 22 C-4.65259661 14.14868332 -2.71548094 7.35074375 0 0 Z " fill="#173173" transform="translate(8,91)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C2.32 2 3.64 2 5 2 C5 2.66 5 3.32 5 4 C5.66 4 6.32 4 7 4 C7.33 3.34 7.66 2.68 8 2 C7.814375 2.763125 7.62875 3.52625 7.4375 4.3125 C6.77180827 7.08967375 6.77180827 7.08967375 8 10 C6.68 9.67 5.36 9.34 4 9 C3.67 9.99 3.34 10.98 3 12 C3.66 12.33 4.32 12.66 5 13 C5 14.32 5 15.64 5 17 C6.65 17 8.3 17 10 17 C10 15.35 10 13.7 10 12 C12.475 12.99 12.475 12.99 15 14 C15.33 13.34 15.66 12.68 16 12 C15.01 11.67 14.02 11.34 13 11 C14.3125 9.5 14.3125 9.5 16 8 C16.99 8 17.98 8 19 8 C19.33 10.97 19.66 13.94 20 17 C20.66 17 21.32 17 22 17 C22.02687279 18.81242052 22.04633715 20.62495233 22.0625 22.4375 C22.07410156 23.44683594 22.08570312 24.45617187 22.09765625 25.49609375 C22 28 22 28 21 29 C20.76807135 30.51469448 20.58784762 32.03754562 20.4375 33.5625 C20.35371094 34.38878906 20.26992188 35.21507812 20.18359375 36.06640625 C20.09271484 37.02353516 20.09271484 37.02353516 20 38 C19.67 38 19.34 38 19 38 C18.505 33.05 18.505 33.05 18 28 C17.34 29.98 16.68 31.96 16 34 C14.35 34 12.7 34 11 34 C10.67 35.98 10.34 37.96 10 40 C10.66 40.33 11.32 40.66 12 41 C11.505 41.495 11.505 41.495 11 42 C9.33333333 42 7.66666667 42 6 42 C5.505 42.495 5.505 42.495 5 43 C4.34 43 3.68 43 3 43 C3 43.66 3 44.32 3 45 C3.66 45 4.32 45 5 45 C5 45.66 5 46.32 5 47 C5.66 47 6.32 47 7 47 C7 47.66 7 48.32 7 49 C5.0625 49.5625 5.0625 49.5625 3 50 C2.67 49.67 2.34 49.34 2 49 C2.04125 50.093125 2.0825 51.18625 2.125 52.3125 C2 56 2 56 0 59 C-1.7332757 49.84798844 -2.31614382 40.91831323 -2.26074219 31.63427734 C-2.25001001 29.5019896 -2.26071342 27.3705439 -2.2734375 25.23828125 C-2.28084882 16.67672444 -1.59663747 8.4305368 0 0 Z " fill="#1F225A" transform="translate(2,111)"/>
<path d="M0 0 C4.77378396 1.5587866 7.25661538 3.02716339 10.375 7 C13.53668504 10.9144672 16.24166523 12.24667205 21.08203125 13.4296875 C23 14 23 14 25 16 C24.505 17.485 24.505 17.485 24 19 C23.443125 18.360625 22.88625 17.72125 22.3125 17.0625 C19.77933439 14.80319013 18.31658576 14.36850953 15 14 C15.495 17.96 15.495 17.96 16 22 C11.46298506 23.45184478 7.81938524 24.23509196 3 24 C3 23.01 3 22.02 3 21 C1.7625 21.020625 0.525 21.04125 -0.75 21.0625 C-3.6640825 21.06766681 -6.20953327 20.93015558 -9 20 C-9 20.66 -9 21.32 -9 22 C-9.84304687 22.06058594 -10.68609375 22.12117188 -11.5546875 22.18359375 C-12.65039062 22.26738281 -13.74609375 22.35117188 -14.875 22.4375 C-16.51082031 22.55931641 -16.51082031 22.55931641 -18.1796875 22.68359375 C-20.94728971 22.83001703 -20.94728971 22.83001703 -23 24 C-23.22151549 22.20991533 -23.42682213 20.41781838 -23.625 18.625 C-23.74101562 17.62726563 -23.85703125 16.62953125 -23.9765625 15.6015625 C-23.98429688 14.74304688 -23.99203125 13.88453125 -24 13 C-23.34 12.34 -22.68 11.68 -22 11 C-21.01 11 -20.02 11 -19 11 C-18.9175 10.401875 -18.835 9.80375 -18.75 9.1875 C-17.74714695 6.26251194 -16.74232413 5.4082205 -14 4 C-10.8125 4.375 -10.8125 4.375 -8 5 C-7.67 4.67 -7.34 4.34 -7 4 C-3.10581163 3.55747859 -1.50932491 3.62096751 1.6875 6 C2.450625 6.66 3.21375 7.32 4 8 C4.99 8 5.98 8 7 8 C4.74259377 5.66475218 2.7194239 3.81294927 0 2 C0 1.34 0 0.68 0 0 Z " fill="#F3A325" transform="translate(244,119)"/>
<path d="M0 0 C3.6838231 2.45588207 3.90768058 3.79760447 5 8 C6.80666921 20.90726177 2.06958328 31.44173106 -5 42 C-5 42.66 -5 43.32 -5 44 C-0.3872609 42.68207454 3.11593582 40.71636045 7 38 C8.82386505 36.75682741 10.65810462 35.52879898 12.5 34.3125 C13.3971875 33.71050781 14.294375 33.10851562 15.21875 32.48828125 C18.20108505 30.89239691 20.65687258 30.36872729 24 30 C23.62488281 30.4125 23.24976563 30.825 22.86328125 31.25 C17.60109694 37.18818279 11.31279514 44.46447046 10.75 52.625 C10.63598616 56.07127924 10.63598616 56.07127924 13 58 C16.48368398 57.90584638 17.86204291 57.12071245 20.5 54.8125 C22.27111387 52.8199969 23.9564756 50.82316654 25.625 48.75 C28 46 28 46 31 45 C30.72929687 45.49628906 30.45859375 45.99257812 30.1796875 46.50390625 C28.2619329 50.56167178 26.85509204 54.83027668 25.38671875 59.06835938 C23.84784011 63.32220265 22.25984111 66.73376705 19 70 C18.01 70 17.02 70 16 70 C16.66 68.35 17.32 66.7 18 65 C17.34 65 16.68 65 16 65 C16.495 63.515 16.495 63.515 17 62 C16.38511719 62.04640625 15.77023438 62.0928125 15.13671875 62.140625 C8.57256461 62.43376107 8.57256461 62.43376107 5.9375 60.4375 C4.27006859 56.10217832 4.27669193 52.76272856 6.0546875 48.4296875 C7.84705533 44.7919232 9.74954437 41.37568344 12 38 C10.68 38.66 9.36 39.32 8 40 C8 40.66 8 41.32 8 42 C5.6640625 43.69140625 5.6640625 43.69140625 2.625 45.5625 C1.12839844 46.49255859 1.12839844 46.49255859 -0.3984375 47.44140625 C-3.87950924 49.52691319 -5.59711364 50.12004123 -9.625 50.0625 C-10.85089844 50.04896484 -10.85089844 50.04896484 -12.1015625 50.03515625 C-12.72804687 50.02355469 -13.35453125 50.01195312 -14 50 C-14.8203125 47.828125 -14.8203125 47.828125 -15 45 C-13.33655402 42.98924113 -11.81722112 41.44448572 -9.875 39.75 C-3.13085627 33.46272451 1.71794487 27.09650711 2.09765625 17.54296875 C2.08605469 16.76566406 2.07445312 15.98835938 2.0625 15.1875 C2.05347656 14.39730469 2.04445312 13.60710938 2.03515625 12.79296875 C2.02355469 12.20128906 2.01195312 11.60960937 2 11 C1.46375 12.155 0.9275 13.31 0.375 14.5 C-2.31035522 18.84623966 -5.66059863 21.022911 -10 23.5 C-10.60537598 23.84998047 -11.21075195 24.19996094 -11.83447266 24.56054688 C-15.35232834 26.46769089 -17.99326046 27.42495722 -22 27 C-19.41031136 25.27354091 -17.07347822 24.12890493 -14.25 22.875 C-8.43497891 20.02283006 -3.92233514 15.84467028 -1 10 C-0.77377919 8.29636178 -0.59111527 6.58671299 -0.4375 4.875 C-0.35371094 3.96492188 -0.26992187 3.05484375 -0.18359375 2.1171875 C-0.09271484 1.06917969 -0.09271484 1.06917969 0 0 Z " fill="#EE6218" transform="translate(202,44)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 0.66 3 1.32 3 2 C4.94603274 2.59070014 4.94603274 2.59070014 7 3 C7.33 2.67 7.66 2.34 8 2 C10.23074644 1.92760255 12.44492191 2.00350207 14.67578125 2.0625 C16.94194917 2.00156103 18.83164585 1.63512433 21 1 C15.80746961 5.56313277 11.15130584 7.96949388 4.3125 8.375 C-2.03278812 8.84752146 -7.27591886 11.37356601 -13 14 C-14.26263672 14.53367187 -14.26263672 14.53367187 -15.55078125 15.078125 C-19.0809817 16.57326872 -22.03556254 18.02510297 -25.1875 20.25 C-28.64650586 22.40227031 -30.00445175 22.87902062 -34 22 C-36.89360945 19.88745542 -39.46253344 17.52458602 -42 15 C-41.979375 16.11375 -41.95875 17.2275 -41.9375 18.375 C-42 22 -42 22 -43 24 C-44.32 24 -45.64 24 -47 24 C-47 22.02 -47 20.04 -47 18 C-48.093125 18.185625 -49.18625 18.37125 -50.3125 18.5625 C-54 19 -54 19 -57 18 C-56.67 19.32 -56.34 20.64 -56 22 C-57.65 22.33 -59.3 22.66 -61 23 C-61.33 21.02 -61.66 19.04 -62 17 C-61.01 17 -60.02 17 -59 17 C-59 16.01 -59 15.02 -59 14 C-59.66 14 -60.32 14 -61 14 C-60.67 13.01 -60.34 12.02 -60 11 C-59.195625 10.87625 -58.39125 10.7525 -57.5625 10.625 C-56.716875 10.41875 -55.87125 10.2125 -55 10 C-54.67 9.34 -54.34 8.68 -54 8 C-54.99 8 -55.98 8 -57 8 C-57.33 7.01 -57.66 6.02 -58 5 C-57.34 4.01 -56.68 3.02 -56 2 C-56 2.66 -56 3.32 -56 4 C-52.87348943 5.85274701 -50.62826895 6.45353362 -47 6 C-45.63838689 5.03886134 -44.30144802 4.04115841 -43 3 C-42.01 3 -41.02 3 -40 3 C-39.34 6.3 -38.68 9.6 -38 13 C-37.01 13.33 -36.02 13.66 -35 14 C-35 13.34 -35 12.68 -35 12 C-34.01 12.33 -33.02 12.66 -32 13 C-31.34 11.68 -30.68 10.36 -30 9 C-27.7522025 11.05233685 -26.9977758 12.00667261 -26 15 C-24.35 14.67 -22.7 14.34 -21 14 C-19.66666667 11 -19.66666667 11 -21 8 C-20.34 7.34 -19.68 6.68 -19 6 C-17.5393715 8.64738916 -17 9.89448334 -17 13 C-16.01 13 -15.02 13 -14 13 C-14 12.34 -14 11.68 -14 11 C-10.535 10.505 -10.535 10.505 -7 10 C-7 8.68 -7 7.36 -7 6 C-6.34 6 -5.68 6 -5 6 C-5 5.34 -5 4.68 -5 4 C-4.34 4 -3.68 4 -3 4 C-3 4.66 -3 5.32 -3 6 C-2.34 6 -1.68 6 -1 6 C-0.67 4.02 -0.34 2.04 0 0 Z M-29 12 C-28 15 -28 15 -28 15 Z " fill="#2076C5" transform="translate(94,53)"/>
<path d="M0 0 C2 2 2 2 2.1875 5.8125 C2.13349297 8.13064801 1.96715005 10.16014348 1.5 12.4375 C0.5267734 17.4252863 -0.13838984 21.83910432 2.3046875 26.4765625 C3.36169398 28.02919882 4.45516413 29.55787609 5.58984375 31.0546875 C7 33 7 33 8 36 C7.34 36 6.68 36 6 36 C7.5113474 40.23177273 10.21823151 41.7754303 14 44 C17.67800071 45.72253033 20.63009864 46.29589399 24.6875 46.3125 C25.64011719 46.32925781 26.59273437 46.34601563 27.57421875 46.36328125 C28.37472656 46.24339844 29.17523438 46.12351563 30 46 C32.105184 42.842224 32.25289344 42.04602866 32.1875 38.4375 C32.17783203 37.25994141 32.17783203 37.25994141 32.16796875 36.05859375 C32.12364089 33.93645328 32.12364089 33.93645328 31 32 C30.46375 32.2475 29.9275 32.495 29.375 32.75 C27 33 27 33 23.8125 31.625 C20.31412289 28.35984803 20.40697658 26.70566478 20.2109375 22.12890625 C19.93983207 19.39274964 18.92508991 17.92508991 17 16 C16.34 16.99 15.68 17.98 15 19 C12.625 18.6875 12.625 18.6875 10 18 C7.86413322 14.79619983 7.76867825 13.98060033 7.875 10.3125 C7.89304687 9.50425781 7.91109375 8.69601563 7.9296875 7.86328125 C7.95289063 7.24839844 7.97609375 6.63351563 8 6 C8.33 6 8.66 6 9 6 C9.10957031 6.69867188 9.21914063 7.39734375 9.33203125 8.1171875 C9.49058594 9.02726563 9.64914063 9.93734375 9.8125 10.875 C9.96332031 11.77992188 10.11414062 12.68484375 10.26953125 13.6171875 C10.83051301 16.34412478 10.83051301 16.34412478 14 18 C14 16.35 14 14.7 14 13 C16.97 13.99 19.94 14.98 23 16 C23.33 15.34 23.66 14.68 24 14 C25.5358444 15.56877674 27.05331331 17.15556154 28.5625 18.75 C29.40941406 19.63171875 30.25632813 20.5134375 31.12890625 21.421875 C33 24 33 24 32.77734375 26.328125 C32.39255859 27.15570313 32.39255859 27.15570313 32 28 C32 27.34 32 26.68 32 26 C31.34 26 30.68 26 30 26 C30.65484375 26.68449219 31.3096875 27.36898437 31.984375 28.07421875 C34.44271732 31.6426265 34.42284693 33.53453856 34.25 37.8125 C34.21390625 38.97394531 34.1778125 40.13539063 34.140625 41.33203125 C34.09421875 42.21246094 34.0478125 43.09289062 34 44 C36.64 43.67 39.28 43.34 42 43 C42 43.66 42 44.32 42 45 C39.69 45.66 37.38 46.32 35 47 C35.99 47 36.98 47 38 47 C38 47.66 38 48.32 38 49 C36.68 49 35.36 49 34 49 C34 49.99 34 50.98 34 52 C31.23735711 52.59732819 28.83967231 53 26 53 C26 53.66 26 54.32 26 55 C23.69 55.99 21.38 56.98 19 58 C13.16784683 51.43746503 7.63208078 44.8321604 2.875 37.4375 C2.30857788 36.56327393 2.30857788 36.56327393 1.73071289 35.67138672 C-1.55325736 30.43686782 -2.1463143 26.41916183 -2.625 20.3125 C-2.76808594 18.57419922 -2.76808594 18.57419922 -2.9140625 16.80078125 C-2.94242188 15.87652344 -2.97078125 14.95226562 -3 14 C-2.67 13.67 -2.34 13.34 -2 13 C-1.60333773 10.81980521 -1.25684763 8.6303537 -0.9375 6.4375 C-0.76089844 5.23996094 -0.58429687 4.04242188 -0.40234375 2.80859375 C-0.26957031 1.88175781 -0.13679688 0.95492187 0 0 Z " fill="#7B2012" transform="translate(19,180)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.43200679 4.75207471 -0.01510917 7.78210698 -2 12 C-2.66 12 -3.32 12 -4 12 C-4.185625 12.680625 -4.37125 13.36125 -4.5625 14.0625 C-8.12135751 21.33494796 -15.072485 25.63853485 -21.64453125 30.0078125 C-24.23264787 32.19676686 -25.03940577 33.79061581 -26 37 C-16.63179359 39.77576486 -8.41016156 39.54574419 1 37 C1 36.34 1 35.68 1 35 C1.58007812 34.89042969 2.16015625 34.78085938 2.7578125 34.66796875 C7.62354805 33.68036896 11.59074011 32.35844134 16 30 C18.375 29.3125 18.375 29.3125 20 29 C20 28.34 20 27.68 20 27 C20.66 27 21.32 27 22 27 C20.56836163 32.53707193 16.61309738 35.47318456 12.5 39.125 C11.13296725 40.35405188 9.76828249 41.58572165 8.40625 42.8203125 C7.80103516 43.35930176 7.19582031 43.89829102 6.57226562 44.45361328 C4.77545014 46.11555822 4.77545014 46.11555822 3 49 C3.31506627 52.14221967 3.31506627 52.14221967 4 55 C7.3 55.99 10.6 56.98 14 58 C14 58.33 14 58.66 14 59 C10.7 59.99 7.4 60.98 4 62 C3.67 63.98 3.34 65.96 3 68 C2.01 67.505 2.01 67.505 1 67 C1.0825 65.9275 1.165 64.855 1.25 63.75 C0.95285655 59.29284827 0.05234677 58.95696093 -3 56 C-3.49573145 52.03414842 -3.09491746 49.40424088 -1 46 C-1.70125 46.33 -2.4025 46.66 -3.125 47 C-6.26003116 48.09044562 -8.70563182 48.15322643 -12 48 C-12 46.68 -12 45.36 -12 44 C-12.763125 43.9175 -13.52625 43.835 -14.3125 43.75 C-19.96161629 42.60102719 -26.84046079 41.15953921 -31 37 C-31.125 34.75 -31.125 34.75 -30 32 C-27.52719101 29.72354309 -24.77540647 27.8872764 -22 26 C-11.67022884 18.69551827 -5.15779034 11.72225077 0 0 Z " fill="#FA9403" transform="translate(175,41)"/>
<path d="M0 0 C0.99 0.495 0.99 0.495 2 1 C2.60225892 3.89084281 2.80576843 5.22457542 2 8 C-9.17672911 21.48176197 -34.28777961 28.98925437 -51 31 C-56.06665983 31.22067813 -61.11735399 31.19081318 -66.1875 31.125 C-67.53449847 31.1149393 -68.88150431 31.10581897 -70.22851562 31.09765625 C-73.48587021 31.07430604 -76.74283549 31.0415577 -80 31 C-80 30.67 -80 30.34 -80 30 C-78.19402344 29.90912109 -78.19402344 29.90912109 -76.3515625 29.81640625 C-74.77602923 29.73200268 -73.20050904 29.64735459 -71.625 29.5625 C-70.8309375 29.52318359 -70.036875 29.48386719 -69.21875 29.44335938 C-64.97398779 29.31106596 -64.97398779 29.31106596 -61 28 C-61.99 27.67 -62.98 27.34 -64 27 C-64 25.68 -64 24.36 -64 23 C-64.66 23 -65.32 23 -66 23 C-66 23.66 -66 24.32 -66 25 C-66.66 25 -67.32 25 -68 25 C-67.34 23.35 -66.68 21.7 -66 20 C-65.01 20 -64.02 20 -63 20 C-63 19.34 -63 18.68 -63 18 C-60.36 18 -57.72 18 -55 18 C-55 18.33 -55 18.66 -55 19 C-57.31 19 -59.62 19 -62 19 C-62 19.66 -62 20.32 -62 21 C-41.00653702 20.4838608 -18.99315909 19.04643911 -2.28515625 4.5078125 C-0.7625347 2.91213869 -0.7625347 2.91213869 0 0 Z " fill="#341323" transform="translate(185,182)"/>
<path d="M0 0 C2.31 0 4.62 0 7 0 C9.29969419 27.11314985 9.29969419 27.11314985 9 40 C5.37 40 1.74 40 -2 40 C-1.34 40.66 -0.68 41.32 0 42 C0.125 45.625 0.125 45.625 0 49 C-0.66 49 -1.32 49 -2 49 C-2 49.99 -2 50.98 -2 52 C-7.75 50.25 -7.75 50.25 -10 48 C-10.30599063 45.43083343 -10.51087087 42.95241616 -10.625 40.375 C-10.66367188 39.66859375 -10.70234375 38.9621875 -10.7421875 38.234375 C-10.83647724 36.49001476 -10.91932891 34.74504309 -11 33 C-9.27473958 34.04166667 -7.54947917 35.08333333 -5.82421875 36.125 C-3.88638074 37.21623999 -3.88638074 37.21623999 -1 37 C-1.99 26.44 -2.98 15.88 -4 5 C-3.01 4.34 -2.02 3.68 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#652C3B" transform="translate(205,179)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.84349132 7.47743661 2.39900513 13.80298461 0 21 C-0.99 21 -1.98 21 -3 21 C-3.185625 22.8871875 -3.185625 22.8871875 -3.375 24.8125 C-3.69868059 28.10325263 -4.06604999 29.09907498 -6 32 C-6.66 32 -7.32 32 -8 32 C-8 32.66 -8 33.32 -8 34 C-11.13951632 37.89300024 -14.47128702 39.20560429 -19 41 C-19.33 41.33 -19.66 41.66 -20 42 C-21.093125 42.12375 -22.18625 42.2475 -23.3125 42.375 C-26.92583697 42.68692578 -26.92583697 42.68692578 -29 44.5625 C-31.93660812 46.67318708 -34.48813597 46.20260754 -38 46 C-38 46.66 -38 47.32 -38 48 C-42.62 48.33 -47.24 48.66 -52 49 C-52 48.67 -52 48.34 -52 48 C-50.94683594 47.731875 -49.89367187 47.46375 -48.80859375 47.1875 C-33.59111401 43.13045276 -21.14823416 37.33185214 -10 26 C-12.88704205 26.89962642 -12.88704205 26.89962642 -15.09375 27.97265625 C-21.57156072 30.90659974 -26.9355059 31.4835015 -34 31 C-33.34 30.67 -32.68 30.34 -32 30 C-32 29.34 -32 28.68 -32 28 C-30.41701974 27.5196682 -28.83360022 27.04078388 -27.25 26.5625 C-26.36828125 26.29566406 -25.4865625 26.02882812 -24.578125 25.75390625 C-22.39434165 25.11531506 -20.21164502 24.53224167 -18 24 C-18 23.34 -18 22.68 -18 22 C-17.34 21.34 -16.68 20.68 -16 20 C-16.66 19.34 -17.32 18.68 -18 18 C-17.48050781 17.78085938 -16.96101563 17.56171875 -16.42578125 17.3359375 C-9.92304345 14.37905488 -5.85563785 10.74968946 -3 4 C-2.34 4 -1.68 4 -1 4 C-0.67 2.68 -0.34 1.36 0 0 Z " fill="#F2C896" transform="translate(177,153)"/>
<path d="M0 0 C3.09604758 0.07371542 5.26766553 0.34845063 7.62890625 2.44921875 C9.92618443 5.10346748 11.80776557 7.63224718 13.4375 10.75 C15.72506687 14.0440963 18.26350062 14.66050022 22 16 C21.34 16.33 20.68 16.66 20 17 C20 17.99 20 18.98 20 20 C20.9075 20.12375 21.815 20.2475 22.75 20.375 C27.79310345 21.34482759 27.79310345 21.34482759 30 23 C31.35830457 26.19201574 32 28.52710626 32 32 C30.5 33.6875 30.5 33.6875 29 35 C29.99 35 30.98 35 32 35 C32 35.66 32 36.32 32 37 C16.08110623 32.56358698 4.74478958 22.14362181 -3.8203125 8.25 C-5 6 -5 6 -5 4 C-4.0409375 3.8453125 -4.0409375 3.8453125 -3.0625 3.6875 C-2.381875 3.460625 -1.70125 3.23375 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#0E2D65" transform="translate(56,173)"/>
<path d="M0 0 C1.25425781 0.02707031 2.50851563 0.05414063 3.80078125 0.08203125 C4.75339844 0.11683594 5.70601562 0.15164062 6.6875 0.1875 C6.8502396 3.23133319 6.96870531 6.26640569 7.0625 9.3125 C7.13791016 10.59640625 7.13791016 10.59640625 7.21484375 11.90625 C7.35918245 18.16092705 7.35918245 18.16092705 5.43066406 21.10839844 C1.95518093 24.70424462 -0.77076334 26.01619593 -5.6875 26.5625 C-9.3125 26.1875 -9.3125 26.1875 -12.125 23.9375 C-15.5874274 19.58473413 -16.78962846 16.96869897 -16.62890625 11.21484375 C-15.95349788 6.88722713 -13.52276271 4.10384177 -10.125 1.53125 C-6.56207329 -0.17103721 -3.92930348 -0.11016739 0 0 Z " fill="#431B31" transform="translate(114.3125,138.8125)"/>
<path d="M0 0 C2.9777759 2.49996659 3.94548483 5.04711071 5.1875 8.6875 C5.53167969 9.68136719 5.87585938 10.67523438 6.23046875 11.69921875 C6.48441406 12.45847656 6.73835937 13.21773437 7 14 C8.32 14 9.64 14 11 14 C11.33 14.99 11.66 15.98 12 17 C14.64 17.33 17.28 17.66 20 18 C20 18.66 20 19.32 20 20 C20.928125 20.268125 21.85625 20.53625 22.8125 20.8125 C25.76240366 21.91148371 27.05615186 22.62418561 29 25 C29.70074844 21.846632 30 19.27275026 30 16 C30.66 16 31.32 16 32 16 C32 15.34 32 14.68 32 14 C34.31 14 36.62 14 39 14 C39.495 16.475 39.495 16.475 40 19 C40.99 19.33 41.98 19.66 43 20 C43.495 23.465 43.495 23.465 44 27 C43.01 27 42.02 27 41 27 C41 27.66 41 28.32 41 29 C38.03312999 30.64826111 35.34373475 31.44271087 32 32 C32.99 32.33 33.98 32.66 35 33 C35 34.32 35 35.64 35 37 C31.25 38.125 31.25 38.125 29 37 C29 34.36 29 31.72 29 29 C28.01 29.33 27.02 29.66 26 30 C25.59265625 29.49984375 25.1853125 28.9996875 24.765625 28.484375 C23.12636532 26.80433376 23.12636532 26.80433376 20.984375 26.890625 C20.24703125 27.00921875 19.5096875 27.1278125 18.75 27.25 C17.56857422 27.42595703 17.56857422 27.42595703 16.36328125 27.60546875 C15.58339844 27.73566406 14.80351562 27.86585937 14 28 C12.6461653 28.1898821 11.29203307 28.37766555 9.9375 28.5625 C8.968125 28.706875 7.99875 28.85125 7 29 C7 29.66 7 30.32 7 31 C5.68 30.67 4.36 30.34 3 30 C3.33 28.35 3.66 26.7 4 25 C3.34 24.67 2.68 24.34 2 24 C2.03480469 22.28103516 2.03480469 22.28103516 2.0703125 20.52734375 C2.08908479 18.9974024 2.10728341 17.46745394 2.125 15.9375 C2.14175781 15.18533203 2.15851563 14.43316406 2.17578125 13.65820312 C2.21865121 8.70672291 1.58399375 4.69585549 0 0 Z " fill="#102867" transform="translate(205,47)"/>
<path d="M0 0 C2.40311598 2.40311598 2.23338606 3.0960927 2.375 6.375 C2.6711333 9.50698604 2.82809915 10.75806548 4.6875 13.375 C11.94625686 18.47574806 19.3266347 20.32361105 28.12109375 20.1953125 C28.86585464 20.1924826 29.61061554 20.18965271 30.37794495 20.18673706 C32.73130101 20.17563917 35.08426109 20.1505551 37.4375 20.125 C39.04361425 20.11495672 40.64973454 20.10583324 42.25585938 20.09765625 C46.17072296 20.07573407 50.0852946 20.04127761 54 20 C51.63758827 23.30464532 49.71671395 25.23013621 46 27 C43.1875 27.1875 43.1875 27.1875 41 27 C40.67 27.66 40.34 28.32 40 29 C36.9375 29.625 36.9375 29.625 34 30 C33.505 28.02 33.505 28.02 33 26 C30.07975631 25.88476681 30.07975631 25.88476681 27.625 26.5625 C24.77236091 27.03793985 22.78002633 26.71486391 20 26 C20 25.34 20 24.68 20 24 C18.68 24.33 17.36 24.66 16 25 C16 25.66 16 26.32 16 27 C14.68 27 13.36 27 12 27 C12 27.66 12 28.32 12 29 C10.35 29.33 8.7 29.66 7 30 C7 28.68 7 27.36 7 26 C3.66462511 27.11179163 2.36292656 28.47411298 0 31 C-1.32 30.34 -2.64 29.68 -4 29 C-4 28.34 -4 27.68 -4 27 C-3.01 26.67 -2.02 26.34 -1 26 C-1.33 25.67 -1.66 25.34 -2 25 C-4.05396726 25.40929986 -4.05396726 25.40929986 -6 26 C-7 23 -7 23 -7 20 C-6.34 20 -5.68 20 -5 20 C-5.20625 18.88625 -5.4125 17.7725 -5.625 16.625 C-5.74875 15.42875 -5.8725 14.2325 -6 13 C-5.34 12.34 -4.68 11.68 -4 11 C-4 11.99 -4 12.98 -4 14 C-3.34 14 -2.68 14 -2 14 C-1.93941406 13.15695313 -1.87882813 12.31390625 -1.81640625 11.4453125 C-1.73261719 10.34960938 -1.64882812 9.25390625 -1.5625 8.125 C-1.48128906 7.03445312 -1.40007812 5.94390625 -1.31640625 4.8203125 C-1 2 -1 2 0 0 Z " fill="#0A0926" transform="translate(191,215)"/>
<path d="M0 0 C-0.33 3.3 -0.66 6.6 -1 10 C-2.4540625 9.01 -2.4540625 9.01 -3.9375 8 C-6.5299253 5.90886852 -6.5299253 5.90886852 -8 6 C-8.61875 6.7115625 -8.61875 6.7115625 -9.25 7.4375 C-11.42837514 9.38247781 -13.14822564 9.61462509 -16 10 C-15.79375 10.61875 -15.5875 11.2375 -15.375 11.875 C-15.25125 12.57625 -15.1275 13.2775 -15 14 C-15.66 14.66 -16.32 15.32 -17 16 C-17 16.66 -17 17.32 -17 18 C-16.01 18.33 -15.02 18.66 -14 19 C-14.99 19.66 -15.98 20.32 -17 21 C-16.505 22.98 -16.505 22.98 -16 25 C-16.99 25.33 -17.98 25.66 -19 26 C-18.67 26.33 -18.34 26.66 -18 27 C-17.95936168 28.66617115 -17.957279 30.33388095 -18 32 C-20.97 32.495 -20.97 32.495 -24 33 C-23.34 31.02 -22.68 29.04 -22 27 C-22.99 26.67 -23.98 26.34 -25 26 C-25.33 26.99 -25.66 27.98 -26 29 C-26.99 28.67 -27.98 28.34 -29 28 C-28.625 26.0625 -28.625 26.0625 -28 24 C-27.34 23.67 -26.68 23.34 -26 23 C-25.6278958 21.67696283 -25.29369827 20.34262065 -25 19 C-24.67 18.67 -24.34 18.34 -24 18 C-27.65143418 16.32398594 -30.40799364 15.77377629 -34.4140625 15.875 C-35.92613281 15.89820313 -35.92613281 15.89820313 -37.46875 15.921875 C-39.03109375 15.96054688 -39.03109375 15.96054688 -40.625 16 C-42.7003127 16.05099048 -44.7758691 16.09306626 -46.8515625 16.125 C-48.22562256 16.15980469 -48.22562256 16.15980469 -49.62744141 16.1953125 C-52 16 -52 16 -55 14 C-55 13.01 -55 12.02 -55 11 C-52.36 11 -49.72 11 -47 11 C-47 9.68 -47 8.36 -47 7 C-42.96825194 7.27489191 -41.43105369 7.53491576 -38.625 10.5625 C-38.08875 11.366875 -37.5525 12.17125 -37 13 C-35.700625 11.515 -35.700625 11.515 -34.375 10 C-32.01257849 7.63757849 -31.35848103 7.05121158 -27.9375 6.5625 C-25.26458603 6.96059357 -22.63084932 7.38097663 -20 8 C-19.896875 7.38125 -19.79375 6.7625 -19.6875 6.125 C-19 4 -19 4 -16 2 C-13.84752518 1.55064314 -11.67707251 1.18390894 -9.5 0.875 C-8.3553125 0.70742187 -7.210625 0.53984375 -6.03125 0.3671875 C-3 0 -3 0 0 0 Z " fill="#A92A0B" transform="translate(265,144)"/>
<path d="M0 0 C4.72181437 0.91499274 8.70070953 3.32632836 12.9296875 5.52734375 C22.10383929 9.92766846 31.12358804 9.79571127 41 8 C42.125 10.25 42.125 10.25 43 13 C42.125 15.3125 42.125 15.3125 41 17 C41.66 17 42.32 17 43 17 C43 16.34 43 15.68 43 15 C43.66 15 44.32 15 45 15 C45 16.32 45 17.64 45 19 C46.32 19.33 47.64 19.66 49 20 C48.01 20.66 47.02 21.32 46 22 C47.32 22.66 48.64 23.32 50 24 C21.42804833 24.71402417 21.42804833 24.71402417 12 20 C12 19.34 12 18.68 12 18 C11.01 18 10.02 18 9 18 C10 15 10 15 12 13 C11.67 12.401875 11.34 11.80375 11 11.1875 C10 9 10 9 10 6 C8.68 6 7.36 6 6 6 C6 5.34 6 4.68 6 4 C3.03 3.505 3.03 3.505 0 3 C0 2.01 0 1.02 0 0 Z " fill="#1E1E3F" transform="translate(76,190)"/>
<path d="M0 0 C4.25846591 0.10646165 6.40145804 1.13879185 9.375 4 C26.09746195 19.5074456 48.97714773 23.77594259 71.0390625 23.38671875 C82.94737175 22.85348214 94.34693512 19.22968639 105 14 C105.66 14 106.32 14 107 14 C107 14.66 107 15.32 107 16 C106.34 16 105.68 16 105 16 C105 16.66 105 17.32 105 18 C86.84292306 25.23205607 70.43033365 26.75264281 51 27 C51 26.34 51 25.68 51 25 C49.68 25 48.36 25 47 25 C47 24.34 47 23.68 47 23 C46.39671875 23.01160156 45.7934375 23.02320313 45.171875 23.03515625 C43.97304687 23.04869141 43.97304687 23.04869141 42.75 23.0625 C41.56664063 23.07990234 41.56664063 23.07990234 40.359375 23.09765625 C38.09308998 23.00385306 36.1711105 22.63241063 34 22 C34 21.34 34 20.68 34 20 C33.278125 19.855625 32.55625 19.71125 31.8125 19.5625 C29.20833333 19.04166667 26.60416667 18.52083333 24 18 C22.89155081 21.32534757 23.15545644 23.62182575 24 27 C22.68 27.99 21.36 28.98 20 30 C20 29.34 20 28.68 20 28 C18.02 28.99 18.02 28.99 16 30 C16 28.68 16 27.36 16 26 C15.01 25.67 14.02 25.34 13 25 C13 22.36 13 19.72 13 17 C10.03 17.33 7.06 17.66 4 18 C3.67 13.05 3.34 8.1 3 3 C2.01 2.67 1.02 2.34 0 2 C0 1.34 0 0.68 0 0 Z " fill="#2D0F20" transform="translate(49,206)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-0.99 2.33 -1.98 2.66 -3 3 C-3.45375 3.78375 -3.9075 4.5675 -4.375 5.375 C-6.23677166 8.3824773 -7.85110315 9.46592205 -11 11 C-11.66 11 -12.32 11 -13 11 C-13 12.65 -13 14.3 -13 16 C-12.34 16 -11.68 16 -11 16 C-11 16.66 -11 17.32 -11 18 C-11.66 18 -12.32 18 -13 18 C-13 19.32 -13 20.64 -13 22 C-12.01 22 -11.02 22 -10 22 C-11.43480559 24.99942692 -13.09185308 27.75843218 -14.875 30.5625 C-19.27825017 37.86177535 -22.24287596 45.48235459 -23 54 C-25 52 -25 52 -25.1875 48.4375 C-25 45 -25 45 -24 44 C-23.84327223 40.47362528 -23.95971031 37.38094149 -25 34 C-25.66 34 -26.32 34 -27 34 C-27 33.34 -27 32.68 -27 32 C-27.99 32 -28.98 32 -30 32 C-30 32.99 -30 33.98 -30 35 C-31.485 35.495 -31.485 35.495 -33 36 C-34.28613612 32.14159163 -33.50611818 31.22407737 -31.75 27.625 C-26.87495097 18.3252529 -12.3107702 -3.69323106 0 0 Z " fill="#861810" transform="translate(83,93)"/>
<path d="M0 0 C0.66 1.32 1.32 2.64 2 4 C3.98 4 5.96 4 8 4 C9.06652192 6.30368736 10.06421005 8.64018187 11 11 C10 13 10 13 9 14 C9.185625 14.556875 9.37125 15.11375 9.5625 15.6875 C10.16569176 18.87579931 9.15025625 21.02286618 8 24 C7.67 22.68 7.34 21.36 7 20 C4.69 20 2.38 20 0 20 C0 20.66 0 21.32 0 22 C-0.66 22 -1.32 22 -2 22 C-2 23.32 -2 24.64 -2 26 C-1.34 26.33 -0.68 26.66 0 27 C-0.99 28.65 -1.98 30.3 -3 32 C-3.53625 31.38125 -4.0725 30.7625 -4.625 30.125 C-7.34394855 27.69225656 -9.52652142 27.01309792 -13 26 C-14.34090759 25.34870203 -15.67592331 24.68486725 -17 24 C-17.99 23.67 -18.98 23.34 -20 23 C-21.38576923 21.37667033 -22.72641268 19.71275535 -24 18 C-23.34 16.68 -22.68 15.36 -22 14 C-22 14.99 -22 15.98 -22 17 C-20.35 17.33 -18.7 17.66 -17 18 C-16.67 17.01 -16.34 16.02 -16 15 C-15.67 16.32 -15.34 17.64 -15 19 C-14.34 19 -13.68 19 -13 19 C-12.67 18.01 -12.34 17.02 -12 16 C-12.33 15.67 -12.66 15.34 -13 15 C-12.5625 12.9375 -12.5625 12.9375 -12 11 C-11.01 11 -10.02 11 -9 11 C-8.67 10.01 -8.34 9.02 -8 8 C-7.34 8.33 -6.68 8.66 -6 9 C-5.67 7.68 -5.34 6.36 -5 5 C-4.34 5 -3.68 5 -3 5 C-2.87625 4.360625 -2.7525 3.72125 -2.625 3.0625 C-2.315625 2.0415625 -2.315625 2.0415625 -2 1 C-1.34 0.67 -0.68 0.34 0 0 Z " fill="#10317B" transform="translate(237,41)"/>
<path d="M0 0 C0.51304687 0.32613281 1.02609375 0.65226563 1.5546875 0.98828125 C19.1113736 11.00800614 42.42814295 8.69497967 62 9 C60 11 60 11 56.74365234 11.22705078 C55.35770705 11.22673382 53.97173699 11.21541759 52.5859375 11.1953125 C51.85629791 11.1924826 51.12665833 11.18965271 50.37490845 11.18673706 C48.04143972 11.17553002 45.70835297 11.1504251 43.375 11.125 C41.79427637 11.11497085 40.21354673 11.10584489 38.6328125 11.09765625 C34.75506086 11.07558905 30.87759522 11.04105615 27 11 C26.67 11.99 26.34 12.98 26 14 C24.66666667 14.33333333 23.33333333 14.66666667 22 15 C21.67 15.99 21.34 16.98 21 18 C18.9375 18.6875 18.9375 18.6875 17 19 C17 19.66 17 20.32 17 21 C18.98 21 20.96 21 23 21 C22.67 20.01 22.34 19.02 22 18 C23.65 18.33 25.3 18.66 27 19 C27.33 20.32 27.66 21.64 28 23 C26.39620659 23.05416188 24.79188594 23.09286638 23.1875 23.125 C22.29417969 23.14820313 21.40085938 23.17140625 20.48046875 23.1953125 C18 23 18 23 15 21 C14.70703125 17.9609375 14.70703125 17.9609375 14.8125 14.375 C14.83957031 13.18648437 14.86664063 11.99796875 14.89453125 10.7734375 C14.92933594 9.85820312 14.96414062 8.94296875 15 8 C12.36 7.67 9.72 7.34 7 7 C7.11389875 8.79240663 7.24147687 10.58394835 7.375 12.375 C7.44460937 13.37273437 7.51421875 14.37046875 7.5859375 15.3984375 C7.76363964 18.15508879 7.76363964 18.15508879 10 20 C8.35 19.67 6.7 19.34 5 19 C5.11069824 19.80928955 5.22139648 20.6185791 5.33544922 21.45239258 C9.10016192 49.06877359 9.10016192 49.06877359 10.34667969 61.75634766 C10.81127102 66.42643657 11.42087394 71.04711367 12.125 75.6875 C12.8529148 80.53836975 13.19594115 85.10147125 13 90 C12.34 89.67 11.68 89.34 11 89 C10.50815841 86.38552441 10.14575021 83.84597172 9.8515625 81.20703125 C9.7542131 80.40145279 9.65686371 79.59587433 9.55656433 78.7658844 C9.23786914 76.11566146 8.93164299 73.46414193 8.625 70.8125 C8.29704493 68.06688528 7.96575022 65.32168562 7.63441467 62.57647705 C7.4112821 60.72532882 7.18923279 58.87404971 6.96824646 57.02264404 C5.9852098 48.79717016 4.9177825 40.58483413 3.8125 32.375 C3.65797363 31.21846924 3.50344727 30.06193848 3.34423828 28.87036133 C2.7330562 24.32166688 2.11477188 19.77554008 1.44287109 15.23535156 C1.25934082 13.99495117 1.07581055 12.75455078 0.88671875 11.4765625 C0.71744873 10.35588379 0.54817871 9.23520508 0.3737793 8.08056641 C0.0418038 5.34453319 -0.07277282 2.7512616 0 0 Z " fill="#F7CB88" transform="translate(182,137)"/>
<path d="M0 0 C2.4375 0.75 2.4375 0.75 5 2 C5.8125 4.125 5.8125 4.125 6 6 C8.31 6.33 10.62 6.66 13 7 C12.93039063 8.7015625 12.93039063 8.7015625 12.859375 10.4375 C12.44839019 21.79795752 12.44839019 21.79795752 17 32 C17.33 32.66 17.66 33.32 18 34 C17.195625 34.144375 16.39125 34.28875 15.5625 34.4375 C13.07896294 34.74135249 13.07896294 34.74135249 12 36 C11.38125 36.12375 10.7625 36.2475 10.125 36.375 C7.65208345 37.1023284 6.73343341 38.14770258 5 40 C4.01836578 38.06374902 3.03977546 36.12595461 2.0625 34.1875 C1.51722656 33.10855469 0.97195312 32.02960938 0.41015625 30.91796875 C-2.14450703 25.63172645 -2.183162 21.43535465 -2.1875 15.6875 C-2.19974609 14.84509766 -2.21199219 14.00269531 -2.22460938 13.13476562 C-2.23583755 8.3478189 -1.856112 4.49721999 0 0 Z " fill="#202745" transform="translate(74,135)"/>
<path d="M0 0 C0 1.65 0 3.3 0 5 C0.639375 4.319375 1.27875 3.63875 1.9375 2.9375 C6.20086758 0.24026745 9.22173767 0.99989858 14 2 C14.73089844 2.14050781 15.46179688 2.28101563 16.21484375 2.42578125 C16.80394531 2.61527344 17.39304688 2.80476562 18 3 C18.33 3.66 18.66 4.32 19 5 C19.61875 4.34 20.2375 3.68 20.875 3 C23 1 23 1 25 1 C23.4169423 5.2742558 20.49431596 7.26531794 17 10 C16.62875 9.21625 16.2575 8.4325 15.875 7.625 C13.56693694 4.39371171 11.78383679 3.92493788 8 3 C8 4.32 8 5.64 8 7 C5.36 7 2.72 7 0 7 C0.33 7.99 0.66 8.98 1 10 C3.60951236 11.30475618 5.52701285 11.11301572 8.4453125 11.09765625 C9.52167969 11.09443359 10.59804687 11.09121094 11.70703125 11.08789062 C13.39892578 11.07532227 13.39892578 11.07532227 15.125 11.0625 C16.26066406 11.05798828 17.39632812 11.05347656 18.56640625 11.04882812 C21.37765638 11.03701615 24.1888023 11.02054507 27 11 C27.495 11.99 27.495 11.99 28 13 C19.09 13 10.18 13 1 13 C1 13.99 1 14.98 1 16 C2.65 16.33 4.3 16.66 6 17 C6 17.99 6 18.98 6 20 C5.01 20 4.02 20 3 20 C3.33 20.7425 3.66 21.485 4 22.25 C5 25 5 25 5 29 C4.01 29 3.02 29 2 29 C2 29.66 2 30.32 2 31 C1.0925 31.0825 0.185 31.165 -0.75 31.25 C-4.40077839 32.09248732 -5.63384583 33.17881618 -8 36 C-9.73107999 32.95674905 -10.33594612 30.49320255 -10.6328125 27.015625 C-10.71660156 26.08105469 -10.80039063 25.14648438 -10.88671875 24.18359375 C-10.96535156 23.21550781 -11.04398438 22.24742187 -11.125 21.25 C-11.21136719 20.26644531 -11.29773438 19.28289062 -11.38671875 18.26953125 C-11.59839825 15.84697694 -11.8001626 13.42355991 -12 11 C-8.7 11 -5.4 11 -2 11 C-1.67 10.01 -1.34 9.02 -1 8 C-2.32 8 -3.64 8 -5 8 C-5 8.66 -5 9.32 -5 10 C-6.98 10 -8.96 10 -11 10 C-11 9.34 -11 8.68 -11 8 C-10.401875 7.731875 -9.80375 7.46375 -9.1875 7.1875 C-6.98809359 5.99353652 -5.68250513 4.82880993 -4 3 C-1.11111111 0 -1.11111111 0 0 0 Z " fill="#F39F4E" transform="translate(210,148)"/>
<path d="M0 0 C2.66814228 2.55213609 3.9308312 3.9169391 4.17358398 7.71801758 C4.19751221 8.84876709 4.22144043 9.9795166 4.24609375 11.14453125 C4.27896484 12.37880859 4.31183594 13.61308594 4.34570312 14.88476562 C4.40662523 17.49145414 4.46395003 20.09822935 4.51757812 22.70507812 C4.56881836 24.56229492 4.56881836 24.56229492 4.62109375 26.45703125 C4.6461499 27.59116455 4.67120605 28.72529785 4.69702148 29.89379883 C4.99679367 32.96712797 5.7004019 35.2165397 7 38 C0.375 39.125 0.375 39.125 -3 38 C-5.14255793 38.38932856 -5.14255793 38.38932856 -7 39 C-8.84847025 35.05043063 -9.26084149 31.87155136 -9.30859375 27.52734375 C-9.33373047 26.29822266 -9.35886719 25.06910156 -9.38476562 23.80273438 C-9.41997447 21.22205618 -9.45121273 18.64132082 -9.47851562 16.06054688 C-9.50494141 14.83271484 -9.53136719 13.60488281 -9.55859375 12.33984375 C-9.57204834 11.21956787 -9.58550293 10.09929199 -9.59936523 8.94506836 C-10.03576781 5.73707065 -10.83757449 4.35532634 -13 2 C-12.2575 2.309375 -11.515 2.61875 -10.75 2.9375 C-6.2874552 4.90295788 -6.2874552 4.90295788 -1.75 4.0625 C-1.1725 3.711875 -0.595 3.36125 0 3 C0 2.01 0 1.02 0 0 Z " fill="#4A1628" transform="translate(143,124)"/>
<path d="M0 0 C-0.33 1.32 -0.66 2.64 -1 4 C-2.19625 3.814375 -3.3925 3.62875 -4.625 3.4375 C-6.84404753 3.29954741 -6.84404753 3.29954741 -9 4 C-11.53166875 6.71704199 -13.28204023 9.72025861 -15 13 C-13.02 13 -11.04 13 -9 13 C-9 13.33 -9 13.66 -9 14 C-17.24003056 14.29428681 -23.73073463 13.07788057 -31 9 C-31.33 8.67 -31.66 8.34 -32 8 C-30.71399368 20.48779824 -29.1098087 32.9265446 -27.40917969 45.36376953 C-26.47570989 52.23349574 -25.62001327 59.0944389 -25 66 C-27.4070268 62.9624947 -28.40101085 61.14625246 -28.6875 57.25 C-28.78611328 56.05117187 -28.78611328 56.05117187 -28.88671875 54.828125 C-28.92410156 54.22484375 -28.96148437 53.6215625 -29 53 C-29.36351562 53.47050781 -29.72703125 53.94101563 -30.1015625 54.42578125 C-33.36863868 58.47192944 -36.06582581 61.00283426 -41 63 C-41.495 61.515 -41.495 61.515 -42 60 C-41.04287109 59.16855469 -41.04287109 59.16855469 -40.06640625 58.3203125 C-39.24011719 57.59585938 -38.41382813 56.87140625 -37.5625 56.125 C-36.73878906 55.40570313 -35.91507813 54.68640625 -35.06640625 53.9453125 C-32.8011511 51.81280387 -32.06294366 50.91043505 -31.84960938 47.82470703 C-31.83416792 40.73064591 -32.50759563 33.89335523 -33.5 26.875 C-35.44678526 13.00196271 -35.44678526 13.00196271 -35 6 C-32.5 3.4375 -32.5 3.4375 -30 2 C-29.34 2.66 -28.68 3.32 -28 4 C-26.19142493 4 -24.50345756 3.15447677 -22.8125 2.5625 C-15.1183702 0.00582991 -8.06166837 -0.11740294 0 0 Z " fill="#701B10" transform="translate(215,130)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-0.99 2 -1.98 2 -3 2 C-2.505 3.98 -2.505 3.98 -2 6 C-2.66 6 -3.32 6 -4 6 C-4.33 7.32 -4.66 8.64 -5 10 C-5.66 10 -6.32 10 -7 10 C-6.67 11.65 -6.34 13.3 -6 15 C-5.34 15 -4.68 15 -4 15 C-3.67 16.32 -3.34 17.64 -3 19 C-3.99 18.67 -4.98 18.34 -6 18 C-8.6569191 18.87914688 -8.6569191 18.87914688 -11 20 C-11 20.66 -11 21.32 -11 22 C-10.34 21.34 -9.68 20.68 -9 20 C-9 20.66 -9 21.32 -9 22 C-8.34 22 -7.68 22 -7 22 C-7 22.66 -7 23.32 -7 24 C-8.98 24.99 -8.98 24.99 -11 26 C-10.34 27.32 -9.68 28.64 -9 30 C-9.99 29.566875 -9.99 29.566875 -11 29.125 C-14.0677644 27.89393398 -14.0677644 27.89393398 -17.6875 27.1875 C-24.15728336 25.60080408 -30.44442663 23.42486438 -34.125 17.6875 C-34.41375 16.800625 -34.7025 15.91375 -35 15 C-31.61416198 11.86892164 -29.28890538 11.66449222 -24.75 11.8125 C-23.13351563 11.85310547 -23.13351563 11.85310547 -21.484375 11.89453125 C-20.66453125 11.92933594 -19.8446875 11.96414062 -19 12 C-19 11.34 -19 10.68 -19 10 C-18.34 10 -17.68 10 -17 10 C-17 9.34 -17 8.68 -17 8 C-15.02 8 -13.04 8 -11 8 C-11 6.35 -11 4.7 -11 3 C-4.5 0 -4.5 0 0 0 Z " fill="#110C29" transform="translate(100,241)"/>
<path d="M0 0 C-2.06756277 2.7972908 -3.14440371 3.02692273 -6.6875 3.6875 C-7.780625 3.790625 -8.87375 3.89375 -10 4 C-10.0928125 4.90298828 -10.0928125 4.90298828 -10.1875 5.82421875 C-11.35137298 8.9409363 -13.04435049 9.38804114 -16 10.8125 C-21.55170363 13.66045186 -26.20539187 17.03766347 -31 21 C-31.79792969 21.59554687 -32.59585938 22.19109375 -33.41796875 22.8046875 C-36.51441852 25.43737248 -38.94102735 28.30672514 -41.4375 31.5 C-41.91614502 32.10859863 -42.39479004 32.71719727 -42.88793945 33.34423828 C-47.11537357 38.86949969 -50.22584844 44.60891665 -53 51 C-53.99 50.34 -54.98 49.68 -56 49 C-59.07903609 57.99795982 -60.92503128 66.56573505 -62 76 C-62.33 76 -62.66 76 -63 76 C-64.13120841 54.71652323 -54.16860183 35.85008705 -40.53515625 20.1640625 C-36.65788178 16.07389276 -34.55640624 14.05317504 -29 13 C-28.195625 12.030625 -27.39125 11.06125 -26.5625 10.0625 C-23.61261984 6.53703347 -22.33784616 6.20495727 -18 5 C-15.14021658 3.75269131 -12.31604822 2.43915387 -9.48828125 1.12109375 C-5.79930357 -0.54097312 -3.86302345 -1.19886935 0 0 Z " fill="#F1881C" transform="translate(88,69)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.51171177 3.76933784 2.00715127 7.54065321 2.5 11.3125 C2.64308594 12.36501953 2.78617188 13.41753906 2.93359375 14.50195312 C5.26969043 32.57889168 5.26969043 32.57889168 2.57421875 37.71875 C1.95160156 38.3065625 1.32898438 38.894375 0.6875 39.5 C0.07261719 40.1084375 -0.54226562 40.716875 -1.17578125 41.34375 C-1.77777344 41.8903125 -2.37976563 42.436875 -3 43 C-5.32068385 45.13046386 -5.96556802 45.89670407 -7 49 C-14.00878222 53.31309675 -22.02831113 55.30972786 -30 57 C-31.15786011 57.2623645 -31.15786011 57.2623645 -32.33911133 57.5300293 C-35.05610908 58.00991008 -37.54413658 58.11377698 -40.30078125 58.09765625 C-41.27724609 58.09443359 -42.25371094 58.09121094 -43.25976562 58.08789062 C-44.26716797 58.07951172 -45.27457031 58.07113281 -46.3125 58.0625 C-47.33923828 58.05798828 -48.36597656 58.05347656 -49.42382812 58.04882812 C-51.94927882 58.03708184 -54.47460905 58.02065565 -57 58 C-57 57.34 -57 56.68 -57 56 C-51.72 56 -46.44 56 -41 56 C-41 55.34 -41 54.68 -41 54 C-40.37351563 53.87882812 -39.74703125 53.75765625 -39.1015625 53.6328125 C-38.28429687 53.46523437 -37.46703125 53.29765625 -36.625 53.125 C-35.40683594 52.88136719 -35.40683594 52.88136719 -34.1640625 52.6328125 C-31.81326077 52.13341068 -31.81326077 52.13341068 -30 50 C-28.88625 49.855625 -27.7725 49.71125 -26.625 49.5625 C-22.92013013 48.9876064 -21.78447048 48.30438937 -19 46 C-17.948125 45.7525 -17.948125 45.7525 -16.875 45.5 C-14.59876637 45.11426598 -14.59876637 45.11426598 -13 42 C-12.34 42 -11.68 42 -11 42 C-11 41.34 -11 40.68 -11 40 C-10.34 40 -9.68 40 -9 40 C-8.7525 39.443125 -8.505 38.88625 -8.25 38.3125 C-7 36 -7 36 -5 33.5625 C-1.55908211 29.15382396 -0.74950819 25.35836047 -0.5859375 19.82421875 C-0.54726562 18.66728516 -0.50859375 17.51035156 -0.46875 16.31835938 C-0.4378125 15.12017578 -0.406875 13.92199219 -0.375 12.6875 C-0.33632812 11.46998047 -0.29765625 10.25246094 -0.2578125 8.99804688 C-0.16371998 5.99884772 -0.07807791 2.99965177 0 0 Z " fill="#FA9E28" transform="translate(180,145)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.02691685 2.45840605 1.04679802 4.91651882 1.0625 7.375 C1.07087891 8.07367188 1.07925781 8.77234375 1.08789062 9.4921875 C1.11328125 14.7734375 1.11328125 14.7734375 0 17 C0.99 17.33 1.98 17.66 3 18 C2.67 19.65 2.34 21.3 2 23 C2.99 23.33 3.98 23.66 5 24 C5 23.34 5 22.68 5 22 C6.55966218 21.491217 8.12289241 20.99336531 9.6875 20.5 C10.55761719 20.2215625 11.42773438 19.943125 12.32421875 19.65625 C14.99391677 19.00149195 17.26396684 18.88168505 20 19 C18.96780191 23.64489142 17.11857423 27.76285154 15 32 C14.67 32.99 14.34 33.98 14 35 C14.66 35.33 15.32 35.66 16 36 C16.66 36.33 17.32 36.66 18 37 C19.66619446 37.0396713 21.33391013 37.04384447 23 37 C16.3264 46.44853333 16.3264 46.44853333 12 49 C8.57666749 48.84077523 7.4368763 48.4368763 5 46 C3.80172156 38.96011414 7.13446141 33.7270344 11 28 C13.18440734 25.47550529 15.47848319 23.18581191 18 21 C11.06162109 22.81990266 6.31952592 25.6478375 0.67578125 30.0625 C-2.13105593 32.09489597 -4.79931032 33.66893343 -8 35 C-8.99 34.67 -9.98 34.34 -11 34 C-9.15234666 29.15879294 -6.81162784 24.63502895 -4.4375 20.03515625 C-2.08724548 15.0727982 -0.77571625 10.60145545 -0.375 5.125 C-0.30023438 4.15820312 -0.22546875 3.19140625 -0.1484375 2.1953125 C-0.09945312 1.47085938 -0.05046875 0.74640625 0 0 Z " fill="#1D1630" transform="translate(207,54)"/>
<path d="M0 0 C-1 3 -1 3 -4 5 C-5.93922785 5.49302403 -7.8791329 5.98374414 -9.82421875 6.453125 C-15.4360264 7.86363321 -19.60736855 9.42214733 -23.9375 13.375 C-33.14783309 21.7721367 -43.05943593 23.69432474 -55 26 C-54.01 27.32 -53.02 28.64 -52 30 C-52.70125 30.18175781 -53.4025 30.36351563 -54.125 30.55078125 C-59.89678529 32.07999067 -65.44899107 33.80054363 -71 36 C-71 35.01 -71 34.02 -71 33 C-68.03 32.01 -65.06 31.02 -62 30 C-65.9327763 28.68907457 -67.25253203 29.68216774 -71 31.3125 C-72.051875 31.76238281 -73.10375 32.21226563 -74.1875 32.67578125 C-77.11258468 33.96858637 -77.11258468 33.96858637 -80 36 C-80.969375 36.268125 -81.93875 36.53625 -82.9375 36.8125 C-86.54534516 38.21146037 -87.84497457 39.85034745 -90 43 C-91.32 42.67 -92.64 42.34 -94 42 C-89.62101213 37.85393701 -85.48869832 34.39074535 -79.95703125 31.921875 C-77.90388813 31.00216173 -77.90388813 31.00216173 -75.7421875 29.5859375 C-72.38206739 27.64262017 -68.92681058 26.27024308 -65.3125 24.875 C-60.59508828 23.07807148 -60.59508828 23.07807148 -56 21 C-54.48108919 20.87079209 -52.95961498 20.77087093 -51.4375 20.6875 C-46.739406 20.27216125 -43.11899461 19.01518427 -38.91015625 16.9375 C-37 16 -37 16 -34 15 C-34 14.34 -34 13.68 -34 13 C-26.50356595 3.61910325 -11.6330872 0 0 0 Z " fill="#EC9427" transform="translate(149,40)"/>
<path d="M0 0 C0.96550781 0.00902344 1.93101563 0.01804687 2.92578125 0.02734375 C5.28412099 0.05069365 7.64192286 0.08343953 10 0.125 C10 0.455 10 0.785 10 1.125 C6.37 1.125 2.74 1.125 -1 1.125 C-1.33 2.115 -1.66 3.105 -2 4.125 C-5.3 3.795 -8.6 3.465 -12 3.125 C-12.433125 4.2078125 -12.433125 4.2078125 -12.875 5.3125 C-13.61065463 7.15163658 -14.36013354 8.985319 -15.125 10.8125 C-16.11796403 13.02467791 -16.11796403 13.02467791 -16 15.125 C-12.7 14.795 -9.4 14.465 -6 14.125 C-9.35424655 15.80212327 -12.47024855 16.98063645 -16 18.1875 C-22.50627438 20.62276843 -27.16541219 23.9437214 -32.44140625 28.33203125 C-35 30.125 -35 30.125 -39 30.125 C-39 28.805 -39 27.485 -39 26.125 C-38.34 26.125 -37.68 26.125 -37 26.125 C-37 25.465 -37 24.805 -37 24.125 C-37.66 24.125 -38.32 24.125 -39 24.125 C-39.33 23.135 -39.66 22.145 -40 21.125 C-38.10955296 19.02450329 -36.35917537 17.71958034 -33.9375 16.1875 C-31.14062571 14.2237372 -30.12098353 13.26375387 -29 10.125 C-28.01 10.125 -27.02 10.125 -26 10.125 C-26.99 8.805 -27.98 7.485 -29 6.125 C-27.50292061 5.49303616 -26.00213297 4.86985607 -24.5 4.25 C-23.6646875 3.90195313 -22.829375 3.55390625 -21.96875 3.1953125 C-14.42114763 0.47420322 -7.96932247 -0.1428982 0 0 Z " fill="#901110" transform="translate(109,84.875)"/>
<path d="M0 0 C1.15564453 -0.020625 2.31128906 -0.04125 3.50195312 -0.0625 C10.49698757 -0.09427756 15.94457709 0.61679754 22.4375 3.25 C21.4784375 3.6521875 21.4784375 3.6521875 20.5 4.0625 C18.10618314 5.13667752 18.10618314 5.13667752 17.4375 8.25 C17.4375 8.91 17.4375 9.57 17.4375 10.25 C18.4275 10.25 19.4175 10.25 20.4375 10.25 C20.4375 11.57 20.4375 12.89 20.4375 14.25 C22.0875 14.25 23.7375 14.25 25.4375 14.25 C23.09103303 15.75303644 21.9769344 16.36089418 19.1953125 15.7890625 C18.32648438 15.48742187 17.45765625 15.18578125 16.5625 14.875 C10.36484055 13.14916661 4.48149498 12.93644268 -1.9375 12.9375 C-2.88866699 12.93250488 -3.83983398 12.92750977 -4.81982422 12.92236328 C-9.78766346 12.97059473 -13.909457 13.2969669 -18.5625 15.25 C-18.5625 14.26 -18.5625 13.27 -18.5625 12.25 C-17.325 11.92 -16.0875 11.59 -14.8125 11.25 C-13.76835938 10.9715625 -13.76835938 10.9715625 -12.703125 10.6875 C-10.5625 10.25 -10.5625 10.25 -6.5625 10.25 C-6.5625 9.59 -6.5625 8.93 -6.5625 8.25 C-8.2125 7.92 -9.8625 7.59 -11.5625 7.25 C-11.5625 5.6 -11.5625 3.95 -11.5625 2.25 C-12.5525 1.92 -13.5425 1.59 -14.5625 1.25 C-10.30485335 -0.87882332 -4.67635832 0.02038739 0 0 Z " fill="#FCF3B0" transform="translate(111.5625,99.75)"/>
<path d="M0 0 C0 4.7464505 -2.87580265 7.59366148 -6 11 C-13.5932582 16.94631864 -22.69683963 17.828872 -32 17 C-34.89775659 16.26126271 -37.25287838 15.25307302 -40 14 C-41.485 13.4121875 -41.485 13.4121875 -43 12.8125 C-43.66 12.544375 -44.32 12.27625 -45 12 C-44.625 9.5625 -44.625 9.5625 -44 7 C-43.34 6.67 -42.68 6.34 -42 6 C-41.67 5.01 -41.34 4.02 -41 3 C-37.59098948 3.40908126 -34.47304025 3.82579254 -31.2421875 5.015625 C-27.532341 6.14198803 -24.09269829 6.38327969 -20.25 6.375 C-19.54987793 6.37483887 -18.84975586 6.37467773 -18.12841797 6.37451172 C-11.41469297 6.22765382 -4.88979872 4.88979872 0 0 Z " fill="#F3D8BE" transform="translate(130,183)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C1.66 1.71125 2.32 1.4225 3 1.125 C6.60103285 0.97495696 6.93302952 1.54533652 9.5625 3.8125 C14.51152562 7.90660757 19.75787481 8.39659456 26 9 C25.50341822 11.0199937 24.99561394 13.01403538 24.375 15 C23.94088602 17.31527453 24.37367681 18.75645425 25 21 C16.80743483 22.77505579 11.24658866 21.12887028 4 17 C0.25386644 14.36221862 -3.35569328 11.77138827 -6 8 C-5.76171875 4.71484375 -5.76171875 4.71484375 -5 2 C-4.360625 1.855625 -3.72125 1.71125 -3.0625 1.5625 C-1.02454854 1.18992819 -1.02454854 1.18992819 0 0 Z " fill="#141E3F" transform="translate(86,168)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.19747219 1.39445749 1.38248587 2.79068152 1.5625 4.1875 C1.66691406 4.96480469 1.77132813 5.74210938 1.87890625 6.54296875 C2.01142874 9.23189276 1.55107297 11.36709581 1 14 C0.78118981 16.6068127 0.58987147 19.20220189 0.4375 21.8125 C0.39431641 22.50537109 0.35113281 23.19824219 0.30664062 23.91210938 C0.20138547 25.60788686 0.10027137 27.30392052 0 29 C0.66 29 1.32 29 2 29 C2 27.02 2 25.04 2 23 C2.66 23 3.32 23 4 23 C6.61776382 42.22420304 1.47277828 55.4583147 -8 72 C-8.33 72 -8.66 72 -9 72 C-9.23867527 65.15248885 -8.30651101 58.7462968 -7.1875 52 C-5.60168582 42.10238072 -4.21856923 32.20236926 -3.01123047 22.25195312 C-2.10897286 14.81805315 -1.10835185 7.40639826 0 0 Z " fill="#2C1335" transform="translate(271,139)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2.74016701 5.70985978 3.10469338 11.24186425 3 17 C4.32 17.66 5.64 18.32 7 19 C7 18.34 7 17.68 7 17 C7.66 17 8.32 17 9 17 C9 16.01 9 15.02 9 14 C9.99 13.67 10.98 13.34 12 13 C12 11.68 12 10.36 12 9 C12.99 8.67 13.98 8.34 15 8 C15.66 7.01 16.32 6.02 17 5 C18.32 5.33 19.64 5.66 21 6 C20.67 6.99 20.34 7.98 20 9 C19.67 8.67 19.34 8.34 19 8 C18.97421875 8.58007812 18.9484375 9.16015625 18.921875 9.7578125 C18.37537975 17.28454249 15.82649502 21.42680677 10.375 26.625 C5.48042696 30.7665618 -0.48147123 34 -7 34 C-6.59280711 29.52087818 -5.60086438 25.73193175 -4.0625 21.5 C-1.59415655 14.42707404 -0.77069632 7.42302245 0 0 Z " fill="#271839" transform="translate(184,37)"/>
<path d="M0 0 C1.0415625 0.13277344 2.083125 0.26554688 3.15625 0.40234375 C13.09558205 1.63760903 22.9979906 2.48845712 33 3 C29.33202576 5.44531616 27.48488996 5.23819639 23.125 5.1875 C21.30355469 5.17783203 21.30355469 5.17783203 19.4453125 5.16796875 C16.50225573 5.02448639 13.85863082 4.67933242 11 4 C11 6.31 11 8.62 11 11 C20.57 10.67 30.14 10.34 40 10 C39.67 10.99 39.34 11.98 39 13 C39.99 13 40.98 13 42 13 C42 13.66 42 14.32 42 15 C35.26533251 16.26088611 28.6462607 16.26101511 21.8125 16.3125 C20.54857422 16.34150391 19.28464844 16.37050781 17.98242188 16.40039062 C7.59762618 16.47023147 -0.18977196 14.47784676 -9 9 C-8.67 8.34 -8.34 7.68 -8 7 C-4.535 8.98 -4.535 8.98 -1 11 C-1 10.01 -1 9.02 -1 8 C-0.34 8 0.32 8 1 8 C0.67 5.36 0.34 2.72 0 0 Z " fill="#F9C15B" transform="translate(204,220)"/>
<path d="M0 0 C3.16115776 1.36983503 3.9927092 1.9890638 6 5 C6.99 5.33 7.98 5.66 9 6 C8.96519531 7.13888672 8.96519531 7.13888672 8.9296875 8.30078125 C8.91164063 9.29464844 8.89359375 10.28851563 8.875 11.3125 C8.84019531 12.79169922 8.84019531 12.79169922 8.8046875 14.30078125 C8.79317361 17.22406527 8.79317361 17.22406527 11 20 C13.05925139 20.72382467 13.05925139 20.72382467 15 21 C15.66 19.68 16.32 18.36 17 17 C17.66 17.99 18.32 18.98 19 20 C17.68181965 23.80807656 15.9503495 27.14618842 13.9375 30.625 C11.969599 33.82033669 11.969599 33.82033669 11 36.8125 C10 39 10 39 7.875 40.3125 C6.946875 40.6528125 6.946875 40.6528125 6 41 C5.34 40.01 4.68 39.02 4 38 C4.33 37.01 4.66 36.02 5 35 C5.33 35.99 5.66 36.98 6 38 C6.66 38 7.32 38 8 38 C7.50628906 37.30132812 7.01257813 36.60265625 6.50390625 35.8828125 C5.86324219 34.97273438 5.22257812 34.06265625 4.5625 33.125 C3.92441406 32.22007812 3.28632813 31.31515625 2.62890625 30.3828125 C-0.46443277 25.8577842 -0.24377574 22.36306636 0 17 C0.32550502 15.33178677 0.65846063 13.66500443 1 12 C1.21406182 7.91635909 1.30731742 3.92195225 0 0 Z " fill="#F07D1F" transform="translate(19,178)"/>
<path d="M0 0 C2.64 0.33 5.28 0.66 8 1 C8.06058594 1.96421875 8.12117187 2.9284375 8.18359375 3.921875 C8.26738281 5.18515625 8.35117188 6.4484375 8.4375 7.75 C8.55931641 9.62945312 8.55931641 9.62945312 8.68359375 11.546875 C8.92741571 14.20784552 9.33863845 16.44273534 10 19 C10.12205329 21.67540816 10.04467313 24.31961238 10 27 C9.67 25.68 9.34 24.36 9 23 C8.34 23 7.68 23 7 23 C7 21.68 7 20.36 7 19 C6.01 19.33 5.02 19.66 4 20 C4.14032492 23.18776711 4.28826644 26.3751385 4.4375 29.5625 C4.47681641 30.45775391 4.51613281 31.35300781 4.55664062 32.27539062 C4.79332094 37.24567724 5.26235156 42.07421535 6 47 C6.31224083 53.08869614 5.89219262 58.97769981 5 65 C3.41951802 62.15296048 2.67365901 59.81593816 2.31396484 56.58618164 C2.21401215 55.72170914 2.11405945 54.85723663 2.01107788 53.96656799 C1.91203156 53.04045212 1.81298523 52.11433624 1.7109375 51.16015625 C1.60278717 50.20104843 1.49463684 49.24194061 1.38320923 48.25376892 C1.15619012 46.22760124 0.93283703 44.20101991 0.71289062 42.17407227 C0.37654051 39.07668626 0.02912133 35.98070014 -0.3203125 32.88476562 C-0.53971319 30.91413484 -0.75848419 28.94343382 -0.9765625 26.97265625 C-1.13120468 25.58651878 -1.13120468 25.58651878 -1.28897095 24.17237854 C-1.38261932 23.30475388 -1.4762677 22.43712921 -1.57275391 21.54321289 C-1.65554596 20.78472549 -1.73833801 20.0262381 -1.82363892 19.24476624 C-2.01402354 16.82150505 -2.02927779 14.42973891 -2 12 C-1.01 12 -0.02 12 1 12 C0.67 11.67 0.34 11.34 0 11 C-0.07226502 9.14712498 -0.0838122 7.29166122 -0.0625 5.4375 C-0.05347656 4.42558594 -0.04445312 3.41367188 -0.03515625 2.37109375 C-0.02355469 1.58863281 -0.01195312 0.80617187 0 0 Z " fill="#8C160A" transform="translate(189,144)"/>
<path d="M0 0 C2.85286067 2.85286067 2.27354804 4.82381381 2.30078125 8.81640625 C2.30619934 9.5008783 2.31161743 10.18535034 2.31719971 10.89056396 C2.32870372 13.11473669 2.32231284 15.33832518 2.3125 17.5625 C2.31200653 18.31276459 2.31151306 19.06302917 2.31100464 19.83602905 C2.28873628 30.81580596 1.73143421 41.31485579 -1 52 C-1.19722656 52.79792969 -1.39445312 53.59585938 -1.59765625 54.41796875 C-1.79681641 55.20107422 -1.79681641 55.20107422 -2 56 C-2.66 56 -3.32 56 -4 56 C-4 50.72 -4 45.44 -4 40 C-4.66 40 -5.32 40 -6 40 C-6 41.98 -6 43.96 -6 46 C-6.66 46 -7.32 46 -8 46 C-8.32343058 37.77048861 -8.08235681 29.93548965 -6.6875 21.8125 C-6.56979248 21.09457275 -6.45208496 20.37664551 -6.33081055 19.63696289 C-5.59010889 15.64816836 -4.59795988 13.08853209 -2 10 C-1.26739841 7.68652128 -0.588562 5.354248 0 3 C-0.66 3 -1.32 3 -2 3 C-2 2.34 -2 1.68 -2 1 C-1.34 0.67 -0.68 0.34 0 0 Z " fill="#101036" transform="translate(279,122)"/>
<path d="M0 0 C-1.89329975 18.38493707 -4.37100523 36.70700006 -7 55 C-7.33 55 -7.66 55 -8 55 C-8 52.69 -8 50.38 -8 48 C-8.66 48 -9.32 48 -10 48 C-9.83628906 47.06027344 -9.67257812 46.12054688 -9.50390625 45.15234375 C-8.80980351 40.2936246 -8.89165691 35.46065789 -8.9375 30.5625 C-8.94201172 29.64017578 -8.94652344 28.71785156 -8.95117188 27.76757812 C-8.96286062 25.51164952 -8.97924545 23.25586033 -9 21 C-9.99 21 -10.98 21 -12 21 C-12 20.01 -12 19.02 -12 18 C-12.99 18.33 -13.98 18.66 -15 19 C-16.0625 16.625 -16.0625 16.625 -17 14 C-16.67 13.34 -16.34 12.68 -16 12 C-15.01 12 -14.02 12 -13 12 C-13 12.66 -13 13.32 -13 14 C-12.34 14 -11.68 14 -11 14 C-11.34227572 11.02934491 -11.34227572 11.02934491 -12 8 C-12.66 7.67 -13.32 7.34 -14 7 C-13.34 6.34 -12.68 5.68 -12 5 C-12 5.66 -12 6.32 -12 7 C-11.34 7 -10.68 7 -10 7 C-10.33 6.01 -10.66 5.02 -11 4 C-9.5437455 3.32880451 -8.08492133 2.66318193 -6.625 2 C-5.81289063 1.62875 -5.00078125 1.2575 -4.1640625 0.875 C-2 0 -2 0 0 0 Z " fill="#48080F" transform="translate(267,155)"/>
<path d="M0 0 C2.9664161 0.3178303 4.01076795 1.0104603 6.1875 3.125 C8.30075583 6.47706098 8.69282238 9.08348532 9 13 C8.34 12.34 7.68 11.68 7 11 C6.90203125 12.134375 6.8040625 13.26875 6.703125 14.4375 C5.22933659 29.84823769 5.22933659 29.84823769 1 36 C0.01 36.33 -0.98 36.66 -2 37 C-2 36.34 -2 35.68 -2 35 C-1.34 35 -0.68 35 0 35 C0.144375 34.030625 0.28875 33.06125 0.4375 32.0625 C1 29 1 29 2 28 C2.04063832 26.33382885 2.042721 24.66611905 2 23 C1.484375 23.70125 0.96875 24.4025 0.4375 25.125 C-2.4427364 28.52220191 -5.50675897 31.25235192 -9 34 C-10.04027344 34.83144531 -10.04027344 34.83144531 -11.1015625 35.6796875 C-16.69830594 39.81297153 -21.10322721 40.95807433 -28 41 C-28.93070313 41.02578125 -29.86140625 41.0515625 -30.8203125 41.078125 C-35.65851449 41.16082931 -35.65851449 41.16082931 -38 41 C-39 40 -39 40 -39.0625 37.4375 C-39.041875 36.633125 -39.02125 35.82875 -39 35 C-38.34 36.32 -37.68 37.64 -37 39 C-26.39243167 39.7857458 -19.18204679 35.61831133 -11.12890625 29 C-8.94938865 27.07265066 -8.94938865 27.07265066 -7.33984375 24.75 C-6.89769531 24.1725 -6.45554688 23.595 -6 23 C-5.34 23 -4.68 23 -4 23 C-3.690625 22.030625 -3.38125 21.06125 -3.0625 20.0625 C-2 17 -2 17 -1 16 C-0.76345976 13.8798986 -0.58548166 11.75311717 -0.4375 9.625 C-0.35371094 8.46226563 -0.26992187 7.29953125 -0.18359375 6.1015625 C-0.06335785 4.07034334 0 2.03477467 0 0 Z " fill="#FC900C" transform="translate(173,18)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C4.97008031 7.48976775 6.22553475 14.9129682 6 23 C5.34 23.66 4.68 24.32 4 25 C3.67 24.01 3.34 23.02 3 22 C2.34 22 1.68 22 1 22 C1 23.32 1 24.64 1 26 C0.34 26.33 -0.32 26.66 -1 27 C-0.67 27.99 -0.34 28.98 0 30 C-2.97 30.66 -5.94 31.32 -9 32 C-9 32.99 -9 33.98 -9 35 C-10.98 34.67 -12.96 34.34 -15 34 C-14.67 32.68 -14.34 31.36 -14 30 C-13.34 30 -12.68 30 -12 30 C-12 29.01 -12 28.02 -12 27 C-11.34 26.67 -10.68 26.34 -10 26 C-9.67 25.01 -9.34 24.02 -9 23 C-8.01 23 -7.02 23 -6 23 C-5.67 22.01 -5.34 21.02 -5 20 C-4.34 19.34 -3.68 18.68 -3 18 C-2.83322718 14.41656024 -2.83322718 14.41656024 -3 11 C-6.39914975 12.13304992 -7.05254451 13.12518475 -9 16 C-10.32 15.67 -11.64 15.34 -13 15 C-12.48050781 14.50371094 -11.96101562 14.00742188 -11.42578125 13.49609375 C-8.01096184 10.16964305 -4.81463563 6.94964511 -2.125 3 C-1.42375 2.01 -0.7225 1.02 0 0 Z " fill="#361525" transform="translate(186,192)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C2.65794026 15.16116457 2.65794026 15.16116457 -0.23046875 22.125 C-1.28119692 24.68514985 -1.6496392 27.26718579 -2 30 C-4.64 30 -7.28 30 -10 30 C-10.84843174 23.43300475 -11.12561146 17.05449407 -11.0625 10.4375 C-11.05798828 9.52419922 -11.05347656 8.61089844 -11.04882812 7.66992188 C-11.0371874 5.44654262 -11.02083851 3.22330879 -11 1 C-9.68 1 -8.36 1 -7 1 C-6.67 1.66 -6.34 2.32 -6 3 C-2.75016865 1.91215032 -2.75016865 1.91215032 0 0 Z " fill="#1D0202" transform="translate(224,184)"/>
<path d="M0 0 C-0.5625 1.8125 -0.5625 1.8125 -2 4 C-4.31104818 5.05047644 -6.64583651 6.05007438 -9 7 C-9.66515625 7.72896484 -9.66515625 7.72896484 -10.34375 8.47265625 C-12.67941666 10.62653753 -15.01032369 11.05284047 -18.0625 11.875 C-35.46226014 17.03333597 -47.66631389 27.27045827 -56.71484375 42.9765625 C-60.13379065 49.44664784 -62.39922254 55.86671097 -64 63 C-64.66 62.34 -65.32 61.68 -66 61 C-65.81858984 51.20385138 -61.43958582 42.05775105 -55.234375 34.62109375 C-53.78809749 32.9028435 -53.78809749 32.9028435 -53 30 C-51.4765625 28.5 -51.4765625 28.5 -49.625 27 C-47.78045235 25.49296532 -46.03934084 24.04145181 -44.3984375 22.3125 C-43 21 -43 21 -41 21 C-40.34 19.68 -39.68 18.36 -39 17 C-38.34 17 -37.68 17 -37 17 C-36.773125 16.360625 -36.54625 15.72125 -36.3125 15.0625 C-35.879375 14.381875 -35.44625 13.70125 -35 13 C-34.23816406 12.84789063 -33.47632813 12.69578125 -32.69140625 12.5390625 C-29.74143597 11.94821214 -28.11219203 10.97499151 -25.625 9.3125 C-21.28909625 6.61967556 -16.9048193 4.53439115 -12.1875 2.625 C-11.55344238 2.36243408 -10.91938477 2.09986816 -10.26611328 1.8293457 C-6.71984107 0.43285462 -3.81291258 -0.30503301 0 0 Z " fill="#F9F5A8" transform="translate(110,76)"/>
<path d="M0 0 C0 2.66666667 0 5.33333333 0 8 C1.66274199 9.25124046 1.66274199 9.25124046 4 10 C6.82078213 9.25556887 6.82078213 9.25556887 10 8 C17.3307146 5.77969566 24.45561485 5.76087478 32.0625 5.875 C33.79016602 5.88853516 33.79016602 5.88853516 35.55273438 5.90234375 C38.36871193 5.92571286 41.18424158 5.95847435 44 6 C44 6.66 44 7.32 44 8 C43.34515625 8.01981934 42.6903125 8.03963867 42.015625 8.06005859 C39.01005552 8.15610522 36.00510669 8.26545784 33 8.375 C31.97003906 8.4059375 30.94007812 8.436875 29.87890625 8.46875 C18.40172855 8.77856398 18.40172855 8.77856398 8.6875 14.3125 C8.02492188 14.92996094 7.36234375 15.54742187 6.6796875 16.18359375 C4.83150018 18.05232456 4.83150018 18.05232456 3.3125 20.875 C2 23 2 23 -0.4375 24.0625 C-3 24 -3 24 -5.0625 22.3125 C-5.701875 21.549375 -6.34125 20.78625 -7 20 C-7.7425 19.2575 -8.485 18.515 -9.25 17.75 C-10.11625 16.88375 -10.11625 16.88375 -11 16 C-9.69891569 11.12450824 -7.82914252 8.2765221 -4.375 4.625 C-3.14910156 3.31402344 -3.14910156 3.31402344 -1.8984375 1.9765625 C-1.27195312 1.32429688 -0.64546875 0.67203125 0 0 Z " fill="#D22309" transform="translate(86,119)"/>
<path d="M0 0 C0.5775 0.639375 1.155 1.27875 1.75 1.9375 C3.98062401 3.98223868 5.07436391 4.58205199 8 5 C8 5.66 8 6.32 8 7 C8.99 7 9.98 7 11 7 C11 7.66 11 8.32 11 9 C13.28453433 10.14226716 15.62508799 11.06253473 18 12 C18 12.66 18 13.32 18 14 C18.99 14.33 19.98 14.66 21 15 C21 15.66 21 16.32 21 17 C22.98 17.66 24.96 18.32 27 19 C23.12425751 22.87574249 19.37794156 23.37946828 14 24 C13.67 22.02 13.34 20.04 13 18 C11.35 18 9.7 18 8 18 C8 17.34 8 16.68 8 16 C6.9790625 16.4640625 6.9790625 16.4640625 5.9375 16.9375 C3 17 3 17 1.25 15.75390625 C-2.727574 11.90491762 -5.49250858 7.91468319 -8 3 C-6.125 2.375 -6.125 2.375 -4 2 C-3.34 2.66 -2.68 3.32 -2 4 C-2 3.01 -2 2.02 -2 1 C-1.34 0.67 -0.68 0.34 0 0 Z " fill="#FBEAC0" transform="translate(49,188)"/>
<path d="M0 0 C0.99 0.495 0.99 0.495 2 1 C-13.48793705 14.62036876 -30.93968796 23.56262081 -50.6875 29.3125 C-51.51781738 29.55508545 -52.34813477 29.7976709 -53.20361328 30.04760742 C-65.15156836 33.35427587 -76.88011595 34.36603935 -89.25 34.3125 C-89.93075592 34.31034485 -90.61151184 34.3081897 -91.31289673 34.30596924 C-101.8303124 34.25265096 -111.81149623 33.7566092 -122 31 C-122.83660156 30.77473633 -123.67320313 30.54947266 -124.53515625 30.31738281 C-141.04890096 25.77313292 -141.04890096 25.77313292 -148 22 C-145.75476719 21.23006397 -144.47764981 20.83074583 -142.203125 21.63671875 C-141.55859375 21.98347656 -140.9140625 22.33023437 -140.25 22.6875 C-125.19596961 29.84311642 -107.5982803 31.36483212 -91.15209961 31.31567383 C-88.93619187 31.31249813 -86.72160502 31.3361353 -84.50585938 31.36132812 C-75.92515961 31.39947095 -68.26032989 30.43657171 -60 28 C-58.45089192 27.65435339 -56.89887995 27.32136215 -55.34375 27.00390625 C-34.7543694 22.49072143 -16.6461141 12.63627362 0 0 Z " fill="#153084" transform="translate(230,247)"/>
<path d="M0 0 C0 1.65 0 3.3 0 5 C-0.66 5 -1.32 5 -2 5 C-2.2284549 7.24362573 -2.2284549 7.24362573 0 9.125 C0.66 9.74375 1.32 10.3625 2 11 C1.67 11.66 1.34 12.32 1 13 C-0.32 13 -1.64 13 -3 13 C-3 13.66 -3 14.32 -3 15 C-2.34 15 -1.68 15 -1 15 C-0.67 15.99 -0.34 16.98 0 18 C0.99 18.66 1.98 19.32 3 20 C2.4375 21.9375 2.4375 21.9375 1 24 C-2.4375 24.6875 -2.4375 24.6875 -6 25 C-6.99 25.33 -7.98 25.66 -9 26 C-10.22969878 29.51190809 -10.22969878 29.51190809 -11 33 C-13.78982013 27.79233575 -14.11733107 23.67175531 -14.0625 17.75 C-14.05347656 16.48671875 -14.04445313 15.2234375 -14.03515625 13.921875 C-14.02355469 12.95765625 -14.01195312 11.9934375 -14 11 C-12 11 -10 11 -8 11 C-8 10.34 -8 9.68 -8 9 C-8.66 9 -9.32 9 -10 9 C-10 8.34 -10 7.68 -10 7 C-10.66 7 -11.32 7 -12 7 C-12 6.34 -12 5.68 -12 5 C-11.34 5 -10.68 5 -10 5 C-10 4.34 -10 3.68 -10 3 C-10.66 2.67 -11.32 2.34 -12 2 C-11.01 2 -10.02 2 -9 2 C-9 2.66 -9 3.32 -9 4 C-7.35 3.67 -5.7 3.34 -4 3 C-4.33 2.34 -4.66 1.68 -5 1 C-1.125 0 -1.125 0 0 0 Z " fill="#231740" transform="translate(17,149)"/>
<path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C1.19175781 1.85820313 0.38351563 1.71640625 -0.44921875 1.5703125 C-6.32263659 0.48610664 -6.32263659 0.48610664 -11.76953125 2.12890625 C-13.2285504 3.91035367 -13.2285504 3.91035367 -15 7 C-16.31543863 8.35099103 -17.64175118 9.69205669 -19 11 C-16.03 11 -13.06 11 -10 11 C-10 11.33 -10 11.66 -10 12 C-19.24 12.33 -28.48 12.66 -38 13 C-39 9 -39 9 -38.14453125 6.89453125 C-37.70496094 6.20746094 -37.26539062 5.52039063 -36.8125 4.8125 C-36.38582031 4.11769531 -35.95914063 3.42289062 -35.51953125 2.70703125 C-33.70172043 0.66491473 -32.6866474 0.31059507 -30 0 C-27.99053778 0.27050453 -25.98645776 0.59367909 -24 1 C-23.67 0.34 -23.34 -0.32 -23 -1 C-15.42267843 -2.76282903 -7.44814274 -2.04435379 0 0 Z " fill="#CD1A10" transform="translate(131,87)"/>
<path d="M0 0 C3.375 0.9375 3.375 0.9375 4.8125 3 C5.0909375 3.9590625 5.0909375 3.9590625 5.375 4.9375 C6.035 3.6175 6.695 2.2975 7.375 0.9375 C9.76064077 1.51334432 12.04182784 2.15977595 14.375 2.9375 C16.60074335 3.16201458 18.83081519 3.34532878 21.0625 3.5 C22.24199219 3.58378906 23.42148438 3.66757813 24.63671875 3.75390625 C25.99216797 3.84478516 25.99216797 3.84478516 27.375 3.9375 C27.375 4.9275 27.375 5.9175 27.375 6.9375 C26.715 6.9375 26.055 6.9375 25.375 6.9375 C25.375 7.5975 25.375 8.2575 25.375 8.9375 C23.79532193 9.61278223 22.21108097 10.27739694 20.625 10.9375 C19.74328125 11.30875 18.8615625 11.68 17.953125 12.0625 C15.375 12.9375 15.375 12.9375 11.375 12.9375 C11.375 13.5975 11.375 14.2575 11.375 14.9375 C3.93354301 14.34218344 -0.19823258 11.74270633 -5 6.1875 C-5.8825637 5.11031969 -6.76031695 4.0290857 -7.625 2.9375 C-4.95306414 0.26556414 -3.86874355 -0.06670248 0 0 Z " fill="#F8DFC4" transform="translate(133.625,168.0625)"/>
<path d="M0 0 C1.32 0.66 2.64 1.32 4 2 C2.6078125 2.6496875 2.6078125 2.6496875 1.1875 3.3125 C-1.88503022 4.73043989 -1.88503022 4.73043989 -3.44140625 6.48046875 C-5.71705282 8.69908157 -8.3766495 9.67105472 -11.2578125 10.9375 C-13.34241818 11.95176998 -13.34241818 11.95176998 -14 15 C-17 17 -17 17 -21 17 C-21.33 17.99 -21.66 18.98 -22 20 C-22.66 20 -23.32 20 -24 20 C-24.33 21.65 -24.66 23.3 -25 25 C-25.99 25 -26.98 25 -28 25 C-28.14308594 25.88945313 -28.14308594 25.88945313 -28.2890625 26.796875 C-29.15302616 29.47421293 -30.23174829 30.45943528 -32.375 32.25 C-33.28378906 33.03117187 -33.28378906 33.03117187 -34.2109375 33.828125 C-36 35 -36 35 -39 35 C-39.38841085 31.20032861 -39.24462312 29.39320115 -37.19921875 26.10546875 C-31.32730434 19.28382013 -25.28907026 13.35993287 -18 8 C-17.27683594 7.46246094 -16.55367187 6.92492187 -15.80859375 6.37109375 C-11.1647186 3.18126953 -7.57858859 2.48091281 -2 2 C-1.34 1.34 -0.68 0.68 0 0 Z M-41 35 C-40.01 35.495 -40.01 35.495 -39 36 C-39.66 36.66 -40.32 37.32 -41 38 C-41 37.01 -41 36.02 -41 35 Z " fill="#FAF9F2" transform="translate(81,76)"/>
<path d="M0 0 C0.495 0.99 0.495 0.99 1 2 C-0.45637671 3.95981557 -1.91500152 5.91788547 -3.375 7.875 C-3.99375 8.70837891 -3.99375 8.70837891 -4.625 9.55859375 C-6.3254573 11.8350124 -7.9879119 13.9879119 -10 16 C-11.32 16 -12.64 16 -14 16 C-14 15.34 -14 14.68 -14 14 C-23.24 14 -32.48 14 -42 14 C-42 11.69 -42 9.38 -42 7 C-40.76765625 7.02320313 -39.5353125 7.04640625 -38.265625 7.0703125 C-24.24762859 7.2590163 -12.69076299 6.54523603 0 0 Z " fill="#E26E1F" transform="translate(257,217)"/>
<path d="M0 0 C0 5.28 0 10.56 0 16 C2.64 16 5.28 16 8 16 C8 16.66 8 17.32 8 18 C-8.4458306 23.87196323 -8.4458306 23.87196323 -16 24 C-16.66 23.34 -17.32 22.68 -18 22 C-17.98266211 16.07044037 -14.89189945 12.91387949 -11.125 8.75 C-10.58230469 8.12609375 -10.03960937 7.5021875 -9.48046875 6.859375 C-3.43416622 0 -3.43416622 0 0 0 Z " fill="#DE2209" transform="translate(177,55)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C2.375 7.75 2.375 7.75 -1 10 C-0.814375 9.071875 -0.62875 8.14375 -0.4375 7.1875 C0.24123881 3.98656229 0.24123881 3.98656229 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z M-17 1 C-14.525 1.99 -14.525 1.99 -12 3 C-12 3.99 -12 4.98 -12 6 C-10.35 6 -8.7 6 -7 6 C-6.67 7.32 -6.34 8.64 -6 10 C-4.35 10 -2.7 10 -1 10 C-1.99 11.485 -1.99 11.485 -3 13 C-3.04022391 15.3329866 -3.04320247 17.66706666 -3 20 C-3.33 20.33 -3.66 20.66 -4 21 C-4.19149081 24.63194641 -4.19149081 24.63194641 -3 28 C-3.99 28.99 -4.98 29.98 -6 31 C-6 26.05 -6 21.1 -6 16 C-7.65 16.99 -9.3 17.98 -11 19 C-11.66 19 -12.32 19 -13 19 C-13.66 20.32 -14.32 21.64 -15 23 C-16.32 22.67 -17.64 22.34 -19 22 C-18.67 21.01 -18.34 20.02 -18 19 C-19.98 19.99 -21.96 20.98 -24 22 C-24.25 18.6875 -24.25 18.6875 -24 15 C-22 13.1875 -22 13.1875 -20 12 C-20 11.34 -20 10.68 -20 10 C-19.34 10 -18.68 10 -18 10 C-17.67 9.01 -17.34 8.02 -17 7 C-16.34 7 -15.68 7 -15 7 C-15.99 5.68 -16.98 4.36 -18 3 C-17.67 2.34 -17.34 1.68 -17 1 Z " fill="#210203" transform="translate(251,173)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C0.50499533 8.08996004 -8.14999264 12.93616708 -15.9375 16.25 C-19.79801814 17.19543301 -23.02929337 17.20190034 -27 17 C-28 16 -28 16 -28.3125 13.1875 C-28 10 -28 10 -26.4375 7.875 C-22.36549494 4.74268841 -18.94150297 2.22401957 -13.75 1.625 C-11 2 -11 2 -8 4 C-7.67 3.01 -7.34 2.02 -7 1 C-7 1.99 -7 2.98 -7 4 C-4.36 3.67 -1.72 3.34 1 3 C0.67 2.01 0.34 1.02 0 0 Z " fill="#1547B5" transform="translate(163,41)"/>
<path d="M0 0 C1.051875 0.433125 1.051875 0.433125 2.125 0.875 C3.07375 1.24625 4.0225 1.6175 5 2 C5.886875 2.37125 6.77375 2.7425 7.6875 3.125 C10.85114744 3.96068046 12.90699685 3.9778893 16.125 3.8125 C20.65711991 3.73059422 20.65711991 3.73059422 23.625 6.0625 C25.30975023 9.66173912 25.43703804 12.06665768 25 16 C24.34 16.99 23.68 17.98 23 19 C23.66 19.33 24.32 19.66 25 20 C24.34 20.33 23.68 20.66 23 21 C23.28875 21.61875 23.5775 22.2375 23.875 22.875 C25.41848825 27.16246735 26.19872371 31.52227954 27 36 C27.18304688 36.89074219 27.36609375 37.78148437 27.5546875 38.69921875 C28.14929048 43.10658297 28.1059727 47.4340968 28.0625 51.875 C28.05798828 52.75414062 28.05347656 53.63328125 28.04882812 54.5390625 C28.03712337 56.69273803 28.01919069 58.84637817 28 61 C27.67 61 27.34 61 27 61 C26.96261719 59.92363281 26.92523438 58.84726563 26.88671875 57.73828125 C25.94712979 35.23732568 19.42820468 18.69625497 3 3 C1.9977038 2.00230149 0.9969925 1.00299848 0 0 Z " fill="#FCE37D" transform="translate(148,95)"/>
<path d="M0 0 C4 3 8 6 12 9 C9.1875 11.0625 9.1875 11.0625 6 13 C5.01 12.67 4.02 12.34 3 12 C3 12.66 3 13.32 3 14 C2.34 14.66 1.68 15.32 1 16 C0.01 16 -0.98 16 -2 16 C-1.67 16.99 -1.34 17.98 -1 19 C-3.95664519 20.4783226 -6.74229737 20.06032783 -10 20 C-11.04449911 16.86650268 -10.93423645 16.01031744 -10 13 C-10.33 13.33 -10.66 13.66 -11 14 C-11.99 14 -12.98 14 -14 14 C-14.99 15.485 -14.99 15.485 -16 17 C-16.99 17 -17.98 17 -19 17 C-18.3001048 13.85047161 -17.34839851 10.9347497 -16 8 C-15.34 7.67 -14.68 7.34 -14 7 C-14 6.01 -14 5.02 -14 4 C-13.01 3.67 -12.02 3.34 -11 3 C-11 3.66 -11 4.32 -11 5 C-7.535 4.505 -7.535 4.505 -4 4 C-4 5.98 -4 7.96 -4 10 C-2.68 10 -1.36 10 0 10 C0 6.7 0 3.4 0 0 Z " fill="#2163B4" transform="translate(51,67)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.6443396 1.77863403 1.6443396 1.77863403 1.28149414 2.57299805 C0.20305916 4.9420668 -0.86727546 7.31471158 -1.9375 9.6875 C-2.31068359 10.50412109 -2.68386719 11.32074219 -3.06835938 12.16210938 C-4.82856215 16.07895698 -6.44798642 19.6977989 -7 24 C-7.99 24.33 -8.98 24.66 -10 25 C-10 24.34 -10 23.68 -10 23 C-10.99 23.33 -11.98 23.66 -13 24 C-13.33 21.03 -13.66 18.06 -14 15 C-15.32 15 -16.64 15 -18 15 C-18 15.66 -18 16.32 -18 17 C-17.34 17.33 -16.68 17.66 -16 18 C-16.33 18.99 -16.66 19.98 -17 21 C-18.65 20.01 -20.3 19.02 -22 18 C-22 19.65 -22 21.3 -22 23 C-23.65 23 -25.3 23 -27 23 C-27 21.68 -27 20.36 -27 19 C-27.99 18.67 -28.98 18.34 -30 18 C-29.34 16.35 -28.68 14.7 -28 13 C-27.67 13.99 -27.34 14.98 -27 16 C-24.98491642 16.73323796 -24.98491642 16.73323796 -23 17 C-23 16.01 -23 15.02 -23 14 C-20.69 13.34 -18.38 12.68 -16 12 C-16.33 10.68 -16.66 9.36 -17 8 C-14.03 8 -11.06 8 -8 8 C-8.33 6.02 -8.66 4.04 -9 2 C-8.34 2 -7.68 2 -7 2 C-6.67 2.66 -6.34 3.32 -6 4 C-5.566875 3.525625 -5.13375 3.05125 -4.6875 2.5625 C-3 1 -3 1 0 0 Z " fill="#293573" transform="translate(34,105)"/>
<path d="M0 0 C-0.3125 1.875 -0.3125 1.875 -1 4 C-1.99 4.66 -2.98 5.32 -4 6 C-4 7.32 -4 8.64 -4 10 C-3.195625 10.12375 -2.39125 10.2475 -1.5625 10.375 C-0.716875 10.58125 0.12875 10.7875 1 11 C1.33 11.66 1.66 12.32 2 13 C4.3140622 13.73075648 6.64828869 14.40138258 9 15 C9 13.02 9 11.04 9 9 C9.66 9 10.32 9 11 9 C11.625 11.8125 11.625 11.8125 12 15 C11.01 16.485 11.01 16.485 10 18 C9.29875 17.773125 8.5975 17.54625 7.875 17.3125 C4.10265715 16.90246273 2.21500569 18.10022391 -1 20 C-1.33 20.33 -1.66 20.66 -2 21 C-5.08638202 21.33366292 -6.61536475 21.22870204 -9.3125 19.625 C-9.869375 19.08875 -10.42625 18.5525 -11 18 C-11 17.34 -11 16.68 -11 16 C-12.32 15.67 -13.64 15.34 -15 15 C-15 14.34 -15 13.68 -15 13 C-16.32 13.33 -17.64 13.66 -19 14 C-8.80582524 0 -8.80582524 0 0 0 Z " fill="#3B9CDB" transform="translate(49,39)"/>
<path d="M0 0 C1.125 3.75 1.125 3.75 0 6 C-0.66 6 -1.32 6 -2 6 C-2 7.98 -2 9.96 -2 12 C-2.99 12.33 -3.98 12.66 -5 13 C-4.67 14.65 -4.34 16.3 -4 18 C-4.66 18 -5.32 18 -6 18 C-6.59732819 20.76264289 -7 23.16032769 -7 26 C-6.38125 25.79375 -5.7625 25.5875 -5.125 25.375 C-4.42375 25.25125 -3.7225 25.1275 -3 25 C-2.34 25.66 -1.68 26.32 -1 27 C-2.32 27.33 -3.64 27.66 -5 28 C-4.34 28.99 -3.68 29.98 -3 31 C-6.64247857 29.40212025 -9.44399679 27.15207958 -12.5 24.625 C-13.4384375 23.85414063 -14.376875 23.08328125 -15.34375 22.2890625 C-17.68462607 20.27177812 -19.93005473 18.29451481 -22 16 C-22 15.34 -22 14.68 -22 14 C-20.02 13.34 -18.04 12.68 -16 12 C-16 11.34 -16 10.68 -16 10 C-13.36 9.67 -10.72 9.34 -8 9 C-8 8.01 -8 7.02 -8 6 C-6.68 6 -5.36 6 -4 6 C-4 5.34 -4 4.68 -4 4 C-4.99 4.33 -5.98 4.66 -7 5 C-7.33 4.34 -7.66 3.68 -8 3 C-5.29120665 1.64560332 -2.99066732 1.93498549 0 2 C0 1.34 0 0.68 0 0 Z " fill="#45192F" transform="translate(61,223)"/>
<path d="M0 0 C3.73795473 4.53085422 5.36050263 9.41080442 7 15 C6.34 15.66 5.68 16.32 5 17 C5 16.34 5 15.68 5 15 C4.34 15 3.68 15 3 15 C2.87625 15.928125 2.87625 15.928125 2.75 16.875 C2.37875 17.926875 2.37875 17.926875 2 19 C1.34 19.28875 0.68 19.5775 0 19.875 C-0.99 20.431875 -0.99 20.431875 -2 21 C-2.81584568 24.05908413 -2.81584568 24.05908413 -3 27 C-3.33 27 -3.66 27 -4 27 C-4.17015625 26.29875 -4.3403125 25.5975 -4.515625 24.875 C-6.06731096 18.80031454 -7.98341431 13.483591 -11 8 C-11.6713409 6.66901404 -12.33921346 5.33625722 -13 4 C-12.01 4 -11.02 4 -10 4 C-10 3.34 -10 2.68 -10 2 C-9.01 2 -8.02 2 -7 2 C-7 1.34 -7 0.68 -7 0 C-2.96153846 -1.34615385 -2.96153846 -1.34615385 0 0 Z " fill="#5E1C2C" transform="translate(165,113)"/>
<path d="M0 0 C4.62 0 9.24 0 14 0 C13.67 1.65 13.34 3.3 13 5 C18.94 5.99 18.94 5.99 25 7 C25.66 5.68 26.32 4.36 27 3 C28.32 3.66 29.64 4.32 31 5 C31 5.66 31 6.32 31 7 C32.98 7 34.96 7 37 7 C37 7.66 37 8.32 37 9 C37.59167969 9.12117188 38.18335938 9.24234375 38.79296875 9.3671875 C43.03803585 10.26744643 47.02439661 11.20456621 51 13 C50.67 14.32 50.34 15.64 50 17 C50 16.34 50 15.68 50 15 C44.67125795 13.22375265 41.34746655 12.66101338 36.125 14.75 C31.63551793 15.27817436 27.60867017 12.40578011 24 10 C22.96875 10.020625 21.9375 10.04125 20.875 10.0625 C16.82300979 9.99714532 14.04612789 9.17348344 10.30859375 7.75390625 C4.72256778 5.92970488 -1.05268562 5.73848405 -6.875 5.4375 C-7.65875 5.39431641 -8.4425 5.35113281 -9.25 5.30664062 C-11.16650649 5.20146649 -13.08323333 5.10032075 -15 5 C-15 4.67 -15 4.34 -15 4 C-10.71 4 -6.42 4 -2 4 C-1.34 2.68 -0.68 1.36 0 0 Z " fill="#FBEA4B" transform="translate(119,80)"/>
<path d="M0 0 C1.65 0.33 3.3 0.66 5 1 C5 2.32 5 3.64 5 5 C9.455 5.99 9.455 5.99 14 7 C13.67 10.96 13.34 14.92 13 19 C7.78020872 19.1799928 3.92737019 18.97094808 -1 17 C-1 16.67 -1 16.34 -1 16 C-3.31 15.67 -5.62 15.34 -8 15 C-7.49396008 12.83125748 -7.00016187 11.00032373 -6 9 C-5.34 9 -4.68 9 -4 9 C-3.566875 8.13375 -3.566875 8.13375 -3.125 7.25 C-2.38332163 5.76664326 -1.63348573 4.28733336 -0.875 2.8125 C0.07245818 1.18535061 0.07245818 1.18535061 0 0 Z " fill="#110F33" transform="translate(193,240)"/>
<path d="M0 0 C7.59 0 15.18 0 23 0 C23 0.33 23 0.66 23 1 C18.545 1.495 18.545 1.495 14 2 C16.475 3.98 16.475 3.98 19 6 C18.49259538 10.39750672 15.91706686 12.86948922 13 16 C12.34 16 11.68 16 11 16 C11.33 16.99 11.66 17.98 12 19 C10.125 20.0625 10.125 20.0625 8 21 C7.34 20.67 6.68 20.34 6 20 C6 19.01 6 18.02 6 17 C4.35 17.33 2.7 17.66 1 18 C1 17.34 1 16.68 1 16 C1.99 16 2.98 16 4 16 C3.34 13.03 2.68 10.06 2 7 C2.99 7 3.98 7 5 7 C4.67 6.01 4.34 5.02 4 4 C1.98491642 3.26676204 1.98491642 3.26676204 0 3 C0 2.01 0 1.02 0 0 Z " fill="#C12612" transform="translate(211,161)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C0.74913936 5.17802095 -0.15640015 7.77969351 -3.99804688 11.33007812 C-4.51431641 11.77802734 -5.03058594 12.22597656 -5.5625 12.6875 C-7.49917927 14.39859333 -9.23206172 16.09808288 -11 18 C-11 19.32 -11 20.64 -11 22 C-7.7 22.66 -4.4 23.32 -1 24 C-0.67 25.65 -0.34 27.3 0 29 C-6.5106383 32.82978723 -6.5106383 32.82978723 -9.875 34 C-12.20329052 34.7958413 -12.20329052 34.7958413 -12.8125 37.125 C-12.874375 37.74375 -12.93625 38.3625 -13 39 C-11.02 39 -9.04 39 -7 39 C-10 41 -10 41 -14 41 C-14.66 39.35 -15.32 37.7 -16 36 C-17.32 36 -18.64 36 -20 36 C-20 35.34 -20 34.68 -20 34 C-15.38 32.35 -10.76 30.7 -6 29 C-6 28.34 -6 27.68 -6 27 C-6.69867188 26.87882812 -7.39734375 26.75765625 -8.1171875 26.6328125 C-9.02726563 26.46523437 -9.93734375 26.29765625 -10.875 26.125 C-11.77992188 25.96257812 -12.68484375 25.80015625 -13.6171875 25.6328125 C-16 25 -16 25 -18 23 C-18.06316957 19.86859396 -17.66716474 17.8085825 -15.64550781 15.35839844 C-13.85801265 13.6263454 -12.01741548 11.9916743 -10.125 10.375 C-8.85416731 9.26077498 -7.58585517 8.14366734 -6.3203125 7.0234375 C-5.73282227 6.50491211 -5.14533203 5.98638672 -4.54003906 5.45214844 C-2.77944185 3.79202919 -1.38248366 1.98188217 0 0 Z " fill="#D82806" transform="translate(199,71)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 0.66 3 1.32 3 2 C5.31 2 7.62 2 10 2 C10 2.99 10 3.98 10 5 C12.31 4.34 14.62 3.68 17 3 C17.66 3.66 18.32 4.32 19 5 C15.3558226 7.4294516 13.28758728 7.16179575 9 7 C8.67 6.01 8.34 5.02 8 4 C7.01 4.33 6.02 4.66 5 5 C3.77030122 8.51190809 3.77030122 8.51190809 3 12 C2.01 12 1.02 12 0 12 C-0.33 13.98 -0.66 15.96 -1 18 C-1.83144531 18.20496094 -2.66289062 18.40992188 -3.51953125 18.62109375 C-4.60621094 18.89050781 -5.69289062 19.15992188 -6.8125 19.4375 C-7.89144531 19.70433594 -8.97039062 19.97117188 -10.08203125 20.24609375 C-12.0740843 20.76077412 -14.04811524 21.34937175 -16 22 C-15.47702419 18.10575783 -14.61197534 16.10717819 -11.875 13.30078125 C-11.25109375 12.64916016 -10.6271875 11.99753906 -9.984375 11.32617188 C-9.32953125 10.66166016 -8.6746875 9.99714844 -8 9.3125 C-6.70652348 7.97701096 -5.41476998 6.63985029 -4.125 5.30078125 C-3.55007812 4.71466064 -2.97515625 4.12854004 -2.3828125 3.5246582 C-0.90305046 2.03078761 -0.90305046 2.03078761 0 0 Z " fill="#7D1318" transform="translate(201,110)"/>
<path d="M0 0 C0 6.39455649 -6.87233659 12.02735366 -11.0625 16.5 C-27.43784704 32.45689695 -50.09885262 40.51387166 -72.6875 40.3125 C-76.12732666 40.24880954 -79.5629011 40.15068894 -83 40 C-83 39.67 -83 39.34 -83 39 C-76.10534255 37.29290933 -69.34270737 36.65367855 -62.27148438 36.34204102 C-58.84380556 36.47788881 -58.84380556 36.47788881 -56 35 C-54.33828199 34.70029729 -52.67018597 34.43570819 -51 34.1875 C-44.84281882 33.11982712 -38.52387758 31.52387758 -34 27 C-32.16015625 26.18359375 -32.16015625 26.18359375 -30.0625 25.4375 C-29.37285156 25.18871094 -28.68320313 24.93992188 -27.97265625 24.68359375 C-26.31914641 24.11059529 -24.66017463 23.55339154 -23 23 C-23 22.34 -23 21.68 -23 21 C-21.27734375 19.7734375 -21.27734375 19.7734375 -18.9375 18.375 C-14.02564596 15.22955404 -10.65089364 11.49029578 -7 7 C-4.66666667 4.66666667 -2.33333333 2.33333333 0 0 Z " fill="#DF7B35" transform="translate(186,190)"/>
<path d="M0 0 C4.35829792 0.50288053 6.94936634 3.0171582 10 6 C10.875 8.8125 10.875 8.8125 11 11 C6.62385321 14.03899083 6.62385321 14.03899083 4 13.875 C2 13 2 13 -0.27685547 11.46801758 C-3.3365246 9.81858325 -5.1228808 9.6259145 -8.5703125 9.63671875 C-9.6325 9.63736328 -10.6946875 9.63800781 -11.7890625 9.63867188 C-12.88992187 9.65478516 -13.99078125 9.67089844 -15.125 9.6875 C-16.20265625 9.68427734 -17.2803125 9.68105469 -18.390625 9.67773438 C-26.23325198 9.72970359 -34.37793676 9.99936128 -41.66845703 13.1550293 C-42.43786621 13.43386963 -43.20727539 13.71270996 -44 14 C-46.3125 12.625 -46.3125 12.625 -48 11 C-47 9 -47 9 -45 8 C-41.32670036 7.86642547 -38.50147041 7.8328432 -35 9 C-31.81711646 7.12821884 -31.81711646 7.12821884 -29 5 C-28.34 5.33 -27.68 5.66 -27 6 C-27.33 6.66 -27.66 7.32 -28 8 C-21.73 7.67 -15.46 7.34 -9 7 C-8.67 6.34 -8.34 5.68 -8 5 C-6.68 5 -5.36 5 -4 5 C-1.73242436 3.71649673 -1.73242436 3.71649673 0 2 C0 1.34 0 0.68 0 0 Z " fill="#E92709" transform="translate(133,116)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C0.64972467 31.34060115 0.64972467 31.34060115 -5 37 C-7.69921875 38.546875 -7.69921875 38.546875 -10.6875 39.75 C-11.66074219 40.15734375 -12.63398438 40.5646875 -13.63671875 40.984375 C-22.09212506 43.53769166 -30.220898 42.92517444 -38.9375 42.1875 C-40.05318359 42.10435547 -41.16886719 42.02121094 -42.31835938 41.93554688 C-49.00117034 41.39919942 -55.46375104 40.49671699 -62 39 C-60 37 -60 37 -57.50390625 36.98828125 C-56.53324219 37.09527344 -55.56257812 37.20226562 -54.5625 37.3125 C-53.11037109 37.46138672 -53.11037109 37.46138672 -51.62890625 37.61328125 C-49 38 -49 38 -46 39 C-35.75055938 39.98913488 -25.34667532 39.6903472 -15.4375 36.8125 C-14.74253418 36.61640137 -14.04756836 36.42030273 -13.33154297 36.21826172 C-8.75563234 34.73322771 -6.62411188 32.97199948 -4 29 C-3.09762208 25.73523231 -3.09762208 25.73523231 -2.734375 22.16796875 C-2.56679688 20.87568359 -2.39921875 19.58339844 -2.2265625 18.25195312 C-2.06735056 16.89717741 -1.90850088 15.54235908 -1.75 14.1875 C-1.57702861 12.81296046 -1.40256423 11.43860793 -1.2265625 10.06445312 C-0.80299148 6.71118258 -0.39472717 3.35676751 0 0 Z " fill="#B86E56" transform="translate(263,181)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.43200679 4.75207471 -0.01510917 7.78210698 -2 12 C-2.66 12 -3.32 12 -4 12 C-4.185625 12.680625 -4.37125 13.36125 -4.5625 14.0625 C-8.12135751 21.33494796 -15.072485 25.63853485 -21.64453125 30.0078125 C-24.23264787 32.19676686 -25.03940577 33.79061581 -26 37 C-19.329015 39.25678003 -13.03128878 40.56615452 -6 41 C-6.33 42.65 -6.66 44.3 -7 46 C-6.34 46.33 -5.68 46.66 -5 47 C-6 48 -6 48 -9.0625 48.0625 C-10.031875 48.041875 -11.00125 48.02125 -12 48 C-12 46.68 -12 45.36 -12 44 C-12.763125 43.9175 -13.52625 43.835 -14.3125 43.75 C-19.96161629 42.60102719 -26.84046079 41.15953921 -31 37 C-31.125 34.75 -31.125 34.75 -30 32 C-27.52719101 29.72354309 -24.77540647 27.8872764 -22 26 C-11.67022884 18.69551827 -5.15779034 11.72225077 0 0 Z " fill="#F9AF0B" transform="translate(175,41)"/>
<path d="M0 0 C1.21236328 0.01353516 1.21236328 0.01353516 2.44921875 0.02734375 C3.37154297 0.04474609 3.37154297 0.04474609 4.3125 0.0625 C3.27803084 2.91182733 2.56515955 3.91887871 -0.11328125 5.44140625 C-1.06589844 5.83199219 -2.01851562 6.22257812 -3 6.625 C-5.92080316 7.84034101 -8.50641989 8.93789825 -11.1171875 10.734375 C-14.50740368 12.48615843 -16.74016479 12.16775947 -20.5 11.75 C-21.66144531 11.63011719 -22.82289062 11.51023437 -24.01953125 11.38671875 C-24.89996094 11.27972656 -25.78039062 11.17273438 -26.6875 11.0625 C-25.6975 10.4025 -24.7075 9.7425 -23.6875 9.0625 C-23.6875 8.0725 -23.6875 7.0825 -23.6875 6.0625 C-23.0275 5.7325 -22.3675 5.4025 -21.6875 5.0625 C-27.6275 5.0625 -33.5675 5.0625 -39.6875 5.0625 C-39.6875 4.7325 -39.6875 4.4025 -39.6875 4.0625 C-31.12851765 2.47977975 -22.73664152 1.734537 -14.04956055 1.40454102 C-9.20669127 1.20847141 -4.8103533 -0.06971527 0 0 Z " fill="#FDF387" transform="translate(136.6875,64.9375)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3.33 0.66 3.66 1.32 4 2 C6.02463255 2.65213292 6.02463255 2.65213292 8 3 C8.33 2.34 8.66 1.68 9 1 C9.99 1.33 10.98 1.66 12 2 C12.99 1.67 13.98 1.34 15 1 C15.495 3.475 15.495 3.475 16 6 C16.66 5.01 17.32 4.02 18 3 C20.62356462 2.01484622 23.24524123 1.57761071 26 1 C25.0941875 4.04682385 24.39271915 5.68813479 21.875 7.6875 C18.28849618 9.32481696 14.84980856 10.1517371 11 11 C11.33 10.01 11.66 9.02 12 8 C-3.68331342 11.26087243 -3.68331342 11.26087243 -18 18 C-18 16 -18 16 -16.5 14.0625 C-13.67291417 11.73015419 -11.16459627 10.80144966 -7.70703125 9.7109375 C-5.7937944 9.13237451 -5.7937944 9.13237451 -5 7 C-4.34 7 -3.68 7 -3 7 C-3 6.34 -3 5.68 -3 5 C-2.01 5 -1.02 5 0 5 C0 3.35 0 1.7 0 0 Z " fill="#2465BB" transform="translate(137,32)"/>
<path d="M0 0 C-0.79664063 0.71285156 -1.59328125 1.42570312 -2.4140625 2.16015625 C-10.54652282 9.48744787 -17.42168932 16.49712561 -23 26 C-23.66 25.01 -24.32 24.02 -25 23 C-25.99 22.67 -26.98 22.34 -28 22 C-28 22.66 -28 23.32 -28 24 C-29.65 24 -31.3 24 -33 24 C-33 22.68 -33 21.36 -33 20 C-33.66 19.67 -34.32 19.34 -35 19 C-35.3125 16.6875 -35.3125 16.6875 -35 14 C-32.39009711 12.02493835 -30.10298971 11.0343299 -27 10 C-26.67 9.34 -26.34 8.68 -26 8 C-26 8.99 -26 9.98 -26 11 C-24.35 10.67 -22.7 10.34 -21 10 C-21.66 11.32 -22.32 12.64 -23 14 C-22.34 14.66 -21.68 15.32 -21 16 C-20.01 16 -19.02 16 -18 16 C-18.33 15.01 -18.66 14.02 -19 13 C-17.68 12.67 -16.36 12.34 -15 12 C-14.896875 11.38125 -14.79375 10.7625 -14.6875 10.125 C-14 8 -14 8 -11 6 C-11 5.34 -11 4.68 -11 4 C-10.34 3.34 -9.68 2.68 -9 2 C-8.01 2 -7.02 2 -6 2 C-6 1.34 -6 0.68 -6 0 C-2.25 -1.125 -2.25 -1.125 0 0 Z " fill="#1E4E9F" transform="translate(60,79)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C0.66 2.33 1.32 2.66 2 3 C3.71231199 10.07755621 2.53209176 13.75242674 -0.71875 20.13671875 C-2.71373511 24.59502388 -3.37585782 29.18385807 -4 34 C-6 32 -6 32 -6.1875 28.4375 C-6 25 -6 25 -5 24 C-4.84327223 20.47362528 -4.95971031 17.38094149 -6 14 C-6.66 14 -7.32 14 -8 14 C-8 13.34 -8 12.68 -8 12 C-8.99 12 -9.98 12 -11 12 C-11 12.99 -11 13.98 -11 15 C-11.99 15.33 -12.98 15.66 -14 16 C-15.2077558 12.37673261 -14.54311128 11.35853631 -13 8 C-12.01 8 -11.02 8 -10 8 C-9.67 7.01 -9.34 6.02 -9 5 C-8.34 5 -7.68 5 -7 5 C-7 3.68 -7 2.36 -7 1 C-4.53721199 -0.231394 -2.7204945 -0.07159196 0 0 Z " fill="#441524" transform="translate(64,113)"/>
<path d="M0 0 C6.02770138 0.47587116 10.76678289 3.19722957 16 6 C15.67 7.65 15.34 9.3 15 11 C13.35 11.33 11.7 11.66 10 12 C10 10.68 10 9.36 10 8 C4.7786608 9.62419504 4.7786608 9.62419504 1.5625 13.6875 C1.376875 14.450625 1.19125 15.21375 1 16 C0.01 16 -0.98 16 -2 16 C-2 16.99 -2 17.98 -2 19 C-3.98 19.33 -5.96 19.66 -8 20 C-8 19.01 -8 18.02 -8 17 C-8.99 16.67 -9.98 16.34 -11 16 C-11 15.34 -11 14.68 -11 14 C-11.66 14 -12.32 14 -13 14 C-12.67 13.01 -12.34 12.02 -12 11 C-12 11.66 -12 12.32 -12 13 C-10.68 13 -9.36 13 -8 13 C-7.9175 12.37351562 -7.835 11.74703125 -7.75 11.1015625 C-7 9 -7 9 -5.1875 8.0234375 C-4.1046875 7.70246094 -4.1046875 7.70246094 -3 7.375 C-0.8567034 6.75580781 -0.8567034 6.75580781 1 6 C1.33 5.34 1.66 4.68 2 4 C1.34 4 0.68 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#1264B7" transform="translate(194,13)"/>
<path d="M0 0 C1.36511719 0.43119141 1.36511719 0.43119141 2.7578125 0.87109375 C3.45648438 1.09925781 4.15515625 1.32742187 4.875 1.5625 C4.875 2.2225 4.875 2.8825 4.875 3.5625 C7.845 4.0575 7.845 4.0575 10.875 4.5625 C11.5 6.375 11.5 6.375 11.875 8.5625 C10.885 10.0475 10.885 10.0475 9.875 11.5625 C10.205 12.5525 10.535 13.5425 10.875 14.5625 C10.0396875 14.6553125 10.0396875 14.6553125 9.1875 14.75 C5.92403513 15.89662279 4.23445094 18.08205157 1.875 20.5625 C-1.125 22.5625 -1.125 22.5625 -4.125 22.5625 C-4.125 21.9025 -4.125 21.2425 -4.125 20.5625 C-3.135 20.2325 -2.145 19.9025 -1.125 19.5625 C-1.455 18.9025 -1.785 18.2425 -2.125 17.5625 C-0.73304085 14.7785817 1.03075779 14.58351003 3.875 13.5625 C3.875 12.2425 3.875 10.9225 3.875 9.5625 C1.565 9.8925 -0.745 10.2225 -3.125 10.5625 C-3.455 11.8825 -3.785 13.2025 -4.125 14.5625 C-6.125 13.5625 -6.125 13.5625 -6.8125 11.75 C-7.1545193 9.35586487 -6.72229371 7.87701312 -6.125 5.5625 C-6.455 4.5725 -6.785 3.5825 -7.125 2.5625 C-6.465 2.5625 -5.805 2.5625 -5.125 2.5625 C-5.125 1.9025 -5.125 1.2425 -5.125 0.5625 C-5.785 0.2325 -6.445 -0.0975 -7.125 -0.4375 C-4.30685434 -1.84657283 -2.95222796 -0.94622691 0 0 Z " fill="#130820" transform="translate(78.125,224.4375)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.01 1.33 0.02 1.66 -1 2 C-1.29132813 2.58394531 -1.58265625 3.16789063 -1.8828125 3.76953125 C-3.37238868 6.74347531 -5.40665227 8.47184663 -7.875 10.6875 C-9.17050781 11.86892578 -9.17050781 11.86892578 -10.4921875 13.07421875 C-12.81278098 14.85623213 -14.15010688 15.60896815 -17 16 C-17 16.66 -17 17.32 -17 18 C-20.96124704 20.33014532 -24.73223885 22.29289554 -29 24 C-29.66 24.66 -30.32 25.32 -31 26 C-32.7645093 26.79262878 -34.56161287 27.51416457 -36.375 28.1875 C-37.33148438 28.55230469 -38.28796875 28.91710937 -39.2734375 29.29296875 C-42.05285296 30.01370542 -43.35108103 29.98549829 -46 29 C-44.41925436 28.18247697 -42.83528777 27.37118003 -41.25 26.5625 C-40.36828125 26.11003906 -39.4865625 25.65757812 -38.578125 25.19140625 C-36 24 -36 24 -33.734375 23.46484375 C-33.16203125 23.31144531 -32.5896875 23.15804687 -32 23 C-31.67 22.34 -31.34 21.68 -31 21 C-28.6859378 20.26924352 -26.35171131 19.59861742 -24 19 C-25.70892499 15.68539295 -25.70892499 15.68539295 -29.125 15.3125 C-30.07375 15.209375 -31.0225 15.10625 -32 15 C-28.69133067 12.79422045 -25.34040451 11.62086998 -21.625 10.3125 C-14.83436289 7.86889366 -8.70157188 4.86034784 -2.4765625 1.22265625 C-1.65929687 0.81917969 -0.84203125 0.41570312 0 0 Z " fill="#EEAD79" transform="translate(180,195)"/>
<path d="M0 0 C3.3 0 6.6 0 10 0 C10 0.66 10 1.32 10 2 C9.34 2 8.68 2 8 2 C8.99 3.98 9.98 5.96 11 8 C10.34 8 9.68 8 9 8 C8.67 8.99 8.34 9.98 8 11 C-5.26589875 17.62931189 -22.06974187 17.28858612 -36.5 17.3125 C-37.19579163 17.31599457 -37.89158325 17.31948914 -38.60845947 17.3230896 C-50.46575459 17.35616361 -50.46575459 17.35616361 -54 15 C-43.605 14.505 -43.605 14.505 -33 14 C-33 13.67 -33 13.34 -33 13 C-30.69 13 -28.38 13 -26 13 C-26 13.66 -26 14.32 -26 15 C-23.14567529 14.68889371 -20.29154475 14.37615574 -17.4375 14.0625 C-16.63763672 13.97548828 -15.83777344 13.88847656 -15.01367188 13.79882812 C-10.32743303 13.28238548 -5.66319454 12.69478469 -1 12 C-1.66 9.03 -2.32 6.06 -3 3 C0.91606575 3.53400897 3.39338934 4.19669467 7 6 C4.36 4.68 1.72 3.36 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#4F1C19" transform="translate(261,129)"/>
<path d="M0 0 C4.58248112 1.41898322 7.42289428 3.99935327 10.6875 7.375 C11.41549805 8.09816406 11.41549805 8.09816406 12.15820312 8.8359375 C14.656221 11.37185634 16.65621867 13.68376771 18 17 C15 18 15 18 12 18 C12 18.66 12 19.32 12 20 C11.01 20 10.02 20 9 20 C9 20.66 9 21.32 9 22 C5 22 5 22 2.75 19.875 C1.8425 18.92625 0.935 17.9775 0 17 C-2.61159773 14.92336643 -5.29515066 12.95312942 -8 11 C-6.68 10.34 -5.36 9.68 -4 9 C-4 9.66 -4 10.32 -4 11 C0.18868414 11.37233882 0.18868414 11.37233882 3.875 9.6875 C5.2773501 7.92199528 5.2773501 7.92199528 5 5 C3.68 4.67 2.36 4.34 1 4 C0.67 2.68 0.34 1.36 0 0 Z " fill="#DC2E14" transform="translate(146,95)"/>
<path d="M0 0 C0.495 1.485 0.495 1.485 1 3 C1.66 3.33 2.32 3.66 3 4 C1 6 1 6 -1.109375 6.0546875 C-2.41648437 5.96574219 -2.41648437 5.96574219 -3.75 5.875 C-8.59896802 5.76045745 -12.49624232 6.56418146 -17.125 8 C-26.88616159 10.98789369 -33.42203243 10.35928717 -43 7 C-43 6.67 -43 6.34 -43 6 C-42.16855469 5.95101562 -41.33710937 5.90203125 -40.48046875 5.8515625 C-39.39378906 5.77679688 -38.30710937 5.70203125 -37.1875 5.625 C-36.10855469 5.55539063 -35.02960938 5.48578125 -33.91796875 5.4140625 C-30.81373814 5.18804267 -30.81373814 5.18804267 -28 3 C-26.05810547 2.49755859 -26.05810547 2.49755859 -23.8671875 2.1484375 C-22.65675781 1.95507812 -22.65675781 1.95507812 -21.421875 1.7578125 C-20.58140625 1.63148438 -19.7409375 1.50515625 -18.875 1.375 C-18.05773437 1.2409375 -17.24046875 1.106875 -16.3984375 0.96875 C-10.8715194 0.11172789 -5.59164519 -0.12375875 0 0 Z " fill="#EEB797" transform="translate(154,210)"/>
<path d="M0 0 C0.70125 0.721875 1.4025 1.44375 2.125 2.1875 C8.40578107 8.41535314 14.06311326 13.01493921 23.1875 13.5 C30.48228725 13.32823908 36.5839315 10.20803425 43 7 C40.04960773 14.01502843 32.89655978 19.17064214 26 22 C26.875 17.125 26.875 17.125 28 16 C25.58388467 15.77762123 23.1682283 15.57167661 20.75 15.375 C20.06808594 15.31054688 19.38617188 15.24609375 18.68359375 15.1796875 C14.87311205 14.88372776 12.19775301 14.78617099 9 17 C7.29078411 18.5412312 7.29078411 18.5412312 6 20 C5 18 5 18 5 14 C2.525 15.485 2.525 15.485 0 17 C-0.66 16.34 -1.32 15.68 -2 15 C0.31 13.68 2.62 12.36 5 11 C5 10.34 5 9.68 5 9 C1.96474514 6.97649676 0.80573798 6.67875982 -2.6875 6.375 C-3.89986328 6.26285156 -3.89986328 6.26285156 -5.13671875 6.1484375 C-5.75160156 6.09945312 -6.36648437 6.05046875 -7 6 C-6.21625 5.38125 -5.4325 4.7625 -4.625 4.125 C-2.03162353 2.10141339 -2.03162353 2.10141339 0 0 Z " fill="#0B0C25" transform="translate(125,170)"/>
<path d="M0 0 C0.12375 0.639375 0.2475 1.27875 0.375 1.9375 C0.684375 2.9584375 0.684375 2.9584375 1 4 C4.80955639 5.90477819 8.40716321 5.17565535 12.375 4 C13.24125 3.67 14.1075 3.34 15 3 C11.53005564 6.9036874 7.44775994 9.36588975 3 12 C5.31 11.34 7.62 10.68 10 10 C9.57961469 14.90449525 7.42795092 16.65565764 4 20 C3.32650839 21.66392045 2.6590841 23.33032028 2 25 C-0.125 26.8125 -0.125 26.8125 -2 28 C-4.06068015 21.43158202 -4.89744474 17.33816037 -2 11 C-2.66 11 -3.32 11 -4 11 C-4 10.01 -4 9.02 -4 8 C-2.68 7.67 -1.36 7.34 0 7 C-0.66 6.34 -1.32 5.68 -2 5 C-2 4.01 -2 3.02 -2 2 C-2.66 1.67 -3.32 1.34 -4 1 C-2 0 -2 0 0 0 Z " fill="#F8A411" transform="translate(182,108)"/>
<path d="M0 0 C2.31 0.66 4.62 1.32 7 2 C7.495 4.475 7.495 4.475 8 7 C9.32 7.33 10.64 7.66 12 8 C12.495 9.98 12.495 9.98 13 12 C12.01 12 11.02 12 10 12 C9.67 12.99 9.34 13.98 9 15 C7.989375 14.690625 6.97875 14.38125 5.9375 14.0625 C3.44590042 13.34348128 1.221225 12.89904769 -1.375 12.5625 C-4.29543042 12.10932976 -6.30948398 11.54701314 -9.00390625 10.5078125 C-14.49456608 8.63706626 -19.80215671 8.44592953 -25.5625 8.3125 C-26.57119141 8.27833984 -27.57988281 8.24417969 -28.61914062 8.20898438 C-31.07931568 8.12736719 -33.53917309 8.05794324 -36 8 C-36 7.67 -36 7.34 -36 7 C-32.12501596 6.97082766 -28.25006042 6.95314327 -24.375 6.9375 C-23.28058594 6.92912109 -22.18617187 6.92074219 -21.05859375 6.91210938 C-19.46337891 6.90727539 -19.46337891 6.90727539 -17.8359375 6.90234375 C-16.37486572 6.89448853 -16.37486572 6.89448853 -14.88427734 6.88647461 C-12 7 -12 7 -8.76025391 7.63110352 C-7.84937012 7.75283936 -6.93848633 7.8745752 -6 8 C-5.34 7.34 -4.68 6.68 -4 6 C-3.34 5.34 -2.68 4.68 -2 4 C-1.30251417 2.68252676 -0.63040043 1.35085807 0 0 Z " fill="#F42A0B" transform="translate(139,92)"/>
<path d="M0 0 C3.1875 2.375 3.1875 2.375 5 5 C5.99 5.66 6.98 6.32 8 7 C8 7.66 8 8.32 8 9 C6.25 9.75 6.25 9.75 4 10 C3.38125 9.360625 2.7625 8.72125 2.125 8.0625 C0.11140486 5.70214529 0.11140486 5.70214529 -3.125 5.5625 C-4.548125 5.7790625 -4.548125 5.7790625 -6 6 C-6.99 7.485 -6.99 7.485 -8 9 C-8.33 8.01 -8.66 7.02 -9 6 C-12.37462715 6.54723683 -14.08235 7.0549 -17 9 C-17.33 9.99 -17.66 10.98 -18 12 C-19.33333333 12.66666667 -20.66666667 13.33333333 -22 14 C-22.33 14.99 -22.66 15.98 -23 17 C-23.99 17 -24.98 17 -26 17 C-26.875 14.4375 -26.875 14.4375 -27 11 C-21.082494 0.49755615 -11.29182599 -1.64470905 0 0 Z " fill="#EED15D" transform="translate(243,118)"/>
<path d="M0 0 C-1 3 -1 3 -4 5 C-5.93922785 5.49302403 -7.8791329 5.98374414 -9.82421875 6.453125 C-16.58872063 8.15335887 -20.7879963 10.46062624 -25.92578125 15.21484375 C-30.29236228 18.97289936 -34.77644198 21.80495105 -40.5625 22.3125 C-41.366875 22.209375 -42.17125 22.10625 -43 22 C-42.67 21.34 -42.34 20.68 -42 20 C-41.34 20 -40.68 20 -40 20 C-39.67 19.01 -39.34 18.02 -39 17 C-36.4375 15.8125 -36.4375 15.8125 -34 15 C-34 14.34 -34 13.68 -34 13 C-26.50356595 3.61910325 -11.6330872 0 0 0 Z " fill="#FBC21F" transform="translate(149,40)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.10957031 0.69867188 1.21914063 1.39734375 1.33203125 2.1171875 C1.49058594 3.02726563 1.64914063 3.93734375 1.8125 4.875 C1.96332031 5.77992188 2.11414063 6.68484375 2.26953125 7.6171875 C2.83051301 10.34412478 2.83051301 10.34412478 6 12 C6 10.35 6 8.7 6 7 C8.97 7.99 11.94 8.98 15 10 C15.33 9.34 15.66 8.68 16 8 C17.5358444 9.56877674 19.05331331 11.15556154 20.5625 12.75 C21.40941406 13.63171875 22.25632812 14.5134375 23.12890625 15.421875 C25 18 25 18 24.77734375 20.328125 C24.39255859 21.15570313 24.39255859 21.15570313 24 22 C24 21.34 24 20.68 24 20 C23.34 20 22.68 20 22 20 C23.0209375 21.11375 23.0209375 21.11375 24.0625 22.25 C26 25 26 25 25.75 27.3125 C25.5025 27.869375 25.255 28.42625 25 29 C24.34 28.01 23.68 27.02 23 26 C22.46375 26.2475 21.9275 26.495 21.375 26.75 C19 27 19 27 15.8125 25.625 C12.31412289 22.35984803 12.40697658 20.70566478 12.2109375 16.12890625 C11.93983207 13.39274964 10.92508991 11.92508991 9 10 C8.01 11.485 8.01 11.485 7 13 C4.625 12.6875 4.625 12.6875 2 12 C-0.13586678 8.79619983 -0.23132175 7.98060033 -0.125 4.3125 C-0.10695313 3.50425781 -0.08890625 2.69601563 -0.0703125 1.86328125 C-0.04710938 1.24839844 -0.02390625 0.63351563 0 0 Z " fill="#611313" transform="translate(27,186)"/>
<path d="M0 0 C0.96550781 0.00902344 1.93101563 0.01804687 2.92578125 0.02734375 C5.28412099 0.05069365 7.64192286 0.08343953 10 0.125 C10 0.455 10 0.785 10 1.125 C6.37 1.125 2.74 1.125 -1 1.125 C-1.33 2.115 -1.66 3.105 -2 4.125 C-5.3 3.795 -8.6 3.465 -12 3.125 C-12.433125 4.2078125 -12.433125 4.2078125 -12.875 5.3125 C-13.61065463 7.15163658 -14.36013354 8.985319 -15.125 10.8125 C-16.11796403 13.02467791 -16.11796403 13.02467791 -16 15.125 C-12.7 14.795 -9.4 14.465 -6 14.125 C-10.50033174 16.37516587 -15.0937005 18.06577689 -19.80859375 19.80859375 C-22.7516613 21.02256408 -25.32492948 22.40995479 -28 24.125 C-28.66 23.465 -29.32 22.805 -30 22.125 C-29.34 21.795 -28.68 21.465 -28 21.125 C-27.67 20.135 -27.34 19.145 -27 18.125 C-24.69 18.125 -22.38 18.125 -20 18.125 C-20 17.135 -20 16.145 -20 15.125 C-20.66 14.465 -21.32 13.805 -22 13.125 C-22.125 10.5 -22.125 10.5 -22 8.125 C-21.34 8.125 -20.68 8.125 -20 8.125 C-20 7.465 -20 6.805 -20 6.125 C-20.556875 6.475625 -21.11375 6.82625 -21.6875 7.1875 C-24.53886783 8.34345993 -26.08517222 7.93467438 -29 7.125 C-19.93205053 1.07970035 -10.6586576 -0.19112076 0 0 Z " fill="#A81C14" transform="translate(109,84.875)"/>
<path d="M0 0 C2.9777759 2.49996659 3.94548483 5.04711071 5.1875 8.6875 C5.53167969 9.68136719 5.87585938 10.67523438 6.23046875 11.69921875 C6.48441406 12.45847656 6.73835937 13.21773437 7 14 C8.32 14 9.64 14 11 14 C11.33 14.99 11.66 15.98 12 17 C14.01508358 17.73323796 14.01508358 17.73323796 16 18 C16 19.32 16 20.64 16 22 C15.01 22 14.02 22 13 22 C13.33 23.98 13.66 25.96 14 28 C11.69 28.33 9.38 28.66 7 29 C7 29.66 7 30.32 7 31 C5.68 30.67 4.36 30.34 3 30 C3.33 28.35 3.66 26.7 4 25 C3.34 24.67 2.68 24.34 2 24 C2.03480469 22.28103516 2.03480469 22.28103516 2.0703125 20.52734375 C2.08908479 18.9974024 2.10728341 17.46745394 2.125 15.9375 C2.14175781 15.18533203 2.15851563 14.43316406 2.17578125 13.65820312 C2.21865121 8.70672291 1.58399375 4.69585549 0 0 Z " fill="#1C255D" transform="translate(205,47)"/>
<path d="M0 0 C5.75 0.875 5.75 0.875 8 2 C8 2.99 8 3.98 8 5 C7.34 5 6.68 5 6 5 C6.20625 5.78375 6.4125 6.5675 6.625 7.375 C6.74875 8.24125 6.8725 9.1075 7 10 C6.34 10.66 5.68 11.32 5 12 C7.76264289 12.59732819 10.16032769 13 13 13 C13 13.66 13 14.32 13 15 C11.02 15.99 9.04 16.98 7 18 C7.33 19.32 7.66 20.64 8 22 C2.37413137 20.23186986 -0.77840563 16.83239156 -4 12 C-4.66 12 -5.32 12 -6 12 C-6.33 11.34 -6.66 10.68 -7 10 C-5.8125 6.4375 -5.8125 6.4375 -4 3 C-1.8125 2.0625 -1.8125 2.0625 0 2 C0 1.34 0 0.68 0 0 Z " fill="#2B1534" transform="translate(59,238)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2.60407596 3.8995646 2.82996938 5.22117847 2 8 C-3.55135067 14.2602894 -12.02743424 19.53727026 -20 22 C-23.57912349 21.90630567 -26.6468932 21.23145073 -30 20 C-30 20.66 -30 21.32 -30 22 C-33.3 21.67 -36.6 21.34 -40 21 C-40 20.67 -40 20.34 -40 20 C-39.12859375 19.84144531 -38.2571875 19.68289062 -37.359375 19.51953125 C-25.08578414 17.11528889 -9.51808886 12.99386717 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#3D0B16" transform="translate(185,182)"/>
<path d="M0 0 C1.98 0.66 3.96 1.32 6 2 C5.97679687 2.84304687 5.95359375 3.68609375 5.9296875 4.5546875 C5.91164062 5.65039062 5.89359375 6.74609375 5.875 7.875 C5.84019531 9.51082031 5.84019531 9.51082031 5.8046875 11.1796875 C5.69939466 14.1371051 5.69939466 14.1371051 8 16 C6.35 15.67 4.7 15.34 3 15 C3.11069824 15.80928955 3.22139648 16.6185791 3.33544922 17.45239258 C7.10016192 45.06877359 7.10016192 45.06877359 8.34667969 57.75634766 C8.81127102 62.42643657 9.42087394 67.04711367 10.125 71.6875 C10.8529148 76.53836975 11.19594115 81.10147125 11 86 C10.34 85.67 9.68 85.34 9 85 C8.49685013 82.30434812 8.12206255 79.68107573 7.81640625 76.9609375 C7.71623199 76.13621948 7.61605774 75.31150146 7.5128479 74.46179199 C7.18739032 71.76715337 6.87475734 69.07119744 6.5625 66.375 C6.23366476 63.61185661 5.90218719 60.84903776 5.57069397 58.08621216 C5.35187198 56.25942615 5.13420842 54.432501 4.91770935 52.60543823 C4.20588259 46.61688691 3.41883634 40.64275721 2.5793457 34.6706543 C1.45398583 26.64168487 0.74444087 18.9584675 0.9609375 10.83984375 C1.01192019 7.13340236 0.58476512 3.65478201 0 0 Z " fill="#C78F7A" transform="translate(184,141)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C2.03167835 4.3028536 2.25114546 8.53224437 2.3125 12.9375 C2.34150391 13.62779297 2.37050781 14.31808594 2.40039062 15.02929688 C2.4641722 20.20541662 1.21050141 23.00325334 -2 27 C-2.66 27.66 -3.32 28.32 -4 29 C-6.95662966 28.77256695 -8.55033688 28.38764062 -10.8125 26.4375 C-11.204375 25.963125 -11.59625 25.48875 -12 25 C-11.25 22.0625 -11.25 22.0625 -10 19 C-8.66666667 18.66666667 -7.33333333 18.33333333 -6 18 C-4.8049517 15.42825684 -4.8049517 15.42825684 -4 12 C-3.48494883 10.24828951 -2.96378189 8.49836916 -2.4375 6.75 C-2.06431641 5.47382813 -2.06431641 5.47382813 -1.68359375 4.171875 C-1 2 -1 2 0 0 Z " fill="#FBE9BC" transform="translate(160,135)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 0.66 3 1.32 3 2 C4.94603274 2.59070014 4.94603274 2.59070014 7 3 C7.33 2.67 7.66 2.34 8 2 C10.23074644 1.92760255 12.44492191 2.00350207 14.67578125 2.0625 C16.94194917 2.00156103 18.83164585 1.63512433 21 1 C15.80746961 5.56313277 11.15130584 7.96949388 4.3125 8.375 C-2.03278812 8.84752146 -7.27591886 11.37356601 -13 14 C-14.26263672 14.53367187 -14.26263672 14.53367187 -15.55078125 15.078125 C-20.06704172 16.99089414 -24.01455358 19.13865385 -28 22 C-28.66 21.67 -29.32 21.34 -30 21 C-29.175 20.5875 -28.35 20.175 -27.5 19.75 C-26.675 19.1725 -25.85 18.595 -25 18 C-25 16.68 -25 15.36 -25 14 C-23.68 14 -22.36 14 -21 14 C-19.66666667 11 -19.66666667 11 -21 8 C-20.34 7.34 -19.68 6.68 -19 6 C-17.5393715 8.64738916 -17 9.89448334 -17 13 C-16.01 13 -15.02 13 -14 13 C-14 12.34 -14 11.68 -14 11 C-10.535 10.505 -10.535 10.505 -7 10 C-7 8.68 -7 7.36 -7 6 C-6.34 6 -5.68 6 -5 6 C-5 5.34 -5 4.68 -5 4 C-4.34 4 -3.68 4 -3 4 C-3 4.66 -3 5.32 -3 6 C-2.34 6 -1.68 6 -1 6 C-0.67 4.02 -0.34 2.04 0 0 Z " fill="#3077CD" transform="translate(94,53)"/>
<path d="M0 0 C0.66 1.32 1.32 2.64 2 4 C2.66 4 3.32 4 4 4 C7.30934916 10.61869832 5.00003948 21.1355429 3 28 C1.4453988 32.38114883 -0.23416255 36.69998362 -2 41 C-3.06671952 37.79984144 -2.94845472 36.11455706 -2.5625 32.8125 C-2.46066406 31.91144531 -2.35882813 31.01039062 -2.25390625 30.08203125 C-2.17011719 29.39496094 -2.08632812 28.70789063 -2 28 C-3.65 28.66 -5.3 29.32 -7 30 C-6.65066406 29.26394531 -6.30132812 28.52789062 -5.94140625 27.76953125 C-5.48636719 26.79371094 -5.03132812 25.81789063 -4.5625 24.8125 C-4.11003906 23.84957031 -3.65757812 22.88664062 -3.19140625 21.89453125 C-1.12720459 16.87953641 -0.7900003 12.07571889 -0.4375 6.6875 C-0.35371094 5.43324219 -0.26992187 4.17898437 -0.18359375 2.88671875 C-0.12300781 1.93410156 -0.06242188 0.98148438 0 0 Z " fill="#ED3003" transform="translate(179,27)"/>
<path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C1.828125 4.1015625 1.828125 4.1015625 1.25 6.625 C1.06953125 7.44226563 0.8890625 8.25953125 0.703125 9.1015625 C0.16295074 11.32828083 -0.42900439 13.54248771 -1.04296875 15.75 C-2.18114664 20.27813118 -2.40540776 24.72353694 -2.5625 29.375 C-2.87759516 37.75519031 -2.87759516 37.75519031 -4 40 C-4.40924291 44.5873275 -4.17008158 48.87354066 -2.9375 53.3125 C-2.04697997 56.81521211 -1.98033749 57.7698803 -3 61 C-7.30216672 49.12601984 -8.27969412 38.52408128 -8 26 C-7.67 26 -7.34 26 -7 26 C-6.82984375 24.96101563 -6.6596875 23.92203125 -6.484375 22.8515625 C-5.10976165 14.82158572 -3.51471978 7.42194633 0 0 Z " fill="#A0352C" transform="translate(32,117)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 1.32 3 2.64 3 4 C3.66 4 4.32 4 5 4 C6.85947258 8.02377673 7.42689457 11.59056122 7.75 16 C7.84796875 17.19625 7.9459375 18.3925 8.046875 19.625 C7.99995166 23.00348041 7.58814384 25.04126627 6 28 C5.34 28.33 4.68 28.66 4 29 C3.59270772 31.32156597 3.25561323 33.6568787 3 36 C2.67 36 2.34 36 2 36 C0.65541192 27.3841929 -0.23733588 18.83391418 -0.6875 10.125 C-0.73575928 9.2390918 -0.78401855 8.35318359 -0.83374023 7.44042969 C-0.93302529 5.29520089 -0.97236088 3.14734724 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#610808" transform="translate(193,163)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 1.66 2 2.32 2 3 C3.98 2.67 5.96 2.34 8 2 C8.125 8.75 8.125 8.75 7 11 C8.65 11 10.3 11 12 11 C12 11.99 12 12.98 12 14 C12.99 13.67 13.98 13.34 15 13 C15 13.66 15 14.32 15 15 C15.99 15.33 16.98 15.66 18 16 C15.02588876 17.23921302 12.14737182 18.30058404 9 19 C9.33 17.68 9.66 16.36 10 15 C6.7 15.33 3.4 15.66 0 16 C-0.33 15.01 -0.66 14.02 -1 13 C-1.45375 13.495 -1.9075 13.99 -2.375 14.5 C-4 16 -4 16 -6 16 C-5.64828362 7.7698368 -5.64828362 7.7698368 -3 4.625 C-2.34 4.08875 -1.68 3.5525 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#101947" transform="translate(227,73)"/>
<path d="M0 0 C1 3 1 3 0.171875 5.3125 C-4.69294685 14.50754789 -11.60210294 23.11630649 -21 28 C-23 28 -23 28 -24.625 26.5 C-25.07875 26.005 -25.5325 25.51 -26 25 C-25.649375 24.38125 -25.29875 23.7625 -24.9375 23.125 C-24.628125 22.42375 -24.31875 21.7225 -24 21 C-24.33 20.34 -24.66 19.68 -25 19 C-24.21689453 18.70609375 -24.21689453 18.70609375 -23.41796875 18.40625 C-13.81781351 14.50566153 -5.41594125 8.96431656 0 0 Z " fill="#FBEC20" transform="translate(174,40)"/>
<path d="M0 0 C0 1.32 0 2.64 0 4 C-2.75 6.4375 -2.75 6.4375 -4.296875 7.55859375 C-6.17206427 9.03069867 -6.17206427 9.03069867 -7.8125 11.484375 C-10.40865475 14.46995296 -12.57569997 15.41466847 -16.25 16.8125 C-17.86648437 17.44091797 -17.86648437 17.44091797 -19.515625 18.08203125 C-20.33546875 18.38496094 -21.1553125 18.68789062 -22 19 C-22 19.33 -22 19.66 -22 20 C-24.60364409 20.24867947 -27.20589894 20.47457902 -29.8125 20.6875 C-30.55048828 20.76033203 -31.28847656 20.83316406 -32.04882812 20.90820312 C-34.20703125 21.07421875 -34.20703125 21.07421875 -38 21 C-39.73706055 19.49536133 -39.73706055 19.49536133 -41 18 C-40.410979 17.87471924 -39.82195801 17.74943848 -39.21508789 17.62036133 C-36.49409295 17.0326648 -33.77852417 16.42274017 -31.0625 15.8125 C-29.67321289 15.51762695 -29.67321289 15.51762695 -28.25585938 15.21679688 C-19.5555512 13.23251606 -12.54727715 9.91429325 -6.0625 3.6875 C-2.19778189 0 -2.19778189 0 0 0 Z " fill="#F48218" transform="translate(132,48)"/>
<path d="M0 0 C0.66 3.3 1.32 6.6 2 10 C2.99 10.33 3.98 10.66 5 11 C5 10.34 5 9.68 5 9 C5.99 9.33 6.98 9.66 8 10 C8.66 8.68 9.32 7.36 10 6 C12.0245738 7.93254772 13.42105792 9.63158688 15 12 C15 13.32 15 14.64 15 16 C12.54157451 18.03698112 10.9796975 19.03905207 7.74609375 18.91015625 C3.85916618 17.6218858 1.29938913 15.29749834 -1.75 12.625 C-2.33910156 12.13 -2.92820312 11.635 -3.53515625 11.125 C-7.86624765 7.40125705 -7.86624765 7.40125705 -9 4 C-3.375 0 -3.375 0 0 0 Z M11 9 C12 12 12 12 12 12 Z " fill="#2976CF" transform="translate(54,56)"/>
<path d="M0 0 C0.66 0.99 1.32 1.98 2 3 C3.03425441 4.40133435 4.07635312 5.79690305 5.125 7.1875 C5.66382813 7.90292969 6.20265625 8.61835938 6.7578125 9.35546875 C7.16773438 9.89816406 7.57765625 10.44085938 8 11 C7.01 12.32 6.02 13.64 5 15 C4.34 14.67 3.68 14.34 3 14 C3 13.01 3 12.02 3 11 C2.1028125 11.2784375 2.1028125 11.2784375 1.1875 11.5625 C-1 12 -1 12 -4 11 C-4.66 11.66 -5.32 12.32 -6 13 C-6.5775 13.12375 -7.155 13.2475 -7.75 13.375 C-10.24896695 13.9394842 -10.24896695 13.9394842 -12.9375 16 C-15.84792293 17.90068436 -17.56311498 18.81422243 -21 19 C-21.99 18.34 -22.98 17.68 -24 17 C-23.38511719 16.54109375 -22.77023438 16.0821875 -22.13671875 15.609375 C-21.32847656 14.99578125 -20.52023438 14.3821875 -19.6875 13.75 C-18.88699219 13.14671875 -18.08648437 12.5434375 -17.26171875 11.921875 C-15.11450388 10.09729864 -13.58398701 8.31702954 -12 6 C-10.9275 6.2475 -9.855 6.495 -8.75 6.75 C-5.01368147 7.40427873 -5.01368147 7.40427873 -2.625 5.25 C-0.83769846 3.01157177 -0.83769846 3.01157177 0 0 Z " fill="#F8EACC" transform="translate(134,158)"/>
<path d="M0 0 C0 0.33 0 0.66 0 1 C-1.65 1.33 -3.3 1.66 -5 2 C-4.34 2.33 -3.68 2.66 -3 3 C-3.33 4.65 -3.66 6.3 -4 8 C-3.34 8 -2.68 8 -2 8 C-2 7.01 -2 6.02 -2 5 C0.86724686 5.57344937 1.8614515 5.8614515 4 8 C7.59679066 7.67673447 7.59679066 7.67673447 11 7 C11.33 7.66 11.66 8.32 12 9 C12.66 8.34 13.32 7.68 14 7 C14 7.66 14 8.32 14 9 C14.66 9 15.32 9 16 9 C16 9.66 16 10.32 16 11 C14.02 11.99 14.02 11.99 12 13 C12.66 14.32 13.32 15.64 14 17 C13.01 16.566875 13.01 16.566875 12 16.125 C8.9322356 14.89393398 8.9322356 14.89393398 5.3125 14.1875 C-1.15728336 12.60080408 -7.44442663 10.42486438 -11.125 4.6875 C-11.41375 3.800625 -11.7025 2.91375 -12 2 C-8.15820154 -2.0018734 -5.05897886 -0.92747946 0 0 Z " fill="#0D0E3A" transform="translate(77,254)"/>
<path d="M0 0 C0.99229614 0.24447876 0.99229614 0.24447876 2.00463867 0.49389648 C5.66071768 1.11163646 9.23143726 1.12421637 12.92578125 1.09765625 C13.67337204 1.0962413 14.42096283 1.09482635 15.19120789 1.09336853 C17.56501365 1.08779764 19.93872303 1.0752506 22.3125 1.0625 C23.92773301 1.05748123 25.5429675 1.05291899 27.15820312 1.04882812 C31.10550555 1.03783775 35.05273647 1.02059332 39 1 C36.63758827 4.30464532 34.71671395 6.23013621 31 8 C28.1875 8.1875 28.1875 8.1875 26 8 C25.67 8.66 25.34 9.32 25 10 C21.9375 10.625 21.9375 10.625 19 11 C18.67 9.68 18.34 8.36 18 7 C15.16032769 7 12.76264289 7.40267181 10 8 C9.67 6.35 9.34 4.7 9 3 C6.03 2.67 3.06 2.34 0 2 C0 1.34 0 0.68 0 0 Z " fill="#2D1519" transform="translate(206,234)"/>
<path d="M0 0 C1 3 1 3 0 5.25 C-1.30188312 8.83017858 -0.77878588 11.31846673 0 15 C1.96822886 16.96822886 5.34808709 16.66248381 8 17 C8.33 16.01 8.66 15.02 9 14 C10.6436814 12.31066078 12.3142876 10.64740076 14 9 C14.88562642 7.92533636 15.7608323 6.84199373 16.625 5.75 C19 3 19 3 22 2 C21.59394531 2.74443359 21.59394531 2.74443359 21.1796875 3.50390625 C19.2619329 7.56167178 17.85509204 11.83027668 16.38671875 16.06835938 C14.84784011 20.32220265 13.25984111 23.73376705 10 27 C9.01 27 8.02 27 7 27 C7.66 25.35 8.32 23.7 9 22 C8.34 22 7.68 22 7 22 C7.33 21.01 7.66 20.02 8 19 C7.38511719 19.04640625 6.77023438 19.0928125 6.13671875 19.140625 C-0.42743539 19.43376107 -0.42743539 19.43376107 -3.0625 17.4375 C-4.63973186 13.33669716 -4.76335835 9.88691609 -3.09765625 5.76953125 C-2.12172188 3.80724329 -1.10194973 1.89397609 0 0 Z " fill="#EB4C13" transform="translate(211,87)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C0.979375 0.60328125 0.95875 1.2065625 0.9375 1.828125 C1.0046369 4.42968004 1.17742067 6.52373786 2 9 C4.45237931 10.97538375 7.02049588 12.02945538 10 13 C10.33 12.34 10.66 11.68 11 11 C13.05680002 14.08520003 13.29466814 14.91273504 13.3125 18.4375 C13.32925781 19.19933594 13.34601562 19.96117187 13.36328125 20.74609375 C12.89308994 23.66330223 12.1527229 24.97094416 10 27 C7.30078125 27.390625 7.30078125 27.390625 4.3125 27.25 C3.31863281 27.21390625 2.32476562 27.1778125 1.30078125 27.140625 C0.16189453 27.07101563 0.16189453 27.07101563 -1 27 C-1 26.67 -1 26.34 -1 26 C0.98 25.67 2.96 25.34 5 25 C5 22.36 5 19.72 5 17 C4.21625 16.896875 3.4325 16.79375 2.625 16.6875 C0 16 0 16 -2 13 C-2.43322688 8.23450436 -1.43507302 4.4846032 0 0 Z " fill="#F09311" transform="translate(39,200)"/>
<path d="M0 0 C2.4375 0.75 2.4375 0.75 5 2 C5.8125 4.125 5.8125 4.125 6 6 C8.31 6.33 10.62 6.66 13 7 C12.67 11.62 12.34 16.24 12 21 C10.68 19.68 9.36 18.36 8 17 C8 16.34 8 15.68 8 15 C5.03 14.67 2.06 14.34 -1 14 C-1 15.65 -1 17.3 -1 19 C-1.33 19 -1.66 19 -2 19 C-2.05451714 16.95863605 -2.09302485 14.91684144 -2.125 12.875 C-2.14820312 11.73804688 -2.17140625 10.60109375 -2.1953125 9.4296875 C-1.99672109 5.94242233 -1.2524801 3.2446138 0 0 Z " fill="#581E2C" transform="translate(74,135)"/>
<path d="M0 0 C4.77378396 1.5587866 7.25661538 3.02716339 10.375 7 C13.53668504 10.9144672 16.24166523 12.24667205 21.08203125 13.4296875 C23 14 23 14 25 16 C24.67 16.99 24.34 17.98 24 19 C23.443125 18.360625 22.88625 17.72125 22.3125 17.0625 C19.77933439 14.80319013 18.31658576 14.36850953 15 14 C15.33 16.64 15.66 19.28 16 22 C11.46298506 23.45184478 7.81938524 24.23509196 3 24 C3.1875 21.625 3.1875 21.625 4 19 C6.5625 17.6875 6.5625 17.6875 9 17 C8.34414811 13.39007621 8.34414811 13.39007621 7 10 C6.01 9.34 5.02 8.68 4 8 C4.99 8 5.98 8 7 8 C4.74259377 5.66475218 2.7194239 3.81294927 0 2 C0 1.34 0 0.68 0 0 Z " fill="#FEA53F" transform="translate(244,119)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C2.34 2.32 1.68 3.64 1 5 C1.66 5 2.32 5 3 5 C3.99 5 4.98 5 6 5 C6.47545004 14.45617311 5.10435896 22.83100739 3 32 C2.34 32 1.68 32 1 32 C1 26.72 1 21.44 1 16 C0.34 16 -0.32 16 -1 16 C-1 17.98 -1 19.96 -1 22 C-1.66 22 -2.32 22 -3 22 C-3.46530864 14.21038876 -2.15721701 7.47321608 0 0 Z " fill="#171540" transform="translate(274,146)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C7.06652192 2.30368736 8.06421005 4.64018187 9 7 C8 9 8 9 7 10 C7.185625 10.556875 7.37125 11.11375 7.5625 11.6875 C8.16569176 14.87579931 7.15025625 17.02286618 6 20 C5.67 18.68 5.34 17.36 5 16 C2.69 16 0.38 16 -2 16 C-2 16.66 -2 17.32 -2 18 C-2.66 18 -3.32 18 -4 18 C-4 19.32 -4 20.64 -4 22 C-3.34 22.33 -2.68 22.66 -2 23 C-3.485 25.475 -3.485 25.475 -5 28 C-5.99 26.68 -6.98 25.36 -8 24 C-7.01 24 -6.02 24 -5 24 C-5.10699219 23.41992188 -5.21398437 22.83984375 -5.32421875 22.2421875 C-6.15081863 16.85595601 -6.05662431 13.76833393 -3 9 C-2.67 9.66 -2.34 10.32 -2 11 C-1.01 11 -0.02 11 1 11 C0.67 7.37 0.34 3.74 0 0 Z " fill="#122C72" transform="translate(239,45)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.32290808 7.7378343 1.53007672 14.92365355 -2 22 C-2.66 22.66 -3.32 23.32 -4 24 C-4.33 23.01 -4.66 22.02 -5 21 C-7.31 23.64 -9.62 26.28 -12 29 C-12 25.55639368 -11.20408468 24.25204608 -9.5 21.3125 C-9.0359375 20.50425781 -8.571875 19.69601563 -8.09375 18.86328125 C-7.55234375 17.94095703 -7.55234375 17.94095703 -7 17 C-7.66 17 -8.32 17 -9 17 C-9 17.66 -9 18.32 -9 19 C-12.61973402 20.31626692 -15.09567131 21 -19 21 C-19 20.34 -19 19.68 -19 19 C-17.23084525 18.01780373 -15.45961431 17.03934641 -13.6875 16.0625 C-12.70136719 15.51722656 -11.71523437 14.97195312 -10.69921875 14.41015625 C-8 13 -8 13 -5 12 C-2.69515066 8.39867291 -1.46469895 3.99463349 0 0 Z " fill="#F55706" transform="translate(204,51)"/>
<path d="M0 0 C1.0415625 0.13277344 2.083125 0.26554688 3.15625 0.40234375 C13.09558205 1.63760903 22.9979906 2.48845712 33 3 C29.33202576 5.44531616 27.48488996 5.23819639 23.125 5.1875 C21.30355469 5.17783203 21.30355469 5.17783203 19.4453125 5.16796875 C16.50225573 5.02448639 13.85863082 4.67933242 11 4 C11 5.98 11 7.96 11 10 C8.03 10 5.06 10 2 10 C2 11.32 2 12.64 2 14 C-2.05281712 12.77472971 -5.44360764 11.30119506 -9 9 C-8.67 8.34 -8.34 7.68 -8 7 C-4.535 8.98 -4.535 8.98 -1 11 C-1 10.01 -1 9.02 -1 8 C-0.34 8 0.32 8 1 8 C0.67 5.36 0.34 2.72 0 0 Z " fill="#A78086" transform="translate(204,220)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C1.66 3 2.32 3 3 3 C2.87431641 4.04800781 2.87431641 4.04800781 2.74609375 5.1171875 C2.64425781 6.02726562 2.54242188 6.93734375 2.4375 7.875 C2.33308594 8.77992187 2.22867188 9.68484375 2.12109375 10.6171875 C1.80325148 13.01653057 1.80325148 13.01653057 3 15 C3.13589466 17.89596198 3.21278694 20.76660939 3.23828125 23.6640625 C3.246353 24.53010101 3.25442474 25.39613953 3.26274109 26.28842163 C3.27658795 28.12601721 3.28730741 29.96363858 3.29516602 31.80126953 C3.31230529 34.5932813 3.35617602 37.38408601 3.40039062 40.17578125 C3.41052427 41.96353298 3.41903827 43.75129477 3.42578125 45.5390625 C3.44328934 46.36644928 3.46079742 47.19383606 3.47883606 48.04629517 C3.457837 53.74379851 2.35740538 58.30399568 -1 63 C-2.485 63.99 -2.485 63.99 -4 65 C-3.67 62.69 -3.34 60.38 -3 58 C-2.01 58 -1.02 58 0 58 C0.19561869 55.9174133 0.38119313 53.83388144 0.5625 51.75 C0.66691406 50.58984375 0.77132812 49.4296875 0.87890625 48.234375 C0.98198087 45.48128523 0.86213473 43.580018 0 41 C-0.66 41.99 -1.32 42.98 -2 44 C-2.92188461 41.23434618 -3.11785222 39.61716298 -3.09765625 36.76953125 C-3.09282227 35.56586914 -3.09282227 35.56586914 -3.08789062 34.33789062 C-3.07532227 33.08782227 -3.07532227 33.08782227 -3.0625 31.8125 C-3.05798828 30.96751953 -3.05347656 30.12253906 -3.04882812 29.25195312 C-3.03705403 27.16793845 -3.0191189 25.08396023 -3 23 C-2.525625 23.639375 -2.05125 24.27875 -1.5625 24.9375 C-0.16261274 26.88293306 -0.16261274 26.88293306 1 28 C1.33 24.04 1.66 20.08 2 16 C1.34 16 0.68 16 0 16 C0 10.72 0 5.44 0 0 Z " fill="#E6B563" transform="translate(177,116)"/>
<path d="M0 0 C-0.51949219 0.46148437 -1.03898437 0.92296875 -1.57421875 1.3984375 C-7.51404317 6.95398493 -13.13590933 13.46675819 -13.4375 22 C-13.28926626 25.10917714 -13.28926626 25.10917714 -11 27 C-9.68252676 27.69748583 -8.35085807 28.36959957 -7 29 C-13.36 29.48 -13.36 29.48 -16 27.5 C-18.48442104 21.28894741 -15.34873525 14.82077865 -13 9 C-13 8.67 -13 8.34 -13 8 C-13.99 8.33 -14.98 8.66 -16 9 C-16 9.66 -16 10.32 -16 11 C-20.38461538 14 -20.38461538 14 -23 14 C-24.33783393 13.68521554 -25.67203709 13.35412344 -27 13 C-26.46632812 12.72027344 -25.93265625 12.44054687 -25.3828125 12.15234375 C-20.08169822 9.3000141 -15.20532431 6.12189749 -10.359375 2.55078125 C-4.29860724 -1.43286908 -4.29860724 -1.43286908 0 0 Z " fill="#DF7926" transform="translate(226,75)"/>
<path d="M0 0 C0 4.73342238 -1.19550689 9.09292589 -4.51171875 12.59765625 C-8.55968518 15.71777419 -11.9015931 16.42282186 -17 17 C-17.99 17.7734375 -17.99 17.7734375 -19 18.5625 C-21.93660812 20.67318708 -24.48813597 20.20260754 -28 20 C-28 20.66 -28 21.32 -28 22 C-32.62 22.33 -37.24 22.66 -42 23 C-42 22.67 -42 22.34 -42 22 C-40.94683594 21.731875 -39.89367187 21.46375 -38.80859375 21.1875 C-23.59111401 17.13045276 -11.14823416 11.33185214 0 0 Z " fill="#F0CDA1" transform="translate(167,179)"/>
<path d="M0 0 C3.13238771 0.4176517 6.23685431 0.84417778 9.33398438 1.4765625 C16.79043349 2.99389611 24.09290186 3.42031684 31.6875 3.625 C33.47317383 3.68300781 33.47317383 3.68300781 35.29492188 3.7421875 C38.19647053 3.83540995 41.09802966 3.92121348 44 4 C44 4.33 44 4.66 44 5 C39.38 5.66 34.76 6.32 30 7 C31.32 7.66 32.64 8.32 34 9 C30.62838225 8.76558279 27.25731303 8.52613382 23.88671875 8.27734375 C21.47390667 8.10517324 19.05986559 7.94856075 16.64453125 7.81640625 C10.83416674 7.45555979 6.04923649 7.0295419 1 4 C0.0625 1.8125 0.0625 1.8125 0 0 Z " fill="#F8D7B4" transform="translate(85,210)"/>
<path d="M0 0 C0.226875 0.61875 0.45375 1.2375 0.6875 1.875 C1.8614881 4.11082178 1.8614881 4.11082178 4 5.3125 C8.42605613 6.32680453 12.54229835 5.64052412 17 5 C9.85714286 14.80952381 9.85714286 14.80952381 7 17 C4.46808335 16.92327525 3.39409865 16.34483632 1.5 14.6875 C1.005 14.130625 0.51 13.57375 0 13 C-0.721875 12.278125 -1.44375 11.55625 -2.1875 10.8125 C-2.785625 10.214375 -3.38375 9.61625 -4 9 C-2.94124926 5.59687262 -1.99097846 2.98646769 0 0 Z " fill="#B62214" transform="translate(79,126)"/>
<path d="M0 0 C2.40311598 2.40311598 2.23338606 3.0960927 2.375 6.375 C2.67017504 9.39933445 2.83421672 10.75464075 4.5625 13.3125 C7.86638256 15.59980331 11.34944099 17.33421094 15 19 C15 19.66 15 20.32 15 21 C17.97 21.33 20.94 21.66 24 22 C24 22.99 24 23.98 24 25 C22.68 25.33 21.36 25.66 20 26 C20 25.34 20 24.68 20 24 C18.73542969 24.05220703 18.73542969 24.05220703 17.4453125 24.10546875 C16.34960938 24.13253906 15.25390625 24.15960938 14.125 24.1875 C12.48917969 24.23970703 12.48917969 24.23970703 10.8203125 24.29296875 C9.88960937 24.19628906 8.95890625 24.09960938 8 24 C7.34 23.01 6.68 22.02 6 21 C5.34 21 4.68 21 4 21 C0.49927569 16.22628503 -1.14236835 12.83405446 -1.125 6.9375 C-1.12757813 6.05964844 -1.13015625 5.18179688 -1.1328125 4.27734375 C-1 2 -1 2 0 0 Z " fill="#0F050E" transform="translate(191,215)"/>
<path d="M0 0 C2.49118953 3.7367843 2.2065226 5.74451819 2.125 10.1875 C2.10695312 11.45980469 2.08890625 12.73210938 2.0703125 14.04296875 C2.03550781 15.50669922 2.03550781 15.50669922 2 17 C3.32 17.66 4.64 18.32 6 19 C6 18.34 6 17.68 6 17 C6.66 17 7.32 17 8 17 C8 16.01 8 15.02 8 14 C8.99 13.67 9.98 13.34 11 13 C11 11.68 11 10.36 11 9 C11.99 8.67 12.98 8.34 14 8 C14.66 7.01 15.32 6.02 16 5 C17.32 5.33 18.64 5.66 20 6 C19.67 6.99 19.34 7.98 19 9 C18.34 8.67 17.68 8.34 17 8 C16.34 10.97 15.68 13.94 15 17 C14.34 17 13.68 17 13 17 C13 18.32 13 19.64 13 21 C7.9621232 23.21175079 5.12362874 22.90880287 0 21 C-1 20 -1 20 -1.1328125 17.8125 C-1.11608846 11.79184664 -0.78298882 5.97028975 0 0 Z " fill="#14205C" transform="translate(185,37)"/>
<path d="M0 0 C2.31 0 4.62 0 7 0 C7.05437607 1.58294782 7.09296271 3.16644256 7.125 4.75 C7.14820313 5.63171875 7.17140625 6.5134375 7.1953125 7.421875 C6.98754392 10.16442028 6.49822559 11.7094924 5 14 C4.154375 14.474375 3.30875 14.94875 2.4375 15.4375 C-0.25430285 16.79062712 -0.25430285 16.79062712 -0.8125 19.6875 C-0.874375 20.450625 -0.93625 21.21375 -1 22 C-3.15059309 18.46813168 -3.3797728 15.33712007 -3.625 11.25 C-3.69976562 10.07953125 -3.77453125 8.9090625 -3.8515625 7.703125 C-3.90054688 6.81109375 -3.94953125 5.9190625 -4 5 C-3.01 4.34 -2.02 3.68 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#883936" transform="translate(205,179)"/>
<path d="M0 0 C2.35463618 1.84275875 2.98190819 2.93064804 3.75 5.875 C3.9998616 8.99827003 4.10859157 11.07015085 3 14 C0.35265737 16.13258157 -1.35949135 16.94177194 -4.75 17.25 C-7 17 -7 17 -8 16 C-8.49630649 13.52297943 -8.89954792 11.03641868 -9.3046875 8.54296875 C-10.06102997 5.77679488 -11.15264057 4.16534753 -13 2 C-12.2575 2.309375 -11.515 2.61875 -10.75 2.9375 C-6.2874552 4.90295788 -6.2874552 4.90295788 -1.75 4.0625 C-1.1725 3.711875 -0.595 3.36125 0 3 C0 2.01 0 1.02 0 0 Z " fill="#8E1517" transform="translate(143,124)"/>
<path d="M0 0 C1.67381019 0.29537827 3.33911955 0.63893903 5 1 C6.4540625 1.309375 6.4540625 1.309375 7.9375 1.625 C12.11371686 3.50003614 14.28489701 6.39911873 17 10 C16.01 10.33 15.02 10.66 14 11 C12.68 9.68 11.36 8.36 10 7 C9.67 7.66 9.34 8.32 9 9 C8.34 9 7.68 9 7 9 C7 9.66 7 10.32 7 11 C6.01 11.495 6.01 11.495 5 12 C4.67 12.99 4.34 13.98 4 15 C2.0085944 15.38133299 0.00720923 15.71325582 -2 16 C-3 15 -3 15 -3.25 12.5625 C-3.1675 11.716875 -3.085 10.87125 -3 10 C-2.01 9.34 -1.02 8.68 0 8 C0.36297936 6.02252878 0.36297936 6.02252878 0.1875 3.875 C0.125625 2.59625 0.06375 1.3175 0 0 Z " fill="#113A88" transform="translate(227,35)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 3.3 2 6.6 2 10 C-0.31 10.33 -2.62 10.66 -5 11 C-5 9.68 -5 8.36 -5 7 C-5.66 7 -6.32 7 -7 7 C-7 7.66 -7 8.32 -7 9 C-8.65 9.66 -10.3 10.32 -12 11 C-11.67 13.31 -11.34 15.62 -11 18 C-13.38564077 17.42415568 -15.66682784 16.77772405 -18 16 C-17.49513181 11.65813356 -17.04988547 8.23472702 -14 5 C-10.672309 4.27005488 -7.4004621 4.07017839 -4 4 C-4 3.34 -4 2.68 -4 2 C-2.68 2 -1.36 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#1E0D1D" transform="translate(177,229)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.55354293 4.08906277 2.10479077 8.17842693 2.65405273 12.26806641 C2.84062 13.65486698 3.0277787 15.04158814 3.21557617 16.42822266 C4.27765608 24.2734529 5.29593965 32.11311357 6 40 C3.5929732 36.9624947 2.59898915 35.14625246 2.3125 31.25 C2.21388672 30.05117187 2.21388672 30.05117187 2.11328125 28.828125 C2.07589844 28.22484375 2.03851563 27.6215625 2 27 C1.45472656 27.70576172 1.45472656 27.70576172 0.8984375 28.42578125 C-2.36863868 32.47192944 -5.06582581 35.00283426 -10 37 C-10.495 35.515 -10.495 35.515 -11 34 C-10.04287109 33.16855469 -10.04287109 33.16855469 -9.06640625 32.3203125 C-8.24011719 31.59585938 -7.41382813 30.87140625 -6.5625 30.125 C-5.73878906 29.40570313 -4.91507813 28.68640625 -4.06640625 27.9453125 C-1.76265597 25.7765646 -1.05265005 24.89195381 -0.8671875 21.75 C-0.8831949 16.11539554 -1.16141749 10.67296476 -1.9765625 5.09375 C-2 3 -2 3 0 0 Z " fill="#8A2D0C" transform="translate(184,156)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C2.65 3.33 4.3 3.66 6 4 C6 4.99 6 5.98 6 7 C5.01 7 4.02 7 3 7 C3.33 7.7425 3.66 8.485 4 9.25 C5 12 5 12 5 16 C4.01 16 3.02 16 2 16 C2 16.66 2 17.32 2 18 C1.0925 18.0825 0.185 18.165 -0.75 18.25 C-4.40077839 19.09248732 -5.63384583 20.17881618 -8 23 C-9.85776765 19.86501708 -10.20140476 17.62528568 -10 14 C-8.68 14 -7.36 14 -6 14 C-5.67 12.68 -5.34 11.36 -5 10 C-3.68 10 -2.36 10 -1 10 C-0.67 10.99 -0.34 11.98 0 13 C0 8.71 0 4.42 0 0 Z " fill="#F4761C" transform="translate(210,161)"/>
<path d="M0 0 C1.98510058 1.63707833 2.91847304 2.50096147 3.34057617 5.0847168 C3.32486572 5.86500244 3.30915527 6.64528809 3.29296875 7.44921875 C3.28330078 8.29677734 3.27363281 9.14433594 3.26367188 10.01757812 C3.23853516 10.89865234 3.21339844 11.77972656 3.1875 12.6875 C3.17396484 13.58017578 3.16042969 14.47285156 3.14648438 15.39257812 C3.11114079 17.59566166 3.06180493 19.79752582 3 22 C-1.7109375 22.1640625 -1.7109375 22.1640625 -4.3125 20.6875 C-4.869375 20.130625 -5.42625 19.57375 -6 19 C-6 18.01 -6 17.02 -6 16 C-5.34 16 -4.68 16 -4 16 C-4 15.01 -4 14.02 -4 13 C-5.32 13 -6.64 13 -8 13 C-8 11.35 -8 9.7 -8 8 C-7.236875 7.979375 -6.47375 7.95875 -5.6875 7.9375 C-2.58610882 7.20339051 -2.58610882 7.20339051 -1.1875 3.4375 C-0.795625 2.303125 -0.40375 1.16875 0 0 Z " fill="#2B1D48" transform="translate(20,137)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.09474609 1.24716797 1.09474609 1.24716797 1.19140625 2.51953125 C1.5697083 8.6093873 1.5697083 8.6093873 4.69140625 13.46484375 C6.81934707 14.39133684 6.81934707 14.39133684 10 15 C9.67 13.68 9.34 12.36 9 11 C9.99 11 10.98 11 12 11 C12.66 9.68 13.32 8.36 14 7 C14.99 8.485 14.99 8.485 16 10 C14.48547823 14.7118455 13.05840452 17.25075823 9 20 C7.7483533 22.08334635 7.7483533 22.08334635 7 24 C3.59485479 22.5909744 1.93261286 21.13714997 0 18 C-1.15511051 12.07593322 -1.47168466 5.88673863 0 0 Z " fill="#E63D0A" transform="translate(22,188)"/>
<path d="M0 0 C6.75 0.75 6.75 0.75 9 3 C13.51470234 4.90121498 13.51470234 4.90121498 18.0625 4.0625 C18.701875 3.711875 19.34125 3.36125 20 3 C22.9375 3.25 22.9375 3.25 26 4 C26.86625 4.20625 27.7325 4.4125 28.625 4.625 C32.17059104 6.6777106 33.18294863 9.36589726 35 13 C34.45988281 12.66742188 33.91976562 12.33484375 33.36328125 11.9921875 C30.42977635 10.76060032 28.35146474 10.93816768 25.1875 11.125 C19.33702095 11.23150144 16.76962193 10.27326995 12 7 C9.66875071 5.99515117 7.33556463 4.99477753 5 4 C2.0625 2.375 2.0625 2.375 0 1 C0 0.67 0 0.34 0 0 Z " fill="#FBEA6E" transform="translate(138,89)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C3 1.66 3 2.32 3 3 C3.99 3.33 4.98 3.66 6 4 C6.66 3.34 7.32 2.68 8 2 C8.33 3.65 8.66 5.3 9 7 C10.32 7.33 11.64 7.66 13 8 C11.61198929 11.35435922 10.11371 13.11290303 7 15 C6.01 15 5.02 15 4 15 C3.67 14.34 3.34 13.68 3 13 C2.01 13 1.02 13 0 13 C-0.33 11.02 -0.66 9.04 -1 7 C-1.99 7 -2.98 7 -4 7 C-4.33 5.35 -4.66 3.7 -5 2 C-3.68 2 -2.36 2 -1 2 C-1 3.32 -1 4.64 -1 6 C-0.34 5.67 0.32 5.34 1 5 C0.67 3.35 0.34 1.7 0 0 Z " fill="#09061A" transform="translate(150,238)"/>
<path d="M0 0 C-1.89329975 18.38493707 -4.37100523 36.70700006 -7 55 C-7.33 55 -7.66 55 -8 55 C-8.02736707 53.60427948 -8.04655989 52.20839779 -8.0625 50.8125 C-8.07410156 50.03519531 -8.08570313 49.25789063 -8.09765625 48.45703125 C-8 46 -8 46 -7.51367188 43.69140625 C-6.98492448 40.92101113 -6.79375036 38.29733075 -6.68359375 35.48046875 C-6.64169922 34.45888672 -6.59980469 33.43730469 -6.55664062 32.38476562 C-6.51732422 31.32966797 -6.47800781 30.27457031 -6.4375 29.1875 C-6.39431641 28.11306641 -6.35113281 27.03863281 -6.30664062 25.93164062 C-6.20089017 23.28787918 -6.09879767 20.6440289 -6 18 C-6.66 18 -7.32 18 -8 18 C-8 17.01 -8 16.02 -8 15 C-7.34 15 -6.68 15 -6 15 C-5.87882812 14.00097656 -5.75765625 13.00195312 -5.6328125 11.97265625 C-5.46523438 10.68230469 -5.29765625 9.39195312 -5.125 8.0625 C-4.88136719 6.13083984 -4.88136719 6.13083984 -4.6328125 4.16015625 C-4.31957031 2.59587891 -4.31957031 2.59587891 -4 1 C-2 0 -2 0 0 0 Z " fill="#741C1D" transform="translate(267,155)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.49729503 6.09186416 0.55947033 9.18990496 -3 14 C-5.75 14.9375 -5.75 14.9375 -8 15 C-8 15.66 -8 16.32 -8 17 C-9.41543415 17.19658808 -10.83244031 17.38187546 -12.25 17.5625 C-13.03890625 17.66691406 -13.8278125 17.77132812 -14.640625 17.87890625 C-17.04125113 18.00211719 -18.74920877 17.83159765 -21 17 C-21.33 16.34 -21.66 15.68 -22 15 C-21.31292969 14.76925781 -20.62585938 14.53851563 -19.91796875 14.30078125 C-14.17785216 12.3294402 -14.17785216 12.3294402 -9.875 8.25 C-9.58625 7.5075 -9.2975 6.765 -9 6 C-6.03 6.495 -6.03 6.495 -3 7 C-3 6.34 -3 5.68 -3 5 C-2.34 5 -1.68 5 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#165ABF" transform="translate(172,27)"/>
<path d="M0 0 C1.28132813 0.10183594 2.56265625 0.20367187 3.8828125 0.30859375 C4.87023437 0.39238281 5.85765625 0.47617188 6.875 0.5625 C6.875 1.5525 6.875 2.5425 6.875 3.5625 C6.215 3.5625 5.555 3.5625 4.875 3.5625 C4.875 4.2225 4.875 4.8825 4.875 5.5625 C3.29532193 6.23778223 1.71108097 6.90239694 0.125 7.5625 C-1.19757813 8.119375 -1.19757813 8.119375 -2.546875 8.6875 C-5.125 9.5625 -5.125 9.5625 -9.125 9.5625 C-9.125 10.2225 -9.125 10.8825 -9.125 11.5625 C-11.435 11.2325 -13.745 10.9025 -16.125 10.5625 C-15.795 9.5725 -15.465 8.5825 -15.125 7.5625 C-13.475 7.5625 -11.825 7.5625 -10.125 7.5625 C-9.939375 5.8609375 -9.939375 5.8609375 -9.75 4.125 C-9.54375 2.949375 -9.3375 1.77375 -9.125 0.5625 C-6.07230154 -0.96384923 -3.36654311 -0.27544444 0 0 Z " fill="#F4D2B7" transform="translate(154.125,171.4375)"/>
<path d="M0 0 C2.31 0 4.62 0 7 0 C7.33 0.99 7.66 1.98 8 3 C5.69 4.32 3.38 5.64 1 7 C0.67 6.67 0.34 6.34 0 6 C-0.66 6.66 -1.32 7.32 -2 8 C-3.97119141 8.22705078 -3.97119141 8.22705078 -6.3515625 8.1953125 C-7.20234375 8.18886719 -8.053125 8.18242188 -8.9296875 8.17578125 C-10.26386719 8.15064453 -10.26386719 8.15064453 -11.625 8.125 C-12.97078125 8.11146484 -12.97078125 8.11146484 -14.34375 8.09765625 C-16.56276586 8.0740497 -18.78125077 8.0411231 -21 8 C-21 6.68 -21 5.36 -21 4 C-20.39937744 3.9498877 -19.79875488 3.89977539 -19.17993164 3.84814453 C-16.47318501 3.61683453 -13.76793878 3.37111595 -11.0625 3.125 C-10.11697266 3.04636719 -9.17144531 2.96773438 -8.19726562 2.88671875 C-7.29814453 2.80292969 -6.39902344 2.71914062 -5.47265625 2.6328125 C-4.22367554 2.52283936 -4.22367554 2.52283936 -2.94946289 2.41064453 C-2.30614014 2.27513184 -1.66281738 2.13961914 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#F52C04" transform="translate(126,116)"/>
<path d="M0 0 C0 1.65 0 3.3 0 5 C0.639375 4.319375 1.27875 3.63875 1.9375 2.9375 C6.20086758 0.24026745 9.22173767 0.99989858 14 2 C14.73089844 2.14050781 15.46179688 2.28101563 16.21484375 2.42578125 C16.80394531 2.61527344 17.39304688 2.80476562 18 3 C18.33 3.66 18.66 4.32 19 5 C19.61875 4.34 20.2375 3.68 20.875 3 C23 1 23 1 25 1 C23.4169423 5.2742558 20.49431596 7.26531794 17 10 C16.62875 9.21625 16.2575 8.4325 15.875 7.625 C13.56693694 4.39371171 11.78383679 3.92493788 8 3 C8 4.32 8 5.64 8 7 C5.36 7 2.72 7 0 7 C0 8.32 0 9.64 0 11 C-0.66 10.67 -1.32 10.34 -2 10 C-1.67 9.34 -1.34 8.68 -1 8 C-2.32 8 -3.64 8 -5 8 C-5 8.66 -5 9.32 -5 10 C-6.98 10 -8.96 10 -11 10 C-11 9.34 -11 8.68 -11 8 C-10.401875 7.731875 -9.80375 7.46375 -9.1875 7.1875 C-6.98809359 5.99353652 -5.68250513 4.82880993 -4 3 C-1.11111111 0 -1.11111111 0 0 0 Z " fill="#F4BE5E" transform="translate(210,148)"/>
<path d="M0 0 C0.75410156 0.00451172 1.50820312 0.00902344 2.28515625 0.01367188 C4.14847127 0.02546501 6.01174555 0.04340058 7.875 0.0625 C7.875 0.7225 7.875 1.3825 7.875 2.0625 C11.175 2.0625 14.475 2.0625 17.875 2.0625 C17.875 2.3925 17.875 2.7225 17.875 3.0625 C16.82699219 3.07667969 15.77898437 3.09085937 14.69921875 3.10546875 C13.32026858 3.15237182 11.94136367 3.20061921 10.5625 3.25 C9.52706055 3.25870117 9.52706055 3.25870117 8.47070312 3.26757812 C6.1733674 3.31640458 6.1733674 3.31640458 2.875 4.0625 C0.83021032 6.46563516 0.83021032 6.46563516 -0.125 9.0625 C0.865 9.3925 1.855 9.7225 2.875 10.0625 C1.451875 10.4646875 1.451875 10.4646875 0 10.875 C-4.72263473 12.22293887 -9.42333036 13.64348502 -14.125 15.0625 C-14.125 14.0725 -14.125 13.0825 -14.125 12.0625 C-12.8875 11.7325 -11.65 11.4025 -10.375 11.0625 C-9.33085938 10.7840625 -9.33085938 10.7840625 -8.265625 10.5 C-6.125 10.0625 -6.125 10.0625 -2.125 10.0625 C-2.125 9.4025 -2.125 8.7425 -2.125 8.0625 C-3.775 7.7325 -5.425 7.4025 -7.125 7.0625 C-7.125 5.4125 -7.125 3.7625 -7.125 2.0625 C-8.115 1.7325 -9.105 1.4025 -10.125 1.0625 C-6.93675432 -0.53162284 -3.49603338 -0.03924735 0 0 Z " fill="#FBF2BE" transform="translate(107.125,99.9375)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-0.66 2 -1.32 2 -2 2 C-2 2.66 -2 3.32 -2 4 C-20.15707694 11.23205607 -36.56966635 12.75264281 -56 13 C-56 12.34 -56 11.68 -56 11 C-57.32 10.67 -58.64 10.34 -60 10 C-59.19071045 9.99589111 -58.3814209 9.99178223 -57.54760742 9.98754883 C-37.96686491 9.81394837 -17.74147232 0 0 0 Z " fill="#1A0808" transform="translate(156,220)"/>
<path d="M0 0 C2.64 0 5.28 0 8 0 C8 0.33 8 0.66 8 1 C5.69 1 3.38 1 1 1 C1 1.66 1 2.32 1 3 C5.56943249 5.62215126 9.13016568 6.44010215 14.375 6.6875 C16.24285156 6.78611328 16.24285156 6.78611328 18.1484375 6.88671875 C19.08945313 6.92410156 20.03046875 6.96148437 21 7 C21 7.66 21 8.32 21 9 C13.90215087 10.81774185 7.34918342 12.43230491 0 12 C0.66 11.34 1.32 10.68 2 10 C1.01 9.67 0.02 9.34 -1 9 C-1 7.68 -1 6.36 -1 5 C-1.66 5 -2.32 5 -3 5 C-3 5.66 -3 6.32 -3 7 C-3.66 7 -4.32 7 -5 7 C-4.34 5.35 -3.68 3.7 -3 2 C-2.01 2 -1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#32132F" transform="translate(122,200)"/>
<path d="M0 0 C0 4.74038052 -2.87074359 7.60369545 -6 11 C-9.29931052 13.49754258 -12.8769765 15.34031624 -17 16 C-17.33 15.01 -17.66 14.02 -18 13 C-17.34 12.34 -16.68 11.68 -16 11 C-16.763125 11 -17.52625 11 -18.3125 11 C-20.20833333 11 -22.10416667 11 -24 11 C-24 9.68 -24 8.36 -24 7 C-22.40671875 6.87044922 -22.40671875 6.87044922 -20.78125 6.73828125 C-12.64177615 5.96703148 -6.60257783 5.22704078 0 0 Z " fill="#EDCAB2" transform="translate(130,183)"/>
<path d="M0 0 C2.64 0.33 5.28 0.66 8 1 C8.19493195 3.27020744 8.38070418 5.54120289 8.5625 7.8125 C8.66691406 9.07707031 8.77132812 10.34164062 8.87890625 11.64453125 C9 15 9 15 8 18 C7.01 18 6.02 18 5 18 C5 16.68 5 15.36 5 14 C4.01 13.67 3.02 13.34 2 13 C0 11 0 11 -0.1953125 8.3984375 C-0.17210937 7.40070313 -0.14890625 6.40296875 -0.125 5.375 C-0.10695312 4.37210938 -0.08890625 3.36921875 -0.0703125 2.3359375 C-0.04710937 1.56507813 -0.02390625 0.79421875 0 0 Z " fill="#CA5823" transform="translate(189,144)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.67 1.33 1.34 1.66 1 2 C0.76179079 4.03270562 0.76179079 4.03270562 0.75 6.375 C0.72421875 7.16648437 0.6984375 7.95796875 0.671875 8.7734375 C0.83021743 11.04748878 0.83021743 11.04748878 2.25390625 12.71484375 C4.24143929 14.17770364 5.78284683 14.67503293 8.1875 15.1875 C9.445625 15.455625 10.70375 15.72375 12 16 C12 16.33 12 16.66 12 17 C7.05 18.485 7.05 18.485 2 20 C1.67 21.98 1.34 23.96 1 26 C0.34 25.67 -0.32 25.34 -1 25 C-0.9175 23.9275 -0.835 22.855 -0.75 21.75 C-1.04714345 17.29284827 -1.94765323 16.95696093 -5 14 C-5.49573145 10.03414842 -5.09491746 7.40424088 -3 4 C-3.99 3.67 -4.98 3.34 -6 3 C-5.195625 2.690625 -4.39125 2.38125 -3.5625 2.0625 C-1.10919595 1.23664655 -1.10919595 1.23664655 0 0 Z " fill="#F9A405" transform="translate(177,83)"/>
<path d="M0 0 C0.51304687 0.32613281 1.02609375 0.65226563 1.5546875 0.98828125 C19.1113736 11.00800614 42.42814295 8.69497967 62 9 C62 9.33 62 9.66 62 10 C56.88121597 10.07534442 51.7627694 10.12915241 46.64355469 10.16479492 C44.90977339 10.1796861 43.17602839 10.20000587 41.44238281 10.22631836 C28.02088418 10.42460817 14.08915075 10.6025895 2 4 C2.33 5.093125 2.66 6.18625 3 7.3125 C4.32985532 12.52890432 4.17693984 17.65248469 4 23 C1.90242439 19.46584949 1.41896271 16.10768301 0.875 12.0625 C0.70742187 10.85722656 0.53984375 9.65195313 0.3671875 8.41015625 C0.06077845 5.56446373 -0.07588456 2.85651173 0 0 Z " fill="#FAEBD3" transform="translate(182,137)"/>
<path d="M0 0 C0.4505519 3.07877133 0.50042912 5.21010698 -1.1953125 7.88671875 C-4.30968917 11.61927572 -7.05946178 14.73170272 -12.140625 15.1953125 C-12.83671875 15.17210938 -13.5328125 15.14890625 -14.25 15.125 C-16.10625 15.063125 -16.10625 15.063125 -18 15 C-18.0625 12.75 -18.0625 12.75 -17 10 C-13.24891461 7.73294243 -9.14160006 6.38053335 -5 5 C-4.6278958 3.67696283 -4.29369827 2.34262065 -4 1 C-2 0 -2 0 0 0 Z " fill="#9B1309" transform="translate(204,95)"/>
<path d="M0 0 C4.62 0 9.24 0 14 0 C13.67 1.65 13.34 3.3 13 5 C13.86625 5.433125 13.86625 5.433125 14.75 5.875 C16.83333333 6.91666667 18.91666667 7.95833333 21 9 C17.67424363 10.12865035 15.87796829 9.8691177 12.625 8.625 C6.23990216 6.2108464 -0.12297148 5.78654554 -6.875 5.4375 C-7.65875 5.39431641 -8.4425 5.35113281 -9.25 5.30664062 C-11.16650649 5.20146649 -13.08323333 5.10032075 -15 5 C-15 4.67 -15 4.34 -15 4 C-10.71 4 -6.42 4 -2 4 C-1.34 2.68 -0.68 1.36 0 0 Z " fill="#F7DC4E" transform="translate(119,80)"/>
<path d="M0 0 C3.63 0 7.26 0 11 0 C10.01 0.99 9.02 1.98 8 3 C8 3.99 8 4.98 8 6 C6.98421875 6.29132813 5.9684375 6.58265625 4.921875 6.8828125 C-3.89293326 9.48103098 -11.88627718 12.61906978 -20 17 C-21.58037758 17.7975508 -23.16335203 18.5899976 -24.75 19.375 C-25.8225 19.91125 -26.895 20.4475 -28 21 C-28.33 20.34 -28.66 19.68 -29 19 C-27.8125 17.5 -27.8125 17.5 -26 16 C-23.3125 15.8125 -23.3125 15.8125 -21 16 C-21 15.34 -21 14.68 -21 14 C-19.68 14 -18.36 14 -17 14 C-16.67 13.01 -16.34 12.02 -16 11 C-13.671875 9.97265625 -13.671875 9.97265625 -10.75 9.0625 C-6.40797088 7.60205036 -3.46663584 6.04643756 0 3 C2.3125 2.25 2.3125 2.25 4 2 C2.68 1.34 1.36 0.68 0 0 Z " fill="#FCFAC9" transform="translate(105,69)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.23074219 1.16015625 1.46148438 2.3203125 1.69921875 3.515625 C3.62164632 12.83984856 6.00519172 21.31240579 10 30 C10.33 30.99 10.66 31.98 11 33 C8.525 33.495 8.525 33.495 6 34 C0.34344574 24.44237384 -1.74843467 13.03941145 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#462E41" transform="translate(28,155)"/>
<path d="M0 0 C-0.845625 0.495 -1.69125 0.99 -2.5625 1.5 C-7.35283413 4.68602411 -10.86163772 9.22137226 -14.34375 13.74609375 C-17.20661179 17.42560521 -19.56419995 19.49350187 -24 21 C-27.3506241 21.2260541 -30.64818176 21.17885196 -34 21 C-31.91046492 19.93361658 -29.82201253 18.92308079 -27.66796875 17.9921875 C-21.88563789 15.38786211 -18.2467608 12.60936921 -14.375 7.57421875 C-13.694375 6.79498047 -13.694375 6.79498047 -13 6 C-12.34 6 -11.68 6 -11 6 C-11 4.68 -11 3.36 -11 2 C-3.57142857 -1.57142857 -3.57142857 -1.57142857 0 0 Z " fill="#F44C06" transform="translate(143,46)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 0.66 2 1.32 2 2 C2.99 2.33 3.98 2.66 5 3 C4.01 3.66 3.02 4.32 2 5 C2.33 6.32 2.66 7.64 3 9 C2.01 9.33 1.02 9.66 0 10 C0.33 10.33 0.66 10.66 1 11 C1.04063832 12.66617115 1.042721 14.33388095 1 16 C-0.98 16.33 -2.96 16.66 -5 17 C-4.34 15.02 -3.68 13.04 -3 11 C-3.99 10.67 -4.98 10.34 -6 10 C-6.33 10.99 -6.66 11.98 -7 13 C-7.99 12.67 -8.98 12.34 -10 12 C-9.625 10.0625 -9.625 10.0625 -9 8 C-8.34 7.67 -7.68 7.34 -7 7 C-6.7834375 6.0409375 -6.7834375 6.0409375 -6.5625 5.0625 C-6 3 -6 3 -3 1 C-3 1.66 -3 2.32 -3 3 C-2.01 3 -1.02 3 0 3 C0 2.01 0 1.02 0 0 Z " fill="#961910" transform="translate(246,160)"/>
<path d="M0 0 C-0.66 0.33 -1.32 0.66 -2 1 C-2.65555119 3.52733235 -2.65555119 3.52733235 -3 6 C-5.97 5.67 -8.94 5.34 -12 5 C-12.33 4.01 -12.66 3.02 -13 2 C-15.31 3.65 -17.62 5.3 -20 7 C-20 6.01 -20 5.02 -20 4 C-20.99 4.33 -21.98 4.66 -23 5 C-23.598125 4.690625 -24.19625 4.38125 -24.8125 4.0625 C-27.72271834 2.64896538 -29.80275702 2.65986777 -33 3 C-34.7511573 4.4166747 -34.7511573 4.4166747 -36 6 C-36.66 6 -37.32 6 -38 6 C-38 4.35 -38 2.7 -38 1 C-33.55260992 0.85636328 -29.10518169 0.71398908 -24.65771484 0.57275391 C-23.1466362 0.52459332 -21.63556825 0.47609561 -20.12451172 0.42724609 C-17.94501469 0.35684705 -15.76548128 0.2876847 -13.5859375 0.21875 C-12.2767334 0.17685547 -10.9675293 0.13496094 -9.61865234 0.09179688 C-6.4102027 0.0104059 -3.20924365 -0.01737074 0 0 Z " fill="#EA9F41" transform="translate(248,147)"/>
<path d="M0 0 C7.20926451 0.18023161 11.20810607 5.20810607 16 10 C14.35 9.67 12.7 9.34 11 9 C10.67 10.98 10.34 12.96 10 15 C10.66 15 11.32 15 12 15 C12 15.66 12 16.32 12 17 C8.04 17.495 8.04 17.495 4 18 C3.67 13.05 3.34 8.1 3 3 C2.01 2.67 1.02 2.34 0 2 C0 1.34 0 0.68 0 0 Z " fill="#4A1619" transform="translate(49,206)"/>
<path d="M0 0 C-1 3 -1 3 -3.08203125 4.28125 C-9.92651717 7.33629951 -16.67091047 9.44598102 -24 11 C-24.77190674 11.17490967 -25.54381348 11.34981934 -26.33911133 11.5300293 C-29.05610908 12.00991008 -31.54413658 12.11377698 -34.30078125 12.09765625 C-35.27724609 12.09443359 -36.25371094 12.09121094 -37.25976562 12.08789062 C-38.26716797 12.07951172 -39.27457031 12.07113281 -40.3125 12.0625 C-41.33923828 12.05798828 -42.36597656 12.05347656 -43.42382812 12.04882812 C-45.94927882 12.03708184 -48.47460905 12.02065565 -51 12 C-51 11.34 -51 10.68 -51 10 C-49.05673828 9.97873047 -49.05673828 9.97873047 -47.07421875 9.95703125 C-37.69330726 9.74643392 -28.78011427 9.11566725 -19.6875 6.6875 C-18.55284302 6.38646362 -18.55284302 6.38646362 -17.39526367 6.0793457 C-12.87535703 4.78241641 -8.8557137 3.05128139 -4.73754883 0.78051758 C-3 0 -3 0 0 0 Z " fill="#D65326" transform="translate(174,191)"/>
<path d="M0 0 C1.65 0.33 3.3 0.66 5 1 C5.33 4.3 5.66 7.6 6 11 C5.34 11 4.68 11 4 11 C3.67 10.01 3.34 9.02 3 8 C2.731875 8.969375 2.46375 9.93875 2.1875 10.9375 C1.795625 11.948125 1.40375 12.95875 1 14 C0.01 14.33 -0.98 14.66 -2 15 C-2.33 14.34 -2.66 13.68 -3 13 C-4.14814997 15.29629994 -4.30769809 17.07698086 -4.5625 19.625 C-4.64628906 20.44226563 -4.73007813 21.25953125 -4.81640625 22.1015625 C-4.87699219 22.72804687 -4.93757812 23.35453125 -5 24 C-5.33 24 -5.66 24 -6 24 C-6.02707139 21.75006641 -6.04642829 19.50003905 -6.0625 17.25 C-6.07410156 15.99703125 -6.08570313 14.7440625 -6.09765625 13.453125 C-5.9586637 8.53834855 -5.9586637 8.53834855 -5 6 C-3.68662604 4.9739266 -2.35335895 3.97272675 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#451F2E" transform="translate(168,128)"/>
<path d="M0 0 C0.80308594 0.01417969 1.60617188 0.02835937 2.43359375 0.04296875 C3.64208984 0.05263672 3.64208984 0.05263672 4.875 0.0625 C6.87109375 0.23046875 6.87109375 0.23046875 7.87109375 1.23046875 C8.32984627 6.50612267 8.32984627 6.50612267 6.68359375 9.10546875 C4.31073096 10.57828014 2.61195431 10.45270069 -0.12890625 10.23046875 C-0.45890625 9.24046875 -0.78890625 8.25046875 -1.12890625 7.23046875 C-1.78890625 7.23046875 -2.44890625 7.23046875 -3.12890625 7.23046875 C-2.46890625 8.55046875 -1.80890625 9.87046875 -1.12890625 11.23046875 C-2.44890625 11.23046875 -3.76890625 11.23046875 -5.12890625 11.23046875 C-5.01481032 9.77124182 -4.88725081 8.31306277 -4.75390625 6.85546875 C-4.68429688 6.04335937 -4.6146875 5.23125 -4.54296875 4.39453125 C-3.97077533 1.40401092 -3.06605871 0.33192195 0 0 Z " fill="#4F1D46" transform="translate(231.12890625,103.76953125)"/>
<path d="M0 0 C-0.33 2.64 -0.66 5.28 -1 8 C-1.79664062 8.18175781 -2.59328125 8.36351562 -3.4140625 8.55078125 C-13.82346676 10.69918134 -13.82346676 10.69918134 -22 17 C-23.19027984 19.59915538 -23.19027984 19.59915538 -24 22 C-26.31 22 -28.62 22 -31 22 C-9.42381786 0 -9.42381786 0 0 0 Z " fill="#47BCE8" transform="translate(75,16)"/>
<path d="M0 0 C0 6.39455649 -6.87233659 12.02735366 -11.0625 16.5 C-14.82737407 20.1806342 -18.85334918 23.13818628 -23.25 26 C-23.84047119 26.38607422 -24.43094238 26.77214844 -25.03930664 27.16992188 C-28.32492853 29.22558462 -31.13946234 30.53557442 -35 31 C-34.7421875 29.10546875 -34.7421875 29.10546875 -34 27 C-32.2578125 25.98828125 -32.2578125 25.98828125 -30.125 25.3125 C-29.42632812 25.08175781 -28.72765625 24.85101563 -28.0078125 24.61328125 C-27.34523437 24.41089844 -26.68265625 24.20851562 -26 24 C-25.01 23.67 -24.02 23.34 -23 23 C-23 22.34 -23 21.68 -23 21 C-21.27734375 19.7734375 -21.27734375 19.7734375 -18.9375 18.375 C-14.02564596 15.22955404 -10.65089364 11.49029578 -7 7 C-4.66666667 4.66666667 -2.33333333 2.33333333 0 0 Z " fill="#E18234" transform="translate(186,190)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C1.66 3 2.32 3 3 3 C3.33872513 4.41538717 3.67074624 5.83237963 4 7.25 C4.185625 8.03890625 4.37125 8.8278125 4.5625 9.640625 C5 12 5 12 5 16 C3.68 16 2.36 16 1 16 C0.67 16.99 0.34 17.98 0 19 C-2.64 18.67 -5.28 18.34 -8 18 C-7.360625 17.87625 -6.72125 17.7525 -6.0625 17.625 C-5.381875 17.41875 -4.70125 17.2125 -4 17 C-3.67 16.34 -3.34 15.68 -3 15 C-2.34 14.01 -1.68 13.02 -1 12 C-1.99 11.34 -2.98 10.68 -4 10 C-4 9.01 -4 8.02 -4 7 C-4.66 7 -5.32 7 -6 7 C-6 6.34 -6 5.68 -6 5 C-4.68 5 -3.36 5 -2 5 C-1.34 3.35 -0.68 1.7 0 0 Z " fill="#2F1838" transform="translate(20,157)"/>
<path d="M0 0 C1 3 1 3 1 5 C2.65 5.33 4.3 5.66 6 6 C6 6.66 6 7.32 6 8 C7.65 8 9.3 8 11 8 C11 7.34 11 6.68 11 6 C12.32 6.33 13.64 6.66 15 7 C15 7.99 15 8.98 15 10 C13.2984375 10.4021875 13.2984375 10.4021875 11.5625 10.8125 C10.386875 11.204375 9.21125 11.59625 8 12 C7.67 12.99 7.34 13.98 7 15 C6.67 14.01 6.34 13.02 6 12 C5.34 12 4.68 12 4 12 C4.33 13.98 4.66 15.96 5 18 C4.01 18 3.02 18 2 18 C1.01 16.02 0.02 14.04 -1 12 C-0.67 11.67 -0.34 11.34 0 11 C-0.66 10.67 -1.32 10.34 -2 10 C-2 9.34 -2 8.68 -2 8 C-2.99 7.67 -3.98 7.34 -5 7 C-4.01 6.67 -3.02 6.34 -2 6 C-0.77479736 2.99152582 -0.77479736 2.99152582 0 0 Z " fill="#233C85" transform="translate(21,95)"/>
<path d="M0 0 C1.8125 1.875 1.8125 1.875 3 4 C2.67 4.99 2.34 5.98 2 7 C0.15234375 7.73046875 0.15234375 7.73046875 -2.0625 8.1875 C-2.79597656 8.34605469 -3.52945313 8.50460938 -4.28515625 8.66796875 C-4.85105469 8.77753906 -5.41695312 8.88710937 -6 9 C-6.33 10.65 -6.66 12.3 -7 14 C-9.52349243 10.87567603 -11.27256146 7.61939504 -13 4 C-12.01 4 -11.02 4 -10 4 C-10 3.34 -10 2.68 -10 2 C-9.01 2 -8.02 2 -7 2 C-7 1.34 -7 0.68 -7 0 C-3.83901159 -1.0536628 -2.99112741 -1.21514551 0 0 Z " fill="#8D1F1F" transform="translate(165,113)"/>
<path d="M0 0 C2 2 2 2 2.1875 5.8125 C2.13349297 8.13064801 1.96715005 10.16014348 1.5 12.4375 C0.5267734 17.4252863 -0.13838984 21.83910432 2.3046875 26.4765625 C3.36169398 28.02919882 4.45516413 29.55787609 5.58984375 31.0546875 C7 33 7 33 8 36 C7.34 36 6.68 36 6 36 C5.67 35.34 5.34 34.68 5 34 C4.34 35.32 3.68 36.64 3 38 C-2.46673734 30.55636133 -3.16101111 23.01662218 -3 14 C-2.67 13.67 -2.34 13.34 -2 13 C-1.60333773 10.81980521 -1.25684763 8.6303537 -0.9375 6.4375 C-0.76089844 5.23996094 -0.58429687 4.04242188 -0.40234375 2.80859375 C-0.26957031 1.88175781 -0.13679688 0.95492187 0 0 Z " fill="#611E1D" transform="translate(19,180)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 1.66 2 2.32 2 3 C2.61875 3.268125 3.2375 3.53625 3.875 3.8125 C6 5 6 5 8 8 C4.6033492 11.87430482 0.96503226 12.35816076 -4 13 C-7.67448077 13.14660091 -11.32525553 13.12363626 -15 13 C-15 12.67 -15 12.34 -15 12 C-10.545 11.505 -10.545 11.505 -6 11 C-6.66 9.68 -7.32 8.36 -8 7 C-5.36 6.01 -2.72 5.02 0 4 C0 2.68 0 1.36 0 0 Z " fill="#E2722D" transform="translate(256,147)"/>
<path d="M0 0 C1.65 1.65 3.3 3.3 5 5 C3.25 8.875 3.25 8.875 1 10 C1.99 10 2.98 10 4 10 C5.8847005 13.26681419 6.59314612 16.25694429 7 20 C6.67 20.66 6.34 21.32 6 22 C4.0625 21.6875 4.0625 21.6875 2 21 C1.67 20.01 1.34 19.02 1 18 C-1.01508358 17.26676204 -1.01508358 17.26676204 -3 17 C-2.76603516 15.95199219 -2.76603516 15.95199219 -2.52734375 14.8828125 C-2.33269531 13.97273438 -2.13804687 13.06265625 -1.9375 12.125 C-1.64166016 10.76761719 -1.64166016 10.76761719 -1.33984375 9.3828125 C-0.76797843 6.98985875 -0.76797843 6.98985875 -2 5 C-1.34 5 -0.68 5 0 5 C0 3.35 0 1.7 0 0 Z " fill="#0E2565" transform="translate(247,49)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C-0.45637671 3.95981557 -1.91500152 5.91788547 -3.375 7.875 C-3.7875 8.43058594 -4.2 8.98617187 -4.625 9.55859375 C-6.3254573 11.8350124 -7.9879119 13.9879119 -10 16 C-11.32 16 -12.64 16 -14 16 C-14 15.34 -14 14.68 -14 14 C-13.34 13.67 -12.68 13.34 -12 13 C-12.99 12.67 -13.98 12.34 -15 12 C-15 10.35 -15 8.7 -15 7 C-14.25234375 6.66226563 -13.5046875 6.32453125 -12.734375 5.9765625 C-11.74953125 5.53054687 -10.7646875 5.08453125 -9.75 4.625 C-8.77546875 4.18414062 -7.8009375 3.74328125 -6.796875 3.2890625 C-4.50688161 2.23361862 -2.24633399 1.14456065 0 0 Z " fill="#321228" transform="translate(257,217)"/>
<path d="M0 0 C3.632608 0.58404122 6.38062932 1.6057708 9.625 3.3125 C17.63609476 7.10316932 26.34538443 8.39463608 35 10 C35 10.33 35 10.66 35 11 C32.41633755 10.85879984 29.83317115 10.71221667 27.25 10.5625 C26.52039063 10.52318359 25.79078125 10.48386719 25.0390625 10.44335938 C21.5727027 10.23852902 18.34666974 9.9147998 15 9 C15 8.34 15 7.68 15 7 C14.278125 6.855625 13.55625 6.71125 12.8125 6.5625 C10.20833333 6.04166667 7.60416667 5.52083333 5 5 C5 5.99 5 6.98 5 8 C2.25 8.75 2.25 8.75 -1 9 C-3.375 7.0625 -3.375 7.0625 -5 5 C-4.34 3.68 -3.68 2.36 -3 1 C-2.67 1.66 -2.34 2.32 -2 3 C-1.34 2.01 -0.68 1.02 0 0 Z " fill="#26131C" transform="translate(68,219)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 1.65 1 3.3 1 5 C1.556875 5.268125 2.11375 5.53625 2.6875 5.8125 C3.450625 6.204375 4.21375 6.59625 5 7 C5.9075 7.4125 6.815 7.825 7.75 8.25 C8.4925 8.8275 9.235 9.405 10 10 C10.3125 13.1875 10.3125 13.1875 10 16 C8.741875 16.020625 7.48375 16.04125 6.1875 16.0625 C5.47980469 16.07410156 4.77210937 16.08570313 4.04296875 16.09765625 C2 16 2 16 -1 15 C-2.1875 12.9375 -2.1875 12.9375 -3 11 C-2.67 10.67 -2.34 10.34 -2 10 C-1.79300437 8.50503158 -1.63320741 7.0033408 -1.5 5.5 C-1.11111111 1.11111111 -1.11111111 1.11111111 0 0 Z " fill="#FDFCC4" transform="translate(34,210)"/>
<path d="M0 0 C-0.79664062 0.71285156 -1.59328125 1.42570312 -2.4140625 2.16015625 C-10.54652282 9.48744787 -17.42168932 16.49712561 -23 26 C-25.96052484 22.63576723 -26.92289822 19.30840713 -28 15 C-24.7 15.33 -21.4 15.66 -18 16 C-18.33 15.01 -18.66 14.02 -19 13 C-17.68 12.67 -16.36 12.34 -15 12 C-14.896875 11.38125 -14.79375 10.7625 -14.6875 10.125 C-14 8 -14 8 -11 6 C-11 5.34 -11 4.68 -11 4 C-10.34 3.34 -9.68 2.68 -9 2 C-8.01 2 -7.02 2 -6 2 C-6 1.34 -6 0.68 -6 0 C-2.25 -1.125 -2.25 -1.125 0 0 Z " fill="#2C508A" transform="translate(60,79)"/>
<path d="M0 0 C5.45625 0.60625 5.45625 0.60625 7.8125 2.3125 C9.15503842 4.22031776 9.69234142 5.69256063 10 8 C8.07421745 9.92578255 4.67964592 9.17443944 2.125 9.1875 C0.86945313 9.20167969 -0.38609375 9.21585938 -1.6796875 9.23046875 C-5 9 -5 9 -8 7 C-8 6.01 -8 5.02 -8 4 C-5.36 4 -2.72 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#ED6512" transform="translate(218,151)"/>
<path d="M0 0 C0 0.33 0 0.66 0 1 C-1.07378906 1.18175781 -2.14757812 1.36351562 -3.25390625 1.55078125 C-4.69018289 1.80424183 -6.12637648 2.05817328 -7.5625 2.3125 C-8.26697266 2.43044922 -8.97144531 2.54839844 -9.69726562 2.66992188 C-14.5184484 3.53640173 -18.55155396 4.95022584 -23 7 C-24.99263591 7.68836513 -26.99041337 8.36281399 -29 9 C-27.68 9.66 -26.36 10.32 -25 11 C-27.31 12.32 -29.62 13.64 -32 15 C-32.66 14.34 -33.32 13.68 -34 13 C-33.67 12.34 -33.34 11.68 -33 11 C-36.3 11.33 -39.6 11.66 -43 12 C-38.49206349 8.61904762 -38.49206349 8.61904762 -35.1640625 7.5 C-34.43614502 7.2539502 -33.70822754 7.00790039 -32.95825195 6.75439453 C-32.18827881 6.50544434 -31.41830566 6.25649414 -30.625 6 C-29.82860107 5.73944824 -29.03220215 5.47889648 -28.21166992 5.21044922 C-18.92647051 2.241933 -9.82306326 -0.22240898 0 0 Z " fill="#88D8EF" transform="translate(125,1)"/>
<path d="M0 0 C10.23 0 20.46 0 31 0 C31 0.99 31 1.98 31 3 C26.61227557 4.46257481 22.34671301 4.22491562 17.75 4.25 C16.82058594 4.270625 15.89117187 4.29125 14.93359375 4.3125 C9.15298816 4.34520498 5.13276427 3.6939923 0 1 C0 0.67 0 0.34 0 0 Z " fill="#23081B" transform="translate(122,203)"/>
<path d="M0 0 C2.375 0.3125 2.375 0.3125 5 1 C7 4 7 4 7 6.5 C6 9 6 9 3.4375 10.8125 C-0.70021573 12.24189271 -3.65063225 12.2249673 -8 12 C-5.6163187 7.65829477 -3.21880117 3.7935871 0 0 Z " fill="#F66E08" transform="translate(247,128)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C4.75 1.8125 4.75 1.8125 6 4 C5.67 4.99 5.34 5.98 5 7 C7.475 7.495 7.475 7.495 10 8 C7.28582345 9.46883057 4.87676118 10.36109962 1.84765625 10.9296875 C1.07099609 11.08566406 0.29433594 11.24164063 -0.50585938 11.40234375 C-2.1217401 11.71643462 -3.73894805 12.02377567 -5.35742188 12.32421875 C-10.21546718 13.31434232 -13.32462623 14.45085118 -17 18 C-17.33 17.34 -17.66 16.68 -18 16 C-14.97924573 12.34992192 -12.09767464 11.09574154 -7.70703125 9.7109375 C-5.7937944 9.13237451 -5.7937944 9.13237451 -5 7 C-4.34 7 -3.68 7 -3 7 C-3 6.34 -3 5.68 -3 5 C-2.01 5 -1.02 5 0 5 C0 3.35 0 1.7 0 0 Z " fill="#337DD3" transform="translate(137,32)"/>
<path d="M0 0 C-1.96382007 1.50559539 -3.78263366 2.89131683 -6 4 C-3.36 4 -0.72 4 2 4 C1.01 4.495 1.01 4.495 0 5 C0 5.66 0 6.32 0 7 C-3.96124704 9.33014532 -7.73223885 11.29289554 -12 13 C-12.66 13.66 -13.32 14.32 -14 15 C-15.7645093 15.79262878 -17.56161287 16.51416457 -19.375 17.1875 C-20.33148438 17.55230469 -21.28796875 17.91710937 -22.2734375 18.29296875 C-25.05285296 19.01370542 -26.35108103 18.98549829 -29 18 C-27.41925436 17.18247697 -25.83528777 16.37118003 -24.25 15.5625 C-23.36828125 15.11003906 -22.4865625 14.65757812 -21.578125 14.19140625 C-19 13 -19 13 -16.734375 12.46484375 C-15.87585938 12.23474609 -15.87585938 12.23474609 -15 12 C-14.67 11.34 -14.34 10.68 -14 10 C-11.6859378 9.26924352 -9.35171131 8.59861742 -7 8 C-8.70892499 4.68539295 -8.70892499 4.68539295 -12.125 4.3125 C-13.548125 4.1578125 -13.548125 4.1578125 -15 4 C-12.39457984 2.26305323 -10.41657225 1.30899552 -7.5 0.3125 C-6.33984375 -0.09548828 -6.33984375 -0.09548828 -5.15625 -0.51171875 C-3 -1 -3 -1 0 0 Z " fill="#ECAB7C" transform="translate(163,206)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 1.66 2 2.32 2 3 C0.68 3.33 -0.64 3.66 -2 4 C-2 4.66 -2 5.32 -2 6 C-1.01 6.33 -0.02 6.66 1 7 C-4.87407892 10.44537321 -10.73623131 12.67596751 -17.3125 14.3125 C-17.99376953 14.48362305 -18.67503906 14.65474609 -19.37695312 14.83105469 C-22.98004764 15.68311391 -26.29751881 16.19335975 -30 16 C-30 15.34 -30 14.68 -30 14 C-29.37351563 13.87882813 -28.74703125 13.75765625 -28.1015625 13.6328125 C-27.28429687 13.46523437 -26.46703125 13.29765625 -25.625 13.125 C-24.40683594 12.88136719 -24.40683594 12.88136719 -23.1640625 12.6328125 C-20.81326077 12.13341068 -20.81326077 12.13341068 -19 10 C-17.329375 9.7834375 -17.329375 9.7834375 -15.625 9.5625 C-11.92013013 8.9876064 -10.78447048 8.30438937 -8 6 C-6.948125 5.7525 -6.948125 5.7525 -5.875 5.5 C-3.59876637 5.11426598 -3.59876637 5.11426598 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#FCAA4F" transform="translate(169,185)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 1.65 1 3.3 1 5 C0.01 4.67 -0.98 4.34 -2 4 C-1.67 4.99 -1.34 5.98 -1 7 C1.01508358 7.73323796 1.01508358 7.73323796 3 8 C2.67 9.32 2.34 10.64 2 12 C1.34 12 0.68 12 0 12 C0 12.66 0 13.32 0 14 C0.66 14 1.32 14 2 14 C2 14.66 2 15.32 2 16 C2.66 16 3.32 16 4 16 C4 16.66 4 17.32 4 18 C2.0625 18.5625 2.0625 18.5625 0 19 C-0.33 18.67 -0.66 18.34 -1 18 C-0.95875 19.093125 -0.9175 20.18625 -0.875 21.3125 C-1 25 -1 25 -3 28 C-5.89655172 11.5 -5.89655172 11.5 -5 5 C-4.34 4.34 -3.68 3.68 -3 3 C-2.01 3 -1.02 3 0 3 C0 2.01 0 1.02 0 0 Z " fill="#1A194E" transform="translate(5,142)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.35239578 4.78152704 0.76622348 6.99644095 -2.1875 10.75 C-5.79627591 15.57637104 -8.47878409 20.53930195 -11 26 C-11.99 25.01 -12.98 24.02 -14 23 C-11.10967401 14.23394551 -6.55842698 6.55842698 0 0 Z " fill="#E5551B" transform="translate(46,94)"/>
<path d="M0 0 C1.33333333 0 2.66666667 0 4 0 C3.9175 1.0725 3.835 2.145 3.75 3.25 C3.65310959 6.99888385 3.65310959 6.99888385 5.8125 9.375 C7.99221829 11.17066872 7.99221829 11.17066872 11 12 C11 12.66 11 13.32 11 14 C11.99 14.33 12.98 14.66 14 15 C13.01 15.66 12.02 16.32 11 17 C10.34 16.67 9.68 16.34 9 16 C9 15.34 9 14.68 9 14 C8.195625 13.855625 7.39125 13.71125 6.5625 13.5625 C4 13 4 13 3 12 C2.566875 12.495 2.13375 12.99 1.6875 13.5 C0 15 0 15 -3 15 C-3.36263859 9.1977825 -2.25684543 5.36000789 0 0 Z " fill="#15387F" transform="translate(8,91)"/>
<path d="M0 0 C0.625 1.875 0.625 1.875 1 4 C0.34 4.66 -0.32 5.32 -1 6 C-1.6425235 8.06874034 -1.6425235 8.06874034 -2 10 C-3.32 10.33 -4.64 10.66 -6 11 C-6 11.99 -6 12.98 -6 14 C-10.22857143 18 -10.22857143 18 -14 18 C-14 18.66 -14 19.32 -14 20 C-13.34 20.33 -12.68 20.66 -12 21 C-18.69607692 26.13365897 -28.89965787 25.55638714 -37 25 C-38 24 -38 24 -38.0625 21.4375 C-38.041875 20.633125 -38.02125 19.82875 -38 19 C-37.34 20.32 -36.68 21.64 -36 23 C-25.39243167 23.7857458 -18.18204679 19.61831133 -10.12890625 13 C-7.94938865 11.07265066 -7.94938865 11.07265066 -6.33984375 8.75 C-5.89769531 8.1725 -5.45554688 7.595 -5 7 C-4.34 7 -3.68 7 -3 7 C-2.690625 6.030625 -2.38125 5.06125 -2.0625 4.0625 C-1 1 -1 1 0 0 Z " fill="#DF982B" transform="translate(172,34)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.67 1.66 1.34 2.32 1 3 C1.66 3 2.32 3 3 3 C3.46748567 10.2971591 2.17912587 15.03777377 -1 21.5625 C-1.3815625 22.38041016 -1.763125 23.19832031 -2.15625 24.04101562 C-3.08914304 26.03507449 -4.03692846 28.02038853 -5 30 C-5.33 30 -5.66 30 -6 30 C-5.85957123 28.35369672 -5.71250671 26.70795821 -5.5625 25.0625 C-5.48128906 24.14597656 -5.40007812 23.22945312 -5.31640625 22.28515625 C-5 20 -5 20 -4 19 C-3.55244228 15.88213995 -3.18045107 12.76547023 -2.83789062 9.63476562 C-2.40682167 6.04953356 -1.90485218 3.10036611 0 0 Z " fill="#25174D" transform="translate(270,178)"/>
<path d="M0 0 C6.57142857 5.14285714 6.57142857 5.14285714 8 9 C5 10 5 10 2 10 C2 10.66 2 11.32 2 12 C1.01 12 0.02 12 -1 12 C-1 12.66 -1 13.32 -1 14 C-2.32 14 -3.64 14 -5 14 C-7.25 11 -7.25 11 -9 8 C-7.68 8.33 -6.36 8.66 -5 9 C-5 8.34 -5 7.68 -5 7 C-4.01 7 -3.02 7 -2 7 C-1.855625 6.21625 -1.71125 5.4325 -1.5625 4.625 C-1 2 -1 2 0 0 Z " fill="#C92211" transform="translate(156,103)"/>
<path d="M0 0 C1.98 0.66 3.96 1.32 6 2 C5.95359375 2.73605469 5.9071875 3.47210938 5.859375 4.23046875 C5.50227161 10.46618722 5.50227161 10.46618722 8 16 C8.66 16.66 9.32 17.32 10 18 C10 18.99 10 19.98 10 21 C7.1875 20.8125 7.1875 20.8125 4 20 C0.80470586 16.02095447 0.47764532 12.1182674 0.3125 7.1875 C0.27833984 6.49462891 0.24417969 5.80175781 0.20898438 5.08789062 C0.12713656 3.39247151 0.06187635 1.69626542 0 0 Z " fill="#F98C14" transform="translate(22,182)"/>
<path d="M0 0 C6.52307692 -0.36923077 6.52307692 -0.36923077 8.9375 1.5 C9.288125 1.995 9.63875 2.49 10 3 C10.66 2.67 11.32 2.34 12 2 C13.125 7.75 13.125 7.75 12 10 C9.625 9.6875 9.625 9.6875 7 9 C6.34 8.01 5.68 7.02 5 6 C2.8614515 8.1385485 2.57344937 9.13275314 2 12 C1.01 11.67 0.02 11.34 -1 11 C-0.67 7.37 -0.34 3.74 0 0 Z " fill="#3E2538" transform="translate(73,149)"/>
<path d="M0 0 C1.39852912 4.19558737 -0.22736864 6.04566851 -2 10 C-2.69140522 12.77888613 -2.69140522 12.77888613 -3 15 C-3.99 15.33 -4.98 15.66 -6 16 C-6 15.34 -6 14.68 -6 14 C-6.99 14.33 -7.98 14.66 -9 15 C-9.93402724 9.58264203 -10.20808081 6.19548425 -8 1 C-6.35 1 -4.7 1 -3 1 C-3 1.66 -3 2.32 -3 3 C-2.01 2.01 -1.02 1.02 0 0 Z " fill="#2D295C" transform="translate(30,114)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.43200679 4.75207471 -0.01510917 7.78210698 -2 12 C-2.66 12 -3.32 12 -4 12 C-4.185625 12.680625 -4.37125 13.36125 -4.5625 14.0625 C-8.10402578 21.29953093 -15.06560099 25.66090794 -21.546875 30.10546875 C-23.87349693 31.90230256 -25.38137283 33.56666382 -27 36 C-26.48880995 31.52708703 -25.09159758 29.25014105 -22 26 C-20.76560623 25.04204475 -19.51386485 24.10622297 -18.25 23.1875 C-9.40824039 16.69587352 -4.43243009 10.07370476 0 0 Z " fill="#F69805" transform="translate(175,41)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C0.50499533 8.08996004 -8.14999264 12.93616708 -15.9375 16.25 C-19.79801814 17.19543301 -23.02929337 17.20190034 -27 17 C-28 16 -28 16 -28.3125 13.1875 C-28 10 -28 10 -26 7.625 C-25.34 7.08875 -24.68 6.5525 -24 6 C-23.34 6.33 -22.68 6.66 -22 7 C-22.9590625 7.86625 -22.9590625 7.86625 -23.9375 8.75 C-26.34096628 11.01303649 -26.34096628 11.01303649 -27 15 C-24.03 15 -21.06 15 -18 15 C-18 14.34 -18 13.68 -18 13 C-16.906875 12.95875 -15.81375 12.9175 -14.6875 12.875 C-10.75003667 12.39434602 -10.75003667 12.39434602 -9.0625 8.9375 C-8.5365625 7.4834375 -8.5365625 7.4834375 -8 6 C-7.01 6 -6.02 6 -5 6 C-4.34 5.01 -3.68 4.02 -3 3 C-1.68 3 -0.36 3 1 3 C0.67 2.01 0.34 1.02 0 0 Z " fill="#3B437E" transform="translate(163,41)"/>
<path d="M0 0 C1.49080078 0.02707031 1.49080078 0.02707031 3.01171875 0.0546875 C3.77097656 0.07789063 4.53023437 0.10109375 5.3125 0.125 C4.3225 0.62 4.3225 0.62 3.3125 1.125 C3.3125 1.785 3.3125 2.445 3.3125 3.125 C4.3025 3.785 5.2925 4.445 6.3125 5.125 C-3.56641677 7.9988667 -10.97124972 7.53278716 -20.6875 4.125 C-20.6875 3.795 -20.6875 3.465 -20.6875 3.125 C-19.44033203 3.05152344 -19.44033203 3.05152344 -18.16796875 2.9765625 C-17.08128906 2.90179688 -15.99460937 2.82703125 -14.875 2.75 C-13.79605469 2.68039063 -12.71710938 2.61078125 -11.60546875 2.5390625 C-7.12051724 1.90264368 -4.80178337 -0.11298314 0 0 Z " fill="#F4C7A0" transform="translate(131.6875,212.875)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.34 2.32 2.68 3.64 2 5 C2.763125 4.649375 3.52625 4.29875 4.3125 3.9375 C7 3 7 3 10 4 C8.02 4.99 8.02 4.99 6 6 C6 6.99 6 7.98 6 9 C5.01 9.33 4.02 9.66 3 10 C2.67 10.66 2.34 11.32 2 12 C1.34 12 0.68 12 0 12 C-0.33 12.99 -0.66 13.98 -1 15 C-2.65 14.67 -4.3 14.34 -6 14 C-6 12.68 -6 11.36 -6 10 C-5.01 9.34 -4.02 8.68 -3 8 C-3.33 7.34 -3.66 6.68 -4 6 C-2.68 4.02 -1.36 2.04 0 0 Z " fill="#FAF5EA" transform="translate(80,110)"/>
<path d="M0 0 C4.95 1.98 4.95 1.98 10 4 C10 6.31 10 8.62 10 11 C9.34 11 8.68 11 8 11 C8 11.99 8 12.98 8 14 C2.25 12.25 2.25 12.25 0 10 C-0.27450545 6.65103346 -0.08628804 3.36523337 0 0 Z " fill="#311F4B" transform="translate(195,217)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3.72917151 1.72048318 4.43259217 3.45189495 5.125 5.1875 C5.51945312 6.15042969 5.91390625 7.11335938 6.3203125 8.10546875 C7.12038901 11.51269115 6.59504102 12.94934462 5 16 C4.34 16 3.68 16 3 16 C2.67 13.69 2.34 11.38 2 9 C1.01 8.67 0.02 8.34 -1 8 C-1 7.34 -1 6.68 -1 6 C-2.99983534 6.79117904 -2.99983534 6.79117904 -5 8 C-5.33 8.99 -5.66 9.98 -6 11 C-7.4375 12.6875 -7.4375 12.6875 -9 14 C-9.66 14 -10.32 14 -11 14 C-9.60846256 9.57238086 -7.47928514 7.0443745 -4 4 C-3.34 4 -2.68 4 -2 4 C-1.34 2.68 -0.68 1.36 0 0 Z " fill="#62141B" transform="translate(63,107)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C1.71749338 2.58463502 1.4243774 5.16731135 1.125 7.75 C1.00705078 8.84441406 1.00705078 8.84441406 0.88671875 9.9609375 C0.44863824 13.66777257 0.0013785 16.80452172 -2 20 C-2.18451025 9.44191344 -2.18451025 9.44191344 -1 5 C-1.886875 5.45375 -2.77375 5.9075 -3.6875 6.375 C-11.66322399 9.77927244 -20.53458742 10.65988482 -29 9 C-29 8.67 -29 8.34 -29 8 C-27.73285156 7.81824219 -26.46570313 7.63648438 -25.16015625 7.44921875 C-23.46087446 7.19573473 -21.76165919 6.94180454 -20.0625 6.6875 C-18.81629883 6.51057617 -18.81629883 6.51057617 -17.54492188 6.33007812 C-11.8932293 5.47242828 -6.22164186 4.41542806 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#E0B780" transform="translate(270,137)"/>
<path d="M0 0 C6.02770138 0.47587116 10.76678289 3.19722957 16 6 C15.67 7.65 15.34 9.3 15 11 C13.35 11.33 11.7 11.66 10 12 C10 10.68 10 9.36 10 8 C9.443125 8.20625 8.88625 8.4125 8.3125 8.625 C5.340462 9.10695211 3.68020059 8.26565028 1 7 C1.33 6.01 1.66 5.02 2 4 C1.34 4 0.68 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#1469B9" transform="translate(194,13)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C1.65 2 3.3 2 5 2 C5.33 3.98 5.66 5.96 6 8 C7.98 8 9.96 8 12 8 C12 8.66 12 9.32 12 10 C12.66 10.33 13.32 10.66 14 11 C14 11.66 14 12.32 14 13 C15.65 13 17.3 13 19 13 C18.67 14.32 18.34 15.64 18 17 C9.28538359 13.79100767 1.81566306 8.20982635 -5 2 C-2 0 -2 0 0 0 Z " fill="#F3D9A8" transform="translate(57,204)"/>
<path d="M0 0 C5.20699853 4.44126345 7.92118205 9.95874554 11 16 C9.68 16 8.36 16 7 16 C7 15.34 7 14.68 7 14 C6.34 14 5.68 14 5 14 C5 14.66 5 15.32 5 16 C3.68 16 2.36 16 1 16 C1 14.02 1 12.04 1 10 C0.34 9.67 -0.32 9.34 -1 9 C-1 7.35 -1 5.7 -1 4 C-1.99 4 -2.98 4 -4 4 C-3 2 -3 2 0 0 Z " fill="#0B1E59" transform="translate(252,55)"/>
<path d="M0 0 C0 0.33 0 0.66 0 1 C-0.93682617 1.08302368 -0.93682617 1.08302368 -1.89257812 1.16772461 C-4.76185148 1.42284782 -7.63092471 1.68015928 -10.5 1.9375 C-11.48226562 2.02451172 -12.46453125 2.11152344 -13.4765625 2.20117188 C-17.83062738 2.59303771 -22.1679729 3.00333663 -26.5 3.59375 C-29.95361236 3.99461572 -32.62459277 3.75946663 -36 3 C-35.67 3.99 -35.34 4.98 -35 6 C-39.43076923 8.09230769 -39.43076923 8.09230769 -42.3125 7.625 C-42.869375 7.41875 -43.42625 7.2125 -44 7 C-43.67 5.68 -43.34 4.36 -43 3 C-28.74306023 -0.66794163 -14.6306538 -0.31310113 0 0 Z " fill="#61C3E1" transform="translate(152,1)"/>
<path d="M0 0 C4.875 1.875 4.875 1.875 6 3 C6.1875 6.4375 6.1875 6.4375 6 10 C4 12 4 12 0.5234375 12.1953125 C-0.85950968 12.18201493 -2.24238654 12.15816232 -3.625 12.125 C-4.33140625 12.11597656 -5.0378125 12.10695313 -5.765625 12.09765625 C-7.51056098 12.07407603 -9.25532295 12.03820461 -11 12 C-10.67 11.01 -10.34 10.02 -10 9 C-10.33 8.01 -10.66 7.02 -11 6 C-10.34 6 -9.68 6 -9 6 C-8.67 6.66 -8.34 7.32 -8 8 C-5.69 8 -3.38 8 -1 8 C-0.67 5.36 -0.34 2.72 0 0 Z " fill="#34173F" transform="translate(239,105)"/>
<path d="M0 0 C3.69837722 2.46558481 3.94726123 3.75896668 5 8 C5.1953125 11.4296875 5.1953125 11.4296875 5.125 14.875 C5.10695312 16.02742188 5.08890625 17.17984375 5.0703125 18.3671875 C5.04710937 19.23601563 5.02390625 20.10484375 5 21 C4.67 21 4.34 21 4 21 C3.67 17.04 3.34 13.08 3 9 C2.29875 10.485 1.5975 11.97 0.875 13.5 C-2.02717689 18.38567908 -5.22411102 20.89184503 -10.0625 23.625 C-10.96476318 24.13836914 -10.96476318 24.13836914 -11.88525391 24.66210938 C-15.38041866 26.51209479 -18.04530252 27.40369313 -22 27 C-19.41031136 25.27354091 -17.07347822 24.12890493 -14.25 22.875 C-8.43497891 20.02283006 -3.92233514 15.84467028 -1 10 C-0.77377919 8.29636178 -0.59111527 6.58671299 -0.4375 4.875 C-0.35371094 3.96492188 -0.26992187 3.05484375 -0.18359375 2.1171875 C-0.09271484 1.06917969 -0.09271484 1.06917969 0 0 Z " fill="#D2813E" transform="translate(202,44)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 0.66 2 1.32 2 2 C2.78375 2.061875 3.5675 2.12375 4.375 2.1875 C5.24125 2.455625 6.1075 2.72375 7 3 C8.3125 5.5625 8.3125 5.5625 9 8 C3.67067568 9.70084819 -1.43109483 10.52013969 -7 11 C-7.33 10.01 -7.66 9.02 -8 8 C-5.69 8 -3.38 8 -1 8 C-1.66 7.01 -2.32 6.02 -3 5 C-3 4.01 -3 3.02 -3 2 C-2.01 2 -1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#112153" transform="translate(257,69)"/>
<path d="M0 0 C-0.99 1.32 -1.98 2.64 -3 4 C-2.01 4.33 -1.02 4.66 0 5 C-0.34021964 8.17538332 -1.02466604 9.02276865 -3.4375 11.25 C-6 13 -6 13 -8 13 C-8.33 15.31 -8.66 17.62 -9 20 C-10.65 20.33 -12.3 20.66 -14 21 C-13.34 20.67 -12.68 20.34 -12 20 C-12.103125 19.2575 -12.20625 18.515 -12.3125 17.75 C-12.1578125 16.38875 -12.1578125 16.38875 -12 15 C-11.195625 14.4225 -10.39125 13.845 -9.5625 13.25 C-6.62027374 10.66658182 -6.57244753 9.98282453 -6.1875 6.25 C-6.10302504 4.83447371 -6.03332091 3.41765314 -6 2 C-7.0725 2.350625 -8.145 2.70125 -9.25 3.0625 C-12.78720743 3.94680186 -13.74811124 4.02880551 -17 3 C-14.92085336 2.29994051 -12.83648414 1.61537756 -10.75 0.9375 C-9.58984375 0.55464844 -8.4296875 0.17179687 -7.234375 -0.22265625 C-4.19922915 -0.95211763 -2.84296787 -1.11889082 0 0 Z " fill="#FCE943" transform="translate(151,61)"/>
<path d="M0 0 C7.59 0 15.18 0 23 0 C23 0.33 23 0.66 23 1 C21.73542969 1.03867188 21.73542969 1.03867188 20.4453125 1.078125 C19.34960938 1.13484375 18.25390625 1.1915625 17.125 1.25 C16.03445312 1.29640625 14.94390625 1.3428125 13.8203125 1.390625 C10.89245508 1.68569815 10.89245508 1.68569815 9.6796875 3.921875 C9.34324219 4.95054687 9.34324219 4.95054687 9 6 C8.67 6.66 8.34 7.32 8 8 C7.01 8 6.02 8 5 8 C5.33 10.64 5.66 13.28 6 16 C4.35 16.66 2.7 17.32 1 18 C1 17.34 1 16.68 1 16 C1.99 16 2.98 16 4 16 C3.34 13.03 2.68 10.06 2 7 C2.99 7 3.98 7 5 7 C4.67 6.01 4.34 5.02 4 4 C1.98491642 3.26676204 1.98491642 3.26676204 0 3 C0 2.01 0 1.02 0 0 Z " fill="#CA4717" transform="translate(211,161)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C2.32 2 3.64 2 5 2 C5 2.66 5 3.32 5 4 C5.66 4 6.32 4 7 4 C7.33 3.34 7.66 2.68 8 2 C7.814375 2.763125 7.62875 3.52625 7.4375 4.3125 C6.77180827 7.08967375 6.77180827 7.08967375 8 10 C6.68 9.67 5.36 9.34 4 9 C2.96333227 11.89551669 2.96333227 11.89551669 2.5 14.5625 C2 17 2 17 1 19 C0.01 19 -0.98 19 -2 19 C-1.85761163 16.95809019 -1.71092972 14.91647955 -1.5625 12.875 C-1.48128906 11.73804687 -1.40007812 10.60109375 -1.31640625 9.4296875 C-1.02269035 6.2459522 -0.56875687 3.14489093 0 0 Z " fill="#132662" transform="translate(2,111)"/>
<path d="M0 0 C3.63 0 7.26 0 11 0 C10 2 10 2 8 2.9375 C5.65391779 3.8891846 5.65391779 3.8891846 5 7 C5.66 7.33 6.32 7.66 7 8 C-1.415 8.495 -1.415 8.495 -10 9 C-9 6 -9 6 -7.1875 4.90234375 C-6.465625 4.58394531 -5.74375 4.26554687 -5 3.9375 C-1.8485304 2.67769923 -1.8485304 2.67769923 0 0 Z " fill="#FCF380" transform="translate(110,76)"/>
<path d="M0 0 C6 4.5 6 4.5 12 9 C9.1875 11.0625 9.1875 11.0625 6 13 C5.01 12.67 4.02 12.34 3 12 C3 12.66 3 13.32 3 14 C2.01 14 1.02 14 0 14 C0 13.01 0 12.02 0 11 C-0.66 11 -1.32 11 -2 11 C-2.66 12.32 -3.32 13.64 -4 15 C-4 13.35 -4 11.7 -4 10 C-2.68 10 -1.36 10 0 10 C0 6.7 0 3.4 0 0 Z " fill="#2062C0" transform="translate(51,67)"/>
<path d="M0 0 C6 0 6 0 9 2 C8.66951441 7.28776943 5.51647805 11.24100622 2 15 C1.34 15 0.68 15 0 15 C0 10.05 0 5.1 0 0 Z " fill="#EA860D" transform="translate(237,123)"/>
<path d="M0 0 C0 3.16820458 -0.62797454 4.25594908 -2 7 C-2 7.99 -2 8.98 -2 10 C-2.99 10 -3.98 10 -5 10 C-4.87625 11.13501953 -4.87625 11.13501953 -4.75 12.29296875 C-5 15 -5 15 -6.75 16.80078125 C-7.4925 17.29964844 -8.235 17.79851562 -9 18.3125 C-9.7425 18.82425781 -10.485 19.33601563 -11.25 19.86328125 C-11.8275 20.23839844 -12.405 20.61351562 -13 21 C-13.66796875 19.27734375 -13.66796875 19.27734375 -14 17 C-12.92578125 14.81640625 -12.92578125 14.81640625 -11.3125 12.5625 C-10.75433594 11.77746094 -10.19617188 10.99242188 -9.62109375 10.18359375 C-9.08613281 9.46300781 -8.55117187 8.74242188 -8 8 C-7.29875 7.05125 -6.5975 6.1025 -5.875 5.125 C-4.06344716 3.07190678 -2.26047368 1.53389285 0 0 Z " fill="#F5EAE6" transform="translate(79,110)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 0.66 3 1.32 3 2 C5.31 2 7.62 2 10 2 C10 2.99 10 3.98 10 5 C12.31 4.34 14.62 3.68 17 3 C17.66 3.66 18.32 4.32 19 5 C15.3558226 7.4294516 13.28758728 7.16179575 9 7 C8.67 6.01 8.34 5.02 8 4 C6.00016466 4.79117904 6.00016466 4.79117904 4 6 C3.67 6.99 3.34 7.98 3 9 C0.69 9 -1.62 9 -4 9 C-4.33 8.01 -4.66 7.02 -5 6 C-2.75 2.8125 -2.75 2.8125 0 0 Z " fill="#971710" transform="translate(201,110)"/>
<path d="M0 0 C3.3 0 6.6 0 10 0 C10 0.66 10 1.32 10 2 C10.9793879 3.02019573 11.97895449 4.02149805 13 5 C13 5.33 13 5.66 13 6 C9.56257082 6.05802698 6.12526747 6.09360486 2.6875 6.125 C1.71103516 6.14175781 0.73457031 6.15851563 -0.27148438 6.17578125 C-1.20927734 6.18222656 -2.14707031 6.18867188 -3.11328125 6.1953125 C-3.97735596 6.20578613 -4.84143066 6.21625977 -5.73168945 6.22705078 C-8 6 -8 6 -11 4 C-8.24921116 3.08307039 -6.64051087 2.89113917 -3.8125 2.9375 C-1.9253125 2.9684375 -1.9253125 2.9684375 0 3 C0 2.01 0 1.02 0 0 Z " fill="#C5200E" transform="translate(225,215)"/>
<path d="M0 0 C1.125 3.75 1.125 3.75 0 6 C-0.66 6 -1.32 6 -2 6 C-2 7.98 -2 9.96 -2 12 C-4 12 -6 12 -8 12 C-9.46444668 12.28246818 -10.92272094 12.59797401 -12.375 12.9375 C-15.57562368 13.67369566 -18.77517261 14.37583986 -22 15 C-18.25 12 -18.25 12 -16 12 C-16 11.34 -16 10.68 -16 10 C-13.36 9.67 -10.72 9.34 -8 9 C-8 8.01 -8 7.02 -8 6 C-6.68 6 -5.36 6 -4 6 C-4 5.34 -4 4.68 -4 4 C-4.99 4.33 -5.98 4.66 -7 5 C-7.33 4.34 -7.66 3.68 -8 3 C-5.29120665 1.64560332 -2.99066732 1.93498549 0 2 C0 1.34 0 0.68 0 0 Z " fill="#46162A" transform="translate(61,223)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 1.65 1 3.3 1 5 C1.639375 5.103125 2.27875 5.20625 2.9375 5.3125 C3.618125 5.539375 4.29875 5.76625 5 6 C5.33 6.99 5.66 7.98 6 9 C3.03 9.66 0.06 10.32 -3 11 C-3 11.99 -3 12.98 -3 14 C-5.97 13.505 -5.97 13.505 -9 13 C-8.67 11.68 -8.34 10.36 -8 9 C-7.34 9 -6.68 9 -6 9 C-6 8.01 -6 7.02 -6 6 C-5.34 5.67 -4.68 5.34 -4 5 C-3.67 4.01 -3.34 3.02 -3 2 C-2.01 2 -1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#250C21" transform="translate(180,213)"/>
<path d="M0 0 C-0.33 3.3 -0.66 6.6 -1 10 C-1.969375 9.34 -2.93875 8.68 -3.9375 8 C-6.5299253 5.90886852 -6.5299253 5.90886852 -8 6 C-9.02019573 6.9793879 -10.02149805 7.97895449 -11 9 C-12.32 8.34 -13.64 7.68 -15 7 C-14.34 7 -13.68 7 -13 7 C-13 6.34 -13 5.68 -13 5 C-13.99 5.33 -14.98 5.66 -16 6 C-16 4.68 -16 3.36 -16 2 C-13.89627599 1.66388432 -11.79200343 1.33120054 -9.6875 1 C-8.51574219 0.814375 -7.34398437 0.62875 -6.13671875 0.4375 C-3 0 -3 0 0 0 Z " fill="#A84A29" transform="translate(265,144)"/>
<path d="M0 0 C1.21236328 0.01353516 1.21236328 0.01353516 2.44921875 0.02734375 C3.37154297 0.04474609 3.37154297 0.04474609 4.3125 0.0625 C4.3125 0.7225 4.3125 1.3825 4.3125 2.0625 C3.69375 2.330625 3.075 2.59875 2.4375 2.875 C0.0129767 4.01806848 0.0129767 4.01806848 -1.6875 7.0625 C-2.0175 6.0725 -2.3475 5.0825 -2.6875 4.0625 C-6.06212715 4.60973683 -7.76985 5.1174 -10.6875 7.0625 C-11.0175 8.0525 -11.3475 9.0425 -11.6875 10.0625 C-13.02083333 10.72916667 -14.35416667 11.39583333 -15.6875 12.0625 C-16.0175 13.0525 -16.3475 14.0425 -16.6875 15.0625 C-17.6775 15.0625 -18.6675 15.0625 -19.6875 15.0625 C-19.26938612 10.18450473 -17.32347431 8.21367773 -13.6875 5.0625 C-9.01438952 1.69786045 -5.77017857 -0.08362578 0 0 Z " fill="#FDF180" transform="translate(236.6875,119.9375)"/>
<path d="M0 0 C-0.5625 1.8125 -0.5625 1.8125 -2 4 C-4.31104818 5.05047644 -6.64583651 6.05007438 -9 7 C-9.43054688 7.48984375 -9.86109375 7.9796875 -10.3046875 8.484375 C-12.82207007 10.73493822 -15.41586883 11.00725985 -18.6875 11.6875 C-20.45673828 12.06455078 -20.45673828 12.06455078 -22.26171875 12.44921875 C-23.16535156 12.63097656 -24.06898437 12.81273438 -25 13 C-24.67 12.01 -24.34 11.02 -24 10 C-23.05125 9.896875 -22.1025 9.79375 -21.125 9.6875 C-17.70892499 9.31460705 -17.70892499 9.31460705 -16 6 C-13.75 4.5 -13.75 4.5 -11 3 C-10.01 2.443125 -9.02 1.88625 -8 1.3125 C-5.01072423 0.00469185 -3.21025442 -0.28325774 0 0 Z " fill="#FBF595" transform="translate(110,76)"/>
<path d="M0 0 C2.64 0.66 5.28 1.32 8 2 C7.67 5.96 7.34 9.92 7 14 C4.36 14 1.72 14 -1 14 C-1 12.02 -1 10.04 -1 8 C0.65 8 2.3 8 4 8 C3.34 7.4225 2.68 6.845 2 6.25 C0 4 0 4 0 0 Z " fill="#21102E" transform="translate(199,245)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C-0.37945214 4.62085626 -1.76695231 6.23534957 -3.1875 7.8203125 C-13.85649326 20.65069663 -18.47747861 37.67227063 -20 54 C-20.33 54 -20.66 54 -21 54 C-22.07355591 33.80124433 -13.16221577 16.49401051 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#C66545" transform="translate(46,91)"/>
<path d="M0 0 C2.31 0 4.62 0 7 0 C7.33 1.65 7.66 3.3 8 5 C8.99 5.33 9.98 5.66 11 6 C11.33 6.99 11.66 7.98 12 9 C11.01 9 10.02 9 9 9 C8.67 9.66 8.34 10.32 8 11 C7.34 10.67 6.68 10.34 6 10 C5.67 10.66 5.34 11.32 5 12 C4.67 11.01 4.34 10.02 4 9 C0.99992729 7.29144978 0.99992729 7.29144978 -2 6 C-2 4.68 -2 3.36 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#262D65" transform="translate(237,61)"/>
<path d="M0 0 C3.3 0.66 6.6 1.32 10 2 C8.02 2.99 8.02 2.99 6 4 C5.19471111 6.05000871 5.19471111 6.05000871 5 8 C6.32 8 7.64 8 9 8 C8 11 8 11 6.4375 12.25 C2.76051305 13.3813806 -0.2220669 12.62965552 -4 12 C-3.690625 11.401875 -3.38125 10.80375 -3.0625 10.1875 C-1.89790296 7.91043228 -1.89790296 7.91043228 -1 5 C0.5625 3.3125 0.5625 3.3125 2 2 C1.34 2 0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#2C79D4" transform="translate(107,43)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C2.375 7.75 2.375 7.75 -1 10 C-0.814375 9.071875 -0.62875 8.14375 -0.4375 7.1875 C0.24123881 3.98656229 0.24123881 3.98656229 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z M-17 1 C-14.525 1.99 -14.525 1.99 -12 3 C-12 3.99 -12 4.98 -12 6 C-10.35 6 -8.7 6 -7 6 C-6.67 7.32 -6.34 8.64 -6 10 C-4.35 10 -2.7 10 -1 10 C-1.66 10.66 -2.32 11.32 -3 12 C-6.125 11.625 -6.125 11.625 -9 11 C-9.33 9.68 -9.66 8.36 -10 7 C-10.99 7 -11.98 7 -13 7 C-13.33 7.99 -13.66 8.98 -14 10 C-15.32 10 -16.64 10 -18 10 C-17.67 9.01 -17.34 8.02 -17 7 C-16.34 7 -15.68 7 -15 7 C-15.99 5.68 -16.98 4.36 -18 3 C-17.67 2.34 -17.34 1.68 -17 1 Z " fill="#2E0504" transform="translate(251,173)"/>
<path d="M0 0 C1.22589844 0.01353516 1.22589844 0.01353516 2.4765625 0.02734375 C3.10304687 0.03894531 3.72953125 0.05054688 4.375 0.0625 C3.4159375 0.5265625 3.4159375 0.5265625 2.4375 1 C0.43889179 1.8970163 0.43889179 1.8970163 -0.625 3.0625 C-3.25408881 3.2742387 -5.86658062 3.43884379 -8.5 3.5625 C-14.14276006 3.78777338 -14.14276006 3.78777338 -19.625 5.0625 C-21.74827356 5.15773918 -23.87459711 5.19236362 -26 5.1875 C-27.68222656 5.19136719 -27.68222656 5.19136719 -29.3984375 5.1953125 C-32.26764622 5.07720948 -34.83708229 4.72032328 -37.625 4.0625 C-36.0625 2.5 -36.0625 2.5 -33.625 1.0625 C-31.99606794 1.29732008 -30.36773905 1.53815097 -28.74487305 1.81176758 C-24.60602022 2.30129906 -20.46167611 1.92890661 -16.3125 1.6875 C-14.95415039 1.62175781 -14.95415039 1.62175781 -13.56835938 1.5546875 C-8.82336186 1.29992253 -4.66498219 -0.0666426 0 0 Z " fill="#DEC0A3" transform="translate(129.625,223.9375)"/>
<path d="M0 0 C0.92790397 2.52273893 1.08450301 3.73724844 0.25 6.33203125 C-2.72691234 12.23934167 -6.00528532 16.65301489 -11 21 C-11.33 20.34 -11.66 19.68 -12 19 C-12.94875 19.515625 -13.8975 20.03125 -14.875 20.5625 C-15.90625 21.036875 -16.9375 21.51125 -18 22 C-18.66 21.67 -19.32 21.34 -20 21 C-19.39671875 20.61328125 -18.7934375 20.2265625 -18.171875 19.828125 C-12.03414255 15.82869934 -7.67107747 12.42438557 -4 6 C-2.67541292 3.99419671 -1.3440093 1.99284138 0 0 Z " fill="#EF6409" transform="translate(204,99)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C3.33 1.99 3.66 2.98 4 4 C4.66 4.33 5.32 4.66 6 5 C13.59980423 17.112188 12.26410856 32.23700951 12 46 C11.67 46 11.34 46 11 46 C10.96261719 44.92363281 10.92523438 43.84726563 10.88671875 42.73828125 C10.33807133 29.59946023 8.70112584 18.28539737 2.3046875 6.55859375 C1.16597058 4.32548124 0.47187991 2.44571903 0 0 Z " fill="#F7D68D" transform="translate(164,110)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C6.33 0.99 6.66 1.98 7 3 C7.66 2.67 8.32 2.34 9 2 C9.27615058 3.59987236 9.52007625 5.205333 9.75 6.8125 C9.88921875 7.70582031 10.0284375 8.59914063 10.171875 9.51953125 C10 12 10 12 8.265625 13.82421875 C6 15 6 15 2 15 C2.33 11.37 2.66 7.74 3 4 C1.68 3.34 0.36 2.68 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#44BDEB" transform="translate(86,12)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C0.71941447 29.72306422 0.71941447 29.72306422 -2.43359375 33.8984375 C-4 35 -4 35 -6.1875 34.6875 C-6.785625 34.460625 -7.38375 34.23375 -8 34 C-7.36610352 33.31591064 -6.73220703 32.63182129 -6.07910156 31.92700195 C-3.65924701 28.52028094 -3.24288887 26.2905633 -2.734375 22.16796875 C-2.48300781 20.22954102 -2.48300781 20.22954102 -2.2265625 18.25195312 C-2.06735056 16.89717741 -1.90850088 15.54235908 -1.75 14.1875 C-1.57702861 12.81296046 -1.40256423 11.43860793 -1.2265625 10.06445312 C-0.80299148 6.71118258 -0.39472717 3.35676751 0 0 Z " fill="#D88A6D" transform="translate(263,181)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C2.65181931 5.23076115 1.41174898 8.71112347 -0.69921875 13.53515625 C-3.84491815 19.49592599 -8.13317177 23.74065098 -14 27 C-14.99 27 -15.98 27 -17 27 C-17 26.34 -17 25.68 -17 25 C-14.36107824 23.21694476 -12.02821137 22.00940379 -9 21 C-9 20.01 -9 19.02 -9 18 C-7.68 17.67 -6.36 17.34 -5 17 C-4.87625 16.319375 -4.7525 15.63875 -4.625 14.9375 C-3.52831905 9.78309954 -2.05849054 4.85215628 0 0 Z " fill="#F1A015" transform="translate(175,27)"/>
<path d="M0 0 C4.81366583 -0.0943856 9.28659085 -0.10903745 14 1 C14.99 1 15.98 1 17 1 C17 1.66 17 2.32 17 3 C15.02 3.99 13.04 4.98 11 6 C11.33 7.32 11.66 8.64 12 10 C6.37413137 8.23186986 3.22159437 4.83239156 0 0 Z " fill="#21163F" transform="translate(55,250)"/>
<path d="M0 0 C4.29 0 8.58 0 13 0 C12.67 1.65 12.34 3.3 12 5 C8.04 5 4.08 5 0 5 C0 4.34 0 3.68 0 3 C-1.98 3.33 -3.96 3.66 -6 4 C-6 4.33 -6 4.66 -6 5 C-8.64 5 -11.28 5 -14 5 C-13.34 4.01 -12.68 3.02 -12 2 C-9.1796875 1.70703125 -9.1796875 1.70703125 -5.875 1.8125 C-4.23144531 1.85310547 -4.23144531 1.85310547 -2.5546875 1.89453125 C-1.29011719 1.94673828 -1.29011719 1.94673828 0 2 C0 1.34 0 0.68 0 0 Z " fill="#E9A560" transform="translate(235,139)"/>
<path d="M0 0 C1.33333333 0 2.66666667 0 4 0 C4.34615998 5.65394631 3.43425238 9.03006806 1 14 C0.01 13.01 -0.98 12.02 -2 11 C-2.28875 11.804375 -2.5775 12.60875 -2.875 13.4375 C-4 16 -4 16 -6 17 C-5.57664615 10.50857435 -3.08900201 5.66507011 0 0 Z " fill="#1A52A0" transform="translate(15,76)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.02691685 2.45840605 1.04679802 4.91651882 1.0625 7.375 C1.07087891 8.07367188 1.07925781 8.77234375 1.08789062 9.4921875 C1.11328125 14.7734375 1.11328125 14.7734375 0 17 C0.99 17.33 1.98 17.66 3 18 C2.814375 18.763125 2.62875 19.52625 2.4375 20.3125 C1.77180827 23.08967375 1.77180827 23.08967375 3 26 C2.34 26 1.68 26 1 26 C0.67 26.66 0.34 27.32 0 28 C-0.66 28 -1.32 28 -2 28 C-2 28.66 -2 29.32 -2 30 C-2.99 29.67 -3.98 29.34 -5 29 C-4.8659375 28.47535156 -4.731875 27.95070313 -4.59375 27.41015625 C-2.35329103 18.31566161 -0.55407939 9.36203101 0 0 Z " fill="#271A3C" transform="translate(207,54)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 1.32 2 2.64 2 4 C2.66 4.33 3.32 4.66 4 5 C4.33 5.99 4.66 6.98 5 8 C5.99 7.67 6.98 7.34 8 7 C8 8.32 8 9.64 8 11 C1.375 12.125 1.375 12.125 -2 11 C-2 11.66 -2 12.32 -2 13 C-2.66 13 -3.32 13 -4 13 C-4 12.01 -4 11.02 -4 10 C-4.66 9.67 -5.32 9.34 -6 9 C-5.01 8.67 -4.02 8.34 -3 8 C-2.67 6.02 -2.34 4.04 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#3B172A" transform="translate(61,227)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.51171177 3.76933784 2.00715127 7.54065321 2.5 11.3125 C2.64308594 12.36501953 2.78617188 13.41753906 2.93359375 14.50195312 C5.30988124 32.88989202 5.30988124 32.88989202 2.890625 36.78710938 C1.5 38.1875 1.5 38.1875 -1 40 C-1 39.01 -1 38.02 -1 37 C-0.34 37 0.32 37 1 37 C1.09920769 31.91836166 1.04480803 26.93173932 0.5 21.875 C-0.2437272 14.59485343 -0.08252674 7.3082016 0 0 Z " fill="#EB7F23" transform="translate(180,145)"/>
<path d="M0 0 C0 3.09846963 -0.45765158 4.32371547 -1.75 7.0625 C-3.69187225 11.25502278 -5.37023492 15.50321029 -6.97265625 19.8359375 C-8.05670394 22.11944481 -9.00322051 23.45635501 -11 25 C-11.99 25 -12.98 25 -14 25 C-12.61735163 22.13132769 -11.07851447 19.43975968 -9.375 16.75 C-8.92898437 16.04359375 -8.48296875 15.3371875 -8.0234375 14.609375 C-7.68570313 14.07828125 -7.34796875 13.5471875 -7 13 C-7.33 12.67 -7.66 12.34 -8 12 C-9.65 12.66 -11.3 13.32 -13 14 C-12.62488281 13.56429687 -12.24976563 13.12859375 -11.86328125 12.6796875 C-11.35152344 12.08414063 -10.83976563 11.48859375 -10.3125 10.875 C-9.76722656 10.24078125 -9.22195312 9.6065625 -8.66015625 8.953125 C-7.1659602 7.19524729 -5.70541285 5.41494059 -4.25 3.625 C-2 1 -2 1 0 0 Z " fill="#D3783F" transform="translate(232,89)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C0.01 4.485 0.01 4.485 -1 6 C-0.34 6.33 0.32 6.66 1 7 C0.50628906 7.40992188 0.01257812 7.81984375 -0.49609375 8.2421875 C-1.13675781 8.78101563 -1.77742188 9.31984375 -2.4375 9.875 C-3.07558594 10.40867187 -3.71367187 10.94234375 -4.37109375 11.4921875 C-6.10805004 12.9222757 -6.10805004 12.9222757 -7 15 C-7.99 15 -8.98 15 -10 15 C-9.67 13.02 -9.34 11.04 -9 9 C-8.34 9 -7.68 9 -7 9 C-7.103125 8.2575 -7.20625 7.515 -7.3125 6.75 C-7 4 -7 4 -4.625 1.6875 C-2 0 -2 0 0 0 Z " fill="#1378BA" transform="translate(34,52)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 1.66 2 2.32 2 3 C4.475 3.495 4.475 3.495 7 4 C7 5.32 7 6.64 7 8 C8.65 8 10.3 8 12 8 C9.60204941 9.54472631 8.47318027 10.08455188 5.6171875 9.57421875 C4.71226562 9.28160156 3.80734375 8.98898438 2.875 8.6875 C-5.31263169 6.39171245 -13.55124619 6.27223762 -22 6 C-22 5.67 -22 5.34 -22 5 C-20.66195312 4.94392578 -20.66195312 4.94392578 -19.296875 4.88671875 C-18.12640625 4.82097656 -16.9559375 4.75523438 -15.75 4.6875 C-14.58984375 4.62949219 -13.4296875 4.57148437 -12.234375 4.51171875 C-8.89180362 3.98288197 -7.4502943 3.26227667 -5 1 C-4.34 1.66 -3.68 2.32 -3 3 C-3.33 3.66 -3.66 4.32 -4 5 C-2.35 5 -0.7 5 1 5 C0.67 3.35 0.34 1.7 0 0 Z " fill="#FBEAA6" transform="translate(125,106)"/>
<path d="M0 0 C0.4125 0.38671875 0.825 0.7734375 1.25 1.171875 C8.28561731 7.51649418 14.47680128 10.55911117 24 11 C22 13 22 13 18.375 13.125 C17.26125 13.08375 16.1475 13.0425 15 13 C15 13.66 15 14.32 15 15 C12.0625 14.1875 12.0625 14.1875 9 13 C8.67 12.01 8.34 11.02 8 10 C7.1028125 9.8453125 7.1028125 9.8453125 6.1875 9.6875 C2.70263694 8.59225732 1.72380524 6.07822364 0 3 C0 2.01 0 1.02 0 0 Z " fill="#9A2B14" transform="translate(23,216)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C6.84681133 5.08086796 7.09038099 9.84828377 7 15 C5 13 5 13 4 10 C3.01 10.33 2.02 10.66 1 11 C0.67 11.99 0.34 12.98 0 14 C-1.32 14 -2.64 14 -4 14 C-3.67 12.68 -3.34 11.36 -3 10 C-2.01 10 -1.02 10 0 10 C0 9.01 0 8.02 0 7 C0.66 7 1.32 7 2 7 C2 5.68 2 4.36 2 3 C1.01 2.67 0.02 2.34 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#F8A425" transform="translate(204,161)"/>
<path d="M0 0 C1.14275391 0.01353516 2.28550781 0.02707031 3.46289062 0.04101562 C6.24660963 0.0759577 9.02928664 0.12500989 11.8125 0.1875 C11.8125 0.8475 11.8125 1.5075 11.8125 2.1875 C11.15765625 2.20731934 10.5028125 2.22713867 9.828125 2.24755859 C6.82255552 2.34360522 3.81760669 2.45295784 0.8125 2.5625 C-0.21746094 2.5934375 -1.24742188 2.624375 -2.30859375 2.65625 C-9.39795856 2.92718114 -15.44605475 3.94035158 -22.1875 6.1875 C-22.8475 5.1975 -23.5075 4.2075 -24.1875 3.1875 C-15.98758539 0.44526389 -8.6089485 -0.19668951 0 0 Z " fill="#D24834" transform="translate(118.1875,124.8125)"/>
<path d="M0 0 C0 0.33 0 0.66 0 1 C-2.31 1 -4.62 1 -7 1 C-7.33 1.99 -7.66 2.98 -8 4 C-8.66 3.67 -9.32 3.34 -10 3 C-9.34 1.68 -8.68 0.36 -8 -1 C-23.345 -0.505 -23.345 -0.505 -39 0 C-31.25542902 -7.74457098 -9.39356926 -3.32936632 0 0 Z " fill="#E45417" transform="translate(133,115)"/>
<path d="M0 0 C0.680625 0.680625 1.36125 1.36125 2.0625 2.0625 C2.52785156 2.52140625 2.99320313 2.9803125 3.47265625 3.453125 C4.48620595 4.4796357 5.47406721 5.53219534 6.43359375 6.609375 C11.77279673 12.4145932 18.2618708 16.0390727 25 20 C25.99 20.66 26.98 21.32 28 22 C28 22.99 28 23.98 28 25 C18.63200286 22.42380079 13.01724882 17.35291616 7 10 C5.10160924 7.88199149 3.1952767 5.77149209 1.28515625 3.6640625 C0 2 0 2 0 0 Z " fill="#E9EDE7" transform="translate(56,187)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C2.05660762 6.33964572 1.74987305 11.35708284 0.546875 17.6484375 C-0.44433822 23.72315853 -0.68114925 29.85792772 -1 36 C-2.485 36.495 -2.485 36.495 -4 37 C-3.53039785 24.49886696 -2.02910881 12.34055482 0 0 Z " fill="#4D241F" transform="translate(271,139)"/>
<path d="M0 0 C-0.96099609 0.38091797 -0.96099609 0.38091797 -1.94140625 0.76953125 C-3.73732569 1.48415195 -5.53151853 2.20312275 -7.32421875 2.92578125 C-8.90526207 3.56050667 -10.48990249 4.18658575 -12.08203125 4.79296875 C-14.99063772 5.93993557 -16.96044335 6.96044335 -19.1875 9.1875 C-19.785625 9.785625 -20.38375 10.38375 -21 11 C-22.32 11 -23.64 11 -25 11 C-24.03549288 7.14197151 -23.11869385 6.07989009 -19.75 3.8125 C-13.76226618 0.74440498 -6.63239409 -2.21079803 0 0 Z " fill="#FBD030" transform="translate(144,44)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2.27972656 0.96679688 2.55945312 1.93359375 2.84765625 2.9296875 C5.39907536 11.35490064 8.38513882 18.08121371 14 25 C14.804375 26.03125 15.60875 27.0625 16.4375 28.125 C16.953125 28.74375 17.46875 29.3625 18 30 C13.32055871 28.62465117 11.61144922 26.56544982 8.9375 22.5625 C6.53561344 18.99058553 4.492873 16.49274451 1 14 C-0.56302777 9.57142131 -0.09111001 4.64661072 0 0 Z " fill="#1C2C55" transform="translate(58,159)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C3.33 2.98 3.66 4.96 4 7 C5.32 7.33 6.64 7.66 8 8 C7.67 8.99 7.34 9.98 7 11 C8.98 11 10.96 11 13 11 C13 11.33 13 11.66 13 12 C8.1666528 12.08333357 3.76307437 11.95261487 -1 11 C-1 10.34 -1 9.68 -1 9 C-1.99 8.34 -2.98 7.68 -4 7 C-2.84826645 4.53199953 -1.95216435 2.95216435 0 1 C0 0.67 0 0.34 0 0 Z " fill="#71232A" transform="translate(193,132)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C0.63422544 4.28493007 -1.20681345 6.43145705 -4.625 9.3125 C-5.44226563 10.00988281 -6.25953125 10.70726563 -7.1015625 11.42578125 C-7.72804687 11.94527344 -8.35453125 12.46476562 -9 13 C-9.76699219 12.51917969 -10.53398437 12.03835937 -11.32421875 11.54296875 C-13.97202082 10.01613398 -16.00037252 9.42851821 -19 9 C-19 8.67 -19 8.34 -19 8 C-18.12988281 7.83564453 -18.12988281 7.83564453 -17.2421875 7.66796875 C-12.37645195 6.68036896 -8.40925989 5.35844134 -4 3 C-1.625 2.3125 -1.625 2.3125 0 2 C0 1.34 0 0.68 0 0 Z " fill="#FC8907" transform="translate(195,68)"/>
<path d="M0 0 C0 1.32 0 2.64 0 4 C-0.66 4.66 -1.32 5.32 -2 6 C-2 6.33 -2 6.66 -2 7 C-4.31 7 -6.62 7 -9 7 C-8.67 5.35 -8.34 3.7 -8 2 C-11.3 2 -14.6 2 -18 2 C-18 1.67 -18 1.34 -18 1 C-15.69 1 -13.38 1 -11 1 C-11 0.34 -11 -0.32 -11 -1 C-3.57142857 -2.42857143 -3.57142857 -2.42857143 0 0 Z " fill="#730202" transform="translate(243,213)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3.33 2.97 3.66 5.94 4 9 C3.01 9.33 2.02 9.66 1 10 C0.67 10.66 0.34 11.32 0 12 C-0.99 12 -1.98 12 -3 12 C-3 12.99 -3 13.98 -3 15 C-3.99 15 -4.98 15 -6 15 C-5.48640535 9.8640535 -3.7815677 3.7815677 0 0 Z " fill="#160B26" transform="translate(180,203)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-0.99 2 -1.98 2 -3 2 C-2.34 4.31 -1.68 6.62 -1 9 C-1.66 9 -2.32 9 -3 9 C-3 8.34 -3 7.68 -3 7 C-3.99 7 -4.98 7 -6 7 C-6 8.98 -6 10.96 -6 13 C-7.32 13 -8.64 13 -10 13 C-10.66 11.68 -11.32 10.36 -12 9 C-10.68 9 -9.36 9 -8 9 C-8 8.01 -8 7.02 -8 6 C-8.66 5.67 -9.32 5.34 -10 5 C-9.34 4.34 -8.68 3.68 -8 3 C-8.33 2.01 -8.66 1.02 -9 0 C-5.67465243 -1.10844919 -3.37817425 -0.84454356 0 0 Z " fill="#720E0D" transform="translate(257,160)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C-0.99 3 -1.98 3 -3 3 C-3 3.99 -3 4.98 -3 6 C-4.65614657 6.38218767 -6.32457024 6.71395102 -8 7 C-8.33 6.67 -8.66 6.34 -9 6 C-9.4125 6.515625 -9.825 7.03125 -10.25 7.5625 C-10.8275 8.036875 -11.405 8.51125 -12 9 C-14.1875 8.6875 -14.1875 8.6875 -16 8 C-15.8125 6.1875 -15.8125 6.1875 -15 4 C-10.26130714 0.44598036 -5.79534668 -0.16558133 0 0 Z " fill="#1D0C25" transform="translate(219,118)"/>
<path d="M0 0 C0 0.33 0 0.66 0 1 C-1.65 1.33 -3.3 1.66 -5 2 C-4.01 2.66 -3.02 3.32 -2 4 C-2.94875 4.103125 -3.8975 4.20625 -4.875 4.3125 C-8.29107501 4.68539295 -8.29107501 4.68539295 -10 8 C-11.32 7.67 -12.64 7.34 -14 7 C-14 6.01 -14 5.02 -14 4 C-13.34 3.67 -12.68 3.34 -12 3 C-17.94 3 -23.88 3 -30 3 C-30 2.67 -30 2.34 -30 2 C-19.89658054 0.0320296 -10.2531361 -0.22102569 0 0 Z " fill="#FAE29C" transform="translate(127,67)"/>
<path d="M0 0 C3.3125 0.75 3.3125 0.75 6 2 C5.835 2.598125 5.67 3.19625 5.5 3.8125 C4.8885876 6.11344336 4.8885876 6.11344336 5 9 C5.61875 8.79375 6.2375 8.5875 6.875 8.375 C7.926875 8.189375 7.926875 8.189375 9 8 C9.66 8.66 10.32 9.32 11 10 C9.68 10.33 8.36 10.66 7 11 C7.99 12.485 7.99 12.485 9 14 C5.47761953 12.43632643 2.72876006 10.30504111 -0.25 7.875 C-1.14203125 7.15054688 -2.0340625 6.42609375 -2.953125 5.6796875 C-3.96632812 4.84824219 -3.96632812 4.84824219 -5 4 C-2.70703125 1.953125 -2.70703125 1.953125 0 0 Z " fill="#4A2942" transform="translate(49,240)"/>
<path d="M0 0 C0.74636719 0.0825 1.49273437 0.165 2.26171875 0.25 C1.93171875 1.57 1.60171875 2.89 1.26171875 4.25 C1.92171875 4.25 2.58171875 4.25 3.26171875 4.25 C3.26171875 4.91 3.26171875 5.57 3.26171875 6.25 C3.92171875 6.25 4.58171875 6.25 5.26171875 6.25 C5.26171875 6.91 5.26171875 7.57 5.26171875 8.25 C4.60171875 8.25 3.94171875 8.25 3.26171875 8.25 C3.26171875 9.57 3.26171875 10.89 3.26171875 12.25 C4.25171875 12.25 5.24171875 12.25 6.26171875 12.25 C5.60171875 13.57 4.94171875 14.89 4.26171875 16.25 C1.49064995 13.90408148 0.74112591 12.10223799 0.07421875 8.5625 C-0.08433594 7.75425781 -0.24289063 6.94601563 -0.40625 6.11328125 C-0.51582031 5.49839844 -0.62539062 4.88351563 -0.73828125 4.25 C-3.59887035 5.60937085 -5.59755824 6.89520469 -7.73828125 9.25 C-8.39828125 8.92 -9.05828125 8.59 -9.73828125 8.25 C-8.69428379 6.90213008 -7.62726059 5.57207271 -6.55078125 4.25 C-5.95910156 3.5075 -5.36742187 2.765 -4.7578125 2 C-2.73828125 0.25 -2.73828125 0.25 0 0 Z " fill="#78181A" transform="translate(66.73828125,102.75)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C4.97008031 7.48976775 6.22553475 14.9129682 6 23 C5.34 23.66 4.68 24.32 4 25 C4 22.03 4 19.06 4 16 C3.34 16 2.68 16 2 16 C1.67 12.37 1.34 8.74 1 5 C-0.65 5.33 -2.3 5.66 -4 6 C-2.7260411 3.96166576 -1.38938077 1.96147874 0 0 Z " fill="#4E1313" transform="translate(186,192)"/>
<path d="M0 0 C0 1.32 0 2.64 0 4 C-2.94839041 4.9827968 -4.94130972 5 -8 5 C-8.99 5.495 -8.99 5.495 -10 6 C-10 4.68 -10 3.36 -10 2 C-10.83144531 2.75796875 -10.83144531 2.75796875 -11.6796875 3.53125 C-12.40414062 4.1809375 -13.12859375 4.830625 -13.875 5.5 C-14.59429687 6.1496875 -15.31359375 6.799375 -16.0546875 7.46875 C-18 9 -18 9 -20 9 C-19.09447999 5.74012795 -18.06692589 4.06516468 -15.625 1.6875 C-10.42935413 -0.73116273 -5.63922179 -0.32849836 0 0 Z " fill="#5C1223" transform="translate(119,139)"/>
<path d="M0 0 C4.77378396 1.5587866 7.25661538 3.02716339 10.375 7 C13.53668504 10.9144672 16.24166523 12.24667205 21.08203125 13.4296875 C23 14 23 14 25 16 C24.67 16.99 24.34 17.98 24 19 C23.443125 18.360625 22.88625 17.72125 22.3125 17.0625 C19.77933439 14.80319013 18.31658576 14.36850953 15 14 C15.33 16.64 15.66 19.28 16 22 C15.34 22 14.68 22 14 22 C13.84144531 21.34773438 13.68289063 20.69546875 13.51953125 20.0234375 C11.55121825 12.65041974 9.25517078 7.99420235 2.6875 3.75 C1.800625 3.1725 0.91375 2.595 0 2 C0 1.34 0 0.68 0 0 Z " fill="#CA805C" transform="translate(244,119)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C0.00390625 4.13671875 0.00390625 4.13671875 -1.4375 6.6875 C-3.77506067 11.17431785 -4.73065803 13.98977352 -4 19 C-2.04783565 20.95216435 -0.46800047 21.84826645 2 23 C-4.36 23.48 -4.36 23.48 -7 21.5 C-9.18535842 16.03660396 -6.98306071 9.95205644 -4.8984375 4.69921875 C-3.69877954 2.43030044 -2.23002709 1.23035977 0 0 Z " fill="#EE8B3B" transform="translate(217,81)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 0.99 3 1.98 3 3 C3.99 3 4.98 3 6 3 C6 2.01 6 1.02 6 0 C6.66 0 7.32 0 8 0 C7.125 5.75 7.125 5.75 6 8 C5.34 8 4.68 8 4 8 C4.33 9.98 4.66 11.96 5 14 C4.01 14 3.02 14 2 14 C2 11.03 2 8.06 2 5 C1.38125 5.495 0.7625 5.99 0.125 6.5 C-2 8 -2 8 -4 8 C-4 7.01 -4 6.02 -4 5 C-3.34 5 -2.68 5 -2 5 C-1.67 4.01 -1.34 3.02 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#408BCF" transform="translate(73,47)"/>
<path d="M0 0 C0 3 0 3 -1.9765625 5.15625 C-2.85054687 5.9296875 -3.72453125 6.703125 -4.625 7.5 C-5.91277344 8.66015625 -5.91277344 8.66015625 -7.2265625 9.84375 C-10.0277358 12.02156361 -12.78089287 13.52732929 -16 15 C-15.44121968 11.64731808 -14.90469511 8.83760701 -13 6 C-10.21484375 4.55078125 -10.21484375 4.55078125 -6.9375 3.3125 C-3.19453783 2.11295137 -3.19453783 2.11295137 0 0 Z " fill="#161323" transform="translate(167,177)"/>
<path d="M0 0 C2.4375 0.75 2.4375 0.75 5 2 C5.8125 4.125 5.8125 4.125 6 6 C8.31 6.33 10.62 6.66 13 7 C13 8.65 13 10.3 13 12 C12.01 12 11.02 12 10 12 C10 11.34 10 10.68 10 10 C8.37828761 9.61102839 6.75245075 9.23921702 5.125 8.875 C4.22007813 8.66617188 3.31515625 8.45734375 2.3828125 8.2421875 C1.59648438 8.16226563 0.81015625 8.08234375 0 8 C-0.66 8.66 -1.32 9.32 -2 10 C-1.54177532 6.53058454 -1.10868317 3.32604951 0 0 Z " fill="#812D2D" transform="translate(74,135)"/>
<path d="M0 0 C0.9075 0.391875 1.815 0.78375 2.75 1.1875 C1.87794785 4.75498607 1.2925095 6.73296501 -1.5625 9.125 C-4.64856735 10.34507314 -6.12802451 10.1686923 -9.25 9.1875 C-8.59 8.5275 -7.93 7.8675 -7.25 7.1875 C-7.29125 6.383125 -7.3325 5.57875 -7.375 4.75 C-7.25 2.1875 -7.25 2.1875 -5.625 0.25 C-3.25 -0.8125 -3.25 -0.8125 0 0 Z " fill="#F82B0A" transform="translate(136.25,90.8125)"/>
<path d="M0 0 C0 0.33 0 0.66 0 1 C-1.65 1.33 -3.3 1.66 -5 2 C-4.34 2.33 -3.68 2.66 -3 3 C-3 5.31 -3 7.62 -3 10 C-1.68 10.66 -0.36 11.32 1 12 C-3.53030991 11.46702236 -6.45025069 9.83979945 -10 7 C-11.375 4.25 -11.375 4.25 -12 2 C-8.15820154 -2.0018734 -5.05897886 -0.92747946 0 0 Z " fill="#150D30" transform="translate(77,254)"/>
<path d="M0 0 C2.31 0 4.62 0 7 0 C7 0.66 7 1.32 7 2 C9.97 2.495 9.97 2.495 13 3 C13 3.33 13 3.66 13 4 C8.64007129 4.04945386 4.28029138 4.08574488 -0.07983398 4.10986328 C-1.56293583 4.11991821 -3.04601788 4.13356404 -4.52905273 4.15087891 C-6.66134531 4.17515006 -8.79337569 4.18648799 -10.92578125 4.1953125 C-12.85031128 4.21102295 -12.85031128 4.21102295 -14.8137207 4.22705078 C-18 4 -18 4 -21 2 C-10.605 1.505 -10.605 1.505 0 1 C0 0.67 0 0.34 0 0 Z " fill="#8B5C47" transform="translate(228,142)"/>
<path d="M0 0 C1.125 7.75 1.125 7.75 0 10 C-1.32 10 -2.64 10 -4 10 C-4 8.02 -4 6.04 -4 4 C-6.31 4.33 -8.62 4.66 -11 5 C-10 2 -10 2 -7.75 0.25 C-4.58923143 -1.18671298 -3.25229215 -1.02214896 0 0 Z " fill="#2568B8" transform="translate(51,67)"/>
<path d="M0 0 C5.13178334 0.64147292 10.05194727 1.46439743 15 3 C15.33 3.99 15.66 4.98 16 6 C15 7 15 7 11.875 7.25 C7.35102116 6.9581304 4.93534002 6.20379041 1 4 C0.0625 1.8125 0.0625 1.8125 0 0 Z " fill="#F3E6C9" transform="translate(85,210)"/>
<path d="M0 0 C1.67542976 0.28604898 3.34385343 0.61781233 5 1 C5 1.66 5 2.32 5 3 C4.34 3 3.68 3 3 3 C3 3.66 3 4.32 3 5 C-0.77222089 6.75163456 -3.666639 7.22490027 -7.8125 7.125 C-9.27623047 7.09792969 -9.27623047 7.09792969 -10.76953125 7.0703125 C-11.50558594 7.04710937 -12.24164063 7.02390625 -13 7 C-12.34 6.67 -11.68 6.34 -11 6 C-11 5.34 -11 4.68 -11 4 C-10.28972656 3.79503906 -9.57945312 3.59007812 -8.84765625 3.37890625 C-7.92855469 3.10949219 -7.00945312 2.84007812 -6.0625 2.5625 C-5.14597656 2.29566406 -4.22945312 2.02882812 -3.28515625 1.75390625 C-1.0597507 1.20973949 -1.0597507 1.20973949 0 0 Z " fill="#F8C490" transform="translate(156,177)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.71347424 5.42240423 -0.21422561 8.63759582 -2.6875 13.25390625 C-4.78888118 17.65054605 -5.89403749 22.27043675 -7 27 C-7.66 26.34 -8.32 25.68 -9 25 C-8.83437183 16.05607909 -4.84795603 7.4073518 0 0 Z " fill="#F3EBBA" transform="translate(53,112)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C2.93709126 3.06874001 4.87464629 3.95147598 6.9375 4.75 C10.01519613 6.61527038 11.78746776 9.17287546 14 12 C6.25 13.125 6.25 13.125 4 12 C3.375 8.9375 3.375 8.9375 3 6 C2.01 6 1.02 6 0 6 C-1 3 -1 3 0 0 Z " fill="#1C7EC6" transform="translate(37,55)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C1.03329274 3.62227634 -0.7623745 5.818952 -3.37890625 7.8125 C-6.25054932 10.20910226 -8.12339303 12.68184185 -10.25 15.75 C-11.47893268 17.5148582 -12.72305629 19.26956226 -14 21 C-14.33 21 -14.66 21 -15 21 C-15.37118645 16.66949137 -14.61821463 14.4628 -12 11 C-10.29069166 9.40383737 -8.53468381 7.90314256 -6.71875 6.4296875 C-4.95978177 5.02350814 -4.95978177 5.02350814 -3.40625 3.3203125 C-2 2 -2 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#F4DDA4" transform="translate(69,95)"/>
<path d="M0 0 C3 3.625 3 3.625 3 7 C3.99 7 4.98 7 6 7 C6 6.34 6 5.68 6 5 C10.455 4.505 10.455 4.505 15 4 C11.60199889 7.39800111 6.78332285 8.19971046 2.28515625 9.68359375 C-0.7385445 10.89523127 -1.91782315 11.65916764 -4 14 C-7.1875 15.1875 -7.1875 15.1875 -10 16 C-8 13 -8 13 -5 12 C-5 10.68 -5 9.36 -5 8 C-3.68 8 -2.36 8 -1 8 C0.33333333 5 0.33333333 5 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#4473A8" transform="translate(74,59)"/>
<path d="M0 0 C4.29 0 8.58 0 13 0 C12.67 1.65 12.34 3.3 12 5 C7.71 5 3.42 5 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#F38312" transform="translate(221,226)"/>
<path d="M0 0 C2.02408755 0.09002398 4.04544287 0.24641038 6.0625 0.4375 C7.71958984 0.59025391 7.71958984 0.59025391 9.41015625 0.74609375 C10.26480469 0.82988281 11.11945313 0.91367188 12 1 C12.33 2.65 12.66 4.3 13 6 C11.35 6 9.7 6 8 6 C7.67 5.01 7.34 4.02 7 3 C6.67 3.99 6.34 4.98 6 6 C2.7 6 -0.6 6 -4 6 C-1.125 1.125 -1.125 1.125 0 0 Z " fill="#FAFB9F" transform="translate(113,105)"/>
<path d="M0 0 C0.4125 0.639375 0.825 1.27875 1.25 1.9375 C3.17810487 4.20990931 4.11424181 4.60196439 7 5 C7 5.99 7 6.98 7 8 C7.66 8.33 8.32 8.66 9 9 C6.69 9.33 4.38 9.66 2 10 C2 10.66 2 11.32 2 12 C0.68 11.67 -0.64 11.34 -2 11 C-1.67 9.35 -1.34 7.7 -1 6 C-1.66 5.67 -2.32 5.34 -3 5 C-3 3 -3 3 -1.5 1.375 C-1.005 0.92125 -0.51 0.4675 0 0 Z " fill="#121D54" transform="translate(210,66)"/>
<path d="M0 0 C0.82638376 2.89234315 1 4.88742431 1 8 C-0.0625 9.8125 -0.0625 9.8125 -2 11 C-4.34148732 10.72982839 -6.67504723 10.38749213 -9 10 C-11.34260643 10.2602896 -13.6817571 10.57420028 -16 11 C-16 10.34 -16 9.68 -16 9 C-12.7 8.34 -9.4 7.68 -6 7 C-5.67 5.68 -5.34 4.36 -5 3 C-3.35 2.67 -1.7 2.34 0 2 C0 1.34 0 0.68 0 0 Z " fill="#399BDC" transform="translate(103,31)"/>
<path d="M0 0 C2.4375 0.375 2.4375 0.375 5 1 C5.33 1.66 5.66 2.32 6 3 C4.02 3.99 4.02 3.99 2 5 C2 5.99 2 6.98 2 8 C1.6937566 9.33981486 1.36548445 10.67511887 1 12 C-0.32 12.33 -1.64 12.66 -3 13 C-3 12.34 -3 11.68 -3 11 C-3.66 10.67 -4.32 10.34 -5 10 C-5 8.68 -5 7.36 -5 6 C-4.34 6 -3.68 6 -3 6 C-2.690625 5.38125 -2.38125 4.7625 -2.0625 4.125 C-1.375 2.75 -0.6875 1.375 0 0 Z " fill="#94110B" transform="translate(222,163)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C0.66 3 1.32 3 2 3 C2 3.66 2 4.32 2 5 C2.99 5 3.98 5 5 5 C5 5.66 5 6.32 5 7 C2.59454362 8.20272819 1.05003047 8.10071472 -1.625 8.0625 C-2.85089844 8.04896484 -2.85089844 8.04896484 -4.1015625 8.03515625 C-5.04128906 8.01775391 -5.04128906 8.01775391 -6 8 C-6.33 6.35 -6.66 4.7 -7 3 C-2.25 0 -2.25 0 0 0 Z " fill="#F7670E" transform="translate(194,86)"/>
<path d="M0 0 C0.66 3.3 1.32 6.6 2 10 C1.01 10.33 0.02 10.66 -1 11 C-1 10.34 -1 9.68 -1 9 C-1.94875 8.9175 -2.8975 8.835 -3.875 8.75 C-7 8 -7 8 -8.375 5.9375 C-8.58125 5.298125 -8.7875 4.65875 -9 4 C-3.375 0 -3.375 0 0 0 Z " fill="#3088D7" transform="translate(54,56)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.67 1.99 3.34 2.98 3 4 C2.34 3.67 1.68 3.34 1 3 C0.34 5.97 -0.32 8.94 -1 12 C-1.66 12 -2.32 12 -3 12 C-3.33 12.99 -3.66 13.98 -4 15 C-4 14.34 -4 13.68 -4 13 C-5.32 13 -6.64 13 -8 13 C-8 11.68 -8 10.36 -8 9 C-7.01 8.67 -6.02 8.34 -5 8 C-5 6.68 -5 5.36 -5 4 C-4.01 3.67 -3.02 3.34 -2 3 C-1.34 2.01 -0.68 1.02 0 0 Z " fill="#0D2969" transform="translate(201,42)"/>
<path d="M0 0 C2 2 2 2 2.265625 4.46875 C2.20372041 16.47824024 -0.44183071 25.90033585 -5 37 C-6.33384217 32.99847349 -5.31990305 30.88822612 -4.125 26.875 C-3.75632813 25.61429688 -3.38765625 24.35359375 -3.0078125 23.0546875 C-2 20 -2 20 -1 19 C-0.84379445 17.58672053 -0.74943827 16.1664541 -0.68359375 14.74609375 C-0.64169922 13.89208984 -0.59980469 13.03808594 -0.55664062 12.15820312 C-0.51732422 11.26037109 -0.47800781 10.36253906 -0.4375 9.4375 C-0.39431641 8.53580078 -0.35113281 7.63410156 -0.30664062 6.70507812 C-0.20021858 4.47021515 -0.09820012 2.23523692 0 0 Z " fill="#DF6E3A" transform="translate(182,31)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.89604368 6.04829486 2.11269443 11.8894576 2 18 C-1.96 18.495 -1.96 18.495 -6 19 C-5.6875 17.125 -5.6875 17.125 -5 15 C-4.01 14.34 -3.02 13.68 -2 13 C-1.19458793 9.89188713 -1.19458793 9.89188713 -0.8125 6.375 C-0.65394531 5.18648437 -0.49539062 3.99796875 -0.33203125 2.7734375 C-0.22246094 1.85820312 -0.11289063 0.94296875 0 0 Z " fill="#512639" transform="translate(212,197)"/>
<path d="M0 0 C2.95918198 0.11358476 5.91676783 0.24033086 8.875 0.375 C10.13763672 0.42140625 10.13763672 0.42140625 11.42578125 0.46875 C12.63427734 0.52675781 12.63427734 0.52675781 13.8671875 0.5859375 C14.61081543 0.6173584 15.35444336 0.6487793 16.12060547 0.68115234 C18 1 18 1 20 3 C17.36 3 14.72 3 12 3 C11.67 3.99 11.34 4.98 11 6 C8.36 6 5.72 6 3 6 C2.87625 5.195625 2.7525 4.39125 2.625 3.5625 C2.315625 2.2940625 2.315625 2.2940625 2 1 C1.34 0.67 0.68 0.34 0 0 Z " fill="#0B112F" transform="translate(95,199)"/>
<path d="M0 0 C4.82360189 -0.19294408 8.49646738 0.24252386 13 2 C12.3125 4.4375 12.3125 4.4375 11 7 C8.625 8.0625 8.625 8.0625 6 8 C3.083468 5.75010389 1.44245971 3.36573933 0 0 Z " fill="#7B1918" transform="translate(77,135)"/>
<path d="M0 0 C3.3 0.33 6.6 0.66 10 1 C10 1.66 10 2.32 10 3 C11.0828125 2.7215625 11.0828125 2.7215625 12.1875 2.4375 C15.12826973 1.98004693 17.14103058 2.26483643 20 3 C20 3.99 20 4.98 20 6 C18.68 6.33 17.36 6.66 16 7 C16 6.34 16 5.68 16 5 C14.73542969 5.05220703 14.73542969 5.05220703 13.4453125 5.10546875 C12.34960938 5.13253906 11.25390625 5.15960938 10.125 5.1875 C8.48917969 5.23970703 8.48917969 5.23970703 6.8203125 5.29296875 C5.88960937 5.19628906 4.95890625 5.09960938 4 5 C3.34 4.01 2.68 3.02 2 2 C1.34 2 0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#0B0516" transform="translate(195,234)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C3.01508358 3.73323796 3.01508358 3.73323796 5 4 C5 3.01 5 2.02 5 1 C5.66 1 6.32 1 7 1 C7.66 1.99 8.32 2.98 9 4 C9.99 4.33 10.98 4.66 12 5 C11.67 5.99 11.34 6.98 11 8 C9.35 7.01 7.7 6.02 6 5 C6 6.65 6 8.3 6 10 C4.35 10 2.7 10 1 10 C1 8.68 1 7.36 1 6 C0.01 5.67 -0.98 5.34 -2 5 C-1.34 3.35 -0.68 1.7 0 0 Z " fill="#1B265F" transform="translate(6,118)"/>
<path d="M0 0 C0.86625 0.20625 1.7325 0.4125 2.625 0.625 C6.17059104 2.6777106 7.18294863 5.36589726 9 9 C3 6 3 6 1 3 C0.236875 3.33 -0.52625 3.66 -1.3125 4 C-4 5 -4 5 -7 5 C-7 4.01 -7 3.02 -7 2 C-7.99 2.33 -8.98 2.66 -10 3 C-10 2.34 -10 1.68 -10 1 C-6.39600817 -1.35645619 -4.10336262 -1.00490513 0 0 Z " fill="#FCEA5E" transform="translate(164,93)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-0.66 2 -1.32 2 -2 2 C-2 2.66 -2 3.32 -2 4 C-11.5876432 7.57152712 -19.6824369 10.37367432 -30 10 C-26.43146794 7.96854346 -22.78387787 7.10468751 -18.8125 6.125 C-13.50428131 4.77912756 -8.55224295 3.16872984 -3.63671875 0.734375 C-2 0 -2 0 0 0 Z " fill="#35130B" transform="translate(156,220)"/>
<path d="M0 0 C1.0415625 0.13277344 2.083125 0.26554688 3.15625 0.40234375 C13.09558205 1.63760903 22.9979906 2.48845712 33 3 C26.133798 7.577468 15.49612842 5.15404807 7.6875 3.625 C3.88671875 2.8515625 3.88671875 2.8515625 1 2 C0.67 1.34 0.34 0.68 0 0 Z " fill="#F6CF9E" transform="translate(204,220)"/>
<path d="M0 0 C0.33 1.32 0.66 2.64 1 4 C0.01 3.67 -0.98 3.34 -2 3 C-1.34 3 -0.68 3 0 3 C0 2.01 0 1.02 0 0 Z M-3 4 C-2.67 4 -2.34 4 -2 4 C-2.75 11.625 -2.75 11.625 -5 15 C-5.66 15 -6.32 15 -7 15 C-7 15.66 -7 16.32 -7 17 C-8.29233607 18.37310707 -9.62437146 19.71034824 -11 21 C-11.66 20.67 -12.32 20.34 -13 20 C-12.38080922 18.53919067 -11.75443308 17.08142545 -11.125 15.625 C-10.77695313 14.81289062 -10.42890625 14.00078125 -10.0703125 13.1640625 C-8.55073726 10.09163665 -6.86489062 8.90992708 -4 7 C-3.67 6.01 -3.34 5.02 -3 4 Z " fill="#FBBF91" transform="translate(176,170)"/>
<path d="M0 0 C0 1.32 0 2.64 0 4 C-1.45452497 5.29291108 -2.91812287 6.58065292 -4.46484375 7.76171875 C-6.34473848 9.2780715 -7.66470428 10.99705641 -9 13 C-10.9375 12.625 -10.9375 12.625 -13 12 C-13.33 11.34 -13.66 10.68 -14 10 C-12.75160501 8.894019 -11.50120766 7.79029799 -10.25 6.6875 C-9.55390625 6.07261719 -8.8578125 5.45773438 -8.140625 4.82421875 C-2.47965739 0 -2.47965739 0 0 0 Z " fill="#F89122" transform="translate(132,48)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C1.66 2.33 2.32 2.66 3 3 C2.01 4.485 2.01 4.485 1 6 C0.34 6 -0.32 6 -1 6 C-1 6.66 -1 7.32 -1 8 C-1.66 8 -2.32 8 -3 8 C-2.01 9.32 -1.02 10.64 0 12 C-0.99 12.66 -1.98 13.32 -3 14 C-3 13.34 -3 12.68 -3 12 C-4.32 12 -5.64 12 -7 12 C-6.67 10.35 -6.34 8.7 -6 7 C-6.66 6.67 -7.32 6.34 -8 6 C-8 4.68 -8 3.36 -8 2 C-6.68 2 -5.36 2 -4 2 C-3.67 2.66 -3.34 3.32 -3 4 C-2.01 2.68 -1.02 1.36 0 0 Z " fill="#2E83DB" transform="translate(119,39)"/>
<path d="M0 0 C1.99267584 1.86192283 2.92846769 3.38992958 3.24755859 6.11132812 C3.29513603 8.66311554 3.26098224 11.19884745 3.1875 13.75 C3.17396484 14.63816406 3.16042969 15.52632812 3.14648438 16.44140625 C3.11121309 18.62822578 3.06192752 20.81379966 3 23 C2.34 22.01 1.68 21.02 1 20 C0.01 19.67 -0.98 19.34 -2 19 C-1.84660156 18.32582031 -1.69320312 17.65164062 -1.53515625 16.95703125 C-0.91516143 13.53122048 -0.6647426 10.16106553 -0.4375 6.6875 C-0.35371094 5.43324219 -0.26992187 4.17898437 -0.18359375 2.88671875 C-0.12300781 1.93410156 -0.06242188 0.98148438 0 0 Z " fill="#F05006" transform="translate(179,27)"/>
<path d="M0 0 C0.66 0.99 1.32 1.98 2 3 C5.02419525 2.41196203 8.01758453 1.77321882 11 1 C7.46453515 5.18772976 3.25224611 7.07436777 -1.625 9.3125 C-2.40101563 9.68439453 -3.17703125 10.05628906 -3.9765625 10.43945312 C-8.26933712 12.44051213 -8.26933712 12.44051213 -10 13 C-10.66 12.67 -11.32 12.34 -12 12 C-9.3534665 9.3534665 -6.43778736 8.40058003 -3 7 C-3 6.34 -3 5.68 -3 5 C-4.32 4.67 -5.64 4.34 -7 4 C-4.69 4 -2.38 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#0D1043" transform="translate(206,255)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C2.59791618 6.62917348 0.71069698 9.00386479 -3 13 C-5.4375 12.625 -5.4375 12.625 -8 12 C-8.33 11.34 -8.66 10.68 -9 10 C-8.236875 9.773125 -7.47375 9.54625 -6.6875 9.3125 C-3.40615736 7.70998383 -2.57962712 6.2382356 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#EFDCB3" transform="translate(159,151)"/>
<path d="M0 0 C1.1445351 3.76976245 0.5716871 5.3943649 -1 9 C-1 9.99 -1 10.98 -1 12 C-0.34 12.33 0.32 12.66 1 13 C1 13.66 1 14.32 1 15 C-1.8125 16.5625 -1.8125 16.5625 -5 18 C-5.99 17.67 -6.98 17.34 -8 17 C-6.51095825 13.10391502 -4.75621287 9.40902982 -2.875 5.6875 C-2.06675781 4.08455078 -2.06675781 4.08455078 -1.2421875 2.44921875 C-0.62730469 1.23685547 -0.62730469 1.23685547 0 0 Z " fill="#1C0E31" transform="translate(204,71)"/>
<path d="M0 0 C2.31 0.66 4.62 1.32 7 2 C7 3.32 7 4.64 7 6 C4.69 6.33 2.38 6.66 0 7 C0 7.66 0 8.32 0 9 C-0.99 9 -1.98 9 -3 9 C-3.66 7.35 -4.32 5.7 -5 4 C-4.01 4 -3.02 4 -2 4 C-1.34 2.68 -0.68 1.36 0 0 Z " fill="#2779CD" transform="translate(80,57)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C4.33 0.99 4.66 1.98 5 3 C7.64 2.67 10.28 2.34 13 2 C12.375 3.875 12.375 3.875 11 6 C7.875 7.25 7.875 7.25 5 8 C5 7.01 5 6.02 5 5 C3.68 5 2.36 5 1 5 C1 8.96 1 12.92 1 17 C0.67 17 0.34 17 0 17 C0 11.39 0 5.78 0 0 Z " fill="#380808" transform="translate(212,180)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C5.0326802 3.78823655 5.04509293 4.8677274 4.0625 7.75 C3.711875 8.4925 3.36125 9.235 3 10 C1.35 10 -0.3 10 -2 10 C-2.33 9.01 -2.66 8.02 -3 7 C-4.65 6.67 -6.3 6.34 -8 6 C-8 5.67 -8 5.34 -8 5 C-5.36 4.34 -2.72 3.68 0 3 C0 2.01 0 1.02 0 0 Z " fill="#480708" transform="translate(247,173)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C4.00060017 6.61615806 4.24246007 12.61503266 4.125 19.5 C4.11597656 20.51320312 4.10695312 21.52640625 4.09765625 22.5703125 C4.07429007 25.04712801 4.04153168 27.52343379 4 30 C3.67 30 3.34 30 3 30 C2.49511485 25.93809157 1.9969481 21.87538649 1.5 17.8125 C1.35691406 16.66201172 1.21382812 15.51152344 1.06640625 14.32617188 C0.86337891 12.65844727 0.86337891 12.65844727 0.65625 10.95703125 C0.53056641 9.93585205 0.40488281 8.91467285 0.27539062 7.86254883 C0.02102932 5.21858939 -0.05115721 2.6537801 0 0 Z " fill="#BD3306" transform="translate(187,156)"/>
<path d="M0 0 C2.97 0.495 2.97 0.495 6 1 C5.01 1.495 5.01 1.495 4 2 C3.690625 2.78375 3.38125 3.5675 3.0625 4.375 C1.98607083 7.03441325 1.33243257 8.35865856 -1 10 C-3.6875 10.1875 -3.6875 10.1875 -6 10 C-4.6302836 6.00499382 -2.74277578 3.19990508 0 0 Z " fill="#F8E3BC" transform="translate(206,133)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 0.66 2 1.32 2 2 C2.99 2.33 3.98 2.66 5 3 C4.01 3.66 3.02 4.32 2 5 C2.33 6.32 2.66 7.64 3 9 C-0.94727588 9.17942163 -3.5980513 9.09350689 -7 7 C-6.6875 5.125 -6.6875 5.125 -6 3 C-5.01 2.34 -4.02 1.68 -3 1 C-3 1.66 -3 2.32 -3 3 C-2.01 3 -1.02 3 0 3 C0 2.01 0 1.02 0 0 Z " fill="#8D170E" transform="translate(246,160)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.33 2.31 1.66 4.62 2 7 C4.41645782 7.16687448 4.41645782 7.16687448 7 7 C7.66 6.34 8.32 5.68 9 5 C9.99 5 10.98 5 12 5 C12 3.35 12 1.7 12 0 C12.33 0 12.66 0 13 0 C13 3.96 13 7.92 13 12 C12.34 12 11.68 12 11 12 C10.34 10.68 9.68 9.36 9 8 C8.071875 8.680625 7.14375 9.36125 6.1875 10.0625 C5.135625 10.701875 4.08375 11.34125 3 12 C2.01 11.67 1.02 11.34 0 11 C0 7.37 0 3.74 0 0 Z " fill="#6C1A21" transform="translate(134,133)"/>
<path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C2.66 1.34 3.32 0.68 4 0 C4.33 1.32 4.66 2.64 5 4 C0.6507177 7.02033493 0.6507177 7.02033493 -2 6.9375 C-4.68630914 5.67829259 -6.76045038 3.92850106 -9 2 C-5.88401212 0.15348866 -3.61754103 -0.38079379 0 0 Z " fill="#D31908" transform="translate(139,123)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.10957031 0.56589844 1.21914062 1.13179688 1.33203125 1.71484375 C1.49058594 2.44832031 1.64914063 3.18179688 1.8125 3.9375 C1.96332031 4.66839844 2.11414063 5.39929688 2.26953125 6.15234375 C2.51058594 6.76207031 2.75164062 7.37179688 3 8 C3.99 8.33 4.98 8.66 6 9 C5.938125 10.11375 5.87625 11.2275 5.8125 12.375 C5.874375 13.57125 5.93625 14.7675 6 16 C6.99 16.66 7.98 17.32 9 18 C10.06246527 19.96752828 11.07137808 21.96587579 12 24 C10.35 24 8.7 24 7 24 C7.33 23.34 7.66 22.68 8 22 C7.67 21.34 7.34 20.68 7 20 C6.01 19.690625 6.01 19.690625 5 19.375 C4.34 18.92125 3.68 18.4675 3 18 C2.375 14.0625 2.375 14.0625 2.2734375 11.97265625 C2.10160814 9.68093968 2.10160814 9.68093968 0 7 C-0.07905064 4.66800612 -0.08798769 2.33167378 0 0 Z " fill="#FBBE2B" transform="translate(171,92)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C0.360625 3.598125 -0.27875 4.19625 -0.9375 4.8125 C-3.20310389 6.90810337 -3.20310389 6.90810337 -4 10 C-4.66 10 -5.32 10 -6 10 C-5.01 11.65 -4.02 13.3 -3 15 C-4.65 15.66 -6.3 16.32 -8 17 C-7.34 17.66 -6.68 18.32 -6 19 C-7.65 18.67 -9.3 18.34 -11 18 C-10.61686024 12.57082802 -8.46164368 9.55148745 -4.9375 5.625 C-4.46505859 5.07972656 -3.99261719 4.53445312 -3.50585938 3.97265625 C-2.34782921 2.63916697 -1.17533989 1.31825781 0 0 Z " fill="#D32104" transform="translate(170,59)"/>
<path d="M0 0 C0.22893297 3.03336186 0.36475845 5.97465051 0 9 C-2 11.0625 -2 11.0625 -4 12 C-4.66 11.67 -5.32 11.34 -6 11 C-6 10.34 -6 9.68 -6 9 C-6.66 8.67 -7.32 8.34 -8 8 C-6.65580512 3.85539913 -4.87800266 0 0 0 Z " fill="#2B0818" transform="translate(259,203)"/>
<path d="M0 0 C-0.31179644 2.83341232 -0.62441917 5.66672955 -0.9375 8.5 C-1.02451172 9.29148438 -1.11152344 10.08296875 -1.20117188 10.8984375 C-1.75884509 15.93815103 -2.35972612 20.97010066 -3 26 C-3.33 26 -3.66 26 -4 26 C-4 17.75 -4 9.5 -4 1 C-2 0 -2 0 0 0 Z " fill="#AA2204" transform="translate(267,155)"/>
<path d="M0 0 C0 1.98 0 3.96 0 6 C-0.33 4.68 -0.66 3.36 -1 2 C-1.66 2 -2.32 2 -3 2 C-3 3.65 -3 5.3 -3 7 C-5.375 7.625 -5.375 7.625 -8 8 C-8.66 7.34 -9.32 6.68 -10 6 C-9.82229322 3.24554484 -9.17311088 2.17929341 -7.25 0.1875 C-4.3995411 -1.31690887 -3.01911587 -0.92250763 0 0 Z " fill="#F1A812" transform="translate(235,124)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C2.65 3.33 4.3 3.66 6 4 C6 4.99 6 5.98 6 7 C5.01 7 4.02 7 3 7 C3.33 7.7425 3.66 8.485 4 9.25 C5 12 5 12 5 16 C4.01 16 3.02 16 2 16 C1.67 16.66 1.34 17.32 1 18 C0.67 12.06 0.34 6.12 0 0 Z " fill="#E8470A" transform="translate(210,161)"/>
<path d="M0 0 C1.98 0.66 3.96 1.32 6 2 C5.97679687 2.84304687 5.95359375 3.68609375 5.9296875 4.5546875 C5.91164062 5.65039062 5.89359375 6.74609375 5.875 7.875 C5.84019531 9.51082031 5.84019531 9.51082031 5.8046875 11.1796875 C5.69939466 14.1371051 5.69939466 14.1371051 8 16 C6.02 16 4.04 16 2 16 C1.34 10.72 0.68 5.44 0 0 Z " fill="#EB9E32" transform="translate(184,141)"/>
<path d="M0 0 C-1 3 -1 3 -4.125 4.625 C-10.4566266 6.83990967 -17.35450956 6.74906351 -24 7 C-21.28523485 5.19015657 -19.68908906 4.50635562 -16.62109375 3.7109375 C-15.78255859 3.49179688 -14.94402344 3.27265625 -14.08007812 3.046875 C-13.20802734 2.82515625 -12.33597656 2.6034375 -11.4375 2.375 C-10.56158203 2.14554688 -9.68566406 1.91609375 -8.78320312 1.6796875 C-2.28941127 0 -2.28941127 0 0 0 Z " fill="#8A483B" transform="translate(259,215)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5 0.99 5 1.98 5 3 C4.01 3.33 3.02 3.66 2 4 C3.423125 4.12375 3.423125 4.12375 4.875 4.25 C8 5 8 5 9.4375 6.9375 C10 9 10 9 9 11 C5.23914141 10.47765853 2.58873942 9.87637713 0 7 C-0.25 3.3125 -0.25 3.3125 0 0 Z " fill="#8F2112" transform="translate(40,202)"/>
<path d="M0 0 C2.5 2.25 2.5 2.25 5 5 C5 6.32 5 7.64 5 9 C4.01 9.33 3.02 9.66 2 10 C1.01 11.485 1.01 11.485 0 13 C-1.9375 12.6875 -1.9375 12.6875 -4 12 C-4.33 11.01 -4.66 10.02 -5 9 C-3.68 8.67 -2.36 8.34 -1 8 C-0.67 5.36 -0.34 2.72 0 0 Z " fill="#F7E8D3" transform="translate(147,112)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C2.64363134 2.72159424 4.31050386 3.39351421 6 4 C6 4.66 6 5.32 6 6 C8.51083114 4.74458443 8.87125446 3.49936512 10 1 C11.98 1 13.96 1 16 1 C15.34 2.32 14.68 3.64 14 5 C13.01 5 12.02 5 11 5 C11 5.99 11 6.98 11 8 C9.02 8.33 7.04 8.66 5 9 C5 8.01 5 7.02 5 6 C4.01 5.67 3.02 5.34 2 5 C2 4.34 2 3.68 2 3 C1.34 3 0.68 3 0 3 C0 2.01 0 1.02 0 0 Z " fill="#1C5AAA" transform="translate(181,24)"/>
<path d="M0 0 C1.125 3.75 1.125 3.75 0 6 C-0.53625 5.731875 -1.0725 5.46375 -1.625 5.1875 C-4.57282601 4.95477689 -5.04811495 5.5799856 -7.25 7.4375 C-8.61125 8.7059375 -8.61125 8.7059375 -10 10 C-11.0448029 6.86559131 -11.15317663 5.97903963 -10 3 C-6.64781163 0.76520776 -4.01177204 0 0 0 Z " fill="#7B1E24" transform="translate(169,119)"/>
<path d="M0 0 C-0.41575062 4.85042388 -2.41659978 6.84319505 -6 10 C-6.99 10.66 -7.98 11.32 -9 12 C-9 9.36 -9 6.72 -9 4 C-2.25 0 -2.25 0 0 0 Z " fill="#E8672D" transform="translate(56,87)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0 4 0 4 -3 5 C-4.21869929 7.50447516 -4.21869929 7.50447516 -5 10 C-4.34 10 -3.68 10 -3 10 C-3 10.66 -3 11.32 -3 12 C-2.34 12.33 -1.68 12.66 -1 13 C-3.97 13 -6.94 13 -10 13 C-9.55212676 8.35026146 -7.97814403 6.62972532 -4.4375 3.6875 C-3.61121094 2.99011719 -2.78492188 2.29273438 -1.93359375 1.57421875 C-1.29550781 1.05472656 -0.65742188 0.53523438 0 0 Z " fill="#2539A5" transform="translate(146,43)"/>
<path d="M0 0 C-1 3 -1 3 -3.4375 4.25 C-6 5 -6 5 -8 4 C-15.66832743 4.84113281 -23.01819737 6.97528579 -29 12 C-29.66 11.67 -30.32 11.34 -31 11 C-25.33019871 5.27469017 -20.51006592 3.62479596 -12.6875 2.125 C-11.68654297 1.91359375 -10.68558594 1.7021875 -9.65429688 1.484375 C-2.51676644 0 -2.51676644 0 0 0 Z " fill="#C7A14B" transform="translate(149,40)"/>
<path d="M0 0 C1.875 1.5 1.875 1.5 3 3 C1.35 2.67 -0.3 2.34 -2 2 C-2.12375 2.61875 -2.2475 3.2375 -2.375 3.875 C-3 6 -3 6 -5 8 C-6.32 8 -7.64 8 -9 8 C-9.75 6.25 -9.75 6.25 -10 4 C-7.18943915 -0.04720762 -4.80405361 -0.71549735 0 0 Z " fill="#AB2E11" transform="translate(240,151)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.67 1.99 1.34 2.98 1 4 C1.66 3.67 2.32 3.34 3 3 C4.99960012 2.960008 7.00047242 2.95653201 9 3 C9 4.32 9 5.64 9 7 C9.99 7.33 10.98 7.66 12 8 C11.67 8.99 11.34 9.98 11 11 C10.34 11 9.68 11 9 11 C9 10.34 9 9.68 9 9 C8.01 9 7.02 9 6 9 C6 7.68 6 6.36 6 5 C5.44570312 5.16757813 4.89140625 5.33515625 4.3203125 5.5078125 C3.59585938 5.71148437 2.87140625 5.91515625 2.125 6.125 C1.04605469 6.43824219 1.04605469 6.43824219 -0.0546875 6.7578125 C-0.69664062 6.83773437 -1.33859375 6.91765625 -2 7 C-2.66 6.34 -3.32 5.68 -4 5 C-2.68 3.35 -1.36 1.7 0 0 Z " fill="#16183B" transform="translate(226,85)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C0.54625 2.4125 0.0925 2.825 -0.375 3.25 C-3.0683243 6.15050309 -4.17891388 9.16826478 -5 13 C-7 13 -7 13 -8.625 11.5 C-9.07875 11.005 -9.5325 10.51 -10 10 C-9.649375 9.38125 -9.29875 8.7625 -8.9375 8.125 C-8.628125 7.42375 -8.31875 6.7225 -8 6 C-8.33 5.34 -8.66 4.68 -9 4 C-6.03 2.68 -3.06 1.36 0 0 Z " fill="#FDEC2D" transform="translate(158,55)"/>
<path d="M0 0 C0.598125 0.185625 1.19625 0.37125 1.8125 0.5625 C4.16408762 1.22093687 4.16408762 1.22093687 7 0 C8 3 8 3 7 6 C6 7 6 7 3.93359375 7.09765625 C3.10988281 7.08605469 2.28617188 7.07445312 1.4375 7.0625 C0.61121094 7.05347656 -0.21507812 7.04445313 -1.06640625 7.03515625 C-1.70449219 7.02355469 -2.34257812 7.01195312 -3 7 C-3 5.68 -3 4.36 -3 3 C-2.01 2.67 -1.02 2.34 0 2 C0 1.34 0 0.68 0 0 Z " fill="#2278CD" transform="translate(145,33)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 3.3 2 6.6 2 10 C0.02 10 -1.96 10 -4 10 C-4 7.36 -4 4.72 -4 2 C-2.68 2 -1.36 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#3B0F16" transform="translate(177,229)"/>
<path d="M0 0 C0.23658921 8.26747851 -0.18655665 15.92046224 -2 24 C-4 22 -4 22 -4.1875 18.4375 C-4 15 -4 15 -3 14 C-2.84327223 10.47362528 -2.95971031 7.38094149 -4 4 C-4.66 4 -5.32 4 -6 4 C-6 3.34 -6 2.68 -6 2 C-1.125 0 -1.125 0 0 0 Z " fill="#341A2C" transform="translate(62,123)"/>
<path d="M0 0 C1.20628008 2.33214148 2.1654738 4.49642139 3 7 C4.65 7.33 6.3 7.66 8 8 C8 9.65 8 11.3 8 13 C6.68 13.33 5.36 13.66 4 14 C3.401875 13.0925 2.80375 12.185 2.1875 11.25 C0.928517 9.37951098 -0.36573513 7.52976912 -1.75 5.75 C-3 4 -3 4 -3 2 C-2.01 2 -1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#280817" transform="translate(253,117)"/>
<path d="M0 0 C-3.24653973 2.16435982 -6.01658979 3.07789203 -9.75 4.1875 C-10.94109375 4.55230469 -12.1321875 4.91710937 -13.359375 5.29296875 C-17.25325914 6.04918445 -20.13458734 5.77803819 -24 5 C-21.22011666 3.49056108 -18.72416914 2.60895955 -15.625 2 C-12.84926408 1.43120166 -10.42807357 0.79102688 -7.75 -0.1875 C-4.71200098 -1.08509062 -3.00539937 -0.88394099 0 0 Z " fill="#112C7C" transform="translate(190,272)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 1.32 2 2.64 2 4 C3.65 4 5.3 4 7 4 C5.1875 5.0625 5.1875 5.0625 3 6 C2.01 5.67 1.02 5.34 0 5 C-0.66 6.98 -1.32 8.96 -2 11 C-2.66 11 -3.32 11 -4 11 C-6.125 6.375 -6.125 6.375 -5 3 C-3.35 2.67 -1.7 2.34 0 2 C0 1.34 0 0.68 0 0 Z " fill="#0D051D" transform="translate(170,236)"/>
<path d="M0 0 C-1 1 -1 1 -3.22485352 1.11352539 C-4.18319092 1.10828857 -5.14152832 1.10305176 -6.12890625 1.09765625 C-7.68061523 1.09282227 -7.68061523 1.09282227 -9.26367188 1.08789062 C-10.35228516 1.07951172 -11.44089844 1.07113281 -12.5625 1.0625 C-14.2012207 1.05573242 -14.2012207 1.05573242 -15.87304688 1.04882812 C-18.58208495 1.03699826 -21.29101599 1.02051543 -24 1 C-24 0.67 -24 0.34 -24 0 C-6.41017488 -4.27344992 -6.41017488 -4.27344992 0 0 Z " fill="#D79355" transform="translate(127,229)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C0.979375 0.60328125 0.95875 1.2065625 0.9375 1.828125 C1.0046369 4.42968004 1.17742067 6.52373786 2 9 C4.45237931 10.97538375 7.02049588 12.02945538 10 13 C9.67 14.32 9.34 15.64 9 17 C8.4225 16.67 7.845 16.34 7.25 16 C4.80116138 14.72924102 4.80116138 14.72924102 1 15 C-1.14699969 11.55824478 -1.09856795 9.2279708 -0.625 5.25 C-0.51414063 4.26515625 -0.40328125 3.2803125 -0.2890625 2.265625 C-0.19367187 1.51796875 -0.09828125 0.7703125 0 0 Z " fill="#E5700C" transform="translate(39,200)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C4.1875 4.5625 4.1875 4.5625 5 8 C4.34 8 3.68 8 3 8 C2.67 8.99 2.34 9.98 2 11 C0.35 10.67 -1.3 10.34 -3 10 C-2.69201674 8.51988629 -2.378482 7.04092675 -2.0625 5.5625 C-1.88847656 4.73878906 -1.71445313 3.91507813 -1.53515625 3.06640625 C-1 1 -1 1 0 0 Z " fill="#082458" transform="translate(83,195)"/>
<path d="M0 0 C-0.33 2.31 -0.66 4.62 -1 7 C-0.34 7 0.32 7 1 7 C1 8.32 1 9.64 1 11 C0.01 11.495 0.01 11.495 -1 12 C-1.40729228 14.32156597 -1.74438677 16.6568787 -2 19 C-2.33 19 -2.66 19 -3 19 C-3.89604368 12.95170514 -4.11269443 7.1105424 -4 1 C-2 0 -2 0 0 0 Z " fill="#4F0B0F" transform="translate(198,180)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C-0.55945313 2.79117188 -1.11890625 2.58234375 -1.6953125 2.3671875 C-6.21480403 1.64713292 -10.22196831 4.74152364 -14 7 C-16.09167072 8.58369355 -18.02376988 10.27079865 -20 12 C-20.66 12 -21.32 12 -22 12 C-22 11.01 -22 10.02 -22 9 C-21.34 9 -20.68 9 -20 9 C-19.67 8.01 -19.34 7.02 -19 6 C-18.34 6.33 -17.68 6.66 -17 7 C-17 6.34 -17 5.68 -17 5 C-16.34 5 -15.68 5 -15 5 C-15 4.34 -15 3.68 -15 3 C-13.44033782 2.491217 -11.87710759 1.99336531 -10.3125 1.5 C-9.44238281 1.2215625 -8.57226562 0.943125 -7.67578125 0.65625 C-5.00608323 0.00149195 -2.73603316 -0.11831495 0 0 Z " fill="#352030" transform="translate(227,73)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C-3.82989106 4.80230168 -6.78121808 5.19622241 -11 5 C-11 5.66 -11 6.32 -11 7 C-18.92 7.495 -18.92 7.495 -27 8 C-24.26102123 6.17401415 -22.99675056 5.62506238 -19.91015625 5 C-19.12576172 4.835 -18.34136719 4.67 -17.53320312 4.5 C-16.31020508 4.2525 -16.31020508 4.2525 -15.0625 4 C-13.44817678 3.67175001 -11.834846 3.33857307 -10.22265625 3 C-9.50859619 2.855625 -8.79453613 2.71125 -8.05883789 2.5625 C-5.18578228 1.77754564 -2.99276223 0 0 0 Z " fill="#F5930B" transform="translate(118,59)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C2.98 2 4.96 2 7 2 C7 4.31 7 6.62 7 9 C4.36 8.67 1.72 8.34 -1 8 C-0.67 5.36 -0.34 2.72 0 0 Z " fill="#78AFE1" transform="translate(51,45)"/>
<path d="M0 0 C-0.33 0.66 -0.66 1.32 -1 2 C-4.45543355 2.9584773 -7.72998328 3.11853811 -11.30078125 3.09765625 C-12.27724609 3.09443359 -13.25371094 3.09121094 -14.25976562 3.08789062 C-15.26716797 3.07951172 -16.27457031 3.07113281 -17.3125 3.0625 C-18.33923828 3.05798828 -19.36597656 3.05347656 -20.42382812 3.04882812 C-22.94927882 3.03708184 -25.47460905 3.02065565 -28 3 C-28 2.34 -28 1.68 -28 1 C-27.39003174 0.97494385 -26.78006348 0.9498877 -26.15161133 0.92407227 C-23.37172102 0.8075942 -20.5921266 0.68510368 -17.8125 0.5625 C-16.85279297 0.52318359 -15.89308594 0.48386719 -14.90429688 0.44335938 C-13.97294922 0.40146484 -13.04160156 0.35957031 -12.08203125 0.31640625 C-11.22843018 0.27974854 -10.3748291 0.24309082 -9.49536133 0.20532227 C-6.95027345 0.05054951 -6.95027345 0.05054951 -4.30737305 -0.58227539 C-2 -1 -2 -1 0 0 Z " fill="#C37744" transform="translate(151,200)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C2.465748 8.42805098 2.25105076 16.55540739 1 25 C-1.39360466 21.27241013 -1.23525829 17.97534615 -1.1875 13.625 C-1.18105469 12.33851563 -1.17460937 11.05203125 -1.16796875 9.7265625 C-1.01773328 6.39343149 -0.63299294 3.2713075 0 0 Z " fill="#762726" transform="translate(193,184)"/>
<path d="M0 0 C3.96 1.98 3.96 1.98 8 4 C7.67 4.66 7.34 5.32 7 6 C4.525 5.01 4.525 5.01 2 4 C2.33 5.093125 2.66 6.18625 3 7.3125 C4.32985532 12.52890432 4.17693984 17.65248469 4 23 C1.90242439 19.46584949 1.41896271 16.10768301 0.875 12.0625 C0.70742187 10.85722656 0.53984375 9.65195313 0.3671875 8.41015625 C0.06077845 5.56446373 -0.07588456 2.85651173 0 0 Z " fill="#F9DF94" transform="translate(182,137)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C-6.57627476 8.95912347 -6.57627476 8.95912347 -11 10 C-11.66 9.67 -12.32 9.34 -13 9 C-12.8125 7.125 -12.8125 7.125 -12 5 C-9.8125 3.875 -9.8125 3.875 -7 3 C-3.20908429 2.01708512 -3.20908429 2.01708512 0 0 Z " fill="#1F1540" transform="translate(239,239)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 1.65 1 3.3 1 5 C2.32 5.66 3.64 6.32 5 7 C4.01 7 3.02 7 2 7 C1.67 9.31 1.34 11.62 1 14 C3.97 14.33 6.94 14.66 10 15 C10 15.33 10 15.66 10 16 C8.741875 16.020625 7.48375 16.04125 6.1875 16.0625 C5.47980469 16.07410156 4.77210937 16.08570313 4.04296875 16.09765625 C2 16 2 16 -1 15 C-2.1875 12.9375 -2.1875 12.9375 -3 11 C-2.67 10.67 -2.34 10.34 -2 10 C-1.79300437 8.50503158 -1.63320741 7.0033408 -1.5 5.5 C-1.11111111 1.11111111 -1.11111111 1.11111111 0 0 Z " fill="#FDF196" transform="translate(34,210)"/>
<path d="M0 0 C1 3 1 3 0.875 6 C0.72201755 8.96732325 0.72201755 8.96732325 2.3125 10.8125 C4.10476225 12.19455846 4.10476225 12.19455846 7 13 C8.35439668 15.70879335 8.06501451 18.00933268 8 21 C7.67 21 7.34 21 7 21 C6.938125 20.236875 6.87625 19.47375 6.8125 18.6875 C6.24093374 15.80623326 6.24093374 15.80623326 3.625 14.3125 C2.75875 13.879375 1.8925 13.44625 1 13 C-2 11 -2 11 -3.4375 8.1875 C-4 5 -4 5 -2.125 2.125 C-1.42375 1.42375 -0.7225 0.7225 0 0 Z " fill="#FCE346" transform="translate(37,204)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C0.99 2.33 1.98 2.66 3 3 C2.071875 3.391875 1.14375 3.78375 0.1875 4.1875 C-3.29444328 6.16742853 -4.01598436 7.66324642 -6 11 C-7.32 11 -8.64 11 -10 11 C-10.66 12.32 -11.32 13.64 -12 15 C-11.52083273 10.33442398 -9.70886772 8.08557714 -6.5625 4.6875 C-5.75941406 3.80449219 -4.95632812 2.92148438 -4.12890625 2.01171875 C-2 0 -2 0 0 0 Z " fill="#800F0A" transform="translate(197,117)"/>
<path d="M0 0 C1.65 1.65 3.3 3.3 5 5 C4.34 5.66 3.68 6.32 3 7 C1.68 7 0.36 7 -1 7 C-1 7.66 -1 8.32 -1 9 C-1.99 9 -2.98 9 -4 9 C-4 9.66 -4 10.32 -4 11 C-4.99 10.67 -5.98 10.34 -7 10 C-6.34 10 -5.68 10 -5 10 C-4.67 7.36 -4.34 4.72 -4 2 C-2.68 2 -1.36 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#B32015" transform="translate(159,106)"/>
<path d="M0 0 C-1.485 1.485 -1.485 1.485 -3 3 C-2.01 2.67 -1.02 2.34 0 2 C-0.66 3.32 -1.32 4.64 -2 6 C-4.97 5.67 -7.94 5.34 -11 5 C-10.67 3.35 -10.34 1.7 -10 0 C-6.33694766 -0.74926071 -3.57644848 -1.2380014 0 0 Z " fill="#D83109" transform="translate(221,106)"/>
<path d="M0 0 C0.625 1.875 0.625 1.875 1 4 C0.34 4.66 -0.32 5.32 -1 6 C-1.6425235 8.06874034 -1.6425235 8.06874034 -2 10 C-3.32 10.33 -4.64 10.66 -6 11 C-6 11.99 -6 12.98 -6 14 C-8.25 16.25 -8.25 16.25 -11 18 C-13.171875 17.609375 -13.171875 17.609375 -15 17 C-14.36191406 16.44570313 -13.72382813 15.89140625 -13.06640625 15.3203125 C-12.24011719 14.59585938 -11.41382813 13.87140625 -10.5625 13.125 C-9.32693359 12.04605469 -9.32693359 12.04605469 -8.06640625 10.9453125 C-5.94017845 9.16761255 -5.94017845 9.16761255 -5 7 C-4.34 7 -3.68 7 -3 7 C-2.690625 6.030625 -2.38125 5.06125 -2.0625 4.0625 C-1 1 -1 1 0 0 Z " fill="#CC9C40" transform="translate(172,34)"/>
<path d="M0 0 C4.67570171 1.16892543 5.48582887 2.01200441 8 6 C8.75 9.8125 8.75 9.8125 9 13 C8.34 11.68 7.68 10.36 7 9 C6.34 9 5.68 9 5 9 C4.67 7.68 4.34 6.36 4 5 C3.01 7.97 2.02 10.94 1 14 C0.67 14 0.34 14 0 14 C0 9.38 0 4.76 0 0 Z " fill="#AF8251" transform="translate(173,18)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.66 4.29 2.32 8.58 3 13 C-3.75 11.875 -3.75 11.875 -7 9 C-6.67 8.34 -6.34 7.68 -6 7 C-4.35 7 -2.7 7 -1 7 C-0.67 4.69 -0.34 2.38 0 0 Z " fill="#2F0712" transform="translate(202,204)"/>
<path d="M0 0 C2.97 0.495 2.97 0.495 6 1 C6.6875 3.3125 6.6875 3.3125 7 6 C5.75 7.8125 5.75 7.8125 4 9 C3.01 9 2.02 9 1 9 C1 9.99 1 10.98 1 12 C0.34 11.67 -0.32 11.34 -1 11 C-0.34 9.02 0.32 7.04 1 5 C0.34 5 -0.32 5 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#3D0708" transform="translate(229,174)"/>
<path d="M0 0 C2.37806964 2.37806964 2.41640825 3.38400263 2.88671875 6.6484375 C3.02013672 7.57140625 3.15355469 8.494375 3.29101562 9.4453125 C3.42185547 10.41210938 3.55269531 11.37890625 3.6875 12.375 C3.82994141 13.3340625 3.97238281 14.293125 4.11914062 15.28125 C5.21621761 23.11907366 5.21621761 23.11907366 4 27 C2.32976245 24.04496433 1.69963834 21.68683399 1.4375 18.3125 C1.40493693 15.35818712 1.40493693 15.35818712 0 13 C-0.07258946 10.81360547 -0.08373783 8.62499611 -0.0625 6.4375 C-0.05347656 5.23996094 -0.04445312 4.04242188 -0.03515625 2.80859375 C-0.02355469 1.88175781 -0.01195312 0.95492187 0 0 Z " fill="#7D250D" transform="translate(185,169)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.34 1 2.68 1 2 1 C2.33 1.66 2.66 2.32 3 3 C4.32 2.67 5.64 2.34 7 2 C5.625 3.5 5.625 3.5 4 5 C3.34 5 2.68 5 2 5 C2 5.66 2 6.32 2 7 C3.98 7 5.96 7 8 7 C7.67 6.01 7.34 5.02 7 4 C8.65 4.33 10.3 4.66 12 5 C12.33 6.32 12.66 7.64 13 9 C11.39620659 9.05416188 9.79188594 9.09286638 8.1875 9.125 C7.29417969 9.14820313 6.40085938 9.17140625 5.48046875 9.1953125 C3 9 3 9 0 7 C-0.1875 3.375 -0.1875 3.375 0 0 Z " fill="#FADC7E" transform="translate(197,151)"/>
<path d="M0 0 C2.0625 0.6875 2.0625 0.6875 4 2 C4.75 4.125 4.75 4.125 5 6 C4.401875 6.268125 3.80375 6.53625 3.1875 6.8125 C0.95707307 7.86180044 0.95707307 7.86180044 -0.4375 9.625 C-2 11 -2 11 -4.6875 11.1875 C-5.450625 11.125625 -6.21375 11.06375 -7 11 C-5.68 10.01 -4.36 9.02 -3 8 C-3.66 7.34 -4.32 6.68 -5 6 C-4.34 5.67 -3.68 5.34 -3 5 C-2.835 4.34 -2.67 3.68 -2.5 3 C-2.335 2.34 -2.17 1.68 -2 1 C-1.34 0.67 -0.68 0.34 0 0 Z " fill="#C54F1F" transform="translate(248,147)"/>
<path d="M0 0 C-3.27987438 4.18903254 -7.69996191 4.04700263 -12.6796875 4.7265625 C-16.69473447 5.05721343 -20.05953663 4.77263988 -24 4 C-24 3.67 -24 3.34 -24 3 C-20.93852743 2.49357075 -17.87567701 1.99600678 -14.8125 1.5 C-13.94818359 1.35691406 -13.08386719 1.21382812 -12.19335938 1.06640625 C-8.09473423 0.40685738 -4.16773976 -0.20709266 0 0 Z " fill="#DFB39B" transform="translate(265,142)"/>
<path d="M0 0 C3.3 0.66 6.6 1.32 10 2 C10 2.33 10 2.66 10 3 C5.05 4.485 5.05 4.485 0 6 C-0.33 7.98 -0.66 9.96 -1 12 C-1.66 11.67 -2.32 11.34 -3 11 C-3 8.03 -3 5.06 -3 2 C-2.01 2 -1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#FA8E09" transform="translate(179,97)"/>
<path d="M0 0 C-1 2 -1 2 -3.11328125 3.109375 C-6.58283074 4.17981787 -9.56006502 4.2652895 -13.1875 4.25 C-15.03408203 4.25773437 -15.03408203 4.25773437 -16.91796875 4.265625 C-20 4 -20 4 -22 2 C-19.45887768 1.66198848 -16.91723254 1.32946621 -14.375 1 C-13.66214844 0.90460938 -12.94929688 0.80921875 -12.21484375 0.7109375 C-8.11178391 0.18393899 -4.14754258 -0.10466984 0 0 Z " fill="#FDFABB" transform="translate(139,66)"/>
<path d="M0 0 C-0.99 0.495 -0.99 0.495 -2 1 C-1.67 1.66 -1.34 2.32 -1 3 C-4.36792958 3.89811455 -7.47759563 4.04174847 -10.9375 4 C-14.74482472 3.95447145 -18.25810039 4.21223166 -22 5 C-17.25269181 1.36039706 -14.21871529 0.76198845 -8.3125 0.28125 C-1.73076923 -0.51923077 -1.73076923 -0.51923077 0 0 Z " fill="#D09C36" transform="translate(109,60)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C6 1.98 6 3.96 6 6 C5.34 5.34 4.68 4.68 4 4 C0.87525373 5.63473516 0.87525373 5.63473516 0.3125 8.125 C0.209375 8.74375 0.10625 9.3625 0 10 C-0.99 10 -1.98 10 -3 10 C-3.33 8.35 -3.66 6.7 -4 5 C-3.01 4.34 -2.02 3.68 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#BC4F37" transform="translate(205,179)"/>
<path d="M0 0 C2.93200474 2.85276137 5.64315404 5.65079784 8 9 C5 9 5 9 2 7 C-0.27912938 6.54605448 -0.27912938 6.54605448 -2.6875 6.375 C-3.89986328 6.26285156 -3.89986328 6.26285156 -5.13671875 6.1484375 C-5.75160156 6.09945312 -6.36648437 6.05046875 -7 6 C-6.21625 5.38125 -5.4325 4.7625 -4.625 4.125 C-2.03162353 2.10141339 -2.03162353 2.10141339 0 0 Z " fill="#211D26" transform="translate(125,170)"/>
<path d="M0 0 C1.41702513 0.14230808 2.8336096 0.28900746 4.25 0.4375 C5.43335938 0.55931641 5.43335938 0.55931641 6.640625 0.68359375 C8.84728444 0.97951993 10.88748009 1.29426879 13 2 C13.33 2.66 13.66 3.32 14 4 C14.928125 3.01 14.928125 3.01 15.875 2 C18 0 18 0 20 0 C18.4169423 4.2742558 15.49431596 6.26531794 12 9 C11.690625 8.236875 11.38125 7.47375 11.0625 6.6875 C8.10698839 2.83637881 4.57899591 2.18074737 0 1 C0 0.67 0 0.34 0 0 Z " fill="#F6B251" transform="translate(215,149)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 1.65 2 3.3 2 5 C0.68 5.33 -0.64 5.66 -2 6 C-2.0825 6.61875 -2.165 7.2375 -2.25 7.875 C-3 10 -3 10 -5.0625 11.25 C-5.701875 11.4975 -6.34125 11.745 -7 12 C-8.37780724 9.24438552 -7.92023755 7.90228766 -7 5 C-4.46916729 2.55352838 -3.5747073 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#FBFCF7" transform="translate(55,95)"/>
<path d="M0 0 C3.3 0.33 6.6 0.66 10 1 C10 2.65 10 4.3 10 6 C7.03 5.67 4.06 5.34 1 5 C0.67 3.35 0.34 1.7 0 0 Z " fill="#E6B894" transform="translate(205,229)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.22197585 2.10277123 1.42713637 4.20732302 1.625 6.3125 C1.74101562 7.48425781 1.85703125 8.65601563 1.9765625 9.86328125 C2 13 2 13 0 16 C-2.10633718 14.29171079 -2.93801608 13.47851584 -3.29296875 10.73828125 C-3.25816406 9.93777344 -3.22335938 9.13726562 -3.1875 8.3125 C-3.16042969 7.50425781 -3.13335937 6.69601563 -3.10546875 5.86328125 C-3.07066406 5.24839844 -3.03585938 4.63351563 -3 4 C-2.34 4 -1.68 4 -1 4 C-0.67 2.68 -0.34 1.36 0 0 Z " fill="#FBCE8B" transform="translate(177,153)"/>
<path d="M0 0 C5.625 -0.25 5.625 -0.25 9 2 C9 2.99 9 3.98 9 5 C5.535 6.485 5.535 6.485 2 8 C2 7.01 2 6.02 2 5 C1.34 4.67 0.68 4.34 0 4 C0 2.68 0 1.36 0 0 Z " fill="#FBEF9F" transform="translate(197,147)"/>
<path d="M0 0 C2.375 0.3125 2.375 0.3125 5 1 C7 4 7 4 7 6.5 C6 9 6 9 3.4375 10.8125 C-0.70021573 12.24189271 -3.65063225 12.2249673 -8 12 C-5.47519307 9.47519307 -3.86176966 9.44261367 -0.375 8.875 C0.62789062 8.70742187 1.63078125 8.53984375 2.6640625 8.3671875 C3.82035156 8.18542969 3.82035156 8.18542969 5 8 C4.34 7.67 3.68 7.34 3 7 C3 5.35 3 3.7 3 2 C1.68 2.33 0.36 2.66 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#E36C13" transform="translate(247,128)"/>
<path d="M0 0 C3.7538853 0.03381879 6.80692596 0.78527039 10.3125 2.1875 C10.3125 2.5175 10.3125 2.8475 10.3125 3.1875 C9.260625 3.31125 8.20875 3.435 7.125 3.5625 C3.4088472 3.99586451 3.4088472 3.99586451 0.625 5.4375 C-0.138125 5.685 -0.90125 5.9325 -1.6875 6.1875 C-4 4.8125 -4 4.8125 -5.6875 3.1875 C-4.01545508 -0.15658983 -4.14281259 0.21065149 0 0 Z " fill="#E02508" transform="translate(90.6875,123.8125)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C4.66 1.65 5.32 3.3 6 5 C6.77085937 4.71125 7.54171875 4.4225 8.3359375 4.125 C9.33882812 3.75375 10.34171875 3.3825 11.375 3 C12.37273437 2.62875 13.37046875 2.2575 14.3984375 1.875 C17 1 17 1 19 1 C18 4 18 4 15.3125 5.6875 C11.8523215 7.05851412 9.67758562 7.40862062 6 7 C5.01 6.34 4.02 5.68 3 5 C3 3.68 3 2.36 3 1 C2.01 0.67 1.02 0.34 0 0 Z " fill="#EE5A01" transform="translate(179,107)"/>
<path d="M0 0 C6.6 0 13.2 0 20 0 C20.33 0.99 20.66 1.98 21 3 C16.38 3 11.76 3 7 3 C7 2.34 7 1.68 7 1 C4.69 1 2.38 1 0 1 C0 0.67 0 0.34 0 0 Z " fill="#39B2E0" transform="translate(137,2)"/>
<path d="M0 0 C2.79192205 -0.05380578 5.5828141 -0.09357669 8.375 -0.125 C9.1690625 -0.14175781 9.963125 -0.15851563 10.78125 -0.17578125 C12.85492015 -0.19335473 14.92883241 -0.10335168 17 0 C17.66 0.66 18.32 1.32 19 2 C15.2689664 2.78548076 11.61555827 3.13863665 7.8125 3.25 C6.97332031 3.27578125 6.13414062 3.3015625 5.26953125 3.328125 C2.54258284 2.9338674 1.70153204 2.10613087 0 0 Z " fill="#190923" transform="translate(126,204)"/>
<path d="M0 0 C4.75 0.875 4.75 0.875 7 2 C7 3.65 7 5.3 7 7 C5.02 7.33 3.04 7.66 1 8 C-0.35439668 5.29120665 -0.06501451 2.99066732 0 0 Z " fill="#F7A411" transform="translate(220,132)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 2.65 2 4.3 2 6 C2.66 6.33 3.32 6.66 4 7 C3.01 7.33 2.02 7.66 1 8 C1 8.66 1 9.32 1 10 C-0.65 10 -2.3 10 -4 10 C-3.125 4.25 -3.125 4.25 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#214795" transform="translate(31,93)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.2575 1.4125 0.515 1.825 -0.25 2.25 C-3.02593849 3.85725007 -3.02593849 3.85725007 -4.9375 6.0625 C-7 8 -7 8 -10 8.9375 C-13.62620512 10.22178098 -14.86103235 11.87381652 -17 15 C-18.32 14.67 -19.64 14.34 -21 14 C-16.57128995 9.80685963 -12.39608292 6.37634117 -6.82421875 3.84765625 C-4.76991055 2.94009658 -4.76991055 2.94009658 -2.125 1.1875 C-1.42375 0.795625 -0.7225 0.40375 0 0 Z " fill="#C79247" transform="translate(76,68)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5.33 1.65 5.66 3.3 6 5 C5.01 5 4.02 5 3 5 C3.33 6.65 3.66 8.3 4 10 C3.34 10 2.68 10 2 10 C2 9.01 2 8.02 2 7 C0.68 6.67 -0.64 6.34 -2 6 C-1.34 4.02 -0.68 2.04 0 0 Z " fill="#2C2F65" transform="translate(215,64)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C-0.0869635 4.13044524 -0.81466639 4.45559583 -4 6 C-6.80218582 8.26330393 -7.81625839 10.63088927 -9 14 C-11.31 14 -13.62 14 -16 14 C-12.56846086 10.46808678 -9.02624938 7.2862495 -5.1875 4.1875 C-4.21167969 3.39730469 -3.23585938 2.60710938 -2.23046875 1.79296875 C-1.49441406 1.20128906 -0.75835937 0.60960938 0 0 Z " fill="#64BBDD" transform="translate(60,24)"/>
<path d="M0 0 C-0.33 0.99 -0.66 1.98 -1 3 C-3.9375 4.125 -3.9375 4.125 -7 5 C-7.99 5.495 -7.99 5.495 -9 6 C-9.33 6.99 -9.66 7.98 -10 9 C-11.32 9 -12.64 9 -14 9 C-13.67 8.01 -13.34 7.02 -13 6 C-12.01 5.67 -11.02 5.34 -10 5 C-9.67 4.01 -9.34 3.02 -9 2 C-5.5647952 -0.29013653 -4.014669 -0.17842973 0 0 Z " fill="#176FC0" transform="translate(196,17)"/>
<path d="M0 0 C2.45933991 0.11369211 4.9167909 0.24042651 7.375 0.375 C8.07367188 0.4059375 8.77234375 0.436875 9.4921875 0.46875 C14.7734375 0.7734375 14.7734375 0.7734375 17 3 C6.605 3.495 6.605 3.495 -4 4 C-2.68 3.67 -1.36 3.34 0 3 C0 2.01 0 1.02 0 0 Z " fill="#E6B541" transform="translate(215,232)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C-0.71182212 3.60334924 -1.89133813 3.99456691 -5.75 4.1875 C-6.8225 4.125625 -7.895 4.06375 -9 4 C-9 4.66 -9 5.32 -9 6 C-13.62 6.33 -18.24 6.66 -23 7 C-23 6.67 -23 6.34 -23 6 C-7 2 -7 2 -4.94433594 1.50170898 C-3.27651267 1.07135027 -1.63406205 0.54468735 0 0 Z " fill="#E8C38B" transform="translate(148,195)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C1.60328125 2 2.2065625 2 2.828125 2 C6.55208333 2 10.27604167 2 14 2 C14 2.99 14 3.98 14 5 C10.43528609 6.18823797 7.7441664 6.26274852 4 6 C1.5625 4.6875 1.5625 4.6875 0 3 C0 2.01 0 1.02 0 0 Z " fill="#372A39" transform="translate(101,159)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.2493357 1.60115576 1.47378648 3.20620159 1.6875 4.8125 C1.81511719 5.70582031 1.94273438 6.59914062 2.07421875 7.51953125 C2 10 2 10 0.51953125 11.82421875 C0.01808594 12.21222656 -0.48335938 12.60023438 -1 13 C-2.32 12.34 -3.64 11.68 -5 11 C-4.649375 10.21625 -4.29875 9.4325 -3.9375 8.625 C-3.628125 7.75875 -3.31875 6.8925 -3 6 C-3.33 5.34 -3.66 4.68 -4 4 C-3.01 3.67 -2.02 3.34 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#251A2E" transform="translate(118,149)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.16855469 1.61488281 3.16855469 1.61488281 2.3203125 2.2421875 C1.59585938 2.78101562 0.87140625 3.31984375 0.125 3.875 C-0.59429687 4.40867187 -1.31359375 4.94234375 -2.0546875 5.4921875 C-4.08252632 6.99873162 -4.08252632 6.99873162 -6 9 C-8.93453261 8.63318342 -9.86437246 8.13562754 -12 6 C-10.35 5.67 -8.7 5.34 -7 5 C-7 4.01 -7 3.02 -7 2 C-4.69 2 -2.38 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#41161B" transform="translate(223,119)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C4 1.32 4 2.64 4 4 C3.01 4 2.02 4 1 4 C1.33 4.99 1.66 5.98 2 7 C-3.75 5.125 -3.75 5.125 -6 4 C-8.0374763 3.77141886 -10.08040303 3.58975722 -12.125 3.4375 C-13.76855469 3.31181641 -13.76855469 3.31181641 -15.4453125 3.18359375 C-16.28835937 3.12300781 -17.13140625 3.06242187 -18 3 C-18 2.67 -18 2.34 -18 2 C-15.93757383 1.97282308 -13.87504297 1.9535242 -11.8125 1.9375 C-10.66394531 1.92589844 -9.51539063 1.91429688 -8.33203125 1.90234375 C-5.40699414 1.98807168 -2.83683709 2.32150977 0 3 C0 2.01 0 1.02 0 0 Z " fill="#532116" transform="translate(249,115)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 1.98 1 3.96 1 6 C1.66 6.33 2.32 6.66 3 7 C3 8.32 3 9.64 3 11 C0.69 11 -1.62 11 -4 11 C-3.67 8.69 -3.34 6.38 -3 4 C-2.34 4 -1.68 4 -1 4 C-0.67 2.68 -0.34 1.36 0 0 Z " fill="#23142C" transform="translate(270,106)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C0.34 3 -0.32 3 -1 3 C-1.66 5.64 -2.32 8.28 -3 11 C-3.99 11 -4.98 11 -6 11 C-6.103125 12.11375 -6.20625 13.2275 -6.3125 14.375 C-6.539375 15.57125 -6.76625 16.7675 -7 18 C-7.99 18.66 -8.98 19.32 -10 20 C-11 17 -11 17 -10.21142578 15.20654297 C-9.7936084 14.55830566 -9.37579102 13.91006836 -8.9453125 13.2421875 C-8.49542969 12.53449219 -8.04554687 11.82679687 -7.58203125 11.09765625 C-7.10121094 10.36417969 -6.62039062 9.63070312 -6.125 8.875 C-5.65191406 8.13378906 -5.17882812 7.39257812 -4.69140625 6.62890625 C-1.22169962 1.22169962 -1.22169962 1.22169962 0 0 Z " fill="#2879AB" transform="translate(26,58)"/>
<path d="M0 0 C1 3 1 3 0.25 5.19921875 C-2.79178511 11.25427223 -6.28436558 16.13487861 -11 21 C-11 17.01601747 -9.28095986 14.16588074 -7 11 C-6.01 10.34 -5.02 9.68 -4 9 C-2.77803891 6.82389333 -2.77803891 6.82389333 -1.8125 4.375 C-1.29623047 3.14910156 -1.29623047 3.14910156 -0.76953125 1.8984375 C-0.51558594 1.27195313 -0.26164063 0.64546875 0 0 Z " fill="#FA4C0C" transform="translate(203,59)"/>
<path d="M0 0 C1 3 1 3 -0.21484375 5.69921875 C-0.78332031 6.68535156 -1.35179687 7.67148437 -1.9375 8.6875 C-2.78634766 10.17830078 -2.78634766 10.17830078 -3.65234375 11.69921875 C-4.09707031 12.45847656 -4.54179687 13.21773437 -5 14 C-5.99 13.34 -6.98 12.68 -8 12 C-10.67145537 12.80161791 -10.67145537 12.80161791 -13 14 C-10.74627044 11.65958853 -8.4855695 9.59055531 -5.9375 7.5625 C-3.18879146 5.16469043 -1.65176931 3.21177365 0 0 Z " fill="#FDDB1B" transform="translate(174,40)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-0.99 2 -1.98 2 -3 2 C-2.67 3.32 -2.34 4.64 -2 6 C-3.98 6.33 -5.96 6.66 -8 7 C-8.33 6.01 -8.66 5.02 -9 4 C-9.66 3.67 -10.32 3.34 -11 3 C-4.5 0 -4.5 0 0 0 Z " fill="#1D0F20" transform="translate(100,241)"/>
<path d="M0 0 C0 3.60573896 -0.81707462 4.41336566 -3 7.1875 C-3.556875 7.90292969 -4.11375 8.61835938 -4.6875 9.35546875 C-5.120625 9.89816406 -5.55375 10.44085938 -6 11 C-6.66 10.67 -7.32 10.34 -8 10 C-8 9.34 -8 8.68 -8 8 C-9.32 7.34 -10.64 6.68 -12 6 C-11.30132812 5.73445312 -10.60265625 5.46890625 -9.8828125 5.1953125 C-8.97273438 4.84210938 -8.06265625 4.48890625 -7.125 4.125 C-6.22007813 3.77695313 -5.31515625 3.42890625 -4.3828125 3.0703125 C-1.87782993 2.11469105 -1.87782993 2.11469105 0 0 Z " fill="#DCC5B1" transform="translate(130,183)"/>
<path d="M0 0 C3.3 0 6.6 0 10 0 C10 0.66 10 1.32 10 2 C9.34 2 8.68 2 8 2 C8.99 3.98 9.98 5.96 11 8 C10.34 8 9.68 8 9 8 C8.67 8.99 8.34 9.98 8 11 C7.34 10.34 6.68 9.68 6 9 C6.66 9 7.32 9 8 9 C7.25675659 6.60510457 6.52942646 5.29222384 4.30859375 4.06640625 C2.55926499 3.32780077 0.78065851 2.65950315 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#402835" transform="translate(261,129)"/>
<path d="M0 0 C2.52259061 1.97420135 2.9929808 2.96745642 3.6875 6.1875 C3.790625 7.115625 3.89375 8.04375 4 9 C1 8 1 8 -0.25 6.1875 C-1.11637742 3.66056586 -0.88492145 2.47778006 0 0 Z M-13 2 C-11.88625 2.4640625 -11.88625 2.4640625 -10.75 2.9375 C-8.48480766 3.81268795 -6.35523052 4.45044621 -4 5 C-3.01 5.33 -2.02 5.66 -1 6 C-3.375 7.0625 -3.375 7.0625 -6 8 C-6.66 7.67 -7.32 7.34 -8 7 C-8.33 7.66 -8.66 8.32 -9 9 C-11.875 4.25 -11.875 4.25 -13 2 Z " fill="#AE2822" transform="translate(143,124)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.61796469 10.05222567 1.25632834 18.04831355 -4 27 C-4.66 27.33 -5.32 27.66 -6 28 C-5.00461501 23.7887558 -3.93277896 19.74820854 -2.4375 15.6875 C-0.65854644 10.54830082 -0.29282021 5.40202806 0 0 Z " fill="#EE772D" transform="translate(205,53)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2.625 2.8125 2.625 2.8125 3 6 C2.01 7.485 2.01 7.485 1 9 C0.36191406 8.9278125 -0.27617188 8.855625 -0.93359375 8.78125 C-1.75988281 8.6884375 -2.58617187 8.595625 -3.4375 8.5 C-4.26121094 8.4071875 -5.08492187 8.314375 -5.93359375 8.21875 C-7.4639499 8.05543721 -7.4639499 8.05543721 -9 8 C-9 6.02 -9 4.04 -9 2 C-7.88625 2.7115625 -7.88625 2.7115625 -6.75 3.4375 C-4.38949985 4.77869327 -2.63351523 5.512312 0 6 C0 4.02 0 2.04 0 0 Z " fill="#4294DD" transform="translate(58,48)"/>
<path d="M0 0 C2.64 0 5.28 0 8 0 C8.33 1.32 8.66 2.64 9 4 C6 6 6 6 3.3125 5.625 C2.549375 5.41875 1.78625 5.2125 1 5 C0.67 3.35 0.34 1.7 0 0 Z " fill="#401921" transform="translate(74,234)"/>
<path d="M0 0 C-0.33 1.65 -0.66 3.3 -1 5 C0.65 5 2.3 5 4 5 C0.1496895 7.56687367 -1.58569763 6.83288724 -6 6 C-6.66 4.35 -7.32 2.7 -8 1 C-2.25 -1.125 -2.25 -1.125 0 0 Z " fill="#B04623" transform="translate(243,224)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.06058594 0.82242188 1.12117188 1.64484375 1.18359375 2.4921875 C1.69751644 9.339219 2.27558027 16.1719587 3 23 C-0.51337672 16.31277456 -1.66840896 9.49239809 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#401B31" transform="translate(28,155)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.38511719 1.67095703 1.38511719 1.67095703 0.7578125 2.35546875 C-2.33390309 5.82440323 -4.30787099 8.64881113 -6 13 C-8.125 14.8125 -8.125 14.8125 -10 16 C-8.65602791 9.01134512 -5.04518327 4.70883772 0 0 Z " fill="#E15C12" transform="translate(190,120)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3.33 0.66 3.66 1.32 4 2 C6.52733235 2.65555119 6.52733235 2.65555119 9 3 C6.79625376 5.53430818 5.28878404 6.40203927 2 7 C0.88625 7.2784375 0.88625 7.2784375 -0.25 7.5625 C-0.8275 7.706875 -1.405 7.85125 -2 8 C-1.125 1.125 -1.125 1.125 0 0 Z " fill="#320816" transform="translate(206,114)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C4.144375 0.763125 4.28875 1.52625 4.4375 2.3125 C4.9632594 5.08172908 4.9632594 5.08172908 6 8 C3.69 8 1.38 8 -1 8 C-2.2077558 4.37673261 -1.54311128 3.35853631 0 0 Z " fill="#3267AD" transform="translate(42,79)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C-6.05172414 7.46551724 -6.05172414 7.46551724 -11.375 6.625 C-11.91125 6.41875 -12.4475 6.2125 -13 6 C-12.505 5.54625 -12.01 5.0925 -11.5 4.625 C-9.77390663 3.12364481 -9.77390663 3.12364481 -10 1 C-9.36191406 1.01160156 -8.72382812 1.02320313 -8.06640625 1.03515625 C-7.24011719 1.04417969 -6.41382812 1.05320313 -5.5625 1.0625 C-4.32693359 1.07990234 -4.32693359 1.07990234 -3.06640625 1.09765625 C-1.00836062 1.23267348 -1.00836062 1.23267348 0 0 Z " fill="#4374B3" transform="translate(112,54)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.49940808 6.11774896 0.24900602 9.02495953 -3 14 C-3.66 14 -4.32 14 -5 14 C-5 12.68 -5 11.36 -5 10 C-5.66 9.67 -6.32 9.34 -7 9 C-5.68 8.34 -4.36 7.68 -3 7 C-3 6.34 -3 5.68 -3 5 C-2.34 5 -1.68 5 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#2656A1" transform="translate(172,27)"/>
<path d="M0 0 C2.31 0.33 4.62 0.66 7 1 C7 2.32 7 3.64 7 5 C6.01 5 5.02 5 4 5 C4 5.66 4 6.32 4 7 C3.01 7.33 2.02 7.66 1 8 C0 7 0 7 -0.0625 3.4375 C-0.041875 2.303125 -0.02125 1.16875 0 0 Z " fill="#962D14" transform="translate(189,144)"/>
<path d="M0 0 C1.2077558 3.62326739 0.54311128 4.64146369 -1 8 C-0.40832031 7.98839844 0.18335937 7.97679687 0.79296875 7.96484375 C5.00231785 7.91677614 8.8922333 7.93993117 13 9 C12.67 9.66 12.34 10.32 12 11 C9.70800823 10.85936865 7.41640814 10.71234057 5.125 10.5625 C3.84882812 10.48128906 2.57265625 10.40007812 1.2578125 10.31640625 C-2 10 -2 10 -4 9 C-2.94124926 5.59687262 -1.99097846 2.98646769 0 0 Z " fill="#A71E18" transform="translate(79,126)"/>
<path d="M0 0 C0.66 1.32 1.32 2.64 2 4 C1.54625 4.495 1.0925 4.99 0.625 5.5 C-1.58159367 8.89475949 -2.14391425 12.04883498 -3 16 C-3.33 16 -3.66 16 -4 16 C-4.1953125 13.98177083 -4.390625 11.96354167 -4.5859375 9.9453125 C-4.86374749 7.77331755 -4.86374749 7.77331755 -7 6 C-7 5.01 -7 4.02 -7 3 C-6.34 3 -5.68 3 -5 3 C-5 3.99 -5 4.98 -5 6 C-3.35 5.67 -1.7 5.34 0 5 C-0.2784375 4.0409375 -0.2784375 4.0409375 -0.5625 3.0625 C-0.706875 2.381875 -0.85125 1.70125 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#160A20" transform="translate(276,128)"/>
<path d="M0 0 C-0.56542004 1.32031595 -1.15306472 2.6311301 -1.75 3.9375 C-2.23726562 5.03384766 -2.23726562 5.03384766 -2.734375 6.15234375 C-4 8 -4 8 -6.140625 8.75390625 C-7.06101562 8.87572266 -7.06101562 8.87572266 -8 9 C-8 6.03799136 -7.93656229 3.80968687 -7 1 C-2.77108434 -1.38554217 -2.77108434 -1.38554217 0 0 Z " fill="#2F386B" transform="translate(36,106)"/>
<path d="M0 0 C1.03274898 2.68514734 1.07566569 3.7921588 0.07421875 6.54296875 C-0.38339844 7.41566406 -0.84101563 8.28835937 -1.3125 9.1875 C-1.76238281 10.06792969 -2.21226562 10.94835937 -2.67578125 11.85546875 C-4 14 -4 14 -6 15 C-6.6875 13.3125 -6.6875 13.3125 -7 11 C-5.8125 8.625 -5.8125 8.625 -4 6 C-3.278125 4.906875 -2.55625 3.81375 -1.8125 2.6875 C-1.214375 1.800625 -0.61625 0.91375 0 0 Z " fill="#F3741D" transform="translate(204,99)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 0.99 2 1.98 2 3 C4.64 3 7.28 3 10 3 C10 3.66 10 4.32 10 5 C6.04 5.99 2.08 6.98 -2 8 C-2 7.34 -2 6.68 -2 6 C-1.34 6 -0.68 6 0 6 C0 4.02 0 2.04 0 0 Z " fill="#DA2F0A" transform="translate(175,68)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C3 1 4 2 5 3 C7.09989652 4.17574711 7.09989652 4.17574711 9 5 C9 4.34 9 3.68 9 3 C14.445 2.01 14.445 2.01 20 1 C19.67 1.99 19.34 2.98 19 4 C13.29951151 6.0001714 8.87791677 6.49438562 3 5 C1 2.4375 1 2.4375 0 0 Z " fill="#8D2416" transform="translate(29,226)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 1.65 2 3.3 2 5 C3.98 4.67 5.96 4.34 8 4 C6.84826645 6.46800047 5.95216435 8.04783565 4 10 C2.68 10 1.36 10 0 10 C0 9.34 0 8.68 0 8 C0.66 7.67 1.32 7.34 2 7 C1.01 6.67 0.02 6.34 -1 6 C-1.042721 4.33388095 -1.04063832 2.66617115 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#5F2728" transform="translate(243,223)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C2.49906568 3.01093246 -0.80568881 5.0312048 -5.0625 6.8125 C-6.08472656 7.25207031 -7.10695312 7.69164062 -8.16015625 8.14453125 C-11.03681425 9.01108985 -12.251084 9.07451633 -15 8 C-13.41925436 7.18247697 -11.83528777 6.37118003 -10.25 5.5625 C-9.36828125 5.11003906 -8.4865625 4.65757812 -7.578125 4.19140625 C-5 3 -5 3 -2.734375 2.46484375 C-1.87585938 2.23474609 -1.87585938 2.23474609 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#E7A372" transform="translate(149,216)"/>
<path d="M0 0 C3.875 1.75 3.875 1.75 5 4 C4.34 4 3.68 4 3 4 C3 11.59 3 19.18 3 27 C1.16526719 23.33053438 0.75484815 22.37747779 0.83984375 18.59375 C0.85080078 17.76746094 0.86175781 16.94117188 0.87304688 16.08984375 C0.89431641 15.23519531 0.91558594 14.38054687 0.9375 13.5 C0.97207118 11.80217118 1.00217847 10.10424429 1.02734375 8.40625 C1.04531006 7.65666016 1.06327637 6.90707031 1.08178711 6.13476562 C0.99837636 3.95762044 0.60328826 2.08800993 0 0 Z " fill="#F96E1F" transform="translate(19,178)"/>
<path d="M0 0 C4.37859255 0.50522222 6.81651224 3.17827222 10 6 C9.34 6.66 8.68 7.32 8 8 C7.2575 7.46375 6.515 6.9275 5.75 6.375 C4.8425 5.92125 3.935 5.4675 3 5 C0.69712207 5.69140351 0.69712207 5.69140351 -1 7 C-1.33 6.01 -1.66 5.02 -2 4 C-1.34 3.34 -0.68 2.68 0 2 C0 1.34 0 0.68 0 0 Z " fill="#E13918" transform="translate(133,116)"/>
<path d="M0 0 C1.125 3.75 1.125 3.75 0 6 C-0.04022391 8.3329866 -0.04320247 10.66706666 0 13 C2.31 13 4.62 13 7 13 C5.8125 14.5625 5.8125 14.5625 4 16 C0.65807308 15.75546876 -0.60543557 15.39456443 -3 13 C-3.50442453 7.75398486 -2.64964989 4.52648522 0 0 Z " fill="#4B1C16" transform="translate(215,87)"/>
<path d="M0 0 C0.99 0.495 0.99 0.495 2 1 C2 1.66 2 2.32 2 3 C3.98 2.67 5.96 2.34 8 2 C8 4.31 8 6.62 8 9 C6.02 8.01 4.04 7.02 2 6 C2 6.66 2 7.32 2 8 C1.34 8 0.68 8 0 8 C0 5.36 0 2.72 0 0 Z " fill="#151F57" transform="translate(227,73)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5 1.65 5 3.3 5 5 C4.01 5 3.02 5 2 5 C2 5.66 2 6.32 2 7 C-0.31 7 -2.62 7 -5 7 C-5 6.34 -5 5.68 -5 5 C-3.68 4.67 -2.36 4.34 -1 4 C-0.67 2.68 -0.34 1.36 0 0 Z " fill="#5893D9" transform="translate(132,32)"/>
<path d="M0 0 C5.75 1.75 5.75 1.75 8 4 C7.625 6.125 7.625 6.125 7 8 C5.35 8.33 3.7 8.66 2 9 C2 7.68 2 6.36 2 5 C1.01 5.495 1.01 5.495 0 6 C0.185625 5.38125 0.37125 4.7625 0.5625 4.125 C1.23686176 1.95839822 1.23686176 1.95839822 0 0 Z " fill="#1159AE" transform="translate(202,16)"/>
<path d="M0 0 C0.33 1.32 0.66 2.64 1 4 C-3.95 5.485 -3.95 5.485 -9 7 C-9 5.68 -9 4.36 -9 3 C-5.69865082 0.43228397 -4.27125508 0 0 0 Z " fill="#060A3C" transform="translate(193,265)"/>
<path d="M0 0 C5.28 0 10.56 0 16 0 C14.68 0.99 13.36 1.98 12 3 C10.328451 2.69208308 8.66194453 2.35613097 7 2 C3.75763432 2.85771342 3.75763432 2.85771342 1 4 C0.67 2.68 0.34 1.36 0 0 Z " fill="#1F071D" transform="translate(215,238)"/>
<path d="M0 0 C0.78375 0.04125 1.5675 0.0825 2.375 0.125 C1.055 0.455 -0.265 0.785 -1.625 1.125 C-1.295 1.785 -0.965 2.445 -0.625 3.125 C1.025 2.465 2.675 1.805 4.375 1.125 C4.705 2.445 5.035 3.765 5.375 5.125 C2.04166667 5.79166667 -1.29166667 6.45833333 -4.625 7.125 C-4.75 4.75 -4.75 4.75 -4.625 2.125 C-2.625 0.125 -2.625 0.125 0 0 Z " fill="#110D2B" transform="translate(186.625,236.875)"/>
<path d="M0 0 C5.94 0.99 5.94 0.99 12 2 C12 2.66 12 3.32 12 4 C8.535 5.485 8.535 5.485 5 7 C0 1.125 0 1.125 0 0 Z " fill="#6C2628" transform="translate(33,231)"/>
<path d="M0 0 C1.46067199 0.45082469 2.91848032 0.91093537 4.375 1.375 C5.18710937 1.63023437 5.99921875 1.88546875 6.8359375 2.1484375 C9 3 9 3 11 5 C9.35 4.67 7.7 4.34 6 4 C5.67 5.98 5.34 7.96 5 10 C5.66 10.33 6.32 10.66 7 11 C5.68 11 4.36 11 3 11 C3.33 9.02 3.66 7.04 4 5 C3.01 5.33 2.02 5.66 1 6 C0.67 4.02 0.34 2.04 0 0 Z " fill="#391319" transform="translate(54,211)"/>
<path d="M0 0 C4.52220645 0.79803643 8.87816169 1.93908085 13 4 C13 4.66 13 5.32 13 6 C13.99 6 14.98 6 16 6 C16 6.66 16 7.32 16 8 C10.18738629 6.26017005 5.16830006 4.1889511 0 1 C0 0.67 0 0.34 0 0 Z M14 1 C14.99 1.33 15.98 1.66 17 2 C16.01 2.33 15.02 2.66 14 3 C14 2.34 14 1.68 14 1 Z " fill="#23345D" transform="translate(72,202)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.22245975 2.24864725 1.42746557 4.49902623 1.625 6.75 C1.74101562 8.00296875 1.85703125 9.2559375 1.9765625 10.546875 C1.99888599 13.83586903 1.77961002 15.31020776 0 18 C0 17.01 0 16.02 0 15 C-0.66 15 -1.32 15 -2 15 C-2 12.03 -2 9.06 -2 6 C-1.34 6 -0.68 6 0 6 C0 4.02 0 2.04 0 0 Z " fill="#651911" transform="translate(199,172)"/>
<path d="M0 0 C0.33 1.32 0.66 2.64 1 4 C2.98 4.495 2.98 4.495 5 5 C4.34 5 3.68 5 3 5 C3 5.99 3 6.98 3 8 C3.99 8 4.98 8 6 8 C6.33 8.99 6.66 9.98 7 11 C5.125 12.0625 5.125 12.0625 3 13 C2.34 12.67 1.68 12.34 1 12 C0.22565558 7.973409 -0.12412545 4.09613971 0 0 Z " fill="#A91D0D" transform="translate(216,169)"/>
<path d="M0 0 C-0.99 0.495 -0.99 0.495 -2 1 C-2.65555119 3.52733235 -2.65555119 3.52733235 -3 6 C-4.65 5.67 -6.3 5.34 -8 5 C-8 4.34 -8 3.68 -8 3 C-8.99 2.67 -9.98 2.34 -11 2 C-11 1.67 -11 1.34 -11 1 C-7.26562152 0.12132271 -3.83225427 -0.08912219 0 0 Z " fill="#E16E26" transform="translate(248,147)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.0543965 2.37531394 1.09385864 4.74935883 1.125 7.125 C1.15013672 8.12273437 1.15013672 8.12273437 1.17578125 9.140625 C1.21847278 13.49516056 0.59996217 16.95600114 -1 21 C-1.33 21 -1.66 21 -2 21 C-2.28307925 13.75002578 -1.50974035 7.09038772 0 0 Z " fill="#80211C" transform="translate(28,140)"/>
<path d="M0 0 C2.64 0 5.28 0 8 0 C8.33 1.65 8.66 3.3 9 5 C7.02 5.99 7.02 5.99 5 7 C5 5.68 5 4.36 5 3 C4.01 3.495 4.01 3.495 3 4 C3.33 4.99 3.66 5.98 4 7 C3.34 7 2.68 7 2 7 C2 6.34 2 5.68 2 5 C1.34 4.67 0.68 4.34 0 4 C0 2.68 0 1.36 0 0 Z " fill="#BB7159" transform="translate(212,136)"/>
<path d="M0 0 C0.8971875 0.309375 0.8971875 0.309375 1.8125 0.625 C0.8225 1.285 -0.1675 1.945 -1.1875 2.625 C-1.5175 3.615 -1.8475 4.605 -2.1875 5.625 C0.2875 6.615 0.2875 6.615 2.8125 7.625 C2.8125 7.955 2.8125 8.285 2.8125 8.625 C-0.65691546 8.16677532 -3.86145049 7.73368317 -7.1875 6.625 C-4.6484375 -0.796875 -4.6484375 -0.796875 0 0 Z " fill="#4F141B" transform="translate(192.1875,133.375)"/>
<path d="M0 0 C3.96 0 7.92 0 12 0 C11.67 1.32 11.34 2.64 11 4 C8.03 4 5.06 4 2 4 C1.34 2.68 0.68 1.36 0 0 Z " fill="#581B19" transform="translate(203,130)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.34 1.66 2.68 2.32 2 3 C3.98 2.34 5.96 1.68 8 1 C8 1.66 8 2.32 8 3 C6.57421875 4.2890625 6.57421875 4.2890625 4.6875 5.625 C4.07261719 6.07101563 3.45773438 6.51703125 2.82421875 6.9765625 C1 8 1 8 -2 8 C-1.125 2.25 -1.125 2.25 0 0 Z " fill="#FA820C" transform="translate(184,117)"/>
<path d="M0 0 C0.12375 0.639375 0.2475 1.27875 0.375 1.9375 C0.684375 2.9584375 0.684375 2.9584375 1 4 C4.80955639 5.90477819 8.40716321 5.17565535 12.375 4 C13.24125 3.67 14.1075 3.34 15 3 C12.22719294 6.08089673 9.93673644 7.68775452 6 9 C6 8.34 6 7.68 6 7 C3.69 6.67 1.38 6.34 -1 6 C-1.12375 5.360625 -1.2475 4.72125 -1.375 4.0625 C-1.684375 3.0415625 -1.684375 3.0415625 -2 2 C-2.66 1.67 -3.32 1.34 -4 1 C-2 0 -2 0 0 0 Z " fill="#FC9113" transform="translate(182,108)"/>
<path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C1.01 2 0.02 2 -1 2 C-0.67 2.99 -0.34 3.98 0 5 C-1.75 7.0625 -1.75 7.0625 -4 9 C-6.1875 8.9375 -6.1875 8.9375 -8 8 C-8.33 7.01 -8.66 6.02 -9 5 C-8.01 5 -7.02 5 -6 5 C-6 4.34 -6 3.68 -6 3 C-5.01 3 -4.02 3 -3 3 C-3 2.34 -3 1.68 -3 1 C-2.01 0.67 -1.02 0.34 0 0 Z " fill="#A11E1D" transform="translate(161,112)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C0.68938409 4.23429756 -0.94356259 8.07407404 -3 12 C-3.99 11.01 -4.98 10.02 -6 9 C-5.01 6.69 -4.02 4.38 -3 2 C-2.34 2 -1.68 2 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#CB4C28" transform="translate(38,108)"/>
<path d="M0 0 C0 0.33 0 0.66 0 1 C-0.845625 1.268125 -1.69125 1.53625 -2.5625 1.8125 C-6.04395486 2.94089571 -6.04395486 2.94089571 -9.375 4.625 C-13.64914175 6.24622618 -16.47781794 6.23800958 -21 6 C-21 5.67 -21 5.34 -21 5 C-19.88625 4.896875 -18.7725 4.79375 -17.625 4.6875 C-16.42875 4.460625 -15.2325 4.23375 -14 4 C-13.34 3.01 -12.68 2.02 -12 1 C-7.98305814 -0.00423547 -4.12575173 -0.09823218 0 0 Z " fill="#FBF795" transform="translate(131,70)"/>
<path d="M0 0 C0.33 1.32 0.66 2.64 1 4 C1.66 4 2.32 4 3 4 C3 5.98 3 7.96 3 10 C2.34 10 1.68 10 1 10 C1 10.99 1 11.98 1 13 C0.01 13 -0.98 13 -2 13 C-2.13306769 8.3426308 -1.47141819 4.41425456 0 0 Z " fill="#1C79B9" transform="translate(171,17)"/>
<path d="M0 0 C2 2.5 2 2.5 4 5 C5.11375 6.3303125 5.11375 6.3303125 6.25 7.6875 C8 10 8 10 8 12 C7.34 12 6.68 12 6 12 C5.67 11.34 5.34 10.68 5 10 C4.34 11.32 3.68 12.64 3 14 C1.20724134 10.88089144 0.65709282 8.32317572 0.375 4.75 C0.30023437 3.85796875 0.22546875 2.9659375 0.1484375 2.046875 C0.09945313 1.37140625 0.05046875 0.6959375 0 0 Z " fill="#812412" transform="translate(19,204)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.10957031 0.69867188 1.21914063 1.39734375 1.33203125 2.1171875 C1.49058594 3.02726563 1.64914063 3.93734375 1.8125 4.875 C1.96332031 5.77992188 2.11414063 6.68484375 2.26953125 7.6171875 C2.83051301 10.34412478 2.83051301 10.34412478 6 12 C6 10.35 6 8.7 6 7 C8.31 7.66 10.62 8.32 13 9 C12.34 10.32 11.68 11.64 11 13 C10.34 12.01 9.68 11.02 9 10 C8.01 11.485 8.01 11.485 7 13 C4.625 12.6875 4.625 12.6875 2 12 C-0.13586678 8.79619983 -0.23132175 7.98060033 -0.125 4.3125 C-0.10695313 3.50425781 -0.08890625 2.69601563 -0.0703125 1.86328125 C-0.04710938 1.24839844 -0.02390625 0.63351563 0 0 Z " fill="#741711" transform="translate(27,186)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C0.66 3.33 1.32 3.66 2 4 C-1.63 4.33 -5.26 4.66 -9 5 C-8.67 3.68 -8.34 2.36 -8 1 C-5.07175348 0.02391783 -3.04386724 -0.08226668 0 0 Z " fill="#CA6334" transform="translate(256,138)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2.625 1.875 2.625 1.875 3 4 C2.34 4.66 1.68 5.32 1 6 C1 5.34 1 4.68 1 4 C-0.99983534 4.79117904 -0.99983534 4.79117904 -3 6 C-3.33 6.99 -3.66 7.98 -4 9 C-5.4375 10.6875 -5.4375 10.6875 -7 12 C-7.66 12 -8.32 12 -9 12 C-7.60846256 7.57238086 -5.47928514 5.0443745 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#511118" transform="translate(61,109)"/>
<path d="M0 0 C0 4.53846154 0 4.53846154 -1 7 C-5.17857143 10 -5.17857143 10 -8 10 C-7.67 10.99 -7.34 11.98 -7 13 C-8.32 13 -9.64 13 -11 13 C-8.72126867 7.61390776 -4.84467788 3.22978525 0 0 Z " fill="#FBEBDA" transform="translate(56,90)"/>
<path d="M0 0 C6.93 0 13.86 0 21 0 C21 0.33 21 0.66 21 1 C17.37 1 13.74 1 10 1 C9.67 1.99 9.34 2.98 9 4 C6.03 3.505 6.03 3.505 3 3 C3 2.34 3 1.68 3 1 C2.01 0.67 1.02 0.34 0 0 Z " fill="#B41F0D" transform="translate(98,85)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.32290808 7.7378343 1.53007672 14.92365355 -2 22 C-2.66 22.66 -3.32 23.32 -4 24 C-4.31891219 19.64153338 -3.60088031 16.98722102 -1.734375 13.078125 C-0.25722989 8.89811863 -0.23061071 4.39750764 0 0 Z " fill="#EC4502" transform="translate(204,51)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.33 3.63 1.66 7.26 2 11 C0.35 11.66 -1.3 12.32 -3 13 C-3 10.35161227 -2.71072071 8.46887284 -2.0625 5.9375 C-1.88847656 5.24527344 -1.71445313 4.55304688 -1.53515625 3.83984375 C-1 2 -1 2 0 0 Z " fill="#F3E0BA" transform="translate(160,135)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C3.6875 1.6875 3.6875 1.6875 5 4 C4.6875 6.75 4.6875 6.75 4 9 C2.68 9 1.36 9 0 9 C-0.84454356 5.62182575 -1.10844919 3.32534757 0 0 Z " fill="#C2230E" transform="translate(206,102)"/>
<path d="M0 0 C3.87493616 -0.05834395 7.74975836 -0.09371201 11.625 -0.125 C13.26662109 -0.15013672 13.26662109 -0.15013672 14.94140625 -0.17578125 C24.98079979 -0.23662606 24.98079979 -0.23662606 30 2 C30 2.66 30 3.32 30 4 C28.9171875 3.68289062 27.834375 3.36578125 26.71875 3.0390625 C21.34952368 1.69675592 16.01118685 1.54858069 10.5 1.375 C8.98019531 1.31699219 8.98019531 1.31699219 7.4296875 1.2578125 C4.95329716 1.16436381 2.47689849 1.07860127 0 1 C0 0.67 0 0.34 0 0 Z " fill="#E46A45" transform="translate(103,99)"/>
<path d="M0 0 C-0.309375 0.70125 -0.61875 1.4025 -0.9375 2.125 C-2.03302678 5.08936657 -2.56422992 7.87698108 -3 11 C-3.33 11 -3.66 11 -4 11 C-4.12375 10.195625 -4.2475 9.39125 -4.375 8.5625 C-4.58125 7.716875 -4.7875 6.87125 -5 6 C-5.66 5.67 -6.32 5.34 -7 5 C-7 4.34 -7 3.68 -7 3 C-8.32 2.67 -9.64 2.34 -11 2 C-7.12315913 0.80712589 -4.08378077 0 0 0 Z " fill="#FBD42E" transform="translate(174,87)"/>
<path d="M0 0 C2.99332739 0.9977758 3.94766315 1.7522025 6 4 C4.68 4.99 3.36 5.98 2 7 C2 6.01 2 5.02 2 4 C1.071875 4.495 0.14375 4.99 -0.8125 5.5 C-4 7 -4 7 -7 7 C-4.69 4.69 -2.38 2.38 0 0 Z " fill="#DC7B34" transform="translate(54,83)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.67 1.66 1.34 2.32 1 3 C-0.32 3 -1.64 3 -3 3 C-3.66 4.32 -4.32 5.64 -5 7 C-5.99 7 -6.98 7 -8 7 C-8 7.66 -8 8.32 -8 9 C-8.99 9.66 -9.98 10.32 -11 11 C-11.99 10.67 -12.98 10.34 -14 10 C-12.42040347 8.70376621 -10.83616587 7.41318673 -9.25 6.125 C-8.36828125 5.40570313 -7.4865625 4.68640625 -6.578125 3.9453125 C-4.40469304 2.3053593 -2.54024149 0.96087396 0 0 Z " fill="#FCE9CE" transform="translate(71,79)"/>
<path d="M0 0 C5.11365014 1.0681847 10.07227969 2.23107476 15 4 C14.67 5.32 14.34 6.64 14 8 C11.525 7.01 11.525 7.01 9 6 C9 5.67 9 5.34 9 5 C6.03 4.505 6.03 4.505 3 4 C3 3.34 3 2.68 3 2 C2.01 1.67 1.02 1.34 0 1 C0 0.67 0 0.34 0 0 Z " fill="#FEDB23" transform="translate(148,81)"/>
<path d="M0 0 C-1.26886964 1.12721436 -2.54017562 2.25168658 -3.8125 3.375 C-4.52019531 4.00148438 -5.22789062 4.62796875 -5.95703125 5.2734375 C-10.36651584 9 -10.36651584 9 -14 9 C-14 8.34 -14 7.68 -14 7 C-11.36107824 5.21694476 -9.02821137 4.00940379 -6 3 C-6 2.01 -6 1.02 -6 0 C-3.50907189 -1.24546405 -2.58919267 -0.7767578 0 0 Z " fill="#F4A506" transform="translate(172,45)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C0.99 2 1.98 2 3 2 C3 2.66 3 3.32 3 4 C-0.63 4.33 -4.26 4.66 -8 5 C-7.67 3.68 -7.34 2.36 -7 1 C-2.25 0 -2.25 0 0 0 Z " fill="#CB7531" transform="translate(243,231)"/>
<path d="M0 0 C1.2065625 0.0309375 1.2065625 0.0309375 2.4375 0.0625 C2.1075 1.0525 1.7775 2.0425 1.4375 3.0625 C-3.2925622 4.9246508 -8.52492242 5.32083731 -13.5625 5.0625 C-11.5625 2.0625 -11.5625 2.0625 -9.65234375 1.5859375 C-8.94207031 1.53695312 -8.23179688 1.48796875 -7.5 1.4375 C-3.83558626 1.08850822 -3.27849624 0.07996332 0 0 Z " fill="#D5BEB3" transform="translate(130.5625,220.9375)"/>
<path d="M0 0 C3.63 0 7.26 0 11 0 C11 0.99 11 1.98 11 3 C7.37 3.33 3.74 3.66 0 4 C0 2.68 0 1.36 0 0 Z " fill="#870503" transform="translate(214,215)"/>
<path d="M0 0 C0 3 0 3 -1.72265625 5.0078125 C-6.4503477 9.28562346 -9.50285199 12 -16 12 C-12.47169239 9.13607206 -8.87015083 6.41215722 -5.1875 3.75 C-4.21167969 3.04359375 -3.23585937 2.3371875 -2.23046875 1.609375 C-1.49441406 1.07828125 -0.75835937 0.5471875 0 0 Z " fill="#280909" transform="translate(172,208)"/>
<path d="M0 0 C2.97722547 0.70333538 5.85256543 1.58248537 8.75 2.5625 C9.94882813 2.96662109 9.94882813 2.96662109 11.171875 3.37890625 C11.77515625 3.58386719 12.3784375 3.78882813 13 4 C12.67 5.32 12.34 6.64 12 8 C7.69235185 6.43358249 3.93828536 4.31663844 0 2 C0 1.34 0 0.68 0 0 Z " fill="#EBCBA1" transform="translate(63,213)"/>
<path d="M0 0 C1.7726041 0.61996001 3.54302667 1.24615993 5.3125 1.875 C6.79169922 2.39707031 6.79169922 2.39707031 8.30078125 2.9296875 C11 4 11 4 14 6 C14 6.99 14 7.98 14 9 C8.8423143 7.58163643 4.20024742 5.32608425 0 2 C0 1.34 0 0.68 0 0 Z " fill="#F6EFDA" transform="translate(70,203)"/>
<path d="M0 0 C2.64 0 5.28 0 8 0 C8 0.33 8 0.66 8 1 C5.69 1 3.38 1 1 1 C1 1.66 1 2.32 1 3 C1.66 3.66 2.32 4.32 3 5 C2.34 5 1.68 5 1 5 C1 6.32 1 7.64 1 9 C0.34 9 -0.32 9 -1 9 C-1 7.68 -1 6.36 -1 5 C-1.66 5 -2.32 5 -3 5 C-3 5.66 -3 6.32 -3 7 C-3.66 7 -4.32 7 -5 7 C-4.34 5.35 -3.68 3.7 -3 2 C-2.01 2 -1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#22172C" transform="translate(122,200)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 1.98 1 3.96 1 6 C0.01 6.495 0.01 6.495 -1 7 C-1.65213292 9.02463255 -1.65213292 9.02463255 -2 11 C-2.99 11 -3.98 11 -5 11 C-5 11.66 -5 12.32 -5 13 C-5.66 13 -6.32 13 -7 13 C-6.625 10.5625 -6.625 10.5625 -6 8 C-5.34 7.67 -4.68 7.34 -4 7 C-2.86649466 4.98330173 -2.86649466 4.98330173 -2 3 C-1.34 3 -0.68 3 0 3 C0 2.01 0 1.02 0 0 Z " fill="#A1463C" transform="translate(209,180)"/>
<path d="M0 0 C2.5 1.0625 2.5 1.0625 5 3 C5.3125 6.6875 5.3125 6.6875 5 10 C4.01 10 3.02 10 2 10 C2 9.34 2 8.68 2 8 C1.34 8 0.68 8 0 8 C0 5.36 0 2.72 0 0 Z " fill="#20164A" transform="translate(240,105)"/>
<path d="M0 0 C-5.0940919 6.70459519 -5.0940919 6.70459519 -8.875 7.9375 C-9.57625 7.958125 -10.2775 7.97875 -11 8 C-11 7.34 -11 6.68 -11 6 C-10.01 5.67 -9.02 5.34 -8 5 C-8.33 4.34 -8.66 3.68 -9 3 C-7.14340032 -0.71319936 -3.69365381 -0.09982848 0 0 Z " fill="#180B29" transform="translate(85,239)"/>
<path d="M0 0 C0.4375 2.1875 0.4375 2.1875 0 5 C-2.13995327 6.98441782 -4.50175965 8.5023304 -7 10 C-7.66 9.01 -8.32 8.02 -9 7 C-7.69013727 5.83037314 -6.3770374 4.66437056 -5.0625 3.5 C-3.96615234 2.52546875 -3.96615234 2.52546875 -2.84765625 1.53125 C-1 0 -1 0 0 0 Z " fill="#B73019" transform="translate(182,183)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0.75037104 5.4778371 -0.74148594 8.64274309 -4 12 C-4.99 12 -5.98 12 -7 12 C-5.61735163 9.13132769 -4.07851447 6.43975968 -2.375 3.75 C-1.92898437 3.04359375 -1.48296875 2.3371875 -1.0234375 1.609375 C-0.68570313 1.07828125 -0.34796875 0.5471875 0 0 Z " fill="#E67942" transform="translate(225,102)"/>
<path d="M0 0 C0.74636719 0.0825 1.49273437 0.165 2.26171875 0.25 C1.57421875 2.6875 1.57421875 2.6875 0.26171875 5.25 C-2.17578125 5.875 -2.17578125 5.875 -4.73828125 6.25 C-6.53214117 7.7079186 -6.53214117 7.7079186 -7.73828125 9.25 C-8.39828125 8.92 -9.05828125 8.59 -9.73828125 8.25 C-8.69428379 6.90213008 -7.62726059 5.57207271 -6.55078125 4.25 C-5.95910156 3.5075 -5.36742187 2.765 -4.7578125 2 C-2.73828125 0.25 -2.73828125 0.25 0 0 Z " fill="#711C13" transform="translate(66.73828125,102.75)"/>
<path d="M0 0 C2.31 0 4.62 0 7 0 C6.67 0.99 6.34 1.98 6 3 C5.01 3 4.02 3 3 3 C3 4.32 3 5.64 3 7 C1.68 6.34 0.36 5.68 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#FAFAC9" transform="translate(101,101)"/>
<path d="M0 0 C1.44737675 4.34213026 0.46784614 7.73054367 -1 12 C-2.49155652 14.55895165 -4.12871731 16.68551878 -6 19 C-7 17 -7 17 -5.8203125 13.33984375 C-5.26306195 11.86939554 -4.69758499 10.40204516 -4.125 8.9375 C-3.84269531 8.19177734 -3.56039062 7.44605469 -3.26953125 6.67773438 C-1.15132548 1.15132548 -1.15132548 1.15132548 0 0 Z " fill="#3F131A" transform="translate(231,92)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2.12375 0.61875 2.2475 1.2375 2.375 1.875 C2.87197356 4.19120832 2.87197356 4.19120832 5 6 C4.67 6.99 4.34 7.98 4 9 C2.35 9.33 0.7 9.66 -1 10 C-1 6.49064814 -0.62457273 3.43515002 0 0 Z " fill="#A1100E" transform="translate(85,94)"/>
<path d="M0 0 C0 1.98 0 3.96 0 6 C1.32 6.33 2.64 6.66 4 7 C2.35 7 0.7 7 -1 7 C-1 5.68 -1 4.36 -1 3 C-1.66 3 -2.32 3 -3 3 C-3 3.66 -3 4.32 -3 5 C-5.31 5.33 -7.62 5.66 -10 6 C-9.01 5.34 -8.02 4.68 -7 4 C-7 3.34 -7 2.68 -7 2 C-2.25 0 -2.25 0 0 0 Z " fill="#110417" transform="translate(173,233)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-2.31 2.66 -4.62 3.32 -7 4 C-6.01 4 -5.02 4 -4 4 C-4 4.66 -4 5.32 -4 6 C-5.32 6 -6.64 6 -8 6 C-8 6.99 -8 7.98 -8 9 C-8.66 9 -9.32 9 -10 9 C-9.75 5.625 -9.75 5.625 -9 2 C-6.19227664 -0.30634419 -3.53567531 -0.19642641 0 0 Z " fill="#6B2220" transform="translate(61,223)"/>
<path d="M0 0 C1.134375 0.474375 2.26875 0.94875 3.4375 1.4375 C7.91298952 3.1348234 12.24712186 3.68094105 17 4 C14.62839852 6.37160148 13.99378878 6.31983352 10.75 6.375 C5.97690285 6.28246823 3.57524481 5.11688009 0 2 C0 1.34 0 0.68 0 0 Z " fill="#BD4009" transform="translate(30,223)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2.33 1.98 2.66 3.96 3 6 C-1.455 6.495 -1.455 6.495 -6 7 C-5.67 6.01 -5.34 5.02 -5 4 C-2.4375 2.8125 -2.4375 2.8125 0 2 C0 1.34 0 0.68 0 0 Z " fill="#1C2443" transform="translate(108,183)"/>
<path d="M0 0 C4 1 4 1 5 2 C5.04063832 3.66617115 5.042721 5.33388095 5 7 C3.02 7.99 3.02 7.99 1 9 C0.67 6.03 0.34 3.06 0 0 Z " fill="#D8714C" transform="translate(200,175)"/>
<path d="M0 0 C-0.70125 0.556875 -1.4025 1.11375 -2.125 1.6875 C-3.6312808 2.89907369 -5.13425574 4.11587354 -6.59765625 5.37890625 C-10.79647436 9 -10.79647436 9 -13 9 C-12.01387981 5.44996731 -11.08032022 4.06604107 -8.1875 1.6875 C-5.02614631 0.01384216 -3.49010259 -0.4106003 0 0 Z " fill="#64232A" transform="translate(112,139)"/>
<path d="M0 0 C2.37590142 3.70416126 2.20500286 6.92984573 2.125 11.25 C2.10695312 12.51328125 2.08890625 13.7765625 2.0703125 15.078125 C2.03550781 16.52445313 2.03550781 16.52445313 2 18 C1.67 18 1.34 18 1 18 C0.67 16.02 0.34 14.04 0 12 C-0.33 12 -0.66 12 -1 12 C-1.02712066 10.56260487 -1.04645067 9.12506137 -1.0625 7.6875 C-1.07410156 6.88699219 -1.08570313 6.08648437 -1.09765625 5.26171875 C-1 3 -1 3 0 0 Z " fill="#E0DDBC" transform="translate(43,138)"/>
<path d="M0 0 C2.95064148 -0.2208564 5.68368231 -0.28060989 8.625 -0.1875 C9.42679688 -0.17396484 10.22859375 -0.16042969 11.0546875 -0.14648438 C13.03674378 -0.11109051 15.01845551 -0.05728234 17 0 C15.68 0.99 14.36 1.98 13 3 C12.67 2.34 12.34 1.68 12 1 C10.02 1.33 8.04 1.66 6 2 C6 2.33 6 2.66 6 3 C3.36 3 0.72 3 -2 3 C-1.34 2.01 -0.68 1.02 0 0 Z " fill="#FAC580" transform="translate(223,141)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C5.125 5.75 5.125 5.75 4 8 C2.68 8 1.36 8 0 8 C0 5.36 0 2.72 0 0 Z " fill="#FA9908" transform="translate(238,124)"/>
<path d="M0 0 C0.66 0.99 1.32 1.98 2 3 C1.25 5.875 1.25 5.875 0 9 C-0.37125 9.94875 -0.7425 10.8975 -1.125 11.875 C-1.41375 12.57625 -1.7025 13.2775 -2 14 C-2.66 13.67 -3.32 13.34 -4 13 C-3.125 6.25 -3.125 6.25 -2 4 C-1.34 4 -0.68 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#4E2027" transform="translate(65,120)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 2.65 2 4.3 2 6 C4.97 6.495 4.97 6.495 8 7 C5 9 5 9 1 9 C0.34 7.35 -0.32 5.7 -1 4 C-2.32 4 -3.64 4 -5 4 C-5 3.34 -5 2.68 -5 2 C-2.625 0.9375 -2.625 0.9375 0 0 Z " fill="#E13907" transform="translate(184,103)"/>
<path d="M0 0 C2 2 2 2 2 4 C2.99 4.66 3.98 5.32 5 6 C-2.26 5.67 -9.52 5.34 -17 5 C-17 4.67 -17 4.34 -17 4 C-15.66195312 3.94392578 -15.66195312 3.94392578 -14.296875 3.88671875 C-13.12640625 3.82097656 -11.9559375 3.75523438 -10.75 3.6875 C-9.58984375 3.62949219 -8.4296875 3.57148437 -7.234375 3.51171875 C-3.89180362 2.98288197 -2.4502943 2.26227667 0 0 Z " fill="#FCD785" transform="translate(120,107)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.67 1.66 3.34 2.32 3 3 C2.21625 3.144375 1.4325 3.28875 0.625 3.4375 C-2.32279322 4.06916997 -2.98485968 4.8932624 -5 7 C-5.99 7 -6.98 7 -8 7 C-7.67 8.32 -7.34 9.64 -7 11 C-7.66 11 -8.32 11 -9 11 C-9 9.02 -9 7.04 -9 5 C-6.03 3.68 -3.06 2.36 0 1 C0 0.67 0 0.34 0 0 Z " fill="#F96C07" transform="translate(187,98)"/>
<path d="M0 0 C-0.66 0 -1.32 0 -2 0 C-2.33 0.99 -2.66 1.98 -3 3 C-5.21484375 4.203125 -5.21484375 4.203125 -7.9375 5.25 C-9.28134766 5.78367187 -9.28134766 5.78367187 -10.65234375 6.328125 C-13 7 -13 7 -15 6 C-14.195625 5.54625 -13.39125 5.0925 -12.5625 4.625 C-9.91143428 3.25274335 -9.91143428 3.25274335 -9 1 C-5.62083804 -0.73524533 -3.60583914 -1.33549598 0 0 Z " fill="#E79F30" transform="translate(87,66)"/>
<path d="M0 0 C1.46373047 0.02707031 1.46373047 0.02707031 2.95703125 0.0546875 C3.69308594 0.07789063 4.42914063 0.10109375 5.1875 0.125 C5.1875 0.455 5.1875 0.785 5.1875 1.125 C4.23488281 1.29515625 3.28226563 1.4653125 2.30078125 1.640625 C0.41939453 2.00414062 0.41939453 2.00414062 -1.5 2.375 C-2.74136719 2.60703125 -3.98273438 2.8390625 -5.26171875 3.078125 C-8.96893863 4.17112272 -11.00082479 5.52299082 -13.8125 8.125 C-14.1425 7.465 -14.4725 6.805 -14.8125 6.125 C-10.3861559 1.20683989 -6.56983598 -0.1583093 0 0 Z " fill="#557599" transform="translate(133.8125,41.875)"/>
<path d="M0 0 C0 1.32 0 2.64 0 4 C-1.65 4 -3.3 4 -5 4 C-5 5.32 -5 6.64 -5 8 C-5.99 8 -6.98 8 -8 8 C-8.25 5.6875 -8.25 5.6875 -8 3 C-5.18144066 0.08077783 -4.20010777 0 0 0 Z " fill="#2A5893" transform="translate(209,32)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C5.67 1.65 5.34 3.3 5 5 C3.68 5.33 2.36 5.66 1 6 C1 5.34 1 4.68 1 4 C0.01 4.33 -0.98 4.66 -2 5 C-1.34 3.35 -0.68 1.7 0 0 Z " fill="#76BBE2" transform="translate(106,23)"/>
<path d="M0 0 C-0.36363205 2.57798841 -0.59533633 3.69164073 -2.70703125 5.30078125 C-3.40183594 5.63464844 -4.09664062 5.96851563 -4.8125 6.3125 C-5.49957031 6.65925781 -6.18664062 7.00601562 -6.89453125 7.36328125 C-9.34106905 8.10314333 -10.61786119 7.82973374 -13 7 C-11.21190303 5.82786955 -9.41940875 4.66244474 -7.625 3.5 C-6.62726563 2.8503125 -5.62953125 2.200625 -4.6015625 1.53125 C-2 0 -2 0 0 0 Z " fill="#7ECBE5" transform="translate(75,16)"/>
<path d="M0 0 C0 1.32 0 2.64 0 4 C-0.66 4 -1.32 4 -2 4 C-2 4.66 -2 5.32 -2 6 C-3.98 6.33 -5.96 6.66 -8 7 C-7.8125 4.625 -7.8125 4.625 -7 2 C-4.54236535 0.67665827 -2.79402354 0 0 0 Z " fill="#120E35" transform="translate(165,262)"/>
<path d="M0 0 C4.12751449 0.60698743 7.3321148 2.03810791 11 4 C7.04395608 5.21724428 2.79359325 5.89679663 -1 4 C-0.67 2.68 -0.34 1.36 0 0 Z " fill="#1C0C14" transform="translate(68,219)"/>
<path d="M0 0 C2.97 1.65 5.94 3.3 9 5 C9 5.66 9 6.32 9 7 C6 8 6 8 3.9375 7 C3.298125 6.67 2.65875 6.34 2 6 C1.01 6.495 1.01 6.495 0 7 C0 4.69 0 2.38 0 0 Z " fill="#7B4342" transform="translate(194,212)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 4.29 1 8.58 1 13 C0.01 13.33 -0.98 13.66 -2 14 C-2.1799928 8.78020872 -1.97094808 4.92737019 0 0 Z " fill="#41141A" transform="translate(269,162)"/>
<path d="M0 0 C3.08131087 0.81749064 4.77899356 1.61682073 7.0625 3.8125 C7.0625 4.4725 7.0625 5.1325 7.0625 5.8125 C5.3125 6.5625 5.3125 6.5625 3.0625 6.8125 C1.70749081 5.50120078 0.37578657 4.16558313 -0.9375 2.8125 C-3.57934541 2.01568682 -3.57934541 2.01568682 -5.9375 1.8125 C-2.9375 -0.1875 -2.9375 -0.1875 0 0 Z " fill="#FDD861" transform="translate(243.9375,121.1875)"/>
<path d="M0 0 C2.97 0.495 2.97 0.495 6 1 C6 2.65 6 4.3 6 6 C4.33388095 6.042721 2.66617115 6.04063832 1 6 C0 5 0 5 -0.0625 2.4375 C-0.041875 1.633125 -0.02125 0.82875 0 0 Z " fill="#C77950" transform="translate(232,105)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0.68 3.97 -0.64 6.94 -2 10 C-2.99 10 -3.98 10 -5 10 C-4.34 8.02 -3.68 6.04 -3 4 C-3.99 3.67 -4.98 3.34 -6 3 C-5.195625 2.690625 -4.39125 2.38125 -3.5625 2.0625 C-1.10919595 1.23664655 -1.10919595 1.23664655 0 0 Z " fill="#F8B60E" transform="translate(177,83)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C0.69386058 3.91841827 -0.83129848 6.32640809 -4 9 C-4.66 9 -5.32 9 -6 9 C-6 8.01 -6 7.02 -6 6 C-6.66 5.67 -7.32 5.34 -8 5 C-3.375 2 -3.375 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#FD7C0C" transform="translate(195,68)"/>
<path d="M0 0 C-2.34591852 2.7710688 -4.14776201 3.52059284 -7.6875 4.1875 C-8.49574219 4.34605469 -9.30398437 4.50460938 -10.13671875 4.66796875 C-11.05904297 4.83232422 -11.05904297 4.83232422 -12 5 C-10.359375 1.1640625 -10.359375 1.1640625 -7.125 -0.3125 C-4.16022313 -0.96475091 -2.77684731 -1.0680182 0 0 Z " fill="#F78C12" transform="translate(88,69)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C3.7143618 1.95927063 5.38405168 3.95880212 7 6 C-0.75 7.125 -0.75 7.125 -3 6 C-1.125 1.125 -1.125 1.125 0 0 Z " fill="#2373C2" transform="translate(44,61)"/>
<path d="M0 0 C1.18851563 0.19464844 2.37703125 0.38929687 3.6015625 0.58984375 C4.97441406 0.82380859 4.97441406 0.82380859 6.375 1.0625 C3.02560119 3.08808881 0.50537449 3.27988987 -3.375 3.1875 C-4.35984375 3.16945313 -5.3446875 3.15140625 -6.359375 3.1328125 C-7.48085937 3.09800781 -7.48085937 3.09800781 -8.625 3.0625 C-8.625 2.0725 -8.625 1.0825 -8.625 0.0625 C-5.61666904 -1.44166548 -3.27538422 -0.54589737 0 0 Z " fill="#3273B1" transform="translate(140.625,38.9375)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5.33 1.98 5.66 3.96 6 6 C3.03 5.505 3.03 5.505 0 5 C0 3.35 0 1.7 0 0 Z " fill="#62362F" transform="translate(155,254)"/>
<path d="M0 0 C1.125 3.75 1.125 3.75 0 6 C-2.64860427 6.59355614 -5.29197322 6.74209269 -8 7 C-6.68 6.67 -5.36 6.34 -4 6 C-4 5.34 -4 4.68 -4 4 C-4.99 4.33 -5.98 4.66 -7 5 C-7.33 4.34 -7.66 3.68 -8 3 C-5.29120665 1.64560332 -2.99066732 1.93498549 0 2 C0 1.34 0 0.68 0 0 Z " fill="#4A111B" transform="translate(61,223)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C-0.98 4.64 -2.96 7.28 -5 10 C-5.66 9.67 -6.32 9.34 -7 9 C-7 5 -7 5 -5.75 3.375 C-3.9201113 1.93723031 -2.11966127 0.95019298 0 0 Z " fill="#210B27" transform="translate(257,217)"/>
<path d="M0 0 C2.46324069 3.69486103 2.38991688 5.63293092 2 10 C0.75 12 0.75 12 -1 13 C-3.1875 12.6875 -3.1875 12.6875 -5 12 C-4.360625 11.319375 -3.72125 10.63875 -3.0625 9.9375 C-0.6741507 6.53591161 -0.32122847 4.09566299 0 0 Z " fill="#A3767D" transform="translate(260,203)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.66 4.29 2.32 8.58 3 13 C1.68 13 0.36 13 -1 13 C-1.02696365 11.20841511 -1.04637917 9.41671527 -1.0625 7.625 C-1.07410156 6.62726563 -1.08570313 5.62953125 -1.09765625 4.6015625 C-1 2 -1 2 0 0 Z " fill="#49122C" transform="translate(195,199)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C2.96519531 1.13888672 2.96519531 1.13888672 2.9296875 2.30078125 C2.91164063 3.29464844 2.89359375 4.28851563 2.875 5.3125 C2.84019531 6.79169922 2.84019531 6.79169922 2.8046875 8.30078125 C2.79317361 11.22406527 2.79317361 11.22406527 5 14 C5 14.99 5 15.98 5 17 C3.0625 16.1875 3.0625 16.1875 1 15 C-0.09506492 11.71480525 -0.09960608 9.26336585 -0.0625 5.8125 C-0.05347656 4.72582031 -0.04445313 3.63914063 -0.03515625 2.51953125 C-0.02355469 1.68808594 -0.01195313 0.85664063 0 0 Z " fill="#DA6F18" transform="translate(25,184)"/>
<path d="M0 0 C2.76276177 0.52268466 5.3260876 1.10869587 8 2 C9.66621616 2.03874921 11.33394172 2.0450286 13 2 C13 2.66 13 3.32 13 4 C11.20841511 4.02696365 9.41671527 4.04637917 7.625 4.0625 C6.62726563 4.07410156 5.62953125 4.08570313 4.6015625 4.09765625 C2 4 2 4 0 3 C0 2.01 0 1.02 0 0 Z " fill="#BC3708" transform="translate(211,156)"/>
<path d="M0 0 C3.96 0 7.92 0 12 0 C13 4 13 4 12 7 C10.68 6.67 9.36 6.34 8 6 C8.66 4.68 9.32 3.36 10 2 C6.7 1.67 3.4 1.34 0 1 C0 0.67 0 0.34 0 0 Z " fill="#BE8F5B" transform="translate(205,128)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C2.16855469 1.65355469 2.16855469 1.65355469 1.3203125 2.3203125 C-2.9807159 5.85603336 -5.88701121 8.29593247 -7 14 C-7.66 14 -8.32 14 -9 14 C-9.28125 11.80078125 -9.28125 11.80078125 -9 9 C-7.03125 6.54296875 -7.03125 6.54296875 -4.5 4.1875 C-3.6646875 3.39730469 -2.829375 2.60710937 -1.96875 1.79296875 C-1.3190625 1.20128906 -0.669375 0.60960938 0 0 Z " fill="#F94C11" transform="translate(188,80)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C0.38461538 6.52307692 0.38461538 6.52307692 -1.5625 8.9375 C-2.036875 9.288125 -2.51125 9.63875 -3 10 C-3.99 9.67 -4.98 9.34 -6 9 C-2.25 2.25 -2.25 2.25 0 0 Z " fill="#E32E05" transform="translate(199,71)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C-3.35701532 6.90164223 -8.27819262 10.68984938 -15 11.25 C-15.99 11.12625 -15.99 11.12625 -17 11 C-14.38102695 9.25401797 -11.89720091 7.96349035 -9.0625 6.625 C-5.42388 4.8349052 -2.60328845 3.19494492 0 0 Z " fill="#D47838" transform="translate(197,60)"/>
<path d="M0 0 C-5.82478551 3.03901852 -10.48208608 3.3540919 -17 3 C-14.52776237 0.52776237 -13.03193317 0.41990229 -9.625 -0.1875 C-8.66851562 -0.36667969 -7.71203125 -0.54585937 -6.7265625 -0.73046875 C-4.12689671 -0.98745577 -2.45299695 -0.81960325 0 0 Z " fill="#F1981A" transform="translate(136,64)"/>
<path d="M0 0 C-3.58727128 2.08351615 -7.20694042 2.80141379 -11.25 3.625 C-13.14492187 4.01558594 -13.14492187 4.01558594 -15.078125 4.4140625 C-16.04234375 4.60742188 -17.0065625 4.80078125 -18 5 C-18 4.34 -18 3.68 -18 3 C-11.75690073 0.22528921 -6.80203375 -0.37634203 0 0 Z " fill="#FBB724" transform="translate(103,63)"/>
<path d="M0 0 C-10.37357631 4.77676538 -10.37357631 4.77676538 -16 3 C-13.06473313 1.04315542 -11.38453435 0.48235576 -8 -0.1875 C-7.13375 -0.36667969 -6.2675 -0.54585937 -5.375 -0.73046875 C-3 -1 -3 -1 0 0 Z " fill="#FCC12C" transform="translate(144,44)"/>
<path d="M0 0 C1.98 0.495 1.98 0.495 4 1 C4.33 2.32 4.66 3.64 5 5 C4.01 5.33 3.02 5.66 2 6 C1.67 6.99 1.34 7.98 1 9 C0.34 8.34 -0.32 7.68 -1 7 C-0.67 6.34 -0.34 5.68 0 5 C0.0396713 3.33380554 0.04384447 1.66608987 0 0 Z " fill="#0D1235" transform="translate(158,224)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5 2.31 5 4.62 5 7 C3.35 7 1.7 7 0 7 C0 4.69 0 2.38 0 0 Z " fill="#C16039" transform="translate(215,224)"/>
<path d="M0 0 C0.8125 1.6875 0.8125 1.6875 1 4 C-1.40123201 7.03685225 -3.06049508 8.72858747 -6.8125 9.8125 C-7.534375 9.874375 -8.25625 9.93625 -9 10 C-8.06409496 8.8944811 -7.12620142 7.79064547 -6.1875 6.6875 C-5.66542969 6.07261719 -5.14335937 5.45773438 -4.60546875 4.82421875 C-3.12827531 3.14575321 -1.59960869 1.56117966 0 0 Z " fill="#330C0F" transform="translate(182,198)"/>
<path d="M0 0 C0.886875 0.309375 1.77375 0.61875 2.6875 0.9375 C8.30877947 2.57510414 14.18552198 2.66774411 20 3 C20 3.33 20 3.66 20 4 C18.73542969 3.98839844 17.47085938 3.97679687 16.16796875 3.96484375 C14.50781398 3.95546434 12.84765761 3.9463643 11.1875 3.9375 C10.35412109 3.92912109 9.52074219 3.92074219 8.66210938 3.91210938 C7.85966797 3.90888672 7.05722656 3.90566406 6.23046875 3.90234375 C5.49207764 3.89710693 4.75368652 3.89187012 3.99291992 3.88647461 C1.78942591 3.92476787 1.78942591 3.92476787 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#120C16" transform="translate(136,181)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C3.01669827 3.13350534 3.01669827 3.13350534 5 4 C2.35541621 5.32229189 0.32238699 5.09677194 -2.625 5.0625 C-3.62789062 5.05347656 -4.63078125 5.04445312 -5.6640625 5.03515625 C-6.43492187 5.02355469 -7.20578125 5.01195312 -8 5 C-7.34 4.67 -6.68 4.34 -6 4 C-6 3.34 -6 2.68 -6 2 C-4.02 1.34 -2.04 0.68 0 0 Z " fill="#DBB490" transform="translate(151,179)"/>
<path d="M0 0 C-0.99 0.33 -1.98 0.66 -3 1 C-3 1.66 -3 2.32 -3 3 C-4.65 3.66 -6.3 4.32 -8 5 C-11 2 -11 2 -12 0 C-10.56359829 -0.19573608 -9.12580496 -0.38127816 -7.6875 -0.5625 C-6.88699219 -0.66691406 -6.08648437 -0.77132812 -5.26171875 -0.87890625 C-3 -1 -3 -1 0 0 Z " fill="#FBD0AB" transform="translate(162,174)"/>
<path d="M0 0 C2.37590142 3.70416126 2.20500286 6.92984573 2.125 11.25 C2.10695312 12.51328125 2.08890625 13.7765625 2.0703125 15.078125 C2.03550781 16.52445313 2.03550781 16.52445313 2 18 C0.14441208 14.79627065 -0.38249134 12.11260434 -0.6875 8.4375 C-0.77386719 7.48746094 -0.86023438 6.53742188 -0.94921875 5.55859375 C-1 3 -1 3 0 0 Z " fill="#F9BF6A" transform="translate(186,157)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.27560214 6.20104812 0.22899346 11.93184478 -1 18 C-1.33 18 -1.66 18 -2 18 C-2.05397335 15.5622037 -2.09365616 13.12560315 -2.125 10.6875 C-2.14175781 9.99720703 -2.15851562 9.30691406 -2.17578125 8.59570312 C-2.21217794 4.82864604 -2.14378864 3.21568296 0 0 Z " fill="#A41D05" transform="translate(28,133)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 1.32 3 2.64 3 4 C2.22914063 4.20496094 1.45828125 4.40992188 0.6640625 4.62109375 C-0.33882812 4.89050781 -1.34171875 5.15992188 -2.375 5.4375 C-3.37273437 5.70433594 -4.37046875 5.97117188 -5.3984375 6.24609375 C-7.95417701 6.90184356 -7.95417701 6.90184356 -10 8 C-9.67 6.68 -9.34 5.36 -9 4 C-7.68 4 -6.36 4 -5 4 C-5 3.34 -5 2.68 -5 2 C-4.34 2 -3.68 2 -3 2 C-3 2.66 -3 3.32 -3 4 C-1.35 3.67 0.3 3.34 2 3 C2 2.34 2 1.68 2 1 C1.34 0.67 0.68 0.34 0 0 Z " fill="#8A1920" transform="translate(196,124)"/>
<path d="M0 0 C2.475 0.99 2.475 0.99 5 2 C4.34 3.65 3.68 5.3 3 7 C1.68 7 0.36 7 -1 7 C-1 7.66 -1 8.32 -1 9 C-1.99 8.67 -2.98 8.34 -4 8 C-4 7.34 -4 6.68 -4 6 C-2.35 5.34 -0.7 4.68 1 4 C0.67 2.68 0.34 1.36 0 0 Z " fill="#232E68" transform="translate(17,113)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 2.64 1 5.28 1 8 C1.86625 8.433125 1.86625 8.433125 2.75 8.875 C4.83333333 9.91666667 6.91666667 10.95833333 9 12 C2.64 12.48 2.64 12.48 0 10.5 C-1.50371778 6.74070554 -0.72530452 3.95620649 0 0 Z " fill="#F78230" transform="translate(210,92)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C-0.97 3.475 -0.97 3.475 -4 6 C-1.03 7.98 -1.03 7.98 2 10 C-0.60582371 10.93065133 -1.64198224 11.14917407 -4.25 10.0625 C-4.8275 9.711875 -5.405 9.36125 -6 9 C-5.69381595 5.32579134 -5.24228216 4.21864487 -2.4375 1.6875 C-1.633125 1.130625 -0.82875 0.57375 0 0 Z " fill="#F67001" transform="translate(155,69)"/>
<path d="M0 0 C2.0625 0.4375 2.0625 0.4375 4 1 C3.34 2.65 2.68 4.3 2 6 C2.99 6.33 3.98 6.66 5 7 C3.35 7.33 1.7 7.66 0 8 C0 7.34 0 6.68 0 6 C-0.66 6 -1.32 6 -2 6 C-1.125 1.125 -1.125 1.125 0 0 Z " fill="#113FBE" transform="translate(143,47)"/>
<path d="M0 0 C-3.56741255 2.48889248 -6.89041233 4.54955729 -11 6 C-11 4.68 -11 3.36 -11 2 C-3.57142857 -1.57142857 -3.57142857 -1.57142857 0 0 Z " fill="#E45A16" transform="translate(143,46)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-0.66 2 -1.32 2 -2 2 C-2 2.66 -2 3.32 -2 4 C-3.45505358 4.52992692 -4.91418127 5.0486789 -6.375 5.5625 C-7.59316406 5.99755859 -7.59316406 5.99755859 -8.8359375 6.44140625 C-11 7 -11 7 -13 6 C-3.28571429 0 -3.28571429 0 0 0 Z " fill="#210A09" transform="translate(156,220)"/>
<path d="M0 0 C0 1.32 0 2.64 0 4 C-7.42857143 4.28571429 -7.42857143 4.28571429 -11 2 C-7.17679443 0.57741188 -4.08718695 -0.24042276 0 0 Z " fill="#7E2325" transform="translate(214,215)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.22126178 2.45779976 1.42750395 4.91527648 1.625 7.375 C1.68945312 8.07367188 1.75390625 8.77234375 1.8203125 9.4921875 C1.96119739 11.32369111 1.98761659 13.16312748 2 15 C1.34 15.66 0.68 16.32 0 17 C-1.33257403 5.47835991 -1.33257403 5.47835991 0 0 Z " fill="#E9A451" transform="translate(188,169)"/>
<path d="M0 0 C2.52259061 1.97420135 2.9929808 2.96745642 3.6875 6.1875 C3.790625 7.115625 3.89375 8.04375 4 9 C3.01 9 2.02 9 1 9 C0.01 6.36 -0.98 3.72 -2 1 C-1.34 0.67 -0.68 0.34 0 0 Z " fill="#341E35" transform="translate(33,178)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.18451025 11.52164009 1.18451025 11.52164009 0 17 C-0.99 17 -1.98 17 -3 17 C-3 17.66 -3 18.32 -3 19 C-3.66 18.67 -4.32 18.34 -5 18 C-4.360625 16.88625 -3.72125 15.7725 -3.0625 14.625 C-0.64256752 9.85354302 -0.2167031 5.28755567 0 0 Z " fill="#FBAD3F" transform="translate(180,161)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 4 2 4 1 6 C-0.32 6 -1.64 6 -3 6 C-3.33 6.66 -3.66 7.32 -4 8 C-5.32 7.34 -6.64 6.68 -8 6 C-5.36 4.02 -2.72 2.04 0 0 Z " fill="#270A1E" transform="translate(223,111)"/>
<path d="M0 0 C-0.6875 1.9375 -0.6875 1.9375 -2 4 C-4.625 4.75 -4.625 4.75 -7 5 C-7 4.34 -7 3.68 -7 3 C-7.99 2.67 -8.98 2.34 -10 2 C-6.49223216 0.39644899 -3.85645121 -0.22036864 0 0 Z " fill="#FAF59B" transform="translate(110,76)"/>
<path d="M0 0 C-2 3 -2 3 -4.125 3.6875 C-4.74375 3.790625 -5.3625 3.89375 -6 4 C-6 3.34 -6 2.68 -6 2 C-6.99 2 -7.98 2 -9 2 C-9 1.01 -9 0.02 -9 -1 C-5.23375329 -2.25541557 -3.62811066 -1.37061958 0 0 Z " fill="#1E5CB1" transform="translate(63,75)"/>
<path d="M0 0 C-5.16017278 2.98746845 -10.19834261 4.02541328 -16 5 C-16 4.34 -16 3.68 -16 3 C-13.89936424 2.30178583 -11.79434263 1.61675528 -9.6875 0.9375 C-8.51574219 0.55464844 -7.34398437 0.17179687 -6.13671875 -0.22265625 C-3 -1 -3 -1 0 0 Z " fill="#EFA108" transform="translate(153,58)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.67 1.99 3.34 2.98 3 4 C2.34 3.67 1.68 3.34 1 3 C0.67 4.98 0.34 6.96 0 9 C-2.5 7.625 -2.5 7.625 -5 6 C-5 5.34 -5 4.68 -5 4 C-4.01 3.67 -3.02 3.34 -2 3 C-1.34 2.01 -0.68 1.02 0 0 Z " fill="#223B70" transform="translate(201,42)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5.5625 1.9375 5.5625 1.9375 6 4 C5 5 5 5 1.9375 5.0625 C0.4834375 5.0315625 0.4834375 5.0315625 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#55B7E9" transform="translate(59,35)"/>
<path d="M0 0 C-0.33 0.99 -0.66 1.98 -1 3 C-3.31 3.33 -5.62 3.66 -8 4 C-8 2.35 -8 0.7 -8 -1 C-4.37673261 -2.2077558 -3.35853631 -1.54311128 0 0 Z " fill="#42B5E8" transform="translate(113,20)"/>
<path d="M0 0 C2.31 0 4.62 0 7 0 C7.33 0.99 7.66 1.98 8 3 C3.56923077 5.09230769 3.56923077 5.09230769 0.6875 4.625 C0.130625 4.41875 -0.42625 4.2125 -1 4 C-0.67 2.68 -0.34 1.36 0 0 Z " fill="#45BEE9" transform="translate(109,4)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C1.32 2.33 2.64 2.66 4 3 C2.02 3.99 2.02 3.99 0 5 C0 4.34 0 3.68 0 3 C-3.12290635 3.48578543 -5.99580359 3.9986012 -9 5 C-6.81610567 0.16423399 -5.20641855 -0.13701101 0 0 Z " fill="#3E192D" transform="translate(53,238)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C6 1.65 6 3.3 6 5 C3.69 5 1.38 5 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#910507" transform="translate(235,215)"/>
<path d="M0 0 C2.97 0.33 5.94 0.66 9 1 C7.515 2.485 7.515 2.485 6 4 C5.01 5.485 5.01 5.485 4 7 C3.67 6.01 3.34 5.02 3 4 C2.34 4 1.68 4 1 4 C0.67 2.68 0.34 1.36 0 0 Z " fill="#FB5E0A" transform="translate(25,204)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.01 1.33 0.02 1.66 -1 2 C-1.68441309 3.3243115 -2.34904149 4.65892758 -3 6 C-4.7265625 7.703125 -4.7265625 7.703125 -6.625 9.25 C-7.25664062 9.77078125 -7.88828125 10.2915625 -8.5390625 10.828125 C-9.02117187 11.21484375 -9.50328125 11.6015625 -10 12 C-9.67 10.35 -9.34 8.7 -9 7 C-8.01 7 -7.02 7 -6 7 C-6 6.34 -6 5.68 -6 5 C-5.34 5 -4.68 5 -4 5 C-3.566875 4.0409375 -3.566875 4.0409375 -3.125 3.0625 C-2 1 -2 1 0 0 Z " fill="#F8AF64" transform="translate(180,195)"/>
<path d="M0 0 C2.29633824 3.44450737 2.54016485 5.93812283 3 10 C2.01 10.495 2.01 10.495 1 11 C-2 5.375 -2 5.375 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#381A43" transform="translate(15,197)"/>
<path d="M0 0 C0.78375 0.04125 1.5675 0.0825 2.375 0.125 C-1.375 3.125 -1.375 3.125 -3.625 3.125 C-3.625 3.785 -3.625 4.445 -3.625 5.125 C-6.925 5.455 -10.225 5.785 -13.625 6.125 C-13.625 5.465 -13.625 4.805 -13.625 4.125 C-12.99851563 4.00382813 -12.37203125 3.88265625 -11.7265625 3.7578125 C-10.90929687 3.59023437 -10.09203125 3.42265625 -9.25 3.25 C-8.43789062 3.08757812 -7.62578125 2.92515625 -6.7890625 2.7578125 C-3.75521698 1.87065912 -3.29744474 0.15702118 0 0 Z " fill="#FBBD6C" transform="translate(152.625,194.875)"/>
<path d="M0 0 C1.6875 1.6875 1.6875 1.6875 3 4 C2.6875 6.75 2.6875 6.75 2 9 C-2.875 4.375 -2.875 4.375 -4 1 C-2 0 -2 0 0 0 Z " fill="#F5E7B5" transform="translate(45,190)"/>
<path d="M0 0 C0 3 0 3 -1.53125 4.60546875 C-2.1809375 5.12753906 -2.830625 5.64960938 -3.5 6.1875 C-4.1496875 6.71730469 -4.799375 7.24710938 -5.46875 7.79296875 C-5.9740625 8.19128906 -6.479375 8.58960938 -7 9 C-7.99 7.68 -8.98 6.36 -10 5 C-6.7 3.35 -3.4 1.7 0 0 Z " fill="#3F302C" transform="translate(167,177)"/>
<path d="M0 0 C2.14699969 3.44175522 2.09856795 5.7720292 1.625 9.75 C1.51414062 10.73484375 1.40328125 11.7196875 1.2890625 12.734375 C1.19367188 13.48203125 1.09828125 14.2296875 1 15 C0.34 14.67 -0.32 14.34 -1 14 C-1.08333357 9.1666528 -0.95261487 4.76307437 0 0 Z " fill="#E58E4B" transform="translate(265,167)"/>
<path d="M0 0 C1.32 1.32 2.64 2.64 4 4 C3.67 4.99 3.34 5.98 3 7 C-1.35535069 5.83857315 -3.64619703 4.92300495 -6 1 C-3.525 1.99 -3.525 1.99 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#222440" transform="translate(93,180)"/>
<path d="M0 0 C2.475 0.99 2.475 0.99 5 2 C4.01 3.98 3.02 5.96 2 8 C2.99 8.33 3.98 8.66 5 9 C3.35 9 1.7 9 0 9 C0 8.01 0 7.02 0 6 C-0.66 5.34 -1.32 4.68 -2 4 C-1.34 3.67 -0.68 3.34 0 3 C0 2.01 0 1.02 0 0 Z " fill="#6D0B08" transform="translate(239,169)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C5.01 0.33 4.02 0.66 3 1 C3.33 3.64 3.66 6.28 4 9 C2.35 9.66 0.7 10.32 -1 11 C-1 10.34 -1 9.68 -1 9 C-0.01 9 0.98 9 2 9 C1.34 6.03 0.68 3.06 0 0 Z " fill="#C4270A" transform="translate(213,168)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C6.66 1.32 7.32 2.64 8 4 C6.02 4.99 6.02 4.99 4 6 C3.01 5.34 2.02 4.68 1 4 C1.66 4 2.32 4 3 4 C3 3.34 3 2.68 3 2 C2.01 2.33 1.02 2.66 0 3 C0 2.01 0 1.02 0 0 Z " fill="#953117" transform="translate(249,147)"/>
<path d="M0 0 C0.99 0.66 1.98 1.32 3 2 C2.24172908 3.17487036 1.46792245 4.33972592 0.6875 5.5 C0.25824219 6.1496875 -0.17101562 6.799375 -0.61328125 7.46875 C-1.07089844 7.9740625 -1.52851563 8.479375 -2 9 C-2.99 9 -3.98 9 -5 9 C-3.7508258 5.54074837 -2.32472205 2.85306797 0 0 Z " fill="#E6CAA8" transform="translate(205,134)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.43155765 5.26500337 1.43155765 5.26500337 1 8 C-1.64494378 10.41823431 -3.2554628 10.95036419 -6.8125 11.1875 C-7.534375 11.125625 -8.25625 11.06375 -9 11 C-9.33 9.35 -9.66 7.7 -10 6 C-9.67 6.99 -9.34 7.98 -9 9 C-4.58477891 7.73025028 -4.58477891 7.73025028 -1 5 C-0.35232207 2.42938689 -0.35232207 2.42938689 0 0 Z " fill="#7D1118" transform="translate(145,130)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C4.39195915 4.17587745 2.82323219 6.13474776 1 10 C-0.95418308 7.06872538 -1.64700993 5.44165321 -2 2 C-1.34 1.34 -0.68 0.68 0 0 Z " fill="#FC9708" transform="translate(181,123)"/>
<path d="M0 0 C4.62 0 9.24 0 14 0 C14.33 0.99 14.66 1.98 15 3 C13.06183265 2.8858134 11.12444901 2.75826577 9.1875 2.625 C8.10855469 2.55539063 7.02960938 2.48578125 5.91796875 2.4140625 C3 2 3 2 0 0 Z " fill="#E8B042" transform="translate(229,118)"/>
<path d="M0 0 C-0.33 1.65 -0.66 3.3 -1 5 C-2.65 5 -4.3 5 -6 5 C-6 3.68 -6 2.36 -6 1 C-4 0 -4 0 0 0 Z " fill="#73749C" transform="translate(20,97)"/>
<path d="M0 0 C-1.25942386 1.19959375 -2.53295286 2.38439443 -3.8125 3.5625 C-4.87404297 4.55443359 -4.87404297 4.55443359 -5.95703125 5.56640625 C-6.63121094 6.03949219 -7.30539063 6.51257813 -8 7 C-8.99 6.67 -9.98 6.34 -11 6 C-11 4 -11 4 -9 2 C-8.01 2 -7.02 2 -6 2 C-6 1.34 -6 0.68 -6 0 C-2.25 -1.125 -2.25 -1.125 0 0 Z " fill="#2F5A99" transform="translate(60,79)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.42415568 3.38564077 0.77772405 5.66682784 0 8 C0.66 8.33 1.32 8.66 2 9 C1.01 9.33 0.02 9.66 -1 10 C-1 9.01 -1 8.02 -1 7 C-2.98 7.99 -2.98 7.99 -5 9 C-5.66 8.34 -6.32 7.68 -7 7 C-5.5459375 6.38125 -5.5459375 6.38125 -4.0625 5.75 C-0.87739901 4.35100832 -0.87739901 4.35100832 -0.125 1.8125 C-0.08375 1.214375 -0.0425 0.61625 0 0 Z " fill="#3D9DDE" transform="translate(112,23)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C2.01 2.485 2.01 2.485 1 4 C0.34 4 -0.32 4 -1 4 C-1 4.66 -1 5.32 -1 6 C-2.29233607 7.37310707 -3.62437146 8.71034824 -5 10 C-5.66 9.67 -6.32 9.34 -7 9 C-6.01 6.69 -5.02 4.38 -4 2 C-2.68 2.33 -1.36 2.66 0 3 C0 2.01 0 1.02 0 0 Z " fill="#FCBD7F" transform="translate(170,181)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C4 0.99 4 1.98 4 3 C3.34 3 2.68 3 2 3 C2 3.99 2 4.98 2 6 C1.01 6 0.02 6 -1 6 C-1.33 6.66 -1.66 7.32 -2 8 C-2 6.02 -2 4.04 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#FEDD54" transform="translate(202,165)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 0.66 3 1.32 3 2 C2.34 2 1.68 2 1 2 C1.33 2.66 1.66 3.32 2 4 C2.13415472 6.6723621 2.04318541 9.32250488 2 12 C-0.37555161 9.62444839 -0.36834858 8.69703006 -0.6875 5.4375 C-0.77386719 4.63183594 -0.86023438 3.82617188 -0.94921875 2.99609375 C-0.96597656 2.33738281 -0.98273438 1.67867187 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#6B090B" transform="translate(193,163)"/>
<path d="M0 0 C1.65 0.33 3.3 0.66 5 1 C4.525625 1.5775 4.05125 2.155 3.5625 2.75 C2.0515133 4.92582084 1.45963849 6.42602448 1 9 C0.34 9 -0.32 9 -1 9 C-0.67 6.03 -0.34 3.06 0 0 Z " fill="#2F2339" transform="translate(74,152)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C4 1.65 4 3.3 4 5 C2.35 5.33 0.7 5.66 -1 6 C-1.042721 4.33388095 -1.04063832 2.66617115 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#51334A" transform="translate(13,144)"/>
<path d="M0 0 C4.82360189 -0.19294408 8.49646738 0.24252386 13 2 C12.67 2.66 12.34 3.32 12 4 C10.56138706 3.91253716 9.12402492 3.80434652 7.6875 3.6875 C6.88699219 3.62949219 6.08648437 3.57148438 5.26171875 3.51171875 C2.63727666 2.91793306 1.69179328 2.04219706 0 0 Z " fill="#961D19" transform="translate(77,135)"/>
<path d="M0 0 C1.670625 0.061875 1.670625 0.061875 3.375 0.125 C3.705 1.445 4.035 2.765 4.375 4.125 C2.375 5.125 2.375 5.125 0.4296875 4.56640625 C-0.28960937 4.27636719 -1.00890625 3.98632812 -1.75 3.6875 C-2.47445312 3.40003906 -3.19890625 3.11257812 -3.9453125 2.81640625 C-4.77675781 2.47416016 -4.77675781 2.47416016 -5.625 2.125 C-3.625 0.125 -3.625 0.125 0 0 Z " fill="#5A161B" transform="translate(200.625,130.875)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C4.33 2.32 4.66 3.64 5 5 C4.01 5 3.02 5 2 5 C1.67 5.99 1.34 6.98 1 8 C0.01 7.34 -0.98 6.68 -2 6 C-1.34 4.02 -0.68 2.04 0 0 Z " fill="#EC210F" transform="translate(147,99)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C2.6875 2.875 2.6875 2.875 2 5 C-1 7 -1 7 -3.1875 6.625 C-3.785625 6.41875 -4.38375 6.2125 -5 6 C-4.67 5.34 -4.34 4.68 -4 4 C-3.34 4 -2.68 4 -2 4 C-1.34 2.68 -0.68 1.36 0 0 Z " fill="#FAEDB6" transform="translate(75,89)"/>
<path d="M0 0 C-1.67617384 1.92759992 -2.59772148 2.90534623 -5.125 3.5 C-5.74375 3.665 -6.3625 3.83 -7 4 C-7.33 4.99 -7.66 5.98 -8 7 C-9.32 6.34 -10.64 5.68 -12 5 C-5.5 -1.96428571 -5.5 -1.96428571 0 0 Z " fill="#F36B09" transform="translate(68,79)"/>
<path d="M0 0 C0.99 0.66 1.98 1.32 3 2 C2.34 3.65 1.68 5.3 1 7 C0.01 6.67 -0.98 6.34 -2 6 C-2 5.34 -2 4.68 -2 4 C-3.32 4.33 -4.64 4.66 -6 5 C-3.375 1.125 -3.375 1.125 0 0 Z " fill="#3697CF" transform="translate(36,48)"/>
<path d="M0 0 C3.33333333 0 6.66666667 0 10 0 C8.875 1.9375 8.875 1.9375 7 4 C3.8125 4.75 3.8125 4.75 1 5 C0.67 3.35 0.34 1.7 0 0 Z " fill="#4CB8E8" transform="translate(73,33)"/>
<path d="M0 0 C-2.79526798 1.86351199 -3.84045627 2.34308907 -7 2.75 C-7.680625 2.84796875 -8.36125 2.9459375 -9.0625 3.046875 C-11 3 -11 3 -14 1 C-8.80451575 -1.20808081 -5.41735797 -0.93402724 0 0 Z " fill="#E58D4A" transform="translate(138,226)"/>
<path d="M0 0 C-0.66 1.32 -1.32 2.64 -2 4 C-2.66 4 -3.32 4 -4 4 C-4 4.66 -4 5.32 -4 6 C-4.66 6 -5.32 6 -6 6 C-6 4.02 -6 2.04 -6 0 C-3.50907189 -1.24546405 -2.58919267 -0.7767578 0 0 Z " fill="#6A3026" transform="translate(181,220)"/>
<path d="M0 0 C2 0 2 0 3.6875 1.25 C4.120625 1.8275 4.55375 2.405 5 3 C4.6875 5.1875 4.6875 5.1875 4 7 C2.35 6.67 0.7 6.34 -1 6 C-0.67 4.02 -0.34 2.04 0 0 Z " fill="#381632" transform="translate(25,175)"/>
<path d="M0 0 C2.97 0.495 2.97 0.495 6 1 C4.5625 3 4.5625 3 2 5 C-1.02824418 5.35442445 -3.96485939 5.23347235 -7 5 C-7.33 5.66 -7.66 6.32 -8 7 C-8 6.01 -8 5.02 -8 4 C-5.36 4 -2.72 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#ED891F" transform="translate(218,151)"/>
<path d="M0 0 C4.29 0.66 8.58 1.32 13 2 C12.34 3.32 11.68 4.64 11 6 C10.34 6 9.68 6 9 6 C8.5875 5.525625 8.175 5.05125 7.75 4.5625 C5.34211572 2.41260332 3.14591416 2.34954602 0 2 C0 1.34 0 0.68 0 0 Z " fill="#F1DD9F" transform="translate(197,145)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 1.99 2 2.98 2 4 C-4.75 6.125 -4.75 6.125 -7 5 C-7 4.01 -7 3.02 -7 2 C-5.824375 1.7834375 -5.824375 1.7834375 -4.625 1.5625 C-2.03578982 1.12201075 -2.03578982 1.12201075 0 0 Z " fill="#A4120F" transform="translate(142,129)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C-0.969375 3.268125 -1.93875 3.53625 -2.9375 3.8125 C-3.948125 4.204375 -4.95875 4.59625 -6 5 C-6.33 5.99 -6.66 6.98 -7 8 C-7.66 7.67 -8.32 7.34 -9 7 C-9 6.01 -9 5.02 -9 4 C-2.25 0 -2.25 0 0 0 Z " fill="#F35D0D" transform="translate(56,87)"/>
<path d="M0 0 C-0.47202486 4.24822374 -2.96655518 6.19989709 -6 9 C-6.08226668 5.95613276 -5.97608217 3.92824652 -5 1 C-3 0 -3 0 0 0 Z " fill="#FC9E0B" transform="translate(183,81)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C1.66 2.33 2.32 2.66 3 3 C1.54550599 4.0055761 0.08627557 5.00430435 -1.375 6 C-2.59316406 6.8353125 -2.59316406 6.8353125 -3.8359375 7.6875 C-6 9 -6 9 -8 9 C-7.875 7.1875 -7.875 7.1875 -7 5 C-5.03384339 3.9349985 -3.03273074 2.93166826 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#E97726" transform="translate(68,77)"/>
<path d="M0 0 C1.98 0.495 1.98 0.495 4 1 C4 1.66 4 2.32 4 3 C4.66 3.66 5.32 4.32 6 5 C5.01 5.66 4.02 6.32 3 7 C3 6.34 3 5.68 3 5 C1.68 5 0.36 5 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#6C8CAF" transform="translate(113,46)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 1.32 2 2.64 2 4 C2.66 4 3.32 4 4 4 C4 5.65 4 7.3 4 9 C3.01 9 2.02 9 1 9 C1 8.01 1 7.02 1 6 C0.34 6 -0.32 6 -1 6 C-1.33 5.01 -1.66 4.02 -2 3 C-1.01 3 -0.02 3 1 3 C0.67 2.01 0.34 1.02 0 0 Z " fill="#6BB8E5" transform="translate(75,41)"/>
<path d="M0 0 C1.32 0.66 2.64 1.32 4 2 C3.34 3.65 2.68 5.3 2 7 C0.02 7 -1.96 7 -4 7 C-4 6.34 -4 5.68 -4 5 C-3.34 4.67 -2.68 4.34 -2 4 C-0.86649466 1.98330173 -0.86649466 1.98330173 0 0 Z " fill="#1456A6" transform="translate(198,25)"/>
<path d="M0 0 C-2.19285876 3.28928814 -2.84761689 3.59463532 -6.4375 4.75 C-7.21996094 5.01296875 -8.00242187 5.2759375 -8.80859375 5.546875 C-11 6 -11 6 -14 5 C-12.02 4.34 -10.04 3.68 -8 3 C-8 2.34 -8 1.68 -8 1 C-5.07175348 0.02391783 -3.04386724 -0.08226668 0 0 Z " fill="#541A21" transform="translate(53,232)"/>
<path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C1.9765625 4.3828125 1.9765625 4.3828125 1.625 7.125 C1.51414063 8.03507813 1.40328125 8.94515625 1.2890625 9.8828125 C1.19367188 10.58148438 1.09828125 11.28015625 1 12 C0.34 12 -0.32 12 -1 12 C-1.02698189 10.37509046 -1.04638757 8.75005367 -1.0625 7.125 C-1.07410156 6.22007812 -1.08570313 5.31515625 -1.09765625 4.3828125 C-1 2 -1 2 0 0 Z " fill="#220816" transform="translate(191,215)"/>
<path d="M0 0 C2.76276177 0.52268466 5.3260876 1.10869587 8 2 C9.1875 4.0625 9.1875 4.0625 10 6 C9.401875 5.835 8.80375 5.67 8.1875 5.5 C5.88655664 4.8885876 5.88655664 4.8885876 3 5 C3.33 4.01 3.66 3.02 4 2 C2.35 2 0.7 2 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#F2D6B6" transform="translate(72,215)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.67 2.32 3.34 3.64 3 5 C1.35 5.33 -0.3 5.66 -2 6 C-1.34 4.02 -0.68 2.04 0 0 Z " fill="#580403" transform="translate(227,208)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C2.65 3.33 4.3 3.66 6 4 C6 4.99 6 5.98 6 7 C4.02 7 2.04 7 0 7 C0 4.69 0 2.38 0 0 Z " fill="#F26F0E" transform="translate(210,161)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C2.32 1.67 3.64 1.34 5 1 C6.60725635 4.21451269 6.05748185 7.43612536 6 11 C5.67 9.68 5.34 8.36 5 7 C4.34 7 3.68 7 3 7 C3 5.68 3 4.36 3 3 C1.68 3.33 0.36 3.66 -1 4 C-0.67 2.68 -0.34 1.36 0 0 Z " fill="#862009" transform="translate(193,160)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 5.61 2 11.22 2 17 C1.67 17 1.34 17 1 17 C0.63917123 14.35491639 0.28604648 11.70920453 -0.0625 9.0625 C-0.16626953 8.30775391 -0.27003906 7.55300781 -0.37695312 6.77539062 C-0.62665638 4.85525872 -0.81790281 2.92771856 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#FEBC5F" transform="translate(178,144)"/>
<path d="M0 0 C7.57142857 3 7.57142857 3 10 6 C9.67 6.99 9.34 7.98 9 9 C7.49428343 7.88266271 5.99555708 6.75589965 4.5 5.625 C3.6646875 4.99851562 2.829375 4.37203125 1.96875 3.7265625 C1.3190625 3.15679687 0.669375 2.58703125 0 2 C0 1.34 0 0.68 0 0 Z " fill="#DD8123" transform="translate(244,119)"/>
<path d="M0 0 C0.66 0.99 1.32 1.98 2 3 C4.56282742 3.72965366 4.56282742 3.72965366 7 4 C7 4.66 7 5.32 7 6 C4.69 6.33 2.38 6.66 0 7 C-1.04449911 3.86650268 -0.93423645 3.01031744 0 0 Z " fill="#702A3C" transform="translate(231,107)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C3.33 1.99 3.66 2.98 4 4 C3.01 4.495 3.01 4.495 2 5 C2 7.31 2 9.62 2 12 C1.01 11.67 0.02 11.34 -1 11 C-0.67 7.37 -0.34 3.74 0 0 Z " fill="#FBCE50" transform="translate(176,111)"/>
<path d="M0 0 C0 1.65 0 3.3 0 5 C-0.66 5 -1.32 5 -2 5 C-1.34 6.32 -0.68 7.64 0 9 C-1.32 9 -2.64 9 -4 9 C-3.4140625 2.84765625 -3.4140625 2.84765625 -3 1 C-1 0 -1 0 0 0 Z " fill="#482359" transform="translate(230,106)"/>
<path d="M0 0 C2.64 0.33 5.28 0.66 8 1 C7.360625 1.2475 6.72125 1.495 6.0625 1.75 C3.81258459 2.81562433 3.81258459 2.81562433 3.25 5.125 C3.1675 5.74375 3.085 6.3625 3 7 C2.34 7 1.68 7 1 7 C-1 4 -1 4 -0.625 1.8125 C-0.41875 1.214375 -0.2125 0.61625 0 0 Z " fill="#FCF1C0" transform="translate(126,102)"/>
<path d="M0 0 C-4.95 2.97 -4.95 2.97 -10 6 C-10.66 5.34 -11.32 4.68 -12 4 C-11.34 3.67 -10.68 3.34 -10 3 C-9.67 2.01 -9.34 1.02 -9 0 C-2.25 -1.125 -2.25 -1.125 0 0 Z " fill="#9C1E1D" transform="translate(91,103)"/>
<path d="M0 0 C0.66 0.99 1.32 1.98 2 3 C-2.75 6 -2.75 6 -5 6 C-5.33 6.99 -5.66 7.98 -6 9 C-7.24546405 6.50907189 -6.7767578 5.58919267 -6 3 C-5.01 3 -4.02 3 -3 3 C-1.31201173 1.56249809 -1.31201173 1.56249809 0 0 Z " fill="#7C0E10" transform="translate(75,98)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C-5.75 6 -5.75 6 -8 6 C-7.6875 4.125 -7.6875 4.125 -7 2 C-4 0 -4 0 0 0 Z " fill="#F7E7A9" transform="translate(85,87)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0.37660195 2.70884005 -1.29319053 4.37446717 -3 6 C-3.66 6 -4.32 6 -5 6 C-4.34 7.98 -3.68 9.96 -3 12 C-4.32 11.34 -5.64 10.68 -7 10 C-6.84518205 7.29068581 -6.51827919 5.53415961 -4.59765625 3.5546875 C-3.10228292 2.32320358 -1.5537076 1.1570163 0 0 Z " fill="#F1B90D" transform="translate(151,68)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5.33 1.65 5.66 3.3 6 5 C4.35 5.33 2.7 5.66 1 6 C0.67 4.02 0.34 2.04 0 0 Z " fill="#638CBD" transform="translate(32,70)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C-1.64453125 4.38671875 -1.64453125 4.38671875 -3.8125 5.6875 C-4.52019531 6.12449219 -5.22789062 6.56148438 -5.95703125 7.01171875 C-8 8 -8 8 -11 8 C-11 7.34 -11 6.68 -11 6 C-7.37 4.02 -3.74 2.04 0 0 Z " fill="#172E86" transform="translate(216,257)"/>
<path d="M0 0 C3.96 1.98 3.96 1.98 8 4 C8.33 3.34 8.66 2.68 9 2 C9.66 2.33 10.32 2.66 11 3 C11 4.32 11 5.64 11 7 C6.96678237 5.78065514 3.45730521 4.44045073 0 2 C0 1.34 0 0.68 0 0 Z " fill="#84656F" transform="translate(195,227)"/>
<path d="M0 0 C-4.12062943 2.74708629 -6.84276139 3.11949692 -11.6875 3.0625 C-12.68136719 3.05347656 -13.67523438 3.04445312 -14.69921875 3.03515625 C-15.83810547 3.01775391 -15.83810547 3.01775391 -17 3 C-17 2.67 -17 2.34 -17 2 C-11.23918159 0.7017874 -5.91260345 -0.25706972 0 0 Z " fill="#DBA676" transform="translate(120,227)"/>
<path d="M0 0 C2.31 1.98 4.62 3.96 7 6 C7.33 5.34 7.66 4.68 8 4 C8.33 5.32 8.66 6.64 9 8 C6.1875 7.8125 6.1875 7.8125 3 7 C1.14766715 4.59196729 0 3.07258075 0 0 Z " fill="#FA690C" transform="translate(23,195)"/>
<path d="M0 0 C-2.71182212 2.60334924 -3.89133813 2.99456691 -7.75 3.1875 C-8.8225 3.125625 -9.895 3.06375 -11 3 C-7.6562111 -0.84535724 -4.83651161 -1.55459302 0 0 Z " fill="#F9CD89" transform="translate(161,192)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C4.08159574 5.16138263 3.98248524 8.9472484 3 13 C2.67 13 2.34 13 2 13 C1.93941406 12.39671875 1.87882812 11.7934375 1.81640625 11.171875 C1.69072266 9.97304687 1.69072266 9.97304687 1.5625 8.75 C1.48128906 7.96109375 1.40007812 7.1721875 1.31640625 6.359375 C1.02365007 4.17635361 0.57935581 2.1226818 0 0 Z " fill="#3F0305" transform="translate(257,172)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2.31147566 5.56830973 1.89884776 7.50007882 -1 11 C-1.02688151 9.35425434 -1.04634123 7.70838587 -1.0625 6.0625 C-1.07410156 5.14597656 -1.08570312 4.22945312 -1.09765625 3.28515625 C-1 1 -1 1 0 0 Z " fill="#FDFBEE" transform="translate(31,136)"/>
<path d="M0 0 C0.99 0.66 1.98 1.32 3 2 C2.34 3.65 1.68 5.3 1 7 C-2 7 -2 7 -4 6 C-2.84826645 3.53199953 -1.95216435 1.95216435 0 0 Z " fill="#683C3E" transform="translate(184,132)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5.33 1.32 5.66 2.64 6 4 C4.35 4.66 2.7 5.32 1 6 C0.67 4.02 0.34 2.04 0 0 Z " fill="#6B0E0F" transform="translate(259,135)"/>
<path d="M0 0 C2.475 0.495 2.475 0.495 5 1 C5 2.65 5 4.3 5 6 C4.01 6 3.02 6 2 6 C2 5.34 2 4.68 2 4 C1.34 4 0.68 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#A27F78" transform="translate(237,62)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.61279038 4.90232302 -0.22617142 9.02943602 -3 13 C-3.99 13.33 -4.98 13.66 -6 14 C-6 13.34 -6 12.68 -6 12 C-5.34 12 -4.68 12 -4 12 C-3.896875 11.13375 -3.79375 10.2675 -3.6875 9.375 C-2.96601586 5.83316877 -1.72876739 3.15687958 0 0 Z " fill="#FD770C" transform="translate(177,41)"/>
<path d="M0 0 C-0.99 1.485 -0.99 1.485 -2 3 C-2 2.34 -2 1.68 -2 1 C-2.70125 1.495 -3.4025 1.99 -4.125 2.5 C-7.37119719 4.1936681 -9.39340156 4.25162315 -13 4 C-9.0516245 0.65906688 -5.11813443 -1.70604481 0 0 Z " fill="#44C2EC" transform="translate(107,7)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5 1.65 5 3.3 5 5 C3.35 4.67 1.7 4.34 0 4 C0 2.68 0 1.36 0 0 Z " fill="#784C3B" transform="translate(200,253)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C6.33 1.32 6.66 2.64 7 4 C6.34 4 5.68 4 5 4 C4.67 4.66 4.34 5.32 4 6 C2.68 4.02 1.36 2.04 0 0 Z " fill="#2F1D42" transform="translate(55,250)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0.69013727 2.16962686 -0.6229626 3.33562944 -1.9375 4.5 C-2.66839844 5.1496875 -3.39929688 5.799375 -4.15234375 6.46875 C-6 8 -6 8 -7 8 C-7 6.35 -7 4.7 -7 3 C-5.5459375 2.5359375 -5.5459375 2.5359375 -4.0625 2.0625 C-1.15934208 1.30476658 -1.15934208 1.30476658 0 0 Z " fill="#272769" transform="translate(239,239)"/>
<path d="M0 0 C-0.639375 0.309375 -1.27875 0.61875 -1.9375 0.9375 C-3.93610821 1.8345163 -3.93610821 1.8345163 -5 3 C-7.67058851 3.14115161 -10.32432238 3.04247107 -13 3 C-9.21656826 -0.94792877 -5.07874402 -0.29300446 0 0 Z " fill="#E3B290" transform="translate(134,224)"/>
<path d="M0 0 C3 1 3 1 4 3 C6.52733235 3.65555119 6.52733235 3.65555119 9 4 C8.34 4.66 7.68 5.32 7 6 C3.15822926 5.69670231 0.90572328 4.47524576 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#D9B996" transform="translate(77,219)"/>
<path d="M0 0 C1.98 0.99 3.96 1.98 6 3 C6 4.98 6 6.96 6 9 C5.01 8.67 4.02 8.34 3 8 C2.87625 7.195625 2.7525 6.39125 2.625 5.5625 C2.315625 4.2940625 2.315625 4.2940625 2 3 C1.34 2.67 0.68 2.34 0 2 C0 1.34 0 0.68 0 0 Z " fill="#180526" transform="translate(195,217)"/>
<path d="M0 0 C0.7425 0.0825 1.485 0.165 2.25 0.25 C2.25 1.24 2.25 2.23 2.25 3.25 C-2.205 3.745 -2.205 3.745 -6.75 4.25 C-3.42692308 0.31153846 -3.42692308 0.31153846 0 0 Z " fill="#F9B88C" transform="translate(162.75,206.75)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 2.97 2 5.94 2 9 C0.68 9.33 -0.64 9.66 -2 10 C-1.34 6.7 -0.68 3.4 0 0 Z " fill="#331139" transform="translate(257,203)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 1.66 2 2.32 2 3 C0.68 3.33 -0.64 3.66 -2 4 C-2 4.66 -2 5.32 -2 6 C-1.01 6.33 -0.02 6.66 1 7 C-0.98 7.99 -0.98 7.99 -3 9 C-3.66 8.34 -4.32 7.68 -5 7 C-3.625 4.5 -3.625 4.5 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#FBA548" transform="translate(169,185)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 2.97 1 5.94 1 9 C-0.32 9.33 -1.64 9.66 -3 10 C-3.33 8.35 -3.66 6.7 -4 5 C-2.68 5 -1.36 5 0 5 C0 3.35 0 1.7 0 0 Z " fill="#D16F37" transform="translate(197,152)"/>
<path d="M0 0 C3.3 0 6.6 0 10 0 C10 0.33 10 0.66 10 1 C8.63875 1.433125 8.63875 1.433125 7.25 1.875 C4.67797092 2.76531776 2.38653234 3.71494413 0 5 C0 3.35 0 1.7 0 0 Z " fill="#B7652C" transform="translate(210,148)"/>
<path d="M0 0 C1.55078125 1.11328125 1.55078125 1.11328125 3 3 C2.85546875 5.91796875 2.85546875 5.91796875 2.1875 9.1875 C1.86845703 10.81751953 1.86845703 10.81751953 1.54296875 12.48046875 C1.36378906 13.31191406 1.18460938 14.14335937 1 15 C0.67 15 0.34 15 0 15 C-0.19517554 13.06325815 -0.38087873 11.12555991 -0.5625 9.1875 C-0.66691406 8.10855469 -0.77132812 7.02960938 -0.87890625 5.91796875 C-1 3 -1 3 0 0 Z " fill="#331333" transform="translate(164,140)"/>
<path d="M0 0 C2.97 0.33 5.94 0.66 9 1 C9 2.65 9 4.3 9 6 C8.01 6 7.02 6 6 6 C6 5.34 6 4.68 6 4 C5.195625 3.71125 4.39125 3.4225 3.5625 3.125 C1 2 1 2 0 0 Z " fill="#72232A" transform="translate(78,141)"/>
<path d="M0 0 C0.66 1.32 1.32 2.64 2 4 C-2.43076923 7.07692308 -2.43076923 7.07692308 -5.3125 6.6875 C-5.869375 6.460625 -6.42625 6.23375 -7 6 C-6.34 5.01 -5.68 4.02 -5 3 C-3.35 3.33 -1.7 3.66 0 4 C0 2.68 0 1.36 0 0 Z " fill="#C01A0E" transform="translate(142,123)"/>
<path d="M0 0 C2.475 0.495 2.475 0.495 5 1 C5 2.32 5 3.64 5 5 C3.35 5 1.7 5 0 5 C0 3.35 0 1.7 0 0 Z " fill="#7C606D" transform="translate(7,123)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5 1.98 5 3.96 5 6 C2.525 5.01 2.525 5.01 0 4 C0 2.68 0 1.36 0 0 Z " fill="#735064" transform="translate(22,115)"/>
<path d="M0 0 C1.39852912 4.19558737 -0.22736864 6.04566851 -2 10 C-2.69140522 12.77888613 -2.69140522 12.77888613 -3 15 C-3.33 15 -3.66 15 -4 15 C-3.91284983 13.06166004 -3.80467036 11.1242571 -3.6875 9.1875 C-3.62949219 8.10855469 -3.57148438 7.02960938 -3.51171875 5.91796875 C-2.96931493 2.82502483 -2.44710376 1.86977097 0 0 Z " fill="#452B48" transform="translate(30,114)"/>
<path d="M0 0 C2.31 0 4.62 0 7 0 C7 0.99 7 1.98 7 3 C4.69 3.33 2.38 3.66 0 4 C0 2.68 0 1.36 0 0 Z " fill="#92130E" transform="translate(188,105)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.67 2.65 1.34 4.3 1 6 C0.01 6 -0.98 6 -2 6 C-2.33 6.99 -2.66 7.98 -3 9 C-3.75 7.3125 -3.75 7.3125 -4 5 C-2.0625 2.25 -2.0625 2.25 0 0 Z " fill="#E84308" transform="translate(40,102)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C-0.1796875 4.75390625 -0.1796875 4.75390625 -1.875 6.5625 C-4.22310453 9.08137361 -4.22310453 9.08137361 -6 12 C-6.66 12 -7.32 12 -8 12 C-6.59023295 8.96147295 -4.91129772 6.4060405 -2.875 3.75 C-2.06675781 2.69039063 -2.06675781 2.69039063 -1.2421875 1.609375 C-0.83226562 1.07828125 -0.42234375 0.5471875 0 0 Z " fill="#C38154" transform="translate(46,91)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 0.66 2 1.32 2 2 C4.97 2.495 4.97 2.495 8 3 C4.86501708 4.85776765 2.62528568 5.20140476 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#FD880D" transform="translate(191,88)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C1.67 2.64 1.34 5.28 1 8 C-0.32 8.33 -1.64 8.66 -3 9 C-2.30058404 5.85262818 -1.23921302 2.97411124 0 0 Z " fill="#2C63B0" transform="translate(35,75)"/>
<path d="M0 0 C1.12377697 3.30435084 0.89554742 5.0506862 -0.4375 8.25 C-0.72496094 8.95640625 -1.01242188 9.6628125 -1.30859375 10.390625 C-1.53675781 10.92171875 -1.76492187 11.4528125 -2 12 C-2.99 12 -3.98 12 -5 12 C-3.41037341 7.96479403 -1.71767682 3.98188718 0 0 Z " fill="#3D181C" transform="translate(204,71)"/>
<path d="M0 0 C-4.18586481 3.18923033 -6.70558305 4.50423019 -12 4 C-9.8923766 -0.2152468 -4.26296995 -1.87570678 0 0 Z " fill="#FCEEC8" transform="translate(85,75)"/>
<path d="M0 0 C2 1 2 1 3 3 C0.47524538 4.26237731 -1.31200466 4.09856404 -4.125 4.0625 C-5.03507812 4.05347656 -5.94515625 4.04445313 -6.8828125 4.03515625 C-7.58148438 4.02355469 -8.28015625 4.01195313 -9 4 C-6.04245816 2.5086438 -3.13948098 1.07403297 0 0 Z " fill="#E85A07" transform="translate(118,63)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C-0.6875 4.5 -0.6875 4.5 -3 7 C-5.75 7.3125 -5.75 7.3125 -8 7 C-6.71034824 5.62437146 -5.37310707 4.29233607 -4 3 C-3.34 3 -2.68 3 -2 3 C-2 2.34 -2 1.68 -2 1 C-1.34 0.67 -0.68 0.34 0 0 Z " fill="#D6A534" transform="translate(117,52)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2.33 0.99 2.66 1.98 3 3 C3.33 2.01 3.66 1.02 4 0 C4.99 0.33 5.98 0.66 7 1 C7.6875 3.0625 7.6875 3.0625 8 5 C7.01 4.67 6.02 4.34 5 4 C2.36195411 4.39397335 2.36195411 4.39397335 0 5 C0 3.35 0 1.7 0 0 Z " fill="#201431" transform="translate(89,255)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C3 1.66 3 2.32 3 3 C3.639375 3.28875 4.27875 3.5775 4.9375 3.875 C7 5 7 5 8 7 C5.69 6.67 3.38 6.34 1 6 C0.67 4.02 0.34 2.04 0 0 Z " fill="#0A0311" transform="translate(150,238)"/>
<path d="M0 0 C2.93200474 2.85276137 5.64315404 5.65079784 8 9 C7.01 9 6.02 9 5 9 C2 5.66666667 2 5.66666667 2 3 C1.01 3.33 0.02 3.66 -1 4 C-1.66 3.34 -2.32 2.68 -3 2 C-2.01 2 -1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#62291E" transform="translate(42,194)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2.66 3.3 3.32 6.6 4 10 C2.68 9.67 1.36 9.34 0 9 C0 6.03 0 3.06 0 0 Z " fill="#253051" transform="translate(58,159)"/>
<path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C4.06874034 2.6425235 4.06874034 2.6425235 6 3 C6.33 2.34 6.66 1.68 7 1 C7 2.98 7 4.96 7 7 C6.21625 6.649375 5.4325 6.29875 4.625 5.9375 C3.75875 5.628125 2.8925 5.31875 2 5 C1.01 5.495 1.01 5.495 0 6 C0 4.02 0 2.04 0 0 Z " fill="#26223D" transform="translate(79,156)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 1.98 2 3.96 2 6 C0.68 6.33 -0.64 6.66 -2 7 C-2 6.01 -2 5.02 -2 4 C-2.66 3.01 -3.32 2.02 -4 1 C-2.68 1.33 -1.36 1.66 0 2 C0 1.34 0 0.68 0 0 Z " fill="#EE960A" transform="translate(234,132)"/>
<path d="M0 0 C0.99 0.99 1.98 1.98 3 3 C0.03 3.66 -2.94 4.32 -6 5 C-4 1 -4 1 -2.0625 0.0625 C-1.381875 0.041875 -0.70125 0.02125 0 0 Z " fill="#C92008" transform="translate(93,128)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-0.99 2.33 -1.98 2.66 -3 3 C-3.33 3.66 -3.66 4.32 -4 5 C-4.66 5 -5.32 5 -6 5 C-6.33 5.99 -6.66 6.98 -7 8 C-7.75 6.25 -7.75 6.25 -8 4 C-5.32518618 0.43358158 -4.60293628 0 0 0 Z " fill="#ED2D07" transform="translate(93,118)"/>
<path d="M0 0 C2.97 0.495 2.97 0.495 6 1 C2.99559979 3.00293347 1.29006055 3.49271626 -2.1875 4.125 C-3.08855469 4.29257813 -3.98960938 4.46015625 -4.91796875 4.6328125 C-5.60503906 4.75398438 -6.29210937 4.87515625 -7 5 C-6.67 4.01 -6.34 3.02 -6 2 C-4.02 1.67 -2.04 1.34 0 1 C0 0.67 0 0.34 0 0 Z " fill="#F9D892" transform="translate(92,84)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C2.32 3 3.64 3 5 3 C5 4.32 5 5.64 5 7 C2.03 6.505 2.03 6.505 -1 6 C-0.67 4.02 -0.34 2.04 0 0 Z " fill="#1E2254" transform="translate(240,81)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C4 1.33 4 1.66 4 2 C5.65 2.33 7.3 2.66 9 3 C9 3.33 9 3.66 9 4 C6.36 4.33 3.72 4.66 1 5 C0.67 3.35 0.34 1.7 0 0 Z " fill="#12245D" transform="translate(218,69)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.56359649 9.58114035 1.56359649 9.58114035 -2 14 C-2.33 14 -2.66 14 -3 14 C-3 12.35 -3 10.7 -3 9 C-2.34 9 -1.68 9 -1 9 C-0.67 6.03 -0.34 3.06 0 0 Z " fill="#382E3B" transform="translate(201,45)"/>
<path d="M0 0 C1.8871875 0.0309375 1.8871875 0.0309375 3.8125 0.0625 C-1.43499603 2.68624802 -4.27597633 3.15784716 -10.1875 3.0625 C-6.61118771 0.67829181 -4.20439261 -0.06892447 0 0 Z " fill="#97DDED" transform="translate(104.1875,4.9375)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C4 2.66666667 4 4.33333333 4 6 C1.08482708 4.92598892 -0.77810176 4.22189824 -3 2 C-2.01 2 -1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#262656" transform="translate(63,254)"/>
<path d="M0 0 C1.65 0.33 3.3 0.66 5 1 C5 2.98 5 4.96 5 7 C3.02 7 1.04 7 -1 7 C0.32 6.67 1.64 6.34 3 6 C2.65555119 3.52733235 2.65555119 3.52733235 2 1 C1.34 0.67 0.68 0.34 0 0 Z " fill="#C38E82" transform="translate(210,223)"/>
<path d="M0 0 C1.98 0.99 1.98 0.99 4 2 C3.67 3.65 3.34 5.3 3 7 C2.01 7 1.02 7 0 7 C0 4.69 0 2.38 0 0 Z " fill="#FBFCE3" transform="translate(35,216)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 0.66 3 1.32 3 2 C5.31 2.33 7.62 2.66 10 3 C10 3.33 10 3.66 10 4 C6.7 4 3.4 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#F4DCB0" transform="translate(100,213)"/>
<path d="M0 0 C0.33 1.98 0.66 3.96 1 6 C-0.32 6.33 -1.64 6.66 -3 7 C-3.33 5.35 -3.66 3.7 -4 2 C-1 0 -1 0 0 0 Z " fill="#B95B48" transform="translate(205,182)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C1.66 3 2.32 3 3 3 C2.67 4.65 2.34 6.3 2 8 C1.34 8 0.68 8 0 8 C-0.33 8.66 -0.66 9.32 -1 10 C-1.33 8.68 -1.66 7.36 -2 6 C-1.34 6 -0.68 6 0 6 C0 4.02 0 2.04 0 0 Z " fill="#530A0B" transform="translate(227,176)"/>
<path d="M0 0 C1.2380014 3.57644848 0.74926071 6.33694766 0 10 C-1.32 8.68 -2.64 7.36 -4 6 C-3.34 6 -2.68 6 -2 6 C-1.855625 5.195625 -1.71125 4.39125 -1.5625 3.5625 C-1 1 -1 1 0 0 Z " fill="#8B3112" transform="translate(264,144)"/>
<path d="M0 0 C2.64 0 5.28 0 8 0 C7.625 1.9375 7.625 1.9375 7 4 C6.01 4.495 6.01 4.495 5 5 C5 4.01 5 3.02 5 2 C4.01 2.33 3.02 2.66 2 3 C1.34 2.01 0.68 1.02 0 0 Z " fill="#ED8E24" transform="translate(223,149)"/>
<path d="M0 0 C1.4606285 2.64738916 2 3.89448334 2 7 C1.01 7.33 0.02 7.66 -1 8 C-2.2077558 4.37673261 -1.54311128 3.35853631 0 0 Z M3 2 C3.66 2 4.32 2 5 2 C5 2.66 5 3.32 5 4 C4.01 3.67 3.02 3.34 2 3 C2.33 2.67 2.66 2.34 3 2 Z " fill="#3B252C" transform="translate(51,121)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C1.36 2.65 -1.28 4.3 -4 6 C-4.99 5.34 -5.98 4.68 -7 4 C-7 3.34 -7 2.68 -7 2 C-4.69 2 -2.38 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#4E2219" transform="translate(223,119)"/>
<path d="M0 0 C3 1 3 1 5 4 C1.7 4 -1.6 4 -5 4 C-2 1 -2 1 0 0 Z " fill="#E34418" transform="translate(92,115)"/>
<path d="M0 0 C0.89674777 2.51089376 1.13172674 3.64535109 0.1875 6.1875 C-1 8 -1 8 -3 9 C-3 7.02 -3 5.04 -3 3 C-2.01 2.67 -1.02 2.34 0 2 C0 1.34 0 0.68 0 0 Z " fill="#FAFBF5" transform="translate(39,115)"/>
<path d="M0 0 C-3.6441774 2.4294516 -5.71241272 2.16179575 -10 2 C-9.67 1.01 -9.34 0.02 -9 -1 C-3.375 -2.25 -3.375 -2.25 0 0 Z " fill="#8D2C2D" transform="translate(220,115)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C4 1.99 4 2.98 4 4 C0.86650268 5.04449911 0.01031744 4.93423645 -3 4 C-3 3.34 -3 2.68 -3 2 C-2.01 2 -1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#1A4387" transform="translate(32,101)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C0.56179109 4.55737263 0.14958831 7.57653445 -3 11 C-3.66 10.67 -4.32 10.34 -5 10 C-3.35 6.7 -1.7 3.4 0 0 Z " fill="#ED9528" transform="translate(202,52)"/>
<path d="M0 0 C4.95 0.99 4.95 0.99 10 2 C8.02 2.99 8.02 2.99 6 4 C4.73195434 6.0335948 4.73195434 6.0335948 4 8 C3.67 6.02 3.34 4.04 3 2 C2.01 2 1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#307ECB" transform="translate(107,43)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5 0.66 5 1.32 5 2 C5.66 2 6.32 2 7 2 C7 2.66 7 3.32 7 4 C8.32 4.66 9.64 5.32 11 6 C6.48986609 5.46939601 3.61621781 3.69113883 0 1 C0 0.67 0 0.34 0 0 Z " fill="#1B246D" transform="translate(67,260)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C0.36 2.98 -2.28 4.96 -5 7 C-5.66 6.67 -6.32 6.34 -7 6 C-6 4 -6 4 -3 3 C-1.33289654 1.50014391 -1.33289654 1.50014391 0 0 Z " fill="#0A1346" transform="translate(224,249)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 3.63 1 7.26 1 11 C0.34 11 -0.32 11 -1 11 C-1.33 8.69 -1.66 6.38 -2 4 C-1.34 4 -0.68 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#FD920B" transform="translate(49,213)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 3.3 1 6.6 1 10 C-0.98 10 -2.96 10 -5 10 C-4.34 9.01 -3.68 8.02 -3 7 C-2.34 7 -1.68 7 -1 7 C-0.67 4.69 -0.34 2.38 0 0 Z " fill="#441C2B" transform="translate(213,205)"/>
<path d="M0 0 C2 1.375 2 1.375 4 3 C4 3.66 4 4.32 4 5 C4.66 5 5.32 5 6 5 C6.33 6.32 6.66 7.64 7 9 C3.64564078 7.61198929 1.88709697 6.11371 0 3 C0 2.01 0 1.02 0 0 Z " fill="#EC4902" transform="translate(22,203)"/>
<path d="M0 0 C2.31 0.66 4.62 1.32 7 2 C7 2.99 7 3.98 7 5 C4.03 4.01 1.06 3.02 -2 2 C-1.34 1.34 -0.68 0.68 0 0 Z " fill="#49121E" transform="translate(35,191)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.08090971 1.62418745 1.13914995 3.24951745 1.1875 4.875 C1.22230469 5.77992188 1.25710937 6.68484375 1.29296875 7.6171875 C1.19628906 8.40351563 1.09960938 9.18984375 1 10 C0.01 10.66 -0.98 11.32 -2 12 C-1.44687265 7.97007218 -0.8441938 3.97977076 0 0 Z " fill="#96211A" transform="translate(184,175)"/>
<path d="M0 0 C0.66 0.99 1.32 1.98 2 3 C2.87072072 4.23220174 3.74584102 5.46130459 4.625 6.6875 C5.07101563 7.31011719 5.51703125 7.93273437 5.9765625 8.57421875 C6.31429687 9.04472656 6.65203125 9.51523438 7 10 C6.01 10 5.02 10 4 10 C2.578125 8.3203125 2.578125 8.3203125 1.25 6.125 C0.57710937 5.04605469 0.57710937 5.04605469 -0.109375 3.9453125 C-0.40328125 3.30335938 -0.6971875 2.66140625 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#E5DCCB" transform="translate(134,158)"/>
<path d="M0 0 C2.0625 0.4375 2.0625 0.4375 4 1 C4 1.66 4 2.32 4 3 C3.34 3 2.68 3 2 3 C1.67 3.99 1.34 4.98 1 6 C0.01 6 -0.98 6 -2 6 C-1.125 1.125 -1.125 1.125 0 0 Z " fill="#61313B" transform="translate(19,162)"/>
<path d="M0 0 C2.64 0 5.28 0 8 0 C8 0.66 8 1.32 8 2 C5.36 2.33 2.72 2.66 0 3 C0 2.01 0 1.02 0 0 Z " fill="#9B1D01" transform="translate(211,161)"/>
<path d="M0 0 C0.928125 0.0825 1.85625 0.165 2.8125 0.25 C1.8225 0.58 0.8325 0.91 -0.1875 1.25 C-0.1875 2.24 -0.1875 3.23 -0.1875 4.25 C-2.1675 4.25 -4.1475 4.25 -6.1875 4.25 C-4.36434338 1.00883268 -3.82500054 0.30000004 0 0 Z " fill="#F9D57F" transform="translate(217.1875,149.75)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C6 0.99 6 1.98 6 3 C4.02 3.33 2.04 3.66 0 4 C0 2.68 0 1.36 0 0 Z " fill="#FEF6C8" transform="translate(197,147)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.23752275 5.10673922 0.87634598 8.90715256 -2.625 12.8125 C-3.07875 13.204375 -3.5325 13.59625 -4 14 C-3.21824485 9.15311808 -1.60155722 4.6233633 0 0 Z " fill="#FCF0CC" transform="translate(157,139)"/>
<path d="M0 0 C1.32 0.66 2.64 1.32 4 2 C3.01 3.98 2.02 5.96 1 8 C0.34 8 -0.32 8 -1 8 C-0.67 5.36 -0.34 2.72 0 0 Z " fill="#332A30" transform="translate(47,131)"/>
<path d="M0 0 C4.83256305 0.41421969 6.82679218 2.46413986 10 6 C9.484375 5.71125 8.96875 5.4225 8.4375 5.125 C5.37643275 3.71219973 2.25055082 2.8751483 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#F3BB2D" transform="translate(222,130)"/>
<path d="M0 0 C1.08667969 0.02707031 2.17335937 0.05414063 3.29296875 0.08203125 C4.54013672 0.13423828 4.54013672 0.13423828 5.8125 0.1875 C5.8125 0.5175 5.8125 0.8475 5.8125 1.1875 C4.25133181 1.52701619 2.68848662 1.85882544 1.125 2.1875 C-0.18017578 2.4659375 -0.18017578 2.4659375 -1.51171875 2.75 C-4.12462964 3.17722047 -6.54563038 3.26366201 -9.1875 3.1875 C-6.54246503 -0.34849411 -4.24021315 -0.13678107 0 0 Z " fill="#3A0D19" transform="translate(233.1875,115.8125)"/>
<path d="M0 0 C-1 2 -2 4 -3 6 C-5.5625 6.625 -5.5625 6.625 -8 7 C-8 5 -8 5 -5.6875 2.375 C-3 0 -3 0 0 0 Z " fill="#F7E8AE" transform="translate(65,101)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C1.66 2 2.32 2 3 2 C3 2.99 3 3.98 3 5 C2.34 5 1.68 5 1 5 C1 5.66 1 6.32 1 7 C0.01 6.67 -0.98 6.34 -2 6 C-1.49396008 3.83125748 -1.00016187 2.00032373 0 0 Z " fill="#101445" transform="translate(204,77)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C-0.07229283 5.13439441 -1.47657021 8.06195683 -3 11 C-3.66 10.01 -4.32 9.02 -5 8 C-3.35 5.36 -1.7 2.72 0 0 Z " fill="#2867A2" transform="translate(20,67)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C4.67 1.65 4.34 3.3 4 5 C3.01 5.33 2.02 5.66 1 6 C0.67 4.02 0.34 2.04 0 0 Z " fill="#472E4D" transform="translate(258,71)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.02501855 2.5027237 0.04490611 4.00211963 -0.9375 5.5 C-1.48277344 6.3353125 -2.02804688 7.170625 -2.58984375 8.03125 C-3.05519531 8.6809375 -3.52054688 9.330625 -4 10 C-4.33 10 -4.66 10 -5 10 C-5 8.35 -5 6.7 -5 5 C-4.360625 4.731875 -3.72125 4.46375 -3.0625 4.1875 C-0.66868314 3.11332248 -0.66868314 3.11332248 0 0 Z " fill="#FA5A10" transform="translate(163,65)"/>
<path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C-2 5 -2 5 -5 5 C-5.99 5.495 -5.99 5.495 -7 6 C-5.52522876 2.59668175 -4.14385429 0 0 0 Z " fill="#1E7BB5" transform="translate(34,52)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C3.02463255 2.65213292 3.02463255 2.65213292 5 3 C0.25 4.125 0.25 4.125 -2 3 C-2.33 3.99 -2.66 4.98 -3 6 C-3 4.35 -3 2.7 -3 1 C-2.01 0.67 -1.02 0.34 0 0 Z " fill="#2489C2" transform="translate(175,15)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C0.66 2.33 1.32 2.66 2 3 C1.01 3.99 0.02 4.98 -1 6 C-2.32 4.35 -3.64 2.7 -5 1 C-2 0 -2 0 0 0 Z " fill="#582A3A" transform="translate(44,237)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C4.34 1.65 3.68 3.3 3 5 C2.01 5 1.02 5 0 5 C0 3.35 0 1.7 0 0 Z " fill="#9E5728" transform="translate(173,234)"/>
<path d="M0 0 C3.3 0 6.6 0 10 0 C10 0.66 10 1.32 10 2 C10.66 2.66 11.32 3.32 12 4 C10.35 4 8.7 4 7 4 C7 3.01 7 2.02 7 1 C4.69 1 2.38 1 0 1 C0 0.67 0 0.34 0 0 Z " fill="#AE0B09" transform="translate(225,215)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-2.64 2 -5.28 2 -8 2 C-8 1.34 -8 0.68 -8 0 C-4.71023192 -1.09658936 -3.28696233 -0.79953138 0 0 Z " fill="#F3B48A" transform="translate(155,211)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 2.98 2 4.96 2 7 C0.02 7.66 -1.96 8.32 -4 9 C-3.2884375 7.88625 -3.2884375 7.88625 -2.5625 6.75 C-1.22130673 4.38949985 -0.487688 2.63351523 0 0 Z " fill="#FCAF22" transform="translate(37,198)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C6.33 0.66 6.66 1.32 7 2 C6.34 2 5.68 2 5 2 C5 2.66 5 3.32 5 4 C3.0625 3.6875 3.0625 3.6875 1 3 C0.67 2.01 0.34 1.02 0 0 Z " fill="#0A102A" transform="translate(117,198)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.34 3.97 0.68 6.94 0 10 C-2 6 -2 6 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#864041" transform="translate(204,191)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 0.66 3 1.32 3 2 C3.66 2 4.32 2 5 2 C5 3.32 5 4.64 5 6 C5.66 6.33 6.32 6.66 7 7 C6.01 7 5.02 7 4 7 C2.02 3.535 2.02 3.535 0 0 Z " fill="#EAE7DA" transform="translate(66,176)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C4 1.99 4 2.98 4 4 C2.35 4.33 0.7 4.66 -1 5 C-1.33 4.01 -1.66 3.02 -2 2 C-1.34 2 -0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#E96329" transform="translate(207,175)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C2.67 1.65 2.34 3.3 2 5 C0.68 5 -0.64 5 -2 5 C-1.34 3.35 -0.68 1.7 0 0 Z " fill="#BC2B11" transform="translate(243,172)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 2.31 1 4.62 1 7 C1.99 6.67 2.98 6.34 4 6 C4.33 6.99 4.66 7.98 5 9 C3.35 9 1.7 9 0 9 C-1.10844919 5.67465243 -0.84454356 3.37817425 0 0 Z " fill="#33132F" transform="translate(20,164)"/>
<path d="M0 0 C2.625 0.375 2.625 0.375 5 1 C4.67 1.99 4.34 2.98 4 4 C3.01 3.67 2.02 3.34 1 3 C0.67 3.99 0.34 4.98 0 6 C0 5.01 0 4.02 0 3 C-0.66 2.67 -1.32 2.34 -2 2 C-1.34 1.34 -0.68 0.68 0 0 Z " fill="#B01E0E" transform="translate(225,166)"/>
<path d="M0 0 C2.97 0 5.94 0 9 0 C9 0.99 9 1.98 9 3 C6.1875 3.1875 6.1875 3.1875 3 3 C2.01 2.01 1.02 1.02 0 0 Z " fill="#DF450D" transform="translate(215,156)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 1.66 2 2.32 2 3 C3.32 3.66 4.64 4.32 6 5 C6 5.33 6 5.66 6 6 C3.69 6 1.38 6 -1 6 C-0.67 4.02 -0.34 2.04 0 0 Z " fill="#ED903D" transform="translate(256,147)"/>
<path d="M0 0 C2 3 2 3 2 7 C1.34 7 0.68 7 0 7 C0 8.65 0 10.3 0 12 C-0.33 12 -0.66 12 -1 12 C-1.02712066 10.56260487 -1.04645067 9.12506137 -1.0625 7.6875 C-1.07410156 6.88699219 -1.08570312 6.08648437 -1.09765625 5.26171875 C-1 3 -1 3 0 0 Z " fill="#481D26" transform="translate(73,142)"/>
<path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C1.625 4.125 1.625 4.125 1 6 C-0.65 6 -2.3 6 -4 6 C-2.68 4.02 -1.36 2.04 0 0 Z " fill="#C39585" transform="translate(209,137)"/>
<path d="M0 0 C1.15941038 3.47823115 0.70820884 5.45895578 0 9 C-0.99 9.33 -1.98 9.66 -3 10 C-4 7 -4 7 -3.22265625 5.17578125 C-2.1484375 3.45052083 -1.07421875 1.72526042 0 0 Z " fill="#AC332B" transform="translate(79,126)"/>
<path d="M0 0 C1.9375 0.75 1.9375 0.75 4 2 C4.75 4.125 4.75 4.125 5 6 C2.03 5.505 2.03 5.505 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#C5230B" transform="translate(80,126)"/>
<path d="M0 0 C0 1.65 0 3.3 0 5 C-1.32 5.33 -2.64 5.66 -4 6 C-4 4.35 -4 2.7 -4 1 C-2 0 -2 0 0 0 Z " fill="#503741" transform="translate(260,95)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C-0.20979308 3.81939117 -2.40062046 6.53058944 -5 9 C-5.33 7.68 -5.66 6.36 -6 5 C-5.34 5 -4.68 5 -4 5 C-4 4.34 -4 3.68 -4 3 C-2 1.375 -2 1.375 0 0 Z " fill="#CB2E02" transform="translate(214,81)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0.02 3.31 -1.96 5.62 -4 8 C-5.32 7.67 -6.64 7.34 -8 7 C-5.36 4.69 -2.72 2.38 0 0 Z " fill="#B78554" transform="translate(63,75)"/>
<path d="M0 0 C-2.97 2.475 -2.97 2.475 -6 5 C-6 4.01 -6 3.02 -6 2 C-6.66 1.67 -7.32 1.34 -8 1 C-3.375 -1.125 -3.375 -1.125 0 0 Z " fill="#C77E36" transform="translate(226,75)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C4 1.65 4 3.3 4 5 C2.68 5 1.36 5 0 5 C0 3.35 0 1.7 0 0 Z " fill="#6888B7" transform="translate(47,72)"/>
<path d="M0 0 C0.99 0.99 1.98 1.98 3 3 C2.67 3.99 2.34 4.98 2 6 C0.02 6 -1.96 6 -4 6 C-3.525625 5.566875 -3.05125 5.13375 -2.5625 4.6875 C-0.76313043 2.97690387 -0.76313043 2.97690387 0 0 Z " fill="#111846" transform="translate(263,72)"/>
<path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C-0.3125 3.5625 -0.3125 3.5625 -3 5 C-3.99 4.67 -4.98 4.34 -6 4 C-3.94766315 1.7522025 -2.99332739 0.9977758 0 0 Z " fill="#F44B00" transform="translate(125,60)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C4 1.32 4 2.64 4 4 C2.02 4 0.04 4 -2 4 C-1.34 2.68 -0.68 1.36 0 0 Z " fill="#0F1953" transform="translate(185,62)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C-1.31578947 6.31578947 -1.31578947 6.31578947 -3 8 C-4.66617115 8.04063832 -6.33388095 8.042721 -8 8 C-7.236875 7.4225 -6.47375 6.845 -5.6875 6.25 C-3.33799083 4.28296907 -1.70676495 2.51523256 0 0 Z " fill="#F87207" transform="translate(130,57)"/>
<path d="M0 0 C2.62901288 1.52206009 4.84365964 2.84365964 7 5 C4.69 5.33 2.38 5.66 0 6 C0 4.02 0 2.04 0 0 Z " fill="#4696D2" transform="translate(49,50)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C5.34 1.32 4.68 2.64 4 4 C2.68 4 1.36 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#698CA6" transform="translate(191,25)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5 1.32 5 2.64 5 4 C2.03 3.505 2.03 3.505 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#F7700E" transform="translate(229,226)"/>
<path d="M0 0 C1.9375 0.3125 1.9375 0.3125 4 1 C4.33 1.99 4.66 2.98 5 4 C3.35 4.33 1.7 4.66 0 5 C0 3.35 0 1.7 0 0 Z " fill="#220F2D" transform="translate(181,218)"/>
<path d="M0 0 C1.32 0.66 2.64 1.32 4 2 C1.1875 3.5625 1.1875 3.5625 -2 5 C-2.99 4.67 -3.98 4.34 -5 4 C-3.35 2.68 -1.7 1.36 0 0 Z " fill="#DCB59D" transform="translate(139,219)"/>
<path d="M0 0 C0 1.98 0 3.96 0 6 C-1.65 5.67 -3.3 5.34 -5 5 C-3.33333333 0 -3.33333333 0 0 0 Z " fill="#0E2156" transform="translate(90,203)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.33 3.63 1.66 7.26 2 11 C1.01 11.33 0.02 11.66 -1 12 C-0.67 8.04 -0.34 4.08 0 0 Z " fill="#EF5003" transform="translate(22,188)"/>
<path d="M0 0 C2.97 0.495 2.97 0.495 6 1 C6 2.65 6 4.3 6 6 C5.34 6 4.68 6 4 6 C4 5.01 4 4.02 4 3 C2.68 2.67 1.36 2.34 0 2 C0 1.34 0 0.68 0 0 Z " fill="#541A22" transform="translate(24,181)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 1.98 1 3.96 1 6 C0.34 6 -0.32 6 -1 6 C-1.33 6.99 -1.66 7.98 -2 9 C-2.66 8.67 -3.32 8.34 -4 8 C-2.68 5.36 -1.36 2.72 0 0 Z " fill="#530508" transform="translate(198,172)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.625 3.4375 3.625 3.4375 3 6 C2.01 6.495 2.01 6.495 1 7 C0.67 4.69 0.34 2.38 0 0 Z " fill="#F3AF69" transform="translate(198,159)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C1.34 1.65 0.68 3.3 0 5 C0.66 5 1.32 5 2 5 C2 4.34 2 3.68 2 3 C2.66 3 3.32 3 4 3 C3.67 3.99 3.34 4.98 3 6 C1.68 6 0.36 6 -1 6 C-1.625 4.125 -1.625 4.125 -2 2 C-1.34 1.34 -0.68 0.68 0 0 Z " fill="#9B1A05" transform="translate(232,153)"/>
<path d="M0 0 C3.96 1.98 3.96 1.98 8 4 C7.67 4.66 7.34 5.32 7 6 C4.69 5.67 2.38 5.34 0 5 C0 3.35 0 1.7 0 0 Z " fill="#E2B69F" transform="translate(182,137)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C-1.98 3.33 -3.96 3.66 -6 4 C-6.33 3.01 -6.66 2.02 -7 1 C-4 0 -4 0 0 0 Z " fill="#DA560E" transform="translate(255,138)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.67 1.99 3.34 2.98 3 4 C4.98 4 6.96 4 9 4 C9 4.33 9 4.66 9 5 C6.36 5 3.72 5 1 5 C0.67 3.35 0.34 1.7 0 0 Z " fill="#6C342A" transform="translate(197,139)"/>
<path d="M0 0 C1.32 0.33 2.64 0.66 4 1 C3.34 1 2.68 1 2 1 C2 1.66 2 2.32 2 3 C2.66 3.66 3.32 4.32 4 5 C3.01 5.33 2.02 5.66 1 6 C0.01 5.34 -0.98 4.68 -2 4 C-1.34 2.68 -0.68 1.36 0 0 Z " fill="#70131C" transform="translate(191,135)"/>
<path d="M0 0 C2.31 0 4.62 0 7 0 C6.67 0.99 6.34 1.98 6 3 C3.69 2.67 1.38 2.34 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z " fill="#7C2626" transform="translate(208,131)"/>
<path d="M0 0 C0 0.66 0 1.32 0 2 C-0.5775 1.773125 -1.155 1.54625 -1.75 1.3125 C-4.12172477 0.73494807 -4.12172477 0.73494807 -6.25 2.4375 C-7.11625 3.2109375 -7.11625 3.2109375 -8 4 C-8.33 2.68 -8.66 1.36 -9 0 C-5.67465243 -1.10844919 -3.37817425 -0.84454356 0 0 Z " fill="#6F1829" transform="translate(169,123)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C-0.465 3.97 -0.465 3.97 -4 7 C-4 5.35 -4 3.7 -4 2 C-3.01 2.33 -2.02 2.66 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#FADBC4" transform="translate(83,119)"/>
<path d="M0 0 C2.97 0.495 2.97 0.495 6 1 C6 1.66 6 2.32 6 3 C4.02 3.33 2.04 3.66 0 4 C0 2.68 0 1.36 0 0 Z " fill="#141131" transform="translate(215,97)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 1.98 1 3.96 1 6 C-0.32 6.33 -1.64 6.66 -3 7 C-1.125 1.125 -1.125 1.125 0 0 Z " fill="#ED530C" transform="translate(46,94)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C-2.3125 4.125 -2.3125 4.125 -5 5 C-5.99 4.34 -6.98 3.68 -8 3 C-5.36 2.01 -2.72 1.02 0 0 Z " fill="#F46F14" transform="translate(204,87)"/>
<path d="M0 0 C-4.75 4 -4.75 4 -7 4 C-8.33783393 3.68521554 -9.67203709 3.35412344 -11 3 C-7.14243493 0.84694043 -4.44870215 -0.39253254 0 0 Z " fill="#E26C24" transform="translate(210,85)"/>
<path d="M0 0 C-0.33 0.99 -0.66 1.98 -1 3 C-3.64 3 -6.28 3 -9 3 C-6.40821726 0.40821726 -3.54324677 -1.77162338 0 0 Z " fill="#FBF36B" transform="translate(116,80)"/>
<path d="M0 0 C1.231394 2.46278801 1.07159196 4.2795055 1 7 C-0.65 7.33 -2.3 7.66 -4 8 C-3.34 7.67 -2.68 7.34 -2 7 C-2.04125 6.21625 -2.0825 5.4325 -2.125 4.625 C-2 2 -2 2 0 0 Z " fill="#FBEF50" transform="translate(141,74)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C-2.31 3.33 -4.62 3.66 -7 4 C-7 3.34 -7 2.68 -7 2 C-4.35261084 0.5393715 -3.10551666 0 0 0 Z " fill="#EF4603" transform="translate(192,68)"/>
<path d="M0 0 C2.64 0 5.28 0 8 0 C8 0.66 8 1.32 8 2 C6.02 2.66 4.04 3.32 2 4 C2 3.34 2 2.68 2 2 C1.34 2 0.68 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#183B83" transform="translate(222,60)"/>
<path d="M0 0 C-6.4 3.07692308 -6.4 3.07692308 -9.4375 2.6875 C-9.953125 2.460625 -10.46875 2.23375 -11 2 C-8.0843098 -0.9156902 -3.79153866 -1.89576933 0 0 Z " fill="#727585" transform="translate(110,58)"/>
<path d="M0 0 C2.64 1.98 5.28 3.96 8 6 C6.68 6.33 5.36 6.66 4 7 C1.75 5.25 1.75 5.25 0 3 C0 2.01 0 1.02 0 0 Z " fill="#1C579F" transform="translate(228,30)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 2.31 1 4.62 1 7 C-0.98 7.99 -0.98 7.99 -3 9 C-3 7.68 -3 6.36 -3 5 C-2.34 5 -1.68 5 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#255DAA" transform="translate(172,27)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1 2.64 1 5.28 1 8 C0.01 8 -0.98 8 -2 8 C-2.20086443 4.28400809 -2.1519437 3.22791555 0 0 Z " fill="#1375D2" transform="translate(171,22)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C4.67 1.32 4.34 2.64 4 4 C2.68 4 1.36 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#4AB8DB" transform="translate(88,23)"/>
<path d="M0 0 C3.465 1.98 3.465 1.98 7 4 C7 4.66 7 5.32 7 6 C4.0625 5.25 4.0625 5.25 1 4 C0.125 1.875 0.125 1.875 0 0 Z " fill="#1A1034" transform="translate(196,225)"/>
<path d="M0 0 C1.98 0.99 1.98 0.99 4 2 C3.67 3.65 3.34 5.3 3 7 C1.5 5.75 1.5 5.75 0 4 C0 2.68 0 1.36 0 0 Z " fill="#F43108" transform="translate(22,199)"/>
<path d="M0 0 C0 3.90838866 -1.50567876 5.11594107 -4 8 C-4.99 7.67 -5.98 7.34 -7 7 C-4.66666667 4.66666667 -2.33333333 2.33333333 0 0 Z " fill="#CC7B3D" transform="translate(186,190)"/>
<path d="M0 0 C1.8125 0.875 1.8125 0.875 2.8125 2.875 C-1.6425 3.37 -1.6425 3.37 -6.1875 3.875 C-2.76553468 -0.15803055 -2.76553468 -0.15803055 0 0 Z " fill="#F8B556" transform="translate(163.1875,191.125)"/>
<path d="M0 0 C1.32 0 2.64 0 4 0 C2.75023244 3.65316671 2.32901247 4.78065836 -1 7 C-0.67 4.69 -0.34 2.38 0 0 Z " fill="#FDB86E" transform="translate(174,174)"/>
<path d="M0 0 C1.9375 0.3125 1.9375 0.3125 4 1 C4.33 1.99 4.66 2.98 5 4 C4.01 4.99 3.02 5.98 2 7 C1.34 4.69 0.68 2.38 0 0 Z " fill="#1E2E54" transform="translate(48,170)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3.33 1.32 3.66 2.64 4 4 C3.01 4.33 2.02 4.66 1 5 C0.34 4.67 -0.32 4.34 -1 4 C-0.67 2.68 -0.34 1.36 0 0 Z " fill="#580805" transform="translate(251,167)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C0.0625 4.125 0.0625 4.125 -1 6 C-2.98 6 -4.96 6 -7 6 C-6.21625 5.38125 -5.4325 4.7625 -4.625 4.125 C-2.03162353 2.10141339 -2.03162353 2.10141339 0 0 Z " fill="#E8E3D6" transform="translate(119,159)"/>
<path d="M0 0 C-0.33 3.96 -0.66 7.92 -1 12 C-1.33 12 -1.66 12 -2 12 C-2 8.7 -2 5.4 -2 2 C-2.66 1.67 -3.32 1.34 -4 1 C-2 0 -2 0 0 0 Z " fill="#CF520B" transform="translate(267,155)"/>
<path d="M0 0 C2.97 0.33 5.94 0.66 9 1 C9 1.99 9 2.98 9 4 C8.01 4 7.02 4 6 4 C6 3.34 6 2.68 6 2 C4.35 2 2.7 2 1 2 C0.67 1.34 0.34 0.68 0 0 Z " fill="#CE5926" transform="translate(237,159)"/>
<path d="M0 0 C1.65 0.33 3.3 0.66 5 1 C4.67 1.99 4.34 2.98 4 4 C2.68 3.67 1.36 3.34 0 3 C0 2.01 0 1.02 0 0 Z " fill="#FA9834" transform="translate(249,153)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C3 1.66 3 2.32 3 3 C2.34 3 1.68 3 1 3 C1.33 3.99 1.66 4.98 2 6 C0.68 6.33 -0.64 6.66 -2 7 C-1.34 4.69 -0.68 2.38 0 0 Z " fill="#2C2452" transform="translate(4,151)"/>
<path d="M0 0 C1.64284201 2.95711562 2.6442194 5.62008426 3 9 C2.34 9.66 1.68 10.32 1 11 C-0.28317892 7.15046324 -0.06643637 4.05261865 0 0 Z " fill="#56323E" transform="translate(98,148)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5.33 1.32 5.66 2.64 6 4 C4.02 4 2.04 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#B03D22" transform="translate(247,149)"/>
<path d="M0 0 C-0.33 2.97 -0.66 5.94 -1 9 C-1.33 9 -1.66 9 -2 9 C-2.185625 7.576875 -2.185625 7.576875 -2.375 6.125 C-2.71687177 2.91332809 -2.71687177 2.91332809 -5 1 C-2 0 -2 0 0 0 Z " fill="#E09C3F" transform="translate(269,142)"/>
<path d="M0 0 C2.1875 1.4375 2.1875 1.4375 4 3 C3.67 4.32 3.34 5.64 3 7 C2.566875 6.38125 2.13375 5.7625 1.6875 5.125 C0.00259517 2.7802755 0.00259517 2.7802755 -3 1 C-2.01 0.67 -1.02 0.34 0 0 Z " fill="#FDBB4C" transform="translate(251,126)"/>
<path d="M0 0 C0.66 0.99 1.32 1.98 2 3 C0.71937515 4.7074998 -0.61767557 6.37373596 -2 8 C-2.66 8 -3.32 8 -4 8 C-2.87548273 5.0280615 -1.77706209 2.66559313 0 0 Z " fill="#5B2B20" transform="translate(56,113)"/>
<path d="M0 0 C0.99 0.66 1.98 1.32 3 2 C3 2.99 3 3.98 3 5 C1.35 5 -0.3 5 -2 5 C-2 2 -2 2 0 0 Z " fill="#170A23" transform="translate(246,113)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C0.25 6.75 0.25 6.75 -2 9 C-3 6 -3 6 -1.5625 2.8125 C-1.046875 1.884375 -0.53125 0.95625 0 0 Z " fill="#D93B0B" transform="translate(35,110)"/>
<path d="M0 0 C1.485 0.99 1.485 0.99 3 2 C3 2.66 3 3.32 3 4 C3.33 4.99 3.66 5.98 4 7 C1.525 6.01 1.525 6.01 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#EB3618" transform="translate(134,98)"/>
<path d="M0 0 C2.475 0.495 2.475 0.495 5 1 C5 2.32 5 3.64 5 5 C3.68 5 2.36 5 1 5 C0.67 3.35 0.34 1.7 0 0 Z " fill="#627989" transform="translate(32,94)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2.33 0.99 2.66 1.98 3 3 C4.99665314 4.68538601 4.99665314 4.68538601 7 6 C4.625 6.125 4.625 6.125 2 6 C1.34 5.34 0.68 4.68 0 4 C0 2.68 0 1.36 0 0 Z " fill="#FCA604" transform="translate(146,74)"/>
<path d="M0 0 C-0.33 0.99 -0.66 1.98 -1 3 C-3.31 3 -5.62 3 -8 3 C-6.23110084 -0.53779831 -3.70375662 0 0 0 Z " fill="#FCEBB9" transform="translate(93,71)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 1.65 2 3.3 2 5 C-0.97 4.505 -0.97 4.505 -4 4 C-4 3.34 -4 2.68 -4 2 C-2.68 2 -1.36 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#297FDA" transform="translate(59,65)"/>
<path d="M0 0 C0 0.99 0 1.98 0 3 C-3 5 -3 5 -6 5 C-5.25 3.0625 -5.25 3.0625 -4 1 C-1.875 0.25 -1.875 0.25 0 0 Z " fill="#E73806" transform="translate(134,51)"/>
<path d="M0 0 C0.33 0 0.66 0 1 0 C1.36923077 5.41538462 1.36923077 5.41538462 -0.5 8.375 C-0.995 8.91125 -1.49 9.4475 -2 10 C-2.66 9.67 -3.32 9.34 -4 9 C-2.68 6.03 -1.36 3.06 0 0 Z " fill="#E83E03" transform="translate(176,47)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C3 1.66 3 2.32 3 3 C-0.46153846 6 -0.46153846 6 -3 6 C-3 5.01 -3 4.02 -3 3 C-2.34 3 -1.68 3 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#3293D9" transform="translate(72,49)"/>
<path d="M0 0 C2.31 0.33 4.62 0.66 7 1 C7 1.99 7 2.98 7 4 C4.03 3.505 4.03 3.505 1 3 C0.67 2.01 0.34 1.02 0 0 Z " fill="#4E1F31" transform="translate(50,236)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C2 1.98 2 3.96 2 6 C3.32 6.33 4.64 6.66 6 7 C4.35 7 2.7 7 1 7 C1 5.68 1 4.36 1 3 C0.01 2.67 -0.98 2.34 -2 2 C-1.34 1.34 -0.68 0.68 0 0 Z " fill="#230813" transform="translate(171,233)"/>
<path d="M0 0 C2.31 1.98 4.62 3.96 7 6 C5.68 6.33 4.36 6.66 3 7 C0 3.375 0 3.375 0 0 Z " fill="#923408" transform="translate(23,216)"/>
<path d="M0 0 C-1.6875 1.5625 -1.6875 1.5625 -4 3 C-6.75 2.6875 -6.75 2.6875 -9 2 C-4 -1.33333333 -4 -1.33333333 0 0 Z " fill="#D9A57B" transform="translate(163,206)"/>
<path d="M0 0 C1.9375 0.3125 1.9375 0.3125 4 1 C4.33 1.99 4.66 2.98 5 4 C3.68 4 2.36 4 1 4 C0.67 2.68 0.34 1.36 0 0 Z " fill="#0A336F" transform="translate(67,194)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C2 1.66 2 2.32 2 3 C-0.64 3.66 -3.28 4.32 -6 5 C-2.25 1.125 -2.25 1.125 0 0 Z " fill="#EFD8AD" transform="translate(157,188)"/>
<path d="M0 0 C3.35595828 0.59927826 5.37801226 1.84622436 8 4 C5.36 3.67 2.72 3.34 0 3 C0 2.01 0 1.02 0 0 Z " fill="#1D2748" transform="translate(76,190)"/>
<path d="M0 0 C1.14926266 0.95421808 2.29430541 1.91352045 3.4375 2.875 C4.07558594 3.40867188 4.71367188 3.94234375 5.37109375 4.4921875 C7 6 7 6 8 8 C4.11137013 6.73882275 2.10624401 5.54735833 0 2 C0 1.34 0 0.68 0 0 Z " fill="#182143" transform="translate(68,181)"/>
<path d="M0 0 C-1.50663783 3.01327566 -4.03166411 3.61056618 -7 5 C-7.66 4.34 -8.32 3.68 -9 3 C-5.55930376 0.70620251 -4.27709699 0 0 0 Z " fill="#191A22" transform="translate(132,182)"/>
<path d="M0 0 C4 2 4 2 5 4 C4.34 4 3.68 4 3 4 C3 5.65 3 7.3 3 9 C2.67 9 2.34 9 2 9 C1.34 6.03 0.68 3.06 0 0 Z " fill="#D6712F" transform="translate(19,178)"/>
<path d="M0 0 C-0.33 2.31 -0.66 4.62 -1 7 C-1.33 7 -1.66 7 -2 7 C-2 5.35 -2 3.7 -2 2 C-3.65 1.67 -5.3 1.34 -7 1 C-3.375 -1.125 -3.375 -1.125 0 0 Z " fill="#5C1105" transform="translate(264,158)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.67 3.97 1.34 6.94 1 10 C-1 8 -1 8 -1.1875 4.4375 C-1 1 -1 1 0 0 Z " fill="#332A37" transform="translate(59,137)"/>
<path d="M0 0 C1.98 0.66 3.96 1.32 6 2 C6 2.66 6 3.32 6 4 C5.01 4.33 4.02 4.66 3 5 C1.5 3.625 1.5 3.625 0 2 C0 1.34 0 0.68 0 0 Z " fill="#88191E" transform="translate(79,137)"/>
<path d="M0 0 C0.66 0 1.32 0 2 0 C1.34 3.3 0.68 6.6 0 10 C-0.33 10 -0.66 10 -1 10 C-1.02689216 8.52093108 -1.04634621 7.04172517 -1.0625 5.5625 C-1.07410156 4.73878906 -1.08570312 3.91507813 -1.09765625 3.06640625 C-1 1 -1 1 0 0 Z " fill="#A13B26" transform="translate(30,127)"/>
<path d="M0 0 C0 3.10551666 -0.5393715 4.35261084 -2 7 C-3.32 6.67 -4.64 6.34 -6 6 C-4.02 4.02 -2.04 2.04 0 0 Z " fill="#CF3416" transform="translate(86,119)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C1.6875 3 1.6875 3 0 5 C-0.99 5 -1.98 5 -3 5 C-1.125 1.125 -1.125 1.125 0 0 Z " fill="#CF5B3E" transform="translate(221,109)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C1.6875 2.9375 1.6875 2.9375 1 5 C0.01 5.33 -0.98 5.66 -2 6 C-2.66 4.68 -3.32 3.36 -4 2 C-2.125 0.9375 -2.125 0.9375 0 0 Z " fill="#C0241B" transform="translate(153,111)"/>
<path d="M0 0 C-1 3 -1 3 -3 4 C-4.99960012 4.039992 -7.00047242 4.04346799 -9 4 C-3 0 -3 0 0 0 Z " fill="#E7590D" transform="translate(198,108)"/>
<path d="M0 0 C1.09898702 3.29696105 0.87124444 4.40494903 0.0625 7.6875 C-0.13214844 8.49574219 -0.32679688 9.30398437 -0.52734375 10.13671875 C-0.76130859 11.05904297 -0.76130859 11.05904297 -1 12 C-1.33 12 -1.66 12 -2 12 C-2.05395478 10.37536158 -2.09277195 8.75021459 -2.125 7.125 C-2.14820313 6.22007813 -2.17140625 5.31515625 -2.1953125 4.3828125 C-2 2 -2 2 0 0 Z " fill="#F2994E" transform="translate(213,88)"/>
<path d="M0 0 C1.65 0.99 3.3 1.98 5 3 C4.67 3.99 4.34 4.98 4 6 C3.34 6 2.68 6 2 6 C2 5.34 2 4.68 2 4 C1.01 4 0.02 4 -1 4 C-0.67 2.68 -0.34 1.36 0 0 Z " fill="#1F1732" transform="translate(233,90)"/>
<path d="M0 0 C0.33 0.66 0.66 1.32 1 2 C0.67 2.66 0.34 3.32 0 4 C1.65 3.67 3.3 3.34 5 3 C4.67 3.66 4.34 4.32 4 5 C1.4375 5.625 1.4375 5.625 -1 6 C-1.33 5.01 -1.66 4.02 -2 3 C-1.34 2.01 -0.68 1.02 0 0 Z " fill="#52120C" transform="translate(198,83)"/>
<path d="M0 0 C0.66 0.99 1.32 1.98 2 3 C1.25 5.625 1.25 5.625 0 8 C-0.99 8.495 -0.99 8.495 -2 9 C-1.125 2.25 -1.125 2.25 0 0 Z " fill="#1A4990" transform="translate(11,84)"/>
<path d="M0 0 C0 1.32 0 2.64 0 4 C-3.75 5.125 -3.75 5.125 -6 4 C-6 3.34 -6 2.68 -6 2 C-2.25 0 -2.25 0 0 0 Z " fill="#363E73" transform="translate(240,80)"/>
<path d="M0 0 C2 3 2 3 2 6 C0.02 6.33 -1.96 6.66 -4 7 C-4 6.34 -4 5.68 -4 5 C-3.01 5 -2.02 5 -1 5 C-0.67 3.35 -0.34 1.7 0 0 Z " fill="#1254A4" transform="translate(190,26)"/>
<path d="M0 0 C2.35171131 0.59861742 4.6859378 1.26924352 7 2 C7.33 2.66 7.66 3.32 8 4 C5.69 4 3.38 4 1 4 C0.67 2.68 0.34 1.36 0 0 Z " fill="#337AC4" transform="translate(211,20)"/>
</svg>
\n\n        <span>#{title_online}</span>\n    </div>`; // нужна заглушка, а то при страте лампы говорит пусто
    Lampa.Component.add('alpac', component); //то же самое
    resetTemplates();

    function addButton(e) {
      if (e.render.find('.alpac--button').length) return;
      var btn = $(Lampa.Lang.translate(button));
	  // //console.log(btn.clone().removeClass('focus').prop('outerHTML'))
      btn.on('hover:enter', function() {
        resetTemplates();
        Lampa.Component.add('alpac', component);
		
		var id = Lampa.Utils.hash(e.movie.number_of_seasons ? e.movie.original_name : e.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
        Lampa.Activity.push({
          url: '',
          title: Lampa.Lang.translate('title_online'),
          component: 'alpac',
          search: all[id] ? all[id] : e.movie.title,
          search_one: e.movie.title,
          search_two: e.movie.original_title,
          movie: e.movie,
          page: 1,
		  clarification: all[id] ? true : false
        });
      });
      e.render.after(btn);
    }
    Lampa.Listener.follow('full', function(e) {
      if (e.type == 'complite') {
        addButton({
          render: e.object.activity.render().find('.view--torrent'),
          movie: e.data.movie
        });
      }
    });
    try {
      if (Lampa.Activity.active().component == 'full') {
        addButton({
          render: Lampa.Activity.active().activity.render().find('.view--torrent'),
          movie: Lampa.Activity.active().card
        });
      }
    } catch (e) {}
    if (Lampa.Manifest.app_digital >= 177) {
      var balansers_sync = ["filmix", 'filmixtv', "fxapi", "rezka", "rhsprem", "lumex", "videodb", "collaps", "collaps-dash", "hdvb", "zetflix", "kodik", "ashdi", "kinoukr", "kinotochka", "remux", "iframevideo", "cdnmovies", "anilibria", "animedia", "animego", "animevost", "animebesst", "redheadsound", "alloha", "animelib", "moonanime", "kinopub", "vibix", "vdbmovies", "fancdn", "cdnvideohub", "vokino", "rc/filmix", "rc/fxapi", "rc/rhs", "vcdn", "videocdn", "mirage", "hydraflix","videasy","vidsrc","movpi","vidlink","twoembed","autoembed","smashystream","autoembed","rgshows", "pidtor", "videoseed", "iptvonline", "veoveo"];
      balansers_sync.forEach(function(name) {
        Lampa.Storage.sync('online_choice_' + name, 'object_object');
      });
      Lampa.Storage.sync('online_watched_last', 'object_object');
    }
  }
  if (!window.lampac_plugin) startPlugin();

})();
