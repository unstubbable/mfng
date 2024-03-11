import path from 'path';
import url from 'url';
import MemoryFS from 'memory-fs';
import prettier from 'prettier';
import webpack from 'webpack';
import {WebpackRscClientPlugin} from './webpack-rsc-client-plugin.js';
import type {
  ClientReferencesMap,
  ServerReferencesMap,
} from './webpack-rsc-server-loader.cjs';
import {createWebpackRscClientLoader} from './index.js';

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
        return reject(err);
      }

      if (stats) {
        const info = stats.toJson();

        if (stats.hasErrors()) {
          console.error(info.errors);
          return reject(info.errors);
        }

        if (stats.hasWarnings()) {
          console.warn(info.warnings);
        }

        resolve();
      }
    });
  });
}

describe(`WebpackRscClientPlugin`, () => {
  let buildConfig: webpack.Configuration;
  let clientReferencesMap: ClientReferencesMap;
  let serverReferencesMap: ServerReferencesMap;

  beforeEach(() => {
    clientReferencesMap = new Map();
    serverReferencesMap = new Map();

    buildConfig = {
      entry: path.resolve(currentDirname, `__fixtures__/client-entry.js`),
      output: {
        path: path.resolve(currentDirname, `dist`),
        filename: `main.js`,
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            use: createWebpackRscClientLoader({serverReferencesMap}),
          },
        ],
      },
      plugins: [new WebpackRscClientPlugin({clientReferencesMap})],
      devtool: false,
      performance: false,
      cache: false,
    };
  });

  describe(`in development mode`, () => {
    beforeEach(() => {
      buildConfig = {...buildConfig, mode: `development`};
    });

    test(`creates chunks for the given client references`, async () => {
      clientReferencesMap.set(
        path.resolve(currentDirname, `__fixtures__/client-component.js`),
        [
          {
            id: `__fixtures__/client-component.js#ClientComponent`,
            exportName: `ClientComponent`,
          },
        ],
      );

      await runWebpack(buildConfig);

      const outputFile = memFs.readFileSync(
        path.resolve(currentDirname, `dist/client0.main.js`),
        `utf-8`,
      );

      expect(outputFile).toEqual(
        `"use strict";
(self["webpackChunk_mfng_webpack_rsc"] = self["webpackChunk_mfng_webpack_rsc"] || []).push([["client0"],{

/***/ "./src/__fixtures__/client-component.js":
/*!**********************************************!*\\
  !*** ./src/__fixtures__/client-component.js ***!
  \\**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ClientComponent": () => (/* binding */ ClientComponent)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "../../node_modules/react/index.js");
// @ts-nocheck
'use client';



function ClientComponent({action}) {
  react__WEBPACK_IMPORTED_MODULE_0__.useEffect(() => {
    action().then(console.log);
  }, []);

  return null;
}


/***/ })

}]);`,
      );
    });

    test(`creates a client manifest`, async () => {
      clientReferencesMap.set(
        path.resolve(currentDirname, `__fixtures__/client-component.js`),
        [
          {
            id: `__fixtures__/client-component.js#ClientComponent`,
            exportName: `ClientComponent`,
          },
        ],
      );

      await runWebpack(buildConfig);

      const manifest = JSON.parse(
        memFs.readFileSync(
          path.resolve(currentDirname, `dist/react-client-manifest.json`),
          `utf-8`,
        ),
      );

      expect(manifest).toEqual({
        '__fixtures__/client-component.js#ClientComponent': {
          chunks: [`client0`, `client0.main.js`],
          id: `./src/__fixtures__/client-component.js`,
          name: `ClientComponent`,
        },
      });
    });
  });

  describe(`in production mode`, () => {
    beforeEach(() => {
      buildConfig = {...buildConfig, mode: `production`};
    });

    test(`creates chunks for the given client references`, async () => {
      clientReferencesMap.set(
        path.resolve(currentDirname, `__fixtures__/client-component.js`),
        [
          {
            id: `__fixtures__/client-component.js#ClientComponent`,
            exportName: `ClientComponent`,
          },
        ],
      );

      await runWebpack(buildConfig);

      const outputFile = memFs.readFileSync(
        path.resolve(currentDirname, `dist/client0.main.js`),
        `utf-8`,
      );

      expect(pretty(outputFile)).toEqual(
        `"use strict";
(self["webpackChunk_mfng_webpack_rsc"] =
  self["webpackChunk_mfng_webpack_rsc"] || []).push([
  ["client0"],
  {
    /***/ "./src/__fixtures__/client-component.js":
      /*!**********************************************!*\\
  !*** ./src/__fixtures__/client-component.js ***!
  \\**********************************************/
      /***/ (
        __unused_webpack___webpack_module__,
        __webpack_exports__,
        __webpack_require__
      ) => {
        __webpack_require__.r(__webpack_exports__);
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ ClientComponent: () =>
            /* binding */ ClientComponent,
          /* harmony export */
        });
        /* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ =
          __webpack_require__(/*! react */ "../../node_modules/react/index.js");
        // @ts-nocheck
        ("use client");

        function ClientComponent({ action }) {
          react__WEBPACK_IMPORTED_MODULE_0__.useEffect(() => {
            action().then(console.log);
          }, []);

          return null;
        }

        /***/
      },
  },
]);
`,
      );
    });

    test(`creates a client manifest`, async () => {
      clientReferencesMap.set(
        path.resolve(currentDirname, `__fixtures__/client-component.js`),
        [
          {
            id: `__fixtures__/client-component.js#ClientComponent`,
            exportName: `ClientComponent`,
          },
        ],
      );

      await runWebpack(buildConfig);

      const manifest = JSON.parse(
        memFs.readFileSync(
          path.resolve(currentDirname, `dist/react-client-manifest.json`),
          `utf-8`,
        ),
      );

      expect(manifest).toEqual({
        '__fixtures__/client-component.js#ClientComponent': {
          chunks: [701, `701.main.js`],
          id: 431,
          name: `ClientComponent`,
        },
      });
    });
  });
});
