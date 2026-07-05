// main.js — handles all dynamic content for TravelNova
// fetches data.json on load then calls every render and setup function for the current page

// new reviews submitted via the form are saved server-side into data/reviews.json
// instead of data.json, so we fetch both and merge them before rendering
document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
    fetch('data/data.json').then(r => r.json()),
    fetch('data/reviews.json').then(r => r.ok ? r.json() : { reviews: [] }).catch(() => ({ reviews: [] }))
  ])
    .then(([data, extra]) => {
      data.reviews = [...extra.reviews, ...data.reviews];
      init(data);
    })
    .catch(err => console.warn('Failed to load data:', err));
});
// entry point called once data.json is loaded
// each function checks if its target element exists so it is safe to call all of them on every page
function init(data) {
  const { destinations, packages, reviews, gallery } = data;
  renderFeaturedDestinations(destinations);
  renderPackagesPreview(packages, destinations);
  renderReviewsPreview(reviews);
  renderGallery(gallery);
  renderAllDestinations(destinations);
  renderAllPackages(packages, destinations);
  renderAllReviews(reviews);
  populateDropdowns(destinations, packages);
  renderAboutPage(data);
  setupReviewForm(reviews);
  setupBookingForm();
  setupBudgetCalculatorAdvanced(packages);
}
// ================================================================
// DESTINATIONS
// ================================================================
// renders the 2 featured destination cards on the home page
function renderFeaturedDestinations(destinations) {
  const container = document.getElementById('destinations-container');
  if (!container) return;
  container.innerHTML = destinations.slice(0, 2).map(destinationCard).join('');
}
// renders the full destinations grid on the destinations page and sets up the filter controls
function renderAllDestinations(destinations) {
  const grid = document.getElementById('destinations-grid');
  if (!grid) return;
  grid.innerHTML = destinations.map(destinationCard).join('');
  setupDestinationFilter(destinations, grid);
}
// builds a destination card — used for both the home page featured grid and the full destinations page
function destinationCard(d) {
  return `
    <div class="destination-card" data-region="${d.region}">
      <img src="${d.image}" alt="${d.name}" loading="lazy"
           onerror="this.src='images/destinations-bg.jpg'" />
      <div class="card-body">
        <h3>${d.name}</h3>
        <p>${d.description}</p>
        <a href="packages.html?destination=${d.id}" class="btn btn-primary dest-view-btn">View Packages</a>
      </div>
    </div>`;
}

// wires up the search input and region dropdown on the destinations page
// the user can type or pick a region and click Filter to narrow down results
function setupDestinationFilter(destinations, grid) {
  const searchInput = document.getElementById('search-input');
  const regionFilter = document.getElementById('region-filter');
  const filterBtn = document.getElementById('filter-btn');
  if (!filterBtn) return;

  function applyFilter() {
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const region = regionFilter ? regionFilter.value : 'all';
    const filtered = destinations.filter(d => {
      const matchRegion = region === 'all' || d.region === region;
      const matchSearch = d.name.toLowerCase().includes(search) ||
                          d.description.toLowerCase().includes(search);
      return matchRegion && matchSearch;
    });
    grid.innerHTML = filtered.length
      ? filtered.map(destinationCard).join('')
      : '<p style="grid-column:1/-1;text-align:center">No destinations found.</p>';
  }

  filterBtn.addEventListener('click', applyFilter);
  if (searchInput) {
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyFilter(); });
  }
}
// ================================================================
// PACKAGES
// ================================================================
// renders the 2 featured package cards on the home page as a preview
function renderPackagesPreview(packages, destinations) {
  const container = document.getElementById('packages-container');
  if (!container) return;
  container.innerHTML = packages.slice(0, 2)
    .map(p => packageCardCompact(p, destinations)).join('');
}
// builds a compact package card - the Book Now link passes the package id
// so the booking page can pre-select it in the budget calculator automatically
function packageCardCompact(p, destinations) {
  const dest = destinations.find(d => d.id === p.destination_id);
  const img  = p.image || (dest ? dest.image : 'images/destinations-bg.jpg');
  return `
    <div class="package-card package-card--featured">
      <img src="${img}" alt="${p.name}" loading="lazy"
           onerror="this.src='images/destinations-bg.jpg'" />
      <h3>${p.name}</h3>
      <div class="package-price">$${p.price_per_person.toLocaleString()} <span>/ person</span></div>
      <a href="booking.html?package=${p.id}" class="btn btn-primary">Book Now</a>
    </div>`;
}

