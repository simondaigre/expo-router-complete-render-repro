import { setResponseHeaders } from 'expo-server';
import { Suspense, use } from 'react';

// Data that takes about one second to load, as from an API. Created once per request on the server.
let pending: Promise<string> | undefined;
function loadMessage() {
  pending ??= new Promise((resolve) => setTimeout(() => resolve('Loaded after 1 s'), 1000));
  return pending;
}

function Message() {
  const message = use(loadMessage());
  // A header decided from the data, as a page would set a 404 when its data isn't found.
  if (typeof window === 'undefined') {
    setResponseHeaders({ 'X-Message-Loaded': 'yes' });
  }
  return <p id="message">{message}</p>;
}

export default function Index() {
  pending = undefined;
  return (
    <main>
      <h1>Shell</h1>
      <Suspense fallback={<p id="message">Loading…</p>}>
        <Message />
      </Suspense>
    </main>
  );
}
