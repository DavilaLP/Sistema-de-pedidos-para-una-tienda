# Universidad Tecnológica del Perú (UTP)
## Desarrollo Web Integrado — Proyecto Integrador
### Avance de Proyecto Final 3 (APF3) — Semana 15

---

### 👥 Integrantes del Equipo
1. **Davila Guerra, Duvan Isai** — Participación: **100%**
2. **Farfan Reyes, Erick Jean Piere** — Participación: **100%**
3. **Ticona Ayqui, Evelyn** — Participación: **100%**
4. **Lozano Peres, Andres** — Participación: **100%**

---

## 1. Problema y Contexto de Negocio

### 1.1. Contexto del Negocio
En el comercio minorista contemporáneo, las tiendas comerciales pequeñas y medianas (en particular aquellas dedicadas a la venta de componentes y accesorios tecnológicos) manejan un catálogo dinámico con alta rotación de existencias. En este tipo de negocios, el flujo diario exige una estrecha sincronización entre los productos almacenados físicamente y la recepción de pedidos solicitados por los clientes a través de diversos canales de atención.

### 1.2. Planteamiento del Problema (Necesidad Concreta que Resuelve)
Tradicionalmente, la administración de inventario y la recepción de pedidos en este segmento de negocios se gestiona mediante métodos manuales, libretas de notas o archivos de cálculo desconectados entre sí. Esta falta de automatización genera problemáticas críticas:
* **Sobreventa y quiebres de inventario:** Se confirman pedidos de artículos agotados por no contar con actualización en tiempo real, lo que deriva en cancelaciones forzosas, demoras y pérdida de confianza por parte del cliente.
* **Inconsistencias en cálculos y cobros:** La determinación manual de subtotales e importes finales propicia errores aritméticos en los cobros.
* **Ausencia de trazabilidad y descontrol de devoluciones:** No existe visibilidad inmediata sobre el estado operativo de cada orden (*Pendiente*, *Pagado*, *Cancelado*), y ante una cancelación o anulación, es frecuente olvidar reintegrar las unidades devueltas al inventario disponible.

### 1.3. ¿Quiénes Usan el Sistema? (Actores del Dominio)
El sistema está diseñado para resolver las necesidades operativas de dos actores clave:
* **Administrador / Encargado de Tienda:** Encargado de gestionar el catálogo de productos (altas, consultas, modificaciones de precio y stock, bajas), supervisar el stock disponible y administrar el ciclo de vida de los pedidos realizados (cobro o cancelación con reposición).
* **Cliente de la Tienda:** Usuario que consulta el catálogo disponible y genera solicitudes de compra (pedidos) basadas estrictamente en la disponibilidad real de existencias.

### 1.4. Solución Propuesta y Beneficios Aportados
Para superar estas limitaciones, se implementa una **solución web empresarial desacoplada**, compuesta por un backend robusto en **Spring Boot 3** y una interfaz interactiva de usuario (SPA) construida en **React con Vite**:
* **Reserva atómica y control de existencias:** Valida la disponibilidad en el momento exacto del pedido, descontando el stock automáticamente si hay existencias y rechazando la transacción si es insuficiente (`400 Bad Request`).
* **Cálculo automatizado y precio histórico:** Congela el precio unitario del producto al momento de comprar (`OrderItem`) y liquida el total exacto sin margen de error humano.
* **Trazabilidad y reposición inmediata:** Facilita el cambio de estados del pedido y, en caso de anulación/cancelación, repone de forma automática las cantidades al inventario activo.
* **Arquitectura desacoplada y segura:** Comunicación mediante API REST con autenticación stateless basada en tokens JWT, control de roles (`ADMIN` y `CLIENTE`) y protección contra solicitudes no autorizadas (`401`) o prohibidas (`403`).

---

## 2. Tabla del Stack Tecnológico Completo (Herramientas y Librerías Utilizadas)

Conforme a las directivas del curso y la autorización docente para el uso de **React**, la siguiente tabla resume todas las tecnologías, librerías y dependencias empleadas en el proyecto:

### 2.1. Frontend (Capa de Presentación / SPA)

| Tecnología / Librería | Versión | Tipo / Clasificación | Propósito y Responsabilidad en el Sistema |
| :--- | :---: | :--- | :--- |
| **React** | `19.3.1` | Biblioteca UI Core | Construcción declarativa y modular de la interfaz de usuario basada en componentes reutilizables. |
| **React DOM** | `19.3.1` | Renderizado Web | Renderizado optimizado del árbol de componentes en el DOM virtual y real del navegador. |
| **Vite** | `8.3.5` | Bundler & Dev Server | Herramienta de compilación ultrarrápida, empaquetado de producción y servidor local con *Hot Module Replacement* (HMR). |
| **React Router DOM** | `7.18.5` | Enrutamiento SPA | Gestión de rutas en el cliente (`/login`, `/products`, `/orders`, `/forbidden`), historial y protección de navegación mediante guardias (`PrivateRoute`). |
| **Axios** | `1.21.0` | Cliente HTTP | Consumo de la API REST del backend con interceptores globales para inyección del header `Authorization: Bearer <JWT>` y captura centralizada de errores (400, 401, 403, 404). |
| **Context API (React)** | Nativo | Gestión de Estado Global | Manejo del estado global de autenticación (`AuthContext`): usuario activo, rol, persistencia en `localStorage` y métodos `loginUser` / `logoutUser`. |
| **Vanilla CSS3 Moderno** | Estándar CSS | Diseño y Estilos | Sistema de diseño premium con paleta de colores HSL en modo oscuro, variables CSS globales, modales, alertas flotantes y componentes responsivos sin dependencias externas. |

