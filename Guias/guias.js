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

async function initGuia(jsonPath) {
    const container = document.getElementById('guiasContainer');
    const overlay   = document.getElementById('modalOverlay');

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

    /* ── Renderiza grid directo ── */
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
        document.getElementById('modalImg').src           = modal.img;
        document.getElementById('modalImg').alt           = modal.titulo;
        document.getElementById('modalTitle').textContent = modal.titulo;

        const cuerpo = document.getElementById('modalCuerpo');
        cuerpo.innerHTML = '';

        modal.secciones.forEach((sec, i) => {
            if (i > 0) {
                const hr = document.createElement('hr');
                hr.className = 'modal-divider';
                cuerpo.appendChild(hr);
            }
            const div = document.createElement('div');
            div.className = 'modal-section';
            let html = `<h3 class="modal-section-title">${sec.titulo}</h3>`;
            if (sec.texto) html += `<p class="modal-text">${sec.texto}</p>`;
            if (sec.lista && sec.lista.length > 0) {
                html += '<ul class="modal-list">' +
                    sec.lista.map(item => `<li>${item}</li>`).join('') +
                    '</ul>';
            }
            div.innerHTML = html;
            cuerpo.appendChild(div);
        });

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /* ── Cierra el modal ── */
    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    /* ── Eventos del modal ── */
    document.getElementById('modalClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}
