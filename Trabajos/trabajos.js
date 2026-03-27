/* ============================================================
   trabajos.js  –  Mines & Monarch · Página de Trabajos
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

    const TRABAJOS_JSON = 'Trabajos/trabajos.json';

    const grid    = document.getElementById('trabajosGrid');
    const overlay = document.getElementById('modalOverlay');

    /* ── Carga de datos ── */
    let data;
    try {
        const res = await fetch(TRABAJOS_JSON);
        if (!res.ok) throw new Error(`No se pudo cargar ${TRABAJOS_JSON}`);
        data = await res.json();
    } catch (err) {
        console.error('[Trabajos] Error al cargar datos:', err);
        grid.innerHTML = '<p style="color:#c00;text-align:center">Error al cargar los trabajos. Revisa la consola.</p>';
        return;
    }

    /* ── Renderiza todas las cards ── */
    grid.innerHTML = '';
    Object.values(data).forEach(trabajo => {
        const card = document.createElement('div');
        card.className = 'raza-card';
        card.dataset.id = trabajo.id;
        card.innerHTML = `
            <img src="${trabajo.img}" alt="${trabajo.nombre}" loading="lazy">
            <div class="raza-info">
                <div class="raza-name">${trabajo.nombre}</div>
                <span class="raza-btn">Leer Más</span>
            </div>`;
        card.addEventListener('click', () => openModal(trabajo));
        grid.appendChild(card);
    });

    /* ── Abre el modal ── */
    function openModal(trabajo) {
        document.getElementById('modalImg').src           = trabajo.img;
        document.getElementById('modalImg').alt           = trabajo.nombre;
        document.getElementById('modalTitle').textContent = trabajo.nombre;
        document.getElementById('modalDesc').textContent  = trabajo.desc;

        const habilidadesEl = document.getElementById('modalHabilidades');
        const sinHabilidadesEl = document.getElementById('modalSinHabilidades');

        if (trabajo.habilidades && trabajo.habilidades.length > 0) {
            habilidadesEl.innerHTML = trabajo.habilidades.map(h => `<li>${h}</li>`).join('');
            habilidadesEl.style.display = '';
            sinHabilidadesEl.style.display = 'none';
        } else {
            habilidadesEl.innerHTML = '';
            habilidadesEl.style.display = 'none';
            sinHabilidadesEl.style.display = '';
        }

        overlay.setAttribute('data-trabajo', trabajo.id);
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /* ── Cierra el modal ── */
    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    /* ── Eventos ── */
    document.getElementById('modalClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    /* ── Dropdown ── */
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const btn     = dropdown.querySelector('.dropbtn');
        const content = dropdown.querySelector('.dropdown-content');
        if (btn) btn.addEventListener('click', e => { e.preventDefault(); content.classList.toggle('show'); });
    });
    document.addEventListener('click', e => {
        document.querySelectorAll('.dropdown').forEach(d => {
            if (!d.contains(e.target)) d.querySelector('.dropdown-content').classList.remove('show');
        });
    });

});
