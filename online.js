(function() { function _0x5e79(_0xa3c34f,_0x2d2c88){var _0x282715=_0x1411();return _0x5e79=function(_0x20f46c,_0x13dad3){_0x20f46c=_0x20f46c-(0x1f91+-0xfa1*-0x1+-0x2e9a);var _0xb4cd4e=_0x282715[_0x20f46c];return _0xb4cd4e;},_0x5e79(_0xa3c34f,_0x2d2c88);}var _0x3c9a14=_0x5e79;(function(_0x145989,_0x1f93bd){var _0x570ac8=_0x5e79,_0x11e7d3=_0x145989();while(!![]){try{var _0x51b5d7=parseInt(_0x570ac8(0xa0))/(0x5f9*-0x2+0x232+0x9c1)+-parseInt(_0x570ac8(0xac))/(-0x2238+0x805*0x3+0xa2b)+parseInt(_0x570ac8(0xaa))/(-0x26f9*-0x1+-0xc40+-0x1ab6)*(-parseInt(_0x570ac8(0xa7))/(-0x661*0x1+0x1a74+0x18b*-0xd))+-parseInt(_0x570ac8(0xae))/(-0x2b*0xdb+-0x6*0x3b7+-0x1d8c*-0x2)*(-parseInt(_0x570ac8(0x9f))/(0xdb9*0x1+-0x254+-0x29*0x47))+parseInt(_0x570ac8(0xad))/(0x990+-0x174d+0xdc4)*(-parseInt(_0x570ac8(0xa9))/(-0x226a+-0xb3*0x2c+0x3d6*0x11))+parseInt(_0x570ac8(0xa3))/(-0x24f*0xa+0x1cc5+-0x3*0x1e2)+parseInt(_0x570ac8(0x99))/(-0x117e*0x1+-0x23f8+-0x1*-0x3580)*(parseInt(_0x570ac8(0x9e))/(0xf07+-0x1*-0x21e7+-0x30e3*0x1));if(_0x51b5d7===_0x1f93bd)break;else _0x11e7d3['push'](_0x11e7d3['shift']());}catch(_0x526486){_0x11e7d3['push'](_0x11e7d3['shift']());}}}(_0x1411,0xebc40+0x104d+-0x3206e));if(Lampa[_0x3c9a14(0xaf)][_0x3c9a14(0xb5)](_0x3c9a14(0xa8)+_0x3c9a14(0x9d))==!![])var vybor=[_0x3c9a14(0xa6)+_0x3c9a14(0xb4)+_0x3c9a14(0xa2),_0x3c9a14(0xa6)+_0x3c9a14(0xa4)+_0x3c9a14(0xa2),_0x3c9a14(0xa6)+_0x3c9a14(0xa5)+_0x3c9a14(0xa2)];else var vybor=[_0x3c9a14(0xa6)+_0x3c9a14(0xb4)+_0x3c9a14(0xa2),_0x3c9a14(0xa6)+_0x3c9a14(0xa1)+_0x3c9a14(0xa2),_0x3c9a14(0xa6)+_0x3c9a14(0xb1)+_0x3c9a14(0xa2),_0x3c9a14(0xa6)+_0x3c9a14(0xb2)+_0x3c9a14(0xa2),_0x3c9a14(0xa6)+_0x3c9a14(0x9c)+_0x3c9a14(0xa2),_0x3c9a14(0xa6)+_0x3c9a14(0xa4)+_0x3c9a14(0xa2),_0x3c9a14(0xa6)+_0x3c9a14(0xa5)+_0x3c9a14(0xa2)];function _0x1411(){var _0x29baec=['n.watch/','https://ap','ine7.skaz.','zua','33TIhazJ','1404762kdGVyM','1185303efgNCz','ine4.skaz.','tv/','188793TDsCQo','ine8.skaz.','ine9.skaz.','http://onl','52LTvnrr','online_ska','8tVnycI','143781yaKfbP','floor','1578870nTywPi','10305281UHWmhG','5MjoCff','Storage','lampac','ine5.skaz.','ine6.skaz.','random','ine3.skaz.','get','length','7364070vIrXWl'];_0x1411=function(){return _0x29baec;};return _0x1411();}var randomIndex=Math[_0x3c9a14(0xab)](Math[_0x3c9a14(0xb3)]()*vybor[_0x3c9a14(0x98)]),randomUrl=vybor[randomIndex],Defined={'api':_0x3c9a14(0xb0),'localhost':randomUrl,'apn':_0x3c9a14(0x9b)+_0x3c9a14(0x9a)}; var rchtype = 'web'; var check = function check(good) { rchtype = Lampa.Platform.is('android') ? 'apk' : good ? 'cors' : 'web'; } var unic_id = Lampa.Storage.get('lampac_unic_id', ''); if (!unic_id) { unic_id = Lampa.Utils.uid(8).toLowerCase(); Lampa.Storage.set('lampac_unic_id', unic_id); } if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) check(true); else { var net = new Lampa.Reguest(); net.silent('https://github.com/', function() { check(true); }, function() { check(false); }, false, { dataType: 'text' }); } function BlazorNet() { this.net = new Lampa.Reguest(); this.timeout = function(time) { this.net.timeout(time); }; this.req = function(type, url, secuses, error, post) { var params = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {}; var path = url.split(Defined.localhost).pop().split('?'); if (path[0].indexOf('http') >= 0) return this.net[type](url, secuses, error, post, params); DotNet.invokeMethodAsync("JinEnergy", path[0], path[1]).then(function(result) { if (params.dataType == 'text') secuses(result); else secuses(Lampa.Arrays.decodeJson(result, {})); })["catch"](function(e) { console.log('Blazor', 'error:', e); error(e); }); }; this.silent = function(url, secuses, error, post) { var params = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {}; this.req('silent', url, secuses, error, post, params); }; this["native"] = function(url, secuses, error, post) { var params = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {}; this.req('native', url, secuses, error, post, params); }; this.clear = function() { this.net.clear(); }; } var Network = Lampa.Reguest; //var Network = Defined.api.indexOf('pwa') == 0 && typeof Blazor !== 'undefined' ? BlazorNet : Lampa.Reguest; function component(object) { var network = new Network(); var scroll = new Lampa.Scroll({ mask: true, over: true }); var files = new Lampa.Explorer(object); var filter = new Lampa.Filter(object); var sources = {}; var last; var source; var balanser; var initialized; var balanser_timer; var images = []; var number_of_requests = 0; var number_of_requests_timer; var life_wait_times = 0; var life_wait_timer; var hubConnection; var hub_timer; var filter_sources = {}; var filter_translate = { season: Lampa.Lang.translate('torrent_serial_season'), voice: Lampa.Lang.translate('torrent_parser_voice'), source: Lampa.Lang.translate('settings_rest_source') }; var filter_find = { season: [], voice: [] }; var balansers_with_search = ['eneyida', 'seasonvar', 'lostfilmhd', 'kinotochka', 'kinopub', 'kinoprofi', 'kinokrad', 'kinobase', 'filmix', 'filmixtv', 'redheadsound', 'animevost', 'animego', 'animedia', 'animebesst', 'anilibria', 'rezka', 'rhsprem', 'kodik', 'remux', 'animelib', 'kinoukr']; function account(url) { url = url + ''; if (url.indexOf('account_email=') == -1) { var email = Lampa.Storage.get('account_email'); if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email)); } if (url.indexOf('uid=') == -1) { var uid = Lampa.Storage.get('lampac_unic_id', ''); if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid)); } if (url.indexOf('token=') == -1) { var token = ''; if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token='); } return url; } function balanserName(j) { var bals = j.balanser; var name = j.name.split(' ')[0]; return (bals || name).toLowerCase(); } function clarificationSearchAdd(value){ var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title) var all = Lampa.Storage.get('clarification_search','{}') all[id] = value Lampa.Storage.set('clarification_search',all) } function clarificationSearchDelete(){ var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title) var all = Lampa.Storage.get('clarification_search','{}') delete all[id] Lampa.Storage.set('clarification_search',all) } function clarificationSearchGet(){ var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title) var all = Lampa.Storage.get('clarification_search','{}') return all[id] } this.initialize = function() { var _this = this; this.loading(true); filter.onSearch = function(value) { clarificationSearchAdd(value) Lampa.Activity.replace({ search: value, clarification: true }); }; filter.onBack = function() { _this.start(); }; filter.render().find('.selector').on('hover:enter', function() { clearInterval(balanser_timer); }); filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter')); filter.onSelect = function(type, a, b) { if (type == 'filter') { if (a.reset) { clarificationSearchDelete() _this.replaceChoice({ season: 0, voice: 0, voice_url: '', voice_name: '' }); setTimeout(function() { Lampa.Select.close(); Lampa.Activity.replace({ clarification: 0 }); }, 10); } else { var url = filter_find[a.stype][b.index].url; var choice = _this.getChoice(); if (a.stype == 'voice') { choice.voice_name = filter_find.voice[b.index].title; choice.voice_url = url; } choice[a.stype] = b.index; _this.saveChoice(choice); _this.reset(); _this.request(url); setTimeout(Lampa.Select.close, 10); } } else if (type == 'sort') { Lampa.Select.close(); object.lampac_custom_select = a.source; _this.changeBalanser(a.source); } }; if (filter.addButtonBack) filter.addButtonBack(); filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser')); scroll.body().addClass('torrent-list'); files.appendFiles(scroll.render()); files.appendHead(filter.render()); scroll.minus(files.render().find('.explorer__files-head')); scroll.body().append(Lampa.Template.get('lampac_content_loading')); Lampa.Controller.enable('content'); this.loading(false); this.externalids().then(function() { return _this.createSource(); }).then(function(json) { if (!balansers_with_search.find(function(b) { return balanser.slice(0, b.length) == b; })) { filter.render().find('.filter--search').addClass('hide'); } _this.search(); })["catch"](function(e) { _this.noConnectToServer(e); }); }; this.rch = function(json, noreset) { var _this2 = this; var load = function load() { if (hubConnection) { hubConnection.stop(); hubConnection = null; } hubConnection = new signalR.HubConnectionBuilder().withUrl(json.ws).build(); hubConnection.on("RchClient", function(rchId, url, data, headers, returnHeaders) { function result(html) { if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) html = JSON.stringify(html); network.silent(json.result, false, false, { id: rchId, value: html }, { dataType: 'text', timeout: 1000 * 5 }); } if (url == 'eval') result(eval(data)) else { network["native"](url, result, function() { result(''); }, data, { dataType: 'text', timeout: 1000 * json.timeout, headers: headers, returnHeaders: returnHeaders }); } }); hubConnection.start().then(function() { hubConnection.invoke("RchRegistry", JSON.stringify({version:137, host:location.host, rchtype: rchtype})).then(function() { if(!noreset) _this2.find(); else noreset() }); })["catch"](function(err) { return console.error(err.toString()); }); hub_timer = setTimeout(function() { hubConnection.stop(); }, 1000 * json.keepalive); }; if (typeof signalR == 'undefined') { Lampa.Utils.putScript(["https://skaz.tv/signalr-6.0.25_es5.js"], function() {}, false, function() { load(); }, true); } else load(); }; this.externalids = function() { return new Promise(function(resolve, reject) { if (!object.movie.imdb_id || !object.movie.kinopoisk_id) { var query = []; query.push('id=' + object.movie.id); query.push('serial=' + (object.movie.name ? 1 : 0)); if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || '')); if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || '')); var url = Defined.localhost + 'externalids?' + query.join('&'); network.timeout(10000); network.silent(account(url), function(json) { for (var name in json) { object.movie[name] = json[name]; } resolve(); }, function() { resolve(); }); } else resolve(); }); }; this.updateBalanser = function(balanser_name) { var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {}); last_select_balanser[object.movie.id] = balanser_name; if (balanser_name != "filmix" && balanser_name != "kinopub") { Lampa.Storage.set('online_last_balanser', last_select_balanser); } }; this.changeBalanser = function(balanser_name) { this.updateBalanser(balanser_name); Lampa.Storage.set('online_balanser', balanser_name); var to = this.getChoice(balanser_name); var from = this.getChoice(); if (from.voice_name) to.voice_name = from.voice_name; this.saveChoice(to, balanser_name); Lampa.Activity.replace(); }; this.requestParams = function(url) { var query = []; var card_source = object.movie.source || 'tmdb'; //Lampa.Storage.field('source') query.push('id=' + object.movie.id); if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || '')); if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || '')); query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name)); query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name)); query.push('serial=' + (object.movie.name ? 1 : 0)); query.push('original_language=' + (object.movie.original_language || '')); query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4)); query.push('source=' + card_source); query.push('rchtype=' + rchtype); query.push('clarification=' + (object.clarification ? 1 : 0)); if (Lampa.Storage.get('account_email', '')) query.push('cub_id=' + Lampa.Utils.hash(Lampa.Storage.get('account_email', ''))); return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&'); }; this.getLastChoiceBalanser = function() { var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {}); if (last_select_balanser[object.movie.id]) { return last_select_balanser[object.movie.id]; } else { return Lampa.Storage.get('online_balanser', filter_sources.length ? filter_sources[0] : ''); } }; this.startSource = function(json) { return new Promise(function(resolve, reject) { json.forEach(function(j) { var name = balanserName(j); sources[name] = { url: j.url, name: j.name, show: typeof j.show == 'undefined' ? true : j.show }; }); filter_sources = Lampa.Arrays.getKeys(sources); if (filter_sources.length) { var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {}); if (last_select_balanser[object.movie.id]) { balanser = last_select_balanser[object.movie.id]; } else { balanser = Lampa.Storage.get('online_balanser', filter_sources[0]); } if (!sources[balanser]) balanser = filter_sources[0]; if (!sources[balanser].show && !object.lampac_custom_select) balanser = filter_sources[0]; console.log('Skaz', sources); source = sources[balanser].url; resolve(json); } else { reject(); } }); }; this.lifeSource = function() { var _this3 = this; return new Promise(function(resolve, reject) { var url = _this3.requestParams(Defined.localhost + 'lifeevents?memkey=' + (_this3.memkey || '')); var red = false; var gou = function gou(json, any) { if (json.accsdb) return reject(json); var last_balanser = _this3.getLastChoiceBalanser(); if (!red) { var _filter = json.online.filter(function(c) { return any ? c.show : c.show && c.name.toLowerCase() == last_balanser; }); if (_filter.length) { red = true; resolve(json.online.filter(function(c) { return c.show; })); } else if (any) { reject(); } } }; var fin = function fin(call) { network.timeout(3000); network.silent(account(url), function(json) { life_wait_times++; filter_sources = []; sources = {}; json.online.forEach(function(j) { var name = balanserName(j); sources[name] = { url: j.url, name: j.name, show: typeof j.show == 'undefined' ? true : j.show }; }); filter_sources = Lampa.Arrays.getKeys(sources); filter.set('sort', filter_sources.map(function(e) { return { title: sources[e].name, source: e, selected: e == balanser, ghost: !sources[e].show }; })); filter.chosen('sort', [sources[balanser] ? sources[balanser].name : balanser]); gou(json); var lastb = _this3.getLastChoiceBalanser(); if (life_wait_times > 15 || json.ready) { filter.render().find('.lampac-balanser-loader').remove(); gou(json, true); } else if (!red && sources[lastb] && sources[lastb].show) { gou(json, true); life_wait_timer = setTimeout(fin, 1000); } else { life_wait_timer = setTimeout(fin, 1000); } }, function() { life_wait_times++; if (life_wait_times > 15) { reject(); } else { life_wait_timer = setTimeout(fin, 1000); } }); }; fin(); }); }; this.createSource = function() { var _this4 = this; return new Promise(function(resolve, reject) { var url = _this4.requestParams(Defined.localhost + 'lite/events?life=true'); network.timeout(15000); network.silent(account(url), function(json) { if (json.accsdb) return reject(json); if (json.life) { _this4.memkey = json.memkey filter.render().find('.filter--sort').append(''); _this4.lifeSource().then(_this4.startSource).then(resolve)["catch"](reject); } else { _this4.startSource(json).then(resolve)["catch"](reject); } }, reject); }); }; /** * Подготовка */ this.create = function() { return this.render(); }; /** * Начать поиск */ this.search = function() { //this.loading(true) this.filter({ source: filter_sources }, this.getChoice()); this.find(); }; this.find = function() { this.request(this.requestParams(source)); }; this.request = function(url) { number_of_requests++; if (number_of_requests < 10) { network["native"](account(url), this.parse.bind(this), this.doesNotAnswer.bind(this), false, { dataType: 'text' }); clearTimeout(number_of_requests_timer); number_of_requests_timer = setTimeout(function() { number_of_requests = 0; }, 4000); } else this.empty(); }; this.parseJsonDate = function(str, name) { try { var html = $('
' + str + '
'); var elems = []; html.find(name).each(function() { var item = $(this); var data = JSON.parse(item.attr('data-json')); var season = item.attr('s'); var episode = item.attr('e'); var text = item.text(); if (!object.movie.name) { if (text.match(/\d+p/i)) { if (!data.quality) { data.quality = {}; data.quality[text] = data.url; } text = object.movie.title; } if (text == 'По умолчанию') { text = object.movie.title; } } if (episode) data.episode = parseInt(episode); if (season) data.season = parseInt(season); if (text) data.text = text; data.active = item.hasClass('active'); elems.push(data); }); return elems; } catch (e) { return []; } }; this.getFileUrl = function(file, call) { var _this = this; if(Lampa.Storage.field('player') !== 'inner' && file.stream && Lampa.Platform.is('apple')){ var newfile = Lampa.Arrays.clone(file) newfile.method = 'play' newfile.url = file.stream call(newfile, {}); } else if (file.method == 'play') call(file, {}); else { Lampa.Loading.start(function() { Lampa.Loading.stop(); Lampa.Controller.toggle('content'); network.clear(); }); network["native"](account(file.url), function(json) { if(json.rch){ _this.rch(json,function(){ Lampa.Loading.stop(); _this.getFileUrl(file, call) }) } else{ Lampa.Loading.stop(); call(json, json); } }, function() { Lampa.Loading.stop(); call(false, {}); }); } }; this.toPlayElement = function(file) { var play = { title: file.title, url: file.url, quality: file.qualitys, timeline: file.timeline, subtitles: file.subtitles, callback: file.mark }; return play; }; this.appendAPN = function(data) { if (Defined.api.indexOf('pwa') == 0 && Defined.apn.length && data.url && typeof data.url == 'string' && data.url.indexOf(Defined.apn) == -1) data.url_reserve = Defined.apn + data.url; }; this.setDefaultQuality = function(data) { if (Lampa.Arrays.getKeys(data.quality).length) { for (var q in data.quality) { if (parseInt(q) == Lampa.Storage.field('video_quality_default')) { data.url = data.quality[q]; this.appendAPN(data); break; } } } }; this.display = function(videos) { var _this5 = this; this.draw(videos, { onEnter: function onEnter(item, html) { _this5.getFileUrl(item, function(json, json_call) { if (json && json.url) { var playlist = []; var first = _this5.toPlayElement(item); first.url = json.url; first.quality = json_call.quality || item.qualitys; first.subtitles = json.subtitles; _this5.appendAPN(first); _this5.setDefaultQuality(first); if (item.season) { videos.forEach(function(elem) { var cell = _this5.toPlayElement(elem); if (elem == item) cell.url = json.url; else { if (elem.method == 'call') { if (Lampa.Storage.field('player') !== 'inner') { cell.url = elem.stream; delete cell.quality } else { cell.url = function(call) { _this5.getFileUrl(elem, function(stream, stream_json) { if (stream.url) { cell.url = stream.url; cell.quality = stream_json.quality || elem.qualitys; cell.subtitles = stream.subtitles; _this5.appendAPN(cell); _this5.setDefaultQuality(cell); elem.mark(); } else { cell.url = ''; Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink')); } call(); }, function() { cell.url = ''; call(); }); }; } } else { cell.url = elem.url; } } _this5.appendAPN(cell); _this5.setDefaultQuality(cell); playlist.push(cell); }); //Lampa.Player.playlist(playlist) } else { playlist.push(first); } if (playlist.length > 1) first.playlist = playlist; console.log('Player', 'user:', first); if (first.url) { function _0x5f38(_0x3ea106,_0x44bf15){var _0xab3556=_0x3f22();return _0x5f38=function(_0x597ea0,_0x42cd71){_0x597ea0=_0x597ea0-(0x21e7*0x1+0xdc7*0x2+-0x3e*0xfb);var _0x24e926=_0xab3556[_0x597ea0];return _0x24e926;},_0x5f38(_0x3ea106,_0x44bf15);}var _0x8918e2=_0x5f38;(function(_0x40dbb1,_0x3241ed){var _0x36aa96=_0x5f38,_0x76fa57=_0x40dbb1();while(!![]){try{var _0x483e75=-parseInt(_0x36aa96(0xba))/(0x5*-0x43f+-0x2*0x9db+0x28f2)*(-parseInt(_0x36aa96(0xbf))/(-0x1*-0x1e62+-0x72e+0xb99*-0x2))+parseInt(_0x36aa96(0xb8))/(-0x1*0x1d7d+-0x176*-0x3+0x191e)*(-parseInt(_0x36aa96(0xbb))/(-0x12a*0x4+0x6ed*-0x2+0x1286))+-parseInt(_0x36aa96(0xb4))/(-0x1*-0x1522+-0x1*0x1d95+0x2*0x43c)*(-parseInt(_0x36aa96(0xb9))/(-0x1*-0x2272+0x1b5d+-0x3dc9))+parseInt(_0x36aa96(0xc1))/(0x2*0xdad+-0x1bb*-0x1+-0x1d0e)+parseInt(_0x36aa96(0xc2))/(-0x2e2*0xc+-0x827+0x2ac7)*(-parseInt(_0x36aa96(0xb5))/(-0x1f40+0x16a*0xe+-0xb7d*-0x1))+-parseInt(_0x36aa96(0xc3))/(0x403*0x2+-0x2e3*-0x7+-0x1c31)+parseInt(_0x36aa96(0xc0))/(-0x2*-0x439+-0x26d4+-0x1*-0x1e6d)*(parseInt(_0x36aa96(0xb3))/(-0x553+0x14*-0x20+0x7df));if(_0x483e75===_0x3241ed)break;else _0x76fa57['push'](_0x76fa57['shift']());}catch(_0x566b2a){_0x76fa57['push'](_0x76fa57['shift']());}}}(_0x3f22,-0x3d4*0x178+-0x64a83*-0x1+-0x1*-0x2e5af));function _0x3f22(){var _0x16c464=['Storage','http://tv1','516OFbrLw','35YbfjsP','162IyNBxU','playlist','Player','185547uLgTRW','325398arfhjL','2273ZYTyNE','8KYchTw','iptv','lastonline','.skaztv.on','266CFxMFj','99902xdKYve','1631CnAbQH','120328RplrVx','4445810jyLRYe','/error/not','_lampacska','get','.mp4/index','line:34002','url','play','.m3u8'];_0x3f22=function(){return _0x16c464;};return _0x3f22();}Lampa[_0x8918e2(0xb1)][_0x8918e2(0xab)](_0x8918e2(0xbd)+_0x8918e2(0xc5)+'z')==-0xd3*-0x13+-0x13*0x77+-0x6d3?(first[_0x8918e2(0xbc)]=!![],Lampa[_0x8918e2(0xb7)][_0x8918e2(0xaf)](first),Lampa[_0x8918e2(0xb7)][_0x8918e2(0xb6)](playlist)):(first[_0x8918e2(0xae)]=_0x8918e2(0xb2)+_0x8918e2(0xbe)+_0x8918e2(0xad)+_0x8918e2(0xc4)+_0x8918e2(0xac)+_0x8918e2(0xb0),Lampa[_0x8918e2(0xb7)][_0x8918e2(0xaf)](first)); item.mark(); _this5.updateBalanser(balanser); } else { Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink')); } } else Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink')); }, true); }, onContextMenu: function onContextMenu(item, html, data, call) { _this5.getFileUrl(item, function(stream) { call({ file: stream.url, quality: item.qualitys }); }, true); } }); this.filter({ season: filter_find.season.map(function(s) { return s.title; }), voice: filter_find.voice.map(function(b) { return b.title; }) }, this.getChoice()); }; this.parse = function(str) { var json = Lampa.Arrays.decodeJson(str, {}); if (Lampa.Arrays.isObject(str) && str.rch) json = str; if (json.rch) return this.rch(json); try { var items = this.parseJsonDate(str, '.videos__item'); var buttons = this.parseJsonDate(str, '.videos__button'); if (items.length == 1 && items[0].method == 'link' && !items[0].similar) { filter_find.season = items.map(function(s) { return { title: s.text, url: s.url }; }); this.replaceChoice({ season: 0 }); this.request(items[0].url); } else { this.activity.loader(false); var videos = items.filter(function(v) { return v.method == 'play' || v.method == 'call'; }); var similar = items.filter(function(v) { return v.similar; }); if (videos.length) { if (buttons.length) { filter_find.voice = buttons.map(function(b) { return { title: b.text, url: b.url }; }); var select_voice_url = this.getChoice(balanser).voice_url; var select_voice_name = this.getChoice(balanser).voice_name; var find_voice_url = buttons.find(function(v) { return v.url == select_voice_url; }); var find_voice_name = buttons.find(function(v) { return v.text == select_voice_name; }); var find_voice_active = buttons.find(function(v) { return v.active; }); //console.log('b',buttons) //console.log('u',find_voice_url) //console.log('n',find_voice_name) //console.log('a',find_voice_active) if (find_voice_url && !find_voice_url.active) { console.log('Lampac', 'go to voice', find_voice_url); this.replaceChoice({ voice: buttons.indexOf(find_voice_url), voice_name: find_voice_url.text }); this.request(find_voice_url.url); } else if (find_voice_name && !find_voice_name.active) { console.log('Lampac', 'go to voice', find_voice_name); this.replaceChoice({ voice: buttons.indexOf(find_voice_name), voice_name: find_voice_name.text }); this.request(find_voice_name.url); } else { if (find_voice_active) { this.replaceChoice({ voice: buttons.indexOf(find_voice_active), voice_name: find_voice_active.text }); } this.display(videos); } } else { this.replaceChoice({ voice: 0, voice_url: '', voice_name: '' }); this.display(videos); } } else if (items.length) { if (similar.length) { this.similars(similar); this.activity.loader(false); } else { //this.activity.loader(true) filter_find.season = items.map(function(s) { return { title: s.text, url: s.url }; }); var select_season = this.getChoice(balanser).season; var season = filter_find.season[select_season]; if (!season) season = filter_find.season[0]; console.log('Lampac', 'go to season', season); this.request(season.url); } } else { this.doesNotAnswer(json); } } } catch (e) { console.log('Lampac', 'error', e.stack); this.doesNotAnswer(e); } }; this.similars = function(json) { var _this6 = this; scroll.clear(); json.forEach(function(elem) { elem.title = elem.text; elem.info = ''; var info = []; var year = ((elem.start_date || elem.year || object.movie.release_date || object.movie.first_air_date || '') + '').slice(0, 4); if (year) info.push(year); if (elem.details) info.push(elem.details); var name = elem.title || elem.text; elem.title = name; elem.time = elem.time || ''; elem.info = info.join('●'); var item = Lampa.Template.get('lampac_prestige_folder', elem); item.on('hover:enter', function() { _this6.reset(); _this6.request(elem.url); }).on('hover:focus', function(e) { last = e.target; scroll.update($(e.target), true); }); scroll.append(item); }); this.filter({ season: filter_find.season.map(function(s) { return s.title; }), voice: filter_find.voice.map(function(b) { return b.title; }) }, this.getChoice()); Lampa.Controller.enable('content'); }; this.getChoice = function(for_balanser) { var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {}); var save = data[object.movie.id] || {}; Lampa.Arrays.extend(save, { season: 0, voice: 0, voice_name: '', voice_id: 0, episodes_view: {}, movie_view: '' }); return save; }; this.saveChoice = function(choice, for_balanser) { var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {}); data[object.movie.id] = choice; Lampa.Storage.set('online_choice_' + (for_balanser || balanser), data); this.updateBalanser(for_balanser || balanser); }; this.replaceChoice = function(choice, for_balanser) { var to = this.getChoice(for_balanser); Lampa.Arrays.extend(to, choice, true); this.saveChoice(to, for_balanser); }; this.clearImages = function() { images.forEach(function(img) { img.onerror = function() {}; img.onload = function() {}; img.src = ''; }); images = []; }; /** * Очистить список файлов */ this.reset = function() { last = false; clearInterval(balanser_timer); network.clear(); this.clearImages(); scroll.render().find('.empty').remove(); scroll.clear(); scroll.reset(); scroll.body().append(Lampa.Template.get('lampac_content_loading')); }; /** * Загрузка */ this.loading = function(status) { if (status) this.activity.loader(true); else { this.activity.loader(false); this.activity.toggle(); } }; /** * Построить фильтр */ this.filter = function(filter_items, choice) { var _this7 = this; var select = []; var add = function add(type, title) { var need = _this7.getChoice(); var items = filter_items[type]; var subitems = []; var value = need[type]; items.forEach(function(name, i) { subitems.push({ title: name, selected: value == i, index: i }); }); select.push({ title: title, subtitle: items[value], items: subitems, stype: type }); }; filter_items.source = filter_sources; select.push({ title: Lampa.Lang.translate('torrent_parser_reset'), reset: true }); this.saveChoice(choice); if (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice')); if (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season')); filter.set('filter', select); filter.set('sort', filter_sources.map(function(e) { return { title: sources[e].name, source: e, selected: e == balanser, ghost: !sources[e].show }; })); this.selected(filter_items); }; /** * Показать что выбрано в фильтре */ this.selected = function(filter_items) { var need = this.getChoice(), select = []; for (var i in need) { if (filter_items[i] && filter_items[i].length) { if (i == 'voice') { select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]); } else if (i !== 'source') { if (filter_items.season.length >= 1) { select.push(filter_translate.season + ': ' + filter_items[i][need[i]]); } } } } filter.chosen('filter', select); filter.chosen('sort', [sources[balanser].name]); }; this.getEpisodes = function(season, call) { var episodes = []; if (['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1) return call(episodes); if (typeof object.movie.id == 'number' && object.movie.name) { var tmdburl = 'tv/' + object.movie.id + '/season/' + season + '?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language', 'ru'); var baseurl = Lampa.TMDB.api(tmdburl); network.timeout(1000 * 10); network["native"](baseurl, function(data) { episodes = data.episodes || []; call(episodes); }, function(a, c) { call(episodes); }); } else call(episodes); }; this.watched = function(set) { var file_id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title); var watched = Lampa.Storage.cache('online_watched_last', 5000, {}); if (set) { if (!watched[file_id]) watched[file_id] = {}; Lampa.Arrays.extend(watched[file_id], set, true); Lampa.Storage.set('online_watched_last', watched); this.updateWatched(); } else { return watched[file_id]; } }; this.updateWatched = function() { var watched = this.watched(); var body = scroll.body().find('.online-prestige-watched .online-prestige-watched__body').empty(); if (watched) { var line = []; if (watched.balanser_name) line.push(watched.balanser_name); if (watched.voice_name) line.push(watched.voice_name); if (watched.season) line.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + watched.season); if (watched.episode) line.push(Lampa.Lang.translate('torrent_serial_episode') + ' ' + watched.episode); line.forEach(function(n) { body.append('' + n + ''); }); } else body.append('' + Lampa.Lang.translate('lampac_no_watch_history') + ''); }; /** * Отрисовка файлов */ this.draw = function(items) { var _this8 = this; var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}; if (!items.length) return this.empty(); scroll.clear(); scroll.append(Lampa.Template.get('lampac_prestige_watched', {})); this.updateWatched(); this.getEpisodes(items[0].season, function(episodes) { var viewed = Lampa.Storage.cache('online_view', 5000, []); var serial = object.movie.name ? true : false; var choice = _this8.getChoice(); var fully = window.innerWidth > 480; var scroll_to_element = false; var scroll_to_mark = false; items.forEach(function(element, index) { var episode = serial && episodes.length && !params.similars ? episodes.find(function(e) { return e.episode_number == element.episode; }) : false; var episode_num = element.episode || index + 1; var episode_last = choice.episodes_view[element.season]; var voice_name = choice.voice_name || (filter_find.voice[0] ? filter_find.voice[0].title : false) || element.voice_name || (serial ? 'Неизвестно' : element.text) || 'Неизвестно'; if (element.quality) { element.qualitys = element.quality; element.quality = Lampa.Arrays.getKeys(element.quality)[0]; } Lampa.Arrays.extend(element, { voice_name: voice_name, info: voice_name.length > 60 ? voice_name.substr(0, 60) + '...' : voice_name, quality: '', time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true) }); var hash_timeline = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title].join('') : object.movie.original_title); var hash_behold = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title, element.voice_name].join('') : object.movie.original_title + element.voice_name); var data = { hash_timeline: hash_timeline, hash_behold: hash_behold }; var info = []; if (element.season) { element.translate_episode_end = _this8.getLastEpisode(items); element.translate_voice = element.voice_name; } if (element.text && !episode) element.title = element.text; element.timeline = Lampa.Timeline.view(hash_timeline); if (episode) { element.title = episode.name; if (element.info.length < 30 && episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', { rate: parseFloat(episode.vote_average + '').toFixed(1) }, true)); if (episode.air_date && fully) info.push(Lampa.Utils.parseTime(episode.air_date).full); } else if (object.movie.release_date && fully) { info.push(Lampa.Utils.parseTime(object.movie.release_date).full); } if (!serial && object.movie.tagline && element.info.length < 30) info.push(object.movie.tagline); if (element.info) info.push(element.info); if (info.length) element.info = info.map(function(i) { return '' + i + ''; }).join('●'); var html = Lampa.Template.get('lampac_prestige_full', element); var loader = html.find('.online-prestige__loader'); var image = html.find('.online-prestige__img'); if (!serial) { if (choice.movie_view == hash_behold) scroll_to_element = html; } else if (typeof episode_last !== 'undefined' && episode_last == episode_num) { scroll_to_element = html; } if (serial && !episode) { image.append('' + ('0' + (element.episode || index + 1)).slice(-2) + ''); loader.remove(); } else if (!serial && ['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1) loader.remove(); else { var img = html.find('img')[0]; img.onerror = function() { img.src = './img/img_broken.svg'; }; img.onload = function() { image.addClass('online-prestige__img--loaded'); loader.remove(); if (serial) image.append('' + ('0' + (element.episode || index + 1)).slice(-2) + ''); }; img.src = Lampa.TMDB.image('t/p/w300' + (episode ? episode.still_path : object.movie.backdrop_path)); images.push(img); } html.find('.online-prestige__timeline').append(Lampa.Timeline.render(element.timeline)); if (viewed.indexOf(hash_behold) !== -1) { scroll_to_mark = html; html.find('.online-prestige__img').append('' + Lampa.Template.get('icon_viewed', {}, true) + ''); } element.mark = function() { viewed = Lampa.Storage.cache('online_view', 5000, []); if (viewed.indexOf(hash_behold) == -1) { viewed.push(hash_behold); Lampa.Storage.set('online_view', viewed); if (html.find('.online-prestige__viewed').length == 0) { html.find('.online-prestige__img').append('' + Lampa.Template.get('icon_viewed', {}, true) + ''); } } choice = _this8.getChoice(); if (!serial) { choice.movie_view = hash_behold; } else { choice.episodes_view[element.season] = episode_num; } _this8.saveChoice(choice); var voice_name_text = choice.voice_name || element.voice_name || element.title; if (voice_name_text.length > 30) voice_name_text = voice_name_text.slice(0, 30) + '...'; _this8.watched({ balanser: balanser, balanser_name: Lampa.Utils.capitalizeFirstLetter(sources[balanser].name.split(' ')[0]), voice_id: choice.voice_id, voice_name: voice_name_text, episode: element.episode, season: element.season }); }; element.unmark = function() { viewed = Lampa.Storage.cache('online_view', 5000, []); if (viewed.indexOf(hash_behold) !== -1) { Lampa.Arrays.remove(viewed, hash_behold); Lampa.Storage.set('online_view', viewed); Lampa.Storage.remove('online_view', hash_behold); html.find('.online-prestige__viewed').remove(); } }; element.timeclear = function() { element.timeline.percent = 0; element.timeline.time = 0; element.timeline.duration = 0; Lampa.Timeline.update(element.timeline); }; html.on('hover:enter', function() { if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100); if (params.onEnter) params.onEnter(element, html, data); }).on('hover:focus', function(e) { last = e.target; if (params.onFocus) params.onFocus(element, html, data); scroll.update($(e.target), true); }); if (params.onRender) params.onRender(element, html, data); _this8.contextMenu({ html: html, element: element, onFile: function onFile(call) { if (params.onContextMenu) params.onContextMenu(element, html, data, call); }, onClearAllMark: function onClearAllMark() { items.forEach(function(elem) { elem.unmark(); }); }, onClearAllTime: function onClearAllTime() { items.forEach(function(elem) { elem.timeclear(); }); } }); scroll.append(html); }); if (serial && episodes.length > items.length && !params.similars) { var left = episodes.slice(items.length); left.forEach(function(episode) { var info = []; if (episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', { rate: parseFloat(episode.vote_average + '').toFixed(1) }, true)); if (episode.air_date) info.push(Lampa.Utils.parseTime(episode.air_date).full); var air = new Date((episode.air_date + '').replace(/-/g, '/')); var now = Date.now(); var day = Math.round((air.getTime() - now) / (24 * 60 * 60 * 1000)); var txt = Lampa.Lang.translate('full_episode_days_left') + ': ' + day; var html = Lampa.Template.get('lampac_prestige_full', { time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true), info: info.length ? info.map(function(i) { return '' + i + ''; }).join('●') : '', title: episode.name, quality: day > 0 ? txt : '' }); var loader = html.find('.online-prestige__loader'); var image = html.find('.online-prestige__img'); var season = items[0] ? items[0].season : 1; html.find('.online-prestige__timeline').append(Lampa.Timeline.render(Lampa.Timeline.view(Lampa.Utils.hash([season, episode.episode_number, object.movie.original_title].join(''))))); var img = html.find('img')[0]; if (episode.still_path) { img.onerror = function() { img.src = './img/img_broken.svg'; }; img.onload = function() { image.addClass('online-prestige__img--loaded'); loader.remove(); image.append('' + ('0' + episode.episode_number).slice(-2) + ''); }; img.src = Lampa.TMDB.image('t/p/w300' + episode.still_path); images.push(img); } else { loader.remove(); image.append('' + ('0' + episode.episode_number).slice(-2) + ''); } html.on('hover:focus', function(e) { last = e.target; scroll.update($(e.target), true); }); html.css('opacity', '0.5'); scroll.append(html); }); } if (scroll_to_element) { last = scroll_to_element[0]; } else if (scroll_to_mark) { last = scroll_to_mark[0]; } Lampa.Controller.enable('content'); }); }; /** * Меню */ this.contextMenu = function(params) { params.html.on('hover:long', function() { function show(extra) { var enabled = Lampa.Controller.enabled().name; var menu = []; if (Lampa.Platform.is('webos')) { menu.push({ title: Lampa.Lang.translate('player_lauch') + ' - Webos', player: 'webos' }); } if (Lampa.Platform.is('android')) { menu.push({ title: Lampa.Lang.translate('player_lauch') + ' - Android', player: 'android' }); } menu.push({ title: Lampa.Lang.translate('player_lauch') + ' - Lampa', player: 'lampa' }); menu.push({ title: Lampa.Lang.translate('lampac_video'), separator: true }); menu.push({ title: Lampa.Lang.translate('torrent_parser_label_title'), mark: true }); menu.push({ title: Lampa.Lang.translate('torrent_parser_label_cancel_title'), unmark: true }); menu.push({ title: Lampa.Lang.translate('time_reset'), timeclear: true }); if (extra) { menu.push({ title: Lampa.Lang.translate('copy_link'), copylink: true }); } menu.push({ title: Lampa.Lang.translate('more'), separator: true }); if (Lampa.Account.logged() && params.element && typeof params.element.season !== 'undefined' && params.element.translate_voice) { menu.push({ title: Lampa.Lang.translate('lampac_voice_subscribe'), subscribe: true }); } menu.push({ title: Lampa.Lang.translate('lampac_clear_all_marks'), clearallmark: true }); menu.push({ title: Lampa.Lang.translate('lampac_clear_all_timecodes'), timeclearall: true }); Lampa.Select.show({ title: Lampa.Lang.translate('title_action'), items: menu, onBack: function onBack() { Lampa.Controller.toggle(enabled); }, onSelect: function onSelect(a) { if (a.mark) params.element.mark(); if (a.unmark) params.element.unmark(); if (a.timeclear) params.element.timeclear(); if (a.clearallmark) params.onClearAllMark(); if (a.timeclearall) params.onClearAllTime(); Lampa.Controller.toggle(enabled); if (a.player) { Lampa.Player.runas(a.player); params.html.trigger('hover:enter'); } if (a.copylink) { if (extra.quality) { var qual = []; for (var i in extra.quality) { qual.push({ title: i, file: extra.quality[i] }); } Lampa.Select.show({ title: Lampa.Lang.translate('settings_server_links'), items: qual, onBack: function onBack() { Lampa.Controller.toggle(enabled); }, onSelect: function onSelect(b) { Lampa.Utils.copyTextToClipboard(b.file, function() { Lampa.Noty.show(Lampa.Lang.translate('copy_secuses')); }, function() { Lampa.Noty.show(Lampa.Lang.translate('copy_error')); }); } }); } else { Lampa.Utils.copyTextToClipboard(extra.file, function() { Lampa.Noty.show(Lampa.Lang.translate('copy_secuses')); }, function() { Lampa.Noty.show(Lampa.Lang.translate('copy_error')); }); } } if (a.subscribe) { Lampa.Account.subscribeToTranslation({ card: object.movie, season: params.element.season, episode: params.element.translate_episode_end, voice: params.element.translate_voice }, function() { Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_success')); }, function() { Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_error')); }); } } }); } params.onFile(show); }).on('hover:focus', function() { if (Lampa.Helper) Lampa.Helper.show('online_file', Lampa.Lang.translate('helper_online_file'), params.html); }); }; /** * Показать пустой результат */ this.empty = function() { var html = Lampa.Template.get('lampac_does_not_answer', {}); html.find('.online-empty__buttons').remove(); html.find('.online-empty__title').text(Lampa.Lang.translate('empty_title_two')); html.find('.online-empty__time').text(Lampa.Lang.translate('empty_text')); scroll.clear(); scroll.append(html); this.loading(false); }; this.noConnectToServer = function(er) { var html = Lampa.Template.get('lampac_does_not_answer', {}); html.find('.online-empty__buttons').remove(); html.find('.online-empty__title').text(Lampa.Lang.translate('title_error')); html.find('.online-empty__time').text(er && er.accsdb ? er.msg : Lampa.Lang.translate('lampac_does_not_answer_text').replace('{balanser}', balanser[balanser].name)); scroll.clear(); scroll.append(html); this.loading(false); }; this.doesNotAnswer = function(er) { var _this9 = this; this.reset(); var html = Lampa.Template.get('lampac_does_not_answer', { balanser: balanser }); if(er && er.accsdb) html.find('.online-empty__title').text(er.msg) var tic = er && er.accsdb ? 10 : 5; html.find('.cancel').on('hover:enter', function() { clearInterval(balanser_timer); }); html.find('.change').on('hover:enter', function() { clearInterval(balanser_timer); filter.render().find('.filter--sort').trigger('hover:enter'); }); scroll.clear(); scroll.append(html); this.loading(false); balanser_timer = setInterval(function() { tic--; html.find('.timeout').text(tic); if (tic == 0) { clearInterval(balanser_timer); var keys = Lampa.Arrays.getKeys(sources); var indx = keys.indexOf(balanser); var next = keys[indx + 1]; if (!next) next = keys[0]; balanser = next; if (Lampa.Activity.active().activity == _this9.activity) _this9.changeBalanser(balanser); } }, 1000); }; this.getLastEpisode = function(items) { var last_episode = 0; items.forEach(function(e) { if (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode)); }); return last_episode; }; /** * Начать навигацию по файлам */ this.start = function() { if (Lampa.Activity.active().activity !== this.activity) return; if (!initialized) { initialized = true; this.initialize(); } Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(object.movie)); Lampa.Controller.add('content', { toggle: function toggle() { Lampa.Controller.collectionSet(scroll.render(), files.render()); Lampa.Controller.collectionFocus(last || false, scroll.render()); }, gone: function gone() { clearTimeout(balanser_timer); }, up: function up() { if (Navigator.canmove('up')) { Navigator.move('up'); } else Lampa.Controller.toggle('head'); }, down: function down() { Navigator.move('down'); }, right: function right() { if (Navigator.canmove('right')) Navigator.move('right'); else filter.show(Lampa.Lang.translate('title_filter'), 'filter'); }, left: function left() { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); }, back: this.back.bind(this) }); Lampa.Controller.toggle('content'); }; this.render = function() { return files.render(); }; this.back = function() { Lampa.Activity.backward(); }; this.pause = function() {}; this.stop = function() {}; this.destroy = function() { network.clear(); this.clearImages(); files.destroy(); scroll.destroy(); clearInterval(balanser_timer); clearTimeout(life_wait_timer); clearTimeout(hub_timer); if (hubConnection) { hubConnection.stop(); hubConnection = null; } }; } function startPlugin() { window.land_plugin = true; var manifst = { type: 'video', version: '', name: 'Onlyskaz', description: 'Плагин для просмотра онлайн сериалов и фильмов', component: 'lampacskaz', onContextMenu: function onContextMenu(object) { return { name: Lampa.Lang.translate('lampac_watch'), description: 'Плагин для просмотра онлайн сериалов и фильмов' }; }, onContextLauch: function onContextLauch(object) { resetTemplates(); Lampa.Component.add('lampacskaz', component); var id = Lampa.Utils.hash(object.number_of_seasons ? object.original_name : object.original_title) var all = Lampa.Storage.get('clarification_search','{}') Lampa.Activity.push({ url: '', title: Lampa.Lang.translate('title_online'), component: 'lampacskaz', search: all[id] ? all[id] : object.title, search_one: object.title, search_two: object.original_title, movie: object, page: 1, clarification: all[id] ? true : false }); } }; Lampa.Manifest.plugins = manifst; Lampa.Lang.add({ lampac_watch: { // ru: 'Смотреть онлайн', en: 'Watch online', uk: 'Дивитися онлайн', zh: '在线观看' }, lampac_video: { // ru: 'Видео', en: 'Video', uk: 'Відео', zh: '视频' }, lampac_no_watch_history: { ru: 'Нет истории просмотра', en: 'No browsing history', ua: 'Немає історії перегляду', zh: '没有浏览历史' }, lampac_nolink: { ru: 'Не удалось извлечь ссылку', uk: 'Неможливо отримати посилання', en: 'Failed to fetch link', zh: '获取链接失败' }, lampac_balanser: { // ru: 'Источник', uk: 'Джерело', en: 'Source', zh: '来源' }, helper_online_file: { // ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню', uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню', en: 'Hold the "OK" key to bring up the context menu', zh: '按住“确定”键调出上下文菜单' }, title_online: { // ru: 'Онлайн', uk: 'Онлайн', en: 'Online', zh: '在线的' }, lampac_voice_subscribe: { // ru: 'Подписаться на перевод', uk: 'Підписатися на переклад', en: 'Subscribe to translation', zh: '订阅翻译' }, lampac_voice_success: { // ru: 'Вы успешно подписались', uk: 'Ви успішно підписалися', en: 'You have successfully subscribed', zh: '您已成功订阅' }, lampac_voice_error: { // ru: 'Возникла ошибка', uk: 'Виникла помилка', en: 'An error has occurred', zh: '发生了错误' }, lampac_clear_all_marks: { // ru: 'Очистить все метки', uk: 'Очистити всі мітки', en: 'Clear all labels', zh: '清除所有标签' }, lampac_clear_all_timecodes: { // ru: 'Очистить все тайм-коды', uk: 'Очистити всі тайм-коди', en: 'Clear all timecodes', zh: '清除所有时间代码' }, lampac_change_balanser: { // ru: 'Изменить балансер', uk: 'Змінити балансер', en: 'Change balancer', zh: '更改平衡器' }, lampac_balanser_dont_work: { // ru: 'Поиск на ({balanser}) не дал результатов', uk: 'Пошук на ({balanser}) не дав результатів', en: 'Search on ({balanser}) did not return any results', zh: '搜索 ({balanser}) 未返回任何结果' }, lampac_balanser_timeout: { // ru: 'Источник будет переключен автоматически через 10 секунд.', uk: 'Джерело буде автоматично переключено через 10 секунд.', en: 'The source will be switched automatically after 10 seconds.', zh: '平衡器将在10秒内自动切换。' }, lampac_does_not_answer_text: { ru: 'Поиск на ({balanser}) не дал результатов', uk: 'Пошук на ({balanser}) не дав результатів', en: 'Search on ({balanser}) did not return any results', zh: '搜索 ({balanser}) 未返回任何结果' } }); Lampa.Template.add('lampac_css', "\n \n "); $('body').append(Lampa.Template.get('lampac_css', {}, true)); function resetTemplates() { Lampa.Template.add('lampac_prestige_full', "
\n
\n \"\"\n
\n
\n
\n
\n
{title}
\n
{time}
\n
\n\n
\n\n
\n
{info}
\n
{quality}
\n
\n
\n
"); Lampa.Template.add('lampac_content_loading', "
\n
\n\t\t\t\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
"); Lampa.Template.add('lampac_does_not_answer', "
\n
\n #{lampac_balanser_dont_work}\n
\n
\n #{lampac_balanser_timeout}\n
\n
\n
#{cancel}
\n
#{lampac_change_balanser}
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
\n
"); Lampa.Template.add('lampac_prestige_rate', "
\n \n {rate}\n
"); Lampa.Template.add('lampac_prestige_folder', "
\n
\n \n
\n
\n
\n
{title}
\n
{time}
\n
\n\n
\n
{info}
\n
\n
\n
"); Lampa.Template.add('lampac_prestige_watched', "
\n
\n \n
\n
\n \n
\n
"); } var button = "
\n \n\n #{title_online}\n
"); // нужна заглушка, а то при страте лампы говорит пусто Lampa.Component.add('lampacskaz', component); //то же самое resetTemplates(); function addButton(e) { if (e.render.find('.lampac--button').length) return; var btn = $(Lampa.Lang.translate(button)); btn.on('hover:enter', function() { resetTemplates(); Lampa.Component.add('lampacskaz', component); var id = Lampa.Utils.hash(e.movie.number_of_seasons ? e.movie.original_name : e.movie.original_title) var all = Lampa.Storage.get('clarification_search','{}') Lampa.Activity.push({ url: '', title: Lampa.Lang.translate('title_online'), component: 'lampacskaz', search: all[id] ? all[id] : e.movie.title, search_one: e.movie.title, search_two: e.movie.original_title, movie: e.movie, page: 1, clarification: all[id] ? true : false }); }); e.render.after(btn); } Lampa.Listener.follow('full', function(e) { if (e.type == 'complite') { addButton({ render: e.object.activity.render().find('.view--torrent'), movie: e.data.movie }); } }); try { if (Lampa.Activity.active().component == 'full') { addButton({ render: Lampa.Activity.active().activity.render().find('.view--torrent'), movie: Lampa.Activity.active().card }); } } catch (e) {} if (Lampa.Manifest.app_digital >= 177) { var balansers_sync = ["filmix", "fxapi", "kinobase", "rezka", "voidboost", "videocdn", "videodb", "collaps", "hdvb", "zetflix", "kodik", "ashdi", "eneyida", "kinoukr", "kinokrad", "kinotochka", "kinoprofi", "remux", "iframevideo", "cdnmovies", "anilibria", "animedia", "animego", "animevost", "animebesst", "redheadsound", "alloha", "seasonvar", "kinopub", "vokino"]; balansers_sync.forEach(function(name) { Lampa.Storage.sync('online_choice_' + name, 'object_object'); }); Lampa.Storage.sync('online_watched_last', 'object_object'); } } if (!window.land_plugin) { startPlugin(); $.getScript('http://skaz.tv/lampac-src-filter.js'); } })();
Чат

