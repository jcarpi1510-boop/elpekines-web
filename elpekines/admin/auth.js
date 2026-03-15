// --- PocketBase Auth Utilities ---
console.log("🔐 [AUTH] Utilidades de autenticación listas.");

/**
 * Verifica si hay una sesión activa en PocketBase.
 * Devuelve el objeto usuario o null si no hay sesión.
 */
async function getActiveSession() {
    if (typeof pb === 'undefined') {
        console.error("❌ [AUTH] PocketBase no encontrado");
        return null;
    }

    if (pb.authStore.isValid) {
        return pb.authStore.model;
    }
    
    return null;
}
