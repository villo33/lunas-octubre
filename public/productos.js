/* =========================================================
   LUNAS DE OCTUBRE
   PRODUCTOS — JAVASCRIPT
   ========================================================= */

const API = "/api";

let productos = [];
let categorias = [];
let proveedores = [];

let productoEditando = null;
let imagenSeleccionada = null;


/* =========================================================
   INICIO
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

            window.location.replace(
                "/login.html"
            );

            return false;

        }

        console.log(
            "✅ Productos: sesión válida."
        );

        return true;

    } catch (error) {

        console.error(
            "❌ Productos: error verificando sesión:",
            error
        );

        window.location.replace(
            "/login.html"
        );

        return false;

    }

}


/* =========================================================
   SESIÓN
   ========================================================= */

function cerrarSesion() {

    localStorage.removeItem(
        "login"
    );

    localStorage.removeItem(
        "lunasAdmin"
    );

    window.location.href =
        "/login.html";

}

/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventos() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            cerrarSesion
        );

    }


    const nuevoProductoBtn =
        document.getElementById(
            "nuevoProductoBtn"
        );

    if (nuevoProductoBtn) {

        nuevoProductoBtn.addEventListener(
            "click",
            abrirNuevoProducto
        );

    }


    /* =====================================================
       BOTÓN DEL ENCABEZADO DE LA TABLA
       ===================================================== */

    const nuevoProductoTablaBtn =
        document.getElementById(
            "nuevoProductoTablaBtn"
        );

    if (nuevoProductoTablaBtn) {

        nuevoProductoTablaBtn.addEventListener(
            "click",
            abrirNuevoProducto
        );

    }


    /* =====================================================
       BOTÓN DEL ESTADO VACÍO
       ===================================================== */

    const nuevoProductoVacioBtn =
        document.getElementById(
            "nuevoProductoVacioBtn"
        );

    if (nuevoProductoVacioBtn) {

        nuevoProductoVacioBtn.addEventListener(
            "click",
            abrirNuevoProducto
        );

    }


    const cerrarModalBtn =
        document.getElementById(
            "cerrarModalBtn"
        );

    if (cerrarModalBtn) {

        cerrarModalBtn.addEventListener(
            "click",
            cerrarModal
        );

    }


    const cancelarBtn =
        document.getElementById(
            "cancelarBtn"
        );

    if (cancelarBtn) {

        cancelarBtn.addEventListener(
            "click",
            cerrarModal
        );

    }


    const productoForm =
        document.getElementById(
            "productoForm"
        );

    if (productoForm) {

        productoForm.addEventListener(
            "submit",
            guardarProducto
        );

    }


    const buscarProducto =
        document.getElementById(
            "buscarProducto"
        );

    if (buscarProducto) {

        buscarProducto.addEventListener(
            "input",
            aplicarFiltros
        );

    }


    const filtroCategoria =
        document.getElementById(
            "filtroCategoria"
        );

    if (filtroCategoria) {

        filtroCategoria.addEventListener(
            "change",
            aplicarFiltros
        );

    }


    const filtroEstado =
        document.getElementById(
            "filtroEstado"
        );

    if (filtroEstado) {

        filtroEstado.addEventListener(
            "change",
            aplicarFiltros
        );

    }


    const recargarBtn =
        document.getElementById(
            "recargarBtn"
        );

    if (recargarBtn) {

        recargarBtn.addEventListener(
            "click",
            cargarDatosIniciales
        );

    }


    const imagen =
        document.getElementById(
            "imagen"
        );

    if (imagen) {

        imagen.addEventListener(
            "change",
            manejarImagenSeleccionada
        );

    }


    const removeImageBtn =
        document.getElementById(
            "removeImageBtn"
        );

    if (removeImageBtn) {

        removeImageBtn.addEventListener(
            "click",
            quitarImagen
        );

    }


    const precioCompra =
        document.getElementById(
            "precioCompra"
        );

    const precioVenta =
        document.getElementById(
            "precioVenta"
        );


    if (precioCompra) {

        precioCompra.addEventListener(
            "input",
            actualizarGanancia
        );

    }


    if (precioVenta) {

        precioVenta.addEventListener(
            "input",
            actualizarGanancia
        );

    }


    const cancelarConfirmBtn =
        document.getElementById(
            "cancelarConfirmBtn"
        );

    if (cancelarConfirmBtn) {

        cancelarConfirmBtn.addEventListener(
            "click",
            cerrarConfirmacion
        );

    }


    const confirmarDesactivarBtn =
        document.getElementById(
            "confirmarDesactivarBtn"
        );

    if (confirmarDesactivarBtn) {

        confirmarDesactivarBtn.addEventListener(
            "click",
            confirmarDesactivacion
        );

    }


    const productoModal =
        document.getElementById(
            "productoModal"
        );

    if (productoModal) {

        productoModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    productoModal
                ) {

                    cerrarModal();

                }

            }
        );

    }


    const confirmModal =
        document.getElementById(
            "confirmModal"
        );

    if (confirmModal) {

        confirmModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    confirmModal
                ) {

                    cerrarConfirmacion();

                }

            }
        );

    }

}

