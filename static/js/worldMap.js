var countries;
var selectedCountries = []

export function createWorldMap(selector, demographicData) {
  {
    selectedCountries = [];

    let svgContainer = d3.select(selector)
    if (svgContainer) svgContainer.selectAll("*").remove();
    let svg = svgContainer.append('svg');

    let optWidth = svgContainer.node().getBoundingClientRect().width;
    let optHeight = svgContainer.node().getBoundingClientRect().height;

    let width = optWidth;
    let height = optHeight;


    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("perserveAspectRatio", "xMinYMid meet");

    let projection = d3.geoMercator();

    let path = d3.geoPath()
      .projection(projection);

    d3.select(".d3-tip-world").remove();

    d3.json("/static/json/countries-50m.json", function (err, worldData) {
      createMap(demographicData, worldData);
    });

    function createMap(demographicData, worldData) {

      let worldGeoJson = topojson.feature(worldData, worldData.objects.countries);
      projection.fitExtent([[0, 0], [optWidth, optHeight]], worldGeoJson)


      // .fitExtent([[0, 0], [optWidth, 0.9 *optHeight]]

      let averageLifeExpectencyData = []
      demographicData.forEach(countryData => {
        let lifeExpectancyTotal = 0;
        countryData.yearwiseData.forEach(yearlyData => {
          lifeExpectancyTotal = lifeExpectancyTotal + parseFloat(yearlyData.data.life_expectancy)
        })
        let averageLifeExpectency = lifeExpectancyTotal / countryData.yearwiseData.length
        averageLifeExpectencyData.push({
          "country_name": countryData.country_name,
          "average_life_expectency": averageLifeExpectency
        })
      })

      // console.log(averageLifeExpectencyData);

      let tip = d3.tip()
        .attr('class', 'd3-tip d3-tip-world')
        .attr("pointer-events", "none")

        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("padding", "5px")
        .style("font-size", "8px")
        .style("text-align", "center")
        .html(function (d) {
          return "<h3 style=\"margin:0\">" + d.properties.name + "</h3>" +
            "<p style=\"margin:0\"> Life expectency : " + averageLifeExpectencyData.find(el => el.country_name === d.properties.name).average_life_expectency.toFixed(2) + "</p>";
        })
      // defining color scale
      let mapColorDomain = averageLifeExpectencyData.map(el => el.average_life_expectency);
      mapColorDomain = mapColorDomain.sort((a, b) => a - b);
      // getting unique values
      mapColorDomain = mapColorDomain.filter((value, index, self) => {
        return self.indexOf(value) === index;
      })

      let colorScale = d3.scaleQuantize()
        .domain(d3.extent(mapColorDomain))
        .range(d3.schemePurples[8]);

      svg.call(tip);

      countries = svg.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(worldGeoJson.features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", function (d) {
          if (averageLifeExpectencyData.some(el => el.country_name === d.properties.name)) {
            return colorScale(averageLifeExpectencyData.find(el => el.country_name === d.properties.name).average_life_expectency);
          } else {
            return "gray"
          }
        })
        .style('stroke', 'white')
        .style("opacity", 0.8)
        .style('stroke-width', 0.3)

      countries
        .on('click', click())
        .on("mousemove", function (clickedCountry) {

          console.log("in")
          d3.select(".d3-tip-world")
          tip.show(clickedCountry);
          tip.style("top", d3.event.pageY + 10 + "px")
            .style("left", d3.event.pageX + 10 + "px")
        })
        .on("mouseout", function (clickedCountry) {
          tip.hide()
          // d3.select(".d3-tip-world")
          //   .style("opacity", 0)
        })

      let colorLegend = d3.legendColor()
        .labelFormat(d3.format(".0f"))
        .scale(colorScale)
        .orient("horizontal")
        .shapeWidth(width / 15)
        .shapeHeight(10)
        .cells(10)
        .labelOffset(-10)

      let legend = svg.append("g")
        .attr("class", "legend")
        .call(colorLegend)

      let dx = (svg.attr("width") - legend.attr("width")) / 4
      legend
        .attr("transform", "translate(" + dx + "," + height + ")")

      legend.selectAll("g.cell text")
        .style("fill", "black")
        .style("font-size", "8px")



      function click() {
        return clickedCountry => {
          if (selectedCountries.includes(clickedCountry.properties.name) && selectedCountries.length === 1) {
            countries.style("fill-opacity", 1)
            selectedCountries = [];
            let event = new CustomEvent("worldMapClicked", {
              detail: {
                "selectedCountries": selectedCountries,
              }
            });
            document.dispatchEvent(event);
          } else {
            countries.style("fill-opacity", function (country) {
              if (country.properties.name === clickedCountry.properties.name) {
                if (selectedCountries.includes(clickedCountry.properties.name)) {
                  selectedCountries = selectedCountries.filter(el => el !== clickedCountry.properties.name);
                  let event = new CustomEvent("worldMapClicked", {
                    detail:
                    {
                      "selectedCountries": selectedCountries,
                    }
                  });
                  document.dispatchEvent(event);
                  return 0.3;
                } else {

                  selectedCountries.push(clickedCountry.properties.name)
                  let event = new CustomEvent("worldMapClicked", {
                    detail:
                    {
                      "selectedCountries": selectedCountries,
                    }
                  });
                  document.dispatchEvent(event);
                  return 1;
                }
              } else {
                if (selectedCountries.includes(country.properties.name)) {
                  return 1
                } else {
                  return 0.3;
                }
              }
            })
          }
        }
      }
      // .on('mouseover', function (d) {
      //   if (d.rank > 0) {
      //     tip.show(d);
      //     d3.select(this)
      //       .style("opacity", 1)
      //       .style("stroke", "white")
      //       .style("stroke-width", 3);
      //   }


      // })
      // .on('mouseout', function (d) {
      //   tip.hide(d);
      //   d3.select(this)
      //     .style("opacity", 0.8)
      //     .style("stroke", "white")
      //     .style("stroke-width", 0.3);
      // })
      // .on('click', function (d) {
      //   if (d.rank > 0) {
      //     createBarChart(d, selected_year);
      //     createRegionCrimeStatsChart(d, selected_year);
      //   }
      // });

      // svg.append("path")
      //   .datum(topojson.mesh(data.features, function (a, b) { return a.id !== b.id; }))
      //   .attr("class", "names")
      //   .attr("d", path);
    }
  }
}


