Mines & Monarch — Configuración de pruebas y despliegue

Instrucciones para probar localmente y desplegar el sitio estático.

Pruebas locales

- Usando Python (sin instalar nada extra):

```powershell
python -m http.server 8000
# Abrir http://localhost:8000/Territorios/Territorios.html
```

- Usando Node (con `live-server`):

```powershell
npm install
npm start
# Abrir http://localhost:8000/Territorios/Territorios.html
```

Despliegue

- Netlify: subir el repositorio y usar la carpeta raíz como "publish directory". El archivo `_redirects` asegura que las rutas del SPA resuelvan a `index.html`.

- Vercel: el fichero `vercel.json` ya incluye una regla de rewrite para servir `index.html` en rutas de cliente.

- GitHub Pages: subir a la rama `gh-pages` o configurar Pages desde la rama `main` con la carpeta raíz.

Archivos añadidos

- `package.json` — scripts para `start` y `serve-python`.
- `_redirects` — para Netlify (redirigir todo a `index.html`).
- `vercel.json` — reglas para Vercel.
- `web.config` — reglas de rewrite para IIS.

Notas

- Si usas Firebase en otras páginas, revisa los archivos listados en `Territorios` para mantenerlos sin cambios o migrarlos a JSON si lo deseas.