// renders all package cards on the packages page and sets up the filter dropdowns
function renderAllPackages(packages, destinations) {
  const container = document.getElementById('packages-cards-container');
  if (!container) return;
  container.innerHTML = packages.map(p => packageCard(p, destinations)).join('');
  setupPackageFilter(packages, destinations, container);
}

// builds a full package card including the includes list and price
function packageCard(p, destinations) {
  const dest = destinations.find(d => d.id === p.destination_id);
  const img  = p.image || (dest ? dest.image : 'images/destinations-bg.jpg');
  return `
    <div class="package-card">
      <img src="${img}" alt="${p.name}" loading="lazy"
           onerror="this.src='images/destinations-bg.jpg'" />
      <h3>${p.name}</h3>
      <ul><li>Type: ${p.packageType}</li>${p.includes.map(i => `<li>${i}</li>`).join('')}</ul>
      <div class="package-price">$${p.price_per_person.toLocaleString()} <span>/ person</span></div>
      <a href="booking.html?package=${p.id}" class="btn btn-primary">Book Now</a>
    </div>`;
}

// wires up the destination and budget type dropdowns on the packages page
// also reads ?destination= from the url so View Packages links auto-filter the grid
function setupPackageFilter(packages, destinations, container) {
  const budgetFilter      = document.getElementById('budget-filter');
  const destinationFilter = document.getElementById('destination-filter');
  const filterBtn         = document.getElementById('filter-btn');
  if (!filterBtn) return;

  if (destinationFilter) {
    destinations.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name;
      destinationFilter.appendChild(opt);
    });
  }

  function applyFilter() {
    const budget = budgetFilter ? budgetFilter.value : 'all';
    // parse as number because destination_id in the data is also a number
    const destId = destinationFilter && destinationFilter.value !== 'all'
                 ? parseInt(destinationFilter.value) : 'all';

    const filtered = packages.filter(p => {
      const matchBudget = budget === 'all' || p.category === budget;
      const matchDest   = destId  === 'all' || p.destination_id === destId;
      return matchBudget && matchDest;
    });

    container.innerHTML = filtered.length
      ? filtered.map(p => packageCard(p, destinations)).join('')
      : '<p style="grid-column:1/-1;text-align:center">No packages match your filters.</p>';
  }

  filterBtn.addEventListener('click', applyFilter);

  const preselected = new URLSearchParams(window.location.search).get('destination');
  if (preselected && destinationFilter) {
    destinationFilter.value = preselected;
    applyFilter();
  }
}
// ================================================================
// GALLERY
// ================================================================
let currentSlide = 0;
let galleryItems = [];

