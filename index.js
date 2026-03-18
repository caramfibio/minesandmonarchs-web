document.addEventListener('DOMContentLoaded', () => {
    // mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.querySelector('.header-right ul');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('show');
        });
    }

    // dropdown toggle for Creación personaje
    const dropbtn = document.querySelector('.dropbtn');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (dropbtn) {
        dropbtn.addEventListener('click', (e) => {
            e.preventDefault();
            dropdownContent.classList.toggle('show');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            dropdownContent.classList.remove('show');
        }
    });

    // cargar contenido desde JSON de ejemplo
    fetch('/index.json')
        .then(r => r.json())
        .then(data => {
            document.querySelector('#ayuda h3').textContent = data.ayuda.title;
            document.querySelector('#ayuda p').textContent = data.ayuda.text;
            document.querySelector('#ayuda button').textContent = data.ayuda.button;
            document.querySelector('#ayuda button').onclick = () => location.href = data.ayuda.link;

            document.querySelector('#explicacion h3').textContent = data.explicacion.title;
            document.querySelector('#explicacion p').textContent = data.explicacion.text;

            document.querySelector('#bienvenida .bienvenido h3').textContent = data.bienvenida.title;
            document.querySelector('#bienvenida .bienvenido p').textContent = data.bienvenida.text;

            const tbody = document.querySelector('#bienvenida .ranking table');
            data.ranking.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${r.pos}</td><td>${r.name}</td><td>${r.points}</td>`;
                tbody.appendChild(tr);
            });

            document.querySelector('#unirse h3').textContent = data.unirse.title;
            document.querySelector('#unirse p').textContent = data.unirse.text;

            document.querySelector('#historia h3').textContent = data.historia.title;
            document.querySelector('#historia p').textContent = data.historia.text;
        })
        .catch(error => console.error('Error loading JSON:', error));
});