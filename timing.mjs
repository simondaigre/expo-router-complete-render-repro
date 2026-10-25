// Prints each chunk of the response with the time it arrived, then the response headers.
// Usage: node timing.mjs [url]
const url = process.argv[2] ?? 'http://localhost:8081/';
const start = performance.now();
const response = await fetch(url);
const ms = () => `${String(Math.round(performance.now() - start)).padStart(5)} ms`;
console.log(`${ms()}  status ${response.status}, X-Message-Loaded: ${response.headers.get('x-message-loaded') ?? '(none)'}`);
const decoder = new TextDecoder();
for await (const chunk of response.body) {
  const text = decoder.decode(chunk, { stream: true });
  const marks = ['<h1>Shell</h1>', 'Loading…', 'Loaded after 1 s', '<template', '$RC', '$RX'].filter((mark) => text.includes(mark));
  console.log(`${ms()}  ${String(chunk.length).padStart(6)} bytes  ${marks.join(', ')}`);
}
