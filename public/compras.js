/* =========================================================
   LUNAS DE OCTUBRE
   COMPRAS — JAVASCRIPT
   ========================================================= */

const API = "/api";


/* =========================================================
   ESTADO
   ========================================================= */

let proveedores = [];
let productos = [];
let filasCompra = [];

let compraGuardando = false;


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "🟢 COMPRAS.JS FUE CARGADO"
        );
        console.log(
            "========================================"
        );

        const autenticado =
            await verificarSesion();

        console.log(
            "🔐 Resultado autenticación:",
            autenticado
        );

        if (!autenticado) {

            console.log(
                "🚫 Compras: no se cargarán los datos."
            );

            return;
        }

        console.log(
            "✅ Compras: sesión confirmada."
        );

        establecerFechaActual();

        await cargarDatosIniciales();

        agregarProducto();

        await cargarCompras();

        actualizarResumen();

        console.log(
            "✅ Compras: inicialización completada."
        );

    }
);


/* =========================================================
   SESIÓN
   ========================================================= */

/* =========================================================
   SESIÓN SEGURA
   ========================================================= */

async function verificarSesion() {

    try {

        const respuesta =
            await fetch(
                "/api/auth/me",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );

        if (!respuesta.ok) {

            console.log(
                "🚫 Compras: sesión no válida."
            );

            window.location.replace(
                "/login.html"
            );

            return false;
        }

        const datos =
            await respuesta.json();

        if (
            !datos ||
            !datos.autenticado
        ) {

            console.log(
                "🚫 Compras: autenticación rechazada."
            );

            window.location.replace(
                "/login.html"
            );

            return false;
        }

        console.log(
            "✅ Compras: sesión válida."
        );

        return true;

    } catch (error) {

        console.error(
            "❌ Compras: error verificando sesión:",
            error
        );

        window.location.replace(
            "/login.html"
        );

        return false;
    }

}


/* =========================================================
   FECHA ACTUAL
   ========================================================= */

function establecerFechaActual() {

    const inputFecha =
        document.getElementById("fecha");

    if (!inputFecha) {
        return;
    }

    const ahora = new Date();

    const año = ahora.getFullYear();

    const mes =
        String(
            ahora.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            ahora.getDate()
        ).padStart(2, "0");

    inputFecha.value =
        `${año}-${mes}-${dia}`;

}


/* =========================================================
   DATOS INICIALES
   ========================================================= */

async function cargarDatosIniciales() {

    try {

        await Promise.all([
            cargarProveedores(),
            cargarProductos()
        ]);

    } catch (error) {

        console.error(
            "❌ Error cargando datos iniciales:",
            error
        );

        mostrarMensaje(
            "No fue posible cargar los datos necesarios para registrar la compra.",
            "error"
        );

    }

}


/* =========================================================
   PROVEEDORES
   ========================================================= */

async function cargarProveedores() {

    try {

        const respuesta =
            await fetch(
                `${API}/proveedores`
            );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                "No se pudieron cargar los proveedores."
            );
        }

        proveedores =
            Array.isArray(datos)
                ? datos
                : [];

        renderizarProveedores();

    } catch (error) {

        console.error(
            "❌ Error cargando proveedores:",
            error
        );

        throw error;
    }

}


/* =========================================================
   RENDER PROVEEDORES
   ========================================================= */

