// External Dependencies
import express, {Request, Response} from "express";
import {ObjectId} from "mongodb";
import {collections} from "../services/database.service";
import Performance from "../models/performance";
import Event from "../models/event";
import Node from "../models/node";
import {count} from "console";

// Global Config
export const performanesRouter = express.Router();

performanesRouter.use(express.json());

// GET
performanesRouter.get("/", async (_req: Request, res: Response) => {
    try {
        let page: number = (+_req.query.page - 1) | 0;
        let pageSize: number = +_req.query.size;
        page = (page > 0) ? page : 0;
        console.log(`Recived request: GET /performances page: ${_req.query.page} pageSize: ${_req.query.size}`)
        console.log(`Recived request: GET /performances page: ${page} pageSize: ${pageSize}`)
        const count = await collections.performances.find({}).count()
        const performances = (await collections.performances.find({}).skip(page * pageSize).limit(pageSize).toArray()) as unknown as Performance[];
        page = Math.min(count / pageSize, page);
        const response = {
            count: count,
            data: performances
        }
        console.log(`Recived response count: ${JSON.stringify(count)}`)
        res.status(200).send(response);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

performanesRouter.get("/:param/:id", async (req: Request, res: Response) => {
    const param: string = req?.params?.param;
    const id: string = req?.params?.id;
    const search = new RegExp(`^ ${id}`);
    console.log(`Recived request: GET / performances / ${param} / ${id}`)
    if (param == "export") {
        console.log(`Extracting performances from events`)
        try {
            const filter = id ? {"event_nodes.event_node_id": {$regex: search}} : {};
            const projection = {_id: 0, event_id: 1, "event_nodes.event_node_id": 1, "event_nodes.node_performances": 1};
            const options = {
                // Include only the `title` and `imdb` fields in each returned document
                projection: projection,
            };
            console.log(`Fiter: ${JSON.stringify(filter)}`)
            console.log(`Projection: ${JSON.stringify(projection)}`)
            const events = (await collections.raw_events.find(filter, options).toArray()) as unknown as Event[];
            let cont = 0
            const performances = events.map(e => e.event_nodes
                .map((en: any) => en.node_performances
                    .map((p: Performance) => p)).flat(Infinity))
                .flat(Infinity)
                .filter((p: Performance) => p.event_node_id.startsWith(id)).map((p: Performance) => {
                    cont = cont + 10000
                    return {
                        ...p,
                        interval_dttm: p.interval_dttm - p.interval_dttm % 10000 + Math.floor(Math.random() * 110 - 10) * 1000
                    }
                });

            try {
                const insertMany = await collections.performances.insertMany(
                    performances, {
                    ordered: false
                })
                const response = {
                    code: insertMany ? 201 : 500,
                    message: insertMany ? `OK` : "Failed to insertMany performances",
                    details: insertMany ? insertMany : 0,
                }
                if (insertMany) {
                    res.status(200).send(response);
                }
            } catch (error) {
                const response = {
                    code: 404,
                    error: `Unable to export performances from events`,
                    detail: error.message,
                }
                res.status(404).send(response);
            }
        } catch (error) {
            const response = {
                code: 404,
                error: `Unable to find matching document with id: ${req.params.id} `,
                detail: error.message,
            }
            console.log("ERROR: " + error.message)
            res.status(404).send(response);
        }

    }
    else {
        try {
            const projection = {_id: 0};
            const options = {
                // Include only the `title` and `imdb` fields in each returned document
                projection: projection,
            };
            const query = JSON.parse(`{"${param}": "${id}"} `)
            console.log(`Fiter: ${JSON.stringify(query)} `)
            const performances = (await collections.performances.find(query, options).toArray()) as unknown as Performance[];
            const response = {
                code: performances ? 201 : 500,
                message: performances ? `OK` : "Failed to fetch performances",
                data_count: performances ? performances.length : 0,
                data: performances
            }
            if (performances) {
                res.status(200).send(response);
            }
        } catch (error) {
            res.status(404).send(`Unable to find matching document with id: ${req.params.id} `);
        }
    }
});


performanesRouter.get("/:param", async (req: Request, res: Response) => {
    const startTime = Date.now()
    const resource: string = req?.params?.param;
    let count = 0
    console.log(`Recived request: GET / performances / ${resource} `)
    if (resource == "export") {
        try {
            const filter = {};
            const projection = {_id: 0, event_id: 1, "event_nodes.event_node_id": 1, "event_nodes.node_performances": 1};
            const options = {
                // Include only the `title` and `imdb` fields in each returned document
                projection: projection,
            };
            console.log(`Fiter: ${JSON.stringify(filter)} `)
            console.log(`Projection: ${JSON.stringify(projection)} `)
            const findStartTime = Date.now()
            const events = (await collections.raw_events.find(filter, options).toArray()) as unknown as Event[];
            console.log(`Events count: ${events.length}. ${Date.now() - findStartTime} ms elapsed.`)
            const performances = events.map(e => e.event_nodes.map((en: any) => {
                return en.node_performances.slice(0, 10).map((p: Performance) => {
                    count++
                    return {
                        ...p,
                        interval_dttm: (Date.now() - Date.now() % 1000 + count * 1000)
                    } as Performance
                })
            }).flat(Infinity)
            )
                .flat(Infinity);
            console.log(`Performances count: ${JSON.stringify(performances.length)} `)

            try {

                const insertManyStartTime = Date.now()
                const insertMany = await collections.performances.insertMany(performances, {ordered: false})
                console.log(`insertMany performances: acknowledged = ${insertMany.acknowledged}, insertedCount = ${insertMany.insertedCount}. ${Date.now() - insertManyStartTime} ms elapsed.`)
                const response = {
                    code: insertMany ? 201 : 500,
                    message: insertMany ? `OK` : "Failed to insertMany performances",
                    acknowledged: insertMany ? insertMany.acknowledged : true,
                    inserted_count: insertMany ? insertMany.insertedCount : 0,
                    elapsed_ms: Date.now() - startTime,
                }
                if (performances) {
                    console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)
                    res.status(200).send(response);
                }
            } catch (error) {
                const response = {
                    code: 404,
                    error: `Unable to export performances from events`,
                    detail: error.message,
                    elapsed_ms: Date.now() - startTime,
                }
                console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)
                res.status(404).send(response);
            }
        } catch (error) {
            const response = {
                code: 404,
                error: `Unable to find matching document with id: ${req.params.id} `,
                detail: error.message,
            }
            console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)
            res.status(404).send(response);
        }

    } else {
        try {

            const query = {};
            console.log(`Fiter query: ${JSON.stringify(query)} `)
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
                error: `Unable to find matching document with id: ${req.params.id} `,
                detail: error.message,
            }
            console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)

            res.status(404).send(response);
        }
    }

});

// POST
performanesRouter.post("/", async (req: Request, res: Response) => {
    try {
        const newPerformance = req.body as Performance;
        const result = await collections.performances.insertOne(newPerformance);

        result
            ? res.status(201).send(`Successfully created a new performance with id ${result.insertedId} `)
            : res.status(500).send("Failed to create a new performance.");
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

// PUT
performanesRouter.put("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const updatedPerformance: Performance = req.body as Performance;
        const query = {_id: new ObjectId(id)};

        const result = await collections.performances.updateOne(query, {$set: updatedPerformance});

        result
            ? res.status(200).send(`Successfully updated performance with id ${id} `)
            : res.status(304).send(`Performance with id: ${id} not updated`);
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
});

// DELETE
performanesRouter.delete("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const query = {_id: new ObjectId(id)};
        const result = await collections.performances.deleteOne(query);

        if (result && result.deletedCount) {
            res.status(202).send(`Successfully removed performance with id ${id} `);
        } else if (!result) {
            res.status(400).send(`Failed to remove performance with id ${id} `);
        } else if (!result.deletedCount) {
            res.status(404).send(`Performance with id ${id} does not exist`);
        }
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message); 1
    }
});
