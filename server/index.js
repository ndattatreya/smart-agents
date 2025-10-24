import express from "express";
import cors from "cors";
import 'dotenv/config';
import session from "express-session";
import passport from "./config/passport.js"; // <-- Google OAuth config
import connectDB from "./config/db.js";

// Routes
import sessionsRoutes from "./routes/sessions.js";
import sandboxRoutes from "./routes/sandboxRoutes.js";
import authRoutes from "./routes/auth.js";
import googleAuthRoutes from "./routes/googleAuth.js"; // <-- New Google OAuth routes


const app = express();

// ========================
// 1. CONNECT DATABASE
// ========================
connectDB();

// ========================
// 2. MIDDLEWARE
// ========================

const allowedOrigins = [
  "http://localhost:5173",              // local dev
  "https://smart-agents.vercel.app",    // your deployed frontend
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,                  // allow cookies
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,        // ✅ Required for HTTPS (Vercel uses HTTPS)
      sameSite: "none",    // ✅ Allows cookies from cross-origin (frontend)
      httpOnly: true,      // ✅ Prevents JS access to cookies
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express session (required for Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logger (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ========================
// 3. ROUTES
// ========================
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/sandbox", sandboxRoutes);
app.use("/auth", googleAuthRoutes); // <-- Google OAuth endpoints

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ Nava AI API Server is running",
    version: "1.0.0",
  });
});

// ========================
// 4. ERROR HANDLING
// ========================
// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ========================
// 5. START SERVER
// ========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔗 Client: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}\n`);
});
