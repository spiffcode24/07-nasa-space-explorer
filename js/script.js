// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.getElementById('getImagesButton');
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModalButton');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalDescription = document.getElementById('modalDescription');
const didYouKnowFact = document.getElementById('didYouKnowFact');

let currentImageItems = [];
let reactionByIndex = {};

// Public NASA API key for demo projects
const apiKey = '5dDZsyMsQiizXwYq8oCqpadAhtbi7NcaMG9QMoGK';
const apiBaseUrl = 'https://api.nasa.gov/planetary/apod';

// Space facts for the "Did You Know?" panel
const spaceFacts = [
	'The footprints left by Apollo astronauts on the Moon can stay there for millions of years.',
	'One day on Venus is longer than one year on Venus.',
	'Jupiter is so large that more than 1,300 Earths could fit inside it.',
	'The International Space Station travels around Earth at about 17,500 miles per hour.',
	'Neutron stars can spin hundreds of times every second.',
	'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.'
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Build the URL used to request APOD data for a date range
function buildApiUrl(startDate, endDate) {
	return `${apiBaseUrl}?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;
}

// Show a centered message in the gallery area
function showGalleryMessage(icon, message) {
	gallery.innerHTML = `
		<div class="placeholder col-12">
			<div class="placeholder-panel">
				<div class="placeholder-icon">${icon}</div>
				<p class="mb-0">${message}</p>
			</div>
		</div>
	`;
}

// Pick and display one random fact when the page loads
function showRandomFact() {
	if (!didYouKnowFact) {
		return;
	}

	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	didYouKnowFact.textContent = spaceFacts[randomIndex];
}

// Render APOD image cards in the gallery
function renderGalleryItems(apodItems) {
	const imageItems = apodItems.filter((item) => item.media_type === 'image');
	currentImageItems = imageItems;
	reactionByIndex = {};

	if (imageItems.length === 0) {
		showGalleryMessage('🛰️', 'No image posts were found for this range. Try different dates.');
		return;
	}

	const cardsHtml = imageItems
		.map((item, index) => {
			const imageUrl = item.url;
			const title = item.title || 'Untitled NASA Image';
			const description = item.explanation || 'No description available.';
			const date = item.date || '';
			const isLiked = reactionByIndex[index] === 'like';
			const isDisliked = reactionByIndex[index] === 'dislike';

			return `
				<div class="col-12 col-md-6 col-xl-4">
					<article class="gallery-item card h-100 shadow-sm">
						<img src="${imageUrl}" alt="${title}" loading="lazy" class="card-img-top gallery-image" data-index="${index}" />
						<div class="card-body d-flex flex-column">
							<h2 class="h5 card-title">${title}</h2>
							<p class="text-secondary small mb-2">${date}</p>
							<p class="card-text card-text-preview mb-3" aria-label="Preview of image description">${description}</p>
							<div class="d-flex align-items-center justify-content-between mt-auto">
								<button type="button" class="btn btn-danger btn-sm open-modal-btn" data-index="${index}">Details</button>
								<div class="d-flex align-items-center gap-2">
									<button type="button" class="btn btn-sm ${isLiked ? 'btn-success' : 'btn-outline-success'} reaction-btn like-btn" data-index="${index}" aria-label="Like" aria-pressed="${isLiked}">👍</button>
									<button type="button" class="btn btn-sm ${isDisliked ? 'btn-danger' : 'btn-outline-danger'} reaction-btn dislike-btn" data-index="${index}" aria-label="Dislike" aria-pressed="${isDisliked}">👎</button>
								</div>
							</div>
						</div>
					</article>
				</div>
			`;
		})
		.join('');

	gallery.innerHTML = cardsHtml;
}

// Update the look of like/dislike buttons for one card
function updateReactionButtons(cardElement, itemIndex) {
	const likeButton = cardElement.querySelector('.like-btn');
	const dislikeButton = cardElement.querySelector('.dislike-btn');
	const reaction = reactionByIndex[itemIndex];
	const isLiked = reaction === 'like';
	const isDisliked = reaction === 'dislike';

	likeButton.classList.toggle('btn-success', isLiked);
	likeButton.classList.toggle('btn-outline-success', !isLiked);
	likeButton.setAttribute('aria-pressed', String(isLiked));

	dislikeButton.classList.toggle('btn-danger', isDisliked);
	dislikeButton.classList.toggle('btn-outline-danger', !isDisliked);
	dislikeButton.setAttribute('aria-pressed', String(isDisliked));
}

// Fill and show the modal with one selected APOD image
function openImageModal(imageItem) {
	modalImage.src = imageItem.hdurl || imageItem.url;
	modalImage.alt = imageItem.title || 'NASA image';
	modalTitle.textContent = imageItem.title || 'Untitled NASA Image';
	modalDate.textContent = imageItem.date || '';
	modalDescription.textContent = imageItem.explanation || 'No description available.';

	imageModal.classList.add('is-visible');
	imageModal.setAttribute('aria-hidden', 'false');
	document.body.classList.add('modal-open');
}

function closeImageModal() {
	imageModal.classList.remove('is-visible');
	imageModal.setAttribute('aria-hidden', 'true');
	document.body.classList.remove('modal-open');
}

// Request APOD data and update the gallery
async function fetchAndDisplayImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		showGalleryMessage('⚠️', 'Please choose both a start date and end date.');
		return;
	}

	if (startDate > endDate) {
		showGalleryMessage('⚠️', 'Start date cannot be after end date.');
		return;
	}

	getImagesButton.disabled = true;
	getImagesButton.textContent = 'Loading...';
	showGalleryMessage('🚀', 'Fetching space images from NASA...');

	try {
		const requestUrl = buildApiUrl(startDate, endDate);
		const response = await fetch(requestUrl);

		if (!response.ok) {
			throw new Error(`NASA request failed with status ${response.status}`);
		}

		const data = await response.json();
		const apodItems = Array.isArray(data) ? data : [data];
		const newestFirst = apodItems.sort((a, b) => (a.date < b.date ? 1 : -1));

		renderGalleryItems(newestFirst);
	} catch (error) {
		showGalleryMessage('❌', 'Could not load images right now. Please try again.');
		console.error('Failed to fetch NASA APOD data:', error);
	} finally {
		getImagesButton.disabled = false;
		getImagesButton.textContent = 'Get Space Images';
	}
}

// Let users fetch images with the button
getImagesButton.addEventListener('click', fetchAndDisplayImages);

// Also refresh automatically when users change a date
startInput.addEventListener('change', fetchAndDisplayImages);
endInput.addEventListener('change', fetchAndDisplayImages);

// Open the modal from either the image or the button in each card
gallery.addEventListener('click', (event) => {
	const reactionButton = event.target.closest('.reaction-btn');

	if (reactionButton) {
		const itemIndex = Number(reactionButton.dataset.index);
		const cardElement = reactionButton.closest('.gallery-item');
		const nextReaction = reactionButton.classList.contains('like-btn') ? 'like' : 'dislike';

		reactionByIndex[itemIndex] = reactionByIndex[itemIndex] === nextReaction ? null : nextReaction;
		updateReactionButtons(cardElement, itemIndex);
		return;
	}

	const modalTrigger = event.target.closest('.open-modal-btn, .gallery-image');

	if (!modalTrigger) {
		return;
	}

	const itemIndex = Number(modalTrigger.dataset.index);
	const selectedItem = currentImageItems[itemIndex];

	if (selectedItem) {
		openImageModal(selectedItem);
	}
});

closeModalButton.addEventListener('click', closeImageModal);

imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		closeImageModal();
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && imageModal.classList.contains('is-visible')) {
		closeImageModal();
	}
});

// Load default date range images on first page load
showRandomFact();
fetchAndDisplayImages();
