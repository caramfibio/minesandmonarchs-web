/* ============================================================
   territorios.js – Mines & Monarch · Sistema de Territorios
   ============================================================ */

/* ── Dropdown (compartido) ── */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const btn = dropdown.querySelector('.dropbtn');
        const content = dropdown.querySelector('.dropdown-content');
        if (btn) {
            btn.addEventListener('click', e => {
                e.preventDefault();
                content.classList.toggle('show');
            });
        }
    });
    document.addEventListener('click', e => {
        document.querySelectorAll('.dropdown').forEach(d => {
            if (!d.contains(e.target)) d.querySelector('.dropdown-content').classList.remove('show');
        });
    });
});

/* ════════════════════════════════════════
   PÁGINA ÍNDICE
   ════════════════════════════════════════ */
async function initTerritorios(jsonPath) {
    let data;
    try {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error('No se pudo cargar ' + jsonPath);
        data = await res.json();
    } catch (err) {
        console.error('[Territorios]', err);
        return;
    }

    buildCarousel(data.territorios);
    buildGrid(data.territorios);
}

/* ── Carrusel ── */
function buildCarousel(territorios) {
    const track = document.getElementById('carouselTrack');
    const dotsEl = document.getElementById('carouselDots');
    if (!track) return;

    // Orden aleatorio de slides
    const shuffled = [...territorios].sort(() => Math.random() - 0.5);
    let current = 0;
    let autoTimer;

    shuffled.forEach((t, i) => {
        // Slide
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.style.backgroundImage = `url('${t.img_banner}')`;
        track.appendChild(slide);

        // Dot
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Ir a ${t.nombre}`);
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
    });

    function goTo(index) {
        current = (index + shuffled.length) % shuffled.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dotsEl.querySelectorAll('.carousel-dot').forEach((d, i) =>
            d.classList.toggle('active', i === current)
        );
    }

    function startAuto() {
        autoTimer = setInterval(() => goTo(current + 1), 4500);
    }
    function stopAuto() { clearInterval(autoTimer); }

    document.getElementById('carouselPrev')?.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    document.getElementById('carouselNext')?.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });

    startAuto();
}

/* ── Grid ── */
function buildGrid(territorios) {
    const grid = document.getElementById('territoriosGrid');
    if (!grid) return;

    territorios.forEach((t, i) => {
        const card = document.createElement('a');
        card.className = 'territorio-card';
        card.href = `Territorios/Territorio.html?id=${t.id}`;
        card.style.animationDelay = `${i * 0.08}s`;
        card.innerHTML = `
            <div class="tc-img-wrap">
                <img class="tc-img" src="${t.img_card}" alt="${t.nombre}" loading="lazy">
            </div>
            <div class="tc-body">
                <h3 class="tc-nombre">${t.nombre}</h3>
                <p class="tc-subtitulo">${t.subtitulo}</p>
                <p class="tc-descripcion">${t.descripcion_corta}</p>
                <span class="tc-gobierno">${t.forma_gobierno}</span>
            </div>`;
        grid.appendChild(card);
    });
}

/* ════════════════════════════════════════
   PÁGINA DETALLE
   ════════════════════════════════════════ */
async function initTerritorioDetalle(jsonPath) {
    const main = document.getElementById('territorioDetalle');
    if (!main) return;

    // Leer el id de la URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        main.innerHTML = '<p style="text-align:center;color:#c00;padding:60px">No se especificó ningún territorio.</p>';
        return;
    }

    let data;
    try {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error('No se pudo cargar ' + jsonPath);
        data = await res.json();
    } catch (err) {
        console.error('[Territorios Detalle]', err);
        main.innerHTML = '<p style="text-align:center;color:#c00;padding:60px">Error al cargar los datos.</p>';
        return;
    }

    const territorio = data.territorios.find(t => t.id === id);
    if (!territorio) {
        main.innerHTML = `<p style="text-align:center;color:#c00;padding:60px">Territorio "${id}" no encontrado.</p>`;
        return;
    }

    // Actualizar título de la pestaña
    document.title = `${territorio.nombre} – Mines & Monarch`;

    // Renderizar
    main.innerHTML = renderDetalle(territorio);
}

function renderDetalle(t) {
    const descripciones = (t.descripcion || []).map(p => `<p>${p}</p>`).join('');
    const fundadores    = (t.fundadores || []).map(f => `<li>${f}</li>`).join('');
    const religiones    = (t.religiones || []).map(r => `<li>${r}</li>`).join('');
    const razas         = (t.razas_permitidas || []).map(r => `<li>${r}</li>`).join('');
    const leyes         = (t.leyes || []).map(l => `<li>${l}</li>`).join('');

    return `
    <!-- Banner -->
    <div class="detalle-banner">
        <img class="detalle-banner-img" src="${t.img_banner}" alt="${t.nombre}">
        <div class="detalle-banner-overlay">
            <a class="detalle-back" href="Territorios/Territorios.html">← Volver a territorios</a>
            <h1 class="detalle-nombre">${t.nombre}</h1>
            <p class="detalle-subtitulo">${t.subtitulo}</p>
        </div>
    </div>

    <!-- Layout sidebar + contenido -->
    <div class="detalle-layout">

        <!-- ── Sidebar ── -->
        <aside class="detalle-sidebar">

            <div class="sidebar-block">
                <p class="sidebar-label">Forma de gobierno</p>
                <p class="sidebar-value">${t.forma_gobierno}</p>
            </div>

            <hr class="sidebar-divider">

            <div class="sidebar-block">
                <p class="sidebar-label">Fundador/es</p>
                <ul class="sidebar-list">${fundadores}</ul>
            </div>

            <hr class="sidebar-divider">

            <div class="sidebar-block">
                <p class="sidebar-label">Religiones / Creencias</p>
                <ul class="sidebar-list">${religiones}</ul>
            </div>

            <hr class="sidebar-divider">

            <div class="sidebar-block">
                <p class="sidebar-label">Razas permitidas</p>
                <ul class="sidebar-list">${razas}</ul>
            </div>

        </aside>

        <!-- ── Contenido principal ── -->
        <section class="detalle-content">

            <h2 class="detalle-section-title">Descripción</h2>
            <div class="detalle-descripcion">
                ${descripciones}
            </div>

            <hr class="detalle-divider">

            <h2 class="detalle-section-title">Leyes</h2>
            <ol class="leyes-lista">
                ${leyes}
            </ol>

        </section>
    </div>`;
}
