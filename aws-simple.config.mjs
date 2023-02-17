/**
 * @type {import('aws-simple').ConfigFileDefaultExport}
 */
export default () => ({
  routes: [
    {
      type: `function`,
      httpMethod: `GET`,
      publicPath: `/*`,
      path: `dist/index.cjs`,
      functionName: `Renderer`,
    },
  ],
});
