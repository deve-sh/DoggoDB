/*
	Doggo DB 🐶
*/

let databaseScope = window.localStorage;

let unserialize = JSON.parse;
let serialize = JSON.stringify;

let errors = {
	NODBNAME: "No Databse Name provided.",
	NODBEXISTS: "No Databse with that name exists.",
	DBALREADYEXISTS: "Database with that name already exists.",
	NOTABLENAME: "No Table Name provided.",
	TABLENOTFOUND: "Table with that name not found.",
	NODATAPROVIDED: "No Data provided.",
	NOACTIVETABLE: "No reference to table created.",
	TABLEALREADYEXISTS: "Table with that name already exists.",
	NOTAVALIDOBJECT: "Not a valid object for storage.",
};

let reservedFieldNames = { entryId: true };
let reservedFilters = {
	$not: "not",
	$in: "in",
	$notIn: "not-in",
	$includes: "includes",
	$notIncludes: "not-includes",
};
let reservedConditionals = {
	$or: "or",
};

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
	if (databaseScope.getItem(dbName)) throw new Error(errors.DBALREADYEXISTS);

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
class db {
	constructor(dbName, listeners = { onChange: null }) {
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

		this.database = unserializedDatabase;
		this.activeTable = null;
		this.databaseName = dbName;

		// Event Listeners
		this.onChange = null;

		if (listeners && typeof listeners === "object") {
			this.onChange = listeners.onChange || null;
			// Add more listeners as required.
		}
	}

	save() {
		writeDatabase(this.databaseName, this.database);
		this.database.updatedAt = new Date();
		if (this.onChange && typeof this.onChange === "function")
			this.onChange(this.database);
	}

	// Operations.
	table(tableName) {
		if (!tableName) throw new Error(errors.NOTABLENAME);

		if (this.database.tables[tableName])
			this.activeTable = this.database.tables[tableName];
		else this.create(tableName);

		return this;
	}

	/**
		List all tables in the database as an object along with their contents and metadata.

		@return { Object }
	*/
	list() {
		return this.database.tables;
	}

	/**
		Function to create a new table. This is equivalent to db.table(tableName) because the table function also creates a new table if it does not exist.
		@param { String } tableName - The name of the new table to create.
		@return { db } DoggoDB Database Instance
	*/
	create(tableName) {
		if (!tableName) throw new Error(errors.NOTABLENAME);

		if (tableName in this.database.tables)
			throw new Error(errors.TABLEALREADYEXISTS);

		this.activeTable = new Table(tableName);
		this.database.tables[tableName] = this.activeTable;

		this.save();

		return this;
	}

	drop(tableName) {
		// Code to drop an entire table.
		// If no tableName is passed, it drops the active table if any.
		if (tableName) {
			if (this.activeTable && tableName === this.activeTable.tableName)
				this.activeTable = null;

			if (tableName in this.database.tables)
				delete this.database.tables[tableName];
		} else {
			let tableNameToDelete = null;

			if (this.activeTable) {
				tableNameToDelete = this.activeTable.tableName;
				this.activeTable = null;
			}

			if (tableNameToDelete in this.database.tables)
				delete this.database.tables[tableNameToDelete];
		}

		this.save();
		return this;
	}

	/**
		Gets all contents of a table as an array of Objects.
		@return { Array }
	*/
	get() {
		if (this.activeTable) return this.activeTable.contents; // Get contents of the entire table.
		throw new Error(errors.NOACTIVETABLE);
	}

	add(newRow) {
		if (!newRow) throw new Error(errors.NODATAPROVIDED);
		if (!this.activeTable) throw new Error(errors.NOACTIVETABLE);
		if (typeof newRow !== "object" || !Object.keys(newRow).length)
			throw new Error(errors.NOTAVALIDOBJECT);

		this.activeTable.contents.push({
			...newRow,
			entryId: generateUniqueId(),
		});
		this.activeTable.updatedAt = new Date();
		this.database.tables[this.activeTable.tableName] = this.activeTable;

		this.save();

		return this;
	}

	/**
		Returns a result set from the active table.

		@param { Object } filters - Key value pair to query a table by.
		@param { Object } [limiters] - { offset: Number, limit: Number }
	*/
	find(
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
								filter in reservedConditionals &&
								typeof filters[filter] === "object"
							) {
								if (!verifyOrOperation(row, filters[filter]))
									allFiltersMatch = false;
							} else if (
								filter in reservedFilters &&
								typeof filters[filter] === "object"
							) {
								if (
									!verifyByCustomOperation(
										row,
										Object.keys(filters[filter])[0],
										reservedFilters[filter],
										Object.values(filters[filter])[0]
									)
								)
									allFiltersMatch = false;
							} else if (
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
	}

