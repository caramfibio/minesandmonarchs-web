/* ============================================================
   cuenta-modal.js – Mines & Monarch · Modal de Cuenta
   ============================================================
   Flujo Sign In:
     1. Nombre de Discord + Contraseña + Confirmar contraseña
     2. Nombre de rol + Nombre de Minecraft + Raza + Clase + Trabajo
   Flujo Login:
     1. Nombre de Discord + Contraseña → entra directamente

   Roles: admin | escriba | ciudadano
   Firebase: email/password (email = discord@mm.internal)
   ============================================================ */

import { initializeApp }           from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth,
         createUserWithEmailAndPassword,
         signInWithEmailAndPassword,
         onAuthStateChanged }       from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore,
         doc, setDoc, getDoc,
         runTransaction }           from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

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

/* ════════════════════════════════════════
   ENUM DE ROLES
   ════════════════════════════════════════ */
const ROL = {
    admin:     'admin',
    escriba:   'escriba',
    ciudadano: 'ciudadano'
};

/* ════════════════════════════════════════
   ENUMS DE PERSONAJE
   ════════════════════════════════════════ */
const RAZAS = {
    humano:       "Humano",
    elfobosque:   "Elfo del Bosque",
    alfiq:        "Alfiq",
    goblin:       "Goblin",
    enano:        "Enano",
    aracnido:     "Arácnido",
    yeti:         "Yeti",
    demonio:      "Demonio",
    sirena:       "Sirena",
    valquiria:    "Valquiria",
    hadapixie:    "Hada Pixie",
    hadafae:      "Hada Fae",
    granelfo:     "Gran Elfo",
    gorgona:      "Gorgona",
    victimapeste: "Víctima de la Peste",
    banshee:      "Banshee",
    elfolunar:    "Elfo Lunar",
    ogro:         "Ogro",
    revenant:     "Revenant"
};

