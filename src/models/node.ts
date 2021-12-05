// External dependencies

import {ObjectId} from "mongodb";

// Class Implementation

export default class Node {
    constructor(public event_node_id: string, public registration_id: string, public site_id: string, public id?: ObjectId) {}
}
