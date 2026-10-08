// Servicio de notificaciones - puerto 3004
// Lo completas tu. Faltan los pasos marcados como COMPLETAR.

const express = require("express");

const app = express();
app.use(express.json());

const PUERTO = 3004;

app.post("/notificaciones", (req, res) => {
  // Paso 1: leer pedidoId y pizza del body.
  const { pedidoId, pizza } = req.body;

  // Paso 2: mostrar el aviso en consola.
  console.log(`[NOTIFICACIONES] Aviso: tu pedido ${pedidoId} de pizza ${pizza} esta confirmado.`);

  // Paso 3: responder con exito.
  return res.json({
    success: true,
    message: `Notificacion enviada para el pedido ${pedidoId}`,
  });
});

app.get("/", (req, res) => {
  res.json({ servicio: "notificaciones", estado: "ok", puerto: PUERTO });
});

app.listen(PUERTO, () => {
  console.log(`[NOTIFICACIONES] Servicio de notificaciones escuchando en http://localhost:${PUERTO}`);
});
