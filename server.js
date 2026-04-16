require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const app = express();

/* ================== CONFIG GENERAL ================== */

app.use(cors());
app.use(express.json());

const API = "/api";

/* ================== CLOUDINARY ================== */

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

/* ================== MULTER (MEMORIA) ================== */

const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================== PRODUCTOS ================== */

/* LISTAR */
app.get(`${API}/productos`, (req, res) => {
    db.query("SELECT * FROM productos_lunas ORDER BY id DESC", (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error en BD" });
        }
        res.json(data);
    });
});

/* GUARDAR (SUBE A CLOUDINARY) */
app.post(`${API}/productos`, upload.single("imagen"), async (req, res) => {
    try {
        const { nombre, precio, cantidad } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "Imagen requerida" });
        }

        /* SUBIR A CLOUDINARY */
        const resultado = await cloudinary.uploader.upload_stream(
            { folder: "lunas_octubre" },
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ error: "Error subiendo imagen" });
                }

                const imagen = result.secure_url;

                db.query(
                    "INSERT INTO productos_lunas (nombre, precio, imagen, cantidad) VALUES (?,?,?,?)",
                    [nombre, precio, imagen, cantidad],
                    (err) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).json({ error: "Error al guardar" });
                        }
                        res.json({ mensaje: "Producto guardado" });
                    }
                );
            }
        );

        resultado.end(req.file.buffer);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error servidor" });
    }
});

/* ELIMINAR */
app.delete(`${API}/productos/:id`, (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM productos_lunas WHERE id=?", [id], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al eliminar" });
        }
        res.json({ mensaje: "Producto eliminado" });
    });
});

/* EDITAR */
app.put(`${API}/productos/:id`, (req, res) => {
    const { id } = req.params;
    const { nombre, precio, cantidad } = req.body;

    db.query(
        "UPDATE productos_lunas SET nombre=?, precio=?, cantidad=? WHERE id=?",
        [nombre, precio, cantidad, id],
        (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al actualizar" });
            }
            res.json({ mensaje: "Producto actualizado" });
        }
    );
});

/* ================== TEST ================== */

app.get("/", (req, res) => {
    res.send("🌙 API Lunas de Octubre con Cloudinary funcionando");
});

/* ================== SERVIDOR ================== */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log("🌙 Servidor Lunas de Octubre en puerto " + PORT);
});