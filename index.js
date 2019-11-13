console.log("hello world");

// Define global variables
// Column names for table
var colNames = ["Chr", "Start", "Stop", "Shift", "resFrag", "Dir", "AT", "GC", "Sequence", "Pass", "Rep", "gcScore", "qualityScore", "Quality"];

// Define function to create table, sources: https://gist.github.com/jfreels/6733593; https://bl.ocks.org/denisemauldin/df41a0ec91f0d9697b03651b2238a0a0
function makeTable(data, colNames) {
    // Build table with D3
    var table = d3.select("body").append("table").attr("id", "probeTable").attr("class", "hover stripe");;
    var tableHeader = table.append("thead")
    var tableBody = table.append("tbody")

    // Add colNames to tableHeader
    tableHeader
        .append("tr")
        .selectAll("th")
        .data(colNames)
        .enter()
        .append("th")
            .text(d => d);
    
    // Add tableRows to tableBody
    var tableRows = tableBody
        .selectAll("tr")
        .data(data)
        .enter()
        .append("tr")

    // Map data to table
    var tableData = tableRows
        .selectAll("td")
        .data(function(d) {
            return Object.values(d);
        })
        .enter()
        .append("td")
            .text(function(d, i) {
                // Format data
                if (i == 6 | i == 7 | i == 11 | i == 12) {
                    var num = +d;
                    return num.toFixed(2);
                } else if (i == 8) {
                    return d.slice(0, 9) + "...";
                }
                else {
                    return d;
                }

                // return i + "-" + d; 
            });
    
    // Append id and class attributes
    table
        

    return table;
}

// d3 v5 uses promises to read in data, sources: http://datawanderings.com/2018/08/15/d3-js-v5-promise-syntax-examples/
$(document).ready(function() {
    d3.csv("probeData.csv").then(function(data){
        console.log(data);

        // Define plotting parameters
        var margin = {top: 10, right: 30, bottom: 30, left: 40};
        var width = 1400 - margin.left - margin.right;
        var height = 400 - margin.top - margin.bottom;
        var xmin = d3.min(data, function(d) { return +d.start; });
        var xmax = d3.max(data, function(d) { return +d.stop; });
        var ymin = 0;
        var ymax = 1;
        var fillLevels = ["High", "Medium", "Low"];
        var legendRectSize = 8;                                  
        var legendSpacing = 4; 

        //console.log(width);

        // Define x scaling function
        var x = d3.scaleLinear()
            .domain([xmin, xmax])
            .range([0, width])
        
        // Define y scaling function
        var y = d3.scaleLinear()
            .domain([ymin, ymax])
            .range([height, 0])

        // Define color scaling function
        var quality = d3.scaleOrdinal()
            .domain(fillLevels)
            .range(["#138fc8", "#5fcef2", "#b6e9fa"]);
            

        // Define the zoom variable, scale and call function
        var zoom = d3.zoom()
            .extent([[0, 0], [width,height]])
            .scaleExtent([1, 20])
            .on("zoom", updateChart);
     
        // Create svg element
        var regionPlot = d3.select("body")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .call(zoom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
        // Append y-axis gridline
        regionPlot.append("g")
        	.attr("class", "grid")
      		.call(d3.axisLeft(y).ticks(5,"s")
      		.tickSize(-width)
          	.tickFormat(""));

		// Append y-axis
		regionPlot.append("g")
      		.call(d3.axisLeft(y).ticks(5,"s"));
      		
        // Append x-axis
        var xaxis = regionPlot
            .append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(5)
            );

		// Append legend line
		regionPlot.append("g")
  			.attr("class", "legendOrdinal")
  			.attr("transform", "translate(" + 1200 + "," + margin.top + ")");

		var legendOrdinal = d3.legendColor()
  			.shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
  			.shapePadding(10)
  			.scale(quality);

		regionPlot.select(".legendOrdinal")
  			.call(legendOrdinal);

            
          // text label for the y axis
  		regionPlot.append("text")
      		.attr("transform", "rotate(-90)")
      		.attr("y", 0 - margin.left)
      		.attr("x",0 - (height / 2))
      		.attr("dy", "1em")
      		.style("text-anchor", "middle")
      		.text("GC"); 
      		
      		// text label for the x axis
  		regionPlot.append("text")             
      		.attr("transform","translate(" + (width/2) + " ," + (height + margin.top + 20) + ")")
      		.style("text-anchor", "middle")
      		.text("Position");
           
        // Append rectangles
        regionPlot
            .append("g")
            .attr("clip-path", "url(#clip)")
                .selectAll("rect")
                .data(data)
                .enter()
                .append("rect")
                    .attr("height", height*0.025)
                    .attr("width", function(d) {
                        var startPos = x(+d.start);
                        var stopPos = x(+d.stop);
                        return stopPos - startPos; 
                    })
                    .attr("x", function(d) {
                        var startPos = +d.start;
                        return x(startPos);
                    })
                    //.attr("y", function() { return y(Math.random()); });
                    .attr("y", function(d) { return y(d.GC); })
                    .attr("fill", function(d) { return quality(d.quality); })
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                    .on("mouseover", function(d){
                    d3.select(this).attr('fill','orange');
                    })
          			.on("mouseout", function(d){
          			d3.select(this).attr('fill',function(d) { return quality(d.quality); });
          			});
            

        // Add a clipPath: everything out of this area won't be drawn.
        var clip = regionPlot.append("defs").append("SVG:clipPath")
            .attr("id", "clip")
            .append("SVG:rect")
            .attr("width", width )
            .attr("height", height )
            .attr("x", 0)
            .attr("y", 0);
                    
        // Build D3 table
        makeTable(data, colNames);

        // Apply bootstrap styling and pagination to table using jquery, source: https://datatables.net/examples/styling/bootstrap
        $('#probeTable').DataTable();

        // Zoom in function updating the graph axis and rect
        function updateChart() {
            // recover the new scale
            var newX = d3.event.transform.rescaleX(x); 
            // update axes with these new boundaries
            xaxis.call(d3.axisBottom(newX));
            // update rect position
            regionPlot
            .selectAll("rect")
            .data(data)
                .attr('x', function(d) {return newX(+d.start)})
		.attr("y", function(d) { return y(d.GC); })
            	.attr("transform","translate(" + transform.x + "," + 0 + ") scale(" + transform.k + "," + 1 + ")");

            // New XAxis bound values(min/max): newX.domain()[0],newX.domain()[1], used for filtering data records
            //console.log(newX.domain()[0]);
        }


    
        
    });
});

console.log("End");
