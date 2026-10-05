/* =========================================================
   LUNAS DE OCTUBRE — MÓDULO DE VENTAS
   ========================================================= */

"use strict";


/* =========================================================
   ESTADO
   ========================================================= */

let productos = [];

let carrito = [];

let productoSeleccionado = null;

let temporizadorNotificacion = null;


/* =========================================================
   ELEMENTOS
   ========================================================= */

const listaProductos =
    document.getElementById("listaProductos");

const buscarProducto =
    document.getElementById("buscarProducto");

const limpiarBusqueda =
    document.getElementById("limpiarBusqueda");

const contadorProductos =
    document.getElementById("contadorProductos");

const carritoElement =
    document.getElementById("carrito");

const totalUnidades =
    document.getElementById("totalUnidades");

const subtotalVenta =
    document.getElementById("subtotalVenta");

const totalVenta =
    document.getElementById("totalVenta");

const botonTotal =
    document.getElementById("botonTotal");

const btnRegistrarVenta =
    document.getElementById("btnRegistrarVenta");

const btnVaciarCarrito =
    document.getElementById("vaciarCarrito");

const metodoPago =
    document.getElementById("metodoPago");

const observaciones =
    document.getElementById("observaciones");

const fechaActual =
    document.getElementById("fechaActual");


/* =========================================================
   MODAL
   ========================================================= */

const modalCantidad =
    document.getElementById("modalCantidad");

const cerrarModal =
    document.getElementById("cerrarModal");

const modalProductoNombre =
    document.getElementById("modalProductoNombre");

const modalProductoInfo =
    document.getElementById("modalProductoInfo");

const cantidadProducto =
    document.getElementById("cantidadProducto");

const btnRestar =
    document.getElementById("btnRestar");

const btnSumar =
    document.getElementById("btnSumar");

const btnAgregarCantidad =
    document.getElementById("btnAgregarCantidad");


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

const notificacion =
    document.getElementById("notificacion");

const notificacionTitulo =
    document.getElementById("notificacionTitulo");

const notificacionMensaje =
    document.getElementById("notificacionMensaje");

const notificacionIcono =
    document.getElementById("notificacionIcono");


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciarVentas
);


async function iniciarVentas() {

    mostrarFecha();

    configurarEventos();

    await cargarProductos();

    renderizarCarrito();

}


/* =========================================================
   FECHA ACTUAL
   ========================================================= */

function mostrarFecha() {

    const ahora = new Date();

    fechaActual.textContent =
        ahora.toLocaleDateString(
            "es-CO",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}


/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventos() {

    buscarProducto.addEventListener(
        "input",
        filtrarProductos
    );


    limpiarBusqueda.addEventListener(
        "click",
        () => {

            buscarProducto.value = "";

            filtrarProductos();

            buscarProducto.focus();

        }
    );


    btnVaciarCarrito.addEventListener(
        "click",
        vaciarCarrito
    );


    btnRegistrarVenta.addEventListener(
        "click",
        registrarVenta
    );


    cerrarModal.addEventListener(
        "click",
        cerrarModalCantidad
    );


    btnRestar.addEventListener(
        "click",
        disminuirCantidadModal
    );


    btnSumar.addEventListener(
        "click",
        aumentarCantidadModal
    );


    btnAgregarCantidad.addEventListener(
        "click",
        confirmarCantidad
    );


    cantidadProducto.addEventListener(
        "input",
        validarCantidadModal
    );


    cantidadProducto.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                confirmarCantidad();

            }

        }
    );


    modalCantidad.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modalCantidad
            ) {

                cerrarModalCantidad();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modalCantidad.classList.contains(
                    "mostrar"
                )
            ) {

                cerrarModalCantidad();

            }

        }
    );

}


/* =========================================================
   CARGAR PRODUCTOS
   ========================================================= */

