# Grayola - Plataforma de Gestión de Proyectos

Grayola es una aplicación web para la gestión de proyectos de diseño que permite a clientes, diseñadores y gestores de proyectos colaborar en un mismo espacio.

## Características

- Autenticación de usuarios con diferentes roles (cliente, diseñador, gestor de proyectos)
- Creación y gestión de proyectos
- Carga y descarga de archivos
- Perfiles de usuario personalizables
- Interfaz responsiva y moderna

## Tecnologías utilizadas

- Next.js 15
- TypeScript
- Supabase (autenticación y base de datos)
- Tailwind CSS
- shadcn/ui

## Requisitos previos

- Node.js 18.x o superior
- npm o yarn
- Cuenta en Supabase

## Instalación

1. Clona este repositorio:

```bash
git clone https://github.com/IgnacioIbaigorria/grayola.git
cd grayola
```
2. Instala las dependencias:
```bash
npm install
# o
yarn install
```
3. Crea un archivo `.env.local` en la raíz del proyecto y agrega las variables de entorno necesarias:
```bash
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
```
## Configuración de Supabase
1. Crea un nuevo proyecto en Supabase
2. Ejecuta las siguientes consultas SQL para crear las tablas necesarias:
```sql
-- Tabla de perfiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  role TEXT CHECK (role IN ('client', 'designer', 'project_manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proyectos
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES profiles(id),
  designer_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de archivos de proyecto
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
3. Configura el almacenamiento en Supabase:
   - Crea un nuevo bucket llamado project-files
   - Establece las políticas de acceso adecuadas

## Ejecución en desarrollo
Para iniciar el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
```
La aplicación estará disponible en http://localhost:3000.

## Construcción para producción
Para construir la aplicación para producción:

Para iniciar la versión de producción:

## Estructura del proyecto
```plaintext
src/
├── app/                  # Rutas de la aplicación
│   ├── (auth)/           # Rutas de autenticación
│   └── (dashboard)/      # Rutas del dashboard
├── components/           # Componentes reutilizables
│   └── ui/               # Componentes de UI
├── lib/                  # Utilidades y configuraciones
└── types/                # Definiciones de tipos
```

Este README proporciona una guía clara y personal para ejecutar tu proyecto localmente, con instrucciones detalladas sobre la configuración de Supabase y la estructura del proyecto. Incluye secciones sobre tecnologías utilizadas, requisitos previos, instalación y ejecución, lo que facilita a cualquier desarrollador entender y trabajar con tu código.