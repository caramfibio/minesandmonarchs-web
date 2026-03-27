document.addEventListener('DOMContentLoaded', () => {

    /* ── Mobile menu toggle ── */
    const menuToggle = document.getElementById('menu-toggle');
    const navList    = document.querySelector('.header-right ul');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('show'));
    }

    /* ── Dropdowns ── */
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const btn     = dropdown.querySelector('.dropbtn');
        const content = dropdown.querySelector('.dropdown-content');
        if (btn) btn.addEventListener('click', e => { e.preventDefault(); content.classList.toggle('show'); });
    });
    document.addEventListener('click', e => {
        dropdowns.forEach(d => {
            if (!d.contains(e.target)) d.querySelector('.dropdown-content').classList.remove('show');
        });
    });

    /* ── Botón de cuenta en el nav ── */
    const navUl = document.querySelector('.header-right ul');
    if (navUl) {
        const li = document.createElement('li');
        li.id = 'nav-cuenta-li';
        li.innerHTML = `<a href="#" id="nav-cuenta-btn" style="font-weight:bold">Entrar</a>`;
        navUl.appendChild(li);

        /* Actualizar texto si ya hay sesión guardada */
        const sesion = JSON.parse(sessionStorage.getItem('mm_usuario') || 'null');
        const btnNav = document.getElementById('nav-cuenta-btn');
        if (sesion) btnNav.textContent = sesion.nombreUsuario;

        btnNav.addEventListener('click', e => {
            e.preventDefault();
            const s = JSON.parse(sessionStorage.getItem('mm_usuario') || 'null');
            if (s) {
                window.location.href = 'Cuenta/Cuenta.html';
            } else {
                if (typeof window.abrirModalCuenta === 'function') window.abrirModalCuenta();
            }
        });
    }

    /* ── Carga JSON solo si estamos en index.html ── */
    if (!document.querySelector('#ayuda')) return;

    fetch('index.json')
        .then(r => r.json())
        .then(data => {
            const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };

            set('#ayuda h3',             data.ayuda.title);
            set('#ayuda p',              data.ayuda.text);
            const btnAyuda = document.querySelector('#ayuda button');
            if (btnAyuda) { btnAyuda.textContent = data.ayuda.button; btnAyuda.onclick = () => location.href = data.ayuda.link; }

            set('#explicacion h3',       data.explicacion.title);
            set('#explicacion p',        data.explicacion.text);

            set('#bienvenida .bienvenido h3', data.bienvenida.title);
            set('#bienvenida .bienvenido p',  data.bienvenida.text);

            const tabla = document.querySelector('#bienvenida .ranking table');
            if (tabla && data.ranking) {
                data.ranking.forEach(r => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${r.pos}</td><td>${r.name}</td><td>${r.points}</td>`;
                    tabla.appendChild(tr);
                });
            }

            set('#unirse h3',            data.unirse.title);
            set('#unirse p',             data.unirse.text);
            set('#historia h3',          data.historia.title);
            set('#historia p',           data.historia.text);
        })
        .catch(err => console.error('Error loading JSON:', err));
});