async function cargarProductos() {

    try {

        listaProductos.innerHTML = `
            <div class="estado-cargando">

                <div class="spinner"></div>

                <p>
                    Cargando productos...
                </p>

            </div>
        `;


        const respuesta =
            await fetch("/api/productos");


        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP ${respuesta.status}`
            );

        }


        const datos =
            await respuesta.json();


        if (!Array.isArray(datos)) {

            throw new Error(
                "La respuesta de productos no es válida."
            );

        }


        productos =
            datos.filter(
                producto =>
                    producto.activo !== false
            );


        contadorProductos.textContent =
            `${productos.length} ${
                productos.length === 1
                    ? "producto"
                    : "productos"
            }`;


        renderizarProductos();


    } catch (error) {

        console.error(
            "❌ Error cargando productos:",
            error
        );


        listaProductos.innerHTML = `
            <div class="estado-vacio">

                <strong>
                    No fue posible cargar los productos
                </strong>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>
        `;


        mostrarNotificacion(
            "Error",
            "No se pudieron cargar los productos.",
            "error"
        );

    }

}


/* =========================================================
   FILTRAR PRODUCTOS
   ========================================================= */

function filtrarProductos() {

    const texto =
        buscarProducto.value
            .trim()
            .toLowerCase();


    if (!texto) {

        renderizarProductos();

        return;

    }


    const filtrados =
        productos.filter(
            producto => {

                const nombre =
                    String(
                        producto.nombre || ""
                    ).toLowerCase();


                const codigo =
                    String(
                        producto.codigo || ""
                    ).toLowerCase();


                return (
                    nombre.includes(texto) ||
                    codigo.includes(texto)
                );

            }
        );


    renderizarProductos(
        filtrados
    );

}


/* =========================================================
   RENDERIZAR PRODUCTOS
   ========================================================= */

function renderizarProductos(
    productosMostrar = productos
) {

    if (
        !Array.isArray(
            productosMostrar
        ) ||
        productosMostrar.length === 0
    ) {

        listaProductos.innerHTML = `
            <div class="estado-vacio">

                <strong>
                    No se encontraron productos
                </strong>

                <p>
                    Intenta buscar por nombre o código.
                </p>

            </div>
        `;

        return;

    }


    listaProductos.innerHTML =
        productosMostrar
            .map(
                producto =>
                    crearTarjetaProducto(
                        producto
                    )
            )
            .join("");


    listaProductos
        .querySelectorAll(
            "[data-producto-id]"
        )
        .forEach(
            tarjeta => {

                tarjeta.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                tarjeta.dataset.productoId
                            );


                        seleccionarProducto(
                            id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   CREAR TARJETA DE PRODUCTO
   ========================================================= */

function crearTarjetaProducto(
    producto
) {

    const stock =
        obtenerStock(producto);


    const precio =
        obtenerPrecioVenta(producto);


    const sinStock =
        stock <= 0;


    let claseStock =
        "";


    let textoStock =
        `${stock} disponibles`;


    if (stock <= 0) {

        claseStock =
            "agotado";

        textoStock =
            "Agotado";

    } else if (
        producto.stock_minimo != null &&
        stock <= Number(producto.stock_minimo)
    ) {

        claseStock =
            "bajo";

    }


    const imagen =
        producto.imagen_url ||
        producto.imagen ||
        "";


    const imagenHTML =
        imagen
            ? `
                <img
                    src="${escapeAttribute(imagen)}"
                    alt="${escapeAttribute(
                        producto.nombre || "Producto"
                    )}"
                    loading="lazy"
                >
            `
            : `
                <div class="producto-imagen-placeholder">
                    ◇
                </div>
            `;


    return `
        <article
            class="producto-card ${
                sinStock
                    ? "sin-stock"
                    : ""
            }"
            data-producto-id="${
                Number(producto.id)
            }"
        >

            <div>

                <div class="producto-imagen">

                    ${imagenHTML}

                </div>

                <div class="producto-nombre">
                    ${escapeHtml(
                        producto.nombre ||
                        "Producto sin nombre"
                    )}
                </div>

                <div class="producto-codigo">
                    Código:
                    ${
                        escapeHtml(
                            producto.codigo ||
                            "Sin código"
                        )
                    }
                </div>

            </div>


            <div class="producto-footer">

                <strong class="producto-precio">
                    ${formatearMoneda(precio)}
                </strong>

                <span
                    class="producto-stock ${claseStock}"
                >
                    ${escapeHtml(textoStock)}
                </span>

            </div>

        </article>
    `;

}


/* =========================================================
   SELECCIONAR PRODUCTO
   ========================================================= */

function seleccionarProducto(
    id
) {

    const producto =
        productos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!producto) {

        mostrarNotificacion(
            "Error",
            "No se encontró el producto.",
            "error"
        );

        return;

    }


    const stock =
        obtenerStock(producto);


    if (stock <= 0) {

        mostrarNotificacion(
            "Sin stock",
            "Este producto no tiene unidades disponibles.",
            "error"
        );

        return;

    }


    productoSeleccionado =
        producto;


    const existente =
        carrito.find(
            item =>
                Number(item.producto_id) ===
                Number(producto.id)
        );


    const cantidadActual =
        existente
            ? Number(existente.cantidad)
            : 0;


    const disponible =
        stock - cantidadActual;


    if (disponible <= 0) {

        mostrarNotificacion(
            "Stock máximo",
            "Ya tienes todas las unidades disponibles de este producto en la venta.",
            "error"
        );

        return;

    }


    modalProductoNombre.textContent =
        producto.nombre ||
        "Producto";


    modalProductoInfo.textContent =
        `Stock disponible: ${disponible} unidades · Precio: ${formatearMoneda(
            obtenerPrecioVenta(producto)
        )}`;


    cantidadProducto.max =
        String(disponible);


    cantidadProducto.value =
        "1";


    btnAgregarCantidad.disabled =
        false;


    modalCantidad.classList.add(
        "mostrar"
    );


    setTimeout(
        () => {

            cantidadProducto.focus();

            cantidadProducto.select();

        },
        100
    );

}


/* =========================================================
   MODAL — CERRAR
   ========================================================= */

function cerrarModalCantidad() {

    modalCantidad.classList.remove(
        "mostrar"
    );

    productoSeleccionado =
        null;

}


/* =========================================================
   MODAL — RESTAR
   ========================================================= */

function disminuirCantidadModal() {

    let cantidad =
        Number(
            cantidadProducto.value
        ) || 1;


    cantidad--;

    if (cantidad < 1) {

        cantidad = 1;

    }


    cantidadProducto.value =
        String(cantidad);

    validarCantidadModal();

}


/* =========================================================
   MODAL — SUMAR
   ========================================================= */

function aumentarCantidadModal() {

    let cantidad =
        Number(
            cantidadProducto.value
        ) || 1;


    const maximo =
        Number(
            cantidadProducto.max
        ) || 1;


    cantidad++;


    if (cantidad > maximo) {

        cantidad = maximo;

    }


    cantidadProducto.value =
        String(cantidad);

    validarCantidadModal();

}


/* =========================================================
   MODAL — VALIDAR CANTIDAD
   ========================================================= */

function validarCantidadModal() {

    if (!productoSeleccionado) {

        return;

    }


    const stock =
        obtenerStock(
            productoSeleccionado
        );


    const existente =
        carrito.find(
            item =>
                Number(item.producto_id) ===
                Number(
                    productoSeleccionado.id
                )
        );


    const cantidadActual =
        existente
            ? Number(existente.cantidad)
            : 0;


    const disponible =
        stock - cantidadActual;


    let cantidad =
        Number(
            cantidadProducto.value
        );


    if (!Number.isInteger(cantidad)) {

        cantidad = 1;

    }


    if (cantidad < 1) {

        cantidad = 1;

    }


    if (cantidad > disponible) {

        cantidad =
            disponible;

    }


    cantidadProducto.value =
        String(cantidad);


    btnAgregarCantidad.disabled =
        disponible <= 0;

}


/* =========================================================
   CONFIRMAR CANTIDAD
   ========================================================= */

function confirmarCantidad() {

    if (!productoSeleccionado) {

        return;

    }


    const producto =
        productoSeleccionado;


    const stock =
        obtenerStock(producto);


    const existente =
        carrito.find(
            item =>
                Number(item.producto_id) ===
                Number(producto.id)
        );


    const cantidadActual =
        existente
            ? Number(existente.cantidad)
            : 0;


    const disponible =
        stock - cantidadActual;


    let cantidad =
        Number(
            cantidadProducto.value
        );


    if (
        !Number.isInteger(cantidad) ||
        cantidad < 1
    ) {

        mostrarNotificacion(
            "Cantidad inválida",
            "Ingresa una cantidad válida.",
            "error"
        );

        return;

    }


    if (cantidad > disponible) {

        mostrarNotificacion(
            "Stock insuficiente",
            `Solo hay ${disponible} unidades disponibles.`,
            "error"
        );

        return;

    }


    if (existente) {

        existente.cantidad +=
            cantidad;

    } else {

        carrito.push({

            producto_id:
                Number(producto.id),

            nombre:
                producto.nombre,

            codigo:
                producto.codigo,

            precio_venta:
                obtenerPrecioVenta(
                    producto
                ),

            stock:
                stock,

            cantidad:
                cantidad

        });

    }


    cerrarModalCantidad();

    renderizarCarrito();

}


/* =========================================================
   RENDERIZAR CARRITO
   ========================================================= */

function renderizarCarrito() {

    if (carrito.length === 0) {

        carritoElement.innerHTML = `
            <div class="carrito-vacio">

                <div class="carrito-icono">
                    🛒
                </div>

                <h3>
                    No hay productos
                </h3>

                <p>
                    Selecciona un producto para comenzar la venta.
                </p>

            </div>
        `;

        actualizarTotales();

        return;

    }


    carritoElement.innerHTML =
        carrito
            .map(
                (item, index) =>
                    crearItemCarrito(
                        item,
                        index
                    )
            )
            .join("");


    carritoElement
        .querySelectorAll(
            "[data-accion-carrito]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        const accion =
                            boton.dataset.accionCarrito;

                        const index =
                            Number(
                                boton.dataset.index
                            );


                        ejecutarAccionCarrito(
                            accion,
                            index
                        );

                    }
                );

            }
        );


    actualizarTotales();

}


/* =========================================================
   ITEM CARRITO
   ========================================================= */

function crearItemCarrito(
    item,
    index
) {

    const subtotal =
        Number(item.precio_venta) *
        Number(item.cantidad);


    return `
        <div class="carrito-item">

            <div>

                <div class="carrito-item-nombre">
                    ${escapeHtml(
                        item.nombre
                    )}
                </div>

                <div class="carrito-item-precio">

                    ${formatearMoneda(
                        item.precio_venta
                    )}

                    × unidad

                    ${
                        item.codigo
                            ? ` · ${escapeHtml(
                                item.codigo
                            )}`
                            : ""
                    }

                </div>

            </div>


            <div class="carrito-item-derecha">

                <strong class="carrito-item-subtotal">
                    ${formatearMoneda(
                        subtotal
                    )}
                </strong>


                <div class="cantidad-mini">

                    <button
                        type="button"
                        data-accion-carrito="restar"
                        data-index="${index}"
                        title="Disminuir"
                    >
                        −
                    </button>

                    <span>
                        ${item.cantidad}
                    </span>

                    <button
                        type="button"
                        data-accion-carrito="sumar"
                        data-index="${index}"
                        title="Aumentar"
                    >
                        +
                    </button>

                </div>


                <button
                    type="button"
                    class="btn-eliminar-item"
                    data-accion-carrito="eliminar"
                    data-index="${index}"
                >
                    Eliminar
                </button>

            </div>

        </div>
    `;

}


/* =========================================================
   ACCIONES DEL CARRITO
   ========================================================= */

function ejecutarAccionCarrito(
    accion,
    index
) {

    const item =
        carrito[index];


    if (!item) {

        return;

    }


    if (accion === "eliminar") {

        carrito.splice(
            index,
            1
        );

        renderizarCarrito();

        return;

    }


    if (accion === "restar") {

        item.cantidad--;

        if (item.cantidad <= 0) {

            carrito.splice(
                index,
                1
            );

        }

        renderizarCarrito();

        return;

    }


    if (accion === "sumar") {

        const producto =
            productos.find(
                producto =>
                    Number(producto.id) ===
                    Number(item.producto_id)
            );


        if (!producto) {

            return;

        }


        const stock =
            obtenerStock(producto);


        if (
            Number(item.cantidad) >=
            stock
        ) {

            mostrarNotificacion(
                "Stock máximo",
                `Solo hay ${stock} unidades disponibles.`,
                "error"
            );

            return;

        }


        item.cantidad++;

        renderizarCarrito();

    }

}


/* =========================================================
   VACIAR CARRITO
   ========================================================= */

function vaciarCarrito() {

    if (carrito.length === 0) {

        return;

    }


    const confirmar =
        window.confirm(
            "¿Quieres vaciar todos los productos de la venta?"
        );


    if (!confirmar) {

        return;

    }


    carrito = [];

    renderizarCarrito();

}


/* =========================================================
   ACTUALIZAR TOTALES
   ========================================================= */

function actualizarTotales() {

    let unidades = 0;

    let total = 0;


    carrito.forEach(
        item => {

            const cantidad =
                Number(
                    item.cantidad
                ) || 0;


            const precio =
                Number(
                    item.precio_venta
                ) || 0;


            unidades +=
                cantidad;


            total +=
                cantidad * precio;

        }
    );


    totalUnidades.textContent =
        String(unidades);


    subtotalVenta.textContent =
        formatearMoneda(total);


    totalVenta.textContent =
        formatearMoneda(total);


    botonTotal.textContent =
        formatearMoneda(total);


    btnRegistrarVenta.disabled =
        carrito.length === 0;

}


/* =========================================================
   REGISTRAR VENTA
   ========================================================= */

async function registrarVenta() {

    if (carrito.length === 0) {

        mostrarNotificacion(
            "Venta vacía",
            "Agrega al menos un producto.",
            "error"
        );

        return;

    }


    const detalles =
        carrito.map(
            item => ({

                producto_id:
                    Number(
                        item.producto_id
                    ),

                cantidad:
                    Number(
                        item.cantidad
                    )

            })
        );


    const datosVenta = {

        metodo_pago:
            metodoPago.value,

        observaciones:
            observaciones.value.trim(),

        detalles

    };


    const confirmar =
        window.confirm(
            `¿Confirmar venta por ${totalVenta.textContent}?`
        );


    if (!confirmar) {

        return;

    }


    const textoOriginal =
        btnRegistrarVenta.innerHTML;


    btnRegistrarVenta.disabled =
        true;


    btnRegistrarVenta.innerHTML = `
        <span>
            Registrando venta...
        </span>

        <strong>
            ...
        </strong>
    `;


    try {

        const respuesta =
            await fetch(
                "/api/ventas",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            datosVenta
                        )

                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                "No fue posible registrar la venta."
            );

        }


        mostrarNotificacion(
            "Venta registrada",
            `La venta #${resultado.venta.id} fue registrada correctamente.`,
            "success"
        );


        carrito = [];

        observaciones.value = "";

        metodoPago.value =
            "Efectivo";


        renderizarCarrito();


        await cargarProductos();


    } catch (error) {

        console.error(
            "❌ Error registrando venta:",
            error
        );


        mostrarNotificacion(
            "No se pudo registrar",
            error.message,
            "error"
        );


    } finally {

        btnRegistrarVenta.innerHTML =
            textoOriginal;


        actualizarTotales();

    }

}


