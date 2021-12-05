// External Dependencies
import express, {Request, Response} from "express";
import {ObjectId} from "mongodb";
import Model from "../models/model";
import {mongo} from "../services/database.service";

// Global Config
export const dbRouter = express.Router();

dbRouter.use(express.json());

// GET
dbRouter.get("/*", async (_req: Request, res: Response) => {
    try {
        const params = _req.params[0].split("/").filter(e => e != "")
        const collectionName = params[0];
        const filter = params[1];
        const value = params[2];

        const query = filter ? {
            [filter]: new RegExp(value, "gi") as any
        } : {}
        console.log(JSON.stringify(query));
        if (filter == "_id") query._id = new ObjectId(value)

        const collection = mongo.db.collection(collectionName)
        const data = await collection.find(query).toArray();
        const result = {
            code: 200,
            message: "OK",
            count: data.length,
            data: data,
        }
        res.status(200).send(result);
    } catch (error) {
        const result = {
            code: 500,
            message: "Internal server error",
            detail: error.message
        }
        res.status(500).send(result);
    }
});

// POST
dbRouter.post("/*", async (req: Request, res: Response) => {
    try {
        const params = req.params[0].split("/").filter(e => e != "")
        const body = req.body.length ? req.body : [req.body];
        const dbAction = await mongo.db.collection(params[0]).insertMany([...body]);

        const result = {
            code: 200,
            message: `Succesfully inserted document${req.body.length ? 's' : ''} into ${params[0]}`,
            data: body,
            action: dbAction,
        }

        res.status(200).send(result);
    } catch (error) {
        const result = {
            code: 500,
            message: "Internal server error",
            detail: error.message
        }
        res.status(500).send(result);
    }
});
