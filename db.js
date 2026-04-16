const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

/* CONEXIÓN */
db.connect(err => {
    if(err){
        console.log("❌ Error conexión BD:", err);
    }else{
        console.log("🌙 Base de datos Lunas de Octubre conectada");
    }
});

/* EVITAR CAÍDAS (PRO) */
db.on("error", err => {
    console.log("⚠️ Error BD:", err);

    if(err.code === "PROTOCOL_CONNECTION_LOST"){
        console.log("🔄 Reconectando base de datos...");
        db.connect();
    }else{
        throw err;
    }
});

module.exports = db;