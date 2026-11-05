# GridViz Parquet

![npm bundle size](https://img.shields.io/bundlephobia/minzip/gridviz-parquet)
![npm](https://img.shields.io/npm/v/gridviz-parquet)
![license](https://img.shields.io/badge/license-EUPL-success)

[Parquet format](https://parquet.apache.org/) support for [GridViz](https://github.com/eurostat/gridviz/).


- See [this example for a single Parquet file](https://eurostat.github.io/gridviz-parquet/examples/basic_parquet.html) ([code](https://github.com/eurostat/gridviz-parquet/blob/main/examples/basic_parquet.html)).
- See [this example for multiscale Parquet data](https://eurostat.github.io/gridviz-parquet/examples/basic_multiscale_parquet.html) ([code](https://github.com/eurostat/gridviz-parquet/blob/main/examples/basic_multiscale_parquet.html)).
- See [this example for tiled Parquet data](https://eurostat.github.io/gridviz-parquet/examples/basic_tiled_parquet.html) ([code](https://github.com/eurostat/gridviz-parquet/blob/main/examples/basic_tiled_parquet.html)).
- See [this example for both tiled and multiscale Parquet data](https://eurostat.github.io/gridviz-parquet/examples/basic_multiscale_tiled_parquet.html) ([code](https://github.com/eurostat/gridviz-parquet/blob/main/examples/basic_multiscale_tiled_parquet.html)).

## Tiles are decoded in workers

The tiles of a `TiledParquetGrid` are fetched and decoded in web workers, and their cells are made a little on each animation frame, so a map being panned does not stand still while a tile comes in. The workers run from a Blob, so nothing needs to be configured or served. Where they cannot run (no `Worker`, a Content Security Policy without `blob:`), tiles are decoded on the main thread.

A worker's requests are not seen by a wrapper of the page's `fetch`. To follow them, for a loading indicator for example:

```javascript
TiledParquetGrid.onTileRequest = (dataset, xT, yT) => {
    showLoading()
    return () => hideLoading() // called when the tile has been answered
}
```

`TiledParquetGrid.failuresToEmpty` (2 by default) is how many failures with no answer from the server make a tile count as empty: some servers send their 404 without a CORS header, and the browser reports it as a failure of the network.

After changing `src/parquetTileWorker.js` or `src/readParquetTable.js`, run `npm run build-worker` (`npm run bp` does it too).
