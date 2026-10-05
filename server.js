require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");
const multer = require("multer");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const app = express();

/* =========================================================
   CONFIGURACIÓN GENERAL
   ========================================================= */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const API = "/api";


/* =========================================================
   CLOUDINARY
   ========================================================= */

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


/* =========================================================
   MULTER
   ========================================================= */

const storage = multer.memoryStorage();

const upload = multer({
    storage
});


/* =========================================================
   SUBIR IMAGEN A CLOUDINARY
   ========================================================= */

function subirImagen(buffer) {

    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(

            {
                folder: "lunas_octubre",

                transformation: [
                    {
                        width: 800,
                        crop: "limit"
                    },
                    {
                        quality: "auto"
                    }
                ]
            },

            (error, result) => {

                if (error) {

                    reject(error);

                } else {

                    resolve(result);

                }

            }

        );

        stream.end(buffer);

    });

}


/* =========================================================
   API — CATEGORÍAS
   ========================================================= */


/* LISTAR CATEGORÍAS */

app.get(`${API}/categorias`, async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                id,
                nombre,
                descripcion,
                activo
            FROM categorias
            WHERE activo = TRUE
            ORDER BY nombre ASC
        `);

        res.json(result.rows);

    } catch (error) {

        console.log("❌ Error categorías:", error);

        res.status(500).json({
            error: "Error al cargar categorías"
        });

    }

});


/* CREAR CATEGORÍA */

app.post(`${API}/categorias`, async (req, res) => {

    try {

        const {
            nombre,
            descripcion
        } = req.body;

        if (!nombre || !nombre.trim()) {

            return res.status(400).json({
                error: "El nombre de la categoría es obligatorio"
            });

        }

        const result = await db.query(
            `
            INSERT INTO categorias
            (
                nombre,
                descripcion
            )
            VALUES ($1, $2)
            RETURNING *
            `,
            [
                nombre.trim(),
                descripcion || null
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {

        console.log("❌ Error creando categoría:", error);

        if (error.code === "23505") {

            return res.status(400).json({
                error: "La categoría ya existe"
            });

        }

        res.status(500).json({
            error: "Error al crear categoría"
        });

    }

});


/* =========================================================
   API — PROVEEDORES
   ========================================================= */


/* LISTAR PROVEEDORES */

app.get(`${API}/proveedores`, async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                id,
                nombre,
                empresa,
                telefono,
                correo,
                direccion,
                observaciones,
                activo
            FROM proveedores
            WHERE activo = TRUE
            ORDER BY nombre ASC
        `);

        res.json(result.rows);

    } catch (error) {

        console.log("❌ Error proveedores:", error);

        res.status(500).json({
            error: "Error al cargar proveedores"
        });

    }

});


/* =========================================================
   API — PRODUCTOS
   ========================================================= */


/* LISTAR PRODUCTOS */

