const loaderUtils = require(`loader-utils`);
const {pathToFileURL} = require(`url`);
const webpack = require(`webpack`);

/**
 * @this {import('webpack').LoaderContext<{}>}
 * @type {import('webpack').LoaderDefinitionFunction}
 */
async function rscLoader(content) {
  const url = pathToFileURL(this.resourcePath).href;

  const reactServerDOMLoader = await import(
    `react-server-dom-webpack/node-loader`
  );

  await reactServerDOMLoader.resolve(
    url,
    {conditions: [`react-server`, `node`, `import`]},
    (specifier, context) => ({
      url: loaderUtils.urlToRequest(specifier, context.parentURL),
    }),
  );

  /**
   * @type {import('react-server-dom-webpack/node-loader').LoadFunction}
   */
  const loadModule = (anotherUrl) =>
    url
      ? {source: content, format: `module`}
      : new Promise((resolve, reject) => {
          return this.loadModule(anotherUrl, (err, source) =>
            err ? reject(err) : resolve({source, format: `module`}),
          );
        });

  const result = await reactServerDOMLoader.load(
    url,
    {conditions: [`react-server`, `node`, `import`], format: `module`},
    loadModule,
  );

  const sourceCode =
    typeof result.source === `string`
      ? result.source
      : new TextDecoder().decode(result.source);

  // Patch the server reference filepath values to use webpack's module id
  // instead of the file URL, so that it can be imported from within the RSC
  // worker bundle.
  return sourceCode.replace(
    /\$\$filepath: \{value: "[^"]+"\}/,
    () => `$$filepath: {value: ${webpack.RuntimeGlobals.moduleId}}`,
  );
}

module.exports = rscLoader;
