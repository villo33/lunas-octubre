require("dotenv").config();

const { v2: cloudinary } = require("cloudinary");

console.log("========================================");
console.log("☁️ PRUEBA DE CLOUDINARY");
console.log("========================================");

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log(
    "API Key cargada:",
    !!process.env.CLOUDINARY_API_KEY
);
console.log(
    "API Secret cargado:",
    !!process.env.CLOUDINARY_API_SECRET
);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

cloudinary.api.ping(
    (error, result) => {

        if (error) {

            console.error("");
            console.error("❌ CLOUDINARY RECHAZÓ LA CONEXIÓN");
            console.error("========================================");
            console.error("Mensaje:", error.message);
            console.error("HTTP Code:", error.http_code);
            console.error("Nombre:", error.name);
            console.error("Error completo:", error);
            console.error("========================================");

            return;
        }

        console.log("");
        console.log("✅ CLOUDINARY RESPONDE CORRECTAMENTE");
        console.log("========================================");
        console.log(result);
        console.log("========================================");
    }
);