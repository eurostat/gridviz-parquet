//@ts-check
'use strict'

export { ParquetGrid } from "./ParquetGrid.js"


import { Dataset } from 'gridviz'
import { ParquetGrid } from "./ParquetGrid.js"

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
 *
* @param {object} app The gridviz application.
 * @param {Array.<number>} resolutions
 * @param {function(number):string} resToURL
* @param {Array.<object>} styles The styles, ordered in drawing order.
 * @param {object=} opts The parameters of the dataset and layer.
 * @returns {this}
 */
export const addMultiScaleParquetGridLayer = function (app, resolutions, resToURL, styles, opts) {
    const ds = Dataset.make(
        resolutions,
        (res) =>
            new ParquetGrid(resToURL(res), res, opts).getData(undefined, () => {
                app.cg.redraw()
            }),
        opts
    )
    return app.addLayerFromDataset(ds, styles, opts)
}


/*
export const addParquetMultiScaleTiledGridLayer(app, resolutions, resToURL, styles, opts) {
    //TODO do like for CSV case
    //const ds = new Dataset([new ParquetGrid(url, resolution, opts).getData(undefined, () => { app.cg.redraw(); })], [], opts)
    //return app.addLayerFromDataset(ds, styles, opts)
}
*/



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





/**
 * Make a multi scale parquet grid dataset.
 *
 * @param {Array.<number>} resolutions
 * @param {function(number):string} resToURL
 * @param {{preprocess?:function(import('./Dataset').Cell):boolean}} opts
 * @returns {Dataset}
 */
/*makeMultiScaleParquetGridDataset(resolutions, resToURL, opts) {
    return Dataset.make(
        resolutions,
        (res) => new ParquetGrid(resToURL(res), res, opts).getData(undefined, () => { this.cg.redraw(); }),
        opts
    )
}*/






/**
 * Add a layer from a parquet grid dataset.
 *
 * @param {Array.<number>} resolutions
 * @param {function(number):string} resToURL
 * @param {Array.<import('./Style').Style>} styles The styles, ordered in drawing order.
 * @param {object=} opts The parameters of the dataset and layer.
 * @returns {this}
 */
/*addMultiScaleParquetGridLayer(resolutions, resToURL, styles, opts) {
    const ds = this.makeMultiScaleParquetGridDataset(resolutions, resToURL, opts)
    return this.addLayerFromDataset(ds, styles, opts);
}*/
