import path from 'path';
import url from 'url';
import MemoryFS from 'memory-fs';
import prettier from 'prettier';
import webpack from 'webpack';
import type {
  ClientReferencesMap,
  ServerReferencesMap,
} from './webpack-rsc-server-loader.cjs';
import {
  WebpackRscServerPlugin,
  webpackRscLayerName,
} from './webpack-rsc-server-plugin.js';
import {
  createWebpackRscServerLoader,
  createWebpackRscSsrLoader,
} from './index.js';

const memFs = new MemoryFS();
const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

function pretty(source: string): string {
  return prettier.format(source, {parser: `babel`});
}

async function runWebpack(config: webpack.Configuration): Promise<void> {
  return new Promise((resolve, reject) => {
    const compiler = webpack(config);

    compiler.outputFileSystem = memFs;

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
                use: createWebpackRscServerLoader({
                  clientReferencesMap,
                  serverReferencesMap,
                }),
              },
              {
                use: createWebpackRscSsrLoader({serverReferencesMap}),
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

      const outputFile = memFs.readFileSync(
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

      const outputFile = memFs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(outputFile).toMatch(
        `
/***/ "(react-server)/./src/__fixtures__/main-component.js":
/*!********************************************!*\\
  !*** ./src/__fixtures__/main-component.js ***!
  \\********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Main": () => (/* binding */ Main),
/* harmony export */   "serverFunctionWithInlineDirective": () => (/* binding */ serverFunctionWithInlineDirective)
/* harmony export */ });
/* harmony import */ var react_server_dom_webpack_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-server-dom-webpack/server */ "(react-server)/../../node_modules/react-server-dom-webpack/server.edge.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "(react-server)/../../node_modules/react/react.react-server.js");
/* harmony import */ var _client_component_with_server_action_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./client-component-with-server-action.js */ "(react-server)/./src/__fixtures__/client-component-with-server-action.js");
/* harmony import */ var _server_function_passed_from_server_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./server-function-passed-from-server.js */ "(react-server)/./src/__fixtures__/server-function-passed-from-server.js");




async function serverFunctionWithInlineDirective() {
  'use server';

  return Promise.resolve(\`server-function-with-inline-directive\`);
}
(0,react_server_dom_webpack_server__WEBPACK_IMPORTED_MODULE_0__.registerServerReference)(serverFunctionWithInlineDirective, module.id, "serverFunctionWithInlineDirective");

function Main() {
  return react__WEBPACK_IMPORTED_MODULE_1__.createElement(_client_component_with_server_action_js__WEBPACK_IMPORTED_MODULE_2__.ClientComponentWithServerAction, {
    action1: _server_function_passed_from_server_js__WEBPACK_IMPORTED_MODULE_3__.serverFunctionPassedFromServer,
    action2: serverFunctionWithInlineDirective
  });
}

/***/ }),

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

      const manifestFile = memFs.readFileSync(
        path.resolve(currentDirname, `dist/react-server-manifest.json`),
        `utf-8`,
      );

      expect(JSON.parse(manifestFile)).toEqual({
        '(react-server)/./src/__fixtures__/main-component.js#serverFunctionWithInlineDirective':
          {
            chunks: [],
            id: `(react-server)/./src/__fixtures__/main-component.js`,
            name: `serverFunctionWithInlineDirective`,
          },
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

    test(`adds module IDs to the given serverReferencesMap`, async () => {
      await runWebpack(buildConfig);

      expect(Object.fromEntries(serverReferencesMap.entries())).toEqual({
        [path.resolve(currentDirname, `./__fixtures__/main-component.js`)]: {
          exportNames: [`serverFunctionWithInlineDirective`],
          moduleId: `(react-server)/./src/__fixtures__/main-component.js`,
        },
        [path.resolve(
          currentDirname,
          `./__fixtures__/server-function-imported-from-client.js`,
        )]: {
          exportNames: [`serverFunctionImportedFromClient`],
          moduleId: `(react-server)/./src/__fixtures__/server-function-imported-from-client.js`,
        },
        [path.resolve(
          currentDirname,
          `./__fixtures__/server-function-passed-from-server.js`,
        )]: {
          exportNames: [`serverFunctionPassedFromServer`],
          moduleId: `(react-server)/./src/__fixtures__/server-function-passed-from-server.js`,
        },
      });
    });
  });

  describe(`in production mode`, () => {
    beforeEach(() => {
      buildConfig = {...buildConfig, mode: `production`};
    });

    test(`the generated bundle has registerServerReference calls for server references, with correct local and exported names`, async () => {
      await runWebpack(buildConfig);

      const outputFile = memFs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(pretty(outputFile)).toMatch(
        `
    799: (e, r, t) => {
      t.r(r),
        t.d(r, { Main: () => u, serverFunctionWithInlineDirective: () => c });
      var n = t(324),
        o = t(240);
      const i = (0, n.registerClientReference)(
        ((a = "ClientComponentWithServerAction"),
        () => {
          throw new Error(
            \`Attempted to call $\{a}() from the server but $\{a} is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.\`
          );
        }),
        "src/__fixtures__/client-component-with-server-action.js#ClientComponentWithServerAction",
        "ClientComponentWithServerAction"
      );
      var a,
        s = t(871);
      async function c() {
        return Promise.resolve("server-function-with-inline-directive");
      }
      function u() {
        return o.createElement(i, {
          action1: s.serverFunctionPassedFromServer,
          action2: c,
        });
      }
      (0, n.registerServerReference)(
        c,
        module.id,
        "serverFunctionWithInlineDirective"
      );
    },
    839: (e, r, t) => {
      async function n() {
        return Promise.resolve("server-function-imported-from-client");
      }
      t.r(r),
        t.d(r, { serverFunctionImportedFromClient: () => n }),
        (0, t(324).registerServerReference)(
          n,
          module.id,
          "serverFunctionImportedFromClient"
        );
    },
    871: (e, r, t) => {
      async function n() {
        return Promise.resolve("server-function-passed-from-server");
      }
      t.r(r),
        t.d(r, { serverFunctionPassedFromServer: () => n }),
        (0, t(324).registerServerReference)(
          n,
          module.id,
          "serverFunctionPassedFromServer"
        );
    },`,
      );
    });

    test(`creates a server references manifest`, async () => {
      await runWebpack(buildConfig);

      const manifestFile = memFs.readFileSync(
        path.resolve(currentDirname, `dist/react-server-manifest.json`),
        `utf-8`,
      );

      expect(JSON.parse(manifestFile)).toEqual({
        '799#serverFunctionWithInlineDirective': {
          chunks: [],
          id: 799,
          name: `serverFunctionWithInlineDirective`,
        },
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

    test(`adds module IDs to the given serverReferencesMap`, async () => {
      await runWebpack(buildConfig);

      expect(Object.fromEntries(serverReferencesMap.entries())).toEqual({
        [path.resolve(currentDirname, `./__fixtures__/main-component.js`)]: {
          exportNames: [`serverFunctionWithInlineDirective`],
          moduleId: 799,
        },
        [path.resolve(
          currentDirname,
          `./__fixtures__/server-function-imported-from-client.js`,
        )]: {exportNames: [`serverFunctionImportedFromClient`], moduleId: 839},
        [path.resolve(
          currentDirname,
          `./__fixtures__/server-function-passed-from-server.js`,
        )]: {exportNames: [`serverFunctionPassedFromServer`], moduleId: 871},
      });
    });
  });
});
