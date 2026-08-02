/* ============================================================
   cuenta-modal.js – Mines & Monarchs · Modal de Cuenta
   Implementación: vinculación `usuarios` ↔ `verificaciones`
   - Guarda datos de personaje en `verificaciones/{discordId}`
   - Guarda en `usuarios/{uid}` solo la referencia `discordId`
   - Al abrir modal combina `usuarios` + `verificaciones` para mostrar
   ============================================================ */

import { initializeApp }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth,
         signInWithEmailAndPassword,
         createUserWithEmailAndPassword,
         onAuthStateChanged,
         signOut }         from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore,
         doc, setDoc, getDoc,
         runTransaction, getDocs, collection, query, where }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

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

const ROL = { admin: 'admin', escriba: 'escriba', ciudadano: 'ciudadano' };

const RAZAS = { Humano:"Humano", Elfo:"Elfo", Goblin:"Goblin", Enano:"Enano", Demonio:"Demonio", Sirena:"Sirena", Valquiria:"Valquiria", Hada:"Hada", Ogro:"Ogro", Revenant:"Revenant" };
const CLASES = { magoender:"Mago del Ender", magoelectrico:"Mago Eléctrico", magosangre:"Mago de Sangre", magohelado:"Mago Helado", magoinvocador:"Mago Invocador", magofuego:"Mago de Fuego", magoeldritch:"Mago del Eldritch", magoViento:"Mago de Viento", magotierra:"Mago de Tierra", support:"Support", magoBendito:"Mago Bendito", tanque:"Tanque", ingeniero:"Ingeniero", guerrero:"Guerrero", carterista:"Carterista", soldadoDorado:"Soldado Dorado", guerreroInfernal:"Guerrero Infernal", tritonisa:"Tritonisa", guerreroBendito:"Guerrero Bendito", berserker:"Berserker", bestiaSalvaje:"Bestia Salvaje" };
const CLASES_POR_RAZA = { humano: ['guerrero','tanque','ingeniero'], elfo: ['magohelado','magoelectrico','magotierra','support'], goblin: ['carterista','soldadoDorado','ingeniero'], enano: ['guerrero','tanque','ingeniero'], demonio: ['guerreroInfernal','magosangre','magofuego'], sirena: ['magohelado','tritonisa','magotierra'], valquiria: ['guerreroBendito','magoViento','magoBendito','magoelectrico'], hada: ['carterista','magoViento','support'], ogro: ['berserker','bestiaSalvaje','tanque'], revenant: ['magoeldritch','magoinvocador','magosangre','magoender'] };
const TRABAJOS = { inutilerrante:"Inútil", herrero:"Herrero", clerigo:"Clérigo", minero:"Minero", agricultor:"Agricultor", granjero:"Granjero", cocinero:"Cocinero" };

const opts = obj => Object.entries(obj).map(([v,l]) => `<option value="${v}">${l}</option>`).join('');

let _googleUser = null;
let _creandoPersonaje = false;

function redirigirSegunRol(rol, uid) {
    if (rol === 'admin') window.location.href = `/minesandmonarchs-web/Admin/admin.html`;
    else window.location.href = `/minesandmonarchs-web/Mundo/Personajes/personaje.html?uid=${uid}`;
}

function inyectar() {
        document.body.insertAdjacentHTML('beforeend', `
        <div class="cm-overlay" id="cmOverlay">
            <div class="cm-box">
                <div class="cm-header">
                    <div class="cm-header-deco"></div>
                    <button class="cm-close" id="cmClose">✕</button>
                    <h2 class="cm-titulo" id="cmTitulo">Cuenta</h2>
                    <p class="cm-subtitulo" id="cmSub">Accede con tu usuario y contraseña</p>
                </div>

                <div class="cm-body" id="vistaGoogle">
                    <div class="cm-opciones">
                        <div class="cm-field"><label class="cm-label">Email</label><input class="cm-input" type="email" id="loginEmail" placeholder="tu@ejemplo.com"></div>
                        <div class="cm-field"><label class="cm-label">Contraseña</label><input class="cm-input" type="password" id="loginPassword" placeholder="Contraseña"></div>
                        <div style="display:flex;gap:8px;margin-top:8px;"><button class="cm-opcion-btn" id="optLogin">Entrar</button><button class="cm-opcion-btn secundario" id="optVolver">← Volver</button></div>
                    </div>
                    <p class="cm-error" id="loginError"></p>
                </div>

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
            <select class="cm-select" id="pRaza"><option value="" disabled selected>Selecciona…</option>${opts(RAZAS)}</select>
          </div>
          <div class="cm-row">
            <div class="cm-field">
              <label class="cm-label">Clase <span>*</span></label>
              <select class="cm-select" id="pClase" disabled><option value="" disabled selected>Selecciona primero la raza…</option></select>
            </div>
            <div class="cm-field">
              <label class="cm-label">Trabajo <span>*</span></label>
              <select class="cm-select" id="pTrabajo"><option value="" disabled selected>Selecciona…</option>${opts(TRABAJOS)}</select>
            </div>
          </div>
          <p class="cm-error" id="pError"></p>
          <div class="cm-form-footer">
            <button type="button" class="cm-btn-volver" id="pCancelar">Cancelar</button>
            <button type="button" class="cm-btn-submit" id="pGuardar">⚜ Guardar</button>
          </div>
        </div>

        <div class="cm-exito" id="cmExito">
          <div class="cm-exito-icono">⚜</div>
          <h3 id="exitoTitulo">¡Hecho!</h3>
          <p id="exitoTexto"></p>
        </div>
      </div>
    </div>`);
}

