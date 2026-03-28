/* ============================================================
   cuenta-modal.js – Mines & Monarch · Modal de Cuenta
   ============================================================
   Flujo sin sesión:
     Nav "Entrar" → Modal opciones
       · Registrarse  → formulario único (cuenta + personaje)
       · Iniciar sesión → usuario + contraseña
       · Volver       → cierra
   Con sesión:
     Nav muestra nombre → redirige a Cuenta/Cuenta.html
   ============================================================ */

import { initializeApp }        from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth,
         createUserWithEmailAndPassword,
         signInWithEmailAndPassword,
         onAuthStateChanged }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore,
         doc, setDoc, getDoc,
         runTransaction }       from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ── Firebase config — sustituye con tus valores ── */
const firebaseConfig = {
    apiKey:            "TU_API_KEY",
    authDomain:        "TU_PROYECTO.firebaseapp.com",
    projectId:         "TU_PROYECTO",
    storageBucket:     "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId:             "TU_APP_ID"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

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
    picaro:"Pícaro", tanque:"Tanque", berserker:"Berserker",
    guerrero:"Guerrero", bardo:"Bardo", guerrerodelmar:"Guerrero del Mar",
    carterista:"Carterista", paladin:"Paladín", ingeniero:"Ingeniero",
    bestiasalvaje:"Bestia Salvaje", pescador:"Pescador"
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
            <button class="cm-opcion-btn" id="optRegistrar">
              <span class="cm-opcion-icono">⚜</span>
              <span>Registrarse<span class="cm-opcion-desc">Crea tu cuenta y tu personaje</span></span>
            </button>
            <button class="cm-opcion-btn" id="optLogin">
              <span class="cm-opcion-icono">⚔</span>
              <span>Iniciar sesión<span class="cm-opcion-desc">Ya tengo cuenta</span></span>
            </button>
            <button class="cm-opcion-btn volver" id="optVolver">
              <span class="cm-opcion-icono">←</span>Volver
            </button>
          </div>
        </div>

        <!-- REGISTRO = CREAR PERSONAJE -->
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
                <option value="" disabled selected>Selecciona…</option>
                ${opts(CLASES)}
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

        <!-- LOGIN -->
        <div class="cm-body" id="vistaLogin" style="display:none">
          <p class="cm-section">Iniciar sesión</p>
          <div class="cm-field">
            <label class="cm-label">Nombre de usuario <span>*</span></label>
            <input class="cm-input" type="text" id="lUsuario" placeholder="Tu nombre de usuario">
          </div>
          <div class="cm-field">
            <label class="cm-label">Contraseña <span>*</span></label>
            <input class="cm-input" type="password" id="lPass" placeholder="Tu contraseña">
          </div>
          <p class="cm-error" id="loginError"></p>
          <div class="cm-form-footer">
            <button class="cm-btn-volver" id="loginVolver">← Volver</button>
            <button class="cm-btn-submit" id="loginSubmit">⚔ Entrar</button>
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
const VISTAS = ['vistaOpciones','vistaRegistro','vistaLogin','cmExito'];

function mostrar(id, titulo, sub) {
    VISTAS.forEach(v => {
        const el = document.getElementById(v);
        if (!el) return;
        el.style.display = v === id && v !== 'cmExito' ? '' : 'none';
        if (v === 'cmExito') { el.classList.toggle('visible', v === id); el.style.display = ''; }
    });
    if (titulo) document.getElementById('cmTitulo').textContent = titulo;
    if (sub !== undefined) document.getElementById('cmSub').textContent = sub;
}

function setError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? '' : 'none';
}

