// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ DatanodeDependency                                                 │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function DatanodeDependency() {
  /*

       Main idea : make current dependencyStructure data structure here. 
       create functions to handle it here (and not in other classes)  
       
       */
  /*
      The following dot graph
       digraph example {
           a -> b -> c;
           b -> d;
       }
       is stored in the following
       dependencyStructure[a]={b}
       dependencyStructure[b]={c,d}
       dependencyStructure[c]={}
       dependencyStructure[d]={}
      */

  var dependencyStructure = {};

  var extraStartNodes = [];
  var allDisconnectedGraphs = [];
  var SingletonNodeList = []; //isolated node

  /*-----------------addNode-----------------*/
  // adds a datanode to the dependency structure (as node)
  function addNode(dsName) {
    dependencyStructure[dsName] = new Set();
  }

  /*-----------------removeNode-----------------*/
  // removes the node and all edges from the other nodes
  function removeNode(dsName) {
    // remove the node of dsName in the dependency structure
    delete dependencyStructure[dsName];

    // removes edges from other nodes to the one to be deleted
    for (var ds in dependencyStructure) {
      if (dependencyStructure[ds].has(dsName)) {
        dependencyStructure[ds].delete(dsName);
      }
    }
  }

  /*-----------------addEdge-----------------*/
  // adds a directed edge from "fromNode" to "toNode"
  function addEdge(fromNode, toNode) {
    dependencyStructure[fromNode].add(toNode);
  }

  /*-----------------removeEdge-----------------*/
  // removes a directed edge from "fromNode" to "toNode"
  function removeEdge(fromNode, toNode) {
    dependencyStructure[fromNode].delete(toNode);
  }

  /*-----------------getSuccessors-----------------*/
  // returns an iterator over the set of the direct successors of node
  function getSuccessors(node) {
    return dependencyStructure[node].values();
  }

  /*-----------------getPredecessorsSet-----------------*/
  // returns an iterator over the set of the direct predecessors of node
  // NP : construire la structure des données des prédécesseurs en parallèle à celle des successeurs
  function getPredecessorsSet(node) {
    var predSet = new Set();
    for (var k in dependencyStructure) {
      if (dependencyStructure[k].has(node)) {
        predSet.add(k);
      }
    }

    return predSet;
  }

  /*-----------------hasSuccessors-----------------*/
  // returns whether a node has successors
  function hasSuccessors(node) {
    return dependencyStructure[node].size > 0;
  }

  /*-----------------getDecendantsinBFS-----------------*/
  function getDescendantsinBFS(startNode) {
    // écrire un algorithm de recherche de graphe en largeur.
    // voir par exemple https://fr.wikipedia.org/wiki/Algorithme_de_parcours_en_largeur
    // c'est plus efficace!
  }

  /*-----------------getDescendants-----------------*/
  function getDescendants(startNodes) {
    var graph, loop, desc;
    [graph, loop] = buildGraph();
    //startNodesDesc = new Set(startNodes); //AEF descendants should not include the start node
    startNodesDesc = new Set();
    startNodes.forEach(function (elem) {
      elemDesc = new Set(graph.getDescendants(elem));
      startNodesDesc = union(startNodesDesc, elemDesc);
    });
    return startNodesDesc;
  }

  /*-----------------getDisconnectedGraphs-----------------*/
  function getDisconnectedGraphs(startNodes, disconnectedGraphs) {
    var startNodesDesc = [];
    var graph, loop;
    var bIntersection;
    [graph, loop] = buildGraph();
    var sameGraph = new Set();
    startNodes.forEach(function (elem) {
      let graphElem = new Set(graph.getDescendants(elem));
      graphElem.add(elem);
      startNodesDesc.push(graphElem); //get all descendants of each startnode
    });

    if (startNodes.length == 1 && disconnectedGraphs.length == 0) {
      // If one starnode, put the only one connected graph into disconnectedGraphs
      disconnectedGraphs.push(startNodesDesc[0]);
    } else {
      for (let i = 0; i < startNodesDesc.length; i++) {
        sameGraph = startNodesDesc[i]; //initialize the connected graph
        for (let j = i + 1; j < startNodesDesc.length; j++) {
          let intersection = new Set([...sameGraph].filter((x) => startNodesDesc[j].has(x)));
          if (intersection.size != 0) {
            sameGraph = union(sameGraph, startNodesDesc[j]); //add to the connected graph
          }
        }
        if (disconnectedGraphs.length == 0) {
          //At the begining
          disconnectedGraphs.push(sameGraph); //put the first connected graph in disconnectedGraphs list
        } else {
          for (let k in disconnectedGraphs) {
            //verify if the connected graph is already added to disconnectedGraphs list
            let intersection = new Set([...sameGraph].filter((x) => disconnectedGraphs[k].has(x)));
            if (intersection.size == 0) {
              bIntersection = false;
            } else {
              //already exist
              if (intersection.size < sameGraph.size) {
                sameGraph = union(sameGraph, disconnectedGraphs[k]);
                disconnectedGraphs.splice(k, 1, sameGraph); //update the connected graph
              }
              bIntersection = true;
              break;
            }
          }
          if (!bIntersection) {
            //if not added, add the new connected graph to the list
            disconnectedGraphs.push(sameGraph);
          }
        }
        sameGraph = new Set(); //reset
      }
    }
    let i = 0;
    disconnectedGraphs.forEach(function (graph) {
      graph.id = graph.values().next().value + Math.random();
      graph.index = i;
      i++;
    });
    return disconnectedGraphs;
  }

  /*-----------------getBelongingDisconnectedGraph-----------------*/
  function getBelongingDisconnectedGraph(node, disconnectedGraphs) {
    var graph;
    disconnectedGraphs.some(function (disconGraph) {
      if (disconGraph.has(node)) {
        if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
          console.log('node ', node, ' is found in disconnected graph: ', disconGraph);
        graph = disconGraph;
      }
    });
    return graph;
  }

  /*-----------------computeAllDisconnectedGraphs-----------------*/
  function computeAllDisconnectedGraphs() {
    //compute once a time all disconnected graphs
    var allSourceNodes = getSourceNodes();
    var disconnectedGraphs = [];
    allDisconnectedGraphs = getDisconnectedGraphs(allSourceNodes, disconnectedGraphs);
    if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
      console.log('All disconnected Graphs: ', allDisconnectedGraphs);
    computeAllsingletonNodes();
  }

  /*-----------------updateDisconnectedGraphsList-----------------*/
  function updateDisconnectedGraphsList(nodeName, origin) {
    switch (origin) {
      case 'add':
        computeAllDisconnectedGraphs();
        break;
      case 'delete':
        if (isSingletonNode(nodeName)) {
          removeFromDisconnectedGraphs(nodeName);
        } else {
          computeAllDisconnectedGraphs();
        }
        break;
      case 'default':
        computeAllDisconnectedGraphs();
    }
  }

  /*-----------------computeAllDisconnectedGraphs-----------------*/
  function removeFromDisconnectedGraphs(nodeName) {
    allDisconnectedGraphs.some(function (disconGraph) {
      if (disconGraph.has(nodeName)) {
        disconGraph.delete(nodeName);
        let index = SingletonNodeList.indexOf(nodeName);
        SingletonNodeList.splice(index, 1);
      }
    });
  }

  /*-----------------getAllDisconnectedGraphs-----------------*/
  function getAllDisconnectedGraphs() {
    return allDisconnectedGraphs;
  }

  function resetGraphList() {
    allDisconnectedGraphs = [];
    SingletonNodeList = [];
  }
  /*-----------------computeAllsingletonNodes-----------------*/
  function computeAllsingletonNodes() {
    SingletonNodeList = [];
    allDisconnectedGraphs.some(function (disconGraph) {
      if (disconGraph.size == 1) {
        disconGraph.forEach(function (index, value, set) {
          SingletonNodeList.push(value);
        });
      }
    });
    //console.log("all single disconnected graph:", SingletonNodeList);
  }

  /*-----------------getAllsingletonNodes-----------------*/
  function getAllsingletonNodes() {
    if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) console.log('SingletonNodeList: ', SingletonNodeList);
    return SingletonNodeList;
  }
  /*-----------------isSingletonNode-----------------*/
  function isSingletonNode(nodeName) {
    return SingletonNodeList.includes(nodeName);
  }

  /*-----------------getSourceNodes-----------------*/
  // returs the source nodes of the graph (whose indegree is 0)
  function getSourceNodes() {
    var graph = buildGraphDS();
    var nodes = graph.nodes();
    var sourceNodes = [];
    for (var node in nodes) {
      if (graph.indegree(nodes[node]) == 0) {
        sourceNodes.push(nodes[node]);
      }
    }
    return sourceNodes;
  }

  /*-----------------getExtraStartNodes-----------------*/
  // returs the extra start nodes came from user refresh, setvalue, setfile, edit and add
  function getExtraStartNodes() {
    return extraStartNodes;
  }

  /*-----------------setExtraStartNodes-----------------*/
  // add the extra start node came from user refresh, setvalue, setfile, edit and add
  function setExtraStartNodes(dsName, callOrigin) {
    if (!_.isUndefined(extraStartNodes[dsName])) {
      xdashNotifications.manageNotification(
        'info',
        dsName,
        dsName + ' is called many consecutif times while scheduler is in progress'
      );
    }
    extraStartNodes[dsName] = callOrigin;
  }

  /*-----------------clearExtraStartNodes-----------------*/
  // clear the extra start nodes came from user refresh, setvalue, setfile, edit and add
  function clearExtraStartNodes() {
    for (var prop in extraStartNodes) {
      delete extraStartNodes[prop];
    }
  }

  /*-----------------hasPredecessors-----------------*/
  // returns whether a node has predecessors
  function hasPredecessors(node) {
    var bDependent = false;
    for (var k in dependencyStructure) {
      if (dependencyStructure[k].has(node)) {
        bDependent = true;
        break;
      }
    }
    return bDependent;
  }

  /*-----------------isNode-----------------*/
  // tests whether a datanode exists as a node in the data structure
  // can be used for safety check functions
  function isNode(dsName) {
    if (_.isUndefined(dependencyStructure[dsName])) {
      return false;
    } else {
      return true;
    }
  }

  /*-----------------renameNode-----------------*/
  // renames the node in the dependency structure
  function renameNode(oldDsName, newDsName) {
    for (var ds in dependencyStructure) {
      if (dependencyStructure[ds].has(oldDsName)) {
        dependencyStructure[ds].delete(oldDsName);
        dependencyStructure[ds].add(newDsName);
      }
    }
    var dsSave = dependencyStructure[oldDsName];
    delete dependencyStructure[oldDsName];
    dependencyStructure[newDsName] = dsSave;
  }

  /*-----------------removeMissedDependantDatanodes-----------------*/
  // used for formula update
  function removeMissedDependantDatanodes(allDsNames, dsName) {
    for (var ds in dependencyStructure) {
      if (!allDsNames.has(ds)) {
        if (dependencyStructure[ds].has(dsName)) {
          dependencyStructure[ds].delete(dsName);
        }
      }
    }
  }

  /*-----------------buildGraph-----------------*/
  // private function
  // builds a Graph object from tarjan-graph.js
  function buildGraph() {
    var graph = new Graph();
    var loop = false;
    var ds;
    for (ds in dependencyStructure) {
      var node = ds;
      //var edges = Array.from(dependencyMatrix[ds]); // MBG remove EC6
      var edges = [];
      dependencyStructure[ds].forEach(function (value) {
        edges.push(value);
      });
      graph.add(node, edges);
      for (var i in edges) {
        if (edges[i] === node) {
          loop = true;
        }
      }
    }
    return [graph, loop];
  }

  /*-----------------buildGraphDS-----------------*/
  // constructs a GraphDS object from graph-data-structure.js
  function buildGraphDS() {
    var graph = new GraphDS();
    for (var ds in dependencyStructure) {
      var node = ds;
      graph.addNode(node);
      dependencyStructure[ds].forEach(function (value) {
        graph.addEdge(node, value);
      });
    }
    return graph;
  }

  /*-----------------topologicalSort-----------------*/
  // constructs a GraphDS object from graph-data-structure.js
  // then use it to get topological order
  function topologicalSort() {
    var graph = buildGraphDS();
    //remove nodes from graph that doesn't exist as datanodes
    graph.nodes().forEach(function (nodeName) {
      if (!datanodesManager.foundDatanode(nodeName)) {
        graph.removeNode(nodeName);
      }
    });
    //
    var topologicalOrder = graph.topologicalSort();
    return topologicalOrder;
  }

  /*-----------------detectCycles-----------------*/
  // builds a Graph object from tarjan-graph.js
  // then detects cycles
  // that way we ensure, by construction, that we have a DAG
  function detectCycles() {
    var graph, loop;
    [graph, loop] = buildGraph();
    return { hasCycle: graph.hasCycle(), getCycles: graph.getCycles(), hasLoop: loop };
  }

  // public methods
  return {
    dependencyStructure, // should be private. to make private at the end
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    removeMissedDependantDatanodes,
    getSuccessors,
    getPredecessorsSet,
    hasSuccessors,
    hasPredecessors,
    getSourceNodes,
    getDescendantsinBFS,
    getDescendants,
    getDisconnectedGraphs,
    getBelongingDisconnectedGraph,
    computeAllDisconnectedGraphs,
    getAllDisconnectedGraphs,
    resetGraphList,
    isNode,
    renameNode,
    topologicalSort,
    detectCycles,
    getExtraStartNodes,
    setExtraStartNodes,
    clearExtraStartNodes,
    getAllsingletonNodes,
    isSingletonNode,
    updateDisconnectedGraphsList,
  };
}
