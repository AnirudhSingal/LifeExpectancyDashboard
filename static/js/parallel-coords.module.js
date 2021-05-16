var svg;
var plotLine;
var height, width, x, scales;
var dimensions = [
    "average_total_fertility_rate",
    "average_infant_mortality",
    "average_growth_rate",
    "average_midyear_population",
    "average_life_expectancy",
]

let selectedBrushExtents = {};

let dragging = {};


export function createParallelCoordsPlot(selector, demographicData) {


    dimensions.forEach(d => {
        selectedBrushExtents[d] = [];
    })

    let svgContainer = d3.select(selector)
    if (svgContainer) svgContainer.selectAll("*").remove();

    svg = svgContainer.append('svg')

    let optWidth = svgContainer.node().getBoundingClientRect().width;
    let optHeight = svgContainer.node().getBoundingClientRect().height;

    d3.select(".d3-tip-parallel").remove();

    let tip = d3.tip()
        .attr('class', 'd3-tip d3-tip-parallel')
        .attr("pointer-events", "none")

        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("padding", "5px")
        .style("text-align", "center")
        .style("font-size", "8px")

        .html(function (d) {
            return ("<h3 style=\"margin:0\">" + d.country_name + "</h3>" +
                "<p style=\"margin:0\">Average fertility rate : " + d.average_total_fertility_rate.toFixed(2) + "</p>" +
                "<p style=\"margin:0\">Average infant mortality : " + d.average_infant_mortality.toFixed(2) + "</p>" +
                "<p style=\"margin:0\">Average growth rate : " + d.average_growth_rate.toFixed(2) + "</p>" +
                "<p style=\"margin:0\">Average midyear population : " + d.average_midyear_population.toFixed(2) + "</p>" +
                "<p style=\"margin:0\">Average life expectancy : " + d.average_life_expectancy.toFixed(2) + "</p>"
            )
        })

    // set the dimensions and margins of the graph
    let margin = 30;
    width = optWidth - margin - margin;
    height = optHeight - margin - margin;
    svg.attr("width", optWidth)
        .attr("height", optHeight);

    svg = svg.append("g")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin + "," + margin + ")");


    svg.call(tip);

    scales = [];

    let data = getParallelCoordData(demographicData)

    dimensions.forEach(dimension => {

        let max = d3.max(data.map(d => d[dimension]));
        let min = d3.min(data.map(d => d[dimension]));
        let margin = (max - min) * 0.1;
        scales.push({
            "dimension": dimension,
            "scale": d3.scaleLinear()
                .domain([min - margin, max + margin])
                .range([height, 0])
        })
    })

    // Build the X scale -> it find the best position for each Y axis
    x = d3.scalePoint()
        .range([0, width])
        .padding(1)
        .domain(dimensions);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {
        return d3.line()(scales.map((scaleArray) => {
            let dimension = scaleArray.dimension;
            let scale = scaleArray.scale;
            return [x(dimension), scale(d[dimension])];
        }));
    }

    // Draw the lines
    plotLine = svg
        .selectAll("myPath")
        .data(data)
        .enter().append("path")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", "#8d7cb4")
        .style("opacity", 0.5)
        .style("stroke-width", 0.7)


    plotLine
        .on("mouseenter.tooltip", function (d) {
            if (!d.isHidden) {
                tip.show(d);

                d3.select(this).style("opacity", 1)
                    .style("stroke-width", 1.5)
                    .style("stroke", "white")
                tip.style("top", d3.event.pageY + 10 + "px")
                    .style("left", d3.event.pageX + 10 + "px")
            }
        })
        .on("mouseleave.tooltip", function (d) {
            d3.select(".d3-tip-parallel")
                .style("opacity", 0)
            if (!d.isHidden) {
                d3.select(this).style("opacity", 0.5)
                    .style("stroke-width", 0.7)
                    .style("stroke", "#8d7cb4")
            }

        })


    // Draw the axis:
    let axis = svg.selectAll(".myAxis")
        .data(dimensions).enter()
        .append("g")
        .attr("class", "parallel-axis")
        .call(d3.drag()
            .subject(function (d) { return { x: x(d) }; })
            .on("start", function (d) {
                dragging[d] = x(d);
            })
            .on("drag", function (d) {
                dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                axis.attr("d", path);
                dimensions.sort(function (a, b) { return position(a) - position(b); });
                x.domain(dimensions);
                d3.select(this).attr("transform", function (d) { return "translate(" + position(d) + ")"; })
            })
            .on("end", function (d) {
                delete dragging[d];
                transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                transition(axis).attr("d", path);
            }));


    // Add a brush for each axis
    axis.
        each(function (d) {
            d3.select(this).append("g", "path.domain")
                .attr("class", "brush")
                .attr("z-index", 1000)
                .call(d3.brushY().extent([[- 10, 0], [10, height]]).on("brush end", brush));
        })



    // translate this element to its right position on the x axis
    axis.attr("transform", function (d) { return "translate(" + x(d) + ")"; })
        // And I build the axis with the call function
        .each(function (d) { d3.select(this).call(d3.axisLeft().scale(scales.find(el => el.dimension === d).scale)); })
        // Add axis title
        .append("text")
        .style("text-anchor", "middle")
        .style("fill", "white")
        .attr("y", function (d, i) {
            if (i % 2 == 0) {
                return -9
            } else {
                return height + 9
            }
        })
        .text(function (d) {
            let words = d.split('_')
            words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            return words.join(' ');
        })


    // .selectAll("rect")
    // .attr("x", -8)
    // .attr("width", 16)

    svg.selectAll('g.tick text')
        // .style('fill', "white")
        .style('fill', "rgb(237, 237, 237)")
        .style('font-size', "8px");
    svg.selectAll('g.tick line')
        // .style('fill', "white")
        .style('stroke', "#6f6f6f")
        .style('stroke-width', 0.3);
    svg.selectAll('g.parallel-axis path')
        // .style('fill', "white")
        .style('stroke', "#6f6f6f")
        .style('stroke-width', 0.3);
}