function mostrar(id, titulo, sub) {
    ['vistaGoogle','vistaPersonaje','cmExito'].forEach(v => {
        const el = document.getElementById(v); if (!el) return;
        if (v === 'cmExito') el.classList.toggle('visible', v === id);
        else el.style.display = v === id ? '' : 'none';
    });
    if (titulo !== undefined) document.getElementById('cmTitulo').textContent = titulo;
    if (sub !== undefined) document.getElementById('cmSub').textContent = sub;
}

function setError(id, msg) {
    const el = document.getElementById(id); if (!el) return; el.textContent = msg; el.style.display = msg ? '' : 'none';
}

function esErrorPermisosFirestore(err) {
    const texto = `${err?.code || ''} ${err?.message || ''}`.toLowerCase();
    return err?.code === 'permission-denied' || err?.code === 'unavailable' || texto.includes('permission') || texto.includes('insufficient permissions');
}

function guardarPersonajeLocalmente(datos) {
    try { const prev = JSON.parse(localStorage.getItem('mm_personajes_pendientes') || '[]'); prev.push(datos); localStorage.setItem('mm_personajes_pendientes', JSON.stringify(prev)); } catch (_) {}
}

async function nextId() {
    const ref = doc(db, 'meta', 'contador_usuarios'); let id;
    await runTransaction(db, async tx => { const snap = await tx.get(ref); id = snap.exists() ? snap.data().total + 1 : 1; tx.set(ref, { total: id }); });
    return id;
}

function guardarSesion(datos) {
    sessionStorage.setItem('mm_usuario', JSON.stringify(datos));
    const li = document.getElementById('nav-cuenta-li');
    if (!li) return;
    if (!li.classList.contains('dropdown')) {
        const esAdmin = datos.rol === 'admin';
        li.classList.add('dropdown');
        li.innerHTML = `
            <button class="dropbtn" style="font-weight:bold;color:#ffd700;display:flex;align-items:center;gap:6px">⚜ ${datos.nombreRol}</button>
            <ul class="dropdown-content" style="right:0;left:auto;min-width:160px;">
                <li><a href="/minesandmonarchs-web/Mundo/Personajes/personaje.html?uid=${datos.uid}">Mi cartilla</a></li>
                ${esAdmin ? `<li><a href="/minesandmonarchs-web/Admin/admin.html" style="color:#ffd700">⚙️ Panel Admin</a></li>` : ''}
                <li><a href="#" id="btnCerrarSesion">Cerrar sesión</a></li>
            </ul>`;
        li.querySelector('.dropbtn').addEventListener('click', e => { e.preventDefault(); li.querySelector('.dropdown-content').classList.toggle('show'); });
        document.getElementById('btnCerrarSesion').addEventListener('click', async e => { e.preventDefault(); await signOut(auth); sessionStorage.removeItem('mm_usuario'); location.reload(); });
    }
}

async function fetchVerificacionByDiscordIdOrTag(identifier) {
    if (!identifier) return null;
    try { const ref = doc(db, 'verificaciones', identifier); const snap = await getDoc(ref); if (snap.exists()) return snap.data(); } catch (_) {}
    try { const q = query(collection(db, 'verificaciones'), where('discordTag', '==', identifier)); const snaps = await getDocs(q); if (!snaps.empty) return snaps.docs[0].data(); } catch (_) {}
    return null;
}

