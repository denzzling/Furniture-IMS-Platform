<?php
// backend/app/Http/Controllers/Inventory/BranchInventoryController.php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\BranchInventory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BranchInventoryController extends Controller
{
    /**
     * Display inventory for a specific branch
     * GET /api/inventory/branch/{branchId}
     */
    public function index(Request $request, int $branchId): JsonResponse
    {
        $query = BranchInventory::with(['product', 'variation', 'branch'])
            ->where('branch_id', $branchId);

        // Filters
        if ($request->has('stock_status')) {
            $query->where('stock_status', $request->stock_status);
        }

        if ($request->has('low_stock')) {
            $query->lowStock();
        }

        if ($request->has('out_of_stock')) {
            $query->outOfStock();
        }

        if ($request->has('warehouse_section')) {
            $query->where('warehouse_section', $request->warehouse_section);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('product_name', 'LIKE', "%{$search}%")
                  ->orWhere('sku', 'LIKE', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $inventory = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $inventory,
        ]);
    }

    /**
     * Display a specific inventory item
     * GET /api/inventory/{id}
     */
    public function show(int $id): JsonResponse
    {
        $inventory = BranchInventory::with([
            'product',
            'variation',
            'branch',
            'store',
            'lastCountedBy'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $inventory,
        ]);
    }

    /**
     * Create new inventory record
     * POST /api/inventory
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'product_id' => 'required|exists:products,id',
            'variation_id' => 'nullable|exists:product_variations,id',
            'warehouse_section' => 'nullable|string|max:50',
            'aisle' => 'nullable|string|max:50',
            'rack' => 'nullable|string|max:50',
            'shelf' => 'nullable|string|max:50',
            'bin_code' => 'nullable|string|max:100',
            'reorder_point' => 'required|integer|min:0',
            'reorder_quantity' => 'required|integer|min:1',
            'maximum_stock' => 'nullable|integer|min:0',
            'safety_stock' => 'required|integer|min:0',
        ]);

        $validated['store_id'] = auth()->user()->store_id;
        $validated['quantity_on_hand'] = 0;
        $validated['quantity_available'] = 0;
        $validated['stock_status'] = 'out_of_stock';

        $inventory = BranchInventory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Inventory record created successfully',
            'data' => $inventory->load(['product', 'variation']),
        ], 201);
    }

    /**
     * Update inventory settings (not quantities)
     * PUT /api/inventory/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $inventory = BranchInventory::findOrFail($id);

        $validated = $request->validate([
            'warehouse_section' => 'nullable|string|max:50',
            'aisle' => 'nullable|string|max:50',
            'rack' => 'nullable|string|max:50',
            'shelf' => 'nullable|string|max:50',
            'bin_code' => 'nullable|string|max:100',
            'reorder_point' => 'nullable|integer|min:0',
            'reorder_quantity' => 'nullable|integer|min:1',
            'maximum_stock' => 'nullable|integer|min:0',
            'safety_stock' => 'nullable|integer|min:0',
        ]);

        $inventory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Inventory settings updated successfully',
            'data' => $inventory->load(['product', 'variation']),
        ]);
    }

    /**
     * Delete inventory record
     * DELETE /api/inventory/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $inventory = BranchInventory::findOrFail($id);

        if ($inventory->quantity_on_hand > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete inventory with existing stock',
            ], 422);
        }

        $inventory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Inventory record deleted successfully',
        ]);
    }

    /**
     * Get inventory summary for dashboard
     * GET /api/inventory/branch/{branchId}/summary
     */
    public function summary(int $branchId): JsonResponse
    {
        $summary = [
            'total_items' => BranchInventory::where('branch_id', $branchId)->count(),
            'in_stock' => BranchInventory::where('branch_id', $branchId)->inStock()->count(),
            'low_stock' => BranchInventory::where('branch_id', $branchId)->lowStock()->count(),
            'out_of_stock' => BranchInventory::where('branch_id', $branchId)->outOfStock()->count(),
            'total_value' => BranchInventory::where('branch_id', $branchId)->sum('total_value'),
            'total_quantity' => BranchInventory::where('branch_id', $branchId)->sum('quantity_on_hand'),
        ];

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get low stock alerts
     * GET /api/inventory/branch/{branchId}/low-stock
     */
    public function lowStock(int $branchId): JsonResponse
    {
        $lowStock = BranchInventory::with(['product', 'variation'])
            ->where('branch_id', $branchId)
            ->lowStock()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $lowStock,
        ]);
    }

    /**
     * Update stock status manually
     * POST /api/inventory/{id}/update-status
     */
    public function updateStatus(int $id): JsonResponse
    {
        $inventory = BranchInventory::findOrFail($id);
        $inventory->updateStockStatus();

        return response()->json([
            'success' => true,
            'message' => 'Stock status updated successfully',
            'data' => $inventory,
        ]);
    }
}