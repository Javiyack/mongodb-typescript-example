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
    try {
        const events = (await collections.events.find({}).toArray()) as unknown as Event[];

        res.status(200).send(events);
    } catch (error) {
        res.status(500).send(error.message);
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
        const newEvent = req.body as Event;
        const result = await collections.events.insertOne(newEvent);
        const response = {
            code: result ? 201 : 500,
            message: result ? `Successfully created a new event with id ${result.insertedId}` : "Failed to create a new event.",
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
