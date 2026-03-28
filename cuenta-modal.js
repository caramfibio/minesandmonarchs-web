/* ============================================================
   cuenta-modal.js – Mines & Monarch · Modal de Cuenta
   ============================================================
   Login  → Discord OAuth
   Registro → formulario manual (usuario + contraseña + personaje)
   Si entra con Discord por primera vez → rellena ficha de personaje
   ============================================================ */

import { initializeApp }              from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth,
         createUserWithEmailAndPassword,
         signInWithPopup,
         OAuthProvider,
         onAuthStateChanged }         from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore,
         doc, setDoc, getDoc,
         runTransaction }             from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

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
          <p class="cm-subtitulo" id="cmSub">¿Qué deseas hacer?</p>
        </div>

        <!-- OPCIONES -->
        <div class="cm-body" id="vistaOpciones">
          <div class="cm-opciones">
            <button class="cm-opcion-btn" id="optDiscord">
              <span class="cm-opcion-icono">🎮</span>
              <span>Iniciar sesión con Discord
                <span class="cm-opcion-desc">Entra con tu cuenta de Discord</span>
              </span>
            </button>
            <button class="cm-opcion-btn" id="optRegistrar">
              <span class="cm-opcion-icono">⚜</span>
              <span>Registrarse
                <span class="cm-opcion-desc">Crea tu cuenta y tu personaje</span>
              </span>
            </button>
            <button class="cm-opcion-btn volver" id="optVolver">
              <span class="cm-opcion-icono">←</span>Volver
            </button>
          </div>
        </div>

        <!-- REGISTRO MANUAL -->
        <div class="cm-body" id="vistaRegistro" style="display:none">

          <p class="cm-section">Cuenta</p>
          <div class="cm-row">
            <div class="cm-field">
              <label class="cm-label">Nombre de usuario <span>*</span></label>
              <input class="cm-input" type="text" id="rUsuario" placeholder="Tu nombre de usuario">
            </div>
            <div class="cm-field">
              <label class="cm-label">Discord <span>*</span></label>
              <input class="cm-input" type="text" id="rDiscord" placeholder="@usuario">
            </div>
          </div>
          <div class="cm-row">
            <div class="cm-field">
              <label class="cm-label">Contraseña <span>*</span></label>
              <input class="cm-input" type="password" id="rPass" placeholder="Mínimo 6 caracteres">
            </div>
            <div class="cm-field">
              <label class="cm-label">Repetir contraseña <span>*</span></label>
              <input class="cm-input" type="password" id="rPass2" placeholder="Repite la contraseña">
            </div>
          </div>

          <p class="cm-section">Personaje</p>
          <div class="cm-field">
            <label class="cm-label">Nombre del personaje <span>*</span></label>
            <input class="cm-input" type="text" id="rNombre" placeholder="Ej: Eira Frostmantle">
          </div>
          <div class="cm-row">
            <div class="cm-field">
              <label class="cm-label">Raza <span>*</span></label>
              <select class="cm-select" id="rRaza">
                <option value="" disabled selected>Selecciona…</option>
                ${opts(RAZAS)}
              </select>
            </div>
            <div class="cm-field">
              <label class="cm-label">Clase <span>*</span></label>
              <select class="cm-select" id="rClase">
                <option value="" disabled selected>Selecciona primero una raza…</option>
              </select>
            </div>
          </div>
          <div class="cm-field">
            <label class="cm-label">Trabajo <span>*</span></label>
            <select class="cm-select" id="rTrabajo">
              <option value="" disabled selected>Selecciona…</option>
              ${opts(TRABAJOS)}
            </select>
          </div>

          <p class="cm-error" id="regError"></p>
          <div class="cm-form-footer">
            <button class="cm-btn-volver" id="regVolver">← Volver</button>
            <button class="cm-btn-submit" id="regSubmit">⚜ Crear cuenta</button>
          </div>
        </div>

        <!-- FICHA DE PERSONAJE (tras login con Discord) -->
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
const VISTAS = ['vistaOpciones','vistaRegistro','vistaFicha','cmExito'];

