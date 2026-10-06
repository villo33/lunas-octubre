/* =========================================================
   LUNAS DE OCTUBRE — INVENTARIO
   ========================================================= */

"use strict";


/* =========================================================
   VARIABLES
   ========================================================= */

let inventario = [];
let movimientos = [];

let filtroInventarioActual = "TODOS";
let filtroMovimientoActual = "TODOS";

let temporizadorBusqueda = null;


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
            "🟢 INVENTARIO.JS FUE CARGADO"
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
                "🚫 Inventario: no se cargarán los datos."
            );

            return;
        }

        console.log(
            "✅ Inventario: sesión confirmada."
        );

        mostrarFecha();

        configurarBusqueda();

        await cargarInventario();

        await cargarMovimientos();

        console.log(
            "✅ Inventario: inicialización completada."
        );

    }
);
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
                "🚫 Inventario: sesión no válida."
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
                "🚫 Inventario: autenticación rechazada."
            );

            window.location.replace(
                "/login.html"
            );

            return false;
        }

        console.log(
            "✅ Inventario: sesión válida."
        );

        return true;

    } catch (error) {

        console.error(
            "❌ Inventario: error verificando sesión:",
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

function mostrarFecha() {

    const elemento =
        document.getElementById(
            "fechaActual"
        );

    if (!elemento) {
        return;
    }

    const fecha =
        new Date();

    elemento.textContent =
        fecha.toLocaleDateString(
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
   CARGAR INVENTARIO
   ========================================================= */

async function cargarInventario() {

    const tabla =
        document.getElementById(
            "tablaInventario"
        );

    if (tabla) {

        tabla.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="estado-tabla"
                >
                    Cargando inventario...
                </td>
            </tr>
        `;

    }

    try {

        const respuesta =
            await fetch(
                "/api/inventario"
            );


        if (!respuesta.ok) {

            throw new Error(
                "No fue posible obtener el inventario."
            );

        }


        const datos =
            await respuesta.json();


        if (!Array.isArray(datos)) {

            throw new Error(
                "La respuesta del servidor no tiene un formato válido."
            );

        }


        inventario = datos;


        actualizarResumen();

        mostrarAlertas();

        renderizarInventario();

    } catch (error) {

        console.error(
            "❌ Error cargando inventario:",
            error
        );


        if (tabla) {

            tabla.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="estado-tabla"
                    >
                        No fue posible cargar el inventario.
                    </td>
                </tr>
            `;

        }


        mostrarNotificacion(
            "Error",
            error.message ||
                "No fue posible cargar el inventario.",
            "error"
        );

    }

}


/* =========================================================
   CARGAR MOVIMIENTOS
   ========================================================= */

async function cargarMovimientos() {

    const tabla =
        document.getElementById(
            "tablaMovimientos"
        );


    if (tabla) {

        tabla.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="estado-tabla"
                >
                    Cargando movimientos...
                </td>
            </tr>
        `;

    }


    console.log("");
    console.log(
        "========================================"
    );
    console.log(
        "📦 CARGANDO MOVIMIENTOS"
    );
    console.log(
        "========================================"
    );


    try {

        const respuesta =
            await fetch(
                "/api/inventario/movimientos",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );


        console.log(
            "📡 Status movimientos:",
            respuesta.status
        );

        console.log(
            "📡 OK movimientos:",
            respuesta.ok
        );


        const texto =
            await respuesta.text();


        console.log(
            "📄 Respuesta movimientos:",
            texto
        );


        if (!respuesta.ok) {

            throw new Error(
                `Servidor respondió ${respuesta.status}: ${texto || "sin respuesta"}`
            );

        }


        let datos;

        try {

            datos =
                JSON.parse(texto);

        } catch (error) {

            console.error(
                "❌ La respuesta no es JSON válido."
            );

            throw new Error(
                "El servidor devolvió una respuesta inválida."
            );

        }


        console.log(
            "📦 Datos movimientos:",
            datos
        );


        if (!Array.isArray(datos)) {

            throw new Error(
                "La respuesta de movimientos no tiene un formato válido."
            );

        }


        movimientos =
            datos;


        console.log(
            "🔢 Movimientos recibidos:",
            movimientos.length
        );


        renderizarMovimientos();


        console.log(
            "✅ Movimientos cargados correctamente."
        );

        console.log(
            "========================================"
        );


    } catch (error) {

        console.error(
            "❌ Error cargando movimientos:",
            error
        );


        if (tabla) {

            tabla.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="estado-tabla"
                    >
                        No fue posible cargar los movimientos.
                    </td>
                </tr>
            `;

        }


        mostrarNotificacion(
            "Error",
            error.message ||
                "No fue posible cargar los movimientos.",
            "error"
        );

    }

}

/* =========================================================
   RESUMEN
   ========================================================= */

function actualizarResumen() {

    const totalProductos =
        inventario.length;


    const totalUnidades =
        inventario.reduce(
            (total, producto) => {

                return (
                    total +
                    convertirNumero(
                        producto.cantidad
                    )
                );

            },
            0
        );


    const productosBajos =
        inventario.filter(
            producto =>
                producto.estado_stock ===
                "BAJO"
        ).length;


    const productosAgotados =
        inventario.filter(
            producto =>
                producto.estado_stock ===
                "AGOTADO"
        ).length;


    establecerTexto(
        "totalProductos",
        formatearNumero(
            totalProductos
        )
    );


    establecerTexto(
        "totalUnidades",
        formatearNumero(
            totalUnidades
        )
    );


    establecerTexto(
        "productosBajos",
        formatearNumero(
            productosBajos
        )
    );


    establecerTexto(
        "productosAgotados",
        formatearNumero(
            productosAgotados
        )
    );

}


/* =========================================================
   MOSTRAR ALERTAS
   ========================================================= */

function mostrarAlertas() {

    const panel =
        document.getElementById(
            "panelAlertas"
        );

    const lista =
        document.getElementById(
            "listaAlertas"
        );

    const texto =
        document.getElementById(
            "textoAlertas"
        );


    if (!panel || !lista || !texto) {
        return;
    }


    const alertas =
        inventario
            .filter(
                producto =>
                    producto.estado_stock ===
                    "BAJO" ||
                    producto.estado_stock ===
                    "AGOTADO"
            )
            .sort(
                (a, b) =>
                    convertirNumero(
                        a.cantidad
                    ) -
                    convertirNumero(
                        b.cantidad
                    )
            );


    if (alertas.length === 0) {

        texto.textContent =
            "No hay productos con stock bajo.";

        lista.innerHTML = "";

        return;

    }


    const agotados =
        alertas.filter(
            producto =>
                producto.estado_stock ===
                "AGOTADO"
        ).length;


    const bajos =
        alertas.filter(
            producto =>
                producto.estado_stock ===
                "BAJO"
        ).length;


    if (
        agotados > 0 &&
        bajos > 0
    ) {

        texto.textContent =
            `${agotados} producto(s) agotado(s) y ${bajos} con stock bajo.`;

    } else if (agotados > 0) {

        texto.textContent =
            `${agotados} producto(s) agotado(s).`;

    } else {

        texto.textContent =
            `${bajos} producto(s) con stock bajo.`;

    }


    lista.innerHTML =
        alertas
            .slice(0, 8)
            .map(
                producto => {

                    const cantidad =
                        convertirNumero(
                            producto.cantidad
                        );

                    const minimo =
                        convertirNumero(
                            producto.stock_minimo
                        );

                    return `
                        <div class="alerta-producto">

                            <span
                                class="alerta-producto-nombre"
                                title="${escaparHTML(producto.nombre)}"
                            >
                                ${escaparHTML(producto.nombre)}
                            </span>

                            <span class="alerta-producto-stock">
                                ${cantidad} / ${minimo}
                            </span>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   RENDERIZAR INVENTARIO
   ========================================================= */

function renderizarInventario() {

    const tabla =
        document.getElementById(
            "tablaInventario"
        );

    const vacio =
        document.getElementById(
            "inventarioVacio"
        );

    const contador =
        document.getElementById(
            "contadorInventario"
        );


    if (!tabla) {
        return;
    }


    const textoBusqueda =
        obtenerTextoBusqueda();


    const productosFiltrados =
        inventario.filter(
            producto => {

                const coincideFiltro =
                    filtroInventarioActual ===
                    "TODOS" ||
                    producto.estado_stock ===
                    filtroInventarioActual;


                const nombre =
                    String(
                        producto.nombre ||
                        ""
                    ).toLowerCase();


                const codigo =
                    String(
                        producto.codigo ||
                        ""
                    ).toLowerCase();


                const coincideBusqueda =
                    !textoBusqueda ||
                    nombre.includes(
                        textoBusqueda
                    ) ||
                    codigo.includes(
                        textoBusqueda
                    );


                return (
                    coincideFiltro &&
                    coincideBusqueda
                );

            }
        );


    if (contador) {

        contador.textContent =
            `${productosFiltrados.length} ${
                productosFiltrados.length === 1
                    ? "producto"
                    : "productos"
            }`;

    }


    if (
        productosFiltrados.length ===
        0
    ) {

        tabla.innerHTML = "";

        if (vacio) {
            vacio.classList.remove(
                "oculto"
            );
        }

        return;

    }


    if (vacio) {
        vacio.classList.add(
            "oculto"
        );
    }


    tabla.innerHTML =
        productosFiltrados
            .map(
                producto =>
                    crearFilaInventario(
                        producto
                    )
            )
            .join("");

}


/* =========================================================
   CREAR FILA DE INVENTARIO
   ========================================================= */

function crearFilaInventario(
    producto
) {

    const cantidad =
        convertirNumero(
            producto.cantidad
        );


    const stockMinimo =
        convertirNumero(
            producto.stock_minimo
        );


    const estado =
        producto.estado_stock ||
        calcularEstadoStock(
            cantidad,
            stockMinimo
        );


    const claseStock =
        obtenerClaseStock(
            estado
        );


    const claseEstado =
        obtenerClaseEstado(
            estado
        );


    const imagen =
        producto.imagen ||
        producto.imagen_url ||
        "";


    const imagenHTML =
        imagen
            ? `
                <img
                    src="${escaparHTML(imagen)}"
                    alt="${escaparHTML(producto.nombre)}"
                    class="producto-imagen"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                    class="producto-sin-imagen"
                    style="display:none;"
                >
                    📦
                </div>
            `
            : `
                <div class="producto-sin-imagen">
                    📦
                </div>
            `;


    return `
        <tr>

            <td>

                <div class="producto-celda">

                    ${imagenHTML}

                    <div class="producto-datos">

                        <div
                            class="producto-nombre"
                            title="${escaparHTML(producto.nombre)}"
                        >
                            ${escaparHTML(producto.nombre)}
                        </div>

                        ${
                            producto.descripcion
                                ? `
                                    <div
                                        class="producto-descripcion"
                                        title="${escaparHTML(producto.descripcion)}"
                                    >
                                        ${escaparHTML(producto.descripcion)}
                                    </div>
                                `
                                : ""
                        }

                    </div>

                </div>

            </td>


            <td>

                <span class="codigo">
                    ${escaparHTML(
                        producto.codigo ||
                        "Sin código"
                    )}
                </span>

            </td>


            <td>
                ${formatearMoneda(
                    producto.precio_compra
                )}
            </td>


            <td>
                ${formatearMoneda(
                    producto.precio_venta
                )}
            </td>


            <td>

                <span
                    class="stock-numero ${claseStock}"
                >
                    ${formatearNumero(
                        cantidad
                    )}
                </span>

            </td>


            <td>
                ${formatearNumero(
                    stockMinimo
                )}
            </td>


            <td>

                <span
                    class="estado-badge ${claseEstado}"
                >
                    ${textoEstado(
                        estado
                    )}
                </span>

            </td>

        </tr>
    `;

}


/* =========================================================
   RENDERIZAR MOVIMIENTOS
   ========================================================= */

function renderizarMovimientos() {

    const tabla =
        document.getElementById(
            "tablaMovimientos"
        );

    const vacio =
        document.getElementById(
            "movimientosVacios"
        );


    if (!tabla) {
        return;
    }


    const movimientosFiltrados =
        movimientos.filter(
            movimiento => {

                return (
                    filtroMovimientoActual ===
                    "TODOS" ||
                    String(
                        movimiento.tipo ||
                        ""
                    ).toUpperCase() ===
                    filtroMovimientoActual
                );

            }
        );


    if (
        movimientosFiltrados.length ===
        0
    ) {

        tabla.innerHTML = "";

        if (vacio) {
            vacio.classList.remove(
                "oculto"
            );
        }

        return;

    }


    if (vacio) {
        vacio.classList.add(
            "oculto"
        );
    }


    tabla.innerHTML =
        movimientosFiltrados
            .map(
                movimiento =>
                    crearFilaMovimiento(
                        movimiento
                    )
            )
            .join("");

}


/* =========================================================
   CREAR FILA DE MOVIMIENTO
   ========================================================= */

function crearFilaMovimiento(
    movimiento
) {

    const tipo =
        String(
            movimiento.tipo ||
            ""
        ).toUpperCase();


    const esCompra =
        tipo === "COMPRA";


    const claseMovimiento =
        esCompra
            ? "entrada"
            : "salida";


    const claseCantidad =
        esCompra
            ? "cantidad-entrada"
            : "cantidad-salida";


    const signo =
        esCompra
            ? "+"
            : "-";


    const fecha =
        formatearFechaHora(
            movimiento.created_at
        );


    const referenciaTipo =
        movimiento.referencia_tipo ||
        "";


    const referenciaId =
        movimiento.referencia_id;


    let referencia =
        "—";


    if (
        referenciaTipo &&
        referenciaId !== null &&
        referenciaId !== undefined
    ) {

        referencia =
            `${referenciaTipo} #${referenciaId}`;

    } else if (
        referenciaTipo
    ) {

        referencia =
            referenciaTipo;

    }


    return `
        <tr>

            <td>

                <span class="movimiento-fecha">
                    ${fecha}
                </span>

            </td>


            <td>

                <div class="movimiento-producto">

                    <strong>
                        ${escaparHTML(
                            movimiento.producto_nombre ||
                            "Producto"
                        )}
                    </strong>

                    <span>
                        ${escaparHTML(
                            movimiento.producto_codigo ||
                            "Sin código"
                        )}
                    </span>

                </div>

            </td>


            <td>

                <span
                    class="movimiento-tipo ${claseMovimiento}"
                >
                    ${
                        esCompra
                            ? "ENTRADA"
                            : "SALIDA"
                    }
                </span>

            </td>


            <td>

                <span
                    class="${claseCantidad}"
                >
                    ${signo}${formatearNumero(
                        movimiento.cantidad
                    )}
                </span>

            </td>


            <td>

                <span>
                    ${escaparHTML(
                        movimiento.motivo ||
                        "—"
                    )}
                </span>

            </td>


            <td>

                <span class="referencia">
                    ${escaparHTML(
                        referencia
                    )}
                </span>

            </td>

        </tr>
    `;

}


/* =========================================================
   FILTRO DE INVENTARIO
   ========================================================= */

function cambiarFiltro(
    filtro
) {

    filtroInventarioActual =
        filtro;


    document
        .querySelectorAll(
            ".filtro"
        )
        .forEach(
            boton => {

                boton.classList.toggle(
                    "activo",
                    boton.dataset.filtro ===
                    filtro
                );

            }
        );


    renderizarInventario();

}


/* =========================================================
   FILTRO DE MOVIMIENTOS
   ========================================================= */

function cambiarFiltroMovimiento(
    tipo
) {

    filtroMovimientoActual =
        tipo;


    document
        .querySelectorAll(
            ".filtro-movimiento"
        )
        .forEach(
            boton => {

                boton.classList.toggle(
                    "activo",
                    boton.dataset.tipo ===
                    tipo
                );

            }
        );


    renderizarMovimientos();

}


/* =========================================================
   BÚSQUEDA
   ========================================================= */

function configurarBusqueda() {

    const buscador =
        document.getElementById(
            "buscarInventario"
        );


    if (!buscador) {
        return;
    }


    buscador.addEventListener(
        "input",
        () => {

            clearTimeout(
                temporizadorBusqueda
            );


            temporizadorBusqueda =
                setTimeout(
                    () => {

                        renderizarInventario();

                    },
                    100
                );

        }
    );

}


/* =========================================================
   OBTENER TEXTO DE BÚSQUEDA
   ========================================================= */

function obtenerTextoBusqueda() {

    const buscador =
        document.getElementById(
            "buscarInventario"
        );


    if (!buscador) {
        return "";
    }


    return buscador.value
        .trim()
        .toLowerCase();

}


/* =========================================================
   LIMPIAR BÚSQUEDA
   ========================================================= */

function limpiarBusqueda() {

    const buscador =
        document.getElementById(
            "buscarInventario"
        );


    if (!buscador) {
        return;
    }


    buscador.value = "";


    renderizarInventario();


    buscador.focus();

}


/* =========================================================
   VOLVER AL ADMIN
   ========================================================= */

function volverAdmin() {

    window.location.href =
        "/admin.html";

}


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

let temporizadorNotificacion = null;


function mostrarNotificacion(
    titulo,
    mensaje,
    tipo = "success"
) {

    const notificacion =
        document.getElementById(
            "notificacion"
        );

    const tituloElemento =
        document.getElementById(
            "notificacionTitulo"
        );

    const mensajeElemento =
        document.getElementById(
            "notificacionMensaje"
        );

    const icono =
        document.getElementById(
            "notificacionIcono"
        );


    if (
        !notificacion ||
        !tituloElemento ||
        !mensajeElemento ||
        !icono
    ) {

        return;

    }


    tituloElemento.textContent =
        titulo;


    mensajeElemento.textContent =
        mensaje;


    if (tipo === "error") {

        icono.textContent = "×";

        icono.style.background =
            "rgba(239, 68, 68, 0.10)";

        icono.style.color =
            "#fca5a5";

    } else if (
        tipo === "warning"
    ) {

        icono.textContent = "!";

        icono.style.background =
            "rgba(245, 158, 11, 0.10)";

        icono.style.color =
            "#fcd34d";

    } else {

        icono.textContent = "✓";

        icono.style.background =
            "rgba(34, 197, 94, 0.10)";

        icono.style.color =
            "#86efac";

    }


    notificacion.classList.add(
        "visible"
    );


    clearTimeout(
        temporizadorNotificacion
    );


    temporizadorNotificacion =
        setTimeout(
            () => {

                cerrarNotificacion();

            },
            4500
        );

}


/* =========================================================
   CERRAR NOTIFICACIÓN
   ========================================================= */

function cerrarNotificacion() {

    const notificacion =
        document.getElementById(
            "notificacion"
        );


    if (!notificacion) {
        return;
    }


    notificacion.classList.remove(
        "visible"
    );

}


/* =========================================================
   ESTADO DEL STOCK
   ========================================================= */

function calcularEstadoStock(
    cantidad,
    minimo
) {

    if (
        cantidad <= 0
    ) {

        return "AGOTADO";

    }


    if (
        cantidad <= minimo
    ) {

        return "BAJO";

    }


    return "DISPONIBLE";

}


/* =========================================================
   CLASE DEL STOCK
   ========================================================= */

function obtenerClaseStock(
    estado
) {

    if (
        estado === "AGOTADO"
    ) {

        return "agotado";

    }


    if (
        estado === "BAJO"
    ) {

        return "bajo";

    }


    return "";

}


/* =========================================================
   CLASE DEL ESTADO
   ========================================================= */

function obtenerClaseEstado(
    estado
) {

    if (
        estado === "AGOTADO"
    ) {

        return "agotado";

    }


    if (
        estado === "BAJO"
    ) {

        return "bajo";

    }


    return "disponible";

}


/* =========================================================
   TEXTO DEL ESTADO
   ========================================================= */

function textoEstado(
    estado
) {

    if (
        estado === "AGOTADO"
    ) {

        return "Agotado";

    }


    if (
        estado === "BAJO"
    ) {

        return "Stock bajo";

    }


    return "Disponible";

}


/* =========================================================
   FORMATEAR MONEDA
   ========================================================= */

function formatearMoneda(
    valor
) {

    const numero =
        convertirNumero(
            valor
        );


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
   FORMATEAR NÚMERO
   ========================================================= */

function formatearNumero(
    valor
) {

    return convertirNumero(
        valor
    ).toLocaleString(
        "es-CO"
    );

}


/* =========================================================
   CONVERTIR A NÚMERO
   ========================================================= */

function convertirNumero(
    valor
) {

    const numero =
        Number(valor);


    if (
        Number.isFinite(numero)
    ) {

        return numero;

    }


    return 0;

}


/* =========================================================
   FORMATEAR FECHA Y HORA
   ========================================================= */

function formatearFechaHora(
    valor
) {

    if (!valor) {
        return "—";
    }


    const fecha =
        new Date(valor);


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return "—";

    }


    return fecha.toLocaleString(
        "es-CO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escaparHTML(
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
   ESTABLECER TEXTO
   ========================================================= */

function establecerTexto(
    id,
    texto
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            texto;

    }

}