/* ════════════════════════════════════════
   FIREBASE
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

/* ── Registro ── */
async function registrar() {
    const usuario = document.getElementById('rUsuario').value.trim();
    const discord = document.getElementById('rDiscord').value.trim();
    const pass    = document.getElementById('rPass').value;
    const pass2   = document.getElementById('rPass2').value;
    const nombre  = document.getElementById('rNombre').value.trim();
    const raza    = document.getElementById('rRaza').value;
    const clase   = document.getElementById('rClase').value;
    const trabajo = document.getElementById('rTrabajo').value;

    if (!usuario)              return setError('regError', 'El nombre de usuario es obligatorio.');
    if (!discord)              return setError('regError', 'El Discord es obligatorio.');
    if (pass.length < 6)       return setError('regError', 'La contraseña debe tener al menos 6 caracteres.');
    if (pass !== pass2)        return setError('regError', 'Las contraseñas no coinciden.');
    if (!nombre)               return setError('regError', 'El nombre del personaje es obligatorio.');
    if (!raza||!clase||!trabajo) return setError('regError', 'Selecciona raza, clase y trabajo.');
    setError('regError', '');

    try {
        const cred = await createUserWithEmailAndPassword(auth, toEmail(usuario), pass);
        const id   = await nextId();

        await setDoc(doc(db, 'usuarios', cred.user.uid), {
            id,
            nombreUsuario: usuario,
            discord,
            isAdmin: false,
            creadoEn: new Date(),
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

/* ── Login ── */
async function login() {
    const usuario = document.getElementById('lUsuario').value.trim();
    const pass    = document.getElementById('lPass').value;

    if (!usuario) return setError('loginError', 'Introduce tu nombre de usuario.');
    if (!pass)    return setError('loginError', 'Introduce tu contraseña.');
    setError('loginError', '');

    try {
        const cred  = await signInWithEmailAndPassword(auth, toEmail(usuario), pass);
        const snap  = await getDoc(doc(db, 'usuarios', cred.user.uid));
        const datos = snap.data();

        guardarSesion({ uid: cred.user.uid, nombreUsuario: datos.nombreUsuario, id: datos.id });

        document.getElementById('exitoTitulo').textContent = `¡Bienvenido, ${datos.nombreUsuario}!`;
        document.getElementById('exitoTexto').textContent  = 'Sesión iniciada correctamente.';
        mostrar('cmExito', '', '');
        setTimeout(cerrar, 1800);
    } catch (err) {
        setError('loginError', errMsg(err.code));
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

    /* Navegación */
    document.getElementById('optRegistrar').addEventListener('click', () =>
        mostrar('vistaRegistro', 'Crear cuenta', 'Cuenta y personaje'));
    document.getElementById('optLogin').addEventListener('click', () =>
        mostrar('vistaLogin', 'Iniciar sesión', 'Accede a tu cuenta'));
    document.getElementById('optVolver').addEventListener('click', cerrar);
    document.getElementById('regVolver').addEventListener('click', () =>
        mostrar('vistaOpciones', 'Cuenta', '¿Qué deseas hacer?'));
    document.getElementById('loginVolver').addEventListener('click', () =>
        mostrar('vistaOpciones', 'Cuenta', '¿Qué deseas hacer?'));

    /* Envíos */
    document.getElementById('regSubmit').addEventListener('click', registrar);
    document.getElementById('loginSubmit').addEventListener('click', login);

    /* Sincronizar nav si Firebase ya tiene sesión activa */
    onAuthStateChanged(auth, async user => {
        if (!user) return;
        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (snap.exists()) guardarSesion({
                uid: user.uid,
                nombreUsuario: snap.data().nombreUsuario,
                id: snap.data().id
            });
        } catch (_) {}
    });
});

/* ── Mensajes de error ── */
function errMsg(code) {
    return ({
        'auth/email-already-in-use':   'Ese nombre de usuario ya está registrado.',
        'auth/weak-password':          'La contraseña es demasiado débil.',
        'auth/user-not-found':         'Usuario no encontrado.',
        'auth/wrong-password':         'Contraseña incorrecta.',
        'auth/invalid-credential':     'Usuario o contraseña incorrectos.',
        'auth/too-many-requests':      'Demasiados intentos. Espera un momento.',
        'auth/network-request-failed': 'Error de red. Comprueba tu conexión.'
    })[code] || 'Error inesperado. Inténtalo de nuevo.';
}
