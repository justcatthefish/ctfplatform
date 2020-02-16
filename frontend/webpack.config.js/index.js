const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");
const TsConfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');

const config = {
    entry: {
        desktop: "./src/index.tsx",
    },
    //
    // output: {
    //     filename: "bundle.js",
    //     path: __dirname + "/dist"
    // },

    // output: {
    //     path: __dirname + "/dist",
    //     filename: `[name]${!IS_DEV ? '.[hash].min' : ''}.js`,
    //     // publicPath: paths.publicPath,
    //     chunkFilename: `${IS_DEV ? '[name].' : ''}[chunkhash]${!IS_DEV ? '.min' : ''}.js`,
    // },

    output: {
        path: path.join(__dirname, '..', 'dist'),
        filename: `[name].[hash].js`,
        publicPath: '/static/',
        chunkFilename: `[name].[chunkhash].js`,
    },

    devServer: {
        contentBase: "./public",
        compress: true,
        port: 9000,
        historyApiFallback: true
    },

    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: "./public/index.html"
        }),
        new MiniCSSExtractPlugin({
            filename: "[name].[hash].css",
            chunkFilename: "[id].[hash].css"
        }),
        new CopyPlugin([
            { from: './public/favicons', to: 'favicons' },
        ]),
    ],

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],
        plugins: [
            new TsConfigPathsPlugin({configFile: path.join(__dirname, '..', 'tsconfig.json')}),
        ]
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    { loader: MiniCSSExtractPlugin.loader },
                    { loader: "css-loader" },
                    { loader: "sass-loader" }
                ]
            },
            {
                loader: "file-loader",
                exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/, /\.scss$/, /\.css$/ ],
                options: {
                    name: 'media/[hash].[ext]',
                },
            },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ]
    },

    // // When importing a module whose path matches one of the following, just
    // // assume a corresponding global variable exists and use that instead.
    // // This is important because it allows us to avoid bundling all of our
    // // dependencies, which allows browsers to cache those libraries between builds.
    // externals: {
    //     "react": "React",
    //     "react-dom": "ReactDOM"
    // }

    optimization: {
        namedModules: true,
        noEmitOnErrors: true,
        splitChunks: {
            cacheGroups: {
                vendors: {
                    test(module) {
                        return /[\\/]node_modules[\\/]/.test(module.context);
                    },
                    name: 'vendors',
                    chunks: 'all',
                    priority: -10,
                    enforce: true,
                },
            },
        }
    }
};

module.exports = (env, argv) => {
    const IS_DEV = argv.mode === 'development';
    const plugins = [];

    plugins.push(new webpack.DefinePlugin({
        __IS_DEV__: IS_DEV ? 'true' : 'false',
    }));

    config.plugins = config.plugins.concat(plugins);

    return config;
};
