import { Suspense, use } from 'react';

// Data that never loads, as from an API that does not answer.
const never = new Promise<string>(() => {});

function Message() {
  return <p id="message">{use(never)}</p>;
}

export default function Never() {
  return (
    <main>
      <h1>Shell</h1>
      <Suspense fallback={<p id="message">Loading…</p>}>
        <Message />
      </Suspense>
    </main>
  );
}
