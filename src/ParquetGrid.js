//@ts-check
'use strict'

import { Dataset } from 'gridviz'
import { parquetRead, parquetMetadata } from 'hyparquet'

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

        //check if data already loaded
        if (this.infoLoadingStatus != 'notLoaded') return this

        //load data
        this.infoLoadingStatus = 'loading'
            ; (async () => {
                try {

                    const res = await fetch(this.url)
                    const arrayBuffer = await res.arrayBuffer()
                    await parquetRead({
                        file: arrayBuffer,
                        onComplete: data => {

                            //decode header
                            let header = parquetMetadata(arrayBuffer).schema
                            const names = [] //, types = []
                            for(let i=1; i<header.length; i++) {
                                names.push(header[i].name)
                                //const type = header[i].type + ""
                                //const type_ = type.includes("INT") || type == "FLOAT" || type == "DOUBLE" ?"number" : "string"
                                //types.push(type_)
                            }

                            //format data
                            const nb = names.length
                            data = data.map(d => {
                                const out = {}
                                for(let i=0; i<nb; i++)
                                    out[names[i]] = d[i]
                                    //out[names[i]] = types[i] == "number"? d[i] : d[i]+""

                                return out
                            })

                            console.log(data)

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
                        }
                    })

                } catch (error) {
                    console.error(error);
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
