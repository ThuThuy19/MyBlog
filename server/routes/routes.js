import express, { json } from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Categories from "../models/Categories.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const routes = express.Router();
const jwtSecret = "BlogManagement";
import mongoose from "mongoose";
import session from "express-session";
import { render } from "ejs";
import Setup from "../../setup.js";
import multer from 'multer';

async function fetchData() {
  try {
    const data = await Post.find().limit(3);
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

routes.use(async (req, res, next) => {
  try {
    const sharedData = await fetchData();

    // Lay ra user tu bang so sanh id cua session
    const user = await User.findOne({ _id: req.session.userId });

    // Tao slug tu tieu de de tao URL SEO-friendly
    const seoURL = (title) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 75);
    };
    // Gan du lieu vao res.locals
    res.locals.sharedData = sharedData;
    res.locals.Setup = Setup;
    res.locals.user = user;
    res.locals.seoURL = seoURL;
    next();
  } catch (error) {
    console.error(error);
    res.locals.sharedData = {};
    next();
  }
});

// Get post
routes.get("/", async (req, res) => {
  try {
    const locals = {
      title: Setup.title,
    };
    let perPage = 6;
    let page = req.query.page || 1;
    const data = await Post.aggregate([{ $sort: { date: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();
    const category = await Categories.find();
    const count = await Post.count();
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);
    const countPages = Math.ceil(count / perPage);
    
    res.render("index", {
      layout: "pages/main",
      locals,
      data,
      countPages,
      category,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred during search");
  }
});

// Category
routes.get('/blog/:name', async (req, res) => {
  try {
    // Lấy thông tin name từ URL
    const categoryName = req.params.name;
    console.log("categoryName: "+ categoryName);
    // Tìm kiếm các bài viết trong Post có category trùng với categoryName
    const blogsInCategory = await Post.find({ category: categoryName })
      .populate('Categories') // Nếu cần thông tin của category, dùng populate
      .exec();

    console.log("blogsInCategory: ", blogsInCategory);
    res.render("./categories", { blogsInCategory, layout: "pages/main" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error occurred while fetching blogs by category' });
  }
});

// Search
routes.post("/search/:seoURL", async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm;
    // Xóa ký tự đặc biệt để tìm kiếm chính xác hơn
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9\s]/g, "");
    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, "i") } },
        { content: { $regex: new RegExp(searchNoSpecialChar, "i") } },
        { category: { $regex: new RegExp(searchNoSpecialChar, "i") } },
      ],
    });
    const locals = {
      title: "Search results for '" + searchTerm + "'",
    };
    const category = await Categories.find();

    if (data.length === 0) {
      res.status(400).send("Invalid ID format");
    } else {
      res.render("search", { data, locals, category, layout: "pages/main" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred during search");
  }
});

// Detail blog
routes.get("/blog/:id/:seoURL", async (req, res) => {
  try {
    let slug = req.params.id;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(slug);
    if (isValidObjectId) {
      const data = await Post.findById(new mongoose.Types.ObjectId(slug));
      const locals = {
        title: data.title,
      };

      res.render("./blogDetail", { layout: "pages/main", locals, data });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred during search");
  }
});

// Login
routes.get("/login", async (req, res) => {
  try {
    res.render("./login", { layout: "pages/login" });
  } catch (error) {
    console.log(error);
  }
});

// Session config
const sessionConfig = {
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, 
};

// Sử dụng session middleware trong routes
routes.use(session(sessionConfig));

routes.post("/login", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    const user = await User.findOne({ username });
    if (user || (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ userId: user._id }, "yourSecretKey");
      // Send token in cookie
      req.session.userId = user._id;
      res.cookie("token", token, { httpOnly: true });
      res.redirect("./adminUI");
    } else {
      res.status(401).send("Invalid username or password");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred during login");
  }
});

//Middleware to check token before redict to login
const authMiddleware = function verifyToken(req, res, next) {
  const token = req.cookies.token; // Get token from cookie
  if (!token) {
    return res.redirect("./login");
  }
  try {
    // decode token
    const decoded = jwt.verify(token, "yourSecretKey");
    // Save userId from token to request to use other route
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).send("Invalid or expired token");
  }
};

// Route admin - just redirect if login success
routes.get("/adminUI", authMiddleware, async (req, res) => {
  try {
    const data = await Post.find();
    res.render("./adminUI", { data, layout: "pages/admin" });
  } catch (error) {
    console.log(error);
  }
});

