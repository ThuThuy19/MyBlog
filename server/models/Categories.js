import mongoose from "mongoose";
const Schema = mongoose.Schema;
const CategoriesSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    decription: {
        type: String,
        required: true,
    }
});
export default mongoose.model("Categories", CategoriesSchema)
