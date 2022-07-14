// External dependencies

import {ObjectId} from "mongodb";

// Class Implementation

export default class Performance {
    constructor(
        public event_node_id: string,
        public interval_dttm: number,
        public ts: number,
        public metered_value: number,
        public baseline: number,
        public id?: ObjectId) {}
}
