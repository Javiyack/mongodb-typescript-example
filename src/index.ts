import express from "express";
import {connectToDatabase} from "./services/database.service"
import {eventsRouter} from "./routes/events.router";
import {nodesRouter} from "./routes/nodes.router";
import {performanesRouter} from "./routes/performances.router";
import {dbRouter} from "./routes/db.router";

const cors = require('cors');

const app = express();
const port = 8080; // default port to listen

// ** TODO ** Replace this code with a call to your EPS router class to handle all calls to /events endpoint
connectToDatabase()
    .then(() => {
        app.use(cors({
            origin: '*'
        }));
        app.use(express.json({limit: '50mb'}));
        app.use(express.urlencoded({limit: '50mb', extended: true}));
        //app.use("/events", eventsRouter);
        //   app.use("/nodes", nodesRouter);
        //   app.use("/performances", performanesRouter);
        app.use("/", dbRouter);

        app.listen(port, () => {
            console.log(`Server started at http://localhost:${port}`);
        });
    })
    .catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
    });