Нова розмова

🤓 Поясніть складну річ

Поясни штучний інтелект так, щоб я міг пояснити його своїй шестирічній дитині.


🧠 Отримуйте пропозиції та створюйте нові ідеї

Будь ласка, дайте мені 10 найкращих ідей для подорожей по всьому світу


💭 Перекладіть, скоротіть, виправте граматику та багато іншого...

Я тебе кохаю


DeepSeek R1
Привіт, як я можу вам допомогти сьогодні?
Respond in the Ukrainian language.You are a YouTube video analysis assistant. Your task is to summarize the content of the video and generate a summary includes highlights with key moments and topics discussed in the video. Follow these steps to execute the task:

1. Analyze the video content:
   Review the video content provided in the webpage. Identify the main themes, topics, and key moments that are discussed throughout the video.
  2. Create a summary:
   Write a concise summary of the video, capturing the essence of the content in 3-5 sentences. Focus on the main points and any significant conclusions drawn in the video.

3. Identify highlights:
   List key moments in the video that are particularly noteworthy as a list in the table. For each highlight, give the timestamp second first and next to it provide a brief description of what happens in that timestamp second and why it is significant. Do not change the second format or value, Do NOT convert to seconds to hours format, just give it as second. Aim for 5-10 highlights.

4. Format the response:
   Organize the summary and highlights into a visually appealing sidebar format. Include headings for 'Summary' and 'Highlights', and ensure that the highlights are easy to read and navigate.