async function loginManual() {
    setError('loginError', '');
    const email = (document.getElementById('loginEmail')?.value || '').trim();
    const password = (document.getElementById('loginPassword')?.value || '').trim();
    if (!email || !password) return setError('loginError', 'Introduce email y contraseña.');
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user; _googleUser = user; _creandoPersonaje = false;
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        if (snap.exists()) {
            const datos = snap.data();
            let nombreRolGuardado = datos.personaje?.nombreRol || null;
            if (!nombreRolGuardado && (datos.discordId || datos.discord)) {
                const verif = await fetchVerificacionByDiscordIdOrTag(datos.discordId || datos.discord);
                if (verif && verif.nombreRol) nombreRolGuardado = verif.nombreRol;
            }
            if (nombreRolGuardado) {
                guardarSesion({ uid: user.uid, nombreRol: nombreRolGuardado, id: datos.id, rol: datos.rol });
                document.getElementById('exitoTitulo').textContent = `¡Bienvenido, ${nombreRolGuardado}!`;
                document.getElementById('exitoTexto').textContent  = datos.rol === 'admin' ? 'Redirigiendo al panel de administración…' : 'Sesión iniciada correctamente.';
                mostrar('cmExito'); setTimeout(() => redirigirSegunRol(datos.rol, user.uid), 1800);
            } else {
                // User exists but no personaje/verif -> show creation
                _creandoPersonaje = true;
                mostrar('vistaPersonaje', 'Crea tu personaje', 'Completa tu ficha');
            }
        } else {
            // No usuarios doc — treat as new user flow
            _creandoPersonaje = true;
            mostrar('vistaPersonaje', 'Crea tu personaje', 'Completa tu ficha');
        }
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            // register new user
            try {
                const reg = await createUserWithEmailAndPassword(auth, email, password);
                const user = reg.user; _googleUser = user; _creandoPersonaje = true;
                mostrar('vistaPersonaje', 'Crea tu personaje', 'Completa tu ficha');
                return;
            } catch (regErr) {
                setError('loginError', regErr.message || 'Error al crear la cuenta.');
                console.error(regErr);
                return;
            }
        }
        setError('loginError', err.message || errMsg(err.code));
        console.error(err);
    }
}

