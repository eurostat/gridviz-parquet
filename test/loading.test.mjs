import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TiledParquetGrid } from '../src/TiledParquetGrid.js'

const info = {
    originPoint: { x: 100, y: 200 },
    resolutionGeo: 10,
    tileSizeCell: 5,
    tilingBounds: { xMin: 0, xMax: 0, yMin: 0, yMax: 0 },
}

const waitUntil = async (condition) => {
    const deadline = Date.now() + 2000
    while (!condition()) {
        if (Date.now() > deadline) throw new Error('Timed out waiting for grid')
        await new Promise((resolve) => setTimeout(resolve, 5))
    }
}

test('Parquet metadata and worker-enabled tiles report outcomes and preserve the legacy hook', async () => {
    const fetchBefore = globalThis.fetch
    const hookBefore = TiledParquetGrid.onTileRequest
    const failuresBefore = TiledParquetGrid.failuresToEmpty
    const events = []
    let hooks = 0
    let endings = 0
    const map = {
        redraw() {},
        beginGridLoad(request) {
            events.push({ phase: 'start', request })
            return (outcome, error) => events.push({ phase: 'end', request, outcome, error })
        },
    }
    try {
        TiledParquetGrid.failuresToEmpty = 1
        TiledParquetGrid.onTileRequest = () => {
            hooks++
            return () => endings++
        }
        globalThis.fetch = async (url) => {
            if (url.endsWith('info.json')) return new Response(JSON.stringify(info))
            if (url.includes('/missing/')) return new Response(null, { status: 404 })
            throw new TypeError('network failure')
        }
        const missing = new TiledParquetGrid(map, 'http://example/missing/')
        await waitUntil(() => missing.infoLoadingStatus === 'loaded')
        missing.getData({ xMin: 100, xMax: 101, yMin: 200, yMax: 201 })
        await waitUntil(() => events.some((event) => event.outcome === 'missing'))
        const tile = events.find((event) => event.request.kind === 'tile')
        assert.deepEqual(tile.request.extent, { xMin: 100, xMax: 150, yMin: 200, yMax: 250 })
        assert.deepEqual(tile.request.tile, { x: 0, y: 0 })
        assert.equal(tile.request.worker, true)
        assert.equal(events.find((event) => event.outcome === 'missing').request, tile.request)
        assert.equal(hooks, 1)
        assert.equal(endings, 1)

        const failed = new TiledParquetGrid(map, 'http://example/failure/')
        await waitUntil(() => failed.infoLoadingStatus === 'loaded')
        failed.getData({ xMin: 100, xMax: 101, yMin: 200, yMax: 201 })
        await waitUntil(() => events.some((event) => event.outcome === 'error'))
        assert.match(events.find((event) => event.outcome === 'error').error.message, /network failure/)
        assert.equal(hooks, 2)
        assert.equal(endings, 2)

        const legacyMap = { redraw() {} }
        const legacy = new TiledParquetGrid(legacyMap, 'http://example/missing/')
        await waitUntil(() => legacy.infoLoadingStatus === 'loaded')
        legacy.getData({ xMin: 100, xMax: 101, yMin: 200, yMax: 201 })
        await waitUntil(() => endings === 3)
    } finally {
        globalThis.fetch = fetchBefore
        TiledParquetGrid.onTileRequest = hookBefore
        TiledParquetGrid.failuresToEmpty = failuresBefore
    }
})
