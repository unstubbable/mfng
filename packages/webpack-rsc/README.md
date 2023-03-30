# Webpack RSC Integration

⚠️ **Experimental**

This library provides a Webpack loader and a set of Webpack plugins for
integrating React Server Components (RSC) and Server-Side Rendering (SSR) in a
React application.

> Disclaimer: There are many moving parts involved in creating an RSC app that
> also handles SSR without using a framework like Next.js. This library only
> provides the necessary parts for bundling the app. It also assumes that
> separate bundles/servers/workers are used for RSC and SSR. For a fully working
> integration, see https://github.com/unstubbable/mfng.

## Getting Started

To use this library in your React Server Components project, follow these steps:

1. Install the library as a dev dependency:

```sh
npm install --save-dev @mfng/webpack-rsc
```

2. Update your `webpack.config.js` to include the loader and plugins provided by
   this library. See the example configuration below for reference.

## Example Webpack Configuration

The following example demonstrates how to use the plugins and loader from this
library in a Webpack configuration:

```js
import {
  WebpackRscClientPlugin,
  WebpackRscServerPlugin,
  WebpackRscSsrPlugin,
  createWebpackRscServerLoader,
} from '@mfng/webpack-rsc';

const clientReferencesForClientMap = new Map();
const clientReferencesForSsrMap = new Map();

const serverConfig = {
  name: 'server',
  // ...
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          createWebpackRscServerLoader({clientReferencesForClientMap}),
          'swc-loader',
        ],
      },
    ],
  },
  plugins: [new WebpackRscServerPlugin()],
  // ...
};

const clientConfig = {
  name: 'client',
  dependencies: ['server'],
  // ...
  module: {
    rules: [{test: /\.tsx?$/, loader: 'swc-loader'}],
  },
  plugins: [
    new WebpackRscClientPlugin({
      clientReferencesForClientMap,
      clientReferencesForSsrMap,
    }),
  ],
  // ...
};

const ssrConfig = {
  name: 'ssr',
  dependencies: ['client'],
  // ...
  module: {
    rules: [{test: /\.tsx?$/, loader: 'swc-loader'}],
  },
  plugins: [new WebpackRscSsrPlugin({clientReferencesForSsrMap})],
  // ...
};

export default [serverConfig, clientConfig, ssrConfig];
```

**Note:** It's important to specify the names and dependencies of the configs as
shown above, so that the plugins work in the correct order, even in watch mode.

## Webpack Loader and Plugins

This library provides the following Webpack loader and plugins:

### `createWebpackRscServerLoader`

A function to create the RSC server loader `use` item. This loader is
responsible for replacing client components in a `use client` module with client
references (objects that contain meta data about the client components), and
removing all other parts of the client module.

### `WebpackRscClientPlugin`

Resolves the client references that were created by the loader into separate
client chunks that can be loaded by the browser. This plugin also generates the
React client manifest file that is needed for
`ReactServerDOMServer.renderToReadableStream()` in the RSC server.

### `WebpackRscSsrPlugin`

Handles the resolution of client references so that client modules are included
in the SSR bundle. It generates the SSR manifest file, based on the resolved
client references that were created by `WebpackRscClientPlugin`. The manifest is
needed for `ReactServerDOMClient.createFromReadableStream()` in the SSR server.

### `WebpackRscServerPlugin`

Handles server references for React server actions by adding meta data to all
exported functions of a `use server` module. This plugin also generates the
server manifest that is needed for validating the server references in the RSC
server for server actions (also known as mutations) that are sent back by the
client.
