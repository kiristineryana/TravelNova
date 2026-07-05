# TravelNova – Company Profile Web Application

TravelNova is a full-stack travel-agency web application that lets users explore
destinations, filter and compare tour packages, estimate trip costs with a budget
calculator, read and submit reviews, and make booking enquiries — all in a
responsive interface for desktop, tablet, and mobile.

Built for CSIT128 (Introduction to Web Technology) at the University of Wollongong
in Dubai.

## Features
- Dynamic content loaded from JSON via the Fetch API (no hard-coded data)
- Live search and region/budget filtering
- Interactive budget calculator
- Image gallery slider
- Client-side form validation on booking and review forms
- Node.js server that saves user submissions (bookings & reviews) to JSON

## Tech Stack
- **Frontend:** HTML5, CSS3, vanilla JavaScript (ES6)
- **Backend:** Node.js (built-in `http`, `fs`, `path` modules — no dependencies)
- **Data:** JSON files (`data.json`, `bookings.json`, `reviews.json`)

## Getting Started
```bash
node server.js
```
Then open **http://localhost:8080** in your browser.

## Project Structure
- `index.html`, `destinations.html`, `packages.html`, `booking.html`, `reviews.html`, `about.html` – pages
- `css/style.css` – shared external stylesheet
- `js/main.js` – shared external script (fetching, rendering, filtering, validation)
- `server/server.js` – Node.js server (file serving + POST routes)
- `data/` – JSON data files

## Team
Built as a group project by [your names].
