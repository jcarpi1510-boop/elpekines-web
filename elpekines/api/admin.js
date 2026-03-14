const ImageKit = require('@imagekit/nodejs');

// Initialize only if keys exist to avoid startup crash
const imagekit = (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY) 
    ? new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    })
    : null;

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Robust parsing for Vercel
    const query = req.query || {};
    const body = req.body || {};
    const action = query.action || body.action;
    const password = query.password || body.password;
    const fileId = query.fileId || body.fileId;
    const tags = query.tags || body.tags;

    // DIAGNOSTIC CHECK: Environment Variables
    if (!process.env.ADMIN_PASSWORD) {
        return res.status(500).json({ 
            error: 'ERROR DE CONFIGURACIÓN: La variable ADMIN_PASSWORD no está definida en Vercel.',
            hint: 'Asegúrate de agregar ADMIN_PASSWORD en Vercel > Settings > Environment Variables y RE-DESPLEGAR.'
        });
    }

    if (!imagekit) {
        return res.status(500).json({ 
            error: 'ERROR DE CONFIGURACIÓN: Faltan credenciales de ImageKit (Public/Private Key).',
            hint: 'Verifica IMAGEKIT_PUBLIC_KEY e IMAGEKIT_PRIVATE_KEY en las variables de entorno de Vercel.'
        });
    }

    // Password Validation
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    try {
        switch (action) {
            case 'auth':
                return res.status(200).json(imagekit.getAuthenticationParameters());

            case 'list':
                const files = await imagekit.listFiles({
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
                return res.status(400).json({ error: 'Acción no válida' });
        }
    } catch (error) {
        console.error('Error Admin API:', error);
        return res.status(500).json({ error: 'Error interno de ImageKit: ' + error.message });
    }
};
