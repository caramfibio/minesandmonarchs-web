/* ============================================================
   cuenta-modal.js – Mines & Monarch · Modal de Cuenta
   Flujo:
     1. Botón "Entrar con Google" → popup OAuth
     2a. Nuevo usuario  → paso 2: formulario con sección Datos + Rol
     2b. Usuario existe → entra directamente
   ============================================================ */

import { initializeApp }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth,
         signInWithPopup,
         GoogleAuthProvider,
         onAuthStateChanged,
         signOut }         from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore,
         doc, setDoc, getDoc,
         runTransaction }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey:            "AIzaSyC97DUSkDy8qOHnk5rm3P-263m4W6Okbzo",
    authDomain:        "minesandmonarch.firebaseapp.com",
    projectId:         "minesandmonarch",
    storageBucket:     "minesandmonarch.firebasestorage.app",
    messagingSenderId: "379898851786",
    appId:             "1:379898851786:web:b892cbf4d8508798d61f33"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

const ROL = { admin: 'admin', escriba: 'escriba', ciudadano: 'ciudadano' };

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
    magoeldritch:"Mago del Eldritch", 

    niceGuy:"Nice Guy" 
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
    ribbit:     ['Nice Guy']
};
const TRABAJOS = {
    constructor:"Constructor", inutilerrante:"Inútil Errante",
    explorador:"Explorador", clerigo:"Clérigo", mercader:"Mercader",
    metalurgico:"Metalúrgico", agricultor:"Agricultor",
    granjero:"Granjero", cocinero:"Cocinero"
};

const opts = obj => Object.entries(obj)
    .map(([v,l]) => `<option value="${v}">${l}</option>`).join('');

/* ── Usuario guardado tras el popup para no perder la referencia ── */
let _googleUser = null;

/* ════════════════════════════════════════
   HTML – solo dos vistas: vistaGoogle y vistaPersonaje
   ════════════════════════════════════════ */
function inyectar() {
    document.body.insertAdjacentHTML('beforeend', `
    <div class="cm-overlay" id="cmOverlay">
      <div class="cm-box">
        <div class="cm-header">
          <div class="cm-header-deco"></div>
          <button class="cm-close" id="cmClose">✕</button>
          <h2 class="cm-titulo" id="cmTitulo">Cuenta</h2>
          <p class="cm-subtitulo" id="cmSub">Accede con tu cuenta de Google</p>
        </div>

        <!-- VISTA 1: botón Google -->
        <div class="cm-body" id="vistaGoogle">
          <div class="cm-opciones">
            <button class="cm-opcion-btn" id="optGoogle">
              <span class="cm-opcion-icono">
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </span>
              <span>Entrar con Google
                <span class="cm-opcion-desc">Login y registro en un solo paso</span>
              </span>
            </button>
            <button class="cm-opcion-btn secundario" id="optVolver">
              <span class="cm-opcion-icono">←</span>Volver
            </button>
          </div>
          <p class="cm-error" id="googleError"></p>
        </div>

        <!-- VISTA 2: formulario con sección Datos arriba y Rol abajo -->
        <div class="cm-body" id="vistaPersonaje" style="display:none">
          <p class="cm-section">Datos</p>
          <div class="cm-field">
            <label class="cm-label">Nombre de Discord <span>*</span></label>
            <input class="cm-input" type="text" id="pDiscord" placeholder="Ej: eira#1234">
          </div>
          <div class="cm-field">
            <label class="cm-label">Nombre de Minecraft <span>*</span></label>
            <input class="cm-input" type="text" id="pNombreMC" placeholder="Tu nick en MC">
          </div>

          <p class="cm-section">Rol</p>
          <div class="cm-field">
            <label class="cm-label">Nombre de rol <span>*</span></label>
            <input class="cm-input" type="text" id="pNombreRol" placeholder="Ej: Eira Frostmantle">
          </div>
          <div class="cm-field">
            <label class="cm-label">Raza <span>*</span></label>
            <select class="cm-select" id="pRaza">
              <option value="" disabled selected>Selecciona…</option>
              ${opts(RAZAS)}
            </select>
          </div>
          <div class="cm-row">
            <div class="cm-field">
              <label class="cm-label">Clase <span>*</span></label>
              <select class="cm-select" id="pClase" disabled>
                <option value="" disabled selected>Selecciona primero la raza…</option>
              </select>
            </div>
            <div class="cm-field">
              <label class="cm-label">Trabajo <span>*</span></label>
              <select class="cm-select" id="pTrabajo">
                <option value="" disabled selected>Selecciona…</option>
                ${opts(TRABAJOS)}
              </select>
            </div>
          </div>
          <p class="cm-error" id="pError"></p>
          <div class="cm-form-footer">
            <button class="cm-btn-volver" id="pCancelar">Cancelar</button>
            <button class="cm-btn-submit" id="pGuardar">⚜ Crear personaje</button>
          </div>
        </div>

        <!-- ÉXITO -->
        <div class="cm-exito" id="cmExito">
          <div class="cm-exito-icono">⚜</div>
          <h3 id="exitoTitulo">¡Hecho!</h3>
          <p id="exitoTexto"></p>
        </div>
      </div>
    </div>`);
}

