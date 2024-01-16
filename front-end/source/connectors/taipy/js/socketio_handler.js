import { propogateVariableData, sendWsMessage, handleSingleUpdate } from "./utils.js";

export const onWsConnect = (socket) => {
  sendWsMessage(socket, "GMC", "get_module_context", { path: window.location.pathname.slice(1) });
};

export let variableData = {};

export const manageWsMessage = (socket, message) => {
  if (message.type === "GMC") {
    const mc = message.payload.data;
    console.log("Module context:", mc);
    window.localStorage.setItem("ModuleContext", mc);
    sendWsMessage(socket, "GVS", "get_variables", {}, mc);
  }
  if (message.type === "GVS") {
    variableData = message.payload.data;
    console.log(variableData);
    propogateVariableData(variableData);
  }
  if (message.type === "MU") {
    for (const updateData of message.payload) {
      handleSingleUpdate(variableData, updateData)
    }
  }
};
