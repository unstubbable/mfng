import esbuild from 'esbuild';
import {buildOptions} from './build-options.js';

console.log(`Building dev server handler`);

await esbuild.build(buildOptions);
