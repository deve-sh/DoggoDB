const isServer = require("./isServer");

/**
	Function that returns a set of functions to interact with the low level storage of the database.

	On a browser that will be the localStorage, and on a server it will be the actual native file system.

	@return { Object } { getItem: function, setItem: function }
*/
function databaseScope() {
	let isServerEnvironment = isServer();
	let abstraction = isServerEnvironment ? window.localStorage : fs;

	return {
		/**
			Function to get contents from the localStorage on the browser and `itemToGet.json` file from the server.

			@param { String } itemToGet - The name of the file or item from localStorage to get.

			@return { String } The contents of the file or the item.
		*/
		getItem: function(itemToGet = "") {
			if (!isServerEnvironment) return abstraction.getItem(itemToGet);
			else {
				let fileName = `${itemToGet}.json`;
				let fileContents = abstraction.readFileSync(fileName, {
					encoding: "utf8",
				});
				return fileContents;
			}
		},
		/**
			Function to get contents from the localStorage on the browser and `itemToGet.json` file from the server.

			@param { String } itemToSet - The name of the file or item from localStorage to get.
			@param { String } contentToSet - The serialized contents to set in the localStorage and file system.

			@return { Boolean } Results of the operation.
		*/
		setItem: function(itemToSet = "", contentToSet = "") {
			if (!isServerEnvironment) return abstraction.setItem(itemToSet);
			else {
				let fileName = `${itemToGet}.json`;
				let fileContents = abstraction.writeFileSync(
					fileName,
					contentToSet,
					{
						encoding: "utf8",
					}
				);
				return true;
			}
		},
	};
}

module.exports = databaseScope;
