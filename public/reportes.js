/* =========================================================
   LUNAS DE OCTUBRE — REPORTES
   ========================================================= */

let reporteResumen = null;

let reporteVentas = [];

let reporteProductosVendidos = [];

let reporteCompras = [];

let reporteMovimientos = [];

let temporizadorNotificacion;


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        mostrarFecha();

        cargarTodosLosReportes();

    }
);


/* =========================================================
   CARGAR TODO
   ========================================================= */

async function cargarTodosLosReportes() {

    try {

        mostrarNotificacion(
            "Actualizando reportes...",
            "success"
        );


        await Promise.all([

            cargarResumen(),

            cargarVentas(),

            cargarProductosVendidos(),

            cargarCompras(),

            cargarMovimientos()

        ]);


        mostrarNotificacion(
            "Reportes actualizados correctamente.",
            "success"
        );


    } catch (error) {

        console.error(
            "❌ Error cargando reportes:",
            error
        );


        mostrarNotificacion(
            error.message ||
            "No se pudieron cargar los reportes.",
            "error"
        );

    }

}


/* =========================================================
   RESUMEN
   ========================================================= */

async function cargarResumen() {

    const respuesta =
        await fetch(
            "/api/reportes/resumen"
        );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        throw new Error(
            resultado.error ||
            "Error cargando el resumen."
        );

    }


    reporteResumen =
        resultado;


    renderizarResumen();
}


/* =========================================================
   RENDERIZAR RESUMEN
   ========================================================= */

function renderizarResumen() {

    if (!reporteResumen) {
        return;
    }


    document.getElementById(
        "totalVentas"
    ).textContent =
        formatoMoneda(
            reporteResumen.total_ventas
        );


    document.getElementById(
        "cantidadVentas"
    ).textContent =
        `${reporteResumen.cantidad_ventas || 0} ${
            Number(
                reporteResumen.cantidad_ventas
            ) === 1
                ? "venta"
                : "ventas"
        }`;


    document.getElementById(
        "gananciaTotal"
    ).textContent =
        formatoMoneda(
            reporteResumen.ganancia_total
        );


    document.getElementById(
        "totalCompras"
    ).textContent =
        formatoMoneda(
            reporteResumen.total_compras
        );


    document.getElementById(
        "cantidadCompras"
    ).textContent =
        `${reporteResumen.cantidad_compras || 0} ${
            Number(
                reporteResumen.cantidad_compras
            ) === 1
                ? "compra"
                : "compras"
        }`;


    document.getElementById(
        "valorInventario"
    ).textContent =
        formatoMoneda(
            reporteResumen.valor_inventario
        );


    document.getElementById(
        "productosVendidos"
    ).textContent =
        formatoNumero(
            reporteResumen.productos_vendidos
        );


    document.getElementById(
        "productosComprados"
    ).textContent =
        formatoNumero(
            reporteResumen.productos_comprados
        );


    document.getElementById(
        "productosActivos"
    ).textContent =
        formatoNumero(
            reporteResumen.productos_activos
        );


    document.getElementById(
        "productosBajos"
    ).textContent =
        formatoNumero(
            reporteResumen.productos_bajos
        );


    document.getElementById(
        "productosAgotados"
    ).textContent =
        formatoNumero(
            reporteResumen.productos_agotados
        );
}


/* =========================================================
   VENTAS
   ========================================================= */

async function cargarVentas() {

    const respuesta =
        await fetch(
            "/api/reportes/ventas"
        );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        throw new Error(
            resultado.error ||
            "Error cargando ventas."
        );

    }


    reporteVentas =
        Array.isArray(resultado)
            ? resultado
            : [];


    renderizarVentas();
}


/* =========================================================
   RENDERIZAR VENTAS
   ========================================================= */

