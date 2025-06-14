import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

const app = express();

if (process.env.VERCEL_ENV !== "production") {
  dotenv.config({
    path: ".env",
  });
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/api/apod", async (req, res) => {
  const { date, isRandom } = req.query;

  let nasaURL = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`;

  if (isRandom === "true") {
    nasaURL += `&count=1`;
  } else if (date) {
    nasaURL += `&date=${date}`;
  }

  try {
    const response = await fetch(nasaURL);
    const data = await response.json();

    if (isRandom === "true") {
      res.status(200).json(data[0]);
    } else {
      res.status(200).json(data);
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch data from NASA" });
  }
});

app.get("/api/mars-rover", async (req, res) => {
  const { rover, date } = req.query;

  let nasaURL = `https://api.nasa.gov/mars-photos/api/v1/rovers/${
    rover || "curiosity"
  }/photos?api_key=${process.env.NASA_API_KEY}`;

  if (date) nasaURL += `&earth_date=${date}`;

  try {
    const response = await fetch(nasaURL);
    let data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data.error?.message || data.msg || "Unknown error from NASA API";

      if (
        response.status === 404 &&
        data.errors &&
        data.errors[0]?.startsWith("No photos found for")
      ) {
        return res.status(404).json({
          message: `No Mars rover photos found for the selected date and rover. Please try a different date or rover.`,
        });
      }

      return res.status(response.status).json({
        message: `NASA API error: ${errorMsg}`,
      });
    }

    if (data.photos.length > 24) {
      data = data.photos.slice(0, 24);
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      message: "Internal server error, Please try again later.",
    });
  }
});

app.listen(process.env.PORT || 8000, () =>
  console.log("Server running on http://localhost:8000")
);

export default app;
