import { calculateFloodRisk } from './riskEngine.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  const startTime = Date.now();
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
  const path = event.path || event.rawPath || '/';

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'CORS OK' }),
    };
  }

  // Health check endpoint
  if (httpMethod === 'GET' && (path.endsWith('/health') || path === '/')) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'healthy',
        service: 'FloodShield Risk Assessment API',
        region: process.env.AWS_REGION || 'ap-south-1',
        runtime: `Node.js ${process.version}`,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // Assessment calculation endpoint
  if (httpMethod === 'POST') {
    try {
      let body = event.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      if (!body || !body.location || !body.params) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'Invalid request body. Expected { location: {...}, params: {...} }',
          }),
        };
      }

      const result = calculateFloodRisk(body.location, body.params);
      const executionTimeMs = Date.now() - startTime;
      result.provenance.executionTimeMs = executionTimeMs;

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(result),
      };
    } catch (err) {
      console.error('Error processing assessment request:', err);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Internal calculation error in FloodShield Lambda',
          details: err.message,
        }),
      };
    }
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: `Route not found: ${httpMethod} ${path}` }),
  };
};
