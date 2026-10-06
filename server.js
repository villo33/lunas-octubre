require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const { v2: cloudinary } = require("cloudinary");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;

/* =========================================================
   CONFIGURACIÓN DE AUTENTICACIÓN
   ========================================================= */

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const AUTH_SECRET = process.env.AUTH_SECRET;

const SESSION_COOKIE = "lunas_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas

const sesiones = new Map();

/* =========================================================
   VERIFICAR CONFIGURACIÓN DE SEGURIDAD
   ========================================================= */

if (!ADMIN_USER) {
    console.error(
        "❌ Falta ADMIN_USER en las variables de entorno."
    );
}

if (!ADMIN_PASSWORD) {
    console.error(
        "❌ Falta ADMIN_PASSWORD en las variables de entorno."
    );
}

if (!AUTH_SECRET) {
    console.error(
        "❌ Falta AUTH_SECRET en las variables de entorno."
    );
}

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
   FUNCIONES DE AUTENTICACIÓN
   ========================================================= */

/*
   Leer cookies manualmente.

   No necesitamos instalar cookie-parser.
*/

function obtenerCookies(req) {

    const header =
        req.headers.cookie;

    if (!header) {
        return {};
    }

    return header
        .split(";")
        .reduce(
            (cookies, item) => {

                const partes =
                    item.trim().split("=");

                const nombre =
                    partes.shift();

                const valor =
                    partes.join("=");

                if (nombre) {
                    cookies[nombre] =
                        decodeURIComponent(
                            valor || ""
                        );
                }

                return cookies;
            },
            {}
        );
}


/*
   Crear identificador de sesión.

   AUTH_SECRET participa en la generación
   del token para que la sesión no sea
   simplemente un valor predecible.
*/

function crearTokenSesion() {

    const aleatorio =
        crypto.randomBytes(32).toString("hex");

    const timestamp =
        Date.now().toString();

    const base =
        `${aleatorio}.${timestamp}`;

    const firma =
        crypto
            .createHmac(
                "sha256",
                AUTH_SECRET || "missing-auth-secret"
            )
            .update(base)
            .digest("hex");

    return `${base}.${firma}`;
}


/*
   Comparación segura de valores.

   Evita comparar directamente strings
   cuando sea posible.
*/

function compararSeguramente(
    valorA,
    valorB
) {

    if (
        typeof valorA !== "string" ||
        typeof valorB !== "string"
    ) {
        return false;
    }

    const bufferA =
        Buffer.from(
            valorA,
            "utf8"
        );

    const bufferB =
        Buffer.from(
            valorB,
            "utf8"
        );

    if (
        bufferA.length !==
        bufferB.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        bufferA,
        bufferB
    );
}


/*
   Obtener sesión actual.
*/

function obtenerSesion(req) {

    const cookies =
        obtenerCookies(req);

    const token =
        cookies[SESSION_COOKIE];

    if (!token) {
        return null;
    }

    const sesion =
        sesiones.get(token);

    if (!sesion) {
        return null;
    }

    if (
        Date.now() >
        sesion.expiresAt
    ) {

        sesiones.delete(token);

        return null;
    }

    return {
        token,
        ...sesion
    };
}


/*
   Crear cookie de sesión.

   HttpOnly:
   JavaScript del navegador no puede
   leer la cookie.

   SameSite=Lax:
   ayuda a reducir ataques CSRF.

   Secure:
   se activa en producción cuando
   Render está utilizando HTTPS.
*/

function establecerCookieSesion(
    res,
    token
) {

    const secure =
        process.env.NODE_ENV === "production";

    const cookie =
        [
            `${SESSION_COOKIE}=${encodeURIComponent(token)}`,

            "HttpOnly",

            "Path=/",

            "SameSite=Lax",

            `Max-Age=${Math.floor(
                SESSION_DURATION / 1000
            )}`,

            secure
                ? "Secure"
                : ""
        ]
            .filter(Boolean)
            .join("; ");

    res.setHeader(
        "Set-Cookie",
        cookie
    );
}


/*
   Eliminar cookie de sesión.
*/

function eliminarCookieSesion(res) {

    const secure =
        process.env.NODE_ENV === "production";

    const cookie =
        [
            `${SESSION_COOKIE}=`,
            "HttpOnly",
            "Path=/",
            "SameSite=Lax",
            "Max-Age=0",
            "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
            secure
                ? "Secure"
                : ""
        ]
            .filter(Boolean)
            .join("; ");

    res.setHeader(
        "Set-Cookie",
        cookie
    );
}


