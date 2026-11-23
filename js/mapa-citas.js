// VARIABLES GLOBALES
let mapaDomicilio = null;
let marcadorDomicilio = null;
const coordsIniciales = [-11.9592, -77.0628]; // Lima Norte por defecto

// ELEMENTOS DEL DOM
const radiosModalidad = document.querySelectorAll('input[name="modalidad"]');
const optTaller = document.getElementById("opt-taller");
const optDomicilio = document.getElementById("opt-domicilio");
const bloqueDomicilio = document.getElementById("bloque-domicilio");
const inputCoordenadas = document.getElementById("coordenadas");
const inputReferencia = document.getElementById("referencia");
const btnGps = document.getElementById("btn-gps");
const formCita = document.getElementById("form-cita");
const fechaInput = document.getElementById("fecha-cita");

// Establecer fecha mínima como hoy
const hoy = new Date().toISOString().split("T")[0];
fechaInput.min = hoy;
fechaInput.value = hoy;

// INICIALIZAR MAPA DE DOMICILIO (USANDO ESRI PARA EVITAR BLOQUEOS)
function iniciarMapaDomicilio() {
  if (mapaDomicilio) return; // Ya está creado

  mapaDomicilio = L.map("mapa-domicilio").setView(coordsIniciales, 15);

  // Capa en español (hl=es) sin bloqueos locales ni API key
  L.tileLayer("https://mt1.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}", {
    attribution: "&copy; Google Maps • Cobertura Lima",
    maxZoom: 20
  }).addTo(mapaDomicilio);

  marcadorDomicilio = L.marker(coordsIniciales, { draggable: true }).addTo(mapaDomicilio);
  marcadorDomicilio.bindPopup("<b>Ubicación de visita</b><br>Arrástrame a tu domicilio").openPopup();
  // Actualizar input al arrastrar el marcador
  marcadorDomicilio.on("dragend", () => {
    const pos = marcadorDomicilio.getLatLng();
    actualizarCoordenadas(pos.lat, pos.lng);
  });

  // Actualizar input al hacer clic en cualquier parte del mapa
  mapaDomicilio.on("click", (e) => {
    marcadorDomicilio.setLatLng(e.latlng);
    actualizarCoordenadas(e.latlng.lat, e.latlng.lng);
  });
}

function actualizarCoordenadas(lat, lng) {
  inputCoordenadas.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// CAMBIO ENTRE "EN TALLER" Y "A DOMICILIO"
radiosModalidad.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "A Domicilio") {
      optDomicilio.classList.add("active");
      optTaller.classList.remove("active");
      bloqueDomicilio.style.display = "block";
      inputReferencia.required = true;

      iniciarMapaDomicilio();
      // Recalcular tamaño del mapa tras hacerse visible
      setTimeout(() => {
        mapaDomicilio.invalidateSize();
      }, 150);
    } else {
      optTaller.classList.add("active");
      optDomicilio.classList.remove("active");
      bloqueDomicilio.style.display = "none";
      inputReferencia.required = false;
    }
  });
});

// BOTÓN USAR MI UBICACIÓN GPS ACTUAL
btnGps.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  btnGps.textContent = "⏳ Ubicando...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      mapaDomicilio.setView([lat, lng], 16);
      marcadorDomicilio.setLatLng([lat, lng]);
      marcadorDomicilio.bindPopup("<b>¡Tu ubicación actual!</b>").openPopup();
      actualizarCoordenadas(lat, lng);
      btnGps.textContent = "✅ Ubicación detectada";
    },
    () => {
      alert("No se pudo obtener tu ubicación. Verifica los permisos del navegador o marca el punto manualmente en el mapa.");
      btnGps.textContent = "🎯 Usar mi GPS actual";
    }
  );
});

