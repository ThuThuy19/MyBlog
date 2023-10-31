import express from "express";
import routes from "./server/routes/routes.js";
import expressEjsLayouts from "express-ejs-layouts";
import connectDB from "./server/config/connectDB.js";
const app = express();
const port = process.env.port || 8080;
import cookieParser from "cookie-parser";
import MongoStore from "connect-mongo";
import session from "express-session";
import methodOverride from "method-override";
import Post from "./server/models/Post.js";
import Categories from "./server/models/Categories.js";


// set the view engine to ejs
app.use(express.static("public"));

connectDB();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);
app.use(methodOverride("_method"));

//ejs setup
app.use(expressEjsLayouts)  

app.set("layout" , "views/index")

app.set('view engine' , 'ejs');


//create routes
app.use(routes)

app.listen(port,'0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
