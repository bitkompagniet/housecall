const debug = require('debug')('housecall:queue:debug');
const error = require('debug')('housecall:queue:error');
const _ = require('lodash');

function queue({ concurrency = 10, cooldown = 0 } = {}) {

	const _running = [];
	const _staging = [];
	const _enqueued = [];
	let earliestExecution = Date.now();

	function executionDelay() {
		const now = Date.now();
		if (earliestExecution < now) earliestExecution = now;
		earliestExecution += cooldown;
		return earliestExecution - now;
	}

	function pending() {
		return _enqueued.length;
	}

	function running() {
		return _running.length;
	}

	function staging() {
		return _staging.length;
	}

	function delay(ms) {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(), ms);
		});
	}

	function pop() {
		if ((_running.length + _staging.length) < concurrency && _enqueued.length > 0) {

			const fx = _enqueued.shift();
			_staging.push(fx);

			const asPromise = delay(executionDelay())
				.then(() => {
					_staging.splice(_staging.indexOf(fx), 1);
					_running.push(fx);
					debug(`${running()} running, ${staging()} staging and ${pending()} pending.`);
				})
				.then(() => {
					let result;

					try {
						result = fx();
					} catch (e) {
						error(e);
					}
					
					return Promise.resolve(result);
				})
				.catch(err => {
					error(err);
					return Promise.resolve();
				})
				.then(() => {
					_running.splice(_running.indexOf(fx), 1);
				}).then(pop);
		}
	}

	function push(fx) {
		if (!_.isFunction(fx)) throw new Error('Push only functions that returns promises to the queue.');
		_enqueued.push(fx);
		pop();
	}

	return {
		push,
		delay,
		running,
		pending
	};

}

module.exports = queue;
