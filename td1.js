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
