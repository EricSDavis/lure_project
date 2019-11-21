console.log("hello world");

// Define global variables
// Column names for table
var colNames = ["Chr", "Start", "Stop", "Shift", "resFrag", "Dir", "AT", "GC", "Sequence", "Pass", "Rep", "gcScore", "qualityScore", "Quality"];

// Define function to plot region view
function regionView(data) {
    // Define plotting parameters
    var margin = {top: 10, right: 30, bottom: 30, left: 40};
    var width = 1400 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;
    var xmin = d3.min(data, function(d) { return +d.start; });
    var xmax = d3.max(data, function(d) { return +d.stop; });
    var ymin = 0;
    var ymax = 1;
    var fillLevels = ["High", "Medium", "Low"];

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
        .scaleExtent([0.8, 50])
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


    // Create a tooltip, sources: https://stackoverflow.com/questions/35623333/tooltip-on-mouseover-d3 
    //  and https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
    var Tooltip = d3.select("body")
        .append("div")
        .attr("id", "mytooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("opacity", 0)
        .style("visibility", "hidden");

    // Three functions that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        Tooltip
            .transition().duration(250)
            .style("opacity", 1)
            .style("visibility", "visible")        
        d3.select(this)
            .attr('fill','orange')
    }
    var mousemove = function(d) {
        Tooltip
            .html(d.chr + ":" + 
                  d.start.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "-" +
                  d.stop.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "<br>" +
                  d.seq.slice(0,10) + "..." + d.seq.slice(d.seq.length-10, d.seq.length) + "<br>" +
                  "GC: " + (d.GC*100).toFixed(1) + "%" + "<br>" +
                  "Repetitive Bases: " + d.rep + "<br>" +
                  "Quality Score: " + (d.qualityScore*100).toFixed(2) + "%")
            return Tooltip.style("top", (d3.event.pageY-10)+"px") 
            .style("left",(d3.event.pageX+10)+"px");
    }
    var mouseleave = function(d) {
        Tooltip
            .transition().duration(250)
            .style("opacity", 0)
            .style("visibility", "hidden")
        d3.select(this)
            .attr('fill', d => quality(d.quality))
    }

    // Append rectangles
    regionPlot
        .append("g")
        .attr("clip-path", "url(#clip)")
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
                .attr("height", height*0.025)
                .attr("width", d => x(+d.stop) - x(+d.start))
                .attr('x', d => x(+d.start))
                //.attr("y", function() { return y(Math.random()); });
                .attr("y", function(d) { return y(d.GC); })
                .attr("fill", function(d) { return quality(d.quality); })
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
                      
    // Add a clipPath: everything out of this area won't be drawn.
    var clip = regionPlot.append("defs").append("SVG:clipPath")
        .attr("id", "clip")
        .append("SVG:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    // Build Histogram(data, colfun, plotTitle, breaks, barColor, xticks, yticks)
    buildHistogram(data, d => d.shift, "Distance from Restriction Site", 10, "steelblue", 5, 5);
    buildHistogram(data, d => d.GC, "GC Fraction", 10, "#69b3a2", 5, 5);
    buildHistogram(data, d => d.rep, "Base pairs from Repetitive Regions", 5, "steelblue", 5, 5);
    buildHistogram(data, d => d.qualityScore, "Quality Score", 10, "#69b3a2", 5, 5);

    // Build D3 table
    makeTable(data, colNames);

    // Apply bootstrap styling and pagination to table using jquery, source: https://datatables.net/examples/styling/bootstrap
    $('#probeTable').DataTable();
    d3.select("#probeTable_wrapper").style("width", 1400);

    var xdomain = new Array(2);

    // Update charts in response to zoom action
    function updateChart() {
        var transform = d3.zoomTransform(this);
        // recover the new scale
        var newX = d3.event.transform.rescaleX(x); 
        // update axes with these new boundaries
        xaxis.call(d3.axisBottom(newX));
        // update rect position
        regionPlot
            .selectAll("rect")
            .data(data)
            .attr('x', function(d) {return x(+d.start)})
            .attr("y", function(d) { return y(d.GC); })
                    .attr("transform","translate(" + transform.x + "," + 0 + ") scale(" + transform.k + "," + 1 + ")");

        // Capture and filter data by new zoom bounds
        xdomain[0] = newX.domain()[0];
        xdomain[1] = newX.domain()[1];

        var newdata = [];

        data.forEach(function(d, i){
            d.start > xdomain[0] && d.stop < xdomain[1] ? newdata.push(d) : console.log(newdata);
        });


        // Call update histogram functions
        updateHistogram(newdata, d => d.shift, "Distance from Restriction Site", 10, "steelblue", 5, 5);
        updateHistogram(newdata, d => d.GC, "GC Fraction", 10, "#69b3a2", 5, 5);
        updateHistogram(newdata, d => d.rep, "Base pairs from Repetitive Regions", 5, "steelblue", 5, 5);
        updateHistogram(newdata, d => d.qualityScore, "Quality Score", 10, "#69b3a2", 5, 5);

        // Call update table function
        updateTable(newdata, colNames);

    }

    // Function to remove and upate the data table
    function updateTable(newdata, colNames) {
        d3.select("#probeTable_wrapper").remove();
        d3.select("body").selectAll("table").remove();
        makeTable(newdata, colNames);

        // Apply bootstrap styling and pagination to table using jquery, source: https://datatables.net/examples/styling/bootstrap
        $('#probeTable').DataTable();
        d3.select("#probeTable_wrapper").style("width", 1400);        
    }

    // Function to remove and update histograms
    function updateHistogram(newdata, colfun, plotTitle, breaks, barColor, xticks, yticks) {
        d3.select(".histogram").remove();
        buildHistogram(newdata, colfun, plotTitle, breaks, barColor, xticks, yticks);
    }


}

// Define function to draw histogram
function buildHistogram(data, colfun, plotTitle, breaks, barColor, xticks, yticks) {
    // Build histograms, source: https://stackoverflow.com/questions/37445495/binning-an-array-in-javascript-for-a-histogram;
    // https://www.d3-graph-gallery.com/graph/histogram_basic.html

    // Create histogram plot area
    // Define plotting parameters
    var histMargin = {top: 60, right: 30, bottom: 30, left: 40};
    var histWidth = 350 - histMargin.left - histMargin.right;
    var histHeight = 250 - histMargin.top - histMargin.bottom;
    var histXmin = d3.min(data, colfun);
    var histXmax = d3.max(data, colfun);
    
    // Create svg element
    var histPlot = d3.select("body")
        .append("svg")
            .attr("class", "histogram")
            .attr("width", histWidth + histMargin.left + histMargin.right)
            .attr("height", histHeight + histMargin.top + histMargin.bottom)
        .append("g")
            .attr("transform", "translate(" + histMargin.left + "," + histMargin.top + ")");

    //Create Title 
    histPlot.append("text")
        .attr("x", histWidth / 2 )
        .attr("y", -histMargin.top/2)
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .text(plotTitle);
        

    // Define x scaling function
    var histX = d3.scaleLinear()
        .domain([histXmin, histXmax])
        .range([0, histWidth])

    // Set parameters for histogram function
    var histogram = d3.histogram()
        .value(colfun)
        .domain(histX.domain())
        .thresholds(histX.ticks(breaks));

    // Apply histogram function to data
    var bins = histogram(data);

    // Define y scaling function
    var histY = d3.scaleLinear()
        .range([histHeight, 0])
        .domain([0, d3.max(bins, function(d) {return d.length})]);

    // Append y-axis
    histPlot
        .append("g")
        .call(d3.axisLeft(histY).ticks(yticks,"s"));

    // Append x-axis
    histPlot
        .append("g")
            .attr("transform", "translate(0," + histHeight + ")")
        .call(d3.axisBottom(histX).ticks(xticks));
    
    // Add histogram data to plot
    histPlot
        .selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + histX(d.x0) + "," + histY(d.length) + ")"; })
            .attr("width", function(d) { return histX(d.x1) - histX(d.x0) -1 ; })
            .attr("height", function(d) { return histHeight - histY(d.length); })
            .style("fill", barColor);
}

