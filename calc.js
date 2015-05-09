function loadInput(name, defaultValue) {
    var value = url('?' + name);
    var input = document.getElementById(name)
    input.value = value !== null ? value : defaultValue;
}

loadInput('bayes-elo-0', '-1.5');
loadInput('bayes-elo-1', '4.5');
loadInput('draw-elo', '250');

var margin = {top: 10, right: 10, bottom: 80, left: 80};
var width = 640 - margin.left - margin.right;
var height = 480 - margin.top - margin.bottom;

var x = d3.scale.linear().domain([-3, 8]).range([0, width]);
var xAxis = d3.svg.axis().scale(x).orient("bottom");

var probScale = d3.scale.linear().domain([0, 1]).range([height, 0]);
var numGameScale = d3.scale.linear().domain([0, 50000]).range([height, 0]);

drawChart(d3.select('#pass-prob-chart'),
          'Pass Probability', probScale, d3.format("0.1f"));
drawChart(d3.select('#num-games-chart'),
          'Expected Number of Games', numGameScale,
          function(d) { return d/1000 + 'k'; });

displayData();

function drawChart(chart, yLabel, yScale, yFormat) {
    chart.attr("width", width + margin.left + margin.right)
         .attr("height", height + margin.top + margin.bottom)

    var plotAreas = chart.append("g")
        .attr("class", "plot-area")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    plotAreas.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    var yAxis = d3.svg.axis().scale(yScale).tickFormat(yFormat).orient("left");

    plotAreas.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    plotAreas.append("path")
        .attr("class", "line")

    drawXAxisLabel(chart, 'Elo');
    drawYAxisLabel(chart, yLabel);
}

function drawXAxisLabel(chart, text) {
    chart.append("text")
         .attr("text-anchor", "middle")
         .attr("x", margin.left + width / 2)
         .attr("y", height + margin.top)
         .attr("dy", "3em")
         .text(text);
}

function drawYAxisLabel(chart, text) {
    chart.append("text")
        .attr("text-anchor", "middle")
        .attr("y", margin.left)
        .attr("x", - margin.top - (height / 2))
        .attr("dy", "-3em")
        .attr("transform", "rotate(-90)")
        .text(text);
}

function displayData() {

    var bayesElo0 = parseFloat(document.getElementById('bayes-elo-0').value);
    var bayesElo1 = parseFloat(document.getElementById('bayes-elo-1').value);
    var drawElo = parseFloat(document.getElementById('draw-elo').value);

    var sprt = new Sprt(0.05, 0.05, bayesElo0, bayesElo1, drawElo);

    var data = [];
    for (var elo = -3; elo <= 8; elo += 0.5) {
        var bayesElo = elo / scale(drawElo);
        data.push({ 
            elo: elo,
            bayesElo: bayesElo,
            passProb: sprt.characteristics(bayesElo)[0],
            expNumGames: sprt.characteristics(bayesElo)[1]
        });
    }

    plotLine(d3.select("#pass-prob-chart .plot-area"), data,
             function(d) { return probScale(d.passProb); });
    plotLine(d3.select("#num-games-chart .plot-area"), data,
             function(d) { return numGameScale(d.expNumGames); });
    fillTable(d3.select("#table tbody"), data);
}

function plotLine(plotArea, data, y) {
    var line = d3.svg.line()
                     .interpolate("cardinal")
                     .x(function(d) { return x(d.elo); })
                     .y(y);

    plotArea.datum(data).select(".line").attr("d", line);

    var points = plotArea.selectAll("circle.point").data(data);
    points.exit().remove();
    points.enter().append("circle").attr("class", "point");
    points.attr("cx", function(d) { return x(d.elo); })
          .attr("cy", y)
          .attr("r", "2");
}

function fillTable(tbody, data) {
    var eloFormat = d3.format(".2f");
    var probFormat = d3.format("0.4f");
    var numFormat = d3.format("0f");

    var rows = tbody.selectAll("tr").data(data);
    rows.exit().remove();
    rows.enter().append("tr").html(
        "<td class=elo></td>" +
        "<td class=belo></td>" +
        "<td class=pass-prob></td>" + 
        "<td class=exp-num-games></td>");
    rows.select("td.elo").text(function(d) { return eloFormat(d.elo); });
    rows.select("td.belo").text(function(d) { return eloFormat(d.bayesElo); });
    rows.select("td.pass-prob")
        .text(function(d) { return probFormat(d.passProb); });
    rows.select("td.exp-num-games")
        .text(function(d) { return numFormat(d.expNumGames); });
}

document.getElementById('parameters').addEventListener('submit', function (e) {
    displayData();
    e.preventDefault();
});


