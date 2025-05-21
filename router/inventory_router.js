const express = require("express");
const router = express.Router();
const inventoryService = require("../service/inventory_service");


router.post("/recommendations", async (req, res) => {
  try {
    const { clientInfo, requestText } = req.body;

    if (!clientInfo || !requestText) {
      return res.status(400).json({
        error: "clientInfo and requestText are required"
      });
    }

    const recommendations = await inventoryService.getRecommendedInventoryItems(
      clientInfo, 
      requestText
    );

    res.status(200).json(recommendations); // Directly return the array

  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({
      error: error.message
    });
  }
});


// Route to create a new inventory item
router.post("/create_one", async (req, res) => {
  try {
    const newItem = await inventoryService.createInventoryItem(req.body);
    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: newItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating inventory item",
      error: error.message
    });
  }
});
// Route to import inventory items from JSON file
router.post("/import", async (req, res) => {
    try {
      const createdItems = await inventoryService.importInventoryFromFile();
      res.status(201).json({
        success: true,
        message: "Inventory items imported successfully",
        data: createdItems,
        count: createdItems.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Error importing inventory items",
        error: error.message
      });
    }
  });

// Route to get all inventory items
router.get("/getall_inventory", async (req, res) => {
  try {
    const items = await inventoryService.getAllInventoryItems();
    res.status(200).json({
      success: true,
      message: "Inventory items retrieved successfully",
      data: items,
      count: items.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving inventory items",
      error: error.message
    });
  }
});

// Route to get inventory item by itemNo
router.get("/item/:itemNo", async (req, res) => {
  try {
    const item = await inventoryService.getInventoryItemByItemNo(req.params.itemNo);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Inventory item retrieved successfully",
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving inventory item",
      error: error.message
    });
  }
});

// Route to get inventory items by group
router.get("/group/:itemGroup", async (req, res) => {
  try {
    const items = await inventoryService.getInventoryItemsByGroup(req.params.itemGroup);
    res.status(200).json({
      success: true,
      message: "Inventory items retrieved successfully",
      data: items,
      count: items.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving inventory items",
      error: error.message
    });
  }
});

// Route to update inventory item
router.put("/:itemNo", async (req, res) => {
  try {
    const updatedItem = await inventoryService.updateInventoryItem(
      req.params.itemNo,
      req.body
    );
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: updatedItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating inventory item",
      error: error.message
    });
  }
});

// Route to update inventory stock
router.patch("/:itemNo/stock", async (req, res) => {
  try {
    const { quantityChange } = req.body;
    const updatedItem = await inventoryService.updateInventoryStock(
      req.params.itemNo,
      quantityChange
    );
    res.status(200).json({
      success: true,
      message: "Inventory stock updated successfully",
      data: updatedItem
    });
  } catch (error) {
    if (error.message === "Insufficient stock available") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(400).json({
      success: false,
      message: "Error updating inventory stock",
      error: error.message
    });
  }
});

// Route to delete inventory item
router.delete("/:itemNo", async (req, res) => {
  try {
    const deletedItem = await inventoryService.deleteInventoryItem(req.params.itemNo);
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting inventory item",
      error: error.message
    });
  }
});

// Route to get low stock items
router.get("/low-stock", async (req, res) => {
  try {
    const threshold = req.query.threshold || 5;
    const lowStockItems = await inventoryService.getLowStockItems(Number(threshold));
    res.status(200).json({
      success: true,
      message: "Low stock items retrieved successfully",
      data: lowStockItems,
      count: lowStockItems.length,
      threshold: threshold
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving low stock items",
      error: error.message
    });
  }
});

module.exports = router;