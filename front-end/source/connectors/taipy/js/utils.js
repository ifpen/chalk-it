const sendWsMessage = (socket, type, name, payload, moduleContext = null, propagate = true) => {
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

