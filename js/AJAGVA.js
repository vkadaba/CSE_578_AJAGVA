const margin = {left: 10, right: 10, top: 10, bottom: 10};
const width = 1000;
const height = 800;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
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
        d3.csv('data/gps.csv'), 
        d3.csv('data/car-assignments.csv'),
        d3.csv('data/cc_data.csv'),
        d3.csv('data/loyalty_data.csv'),
        d3.json('data/Abila.geojson')
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
            .attr('width', width)
            .attr('height', height);
        
        drawRoadMap();
        selectVehicle();
    });
});

function drawRoadMap(option) {
    var road_group = map_svg.append('g')
        .attr('class', 'road_group')
        .attr('transform', `translate(${margin.left}, 0)`);

    road_group.selectAll('.road_path')
        .data(abila.features)
        .enter().append('path')
            .attr('class', 'road_path')
            .attr('d', map_path)
            .style('fill', 'none')
            .style('stroke', 'black')
            .style('stroke-width', '3px')
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

            d3.select(this).style('stroke', 'black');

            tooltip.style("display", "none")
                .html();
        });
};

function plotPath(option) {
    // var extent = d3.extent(selected_vehicle, d => {return d.timestamp});
    var size = [0, selected_vehicle.length];
    const color = d3.scaleSequential(size, d3.interpolateViridis);
    
    if (option === undefined) {
        var vehicle_group = map_svg.append('g')
            .attr('class', 'vehicle_group')
            .attr('transform', `translate(${margin.left}, 0)`);

        vehicle_group.selectAll('.vehicle_mark')
            .data(selected_vehicle)
            .enter().append('circle')
                .attr('class', 'vehicle_mark')
                .attr("transform", d => {
                    return `translate(${projection(d.coords)})`
                })
                .attr('r', 3)
                .attr('fill', (d,i) => {
                    return color(i);
                });
    }
    else if(option === "remove") {
        map_svg.selectAll('.vehicle_group').remove();
    }
}

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

    console.log(selected_vehicle);
};

function dataWrangle() {
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
        "loyaltynum": d.loyaltynum,
        "price": +d.price,
        "timestamp": utcParse(d.timestamp).getTime()
    }));

    loyalty_data = temp;
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
        [21600000, '06:00'],
        [43200000, '12:00'],
        [64800000, '18:00']
    ];

    ids = [];

    for (i = 0; i <= 35; ++i) {
        ids.push(i);
    }

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