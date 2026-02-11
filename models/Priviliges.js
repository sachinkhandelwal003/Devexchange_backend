

import mongoose from "mongoose";

const priviligesSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

let Privilige = mongoose.model("Priviliges", priviligesSchema, "Priviliges");
export default Privilige;