
/**
 * SERVICES LOADER (DYNAMIC V2) - STABILIZED & CACHED
 * Carga dinámicamente los servicios desde el Google App Script API.
 * Uses AppCache (localStorage) for instant load.
 */

const API_URL = "https://script.google.com/macros/s/AKfycbybF4cCn7LnAOUcG75-CUqktcV01k_OsAsGvnN1LFIiwL5PjmCq6jOc15DK3SoleZM/exec";

document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    loadShowcase();
});

/**
 * 1. SHOWCASE (Bento Grid on Home)
 */
async function loadShowcase() {
    const grid = document.getElementById('bento-grid');
    if (!grid) return;

    const CACHE_KEY = 'cache_services'; // Shared key with full list

    // 1. Try Cache
    const cached = AppCache.get(CACHE_KEY, 15);
    if (cached) {
        console.log("Loading Showcase from Cache");
        renderShowcaseFromData(cached, grid);
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getProducts' })
        });
        const json = await response.json();

        if (!json.success) throw new Error("Error API");

        // Update Cache
        AppCache.set(CACHE_KEY, json.data);

        // Render if not already done (or simple refresh)
        if (!cached) renderShowcaseFromData(json.data, grid);

    } catch (e) {
        console.error(e);
        if (!cached) grid.innerHTML = '<div class="bento-loader" data-i18n="js_err_gallery">Error cargando galería.</div>';
    }
}

function renderShowcaseFromData(data, grid) {
    const featured = data.filter(p => {
        const isDest = (p.EsDestacado === true || p.EsDestacado === 'TRUE' || p.EsDestacado === 'true' || p.EsDestacado === 'True');
        return isDest;
    });

    grid.innerHTML = '';

    if (featured.length === 0) {
        grid.innerHTML = '<div class="bento-loader" data-i18n="js_no_services">No hay items destacados.</div>';
        return;
    }

    featured.forEach((item, index) => {
        let sizeClass = '';
        if (index === 0) sizeClass = 'big';
        else if (index === 5) sizeClass = 'wide';
        else if (index === 2 || index === 6) sizeClass = 'tall';

        const card = document.createElement('div');
        card.className = `bento-card ${sizeClass}`;

        const mediaUrl = item.MultimediaGeneralUrl;
        const thumbUrl = resolveBentoThumbnail(mediaUrl);
        const isVideo = mediaUrl && (mediaUrl.includes('youtube') || mediaUrl.includes('vimeo'));

        card.innerHTML = `
            ${isVideo ? '<div class="bento-play"><i class="fas fa-play"></i></div>' : ''}
            ${(item.EsNuevo === true || item.EsNuevo === 'TRUE') ? '<div class="bento-badge" data-i18n="js_badge_new">NUEVO</div>' : ''}
            <img src="${thumbUrl}" class="bento-media" alt="${item.NombreProducto}">
            <div class="bento-content">
                <span class="bento-cat">${item.Categoria || 'Exclusivo'}</span>
                <h3 class="bento-title">${item.NombreProducto}</h3>
                <span class="bento-price">₡${item.Precio}</span>
            </div>
        `;

        card.addEventListener('click', () => openServiceModal(item));
        grid.appendChild(card);
    });

    setTimeout(() => {
        if (typeof updateLanguage === 'function') {
            updateLanguage(localStorage.getItem('language') || 'es');
        }
    }, 50);
}

function resolveBentoThumbnail(url) {
    if (!url) return 'img/hero/barberia_heroimagen1.jpg';
    url = url.trim();

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('/shorts/')) videoId = url.split('/shorts/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    if (url.includes('vimeo')) {
        return 'img/hero/barberia_heroimagen1.jpg';
    }

    return url;
}

/**
 * 2. MAIN SERVICES LIST
 */
