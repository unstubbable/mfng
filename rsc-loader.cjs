const loaderUtils = require(`loader-utils`);
const {pathToFileURL} = require(`url`);

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

  return typeof result.source === `string`
    ? result.source
    : new TextDecoder().decode(result.source);
}

module.exports = rscLoader;
