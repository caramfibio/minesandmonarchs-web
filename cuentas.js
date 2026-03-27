/* ============================================================
   cuentas.js – Mines & Monarch · Registro e inicio de sesión
   ============================================================ */

import {
    db, auth,
    doc, getDoc, setDoc,
    runTransaction,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from './firebase.js';

import {
    RAZAS, CLASES, TRABAJOS,
    RAZAS_LABELS, CLASES_LABELS, TRABAJOS_LABELS
} from './enums.js';

/* ════════════════════════════════════════
   REGISTRO
   ════════════════════════════════════════ */

/**
 * Registra un nuevo usuario.
 * 1. Crea la cuenta en Firebase Auth (email + password)
 * 2. Obtiene el siguiente id autoincremental (transacción atómica)
 * 3. Guarda el perfil en Firestore bajo /usuarios/{uid}
 *
 * @param {string} email
 * @param {string} password
 * @param {object} perfil  { usuarioDiscord, nombre, raza, clase, trabajo }
 * @returns {object} usuario creado
 */
export async function registrarUsuario(email, password, perfil) {
    /* Validar enums antes de tocar Firebase */
    if (!RAZAS.includes(perfil.raza))    throw new Error('Raza no válida.');
    if (!CLASES.includes(perfil.clase))  throw new Error('Clase no válida.');
    if (!TRABAJOS.includes(perfil.trabajo)) throw new Error('Trabajo no válido.');

    /* Crear cuenta en Auth */
    const credencial = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credencial.user.uid;

    /* Obtener id autoincremental de forma atómica */
    const contadorRef = doc(db, 'meta', 'contador_usuarios');
    let nuevoId;

    await runTransaction(db, async (tx) => {
        const snap = await tx.get(contadorRef);
        nuevoId = snap.exists() ? snap.data().total + 1 : 1;
        tx.set(contadorRef, { total: nuevoId });
    });

    /* Guardar perfil en Firestore */
    const usuario = {
        id:             nuevoId,
        usuarioDiscord: perfil.usuarioDiscord.trim(),
        nombre:         perfil.nombre.trim(),
        raza:           perfil.raza,
        clase:          perfil.clase,
        trabajo:        perfil.trabajo,
        isAdmin:        false,          // siempre false en el registro
        creadoEn:       new Date()
    };

    await setDoc(doc(db, 'usuarios', uid), usuario);

    return { uid, ...usuario };
}

/* ════════════════════════════════════════
   LOGIN / LOGOUT
   ════════════════════════════════════════ */

export async function iniciarSesion(email, password) {
    const credencial = await signInWithEmailAndPassword(auth, email, password);
    return credencial.user;
}

export async function cerrarSesion() {
    await signOut(auth);
}

/* ════════════════════════════════════════
   PERFIL DEL USUARIO ACTUAL
   ════════════════════════════════════════ */

/**
 * Devuelve el perfil completo del usuario autenticado desde Firestore.
 * Devuelve null si no hay sesión activa.
 */
export async function obtenerPerfilActual() {
    const user = auth.currentUser;
    if (!user) return null;

    const snap = await getDoc(doc(db, 'usuarios', user.uid));
    if (!snap.exists()) return null;

    return { uid: user.uid, ...snap.data() };
}

/**
 * Escucha cambios de sesión en tiempo real.
 * Útil para actualizar el header cuando el usuario inicia/cierra sesión.
 *
 * @param {function} callback  Recibe el perfil o null
 */
export function escucharSesion(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) { callback(null); return; }
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        callback(snap.exists() ? { uid: user.uid, ...snap.data() } : null);
    });
}

/* ════════════════════════════════════════
   FORMULARIO DE REGISTRO (inyecta el modal en la página)
   ════════════════════════════════════════ */

function buildSelect(id, opciones, labels) {
    return `<select class="form-select" id="${id}" required>
        <option value="" disabled selected>Selecciona…</option>
        ${opciones.map(v => `<option value="${v}">${labels[v]}</option>`).join('')}
    </select>`;
}

