import { socket } from "./socketio.js";
import { sendWsMessage, updateElementById } from "./utils.js";
import { variableData } from "./socketio_handler.js";

// event listner for slider change
const onSliderChange = (event) => {
    console.log("Slider changed:", event.target.id, event.target.value);
    const id = event.target.id.replace("-slider", "");
    const value = parseInt(event.target.value);
    const idSplit = Array.from(id.split("."));
    const [context, varName] = idSplit.reduce((acc, curr, idx) => {
        if (idx === 0 || idx === idSplit.length - 1) {
            acc.push(curr);
        } else {
            acc[0] = `${acc[0]}.${curr}`;
        }
        return acc;
    }, []);
    console.log("context", context, "varName", varName);
    const encoded_name = variableData[context][varName].encoded_name;
    updateElementById(id, value);
    sendWsMessage(socket, "U", encoded_name, { value: value }, context);
};

const init = () => {
    socket.connect();
    console.log("Initialized completed");
    // Add event listeners for inputs
    const inputs = Array.from(document.getElementsByTagName("input")).filter((input) => input.id.endsWith("-slider"));
    inputs.forEach((input) => {
        input.addEventListener("change", onSliderChange);
    });
};

init();