/* =========================================================
   CARGA INICIAL
   ========================================================= */

async function cargarDatosIniciales() {

    mostrarCargando(true);

    try {

        await Promise.all([
            cargarCategorias(),
            cargarProveedores(),
            cargarProductos()
        ]);

    } catch (error) {

        console.error(
            "Error cargando datos:",
            error
        );

        mostrarMensaje(
            "No fue posible cargar la información.",
            "error"
        );

    } finally {

        mostrarCargando(false);

    }

}


/* =========================================================
   CATEGORÍAS
   ========================================================= */

async function cargarCategorias() {

    const respuesta =
        await fetch(
            `${API}/categorias`
        );

    if (!respuesta.ok) {

        throw new Error(
            "No se pudieron cargar las categorías."
        );

    }


    categorias =
        await respuesta.json();


    llenarCategorias();

}


function llenarCategorias() {

    const filtro =
        document.getElementById(
            "filtroCategoria"
        );

    const select =
        document.getElementById(
            "categoria"
        );


    if (filtro) {

        filtro.innerHTML = `
            <option value="">
                Todas las categorías
            </option>
        `;


        categorias.forEach(categoria => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                categoria.id;

            option.textContent =
                categoria.nombre;

            filtro.appendChild(option);

        });

    }


    if (select) {

        select.innerHTML = `
            <option value="">
                Seleccionar categoría
            </option>
        `;


        categorias.forEach(categoria => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                categoria.id;

            option.textContent =
                categoria.nombre;

            select.appendChild(option);

        });

    }

}


/* =========================================================
   PROVEEDORES
   ========================================================= */

async function cargarProveedores() {

    const respuesta =
        await fetch(
            `${API}/proveedores`
        );

    if (!respuesta.ok) {

        throw new Error(
            "No se pudieron cargar los proveedores."
        );

    }


    proveedores =
        await respuesta.json();


    llenarProveedores();

}


function llenarProveedores() {

    const select =
        document.getElementById(
            "proveedor"
        );


    if (!select) return;


    select.innerHTML = `
        <option value="">
            Seleccionar proveedor
        </option>
    `;


    proveedores.forEach(proveedor => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            proveedor.id;

        option.textContent =
            proveedor.nombre;

        select.appendChild(option);

    });

}


/* =========================================================
   PRODUCTOS
   ========================================================= */

async function cargarProductos() {

    console.log("");
    console.log("========================================");
    console.log("📦 DIAGNÓSTICO — CARGAR PRODUCTOS");
    console.log("========================================");

    console.log(
        "🌐 URL:",
        `${API}/productos`
    );

    try {

        const respuesta =
            await fetch(
                `${API}/productos`,
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );

        console.log(
            "📡 Status:",
            respuesta.status
        );

        console.log(
            "📡 OK:",
            respuesta.ok
        );

        if (!respuesta.ok) {

            const texto =
                await respuesta.text();

            console.error(
                "❌ Respuesta del servidor:",
                texto
            );

            throw new Error(
                "No se pudieron cargar los productos."
            );

        }

        productos =
            await respuesta.json();

        console.log(
            "📦 Productos recibidos:",
            productos
        );

        console.log(
            "🔢 Cantidad de productos:",
            Array.isArray(productos)
                ? productos.length
                : "NO ES UN ARRAY"
        );

        aplicarFiltros();

        actualizarEstadisticas();

        console.log(
            "✅ Productos procesados correctamente."
        );

        console.log(
            "========================================"
        );

    } catch (error) {

        console.error(
            "❌ ERROR CARGANDO PRODUCTOS:",
            error
        );

        console.log(
            "========================================"
        );

        throw error;

    }

}


/* =========================================================
   FILTROS
   ========================================================= */