function transition(g) {
    return g.transition().duration(500);
  }
function getParallelCoordData(demographicData) {
    let data = [];
    demographicData.forEach(countryData => {
        let growth_rate = 0
        let life_expectancy = 0
        let midyear_population = 0
        let total_fertility_rate = 0
        let infant_mortality = 0
        countryData.yearwiseData.forEach(yearlyData => {
            growth_rate = growth_rate + parseFloat(yearlyData.data.growth_rate);
            life_expectancy = life_expectancy + parseFloat(yearlyData.data.life_expectancy);
            midyear_population = midyear_population + parseFloat(yearlyData.data.midyear_population);
            total_fertility_rate = total_fertility_rate + parseFloat(yearlyData.data.total_fertility_rate)
            infant_mortality = infant_mortality + parseFloat(yearlyData.data.infant_mortality)
        });
        let count = countryData.yearwiseData.length
        data.push({
            "country_name": countryData.country_name,
            "average_growth_rate": (growth_rate / count),
            "average_life_expectancy": (life_expectancy / count),
            "average_midyear_population": (midyear_population / count),
            "average_total_fertility_rate": (total_fertility_rate / count),
            "average_infant_mortality": (infant_mortality / count),
            "isHidden": false,
        })
    })
    return data;
}



function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

function brush(d) {
    let brushArray = d3.event.selection;
    if (brushArray) {
        selectedBrushExtents[d] = brushArray;
        plotLine.style("stroke-opacity", function (line) {
            let lineOpacity;
            let _isHidden;
            for (const [key, value] of Object.entries(selectedBrushExtents)) {
                if (value.length !== 0) {
                    let countryVal = scales.find(el => el.dimension === key).scale(line[key])
                    if ((countryVal >= value[0]) && (countryVal <= value[1])) {
                        lineOpacity = 0.8;
                        _isHidden = false;
                    } else {
                        lineOpacity = 0;
                        _isHidden = true;
                        break;
                    }
                }
            }
            line.isHidden = _isHidden;
            d3.select(this).style("opacity", lineOpacity)
            return lineOpacity;
        })
    } else {
        selectedBrushExtents[d] = []
        plotLine.style("stroke-opacity", function (line) {
            let lineOpacity;
            let _isHidden;
            for (const [key, value] of Object.entries(selectedBrushExtents)) {
                if (value.length !== 0) {
                    let countryVal = scales.find(el => el.dimension === key).scale(line[key])
                    if ((countryVal >= value[0]) && (countryVal <= value[1])) {
                        lineOpacity = 0.8;
                        _isHidden = false;
                    } else {
                        lineOpacity = 0;
                        _isHidden = true;
                        break;
                    }
                }
            }
            line.isHidden = _isHidden;
            d3.select(this).style("opacity", lineOpacity)
            return lineOpacity;
        })
    }
}