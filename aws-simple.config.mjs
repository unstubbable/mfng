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
      type: `function`,
      httpMethod: `GET`,
      publicPath: `/*`,
      path: `dist/index.cjs`,
      functionName: `Renderer`,
    },
  ],
});
