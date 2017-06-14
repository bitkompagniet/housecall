"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var moment = require("moment");
var Queue = (function () {
    function Queue(configuration) {
        if (configuration === void 0) { configuration = { concurrency: 3, cooldown: 1000 }; }
        this.config = configuration;
        this.earliestExecution = moment();
    }
    Queue.prototype.noPending = function () { return this.pending.length; };
    Queue.prototype.noStaging = function () { return this.staging.length; };
    Queue.prototype.noRunning = function () { return this.running.length; };
    Queue.prototype.noDone = function () { return this.done.length; };
    Queue.prototype.push = function (fx) {
        return __awaiter(this, void 0, void 0, function () {
            var asArray;
            return __generator(this, function (_a) {
                if (Array.isArray(fx)) {
                    asArray = fx;
                    return [2 /*return*/, asArray.map(this.pushSingle)];
                }
                else {
                    return [2 /*return*/, this.pushSingle(fx)];
                }
                return [2 /*return*/];
            });
        });
    };
    Queue.prototype.promiseResolved = function (promise) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.running.splice(this.running.indexOf(promise), 1);
                this.done.push(promise);
                return [2 /*return*/];
            });
        });
    };
    Queue.prototype.delay = function (ms) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
            });
        });
    };
    Queue.prototype.tick = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.executionAllowed())
                    this.next();
                return [2 /*return*/];
            });
        });
    };
    Queue.prototype.incrementAndReturnDelay = function () {
        var isAfter = moment().isAfter(this.earliestExecution);
        var delay = isAfter ? 0 : this.earliestExecution.valueOf() - moment().valueOf();
        this.earliestExecution = moment().add(this.config.cooldown, 'ms');
        return delay;
    };
    Queue.prototype.next = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pendingPromise, promise;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.executionAllowed())
                            throw new Error('Next called when execution was not allowed.');
                        pendingPromise = this.pending.shift();
                        this.staging.push(pendingPromise);
                        return [4 /*yield*/, this.delay(this.incrementAndReturnDelay())];
                    case 1:
                        _a.sent();
                        promise = pendingPromise.fx();
                        this.staging.splice(this.staging.indexOf(pendingPromise, 1));
                        this.running.push(promise);
                        pendingPromise.callback(promise);
                        this.tick();
                        return [2 /*return*/];
                }
            });
        });
    };
    Queue.prototype.executionAllowed = function () {
        return this.pending.length > 0
            && this.running.length <= this.config.concurrency;
    };
    Queue.prototype.pushSingle = function (fx) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var pendingPromise = {
                fx: fx,
                callback: function (promise) { return promise.then(resolve)["catch"](reject); }
            };
            _this.pending.push(pendingPromise);
            if (_this.executionAllowed())
                _this.next();
        });
    };
    return Queue;
}());
exports.Queue = Queue;
function default_1(configuration) {
    if (configuration === void 0) { configuration = null; }
    return new Queue(configuration);
}
exports["default"] = default_1;
