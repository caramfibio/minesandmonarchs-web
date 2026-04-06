/* ============================================================
   admin.js – Mines & Monarch · Panel de Administración
   Solo accesible para usuarios con rol 'admin'
   ============================================================ */

import { initializeApp }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut }
    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

const firebaseConfig = {
    apiKey:            "AIzaSyC97DUSkDy8qOHnk5rm3P-263m4W6Okbzo",
    authDomain:        "minesandmonarch.firebaseapp.com",
    projectId:         "minesandmonarch",
    storageBucket:     "minesandmonarch.firebasestorage.app",
    messagingSenderId: "379898851786",
    appId:             "1:379898851786:web:b892cbf4d8508798d61f33"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ── Datos de referencia ── */
const RAZAS = {
    humano:"Humano", elfobosque:"Elfo del Bosque", alfiq:"Alfiq",
    goblin:"Goblin", enano:"Enano", aracnido:"Arácnido", yeti:"Yeti",
    demonio:"Demonio", sirena:"Sirena", valquiria:"Valquiria",
    hadapixie:"Hada Pixie", hadafae:"Hada Fae", granelfo:"Gran Elfo",
    gorgona:"Gorgona", victimapeste:"Víctima de la Peste",
    banshee:"Banshee", elfolunar:"Elfo Lunar", ogro:"Ogro", revenant:"Revenant",
    ribbit:"Ribbit"
};
const CLASES = {
    cazador:"Cazador", guardabosques:"Guardabosques", curador:"Curador",
    magoender:"Mago del Ender", magoelectrico:"Mago Eléctrico",
    magosangre:"Mago de Sangre", magohelado:"Mago Helado",
    magoinvocador:"Mago Invocador", magofuego:"Mago de Fuego",
    granmago:"Gran Mago", granmagooscuro:"Gran Mago Oscuro",
    guerrerobendito:"Guerrero Bendito", hiedravenenosa:"Hiedra Venenosa",
    rogue:"Rogue", tanque:"Tanque", berserker:"Berserker",
    guerrero:"Guerrero", bardo:"Bardo", guerrerodelmar:"Guerrero del Mar",
    carterista:"Carterista", paladin:"Paladín", ingeniero:"Ingeniero",
    bestiasalvaje:"Bestia Salvaje", angler:"Angler",
    magoeldritch:"Mago del Eldritch", niceGuy:"Nice Guy"
};
const CLASES_POR_RAZA = {
    humano:       ['cazador','guerrero','tanque'],
    elfobosque:   ['cazador','guardabosques','curador'],
    alfiq:        ['carterista','angler','cazador','rogue'],
    goblin:       ['carterista','ingeniero','cazador','rogue'],
    enano:        ['berserker','ingeniero','tanque'],
    aracnido:     ['berserker','ingeniero','tanque'],
    yeti:         ['magohelado','bestiasalvaje','berserker'],
    demonio:      ['magofuego','berserker','bestiasalvaje'],
    sirena:       ['angler','guerrerodelmar','bardo'],
    valquiria:    ['guerrerobendito','guerrero','paladin'],
    hadapixie:    ['guardabosques','curador'],
    hadafae:      ['guardabosques','curador'],
    granelfo:     ['granmago','magoelectrico','guardabosques'],
    gorgona:      ['hiedravenenosa','guerrero'],
    victimapeste: ['magosangre','angler'],
    banshee:      ['magoender','magoeldritch'],
    elfolunar:    ['magoender','rogue','bardo'],
    ogro:         ['magosangre','angler'],
    revenant:     ['granmagooscuro','magoinvocador','magosangre','magoender'],
    ribbit:       ['niceGuy']
};
const TRABAJOS = {
    constructor:"Constructor", inutilerrante:"Inútil Errante",
    explorador:"Explorador", clerigo:"Clérigo", mercader:"Mercader",
    metalurgico:"Metalúrgico", agricultor:"Agricultor",
    granjero:"Granjero", cocinero:"Cocinero"
};

const opts = (obj, sel = '') => Object.entries(obj)
    .map(([v,l]) => `<option value="${v}"${v===sel?' selected':''}>${l}</option>`).join('');

/* ── Estado global ── */
let todosLosPersonajes = [];

/* ════════════════════════
   GUARD – solo admins
   ════════════════════════ */
onAuthStateChanged(auth, async user => {
    if (!user) return denegarAcceso();
    try {
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        if (!snap.exists() || snap.data().rol !== 'admin') return denegarAcceso();
        /* Es admin — arrancar panel */
        document.getElementById('nav-admin-nombre').textContent = `⚜ ${snap.data().personaje?.nombreRol || 'Admin'}`;
        await cargarPersonajes();
    } catch {
        denegarAcceso();
    }
});

function denegarAcceso() {
    const main = document.querySelector('.admin-main');
    main.innerHTML = `
        <div class="admin-denegado">
            <h2>⛔ Acceso denegado</h2>
            <p>No tienes permisos para ver esta página.</p>
            <a href="/minesandmonarchs-web/" style="color:#ffd700">← Volver al inicio</a>
        </div>`;
}

/* ════════════════════════
   CERRAR SESIÓN
   ════════════════════════ */
document.getElementById('btnCerrarSesionAdmin').addEventListener('click', async e => {
    e.preventDefault();
    await signOut(auth);
    sessionStorage.removeItem('mm_usuario');
    window.location.href = '/minesandmonarchs-web/';
});

/* ════════════════════════
   CARGAR PERSONAJES
   ════════════════════════ */
async function cargarPersonajes() {
    const loading = document.getElementById('loadingMsg');
    const tabla   = document.getElementById('adminTabla');
    try {
        const snap = await getDocs(collection(db, 'usuarios'));
        todosLosPersonajes = [];
        snap.forEach(d => {
            const data = d.data();
            if (data.personaje) todosLosPersonajes.push({ uid: d.id, ...data });
        });

        /* Stats */
        document.getElementById('totalPersonajes').textContent = todosLosPersonajes.length;
        document.getElementById('totalAdmins').textContent     = todosLosPersonajes.filter(p => p.rol === 'admin').length;
        document.getElementById('totalCiudadanos').textContent = todosLosPersonajes.filter(p => p.rol === 'ciudadano').length;

        loading.style.display = 'none';
        tabla.style.display   = '';
        renderTabla(todosLosPersonajes);
    } catch (err) {
        loading.textContent = 'Error al cargar los personajes.';
        console.error(err);
    }
}

/* ════════════════════════
   RENDER TABLA
   ════════════════════════ */
function renderTabla(lista) {
    const tbody = document.getElementById('adminTbody');
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#6a5a3a;padding:32px">No se encontraron personajes.</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map((p, i) => {
        const per = p.personaje;
        const badgeClass = p.rol === 'admin' ? 'badge-admin' : p.rol === 'escriba' ? 'badge-escriba' : 'badge-ciudadano';
        return `<tr>
            <td>${p.id || i+1}</td>
            <td><strong>${per.nombreRol}</strong></td>
            <td>${p.discord || '—'}</td>
            <td>${per.nombreMC || '—'}</td>
            <td>${RAZAS[per.raza] || per.raza}</td>
            <td>${CLASES[per.clase] || per.clase}</td>
            <td>${TRABAJOS[per.trabajo] || per.trabajo}</td>
            <td><span class="badge ${badgeClass}">${p.rol}</span></td>
            <td>
                <button class="btn-editar" data-uid="${p.uid}">✏️ Editar</button>
                <button class="btn-eliminar" data-uid="${p.uid}" data-nombre="${per.nombreRol}">🗑️ Eliminar</button>
            </td>
        </tr>`;
    }).join('');

    /* Eventos de botones */
    tbody.querySelectorAll('.btn-editar').forEach(btn =>
        btn.addEventListener('click', () => abrirEditar(btn.dataset.uid)));
    tbody.querySelectorAll('.btn-eliminar').forEach(btn =>
        btn.addEventListener('click', () => abrirEliminar(btn.dataset.uid, btn.dataset.nombre)));
}

/* ════════════════════════
   BÚSQUEDA
   ════════════════════════ */
document.getElementById('searchInput').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    const filtrado = todosLosPersonajes.filter(p => {
        const per = p.personaje;
        return (per.nombreRol?.toLowerCase().includes(q) ||
                p.discord?.toLowerCase().includes(q) ||
                per.nombreMC?.toLowerCase().includes(q));
    });
    renderTabla(filtrado);
});

/* ════════════════════════
   MODAL EDITAR
   ════════════════════════ */
function abrirEditar(uid) {
    const p   = todosLosPersonajes.find(x => x.uid === uid);
    const per = p.personaje;

    document.getElementById('editUid').value        = uid;
    document.getElementById('editDiscord').value    = p.discord || '';
    document.getElementById('editNombreMC').value   = per.nombreMC || '';
    document.getElementById('editNombreRol').value  = per.nombreRol || '';
    document.getElementById('editRolSistema').value = p.rol || 'ciudadano';

    /* Raza */
    const selRaza = document.getElementById('editRaza');
    selRaza.innerHTML = opts(RAZAS, per.raza);

    /* Clase según raza actual */
    rellenarClases(per.raza, per.clase);

    /* Trabajo */
    document.getElementById('editTrabajo').innerHTML = opts(TRABAJOS, per.trabajo);

    selRaza.addEventListener('change', function () {
        rellenarClases(this.value, '');
    });

    document.getElementById('editError').style.display = 'none';
    document.getElementById('editOverlay').classList.add('active');
}

