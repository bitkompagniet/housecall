const rumor = require('rumor')('housecall');
const _ = require('lodash');
const EventEmitter = require('events');

class Queue extends EventEmitter {
	constructor({ concurrency = 10, cooldown = 0 } = {}) {
		super();
		this.concurrency = concurrency;
		this.cooldown = cooldown;
		this.noCompleted = 0;
		this.noErrors = 0;
		this._running = [];
		this._staging = [];
		this._enqueued = [];
		this.earliestExecution = Date.now();
	}

	executionDelay() {
		const now = Date.now();
		if (this.earliestExecution < now) this.earliestExecution = now;
		this.earliestExecution += this.cooldown;
		return this.earliestExecution - now;
	}

	pending() {
		return this._enqueued.length;
	}

	running() {
		return this._running.length;
	}

	staging() {
		return this._staging.length;
	}

	readyToPop() {
		return (this._running.length + this._staging.length) < this.concurrency && this._enqueued.length > 0;
	}

	allDone() {
		return (this._running.length === 0 && this._staging.length === 0 && this._enqueued.length === 0);
	}

	delay(ms) { // eslint-disable-line class-methods-use-this
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	pop() {
		if (this.readyToPop()) {
			const fx = this._enqueued.shift();
			this._staging.push(fx);

			this.delay(this.executionDelay())
				.then(() => {
					this._staging.splice(this._staging.indexOf(fx), 1);
					this._running.push(fx);
					rumor.debug(`${this.running()} running, ${this.staging()} staging and ${this.pending()} pending.`);
				})
				.then(() => {
					let result;

					try {
						result = fx();
					} catch (e) {
						rumor.error(e);
						this.noErrors += 1;
					}

					return Promise.resolve(result);
				})
				.catch((err) => {
					rumor.error(err);
					this.noErrors += 1;
					return Promise.resolve();
				})
				.then(() => {
					this._running.splice(this._running.indexOf(fx), 1);
					this.noCompleted += 1;
				})
				.then(this.pop.bind(this));
		} else if (this.allDone()) {
			this.emit('idle', this.noCompleted, this.noErrors);
		}
	}

	push(fx) {
		const tasks = _.isArray(fx) ? fx : [fx];

		tasks.forEach((task) => {
			if (!_.isFunction(task)) throw new Error('Push only functions that returns promises to the queue.');
			this._enqueued.push(task);
			this.pop();
		});
	}
}

module.exports = function (config) {
	const result = new Queue(config);
	return result;
};
