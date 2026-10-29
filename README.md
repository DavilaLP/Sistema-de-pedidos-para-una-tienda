# 📦 Sistema de Gestión de Inventario y Pedidos para una Tienda

Este proyecto es una solución web empresarial desarrollada con **Spring Boot 3 (Java 21)** en el backend y **React 19 + Vite** en el frontend, diseñada para gestionar de forma automatizada y precisa el **catálogo de inventario** de una tienda y el **flujo completo de pedidos de compra**. Corresponde al avance **APF3 (Semana 15)** del curso Desarrollo Web Integrado (UTP).

### 👥 Integrantes del Equipo
* **Davila Guerra, Duvan Isai** — Participación: **100%**
* **Farfan Reyes, Erick Jean Piere** — Participación: **100%**
* **Ticona Ayqui, Evelyn** — Participación: **100%**
* **Lozano Peres, Andres** — Participación: **100%**

---

## 🎯 ¿De qué trata el Sistema de Inventario y Pedidos?

El sistema es el núcleo operativo de una tienda que comercializa productos tecnológicos. Su objetivo principal es resolver la desconexión habitual entre el **inventario físico en almacén** y las **ventas realizadas a los clientes**, garantizando que nunca se venda un producto sin disponibilidad real.

### 🌟 Funcionalidades Clave del Sistema:

1. **Gestión Integral de Inventario (Catálogo de Productos):**
   * Controla los artículos disponibles, sus precios unitarios y sus niveles de stock en tiempo real.
   * Permite dar de alta nuevos productos, consultar existencias, modificar datos y retirar artículos descatalogados (CRUD completo desde la interfaz web y REST).
   * Semilla de datos inicial precargada en MySQL.

2. **Motor de Reserva y Descuento Automático de Stock:**
   * Al recibir una orden de compra, el sistema valida inmediatamente si cada producto solicitado cuenta con stock suficiente.
   * Si hay stock disponible, **se descuenta automáticamente del inventario** y se genera la orden en estado `PENDIENTE`.
   * Si no hay existencias suficientes de algún producto, la operación se cancela en su totalidad (operación atómica `@Transactional`), protegiendo la integridad del inventario y respondiendo con un error descriptivo (`400 Bad Request`).

3. **Cálculo Transparente de Totales:**
   * Congela el precio unitario del producto en el momento exacto de la compra dentro del detalle del pedido (`OrderItem`).
   * Calcula el importe total sumando los subtotales (`cantidad * precioUnitario`) de cada ítem de forma matemática y sin intervención manual.

4. **Ciclo de Vida del Pedido y Reposición de Inventario:**
   * **Actualización de estado:** Permite transicionar el pedido de `PENDIENTE` a `PAGADO`.
   * **Cancelación con retorno de stock:** Si un cliente o administrador cancela un pedido (`POST /cancel`), el sistema **devuelve automáticamente las unidades de vuelta al inventario**, recuperando el stock disponible de los productos de forma inmediata.

---

## 📝 1. Problema y Contexto de Negocio

### ¿Quién usa el sistema?
* **Administradores de la tienda:** Gestionan el catálogo de productos (CRUD), supervisan pedidos y gestionan pagos y cancelaciones.
* **Clientes de la tienda:** Consultan el catálogo de productos disponibles en tiempo real.

### ¿Qué necesidad resuelve?
En una tienda pequeña o mediana, la gestión manual de pedidos suele ocasionar pérdidas por:
1. **Falta de stock inesperada:** Vender productos que no están disponibles físicamente.
2. **Errores en cálculos:** Errores al calcular los totales e importes de las órdenes de forma manual.
3. **Falta de trazabilidad:** No saber en qué estado se encuentra un pedido (*Pendiente, Pagado, Cancelado*).

Este sistema automatiza estos procesos, descontando stock de manera inmediata al ingresar un pedido, calculando totales de forma transparente y manteniendo estados legibles de cada compra.

---

## 🛠️ 2. Tabla del Stack Tecnológico Completo

A continuación se detalla el inventario completo de herramientas, frameworks y librerías utilizadas en la solución, junto con su versión exacta y responsabilidad:

