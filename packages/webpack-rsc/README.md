# Webpack RSC Integration

⚠️ **Experimental**

This library provides a Webpack loader and a pair of Webpack plugins for
integrating React Server Components (RSC) and Server-Side Rendering (SSR) in a
React application that can be deployed to the edge.

> Disclaimer: There are many moving parts involved in creating an RSC app that
> also handles SSR, without using a framework like Next.js. This library only
> provides the necessary parts for bundling the app. For a fully working
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

The following example demonstrates how to use the loader and plugins in a
Webpack configuration:

```js
import {
  WebpackRscClientPlugin,
  WebpackRscServerPlugin,
  createWebpackRscServerLoader,
  webpackRscLayerName,
} from '@mfng/webpack-rsc';

const clientReferencesMap = new Map();

const serverConfig = {
  name: 'server',
  // ...
  module: {
    rules: [
      {
        // Match the resource path of the modules that create RSC streams, e.g.:
        resource: (value) => /create-rsc-\w+-stream\.tsx?$/.test(value),
        layer: webpackRscLayerName,
      },
      {
        issuerLayer: webpackRscLayerName,
        resolve: {conditionNames: ['react-server', '...']},
      },
      {
        oneOf: [
          {
            issuerLayer: webpackRscLayerName,
            test: /\.tsx?$/,
            use: [
              createWebpackRscServerLoader({clientReferencesMap}),
              'swc-loader',
            ],
          },
          {test: /\.tsx?$/, use: ['swc-loader']},
        ],
      },
    ],
  },
  plugins: [new WebpackRscServerPlugin({clientReferencesMap})],
  experiments: {layers: true},
  // ...
};

const clientConfig = {
  name: 'client',
  dependencies: ['server'],
  // ...
  module: {rules: [{test: /\.tsx?$/, loader: 'swc-loader'}]},
  plugins: [new WebpackRscClientPlugin({clientReferencesMap})],
  // ...
};

export default [serverConfig, clientConfig];
```

**Note:** It's important to specify the names and dependencies of the configs as
shown above, so that the plugins work in the correct order, even in watch mode.

## Webpack Loader and Plugins

This library provides the following Webpack loader and plugins:

### `createWebpackRscServerLoader`

A function to create the RSC server loader `use` item. This loader is
responsible for replacing client components in a `use client` module with client
references (objects that contain meta data about the client components), and
removing all other parts of the client module. It also populates the
`clientReferencesMap`.

### `WebpackRscServerPlugin`

The server plugin resolves the client references that the loader has created,
and adds them as additional entries to the bundle, so that they are available
for server-side rendering (SSR).

The plugin also handles server references for React server actions by adding
meta data to all exported functions of a `use server` module. Based on this, it
generates the server manifest that is needed for validating the server
references for server actions (also known as mutations) that are sent back from
the client.

### `WebpackRscClientPlugin`

The client plugin resolves the client references that were saved by the loader
in `clientReferencesMap` into separate client chunks that can be loaded by the
browser. This plugin also generates the React client manifest file that is
needed for creating the RSC stream with
`ReactServerDOMServer.renderToReadableStream()`, as well as the React SSR
manifest that is needed for creating the HTML stream (SSR) with
`ReactServerDOMClient.createFromReadableStream()`.
