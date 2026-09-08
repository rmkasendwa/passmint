try {
  const port = process.env.PORT ?? process.env.WEB_PORT ?? '8088';
  const response = await fetch(`http://127.0.0.1:${port}/api/ready`, {
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) process.exit(1);
  const body = await response.json();
  process.exit(body.status === 'ok' ? 0 : 1);
} catch {
  process.exit(1);
}