/* ════════════════════════════════════════
   NAVEGACIÓN
   ════════════════════════════════════════ */
const VISTAS = ['vistaGoogle', 'vistaPersonaje', 'cmExito'];

function mostrar(id, titulo, sub) {
    VISTAS.forEach(v => {
        const el = document.getElementById(v);
        if (!el) return;
        if (v === 'cmExito') {
            el.classList.toggle('visible', v === id);
        } else {
            el.style.display = v === id ? '' : 'none';
        }
    });
    if (titulo !== undefined) document.getElementById('cmTitulo').textContent = titulo;
    if (sub    !== undefined) document.getElementById('cmSub').textContent    = sub;
}

function setError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent   = msg;
    el.style.display = msg ? '' : 'none';
}

/* ════════════════════════════════════════
   FIRESTORE
   ════════════════════════════════════════ */
async function nextId() {
    const ref = doc(db, 'meta', 'contador_usuarios');
    let id;
    await runTransaction(db, async tx => {
        const snap = await tx.get(ref);
        id = snap.exists() ? snap.data().total + 1 : 1;
        tx.set(ref, { total: id });
    });
    return id;
}

function guardarSesion(datos) {
    sessionStorage.setItem('mm_usuario', JSON.stringify(datos));
    const li = document.getElementById('nav-cuenta-li');
    if (li && !li.classList.contains('dropdown')) {
        li.classList.add('dropdown');
        li.innerHTML = `
            <button class="dropbtn" style="font-weight:bold;color:#ffd700;display:flex;align-items:center;gap:6px">
                ⚜ ${datos.nombreRol}
            </button>
            <ul class="dropdown-content" style="right:0;left:auto;min-width:160px;">
                <li><a href="Cuenta/Cuenta.html">Mi cartilla</a></li>
                <li><a href="#" id="btnCerrarSesion">Cerrar sesión</a></li>
            </ul>`;
        li.querySelector('.dropbtn').addEventListener('click', e => {
            e.preventDefault();
            li.querySelector('.dropdown-content').classList.toggle('show');
        });
        document.getElementById('btnCerrarSesion').addEventListener('click', async e => {
            e.preventDefault();
            await signOut(auth);
            sessionStorage.removeItem('mm_usuario');
            location.reload();
        });
    }
}

/* ════════════════════════════════════════
   LOGIN CON GOOGLE
   ════════════════════════════════════════ */
async function loginGoogle() {
    setError('googleError', '');
    try {
        const result = await signInWithPopup(auth, provider);
        _googleUser  = result.user;                          /* guardar referencia */
        const snap   = await getDoc(doc(db, 'usuarios', _googleUser.uid));

        if (snap.exists() && snap.data().personaje) {
            const datos = snap.data();
            guardarSesion({ uid: _googleUser.uid, nombreRol: datos.personaje.nombreRol, id: datos.id, rol: datos.rol });
            document.getElementById('exitoTitulo').textContent = `¡Bienvenido, ${datos.personaje.nombreRol}!`;
            document.getElementById('exitoTexto').textContent  = 'Sesión iniciada correctamente.';
            mostrar('cmExito');
            setTimeout(() => {
                window.location.href = `/minesandmonarchs-web/mundo/personajes/personaje.html?uid=${_googleUser.uid}`;
            }, 1800);
        } else {
            mostrar('vistaPersonaje', 'Crea tu personaje', 'Paso 2 de 2 — Completa tu ficha');
        }
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
            setError('googleError', errMsg(err.code));
        }
    }
}

/* ════════════════════════════════════════
   GUARDAR PERSONAJE
   ════════════════════════════════════════ */
