# 📦 Sistema de Gestión de Inventario y Pedidos para una Tienda

Este proyecto es una solución web empresarial desarrollada con **Spring Boot 3** y **Java 17**, diseñada para gestionar de forma automatizada y precisa el **catálogo de inventario** de una tienda y el **flujo completo de pedidos de compra**. Corresponde al avance **APF1 (Semana 5)** de Desarrollo Web Integrado (UTP).

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
   * Permite dar de alta nuevos productos, consultar existencias, modificar datos y retirar artículos descatalogados (CRUD completo).
   * Semilla de datos inicial precargada (Laptops, Teclados Mecánicos, Mouse Gamer, Auriculares).

2. **Motor de Reserva y Descuento Automático de Stock:**
   * Al recibir una orden de compra, el sistema valida inmediatamente si cada producto solicitado cuenta con stock suficiente.
   * Si hay stock disponible, **se descuenta automáticamente del inventario** y se genera la orden en estado `PENDIENTE`.
   * Si no hay existencias suficientes de algún producto, la operación se cancela en su totalidad (operación atómica), protegiendo la integridad del inventario y respondiendo con un error descriptivo (`400 Bad Request`).

3. **Cálculo Transparente de Totales:**
   * Congela el precio unitario del producto en el momento exacto de la compra dentro del detalle del pedido (`OrderItem`).
   * Calcula el importe total sumando los subtotales (`cantidad * precioUnitario`) de cada ítem de forma matemática y sin intervención manual.

4. **Ciclo de Vida del Pedido y Reposición de Inventario:**
   * **Actualización de estado:** Permite transicionar el pedido de `PENDIENTE` a `PAGADO`.
   * **Cancelación con retorno de stock:** Si un cliente o administrador cancela un pedido (`POST /cancel`), el sistema **devuelve automáticamente las unidades de vuelta al inventario**, recuperando el stock disponible de los productos de forma inmediata.

---

## 📝 1. Problema y Contexto de Negocio

### ¿Quién usa el sistema?
*   **Clientes de la tienda:** Realizan pedidos seleccionando productos del catálogo.
*   **Administradores de la tienda:** Gestionan el inventario de productos y supervisan el estado de los pedidos realizados.

### ¿Qué necesidad resuelve?
En una tienda pequeña o mediana, la gestión manual de pedidos suele ocasionar pérdidas por:
1.  **Falta de stock inesperada:** Vender productos que no están disponibles físicamente.
2.  **Errores en cálculos:** Errores al calcular los totales e impuestos de las órdenes de forma manual.
3.  **Falta de trazabilidad:** No saber en qué estado se encuentra un pedido (*Pendiente, Pagado, Cancelado*).

Este sistema automatiza estos procesos, descontando stock de manera inmediata al ingresar un pedido, calculando totales de forma transparente y manteniendo estados legibles de cada compra.

---

## 📐 2. Alcance Inicial (Recursos Principales)

El proyecto está acotado a **2 recursos principales** y **1 recurso de relación**:
1.  **Producto (`Product`):** Atributos `id`, `name`, `price`, `stock`.
2.  **Pedido (`Order`):** Atributos `id`, `clientName`, `orderDate`, `items`, `total`, `status`.
3.  **Detalle del Pedido (`OrderItem`):** Atributos `productId`, `productName`, `quantity`, `unitPrice`.

### ✅ Funcionalidades Incluidas (APF1)
*   **Gestión de Productos (CRUD completo en memoria):** Crear, listar, consultar por ID, actualizar y eliminar productos.
*   **Gestión de Pedidos:** Registro de pedidos con cálculo automático de totales y asociación de ítems.
*   **Control de Inventario:** Validación de stock disponible al momento de crear un pedido y descuento automático de existencias.
*   **Gestión de Estados y Cancelación:** Modificación de estado del pedido (`PENDIENTE`, `PAGADO`, `CANCELADO`) y devolución automática de stock al cancelar.
*   **Manejo Global de Excepciones:** Respuestas HTTP normalizadas (`400 Bad Request`, `404 Not Found`) con DTO de error.

### 🚫 Funcionalidades Excluidas (Planificadas para avances posteriores)
*   Persistencia en base de datos relacional y mapeo objeto-relacional con JPA / Hibernate (programado para **APF2 - Semana 10**).
*   Seguridad, autenticación con JWT y control de acceso basado en roles (programado para **APF2 - Semana 10**).
*   Interfaz gráfica de usuario y componentes frontend desarrollados en Angular (programado para **APF3 - Semana 15**).
*   Despliegue e infraestructura en la nube / Cloud (programado para **Entrega Final - Semana 18**).

