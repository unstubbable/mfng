import {createRequire} from 'module';
import path from 'path';
import url from 'url';
import MemoryFS from 'memory-fs';
import prettier from 'prettier';
import webpack from 'webpack';
import type {ServerReferencesMap} from './webpack-rsc-client-loader.cjs';
import {WebpackRscServerPlugin} from './webpack-rsc-server-plugin.js';

const fs = new MemoryFS();
const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function pretty(source: string): string {
  return prettier.format(source, {parser: `babel`});
}

async function runWebpack(config: webpack.Configuration): Promise<void> {
  return new Promise((resolve, reject) => {
    const compiler = webpack(config);

    compiler.outputFileSystem = fs;

    compiler.run((err, stats) => {
      if (err) {
        console.error(err);
        reject(err);
      }

      if (stats) {
        const info = stats.toJson();

        if (stats.hasErrors()) {
          console.error(info.errors);
          reject(info.errors);
        }

        if (stats.hasWarnings()) {
          console.warn(info.warnings);
        }

        resolve();
      }
    });
  });
}

describe(`WebpackRscServerPlugin`, () => {
  let buildConfig: webpack.Configuration;
  let serverReferencesMap: ServerReferencesMap;

  beforeEach(() => {
    serverReferencesMap = new Map();

    buildConfig = {
      entry: path.resolve(currentDirname, `__fixtures__/main.js`),
      output: {
        path: path.resolve(currentDirname, `dist`),
        filename: `bundle.js`,
        libraryTarget: `module`,
        chunkFormat: `module`,
      },
      experiments: {outputModule: true},
      module: {
        rules: [
          {
            test: /\.js$/,
            loader: require.resolve(`./webpack-rsc-server-loader`),
          },
        ],
      },
      plugins: [
        new WebpackRscServerPlugin({
          clientReferencesMap: new Map(),
          serverReferencesMap,
        }),
      ],
      resolve: {
        conditionNames: [`react-server`, `node`, `import`, `require`],
      },
      devtool: false,
    };
  });

  describe(`in development mode`, () => {
    beforeEach(() => {
      buildConfig = {...buildConfig, mode: `development`};
    });

    test(`the generated bundle has replacement code for server references`, async () => {
      await runWebpack(buildConfig);

      const outputFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(outputFile).toMatch(
        `
/***/ "(react-server)/./packages/webpack-rsc/src/__fixtures__/server-function.js":
/*!******************************************************************!*\\
  !*** ./packages/webpack-rsc/src/__fixtures__/server-function.js ***!
  \\******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "serverFunction": () => (/* binding */ serverFunction)
/* harmony export */ });
'use server';

async function serverFunction() {
  return Promise.resolve(\`server\`);
}

Object.defineProperties(serverFunction, {
	$$typeof: {value: Symbol.for("react.server.reference")},
	$$id: {value: "(react-server)/./packages/webpack-rsc/src/__fixtures__/server-function.js#serverFunction"},
});

/***/ })`,
      );
    });

    test(`creates a server references manifest`, async () => {
      await runWebpack(buildConfig);

      const manifestFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/react-server-manifest.json`),
        `utf-8`,
      );

      expect(JSON.parse(manifestFile)).toEqual({
        '(react-server)/./packages/webpack-rsc/src/__fixtures__/server-function.js':
          [`serverFunction`],
      });
    });

    test(`populates the given serverReferencesMap`, async () => {
      await runWebpack(buildConfig);

      expect([...serverReferencesMap.entries()]).toEqual([
        [
          path.resolve(currentDirname, `./__fixtures__/server-function.js`),
          {
            moduleId: `(react-server)/./packages/webpack-rsc/src/__fixtures__/server-function.js`,
            exportNames: [`serverFunction`],
          },
        ],
      ]);
    });
  });

  describe(`in production mode`, () => {
    let expectedModuleId: number;

    beforeEach(() => {
      buildConfig = {...buildConfig, mode: `production`};
      expectedModuleId = 340; // may change in the future
    });

    test(`the generated bundle has replacement code for server references`, async () => {
      await runWebpack(buildConfig);

      const outputFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(pretty(outputFile)).toMatch(
        `
    ${expectedModuleId}: (e, t, r) => {
      async function o() {
        return Promise.resolve(\"server\");
      }
      r.r(t),
        r.d(t, { serverFunction: () => o }),
        Object.defineProperties(o, {
          $$typeof: { value: Symbol.for(\"react.server.reference\") },
          $$id: { value: \"340#serverFunction\" },
        });
    },`,
      );
    });

    test(`creates a server references manifest`, async () => {
      await runWebpack(buildConfig);

      const manifestFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/react-server-manifest.json`),
        `utf-8`,
      );

      expect(JSON.parse(manifestFile)).toEqual({
        [expectedModuleId]: [`serverFunction`],
      });
    });

    test(`populates the given serverReferencesMap`, async () => {
      await runWebpack(buildConfig);

      expect([...serverReferencesMap.entries()]).toEqual([
        [
          path.resolve(currentDirname, `./__fixtures__/server-function.js`),
          {moduleId: expectedModuleId, exportNames: [`serverFunction`]},
        ],
      ]);
    });
  });
});
