//@ts-check
'use strict'

export { ParquetGrid } from "./ParquetGrid.js"
//export { TiledParquetGrid } from "./TiledParquetGrid.js"
/*
import { Dataset } from 'gridviz'
import { ParquetGrid } from "./ParquetGrid.js"
import { TiledParquetGrid } from "./TiledParquetGrid.js"

//import { readParquet } from "parquet-wasm"
//import { readParquet } from "parquet-wasm/bundler/arrow1.js";
//import { readParquet } from "parquet-wasm/node2";



/*
export const makeParquetGridDataset = function (app, url, resolution, opts) {
    return new Dataset([new ParquetGrid(url, resolution, opts).getData(undefined, () => { app.cg.redraw(); })], [], opts)
}

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
/*export const addParquetGridLayer = function (app, url, resolution, styles, opts) {
    const ds = makeParquetGridDataset(app, url, resolution, opts)
    return app.addLayerFromDataset(ds, styles, opts);
}*/






/*
export const makeMultiScaleParquetGridDataset = function (app, resolutions, resToURL, opts) {
    return Dataset.make(
        resolutions,
        (res) => new ParquetGrid(resToURL(res), res, opts).getData(undefined, () => { app.cg.redraw() }),
        opts
    )
}

/**
* @param {object} app The gridviz application.
 * @param {Array.<number>} resolutions
 * @param {function(number):string} resToURL
* @param {Array.<object>} styles The styles, ordered in drawing order.
 * @param {object=} opts The parameters of the dataset and layer.
 * @returns {object}
 */
/*export const addMultiScaleParquetGridLayer = function (app, resolutions, resToURL, styles, opts) {
    const ds = makeMultiScaleParquetGridDataset(app, resolutions, resToURL, opts)
    return app.addLayerFromDataset(ds, styles, opts)
}






export const makeTiledParquetGridDataset = function (app, url, opts) {
    return new Dataset(
        [new TiledParquetGrid(url, app, opts).loadInfo(() => { app.cg.redraw() }),],
        [],
        opts
    )
}

/**
* @param {object} app The gridviz application.
 * @param {string} url
* @param {Array.<object>} styles The styles, ordered in drawing order.
 * @param {{visible?:boolean,minZoom?:number,maxZoom?:number,pixNb?:number,cellInfoHTML?:function(object):string, preprocess?:function(object):boolean}} opts
 * @returns {object}
 */
/*export const addTiledParquetGridLayer = function (app, url, styles, opts) {
    const ds = makeTiledParquetGridDataset(app, url, opts)
    return app.addLayerFromDataset(ds, styles, opts)
}






export const makeMultiScaleTiledParquetGridDataset = function (app, resolutions, resToURL, opts) {
    return Dataset.make(
        resolutions,
        (res) => new TiledParquetGrid(resToURL(res), app, opts).loadInfo(() => { app.cg.redraw() }),
        opts
    )
}

/**
* @param {object} app The gridviz application.
 * @param {Array.<number>} resolutions
 * @param {function(number):string} resToURL
* @param {Array.<object>} styles The styles, ordered in drawing order.
 * @param {object=} opts The parameters of the dataset and layer.
 * @returns {object}
 */
/*export const addMultiScaleTiledParquetGridLayer = function (app, resolutions, resToURL, styles, opts) {
    const ds = makeMultiScaleTiledParquetGridDataset(app, resolutions, resToURL, opts)
    return app.addLayerFromDataset(ds, styles, opts)
}



//test utilisation of that:
//<script src="https://unpkg.com/parquet-wasm@0.4.0-beta.5/esm/arrow2.js"></script>
/*export const loadWasmParquetReader = async () => {
    const parquetModule = await import("parquet-wasm")
    return parquetModule.readParquet
    //await parquetModule.default()
    //return parquetModule.readParquet
}*/


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
