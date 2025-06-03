const Inventory = require("../models/inventory_schema");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const pinecone = require("../utils/pinecone");

// Service to create new inventory item
const createInventoryItem = async (inventoryData) => {
  try {
    // Create and save new inventory item (no duplicate check)
    const newInventoryItem = new Inventory(inventoryData);
    await newInventoryItem.save();
    return newInventoryItem;
  } catch (error) {
    throw new Error(error.message);
    x;
  }
};

// Service to create multiple inventory items from JSON file
const createManyInventoryItems = async () => {
  try {
    // Read and parse the JSON file
    const filePath = path.join(__dirname, "inventory.json");
    const jsonData = fs.readFileSync(filePath, "utf8");
    const itemsArray = JSON.parse(jsonData);

    // Transform data to match schema
    const transformedItems = itemsArray.map((item) => ({
      itemNo: item["Item No."],
      itemDescription: item["Item Description"],
      inStock: item["In Stock"] === "" ? 0 : Number(item["In Stock"]),
      itemGroup: item["Item Group"],
      inventoryUoM: item["Inventory UoM"],
    }));

    // Insert all items
    const createdItems = await Inventory.insertMany(transformedItems);
    return createdItems;
  } catch (error) {
    throw new Error(`Failed to create inventory items: ${error.message}`);
  }
};

const importInventoryFromFile = async () => {
  try {
    // Read and parse the JSON file
    const filePath = path.join(__dirname, "inventory.json");
    const jsonData = fs.readFileSync(filePath, "utf8");
    const itemsArray = JSON.parse(jsonData);

    // Transform data to match schema
    const transformedItems = itemsArray.map((item) => ({
      itemNo: item["Item No."],
      itemDescription: item["Item Description"],
      inStock: item["In Stock"] === "" ? "0" : String(item["In Stock"]), // Convert to string
      itemGroup: item["Item Group"],
      inventoryUoM: item["Inventory UoM"],
    }));

    const createdItems = await Inventory.insertMany(transformedItems);
    return createdItems;
  } catch (error) {
    throw new Error(`Failed to import inventory items: ${error.message}`);
  }
};

