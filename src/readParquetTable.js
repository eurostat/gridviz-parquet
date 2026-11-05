//@ts-check
'use strict'

import { parquetRead, parquetMetadata } from 'hyparquet'

/**
 * The table of a Parquet file, in columns: numbers in typed arrays where no value is missing.
 * Shared by the worker that decodes tiles and by the main thread, when no worker can run.
 *
 * @param {ArrayBuffer} buffer
 * @returns {Promise<{names:Array.<string>, types:Array.<string>, columns:Array.<Float64Array|Array>, length:number}>}
 */
export async function readParquetTable(buffer) {
    const schema = parquetMetadata(buffer).schema
    const names = []
    const numeric = []
    for (let i = 1; i < schema.length; i++) {
        names.push(schema[i].name)
        const type = schema[i].type + ''
        numeric.push(type.includes('INT') || type == 'FLOAT' || type == 'DOUBLE')
    }

    /** @type {Array.<Array>} */
    let rows = []
    await parquetRead({
        file: buffer,
        onComplete: (data) => {
            rows = /** @type {any} */ (data)
        },
    })

    const length = rows.length
    const columns = names.map((_, k) => {
        if (numeric[k]) {
            const out = new Float64Array(length)
            let missing = false
            for (let i = 0; i < length; i++) {
                const v = rows[i][k]
                if (v === null || v === undefined) {
                    missing = true
                    break
                }
                out[i] = Number(v)
            }
            if (!missing) return out
        }
        return rows.map((row) => {
            const v = row[k]
            if (v === null || v === undefined) return v
            return numeric[k] ? Number(v) : v + ''
        })
    })
    return { names, types: numeric.map((n) => (n ? 'number' : 'string')), columns, length }
}
