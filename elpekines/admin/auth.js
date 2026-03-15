// --- Appwrite Auth Utilities ---
console.log("🔐 [AUTH] Utilidades de autenticación listas.");

/**
 * Verifica si hay una sesión activa en Appwrite.
 * Devuelve el objeto usuario o null si no hay sesión o hay error de red.
 */
async function getActiveSession() {
    if (typeof APPWRITE_CONFIG === 'undefined' || typeof account === 'undefined') {
        console.error("❌ [AUTH] Configuración no encontrada");
        return null;
    }

    try {
        const user = await account.get();
        return user;
    } catch (error) {
        // Solo logueamos si no es un 401 (que es el error esperado si no hay sesión)
        if (error.code !== 401) {
            console.warn("⚠️ [AUTH] Error de red al verificar sesión:", error.message);
        }
        return null;
    }
}
