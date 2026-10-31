export const config = {
    api: {
      bodyParser: false,
    },
  };
  
  export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    try {
      const response = await fetch("http://148.113.17.68:5050/predict", {
        method: "POST",
        headers: {
          "Content-Type": req.headers["content-type"],
        },
        body: req,
        duplex: "half",
      });
  
      const data = await response.json();
  
      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to connect to DentalSense API",
        details: error.message,
      });
    }
  }