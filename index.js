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
        const sesion = JSON.parse(sessionStorage.getItem('mm_usuario') || 'null');
        const li = document.createElement('li');
        li.id = 'nav-cuenta-li';

        if (sesion) {
            /* Con sesión — nombre del personaje + dropdown */
            li.classList.add('dropdown');
            li.innerHTML = `
                <button class="dropbtn" id="nav-cuenta-btn"
                    style="display:flex;align-items:center;gap:8px;padding:6px 14px;font-weight:bold;color:#ffd700">
                    ⚜ ${sesion.nombreRol || sesion.discord}
                </button>
                <ul class="dropdown-content" style="right:0;left:auto;min-width:160px;">
                    <li><a href="Cuenta/Cuenta.html">Mi cartilla</a></li>
                    <li><a href="#" id="btnCerrarSesion">Cerrar sesión</a></li>
                </ul>`;
            navUl.appendChild(li);

            li.querySelector('#nav-cuenta-btn').addEventListener('click', e => {
                e.preventDefault();
                li.querySelector('.dropdown-content').classList.toggle('show');
            });
            document.getElementById('btnCerrarSesion').addEventListener('click', e => {
                e.preventDefault();
                sessionStorage.removeItem('mm_usuario');
                location.reload();
            });

        } else {
            /* Sin sesión — botón Entrar */
            li.innerHTML = `
                <a href="#" id="nav-cuenta-btn"
                   style="font-weight:bold;white-space:nowrap;">
                   Entrar
                </a>`;
            navUl.appendChild(li);

            document.getElementById('nav-cuenta-btn').addEventListener('click', e => {
                e.preventDefault();
                if (typeof window.abrirModalCuenta === 'function') {
                    window.abrirModalCuenta();
                }
            });
        }
    }

    /* ── Carga JSON solo si estamos en index.html ── */
    if (!document.querySelector('#ayuda')) return;

    fetch('index.json')
        .then(r => r.json())
        .then(data => {
            const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };

            set('#ayuda h3',  data.ayuda.title);
            set('#ayuda p',   data.ayuda.text);
            const btnAyuda = document.querySelector('#ayuda button');
            if (btnAyuda) {
                btnAyuda.textContent = data.ayuda.button;
                btnAyuda.onclick = () => location.href = data.ayuda.link;
            }

            set('#explicacion h3', data.explicacion.title);
            set('#explicacion p',  data.explicacion.text);

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

            set('#unirse h3',  data.unirse.title);
            set('#unirse p',   data.unirse.text);
            set('#historia h3', data.historia.title);
            set('#historia p',  data.historia.text);
        })
        .catch(err => console.error('Error loading JSON:', err));
});
