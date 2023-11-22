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
        
        gps_data = values[0];
}).catch(error => console.error('Error loading data: ', error));

}, []);

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
    const results = [];
    const DISTANCE_THRESHOLD = 0.1; //maximum distance between two consecutive GPS points to consider the vehicle as stopped
    const TIME_THRESHOLD = 15 * 60 * 1000; //The minimum time that needs to pass between two consecutive GPS records to consider it a significant stop
    const FREQUENT_STOPS_THRESHOLD = 15;// The minimum number of stops required on a route to be classified as having frequent stops

    data.forEach(point => {
        if (!groupedData[point.id]) {
            groupedData[point.id] = [];
        }
        groupedData[point.id].push(point);
    });

    Object.keys(groupedData).forEach(id => {
        let stopCount = 0;
        let lastPoint = null;

        groupedData[id].forEach(point => {
            if (lastPoint) {
                const distance = calculateDistance(lastPoint.lat, lastPoint.long, point.lat, point.long);
                const timeDiff = new Date(point.Timestamp) - new Date(lastPoint.Timestamp);

                if (distance < DISTANCE_THRESHOLD && timeDiff > TIME_THRESHOLD) {
                    stopCount++;
                }
            }
            lastPoint = point;
        });

        if (stopCount >= FREQUENT_STOPS_THRESHOLD) {
            results.push({ id, stopCount });
        }
    });

    return results;
}



const routes = analyzeRoutes(gpsData);
console.log(routes);
