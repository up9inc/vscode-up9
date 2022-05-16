// Stable webpack for development, however it fails to build and preview the plugin
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');

const htmlWebpackPlugin = new HtmlWebPackPlugin({
    template: "./src/index.html",
    filename: "./index.html",
    inlineSource: '.(js|css)$',
    inject: 'body',
});

module.exports = {
    entry: ['./src/index.tsx', './src/main.css'],
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        fallback: {
            "path": require.resolve("path-browserify"),
            "os": require.resolve("os-browserify/browser"),
            "url": require.resolve("url"),
            "tty": require.resolve("tty-browserify"),
            "minimatch": require.resolve("minimatch"),
            "process": require.resolve('process/browser')
        },
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            exclude: /node_modules/,
            loader: 'ts-loader',
            options: {
                configFile: 'tsconfig.json',
            }
        },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader"
                ]
            }
        ],
    },
    output: {
        filename: 'bundle.js',
        publicPath: '',
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "main.css",
            chunkFilename: "mainc.css"
        }),
        htmlWebpackPlugin,
        new HTMLInlineCSSWebpackPlugin({
            filter: (filename) => false
        }),
        new InlineChunkHtmlPlugin(HtmlWebPackPlugin, [/runtime~.+[.]tsx/]),
    ]
};