/* =========================================================
   OBTENER STOCK
   ========================================================= */

function obtenerStock(
    producto
) {

    const stock =
        Number(
            producto?.cantidad
        );


    if (
        !Number.isFinite(stock)
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.floor(stock)
    );

}


/* =========================================================
   OBTENER PRECIO DE VENTA
   ========================================================= */

function obtenerPrecioVenta(
    producto
) {

    const precio =
        Number(
            producto?.precio_venta
        );


    if (
        Number.isFinite(precio) &&
        precio >= 0
    ) {

        return precio;

    }


    const precioAlternativo =
        Number(
            producto?.precio
        );


    if (
        Number.isFinite(
            precioAlternativo
        )
    ) {

        return precioAlternativo;

    }


    return 0;

}


/* =========================================================
   FORMATO MONEDA
   ========================================================= */

function formatearMoneda(
    valor
) {

    const numero =
        Number(valor) || 0;


    return numero.toLocaleString(
        "es-CO",
        {

            style: "currency",

            currency: "COP",

            maximumFractionDigits: 0

        }
    );

}


/* =========================================================
   NOTIFICACIÓN
   ========================================================= */

function mostrarNotificacion(
    titulo,
    mensaje,
    tipo = "success"
) {

    clearTimeout(
        temporizadorNotificacion
    );


    notificacionTitulo.textContent =
        titulo;


    notificacionMensaje.textContent =
        mensaje;


    notificacion.classList.remove(
        "error"
    );


    if (tipo === "error") {

        notificacion.classList.add(
            "error"
        );

        notificacionIcono.textContent =
            "×";

    } else {

        notificacionIcono.textContent =
            "✓";

    }


    notificacion.classList.add(
        "mostrar"
    );


    temporizadorNotificacion =
        setTimeout(
            () => {

                notificacion.classList.remove(
                    "mostrar"
                );

            },
            4500
        );

}


/* =========================================================
   SEGURIDAD — HTML
   ========================================================= */

function escapeHtml(
    valor
) {

    return String(
        valor ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   SEGURIDAD — ATRIBUTOS
   ========================================================= */

function escapeAttribute(
    valor
) {

    return escapeHtml(
        valor
    );

}