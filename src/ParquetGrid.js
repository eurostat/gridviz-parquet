//@ts-check
'use strict'

import { Dataset } from 'gridviz'
import { parquetMetadata } from 'hyparquet'

export class ParquetGrid extends Dataset {

    constructor(map, url, resolution, opts = {}) {
        super(map, url, resolution, opts)

        /**
         * @private
         * @type {Array.<object>} */
        this.cells = []

        /**
         * @type {string}
         * @private  */
        this.infoLoadingStatus = 'notLoaded'

        //get data
        this.getData(undefined)

    }


    getData(e) {

console.log("aaabjbgjhbghjdb")

        //check if data already loaded
        if (this.infoLoadingStatus != 'notLoaded') return this

        //load data
        this.infoLoadingStatus = 'loading'
            ; (async () => {
                try {

                    console.log("aaaaaa !!!!")

                    /*
                    const res = fetch(this.url)
                    const arrayBuffer = res.arrayBuffer()
                    const metadata = parquetMetadata(arrayBuffer)
                    console.log(metadata)*/
return           

                    //convert coordinates in numbers
                    for (const c of data) {
                        c.x = +c.x
                        c.y = +c.y
                    }

                    //preprocess/filter
                    if (this.preprocess) {
                        this.cells = []
                        for (const c of data) {
                            const b = this.preprocess(c)
                            if (b == false) continue
                            this.cells.push(c)
                        }
                    } else {
                        this.cells = data
                    }

                    //TODO check if redraw is necessary
                    //that is if the dataset belongs to a layer which is visible at the current zoom level

                    //execute the callback, usually a draw function
                    if (this.map) this.map.redraw()

                    this.infoLoadingStatus = 'loaded'
                } catch (error) {
                    //mark as failed
                    this.infoLoadingStatus = 'failed'
                    this.cells = []
                }
            })()

        return this
    }



    updateViewCache(extGeo) {
        //data not loaded yet
        if (!this.cells) return

        this.cellsViewCache = []
        for (const cell of this.cells) {
            if (+cell.x + this.resolution < extGeo.xMin) continue
            if (+cell.x - this.resolution > extGeo.xMax) continue
            if (+cell.y + this.resolution < extGeo.yMin) continue
            if (+cell.y - this.resolution > extGeo.yMax) continue
            this.cellsViewCache.push(cell)
        }
    }
}
