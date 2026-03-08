
const REVIEWS_API_URL = "https://script.google.com/macros/s/AKfycbybF4cCn7LnAOUcG75-CUqktcV01k_OsAsGvnN1LFIiwL5PjmCq6jOc15DK3SoleZM/exec";

document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
});

/**
 * Fetch and Render Reviews
 */
async function loadReviews() {
    const container = document.getElementById('reviews-track');
    if (!container) return;

    try {
        const response = await fetch(REVIEWS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getReviews' })
        });
        const json = await response.json();

        if (!json.success) throw new Error("Error fetching reviews");

        // Filter: Only 'Publicado'
        const published = json.data.filter(r => r.Estado === 'Publicado');

        container.innerHTML = '';
        if (published.length === 0) {
            container.innerHTML = '<div class="review-empty">Sé el primero en dejar una reseña.</div>';
            return;
        }

        published.forEach((review, index) => {
            const card = createPrismCard(review);
            // Optionally add click pause or something, but for now simple
            container.appendChild(card);
        });

        // Start Carousel
        if (published.length > 0) {
            startReviewCarousel(container);
        }

    } catch (e) {
        console.error("Reviews Error:", e);
        container.innerHTML = '<div class="review-error">Opiniones no disponibles.</div>';
    }
}

let reviewInterval;

function startReviewCarousel(container) {
    const cards = container.querySelectorAll('.prism-card');
    if (cards.length === 0) return;

    let currentIndex = 0;

    // Show first immediately
    cards[0].classList.add('active');

    if (cards.length === 1) return; // No need to cycle if only one

    // Clear any existing interval to prevent duplicates on reload
    if (reviewInterval) clearInterval(reviewInterval);

    reviewInterval = setInterval(() => {
        // Fade out current
        cards[currentIndex].classList.remove('active');

        // Next index
        currentIndex = (currentIndex + 1) % cards.length;

        // Fade in next
        cards[currentIndex].classList.add('active');
    }, 6000); // 6 seconds per review
}

function createPrismCard(review) {
    const div = document.createElement('div');
    div.className = 'prism-card';

    const stars = '★'.repeat(parseInt(review.Puntuacion || 5));

    div.innerHTML = `
        <div class="prism-content">
            <div class="prism-quote">“</div>
            <p class="prism-text">${review.Comentario}</p>
            <div class="prism-footer">
                <span class="prism-author">${review.NombreCliente}</span>
                <span class="prism-stars">${stars}</span>
            </div>
            <div class="prism-shine"></div>
        </div>
    `;
    return div;
}

/**
 * Submit New Review
 */
async function submitReview(e) {
    e.preventDefault();

    const btn = document.getElementById('btn-submit-review');
    const originalText = btn.innerText;
    btn.innerText = 'Enviando...';
    btn.disabled = true;

    const data = {
        NombreCliente: document.getElementById('newReviewName').value,
        Puntuacion: document.querySelector('input[name="rating"]:checked')?.value || 5,
        Comentario: document.getElementById('newReviewText').value,
        EmailCliente: document.getElementById('newReviewEmail').value || '', // Optional
        Estado: 'Pendiente'
    };

    try {
        const response = await fetch(REVIEWS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'createReview', ...data })
        });
        const json = await response.json();

        if (json.success) {
            alert("¡Gracias! Tu reseña ha sido enviada y está pendiente de aprobación.");
            closeReviewModal();
            document.getElementById('reviewForm').reset();
        } else {
            alert("Error al enviar: " + json.error);
        }

    } catch (error) {
        console.error(error);
        alert("Error de conexión.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Modal Helpers
function openReviewModal() {
    document.getElementById('new-review-modal').classList.add('active');
}

function closeReviewModal() {
    document.getElementById('new-review-modal').classList.remove('active');
}
