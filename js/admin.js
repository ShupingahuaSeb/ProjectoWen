// CREDENCIALES DEL ADMINISTRADOR (Ocultas en la interfaz)
const ADMIN_USER = "admin";
const ADMIN_PASS = "techfix2026";

// INVENTARIO POR DEFECTO
const inventarioRespaldo = [
  { id: 1, nombre: "SSD NVMe M.2 Kingston 500GB", categoria: "almacenamiento", etiqueta: "Almacenamiento", icono: "💾", descripcion: "Lectura hasta 3500 MB/s. Ideal para acelerar el arranque de laptops y PCs.", precio: 165.00, stock: 8 },
  { id: 2, nombre: "SSD SATA Crucial BX500 480GB", categoria: "almacenamiento", etiqueta: "Almacenamiento", icono: "💽", descripcion: "Reemplazo directo para discos duros mecánicos lentos en laptops antiguas.", precio: 145.00, stock: 5 },
  { id: 3, nombre: "Memoria RAM DDR4 8GB 3200MHz", categoria: "memoria", etiqueta: "Memoria RAM", icono: "📟", descripcion: "Módulo SODIMM para laptop. Mejora la multitarea y fluidez del sistema.", precio: 95.00, stock: 12 },
  { id: 4, nombre: "Memoria RAM DDR4 16GB (2x8GB) PC", categoria: "memoria", etiqueta: "Memoria RAM", icono: "⚡", descripcion: "Kit Dual Channel con disipador de aluminio para computadoras de escritorio.", precio: 185.00, stock: 3 },
  { id: 5, nombre: "Pasta Térmica Arctic MX-4 (4g)", categoria: "refrigeracion", etiqueta: "Refrigeración", icono: "❄️", descripcion: "Alta conductividad térmica sin metal. Reduce hasta 10°C en procesador y GPU.", precio: 38.00, stock: 15 },
  { id: 6, nombre: "Base Refrigerante Laptop 5 Ventiladores", categoria: "refrigeracion", etiqueta: "Refrigeración", icono: "🌀", descripcion: "Soporte ergonómico ajustable con iluminación LED azul y doble puerto USB.", precio: 75.00, stock: 4 },
  { id: 7, nombre: "Cargador Original Laptop 65W Punta Azul", categoria: "accesorios", etiqueta: "Accesorios", icono: "🔌", descripcion: "Incluye cable trébol de poder y protección contra sobrecargas eléctricas.", precio: 89.00, stock: 2 },
  { id: 8, nombre: "Adaptador Caddy HDD/SSD 9.5mm", categoria: "accesorios", etiqueta: "Accesorios", icono: "🛠️", descripcion: "Permite instalar un segundo disco duro en la bahía lectora de tu laptop.", precio: 29.00, stock: 0 }
];

// ELEMENTOS DEL DOM
const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const formLogin = document.getElementById("form-login");
const loginError = document.getElementById("login-error");
const btnLogout = document.getElementById("btn-logout");

// ELEMENTOS PARA NUEVO PRODUCTO
const btnToggleNuevo = document.getElementById("btn-toggle-nuevo");
const btnCancelarProd = document.getElementById("btn-cancelar-prod");
const formNuevoProducto = document.getElementById("form-nuevo-producto");

// VERIFICAR SESIÓN
function verificarSesion() {
  const logueado = sessionStorage.getItem("techfix_admin_auth") === "true";
  if (logueado) {
    loginView.style.display = "none";
    dashboardView.style.display = "block";
    cargarDashboard();
  } else {
    loginView.style.display = "flex";
    dashboardView.style.display = "none";
  }
}

formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("admin-user").value.trim();
  const pass = document.getElementById("admin-pass").value.trim();

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem("techfix_admin_auth", "true");
    loginError.style.display = "none";
    verificarSesion();
  } else {
    loginError.style.display = "block";
  }
});

btnLogout.addEventListener("click", () => {
  sessionStorage.removeItem("techfix_admin_auth");
  formLogin.reset();
  verificarSesion();
});

// MOSTRAR / OCULTAR FORMULARIO DE NUEVO PRODUCTO
btnToggleNuevo.addEventListener("click", () => {
  const visible = formNuevoProducto.style.display === "block";
  formNuevoProducto.style.display = visible ? "none" : "block";
});

