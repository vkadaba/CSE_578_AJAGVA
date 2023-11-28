const margin = {left: 20, right: 20, top: 20, bottom: 20};
const width = 1300;
const height = 1000;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const stroke_color = 'gray';
var gps_data, car_assignments, cc_data, loyalty_data, abila;
var tooltip, projection, map_path, selected_vehicle, selected_range;
var range_start, range_end;
var map_svg, road_group;
// Use this formatter to convert from UTC to a human readable format
// Ex: var converted = formatter(1388966400000);
// console.log(converted) --> "01/06/2014 00:00:00"
const formatter = d3.utcFormat("%a %m/%d/%Y %H:%M:%S");

const locationcoords = [
    { id: '1', name: "Brew've Been Served", x: 24.90451613035714, y: 36.055798181421736 },
    { id: '2', name: "Hallowed Grounds", x: 24.888689679563488, y: 36.06379452649173 },
    { id: '3', name: "Coffee Cameleon", x: 24.890190463690473, y:  36.05557758107501 },
    { id: '4', name: "Abila Airport", x: 24.824761392063486, y: 36.049565983623026 },
    { id: '5', name: "Kronos Pipe and Irrigation", x: 0, y: 0 },
    { id: '6', name: "Nationwide Refinery", x: 24.886097416071422,  y: 36.05723206860303 },
    { id: '7', name: "Maximum Iron and Steel", x: 24.839709543055555, y: 36.06296735606426 },
    { id: '8', name: "Stewart and Sons Fabrication", x: 0, y: 0 },
    { id: '9', name: "Carlyle Chemical Inc.", x: 24.88411910972222, y: 36.06048579260418 },
    { id: '10', name: "Coffee Shack", x: 24.858128257341267, y:  36.07493290777385},
    { id: '11', name: "Bean There Done That", x: 24.85028324940476, y: 36.08259652136187 },
    { id: '12', name: "Brewed Awakenings", x: 0, y: 0 },
    { id: '13', name: "Jack's Magical Beans", x: 24.873477185912694, y: 36.06704797913108 },
    { id: '14', name: "Katerina’s Café", x: 24.900695952579362, y:  36.05508122803398 },
    { id: '15', name: "Hippokampos", x: 0, y: 0 },
    { id: '16', name: "Abila Zacharo", x: 0, y: 0 },
    { id: '17', name: "Gelatogalore", x: 24.862971697023806,  y: 36.06103725791459 },
    { id: '18', name: "Kalami Kafenion", x: 0, y: 0 },
    { id: '19', name: "Ouzeri Elian", x: 24.87409114305555,  y: 36.0527097202977 },
    { id: '20', name: "Guy's Gyros", x: 24.901378127182536,  y: 36.05800415087927 },
    { id: '21', name: "U-Pump", x: 24.86931592083333,  y: 36.06815081389762 },
    { id: '22', name: "Frydos Autosupply n' More", x: 24.90478900019841, y:  36.05805929932343 },
    { id: '23', name: "Albert's Fine Clothing", x: 24.855945298611108,  y: 36.07559454415879, },
    { id: '24', name: "Shoppers' Delight", x: 0, y: 0 },
    { id: '25', name: "Abila Scrapyard", x: 24.846121984325393,  y: 36.075373999315616 },
    { id: '26', name: "Frank's Fuel", x: 24.84182428432539 ,y: 36.07476749780786 },
    { id: '27', name: "Chostus Hotel", x: 24.895511425595235,  y: 36.0682610965239 },
    { id: '28', name: "General Grocer", x: 24.85881043194444,  y: 36.061423281332196 },
    { id: '29', name: "Kronos Mart", x: 24.849123552579364,  y: 36.0667722680237 },
    { id: '30', name: "Octavio's Office Supplies", x: 0, y: 0 },
    { id: '31', name: "Roberts and Sons", x: 24.85342125257936,  y: 36.0644011126115 },
    { id: '32', name: "Ahaggo Museum", x: 24.87675162400793,  y: 36.07614590356074 },
    { id: '33', name: "Desafio Golf Course", x: 24.859219736706347,  y: 36.088550468088755 },
    { id: '34', name: "Daily Dealz", x: 0, y: 0 },
    { id: '35', name: "GAStech", x: 24.87675162400793,  y:  36.049565983623026},
];

