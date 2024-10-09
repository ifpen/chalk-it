let xdashAddr = "";
let bIsBasicVersion = "false";


xdashAddr = "https://ifpen.github.io/chalk-it/hosted/";
bIsBasicVersion = "true";


function openXprjsonInNewTab(resource) {
	const addr = `${xdashAddr}index.html?projectUrl=${encodeURI(resource)}`;
	window.open(addr, "_blank");
}

function handleXprjson(doc) {
	const anchors = doc.getElementsByTagName("a");

	Array.from(anchors).forEach((anchor) => {
		let href = anchor.href;
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
