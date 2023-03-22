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
- [x] Simple routing
- [x] Development server
- [x] Production builds
- [x] Serverless deployment (using
      [Cloudflare Workers](https://workers.cloudflare.com))
- [ ] Microfrontend composition demo
- [ ] Support poisoned imports
- [ ] Server references manifest
- [ ] Advanced routing (~~maybe use `react-router`?~~ I don't think this is
      feasible since the concepts of RSC and React Router don't really align.)

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
