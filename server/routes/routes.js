import express, { json } from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Categories from "../models/Categories.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const routes = express.Router();
const jwtSecret = "BlogManagement";
import mongoose from "mongoose";


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
    // Gán dữ liệu vào res.locals
    res.locals.sharedData = sharedData; 
    next();
  } catch (error) {
    console.error(error);
    res.locals.sharedData = {}; 
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
    res.status(500).send('Error occurred during search');
  }
});  

// Laays detail
routes.get("/:id", async (req, res) => {
  try {
    let slug = req.params.id;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(slug);
    if(isValidObjectId){
      const data = await Post.findById( new mongoose.Types.ObjectId(slug));
      const locals = {
        title: data.title
      };
      res.render("blogDetail", { layout: "blogDetail", locals, data });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Error occurred during search');
  }
});

routes.post("/search", async (req, res) => {
  try {
    let searchTerm = req.body.searchTerm;
    // Xóa ký tự đặc biệt để tìm kiếm chính xác hơn
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9\s]/g, "");
    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, "i") } },
        { content: { $regex: new RegExp(searchNoSpecialChar, "i") } },
        { category: { $regex: new RegExp(searchNoSpecialChar, "i") } },
      ],
    });
    console.log(data);
    const locals = {
      title: "Search results for '" + searchTerm + "'",
    };
    const category = await Categories.find();
    
    if (data.length === 0) {
      res.status(400).send('Invalid ID format');
    } else {
      res.render("search", { data, locals, category, layout: "index" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Error occurred during search');
  }
});

// Login
routes.get('/login', async (req, res) => {
  res.render('pages/login');
});


routes.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }); 

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).send('Invalid username or password');
    } else {
      const token = jwt.sign({ userId: user._id }, 'yourSecretKey');
      // Send token in cookie
      res.cookie('token', token, { httpOnly: true }); 
      res.redirect('/adminUI'); 
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred during login');
  }
});

// Middleware để kiểm tra token trước khi vào trang admin
const authMiddleware = function verifyToken(req, res, next) {
  const token = req.cookies.token; // Get token from cookie
  if (!token) {
    return res.redirect('/login'); 
  }
  try {
    // decode token
    const decoded = jwt.verify(token, 'yourSecretKey'); 
    // Save userId from token to request to use other route 
    req.userId = decoded.userId; 
    next(); 
  } catch (error) {
    return res.status(403).send('Invalid or expired token');
  }
}

// Route trang admin - just redirect if login success
routes.get('/adminUI', authMiddleware, async (req, res) => {
   const data = await User.find();
  res.render('adminUI', {data, layout: "adminUI"}); 
});

routes.get("/Admin/editBlog/:id", authMiddleware, async (req, res) => {
  try {
    const data = await Post.findOne({ _id: req.params.id });
    
    if (data) {
      const date = data.date;
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      res.render("editPost", { layout: "Admin/editBlog", data, formattedDate });
    } else {
      res.status(404).send('Data not found');
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

routes.put('/adminUI/edit/:id', authMiddleware, async(req, res) => {
  try {
    const { title, category, img, body, date } = req.body;
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
        imgFooter
      },
      { new: true }
    ); 
        if (!updatedPost) {
          return res.status(404).send("Post not found");
        }
    res.redirect(`/Admin/editBlog/${req.params.id}`);
  } catch (error) {
    console.log(error)
     res.status(500).send("Server Error");
  }
})

routes.get("/adminUI/add",authMiddleware, (req, res) => {
  res.render("addBlog");
});

routes.post("/admin/add", authMiddleware,async (req, res) => {
  try {
    console.log(req.body)
    try {
      const newPost = new Post({
        title: req.body.title,
        category: req.body.category,
        img: req.body.img,
        body: req.body.body,
        data: req.body.date
      })
      await Post.create(newPost)
       res.redirect('/adminUI')
    } catch (error) {
      console.log(error);
    }
   
  } catch (error) {
    console.log(error);
  }

});

routes.get("/register", async (req, res) => {
  try {
    res.render("register", { layout: "login" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

routes.post("/register", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, username, password: hashedPassword });
    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'User already in use' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

routes.post("/admin/delete/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const result = await Post.findByIdAndRemove(postId);

    if (!result) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


routes.get('/change-password', (req, res) => {
  res.render('changePassword'); 
});

routes.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, renewpassword } = req.body;

    // check newPassword like renewpassword
    if (newPassword !== renewpassword) {
      return res.render('changePassword', {
        error: 'New password and confirm password do not match',
      });
    }

    const user = await User.findOne({ _id: req.user._id }); // Giả sử thông tin user được lưu trong session

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.render('changePassword', { error: 'Current password is incorrect' });
    }

    // hashcode new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update new password to db
    user.password = hashedPassword;
    await user.save();

    res.render('changePassword', { success: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.render('Admin/changePassword', { error: 'Internal server error' });
  }
});

//Edit profile
routes.get('/edit-profile', authMiddleware, async (req, res) => {
  try {
    // get user from session
    const user = await User.findOne({ _id: req.user._id }); 

    res.render('Admin/editProfile', { layout: 'users-profile', user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send('Internal server error');
  }
});

routes.post('/edit-profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, about, company, job, country, address, phone, email } = req.body;
    
    // get user from session
    const user = await User.findOne({ _id: req.user._id }); 

    // update profile
    user.fullName = fullName;
    user.about = about;
    user.company = company;
    user.job = job;
    user.country = country;
    user.address = address;
    user.phone = phone;
    user.email = email;

    await user.save();

    res.redirect('Admin/users-profile');
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).send('Internal server error');
  }
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
  