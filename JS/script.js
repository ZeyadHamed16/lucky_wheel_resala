var wheelPage = document.querySelector("#wheelPage");
var createPage = document.querySelector("#createPage");

wheelPage.classList.add("hidden");
createPage.classList.add("hidden");

var errorTemplate = document.querySelector("#errorTemplate");

var wheelNameInput = document.querySelector("#wheelName");
var entryList = document.querySelector("#entryList");
var addEntryButton = document.querySelector("#addEntry");
var entryItemTemplate = document.querySelector("#entryItemTemplate");

addEntryButton.onclick = function () {
	createEntry();
}

var createWheelButton = document.querySelector("#createWheelButton");
createWheelButton.onclick = function () {
	var name = wheelNameInput.value;

	if (nameIsValid(name)) {
		var entries = [];
		for (var element of entryList.querySelectorAll(".entryItem")) {
			entries.push(element.querySelector(".entryText").value);
		}

		if (entries.length == 0) {
			createErrorPopup("Add atleast one option");
			return;
		}

		if (allWheels.hasOwnProperty(name) && !confirm(`Do you want to save over '${name}'?`)) {
			return;
		}

		currentWheelName = name;
		allWheels[currentWheelName] = entries;
		saveWheels(allWheels);

		createMenuWheelList();

		gotoWheelPage(currentWheelName);
	}
	else {
		createErrorPopup("Wheel name is not valid");
	}
}

var wheelNameDisplay = document.querySelector("#wheelNameDisplay");
var spinButton = document.querySelector("#spin");
var editWheelButton = document.querySelector("#edit");
var landingEntryText = document.querySelector("#landingEntry");

var wheelsList = document.querySelector("#wheelsList");
var wheelEntryTemplate = document.querySelector("#wheelEntryTemplate");

var menuCheckbox = document.querySelector("#menuCheckbox");

// ------------------------ colors in the wheel ------------------------ 
var theme = ["#ffbe0b", "#fb5607", "#ff006e", "#3a86ff"];
// ------------------------ ------------------------ ------------------------ 

var currentWheelName;
var wheel;

var allWheels = getSavedWheels();
createMenuWheelList();

spinButton.onclick = function () {
	if (wheel.spin()) {
		landingEntryText.innerText = "";
		spinButton.style.visibility = "hidden";
	}
}

editWheelButton.onclick = function () {
	gotoCreatePage(currentWheelName);
}

var savedWheelName = localStorage.getItem("wheelspin-currentWheel");
if (savedWheelName && savedWheelName != "undefined") {
	gotoWheelPage(savedWheelName);
}
else {
	gotoWheelPage(Object.keys(allWheels)[0]);
}

loop();
function loop() {
	if (wheel != null) {
		wheel.update();
	}

	requestAnimationFrame(loop);
}

function createErrorPopup(msg) {
	var clone = errorTemplate.content.firstElementChild.cloneNode(true);

	var text = clone.querySelectorAll(".msg")[0];
	text.innerText = msg;

	var close = clone.querySelectorAll(".close")[0];
	close.onclick = function () {
		clone.removed = true;
		document.body.removeChild(clone);
	}

	setTimeout(function () {
		if (!clone.removed) {
			document.body.removeChild(clone);
		}
	}, 5000);

	document.body.appendChild(clone);
}

function createMenuWheelList() {
	clearChildren(wheelsList);

	for (var _wheel in allWheels) {
		var clone = wheelEntryTemplate.content.firstElementChild.cloneNode(true);
		var text = clone.querySelectorAll(".wheelEntry")[0];
		text.innerText = _wheel;
		text.onclick = (function (w) {
			return () => {
				menuCheckbox.checked = false;
				gotoWheelPage(w);
			}
		})(_wheel);

		wheelsList.appendChild(clone);
	}

	var clone = wheelEntryTemplate.content.firstElementChild.cloneNode(true);
	var text = clone.querySelectorAll(".wheelEntry")[0];
	text.innerText = "+ Create wheel";
	text.onclick = function () {
		menuCheckbox.checked = false;
		gotoCreatePage();
	}

	wheelsList.appendChild(clone);
}

function nameIsValid(name) {
	return name != "" && name.replace(/\s/g, '').length;
}

function saveWheels(wheels) {
	localStorage.setItem("wheelspin-wheels", JSON.stringify(wheels));
}

function getSavedWheels() {
	var stored = localStorage.getItem("wheelspin-wheels");
	if (stored == null || stored == "") {
		return getDefaultWheels();
	}

	try {
		return JSON.parse(stored);
	}
	catch (e) {
		return getDefaultWheels();
	}
}

// ------------------------ wheel content ------------------------ 
function getDefaultWheels() {
	return {
		"Wheel of Resala": [
			"100", "70", "10", "40", "20", "10", "10"
		]
	}
}
// ------------------------ ------------------------ ------------------------ 

function gotoCreatePage(wheelName) {
	clearChildren(entryList);

	if (wheelName && allWheels.hasOwnProperty(wheelName)) {
		wheelNameInput.value = wheelName;

		for (var entry of allWheels[wheelName]) {
			createEntry(entry);
		}
	}
	else {
		wheelNameInput.value = "";
		createEntry();
	}

	document.ontouchmove = e => { }

	createPage.classList.remove("hidden");
	wheelPage.classList.add("hidden");
}

function createEntry(text = "") {
	var clone = entryItemTemplate.content.firstElementChild.cloneNode(true);

	clone.querySelectorAll(".remove")[0].onclick = function () {
		entryList.removeChild(clone);
	}

	clone.querySelectorAll(".entryText")[0].value = text;

	entryList.appendChild(clone);
}

