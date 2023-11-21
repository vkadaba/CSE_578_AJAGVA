const margin = {left: 10, right: 10, top: 10, bottom: 10};
const width = 1000;
const height = 800;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
var gps_data, car_assignments, cc_data, loyalty_data, abila;
var tooltip, projection, map_path;


document.addEventListener('DOMContentLoaded', function () {
    const import_files = [
        d3.csv('data/gps.csv'), 
        d3.csv('data/car-assignments.csv'),
        d3.csv('data/cc_data.csv'),
        d3.csv('data/loyalty_data.csv'),
        d3.json('data/Abila.geojson')
    ];

    Promise.all(import_files).then(function (values) {

        console.log("GPS data loaded.")
        gps_data = values[0];
        console.log(gps_data);

        console.log("Car Assignments loaded.");
        car_assignments = values[1];
        console.log(car_assignments);

        console.log("Credit Card data loaded.");
        cc_data = values[2];
        console.log(cc_data);

        console.log("Loyalty Card data loaded.");
        loyalty_data = values[3];
        console.log(loyalty_data);

        console.log('Abila.geojson loaded')
        abila = values[4];

        // Create hidden tooltip div
        tooltip = d3.select("body").append("div")
            .attr("class", "myTooltip")
            .style("display", "none");

        projection = d3.geoMercator().fitSize([innerWidth, innerHeight], abila);
        map_path = d3.geoPath().projection(projection);

        drawMap();
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
}