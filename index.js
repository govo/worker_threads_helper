/**
 * 方便worker theads结束的工具
 */
const {
  Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

function create_worker (script, name, cb = function (data) { }) {
  console.log("create_worker:", script, name)
  const worker = new Worker(script, {
    workerData: name
  });
  worker.on('message', (data) => {
    cb(data)
  });
  function send_close () {
    return new Promise((resolve, reject) => {
      worker.on('message', (data) => {
        if (data == "close") resolve(data)
        console.log("close", data)
      });
      worker.on('error', (err) => {
        reject(err)
      });
      worker.on('exit', (code) => {
        reject(code)
      });
      worker.postMessage("close")
    })
  }
  return { worker, send_close }
}
function on_close (cb) {
  if (isMainThread) {
    console.error('only called at child process')
    return
  }
  parentPort.once("message", async (data) => {
    if (data == "close") {
      await cb()
      parentPort.postMessage("close")
    }
  })
}
module.exports = {
  create_worker, Worker, isMainThread, parentPort, workerData, on_close,
}
