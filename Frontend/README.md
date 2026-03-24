# VRAMI — Frontend

Aplicación web desarrollada con **Angular 20** y **PrimeNG**, que forma parte del proyecto VRAMI. Incluye un sistema de layout completo, páginas de autenticación, dashboard, CRUD y kit de componentes UI.

---

## Requisitos previos

Asegúrate de tener instalado lo siguiente antes de comenzar:

| Herramienta | Versión recomendada |
|-------------|---------------------|
| [Node.js](https://nodejs.org/) | >= 18.x |
| [npm](https://www.npmjs.com/) | >= 9.x |
| [Angular CLI](https://angular.io/cli) | >= 20.x |

Para instalar Angular CLI de forma global:

```bash
npm install -g @angular/cli
```

---

## Instalación

Clona el repositorio (si aún no lo has hecho) y accede a la carpeta del frontend:

```bash
git clone https://github.com/frmolla/TMI-2025-26-VRAMI.git
cd TMI-2025-26-VRAMI/Frontend
```

Instala las dependencias del proyecto:

```bash
npm install
```

---

## Ejecutar el proyecto

### Servidor de desarrollo

Inicia la aplicación en modo desarrollo:

```bash
ng serve -o
```

o con npm:

```bash
npm start
```

Abre el navegador en `http://localhost:4200/`. La aplicación se recargará automáticamente al hacer cambios en los archivos fuente.

### Especificar puerto personalizado

```bash
ng serve --port 4300
```

### Abrir el navegador automáticamente

```bash
ng serve --open
```

---

## Compilar el proyecto

### Build de producción

```bash
ng build
```

o con npm:

```bash
npm run build
```

Los archivos compilados se generan en el directorio `dist/`. El build de producción optimiza la aplicación en rendimiento y tamaño.

### Build en modo desarrollo con observación de cambios

```bash
npm run watch
```

---

## Generación de código (scaffolding)

Angular CLI incluye herramientas para generar código automáticamente:

```bash
# Generar un componente
ng generate component nombre-componente
ng g c nombre-componente          # forma abreviada

# Generar un servicio
ng generate service nombre-servicio
ng g s nombre-servicio

# Generar un módulo
ng generate module nombre-modulo
ng g m nombre-modulo

# Generar una directiva
ng generate directive nombre-directiva
ng g d nombre-directiva

# Generar un pipe
ng generate pipe nombre-pipe
ng g p nombre-pipe

# Generar una guard (protección de rutas)
ng generate guard nombre-guard
ng g g nombre-guard

# Ver todos los esquemas disponibles
ng generate --help
```

---

## Pruebas

### Pruebas unitarias

Ejecuta las pruebas unitarias con [Karma](https://karma-runner.github.io):

```bash
ng test
```

o con npm:

```bash
npm test
```

### Pruebas end-to-end (e2e)

Para pruebas e2e, primero debes añadir un framework de testing (p.ej. Cypress o Playwright):

```bash
ng e2e
```

Angular CLI no incluye un framework e2e por defecto. Puedes elegir el que mejor se adapte a tus necesidades.

---


## Formateo de código

El proyecto usa **Prettier** para mantener un estilo de código consistente:

```bash
npm run format
```

---

## Estructura del proyecto

```
Frontend/
├── src/
│   ├── app/
│   │   ├── layout/          # Componentes del layout (topbar, sidebar, menú...)
│   │   ├── pages/           # Páginas de la aplicación
│   │   │   ├── auth/        # Login, registro, recuperación de contraseña...
│   │   │   ├── dashboard/   # Dashboard principal
│   │   │   ├── crud/        # Ejemplo de CRUD
│   │   │   └── uikit/       # Demos de componentes UI
│   │   └── types/           # Interfaces y tipos TypeScript
│   └── assets/              # Estilos SCSS y assets estáticos
├── package.json
└── angular.json
```

---

## Recursos adicionales

- [Documentación oficial de Angular](https://angular.dev/)
- [Angular CLI — Referencia de comandos](https://angular.dev/tools/cli)
- [PrimeNG — Componentes UI](https://primeng.org/)
- [TailwindCSS](https://tailwindcss.com/)

## Ejecutar desde los Laboratorios

 - Desde el CMD 
 
 - cd TMI-2025-26-VRAMI/Frontend
 - npm intall
 - npm install -g @angular/cli
 - npx ng verion