let xdashAddr = "";
let xdashDocAddr = "";
let bIsBasicVersion = "false";
// ** Insert configuration here ** // Do not remove

xdashAddr += "index.html";

// Ensure protocol consistency to avoid browser security blocking
const currentProtocol = location.protocol;

const ensureProtocolCoherency = (url) => {
	if (!url.includes(currentProtocol)) {
		const urlObj = new URL(url);
		return url.replace(urlObj.protocol, currentProtocol);
	}
	return url;
};

xdashDocAddr = ensureProtocolCoherency(xdashDocAddr);
xdashAddr = ensureProtocolCoherency(xdashAddr);

function openXprjsonInNewTab(resource) {
	const addr = `${xdashAddr}?projectUrl=${encodeURIComponent(resource)}`;
	window.open(addr, "_blank");
}

function handleXprjson(doc) {
	const anchors = doc.getElementsByTagName("a");

	Array.from(anchors).forEach((anchor) => {
		let href = anchor.href.replace(location.origin, xdashDocAddr);

		if (href.includes(".full.xprjson") && bIsBasicVersion == "true") {
			anchor.removeAttribute("href");
			anchor.style.color = "#7f8c8d";
		} else if (href.includes("xprjson")) {
			anchor.removeAttribute("href");
			anchor.setAttribute("onclick", `openXprjsonInNewTab("${href}")`);
			Object.assign(anchor.style, {
				textDecoration: "underline",
				cursor: "pointer",
				padding: "5px 20px",
				backgroundColor: "#f8f8f8",
			});
			anchor.innerHTML = `<i class="fas fa-edit">&nbsp;</i>${anchor.textContent}`;
		} else if (/\.(js|zip|py)$/.test(href)) {
			anchor.target = "_blank";
		}
	});
}

document.addEventListener("DOMContentLoaded", () => handleXprjson(document));
