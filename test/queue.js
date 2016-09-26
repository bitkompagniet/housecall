const should = require("chai").should();
const queue = require('../lib/queue');
const Chance = require('chance');

describe("queue()", function() {

	this.timeout(2000000);

	it('should be a function', function() {
		queue.should.be.a('function');
	});

	it('should construct an object', function() {
		const q = queue();
		queue().should.be.an('object');
	});

	it('should have methods push, delay, ', function() {
		queue().push.should.be.a('function');
	});

	it('should continue on error', function() {
		const q = queue({ concurrency: 1 });
		q.push(() => q.delay(10))
		q.push(() => { throw new Error('hest'); });
		q.push(() => Promise.resolve().then(() => Promise.reject()))
		q.push(() => q.delay(10));

		return q.delay(100).then(() => {
			q.pending().should.equal(0);
			q.running().should.equal(0);
		});
	});

	it('should wait for a cooldown of 40 ms', function() {
		const q = queue({ concurrency: 3, cooldown: 40 });
		const f = index => q.delay(40).then(() => index);

		for (let i = 0; i < 9; i++) q.push(() => f(i));

		q.running().should.equal(3);

		return q.delay(60)
			.then(() => q.running().should.equal(0) && q.delay(40))
			.then(() => q.running().should.equal(3) && q.delay(40))
			.then(() => q.running().should.equal(0));
	});
	
});