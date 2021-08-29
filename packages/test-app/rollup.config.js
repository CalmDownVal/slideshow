import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import deleteBeforeBuild from 'rollup-plugin-delete';
import livereload from 'rollup-plugin-livereload';
import serve from 'rollup-plugin-serve';

// eslint-disable-next-line import/no-default-export
export default {
	input: './src/index.ts',
	output: {
		file: './build/bundle.js',
		format: 'iife',
		sourcemap: true
	},
	plugins: [
		deleteBeforeBuild(),
		commonjs(),
		typescript(),
		nodeResolve({
			browser: true
		}),
		serve({
			open: true,
			verbose: true,
			contentBase: [
				'build',
				'static'
			],
			host: 'localhost',
			port: 8080
		}),
		livereload()
	]
};
