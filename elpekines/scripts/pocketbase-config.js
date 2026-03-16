// --- PocketBase Centralized Configuration ---
const pb = new PocketBase('https://circle-trouble.pockethost.io'); // Nueva URL estable en PocketHost

// Configuración de la Colección de Autenticación (Staff)
const AUTH_COLLECTION = 'staff'; 
window.AUTH_COLLECTION = AUTH_COLLECTION;

// Hacerlo global para que los otros scripts lo usen
window.pb = pb;

console.log("✅ PocketBase Inicializado (PocketHost)");
