# TMI-2025-26-VRAMI

Proyecto universitario para la asignatura Tecnologías multimedia e interacción.

Miembros del grupo que han desarrollado el proyecto: 
- Francisco Mollá
- Roberto Narváez
- Francys Paucarima
- Cristhian Cola
- Zhaoyang Qi

El proyecto es compuesto por un **frontend en Angular 20** y un **backend en NestJS 11**. A continuación se describe cómo instalar y ejecutar ambas partes.

---

## Estructura del repositorio

```
TMI-2025-26-VRAMI/
├── Frontend/        # Aplicación Angular (PrimeNG + TailwindCSS)
└── Backend/
    └── vrami-backend/   # API REST con NestJS + Swagger
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| [Node.js](https://nodejs.org/) | >= 18.x |
| [npm](https://www.npmjs.com/) | >= 9.x |
| [Angular CLI](https://angular.io/cli) | >= 20.x |
| [NestJS CLI](https://docs.nestjs.com/cli/overview) | >= 11.x |

Instala las CLIs globalmente si aún no las tienes:

```bash
npm install -g @angular/cli
npm install -g @nestjs/cli
```

```bash
### Instalación de FFmpeg:
### REINICIAR VISUAL DESPUES DE INSTALAR

winget install Gyan.FFmpeg
```
---

## Frontend — Angular

```bash
# 1. Acceder a la carpeta
cd Frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
ng serve
# o bien:
npm start
```

La aplicación estará disponible en `http://localhost:4200/`.

### Comandos más usados

```bash
ng serve                     # Servidor de desarrollo
ng serve --port 4300         # Cambiar puerto
ng serve --open              # Abrir navegador automáticamente
ng build                     # Build de producción (genera dist/)
npm run watch                # Build en modo desarrollo con hot-reload
ng test                      # Pruebas unitarias (Karma)
ng lint                      # Análisis de código
ng generate component <name> # Generar componente
ng generate service <name>   # Generar servicio
```

---

## Backend — NestJS

```bash
# 1. Acceder a la carpeta
cd Backend/vrami-backend

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env (OBLIGATORIO)
```

### ⚠️ Configuración del archivo `.env`

Crea un archivo llamado **`.env`** en la carpeta `Backend/vrami-backend/` con el siguiente contenido:

```env
NODE_ENV=development
PORT=3000
DATABASE_PATH=./vrami.db
JWT_SECRET=vrami_secret_key_change_in_production_12345
JWT_EXPIRE=24h
```

> **IMPORTANTE:** Sin este archivo, el Backend NO arrancará correctamente.

```bash
# 4. Iniciar servidor en modo desarrollo
npm run start:dev
```

La API estará disponible en `http://localhost:3000/`.  
La documentación Swagger se encuentra en `http://localhost:3000/api`.

---

## Base de Datos — SQLite

El proyecto utiliza **SQLite** como base de datos. **No necesitas instalar nada**, el archivo se genera automáticamente.

- Al ejecutar el Backend por primera vez, se crea el archivo `vrami.db` en `Backend/vrami-backend/`.
- Este archivo contiene las tablas `users` y `projects`.
- Cada desarrollador tendrá su propia BD local (no se sube a Git).
- La primera vez no habrá usuarios. Regístrate desde la pantalla de registro en el Frontend.

### Endpoints de Autenticación (sin token)

| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/auth/register` | Registrar un usuario nuevo |
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/guest` | Entrar como invitado |

### Endpoints de Proyectos (requiere token JWT)

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/projects` | Obtener mis proyectos |
| GET | `/projects/:id` | Obtener un proyecto por ID |
| POST | `/projects` | Crear un nuevo proyecto |
| DELETE | `/projects/:id` | Eliminar un proyecto |
| POST | `/projects/:id/video` | Subir y procesar video |

> **Nota:** Los endpoints de proyectos requieren autenticación. El Frontend envía el token JWT automáticamente en cada petición.

### Comandos más usados

```bash
npm run start            # Iniciar en modo normal
npm run start:dev        # Iniciar con hot-reload (desarrollo)
npm run start:debug      # Iniciar con debugger activo
npm run start:prod       # Iniciar desde el build compilado
npm run build            # Compilar el proyecto (genera dist/)
npm run lint             # Análisis y corrección de código
npm run test             # Pruebas unitarias (Jest)
npm run test:watch       # Pruebas en modo watch
npm run test:cov         # Pruebas con cobertura
npm run test:e2e         # Pruebas end-to-end
npm run format           # Formatear código con Prettier
```

---

## Ejecutar ambos servicios simultáneamente

Abre **dos terminales** y ejecuta en cada una:

**Terminal 1 — Frontend:**
```bash
cd Frontend
npm install
ng serve
```

**Terminal 2 — Backend:**
```bash
cd Backend/vrami-backend
npm install
npm run start:dev
```

| Servicio  | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:4200            |
| Backend   | http://localhost:3000            |
| Swagger   | http://localhost:3000/api        |