// Define function to create table, sources: https://gist.github.com/jfreels/6733593; https://bl.ocks.org/denisemauldin/df41a0ec91f0d9697b03651b2238a0a0
function makeTable(data, colNames) {
    // Build table with D3
    var table = d3.select("body").append("table").attr("id", "probeTable").attr("class", "hover stripe");
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
            });

    return table;
}

// Define function to enable zoom, source https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172

// d3 v5 uses promises to read in data, sources: http://datawanderings.com/2018/08/15/d3-js-v5-promise-syntax-examples/
$(document).ready(function() {
    d3.csv("probeData.csv").then(function(data){
        console.log(data);

        // Build regionView and return x-zoom bounds
        regionView(data);
        
        // // Build Histogram(data, colfun, plotTitle, breaks, barColor, xticks, yticks)
        // buildHistogram(data, d => d.shift, "Distance from Restriction Site", 10, "steelblue", 5, 5);
        // buildHistogram(data, d => d.GC, "GC Fraction", 10, "#69b3a2", 5, 5);
        // buildHistogram(data, d => d.rep, "Base pairs from Repetitive Regions", 5, "steelblue", 5, 5);
        // buildHistogram(data, d => d.qualityScore, "Quality Score", 10, "#69b3a2", 5, 5);


        // // Build D3 table
        // makeTable(data, colNames);

        // // Apply bootstrap styling and pagination to table using jquery, source: https://datatables.net/examples/styling/bootstrap
        // $('#probeTable').DataTable();
        // d3.select("#probeTable_wrapper").style("width", 1400);

    });
});


console.log("End");