### 2.1. Frontend (SPA — Single Page Application)

| Tecnología / Librería | Versión | Tipo | Responsabilidad en el Sistema |
| :--- | :---: | :--- | :--- |
| **React** | `19.3.1` | Biblioteca UI | Construcción declarativa y modular de interfaces mediante componentes reactivos. |
| **React DOM** | `19.3.1` | Motor Web | Montaje y renderizado optimizado de componentes en el DOM del navegador. |
| **Vite** | `8.3.5` | Bundler & Servidor Dev | Entorno de desarrollo ultrarrápido con Hot Module Replacement (HMR) y empaquetado optimizado. |
| **React Router DOM** | `7.18.5` | Enrutador SPA | Gestión de rutas (`/login`, `/products`, `/orders`, `/forbidden`) y guardias de autenticación (`PrivateRoute`). |
| **Axios** | `1.21.0` | Cliente HTTP | Peticiones asíncronas REST, inyección automática de cabecera `Authorization: Bearer <token>` y captura centralizada de errores (400, 401, 403, 404). |
| **Context API (React)** | Nativo | Gestión de Estado | Manejo global del estado de sesión (`AuthContext`), almacenamiento del JWT en `localStorage` y métodos de login/logout. |
| **Vanilla CSS Moderno** | Estándar CSS3 | Estilos y Diseño | Sistema visual completo en modo oscuro, variables globales HSL, efectos de cristal (glassmorphism), modales y alertas reactivas. |

### 2.2. Backend (API REST Empresarial)

| Tecnología / Librería | Versión | Tipo | Responsabilidad en el Sistema |
| :--- | :---: | :--- | :--- |
| **Java** | `21` (LTS) | Lenguaje Base | Plataforma de programación y compilación del backend. |
| **Spring Boot** | `3.3.0` | Framework Core | Servidor Tomcat embebido, inyección de dependencias y configuración automática. |
| **Spring Web (MVC)** | `3.3.0` | Framework Web | Controladores RESTful (`@RestController`), endpoints JSON y negociación HTTP. |
| **Spring Security** | `6.x` | Seguridad | Filtro sin estado (stateless), autorización por roles (`ADMIN`, `CLIENTE`) y configuración CORS para `localhost:5173`. |
| **JJWT (io.jsonwebtoken)** | `0.12.6` | Seguridad JWT | Emisión, firma criptográfica HMAC-SHA256 y verificación de tokens Bearer. |
| **Jakarta Validation** | `3.0` | Validación | Restricciones de validación sobre DTOs (`@NotBlank`, `@Positive`, `@Min`). |
| **Spring Data JPA** | `3.3.0` | Persistencia / ORM | Repositorios (`JpaRepository`), transacciones atómicas (`@Transactional`) y consultas JPQL optimizadas (`LEFT JOIN FETCH`). |
| **Hibernate Core** | `6.5` | Motor ORM | Mapeo relacional de entidades (`Product`, `Order`, `OrderItem`, `User`) a tablas MySQL. |
| **Lombok** | `1.18.38` | Utilidad de Código | Generación automática de getters, setters, constructores y builders. |

### 2.3. Persistencia, Testing y Herramientas

| Herramienta | Versión | Tipo | Responsabilidad en el Sistema |
| :--- | :---: | :--- | :--- |
| **MySQL Server** | `8.0+` | SGBD Relacional | Base de datos principal (`tienda_pedidos`) para persistencia de usuarios, catálogo y órdenes. |
| **MySQL Connector/J** | `8.3.0` | Driver JDBC | Conexión de bajo nivel entre Spring Boot y MySQL. |
| **H2 Database** | `2.2.x` | BD en Memoria | Entorno aislado para pruebas automatizadas sin afectar la BD MySQL real. |
| **JUnit 5 & Mockito** | `5.10` / `5.11` | Testing Unitario | Suite de 32 pruebas automatizadas bajo metodología TDD. |
| **Spring Test / MockMvc**| `3.3.0` | Testing Integración | Verificación de contratos HTTP y respuestas JSON en controladores. |
| **Postman / Newman** | `v10+` / `v6+` | Pruebas de API | Colección automatizada con 15 solicitudes y 30 assertions (100% aprobadas). |
| **Git / GitHub** | `2.x` | Control de Versiones | Historial progresivo de 10 commits descriptivos para APF3. |