btnCancelarProd.addEventListener("click", () => {
  formNuevoProducto.reset();
  formNuevoProducto.style.display = "none";
});

// GUARDAR NUEVO PRODUCTO EN EL CATÁLOGO
formNuevoProducto.addEventListener("submit", (e) => {
  e.preventDefault();

  const inventario = JSON.parse(localStorage.getItem("techfix_inventario")) || [];
  const selectCat = document.getElementById("prod-categoria");
  const opcionSeleccionada = selectCat.options[selectCat.selectedIndex];

  const nuevoProducto = {
    id: Date.now(), // ID único basado en timestamp
    nombre: document.getElementById("prod-nombre").value.trim(),
    categoria: selectCat.value,
    etiqueta: opcionSeleccionada.dataset.etiqueta,
    icono: document.getElementById("prod-icono").value,
    descripcion: document.getElementById("prod-desc").value.trim(),
    precio: parseFloat(document.getElementById("prod-precio").value),
    stock: parseInt(document.getElementById("prod-stock").value, 10)
  };

  inventario.unshift(nuevoProducto);
  localStorage.setItem("techfix_inventario", JSON.stringify(inventario));

  formNuevoProducto.reset();
  formNuevoProducto.style.display = "none";
  cargarDashboard();
  alert(`✅ Producto "${nuevoProducto.nombre}" añadido al catálogo.`);
});

// CARGAR DATOS DEL PANEL
function cargarDashboard() {
  let inventario = JSON.parse(localStorage.getItem("techfix_inventario"));
  if (!inventario) {
    inventario = inventarioRespaldo;
    localStorage.setItem("techfix_inventario", JSON.stringify(inventario));
  }

  const ordenes = JSON.parse(localStorage.getItem("techfix_ordenes")) || [];

  document.getElementById("kpi-citas").textContent = ordenes.length;
  document.getElementById("kpi-domicilios").textContent = ordenes.filter(o => o.modalidad === "A Domicilio").length;
  document.getElementById("kpi-bajo-stock").textContent = inventario.filter(p => p.stock <= 3).length;

  renderizarTablaServicios(ordenes);
  renderizarTablaStock(inventario);
}

// RENDERIZAR SERVICIOS SOLICITADOS (SOLO VISIBLES AQUÍ)
function renderizarTablaServicios(ordenes) {
  const tbody = document.getElementById("tabla-servicios");

  if (ordenes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b; padding:2rem;">No hay servicios solicitados todavía.</td></tr>`;
    return;
  }

  tbody.innerHTML = ordenes.map((ord, index) => {
    const atendido = ord.estado === "Atendido";
    const linkMapa = ord.modalidad === "A Domicilio"
      ? `<br><a href="https://www.google.com/maps?q=${ord.coordenadas.replace(/\s/g, '')}" target="_blank" style="color:#2563eb; font-size:0.78rem; font-weight:600;">📍 Ver en Google Maps</a>`
      : "";

    const repuestosTexto = ord.repuestos && ord.repuestos.length > 0
      ? `<br><small style="color:#2563eb;">Repuestos: ${ord.repuestos.map(r => `${r.nombre} (x${r.cantidad})`).join(", ")}</small>`
      : "";

    const detalleTexto = ord.detalle
      ? `<br><small style="color:#64748b; font-style:italic;">"${ord.detalle}"</small>`
      : "";

    return `
      <tr>
        <td><strong>${ord.codigo}</strong></td>
        <td>${ord.cliente}<br><small style="color:#64748b;">📞 ${ord.telefono}</small></td>
        <td><strong>${ord.equipo}</strong><br><small>${ord.servicio}</small>${repuestosTexto}${detalleTexto}</td>
        <td><strong>${ord.modalidad}</strong><br><small>${ord.referencia}</small>${linkMapa}</td>
        <td>${ord.fecha}<br><small style="color:#64748b;">${ord.hora}</small></td>
        <td>
          <span class="status-pill ${atendido ? 'status-atendido' : 'status-pendiente'}">
            ${atendido ? 'Atendido' : 'Pendiente'}
          </span>
        </td>
        <td>
          ${atendido
            ? '<span style="color:#64748b; font-size:0.8rem;">✔ Completado</span>'
            : `<button class="btn-check" onclick="marcarAtendido(${index})">✔ Atender</button>`
          }
        </td>
      </tr>
    `;
  }).join("");
}

