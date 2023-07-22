//@ts-check
'use strict'

export { ParquetGrid } from "./ParquetGrid.js"
export { TiledParquetGrid } from "./TiledParquetGrid.js"

import { Dataset } from 'gridviz'
import { ParquetGrid } from "./ParquetGrid.js"
import { TiledParquetGrid } from "./TiledParquetGrid.js"

/**
* Add a layer from a parquet grid dataset.
*
* @param {object} app The gridviz application.
* @param {string} url The URL of the dataset.
* @param {number} resolution The dataset resolution in geographical unit.
* @param {Array.<object>} styles The styles, ordered in drawing order.
* @param {object=} opts The parameters of the dataset and layer.
* @returns {object}
*/
export const addParquetGridLayer = function (app, url, resolution, styles, opts) {
    const ds = new Dataset([new ParquetGrid(url, resolution, opts).getData(undefined, () => { app.cg.redraw(); })], [], opts)
    return app.addLayerFromDataset(ds, styles, opts);
}


/**
* @param {object} app The gridviz application.
 * @param {Array.<number>} resolutions
 * @param {function(number):string} resToURL
* @param {Array.<object>} styles The styles, ordered in drawing order.
 * @param {object=} opts The parameters of the dataset and layer.
 * @returns {object}
 */
export const addMultiScaleParquetGridLayer = function (app, resolutions, resToURL, styles, opts) {
    const ds = Dataset.make(
        resolutions,
        (res) => new ParquetGrid(resToURL(res), res, opts).getData(undefined, () => { app.cg.redraw() }),
        opts
    )
    return app.addLayerFromDataset(ds, styles, opts)
}


/**
* @param {object} app The gridviz application.
 * @param {string} url
* @param {Array.<object>} styles The styles, ordered in drawing order.
 * @param {{visible?:boolean,minZoom?:number,maxZoom?:number,pixNb?:number,cellInfoHTML?:function(object):string, preprocess?:function(object):boolean}} opts
 * @returns {object}
 */
export const addTiledParquetGridLayer = function (app, url, styles, opts) {
    const ds = new Dataset(
        [new TiledParquetGrid(url, app, opts).loadInfo(() => { app.cg.redraw() }),],
        [],
        opts
    )
    return app.addLayerFromDataset(ds, styles, opts)
}


/**
* @param {object} app The gridviz application.
 * @param {Array.<number>} resolutions
 * @param {function(number):string} resToURL
* @param {Array.<object>} styles The styles, ordered in drawing order.
 * @param {object=} opts The parameters of the dataset and layer.
 * @returns {object}
 */
export const addMultiScaleTiledParquetGridLayer = function (app, resolutions, resToURL, styles, opts) {
    const ds = Dataset.make(
        resolutions,
        (res) => new TiledParquetGrid(resToURL(res), app, opts).loadInfo(() => { app.cg.redraw() }),
        opts
    )
    return app.addLayerFromDataset(ds, styles, opts)
}






//test utilisation of that:
//<script src="https://unpkg.com/parquet-wasm@0.4.0-beta.5/esm/arrow2.js"></script>


/**
 * Retrieve parquet wasm decoder
 */
/*
const getReadParquetP = ()=> async () => {
    const parquetModule = await import("https://unpkg.com/parquet-wasm@0.4.0-beta.5/esm/arrow2.js");
    await parquetModule.default();
    return parquetModule.readParquet;
}
*/


