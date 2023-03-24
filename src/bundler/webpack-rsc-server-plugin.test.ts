import path from 'path';
import url from 'url';
import MemoryFS from 'memory-fs';
import prettier from 'prettier';
import webpack from 'webpack';
import type {ModuleExportsInfo} from './webpack-rsc-server-plugin.js';
import {WebpackRscServerPlugin} from './webpack-rsc-server-plugin.js';

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

describe(`WebpackRscPlugin`, () => {
  let buildConfig: webpack.Configuration;
  let clientModulesCache: Map<string, ModuleExportsInfo>;
  let serverModulesCache: Map<string, ModuleExportsInfo>;

  beforeEach(() => {
    clientModulesCache = new Map();
    serverModulesCache = new Map();

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
        new WebpackRscServerPlugin({clientModulesCache, serverModulesCache}),
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

    test.only(`the generated bundle has replacement code for client references`, async () => {
      await runWebpack(buildConfig);

      const outputFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(outputFile).toMatch(
        `
/***/ "./src/bundler/__fixtures__/client-component.js":
/*!******************************************************!*\\
  !*** ./src/bundler/__fixtures__/client-component.js ***!
  \\******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ClientComponent": () => (/* binding */ ClientComponent)
/* harmony export */ });
// @ts-nocheck
'use client';

const ClientComponent = {
  $$type: Symbol.for("react.client.reference"),
  $$id: "./src/bundler/__fixtures__/client-component.js#ClientComponent"
};

/***/ }),`,
      );
    });

    test(`the generated bundle has replacement code for server references`, async () => {
      await runWebpack(buildConfig);

      const outputFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(outputFile).toMatch(
        `
/***/ "./src/bundler/__fixtures__/server-function.js":
/*!*****************************************************!*\\
  !*** ./src/bundler/__fixtures__/server-function.js ***!
  \\*****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "serverFunction": () => (/* binding */ serverFunction)
/* harmony export */ });
'use server';

async function serverFunction() {
  return Promise.resolve(\`server\`);
}
Object.defineProperties(
	serverFunction,
	{
		$$typeof: {value: Symbol.for("react.server.reference")},
		$$id: {value: "./src/bundler/__fixtures__/server-function.js#serverFunction"},
	}
);

/***/ })`,
      );
    });

    test.only(`the clientModulesCache includes all client modules`, async () => {
      await runWebpack(buildConfig);

      expect(toPlainObject(clientModulesCache)).toEqual({
        [`${currentDirname}/__fixtures__/client-component.js`]: {
          exportNames: {ClientComponent: `ClientComponent`},
          id: `./src/bundler/__fixtures__/client-component.js`,
        },
      });
    });

    test(`the serverModulesCache includes all server modules`, async () => {
      await runWebpack(buildConfig);

      expect(toPlainObject(serverModulesCache)).toEqual({
        [`${currentDirname}/__fixtures__/server-function.js`]: {
          id: `./src/bundler/__fixtures__/server-function.js`,
          exportNames: [`serverFunction`],
        },
      });
    });
  });

  describe(`in production mode`, () => {
    beforeEach(() => {
      buildConfig = {...buildConfig, mode: `production`};
    });

    test.only(`the generated bundle has replacement code for client references`, async () => {
      await runWebpack(buildConfig);

      const outputFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(pretty(outputFile)).toMatch(
        `
    298: (e, r, t) => {
      t.d(r, { H: () => o });
      const o = { $$type: Symbol.for("react.client.reference"), $$id: "298#H" };
    }`,
      );
    });

    test(`the generated bundle has replacement code for server references`, async () => {
      await runWebpack(buildConfig);

      const outputFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(outputFile).toMatch(
        `
  /***/ "./src/bundler/__fixtures__/server-function.js":
  /*!*****************************************************!*\\
    !*** ./src/bundler/__fixtures__/server-function.js ***!
    \\*****************************************************/
  /***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

  __webpack_require__.r(__webpack_exports__);
  /* harmony export */ __webpack_require__.d(__webpack_exports__, {
  /* harmony export */   "serverFunction": () => (/* binding */ serverFunction)
  /* harmony export */ });
  'use server';

  async function serverFunction() {
    return Promise.resolve(\`server\`);
  }
  Object.defineProperties(
    serverFunction,
    {
      $$typeof: {value: Symbol.for("react.server.reference")},
      $$id: {value: "./src/bundler/__fixtures__/server-function.js#serverFunction"},
    }
  );

  /***/ })`,
      );
    });

    test.only(`the clientModulesCache includes all client modules`, async () => {
      await runWebpack(buildConfig);

      expect(toPlainObject(clientModulesCache)).toEqual({
        [`${currentDirname}/__fixtures__/client-component.js`]: {
          exportNames: {H: `ClientComponent`},
          id: 298,
        },
      });
    });

    test(`the serverModulesCache includes all server modules`, async () => {
      await runWebpack(buildConfig);

      expect(toPlainObject(serverModulesCache)).toEqual({
        [`${currentDirname}/__fixtures__/server-function.js`]: {
          id: `./src/bundler/__fixtures__/server-function.js`,
          exportNames: [`serverFunction`],
        },
      });
    });
  });
});

function toPlainObject(obj: unknown): object {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries([...value.entries()]);
      }

      if (value instanceof Set) {
        return [...value.values()];
      }

      return value;
    }),
  );
}