/* =========================================================
   MIDDLEWARE DE AUTENTICACIÓN
   ========================================================= */

function requireAuth(
    req,
    res,
    next
) {

    const sesion =
        obtenerSesion(req);

    if (!sesion) {

        /*
           Para peticiones API devolvemos
           401 en lugar de redireccionar.
        */

        if (
            req.path.startsWith("/api/")
        ) {

            return res.status(401).json({
                error:
                    "Sesión no válida o expirada."
            });
        }

        /*
           Para páginas HTML enviamos
           al login.
        */

        return res.redirect(
            "/login.html"
        );
    }

    req.sesion =
        sesion;

    next();
}


/* =========================================================
   AUTENTICACIÓN
   ========================================================= */


/*
   POST /api/auth/login

   Iniciar sesión.
*/

app.post(
    "/api/auth/login",
    (req, res) => {

        try {

            const {
                usuario,
                password
            } = req.body;

            if (
                !ADMIN_USER ||
                !ADMIN_PASSWORD ||
                !AUTH_SECRET
            ) {

                console.error(
                    "❌ Autenticación no disponible: faltan variables de entorno."
                );

                return res.status(500).json({
                    error:
                        "El sistema de autenticación no está configurado correctamente en el servidor."
                });
            }

            if (
                typeof usuario !== "string" ||
                typeof password !== "string"
            ) {

                return res.status(400).json({
                    error:
                        "Usuario y contraseña son obligatorios."
                });
            }

            const usuarioCorrecto =
                compararSeguramente(
                    usuario.trim(),
                    ADMIN_USER
                );

            const passwordCorrecta =
                compararSeguramente(
                    password,
                    ADMIN_PASSWORD
                );

            if (
                !usuarioCorrecto ||
                !passwordCorrecta
            ) {

                console.log(
                    "⚠️ Intento de acceso rechazado."
                );

                return res.status(401).json({
                    error:
                        "Usuario o contraseña incorrectos."
                });
            }

            const token =
                crearTokenSesion();

            const expiresAt =
                Date.now() +
                SESSION_DURATION;

            sesiones.set(
                token,
                {
                    usuario:
                        ADMIN_USER,

                    createdAt:
                        Date.now(),

                    expiresAt
                }
            );

            establecerCookieSesion(
                res,
                token
            );

            console.log(
                "✅ Inicio de sesión correcto:",
                ADMIN_USER
            );

            return res.json({
                ok: true,
                mensaje:
                    "Inicio de sesión correcto."
            });

        } catch (error) {

            console.error(
                "❌ Error iniciando sesión:",
                error
            );

            return res.status(500).json({
                error:
                    "No fue posible iniciar sesión."
            });
        }
    }
);


/*
   GET /api/auth/me

   Comprobar sesión actual.
*/

app.get(
    "/api/auth/me",
    (req, res) => {

        const sesion =
            obtenerSesion(req);

        if (!sesion) {

            return res.status(401).json({
                autenticado: false
            });
        }

        return res.json({
            autenticado: true,
            usuario:
                sesion.usuario,
            expiresAt:
                sesion.expiresAt
        });
    }
);


/*
   POST /api/auth/logout

   Cerrar sesión.
*/

app.post(
    "/api/auth/logout",
    (req, res) => {

        const cookies =
            obtenerCookies(req);

        const token =
            cookies[SESSION_COOKIE];

        if (token) {

            sesiones.delete(
                token
            );
        }

        eliminarCookieSesion(
            res
        );

        console.log(
            "🔒 Sesión cerrada."
        );

        return res.json({
            ok: true,
            mensaje:
                "Sesión cerrada correctamente."
        });
    }
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
    requireAuth,
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
    requireAuth,
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
                    "Error creando categorías"
            });
        }
    }
);


/* =========================================================
   PROVEEDORES
   ========================================================= */

app.get(
    "/api/proveedores",
    requireAuth,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        id,
                        nombre,
                        empresa,
                        telefono,
                        correo,
                        direccion,
                        observaciones,
                        activo,
                        created_at
                    FROM proveedores
                    ORDER BY
                        activo DESC,
                        nombre ASC
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
                    "Error obteniendo proveedores."
            });
        }
    }
);


/* =========================================================
   OBTENER PRODUCTOS - PÚBLICO
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
   TODAS LAS RUTAS ADMINISTRATIVAS DE PRODUCTOS
   ========================================================= */

