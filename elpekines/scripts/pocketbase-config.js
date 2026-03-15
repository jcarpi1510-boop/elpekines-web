// --- PocketBase Centralized Configuration ---
const pb = new PocketBase('http://127.0.0.1:8090'); // URL por defecto para PocketBase local

// Hacerlo global para que los otros scripts lo usen
window.pb = pb;

console.log("✅ PocketBase Inicializado localmente");
