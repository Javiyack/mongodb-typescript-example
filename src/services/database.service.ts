// External Dependencies
import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

// Global Variables
export const collections: {
    events?: mongoDB.Collection,
    raw_events?: mongoDB.Collection,
    nodes?: mongoDB.Collection,
    performances?: mongoDB.Collection,
} = {}

export const mongo: {
    db?: mongoDB.Db,
} = {}

// Initialize Connection
export async function connectToDatabase() {
    dotenv.config();

    const protocol = process.env.CONN_PROTOCOL;
    const url = process.env.DB_CONN_STRING;
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;
    const connectionString = `${protocol}://${username}:${password}@${url}`
    console.log(`Connection String: ${connectionString}`)

    const client: mongoDB.MongoClient = new mongoDB.MongoClient(connectionString);

    await client.connect();

    const db: mongoDB.Db = client.db(process.env.DB_NAME);

    mongo.db = db;

    const eventsCollection: mongoDB.Collection = db.collection(process.env.EVENTS_COLLECTION_NAME);

    collections.events = eventsCollection;

    const rawEventsCollection: mongoDB.Collection = db.collection("raw_events");

    collections.raw_events = rawEventsCollection;

    const nodesCollection: mongoDB.Collection = db.collection(process.env.NODES_COLLECTION_NAME);

    collections.nodes = nodesCollection;

    const performancesCollection: mongoDB.Collection = db.collection(process.env.PERFORMANCES_COLLECTION_NAME);

    collections.performances = performancesCollection;

    console.log(`Successfully connected to database: ${db.databaseName}. Collections: 
    - ${collections.events.collectionName}
    - ${collections.nodes.collectionName}
    - ${collections.performances.collectionName}`);
}
