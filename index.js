const { program } = require('commander');
const http = require('http');
const fs = require('fs'); // Залишаємо для fs.existsSync, fs.lstatSync, fs.mkdirSync
const fsp = require('fs').promises; // Для асинхронних операцій з файлами
const path = require('path');

program
   .requiredOption('-h, --host <type>', 'Server host')
   .requiredOption('-p, --port <type>', 'Server port')
   .requiredOption('-c, --cache <type>', 'Cache directory path');

program.parse(process.argv);
const options = program.opts();
const host = options.host;
const port = parseInt(options.port, 10); // Перетворюємо порт в число
const cacheDir = path.resolve(options.cache); // Отримуємо абсолютний шлях до кешу

// Перевірка, чи порт є валідним числом
if (isNaN(port)) {
    console.error('Error: Port must be a number.');
    process.exit(1);
}

// Перевірка та створення директорії кешу, якщо вона не існує
if (!fs.existsSync(cacheDir)) {
    try {
        fs.mkdirSync(cacheDir, { recursive: true });
        console.log(`Cache directory created: ${cacheDir}`);
    } catch (err) {
        console.error(`Error creating cache directory: ${err.message}`);
        process.exit(1);
    }
} else if (!fs.lstatSync(cacheDir).isDirectory()) {
    console.error(`Error: Cache path ${cacheDir} exists but is not a directory.`);
    process.exit(1);
}

console.log(`Server will run on host: ${host}, port: ${port}`);
console.log(`Cache directory: ${cacheDir}`);

const server = http.createServer(async (req, res) => {
    const url = req.url;
    const filePath = path.join(cacheDir, `${url}.jpg`);

    switch (req.method) {
        case 'GET':
            fs.promises.readFile(filePath)
                .then(image => {
                    res.setHeader('Content-Type', 'image/jpeg');
                    res.statusCode = 200;
                    res.end(image);
                })
                .catch(err => {
                    if (err.code === 'ENOENT') {
                        res.statusCode = 404;
                        res.end('Image not found');
                    } else {
                        res.statusCode = 500;
                        res.end('Internal Server Error');
                    }
                });
            break;

        case 'PUT':
            const chunks = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', async () => {
                const imageData = Buffer.concat(chunks);
                await fs.promises.writeFile(filePath, imageData);
                res.statusCode = 201;
                res.end('Image saved');
            });
            break;

        case 'DELETE':
            try {
                await fs.promises.unlink(filePath); // Асинхронне видалення
                res.statusCode = 200;
                res.end('Image deleted');
            } catch (err) {
                res.statusCode = 404;
                res.end('Image not found');
            }
            break;

        default:
            res.statusCode = 405;
            res.end('Method Not Allowed');
            break;
    }
});

server.listen(port, host, () => {
    console.log(`Server is listening on http://${host}:${port}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Error: Address http://${host}:${port} is already in use.`);
    } else if (err.code === 'EACCES') {
        console.error(`Error: Port ${port} requires elevated privileges.`);
    } else {
        console.error(`Server error: ${err.message}`);
    }
    process.exit(1);
});
