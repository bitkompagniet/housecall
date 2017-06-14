import { expect } from 'chai';
import * as _ from 'lodash';
import housecall from '../src/lib/queue';

function delay(ms: number): Promise<any> { return new Promise(resolve => setTimeout(resolve, ms)); }

function createTasks(num: number, ms: number = 1000) {
	return _.range(0, num, 1).map(index => () => delay(ms).then(() => index));
}

describe('housecall()', function () {
	this.timeout(2000000);

	it('should be a function', function () {
		expect(housecall).to.be.a('function');
	});

	it('should construct an object', function () {
		expect(housecall()).to.be.an('object');
	});

	it('should continue on error', function () {
		const q = housecall({ concurrency: 1, cooldown: 0 });
		q.push(() => delay(10));
		q.push(() => { throw new Error('hest'); });
		q.push(() => Promise.resolve().then(() => Promise.reject(null)));
		q.push(() => delay(10));

		return delay(100).then(() => {
			expect(q.noPending()).to.equal(0);
			expect(q.noRunning()).to.equal(0);
		});
	});

	// it('should wait for a cooldown of 50 ms', function () {
	// 	const q = housecall({ concurrency: 1000, cooldown: 50 });
	// 	q.push(createTasks(10));

	// 	// const f = index => q.delay(1000).then(() => index);

	// 	// for (let i = 0; i < 10; i += 1) q.push(() => f(i));

	// 	return q.delay(30)
	// 		.then(() => q.running().should.equal(0) && q.delay(50))
	// 		.then(() => q.running().should.equal(1) && q.delay(50))
	// 		.then(() => q.running().should.equal(2));
	// });

	// it('should fire idle event when it runs dry', function (done) {
	// 	const q = housecall({ concurrency: 1, cooldown: 50 });
	// 	q.push(createTasks(3, 100));
	// 	q.on.should.be.a('function');

	// 	q.on('idle', (noDone, noErr) => {
	// 		noDone.should.equal(3);
	// 		noErr.should.equal(0);
	// 		done();
	// 	});
	// });
});
