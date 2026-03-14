// --- REPARACIÓN BOUTIQUE: API ADMIN (DynaServices Edition) ---
const ImageKit = require('imagekit');

// Inicialización segura de ImageKit
const IK_CONFIG = {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
};

if (IK_CONFIG.publicKey && IK_CONFIG.privateKey && IK_CONFIG.urlEndpoint) {
    try {
        imagekit = new ImageKit(IK_CONFIG);
        console.log("✅ ImageKit backend inicializado correctamente");
    } catch (e) {
        console.error("❌ Error inicializando ImageKit SDK:", e);
    }
} else {
    console.error("❌ Error: Faltan variables de entorno de ImageKit (Public, Private o Endpoint)");
}

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const params = { ...req.query, ...req.body };
        const { action, password, fileId, tags, customMetadata } = params;

        // Validaciones de Seguridad
        if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === "") {
            return res.status(500).json({ error: 'Configuración de seguridad incompleta en Vercel.' });
        }

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        if (!imagekit) {
            return res.status(500).json({ error: 'Falla en conexión con ImageKit.' });
        }

        // --- SISTEMA DE ACCIONES ---
        switch (action) {
            case 'auth':
                // Generar token para subida desde cliente (Permitimos metadata en la subida)
                return res.status(200).json(imagekit.getAuthenticationParameters());

            case 'list':
                // Listado unificado: galería normal + servicios
                const listMethod = imagekit.listFiles ? 'listFiles' : (imagekit.list ? 'list' : null);
                if (!listMethod) throw new Error("Método listFiles no encontrado");

                const allFiles = await imagekit[listMethod]({
                    path: '/galeria-perritos',
                    limit: 100
                });
                return res.status(200).json(allFiles);

            case 'update':
                // ACTUALIZAR METADATOS (Título y descripción del servicio)
                await imagekit.updateFileDetails(fileId, {
                    tags: tags,
                    customMetadata: customMetadata // Aquí guardamos title y description
                });
                return res.status(200).json({ success: true });

            case 'delete':
                await imagekit.deleteFile(fileId);
                return res.status(200).json({ success: true });

            default:
                return res.status(400).json({ error: 'Acción no reconocida' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Falla en el servidor', 
            details: error.message 
        });
    }
};
