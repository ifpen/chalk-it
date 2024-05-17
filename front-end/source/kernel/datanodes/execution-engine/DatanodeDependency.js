// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ DatanodeDependency                                                 │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import { xDashConfig } from 'config.js';
import _ from 'lodash';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { union } from 'kernel/datanodes/plugins/thirdparty/utils';
import { offSchedLogUser } from 'kernel/base/main-common';
import { runtimeSingletons } from 'kernel/runtime-singletons';
import GraphDS from 'graph-data-structure'; // FIXME 2 type of graphs ?
import Graph from 'tarjan-graph';

export function DatanodeDependency() {
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

  var extraStartNodesList = new Map();
  var setvarList = new Map();
  var processedSetvarList = new Map();
  var memorydataNodeList = new Map();
  var currentGraphList = new Map();

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
    for (let ds in dependencyStructure) {
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
    let predSet = new Set();
    for (let k in dependencyStructure) {
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
  function getDescendants(startNodes, withoutMem) {
    let graph, loop;
    if (withoutMem) [graph, loop] = buildGraphWithoutMemory();
    else [graph, loop] = buildGraph();
    //startNodesDesc = new Set(startNodes); //AEF descendants should not include the start node
    let startNodesDesc = new Set();
    startNodes.forEach(function (elem) {
      const elemDesc = new Set(graph.getDescendants(elem));
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
    let graph;
    disconnectedGraphs.some(function (disconGraph) {
      if (disconGraph.has(node)) {
        if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
          console.log('node ', node, ' is found in disconnected graph: ', disconGraph);
        graph = disconGraph;
      }
    });
    return graph;
  }

  /*-----------------computeAllDisconnectedGraphs-----------------*/
  function computeAllDisconnectedGraphs() {
    //compute once a time all disconnected graphs
    const allSourceNodes = getSourceNodesWithMemory();
    let disconnectedGraphs = [];
    allDisconnectedGraphs = getDisconnectedGraphs(allSourceNodes, disconnectedGraphs);
    if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
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
    if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
      console.log('SingletonNodeList: ', SingletonNodeList);
    return SingletonNodeList;
  }
  /*-----------------isSingletonNode-----------------*/
  function isSingletonNode(nodeName) {
    return SingletonNodeList.includes(nodeName);
  }

  /*-----------------getSourceNodes-----------------*/
  // returs the source nodes of the graph (whose indegree is 0)
  function getSourceNodes() {
    const graph = buildGraphDS();
    const nodes = graph.nodes();
    let sourceNodes = [];
    for (let node in nodes) {
      if (graph.indegree(nodes[node]) == 0) {
        sourceNodes.push(nodes[node]);
      }
    }
    return sourceNodes;
  }

  /*-----------------getSourceNodesWithMemory-----------------*/
  function getSourceNodesWithMemory() {
    const graph = buildGraphDS();
    const nodes = graph.nodes();
    let sourceNodes = [];
    for (let node in nodes) {
      if (graph.indegree(nodes[node]) == 0) {
        sourceNodes.push(nodes[node]);
      } else if (nodes[node].indexOf('pastValue_') !== -1) {
        sourceNodes.push(nodes[node]);
      }
    }
    return sourceNodes;
  }

  /*-----------------getExtraStartNodesList-----------------*/
  // returs the extra start nodes came from user refresh, setvalue, setfile, edit and add
  function getExtraStartNodesList() {
    return extraStartNodesList;
  }

  /*-----------------addExtraStartNodesList-----------------*/
  // add the extra start node came from user refresh, setvalue, setfile, edit and add
  function addExtraStartNodesList(dsName, callOrigin) {
    if (extraStartNodesList.has(dsName)) {
      runtimeSingletons.xdashNotifications.manageNotification(
        'info',
        dsName,
        dsName + ' is called many consecutif times while scheduler is in progress'
      );
    }
    extraStartNodesList.set(dsName, callOrigin);
  }

  /*-----------------clearExtraStartNodesList-----------------*/
  // clear the extra start nodes came from user refresh, setvalue, setfile, edit and add
  function clearExtraStartNodesList() {
    extraStartNodesList.clear();
  }

  /*-----------------getSetvarList-----------------*/
  function getSetvarList() {
    return setvarList;
  }

  /*-----------------addSetvarList-----------------*/
  function addSetvarList(dsName, callOrigin) {
    if (setvarList.has(dsName)) {
      if (setvarList.get(dsName) !== callOrigin)
        runtimeSingletons.xdashNotifications.manageNotification(
          'warning',
          dsName,
          'Possible undeterminism: setVariable of "' +
            dsName +
            '" is used more than once in other dataNodes as: "' +
            setvarList.get(dsName) +
            '" and "' +
            callOrigin +
            '"'
        );
    }
    setvarList.set(dsName, callOrigin);
  }

  /*-----------------clearSetvarList-----------------*/
  function clearSetvarList() {
    setvarList.clear();
  }

  /*-----------------getProcessedSetvarList-----------------*/
  function getProcessedSetvarList() {
    return processedSetvarList;
  }

  /*-----------------addProcessedSetvarList-----------------*/
  function addProcessedSetvarList(sourceMap) {
    for (const [key, value] of sourceMap.entries()) {
      processedSetvarList.set(key, value);
    }
  }

  /*-----------------clearProcessedSetvarList-----------------*/
  function clearProcessedSetvarList() {
    processedSetvarList.clear();
  }

  /*-----------------getMemorydataNodeList-----------------*/
  function getMemorydataNodeList() {
    return memorydataNodeList;
  }
  /*-----------------addMemorydataNodeList-----------------*/
  function addMemorydataNodeList(dsName) {
    memorydataNodeList.set(dsName, 'memory');
  }

  /*-----------------clearMemorydataNodeList-----------------*/
  function clearMemorydataNodeList(memList) {
    if (_.isUndefined(memList)) {
      memorydataNodeList.clear();
    } else {
      memList.forEach((item) => {
        if (memorydataNodeList.has(item)) {
          memorydataNodeList.delete(item);
        }
      });
    }
  }

  /*-----------------getCurrentGraphList-----------------*/
  function getCurrentGraphList() {
    return currentGraphList;
  }

  /*-----------------addCurrentGraphList-----------------*/
  function addCurrentGraphList(dsName, index) {
    if (currentGraphList.has(dsName)) {
    }
    currentGraphList.set(dsName, index);
  }

  /*-----------------clearCurrentGraphList-----------------*/
  function clearCurrentGraphList() {
    currentGraphList.clear();
  }

  /*-----------------hasPredecessors-----------------*/
  // returns whether a node has predecessors
  function hasPredecessors(node) {
    let bDependent = false;
    for (let k in dependencyStructure) {
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
    for (let ds in dependencyStructure) {
      if (dependencyStructure[ds].has(oldDsName)) {
        dependencyStructure[ds].delete(oldDsName);
        dependencyStructure[ds].add(newDsName);
      }
    }
    const dsSave = dependencyStructure[oldDsName];
    delete dependencyStructure[oldDsName];
    dependencyStructure[newDsName] = dsSave;
  }

  /*-----------------removeMissedDependantDatanodes-----------------*/
  // used for formula update
  function removeMissedDependantDatanodes(allDsNames, dsName) {
    for (let ds in dependencyStructure) {
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
    let graph = new Graph();
    let loop = false;
    for (let ds in dependencyStructure) {
      let node = ds;
      let edges = [];
      dependencyStructure[ds].forEach(function (value) {
        edges.push(value);
      });
      graph.add(node, edges);
      for (let i in edges) {
        if (edges[i] === node) {
          loop = true;
        }
      }
    }
    return [graph, loop];
  }

  /*-----------------buildGraph-----------------*/
  // private function
  // builds a Graph object from tarjan-graph.js
  function buildGraphWithoutMemory() {
    let graph = new Graph();
    let loop = false;
    for (let ds in dependencyStructure) {
      let node = ds;
      let edges = [];
      dependencyStructure[ds].forEach(function (value) {
        let add_edge = true;
        let match = value.match(/pastValue_(.+)/);
        if (match) {
          let origin_name = match[1];
          if (ds == origin_name) add_edge = false;
        }
        if (add_edge) edges.push(value);
      });
      graph.add(node, edges);
      for (let i in edges) {
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
    let graph = new GraphDS();
    for (let ds in dependencyStructure) {
      let node = ds;
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
    let graph = buildGraphDS();
    //remove nodes from graph that doesn't exist as datanodes
    graph.nodes().forEach(function (nodeName) {
      if (!datanodesManager.foundDatanode(nodeName)) {
        graph.removeNode(nodeName);
      }
    });
    //
    const topologicalOrder = graph.topologicalSort();
    return topologicalOrder;
  }

  /*-----------------detectCycles-----------------*/
  // builds a Graph object from tarjan-graph.js
  // then detects cycles
  // that way we ensure, by construction, that we have a DAG
  function detectCycles() {
    let graph, loop;
    [graph, loop] = buildGraphWithoutMemory();
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
    getSourceNodesWithMemory: getSourceNodesWithMemory,
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
    getExtraStartNodesList,
    addExtraStartNodesList,
    clearExtraStartNodesList,
    getSetvarList,
    addSetvarList,
    clearSetvarList,
    getProcessedSetvarList,
    addProcessedSetvarList,
    clearProcessedSetvarList,
    getMemorydataNodeList,
    addMemorydataNodeList,
    getCurrentGraphList,
    addCurrentGraphList,
    clearCurrentGraphList,
    clearMemorydataNodeList,
    getAllsingletonNodes,
    isSingletonNode,
    updateDisconnectedGraphsList,
  };
}
