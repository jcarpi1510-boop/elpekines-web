const ImageKit = require('imagekit');

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { action, password, fileId, tags } = req.body || req.query;

    // Validación de Contraseña Maestra
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        switch (action) {
            case 'auth':
                // Generar firma para subida segura
                return res.status(200).json(imagekit.getAuthenticationParameters());

            case 'list':
                // Listar todos los archivos de la carpeta galeria
                const files = await imagekit.listFiles({
                    path: '/galeria-perritos',
                    limit: 50
                });
                return res.status(200).json(files);

            case 'toggle':
                // Cambiar etiqueta 'active'/'inactive'
                await imagekit.updateFileDetails(fileId, {
                    tags: tags // tags es un array enviado desde el cliente
                });
                return res.status(200).json({ success: true });

            case 'delete':
                // Borrar archivo de ImageKit
                await imagekit.deleteFile(fileId);
                return res.status(200).json({ success: true });

            default:
                return res.status(400).json({ error: 'Acción no válida' });
        }
    } catch (error) {
        console.error('Error Admin API:', error);
        return res.status(500).json({ error: error.message });
    }
};