document.addEventListener('DOMContentLoaded', function () {
    const import_files = [
        d3.csv('./data/gps.csv'), 
        d3.csv('./data/car-assignments.csv'),
        d3.csv('./data/cc_data.csv'),
        d3.csv('./data/loyalty_data.csv'),
        d3.json('./data/Abila.geojson')
    ];

    Promise.all(import_files).then(function (values) {
        populateOptions();
        gps_data = values[0];
        car_assignments = values[1];
        cc_data = values[2];
        loyalty_data = values[3];
        abila = values[4];

        gpsdata=gps_data
        carass = car_assignments

        dataWrangle();

        console.log("GPS data loaded.")
        console.log(gps_data);
        console.log("Car Assignments loaded.");
        console.log(car_assignments);
        console.log("Credit Card data loaded.");
        console.log(cc_data);
        console.log("Loyalty Card data loaded.");
        console.log(loyalty_data);
        console.log('Abila.geojson loaded')

      
        tooltip = d3.select("body").append("div")
            .attr("class", "myTooltip")
            .style("display", "none");

        projection = d3.geoMercator().fitSize([innerWidth, innerHeight], abila);
        map_path = d3.geoPath().projection(projection);
        
        map_svg = d3.select('#map_svg')
            .attr('class', 'map_svg')
            .attr('width', width)
            .attr('height', height);
            const locationMarkers = map_svg.append('g')
            .attr('class', 'location_markers')
            .selectAll('circle')
            .data(locationcoords)
            .enter()
            .append('circle')
                .attr('class', 'location_marker')
                .attr("transform", d => `translate(${projection([d.x, d.y])})`)
                .attr('r', 5)
                .attr('fill', 'red')
                .on("mouseenter", (event, d) => showTooltip(event, d))
                .on("mouseleave", hideTooltip);
        locationMarkers.on("click", (event, d) => {
                    drawLineGraphOnClick(d.name);
                });
                console.log("Number of locations:", locations.length);
        console.log("Locations processed:", map_svg.selectAll('circle').size());
        selectVehicle();
        initZoom();
        updateMap();
    });
});


