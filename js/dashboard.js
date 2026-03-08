/**
 * DASHBOARD CONTROLLER
 * Lógica completa para el panel de administración
 * Optimized with AppCache
 */

class DashboardController {
    constructor() {
        this.api = window.auth;
        this.dataCache = {
            team: [],
            services: [],
            content: [],
            reviews: []
        };
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupNavigation();
        this.setupForms();
        this.loadSummaryMetrics();

        window.openModal = (id) => {
            document.getElementById(id).classList.add('active');
        };
        window.closeModal = (id) => document.getElementById(id).classList.remove('active');
        window.dashboard = this;
        this.initQuill();
    }

    initQuill() {
        this.editors = {};

        const toolbarOptions = [['bold', 'italic', 'underline'], [{ 'list': 'ordered' }, { 'list': 'bullet' }]];
        const miniToolbar = [['bold', 'italic', 'underline']];

        const bigFields = ['svcDesc', 'teamBio', 'contentText'];
        bigFields.forEach(id => {
            if (document.getElementById(id)) {
                this.makeRich(id, toolbarOptions, '300px');
            }
        });

        const smallFields = [
            'svcName', 'svcSubcat', 'svcTags', 'svcSizes', 'svcColors', 'svcMaterial', 'svcBrand',
            'teamName', 'teamRole', 'teamSpec',
            'contentTitle', 'contentSubtitle', 'contentSubcat', 'contentAuthor'
        ];

        smallFields.forEach(id => {
            if (document.getElementById(id)) {
                this.makeRich(id, miniToolbar, '60px');
            }
        });
    }

    makeRich(id, toolbar, height) {
        const input = document.getElementById(id);
        const div = document.createElement('div');
        div.id = id + '_editor';
        div.style.height = height;
        div.classList.add(height === '60px' ? 'mini-quill' : 'large-quill');

        input.parentNode.insertBefore(div, input);
        input.style.display = 'none';

        this.editors[id] = new Quill('#' + id + '_editor', {
            theme: 'snow',
            modules: { toolbar: toolbar }
        });
    }

