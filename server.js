require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;

/* =========================================================
   CONFIGURACIÓN GENERAL
   ========================================================= */

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

/* =========================================================
   BASE DE DATOS - SUPABASE / POSTGRESQL
   ========================================================= */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("connect", () => {
    console.log("🌙 Conectado a Supabase (PostgreSQL)");
});

pool.on("error", (error) => {
    console.error(
        "❌ Error inesperado en PostgreSQL:",
        error
    );
});

/* =========================================================
   CLOUDINARY
   ========================================================= */

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log(
    "☁️ Cloudinary configurado:",
    {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
    }
);

if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error(
        "❌ Falta CLOUDINARY_CLOUD_NAME en .env"
    );
}

if (!process.env.CLOUDINARY_API_KEY) {
    console.error(
        "❌ Falta CLOUDINARY_API_KEY en .env"
    );
}

if (!process.env.CLOUDINARY_API_SECRET) {
    console.error(
        "❌ Falta CLOUDINARY_API_SECRET en .env"
    );
}

/* =========================================================
   MULTER
   ========================================================= */

const almacenamiento = multer.memoryStorage();

const upload = multer({
    storage: almacenamiento
});

/* =========================================================
   CARPETA PUBLIC
   ========================================================= */

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);

/* =========================================================
   FUNCIÓN PARA SUBIR IMAGEN A CLOUDINARY
   ========================================================= */

function subirImagen(buffer) {

    return new Promise(
        (resolve, reject) => {

            if (!buffer) {

                return reject(
                    new Error(
                        "No se recibió ninguna imagen."
                    )
                );
            }

            console.log(
                "☁️ Iniciando subida a Cloudinary..."
            );

            console.log(
                "☁️ Cloud Name utilizado:",
                process.env.CLOUDINARY_CLOUD_NAME
            );

            const stream =
                cloudinary.uploader.upload_stream(
                    {
                        folder: "lunas_octubre",

                        transformation: [
                            {
                                width: 800,
                                crop: "limit"
                            }
                        ],

                        quality: "auto"
                    },

                    (
                        error,
                        resultado
                    ) => {

                        if (error) {

                            console.error("");
                            console.error(
                                "========================================"
                            );
                            console.error(
                                "❌ ERROR CLOUDINARY"
                            );
                            console.error(
                                "========================================"
                            );

                            console.error(
                                "Mensaje:",
                                error.message
                            );

                            console.error(
                                "Código HTTP:",
                                error.http_code
                            );

                            console.error(
                                "Nombre:",
                                error.name
                            );

                            console.error(
                                "Detalle:",
                                error
                            );

                            console.error(
                                "Cloud Name:",
                                process.env.CLOUDINARY_CLOUD_NAME
                            );

                            console.error(
                                "========================================"
                            );
                            console.error("");

                            return reject(error);
                        }

                        if (!resultado) {

                            return reject(
                                new Error(
                                    "Cloudinary no devolvió información de la imagen."
                                )
                            );
                        }

                        console.log(
                            "☁️ Imagen subida correctamente."
                        );

                        console.log(
                            "☁️ URL:",
                            resultado.secure_url
                        );

                        resolve(
                            resultado.secure_url
                        );
                    }
                );

            stream.end(buffer);
        }
    );
}

/* =========================================================
   CATEGORÍAS
   ========================================================= */

app.get(
    "/api/categorias",
    async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        id,
                        nombre
                    FROM categorias
                    ORDER BY nombre ASC
                `);

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo categorías:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo categorías"
            });
        }
    }
);


/* =========================================================
   CREAR CATEGORÍA
   ========================================================= */

app.post(
    "/api/categorias",
    async (req, res) => {

        try {

            const {
                nombre
            } = req.body;

            if (
                !nombre ||
                !nombre.trim()
            ) {

                return res.status(400).json({
                    error:
                        "El nombre de la categoría es obligatorio."
                });
            }

            const resultado =
                await pool.query(
                    `
                    INSERT INTO categorias
                    (
                        nombre
                    )
                    VALUES
                    (
                        $1
                    )
                    RETURNING *
                    `,
                    [
                        nombre.trim()
                    ]
                );

            res.status(201).json(
                resultado.rows[0]
            );

        } catch (error) {

            console.error(
                "❌ Error creando categoría:",
                error
            );

            if (
                error.code === "23505"
            ) {

                return res.status(400).json({
                    error:
                        "La categoría ya existe."
                });
            }

            res.status(500).json({
                error:
                    error.message ||
                    "Error creando categoría"
            });
        }
    }
);


/* =========================================================
   PROVEEDORES
   ========================================================= */

app.get(
    "/api/proveedores",
    async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        id,
                        nombre
                    FROM proveedores
                    ORDER BY nombre ASC
                `);

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo proveedores:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo proveedores"
            });
        }
    }
);


