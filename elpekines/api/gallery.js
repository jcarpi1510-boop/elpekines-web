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
        if (!listMethod) throw new Error("ImageKit SDK: Método de listado no disponible.");

        // Intentamos listar de la carpeta específica
        let files = await imagekit[listMethod]({
            path: '/galeria-perritos',
            limit: 100
        });

        // Si la carpeta está vacía, intentamos listar todo (root) por si las imágenes están fuera
        if (!files || files.length === 0) {
            console.log("Aviso: Carpeta /galeria-perritos vacía. Buscando en raíz...");
            files = await imagekit[listMethod]({
                limit: 100
            });
        }

        if (!files) files = [];

        // 1. Filtramos las Imágenes de la Galería (Tag 'active')
        let gallery = files
            .filter(f => f.tags && f.tags.includes('active'))
            .map(f => ({
                id: f.fileId,
                url: f.url,
                title: f.name.includes('_') ? f.name.split('_')[1].split('.')[0] : 'Perrito El Pekinés'
            }));

        // SMART FALLBACK: Si no hay nada con tag 'active', pero hay archivos de imagen, tomamos los 10 más recientes
        if (gallery.length === 0 && files.length > 0) {
            console.log("Aviso: No hay fotos con tag 'active'. Usando fallback de archivos recientes.");
            gallery = files
                .filter(f => f.fileType === 'non-image' ? false : true) // Filtro básico de imágenes
                .slice(0, 10)
                .map(f => ({
                    id: f.fileId,
                    url: f.url,
                    title: 'Amigo de El Pekinés'
                }));
        }

        // 2. Filtramos los 3 Servicios (Tags 'service_1', 'service_2', 'service_3')
        const services = [1, 2, 3].map(num => {
            const file = files.find(f => f.tags && f.tags.includes(`service_${num}`));
            if (file) {
                return {
                    tag: `service_${num}`,
                    id: file.fileId,
                    url: file.url,
                    title: file.customMetadata?.title || (num === 1 ? 'Consulta Veterinaria' : num === 2 ? 'Vacunación' : 'Peluquería Canina'),
                    description: file.customMetadata?.description || 'Cuidado especializado para tu mascota.'
                };
            }
            // Fallback total por objeto si no hay archivo
            return {
                tag: `service_${num}`,
                placeholder: true,
                url: num === 1 ? 'Foto Veterinaria.jpeg' : num === 2 ? 'Vacunacion Pekines.png' : 'Peluqueria Pekines.png',
                title: num === 1 ? 'Consulta Veterinaria' : num === 2 ? 'Vacunación' : 'Peluquería Canina',
                description: 'Atención profesional y dedicada para tu mejor amigo.'
            };
        });

        // 3. Filtramos los 3 Videos (Tags 'moment_1', 'moment_2', 'moment_3')
        const moments = [1, 2, 3].map(num => {
            const file = files.find(f => f.tags && f.tags.includes(`moment_${num}`));
            if (file) {
                return {
                    id: file.fileId,
                    url: file.url,
                    title: `Video ${num}`
                };
            }
            // Fallback para que siempre haya 3 slots
            return {
                id: null,
                url: `https://ik.imagekit.io/v9p6v3z7f/Video${num}.mp4`, // Placeholder inicial
                title: `Video ${num} (Demo)`
            };
        });

        // Si después de todo no hay servicios dinámicos, enviamos una señal de 'vacio' 
        // pero incluimos los nombres por defecto por si el front los necesita.
        res.status(200).json({ 
            success: true,
            status: 'success',
            count: files.length,
            gallery, 
            services,
            moments
        });

    } catch (error) {
        console.error('API Error (Gallery):', error);
        res.status(500).json({ 
            success: false,
            error: 'No se pudo conectar con la bóveda de imágenes', 
            details: error.message 
        });
    }
};
