// Bundles the tile worker with hyparquet into a string the library can start a worker from: src/parquetTileWorker.generated.js
const fs = require('fs')
const os = require('os')
const path = require('path')
const webpack = require('webpack')

const root = path.resolve(__dirname, '..')
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gridviz-parquet-worker-'))

webpack(
    {
        mode: 'production',
        target: 'webworker',
        entry: path.join(root, 'src/parquetTileWorker.js'),
        output: { path: out, filename: 'worker.js' },
        devtool: false,
        performance: { hints: false },
        optimization: { minimize: true },
    },
    (error, stats) => {
        if (error || stats.hasErrors()) {
            console.error(error || stats.toString('errors-only'))
            process.exit(1)
        }
        const source = fs.readFileSync(path.join(out, 'worker.js'), 'utf8')
        fs.rmSync(out, { recursive: true, force: true })
        const header = '// Generated from parquetTileWorker.js by scripts/build-worker.cjs: npm run build-worker. Do not edit.\n'
        fs.writeFileSync(path.join(root, 'src/parquetTileWorker.generated.js'), header + 'export const parquetTileWorkerSource = ' + JSON.stringify(source) + '\n')
        console.log('worker bundled:', Math.round(source.length / 1024), 'KB')
    }
)
