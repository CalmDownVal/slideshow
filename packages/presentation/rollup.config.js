import typescript from '@rollup/plugin-typescript';
import deleteBeforeBuild from 'rollup-plugin-delete';
import definitions from 'rollup-plugin-dts';
import externals from 'rollup-plugin-node-externals';
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
			externals({
				peerDeps: true
			})
		]
	},
	{
		input: './src/index.ts',
		output: {
			file: `./build/index.d.ts`,
			format: 'es'
		},
		plugins: [
			typescript(),
			definitions()
		]
	}
];
