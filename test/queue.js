var Promise = require("bluebird");
var should = require("chai").should();

var wait = function(time) {

	return new Promise(function (resolve, reject) {

		setTimeout(function() {

			resolve("Resolved!");

		}, (time || 1000));

	});

};

describe("Queue(function, [concurrency])", function() {

	var queue = require("../lib/queue");

	it("Should only accept arguments of the correct form", function() {

		var a = function() {};
		var b = 10;
		var c = "help!";

		queue.should.be.a("function");

		queue.bind(queue).should.throw(Error);
		queue.bind(queue, a).should.not.throw(Error);
		queue.bind(queue, a, b).should.not.throw(Error);
		queue.bind(queue, c).should.throw(Error);
		queue.bind(queue, a, c).should.throw(Error);
		queue(a,b).should.be.an("object");

	});

	it("Should have the necessary properties and methods", function() {

		var q = queue(function() {});

		q.should.have.property("concurrency", 10);
		q.should.have.property("action").that.is.a("function");
		q.should.have.property("items").that.is.an("array");
		q.should.have.property("active").that.is.a("boolean");
		q.should.have.property("running").that.is.a("number");
		q.should.have.property("push").that.is.a("function");
		q.should.have.property("start").that.is.a("function");
		q.should.have.property("pause").that.is.a("function");
		q.should.have.property("clear").that.is.a("function");

	});

	it("Should emit events 'added', 'progress' and 'done'", function() {

		var items = [100, 100, 100];
		var q = queue(wait, 1);
		q.pause();

		q.should.have.property("on").that.is.a("function");

		var addedPromise = new Promise(function(resolve, reject) {
			q.on("added", function(value) {
				value.should.be.an("array");
				resolve();
			});
		});

		var progressPromise = new Promise(function(resolve, reject) {

			var count = 0;

			q.on("progress", function(value) {
				value.should.be.a("string");
				value.should.equal("Resolved!");

				count++;

				if (count === items.length) resolve();
			});
		})

		var donePromise = new Promise(function(resolve, reject) {
			q.on("done", function() {
				resolve();
			});
		});

		q.push(items);

		q.start();

		return Promise.all([addedPromise, progressPromise, donePromise]);

	});

	describe(".push(item)", function() {

		this.timeout(10000);

		it("Should correctly update items, also when fed arrays", function() {

			var q = queue(function() {});
			q.pause();

			q.items.length.should.equal(0);

			q.push(100);
			q.items.length.should.equal(1);

			q.push([100, 100]);
			q.items.length.should.equal(3);

		});

		it("Should work the queue as expected", function(done) {

			var q = queue(wait, 1);
			q.pause();

			q.push([100, 100, 100]);
			q.items.length.should.equal(3);

			q.start();

			wait(20)
			.then(function() {
				q.items.length.should.equal(2);
				return wait(100);
			})
			.then(function() {
				q.items.length.should.equal(1);
				return wait(100);
			})
			.done(function() {
				done();
			});

		});

		it("Should return a promise that is resolved eventually with the result to the caller", function() {

			var q = queue(wait, 1);
			q.pause();

			var promise = q.push(100);
			promise.should.have.property("then").that.is.a("function");

			promise.isPending().should.equal(true);

			return wait(110)
			.then(function() {
				promise.isPending().should.equal(true);
				q.start();
				return wait(110);
			})
			.then(function() {
				promise.isPending().should.equal(false);
				promise.isFulfilled().should.equal(true);
				promise.value().should.equal("Resolved!");
			});

		});

	});

	describe(".pause() and .start()", function() {

		this.timeout(5000);

		it("Should stop and restart the queue", function() {

			var q = queue(wait, 1);
			q.pause();

			q.push([20, 20, 20]);
			q.items.length.should.equal(3);

			return wait(100)
			.then(function() {
				q.items.length.should.equal(3);
				q.start();
				return wait(100);
			})
			.then(function() {
				q.items.length.should.equal(0);
			});

		});

	});

	describe(".clear()", function() {

		it("Should empty out the items", function() {

			var q = queue(wait, 1);
			q.pause();

			q.push([100, 100]);
			q.items.length.should.equal(2);

			q.clear();
			q.items.length.should.equal(0);

		});

	});
	
});