app.post(
    "/api/productos",
    requireAuth,
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
                Number(precio_compra);

            const precioVentaNumero =
                Number(precio_venta);

            const cantidadNumero =
                Number(cantidad);

            const stockMinimoNumero =
                Number(stock_minimo || 0);

            if (
                !Number.isFinite(precioCompraNumero) ||
                precioCompraNumero < 0
            ) {

                return res.status(400).json({
                    error:
                        "El precio de compra no es válido."
                });
            }

            if (
                !Number.isFinite(precioVentaNumero) ||
                precioVentaNumero < 0
            ) {

                return res.status(400).json({
                    error:
                        "El precio de venta no es válido."
                });
            }

            if (
                !Number.isFinite(cantidadNumero) ||
                cantidadNumero < 0
            ) {

                return res.status(400).json({
                    error:
                        "La cantidad no es válida."
                });
            }

            if (
                !Number.isFinite(stockMinimoNumero) ||
                stockMinimoNumero < 0
            ) {

                return res.status(400).json({
                    error:
                        "El stock mínimo no es válido."
                });
            }

            console.log(
                "☁️ Subiendo imagen a Cloudinary..."
            );

            const imagenUrl =
                await subirImagen(
                    req.file.buffer
                );

            console.log(
                "✅ Imagen subida:",
                imagenUrl
            );

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
                "Error completo:",
                error
            );

            console.error(
                "========================================"
            );

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

            if (
                error.code === "23505"
            ) {

                return res.status(400).json({
                    error:
                        "El código del producto ya existe. Usa un código diferente."
                });
            }

            if (
                error.code === "23503"
            ) {

                return res.status(400).json({
                    error:
                        "La categoría o el proveedor seleccionado no existe."
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
    requireAuth,
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
                Number(precio_compra);

            const precioVentaNumero =
                Number(precio_venta);

            const cantidadNumero =
                Number(cantidad);

            const stockMinimoNumero =
                Number(stock_minimo || 0);

            if (
                !Number.isFinite(precioCompraNumero)
            ) {

                return res.status(400).json({
                    error:
                        "El precio de compra no es válido."
                });
            }

            if (
                !Number.isFinite(precioVentaNumero)
            ) {

                return res.status(400).json({
                    error:
                        "El precio de venta no es válido."
                });
            }

            if (
                !Number.isFinite(cantidadNumero)
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
    requireAuth,
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
                    [id]
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
    requireAuth,
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
                    [id]
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

app.get(
    "/api/compras",
    requireAuth,
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


app.get(
    "/api/compras/:id",
    requireAuth,
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
                    [id]
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
                    [id]
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
    requireAuth,
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

            if (
                !Array.isArray(detalles)
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
                    !Number.isInteger(productoId) ||
                    productoId <= 0
                ) {

                    return res.status(400).json({
                        error:
                            "Uno de los productos seleccionados no es válido."
                    });
                }

                if (
                    !Number.isInteger(cantidad) ||
                    cantidad <= 0
                ) {

                    return res.status(400).json({
                        error:
                            "La cantidad debe ser un número entero mayor que cero."
                    });
                }

                if (
                    !Number.isFinite(precioCompra) ||
                    precioCompra <= 0
                ) {

                    return res.status(400).json({
                        error:
                            "El precio de compra debe ser mayor que cero."
                    });
                }
            }

            await client.query(
                "BEGIN"
            );

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

                total +=
                    cantidad *
                    precioCompra;
            }

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
                        COALESCE($2, NOW()),
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
                        [productoId]
                    );

                if (
                    productoResultado.rows.length === 0
                ) {

                    throw new Error(
                        `El producto con ID ${productoId} no existe.`
                    );
                }

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

            await client.query(
                "COMMIT"
            );

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
   VENTAS
   ========================================================= */

app.get(
    "/api/ventas",
    requireAuth,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT
                        v.id,
                        v.fecha,
                        v.total,
                        v.metodo_pago,
                        v.observaciones,
                        v.created_at,

                        COUNT(dv.id)::INTEGER
                            AS cantidad_productos

                    FROM ventas v

                    LEFT JOIN detalle_ventas dv
                        ON dv.venta_id =
                        v.id

                    GROUP BY
                        v.id,
                        v.fecha,
                        v.total,
                        v.metodo_pago,
                        v.observaciones,
                        v.created_at

                    ORDER BY
                        v.fecha DESC,
                        v.id DESC
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo ventas:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo ventas."
            });
        }
    }
);


