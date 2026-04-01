/* ============================================================
   cuenta-modal.js – Mines & Monarch · Modal de Cuenta
   ============================================================
   Flujo:
     1. Botón "Entrar con Discord" → OAuth popup
     2a. Usuario nuevo → formulario de personaje (nombre, raza, clase, trabajo)
     2b. Usuario existente con personaje → cierra modal, actualiza nav
   
   Roles: sin_usuario | verificado | escriba | admin
   Por ahora todas las cuentas nuevas son admin.
   ============================================================ */

import { initializeApp }          from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth,
         signInWithPopup,
         OAuthProvider,
         onAuthStateChanged }     from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore,
         doc, setDoc, getDoc,
         runTransaction }         from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ── Firebase config ── */
const firebaseConfig = {
    apiKey:            "AIzaSyC97DUSkDy8qOHnk5rm3P-263m4W6Okbzo",
    authDomain:        "minesandmonarch.firebaseapp.com",
    projectId:         "minesandmonarch",
    storageBucket:     "minesandmonarch.firebasestorage.app",
    messagingSenderId: "379898851786",
    appId:             "1:379898851786:web:b892cbf4d8508798d61f33"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ── Discord OAuth provider ── */
const discordProvider = new OAuthProvider('oidc.discord');
discordProvider.addScope('identify');
discordProvider.setCustomParameters({ client_id: '1487501963510681680' });

/* ── Roles disponibles ── */
const ROLES = {
    sin_usuario: 'Sin usuario',
    verificado:  'Verificado',
    escriba:     'Escriba',
    admin:       'Admin'
};

/* ── Enums ── */
const RAZAS = {
    humano:"Humano", elfobosque:"Elfo del Bosque", alfiq:"Alfiq",
    goblin:"Goblin", enano:"Enano", aracnido:"Arácnido", yeti:"Yeti",
    demonio:"Demonio", sirena:"Sirena", valquiria:"Valquiria",
    hadapixie:"Hada Pixie", hadafae:"Hada Fae", granelfo:"Gran Elfo",
    gorgona:"Gorgona", victimapeste:"Víctima de la Peste",
    banshee:"Banshee", elfolunar:"Elfo Lunar", ogro:"Ogro", revenant:"Revenant"
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
    magoeldritch:"Mago del Eldritch"
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
    revenant:     ['granmagooscuro','magoinvocador','magosangre','magoender']
};
const TRABAJOS = {
    constructor:"Constructor", inutilerrante:"Inútil Errante",
    explorador:"Explorador", clerigo:"Clérigo", mercader:"Mercader",
    metalurgico:"Metalúrgico", agricultor:"Agricultor",
    granjero:"Granjero", cocinero:"Cocinero"
};

const opts = obj => Object.entries(obj)
    .map(([v,l]) => `<option value="${v}">${l}</option>`).join('');

/* ════════════════════════════════════════
   HTML
   ════════════════════════════════════════ */
function inyectar() {
    document.body.insertAdjacentHTML('beforeend', `
    <div class="cm-overlay" id="cmOverlay">
      <div class="cm-box">

        <div class="cm-header">
          <div class="cm-header-deco"></div>
          <button class="cm-close" id="cmClose">✕</button>
          <h2 class="cm-titulo" id="cmTitulo">Cuenta</h2>
          <p class="cm-subtitulo" id="cmSub">Accede con tu cuenta de Discord</p>
        </div>

        <!-- VISTA: Login/Registro con Discord -->
        <div class="cm-body" id="vistaDiscord">
          <div class="cm-opciones">
            <button class="cm-opcion-btn" id="optDiscord">
              <span class="cm-opcion-icono">🎮</span>
              <span>Entrar con Discord
                <span class="cm-opcion-desc">Login y registro en un solo paso</span>
              </span>
            </button>
            <button class="cm-opcion-btn volver" id="optVolver">
              <span class="cm-opcion-icono">←</span>Volver
            </button>
          </div>
          <p class="cm-error" id="discordError"></p>
        </div>

        <!-- VISTA: Formulario de personaje (usuario nuevo) -->
        <div class="cm-body" id="vistaFicha" style="display:none">
          <p class="cm-section">Tu personaje</p>
          <div class="cm-field">
            <label class="cm-label">Nombre del personaje <span>*</span></label>
            <input class="cm-input" type="text" id="fNombre" placeholder="Ej: Eira Frostmantle">
          </div>
          <div class="cm-row">
            <div class="cm-field">
              <label class="cm-label">Raza <span>*</span></label>
              <select class="cm-select" id="fRaza">
                <option value="" disabled selected>Selecciona…</option>
                ${opts(RAZAS)}
              </select>
            </div>
            <div class="cm-field">
              <label class="cm-label">Clase <span>*</span></label>
              <select class="cm-select" id="fClase">
                <option value="" disabled selected>Selecciona primero una raza…</option>
              </select>
            </div>
          </div>
          <div class="cm-field">
            <label class="cm-label">Trabajo <span>*</span></label>
            <select class="cm-select" id="fTrabajo">
              <option value="" disabled selected>Selecciona…</option>
              ${opts(TRABAJOS)}
            </select>
          </div>
          <p class="cm-error" id="fichaError"></p>
          <div class="cm-form-footer">
            <span></span>
            <button class="cm-btn-submit" id="fichaSubmit">⚜ Guardar personaje</button>
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
const VISTAS = ['vistaDiscord', 'vistaFicha', 'cmExito'];

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
   FIRESTORE HELPERS
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
    const btn = document.getElementById('nav-cuenta-btn');
    if (btn) btn.textContent = datos.nombreUsuario;
}

/* ════════════════════════════════════════
   LOGIN / REGISTRO CON DISCORD
   ════════════════════════════════════════ */
async function loginDiscord() {
    setError('discordError', '');
    try {
        const result = await signInWithPopup(auth, discordProvider);
        const user   = result.user;
        const snap   = await getDoc(doc(db, 'usuarios', user.uid));

        if (snap.exists() && snap.data().personaje) {
            /* ── Usuario existente con personaje ── */
            const datos = snap.data();
            guardarSesion({ uid: user.uid, nombreUsuario: datos.nombreUsuario, id: datos.id, rol: datos.rol });

            document.getElementById('exitoTitulo').textContent = `¡Bienvenido, ${datos.nombreUsuario}!`;
            document.getElementById('exitoTexto').textContent  = 'Sesión iniciada con Discord.';
            mostrar('cmExito');
            setTimeout(cerrar, 1800);

        } else {
            /* ── Usuario nuevo — crear documento base ── */
            const nombreDiscord = user.displayName || 'Viajero';
            const discord       = `@${(user.providerData[0]?.uid || nombreDiscord).toLowerCase()}`;

            if (!snap.exists()) {
                const id = await nextId();
                await setDoc(doc(db, 'usuarios', user.uid), {
                    id,
                    nombreUsuario: nombreDiscord,
                    discord,
                    rol:      'admin',   // todas las cuentas son admin por ahora
                    creadoEn: new Date(),
                    personaje: null
                });
                guardarSesion({ uid: user.uid, nombreUsuario: nombreDiscord, id, rol: 'admin' });
            }

            /* Mostrar formulario de personaje */
            mostrar('vistaFicha', 'Crea tu personaje', 'Rellena tu ficha para continuar');
        }

    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
            setError('discordError', errMsg(err.code));
        }
    }
}

/* ════════════════════════════════════════
   GUARDAR FICHA DE PERSONAJE
   ════════════════════════════════════════ */
async function guardarFicha() {
    const nombre  = document.getElementById('fNombre').value.trim();
    const raza    = document.getElementById('fRaza').value;
    const clase   = document.getElementById('fClase').value;
    const trabajo = document.getElementById('fTrabajo').value;

    if (!nombre)                 return setError('fichaError', 'El nombre del personaje es obligatorio.');
    if (!raza || !clase || !trabajo) return setError('fichaError', 'Selecciona raza, clase y trabajo.');
    setError('fichaError', '');

    try {
        const user = auth.currentUser;
        await setDoc(doc(db, 'usuarios', user.uid),
            { personaje: { nombre, raza, clase, trabajo } },
            { merge: true }
        );

        /* Actualizar nombre en nav con el del personaje */
        const sesion = JSON.parse(sessionStorage.getItem('mm_usuario') || '{}');
        guardarSesion({ ...sesion, nombreUsuario: nombre });

        document.getElementById('exitoTitulo').textContent = '¡Bienvenido a Belmaria!';
        document.getElementById('exitoTexto').textContent  = `${nombre} ha llegado al mundo.`;
        mostrar('cmExito');
        setTimeout(cerrar, 2000);
    } catch (err) {
        setError('fichaError', 'Error al guardar. Inténtalo de nuevo.');
        console.error(err);
    }
}

/* ════════════════════════════════════════
   ABRIR / CERRAR
   ════════════════════════════════════════ */
function cerrar() {
    document.getElementById('cmOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

window.abrirModalCuenta = function () {
    /* Reset formulario de personaje */
    ['fNombre'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['fRaza','fTrabajo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const fClase = document.getElementById('fClase');
    if (fClase) {
        fClase.innerHTML = '<option value="" disabled selected>Selecciona primero una raza…</option>';
        fClase.value     = '';
    }
    setError('discordError', '');
    setError('fichaError',   '');
    mostrar('vistaDiscord', 'Cuenta', 'Accede con tu cuenta de Discord');
    document.getElementById('cmOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
};

/* ════════════════════════════════════════
   INIT
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    inyectar();

    /* Cerrar */
    document.getElementById('cmClose').addEventListener('click', cerrar);
    document.getElementById('cmOverlay').addEventListener('click', e => {
        if (e.target.id === 'cmOverlay') cerrar();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.getElementById('cmOverlay').classList.contains('active')) cerrar();
    });

    /* Botones */
    document.getElementById('optDiscord').addEventListener('click', loginDiscord);
    document.getElementById('optVolver').addEventListener('click', cerrar);
    document.getElementById('fichaSubmit').addEventListener('click', guardarFicha);

    /* Filtro raza → clase */
    document.getElementById('fRaza').addEventListener('change', function () {
        const select = document.getElementById('fClase');
        const clases = CLASES_POR_RAZA[this.value] || [];
        select.innerHTML = '<option value="" disabled selected>Selecciona…</option>' +
            clases.map(c => `<option value="${c}">${CLASES[c]}</option>`).join('');
        select.value = '';
    });

    /* Sincronizar nav al cargar si Firebase ya tiene sesión */
    onAuthStateChanged(auth, async user => {
        if (!user) return;
        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (snap.exists()) {
                const datos = snap.data();
                guardarSesion({
                    uid:           user.uid,
                    nombreUsuario: datos.personaje?.nombre || datos.nombreUsuario,
                    id:            datos.id,
                    rol:           datos.rol
                });
            }
        } catch (_) {}
    });
});

/* ── Mensajes de error Firebase ── */
function errMsg(code) {
    return ({
        'auth/popup-blocked':          'El navegador bloqueó la ventana. Permite popups e inténtalo de nuevo.',
        'auth/network-request-failed': 'Error de red. Comprueba tu conexión.',
        'auth/too-many-requests':      'Demasiados intentos. Espera un momento.',
        'auth/unauthorized-domain':    'Dominio no autorizado. Contacta con un administrador.'
    })[code] || 'Error al conectar con Discord. Inténtalo de nuevo.';
}
