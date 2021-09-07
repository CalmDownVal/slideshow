import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import deleteBeforeBuild from 'rollup-plugin-delete';
import livereload from 'rollup-plugin-livereload';
import postcss from 'rollup-plugin-postcss';
import serve from 'rollup-plugin-serve';

// eslint-disable-next-line import/no-default-export
export default {
	input: './src/index.tsx',
	output: {
		file: './build/bundle.js',
		format: 'iife',
		sourcemap: true
	},
	plugins: [
		deleteBeforeBuild(),
		postcss({
			extract: 'style.css'
		}),
		commonjs(),
		typescript(),
		nodeResolve({
			browser: true
		}),
		replace({
			'process.env.NODE_ENV': "'development'",
			'preventAssignment': true
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
