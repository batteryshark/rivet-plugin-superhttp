import https from 'https';
import http from 'http';
import { URL } from 'url';

interface SuperHTTPNodeConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  errorOnNon200?: boolean;
  disableSSLVerification: boolean;
}

interface SuperHTTPNodeOutput {
  statusCode: number | undefined;
  res_headers: { [k: string]: string | string[] | undefined };
  res_body: string;
  json?: any;  // Define 'json' as an optional property
}

export async function runSuperHTTPNode(config: SuperHTTPNodeConfig): Promise<SuperHTTPNodeOutput> {
  const { method, url, headers, body, disableSSLVerification, errorOnNon200 } = config;
  const urlObject = new URL(url);

  const protocol = urlObject.protocol === 'https:' ? https : http;

  const options = {
    method: method,
    headers: headers,
    rejectUnauthorized: !disableSSLVerification,  // Handle SSL/TLS verification
  };

  return new Promise((resolve, reject) => {
    const req = protocol.request(url, options, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString();
        const statusCode = res.statusCode ?? 0; // Coalesce undefined to 0
        const responseHeaders = Object.fromEntries(Object.entries(res.headers));

        if (errorOnNon200 && (statusCode < 200 || statusCode >= 300)) {
          reject(new Error(`HTTP error: Status code ${statusCode}`));
          return;
        }

        const output: SuperHTTPNodeOutput = {
          statusCode: statusCode,
          res_headers: responseHeaders,
          res_body: responseBody,
        };

        if (res.headers['content-type']?.includes('application/json')) {
          try {
            output.json = JSON.parse(responseBody);
          } catch (error) {
            console.error("JSON parsing error:", error);
            output.json = "Error parsing JSON";
          }
        }

        resolve(output);
      });
    });

    req.on('error', (error) => {
      console.error("HTTP request error:", error);
      reject(new Error("HTTP request error: " + error.message));
    });

    if ((method === 'POST' || method === 'PUT') && body) {
      req.write(body);
    }

    req.end();
  });
}
