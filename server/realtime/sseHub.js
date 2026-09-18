export default function createSseHub() {
    const clients = new Set();

    function handler(req, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        res.write(': connected\n\n');
        clients.add(res);

        const heartbeat = setInterval(() => {
            res.write(': heartbeat\n\n');
        }, 25000);

        req.on('close', () => {
            clearInterval(heartbeat);
            clients.delete(res);
        });
    }

    function emit(type, payload = {}) {
        const data = JSON.stringify(payload);
        for (const client of clients) {
            try {
                client.write(`event: ${type}\n`);
                client.write(`data: ${data}\n\n`);
            } catch {
                clients.delete(client);
            }
        }
    }

    return {
        handler,
        emit,
    };
}