routes.get("/edit/:id", authMiddleware, async (req, res) => {
  try {
    const data = await Post.findOne({ _id: req.params.id });
    if (data) {
      const date = data.date;
      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      res.render("./editBlog", { layout: "pages/admin", data, formattedDate });
    } else {
      res.status(404).send("Data not found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

routes.put("/edit/:id", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      date,
      category,
      shortContent,
      content,
      author,
      img,
      imgFooter,
    } = req.body;
    if (!date) {
      return res.status(400).send("Date is required");
    }
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title,
        date: new Date(date), // Convert the date string to a JavaScript Date object
        category,
        shortContent,
        content,
        author,
        img,
        imgFooter,
      },
      { new: true }
    );
    if (!updatedPost) {
      return res.status(404).send("Post not found");
    }
    res.redirect(`/edit/${req.params.id}`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

routes.get("/add", authMiddleware, async (req, res) => {
  try {
    res.render("./addBlog", { layout: "pages/addBlog" });
  } catch (error) {
    console.log(error);
  }
});

routes.post("/add", authMiddleware, async (req, res) => {
  try {
    console.log(req.body);
    try {
      const newPost = new Post({
        title: req.body.title,
        date: req.body.date,
        category: req.body.category,
        shortContent: req.body.shortContent,
        content: req.body.content,
        author: req.body.author,
        img: req.body.img,
        imgFooter: req.body.img,
      });
      await Post.create(newPost);
      res.json({ success: true, message: "Add thanh cong" });
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
});

routes.get("/register", async (req, res) => {
  try {
    res.render("./register", { layout: "pages/login" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

routes.post("/register", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username,
      password: hashedPassword,
      role: 0,
      fullname: name,
      email: email,
      company: "Cong ty TNHH OneADX",
      job: "Developer",
      country: "Viet Nam",
      address: "TP Ho Chi Minh",
      phone: "123654987",
      about:
        "Sunt est soluta temporibus accusantium neque nam maiores cumque temporibus. Tempora libero non est unde veniam est qui dolor. Ut sunt iure rerum quae quisquam autem eveniet perspiciatis odit. Fuga sequi sed ea saepe at unde.",
    });
    res.redirect("/adminUI");
    // res.status(201).json({ message: 'User created', user });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "User already in use" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

routes.post("/delete/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const result = await Post.findByIdAndRemove(postId);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Bai dang khong ton tai" });
    }

    // res.json({ success: true, message: "Xoa thanh cong" });
    res.redirect("/adminUI");
  } catch (error) {
    console.error("Loi:", error);
    res.status(500).json({ success: false, message: "Loi may chu noi bo" });
  }
});

routes.get("/users-profile", async (req, res) => {
  res.render("./profiles", { layout: "pages/users-profile"});
});

routes.get("/changePassword", async (req, res) => {
  res.render("./changePassword", { layout: "pages/users-profile"});
});

routes.post('/changePassword', async (req, res) => {
  try {
    const { password, newpassword, renewpassword } = req.body;
    // check newPassword like renewpassword
    if (newpassword !== renewpassword) {
      return res.render('./changePassword', {
        error: 'New password and confirm password do not match',
      });
    }
    const user = await User.findOne({ _id: req.session.userId });

    // hashcode new password
    const hashedPassword = await bcrypt.hash(newpassword, 10);

    const isPasswordValid = await bcrypt.compare(hashedPassword, user.password);

    if (isPasswordValid) {
      return res.render('./changePassword');
    }

    // update new password to db
    user.password = hashedPassword;
    await user.save();
    res.render('./login', { success: 'Password changed successfully',layout: "pages/users-profile" });
  } catch (error) {
    console.error('Error changing password:', error);
    res.render('./changePassword', { error: 'Internal server error' });
  }
});

//Edit profile
routes.get("/edit-profile", authMiddleware, async (req, res) => {
  try {
    // get user from session
    const user = await User.findOne({ _id: req.session.userId });
    res.render('./edit-profile', { layout: 'pages/users-profile', user : user});
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send("Internal server error");
  }
});

// Thiết lập Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/img'); // Thư mục lưu trữ ảnh
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop(); // Lấy phần mở rộng của file
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Giới hạn size file ảnh: 25MB
});

routes.post('/edit-profile',upload.single('avatar'), authMiddleware, async (req, res) => {
  try {
    const {username, fullname, about, company, job, country, address, phone, email } = req.body;
    
    // get user from session
    const user = await User.findOne({ _id: req.session.userId });

    // update profile
    user.avatar = req.file.path.split("\\").slice(1).join("/");
    user.username = username;
    user.fullname = fullname;
    user.about = about;
    user.company = company;
    user.job = job;
    user.country = country;
    user.address = address;
    user.phone = phone;
    user.email = email;

    await user.save();
    res.render('./profiles', { layout: 'pages/users-profile' , user});
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).send('Internal server error');
  }
});

routes.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect('./login');
});

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
//         imgFooter: "/img/travel5-70x70.jpg"
//       },
//       {
//         title: "Sed gravida finibus blandit",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Technology",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl.",
//         content:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/technology5-1200x800.jpg",
//         imgFooter: "/img/technology5-70x70.jpg"
//       },
//       {
//         title: "Curabitur eu auctor volutpat",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Travel",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/travel4-1200x800.jpg",
//         imgFooter: "/img/travel4-70x70.jpg"
//       },
//       {
//         title: "Nulla venenatis turpis viverra",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Food",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content: "Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/food6-1200x800.jpg",
//         imgFooter: "/img/food6-70x70.jpg"
//       },
//       {
//         title: "Nulla luctus at sollicitudin",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Food",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl.",
//         content: "Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/food4-1200x800.jpg",
//         imgFooter: "/img/food4-70x70.jpg"
//       },
//       {
//         title: "Aliquam ultricies nisi auctor",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Travel",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/travel3-1200x800.jpg",
//         imgFooter: "/img/travel3-70x70.jpg"
//       },
//       {
//         title: "Praesent posuere hendrerit",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Style",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/style4-1200x800.jpg",
//         imgFooter: "/img/style4-70x70.jpg"
//       },
//       {
//         title: "Class aptent ad litora torquent",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Food",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content: "Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/food3-1200x800.jpg",
//         imgFooter: "/img/food3-70x70.jpg"
//       },
//       {
//         title: "Nam enim scelerinsque sapien",
//         date: "2022-10-27T10:30:00.000Z",
//         category: "Fashion",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/fashion4-1200x800.jpg",
//         imgFooter: "/img/fashion4-70x70.jpg"
//       },
//       {
//         title: "Aenean suscipit lectus dapibus",
//         date: "2023-10-27T10:30:00.000Z",
//         category: "Travel",
//         shortContent:"Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl",
//         content: "Morbi id viverra neque. In elementum tortor nunc, nec ultrices nibh imperdiet ut. Vivamus non tempus urna, vel euismod lectus. In hendrerit varius nisl ac ornare. Donec varius blandit metus, vitae pretium nibh. Morbi quis malesuada arcu. Curabitur viverra eros non elit aliquam cursus. Suspendisse potenti. Aliquam ex tortor, tristique sit amet ligula suscipit, auctor sagittis sapien. Etiam malesuada condimentum urna, vel porta justo dictum vel. Pellentesque et fringilla diam, ac venenatis risus. Praesent sed augue finibus, gravida leo at, varius dolor. Mauris non orci placerat, laoreet ipsum sit amet, consectetur ipsum. Maecenas eget vulputate nisl Phasellus elementum faucibus imperdiet. Sed ut egestas ex.Vestibulum facilisis tincidunt nibh sed suscipit. Nullam pellentesque libero sit amet metus ornare, sit amet iaculis sapien egestas. Sed viverra accumsan augue a placerat. Cras vestibulum leo augue, eu convallis est vestibulum quis. Pellentesque interdum, diam vitae pellentesque rutrum, tortor ex finibus metus,in interdum dui ipsum quis augue. Lorem ipsum dolor sit amet,consectetur adipiscing elit. Aenean a neque enim.",
//         author: "Andrea",
//         img: "/img/travel2-1200x800.jpg",
//         imgFooter: "/img/travel2-70x70.jpg"
//       },
//     ]);

//     User.insertMany([
//       {
//         avatar: "/img/avatar.png",
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
//         name: "Food",
//         decription: "food"
//       },
//       {
//         name: "Travel",
//         decription: "travel"
//       },
//       {
//         name: "Fashion",
//         decription: "fashion"
//       },
//       {
//         name: "Style",
//         decription: "style"
//       },
//       {
//         name: "Technology",
//         decription: "technology"
//       }
//     ])
// }
// insertPostData();