    checkAuth() {
        const token = this.api.getToken();
        if (!token) window.location.href = "login.html";
        document.getElementById('logoutBtn').addEventListener('click', () => this.api.logout());
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const onclick = item.getAttribute('onclick');
                if (!onclick || !onclick.includes('showTab')) return;

                const tabName = onclick.match(/'([^']+)'/)?.[1];
                if (!tabName) return;

                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));

                const target = document.getElementById(`tab-${tabName}`);
                if (target) target.classList.remove('hidden');

                document.getElementById('pageTitle').innerText = tabName.charAt(0).toUpperCase() + tabName.slice(1);
                this.loadTabContent(tabName);
            });
        });
    }

    setupForms() {
        document.getElementById('serviceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveService();
        });

        document.getElementById('teamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTeam();
        });

        document.getElementById('contentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContent();
        });

        document.getElementById('reviewForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveReview();
        });
    }

    async loadTabContent(tabName) {
        console.log(`Cargando: ${tabName}`);
        switch (tabName) {
            case 'servicios': this.loadServices(); break;
            case 'equipo': this.loadTeam(); break;
            case 'noticias': this.loadContent('Noticias'); break;
            case 'promociones': this.loadContent('Banner'); break;
            case 'resenas': this.loadReviews(); break;
        }
    }

    async fetchData(action, params = {}) {
        const token = this.api.getToken();
        const payload = { action, token, _ts: Date.now(), ...params };

        try {
            const response = await fetch(this.api.API_URL, {
                method: 'POST',
                redirect: "follow",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Error desconocido");
            return data;
        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            return null;
        }
    }

    setLoading(formId, isLoading) {
        const btn = document.querySelector(`#${formId} button[type="submit"]`);
        if (!btn) return;

        if (isLoading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.innerHTML = btn.dataset.originalText || 'Guardar';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    }

    // ===========================================
    // 1. EQUIPO
    // ===========================================

    async loadTeam() {
        const CACHE_KEY = 'cache_team';
        const cached = AppCache.get(CACHE_KEY, 30); // 30 min cache for admin

        if (cached) {
            this.dataCache.team = cached;
            this.renderTeam(cached);
        }

        // Always fetch fresh for admin to ensure sync, but render cache first
        const res = await this.fetchData('getTeam');
        if (!res) return;

        this.dataCache.team = res.data;
        AppCache.set(CACHE_KEY, res.data);
        this.renderTeam(res.data);
    }

    renderTeam(data) {
        const tbody = document.getElementById('teamTableBody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#777; padding:30px;">No hay miembros del equipo registrados aún.</td></tr>';
            return;
        }

        data.forEach((item, index) => {
            tbody.innerHTML += `
                <tr>
                    <td><img src="${item.FotoUrl || 'img/logo.png'}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"></td>
                    <td>${item.Nombre}</td>
                    <td>${item.Rol}</td>
                    <td><span class="badge ${item.Estado === 'Activo' ? 'valid' : 'invalid'}">${item.Estado}</span></td>
                    <td>
                        <button class="btn-outline" style="padding:5px;" onclick="dashboard.editTeam(${index})"><i class="fas fa-edit"></i></button>
                        <button class="btn-outline" style="padding:5px; color:red; border-color:red;" onclick="dashboard.deleteTeam('${item.ID}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    editTeam(index) {
        const item = this.dataCache.team[index];
        document.getElementById('teamId').value = item.ID;
        this.editors['teamName'].root.innerHTML = item.Nombre || '';
        this.editors['teamRole'].root.innerHTML = item.Rol || '';
        this.editors['teamBio'].root.innerHTML = item.Bio || '';
        document.getElementById('teamPhoto').value = item.FotoUrl;
        document.getElementById('teamIg').value = item.Instagram;
        this.editors['teamSpec'].root.innerHTML = item.Especialidad || '';
        document.getElementById('teamStatus').value = item.Estado;
        document.getElementById('teamOrder').value = item.Orden;
        document.getElementById('teamSchedule').value = item.Horario;
        document.getElementById('teamBooking').value = item.EnlaceReserva;

        openModal('teamModal');
    }

    async saveTeam() {
        const id = document.getElementById('teamId').value;
        const data = {
            id: id,
            Nombre: this.editors['teamName'].root.innerHTML,
            Rol: this.editors['teamRole'].root.innerHTML,
            Bio: this.editors['teamBio'].root.innerHTML,
            FotoUrl: document.getElementById('teamPhoto').value,
            Instagram: document.getElementById('teamIg').value,
            Especialidad: this.editors['teamSpec'].root.innerHTML,
            Estado: document.getElementById('teamStatus').value,
            Orden: document.getElementById('teamOrder').value,
            Horario: document.getElementById('teamSchedule').value,
            EnlaceReserva: document.getElementById('teamBooking').value
        };

        this.setLoading('teamForm', true);

        try {
            const action = id ? 'updateTeamMember' : 'createTeamMember';
            const res = await this.fetchData(action, data);
            if (res && res.success) {
                AppCache.clear('cache_team'); // Invalidate Cache
                closeModal('teamModal');
                this.loadTeam();
                document.getElementById('teamForm').reset();
                document.getElementById('teamId').value = '';
            }
        } finally {
            this.setLoading('teamForm', false);
        }
    }

    async deleteTeam(id) {
        if (!confirm('¿Seguro que deseas eliminar este miembro?')) return;
        const res = await this.fetchData('deleteTeamMember', { id });
        if (res && res.success) {
            AppCache.clear('cache_team');
            this.loadTeam();
        }
    }


    // ===========================================
    // 2. SERVICIOS
    // ===========================================

    async loadServices() {
        const CACHE_KEY = 'cache_services';
        const cached = AppCache.get(CACHE_KEY, 30);

        if (cached) {
            this.dataCache.services = cached;
            this.renderServices(cached);
        }

        const res = await this.fetchData('getProducts');
        if (!res) return;

        this.dataCache.services = res.data;
        AppCache.set(CACHE_KEY, res.data);
        this.renderServices(res.data);
    }

    renderServices(data) {
        const tbody = document.getElementById('servicesTableBody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#777; padding:30px;">No hay servicios o productos registrados.</td></tr>';
            return;
        }

        data.forEach((item, index) => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.NombreProducto}</td>
                    <td>₡${item.Precio}</td>
                    <td>${item.Categoria} / ${item.Subcategoria || '-'}</td>
                    <td>
                        <button class="btn-outline" style="padding:5px;" onclick="dashboard.editService(${index})"><i class="fas fa-edit"></i></button>
                        <button class="btn-outline" style="padding:5px; color:red; border-color:red;" onclick="dashboard.deleteService('${item.ID}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    createService() {
        document.getElementById('serviceForm').reset();
        document.getElementById('svcId').value = '';

        // Clear Rich Text Editors
        if (this.editors['svcName']) this.editors['svcName'].root.innerHTML = '';
        if (this.editors['svcDesc']) this.editors['svcDesc'].root.innerHTML = '';
        if (this.editors['svcSubcat']) this.editors['svcSubcat'].root.innerHTML = '';
        if (this.editors['svcTags']) this.editors['svcTags'].root.innerHTML = '';
        if (this.editors['svcSizes']) this.editors['svcSizes'].root.innerHTML = '';
        if (this.editors['svcColors']) this.editors['svcColors'].root.innerHTML = '';
        if (this.editors['svcMaterial']) this.editors['svcMaterial'].root.innerHTML = '';
        if (this.editors['svcBrand']) this.editors['svcBrand'].root.innerHTML = '';

        // Clear Multimedia Fields
        document.getElementById('svcImage').value = '';
        document.getElementById('svcImg1').value = '';
        document.getElementById('svcImg2').value = '';
        document.getElementById('svcImg3').value = '';
        document.getElementById('svcImg4').value = '';

        openModal('serviceModal');
    }

    editService(index) {
        const item = this.dataCache.services[index];
        document.getElementById('svcId').value = item.ID;
        this.editors['svcName'].root.innerHTML = item.NombreProducto || '';
        document.getElementById('svcSku').value = item.SKU;
        this.editors['svcDesc'].root.innerHTML = item.Descripcion || '';
        document.getElementById('svcPrice').value = item.Precio;
        document.getElementById('svcOldPrice').value = item.PrecioAntes;
        document.getElementById('svcDiscount').value = item.DescuentoPorcentaje;
        document.getElementById('svcCategory').value = item.Categoria;
        this.editors['svcSubcat'].root.innerHTML = item.Subcategoria || '';
        document.getElementById('svcType').value = item.tipoServicio;
        document.getElementById('svcStock').value = item.Stock;
        this.editors['svcTags'].root.innerHTML = item.Etiquetas || '';
        document.getElementById('svcImage').value = item.MultimediaGeneralUrl;

        // Extra Fields
        this.editors['svcSizes'].root.innerHTML = item.Tallas || '';
        this.editors['svcColors'].root.innerHTML = item.Colores || '';
        this.editors['svcMaterial'].root.innerHTML = item.Material || '';
        this.editors['svcBrand'].root.innerHTML = item.Marca || '';
        document.getElementById('svcFeatured').checked = (item.EsDestacado === true || item.EsDestacado === 'TRUE');
        document.getElementById('svcNew').checked = (item.EsNuevo === true || item.EsNuevo === 'TRUE');
        document.getElementById('svcImg1').value = item.multimediaUrl1;
        document.getElementById('svcImg2').value = item.multimediaUrl2;
        document.getElementById('svcImg3').value = item.multimediaUrl3;
        document.getElementById('svcImg4').value = item.multimediaUrl4;

        openModal('serviceModal');
    }

    async saveService() {
        const id = document.getElementById('svcId').value;
        const data = {
            id: id,
            NombreProducto: this.editors['svcName'].root.innerHTML,
            SKU: document.getElementById('svcSku').value,
            Descripcion: this.editors['svcDesc'].root.innerHTML,
            Precio: document.getElementById('svcPrice').value,
            PrecioAntes: document.getElementById('svcOldPrice').value,
            DescuentoPorcentaje: document.getElementById('svcDiscount').value,
            Categoria: document.getElementById('svcCategory').value,
            Subcategoria: this.editors['svcSubcat'].root.innerHTML,
            tipoServicio: document.getElementById('svcType').value,
            Stock: document.getElementById('svcStock').value,
            Etiquetas: this.editors['svcTags'].root.innerHTML,
            MultimediaGeneralUrl: document.getElementById('svcImage').value,
            Tallas: this.editors['svcSizes'].root.innerHTML,
            Colores: this.editors['svcColors'].root.innerHTML,
            Material: this.editors['svcMaterial'].root.innerHTML,
            Marca: this.editors['svcBrand'].root.innerHTML,
            EsDestacado: document.getElementById('svcFeatured').checked,
            EsNuevo: document.getElementById('svcNew').checked,
            multimediaUrl1: document.getElementById('svcImg1').value,
            multimediaUrl2: document.getElementById('svcImg2').value,
            multimediaUrl3: document.getElementById('svcImg3').value,
            multimediaUrl4: document.getElementById('svcImg4').value
        };

        this.setLoading('serviceForm', true);

        try {
            const action = id ? 'updateProduct' : 'createProduct';
            const res = await this.fetchData(action, data);
            if (res && res.success) {
                // Add Delay to ensure Google Sheets propagation
                await new Promise(r => setTimeout(r, 1500));

                AppCache.clear('cache_services'); // Invalidate
                closeModal('serviceModal');
                this.loadServices();
                document.getElementById('serviceForm').reset();
                document.getElementById('svcId').value = '';
                alert("Servicio guardado correctamente.");
            }
        } finally {
            this.setLoading('serviceForm', false);
        }
    }

    async deleteService(id) {
        if (!confirm('¿Eliminar servicio?')) return;
        const res = await this.fetchData('deleteProduct', { id });
        if (res && res.success) {
            AppCache.clear('cache_services');
            this.loadServices();
        }
    }

    // ===========================================
    // 3. CONTENIDO (Noticias / Promos)
    // ===========================================

    async loadContent(categoryFilter) {
        const CACHE_KEY = (categoryFilter === 'Banner') ? 'cache_promos' : 'cache_news';
        const cached = AppCache.get(CACHE_KEY, 30);

        if (cached) {
            this.dataCache.content = cached;
            this.renderContent(cached, categoryFilter);
        }

        const res = await this.fetchData('getContent', { filters: { Categoria: categoryFilter } });
        if (!res) return;

        this.dataCache.content = res.data;
        AppCache.set(CACHE_KEY, res.data); // We cache the FILTERED list? 
        // Note: content-loader caches ALL content. Dashboard fetches filtered by backend.
        // It's safer to cache this specific filtered list under a specific key?
        // Actually, let's use specific keys per filter in Dashboard to avoid mixing.
        // Or better: The backend returns filtered data. AppCache.set saves WHAT WE GOT.
        // If we switch tabs, we overwrite? 
        // Solution: Use specific keys: 'cache_dashboard_banner' and 'cache_dashboard_news'.
        // But content-loader uses 'cache_promos' and 'cache_news'.
        // Let's stick to what content-loader uses so validaton works accross the board?
        // content-loader fetches filtered too. So keys match!

        // content-loader fetches filtered too. So keys match!

        this.renderContent(res.data, categoryFilter);
    }

    renderContent(data, categoryFilter) {
        const isPromo = categoryFilter === 'Banner';
        const tbody = document.getElementById(isPromo ? 'promosTableBody' : 'newsTableBody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            const msg = isPromo ? "No hay promociones activas." : "No hay noticias publicadas.";
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777; padding:30px;">${msg}</td></tr>`;
            return;
        }

        data.forEach((item, index) => {
            const row = isPromo ?
                `<td>${item.Titulo}</td><td>${item.FechaInicio}</td><td>${item.FechaFin}</td>` :
                `<td>${item.Titulo}</td><td>${item.Autor}</td><td>${item.FechaPublicacion}</td>`;

            tbody.innerHTML += `
                <tr>
                    ${row}
                    <td><span class="badge ${item.Estado === 'Publicado' ? 'valid' : 'invalid'}">${item.Estado}</span></td>
                    <td>
                        <button class="btn-outline" style="padding:5px;" onclick="dashboard.editContent(${index})"><i class="fas fa-edit"></i></button>
                        <button class="btn-outline" style="padding:5px; color:red; border-color:red;" onclick="dashboard.deleteContent('${item.ID}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    setContentMode(mode) {
        document.getElementById('contentForm').reset();
        document.getElementById('contentId').value = '';
        document.getElementById('contentMode').value = mode;
        const catSelect = document.getElementById('contentCategory');
        catSelect.value = mode;
        catSelect.disabled = true;
        document.getElementById('contentModalTitle').innerText = (mode === 'Banner') ? 'Gestionar Promoción' : 'Gestionar Noticia';
    }

    editContent(index) {
        const item = this.dataCache.content[index];
        this.setContentMode(item.Categoria);
        document.getElementById('contentId').value = item.ID;

        this.editors['contentTitle'].root.innerText = item.Titulo || '';
        this.editors['contentSubtitle'].root.innerText = item.Subtitulo || '';
        this.editors['contentSubcat'].root.innerText = item.Subcategoria || '';
        this.editors['contentText'].root.innerText = item.ContenidoTexto || '';
        document.getElementById('contentCategory').value = item.Categoria;
        document.getElementById('contentStatus').value = item.Estado;
        this.editors['contentAuthor'].root.innerText = item.Autor || '';
        document.getElementById('contentDate').value = this.formatDateForInput(item.FechaPublicacion);

        document.getElementById('contentImgMain').value = item.MultimediaGeneralUrl;
        document.getElementById('contentImg1').value = item.multimediaUrl1;
        document.getElementById('contentImg2').value = item.multimediaUrl2;
        document.getElementById('contentImg3').value = item.multimediaUrl3;
        document.getElementById('contentImg4').value = item.multimediaUrl4;

        document.getElementById('promoStart').value = this.formatDateForInput(item.FechaInicio);
        document.getElementById('promoEnd').value = this.formatDateForInput(item.FechaFin);
        document.getElementById('contentBtnLink').value = item.EnlaceAccion; // Mapped correctly

        document.getElementById('reviewRating').value = item.Calificacion;
        document.getElementById('reviewCompany').value = item.Empresa;

        openModal('contentModal');
    }

    async saveContent() {
        const id = document.getElementById('contentId').value;
        const mode = document.getElementById('contentMode').value;

        const data = {
            id: id,
            Titulo: this.editors['contentTitle'].root.innerText.trim(),
            Subtitulo: this.editors['contentSubtitle'].root.innerText.trim(),
            ContenidoTexto: this.editors['contentText'].root.innerText.trim(),
            Categoria: document.getElementById('contentCategory').value || mode,
            Subcategoria: this.editors['contentSubcat'].root.innerText.trim(),
            Estado: document.getElementById('contentStatus').value,
            Autor: this.editors['contentAuthor'].root.innerText.trim(),
            FechaPublicacion: document.getElementById('contentDate').value,
            MultimediaGeneralUrl: document.getElementById('contentImgMain').value,
            multimediaUrl1: document.getElementById('contentImg1').value,
            multimediaUrl2: document.getElementById('contentImg2').value,
            multimediaUrl3: document.getElementById('contentImg3').value,
            multimediaUrl4: document.getElementById('contentImg4').value,
            FechaInicio: document.getElementById('promoStart').value,
            FechaFin: document.getElementById('promoEnd').value,
            EnlaceAccion: document.getElementById('contentBtnLink').value,
            Calificacion: document.getElementById('reviewRating').value,
            Empresa: document.getElementById('reviewCompany').value
        };

        this.setLoading('contentForm', true);

        try {
            const action = id ? 'updateContent' : 'createContent';
            const res = await this.fetchData(action, data);
            if (res && res.success) {
                // Invalidate BOTH to be safe, or specific
                AppCache.clear('cache_promos');
                AppCache.clear('cache_news');

                closeModal('contentModal');
                this.loadContent(mode === 'Banner' ? 'Banner' : 'Noticias');
            }
        } finally {
            this.setLoading('contentForm', false);
        }
    }

    async deleteContent(id) {
        if (!confirm('¿Eliminar contenido?')) return;
        const res = await this.fetchData('deleteContent', { id });
        if (res && res.success) {
            AppCache.clear('cache_promos');
            AppCache.clear('cache_news');
            const isActivePromo = !document.getElementById('tab-promociones').classList.contains('hidden');
            this.loadContent(isActivePromo ? 'Banner' : 'Noticias');
        }
    }

    // ===========================================
    // 4. RESEÑAS
    // ===========================================

    async loadReviews() {
        // Reviews usually change less often, but let's cache
        const res = await this.fetchData('getReviews');
        if (!res) return;
        this.dataCache.reviews = res.data;
        const tbody = document.getElementById('reviewsTableBody');
        tbody.innerHTML = '';

        if (res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#777; padding:30px;">No hay reseñas aún.</td></tr>';
            return;
        }

        res.data.forEach((item, index) => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.NombreCliente}</td>
                    <td>${'⭐'.repeat(item.Puntuacion)}</td>
                    <td>${item.Comentario.substring(0, 30)}...</td>
                    <td><span class="badge ${item.Estado === 'Publicado' ? 'valid' : 'warning'}">${item.Estado}</span></td>
                    <td>
                        <button class="btn-outline" style="padding:5px;" onclick="dashboard.editReview(${index})">Administrar</button>
                    </td>
                </tr>
            `;
        });
    }

    editReview(index) {
        const item = this.dataCache.reviews[index];
        document.getElementById('reviewId').value = item.ID;
        document.getElementById('reviewTextPreview').innerText = `"${item.Comentario}" - ${item.NombreCliente}`;
        document.getElementById('reviewStatus').value = item.Estado;
        openModal('reviewModal');
    }

    async saveReview() {
        const id = document.getElementById('reviewId').value;
        const data = {
            id: id,
            Estado: document.getElementById('reviewStatus').value
        };

        this.setLoading('reviewForm', true);

        try {
            const res = await this.fetchData('updateReview', data);
            if (res && res.success) {
                closeModal('reviewModal');
                this.loadReviews();
            }
        } finally {
            this.setLoading('reviewForm', false);
        }
    }

    async backupData() {
        if (!confirm("¿Deseas generar un respaldo completo de la base de datos? \nSe enviará un archivo Excel a tu correo de administrador.")) return;

        try {
            const btn = document.querySelector('a[onclick="dashboard.backupData()"]');
            let originalText = '';
            if (btn) {
                originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
            }

            const res = await this.fetchData('backupNow');

            if (res.success) {
                alert(`✅ Respaldo enviado con éxito.\nRevisa tu bandeja de entrada.`);
            } else {
                alert('❌ Error al generar respaldo: ' + (res.error || 'Desconocido'));
                console.error(res);
            }
            if (btn) btn.innerHTML = originalText;
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    }

    async loadSummaryMetrics() {
        console.log("Cargando métricas (simulado)");
    }

    formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    }
}

window.dashboard = new DashboardController();

window.openCloudinary = function (targetInputId) {
    const myWidget = cloudinary.createUploadWidget({
        cloudName: 'dgt32425a',
        uploadPreset: 'web_frotend_barberia',
        sources: ['local', 'url', 'camera'],
        folder: 'barberia_uploads',
        clientAllowedFormats: ['images'],
        maxFileSize: 5000000
    }, (error, result) => {
        if (!error && result && result.event === "success") {
            const url = result.info.secure_url;
            console.log('Imagen subida:', url);
            document.getElementById(targetInputId).value = url;
        }
    });
    myWidget.open();
};
