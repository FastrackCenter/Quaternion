const path = require('path');
const webpack = require('webpack');

module.exports = {
	entry: [
		'./src/quaternion.js'
	],
	output: {
		library: 'Quaternion',
		path: path.join(__dirname, 'lib'),
		filename: 'quaternion.js'
	},
	plugins: [
		new webpack.optimize.OccurrenceOrderPlugin()
	],
	module: {
		loaders: [
			{
				test: /\.js$/,
				loaders: [ 'babel-loader' ],
				exclude: /node_modules/,
				include: __dirname
			}
		],
	}
}
