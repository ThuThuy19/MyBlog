import mongoose from "mongoose";
const Schema = mongoose.Schema;
const PostSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        require: true
    },
    category: {
        type: String,
        required: true,
    },
    shortContent: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    img: {
        type: String,
        required: true,
    },    
    imgFooter: {
        type: String,
        required: true,
    },
    __v: { 
        type: Number,
        select: false 
    }
});
export default mongoose.model("Post", PostSchema)