async function loadServices() {
    const mainContainer = document.querySelector('.svc-container-v2');
    if (!mainContainer) return;

    const CACHE_KEY = 'cache_services';

    // 1. Try Cache
    const cached = AppCache.get(CACHE_KEY, 15);
    if (cached) {
        console.log("Loading Services from Cache");
        renderServicesFromData(cached, mainContainer);
    } else {
        // Only show spinner if NO cache
        mainContainer.innerHTML = `
            <div style="text-align: center; padding: 100px 0; color: #888;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-gold); margin-bottom: 20px;"></i>
                <p style="letter-spacing: 2px;" data-i18n="js_loading_catalog">CARGANDO CATÁLOGO...</p>
            </div>
        `;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getProducts' })
        });

        const json = await response.json();

        if (!json.success) throw new Error(json.error || "Error API");

        AppCache.set(CACHE_KEY, json.data);
        if (!cached) {
            mainContainer.innerHTML = '';
            renderServicesFromData(json.data, mainContainer);
        }

    } catch (error) {
        console.error("Error services:", error);
        if (!cached) {
            mainContainer.innerHTML = `
                <div style="text-align: center; padding: 100px 0; color: #ff6b6b;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p data-i18n="js_err_services">Error cargando los servicios.</p>
                    <button onclick="loadServices()" class="btn-glass" data-i18n="js_btn_retry">REINTENTAR</button>
                </div>
            `;
        }
    }
}

const ITEMS_PER_PAGE = 12;

function renderServicesFromData(services, mainContainer) {
    mainContainer.innerHTML = ''; // Start clean

    if (!services || services.length === 0) {
        mainContainer.innerHTML = `
            <div style="text-align: center; padding: 100px 0; color: #888;">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <p data-i18n="js_no_services">No hay servicios disponibles.</p>
            </div>
        `;
        return;
    }

    // Group by Category
    const grouped = {};
    services.forEach(svc => {
        let cat = svc.Categoria || 'Otros';
        cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase(); // Normalize
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(svc);
    });

    Object.keys(grouped).forEach(category => {
        const items = grouped[category];
        const section = createSectionWithPagination(category, items);
        mainContainer.appendChild(section);
    });

    updateSidebar(Object.keys(grouped));
}

function createSectionWithPagination(categoryTitle, items) {
    const section = document.createElement('section');
    section.className = 'svc-section';
    const safeId = categoryTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
    section.id = safeId;

    const count = items.length.toString().padStart(2, '0');

    section.innerHTML = `
        <h2 class="svc-cat-title">${categoryTitle.toUpperCase()} <span class="cat-count">${count}</span></h2>
        <div id="grid-${safeId}" class="svc-grid-container"></div>
        <div id="pagination-${safeId}" class="svc-pagination"></div>
    `;

    // Initial render page 1
    renderCategoryPage(section, items, 1, categoryTitle);

    return section;
}

function renderCategoryPage(section, allItems, page, categoryTitle) {
    const safeId = categoryTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const gridContainer = section.querySelector(`#grid-${safeId}`);
    const paginationContainer = section.querySelector(`#pagination-${safeId}`);

    // Calculate slice
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = allItems.slice(start, end);
    const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);

    // Determine Layout
    const isListLayout = categoryTitle.toLowerCase() === 'tratamientos';

    gridContainer.innerHTML = '';

    if (isListLayout) {
        const grid = document.createElement('div');
        grid.className = 'svc-grid-compact';
        pageItems.forEach(item => renderTreatment(item, grid));
        gridContainer.appendChild(grid);
    } else {
        const grid = document.createElement('div');
        grid.className = 'glass-grid';
        pageItems.forEach(item => renderCard(item, grid));
        gridContainer.appendChild(grid);
    }

    // Render Pagination Controls if needed
    if (totalPages > 1) {
        renderPaginationControls(paginationContainer, page, totalPages, (newPage) => {
            renderCategoryPage(section, allItems, newPage, categoryTitle);
            // Optional: Smooth scroll to top of section on page change
            // section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    } else {
        paginationContainer.innerHTML = '';
    }

    setTimeout(() => {
        if (typeof updateLanguage === 'function') {
            updateLanguage(localStorage.getItem('language') || 'es');
        }
    }, 50);
}

function renderPaginationControls(container, currentPage, totalPages, onPageChange) {
    container.innerHTML = '';

    // Styles for pagination (can move to CSS later, but inline for safety now)
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.gap = '10px';
    container.style.marginTop = '30px';

    const createBtn = (text, page, isActive = false, isDisabled = false) => {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.className = isActive ? 'btn-glass filled' : 'btn-glass';
        btn.style.padding = '8px 15px';
        btn.style.minWidth = '40px';

        if (isDisabled) {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.addEventListener('click', () => onPageChange(page));
        }
        return btn;
    };

    // Prev
    container.appendChild(createBtn('<', currentPage - 1, false, currentPage === 1));

    // Numbers (Simple logic: show all for now, or max 5 window)
    for (let i = 1; i <= totalPages; i++) {
        // Simple window logic: Show 1, Last, and neighbors of current
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            container.appendChild(createBtn(i, i, i === currentPage));
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const span = document.createElement('span');
            span.innerText = '...';
            span.style.color = '#fff';
            span.style.alignSelf = 'center';
            container.appendChild(span);
        }
    }

    // Next
    container.appendChild(createBtn('>', currentPage + 1, false, currentPage === totalPages));
}

