import path from 'path';
import url from 'url';
import MemoryFS from 'memory-fs';
import prettier from 'prettier';
import webpack from 'webpack';
import type {ServerReferencesMap} from './webpack-rsc-client-loader.cjs';
import type {ClientReferencesMap} from './webpack-rsc-server-loader.cjs';
import {
  WebpackRscServerPlugin,
  webpackRscLayerName,
} from './webpack-rsc-server-plugin.js';
import {
  createWebpackRscServerLoader,
  createWebpackRscSsrLoader,
} from './index.js';

const fs = new MemoryFS();
const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

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
  let clientReferencesMap: ClientReferencesMap;
  let serverReferencesMap: ServerReferencesMap;

  beforeEach(() => {
    clientReferencesMap = new Map();
    serverReferencesMap = new Map();

    buildConfig = {
      entry: path.resolve(currentDirname, `__fixtures__/main.js`),
      output: {
        path: path.resolve(currentDirname, `dist`),
        filename: `bundle.js`,
        libraryTarget: `module`,
        chunkFormat: `module`,
      },
      experiments: {outputModule: true, layers: true},
      module: {
        rules: [
          {
            resource: /rsc.js$/,
            layer: webpackRscLayerName,
          },
          {
            issuerLayer: webpackRscLayerName,
            resolve: {conditionNames: [`react-server`, `workerd`, `...`]},
          },
          {
            test: /\.js$/,
            oneOf: [
              {
                issuerLayer: webpackRscLayerName,
                use: createWebpackRscServerLoader({clientReferencesMap}),
              },
              {
                use: createWebpackRscSsrLoader(),
              },
            ],
          },
        ],
      },
      plugins: [
        new WebpackRscServerPlugin({clientReferencesMap, serverReferencesMap}),
      ],
      devtool: false,
      performance: false,
      cache: false,
    };
  });

  describe(`in development mode`, () => {
    beforeEach(() => {
      buildConfig = {...buildConfig, mode: `development`};
    });

    test(`the generated bundle has stubbed implementations for client-side imported server actions`, async () => {
      await runWebpack(buildConfig);

      const outputFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(outputFile).toMatch(
        `
/***/ "./src/__fixtures__/server-function-imported-from-client.js":
/*!******************************************************************!*\\
  !*** ./src/__fixtures__/server-function-imported-from-client.js ***!
  \\******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "serverFunctionImportedFromClient": () => (/* binding */ serverFunctionImportedFromClient)
/* harmony export */ });
'use server';

function serverFunctionImportedFromClient() {
  throw new Error("Server actions must not be called during server-side rendering.");
}

/***/ })`,
      );
    });

    test(`the generated bundle has registerServerReference calls for server references, with correct local and exported names`, async () => {
      await runWebpack(buildConfig);

      const outputFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(outputFile).toMatch(
        `
/***/ "(react-server)/./src/__fixtures__/server-function-imported-from-client.js":
/*!******************************************************************!*\\
  !*** ./src/__fixtures__/server-function-imported-from-client.js ***!
  \\******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "serverFunctionImportedFromClient": () => (/* binding */ serverFunctionImportedFromClient)
/* harmony export */ });
/* harmony import */ var react_server_dom_webpack_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-server-dom-webpack/server */ "(react-server)/../../node_modules/react-server-dom-webpack/server.edge.js");
'use server';


async function serverFunctionImportedFromClient() {
  return Promise.resolve(\`server-function-imported-from-client\`);
}
(0,react_server_dom_webpack_server__WEBPACK_IMPORTED_MODULE_0__.registerServerReference)(serverFunctionImportedFromClient, module.id, "serverFunctionImportedFromClient");

/***/ }),

/***/ "(react-server)/./src/__fixtures__/server-function-passed-from-server.js":
/*!****************************************************************!*\\
  !*** ./src/__fixtures__/server-function-passed-from-server.js ***!
  \\****************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "serverFunctionPassedFromServer": () => (/* binding */ serverFunctionPassedFromServer)
/* harmony export */ });
/* harmony import */ var react_server_dom_webpack_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-server-dom-webpack/server */ "(react-server)/../../node_modules/react-server-dom-webpack/server.edge.js");
'use server';


async function serverFunctionPassedFromServer() {
  return Promise.resolve(\`server-function-passed-from-server\`);
}
(0,react_server_dom_webpack_server__WEBPACK_IMPORTED_MODULE_0__.registerServerReference)(serverFunctionPassedFromServer, module.id, "serverFunctionPassedFromServer");

/***/ }),`,
      );
    });

    test(`creates a server references manifest`, async () => {
      await runWebpack(buildConfig);

      const manifestFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/react-server-manifest.json`),
        `utf-8`,
      );

      expect(JSON.parse(manifestFile)).toEqual({
        '(react-server)/./src/__fixtures__/server-function-imported-from-client.js#serverFunctionImportedFromClient':
          {
            chunks: [],
            id: `(react-server)/./src/__fixtures__/server-function-imported-from-client.js`,
            name: `serverFunctionImportedFromClient`,
          },
        '(react-server)/./src/__fixtures__/server-function-passed-from-server.js#serverFunctionPassedFromServer':
          {
            chunks: [],
            id: `(react-server)/./src/__fixtures__/server-function-passed-from-server.js`,
            name: `serverFunctionPassedFromServer`,
          },
      });
    });

    test(`populates the given serverReferencesMap`, async () => {
      await runWebpack(buildConfig);

      expect([...serverReferencesMap.entries()]).toEqual([
        [
          path.resolve(
            currentDirname,
            `./__fixtures__/server-function-passed-from-server.js`,
          ),
          {
            exportNames: [`serverFunctionPassedFromServer`],
            moduleId: `(react-server)/./src/__fixtures__/server-function-passed-from-server.js`,
          },
        ],
        [
          path.resolve(
            currentDirname,
            `./__fixtures__/server-function-imported-from-client.js`,
          ),
          {
            exportNames: [`serverFunctionImportedFromClient`],
            moduleId: `(react-server)/./src/__fixtures__/server-function-imported-from-client.js`,
          },
        ],
      ]);
    });
  });

  describe(`in production mode`, () => {
    beforeEach(() => {
      buildConfig = {...buildConfig, mode: `production`};
    });

    test(`the generated bundle has registerServerReference calls for server references, with correct local and exported names`, async () => {
      await runWebpack(buildConfig);

      const outputFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(pretty(outputFile)).toMatch(
        `
    839: (e, t, r) => {
      async function n() {
        return Promise.resolve("server-function-imported-from-client");
      }
      r.r(t),
        r.d(t, { serverFunctionImportedFromClient: () => n }),
        (0, r(324).registerServerReference)(
          n,
          module.id,
          "serverFunctionImportedFromClient"
        );
    },
    871: (e, t, r) => {
      async function n() {
        return Promise.resolve("server-function-passed-from-server");
      }
      r.r(t),
        r.d(t, { serverFunctionPassedFromServer: () => n }),
        (0, r(324).registerServerReference)(
          n,
          module.id,
          "serverFunctionPassedFromServer"
        );
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
        '839#serverFunctionImportedFromClient': {
          chunks: [],
          id: 839,
          name: `serverFunctionImportedFromClient`,
        },
        '871#serverFunctionPassedFromServer': {
          chunks: [],
          id: 871,
          name: `serverFunctionPassedFromServer`,
        },
      });
    });

    test(`populates the given serverReferencesMap`, async () => {
      await runWebpack(buildConfig);

      expect([...serverReferencesMap.entries()]).toEqual([
        [
          path.resolve(
            currentDirname,
            `./__fixtures__/server-function-passed-from-server.js`,
          ),
          {exportNames: [`serverFunctionPassedFromServer`], moduleId: 871},
        ],
        [
          path.resolve(
            currentDirname,
            `./__fixtures__/server-function-imported-from-client.js`,
          ),
          {exportNames: [`serverFunctionImportedFromClient`], moduleId: 839},
        ],
      ]);
    });
  });
});
