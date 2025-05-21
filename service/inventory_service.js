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
1. If the exact item exists, include it first with note: "We have this in stock."
2. If not, suggest up to 3–5 similar items with note: "Similar to your request."
3. Output only a max of 10 items in JSON array format with fields:
   - itemNo, itemDescription, inStock, itemGroup, inventoryUoM, note
`;

    let gptResponse;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      gptResponse = completion.choices[0]?.message.content.trim();;

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


// const getRecommendedInventoryItemsTwo = async (clientInfo, requestText) => {
//   try {
//     const { name, clientId, company } = clientInfo;

//     const inventoryItems = await Inventory.find()
//       .sort({ _id: -1 }) // Get newest items first
//       .limit(515); // Take the last 515 items (from the end)
//     const prompt = `
// You are an AI assistant that helps a steel warehouse recommend inventory items based on a customer's WhatsApp message.

// Your job is to:
// 1. Understand what the customer is looking for, based on their request.
// 2. Look through the available inventory (in stock only).
// 3. If the exact item exists, include it first and say: "We have this in stock."
// 4. If the exact item is not found, suggest up to 3–5 similar items and say: "We don't have the exact item, but here are some close alternatives."
// 5. If both exact and similar items exist, show both — exact matches first.
// 6. Only consider items with a valid, non-empty "inStock" value.
// 7. Use itemDescription as the main basis for matching, considering size, material, type, and application.

// Customer Info:
// - Name: ${name}
// - ID: ${clientId}
// - Company: ${company}

// Customer's Request:
// "${requestText}"

// Inventory items available (in stock only):
// ${JSON.stringify(inventoryItems)}

// Your output should be a JSON array with up to 10 objects. Each object should have:
// - itemNo
// - itemDescription
// - inStock
// - itemGroup
// - inventoryUoM
// - note: either "We have this in stock." or "Similar to your request."

// Example format:
// [
//   {
//     "itemNo": 1001,
//     "itemDescription": "10000x2000x10mm Plate",
//     "inStock": 4,
//     "itemGroup": "Plates",
//     "inventoryUoM": "Ea",
//     "note": "We have this in stock."
//   },
//   {
//     "itemNo": 1009,
//     "itemDescription": "Aluminium Chequer Plate 2500x1250x1.5mm",
//     "inStock": 47,
//     "itemGroup": "Plates",
//     "inventoryUoM": "Ea",
//     "note": "Similar to your request."
//   }
// ]

// Do NOT output the full inventory list. Only return relevant items that match the user's intent.
// `;

//     const response = await openai.chat.completions.create({
//       model: "gpt-4.1",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.3, // Optional: more deterministic response
//     });

//     const rawMessage = response.choices[0].message.content.trim();
//     // Attempt to extract JSON from response
//     const jsonMatch = rawMessage.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
//     const cleanJson = jsonMatch ? jsonMatch[1] : rawMessage;

//     let parsed;
//     try {
//       parsed = JSON.parse(cleanJson);
//     } catch (err) {
//       console.warn("⚠️ Failed to parse JSON, returning raw content.");
//       return { airesponse: rawMessage }; // Return raw content if JSON parsing fails
//     }

//     return { airesponse: parsed };
//   } catch (error) {
//     throw new Error(`Failed to get recommendations: ${error.message}`);
//   }
// };

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