function renderCard(item, container) {
    let imgUrl = item.MultimediaGeneralUrl;
    if (imgUrl && (imgUrl.includes('youtube') || imgUrl.includes('youtu.be') || imgUrl.includes('vimeo'))) {
        imgUrl = resolveBentoThumbnail(imgUrl);
    }
    if (!imgUrl) imgUrl = 'img/hero/barberia_heroimagen1.jpg';

    const isDestacado = (item.EsDestacado === true || item.EsDestacado === 'TRUE');
    const isWide = item.Subcategoria && item.Subcategoria.toLowerCase().includes('destacado');

    const card = document.createElement('div');
    card.className = `glass-card ${isWide ? 'wide' : ''}`;

    let badgeHtml = '';
    if (isDestacado) {
        badgeHtml = `<div class="glass-badge" data-i18n="js_badge_rec">RECOMENDADO</div>`;
    }

    card.innerHTML = `
        <div class="glass-img" style="background-image: url('${imgUrl}');"></div>
        ${badgeHtml}
        <div class="glass-overlay"></div>
        <div class="glass-info">
            <div class="glass-header">
                <h3>${item.NombreProducto}</h3>
                <span class="glass-price">₡${item.Precio}</span>
            </div>
            <p class="glass-desc">${item.Descripcion || ''}</p>
            <div class="glass-actions" style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn-glass ${isDestacado ? 'filled' : ''}" style="flex:1;">
                    <span data-i18n="js_btn_details">DETALLES</span> <i class="fas fa-arrow-right" style="font-size: 0.8em; margin-left: 5px;"></i>
                </button>
                <a href="#" class="btn-glass btn-whatsapp-direct" style="flex:1; text-align:center; background: rgba(37, 211, 102, 0.2); border: 1px solid #25d366; color: #25d366;">
                    <i class="fab fa-whatsapp"></i>
                </a>
            </div>
        </div>
    `;

    // WhatsApp logic
    const waBtn = card.querySelector('.btn-whatsapp-direct');
    if (waBtn) {
        waBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = item.NombreProducto;
            const cleanTitle = tempDiv.innerText.trim();
            const phone = "50688888888";
            const text = `Hola, me interesa el servicio: *${cleanTitle}*.`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
        });
    }

    card.addEventListener('click', () => {
        openServiceModal(item);
    });

    container.appendChild(card);
}

function renderTreatment(item, container) {
    const row = document.createElement('div');
    row.className = 'svc-row';
    row.innerHTML = `
        <span>${item.NombreProducto}</span>
        <span class="dots"></span>
        <span class="price-simple">₡${item.Precio}</span>
    `;
    container.appendChild(row);
}

function updateSidebar(categories) {
    const navList = document.querySelector('.svc-nav-list');
    if (!navList) return;

    navList.innerHTML = '';
    categories.forEach(cat => {
        const safeId = cat.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${safeId}" class="svc-nav-link">${cat}</a>`;
        navList.appendChild(li);
    });
}

/**
 * MODAL LOGIC
 */
