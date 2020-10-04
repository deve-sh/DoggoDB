# Doggo DB 🐶

DoggoDB is a simple implementation of a local-storage based mini database in the browser that stores data in the form of JSON Data.

There are plans to expand to full-fledged file based database storage on the server-side with indices, transactions and a better querying syntax.

## Use Cases and Features

This is not supposed to be a primary database, which is supposed to be obvious. Instead, DoggoDB is supposed to be used as primarily a localStorage based cache for libraries/frameworks such as Svelte or just plain HTML, CSS and JS that don't have a native persisted state management solution such as `Redux-Persist` (Although you can use Redux and Redux Persist with pretty much any framework or libraries, how many of us do?)

#### Wait a second... Why wouldn't I simply write Local Storage querying code myself?

You absolutely can. This is just an interesting side project that I plan to expand to a fully functional server-side database as I learn more about databases. Inspired by projects such as [Firebase](https://firebase.google.com) and [lowdb](https://github.com/typicode/lowdb) but with 0 dependencies written purely with Vanilla JavaScript.

Also, this was built out of my own need for a good abstraction on top of `localStorage`, and also better looking querying syntax 😛.

DoggoDB in its first iteration supports:
- Creation of databases.
- Creation of tables.
- Querying of tables.
- Adding data to tables.
- Updation of existing data.
- Deletion based on filters.

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

Initialize the database:

```js
const db = new doggodb("databaseName");
const secondDB = new doggodb("separateDatabase");
```

Create a table using the instance:

```js
db.table("newtable");
```

Add data to a table (Right now data container can only be an object, but the fields it contains can be anything supported by `JSON.stringify`)

```js
db.table("newtable").add({ 
	firstName: "ABC", 
	lastName: "XYZ"
});
```

When you add data to a table, DoggoDB automatically adds a unique identifider called `entryId`. The different name is chosen to not conflict with idetifiers such as **'id'** or **'_id'** that you might be storing locally after importing from your primary database.

Get all data stored in a table as an array:

```js
db.table("newtable").get();	// [ {...} ]
```

Query data based on field values (Only linear fields supported, no array or object equality as of now):

```js
db.table("newtable").find({ firstName: "ABC" });	// [ { ... }]
```

## Contribution

## Issues and Bugs