function aplicarFiltros() {

    const texto =
        (
            document.getElementById(
                "buscarProducto"
            )?.value || ""
        )
            .trim()
            .toLowerCase();


    const categoria =
        document.getElementById(
            "filtroCategoria"
        )?.value || "";


    const estado =
        document.getElementById(
            "filtroEstado"
        )?.value || "";


    const filtrados =
        productos.filter(producto => {

            const nombre =
                String(
                    producto.nombre || ""
                ).toLowerCase();


            const codigo =
                String(
                    producto.codigo || ""
                ).toLowerCase();


            const categoriaNombre =
                String(
                    producto.categoria_nombre ||
                    producto.categoria ||
                    ""
                ).toLowerCase();


            const coincideTexto =
                !texto ||
                nombre.includes(texto) ||
                codigo.includes(texto) ||
                categoriaNombre.includes(texto);


            const coincideCategoria =
                !categoria ||
                String(
                    producto.categoria_id || ""
                ) === String(categoria);


            const activo =
                producto.activo === true ||
                producto.activo === 1 ||
                producto.activo === "true";


            const stock =
                Number(
                    producto.cantidad || 0
                );


            const stockMinimo =
                Number(
                    producto.stock_minimo || 0
                );


            const stockBajo =
                stock <= stockMinimo;


            let coincideEstado = true;


            if (estado === "activo") {

                coincideEstado = activo;

            }


            if (estado === "inactivo") {

                coincideEstado = !activo;

            }


            if (estado === "stock_bajo") {

                coincideEstado =
                    activo && stockBajo;

            }


            return (
                coincideTexto &&
                coincideCategoria &&
                coincideEstado
            );

        });


    renderizarProductos(
        filtrados
    );

}


/* =========================================================
   RENDERIZAR PRODUCTOS
   ========================================================= */

