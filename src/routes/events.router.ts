// External Dependencies
import express, {Request, Response} from "express";
import {ObjectId} from "mongodb";
import {collections} from "../services/database.service";
import Event from "../models/event";

// Global Config
export const eventsRouter = express.Router();

eventsRouter.use(express.json());

// GET
eventsRouter.get("/", async (_req: Request, res: Response) => {
    console.log(`Recived request: GET /events`)
    try {
        const page: number = +_req.query.page - 1 | 0;
        const events = (await collections.events.find({}).skip(page * 3).limit(3).toArray()) as unknown as Event[];

        console.log("GET /events. result:" + JSON.stringify(events));
        res.status(200).send(events);
    } catch (error) {
        console.log("GET /events. result:" + JSON.stringify(error.message));
        res.status(500).send(error.message);
    }
});


eventsRouter.get("/:param", async (req: Request, res: Response) => {
    const startTime = Date.now()
    const resource: string = req?.params?.param;
    console.log(`Recived request: GET  /nodes/${resource}`)
    if (resource == "export") {
        try {
            const filter = {};
            const projection = {_id: 0, event_nodes: 0};
            const options = {
                // Include only the `title` and `imdb` fields in each returned document
                projection: projection,
            };
            console.log(`Fiter: ${JSON.stringify(filter)}`)
            console.log(`Projection: ${JSON.stringify(projection)}`)
            const findStartTime = Date.now()
            const events = (await collections.raw_events.find(filter, options).toArray()) as unknown as Event[];
            console.log(`Events count: ${events.length}. ${Date.now() - findStartTime} ms elapsed.`)
            // const response = {
            //     code: events ? 201 : 500,
            //     message: events ? `OK` : "Failed to fetch performances",
            //     data_count: events ? events.length : 0,
            //     data: events
            // }
            // console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)
            // res.status(404).send(response);
            try {

                const insertManyStartTime = Date.now()
                const insertMany = await collections.events.insertMany(events, {ordered: false})
                console.log(`insertMany nodes: acknowledged=${insertMany.acknowledged}, insertedCount=${insertMany.insertedCount}. ${Date.now() - insertManyStartTime} ms elapsed.`)
                const response = {
                    code: insertMany ? 201 : 500,
                    message: insertMany ? `OK` : "Failed to insertMany performances",
                    acknowledged: insertMany ? insertMany.acknowledged : true,
                    inserted_count: insertMany ? insertMany.insertedCount : 0,
                    elapsed_ms: Date.now() - startTime,
                }
                if (events) {
                    console.log(`Duration: ${Date.now() - startTime} ms elapsed.`)
                    res.status(200).send(response);
                }
            } catch (error) {
                const response = {
                    code: 404,
                    error: `Unable to export events`,
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


eventsRouter.get("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {

        const query = {_id: new ObjectId(id)};
        const event = (await collections.events.findOne(query)) as unknown as Event;

        if (event) {
            res.status(200).send(event);
        }
    } catch (error) {
        res.status(404).send(`Unable to find matching document with id: ${req.params.id}`);
    }
});

// POST
eventsRouter.post("/", async (req: Request, res: Response) => {
    try {
        const newEvent = req.body as Event[];
        const result = await collections.events.insertMany(newEvent);
        const response = {
            code: result ? 201 : 500,
            message: result ? `Successfully created a new event with id ${result.insertedIds}` : "Failed to create a new event.",
            data: result
        }
        result
            ? res.status(201).send(response)
            : res.status(500).send(response);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

// PUT
eventsRouter.put("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const updatedEvent: Event = req.body as Event;
        const query = {_id: new ObjectId(id)};

        const result = await collections.events.updateOne(query, {$set: updatedEvent});

        result
            ? res.status(200).send(`Successfully updated event with id ${id}`)
            : res.status(304).send(`Event with id: ${id} not updated`);
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
});

// DELETE
eventsRouter.delete("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const query = {_id: new ObjectId(id)};
        const result = await collections.events.deleteOne(query);

        if (result && result.deletedCount) {
            res.status(202).send(`Successfully removed event with id ${id}`);
        } else if (!result) {
            res.status(400).send(`Failed to remove event with id ${id}`);
        } else if (!result.deletedCount) {
            res.status(404).send(`Event with id ${id} does not exist`);
        }
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message); 1
    }
});
