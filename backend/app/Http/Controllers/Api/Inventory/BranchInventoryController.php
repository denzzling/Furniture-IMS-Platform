<?php
// backend/app/Http/Controllers/Inventory/BranchInventoryController.php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\BranchInventory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class BranchInventoryController extends Controller
{
    /**
     * Get the authenticated user's branch ID
     */
    private function getUserBranchId(): int
    {
        $branchId = auth()->user()->branch_id;
        
        if (!$branchId) {
            abort(403, 'User does not have an associated branch');
        }
        
        return $branchId;
    }

    /**
     * Display inventory for the authenticated user's branch
     * GET /api/inventory
     */
    public function index(Request $request): JsonResponse
    {
        $branchId = $this->getUserBranchId();
        
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
     * Display a specific inventory item (must belong to user's branch)
     * GET /api/inventory/{id}
     */
    public function show(int $id): JsonResponse
    {
        $branchId = $this->getUserBranchId();
        
        $inventory = BranchInventory::with([
            'product',
            'variation',
            'branch',
            'store',
            'lastCountedBy'
        ])
        ->where('branch_id', $branchId)
        ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $inventory,
        ]);
    }

    /**
     * Create new inventory record (automatically uses user's branch)
     * POST /api/inventory
     */
    public function store(Request $request): JsonResponse
    {
        $branchId = $this->getUserBranchId();
        
        $validated = $request->validate([
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

        // Add branch_id from authenticated user
        $validated['branch_id'] = $branchId;
        $validated['store_id'] = auth()->user()->store_id;
        $validated['quantity_on_hand'] = 0;
        $validated['quantity_available'] = 0;
        $validated['stock_status'] = 'out_of_stock';

        // Check if inventory record already exists for this product/variation in this branch
        $existingInventory = BranchInventory::where('branch_id', $branchId)
            ->where('product_id', $validated['product_id'])
            ->when(isset($validated['variation_id']), function ($query) use ($validated) {
                return $query->where('variation_id', $validated['variation_id']);
            }, function ($query) {
                return $query->whereNull('variation_id');
            })
            ->first();

        if ($existingInventory) {
            return response()->json([
                'success' => false,
                'message' => 'Inventory record already exists for this product in your branch',
            ], 422);
        }

        $inventory = BranchInventory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Inventory record created successfully',
            'data' => $inventory->load(['product', 'variation']),
        ], 201);
    }

    /**
     * Update inventory settings (must belong to user's branch)
     * PUT /api/inventory/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $branchId = $this->getUserBranchId();
        
        $inventory = BranchInventory::where('branch_id', $branchId)
            ->findOrFail($id);

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
     * Delete inventory record (must belong to user's branch)
     * DELETE /api/inventory/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $branchId = $this->getUserBranchId();
        
        $inventory = BranchInventory::where('branch_id', $branchId)
            ->findOrFail($id);

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
     * Get inventory summary for dashboard (automatically uses user's branch)
     * GET /api/inventory/summary
     */
    public function summary(): JsonResponse
    {
        $branchId = $this->getUserBranchId();
        
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
     * Get low stock alerts (automatically uses user's branch)
     * GET /api/inventory/low-stock
     */
    public function lowStock(): JsonResponse
    {
        $branchId = $this->getUserBranchId();
        
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
     * Update stock status manually (must belong to user's branch)
     * POST /api/inventory/{id}/update-status
     */
    public function updateStatus(int $id): JsonResponse
    {
        $branchId = $this->getUserBranchId();
        
        $inventory = BranchInventory::where('branch_id', $branchId)
            ->findOrFail($id);
            
        $inventory->updateStockStatus();

        return response()->json([
            'success' => true,
            'message' => 'Stock status updated successfully',
            'data' => $inventory,
        ]);
    }
}