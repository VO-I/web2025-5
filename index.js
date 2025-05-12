        // app.js
        const { program } = require('commander');
        const http = require('http');
        const fs = require('fs'); // Додамо fs для перевірки існування директорії кешу
        const path = require('path'); // Додамо path для роботи зі шляхами
        
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
        
        // Подальший код сервера буде тут
                // app.js (продовження)
        
        const server = http.createServer((req, res) => {
            // Обробка запитів буде тут у Частині 2
            res.writeHead(501, { 'Content-Type': 'text/plain' }); // 501 Not Implemented (поки що)
            res.end('Not Implemented Yet');
        });
        
        server.listen(port, host, () => {
            console.log(`Server is listening on http://<span class="math-inline">\{host\}\:</span>{port}`);
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Error: Address http://<span class="math-inline">\{host\}\:</span>{port} is already in use.`);
            } else if (err.code === 'EACCES') {
                console.error(`Error: Port ${port} requires elevated privileges.`);
            } else {
                console.error(`Server error: ${err.message}`);
            }
            process.exit(1);
        });