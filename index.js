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
	NODATAPROVIDED: "No Data provided.",
	NOACTIVETABLE: "No ref to table created.",
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

	let databaseString = getDatabase(dbName);
	let unserializedDatabase = {};

	if (databaseString) unserializedDatabase = unserialize(getDatabase(dbName));

	if (!unserializedDatabase)
		// Database doesn't exist.
		createDatabase(dbName);

	this.createDBObjectToReturn = function() {
		return {
			database: this.databaseObject,
			table: this.table,
			list: this.list,
			activeTable: this.activeTable,
			create: this.create,
			save: this.save,
			drop: this.drop,
			add: this.add,
			find: this.find,
			get: this.get,
		};
	};

	this.databaseObject = unserializedDatabase;
	this.activeTable = null;
	this.databaseName = dbName;

	this.save = function() {
		writeDatabase(this.databaseName, this.databaseObject);
	};

	// Operations.
	this.table = function(tableName) {
		if (!tableName) throw new Error(errors.NOTABLENAME);

		if (this.databaseObject[tableName])
			this.activeTable = this.databaseObject[tableName];
		else this.create(tableName);

		return this.createDBObjectToReturn();
	};

	this.list = function() {
		// List all tables.
		let tableNames = Object.keys(this.databaseObject);
		return tableNames;
	};

	this.create = function(tableName) {
		// Function to create a new table.
		if (!tableName) throw new Error(errors.NOTABLENAME);

		this.activeTable = new Table(tableName);
		this.databaseObject[tableName] = this.activeTable;

		this.save();

		return this.createDBObjectToReturn();
	};

	this.drop = function(tableName) {
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

	this.get = function() {
		if (this.activeTable && this.activeTable.contents) {
			// Get contents of the entire table.
			return this.activeTable.contents;
		}
		return [];
	};

	this.find = function(filters) {
		if (this.activeTable && this.activeTable.contents && filters) {
			let resultSet = this.activeTable.find(filters);
			return resultSet;
		}
		return [];
	};

	this.add = function(newRow) {
		if (!newRow) throw new Error(errors.NODATAPROVIDED);
		if (!this.activeTable) throw new Error(errors.NOACTIVETABLE);

		this.activeTable.addToContents(newRow);
		this.databaseObject[this.activeTable.tableName] = this.activeTable;

		this.save();

		return this.createDBObjectToReturn();
	};

	this.table = this.table.bind(this);
	this.list = this.list.bind(this);
	this.create = this.create.bind(this);
	this.save = this.save.bind(this);
	this.drop = this.drop.bind(this);
	this.get = this.get.bind(this);
	this.find = this.find.bind(this);
	this.add = this.add.bind(this);

	this.createDBObjectToReturn = this.createDBObjectToReturn.bind(this);

	return this.createDBObjectToReturn();
}

// Abstraction instances.

class Table {
	constructor(tableName) {
		this.contents = [];
		this.tableName = tableName;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	addToContents(newRow) {
		this.contents.push({ uid: generateUniqueId(), ...newRow });
		this.updatedAt = new Date();
	}

	find(filters) {
		// Code to find a result set based on filters.
		let resultSet = [];
		for (let row of this.contents) {
			let allFiltersMatch = true;
			for (let filter in filtres) {
				if (!row[filter] || row[filter] != filters[filter])
					allFiltersMatch = false;
			}
			if (allFiltersMatch) resultSet.push(row);
		}
		return resultSet;
	}
}

/* Other helper functions. */
function generateUniqueId() {
	return parseInt(
		new Date().getTime() + Math.random() * 10 + Math.random() * 10
	);
}
