
/**
 * CONTENT LOADER (News & Promos)
 * Handles fetching and rendering of 'ContenidoDinamico' from Sheet.
 */

const CONTENT_API_URL = "https://script.google.com/macros/s/AKfycbybF4cCn7LnAOUcG75-CUqktcV01k_OsAsGvnN1LFIiwL5PjmCq6jOc15DK3SoleZM/exec";

document.addEventListener('DOMContentLoaded', () => {
    // Check which page we are on
    if (document.getElementById('promo-banner-container')) {
        loadPromotions();
    }

    if (document.getElementById('news-hero')) {
        loadNewsPage();
    }

    if (document.getElementById('article-container')) {
        loadSingleArticle();
    }

    if (document.getElementById('latest-news-container')) {
        loadLatestNews();
    }
});

/**
 * 0. LATEST NEWS (Index Snippet)
 */
async function loadLatestNews() {
    const container = document.getElementById('latest-news-container');
    const CACHE_KEY = 'cache_news_home';

    // UI Loading
    container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--primary-gold);"><i class="fas fa-circle-notch fa-spin fa-2x"></i></div>';

    // 1. Force Clear Cache for Debugging (User reported issues)
    // AppCache.clear(CACHE_KEY); // Uncomment if needed, but let's just ignore cache if empty

    // 1. Cache
    const cached = AppCache.get(CACHE_KEY, 15);
    if (cached) {
        renderLatestNews(cached[0], container);
    }

    try {
        // Updated filter to 'Noticias' (Plural) per user report, handling potential mismatch
        const response = await fetch(CONTENT_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getContent', filters: { Categoria: 'Noticias' } })
        });
        const json = await response.json();

        // Validation check
        if (json.success && json.data.length > 0) {
            // Sort by Date Desc
            const sorted = json.data
                .filter(n => n.Estado === 'Publicado')
                .sort((a, b) => new Date(b.FechaPublicacion) - new Date(a.FechaPublicacion));

            if (sorted.length > 0) {
                AppCache.set(CACHE_KEY, sorted);
                // Always render fresh if available, even if cache existed (to update fix)
                renderLatestNews(sorted[0], container);
            } else {
                if (!cached) container.style.display = 'none';
            }
        } else {
            // If Noticias came back empty, maybe it really is Noticia?
            // Optional fallback logic could go here, but let's stick to user direction.
            if (!cached) container.style.display = 'none';
        }
    } catch (e) {
        console.error("News Load Error", e);
        if (!cached) container.style.display = 'none';
    }
}

function renderLatestNews(item, container) {
    if (!item) return;

    // Format Date
    const d = new Date(item.FechaPublicacion);
    const dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    // Template (Glass Card)
    container.innerHTML = `
        <div class="glass-card wide" style="height: auto; min-height: 250px; display: flex; flex-direction: row; overflow: hidden; margin-top: 50px;">
             <!-- Image Side (Mobile: hidden or stacked) -->
             <div style="flex: 1; min-width: 300px; position: relative;" class="news-img-side">
                 <img src="${item.MultimediaGeneralUrl || 'img/hero/barberia_heroimagen1.jpg'}" style="width: 100%; height: 100%; object-fit: cover;">
                 <div style="position: absolute; top: 15px; left: 15px; background: var(--primary-gold); color: #000; padding: 5px 15px; font-weight: bold; font-size: 0.8rem;">
                    NUEVO
                 </div>
             </div>
             <!-- Content Side -->
             <div style="flex: 1.5; padding: 40px; display: flex; flex-direction: column; justify-content: center; background: rgba(0,0,0,0.6);">
                 <div style="color: #888; margin-bottom: 10px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">
                    <i class="far fa-calendar-alt"></i> ${dateStr}
                 </div>
                 <h3 style="font-family: 'Oswald', sans-serif; font-size: 2rem; color: #fff; margin-bottom: 15px; line-height: 1.1;">
                    ${item.Titulo}
                 </h3>
                 <p style="color: #ccc; font-size: 1rem; margin-bottom: 25px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    ${item.Extracto || 'Lee la noticia completa...'}
                 </p>
                 <a href="noticia.html?id=${item.ID}" class="btn-outline-gold" style="align-self: flex-start;">
                    LEER NOTICIA <i class="fas fa-arrow-right"></i>
                 </a>
             </div>
        </div>
        
        <style>
            @media(max-width: 768px) {
                .glass-card.wide { flex-direction: column !important; }
                .news-img-side { height: 200px; }
            }
        </style>
    `;
}

