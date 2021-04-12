# Doggo DB 🐶

DoggoDB is a simple implementation of a local-storage based mini database in the browser that stores data in the form of JSON Data.

There are plans to expand to full-fledged file based database storage on the server-side with indices and a better querying syntax.

**Note**: As of now, you can't use the implementation inside a server environment like Node.js since the Local Storage API isn't directly available inside a server.

## Index

The links might not work in case you are viewing them in docs generated using JSDoc, it might be easier in that case to simply scroll to those sections.

-   [Use Cases And Features](#use-cases-and-features)
-   [Installation](#installation)
-   [Usage](#usage)
    -   [Initialize the Database](#initialize-the-database)
    -   [Creating Tables](#creating-tables)
    -   [Adding Data to Tables](#adding-data-to-tables)
    -   [Retreiving Data](#retreiving-data)
    -   [Finding And Querying Data](#finding-and-querying-data)
    -   [Advanced Querying Capabilities](#advanced-querying-capabilities)
    -   [Updating Data](#updating-data)
    -   [Deleting Data](#deleting-data)
    -   [Transactions](#transactions)
-   [Contribution](#contribution)
-   [Suggestions, Issues and Bugs](#suggestions-issues-and-bugs)

## Use Cases And Features

This is not supposed to be a primary database, which is supposed to be obvious. Instead, DoggoDB is supposed to be used as primarily a localStorage based cache for libraries/frameworks such as Svelte or just plain HTML, CSS and JS that don't have a native persisted state management solution such as `Redux-Persist` (Although you can use Redux and Redux Persist with pretty much any framework or libraries, how many of us do?)

#### Wait a second... Why wouldn't I simply write Local Storage querying code myself?

You absolutely can. This is just an interesting side project that I plan to expand to a fully functional server-side database as I learn more about databases. Inspired by projects such as [Firebase](https://firebase.google.com) and [lowdb](https://github.com/typicode/lowdb) but with 0 dependencies written purely with Vanilla JavaScript.

Also, this was built out of my own need for a good abstraction on top of `localStorage`, and also better looking querying syntax 😛.

DoggoDB in its first iteration supports:

-   Creation of databases.
-   Creation of tables.
-   Querying of tables.
-   Adding data to tables.
-   Updation of existing data.
-   Deletion based on filters.

I.E: The basic CRUD system of NoSQL Databases.

## Installation

Run the following command to install this database utility.

```bash
npm install doggodb
```

And include as:

```javascript
// CommonJS / Node.js (I don't know why you would use this in a server environment at this stage.)
const { db } = require("doggodb");

// ES6 Imports
import { db } from "doggodb";

// Named Import
import { db as doggodb } from "doggodb";
```

To download from a CDN:

```html
<!-- Head -->
<script
    type="text/javascript"
    src="https://unpkg.com/doggodb/dist/doggodb.min.js"
></script>

<!-- Body Bottom -->
<script type="text/javascript" defer>
    // The 'db' function is inside the 'doggodb' object after importing from CDN.
    const dbInstance = new doggodb.db("databaseName");
</script>
```

Feel free to play around with the imports and names.

## Usage

#### Initialize the Database

```js
const dbInstance = new db("databaseName");
const secondDB = new db("separateDatabase");
```

#### Creating tables

Create a table using the instance:

```js
dbInstance.table("newtable");
```

#### Adding data to tables

Add data to a table (Right now data container can only be an object, but the fields it contains can be anything supported by `JSON.stringify`)

```js
dbInstance.table("newtable").add({
    firstName: "ABC",
    lastName: "XYZ",
});
```

When you add data to a table, DoggoDB automatically adds a unique identifider called `entryId`. The different name is chosen to not conflict with idetifiers such as **'id'** or **'\_id'** that you might be storing locally after importing from your primary database.

#### Retreiving Data

Get all data stored in a table as an array:

```js
dbInstance.table("newtable").get(); // [ {...} ]
```

#### Finding and Querying Data

Query data based on field values (Only linear fields supported, no array or object equality as of now):

```js
dbInstance.table("newtable").find({ firstName: "ABC" }); // [ { ... }]
```

To find without any filters, you can pass an empty object or no filter object at all.

```js
dbInstance.table("newtable").find({}); // Technically the same as .get
dbInstance.table("newtable").find(); // Technically the same as .get

// To find by id. Simply include it.
dbInstance.table("newtable").find({ entryId: 123 });
```

To offset and limit data, pass in an object with the `offset` and `limit` properties.

- `offset` - The index to start counting entries from.
- `limit` - The number of entires to limit in the result set.

```js
dbInstance.table("newtable").find({ field: "value" }, { limit: 5 });
dbInstance.table("newtable").find({ field: "value" }, { offset: 2, limit: 3 });
dbInstance.table("newtable").find({ field: "value" }, { offset: 4 });
```

#### Advanced Querying Capabilities

On top of the limits and offset methods, the library also supports advanced querying capabilities such as 'Array Membership' and other operations. They can be acheived by structuring your filter objects in specific ways.

Right now, the following are available:

- `$not`: Checks if a value in a field is not the provided value.

The following two are only applicable for fields that are of the type Arrays:
- `$includes`: Checks if a field's value includes a certain value.
- `$notIncludes`: Checks if a field's value includes a certain value or not.

The remaining are also array-membership operations.
- `$in`:
- `$notIn`: Checks if a field's value is not present in an Array value. 

**Usage**:

```js
dbInstance.table("newtable").find({ 
    $not: { field: 1 }  // Will check if the value for "field" is not equal to 1.
});

dbInstance.table("newtable").find({ 
    $includes: { field: 1 } // Will check if the array at "field" includes 1 or not.
});

dbInstance.table("newtable").find({ 
    $notIncludes: { field: 1 }
});

dbInstance.table("newtable").find({ 
    $in: { field: [ 1, 2, 3] }
});

dbInstance.table("newtable").find({ 
    $notIn: { field: [ 1, 2, 3] }
});
```

##### Or Queries

Or Queries are now supported by DoggoDB. To create a

```js
dbInstance.table("newtable").find({ 
    $or: { field1: "value1", field2: "value2"}
});
```

The above query, unlike the other filters, checks for the rows where either of the conditions is valid. This can be paired with other filters and they will behave as the regular and queries.

**Notes**: As of now, the advanced queries can't be nested inside each other, but they can be paired together to create a super query.

For Example:

```js
dbInstance.table("newtable").find({ 
    $or: { field1: "value1", field2: "value2"}, 
    $in: { field3: [1, 2, 3] }
});
```

Another point to note is that the queries work only on rows that have those fields in them. If suppose you try to find rows where the `marks` attribute is 0, the rows that don't have `marks` won't be counted.

The above advanced querying capabilities are supported for updating and deleting data as well.

#### Updating Data

To update a set of values fetched from filters. Use the `findAndUpdate` method.

```js
dbInstance.table("newtable").findAndUpdate(filters, { ...updates });
```

This method by default only **updates the first entry it finds matching the filters**, in order to update all the entries, pass `false` as the last paramter.

```js
dbInstance.table("newtable").findAndUpdate(filters, { ...updates }, false);
```

To update at a specific index in the contents, use the `updateAt` function.

```js
dbInstance.table("newtable").updateAt(entryIndex, { ...updates });
```

#### Deleting Data

To delete data that matches a filter. Use the `delete` method.

```js
dbInstance.table("newtable").delete(filters);
```

This method, just like the `findAndUpdate` method, **deletes only the the first entry it finds matching the filters**. To override this behaviour, pass `false` as the final argument to the function.

```js
dbInstance.table("newtable").delete(filters, false);
```

### Transactions

The database now supports transactions. These are pretty simple in their work and follow the following algorithm to perform them:

- Start a transaction by setting a flag to `true`.
- Make any changes locally in the class state.
- If the user commits the transaction, commit the changes made in the local class state to the storage.
- If the user aborts the transaction, simply discard the changes made in the class state and load the new changes afresh.

```js
// Usage of transactions
dbInstance.startTransaction();

// ... Make any changes here to the instance as you would based on the above docs.

// Commit the transaction
dbInstance.commitTransaction();

// Abort the transaction
dbInstance.abortTransaction();

// Continue...
```

## Contribution

This project is extremely naive at this stage, and any contibutions or suggestions would be highly appreciated.

For contributing to the code, simply fork this repository, make the changes you may want to in a new branch and create a pull request for it.

For making any suggestions, read the [Issues and Bugs](#suggestions-issues-and-bugs) section.

## Suggestions, Issues and Bugs

For any issues related to this project, simply raise an issue in the repository and I will respond quickly.
