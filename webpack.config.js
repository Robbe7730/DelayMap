/* eslint-disable */

module.exports = {
    mode: 'development',
    entry: "./src/delaymap.ts",
    output: {
        filename: "bundle.js",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"]
    },
    module: {
        rules: [
            { test: /\.tsx?$/, use: ["ts-loader"], exclude: /node_modules/ },
        ]
    }
}