function rellenarClases(raza, claseSeleccionada) {
    const clases  = CLASES_POR_RAZA[raza] || Object.keys(CLASES);
    const selClase = document.getElementById('editClase');
    selClase.innerHTML = clases
        .map(c => `<option value="${c}"${c===claseSeleccionada?' selected':''}>${CLASES[c]}</option>`)
        .join('');
}

document.getElementById('editClose').addEventListener('click',  () => document.getElementById('editOverlay').classList.remove('active'));
document.getElementById('editCancel').addEventListener('click', () => document.getElementById('editOverlay').classList.remove('active'));

document.getElementById('editSave').addEventListener('click', async () => {
    const uid       = document.getElementById('editUid').value;
    const discord   = document.getElementById('editDiscord').value.trim();
    const nombreMC  = document.getElementById('editNombreMC').value.trim();
    const nombreRol = document.getElementById('editNombreRol').value.trim();
    const raza      = document.getElementById('editRaza').value;
    const clase     = document.getElementById('editClase').value;
    const trabajo   = document.getElementById('editTrabajo').value;
    const rol       = document.getElementById('editRolSistema').value;
    const errEl     = document.getElementById('editError');

    if (!discord || !nombreMC || !nombreRol || !raza || !clase || !trabajo) {
        errEl.textContent = 'Todos los campos son obligatorios.';
        errEl.style.display = '';
        return;
    }
    errEl.style.display = 'none';

    try {
        await updateDoc(doc(db, 'usuarios', uid), {
            discord,
            rol,
            'personaje.nombreRol': nombreRol,
            'personaje.nombreMC':  nombreMC,
            'personaje.raza':      raza,
            'personaje.clase':     clase,
            'personaje.trabajo':   trabajo
        });
        /* Actualizar caché local */
        const idx = todosLosPersonajes.findIndex(x => x.uid === uid);
        if (idx !== -1) {
            todosLosPersonajes[idx] = {
                ...todosLosPersonajes[idx],
                discord, rol,
                personaje: { ...todosLosPersonajes[idx].personaje, nombreRol, nombreMC, raza, clase, trabajo }
            };
        }
        document.getElementById('editOverlay').classList.remove('active');
        renderTabla(todosLosPersonajes);

        /* Actualizar stats */
        document.getElementById('totalAdmins').textContent     = todosLosPersonajes.filter(p => p.rol === 'admin').length;
        document.getElementById('totalCiudadanos').textContent = todosLosPersonajes.filter(p => p.rol === 'ciudadano').length;
    } catch (err) {
        errEl.textContent = 'Error al guardar. Inténtalo de nuevo.';
        errEl.style.display = '';
        console.error(err);
    }
});

/* ════════════════════════
   MODAL ELIMINAR
   ════════════════════════ */
function abrirEliminar(uid, nombre) {
    document.getElementById('deleteUid').value    = uid;
    document.getElementById('deleteNombre').textContent = nombre;
    document.getElementById('deleteOverlay').classList.add('active');
}

document.getElementById('deleteClose').addEventListener('click',  () => document.getElementById('deleteOverlay').classList.remove('active'));
document.getElementById('deleteCancel').addEventListener('click', () => document.getElementById('deleteOverlay').classList.remove('active'));

document.getElementById('deleteConfirm').addEventListener('click', async () => {
    const uid = document.getElementById('deleteUid').value;
    try {
        await deleteDoc(doc(db, 'usuarios', uid));
        todosLosPersonajes = todosLosPersonajes.filter(p => p.uid !== uid);
        document.getElementById('deleteOverlay').classList.remove('active');
        renderTabla(todosLosPersonajes);

        /* Actualizar stats */
        document.getElementById('totalPersonajes').textContent = todosLosPersonajes.length;
        document.getElementById('totalAdmins').textContent     = todosLosPersonajes.filter(p => p.rol === 'admin').length;
        document.getElementById('totalCiudadanos').textContent = todosLosPersonajes.filter(p => p.rol === 'ciudadano').length;
    } catch (err) {
        console.error('Error al eliminar:', err);
    }
});
