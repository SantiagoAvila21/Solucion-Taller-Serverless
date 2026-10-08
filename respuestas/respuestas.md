# Respuestas del taller

Responde según lo que hiciste y observaste durante las actividades. Mantén la
misma numeración de `guia-taller.md` y no dejes preguntas sin responder.

Nombre del estudiante: Santiago Avila

Si desplegaste la función Serverless (Camino B), anota aquí tu URL pública:

URL de la función Serverless: _(no se desplegó, se probó localmente en el Camino A)_

---

## Preguntas de análisis — Microservicios

### 1. ¿Qué responsabilidad tiene cada microservicio?

Respuesta:

- **servicio-pedidos (3001):** es el coordinador. Recibe el pedido del cliente y
  orquesta el flujo completo llamando primero a inventario y luego a pagos.
  No guarda stock ni cobra, solo decide el resultado final del pedido.
- **servicio-inventario (3002):** es dueño del stock y del menú (`pizzas.json`).
  Verifica si hay disponibilidad de una pizza, descuenta una unidad al reservarla
  y expone consultas del inventario completo o de una pizza puntual.
- **servicio-pagos (3003):** simula el cobro. Recibe la pizza y el monto, y
  devuelve un número de transacción. En el taller siempre aprueba.
- **servicio-notificaciones (3004):** avisa cuando un pedido quedó confirmado.
  Recibe `pedidoId` y `pizza`, imprime el aviso en consola y responde con éxito.
  Es secundario: si falla, el pedido no se cae.
- **gateway (3000):** no es un microservicio de negocio. Es el punto de entrada
  único que reenvía cada petición al servicio que le corresponde.

### 2. ¿Cómo se comunican?

Respuesta: se comunican por **HTTP con JSON** (estilo REST). `servicio-pedidos`
hace peticiones `POST` a inventario y a pagos usando `fetch`; inventario y pagos
responden con objetos JSON que pedidos interpreta por campos como `disponible` o
`aprobado`. Cada servicio corre en su propio proceso y puerto, sin compartir
memoria ni base de datos, por lo que el único contrato es el formato de las
peticiones y respuestas.

### 3. ¿Qué ocurre cuando un servicio deja de funcionar?

Respuesta: `servicio-pedidos` maneja el fallo con un `try/catch`. Si inventario o
pagos no responden, la petición se rechaza con **HTTP 503** y un mensaje
controlado ("No se pudo contactar al Servicio de Inventario/Pagos"), pero el
servicio de pedidos **no se cae**: sigue vivo y puede atender otros pedidos.
Cuando el servicio vuelve a levantarse, todo funciona de nuevo. Es un fallo
parcial y tolerado: el sistema degrada, no colapsa.

### 4. ¿Qué ventajas observaste al separar el sistema?

Respuesta:

- **Responsabilidad única:** cada servicio hace una sola cosa y es más fácil de
  entender, mantener y modificar sin tocar los demás.
- **Escalabilidad independiente:** se puede replicar solo el servicio que recibe
  más carga (por ejemplo, inventario) sin replicar todo el sistema.
- **Aislamiento de fallos:** si notificaciones se cae, los pedidos siguen
  funcionando; el error queda acotado a un servicio.
- **Tecnología y despliegue independientes:** cada servicio puede desplegarse por
  separado y actualizarse sin detener el sistema completo.
- **Reutilización:** otras aplicaciones (web, móvil) pueden consumir el mismo
  servicio de inventario o pagos.

### 5. ¿Qué problemas puede generar tener varios servicios?

Respuesta:

- **Complejidad operativa:** hay que ejecutar, monitorear y desplegar varios
  procesos y puertos en lugar de uno solo.
- **Latencia de red:** cada llamada entre servicios agrega tiempo y puntos de
  fallo; el flujo del pedido hace varias peticiones HTTP encadenadas.
- **Depuración más difícil:** un error puede originarse en otro servicio y hay
  que revisar los logs de todos.
- **Consistencia de datos:** no hay transacción única; si se descuenta el stock y
  luego falla el pago, el inventario ya quedó modificado (no hay rollback).
- **Versionado de contratos:** si cambia el formato de una respuesta de
  inventario, hay que actualizar a todos los que lo consumen.
- **Configuración dispersa:** URL y puertos repetidos en varios archivos, como se
  vio al tener que apuntar bien cada `URL_*`.

### 6. ¿Qué aprendiste al crear servicio-notificaciones?

