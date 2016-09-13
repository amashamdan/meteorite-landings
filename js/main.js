var width = $(window).width();
var height = width / 2;
var colors = ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9"];
var chart = d3.select("#chart-area").append("svg")
				.attr("width", width)
				.attr("height", height)
				.style("background-color", "658EF3");

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
			return colors[Math.floor(Math.random() * 9)]
		})
		.attr("stroke", "white")
		.attr("stroke-width", 1)
})