app.get(
    "/api/ventas/:id",
    requireAuth,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const ventaResultado =
                await pool.query(
                    `
                    SELECT
                        v.id,
                        v.fecha,
                        v.total,
                        v.metodo_pago,
                        v.observaciones,
                        v.created_at

                    FROM ventas v

                    WHERE v.id = $1
                    `,
                    [id]
                );

            if (
                ventaResultado.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Venta no encontrada."
                });
            }

            const detallesResultado =
                await pool.query(
                    `
                    SELECT
                        dv.id,
                        dv.venta_id,
                        dv.producto_id,

                        p.nombre AS producto,
                        p.codigo,

                        dv.cantidad,
                        dv.precio_venta,
                        dv.costo_unitario,
                        dv.subtotal,
                        dv.ganancia

                    FROM detalle_ventas dv

                    INNER JOIN productos_lunas p
                        ON p.id =
                        dv.producto_id

                    WHERE dv.venta_id = $1

                    ORDER BY
                        dv.id ASC
                    `,
                    [id]
                );

            res.json({
                venta:
                    ventaResultado.rows[0],

                detalles:
                    detallesResultado.rows
            });

        } catch (error) {

            console.error(
                "❌ Error obteniendo detalle de venta:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo detalle de venta."
            });
        }
    }
);


/* =========================================================
   REGISTRAR VENTA
   ========================================================= */

app.post(
    "/api/ventas",
    requireAuth,
    async (req, res) => {

        const client =
            await pool.connect();

        try {

            const {
                metodo_pago,
                observaciones,
                detalles
            } = req.body;

            if (
                !Array.isArray(detalles)
            ) {

                return res.status(400).json({
                    error:
                        "La venta debe contener productos."
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

            const productosMap =
                new Map();

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

                if (
                    !Number.isInteger(productoId) ||
                    productoId <= 0
                ) {

                    return res.status(400).json({
                        error:
                            "Uno de los productos seleccionados no es válido."
                    });
                }

                if (
                    !Number.isInteger(cantidad) ||
                    cantidad <= 0
                ) {

                    return res.status(400).json({
                        error:
                            "La cantidad debe ser un número entero mayor que cero."
                    });
                }

                if (
                    productosMap.has(
                        productoId
                    )
                ) {

                    productosMap.set(
                        productoId,
                        productosMap.get(
                            productoId
                        ) + cantidad
                    );

                } else {

                    productosMap.set(
                        productoId,
                        cantidad
                    );
                }
            }

            const productosVenta =
                Array.from(
                    productosMap.entries()
                ).map(
                    (
                        [
                            producto_id,
                            cantidad
                        ]
                    ) => ({
                        producto_id,
                        cantidad
                    })
                );

            await client.query(
                "BEGIN"
            );

            const ventaResultado =
                await client.query(
                    `
                    INSERT INTO ventas
                    (
                        metodo_pago,
                        observaciones
                    )
                    VALUES
                    (
                        $1,
                        $2
                    )
                    RETURNING
                        id,
                        fecha,
                        total,
                        metodo_pago,
                        observaciones,
                        created_at
                    `,
                    [
                        metodo_pago
                            ? String(
                                metodo_pago
                            ).trim()
                            : "Efectivo",

                        observaciones
                            ? String(
                                observaciones
                            ).trim()
                            : null
                    ]
                );

            const venta =
                ventaResultado.rows[0];

            let totalVenta = 0;

            const detallesGuardados =
                [];

            for (
                const item
                of productosVenta
            ) {

                const productoResultado =
                    await client.query(
                        `
                        SELECT
                            id,
                            nombre,
                            codigo,
                            cantidad,
                            precio_venta,
                            precio_compra,
                            activo

                        FROM productos_lunas

                        WHERE id = $1

                        FOR UPDATE
                        `,
                        [item.producto_id]
                    );

                if (
                    productoResultado.rows.length === 0
                ) {

                    throw new Error(
                        `El producto con ID ${item.producto_id} no existe.`
                    );
                }

                const producto =
                    productoResultado.rows[0];

                if (
                    !producto.activo
                ) {

                    throw new Error(
                        `El producto "${producto.nombre}" está inactivo.`
                    );
                }

                const stockActual =
                    Number(
                        producto.cantidad
                    );

                const cantidadSolicitada =
                    Number(
                        item.cantidad
                    );

                if (
                    cantidadSolicitada >
                    stockActual
                ) {

                    throw new Error(
                        `Stock insuficiente para "${producto.nombre}". Disponible: ${stockActual}. Solicitado: ${cantidadSolicitada}.`
                    );
                }

                const precioVenta =
                    Number(
                        producto.precio_venta
                    );

                const costoUnitario =
                    Number(
                        producto.precio_compra ||
                        0
                    );

                const subtotal =
                    precioVenta *
                    cantidadSolicitada;

                const ganancia =
                    (
                        precioVenta -
                        costoUnitario
                    ) *
                    cantidadSolicitada;

                const detalleResultado =
                    await client.query(
                        `
                        INSERT INTO detalle_ventas
                        (
                            venta_id,
                            producto_id,
                            cantidad,
                            precio_venta,
                            costo_unitario,
                            subtotal,
                            ganancia
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5,
                            $6,
                            $7
                        )
                        RETURNING *
                        `,
                        [
                            venta.id,
                            producto.id,
                            cantidadSolicitada,
                            precioVenta,
                            costoUnitario,
                            subtotal,
                            ganancia
                        ]
                    );

                detallesGuardados.push({

                    ...detalleResultado.rows[0],

                    producto:
                        producto.nombre,

                    codigo:
                        producto.codigo
                });

                const stockResultado =
                    await client.query(
                        `
                        UPDATE productos_lunas

                        SET
                            cantidad =
                                cantidad - $1,

                            updated_at =
                                NOW()

                        WHERE
                            id = $2
                            AND cantidad >= $1

                        RETURNING
                            id,
                            nombre,
                            cantidad
                        `,
                        [
                            cantidadSolicitada,
                            producto.id
                        ]
                    );

                if (
                    stockResultado.rows.length === 0
                ) {

                    throw new Error(
                        `No fue posible actualizar el stock de "${producto.nombre}".`
                    );
                }

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
                        producto.id,
                        "VENTA",
                        cantidadSolicitada,
                        "Salida de inventario por venta",
                        "VENTA",
                        venta.id
                    ]
                );

                totalVenta +=
                    subtotal;
            }

            const ventaActualizada =
                await client.query(
                    `
                    UPDATE ventas

                    SET
                        total = $1

                    WHERE id = $2

                    RETURNING
                        id,
                        fecha,
                        total,
                        metodo_pago,
                        observaciones,
                        created_at
                    `,
                    [
                        totalVenta,
                        venta.id
                    ]
                );

            await client.query(
                "COMMIT"
            );

            console.log("");
            console.log(
                "========================================"
            );
            console.log(
                "💰 VENTA REGISTRADA"
            );
            console.log(
                "========================================"
            );
            console.log(
                "ID:",
                venta.id
            );
            console.log(
                "Total:",
                totalVenta
            );
            console.log(
                "Productos:",
                productosVenta.length
            );
            console.log(
                "========================================"
            );
            console.log("");

            res.status(201).json({
                mensaje:
                    "Venta registrada correctamente.",

                venta: {
                    ...ventaActualizada.rows[0],
                    total:
                        Number(totalVenta)
                },

                detalles:
                    detallesGuardados
            });

        } catch (error) {

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
                "❌ ERROR REGISTRANDO VENTA"
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
                error.message &&
                (
                    error.message.includes(
                        "Stock insuficiente"
                    ) ||
                    error.message.includes(
                        "no existe"
                    ) ||
                    error.message.includes(
                        "está inactivo"
                    ) ||
                    error.message.includes(
                        "No fue posible actualizar"
                    )
                )
            ) {

                return res.status(400).json({
                    error:
                        error.message
                });
            }

            if (
                error.code === "23503"
            ) {

                return res.status(400).json({
                    error:
                        "El producto seleccionado no existe."
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
                    "Error registrando venta."
            });

        } finally {

            client.release();
        }
    }
);


