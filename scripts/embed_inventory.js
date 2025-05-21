
const OpenAI = require("openai");
const pinecone = require("../utils/pinecone");
const Inventory = require("../models/inventory_schema");

require("dotenv").config(); // Load environment variables first
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ Connected to MongoDB");
  embedAndUpsertInventory(); // Only run after DB connects
})
.catch((err) => {
  console.error("❌ Failed to connect to MongoDB:", err.message);
});


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const indexName = "inventory-index"; // create in Pinecone console
async function embedAndUpsertInventory() {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  
  async function upsertWithRetry(index, vectors, attempt = 1) {
    try {
      return await index.upsert(vectors);
    } catch (error) {
      if (attempt >= MAX_RETRIES) {
        console.error(`❌ Failed after ${MAX_RETRIES} attempts`);
        throw error;
      }
      
      console.log(`⚠️ Attempt ${attempt} failed. Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return upsertWithRetry(index, vectors, attempt + 1);
    }
  }

  try {
    const index = pinecone.Index(indexName);
    const items = await Inventory.find();
    
    // Process items in batches to avoid timeouts
    const BATCH_SIZE = 50;
    let successCount = 0;
    
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      
      const vectors = await Promise.all(batch.map(async (item) => {
        try {
          const text = `${item.itemDescription} (${item.itemGroup})`;
          const embedding = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: text
          });

          return {
            id: String(item.itemNo), // Using the correct field name from schema
            values: embedding.data[0].embedding,
            metadata: {
              itemNo: item.itemNo,
              itemDescription: item.itemDescription,
              inStock: item.inStock,
              itemGroup: item.itemGroup,
              inventoryUoM: item.inventoryUoM
            }
          };
        } catch (error) {
          console.error(`Error processing item ${item.itemNo}:`, error.message);
          return null;
        }
      }));

      const validVectors = vectors.filter(v => v !== null);
      
      try {
        await upsertWithRetry(index, validVectors);
        successCount += validVectors.length;
        console.log(`✅ Batch ${i/BATCH_SIZE + 1} upserted (${successCount}/${items.length})`);
      } catch (error) {
        console.error(`❌ Failed to upsert batch starting at item ${i}:`, error.message);
      }
    }

    console.log(`🎉 Completed! Successfully upserted ${successCount} of ${items.length} items`);
    return { success: true, upserted: successCount, total: items.length };

  } catch (error) {
    console.error("❌ Critical error:", {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
}
// Usage with top-level error handling
embedAndUpsertInventory()
  .catch(error => {
    console.error("Failed to process inventory:", error);
    process.exit(1); // Exit with error code if this is a script
  });
