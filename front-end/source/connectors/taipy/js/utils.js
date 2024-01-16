export const sendWsMessage = (socket, type, name, payload, moduleContext = null, propagate = true) => {
  const msg = {
    type: type,
    name: name,
    payload: payload,
    propagate: propagate,
    client_id: localStorage.getItem("TaipyClientId") || "",
    module_context: moduleContext || localStorage.getItem("ModuleContext") || "",
  };
  console.log("Sending message to Socket.io backend:", msg);
  socket.emit("message", msg);
};

export const updateElementById = (id, value) => {
  const element = document.getElementById(id);
  if (element) {
    element.innerHTML = value;
  } else {
    console.error(`Element with ID '${id}' not found.`);
  }
};

export const updateInputById = (id, value) => {
  const element = document.getElementById(id);
  if (element) {
    element.value = value;
  } else {
    console.error(`Element with ID '${id}' not found.`);
  }
};

export const propogateVariableData = (variableData) => {
  for (const context in variableData) {
    console.log("context", context)
    for (const variable in variableData[context]) {
      const value = variableData[context][variable].value;
      const varName = `${context}.${variable}`;
      if (!document.getElementById(varName)) {
        continue;
      }
      updateElementById(varName, value);
      updateInputById(`${varName}-slider`, value);
    }
  }
};

export const handleSingleUpdate = (variableData, updateData) => {
  console.log(variableData)
  console.log(updateData.name)
  for (const context in variableData) {
    console.log("context", context)
    for (const variable in variableData[context]) {
      const vData = variableData[context][variable];
      if (vData.encoded_name === updateData.name) {
        const varName = `${context}.${variable}`;
        const value = updateData.payload.value;
        if (!document.getElementById(varName)) {
          continue;
        }
        updateElementById(varName, value);
        updateInputById(`${varName}-slider`, value);
      }
    }
  }
}
