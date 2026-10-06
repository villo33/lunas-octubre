/* =========================================================
   LUNAS DE OCTUBRE — PROVEEDORES
   ========================================================= */

let proveedores = [];

let filtroActual = "todos";

let proveedorEditando = null;


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        mostrarFecha();

        configurarBusqueda();

        configurarFiltros();

        configurarFormulario();

        cargarProveedores();

    }
);


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
   CARGAR PROVEEDORES
   ========================================================= */

async function cargarProveedores() {

    try {

        const respuesta =
            await fetch(
                "/api/proveedores"
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los proveedores."
            );
        }


        proveedores =
            await respuesta.json();


        actualizarResumen();

        renderizarProveedores();

    } catch (error) {

        console.error(
            "❌ Error cargando proveedores:",
            error
        );


        proveedores = [];


        actualizarResumen();

        renderizarProveedores();


        mostrarNotificacion(
            error.message ||
            "Error cargando proveedores.",
            "error"
        );
    }
}


/* =========================================================
   RESUMEN
   ========================================================= */

function actualizarResumen() {

    const total =
        proveedores.length;


    const activos =
        proveedores.filter(
            proveedor =>
                proveedor.activo === true
        ).length;


    const inactivos =
        total - activos;


    document.getElementById(
        "totalProveedores"
    ).textContent =
        total;


    document.getElementById(
        "proveedoresActivos"
    ).textContent =
        activos;


    document.getElementById(
        "proveedoresInactivos"
    ).textContent =
        inactivos;
}


/* =========================================================
   BUSQUEDA
   ========================================================= */

function configurarBusqueda() {

    const input =
        document.getElementById(
            "buscarProveedor"
        );


    const limpiar =
        document.getElementById(
            "limpiarBusqueda"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        () => {

            renderizarProveedores();

        }
    );


    limpiar.addEventListener(
        "click",
        () => {

            input.value = "";

            renderizarProveedores();

            input.focus();

        }
    );
}


/* =========================================================
   FILTROS
   ========================================================= */

function configurarFiltros() {

    const botones =
        document.querySelectorAll(
            ".filtro-btn"
        );


    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    botones.forEach(
                        item =>
                            item.classList.remove(
                                "activo"
                            )
                    );


                    boton.classList.add(
                        "activo"
                    );


                    filtroActual =
                        boton.dataset.filtro;


                    renderizarProveedores();

                }
            );

        }
    );
}


/* =========================================================
   FILTRAR
   ========================================================= */

