// ============================================================
// index.js — AI Smart Complaint Management System
// Single-file MERN Backend (Express + MongoDB + OpenRouter AI)
// ============================================================

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const axios    = require("axios");

dotenv.config();

const app = express();

const OPENROUTER_API_KEY  = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// MONGOOSE SCHEMAS & MODELS
// ─────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: [true, "Name is required"], trim: true },
  email:    { type: String, required: [true, "Email is required"], unique: true,
              match: [/^\S+@\S+\.\S+$/, "Invalid email format"], lowercase: true },
  password: { type: String, required: [true, "Password is required"], minlength: 6 },
  role:     { type: String, enum: ["user", "admin"], default: "user" },
  createdAt:{ type: Date, default: Date.now },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", UserSchema);

const ComplaintSchema = new mongoose.Schema({
  name:        { type: String, required: [true, "Name is required"], trim: true },
  email:       { type: String, required: [true, "Email is required"],
                 match: [/^\S+@\S+\.\S+$/, "Invalid email format"], lowercase: true },
  title:       { type: String, required: [true, "Complaint title is required"], trim: true },
  description: { type: String, required: [true, "Description is required"] },
  category:    { type: String, required: [true, "Category is required"],
                 enum: ["Water Supply", "Electricity", "Garbage", "Roads", "Sanitation", "Other"] },
  location:    { type: String, required: [true, "Location is required"], trim: true },
  status:      { type: String, enum: ["Pending", "In Progress", "Resolved", "Rejected"],
                 default: "Pending" },
  aiPriority:   { type: String, default: "" },
  aiDepartment: { type: String, default: "" },
  aiSummary:    { type: String, default: "" },
  aiResponse:   { type: String, default: "" },
  createdAt:    { type: Date, default: Date.now },
});

const Complaint = mongoose.model("Complaint", ComplaintSchema);

// ─────────────────────────────────────────────
// JWT AUTH MIDDLEWARE
// ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
      req.user = await User.findById(decoded.id).select("-password");
      return next();
    } catch {
      return res.status(401).json({ error: "Unauthorized — invalid token" });
    }
  }
  return res.status(401).json({ error: "Access denied — no token provided" });
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "secret123", { expiresIn: "7d" });

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ message: "AI Complaint Management API is running 🚀" });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });
    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });
    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/profile", protect, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/complaints", async (req, res) => {
  try {
    const { name, email, title, description, category, location } = req.body;
    const complaint = await Complaint.create({ name, email, title, description, category, location });
    res.status(201).json({ message: "Complaint stored successfully", complaint });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/complaints", async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status)   filter.status   = status;
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json({ count: complaints.length, complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/complaints/search", async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) return res.status(400).json({ error: "location query param required" });
    const complaints = await Complaint.find({
      location: { $regex: location, $options: "i" },
    }).sort({ createdAt: -1 });
    res.json({ count: complaints.length, complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/complaints/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/complaints/:id", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.json({ message: "Status updated", complaint });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/complaints/:id", protect, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.json({ message: "Complaint removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// AI ROUTE — OpenRouter (GPT-4o-mini)
// ─────────────────────────────────────────────
app.post("/api/ai/analyze", async (req, res) => {
  try {
    let { complaintId, title, description, category } = req.body;
    let complaint = null;

    if (complaintId) {
      complaint = await Complaint.findById(complaintId);
      if (!complaint) return res.status(404).json({ error: "Complaint not found" });
      title       = complaint.title;
      description = complaint.description;
      category    = complaint.category;
    }

    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    // Log to verify key is loaded
    console.log("OpenRouter Key present:", !!OPENROUTER_API_KEY);

    const prompt = `You are an AI assistant for a municipal complaint management system.
Analyze the following complaint and return a JSON object with these exact keys:
- priority    : "Low" | "Medium" | "High" | "Critical"
- department  : name of the responsible government department
- summary     : 1-2 sentence summary of the complaint
- autoResponse: a polite, professional response message to send to the citizen

Complaint Details:
Title      : ${title}
Category   : ${category || "Not specified"}
Description: ${description}

Respond with ONLY valid JSON. No markdown, no extra text.`;

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Authorization":  `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type":   "application/json",
          "HTTP-Referer":   "https://ese-exam-z3t8.onrender.com",
          "X-Title":        "AI Complaint Management",
        },
      }
    );

    const rawText = response.data.choices[0].message.content;

    let aiResult;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      aiResult = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON", raw: rawText });
    }

    if (complaint) {
      complaint.aiPriority   = aiResult.priority    || "";
      complaint.aiDepartment = aiResult.department  || "";
      complaint.aiSummary    = aiResult.summary      || "";
      complaint.aiResponse   = aiResult.autoResponse || "";
      await complaint.save();
    }

    res.json({
      message:      "AI analysis complete",
      priority:     aiResult.priority,
      department:   aiResult.department,
      summary:      aiResult.summary,
      autoResponse: aiResult.autoResponse,
      ...(complaint && { updatedComplaint: complaint }),
    });
  } catch (err) {
    // Detailed error logging
    console.error("AI Route Error:", err.response?.data || err.message);
    res.status(500).json({
      error: err.message,
      details: err.response?.data || null,
    });
  }
});

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

// ─────────────────────────────────────────────
// MONGODB CONNECTION & SERVER START
// ─────────────────────────────────────────────
const PORT      = process.env.PORT      || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/complaint_db";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });