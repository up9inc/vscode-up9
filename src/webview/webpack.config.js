const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

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
            "process": require.resolve("process")
        },
    },
    module: {
        rules: [{
                test: /\.tsx?$/,
                exclude: /node_modules|dist|\.js$|\.d\.ts$/,
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
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,
            include: /src/,
            failOnError: true,
            allowAsyncCycles: false,
            cwd: process.cwd(),
          }),
        new webpack.ProvidePlugin({
            process: 'process',
          }),
        new MiniCssExtractPlugin({
            filename: "main.css",
            chunkFilename: "mainc.css"
        }),
        htmlWebpackPlugin,
        //new HTMLInlineCSSWebpackPlugin(), // This plugin stops reload in the dev 
        new InlineChunkHtmlPlugin(HtmlWebPackPlugin, [/runtime~.+[.]tsx/]),
    ]
};