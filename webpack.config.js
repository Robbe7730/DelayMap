/* eslint-disable */

const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'development',
    entry: "./src/main.ts",
    output: {
        filename: "delaymap.js",
    },
    resolve: {
        extensions: [".wasm", ".ts", ".tsx", ".mjs", ".cjs", ".js", ".json"],
    },
    module: {
        rules: [
            { test: /\.tsx?$/, use: ["ts-loader"], exclude: /node_modules/ },
        ]
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "static", to: "static" },
          { from: "config/config.json", to: "config.json", noErrorOnMissing: true },
          { from: "src/index.html", to: "" },
          { from: "src/style.css", to: "" },
        ],
      }),
    ],
}
