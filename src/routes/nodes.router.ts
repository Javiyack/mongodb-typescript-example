// External Dependencies
import express, {Request, Response} from "express";
import {ObjectId} from "mongodb";
import {collections} from "../services/database.service";
import Event from "../models/event";
import Node from "../models/node";

// Global Config
export const nodesRouter = express.Router();

nodesRouter.use(express.json());

// GET
nodesRouter.get("/", async (_req: Request, res: Response) => {
    try {
        const page: number = +_req.query.page - 1 | 0;
        console.log(`Recived request: GET /nodes`)
        const nodes = (await collections.nodes.find({}).skip(page * 3).limit(3).toArray()) as unknown as Node[];

        res.status(200).send(nodes);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

nodesRouter.get("/:param", async (req: Request, res: Response) => {
    const startTime = Date.now()
    const resource: string = req?.params?.param;
    let count = 0
    console.log(`Recived request: GET  /nodes/${resource}`)
    if (resource == "export") {
        try {
            const filter = {};
            const projection = {_id: 0, "event_nodes.node_performances": 0};
            const options = {
                // Include only the `title` and `imdb` fields in each returned document
                projection: projection,
            };
            console.log(`Fiter: ${JSON.stringify(filter)}`)
            console.log(`Projection: ${JSON.stringify(projection)}`)
            const findStartTime = Date.now()
            const events = (await collections.raw_events.find(filter, options).toArray()) as unknown as Event[];
            console.log(`Events count: ${events.length}. ${Date.now() - findStartTime} ms elapsed.`)
            const nodes = events.map(e => e.event_nodes.flat(Infinity)).flat(Infinity);
            console.log(`Nodes count: ${JSON.stringify(nodes.length)}`)
            // const response = {
            //     code: nodes ? 201 : 500,
            //     message: nodes ? `OK` : "Failed to fetch performances",
            //     data_count: nodes ? nodes.length : 0,
            //     data: nodes
            // }
            // console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)
            // res.status(404).send(response);
            try {

                const insertManyStartTime = Date.now()
                const insertMany = await collections.nodes.insertMany(nodes, {ordered: false})
                console.log(`insertMany nodes: acknowledged=${insertMany.acknowledged}, insertedCount=${insertMany.insertedCount}. ${Date.now() - insertManyStartTime} ms elapsed.`)
                const response = {
                    code: insertMany ? 201 : 500,
                    message: insertMany ? `OK` : "Failed to insertMany performances",
                    acknowledged: insertMany ? insertMany.acknowledged : true,
                    inserted_count: insertMany ? insertMany.insertedCount : 0,
                    elapsed_ms: Date.now() - startTime,
                }
                if (nodes) {
                    console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)
                    res.status(200).send(response);
                }
            } catch (error) {
                const response = {
                    code: 404,
                    error: `Unable to export nodes from events`,
                    detail: error.message,
                    elapsed_ms: Date.now() - startTime,
                }
                console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)
                res.status(404).send(response);
            }
        } catch (error) {
            const response = {
                code: 404,
                error: `Unable to find matching document with id: ${req.params.id}`,
                detail: error.message,
            }
            console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)
            res.status(404).send(response);
        }

    } else {
        try {

            const query = {};
            console.log(`Fiter query: ${JSON.stringify(query)}`)
            const performances = (await collections.performances.find(query).toArray()) as unknown as Performance[];

            const response = {
                code: performances ? 201 : 500,
                message: performances ? `OK` : "Failed to fetch performances",
                data_count: performances ? performances.length : 0,
                data: performances
            }
            if (performances) {
                console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)
                res.status(200).send(response);
            }
        } catch (error) {
            const response = {
                code: 404,
                error: `Unable to find matching document with id: ${req.params.id}`,
                detail: error.message,
            }
            console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)

            res.status(404).send(response);
        }
    }

});


nodesRouter.get("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {

        const query = {_id: new ObjectId(id)};
        const node = (await collections.nodes.findOne(query)) as unknown as Node;

        if (node) {
            res.status(200).send(node);
        }
    } catch (error) {
        res.status(404).send(`Unable to find matching document with id: ${req.params.id}`);
    }
});

// POST
nodesRouter.post("/", async (req: Request, res: Response) => {
    try {
        const newNode = req.body as Node;
        const result = await collections.nodes.insertOne(newNode);

        result
            ? res.status(201).send(`Successfully created a new node with id ${result.insertedId}`)
            : res.status(500).send("Failed to create a new node.");
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

// PUT
nodesRouter.put("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const updatedNode: Node = req.body as Node;
        const query = {_id: new ObjectId(id)};

        const result = await collections.nodes.updateOne(query, {$set: updatedNode});

        result
            ? res.status(200).send(`Successfully updated node with id ${id}`)
            : res.status(304).send(`Node with id: ${id} not updated`);
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
});

// DELETE
nodesRouter.delete("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const query = {_id: new ObjectId(id)};
        const result = await collections.nodes.deleteOne(query);

        if (result && result.deletedCount) {
            res.status(202).send(`Successfully removed node with id ${id}`);
        } else if (!result) {
            res.status(400).send(`Failed to remove node with id ${id}`);
        } else if (!result.deletedCount) {
            res.status(404).send(`Node with id ${id} does not exist`);
        }
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
});
