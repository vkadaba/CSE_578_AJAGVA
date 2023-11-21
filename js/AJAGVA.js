const margin = {left: 10, right: 10, top: 10, bottom: 10};
const width = 1000;
const height = 800;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
var gps_data, car_assignments, cc_data, loyalty_data, abila;
var tooltip, projection, map_path, selected_vehicle;


document.addEventListener('DOMContentLoaded', function () {
    const import_files = [
        d3.csv('data/gps.csv'), 
        d3.csv('data/car-assignments.csv'),
        d3.csv('data/cc_data.csv'),
        d3.csv('data/loyalty_data.csv'),
        d3.json('data/Abila.geojson')
    ];

    Promise.all(import_files).then(function (values) {
        
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

        drawMap();
        selectVehicle();
    });
});

function drawMap() {
    svg = d3.select('#map_svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left}, 0)`);
    
    var map = svg.selectAll('path')
        .data(abila.features)
        .enter().append('path')
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

// Gets vehicle selected from dropdown and creates subset list of all
// GPS coordinates for the vehicle
function selectVehicle() {
    var vehicle_id = d3.select("#select-vehicle").node().value;
    console.log(`Currently selected vehicle: ${vehicle_id}`)
    selected_vehicle = [];

    gps_data.forEach(d => {
        if (d.CarID == vehicle_id){
            selected_vehicle.push(d);
        }
    });

    console.log(selected_vehicle);
};

function dataWrangle() {
    var timeParse = d3.timeParse('%m/%d/%Y %H:%M:%S')
    temp = gps_data.map(d => ({
        "timestamp": timeParse(d.Timestamp),
        "CarID": +d.id,
        // Coordinate structure [lat, long]
        "coords": [+d.lat, +d.long]
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

    timeParse = d3.timeParse('%m/%d/%Y %H:%M')
    temp = cc_data.map(d => ({
        "last4": +d.last4ccnum,
        "location": d.location,
        "price": +d.price,
        "timestamp": timeParse(d.timestamp)
    }));

    cc_data = temp;

    timeParse = d3.timeParse('%m/%d/%Y')
    temp = loyalty_data.map(d => ({
        "localtion": d.location,
        "loyaltynum": d.loyaltynum,
        "price": +d.price,
        "timestamp": timeParse(d.timestamp)
    }));

    loyalty_data = temp;
}