const { Pool } = require("pg");

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

/* PROBAR CONEXIÓN */
db.connect()
    .then(client => {
        console.log("🌙 Conectado a Supabase (PostgreSQL)");
        client.release(); // importante liberar conexión
    })
    .catch((err) => {
        console.log("❌ Error conexión BD:", err);
    });

module.exports = db;