function renderizarProductos(lista) {

    const tabla =
        document.getElementById(
            "productosTabla"
        );


    const estadoVacio =
        document.getElementById(
            "estadoVacio"
        );


    const contador =
        document.getElementById(
            "contadorResultados"
        );


    if (!tabla) return;


    tabla.innerHTML = "";


    if (contador) {

        contador.textContent =
            `${lista.length} ${
                lista.length === 1
                    ? "producto"
                    : "productos"
            }`;

    }


    if (lista.length === 0) {

        if (estadoVacio) {

            estadoVacio.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (estadoVacio) {

        estadoVacio.classList.add(
            "hidden"
        );

    }


    lista.forEach(producto => {

        const fila =
            document.createElement(
                "tr"
            );


        const activo =
            producto.activo === true ||
            producto.activo === 1 ||
            producto.activo === "true";


        const cantidad =
            Number(
                producto.cantidad || 0
            );


        const stockMinimo =
            Number(
                producto.stock_minimo || 0
            );


        const stockBajo =
            cantidad <= stockMinimo;


        const precioCompra =
            Number(
                producto.precio_compra ||
                0
            );


        const precioVenta =
            Number(
                producto.precio_venta ||
                producto.precio ||
                0
            );


        const ganancia =
            producto.ganancia !== undefined
                ? Number(producto.ganancia)
                : precioVenta - precioCompra;


        const margen =
            precioVenta > 0
                ? (ganancia / precioVenta) * 100
                : 0;


        const categoria =
            producto.categoria_nombre ||
            producto.categoria ||
            "Sin categoría";


        /* =====================================================
           PRODUCTO + IMAGEN
           ===================================================== */

        const celdaProducto =
            document.createElement(
                "td"
            );


        const productoInfo =
            document.createElement(
                "div"
            );


        /*
           CONTENEDOR PRINCIPAL
        */

        productoInfo.className =
            "producto-cell";


        /*
           CONTENEDOR DE IMAGEN
        */

        const imagenWrapper =
            document.createElement(
                "div"
            );


        imagenWrapper.className =
            "producto-imagen-wrapper";


        /*
           IMAGEN DESDE CLOUDINARY
        */

        if (
            producto.imagen_url
        ) {

            const imagen =
                document.createElement(
                    "img"
                );


            imagen.className =
                "producto-imagen";


            imagen.src =
                producto.imagen_url;


            imagen.alt =
                producto.nombre ||
                "Producto";


            imagen.loading =
                "lazy";


            /*
               Si la imagen no carga,
               mostramos el placeholder.
            */

            imagen.addEventListener(
                "error",
                () => {

                    imagen.remove();


                    mostrarPlaceholderImagen(
                        imagenWrapper
                    );

                }
            );


            imagenWrapper.appendChild(
                imagen
            );

        } else {

            mostrarPlaceholderImagen(
                imagenWrapper
            );

        }


        productoInfo.appendChild(
            imagenWrapper
        );


        /*
           INFORMACIÓN DEL PRODUCTO
        */

        const nombreProducto =
            document.createElement(
                "div"
            );


        nombreProducto.className =
            "producto-info-text";


        nombreProducto.innerHTML = `
            <strong>
                ${escapeHTML(
                    producto.nombre ||
                    "Sin nombre"
                )}
            </strong>

            ${
                producto.descripcion
                    ? `
                        <span>
                            ${escapeHTML(
                                producto.descripcion
                            )}
                        </span>
                    `
                    : ""
            }
        `;


        productoInfo.appendChild(
            nombreProducto
        );


        celdaProducto.appendChild(
            productoInfo
        );


        /* =====================================================
           CÓDIGO
           ===================================================== */

        const celdaCodigo =
            document.createElement(
                "td"
            );


        celdaCodigo.innerHTML = `
            <span style="
                display:inline-block;
                padding:5px 8px;
                border-radius:7px;
                background:rgba(139,92,246,.08);
                color:#c4b5fd;
                font-size:11px;
                font-weight:700;
            ">
                ${escapeHTML(
                    producto.codigo ||
                    "—"
                )}
            </span>
        `;


        /* =====================================================
           CATEGORÍA
           ===================================================== */

        const celdaCategoria =
            document.createElement(
                "td"
            );


        celdaCategoria.innerHTML = `
            <span style="
                color:#cbd5e1;
                font-size:12px;
            ">
                ${escapeHTML(
                    categoria
                )}
            </span>
        `;


        /* =====================================================
           PRECIO COMPRA
           ===================================================== */

        const celdaCompra =
            document.createElement(
                "td"
            );


        celdaCompra.innerHTML = `
            <span style="
                color:#cbd5e1;
                font-size:12px;
                font-weight:600;
            ">
                ${formatearMoneda(
                    precioCompra
                )}
            </span>
        `;


        /* =====================================================
           PRECIO VENTA
           ===================================================== */

        const celdaVenta =
            document.createElement(
                "td"
            );


        celdaVenta.innerHTML = `
            <span style="
                color:#f8fafc;
                font-size:12px;
                font-weight:700;
            ">
                ${formatearMoneda(
                    precioVenta
                )}
            </span>
        `;


        /* =====================================================
           GANANCIA
           ===================================================== */

        const celdaGanancia =
            document.createElement(
                "td"
            );


        celdaGanancia.innerHTML = `
            <div>
                <strong style="
                    display:block;
                    color:#34d399;
                    font-size:12px;
                ">
                    ${formatearMoneda(
                        ganancia
                    )}
                </strong>

                <span style="
                    display:block;
                    margin-top:2px;
                    color:#64748b;
                    font-size:9px;
                ">
                    ${margen.toFixed(1)}%
                </span>
            </div>
        `;


        /* =====================================================
           STOCK
           ===================================================== */

        const celdaStock =
            document.createElement(
                "td"
            );


        let stockColor =
            "#34d399";

        let stockBackground =
            "rgba(52,211,153,.10)";


        if (stockBajo) {

            stockColor =
                "#fbbf24";

            stockBackground =
                "rgba(251,191,36,.10)";

        }


        if (cantidad === 0) {

            stockColor =
                "#f87171";

            stockBackground =
                "rgba(248,113,113,.10)";

        }


        celdaStock.innerHTML = `
            <span style="
                display:inline-flex;
                align-items:center;
                justify-content:center;
                min-width:42px;
                padding:5px 8px;
                border-radius:7px;
                background:${stockBackground};
                color:${stockColor};
                font-size:11px;
                font-weight:800;
            ">
                ${cantidad}
            </span>
        `;


        /* =====================================================
           ESTADO
           ===================================================== */

        const celdaEstado =
            document.createElement(
                "td"
            );


        if (activo) {

            celdaEstado.innerHTML = `
                <span style="
                    display:inline-flex;
                    align-items:center;
                    gap:5px;
                    padding:5px 8px;
                    border-radius:7px;
                    background:rgba(52,211,153,.10);
                    color:#34d399;
                    font-size:10px;
                    font-weight:800;
                ">
                    <span>●</span>
                    Activo
                </span>
            `;

        } else {

            celdaEstado.innerHTML = `
                <span style="
                    display:inline-flex;
                    align-items:center;
                    gap:5px;
                    padding:5px 8px;
                    border-radius:7px;
                    background:rgba(148,163,184,.10);
                    color:#94a3b8;
                    font-size:10px;
                    font-weight:800;
                ">
                    <span>●</span>
                    Inactivo
                </span>
            `;

        }


        /* =====================================================
           ACCIONES
           ===================================================== */

        const celdaAcciones =
            document.createElement(
                "td"
            );


        const acciones =
            document.createElement(
                "div"
            );


        acciones.style.display =
            "flex";

        acciones.style.alignItems =
            "center";

        acciones.style.gap =
            "6px";

        acciones.style.flexWrap =
            "wrap";


        const editarBtn =
            document.createElement(
                "button"
            );


        editarBtn.type =
            "button";

        editarBtn.textContent =
            "Editar";


        editarBtn.style.border =
            "1px solid rgba(139,92,246,.25)";

        editarBtn.style.borderRadius =
            "7px";

        editarBtn.style.padding =
            "6px 9px";

        editarBtn.style.background =
            "rgba(139,92,246,.08)";

        editarBtn.style.color =
            "#c4b5fd";

        editarBtn.style.fontSize =
            "10px";

        editarBtn.style.fontWeight =
            "700";


        editarBtn.addEventListener(
            "click",
            () => editarProducto(producto.id)
        );


        acciones.appendChild(
            editarBtn
        );


        if (activo) {

            const desactivarBtn =
                document.createElement(
                    "button"
                );


            desactivarBtn.type =
                "button";

            desactivarBtn.textContent =
                "Desactivar";


            desactivarBtn.style.border =
                "1px solid rgba(248,113,113,.20)";

            desactivarBtn.style.borderRadius =
                "7px";

            desactivarBtn.style.padding =
                "6px 9px";

            desactivarBtn.style.background =
                "rgba(248,113,113,.07)";

            desactivarBtn.style.color =
                "#fca5a5";

            desactivarBtn.style.fontSize =
                "10px";

            desactivarBtn.style.fontWeight =
                "700";


            desactivarBtn.addEventListener(
                "click",
                () => abrirConfirmacion(producto)
            );


            acciones.appendChild(
                desactivarBtn
            );

        } else {

            const activarBtn =
                document.createElement(
                    "button"
                );


            activarBtn.type =
                "button";

            activarBtn.textContent =
                "Activar";


            activarBtn.style.border =
                "1px solid rgba(52,211,153,.20)";

            activarBtn.style.borderRadius =
                "7px";

            activarBtn.style.padding =
                "6px 9px";

            activarBtn.style.background =
                "rgba(52,211,153,.07)";

            activarBtn.style.color =
                "#6ee7b7";

            activarBtn.style.fontSize =
                "10px";

            activarBtn.style.fontWeight =
                "700";


            activarBtn.addEventListener(
                "click",
                () => activarProducto(producto.id)
            );


            acciones.appendChild(
                activarBtn
            );

        }


        celdaAcciones.appendChild(
            acciones
        );


        /* =====================================================
           ORDEN DE LAS 9 COLUMNAS
           ===================================================== */

        fila.appendChild(
            celdaProducto
        );

        fila.appendChild(
            celdaCodigo
        );

        fila.appendChild(
            celdaCategoria
        );

        fila.appendChild(
            celdaCompra
        );

        fila.appendChild(
            celdaVenta
        );

        fila.appendChild(
            celdaGanancia
        );

        fila.appendChild(
            celdaStock
        );

        fila.appendChild(
            celdaEstado
        );

        fila.appendChild(
            celdaAcciones
        );


        tabla.appendChild(
            fila
        );

    });

}


/* =========================================================
   PLACEHOLDER DE IMAGEN
   ========================================================= */

function mostrarPlaceholderImagen(
    contenedor
) {

    if (!contenedor) return;


    contenedor.innerHTML = `
        <div class="producto-imagen-placeholder">
            ☾
        </div>
    `;

}


/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function actualizarEstadisticas() {

    const total =
        productos.length;


    const activos =
        productos.filter(producto => {

            return (
                producto.activo === true ||
                producto.activo === 1 ||
                producto.activo === "true"
            );

        }).length;


    const stockBajo =
        productos.filter(producto => {

            const activo =
                producto.activo === true ||
                producto.activo === 1 ||
                producto.activo === "true";


            const cantidad =
                Number(
                    producto.cantidad || 0
                );


            const minimo =
                Number(
                    producto.stock_minimo || 0
                );


            return (
                activo &&
                cantidad <= minimo
            );

        }).length;


    const valorInventario =
        productos.reduce(
            (total, producto) => {

                const activo =
                    producto.activo === true ||
                    producto.activo === 1 ||
                    producto.activo === "true";


                if (!activo) {

                    return total;

                }


                const cantidad =
                    Number(
                        producto.cantidad || 0
                    );


                const compra =
                    Number(
                        producto.precio_compra ||
                        0
                    );


                return total +
                    cantidad * compra;

            },
            0
        );


    const totalElemento =
        document.getElementById(
            "totalProductos"
        );


    const stockElemento =
        document.getElementById(
            "productosStockBajo"
        );


    const activosElemento =
        document.getElementById(
            "productosActivos"
        );


    const valorElemento =
        document.getElementById(
            "valorInventario"
        );


    if (totalElemento) {

        totalElemento.textContent =
            total;

    }


    if (stockElemento) {

        stockElemento.textContent =
            stockBajo;

    }


    if (activosElemento) {

        activosElemento.textContent =
            activos;

    }


    if (valorElemento) {

        valorElemento.textContent =
            formatearMoneda(
                valorInventario
            );

    }

}


/* =========================================================
   NUEVO PRODUCTO
   ========================================================= */

function abrirNuevoProducto() {

    productoEditando = null;

    imagenSeleccionada = null;


    const titulo =
        document.getElementById(
            "modalTitulo"
        );


    const formulario =
        document.getElementById(
            "productoForm"
        );


    const estado =
        document.getElementById(
            "estadoProductoContainer"
        );


    if (titulo) {

        titulo.textContent =
            "Nuevo producto";

    }


    if (formulario) {

        formulario.reset();

    }


    if (estado) {

        estado.classList.add(
            "hidden"
        );

    }


    limpiarImagen();

    actualizarGanancia();

    mostrarModal();

}


/* =========================================================
   EDITAR PRODUCTO
   ========================================================= */

function editarProducto(id) {

    const producto =
        productos.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!producto) return;


    productoEditando =
        producto;


    const titulo =
        document.getElementById(
            "modalTitulo"
        );


    const estado =
        document.getElementById(
            "estadoProductoContainer"
        );


    const codigo =
        document.getElementById(
            "codigo"
        );

    const nombre =
        document.getElementById(
            "nombre"
        );

    const descripcion =
        document.getElementById(
            "descripcion"
        );

    const categoria =
        document.getElementById(
            "categoria"
        );

    const proveedor =
        document.getElementById(
            "proveedor"
        );

    const precioCompra =
        document.getElementById(
            "precioCompra"
        );

    const precioVenta =
        document.getElementById(
            "precioVenta"
        );

    const cantidad =
        document.getElementById(
            "cantidad"
        );

    const stockMinimo =
        document.getElementById(
            "stockMinimo"
        );

    const activo =
        document.getElementById(
            "activo"
        );


    if (titulo) {

        titulo.textContent =
            "Editar producto";

    }


    if (codigo) {

        codigo.value =
            producto.codigo || "";

    }


    if (nombre) {

        nombre.value =
            producto.nombre || "";

    }


    if (descripcion) {

        descripcion.value =
            producto.descripcion || "";

    }


    if (categoria) {

        categoria.value =
            producto.categoria_id || "";

    }


    if (proveedor) {

        proveedor.value =
            producto.proveedor_id || "";

    }


    if (precioCompra) {

        precioCompra.value =
            producto.precio_compra || 0;

    }


    if (precioVenta) {

        precioVenta.value =
            producto.precio_venta ||
            producto.precio ||
            0;

    }


    if (cantidad) {

        cantidad.value =
            producto.cantidad || 0;

    }


    if (stockMinimo) {

        stockMinimo.value =
            producto.stock_minimo || 0;

    }


    if (activo) {

        activo.checked =
            producto.activo === true ||
            producto.activo === 1 ||
            producto.activo === "true";

    }


    if (estado) {

        estado.classList.remove(
            "hidden"
        );

    }


    if (producto.imagen_url) {

        mostrarImagenExistente(
            producto.imagen_url,
            producto.nombre
        );

    } else {

        limpiarImagen();

    }


    actualizarGanancia();

    mostrarModal();

}


/* =========================================================
   GUARDAR PRODUCTO
   ========================================================= */

async function guardarProducto(event) {

    event.preventDefault();


    const formulario =
        document.getElementById(
            "productoForm"
        );


    if (!formulario) return;


    const formData =
        new FormData(
            formulario
        );


    if (
        !productoEditando &&
        !imagenSeleccionada
    ) {

        mostrarMensaje(
            "Debes seleccionar una imagen para crear el producto.",
            "error"
        );

        return;

    }


    try {

        const boton =
            formulario.querySelector(
                'button[type="submit"]'
            );


        if (boton) {

            boton.disabled =
                true;

            boton.textContent =
                "Guardando...";

        }


        let respuesta;


        if (productoEditando) {

            const datos = {

                codigo:
                    formData.get("codigo"),

                nombre:
                    formData.get("nombre"),

                descripcion:
                    formData.get("descripcion"),

                categoria_id:
                    formData.get("categoria_id")
                        || null,

                proveedor_id:
                    formData.get("proveedor_id")
                        || null,

                precio_compra:
                    Number(
                        formData.get(
                            "precio_compra"
                        )
                    ),

                precio_venta:
                    Number(
                        formData.get(
                            "precio_venta"
                        )
                    ),

                cantidad:
                    Number(
                        formData.get(
                            "cantidad"
                        )
                    ),

                stock_minimo:
                    Number(
                        formData.get(
                            "stock_minimo"
                        )
                    ),

                activo:
                    document.getElementById(
                        "activo"
                    )?.checked ?? true

            };


            respuesta =
                await fetch(
                    `${API}/productos/${productoEditando.id}`,
                    {
                        method: "PUT",

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

        } else {

            respuesta =
                await fetch(
                    `${API}/productos`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

        }


        const resultado =
            await respuesta.json()
                .catch(() => ({}));


        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                resultado.mensaje ||
                "No se pudo guardar el producto."
            );

        }


        mostrarMensaje(
            productoEditando
                ? "Producto actualizado correctamente."
                : "Producto creado correctamente.",
            "success"
        );


        cerrarModal();

        await cargarDatosIniciales();


    } catch (error) {

        console.error(
            "Error guardando producto:",
            error
        );


        mostrarMensaje(
            error.message ||
            "Ocurrió un error al guardar.",
            "error"
        );


    } finally {

        const boton =
            formulario.querySelector(
                'button[type="submit"]'
            );


        if (boton) {

            boton.disabled =
                false;

            boton.textContent =
                "Guardar producto";

        }

    }

}


/* =========================================================
   IMAGEN
   ========================================================= */

function manejarImagenSeleccionada(
    event
) {

    const archivo =
        event.target.files?.[0];


    if (!archivo) return;


    const tiposPermitidos = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];


    if (
        !tiposPermitidos.includes(
            archivo.type
        )
    ) {

        mostrarMensaje(
            "Formato no permitido. Usa JPG, PNG o WEBP.",
            "error"
        );


        event.target.value = "";

        return;

    }


    const maximo =
        10 * 1024 * 1024;


    if (
        archivo.size > maximo
    ) {

        mostrarMensaje(
            "La imagen no puede superar los 10 MB.",
            "error"
        );


        event.target.value = "";

        return;

    }


    imagenSeleccionada =
        archivo;


    mostrarPreviewImagen(
        archivo
    );

}


function mostrarPreviewImagen(
    archivo
) {

    const preview =
        document.getElementById(
            "previewImagen"
        );


    const placeholder =
        document.getElementById(
            "imagePlaceholder"
        );


    const fileInfo =
        document.getElementById(
            "imageFileInfo"
        );


    const fileName =
        document.getElementById(
            "imageFileName"
        );


    const fileSize =
        document.getElementById(
            "imageFileSize"
        );


    if (!preview) return;


    const lector =
        new FileReader();


    lector.onload =
        function(event) {

            preview.src =
                event.target.result;


            preview.classList.remove(
                "hidden"
            );


            if (placeholder) {

                placeholder.classList.add(
                    "hidden"
                );

            }


            if (fileInfo) {

                fileInfo.classList.remove(
                    "hidden"
                );

            }


            if (fileName) {

                fileName.textContent =
                    archivo.name;

            }


            if (fileSize) {

                fileSize.textContent =
                    formatearTamano(
                        archivo.size
                    );

            }

        };


    lector.readAsDataURL(
        archivo
    );

}


function mostrarImagenExistente(
    url,
    nombre
) {

    const preview =
        document.getElementById(
            "previewImagen"
        );


    const placeholder =
        document.getElementById(
            "imagePlaceholder"
        );


    const fileInfo =
        document.getElementById(
            "imageFileInfo"
        );


    const fileName =
        document.getElementById(
            "imageFileName"
        );


    const fileSize =
        document.getElementById(
            "imageFileSize"
        );


    if (!preview) return;


    preview.src =
        url;


    preview.classList.remove(
        "hidden"
    );


    if (placeholder) {

        placeholder.classList.add(
            "hidden"
        );

    }


    if (fileInfo) {

        fileInfo.classList.remove(
            "hidden"
        );

    }


    if (fileName) {

        fileName.textContent =
            nombre
                ? `Imagen de ${nombre}`
                : "Imagen actual";

    }


    if (fileSize) {

        fileSize.textContent =
            "Imagen almacenada en Cloudinary";

    }

}


function quitarImagen() {

    imagenSeleccionada =
        null;


    const input =
        document.getElementById(
            "imagen"
        );


    if (input) {

        input.value =
            "";

    }


    limpiarImagen();

}


function limpiarImagen() {

    const preview =
        document.getElementById(
            "previewImagen"
        );


    const placeholder =
        document.getElementById(
            "imagePlaceholder"
        );


    const fileInfo =
        document.getElementById(
            "imageFileInfo"
        );


    if (preview) {

        preview.src =
            "";

        preview.classList.add(
            "hidden"
        );

    }


    if (placeholder) {

        placeholder.classList.remove(
            "hidden"
        );

    }


    if (fileInfo) {

        fileInfo.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   GANANCIA
   ========================================================= */

function actualizarGanancia() {

    const compra =
        Number(
            document.getElementById(
                "precioCompra"
            )?.value || 0
        );


    const venta =
        Number(
            document.getElementById(
                "precioVenta"
            )?.value || 0
        );


    const ganancia =
        venta - compra;


    const margen =
        venta > 0
            ? (ganancia / venta) * 100
            : 0;


    const gananciaElemento =
        document.getElementById(
            "gananciaPreview"
        );


    const margenElemento =
        document.getElementById(
            "margenPreview"
        );


    if (gananciaElemento) {

        gananciaElemento.textContent =
            formatearMoneda(
                ganancia
            );

    }


    if (margenElemento) {

        margenElemento.textContent =
            `${margen.toFixed(1)}%`;

    }

}


/* =========================================================
   DESACTIVAR
   ========================================================= */

let productoParaDesactivar =
    null;


function abrirConfirmacion(
    producto
) {

    productoParaDesactivar =
        producto;


    const nombre =
        document.getElementById(
            "nombreProductoEliminar"
        );


    if (nombre) {

        nombre.textContent =
            producto.nombre ||
            "Producto";

    }


    const modal =
        document.getElementById(
            "confirmModal"
        );


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }

}


function cerrarConfirmacion() {

    productoParaDesactivar =
        null;


    const modal =
        document.getElementById(
            "confirmModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


async function confirmarDesactivacion() {

    if (
        !productoParaDesactivar
    ) return;


    try {

        const respuesta =
            await fetch(
                `${API}/productos/${productoParaDesactivar.id}`,
                {
                    method: "DELETE"
                }
            );


        const resultado =
            await respuesta.json()
                .catch(() => ({}));


        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                "No se pudo desactivar el producto."
            );

        }


        cerrarConfirmacion();

        mostrarMensaje(
            "Producto desactivado correctamente.",
            "success"
        );


        await cargarDatosIniciales();


    } catch (error) {

        console.error(
            "Error desactivando:",
            error
        );


        mostrarMensaje(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   ACTIVAR
   ========================================================= */

async function activarProducto(
    id
) {

    try {

        const respuesta =
            await fetch(
                `${API}/productos/${id}/activar`,
                {
                    method: "PATCH"
                }
            );


        const resultado =
            await respuesta.json()
                .catch(() => ({}));


        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                "No se pudo activar el producto."
            );

        }


        mostrarMensaje(
            "Producto activado correctamente.",
            "success"
        );


        await cargarDatosIniciales();


    } catch (error) {

        console.error(
            "Error activando:",
            error
        );


        mostrarMensaje(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   MODAL
   ========================================================= */

function mostrarModal() {

    const modal =
        document.getElementById(
            "productoModal"
        );


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }

}


function cerrarModal() {

    const modal =
        document.getElementById(
            "productoModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }


    productoEditando =
        null;

    imagenSeleccionada =
        null;

}


/* =========================================================
   MENSAJES
   ========================================================= */

function mostrarMensaje(
    texto,
    tipo = "info"
) {

    const elemento =
        document.getElementById(
            "mensaje"
        );


    if (!elemento) return;


    elemento.textContent =
        texto;


    elemento.classList.remove(
        "hidden"
    );


    elemento.style.borderColor =
        tipo === "error"
            ? "rgba(248,113,113,.30)"
            : tipo === "success"
                ? "rgba(52,211,153,.30)"
                : "rgba(56,189,248,.25)";


    elemento.style.color =
        tipo === "error"
            ? "#fca5a5"
            : tipo === "success"
                ? "#6ee7b7"
                : "#7dd3fc";


    elemento.style.background =
        tipo === "error"
            ? "rgba(248,113,113,.08)"
            : tipo === "success"
                ? "rgba(52,211,153,.08)"
                : "rgba(56,189,248,.08)";


    clearTimeout(
        mostrarMensaje.timer
    );


    mostrarMensaje.timer =
        setTimeout(() => {

            elemento.classList.add(
                "hidden"
            );

        }, 4500);

}


/* =========================================================
   CARGANDO
   ========================================================= */

function mostrarCargando(
    mostrar
) {

    const elemento =
        document.getElementById(
            "cargando"
        );


    if (!elemento) return;


    if (mostrar) {

        elemento.classList.remove(
            "hidden"
        );

    } else {

        elemento.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   FORMATO MONEDA
   ========================================================= */

function formatearMoneda(
    valor
) {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(
        Number(valor) || 0
    );

}


/* =========================================================
   FORMATO TAMAÑO
   ========================================================= */

function formatearTamano(
    bytes
) {

    if (!bytes) {

        return "0 KB";

    }


    const unidades = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    const indice =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    indice
                )
            ).toFixed(2)
        )
        + " "
        + unidades[indice]
    );

}


/* =========================================================
   SEGURIDAD HTML
   ========================================================= */

function escapeHTML(
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

console.log("");
console.log("========================================");
console.log("🟢 PRODUCTOS.JS FUE CARGADO");
console.log("========================================");

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log("");
        console.log("🟡 DOMCONTENTLOADED DE PRODUCTOS");
        console.log("========================================");

        const autenticado =
            await verificarSesion();

        console.log(
            "🔐 Resultado autenticación:",
            autenticado
        );

        if (!autenticado) {

            console.log(
                "🚫 No se ejecutará cargarDatosIniciales()."
            );

            return;
        }

        console.log(
            "✅ Sesión válida."
        );

        configurarEventos();

        console.log(
            "✅ Eventos configurados."
        );

        await cargarDatosIniciales();

        console.log(
            "✅ cargarDatosIniciales() terminó."
        );

    }
);