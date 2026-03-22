/* ============================================================
   raza.js  –  Mines & Monarch · Página de Razas
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

    const RAZAS_JSON = 'Razas/razas.json';

    const grid    = document.getElementById('razasGrid');
    const overlay = document.getElementById('modalOverlay');

    /* ── Carga de datos ── */
    let data;
    try {
        const res = await fetch(RAZAS_JSON);
        if (!res.ok) throw new Error(`No se pudo cargar ${RAZAS_JSON}`);
        data = await res.json();
    } catch (err) {
        console.error('[Razas] Error al cargar datos:', err);
        grid.innerHTML = '<p style="color:#c00;text-align:center">Error al cargar las razas. Revisa la consola.</p>';
        return;
    }

    /* ── Renderiza todas las cards ── */
    grid.innerHTML = '';
    Object.values(data).forEach(raza => {
        const card = document.createElement('div');
        card.className = 'raza-card';
        card.dataset.id = raza.id;
        card.innerHTML = `
            <img src="${raza.img}" alt="${raza.nombre}" loading="lazy">
            <div class="raza-info">
                <div class="raza-name">${raza.nombre}</div>
                <span class="raza-btn">Leer Más</span>
            </div>`;
        card.addEventListener('click', () => openModal(raza));
        grid.appendChild(card);
    });

    /* ── Abre el modal ── */
    function openModal(raza) {
        document.getElementById('modalImg').src              = raza.img;
        document.getElementById('modalImg').alt              = raza.nombre;
        document.getElementById('modalTitle').textContent    = raza.nombre;
        document.getElementById('modalDesc').textContent     = raza.desc;

        document.getElementById('modalCambios').innerHTML =
            raza.cambios.map(c => `<li>${c}</li>`).join('');

        document.getElementById('modalDetalles').innerHTML =
            raza.detalles.map(d => `<li>${d}</li>`).join('');

        document.getElementById('modalHabilidades').innerHTML =
            raza.habilidades.map(h =>
                `<li><strong>${h.nombre}:</strong> ${h.desc}</li>`
            ).join('');

        document.getElementById('modalClases').innerHTML =
            raza.clases.map(c => `<li>${c}</li>`).join('');

        overlay.setAttribute('data-raza', raza.id);
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

    // Dropdown functionality
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