///////////////////////////////////////////////////////
//HeartBeat Graph
function cleandatahbg() {
    carass.forEach(function(entry) {
        entry.FullName = entry.FirstName + ' ' + entry.LastName;
    });
    carass.forEach(function(entry) {
    delete entry.FirstName;
    delete entry.LastName;
    });
    gpsdata.forEach(entry => {
        //console.log(entry.Timestamp)
        entry.Timestamp = new Date(entry.Timestamp);
        });
    // Function to convert hour to time categories
    function hourConverter(x) {
    if (x >= 3 && x <= 11) {
        return 'Morning';
    } else if (x >= 11 && x <= 16) {
        return 'Lunch';
    } else if (x >= 16 && x <= 20) {
        return 'Evening';
    } else if (x > 20 && x <= 24) {
        return 'Night';
    } else if (x >= 0 && x <= 3) {
        return 'MidNight';
    } else if (x > 3 && x < 6) {
        return 'Early Morning';
    }
    }
    // Manipulate timestamp
    gpsdata.forEach(entry => {
    entry.hour = entry.Timestamp.getHours();
    entry.time = hourConverter(entry.hour);
    entry.date = entry.Timestamp.toISOString().split('T')[0]; // Extract date in YYYY-MM-DD format
    entry.is_weekend = entry.Timestamp.getDay() > 4;
    });
    // Merging datasets
    const mergedData = gpsdata.map(entry => {
    const carAssignment = carass.find(assign => assign.CarID === entry.id);
    return { ...entry, ...carAssignment };
    });
    // Taking out entries where Timestamp is not available
    const filteredData = mergedData.filter(entry => entry.Timestamp);
    // Dropping the 'CarID' property
    //filteredData.forEach(entry => delete entry.CarID);
    gpsdata.forEach(entry => {
        if (!entry.CurrentEmploymentType) {
            entry.CurrentEmploymentType = 'Facilities';
        }
        if (!entry.CurrentEmploymentTitle) {
            entry.CurrentEmploymentTitle = 'Truck Driver';
        }
        });
    const idList = [...new Set(filteredData.map(entry => entry.id))].sort();
    // Making stops
    let gpsFull = [];
    let dataStops = [];
    for (const id of idList) {
    const data = filteredData.filter(entry => entry.id === id).sort((a, b) => a.Timestamp - b.Timestamp);
    const stopList = [];
    for (let i = 0; i < data.length - 1; i++) {
        const point = data[i].Timestamp;
        const nextPoint = data[i + 1].Timestamp;
        if (nextPoint - point > 30 * 60 * 1000) { // 30 minutes in milliseconds
        stopList.push(1);
        } else {
        stopList.push(0);
        }
    }
    stopList.push(0);
    data.forEach((entry, index) => {
        entry.stop = stopList[index];
    });
    // Calculate and add stop time to dataStops
    const stopsWithData = data.filter(entry => entry.stop === 1);
    stopsWithData.forEach((entry, index, array) => {
        if (index < array.length - 1) {
        const stopTime = array[index + 1].Timestamp - entry.Timestamp;
        entry.stopTime = stopTime/60000;
        }
    });
    if (id === 101) {
        gpsFull = [...data];
        dataStops = data.filter(entry => entry.stop === 1);
    } else {
        const gpsF = [...data];
        gpsFull = [...gpsFull, ...gpsF];
        const dataS = data.filter(entry => entry.stop === 1);
        dataStops = [...dataStops, ...dataS];
    }
    }
    //console.log(dataStops)
    const threshold = 2
    const stopLoc = []
    dataStops.forEach(stopItem => {
        let closestDistance = Number.MAX_VALUE;
        let closestItem = null;
        locationcoords.forEach(locItem => {
            const distance = calculateDistance(parseFloat(stopItem.lat), parseFloat(stopItem.long), locItem.y, locItem.x)
            if (distance <= threshold && distance < closestDistance) {
                closestDistance = distance;
                closestItem = { stopItem, locItem, distance };
                }
            });

            if (closestItem) {
                stopLoc.push(closestItem);
            }
    });
    //console.log(stopLoc)
    const filteredStops = stopLoc.filter(entry => entry.distance <= 0.5)
    //console.log(filteredStops)
    const finData = filteredStops.map(item => {
        return{
            id: item.stopItem.id,
            loc: item.locItem.name,
            name: item.stopItem.FullName,
            time: item.stopItem.stopTime,
            date: item.stopItem.date,
            hour: item.stopItem.hour
        };
    });
    //console.log(finData)
    return finData
}
function filterhbgdata(hbgdata, id, date) {
    const filt_hbdata = hbgdata.filter(entry => (entry.id === id.toString() && entry.date === date.toString()));
    //console.log(filt_hbdata)
    return filt_hbdata
}
function getDetails(filhbd) {
    const det = filhbd.map(item => ({
        Shop_Name: item.loc,
        Time_Visited: `${item.hour}00 hrs`,
        Time_Spent: `${parseInt(item.time)} minutes`
    }))
    //console.log(det)
    return det
}
function plotHeartBeat() {

    d3.select("#hbg_div svg").remove();

    const hbdata = cleandatahbg();
    //console.log(hbdata)
    const svg = d3.select("#hbg_div")
			.append("svg")
			.attr("width", width-100)
			.attr("height", height-200);


    const vehicle_id = d3.select("#select-vehicle").node().value;
    const sel_date = d3.select("#dateSelector").node().value;
    //console.log(vehicle_id, sel_date)
    const filhbd = filterhbgdata(hbdata, vehicle_id, sel_date);
    // Extract hours from your data
    const hours = filhbd.map(entry => parseInt(entry.hour));
    //console.log(hours)
    // Create an array with x-axis values from 0 to 24
    const xAxisValues = Array.from({ length: 25 }, (_, i) => i);
    // Create an array indicating whether the hour exists in the data
    const spikes = xAxisValues.map(value => hours.includes(value) ? 20 : 5);
    //console.log(spikes)
    // Create scales for x and y axes
    const xScale = d3.scaleLinear()
        .domain([0, 24])
        .range([0, width-250]);

    const yScale = d3.scaleLinear()
        .domain([0, 25])  // Adjusted y-axis range to accommodate spikes
        .range([height-500, 0]);

    // Create the line function
    const line = d3.line()
                    .x((d, i) => xScale(i))
                    .y(d => yScale(d))
                    .curve(d3.curveStepAfter)
                    .curve(d3.curveCardinal.tension(0.5));

    svg.append("g")
        .attr("transform", `translate(50, 450)`)
        .call(d3.axisBottom(xScale));

    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width-750)
        .attr("y", height-510)
        .text("Time of Day");
        
    // Append the new path element to the SVG container
    svg.append("path")
        .datum(spikes)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("Stroke-width", 20)
        .attr("transform", `translate(50, 0)`)
        .attr("stroke-linejoin", "round") // Round line joins for a smoother appearance
        .attr("stroke-linecap", "round");

    svg.selectAll("image")
            .data(spikes)
            .enter()
            .append("image")
            .attr("x", (d, i) => xScale(i)+40) // Adjust the x position of the heart image
            .attr("y", (d, i) => yScale(d) - 25) // Adjust the y position of the heart image
            .attr("width", 20)
            .attr("height", 20)
            .attr("xlink:href", "data/heart.svg");


    const detailsGroup = svg.append("g")
                            .attr("transform", "translate(50, 0)");

    
    // Add a text element to display details in the top right corner
    const detailsText = detailsGroup.append("text")
        .attr("x", width - 450)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .attr("font-size", 12)
        .attr("fill", "black")
        .attr("font-family", '"Open Sans", sans-serif');
    
    // Update details text based on hbdata
    function updateDetails(filt_hbdata) {
        //const vehicle_id = d3.select("#select-vehicle").node().value;
        //const sel_date = d3.select("#dateSelector").node().value;
        const details = getDetails(filhbd)
        detailsText.text(null);
        details.forEach((item, index) => {
            detailsText.append("tspan")
                .text(`${item.Shop_Name}: Visited at ${item.Time_Visited}, (spent ${item.Time_Spent})`)
                .attr("x", 10)
                .attr("dy", index > 0 ? 15 : 0); // Add vertical spacing for each line
        });
    }
    
    // Initial call to set the initial details
    updateDetails(filhbd);
		
}




