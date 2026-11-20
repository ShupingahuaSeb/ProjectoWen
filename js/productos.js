// BASE DE DATOS LOCAL DE PRODUCTOS
const catalogoProductos = [
  {
    id: 1,
    nombre: "SSD NVMe M.2 Kingston 500GB",
    categoria: "almacenamiento",
    etiqueta: "Almacenamiento",
    icono: "💾",
    descripcion: "Lectura hasta 3500 MB/s. Ideal para acelerar el arranque de laptops y PCs.",
    precio: 165.00
  },
  {
    id: 2,
    nombre: "SSD SATA Crucial BX500 480GB",
    categoria: "almacenamiento",
    etiqueta: "Almacenamiento",
    icono: "💽",
    descripcion: "Reemplazo directo para discos duros mecánicos lentos en laptops antiguas.",
    precio: 145.00
  },
  {
    id: 3,
    nombre: "Memoria RAM DDR4 8GB 3200MHz",
    categoria: "memoria",
    etiqueta: "Memoria RAM",
    icono: "📟",
    descripcion: "Módulo SODIMM para laptop. Mejora la multitarea y fluidez del sistema.",
    precio: 95.00
  },
  {
    id: 4,
    nombre: "Memoria RAM DDR4 16GB (2x8GB) PC",
    categoria: "memoria",
    etiqueta: "Memoria RAM",
    icono: "⚡",
    descripcion: "Kit Dual Channel con disipador de aluminio para computadoras de escritorio.",
    precio: 185.00
  },
  {
    id: 5,
    nombre: "Pasta Térmica Arctic MX-4 (4g)",
    categoria: "refrigeracion",
    etiqueta: "Refrigeración",
    icono: "❄️",
    descripcion: "Alta conductividad térmica sin metal. Reduce hasta 10°C en procesador y GPU.",
    precio: 38.00
  },
  {
    id: 6,
    nombre: "Base Refrigerante Laptop 5 Ventiladores",
    categoria: "refrigeracion",
    etiqueta: "Refrigeración",
    icono: "🌀",
    descripcion: "Soporte ergonómico ajustable con iluminación LED azul y doble puerto USB.",
    precio: 75.00
  },
  {
    id: 7,
    nombre: "Cargador Original Laptop 65W Punta Azul",
    categoria: "accesorios",
    etiqueta: "Accesorios",
    icono: "🔌",
    descripcion: "Incluye cable trébol de poder y protección contra sobrecargas eléctricas.",
    precio: 89.00
  },
  {
    id: 8,
    nombre: "Adaptador Caddy HDD/SSD 9.5mm",
    categoria: "accesorios",
    etiqueta: "Accesorios",
    icono: "🛠️",
    descripcion: "Permite instalar un segundo disco duro en la bahía lectora de tu laptop.",
    precio: 29.00
  }
];

// ESTADO DE LA APLICACIÓN
let categoriaActual = "todos";
let textoBusqueda = "";
let cotizacion = JSON.parse(localStorage.getItem("techfix_cotizacion")) || [];

// ELEMENTOS DEL DOM
const gridProductos = document.getElementById("grid-productos");
const botonesFiltro = document.querySelectorAll(".filter-btn");
const inputBuscador = document.getElementById("buscador-productos");
const listaCotizacion = document.getElementById("lista-cotizacion");
const contadorItems = document.getElementById("contador-items");
const totalCotizacion = document.getElementById("total-cotizacion");
const btnEnviarCita = document.getElementById("btn-enviar-cita");
const btnVaciar = document.getElementById("btn-vaciar");

// RENDERIZAR TARJETAS DE PRODUCTOS
function renderizarProductos() {
  const filtrados = catalogoProductos.filter((prod) => {
    const coincideCat = categoriaActual === "todos" || prod.categoria === categoriaActual;
    const coincideTexto = prod.nombre.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
                          prod.descripcion.toLowerCase().includes(textoBusqueda.toLowerCase());
    return coincideCat && coincideTexto;
  });

  if (filtrados.length === 0) {
    gridProductos.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">No se encontraron productos con ese criterio.</p>`;
    return;
  }

  gridProductos.innerHTML = filtrados.map((prod) => `
    <article class="product-card">
      <div class="product-visual">${prod.icono}</div>
      <span class="product-cat">${prod.etiqueta}</span>
      <h3>${prod.nombre}</h3>
      <p>${prod.descripcion}</p>
      <div class="product-bottom">
        <span class="product-price">S/ ${prod.precio.toFixed(2)}</span>
        <button class="btn-add" onclick="agregarACotizacion(${prod.id})">+ Agregar</button>
      </div>
    </article>
  `).join("");
}

// AGREGAR PRODUCTO A LA COTIZACIÓN
function agregarACotizacion(id) {
  const producto = catalogoProductos.find((p) => p.id === id);
  const existente = cotizacion.find((item) => item.id === id);

  if (existente) {
    existente.cantidad += 1;
  } else {
    cotizacion.push({ ...producto, cantidad: 1 });
  }

  guardarYActualizarCotizacion();
}

// ELIMINAR ÍTEM DE LA COTIZACIÓN
function eliminarDeCotizacion(id) {
  cotizacion = cotizacion.filter((item) => item.id !== id);
  guardarYActualizarCotizacion();
}

// GUARDAR EN LOCALSTORAGE Y ACTUALIZAR PANEL LATERAL
function guardarYActualizarCotizacion() {
  localStorage.setItem("techfix_cotizacion", JSON.stringify(cotizacion));

  const totalUnidades = cotizacion.reduce((acc, item) => acc + item.cantidad, 0);
  const sumaTotal = cotizacion.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  contadorItems.textContent = `${totalUnidades} ${totalUnidades === 1 ? "ítem" : "ítems"}`;
  totalCotizacion.textContent = `S/ ${sumaTotal.toFixed(2)}`;

  if (cotizacion.length === 0) {
    listaCotizacion.innerHTML = `<p class="empty-msg">Aún no has agregado productos. Haz clic en "+ Agregar" en cualquier componente.</p>`;
    btnEnviarCita.disabled = true;
    btnVaciar.style.display = "none";
  } else {
    listaCotizacion.innerHTML = cotizacion.map((item) => `
      <div class="quote-item">
        <div class="quote-item-info">
          <strong>${item.nombre}</strong>
          <span>${item.cantidad} x S/ ${item.precio.toFixed(2)}</span>
        </div>
        <button class="btn-remove" onclick="eliminarDeCotizacion(${item.id})" title="Quitar">×</button>
      </div>
    `).join("");
    btnEnviarCita.disabled = false;
    btnVaciar.style.display = "block";
  }
}

// EVENTOS DE FILTRO Y BÚSQUEDA
botonesFiltro.forEach((btn) => {
  btn.addEventListener("click", () => {
    botonesFiltro.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    categoriaActual = btn.dataset.categoria;
    renderizarProductos();
  });
});

inputBuscador.addEventListener("input", (e) => {
  textoBusqueda = e.target.value;
  renderizarProductos();
});

btnVaciar.addEventListener("click", () => {
  cotizacion = [];
  guardarYActualizarCotizacion();
});

btnEnviarCita.addEventListener("click", () => {
  window.location.href = "citas.html";
});

// INICIALIZAR AL CARGAR LA PÁGINA
renderizarProductos();
guardarYActualizarCotizacion();