import chokidar from 'chokidar';
import esbuild from 'esbuild';
import {buildOptions, clientManifestFilename} from './build-options.js';

console.log(`Building dev server handler`);

const buildContext = await esbuild.context(buildOptions);

const rebuild = async () => {
  try {
    const start = Date.now();
    await buildContext.rebuild();
    console.log(`Built dev server handler in ${Date.now() - start} ms`);
  } catch (error) {
    console.error(error);
  }
};

chokidar.watch(clientManifestFilename).on(`add`, rebuild).on(`change`, rebuild);

process.on(`SIGINT`, async () => {
  console.log(`Disposing dev server build context`);

  try {
    await buildContext.dispose();
    console.log(`Dev server build context disposed`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});
