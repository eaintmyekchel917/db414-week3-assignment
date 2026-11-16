const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    const sendJSON = (statusCode, data) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // ROUTE: POST /api/catalog/items
    if (pathname === '/api/catalog/items' && req.method === 'POST') {
        let bodyChunks = [];

        req.on('data', chunk => {
            bodyChunks.push(chunk);
        });

        req.on('end', () => {
            try {
                const rawBody = Buffer.concat(bodyChunks).toString();
                const payload = JSON.parse(rawBody);

                const { sku, price, tags, vendor } = payload;

                // 1. SKU Validation (Regex format: e.g., "CAT-001" -> 3 uppercase letters, hyphen, 3 digits)
                const skuRegex = /^[A-Z]{3}-\d{3}$/;
                if (!sku || !skuRegex.test(sku)) {
                    return sendJSON(422, {
                        error: "Unprocessable Entity",
                        message: "Validation Failed: SKU is invalid or missing. Format must be 3 uppercase letters followed by a hyphen and 3 digits (e.g., CAT-001)."
                    });
                }

                // 2. Price Validation (Must be greater than 0)
                if (price === undefined || typeof price !== 'number' || price <= 0) {
                    return sendJSON(422, {
                        error: "Unprocessable Entity",
                        message: "Validation Failed: Price is required and must be a number greater than 0."
                    });
                }

                // 3. Tags Array Validation (Must be an array, min length 1, and unique elements)
                if (!tags || !Array.isArray(tags) || tags.length < 1) {
                    return sendJSON(422, {
                        error: "Unprocessable Entity",
                        message: "Validation Failed: Tags must be an array with at least 1 item."
                    });
                }

                const uniqueTags = new Set(tags);
                if (uniqueTags.size !== tags.length) {
                    return sendJSON(422, {
                        error: "Unprocessable Entity",
                        message: "Validation Failed: Tags array must contain unique values (no duplicates allowed)."
                    });
                }

                // 4. Vendor Details Object Validation
                if (!vendor || typeof vendor !== 'object' || !vendor.vendorName || !vendor.contactEmail) {
                    return sendJSON(422, {
                        error: "Unprocessable Entity",
                        message: "Validation Failed: Vendor object is required and must contain vendorName and contactEmail."
                    });
                }

                // Success Response (201 Created)
                return sendJSON(201, {
                    status: "success",
                    message: "Catalog item validated and registered successfully.",
                    timestamp: new Date().toISOString(),
                    item: payload
                });

            } catch (err) {
                // Malformed JSON Syntax -> 400 Bad Request
                return sendJSON(400, {
                    error: "Bad Request",
                    message: "Malformed JSON payload syntax."
                });
            }
        });
        return;
    }

    sendJSON(404, { error: "Not Found", message: "Endpoint not found." });
});

server.listen(PORT, () => {
    console.log(`Validator Server running at http://localhost:${PORT}/`);
});