Respuesta: aprendí lo sencillo que es añadir un servicio nuevo a una arquitectura
de microservicios: basta con crear su `index.js`, exponer una ruta y declarar su
puerto, sin tocar los servicios existentes. También aprendí a integrarlo al flujo
activando la bandera `NOTIFICACIONES_ACTIVAS` en `servicio-pedidos`. Lo más
importante fue ver que las notificaciones son un paso **no crítico**: cuando las
dejé apagadas o el servicio estaba caído, el pedido igual se confirmó y solo el
campo `notificacion` indicó que no se pudo avisar. Eso muestra cómo se prioriza
la disponibilidad sobre la consistencia en este tipo de sistemas.

---

## Preguntas de análisis — Serverless

### 7. ¿Qué es Serverless?

Respuesta: Serverless es un modelo en la nube donde el desarrollador escribe
solo una **función** con la lógica de negocio y el proveedor (Vercel, AWS Lambda,
Netlify, etc.) se encarga por completo de los servidores, el sistema operativo y
el escalado. No hay que mantener ni aprovisionar una máquina corriendo: el
proveedor la levanta cuando llega una petición. Se paga solo por el tiempo de
ejecución/las invocaciones, no por tener un servidor encendido.

### 8. ¿Qué diferencia observaste frente a los servicios locales?

Respuesta: los microservicios del taller son procesos que **yo** levanto y dejo
corriendo en mi máquina (`node index.js`, puertos 3001-3003). La función
Serverless no mantiene un servidor encendido: existe como código y se ejecuta
solo cuando llega una petición. Al probarla localmente con `server-local.js` sí
hay un proceso escuchando, pero en la nube real ese servidor lo administra el
proveedor y aparece/desaparece según la demanda. Además, la función es una sola
unidad pequeña sin estado, frente a los servicios que conservan estado (por
ejemplo el stock en `pizzas.json`).

### 9. ¿Qué significa ejecutar una función bajo demanda?

Respuesta: significa que la función **no está corriendo permanentemente**; solo
se instancia y se ejecuta cuando ocurre un evento o llega una petición, y al
terminar se apaga. Se cobra únicamente por ese tiempo de ejecución. Si nadie la
llama, no consume recursos ni genera costo.

### 10. ¿Qué ventajas y limitaciones observaste?

Respuesta:

Ventajas:
- No hay que administrar servidores ni procesos: el proveedor gestiona toda la
  infraestructura.
- Escala automáticamente según la demanda (de cero a muchas invocaciones).
- Costo por uso: si no se llama, no se paga.
- Despliegue muy simple y rápido (un archivo, `vercel` y listo).

Limitaciones:
- **Arranque en frío (cold start):** las primeras llamadas tardan más porque hay
  que inicializar el entorno; las siguientes son más rápidas (se notó al medir
  tiempos).
- Sin estado por defecto: no se puede guardar el stock en memoria entre llamadas.
- Dependencia del proveedor (vendor lock-in) y límites de tiempo de ejecución.
- Difícil de depurar localmente con fidelidad; el servidor local no es serverless
  real.

---

## Preguntas finales

### 11. ¿Qué diferencia principal encontraste entre Microservicios y Serverless?

Respuesta: la principal es **quién administra el servidor y cuándo se ejecuta**.
En microservicios yo mantengo procesos corriendo de forma continua y yo decido
dónde y cómo se despliegan; en Serverless no hay un servidor propio: el proveedor
lo gestiona y la función solo se ejecuta bajo demanda cuando llega una petición.
Los microservicios son apropiados para lógica con estado y comunicación constante
entre servicios; Serverless para tareas puntuales, eventos o picos de tráfico.

### 12. ¿En qué situación utilizarías una arquitectura de Microservicios?

Respuesta: en un sistema grande con dominios de negocio bien diferenciados
(pedidos, inventario, pagos, usuarios) donde se necesita escalar componentes por
separado, mantener estado propio de cada dominio, equipos que trabajan en
paralelo y despliegues independientes. Por ejemplo, una tienda en línea con
distintos equipos a cargo de cada servicio. Encaja cuando el sistema es complejo
y va a crecer.

### 13. ¿En qué situación utilizarías una función Serverless?

Respuesta: para tareas pequeñas, puntuales o dirigidas por eventos: procesar una
imagen al subirse, enviar un correo, generar un reporte, atender un webhook, o
exponer un endpoint de baja o intermitente frecuencia. También para picos de
tráfico donde no quiero mantener servidores ociosos y para prototipos rápidos
donde no quiero administrar infraestructura. Por ejemplo, la propia función
`funcion-pedido`, que solo calcula un resumen cuando alguien la llama.

### 14. ¿Qué fue lo más importante que aprendiste durante el taller?