---

## 📐 3. Evolución del Proyecto por Avances

* **APF1 (Semana 5):** API REST inicial, controladores, servicios, repositorio en memoria, arquitectura por capas y pruebas unitarias con TDD.
* **APF2 (Semana 10):** Persistencia con Spring Data JPA y MySQL, consultas JPQL, transaccionalidad atómica, seguridad Spring Security con roles (`ADMIN`, `CLIENTE`), contraseñas BCrypt, autenticación JWT y suite de Postman.
* **APF3 (Semana 15 - Avance Actual):**
  * Aplicación cliente SPA completa construida con **React + Vite**.
  * Enrutamiento con React Router DOM v7 y rutas privadas (`PrivateRoute`) con protección de acceso por rol (`ADMIN` / `CLIENTE`).
  * Consumo asíncrono con Axios e interceptores automáticos para Bearer JWT.
  * CRUD visual completo de productos (crear, listar, editar con modal y eliminar).
  * Creación y gestión de pedidos con selección dinámica de catálogo, validación de stock y cálculo de totales.
  * Manejo integral de errores HTTP visibles en pantalla: `400 Bad Request` (stock insuficiente), `401 Unauthorized` (credenciales inválidas o expiración), `403 Forbidden` (pantalla de acceso denegado) y `404 Not Found`.
  * Configuración global de CORS en el backend Spring Boot para habilitar comunicación segura con `http://localhost:5173`.

---

## 📊 4. Modelo de Clases y Dominio

```
+---------------+ 1        1..* +-------------+
|     Order     |-------------->|  OrderItem  |
+---------------+               +-------------+
| - id: Long    |               | - productId |
| - clientName  |               | - quantity  |
| - total       |               | - unitPrice |
| - status      |               +-------------+
+---------------+                      | *
                                       |
                                       v 1
                                +-------------+
                                |   Product   |
                                +-------------+
                                | - id: Long  |
                                | - name      |
                                | - price     |
                                | - stock     |
                                +-------------+
```

---

## 🌐 5. Matriz de Endpoints (Backend REST API)

### 🔒 Autenticación (`/auth`)
| Método | URI | Entrada (JSON) | Respuesta Esperada | Código HTTP |
| :--- | :--- | :--- | :--- | :---: |
| **POST** | `/auth/login` | `{"username", "password"}` | Token JWT y datos del usuario | `200 OK` |

### 🍎 Módulo de Productos (`/api/products`)
| Método | URI | Permiso | Descripción | Código HTTP |
| :--- | :--- | :---: | :--- | :---: |
| **GET** | `/api/products` | Público / Todos | Listar catálogo completo de productos | `200 OK` |
| **GET** | `/api/products/{id}` | Público / Todos | Consultar producto por su ID | `200 OK` |
| **POST** | `/api/products` | `ADMIN` | Crear nuevo producto con precio y stock | `201 Created` |
| **PUT** | `/api/products/{id}` | `ADMIN` | Modificar datos de producto existente | `200 OK` |
| **DELETE** | `/api/products/{id}` | `ADMIN` | Eliminar producto del inventario | `200 OK` |

### 📦 Módulo de Pedidos (`/api/orders`)
| Método | URI | Permiso | Descripción | Código HTTP |
| :--- | :--- | :---: | :--- | :---: |
| **GET** | `/api/orders` | `ADMIN` | Listar todos los pedidos con sus detalles | `200 OK` |
| **GET** | `/api/orders/{id}` | `ADMIN` | Consultar detalle de un pedido específico | `200 OK` |
| **POST** | `/api/orders` | Todos | Crear orden, verificar stock y descontar unidades | `201 Created` |
| **PUT** | `/api/orders/{id}/status` | `ADMIN` | Cambiar estado del pedido a `PAGADO` | `200 OK` |
| **POST** | `/api/orders/{id}/cancel` | `ADMIN` | Cancelar orden y reponer existencias en inventario | `200 OK` |

---

## 🚀 6. Instrucciones para Ejecutar y Validar

