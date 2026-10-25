# Expo Router server rendering always streams the page (`web.output: 'server'`)

Minimal Expo Router app (SDK 58, `web.output: 'server'`). The only page (`src/app/index.tsx`) renders a shell and a `<Suspense>` boundary whose data takes about 1 second to load. The component in the boundary also calls `setResponseHeaders({ 'X-Message-Loaded': 'yes' })` from `expo-server`, as a page would set a header (or a status, through a server wrapper) from the data it loaded.

Server rendering always streams: the server sends the shell with the fallback first, and the content about 1 second later, with an inline script that puts it in place. There is no option to send the page once it is complete, as React allows (`allReady`) and as static rendering already does.

## Versions

- expo 58.0.19, expo-router 58.0.26, @expo/router-server 58.0.17, expo-server 58.0.6
- react / react-dom 19.3.0, react-native-web 0.21.4

## Steps

```sh
bun install
bun run export            # expo export --platform web
bun run serve             # expo serve (http://localhost:8081)
bun run timing            # in another terminal: each chunk of http://localhost:8081/ with its arrival time
```

You can also use `curl -N -s -o /dev/null -w '%{time_starttransfer} %{time_total}\n' http://localhost:8081/`.

## What you see

```
   62 ms  status 200, X-Message-Loaded: (none)
   63 ms     647 bytes
   63 ms   16520 bytes
   63 ms     665 bytes  <h1>Shell</h1>, Loading…, <template
 1057 ms     925 bytes  Loaded after 1 s, $RC
 1057 ms      14 bytes
```

- The response starts before the data has loaded, so the header that the page sets while it renders is lost (`X-Message-Loaded: (none)`).
- The HTML has the fallback (`Loading…`) in place, and the content in a hidden `<div>` at the end of the body, moved in place by an inline script (`$RC`). A client that does not run JavaScript sees `Loading…`.

## What you expect

An option to send the page once it is complete. With the fix applied and `streaming: false` in the `expo-router` config plugin:

```
 1063 ms  status 200, X-Message-Loaded: yes
 1066 ms     647 bytes
 1066 ms   16520 bytes
 1066 ms     566 bytes  <h1>Shell</h1>, Loaded after 1 s
 1067 ms      14 bytes
```

The first byte comes after the data has loaded, the header is set, and the content is in place: `<main><h1>Shell</h1><!--$--><p id="message">Loaded after 1 s</p><!--/$--></main>`.

A boundary that never resolves does not hang the response. `src/app/never.tsx` suspends forever. With `streaming: false`, the server waits 10 seconds, aborts the render, and sends the page with the fallback (the browser renders the boundary). It logs `SSR render: Suspense boundaries did not resolve within 10000 ms. The browser renders them.`:

```
10078 ms  status 200, X-Message-Loaded: (none)
10079 ms     647 bytes
10079 ms   16520 bytes
10080 ms     582 bytes  <h1>Shell</h1>, Loading…, <template
10080 ms      14 bytes
```

(With streaming, the default, the shell of `/never` arrives at once and the response never ends. This does not change.)

## Try the fix

`fix/router-server.patch` and `fix/expo-router.patch` are the build of the fix (expo/expo branches `feat/router-server-complete-render` and `feat/router-streaming-option`) for `@expo/router-server@58.0.17` and `expo-router@58.0.26` (the config plugin schema). `app.config.js` sets `streaming: false` when `NO_STREAMING` is set (the published plugin rejects this option).

```sh
bun run fix                                                   # applies the patches to node_modules
bun run export && bun run serve                               # default: still streamed
NO_STREAMING=1 bunx expo export --platform web --clear        # `--clear`: the config is inlined in the cached bundle
bun run serve
bun run timing                                                # complete page, header set
bun run timing http://localhost:8081/never                    # fallback after 10 s
NO_STREAMING=1 bunx expo start --web                          # also applies to the development server
bun run unfix                                                 # reverts the patches
```