function renderizarProveedores() {

    const select =
        document.getElementById("proveedor");

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Selecciona un proveedor
        </option>
    `;

    proveedores.forEach(
        (proveedor) => {

            const option =
                document.createElement("option");

            option.value =
                proveedor.id;

            option.textContent =
                proveedor.nombre;

            select.appendChild(option);

        }
    );

}


/* =========================================================
   PRODUCTOS
   ========================================================= */

async function cargarProductos() {

    try {

        const respuesta =
            await fetch(
                `${API}/productos`
            );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                "No se pudieron cargar los productos."
            );
        }

        productos =
            Array.isArray(datos)
                ? datos
                : [];

    } catch (error) {

        console.error(
            "❌ Error cargando productos:",
            error
        );

        throw error;
    }

}


/* =========================================================
   AGREGAR PRODUCTO
   ========================================================= */

function agregarProducto() {

    const fila = {

        id:
            Date.now() +
            Math.random(),

        producto_id:
            "",

        cantidad:
            1,

        precio_compra:
            0

    };

    filasCompra.push(fila);

    renderizarProductosCompra();

    actualizarResumen();

}


/* =========================================================
   RENDERIZAR FILAS
   ========================================================= */

function renderizarProductosCompra() {

    const tbody =
        document.getElementById(
            "productosCompra"
        );

    const empty =
        document.getElementById(
            "emptyProducts"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (filasCompra.length === 0) {

        if (empty) {
            empty.hidden = false;
        }

        return;

    }

    if (empty) {
        empty.hidden = true;
    }


    filasCompra.forEach(
        (fila, indice) => {

            const tr =
                document.createElement("tr");

            tr.dataset.id =
                fila.id;


            /* =============================================
               PRODUCTO
               ============================================= */

            const tdProducto =
                document.createElement("td");

            const select =
                document.createElement("select");

            select.className =
                "product-select";

            select.innerHTML = `
                <option value="">
                    Selecciona un producto
                </option>
            `;

            productos.forEach(
                (producto) => {

                    const option =
                        document.createElement("option");

                    option.value =
                        producto.id;

                    option.textContent =
                        `${producto.nombre} — ${producto.codigo}`;

                    if (
                        String(
                            producto.id
                        ) ===
                        String(
                            fila.producto_id
                        )
                    ) {

                        option.selected =
                            true;

                    }

                    select.appendChild(
                        option
                    );

                }
            );

            select.addEventListener(
                "change",
                () => {

                    cambiarProducto(
                        indice,
                        select.value
                    );

                }
            );

            tdProducto.appendChild(
                select
            );


            /* =============================================
               CÓDIGO
               ============================================= */

            const tdCodigo =
                document.createElement("td");

            const productoSeleccionado =
                obtenerProducto(
                    fila.producto_id
                );

            tdCodigo.textContent =
                productoSeleccionado
                    ? productoSeleccionado.codigo
                    : "—";


            /* =============================================
               CANTIDAD
               ============================================= */

            const tdCantidad =
                document.createElement("td");

            const inputCantidad =
                document.createElement("input");

            inputCantidad.type =
                "number";

            inputCantidad.className =
                "table-input";

            inputCantidad.min =
                "1";

            inputCantidad.step =
                "1";

            inputCantidad.value =
                fila.cantidad;

            inputCantidad.addEventListener(
                "input",
                () => {

                    actualizarCantidad(
                        indice,
                        inputCantidad.value
                    );

                }
            );

            tdCantidad.appendChild(
                inputCantidad
            );


            /* =============================================
               PRECIO DE COMPRA
               ============================================= */

            const tdPrecio =
                document.createElement("td");

            const inputPrecio =
                document.createElement("input");

            inputPrecio.type =
                "number";

            inputPrecio.className =
                "table-input";

            inputPrecio.min =
                "0";

            inputPrecio.step =
                "1";

            inputPrecio.placeholder =
                "0";

            inputPrecio.value =
                fila.precio_compra > 0
                    ? fila.precio_compra
                    : "";

            inputPrecio.addEventListener(
                "input",
                () => {

                    actualizarPrecio(
                        indice,
                        inputPrecio.value
                    );

                }
            );

            tdPrecio.appendChild(
                inputPrecio
            );


            /* =============================================
               SUBTOTAL
               ============================================= */

            const tdSubtotal =
                document.createElement("td");

            tdSubtotal.className =
                "subtotal";

            const subtotal =
                calcularSubtotal(
                    fila
                );

            tdSubtotal.textContent =
                formatearMoneda(
                    subtotal
                );


            /* =============================================
               ACCIÓN
               ============================================= */

            const tdAccion =
                document.createElement("td");

            const botonEliminar =
                document.createElement("button");

            botonEliminar.type =
                "button";

            botonEliminar.className =
                "btn-remove";

            botonEliminar.title =
                "Eliminar producto";

            botonEliminar.textContent =
                "×";

            botonEliminar.addEventListener(
                "click",
                () => {

                    eliminarProducto(
                        indice
                    );

                }
            );

            tdAccion.appendChild(
                botonEliminar
            );


            /* =============================================
               AGREGAR CELDAS
               ============================================= */

            tr.appendChild(
                tdProducto
            );

            tr.appendChild(
                tdCodigo
            );

            tr.appendChild(
                tdCantidad
            );

            tr.appendChild(
                tdPrecio
            );

            tr.appendChild(
                tdSubtotal
            );

            tr.appendChild(
                tdAccion
            );

            tbody.appendChild(
                tr
            );

        }
    );

}


/* =========================================================
   OBTENER PRODUCTO
   ========================================================= */

function obtenerProducto(productoId) {

    if (!productoId) {
        return null;
    }

    return productos.find(
        (producto) =>
            String(producto.id) ===
            String(productoId)
    ) || null;

}


/* =========================================================
   CAMBIAR PRODUCTO
   ========================================================= */

function cambiarProducto(
    indice,
    productoId
) {

    const fila =
        filasCompra[indice];

    if (!fila) {
        return;
    }

    fila.producto_id =
        productoId;


    const producto =
        obtenerProducto(
            productoId
        );

    if (producto) {

        /*
         * Si el producto ya tiene un precio
         * de compra registrado, lo usamos
         * como valor inicial.
         */

        const precioCompra =
            Number(
                producto.precio_compra
            );

        if (
            Number.isFinite(
                precioCompra
            ) &&
            precioCompra > 0
        ) {

            fila.precio_compra =
                precioCompra;

        }

    } else {

        fila.precio_compra =
            0;

    }

    renderizarProductosCompra();

    actualizarResumen();

}


/* =========================================================
   ACTUALIZAR CANTIDAD
   ========================================================= */

function actualizarCantidad(
    indice,
    valor
) {

    const fila =
        filasCompra[indice];

    if (!fila) {
        return;
    }

    let cantidad =
        Number(valor);

    if (
        !Number.isFinite(cantidad) ||
        cantidad < 1
    ) {

        cantidad = 1;

    }

    cantidad =
        Math.floor(cantidad);

    fila.cantidad =
        cantidad;

    actualizarFilaVisual(
        indice
    );

    actualizarResumen();

}


/* =========================================================
   ACTUALIZAR PRECIO
   ========================================================= */

function actualizarPrecio(
    indice,
    valor
) {

    const fila =
        filasCompra[indice];

    if (!fila) {
        return;
    }

    let precio =
        Number(valor);

    if (
        !Number.isFinite(precio) ||
        precio < 0
    ) {

        precio = 0;

    }

    fila.precio_compra =
        precio;

    actualizarFilaVisual(
        indice
    );

    actualizarResumen();

}


/* =========================================================
   ACTUALIZAR FILA VISUAL
   ========================================================= */

function actualizarFilaVisual(
    indice
) {

    const tbody =
        document.getElementById(
            "productosCompra"
        );

    if (!tbody) {
        return;
    }

    const filas =
        tbody.querySelectorAll(
            "tr"
        );

    const tr =
        filas[indice];

    if (!tr) {
        return;
    }

    const fila =
        filasCompra[indice];

    const subtotal =
        calcularSubtotal(
            fila
        );

    const elementoSubtotal =
        tr.querySelector(
            ".subtotal"
        );

    if (elementoSubtotal) {

        elementoSubtotal.textContent =
            formatearMoneda(
                subtotal
            );

    }

}


/* =========================================================
   ELIMINAR PRODUCTO
   ========================================================= */

function eliminarProducto(
    indice
) {

    if (
        indice < 0 ||
        indice >= filasCompra.length
    ) {
        return;
    }

    filasCompra.splice(
        indice,
        1
    );

    renderizarProductosCompra();

    actualizarResumen();

}


/* =========================================================
   CALCULAR SUBTOTAL
   ========================================================= */

function calcularSubtotal(
    fila
) {

    const cantidad =
        Number(
            fila.cantidad
        );

    const precio =
        Number(
            fila.precio_compra
        );

    if (
        !Number.isFinite(cantidad) ||
        !Number.isFinite(precio)
    ) {
        return 0;
    }

    return cantidad * precio;

}


/* =========================================================
   CALCULAR TOTAL
   ========================================================= */

function calcularTotal() {

    return filasCompra.reduce(
        (
            total,
            fila
        ) => {

            return (
                total +
                calcularSubtotal(
                    fila
                )
            );

        },
        0
    );

}


/* =========================================================
   ACTUALIZAR RESUMEN
   ========================================================= */

function actualizarResumen() {

    const total =
        calcularTotal();


    const cantidadProductos =
        document.getElementById(
            "cantidadProductos"
        );

    const totalCompra =
        document.getElementById(
            "totalCompra"
        );


    if (cantidadProductos) {

        cantidadProductos.textContent =
            filasCompra.reduce(
                (
                    total,
                    fila
                ) => {

                    const cantidad =
                        Number(
                            fila.cantidad
                        );

                    return (
                        total +
                        (
                            Number.isFinite(
                                cantidad
                            )
                                ? cantidad
                                : 0
                        )
                    );

                },
                0
            );

    }


    if (totalCompra) {

        totalCompra.textContent =
            formatearMoneda(
                total
            );

    }

}


/* =========================================================
   FORMATEAR MONEDA
   ========================================================= */

function formatearMoneda(
    valor
) {

    const numero =
        Number(valor) || 0;

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(numero);

}


/* =========================================================
   GUARDAR COMPRA
   ========================================================= */

async function guardarCompra() {

    if (compraGuardando) {
        return;
    }


    /* =============================================
       PROVEEDOR
       ============================================= */

    const proveedorInput =
        document.getElementById(
            "proveedor"
        );

    const fechaInput =
        document.getElementById(
            "fecha"
        );

    const observacionesInput =
        document.getElementById(
            "observaciones"
        );


    const proveedorId =
        proveedorInput
            ? proveedorInput.value
            : "";

    const fecha =
        fechaInput
            ? fechaInput.value
            : "";

    const observaciones =
        observacionesInput
            ? observacionesInput.value.trim()
            : "";


    /* =============================================
       VALIDAR FECHA
       ============================================= */

    if (!fecha) {

        mostrarMensaje(
            "Selecciona la fecha de la compra.",
            "error"
        );

        return;

    }


    /* =============================================
       VALIDAR PRODUCTOS
       ============================================= */

    if (
        !Array.isArray(
            filasCompra
        ) ||
        filasCompra.length === 0
    ) {

        mostrarMensaje(
            "Debes agregar al menos un producto.",
            "error"
        );

        return;

    }


    for (
        let i = 0;
        i < filasCompra.length;
        i++
    ) {

        const fila =
            filasCompra[i];

        if (!fila.producto_id) {

            mostrarMensaje(
                `Selecciona un producto en la fila ${i + 1}.`,
                "error"
            );

            return;

        }

        const cantidad =
            Number(
                fila.cantidad
            );

        if (
            !Number.isInteger(
                cantidad
            ) ||
            cantidad <= 0
        ) {

            mostrarMensaje(
                `La cantidad del producto ${i + 1} debe ser un número entero mayor que cero.`,
                "error"
            );

            return;

        }

        const precio =
            Number(
                fila.precio_compra
            );

        if (
            !Number.isFinite(
                precio
            ) ||
            precio <= 0
        ) {

            mostrarMensaje(
                `El precio de compra del producto ${i + 1} debe ser mayor que cero.`,
                "error"
            );

            return;

        }

    }


    /* =============================================
       EVITAR PRODUCTOS REPETIDOS
       ============================================= */

    const productosSeleccionados =
        filasCompra.map(
            (fila) =>
                String(
                    fila.producto_id
                )
        );

    const productosUnicos =
        new Set(
            productosSeleccionados
        );

    if (
        productosUnicos.size !==
        productosSeleccionados.length
    ) {

        mostrarMensaje(
            "No puedes agregar el mismo producto más de una vez en la misma compra.",
            "error"
        );

        return;

    }


    /* =============================================
       PREPARAR DETALLES
       ============================================= */

    const detalles =
        filasCompra.map(
            (fila) => {

                return {

                    producto_id:
                        Number(
                            fila.producto_id
                        ),

                    cantidad:
                        Number(
                            fila.cantidad
                        ),

                    precio_compra:
                        Number(
                            fila.precio_compra
                        )

                };

            }
        );


    /* =============================================
       TOTAL
       ============================================= */

    const total =
        calcularTotal();

    if (
        !Number.isFinite(
            total
        ) ||
        total <= 0
    ) {

        mostrarMensaje(
            "El total de la compra debe ser mayor que cero.",
            "error"
        );

        return;

    }


    /* =============================================
       BOTÓN
       ============================================= */

    const boton =
        document.getElementById(
            "btnGuardar"
        );

    compraGuardando =
        true;

    if (boton) {

        boton.disabled =
            true;

        boton.innerHTML =
            `
                <span>
                    ⏳
                </span>
                Guardando...
            `;

    }


    try {

        const respuesta =
            await fetch(
                `${API}/compras`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            {
                                proveedor_id:
                                    proveedorId
                                        ? Number(
                                            proveedorId
                                        )
                                        : null,

                                fecha:
                                    fecha || null,

                                observaciones:
                                    observaciones ||
                                    null,

                                detalles

                            }
                        )
                }
            );


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                "No fue posible registrar la compra."
            );

        }


        /* =========================================
           ÉXITO
           ========================================= */

        mostrarMensaje(
            `Compra #${datos.compra.id} registrada correctamente. El inventario fue actualizado.`,
            "success"
        );


        limpiarFormularioCompra();


        await cargarCompras();


    } catch (error) {

        console.error(
            "❌ Error guardando compra:",
            error
        );

        mostrarMensaje(
            error.message ||
            "Ocurrió un error al registrar la compra.",
            "error"
        );

    } finally {

        compraGuardando =
            false;

        if (boton) {

            boton.disabled =
                false;

            boton.innerHTML =
                `
                    <span>
                        ✓
                    </span>
                    Guardar compra
                `;

        }

    }

}