function obtenerProveedoresFiltrados() {

    const input =
        document.getElementById(
            "buscarProveedor"
        );


    const texto =
        (input?.value || "")
            .trim()
            .toLowerCase();


    return proveedores.filter(
        proveedor => {

            let coincideEstado =
                true;


            if (
                filtroActual ===
                "activos"
            ) {

                coincideEstado =
                    proveedor.activo === true;

            }


            if (
                filtroActual ===
                "inactivos"
            ) {

                coincideEstado =
                    proveedor.activo === false;

            }


            if (!coincideEstado) {
                return false;
            }


            if (!texto) {
                return true;
            }


            const contenido = [

                proveedor.nombre,

                proveedor.empresa,

                proveedor.telefono,

                proveedor.correo,

                proveedor.direccion

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return contenido.includes(
                texto
            );

        }
    );
}


/* =========================================================
   RENDERIZAR
   ========================================================= */

function renderizarProveedores() {

    const tabla =
        document.getElementById(
            "tablaProveedores"
        );


    const vacio =
        document.getElementById(
            "proveedoresVacios"
        );


    const lista =
        obtenerProveedoresFiltrados();


    const contador =
        document.getElementById(
            "contadorProveedores"
        );


    contador.textContent =
        `${lista.length} ${
            lista.length === 1
                ? "proveedor"
                : "proveedores"
        }`;


    tabla.innerHTML = "";


    if (lista.length === 0) {

        vacio.hidden = false;

        return;
    }


    vacio.hidden = true;


    lista.forEach(
        proveedor => {

            const fila =
                document.createElement(
                    "tr"
                );


            const nombre =
                escaparHTML(
                    proveedor.nombre ||
                    "Sin nombre"
                );


            const empresa =
                escaparHTML(
                    proveedor.empresa ||
                    "—"
                );


            const telefono =
                escaparHTML(
                    proveedor.telefono ||
                    "—"
                );


            const correo =
                escaparHTML(
                    proveedor.correo ||
                    "—"
                );


            const direccion =
                escaparHTML(
                    proveedor.direccion ||
                    "Sin dirección"
                );


            const estado =
                proveedor.activo === true
                    ? "Activo"
                    : "Inactivo";


            const claseEstado =
                proveedor.activo === true
                    ? "badge-activo"
                    : "badge-inactivo";


            const claseBoton =
                proveedor.activo === true
                    ? "desactivar"
                    : "activar";


            const textoBoton =
                proveedor.activo === true
                    ? "Desactivar"
                    : "Activar";


            const inicial =
                obtenerInicial(
                    proveedor.nombre
                );


            fila.innerHTML = `

                <td>

                    <div class="proveedor-info">

                        <div class="proveedor-avatar">
                            ${inicial}
                        </div>

                        <div>

                            <div class="proveedor-nombre">
                                ${nombre}
                            </div>

                            <div class="proveedor-id">
                                ID #${proveedor.id}
                            </div>

                        </div>

                    </div>

                </td>


                <td>
                    ${empresa}
                </td>


                <td>

                    <div class="contacto-linea">
                        ${telefono}
                    </div>

                    <div class="contacto-linea">
                        ${correo}
                    </div>

                </td>


                <td>

                    <div
                        class="direccion-texto"
                        title="${direccion}"
                    >
                        ${direccion}
                    </div>

                </td>


                <td>

                    <span class="badge ${claseEstado}">
                        ${estado}
                    </span>

                </td>


                <td>

                    <div class="acciones-tabla">

                        <button
                            type="button"
                            class="btn-tabla"
                            onclick="editarProveedor(${proveedor.id})"
                        >
                            Editar
                        </button>


                        <button
                            type="button"
                            class="btn-tabla ${claseBoton}"
                            onclick="cambiarEstadoProveedor(
                                ${proveedor.id},
                                ${proveedor.activo}
                            )"
                        >
                            ${textoBoton}
                        </button>

                    </div>

                </td>

            `;


            tabla.appendChild(
                fila
            );

        }
    );
}


/* =========================================================
   MODAL NUEVO
   ========================================================= */

function abrirModalNuevo() {

    proveedorEditando =
        null;


    document.getElementById(
        "modalTitulo"
    ).textContent =
        "Nuevo proveedor";


    document.getElementById(
        "btnGuardar"
    ).textContent =
        "Guardar proveedor";


    limpiarFormulario();


    document.getElementById(
        "modalProveedor"
    ).hidden =
        false;


    setTimeout(
        () => {

            document.getElementById(
                "nombre"
            ).focus();

        },
        50
    );
}


/* =========================================================
   EDITAR
   ========================================================= */

function editarProveedor(id) {

    const proveedor =
        proveedores.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!proveedor) {

        mostrarNotificacion(
            "No se encontró el proveedor.",
            "error"
        );

        return;
    }


    proveedorEditando =
        proveedor;


    document.getElementById(
        "modalTitulo"
    ).textContent =
        "Editar proveedor";


    document.getElementById(
        "btnGuardar"
    ).textContent =
        "Guardar cambios";


    document.getElementById(
        "proveedorId"
    ).value =
        proveedor.id;


    document.getElementById(
        "nombre"
    ).value =
        proveedor.nombre || "";


    document.getElementById(
        "empresa"
    ).value =
        proveedor.empresa || "";


    document.getElementById(
        "telefono"
    ).value =
        proveedor.telefono || "";


    document.getElementById(
        "correo"
    ).value =
        proveedor.correo || "";


    document.getElementById(
        "direccion"
    ).value =
        proveedor.direccion || "";


    document.getElementById(
        "observaciones"
    ).value =
        proveedor.observaciones || "";


    document.getElementById(
        "modalProveedor"
    ).hidden =
        false;


    setTimeout(
        () => {

            document.getElementById(
                "nombre"
            ).focus();

        },
        50
    );
}


/* =========================================================
   FORMULARIO
   ========================================================= */

