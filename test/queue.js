const should = require("chai").should();
const queue = require('../lib/queue');
const Chance = require('chance');
const chance = new Chance();

describe("queue()", function() {

	this.timeout(2000000);

	it('should be a function', function() {
		queue.should.be.a('function');
	});

	it('should construct an object', function() {
		const q = queue();
		queue().should.be.an('object');
	});

	it('should have methods push, delay, running, pending', function() {
		queue().push.should.be.a('function');
		queue().delay.should.be.a('function');
		queue().running.should.be.a('function');
		queue().pending.should.be.a('function');
	});

	it('should fail if we feed it a non-function', function() {
		should.throw(() => queue().push('test'));
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

	it('should wait for a cooldown of 50 ms', function() {
		const q = queue({ concurrency: 1000, cooldown: 50 });
		const f = index => q.delay(1000).then(() => index);

		for (let i = 0; i < 10; i++) q.push(() => f(i));

		//return q.delay(2000000);
		return q.delay(30)
			.then(() => q.running().should.equal(0) && q.delay(50))
			.then(() => q.running().should.equal(1) && q.delay(50))
			.then(() => q.running().should.equal(2));
	});
	
});