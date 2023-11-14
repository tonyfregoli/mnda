var has_run = false;

var height = 450;

var c_margin = {top: 15, right: 0, bottom: 15, left: 30};
    //m_margin = {top: 0, right: 0, bottom: 0, left: 0};

var c_width = $("#chart").width() - c_margin.left - c_margin.right,
    m_width = $("#map").width(); //- m_margin.left - m_margin.right;

var c_height = height - c_margin.top - c_margin.bottom;
    m_height = height; //- m_margin.top - m_margin.bottom;

var c_x = d3.scale.ordinal()
        .rangeRoundBands([0, c_width], .1);

var c_y = d3.scale.linear()
        .rangeRound([c_height,0]);

var m_categories = 4;

var m_color = d3.scale.linear()
        //.range(["lavender", "#01033A"])
        .range(["beige", "indigo"])
        //.range(["lightgrey", "navy"])
        .domain([0, m_categories - 1]); //fcol.domain([0, data.length - 1]);

var c_color = d3.scale.ordinal()
        //.range(["#d73027", "#fc8d59", "#fee090", "#ffffbf", "#e0f3f8", "#91bfdb", "#4575b4"].reverse());
        //.range(['grey', '#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850'].reverse());
        //.range(['#00B050', '#8ACD43', '#FFC000', '#FF6600', '#C00000', '#82220A', '#ACC0C6']);
        .range(['#ACC0C6', '#82220A', '#d73027', '#fc8d59', '#fee08b', '#91cf60', '#1a9850'].reverse());

var c_yAxis = d3.svg.axis()
        .scale(c_y)
        .orient("left")
        .tickSize(2, 0)
        .ticks(10, "%");

var chart = d3.select("#chart").append("svg")
        .attr("width", c_width + c_margin.left + c_margin.right)
        .attr("height", c_height + c_margin.top + c_margin.bottom)
        //.style("border", "1px solid black")
        .append("g")
        .attr("transform", "translate(" + c_margin.left + "," + c_margin.top + ")");

var map = d3.select("#map").append("svg")
        .attr("width", m_width ) //+ m_margin.left + m_margin.right)
        .attr("height", m_height); // + m_margin.top + m_margin.bottom)
        //.style("background", "lightgrey");
        //.style("border", "1px solid black");

