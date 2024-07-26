import { Worker } from 'worker_threads';
import path from 'path';

const currying = (jsFilePath) => (workerData) => {
  const worker = new Worker(path.resolve(__dirname, jsFilePath), {
    workerData,
  });

  const promise: Promise<string[][]> = new Promise((resolve, reject) => {
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

export { Defragmentierung };
