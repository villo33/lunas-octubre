const express = require("express");
const cors = require("cors");
const db = require("./db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

/* ================== CONFIG GENERAL ================== */

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ================== RUTA BASE (OPCIONAL PRO) ================== */
// Esto ayuda a identificar tu API como "lunas de octubre"
const API = "/api";

/* ================== ASEGURAR CARPETA UPLOADS ================== */

const uploadPath = path.join(__dirname, "public/uploads");

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

/* ================== CONFIGURAR MULTER ================== */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, "lunas-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

/* HACER PÚBLICA LA CARPETA */
app.use("/uploads", express.static(uploadPath));

/* ================== PRODUCTOS ================== */

/* LISTAR */
app.get(`${API}/productos`, (req, res) => {
    db.query("SELECT * FROM productos ORDER BY id DESC", (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error en BD" });
        }
        res.json(data);
    });
});

/* GUARDAR */
app.post(`${API}/productos`, upload.single("imagen"), (req, res) => {
    try {
        const { nombre, precio, cantidad } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "Imagen requerida" });
        }

        const imagen = req.file.filename;

        db.query(
            "INSERT INTO productos (nombre, precio, imagen, cantidad) VALUES (?,?,?,?)",
            [nombre, precio, imagen, cantidad],
            (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: "Error al guardar" });
                }
                res.json({ mensaje: "Producto guardado" });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error servidor" });
    }
});

/* ELIMINAR */
app.delete(`${API}/productos/:id`, (req, res) => {
    const { id } = req.params;

    db.query("SELECT imagen FROM productos WHERE id=?", [id], (err, data) => {
        if (data && data.length > 0) {
            const ruta = path.join(uploadPath, data[0].imagen);
            if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        }

        db.query("DELETE FROM productos WHERE id=?", [id], (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al eliminar" });
            }
            res.json({ mensaje: "Producto eliminado" });
        });
    });
});

/* EDITAR */
app.put(`${API}/productos/:id`, (req, res) => {
    const { id } = req.params;
    const { nombre, precio, cantidad } = req.body;

    db.query(
        "UPDATE productos SET nombre=?, precio=?, cantidad=? WHERE id=?",
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

/* ================== RUTA DE PRUEBA ================== */

app.get("/", (req, res) => {
    res.send("🌙 API Lunas de Octubre funcionando");
});

/* ================== SERVIDOR ================== */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log("🌙 Lunas de Octubre corriendo en puerto " + PORT);
});