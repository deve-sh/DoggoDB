/**
	Checks whether the environment the script is running in a server environment.
*/
function isServer() {
	try {
		if (window) return false;
		else if (typeof module !== "undefined" && module.exports) return true;
		return false;
	} catch (err) {
		return true;
	}
}

module.exports = isServer;
