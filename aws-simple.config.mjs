/**
 * @type {import('aws-simple').ConfigFileDefaultExport}
 */
export default () => ({
  routes: [
    {
      type: `folder`,
      publicPath: `/assets/*`,
      path: `dist/client`,
    },
    {
      type: `file`,
      publicPath: `/favicon.ico`,
      path: `static/favicon.ico`,
    },
    {
      type: `function`,
      httpMethod: `GET`,
      publicPath: `/*`,
      path: `dist/index.cjs`,
      functionName: `Renderer`,
    },
  ],
});
