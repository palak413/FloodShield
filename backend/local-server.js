import http from 'http';
import { handler } from './lambda/handler.js';

const PORT = process.env.PORT || 5001;

const server = http.createServer(async (req, res) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', async () => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const event = {
      httpMethod: req.method,
      path: url.pathname,
      rawPath: url.pathname,
      queryStringParameters: Object.fromEntries(url.searchParams.entries()),
      headers: req.headers,
      body: body || null,
      requestContext: {
        http: {
          method: req.method,
          path: url.pathname,
        },
      },
    };

    try {
      const lambdaResponse = await handler(event);
      res.writeHead(lambdaResponse.statusCode, lambdaResponse.headers || {});
      res.end(lambdaResponse.body);
    } catch (err) {
      console.error('Local server error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[FloodShield Backend] Local Lambda emulator listening on http://localhost:${PORT}`);
});
