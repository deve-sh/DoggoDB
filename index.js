/*
	Doggo DB 🐶
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
	NOTAVALIDOBJECT: "Not a valid object for storage.",
};

let reservedFieldNames = { entryId: true };
let reservedFilters = { $and: "and", $or: "or", $not: "not", $in: "in" };

/**
 *	Gets the database with dbName.
 *	@param {string} dbName The name of the database.
 *	@return {string} The serialized/stringified database data in localStorage.
 */
function getDatabase(dbName) {
	return databaseScope.getItem(dbName);
}

/**
 *	Creates a new database with dbName.
 *	Doesn't allow overwriting the previously existing one.
 *	@param {string} dbName - The name of the database.
 *	@return {undefined}
 */
function createDatabase(dbName) {
	if (databaseScope.getItem(dbName))
		throw new Error("Database with that name already exists.");

	return databaseScope.setItem(
		dbName,
		serialize({
			tables: {},
			createdAt: new Date(),
			updatedAt: new Date(),
		})
	);
}

/**
 *	Serializes an object and writes it to a database in localStorage.
 *	@param {string} dbName - The name of the database to write to.
 *	@param {object} databaseObject - The object to serialize and write.
 *	@return {undefined}
 */
function writeDatabase(dbName, databaseObject) {
	return databaseScope.setItem(dbName, serialize(databaseObject));
}

/**
 *	The main database driver.
 *	@constructor
 *	@param { string } dbName - The name of the database to initialize. Connects to an existing database if localStorage already has it.
 *	@param { object } [listeners] - Object that contains functions that fire on certain events such as 'onChange'.
 *	@return { db } databaseInstance - The object that contains all data about the database that has been initialized.
 */
function db(
	dbName,
	listeners = {
		onChange: null,
	}
) {
	if (!dbName) throw new Error(errors.NODBNAME);

	let persistedDatabase = getDatabase(dbName);
	let unserializedDatabase = {
		tables: {},
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	if (persistedDatabase)
		unserializedDatabase = unserialize(persistedDatabase);

	if (!unserializedDatabase) createDatabase(dbName); // Database doesn't exist.

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
			updateAt: this.updateAt,
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
		this.databaseObject.updatedAt = new Date();
		if (this.onChange && typeof this.onChange === "function")
			this.onChange(this.databaseObject);
	};

	// Operations.
	this.table = function(tableName) {
		if (!tableName) throw new Error(errors.NOTABLENAME);

		if (this.databaseObject.tables[tableName])
			this.activeTable = this.databaseObject.tables[tableName];
		else this.create(tableName);

		return this.createDBObjectToReturn();
	};

	this.list = function() {
		// List all tables in the database along with their contents and metadata.
		return this.databaseObject.tables;
	};

	this.create = function(tableName) {
		// Function to create a new table.
		if (!tableName) throw new Error(errors.NOTABLENAME);

		if (tableName in this.databaseObject.tables)
			throw new Error(errors.TABLEALREADYEXISTS);

		this.activeTable = new Table(tableName);
		this.databaseObject.tables[tableName] = this.activeTable;

		this.save();

		return this.createDBObjectToReturn();
	};

	this.drop = function(tableName) {
		// Code to drop an entire table.
		// If no tableName is passed, it drops the active table if any.
		if (tableName) {
			if (this.activeTable && tableName === this.activeTable.tableName)
				this.activeTable = null;

			if (tableName in this.databaseObject.tables)
				delete this.databaseObject.tables[tableName];
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
		if (typeof newRow !== "object" || !Object.keys(newRow).length)
			throw new Error(errors.NOTAVALIDOBJECT);

		this.activeTable.contents.push({
			entryId: generateUniqueId(),
			...newRow,
		});
		this.activeTable.updatedAt = new Date();
		this.databaseObject[this.activeTable.tableName] = this.activeTable;

		this.save();

		return this.createDBObjectToReturn();
	};

	/**
		Returns a result set from the active table.

		@param { Object } filters - Key value pair to query a table by.
		@param { Object } [limiters] - { offset: Number, limit: Number }
	*/
	this.find = function(
		filters,
		limiters = {
			offset: 0,
			limit: null,
		}
	) {
		try {
			let { limit, offset } = limiters;

			if (!limit) limit = Infinity;
			if (!offset) offset = 0;

			if (
				this.activeTable &&
				this.activeTable.contents &&
				this.activeTable.contents.length &&
				filters &&
				Object.keys(filters).length
			) {
				// Code to find a result set based on filters.
				let resultSet = [],
					index = 0;
				for (let row of this.activeTable.contents) {
					if (index >= offset && resultSet.length <= limit) {
						let allFiltersMatch = true;
						for (let filter in filters) {
							if (
								!(filter in row) ||
								row[filter] != filters[filter]
							)
								allFiltersMatch = false;
						}
						if (allFiltersMatch) resultSet.push(row);
					}
					index++;
				}
				return resultSet;
			} else if (this.activeTable && this.activeTable.contents) {
				if (offset || limit !== Infinity) {
					return [...this.activeTable.contents].slice(
						offset,
						offset + limit
					);
				}
				return this.activeTable.contents;
			}
			return [];
		} catch (err) {
			throw new Error(err.message);
		}
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
				for (let fieldToUpdate in updates) {
					if (fieldToUpdate in reservedFieldNames)
						delete updates[fieldToUpdate];
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

	this.updateAt = function(rowIndex, updates) {
		// Function to update a row in a table at a certain index.
		if (!this.activeTable) throw new Error(erors.NOACTIVETABLE);

		if (
			this.activeTable &&
			this.activeTable.contents &&
			this.activeTable.contents.length &&
			rowIndex >= 0 &&
			this.activeTable.contents.length > rowIndex &&
			updates
		) {
			// Check if the user is not updating any reserved fields.
			if (updates && Object.keys(updates).length > 0) {
				for (let fieldToUpdate in updates)
					if (fieldToUpdate in reservedFieldNames)
						delete updates[fieldToUpdate];
			}

			this.activeTable.contents[rowIndex] = {
				...this.activeTable.contents[rowIndex],
				...updates,
			};
			this.activeTable.updatedAt = new Date();

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
	this.updateAt = this.updateAt.bind(this);

	this.createDBObjectToReturn = this.createDBObjectToReturn.bind(this);

	return this.createDBObjectToReturn();
}

// Abstraction instances.

/**
 *	The table class.
 *	@constructor
 *	@param { string } tableName - The name of the table to create.
 *	@return { Table } tableInstance - Contains the contents, tableName, createdAt { Date} and updatedAt { Date }.
 */
class Table {
	constructor(tableName) {
		if (!tableName) throw new Error("No table name provided.");

		this.contents = [];
		this.tableName = tableName;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}

/* Other helper functions. */

/**
 * Generates a unique id to be used in fields such as 'entryId'.
 * @return { Number } A sufficiently random number that can be used as a unique Id.
 */
function generateUniqueId() {
	return parseInt(
		new Date().getTime() + Math.random() * 10 + Math.random() * 10
	);
}

/**
 * Function to check if a row in a table matches a specified operation or not. (Operations such as and, or, in, not etc).
 * @param { Object } row - The object represnting a row in a database table.
 * @param { field } field - Name of field to verify operation on.
 * @param { * } value - The value to compare with, type depends on the operation.
 * @return { Boolean }
 */
function verifyByCustomOperation(row, field, operation, value) {
	switch (operation) {
		case "add":
			return false;
		case "or":
			return false;
		case "in":
			return false;
		case "not":
			return false;
		default:
			throw new Error("Invalid/Unsupported operation.");
	}
}

module.exports = { db };