function renderizarVentas() {

    const tabla =
        document.getElementById(
            "tablaVentas"
        );


    const vacio =
        document.getElementById(
            "ventasVacias"
        );


    tabla.innerHTML = "";


    if (
        reporteVentas.length === 0
    ) {

        vacio.hidden = false;

        return;
    }


    vacio.hidden = true;


    reporteVentas.forEach(
        venta => {

            const fila =
                document.createElement(
                    "tr"
                );


            const metodo =
                escaparHTML(
                    venta.metodo_pago ||
                    "Efectivo"
                );


            fila.innerHTML = `

                <td>
                    <span class="venta-id">
                        #${venta.id}
                    </span>
                </td>

                <td>
                    <span class="fecha-texto">
                        ${formatoFecha(
                            venta.fecha
                        )}
                    </span>
                </td>

                <td>
                    <span class="metodo">
                        ${metodo}
                    </span>
                </td>

                <td>
                    ${formatoNumero(
                        venta.unidades
                    )}
                </td>

                <td>
                    <span class="total-text">
                        ${formatoMoneda(
                            venta.total
                        )}
                    </span>
                </td>

                <td>
                    <span class="ganancia-text">
                        ${formatoMoneda(
                            venta.ganancia
                        )}
                    </span>
                </td>

            `;


            tabla.appendChild(
                fila
            );

        }
    );
}


/* =========================================================
   PRODUCTOS VENDIDOS
   ========================================================= */

async function cargarProductosVendidos() {

    const respuesta =
        await fetch(
            "/api/reportes/productos-vendidos"
        );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        throw new Error(
            resultado.error ||
            "Error cargando productos vendidos."
        );

    }


    reporteProductosVendidos =
        Array.isArray(resultado)
            ? resultado
            : [];


    renderizarProductosVendidos();
}


/* =========================================================
   RENDERIZAR PRODUCTOS
   ========================================================= */

function renderizarProductosVendidos() {

    const contenedor =
        document.getElementById(
            "listaProductosVendidos"
        );


    const vacio =
        document.getElementById(
            "productosVendidosVacios"
        );


    contenedor.innerHTML = "";


    if (
        reporteProductosVendidos.length === 0
    ) {

        vacio.hidden = false;

        return;
    }


    vacio.hidden = true;


    reporteProductosVendidos
        .slice(0, 10)
        .forEach(
            (producto, indice) => {

                const elemento =
                    document.createElement(
                        "div"
                    );


                elemento.className =
                    "producto-reporte";


                const nombre =
                    escaparHTML(
                        producto.nombre ||
                        "Producto"
                    );


                const codigo =
                    escaparHTML(
                        producto.codigo ||
                        "Sin código"
                    );


                elemento.innerHTML = `

                    <div class="producto-ranking">
                        ${indice + 1}
                    </div>


                    <div class="producto-info">

                        <strong>
                            ${nombre}
                        </strong>

                        <span>
                            ${codigo}
                        </span>

                    </div>


                    <div class="producto-metricas">

                        <strong>
                            ${formatoNumero(
                                producto.unidades_vendidas
                            )} unidades
                        </strong>

                        <span>
                            ${formatoMoneda(
                                producto.ganancia
                            )}
                        </span>

                    </div>

                `;


                contenedor.appendChild(
                    elemento
                );

            }
        );
}


/* =========================================================
   COMPRAS
   ========================================================= */

async function cargarCompras() {

    const respuesta =
        await fetch(
            "/api/reportes/compras"
        );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        throw new Error(
            resultado.error ||
            "Error cargando compras."
        );

    }


    reporteCompras =
        Array.isArray(resultado)
            ? resultado
            : [];


    renderizarCompras();
}


/* =========================================================
   RENDERIZAR COMPRAS
   ========================================================= */

function renderizarCompras() {

    const contenedor =
        document.getElementById(
            "listaCompras"
        );


    const vacio =
        document.getElementById(
            "comprasVacias"
        );


    contenedor.innerHTML = "";


    if (
        reporteCompras.length === 0
    ) {

        vacio.hidden = false;

        return;
    }


    vacio.hidden = true;


    reporteCompras
        .slice(0, 10)
        .forEach(
            compra => {

                const elemento =
                    document.createElement(
                        "div"
                    );


                elemento.className =
                    "compra-reporte";


                const observaciones =
                    escaparHTML(
                        compra.observaciones ||
                        "Compra registrada"
                    );


                elemento.innerHTML = `

                    <div class="compra-info">

                        <strong>
                            Compra #${compra.id}
                        </strong>

                        <span>
                            ${formatoFecha(
                                compra.fecha
                            )}
                            ·
                            ${formatoNumero(
                                compra.unidades
                            )} unidades
                        </span>

                    </div>


                    <div class="compra-total">

                        ${formatoMoneda(
                            compra.total
                        )}

                    </div>

                `;


                elemento.title =
                    observaciones;


                contenedor.appendChild(
                    elemento
                );

            }
        );
}