// Service to get all inventory items
const getAllInventoryItems = async () => {
  try {
    return await Inventory.find();
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to get inventory item by itemNo
const getInventoryItemByItemNo = async (itemNo) => {
  try {
    return await Inventory.findOne({ itemNo });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to get inventory items by group
const getInventoryItemsByGroup = async (itemGroup) => {
  try {
    return await Inventory.find({ itemGroup });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to update inventory item
const updateInventoryItem = async (itemNo, updateData) => {
  try {
    const updatedItem = await Inventory.findOneAndUpdate(
      { itemNo },
      updateData,
      { new: true }
    );
    if (!updatedItem) {
      throw new Error("Inventory item not found");
    }
    return updatedItem;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to update inventory stock (specialized function for stock adjustments)
const updateInventoryStock = async (itemNo, quantityChange) => {
  try {
    const item = await Inventory.findOne({ itemNo });
    if (!item) {
      throw new Error("Inventory item not found");
    }

    const newStock = item.inStock + quantityChange;
    if (newStock < 0) {
      throw new Error("Insufficient stock available");
    }

    item.inStock = newStock;
    await item.save();
    return item;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to delete inventory item
const deleteInventoryItem = async (itemNo) => {
  try {
    const deletedItem = await Inventory.findOneAndDelete({ itemNo });
    if (!deletedItem) {
      throw new Error("Inventory item not found");
    }
    return deletedItem;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to get low stock items (below specified threshold)
const getLowStockItems = async (threshold = 5) => {
  try {
    return await Inventory.find({ inStock: { $lt: threshold } });
  } catch (error) {
    throw new Error(error.message);
  }
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const indexName = "inventory-index";

const getRecommendedInventoryItems = async (clientInfo, requestText) => {
  try {
    const { name, clientId, company } = clientInfo;
    const index = pinecone.Index(indexName);

    // Step 1: Embed the request text
    let queryEmbedding;
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: requestText,
      });
      queryEmbedding = embeddingResponse.data[0].embedding;
    } catch (embedErr) {
      console.error("❌ Error generating embedding:", embedErr.message);
      return {
        success: false,
        message: "Failed to generate query embedding",
        error: embedErr.message,
      };
    }

    // Step 2: Search Pinecone
    let result;
    try {
      result = await index.query({
        vector: queryEmbedding,
        topK: 10,
        includeMetadata: true,
        filter: { inStock: { $ne: "" } },
      });
    } catch (pineconeErr) {
      console.error("❌ Pinecone query failed:", pineconeErr.message);
      return {
        success: false,
        message: "Error querying inventory index",
        error: pineconeErr.message,
      };
    }

    if (!result.matches || result.matches.length === 0) {
      console.warn("⚠️ No matches found in Pinecone query.");
      return {
        success: false,
        message: "No relevant inventory items found",
        recommendations: [],
      };
    }
    console.log("🧠 Results", result);

    // Step 3: Format top matches
    const matchedItems = result.matches
      .filter((m) => m.metadata && m.metadata.itemNo)
      .map((m) => ({
        itemNo: m.metadata.itemNo,
        itemDescription: m.metadata.itemDescription || "",
        inStock: m.metadata.inStock || "",
        itemGroup: m.metadata.itemGroup || "",
        inventoryUoM: m.metadata.inventoryUoM || "",
        score: m.score,
      }));
    console.log("🧠 Match items", matchedItems);

    // Step 4: Prepare and send prompt to GPT
    const prompt = `
You are an AI assistant that helps a steel warehouse recommend inventory items based on a customer's WhatsApp message.

Customer Info:
- Name: ${name}
- ID: ${clientId}
- Company: ${company}

Customer's Request:
"${requestText}"

Available inventory items (in stock only):
${JSON.stringify(matchedItems)}

Rules:
1. ONLY include items that are available in stock (either exact matches or similar items)
2. For exact matches, include with note: "We have this in stock."
3. For similar items, include with note explaining the similarity: "Similar to your request (reason for similarity)."
4. NEVER include items that are not in stock
5. Output should be a JSON array with only available items containing these fields:
   - itemNo
   - itemDescription
   - inStock
   - itemGroup
   - inventoryUoM
   - note

Example Output Format:
[
  {
    "itemNo": "STL-101",
    "itemDescription": "Double V Standards 1.8m length",
    "inStock": "150",
    "itemGroup": "STANDARDS",
    "inventoryUoM": "EA",
    "note": "We have this in stock."
  },
  {
    "itemNo": "FNC-205",
    "itemDescription": "Field Fence 1.2m height",
    "inStock": "45",
    "itemGroup": "FENCING",
    "inventoryUoM": "RL",
    "note": "Similar to your request (1.5m height available)."
  }
]

Important:
- Do NOT include any items that aren't available
- Do NOT include the requestedItem field
- Only return items that exist in the Available inventory items list
- Format the inStock numbers without commas (e.g., "3819" instead of "3,819")
`;

    let gptResponse;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      gptResponse = completion.choices[0]?.message.content.trim();

      // Log raw AI response
      console.log("🧠 GPT Raw Response:\n", gptResponse);
    } catch (aiErr) {
      console.error("❌ GPT API call failed:", aiErr.message);
      return {
        success: false,
        message: "Failed to get GPT response",
        error: aiErr.message,
      };
    }

    // Step 5: Try to parse JSON from AI
    // response.choices[0].message.content.trim();
    try {
      const jsonMatch = gptResponse.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      const cleanJson = jsonMatch ? jsonMatch[1] : gptResponse;
      const parsed = JSON.parse(cleanJson);

      return {
        success: true,
        recommendations: parsed,
      };
    } catch (parseErr) {
      console.error("⚠️ Failed to parse AI response:", gptResponse.message);
      return {
        success: false,
        message: "Could not parse AI recommendation response.",
        error: parseErr.message,
        rawResponse: gptResponse,
      };
    }
  } catch (error) {
    console.error("❌ Unexpected error in recommendation logic:", error);
    return {
      success: false,
      message: "Unexpected error in recommendation system",
      error: error.message,
    };
  }
};

//   const prompt = `
// You are an AI assistant that helps a steel warehouse recommend inventory items based on a customer's WhatsApp message.

// Customer Info:
// - Name: ${name}
// - ID: ${clientId}
// - Company: ${company}

// Customer's Request:
// "${requestText}"

// Available inventory items (in stock only):
// ${JSON.stringify(matchedItems)}

// Rules:
// 1. If the exact item exists, include it first with note: "We have this in stock."
// 2. If not, suggest up to 3–5 similar items with note: "Similar to your request."
// 3. Output only a max of 10 items in JSON array format with fields:
//    - itemNo, itemDescription, inStock, itemGroup, inventoryUoM, note
// `;
module.exports = {
  createInventoryItem,
  createManyInventoryItems,
  getAllInventoryItems,
  getInventoryItemByItemNo,
  getInventoryItemsByGroup,
  updateInventoryItem,
  updateInventoryStock,
  deleteInventoryItem,
  getLowStockItems,
  importInventoryFromFile,
  getRecommendedInventoryItems,
};
