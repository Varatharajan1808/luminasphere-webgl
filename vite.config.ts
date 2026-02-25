import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
    },
    plugins: [
        {
            name: 'fix-windows-mime-type',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    const url = req.url || '';
                    if (url.endsWith('.ts')) {
                        res.setHeader('Content-Type', 'application/javascript');
                    }
                    next();
                });
            }
        }
    ],
    optimizeDeps: {
        force: true
    }
});