/////////////////////////////////////////////////////
function normalizeLocationName(name) {
    return name.toLowerCase()
               .replace(/[’'´`]/g, "'") 
               .replace(/[éèêë]/g, "e")
               .replace(/�s/g, "'s")
               .replace(/�/, "e")
               
}
function drawScatterPlot() {
  
    const scatterMargin = {top: 30, right: 30, bottom: 50, left: 60},
    scatterWidth = 800 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 750 - scatterMargin.top - scatterMargin.bottom;

let scatterSvg = d3.select("body").select("svg.scatterPlot");

if (scatterSvg.empty()) {
  scatterSvg = d3.select("body")
      .append("svg")
      .classed("scatterPlot", true)
      .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
      .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom)
      scatterSvg.append("rect")
      .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
      .attr("height", scatterHeight + scatterMargin.left + scatterMargin.right)
      .attr("fill", "white");
      scatterSvg = scatterSvg.append("g")
      .attr("transform", "translate(" + scatterMargin.left + "," + scatterMargin.top + ")");
} else {
  scatterSvg.select("g").selectAll("*").remove(); 
}
const xExtent = d3.extent(cc_data.concat(loyalty_data), function(d) { return d.timestamp; });
const xPadding = (xExtent[1] - xExtent[0]) * 0.05; 
const xDomainPadded = [new Date(+xExtent[0] - xPadding), new Date(+xExtent[1] + xPadding)];

const x = d3.scaleTime()
        .domain(xDomainPadded)
        .range([0, scatterWidth]);
scatterSvg.append("g")
        .attr("transform", "translate(0," + scatterHeight + ")")
        .call(d3.axisBottom(x));

const y = d3.scaleLinear()
        .domain([0, d3.max(cc_data.concat(loyalty_data), function(d) { return +d.price; })])
        .range([scatterHeight, 0]);
scatterSvg.append("g")
        .call(d3.axisLeft(y));


const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "rgba(255, 255, 255, 0.8)")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")
  .style("pointer-events", "none");


scatterSvg.selectAll("dot.cc")
  .data(cc_data)
  .enter()
  .append("circle")
  .classed("cc", true)
  .attr("cx", function(d) { return x(d.timestamp); })
  .attr("cy", function(d) { return y(d.price); })
  .attr("r", 5)
  .style("fill", "#69b3a2")
  .on("mouseover", mouseover)
  .on("mouseout", mouseout);


scatterSvg.selectAll("dot.loyalty")
  .data(loyalty_data)
  .enter()
  .append("circle")
  .classed("loyalty", true)
  .attr("cx", function(d) { return x(d.timestamp); })
  .attr("cy", function(d) { return y(d.price); })
  .attr("r", 5)
  .style("fill", "#ff6347")
  .on("mouseover", mouseover)
  .on("mouseout", mouseout);


function mouseover(event, d) {
  tooltip.transition()
      .duration(200)
      .style("opacity", .9);
  tooltip.html("Price: " + d.price + "<br/>" +
               "Location: " + (d.location || "No location data") + "<br/>" +
               "Timestamp: " + formatter(d.timestamp))
      .style("left", (event.pageX) + "px")
      .style("top", (event.pageY - 28) + "px");
}


function mouseout() {
  tooltip.transition()
      .duration(500)
      .style("opacity", 0);
}

  scatterSvg.append("g")
      .attr("transform", "translate(0," + scatterHeight + ")")
      .call(d3.axisBottom(x))
      .append("text")
      .attr("fill", "#000")
      .attr("y", 20)
      .attr("x", scatterWidth / 2)
      .attr("text-anchor", "middle")
      .text("Timestamp");

  scatterSvg.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -scatterHeight / 2)
      .attr("text-anchor", "middle")
      .text("Price");

  scatterSvg.append("text")
      .attr("x", scatterWidth / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .text("Scatter Plot of Transactions");
      const legend = scatterSvg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(' + (scatterWidth - 100) + ',30)'); // Adjust legend position

    
    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 5)
      .style('fill', '#69b3a2');

    legend.append('text')
      .attr('x', 10)
      .attr('y', 5)
      .text('Credit Card Data')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');

   
    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 20)
      .attr('r', 5)
      .style('fill', '#ff6347');

    legend.append('text')
      .attr('x', 10)
      .attr('y', 25)
      .text('Loyalty Card Data')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');
}
const baseColors = [
    "#e6194b","#3cb44b","#ffe119","#4363d8", "#f58231","#911eb4","#46f0f0","#f032e6", "#bcf60c","#fabebe", 
    "#008080","#e6beff", "#9a6324","#fffac8","#800000","#aaffc3","#808000","#ffd8b1","#000075",
    
];


function generateColorVariations(color, count) {
    const variations = [color];
    for (let i = 1; i < count; i++) {
        const variation = d3.color(color).darker(i * 0.2);
        variations.push(variation.toString());
    }
    return variations;
}

const distinctColors = baseColors.flatMap(color => generateColorVariations(color, Math.ceil(34 / baseColors.length)));