/* =========================================================
   INVENTARIO
   ========================================================= */

app.get(
    "/api/inventario",
    requireAuth,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT
                        p.id,
                        p.nombre,
                        p.codigo,
                        p.descripcion,
                        p.categoria_id,
                        p.proveedor_id,
                        p.precio_compra,
                        p.precio_venta,
                        p.cantidad,
                        p.stock_minimo,
                        p.imagen,
                        p.activo,
                        p.updated_at,

                        CASE
                            WHEN p.cantidad <= 0
                                THEN 'AGOTADO'

                            WHEN p.cantidad <= p.stock_minimo
                                THEN 'BAJO'

                            ELSE 'DISPONIBLE'
                        END AS estado_stock

                    FROM productos_lunas p

                    ORDER BY
                        CASE
                            WHEN p.cantidad <= 0 THEN 1
                            WHEN p.cantidad <= p.stock_minimo THEN 2
                            ELSE 3
                        END,
                        p.nombre ASC
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo inventario:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo inventario."
            });
        }
    }
);


app.get(
    "/api/inventario/movimientos",
    requireAuth,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT
                        mi.id,
                        mi.producto_id,
                        mi.tipo,
                        mi.cantidad,
                        mi.motivo,
                        mi.referencia_tipo,
                        mi.referencia_id,
                        mi.created_at,

                        p.nombre AS producto_nombre,
                        p.codigo AS producto_codigo,
                        p.imagen AS producto_imagen

                    FROM movimientos_inventario mi

                    INNER JOIN productos_lunas p
                        ON p.id =
                        mi.producto_id

                    ORDER BY
                        mi.created_at DESC,
                        mi.id DESC
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo movimientos de inventario:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo movimientos de inventario."
            });
        }
    }
);