### 2.2. Backend (Capa de Servicios y Negocio REST)

| Tecnología / Librería | Versión | Tipo / Clasificación | Propósito y Responsabilidad en el Sistema |
| :--- | :---: | :--- | :--- |
| **Java** | `21` (LTS) | Lenguaje & Runtime | Plataforma de ejecución principal del backend empresarial. |
| **Spring Boot** | `3.3.0` | Framework Core | Configuración automática, servidor Tomcat embebido y contenedor de inyección de dependencias. |
| **Spring Web (MVC)** | `3.3.0` | Framework REST | Exposición de controladores RESTful (`@RestController`), negociación de contenido JSON y manejo de rutas URI. |
| **Spring Security** | `6.x` | Seguridad & Permisos | Cadena de filtros de seguridad HTTP, control de acceso basado en roles (`ROLE_ADMIN`, `ROLE_CLIENTE`) y configuración de CORS. |
| **JJWT (io.jsonwebtoken)** | `0.12.6` | Seguridad / Tokens | Generación, firmado criptográfico HMAC-SHA256 y parseo/validación de tokens JWT (Bearer). |
| **Jakarta Validation** | `3.0` | Validación de Datos | Validación declarativa de datos de entrada en endpoints (`@Valid`, `@NotBlank`, `@Positive`, `@Min`). |
| **Spring Data JPA** | `3.3.0` | Persistencia / ORM | Abstracción de acceso a datos mediante `JpaRepository`, consultas JPQL y gestión de transacciones atómicas (`@Transactional`). |
| **Hibernate Core** | `6.5` | Motor ORM | Mapeo objeto-relacional entre entidades Java (`Product`, `Order`, `OrderItem`, `User`) y tablas SQL relacionales. |
| **Lombok** | `1.18.38` | Productividad / Utilidad | Reducción de código boilerplate mediante anotaciones (`@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`). |

### 2.3. Base de Datos, Persistencia y Pruebas

| Herramienta / Driver | Versión | Tipo / Clasificación | Propósito y Responsabilidad en el Sistema |
| :--- | :---: | :--- | :--- |
| **MySQL Server** | `8.0+` | SGBD Relacional | Almacenamiento persistente en producción/desarrollo de las tablas `products`, `orders`, `order_items` y `users`. |
| **MySQL Connector/J** | `8.3.0` | Driver JDBC | Comunicación y ejecución de consultas SQL entre Spring Boot y el servidor MySQL local. |
| **H2 Database** | `2.2.x` | BD en Memoria | Aislamiento completo de pruebas automatizadas en memoria sin alterar los registros reales de MySQL. |
| **JUnit 5 & Mockito** | `5.10` / `5.11` | Testing Automatizado | Suite de 32 pruebas unitarias y de integración para validar reglas de negocio, transacciones y seguridad. |
| **Spring Test / MockMvc** | `3.3.0` | Pruebas de Integración | Simulación de llamadas HTTP a los controladores REST para verificación de contratos y respuestas JSON. |
| **Postman & Newman** | `v10+` / `v6+` | Suite de Pruebas API | Colección de 15 solicitudes y 30 aserciones automatizadas para pruebas de regresión y códigos HTTP (200, 201, 400, 403, 404). |

---

## 3. Justificación de la Arquitectura y Elección del Frontend

Para cumplir con las metas del **Avance de Proyecto Final 3 (APF3)**, se optó por una arquitectura desacoplada Frontend-Backend:
1. **Separación de Responsabilidades:** El backend opera de forma 100% *stateless* (sin sesiones en servidor), exponiendo únicamente recursos JSON. El frontend gestiona su propio estado de sesión mediante el token JWT almacenado de forma segura en el cliente.
2. **Eficiencia y Mantenibilidad:** La elección de React con Vite proporciona tiempos de recarga en caliente (HMR) casi instantáneos y un empaquetado optimizado, cumpliendo cabalmente los criterios de componentes desacoplados, rutas protegidas y consumo asíncrono de APIs solicitados en la rúbrica.
3. **Control de Acceso End-to-End:** Tanto en el cliente (mediante `PrivateRoute` y rutas protegidas) como en el servidor (a través de `SecurityConfig` y `JwtAuthFilter`), se garantiza que un usuario con rol `CLIENTE` no pueda ejecutar acciones administrativas (como alta/baja de productos o consulta general de pedidos), arrojando el correspondiente código HTTP **403 Forbidden**.
