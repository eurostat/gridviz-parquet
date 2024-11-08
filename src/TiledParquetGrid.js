//@ts-check
'use strict'

/** @typedef {{ dims: object, crs: string, tileSizeCell: number, originPoint: {x:number,y:number}, resolutionGeo: number, tilingBounds:object, format:object }} GridInfo */

import { Dataset } from 'gridviz'
import { parquetRead, parquetMetadata } from 'hyparquet'
import { json } from 'd3-fetch'

export class TiledParquetGrid extends Dataset {

    constructor(map, url, opts = {}) {
        super(map, url, 0, opts)

        /**  @type {string}  */
        this.extension = opts.extension || "parquet"

        /**
         * The grid info object, from the info.json file.
         *  @type {GridInfo | undefined}
         * @private
         *  */
        this.info = undefined

        /**
         * @type {string}
         * @private  */
        this.infoLoadingStatus = 'notLoaded'

        //name of the attributes, and type (number/string)
        this.names = undefined
        this.types = undefined

        /**
         * The cache of the loaded tiles. It is double indexed: by xT and then yT.
         * Example: this.cache[xT][yT] returns the tile at [xT][yT] location.
         *
         * @type {object}
         * */
        this.cache = {}

        //launch loading
        this.loadInfo()
    }

    /**
     * Load the info.json from the url.
     * @returns this
     */
    loadInfo() {
        if (!this.info && this.infoLoadingStatus === 'notLoaded') {
            ; (async () => {
                try {
                    const data = await json(this.url + 'info.json')
                    this.info = data
                    this.resolution = data.resolutionGeo
                    this.infoLoadingStatus = 'loaded'
                    this.map.redraw()
                } catch (error) {
                    //mark as failed
                    this.infoLoadingStatus = 'failed'
                }
            })()
        } else if ((this.infoLoadingStatus === 'loaded' || this.infoLoadingStatus === 'failed'))
            this.map.redraw()
        return this
    }

    /**
     * Compute a tiling envelope from a geographical envelope.
     * This is the function to use to know which tiles to download for a geographical view.
     */
    getTilingEnvelope(e) {
        if (!this.info) {
            this.loadInfo()
            return
        }

        const po = this.info.originPoint,
            r = this.info.resolutionGeo,
            s = this.info.tileSizeCell

        return {
            xMin: Math.floor((e.xMin - po.x) / (r * s)),
            xMax: Math.floor((e.xMax - po.x) / (r * s)),
            yMin: Math.floor((e.yMin - po.y) / (r * s)),
            yMax: Math.floor((e.yMax - po.y) / (r * s)),
        }
    }

