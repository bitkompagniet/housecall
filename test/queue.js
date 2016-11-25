/* global define it, describe */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable import/no-extraneous-dependencies */

const should = require('chai').should();
const housecall = require('../lib/queue');
const _ = require('lodash');

function createTasks(num, ms = 1000) {
	const delay = housecall().delay;
	return _.range(0, num, 1).map(index => () => delay(ms).then(() => index));
}

describe('housecall()', function () {
	this.timeout(2000000);

	it('should be a function', function () {
		housecall.should.be.a('function');
	});

	it('should construct an object', function () {
		housecall().should.be.an('object');
	});

	it('should have methods push, delay, running, pending', function () {
		housecall().push.should.be.a('function');
		housecall().delay.should.be.a('function');
		housecall().running.should.be.a('function');
		housecall().pending.should.be.a('function');
	});

	it('should fail if we feed it a non-function', function () {
		should.throw(() => housecall().push('test'));
	});

	it('should continue on error', function () {
		const q = housecall({ concurrency: 1 });
		q.push(() => q.delay(10));
		q.push(() => { throw new Error('hest'); });
		q.push(() => Promise.resolve().then(() => Promise.reject()));
		q.push(() => q.delay(10));

		return q.delay(100).then(() => {
			q.pending().should.equal(0);
			q.running().should.equal(0);
		});
	});

	it('should wait for a cooldown of 50 ms', function () {
		const q = housecall({ concurrency: 1000, cooldown: 50 });
		q.push(createTasks(10));

		// const f = index => q.delay(1000).then(() => index);

		// for (let i = 0; i < 10; i += 1) q.push(() => f(i));

		return q.delay(30)
			.then(() => q.running().should.equal(0) && q.delay(50))
			.then(() => q.running().should.equal(1) && q.delay(50))
			.then(() => q.running().should.equal(2));
	});

	it('should fire idle event when it runs dry', function (done) {
		const q = housecall({ concurrency: 1, cooldown: 50 });
		q.push(createTasks(3, 100));
		q.on.should.be.a('function');

		q.on('idle', (noDone, noErr) => {
			noDone.should.equal(3);
			noErr.should.equal(0);
			done();
		});
	});
});
