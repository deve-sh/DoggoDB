const isServer = require("./isServer");

function databaseScope() {
	let isServer = isServer();
	let abstraction = isServer ? window.localStorage : {};

	this.getItem = function(itemToGet = "") {
		if (!isServer) return abstraction.getItem(itemToGet);
	};

	this.setItem = function(itemToSet = "") {
		if (!isServer) return abstraction.setItem(itemToSet);
	};
}

module.exports = databaseScope;
