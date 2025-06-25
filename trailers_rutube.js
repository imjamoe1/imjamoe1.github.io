// Этот файл интегрирован для показа трейлеров Rutube в карточках фильмов/сериалов Lampa. Дополнительных действий не требуется.

// Rutube Player API
var RT = {
    PlayerState: {
        ENDED: 'stopped',
        PLAYING: 'playing',
        PAUSED: 'paused',
        BUFFERING: 3,
        CUED: 5,
        AD_PLAYING: 'adStart',
        AD_ENDED: 'adEnd',
        UNSTARTED: -1
    },
    Player: function(containerId, options) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.eventHandlers = options.events || {};
        this.iframe = null;
        this.ready = false;
        // Состояния плеера
        this.currentTime = 0;
        this.duration = 0;
        this.playbackQuality = 720;
        this.playerState = RT.PlayerState.UNSTARTED;
        this.qualityList = [];
        this.initPlayer();
    }
};

RT.Player.prototype = {
    initPlayer: function() {
        this.createIframe();
        this.bindEvents();
        this.setupQualityTracking();
    },
    createIframe: function() {
        var iframe = document.createElement('iframe');
        var src = 'https://rutube.ru/play/embed/' + this.options.videoId;
        var params = [];
        var pv = this.options.playerVars || {};
        if (pv.start) params.push('t=' + pv.start);
        if (pv.end) params.push('stopTime=' + pv.end);
        if (pv.skinColor) params.push('skinColor=' + pv.skinColor);
        if (pv.suggestedQuality) {
            this.playbackQuality = pv.suggestedQuality;
        }
        if (this.options.privateKey) {
            src += '/?p=' + encodeURIComponent(this.options.privateKey);
        }
        if (params.length) src += (src.includes('?') ? '&' : '?') + params.join('&');
        iframe.setAttribute('src', src);
        iframe.setAttribute('width', this.options.width || '100%');
        iframe.setAttribute('height', this.options.height || '100%');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('webkitAllowFullScreen', '');
        iframe.setAttribute('mozallowfullscreen', '');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'clipboard-write; autoplay');
        this.container.appendChild(iframe);
        this.iframe = iframe;
    },
    bindEvents: function() {
        var self = this;
        window.addEventListener('message', function(e) {
            if (!self.iframe || e.source !== self.iframe.contentWindow) return;
            try {
                var message = JSON.parse(e.data);
                switch(message.type) {
                    case 'player:ready':
                        self.handleReady(message);
                        break;
                    case 'player:adStart':
                        self.triggerEvent('onStateChange', { data: RT.PlayerState.AD_PLAYING });
                        break;
                    case 'player:adEnd':
                        self.triggerEvent('onStateChange', { data: RT.PlayerState.AD_ENDED });
                        if (self.playerState === RT.PlayerState.ENDED)
                            self.triggerEvent('onStateChange', { data: RT.PlayerState.ENDED });
                        break;
                    case 'player:changeState':
                        self.handleStateChange(message.data);
                        break;
                    case 'player:currentTime':
                        self.currentTime = message.data.time;
                        self.triggerEvent('onTimeUpdate', message.data);
                        break;
                    case 'player:durationChange':
                        self.duration = message.data.duration;
                        self.triggerEvent('onDurationChange', message.data);
                        break;
                    case 'player:currentQuality':
                        self.handleQualityChange(message.data);
                        break;
                    case 'player:qualityList':
                        self.qualityList = message.data.list;
                        self.triggerEvent('onQualityList', message.data.list);
                        break;
                    case 'player:error':
                        self.triggerEvent('onError', message.data);
                        break;
                }
            } catch(err) {
                console.error('Error parsing message:', err);
            }
        });
    },
    handleReady: function(message) {
        this.ready = true;
        this.triggerEvent('onReady');
        this.sendCommand({ type: 'player:getQualityList', data: {} });
    },
    handleStateChange: function(data) {
        const stateMap = {
            playing: RT.PlayerState.PLAYING,
            paused: RT.PlayerState.PAUSED,
            stopped: RT.PlayerState.ENDED,
            lockScreenOn: RT.PlayerState.BUFFERING,
            lockScreenOff: RT.PlayerState.PLAYING
        };
        if (stateMap[data.state]) {
            this.playerState = stateMap[data.state];
        }
        this.triggerEvent('onStateChange', { data: this.playerState });
    },
    handleQualityChange: function(data) {
        const newQuality = data.quality.height;
        if (newQuality !== this.playbackQuality) {
            this.playbackQuality = newQuality;
            this.triggerEvent('onPlaybackQualityChange', { data: newQuality });
        }
    },
    setupQualityTracking: function() {
        setInterval(() => {
            if (this.playerState === RT.PlayerState.PLAYING) {
                this.triggerEvent('onTimeUpdate');
            }
        }, 250);
    },
    mapQuality: function(height) {
        const qualityMap = {
            144: 'tiny',
            240: 'small',
            360: 'medium',
            480: 'large',
            720: 'hd720',
            1080: 'hd1080',
            1440: 'hd1440',
            2160: 'hd2160'
        };
        return qualityMap[height] || 'unknown';
    },
    setPlaybackQuality: function(quality) {
        const heightMap = {
            'tiny': 144,
            'small': 240,
            'medium': 360,
            'large': 480,
            'hd720': 720,
            'hd1080': 1080,
            'hd1440': 1440,
            'hd2160': 2160
        };
        if (this.qualityList.length && (heightMap[quality] || Number.isInteger(quality))) {
            var h = heightMap[quality] || quality;
            var setQuality = this.qualityList.sort(function(a,b){return Math.abs(a - h) - Math.abs(b - h)})[0];
            this.sendCommand({
                type: 'player:changeQuality',
                data: {quality: setQuality}
            });
        }
    },
    getAvailableQualityLevels: function() {
        return this.qualityList.map(h => this.mapQuality(h));
    },
    sendCommand: function(command) {
        if (!this.ready) return;
        this.iframe.contentWindow.postMessage(JSON.stringify(command), '*');
    },
    getCurrentTime: function() {
        return this.currentTime;
    },
    getDuration: function() {
        return this.duration;
    },
    getPlayerState: function() {
        return this.playerState;
    },
    getPlaybackQuality: function() {
        return this.playbackQuality;
    },
    playVideo: function() {
        this.sendCommand({ type: 'player:play', data: {} });
    },
    pauseVideo: function() {
        this.sendCommand({ type: 'player:pause', data: {} });
    },
    stopVideo: function() {
        this.sendCommand({ type: 'player:stop', data: {} });
    },
    seekTo: function(seconds) {
        this.sendCommand({ type: 'player:setCurrentTime', data: { time: seconds } });
    },
    setVolume: function(volume) {
        this.sendCommand({ type: 'player:setVolume', data: { volume: volume } });
    },
    addEventListener: function(event, handler) {
        this.eventHandlers[event] = handler;
    },
    triggerEvent: function(event, data) {
        if (this.eventHandlers[event]) {
            if (!data) data = {};
            data.target = this;
            this.eventHandlers[event](data);
        }
    }
};

