const rumor = require('rumor')('housecall');
const _ = require('lodash');

module.exports = function ({ concurrency = 10, cooldown = 0 } = {}) {
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
		return new Promise((resolve) => {
			setTimeout(() => resolve(), ms);
		});
	}

	function pop() {
		if ((_running.length + _staging.length) < concurrency && _enqueued.length > 0) {
			const fx = _enqueued.shift();
			_staging.push(fx);

			delay(executionDelay())
				.then(() => {
					_staging.splice(_staging.indexOf(fx), 1);
					_running.push(fx);
					rumor.debug(`${running()} running, ${staging()} staging and ${pending()} pending.`);
				})
				.then(() => {
					let result;

					try {
						result = fx();
					} catch (e) {
						rumor.error(e);
					}

					return Promise.resolve(result);
				})
				.catch((err) => {
					rumor.error(err);
					return Promise.resolve();
				})
				.then(() => {
					_running.splice(_running.indexOf(fx), 1);
				})
				.then(pop);
		}
	}

	function push(fx) {
		const tasks = _.isArray(fx) ? fx : [fx];

		tasks.forEach((task) => {
			if (!_.isFunction(task)) throw new Error('Push only functions that returns promises to the queue.');
			_enqueued.push(task);
			pop();
		});
	}

	return {
		push,
		delay,
		running,
		pending,
	};
};