function configurarFormulario() {

    const formulario =
        document.getElementById(
            "formProveedor"
        );


    formulario.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const nombre =
                document.getElementById(
                    "nombre"
                ).value.trim();


            const empresa =
                document.getElementById(
                    "empresa"
                ).value.trim();


            const telefono =
                document.getElementById(
                    "telefono"
                ).value.trim();


            const correo =
                document.getElementById(
                    "correo"
                ).value.trim();


            const direccion =
                document.getElementById(
                    "direccion"
                ).value.trim();


            const observaciones =
                document.getElementById(
                    "observaciones"
                ).value.trim();


            if (!nombre) {

                mostrarNotificacion(
                    "El nombre del proveedor es obligatorio.",
                    "error"
                );

                document.getElementById(
                    "nombre"
                ).focus();

                return;
            }


            const datos = {

                nombre,

                empresa,

                telefono,

                correo,

                direccion,

                observaciones

            };


            await guardarProveedor(
                datos
            );

        }
    );
}


/* =========================================================
   GUARDAR
   ========================================================= */

async function guardarProveedor(
    datos
) {

    const boton =
        document.getElementById(
            "btnGuardar"
        );


    const editando =
        Boolean(
            proveedorEditando
        );


    boton.disabled =
        true;


    boton.textContent =
        editando
            ? "Guardando..."
            : "Registrando...";


    try {

        const url =
            editando
                ? `/api/proveedores/${proveedorEditando.id}`
                : "/api/proveedores";


        const metodo =
            editando
                ? "PUT"
                : "POST";


        const respuesta =
            await fetch(
                url,
                {
                    method: metodo,

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            datos
                        )
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                "No se pudo guardar el proveedor."
            );
        }


        cerrarModal();


        await cargarProveedores();


        mostrarNotificacion(
            editando
                ? "Proveedor actualizado correctamente."
                : "Proveedor registrado correctamente.",
            "success"
        );


    } catch (error) {

        console.error(
            "❌ Error guardando proveedor:",
            error
        );


        mostrarNotificacion(
            error.message ||
            "Error guardando proveedor.",
            "error"
        );


    } finally {

        boton.disabled =
            false;

        boton.textContent =
            editando
                ? "Guardar cambios"
                : "Guardar proveedor";
    }
}


/* =========================================================
   CAMBIAR ESTADO
   ========================================================= */

async function cambiarEstadoProveedor(
    id,
    estadoActual
) {

    const nuevoEstado =
        !estadoActual;


    const proveedor =
        proveedores.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!proveedor) {
        return;
    }


    const accion =
        nuevoEstado
            ? "activar"
            : "desactivar";


    const confirmado =
        confirm(
            `¿Deseas ${accion} al proveedor "${proveedor.nombre}"?`
        );


    if (!confirmado) {
        return;
    }


    try {

        const respuesta =
            await fetch(
                `/api/proveedores/${id}/activar`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            activo:
                                nuevoEstado
                        })
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                "No se pudo cambiar el estado."
            );
        }


        await cargarProveedores();


        mostrarNotificacion(
            nuevoEstado
                ? "Proveedor activado correctamente."
                : "Proveedor desactivado correctamente.",
            "success"
        );


    } catch (error) {

        console.error(
            "❌ Error cambiando estado:",
            error
        );


        mostrarNotificacion(
            error.message ||
            "Error cambiando el estado.",
            "error"
        );
    }
}


/* =========================================================
   LIMPIAR FORMULARIO
   ========================================================= */

function limpiarFormulario() {

    document.getElementById(
        "formProveedor"
    ).reset();


    document.getElementById(
        "proveedorId"
    ).value =
        "";
}


/* =========================================================
   CERRAR MODAL
   ========================================================= */

function cerrarModal() {

    document.getElementById(
        "modalProveedor"
    ).hidden =
        true;


    proveedorEditando =
        null;


    limpiarFormulario();
}


/* =========================================================
   CERRAR MODAL AL HACER CLICK FUERA
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "modalProveedor"
            );


        if (
            event.target === modal
        ) {

            cerrarModal();

        }

    }
);


/* =========================================================
   ESCAPE
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            const modal =
                document.getElementById(
                    "modalProveedor"
                );


            if (
                modal &&
                !modal.hidden
            ) {

                cerrarModal();

            }
        }
    }
);


/* =========================================================
   VOLVER ADMIN
   ========================================================= */

function volverAdmin() {

    window.location.href =
        "/admin.html";
}


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

let temporizadorNotificacion;


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
            3500
        );
}


/* =========================================================
   UTILIDADES
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


function obtenerInicial(
    nombre
) {

    const texto =
        String(
            nombre || ""
        ).trim();


    if (!texto) {
        return "?";
    }


    return texto
        .charAt(0)
        .toUpperCase();
}