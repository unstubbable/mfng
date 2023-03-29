import path from 'path';
import url from 'url';
import MemoryFS from 'memory-fs';
import prettier from 'prettier';
import webpack from 'webpack';
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

  beforeEach(() => {
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
      plugins: [new WebpackRscServerPlugin({})],
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
/***/ "./packages/webpack-rsc-edge-plugin/src/__fixtures__/server-function.js":
/*!******************************************************************************!*\\
  !*** ./packages/webpack-rsc-edge-plugin/src/__fixtures__/server-function.js ***!
  \\******************************************************************************/
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
	$$id: {value: "./packages/webpack-rsc-edge-plugin/src/__fixtures__/server-function.js#serverFunction"},
});

/***/ })`,
      );
    });
  });

  describe(`in production mode`, () => {
    beforeEach(() => {
      buildConfig = {...buildConfig, mode: `production`};
    });

    test(`the generated bundle has replacement code for server references`, async () => {
      await runWebpack(buildConfig);

      const outputFile = fs.readFileSync(
        path.resolve(currentDirname, `dist/bundle.js`),
        `utf-8`,
      );

      expect(pretty(outputFile)).toMatch(
        `
    692: (e, r, t) => {
      async function o() {
        return Promise.resolve("server");
      }
      t.r(r),
        t.d(r, { serverFunction: () => o }),
        Object.defineProperties(o, {
          $$typeof: { value: Symbol.for("react.server.reference") },
          $$id: { value: "692#serverFunction" },
        });
    },`,
      );
    });
  });
});
