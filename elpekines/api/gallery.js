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
        const listMethod = imagekit.listFiles ? 'listFiles' : (imagekit.list ? 'list' : null);
        if (!listMethod) throw new Error("Método de listado no encontrado");

        // Obtenemos TODO lo de la carpeta para filtrar por tags
        const files = await imagekit[listMethod]({
            path: '/galeria-perritos',
            limit: 50
        });

        // 1. Filtramos las Imágenes de la Galería (Tag 'active')
        const gallery = files
            .filter(f => f.tags && f.tags.includes('active'))
            .map(f => ({
                id: f.fileId,
                url: f.url,
                title: f.name.split('_')[1]?.split('.')[0] || 'Perrito El Pekinés'
            }));

        // 2. Filtramos los 3 Servicios (Tags 'service_1', 'service_2', 'service_3')
        // Usamos IDs fijos para los tags para que el frontend sepa cuál es cuál
        const services = [1, 2, 3].map(num => {
            const file = files.find(f => f.tags && f.tags.includes(`service_${num}`));
            if (file) {
                return {
                    tag: `service_${num}`,
                    id: file.fileId,
                    url: file.url,
                    title: file.customMetadata?.title || 'Servicio Especial',
                    description: file.customMetadata?.description || 'Descripción personalizada para tu mascota.'
                };
            }
            return null;
        }).filter(Boolean);

        res.status(200).json({ gallery, services });
    } catch (error) {
        console.error('Error Gallery API:', error);
        res.status(500).json({ error: 'Falla al recuperar datos', details: error.message });
    }
};
