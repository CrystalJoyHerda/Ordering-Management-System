const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3000;

// Enable CORS for frontend
app.use(cors());

// Proxy API requests
app.use('/api', createProxyMiddleware({
    target: 'http://localhost',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/SOURCE_CODE_SYSTEM/Employee/public/api'
    }
}));

app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
});
