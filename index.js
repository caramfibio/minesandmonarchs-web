document.addEventListener('DOMContentLoaded', () => {

    /* ── Mobile menu toggle ── */
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.querySelector('.header-right ul');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('show'));
    }

    /* ── Dropdowns ── */
    const closeDropdowns = () => {
        document.querySelectorAll('.dropdown .dropdown-content.show').forEach(content => {
            content.classList.remove('show');
        });
    };

    const initDropdowns = () => {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            const btn = dropdown.querySelector('.dropbtn');
            const content = dropdown.querySelector('.dropdown-content');
            if (!btn || !content) return;

            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();

                const isOpen = content.classList.contains('show');
                closeDropdowns();
                if (!isOpen) {
                    content.classList.add('show');
                }
            });
        });
    };

    initDropdowns();
    document.addEventListener('click', e => {
        if (!e.target.closest('.dropdown')) closeDropdowns();
    });

    /* ── Botón de cuenta en el nav ── */
    const btnNav = document.getElementById('nav-cuenta-btn');
    const liNav = document.getElementById('nav-cuenta-li');

    if (liNav && btnNav) {
        liNav.classList.remove('dropdown');
        btnNav.textContent = 'Cuenta';
        btnNav.addEventListener('click', e => {
            e.preventDefault();
            if (typeof window.abrirModalCuenta === 'function') {
                window.abrirModalCuenta();
            } else {
                setTimeout(() => {
                    if (typeof window.abrirModalCuenta === 'function') window.abrirModalCuenta();
                }, 300);
            }
        });
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
