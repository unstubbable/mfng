# MFNG - A React Server Components Playground

## Motivation

### Exploring Possibilities for Next-Generation Microfrontends

Do we still need to deploy microfrontends and their APIs (also known as BFFs)
independently of the main app? Or can we instead compose them at build-time
(lazily) and utilize server components to let them fetch their data on the
server?

## Features

- [x] Streaming fast
- [x] React server components
- [x] Server-side rendering
- [x] Client components loaded as separate chunks
- [x] Server actions
  - [x] passed from server to client
  - [x] imported from client
  - [x] inline `'use server'` directive
  - [ ] auto-binding of closed-over variables (not planned)
- [x] Progressively enhanced form actions
- [x] Suspensy routing
- [x] Development server
- [x] Production builds
- [x] Serverless deployment examples
  - using a [Cloudflare Worker](https://workers.cloudflare.com)
  - using a
    [Vercel Edge Function](https://vercel.com/docs/functions/edge-functions)
  - using an [AWS Lambda Function](https://aws.amazon.com/lambda/), with
    [AWS CloudFront](https://aws.amazon.com/cloudfront/) as CDN
- [x] Support [poisoned imports][]
- [ ] Microfrontend composition demo
- [ ] Advanced routing

## Getting Started

```sh
npm install
```

```sh
npm run dev
```

Open http://localhost:3000

## Deployment

To deploy the workers to your own workers.dev domain, first create a
[Cloudflare API Token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/),
then run:

```sh
CLOUDFLARE_API_TOKEN=<insert-your-token> npm run deploy
```

### Deploying via GitHub Actions

To deploy via GitHub Actions, follow these steps:

1. Fork the repository.
2. Create a new
   [environment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
   with the name "Cloudflare Workers".
3. Add the environment secret `CLOUDFLARE_API_TOKEN` using your own token as the
   value.
4. Push a commit to the `main` branch.

---

_Please let me know in the issues if any of these steps do not work for you._

[poisoned imports]:
  https://github.com/reactjs/rfcs/blob/main/text/0227-server-module-conventions.md#poisoned-imports
