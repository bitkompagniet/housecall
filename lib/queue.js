var extend = require("extend");
var Promise = require("bluebird");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var events = require("events");

var Queue = function(action, concurrency) {

	EventEmitter.call(this);

	var self = this;
	
	self.items = [];
	self.concurrency = concurrency;
	self.action = action;
	self.active = true;
	self.running = 0;

	var ping = function() {
		while (self.items.length > 0 && self.active && self.running < self.concurrency) {
			next();
		}
	}

	var next = function() {
		var item = self.items.shift();
		self.running++;

		return item().then(function(value) {
			self.running--;

			self.emit("progress", value);

			if (self.running === 0 && self.items.length === 0) {
				self.emit("done");
			}

			ping();
		});

	};

	var createWrapper = function(item) {

		return new Promise(function(resolve, reject) {

			var wrapper = function() {
				var outcome = Promise.resolve(self.action(item));
				outcome.then(resolve);
				return outcome;
			};

			self.items.push(wrapper);

		});

	};

	self.push = function(item) {
		if (Array.isArray(item)) {
			var result = Promise.all(item.map(function(i) { return createWrapper(i); }));
		}
		else {
			var result = createWrapper(item);
		}

		self.emit("added", result);

		setTimeout(ping, 5);

		return result;
	};

	self.start = function() {
		self.active = true;
		ping();
	};

	self.pause = function() {
		self.active = false;
	};

	self.clear = function() {
		self.items = [];
	};
}

//util.inherits(Queue, EventEmitter);
Queue.prototype = new EventEmitter();

var queue = function(action, concurrency) {

	if (!action || typeof action !== "function") throw new Error("action must be a function.");
	if (concurrency && typeof concurrency !== "number") throw new Error("concurrency must be a number.");
	
	concurrency = concurrency || 10;

	return new Queue(action, concurrency);
}

module.exports = queue;