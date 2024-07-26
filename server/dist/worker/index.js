"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Defragmentierung = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const currying = (jsFilePath) => (workerData) => {
    const worker = new worker_threads_1.Worker(path_1.default.resolve(__dirname, jsFilePath), {
        workerData,
    });
    const promise = new Promise((resolve, reject) => {
        worker.on('message', function (data) {
            resolve(data.data);
            //worker.terminate();
        });
        worker.on('error', function (error) {
            reject(error);
            //worker.terminate();
        });
        worker.on('exit', (code) => {
            // 正常子线程运算完成时，触发主线exit，值为0
            if (code !== 0)
                reject(new Error(`Worker Thread stopped with exit code ${code}`));
        });
    });
    return {
        promise,
        worker,
    };
};
const Defragmentierung = currying('./Defragmentierung.js');
exports.Defragmentierung = Defragmentierung;
