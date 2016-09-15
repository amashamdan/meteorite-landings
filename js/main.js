/* The chart width is the same as the window's width (to have the chart cover the whole display), */
var width = $(window).width();
var height = width / 2;
/* A set of colors to fill the circles representing the meteorites. */
var colors = ["#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#e6f598", "#abdda4", "#66c2a5", "#3288bd"];
/* The main svg is appended to the page. */
var chart = d3.select("#chart-area").append("svg")
				.attr("width", width)
				.attr("height", height)
				.style("background-color", "#A3CCFF")
				/* Zoom method is called to add zoom functionality. */
				.append("g")
    			.call(d3.behavior.zoom().scaleExtent([1, 20]).on("zoom", zoom))
    			/* Drag method is called to add drag functionality. */
  				.append("g")
 				.call(d3.behavior.drag())

/* zoom callback function. */
function zoom() {
  chart.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}
/* The projection method is defined. Scale is not a random number, it's the factor which works in this case. */
var projection = d3.geo.equirectangular().translate([width/2, height/2]).scale([width / 6.315789]);
/* path is defined which will be used later to draw the world map. */
var path = d3.geo.path()
			.projection(projection)
/* This rectangle enables zoom and drag when the user zooms or drags when the pointer is at an ocean or sea. Without it, zoom and drag don't work when the pointer is on water because no svg is drawn there. It has the same background color as the svg. */
chart.append("rect")
	.attr("width", width)
	.attr("height", height)
	.attr("x", 0)
	.attr("y", 0)
	.attr("fill", "#A3CCFF")
	.attr("stroke", "white");
