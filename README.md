A very simple promise queue. On creation, takes a function that should return a promise. 
You can then push values that are passed to the function as the queue is processed. Every time you push an
item, a promise is returned that will be resolved with the value when the item has been processed.

## Install

```
npm install housecall
```

## Usage

```javascript
var housecall = require("housecall");
var Promise = require("bluebird");
var request = Promise.promisify(require('request'));

// housecall(function(value) { return promise; }, [maximum concurrent queue items])
var queue = housecall(request, 1);

queue.push("https://twitter.com/").spread(function(response, body) {
	// The eventual response of Twitter
});

```

It is possible to push an array of items. The return value will be an promise resolving all these items.

```javascript
queue.push(["http://www.google.com", "https://twitter.com/", "https://www.reddit.com/"]).then(function(results) {
	// Results from the above 3 calls.
});
```

## Promises

You should always initialize housecall with a function that returns a promise. Otherwise, results will not be as expected.

If you want to create a queue for a node style function, utilizing a callback function, you should [promisify that function](https://github.com/petkaantonov/bluebird/blob/master/API.md#promisification).