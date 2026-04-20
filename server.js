require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");
const multer = require("multer");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const app = express();

/* ================== CONFIG GENERAL ================== */

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API = "/api";

/* ================== CLOUDINARY ================== */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/* ================== MULTER ================== */

const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================== SUBIR IMAGEN ================== */

function subirImagen(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "lunas_octubre",
                transformation: [
                    { width: 800, crop: "limit" },
                    { quality: "auto" }
                ]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
}

/* ================== PRODUCTOS ================== */

/* LISTAR */
app.get(`${API}/productos`, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM productos_lunas ORDER BY id DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.log("❌ Error BD:", err);
        res.status(500).json({ error: "Error en BD" });
    }
});

/* GUARDAR */
app.post(`${API}/productos`, upload.single("imagen"), async (req, res) => {
    try {
        const { nombre, precio, cantidad } = req.body;

        if (!nombre || !precio || !cantidad || !req.file) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const resultImg = await subirImagen(req.file.buffer);
        const imagen = resultImg.secure_url;

        const result = await db.query(
            `INSERT INTO productos_lunas (nombre, precio, imagen, cantidad)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [nombre, precio, imagen, cantidad]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.log("❌ Error servidor:", error);
        res.status(500).json({ error: "Error servidor" });
    }
});

/* ELIMINAR */
app.delete(`${API}/productos/:id`, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            "DELETE FROM productos_lunas WHERE id = $1",
            [id]
        );

        res.json({ mensaje: "Producto eliminado" });

    } catch (err) {
        console.log("❌ Error delete:", err);
        res.status(500).json({ error: "Error al eliminar" });
    }
});

/* EDITAR */
app.put(`${API}/productos/:id`, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, cantidad } = req.body;

        if (!nombre || !precio || !cantidad) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        await db.query(
            `UPDATE productos_lunas 
             SET nombre = $1, precio = $2, cantidad = $3 
             WHERE id = $4`,
            [nombre, precio, cantidad, id]
        );

        res.json({ mensaje: "Producto actualizado" });

    } catch (err) {
        console.log("❌ Error update:", err);
        res.status(500).json({ error: "Error al actualizar" });
    }
});

/* ================== RUTAS HTML ================== */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* ================== SERVIDOR ================== */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log("🌙 Servidor Lunas de Octubre en puerto " + PORT);
});