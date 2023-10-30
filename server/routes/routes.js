import express, { json } from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Categories from "../models/Categories.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const routes = express.Router();
const jwtSecret = "BlogManagement";


async function fetchData() {
  try {
      const data = await Post.find().limit(10); // Thực hiện truy vấn MongoDB để lấy dữ liệu
      return data; // Trả về kết quả truy vấn
  } catch (error) {
      console.error(error);
      return []; // Xử lý lỗi và trả về dữ liệu mặc định
  }
}

routes.use(async (req, res, next) => {
  try {
    const sharedData = await fetchData(); // Thực hiện truy vấn cơ sở dữ liệu
    res.locals.sharedData = sharedData; // Gán dữ liệu vào res.locals
    next();
  } catch (error) {
    // Xử lý lỗi khi truy xuất cơ sở dữ liệu
    console.error(error);
    res.locals.sharedData = {}; // Gán dữ liệu mặc định hoặc xử lý lỗi
    next();
  }
});


routes.get("/", async (req, res) => {
  try {
    const locals = {
      title: "Blog",
    };
    let perPage = 6;
    let page = req.query.page || 1;
    const data = await Post.aggregate([{$sort: {date: -1}}]).skip(perPage*page - perPage).limit(perPage).exec();
    const category = await Categories.aggregate([{$sort: {date: -1}}]).skip(perPage*page - perPage).limit(perPage).exec();
    const count = await Post.count();
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render("index", { layout: "index", locals, data,category, current: page, nextPage: hasNextPage ? nextPage : null  });
  } catch (error) {
    console.log(error);
  }
});  

// routes.get("footer", async (req, res) => {
//   try {
//     const dataFooter = await Post.find();

//     res.render("/footer", { layout: "/footer", dataFooter });
//   } catch (error) {
//     console.log(error);
//   }
// });  

// Laays detail
routes.get("/:id", async (req, res) => {
  try {
    let slug = req.params.id;
    const data = await Post.findById({ _id : slug });
    const locals = {
      title: data.title
    };
    
    res.render("blogDetail", { layout: "blogDetail", locals, data });
  } catch (error) {
    console.log(error);
  }
});

// routes.post("/search", async (req, res) => {
//   try {
//     const locals = {
//       title: "Search my blog with EJS",
//     };
//     let searchTerm = req.body.searchTerm
//     const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9]/g, "")
//     const data = await Post.find({
//       $or: [
//         { title: { $regex: new RegExp(searchNoSpecialChar, "i") } },
//         { body: { $regex: new RegExp(searchNoSpecialChar, "i") } },
//         { category: { $regex: new RegExp(searchNoSpecialChar, "i") } },

//       ],
//     });
//     res.render("search", { data, locals, layout: "pages/index" });
//   } catch (error) {
//     console.log(error);
//   }
// });

// routes.get("/login", async (req, res) => {
//   try {
//     res.render("login", { layout: "pages/login" });
//   } catch (error) {
//     console.log(error);
//   }
// });
// routes.get("/adminUI", async (req, res) => {
//   try {
//     const data = await Post.find();
//     res.render("adminUI", { layout: "pages/adminUI", data });
//   } catch (error) {
//     console.log(error);
//   }
// });

// routes.get("/editBlog", (req, res) => {
//   res.render("editBlog", { layout: "Admin/editBlog" });
// });
// routes.get("/addBlog", (req, res) => {
//   res.render("addBlog", { layout: "Admin/addBlog" });
// });
// routes.post("/adminUI",async (req, res) => {
//   try {
//     const {username, password } = req.body;
//     const user = await User.findOne({username})
//   if(!user) {
//     return res.status(401).json({
//       message: 'Invalid credentials'
//     })
//   }
//   const isPasswordValid = await bcrypt.compare(password, user.password)
//   if(!isPasswordValid){
//     return res.status(401).json({ message: "Invalid Credentials"})
//   }
//   const token =jwt.sign({ userId: user._id} , jwtSecret)
//   res.cookie('token', token, {httpOnly: true})
//   res.redirect('/adminUI')