---

## 📊 3. Modelo Simple (Conceptos y Relaciones)

El modelo de clases es el siguiente:

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

*   Un **Pedido (`Order`)** contiene uno o más **Detalles (`OrderItem`)**.
*   Cada **Detalle (`OrderItem`)** está asociado a un único **Producto (`Product`)** y guarda el precio unitario histórico en el momento de la compra.

---

## 🌐 4. Matriz de Endpoints

### 🏠 Punto de Entrada / Bienvenida (`/`)
| Método | URI | Entrada | Respuesta Esperada (JSON) | Código HTTP |
| :--- | :--- | :--- | :--- | :---: |
| **GET** | `/` | Ninguna | Estado del sistema, versión APF1 y enlaces a las APIs | `200 OK` |

### 🍎 Módulo de Productos (`/api/products`)

| Método | URI | Entrada (JSON / Params) | Respuesta Esperada (JSON) | Código HTTP |
| :--- | :--- | :--- | :--- | :---: |
| **GET** | `/api/products` | Ninguna | Listado de productos disponibles | `200 OK` |
| **GET** | `/api/products/{id}` | Path Variable: `id` | Detalle del producto solicitado | `200 OK` |
| **POST** | `/api/products` | Cuerpo: `{"name", "price", "stock"}` | Producto creado con su ID generado | `201 Created` |
| **PUT** | `/api/products/{id}` | Cuerpo: `{"name", "price", "stock"}` | Producto modificado con nuevos valores | `200 OK` |
| **DELETE** | `/api/products/{id}` | Path Variable: `id` | Confirmación en JSON de producto eliminado | `200 OK` |

### 📦 Módulo de Pedidos (`/api/orders`)

| Método | URI | Entrada (JSON / Params) | Respuesta Esperada (JSON) | Código HTTP |
| :--- | :--- | :--- | :--- | :---: |
| **GET** | `/api/orders` | Ninguna | Listado de todos los pedidos | `200 OK` |
| **GET** | `/api/orders/{id}` | Path Variable: `id` | Detalle del pedido solicitado | `200 OK` |
| **POST** | `/api/orders` | Cuerpo: `{"clientName", "items": [{"productId", "quantity"}]}` | Pedido creado con total calculado y stock restado | `201 Created` |
| **PUT** | `/api/orders/{id}/status` | Request Param: `?status=PAGADO` | Pedido con estado modificado | `200 OK` |
| **POST** | `/api/orders/{id}/cancel` | Path Variable: `id` | Confirmación en JSON de pedido cancelado y reposición de existencias | `200 OK` |

---

## 🛠️ 5. Arquitectura del Proyecto

El backend utiliza una arquitectura por capas desacopladas mediante inyección de dependencias por constructor:

*   **`model`**: Contiene las entidades POJO de negocio (`Product`, `Order`, `OrderItem`).
*   **`repository`**: Interfaces y su correspondiente implementación en memoria utilizando `ConcurrentHashMap` para simular una base de datos segura contra concurrencia.
*   **`service`**: Capa lógica de negocio (validación de stock, cálculo de totales, retorno de stock).
*   **`controller`**: Exposición de los endpoints REST en formato JSON.
*   **`exception`**: Captura global de excepciones (`ResourceNotFoundException`, `InsufficientStockException`) mapeadas a respuestas REST estructuradas mediante `@RestControllerAdvice`.

---

## 🧪 6. Pruebas Automatizadas con JUnit 5 y Enfoque TDD

El proyecto utiliza **JUnit 5**, **Mockito** y **Spring Boot MockMvc** para garantizar la calidad del código. Se han implementado **4 pruebas automatizadas** que cubren las reglas de negocio clave e integraciones:

### Capa de Servicio (`OrderServiceTest.java` con JUnit 5 y Mockito)
1.  `testCreateOrder_Success`: Valida que al crear un pedido con stock suficiente, se calcule el total correcto de manera automática, el estado inicial sea `PENDIENTE` y el stock del producto disminuya correctamente en el repositorio.
2.  `testCreateOrder_InsufficientStock`: Valida que si se solicita una cantidad superior al stock del producto, el servicio lance una excepción `InsufficientStockException` y no guarde nada en el repositorio.

