// --- REPARACIÓN BOUTIQUE: API ADMIN (DynaServices Edition) ---
const ImageKit = require('imagekit');

// Inicialización segura de ImageKit
let imagekit;
const IK_CONFIG = {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
};

const mask = (s) => s ? `${s.substring(0, 4)}...${s.substring(s.length - 4)}` : 'MISSING';

if (IK_CONFIG.publicKey && IK_CONFIG.privateKey && IK_CONFIG.urlEndpoint) {
    try {
        imagekit = new ImageKit(IK_CONFIG);
        console.log("✅ ImageKit backend inicializado");
        console.log(`🔗 Public Key: ${mask(IK_CONFIG.publicKey)}`);
        console.log(`🔗 Private Key: ${mask(IK_CONFIG.privateKey)}`);
        console.log(`🔗 Endpoint: ${IK_CONFIG.urlEndpoint}`);
    } catch (e) {
        console.error("❌ Error inicializando ImageKit SDK:", e);
    }
} else {
    console.error("❌ Error: Faltan variables de entorno de ImageKit");
    console.log(`Config actual: PUB=${mask(IK_CONFIG.publicKey)}, PRIV=${mask(IK_CONFIG.privateKey)}, END=${IK_CONFIG.urlEndpoint || 'MISSING'}`);
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
        
        console.log(`📡 [API] Acción recibida: ${action}`);

        // Validaciones de Seguridad
        if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === "") {
            console.error("❌ ERROR: ADMIN_PASSWORD no configurada en Vercel");
            return res.status(500).json({ error: 'Configuración de seguridad incompleta en Vercel.' });
        }

        if (password !== process.env.ADMIN_PASSWORD) {
            console.warn("⚠️ Intento de acceso con contraseña incorrecta");
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        if (!imagekit) {
            console.error("❌ ERROR: SDK de ImageKit no inicializado");
            return res.status(500).json({ error: 'Falla en conexión con ImageKit.' });
        }

        // --- SISTEMA DE ACCIONES ---
        console.log(`⚙️ [API] Procesando acción: ${action}...`);
        switch (action) {
            case 'auth':
                const authParams = imagekit.getAuthenticationParameters();
                console.log("✅ [API] Auth params generados");
                return res.status(200).json(authParams);

            case 'list':
                const listMethod = imagekit.listFiles ? 'listFiles' : (imagekit.list ? 'list' : null);
                if (!listMethod) throw new Error("Método listFiles no detectado en el SDK");

                console.log(`📂 [API] Listando archivos desde: /galeria-perritos usando ${listMethod}`);
                const allFiles = await imagekit[listMethod]({
                    path: '/galeria-perritos',
                    limit: 100
                });
                console.log(`✅ [API] ${allFiles.length} archivos recuperados`);
                return res.status(200).json(allFiles);

            case 'update':
                console.log(`📝 [API] Actualizando archivo: ${fileId}`);
                await imagekit.updateFileDetails(fileId, {
                    tags: tags,
                    customMetadata: customMetadata
                });
                return res.status(200).json({ success: true });

            case 'delete':
                console.log(`🗑️ [API] Eliminando archivo: ${fileId}`);
                await imagekit.deleteFile(fileId);
                return res.status(200).json({ success: true });

            case 'test':
                const testFiles = await imagekit.listFiles({ limit: 1 });
                return res.status(200).json({ 
                    success: true, 
                    message: "Conexión con ImageKit establecida", 
                    count: testFiles.length 
                });

            default:
                console.warn(`❓ [API] Acción desconocida: ${action}`);
                return res.status(400).json({ error: 'Acción no reconocida' });
        }
    } catch (error) {
        console.error('❌ [API CRITICAL ERROR]:', error);
        return res.status(500).json({ 
            error: 'Falla en el servidor', 
            details: error.message,
            stack: error.stack // Solo para esta fase de depuración profunda
        });
    }
};
