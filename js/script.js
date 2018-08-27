var countries = {};
var migration = {};
var positions = {};

var width = 900,
    height = 600;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var linearGradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "linear-gradient")
    .attr("gradientTransform", "rotate(90)");

linearGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", '#eea29a');

linearGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", '#86af49');

function initMap() {
    var projection = d3.geoNaturalEarth1()
        .scale(150)
        .translate([width / 2, height / 2])
        .precision(.1);

    var path = d3.geoPath()
        .projection(projection);

    var graticule = d3.geoGraticule();

    svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

    svg.append("use")
        .attr("class", "stroke")
        .attr("xlink:href", "#sphere");

    svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", "#sphere");

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

    d3.tsv("node_modules/world-atlas/world/110m.tsv").then(function (c) {

        for (let i in c) {
            countries[c[i]['iso_n3']] = c[i];
        }

    }).then(function () {

        Promise.all([
            d3.csv("data/dataset.csv"),
            d3.csv("data/types.csv"),
            d3.json("node_modules/world-atlas/world/110m.json")
        ])
            .then(function (v) {

                var data = v[0],
                    types = v[1],
                    world = v[2];

                for (var i in data) {
                    var r = {};

                    for (var j in data[i]) {
                        r[j] = parseInt(data[i][j]);
                    }

                    data[i] = r;
                }

                for (var i in data) {

                    if (migration[data[i].year] === undefined) {
                        migration[data[i].year] = []
                    }

                    migration[data[i].year].push(data[i]);
                }

                svg.append("path")
                    .attr("d", d3.geoPath())
                    .attr('id', 'map_path');

                svg.selectAll("#map_path")
                    .data(topojson.feature(world, world.objects.countries).features)
                    .enter().append("path")
                    .attr('class', 'country')
                    .attr('id', function (d, n) {
                        return parseInt(d.id);
                    })
                    .attr("d", path)
                    .each(function (d, i) {
                        positions[parseInt(d.id)] = this.getPointAtLength(this.getTotalLength() / 2);
                    }).call(function () {

                    console.log(svg);
                    showMigration(2016);
                }).on('mouseover', function (d, n) {

                    svg.selectAll(`.o${d.id}, .d${d.id}`)
                        .attr('display', 'block')
                }).on('mouseout', function (d, i) {
                    svg.selectAll(`.o${d.id}, .d${d.id}`)
                        .attr('display', 'none')
                })


            });
    })
}

function showMigration(year) {

    var line = d3.line();

    var data = migration[year].filter(function (m) {
        return (positions[m.origin] !== undefined) && (positions[m.country] !== undefined);
    });

    svg.selectAll('#m' + year)
        .data(data)
        .enter().append("line")
        .attr('d', line)
        .attr('class', function (m) {
            return `${'y' + year} ${'o' + m.origin} ${'d' + m.country}`
        })
        .attr('x1', function (m) {
            return positions[m.origin].x;
        })
        .attr('y1', function (m) {
            return positions[m.origin].y
        })
        .attr('x2', function (m) {
            return positions[m.country].x;
        })
        .attr('y2', function (m) {
            return positions[m.country].y;
        })
        .attr('stroke', "url(#linear-gradient)")
        .attr('display', 'none')


}

function getArc(d, s) {
    var dx = d.destination.x - d.origin.x;
    var dy = d.destination.y - d.origin.y;
    var dr = Math.sqrt(dx * dx + dy * dy);
    var spath = s == false ? ' 0 0,0 ' : ' 0 0,1 ';
    return 'M' + d.origin.x + ',' + d.origin.y + 'A' + dr + ',' + dr + spath + d.destination.x + ',' + d.destination.y;
}


initMap();