var xlsx = require('node-xlsx');
var fs = require('fs');

var PLACEHOLDER = '<!-- MOVIES HERE -->';

var html = '';

fs.readFile('_template.html', 'utf-8', function (err, template) {
    getPersons(function (err, persons) {
        if (err) {
            throw err;
        }

        getMovies(function (err, movies) {
            if (err) {
                throw err;
            }

            movies.forEach(function (movie, index) {
                movie.id = index;
                html += buildMovie(movie);
            });

            html += '<script>var persons = ' + JSON.stringify(persons) + ';</script>';
            template = template.replace(PLACEHOLDER, html);

            fs.writeFile('index.html', template, function (err) {
                if (err) {
                    throw err;
                }
                console.log('done');
            });
        });
    });
});

function buildMovie(movie) {
    return [
        '<div class="movie" data-params=\'' + JSON.stringify(movie) + '\'>',
            '<h3 class="movie__title">' + movie.name + '</h3>',
            '<div class="slider__container">',
                '<input class="mdl-slider mdl-js-slider" type="range" min="0" max="10" value="0"/>',
            '</div>',
            '<span class="movie__stars">-</span>',
            '<div>',
                '<span class="movie__original-title">' + movie.originalName + '</span>',
                '<span class="movie__year">' + movie.year + '</span>',
                '<span class="movie__genre">' + movie.genre + '</span>',
            '</div>',
        '</div>'
    ].join('');
}

function getTable(cellCount, name, callback) {
    var lists = xlsx.parse(__dirname + '/xlsx/' + name + '.xlsx'); 
    callback(null, lists[0].data.filter(function (row) {
        row.forEach(function (cell, i) {
            cell = cell.toString();
            row[i] = cell.replace('"', '&qout;');
            row[i] = cell.replace('\'', '&qout;');
        });
        return row.length;
    }));
}

function getSex(raw) {
    return raw === 'Мужчины' ? 'male' : 'female';
}

function getPersons(callback) {
    getTable(5, 'persons', function (err, rows) {
        if (err) {
            callback(err);
            return;
        }

        var persons = [];

        rows.forEach(function (row) {
            persons.push({
                genre: row[0],
                sex: getSex(row[1]),
                fresh: row[2],
                old: row[3],
                dependsOnTime: Boolean(row[4])
            });
        });
        callback(null, persons);
    });
}

function getMovies(callback) {
    getTable(5, 'movies', function (err, rows) {
        if (err) {
            callback(err);
            return;
        }

        var movies = [];

        rows.forEach(function (row) {
            movies.push({
                name: row[0],
                originalName: row[1],
                year: parseInt(row[2], 10),
                country: row[3],
                genre: row[4]
            });
        });
        callback(null, movies);
    });
}
