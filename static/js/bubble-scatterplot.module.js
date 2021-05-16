
var bubble;

var x, y, z;

var width, height;

export function createBubbleScatterplot(selector, demographicData) {

    let svgContainer = d3.select(selector)
    if (svgContainer) svgContainer.selectAll("*").remove();

    let svg = svgContainer.append('svg');
    let optWidth = svgContainer.node().getBoundingClientRect().width;
    let optHeight = svgContainer.node().getBoundingClientRect().height;
    d3.select(".d3-tip-bubble").remove();
    let tip = d3.tip()
        .attr('class', 'd3-tip d3-tip-bubble')
        .attr("pointer-events", "none")

        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("padding", "5px")
        .style("font-size", "8px")

        .style("text-align", "center")
        .html(function (d) {
            return ("<h3 style=\"margin:0\">" + d.country_name + "</h3>" +
                "<p style=\"margin:0\">Average growth rate : " + d.average_growth_rate + "</p>" +
                "<p style=\"margin:0\">Average life expectancy : " + d.average_life_expectancy + "</p>" +
                "<p style=\"margin:0\">Average midyear population : " + d.average_midyear_population + "</p>")
        })

    let margin = 30

    let height = optHeight - margin - margin
    let width = optWidth - margin - margin

    svg.attr("width", optWidth)
        .attr("height", optHeight)
        .attr("viewBox", "0 0 " + optWidth + " " + optHeight)
        .attr("perserveAspectRatio", "xMinYMid meet");


    let data = [];
    demographicData.forEach(countryData => {
        let growth_rate = 0
        let life_expectancy = 0
        let midyear_population = 0
        countryData.yearwiseData.forEach(yearlyData => {
            growth_rate = growth_rate + parseFloat(yearlyData.data.growth_rate);
            life_expectancy = life_expectancy + parseFloat(yearlyData.data.life_expectancy);
            midyear_population = midyear_population + parseFloat(yearlyData.data.midyear_population);
        });
        let count = countryData.yearwiseData.length
        data.push({
            "country_name": countryData.country_name,
            "average_growth_rate": (growth_rate / count).toFixed(2),
            "average_life_expectancy": (life_expectancy / count).toFixed(2),
            "average_midyear_population": (midyear_population / count).toFixed(2),
        })
    })


    let dataXrange = d3.extent(data.map(el => parseFloat(el.average_growth_rate)));
    let dataYrange = d3.extent(data.map(el => parseFloat(el.average_life_expectancy)));
    let dataZrange = d3.extent(data.map(el => parseFloat(el.average_midyear_population)));


    if (data.length === 1) {
        let growthRate = parseFloat(data[0].average_growth_rate);
        let absoluteGrowthRate = Math.abs(growthRate);
        let lifeExpectancy = parseFloat(data[0].average_life_expectancy);
        let absoluteLifeExpectancy = Math.abs(lifeExpectancy);
        let midyearPop = parseFloat(data[0].average_midyear_population);
        let absoluteMidyearPop = Math.abs(midyearPop);
        dataXrange = [growthRate - absoluteGrowthRate, growthRate + absoluteGrowthRate];
        dataYrange = [lifeExpectancy - absoluteLifeExpectancy, lifeExpectancy + absoluteLifeExpectancy]
        dataZrange = [midyearPop - absoluteMidyearPop, midyearPop + absoluteMidyearPop]
    } else {
        let xDiff = dataXrange[1] - dataXrange[0]
        dataXrange = [
            dataXrange[0] - xDiff / 10,
            dataXrange[1] + xDiff / 10,
        ]
    }


    // Add X axis
    x = d3.scaleLinear()
        .domain(dataXrange)
        .range([0, width]);
    // Add Y axis
    y = d3.scaleLinear()
        .domain(dataYrange)
        .range([height, 0]);
    // Add a scale for bubble size
    z = d3.scaleLinear()
        // .domain([200000, 1310000000])
        .domain(dataZrange)
        .range([3, 30]);



    let focus = svg.append("g")
        .attr("height", height)
        .attr("width", width)
        .attr("transform", "translate(" + margin + "," + margin + ")")

    focus.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "bubble-axis")
        .call(d3.axisBottom(x));


    focus.append("g")
        .attr("class", "bubble-axis")
        .call(d3.axisLeft(y));



    // brushing

    let brushExtent = [[0, 0], [width, height]];
    let brush = d3.brush()
        .extent(brushExtent)
        .on("end", brushend);

    focus.append("g")
        .attr("class", "x brush")
        .call(brush);


    // Add dots
    let dataSortedByAverageMidyearPopulation = data.sort((a, b) => {
        return b.average_midyear_population - a.average_midyear_population
    })
    bubble = focus.append('g')
        .attr('id', 'bubble-container')
        .style("position", "relative")
        .selectAll(".bubble")
        .data(dataSortedByAverageMidyearPopulation)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d.average_growth_rate); })
        .attr("cy", function (d) { return y(d.average_life_expectancy); })
        .attr("r", function (d) { return z(d.average_midyear_population); })
        .style("fill", "#8d7cb4")
        .style("opacity", "0.7")
        .attr("stroke", "black")


    // .style("background-color", "white")
    // .style("border", "solid")
    // .style("border-width", "1px")
    // .style("border-radius", "5px")
    // .style("padding", "10px")


    bubble.call(tip)


    bubble
        .on("mousemove.tooltip", function (d) {
            console.log("in");
            tip.show(d);
            tip.style("top", d3.event.pageY + 10 + "px")
                .style("left", d3.event.pageX + 10 + "px")
            d3.select(this).style("opacity", 1)
        })
        .on("mouseout.tooltip", function (d) {
            d3.select(".d3-tip-bubble")
                .style("opacity", 0)
            d3.select(this).style("opacity", 0.7)

        })

    svg.append("text")
        .attr("class", "y axis title")
        .text("Life expectancy")
        .attr("x", 0)
        .attr("y", 10)
        .attr("dy", "2em")
        // .attr("transform", "rotate(-90)")
        // .style("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "10px");

    svg.append("text")
        .attr("class", "x axis title")
        .text("Growth rate")
        .attr("x", width)
        .attr("y", height)
        .attr("dy", "2em")
        // .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "10px");


    svg.selectAll('g.tick text')
        .style('fill', "white")
        .style('font-size', "8px");
    svg.selectAll('g.tick line')
        .style('stroke', "white")
        .style('stroke-width', 0.3);
    svg.selectAll('g.bubble-axis path')
        .style('stroke', "white")
        .style('stroke-width', 0.3);

    function brushend() {
        let b = d3.event.selection;
        let selectedData = []
        if (b != null) {
            let Xmax = x.invert(d3.max(b.map(el => el[0])))
            let Xmin = x.invert(d3.min(b.map(el => el[0])))
            let Ymax = y.invert(d3.min(b.map(el => el[1])))
            let Ymin = y.invert(d3.max(b.map(el => el[1])))

            // add to selected data array if the origin of bubble lies inside the selection
            data.forEach(dataPoint => {
                let cx = dataPoint.average_growth_rate;
                let cy = dataPoint.average_life_expectancy;
                if ((cx < Xmax && cx > Xmin) && (cy < Ymax && cy > Ymin)) {
                    selectedData.push(dataPoint);
                }
            })
            bubble.attr("fill-opacity", function (d) {

                if (selectedData.some(el => el.country_name === d.country_name)) {

                    d3.select(this).attr("stroke-opacity", 1)
                    return 1;
                } else {
                    d3.select(this).attr("stroke-opacity", 0.1)
                    return 0.1;
                }
            });

            let event = new CustomEvent("bubblePlotBrushed", {
                detail: {
                    "selectedCountries": selectedData.map(el => el.country_name)
                }
            });
            document.dispatchEvent(event);
        } else {
            bubble.attr("fill-opacity", function (d) {

                d3.select(this).attr("stroke-opacity", 1)
                return 1;
            });
            selectedData = data
            let event = new CustomEvent("bubblePlotBrushed", {
                detail: {
                    "selectedCountries": []
                }
            });
            document.dispatchEvent(event);
        }
    }
}

