const isServer = require("./isServer");

function databaseScope() {
	let isServer = isServer();
	let abstraction = isServer ? window.localStorage : {};

	this.getItem = function(itemToGet = "") {
		if (!isServer) return abstraction.getItem(itemToGet);
		else {
			let fileName = `${itemToGet}.json`;
			let fileContents = fs.readFileSync(fileName, { encoding: "utf8" });
			return JSON.parse(fileContents);
		}
	};

	this.setItem = function(itemToSet = "", contentToSet = "") {
		if (!isServer) return abstraction.setItem(itemToSet);
		else {
			let fileName = `${itemToGet}.json`;
			let fileContents = fs.writeFileSync(fileName, contentToSet, {
				encoding: "utf8",
			});
			return true;
		}
	};
}

module.exports = databaseScope;
