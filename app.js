function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return [].slice.call(document.querySelectorAll(selector));
}

// 20
// сколько минимально нужно выбрать фильмов
var MOVIES_MIN_COUNT = 3;

// 15
// сколько нужно выбрать фильмов, чтобы быть хейтером
var HATERS_MOVIES_MIN_COUNT = 100;

// сколько нужны выбрать фильмов одной эпохи, чтобы она учитывалась
var DEPENDS_ON_TIME_MIN_COUNT = 2;

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

document.addEventListener('DOMContentLoaded', function () {

    var moviesArr = [].slice.call($$('.movie'));
    shuffle(moviesArr);

    var moviesCount = 0;
    var moviesStep = 5;
    var moviesContainer = getMoviesContainer();;

    function getMoviesContainer() {
        var div = document.createElement('div');
        div.classList.add('movies-chunk');
        $('.container').appendChild(div);
        return div;
    }

    moviesArr.forEach(function (movie) {
        if (moviesCount === moviesStep) {
            moviesContainer = getMoviesContainer();
            moviesCount = 0;
        }

        moviesContainer.appendChild(movie);
        moviesCount++;
    });

    $$('.movies-chunk').forEach(function (chunk, i) {
        if (i === 0) {
            chunk.classList.add('visible');
        }

        chunk.setAttribute('data-chunk', i);
    });

    $$('.movie').forEach(function (movie) {
        var movieData = JSON.parse(movie.getAttribute('data-params'));
        ratings[movieData.id] = 0;
        movies[movieData.id] = movieData;
        var slider = movie.querySelector('input');
        var stars = movie.querySelector('.movie__stars');

        slider.addEventListener('change', function (evt) {
            stars.innerHTML = evt.target.value;
            onMovieSelected(movieData.id, Number(evt.target.value));
        }, false);
    });

    $('.done').addEventListener('click', function (evt) {
        var sex = confirm('Ты мужик?') ? 'male' : 'female';
        //var sex = 'male';
        var resultPerson;

        persons.forEach(function (person) {
            if (person.dependsOnTime !== dependsOnTime) {
                return;
            }

            if (person.sex !== sex) {
                return;
            }

            if (person.genre.trim().slice(0,5) !== favoriteGenre.trim().slice(0,5)) {
                return;
            }

            if (dependsOnTime) {
                if (dependsOnOldTime) {
                    resultPerson = person.old;
                } else {
                    resultPerson = person.fresh;
                }
            } else {
                resultPerson = person.fresh;
            }
        });
        $('.mdl-card').style.display = 'flex';
        $('.mdl-card__supporting-text').innerHTML = 'Ты - <b>' + resultPerson + '</b>';
        $('.game').remove();
    }, false);

    $('.more').addEventListener('click', function (evt) {
        var currentChunk = $('.visible.movies-chunk');
        currentChunk.classList.remove('visible');
        var nextChunk = currentChunk.nextSibling;

        if (nextChunk) {
            nextChunk.classList.add('visible');
            $('.demo-layout').scrollTop = 0;
        }

        if (!nextChunk.nextSibling) {
            $('.more').remove();
        }
    });
});

var movies = {};
var ratings = {};

function getMovieById(id) {
    return movies[id];
}

var max = 0;
var favoriteGenre = null;
var negativeCount = 0;
var positiveCount = 0;
var ratingsCount = 0;
var stats = {};
var dependsOnTime = false;
var dependsOnOldTime = false;
var dependsOnNewTime = false;

function onMovieSelected(id, rating) {
    max = 0;
    favoriteGenre = null;
    negativeCount = 0;
    positiveCount = 0;
    ratingsCount = 0;

    ratings[id] = rating;

    favoriteGenre = null;

    Object.keys(ratings).forEach(function (id) {
        var rating = ratings[id];

        if (rating > 0 && rating <= 5) {
            negativeCount++;
        }

        if (rating > 5) {
            positiveCount++;
        }
    });

    if (negativeCount >= HATERS_MOVIES_MIN_COUNT) {
        console.log('hater detected');
        return;
    }

    var oldMoviesCount = 0;
    var newMoviesCount = 0;

    // find favorite genre
    stats = Object.keys(ratings).reduce(function (stats, id) {
        var rating = ratings[id];
        var movie = getMovieById(id);

        if (rating > 5) {
            stats[movie.genre] = stats[movie.genre] || 0;
            stats[movie.genre]++;
        }

        if (rating > 0) {
            ratingsCount++;

            if (movie.year >= 2000) {
                newMoviesCount++;
            } else {
                oldMoviesCount++;
            }
        }

        return stats;
    }, {});

    dependsOnOldTime = oldMoviesCount >= DEPENDS_ON_TIME_MIN_COUNT;
    dependsOnNewTime = newMoviesCount >= DEPENDS_ON_TIME_MIN_COUNT;
    dependsOnTime = dependsOnOldTime || dependsOnNewTime;

    Object.keys(stats).forEach(function (genre) {
        if (max < stats[genre]) {
            max = stats[genre];
            favoriteGenre = genre;
        }
    });

    if (!favoriteGenre) {
        throw new Error('Can not calc favoriteGenre');
    }

    var ready = ratingsCount >= MOVIES_MIN_COUNT;

    if (ready) {
        $('.done').style.bottom = '20px';
    } else {
        $('.done').style.bottom = '-40px';
    }

    console.log('stats', stats);
    console.log('dependsOnTime', dependsOnTime);
    console.log('dependsOnOldTime', dependsOnOldTime);
    console.log('ratingsCount', ratingsCount);
    console.log('oldMoviesCount', oldMoviesCount);
    console.log('newMoviesCount', newMoviesCount);
    console.log('ready', ready);
}