// sets up the image carousel on the home page and wires the prev/next buttons
// modulo arithmetic makes the slider wrap around from last to first and vice versa
function renderGallery(gallery) {
  const container = document.getElementById('slides-container');
  if (!container) return;
  galleryItems = gallery;
  showSlide(0);
  document.getElementById('prev-slide')?.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + galleryItems.length) % galleryItems.length;
    showSlide(currentSlide);
  });
  document.getElementById('next-slide')?.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % galleryItems.length;
    showSlide(currentSlide);
  });
}
// renders the image and caption for the slide at the given index
// the caption also shows a counter like (2 / 5) so the user knows how many slides there are
function showSlide(index) {
  const container = document.getElementById('slides-container');
  if (!container || !galleryItems.length) return;
  const item = galleryItems[index];
  container.innerHTML = `
    <div class="slide">
      <img src="${item.image}" alt="${item.caption}"
           onerror="this.src='images/destinations-bg.jpg'" />
      <div class="slide-caption">${item.caption} &nbsp;(${index + 1} / ${galleryItems.length})</div>
    </div>`;
}
// ================================================================
// DROPDOWNS
// ================================================================
// populates the destination dropdowns on the booking and review forms
// and the package dropdown on the booking form, all from data.json
function populateDropdowns(destinations, packages) {
  ['destination', 'review-destination'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    destinations.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.name;
      opt.textContent = d.name;
      el.appendChild(opt);
    });
  });

  const pkgSelect = document.getElementById('package-select');
  if (pkgSelect) {
    packages.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      pkgSelect.appendChild(opt);
    });
  }
}
// ================================================================
// REVIEWS
// ================================================================
// renders 3 review cards as a preview on the home page
// skips if we are on the reviews page (leave-review section present) since renderAllReviews handles that
function renderReviewsPreview(reviews) {
  if (document.getElementById('leave-review')) return;
  const container = document.getElementById('reviews-container');
  if (!container) return;
  container.innerHTML = reviews.slice(0, 3).map(reviewCard).join('');
}

