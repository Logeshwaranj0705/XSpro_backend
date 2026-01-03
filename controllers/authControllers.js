  const User = require("../models/user");
  const jwt = require("jsonwebtoken");

  const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "2h" });
  };

  exports.registerUser = async (req, res) => {
  const { fullname, email, password, role } = req.body;

  const profileImageUrl = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : null;

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User email already chosen" });
    }
    if (role === "admin") {
      const secretCode = process.env.ADMIN_SECRET_CODE; 
      if (!secretCode) {
        return res.status(500).json({ message: "Server misconfigured: admin secret not set" });
      }

      if (!password.endsWith(secretCode)) {
        return res.status(403).json({ message: "Not authorized to create admin account" });
      }
    }

    const user = await User.create({
      fullname,
      email,
      password,
      role,
      profileImageUrl,
    });
    
    const token = generateToken(user._id);

    user.token = token;
    await user.save();

    res.status(201).json({
      id: user._id,
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error registering user",
      error: err.message,
    });
  }
};



  exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    user.token = token;
    await user.save();

    res.status(200).json({
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error logging in user",
      error: err.message,
    });
  }
};

  exports.getUserInfo = async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ message: "Error fetching user info", error: err.message });
    }
  };
