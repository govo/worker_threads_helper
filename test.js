const { isMainThread, workerData, create_worker, on_close } = require('./index')

function threads_1 (name) {
    console.log('start thread:', name)
    let _is_close = false
    let handler = setInterval(() => {
        console.log('run', name, _is_close)
    }, 1000)
    on_close(() => {
        _is_close = true
        clearInterval(handler)
        console.log('threads_1 receive close')
    })
}
async function threads_2 (name) {
    console.log('start thread:', name)
    let _is_close = false
    let _count = 0

    on_close(() => {
        console.log('threads_2 receive close')
        _is_close = true
    })
    function wait () {
        return new Promise((resolve, reject) => {
            setImmediate(resolve)
        })
    }
    while (!_is_close) {
        await wait()
    }
    console.log('while:', _count++, _is_close);
}


async function main () {
    let { send_close: send_close_1 } = create_worker(__filename, 'th1')
    let { send_close: send_close_2 } = create_worker(__filename, 'th2')
    let { send_close: send_close_3 } = create_worker(__filename, 'th3')
    let { send_close: send_close_4 } = create_worker(__filename, 'while')
    const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']
    console.log('try to kill main process any time');
    signalTraps.forEach(type => {
        process.once(type, async () => {
            console.log("signalTraps:", type)
            try {
                await send_close_1();
                await send_close_2();
                await send_close_3();
                await send_close_4();
                console.log("final close")
            } catch (e) {
                console.error("err:", e)
            } finally {
                console.log("do close")
                process.kill(process.pid, type)
            }
        })
    })
}

if (isMainThread) {
    main().catch(console.error)

} else {
    switch (workerData) {
        case 'while':
            threads_2(workerData).catch(console.error)
            break;
        default:
            threads_1(workerData)
    }
}