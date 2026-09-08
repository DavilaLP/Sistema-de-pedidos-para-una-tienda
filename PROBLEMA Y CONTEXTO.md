# Universidad Tecnológica del Perú (UTP)
## Desarrollo Web Integrado — Proyecto Integrador
### Avance de Proyecto Final 1 (APF1) — Semana 5

---

### 👥 Integrantes del Equipo
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
* **Administrador / Encargado de Tienda:** Encargado de gestionar el catálogo de productos (altas, consultas, modificaciones de precio y stock, bajas), supervisar el stock disponible y administrar el ciclo de vida de los pedidos realizados.
* **Cliente de la Tienda:** Usuario que consulta el catálogo disponible y genera solicitudes de compra (pedidos) basadas estrictamente en la disponibilidad real de existencias.

### 1.4. Solución Propuesta y Beneficios Aportados
Para superar estas limitaciones, se implementa una **solución web empresarial construida sobre una API REST con Java y Spring Boot**:
* **Reserva atómica y control de existencias:** Valida la disponibilidad en el momento exacto del pedido, descontando el stock automáticamente si hay existencias y rechazando la transacción si es insuficiente.
* **Cálculo automatizado y precio histórico:** Congela el precio unitario del producto al momento de comprar (`OrderItem`) y liquida el total exacto sin margen de error humano.
* **Trazabilidad y reposición inmediata:** Facilita el cambio de estados del pedido y, en caso de anulación/cancelación, repone de forma automática las cantidades al inventario activo.
* **Base para la escalabilidad:** Establece una arquitectura limpia y modular que servirá como cimiento para las siguientes fases del proyecto (persistencia JPA, seguridad JWT y frontend en Angular).
