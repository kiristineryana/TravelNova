// server.js - serves all site files and handles saving reviews and bookings
// uses only built-in Node.js modules so no npm install is needed
const http = require('http');
const fs   = require('fs');
const path = require('path');

// paths to the data files the server writes new reviews and bookings into
const REVIEWS_FILE  = path.join('..', 'data', 'reviews.json');
const BOOKINGS_FILE = path.join('..', 'data', 'bookings.json');

// maps file extensions to content types so the browser knows how to handle each file
const mimeTypes = {
    '.html':  'text/html',
    '.js':    'text/javascript',
    '.css':   'text/css',
    '.json':  'application/json',
    '.jpg':   'image/jpeg',
    '.jpeg':  'image/jpeg',
    '.png':   'image/png'
};

// every request from the browser comes through here - req is the request, res is the response
const server = http.createServer((req, res) => {

    // GET means the browser is asking for a file (html, css, js, image etc.)
    if (req.method === 'GET') {
        // strip the query string (e.g. ?package=9) before building the file path
        // otherwise the server would look for a file literally called "booking.html?package=9"
        const urlPath  = req.url.split('?')[0];
        const filePath = path.join('..', urlPath === '/' ? 'index.html' : urlPath);
        const ext = path.extname(filePath);

        fs.readFile(filePath, (err, content) => {
            if (err) {
                // file not found - send a 404 error back to the browser
                res.writeHead(404);
                res.end('File not found');
            } else {
                // file found - send it with the correct content type
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
                res.end(content);
            }
        });
    }

    // POST /add_review - saves a new review submitted from the reviews page into reviews.json
    // reviews.json is created automatically if it does not exist yet
    else if (req.method === 'POST' && req.url === '/add_review') {
        // POST data can arrive in multiple chunks, so we collect them all before parsing
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const newReview = JSON.parse(body);
            let data = { reviews: [] };
            try {
                const raw = fs.readFileSync(REVIEWS_FILE, 'utf8');
                if (raw) data = JSON.parse(raw);
            } catch (err) {}
            data.reviews.push(newReview);
            fs.writeFileSync(REVIEWS_FILE, JSON.stringify(data, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'success' }));
        });
    }

    // POST /add_booking - saves a new booking from the booking form into bookings.json
    // bookings.json is created automatically if it does not exist yet
    else if (req.method === 'POST' && req.url === '/add_booking') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const newBooking = JSON.parse(body);
            let data = { bookings: [] };
            try {
                const raw = fs.readFileSync(BOOKINGS_FILE, 'utf8');
                if (raw) data = JSON.parse(raw);
            } catch (err) {}
            data.bookings.push(newBooking);
            fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'success' }));
        });
    }

    // any other request that does not match a route above gets a 404
    else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// start the server on port 8080 - open http://localhost:8080/index.html to view the site
server.listen(8080, () => {
    console.log('TravelNova server running at http://localhost:8080');
});
