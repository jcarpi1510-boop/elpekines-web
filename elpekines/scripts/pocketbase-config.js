// --- PocketBase Centralized Configuration ---
const pb = new PocketBase('https://jesus151083-el-pekines-db.hf.space'); // URL de tu base de datos en Hugging Face

// Hacerlo global para que los otros scripts lo usen
window.pb = pb;

console.log("✅ PocketBase Inicializado localmente");
