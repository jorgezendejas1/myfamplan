# Calendario - Google Calendar Clone

Una aplicación de calendario completa inspirada en Google Calendar, construida con React, TypeScript y Tailwind CSS.

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🔧 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# API de Gemini para el chatbot (opcional)
VITE_GEMINI_API_KEY=tu_api_key_aqui

# Supabase (auto-configurado por Lovable Cloud)
VITE_SUPABASE_URL=auto_configurado
VITE_SUPABASE_PUBLISHABLE_KEY=auto_configurado
```

## 📖 Manual de Usuario

### Vistas del Calendario

| Vista | Descripción | Atajo |
|-------|-------------|-------|
| **Mes** | Vista mensual con todos los días | `3` |
| **Semana** | Vista semanal de 7 días | `2` |
| **Día** | Vista detallada de un día | `1` |
| **Agenda** | Lista cronológica de eventos | `4` |

### Crear Eventos

1. **Botón Crear**: Haz clic en el botón "+" flotante (esquina inferior derecha)
2. **Click en fecha**: En cualquier vista, haz clic en una fecha/hora
3. **Atajo de teclado**: Presiona `C` para crear un evento rápido

### Tipos de Eventos

- **Evento**: Cita o reunión estándar
- **Tarea**: Elemento con checkbox
- **Recordatorio**: Alerta simple
- **Cumpleaños**: Se repite anualmente

### Recurrencia

Los eventos pueden repetirse:
- Diariamente
- Semanalmente
- Mensualmente
- Anualmente

### Drag & Drop (Arrastrar y Soltar)

En las vistas **Semana** y **Día**:
1. Arrastra un evento desde el icono de agarre (≡)
2. Suéltalo en la nueva hora/día deseado
3. El evento se actualiza automáticamente

### Gestión de Calendarios

- Crea múltiples calendarios con diferentes colores
- Muestra/oculta calendarios con el checkbox
- Edita nombre y color haciendo clic en el calendario

### Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `J` | Siguiente período |
| `K` | Período anterior |
| `T` | Ir a hoy |
| `C` | Crear evento |
| `1` | Vista día |
| `2` | Vista semana |
| `3` | Vista mes |
| `4` | Vista agenda |
| `?` | Mostrar ayuda |

### Importar/Exportar

- **Exportar**: Configuración → Exportar (genera archivo .ics)
- **Importar**: Configuración → Importar → Seleccionar archivo .ics

Compatible con Google Calendar, Outlook, Apple Calendar, etc.

### Papelera

Los eventos eliminados van a la papelera por 30 días:
- Restaurar: Recupera el evento
- Eliminar permanentemente: Borra sin recuperación
- Vaciar papelera: Elimina todo permanentemente

### Temas

- **Claro**: Fondo blanco
- **Oscuro**: Fondo negro
- **Sistema**: Sigue la preferencia del sistema operativo

### Chatbot Asistente

El icono de chat (💬) abre un asistente que puede:
- Responder preguntas sobre el calendario
- Ayudarte a crear eventos
- Dar sugerencias de organización

## 📱 Responsividad

La aplicación es completamente responsive:

| Dispositivo | Comportamiento |
|-------------|----------------|
| **Desktop** (>1024px) | Sidebar fijo visible |
| **Tablet** (768-1024px) | Sidebar colapsable |
| **Móvil** (<768px) | Drawer deslizable desde el menú |

### Breakpoints

```
- sm: 640px
- md: 768px  
- lg: 1024px
- xl: 1280px
```

## 🏗️ Arquitectura

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes shadcn/ui
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── MonthView.tsx
│   ├── WeekView.tsx
│   ├── DayView.tsx
│   ├── AgendaView.tsx
│   ├── EventModal.tsx
│   └── ...
├── hooks/              # Custom hooks
│   ├── useDragAndDrop.ts
│   ├── useOnboarding.ts
│   └── use-mobile.tsx
├── services/           # Servicios
│   ├── storage.ts      # Persistencia localStorage
│   └── googleCalendarService.ts
├── utils/              # Utilidades
│   ├── dateUtils.ts    # Funciones de fecha
│   └── icsUtils.ts     # Parser/generador ICS
├── mocks/              # Mocks para desarrollo
│   └── chatbot.ts
├── types.ts            # Tipos TypeScript
├── constants.ts        # Constantes
└── App.tsx             # Componente principal
```

## 🔌 Notas de Integración

### Conectar Gemini AI en Producción

1. Obtén una API key de [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Configura la variable de entorno:
   ```env
   VITE_GEMINI_API_KEY=tu_api_key_real
   ```

3. En `src/mocks/chatbot.ts`, el código ya está preparado para detectar la key:
   ```typescript
   const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
   
   if (API_KEY) {
     // Usar API real de Gemini
   } else {
     // Usar respuestas mock
   }
   ```

### Sincronización con Backend

Para habilitar sincronización multi-dispositivo:

1. El proyecto ya tiene Lovable Cloud habilitado
2. Crea tablas para eventos y calendarios
3. Implementa sync bidireccional

## 📄 Licencia

MIT License - Siéntete libre de usar y modificar.
