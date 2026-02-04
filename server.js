import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();

app.use(cors());

mongoose.connect('mongodb+srv://ayushkotibox_db_user:VBNTroMF9ZBUM2Up@cluster0.pbxm0sd.mongodb.net/DB?appName=Cluster0', {})
    .then(() => {
        console.log("Connected to MongoDB")
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });

app.listen(3000, () => {
    console.log("server is running on 3000");
});
