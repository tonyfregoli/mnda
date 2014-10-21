/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var margin = {"chart": {top: 10, right: 250, bottom: 30, left: 100}, "map": {top: 5, right: 5, bottom: 5, left: 5}};
    
var width = {"chart": w - margin.chart.left - margin.chart.right, "map": 400 - margin.map.left - margin.map.right},
    height = {"chart": 400 - margin.chart.top - margin.chart.bottom, "map": 400 - margin.map.top - margin.map.bottom};

var x = d3.scale.linear()
        .rangeRound([0, width.chart]);

var y = d3.scale.ordinal()
        .rangeRoundBands([height.chart, 0], .1);

var fcol = d3.scale.linear()
        .range(["lavender", "#01033A"]);

var numcat = 4;

var color = d3.scale.ordinal()
        //.range(["#d73027", "#fc8d59", "#fee090", "#ffffbf", "#e0f3f8", "#91bfdb", "#4575b4"].reverse());
        //.range(['grey', '#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850'].reverse());
        //.range(['#00B050', '#8ACD43', '#FFC000', '#FF6600', '#C00000', '#82220A', '#ACC0C6']);
        .range(['#ACC0C6', '#82220A', '#d73027', '#fc8d59', '#fee08b', '#91cf60', '#1a9850'].reverse());

var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(10, "%");
var chartarea = d3.select("#chart").append("svg")
        .attr("width", width.chart + margin.chart.left + margin.chart.right)
        .attr("height", height.chart + margin.chart.top + margin.chart.bottom)
        .style("border", "1px solid black")
        .append("g")
        .attr("transform", "translate(" + margin.chart.left + "," + margin.chart.top + ")");
var mapsvg = d3.select("#map").append("svg")
        .attr("width", width.map + margin.map.left + margin.map.right)
        .attr("height", height.map + margin.map.top + margin.map.bottom)
        .style("border", "1px solid black");
d3.json("data/data.json", function(error, datafile) {
    var data = datafile.crosstab,
            map = datafile.map;
    var placeholders = data.shift();
    var keys = d3.keys(placeholders);
    color.domain(keys);
    d3.select("form").selectAll("input")
            .data(d3.entries(placeholders))
            .enter().append("input")
            .attr("name", function(d) {
                return d.key;
            })
            .attr("type", "text")
            .attr("placeholder", function(d) {
                return d.value;
            });
    d3.select("form")
            .append("input")
            .attr("type", "button")
            .attr("id", "update")
            .attr("value", "Update");
    data.forEach(function(d, i) {
        x0 = 0;
        d.times = keys.map(function(name) {
            return {name: name, x0: x0, x1: x0 += +d[name]};
        });
        d.rank = i;
    });
    x.domain([0, 1]);
    y.domain(data.map(function(d) {
        return d.scn;
    }));
    //fcol.domain([0, data.length - 1]);
    fcol.domain([0, numcat]);
    chartarea.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height.chart + ")")
            .call(xAxis);
    var scn = chartarea.selectAll(".scn")
            .data(data)
            .attr("class", "scn")
            .enter().append("g")
            .attr("transform", function(d) {
                return "translate(0," + y(d.scn) + ")";
            });
    scn.selectAll("rect")
            .data(function(d) {
                return d.times;
            })
            .enter().append("rect")
            .attr("height", y.rangeBand())
            .attr("x", function(d) {
                return x(d.x0);
            })
            .attr("width", function(d) {
                return x(d.x1) - x(d.x0);
            })
            .style("fill", function(d) {
                return color(d.name);
            });
    scn.selectAll("text")
            .data(function(d) {
                return [d.scn];
            })
            .enter().append("text")
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("x", -3)
            .attr("y", y.rangeBand() / 2)
            .text(function(d) {
                return d;
            });
    var legend = d3.select("#chart").selectAll(".legend")
            .data(color.domain().slice())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
                return "translate( " + (width.chart + margin.chart.left + 24) + "," + (margin.chart.top + i * (1.1 * y.rangeBand()) + chartarea.node().getBBox().y) + ")";
            });
    legend.append("rect")
            .attr("width", y.rangeBand())
            .attr("height", y.rangeBand())
            .style("fill", color);
    legend.append("text")
            .attr("x", 24)
            .attr("y", y.rangeBand() / 2)
            .attr("dominant-baseline", "middle")
            .text(function(d) {
                return placeholders[d];
            });
    ////map
    var projection = d3.geo.mercator()
            .center([-3.2, 52.7])
            //.rotate([4.4, 0])
            //.parallels([50, 60])
            .scale(2000)
            .translate([width.map / 2, height.map / 2]);
    var path = d3.geo.path()
            .projection(projection);
    var featurecoll = topojson.feature(map, map.objects.scn);
    var features = mapsvg.selectAll(".features")
            .data(featurecoll.features)
            .enter().append("path")
            .attr("d", path);
    d3.select("#update").on("click", update);
    function update() {
        var newScores = {};
        $.each($('form').serializeArray(), function(i, field) {
            newScores[field.name] = field.value;
        });
        data.forEach(function(d) {
            d.rank = keys
                    .map(function(name) {
                        return d[name] * newScores[name] * 100;
                    })
                    .reduce(function(a, b) {
                        return a + b;
                    });
            //console.log(d.rank);
        });
        data.sort(function(a, b) {
            return a.rank - b.rank;
        });
        var categories = {},
                category = -1;
        y.domain(data.map(function(d, i) {
            if (i % numcat == 0)
                category += 1;
            categories[d.scn] = category;
            return d.scn;
        }));
        scn.transition()
                .duration(1500)
                .delay(function(d, i) {
                    return i * 50;
                })
                .attr("transform", function(d) {
                    return "translate(0," + y(d.scn) + ")";
                });
        features.transition()
                .duration(1500)
                .delay(function(d, i) {
                    return i * 50;
                })
                .style("fill", function(d) {
                    return fcol(categories[d.id]);
                });
    }

});