const colorScale = d3.scaleOrdinal()
    .domain(d3.range(0, 34))
    .range(distinctColors.slice(0, 34));
    
    
function showPopularLocationsByTime() {
    const combinedData = cc_data.concat(loyalty_data);
    const filteredData = combinedData.filter(d => d.timestamp >= range_start && d.timestamp <= range_end && d.location !== undefined);
    const aggregatedData = d3.rollups(
        filteredData,
        group => d3.sum(group, d => 1), 
        d => normalizeLocationName(d.location),
        d => d3.timeDay.floor(new Date(d.timestamp)) 
    );
    const formattedData = [];
    aggregatedData.forEach(([location, dates]) => {
        dates.forEach(([date, count]) => {
            formattedData.push({ location, date, count });
        });
    });

    formattedData.sort((a, b) => a.date - b.date);
    const topLocations = Array.from(d3.rollups(
        formattedData,
        group => d3.sum(group, d => d.count),
        d => d.location
    ))
    .sort((a, b) => b[1] - a[1]) 
    .slice(0, 10) //top 10 locations
    .map(d => d[0]); 
    
    drawAggregatedLineGraph(formattedData);
    highlightTopLocations(topLocations);
}



function highlightTopLocations(locations) {
    d3.selectAll('.location_marker')
        .each(function(d) {
            if(locations.includes(normalizeLocationName(d.name))) {
                d3.select(this)
                    .attr('r', 10) 
                    .attr('fill', colorScale(normalizeLocationName(d.name)));
            } else {
                d3.select(this)
                    .attr('r', 5) 
                    .attr('fill', 'red'); 
            }
        });
}
function drawAggregatedLineGraph(data) {

    const container = d3.select("#lineGraphContainer");
    const totalCountByLocation = Array.from(d3.rollups(
        data,
        g => d3.sum(g, d => d.count),
        d => d.location
    ));

    totalCountByLocation.sort((a, b) => b[1] - a[1]);
    container.selectAll("svg").remove();

    const margin = {top: 20, right: 250, bottom: 30, left: 50},
        width = 1080 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    const svg = container
        .append("svg")
        
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
        svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "white");

    const graphSvg = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);
    graphSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .range([height, 0]);
    graphSvg.append("g")
        .call(d3.axisLeft(y));
    
    graphSvg.append("text")
        .attr("transform", "rotate(-90)") 
        .attr("y", 0 - margin.left) 
        .attr("x", 0 - (height / 2)) 
        .attr("dy", "1em") 
        .style("text-anchor", "middle") 
        .text("Number of Transactions");
    const sumstat = d3.group(data, d => d.location);

    colorScale.domain(Array.from(d3.group(data, d => d.location).keys()));

    graphSvg.selectAll(".line")
        .data(sumstat)
        .join("path")
            .attr("fill", "none")
            .attr("stroke", d =>  colorScale(d[0]))
            .attr("stroke-width", 1.5)
            .attr("d", d => {
                return d3.line()
                    .x(d => x(d.date))
                    .y(d => y(d.count))
                    (d[1])
            });
            const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 40},${margin.top})`)
        .selectAll("g")
        .data(totalCountByLocation)
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d => colorScale(d[0]));

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d[0]);
    }

    function getLineGraphData(locationName) {
        const normalizedLocationName = normalizeLocationName(locationName);
        return cc_data.filter(d => 
            normalizeLocationName(d.location) === normalizedLocationName &&
            new Date(d.timestamp) >= range_start && new Date(d.timestamp) <= range_end
        ).map(d => ({
            date: new Date(d.timestamp),
            total: parseFloat(d.price)
        }));
    }

    function getLineGraphData(locationName) {
        const normalizedLocationName = normalizeLocationName(locationName);
        return cc_data.filter(d => 
            normalizeLocationName(d.location) === normalizedLocationName &&
            new Date(d.timestamp) >= range_start && new Date(d.timestamp) <= range_end
        ).map(d => ({
            date: new Date(d.timestamp),
            total: parseFloat(d.price)
        })).sort((a, b) => a.date - b.date);
    }
    
    function getLoyaltyLineGraphData(locationName) {
        const normalizedLocationName = normalizeLocationName(locationName);
        return loyalty_data.filter(d => 
            normalizeLocationName(d.location) === normalizedLocationName &&
            new Date(d.timestamp) >= range_start && new Date(d.timestamp) <= range_end
        ).map(d => ({
            date: new Date(d.timestamp),
            total: parseFloat(d.price)
        })).sort((a, b) => a.date - b.date); 
    }
function drawLineGraph(svg, locationName) {
    const filteredData = getLineGraphData(locationName).filter(d => 
        d.date >= range_start && d.date <= range_end
    );
    console.log(filteredData);
    
    const margin = {top: 20, right: 30, bottom: 50, left: 60},
          width = 600 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    svg.append("rect")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("fill", "white");

    const graphSvg = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.date))
        .range([0, width]);
    graphSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.total)])
        .range([height, 0]);
    graphSvg.append("g")
        .call(d3.axisLeft(y));

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.total))
        

    graphSvg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line)

    graphSvg.selectAll(".dot")
        .data(filteredData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.total))
        .attr("r", 5)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    
    var tooltip = d3.select("body").append("div") 
        .attr("class", "tooltip")       
        .style("opacity", 0);

    function mouseover(event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html("Price: " + d.price + "<br/>" +
                     "Timestamp: " + d3.timeFormat("%Y-%m-%d %H:%M:%S")(d.date))
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    function mouseout() {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }
    svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 + margin.left)
    .attr("x", 0 - (height / 2)) 
    .attr("dy", "-3em") 
    .style("text-anchor", "middle") 
    .text("CC Transactions");   

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.top + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(locationName);
}

        

function drawLineGraphOnClick(locationName) {
   
    const container = d3.select("#lineGraphContainer");
    container.selectAll("svg").remove();

    const svg = container.append("svg")
        .attr("width", 600)
        .attr("height", 400); 

    drawLineGraph(svg, locationName);
}
function showTooltip(event, d) {
    
    
    tooltip
        .text(d.name)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")
        .style("display", "initial");
}


function hideTooltip() {
    tooltip.style("display", "none");
}
///////////// Filtering suspicious activity for frequest stops in a route
function calculateDistance(lat1, lon1, lat2, lon2) {
               
    var R = 6371; 
    var dLat = deg2rad(lat2-lat1);
    var dLon = deg2rad(lon2-lon1); 
    var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var distance = R * c; 
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function analyzeRoutes(data) {
    const groupedData = {};
    
    const DISTANCE_THRESHOLD = 0.1; //maximum distance between two consecutive GPS points to consider the vehicle as stopped
    const TIME_THRESHOLD = 30 * 60 * 1000; //minimum time that needs to pass between two consecutive GPS records to consider it a significant stop
    const FREQUENT_STOPS_THRESHOLD = 6;// minimum number of stops required on a route to be classified as having frequent stops
    // const MAX_TIME_SPAN = 180 * 60 * 1000;//maximum time span in which to count the stops
    
    const groupedDataByDateAndId = {};

    data.forEach(point => {
        const date = new Date(point.Timestamp).toDateString(); // Extract just the date part
        const id = point.id;

        if (!groupedDataByDateAndId[date]) {
            groupedDataByDateAndId[date] = {};
        }
        if (!groupedDataByDateAndId[date][id]) {
            groupedDataByDateAndId[date][id] = [];
        }

        groupedDataByDateAndId[date][id].push(point);
    });

    const results = [];

    Object.keys(groupedDataByDateAndId).forEach(date => {
        const routesForDate = groupedDataByDateAndId[date];

        Object.keys(routesForDate).forEach(id => {
            const route = routesForDate[id];
            let stopCount = 0;
            let firstStopTime = null;
            let lastPoint = null;
            let stopTimestamps = [];

            route.forEach(point => {
                if (lastPoint) {
                    const distance = calculateDistance(
                        parseFloat(lastPoint.lat), parseFloat(lastPoint.long),
                        parseFloat(point.lat), parseFloat(point.long)
                    );
                    const timeDiff = new Date(point.Timestamp) - new Date(lastPoint.Timestamp);

                    if (distance < DISTANCE_THRESHOLD && timeDiff > TIME_THRESHOLD) {
                        {
                            stopCount++;
                            stopTimestamps.push(point.Timestamp);

                        }}
                        
                        // if (firstStopTime === null) {
                        //     firstStopTime = new Date(point.Timestamp);
                        // }}
                    // if (new Date(point.Timestamp) - firstStopTime <= MAX_TIME_SPAN) {
                    //     stopCount++;
                    //     stopTimestamps.push(point.Timestamp);
                    // }
                }
                lastPoint = point;
            });

            if (stopCount >= FREQUENT_STOPS_THRESHOLD) {
                results.push({ date, id, stopCount });
            }
        });
    });

    return results;
}
/////////////////////////////////////////////

function updateMap(option) {
var extent = d3.extent(selected_vehicle, d => {return d.timestamp});
const color = d3.scaleSequential(extent, d3.interpolatePlasma);
const size = d3.scaleSqrt().domain(extent).range([1.5, 0.5]);
const opacity = d3.scaleLinear().domain(extent).range([.35, 1]);

    map_svg.selectAll('.road_group').remove();
    

    

    var road_group = map_svg.append('g')
        .attr('class', 'road_group')
        .attr('transform', `translate(${margin.left}, 0)`);

    road_group.selectAll('.road_path')
        .data(abila.features)
        .join('path')
            .attr('class', 'road_path')
            .attr('d', map_path)
            .style('fill', 'none')
            .style('stroke', stroke_color)
            .style('stroke-width', '4px')
        .on("mouseenter", function(d, i) {
            tooltip.style("display", "initial");
        })
        .on("mousemove", function(d, i) {
            var street_info = i.properties;

            d3.select(this).style('stroke', 'gold');
            
            tooltip.html(
                street_info.Name
            )
            .style("left", (d.pageX + 5) + "px")
            .style("top", (d.pageY - 35) + "px");
        })
        .on("mouseleave", function(d) {

            d3.select(this).style('stroke', stroke_color);

            tooltip.style("display", "none")
                .html();
        });

    if (option === 'draw-gps') {
        var vehicle_group = map_svg.append('g')
            .attr('class', 'vehicle_group')
            .attr('transform', `translate(${margin.left}, 0)`);

        vehicle_group.selectAll('.vehicle_mark')
            .data(selected_vehicle)
            .join('circle')
                .attr('class', 'vehicle_mark')
                .attr("transform", d => {
                    return `translate(${projection(d.coords)})`
                })
                .attr('r', 0.75)
                // .attr('r', d => {
                //     return size(d.timestamp);
                // })
                .attr('fill', d => {
                    return color(d.timestamp);
                })
                .style('opacity', 0.85)
                // .style('opacity', d => {
                //     return opacity(d.timestamp);
                // });
            .on("mouseenter", function(d, i) {
                tooltip.style("display", "initial");
            })
            .on("mousemove", function(d, i) {
                var gps_info = i;
                var displayString = `
                    Vehicle ID: ${gps_info.CarID} <br/>
                    Time: ${formatter(gps_info.timestamp)} <br/>
                    Long, Lat: ${gps_info.coords}
                `
                
                tooltip.html(
                     displayString
                )
                .style("left", (d.pageX + 5) + "px")
                .style("top", (d.pageY - 35) + "px");
            })
            .on("mouseleave", function(d) {

                tooltip.style("display", "none")
                    .html();
            });
    }
    else if(option === "remove-gps") {
        map_svg.selectAll('.vehicle_group').remove();
    }
};

// Gets vehicle selected from dropdown and creates subset list of all
// GPS coordinates for the vehicle
function selectVehicle() {
    var vehicle_id = d3.select("#select-vehicle").node().value;
    console.log(`Currently selected vehicle: ${vehicle_id}`);
    selected_vehicle = [];

    gps_data.forEach(d => {
        if (d.CarID == vehicle_id){
            if (range_start <= d.timestamp && d.timestamp <= range_end){
                selected_vehicle.push(d);
            }
        }
    });

    // Vehicle Info
    var label = d3.select("#print-vehicle");
    var assignment = getAssignment(vehicle_id);
    var string;
    if (vehicle_id != 0 && vehicle_id <= 35) {
        string = `Assigned To: ${assignment.FirstName} ${assignment.LastName}<br/>
        Department: ${assignment.CurrentEmploymentType}<br/>
        Title: ${assignment.CurrentEmploymentTitle}
        `
    }
    else if(vehicle_id == 0){
        string = `
        Assigned To: Albina Hafon, Benito Hawelon, Claudio Hawelon, Henk Mies, Valeria Morlun, Adan Morlun, 
        Cecilia Morluniau, Irene Nant, Dylan Scozzese <br/>
        Department: Facilities <br/>
        Title: Truck Drivers <br/>
        `
    }
    else {
        string = "No assingment data found!"
    }

    label.html(string);
    
    console.log(selected_vehicle);
    map_svg.selectAll('.vehicle_group').remove();
};

function dataWrangle() {
    const routes = analyzeRoutes(gps_data);
    console.log("Suspicious Routes Analyed");
    console.log(routes);


    var utcParse = d3.utcParse('%m/%d/%Y %H:%M:%S')
    temp = gps_data.map(d => ({
        "timestamp": utcParse(d.Timestamp).getTime(),
        "CarID": +d.id,
        // Coordinate structure [long, lat] because d3 is weird
        "coords": [+d.long, +d.lat]
    }));

    gps_data = temp;

    temp = car_assignments.map(d => ({
        "CarID": +d.CarID,
        "CurrentEmploymentTitle": d.CurrentEmploymentTitle,
        "CurrentEmploymentType": d.CurrentEmploymentType,
        "FirstName": d.FirstName,
        "LastName": d.LastName
    }));

    car_assignments = temp;

    utcParse = d3.utcParse('%m/%d/%Y %H:%M')
    temp = cc_data.map(d => ({
        "last4": +d.last4ccnum,
        "location": d.location,
        "price": +d.price,
        "timestamp": utcParse(d.timestamp).getTime()
    }));

    cc_data = temp;

    utcParse = d3.utcParse('%m/%d/%Y')
    temp = loyalty_data.map(d => ({
        "location": d.location,
        "loyaltynum": +d.loyaltynum,
        "price": +d.price,
        "timestamp": utcParse(d.timestamp).getTime()
    }));

    loyalty_data = temp;
}

function getAssignment(id) {
    index = car_assignments.findIndex(d => d.CarID == id);
    if (index != -1) {
        return car_assignments[index];
    }
    else {
        return undefined;
    }
}

// Ranges are not validated!
// All time is UTC / Unix Epoch Time and must be necessarily converted!
function updateRange() {
    console.log("Time Range Updated!")
    var start_day = +d3.select('#range-start-day').node().value;
    var start_hour = +d3.select("#range-start-hours").node().value;
    range_start = start_day + start_hour;
    console.log(`Range Start: ${formatter(range_start)}`);

    var end_day = +d3.select('#range-end-day').node().value;
    var end_hour = +d3.select("#range-end-hours").node().value;
    range_end = end_day + end_hour;
    console.log(`Range End: ${formatter(range_end)}`);

    var label = d3.select("#print-range");
    var string = `Current Range: ${formatter(range_start)} - ${formatter(range_end)}`
    label.text(string);

    selectVehicle();
}

function populateOptions() {
    days = [
        Date.UTC(2014, 0, 6, 0, 0, 0),
        Date.UTC(2014, 0, 7, 0, 0, 0),
        Date.UTC(2014, 0, 8, 0, 0, 0),
        Date.UTC(2014, 0, 9, 0, 0, 0),
        Date.UTC(2014, 0, 10, 0, 0, 0),
        Date.UTC(2014, 0, 11, 0, 0, 0),
        Date.UTC(2014, 0, 12, 0, 0, 0),
        Date.UTC(2014, 0, 13, 0, 0, 0),
        Date.UTC(2014, 0, 14, 0, 0, 0),
        Date.UTC(2014, 0, 15, 0, 0, 0),
        Date.UTC(2014, 0, 16, 0, 0, 0),
        Date.UTC(2014, 0, 17, 0, 0, 0),
        Date.UTC(2014, 0, 18, 0, 0, 0),
        Date.UTC(2014, 0, 19, 0, 0, 0),
        Date.UTC(2014, 0, 20, 0, 0, 0)
    ];

    hours = [
        [0, '00:00'],
        [10800000, '03:00'],
        [21600000, '06:00'],
        [32400000, '09:00'],
        [43200000, '12:00'],
        [54000000, '15:00'],
        [64800000, '18:00'],
        [75600000, '21:00']
    ];

    ids = [];

    for (i = 0; i <= 35; ++i) {
        ids.push(i);
    }

    ids.push(101);
    ids.push(104);
    ids.push(105);
    ids.push(106);
    ids.push(107);

    var rsd = d3.select('#range-start-day');

    rsd.selectAll('option')
        .data(days)
        .enter()
        .append('option')
        .attr('value', function(d,i) {
            return days[i];
        })
        .text(function(d, i) {
            return d3.utcFormat("%m/%d/%Y")(days[i]);
        });

    var rsh = d3.select('#range-start-hours');

    rsh.selectAll('option')
        .data(hours)
        .enter()
        .append('option')
        .attr('value', function(d,i) {
            return hours[i][0];
        })
        .text(function(d, i) { 
            return hours[i][1];
        });
    
    var red = d3.select('#range-end-day');

    red.selectAll('option')
        .data(days)
        .enter()
        .append('option')
        .attr('value', function(d,i) {
            return days[i]
        })
        .text(function(d, i) { 
            return d3.utcFormat("%m/%d/%Y")(days[i]);
        });

    var reh = d3.select('#range-end-hours');

    reh.selectAll('option')
        .data(hours)
        .enter()
        .append('option')
        .attr('value', function(d,i) {
            return hours[i][0]
        })
        .text(function(d, i) { 
            return hours[i][1];
        });

    var vehicle = d3.select("#select-vehicle");

    vehicle.selectAll('option')
        .data(ids)
        .enter()
        .append('option')
        .attr('value', function(d,i) {
            return ids[i];
        })
        .text(function(d, i) { 
            return ids[i];
        });

    // Default range 01/06/2014 00:00 - 01/06/2014 00:00
    var start_day = +d3.select('#range-start-day').node().value;
    var start_hour = +d3.select("#range-start-hours").node().value;
    range_start = start_day + start_hour;

    var end_day = +d3.select('#range-end-day').node().value;
    var end_hour = +d3.select("#range-end-hours").node().value;
    range_end = end_day + end_hour;
}

let zoom = d3.zoom()
    .scaleExtent([1, 20])
    .translateExtent([[-20,-20], [width + 20, height + 20]])
    .on('zoom', handleZoom);

function handleZoom(e) {
    d3.select('.road_group')
        .attr('transform', e.transform);
    d3.select('.location_markers')
        .attr('transform', e.transform);
    d3.select('.vehicle_group')
        .attr('transform', e.transform);
}

function initZoom() {
    d3.select('.map_svg')
        .call(zoom);
}

function resetZoom() {
    d3.select('.map_svg')
        .transition()
        .call(zoom.scaleTo, 1);
}

function centerMap() {
    d3.select('.map_svg')
        .transition()
        .call(zoom.translateTo, 0.5 * innerWidth, 0.5 * innerHeight);
}