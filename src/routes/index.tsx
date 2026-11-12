import { createFileRoute } from "@tanstack/react-router";

/**
 * Запасной вход, если статическую главную не отдал файловый слой.
 * Сам сайт — это /index.html и соседние HTML, не этот экран.
 */
export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main style={{ fontFamily: "Roboto, sans-serif", padding: "48px 20px" }}>
      <h1 style={{ fontFamily: "Roboto Slab, serif", color: "#444444" }}>Бурводстрой</h1>
      <p style={{ color: "#666666" }}>
        <a href="index.html">Открыть сайт водозабора под ключ</a>
      </p>
    </main>
  );
}