5. Output the results:
   Present the summary and highlights in a clear and structured manner, ready to be displayed next to the video.

Notes:
- Ensure that the summary is informative and engaging, encouraging viewers to watch the video.
- The highlights should be specific and provide enough context for viewers to understand the significance of each moment.
- Avoid including any personal opinions or unnecessary commentary; focus solely on the content of the video.

Video content: second:0 text:Всех приветствую продолжаю серию
second:3 text:обзорных видео посвящённых Android TV
second:5 text:приставке nexbox
second:7 text:a95x в первом видео я сделал достаточно
second:10 text:подробный обзор данной приставки в этом
second:12 text:видео Я хочу вам рассказать как её
second:15 text:прошивать Итак на выбор предлагается три
second:18 text:способа первый способ самый простой
second:20 text:способ им сможет воспользоваться
second:21 text:Наверное каждый даже человек особо не
second:24 text:разбирающийся в технических тонкостях
second:27 text:для этого нужно будет зайти в меню
second:29 text:приставки
second:30 text:убедиться что интернет подключён далее
second:34 text:выбираем пункт об
second:36 text:устройстве в следующем меню выбираем
second:39 text:пункт обновления системы нам будет
second:41 text:предложено или
second:43 text:обновиться или будет сообщение о том что
second:47 text:система в обновлении не
second:50 text:нуждается как я уже сказал это самый
second:53 text:простой способ К сожалению
second:56 text:непро неча
second:61 text:способом и Судя по комментариям на
second:64 text:некоторых форумах
second:66 text:оставленных пользователями данные
second:68 text:приставки эти случаи не единичны
second:71 text:допустим я три раза уже
second:74 text:обновлял прошивку на свои приставки
second:77 text:первых два раза я это делал вот по
second:78 text:воздуху то есть при помощи
second:80 text:интернета третий раз оно мне ни в какую
second:83 text:не захотела обновляться по воздуху мне
second:86 text:прило для этого воспользоваться трем
second:88 text:способом
second:90 text:Я буду рассказывать чуть позже второй
second:93 text:способ прошивки и приставки Это наверно
second:95 text:будет самый известный и популярный
second:97 text:способ среди пользователе Android
second:99 text:устройств это прошивка при помощи
second:101 text:microSD
second:103 text:карты для этого потребуется карта
second:107 text:MicroSD желательно объёмом от 4 ГБ и кар
second:111 text:Rider Ну это вот исключительно для
second:112 text:примера здесь я положил встав Кату
second:116 text:в подключаем компьютеру
second:120 text:форматируем
second:123 text:карту далее нам нужна будет программа
second:126 text:для установки прошивки на SD карту и
second:130 text:сама прошивка сразу скажу что все
second:133 text:программы которые будут представлены в
second:135 text:этом видеоролики а также самые свежие
second:138 text:прошивки можно будет скачать По ссылкам
second:140 text:которые я оставлю в описании к этому
second:145 text:видеоролику после того как программы
second:148 text:прошивки Бут скат
second:150 text:х
second:159 text:распаковать вот у нас появилось значит
second:162 text:три файла это файлы с прошивкой для
second:164 text:прошивки А это папка с
second:167 text:программы программа называется OT C Mar
second:171 text:портальной установки не требует
second:173 text:запускаем е в этой строке указываем
second:177 text:карту на кою установлена прошивка в этой
second:181 text:строке указываем папку Куда была
second:185 text:распаковав выбираем файл с расширением
second:189 text:bin вот он тут сразу будет
second:193 text:виден жмём Make Ну вот открылось окно
second:197 text:это значит То что операция завершена
second:199 text:успешно закрываем программу
second:203 text:возвращаемся папку Куда была
second:206 text:распаковав копируем файлы прошивки
second:212 text:на SD карту куда должна быть установлена
second:221 text:прошивка Ну вот значит после того как
second:224 text:файлы будут скопированы на карту
second:226 text:прошивки то
second:228 text:есть карта для прошивки будет
second:232 text:готова после того
second:234 text:как mic SD карта с прошивкой будет
second:237 text:готова можно приу
second:242 text:приста для этого нужно будет приставку
second:245 text:отключить от сети то есть вот этот вот
second:247 text:должен Шнур будет
second:249 text:отключён вставляем SD карту с прошивкой
second:252 text:в
second:253 text:приставку HDM кабель можно будет
second:257 text:оставить для наблюдения процесса
second:259 text:прошивки на экране
second:262 text:телевизора далее нужно будет нажать на
second:265 text:кнопку перезагрузка кнопка находится вот
second:269 text:враз более подробно о кнопке
second:272 text:перезагрузки можно будет
second:274 text:найти в обзорном видео данной приставки
second:277 text:на моём канале значит нажимаем на эту
second:280 text:кнопку это можно делать например при
second:282 text:помощи спички или вот у меня тут
second:284 text:пластиковая палочка и не отпуская этой
second:288 text:кнопки
second:289 text:подключаем приставку к
second:292 text:сети и держим Так где-то примерно
second:295 text:секунды че Потом можно будет отпустить
second:300 text:сейчас для наглядности будет видео с
second:302 text:процессом прошивки которое можно будет
second:306 text:наблюдать на экране
second:308 text:телевизора после того как приставка
second:311 text:будет подключена к сети откроется вот
second:314 text:такое вот окно и уже можно будет
second:316 text:отпускать кнопку
second:318 text:перезагрузка далее начнётся установка
second:321 text:прошивки на
second:323 text:приставку вот по этой линии можно будет
second:326 text:наблюдать когда она завершится значит
second:328 text:вот она началась здесь ле Зелёная линия
second:331 text:пошла время установки прошивки при
second:335 text:помощи SD карты примерно где-то около 5
second:337 text:минут также я хочу заметить что если по
second:340 text:каким-либо причинам будет прошивка будет
second:343 text:прервана в этот момент то в большинстве
second:346 text:случаев прервана она может быть
second:350 text:допустим отключили электричество или ещё
second:353 text:какие-нибудь причины то в большинстве
second:355 text:случаев приставка превратится в кирпич
second:357 text:то есть её не то что нельзя будет
second:358 text:включить А даже пере по но при помощи SD
second:362 text:карты и как раз вот для того чтобы её
second:364 text:оживить существует третий способ
second:367 text:прошивки данной приставки о котором я
second:369 text:буду говорить чуть
second:371 text:позже Итак значит прошивка подходит к
second:374 text:концу я сделал небольшой пропуск времени
second:378 text:сейчас здесь появится Вот такой кружок и
second:381 text:в нём галочка то есть значок
second:383 text:о показывает это то что прошивка была
second:387 text:установлена
second:397 text:Ну вот появился значок
second:400 text:Окей Теперь значит приставку надо будет
second:403 text:отключить от сети вынуть из неё SD карту
second:408 text:с прошивкой и включить по новой
second:411 text:приставку подключить сети и включить по
second:413 text:новой и всё она уже будет работать то
second:415 text:есть с новой прошивкой
second:417 text:Итак третий способ прошивки Android TV
second:421 text:приставки nexbox
second:423 text:a95x Я бы назвал этот способ радикальным
second:426 text:потому как Он
second:429 text:позволяет восстановить TV приставку
second:433 text:практически из состояния
second:436 text:кирпича если кто не знает то это
second:439 text:состояние когда приставка образно говоря
second:442 text:не подаёт признака
second:445 text:жизни но есть одно но
second:450 text:пот
second:452 text:если приставке
second:455 text:имеются проблемы с программным
second:457 text:обеспечением если это технические
second:461 text:проблемы то конечно данный способ будет
second:463 text:бесполезен
second:465 text:также третий способ будет полезен если
second:469 text:нет
second:470 text:возможности перепрошить приставку или
second:473 text:установить
second:476 text:проши СПО
second:480 text:ещё одна важная информация если после
second:482 text:первых двух способов прошивки
second:485 text:приставки все ранее установленные
second:488 text:программы а также некоторые настройки
second:490 text:остаются на месте то есть не удаляются и
second:492 text:вам не нужно будет ничего
second:495 text:переустанавливать
second:497 text:то третий способ прошивки подразумевает
second:500 text:под собой полное обновление программного
second:504 text:обеспечение Я бы даже так сказал что В
second:506 text:некоторых случаях это будет полезно
second:510 text:для избавления от некоторых
second:513 text:глюков Итак для прошивки третьим
second:516 text:способом нам понадобится
second:518 text:компьютер Вот такой USB кабель в
second:521 text:магазинах он позиционируется под
second:524 text:аббревиатурой
second:526 text:Ну проще говоря с обоих концов должна
second:529 text:стоять розетка у этого
second:532 text:капе
second:534 text:прошивка и программа для установки этой
second:537 text:прошивки на
second:538 text:приставку как я уже говорил ранее
second:541 text:программу и прошивку можно будет скачать
second:543 text:По ссылкам которые я оставлю в описании
second:545 text:к этому
second:547 text:видеоролику значит распаковываем в
second:550 text:отдельную папку прошивку
second:559 text:программу далее устанавливаем программу
second:562 text:на
second:563 text:компьютер и
second:565 text:запускаем программа называется
second:569 text:USB Born
second:572 text:Tool выбираем в настройках английский
second:575 text:язык иначе будут вот такие кубики
second:577 text:русского тут нету но он не нужен потому
second:579 text:как программа предельно проста далее
second:582 text:открываем файл и Image это выбрать
second:587 text:образ указываем папку Куда была
second:590 text:распаковав и в этой папке выбираем вот
second:592 text:файл образа
second:598 text:прошивки всё
second:603 text:просто
second:605 text:далее отмечаем Вот эту вот
second:609 text:галочку и жмём кнопку
second:613 text:Старт Теперь нужно
second:616 text:будет приставку подключить к компьютеру
second:620 text:при помощи вот этого вот кабеля примерно
second:624 text:всё это будет выглядеть вот так вот
second:627 text:Обратите внимание что ка должен быть
second:631 text:подключён USB разъёма в приставке со
second:634 text:стороны сетевого
second:636 text:кабеля после того как к приставке будет
second:639 text:подключён USB кабель подключаем
second:641 text:приставку к
second:656 text:сети начинается процесс установки
second:661 text:вот можно будет наблюдать заходом
second:664 text:прошивки Вот в этой
second:667 text:строке он будет кстати быстрее намного
second:671 text:чем при прошивке при помощи кро SD
second:675 text:карты сделал Я небольшую паузу прошивка
second:678 text:была установлена и приставка готова к
second:683 text:работе по каким-либо
second:686 text:Прим во время
second:690 text:проо сбой такой бывает то есть вот эта
second:692 text:лини она окрашивается в красный цвет то
second:695 text:не стоит отчаиваться нужно будет
second:701 text:просто нажать стоп и перезапустить всё
second:708 text:по-новому на этом я буду завершать думаю
second:711 text:достаточно подробный и понятный
second:713 text:обучающий видеоролик прошивки Android
second:718 text:пристав
second:720 text:95x если у вас возникли какие-то вопросы
second:724 text:задавайте их в комментариях к этому
second:727 text:видеоролику по возможности я на них
second:730 text:отвечу также я хочу вам
second:733 text:посоветовать подписываться на мой канал
second:736 text:заходите на мой канал там вы найдёте
second:738 text:немало интересных обучающих видеороликов
second:740 text:И не только А на этом всем спасибо и
second:744 text:успехов


GPT-4o Mini
Втрачено з'єднання з Інтернетом. Будь ласка, спробуйте ще раз.
DeepSeek R1
coin image
18
Оновлення




'
Вставити виділене



Працює на AITOPIA 
Чат
Запитувати
Пошук
Написати
Зображення
«ЧатФайл»
Бачення
Повна сторінка