d3.json("data/data.json", function(error, data) {
    var chart_data = data.crosstab,
        map_data = data.map;
    
    var c_placeholders = chart_data.shift();

    var c_keys = d3.keys(c_placeholders);

    c_color.domain(c_keys);

    /*$.each(d3.entries(c_placeholders), function (key, value) {
        $("#scores-form").append()
    });*/

    d3.select("#scores-form").selectAll("p")
            .data(d3.entries(c_placeholders))
            .enter().append("h6").text( function(d){return d.value;}).append("input")
            .attr("type", "text")
            .attr("name", function(d) {
                return d.key;
            })
            .attr("placeholder", "enter mark here")
            .attr("class", "scorebox form-control")
            .style("background-color", function(d){
                return c_color(d.key);
            });

    d3.select("#scores-form")
            .append("input")
            .attr("type", "button")
            .attr("id", "update")
            .attr("class","btn btn-primary navbar-btn")
            .attr("value", "Update");
    
    //console.log(c_keys);
    
    var table = d3.select("#rawdata"),
        thead = table.append("thead"),
        tbody = table.append("tbody");
        
    thead.append("tr")
        .selectAll("th")
        .data([{key:"scn",value:"SCN"}].concat(d3.entries(c_placeholders)))
        .enter()
        .append("th")
        .text(function(d){ return d.value;});
    
    var rows = tbody.selectAll("tr")
            .data(chart_data)
            .enter()
            .append("tr");
    
    var cells = rows.selectAll("td")
            .data(function(d) {return d3.entries(d);})  
            .enter()
            .append("td")
            .html(function(d) {
                if (d.key === "id") return "<b>" + d.value + "</b>";
                return (d.value * 100).toFixed(2) + "%";
            });
    
    chart_data.forEach(function(d, i) {
        y0 = 0;
        d.times = c_keys.map(function(name) {
            return {name: name, y0: y0, y1: y0 += +d[name]};
        });
        d.times.push({name: "c_scn_box", y0: 0, y1: 1});
        d.rank = i;
        d.category = m_categories + 1;
    });
    
    c_y.domain([0, 1]);
    
    c_x.domain(chart_data.map(function(d) {
        return d.id;
    }));
    
    chart.append("g")
            .attr("class", "y axis")
            //.attr("transform", "translate(0," + c_margin.top + ")")
            .call(c_yAxis);
    
    var c_scn = chart.selectAll(".c_scn")
            .data(chart_data)
            .enter()
            .append("g")
            .attr("class", "c_scn")
            .on("mouseover", function(d,i) { highlight("on","map", d);})
            .on("mouseout", function(d,i) { highlight("off","map", d);})
            .attr("transform", function(d) {
                return "translate(" + c_x(d.id) + ",0)";
            });
             
    c_scn.selectAll("rect")
            .data(function(d) {
                return d.times;
            })
            .enter().append("rect")
            .attr("width", c_x.rangeBand())
            .attr("y", function(d) {
                return c_y(d.y1);
            })
            .attr("height", function(d) {
                return c_y(d.y0) - c_y(d.y1);
            })
            .each(function(d) {
                if (d.name === "c_scn_box") {
                    d3.select(this)
                        .attr("class", function(d) {return d.name; });
                } else {
                    d3.select(this)
                        .style("fill", function(d) {return c_color(d.name); });
                }
            });
    
    c_scn.selectAll("text")
            .data(function(d) {
                return [d.id];
            })
            .enter().append("text")
            //.attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("x", -c_height + 3)
            .attr("y", c_x.rangeBand() / 2) //rotate
            .attr("transform", "rotate(-90)")
            .attr("class","label")
            .text(function(d) {
                return d;
            });
            
            
            
    /* var legend = d3.select("#chart").selectAll(".legend")
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
    */
   
    ////map
    var m_projection = d3.geo.mercator()
            .center([-3.2, 52.7])
            //.rotate([4.4, 0])
            //.parallels([50, 60])
            .scale(1900)
            .translate([m_width / 2, m_height / 2]);
    
    var m_path = d3.geo.path()
            .projection(m_projection);
    
    var m_collection = topojson.feature(map_data, map_data.objects.scn);
    
    var m_features = map.selectAll("path")
            .data(m_collection.features)
            .enter().append("path")
            .attr("d", m_path)
            .attr("class", "features");
    
    //extra layer for highlighting
    var m_features_hl = map.selectAll(".features-hl")
            .data(m_collection.features)
            .enter().append("path")
            .attr("d", m_path)
            .attr("class","features-hl")
            .on("mouseover", function(d) { highlight("on","chart", d);})
            .on("mouseout", function(d) { highlight("off","chart", d);});
    
    d3.select("#update").on("click", update);
    d3.select("#less-cat").on("click", function() {catnumber(-1);});
    d3.select("#more-cat").on("click", function() {catnumber(1);});
    
    function catnumber(n) {
        if (!(has_run) || m_categories + n < 2 || m_categories + n > 8 ) return;
        m_categories = m_categories + n;
        m_color.domain([0, m_categories - 1]); //fcol.domain([0, data.length - 1]);
        
        d3.select("#num-cat").html(m_categories);
    
        var categories = {},
            category = -1,
            step = Math.round(chart_data.length / m_categories);
    
        chart_data.map(function(d, i) {
            if (i % step === 0 && category < (m_categories - 1)) {
                category += 1;
            }
            categories[d.id] = category;
            d.category = category + 1;
        });
        
        m_features.transition()
                .duration(1500)
                .delay(function(d, i) {
                    return i * 50;
                })
                .style("fill", function(d) {
                    return m_color(categories[d.id]);
                });
                
    }
    
    function update() {
        has_run = true;
        var newScores = {};
        
        $.each($('#scores-form').serializeArray(), function(i, field) {
            newScores[field.name] = field.value;
        });
        
        chart_data.forEach(function(d) {
            d.rank = c_keys
                    .map(function(name) {
                        return d[name] * newScores[name] * 100;
                    })
                    .reduce(function(a, b) {
                        return a + b;
                    });
            //console.log(d.rank);
        });
        
        chart_data.sort(function(a, b) {
            return a.rank - b.rank;
        });
        
        var categories = {},
            category = -1,
            step = Math.round(chart_data.length / m_categories);
        
        c_x.domain(chart_data.map(function(d, i) {
            if (i % step === 0 && category < (m_categories - 1)) {
                category += 1;
            }
            categories[d.id] = category;
            d.category = category + 1;
            
            return d.id;
        }));
        
        c_scn.transition()
                .duration(1500)
                .delay(function(d, i) {
                    return i * 50;
                })
                .attr("transform", function(d) {
                    return "translate(" +c_x(d.id) + ",0)";
                });
        
         m_features.transition()
                .duration(1500)
                .delay(function(d, i) {
                    return i * 50;
                })
                .style("fill", function(d) {
                    return m_color(categories[d.id]);
                }); 
    }
    
    function highlight(action, where, data) {
        var h_scn,
            id = data.id,
            index,
            cat;
        
            if (where === "chart") {
                data = chart_data.filter(function(d){ return d.id === id; })[0];
            }
        
            if (has_run) {
                //from map
                index = chart_data.length - chart_data.indexOf(data) + "/" + chart_data.length;
                cat = m_categories - data.category + 1;
                //console.log(data);
            } else {
               index = "";
               cat = "";
            }
        
        if (action === "on") {
            // upate show data div
            $("#scn-header").text(data.id);
            var content = "";
            d3.entries(c_placeholders).forEach( function(d){ content += ( "<li class=\"list-group-item dataitem\"><span class=\"badge percentage\">" + (data[d.key] * 100).toFixed(2) + "%</span>" + d.value + "</li>");});
            $("#scn-data").html("<h6><small><ul class=\"list-group\">" + content + "</ul></small></h6>");
            $("#cat-data").html("map category: <b>" + cat + "</b>");
            $("#rank-data").html("rank: <b>" + index + "</b>" );
            
            if (where === "map") {
                h_scn = m_features_hl.filter(function(d){
                    return d.id === id;
                });
                //h_scn.style({"stroke": "#1E90FF", "stroke-opacity": 1});
                h_scn.classed("features-hl-chart-hover", true);
            } else {
                h_scn = c_scn.filter(function(d){
                    return d.id === id;
                }).select(".c_scn_box");
                //h_scn.style("stroke-opacity", 1);
                h_scn.classed("c-scn-box-map-hover", true);                
            }
        } else {
            // update show data div
            
            if (where === "map") {
                h_scn = m_features_hl.filter(function(d){
                    return d.id === id;
                });
                //h_scn.style({"stroke": "#1E90FF", "stroke-opacity": 1});
                h_scn.classed("features-hl-chart-hover", false);                
            } else {
                h_scn = c_scn.filter(function(d){
                    return d.id === id;
                }).select(".c_scn_box");
                //h_scn.style("stroke-opacity", 1);
                h_scn.classed("c-scn-box-map-hover", false);                
            }
        }
        
    }
    
});