// CARGAR REPUESTOS SELECCIONADOS DESDE PRODUCTOS.HTML
function cargarRepuestosAdjuntos() {
  const cotizacion = JSON.parse(localStorage.getItem("techfix_cotizacion")) || [];
  const contenedor = document.getElementById("resumen-repuestos");

  if (cotizacion.length === 0) {
    contenedor.innerHTML = `<p class="empty-msg">No hay repuestos seleccionados en el catálogo.</p>`;
    return [];
  }

  const total = cotizacion.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  contenedor.innerHTML = `
    ${cotizacion.map(item => `
      <div class="quote-item">
        <div class="quote-item-info">
          <strong>${item.nombre}</strong>
          <span>Cantidad: ${item.cantidad}</span>
        </div>
        <span>S/ ${(item.precio * item.cantidad).toFixed(2)}</span>
      </div>
    `).join("")}
    <div class="quote-total" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed #cbd5e1;">
      <span>Subtotal Repuestos:</span>
      <strong>S/ ${total.toFixed(2)}</strong>
    </div>
  `;
  return cotizacion;
}

// GUARDAR NUEVA ORDEN AL ENVIAR FORMULARIO
formCita.addEventListener("submit", (e) => {
  e.preventDefault();

  const modalidad = document.querySelector('input[name="modalidad"]:checked').value;
  const repuestos = cargarRepuestosAdjuntos();
  const ordenesGuardadas = JSON.parse(localStorage.getItem("techfix_ordenes")) || [];

  const nuevaOrden = {
    codigo: "ORD-" + Math.floor(1000 + Math.random() * 9000),
    modalidad: modalidad,
    coordenadas: modalidad === "A Domicilio" ? inputCoordenadas.value : "Sede Principal",
    referencia: modalidad === "A Domicilio" ? inputReferencia.value : "Av. Universitaria 4520, Comas",
    cliente: document.getElementById("cliente-nombre").value,
    telefono: document.getElementById("cliente-telefono").value,
    equipo: document.getElementById("tipo-equipo").value,
    servicio: document.getElementById("servicio-tipo").value,
    fecha: fechaInput.value,
    hora: document.getElementById("hora-cita").value,
    detalle: document.getElementById("problema-detalle").value,
    repuestos: repuestos
  };

  ordenesGuardadas.unshift(nuevaOrden);
  localStorage.setItem("techfix_ordenes", JSON.stringify(ordenesGuardadas));

  // Limpiar carrito tras confirmar cita
  localStorage.removeItem("techfix_cotizacion");
  cargarRepuestosAdjuntos();
  renderizarOrdenes();
  formCita.reset();
  fechaInput.value = hoy;

  alert(`¡Orden ${nuevaOrden.codigo} registrada con éxito! Revisa el panel derecho "Órdenes Agendadas".`);
});

// MOSTRAR HISTORIAL DE ÓRDENES AGENDADAS
function renderizarOrdenes() {
  const ordenes = JSON.parse(localStorage.getItem("techfix_ordenes")) || [];
  const lista = document.getElementById("lista-ordenes");
  const contador = document.getElementById("total-ordenes");

  contador.textContent = ordenes.length;

  if (ordenes.length === 0) {
    lista.innerHTML = `<p class="empty-msg">Aún no has registrado citas en esta sesión.</p>`;
    return;
  }

  lista.innerHTML = ordenes.map(ord => `
    <div class="order-ticket ${ord.modalidad === "A Domicilio" ? "domicilio" : ""}">
      <div class="ticket-top">
        <span class="ticket-code">${ord.codigo} • ${ord.equipo}</span>
        <span class="ticket-badge">${ord.modalidad}</span>
      </div>
      <p><strong>Cliente:</strong> ${ord.cliente} (${ord.telefono})</p>
      <p><strong>Servicio:</strong> ${ord.servicio}</p>
      <p><strong>Cita:</strong> ${ord.fecha} | ${ord.hora}</p>
      <p><strong>Lugar:</strong> ${ord.referencia}</p>
      ${ord.modalidad === "A Domicilio" ? `<span class="ticket-coords">GPS: ${ord.coordenadas}</span>` : ""}
      ${ord.repuestos.length > 0 ? `<p style="margin-top:0.4rem; color:#2563eb;"><strong>Repuestos (${ord.repuestos.length}):</strong> ${ord.repuestos.map(r => r.nombre).join(", ")}</p>` : ""}
    </div>
  `).join("");
}

// INICIALIZAR AL CARGAR
cargarRepuestosAdjuntos();
renderizarOrdenes();