// export function updateBubbleScatterplot(filteredDemographicData) {

//     let data = [];
//     filteredDemographicData.forEach(countryData => {
//         let growth_rate = 0
//         let life_expectancy = 0
//         let midyear_population = 0
//         countryData.yearwiseData.forEach(yearlyData => {
//             growth_rate = growth_rate + parseFloat(yearlyData.data.growth_rate);
//             life_expectancy = life_expectancy + parseFloat(yearlyData.data.life_expectancy);
//             midyear_population = midyear_population + parseFloat(yearlyData.data.midyear_population);
//         });
//         let count = countryData.yearwiseData.length
//         data.push({
//             "country_name": countryData.country_name,
//             "average_growth_rate": (growth_rate / count).toFixed(2),
//             "average_life_expectancy": (life_expectancy / count).toFixed(2),
//             "average_midyear_population": (midyear_population / count).toFixed(2),
//         })
//     })
//     let dataXrange = d3.extent(data.map(el => parseFloat(el.average_growth_rate)));
//     let dataYrange = d3.extent(data.map(el => parseFloat(el.average_life_expectancy)));
//     let dataZrange = d3.extent(data.map(el => parseFloat(el.average_midyear_population)));



//     if (data.length === 1) {
//         let growthRate = parseFloat(data[0].average_growth_rate);
//         let absoluteGrowthRate = Math.abs(growthRate);

//         let lifeExpectancy = parseFloat(data[0].average_life_expectancy);
//         let absoluteLifeExpectancy = Math.abs(lifeExpectancy);
        
//         let midyearPop = parseFloat(data[0].average_midyear_population);
//         let absoluteMidyearPop = Math.abs(midyearPop);

//         dataXrange = [growthRate - absoluteGrowthRate, growthRate + absoluteGrowthRate];
//         dataYrange = [lifeExpectancy - absoluteLifeExpectancy, lifeExpectancy + absoluteLifeExpectancy]
//         dataZrange = [midyearPop - absoluteMidyearPop, midyearPop + absoluteMidyearPop]

//     } else {
//         let xDiff = dataXrange[1] - dataXrange[0]
//         dataXrange = [
//             dataXrange[0] - xDiff / 10,
//             dataXrange[1] + xDiff / 10,
//         ]
//     }
//     console.log(dataYrange);

//     x = d3.scaleLinear()
//         .domain(dataXrange)
//         .range([0, width]);
//     y = d3.scaleLinear()
//         .domain(dataYrange)
//         .range([height, 0]);
//     z = d3.scaleLinear()
//         .domain(dataZrange)
//         .range([2, 40]);

//     bubble.attr("cx", function (d) { return x(d.average_growth_rate); })
//         .attr("cy", function (d) { return y(d.average_life_expectancy); })
//         .attr("r", function (d) { return z(d.average_midyear_population); })

//     bubble.attr("fill-opacity", function (d) {
//         if (filteredDemographicData.some(el => el.country_name === d.country_name)) {
//             d3.select(this).attr("stroke-opacity", 1)
//             return 1;
//         } else {
//             d3.select(this).attr("stroke-opacity", 0.1)
//             return 0.1;
//         }
//     });
// }