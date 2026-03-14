const ImageKit = require('@imagekit/nodejs');

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        // Obtenemos solo los archivos que tienen el tag 'active'
        const files = await imagekit.listFiles({
            path: '/galeria-perritos',
            tags: ['active'],
            limit: 20
        });

        // Retornamos una versión simplificada para el frontend
        const gallery = files.map(file => ({
            id: file.fileId,
            url: file.url,
            title: file.customMetadata?.title || 'Perrito bañado'
        }));

        res.status(200).json(gallery);
    } catch (error) {
        console.error('Error Gallery API:', error);
        res.status(500).json({ error: 'No se pudo cargar la galería' });
    }
};
