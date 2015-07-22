function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return [].slice.call(document.querySelectorAll(selector));
}

// сколько минимально нужно выбрать фильмов
var MOVIES_MIN_COUNT = 10;

// сколько нужно выбрать фильмов, чтобы быть хейтером
var HATERS_MOVIES_MIN_COUNT = 7;

// сколько нужны выбрать фильмов одной эпохи, чтобы она учитывалась
var DEPENDS_ON_TIME_MIN_COUNT = 6;

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
        var sex = confirm('Ты мужчина? :-)') ? 'male' : 'female';
        var result = getResult(sex);
        $('.demo-content').innerHTML += result.log;

        $('.mdl-card').style.display = 'flex';
        $('.mdl-card__supporting-text').innerHTML = 'Ты - <b class="you">' + result.person + '</b>';
        $('.game').remove();
        $('.demo-content').style.webkitUserSelect = 'initial';
        $('.demo-content').style.userSelect = 'initial';
        $('.score').remove();
        $('.demo-layout').scrollTop = 0;
    }, false);

    $('.more').addEventListener('click', function (evt) {
        var chunks = $$('.visible.movies-chunk');
        var currentChunk = chunks[chunks.length - 1];
        //currentChunk.classList.remove('visible');
        var nextChunk = currentChunk.nextSibling;

        if (nextChunk) {
            nextChunk.classList.add('visible');
            //$('.demo-layout').scrollTop = 0;
        }

        if (!nextChunk.nextSibling) {
            $('.more').remove();
        }
    });
    updateScore();
});

var movies = {};
var ratings = {};

function updateScore() {
    $('.score').innerText = ratingsCount + ' / ' + MOVIES_MIN_COUNT;
    if (ratingsCount >= MOVIES_MIN_COUNT) {
        $('.score').style.color = 'green';
    } else {
        $('.score').style.color = 'red';
    }
}

function getResult(sex, tryCount) {
    tryCount = tryCount || 0;

    var log = [];
    var resultPerson;
    log.push('<br>');
    persons.forEach(function (person) {
        if (!isHater && person.dependsOnTime !== dependsOnTime) {
            log.push('Ты не ' + person.fresh + ', потому что ' + (dependsOnTime ? 'ты зависишь от эпохи, а он нет' : 'он зависит от эпохи, а ты нет'));
            if (person.old !== person.fresh) {
                log.push('Ты не ' + person.old + ', потому что ' + (dependsOnTime ? 'ты зависишь от эпохи, а он нет' : 'он зависит от эпохи, а ты нет'));
            }
            return;
        }

        if (person.sex !== sex) {
            log.push('Ты не ' + person.fresh + ', потому что ' + (sex === 'male' ? 'ты мужчина, а она нет' : 'ты женщина, а он нет'));
            if (person.old !== person.fresh) {
                log.push('Ты не ' + person.old + ', потому что ' + (sex === 'male' ? 'ты мужчина, а она нет' : 'ты женщина, а он нет'));
            }
            return;
        }

        if (person.genre.toLowerCase().trim().slice(0,5) !== favoriteGenre.toLowerCase().trim().slice(0,5)) {
            log.push('Ты не ' + person.fresh + ', потому что твой любимый жанр - ' + favoriteGenre + ', а он - ' + person.genre);
            if (person.old !== person.fresh) {
                log.push('Ты не ' + person.old + ', потому что твой любимый жанр - ' + favoriteGenre + ', а он - ' + person.genre);
            }
            return;
        }

        resultPerson = dependsOnOldTime ? person.old : person.fresh;
    });

    if (!resultPerson) {
        if (tryCount > 1) {
            console.log('fail :(');
            return {
                log: log.join('<br>'),
                person: 'Валли'
            };
        }
        dependsOnTime = !dependsOnTime;
        return getResult(sex, ++tryCount);
    }

    return {
        person: resultPerson,
        log: log.join('<br>')
    };
}

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
var isHater = false;

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

    if (negativeCount >= HATERS_MOVIES_MIN_COUNT) {
        console.log('hater detected');
        favoriteGenre = 'Персонаж-хейтер';
        isHater = true;
    } else {
        isHater = false;
    }

    var ready = ratingsCount >= MOVIES_MIN_COUNT;

    if (ready) {
        $('.done').style.bottom = '20px';
    } else {
        $('.done').style.bottom = '-74px';
    }

    console.log('stats', stats);
    console.log('dependsOnTime', dependsOnTime);
    console.log('dependsOnOldTime', dependsOnOldTime);
    console.log('ratingsCount', ratingsCount);
    console.log('oldMoviesCount', oldMoviesCount);
    console.log('newMoviesCount', newMoviesCount);
    console.log('ready', ready);
    console.log('============');
    console.log('>>>>>>>>> male', getResult('male').person);
    console.log('>>>>>>>>> female', getResult('female').person);
    updateScore();
}