function openServiceModal(item) {
    const modal = document.getElementById('svc-modal');
    if (!modal) return;

    const mediaItems = [
        item.MultimediaGeneralUrl,
        item.multimediaUrl1,
        item.multimediaUrl2,
        item.multimediaUrl3,
        item.multimediaUrl4
    ].filter(url => url && url.trim() !== '');

    if (mediaItems.length === 0) {
        mediaItems.push('img/hero/barberia_heroimagen1.jpg');
    }

    const visualContainer = document.querySelector('.svc-modal-visual');
    if (mediaItems.length === 1) {
        visualContainer.innerHTML = resolveMediaContent(mediaItems[0]);
    } else {
        renderCarousel(visualContainer, mediaItems);
    }

    document.getElementById('modal-cat').innerText = item.Categoria || 'SERVICIO';

    const titleTemp = document.createElement('div');
    titleTemp.innerHTML = item.NombreProducto;
    document.getElementById('modal-title').innerText = titleTemp.innerText.trim();

    let fallbackDesc = 'Sin descripción disponible.';
    if (typeof getText === 'function') {
        fallbackDesc = getText(localStorage.getItem('language') || 'es', 'js_no_desc') || fallbackDesc;
    }
    const desc = item.Descripcion || fallbackDesc;
    const txt = document.createElement('textarea');
    txt.innerHTML = desc;
    document.getElementById('modal-desc').innerHTML = txt.value;

    document.getElementById('modal-price').innerText = '₡' + item.Precio;

    const phone = "50688888888";
    const text = `Hola, estoy viendo su sitio web y me interesa agendar el servicio: *${titleTemp.innerText.trim()}*. ¿Tienen disponibilidad?`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    document.getElementById('modal-whatsapp').href = url;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // --- DISQUS INTEGRATION ---
    const rawId = item.ID || item.NombreProducto; // Prefer ID, fallback to Name
    const uniqueId = 'service-' + rawId.toString().toLowerCase().replace(/[^a-z0-9]/g, '-');
    const uniqueUrl = window.location.origin + window.location.pathname + '#!/' + uniqueId;
    const title = titleTemp.innerText.trim();

    // Check if Disqus loaded
    if (typeof DISQUS !== 'undefined') {
        DISQUS.reset({
            reload: true,
            config: function () {
                this.page.identifier = uniqueId;
                this.page.url = uniqueUrl;
                this.page.title = title;
            }
        });
    } else {
        // Load for first time
        loadDisqus(uniqueId, uniqueUrl, title);
    }
}

// Helper to load Disqus
function loadDisqus(id, url, title) {
    window.disqus_config = function () {
        this.page.identifier = id;
        this.page.url = url;
        this.page.title = title;
    };
    (function () {
        var d = document, s = d.createElement('script');
        s.src = 'https://barberiacr.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
    })();
}

function resolveMediaContent(url) {
    if (!url) return '';
    url = url.trim();

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('/shorts/')) videoId = url.split('/shorts/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        return `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1" class="media-iframe" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%; display:block;"></iframe>`;
    }

    if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        return `<iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:100%; height:100%;"></iframe>`;
    }

    return `<img src="${url}" alt="Service Media" style="width:100%; height:100%; object-fit:cover;">`;
}

function renderCarousel(container, items) {
    let currentIndex = 0;

    container.innerHTML = `
        <div class="carousel-track" style="width:100%; height:100%; position:relative;">
            <div id="carousel-content" style="width:100%; height:100%;">
                ${resolveMediaContent(items[0])}
            </div>
            
            <button id="prevBtn" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); color:#fff; border:none; border-radius:50%; width:40px; height:40px; cursor:pointer; z-index:10;"><i class="fas fa-chevron-left"></i></button>
            <button id="nextBtn" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); color:#fff; border:none; border-radius:50%; width:40px; height:40px; cursor:pointer; z-index:10;"><i class="fas fa-chevron-right"></i></button>
            
            <div style="position:absolute; bottom:15px; left:50%; transform:translateX(-50%); display:flex; gap:5px; z-index:10;">
                ${items.map((_, i) => `<div class="indicator" data-index="${i}" style="width:8px; height:8px; border-radius:50%; background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.5)'}; cursor:pointer;"></div>`).join('')}
            </div>
        </div>
    `;

    const updateSlide = (index) => {
        currentIndex = index;
        document.getElementById('carousel-content').innerHTML = resolveMediaContent(items[currentIndex]);

        const dots = container.querySelectorAll('.indicator');
        dots.forEach((d, i) => {
            d.style.background = (i === currentIndex) ? '#fff' : 'rgba(255,255,255,0.5)';
        });
    };

    container.querySelector('#prevBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        let newIndex = currentIndex - 1;
        if (newIndex < 0) newIndex = items.length - 1;
        updateSlide(newIndex);
    });

    container.querySelector('#nextBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        let newIndex = currentIndex + 1;
        if (newIndex >= items.length) newIndex = 0;
        updateSlide(newIndex);
    });

    container.querySelectorAll('.indicator').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            updateSlide(parseInt(dot.dataset.index));
        });
    });
}

function closeServiceModal() {
    const modal = document.getElementById('svc-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}
