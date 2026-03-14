const ImageKit = require('imagekit');

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        // DETECCIÓN INTELIGENTE DE MÉTODO (Fix Error 500)
        const listMethod = imagekit.listFiles ? 'listFiles' : (imagekit.list ? 'list' : null);
        
        if (!listMethod) throw new Error("Método de listado no encontrado en SDK");

        const files = await imagekit[listMethod]({
            path: '/galeria-perritos',
            tags: ['active'],
            limit: 24
        });

        // Retornamos versión premium para el frontend
        const gallery = files.map(file => ({
            id: file.fileId,
            url: file.url,
            title: file.name.split('_')[1]?.split('.')[0] || 'Perrito El Pekinés'
        }));

        res.status(200).json(gallery);
    } catch (error) {
        console.error('Error Gallery API:', error);
        res.status(500).json({ error: 'Falla al recuperar galería', details: error.message });
    }
};
