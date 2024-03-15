# `@mfng/core`

⚠️ **Experimental**

This package contains the essential building blocks required on both the server
and the client to create a streaming, server-side rendered, and properly
hydrated RSC app. It also provides utilities needed for server-centric,
client-side navigation.

## Getting Started

To use this library in your React Server Components project, follow these
high-level steps:

1. Install the library along with React Canary:

```sh
npm install @mfng/core react@canary react-dom@canary
```

2. Create a server entry that handles GET requests to create RSC app streams and
   HTML streams, as well as POST requests for creating RSC action streams.
   Optionally, add support for progressively enhanced forms.

3. Create a client entry that hydrates the server-rendered app and fetches RSC
   streams during navigation or when executing server actions.

4. Set up your webpack config as described in the `@mfng/webpack-rsc`
   [README](https://github.com/unstubbable/mfng/blob/main/packages/webpack-rsc/README.md).

5. Create a simple dev server using [Hono](https://hono.dev) and
   [tsx](https://github.com/privatenumber/tsx).

## Building Blocks

### Server

#### `@mfng/core/server/rsc`

- `createRscAppStream`
- `createRscActionStream`
- `createRscFormState`

#### `@mfng/core/server/ssr`

- `createHtmlStream`

#### `@mfng/core/router-location-async-local-storage`

- `routerLocationAsyncLocalStorage`

### Client

#### `@mfng/core/client/browser`

- `hydrateApp`
- `callServer` (usually not directly needed, encapsulated by `hydrateApp`)
- `Router` (usually not directly needed, encapsulated by `hydrateApp`)

#### `@mfng/core/client`

- `useRouter`
- `Link`
- `CallServerError`

### Universal (Client & Server)

#### `@mfng/core/use-router-location`

- `useRouterLocation`

## Putting It All Together

I would recommend taking a look at the example apps. The
[AWS app](https://github.com/unstubbable/mfng/tree/main/apps/aws-app) has a
particularly clean setup.
