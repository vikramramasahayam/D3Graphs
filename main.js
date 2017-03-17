(function () {

  function renderLineCharts(data, container = 'body', config = {}) {
    let chartData = data.filter(datum => !datum.isDisabled);
    const containerWidth = config.width || 1000;
    const containerHeight = config.height || 600;
    const margin = config.margin || { top: 20, right: 20, bottom: 50, left: 50 };
    
    if (chartData.length) {
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .classed('main-svg', true);
    
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = containerHeight - margin.top - margin.bottom;

    const chartContainer = svg.append('g')
      .attr('transform', `translate( ${margin.left}, ${margin.top})`);

    let x = d3.scalePoint()
      .padding(0.1)  
      .rangeRound([0, chartWidth])
      .domain(chartData[0].values.map(datum => datum['date'] ));

    let y = d3.scaleLinear()
      .rangeRound([chartHeight, 0])
      .domain([0, d3.max(chartData, datum => d3.max(datum.values, (value) => parseInt(value['time'])))]);
    
    let line = d3.line()
      .x(d => x(d['date']))
      .y(d => y(parseInt(d['time'])));
    

  // Define the div for the tooltip
    let tooltip = d3.select('body')
      .append("div")	
      .attr("class", "tooltip")				
      .style("opacity", 0)
      .style("padding", '2px');

    chartContainer
      .append('g')
      .classed('x-axis', true)
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).ticks(2))
      .append('text')
      .attr('fill', '#fff')
      .attr('x', chartWidth / 2)
      .attr('y', margin.bottom / 2)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'middle')
      .style('font-size', '16')
      .text('date');

    chartContainer
      .append('g')
      .classed('y-axis', true)
      .call(d3.axisLeft(y))
      .append('text')
      .attr('fill', '#fff')
      .attr('transform', 'rotate(-90)')
      .attr('x', -1 * (chartHeight / 2 ))
      .attr('y', -1 * margin.left / 2)
      .attr('dy', '-0.71em')
      .attr('text-anchor', 'middle')
      .style('font-size', '16')
      .text('time');
    
    chartData.forEach((datum, i) => {
      chartContainer
        .append('path')
        .datum(datum.values)
        .attr('fill', 'none')
        .attr('stroke', config.colorMap[datum.key] || 'steelblue')
        .attr('stroke-linejoin', config.lineJoin || 'round')
        .attr('stroke-linecap', config.lineCap || 'round')
        .attr('stroke-width', config.strokeWidth || 1.5)
        .attr('d', line);

      // Add the scatterplot
      chartContainer.append('g')
        .selectAll('dot')
        .data(datum.values)
        .enter()
        .append('circle')
        .style('opacity',0)
        .attr('r', 5)
        .attr('cx', d => x(d['date']))
        .attr('cy', d => y(parseInt(d['time'])))
        .style('fill', config.colorMap[datum.key])
        .on('mouseover', d => {
            tooltip.transition()		
              .duration(300)		
              .style('opacity', .9)
              .style('left', `${d3.event.pageX - 400}px`)
             .style('top', `${d3.event.pageY - 100}px`)
            .style('border', `1px solid ${config.colorMap[d]}`);

            tooltip.html(`Event : ${d['event']}<br/>Date : ${d['date']} ,Time :${d['time']}`);
          })					
        .on('mouseout', d => {
            tooltip.transition()		
                .duration(500)		
                .style('opacity', 0);	
        });
    });
  } 
    //Rendering Filters
    let activeFilters = data.filter(datum => !datum['isDisabled'])
      .map(datum => datum.key);
    
    d3.select('#filters')
      .append('ul')
      .classed('list-group', true)
      .selectAll('li.list-group-item')
      .data(data.map(datum => datum.key))
      .enter()
      .append('li')
      .classed('list-group-item', true)
      .html(datum => {
        if (activeFilters.indexOf(datum) > -1)
          return `<span class="glyphicon glyphicon-check" aria-hidden="true"></span> ${datum}`;
        else
          return `<span class="glyphicon glyphicon-unchecked" aria-hidden="true"></span> ${datum}`;
      })
      .on('click', d => {
        d3.select(container).selectAll('*').remove();
        d3.select('#filters').selectAll('*').remove();
        d3.select('#legends').selectAll('*').remove();

        let newChartData = data.map(datum => {
          if (datum.key === d) {
            datum['isDisabled'] = !datum['isDisabled'];
            return datum;
          }
          else
            return datum;
        });

        renderLineCharts(newChartData, container, config);
      });
    
    //Rendering Select All Button
    d3.select('#filters .list-group')
      .insert('li', ':first-child')
      .classed('list-group-item', true)
      .html(`<span class="glyphicon ${config.isSelectAll ? 'glyphicon-check' : 'glyphicon-unchecked'}" aria-hidden="true"></span>All`)
      .on('click', d => {
        let target = d3.select(d3.event.target);
        if (target.select('span.glyphicon').classed("glyphicon-check")) {
          d3.select(container).selectAll('*').remove();
          d3.select('#filters').selectAll('*').remove();
          d3.select('#legends').selectAll('*').remove();
          
          let newChartData = data.map(datum => {
            datum['isDisabled'] = true;
            return datum;
          });
          renderLineCharts(newChartData, container, Object.assign(config, {isSelectAll: false}));

        } else {
          d3.select(container).selectAll('*').remove();
          d3.select('#filters').selectAll('*').remove();
          d3.select('#legends').selectAll('*').remove();
          
          let newChartData = data.map(datum => {
            datum['isDisabled'] = false;
            return datum;
          });
          renderLineCharts(newChartData, container, Object.assign(config, {isSelectAll: true}));

        }
      });
    
    //Rendering Color Legends
    d3.select('#legends')
      .append('ul')
      .classed('list-group', true)
      .selectAll('li.list-group-item')
      .data(data.map(datum => datum.key))
      .enter()
      .append('li')
      .classed('list-group-item', true)
      .html((datum, i) => `<span class="glyphicon glyphicon-stop" 
      aria-hidden="true" style="color: ${config.colorMap[datum]}" ></span> ${datum}`);
  }

  d3.csv('./Performance_DummyData.csv',(err, data) => {
    if (err)
      return err;  

    let chartData = d3.nest()
      .key(datum => datum['event'])
      .entries(data);
    console.log(chartData);

    let lineColor = ["red","yellow","green","blue","white","steelblue"];
    let colorMap = new Object();
    chartData.forEach((entry,i) => {
      colorMap[entry.key] = lineColor[i];
    } )

    renderLineCharts(chartData, '#chart-container', {
      isSelectAll: true,
      colorMap
    });
  });

})();