/* =========================================================
   OBTENER PRODUCTOS
   ========================================================= */

app.get(
    "/api/productos",
    async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        p.id,
                        p.nombre,
                        p.codigo,
                        p.descripcion,

                        p.categoria_id,
                        c.nombre AS categoria,

                        p.proveedor_id,
                        pr.nombre AS proveedor,

                        p.precio,
                        p.precio_compra,
                        p.precio_venta,

                        p.cantidad,
                        p.stock_minimo,

                        /*
                           IMPORTANTE:
                           La base de datos guarda la URL
                           en la columna "imagen".

                           El frontend utiliza "imagen_url".
                        */

                        p.imagen AS imagen_url,

                        p.activo,
                        p.updated_at,

                        (
                            p.precio_venta -
                            p.precio_compra
                        ) AS ganancia,

                        CASE
                            WHEN p.precio_compra > 0
                            THEN ROUND(
                                (
                                    (
                                        p.precio_venta -
                                        p.precio_compra
                                    )
                                    /
                                    p.precio_compra
                                ) * 100,
                                2
                            )
                            ELSE 0
                        END AS margen

                    FROM productos_lunas p

                    LEFT JOIN categorias c
                        ON c.id =
                        p.categoria_id

                    LEFT JOIN proveedores pr
                        ON pr.id =
                        p.proveedor_id

                    ORDER BY
                        p.id DESC
                `);

            console.log(
                `📦 Productos encontrados: ${resultado.rows.length}`
            );

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error("");
            console.error(
                "========================================"
            );
            console.error(
                "❌ ERROR OBTENIENDO PRODUCTOS"
            );
            console.error(
                "========================================"
            );

            console.error(
                "Mensaje:",
                error.message
            );

            console.error(
                "Código:",
                error.code
            );

            console.error(
                "Detalle:",
                error.detail
            );

            console.error(
                "Hint:",
                error.hint
            );

            console.error(
                "========================================"
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo productos"
            });
        }
    }
);


/* =========================================================
   CREAR PRODUCTO
   ========================================================= */

app.post(
    "/api/productos",
    upload.single("imagen"),
    async (req, res) => {

        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "🌙 NUEVO PRODUCTO"
        );
        console.log(
            "========================================"
        );

        try {

            const {
                nombre,
                codigo,
                descripcion,
                categoria_id,
                proveedor_id,
                precio_compra,
                precio_venta,
                cantidad,
                stock_minimo
            } = req.body;

            console.log(
                "📦 Datos recibidos:"
            );

            console.log({
                nombre,
                codigo,
                descripcion,
                categoria_id,
                proveedor_id,
                precio_compra,
                precio_venta,
                cantidad,
                stock_minimo
            });

            console.log(
                "🖼️ Imagen recibida:",
                req.file
                    ? `${req.file.originalname} (${req.file.size} bytes)`
                    : "NO"
            );

            /* -------------------------------------------------
               VALIDACIONES
               ------------------------------------------------- */

            if (
                !nombre ||
                !nombre.trim()
            ) {

                return res.status(400).json({
                    error:
                        "El nombre del producto es obligatorio."
                });
            }

            if (
                !codigo ||
                !codigo.trim()
            ) {

                return res.status(400).json({
                    error:
                        "El código del producto es obligatorio."
                });
            }

            if (
                precio_compra === undefined ||
                precio_compra === ""
            ) {

                return res.status(400).json({
                    error:
                        "El precio de compra es obligatorio."
                });
            }

            if (
                precio_venta === undefined ||
                precio_venta === ""
            ) {

                return res.status(400).json({
                    error:
                        "El precio de venta es obligatorio."
                });
            }

            if (
                cantidad === undefined ||
                cantidad === ""
            ) {

                return res.status(400).json({
                    error:
                        "La cantidad es obligatoria."
                });
            }

            if (!req.file) {

                return res.status(400).json({
                    error:
                        "Debes seleccionar una imagen para el producto."
                });
            }

            const precioCompraNumero =
                Number(
                    precio_compra
                );

            const precioVentaNumero =
                Number(
                    precio_venta
                );

            const cantidadNumero =
                Number(
                    cantidad
                );

            const stockMinimoNumero =
                Number(
                    stock_minimo || 0
                );

            if (
                !Number.isFinite(
                    precioCompraNumero
                ) ||
                precioCompraNumero < 0
            ) {

                return res.status(400).json({
                    error:
                        "El precio de compra no es válido."
                });
            }

            if (
                !Number.isFinite(
                    precioVentaNumero
                ) ||
                precioVentaNumero < 0
            ) {

                return res.status(400).json({
                    error:
                        "El precio de venta no es válido."
                });
            }

            if (
                !Number.isFinite(
                    cantidadNumero
                ) ||
                cantidadNumero < 0
            ) {

                return res.status(400).json({
                    error:
                        "La cantidad no es válida."
                });
            }

            if (
                !Number.isFinite(
                    stockMinimoNumero
                ) ||
                stockMinimoNumero < 0
            ) {

                return res.status(400).json({
                    error:
                        "El stock mínimo no es válido."
                });
            }

            /* -------------------------------------------------
               SUBIR IMAGEN
               ------------------------------------------------- */

            console.log(
                "☁️ Subiendo imagen a Cloudinary..."
            );

            const imagenUrl =
                await subirImagen(
                    req.file.buffer
                );

            console.log(
                "✅ Imagen subida:"
            );

            console.log(
                imagenUrl
            );

            /* -------------------------------------------------
               INSERTAR EN POSTGRESQL
               ------------------------------------------------- */

            console.log(
                "🗄️ Guardando producto en PostgreSQL..."
            );

            const resultado =
                await pool.query(
                    `
                    INSERT INTO productos_lunas
                    (
                        nombre,
                        codigo,
                        descripcion,
                        categoria_id,
                        proveedor_id,
                        precio,
                        precio_compra,
                        precio_venta,
                        cantidad,
                        stock_minimo,
                        imagen,
                        activo
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10,
                        $11,
                        TRUE
                    )
                    RETURNING *
                    `,
                    [
                        nombre.trim(),
                        codigo.trim(),
                        descripcion?.trim() || null,
                        categoria_id || null,
                        proveedor_id || null,
                        precioVentaNumero,
                        precioCompraNumero,
                        precioVentaNumero,
                        cantidadNumero,
                        stockMinimoNumero,
                        imagenUrl
                    ]
                );

            const producto =
                resultado.rows[0];

            console.log(
                "✅ PRODUCTO GUARDADO CORRECTAMENTE"
            );

            console.log(
                producto
            );

            console.log(
                "========================================"
            );

            res.status(201).json({
                mensaje:
                    "Producto creado correctamente.",

                producto: {
                    ...producto,

                    imagen_url:
                        producto.imagen
                }
            });

        } catch (error) {

            console.error("");
            console.error(
                "========================================"
            );
            console.error(
                "❌ ERROR CREANDO PRODUCTO"
            );
            console.error(
                "========================================"
            );

            console.error(
                "Mensaje:",
                error.message
            );

            console.error(
                "Código:",
                error.code
            );

            console.error(
                "HTTP Code:",
                error.http_code
            );

            console.error(
                "Detalle:",
                error.detail
            );

            console.error(
                "Hint:",
                error.hint
            );

            console.error(
                "Tabla:",
                error.table
            );

            console.error(
                "Columna:",
                error.column
            );

            console.error(
                "Constraint:",
                error.constraint
            );

            console.error(
                "Error completo:"
            );

            console.error(
                error
            );

            console.error(
                "========================================"
            );

            /* -----------------------------------------------
               ERROR CLOUDINARY 401 / 403
               ----------------------------------------------- */

            if (
                error.http_code === 401 ||
                error.http_code === 403
            ) {

                return res
                    .status(
                        error.http_code
                    )
                    .json({
                        error:
                            `Cloudinary rechazó la operación (${error.http_code}). Revisa API Key, API Secret y permisos de la cuenta.`
                    });
            }

            /* -----------------------------------------------
               CÓDIGO DUPLICADO
               ----------------------------------------------- */

            if (
                error.code === "23505"
            ) {

                return res.status(400).json({
                    error:
                        "El código del producto ya existe. Usa un código diferente."
                });
            }

            /* -----------------------------------------------
               ERROR DE CLAVE FORÁNEA
               ----------------------------------------------- */

            if (
                error.code === "23503"
            ) {

                return res.status(400).json({
                    error:
                        "La categoría o el proveedor seleccionado no existe."
                });
            }

            /* -----------------------------------------------
               ERROR DE CAMPO OBLIGATORIO
               ----------------------------------------------- */

            if (
                error.code === "23502"
            ) {

                return res.status(400).json({
                    error:
                        error.column
                            ? `El campo "${error.column}" es obligatorio.`
                            : "Falta un campo obligatorio."
                });
            }

            /* -----------------------------------------------
               ERROR DE TIPO DE DATOS
               ----------------------------------------------- */

            if (
                error.code === "22P02"
            ) {

                return res.status(400).json({
                    error:
                        "Uno de los datos enviados tiene un formato incorrecto."
                });
            }

            /* -----------------------------------------------
               ERROR GENERAL
               ----------------------------------------------- */

            res.status(500).json({
                error:
                    error.message ||
                    "Error al crear producto."
            });
        }
    }
);


/* =========================================================
   ACTUALIZAR PRODUCTO
   ========================================================= */

app.put(
    "/api/productos/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const {
                nombre,
                codigo,
                descripcion,
                categoria_id,
                proveedor_id,
                precio_compra,
                precio_venta,
                cantidad,
                stock_minimo,
                activo
            } = req.body;

            if (
                !nombre ||
                !nombre.trim()
            ) {

                return res.status(400).json({
                    error:
                        "El nombre del producto es obligatorio."
                });
            }

            if (
                !codigo ||
                !codigo.trim()
            ) {

                return res.status(400).json({
                    error:
                        "El código del producto es obligatorio."
                });
            }

            const precioCompraNumero =
                Number(
                    precio_compra
                );

            const precioVentaNumero =
                Number(
                    precio_venta
                );

            const cantidadNumero =
                Number(
                    cantidad
                );

            const stockMinimoNumero =
                Number(
                    stock_minimo || 0
                );

            if (
                !Number.isFinite(
                    precioCompraNumero
                )
            ) {

                return res.status(400).json({
                    error:
                        "El precio de compra no es válido."
                });
            }

            if (
                !Number.isFinite(
                    precioVentaNumero
                )
            ) {

                return res.status(400).json({
                    error:
                        "El precio de venta no es válido."
                });
            }

            if (
                !Number.isFinite(
                    cantidadNumero
                )
            ) {

                return res.status(400).json({
                    error:
                        "La cantidad no es válida."
                });
            }

            const resultado =
                await pool.query(
                    `
                    UPDATE productos_lunas
                    SET
                        nombre = $1,
                        codigo = $2,
                        descripcion = $3,
                        categoria_id = $4,
                        proveedor_id = $5,
                        precio = $6,
                        precio_compra = $7,
                        precio_venta = $8,
                        cantidad = $9,
                        stock_minimo = $10,
                        activo = $11,
                        updated_at = NOW()
                    WHERE id = $12
                    RETURNING *
                    `,
                    [
                        nombre.trim(),
                        codigo.trim(),
                        descripcion?.trim() || null,
                        categoria_id || null,
                        proveedor_id || null,
                        precioVentaNumero,
                        precioCompraNumero,
                        precioVentaNumero,
                        cantidadNumero,
                        stockMinimoNumero,
                        activo !== false,
                        id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Producto no encontrado."
                });
            }

            const producto =
                resultado.rows[0];

            res.json({
                mensaje:
                    "Producto actualizado correctamente.",

                producto: {
                    ...producto,

                    imagen_url:
                        producto.imagen
                }
            });

        } catch (error) {

            console.error(
                "❌ ERROR ACTUALIZANDO PRODUCTO"
            );

            console.error(
                "Mensaje:",
                error.message
            );

            console.error(
                "Código:",
                error.code
            );

            console.error(
                "Detalle:",
                error.detail
            );

            console.error(
                "Hint:",
                error.hint
            );

            if (
                error.code === "23505"
            ) {

                return res.status(400).json({
                    error:
                        "El código del producto ya existe."
                });
            }

            res.status(500).json({
                error:
                    error.message ||
                    "Error actualizando producto."
            });
        }
    }
);


/* =========================================================
   DESACTIVAR PRODUCTO
   ========================================================= */

app.delete(
    "/api/productos/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const resultado =
                await pool.query(
                    `
                    UPDATE productos_lunas
                    SET
                        activo = FALSE,
                        updated_at = NOW()
                    WHERE id = $1
                    RETURNING *
                    `,
                    [
                        id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Producto no encontrado."
                });
            }

            const producto =
                resultado.rows[0];

            res.json({
                mensaje:
                    "Producto desactivado correctamente.",

                producto: {
                    ...producto,

                    imagen_url:
                        producto.imagen
                }
            });

        } catch (error) {

            console.error(
                "❌ Error desactivando producto:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error desactivando producto."
            });
        }
    }
);


/* =========================================================
   ACTIVAR PRODUCTO
   ========================================================= */

app.patch(
    "/api/productos/:id/activar",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const resultado =
                await pool.query(
                    `
                    UPDATE productos_lunas
                    SET
                        activo = TRUE,
                        updated_at = NOW()
                    WHERE id = $1
                    RETURNING *
                    `,
                    [
                        id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Producto no encontrado."
                });
            }

            const producto =
                resultado.rows[0];

            res.json({
                mensaje:
                    "Producto activado correctamente.",

                producto: {
                    ...producto,

                    imagen_url:
                        producto.imagen
                }
            });

        } catch (error) {

            console.error(
                "❌ Error activando producto:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error activando producto."
            });
        }
    }
);


/* =========================================================
   COMPRAS
   ========================================================= */


/* =========================================================
   OBTENER TODAS LAS COMPRAS
   ========================================================= */

app.get(
    "/api/compras",
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT
                        c.id,
                        c.proveedor_id,

                        p.nombre AS proveedor,

                        c.fecha,
                        c.total,
                        c.observaciones,
                        c.created_at,

                        COUNT(dc.id)::INTEGER
                            AS cantidad_detalles

                    FROM compras c

                    LEFT JOIN proveedores p
                        ON p.id =
                        c.proveedor_id

                    LEFT JOIN detalle_compras dc
                        ON dc.compra_id =
                        c.id

                    GROUP BY
                        c.id,
                        c.proveedor_id,
                        p.nombre,
                        c.fecha,
                        c.total,
                        c.observaciones,
                        c.created_at

                    ORDER BY
                        c.fecha DESC,
                        c.id DESC
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo compras:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo compras."
            });
        }
    }
);


/* =========================================================
   OBTENER UNA COMPRA CON SUS DETALLES
   ========================================================= */

app.get(
    "/api/compras/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const compraResultado =
                await pool.query(
                    `
                    SELECT
                        c.id,
                        c.proveedor_id,

                        p.nombre AS proveedor,

                        c.fecha,
                        c.total,
                        c.observaciones,
                        c.created_at

                    FROM compras c

                    LEFT JOIN proveedores p
                        ON p.id =
                        c.proveedor_id

                    WHERE c.id = $1
                    `,
                    [
                        id
                    ]
                );

            if (
                compraResultado.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Compra no encontrada."
                });
            }

            const detallesResultado =
                await pool.query(
                    `
                    SELECT
                        dc.id,
                        dc.compra_id,
                        dc.producto_id,

                        p.nombre AS producto,
                        p.codigo,

                        dc.cantidad,
                        dc.precio_compra,
                        dc.subtotal

                    FROM detalle_compras dc

                    INNER JOIN productos_lunas p
                        ON p.id =
                        dc.producto_id

                    WHERE dc.compra_id = $1

                    ORDER BY
                        dc.id ASC
                    `,
                    [
                        id
                    ]
                );

            res.json({

                compra:
                    compraResultado.rows[0],

                detalles:
                    detallesResultado.rows

            });

        } catch (error) {

            console.error(
                "❌ Error obteniendo detalle de compra:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo detalle de compra."
            });
        }
    }
);


/* =========================================================
   REGISTRAR COMPRA
   ========================================================= */

app.post(
    "/api/compras",
    async (req, res) => {

        const client =
            await pool.connect();

        try {

            const {
                proveedor_id,
                fecha,
                observaciones,
                detalles
            } = req.body;


            /* -------------------------------------------------
               VALIDAR PRODUCTOS
               ------------------------------------------------- */

            if (
                !Array.isArray(
                    detalles
                )
            ) {

                return res.status(400).json({
                    error:
                        "La compra debe contener productos."
                });
            }

            if (
                detalles.length === 0
            ) {

                return res.status(400).json({
                    error:
                        "Debes agregar al menos un producto."
                });
            }


            /* -------------------------------------------------
               VALIDAR CADA DETALLE
               ------------------------------------------------- */

            for (
                const detalle
                of detalles
            ) {

                const productoId =
                    Number(
                        detalle.producto_id
                    );

                const cantidad =
                    Number(
                        detalle.cantidad
                    );

                const precioCompra =
                    Number(
                        detalle.precio_compra
                    );


                if (
                    !Number.isInteger(
                        productoId
                    ) ||
                    productoId <= 0
                ) {

                    return res.status(400).json({
                        error:
                            "Uno de los productos seleccionados no es válido."
                    });
                }


                if (
                    !Number.isInteger(
                        cantidad
                    ) ||
                    cantidad <= 0
                ) {

                    return res.status(400).json({
                        error:
                            "La cantidad debe ser un número entero mayor que cero."
                    });
                }


                if (
                    !Number.isFinite(
                        precioCompra
                    ) ||
                    precioCompra <= 0
                ) {

                    return res.status(400).json({
                        error:
                            "El precio de compra debe ser mayor que cero."
                    });
                }
            }


            /* -------------------------------------------------
               INICIAR TRANSACCIÓN
               ------------------------------------------------- */

            await client.query(
                "BEGIN"
            );


            /* -------------------------------------------------
               CALCULAR TOTAL
               ------------------------------------------------- */

            let total = 0;


            for (
                const detalle
                of detalles
            ) {

                const cantidad =
                    Number(
                        detalle.cantidad
                    );

                const precioCompra =
                    Number(
                        detalle.precio_compra
                    );

                const subtotal =
                    cantidad *
                    precioCompra;

                total += subtotal;
            }


            /* -------------------------------------------------
               CREAR COMPRA
               ------------------------------------------------- */

            const compraResultado =
                await client.query(
                    `
                    INSERT INTO compras
                    (
                        proveedor_id,
                        fecha,
                        total,
                        observaciones
                    )
                    VALUES
                    (
                        $1,
                        COALESCE(
                            $2,
                            NOW()
                        ),
                        $3,
                        $4
                    )
                    RETURNING *
                    `,
                    [
                        proveedor_id
                            ? Number(proveedor_id)
                            : null,

                        fecha || null,

                        total,

                        observaciones
                            ? observaciones.trim()
                            : null
                    ]
                );


            const compra =
                compraResultado.rows[0];


            /* -------------------------------------------------
               GUARDAR DETALLES
               ------------------------------------------------- */

            const detallesGuardados =
                [];


            for (
                const detalle
                of detalles
            ) {

                const productoId =
                    Number(
                        detalle.producto_id
                    );

                const cantidad =
                    Number(
                        detalle.cantidad
                    );

                const precioCompra =
                    Number(
                        detalle.precio_compra
                    );

                const subtotal =
                    cantidad *
                    precioCompra;


                /* ---------------------------------------------
                   BLOQUEAR PRODUCTO
                   --------------------------------------------- */

                const productoResultado =
                    await client.query(
                        `
                        SELECT
                            id,
                            nombre,
                            codigo,
                            cantidad

                        FROM productos_lunas

                        WHERE id = $1

                        FOR UPDATE
                        `,
                        [
                            productoId
                        ]
                    );


                if (
                    productoResultado.rows.length === 0
                ) {

                    throw new Error(
                        `El producto con ID ${productoId} no existe.`
                    );
                }


                const producto =
                    productoResultado.rows[0];


                /* ---------------------------------------------
                   INSERTAR DETALLE
                   --------------------------------------------- */

                const detalleResultado =
                    await client.query(
                        `
                        INSERT INTO detalle_compras
                        (
                            compra_id,
                            producto_id,
                            cantidad,
                            precio_compra,
                            subtotal
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5
                        )
                        RETURNING *
                        `,
                        [
                            compra.id,
                            productoId,
                            cantidad,
                            precioCompra,
                            subtotal
                        ]
                    );


                detallesGuardados.push(
                    detalleResultado.rows[0]
                );


                /* ---------------------------------------------
                   AUMENTAR STOCK
                   --------------------------------------------- */

                await client.query(
                    `
                    UPDATE productos_lunas

                    SET
                        cantidad =
                            cantidad + $1,

                        precio_compra =
                            $2,

                        updated_at =
                            NOW()

                    WHERE id = $3
                    `,
                    [
                        cantidad,
                        precioCompra,
                        productoId
                    ]
                );


                /* ---------------------------------------------
                   MOVIMIENTO DE INVENTARIO
                   --------------------------------------------- */

                await client.query(
                    `
                    INSERT INTO movimientos_inventario
                    (
                        producto_id,
                        tipo,
                        cantidad,
                        motivo,
                        referencia_tipo,
                        referencia_id
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )
                    `,
                    [
                        productoId,

                        "COMPRA",

                        cantidad,

                        "Entrada de inventario por compra",

                        "COMPRA",

                        compra.id
                    ]
                );
            }


            /* -------------------------------------------------
               CONFIRMAR TRANSACCIÓN
               ------------------------------------------------- */

            await client.query(
                "COMMIT"
            );


            /* -------------------------------------------------
               RESPUESTA
               ------------------------------------------------- */

            console.log("");
            console.log(
                "========================================"
            );
            console.log(
                "🛒 COMPRA REGISTRADA"
            );
            console.log(
                "========================================"
            );
            console.log(
                "ID:",
                compra.id
            );
            console.log(
                "Total:",
                total
            );
            console.log(
                "Productos:",
                detalles.length
            );
            console.log(
                "========================================"
            );
            console.log("");


            res.status(201).json({

                mensaje:
                    "Compra registrada correctamente.",

                compra: {
                    ...compra,

                    total:
                        Number(total)
                },

                detalles:
                    detallesGuardados
            });


        } catch (error) {


            /* -------------------------------------------------
               ROLLBACK
               ------------------------------------------------- */

            try {

                await client.query(
                    "ROLLBACK"
                );

            } catch (
                rollbackError
            ) {

                console.error(
                    "❌ Error haciendo ROLLBACK:",
                    rollbackError
                );
            }


            console.error("");
            console.error(
                "========================================"
            );
            console.error(
                "❌ ERROR REGISTRANDO COMPRA"
            );
            console.error(
                "========================================"
            );

            console.error(
                "Mensaje:",
                error.message
            );

            console.error(
                "Código:",
                error.code
            );

            console.error(
                "Detalle:",
                error.detail
            );

            console.error(
                "Hint:",
                error.hint
            );

            console.error(
                "Error completo:",
                error
            );

            console.error(
                "========================================"
            );


            if (
                error.code === "23503"
            ) {

                return res.status(400).json({
                    error:
                        "El proveedor o uno de los productos seleccionados no existe."
                });
            }


            if (
                error.code === "23502"
            ) {

                return res.status(400).json({
                    error:
                        error.column
                            ? `El campo "${error.column}" es obligatorio.`
                            : "Falta un campo obligatorio."
                });
            }


            if (
                error.code === "22P02"
            ) {

                return res.status(400).json({
                    error:
                        "Uno de los datos enviados tiene un formato incorrecto."
                });
            }


            res.status(500).json({
                error:
                    error.message ||
                    "Error registrando compra."
            });


        } finally {

            client.release();
        }
    }
);


/* =========================================================
   RUTAS HTML
   ========================================================= */

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "login.html"
            )
        );
    }
);


app.get(
    "/admin.html",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "admin.html"
            )
        );
    }
);


app.get(
    "/login.html",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "login.html"
            )
        );
    }
);


/* =========================================================
   MANEJADOR GENERAL DE ERRORES
   ========================================================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error("");
        console.error(
            "========================================"
        );
        console.error(
            "❌ ERROR GENERAL DEL SERVIDOR"
        );
        console.error(
            "========================================"
        );

        console.error(
            "Mensaje:",
            error.message
        );

        console.error(
            "Código:",
            error.code
        );

        console.error(
            "HTTP Code:",
            error.http_code
        );

        console.error(
            "Detalle:",
            error.detail
        );

        console.error(
            error
        );

        console.error(
            "========================================"
        );

        res.status(
            error.http_code || 500
        ).json({
            error:
                error.message ||
                "Error interno del servidor."
        });
    }
);


/* =========================================================
   INICIAR SERVIDOR
   ========================================================= */

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            "🌙 LUNAS DE OCTUBRE"
        );

        console.log(
            "========================================"
        );

        console.log(
            `🌙 Servidor corriendo en puerto ${PORT}`
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            "========================================"
        );

        console.log("");
    }
);