/* =========================================================
   PROVEEDORES
   ========================================================= */

app.get(
    "/api/proveedores/:id",
    requireAuth,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const resultado =
                await pool.query(
                    `
                    SELECT
                        id,
                        nombre,
                        empresa,
                        telefono,
                        correo,
                        direccion,
                        observaciones,
                        activo,
                        created_at

                    FROM proveedores

                    WHERE id = $1

                    LIMIT 1
                    `,
                    [id]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Proveedor no encontrado."
                });
            }

            res.json(
                resultado.rows[0]
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo proveedor:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo proveedor."
            });
        }
    }
);


app.post(
    "/api/proveedores",
    requireAuth,
    async (req, res) => {

        try {

            const {
                nombre,
                empresa,
                telefono,
                correo,
                direccion,
                observaciones
            } = req.body;

            const nombreLimpio =
                String(
                    nombre || ""
                ).trim();

            const empresaLimpia =
                String(
                    empresa || ""
                ).trim();

            const telefonoLimpio =
                String(
                    telefono || ""
                ).trim();

            const correoLimpio =
                String(
                    correo || ""
                ).trim();

            const direccionLimpia =
                String(
                    direccion || ""
                ).trim();

            const observacionesLimpias =
                String(
                    observaciones || ""
                ).trim();

            if (!nombreLimpio) {

                return res.status(400).json({
                    error:
                        "El nombre del proveedor es obligatorio."
                });
            }

            const resultado =
                await pool.query(
                    `
                    INSERT INTO proveedores
                    (
                        nombre,
                        empresa,
                        telefono,
                        correo,
                        direccion,
                        observaciones,
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
                        TRUE
                    )

                    RETURNING
                        id,
                        nombre,
                        empresa,
                        telefono,
                        correo,
                        direccion,
                        observaciones,
                        activo,
                        created_at
                    `,
                    [
                        nombreLimpio,
                        empresaLimpia || null,
                        telefonoLimpio || null,
                        correoLimpio || null,
                        direccionLimpia || null,
                        observacionesLimpias || null
                    ]
                );

            res.status(201).json({
                mensaje:
                    "Proveedor creado correctamente.",
                proveedor:
                    resultado.rows[0]
            });

        } catch (error) {

            console.error(
                "❌ Error creando proveedor:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error creando proveedor."
            });
        }
    }
);


app.put(
    "/api/proveedores/:id",
    requireAuth,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const {
                nombre,
                empresa,
                telefono,
                correo,
                direccion,
                observaciones
            } = req.body;

            const nombreLimpio =
                String(
                    nombre || ""
                ).trim();

            const empresaLimpia =
                String(
                    empresa || ""
                ).trim();

            const telefonoLimpio =
                String(
                    telefono || ""
                ).trim();

            const correoLimpio =
                String(
                    correo || ""
                ).trim();

            const direccionLimpia =
                String(
                    direccion || ""
                ).trim();

            const observacionesLimpias =
                String(
                    observaciones || ""
                ).trim();

            if (!nombreLimpio) {

                return res.status(400).json({
                    error:
                        "El nombre del proveedor es obligatorio."
                });
            }

            const resultado =
                await pool.query(
                    `
                    UPDATE proveedores

                    SET
                        nombre = $1,
                        empresa = $2,
                        telefono = $3,
                        correo = $4,
                        direccion = $5,
                        observaciones = $6

                    WHERE id = $7

                    RETURNING
                        id,
                        nombre,
                        empresa,
                        telefono,
                        correo,
                        direccion,
                        observaciones,
                        activo,
                        created_at
                    `,
                    [
                        nombreLimpio,
                        empresaLimpia || null,
                        telefonoLimpio || null,
                        correoLimpio || null,
                        direccionLimpia || null,
                        observacionesLimpias || null,
                        id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Proveedor no encontrado."
                });
            }

            res.json({
                mensaje:
                    "Proveedor actualizado correctamente.",
                proveedor:
                    resultado.rows[0]
            });

        } catch (error) {

            console.error(
                "❌ Error actualizando proveedor:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error actualizando proveedor."
            });
        }
    }
);


