/* ============================================================
   guias.js  –  Mines & Monarch · Páginas de Guías (compartido)
   ============================================================
   Uso: cada HTML llama a initGuia('/ruta/al.json')
   ============================================================ */

// Dropdown functionality
document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const dropbtn = dropdown.querySelector('.dropbtn');
        const dropdownContent = dropdown.querySelector('.dropdown-content');
        
        if (dropbtn) {
            dropbtn.addEventListener('click', (e) => {
                e.preventDefault();
                dropdownContent.classList.toggle('show');
            });
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                dropdown.querySelector('.dropdown-content').classList.remove('show');
            }
        });
    });
});

async function initGuia(jsonPath, containerId = 'guiasContainer', overlayId = 'modalOverlay') {
    const container = document.getElementById(containerId);
    const overlay   = document.getElementById(overlayId);

    if (!container || !overlay) {
        console.error(`[Guias] No se encontró #${containerId} o #${overlayId}`);
        return;
    }

    /* ── Carga de datos ── */
    let data;
    try {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error(`No se pudo cargar ${jsonPath}`);
        data = await res.json();
    } catch (err) {
        console.error('[Guias] Error al cargar datos:', err);
        container.innerHTML = '<p style="color:#c00;text-align:center">Error al cargar la guía. Revisa la consola.</p>';
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
        entry.addEventListener('click', () => openModal(entrada.modal));
        grid.appendChild(entry);
    });

    container.innerHTML = '';
    container.appendChild(grid);

    /* ── Abre el modal ── */
    function openModal(modal) {
        // Buscar elementos DENTRO del overlay específico, usando clases (no IDs globales)
        const img    = overlay.querySelector('.modal-img');
        const title  = overlay.querySelector('.modal-title');
        // Acepta tanto #modalCuerpo como .modal-cuerpo-simple dentro de este overlay
        const cuerpo = overlay.querySelector('[id="modalCuerpo"], .modal-cuerpo-simple');

        if (img) {
            img.src = modal.img || '';
            img.alt = modal.titulo || '';
            // Ocultar la imagen si no hay src
            img.style.display = modal.img ? 'block' : 'none';
        }

        if (title) title.textContent = modal.titulo || '';

        if (cuerpo) {
            cuerpo.innerHTML = '';

            (modal.secciones || []).forEach((sec, i) => {
                if (i > 0) {
                    const hr = document.createElement('hr');
                    hr.className = 'modal-divider';
                    cuerpo.appendChild(hr);
                }
                const div = document.createElement('div');
                div.className = 'modal-section';

                let html = '';
                if (sec.titulo) {
                    html += `<h3 class="modal-section-title">${sec.titulo}</h3>`;
                }
                if (sec.texto) {
                    html += `<p class="modal-text">${sec.texto}</p>`;
                }
                if (sec.lista && sec.lista.length > 0) {
                    html += '<ul class="modal-list">' +
                        sec.lista.map(item => `<li>${item}</li>`).join('') +
                        '</ul>';
                }

                div.innerHTML = html;
                cuerpo.appendChild(div);
            });
        }

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /* ── Cierra el modal ── */
    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    /* ── Eventos del modal ── */
    // Usar clase en vez de ID para evitar conflictos cuando hay varios modales
    const closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) {
        // Evitar duplicar listeners si initGuia se llama varias veces
        closeBtn.replaceWith(closeBtn.cloneNode(true));
        overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    }

    // Click en el fondo oscuro
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
    });

    // Tecla Escape — solo registrar una vez por overlay
    if (!overlay._escListener) {
        overlay._escListener = (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
        };
        document.addEventListener('keydown', overlay._escListener);
    }
}
