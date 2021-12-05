// External Dependencies
import express, {Request, Response} from "express";
import {ObjectId} from "mongodb";
import {collections} from "../services/database.service";
import Performance from "../models/performance";

// Global Config
export const performanesRouter = express.Router();

performanesRouter.use(express.json());

// GET
performanesRouter.get("/", async (_req: Request, res: Response) => {
    try {
        const performances = (await collections.performances.find({}).toArray()) as unknown as Performance[];

        res.status(200).send(performances);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

performanesRouter.get("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {

        const query = {_id: new ObjectId(id)};
        const performance = (await collections.performances.findOne(query)) as unknown as Performance;

        if (performance) {
            res.status(200).send(performance);
        }
    } catch (error) {
        res.status(404).send(`Unable to find matching document with id: ${req.params.id}`);
    }
});

// POST
performanesRouter.post("/", async (req: Request, res: Response) => {
    try {
        const newPerformance = req.body as Performance;
        const result = await collections.performances.insertOne(newPerformance);

        result
            ? res.status(201).send(`Successfully created a new performance with id ${result.insertedId}`)
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
            ? res.status(200).send(`Successfully updated performance with id ${id}`)
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
            res.status(202).send(`Successfully removed performance with id ${id}`);
        } else if (!result) {
            res.status(400).send(`Failed to remove performance with id ${id}`);
        } else if (!result.deletedCount) {
            res.status(404).send(`Performance with id ${id} does not exist`);
        }
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message); 1
    }
});
