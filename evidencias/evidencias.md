# Evidencias del taller

Capturas en texto de las pruebas realizadas durante el laboratorio. Cada bloque
muestra el comando ejecutado y la salida real obtenida en la terminal.

---

## 1. Los tres servicios corriendo (Actividad 1)

```text
[INVENTARIO] Servicio de inventario escuchando en http://localhost:3002
[PAGOS] Servicio de pagos escuchando en http://localhost:3003
[PEDIDOS] Servicio de pedidos escuchando en http://localhost:3001
[PEDIDOS] Timeout configurado en 5000 ms.
[NOTIFICACIONES] Servicio de notificaciones escuchando en http://localhost:3004
[GATEWAY] API Gateway escuchando en http://localhost:3000
```

---

## 2. Un pedido exitoso (Actividad 2)

```text
$ curl -X POST http://localhost:3000/pedidos -H "Content-Type: application/json" -d '{"pizza":"pepperoni"}'

{"success":true,"pedidoId":1,"pizza":"pepperoni","precio":24000,"stockRestante":4,"transaccion":"TX-457281","notificacion":null,"message":"Pedido #1 de pizza pepperoni confirmado con exito."}
```

---

## 3. Un pedido rechazado por falta de inventario (Actividad 3)

Con `vegetariana` con `stock: 0`:

```text
$ curl -X POST http://localhost:3001/pedidos -H "Content-Type: application/json" -d '{"pizza":"vegetariana"}'

HTTP 409
{"success":false,"pedidoId":2,"pizza":"vegetariana","message":"Pedido rechazado: No hay stock disponible de pizza Vegetariana."}
```

---

## 4. El error al detener un servicio (Actividad 4)

Con `servicio-inventario` detenido:

```text
$ curl -X POST http://localhost:3001/pedidos -H "Content-Type: application/json" -d '{"pizza":"hawaiana"}'

HTTP 503
{"success":false,"pedidoId":3,"pizza":"hawaiana","message":"No se pudo contactar al Servicio de Inventario. Revisa que este ejecutandose en el puerto 3002.","detalle":"fetch failed"}
```

`servicio-pedidos` siguió en ejecución y atendió pedidos después de reiniciar
inventario.

---

## 5. El cuarto microservicio respondiendo (servicio-notificaciones)

```text
$ curl -X POST http://localhost:3004/notificaciones -H "Content-Type: application/json" -d '{"pedidoId":123,"pizza":"hawaiana"}'

{"success":true,"message":"Notificacion enviada para el pedido 123"}
```

---

## 6. La función Serverless respondiendo

```text
$ curl -X POST http://localhost:3005/ -H "Content-Type: application/json" -d '{"pizza":"pollo"}'

{"success":true,"pizza":"pollo","message":"Pedido de pizza pollo recibido por la funcion Serverless.","entregaEstimada":"2026-10-08T02:36:51.523Z","ejecutadaEn":"2026-10-08T02:06:51.523Z"}
```

---

## 7. Una petición pasando por el gateway y su log (Actividad 6)

```text
$ curl http://localhost:3000/inventario/pollo

{"pizza":"pollo","stock":5,"disponible":true,"precio":23000,"ingredientes":["salsa de tomate","mozzarella","pollo","maíz"]}
```

Log de la terminal del gateway:

```text
[GATEWAY] API Gateway escuchando en http://localhost:3000
[GATEWAY] POST /pedidos
[GATEWAY] GET /inventario/pollo
```
