export function createMdsPlot(selector, plotData) {
    let svgContainer = d3.select(selector)
    if (svgContainer) svgContainer.selectAll("*").remove();

    let svg = svgContainer.append('svg');
    let optWidth = svgContainer.node().getBoundingClientRect().width;
    let optHeight = svgContainer.node().getBoundingClientRect().height;


    let margin = 30

    let height = optHeight - margin - margin
    let width = optWidth - margin - margin

    let tip = d3.tip()
        .attr('class', 'd3-tip d3-tip-mds')
        .attr("pointer-events", "none")

        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("padding", "5px")
        .style("font-size", "8px")
        .style("text-align", "center")
        .html(function (d) {
            return "<h3 style=\"margin:0\">" + d.country + "</h3>" +
                "<p style=\"margin:0\"> Year : " + d.year + "</p>" +
                "<p style=\"margin:0\"> Growth rate : " + d.growth_rate + "</p>" +
                "<p style=\"margin:0\"> Infant mortality : " + d.infant_mortality + "</p>" +
                "<p style=\"margin:0\"> Life expectancy : " + d.life_expectancy + "</p>" +
                "<p style=\"margin:0\"> Midyear population : " + d.midyear_population + "</p>";
        })

    svg.attr("width", optWidth)
        .attr("height", optHeight)
        .attr("viewBox", "0 0 " + optWidth + " " + optHeight)
        .attr("perserveAspectRatio", "xMinYMid meet");
    svg.call(tip)

    let dataXrange = d3.extent(plotData.map(el => parseFloat(el.x)));
    let dataYrange = [0.9 * d3.min(plotData.map(el => parseFloat(el.y))), 1.1 * d3.max(plotData.map(el => parseFloat(el.y)))];

    // Add X axis
    var x = d3.scaleLinear()
        .domain(dataXrange)
        .range([0, width]);
    // Add Y axis
    var y = d3.scaleLinear()
        .domain(dataYrange)
        .range([height, 0]);

    let focus = svg.append("g")
        .attr("height", height)
        .attr("width", width)
        .attr("transform", "translate(" + margin + "," + margin + ")")

    focus.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "mds-axis")
        .call(d3.axisBottom(x).ticks(5, "s"));


    focus.append("g")
        .attr("class", "mds-axis")
        .call(d3.axisLeft(y).ticks(10, "s"));


    // brushing

    let brushExtent = [[0, 0], [width, height]];
    let brush = d3.brush()
        .extent(brushExtent)
        .on("end", () => { });

    // focus.append("g")
    //     .attr("class", "x brush")
    //     .call(brush);


    let mds = focus.append('g')
        .attr('id', 'bubble-container')
        .style("position", "relative")
        .selectAll(".bubble")
        .data(plotData)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d.x); })
        .attr("cy", function (d) { return y(d.y); })
        .attr("r", 3)
        .style("fill", "#8d7cb4")
        .style("opacity", "0.7")
        .attr("stroke", "black")

    mds
        .on("mousemove.tooltip", function (d) {
            tip.show(d);
            tip.style("top", d3.event.pageY + 10 + "px")
                .style("left", d3.event.pageX + 10 + "px")
                .attr("z-index", 1000)
            d3.select(this).style("opacity", 1)
        })
        .on("mouseout.tooltip", function (d) {
            d3.select(".d3-tip-mds")
                .transition()
                .duration(100)
                .style("opacity", 0)
            d3.select(this).style("opacity", 0.7)

        })



    svg.selectAll('g.tick text')
        // .style('fill', "white")
        .style('fill', "rgb(237, 237, 237)")
        .style('font-size', "8px");
    svg.selectAll('g.tick line')
        // .style('fill', "white")
        .style('stroke', "#6f6f6f")
        .style('stroke-width', 0.3);
    svg.selectAll('g.mds-axis path')
        // .style('fill', "white")
        .style('stroke', "#6f6f6f")
        .style('stroke-width', 0.3);

}