app.get(`${API}/productos`, async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                p.id,
                p.nombre,
                p.codigo,
                p.descripcion,
                p.precio,
                p.precio_compra,
                p.precio_venta,
                p.cantidad,
                p.stock_minimo,
                p.imagen,
                p.activo,
                p.created_at,
                p.updated_at,

                c.id AS categoria_id,
                c.nombre AS categoria_nombre,

                pr.id AS proveedor_id,
                pr.nombre AS proveedor_nombre

            FROM productos_lunas p

            LEFT JOIN categorias c
                ON p.categoria_id = c.id

            LEFT JOIN proveedores pr
                ON p.proveedor_id = pr.id

            ORDER BY p.id DESC
        `);

        const productos = result.rows.map(producto => {

            const precioCompra = Number(producto.precio_compra || 0);

            const precioVenta = Number(
                producto.precio_venta ??
                producto.precio ??
                0
            );

            const ganancia = precioVenta - precioCompra;

            const margen = precioVenta > 0
                ? (ganancia / precioVenta) * 100
                : 0;

            return {

                ...producto,

                precio_compra: precioCompra,

                precio_venta: precioVenta,

                ganancia: Number(ganancia.toFixed(2)),

                margen: Number(margen.toFixed(2))

            };

        });

        res.json(productos);

    } catch (error) {

        console.log("❌ Error productos:", error);

        res.status(500).json({
            error: "Error al cargar productos"
        });

    }

});


/* =========================================================
   CREAR PRODUCTO
   ========================================================= */

app.post(
    `${API}/productos`,
    upload.single("imagen"),
    async (req, res) => {

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


            /* VALIDACIONES */

            if (!nombre || !codigo) {

                return res.status(400).json({
                    error: "Nombre y código son obligatorios"
                });

            }


            if (
                precio_compra === undefined ||
                precio_venta === undefined
            ) {

                return res.status(400).json({
                    error: "Los precios son obligatorios"
                });

            }


            if (cantidad === undefined) {

                return res.status(400).json({
                    error: "La cantidad es obligatoria"
                });

            }


            if (!req.file) {

                return res.status(400).json({
                    error: "Selecciona una imagen"
                });

            }


            /* SUBIR IMAGEN */

            const resultadoImagen =
                await subirImagen(req.file.buffer);

            const imagen =
                resultadoImagen.secure_url;


            /* INSERTAR PRODUCTO */

            const result = await db.query(
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
                    descripcion || null,
                    categoria_id || null,
                    proveedor_id || null,
                    Number(precio_venta),
                    Number(precio_compra),
                    Number(precio_venta),
                    Number(cantidad),
                    Number(stock_minimo || 0),
                    imagen
                ]
            );


            res.status(201).json({

                mensaje: "Producto creado correctamente",

                producto: result.rows[0]

            });


        } catch (error) {

            console.log("❌ Error creando producto:", error);


            if (error.code === "23505") {

                return res.status(400).json({

                    error: "El código del producto ya existe"

                });

            }


            res.status(500).json({

                error: "Error al crear producto"

            });

        }

    }
);


/* =========================================================
   EDITAR PRODUCTO
   ========================================================= */

app.put(`${API}/productos/:id`, async (req, res) => {

    try {

        const { id } = req.params;

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


        if (!nombre || !codigo) {

            return res.status(400).json({

                error: "Nombre y código son obligatorios"

            });

        }


        const result = await db.query(
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
                activo = $11

            WHERE id = $12

            RETURNING *
            `,
            [
                nombre.trim(),
                codigo.trim(),
                descripcion || null,
                categoria_id || null,
                proveedor_id || null,
                Number(precio_venta),
                Number(precio_compra),
                Number(precio_venta),
                Number(cantidad),
                Number(stock_minimo || 0),
                activo !== false,
                id
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({

                error: "Producto no encontrado"

            });

        }


        res.json({

            mensaje: "Producto actualizado correctamente",

            producto: result.rows[0]

        });


    } catch (error) {

        console.log("❌ Error actualizando producto:", error);


        if (error.code === "23505") {

            return res.status(400).json({

                error: "El código del producto ya existe"

            });

        }


        res.status(500).json({

            error: "Error al actualizar producto"

        });

    }

});


/* =========================================================
   ELIMINAR PRODUCTO
   ========================================================= */

app.delete(`${API}/productos/:id`, async (req, res) => {

    try {

        const { id } = req.params;


        /*
           No eliminamos físicamente el producto.

           Lo desactivamos para conservar el historial
           de compras y ventas.
        */

        const result = await db.query(
            `
            UPDATE productos_lunas

            SET activo = FALSE

            WHERE id = $1

            RETURNING id
            `,
            [id]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({

                error: "Producto no encontrado"

            });

        }


        res.json({

            mensaje: "Producto desactivado correctamente"

        });


    } catch (error) {

        console.log("❌ Error desactivando producto:", error);

        res.status(500).json({

            error: "Error al desactivar producto"

        });

    }

});


/* =========================================================
   ACTIVAR PRODUCTO
   ========================================================= */

app.patch(`${API}/productos/:id/activar`, async (req, res) => {

    try {

        const { id } = req.params;


        const result = await db.query(
            `
            UPDATE productos_lunas

            SET activo = TRUE

            WHERE id = $1

            RETURNING *
            `,
            [id]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({

                error: "Producto no encontrado"

            });

        }


        res.json({

            mensaje: "Producto activado correctamente",

            producto: result.rows[0]

        });


    } catch (error) {

        console.log("❌ Error activando producto:", error);

        res.status(500).json({

            error: "Error al activar producto"

        });

    }

});


/* =========================================================
   RUTAS HTML
   ========================================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );

});


app.get("/admin.html", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "admin.html")
    );

});


app.get("/login.html", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "login.html")
    );

});


/* =========================================================
   MANEJO GENERAL DE ERRORES
   ========================================================= */

app.use((err, req, res, next) => {

    console.log("❌ Error general:", err);

    res.status(500).json({

        error: "Error interno del servidor"

    });

});


/* =========================================================
   SERVIDOR
   ========================================================= */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {

    console.log(
        "🌙 Servidor Lunas de Octubre en puerto " + PORT
    );

});