/* ============================================================
   cuenta.js – Mines & Monarch · Página de Cuenta
   ============================================================ */

import {
    escucharSesion,
    cerrarSesion,
    inyectarFormularioCuentas
} from '../cuentas.js';

import { RAZAS_LABELS, CLASES_LABELS, TRABAJOS_LABELS } from '../enums.js';

/* ── Dropdown del header ── */
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

/* ── Inyectar el modal de login/registro ── */
inyectarFormularioCuentas();

/* ── Referencias del DOM ── */
const estadoCargando  = document.getElementById('estadoCargando');
const estadoSinSesion = document.getElementById('estadoSinSesion');
const estadoConSesion = document.getElementById('estadoConSesion');

/* ── Escucha el estado de sesión en tiempo real ── */
escucharSesion(perfil => {
    estadoCargando.style.display = 'none';

    if (!perfil) {
        /* Sin sesión */
        estadoSinSesion.style.display = 'flex';
        estadoConSesion.style.display = 'none';
        return;
    }

    /* Con sesión — rellenar la ficha */
    estadoSinSesion.style.display = 'none';
    estadoConSesion.style.display = 'block';
    renderPerfil(perfil);
});

/* ── Rellena la página con los datos del perfil ── */
function renderPerfil(perfil) {
    /* Avatar con la inicial del nombre */
    const inicial = (perfil.nombre || '?')[0].toUpperCase();
    document.getElementById('cuentaAvatar').textContent  = inicial;

    document.getElementById('cuentaId').textContent      = `#${String(perfil.id).padStart(4, '0')}`;
    document.getElementById('cuentaNombre').textContent  = perfil.nombre;
    document.getElementById('cuentaDiscord').textContent = perfil.usuarioDiscord;

    document.getElementById('fichaRaza').textContent    = RAZAS_LABELS[perfil.raza]    || perfil.raza;
    document.getElementById('fichaClase').textContent   = CLASES_LABELS[perfil.clase]  || perfil.clase;
    document.getElementById('fichaTrabajo').textContent = TRABAJOS_LABELS[perfil.trabajo] || perfil.trabajo;

    /* Badge admin solo si corresponde */
    document.getElementById('fichaAdminItem').style.display = perfil.isAdmin ? '' : 'none';

    /* Título de la pestaña */
    document.title = `${perfil.nombre} – Mines & Monarch`;
}

/* ── Botón "Entrar / Registrarse" (estado sin sesión) ── */
document.getElementById('btnAbrirModal').addEventListener('click', () => {
    document.getElementById('cuentasOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
});

/* ── Botón "Cerrar sesión" ── */
document.getElementById('btnLogout').addEventListener('click', async () => {
    await cerrarSesion();
});
