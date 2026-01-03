const User = require("../models/user");

exports.getAllUsersForAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find(
      { role: "user" },
      { _id: 1, fullname: 1 }
    ).sort({ fullname: 1 });

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
