import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file in the root of your project
dotenv.config();

const connectDB = async () => {
    try {
        // Ensure that the MONGODB_URI environment variable is set
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in the environment variables");
        }

        // Set Mongoose configurations
        mongoose.set('strictQuery', false);

        // Connect to the MongoDB database
        const conn = await mongoose.connect(process.env.MONGODB_URI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        // Log the database connection host
        console.log(`Database connected: ${conn.connection.host}`);

    } catch (error) {
        // Log any errors that occur during the connection process
        console.error('Error connecting to database:', error.message || error);
        process.exit(1); // Optionally exit the process for a Docker container or PM2 to restart
    }
}  

export default connectDB;