	/**
		Updates certain set of rows from currently active table based on filters.
		@param { Object } filters - The Map of filters that you would use in the "find" function.
		@param { Object } updates - The Map of updates.
		@param { Boolean } updateOnlyOne - If true it stops deleting at the first match.

		@return { Boolean }
	*/
	findAndUpdate(filters, updates, updateOnlyOne = true) {
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

			let matchFound = false;

			for (
				let rowIndex = 0;
				rowIndex < this.activeTable.contents.length;
				rowIndex++
			) {
				let allFiltersMatch = true;
				let row = this.activeTable.contents[rowIndex];

				if (filters && Object.keys(filters).length > 0) {
					for (let filter in filters) {
						if (
							filter in reservedConditionals &&
							typeof filters[filter] === "object"
						) {
							if (!verifyOrOperation(row, filters[filter]))
								allFiltersMatch = false;
						} else if (
							filter in reservedFilters &&
							typeof filters[filter] === "object"
						) {
							if (
								!verifyByCustomOperation(
									row,
									Object.keys(filters[filter])[0],
									reservedFilters[filter],
									Object.values(filters[filter])[0]
								)
							)
								allFiltersMatch = false;
						} else if (
							!(filter in row) ||
							row[filter] != filters[filter]
						)
							allFiltersMatch = false;
					}
				}

				if (allFiltersMatch) {
					matchFound = true;
					row = { ...row, ...updates };
					this.activeTable.contents[rowIndex] = row;
				}

				if (updateOnlyOne) break;
			}

			this.database.tables[this.activeTable.tableName] = this.activeTable;
			this.save();

			if (matchFound) return true;
		}

		return false;
	}

	/**
		Updates a row at a given position.
		@param { Number } rowIndex - The index (Starting from 0) of the row to update.
		@param { Object } updates - The Map of updates.

		@return { Boolean } 
	*/
	updateAt(rowIndex, updates) {
		// Function to update a row in a table at a certain index.
		if (!this.activeTable) throw new Error(errors.NOACTIVETABLE);

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

			this.database.tables[this.activeTable.tableName] = this.activeTable;
			this.save();
			return true;
		}

		return false;
	}

	/**
		Deletes certain set of rows from currently active table based on filters.
		@param { Object } filters - The Map of filters that you would use in the "find" function.
		@param { Boolean } deleteOnlyOne - If true it stops deleting at the first match.

		@return { Boolean }
	*/
	delete(filters, deleteOnlyOne = true) {
		// Function to delete a row.
		if (
			this.activeTable &&
			this.activeTable.contents &&
			this.activeTable.contents.length &&
			filters &&
			updates
		) {
			let matchFound = false;

			for (
				let rowIndex = 0;
				rowIndex < this.activeTable.contents.length;
				rowIndex++
			) {
				let allFiltersMatch = true;
				let row = this.activeTable.contents[rowIndex];

				for (let filter in filters) {
					if (
						filter in reservedConditionals &&
						typeof filters[filter] === "object"
					) {
						if (!verifyOrOperation(row, filters[filter]))
							allFiltersMatch = false;
					} else if (
						filter in reservedFilters &&
						typeof filters[filter] === "object"
					) {
						if (
							!verifyByCustomOperation(
								row,
								Object.keys(filters[filter])[0],
								reservedFilters[filter],
								Object.values(filters[filter])[0]
							)
						)
							allFiltersMatch = false;
					} else if (
						!(filter in row) ||
						row[filter] != filters[filter]
					)
						allFiltersMatch = false;
				}

				if (allFiltersMatch) {
					matchFound = true;
					this.activeTable.contents.splice(rowIndex, 1);
				}

				if (deleteOnlyOne) break;
			}

			this.database.tables[this.activeTable.tableName] = this.activeTable;
			this.save();
			if (matchFound) return true;
		}

		return this;
	}
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
 * Function to check if a row in a table matches a specified operation or not. (Operations such as in, not, not-in, includes, not includes etc).
 * @param { Object } row - The object representing a row in a database table.
 * @param { field } field - Name of field to verify operation on.
 * @param { * } valueToValidateOn - The value to compare with, type depends on the operation.
 * @return { Boolean }
 */
function verifyByCustomOperation(row, field, operation, valueToValidateOn) {
	if (!row || typeof row !== "object") throw new Error("Invalid row type.");

	if (!row[field]) return false; // If the row does not have that column, simply don't use it.

	switch (operation) {
		case "in":
			if (!valueToValidateOn || !Array.isArray(valueToValidateOn))
				throw new Error(
					"value to check field value 'in' is not an iterable."
				);
			return valueToValidateOn.includes(row[field]);
		case "not-in":
			if (!valueToValidateOn || !Array.isArray(valueToValidateOn))
				throw new Error(
					"value to check field value 'not-in' is not an iterable."
				);
			return !valueToValidateOn.includes(row[field]);
		case "not":
			return row[field] != valueToValidateOn;
		case "includes":
			return row[field].includes(valueToValidateOn);
		case "not-includes":
			return !row[field].includes(valueToValidateOn);
		default:
			throw new Error("Invalid/Unsupported operation.");
	}
}

/**
 * Function to check if a row in a table matches any one of the specified operations or not. I.E: "Or" Operations.
 * @param { Object } row - The object representing a row in a database table.
 * @param { Array } subFilters - The filters to check the row against.
 * @return { Boolean }
 */
function verifyOrOperation(row, filters) {
	let anyConditionsMatch = false;
	for (let filter in filters) {
		if (filter in row && row[filter] == filters[filter]) {
			anyConditionsMatch = true;
			break; // We only need one match to verify an OR operation.
		}
	}
	return anyConditionsMatch;
}
module.exports = { db };
