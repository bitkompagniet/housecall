import * as moment from 'moment';

export interface QueueConfiguration {
    concurrency: number;
    cooldown: number;
}

export interface PendingPromise {
    fx: () => Promise<any>
    callback: (promise: Promise<any>) => void,
}

export class Queue {

    protected config: QueueConfiguration;
    protected pending: Array<PendingPromise> = [];
    protected staging: Array<PendingPromise> = [];
    protected running: Array<Promise<any>> = [];
    protected done: Array<Promise<any>> = [];
    protected earliestExecution: moment.Moment;

    constructor(configuration : QueueConfiguration = { concurrency: 3, cooldown: 1000 }) {
        this.config = configuration;
        this.earliestExecution = moment();
    }

    public noPending() : number { return this.pending.length; }
    public noStaging() : number { return this.staging.length; }
    public noRunning() : number { return this.running.length; }
    public noDone() : number { return this.done.length; }

    public async push(fx: Array<() => Promise<any>>) : Promise<Array<Promise<any>>>;
    public async push(fx: () => Promise<any>) : Promise<any>;
    public async push(fx: any) : Promise<any> {
        if (Array.isArray(fx)) {
            const asArray = fx as Array<() => Promise<any>>
            return asArray.map(this.pushSingle);
        } else {
            return this.pushSingle(fx);
        }
    }

    private async promiseResolved(promise : Promise<any>) {
        this.running.splice(this.running.indexOf(promise), 1);
        this.done.push(promise);
    }

    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async tick() : Promise<void> {
        if (this.executionAllowed()) this.next();
    }

    private incrementAndReturnDelay() : number {
        const isAfter = moment().isAfter(this.earliestExecution);
        const delay : number = isAfter ? 0 : this.earliestExecution.valueOf() - moment().valueOf();
        this.earliestExecution = moment().add(this.config.cooldown, 'ms');
        return delay;
    }

    private async next() : Promise<void> {
        if (!this.executionAllowed()) throw new Error('Next called when execution was not allowed.')
        const pendingPromise : PendingPromise = this.pending.shift();
        this.staging.push(pendingPromise);
        await this.delay(this.incrementAndReturnDelay());
        const promise = pendingPromise.fx();
        this.staging.splice(this.staging.indexOf(pendingPromise, 1));
        this.running.push(promise);
        pendingPromise.callback(promise);
        this.tick();
    }

    private executionAllowed() : boolean {
        return this.pending.length > 0 
            && this.running.length <= this.config.concurrency;
    }

    private pushSingle(fx: () => Promise<any>) : Promise<any> {
        return new Promise((resolve, reject) => {
            const pendingPromise : PendingPromise = {
                fx,
                callback: promise => promise.then(resolve).catch(reject)
            };

            this.pending.push(pendingPromise);
            if (this.executionAllowed()) this.next();
        });
    }
}

export default function(configuration: QueueConfiguration = null): Queue {
    return new Queue(configuration);
}
