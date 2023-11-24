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
const formatter = d3.utcFormat("%m/%d/%Y %H:%M:%S");

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

        // Create hidden tooltip div
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
            .data(locations)
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
        selectVehicle();
        initZoom();
        updateMap();
    });
});


///////////////////////////////////////////////////////
function normalizeLocationName(name) {
    return name.toLowerCase()
               .replace(/[’'´`]/g, "'") 
               .replace(/[éèêë]/g, "e")
               .replace(/�s/g, "'s")
               .replace(/�/, "e")
               .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
}
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

    
    highlightTopLocations(topLocations);
    console.log(topLocations);
  
    drawAggregatedLineGraph(formattedData);
}
function highlightTopLocations(locations) {
    d3.selectAll('.location_marker')
        .each(function(d) {
            if(locations.includes(normalizeLocationName(d.name))) {
                d3.select(this)
                    .attr('r', 10) 
                    .attr('fill', 'gold');
            } else {
                d3.select(this)
                    .attr('r', 5) 
                    .attr('fill', 'red'); 
            }
        });
}
function drawAggregatedLineGraph(data) {

    const container = d3.select("#lineGraphContainer");

    container.selectAll("svg").remove();

    const margin = {top: 20, right: 250, bottom: 30, left: 50},
        width = 1080 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    const svg = container
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
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

    const sumstat = d3.group(data, d => d.location);

    const color = d3.scaleOrdinal()
        .domain(Array.from(sumstat.keys()))
        .range(d3.schemeCategory10);

    graphSvg.selectAll(".line")
        .data(sumstat)
        .join("path")
            .attr("fill", "none")
            .attr("stroke", d => color(d[0]))
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
            .data(Array.from(sumstat.keys()))
            .join("g")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);
    
        legend.append("rect")
            .attr("x", 0)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", color);
    
        legend.append("text")
            .attr("x", 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(d => d);
    }

function getLineGraphData(locationName) {
    const normalizedLocationName = normalizeLocationName(locationName);
    const filteredData = cc_data.filter(d => normalizeLocationName(d.location) === normalizedLocationName);
    const dataAggregated = d3.rollups(
        filteredData,
        v => d3.sum(v, leaf => parseFloat(leaf.price)), 
        d => new Date(parseInt(d.timestamp)).setHours(0, 0, 0, 0) 
    );
    const dataArray = Array.from(dataAggregated, ([date, total]) => ({ date, total }));

    return dataArray;
}

function drawLineGraph(svg, locationName) {
    const filteredData = getLineGraphData(locationName).filter(d => 
        d.date >= range_start && d.date <= range_end
    );

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

    // Line path
    graphSvg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x(d.date))
            .y(d => y(d.total))
        );
        const tooltip = d3.select(".myTooltip");
    // Nodes for individual transactions
    graphSvg.selectAll(".transaction-node")
        .data(filteredData)
        .enter()
        .append("circle")
            .attr("class", "transaction-node")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.total))
            .attr("r", 5)
            .attr("fill", "orange")
            .on("mouseover", (event, d) => {
                // Show tooltip
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`Transaction: $${d.total}<br/>Date: ${d.date}`)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                // Hide tooltip
                tooltip.transition().duration(500).style("opacity", 0);
            });

    // Location name at the bottom
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
        "localtion": d.location,
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