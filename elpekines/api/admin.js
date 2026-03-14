// --- REPARACIÓN BOUTIQUE: API ADMIN ---
const ImageKit = require('imagekit'); // Intentamos el paquete estándar

let imagekit;
try {
    imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    });
    
    // Log de diagnóstico interno (solo se ve en logs de Vercel)
    console.log("ImageKit Init OK. Methods:", Object.keys(imagekit));
} catch (e) {
    console.error("Critical: Failed to initialize ImageKit", e);
}

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const params = { ...req.query, ...req.body };
        const { action, password, fileId, tags } = params;

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
                // Generar token para subida desde cliente
                return res.status(200).json(imagekit.getAuthenticationParameters());

            case 'list':
                // Listar imágenes (Soporte para diferentes nombres de método por versión)
                const listMethod = imagekit.listFiles ? 'listFiles' : (imagekit.list ? 'list' : null);
                
                if (!listMethod) throw new Error("Método listFiles no encontrado en SDK");

                const files = await imagekit[listMethod]({
                    path: '/galeria-perritos',
                    limit: 50
                });
                return res.status(200).json(files);

            case 'toggle':
                await imagekit.updateFileDetails(fileId, { tags: tags });
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