### 6.1. Iniciar el Backend (Spring Boot)
1. Asegurarse de que el servicio MySQL esté corriendo con la base de datos `tienda_pedidos`.
2. En NetBeans o terminal:
   ```powershell
   mvn spring-boot:run
   ```
3. El servidor iniciará en: `http://localhost:8080`.

### 6.2. Iniciar el Frontend (React + Vite)
1. Abrir una terminal en la carpeta `tienda-frontend`:
   ```powershell
   cd tienda-frontend
   npm install
   npm run dev
   ```
2. Abrir el navegador en: `http://localhost:5173`.

### 6.3. Credenciales Demo Preconfiguradas
| Rol | Usuario | Contraseña | Permisos |
| :--- | :---: | :---: | :--- |
| **ADMIN** | `admin` | `admin123` | Acceso total: CRUD de productos, ver pedidos, pagarlos y cancelarlos. |
| **CLIENTE** | `cliente` | `cliente123` | Acceso restringido: Solo lectura del catálogo de productos. |

---

## 🧪 7. Pruebas Automatizadas y Códigos de Error HTTP

### 7.1. Pruebas Unitarias de Backend (JUnit 5 + TDD)
Para ejecutar las 32 pruebas automatizadas del backend:
```powershell
mvn test
```
Resultado: **`BUILD SUCCESS`** (100% de pruebas aprobadas sin fallos).

### 7.2. Suite Automatizada en Postman (Newman)
Para correr la colección de 15 solicitudes y 30 comprobaciones:
```powershell
npx newman run postman_collection.json --delay-request 200
```
Resultado: **`30 passed, 0 failed`**.

### 7.3. Demostración de Errores HTTP Solicitados en la Rúbrica
* **`401 Unauthorized`:** Ingresar credenciales erróneas en `/login` $\rightarrow$ La interfaz muestra aviso de usuario/clave inválidos.
* **`400 Bad Request`:** Intentar crear un pedido con cantidad mayor al stock disponible $\rightarrow$ El backend rechaza la transacción y el frontend muestra alerta roja con el mensaje *"Stock insuficiente"*.
* **`403 Forbidden`:** Iniciar sesión como `cliente` e intentar acceder manualmente a `http://localhost:5173/orders` $\rightarrow$ La guardia de rutas redirige a la pantalla `/forbidden` (Acceso Denegado).
* **`404 Not Found`:** Consultar un producto inexistente (`GET /api/products/0`) $\rightarrow$ Retorna objeto JSON estructurado con estado 404.

---

## 📜 8. Historial de Commits APF3 (Evolución Progresiva)

| # | Commit Hash | Mensaje de Commit | Descripción |
|---|:---:|---|---|
| 1 | `62152e8` | `feat: inicializar proyecto React + Vite para APF3` | Configuración base del entorno React. |
| 2 | `9c18ac4` | `feat: instalar axios y react-router-dom` | Incorporación de dependencias clave. |
| 3 | `72ab0db` | `refactor: organizar carpetas por responsabilidad` | Estructura modular (`services`, `pages`, `components`, `context`). |
| 4 | `e858c3d` | `feat: configurar HttpClientModule y variables de entorno` | Sistema de estilos CSS global y cliente API base. |
| 5 | `acb0a45` | `feat: definir rutas raiz con React Router v6` | Configuración de rutas y redirecciones. |
| 6 | `6e85f9b` | `feat(auth): crear pagina de login con formulario` | Formulario de autenticación con validaciones. |
| 7 | `f79e1a5` | `feat(auth): implementar guard para rutas protegidas y navbar con logout` | Guardia `PrivateRoute` y control de rol en Navbar. |
| 8 | `28f4593` | `feat(products): CRUD completo de productos con validaciones y modal` | Gestión interactiva del catálogo de productos. |
| 9 | `6756ca2` | `feat(orders): crear, listar, pagar y cancelar pedidos desde el frontend` | Flujo de pedidos end-to-end con stock atómico. |
| 10 | `95a933a` | `feat(core): configurar CORS en SecurityConfig para permitir frontend React` | Habilitación de CORS para `localhost:5173`. |