export function inyectarFormularioCuentas() {
    const html = `
    <!-- ══ MODAL CUENTAS ══ -->
    <div class="form-overlay" id="cuentasOverlay">
        <div class="form-box" style="max-width:520px">
            <div class="form-header">
                <div class="form-header-deco"></div>
                <button class="form-close" id="cuentasClose">✕</button>
                <h2 class="form-title" id="cuentasTitle">Iniciar Sesión</h2>
                <p class="form-subtitle" id="cuentasSubtitle">Accede a tu cuenta de Belmaria</p>
            </div>

            <!-- ── Vista: Login ── -->
            <div class="form-body" id="vistaLogin">
                <p class="form-section-label">Credenciales</p>
                <div class="form-row full">
                    <div class="form-group">
                        <label class="form-label">Correo electrónico <span>*</span></label>
                        <input class="form-input" type="email" id="login_email" placeholder="tu@correo.com">
                    </div>
                </div>
                <div class="form-row full">
                    <div class="form-group">
                        <label class="form-label">Contraseña <span>*</span></label>
                        <input class="form-input" type="password" id="login_pass" placeholder="••••••••">
                    </div>
                </div>
                <p class="form-note" id="loginError" style="color:#c0392b;display:none"></p>
                <div class="form-submit-row">
                    <button class="form-cancel" id="irARegistro" type="button">¿Sin cuenta? Regístrate</button>
                    <button class="form-submit" id="btnLogin" type="button">⚔ Entrar</button>
                </div>
            </div>

            <!-- ── Vista: Registro ── -->
            <div class="form-body" id="vistaRegistro" style="display:none">
                <p class="form-section-label">Cuenta</p>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Correo electrónico <span>*</span></label>
                        <input class="form-input" type="email" id="reg_email" placeholder="tu@correo.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contraseña <span>*</span></label>
                        <input class="form-input" type="password" id="reg_pass" placeholder="Mínimo 6 caracteres">
                    </div>
                </div>

                <p class="form-section-label">Perfil de personaje</p>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Nombre del personaje <span>*</span></label>
                        <input class="form-input" type="text" id="reg_nombre" placeholder="Ej: Eira Frostmantle">
                    </div>
                    <div class="form-group discord-field">
                        <label class="form-label">
                            Discord <span>*</span>
                            <span class="discord-badge">⚡</span>
                        </label>
                        <input class="form-input" type="text" id="reg_discord" placeholder="@usuario">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Raza <span>*</span></label>
                        ${buildSelect('reg_raza', RAZAS, RAZAS_LABELS)}
                    </div>
                    <div class="form-group">
                        <label class="form-label">Clase <span>*</span></label>
                        ${buildSelect('reg_clase', CLASES, CLASES_LABELS)}
                    </div>
                </div>

                <div class="form-row full">
                    <div class="form-group">
                        <label class="form-label">Trabajo <span>*</span></label>
                        ${buildSelect('reg_trabajo', TRABAJOS, TRABAJOS_LABELS)}
                    </div>
                </div>

                <p class="form-note" id="regError" style="color:#c0392b;display:none"></p>
                <div class="form-submit-row">
                    <button class="form-cancel" id="irALogin" type="button">¿Ya tienes cuenta? Entra</button>
                    <button class="form-submit" id="btnRegistro" type="button">⚜ Crear cuenta</button>
                </div>
            </div>

            <!-- ── Vista: Éxito ── -->
            <div class="form-success" id="vistaExito">
                <div class="form-success-icon">⚜</div>
                <h3 id="exitoTitulo">¡Bienvenido a Belmaria!</h3>
                <p id="exitoTexto">Tu cuenta ha sido creada correctamente.</p>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    _bindEventosCuentas();
}

function _bindEventosCuentas() {
    const overlay    = document.getElementById('cuentasOverlay');
    const closeBtn   = document.getElementById('cuentasClose');
    const vistaLogin = document.getElementById('vistaLogin');
    const vistaReg   = document.getElementById('vistaRegistro');
    const vistaExito = document.getElementById('vistaExito');

    /* Cerrar */
    function cerrar() { overlay.classList.remove('active'); document.body.style.overflow = ''; }
    closeBtn.addEventListener('click', cerrar);
    overlay.addEventListener('click', e => { if (e.target === overlay) cerrar(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) cerrar();
    });

    /* Cambiar entre login y registro */
    document.getElementById('irARegistro').addEventListener('click', () => {
        vistaLogin.style.display = 'none';
        vistaReg.style.display = '';
        document.getElementById('cuentasTitle').textContent = 'Crear cuenta';
        document.getElementById('cuentasSubtitle').textContent = 'Únete al mundo de Belmaria';
    });
    document.getElementById('irALogin').addEventListener('click', () => {
        vistaReg.style.display = 'none';
        vistaLogin.style.display = '';
        document.getElementById('cuentasTitle').textContent = 'Iniciar sesión';
        document.getElementById('cuentasSubtitle').textContent = 'Accede a tu cuenta de Belmaria';
    });

    /* LOGIN */
    document.getElementById('btnLogin').addEventListener('click', async () => {
        const email = document.getElementById('login_email').value.trim();
        const pass  = document.getElementById('login_pass').value;
        const errEl = document.getElementById('loginError');
        errEl.style.display = 'none';

        try {
            await iniciarSesion(email, pass);
            vistaLogin.style.display = 'none';
            document.getElementById('exitoTitulo').textContent = '¡Bienvenido de vuelta!';
            document.getElementById('exitoTexto').textContent  = 'Sesión iniciada correctamente.';
            vistaExito.classList.add('visible');
            setTimeout(cerrar, 1800);
        } catch (err) {
            errEl.textContent = _mensajeError(err.code);
            errEl.style.display = '';
        }
    });

    /* REGISTRO */
    document.getElementById('btnRegistro').addEventListener('click', async () => {
        const errEl = document.getElementById('regError');
        errEl.style.display = 'none';

        const perfil = {
            usuarioDiscord: document.getElementById('reg_discord').value,
            nombre:         document.getElementById('reg_nombre').value,
            raza:           document.getElementById('reg_raza').value,
            clase:          document.getElementById('reg_clase').value,
            trabajo:        document.getElementById('reg_trabajo').value
        };

        const email = document.getElementById('reg_email').value.trim();
        const pass  = document.getElementById('reg_pass').value;

        /* Validación básica */
        if (!email || !pass)                   { _mostrarError(errEl, 'Email y contraseña obligatorios.'); return; }
        if (pass.length < 6)                   { _mostrarError(errEl, 'La contraseña debe tener al menos 6 caracteres.'); return; }
        if (!perfil.nombre)                    { _mostrarError(errEl, 'El nombre del personaje es obligatorio.'); return; }
        if (!perfil.usuarioDiscord)            { _mostrarError(errEl, 'El nombre de Discord es obligatorio.'); return; }
        if (!perfil.raza || !perfil.clase || !perfil.trabajo) {
            _mostrarError(errEl, 'Selecciona raza, clase y trabajo.'); return;
        }

        try {
            await registrarUsuario(email, pass, perfil);
            vistaReg.style.display = 'none';
            document.getElementById('exitoTitulo').textContent = '¡Bienvenido a Belmaria!';
            document.getElementById('exitoTexto').textContent  = `Tu personaje ${perfil.nombre} ha sido creado.`;
            vistaExito.classList.add('visible');
            setTimeout(cerrar, 2200);
        } catch (err) {
            _mostrarError(errEl, _mensajeError(err.code) || err.message);
        }
    });
}

function _mostrarError(el, msg) { el.textContent = msg; el.style.display = ''; }

function _mensajeError(code) {
    const map = {
        'auth/email-already-in-use':    'Este correo ya está registrado.',
        'auth/invalid-email':           'El correo no es válido.',
        'auth/weak-password':           'La contraseña es demasiado débil.',
        'auth/user-not-found':          'No existe ninguna cuenta con ese correo.',
        'auth/wrong-password':          'Contraseña incorrecta.',
        'auth/too-many-requests':       'Demasiados intentos. Espera un momento.',
        'auth/network-request-failed':  'Error de red. Comprueba tu conexión.'
    };
    return map[code] || 'Ha ocurrido un error. Inténtalo de nuevo.';
}
