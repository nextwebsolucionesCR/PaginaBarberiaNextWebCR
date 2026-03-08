/**
 * NextWeb CR Protection Module
 * Protege el código fuente y los recursos visuales.
 */

(function () {
    console.log(
        "%c Developed by NextWeb CR ",
        "background: #000; color: #fff; padding: 10px; border-radius: 5px; font-weight: bold; font-family: sans-serif; border: 2px solid #D4AF37;"
    );

    // Disable Right Click
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        showToast("Protegido por NextWeb CR ©");
    });

    // Disable Shortcuts (F12, Ctrl+Shift+I, etc)
    document.addEventListener('keydown', function (e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            showToast("Acceso al código restringido - NextWeb CR");
            return;
        }

        // Ctrl+Shift+I (DevTools)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            showToast("Acceso al código restringido - NextWeb CR");
            return;
        }

        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            showToast("Acceso al código restringido - NextWeb CR");
            return;
        }

        // Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            showToast("Acceso al código restringido - NextWeb CR");
            return;
        }

        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            showToast("Acceso al código restringido - NextWeb CR");
            return;
        }

        // Ctrl+S (Save)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            showToast("Protegido por NextWeb CR ©");
            return;
        }
    });

    function showToast(msg) {
        // Remove existing toast if any
        let existingToast = document.querySelector('.protection-toast');
        if (existingToast) existingToast.remove();

        let toast = document.createElement('div');
        toast.className = 'protection-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(0,0,0,0.9)';
        toast.style.color = '#D4AF37';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '50px';
        toast.style.zIndex = '9999999';
        toast.style.fontFamily = "'Manrope', sans-serif";
        toast.style.fontSize = '14px';
        toast.style.fontWeight = '600';
        toast.style.border = '1px solid #D4AF37';
        toast.style.boxShadow = '0 5px 20px rgba(0,0,0,0.6)';
        toast.style.backdropFilter = 'blur(5px)';
        toast.style.textAlign = 'center';
        toast.style.pointerEvents = 'none';
        toast.innerText = msg;
        document.body.appendChild(toast);

        // Animation
        toast.animate([
            { opacity: 0, transform: 'translateX(-50%) translateY(20px)' },
            { opacity: 1, transform: 'translateX(-50%) translateY(0)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });

        setTimeout(() => {
            let fadeOut = toast.animate([
                { opacity: 1 },
                { opacity: 0 }
            ], {
                duration: 500,
                easing: 'ease-in'
            });

            fadeOut.onfinish = () => toast.remove();
        }, 2000);
    }
})();
