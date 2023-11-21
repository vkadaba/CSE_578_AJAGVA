const margin = {left: 10, right: 10, top: 10, bottom: 10};
var width = 1000;
var height = 800;
var innerWidth = width - margin.left - margin.right;
var innerHeight = height - margin.top - margin.bottom;


d3.json('data/Abila.geojson').then(function(abila) {
    // Create hidden tooltip div
    var tooltip = d3.select("body").append("div")
    .attr("class", "myTooltip")
    .style("display", "none");
    
    var projection = d3.geoMercator().fitSize([innerWidth, innerHeight], abila);
    var path = d3.geoPath().projection(projection);

    svg = d3.select('#map_svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left}, 0)`);

    var map = svg.selectAll('path')
    .data(abila.features)
    .enter().append('path')
        .attr('d', path)
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
});