//   } catch (error) {
//       console.log(error);
//   }

// });

// routes.post("/register", async (req, res) => {
//   try {
//     const {username, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//   try {
//     const user = await User.create({username, password: hashedPassword});
//     res.status(201).json({message: 'User created', user})
//   } catch (error) {
//     if (error.code === 11000){
//       res.status(409).json({message: 'User already in use'})
//     }
//     res.status(500).json({message: 'Internal server error'})
//   }
//   } catch (error) {
//     console.log(error);
//   }

// });

export default routes;


















// function insertPostData() {
//     Post.insertMany([
//       {
//         title: "Donec convallis tellus convallis",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Travel",
//         shortContent: "Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content: "Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/travel5-1200x800.jpg",
//         imgFooter: "/img/travel5-70x70.jpg",
//       },
//       {
//         title: "Sed gravida finibus blandit",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Technology",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl.",
//         content:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/technology5-1200x800.jpg",
//         imgFooter: "/img/technology5-70x70.jpg",
//       },
//       {
//         title: "Curabitur eu auctor volutpat",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Travel",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/travel4-1200x800.jpg",
//         imgFooter: "/img/travel4-70x70.jpg",
//       },
//       {
//         title: "Nulla venenatis turpis viverra",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Food",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content: "Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/food6-1200x800.jpg",
//         imgFooter: "/img/food6-70x70.jpg",
//       },
//       {
//         title: "Nulla luctus at sollicitudin",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Food",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl.",
//         content: "Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/food4-1200x800.jpg",
//         imgFooter: "/img/food4-70x70.jpg",
//       },
//       {
//         title: "Aliquam ultricies nisi auctor",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Travel",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/travel3-1200x800.jpg",
//         imgFooter: "/img/travel3-70x70.jpg",
//       },
//       {
//         title: "Praesent posuere hendrerit",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Style",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/style4-1200x800.jpg",
//         imgFooter: "/img/style4-70x70.jpg",
//       },
//       {
//         title: "Class aptent ad litora torquent",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Food",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content: "Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/food3-1200x800.jpg",
//         imgFooter: "/img/food3-70x70.jpg",
//       },
//       {
//         title: "Nam enim scelerinsque sapien",
//         date: "2022-10-27T10:30:00.000Z",
//         category: "Fashion",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/fashion4-1200x800.jpg",
//         imgFooter: "/img/fashion4-70x70.jpg",
//       },
//       {
//         title: "Aenean suscipit lectus dapibus",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Travel",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content: "Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/travel2-1200x800.jpg",
//         imgFooter: "/img/travel2-70x70.jpg",
//       },
//     ]);
  
//     User.insertMany([
//       {
//         username:  "admin",
//         password : "123456",
//         role: 1,
//         fullname: "Nguyen Thi Thu Thuy",
//         email	:"thuyntt.oneadx@gmail.com",
//         company: "Cong Ty TNHH OneADX",
//         job	: "Dveloper",
//         country	:"Viet Nam",
//         address	: "Ha Noi",
//         phone	: "0123456789" ,
//         about: "Sunt est soluta temporibus accusantium neque nam maiores cumque temporibus. Tempora libero non est unde veniam est qui dolor. Ut sunt iure rerum quae quisquam autem eveniet perspiciatis odit. Fuga sequi sed ea saepe at unde."
//       }
//     ])
//     Categories.insertMany([
//       {
//         name: "food",
//         decription: "food"
//       },
//       {
//         name: "travel",
//         decription: "travel"
//       },
//       {
//         name: "fashion",
//         decription: "fashion"
//       },
//       {
//         name: "style",
//         decription: "style"
//       },
//       {
//         name: "technology",
//         decription: "technology"
//       }
//     ])
//   }
//   insertPostData();
  