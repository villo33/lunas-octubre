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
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
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
app.get(`${API}/productos`, (req, res) => {
    db.query("SELECT * FROM productos_lunas ORDER BY id DESC", (err, data) => {
        if (err) {
            console.log("❌ Error BD:", err);
            return res.status(500).json({ error: "Error en BD" });
        }
        res.json(data);
    });
});

/* GUARDAR */
app.post(`${API}/productos`, upload.single("imagen"), async (req, res) => {
    try {
        const { nombre, precio, cantidad } = req.body;

        if (!nombre || !precio || !cantidad || !req.file) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const result = await subirImagen(req.file.buffer);

        const imagen = result.secure_url;

        db.query(
            "INSERT INTO productos_lunas (nombre, precio, imagen, cantidad) VALUES (?,?,?,?)",
            [nombre, precio, imagen, cantidad],
            (err, response) => {
                if (err) {
                    console.log("❌ Error insert:", err);
                    return res.status(500).json({ error: "Error al guardar" });
                }

                // 🔥 DEVOLVER PRODUCTO NUEVO
                res.json({
                    id: response.insertId,
                    nombre,
                    precio,
                    cantidad,
                    imagen
                });
            }
        );

    } catch (error) {
        console.log("❌ Error servidor:", error);
        res.status(500).json({ error: "Error servidor" });
    }
});

/* ELIMINAR */
app.delete(`${API}/productos/:id`, (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM productos_lunas WHERE id=?", [id], (err) => {
        if (err) {
            console.log("❌ Error delete:", err);
            return res.status(500).json({ error: "Error al eliminar" });
        }
        res.json({ mensaje: "Producto eliminado" });
    });
});

/* EDITAR */
app.put(`${API}/productos/:id`, (req, res) => {
    const { id } = req.params;
    const { nombre, precio, cantidad } = req.body;

    if (!nombre || !precio || !cantidad) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    db.query(
        "UPDATE productos_lunas SET nombre=?, precio=?, cantidad=? WHERE id=?",
        [nombre, precio, cantidad, id],
        (err) => {
            if (err) {
                console.log("❌ Error update:", err);
                return res.status(500).json({ error: "Error al actualizar" });
            }
            res.json({ mensaje: "Producto actualizado" });
        }
    );
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