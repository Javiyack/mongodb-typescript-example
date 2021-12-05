// External Dependencies
import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

// Global Variables
export const collections: {
    events?: mongoDB.Collection,
    nodes?: mongoDB.Collection,
    performances?: mongoDB.Collection,
} = {}

export const mongo: {
    db?: mongoDB.Db,
} = {}

// Initialize Connection
export async function connectToDatabase() {
    dotenv.config();

    const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.DB_CONN_STRING);

    await client.connect();

    const db: mongoDB.Db = client.db(process.env.DB_NAME);

    mongo.db = db;

    const eventsCollection: mongoDB.Collection = db.collection(process.env.EVENTS_COLLECTION_NAME);

    collections.events = eventsCollection;

    const nodesCollection: mongoDB.Collection = db.collection(process.env.NODES_COLLECTION_NAME);

    collections.nodes = nodesCollection;

    const performancesCollection: mongoDB.Collection = db.collection(process.env.PERFORMANCES_COLLECTION_NAME);

    collections.performances = performancesCollection;

    console.log(`Successfully connected to database: ${db.databaseName}. Collections: 
        - ${collections.events.collectionName}
        - ${collections.nodes.collectionName}
        - ${collections.performances.collectionName}`);
}
