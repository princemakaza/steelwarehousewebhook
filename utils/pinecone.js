require("dotenv").config(); // <-- ensure this is first

const { Pinecone } = require("@pinecone-database/pinecone");

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set in environment variables");
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  fetchApi: require("node-fetch"), // Explicit fetch implementation
  additionalHeaders: {
    Connection: "keep-alive",
  },
});

// Test connection
(async () => {
  try {
    await pinecone.listIndexes();
    console.log("✅ Pinecone connection successful");
  } catch (error) {
    console.error("❌ Pinecone connection failed:", error.message);
    console.log("Check your API key at https://app.pinecone.io");
  }
})();

module.exports = pinecone;