const CLASES = {
    cazador:        "Cazador",
    guardabosques:  "Guardabosques",
    curador:        "Curador",
    magoender:      "Mago del Ender",
    magoelectrico:  "Mago Eléctrico",
    magosangre:     "Mago de Sangre",
    magohelado:     "Mago Helado",
    magoinvocador:  "Mago Invocador",
    magofuego:      "Mago de Fuego",
    granmago:       "Gran Mago",
    granmagooscuro: "Gran Mago Oscuro",
    guerrerobendito:"Guerrero Bendito",
    hiedravenenosa: "Hiedra Venenosa",
    rogue:          "Rogue",
    tanque:         "Tanque",
    berserker:      "Berserker",
    guerrero:       "Guerrero",
    bardo:          "Bardo",
    guerrerodelmar: "Guerrero del Mar",
    carterista:     "Carterista",
    paladin:        "Paladín",
    ingeniero:      "Ingeniero",
    bestiasalvaje:  "Bestia Salvaje",
    angler:         "Angler",
    magoeldritch:   "Mago del Eldritch"
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
    constructor:   "Constructor",
    inutilerrante: "Inútil Errante",
    explorador:    "Explorador",
    clerigo:       "Clérigo",
    mercader:      "Mercader",
    metalurgico:   "Metalúrgico",
    agricultor:    "Agricultor",
    granjero:      "Granjero",
    cocinero:      "Cocinero"
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

        <!-- ── VISTA: Opciones ── -->
        <div class="cm-body" id="vistaOpciones">
          <div class="cm-opciones">
            <button class="cm-opcion-btn" id="optSignin">
              <span class="cm-opcion-icono">⚜</span>
              <span>Sign In
                <span class="cm-opcion-desc">Crea una cuenta nueva</span>
              </span>
            </button>
            <button class="cm-opcion-btn" id="optLogin">
              <span class="cm-opcion-icono">⚔</span>
              <span>Login
                <span class="cm-opcion-desc">Ya tengo cuenta</span>
              </span>
            </button>
            <button class="cm-opcion-btn secundario" id="optVolver">
              <span class="cm-opcion-icono">←</span>Volver
            </button>
          </div>
        </div>

        <!-- ── VISTA: Sign In paso 1 — Cuenta ── -->
        <div class="cm-body" id="vistaSignin1" style="display:none">
          <p class="cm-section">Cuenta</p>
          <div class="cm-field">
            <label class="cm-label">Nombre de Discord <span>*</span></label>
            <input class="cm-input" type="text" id="s1Discord" placeholder="@usuario">
          </div>
          <div class="cm-field">
            <label class="cm-label">Contraseña <span>*</span></label>
            <input class="cm-input" type="password" id="s1Pass" placeholder="Mínimo 6 caracteres">
          </div>
          <div class="cm-field">
            <label class="cm-label">Confirmar contraseña <span>*</span></label>
            <input class="cm-input" type="password" id="s1Pass2" placeholder="Repite la contraseña">
          </div>
          <p class="cm-error" id="s1Error"></p>
          <div class="cm-form-footer">
            <button class="cm-btn-volver" id="s1Volver">← Volver</button>
            <button class="cm-btn-submit" id="s1Siguiente">Siguiente →</button>
          </div>
        </div>

        <!-- ── VISTA: Sign In paso 2 — Personaje ── -->
        <div class="cm-body" id="vistaSignin2" style="display:none">
          <p class="cm-section">Personaje</p>
          <div class="cm-row">
            <div class="cm-field">
              <label class="cm-label">Nombre de rol <span>*</span></label>
              <input class="cm-input" type="text" id="s2NombreRol" placeholder="Ej: Eira Frostmantle">
            </div>
            <div class="cm-field">
              <label class="cm-label">Nombre de Minecraft <span>*</span></label>
              <input class="cm-input" type="text" id="s2NombreMC" placeholder="Tu nick en MC">
            </div>
          </div>
          <div class="cm-field">
            <label class="cm-label">Raza <span>*</span></label>
            <select class="cm-select" id="s2Raza">
              <option value="" disabled selected>Selecciona…</option>
              ${opts(RAZAS)}
            </select>
          </div>
          <div class="cm-row">
            <div class="cm-field">
              <label class="cm-label">Clase <span>*</span></label>
              <select class="cm-select" id="s2Clase" disabled>
                <option value="" disabled selected>Selecciona primero la raza…</option>
              </select>
            </div>
            <div class="cm-field">
              <label class="cm-label">Trabajo <span>*</span></label>
              <select class="cm-select" id="s2Trabajo">
                <option value="" disabled selected>Selecciona…</option>
                ${opts(TRABAJOS)}
              </select>
            </div>
          </div>
          <p class="cm-error" id="s2Error"></p>
          <div class="cm-form-footer">
            <button class="cm-btn-volver" id="s2Volver">← Volver</button>
            <button class="cm-btn-submit" id="s2Crear">⚜ Crear cuenta</button>
          </div>
        </div>

        <!-- ── VISTA: Login ── -->
        <div class="cm-body" id="vistaLogin" style="display:none">
          <p class="cm-section">Iniciar sesión</p>
          <div class="cm-field">
            <label class="cm-label">Nombre de Discord <span>*</span></label>
            <input class="cm-input" type="text" id="lDiscord" placeholder="@usuario">
          </div>
          <div class="cm-field">
            <label class="cm-label">Contraseña <span>*</span></label>
            <input class="cm-input" type="password" id="lPass" placeholder="Tu contraseña">
          </div>
          <p class="cm-error" id="lError"></p>
          <div class="cm-form-footer">
            <button class="cm-btn-volver" id="lVolver">← Volver</button>
            <button class="cm-btn-submit" id="lEntrar">⚔ Entrar</button>
          </div>
        </div>

        <!-- ── ÉXITO ── -->
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
const VISTAS = ['vistaOpciones','vistaSignin1','vistaSignin2','vistaLogin','cmExito'];

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
   FIREBASE HELPERS
   ════════════════════════════════════════ */

/* Convierte el nombre de Discord en un email interno para Firebase Auth */
function discordToEmail(discord) {
    return discord.trim().toLowerCase()
        .replace(/^@/, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_.]/g, '') + '@mm.internal';
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
    if (btn) btn.textContent = datos.nombreRol || datos.discord;
}

