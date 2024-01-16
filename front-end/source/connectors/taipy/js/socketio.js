import { io } from "socket.io-client";
import { manageWsMessage, onWsConnect } from "./socketio_handler.js";

export const socket = io("/");

socket.on("connect", () => {
  console.log("Connected to Socket.io backend");
  onWsConnect(socket);
});

socket.on("disconnect", () => {
  console.log("Disconnected from Socket.io backend");
});

socket.on("message", (message) => {
  console.log("Received message from Socket.io backend:", message);
  manageWsMessage(socket, message);
});
