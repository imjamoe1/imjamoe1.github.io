---------------------------------------------------------------------------------------------------------------------------
!Задаем приоритет рейтинга на карточке 'card__vote' (IMDB>KP>TMDB) + Единая стилизация для рейтингов на карточках!
---------------------------------------------------------------------------------------------------------------------------

||||||||||
app.js
||||||||||
...
!delete
        var vote = parseFloat((data.cub_hundred_rating || data.vote_average || 0) + '').toFixed(1);
!delete
...
+++ // Меняем приоритет сервисов рейтинга на карточке 'card__vote'. Добавляем отображеие рейтинга IMDb и КП. Приводим всё в единый стиль.
        var vote = parseFloat((data.imdb_rating || data.kp_rating || data.cub_hundred_rating || data.vote_average || 0) + '').toFixed(1);
        if (vote > 0) {
          var vote_elem = document.createElement('div');
          if (data.imdb_rating) {
            vote_elem.classList.add('card__vote', 'card__vote--imdb');
            vote_elem.innerHTML = '<span class="card__vote-label">IMDb</span><span class="card__vote-value">' + (vote >= 10 ? 10 : vote) + '</span>';
          } else if (data.kp_rating) {
            vote_elem.classList.add('card__vote', 'card__vote--kp');
            vote_elem.innerHTML = '<span class="card__vote-label">КП</span><span class="card__vote-value">' + (vote >= 10 ? 10 : vote) + '</span>';
          } else if (data.vote_average) {
            vote_elem.classList.add('card__vote', 'card__vote--tmdb');
            vote_elem.innerHTML = '<span class="card__vote-label">TMDb</span><span class="card__vote-value">' + (vote >= 10 ? 10 : vote) + '</span>';
          } else {
            vote_elem.classList.add('card__vote');
            vote_elem.innerText = data.cub_hundred_fire ? Utils$2.bigNumberToShort(data.cub_hundred_fire) : vote >= 10 ? 10 : vote;
          }
          this.card.querySelector('.card__view').appendChild(vote_elem);
        }
+++
...

||||||||||
app.css
||||||||||
... // Версия 'card__vote' с темным полупрозрачным фоном и текстом 'vote-label + vote-value' в цветовую гамму источника рейтинга
+++
.card__type {
  position: absolute;
  left: -0.8em;
  top: 1.2em;
  padding: 0.4em 0.4em;
  background: #fff;
  color: #000;
  font-size: 0.8em;
  -webkit-border-radius: 0.3em;
     -moz-border-radius: 0.3em;
          border-radius: 0.3em;
}
+++
...
+++
.card__quality {
  position: absolute;
  left: -0.8em;
  top: 3.5em;
  padding: 0.4em 0.4em;
  background: #ffe216;
  color: #000;
  font-size: 0.8em;
  -webkit-border-radius: 0.3em;
  -moz-border-radius: 0.3em;
  border-radius: 0.3em;
  text-transform: uppercase;
}
.card__vote {
  position: absolute;
  top: 0.95em;
  right: 0.3em;
  min-height: 3.25em;
  border-radius: 0.3em;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.6);
}
.card__vote--imdb .card__vote-label,
.card__vote--imdb .card__vote-value {
  background: #f5c518;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.card__vote--imdb .card__vote-label {
  border: 1px solid #f5c518;
}
.card__vote--kp .card__vote-label,
.card__vote--kp .card__vote-value {
  background: radial-gradient(140% 140% at 0 0, #ff5500 60%, #bbff00 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.card__vote--kp .card__vote-label {
  border: 1px solid #ff5500;
}
.card__vote--tmdb .card__vote-label,
.card__vote--tmdb .card__vote-value {
  background: linear-gradient(90deg, #90cea1, #01b4e4);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.card__vote--tmdb .card__vote-label {
  border: 1px solid #01b4e4;
}
.card__vote-label,
.card__vote-value {
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
.card__vote-value {
  margin-top: 0.1em;
  font-size: 1.4em;
}
.card__vote-label {
  border-radius: 0.3em;
  padding: 0.2em 0.2em;
  font-size: 1.1em;
}
.card__age {
  display: flex;
  position: absolute;
  right: 0.3em;
  bottom: 2em;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 0.9em;
  font-weight: 500;
  padding: 0.25em 0.5em;
  -webkit-border-radius: 0.3em;
     -moz-border-radius: 0.3em;
          border-radius: 0.3em;
}
+++
...
!delete // Удалем дубликат
.card__age {
}
!delete
...

||||||||||
app.css
||||||||||
... // Версия 'card__vote' с фоном в цветовую гамму источника рейтинга и белым цветом текста
+++
.card__type {
  position: absolute;
  left: -0.8em;
  top: 1.2em;
  padding: 0.4em 0.4em;
  background: #fff;
  color: #000;
  font-size: 0.8em;
  -webkit-border-radius: 0.3em;
     -moz-border-radius: 0.3em;
          border-radius: 0.3em;
}
+++
...
+++
.card__quality {
  position: absolute;
  left: -0.8em;
  top: 3.5em;
  padding: 0.4em 0.4em;
  background: #ffe216;
  color: #000;
  font-size: 0.8em;
  -webkit-border-radius: 0.3em;
  -moz-border-radius: 0.3em;
  border-radius: 0.3em;
  text-transform: uppercase;
}
.card__vote {
  position: absolute;
  top: 0.95em;
  right: 0.3em;
  min-height: 3.25em;
  border-radius: 0.3em;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card__vote--imdb {
  background: #f5c518;
}
.card__vote--kp {
  background: radial-gradient(140% 140% at 0 0, #ff5500 60%, #bbff00 100%);
}
.card__vote--tmdb {
  background: linear-gradient(90deg, #90cea1, #01b4e4);
}
.card__vote-label,
.card__vote-value {
  color: #fff !important;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
.card__vote-value {
  margin-top: 0.1em;
  font-size: 1.4em;
}
.card__vote-label {
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  border-radius: 0.3em;
  padding: 0.2em 0.2em;
  font-size: 1.1em;
}
.card__age {
  display: flex;
  position: absolute;
  right: 0.3em;
  bottom: 2em;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 0.9em;
  font-weight: 500;
  padding: 0.25em 0.5em;
  -webkit-border-radius: 0.3em;
     -moz-border-radius: 0.3em;
          border-radius: 0.3em;
}
+++
...
!delete // Удалем дубликат
.card__age {
}
!delete
...