// MARCAR CITA COMO ATENDIDA Y DESCONTAR REPUESTOS
function marcarAtendido(index) {
  const ordenes = JSON.parse(localStorage.getItem("techfix_ordenes")) || [];
  const inventario = JSON.parse(localStorage.getItem("techfix_inventario")) || [];
  const orden = ordenes[index];

  orden.estado = "Atendido";

  if (orden.repuestos && orden.repuestos.length > 0) {
    orden.repuestos.forEach(rep => {
      const prodEnStock = inventario.find(p => p.id === rep.id);
      if (prodEnStock) {
        prodEnStock.stock = Math.max(0, prodEnStock.stock - rep.cantidad);
      }
    });
    localStorage.setItem("techfix_inventario", JSON.stringify(inventario));
  }

  localStorage.setItem("techfix_ordenes", JSON.stringify(ordenes));
  cargarDashboard();
}

// RENDERIZAR TABLA DE INVENTARIO CON CONTROL COMPLETO (+/- Y ELIMINAR)
function renderizarTablaStock(inventario) {
  const tbody = document.getElementById("tabla-stock");

  if (inventario.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b; padding:2rem;">No hay productos registrados en el inventario.</td></tr>`;
    return;
  }

  tbody.innerHTML = inventario.map((prod) => {
    const stockBajo = prod.stock <= 3;
    return `
      <tr>
        <td><strong>${prod.icono} ${prod.nombre}</strong></td>
        <td>${prod.etiqueta}</td>
        <td>S/ ${prod.precio.toFixed(2)}</td>
        <td><strong style="font-size:1.05rem;">${prod.stock} unid.</strong></td>
        <td>
          <span class="status-pill ${stockBajo ? 'status-bajo' : 'status-ok'}">
            ${prod.stock === 0 ? 'Agotado' : (stockBajo ? 'Stock Bajo' : 'Disponible')}
          </span>
        </td>
        <td>
          <div class="restock-controls">
            <button class="btn-stock-minus" onclick="ajustarStock(${prod.id}, -1)" title="Restar stock">-</button>
            <input type="number" id="input-stock-${prod.id}" class="restock-input" value="1" min="1" max="100" />
            <button class="btn-restock" onclick="ajustarStock(${prod.id}, 1)" title="Añadir stock">+</button>
          </div>
        </td>
        <td>
          <button class="btn-delete-prod" onclick="eliminarProducto(${prod.id})" title="Eliminar producto del catálogo">🗑️ Eliminar</button>
        </td>
      </tr>
    `;
  }).join("");
}

// AÑADIR O QUITAR UNIDADES DE STOCK
function ajustarStock(id, signo) {
  const inventario = JSON.parse(localStorage.getItem("techfix_inventario")) || [];
  const inputCant = document.getElementById(`input-stock-${id}`);
  const cantidad = parseInt(inputCant.value, 10);

  if (isNaN(cantidad) || cantidad <= 0) {
    alert("Ingresa una cantidad válida mayor a 0.");
    return;
  }

  const producto = inventario.find(p => p.id === id);
  if (producto) {
    producto.stock = Math.max(0, producto.stock + (cantidad * signo));
    localStorage.setItem("techfix_inventario", JSON.stringify(inventario));
    cargarDashboard();
  }
}

// ELIMINAR PRODUCTO DEL CATÁLOGO
function eliminarProducto(id) {
  const inventario = JSON.parse(localStorage.getItem("techfix_inventario")) || [];
  const producto = inventario.find(p => p.id === id);
  if (!producto) return;

  if (confirm(`¿Estás seguro de eliminar "${producto.nombre}" del catálogo?`)) {
    const actualizado = inventario.filter(p => p.id !== id);
    localStorage.setItem("techfix_inventario", JSON.stringify(actualizado));
    cargarDashboard();
  }
}

// INICIALIZAR
verificarSesion();