/* ════════════════════════════════════════
   SIGN IN — paso 1 (validación local)
   ════════════════════════════════════════ */
function validarPaso1() {
    const discord = document.getElementById('s1Discord').value.trim();
    const pass    = document.getElementById('s1Pass').value;
    const pass2   = document.getElementById('s1Pass2').value;

    if (!discord)        return setError('s1Error', 'El nombre de Discord es obligatorio.'), false;
    if (!/^@.{2,}$/.test(discord))
                         return setError('s1Error', 'El Discord debe tener el formato @usuario.'), false;
    if (pass.length < 6) return setError('s1Error', 'La contraseña debe tener al menos 6 caracteres.'), false;
    if (pass !== pass2)  return setError('s1Error', 'Las contraseñas no coinciden.'), false;

    setError('s1Error', '');
    return true;
}

/* ════════════════════════════════════════
   SIGN IN — paso 2 (crea la cuenta)
   ════════════════════════════════════════ */
async function crearCuenta() {
    const nombreRol = document.getElementById('s2NombreRol').value.trim();
    const nombreMC  = document.getElementById('s2NombreMC').value.trim();
    const raza      = document.getElementById('s2Raza').value;
    const clase     = document.getElementById('s2Clase').value;
    const trabajo   = document.getElementById('s2Trabajo').value;

    if (!nombreRol)               return setError('s2Error', 'El nombre de rol es obligatorio.');
    if (!nombreMC)                return setError('s2Error', 'El nombre de Minecraft es obligatorio.');
    if (!raza || !clase || !trabajo) return setError('s2Error', 'Selecciona raza, clase y trabajo.');
    setError('s2Error', '');

    const discord = document.getElementById('s1Discord').value.trim();
    const pass    = document.getElementById('s1Pass').value;

    try {
        const cred = await createUserWithEmailAndPassword(auth, discordToEmail(discord), pass);
        const id   = await nextId();

        await setDoc(doc(db, 'usuarios', cred.user.uid), {
            id,
            discord,
            rol:      ROL.ciudadano,  /* rol por defecto al registrarse */
            creadoEn: new Date(),
            personaje: { nombreRol, nombreMC, raza, clase, trabajo }
        });

        guardarSesion({ uid: cred.user.uid, discord, nombreRol, id, rol: ROL.ciudadano });

        document.getElementById('exitoTitulo').textContent = '¡Bienvenido a Belmaria!';
        document.getElementById('exitoTexto').textContent  = `${nombreRol} ha llegado al mundo.`;
        mostrar('cmExito');
        setTimeout(cerrar, 2200);
    } catch (err) {
        setError('s2Error', errMsg(err.code));
    }
}

/* ════════════════════════════════════════
   LOGIN
   ════════════════════════════════════════ */
async function login() {
    const discord = document.getElementById('lDiscord').value.trim();
    const pass    = document.getElementById('lPass').value;

    if (!discord) return setError('lError', 'El nombre de Discord es obligatorio.');
    if (!pass)    return setError('lError', 'La contraseña es obligatoria.');
    setError('lError', '');

    try {
        const cred  = await signInWithEmailAndPassword(auth, discordToEmail(discord), pass);
        const snap  = await getDoc(doc(db, 'usuarios', cred.user.uid));
        const datos = snap.data();

        guardarSesion({
            uid:      cred.user.uid,
            discord,
            nombreRol: datos.personaje?.nombreRol || discord,
            id:        datos.id,
            rol:       datos.rol
        });

        document.getElementById('exitoTitulo').textContent = `¡Bienvenido, ${datos.personaje?.nombreRol || discord}!`;
        document.getElementById('exitoTexto').textContent  = 'Sesión iniciada correctamente.';
        mostrar('cmExito');
        setTimeout(cerrar, 1800);
    } catch (err) {
        setError('lError', errMsg(err.code));
    }
}