async function guardarPersonaje() {
    const discord   = document.getElementById('pDiscord').value.trim();
    const nombreMC  = document.getElementById('pNombreMC').value.trim();
    const nombreRol = document.getElementById('pNombreRol').value.trim();
    const raza      = document.getElementById('pRaza').value;
    const clase     = document.getElementById('pClase').value;
    const trabajo   = document.getElementById('pTrabajo').value;
    if (!discord) return setError('pError', 'El nombre de Discord es obligatorio.');
    if (!nombreMC) return setError('pError', 'El nombre de Minecraft es obligatorio.');
    if (!nombreRol) return setError('pError', 'El nombre de rol es obligatorio.');
    if (!raza || !clase || !trabajo) return setError('pError', 'Selecciona raza, clase y trabajo.');
    setError('pError', '');
    const user = auth.currentUser || _googleUser; if (!user) { setError('pError', 'No hay sesión activa. Vuelve a iniciar sesión.'); return; }
    const uid = user.uid; const rol = nombreRol.toLowerCase() === 'skyroft' ? ROL.admin : ROL.ciudadano;
    const verifId = discord.replace(/[#\s]/g, '_');
    try {
        const id = await nextId();
        await setDoc(doc(db, 'verificaciones', verifId), { discordId: verifId, discordTag: discord, nombreMinecraft: nombreMC, nombreRol, raza, clase, trabajo, verificadoEn: new Date() });
        await setDoc(doc(db, 'usuarios', uid), { id, email: user.email, discord, discordId: verifId, rol, creadoEn: new Date() }, { merge: true });
        _creandoPersonaje = false; _googleUser = null; sessionStorage.removeItem('mm_uid_pendiente'); guardarSesion({ uid, nombreRol, id, rol });
        document.getElementById('exitoTitulo').textContent = '¡Bienvenido a Belmaria!';
        document.getElementById('exitoTexto').textContent  = `${nombreRol} ha llegado al mundo.`; mostrar('cmExito'); setTimeout(() => redirigirSegunRol(rol, uid), 2000);
    } catch (err) {
        if (esErrorPermisosFirestore(err)) {
            guardarPersonajeLocalmente({ uid, email: user.email, discord, rol, creadoEn: new Date().toISOString(), personaje: { nombreRol, nombreMC, raza, clase, trabajo }, guardadoLocal: true, error: err?.message || '' });
            setError('pError', 'No se pudo guardar en Firestore por permisos. El personaje quedó guardado localmente.'); console.warn('Firestore permission denied', err); return;
        }
        setError('pError', 'Error al guardar. Inténtalo de nuevo.'); console.error(err);
    }
}

async function cancelarPersonaje() { _creandoPersonaje = false; const user = _googleUser || auth.currentUser; if (user) await signOut(auth); _googleUser = null; sessionStorage.removeItem('mm_usuario'); cerrar(); }

function cerrar() { const user = _googleUser || auth.currentUser; if (user) { getDoc(doc(db, 'usuarios', user.uid)).then(snap => { if (!snap.exists() || !snap.data().personaje) { _creandoPersonaje = false; signOut(auth); sessionStorage.removeItem('mm_usuario'); _googleUser = null; } }); } document.getElementById('cmOverlay').classList.remove('active'); document.body.style.overflow = ''; }

function resetForm() { ['pDiscord','pNombreRol','pNombreMC'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); ['pRaza','pTrabajo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); const pClase = document.getElementById('pClase'); if (pClase) { pClase.innerHTML = '<option value="" disabled selected>Selecciona primero la raza…</option>'; pClase.value = ''; pClase.disabled = true; } setError('loginError', ''); setError('pError', ''); }

window.abrirModalCuenta = async function () {
    resetForm();
    document.getElementById('cmOverlay')?.classList.add('active'); document.body.style.overflow = 'hidden';
    const user = auth.currentUser;
    if (!user) {
        mostrar('vistaGoogle', 'Cuenta', 'Accede con tu usuario y contraseña');
        return;
    }

    try {
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        const datos = snap.exists() ? snap.data() : {};
        // Try to fetch verification
        const idOrTag = datos.discordId || datos.discord || null;
        const verif = idOrTag ? await fetchVerificacionByDiscordIdOrTag(idOrTag) : null;
        // Prefill form from verification (preferred) or usuarios.personaje (legacy)
        const fuente = verif || datos.personaje || {};
        document.getElementById('pDiscord').value = verif?.discordTag || datos.discord || '';
        document.getElementById('pNombreMC').value = verif?.nombreMinecraft || fuente.nombreMC || '';
        document.getElementById('pNombreRol').value = verif?.nombreRol || fuente.nombreRol || '';
        if (verif?.raza || fuente.raza) {
            const r = (verif?.raza || fuente.raza);
            const select = document.getElementById('pRaza'); if (select) { select.value = r; select.dispatchEvent(new Event('change')); }
            setTimeout(() => { const pClase = document.getElementById('pClase'); if (pClase && (verif?.clase || fuente.clase)) pClase.value = verif?.clase || fuente.clase; }, 50);
        }
        if (verif?.trabajo || fuente.trabajo) { const t = verif?.trabajo || fuente.trabajo; const sel = document.getElementById('pTrabajo'); if (sel) sel.value = t; }
        mostrar('vistaPersonaje', 'Tu cuenta', 'Edita tu personaje');
    } catch (err) {
        setError('pError', 'No se pudieron cargar los datos de la cuenta.');
        mostrar('vistaGoogle', 'Cuenta', 'Accede con tu usuario y contraseña');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    inyectar();
    document.getElementById('cmClose').addEventListener('click', cerrar);
    document.getElementById('cmOverlay').addEventListener('click', e => { if (e.target.id === 'cmOverlay') cerrar(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('cmOverlay').classList.contains('active')) cerrar(); });
    const optLoginBtn = document.getElementById('optLogin'); if (optLoginBtn) optLoginBtn.addEventListener('click', loginManual);
    document.getElementById('optVolver').addEventListener('click', cerrar);
    document.getElementById('pCancelar').addEventListener('click', cancelarPersonaje);
    document.getElementById('pGuardar').addEventListener('click', guardarPersonaje);
    document.getElementById('pRaza').addEventListener('change', function () {
        const select = document.getElementById('pClase'); const razaKey = this.value.toLowerCase(); const clases = CLASES_POR_RAZA[razaKey] || [];
        select.innerHTML = '<option value="" disabled selected>Selecciona…</option>' + clases.map(c => `<option value="${c}">${CLASES[c]}</option>`).join(''); select.value = ''; select.disabled = clases.length === 0;
    });

    onAuthStateChanged(auth, async user => {
        if (!user) return;
        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (snap.exists()) {
                const datos = snap.data();
                // prefer personaje.nombreRol, else try verificacion
                let nombreRol = datos.personaje?.nombreRol || null;
                if (!nombreRol && (datos.discordId || datos.discord)) {
                    const verif = await fetchVerificacionByDiscordIdOrTag(datos.discordId || datos.discord);
                    if (verif) nombreRol = verif.nombreRol;
                }
                if (nombreRol) guardarSesion({ uid: user.uid, nombreRol, id: datos.id, rol: datos.rol });
                else if (!_creandoPersonaje) await signOut(auth);
            }
        } catch (_) {}
    });
});

function errMsg(code) { return ({ 'auth/popup-blocked': 'El navegador bloqueó la ventana. Permite popups e inténtalo de nuevo.', 'auth/popup-closed-by-user': '', 'auth/network-request-failed': 'Error de red. Comprueba tu conexión.', 'auth/too-many-requests': 'Demasiados intentos. Espera un momento.', 'auth/unauthorized-domain': 'Dominio no autorizado en Firebase.' })[code] || 'Error al conectar con Google. Inténtalo de nuevo.'; }