app.patch(
    "/api/proveedores/:id/activar",
    requireAuth,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const {
                activo
            } = req.body;

            if (
                typeof activo !== "boolean"
            ) {

                return res.status(400).json({
                    error:
                        "El campo activo debe ser true o false."
                });
            }

            const resultado =
                await pool.query(
                    `
                    UPDATE proveedores

                    SET
                        activo = $1

                    WHERE id = $2

                    RETURNING
                        id,
                        nombre,
                        empresa,
                        telefono,
                        correo,
                        direccion,
                        observaciones,
                        activo,
                        created_at
                    `,
                    [
                        activo,
                        id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        "Proveedor no encontrado."
                });
            }

            res.json({
                mensaje:
                    activo
                        ? "Proveedor activado correctamente."
                        : "Proveedor desactivado correctamente.",
                proveedor:
                    resultado.rows[0]
            });

        } catch (error) {

            console.error(
                "❌ Error cambiando estado del proveedor:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error cambiando estado del proveedor."
            });
        }
    }
);


/* =========================================================
   REPORTES
   ========================================================= */

app.get(
    "/api/reportes/resumen",
    requireAuth,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT

                        (
                            SELECT
                                COALESCE(
                                    SUM(total),
                                    0
                                )
                            FROM ventas
                        ) AS total_ventas,

                        (
                            SELECT
                                COUNT(*)
                            FROM ventas
                        ) AS cantidad_ventas,

                        (
                            SELECT
                                COALESCE(
                                    SUM(ganancia),
                                    0
                                )
                            FROM detalle_ventas
                        ) AS ganancia_total,

                        (
                            SELECT
                                COALESCE(
                                    SUM(total),
                                    0
                                )
                            FROM compras
                        ) AS total_compras,

                        (
                            SELECT
                                COUNT(*)
                            FROM compras
                        ) AS cantidad_compras,

                        (
                            SELECT
                                COALESCE(
                                    SUM(cantidad),
                                    0
                                )
                            FROM detalle_ventas
                        ) AS productos_vendidos,

                        (
                            SELECT
                                COALESCE(
                                    SUM(cantidad),
                                    0
                                )
                            FROM detalle_compras
                        ) AS productos_comprados,

                        (
                            SELECT
                                COUNT(*)
                            FROM productos_lunas
                            WHERE activo = TRUE
                        ) AS productos_activos,

                        (
                            SELECT
                                COALESCE(
                                    SUM(cantidad),
                                    0
                                )
                            FROM productos_lunas
                            WHERE activo = TRUE
                        ) AS unidades_inventario,

                        (
                            SELECT
                                COUNT(*)
                            FROM productos_lunas
                            WHERE
                                activo = TRUE
                                AND cantidad <= stock_minimo
                                AND cantidad > 0
                        ) AS productos_bajos,

                        (
                            SELECT
                                COUNT(*)
                            FROM productos_lunas
                            WHERE
                                activo = TRUE
                                AND cantidad <= 0
                        ) AS productos_agotados,

                        (
                            SELECT
                                COALESCE(
                                    SUM(
                                        cantidad *
                                        precio_compra
                                    ),
                                    0
                                )
                            FROM productos_lunas
                            WHERE activo = TRUE
                        ) AS valor_inventario
                    `
                );

            res.json(
                resultado.rows[0]
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo resumen de reportes:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo el resumen."
            });
        }
    }
);


app.get(
    "/api/reportes/ventas",
    requireAuth,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT

                        v.id,
                        v.fecha,
                        v.total,
                        v.metodo_pago,
                        v.observaciones,

                        COUNT(
                            dv.id
                        ) AS lineas,

                        COALESCE(
                            SUM(
                                dv.cantidad
                            ),
                            0
                        ) AS unidades,

                        COALESCE(
                            SUM(
                                dv.ganancia
                            ),
                            0
                        ) AS ganancia

                    FROM ventas v

                    LEFT JOIN detalle_ventas dv
                        ON dv.venta_id = v.id

                    GROUP BY
                        v.id,
                        v.fecha,
                        v.total,
                        v.metodo_pago,
                        v.observaciones

                    ORDER BY
                        v.fecha DESC,
                        v.id DESC
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo reporte de ventas:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo ventas."
            });
        }
    }
);


app.get(
    "/api/reportes/productos-vendidos",
    requireAuth,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT

                        p.id,
                        p.nombre,
                        p.codigo,

                        COALESCE(
                            SUM(
                                dv.cantidad
                            ),
                            0
                        ) AS unidades_vendidas,

                        COALESCE(
                            SUM(
                                dv.subtotal
                            ),
                            0
                        ) AS total_vendido,

                        COALESCE(
                            SUM(
                                dv.ganancia
                            ),
                            0
                        ) AS ganancia

                    FROM detalle_ventas dv

                    INNER JOIN productos_lunas p
                        ON p.id = dv.producto_id

                    GROUP BY
                        p.id,
                        p.nombre,
                        p.codigo

                    ORDER BY
                        unidades_vendidas DESC,
                        total_vendido DESC
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo productos vendidos:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo productos vendidos."
            });
        }
    }
);


app.get(
    "/api/reportes/compras",
    requireAuth,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT

                        c.id,
                        c.fecha,
                        c.total,
                        c.proveedor_id,
                        c.observaciones,

                        COUNT(
                            dc.id
                        ) AS lineas,

                        COALESCE(
                            SUM(
                                dc.cantidad
                            ),
                            0
                        ) AS unidades

                    FROM compras c

                    LEFT JOIN detalle_compras dc
                        ON dc.compra_id = c.id

                    GROUP BY
                        c.id,
                        c.fecha,
                        c.total,
                        c.proveedor_id,
                        c.observaciones

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
                "❌ Error obteniendo reporte de compras:",
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


app.get(
    "/api/reportes/movimientos",
    requireAuth,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT

                        mi.id,
                        mi.producto_id,
                        mi.tipo,
                        mi.cantidad,
                        mi.motivo,
                        mi.referencia_tipo,
                        mi.referencia_id,
                        mi.fecha,

                        p.nombre AS producto_nombre,
                        p.codigo AS producto_codigo

                    FROM movimientos_inventario mi

                    INNER JOIN productos_lunas p
                        ON p.id = mi.producto_id

                    ORDER BY
                        mi.fecha DESC,
                        mi.id DESC
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(
                "❌ Error obteniendo movimientos:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Error obteniendo movimientos."
            });
        }
    }
);


/* =========================================================
   RUTAS HTML PÚBLICAS
   ========================================================= */

/*
   IMPORTANTE:

   La "/" vuelve a ser el catálogo público.

   Se sirve index.html.
*/

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );
    }
);


/*
   Login público.
*/

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
   RUTAS HTML PROTEGIDAS
   ========================================================= */

/*
   /admin
*/

app.get(
    "/admin",
    requireAuth,
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


/*
   /admin.html
*/

app.get(
    "/admin.html",
    requireAuth,
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


/*
   PRODUCTOS
*/

app.get(
    "/productos.html",
    requireAuth,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "productos.html"
            )
        );
    }
);


/*
   COMPRAS
*/

app.get(
    "/compras.html",
    requireAuth,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "compras.html"
            )
        );
    }
);


/*
   VENTAS
*/

app.get(
    "/ventas.html",
    requireAuth,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "ventas.html"
            )
        );
    }
);


/*
   HISTORIAL
*/

app.get(
    "/historial.html",
    requireAuth,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "historial.html"
            )
        );
    }
);


/*
   INVENTARIO
*/

app.get(
    "/inventario.html",
    requireAuth,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "inventario.html"
            )
        );
    }
);


/*
   PROVEEDORES
*/

app.get(
    "/proveedores.html",
    requireAuth,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "proveedores.html"
            )
        );
    }
);


/*
   REPORTES
*/

app.get(
    "/reportes.html",
    requireAuth,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "reportes.html"
            )
        );
    }
);


/* =========================================================
   ARCHIVOS ESTÁTICOS
   ========================================================= */

/*
   IMPORTANTE:

   Este middleware queda DESPUÉS de las rutas HTML
   protegidas.

   De esta manera /admin.html, /productos.html,
   /compras.html, etc. pasan primero por requireAuth.
*/

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


/* =========================================================
   LIMPIEZA AUTOMÁTICA DE SESIONES
   ========================================================= */

setInterval(
    () => {

        const ahora =
            Date.now();

        for (
            const [
                token,
                sesion
            ]
            of sesiones.entries()
        ) {

            if (
                ahora >
                sesion.expiresAt
            ) {

                sesiones.delete(
                    token
                );
            }
        }

    },
    15 * 60 * 1000
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
            "🔐 Sistema de autenticación activo"
        );

        console.log(
            `👤 ADMIN_USER configurado: ${!!ADMIN_USER}`
        );

        console.log(
            `🔑 ADMIN_PASSWORD configurado: ${!!ADMIN_PASSWORD}`
        );

        console.log(
            `🔒 AUTH_SECRET configurado: ${!!AUTH_SECRET}`
        );

        console.log(
            "========================================"
        );

        console.log("");
    }
);