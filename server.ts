import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { 
  analyzeRouteHandler, 
  addressLookupHandler, 
  reverseGeocodeHandler 
} from "./src/server/corridorService";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") 
  });
});

// REST endpoints
app.get("/api/address-lookup", addressLookupHandler);
app.get("/api/reverse-geocode", reverseGeocodeHandler);
app.post("/api/analyze-route", analyzeRouteHandler);

// Setup Vite Dev server or Serve static files
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Toyota Tesla Charger Finder Backend running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
