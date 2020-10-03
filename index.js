/*
	Doggo DB - For Doggos
*/

let databaseScope = window.localStorage;

let unserialize = JSON.parse;
let serialize = JSON.stringify;

let errors = {
	NODBNAME: "No Databse Name provided.",
	NODBEXISTS: "No Databse with that name exists.",
	NOTABLENAME: "No Table Name provided.",
	TABLENOTFOUND: "Table with that name not found.",
};

function getDatabase(dbName) {
	return databaseScope.getItem(dbName);
}

function createDatabase(dbName) {
	return databaseScope.setItem(dbName, serialize({}));
}

function writeDatabase(dbName, databaseObject) {
	return databaseScope.setItem(dbName, serialize(databaseObject));
}

function db(dbName) {
	if (!dbName) throw new Error(errors.NODBNAME);

	let unserializedDatabase = unserialize(getDatabase(dbName));

	if (!unserializedDatabase)
		// Database doesn't exist.
		createDatabase(dbName);

	createDBObjectToReturn = function() {
		return {
			database: this.databaseObject,
			table: this.table,
			list: this.list,
			activeTable: this.activeTable,
			create: this.create,
			save: this.save,
		};
	};

	this.databaseObject = unserialize(getDatabase(dbName));
	this.activeTable = null;
	this.databaseName = dbName;

	this.database = {
		database: this.databaseObject,
		table: this.table,
		list: this.list,
		activeTable: this.activeTable,
		create: this.create,
		save: this.save,
	};

	save = function() {
		writeDatabase(this.databaseName, this.databaseObject);
	};

	// Operations.
	table = function(tableName) {
		if (!tableName) throw new Error(errors.NOTABLENAME);

		if (this.databaseObject[tableName])
			this.activeTable = this.databaseObject[tableName];
		else this.create(tableName);

		return this.createDBObjectToReturn();
	};

	list = function() {
		// List all tables.
		let tableNames = Object.keys(this.databaseObject);
		return tableNames;
	};

	create = function(tableName) {
		// Function to create a new table.
		if (!tableName) throw new Error(errors.NOTABLENAME);

		this.databaseObject[tableName] = {
			tableName,
			createdAt: new Date(),
			updatedAt: new Date(),
			contents: [],
		};
		this.database = this.databaseObject;
		this.activeTable = this.databaseObject[tableName];

		this.save();

		return this.createDBObjectToReturn();
	};

	drop = function(tableName) {
		// Code to drop an entire table.
		if (tableName) {
			if (this.activeTable && tableName === this.activeTable.tableName)
				this.activeTable = null;

			if (tableName in this.databaseObject)
				delete this.databaseObject[tableName];
		} else {
			let tableNameToDelete = null;

			if (this.activeTable) {
				tableNameToDelete = this.activeTable.tableName;
				this.activeTable = null;
			}

			if (tableNameToDelete in this.databaseObject)
				delete this.databaseObject[tableNameToDelete];
		}

		this.save();
		return this.createDBObjectToReturn();
	};

	get = function() {
		if (this.activeTable && this.activeTable.contents) {
			// Code to get contents of the entire table.
			return this.activeTable.contents;
		}
		return [];
	};

	find = function(filters) {
		if (this.activeTable && this.activeTable.contents && filters) {
			// Code to drop the entire table.
			let resultSet = [];
			for (let row of this.activeTable.contents) {
				let allFiltersMatch = true;
				for (let filter in filtres) {
					if (!row[filter] || row[filter] != filters[filter])
						allFiltersMatch = false;
				}
				if (allFiltersMatch) resultSet.push(row);
			}

			return resultSet;
		}
		return [];
	};

	this.table = this.table.bind(this);
	this.list = this.list.bind(this);
	this.create = this.create.bind(this);
	this.save = this.save.bind(this);
	this.createDBObjectToReturn = this.createDBObjectToReturn.bind(this);

	return this.createDBObjectToReturn();
}