### Capa de Controlador (`OrderControllerTest.java` con MockMvc)
3.  `testCreateOrder_Success_Returns201`: Simula un cliente REST que envía un JSON correcto para crear un pedido, esperando una respuesta HTTP `201 Created` con el cuerpo de la orden creada.
4.  `testCreateOrder_InsufficientStock_Returns400`: Simula la petición REST con datos válidos pero que superan el stock de almacenamiento, validando que el manejador global de excepciones devuelva `400 Bad Request` y una estructura de error JSON coherente.

---

## 🔄 7. Caso RED $\rightarrow$ GREEN $\rightarrow$ REFACTOR (Explicación del Flujo TDD)

Para el desarrollo del validador de stock al crear pedidos, aplicamos la disciplina TDD de la siguiente manera:

1.  **Fase RED (Fallo):**
    *   Escribimos la prueba `testCreateOrder_InsufficientStock` en `OrderServiceTest.java` antes de implementar el método `createOrder`.
    *   Ejecutamos la prueba con `mvn test`, la cual falló inmediatamente ya que el método en el servicio aún no validaba el stock y retornaba nulo o permitía stock negativo.
2.  **Fase GREEN (Aprobación):**
    *   Escribimos el código mínimo en `OrderServiceImpl.java` para verificar el stock actual del producto. Si el stock solicitado era mayor al disponible, lanzamos `InsufficientStockException`.
    *   Ejecutamos la prueba de nuevo y pasó exitosamente.
3.  **Fase REFACTOR (Optimización):**
    *   Limpiamos el código del bucle de validación en el servicio, extrayendo la lógica repetitiva del cálculo de precios a métodos secundarios.
    *   Aseguramos que el método de cancelación de pedidos devolviera adecuadamente el stock al catálogo.
    *   Volvimos a ejecutar todas las pruebas automatizadas para garantizar que los cambios de limpieza no rompieron ninguna funcionalidad existente (Prueba de Regresión).

---

## 🚀 8. Instrucciones para Ejecutar y Validar

### Requisitos Previos
*   Java 17 o superior instalado.
*   Maven 3.x instalado.

### Clonación y Configuración del Entorno
Establecer la variable `JAVA_HOME` para utilizar el JDK 17 (en PowerShell):
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot"
```

### Ejecutar las Pruebas Unitarias (TDD con JUnit 5)
* **Opción A (Desde NetBeans):** Clic derecho sobre el proyecto $\rightarrow$ seleccionar **Test** (o presionar `Alt + F6`). NetBeans abrirá la ventana gráfica mostrando la barra 100% verde con las 4 pruebas aprobadas.
* **Opción B (Desde PowerShell / Terminal):**
```powershell
mvn test
```
Verás en consola el reporte oficial de JUnit con `Tests run: 4, Failures: 0, Errors: 0` $\rightarrow$ `BUILD SUCCESS`.

### Ejecutar el Proyecto
* **Opción A (Desde NetBeans):** Abrir el proyecto, hacer clic derecho sobre `SistemaPedidosApplication.java` $\rightarrow$ **Run File** (o presionar `Shift + F6`).
* **Opción B (Desde PowerShell / Terminal):**
```powershell
mvn spring-boot:run
```
El servidor embebido Tomcat iniciará en el puerto `8080`.

---

## 📬 9. Pruebas Automatizadas en Postman (Collection Runner)

El proyecto incluye la colección [`postman_collection.json`](file:///c:/Users/Usuario/Documents/Sistema%20de%20pedidos%20para%20una%20tienda/postman_collection.json) con **24 scripts de validación automática (`pm.test`)**:

### Pasos para ejecutar la suite automatizada:
1. Importar `postman_collection.json` en Postman.
2. Hacer clic sobre la colección **`Sistema de Pedidos - APF1`** $\rightarrow$ seleccionar **Run**.
3. Hacer clic en **Run Sistema de Pedidos - APF1**.
4. **Resultado:** Se ejecutarán las 12 peticiones de forma secuencial en menos de 2 segundos, aprobando al 100% las 24 aserciones:
   * ✅ Códigos HTTP verificados: `200 OK`, `201 Created`, `400 Bad Request` y `404 Not Found`.
   * ✅ Integridad de datos: Cálculo exacto de importes, descuento en tiempo real y retorno de existencias.
   * ✅ **Métrica de éxito:** `Passed: 24 | Failed: 0 | Errors: 0 (100% Pass)`.
