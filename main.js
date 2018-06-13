var margin = {top: 50, right: 70, bottom:200, left: 70},
width = 860 - margin.left - margin.right,
height = 550 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
.rangeRoundBands([0, width],0.05,0.2);
//.rangeRoundBands([0, width], 0.4);

var y = d3.scale.linear()
// .rangeRound([height, 0])
.range([height,0]);

var color = d3.scale.ordinal()
  .range(["#1C3354", "#113222","#C27A47", "#732926","#54361C","#281A01" ]);
//var color = d3.scale.category10();

var xAxis = d3.svg.axis()
.scale(x)
.orient("bottom");

var yAxis = d3.svg.axis()
.scale(y)
.orient("left")
.tickFormat(d3.format(".d"));


var svg = d3.select("body").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var active_link = "0"; //to control legend selections and hover
var legendClicked; //to control legend selections
var legendClassArray = []; //store legend classes to select bars in plotSingle()
var legendClassArray_orig = []; //orig (with spaces)
var sortDescending; //if true, bars are sorted by height in descending order
var restoreXFlag = false; //restore order of bars back to original

//disable sort checkbox
d3.select("label")
.select("input")
.property("disabled", true)
.property("checked", false);

d3.csv("Data.csv", function(error, data) {
  if (error) throw error;

color.domain(d3.keys(data[0]).filter(function(key) { return key !== "State"; }));

data.forEach(function(d) {
var mystate = d.State; //add to stock code
var y0 = 0;
//d.ages = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
d.ages = color.domain().map(function(name) { 
  return {mystate:mystate, 
    name: name, 
    y0: y0, 
    y1: y0 += +d[name],
    y_corrected: 0}; });
d.total = d.ages[d.ages.length - 1].y1;

});

//data.sort(function(a, b) { return b.total - a.total; });

x.domain(data.map(function(d) { return d.State; }));
y.domain([0, d3.max(data, function(d) { return d.total; })]);
//y.domain([0,300]);


svg.append("g")
  .append("text")
  .attr("x", 0)
  .attr("y", 0)
  .style("text-anchor", "middle")
  .attr("transform","translate("+ width/2+",360)")
  .attr("dy", ".35em")

  .style("font-size", "16px") 
  .style("font-weight", "bold")
  .text("Departments");

/*svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + (height+2)  + ")")
  .call(xAxis)
  .selectAll("text")
  .attr("y", 5)
  .attr("x", 30)
  .attr("dy", ".35em")
  //.attr("transform", "translate(" + 0 + "," + (height) + ")")  
  .attr("transform","translate(-30,30) rotate(-47)")
  .style("font-weight", "bold")
  .style("text-anchor", "end");*/
svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + (height+2) + ")")
  .call(xAxis)
.selectAll(".tick text")
  .call(wrap, x.rangeBand());


svg.append("g")
  .attr("class", "y axis")
  .call(yAxis)
  .append("text")
  .attr("x", 0)
  .attr("y", 6)
  .attr("transform", "translate(-60,"+ height/2 +") rotate(-90)")
  .attr("dy", ".35em")
  .style("text-anchor", "middle")
  .style("font-size", "16px") 
  .style("font-weight", "bold")
  .text("Number of projects");


svg.append("text")
.attr("x", (width / 2))             
.attr("y", 0 - (margin.top / 2))
.attr("text-anchor", "middle")  
.style("font-size", "14px") 
.style("font-weight", "bold")
//.style("text-decoration", "underline")  
.text("Comparison of projects based on time and budget constraints");

var state = svg.selectAll(".state")
  .data(data)
  .enter().append("g")
  .attr("class", "g")
  .attr("transform", function(d) { return "translate(" + "0" + ",0)"; });
  //.attr("transform", function(d) { return "translate(" + x(d.State) + ",0)"; })

height_diff = 0;  

state.selectAll("rect")
.data(function(d) {
  return d.ages; 
})
.enter().append("rect")
.attr("width", x.rangeBand())
.attr("y", function(d) { return y(d.y1); })
.attr("x",function(d) { //add to stock code
    return x(d.mystate)
  })
.attr("height", function(d) { return y(d.y0) - y(d.y1); })
.attr("class", function(d) {
  classLabel = d.name.replace(/\s/g, ''); //remove spaces
  return "class" + classLabel;
})
.style("fill", function(d) { return color(d.name); });

state.selectAll("rect")
   .on("mouseover", function(d){

      var delta = d.y1 - d.y0;
      var xPos = parseFloat(d3.select(this).attr("x"));
      var yPos = parseFloat(d3.select(this).attr("y"));
      var height = parseFloat(d3.select(this).attr("height"))

      d3.select(this).attr("stroke","black").attr("stroke-width",2.5);

      svg.append("text")
      .attr("x",xPos+65)
      .attr("y",yPos +height/2)
      .attr("class","tooltipTHOMI")
      .text(d.name +": "+ delta); 
      
   })
   .on("mouseout",function(){
      svg.select(".tooltipTHOMI").remove();
      d3.select(this).attr("stroke","none").attr("stroke-width",0.1);
                            
    })


var legend = svg.selectAll(".legend")
  .data(color.domain().slice().reverse())
.enter().append("g")
  //.attr("class", "legend")
  .attr("class", function (d) {
    legendClassArray.push(d.replace(/\s/g, '')); //remove spaces
    //legendClassArray_orig.push(d); //remove spaces
    return "legend";
  })
  .attr("transform", function(d, i) { return "translate(100," + i * 20 + ")"; });


//reverse order to match order in which bars are stacked
legendClassArray = legendClassArray.reverse();
//legendClassArray_orig = legendClassArray_orig.reverse();

legend.append("rect")
  .attr("x", width - 35)
  .attr("width", 18)
  .attr("height", 18)
  .style("fill", color)
  .attr("id", function (d, i) {
    return "id" + d.replace(/\s/g, '');
  })
  .on("mouseover",function(){        

    if (active_link === "0") d3.select(this).style("cursor", "pointer");
    else {
      if (active_link.split("class").pop() === this.id.split("id").pop()) {
        d3.select(this).style("cursor", "pointer");
      } else d3.select(this).style("cursor", "auto");
    }
  })
  .on("click",function(d){        

    if (active_link === "0") { //nothing selected, turn on this selection
      d3.select(this)           
        .style("stroke", "black")
        .style("stroke-width", 2);

        active_link = this.id.split("id").pop();
        plotSingle(this);

        //gray out the others
        for (i = 0; i < legendClassArray.length; i++) {
          if (legendClassArray[i] != active_link) {
            d3.select("#id" + legendClassArray[i])
              .style("opacity", 0.5);
          }else sortBy = i; //save index for sorting in change()
        
        }

       
    }else { //deactivate
      if (active_link === this.id.split("id").pop()) {//active square selected; turn it OFF
        d3.select(this)           
          .style("stroke", "none");

        active_link = "0"; //reset

        //restore remaining boxes to normal opacity
        for (i = 0; i < legendClassArray.length; i++) {              
            d3.select("#id" + legendClassArray[i])
              .style("opacity", 1);
        }

        restorePlot(d);
        active_link = "0"; //reset
      }

    } //end active_link check
                      
  });

legend.append("text")
  .attr("x", width - 40)
  .attr("y",9)
  .attr("dy", ".25em")
  .style("text-anchor", "end")
  .text(function(d) { return d; });



   // restore graph after a single selection
   function restorePlot(d) {
    
        state.selectAll("rect").forEach(function (d, i) {      
          //restore shifted bars to original posn
          d3.select(d[idx])
            .transition()
            .duration(1000)   
                 
            .attr("y", y_orig[i]);
        })
    
        //restore opacity of erased bars
        for (i = 0; i < legendClassArray.length; i++) {
          if (legendClassArray[i] != class_keep) {
            d3.selectAll(".class" + legendClassArray[i])
              .transition()
              .duration(500)
              .delay(500)
              .attr("width", x.rangeBand()) //restore bar width
              .style("opacity", 1);
          }
        }
    
      }

// plot only a single legend selection
function plotSingle(d) {
  
class_keep = d.id.split("id").pop();
idx = legendClassArray.indexOf(class_keep);    

//erase all but selected bars by setting opacity to 0
for (i = 0; i < legendClassArray.length; i++) {
if (legendClassArray[i] != class_keep) {
  d3.selectAll(".class" + legendClassArray[i])
    .transition()
    .attr("width",0)
    .duration(1000)          
    .style("opacity", 0);
}
}

//lower the bars to start on x-axis
y_orig = [];
state.selectAll("rect").forEach(function (d, i) {        

//get height and y posn of base bar and selected bar
h_keep = d3.select(d[idx]).attr("height");
y_keep = d3.select(d[idx]).attr("y");
//store y_base in array to restore plot
y_orig.push(y_keep);

h_base = d3.select(d[0]).attr("height");
y_base = d3.select(d[0]).attr("y");    

h_shift = h_keep - h_base;
y_new = y_base - h_shift;

//reposition selected bars
d3.select(d[idx])
  .transition()
  .ease("bounce")
  .duration(1000)
  .delay(750)
  .attr("y", y_new);

})    

} 


// Wrap label in x axis
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        x = text.attr('x'),
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

});