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

var queue = housecall(request, 1);

queue.on("added", function(value) {
	// Something was added.
});

queue.push("http://www.google.com");

queue.push("https://twitter.com/").spread(function(response, body) {
	// The eventual response of Twitter
});

queue.push("https://www.reddit.com/");

queue.on("progress", function(value) {
	// Something was completed.
});

queue.on("done", function() {
	// The queue is done.
});

```

It is possible to push an array of items. The return value will be an array of promises.

```javascript
queue.push(["http://www.google.com", "https://twitter.com/", "https://www.reddit.com/"]).all(function(responses) {
	// All eventual responses.
});
```