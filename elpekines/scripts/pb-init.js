/**
 * SCRIPT PARA INICIALIZAR POCKETBASE
 * Instrucciones:
 * 1. Abre el sitio en tu navegador.
 * 2. Abre la consola de desarrollador (F12).
 * 3. Copia y pega todo este código y presiona Enter.
 */

async function setupPocketBase() {
    try {
        console.log("📡 Conectando a PocketBase...");
        
        // 1. Autenticarse como Administrador
        // Usando las credenciales proporcionadas por Jesús
        await pb.admins.authWithPassword('jcarpi1510@gmail.com', 'Enmanuel.1207');
        console.log("✅ Autenticado como Admin");

        // 2. Crear la colección 'content' si no existe
        // Verificamos si existe primero
        try {
            await pb.collections.getOne('content');
            console.log("ℹ️ La colección 'content' ya existe.");
        } catch (e) {
            console.log("🔨 Creando colección 'content'...");
            await pb.collections.create({
                name: 'content',
                type: 'base',
                schema: [
                    { name: 'type', type: 'text', required: true },
                    { name: 'title', type: 'text' },
                    { name: 'description', type: 'text' },
                    { name: 'order', type: 'number' },
                    { name: 'active', type: 'bool' },
                    { name: 'file', type: 'file', options: { maxSelect: 1 } }
                ],
                listRule: "", // Público
                viewRule: "", // Público
                createRule: "@request.auth.id != ''", // Solo usuarios logueados
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''"
            });
            console.log("✅ Colección 'content' creada.");
        }

        // 3. Crear datos iniciales (opcional)
        const existing = await pb.collection('content').getList(1, 1);
        if (existing.totalItems === 0) {
            console.log("🌱 Agregando slots iniciales de servicios...");
            const services = [
                { type: 'service', title: 'Consulta Veterinaria', description: 'Atención profesional preventiva.', order: 1, active: true },
                { type: 'service', title: 'Vacunación', description: 'Esquema completo para tu mejor amigo.', order: 2, active: true },
                { type: 'service', title: 'Peluquería Canina', description: 'Baño y corte estético de lujo.', order: 3, active: true }
            ];
            
            for (const s of services) {
                await pb.collection('content').create(s);
            }
            console.log("✅ Datos iniciales agregados.");
        }

        console.log("🎉 ¡PocketBase está listo para usar!");
    } catch (error) {
        console.error("❌ Error en el setup:", error);
    }
}

setupPocketBase();
