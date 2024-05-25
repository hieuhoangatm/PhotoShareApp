const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
const session = require("express-session"); // for handling session management
const multer = require("multer");
const { Mutex } = require("async-mutex");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter2");
const User = require("./db/userModel");
const authenticateToken = require("./Middleware/authenticateToken");

const corsOptions = {
  origin: true,
  credentials: true,
};

app.use(bodyParser.json());
dbConnect();
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 60 * 30, // In secs, Optional
    },
  }),
);

app.use("/admin/user", UserRouter);
app.use("/admin/photo", PhotoRouter);

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user) {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      req.session.userId = user.id; // Lưu user ID vào session
      res.send("Login successful");

      console.log("Đăng nhập thành công");
    } else {
      res.status(401).send("Invalid credentials");
      console.log("Sai mật khẩu");
    }
  } else {
    res.status(401).send("Invalid credentials");
    console.log("Sai tên đăng nhập");
  }
});

app.post("/admin/register", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      location,
      description,
      occupation,
      username,
      password,
    } = req.body;

    // Kiểm tra xem username đã tồn tại trong cơ sở dữ liệu chưa
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      // Nếu username đã tồn tại, trả về lỗi
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    // Tạo một bản ghi mới của User
    const newUser = new User({
      first_name,
      last_name,
      location,
      description,
      occupation,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    // Xử lý lỗi nếu có
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/home", (req, res) => {
  console.log(req.session);
  console.log("1");
  if (req.session.userId) {
    // User is authenticated
    res.send(`Welcome to the Home page, User ${req.session.userId}!`);
  } else {
    // User is not authenticated
    res.status(401).send("Unauthorized");
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
