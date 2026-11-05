//@ts-check
'use strict'

import { readParquetTable } from './readParquetTable.js'
import { parquetTileWorkerSource } from './parquetTileWorker.generated.js'

// Decoding a tile takes the main thread some 100 ms on a laptop, during which a map being panned stands still. So tiles are fetched and decoded in workers, and
// the cells are made from the columns a little at a time. The worker runs from a Blob, its code in a string: that works from the sources or from the bundle, under any
// bundler, and needs no file to be served. Where it cannot run (no Worker, a security policy without blob:), tiles are decoded on the main thread as before.

const WORKERS = 2
const SLICE_MS = 4
const CELLS_BETWEEN_CHECKS = 256

/** @type {Array.<Worker>} */
const pool = []
let nextWorker = 0
let nextRequest = 1
let workersFailed = typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL
/** @type {Map<number, {url:string, resolve:function, reject:function}>} */
const requests = new Map()

function onWorkerFailure() {
    workersFailed = true
    for (const worker of pool) worker.terminate()
    pool.length = 0
    // what was asked of them is read here instead
    const waiting = [...requests.values()]
    requests.clear()
    for (const { url, resolve, reject } of waiting) fetchOnMainThread(url).then(resolve, reject)
}

function worker() {
    if (!pool.length) {
        const blob = new Blob([parquetTileWorkerSource], { type: 'text/javascript' })
        const url = URL.createObjectURL(blob)
        for (let i = 0; i < WORKERS; i++) {
            const w = new Worker(url)
            w.onerror = onWorkerFailure
            w.onmessage = (event) => {
                const msg = event.data
                const request = requests.get(msg.id)
                requests.delete(msg.id)
                if (!request) return
                if (msg.error) request.reject(Object.assign(new Error(msg.error), { status: msg.status }))
                else request.resolve(msg)
            }
            pool.push(w)
        }
    }
    nextWorker = (nextWorker + 1) % pool.length
    return pool[nextWorker]
}

async function fetchOnMainThread(url) {
    const response = await fetch(url)
    // no file for the tile: there is nothing in that place
    if (response.status === 404) return { length: 0 }
    if (!response.ok) throw Object.assign(new Error('Tile request failed: ' + response.status + ' ' + url), { status: response.status })
    return readParquetTable(await response.arrayBuffer())
}

/**
 * Fetches and decodes a tile.
 * @param {string} url
 * @returns {Promise<{names?:Array.<string>, types?:Array.<string>, columns?:Array.<Float64Array|Array>, length:number}>} no rows for a tile that has no file. Rejected for any other failure, with the status of the answer if there was one.
 */
export function fetchTable(url) {
    if (workersFailed) return fetchOnMainThread(url)
    // a worker has its own base address: nothing relative
    const absolute = new URL(url, document.baseURI).href
    return new Promise((resolve, reject) => {
        const id = nextRequest++
        requests.set(id, { url: absolute, resolve, reject })
        try {
            worker().postMessage({ id, url: absolute })
        } catch (error) {
            onWorkerFailure()
        }
    })
}

/** @type {Array.<any>} */
const queue = []
let pumping = false

function nextSlice() {
    if (typeof requestAnimationFrame === 'undefined') return setTimeout(pump, 0)
    // on the next frame, or after a moment where there are no frames (a browser stops them in a window that is hidden): the tiles still come in
    let done = false
    const go = () => {
        if (done) return
        done = true
        pump()
    }
    requestAnimationFrame(go)
    setTimeout(go, 100)
}

function pump() {
    const deadline = performance.now() + SLICE_MS
    while (queue.length && performance.now() < deadline) {
        const job = queue[0]
        const { names, columns, length } = job.table
        const stop = Math.min(length, job.i + CELLS_BETWEEN_CHECKS)
        for (; job.i < stop; job.i++) {
            /** @type {any} */
            const cell = {}
            for (let k = 0; k < names.length; k++) cell[names[k]] = columns[k][job.i]
            if (job.preprocess && job.preprocess(cell) == false) continue
            job.cells.push(cell)
        }
        if (job.i >= length) {
            queue.shift()
            job.resolve(job.cells)
        }
    }
    if (queue.length) nextSlice()
    else pumping = false
}

/**
 * The cells of a table, as objects, made a little on each frame.
 * @param {{names?:Array.<string>, columns?:Array.<Float64Array|Array>, length:number}} table
 * @param {function(object):boolean|void} [preprocess] leaves out a cell by returning false
 * @returns {Promise<Array.<any>>}
 */
export function cellsOfTable(table, preprocess) {
    if (!table.length) return Promise.resolve([])
    return new Promise((resolve) => {
        queue.push({ table, preprocess, resolve, i: 0, cells: [] })
        if (!pumping) {
            pumping = true
            nextSlice()
        }
    })
}