// renders all reviews on the reviews page only
function renderAllReviews(reviews) {
  if (!document.getElementById('leave-review')) return;
  const container = document.getElementById('reviews-container');
  if (!container) return;
  container.innerHTML = reviews.map(reviewCard).join('');
}
// builds a single review card with the date formatted as "15 November 2024"
function reviewCard(r) {
  return `
    <div class="review-card">
      <span class="reviewer-name">${r.reviewer_name}</span>
      <span class="review-destination">${r.destination}</span>
      <span class="review-rating">${'★'.repeat(r.rating)}</span>
      <p class="review-text">${r.review_text}</p>
      <span class="review-date">${new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    </div>`;
}
// ================================================================
// ABOUT PAGE
// ================================================================
// populates all four sections on the about page from data.json
// renders company history, milestone timeline, awards and founder flip cards
function renderAboutPage(data) {
  const historyEl = document.getElementById('company-history');
  if (historyEl) historyEl.innerHTML = `<p>${data.company.history}</p>`;

  const timelineEl = document.getElementById('timeline-container');
  if (timelineEl) {
    const rows = data.timeline.map(t => `
      <tr>
        <td class="timeline-year">${t.year}</td>
        <td class="timeline-title">${t.title}</td>
        <td class="timeline-description">${t.description}</td>
      </tr>`).join('');
    timelineEl.innerHTML = `
      <table class="timeline-table">
        <thead><tr><th>Year</th><th>Milestone</th><th>Details</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }
  const awardsEl = document.getElementById('awards-container');
  if (awardsEl) {
    awardsEl.innerHTML = data.awards.map(a => `
      <div class="award-card">
        <h3>${a.title}</h3>
        <p>${a.issuer} - ${a.year}</p>
      </div>`).join('');
  }
  const foundersEl = document.getElementById('founders-container');
  if (foundersEl) {
    foundersEl.innerHTML = data.founders.map(f => `
      <div class="founder-flip-card">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <h3>${f.name}</h3>
            <p class="founder-role">${f.role}</p>
          </div>
          <div class="flip-card-back">
            <p class="founder-bio">${f.bio}</p>
          </div>
        </div>
      </div>`).join('');
  }
}
// ================================================================
// REVIEW FORM
// ================================================================
// validates the review form, adds the new review to the page instantly,
// and sends it to the server to be saved permanently in reviews.json
function setupReviewForm(existingReviews) {
  const form = document.getElementById('review-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();
    const name   = document.getElementById('reviewer-name').value.trim();
    const email  = document.getElementById('reviewer-email').value.trim();
    const dest   = document.getElementById('review-destination').value;
    const rating = document.getElementById('review-rating').value;
    const text   = document.getElementById('review-text').value.trim();
    let valid = true;
    if (!name) { showError('reviewer-name-error','Name is required.');valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('reviewer-email-error','Please enter a valid email.');valid = false; }
    if (!dest) { showError('review-destination-error', 'Please select a destination.'); valid = false; }
    if (!rating) { showError('review-rating-error','Please select a rating.');valid = false; }
    if (!text) { showError('review-text-error','Review text is required.');valid = false; }
    if (!valid) return;
    const newReview = {
      id: Date.now(),
      reviewer_name: name,
      destination: dest,
      rating: parseInt(rating),
      review_text: text,
      date: new Date().toISOString().split('T')[0]
    };
    // add to the top of the list and re-render immediately so the user sees it straight away
    existingReviews.unshift(newReview);
    const container = document.getElementById('reviews-container');
    if (container) container.innerHTML = existingReviews.map(reviewCard).join('');
    // also POST to the server so the review is saved to data/reviews.json
    fetch('/add_review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview)
    }).catch(err => console.warn('Failed to save review:', err));
    alert('Thank you for your review!');
    form.reset();
  });
}
// ================================================================
// BUDGET CALCULATOR
// ================================================================
// sets up the budget calculator on the booking page
// reads ?package= from the url to pre-select the package when arriving via Book Now
function setupBudgetCalculatorAdvanced(packages) {
  const pkgSelect = document.getElementById('calc-package');
  const calcBtn   = document.getElementById('calc-budget-btn');
  const resultEl  = document.getElementById('calc-budget-result');
  if (!pkgSelect || !calcBtn) return;

  packages.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} — $${p.price_per_person.toLocaleString()} / person`;
    pkgSelect.appendChild(opt);
  });
  const preselected = new URLSearchParams(window.location.search).get('package');
  if (preselected) pkgSelect.value = preselected;

  // clear the old breakdown whenever the user picks a different package, since it no longer applies
  pkgSelect.addEventListener('change', () => { if (resultEl) resultEl.innerHTML = ''; });
  calcBtn.addEventListener('click', () => {
    const pkgId     = pkgSelect.value;
    const travelers = parseInt(document.getElementById('calc-travelers-count').value);
    const pkgErr    = document.getElementById('calc-package-error');
    const travErr   = document.getElementById('calc-travelers-error');

    if (pkgErr)  pkgErr.textContent  = '';
    if (travErr) travErr.textContent = '';
    let valid = true;
    if (!pkgId)                      { if (pkgErr)  pkgErr.textContent  = 'Please select a package.';           valid = false; }
    if (!travelers || travelers < 1) { if (travErr) travErr.textContent = 'Please enter at least 1 traveller.'; valid = false; }
    if (!valid) return;
    const pkg = packages.find(p => p.id === parseInt(pkgId));
    if (!pkg) return;

    const hasInsurance = document.getElementById('extra-insurance')?.checked;
    const hasPickup    = document.getElementById('extra-pickup')?.checked;
    const hasTour      = document.getElementById('extra-tour')?.checked;
    const hasMeal      = document.getElementById('extra-meal')?.checked;

    const packageTotal  = pkg.price_per_person * travelers;
    const insuranceCost = hasInsurance ? 50  * travelers : 0;
    const pickupCost    = hasPickup    ? 40              : 0;
    const tourCost      = hasTour      ? 100 * travelers : 0;
    const mealCost      = hasMeal      ? 75  * travelers : 0;
    // tax is applied to the base package price only, not to the extras
    const taxAmount     = Math.round(packageTotal * 0.05);
    const grandTotal    = packageTotal + insuranceCost + pickupCost + tourCost + mealCost + taxAmount;

    const extrasLines = [];
    if (hasInsurance) extrasLines.push(`<div class="calc-line"><span>Travel Insurance ×${travelers}</span><span>$${insuranceCost.toLocaleString()}</span></div>`);
    if (hasPickup)    extrasLines.push(`<div class="calc-line"><span>Airport Pickup Upgrade</span><span>$${pickupCost.toLocaleString()}</span></div>`);
    if (hasTour)      extrasLines.push(`<div class="calc-line"><span>Extra Guided Tour ×${travelers}</span><span>$${tourCost.toLocaleString()}</span></div>`);
    if (hasMeal)      extrasLines.push(`<div class="calc-line"><span>Meal Upgrade ×${travelers}</span><span>$${mealCost.toLocaleString()}</span></div>`);
    extrasLines.push(`<div class="calc-line"><span>Service Tax (5%)</span><span>$${taxAmount.toLocaleString()}</span></div>`);

    resultEl.innerHTML = `
      <div class="calc-result-header">
        <span class="calc-result-name">${pkg.name}</span>
      </div>
      <div class="calc-breakdown">
        <div class="calc-line"><span>Package Cost ×${travelers}</span><span>$${packageTotal.toLocaleString()}</span></div>
        ${extrasLines.join('')}
        <div class="calc-line calc-total"><span>Estimated Total</span><span>$${grandTotal.toLocaleString()}</span></div>
      </div>`;
    // carry the calculated total and chosen extras over to the booking form's hidden fields
    const selectedExtras = [];
    if (hasInsurance) selectedExtras.push('Travel Insurance');
    if (hasPickup)    selectedExtras.push('Airport Pickup Upgrade');
    if (hasTour)      selectedExtras.push('Extra Guided Tour');
    if (hasMeal)      selectedExtras.push('Meal Upgrade');
    const estimatedTotalEl = document.getElementById('estimated-total');
    const selectedExtrasEl = document.getElementById('selected-extras-hidden');
    if (estimatedTotalEl) estimatedTotalEl.value = grandTotal;
    if (selectedExtrasEl) selectedExtrasEl.value = selectedExtras.join(', ');
  });
}
// ================================================================
// BOOKING FORM
// ================================================================
// validates all required booking fields and sends the booking to the server
// the booking gets saved to bookings.json for the team to review
function setupBookingForm() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();
    let valid = true;
    const name  = document.getElementById('full-name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const dest  = document.getElementById('destination')?.value;
    const date  = document.getElementById('travel-date')?.value;
    const count = document.getElementById('travelers-count')?.value;
    if (!name) { showError('full-name-error','Full name is required.');valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('email-error','Valid email is required.');valid = false; }
    if (!phone) { showError('phone-error','Phone number is required.');valid = false; }
    if (!dest) { showError('destination-error','Please select a destination.');valid = false; }
    if (!date) { showError('travel-date-error','Travel date is required.');valid = false; }
    if (!count) { showError('travelers-count-error','Number of travellers is required.'); valid = false; }
    if (!valid) return;
    const booking = {
      id: Date.now(),
      full_name: name,
      email,
      phone,
      destination: dest,
      travel_date: date,
      travelers_count: parseInt(count),
      package: document.getElementById('package-select')?.value || '',
      trip_type: document.getElementById('trip-type')?.value || '',
      special_requests: document.getElementById('special-requests')?.value.trim() || '',
      estimated_total: document.getElementById('estimated-total')?.value || '',
      selected_extras: document.getElementById('selected-extras-hidden')?.value || '',
      submitted_at: new Date().toISOString()
    };

    // POST to the server so the booking is saved to data/bookings.json
    fetch('/add_booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    }).catch(err => console.warn('Failed to save booking:', err));

    alert('Booking submitted! We will confirm within 24 hours.');
    form.reset();
  });
}
// ================================================================
// UTILITIES
// ================================================================
// shows an error message under a form field by finding the error span by its id
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
// clears all visible error messages on the page before re-validating
function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
}
