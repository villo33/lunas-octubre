/* =========================================================
   LUNAS DE OCTUBRE
   HISTORIAL DE VENTAS
   ========================================================= */

"use strict";

/* =========================================================
   VARIABLES
   ========================================================= */

let ventas = [];
let ventasFiltradas = [];


/* =========================================================
   ELEMENTOS
   ========================================================= */

const listaVentas =
    document.getElementById(
        "listaVentas"
    );

const buscarVenta =
    document.getElementById(
        "buscarVenta"
    );

const fechaDesde =
    document.getElementById(
        "fechaDesde"
    );

const fechaHasta =
    document.getElementById(
        "fechaHasta"
    );

const filtroMetodo =
    document.getElementById(
        "filtroMetodo"
    );

const btnLimpiarFiltros =
    document.getElementById(
        "btnLimpiarFiltros"
    );

const btnActualizar =
    document.getElementById(
        "btnActualizar"
    );

const contadorResultados =
    document.getElementById(
        "contadorResultados"
    );

const totalVendido =
    document.getElementById(
        "totalVendido"
    );

const cantidadVentas =
    document.getElementById(
        "cantidadVentas"
    );

const productosVendidos =
    document.getElementById(
        "productosVendidos"
    );

const modalDetalle =
    document.getElementById(
        "modalDetalle"
    );

const detalleTitulo =
    document.getElementById(
        "detalleTitulo"
    );

const detalleVenta =
    document.getElementById(
        "detalleVenta"
    );

const btnCerrarModal =
    document.getElementById(
        "btnCerrarModal"
    );

const notificacion =
    document.getElementById(
        "notificacion"
    );

const notificacionTitulo =
    document.getElementById(
        "notificacionTitulo"
    );

const notificacionMensaje =
    document.getElementById(
        "notificacionMensaje"
    );


/* =========================================================
   FORMATO DE MONEDA
   ========================================================= */

