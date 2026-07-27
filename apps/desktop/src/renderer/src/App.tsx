export function App(): React.JSX.Element {
  return (
    <main className="desktop-shell">
      <section className="runtime-status" aria-labelledby="runtime-title">
        <div className="runtime-mark" aria-hidden="true" />
        <h1 id="runtime-title">Asteria</h1>
        <p>Desktop runtime ready</p>
      </section>
    </main>
  );
}
