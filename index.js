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
	NOACTIVETABLE: "No reference to table created.",
	TABLEALREADYEXISTS: "Table with that name already exists.",
};

let reservedFieldNames = ["entryId"];
let reservedFilters = ["$and", "$or"];

function getDatabase(dbName) {
	return databaseScope.getItem(dbName);
}

function createDatabase(dbName) {
	return databaseScope.setItem(dbName, serialize({}));
}

function writeDatabase(dbName, databaseObject) {
	return databaseScope.setItem(dbName, serialize(databaseObject));
}

function db(
	dbName,
	listeners = {
		onChange: null,
	}
) {
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
			findAndUpdate: this.findAndUpdate,
			delete: this.delete,
		};
	};

	this.databaseObject = unserializedDatabase;
	this.activeTable = null;
	this.databaseName = dbName;

	// Event Listeners
	this.onChange = null;

	if (listeners && typeof listeners === "object") {
		this.onChange = listeners.onChange || null;
		// Add more listeners as required.
	}

	this.save = function() {
		writeDatabase(this.databaseName, this.databaseObject);
		if (this.onChange && typeof this.onChange === "function")
			this.onChange(this.databaseObject);
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
		// List all tables in the database along with their contents and metadata.
		return this.databaseObject;
	};

	this.create = function(tableName) {
		// Function to create a new table.
		if (!tableName) throw new Error(errors.NOTABLENAME);

		if (tableName in this.databaseObject)
			throw new Error(errors.TABLEALREADYEXISTS);

		this.activeTable = new Table(tableName);
		this.databaseObject[tableName] = this.activeTable;

		this.save();

		return this.createDBObjectToReturn();
	};

	this.drop = function(tableName) {
		// Code to drop an entire table.
		// If no tableName is passed, it drops the active table if any.
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
		if (this.activeTable) return this.activeTable.contents; // Get contents of the entire table.
		throw new Error(errors.NOACTIVETABLE);
	};

	this.add = function(newRow) {
		if (!newRow) throw new Error(errors.NODATAPROVIDED);
		if (!this.activeTable) throw new Error(errors.NOACTIVETABLE);

		this.activeTable.contents.push({
			entryId: generateUniqueId(),
			...newRow,
		});
		this.activeTable.updatedAt = JSON.stringify(new Date());
		this.databaseObject[this.activeTable.tableName] = this.activeTable;

		this.save();

		return this.createDBObjectToReturn();
	};

	this.find = function(filters) {
		if (
			this.activeTable &&
			this.activeTable.contents &&
			this.activeTable.contents.length &&
			filters
		) {
			// Code to find a result set based on filters.
			let resultSet = [];
			for (let row of this.activeTable.contents) {
				let allFiltersMatch = true;
				for (let filter in filters) {
					if (!(filter in row) || row[filter] != filters[filter])
						allFiltersMatch = false;
				}
				if (allFiltersMatch) resultSet.push(row);
			}
			return resultSet;
		} else if (this.activeTable && this.activeTable.contents)
			return this.activeTable.contents;
		return [];
	};

	this.findAndUpdate = function(filters, updates, updateOnlyOne = true) {
		// Function to update a resultset in the database.
		if (
			this.activeTable &&
			this.activeTable.contents &&
			this.activeTable.contents.length &&
			updates
		) {
			// Check if the user is not updating any reserved fields.
			if (updates && Object.keys(updates).length > 0) {
				for (let update in updates) {
					if (reservedFieldNames.includes(update))
						delete updates[update];
				}
			}

			for (
				let rowIndex = 0;
				rowIndex < this.activeTable.contents.length;
				rowIndex++
			) {
				let allFiltersMatch = true;
				let row = this.activeTable.contents[rowIndex];

				if (filters && Object.keys(filters).length > 0) {
					for (let filter in filters) {
						if (!(filter in row) || row[filter] != filters[filter])
							allFiltersMatch = false;
					}
				}

				if (allFiltersMatch) {
					row = { ...row, ...updates };
					this.activeTable.contents[rowIndex] = row;
				}

				if (updateOnlyOne) break;
			}

			this.databaseObject[this.activeTable.tableName] = this.activeTable;
			this.save();
		}

		return this.createDBObjectToReturn();
	};

	this.delete = function(filters, deleteOnlyOne = true) {
		// Function to delete a row.
		if (
			this.activeTable &&
			this.activeTable.contents &&
			this.activeTable.contents.length &&
			filters &&
			updates
		) {
			for (
				let rowIndex = 0;
				rowIndex < this.activeTable.contents.length;
				rowIndex++
			) {
				let allFiltersMatch = true;
				let row = this.activeTable.contents[rowIndex];

				for (let filter in filters)
					if (!(filter in row) || row[filter] != filters[filter])
						allFiltersMatch = false;

				if (allFiltersMatch)
					this.activeTable.contents.splice(rowIndex, 1);

				if (deleteOnlyOne) break;
			}

			this.databaseObject[this.activeTable.tableName] = this.activeTable;
			this.save();
		}

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
	this.findAndUpdate = this.findAndUpdate.bind(this);
	this.delete = this.delete.bind(this);

	this.createDBObjectToReturn = this.createDBObjectToReturn.bind(this);

	return this.createDBObjectToReturn();
}

// Abstraction instances.

class Table {
	constructor(tableName) {
		this.contents = [];
		this.tableName = tableName;
		this.createdAt = JSON.stringify(new Date());
		this.updatedAt = JSON.stringify(new Date());
	}
}

/* Other helper functions. */
function generateUniqueId() {
	return parseInt(
		new Date().getTime() + Math.random() * 10 + Math.random() * 10
	);
}
