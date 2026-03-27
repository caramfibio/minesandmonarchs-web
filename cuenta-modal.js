/* ============================================================
   cuenta-modal.js – Mines & Monarch · Modal de Cuenta
   ============================================================
   Flujo:
     Sin sesión → Modal opciones → [Registrar | Crear personaje | Volver]
       · Registrar       → formulario usuario + contraseña
       · Crear personaje → formulario personaje completo
     Con sesión → redirige a Cuenta/Cuenta.html
   ============================================================ */

import { initializeApp }          from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth,
         createUserWithEmailAndPassword,
         signInWithEmailAndPassword,
         onAuthStateChanged }     from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore,
         doc, setDoc, getDoc,
         runTransaction }         from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ── Config Firebase — sustituye con tus valores ── */
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

function buildOptions(obj) {
    return Object.entries(obj)
        .map(([v, l]) => `<option value="${v}">${l}</option>`)
        .join('');
}

/* ════════════════════════════════════════
   INYECTAR HTML
   ════════════════════════════════════════ */
function inyectar() {
    const html = `
    <div class="cm-overlay" id="cmOverlay">
      <div class="cm-box">
        <div class="cm-header">
          <div class="cm-header-deco"></div>
          <button class="cm-close" id="cmClose">✕</button>
          <h2 class="cm-titulo" id="cmTitulo">Cuenta</h2>
          <p class="cm-subtitulo" id="cmSubtitulo">¿Qué deseas hacer?</p>
        </div>

        <!-- ── Vista: Opciones ── -->
        <div class="cm-body" id="vistaOpciones">
          <div class="cm-opciones">
            <button class="cm-opcion-btn" id="optRegistrar">
              <span class="cm-opcion-icono">⚔</span>
              <span>
                Registrarse
                <span class="cm-opcion-desc">Crea tu cuenta de acceso</span>
              </span>
            </button>
            <button class="cm-opcion-btn" id="optPersonaje">
              <span class="cm-opcion-icono">⚜</span>
              <span>
                Crear personaje
                <span class="cm-opcion-desc">Rellena la ficha de tu personaje</span>
              </span>
            </button>
            <button class="cm-opcion-btn" id="optLogin">
              <span class="cm-opcion-icono">🗝</span>
              <span>
                Iniciar sesión
                <span class="cm-opcion-desc">Ya tengo cuenta</span>
              </span>
            </button>
            <button class="cm-opcion-btn volver" id="optVolver">
              <span class="cm-opcion-icono">←</span>
              Volver
            </button>
          </div>
        </div>

        <!-- ── Vista: Registro ── -->
        <div class="cm-body" id="vistaRegistro" style="display:none">
          <p class="cm-form-section">Crear cuenta</p>
          <div class="cm-field">
            <label class="cm-label">Nombre de usuario <span>*</span></label>
            <input class="cm-input" type="text" id="regUsuario" placeholder="Tu nombre de usuario">
          </div>
          <div class="cm-field">
            <label class="cm-label">Contraseña <span>*</span></label>
            <input class="cm-input" type="password" id="regPass" placeholder="Mínimo 6 caracteres">
          </div>
          <div class="cm-field">
            <label class="cm-label">Repetir contraseña <span>*</span></label>
            <input class="cm-input" type="password" id="regPass2" placeholder="Repite la contraseña">
          </div>
          <p class="cm-nota">El nombre de usuario será visible para otros jugadores.</p>
          <p class="cm-error" id="regError"></p>
          <div class="cm-form-footer">
            <button class="cm-btn-volver" id="regVolver">← Volver</button>
            <button class="cm-btn-submit" id="regSubmit">⚔ Crear cuenta</button>
          </div>
        </div>

        <!-- ── Vista: Login ── -->
        <div class="cm-body" id="vistaLogin" style="display:none">
          <p class="cm-form-section">Iniciar sesión</p>
          <div class="cm-field">
            <label class="cm-label">Nombre de usuario <span>*</span></label>
            <input class="cm-input" type="text" id="loginUsuario" placeholder="Tu nombre de usuario">
          </div>
          <div class="cm-field">
            <label class="cm-label">Contraseña <span>*</span></label>
            <input class="cm-input" type="password" id="loginPass" placeholder="Tu contraseña">
          </div>
          <p class="cm-error" id="loginError"></p>
          <div class="cm-form-footer">
            <button class="cm-btn-volver" id="loginVolver">← Volver</button>
            <button class="cm-btn-submit" id="loginSubmit">🗝 Entrar</button>
          </div>
        </div>

        <!-- ── Vista: Crear personaje ── -->
        <div class="cm-body" id="vistaPersonaje" style="display:none">
          <p class="cm-form-section">Identidad</p>
          <div class="cm-row">
            <div class="cm-field">
              <label class="cm-label">Nombre del personaje <span>*</span></label>
              <input class="cm-input" type="text" id="pNombre" placeholder="Ej: Eira Frostmantle">
            </div>
            <div class="cm-field">
              <label class="cm-label">Discord <span>*</span></label>
              <input class="cm-input" type="text" id="pDiscord" placeholder="@usuario">
            </div>
          </div>

          <p class="cm-form-section">Clase & Trabajo</p>
          <div class="cm-row">
            <div class="cm-field">
              <label class="cm-label">Raza <span>*</span></label>
              <select class="cm-select" id="pRaza">
                <option value="" disabled selected>Selecciona…</option>
                ${buildOptions(RAZAS)}
              </select>
            </div>
            <div class="cm-field">
              <label class="cm-label">Clase <span>*</span></label>
              <select class="cm-select" id="pClase">
                <option value="" disabled selected>Selecciona…</option>
                ${buildOptions(CLASES)}
              </select>
            </div>
          </div>
          <div class="cm-field">
            <label class="cm-label">Trabajo <span>*</span></label>
            <select class="cm-select" id="pTrabajo">
              <option value="" disabled selected>Selecciona…</option>
              ${buildOptions(TRABAJOS)}
            </select>
          </div>

          <p class="cm-form-section">Historia</p>
          <div class="cm-field">
            <label class="cm-label">Descripción del personaje</label>
            <textarea class="cm-textarea" id="pDesc"
              placeholder="Describe brevemente la historia y personalidad de tu personaje…"></textarea>
          </div>
          <div class="cm-field">
            <label class="cm-label">Territorio de origen</label>
            <input class="cm-input" type="text" id="pTerritorio" placeholder="Ej: Kalheim">
          </div>

          <p class="cm-error" id="persError"></p>
          <div class="cm-form-footer">
            <button class="cm-btn-volver" id="persVolver">← Volver</button>
            <button class="cm-btn-submit" id="persSubmit">⚜ Guardar personaje</button>
          </div>
        </div>

        <!-- ── Pantalla de éxito ── -->
        <div class="cm-exito" id="cmExito">
          <div class="cm-exito-icono">⚜</div>
          <h3 id="exitoTitulo">¡Hecho!</h3>
          <p id="exitoTexto">Operación completada.</p>
        </div>

      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
}

/* ════════════════════════════════════════
   NAVEGACIÓN ENTRE VISTAS
   ════════════════════════════════════════ */
function mostrar(vistaId, titulo, subtitulo) {
    ['vistaOpciones','vistaRegistro','vistaLogin','vistaPersonaje','cmExito']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = id === vistaId ? '' : 'none';
            if (id === 'cmExito') { el && el.classList.remove('visible'); }
        });
    if (vistaId === 'cmExito') document.getElementById('cmExito').classList.add('visible');
    if (titulo)    document.getElementById('cmTitulo').textContent    = titulo;
    if (subtitulo) document.getElementById('cmSubtitulo').textContent = subtitulo;
}

function mostrarError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? '' : 'none';
}

/* ════════════════════════════════════════
   FIREBASE — helpers
   ════════════════════════════════════════ */

/* Genera un email interno a partir del nombre de usuario */
function usuarioAEmail(nombre) {
    return `${nombre.trim().toLowerCase().replace(/\s+/g,'_')}@minesandmonarchs.internal`;
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

function guardarSesion(usuario) {
    sessionStorage.setItem('mm_usuario', JSON.stringify(usuario));
    /* Actualizar botón del nav si existe */
    const btn = document.getElementById('nav-cuenta-btn');
    if (btn) btn.textContent = usuario.nombreUsuario;
}

/* ════════════════════════════════════════
   ACCIONES
   ════════════════════════════════════════ */
async function registrar() {
    const usuario = document.getElementById('regUsuario').value.trim();
    const pass    = document.getElementById('regPass').value;
    const pass2   = document.getElementById('regPass2').value;

    if (!usuario)         return mostrarError('regError', 'El nombre de usuario es obligatorio.');
    if (pass.length < 6)  return mostrarError('regError', 'La contraseña debe tener al menos 6 caracteres.');
    if (pass !== pass2)   return mostrarError('regError', 'Las contraseñas no coinciden.');
    mostrarError('regError', '');

    try {
        const email = usuarioAEmail(usuario);
        const cred  = await createUserWithEmailAndPassword(auth, email, pass);
        const id    = await nextId();

        await setDoc(doc(db, 'usuarios', cred.user.uid), {
            id,
            nombreUsuario: usuario,
            isAdmin:       false,
            creadoEn:      new Date(),
            personaje:     null
        });

        guardarSesion({ uid: cred.user.uid, nombreUsuario: usuario, id });

        document.getElementById('exitoTitulo').textContent = '¡Cuenta creada!';
        document.getElementById('exitoTexto').textContent  = `Bienvenido, ${usuario}. Ya puedes crear tu personaje.`;
        mostrar('cmExito', 'Registro', '');
        setTimeout(cerrar, 2200);
    } catch (err) {
        mostrarError('regError', errorMsg(err.code));
    }
}

async function login() {
    const usuario = document.getElementById('loginUsuario').value.trim();
    const pass    = document.getElementById('loginPass').value;

    if (!usuario) return mostrarError('loginError', 'Introduce tu nombre de usuario.');
    if (!pass)    return mostrarError('loginError', 'Introduce tu contraseña.');
    mostrarError('loginError', '');

    try {
        const email = usuarioAEmail(usuario);
        const cred  = await signInWithEmailAndPassword(auth, email, pass);
        const snap  = await getDoc(doc(db, 'usuarios', cred.user.uid));
        const datos = snap.data();

        guardarSesion({ uid: cred.user.uid, nombreUsuario: datos.nombreUsuario, id: datos.id });

        document.getElementById('exitoTitulo').textContent = '¡Bienvenido de vuelta!';
        document.getElementById('exitoTexto').textContent  = `Sesión iniciada como ${datos.nombreUsuario}.`;
        mostrar('cmExito', 'Sesión', '');
        setTimeout(cerrar, 1800);
    } catch (err) {
        mostrarError('loginError', errorMsg(err.code));
    }
}

async function guardarPersonaje() {
    const nombre    = document.getElementById('pNombre').value.trim();
    const discord   = document.getElementById('pDiscord').value.trim();
    const raza      = document.getElementById('pRaza').value;
    const clase     = document.getElementById('pClase').value;
    const trabajo   = document.getElementById('pTrabajo').value;
    const desc      = document.getElementById('pDesc').value.trim();
    const territorio= document.getElementById('pTerritorio').value.trim();

    if (!nombre)  return mostrarError('persError', 'El nombre del personaje es obligatorio.');
    if (!discord) return mostrarError('persError', 'El Discord es obligatorio.');
    if (!raza || !clase || !trabajo) return mostrarError('persError', 'Selecciona raza, clase y trabajo.');
    mostrarError('persError', '');

    /* Si hay sesión activa guardamos en Firestore, si no en sessionStorage temporal */
    const sesion = JSON.parse(sessionStorage.getItem('mm_usuario') || 'null');

    const personaje = { nombre, discord, raza, clase, trabajo, desc, territorio, creadoEn: new Date() };

    try {
        if (sesion) {
            await setDoc(doc(db, 'usuarios', sesion.uid), { personaje }, { merge: true });
        } else {
            /* Guardar temporalmente hasta que se registre */
            sessionStorage.setItem('mm_personaje_pendiente', JSON.stringify(personaje));
        }

        document.getElementById('exitoTitulo').textContent = '¡Personaje guardado!';
        document.getElementById('exitoTexto').textContent  =
            sesion
            ? `${nombre} ha sido registrado en Belmaria.`
            : 'Tu personaje quedará guardado cuando completes el registro.';
        mostrar('cmExito', 'Personaje', '');
        setTimeout(cerrar, 2200);
    } catch (err) {
        mostrarError('persError', 'Error al guardar. Inténtalo de nuevo.');
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

window.abrirModalCuenta = function() {
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

    /* Opciones */
    document.getElementById('optRegistrar').addEventListener('click', () =>
        mostrar('vistaRegistro', 'Registrarse', 'Crea tu cuenta de acceso'));
    document.getElementById('optLogin').addEventListener('click', () =>
        mostrar('vistaLogin', 'Iniciar sesión', 'Accede a tu cuenta'));
    document.getElementById('optPersonaje').addEventListener('click', () =>
        mostrar('vistaPersonaje', 'Crear personaje', 'Rellena la ficha de tu personaje'));
    document.getElementById('optVolver').addEventListener('click', cerrar);

    /* Volver en cada vista */
    document.getElementById('regVolver').addEventListener('click', () =>
        mostrar('vistaOpciones', 'Cuenta', '¿Qué deseas hacer?'));
    document.getElementById('loginVolver').addEventListener('click', () =>
        mostrar('vistaOpciones', 'Cuenta', '¿Qué deseas hacer?'));
    document.getElementById('persVolver').addEventListener('click', () =>
        mostrar('vistaOpciones', 'Cuenta', '¿Qué deseas hacer?'));

    /* Envíos */
    document.getElementById('regSubmit').addEventListener('click', registrar);
    document.getElementById('loginSubmit').addEventListener('click', login);
    document.getElementById('persSubmit').addEventListener('click', guardarPersonaje);

    /* Escuchar sesión de Firebase para sincronizar el nav */
    onAuthStateChanged(auth, async user => {
        if (!user) return;
        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (!snap.exists()) return;
            guardarSesion({ uid: user.uid, nombreUsuario: snap.data().nombreUsuario, id: snap.data().id });
        } catch (_) {}
    });
});

/* ── Mensajes de error Firebase ── */
function errorMsg(code) {
    const map = {
        'auth/email-already-in-use':   'Ese nombre de usuario ya está en uso.',
        'auth/invalid-email':          'Nombre de usuario no válido.',
        'auth/weak-password':          'La contraseña es demasiado débil.',
        'auth/user-not-found':         'Usuario no encontrado.',
        'auth/wrong-password':         'Contraseña incorrecta.',
        'auth/too-many-requests':      'Demasiados intentos. Espera un momento.',
        'auth/network-request-failed': 'Error de red. Comprueba tu conexión.',
        'auth/invalid-credential':     'Usuario o contraseña incorrectos.'
    };
    return map[code] || 'Error inesperado. Inténtalo de nuevo.';
}
