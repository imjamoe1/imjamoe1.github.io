(function() {
  'use strict';

  var Defined = {
    api: 'lampac',
    localhost: 'http://melnor.mooo.com/',
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

var hostkey = 'http://melnor.mooo.com'.replace('http://', '').replace('https://', '');

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
      net.silent('http://melnor.mooo.com'.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
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
  window.rch_nws[hostkey].typeInvoke('http://melnor.mooo.com', function() {

    client.invoke("RchRegistry", JSON.stringify({
      version: 151,
      host: location.host,
      rchtype: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : (window.rch_nws[hostkey].type || 'web'),
      apkVersion: window.rch_nws[hostkey].apkVersion,
      player: Lampa.Storage.field('player'),
	  account_email: Lampa.Storage.get('account_email', ''),
	  unic_id: Lampa.Storage.get('lampac_unic_id', ''),
	  profile_id: Lampa.Storage.get('lampac_profile_id', ''),
	  token: 'zndyrsob'
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
	      url: 'http://melnor.mooo.com/rch/' + uri + '?id=' + rchId,
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
  window.rch_nws[hostkey].typeInvoke('http://melnor.mooo.com', function() {});

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
      Lampa.Utils.putScript(["http://melnor.mooo.com/js/nws-client-es5.js?v18112025"], function() {}, false, function() {
        rchInvoke(json, call);
      }, true);
    } else {
      rchInvoke(json, call);
    }
  }

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
      var token = 'zndyrsob';
      if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token=zndyrsob');
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
      network.silent(account('http://melnor.mooo.com/lite/withsearch'), function(json) {
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
                if (element.url && element.isonline) {
  // online.js
} 
else if (element.url) {
  if (false) {
    if (Platform.is('browser') && location.host.indexOf("127.0.0.1") !== -1) {
      Noty.show('Видео открыто в playerInner', {time: 3000});
      $.get('http://melnor.mooo.com/player-inner/' + element.url);
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
                Lampa.Player.play(element);
                Lampa.Player.playlist(playlist);
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
                //console.log('Lampac', 'go to voice', find_voice_url);
                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_url),
                  voice_name: find_voice_url.text
                });
                this.request(find_voice_url.url);
              } else if (find_voice_name && !find_voice_name.active) {
                //console.log('Lampac', 'go to voice', find_voice_name);
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
              //console.log('Lampac', 'go to season', season);
              this.request(season.url);
            }
          } else {
            this.doesNotAnswer(json);
          }
        }
      } catch (e) {
        //console.log('Lampac', 'error', e.stack);
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
      html.find('.online-empty__time').text(er && er.accsdb ? er.msg : Lampa.Lang.translate('lampac_does_not_answer_text').replace('{balanser}', balanser[balanser].name));
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
          title: 'Lampac - ' + params.element.title,
          component: 'NovaNetUA',
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
    window.NovaNetUA_plugin = true;
    var manifst = {
      type: 'video',
      version: '1.6.7',
      name: '👑NovaNetUA (Підписка)',
      description: 'http://melnor.mooo.com (Підписка)',
      component: 'NovaNetUA',
      onContextMenu: function onContextMenu(object) {
        return {
          name: Lampa.Lang.translate('lampac_watch'),
          description: 'http://melnor.mooo.com (Підписка)'
        };
      },
      onContextLauch: function onContextLauch(object) {
        resetTemplates();
        Lampa.Component.add('NovaNetUA', component);
		
		var id = Lampa.Utils.hash(object.number_of_seasons ? object.original_name : object.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
        Lampa.Activity.push({
          url: '',
          title: Lampa.Lang.translate('title_online'),
          component: 'NovaNetUA',
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
var button = '<div class="full-start__button selector view--online hdrezka--button" data-subtitle="'.concat(manifst.name, ' v').concat(manifst.version, '">\n        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox=\"0 0 165 165\">\n<path d="M0 0 C15.40330723 12.78847356 25.56435032 30.98466066 28.45166016 50.84423828 C30.45761961 76.17335098 24.81014278 98.10124201 8.45166016 117.84423828 C-4.03615541 132.33239043 -24.41379546 142.62694696 -43.44775391 144.06298828 C-69.10463059 145.33984684 -89.70786378 138.80251065 -109.45849609 122.24267578 C-123.96075419 108.83056565 -132.9176485 88.59787037 -133.93115234 69.05126953 C-134.60392997 46.13500901 -128.80320731 25.44181753 -113.54833984 7.84423828 C-82.75755553 -23.97916379 -34.68322591 -27.57626601 0 0 Z " fill="#F3362A" transform="translate(133.54833984375,18.15576171875)"/>\n<path d="M0 0 C33.66666667 0 33.66666667 0 42 7.8125 C46.11540742 14.37143058 46.36199004 21.33386534 46.3125 28.875 C46.30758545 29.75687988 46.3026709 30.63875977 46.29760742 31.54736328 C46.15853396 39.25987825 45.40844738 46.05711827 40.75 52.4375 C35.47762842 57.3503917 30.5966831 58.38087157 23.53515625 58.29296875 C22.29386963 58.28547607 21.05258301 58.2779834 19.77368164 58.27026367 C17.44164673 58.22929565 17.44164673 58.22929565 15.0625 58.1875 C10.091875 58.125625 5.12125 58.06375 0 58 C0 38.86 0 19.72 0 0 Z " fill="#FDFBF9" transform="translate(88,36)"/>\n<path d="M0 0 C22.11 0 44.22 0 67 0 C67.495 2.97 67.495 2.97 68 6 C68.495 5.175 68.99 4.35 69.5 3.5 C72 1 72 1 74.046875 0.66796875 C76.03425598 0.68558738 78.01940609 0.83495051 80 1 C78.94858193 3.26459277 77.9934535 5.00727389 76.3125 6.875 C74.74962853 8.97388139 74.74962853 8.97388139 75.0625 11.75 C75.85778101 14.50697416 76.763926 16.67109873 78.05859375 19.203125 C78.60277954 20.27288574 78.60277954 20.27288574 79.15795898 21.36425781 C79.43583252 21.90405273 79.71370605 22.44384766 80 23 C81.14982806 20.08489248 82.29415488 17.16765566 83.4375 14.25 C83.76298828 13.425 84.08847656 12.6 84.42382812 11.75 C84.73642578 10.95078125 85.04902344 10.1515625 85.37109375 9.328125 C85.65911865 8.5949707 85.94714355 7.86181641 86.24389648 7.10644531 C86.96864625 5.0873491 87.5189991 3.08915413 88 1 C90.64 1 93.28 1 96 1 C99 6.625 99 6.625 99 10 C99.99 10.33 100.98 10.66 102 11 C103.203125 13.6171875 103.203125 13.6171875 104.25 16.875 C104.60578125 17.94492188 104.9615625 19.01484375 105.328125 20.1171875 C106 23 106 23 105 26 C94.44191344 26.3690205 94.44191344 26.3690205 90 24 C89.67 24.66 89.34 25.32 89 26 C86.04112541 26.08069658 83.0844341 26.14034665 80.125 26.1875 C79.28324219 26.21263672 78.44148438 26.23777344 77.57421875 26.26367188 C76.76855469 26.27333984 75.96289062 26.28300781 75.1328125 26.29296875 C74.38918457 26.3086792 73.64555664 26.32438965 72.87939453 26.34057617 C72.25919434 26.22818604 71.63899414 26.1157959 71 26 C69 23 69 23 69 20 C68.34 20 67.68 20 67 20 C67 21.98 67 23.96 67 26 C60.93533182 26.16896321 54.87051657 26.3293647 48.80541992 26.48217773 C46.74644022 26.53522012 44.68751715 26.59051452 42.62866211 26.64819336 C39.65230523 26.73117058 36.67583203 26.80577795 33.69921875 26.87890625 C32.7935466 26.90594131 31.88787445 26.93297638 30.95475769 26.96083069 C25.35012128 27.08881004 19.89890275 26.81159264 14.32307434 26.2230072 C10.24611174 25.83163272 7.73445892 26.38509885 4 28 C4 27.34 4 26.68 4 26 C2.35 25.67 0.7 25.34 -1 25 C-1.02900455 21.3958502 -1.04680018 17.79173038 -1.0625 14.1875 C-1.07087891 13.16333984 -1.07925781 12.13917969 -1.08789062 11.08398438 C-1.09111328 10.10107422 -1.09433594 9.11816406 -1.09765625 8.10546875 C-1.10289307 7.19949951 -1.10812988 6.29353027 -1.11352539 5.36010742 C-1 3 -1 3 0 0 Z " fill="#D22848" transform="translate(30,102)"/>\n<path d="M0 0 C5.28 0 10.56 0 16 0 C16 7.26 16 14.52 16 22 C21.28 22 26.56 22 32 22 C31.98839844 20.49566406 31.97679688 18.99132812 31.96484375 17.44140625 C31.95546751 15.48177207 31.94636713 13.52213655 31.9375 11.5625 C31.92912109 10.56927734 31.92074219 9.57605469 31.91210938 8.55273438 C31.90727539 7.13637695 31.90727539 7.13637695 31.90234375 5.69140625 C31.89448853 4.37958374 31.89448853 4.37958374 31.88647461 3.04125977 C32 1 32 1 33 0 C37.62 0 42.24 0 47 0 C47 19.47 47 38.94 47 59 C42.38 59 37.76 59 33 59 C32 58 32 58 31.88647461 55.86694336 C31.89171143 54.95050049 31.89694824 54.03405762 31.90234375 53.08984375 C31.90556641 52.10048828 31.90878906 51.11113281 31.91210938 50.09179688 C31.92048828 49.05087891 31.92886719 48.00996094 31.9375 46.9375 C31.94201172 45.89271484 31.94652344 44.84792969 31.95117188 43.77148438 C31.96300073 41.18096546 31.98093681 38.59047578 32 36 C26.72 36 21.44 36 16 36 C16.01160156 37.57652344 16.02320312 39.15304688 16.03515625 40.77734375 C16.04453243 42.83072799 16.05363282 44.8841135 16.0625 46.9375 C16.07087891 47.97841797 16.07925781 49.01933594 16.08789062 50.09179688 C16.09272461 51.57583008 16.09272461 51.57583008 16.09765625 53.08984375 C16.10551147 54.46450806 16.10551147 54.46450806 16.11352539 55.86694336 C16 58 16 58 15 59 C12.66839945 59.09909302 10.33370058 59.12970504 8 59.125 C6.72125 59.12757812 5.4425 59.13015625 4.125 59.1328125 C1 59 1 59 0 58 C-0.09376053 56.18944975 -0.1174411 54.37522799 -0.11352539 52.56225586 C-0.11344986 51.40112778 -0.11337433 50.23999969 -0.11329651 49.04368591 C-0.10813522 47.780168 -0.10297394 46.51665009 -0.09765625 45.21484375 C-0.0962413 43.92888809 -0.09482635 42.64293243 -0.09336853 41.31800842 C-0.08954418 37.89356557 -0.07971462 34.46916491 -0.06866455 31.04473877 C-0.05844864 27.55261811 -0.05387053 24.06049066 -0.04882812 20.56835938 C-0.03809226 13.71222047 -0.02049614 6.8561166 0 0 Z " fill="#FCF2F1" transform="translate(31,36)"/>\n<path d="M0 0 C2.31 0 4.62 0 7 0 C7 2.64 7 5.28 7 8 C7.66 8 8.32 8 9 8 C9.1546875 7.13375 9.1546875 7.13375 9.3125 6.25 C10.17292065 3.43407788 10.79240141 1.99396001 13 0 C15.75393037 -0.34832321 18.20606109 -0.18320911 21 0 C19.94858193 2.26459277 18.9934535 4.00727389 17.3125 5.875 C15.74962853 7.97388139 15.74962853 7.97388139 16.0625 10.75 C16.85778101 13.50697416 17.763926 15.67109873 19.05859375 18.203125 C19.42138428 18.91629883 19.7841748 19.62947266 20.15795898 20.36425781 C20.57476929 21.1739502 20.57476929 21.1739502 21 22 C22.14982806 19.08489248 23.29415488 16.16765566 24.4375 13.25 C24.76298828 12.425 25.08847656 11.6 25.42382812 10.75 C25.73642578 9.95078125 26.04902344 9.1515625 26.37109375 8.328125 C26.65911865 7.5949707 26.94714355 6.86181641 27.24389648 6.10644531 C27.96864625 4.0873491 28.5189991 2.08915413 29 0 C31.64 0 34.28 0 37 0 C45 16.85106383 45 16.85106383 45 24 C42.69 24 40.38 24 38 24 C37.505 22.515 37.505 22.515 37 21 C34.36 21 31.72 21 29 21 C29 21.99 29 22.98 29 24 C23.72 24 18.44 24 13 24 C12.01 22.02 11.02 20.04 10 18 C9.34 18 8.68 18 8 18 C7.67 19.98 7.34 21.96 7 24 C4.69 24 2.38 24 0 24 C0 16.08 0 8.16 0 0 Z " fill="#FBEBE9" transform="translate(89,103)"/>\n<path d="M0 0 C10 0 10 0 12.58984375 1.31640625 C14.89465641 5.70257328 14.61628917 10.06167039 14.5625 14.9375 C14.58634766 15.92685547 14.61019531 16.91621094 14.63476562 17.93554688 C14.6255453 22.50575681 14.46448197 25.24855094 12.02734375 29.19140625 C9 31 9 31 0 31 C0 20.77 0 10.54 0 0 Z " fill="#F14A1F" transform="translate(104,50)"/>\n<path d="M0 0 C13.1778551 -0.4926301 13.1778551 -0.4926301 16.93359375 1.7578125 C19 4 19 4 19.5234375 6.0703125 C19.11111111 11.77777778 19.11111111 11.77777778 18 14 C17.34 14 16.68 14 16 14 C16.28875 14.55429688 16.5775 15.10859375 16.875 15.6796875 C17.431875 16.76636719 17.431875 16.76636719 18 17.875 C18.37125 18.59429687 18.7425 19.31359375 19.125 20.0546875 C20 22 20 22 20 24 C17.36 24 14.72 24 12 24 C9 18.25 9 18.25 9 16 C8.34 16 7.68 16 7 16 C7 18.64 7 21.28 7 24 C4.69 24 2.38 24 0 24 C0 16.08 0 8.16 0 0 Z " fill="#FCECF1" transform="translate(31,103)"/>\n<path d="M0 0 C2.85400391 -0.35644531 2.85400391 -0.35644531 6.4765625 -0.328125 C7.78753906 -0.32296875 9.09851563 -0.3178125 10.44921875 -0.3125 C11.47861572 -0.29703125 11.47861572 -0.29703125 12.52880859 -0.28125 C14.59621585 -0.25042911 16.66285571 -0.24030931 18.73046875 -0.234375 C36.56309525 -0.09492142 36.56309525 -0.09492142 39.953125 2.48828125 C40.38109375 3.09027344 40.8090625 3.69226562 41.25 4.3125 C42.9082832 6.53713676 44.28578063 8.25569846 46.375 10.125 C48.50339122 12.58083602 48.1516376 13.81561031 48 17 C48.32226562 17.82371094 48.64453125 18.64742187 48.9765625 19.49609375 C50.37063312 24.2689233 50.29077846 28.74311158 50.25 33.6875 C50.26160156 35.1115918 50.26160156 35.1115918 50.2734375 36.56445312 C50.27085937 37.47517578 50.26828125 38.38589844 50.265625 39.32421875 C50.26336914 40.15010498 50.26111328 40.97599121 50.25878906 41.8269043 C50 44 50 44 48 47 C47.814375 48.0209375 47.814375 48.0209375 47.625 49.0625 C47 51 47 51 44.9609375 52.12109375 C44.31382812 52.41113281 43.66671875 52.70117188 43 53 C43.2165625 52.36578125 43.433125 51.7315625 43.65625 51.078125 C45.69356735 44.24933908 46.32752574 37.91517701 46.375 30.8125 C46.39530273 29.56678223 46.39530273 29.56678223 46.41601562 28.29589844 C46.36619337 21.31247895 44.88019271 15.25417969 41.375 9.1875 C33.8010437 2.21148762 24.75881704 2.35829694 14.9375 2.25 C10.338125 2.1675 5.73875 2.085 1 2 C1 21.14 1 40.28 1 60 C10.57 60 20.14 60 30 60 C30 60.66 30 61.32 30 62 C25.8882744 62.02465746 21.77657722 62.04283959 17.66479492 62.05493164 C16.26504772 62.0599708 14.8653058 62.06680216 13.46557617 62.07543945 C11.45754223 62.0875232 9.44947043 62.09269807 7.44140625 62.09765625 C6.23170166 62.10289307 5.02199707 62.10812988 3.77563477 62.11352539 C1 62 1 62 0 61 C-0.5408648 56.3930941 -0.77128768 51.75384284 -1.0625 47.125 C-1.10669067 46.43603638 -1.15088135 45.74707275 -1.19641113 45.03723145 C-1.83238643 34.94061168 -2.21046898 24.8685553 -2.25 14.75 C-2.259104 13.60934082 -2.26820801 12.46868164 -2.27758789 11.29345703 C-2.27364014 10.24270996 -2.26969238 9.19196289 -2.265625 8.109375 C-2.26336914 7.19124023 -2.26111328 6.27310547 -2.25878906 5.32714844 C-2 3 -2 3 0 0 Z " fill="#DF5C39" transform="translate(87,34)"/>\n<path d="M0 0 C5.28 0 10.56 0 16 0 C16 1.98 16 3.96 16 6 C13.03 6 10.06 6 7 6 C7 6.99 7 7.98 7 9 C9.64 9 12.28 9 15 9 C15 10.98 15 12.96 15 15 C12.36 15 9.72 15 7 15 C7 15.99 7 16.98 7 18 C9.97 18 12.94 18 16 18 C16 19.98 16 21.96 16 24 C10.72 24 5.44 24 0 24 C0 16.08 0 8.16 0 0 Z " fill="#FDEBF0" transform="translate(52,103)"/>\n<path d="M0 0 C2.08304538 -0.05418326 4.16649768 -0.09287551 6.25 -0.125 C7.99023438 -0.15980469 7.99023438 -0.15980469 9.765625 -0.1953125 C12.908009 -0.00555501 14.31814256 0.52650798 17 2 C17.02312792 9.80575195 17.04091738 17.61149595 17.05181217 25.41727352 C17.05704002 29.0414596 17.06413587 32.6656223 17.07543945 36.28979492 C17.08627184 39.78459975 17.09227758 43.27938204 17.09487724 46.77420235 C17.09763551 48.76239389 17.10544688 50.75057631 17.11329651 52.73875427 C17.11337204 53.93992386 17.11344757 55.14109344 17.11352539 56.37866211 C17.115746 57.44233505 17.11796661 58.506008 17.12025452 59.60191345 C17 62 17 62 16 63 C13.13530675 63.07330331 10.30106326 63.09217831 7.4375 63.0625 C3.2609375 63.0315625 3.2609375 63.0315625 -1 63 C-1 55.41 -1 47.82 -1 40 C-5.62 40 -10.24 40 -15 40 C-14.98839844 41.57652344 -14.97679688 43.15304688 -14.96484375 44.77734375 C-14.95546757 46.83072799 -14.94636718 48.8841135 -14.9375 50.9375 C-14.92912109 51.97841797 -14.92074219 53.01933594 -14.91210938 54.09179688 C-14.90727539 55.57583008 -14.90727539 55.57583008 -14.90234375 57.08984375 C-14.89448853 58.46450806 -14.89448853 58.46450806 -14.88647461 59.86694336 C-15 62 -15 62 -16 63 C-18.6773138 63.09981214 -21.32304175 63.13879875 -24 63.125 C-25.12535156 63.13080078 -25.12535156 63.13080078 -26.2734375 63.13671875 C-31.87338947 63.12661053 -31.87338947 63.12661053 -33 62 C-33.09381302 60.15881971 -33.11743954 58.31402359 -33.11352539 56.47045898 C-33.11344986 55.28931015 -33.11337433 54.10816132 -33.11329651 52.89122009 C-33.10813522 51.6058284 -33.10297394 50.32043671 -33.09765625 48.99609375 C-33.0962413 47.68794205 -33.09482635 46.37979034 -33.09336853 45.03199768 C-33.0895441 41.54837141 -33.07971446 38.06478661 -33.06866455 34.58117676 C-33.05844882 31.02873292 -33.05387056 27.47628241 -33.04882812 23.92382812 C-33.03809212 16.94920168 -33.0210166 9.97460283 -33 3 C-32.67 3 -32.34 3 -32 3 C-31.67 22.14 -31.34 41.28 -31 61 C-26.38 61 -21.76 61 -17 61 C-16.67 53.74 -16.34 46.48 -16 39 C-10.72 39 -5.44 39 0 39 C0.33 46.26 0.66 53.52 1 61 C7.93 61.495 7.93 61.495 15 62 C15 42.53 15 23.06 15 3 C10.05 3 5.1 3 0 3 C0 2.01 0 1.02 0 0 Z " fill="#D23339" transform="translate(63,33)"/>\n<path d="M0 0 C5.61 0 11.22 0 17 0 C17 7 17 7 15.50390625 9.14453125 C14.86324219 9.69496094 14.22257812 10.24539062 13.5625 10.8125 C10.88470551 13.09775868 10.88470551 13.09775868 9 16 C11.64 16 14.28 16 17 16 C17 18.31 17 20.62 17 23 C11.39 23 5.78 23 0 23 C0 15.125 0 15.125 3.5 11.0625 C4.1496875 10.29035156 4.799375 9.51820312 5.46875 8.72265625 C5.9740625 8.15417969 6.479375 7.58570312 7 7 C4.69 6.67 2.38 6.34 0 6 C0 4.02 0 2.04 0 0 Z " fill="#FDEDEF" transform="translate(70,104)"/>\n<path d="M0 0 C0.495 4.455 0.495 4.455 1 9 C0.34 9 -0.32 9 -1 9 C-1 6.36 -1 3.72 -1 1 C-3.31 1.33 -5.62 1.66 -8 2 C-8.33 3.98 -8.66 5.96 -9 8 C-9.33 8 -9.66 8 -10 8 C-10 6.02 -10 4.04 -10 2 C-15.61 2 -21.22 2 -27 2 C-27 3.98 -27 5.96 -27 8 C-24.36 8 -21.72 8 -19 8 C-20.54531144 10.70429501 -22.04178822 13.04670449 -24.125 15.375 C-26.4202293 18.58832102 -26.6948519 21.1093617 -27 25 C-27.66 25 -28.32 25 -29 25 C-29 23.02 -29 21.04 -29 19 C-31.97 19 -34.94 19 -38 19 C-38 18.01 -38 17.02 -38 16 C-35.36 16 -32.72 16 -30 16 C-30 14.02 -30 12.04 -30 10 C-32.64 10 -35.28 10 -38 10 C-38 9.01 -38 8.02 -38 7 C-35.03 7 -32.06 7 -29 7 C-29 5.02 -29 3.04 -29 1 C-9.03189066 -0.14806378 -9.03189066 -0.14806378 0 0 Z " fill="#CC4C61" transform="translate(97,102)"/>\n<path d="M0 0 C0.33 0 0.66 0 1 0 C1 7.59 1 15.18 1 23 C3.31 23 5.62 23 8 23 C8 21.02 8 19.04 8 17 C9.32 17 10.64 17 12 17 C12.66 18.65 13.32 20.3 14 22 C19.28 22.33 24.56 22.66 30 23 C30 22.01 30 21.02 30 20 C32.64 20 35.28 20 38 20 C38.495 20.99 38.495 20.99 39 22 C41.32156597 22.40729228 43.6568787 22.74438677 46 23 C45.69964844 22.16855469 45.39929688 21.33710937 45.08984375 20.48046875 C44.70957031 19.39378906 44.32929688 18.30710937 43.9375 17.1875 C43.55464844 16.10855469 43.17179687 15.02960938 42.77734375 13.91796875 C42 11 42 11 43 8 C45.09114347 11.13671521 45.78982195 13.49049862 46.6875 17.125 C46.95949219 18.20007813 47.23148438 19.27515625 47.51171875 20.3828125 C47.67285156 21.24648437 47.83398438 22.11015625 48 23 C46.36162655 24.63837345 44.49983422 24.17085921 42.25 24.1875 C38.3986669 24.15991165 35.46011805 23.84539629 32 22 C31.67 22.66 31.34 23.32 31 24 C28.04112541 24.08069658 25.0844341 24.14034665 22.125 24.1875 C21.28324219 24.21263672 20.44148438 24.23777344 19.57421875 24.26367188 C18.76855469 24.27333984 17.96289062 24.28300781 17.1328125 24.29296875 C16.38918457 24.3086792 15.64555664 24.32438965 14.87939453 24.34057617 C14.25919434 24.22818604 13.63899414 24.1157959 13 24 C11 21 11 21 11 18 C10.34 18 9.68 18 9 18 C9 19.98 9 21.96 9 24 C5.7 24 2.4 24 -1 24 C-1 21.36 -1 18.72 -1 16 C-3.64 16 -6.28 16 -9 16 C-7.84246892 12.9904192 -6.27469349 11.25481661 -3.9375 9.125 C-0.97786629 6.30218634 -0.19825413 4.16333664 0 0 Z " fill="#D85061" transform="translate(88,104)"/>\n<path d="M0 0 C29 0 29 0 36 3 C32.25 4.125 32.25 4.125 30 3 C27.89625004 2.84558791 25.78804881 2.75007361 23.6796875 2.68359375 C22.54772949 2.64548584 21.41577148 2.60737793 20.24951172 2.56811523 C18.80592285 2.52501221 17.36233398 2.48190918 15.875 2.4375 C9.006875 2.2209375 9.006875 2.2209375 2 2 C2 20.48 2 38.96 2 58 C1.34 58 0.68 58 0 58 C0 38.86 0 19.72 0 0 Z " fill="#FED3C1" transform="translate(88,36)"/>\n<path d="M0 0 C2.08304538 -0.05418326 4.16649768 -0.09287551 6.25 -0.125 C7.99023438 -0.15980469 7.99023438 -0.15980469 9.765625 -0.1953125 C13 0 13 0 17 2 C17 21.14 17 40.28 17 60 C16.01 60.495 16.01 60.495 15 61 C15 41.86 15 22.72 15 3 C10.05 3 5.1 3 0 3 C0 2.01 0 1.02 0 0 Z " fill="#D96B5A" transform="translate(63,33)"/>\n<path d="M0 0 C2.97 0 5.94 0 9 0 C8.44271087 3.34373475 7.64826111 6.03312999 6 9 C7.98 9 9.96 9 12 9 C12 8.34 12 7.68 12 7 C12.66 7 13.32 7 14 7 C13.31063929 10.91121498 12.21749819 14.55508596 10.9375 18.3125 C10.39416016 19.91544922 10.39416016 19.91544922 9.83984375 21.55078125 C9.56269531 22.35902344 9.28554687 23.16726562 9 24 C5.58592799 20.84100234 3.61834729 17.34128083 2 13 C1.88154134 8.14319476 5.12706108 4.67863396 8 1 C5.36 1 2.72 1 0 1 C0 0.67 0 0.34 0 0 Z " fill="#EF3037" transform="translate(102,102)"/>\n<path d="M0 0 C5.61 0 11.22 0 17 0 C17 5 17 5 15.6875 6.8125 C14 8 14 8 11 8 C10.67 7.34 10.34 6.68 10 6 C7.64400765 5.53248212 7.64400765 5.53248212 4.9375 5.375 C4.01839844 5.30023438 3.09929687 5.22546875 2.15234375 5.1484375 C1.44207031 5.09945312 0.73179688 5.05046875 0 5 C0 3.35 0 1.7 0 0 Z " fill="#FBF9FB" transform="translate(70,104)"/>\n<path d="M0 0 C3.3 0 6.6 0 10 0 C10 0.33 10 0.66 10 1 C7.03 1 4.06 1 1 1 C1 11.23 1 21.46 1 32 C9.15528736 31.67725522 9.15528736 31.67725522 12.515625 29.609375 C14.92194163 25.37932366 14.6799075 21.03540586 14.75 16.25 C14.79447266 14.77466797 14.79447266 14.77466797 14.83984375 13.26953125 C14.91042411 10.84627224 14.96317701 8.42396846 15 6 C15.33 6 15.66 6 16 6 C16.05827558 9.5624308 16.09368885 13.12473819 16.125 16.6875 C16.14175781 17.69490234 16.15851563 18.70230469 16.17578125 19.74023438 C16.18222656 20.71669922 16.18867187 21.69316406 16.1953125 22.69921875 C16.20578613 23.59471436 16.21625977 24.49020996 16.22705078 25.4128418 C15.97364399 28.30031677 15.29872931 30.41418281 14 33 C9.35119953 34.97221838 5.12690337 33.56965593 0 33 C0 22.11 0 11.22 0 0 Z " fill="#F4AE96" transform="translate(103,49)"/>\n<path d="M0 0 C0.66 0 1.32 0 2 0 C2.02487921 4.83804966 2.04294428 9.67606135 2.05493164 14.51416016 C2.05993363 16.15707041 2.06673733 17.79997627 2.07543945 19.44287109 C2.0876874 21.81609181 2.09326979 24.18925323 2.09765625 26.5625 C2.10281754 27.28679199 2.10797882 28.01108398 2.11329651 28.75732422 C2.11381759 33.5874339 1.68027235 38.21690863 1 43 C0.67 43 0.34 43 0 43 C-0.91853693 33.20774026 -1.10947992 23.45761743 -1.125 13.625 C-1.12951172 12.40578857 -1.13402344 11.18657715 -1.13867188 9.93041992 C-1.13673828 8.79064697 -1.13480469 7.65087402 -1.1328125 6.4765625 C-1.13168457 5.44611816 -1.13055664 4.41567383 -1.12939453 3.35400391 C-1 1 -1 1 0 0 Z " fill="#E14B26" transform="translate(86,36)"/>\n<path d="M0 0 C0.33 0 0.66 0 1 0 C1 7.59 1 15.18 1 23 C0.67 23 0.34 23 0 23 C-0.33 21.02 -0.66 19.04 -1 17 C-3.64 16.67 -6.28 16.34 -9 16 C-7.84246892 12.9904192 -6.27469349 11.25481661 -3.9375 9.125 C-0.97786629 6.30218634 -0.19825413 4.16333664 0 0 Z " fill="#CF3142" transform="translate(88,104)"/>\n<path d="M0 0 C1.9453125 -0.29296875 1.9453125 -0.29296875 4.125 -0.1875 C5.40375 -0.125625 6.6825 -0.06375 8 0 C6.97379138 2.2102955 5.94283206 4.07317497 4.4375 6 C2.96806014 8.04443806 2.43835352 9.54522028 2 12 C1.34 12 0.68 12 0 12 C0 11.01 0 10.02 0 9 C-1.32 8.34 -2.64 7.68 -4 7 C-2.79618552 4.50638429 -1.54571278 2.31856917 0 0 Z " fill="#FCDCDB" transform="translate(102,103)"/>\n<path d="M0 0 C0.33 0 0.66 0 1 0 C1.39426758 3.58148734 1.76204055 7.16521534 2.125 10.75 C2.23714844 11.76578125 2.34929687 12.7815625 2.46484375 13.828125 C2.56152344 14.8078125 2.65820312 15.7875 2.7578125 16.796875 C2.8520752 17.69760742 2.94633789 18.59833984 3.04345703 19.52636719 C2.99535193 22.26457454 2.34752713 23.65465659 1 26 C0.87625 26.70125 0.7525 27.4025 0.625 28.125 C0 30 0 30 -2.0390625 31.1171875 C-3.00972656 31.55417969 -3.00972656 31.55417969 -4 32 C-3.79503906 31.36578125 -3.59007812 30.7315625 -3.37890625 30.078125 C-0.51241114 20.14825676 -0.29449665 10.27691757 0 0 Z " fill="#E2582F" transform="translate(134,55)"/>\n<path d="M0 0 C1.65 0 3.3 0 5 0 C5 7.59 5 15.18 5 23 C1.65094547 19.65094547 1.10529715 17.50621146 0 13 C0.66 13 1.32 13 2 13 C2.05416188 11.39620659 2.09286638 9.79188594 2.125 8.1875 C2.14820313 7.29417969 2.17140625 6.40085937 2.1953125 5.48046875 C2.18285827 2.74597286 2.18285827 2.74597286 0 0 Z " fill="#BC4A64" transform="translate(47,104)"/>\n<path d="M0 0 C3.20615358 2.57573012 3.82220991 5.19609297 4.75 9.125 C5.01296875 10.20007813 5.2759375 11.27515625 5.546875 12.3828125 C5.69640625 13.24648437 5.8459375 14.11015625 6 15 C4.36162655 16.63837345 2.49983422 16.17085921 0.25 16.1875 C-3.58095452 16.14913565 -6.61295331 15.96667227 -10 14 C-10.33 13.34 -10.66 12.68 -11 12 C-8.69 12 -6.38 12 -4 12 C-3.67 12.66 -3.34 13.32 -3 14 C-0.67843403 14.40729228 1.6568787 14.74438677 4 15 C3.71125 14.16855469 3.4225 13.33710937 3.125 12.48046875 C2.75375 11.39378906 2.3825 10.30710937 2 9.1875 C1.62875 8.10855469 1.2575 7.02960938 0.875 5.91796875 C0 3 0 3 0 0 Z " fill="#D63E40" transform="translate(130,112)"/>\n<path d="M0 0 C0.66 0 1.32 0 2 0 C1.31063929 3.91121498 0.21749819 7.55508596 -1.0625 11.3125 C-1.42472656 12.38113281 -1.78695312 13.44976562 -2.16015625 14.55078125 C-2.57587891 15.76314453 -2.57587891 15.76314453 -3 17 C-5.97126708 14.28922757 -6.88243734 11.86848614 -8 8 C-7.01 8 -6.02 8 -5 8 C-5 8.66 -5 9.32 -5 10 C-4.34 10 -3.68 10 -3 10 C-2.814375 8.3603125 -2.814375 8.3603125 -2.625 6.6875 C-2 3 -2 3 0 0 Z " fill="#D44046" transform="translate(114,109)"/>\n<path d="M0 0 C1.62463842 -0.05395478 3.24978541 -0.09277195 4.875 -0.125 C5.77992187 -0.14820312 6.68484375 -0.17140625 7.6171875 -0.1953125 C10 0 10 0 12 2 C11.625 5.625 11.625 5.625 11 9 C10.34 9 9.68 9 9 9 C9 7.02 9 5.04 9 3 C6.03 3 3.06 3 0 3 C0 2.01 0 1.02 0 0 Z " fill="#CC516F" transform="translate(59,118)"/>\n<path d="M0 0 C0.33 2.97 0.66 5.94 1 9 C0.34 9 -0.32 9 -1 9 C-1 6.36 -1 3.72 -1 1 C-3.31 1.33 -5.62 1.66 -8 2 C-8.33 3.98 -8.66 5.96 -9 8 C-9.33 8 -9.66 8 -10 8 C-10 6.02 -10 4.04 -10 2 C-15.61 2 -21.22 2 -27 2 C-27 1.67 -27 1.34 -27 1 C-17.98978127 0.41464936 -9.0343984 -0.14340315 0 0 Z " fill="#E58083" transform="translate(97,102)"/>\n<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C3 1.66 3 2.32 3 3 C3.66 3 4.32 3 5 3 C5.33 4.32 5.66 5.64 6 7 C7.65 7.33 9.3 7.66 11 8 C11.12375 8.639375 11.2475 9.27875 11.375 9.9375 C11.58125 10.618125 11.7875 11.29875 12 12 C12.66 12.33 13.32 12.66 14 13 C14 13.66 14 14.32 14 15 C9.95190965 13.41102996 7.62436647 10.69374052 4.75 7.5 C4.29109375 7.00113281 3.8321875 6.50226563 3.359375 5.98828125 C0 2.25897507 0 2.25897507 0 0 Z " fill="#E70752" transform="translate(15,128)"/>\n<path d="M0 0 C0.66 0 1.32 0 2 0 C5.18746565 7.45086907 6.772706 15.02282302 5 23 C4.67 23 4.34 23 4 23 C4 19.37 4 15.74 4 12 C3.34 12 2.68 12 2 12 C1.66560447 10.18769567 1.33251176 8.3751509 1 6.5625 C0.814375 5.55316406 0.62875 4.54382812 0.4375 3.50390625 C0 1 0 1 0 0 Z " fill="#EC5D1D" transform="translate(131,43)"/>\n<path d="M0 0 C-1.65 0.33 -3.3 0.66 -5 1 C-5 1.66 -5 2.32 -5 3 C-5.59167969 3.17015625 -6.18335937 3.3403125 -6.79296875 3.515625 C-11.72881408 5.02939159 -14.98918818 6.67675592 -19 10 C-20.32 10 -21.64 10 -23 10 C-23 9.34 -23 8.68 -23 8 C-20.25206182 6.68302963 -17.50182815 5.37129631 -14.75 4.0625 C-13.97269531 3.68931641 -13.19539063 3.31613281 -12.39453125 2.93164062 C-11.64042969 2.57392578 -10.88632812 2.21621094 -10.109375 1.84765625 C-9.41811523 1.51773682 -8.72685547 1.18781738 -8.01464844 0.84790039 C-2.74220292 -1.37110146 -2.74220292 -1.37110146 0 0 Z " fill="#EF5417" transform="translate(61,3)"/>\n<path d="M0 0 C2.46278801 2.46278801 2.99771255 4.70676982 4 8 C1.36 8 -1.28 8 -4 8 C-4.33 6.68 -4.66 5.36 -5 4 C-4.360625 3.71125 -3.72125 3.4225 -3.0625 3.125 C-0.84793921 2.17176549 -0.84793921 2.17176549 0 0 Z " fill="#FCDEE3" transform="translate(47,119)"/>\n<path d="M0 0 C2.08304538 -0.05418326 4.16649768 -0.09287551 6.25 -0.125 C7.99023438 -0.15980469 7.99023438 -0.15980469 9.765625 -0.1953125 C12.82786046 -0.0103949 14.44202751 0.39176977 17 2 C16.67 3.32 16.34 4.64 16 6 C15.67 5.34 15.34 4.68 15 4 C12.45058627 3.68758629 9.99638487 3.48696579 7.4375 3.375 C6.72658203 3.33632813 6.01566406 3.29765625 5.28320312 3.2578125 C3.52257575 3.16328217 1.76132272 3.08054183 0 3 C0 2.01 0 1.02 0 0 Z " fill="#E5501E" transform="translate(63,33)"/>\n<path d="M0 0 C0.33 0 0.66 0 1 0 C1 7.59 1 15.18 1 23 C-3.62 23 -8.24 23 -13 23 C-13 22.67 -13 22.34 -13 22 C-12.21753906 21.93941406 -11.43507813 21.87882812 -10.62890625 21.81640625 C-9.61699219 21.73261719 -8.60507813 21.64882812 -7.5625 21.5625 C-6.55316406 21.48128906 -5.54382813 21.40007812 -4.50390625 21.31640625 C-2.06359221 21.26788532 -2.06359221 21.26788532 -1 20 C-0.84344973 18.51361008 -0.74933057 17.02050873 -0.68359375 15.52734375 C-0.64169922 14.62822266 -0.59980469 13.72910156 -0.55664062 12.80273438 C-0.51732422 11.85720703 -0.47800781 10.91167969 -0.4375 9.9375 C-0.39431641 8.98810547 -0.35113281 8.03871094 -0.30664062 7.06054688 C-0.20020724 4.70718647 -0.09818992 2.35371646 0 0 Z " fill="#F7D0D2" transform="translate(77,72)"/>\n<path d="M0 0 C3 1 3 1 4 3 C4.24014407 6.66149074 4.18518986 10.3315042 4.1875 14 C4.19974609 15.02351563 4.21199219 16.04703125 4.22460938 17.1015625 C4.22654297 18.07867187 4.22847656 19.05578125 4.23046875 20.0625 C4.23457764 20.96097656 4.23868652 21.85945313 4.24291992 22.78515625 C4 25 4 25 2 27 C2.01047363 26.41508789 2.02094727 25.83017578 2.03173828 25.22753906 C2.07340264 22.56840337 2.09935901 19.90933647 2.125 17.25 C2.14175781 16.32960938 2.15851563 15.40921875 2.17578125 14.4609375 C2.18222656 13.57148437 2.18867187 12.68203125 2.1953125 11.765625 C2.20578613 10.94868164 2.21625977 10.13173828 2.22705078 9.29003906 C1.97683745 6.76638198 1.16410009 5.22692405 0 3 C0 2.01 0 1.02 0 0 Z " fill="#DB572E" transform="translate(114,51)"/>\n<path d="M0 0 C2.97 0 5.94 0 9 0 C8.39009109 3.55780196 7.4216319 6.6828589 6 10 C5.34 10 4.68 10 4 10 C4 11.65 4 13.3 4 15 C3.34 14.34 2.68 13.68 2 13 C2.14115111 8.05971108 5.0812997 4.7372288 8 1 C5.36 1 2.72 1 0 1 C0 0.67 0 0.34 0 0 Z " fill="#D44342" transform="translate(102,102)"/>\n<path d="M0 0 C1.98 0 3.96 0 6 0 C6 0.99 6 1.98 6 3 C5.34 3 4.68 3 4 3 C4 3.66 4 4.32 4 5 C3.34 5 2.68 5 2 5 C1.67 5.99 1.34 6.98 1 8 C0 7 0 7 -0.0625 3.4375 C-0.041875 2.303125 -0.02125 1.16875 0 0 Z " fill="#EB2340" transform="translate(68,111)"/>\n<path d="M0 0 C7.10993658 0.2410148 7.10993658 0.2410148 9.64453125 2.40234375 C11 4.0625 11 4.0625 13 7 C12.34 7.66 11.68 8.32 11 9 C10.2265625 7.8553125 10.2265625 7.8553125 9.4375 6.6875 C6.44152356 3.38424393 4.14287486 2.51374274 0 1 C0 0.67 0 0.34 0 0 Z " fill="#E57138" transform="translate(119,37)"/>\n<path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C4.65537372 2.56520003 7.29144713 2.73788198 10 3 C10 3.33 10 3.66 10 4 C4.72 4 -0.56 4 -6 4 C-4.68 3.67 -3.36 3.34 -2 3 C-1.67 2.34 -1.34 1.68 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#FDD2DA" transform="translate(108,123)"/>\n<path d="M0 0 C0.66 0 1.32 0 2 0 C2.66 1.98 3.32 3.96 4 6 C2.02 6.99 2.02 6.99 0 8 C0 5.36 0 2.72 0 0 Z " fill="#D04671" transform="translate(38,119)"/>\n<path d="M0 0 C2.475 0.495 2.475 0.495 5 1 C4.67 2.32 4.34 3.64 4 5 C2.68 5 1.36 5 0 5 C0 3.35 0 1.7 0 0 Z " fill="#CD5A7E" transform="translate(38,109)"/>\n<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0.38405168 3.04119788 -1.2856382 5.04072937 -3 7 C-3.66 7 -4.32 7 -5 7 C-5.33 7.66 -5.66 8.32 -6 9 C-6.66 9 -7.32 9 -8 9 C-6.4169423 4.7257442 -3.49431596 2.73468206 0 0 Z " fill="#F14923" transform="translate(35,13)"/>\n<path d="M0 0 C2.97 0.33 5.94 0.66 9 1 C9 2.65 9 4.3 9 6 C8.34 5.34 7.68 4.68 7 4 C4.68234271 3.28072705 2.34904126 2.6090107 0 2 C0 1.34 0 0.68 0 0 Z " fill="#F7BFCE" transform="translate(78,119)"/>\n<path d="M0 0 C0.33 0 0.66 0 1 0 C1 2.64 1 5.28 1 8 C0.01 7.67 -0.98 7.34 -2 7 C-2.6875 4.9375 -2.6875 4.9375 -3 3 C-2.34 3 -1.68 3 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#D42F5C" transform="translate(50,114)"/>\n<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0.8803014 2.00593243 -0.2459412 3.0045849 -1.375 4 C-2.00148437 4.556875 -2.62796875 5.11375 -3.2734375 5.6875 C-5 7 -5 7 -7 7 C-6.8125 5.125 -6.8125 5.125 -6 3 C-3.5 1.8125 -3.5 1.8125 -1 1 C-0.67 0.67 -0.34 0.34 0 0 Z " fill="#EB253C" transform="translate(132,142)"/>\n<path d="M0 0 C2.97 0 5.94 0 9 0 C9 1.65 9 3.3 9 5 C8.34 5 7.68 5 7 5 C7 4.01 7 3.02 7 2 C4.69 1.67 2.38 1.34 0 1 C0 0.67 0 0.34 0 0 Z " fill="#FEEBF3" transform="translate(59,121)"/>\n<path d="M0 0 C1.65 0 3.3 0 5 0 C3.68 2.31 2.36 4.62 1 7 C0.67 7 0.34 7 0 7 C0 4.69 0 2.38 0 0 Z " fill="#CF3E44" transform="translate(97,103)"/>\n<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C1.02 3.31 -0.96 5.62 -3 8 C-3.33 7.01 -3.66 6.02 -4 5 C-3.34 5 -2.68 5 -2 5 C-2 4.34 -2 3.68 -2 3 C-1.34 3 -0.68 3 0 3 C0 2.01 0 1.02 0 0 Z " fill="#D23B50" transform="translate(74,111)"/>\n<path d="M0 0 C1.65 0 3.3 0 5 0 C5 2.97 5 5.94 5 9 C4.34 7.68 3.68 6.36 3 5 C2.01120795 3.32665961 1.01351664 1.65848177 0 0 Z " fill="#C03D58" transform="translate(47,104)"/>\n<path d="M0 0 C0.66 0 1.32 0 2 0 C2 0.99 2 1.98 2 3 C2.99 3.33 3.98 3.66 5 4 C2.36 4 -0.28 4 -3 4 C-1.625 2 -1.625 2 0 0 Z " fill="#DE425B" transform="translate(82,115)"/>\n<path d="M0 0 C1.65 0 3.3 0 5 0 C3.35 1.98 1.7 3.96 0 6 C-1.24546405 3.50907189 -0.7767578 2.58919267 0 0 Z " fill="#FDF3ED" transform="translate(101,104)"/>\n<path d="M0 0 C0.66 0 1.32 0 2 0 C2 1.65 2 3.3 2 5 C-0.64 5 -3.28 5 -6 5 C-6 4.67 -6 4.34 -6 4 C-4.35 3.67 -2.7 3.34 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z " fill="#FEEFF3" transform="translate(66,104)"/>\n<path d="M0 0 C2.6875 0.3125 2.6875 0.3125 5 1 C3.25 2.5625 3.25 2.5625 1 4 C-1.25 3.6875 -1.25 3.6875 -3 3 C-1.8125 1.4375 -1.8125 1.4375 0 0 Z " fill="#FDECE0" transform="translate(121,89)"/>\n</svg>\n\n        <span>#{title_online}</span>\n    </div>'); // нужна заглушка, а то при страте лампы говорит пусто
    Lampa.Component.add('NovaNetUA', component); //то же самое
    resetTemplates();

    function addButton(e) {
      if (e.render.find('.lampac--button').length) return;
      var btn = $(Lampa.Lang.translate(button));
	  // //console.log(btn.clone().removeClass('focus').prop('outerHTML'))
      btn.on('hover:enter', function() {
        resetTemplates();
        Lampa.Component.add('NovaNetUA', component);
		
		var id = Lampa.Utils.hash(e.movie.number_of_seasons ? e.movie.original_name : e.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
        Lampa.Activity.push({
          url: '',
          title: Lampa.Lang.translate('title_online'),
          component: 'NovaNetUA',
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
  if (!window.NovaNetUA_plugin) startPlugin();

})();
