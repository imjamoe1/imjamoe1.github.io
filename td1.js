(function () {
    // 'use strict' убран специально: присваивание нашей обёртки поверх
    // navigator.mediaSession.setActionHandler / setPositionState на
    // некоторых WebView кидает TypeError в strict-mode (native property
    // считается non-writable) и валит всю IIFE. В sloppy-mode такое
    // присваивание либо срабатывает как shadow на instance, либо тихо
    // no-op — оба варианта нам подходят.

	// Перенос настроек из оригинального приложения LAMPA. Нативная
	// часть уже прочитала их резервную копию и разобрала; здесь
	// осталось разложить пары по localStorage. Делаем это первым
	// делом и синхронно: privateinit.js грузится раньше app.min.js,
	// то есть Lampa стартует уже с перенесёнными настройками, и
	// перезагружать страницу на глазах у человека не надо.
	try {
		if (typeof AndroidJS !== 'undefined'
			&& typeof AndroidJS.pendingSettingsImport === 'function') {
			var carried = AndroidJS.pendingSettingsImport();
			if (carried) {
				var pairs = JSON.parse(carried);
				var moved = 0;
				for (var key in pairs) {
					try { localStorage.setItem(key, pairs[key]); moved++; } catch (e) {}
				}
				console.log('[LampaBS] перенесено настроек из Lampa:', moved);
			}
		}
	} catch (e) {
		console.log('[LampaBS] перенос настроек не удался', e);
	}

	// Общий помощник форка: даёт URL к файлу из assets/lampa/, но
	// если тот же файл лежит в OTA-кэше (filesDir/lampa_cache/) —
	// возвращает URL из кэша. Плагины (store.js и др.) пользуются
	// им, чтобы прозрачно подхватывать свежие копии после
	// "Проверить обновление".
	window.LampaBS = window.LampaBS || {};
	window.LampaBS.assetUrl = function (subpath) {
		var fallback = 'file:///android_asset/lampa/' + subpath;
		try {
			if (typeof AndroidJS !== 'undefined'
				&& typeof AndroidJS.getLampaCachedFileUrl === 'function') {
				var cached = AndroidJS.getLampaCachedFileUrl(subpath);
				if (cached) return cached;
			}
		} catch (e) {}
		return fallback;
	};

	// Без сети запрос за плагином всё равно не дойдёт: Lampa отправит
	// его, подождёт таймаут, покажет свою плашку «часть плагинов не
	// удалось загрузить» и запишет их в _noload. Спросить систему
	// заранее дешевле — тогда и запроса не будет, и плашки.
	//
	// Сетевые ссылки откладываем в общий список, локальные (assets,
	// OTA-кэш) пропускаем как обычно. Отложенное грузим сами, когда
	// связь появится, — см. блок «Офлайн при запуске» ниже.
	//
	// Этот перехват ставится РАНЬШЕ кэш-подмены ниже и потому
	// оказывается внутренним: сначала отработает подмена на локальную
	// копию, и уже её результат придёт сюда. Иначе мы отложили бы
	// плагин, который спокойно поднялся бы из кэша.
	window.LampaBS.deferredScripts = [];
	(function () {
		if (typeof AndroidJS === 'undefined' || typeof AndroidJS.isOnline !== 'function') return;
		if (!Lampa.Utils) return;

		function isNet(u) {
			return typeof u === 'string' &&
				(u.indexOf('http://') === 0 || u.indexOf('https://') === 0);
		}

		['putScript', 'putScriptAsync'].forEach(function (fn) {
			var orig = Lampa.Utils[fn];
			if (!orig) return;
			Lampa.Utils[fn] = function (items, complite, error, success, show_logs) {
				var online = true;
				try { online = !!AndroidJS.isOnline(); } catch (_) {}
				if (online || !Array.isArray(items)) return orig.apply(this, arguments);

				var keep = [];
				items.forEach(function (u) {
					if (!isNet(u)) { keep.push(u); return; }
					if (window.LampaBS.deferredScripts.indexOf(u) === -1) {
						window.LampaBS.deferredScripts.push(u);
					}
				});
				if (keep.length === items.length) return orig.apply(this, arguments);
				console.log('[LampaBS offline] без сети отложено скриптов: ' +
					(items.length - keep.length));
				// putScriptAsync с пустым списком не зовёт complite
				// никогда: его счётчик двигается только из onload/onerror
				// скрипта. Отдав туда пустой массив, мы бы молча
				// подвесили загрузку Lampa на этом шаге.
				if (!keep.length) {
					if (complite) setTimeout(complite, 0);
					return;
				}
				return orig.call(this, keep, complite, error, success, show_logs);
			};
		});
	})();

	// Плагины из filesDir/lampa_cache/plugins/ имеют приоритет над
	// встроенными в APK. Обновляются кнопкой "Обновить Lampa сейчас"
	// в разделе Lampa BS. Реализация — перехват Lampa.Utils.putScript
	// / putScriptAsync: если URL заканчивается на /plugins/<name>.js и
	// такое имя есть в списке кэшированных, подменяем URL на кэш.
	(function () {
		if (typeof AndroidJS === 'undefined') return;
		if (typeof AndroidJS.getLampaUpdateBaseUrl !== 'function') return;
		if (typeof AndroidJS.listCachedPlugins !== 'function') return;
		var cacheBase = AndroidJS.getLampaUpdateBaseUrl();
		if (!cacheBase) return;
		var listed = AndroidJS.listCachedPlugins();
		if (!listed) return;
		var cached = {};
		listed.split(',').forEach(function (n) { if (n) cached[n] = true; });
		if (!Object.keys(cached).length) return;

		function rewrite(u) {
			if (typeof u !== 'string') return u;
			var m = u.match(/\/plugins\/([^\/?]+\.js)(?:\?|$)/);
			if (m && cached[m[1]]) return cacheBase + 'plugins/' + m[1];
			return u;
		}
		['putScript', 'putScriptAsync'].forEach(function (fn) {
			var orig = Lampa.Utils && Lampa.Utils[fn];
			if (!orig) return;
			Lampa.Utils[fn] = function () {
				var args = Array.prototype.slice.call(arguments);
				if (Array.isArray(args[0])) args[0] = args[0].map(rewrite);
				else if (typeof args[0] === 'string') args[0] = rewrite(args[0]);
				return orig.apply(this, args);
			};
		});
	})();

	// Гарантия параметра `email` на apitmdb-прокси.
	//
	// Прокси apitmdb.<cub_domain> отвечает сам ТОЛЬКО если в query есть
	// `email` (значение не важно — работает даже пустое, это просто
	// маркер «свой клиент»). Без него он отдаёт 302 на
	// api.themoviedb.org, который в РФ заблокирован, и запрос молча
	// умирает. Так ломались подборки из p.js с source:'tmdb' —
	// Netflix / Okko / HBO / ИВИ и прочие with_networks-ряды, тогда
	// как cub-подборки (Русские, Дорамы) работали, потому что вообще
	// не ходят в TMDB.
	//
	// Lampa.TMDB.api (и наш override ниже, и t.js) email добавляют, но
	// в Lampa есть пути, которые собирают TMDB-URL мимо них. Поэтому
	// подстраховываемся на самом низком уровне — в XHR/fetch: что бы
	// ни построило URL, на выходе параметр будет.
	// Вторая (и главная) проблема того же запроса — ДУБЛЬ `language`.
	// Lampa строит TMDB-URL как `url + '&api_key=' + '&language=' + …`,
	// безусловно добавляя language. Если он уже был в url подборки,
	// получается
	//   discover/tv?language=ru&with_networks=213&api_key=…&language=ru
	// и TMDB отвечает
	//   {"status_code":5,"status_message":"Invalid parameters"}
	// то есть ряд просто пустой. Чиним там же, в транспорте: схлопываем
	// повторяющиеся query-параметры (побеждает последний — именно его
	// Lampa считает актуальным, он идёт из настроек интерфейса).
	(function () {
		function isTmdb(u) {
			return typeof u === 'string' &&
				(u.indexOf('apitmdb.') !== -1 || u.indexOf('api.themoviedb.org') !== -1);
		}
		function fix(u) {
			if (!isTmdb(u)) return u;
			var q = u.indexOf('?');
			if (q === -1) return u;
			var base = u.slice(0, q);
			var pairs = u.slice(q + 1).split('&');
			var order = [];
			var seen = {};
			pairs.forEach(function (p) {
				if (!p) return;
				var eq = p.indexOf('=');
				var k = eq === -1 ? p : p.slice(0, eq);
				if (!(k in seen)) order.push(k);
				seen[k] = p; // последний выигрывает
			});
			// Прокси apitmdb отвечает сам только если в query есть
			// `email` (значение не важно — маркер «свой клиент»).
			// Без него — 302 на api.themoviedb.org, заблокированный в РФ.
			if (u.indexOf('apitmdb.') !== -1 && !('email' in seen)) {
				var mail = '';
				try { mail = Lampa.Storage.get('account', '{}').email || ''; }
				catch (e) {}
				order.push('email');
				seen.email = 'email=' + encodeURIComponent(mail);
			}
			return base + '?' + order.map(function (k) { return seen[k]; }).join('&');
		}

		var xhrOpen = XMLHttpRequest.prototype.open;
		XMLHttpRequest.prototype.open = function (method, url) {
			var args = Array.prototype.slice.call(arguments);
			try { args[1] = fix(url); } catch (e) {}
			return xhrOpen.apply(this, args);
		};

		if (typeof window.fetch === 'function') {
			var origFetch = window.fetch;
			window.fetch = function (input, init) {
				try {
					if (typeof input === 'string') input = fix(input);
					else if (input && typeof input.url === 'string' && isTmdb(input.url)) {
						var fixed = fix(input.url);
						if (fixed !== input.url) input = new Request(fixed, input);
					}
				} catch (e) {}
				return origFetch.call(this, input, init);
			};
		}
	})();

	// TMDB proxy override — inline'им приоритетно, до асинхронной
	// загрузки плагинов. Иначе первый заход в приложение отправляет
	// запросы Home на api.themoviedb.org / image.tmdb.org напрямую
	// (плагин t.js ещё не успел переопределить Lampa.TMDB.api/image).
	// t.js потом всё равно загрузится и переопределит эти же методы
	// теми же реализациями — идемпотентно.
	(function () {
		if (!Lampa || !Lampa.TMDB || !Lampa.Utils) return;
		var tmdbDomain = 'cubnotrip.top';
		var pathImage = 'imagetmdb.' + tmdbDomain + '/';
		var pathApi = 'apitmdb.' + tmdbDomain + '/3/';
		function normalizeSlashes(u) {
			var head = u.slice(0, 8);
			var tail = u.slice(8).replace(/\/+/g, '/');
			return head + tail;
		}
		function accountEmail() {
			try { return Lampa.Storage.get('account', '{}').email || ''; }
			catch (e) { return ''; }
		}
		Lampa.TMDB.image = function (url) {
			var base = Lampa.Utils.protocol() + 'image.tmdb.org/' + url;
			var target = Lampa.Storage.field('proxy_tmdb')
				? Lampa.Utils.protocol() + pathImage + url
				: base;
			return Lampa.Utils.addUrlComponent(
				normalizeSlashes(target),
				'email=' + encodeURIComponent(accountEmail())
			);
		};
		Lampa.TMDB.api = function (url) {
			var base = Lampa.Utils.protocol() + 'api.themoviedb.org/3/' + url;
			var target = Lampa.Storage.field('proxy_tmdb')
				? Lampa.Utils.protocol() + pathApi + url
				: base;
			return Lampa.Utils.addUrlComponent(
				normalizeSlashes(target),
				'email=' + encodeURIComponent(accountEmail())
			);
		};
	})();

	// Android TV deep-link: preview-channel tiles launch MainActivity
	// with lampa://open?id=<tmdb>&type=movie|tv. AndroidJS stashes
	// that URI; we consume-and-clear it here, then push the matching
	// Lampa.Activity so the user lands on the card. Exposed as a
	// global so MainActivity.onNewIntent (re-entry on hot app) can
	// re-trigger the check.
	window.__lampabsCheckDeepLink = function () {
		try {
			if (typeof AndroidJS === 'undefined' || !AndroidJS.getPendingDeepLink) return;
			var raw = AndroidJS.getPendingDeepLink();
			if (!raw) return;
			var link = JSON.parse(raw);
			if (!link) return;

			// Ярлыки long-press (lampa://action?name=…).
			if (link.action) {
				switch (link.action) {
					case 'history':
						Lampa.Activity.push({
							url: '', title: 'История', component: 'history',
							source: 'tmdb', page: 1,
						});
						return;
					case 'favorites':
					case 'bookmarks':
						// Отдельный компонент 'bookmarks' — стандартный
						// экран «Избранное» в Lampa.
						Lampa.Activity.push({
							url: '', title: 'Избранное', component: 'bookmarks',
							source: 'tmdb', page: 1,
						});
						return;
				}
				return;
			}

			// Preview-канал / WatchNext-плитка → карточка фильма.
			if (!link.id) return;
			var method = link.type === 'tv' ? 'tv' : 'movie';
			Lampa.Activity.push({
				url: method + '/' + link.id,
				component: 'full',
				id: link.id,
				method: method,
				source: 'tmdb',
				card: { id: parseInt(link.id, 10) || link.id },
			});
		} catch (e) {
			console.log('[LampaBS deep-link] error', e);
		}
	};

	Lampa.Listener.follow('app', function (e) {
    if (e.type == 'ready') {
	 setTimeout(function () {
		$('.open--feed').remove();
		//$('.notice--icon').remove();

		// Deep-link check runs after Lampa is fully ready so the
		// activity stack is initialized.
		window.__lampabsCheckDeepLink();
	}, 1000);
    }
  });

	// (Проброс __player_choice в openPlayer теперь делает appReplace
	// прямо в app.min.js рядом с диспатчем — надёжнее чем оборачивать
	// нативный JavascriptInterface из JS-стороны.)

	// === «Продолжить просмотр» у онлайн-плагинов ===
	//
	// Элементы плейлиста онлайн-плагинов несут `callback` — это их
	// item.mark(). Встроенный плеер Lampa дёргает его в момент СТАРТА
	// серии (`play$1(e.item); … if (e.item.callback) e.item.callback()`),
	// и именно оттуда плагин узнаёт, на чём пользователь остановился:
	// mark() пишет `online_watched_last[file_id] = {balanser, voice,
	// season, episode}`, а «Продолжить просмотр» читает эту запись.
	//
	// При ВНЕШНЕМ плеере (наш DDD) плейлист крутит он сам, Lampa свой
	// play$1 не выполняет — и callback зовётся ровно один раз, при
	// запуске из списка. Посмотрел через автопереход три серии, вышел —
	// плагин по-прежнему предлагает продолжить с первой.
	//
	// Чиним так: запоминаем callback каждой серии по её timeline-хэшу,
	// а когда DDD рапортует прогресс по этому хэшу впервые — дёргаем.
	// Получается та же семантика «отметить при старте», что и у
	// встроенного плеера. Повторно не зовём: mark() идемпотентен, но
	// незачем гонять его каждые 15 секунд.
	var playMarks = {};

	// Стартовая позиция. У онлайн-плагинов elem.timeline — снимок,
	// сделанный когда рисовался список: {hash, percent, time, duration}
	// на тот момент. Посмотрел, вышел, запустил снова из того же
	// открытого списка — в снимке лежит время ДО просмотра, и плеер
	// стартует с него. Lampa освежает его сама в openPlayer, но только
	// под checkVersion(98), а app.min.js к нам приезжает и по OTA —
	// версия может отличаться. Перечитываем хранилище сами, наш хук
	// выполняется последним, перед самым JSON.stringify.
	function refreshTimeline(elem) {
		try {
			var h = elem && elem.timeline && elem.timeline.hash;
			if (!h || !window.Lampa || !Lampa.Timeline) return;
			var fresh = Lampa.Timeline.view(h);
			if (!fresh) return;
			var was = elem.timeline.time;
			elem.timeline.time = Math.round(fresh.time || 0);
			elem.timeline.duration = Math.round(fresh.duration || 0);
			elem.timeline.percent = fresh.percent || 0;
		} catch (_) {}
	}

	function registerPlayCallback(elem) {
		try {
			if (!elem || typeof elem.callback !== 'function') return;
			var h = elem.timeline && elem.timeline.hash;
			if (!h) return;
			// Новый запуск того же файла — сбрасываем «уже отмечено».
			playMarks[h] = { call: elem.callback, fired: false };
		} catch (_) {}
	}

	// Единая точка входа для нативного отчёта о прогрессе из DDD
	// (AndroidJS.deliverTimeCall зовёт её, если она есть).
	// Возвращает строку статуса — нативная сторона пишет её в logcat
	// (см. AndroidJS.deliverTimeCall). Без этого мост молчал: любая
	// осечка выглядела одинаково — «в Lampa ничего не появилось».
	window.__lampabsTimelineUpdate = function (payload) {
		if (!payload || !payload.hash) return 'no-hash';
		var out = [];
		try {
			if (window.Lampa && Lampa.Timeline) {
				Lampa.Timeline.update(payload);
				out.push('timeline-ok');
			} else out.push('no-timeline-api');
		} catch (e) { out.push('timeline-err:' + e); }
		// Legacy-путь: если серия зарегистрирована в timeCallback, там
		// висят side-effect'ы (Trakt/CUB sync). Вызов одноразовый.
		try {
			if (window.Lampa && Lampa.Android &&
				typeof Lampa.Android.timeCall === 'function') {
				Lampa.Android.timeCall(payload);
				out.push('timecall-ok');
			}
		} catch (_) { out.push('timecall-err'); }
		try {
			var rec = playMarks[payload.hash];
			if (!rec) out.push('no-mark');
			else if (!rec.fired) {
				rec.fired = true;
				rec.call();
				out.push('mark-ok');
			}
		} catch (e) { out.push('mark-err:' + e); }
		return out.join(',');
	};

	// === Плейлист торрент-сериала ===
	//
	// У торрентов список серий Lampa отдаёт отдельным вызовом и уже
	// ПОСЛЕ запуска: `Player.play(element); Player.playlist(list);`.
	// Онлайн-плагины кладут список прямо в элемент, торренты — нет, и
	// к моменту `AndroidJS.openPlayer` в payload'е его ещё нет. Наружу
	// уходит одна серия: ни панели серий, ни автоперехода, ни меток
	// пропуска на последующие.
	//
	// Ловим список обёрткой над `Player.playlist` — метод публичный,
	// бандл трогать не нужно, — а сам уход в нативный код откладываем
	// на тик: оба вызова идут подряд и синхронно, так что к следующему
	// тику список уже на месте.
	var lastPlaylist = null;

	function wrapLampaPlaylist() {
		try {
			if (!window.Lampa || !Lampa.Player) return false;
			var nativePlaylist = Lampa.Player.playlist;
			if (typeof nativePlaylist !== 'function') return false;
			if (nativePlaylist.__lampabs) return true;
			var wrapped = function (items) {
				try {
					lastPlaylist = Array.isArray(items) && items.length ? items : null;
				} catch (_) { lastPlaylist = null; }
				return nativePlaylist.apply(this, arguments);
			};
			wrapped.__lampabs = true;
			Lampa.Player.playlist = wrapped;
			if (Lampa.Player.playlist !== wrapped) {
				console.log('[LampaBS] playlist wrap REJECTED');
				return false;
			}
			return true;
		} catch (e) {
			console.log('[LampaBS] playlist wrap failed', e);
			return false;
		}
	}

	// Внешние субтитры от онлайн-плагинов приходят отдельным вызовом
	// `Player.subtitles(list)` — в payload'е их нет. Хуже того, у
	// самой Lampa этот вызов падает, когда играет не её плеер:
	// `Subtitles.custom` берёт `PlayerVideo.video()`, а встроенного
	// видео при нашем плеере не существует, и `video.customSubs = …`
	// кидает TypeError. Плагин ловит его своим `complite` и показывает
	// зрителю «Request complite error» — вместо фильма.
	//
	// Поэтому вызов оборачиваем: список запоминаем себе, а чужое
	// падение глотаем. Отметка времени нужна, чтобы субтитры прошлого
	// фильма не приклеились к следующему, у которого их нет.
	var lastSubs = null;
	var SUBS_FRESH_MS = 15000;

	function wrapLampaSubtitles() {
		try {
			if (!window.Lampa || !Lampa.Player) return false;
			var nativeSubs = Lampa.Player.subtitles;
			if (typeof nativeSubs !== 'function') return false;
			if (nativeSubs.__lampabs) return true;
			var wrapped = function (list) {
				try {
					lastSubs = Array.isArray(list) && list.length
						? { list: list, at: Date.now() }
						: null;
				} catch (_) { lastSubs = null; }
				try {
					return nativeSubs.apply(this, arguments);
				} catch (e) {
					console.log('[LampaBS] Player.subtitles у Lampa упал —',
						'её плеер не поднят, субтитры забрали себе');
				}
			};
			wrapped.__lampabs = true;
			Lampa.Player.subtitles = wrapped;
			return Lampa.Player.subtitles === wrapped;
		} catch (e) {
			console.log('[LampaBS] subtitles wrap failed', e);
			return false;
		}
	}

	/**
	 * Дождаться внешних субтитров, если плагин обещал их отдельным
	 * запросом. `Player.subtitles` он зовёт из сетевого колбэка уже
	 * после `Player.play`, так что к нашему тику их ещё нет.
	 *
	 * Ждём только когда в payload'е есть `subtitles_call` и своих
	 * субтитров нет, и не дольше `SUBS_WAIT_MS`. Не дождались —
	 * запускаем без них: молча задержать кино дольше секунды-двух
	 * хуже, чем остаться без чужой дорожки.
	 */
	var SUBS_WAIT_MS = 2000;
	var SUBS_POLL_MS = 50;

	function waitForSubs(json, since, done) {
		var wanted = false;
		try {
			var data = JSON.parse(json);
			wanted = !!(data && data.subtitles_call) &&
				!(Array.isArray(data.subtitles) && data.subtitles.length);
		} catch (_) {}
		if (!wanted) return done();
		var started = Date.now();
		(function tick() {
			// Годятся только те, что пойманы для этого запуска:
			// в `lastSubs` могли остаться субтитры прошлого фильма, и
			// ждать было бы нечего, а приехало бы чужое.
			var have = lastSubs && lastSubs.list && lastSubs.at >= since - 1500;
			if (have) {
				console.log('[LampaBS] субтитры дождались за',
					Date.now() - started, 'мс');
				return done();
			}
			if (Date.now() - started >= SUBS_WAIT_MS) {
				console.log('[LampaBS] субтитры не приехали за',
					SUBS_WAIT_MS, 'мс — запускаем без них');
				return done();
			}
			setTimeout(tick, SUBS_POLL_MS);
		})();
	}

	/** Подмешать пойманные субтитры, если своих в payload'е нет. */
	function mergeCapturedSubs(data) {
		try {
			if (!lastSubs || !lastSubs.list) return false;
			if (Date.now() - lastSubs.at > SUBS_FRESH_MS) return false;
			if (Array.isArray(data.subtitles) && data.subtitles.length) return false;
			data.subtitles = lastSubs.list;
			console.log('[LampaBS] субтитры от плагина:', lastSubs.list.length);
			return true;
		} catch (_) {
			return false;
		}
	}

	// Модули Lampa к этому моменту уже разложены по `window.Lampa`, но
	// молчаливый промах тут стоил бы ровно того, ради чего всё и
	// затевалось. Не получилось сразу — пробуем ещё раз по готовности.
	if (!wrapLampaSubtitles()) {
		try {
			if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
				Lampa.Listener.follow('app', function (e) {
					if (e.type === 'ready') {
						try { wrapLampaSubtitles(); } catch (_) {}
					}
				});
			}
		} catch (_) {}
	}

	if (!wrapLampaPlaylist()) {
		try {
			if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
				Lampa.Listener.follow('app', function (e) {
					if (e.type === 'ready') {
						try { wrapLampaPlaylist(); } catch (_) {}
					}
				});
			}
		} catch (_) {}
	}

	// Поднят ли VPN на устройстве (нативная часть смотрит TRANSPORT_VPN).
	// Если да — обходы для РФ выключаем: у человека уже незаблокированный
	// выход, трейлер сыграет нативным ютубом в HD, Шотс — прямо с
	// Cloudflare, а наш Piped (360p) / зеркало были бы только хуже.
	// Спрашиваем вживую, а не кэшируем: VPN включают и выключают на ходу.
	function vpnActive() {
		try {
			return typeof AndroidJS !== 'undefined' &&
				typeof AndroidJS.isVpnActive === 'function' &&
				AndroidJS.isVpnActive();
		} catch (e) { return false; }
	}

	/**
	 * Страна **подтверждена** гео-ответом, и это ru/by.
	 *
	 * Обходы для РФ раньше включались по `lampabs_proxy_tmdb_auto`, а
	 * он — не «человек в России». Его стартовое значение ставится **по
	 * языку интерфейса** и синхронно, чтобы у россиян картинки были уже
	 * на первом экране; страна приезжает позже и лишь уточняет его.
	 *
	 * Для картинок ошибиться в эту сторону не страшно: русскоязычный за
	 * границей просто сходит за постерами через зеркало. А вот для
	 * ютуба это ломает всё: его трафик уходит через наш узел в России,
	 * ютуб видит российский IP и отвечает «контент недоступен в вашей
	 * стране» — на том, что у него без нас играет. Оригинальная Lampa
	 * никуда не заворачивает, поэтому у неё и работает.
	 *
	 * Поэтому здесь язык не годится вовсе: пока страна не названа
	 * вслух, обходов нет. Не знаем — не лезем.
	 */
	function geoIsRuBy() {
		try {
			if (!window.Lampa || !Lampa.Storage) return false;
			var c = String(Lampa.Storage.get('lampabs_geo_country', '') || '')
				.trim().toLowerCase();
			return c === 'ru' || c === 'by';
		} catch (e) { return false; }
	}

	// Ютуб-трейлер в РФ: играем в нашем нативном плеере, а не в
	// ламповском iframe. Ссылку добывает нативная часть на устройстве
	// (обход бот-блока и запрета встраивания). Только в ru/by и без VPN;
	// не удалось добыть — нативная часть зовёт fallback, и играем как
	// раньше. Не-ютуб плей проходит мимо.
	function wrapLampaPlayForTrailer() {
		try {
			if (!window.Lampa || !Lampa.Player) return false;
			var nativePlay = Lampa.Player.play;
			if (typeof nativePlay !== 'function') return false;
			if (nativePlay.__lampabs_trailer) return true;
			var wrapped = function (params) {
				try {
					var on = params && params.youtube &&
						geoIsRuBy() &&
						!vpnActive() &&
						typeof AndroidJS !== 'undefined' &&
						typeof AndroidJS.playYoutubeTrailer === 'function';
					if (on) {
						var url = String(params.url || '');
						var m = url.match(/[?&]v=([\w-]{6,})/) ||
							url.match(/youtu\.be\/([\w-]{6,})/);
						var id = m ? m[1] : '';
						if (id) {
							var self = this, args = arguments;
							var cb = '__lampabsYtFb_' + Date.now() + '_' +
								Math.round(Math.random() * 1e6);
							window[cb] = function () {
								try { delete window[cb]; } catch (e) { window[cb] = null; }
								try { nativePlay.apply(self, args); } catch (e) {}
							};
							AndroidJS.playYoutubeTrailer(id, String(params.title || ''),
								String(params.img || params.thumbnail || params.background || ''), cb);
							return;
						}
					}
				} catch (e) { console.log('[LampaBS] trailer hook failed', e); }
				return nativePlay.apply(this, arguments);
			};
			wrapped.__lampabs_trailer = true;
			Lampa.Player.play = wrapped;
			return Lampa.Player.play === wrapped;
		} catch (e) {
			console.log('[LampaBS] play wrap failed', e);
			return false;
		}
	}

	if (!wrapLampaPlayForTrailer()) {
		try {
			if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
				Lampa.Listener.follow('app', function (e) {
					if (e.type === 'ready') {
						try { wrapLampaPlayForTrailer(); } catch (_) {}
					}
				});
			}
		} catch (_) {}
	}

	// Шотс в РФ: `video.lampa-shorts.com` сидит за Cloudflare, а его в РФ
	// душат по DPI. Лента шотсов играет инлайновым `<video autoplay
	// loop>` (плагин shots.js: `this.video.src = this.shot.file`), а
	// `<video>` уходит через медиа-конвейер WebView — мимо клиентского
	// прокси, проксировать нельзя (та же стена, что у googlevideo).
	// Поэтому подменяем host у ссылки на свой, не за Cloudflare: сервер
	// реверсит CDN шотсов (skaz.tv отдаётся nginx/Caddy напрямую и в РФ
	// достижим), клиент качает с достижимого хоста. Только в ru/by (тот
	// же гео-флаг, что у прокси трейлеров); хост из Storage, пусто —
	// подмены нет. Перехватываем сеттер `src` у HTMLMediaElement: он
	// ставится один раз и рано, а хост читается в момент проигрывания,
	// когда Lampa уже поднята. Чужие ссылки (не lampa-shorts) проходят
	// как есть.
	var SHOTS_SRC_HOST = 'video.lampa-shorts.com';
	function shotsRewriteSrc(url) {
		try {
			if (!url || url.indexOf(SHOTS_SRC_HOST) < 0) return url;
			if (!window.Lampa || !Lampa.Storage) return url;
			if (!geoIsRuBy()) return url;
			if (vpnActive()) return url;   // есть VPN — Шотс идёт прямо, зеркало ни к чему
			var host = Lampa.Storage.get('lampabs_shots_host', 'shots.skaz.tv');
			if (!host) return url;
			return url.replace('://' + SHOTS_SRC_HOST, '://' + host);
		} catch (e) { return url; }
	}
	function installShotsHostRewrite() {
		try {
			if (window.__lampabs_shots_patched) return;
			var proto = window.HTMLMediaElement && HTMLMediaElement.prototype;
			if (!proto) return;
			var desc = Object.getOwnPropertyDescriptor(proto, 'src');
			if (!desc || typeof desc.set !== 'function' || typeof desc.get !== 'function') return;
			Object.defineProperty(proto, 'src', {
				configurable: true,
				enumerable: desc.enumerable,
				get: function () { return desc.get.call(this); },
				set: function (v) { desc.set.call(this, shotsRewriteSrc(String(v))); }
			});
			window.__lampabs_shots_patched = true;
		} catch (e) { console.log('[LampaBS] shots patch failed', e); }
	}
	installShotsHostRewrite();

	// Подмешать пойманный список в payload.
	//
	// Берём его только если в нём есть элемент с той же ссылкой, что
	// сейчас запускается: список живёт до следующего вызова, и без
	// этой сверки к одиночному файлу приклеился бы сериал из прошлого
	// просмотра. Свой список, если он есть, всегда главнее. Список из
	// одного элемента не подмешиваем вовсе — он ничего не добавляет.
	function mergeCapturedPlaylist(data) {
		try {
			var list = lastPlaylist;
			if (!Array.isArray(list) || list.length < 2) return false;
			if (Array.isArray(data.playlist) && data.playlist.length) return false;
			var url = data.url || '';
			if (!url) return false;
			var mine = false;
			for (var i = 0; i < list.length; i++) {
				var it = list[i];
				if (it && typeof it === 'object' && it.url === url) { mine = true; break; }
			}
			if (!mine) return false;
			data.playlist = list;
			// Отметку «начал смотреть» у элементов списка ставим по той
			// же схеме, что и у онлайн-плагинов: у торрентов callback'а
			// обычно нет, и тогда это просто ничего не делает.
			list.forEach(registerPlayCallback);
			return true;
		} catch (e) {
			console.log('[LampaBS] playlist merge failed', e);
			return false;
		}
	}

	// Последний рубеж: обёртка вокруг самого AndroidJS.openPlayer.
	//
	// Позиция старта берётся из elem.timeline — а это снимок, который
	// плагин сделал, когда рисовал список, и держит до перезапуска
	// приложения. Посмотрел, вышел, зашёл снова из того же списка —
	// плеер стартует с того места, где ты был на момент открытия Lampa.
	//
	// Освежить снимок пытаются трое: Lampa у себя в openPlayer (под
	// checkVersion(98)), наш __lampabsEnrichPlayer (через appReplace-
	// врезку в app.min.js) — и ни на кого нельзя положиться: app.min.js
	// приезжает и по OTA, где врезки может не быть, а версия Lampa
	// может быть старее блока updateTimeline. Здесь же мы правим уже
	// готовый JSON перед самым уходом в нативный код, поэтому работает
	// независимо от того, чей app.min.js загружен.
	function fixLaunchPayload(json) {
		try {
			if (!json || !window.Lampa || !Lampa.Timeline) return json;
			var data = JSON.parse(json);
			if (!data || typeof data !== 'object') return json;
			var touched = false;

			// Список серий торрента — до обхода таймлайнов ниже, чтобы
			// подмешанные серии тоже получили свежие позиции.
			if (mergeCapturedPlaylist(data)) touched = true;
			if (mergeCapturedSubs(data)) touched = true;

			function fresh(elem) {
				var h = elem && elem.timeline && elem.timeline.hash;
				if (!h) return;
				var v = Lampa.Timeline.view(h);
				if (!v) return;
				var t = Math.round(v.time || 0);
				if (elem.timeline.time !== t) touched = true;
				elem.timeline.time = t;
				elem.timeline.duration = Math.round(v.duration || 0);
				elem.timeline.percent = v.percent || 0;
			}

			fresh(data);
			if (Array.isArray(data.playlist)) data.playlist.forEach(fresh);
			// data.position Lampa копирует из снимка таймлайна на шаг
			// раньше, чем openPlayer этот снимок освежает. Приводим его
			// к таймлайну всегда, а не только когда сами что-то меняли:
			// timeline к этому моменту уже могла поправить сама Lampa,
			// и тогда touched=false, а position остаётся старым.
			if (data.timeline && typeof data.position !== 'undefined' &&
				data.position !== data.timeline.time) {
				data.position = data.timeline.time;
				touched = true;
			}
			return touched ? JSON.stringify(data) : json;
		} catch (e) {
			console.log('[LampaBS] launch fix failed', e);
			return json;
		}
	}

	(function () {
		try {
			if (typeof AndroidJS === 'undefined') return;
			var native = AndroidJS.openPlayer;
			if (typeof native !== 'function' || native.__lampabs) return;
			var wrapped = function (link, json) {
				// Отдаём на тик позже: список серий торрента Lampa
				// присылает следующим вызовом, в том же такте. Уйти
				// синхронно значит уйти без него. Возвращаемого
				// значения у моста нет — откладывать нечего терять.
				//
				// А если у серии обещаны внешние субтитры
				// (`subtitles_call`), ждём и их: плагин уходит за ними
				// в сеть уже ПОСЛЕ `Player.play`, и на тик они не
				// успевают. Ждём недолго и не больше положенного — с
				// субтитрами, но через три секунды, кино никому не
				// нужно.
				var go = function () {
					try {
						native.call(AndroidJS, link, fixLaunchPayload(json));
					} catch (e) {
						console.log('[LampaBS] openPlayer failed', e);
					}
				};
				var since = Date.now();
				setTimeout(function () { waitForSubs(json, since, go); }, 0);
			};
			wrapped.__lampabs = true;
			AndroidJS.openPlayer = wrapped;
			// Присваивание свойству инжектированного моста может тихо
			// не сработать: файл не в strict mode, и запись в read-only
			// свойство не бросает исключение. Проверяем результат, а не
			// факт выполнения строки.
			if (AndroidJS.openPlayer !== wrapped) {
				console.log('[LampaBS] openPlayer wrap REJECTED');
			}
		} catch (e) {
			// Объект-мост мог оказаться неизменяемым — тогда остаёмся
			// на appReplace-врезке, поведение как было.
			console.log('[LampaBS] openPlayer wrap failed', e);
		}
	})();

	// === Экран загрузки плеера: обложка и логотип ===
	//
	// Плеер живёт отдельным процессом, TMDB не спрашивает и карточки не
	// видит — значит и обложку, и логотип ему надо передать готовыми
	// ссылками, как передаётся постер.
	//
	// Правило выбора логотипа взято у самой Lampa (`selectLogo`): язык
	// интерфейса, потом английский, потом запись вообще без языка. У
	// TMDB логотип без языка — это обычно международный вариант, он
	// подходит лучше случайного турецкого.
	function langCode(v) {
		return String(v || '').toLowerCase().split(/[-_]/)[0];
	}

	// Полный адрес картинки TMDB.
	//
	// Именно `image`, а не `img`: у экспортированного `Lampa.TMDB`
	// только `{api, key, image, broken}`, а `img` живёт у внутреннего
	// объекта и наружу не вынесен. Через `image` же работает подмена
	// зеркала — прокси переопределяет её на старте, и адрес уезжает на
	// `imagetmdb.…`, а не на заблокированный `image.tmdb.org`.
	function tmdbImage(path, size) {
		if (!path) return '';
		try {
			// Путь у TMDB уже начинается со слэша — свой не добавляем,
			// иначе в адресе двойной, как в остальных местах файла.
			return Lampa.TMDB.image('t/p/' + size + path);
		} catch (e) {
			return '';
		}
	}

	function pickLogoPath(logos) {
		if (!Array.isArray(logos) || !logos.length) return '';
		var pref = '';
		try { pref = langCode(Lampa.Storage.field('tmdb_lang')); } catch (e) {}
		var order = [pref, 'en', null].filter(function (code, i, list) {
			return code !== '' && list.indexOf(code) === i;
		});
		for (var i = 0; i < order.length; i++) {
			var code = order[i];
			// `find` есть не во всех WebView, до которых доезжает сборка.
			var hit = logos.filter(function (item) {
				return code === null
					? !(item && item.iso_639_1)
					: langCode(item && item.iso_639_1) === code;
			})[0];
			if (hit && hit.file_path) return hit.file_path;
		}
		var any = logos.filter(function (item) {
			return item && item.file_path;
		})[0];
		return any ? any.file_path : '';
	}

	// Обогащение payload openPlayer'а: онлайн-плагины (HDVB и др.)
	// зовут Lampa.Player.play({url, title, ...}) без data.card — карту
	// они не пробрасывают, Lampa для футера берёт её из
	// Lampa.Activity.active().movie. Нативной стороне карта нужна,
	// чтобы завести WatchNext-тайл ("Продолжить просмотр" на Google TV
	// Home) — providerId берётся из card.id. Без карты WatchNext
	// логирует "no id in openPlayer payload — skipping WatchNext" и
	// плитка не появляется. Fallback читает active().card / .movie.
	// Хук вызывается appReplace-правилом на строке
	//   AndroidJS.openPlayer(link, JSON.stringify(data));
	// см. tools/apply_appreplace.py и mirror в lampa_updater.js.
	// Компоненты, из которых открывают телеканалы: наш tv.js
	// (`tvskaz`, его же настройки живут в `iptvskaz`) и собственный
	// раздел Lampa (`iptv`). Список — единственное место, куда
	// заглядывать, если канальный режим не включился.
	var IPTV_COMPONENTS = [
		'tvskaz', 'iptvskaz', 'iptv',
		'kulik_iptv', 'kuliklite_iptv',
	];

	// === Номера каналов для телепрограммы ===
	//
	// Программу отдаёт `skaz.tv/epg/<id>/<время>`, и весь вопрос в том,
	// откуда взять `id`. В плейлист, который плагин передаёт плееру,
	// он не попадает: там только название, ссылка и логотип. Зато у
	// плагина есть своя база (`Lampa.DB('skaz_iptv')`), и разобранный
	// плейлист с номерами лежит в ней целиком.
	//
	// Базу открываем **сами**, через `indexedDB`, а не через
	// `Lampa.DB`: у той соединение поднимается отдельным вызовом
	// `openDatabase()`, и `getData` без него молча уходит в reject —
	// на этом первая версия карты не собралась ни разу. Заодно
	// открытие без номера версии берёт базу как есть и не спорит с
	// плагином о версии.
	//
	// Карту собираем заранее и держим в памяти: сам payload
	// собирается синхронно, а база асинхронная.
	//
	// Если плагин однажды начнёт класть `channel_id` прямо в элемент
	// плейлиста — он и будет взят, карта тогда не понадобится.
	var iptvIdByName = {};
	var iptvIdByUrl = {};
	var iptvGroupByName = {};
	// Архив канала: `catchup`, `catchup-days` и `catchup-source` из m3u.
	// По ним плеер собирает ссылку на прошедшую передачу — подставляет
	// в неё время начала (`utc`/`lutc` и прочие подстановки провайдера).
	var iptvCatchupByName = {};
	var iptvCatchupByUrl = {};
	// Откуда спрашивать программу этого канала. Пусто — с нашего
	// сервера по номеру провайдера; иначе адрес чужой ручки.
	var iptvEpgBaseByName = {};
	var iptvEpgBaseByUrl = {};
	// Название и логотип по ссылке: плагин CUB присылает канал без
	// имени вовсе, а список у нас к этому моменту полный.
	var iptvNameByUrl = {};
	var iptvLogoByUrl = {};
	// Списки каналов по источникам, в порядке провайдера: из них
	// собирается плейлист соседей, когда плагин своего не дал. Держим
	// **раздельно**: плейлистов у человека несколько, и свалив всё в
	// один массив, мы будем листать каналы одного вперемешку с другим.
	var iptvLists = {};
	var iptvMapAt = 0;

	// Ссылка в плейлисте уже прошла через Url.prepareUrl плагина —
	// параметры там могли и добавиться. Поэтому сравниваем без них.
	function iptvUrlKey(url) {
		var s = String(url || '');
		var q = s.indexOf('?');
		return (q === -1 ? s : s.slice(0, q)).toLowerCase();
	}

	function iptvChannelId(elem) {
		if (!elem) return '';
		var own = elem.channel_id || elem.id ||
			(elem.tvg && elem.tvg.id) || '';
		if (own) return String(own);
		var name = String(elem.title || elem.name || '').toLowerCase().trim();
		if (name && iptvIdByName[name]) return String(iptvIdByName[name]);
		var url = iptvUrlKey(elem.url);
		return url && iptvIdByUrl[url] ? String(iptvIdByUrl[url]) : '';
	}

	function iptvGroupName(g) {
		if (!g) return '';
		return String(g.title || g.name || g);
	}

	function iptvChannelGroup(elem) {
		if (!elem) return '';
		if (elem.group) return iptvGroupName(elem.group);
		var name = String(elem.title || elem.name || '').toLowerCase().trim();
		return name && iptvGroupByName[name] ? String(iptvGroupByName[name]) : '';
	}

	/**
	 * Раздел, из которого открыли, — телеканалы.
	 *
	 * Список известных имён держим, но не полагаемся на него: плагинов
	 * много, свой раздел каждый называет по-своему, а корень у всех
	 * один. `tv` целиком — это раздел телеканалов у тех, кто обошёлся
	 * без приставки.
	 */
	function iptvComponentIsTv(comp) {
		var c = String(comp || '').toLowerCase();
		if (!c) return false;
		return IPTV_COMPONENTS.indexOf(c) !== -1 ||
			c.indexOf('iptv') !== -1 || c === 'tv';
	}

	/**
	 * Канал из чужого списка — готовым элементом плейлиста.
	 *
	 * Номер выбираем **сразу под свой адрес**: у CUB `id` — его
	 * собственный номер, а `tvg.id` — провайдера, и каждый отвечает
	 * только своему серверу.
	 */
	function iptvChannelEntry(ch, base) {
		if (!ch || !ch.url) return null;
		var id = base
			? (ch.id || ch.channel_id || (ch.tvg && ch.tvg.id))
			: ((ch.tvg && ch.tvg.id) || ch.channel_id || ch.id);
		var e = { url: String(ch.url), tv: true };
		if (ch.name) e.title = String(ch.name);
		if (id) e.channel_id = String(id);
		var g = iptvGroupName(ch.group);
		if (g) e.group = g;
		var logo = ch.logo || ch.icon || ch.img || (ch.tvg && ch.tvg.logo);
		if (logo) e.logo = String(logo);
		if (base) e.epg_base = base;
		var cat = ch.catchup && typeof ch.catchup === 'object' ? ch.catchup : null;
		if (cat) {
			if (cat.type) e.catchup_type = String(cat.type);
			if (cat.days) e.catchup_days = String(cat.days);
			if (cat.source) e.catchup_source = String(cat.source);
		}
		return e;
	}

	/**
	 * Соседние каналы для открытого — из списка, в котором он лежит.
	 *
	 * Плагин CUB плейлист не отдаёт вовсе: соседей он выдаёт функцией,
	 * а она через мост не проходит. Зато его список у нас уже есть.
	 * Целиком отдавать нельзя — пять тысяч каналов это и мегабайт через
	 * мост на каждое открытие, и пять тысяч строк в списке; берём окно
	 * вокруг открытого канала, чтобы листалось в обе стороны.
	 */
	function iptvNeighbours(url, limit) {
		var key = iptvUrlKey(url);
		var best = null;
		var at = -1;
		var keys = Object.keys(iptvLists);
		for (var i = 0; i < keys.length; i++) {
			var list = iptvLists[keys[i]];
			for (var j = 0; j < list.length; j++) {
				if (iptvUrlKey(list[j].url) === key) { best = list; at = j; break; }
			}
			if (best) break;
		}
		// Открытого канала нет ни в одном списке — листать наугад по
		// чужому порядку хуже, чем не листать вовсе.
		if (!best) return null;
		if (best.length <= limit) return best.slice();
		var from = Math.max(0, at - Math.floor(limit / 2));
		if (from + limit > best.length) from = best.length - limit;
		return best.slice(from, from + limit);
	}

	/**
	 * Элемент — серия, а не канал.
	 *
	 * У серий есть номер сезона и номер серии, у канала их не бывает
	 * никогда. Поля называются по-разному: у плейлиста плагина это
	 * `season`/`episode`, у ответа TMDB — `season_number`/
	 * `episode_number`, там же кадр серии и дата выхода.
	 */
	function iptvElemLooksSeries(x) {
		if (!x || typeof x !== 'object') return false;
		return x.season != null || x.episode != null ||
			x.season_number != null || x.episode_number != null ||
			x.episodes != null || x.still_path != null ||
			x.air_date != null;
	}

	/**
	 * Элемент похож на канал — и это должно быть **доказано**.
	 *
	 * Раньше хватало `id` и названия, но это описывает вообще всё, что
	 * есть в Lampa: серии, сезоны, фильмы, закладки. У эпизода TMDB
	 * ровно такая пара (`{id, name}`), и список серий заезжал в карту
	 * каналов, а оттуда сериал открывался канальным интерфейсом — с
	 * номером серии вместо номера канала и без шкалы перемотки.
	 *
	 * Настоящий признак канала один: он приехал из m3u. Значит есть
	 * `tvg` (в нём `tvg-id`, по которому и спрашивается программа),
	 * либо уже разобранный `channel_id`, либо атрибуты архива. Ничего
	 * этого нет — не берём: канал без номера всё равно остался бы без
	 * программы, а вот сериал, принятый за канал, ломает просмотр.
	 */
	function iptvElemLooksChannel(x) {
		if (!x || typeof x !== 'object') return false;
		if (!(x.name || x.title)) return false;
		if (iptvElemLooksSeries(x)) return false;
		if (x.tvg && typeof x.tvg === 'object' && (x.tvg.id || x.tvg.logo)) return true;
		if (x.channel_id) return true;
		return !!(x.catchup && typeof x.catchup === 'object');
	}

	/**
	 * Плейлист — это серии.
	 *
	 * Предохранитель на самом решении: карта каналов собирается из
	 * чужих хранилищ, и что в них лежит, мы не выбираем. Даже если она
	 * однажды снова окажется засорена, список с номерами серий
	 * канальным режимом не откроется.
	 */
	function iptvPlaylistLooksSeries(list) {
		if (!list || !list.length) return false;
		var seen = 0, series = 0;
		for (var i = 0; i < list.length; i++) {
			var x = list[i];
			if (!x || typeof x !== 'object') continue;
			seen++;
			if (iptvElemLooksSeries(x)) series++;
		}
		return series > 0 && series * 2 >= seen;
	}

	/**
	 * Знаем ли мы этот элемент как канал — по карте, собранной из
	 * ответов плагинов.
	 *
	 * Смотрим только название и ссылку. Поле `id` у элемента для этого
	 * не годится: оно бывает и у серий, и тогда сериал открылся бы
	 * канальным интерфейсом — без шкалы перемотки и с листанием
	 * «каналов» вместо серий.
	 */
	function iptvKnownChannel(elem) {
		if (!elem) return false;
		var name = String(elem.title || elem.name || '').toLowerCase().trim();
		if (name && iptvIdByName[name]) return true;
		var url = iptvUrlKey(elem.url);
		return !!(url && iptvIdByUrl[url]);
	}

	/**
	 * Плагин сам сказал, что это каналы.
	 *
	 * `tv: true` плагины ставят **в самом элементе**, а не в корне
	 * payload'а: у CUB именно так, и проверки одного `data.tv` не
	 * хватало — его каналы открывались обычным плеером. Требуем
	 * большинство элементов, а не один: у списка серий такого поля не
	 * бывает вовсе, а вот случайная галка на одном элементе чужого
	 * плейлиста весь список каналами не делает.
	 */
	function iptvPlaylistSaysTv(list) {
		if (!list || !list.length) return false;
		var tv = 0;
		for (var i = 0; i < list.length; i++) {
			if (list[i] && list[i].tv === true) tv++;
		}
		return tv > 0 && tv * 2 >= list.length;
	}

	/**
	 * Похож ли плейлист на список каналов.
	 *
	 * По имени компонента опознаются только знакомые плагины, а их
	 * больше одного: у CUB свой раздел, и оттуда плеер открывался
	 * обычным — со шкалой перемотки на эфире и без плашки канала.
	 * Смотрим на сам список: если большинство его элементов нашлись
	 * в карте, собранной из ответов с каналами, — это каналы. Список
	 * серий там не найдётся никогда: названия у него свои.
	 */
	function iptvLooksLikeChannels(list) {
		if (!list || list.length < 2) return false;
		var known = 0;
		for (var i = 0; i < list.length; i++) {
			if (iptvKnownChannel(list[i])) known++;
		}
		return known >= 2 && known * 10 >= list.length * 6;
	}

	// Адрес чужой телепрограммы, если канал приехал не от нашего
	// плагина.
	function iptvChannelEpgBase(elem) {
		if (!elem) return '';
		if (elem.epg_base) return String(elem.epg_base);
		var name = String(elem.title || elem.name || '').toLowerCase().trim();
		if (name && iptvEpgBaseByName[name]) return iptvEpgBaseByName[name];
		var url = iptvUrlKey(elem.url);
		return url && iptvEpgBaseByUrl[url] ? iptvEpgBaseByUrl[url] : '';
	}

	/**
	 * Где у этого списка лежит телепрограмма.
	 *
	 * У плагина CUB своя нумерация каналов и своя программа: список
	 * приезжает с `/api/iptv/lampa`, передачи — с
	 * `/api/iptv/program/<id>/<время>`, и номер там свой (`id`), а
	 * `tvg.id` — номер провайдера, по которому отвечает уже наш сервер.
	 * Спросить чужой номер у нашего сервера значит промахнуться молча,
	 * поэтому вместе с номером запоминаем и адрес.
	 */
	function iptvEpgBaseFor(url) {
		var m = String(url || '').match(/^(https?:\/\/[^/]+)\/api\/iptv\//i);
		return m ? m[1] + '/api/iptv/program/' : '';
	}

	// Архив канала. Отдаём то, что пришло вместе со списком: тип
	// подстановки, на сколько дней назад и запасной адрес. Ничего из
	// этого не выдумываем — промахнувшаяся ссылка архива выглядит как
	// сломанный канал.
	function iptvChannelCatchup(elem) {
		if (!elem) return null;
		if (elem.catchup && typeof elem.catchup === 'object') return elem.catchup;
		var name = String(elem.title || elem.name || '').toLowerCase().trim();
		if (name && iptvCatchupByName[name]) return iptvCatchupByName[name];
		var url = iptvUrlKey(elem.url);
		return url && iptvCatchupByUrl[url] ? iptvCatchupByUrl[url] : null;
	}

	// Список каналов плагин **не хранит** — берёт с сервера на каждый
	// заход и держит в памяти. Поэтому подсматриваем его ответы: где бы
	// он ни взял плейлист, у нас будет та же таблица «название → номер».
	// Номер здесь — `tvg-id` из m3u вида `ch001`, по нему и спрашивается
	// телепрограмма.
	function iptvHarvest(result, base, source) {
		if (!result || typeof result !== 'object') return;
		base = base || '';
		var list = result.items || result.channels ||
			(typeof result.length === 'number' ? result : null);
		if (!list || !list.length || list.length < 2) return;
		var added = 0;
		[].slice.call(list).forEach(function (ch) {
			if (!ch || typeof ch !== 'object') return;
			// У чужой ручки спрашивают её же номером: `tvg.id` там —
			// номер провайдера, и чужому серверу он ничего не говорит.
			var id = base
				? (ch.id || ch.channel_id || (ch.tvg && ch.tvg.id))
				: ((ch.tvg && ch.tvg.id) || ch.channel_id || ch.id);
			if (!id) return;
			var key = ch.name ? String(ch.name).toLowerCase().trim() : '';
			if (!key && !ch.url) return;
			var cat = ch.catchup && typeof ch.catchup === 'object' &&
				(ch.catchup.type || ch.catchup.source || ch.catchup.days)
				? ch.catchup : null;
			// Запись без адреса не должна перебивать запись с адресом:
			// первый заход в хранилища случается раньше, чем поднимется
			// Lampa, домен CUB тогда ещё не известен — и канал остался
			// бы без программы навсегда.
			if (key && !(!base && iptvEpgBaseByName[key])) {
				iptvIdByName[key] = id;
				var g = iptvGroupName(ch.group);
				if (g) iptvGroupByName[key] = g;
				if (cat) iptvCatchupByName[key] = cat;
				iptvEpgBaseByName[key] = base;
			}
			if (ch.url && !(!base && iptvEpgBaseByUrl[iptvUrlKey(ch.url)])) {
				var ukey = iptvUrlKey(ch.url);
				iptvIdByUrl[ukey] = id;
				if (cat) iptvCatchupByUrl[ukey] = cat;
				iptvEpgBaseByUrl[ukey] = base;
				if (ch.name) iptvNameByUrl[ukey] = String(ch.name);
				var logo = ch.logo || ch.icon || ch.img ||
					(ch.tvg && ch.tvg.logo);
				if (logo) iptvLogoByUrl[ukey] = String(logo);
			}
			added++;
		});
		if (added) {
			console.log('[LampaBS] iptv: поймали список каналов,', added,
				'номеров; всего в карте', Object.keys(iptvIdByName).length);
		}
		// Тот же список, но готовыми элементами плейлиста и в порядке
		// провайдера — по нему собираются соседи открытого канала.
		var entries = [];
		[].slice.call(list).forEach(function (ch) {
			var e = iptvChannelEntry(ch, base);
			if (e) entries.push(e);
		});
		if (entries.length > 1) iptvLists[source || base || 'net'] = entries;
	}

	// Атрибуты архива из строки m3u. `tvg-rec="N"` — старая запись того
	// же самого: архив на N дней подстановкой по умолчанию.
	function iptvReadCatchup(line) {
		var type = (line.match(/catchup="([^"]*)"/) || [])[1] || '';
		var days = (line.match(/catchup-days="(\d+)"/) || [])[1] || '';
		var source = (line.match(/catchup-source="([^"]*)"/) || [])[1] || '';
		if (!type && !source) {
			var rec = (line.match(/tvg-rec="(\d+)"/) || [])[1];
			if (rec) { type = 'default'; days = rec; }
		}
		if (!type && !source && !days) return null;
		return { type: type, days: days, source: source };
	}

	// Разбор m3u: `tvg-id` и есть номер канала, а название стоит после
	// запятой в той же строке. Ссылка — следующая строка без решётки.
	function iptvHarvestM3u(text) {
		var lines = String(text).split('\n');
		var pending = null;
		var added = 0;
		// Заголовок m3u может задать архив сразу всем — но берут его
		// только каналы с `catchup-enable="1"`, так же считает и плагин.
		var header = null;
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i].trim();
			if (!line) continue;
			if (line.indexOf('#EXTM3U') === 0) {
				header = iptvReadCatchup(line);
			} else if (line.indexOf('#EXTGRP:') === 0) {
				// Раздел бывает отдельной строкой, а не атрибутом.
				// Стоит она после `#EXTINF`, поэтому дописываем её в
				// уже разобранный канал.
				if (pending && !pending.group) {
					pending.group = line.slice('#EXTGRP:'.length).trim();
				}
			} else if (line.indexOf('#EXTINF:') === 0) {
				var id = (line.match(/tvg-id="([^"]*)"/) || [])[1] || '';
				var group = (line.match(/group-title="([^"]*)"/) || [])[1] || '';
				var logo = (line.match(/tvg-logo="([^"]*)"/) || [])[1] || '';
				var name = line.slice(line.lastIndexOf(',') + 1).trim();
				var catchup = iptvReadCatchup(line);
				if (!catchup && header && line.indexOf('catchup-enable="1"') !== -1) {
					catchup = header;
				}
				pending = id
					? { id: id, name: name, group: group, logo: logo, catchup: catchup }
					: null;
			} else if (line.charAt(0) !== '#') {
				if (pending) {
					var key = pending.name.toLowerCase().trim();
					if (key) {
						iptvIdByName[key] = pending.id;
						if (pending.group) iptvGroupByName[key] = pending.group;
						if (pending.catchup) iptvCatchupByName[key] = pending.catchup;
					}
					var mkey = iptvUrlKey(line);
					iptvIdByUrl[mkey] = pending.id;
					if (pending.catchup) iptvCatchupByUrl[mkey] = pending.catchup;
					if (pending.name) iptvNameByUrl[mkey] = pending.name;
					if (pending.logo) iptvLogoByUrl[mkey] = pending.logo;
					added++;
				}
				pending = null;
			}
		}
		if (added) {
			console.log('[LampaBS] iptv: разобран m3u,', added,
				'каналов; всего в карте', Object.keys(iptvIdByName).length);
		}
	}

	// Ищем массив каналов где угодно в ответе: у разных путей плагина
	// он лежит то в `items`, то в `channels`, то прямо в корне.
	function iptvFindChannels(node, depth) {
		depth = depth || 0;
		if (!node || depth > 3) return null;
		if (Object.prototype.toString.call(node) === '[object Array]') {
			var seen = 0, chans = 0;
			for (var i = 0; i < Math.min(node.length, 10); i++) {
				var x = node[i];
				if (!x || typeof x !== 'object') continue;
				seen++;
				// Серия среди элементов — весь список не каналы, и
				// смотреть остальные незачем.
				if (iptvElemLooksSeries(x)) return null;
				if (iptvElemLooksChannel(x)) chans++;
			}
			// Большинство, а не один: случайный объект с `tvg` внутри
			// чужого ответа списком каналов не делает.
			return (chans >= 2 && chans * 2 >= seen) ? node : null;
		}
		if (typeof node === 'object') {
			for (var k in node) {
				if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
				var found = iptvFindChannels(node[k], depth + 1);
				if (found) return found;
			}
		}
		return null;
	}

	// Слушаем сам XHR, а не jQuery и не `Lampa.Reguest`: у Reguest нет
	// прототипного `silent` (методы свои у каждого объекта), так что
	// патч по прототипу не срабатывает вовсе — на этом сгорела 850.
	// Через XHR же проходит всё, чем бы плагин ни ходил.
	try {
		var XHR = window.XMLHttpRequest;
		if (XHR && XHR.prototype && !XHR.prototype.__lampabs) {
			var xhrOpen = XHR.prototype.open;
			var xhrSend = XHR.prototype.send;
			XHR.prototype.open = function (method, url) {
				try { this.__lampabs_url = url; } catch (e) {}
				return xhrOpen.apply(this, arguments);
			};
			XHR.prototype.send = function () {
				var self = this;
				try {
					this.addEventListener('load', function () {
						try { iptvSniff(self); } catch (e) {}
					});
				} catch (e) {}
				return xhrSend.apply(this, arguments);
			};
			XHR.prototype.__lampabs = true;
		}
	} catch (e) {
		console.log('[LampaBS] iptv sniff failed', e);
	}

	function iptvSniff(xhr) {
		var text = '';
		try {
			if (xhr.responseType && xhr.responseType !== 'text') return;
			text = xhr.responseText || '';
		} catch (e) { return; }
		iptvSniffText(text, xhr.__lampabs_url);
	}

	function iptvSniffText(text, url) {
		if (!text) return;
		// Дешёвые проверки: чужие ответы дальше не разбираем.
		if (text.indexOf('#EXTM3U') !== -1) { iptvHarvestM3u(text); return; }
		if (text.indexOf('tvg') === -1) return;
		var first = text.charAt(0);
		if (first !== '{' && first !== '[') return;
		var data = null;
		try { data = JSON.parse(text); } catch (e) { return; }
		var list = iptvFindChannels(data);
		if (list) iptvHarvest({ items: list }, iptvEpgBaseFor(url));
	}

	// Через XHR ходит `Lampa.Reguest`, а плагин CUB тянет свой список
	// `fetch`ем — слушаем оба. Тело у ответа отдаётся **один раз**,
	// поэтому читаем клон: вычитав оригинал, мы отняли бы ответ у того,
	// кто его запрашивал.
	try {
		if (typeof window.fetch === 'function' && !window.fetch.__lampabs_iptv) {
			var baseFetch = window.fetch;
			var patchedFetch = function (input, init) {
				var url = typeof input === 'string'
					? input
					: (input && input.url) || '';
				var p = baseFetch.apply(this, arguments);
				try {
					p.then(function (res) {
						try {
							res.clone().text().then(function (text) {
								try { iptvSniffText(text, url); } catch (e) {}
							})['catch'](function () {});
						} catch (e) {}
					})['catch'](function () {});
				} catch (e) {}
				return p;
			};
			patchedFetch.__lampabs_iptv = true;
			window.fetch = patchedFetch;
		}
	} catch (e) {
		console.log('[LampaBS] iptv fetch sniff failed', e);
	}

	/**
	 * Собрать карту каналов из хранилищ плагинов.
	 *
	 * Ходить по сети плагин может ровно один раз: список он кладёт в
	 * своё хранилище и дальше читает оттуда — перехваты XHR и `fetch`
	 * тогда не увидят ничего. Поэтому лезем в хранилища сами.
	 *
	 * `force` — повторить, не дожидаясь получаса: когда карта пуста,
	 * ждать нечего, а заполниться она могла только что.
	 */
	function refreshIptvMap(force) {
		try {
			var empty = !Object.keys(iptvIdByName).length &&
				!Object.keys(iptvIdByUrl).length;
			var wait = (force || empty) ? 10 * 1000 : 30 * 60 * 1000;
			if (Date.now() - iptvMapAt < wait) return;
			iptvMapAt = Date.now();
			iptvReadLocalStorage();
			iptvReadDatabases();
		} catch (e) {
			console.log('[LampaBS] iptv map failed', e);
		}
	}

	/** Похоже ли имя базы или ключа на «тут лежат каналы». */
	function iptvNameLooksIptv(name) {
		var n = String(name || '').toLowerCase();
		return n.indexOf('iptv') !== -1 || n.indexOf('channel') !== -1 ||
			n.indexOf('playlist') !== -1 || n.indexOf('_tv') !== -1 ||
			n.indexOf('tv_') !== -1;
	}

	/**
	 * Адрес программы для базы. У CUB он выводится из домена, который
	 * держит сама Lampa: домен переезжает зеркалами, и вторая копия их
	 * списка нам не нужна.
	 */
	function iptvCubBase() {
		try {
			var d = Lampa.Manifest && Lampa.Manifest.cub_domain;
			if (!d) return '';
			return 'http://' + String(d).replace(/^https?:\/\//, '')
				.replace(/\/+$/, '') + '/api/iptv/program/';
		} catch (e) {
			return '';
		}
	}

	/** Свой плагин держит список в localStorage. */
	function iptvReadLocalStorage() {
		try {
			var LS = window.localStorage;
			if (!LS) return;
			for (var i = 0; i < LS.length; i++) {
				var key = LS.key(i);
				if (!iptvNameLooksIptv(key)) continue;
				var raw = LS.getItem(key);
				// Короткое — это настройка, а не список каналов.
				if (!raw || raw.length < 200) continue;
				var first = raw.charAt(0);
				if (first !== '{' && first !== '[') continue;
				var data = null;
				try { data = JSON.parse(raw); } catch (e) { continue; }
				var list = iptvFindChannels(data);
				if (list) iptvHarvest({ items: list }, '', 'ls:' + key);
			}
		} catch (e) {
			console.log('[LampaBS] iptv localStorage failed', e);
		}
	}

	/**
	 * Плагины держат список в IndexedDB. Базу открываем **сами**, а не
	 * через `Lampa.DB`: у неё соединение поднимается отдельным
	 * `openDatabase()`, а `getData` без него молча уходит в reject, да
	 * и конструктор требует номер версии — назови мы чужую, открытие
	 * свалится с VersionError. Открытие без версии берёт базу как есть.
	 */
	function iptvReadDatabases() {
		try {
			var Base = window.indexedDB || window.webkitIndexedDB;
			if (!Base || !Base.databases) return;
			Base.databases().then(function (list) {
				(list || []).forEach(function (info) {
					var name = info && info.name;
					if (!name || !iptvNameLooksIptv(name)) return;
					// База CUB без известного домена бесполезна: номер
					// оттуда спрашивается только у их же сервера, а
					// адрес до загрузки бандла ещё не известен. Лучше
					// пропустить и вернуться следующим заходом, чем
					// запомнить канал без адреса.
					var base = name.indexOf('cub') !== -1 ? iptvCubBase() : '';
					if (name.indexOf('cub') !== -1 && !base) return;
					iptvReadOneDatabase(Base, name, base);
				});
			})['catch'](function () {});
		} catch (e) {
			console.log('[LampaBS] iptv databases failed', e);
		}
	}

	function iptvReadOneDatabase(Base, name, base) {
		var req = Base.open(name);
		req.onerror = function () {
			console.log('[LampaBS] iptv: база', name, 'не открылась');
		};
		req.onsuccess = function () {
			var db = req.result;
			try {
				var stores = [];
				for (var i = 0; i < db.objectStoreNames.length; i++) {
					var s = db.objectStoreNames[i];
					if (iptvNameLooksIptv(s)) stores.push(s);
				}
				if (!stores.length) { db.close(); return; }
				var left = stores.length;
				stores.forEach(function (store) {
					var recs = {};
					var tx = db.transaction([store], 'readonly');
					var cur = tx.objectStore(store).openCursor();
					cur.onsuccess = function (e) {
						var c = e.target.result;
						if (c) {
							recs[String(c.key)] = c.value;
							c['continue']();
							return;
						}
						try { iptvUseRecords(name, store, recs, base); } catch (err) {}
						if (--left === 0) db.close();
					};
					cur.onerror = function () {
						if (--left === 0) db.close();
					};
				});
			} catch (e) {
				console.log('[LampaBS] iptv: база', name, 'не читается', e);
				try { db.close(); } catch (err) {}
			}
		};
	}

	/**
	 * Разобрать записи хранилища.
	 *
	 * Плейлистов там несколько, а открыт один — его ключ лежит
	 * отдельной записью `active`. Читая все подряд, мы смешаем каналы
	 * вчерашнего списка с сегодняшним.
	 */
	function iptvUseRecords(dbName, store, recs, base) {
		var unwrap = function (rec) {
			return rec && typeof rec === 'object' && 'value' in rec ? rec.value : rec;
		};
		var keys = Object.keys(recs);
		var activeKey = '';
		if (recs.active !== undefined) {
			var a = unwrap(recs.active);
			if (a !== null && typeof a !== 'object') activeKey = String(a);
		}
		if (activeKey && recs[activeKey] !== undefined) keys = [activeKey];
		var found = 0;
		keys.forEach(function (k) {
			if (k === 'active') return;
			var list = iptvFindChannels(unwrap(recs[k]));
			if (!list) return;
			found += list.length;
			iptvHarvest({ items: list }, base, dbName + ':' + k);
		});
		if (found) {
			console.log('[LampaBS] iptv: из базы', dbName + '/' + store,
				'взято каналов', found,
				activeKey ? ('(открыт плейлист ' + activeKey + ')') : '');
		}
	}

	function iptvSurvey() {
		try {
			var Base = window.indexedDB || window.webkitIndexedDB;
			if (!Base || !Base.databases) {
				console.log('[LampaBS] iptv survey: список баз недоступен');
				return;
			}
			Base.databases().then(function (list) {
				var names = (list || []).map(function (d) { return d.name; });
				console.log('[LampaBS] iptv survey: базы —', names.join(' | '));
				names.forEach(function (n) {
					if (!/tv|iptv|skaz|channel|playlist/i.test(String(n))) return;
					var r = Base.open(n);
					r.onsuccess = function () {
						var db = r.result;
						try {
							var stores = Array.prototype.slice.call(db.objectStoreNames);
							stores.forEach(function (st) {
								try {
									var c = db.transaction([st], 'readonly').objectStore(st).count();
									c.onsuccess = function () {
										console.log('[LampaBS] iptv survey:', n + '/' + st, '=', c.result);
									};
								} catch (e) {}
							});
						} catch (e) {}
						setTimeout(function () { try { db.close(); } catch (e) {} }, 4000);
					};
				});
			})['catch'](function () {});
		} catch (e) {
			console.log('[LampaBS] iptv survey failed', e);
		}
	}

	// Карта нужна **до** первого запуска канала: плейлист уходит в
	// плеер один раз, и дописать в него номера задним числом уже
	// нельзя. Поэтому собираем её и на старте приложения, и на каждом
	// открытии любого раздела — сама она стоит одного чтения из базы
	// раз в полчаса, а привязка к списку компонентов подводит: у
	// каналов компонент может называться иначе, чем мы ждём.
	try {
		Lampa.Listener.follow('app', function (e) {
			// Три захода с растущей паузой: хранилища заполняются не
			// на старте, а когда человек первый раз откроет раздел с
			// каналами, и первый заход застаёт их пустыми.
			if (e.type !== 'ready') return;
			[3000, 15000, 60000].forEach(function (ms) {
				setTimeout(function () { refreshIptvMap(true); }, ms);
			});
		});
		Lampa.Listener.follow('activity', function (e) {
			try {
				if (e.type !== 'start') return;
				refreshIptvMap();
			} catch (err) {}
		});
	} catch (e) {
		console.log('[LampaBS] iptv listener failed', e);
	}

	window.__lampabsEnrichPlayer = function (data) {
		try {
			if (!data || typeof data !== 'object') return data;
			var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
			var activeCard = act && (act.card || act.movie);
			var hasId = data.card && (data.card.id || data.card.card_id);
			if (!hasId && activeCard && (activeCard.id || activeCard.card_id)) {
				data.card = activeCard;
			}
			// Даже если data.card уже задана — Lampa часто пробрасывает
			// куцый вариант {id, title, img}, а нам для WatchNext на
			// Google TV Home нужен `backdrop_path` (landscape 16:9),
			// плюс original_title/name для правильного hash серий.
			// Мёрджим недостающие поля из active card, НЕ трогая уже
			// заданные — приоритет за тем что явно передал openPlayer.
			if (data.card && activeCard && data.card !== activeCard) {
				['backdrop_path', 'backdrop', 'poster_path',
					'original_title', 'original_name', 'overview',
					'release_date', 'first_air_date', 'vote_average'
				].forEach(function (k) {
					if (!data.card[k] && activeCard[k]) data.card[k] = activeCard[k];
				});
			}

			// Канальный режим плеера — своё поле, а не `data.iptv`.
			// Тот флаг ставят и онлайн-плагины (trailers.js,
			// rutube_orig.js): им он нужен, чтобы Lampa не крутила
			// рекламу и не рисовала карточку, а каналов там нет вовсе.
			// Отличаем по тому, откуда открыли: список каналов живёт в
			// своём компоненте. Плагин может поставить поле и сам —
			// тогда мы его не трогаем.
			try {
				if (typeof data.lampabs_iptv === 'undefined') {
					var comp = (act && act.component) || '';
					// Запись из архива приходит из того же раздела и с
					// тем же именем компонента, но БЕЗ `tv` и с
					// `need_check_live_stream`. Принять её за эфир —
					// значит отобрать у получасовой передачи шкалу и
					// перемотку. Флаг надёжный: и в нашем `tv.js`, и у
					// CUB он ставится ровно в одном месте — в разборе
					// архива.
					data.lampabs_iptv = data.need_check_live_stream !== true &&
						!iptvPlaylistLooksSeries(data.playlist) && (
						iptvComponentIsTv(comp) ||
						data.tv === true ||
						iptvPlaylistSaysTv(data.playlist) ||
						iptvLooksLikeChannels(data.playlist)
					);
				}
				// Номер канала — прямо в элемент плейлиста, а не
				// отдельным массивом: элементы по дороге фильтруются
				// (разделители, элементы без ссылки), и параллельный
				// массив разъехался бы с ними на первом же таком.
				// Спрашивать программу плеер будет сам.
				if (data.lampabs_iptv) {
					// Сколько каналов удалось опознать — уезжает в
					// отчёт о плеере: по нему сразу видно, собралась
					// карта или нет.
					data.lampabs_iptv_map = Object.keys(iptvIdByName).length;
					// Соседей плагин мог не дать вовсе: CUB отдаёт их
					// функцией, а она через мост не проходит. Собираем
					// сами из его же списка.
					if (!data.playlist || data.playlist.length < 2) {
						var near = iptvNeighbours(data.url, 300);
						if (near) data.playlist = near;
					}
					if (!data.lampabs_iptv_map) {
						// Карта пуста — плагин держит каналы не там, где
						// мы ищем. Разведка печатает, какие базы вообще
						// есть: иначе искать пришлось бы вслепую, по
						// одной сборке на догадку.
						refreshIptvMap(true);
						iptvSurvey();
					}
				}
				if (data.lampabs_iptv && data.playlist && data.playlist.length) {
					// Что вообще лежит в элементе — печатаем один раз,
					// когда номер так и не нашёлся: искать поле, которое
					// можно взять за ключ, иначе не по чему.
					var first = data.playlist[0];
					if (first && !iptvChannelId(first)) {
						console.log('[LampaBS] iptv: элемент плейлиста —',
							Object.keys(first).join(','), '| url:', first.url,
							'| logo:', first.thumbnail || first.img || first.logo);
					}
					data.playlist.forEach(function (el) {
						if (!el) return;
						if (!el.channel_id) {
							var id = iptvChannelId(el);
							if (id) el.channel_id = id;
						}
						// Раздел канала — строкой над названием.
						if (!el.group) {
							var g = iptvChannelGroup(el);
							if (g) el.group = g;
						}
						// Название и логотип: плагин CUB присылает
						// канал без них вовсе, а список у нас к этому
						// моменту полный. Плашка обязана показать имя
						// канала — взять его больше негде.
						var ukey = iptvUrlKey(el.url);
						if (!el.title && !el.name && iptvNameByUrl[ukey]) {
							el.title = iptvNameByUrl[ukey];
						}
						if (!el.img && !el.thumbnail && !el.poster &&
							!el.logo && !el.icon && iptvLogoByUrl[ukey]) {
							el.logo = iptvLogoByUrl[ukey];
						}
						// Чужая телепрограмма: у плагина CUB своя
						// нумерация и своя ручка, и спрашивать её
						// номером у нашего сервера бессмысленно.
						var eb = iptvChannelEpgBase(el);
						if (eb && !el.epg_base) el.epg_base = eb;
						// Архив: тип подстановки, глубина и запасной
						// адрес. Плеер по ним соберёт ссылку на
						// прошедшую передачу из телепрограммы.
						var c = iptvChannelCatchup(el);
						if (c) {
							if (!el.catchup_type && c.type) el.catchup_type = c.type;
							if (!el.catchup_days && c.days) el.catchup_days = String(c.days);
							if (!el.catchup_source && c.source) el.catchup_source = c.source;
						}
					});
				}
				// Одна строка на открытие канала. Снаружи «плашка
				// пустая» одинаково выглядит и когда номер не нашёлся,
				// и когда название не пришло, и когда плейлист приедет
				// позже — а чинится это по-разному.
				if (data.lampabs_iptv) {
					var self = (data.playlist || []).filter(function (el) {
						return el && iptvUrlKey(el.url) === iptvUrlKey(data.url);
					})[0] || {};
					console.log('[LampaBS] канал: название «' +
						(self.title || data.title || '—') + '», номер ' +
						(self.channel_id || '—') + ', раздел ' +
						(self.group || '—') + ', логотип ' +
						(self.logo || self.img || self.thumbnail ? 'есть' : 'нет') +
						', в плейлисте ' + ((data.playlist || []).length) +
						', в карте ' + (data.lampabs_iptv_map || 0));
				}
			} catch (e) {
				console.log('[LampaBS] iptv detect failed', e);
			}

			// Обложка и логотип для экрана загрузки плеера. Карточка с
			// `images` есть только там, где её запрашивали целиком
			// (`append_to_response=…,images`), поэтому смотрим и в
			// payload, и в активную карточку — в куцем варианте от
			// онлайн-плагина логотипов не бывает.
			try {
				var deep = (activeCard && typeof activeCard === 'object') ? activeCard : {};
				var own = data.card || {};
				var box = (own.images && own.images.logos) ? own.images
					: ((deep.images && deep.images.logos) ? deep.images : null);
				var logoPath = pickLogoPath(box && box.logos);
				// Половина логотипов у TMDB лежит в `.svg`, а загрузчик
				// картинок плеера векторов не понимает. Просим то же
				// самое в png — TMDB отдаёт растр по смене расширения,
				// так же делает наш плагин logo.js в самой Lampa.
				if (logoPath) {
					data.lampabs_logo = tmdbImage(logoPath.replace(/\.svg$/i, '.png'), 'w500');
				}
				// `w1280`, а не `original`: у TMDB оригинал бывает 3840
				// пикселей и несколько мегабайт, и качаются они ровно
				// тогда, когда канал занят раскачкой торрента. На экране
				// разницы не видно — плеер всё равно уменьшит.
				var backPath = own.backdrop_path || deep.backdrop_path || '';
				if (backPath) data.lampabs_backdrop = tmdbImage(backPath, 'w1280');
				// Обложки в карточке нет — берём готовую ссылку, какая
				// есть. У онлайн-плагинов это картинка серии, и она
				// лучше пустого экрана. Тот же порядок, что у самой
				// Lampa в `mediaData`.
				if (!data.lampabs_backdrop) {
					data.lampabs_backdrop = own.background_image || own.background ||
						data.background || data.img || data.thumbnail || '';
				}
			} catch (e) {}

			// Аккаунт CUB для ИИ-глав. Разбор фильма по главам делает
			// и оплачивает CUB, отдаёт только залогиненному, и ходит
			// за ним сам плеер (см. CubAiChapters) — ему нужен токен
			// зрителя. Своего ключа у нас тут нет и быть не должно:
			// APK лежит в открытом релизе.
			//
			// Номер тайтла, сезон и серию не передаём: нативная
			// сторона уже считает их для меток (extractCardRef).
			// Разбор у них платный: без премиума ручка ответит отказом,
			// и строка в меню была бы мёртвой. Премиум смотрим у
			// Account.Permit — там же, где его смотрит сама Lampa.
			try {
				var acc = Lampa.Storage.get('account', '{}') || {};
				var permit = Lampa.Account.Permit || {};
				var premium = !!((permit.user && permit.user.premium) || acc.premium);
				var accToken = acc.token || '';
				var accProfile = (acc.profile && acc.profile.id) || '';
				if (premium && accToken && Lampa.Manifest.cub_domain) {
					data.lampabs_cub = {
						domain: Lampa.Manifest.cub_domain,
						token: accToken,
						profile: String(accProfile)
					};
				}
			} catch (e) {}

			// Чем эта нарезка отличается от других того же сезона:
			// балансер и озвучка. Нужно для меток пропуска — сезонная
			// метка не смотрит на длительность (серии разной длины) и
			// без этого признака цеплялась бы к любому переводу: у
			// одной озвучки сверху своя заставка, и метки съезжают.
			//
			// Собираем здесь, а не в нативном коде, потому что в самом
			// payload'е озвучки может не оказаться: у сериала плагин
			// пишет её в translate_voice, а выбранную держит отдельно,
			// в online_choice_<балансер>. Снаружи это не достать.
			try {
				var balanser = data.balanser ||
					Lampa.Storage.get('online_balanser', '') || '';
				var choice = balanser
					? Lampa.Storage.get('online_choice_' + balanser, {})
					: {};
				var voice = data.translate_voice || data.voice_name ||
					(choice && choice.voice_name) || '';
				var src = (String(balanser) + String(voice))
					.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
				if (src) data.lampabs_source = src;
			} catch (e) {}

			// Гарантируем timeline.hash для каждой серии в playlist —
			// DDD во время просмотра рапортует прогресс обратно в Lampa
			// через `Lampa.Timeline.update({hash, percent, time, duration})`,
			// и без hash серия просто не помечается как просмотренная.
			// Онлайн-плагины обычно проставляют timeline только для
			// активной серии (той, откуда запустили) — а нам нужен
			// hash для ВСЕХ серий, чтобы автопереход + просмотр
			// последующих тоже попадал в timeline.
			//
			// Формула hash'а совпадает с той, что используют
			// LostFilm/HDVB и большинство сериальных плагинов Lampa:
			//   Utils.hash([season, season > 10 ? ':' : '', episode,
			//               original_title].join(''))
			// Для сериалов season/episode берём из элемента playlist
			// (у HDVB это s/e/season/episode), original_title — из card
			// на верхнем уровне.
			//
			// **Хэш должен быть у каждой серии свой.** Отметка
			// «просмотрено» — это процент, записанный по хэшу, и Lampa
			// красит зелёным всякую серию с таким же. Значит один хэш
			// на весь список означает зелёный сезон после одной серии,
			// и именно так это и выглядело у торрентов: там серия с
			// номером распознаётся не всегда, и формула давала всем
			// одно и то же.
			//
			// Поэтому сначала считаем, потом смотрим на дубли — и если
			// хоть один повторился, не проставляем **ничего**: значит
			// эти поля в этом источнике серию не опознают, и врать
			// пометкой хуже, чем не поставить её вовсе.
			try {
				var pl = data.playlist;
				if (Lampa.Utils && Lampa.Timeline && Array.isArray(pl) && pl.length) {
					var origTitle = (data.card && (data.card.original_title || data.card.title)) ||
						data.original_title || data.title || '';
					var planned = [];
					var seen = {};
					var dup = false;
					pl.forEach(function (elem) {
						if (!elem || typeof elem !== 'object') return;
						if (elem.timeline && elem.timeline.hash) {
							// Чужой хэш уже стоит — он же занимает место
							// в проверке: наш новый не должен с ним
							// совпасть.
							seen[elem.timeline.hash] = (seen[elem.timeline.hash] || 0) + 1;
							if (seen[elem.timeline.hash] > 1) dup = true;
							return;
						}
						var s = elem.season || elem.s;
						var e = elem.episode || elem.e || elem.episode_id;
						if (!s || !e || !origTitle) return;
						try {
							var hashInput = [s, s > 10 ? ':' : '', e, origTitle].join('');
							var h = Lampa.Utils.hash(hashInput);
							seen[h] = (seen[h] || 0) + 1;
							if (seen[h] > 1) dup = true;
							planned.push({ elem: elem, hash: h });
						} catch (_) {}
					});
					if (dup) {
						console.log('[LampaBS] timeline: у', planned.length,
							'серий хэш повторяется — не проставляем, иначе' +
							' одна серия покрасит весь сезон');
					} else {
						planned.forEach(function (rec) {
							try {
								rec.elem.timeline = Lampa.Timeline.view(rec.hash);
							} catch (_) {}
						});
					}
					pl.forEach(function (elem) {
						if (!elem || typeof elem !== 'object') return;
						refreshTimeline(elem);
						registerPlayCallback(elem);
					});
				}
			} catch (_) {}
			// Сам стартовый элемент в playlist тоже входит, но на всякий
			// случай (плейлист из одной серии его туда не кладёт).
			refreshTimeline(data);
			registerPlayCallback(data);
			// Итог: с какой секунды и по какому хэшу стартуем. Одна
			// строка в консоли — сравнить с тем, что потом рапортует
			// плеер (logcat: timeCall hash=…).
			// TorrServer Basic-Auth в data.headers для DDD. Lampa при
			// внешнем плеере пробрасывает URL стрима, но НЕ auth (в web-
			// плеере она инжектит его в свой fetch напрямую). Для нашего
			// piece-dots polling'а /cache под auth — 401 без него.
			// Кладём Authorization: Basic base64(login:pass), тогда и
			// GET /stream у ExoPlayer'а поедет с auth (для конфигов, где
			// стрим тоже под auth), и наш POST /cache пройдёт.
			try {
				var url = data.url || '';
				var looksTorr = /\/stream(\/|\?)/i.test(url) &&
					(/[?&]link=/i.test(url) || /[?&]hash=/i.test(url));
				if (looksTorr && Lampa.Storage.get('torrserver_auth', false)) {
					var login = Lampa.Storage.field('torrserver_login') || '';
					var pass = Lampa.Storage.field('torrserver_password') || '';
					if (login || pass) {
						var basic = 'Basic ' + btoa(login + ':' + pass);
						if (!data.headers || typeof data.headers !== 'object') data.headers = {};
						// Не затираем: если плагин почему-то поставил свой
						// Authorization — пусть выигрывает он.
						if (!data.headers.Authorization && !data.headers.authorization) {
							data.headers.Authorization = basic;
						}
					}
				}
			} catch (_) {}
		} catch (e) {}
		return data;
	};

	// Мост navigator.mediaSession → нативной шторки Android.
	//
	// Ключевой факт: в Android WebView `navigator.mediaSession` НЕТ
	// (в Chrome for Android есть — это разные ветки Chromium). Даже
	// самый свежий System WebView не сурфейсит его в JS. Поэтому
	// перехват не сработает — мы подменяем API целиком полифиллом:
	// плагин пишет `navigator.mediaSession.metadata = ...` в свой
	// объект, мы триггерим AndroidJS.mediaSessionUpdate, кнопки из
	// шторки прилетают через __lampabsMediaAction в handler'ы,
	// зарегистрированные плагином через setActionHandler.
	//
	// Заодно шимим `MediaMetadata` — в WebView конструктора тоже нет,
	// а плагины пишут `new MediaMetadata({...})`. Наш shim — простой
	// контейнер, поля читаются в setter'е.
	(function () {
		var hasNativeMS = 'mediaSession' in navigator;
		var hasMetaCtor = typeof window.MediaMetadata === 'function';
		if (typeof AndroidJS === 'undefined' ||
			typeof AndroidJS.mediaSessionUpdate !== 'function') {
			console.log('[LampaBS media] AndroidJS.mediaSessionUpdate unavailable — bridge OFF');
			return;
		}

		var handlers = {};
		var lastMeta = null;
		var lastState = null;
		var lastPosition = null;
		var flushT = 0;

		function scheduleFlush() {
			if (flushT) return;
			flushT = setTimeout(function () { flushT = 0; flush(); }, 30);
		}
		function flush() {
			if (!lastMeta && lastState !== 'playing' && lastState !== 'paused') return;
			try {
				var title = (lastMeta && lastMeta.title) || 'Музофонд';
				var artist = (lastMeta && lastMeta.artist) || '';
				var art = '';
				if (lastMeta && lastMeta.artwork && lastMeta.artwork.length) {
					art = lastMeta.artwork[0].src || '';
				}
				var playing = lastState !== 'paused';
				var pos = lastPosition ? Math.round((lastPosition.position || 0) * 1000) : 0;
				var dur = lastPosition ? Math.round((lastPosition.duration || 0) * 1000) : 0;
				AndroidJS.mediaSessionUpdate(title, artist, art, playing, pos, dur);
			} catch (e) { console.log('[LampaBS media] flush failed', e); }
		}

		// Shim MediaMetadata — контейнер, повторяющий API Chrome.
		if (!hasMetaCtor) {
			window.MediaMetadata = function (init) {
				init = init || {};
				this.title = init.title || '';
				this.artist = init.artist || '';
				this.album = init.album || '';
				this.artwork = init.artwork || [];
			};
		}

		var shim = {
			get metadata() { return lastMeta && lastMeta._raw; },
			set metadata(v) {
				lastMeta = v ? {
					title: v.title, artist: v.artist,
					album: v.album, artwork: v.artwork,
					_raw: v,
				} : null;
				scheduleFlush();
			},
			get playbackState() { return lastState || 'none'; },
			set playbackState(v) {
				lastState = v;
				if (v === 'none') {
					try { AndroidJS.mediaSessionEnd(); } catch (e) {}
					lastMeta = null; lastPosition = null;
				} else {
					scheduleFlush();
				}
			},
			setActionHandler: function (action, handler) {
				if (handler) handlers[action] = handler;
				else delete handlers[action];
			},
			setPositionState: function (s) {
				lastPosition = s ? {
					duration: s.duration,
					position: s.position,
					playbackRate: s.playbackRate,
				} : null;
				scheduleFlush();
			},
		};

		// В WebView navigator обычно не frozen — прямое присваивание
		// работает. Если вдруг оно поднято до getter-only, пробуем
		// defineProperty (сработает если свойство configurable).
		try { navigator.mediaSession = shim; }
		catch (e) {
			try {
				Object.defineProperty(navigator, 'mediaSession', {
					value: shim, writable: true, configurable: true,
				});
			} catch (e2) {
				console.log('[LampaBS media] cannot install shim on navigator', e, e2);
				return;
			}
		}
		if (navigator.mediaSession !== shim) {
			console.log('[LampaBS media] shim assignment silently rejected — trying defineProperty');
			try {
				Object.defineProperty(navigator, 'mediaSession', {
					value: shim, writable: true, configurable: true,
				});
			} catch (e) {
				console.log('[LampaBS media] defineProperty also failed', e);
				return;
			}
		}

		// Обратный канал: клик по кнопке в шторке / нажатие BT-media —
		// нативный сервис зовёт нас с action-строкой ('play' | 'pause'
		// | 'prev' | 'next' | 'stop' | 'seek:<ms>'). Мапим на ключи,
		// которыми плагин регистрирует handler'ы.
		window.__lampabsMediaAction = function (action) {
			try {
				if (action && action.indexOf('seek:') === 0) {
					var pos = parseInt(action.slice(5), 10);
					var h = handlers['seekto'];
					if (typeof h === 'function') h({ seekTime: pos / 1000 });
					return;
				}
				var map = { prev: 'previoustrack', next: 'nexttrack' };
				var key = map[action] || action;
				var fn = handlers[key];
				if (typeof fn === 'function') fn();
			} catch (e) { console.log('[LampaBS media] action ' + action + ' failed', e); }
		};
	})();

	// Google TV Preview Channels + Home rows питаются от нашей
	// TvChannelPublisher, которую мы вызываем через AndroidJS.saveBookmarks.
	// Lampa сама зовёт saveBookmarks ТОЛЬКО после CUB-синка (updateChannels
	// в Account.Bookmarks) — локальные закладки триггерят лишь
	// AndroidJS.updateChannel(where), у нас no-op. Поэтому руками
	// подписываемся на Storage 'favorite' и на каждое изменение
	// вытаскиваем полное состояние, плющим в формат
	//   [{type: 'book|history|like|wath', data: <card>}, ...]
	// который ждёт TvChannelPublisher.groupByType.
	(function () {
		if (typeof AndroidJS === 'undefined' || typeof AndroidJS.saveBookmarks !== 'function') {
			console.log('[LampaBS bookmarks] AndroidJS.saveBookmarks unavailable — skip');
			return;
		}
		if (!Lampa.Storage || !Lampa.Storage.listener) {
			console.log('[LampaBS bookmarks] Lampa.Storage.listener missing');
			return;
		}
		var TYPES = ['book', 'history', 'like', 'wath'];

		// Проксированный URL постера: image.tmdb.org режется у части
		// пользователей (РФ провайдеры), а Lampa.TMDB.image() смотрит
		// на настройки proxy_tmdb/tmdb_proxy_image и подставляет
		// зеркало (imagetmdb.cubnotrip.top и т.п.). Native не имеет
		// доступа к настройкам WebView'а, поэтому финальный URL
		// собираем здесь.
		function posterUrl(card) {
			if (!card) return '';
			// Приоритет: относительный poster_path/backdrop_path — всегда
			// пропускаем через Lampa.TMDB.image() (это подставит прокси
			// если пользователь его включил). Готовый img используем
			// только как fallback и, если он ссылается на прямой
			// image.tmdb.org (заблокирован у части пользователей),
			// извлекаем путь и тоже прогоняем через прокси.
			var path = card.poster_path || card.backdrop_path || '';
			if (!path && card.img) {
				var m = String(card.img).match(/image\.tmdb\.org\/t\/p\/[^/]+(\/.+)$/);
				if (m) path = m[1];
			}
			if (path) {
				if (path.charAt(0) !== '/') path = '/' + path;
				try {
					if (Lampa.TMDB && typeof Lampa.TMDB.image === 'function') {
						return Lampa.TMDB.image('t/p/w500' + path);
					}
				} catch (_) {}
				return 'https://image.tmdb.org/t/p/w500' + path;
			}
			// Готовый URL, не TMDB — оставляем как есть.
			var img = card.img || '';
			if (img && (img.indexOf('http://') === 0 || img.indexOf('https://') === 0)) return img;
			return '';
		}
		// Google TV рисует плитки канала горизонтальными, а в карточке
		// Lampa из истории часто есть только вертикальный poster_path:
		// backdrop_path туда попадает не всегда. Тогда нативная сторона
		// честно переключает плитку в 2:3, и ряд получается рваным —
		// часть обложек горизонтальные, часть вертикальные.
		//
		// Недостающие backdrop'ы дотягиваем из TMDB по id карточки и
		// складываем сюда. Пустая строка тоже кэшируется: у части
		// фильмов backdrop'а нет вовсе, и переспрашивать про них
		// каждый раз незачем.
		var BACKDROPS_KEY = 'lampabs_backdrops';
		var backdrops = {};
		var backdropsBusy = false;

		function cardKey(card) {
			var isTv = card.name || card.first_air_date || card.number_of_seasons;
			return (isTv ? 'tv' : 'movie') + ':' + card.id;
		}

		/**
		 * Абсолютный URL горизонтальной обложки — через то же зеркало,
		 * что и постер.
		 *
		 * Раньше backdrop уходил в нативную часть сырым путём
		 * (`/abc.jpg`), а она склеивала его с `image.tmdb.org`. У
		 * российских провайдеров этот домен зарезан, и получалось
		 * навыворот: карточки С бэкдропом оставались пустыми плитками,
		 * а видны были только те, где бэкдропа не было и мы
		 * откатывались на постер — он-то шёл через зеркало. Отсюда ряд
		 * из вертикальных обложек вперемешку с пустотами.
		 */
		function backdropUrl(card) {
			if (!card) return '';
			var path = card.backdrop_path ||
				(card.id != null ? backdrops[cardKey(card)] : '') || '';
			path = String(path);
			if (!path) return '';
			// Уже готовая ссылка (пришла из CUB как абсолютная).
			if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0) return path;
			if (path.charAt(0) !== '/') path = '/' + path;
			try {
				if (Lampa.TMDB && typeof Lampa.TMDB.image === 'function') {
					return Lampa.TMDB.image('t/p/w1280' + path);
				}
			} catch (_) {}
			return 'https://image.tmdb.org/t/p/w1280' + path;
		}

		function withPoster(card) {
			if (!card) return card;
			var url = posterUrl(card);
			var wide = backdropUrl(card);
			if (!url && !wide) return card;
			// Копируем чтобы не менять Storage-объект по ссылке.
			var out = {};
			for (var k in card) if (Object.prototype.hasOwnProperty.call(card, k)) out[k] = card[k];
			if (url) out.img = url;
			// Поле `backdrop` нативная сторона читает раньше
			// `backdrop_path` и абсолютную ссылку не трогает.
			if (wide) out.backdrop = wide;
			return out;
		}

		/**
		 * Отдаёт нативной стороне хост зеркала картинок. Нужен там, где
		 * в нативную часть всё-таки приходит голый путь — прежде всего
		 * WatchNext, который собирается из payload'а плеера, а не из
		 * наших карточек.
		 */
		function reportImageBase() {
			if (typeof AndroidJS === 'undefined' ||
				typeof AndroidJS.setTmdbImageBase !== 'function') return;
			try {
				if (!Lampa.TMDB || typeof Lampa.TMDB.image !== 'function') return;
				// Просим известный путь и отрезаем его — так база
				// получается ровно та, что использует сама Lampa,
				// без догадок о формате прокси.
				var probe = Lampa.TMDB.image('t/p/w1280/probe.jpg');
				var cut = probe.indexOf('/t/p/');
				if (cut > 0) AndroidJS.setTmdbImageBase(probe.slice(0, cut));
			} catch (e) {
				console.log('[LampaBS bookmarks] image base report failed', e);
			}
		}

		/** Дотягивает backdrop_path для карточек, где его нет. */
		function fillBackdrops(cards) {
			if (backdropsBusy) return;
			if (!Lampa.TMDB || typeof Lampa.TMDB.api !== 'function' ||
				typeof Lampa.TMDB.key !== 'function' || !Lampa.Reguest) return;

			var todo = [];
			cards.forEach(function (c) {
				if (!c || c.id == null || c.backdrop_path) return;
				var k = cardKey(c);
				if (Object.prototype.hasOwnProperty.call(backdrops, k)) return;
				if (todo.indexOf(k) === -1) todo.push(k);
			});
			if (!todo.length) return;
			todo = todo.slice(0, 10); // по десятку за проход, ряд соберётся за пару обновлений

			backdropsBusy = true;
			var left = todo.length;
			var changed = false;
			var lang = Lampa.Storage.get('tmdb_lang', 'ru') || 'ru';

			function done() {
				if (--left > 0) return;
				backdropsBusy = false;
				try { Lampa.Storage.set(BACKDROPS_KEY, backdrops); } catch (_) {}
				if (changed) setTimeout(flushFavorite, 100);
			}

			todo.forEach(function (key) {
				var parts = key.split(':');
				var url = Lampa.TMDB.api(parts[0] + '/' + parts[1]) +
					(Lampa.TMDB.api('x').indexOf('?') > -1 ? '&' : '?') +
					'api_key=' + Lampa.TMDB.key() +
					'&language=' + encodeURIComponent(lang);
				new Lampa.Reguest().silent(url, function (json) {
					backdrops[key] = (json && json.backdrop_path) || '';
					if (backdrops[key]) changed = true;
					done();
				}, function () {
					done();
				});
			});
		}

		// Афиша проката — чем наполняем ряд, пока у пользователя нет
		// своих просмотров.
		//
		// movie/now_playing, а не trending/movie/day: на зеркале у него
		// все 20 карточек с горизонтальной обложкой (у тренда 19 из 20),
		// и содержимое объяснимо — это то, что идёт в кино сейчас.
		// Случайный «тренд дня» вызывал ровно один вопрос: откуда здесь
		// фильмы, которых я не смотрел.
		//
		// Ключ новый, не lampabs_tv_fallback: старый кэш с трендом так
		// и остался бы лежать, и первые полсуток после обновления ряд
		// показывал бы ровно то, от чего мы уходим.
		var NOW_PLAYING_KEY = 'lampabs_tv_now_playing';
		var NOW_PLAYING_AT = 'lampabs_tv_now_playing_at';
		var NOW_PLAYING_TTL = 12 * 3600 * 1000; // прокат меняется раз в неделю
		var nowPlayingBusy = false;
		var nowPlayingFailed = false;

		function refreshNowPlaying() {
			if (nowPlayingBusy || nowPlayingFailed) return;
			if (!Lampa.TMDB || typeof Lampa.TMDB.api !== 'function' ||
				typeof Lampa.TMDB.key !== 'function' || !Lampa.Reguest) return;

			var have = Lampa.Storage.get(NOW_PLAYING_KEY, []);
			var at = parseInt(Lampa.Storage.get(NOW_PLAYING_AT, 0), 10) || 0;
			if (Array.isArray(have) && have.length && (Date.now() - at) < NOW_PLAYING_TTL) return;

			nowPlayingBusy = true;
			// Lampa.TMDB.api() строит только base URL; api_key и language
			// докидываем сами — иначе TMDB отвечает 401 «Invalid API key».
			var lang = Lampa.Storage.get('tmdb_lang', 'ru') || 'ru';
			var url = Lampa.TMDB.api('movie/now_playing') +
				(Lampa.TMDB.api('x').indexOf('?') > -1 ? '&' : '?') +
				'api_key=' + Lampa.TMDB.key() +
				'&language=' + encodeURIComponent(lang);
			new Lampa.Reguest().silent(url, function (json) {
				nowPlayingBusy = false;
				var arr = (json && json.results) || [];
				if (!arr.length) return;
				var stored = false;
				try {
					Lampa.Storage.set(NOW_PLAYING_KEY, arr.slice(0, 20));
					Lampa.Storage.set(NOW_PLAYING_AT, Date.now());
					stored = true;
				} catch (e) {
					console.log('[LampaBS bookmarks] now_playing store failed', e);
				}
				// Перевыкладываем только если запись прошла: иначе
				// следующий flush снова увидит пустой кэш и мы уйдём в
				// бесконечный круг «загрузили — не сохранили — грузим».
				if (stored) setTimeout(flushFavorite, 100);
				else nowPlayingFailed = true;
			}, function (a, c) {
				// До перезапуска больше не пробуем: flushFavorite
				// дёргается на каждое изменение закладок, и при
				// недоступном зеркале это был бы запрос на каждый чих.
				nowPlayingBusy = false;
				nowPlayingFailed = true;
				console.log('[LampaBS bookmarks] now_playing error', a, c);
			});
		}

		function flushFavorite() {
			try {
				reportImageBase();
				try { backdrops = Lampa.Storage.get(BACKDROPS_KEY, '{}') || {}; } catch (_) {}
				var raw = Lampa.Storage.get('favorite', {}) || {};
				var flat = [];
				// Lampa хранит закладки как {book: [id, id, …], like: […],
				// history: […], wath: […], card: [{id, title, poster_path, …}]}.
				// Списки типов — массивы ID; полные метаданные лежат в
				// общем пуле `card`. Поднимаем pool в Map<id, card> и
				// для каждого id из списка ищем соответствующий объект.
				// Совместимо с legacy-форматом, где type[] содержал сами
				// объекты — тогда просто используем item как card.
				var pool = Array.isArray(raw.card) ? raw.card : [];
				var cardById = {};
				pool.forEach(function (c) {
					if (c && c.id != null) cardById[String(c.id)] = c;
				});
				TYPES.forEach(function (type) {
					var list = raw[type];
					if (!Array.isArray(list)) return;
					list.forEach(function (item) {
						if (!item) return;
						var card = null;
						if (typeof item === 'object') {
							// Legacy: массив с полными карточками.
							card = item;
						} else {
							// New: массив id-строк.
							card = cardById[String(item)];
						}
						if (card) flat.push({ type: type, data: withPoster(card) });
					});
				});
				// Пятая полоска — «Смотрели недавно».
				// Наполняется из Lampa.Storage.recomends_list (обновляется
				// когда user смотрит карточки). Берём первые 20 (Lampa
				// хранит новые слева) — соответствует поведению LAMP!SHE.
				var own = Lampa.Storage.get('recomends_list', []);
				var hasOwn = Array.isArray(own) && own.length > 0;
				// Своих просмотров ещё нет — показываем афишу проката из
				// нашего ключа (см. refreshNowPlaying). Раньше тут лежал
				// «тренд дня»: набор случайных фильмов, в котором человек
				// не узнавал ничего и справедливо спрашивал, откуда это
				// взялось. Прокат хотя бы объясним — идёт в кино сейчас.
				//
				// Ключ отдельный, не recomends_list: тот принадлежит
				// пользователю, туда пишет только Lampa.
				var recomends = hasOwn ? own : (Lampa.Storage.get(NOW_PLAYING_KEY, []) || []);
				// Google TV Home показывает sideloaded-приложению обычно
				// ОДИН ряд, поэтому первый канал делаем комбинированным:
				// сначала то, что пользователь реально смотрел (history),
				// затем остальное из recomends_list — всё равно своё.
				var combined = [];
				var seenIds = {};
				function pushUnique(card) {
					if (!card || card.id == null) return;
					var key = String(card.id);
					if (seenIds[key]) return;
					seenIds[key] = true;
					combined.push(card);
				}
				var histList = raw['history'];
				if (Array.isArray(histList)) {
					histList.forEach(function (item) {
						pushUnique(typeof item === 'object' ? item : cardById[String(item)]);
					});
				}
				if (Array.isArray(recomends)) {
					recomends.forEach(function (card) {
						if (combined.length >= 20) return;
						pushUnique(card);
					});
				}
				combined.slice(0, 20).forEach(function (card) {
					flat.push({ type: 'recomends', data: withPoster(card) });
				});
				AndroidJS.saveBookmarks(JSON.stringify(flat));
				// Чего не хватило — доспросим у TMDB и перевыложим ряд.
				fillBackdrops(combined);
				// Афишу тянем только когда своих просмотров нет: у кого
				// история есть, тому чужие фильмы в ряду не нужны вовсе.
				if (!hasOwn) refreshNowPlaying();
			} catch (e) { console.log('[LampaBS bookmarks] failed', e); }
		}
		Lampa.Storage.listener.follow('change', function (e) {
			if (!e) return;
			if (e.name === 'favorite') {
				flushFavorite();
				return;
			}
			// Пользователь переключил зеркало картинок — ссылки в уже
			// выложенном ряду ведут на старый хост, перевыкладываем.
			if (e.name === 'proxy_tmdb' || e.name === 'tmdb_proxy_image') {
				flushFavorite();
			}
		});
		// Двойная страховка — часть кода Lampa шлёт state:changed
		// вместо Storage change, например при .toggle из карточки.
		if (Lampa.Listener && Lampa.Listener.follow) {
			Lampa.Listener.follow('favorite', function (e) {
				flushFavorite();
			});
		}
		// Одноразовый пуш на старте — если что-то уже лежит в Storage
		// (переустановка / первый запуск с готовыми данными).
		if (window.appready) flushFavorite();
		else Lampa.Listener.follow('app', function (e) {
			if (e.type === 'ready') setTimeout(flushFavorite, 500);
		});
	})();

	// --- Офлайн при запуске -------------------------------------------
	//
	// Без интернета Lampa молча рисует пустой каталог, и отличить это
	// от сломанного приложения нельзя. Говорим прямо.
	//
	// Встроенные плагины при этом работают: они грузятся с
	// file:///android_asset, а не из сети. Не загружаются те, что
	// пользователь добавил сам в «Расширения» по http-ссылке, — про них
	// и речь в сообщении.
	//
	// Проверяем ровно один раз, на старте. Есть сеть — молчим и больше
	// к теме не возвращаемся: следить за её пропаданием посреди сеанса
	// незачем, на конкретном запросе Lampa и так покажет ошибку. Нет —
	// ждём появления, дозагружаем плагины и замолкаем навсегда.
	(function () {
		if (typeof AndroidJS === 'undefined' ||
			typeof AndroidJS.isOnline !== 'function') return;

		// Интервал опроса растёт: 30 с → 1 → 2 → 5 минут и дальше по
		// пять. Первые минуты после старта связь появляется чаще всего
		// (роутер поднимается, Wi-Fi переподключается) — там частый
		// опрос уместен. А в режиме полёта её не будет вовсе, и долбить
		// систему раз в полминуты весь вечер незачем: настоящее
		// появление сети всё равно принесёт колбэк моста, опрос лишь
		// подстраховка.
		var POLL_STEPS = [30000, 60000, 120000, 300000];
		var pollStep = 0;
		var timer = null;
		var done = false;

		function online() {
			// Не смогли спросить — считаем, что связь есть: молчание
			// лучше ложной тревоги.
			try { return !!AndroidJS.isOnline(); } catch (_) { return true; }
		}

		function say(msg) {
			try { if (Lampa.Noty) Lampa.Noty.show(msg); } catch (_) {}
		}

		/** Снимок подписчиков события `app` — список живой, копируем. */
		function appListeners() {
			try {
				var box = Lampa.Listener._listeners || {};
				return (box['app'] || []).slice();
			} catch (_) { return []; }
		}

		/**
		 * Загружает сетевые плагины и «доигрывает» им пропущенный старт.
		 *
		 * Одной загрузки мало, каким бы способом её ни делать —
		 * putScript, $.getScript, вручную вставленный <script>: файл
		 * скачивается (в логах честные 200), но почти каждый плагин
		 * Lampa вешает инициализацию на событие `app: ready`, а оно
		 * прошло ещё до появления сети. Скрипт отрабатывает вхолостую, и
		 * в приложении не появляется ничего. Дело не в загрузчике.
		 *
		 * Поэтому после загрузки сравниваем список подписчиков `app` с
		 * тем, что был до неё, и зовём с `{type:'ready'}` только новых.
		 * Разослать событие целиком через Listener.send нельзя: его
		 * получат и обработчики самой Lampa, и наши, и всё, что уже
		 * отработало на старте, — половина приложения проинициализируется
		 * повторно.
		 *
		 * Плагины, которые проверяют `window.appready` и стартуют сразу,
		 * подписчика не добавляют, в разницу не попадают и второй раз не
		 * запускаются — что и нужно.
		 */
		/**
		 * @param quiet не показывать сообщений — связь и не пропадала
		 *              на глазах у пользователя, сообщать не о чем.
		 */
		function loadUserPlugins(quiet) {
			// Грузим ровно то, что сами же отложили на старте, а не весь
			// список плагинов. Если из пяти не взлетел один, повторная
			// загрузка остальных четырёх зарегистрировала бы им по
			// второму подписчику `app` — и они инициализировались бы
			// дважды.
			var urls = (window.LampaBS.deferredScripts || []).slice();
			if (!urls.length) { if (!quiet) say('Интернет появился'); return; }
			window.LampaBS.deferredScripts = [];

			var before = appListeners();
			console.log('[LampaBS offline] загружаем отложенное: ' + urls.join(', '));
			try {
				Lampa.Utils.putScript(urls, function () {
					var fresh = appListeners().filter(function (cb) {
						return before.indexOf(cb) === -1;
					});
					console.log('[LampaBS offline] новых подписчиков app: ' + fresh.length);
					fresh.forEach(function (cb) {
						// Свой try на каждого: упавший плагин не должен
						// уносить с собой остальные.
						try { cb({ type: 'ready' }); }
						catch (e) { console.log('[LampaBS offline] плагин упал на ready', e); }
					});
					if (!quiet) say('Интернет появился, плагины загружены');
					else if (fresh.length) say('Плагины загружены');
				}, function () {}, function () {}, false);
			} catch (e) {
				console.log('[LampaBS offline] putScript упал', e);
				say('Часть плагинов не загрузилась. Перезапустите Lampa BS');
			}
		}

		function stopWatching() {
			if (timer) { clearTimeout(timer); timer = null; }
			window.__lampabsNetwork = null;
			try {
				if (typeof AndroidJS.networkWatchStop === 'function') AndroidJS.networkWatchStop();
			} catch (_) {}
		}

		/** Один отложенный замер, сам переставляющий себя на следующий. */
		function poll() {
			var wait = POLL_STEPS[Math.min(pollStep, POLL_STEPS.length - 1)];
			pollStep++;
			timer = setTimeout(function () {
				if (done) return;
				if (online()) recovered();
				else poll();
			}, wait);
		}

		function recovered() {
			if (done) return;
			done = true;
			stopWatching();
			loadUserPlugins();
		}

		function start() {
			if (online()) {
				// Связь поднялась между стартом приложения и этой
				// проверкой — сообщать не о чем, но отложенное на
				// секунду раньше надо дозабрать.
				if ((window.LampaBS.deferredScripts || []).length) loadUserPlugins(true);
				return;
			}
			say('Нет интернета — офлайн-режим. Каталог и добавленные плагины не загружены.');
			// Колбэк моста ловит появление сети сразу; опрос —
			// подстраховка на случай, когда система меняет «подключено»
			// на «подключено и проверено» без отдельного события. Оба
			// выключаются, как только связь появилась.
			window.__lampabsNetwork = function (isUp) { if (isUp) recovered(); };
			poll();
			try {
				if (typeof AndroidJS.networkWatchStart === 'function') AndroidJS.networkWatchStart();
			} catch (_) {}
		}

		Lampa.Listener.follow('app', function (e) {
			// Пауза намеренная: на телевизоре Wi-Fi поднимается уже
			// после старта приложения, и сразу после ready сеть почти
			// всегда «отсутствует».
			if (e.type === 'ready') setTimeout(start, 3000);
		});
	})();

	// Плеер: с UA "lampa_client" Lampa сама показывает в
	// Настройки → Плеер выбор "Внутренний / DDD Player" (родной 'android'
	// вариант, переименованный через app.min.js appReplace) и по
	// умолчанию использует 'android'. Здесь мы подхватываем этот
	// дефолт на свежей установке.
	if (!Lampa.Storage.get('player')) Lampa.Storage.set('player', 'android');
	if (!Lampa.Storage.get('player_iptv')) Lampa.Storage.set('player_iptv', 'android');

	// Одноразовые дефолты форка: прячем Мультфильмы (cub) и Спорт из меню.
	// Пользователь сможет вернуть их через Интерфейс -> Меню.
	if (!Lampa.Storage.get('lampabs_menu_defaults_applied')) {
		Lampa.Storage.set('menu_hide', ['Мультфильмы (cub)', 'Спорт']);
		Lampa.Storage.set('lampabs_menu_defaults_applied', '1');
	}

	// Прокси TMDB (плагин t.js + подмена Lampa.TMDB.image/api на
	// imagetmdb.cubnotrip.top) нужна только там, где прямой
	// image.tmdb.org режет провайдер. Само зеркало стоит в РФ: из
	// UA/KZ/PL оно либо не отвечает, либо тянется долго — и картинок
	// нет как раз у тех, у кого без прокси всё работало.
	//
	// Раньше решали по языку интерфейса, и это неверно: русский
	// интерфейс в Киеве — обычное дело, а прокси включался всем таким.
	// Спрашиваем страну — тем же способом, что и сама Lampa, у неё для
	// этого есть `VPN.region()` с суточным кэшем, и по тому же ответу
	// она сама поднимает свой TMDBProxy для `ru`/`by`.
	//
	// Ключ проверки новый: у тех, кому прокси уже включил язык, старый
	// стоит выставленным, и новое решение до них бы не доехало.
	// Переключённое руками потом не трогаем — проверка одноразовая.

	// Прокси для трейлеров YouTube включаем тем же гео-сигналом (ru/by),
	// что и TMDB-прокси: googlevideo в РФ троттлят, и трейлер буферит.
	// Нативной стороне (TrailerProxy) флаг нужен на каждом запуске, а
	// geo-проверка ниже одноразовая — поэтому читаем сохранённое решение
	// и здесь, и после уточнения.
	function pushTrailerProxy() {
		try {
			if (typeof AndroidJS !== 'undefined' && AndroidJS.setTrailerProxyEnabled) {
				// Адрес узла — перебивается на лету через Storage, чтобы
				// искать рабочий узел без пересборки. Ставим ДО включения.
				if (AndroidJS.setTrailerProxyConfig) {
					AndroidJS.setTrailerProxyConfig(String(Lampa.Storage.get('lampabs_trailer_proxy', '') || ''));
				}
				// Адрес резолвера HD-трейлеров (yt-dlp+bgutil на сервере) —
				// перебивается через Storage без пересборки; пусто = по умолчанию.
				if (AndroidJS.setYtResolverConfig) {
					AndroidJS.setYtResolverConfig(String(Lampa.Storage.get('lampabs_yt_resolver', '') || ''));
				}
				// Именно страна, а не языковой флаг: этот прокси гонит
				// ВЕСЬ ютуб-трафик WebView через наш узел в России, и
				// человеку за границей ютуб на это отвечает «контент
				// недоступен в вашей стране».
				AndroidJS.setTrailerProxyEnabled(geoIsRuBy());
			}
		} catch (e) {}
	}

	// Спрашиваем страну на КАЖДОМ запуске, а не один раз в жизни.
	// Раньше проверка была одноразовой (`lampabs_proxy_tmdb_geo`), и
	// первый же ответ — или его отсутствие — оставался навсегда: уехал
	// человек, сменил провайдера, не доехал ответ на первом запуске —
	// и обходы для РФ висели у него до переустановки. Запрос один и
	// дешёвый, а стоит на нём теперь доступ к ютубу.
	(function () {
		function byLanguage() {
			var nav = ((navigator && navigator.language) || '').toLowerCase();
			var app = (Lampa.Storage.get('language', '') || '').toLowerCase();
			return nav.indexOf('ru') === 0 || nav.indexOf('-ru') > 0 || app === 'ru';
		}

		// Стартовое значение — синхронно и по языку. Список плагинов
		// (t.js) собирается в этом же проходе, а страна приедет позже:
		// без стартового значения первый запуск оставался бы вообще без
		// прокси, и у россиян не грузились бы картинки на первом экране.
		// Ставим только на пустом месте — заполненное значит, что тут
		// уже либо наш прошлый ответ, либо выбор человека.
		if (Lampa.Storage.get('proxy_tmdb', '') === '') {
			var start = byLanguage();
			Lampa.Storage.set('proxy_tmdb', start);
			Lampa.Storage.set('lampabs_proxy_tmdb_auto', start);
			pushTrailerProxy();
		}

		function apply(code) {
			var c = String(code || '').trim().toLowerCase();
			// Не двухбуквенный ответ — не страна, решать по нему нечего.
			if (c.length !== 2) return;
			var want = c === 'ru' || c === 'by';
			// Страна словами — по ней и включаются обходы для РФ
			// (geoIsRuBy). Языковой флаг остаётся только для картинок.
			Lampa.Storage.set('lampabs_geo_country', c);
			var auto = Lampa.Storage.get('lampabs_proxy_tmdb_auto', '');
			var cur = Lampa.Storage.get('proxy_tmdb', '');
			// Перетираем только то, что ставили сами. Человек мог
			// включить прокси руками — в Казахстане, например, TMDB
			// тоже режут, — и сбрасывать это молча нельзя.
			if (cur === '' || cur === auto) Lampa.Storage.set('proxy_tmdb', want);
			Lampa.Storage.set('lampabs_proxy_tmdb_auto', want);
			Lampa.Storage.set('lampabs_proxy_tmdb_geo', '1');
			pushTrailerProxy();
		}

		// Спрашиваем тот же geo, что и сама Lampa, но своим запросом.
		// `VPN.region()` не годится: когда домен не отвечает, она молча
		// подставляет в ответ язык интерфейса — ровно тот критерий, от
		// которого мы уходим, — и отличить это от настоящего ответа
		// снаружи нечем. Своим запросом «не доехало» видно, и тогда
		// флаг не ставится: спросим в следующий запуск.
		try {
			$.ajax({
				url: Lampa.Utils.protocol() + 'geo.' + Lampa.Manifest.cub_domain,
				type: 'GET',
				dataType: 'text',
				timeout: 8000,
				success: apply,
				error: function () {},
			});
		} catch (e) {
			console.log('[LampaBS] region check failed', e);
		}
	})();

	// На каждом запуске отдаём нативной стороне сохранённое решение —
	// geo-проверка выше одноразовая, а флаг прокси трейлеров нужен и
	// вернувшемуся зрителю.
	pushTrailerProxy();

    // Одноразовые дефолты форка: парсер и клавиатуру пишем в Storage
    // при первом запуске — пользователь их увидит в настройках и сможет
    // поменять. НАПРОТИВ, torrserver_url / login / password НЕ пишем —
    // они подставляются на лету через Storage.field/get override
    // (см. DEFAULTS ниже). Так у пользователя, который хочет свой
    // TorrServer, поле остаётся пустым — очистит → снова наш дефолт;
    // введёт своё → мы отойдём в сторону.
    if(!Lampa.Storage.get('lampac_initiale','false')) {
        Lampa.Storage.set('keyboard_type','integrate');
        Lampa.Storage.set('jackett_url','jac.red');
        Lampa.Storage.set('jackett_key','');
        Lampa.Storage.set('parser_torrent_type','jackett');
        Lampa.Storage.set('lampac_initiale', 'true');
    }
			/* === Skaz: выбор сервера загрузки + замер пинга === */
			var SKAZ_DOMAINS = ['skaz.tv','skaztv.online','skaz.team','skaztv.top','list.skaz.tv'];
			var skazPing = {};
			var skazValues = {};
			SKAZ_DOMAINS.forEach(function(d){ skazValues[d] = skazDomainLabel(d); });

			function skazDomainLabel(d){
				var ms = skazPing[d];
				if (ms === undefined) return d + ' (\u2026)';
				if (ms === null)      return d + ' (\u2014)';
				return d + ' (' + ms + ' \u043c\u0441)';
			}

			function skazGetDomain(){
				var d = Lampa.Storage.get('skaz_domain','skaz.tv');
				if (SKAZ_DOMAINS.indexOf(d) === -1) d = 'skaz.tv';
				return d;
			}

			function skazPingDomain(d){
				return new Promise(function(resolve){
					function now(){ return (window.performance && performance.now) ? performance.now() : Date.now(); }
					var start = now();
					var finished = false;
					function done(ok){
						if (finished) return; finished = true;
						resolve(ok ? Math.round(now() - start) : null);
					}
					var timeout = setTimeout(function(){ done(false); }, 5000);
					var url = 'http://' + d + '/favicon.ico?_=' + Date.now();
					try {
						fetch(url, { mode: 'no-cors', cache: 'no-store' })
							.then(function(){ clearTimeout(timeout); done(true); })
							.catch(function(){ clearTimeout(timeout); done(false); });
					} catch (e) {
						var img = new Image();
						img.onload = img.onerror = function(){ clearTimeout(timeout); done(true); };
						img.src = url;
					}
				});
			}

			function skazMeasureAll(onEach){
				SKAZ_DOMAINS.forEach(function(d){
					skazPingDomain(d).then(function(ms){
						skazPing[d] = ms;
						skazValues[d] = skazDomainLabel(d);
						if (onEach) onEach(d, ms);
					});
				});
			}

			/* Панель "by Skaz" с выбором сервера показываем только когда ТВ включено
			   (иначе она бесполезна — сервер нужен именно для tv.js). */
			var _skazEnabledEarly = (Lampa.Storage.get('account_email') || '') !== ''
				|| Lampa.Storage.get('skaz_enable') === true;
			if (_skazEnabledEarly) {
			(function(){
				var exists = false;
				try {
					if (Lampa.SettingsApi && Array.isArray(Lampa.SettingsApi.components)) {
						exists = Lampa.SettingsApi.components.some(function(c){ return c && c.component === 'tvskaz'; });
					}
				} catch(e){}
				if (!exists && $('.settings-folder[data-component="tvskaz"]').length) exists = true;
				if (!exists) {
					Lampa.SettingsApi.addComponent({
						component: 'tvskaz',
						icon: "<svg height=\"36\" viewBox=\"0 0 38 36\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect x=\"2\" y=\"8\" width=\"34\" height=\"21\" rx=\"3\" stroke=\"white\" stroke-width=\"3\"/>\n            <line x1=\"13.0925\" y1=\"2.34874\" x2=\"16.3487\" y2=\"6.90754\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n            <line x1=\"1.5\" y1=\"-1.5\" x2=\"9.31665\" y2=\"-1.5\" transform=\"matrix(-0.757816 0.652468 0.652468 0.757816 26.197 2)\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n            <line x1=\"9.5\" y1=\"34.5\" x2=\"29.5\" y2=\"34.5\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n        </svg>",
						name: 'by Skaz'
					});
				}
			})();

			Lampa.SettingsApi.addParam({
				component: 'tvskaz',
				param: {
					name: 'skaz_domain',
					type: 'select',
					values: skazValues,
					default: 'skaz.tv'
				},
				field: {
					name: '\u0421\u0435\u0440\u0432\u0435\u0440 Skaz',
					description: '\u0414\u043e\u043c\u0435\u043d, \u0441 \u043a\u043e\u0442\u043e\u0440\u043e\u0433\u043e \u0433\u0440\u0443\u0437\u0438\u0442\u0441\u044f \u043a\u043e\u043d\u0442\u0435\u043d\u0442 Skaz. \u0412 \u0441\u043a\u043e\u0431\u043a\u0430\u0445 \u2014 \u043f\u0438\u043d\u0433 \u0434\u043e \u0441\u0435\u0440\u0432\u0435\u0440\u0430 (\u043c\u0441).'
				},
				onRender: function(item){
					skazMeasureAll(function(){
						try { item.find('.settings-param__value').text(skazValues[skazGetDomain()]); } catch(e){}
					});
				},
				onChange: function(value){
					location.reload();
				}
			});
			}

			var email = Lampa.Storage.get('account_email') || '';
			if (email!='') email= btoa(email);
			var plugins = Lampa.Plugins.get();
			var domain = 'file:///android_asset/lampa';
			// Подборки (p.js) и tv.js вынесены в Настройки → Lampa BS
			// → Наши плагины (см. lampa_updater.js), поэтому их здесь
			// уже нет — иначе получалась бы двойная инжекция.
			var plugins_add = [
			{"url": domain+"/plugins/store.js","status": 1},{"url": domain+"/catalog.js","status": 1},{"url": domain+"/plugins/logo.js","status": 1,"name": "Лого"},{"url": domain+"/plugins/kp_source.js","status": 1},{"url": domain+"/plugins/si.js","status": 1}
			];
		//if (window.location.hostname=='lampa.byskaz.ru') plugins_add.push({"url": domain+"/plugins/filter.js","status": 1});
		if (Lampa.Storage.get("proxy_tmdb")!= false) plugins_add.push({"url": domain+"/plugins/t.js","status": 1});
		// theme_select interface_mod plugin removed per fork spec (no themes)

		//if (Lampa.Storage.get("sisi_enabled")== true) plugins_add.push({"url": "http://z01.online/sisi.js","status": 1});

		 plugins_add.push({"url": domain+"/plugins/season-episode.js","status": 1});
		if (window.location.hostname=='lampa.byskaz.ru') plugins_add.push({"url": domain+"/plugins/tmdb-content-filter.js","status": 1});

		if (email!='' && Lampa.Storage.get('account_use')==true) plugins_add.push({"url": domain+"/sync.js","status": 1});
		if (window.location.search=='?redirect=1') Lampa.Utils.putScriptAsync([domain+"/plugins/r.js"]);
		if (Lampa.Storage.get("porborki_kp")=='1') plugins_add.push({"url": domain+"/plugins/kp.js?v=2","status": 1});
		if (Lampa.Storage.get('location_server')=='-') plugins_add.push({"url": domain+"/plugins/r.js","status": 1,"name": "Редирект"});

        var plugins_push = []
        plugins_add.forEach(function(plugin){
            if(!plugins.find(function(a){return a.url == plugin.url})){
                plugins_push.push(plugin.url)
            }
        });
        if(plugins_push.length) Lampa.Utils.putScript(plugins_push,function(){},function(){},function(){},true)
		if (Lampa.Storage.get('online_mod_rezka2_mirror')=='') Lampa.Storage.set('online_mod_rezka2_mirror', 'http://cors.byskaz.ru/http://kvk.zone');
		// Старый неработающий домен — очищаем, runtime override сам
		// подставит наш дефолтный http://jac.red.
		if (Lampa.Storage.get('jackett_url') == 'jac.byskaz.ru') Lampa.Storage.set('jackett_url','');
		// Убрали NUM-триггер в разделе Подборки — не нужен в форке.
		    Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'theme_serial',
                type: 'trigger',
                default: false
            },
            field: {
                name: 'Скрыть подписи: Сериалы, Фильмы',
                description: 'Скрыть с карточки'
            },
            onChange: function() {
            }
        });
    function createHintText(html) {
        return '<div style="display: block;"><div class="myBot" style="display:none; line-height: 0.5;color: #ffffff;font-family: &quot;SegoeUI&quot;, sans-serif;font-size: 1em;box-sizing: border-box;outline: none;user-select: none;display: flex;-webkit-box-align: start;align-items: flex-start;position: relative;background-color: rgba(255, 255, 255, 0.1);border-radius: 0.3em;margin-bottom: 1.5em;"><div style="background-color: rgba(255, 255, 255, 0.1);    padding: 0.7em;    -webkit-box-flex: 1;    -webkit-flex-grow: 1;    -moz-box-flex: 1;    -ms-flex-positive: 1;    flex-grow: 1;    line-height: 1.7;"><span style="background: #ffe216;color: #000;border-radius: 0.3em;padding: 0.3em;margin-right: 0.5em;">Подсказка</span>' + html + '</div></div></div>'   
    }
  
    var hint1 = $(createHintText('Тормозит или не воспроизводится видео? Переключи <b>Источник</b> с помощью кнопки над текстом.'));
    
    var hints = [hint1]

