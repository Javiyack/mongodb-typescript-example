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
    console.log(`Recived request: GET /${_req.params[0].split("/").filter(e => e != "")}`)
    console.log(`query params:${JSON.stringify(_req.query)}`)
    try {
        let page: number = (+_req.query.page - 1) | 0;
        let pageSize: number = +_req.query.size;
        page = (page > 0) ? page : 0;
        console.log(`Recived request: GET /performances page: ${_req.query.page} pageSize: ${_req.query.size}`)
        console.log(`Recived request: GET /performances page: ${page} pageSize: ${pageSize}`)

        const params = _req.params[0].split("/").filter(e => e != "")
        const collectionName = params[0];
        const filter = params[1];
        const value = params[2];
        console.log(`page:${page}`)

        const query = filter ? {
            [filter]: new RegExp(value, "gi") as any
        } : {}
        console.log("GET /default path. Query:" + JSON.stringify(query));
        if (filter == "_id") query._id = new ObjectId(value)

        const collection = mongo.db.collection(collectionName)
        const count = await collection.find({}).count()
        const data = await collection.find(query).skip(page * pageSize).limit(pageSize).toArray();
        const result = {
            code: 200,
            message: "OK",
            count: count,
            data: data,
        }
        console.log("GET /default path. result:" + JSON.stringify(data.length));
        res.status(200).send(result);
    } catch (error) {
        const result = {
            code: 500,
            message: "Internal server error",
            detail: error.message
        }
        console.log("GET /default path. result:" + JSON.stringify(result));
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
            message: `${params[0]} insertion completed`,
            action: dbAction,
            data: body,
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
