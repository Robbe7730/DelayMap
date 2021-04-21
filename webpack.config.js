/* eslint-disable */

const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'development',
    entry: "./src/delaymap.ts",
    output: {
        filename: "delaymap.js",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"]
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
          { from: "src/index.html", to: "" },
          { from: "src/style.css", to: "" },
        ],
      }),
    ],
}