Lampa.Storage.listener.follow('change', function (event) {
              if (event.name == 'activity') {
                  console.log('Lampa.Activity.active().component', Lampa.Activity.active().component)
                if (Lampa.Activity.active().component == 'lampacskaz') {
                    var randomHint = hints[Math.floor(Math.random() * hints.length)]
                   var add_ads = setInterval(function() {
			if (document.querySelector('.online-prestige-watched') !== null) {
	                    $('.online-prestige-watched').before(randomHint);
                            clearInterval(add_ads);
                        }
                   }, 50);
                }
              }
          }) 
	  // Тумблер "Включить ТВ каналы" (skaz_enable) переехал в
	  // Настройки → Lampa BS → Наши плагины (см. lampa_updater.js).
	  // Оставляем дополнительный тумблер внутри iptvskaz на случай,
	  // если пользователь захочет отключить плагин из его собственных
	  // настроек после включения.
	  if (email=='' && Lampa.Storage.get('skaz_enable')==true) {
		Lampa.SettingsApi.addParam({
		component: 'iptvskaz',
		param: {
			name: 'skaz_enable',
			type: 'trigger',
			default: false
		},
		field: {
               name: 'Включить плагин ТВ'
           },
		onChange: function (value) {
			      location.reload();
		 }
	});
	}

	// ---------------------------------------------------------------
	// Оффлайн-загрузки (Lampa BS)
	// ---------------------------------------------------------------
	// 3 куска:
	//   1) Кнопка «⬇ Скачать» в карточке фильма (component full).
	//      Показываем только если у пользователя настроен торрсервер
	//      И выбран парсер — иначе качать неоткуда, кнопка бесполезна.
	//   2) Пункт «Загрузки» в главном меню — появляется только если
	//      уже есть хоть одна запись (пустой раздел не рисуем).
	//   3) Индикатор колёсика возле часов сверху справа с процентом
	//      активной задачи. Polling AndroidJS.downloadHasActive() раз
	//      в 3с; при завершении — прячем.
	(function () {
		if (typeof AndroidJS === 'undefined' ||
			typeof AndroidJS.downloadStart !== 'function') return;

		// Встроенные дефолты нашего «Скачать»: человек может ничего не
		// настраивать — берём свой TorrServer и jac.red-парсер.
		//
		// В настройки Lampa отсюда не попадает ничего: подмены
		// `Storage.field` больше нет (см. ниже), и этими значениями
		// пользуется только наш собственный конвейер скачивания. Свой
		// TorrServer человек настраивает в Lampa как обычно, и мы туда
		// не лезем.
		var DEFAULTS = {
			torrserver_url: 'http://oleg6.skaz.tv:44000',
			torrserver_login: 'lampa',
			torrserver_password: 'zJ2NQ1569F',
			// Наш встроенный TS требует Basic-Auth, поэтому флаг
			// «Вход по паролю» тоже держим включённым — иначе Lampa
			// не собирает Authorization заголовок и получает 401.
			torrserver_auth: true,
			parser_torrent_type: 'jackett',
			jackett_url: 'http://jac.red',
			jackett_key: '',
		};

		// Кнопка «Скачать» показываем всегда — у нас есть встроенный
		// TorrServer и парсер. Раньше требовали пользовательской настройки,
		// но большинству пользователей это не нужно.
		function hasSources() { return true; }

		function listAll() {
			try {
				var raw = AndroidJS.downloadList();
				return raw ? JSON.parse(raw) : [];
			} catch (e) { return []; }
		}

		// Storage не патчим намеренно. Пользователь настраивает
		// TorrServer / парсер в лампе как ему нравится — мы не пишем и
		// не подмешиваем свои значения в его настройки. Наш «Скачать»
		// имеет собственный self-contained pipeline: Jackett → torrent
		// файл → POST /torrents на наш TorrServer → downloadStart —
		// см. lampabsDownload* функции ниже. Никаких обёрток над
		// Lampa.Storage больше нет.
		//
		// Единственное исключение — Player.play hook (в блоке ниже),
		// но он срабатывает только когда активна наша activity с
		// флагом __lampabsDownloadMode, поэтому обычный флоу Lampa
		// не задевает.


		function humanBytes(n) {
			if (!n || n <= 0) return '—';
			var u = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']; var i = 0;
			while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
			return n.toFixed(n < 10 ? 1 : 0) + ' ' + u[i];
		}

		// --- 1. Кнопка «Скачать» в карточке -----------------------
		function injectDownloadButton(activity) {
			if (!hasSources()) return;
			var $render = activity.activity && activity.activity.render && activity.activity.render();
			if (!$render) {
				return;
			}
			var $buttons = $render.find(
				'.full-start-new__buttons, .full-start__buttons, ' +
				'.full-start__button-container, .buttons--container'
			).first();
			if (!$buttons.length) {
				console.log('[LampaBS downloads] injectBtn: buttons container not found; ' +
					'render html preview: ' + ($render[0] && $render[0].outerHTML || '')
						.replace(/\s+/g, ' ').slice(0, 220));
				return;
			}
			if ($buttons.find('.lampabs-download').length) return;

			var card = (activity.movie || activity.card) || {};
			var providerId = (card.first_air_date || card.number_of_seasons ? 'tv:' : 'movie:') +
				(card.id || card.card_id || '');
			var $btn = $('<div class="full-start__button selector lampabs-download">' +
				'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
				'<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
				'</svg><span>Скачать</span></div>');
			$btn.on('hover:enter', function () { openTorrentPicker(card, providerId); });
			$buttons.append($btn);
		}

		// Наш собственный TorrServer / парсер — используем ТОЛЬКО в нашем
		// download-flow. В Lampa'ины настройки ничего не пишем и не подменяем.
		var OUR_TS_URL = DEFAULTS.torrserver_url;
		var OUR_TS_LOGIN = DEFAULTS.torrserver_login;
		var OUR_TS_PASSWORD = DEFAULTS.torrserver_password;
		var OUR_JACKETT_URL = DEFAULTS.jackett_url;

		function ourAuthHeader() {
			return 'Basic ' + btoa(OUR_TS_LOGIN + ':' + OUR_TS_PASSWORD);
		}

		// Прямой JacRed-запрос (jac.red использует Jackett-совместимые
		// пути, но ответ — JSON {Results:[…]}, не Torznab XML).
		// Формируем ровно тот набор параметров, который шлёт веб-Lampa:
		// Query + title + title_original + year + is_serial + genres +
		// Category[] — без них jac.red часто отдаёт 404/пусто.
		function ourJackettSearch(card) {
			var titleRu = card.title || card.name || '';
			var titleEn = card.original_title || card.original_name || titleRu;
			var year = ((card.release_date || card.first_air_date || '').slice(0, 4)) || '';
			var isSerial = (card.number_of_seasons || card.first_air_date) ? 1 : 0;
			var genres = (card.genres || []).map(function (g) { return g.name || g; }).join(',');
			var query = (titleEn + ' ' + titleRu).trim();
			var category = isSerial ? '5000' : '2000';
			var url = OUR_JACKETT_URL.replace(/\/+$/, '') +
				'/api/v2.0/indexers/all/results?apikey=' +
				'&Query=' + encodeURIComponent(query) +
				'&title=' + encodeURIComponent(titleRu) +
				'&title_original=' + encodeURIComponent(titleEn) +
				(year ? '&year=' + encodeURIComponent(year) : '') +
				'&is_serial=' + isSerial +
				(genres ? '&genres=' + encodeURIComponent(genres) : '') +
				'&Category[]=' + category;
			return fetch(url, {
				mode: 'cors',
				headers: { Accept: 'application/json, text/javascript, */*; q=0.01' },
			}).then(function (r) {
				if (!r.ok) throw new Error('Jackett HTTP ' + r.status);
				return r.json();
			}).then(function (j) {
				var arr = (j && j.Results) || [];
				var out = [];
				for (var i = 0; i < arr.length; i++) {
					var it = arr[i];
					var mag = it.MagnetUri || it.Link || it.magnetLink || '';
					if (!mag) continue;
					var info = it.info || {};
					out.push({
						title: it.Title || it.title || '',
						magnet: mag,
						sizeBytes: it.Size || it.size || 0,
						sizeText: info.sizeName || '',
						quality: info.quality || 0,
						videotype: info.videotype || '',
						voices: info.voices || [],
						seeders: it.Seeders || it.seeders || 0,
						leechers: it.Peers || it.peers || it.Leechers || 0,
						tracker: it.Tracker || it.tracker || '',
					});
				}
				return out;
			});
		}

		function qualityLabel(q) {
			if (q >= 2160) return '4K';
			if (q >= 1080) return '1080p';
			if (q >= 720) return '720p';
			if (q >= 480) return '480p';
			return '';
		}

		// Общий POST /torrents — как в веб-Lampa'е: content-type
		// form-urlencoded, тело JSON. TorrServer принимает и то и то,
		// но копируем её паттерн один-в-один во избежание сюрпризов.
		function ourTsCall(payload) {
			return fetch(OUR_TS_URL.replace(/\/+$/, '') + '/torrents', {
				method: 'POST',
				headers: {
					'Accept': 'application/json, text/javascript, */*; q=0.01',
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'Authorization': ourAuthHeader(),
				},
				body: JSON.stringify(payload),
			}).then(function (r) {
				if (!r.ok) throw new Error('TS HTTP ' + r.status);
				return r.json();
			});
		}

		// Добавляет раздачу и возвращает Promise<hash>. save_to_db:false —
		// не засоряем базу TorrServer'а раздачами пользователей.
		function ourTsAdd(magnet, title, poster) {
			return ourTsCall({
				action: 'add',
				link: magnet,
				title: title || '',
				poster: poster || '',
				save_to_db: false,
			}).then(function (j) {
				return j.hash || (j.torrent && j.torrent.hash) || '';
			});
		}

		// Список файлов. TorrServer после add ещё не имеет metadata —
		// polling'ом ждём до 15 сек, пока file_stats заполнится. Заодно
		// пробуем несколько ключей (разные версии TS/форк'ов): file_stats
		// / files / torrent_size / stats.
		function ourTsFiles(hash) {
			var attempts = 0;
			var MAX = 30;      // 30 * 500ms = 15 сек
			var DELAY = 500;
			function extract(j) {
				var raw = j && (j.file_stats || j.files ||
					(j.torrent && j.torrent.file_stats) || []);
				if (!raw.length) return null;
				return raw.map(function (f, i) {
					return {
						path: f.path || f.name || ('file_' + i),
						length: f.length || f.size || 0,
						id: f.id != null ? f.id : i,
					};
				});
			}
			return new Promise(function (resolve, reject) {
				function tick() {
					attempts++;
					ourTsCall({ action: 'get', hash: hash }).then(function (j) {
						var files = extract(j);
						if (files) return resolve(files);
						if (attempts >= MAX) return resolve([]); // metadata так и не пришла
						setTimeout(tick, DELAY);
					}, function (e) {
						if (attempts >= MAX) return reject(e);
						setTimeout(tick, DELAY);
					});
				}
				tick();
			});
		}

		function ourTsPlayUrl(hash, fileName, fileId) {
			var name = encodeURIComponent(fileName.split('/').pop().split('\\').pop());
			return OUR_TS_URL.replace(/\/+$/, '') + '/stream/' + name +
				'?link=' + hash + '&index=' + fileId + '&play';
		}

		// Наш простой picker: JacRed → Lampa.Select → выбор файла →
		// AndroidJS.downloadStart. Всё в обход Lampa'иных Storage/Torserver.
		function openTorrentPicker(card, providerId) {
			var title = card.title || card.name || '';
			if (!title && !(card.original_title || card.original_name)) {
				Lampa.Noty.show('Нет названия для поиска');
				return;
			}
			Lampa.Loading.start(function () {});
			ourJackettSearch(card).then(function (list) {
				Lampa.Loading.stop();
				if (!list.length) {
					Lampa.Noty.show('Раздачи не найдены'); return;
				}
				// Сортируем: сначала seeders desc, при равенстве — качество desc.
				list.sort(function (a, b) {
					if (b.seeders !== a.seeders) return b.seeders - a.seeders;
					return (b.quality || 0) - (a.quality || 0);
				});
				Lampa.Select.show({
					title: 'Выберите вариант — ' + title,
					items: list.slice(0, 30).map(function (r) {
						var parts = [];
						var q = qualityLabel(r.quality);
						if (q) parts.push(q + (r.videotype === 'hdr' ? ' HDR' : ''));
						if (r.voices && r.voices.length) parts.push(r.voices.slice(0, 2).join(', '));
						parts.push(r.sizeText || humanBytes(r.sizeBytes));
						parts.push('S:' + r.seeders);
						return {
							title: r.title,
							subtitle: parts.join(' • '),
							_raw: r,
						};
					}),
					onSelect: function (item) { pickFileAndStart(item._raw, card, providerId); },
					onBack: function () { Lampa.Controller.toggle('content'); },
				});
			}).catch(function (e) {
				Lampa.Loading.stop();
				Lampa.Noty.show('Ошибка поиска: ' + (e.message || e));
			});
		}

		function pickFileAndStart(raw, card, providerId) {
			var title = card.title || card.name || raw.title;
			var poster = card.img || card.poster_path || '';
			if (poster && poster.charAt(0) === '/') {
				poster = 'https://image.tmdb.org/t/p/w500' + poster;
			}
			Lampa.Loading.start(function () {});
			ourTsAdd(raw.magnet, raw.title, poster).then(function (hash) {
				if (!hash) throw new Error('TorrServer не вернул hash');
				return ourTsFiles(hash).then(function (files) { return { hash: hash, files: files }; });
			}).then(function (res) {
				Lampa.Loading.stop();
				var videos = res.files.filter(function (f) {
					return /\.(mkv|mp4|avi|webm|m4v|ts|mov|flv)$/i.test(f.path);
				});
				if (!videos.length) {
					Lampa.Noty.show('В раздаче нет видеофайлов'); return;
				}
				var start = function (file) {
					var url = ourTsPlayUrl(res.hash, file.path, file.id);
					var id = AndroidJS.downloadStart(JSON.stringify({
						url: url,
						providerId: providerId,
						title: title + (videos.length > 1 ? ' — ' + file.path.split('/').pop() : ''),
						poster: poster,
						headers: { Authorization: ourAuthHeader() },
					}));
					if (id) {
						Lampa.Noty.show('Загрузка запущена. Смотри в «Загрузки».');
						setTimeout(function () { ensureMenuItem(); }, 300);
						try { Lampa.Activity.backward(); } catch (_) {}
					} else {
						Lampa.Noty.show('Не удалось запустить загрузку');
					}
				};
				if (videos.length === 1) { start(videos[0]); return; }
				Lampa.Select.show({
					title: 'Выберите файл',
					items: videos.map(function (f) {
						return {
							title: f.path.split('/').pop(),
							subtitle: humanBytes(f.length),
							_file: f,
						};
					}),
					onSelect: function (item) { start(item._file); },
					onBack: function () { Lampa.Controller.toggle('content'); },
				});
			}).catch(function (e) {
				Lampa.Loading.stop();
				Lampa.Noty.show('Ошибка: ' + (e.message || e));
			});
		}

		Lampa.Listener.follow('full', function (e) {
			if (e && (e.type === 'complite' || e.type === 'build')) {
				injectDownloadButton(e.object || e);
			}
		});

		// --- 2. Пункт «Загрузки» в главном меню -------------------
		function ensureMenuItem() {
			try {
				if (!listAll().length) { $('.lampabs-menu-downloads').remove(); return; }
				var $menu = $('.menu .menu__list').first();
				if (!$menu.length) return;
				if ($menu.find('.lampabs-menu-downloads').length) return;
				var $item = $('<li class="menu__item selector lampabs-menu-downloads">' +
					'<div class="menu__ico">' +
					'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
					'<path d="M12 3v13M6 13l6 6 6-6M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
					'</svg></div>' +
					'<div class="menu__text">Загрузки</div></li>');
				$item.on('hover:enter', function () {
					Lampa.Activity.push({
						url: '', title: 'Загрузки', component: 'lampabs_downloads',
						page: 1,
					});
				});
				$menu.append($item);
				try { Lampa.Controller.collectionSet('menu'); } catch (_) {}
			} catch (e) {}
		}
		Lampa.Listener.follow('app', function (e) {
			if (e.type === 'ready') { setTimeout(ensureMenuItem, 500); }
		});

		// --- Component: экран «Загрузки» -------------------------
		function DownloadsComponent(object) {
			// Оборачиваем grid в Lampa.Scroll — иначе при большом
			// числе карточек нижние не видны: наш div сам по себе
			// не скроллится, а стандартный autoscroll фокуса
			// (Controller.collectionFocus) полагается именно на
			// scroll-контейнер Lampa'ы, чтобы двигать viewport за
			// фокусом. mask:true — обрезка контента по маске,
			// over:true — прячет скроллбар за пределами body.
			var scroll = new Lampa.Scroll({ mask: true, over: true });
			var $body = $(
				'<div class="lampabs-downloads" style="padding:1.5em">' +
				'<div class="lampabs-downloads__list" ' +
				'style="display:grid;grid-template-columns:repeat(auto-fill,' +
				'minmax(13em,1fr));gap:1.5em 1em"></div>' +
				'</div>');
			scroll.body().append($body);
			var $html = scroll.render();
			// Прежний трюк с `.addClass('layer--wheight')` +
			// Lampa.Layer.visible(...) ломал фокус на карточку: он
			// выставляет .scroll__content { height: N } до того, как
			// компонент вставлен в DOM, из-за чего первая карточка
			// временно имеет offsetParent === null, и
			// Lampa.Controller.collectionFocus фильтрует её как
			// «невидимую». Возвращаем скролл через явный CSS overflow —
			// проще, и никакой Layer-магии не нужно, чтобы фокус встал
			// на первую карточку.
			function applyPhoneScroll() {
				try {
					// window.innerHeight — вычитаем шапку (~4em) и, если
					// есть, нижнюю навигационную панель телефона (~5em).
					var $head = $('.head');
					var $navi = $('.navigation-bar');
					var minus = 0;
					if ($head.length) minus += $head[0].getBoundingClientRect().height;
					if ($navi.length && window.innerWidth <= window.innerHeight) {
						minus += $navi[0].getBoundingClientRect().height;
					}
					var maxH = Math.max(200, window.innerHeight - minus);
					$html.find('.scroll__content').css({
						'max-height': maxH + 'px',
						'overflow-y': 'auto',
					});
				} catch (_) {}
			}
			applyPhoneScroll();
			$(window).on('resize.lampabsDownloads', applyPhoneScroll);
			var self = this;
			var activeCards = [];

			/**
			 * Подвинуть окно за фокусом.
			 *
			 * Скролл у нас свой, обычным `overflow-y` — а значит и
			 * ехать за курсором он сам не станет: Lampa двигает фокус
			 * классами, а не фокусом браузера, и штатного
			 * `scrollIntoView` тут не случается. Без этого нижние
			 * карточки видны только пальцем на телефоне, а с пульта до
			 * них просто не долистать.
			 *
			 * Считаем по прямоугольникам, а не по `offsetTop`:
			 * карточка лежит в гриде внутри нескольких обёрток, и чей
			 * она потомок по вёрстке — вопрос отдельный.
			 */
			function scrollToFocused(el) {
				try {
					var box = $html.find('.scroll__content')[0];
					if (!box || !el) return;
					var pad = 24;
					var b = box.getBoundingClientRect();
					var e = el.getBoundingClientRect();
					if (e.top < b.top + pad) {
						box.scrollTop -= (b.top + pad - e.top);
					} else if (e.bottom > b.bottom - pad) {
						box.scrollTop += (e.bottom - (b.bottom - pad));
					}
				} catch (_) {}
			}

			function statusText(it) {
				if (it.status === 'completed') return humanBytes(it.sizeBytes);
				if (it.status === 'failed') return 'Ошибка';
				if (it.status === 'paused') return 'Пауза';
				return (it.percent || 0) + '%';
			}

			function render() {
				var items = listAll();
				var $list = $body.find('.lampabs-downloads__list').empty();
				if (!items.length) {
					$list.append(
						'<div style="padding:2em;opacity:.7">Пока ничего не скачано.</div>');
					activeCards = [];
					return;
				}
				activeCards = items.map(function (it) {
					var poster = it.poster || './img/img_load.svg';
					var progress = it.status === 'completed' ? 100 : (it.percent || 0);
					var statusColor = it.status === 'failed' ? '#f44'
						: it.status === 'completed' ? '#4a4'
						: '#e50914';
					// Разметка максимально в стиле стандартных Lampa'овских
					// карточек: .card > .card__view (padding-bottom:150% для
					// пропорций 2:3, БЕЗ background и БЕЗ overflow:hidden —
					// иначе ::after-обводка при фокусе `.card.focus
					// .card__view::after` (top/left/right/bottom: -0.5em)
					// будет обрезана и карточка станет «голой»). .card__img
					// уже позиционируется абсолютно из глобального CSS
					// Lampa — тут только src и object-fit.
					var $card = $(
						'<div class="card selector lampabs-download-card" ' +
						'style="width:14em">' +
						'<div class="card__view" ' +
						'style="position:relative;padding-bottom:150%">' +
						'<img class="card__img" src="' + poster + '" ' +
						'style="object-fit:cover">' +
						'<div class="card__status" style="position:absolute;top:.4em;right:.4em;' +
						'background:rgba(0,0,0,.75);color:#fff;font-size:.9em;padding:.2em .5em;' +
						'border-radius:.3em;z-index:1">' + statusText(it) + '</div>' +
						'<div class="card__progress" style="position:absolute;bottom:0;left:0;' +
						'right:0;height:5px;background:rgba(0,0,0,.5);' +
						'border-bottom-left-radius:1em;border-bottom-right-radius:1em;' +
						'overflow:hidden;z-index:1">' +
						'<div style="height:100%;width:' + progress + '%;' +
						'background:' + statusColor + ';transition:width .3s"></div>' +
						'</div>' +
						'</div>' +
						'<div class="card__title" style="margin-top:.4em;font-size:.95em;' +
						'text-align:center;white-space:nowrap;overflow:hidden;' +
						'text-overflow:ellipsis">' +
						(it.title || '(без названия)') + '</div>' +
						'</div>');
					$card.on('hover:focus', function (e) { scrollToFocused(e.target); });
					$card.on('hover:enter', function () { onCardEnter(it); });
					$card.on('hover:long', function () { onCardLong(it); });
					$list.append($card);
					return $card[0];
				});
			}

			function playStream(entry, useInner) {
				var completed = entry.status === 'completed' && entry.localPath;
				var url = completed ? 'file://' + entry.localPath : entry.url;
				var data = {
					url: url,
					title: entry.title || '',
					quality: {},
				};
				// TorrServer stream (пока качается) требует тот же
				// Basic-Auth, что и наш downloader — без него сервер
				// возвращает 401 и плеер молча ничего не показывает.
				// Ключ auth уже лежит в entry.headers (сохранён при
				// downloadStart), достаём его оттуда и пробрасываем
				// в data.headers — DDD IntentUtils их распакует
				// в HttpDataSource, inner-плеер тоже прокинет.
				if (!completed) {
					try {
						var raw = entry.headers;
						if (raw && typeof raw === 'string') raw = JSON.parse(raw);
						if (raw && typeof raw === 'object') data.headers = raw;
					} catch (_) {}
				}
				if (useInner) data.launch_player = 'inner';
				try {
					Lampa.Player.play(data);
				} catch (e) {
					Lampa.Noty.show('Не удалось запустить плеер');
				}
			}
			// Играет уже скачанную на диск часть. Загрузка при этом
			// НЕ прерывается: downloader продолжает дописывать тот же
			// файл, плеер читает его параллельно — Android это
			// разрешает. Длительность плеер определит по размеру на
			// момент открытия, так что «хвост», докачанный уже во
			// время просмотра, подхватится при следующем запуске.
			function playPart(entry, partPath) {
				try {
					Lampa.Player.play({
						url: 'file://' + partPath,
						title: entry.title || '',
						quality: {},
					});
				} catch (e) {
					Lampa.Noty.show('Не удалось открыть файл');
				}
			}

			function partPathOf(entry) {
				if (entry.status === 'completed') return '';
				try {
					if (typeof AndroidJS.downloadPartPath === 'function') {
						return AndroidJS.downloadPartPath(entry.id) || '';
					}
				} catch (e) {}
				return '';
			}

			function onCardEnter(entry) {
				if (entry.status === 'completed' && entry.localPath) {
					// Готовая запись — по клику сразу играем локально.
					playStream(entry, false);
					return;
				}
				// Недокачанное: если часть уже на диске — играем её.
				// Это быстрее и надёжнее сетевого стрима, и работает
				// даже когда раздача умерла или мы оффлайн.
				var part = partPathOf(entry);
				if (part) {
					playPart(entry, part);
					return;
				}
				// Ничего не скачано — показываем меню (стрим по сети,
				// пауза/докачка, удаление).
				onCardLong(entry);
			}
			function onCardLong(entry) {
				var items = [];
				// Стрим по сети (TorrServer / исходный URL) — доступен
				// для всего кроме завершённого, где играем локальный файл.
				// paused сюда тоже входит: раздача жива, просто мы
				// временно не тянем на диск.
				var canPlay = (entry.status === 'completed' && entry.localPath) ||
					entry.status === 'downloading' || entry.status === 'queued' ||
					entry.status === 'paused';
				if (canPlay) {
					items.push({ title: 'Смотреть', action: 'play' });
					items.push({ title: 'Смотреть во встроенном плеере', action: 'play_inner' });
				}
				// Уже скачанную часть можно смотреть вообще без сети —
				// но только когда файл не дописывается прямо сейчас.
				//
				// У растущего `.part` источник данных запоминает длину в
				// момент открытия, а плеер тут же буферизует далеко
				// вперёд и упирается за этот край: ошибка 2008,
				// POSITION_OUT_OF_RANGE, ещё до первого кадра. На паузе
				// файл неподвижен, и та же часть открывается нормально.
				//
				// Поэтому при активной закачке пункт не показываем, а
				// подсказываем поставить её на паузу — иначе он вёл бы
				// прямиком в ошибку.
				var partPath = partPathOf(entry);
				var writing = entry.status === 'downloading' || entry.status === 'queued';
				if (partPath && !writing) {
					// Первым пунктом: локальный файл почти всегда лучше
					// сетевого стрима — быстрее стартует, не зависит от
					// живости раздачи.
					items.unshift({
						title: 'Смотреть скачанное (' + (entry.percent || 0) + '%)',
						action: 'play_part',
						partPath: partPath,
					});
				} else if (partPath && writing) {
					items.push({
						title: 'Смотреть скачанное — нужна пауза',
						action: 'pause_then_part',
						partPath: partPath,
					});
				}
				if (entry.status === 'downloading' || entry.status === 'queued') {
					items.push({ title: 'Приостановить', action: 'pause' });
				}
				// Докачка: движок держит недокачанный `.part` и
				// возобновляет с места остановки через Range, так что
				// заново качать не придётся. Для failed — та же кнопка,
				// просто называется «Повторить».
				if (entry.status === 'paused') {
					items.push({ title: 'Продолжить', action: 'resume' });
				} else if (entry.status === 'failed') {
					items.push({ title: 'Повторить', action: 'resume' });
				}
				// Ссылку показываем только когда по ней реально можно
				// зайти: раздача включена, устройство в сети, файл
				// докачан. Пункт, ведущий в никуда, хуже отсутствующего.
				var shareUrl = '';
				try {
					if (typeof AndroidJS.localShareFileUrl === 'function') {
						shareUrl = AndroidJS.localShareFileUrl(entry.id) || '';
					}
				} catch (e) {}
				if (shareUrl) {
					items.push({
						title: 'Ссылка для другого устройства',
						action: 'share_link',
						url: shareUrl,
					});
				}
				items.push({ title: 'Удалить', action: 'delete' });
				items.push({ title: 'Закрыть', action: 'close' });
				Lampa.Select.show({
					title: entry.title,
					items: items,
					onSelect: function (a) {
						if (a.action === 'delete') {
							AndroidJS.downloadDelete(entry.id);
							render();
						} else if (a.action === 'pause') {
							AndroidJS.downloadCancel(entry.id);
							setTimeout(render, 300);
						} else if (a.action === 'resume') {
							try {
								if (typeof AndroidJS.downloadResume === 'function') {
									AndroidJS.downloadResume(entry.id);
								} else {
									Lampa.Noty.show('Обновите приложение для докачки');
								}
							} catch (e) {}
							setTimeout(render, 300);
						} else if (a.action === 'play') {
							playStream(entry, false);
						} else if (a.action === 'play_inner') {
							playStream(entry, true);
						} else if (a.action === 'play_part') {
							playPart(entry, a.partPath);
						} else if (a.action === 'share_link') {
							// Копируем сразу и тут же показываем: на
							// телевизоре буфер обмена некуда вставить,
							// адрес приходится набирать глазами с экрана,
							// а на телефоне копия избавляет от набора.
							var copied = false;
							try {
								if (typeof AndroidJS.copyToClipboard === 'function') {
									copied = !!AndroidJS.copyToClipboard(a.url);
								}
							} catch (e) {}
							Lampa.Select.show({
								title: 'Откройте на другом устройстве',
								items: [
									{ title: a.url },
									{ title: copied ? 'Скопировано в буфер обмена' : 'Закрыть' },
								],
								onSelect: function () { Lampa.Controller.toggle('content'); },
								onBack: function () { Lampa.Controller.toggle('content'); },
							});
						} else if (a.action === 'pause_then_part') {
							// Останавливаем запись и только потом
							// открываем: пока файл растёт, плеер
							// упрётся за его край. Продолжить закачку —
							// кнопкой «Продолжить» после просмотра.
							try { AndroidJS.downloadCancel(entry.id); } catch (e) {}
							Lampa.Noty.show('Загрузка приостановлена — продолжите её после просмотра');
							setTimeout(function () { playPart(entry, a.partPath); }, 600);
						}
					},
					onBack: function () { Lampa.Controller.toggle('content'); },
				});
			}

			this.create = function () { return $html; };
			this.start = function () {
				render();
				// applyPhoneScroll выполнялся на create — повторяем
				// на start(), когда DOM уже точно в дереве и .head
				// уже видима, чтобы max-height был корректным.
				applyPhoneScroll();
				Lampa.Controller.add('content', {
					toggle: function () {
						// Scroll body — коллекция для навигации; focus
						// в первую карточку сдвинет viewport автоматом.
						Lampa.Controller.collectionSet(scroll.render());
						// Штатный Controller.collectionFocus фильтрует
						// target по offsetParent === null — иногда
						// первая карточка ещё не полностью прошла
						// layout, и фильтр её выкидывает, оставляя
						// экран без фокуса. Идём через Navigator.focus
						// напрямую — он ставит фокус безусловно.
						var first = activeCards[0];
						if (first && window.Navigator &&
							typeof Navigator.focus === 'function') {
							try { Navigator.focus(first); } catch (_) {
								Lampa.Controller.collectionFocus(
									first || false, scroll.render());
							}
						} else {
							Lampa.Controller.collectionFocus(
								first || false, scroll.render());
						}
					},
					back: function () { Lampa.Activity.backward(); },
					// Влево — сначала по карточкам, и только с самой
					// левой уходим в боковое меню. Раньше меню
					// открывалось с любой карточки, а `right` вообще был
					// пустой заглушкой, так что ряд не листался вбок
					// совсем: с пульта дальше первой карточки было не
					// уйти. Так же устроены штатные компоненты Lampa.
					left: function () {
						if (Navigator.canmove('left')) Navigator.move('left');
						else { try { Lampa.Controller.toggle('menu'); } catch (_) {} }
					},
					right: function () {
						if (Navigator.canmove('right')) Navigator.move('right');
					},
					up: function () {
						if (Navigator.canmove('up')) Navigator.move('up');
						else { try { Lampa.Controller.toggle('head'); } catch (_) {} }
					},
					down: function () {
						if (Navigator.canmove('down')) Navigator.move('down');
					},
				});
				Lampa.Controller.toggle('content');
				// Автообновление раз в 2 сек пока идут закачки.
				self._timer = setInterval(function () {
					if (listAll().some(function (x) {
						return x.status === 'downloading' || x.status === 'queued';
					})) {
						render();
					}
				}, 2000);
			};
			this.pause = function () {};
			this.stop = function () {};
			this.render = function () { return $html; };
			this.destroy = function () {
				if (self._timer) clearInterval(self._timer);
				try { $(window).off('resize.lampabsDownloads'); } catch (_) {}
				try { scroll.destroy(); } catch (_) {}
				$html.remove();
			};
		}
		try {
			Lampa.Component.add('lampabs_downloads', DownloadsComponent);
		} catch (e) { console.log('[LampaBS downloads] component add failed', e); }

		// === Local share — «Устройства в сети» ============================
		// Экран Lampa'ы, показывающий peer'ов найденных через mDNS
		// (LocalShareDiscover.start в AndroidJS'е). Для каждого peer'а
		// подгружает /list.json и рисует список файлов как обычные
		// карточки — клик проигрывает через Lampa.Player.
		function SharePeersComponent(object) {
			var scroll = new Lampa.Scroll({ mask: true, over: true });
			var $body = $('<div class="lampabs-share" style="padding:1.5em"></div>');
			scroll.body().append($body);
			var $html = scroll.render();
			var self = this;
			var activeCards = [];
			var peers = [];

			/** Подвинуть окно за фокусом — см. тот же приём в «Загрузках». */
			function scrollToFocused(el) {
				try {
					var box = $html.find('.scroll__content')[0];
					if (!box || !el) return;
					var pad = 24;
					var b = box.getBoundingClientRect();
					var e = el.getBoundingClientRect();
					if (e.top < b.top + pad) {
						box.scrollTop -= (b.top + pad - e.top);
					} else if (e.bottom > b.bottom - pad) {
						box.scrollTop += (e.bottom - (b.bottom - pad));
					}
				} catch (_) {}
			}


			function applyPhoneScroll() {
				try {
					var $head = $('.head'), $navi = $('.navigation-bar'), minus = 0;
					if ($head.length) minus += $head[0].getBoundingClientRect().height;
					if ($navi.length && window.innerWidth <= window.innerHeight) {
						minus += $navi[0].getBoundingClientRect().height;
					}
					var maxH = Math.max(200, window.innerHeight - minus);
					$html.find('.scroll__content').css({
						'max-height': maxH + 'px', 'overflow-y': 'auto',
					});
				} catch (_) {}
			}
			applyPhoneScroll();
			$(window).on('resize.lampabsShare', applyPhoneScroll);

			function renderEmpty(msg) {
				$body.empty();
				$body.append('<div style="padding:2em;opacity:.7">' + msg + '</div>');
				activeCards = [];
			}

			function renderPeer(peer, files) {
				var $section = $('<div class="lampabs-share__peer" style="margin-bottom:2em"></div>');
				$section.append('<h2 style="margin:0 0 .8em;font-size:1.3em">' +
					peer.name + '</h2>');
				var $grid = $('<div class="lampabs-share__list" ' +
					'style="display:grid;grid-template-columns:repeat(auto-fill,' +
					'minmax(13em,1fr));gap:1.5em 1em"></div>');
				if (!files.length) {
					$grid.append('<div style="opacity:.6">Ничего не расшарено</div>');
				}
				files.forEach(function (f) {
					var poster = f.poster || './img/img_load.svg';
					var $card = $(
						'<div class="card selector" style="width:14em">' +
						'<div class="card__view" style="position:relative;padding-bottom:150%">' +
						'<img class="card__img" src="' + poster +
						'" style="object-fit:cover">' +
						'</div>' +
						'<div class="card__title" style="margin-top:.4em;font-size:.95em;' +
						'text-align:center;white-space:nowrap;overflow:hidden;' +
						'text-overflow:ellipsis">' + (f.name || 'файл') + '</div>' +
						'</div>');
					$card.on('hover:focus', function (e) { scrollToFocused(e.target); });
					$card.on('hover:enter', function () {
						try {
							Lampa.Player.play({
								url: peer.base + f.url,
								title: f.name || 'Локальный файл',
								quality: {},
							});
						} catch (e) { Lampa.Noty.show('Не удалось запустить'); }
					});
					$grid.append($card);
					activeCards.push($card[0]);
				});
				$section.append($grid);
				$body.append($section);
			}

			function refresh() {
				activeCards = [];
				$body.empty();
				if (!peers.length) {
					renderEmpty('Ищем устройства…');
					return;
				}
				peers.forEach(function (peer) {
					// Стаб для каждого peer'а пока /list.json грузится.
					var $stub = $('<div style="padding:1em;opacity:.6">' +
						peer.name + ' — загружаем список…</div>');
					$body.append($stub);
					var listUrl = peer.base + '/list.json';
					$.ajax({
						url: listUrl,
						dataType: 'json',
						timeout: 8000,
					}).done(function (list) {
						$stub.remove();
						renderPeer(peer, Array.isArray(list) ? list : []);
						setTimeout(function () {
							try {
								Lampa.Controller.collectionSet(scroll.render());
								if (activeCards[0] && window.Navigator)
									Navigator.focus(activeCards[0]);
							} catch (_) {}
						}, 50);
					}).fail(function (xhr, status, err) {
						// Показываем адрес и причину — иначе «не отвечает»
						// не даёт вообще никакой зацепки для диагностики
						// (не тот IP? порт закрыт? сервер не поднялся?).
						console.log('[LampaBS share] failed ' + listUrl +
							' status=' + status + ' err=' + (err || '') +
							' httpStatus=' + (xhr && xhr.status));
						$stub.html(
							'<div>' + peer.name + ' — не отвечает</div>' +
							'<div style="font-size:.85em;opacity:.6;margin-top:.2em">' +
							listUrl + ' · ' + (status || 'error') +
							(xhr && xhr.status ? ' (HTTP ' + xhr.status + ')' : '') +
							'</div>'
						);
					});
				});
			}

			window.__lampabsShareUpdate = function (list) {
				peers = list || [];
				refresh();
			};

			this.create = function () { return $html; };
			this.start = function () {
				applyPhoneScroll();
				try { AndroidJS.localShareDiscoverStart(); } catch (_) {}
				renderEmpty('Ищем устройства…');
				Lampa.Controller.add('content', {
					toggle: function () {
						Lampa.Controller.collectionSet(scroll.render());
						if (activeCards[0] && window.Navigator) {
							try { Navigator.focus(activeCards[0]); } catch (_) {}
						}
					},
					back: function () { Lampa.Activity.backward(); },
					// То же, что на экране «Загрузки»: вбок ходим по
					// элементам, в меню уходим только с крайнего левого.
					left: function () {
						if (Navigator.canmove('left')) Navigator.move('left');
						else { try { Lampa.Controller.toggle('menu'); } catch (_) {} }
					},
					right: function () {
						if (Navigator.canmove('right')) Navigator.move('right');
					},
					up: function () {
						if (Navigator.canmove('up')) Navigator.move('up');
						else { try { Lampa.Controller.toggle('head'); } catch (_) {} }
					},
					down: function () {
						if (Navigator.canmove('down')) Navigator.move('down');
					},
				});
				Lampa.Controller.toggle('content');
			};
			this.pause = function () {};
			this.stop = function () {};
			this.render = function () { return $html; };
			this.destroy = function () {
				try { AndroidJS.localShareDiscoverStop(); } catch (_) {}
				try { $(window).off('resize.lampabsShare'); } catch (_) {}
				try { scroll.destroy(); } catch (_) {}
				window.__lampabsShareUpdate = null;
				$html.remove();
			};
		}
		try {
			Lampa.Component.add('lampabs_share_peers', SharePeersComponent);
		} catch (e) { console.log('[LampaBS share] component add failed', e); }

		// Круговой индикатор в head-actions решили убрать — плохо
		// сочетается со стилем header'а Lampa, отвлекает. Прогресс
		// виден в разделе «Загрузки» (пункт в левом меню появляется
		// автоматически, как только начнётся первое скачивание).
		setInterval(function () { ensureMenuItem(); }, 2000);
		// Публичный хелпер: старт скачивания + мгновенный refresh меню.
		window.__lampabsDownloadStart = function (payloadJson) {
			var id = AndroidJS.downloadStart(payloadJson);
			setTimeout(function () { ensureMenuItem(); }, 300);
			return id;
		};
	})();

})();