/* ════════════════════════════════════════
   ABRIR / CERRAR
   ════════════════════════════════════════ */
function cerrar() {
    document.getElementById('cmOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function resetForm() {
    ['s1Discord','s1Pass','s1Pass2','s2NombreRol','s2NombreMC','lDiscord','lPass']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['s2Raza','s2Trabajo'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    const s2Clase = document.getElementById('s2Clase');
    if (s2Clase) {
        s2Clase.innerHTML = '<option value="" disabled selected>Selecciona primero la raza…</option>';
        s2Clase.value     = '';
        s2Clase.disabled  = true;
    }
    ['s1Error','s2Error','lError'].forEach(id => setError(id, ''));
}

window.abrirModalCuenta = function () {
    resetForm();
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
    document.getElementById('optSignin').addEventListener('click', () =>
        mostrar('vistaSignin1', 'Sign In', 'Paso 1 de 2 — Cuenta'));
    document.getElementById('optLogin').addEventListener('click', () =>
        mostrar('vistaLogin', 'Login', 'Accede a tu cuenta'));
    document.getElementById('optVolver').addEventListener('click', cerrar);

    /* Sign In paso 1 */
    document.getElementById('s1Volver').addEventListener('click', () =>
        mostrar('vistaOpciones', 'Cuenta', '¿Qué deseas hacer?'));
    document.getElementById('s1Siguiente').addEventListener('click', () => {
        if (validarPaso1()) mostrar('vistaSignin2', 'Sign In', 'Paso 2 de 2 — Personaje');
    });

    /* Sign In paso 2 */
    document.getElementById('s2Volver').addEventListener('click', () =>
        mostrar('vistaSignin1', 'Sign In', 'Paso 1 de 2 — Cuenta'));
    document.getElementById('s2Crear').addEventListener('click', crearCuenta);

    /* Login */
    document.getElementById('lVolver').addEventListener('click', () =>
        mostrar('vistaOpciones', 'Cuenta', '¿Qué deseas hacer?'));
    document.getElementById('lEntrar').addEventListener('click', login);

    /* Enter en inputs */
    document.getElementById('s1Pass2').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('s1Siguiente').click();
    });
    document.getElementById('lPass').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('lEntrar').click();
    });

    /* Filtro raza → clase */
    document.getElementById('s2Raza').addEventListener('change', function () {
        const select = document.getElementById('s2Clase');
        const clases = CLASES_POR_RAZA[this.value] || [];
        select.innerHTML = '<option value="" disabled selected>Selecciona…</option>' +
            clases.map(c => `<option value="${c}">${CLASES[c]}</option>`).join('');
        select.value    = '';
        select.disabled = false;
    });

    /* Sincronizar nav al cargar si Firebase ya tiene sesión */
    onAuthStateChanged(auth, async user => {
        if (!user) return;
        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (!snap.exists()) return;
            const datos = snap.data();
            guardarSesion({
                uid:       user.uid,
                discord:   datos.discord,
                nombreRol: datos.personaje?.nombreRol || datos.discord,
                id:        datos.id,
                rol:       datos.rol
            });
        } catch (_) {}
    });
});

/* ── Mensajes de error Firebase ── */
function errMsg(code) {
    return ({
        'auth/email-already-in-use':   'Ese nombre de Discord ya está registrado.',
        'auth/weak-password':          'La contraseña es demasiado débil.',
        'auth/user-not-found':         'No existe ninguna cuenta con ese Discord.',
        'auth/wrong-password':         'Contraseña incorrecta.',
        'auth/invalid-credential':     'Discord o contraseña incorrectos.',
        'auth/too-many-requests':      'Demasiados intentos. Espera un momento.',
        'auth/network-request-failed': 'Error de red. Comprueba tu conexión.'
    })[code] || 'Error inesperado. Inténtalo de nuevo.';
}
