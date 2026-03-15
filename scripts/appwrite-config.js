// --- Appwrite Centralized Configuration ---
const APPWRITE_CONFIG = {
    ENDPOINT: 'https://cloud.appwrite.io/v1',
    PROJECT: '69b5bc9e001dc8643178',
    BUCKET_ID: '69b5bf980019193f38fd',
    DATABASE_ID: '69b5bfbd001ba63ab1d6',
    COLLECTION_ID: 'content'
};

// Initializing the SDK globally
const { Client, Account, Databases, Storage, ID, Query } = Appwrite;
const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
    .setProject(APPWRITE_CONFIG.PROJECT);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

console.log("✅ Appwrite Centralizado e Inicializado");