/* =========================================================
   MOVIMIENTOS
   ========================================================= */

async function cargarMovimientos() {

    const respuesta =
        await fetch(
            "/api/reportes/movimientos"
        );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        throw new Error(
            resultado.error ||
            "Error cargando movimientos."
        );

    }


    reporteMovimientos =
        Array.isArray(resultado)
            ? resultado
            : [];


    renderizarMovimientos();
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


    tabla.innerHTML = "";


    if (
        reporteMovimientos.length === 0
    ) {

        vacio.hidden = false;

        return;
    }


    vacio.hidden = true;


    reporteMovimientos
        .slice(0, 20)
        .forEach(
            movimiento => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                const tipo =
                    String(
                        movimiento.tipo ||
                        ""
                    ).toUpperCase();


                const entrada =
                    tipo === "COMPRA" ||
                    tipo === "ENTRADA";


                const claseTipo =
                    entrada
                        ? "movimiento-entrada"
                        : "movimiento-salida";


                const producto =
                    escaparHTML(
                        movimiento.producto_nombre ||
                        "Producto"
                    );


                const codigo =
                    escaparHTML(
                        movimiento.producto_codigo ||
                        ""
                    );


                const motivo =
                    escaparHTML(
                        movimiento.motivo ||
                        "Sin motivo"
                    );


                fila.innerHTML = `

                    <td>
                        ${formatoFecha(
                            movimiento.fecha
                        )}
                    </td>


                    <td>

                        <strong>
                            ${producto}
                        </strong>

                        <br>

                        <small>
                            ${codigo}
                        </small>

                    </td>


                    <td>

                        <span
                            class="${claseTipo}"
                        >
                            ${escaparHTML(
                                tipo || "MOVIMIENTO"
                            )}
                        </span>

                    </td>


                    <td>
                        ${formatoNumero(
                            movimiento.cantidad
                        )}
                    </td>


                    <td>
                        ${motivo}
                    </td>

                `;


                tabla.appendChild(
                    fila
                );

            }
        );
}


/* =========================================================
   FECHA
   ========================================================= */

function mostrarFecha() {

    const elemento =
        document.getElementById(
            "fechaActual"
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        new Date().toLocaleDateString(
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
   VOLVER ADMIN
   ========================================================= */

function volverAdmin() {

    window.location.href =
        "/admin.html";
}


/* =========================================================
   FORMATO MONEDA
   ========================================================= */

function formatoMoneda(valor) {

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
   FORMATO NUMERO
   ========================================================= */

function formatoNumero(valor) {

    return (
        Number(valor) || 0
    ).toLocaleString(
        "es-CO"
    );
}


/* =========================================================
   FORMATO FECHA
   ========================================================= */

function formatoFecha(valor) {

    if (!valor) {
        return "Sin fecha";
    }


    const fecha =
        new Date(valor);


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return "Fecha inválida";
    }


    return fecha.toLocaleDateString(
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

function escaparHTML(valor) {

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
   NOTIFICACIONES
   ========================================================= */

function mostrarNotificacion(
    mensaje,
    tipo = "success"
) {

    const elemento =
        document.getElementById(
            "notificacion"
        );


    const icono =
        document.getElementById(
            "notificacionIcono"
        );


    const texto =
        document.getElementById(
            "notificacionTexto"
        );


    if (
        !elemento ||
        !icono ||
        !texto
    ) {

        return;
    }


    texto.textContent =
        mensaje;


    if (
        tipo === "error"
    ) {

        icono.textContent =
            "!";

        elemento.style.borderColor =
            "rgba(239, 68, 68, 0.30)";

        icono.style.background =
            "rgba(239, 68, 68, 0.12)";

        icono.style.color =
            "#ef4444";

    } else {

        icono.textContent =
            "✓";

        elemento.style.borderColor =
            "rgba(34, 197, 94, 0.25)";

        icono.style.background =
            "rgba(34, 197, 94, 0.12)";

        icono.style.color =
            "#22c55e";
    }


    elemento.classList.add(
        "mostrar"
    );


    clearTimeout(
        temporizadorNotificacion
    );


    temporizadorNotificacion =
        setTimeout(
            () => {

                elemento.classList.remove(
                    "mostrar"
                );

            },
            3000
        );
}