const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const process = require("process/browser");

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
            "process": require.resolve('process')
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
        new webpack.ProvidePlugin({
            process: 'process/browser.js'
        }),
        new MiniCssExtractPlugin({
            filename: "main.css",
            chunkFilename: "mainc.css"
        }),
        htmlWebpackPlugin,
        // // the next configurationdoesn't work in development, but works in build
        new HTMLInlineCSSWebpackPlugin(),
        new InlineChunkHtmlPlugin(HtmlWebPackPlugin, [/bundle/]),

        // // this configuration works in development regarding style and css refreshes
        // new HTMLInlineCSSWebpackPlugin({
        //     filter: (filename) => false
        // }),
        // new InlineChunkHtmlPlugin(HtmlWebPackPlugin, [/runtime/])
    ]
};