(() => {
    function inyectar() {
        if (document.getElementById('cmOverlay')) return;

        document.body.insertAdjacentHTML('beforeend', `
        <div class="cm-overlay" id="cmOverlay">
            <div class="cm-box">
                <div class="cm-header">
                    <div class="cm-header-deco"></div>
                    <button class="cm-close" id="cmClose" type="button" aria-label="Cerrar">✕</button>
                    <h2 class="cm-titulo" id="cmTitulo">Cuenta</h2>
                    <p class="cm-subtitulo" id="cmSub">Próximamente podrás gestionar tu cuenta aquí.</p>
                </div>

                <div class="cm-body">
                    <p style="margin:0 0 16px; line-height:1.6; color:#e0d0a8;">
                        Esta sección está en construcción. Por ahora solo puedes ver información básica sobre tu cuenta.
                    </p>
                    <div class="cm-opciones">
                        <button class="cm-opcion-btn" id="optCerrar" type="button">
                            <span class="cm-opcion-icono">⚜</span>
                            <span>Cerrar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `);
    }

    function cerrar() {
        const overlay = document.getElementById('cmOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function abrir() {
        inyectar();
        const overlay = document.getElementById('cmOverlay');
        if (!overlay) return;

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    document.addEventListener('DOMContentLoaded', () => {
        inyectar();

        const overlay = document.getElementById('cmOverlay');
        const closeBtn = document.getElementById('cmClose');
        const cerrarBtn = document.getElementById('optCerrar');

        if (closeBtn) closeBtn.addEventListener('click', cerrar);
        if (cerrarBtn) cerrarBtn.addEventListener('click', cerrar);

        if (overlay) {
            overlay.addEventListener('click', e => {
                if (e.target.id === 'cmOverlay') cerrar();
            });

            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && overlay.classList.contains('active')) cerrar();
            });
        }
    });

    window.abrirModalCuenta = abrir;
    window.cerrarModalCuenta = cerrar;
})();
