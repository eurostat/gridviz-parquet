// The worker that fetches and decodes the tiles of a TiledParquetGrid. Bundled with hyparquet into parquetTileWorker.generated.js (npm run build-worker).
import { readParquetTable } from './readParquetTable.js'

self.onmessage = async (event) => {
    const { id, url } = event.data
    try {
        const response = await fetch(url)
        // no file for the tile: there is nothing in that place
        if (response.status === 404) {
            self.postMessage({ id, length: 0 })
            return
        }
        if (!response.ok) {
            self.postMessage({ id, error: 'Tile request failed: ' + response.status + ' ' + url, status: response.status })
            return
        }
        const table = await readParquetTable(await response.arrayBuffer())
        const transfer = table.columns.filter((column) => column instanceof Float64Array).map((column) => column.buffer)
        self.postMessage({ id, ...table }, transfer)
    } catch (error) {
        self.postMessage({ id, error: String((error && error.message) || error) })
    }
}
