var width = $(window).width();
var height = width / 2;
var colors = ["#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#e6f598", "#abdda4", "#66c2a5", "#3288bd"];
var chart = d3.select("#chart-area").append("svg")
				.attr("width", width)
				.attr("height", height)
				.style("background-color", "#A3CCFF");

var projection = d3.geo.equirectangular().translate([width/2, height/2]).scale([width / 6.315789]);

var path = d3.geo.path()
			.projection(projection)

d3.json("js/earth.json", function(json) {
	chart.selectAll("path")// path here is not the variable defined above
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path) //d (the path data attribute) is referred to our path generator,which magically takes the bound geodata and calculates all that crazy SVG code.
		.style("fill", function() {
			return '#F3F1EE'
		})
		.attr("stroke", "white")
		.attr("stroke-width", 1)
	plotPoints();
})

function plotPoints() {
	d3.json("js/meteorite-strike-data.json", function(json) {
		var massScale = d3.scale.sqrt()
							.domain([d3.min(json.features, function(d) {
								return Number(d.properties.mass);
							}), d3.max(json.features, function(d) {
								return Number(d.properties.mass);
							})])
							.range([2, 60])

		for (var point in json.features) {
			if (json.features[point].geometry) {
				var lon = json.features[point].geometry.coordinates[0];
				var lat = json.features[point].geometry.coordinates[1];
				var convertedLocation = projection([lon, lat]);
				chart.append("circle")
					.attr("cx", convertedLocation[0])
					.attr("cy", convertedLocation[1])
					.attr("r", function() {
						return massScale(Number(json.features[point].properties.mass))
					})
					.attr("class", "meteorite")
					.attr("name", function() {
						return json.features[point].properties.name
					})
					.attr("mass", function() {
						return json.features[point].properties.mass
					})
					.attr("classification", function() {
						return json.features[point].properties.recclass
					})
					.attr("lat", function() {
						return json.features[point].properties.reclat
					})
					.attr("lon", function() {
						return json.features[point].properties.reclong
					})
					.attr("year", function() {
						if (json.features[point].properties.year) {
							var year = json.features[point].properties.year
							year = year.split("-")[0];
							return year
						} else {
							return "Unknown";
						}
					})
					.attr("fill", function() {
						//quantize not used because most meteorites are small, no variety in colors.
						return colors[Math.floor(Math.random() * 8)];
					})
					.style("opacity", 0.7);
			}
		}
		var tooltipStatus = false;
		$(".meteorite").hover(function(e) {
			var xPosition = e.pageX;
			var yPosition = e.pageY;
			$("#tooltip").css({"left": xPosition + 10, "top": yPosition + 10});
			$("#tooltip").html("<p>Name: " + $(this).attr("name") + "</p>" +
								"<p>Year: " + $(this).attr("year") + "</p>" +
								"<p>Mass: " + $(this).attr("mass") + "</p>" +
								"<p>Class: " + $(this).attr("classification") + "</p>" +
								"<p>Latitude: " + $(this).attr("lat") + "</p>" +
								"<p>Longitude: " + $(this).attr("lon") + "</p>");
			$("#tooltip").show();
			tooltipStatus = true;
		}, function() {
			$("#tooltip").hide();
			tooltipStatus = false;
		});
		$(document).mousemove(function(e) {
			if (tooltipStatus) {
				var xPosition = e.pageX;
				var yPosition = e.pageY;
				$("#tooltip").css({"left": xPosition + 10, "top": yPosition + 10});
			}
		})
	})
}