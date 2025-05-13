(function () {
	'use strict';

	function rating_imdb(card) {
		var network = new Lampa.Reguest();
		var clean_title = kpCleanTitle(card.title);
		var search_date = card.release_date || card.first_air_date || card.last_air_date || '0000';
		var search_year = parseInt((search_date + '').slice(0, 4));
		var orig = card.original_title || card.original_name;
		var imdb_url = 'https://www.omdbapi.com/';
		var apiKey = '1251fb4b';
		var params = {
			id: card.id,
			url: imdb_url,
			cache_time: 60 * 60 * 24 * 1000
		};
		getRating();

		function getRating() {
			var movieRating = _getCache(params.id);
			if (movieRating) {
				return _showRating(movieRating[params.id]);
			} else {
				searchFilm();
			}
		}

		function searchFilm() {
			let url = params.url;
			let url_by_title = Lampa.Utils.addUrlComponent(url, 't=' + encodeURIComponent(clean_title) + '&apikey=' + apiKey);
			if (card.imdb_id) url = Lampa.Utils.addUrlComponent(url, 'i=' + encodeURIComponent(card.imdb_id) + '&apikey=' + apiKey);
			else url = url_by_title;

			network.clear();
			network.timeout(15000);
			network.silent(url, function (json) {
				if (json.Response === "True") {
					chooseFilm(json);
				} else {
					chooseFilm([]);
				}
			}, function (a, c) {
				showError(network.errorDecode(a, c));
			});
		}

		function chooseFilm(data) {
			if (data && data.imdbRating) {
				var movieRating = _setCache(params.id, {
					imdb: data.imdbRating,
					timestamp: new Date().getTime()
				});
				_showRating(movieRating);
			} else {
				var movieRating = _setCache(params.id, {
					imdb: 0,
					timestamp: new Date().getTime()
				});
				_showRating(movieRating);
			}
		}

		function cleanTitle(str) {
			return str.replace(/[\s.,:;’'`!?]+/g, ' ').trim();
		}

		function kpCleanTitle(str) {
			return cleanTitle(str).replace(/^[ \/\\]+/, '').replace(/[ \/\\]+$/, '').replace(/\+( *[+\/\\])+/g, '+').replace(/([+\/\\] *)+\+/g, '+').replace(/( *[\/\\]+ *)+/g, '+');
		}

		function normalizeTitle(str) {
			return cleanTitle(str.toLowerCase().replace(/[\-\u2010-\u2015\u2E3A\u2E3B\uFE58\uFE63\uFF0D]+/g, '-').replace(/ё/g, 'е'));
		}

		function equalTitle(t1, t2) {
			return typeof t1 === 'string' && typeof t2 === 'string' && normalizeTitle(t1) === normalizeTitle(t2);
		}

		function containsTitle(str, title) {
			return typeof str === 'string' && typeof title === 'string' && normalizeTitle(str).indexOf(normalizeTitle(title)) !== -1;
		}

		function showError(error) {
			Lampa.Noty.show('IMDb: ' + error);
		}

		function _getCache(movie) {
			var timestamp = new Date().getTime();
			var cache = Lampa.Storage.cache('imdb_rating', 500, {});
			if (cache[movie]) {
				if ((timestamp - cache[movie].timestamp) > params.cache_time) {
					delete cache[movie];
					Lampa.Storage.set('imdb_rating', cache);
					return false;
				}
			} else return false;
			return cache;
		}

		function _setCache(movie, data) {
			var timestamp = new Date().getTime();
			var cache = Lampa.Storage.cache('imdb_rating', 500, {});
			if (!cache[movie]) {
				cache[movie] = data;
				Lampa.Storage.set('imdb_rating', cache);
			} else {
				if ((timestamp - cache[movie].timestamp) > params.cache_time) {
					data.timestamp = timestamp;
					cache[movie] = data;
					Lampa.Storage.set('imdb_rating', cache);
				} else data = cache[movie];
			}
			return data;
		}

		function _showRating(data) {
			if (data) {
				var imdb_rating = !isNaN(data.imdb) && data.imdb !== null ? parseFloat(data.imdb).toFixed(1) : '0.0';
				var render = Lampa.Activity.active().activity.render();
				$('.wait_rating', render).remove();
				$('.rate--imdb', render).removeClass('hide').find('> div').eq(0).text(imdb_rating);
			}
		}
	}

	function startPlugin() {
		window.rating_plugin = true;
		Lampa.Listener.follow('full', function (e) {
			if (e.type == 'complite') {
				var render = e.object.activity.render();
				if ($('.rate--imdb', render).hasClass('hide') && !$('.wait_rating', render).length) {
					$('.info__rate', render).after('<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div><div>');
					rating_imdb(e.data.movie);
				}
			}
		});
	}
	if (!window.rating_plugin) startPlugin();
})();