/* ============================================================
   Clases.js  –  Mines & Monarch · Página de Clases
   ============================================================
   Flujo:
     1. Al cargar la página se hace fetch de clases.json
     2. Se generan dinámicamente todas las clase-cards en el grid
     3. Al clicar una card se abre el modal con los datos de esa clase
   ============================================================ */

const CLASES_JSON = 'Clases/clases.json';

/* ── Elementos del DOM ── */
const grid    = document.getElementById('clasesGrid');
const overlay = document.getElementById('modalOverlay');

/* ── Carga y renderizado inicial ── */
async function init() {
    try {
        const res  = await fetch(CLASES_JSON);
        if (!res.ok) throw new Error(`No se pudo cargar ${CLASES_JSON}`);
        const data = await res.json();

        renderCards(data);
        setupModal();
    } catch (err) {
        console.error('[Clases] Error al cargar datos:', err);
        grid.innerHTML = '<p style="color:#c00;text-align:center">Error al cargar las clases. Revisa la consola.</p>';
    }
}

/* ── Renderiza todas las cards ── */
function renderCards(data) {
    grid.innerHTML = '';

    Object.values(data).forEach(clase => {
        const card = document.createElement('div');
        card.className = 'raza-card';
        card.dataset.id = clase.id;
        card.innerHTML = `
            <img src="${clase.img}" alt="${clase.nombre}" loading="lazy">
            <div class="raza-info">
                <div class="raza-name">${clase.nombre}</div>
                <span class="raza-btn">Leer Más</span>
            </div>`;

        card.addEventListener('click', () => openModal(clase));
        grid.appendChild(card);
    });
}

/* ── Abre el modal con los datos de una clase ── */
function openModal(clase) {
    /* imagen y cabecera */
    document.getElementById('modalImg').src     = clase.img;
    document.getElementById('modalImg').alt     = clase.nombre;
    document.getElementById('modalTitle').textContent = clase.nombre;
    document.getElementById('modalDesc').textContent  = clase.desc;

    /* razas permitidas (pills) */
    document.getElementById('modalRazas').innerHTML =
        clase.razas.map(r => `<li>${r}</li>`).join('');

    /* habilidades */
    document.getElementById('modalHabilidades').innerHTML =
        clase.habilidades.map(h => `<li>${h}</li>`).join('');

    /* color de la clase */
    overlay.setAttribute('data-clase', clase.id);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/* ── Cierra el modal ── */
function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

/* ── Eventos globales del modal ── */
function setupModal() {
    /* botón ✕ */
    document.getElementById('modalClose').addEventListener('click', closeModal);

    /* clic en el fondo oscuro */
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
    });

    /* tecla Escape */
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
    
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
}

/* ── Arranque ── */
document.addEventListener('DOMContentLoaded', init);
