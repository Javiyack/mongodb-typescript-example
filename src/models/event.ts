// External dependencies

import {ObjectId} from "mongodb";

// Class Implementation

export default class Event {
    constructor(public event_id: string, public program_id: string, public product_id: string, public id?: ObjectId) {}
}
