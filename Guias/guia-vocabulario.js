/* ============================================================
   guia-simple.js  –  Mines & Monarch · Sección simple (solo título + párrafos)
   ============================================================
   Uso: initGuiaSimple('ruta/al.json', 'idContenedor', 'idModal')
   ============================================================ */

async function initGuiaSimple(jsonPath, containerId = 'guiasContainer2', overlayId = 'modalOverlay2') {
    const container = document.getElementById(containerId);
    const overlay   = document.getElementById(overlayId);
    const closeBtn  = overlay.querySelector('.modal-close');
    const titleEl   = overlay.querySelector('.modal-title');
    const cuerpoEl  = overlay.querySelector('.modal-cuerpo-simple');

    /* ── Carga de datos ── */
    let data;
    try {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error(`No se pudo cargar ${jsonPath}`);
        data = await res.json();
    } catch (err) {
        console.error('[GuiaSimple] Error:', err);
        container.innerHTML = '<p style="color:#c00;text-align:center">Error al cargar. Revisa la consola.</p>';
        return;
    }

    /* ── Renderiza grid ── */
    const grid = document.createElement('div');
    grid.className = 'guia-grid';

    data.entradas.forEach(entrada => {
        const entry = document.createElement('div');
        entry.className = 'guia-entry';
        entry.innerHTML = `
            <img class="guia-entry-img" src="${entrada.img}" alt="${entrada.titulo}" loading="lazy">
            <div class="guia-entry-body">${entrada.titulo}</div>
            <span class="guia-entry-arrow">→</span>`;
        entry.addEventListener('click', () => openModal(entrada));
        grid.appendChild(entry);
    });

    container.innerHTML = '';
    container.appendChild(grid);

    /* ── Abre el modal ── */
    function openModal(entrada) {
        titleEl.textContent  = entrada.titulo;
        cuerpoEl.innerHTML   = '';

        entrada.parrafos.forEach(p => {
            const el = document.createElement('p');
            el.className   = 'modal-text';
            el.textContent = p;
            cuerpoEl.appendChild(el);
        });

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /* ── Cierra el modal ── */
    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}
