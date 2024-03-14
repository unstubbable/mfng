# MFNG

⚗️ A Minimal React Server Components Bundler & Library

## Packages

MFNG offers two packages that together enable the building of a production-ready
RSC app.

### `@mfng/core`

This package contains the essential building blocks required on both the server
and the client to create a streaming, server-side rendered, and properly
hydrated RSC app. It also provides utilities that are needed for server-centric,
client-side navigation.

↪
[Documentation](https://github.com/unstubbable/mfng/blob/main/packages/core/README.md)

### `@mfng/webpack-rsc`

This package provides a set of Webpack loaders and plugins required for building
an RSC application bundle for the browser, as well as for the server. The server
bundle can be deployed to any serverless, edge, or Node.js-based environment.
`@mfng/webpack-rsc` can be used standalone as an RSC bundling solution or in
conjunction with `@mfng/core`.

↪
[Documentation](https://github.com/unstubbable/mfng/blob/main/packages/webpack-rsc/README.md)

## Features

- [x] React server components
- [x] Server-side rendering
- [x] Client components, lazily loaded as separate chunks
- [x] Server actions
  - [x] passed as props from the server to the client
  - [x] imported from the client
  - [x] top-level functions/closures with inline `'use server'` directive
  - [ ] auto-binding of closed-over variables (not planned)
- [x] Progressively enhanced form actions
- [x] Suspensy routing
- [x] Production builds
- [x] Development server
- [x] Serverless deployment examples
  - using a [Cloudflare Worker](https://workers.cloudflare.com)
  - using a
    [Vercel Edge Function](https://vercel.com/docs/functions/edge-functions)
  - using an [AWS Lambda Function](https://aws.amazon.com/lambda/), with
    [AWS CloudFront](https://aws.amazon.com/cloudfront/) as CDN
- [x] Support for
      [poisoned imports](https://github.com/reactjs/rfcs/blob/main/text/0227-server-module-conventions.md#poisoned-imports)
- [x] Support for the [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [ ] Partial prerendering
- [ ] Advanced routing

## Name Origin

The name MFNG stands for "Microfrontends Next Generation". The project was
originally motivated by the following questions:

> Do we still need to deploy microfrontends and their APIs (also known as BFFs –
> Backends for Frontends) independently of the main app? Or can we integrate
> them at build-time, though dynamically composed at run-time, and allow them to
> use server components to fetch their data on the server?

It has since evolved into a general-purpose RSC library, not specifically
targeted at the microfrontends use case... until we explore some form of
federation integration, as pioneered by
[federated-rsc](https://github.com/jacob-ebey/federated-rsc/), perhaps.
