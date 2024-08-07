// ┌──────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ ProfGraphService                                                                     │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2024 IFPEN                                                               │ \\
// | Licensed under the Apache License, Version 2.0                                       │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR                                                   │ \\
// └──────────────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import * as echarts from 'echarts';
import { schedulerProfiling } from 'kernel/datanodes/execution-engine/DatanodeScheduler';

angular.module('modules.dashboard').service('ProfGraphService', [
  '$rootScope',
  function ($rootScope) {
    const self = this;

    /*---------- startProfiling ----------------*/
    // Initialize the profiling chart
    self.startProfiling = function () {
      if (_.isEmpty(schedulerProfiling)) return;

      const { data, yAxis, startTime } = processData(schedulerProfiling);
      const option = buildChartOption(data, yAxis, startTime);
      renderChart(option);
      setupEventListeners();
    };

    /*---------- processData ----------------*/
    // Process scheduler profiling data
    function processData(schedulerProfiling) {
      const data = [];
      let startTime = Number.MAX_VALUE;
      const yAxis = [];
      for (const [dnName, dnValues] of Object.entries(schedulerProfiling)) {
        dnValues.forEach((value, index) => {
          const { release, completion, status } = value;
          processNodeValue({ dnName, dnValues, status, release, completion, index, yAxis, data });
          startTime = Math.min(startTime, release);
        });
      }
      return { data, yAxis, startTime };
    }

    /*---------- processNodeValue ----------------*/
    // Process individual node values for chart data
    function processNodeValue({ dnName, dnValues, status, release, completion, index, yAxis, data }) {
      const duration = completion - release;
      const color = status === 'OK' ? '#7CFC00' : '#fc033d';
      const baseLabel = `${dnName} (${status})`;
      const label = dnValues.length > 1 ? `${baseLabel} #${index + 1}` : baseLabel;

      if (index === 0) yAxis.push(label);

      data.push({
        name: label,
        value: [yAxis.indexOf(label), release, release + duration, duration],
        itemStyle: { normal: { color } },
      });
    }

    /*---------- buildChartOption ----------------*/
    // Build chart option based on processed data
    function buildChartOption(data, yAxis, startTime) {
      return {
        backgroundColor: '#fff',
        tooltip: { formatter: (params) => `${params.marker}${params.name}: ${params.value[3]} ms` },
        dataZoom: buildDataZoom(),
        grid: { containLabel: true, left: '4%' },
        xAxis: buildXAxis(startTime),
        yAxis: { data: yAxis },
        series: [buildSeries(data)],
      };
    }

    /*---------- buildDataZoom ----------------*/
    // Helper function to configure the data zoom controls
    function buildDataZoom() {
      return [
        {
          type: 'slider',
          filterMode: 'weakFilter',
          showDataShadow: false,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          labelFormatter: '',
        },
        {
          type: 'slider',
          filterMode: 'weakFilter',
          showDataShadow: false,
          yAxisIndex: [0],
          start: 0,
          end: 100,
          left: '93%',
        },
        {
          type: 'inside',
          filterMode: 'weakFilter',
          xAxisIndex: [0],
        },
      ];
    }

    /*---------- buildXAxis ----------------*/
    // Helper function to configure the X-axis
    function buildXAxis(startTime) {
      return {
        min: startTime,
        scale: true,
        axisLabel: {
          formatter: function (val) {
            return `${Math.max(0, val - startTime)} ms`;
          },
        },
      };
    }

    /*---------- buildSeries ----------------*/
    // Helper function to configure the series data
    function buildSeries(data) {
      return {
        type: 'custom',
        renderItem: (params, api) => {
          const categoryIndex = api.value(0);
          const start = api.coord([api.value(1), categoryIndex]);
          const end = api.coord([api.value(2), categoryIndex]);
          const height = api.size([0, 1])[1] * 0.6;
          const rectShape = echarts.graphic.clipRectByRect(
            {
              x: start[0],
              y: start[1] - height / 2,
              width: end[0] - start[0],
              height: height,
            },
            {
              x: params.coordSys.x,
              y: params.coordSys.y,
              width: params.coordSys.width,
              height: params.coordSys.height,
            }
          );
          return (
            rectShape && {
              type: 'rect',
              transition: ['shape'],
              shape: rectShape,
              style: api.style(),
            }
          );
        },
        itemStyle: {
          opacity: 0.9,
        },
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: data,
      };
    }

    /*---------- renderChart ----------------*/
    // Render the chart with the given option
    function renderChart(option) {
      const chartContainer = document.getElementById('schedulingGraphBody');
      const chart = echarts.init(chartContainer);
      chart.setOption(option);
      observeResize(chartContainer, chart);
    }

    /*---------- setupEventListeners ----------------*/
    // Setup event listeners for chart interactions
    function setupEventListeners() {
      setupExportListener();
      setupFullScreenToggle();
    }

    /*---------- observeResize ----------------*/
    // Observe container resize to adjust chart
    function observeResize(container, chart) {
      const resizeObserver = new ResizeObserver(() => {
        chart.resize();
      });
      resizeObserver.observe(container);
    }

    /*---------- setupExportListener ----------------*/
    // Setup listener for exporting the chart
    function setupExportListener() {
      document.getElementById('exportSchedulingGraph').addEventListener('click', function () {
        const chart = echarts.getInstanceByDom(document.getElementById('schedulingGraphBody'));
        if (!chart) {
          console.error('Chart instance not found');
          return;
        }
        const url = chart.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff',
        });
        const link = document.createElement('a');
        link.href = url;
        link.download = 'scheduling-graph.png'; // Set the file name for download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    /*---------- setupFullScreenToggle ----------------*/
    // Setup full screen toggle functionality
    function setupFullScreenToggle() {
      document.getElementById('toggleFullScreen').addEventListener('click', function () {
        const chartContainer = document.getElementById('schedulingGraphBody');
        if (!document.fullscreenElement) {
          if (chartContainer.requestFullscreen) {
            chartContainer.requestFullscreen();
          } else if (chartContainer.webkitRequestFullscreen) {
            // Safari
            chartContainer.webkitRequestFullscreen();
          } else if (chartContainer.msRequestFullscreen) {
            // IE11
            chartContainer.msRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            // Safari
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
            // IE11
            document.msExitFullscreen();
          }
        }
      });
    }
  },
]);