function mostrar(id, titulo, sub) {
    VISTAS.forEach(v => {
        const el = document.getElementById(v);
        if (!el) return;
        if (v === 'cmExito') {
            el.classList.toggle('visible', v === id);
            el.style.display = '';
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
    el.textContent    = msg;
    el.style.display  = msg ? '' : 'none';
}

/* ════════════════════════════════════════
   FIREBASE HELPERS
   ════════════════════════════════════════ */
function toEmail(usuario) {
    return `${usuario.trim().toLowerCase().replace(/\s+/g,'_')}@mm.internal`;
}

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
   REGISTRO MANUAL
   ════════════════════════════════════════ */
async function registrar() {
    const usuario = document.getElementById('rUsuario').value.trim();
    const discord = document.getElementById('rDiscord').value.trim();
    const pass    = document.getElementById('rPass').value;
    const pass2   = document.getElementById('rPass2').value;
    const nombre  = document.getElementById('rNombre').value.trim();
    const raza    = document.getElementById('rRaza').value;
    const clase   = document.getElementById('rClase').value;
    const trabajo = document.getElementById('rTrabajo').value;

    if (!usuario)                return setError('regError', 'El nombre de usuario es obligatorio.');
    if (!discord)                return setError('regError', 'El Discord es obligatorio.');
    if (!/^@.{2,}$/.test(discord)) return setError('regError', 'El Discord debe tener el formato @usuario.');
    if (pass.length < 6)         return setError('regError', 'La contraseña debe tener al menos 6 caracteres.');
    if (pass !== pass2)          return setError('regError', 'Las contraseñas no coinciden.');
    if (!nombre)                 return setError('regError', 'El nombre del personaje es obligatorio.');
    if (!raza||!clase||!trabajo) return setError('regError', 'Selecciona raza, clase y trabajo.');
    setError('regError', '');

    try {
        const cred = await createUserWithEmailAndPassword(auth, toEmail(usuario), pass);
        const id   = await nextId();

        await setDoc(doc(db, 'usuarios', cred.user.uid), {
            id,
            nombreUsuario: usuario,
            discord,
            isAdmin:   false,
            creadoEn:  new Date(),
            personaje: { nombre, raza, clase, trabajo }
        });

        guardarSesion({ uid: cred.user.uid, nombreUsuario: usuario, id });

        document.getElementById('exitoTitulo').textContent = '¡Bienvenido a Belmaria!';
        document.getElementById('exitoTexto').textContent  = `${nombre} ha sido creado correctamente.`;
        mostrar('cmExito', '', '');
        setTimeout(cerrar, 2200);
    } catch (err) {
        setError('regError', errMsg(err.code));
    }
}

/* ════════════════════════════════════════
   LOGIN CON DISCORD (OAuth)
   ════════════════════════════════════════ */
async function loginDiscord() {
    setError('regError', '');
    try {
        const result   = await signInWithPopup(auth, discordProvider);
        const user     = result.user;
        const snap     = await getDoc(doc(db, 'usuarios', user.uid));

        if (snap.exists() && snap.data().personaje) {
            /* Ya tiene personaje — entrar directamente */
            const datos = snap.data();
            guardarSesion({ uid: user.uid, nombreUsuario: datos.nombreUsuario, id: datos.id });

            document.getElementById('exitoTitulo').textContent = `¡Bienvenido, ${datos.nombreUsuario}!`;
            document.getElementById('exitoTexto').textContent  = 'Sesión iniciada con Discord.';
            mostrar('cmExito', '', '');
            setTimeout(cerrar, 1800);
        } else {
            /* Primera vez — crear registro base y pedir ficha */
            if (!snap.exists()) {
                const id           = await nextId();
                const nombreDiscord = user.displayName || user.email?.split('@')[0] || 'Viajero';
                await setDoc(doc(db, 'usuarios', user.uid), {
                    id,
                    nombreUsuario: nombreDiscord,
                    discord:       `@${nombreDiscord}`,
                    isAdmin:       false,
                    creadoEn:      new Date(),
                    personaje:     null
                });
                guardarSesion({ uid: user.uid, nombreUsuario: nombreDiscord, id });
            }
            /* Mostrar formulario de ficha */
            mostrar('vistaFicha', 'Crear personaje', 'Rellena tu ficha para continuar');
        }
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
            mostrar('vistaOpciones', 'Cuenta', '¿Qué deseas hacer?');
            setError('regError', errMsg(err.code));
        }
    }
}

/* ════════════════════════════════════════
   GUARDAR FICHA (tras Discord OAuth)
   ════════════════════════════════════════ */
async function guardarFicha() {
    const nombre  = document.getElementById('fNombre').value.trim();
    const raza    = document.getElementById('fRaza').value;
    const clase   = document.getElementById('fClase').value;
    const trabajo = document.getElementById('fTrabajo').value;

    if (!nombre)                 return setError('fichaError', 'El nombre del personaje es obligatorio.');
    if (!raza||!clase||!trabajo) return setError('fichaError', 'Selecciona raza, clase y trabajo.');
    setError('fichaError', '');

    try {
        const user = auth.currentUser;
        await setDoc(doc(db, 'usuarios', user.uid),
            { personaje: { nombre, raza, clase, trabajo } },
            { merge: true }
        );

        document.getElementById('exitoTitulo').textContent = '¡Personaje creado!';
        document.getElementById('exitoTexto').textContent  = `${nombre} ha llegado a Belmaria.`;
        mostrar('cmExito', '', '');
        setTimeout(cerrar, 2000);
    } catch (err) {
        setError('fichaError', 'Error al guardar. Inténtalo de nuevo.');
        console.error(err);
    }
}

/* ════════════════════════════════════════
   FILTRO RAZA → CLASE
   ════════════════════════════════════════ */
function bindRazaClase(razaId, claseId) {
    document.getElementById(razaId).addEventListener('change', function () {
        const select = document.getElementById(claseId);
        const clases = CLASES_POR_RAZA[this.value] || [];
        select.innerHTML = '<option value="" disabled selected>Selecciona…</option>' +
            clases.map(c => `<option value="${c}">${CLASES[c]}</option>`).join('');
        select.value   = '';
        select.disabled = false;
    });
}

/* ════════════════════════════════════════
   ABRIR / CERRAR
   ════════════════════════════════════════ */
function cerrar() {
    document.getElementById('cmOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

window.abrirModalCuenta = function () {
    /* Resetear formularios */
    ['rUsuario','rDiscord','rPass','rPass2','rNombre','fNombre'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['rRaza','rTrabajo','fRaza','fTrabajo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['rClase','fClase'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<option value="" disabled selected>Selecciona primero una raza…</option>';
            el.value     = '';
        }
    });
    setError('regError',   '');
    setError('fichaError', '');

    mostrar('vistaOpciones', 'Cuenta', '¿Qué deseas hacer?');
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

    /* Navegación opciones */
    document.getElementById('optDiscord').addEventListener('click', loginDiscord);
    document.getElementById('optRegistrar').addEventListener('click', () =>
        mostrar('vistaRegistro', 'Crear cuenta', 'Cuenta y personaje'));
    document.getElementById('optVolver').addEventListener('click', cerrar);
    document.getElementById('regVolver').addEventListener('click', () =>
        mostrar('vistaOpciones', 'Cuenta', '¿Qué deseas hacer?'));

    /* Filtros raza → clase */
    bindRazaClase('rRaza', 'rClase');
    bindRazaClase('fRaza', 'fClase');

    /* Envíos */
    document.getElementById('regSubmit').addEventListener('click', registrar);
    document.getElementById('fichaSubmit').addEventListener('click', guardarFicha);

    /* Sincronizar nav al cargar si ya hay sesión Firebase */
    onAuthStateChanged(auth, async user => {
        if (!user) return;
        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (snap.exists()) {
                guardarSesion({
                    uid:           user.uid,
                    nombreUsuario: snap.data().nombreUsuario,
                    id:            snap.data().id
                });
            }
        } catch (_) {}
    });
});

/* ── Mensajes de error Firebase ── */
function errMsg(code) {
    return ({
        'auth/email-already-in-use':   'Ese nombre de usuario ya está registrado.',
        'auth/weak-password':          'La contraseña es demasiado débil.',
        'auth/user-not-found':         'Usuario no encontrado.',
        'auth/wrong-password':         'Contraseña incorrecta.',
        'auth/invalid-credential':     'Usuario o contraseña incorrectos.',
        'auth/too-many-requests':      'Demasiados intentos. Espera un momento.',
        'auth/network-request-failed': 'Error de red. Comprueba tu conexión.',
        'auth/popup-blocked':          'El navegador bloqueó la ventana. Permite popups e inténtalo de nuevo.'
    })[code] || 'Error inesperado. Inténtalo de nuevo.';
}
