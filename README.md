# Exploring possibilities for microfrontends of the next generation

Do we still need to deploy microfrontends and their BFFs, independent of the
main app? Or can we instead compose them at build-time (lazily), and utilize
server components to let them fetch their data in the server?

## Features

- [x] streaming fast
- [x] react server components
- [x] server-side rendering
- [x] client components loaded as separate chunks
- [x] server actions
- [x] simple routing
- [ ] advanced routing (~~maybe use `react-router`?~~ I don't think this is
      feasable since the concepts of RSC and React Router do not really line
      up.)
- [ ] (lazy) microfrontend compositon demo
- [x] stylesheets
- [ ] support poisened imports
- [ ] server references manifest
