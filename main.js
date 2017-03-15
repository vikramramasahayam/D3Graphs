(function () {

  function renderLineCharts(data, container = 'body', config = {}) {
    let chartData = data.filter(datum => !datum.isDisabled);
    const containerWidth = config.width || 900;
    const containerHeight = config.height || 400;
    const margin = config.margin || { top: 20, right: 20, bottom: 30, left: 50 };
    
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
      .rangeRound([0, chartWidth])
      .domain(chartData[0].values.map(datum => datum['Date'] ));

    let y = d3.scaleLinear()
      .rangeRound([chartHeight, 0])
      .domain([0, d3.max(chartData, datum => d3.max(datum.values, (value) => parseInt(value['Lat'])))]);
    
    let line = d3.line()
      .x(d => x(d['Date']))
      .y(d => y(parseInt(d['Lat'])));
    

  // Define the div for the tooltip
    let tooltip = d3.select(container)
      .append("div")	
      .attr("class", "tooltip")				
      .style("opacity", 0);

    chartContainer
      .append('g')
      .classed('x-axis', true)
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x));

    chartContainer
      .append('g')
      .classed('y-axis', true)
      .call(d3.axisLeft(y))
    .append('text')
      .attr('fill', '#fff')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .text('Lat');
    
    chartData.forEach((datum) => {
      chartContainer
        .append('path')
        .datum(datum.values)
        .attr('fill', 'none')
        .attr('stroke', config.lineColor || 'steelblue')
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
        .attr('r', 5)
        .attr('cx', d => x(d['Date']))
        .attr('cy', d => y(parseInt(d['Lat'])))
        .on('mouseover', d => {
            tooltip.transition()		
              .duration(500)		
              .style('opacity', .9)
              .style('left', `${d3.event.pageX}px`)
              .style('top', `${d3.event.pageY - 28}px`);

            tooltip.html(`${d['Date']} <br/> ${d['Lat']}`);
          })					
        .on('mouseout', d => {
            tooltip.transition()		
                .duration(500)		
                .style('opacity', 0);	
        });
    });
  } 
    //Rendering Legends
    let activeFilters = data.filter(datum => !datum['isDisabled'])
      .map(datum => datum.key);
    

    d3.select('#legends')
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
  }

  d3.csv('./Wifi_data.csv',(err, data) => {
    if (err)
      return err;  

    let chartData = d3.nest()
      .key(datum => datum['Event'])
      .entries(data);
    console.log(chartData);
    renderLineCharts(chartData, '#chart-container');
  });

})();