export function updateWorldMap(selector, filtereddemographicData) {


  selectedCountries = filtereddemographicData.map(el => el.country_name);


  let averageLifeExpectencyData = []
  filtereddemographicData.forEach(countryData => {
    let lifeExpectancyTotal = 0;
    if(countryData.yearwiseData.length > 0){
      countryData.yearwiseData.forEach(yearlyData => {
        lifeExpectancyTotal = lifeExpectancyTotal + parseFloat(yearlyData.data.life_expectancy)
      })
      let averageLifeExpectency = lifeExpectancyTotal / countryData.yearwiseData.length
      averageLifeExpectencyData.push({
        "country_name": countryData.country_name,
        "average_life_expectency": averageLifeExpectency
      })
    }
  })

  // defining color scale
  let mapColorDomain = averageLifeExpectencyData.map(el => el.average_life_expectency);

  mapColorDomain = mapColorDomain.sort((a, b) => a - b);

  // getting unique values
  mapColorDomain = mapColorDomain.filter((value, index, self) => {
    return self.indexOf(value) === index;
  })

  let svgContainer = d3.select(selector)
  let svg = svgContainer.select("svg");

  let colorScale = d3.scaleQuantize()
    .domain(d3.extent(mapColorDomain))
    .range(d3.schemePurples[8]);

  // countries.style("fill", "grey")



  // countries.style("fill", function(d) {
  // })

  let width = svgContainer.node().getBoundingClientRect().width;
  let height = svgContainer.node().getBoundingClientRect().height;


  d3.select("g.legend").remove();

  let colorLegend = d3.legendColor()
    .labelFormat(d3.format(".0f"))
    .scale(colorScale)
    .orient("horizontal")
    .shapeWidth(width / 15)
    .shapeHeight(10)
    .cells(10)
    .labelOffset(-10)

  let legend = svg.append("g")
    .attr("class", "legend")
    .call(colorLegend)

  let dx = (svg.attr("width") - legend.attr("width")) / 4
  legend
    .attr("transform", "translate(" + dx + "," + height + ")")

  legend.selectAll("g.cell text")
    .style("fill", "black")
    .style("font-size", "8px")


  countries.style("fill-opacity", function (country) {
    if (averageLifeExpectencyData.length == 0) {
      return 1;
    }
    
    if (averageLifeExpectencyData.some(el => el.country_name === country.properties.name)) {
      d3.select(this).style("fill", colorScale(averageLifeExpectencyData.find(el => el.country_name === country.properties.name).average_life_expectency))
      return 1;
    } else {
      d3.select(this).style("fill", "gray");
      return 0.3;
    }
  });
}