function gotoWheelPage(wheelName) {
	currentWheelName = wheelName;
	localStorage.setItem("wheelspin-currentWheel", currentWheelName);

	if (wheel != null) {
		wheel.destroy();
	}

	wheel = new Wheel(allWheels[wheelName], theme);

	wheel.spinDone = function () {
		landingEntryText.innerText = wheel.getCurrentEntry();
		spinButton.style.visibility = "visible";
	}

	wheelNameDisplay.innerText = currentWheelName;

	spinButton.style.visibility = "visible";

	wheelPage.classList.remove("hidden");
	createPage.classList.add("hidden");

	landingEntryText.innerText = "";

	document.ontouchmove = e => {
		e.preventDefault();
	}
}

function Wheel(entries, colorScheme) {
	this.entries = entries;
	this.colorScheme = colorScheme;

	if (this.entries.length % this.colorScheme.length == 1) {
		this.colorScheme.push(this.colorScheme[this.colorScheme.length - 2]);
	}

	this.size = 400;

	this.isSpinning = false;
	this.friction = 2;
	this.angle = Math.PI / this.entries.length;
	this.angularVelocity = 0;
	this.dt = 1 / 60;

	this.instant = false;

	this.svg = createElement("svg", document.querySelector("#wheelContainer"));
	this.svg.setAttribute("viewBox", `0 0 ${this.size} ${this.size}`);
	this.svg.setAttribute("width", "90%");
	this.svg.setAttribute("height", this.size);

	this.group = createElement("g", this.svg);
	this.group.style.transformOrigin = "center";

	this.background = createElement("circle", this.group);
	this.background.setAttribute("cx", this.size / 2);
	this.background.setAttribute("cy", this.size / 2);
	this.background.setAttribute("r", this.size * 0.485);
	this.background.setAttribute("fill", "rgba(255, 255, 255, 0.8)");

	for (var i = 0; i < this.entries.length; i++) {
		var arc = createElement("path", this.group);
		arc.setAttribute("fill", this.colorScheme[i % this.colorScheme.length]);

		var radius = this.size * 0.47;
		var angle = -i / this.entries.length * Math.PI * 2;
		var offset = Math.PI * 2 / this.entries.length;

		setArc(arc, this.size / 2, this.size / 2, radius, angle, offset);

		var text = createElement("text", this.group);
		text.classList.add("entryText");
		text.setAttribute("alignment-baseline", "middle");
		// text.setAttribute("x", this.size / 2 - radius * 0.95);
		// text.setAttribute("y", this.size / 2);
		// text.style.transformOrigin = "center center";
		// text.style.transformBox = "fill-box";
		// text.style.transform = `rotate(${angle - offset / 2 + Math.PI}rad)`;
		text.style.transform = `translate(${this.size / 2}px, ${this.size / 2}px) rotate(${angle - offset / 2 + Math.PI}rad) translateX(${-radius * 0.95}px)`;

		var textContent = this.entries[i];
		if (textContent.length >= 15) {
			textContent = textContent.slice(0, 12) + "...";
		}
		text.textContent = textContent;
	}

	var arrow = createElement("path", this.svg);
	arrow.setAttribute("fill", "white");
	arrow.setAttribute("d", [
		"M", this.size / 2, this.size * 0.07,
		"L", this.size * 0.47, 0,
		"L", this.size * 0.53, 0,
		"Z"
	].join(" "));

	this.destroy = function () {
		this.svg.parentNode.removeChild(this.svg);
	}

	this.spin = function () {
		if (!this.isSpinning) {
			this.isSpinning = true;
			this.angularVelocity = 10 + (Math.random() - 0.5) * 5;

			return true;
		}

		return false;
	}

	this.update = function () {
		if (this.isSpinning) {
			do {
				this.angularVelocity -= Math.min(Math.abs(this.angularVelocity) / this.dt, this.friction) * Math.sign(this.angularVelocity) * this.dt;
				this.angle += this.angularVelocity * this.dt;

				if (Math.abs(this.angularVelocity) < 0.01 && this.isSpinning) {
					this.isSpinning = false;
					this.spinDone();
				}
			} while (this.isSpinning && this.instant);
		}

		this.group.style.transform = `rotate(${this.angle - Math.PI / 2}rad)`;
	}

	this.getCurrentEntry = function () {
		return this.entries[Math.floor(this.angle % (Math.PI * 2) / (Math.PI * 2) * this.entries.length)];
	}

	this.spinDone = function () { }
}

function setArc(element, x, y, radius, startAngle, offset) {
	offset = Math.PI * 2.0001 - (offset % (Math.PI * 2));
	var d = [
		"M", x + Math.cos(startAngle) * radius, y + Math.sin(startAngle) * radius,
		"A", radius, radius, 0, offset % (Math.PI * 2) > Math.PI ? 0 : 1, 0, x + Math.cos(startAngle + offset) * radius, y + Math.sin(startAngle + offset) * radius,
		"L", x, y,
		"Z"
	].join(" ");
	element.setAttribute("d", d);
}

function createElement(type, parent) {
	var element = document.createElementNS("http://www.w3.org/2000/svg", type);
	if (parent != null) {
		parent.appendChild(element);
	}

	return element;
}

function clearChildren(parent) {
	while (parent.firstChild) {
		parent.removeChild(parent.lastChild);
	}
}












// ------------------------ Hamburger menu animated ------------------------ 
function toggleSwitch(x) {
	x.classList.toggle("change");
}
// ------------------------ ------------------------ ------------------------ 