function formatoMoneda(valor) {

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
   FORMATO DE FECHA
   ========================================================= */

function formatoFecha(fecha) {

    if (!fecha) {
        return "Sin fecha";
    }

    const fechaObjeto =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaObjeto.getTime()
        )
    ) {
        return "Fecha inválida";
    }

    return fechaObjeto.toLocaleDateString(
        "es-CO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


/* =========================================================
   FORMATO DE HORA
   ========================================================= */

function formatoHora(fecha) {

    if (!fecha) {
        return "";
    }

    const fechaObjeto =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaObjeto.getTime()
        )
    ) {
        return "";
    }

    return fechaObjeto.toLocaleTimeString(
        "es-CO",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   NOTIFICACIÓN
   ========================================================= */

let temporizadorNotificacion = null;

function mostrarNotificacion(
    titulo,
    mensaje
) {

    notificacionTitulo.textContent =
        titulo;

    notificacionMensaje.textContent =
        mensaje;

    notificacion.classList.add(
        "visible"
    );

    clearTimeout(
        temporizadorNotificacion
    );

    temporizadorNotificacion =
        setTimeout(
            () => {

                notificacion.classList.remove(
                    "visible"
                );

            },
            3500
        );
}


/* =========================================================
   CARGAR VENTAS
   ========================================================= */

async function cargarVentas() {

    mostrarCargando();

    try {

        const respuesta =
            await fetch(
                "/api/ventas"
            );

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP ${respuesta.status}`
            );

        }

        const datos =
            await respuesta.json();

        if (!Array.isArray(datos)) {

            throw new Error(
                "La respuesta del servidor no tiene un formato válido."
            );

        }

        ventas = datos;

        aplicarFiltros();

    } catch (error) {

        console.error(
            "❌ Error cargando ventas:",
            error
        );

        mostrarError(
            "No fue posible cargar las ventas.",
            error.message
        );

        actualizarResumen([]);

    }

}


/* =========================================================
   MOSTRAR CARGANDO
   ========================================================= */

function mostrarCargando() {

    listaVentas.innerHTML = `
        <div class="estado-cargando">

            <div class="spinner"></div>

            <p>
                Cargando ventas...
            </p>

        </div>
    `;

}


/* =========================================================
   MOSTRAR ERROR
   ========================================================= */

function mostrarError(
    titulo,
    mensaje
) {

    listaVentas.innerHTML = `
        <div class="estado-error">

            <strong>
                ${escaparHTML(titulo)}
            </strong>

            <p>
                ${escaparHTML(mensaje)}
            </p>

        </div>
    `;

}


/* =========================================================
   APLICAR FILTROS
   ========================================================= */

function aplicarFiltros() {

    const texto =
        buscarVenta.value
            .trim()
            .toLowerCase();

    const desde =
        fechaDesde.value;

    const hasta =
        fechaHasta.value;

    const metodo =
        filtroMetodo.value;

    ventasFiltradas =
        ventas.filter(
            (venta) => {

                /* -----------------------------------------
                   BÚSQUEDA
                   ----------------------------------------- */

                const coincideTexto =
                    !texto ||
                    String(
                        venta.id
                    )
                        .toLowerCase()
                        .includes(texto);


                /* -----------------------------------------
                   MÉTODO DE PAGO
                   ----------------------------------------- */

                const coincideMetodo =
                    !metodo ||
                    venta.metodo_pago ===
                        metodo;


                /* -----------------------------------------
                   FECHA
                   ----------------------------------------- */

                let coincideFecha =
                    true;

                if (
                    desde ||
                    hasta
                ) {

                    const fechaVenta =
                        new Date(
                            venta.fecha
                        );

                    if (
                        Number.isNaN(
                            fechaVenta.getTime()
                        )
                    ) {
                        return false;
                    }

                    const fechaTexto =
                        fechaVenta
                            .toISOString()
                            .split("T")[0];


                    if (
                        desde &&
                        fechaTexto < desde
                    ) {
                        coincideFecha =
                            false;
                    }

                    if (
                        hasta &&
                        fechaTexto > hasta
                    ) {
                        coincideFecha =
                            false;
                    }

                }


                return (
                    coincideTexto &&
                    coincideMetodo &&
                    coincideFecha
                );

            }
        );

    renderizarVentas(
        ventasFiltradas
    );

    actualizarResumen(
        ventasFiltradas
    );

}


/* =========================================================
   RENDERIZAR VENTAS
   ========================================================= */

function renderizarVentas(
    lista
) {

    const cantidad =
        lista.length;

    contadorResultados.textContent =
        cantidad === 1
            ? "1 venta"
            : `${cantidad} ventas`;


    if (cantidad === 0) {

        listaVentas.innerHTML = `
            <div class="estado-vacio">

                <strong>
                    No hay ventas para mostrar
                </strong>

                <p>
                    No encontramos ventas que
                    coincidan con los filtros
                    seleccionados.
                </p>

            </div>
        `;

        return;
    }


    listaVentas.innerHTML =
        lista
            .map(
                (venta) =>
                    crearTarjetaVenta(
                        venta
                    )
            )
            .join("");

}


/* =========================================================
   CREAR TARJETA DE VENTA
   ========================================================= */

function crearTarjetaVenta(
    venta
) {

    const id =
        Number(venta.id) || 0;

    const total =
        Number(venta.total) || 0;

    const cantidadProductos =
        Number(
            venta.cantidad_productos
        ) || 0;

    const fecha =
        formatoFecha(
            venta.fecha
        );

    const hora =
        formatoHora(
            venta.fecha
        );

    const metodo =
        venta.metodo_pago ||
        "Sin especificar";


    return `
        <article
            class="venta-card"
            data-id="${id}"
        >

            <div class="venta-numero">

                <span>
                    Venta
                </span>

                <strong>
                    #${id}
                </strong>

            </div>


            <div class="venta-fecha">

                <strong>
                    ${escaparHTML(fecha)}
                </strong>

                <span>
                    ${escaparHTML(hora)}
                </span>

            </div>


            <div class="venta-metodo">

                <span>
                    Método de pago
                </span>

                <div class="etiqueta-metodo">
                    ${escaparHTML(metodo)}
                </div>

            </div>


            <div class="venta-total">

                <span>
                    Total
                </span>

                <strong>
                    ${formatoMoneda(total)}
                </strong>

                <small>
                    ${cantidadProductos}
                    ${
                        cantidadProductos === 1
                            ? "producto"
                            : "productos"
                    }
                </small>

            </div>


            <div class="venta-acciones">

                <button
                    type="button"
                    class="boton-detalle"
                    onclick="abrirDetalleVenta(${id})"
                >
                    Ver detalle
                </button>

            </div>

        </article>
    `;

}


/* =========================================================
   ACTUALIZAR RESUMEN
   ========================================================= */

function actualizarResumen(
    lista
) {

    const total =
        lista.reduce(
            (
                acumulado,
                venta
            ) => {

                return (
                    acumulado +
                    (
                        Number(
                            venta.total
                        ) || 0
                    )
                );

            },
            0
        );


    const productos =
        lista.reduce(
            (
                acumulado,
                venta
            ) => {

                return (
                    acumulado +
                    (
                        Number(
                            venta.cantidad_productos
                        ) || 0
                    )
                );

            },
            0
        );


    totalVendido.textContent =
        formatoMoneda(total);

    cantidadVentas.textContent =
        lista.length;

    productosVendidos.textContent =
        productos;

}


/* =========================================================
   ABRIR DETALLE
   ========================================================= */

async function abrirDetalleVenta(
    id
) {

    detalleTitulo.textContent =
        `Venta #${id}`;

    detalleVenta.innerHTML = `
        <div class="estado-cargando">

            <div class="spinner"></div>

            <p>
                Cargando detalle...
            </p>

        </div>
    `;

    modalDetalle.classList.add(
        "activo"
    );

    modalDetalle.setAttribute(
        "aria-hidden",
        "false"
    );


    try {

        const respuesta =
            await fetch(
                `/api/ventas/${id}`
            );

        if (!respuesta.ok) {

            let mensaje =
                `Error HTTP ${respuesta.status}`;

            try {

                const error =
                    await respuesta.json();

                if (error.error) {
                    mensaje =
                        error.error;
                }

            } catch (_) {
                /* No hacer nada */
            }

            throw new Error(
                mensaje
            );

        }


        const datos =
            await respuesta.json();

        renderizarDetalle(
            datos
        );

    } catch (error) {

        console.error(
            "❌ Error obteniendo detalle:",
            error
        );

        detalleVenta.innerHTML = `
            <div class="estado-error">

                <strong>
                    No fue posible cargar el detalle
                </strong>

                <p>
                    ${escaparHTML(
                        error.message
                    )}
                </p>

            </div>
        `;

    }

}


/* =========================================================
   RENDERIZAR DETALLE
   ========================================================= */

function renderizarDetalle(
    datos
) {

    const venta =
        datos.venta || datos;

    const detalles =
        Array.isArray(
            datos.detalles
        )
            ? datos.detalles
            : [];


    const id =
        Number(venta.id) || 0;

    const fecha =
        formatoFecha(
            venta.fecha
        );

    const hora =
        formatoHora(
            venta.fecha
        );

    const metodo =
        venta.metodo_pago ||
        "Sin especificar";

    const total =
        Number(venta.total) || 0;

    const observaciones =
        venta.observaciones ||
        "Sin observaciones";


    detalleTitulo.textContent =
        `Venta #${id}`;


    let filas = "";


    if (detalles.length === 0) {

        filas = `
            <tr>

                <td colspan="5">
                    No hay productos registrados
                    en esta venta.
                </td>

            </tr>
        `;

    } else {

        filas =
            detalles
                .map(
                    (detalle) => {

                        const nombre =
                            detalle.nombre ||
                            "Producto";

                        const codigo =
                            detalle.codigo ||
                            "";

                        const cantidad =
                            Number(
                                detalle.cantidad
                            ) || 0;

                        const precio =
                            Number(
                                detalle.precio_venta
                            ) || 0;

                        const subtotal =
                            Number(
                                detalle.subtotal
                            ) || 0;


                        return `
                            <tr>

                                <td>

                                    <div
                                        class="detalle-producto"
                                    >
                                        ${escaparHTML(
                                            nombre
                                        )}
                                    </div>

                                    ${
                                        codigo
                                            ? `
                                                <span
                                                    class="detalle-codigo"
                                                >
                                                    Código:
                                                    ${escaparHTML(
                                                        codigo
                                                    )}
                                                </span>
                                            `
                                            : ""
                                    }

                                </td>


                                <td>
                                    ${cantidad}
                                </td>


                                <td>
                                    ${formatoMoneda(
                                        precio
                                    )}
                                </td>


                                <td>
                                    ${formatoMoneda(
                                        subtotal
                                    )}
                                </td>


                                <td>
                                    ${formatoMoneda(
                                        Number(
                                            detalle.ganancia
                                        ) || 0
                                    )}
                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

    }


    detalleVenta.innerHTML = `

        <div class="detalle-informacion">

            <div class="detalle-info">

                <span>
                    Fecha
                </span>

                <strong>
                    ${escaparHTML(fecha)}
                </strong>

            </div>


            <div class="detalle-info">

                <span>
                    Hora
                </span>

                <strong>
                    ${escaparHTML(hora)}
                </strong>

            </div>


            <div class="detalle-info">

                <span>
                    Método de pago
                </span>

                <strong>
                    ${escaparHTML(metodo)}
                </strong>

            </div>

        </div>


        <div class="detalle-info">

            <span>
                Observaciones
            </span>

            <strong>
                ${escaparHTML(
                    observaciones
                )}
            </strong>

        </div>


        <div
            style="
                overflow-x:auto;
                margin-top:18px;
            "
        >

            <table class="detalle-tabla">

                <thead>

                    <tr>

                        <th>
                            Producto
                        </th>

                        <th>
                            Cant.
                        </th>

                        <th>
                            Precio
                        </th>

                        <th>
                            Subtotal
                        </th>

                        <th>
                            Ganancia
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${filas}

                </tbody>

            </table>

        </div>


        <div class="detalle-total">

            <span>
                Total de la venta
            </span>

            <strong>
                ${formatoMoneda(total)}
            </strong>

        </div>

    `;

}


/* =========================================================
   CERRAR MODAL
   ========================================================= */

function cerrarModal() {

    modalDetalle.classList.remove(
        "activo"
    );

    modalDetalle.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   EVENTOS DE FILTROS
   ========================================================= */

buscarVenta.addEventListener(
    "input",
    aplicarFiltros
);

fechaDesde.addEventListener(
    "change",
    aplicarFiltros
);

fechaHasta.addEventListener(
    "change",
    aplicarFiltros
);

filtroMetodo.addEventListener(
    "change",
    aplicarFiltros
);


/* =========================================================
   LIMPIAR FILTROS
   ========================================================= */

btnLimpiarFiltros.addEventListener(
    "click",
    () => {

        buscarVenta.value = "";
        fechaDesde.value = "";
        fechaHasta.value = "";
        filtroMetodo.value = "";

        aplicarFiltros();

        mostrarNotificacion(
            "Filtros limpiados",
            "Se están mostrando nuevamente todas las ventas."
        );

    }
);


/* =========================================================
   ACTUALIZAR
   ========================================================= */

btnActualizar.addEventListener(
    "click",
    async () => {

        await cargarVentas();

        mostrarNotificacion(
            "Ventas actualizadas",
            "El historial fue actualizado correctamente."
        );

    }
);


/* =========================================================
   CERRAR MODAL
   ========================================================= */

btnCerrarModal.addEventListener(
    "click",
    cerrarModal
);


/* =========================================================
   CERRAR MODAL AL HACER CLICK AFUERA
   ========================================================= */

modalDetalle.addEventListener(
    "click",
    (evento) => {

        if (
            evento.target ===
            modalDetalle
        ) {
            cerrarModal();
        }

    }
);


/* =========================================================
   CERRAR CON ESC
   ========================================================= */

document.addEventListener(
    "keydown",
    (evento) => {

        if (
            evento.key === "Escape" &&
            modalDetalle.classList.contains(
                "activo"
            )
        ) {

            cerrarModal();

        }

    }
);


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarVentas();

    }
);