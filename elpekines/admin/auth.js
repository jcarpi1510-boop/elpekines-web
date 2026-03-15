// --- Appwrite Mobile-Safe Auth Script ---
console.log("🔐 [AUTH] Iniciando verificador de sesión...");

async function validateSessionOnStartup() {
    if (typeof APPWRITE_CONFIG === 'undefined' || typeof account === 'undefined') {
        console.error("❌ [AUTH] Configuración no encontrada");
        return;
    }

    try {
        const user = await account.get();
        console.log("✅ [AUTH] Sesión válida para:", user.email);
        return user;
    } catch (error) {
        console.log("ℹ️ [AUTH] Sin sesión activa o requiere login");
        return null;
    }
}

// Exponer globalmente si es necesario
window.authReady = validateSessionOnStartup();