/* =========================================================
   LIMPIAR FORMULARIO
   ========================================================= */

function limpiarCompra() {

    const confirmar =
        filasCompra.length > 0 &&
        filasCompra.some(
            (fila) =>
                fila.producto_id ||
                Number(
                    fila.precio_compra
                ) > 0
        );

    if (confirmar) {

        const aceptar =
            window.confirm(
                "¿Quieres limpiar los datos de la compra actual?"
            );

        if (!aceptar) {
            return;
        }

    }

    limpiarFormularioCompra();

}


/* =========================================================
   LIMPIAR FORMULARIO INTERNO
   ========================================================= */

function limpiarFormularioCompra() {

    const proveedor =
        document.getElementById(
            "proveedor"
        );

    const observaciones =
        document.getElementById(
            "observaciones"
        );


    if (proveedor) {
        proveedor.value = "";
    }

    if (observaciones) {
        observaciones.value = "";
    }


    establecerFechaActual();


    filasCompra = [];


    agregarProducto();


    actualizarResumen();

}


/* =========================================================
   CARGAR HISTORIAL
   ========================================================= */

async function cargarCompras() {

    const tbody =
        document.getElementById(
            "historialCompras"
        );

    const empty =
        document.getElementById(
            "emptyHistory"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = `
        <tr>
            <td
                colspan="6"
                style="
                    text-align:center;
                    padding:30px;
                    color:#64748b;
                "
            >
                Cargando compras...
            </td>
        </tr>
    `;


    try {

        const respuesta =
            await fetch(
                `${API}/compras`
            );

        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                "No se pudieron cargar las compras."
            );

        }


        const compras =
            Array.isArray(datos)
                ? datos
                : [];


        tbody.innerHTML = "";


        if (
            compras.length === 0
        ) {

            if (empty) {
                empty.hidden = false;
            }

            return;

        }


        if (empty) {
            empty.hidden = true;
        }


        compras.forEach(
            (compra) => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                /* ID */

                const tdId =
                    document.createElement(
                        "td"
                    );

                tdId.textContent =
                    `#${compra.id}`;


                /* FECHA */

                const tdFecha =
                    document.createElement(
                        "td"
                    );

                tdFecha.textContent =
                    formatearFecha(
                        compra.fecha
                    );


                /* PROVEEDOR */

                const tdProveedor =
                    document.createElement(
                        "td"
                    );

                tdProveedor.textContent =
                    compra.proveedor ||
                    "Sin proveedor";


                /* PRODUCTOS */

                const tdProductos =
                    document.createElement(
                        "td"
                    );

                tdProductos.textContent =
                    compra.cantidad_detalles ||
                    0;


                /* TOTAL */

                const tdTotal =
                    document.createElement(
                        "td"
                    );

                tdTotal.className =
                    "history-total";

                tdTotal.textContent =
                    formatearMoneda(
                        compra.total
                    );


                /* ACCIÓN */

                const tdAccion =
                    document.createElement(
                        "td"
                    );

                const boton =
                    document.createElement(
                        "button"
                    );

                boton.type =
                    "button";

                boton.className =
                    "btn-view";

                boton.textContent =
                    "Ver detalle";

                boton.addEventListener(
                    "click",
                    () => {

                        verDetalleCompra(
                            compra.id
                        );

                    }
                );

                tdAccion.appendChild(
                    boton
                );


                tr.appendChild(
                    tdId
                );

                tr.appendChild(
                    tdFecha
                );

                tr.appendChild(
                    tdProveedor
                );

                tr.appendChild(
                    tdProductos
                );

                tr.appendChild(
                    tdTotal
                );

                tr.appendChild(
                    tdAccion
                );


                tbody.appendChild(
                    tr
                );

            }
        );


    } catch (error) {

        console.error(
            "❌ Error cargando compras:",
            error
        );


        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#dc2626;
                    "
                >
                    ${escaparHTML(
                        error.message ||
                        "Error cargando compras."
                    )}
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   VER DETALLE
   ========================================================= */

async function verDetalleCompra(
    id
) {

    try {

        const respuesta =
            await fetch(
                `${API}/compras/${id}`
            );

        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                "No se pudo obtener el detalle."
            );

        }


        const compra =
            datos.compra;

        const detalles =
            Array.isArray(
                datos.detalles
            )
                ? datos.detalles
                : [];


        /* =============================================
           DATOS GENERALES
           ============================================= */

        document.getElementById(
            "detalleId"
        ).textContent =
            compra.id;


        document.getElementById(
            "detalleProveedor"
        ).textContent =
            compra.proveedor ||
            "Sin proveedor";


        document.getElementById(
            "detalleFecha"
        ).textContent =
            formatearFecha(
                compra.fecha
            );


        document.getElementById(
            "detalleObservaciones"
        ).textContent =
            compra.observaciones ||
            "Sin observaciones";


        /* =============================================
           PRODUCTOS
           ============================================= */

        const tbody =
            document.getElementById(
                "detalleProductos"
            );

        tbody.innerHTML = "";


        detalles.forEach(
            (detalle) => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                const tdProducto =
                    document.createElement(
                        "td"
                    );

                tdProducto.textContent =
                    detalle.producto ||
                    "Producto";


                const tdCodigo =
                    document.createElement(
                        "td"
                    );

                tdCodigo.textContent =
                    detalle.codigo ||
                    "—";


                const tdCantidad =
                    document.createElement(
                        "td"
                    );

                tdCantidad.textContent =
                    detalle.cantidad;


                const tdPrecio =
                    document.createElement(
                        "td"
                    );

                tdPrecio.textContent =
                    formatearMoneda(
                        detalle.precio_compra
                    );


                const tdSubtotal =
                    document.createElement(
                        "td"
                    );

                tdSubtotal.textContent =
                    formatearMoneda(
                        detalle.subtotal
                    );


                tr.appendChild(
                    tdProducto
                );

                tr.appendChild(
                    tdCodigo
                );

                tr.appendChild(
                    tdCantidad
                );

                tr.appendChild(
                    tdPrecio
                );

                tr.appendChild(
                    tdSubtotal
                );


                tbody.appendChild(
                    tr
                );

            }
        );


        /* =============================================
           TOTAL
           ============================================= */

        document.getElementById(
            "detalleTotal"
        ).textContent =
            formatearMoneda(
                compra.total
            );


        /* =============================================
           ABRIR MODAL
           ============================================= */

        const modal =
            document.getElementById(
                "modalDetalle"
            );

        if (modal) {
            modal.hidden = false;
        }


    } catch (error) {

        console.error(
            "❌ Error obteniendo detalle:",
            error
        );

        mostrarMensaje(
            error.message ||
            "No fue posible obtener el detalle de la compra.",
            "error"
        );

    }

}


