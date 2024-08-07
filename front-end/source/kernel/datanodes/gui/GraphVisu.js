// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ GraphVisu                                                          │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mondher AJIMI, Abir EL FEKI                   │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import { DataSet, Network } from 'vis-network/standalone';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { PREVIEW_JSON_FORMAT, jsonDataToBasicHtmlElement } from 'kernel/datanodes/plugins/thirdparty/utils';

// FIXME
// import { assertEditorOnly } from 'kernel/utils/asserts';
// assertEditorOnly();

export function GraphVisu(datanodesDependency) {
  var offsetx, offsety, scale, duration, easingFunction;
  var network = null;
  var nodesGlobal = [];
  var edgesGlobal = [];
  var nodesLabelsIds = {};
  var tagListTypes = [];
  var nodesTmp = [];
  let highlightNodeByWidget = [];
  let highlightNodeByType = [];
  let highlightNodeByWidgetConnection = [];
  let countFoundedNode = 0;

  /*-----------------buildGraphHtml-----------------*/
  // private function
  // builds a Graph object from tarjan-graph.js
  // for GraphViz (solve forbidden chars pb)
  function buildGraphHtml() {
    var graph = new Graph();
    var ds;
    for (const ds in datanodesDependency.dependencyStructure) {
      var node = ds;
      // var edges = Array.from(dependencyMatrix[ds]); // MBG remove EC6
      var edges = [];
      datanodesDependency.dependencyStructure[ds].forEach(function (value) {
        edges.push(value);
      });
      //
      var nodeClean = '"' + node + '"';
      var edgesClean = [];
      for (var i in edges) {
        edgesClean[i] = '"' + edges[i] + '"';
      }
      graph.add(nodeClean, edgesClean);
    }
    return graph;
  }

  /*-----------------showGraph-----------------*/
  // graphical rendering of the dependency graph
  // mainly based on Viz
  /*function showGraph() {
        var graph = buildGraphHtml();
        var graphViewBody = $('<div id="dependencyGraphBody" class="modal-body" style="vertical-align: middle; overflow: auto; display: block; margin: auto; max-width: 80vw"></div>');
        DialogBox(graphViewBody, 'DataNodes dependency graph', null, "Close", null);
        $('#dependencyGraphBody')[0].parentNode.style.width = "80vw"; // added to enlarge dialogbox
        //AEF: modif to show singleton nodes
        var graphToDOt = graph.toDot();
        var array = graphToDOt.split('\n'); //convert string to array
        for (var ds in dependencyStructure) {
      var node = ds;
      if (!hasPredecessors(node) && !hasSuccessors(node))
          array.splice(array.length - 2, 0, "\"" + node + "\""); // length - 2 because length - 1 is '\n'
        }
        var newGraphToDot = array.join('\n'); //convert array to string
        var graphSvg = Viz(newGraphToDot);
        //
        //var graphSvg = Viz(graph.toDot());
        $('#dependencyGraphBody').html(graphSvg);
    }*/

  /*-----------------showGraph-----------------*/
  // graphical rendering of the dependency graph
  // mainly based on Vis
  function showDepGraph(selectedNodeName) {
    let dataNode = datanodesManager.getAllDataNodes();

    let nodeNames = [];

    for (let ds in dataNode) {
      nodeNames[ds] = dataNode[ds].name();
    }
    let nodes = [];

    for (var i = 0; i < nodeNames.length; i++) {
      nodes.push({
        id: i,
        label: nodeNames[i],
        title: htmlTitle(nodeNames[i]),
        type: datanodesManager.getDataNodeByName(nodeNames[i]).type(),
        disconnected: datanodesDependency.isSingletonNode(nodeNames[i]),
        widgetConnection: datanodesManager.isConnectedWithWidgt(nodeNames[i])[0],
      });
      nodesLabelsIds[nodeNames[i]] = i;
    }
    nodesTmp = nodes;

    let edges = [];
    let nodeEdges = [];

    for (var j = 0; j < nodeNames.length; j++) {
      nodeEdges = Array.from(datanodesDependency.dependencyStructure[nodeNames[j]]);
      for (var k = 0; k < nodeEdges.length; k++) {
        edges.push({ from: j, to: nodesLabelsIds[nodeEdges[k]], arrows: 'to' });
      }
    }

    nodesGlobal = new DataSet(nodes);
    edgesGlobal = new DataSet(edges);

    startNetwork({ nodes: nodesGlobal, edges: edgesGlobal }, selectedNodeName);
  }

  function startNetwork(data, selectedNodeName) {
    var graphViewBody = $(
      '<div id="dependencyGraphBody" class="modal-body" style="vertical-align: middle; overflow: auto; display: block; margin: auto; width: 938px; height: 625px; border: 1px solid lightgray;"></div>'
    );

    if (!document.getElementById('dependencyGraph').hasChildNodes()) {
      graphViewBody.appendTo($('#dependencyGraph')); //$('#dependencyGraph').html(graphViewBody);
    }

    var container = document.getElementById('dependencyGraphBody');
    var options = {
      layout: {
        randomSeed: 3,
      },
      nodes: {
        borderWidth: 1,
        font: {
          size: 15,
          color: '#0843b9',
        },
        color: {
          border: '#478dec',
          background: '#e3ecff',
        },
        shape: 'box',
        margin: 15,
      },
      edges: {
        color: '#9fb8ed',
      },
      interaction: {
        hover: true,
        zoomView: true,
      },
      physics: {
        forceAtlas2Based: {
          theta: 0.2,
          gravitationalConstant: -65,
          centralGravity: 0.015,
          springLength: 70,
          damping: 0.7,
          avoidOverlap: 0.95,
        },
        minVelocity: 20,
        solver: 'forceAtlas2Based',
        timestep: 0.1,
      },
    };
    network = new Network(container, data, options);
    //todo adds an id to the canvas, which is used when downloading pictures, and should be placed after new vis.Network(container, data, options); otherwise the value will not be obtained
    $('#dependencyGraphBody canvas').attr('id', 'canvas');

    network.on('doubleClick', function (params) {
      var nodeId = params.nodes[0];
      let allData = datanodesManager.getAllDataNodes();
      datanodesManager.editNodeFromGraph(allData[nodeId]);
    });

    var networkCanvas = document.getElementById('dependencyGraphBody').getElementsByTagName('canvas')[0];

    network.on('hoverNode', function () {
      networkCanvas.style.cursor = 'pointer';
    });

    network.on('blurNode', function () {
      networkCanvas.style.cursor = 'default';
    });

    //AEF: fix zoom issue for big graphs // Zoom is done after graph constrution and stabilization
    network.on('stabilizationIterationsDone', function () {
      selectNodebyName(selectedNodeName);
    });

    Network.prototype.setScale = function (scale) {
      var animationOptions = {
        position: { x: 0, y: 0 },
        scale: scale,
        animation: { duration: 300 },
      };
      if (animationOptions.scale >= 0) {
        this.view.moveTo(animationOptions);
      }
    };
  }

  function htmlTitle(dsName) {
    const data = datanodesManager.getDataNodeByName(dsName)?.latestData();
    return jsonDataToBasicHtmlElement(data, { jsonFormat: PREVIEW_JSON_FORMAT });
  }

  function selectNodebyName(nodeName) {
    highlightNodeByWidget = [];
    if (typeof nodeName === 'string') {
      nodesGlobal.update([{ id: nodesLabelsIds[nodeName], color: { background: 'orange' } }]);
      focusOnNode(nodesLabelsIds[nodeName]);
    } else if (typeof nodeName === 'object') {
      nodeName = JSON.parse(nodeName.target.attributes.name.value);
      for (let k = 0; k < nodeName.length; k++) {
        highlightNodeByWidget.push({
          id: nodesLabelsIds[nodeName[k]],
          color: { background: 'orangered' },
        });
      }

      nodesGlobal.update(highlightNodeByWidget);

      if (nodeName.length === 1) focusOnNode(nodesLabelsIds[nodeName[0]]);
    }
  }

  function selectNodeFromTagList(nodeType) {
    var tagElementType = document.getElementById(nodeType);
    var foundElements = [];
    if (tagElementType.classList.contains('active')) {
      tagElementType.classList.remove('active');
      for (let i = 0; i < highlightNodeByType.length; i++) {
        if (highlightNodeByType[i]['type'] === nodeType) {
          highlightNodeByType[i]['color'] = { background: '#e3ecff' };
          foundElements.push(highlightNodeByType[i]);
        }
      }
      nodesGlobal.update(highlightNodeByType);
      fitAnimated();

      if (tagListTypes.indexOf(nodeType) !== -1) {
        tagListTypes.splice(tagListTypes.indexOf(nodeType), 1);
      }
      for (let k = 0; k < foundElements.length; k++) {
        highlightNodeByType.splice(highlightNodeByType.indexOf(foundElements[k]), 1);
      }
    } else {
      countFoundedNode = 0;

      if (tagListTypes.indexOf(nodeType) === -1) {
        tagListTypes.push(nodeType);
      }

      tagElementType.classList.add('active');

      for (let j = 0; j < nodesTmp.length; j++) {
        if (nodesTmp[j].type === nodeType) {
          highlightNodeByType.push({
            id: nodesLabelsIds[nodesTmp[j].label],
            type: nodeType,
            color: { background: 'yellow' },
          });
          countFoundedNode++;
        }
      }
      nodesGlobal.update(highlightNodeByType);

      if (countFoundedNode === 1) {
        focusOnNode(highlightNodeByType[0]['id'].toString());
      } else {
        fitAnimated();
      }
    }
  }

  function selectConnectedWithWidget(choice) {
    var tagElement = document.getElementById(choice);
    var foundElements = [];
    if (tagElement.classList.contains('active')) {
      tagElement.classList.remove('active');
      for (let i = 0; i < highlightNodeByWidgetConnection.length; i++) {
        if (highlightNodeByWidgetConnection[i]['color']['border'] === 'green' && choice === 'connectedtowidget') {
          highlightNodeByWidgetConnection[i]['color'] = { border: '#478dec' };
          highlightNodeByWidgetConnection[i]['borderWidth'] = 1;
          foundElements.push(highlightNodeByWidgetConnection[i]);
        }
        if (highlightNodeByWidgetConnection[i]['color']['border'] === 'red' && choice === 'notconnectedtowidget') {
          highlightNodeByWidgetConnection[i]['color'] = { border: '#478dec' };
          highlightNodeByWidgetConnection[i]['borderWidth'] = 1;
          foundElements.push(highlightNodeByWidgetConnection[i]);
        }
      }

      nodesGlobal.update(highlightNodeByWidgetConnection);
      fitAnimated();

      for (let k = 0; k < foundElements.length; k++) {
        highlightNodeByWidgetConnection.splice(highlightNodeByWidgetConnection.indexOf(foundElements[k]), 1);
      }
    } else {
      countFoundedNode = 0;

      tagElement.classList.add('active');

      for (let j = 0; j < nodesTmp.length; j++) {
        if (nodesTmp[j].widgetConnection === true && choice === 'connectedtowidget') {
          highlightNodeByWidgetConnection.push({
            id: nodesLabelsIds[nodesTmp[j].label],
            borderWidth: 3,
            color: { border: 'green' },
          });
          countFoundedNode++;
        }
        if (nodesTmp[j].widgetConnection === false && choice === 'notconnectedtowidget') {
          highlightNodeByWidgetConnection.push({
            id: nodesLabelsIds[nodesTmp[j].label],
            borderWidth: 3,
            color: { border: 'red' },
          });
          countFoundedNode++;
        }
      }
      nodesGlobal.update(highlightNodeByWidgetConnection);
      if (countFoundedNode === 1) {
        focusOnNode(highlightNodeByWidgetConnection[highlightNodeByWidgetConnection.length - 1]['id'].toString());
      } else {
        fitAnimated();
      }
    }
  }

  function focusOnNode(nodeId) {
    updateValues();
    var options = {
      scale: scale,
      offset: { x: offsetx, y: offsety },
      animation: {
        duration: duration,
        easingFunction: easingFunction,
      },
    };
    network.focus(nodeId, options);
  }

  function updateValues() {
    offsetx = 0;
    offsety = 0;
    duration = 1000;
    scale = 3.0;
    // positionx = 300;
    // positiony = 300;
    easingFunction = 'easeInOutQuint';
  }

  function fitAnimated() {
    updateValues();

    var options = {
      offset: { x: offsetx, y: offsety },
      duration: duration,
      easingFunction: easingFunction,
    };
    network.fit({ animation: options });
  }

  function closeGraph() {
    highlightNodeByWidget = [];
    highlightNodeByType = [];
    highlightNodeByWidgetConnection = [];
    countFoundedNode = 0;
    $('#inputSearchGraph').val('');
    while (tagListTypes.length) {
      for (var i = 0; i < tagListTypes.length; i++) {
        var tagElementNode = document.getElementById(tagListTypes[i]);
        tagElementNode.classList.remove('active');
      }
      tagListTypes.pop();
    }
    document.getElementById('connectedtowidget').classList.remove('active');
    document.getElementById('notconnectedtowidget').classList.remove('active');
  }

  function searchGraph(val) {
    var tmpNode;
    countFoundedNode = 0;
    for (let k = 0; k < nodesTmp.length; k++) {
      nodesGlobal.update([
        {
          id: nodesLabelsIds[nodesTmp[k].label],
          font: { color: '#0843b9', background: '#e3ecff' },
        },
      ]);
      if (nodesTmp[k].label.toLowerCase().match(val) && val.length > 2) {
        nodesGlobal.update([
          {
            id: nodesLabelsIds[nodesTmp[k].label],
            font: { color: 'white', background: 'black' },
          },
        ]);
        tmpNode = nodesTmp[k].label;
        countFoundedNode++;
      }
    }
    if (countFoundedNode === 1) {
      focusOnNode(nodesLabelsIds[tmpNode]);
    } else {
      fitAnimated();
    }
  }

  function exportGraph() {
    var mynetworkCanvas = document.getElementById('canvas');
    console.log('mynetworkCanvas', mynetworkCanvas);
    mynetworkCanvas.toBlob(function (blob) {
      var a = document.createElement('a');
      document.body.appendChild(a);
      a.download = 'network' + '.png';
      a.href = window.URL.createObjectURL(blob);
      a.click();
    });
  }
  function zoomOut() {
    network.setScale(network.getScale() - 0.3);
  }
  function zoomIn() {
    network.setScale(network.getScale() + 0.3);
  }
  function openFullScreen() {
    var elem = document.getElementById('dependencyGraphBody');
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE11 */
      elem.msRequestFullscreen();
    }
  }

  // public methods
  return {
    //showGraph,
    showDepGraph,
    selectNodeFromTagList,
    selectConnectedWithWidget,
    closeGraph,
    exportGraph,
    zoomOut,
    zoomIn,
    openFullScreen,
    searchGraph,
  };
}