// YouTubePlayer.js - исправленная версия для Rutube
var YouTubePlayer = {
  init: function() {
    this.player = null;
    this.firstPlay = false;
    this.isVideoPlaying = false;
    this.isVideoPause = false;
    this.hideTime = 120000; // 2 min
    this.hideBodyTime = 10000; // 10 sec
    this.enabled = null;
    this.playlist = [];
    this.currentTrailerIndex = 0;
    this.playbackCheckTimer = null;
    this.playbackTimeout = 5000;
    this.containerId = 'rutube-trailer-player';
    this.bindEvents();
    this.addStyles();
  },
  bindEvents: function() {
    var _this = this;
    Lampa.Listener.follow('full', function(e) {
      if (e.type === 'complite') {
        _this.loadTrailers(e);
      }
    });
    Lampa.Listener.follow('activity', function(e) {
      if (e.type == 'start') _this.enabled = Lampa.Controller.enabled();
    });
    Navigator.follow('focus', function(event) {
      _this.enabled = Lampa.Controller.enabled();
      var el = event.elem.classList.contains('full-start__button');
      if (_this.firstPlay && _this.enabled.name !== 'full_start') {
        _this.firstPlay = false;
        _this.removePlayer('not in focus');
      }
      if (el) {
        setTimeout(function() {
          if (_this.isVideoPause && _this.player && _this.enabled.name === 'full_start') {
            _this.player.playVideo();
            _this.isVideoPause = false;
          }
          if (!_this.isVideoPlaying && _this.playlist.length && !Lampa.Player.opened() && !_this.firstPlay && 
              Lampa.Activity.active().activity.render().find('.' + _this.containerId).length === 0 && 
              _this.enabled && _this.enabled.name === 'full_start') {
            _this.removePlayer('new card');
            _this.startPlayer();
          }
        }, 500);
      } else {
        if (["console-tabs", "console-body", "menu", "head", "full_reviews", "full_episodes"].indexOf(_this.enabled.name) === -1) {
          _this.removePlayer('enabled controller - ' + _this.enabled.name);
        }
      }
    });
  },
  loadKpTrailers: function(event, callback) {
    // Автоматический запуск трейлера при открытии карточки фильма в Lampa (логика из kinopoiskTrailerPlayer.js)
    var trailerUrl = '';
    if (event && event.object && event.object.data) {
      var data = event.object.data;
      if (data.trailer && data.trailer.url) {
        trailerUrl = data.trailer.url;
      } else if (data.trailer_url) {
        trailerUrl = data.trailer_url;
      } else if (data.trailers && Array.isArray(data.trailers) && data.trailers.length > 0) {
        trailerUrl = data.trailers[0].url || data.trailers[0];
      }
    }
    if (trailerUrl) {
      setTimeout(function() {
        // Определяем тип трейлера (YouTube, iframe и т.д.)
        var isYoutube = trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be');
        var isIframe = trailerUrl.includes('<iframe');
        var url = trailerUrl;
        if (isIframe) {
          // Извлекаем src из iframe
          var match = trailerUrl.match(/src=["']([^"']+)["']/);
          if (match && match[1]) url = match[1];
        }
        callback([{title: 'Кинопоиск трейлер', url: url, iptv: false}]);
      }, 800); // небольшая задержка для корректного отображения
      return;
    }
    callback([]); // Если не найдено
  },
  loadTrailers: function(event) {
    var self = this;
    this.loadKpTrailers(event, function(kpResults) {
      if (kpResults && kpResults.length) {
        self.playlist = kpResults;
        self.startPlayer();
        return;
      }
      // ...существующий код loadTrailers...
      if (!event.object || !event.object.source || !event.data || !event.data.movie) return;
      var movie = event.data.movie;
      var isTv = !!event.object && !!event.object.method && event.object.method === 'tv';
      var title = movie.title || movie.name || movie.original_title || movie.original_name || '';
      if (title === '') return;
      var proxy = Lampa.Storage.get('rutube_search_proxy', 'https://rutube-search.root-1a7.workers.dev/');
      if (proxy && proxy.substr(-1) !== '/') proxy += '/';
      var query = self.cleanString([title, (movie.release_date || movie.first_air_date || '').substring(0,4), 'русский трейлер', isTv ? 'сезон 1' : ''].join(' '));
      var url = proxy + 'https://rutube.ru/api/search/video/?query=' + encodeURIComponent(query) + '&format=json';
      var network = new Lampa.Reguest();
      network.native(url, function(data) {
        if (data && data.results && data.results[0]) {
          var results = data.results.filter(function(r) {
            var isTrailer = r.title.toLowerCase().indexOf('трейлер') >= 0 || 
                            r.title.toLowerCase().indexOf('trailer') >= 0 || 
                            r.title.toLowerCase().indexOf('тайзер') >= 0;
            var durationOk = r.duration && r.duration < 420;
            return !!r.embed_url && isTrailer && durationOk;
          });
          if (results.length) {
            self.playlist = results.map(function(res) {
              return {
                title: res.title,
                url: (res.video_url || res.embed_url) + '?noads=1&no_ads=1',
                iptv: true
              };
            });
            self.startPlayer();
          }
        }
        network.clear();
      }, function(error) {
        network.clear();
        console.log('Rutube trailer search error:', error);
      });
    });
  },
  cleanString: function(str) {
    return str.replace(/[^a-zA-Z\dа-яА-ЯёЁ]+/g, ' ').trim().toLowerCase();
  },
  startPlayer: function() {
    if (!this.playlist.length) return;
    var html = $('<div class="' + this.containerId + '"><div class="player-video__youtube-player" id="' + this.containerId + '-iframe"></div></div>');
    if (Lampa.Platform.tv() || Lampa.Platform.get() == 'android' || Lampa.Platform.get() == 'noname') {
      $('body').append(html[0]);
    } else {
      Lampa.Activity.active().activity.render().find('.full-start-new').prepend(html);
    }
    this.currentTrailerIndex = 0;
    this.createPlayer();
  },
  createPlayer: function() {
    var self = this;
    var videoData = this.playlist[this.currentTrailerIndex];
    var url = videoData.url;
    var isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    var isIframe = url.includes('<iframe');
    if (isYoutube) {
      // Вставка YouTube iframe
      var youtubeIdMatch = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([\w-]+)/);
      var youtubeId = youtubeIdMatch ? youtubeIdMatch[1] : null;
      var embedUrl = youtubeId ? 'https://www.youtube.com/embed/' + youtubeId + '?autoplay=1&controls=1' : url;
      var iframe = document.createElement('iframe');
      iframe.setAttribute('src', embedUrl);
      iframe.setAttribute('width', window.innerWidth * 2);
      iframe.setAttribute('height', (window.innerHeight + 600) * 2);
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'autoplay; encrypted-media');
      var container = document.getElementById(this.containerId + '-iframe');
      if (container) {
        container.innerHTML = '';
        container.appendChild(iframe);
      }
      this.isVideoPlaying = true;
      this.hidePoster();
      this.startAutoStopTimer();
      $('.' + this.containerId).css({opacity: 1, transition: 'opacity 2s ease-in-out'});
      return;
    }
    // Rutube
    if (typeof RT === 'undefined' || typeof RT.Player !== 'function') {
      console.error('RutubePlayer: RT is not defined. Rutube Player API не подключён.');
      this.removePlayer();
      return;
    }
    var videoIdMatch = url.match(/rutube\.ru\/(play\/embed|video)\/([^\/?]+)/);
    var videoId = videoIdMatch ? videoIdMatch[2] : null;
    if (!videoId) {
      console.error('RutubePlayer: Не удалось извлечь videoId из url', url);
      this.removePlayer();
      return;
    }
    this.player = new RT.Player(this.containerId + '-iframe', {
      videoId: videoId,
      width: window.innerWidth * 2,
      height: (window.innerHeight + 600) * 2,
      playerVars: {
        'controls': 0,
        'showinfo': 0,
        'autohide': 1,
        'modestbranding': 1,
        'autoplay': 1,
        'disablekb': 1,
        'fs': 0,
        'enablejsapi': 1,
        'playsinline': 1,
        'mute': 0,
        'rel': 0,
        'suggestedQuality': 'hd1080'
      },
      events: {
        onReady: function(event) {
          try {
            self.player.playVideo();
            self.player.setVolume(1);
            self.isVideoPlaying = true;
            self.hidePoster();
            self.startAutoStopTimer();
            $('.' + self.containerId).css({opacity: 1, transition: 'opacity 2s ease-in-out'});
          } catch (error) {
            console.log('RutubePlayer error:', error);
          }
        },
        onStateChange: function(state) {
          switch (state.data) {
            case RT.PlayerState.PLAYING:
              self.fullScreen();
              break;
            case RT.PlayerState.ENDED:
              self.removePlayer();
              break;
            case RT.PlayerState.BUFFERING:
              self.player.setPlaybackQuality('hd1080');
              break;
            default:
              break;
          }
        },
        onError: function(e) {
          if (self.playlist.length > self.currentTrailerIndex + 1) {
            self.currentTrailerIndex++;
            self.removePlayer();
            setTimeout(function() {
              self.createPlayer();
            }, 1000);
          } else {
            self.removePlayer();
          }
        }
      }
    });
  },
  removePlayer: function(hide) {
    try {
      if (this.player) {
        if (typeof hide == 'string' && hide.indexOf('full_descr') >= 0) {
          this.isVideoPause = true;
          this.player.pauseVideo();
        } else {
          try {
            this.player.destroy();
          } catch (error) {
            console.error('RutubePlayer destroy error:', error);
          }
          $('.' + this.containerId).remove();
          this.fadeOut(false, false, true);
          this.isVideoPlaying = false;
          this.isVideoPause = false;
          this.player = null;
          this.clearAutoStopTimer();
          if (hide !== 'new card') this.hidePoster();
        }
      } else {
        $('.' + this.containerId).remove();
        this.isVideoPlaying = false;
        this.isVideoPause = false;
        this.player = null;
        this.clearAutoStopTimer();
      }
    } catch (e) {
      console.error('RutubePlayer removePlayer error:', e);
    }
  },
  startAutoStopTimer: function() {
    var self = this;
    this.autoStopTimeout = setTimeout(function() {
      self.removePlayer();
    }, self.hideTime);
  },
  clearAutoStopTimer: function() {
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
    }
  },
  fullScreen: function() {
    var _self = this;
    if (window.innerWidth >= 768 && this.isVideoPlaying) {
      setTimeout(function() {
        if (!_self.isVideoPause) _self.fadeOut(true);
      }, _self.hideBodyTime);
    }
  },
  fadeOut: function(fid, key, rem) {
    try {
      var _this = this;
      var element;
      try {
        element = Lampa.Activity.active().activity.render().find('.full-start-new__body');
      } catch (e) {
        element = null;
      }
      if (!!rem) {
        $('body').toggleClass('card--no-cover', false);
        if (element) $(element).css({opacity: 1, transition: 'opacity 1s ease'});
      } else {
        if (element) {
          $(element).css({opacity: fid ? 0 : 1, transition: 'opacity 2s ease'});
          if (this.enabled && this.enabled.name == 'full_start') setTimeout(function() {
            $('body').toggleClass('card--no-cover', true);
            $(element).css({opacity: 0, transition: 'opacity 2s ease'});
          }, !_this.isVideoPause ? _this.hideBodyTime : 3000);
          else $('body').toggleClass('card--no-cover', fid);
          try {
            if ($('body').find('.' + _this.containerId).length)
              $('body').find('.' + _this.containerId).css({
                'z-index': (_this.enabled && _this.enabled.name !== 'full_start') ? -1 : !_this.isVideoPause && fid && !key ? 99 : 9
              });
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error('RutubePlayer fadeOut error:', e);
    }
  },
  hidePoster: function() {
    try {
      var _self = this;
      var fullStartNew;
      try {
        fullStartNew = Lampa.Activity.active().activity.render().find('.full-start-new');
      } catch (e) {
        fullStartNew = null;
      }
      if (fullStartNew && fullStartNew.length) {
        var fullPoster = fullStartNew.find('.full-start-new__img.full--poster');
        var hasTrailersPlayer = !!fullStartNew.find('.' + this.containerId).length;
        var updateFullPosterVisibility = function() {
          if (window.innerWidth >= 340 && window.innerWidth <= 480 && window.innerHeight > 480) {
            _self.fullScreen();
            $(fullPoster).css({opacity: hasTrailersPlayer ? '0' : '1', transition: hasTrailersPlayer ? 'opacity 1s ease-in-out' : 'none'});
          } else $(fullPoster).css({opacity:1, transition: 'none'});
        };
        Lampa.Keypad.listener.follow('keydown', function(e) {
          setTimeout(function() {
            _self.fadeOut(false, true);
          }, 100);
        });
        window.addEventListener('touchstart', function(e) {
          if (_self.isVideoPlaying && _self.player && typeof _self.player.isMuted === 'function') {
            if (_self.player.isMuted()) _self.player.unMute();
            _self.fadeOut(false, false, true);
            if (_self.isVideoPlaying) $(fullPoster).css({opacity:0, transition: 'none'});
          }
        });
        updateFullPosterVisibility();
        window.addEventListener('resize', updateFullPosterVisibility);
      }
    } catch (e) {
      console.error('RutubePlayer hidePoster error:', e);
    }
  },
  addStyles: function() {
    Lampa.Template.add('rutube_styles', `<style>
      .rutube-trailer-player {
        position: fixed;
        z-index: 9;
        left: 0;
        right: 0;
        top: 0;
        width: 100%;
        height: 66%;
        opacity: 0;
        transition: opacity 2s ease-in-out;
      }
      .rutube-trailer-player iframe {
        pointer-events: none;
        position: fixed;
        left: 0;
        right: 0;
        top: -300px;
        border: 0;
        -webkit-transform-origin: left top;
        -moz-transform-origin: left top;
        -ms-transform-origin: left top;
        -o-transform-origin: left top;
        transform-origin: left top;
        -webkit-transform: scale(0.5);
        -moz-transform: scale(0.5);
        -ms-transform: scale(0.5);
        -o-transform: scale(0.5);
        transform: scale(0.5);
        -o-object-fit: cover;
        object-fit: cover;
        aspect-ratio: 10/9;
      }
      @media (max-width: 768px) {
        .rutube-trailer-player {
          height: 50%;
        }
      }
      .card--no-cover .full-start-new__body {
        opacity: 0 !important;
      }
    </style>`);
    $('body').append(Lampa.Template.get('rutube_styles', {}, true));
  }
};

function initRutubePlayer() {
  if (typeof RT !== 'undefined') {
    YouTubePlayer.init();
  } else {
    setTimeout(initRutubePlayer, 100);
  }
}

// Автоматический запуск при загрузке скрипта
initRutubePlayer();