/* =========================================================
   CERRAR DETALLE
   ========================================================= */

function cerrarDetalle() {

    const modal =
        document.getElementById(
            "modalDetalle"
        );

    if (modal) {
        modal.hidden = true;
    }

}


/* =========================================================
   CERRAR MODAL AL HACER CLICK AFUERA
   ========================================================= */

document.addEventListener(
    "click",
    (event) => {

        const modal =
            document.getElementById(
                "modalDetalle"
            );

        if (!modal) {
            return;
        }

        if (
            event.target === modal
        ) {

            cerrarDetalle();

        }

    }
);


/* =========================================================
   ESC PARA CERRAR MODAL
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
        ) {

            cerrarDetalle();

        }

    }
);


/* =========================================================
   MENSAJES
   ========================================================= */

function mostrarMensaje(
    texto,
    tipo = "success"
) {

    const mensaje =
        document.getElementById(
            "mensaje"
        );

    if (!mensaje) {
        return;
    }


    mensaje.hidden = false;

    mensaje.className =
        `mensaje ${tipo}`;

    mensaje.textContent =
        texto;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    clearTimeout(
        mostrarMensaje.timeout
    );


    mostrarMensaje.timeout =
        setTimeout(
            () => {

                mensaje.hidden = true;

            },
            5000
        );

}


/* =========================================================
   FORMATEAR FECHA
   ========================================================= */

function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "—";
    }


    const objetoFecha =
        new Date(
            fecha
        );


    if (
        Number.isNaN(
            objetoFecha.getTime()
        )
    ) {

        return String(
            fecha
        );

    }


    return objetoFecha.toLocaleDateString(
        "es-CO",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    );

}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escaparHTML(
    texto
) {

    return String(
        texto ?? ""
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
   VOLVER AL ADMIN
   ========================================================= */

function volverAdmin() {

    window.location.href =
        "/admin.html";

}