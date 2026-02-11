import mongoose from "mongoose";

const BetSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true,
        },

        user_name: {
            type: String,
            required: false,
        },

        admin_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },

        sport_type: {
            type: String, // cricket, football, tennis, casino
            required: false,
            index: true,
        },

        event_id: {
            type: String, // third-party event id
            required: false,
            index: true,
        },

        event_name: {
            type: String, // India vs Australia
            required: false,
        },

        market_id: {
            type: String, // Match Odds, Bookmaker etc
            required: false,
        },

        market_name: {
            type: String, // Match Odds
            required: false,
        },

        selection_id: {
            type: String, // team / runner id
            required: false,
        },

        selection_name: {
            type: String, // India / Australia / Dragon
            required: false,
        },

        bet_type: {
            type: String,
            enum: ["back", "lay"],
            required: false,
            index: true,
        },

        bet_sub_type: {
            type: String,
            enum: ["casino", "sport", "third_party"],
            default: "sport",
            required: false
        },

        odds: {
            type: Number, // U Rate
            required: false,
        },

        stake: {
            type: Number,
            required: false,
        },

        // 🔹 Calculated exposure
        liability: {
            type: Number, // very important for lay
            required: false,
        },

        // 🔹 Bet status (for Current Bets screen)
        bet_status: {
            type: String,
            enum: ["matched", "deleted", "settled"],
            default: "matched",
            index: true,
        },

        // 🔹 Result after settlement
        result: {
            type: String,
            enum: ["win", "loss", "void", "pending"],
            default: "pending",
        },

        profit_loss: {
            type: Number,
            default: 0,
        },

        // 🔹 Admin control
        is_deleted_by_admin: {
            type: Boolean,
            default: false,
        },

        delete_reason: {
            type: String,
            default: "",
        },

        // 🔹 Date & time
        placed_at: {
            type: Date,
            default: Date.now,
            index: true,
        },

        settled_at: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

let Bet = mongoose.model("Bet", BetSchema, "Bet");

export default Bet;
