/**
 * SERVICIO DE AUTENTICACIÓN
 * Maneja Login, Token management y Logout.
 */

class AuthService {
    constructor() {
        // !!! IMPORTANTE: REEMPLAZAR CON LA URL DE TU SCRIPT DE GOOGLE !!!
        this.API_URL = "https://script.google.com/macros/s/AKfycbybF4cCn7LnAOUcG75-CUqktcV01k_OsAsGvnN1LFIiwL5PjmCq6jOc15DK3SoleZM/exec";

        this.tokenKey = "barber_token";
        this.userKey = "barber_user";
        this.init();
    }

    init() {
        this.checkAuthOnLoad();

        // Listener formulario login
        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            loginForm.addEventListener("submit", (e) => this.handleLogin(e));
        }

        // Logout
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    // --- LOGIC ---

    async handleLogin(e) {
        e.preventDefault();

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        const rememberInput = document.getElementById("remember"); // Checkbox
        const btn = document.getElementById("submitBtn");
        const errorMsg = document.getElementById("errorMsg");

        if (!usernameInput || !passwordInput) return;

        const username = usernameInput.value;
        const password = passwordInput.value;
        const remember = rememberInput ? rememberInput.checked : false;

        // UI Loading
        btn.disabled = true;
        btn.innerText = "Verificando...";
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }

        try {
            // --- LLAMADA REAL A APPS SCRIPT ---
            const response = await fetch(this.API_URL, {
                method: 'POST',
                redirect: "follow",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify({ action: 'login', username, password })
            });

            const data = await response.json();

            if (data.success) {
                // EXITO: Guardar sesión según preferencia
                this.saveSession(data.token, data.user, remember);
                window.location.href = "dashboard.html";
            } else {
                throw new Error(data.message || "Usuario o clave incorrectos");
            }

        } catch (error) {
            console.error(error);
            if (errorMsg) {
                errorMsg.innerText = error.message || "Error de conexión";
                errorMsg.style.display = 'block';
            }
            btn.disabled = false;
            btn.innerText = "Iniciar sesión";
        }
    }

    saveSession(token, user, remember) {
        const storage = remember ? localStorage : sessionStorage;

        // Limpiar ambos primero por seguridad
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.userKey);

        storage.setItem(this.tokenKey, token);
        storage.setItem(this.userKey, JSON.stringify(user));
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.userKey);
        window.location.href = "login.html";
    }

    getToken() {
        return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
    }

    checkAuthOnLoad() {
        const path = window.location.pathname;
        const isProtected = path.includes("dashboard.html");
        const isLogin = path.includes("login.html");

        const token = this.getToken();

        if (isProtected && !token) {
            window.location.href = "login.html";
        }

        if (isLogin && token) {
            window.location.href = "dashboard.html";
        }
    }

    setApiUrl(url) {
        this.API_URL = url;
    }

    // --- RECOVERY LOGIC ---

    initRecovery() {
        console.log("AuthService: initRecovery started");
        const loginForm = document.getElementById("loginForm");
        const resetForm = document.getElementById("resetForm");
        const forgotLink = document.querySelector(".forgot-password");
        const backLink = document.getElementById("backToLogin");
        const resetBtn = document.getElementById("resetBtn");
        const headerTitle = document.querySelector(".login-header h2");
        const headerDesc = document.querySelector(".login-header p");

        console.log("Reset Form found:", resetForm);
        console.log("Forgot Link found:", forgotLink);

        // Switch to Reset
        if (forgotLink) {
            forgotLink.addEventListener("click", (e) => {
                e.preventDefault();
                console.log("Clicked Forgot Password");
                loginForm.style.display = 'none';
                resetForm.style.display = 'block';
                headerTitle.innerText = "Recuperar Acceso";
                headerDesc.innerText = "Ingresa tu usuario para recibir una nueva clave";
            });
        }

        // Back to Login
        if (backLink) {
            backLink.addEventListener("click", (e) => {
                e.preventDefault();
                console.log("Clicked Back to Login");
                resetForm.style.display = 'none';
                loginForm.style.display = 'block';
                headerTitle.innerText = "Bienvenido";
                headerDesc.innerText = "Accede a tu panel de control exclusivo";
            });
        }

        // Handle Reset Submit
        if (resetForm) {
            console.log("Attaching submit listener to Reset Form");
            resetForm.addEventListener("submit", async (e) => {
                console.log("Reset Form Submitted!");
                e.preventDefault();
                const username = document.getElementById("resetUsername").value;
                const errorMsg = document.getElementById("errorMsg");

                console.log("Username:", username);

                resetBtn.disabled = true;
                resetBtn.innerText = "Enviando...";
                if (errorMsg) errorMsg.style.display = 'none';

                try {
                    console.log("Sending request to:", this.API_URL);
                    const response = await fetch(this.API_URL, {
                        method: 'POST',
                        redirect: "follow",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({ action: 'resetPassword', username: username })
                    });

                    console.log("Response received status:", response.status);
                    const res = await response.json();
                    console.log("Response data:", res);

                    if (res.success) {
                        alert("¡Éxito! Se ha enviado una nueva contraseña a tu correo.");
                        backLink.click(); // Return to login
                    } else {
                        throw new Error(res.message || res.error || "No se pudo recuperar.");
                    }
                } catch (error) {
                    console.error("Error in reset request:", error);
                    if (errorMsg) {
                        errorMsg.innerText = error.message;
                        errorMsg.style.display = 'block';
                    } else {
                        alert("Error: " + error.message);
                    }
                } finally {
                    resetBtn.disabled = false;
                    resetBtn.innerText = "RECUPERAR CONTRASEÑA";
                }
            });
        } else {
            console.error("CRITICAL: resetForm element not found in DOM");
        }
    }
}

// Inicializar globalmente
window.auth = new AuthService();
// Inicializacion segura UI
document.addEventListener('DOMContentLoaded', () => {
    window.auth.initRecovery();
});