Respuesta: lo más importante fue entender de forma práctica cómo un sistema se
divide en servicios independientes que colaboran por HTTP, y cómo cada uno puede
fallar de forma aislada sin tumbar todo el sistema. Comprobé con el timeout, el
stock en 0 y un servicio apagado que un buen manejo de errores (403/409/503) es
clave. También aprendí a montar un API Gateway como punto de entrada único y a
comparar el modelo de microservicios con el de Serverless, entendiendo que la
elección depende de si necesito estado y control del servidor o simplicidad y
escalado bajo demanda.

---

## Comparación Microservicios vs Serverless

| Característica | Microservicios | Serverless |
|---|---|---|
| Unidad principal | Un servicio completo con su proceso, estado y varias rutas | Una función pequeña sin estado con una tarea puntual |
| Ejemplo del taller | servicio-pedidos, inventario, pagos, notificaciones y gateway | funcion-pedido |
| ¿Quién ejecuta el servicio? | Yo, en mi máquina o en un servidor que administro (`node index.js`) | El proveedor de nube (Vercel/AWS Lambda/Netlify) |
| ¿Cuándo se ejecuta? | Permanentemente, mientras el proceso esté encendido | Bajo demanda, solo cuando llega una petición/evento |
| Comunicación | HTTP con JSON entre servicios; el gateway proxea las peticiones | Se invoca por HTTP u evento; el proveedor la expone con una URL |
| Infraestructura | Servidores/procesos que debo levantar, mantener y monitorear | La administra el proveedor; yo solo subo el código |
| ¿Qué pudo observar el estudiante? | Varios procesos en distintos puertos, logs separados, fallos aislados y tiempos estables | Respuesta rápida y sin servidor encendido; las primeras llamadas pueden tardar más por el cold start |

---

## Preguntas de análisis — API Gateway

### 15. ¿Qué ventaja tiene que el cliente no sepa que hay varios servicios distintos detrás del gateway?

Respuesta: el cliente se simplifica y se desacopla. Solo conoce una dirección
(`localhost:3000`) y no necesita saber cuántos servicios hay, en qué puertos
viven ni cómo se llaman. Esto permite que internamente los servicios se muevan,
se renombren, se dividan o se escalen sin romper a los clientes. Además
centraliza preocupaciones transversales (logging, autenticación, CORS, rate
limiting) en un solo punto y mejora la seguridad al no exponer cada servicio
directamente.

---

## Observaciones de las pruebas

Anota lo que observaste en cada actividad (pedidos, sin stock, servicio caído,
timeout, cuarto microservicio, Serverless, gateway).

- **Actividad 2 (pedidos):** cada pedido exitoso devolvió `success: true`, un
  `pedidoId` incremental, el `precio` correcto según el menú, el `stockRestante`
  descontado en una unidad y un `transaccion` tipo `TX-xxxxxx`. Al repetir la
  misma pizza, el stock fue bajando (5 → 4 → 3…).
- **Actividad 3 (sin stock):** al poner el `stock` de `vegetariana` en `0`, el
  pedido se rechazó con **HTTP 409** y el mensaje de inventario sin stock. El
  pedido no se confirmó ni se cobró. Luego restauré el stock a `5`.
- **Actividad 4 (servicio detenido):** al apagar `servicio-inventario`, el pedido
  respondió **HTTP 503** con un mensaje claro de que no se pudo contactar al
  servicio. `servicio-pedidos` siguió corriendo sin caerse. Al volver a levantar
  inventario, los pedidos funcionaron de nuevo.
- **Actividad 5 (timeout):** al bajar `TIMEOUT_MS` a `1`, el pedido falló con
  **HTTP 503** porque la petición a inventario se canceló antes de recibir
  respuesta. Al restaurar el valor a `5000` todo volvió a la normalidad. Mostró
  que un timeout demasiado corto genera falsos fallos.
- **Cuarto microservicio:** `servicio-notificaciones` respondió
  `{ "success": true, "message": "Notificacion enviada para el pedido 123" }` y
  mostró el aviso en consola. Al activar `NOTIFICACIONES_ACTIVAS = true`, el
  pedido incluyó el bloque `notificacion`; al detenerlo, el pedido se confirmó
  igual y el campo `notificacion` indicó que no se pudo enviar.
- **Serverless (tiempos de respuesta):** la función respondió un resumen con
  `pizza`, `entregaEstimada` y `ejecutadaEn`. Las primeras llamadas tardaron un
  poco más que las siguientes (efecto de arranque en frío); después se
  estabilizaron. Cambiar la pizza a `pollo` solo modificó el campo `pizza` y el
  mensaje, manteniendo la misma estructura.
- **Actividad 6 (pruebas a través del gateway):** las respuestas por el puerto
  `3000` fueron idénticas a las obtenidas pegándole directo a cada servicio. En
  la terminal del gateway se imprimió el log de cada petición, por ejemplo
  `[GATEWAY] POST /pedidos` y `[GATEWAY] GET /inventario`.