async function guardarPersonaje() {
    const discord   = document.getElementById('pDiscord').value.trim();
    const nombreMC  = document.getElementById('pNombreMC').value.trim();
    const nombreRol = document.getElementById('pNombreRol').value.trim();
    const raza      = document.getElementById('pRaza').value;
    const clase     = document.getElementById('pClase').value;
    const trabajo   = document.getElementById('pTrabajo').value;

    if (!discord)                    return setError('pError', 'El nombre de Discord es obligatorio.');
    if (!nombreMC)                   return setError('pError', 'El nombre de Minecraft es obligatorio.');
    if (!nombreRol)                  return setError('pError', 'El nombre de rol es obligatorio.');
    if (!raza || !clase || !trabajo) return setError('pError', 'Selecciona raza, clase y trabajo.');
    setError('pError', '');

    const user = _googleUser || auth.currentUser;           /* usar variable guardada */
    if (!user) {
        setError('pError', 'Sesión expirada. Vuelve a entrar con Google.');
        mostrar('vistaGoogle', 'Cuenta', 'Accede con tu cuenta de Google');
        return;
    }

    try {
        const id  = await nextId();
        const rol = nombreRol.toLowerCase() === 'skyroft' ? ROL.admin : ROL.ciudadano;

        await setDoc(doc(db, 'usuarios', user.uid), {
            id,
            email:    user.email,
            discord,
            rol,
            creadoEn: new Date(),
            personaje: { nombreRol, nombreMC, raza, clase, trabajo }
        });

        guardarSesion({ uid: user.uid, nombreRol, id, rol });
        document.getElementById('exitoTitulo').textContent = '¡Bienvenido a Belmaria!';
        document.getElementById('exitoTexto').textContent  = `${nombreRol} ha llegado al mundo.`;
        mostrar('cmExito');
        setTimeout(() => {
            window.location.href = `/minesandmonarchs-web/mundo/personajes/personaje.html?uid=${user.uid}`;
        }, 2000);
    } catch (err) {
        setError('pError', 'Error al guardar. Inténtalo de nuevo.');
        console.error(err);
    }
}

/* ════════════════════════════════════════
   CANCELAR / CERRAR
   ════════════════════════════════════════ */
async function cancelarPersonaje() {
    const user = _googleUser || auth.currentUser;
    if (user) await signOut(auth);
    _googleUser = null;
    sessionStorage.removeItem('mm_usuario');
    cerrar();
}

function cerrar() {
    const user = _googleUser || auth.currentUser;
    if (user) {
        getDoc(doc(db, 'usuarios', user.uid)).then(snap => {
            if (!snap.exists() || !snap.data().personaje) {
                signOut(auth);
                sessionStorage.removeItem('mm_usuario');
                _googleUser = null;
            }
        });
    }
    document.getElementById('cmOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function resetForm() {
    ['pDiscord','pNombreRol','pNombreMC'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    ['pRaza','pTrabajo'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    const pClase = document.getElementById('pClase');
    if (pClase) {
        pClase.innerHTML = '<option value="" disabled selected>Selecciona primero la raza…</option>';
        pClase.value = ''; pClase.disabled = true;
    }
    setError('googleError', '');
    setError('pError', '');
}

window.abrirModalCuenta = function () {
    resetForm();
    mostrar('vistaGoogle', 'Cuenta', 'Accede con tu cuenta de Google');
    document.getElementById('cmOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
};

/* ════════════════════════════════════════
   INIT
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    inyectar();

    document.getElementById('cmClose').addEventListener('click', cerrar);
    document.getElementById('cmOverlay').addEventListener('click', e => {
        if (e.target.id === 'cmOverlay') cerrar();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.getElementById('cmOverlay').classList.contains('active')) cerrar();
    });

    document.getElementById('optGoogle').addEventListener('click', loginGoogle);
    document.getElementById('optVolver').addEventListener('click', cerrar);
    document.getElementById('pCancelar').addEventListener('click', cancelarPersonaje);
    document.getElementById('pGuardar').addEventListener('click', guardarPersonaje);

    document.getElementById('pRaza').addEventListener('change', function () {
        const select = document.getElementById('pClase');
        const clases = CLASES_POR_RAZA[this.value] || [];
        select.innerHTML = '<option value="" disabled selected>Selecciona…</option>' +
            clases.map(c => `<option value="${c}">${CLASES[c]}</option>`).join('');
        select.value = ''; select.disabled = false;
    });

    onAuthStateChanged(auth, async user => {
        if (!user) return;
        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (snap.exists() && snap.data().personaje) {
                const datos = snap.data();
                guardarSesion({ uid: user.uid, nombreRol: datos.personaje.nombreRol, id: datos.id, rol: datos.rol });
            } else if (!snap.data()?.personaje) {
                await signOut(auth);
            }
        } catch (_) {}
    });
});

function errMsg(code) {
    return ({
        'auth/popup-blocked':          'El navegador bloqueó la ventana. Permite popups e inténtalo de nuevo.',
        'auth/popup-closed-by-user':   '',
        'auth/network-request-failed': 'Error de red. Comprueba tu conexión.',
        'auth/too-many-requests':      'Demasiados intentos. Espera un momento.',
        'auth/unauthorized-domain':    'Dominio no autorizado en Firebase.'
    })[code] || 'Error al conectar con Google. Inténtalo de nuevo.';
}