/**
 * 1. PROMOTIONS (Banner on Index)
 */
async function loadPromotions() {
    const container = document.getElementById('promo-banner-container');
    const CACHE_KEY = 'cache_promos';

    // 1. Try Cache
    const cached = AppCache.get(CACHE_KEY, 10);
    if (cached) {
        console.log("Loading Promos from Cache");
        renderPromosFromData(cached, container);
    }

    try {
        const response = await fetch(CONTENT_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getContent', filters: { Categoria: 'Banner' } })
        });
        const json = await response.json();

        if (json.success && json.data.length > 0) {
            AppCache.set(CACHE_KEY, json.data);
            // Re-render only if we didn't have cache (or if you want to update live)
            if (!cached) renderPromosFromData(json.data, container);
        }
    } catch (e) {
        console.error("Error loading promos:", e);
    }
}

function renderPromosFromData(data, container) {
    const published = data.filter(p => p.Estado === 'Publicado');

    // Filter by Date (Optional: Client side check)
    const now = new Date();
    const active = published.filter(p => {
        const start = p.FechaInicio ? new Date(p.FechaInicio) : null;
        const end = p.FechaFin ? new Date(p.FechaFin) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;
        return true;
    });

    if (active.length > 0) {
        renderPromoBanner(active, container); // Pass ALL active promos
    } else {
        container.classList.add('hidden');
    }
}

function renderPromoBanner(promos, container) {
    // If array passed, handle multiple
    if (!Array.isArray(promos)) promos = [promos];

    if (promos.length === 1) {
        // Single Render
        const promo = promos[0];
        container.innerHTML = getPromoHTML(promo);
    } else {
        // Carousel Render
        let currentIndex = 0;

        const updatePromo = () => {
            container.innerHTML = getPromoHTML(promos[currentIndex]);

            // Add dots/indicators if needed, or just auto-cycle
            // Let's add simple dots overlay
            const dotsHTML = `<div class="promo-dots" style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); display:flex; gap:5px; z-index:10;">
                ${promos.map((_, i) => `<span style="width:8px; height:8px; border-radius:50%; background:${i === currentIndex ? '#fff' : 'rgba(255,255,255,0.5)'}; display:block;"></span>`).join('')}
            </div>`;
            container.querySelector('.promo-bar').insertAdjacentHTML('beforeend', dotsHTML);
        };

        updatePromo();

        // Auto Cycle
        if (window.promoInterval) clearInterval(window.promoInterval);
        window.promoInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % promos.length;
            updatePromo();
        }, 5000); // 5 seconds
    }

    container.classList.remove('hidden');
}

function getPromoHTML(promo) {
    return `
        <div class="promo-bar" style="position:relative;">
            <div class="promo-content">
                <span class="promo-tag">OFERTA ESPECIAL</span>
                <h3 class="promo-title">${promo.Titulo}</h3>
                <p class="promo-desc">${promo.Subtitulo || ''}</p>
                <a href="${promo.EnlaceAccion || '#reserva'}" class="btn-promo">APROVECHAR</a>
            </div>
            <div class="promo-visual">
                <img src="${resolveThumbnail(promo.MultimediaGeneralUrl)}" alt="Promo" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='img/hero/barberia_heroimagen1.jpg';">
            </div>
        </div>
    `;
}

/**
 * 2. NEWS PAGE (noticias.html)
 */
async function loadNewsPage() {
    const CACHE_KEY = 'cache_news';

    // 1. Try Cache
    const cached = AppCache.get(CACHE_KEY, 10);
    if (cached) {
        console.log("Loading News from Cache");
        renderNewsFromData(cached);
    }

    try {
        const response = await fetch(CONTENT_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getContent', filters: { Categoria: 'Noticias' } })
        });
        const json = await response.json();

        if (!json.success) throw new Error("API Error");

        AppCache.set(CACHE_KEY, json.data);
        if (!cached) renderNewsFromData(json.data);

    } catch (e) {
        console.error("Error loading news:", e);
    }
}

function renderNewsFromData(data) {
    const articles = data.filter(a => a.Estado === 'Publicado');

    if (articles.length === 0) {
        document.getElementById('news-hero').innerHTML = '<div class="no-news">No hay noticias publicadas.</div>';
        return;
    }

    articles.reverse();
    renderHeroNews(articles[0]);
    renderNewsGrid(articles.slice(1));
}

