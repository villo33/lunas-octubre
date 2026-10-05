require("dotenv").config();

const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");

console.log("========================================");
console.log("☁️ PRUEBA DE SUBIDA A CLOUDINARY");
console.log("========================================");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key cargada:", !!process.env.CLOUDINARY_API_KEY);
console.log("API Secret cargado:", !!process.env.CLOUDINARY_API_SECRET);

console.log("");
console.log("📤 Intentando subir una imagen...");
console.log("========================================");

// Creamos una imagen mínima de prueba en memoria.
// No necesitamos tener ninguna imagen guardada en el computador.
const imagenPrueba = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
);

const stream = cloudinary.uploader.upload_stream(
    {
        folder: "lunas_octubre/prueba",
        public_id: "prueba_conexion",
        overwrite: true,
        resource_type: "image"
    },
    (error, resultado) => {

        if (error) {

            console.error("");
            console.error("❌ CLOUDINARY RECHAZÓ LA SUBIDA");
            console.error("========================================");
            console.error("Mensaje:", error.message);
            console.error("HTTP Code:", error.http_code);
            console.error("Nombre:", error.name);
            console.error("Detalle:", error);
            console.error("========================================");

            return;
        }

        console.log("");
        console.log("✅ ¡IMAGEN SUBIDA CORRECTAMENTE!");
        console.log("========================================");
        console.log("Public ID:", resultado.public_id);
        console.log("URL segura:", resultado.secure_url);
        console.log("Formato:", resultado.format);
        console.log("Tamaño:", resultado.bytes);
        console.log("========================================");
    }
);

stream.end(imagenPrueba);