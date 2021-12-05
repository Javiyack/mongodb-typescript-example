// External Dependencies
import express, {Request, Response} from "express";
import {ObjectId} from "mongodb";
import {collections} from "../services/database.service";
import Node from "../models/node";

// Global Config
export const nodesRouter = express.Router();

nodesRouter.use(express.json());

// GET
nodesRouter.get("/", async (_req: Request, res: Response) => {
    try {
        const nodes = (await collections.nodes.find({}).toArray()) as unknown as Node[];

        res.status(200).send(nodes);
    } catch (error) {
        res.status(500).send(error.message);
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