function renderHeroNews(article) {
    const hero = document.getElementById('news-hero');
    hero.innerHTML = `
        <div class="hero-news-bg" style="background-image: url('${resolveThumbnail(article.MultimediaGeneralUrl)}');"></div>
        <div class="hero-news-overlay"></div>
        <div class="hero-news-content">
            <span class="news-date">${formatDate(article.FechaPublicacion)}</span>
            <h1 class="news-headline">${article.Titulo}</h1>
            <p class="news-excerpt">${article.Subtitulo || ''}</p>
            <a href="noticia.html?id=${article.ID}" class="btn-read-more">LEER ARTÍCULO <i class="fas fa-arrow-right"></i></a>
        </div>
    `;
}

function renderNewsGrid(articles) {
    const grid = document.getElementById('news-grid');
    grid.innerHTML = '';

    articles.forEach(art => {
        const card = document.createElement('article');
        card.className = 'news-card';
        card.innerHTML = `
            <div class="news-card-img">
                <img src="${resolveThumbnail(art.MultimediaGeneralUrl)}" alt="${art.Titulo}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='img/hero/barberia_heroimagen2.jpg';">
            </div>
            <div class="news-card-body">
                <span class="news-card-date">${formatDate(art.FechaPublicacion)}</span>
                <h3 class="news-card-title">${art.Titulo}</h3>
                <a href="noticia.html?id=${art.ID}" class="news-card-link">Leer más</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

/**
 * 3. SINGLE ARTICLE (noticia.html)
 */
async function loadSingleArticle() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        window.location.href = 'noticias.html';
        return;
    }

    // Try finding in cache first to save a fetch
    const CACHE_KEY = 'cache_news';
    const cached = AppCache.get(CACHE_KEY, 10);

    if (cached) {
        const article = cached.find(a => a.ID.toString() === id.toString());
        if (article) {
            console.log("Loading Single Article from Cache");
            renderArticleReader(article);
            // We can return here, OR fetch in background update if we suspect details changed. 
            // Usually irrelevant for simpler blogs. Return is fine for max speed.
            return;
        }
    }

    try {
        const response = await fetch(CONTENT_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getContent', filters: { Categoria: 'Noticias' } })
        });
        const json = await response.json();

        AppCache.set(CACHE_KEY, json.data);
        const article = json.data.find(a => a.ID.toString() === id.toString());

        if (article) {
            renderArticleReader(article);
        } else {
            document.getElementById('article-container').innerHTML = '<p>Artículo no encontrado.</p>';
        }

    } catch (e) {
        console.error(e);
    }
}

function renderArticleReader(article) {
    const header = document.getElementById('article-header');
    const bodyContainer = document.getElementById('article-body');

    document.getElementById('article-title').innerText = article.Titulo;
    document.getElementById('article-meta').innerHTML = `Por <span class="author">${article.Autor || 'Redacción'}</span> &bull; ${formatDate(article.FechaPublicacion)}`;

    // Media Embedding (If Video)
    let mediaHtml = '';
    const mainUrl = article.MultimediaGeneralUrl;

    if (mainUrl && (mainUrl.includes('youtube') || mainUrl.includes('youtu.be') || mainUrl.includes('vimeo'))) {
        mediaHtml = `<div class="article-video-embed" style="margin-bottom:40px; aspect-ratio:16/9;">${resolveVideoEmbed(mainUrl)}</div>`;
        header.style.backgroundImage = `url('img/hero/barberia_heroimagen1.jpg')`;
        header.style.backgroundPosition = 'center';
    } else {
        header.style.backgroundImage = `url('${resolveThumbnail(mainUrl)}')`;
    }

    // Sanitize or just render HTML
    let contentHtml = article.ContenidoTexto;
    if (contentHtml && !contentHtml.includes('<p>')) {
        contentHtml = contentHtml.split('\n').filter(line => line.trim() !== '').map(p => `<p>${p}</p>`).join('');
    }

    bodyContainer.innerHTML = mediaHtml + contentHtml;
}

// Utils
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function resolveThumbnail(url) {
    if (!url) return 'img/hero/barberia_heroimagen1.jpg';
    url = url.trim();

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('/shorts/')) videoId = url.split('/shorts/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    if (url.includes('vimeo')) return 'img/hero/barberia_heroimagen1.jpg';

    return url;
}

function resolveVideoEmbed(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('/shorts/')) videoId = url.split('/shorts/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        return `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="width:100%; height:100%;"></iframe>`;
    }
    if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        return `<iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen style="width:100%; height:100%;"></iframe>`;
    }
    return '';
}
