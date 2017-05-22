var utils = require('./utils')
var webpack = require('webpack')
var config = require('../config')
var merge = require('webpack-merge')
var path=require('path')
var baseWebpackConfig = require('./webpack.base.conf')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var autoprefixer=require('autoprefixer');

// add hot-reload related code to entry chunks
Object.keys(baseWebpackConfig.entry).forEach(function (name) {
  baseWebpackConfig.entry[name] = ['./build/dev-client'].concat(baseWebpackConfig.entry[name])
})

var webpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap,extract: true})
  },
  // cheap-module-eval-source-map is faster for development
  devtool: '#cheap-module-eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': config.dev.env
    }),
     // extract css into its own file
    new ExtractTextPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css')
    }),
    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new FriendlyErrorsPlugin()
  ]
})


if(config.build.pages){
  Object.keys(config.build.pages).forEach((pageItem)=>{
       webpackConfig.plugins.push(new HtmlWebpackPlugin({
          filename: path.resolve('./dist/'+pageItem+'.html'),
          template: './src/pages/'+pageItem+'/template/main.jade',
          inject: true,
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true
            // more options:
            // https://github.com/kangax/html-minifier#options-quick-reference
          },
          chunks:['vendor',pageItem],
          // necessary to consistently work with multiple chunks via CommonsChunkPlugin
          chunksSortMode: function(){
            return 1;
          }
      })
    );
  });
}
module.exports=webpackConfig;