    /**
     * Request data within a geographic envelope.
     */
    getData(extGeo) {
        //TODO empty cache when it gets too big ?

        //check if info has been loaded
        if (!this.info) return this

        //tiles within the scope
        const tb = this.getTilingEnvelope(extGeo)
        if (!tb) return this

        //grid bounds
        const gb = this.info.tilingBounds

        for (let xT = Math.max(tb.xMin, gb.xMin); xT <= Math.min(tb.xMax, gb.xMax); xT++) {
            for (let yT = Math.max(tb.yMin, gb.yMin); yT <= Math.min(tb.yMax, gb.yMax); yT++) {
                //prepare cache
                if (!this.cache[xT]) this.cache[xT] = {}

                //check if tile exists in the cache
                /** @type {object} */
                let tile = this.cache[xT][yT]
                if (tile) continue

                //mark tile as loading
                this.cache[xT][yT] = "loading";
                (async () => {
                    //request tile
                    let cells

                    try {

                        const url = this.url + xT + '/' + yT + '.' + this.extension
                        const res = await fetch(url)
                        const arrayBuffer = await res.arrayBuffer()
                        await parquetRead({
                            file: arrayBuffer,
                            onComplete: data => {
                                //decode header to get attribut names and types
                                //do it only once, since it is the same for all tiles
                                if(!this.names && !this.types) {
                                    let schema = parquetMetadata(arrayBuffer).schema
                                    this.names = [], this.types = []
                                    for (let i = 1; i < schema.length; i++) {
                                        this.names.push(schema[i].name)
                                        const type = schema[i].type + ""
                                        const type_ = type.includes("INT") || type == "FLOAT" || type == "DOUBLE" ?"number" : "string"
                                        this.types.push(type_)
                                    }
                                }

                                //format data
                                data = data.map(d => {
                                    const out = {}
                                    for (let i = 0; i < this.names.length; i++) {
                                        let value = d[i]

                                        //null value
                                        if(value == null || value == undefined) { out[this.names[i]] = value; continue }
        
                                        //parse by type
                                        if(this.types[i] == "number") value = Number(d[i]); else value = value + ""
                                        out[this.names[i]] = value
                                    }
                                    return out
                                })

                                //preprocess/filter
                                if (this.preprocess) {
                                    cells = []
                                    for (const c of data) {
                                        const b = this.preprocess(c)
                                        if (b == false) continue
                                        cells.push(c)
                                    }
                                } else {
                                    cells = data
                                }
                            }
                        })

                    } catch (error) {
                        //mark as failed
                        this.cache[xT][yT] = 'failed'
                        return
                    }

                    //store tile in cache
                    if (!this.info) {
                        console.error('Tile info inknown')
                        return
                    }
                    const tile_ = getGridTile(cells, xT, yT, this.info)
                    this.cache[xT][yT] = tile_

                    //if (monitor) monitorDuration('storage')

                    //if no redraw is specified, then leave
                    this.map.redraw()

                    //check if redraw is really needed, that is if:

                    // 1. the dataset belongs to a layer which is visible at the current zoom level
                    let redraw = false
                    //go through the layers
                    const z = this.map.getZoom()
                    for (const lay of this.map.layers) {
                        if (lay.visible && !lay.visible(z)) continue
                        if (!lay.getDataset) continue
                        if (lay.getDataset(z) != this) continue
                        //found one layer. No need to seek more.
                        redraw = true
                        break
                    }
                    //if (monitor) monitorDuration('check redraw 1')

                    if (!redraw) return

                    // 2. the tile is within the view, that is its geo envelope intersects the viewer geo envelope.
                    const env = this.map.updateExtentGeo()
                    const envT = tile_.extGeo
                    if (env.xMax <= envT.xMin) return
                    if (env.xMin >= envT.xMax) return
                    if (env.yMax <= envT.yMin) return
                    if (env.yMin >= envT.yMax) return

                    //if (monitor) monitorDuration('check redraw 2')
                    //if (monitor) monitorDuration('*** TiledGrid parse end')

                    //redraw
                    this.map.redraw()
                })()
            }
        }
        return this
    }

    /**
     * Fill the view cache with all cells which are within a geographical envelope.
     */
    updateViewCache(extGeo) {
        //
        this.cellsViewCache = []

        //check if info has been loaded
        if (!this.info) return

        //tiles within the scope
        const tb = this.getTilingEnvelope(extGeo)
        if (!tb) return

        //grid bounds
        const gb = this.info.tilingBounds

        for (let xT = Math.max(tb.xMin, gb.xMin); xT <= Math.min(tb.xMax, gb.xMax); xT++) {
            if (!this.cache[xT]) continue
            for (let yT = Math.max(tb.yMin, gb.yMin); yT <= Math.min(tb.yMax, gb.yMax); yT++) {
                //get tile
                /** @type {object} */
                const tile = this.cache[xT][yT]
                if (!tile || typeof tile === 'string') continue

                //get cells
                //this.cellsViewCache = this.cellsViewCache.concat(tile.cells)

                for (const cell of tile.cells) {
                    if (+cell.x + this.resolution < extGeo.xMin) continue
                    if (+cell.x - this.resolution > extGeo.xMax) continue
                    if (+cell.y + this.resolution < extGeo.yMin) continue
                    if (+cell.y - this.resolution > extGeo.yMax) continue
                    this.cellsViewCache.push(cell)
                }
            }
        }
    }
}

function getGridTile(cells, xT, yT, gridInfo) {

    const tile = {}

    tile.cells = cells
    /** @type {number} */
    tile.x = xT
    /** @type {number} */
    tile.y = yT

    const r = gridInfo.resolutionGeo
    const s = gridInfo.tileSizeCell

    tile.extGeo = {
        xMin: gridInfo.originPoint.x + r * s * tile.x,
        xMax: gridInfo.originPoint.x + r * s * (tile.x + 1),
        yMin: gridInfo.originPoint.y + r * s * tile.y,
        yMax: gridInfo.originPoint.y + r * s * (tile.y + 1),
    }

    //convert cell coordinates into geographical coordinates
    for (let cell of tile.cells) {
        cell.x = tile.extGeo.xMin + cell.x * r
        cell.y = tile.extGeo.yMin + cell.y * r
    }

    return tile
}
