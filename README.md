# Doggo DB 🐶

DoggoDB is a simple implementation of a local-storage based mini database in the browser that stores data in the form of JSON Data.

There are plans to expand to full-fledged file based database storage on the server-side with indices, transactions and a better querying syntax.

## Index

-   [Use Cases And Features](#use-cases-and-features)
-   [Installation](#installation)
-   [Usage](#usage) - [Initialize the Database](#initialize-the-database) - [Creating Tables](#creating-tables) - [Adding Data to Tables](#adding-data-to-tables) - [Retreiving Data](#retreiving-data) - [Finding And Querying Data](#finding-and-querying-data) - [Updating Data](#updating-data) - [Deleting Data](#deleting-data)
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
<script type="text/javascript" src="https://unpkg.com"></script>
```

## Usage

#### Initialize the Database

```js
const db = new doggodb("databaseName");
const secondDB = new doggodb("separateDatabase");
```

#### Creating tables

Create a table using the instance:

```js
db.table("newtable");
```

#### Adding data to tables

Add data to a table (Right now data container can only be an object, but the fields it contains can be anything supported by `JSON.stringify`)

```js
db.table("newtable").add({
	firstName: "ABC",
	lastName: "XYZ",
});
```

When you add data to a table, DoggoDB automatically adds a unique identifider called `entryId`. The different name is chosen to not conflict with idetifiers such as **'id'** or **'\_id'** that you might be storing locally after importing from your primary database.

#### Retreiving Data

Get all data stored in a table as an array:

```js
db.table("newtable").get(); // [ {...} ]
```

#### Finding and Querying Data

Query data based on field values (Only linear fields supported, no array or object equality as of now):

```js
db.table("newtable").find({ firstName: "ABC" }); // [ { ... }]
```

To find without any filters, you can pass an empty object or no filter object at all.

```js
db.table("newtable").find({}); // Technically the same as .get
db.table("newtable").find(); // Technically the same as .get

// To find by id. Simply include it.
db.table("newtable").find({ entryId: 123 });
```

#### Updating Data

To update a set of values fetched from filters. Use the `findAndUpdate` method.

```js
db.table("newtable").findAndUpdate(filters, { ...updates });
```

This method by default only **updates the first entry it finds matching the filters**, in order to update all the entries, pass `false` as the last paramter.

```js
db.table("newtable").findAndUpdate(filters, { ...updates }, false);
```

To update at a specific index in the contents, use the `updateAt` function.

```js
db.table("newtable").updateAt(entryIndex, { ...updates });
```

#### Deleting Data

To delete data that matches a filter. Use the `delete` method.

```js
db.table("newtable").delete(filters);
```

This method, just like the `findAndUpdate` method, **deletes only the the first entry it finds matching the filters**. To override this behaviour, pass `false` as the final argument to the function.

```js
db.table("newtable").delete(filters, false);
```

## Contribution

This project is extremely naive at this stage, and any contibutions or suggestions would be highly appreciated.

For contributing to the code, simply fork this repository, make the changes you may want to in a new branch and create a pull request for it.

For making any suggestions, read the [Issues and Bugs](#suggestions-issues-and-bugs) section.

## Suggestions, Issues and Bugs

For any issues related to this project, simply raise an issue in the repository and I will respond quickly.
