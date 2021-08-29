import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import deleteBeforeBuild from 'rollup-plugin-delete';
import definitions from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';

const codeOutputOpts = {
	exports: 'named',
	sourcemap: true,
	plugins: [
		terser({
			output: {
				comments: false
			}
		})
	]
};

// eslint-disable-next-line import/no-default-export
export default [
	{
		input: './src/index.ts',
		output: [
			{
				...codeOutputOpts,
				file: './build/index.cjs.min.js',
				format: 'cjs'
			},
			{
				...codeOutputOpts,
				file: './build/index.esm.min.js',
				format: 'esm'
			}
		],
		plugins: [
			deleteBeforeBuild({ targets: './build/*' }),
			typescript(),
			nodeResolve({
				browser: true
			})
		]
	},
	{
		input: './src/index.ts',
		output: {
			file: `./build/index.d.ts`,
			format: 'es'
		},
		plugins: [ definitions() ]
	}
];
