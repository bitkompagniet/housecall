const debug = require('debug')('housecall:queue:debug');
const error = require('debug')('housecall:queue:error');

function queue({ concurrency = 10, cooldown = 0 } = {}) {

	const _running = [];
	const _enqueued = [];

	function pending() {
		return _enqueued.length;
	}

	function running() {
		return _running.length;
	}

	function delay(ms) {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(), ms);
		});
	}

	function pop() {
		if (_running.length < concurrency && _enqueued.length > 0) {
			const fx = _enqueued.shift();

			let result;

			try {
				result = fx();
			} catch (e) {
				error(e);
			}
			
			const asPromise = Promise.resolve(result)
				.catch(err => {
					error(err);
					return Promise.resolve();
				})
				.then(() => {
					const index = _running.indexOf(fx);
					_running.splice(index, 1);
					return delay(cooldown);
				}).then(pop);

			_running.push(asPromise);
			debug(`${running()} running, ${pending()} pending.`);
		}
	}

	function push(fx) {
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