/* json methos is used instead of ajax call to retreive earth's information. */
d3.json("js/earth.json", function(json) {
	/* Paths are appended which draws the world map. */
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
	/* plotPoints function is called to draw the circles representing the meteorites. */
	plotPoints();
})
/* plotPoints function which draw the meteorites. */
function plotPoints() {
	/* json method is used to fetch meteorites data. */
	d3.json("js/meteorite-strike-data.json", function(json) {
		/* A scale created to draw the circles. Each circle depends on the mass of the meteorite. Larger mass results in bigger meteorite. */
		var massScale = d3.scale.sqrt()
							.domain([d3.min(json.features, function(d) {
								return Number(d.properties.mass);
							}), d3.max(json.features, function(d) {
								return Number(d.properties.mass);
							})])
							.range([2, 60])
		/* json.features is used to draw circles. */
		chart.selectAll("circle")
			.data(json.features)
			.enter()
			.append("circle")
			/* Each circle is given an id, the id is the same as the order of the meteorite in the json file. */
			.attr("id", function(d, i) {
				return "circle" + i;
			})
			.attr("r", function(d) {
				/* radius if each circle is returned using massScale to have a circle radius depending on the mass. */
				return massScale(Number(d.properties.mass))
			})
			/* This attribute stores the radius as weel, it is used when the circle is unhovered to return to the original radius. */
			.attr("original", function(d) {
				return massScale(Number(d.properties.mass))
			})
			.attr("cx", function(d) {
				/* Some meteorites doesn't have geometry, it is checked first. */
				if (d.geometry) {
					/* longitude and latitude are retreived. */
					var lon = d.geometry.coordinates[0];
					var lat = d.geometry.coordinates[1];
					/* projection is used to get adjusted coordinates for each meteorite. */
					var convertedLocation = projection([lon, lat]);
					/* The first element is returned. */
					return convertedLocation[0];
				}
			})
			.attr("cy", function(d) {
				/* Same as cx, but the second element in convertedLocation is returned. */
				if (d.geometry) {
					var lon = d.geometry.coordinates[0];
					var lat = d.geometry.coordinates[1];
					var convertedLocation = projection([lon, lat]);
					return convertedLocation[1];
				}
			})
			/* class needed to control tooltip information. */
			.attr("class", "meteorite")
			/* The following are attributes given to the circles, each attribute is a piece of information which will be used for the tooltip. */
			.attr("name", function(d) {
				return d.properties.name
			})
			.attr("mass", function(d) {
				return d.properties.mass
			})
			.attr("classification", function(d) {
				return d.properties.recclass
			})
			.attr("lat", function(d) {
				return d.properties.reclat
			})
			.attr("lon", function(d) {
				return d.properties.reclong
			})
			.attr("year", function(d) {
				/* Some meteorites have unknown years. */
				if (d.properties.year) {
					/* The year string has too much information, we're interested in the year. Split command is used to extract the year. */
					var year = d.properties.year
					year = year.split("-")[0];
					return year
				} else {
					return "Unknown";
				}
			})
			.attr("fill", function() {
				/* A random color is returned from colors to fill the circles. */
				//Quantize not used because most meteorites are small, no variety in colors.
				return colors[Math.floor(Math.random() * 8)];
			})
			.attr("stroke", "black")
			.attr("stroke-width", 0.5)
			.style("opacity", 0.7)
		/* d3 sort method is used to change the order of drawing the circles. Larger circles will be drawn first and then the smaller ones. To use sort, circles has to be bound to data (set in chart.selectAll("circle").data(json.features).enter(). That's why a for loop is not used to append circles individually. */
		d3.selectAll("circle").sort(function(a, b) {
			return b.properties.mass - a.properties.mass;
		})
		/* This is set to false when the tooltip is hidden and to true when it's shown. It will be used in the mousemove function. */
		var tooltipStatus = false;
		/* When a circel is hovered, the following executes */
		$(".meteorite").hover(function(e) {
			/* The id and radius of the hovered circles are stored. */
			var hovered = $(this).attr("id");
			var hoveredSize = $(this).attr("r");
			/* The radius of the hovered circle is changed, small circles' radius is multiplied by 4 while large circles' radius is doubled. */
			d3.select("#"+ hovered).transition().attr("r", function() {
				if (hoveredSize > 20) {
					return hoveredSize * 2;
				} else {
					return hoveredSize * 4;
				}
			});
			/* The position of the pointer is detected. */
			var xPosition = e.pageX;
			var yPosition = e.pageY;
			/* The tooltip's position is changed to the pointer's position with a small offset. */
			$("#tooltip").css({"left": xPosition + 10, "top": yPosition + 10});
			/* The content of the tooltip is changed to the information of the hovered meteorite. */
			$("#tooltip").html("<p>Name: " + $(this).attr("name") + "</p>" +
								"<p>Year: " + $(this).attr("year") + "</p>" +
								"<p>Mass: " + $(this).attr("mass") + "</p>" +
								"<p>Class: " + $(this).attr("classification") + "</p>" +
								"<p>Latitude: " + $(this).attr("lat") + "</p>" +
								"<p>Longitude: " + $(this).attr("lon") + "</p>");
			/* tooltip is shown and tooltipStatus set to true. */
			$("#tooltip").show();
			tooltipStatus = true;
		/* .meteorite unhover function. */
		}, function() {
			/* The id and original radius of the unhovered circle are saved. */
			var unhovered = $(this).attr("id");
			var originalSize = $(this).attr("original");
			/* Original radius of the circle is restored. */
			d3.select("#"+ unhovered).transition().attr("r", originalSize);
			/* The tooltip is hidden and tooltipStatus is et to false. */
			$("#tooltip").hide();
			tooltipStatus = false;
		});
		/* This function executes a set of commands only when the tooltip is shown. */
		$(document).mousemove(function(e) {
			if (tooltipStatus) {
				/* The position of the tooltip is changed whenever the pointer moves. This way the tooltip will always follow the pointer instead of discretely jumping from one position to another. */
				var xPosition = e.pageX;
				var yPosition = e.pageY;
				$("#tooltip").css({"left": xPosition + 10, "top": yPosition + 10});
			}
		})
	})
}