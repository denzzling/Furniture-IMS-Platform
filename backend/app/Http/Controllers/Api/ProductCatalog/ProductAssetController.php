<?php

namespace App\Http\Controllers\Api\ProductCatalog;

use App\Models\ProductCatalog\Product;
use App\Models\ProductCatalog\ProductAsset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProductAssetController extends BaseController
{
    // ❌ REMOVE THESE LINES - They don't belong in controllers
    // protected $appends = ['url'];
    // public function getUrlAttribute() { ... }

    /**
     * Display a listing of all assets (for admin asset management).
     */
    public function index(Request $request)
    {
        try {
            $query = ProductAsset::byStore($this->getStoreId())
                                ->with('product:id,product_name,sku');

            // Filter by asset type
            if ($request->has('asset_type')) {
                $query->where('asset_type', $request->asset_type);
            }

            // Filter by product
            if ($request->has('product_id')) {
                $query->where('product_id', $request->product_id);
            }

            // Filter by primary status
            if ($request->has('is_primary')) {
                $query->where('is_primary', $request->boolean('is_primary'));
            }

            // Search
            if ($request->has('search')) {
                $query->where(function($q) use ($request) {
                    $q->where('file_name', 'like', '%' . $request->search . '%')
                      ->orWhere('alt_text', 'like', '%' . $request->search . '%')
                      ->orWhereHas('product', function($q2) use ($request) {
                          $q2->where('product_name', 'like', '%' . $request->search . '%')
                             ->orWhere('sku', 'like', '%' . $request->search . '%');
                      });
                });
            }

            // Sorting
            $sortField = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            $allowedSorts = ['file_name', 'asset_type', 'created_at', 'file_size_kb'];
            if (in_array($sortField, $allowedSorts)) {
                $query->orderBy($sortField, $sortOrder);
            }

            $assets = $query->paginate($request->get('per_page', 15));

            return $this->successResponse($assets, 'Assets retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Failed to retrieve assets', [
                'store_id' => $this->getStoreId(),
                'error' => $e->getMessage()
            ]);
            
            return $this->errorResponse(
                'Failed to retrieve assets',
                500,
                [],
                $e
            );
        }
    }

    /**
     * Store a newly uploaded asset.
     */
    public function store(Request $request)
    {
        try {
            $validated = $this->validateRequest($request, [
                'product_id' => 'required|exists:products,id',
                'asset_type' => 'required|in:3D_Model,3D_Thumbnail,Image_Main,Image_Gallery,Image_360,Video_Product,Video_Assembly,Manual_PDF,Texture_Map',
                'asset_file' => 'required|file|max:102400',
                'is_primary' => 'boolean',
                'model_format' => 'required_if:asset_type,3D_Model|in:glb,gltf,obj,fbx,usdz',
                'is_ar_compatible' => 'boolean',
                'default_camera_angle_x' => 'nullable|numeric',
                'default_camera_angle_y' => 'nullable|numeric',
                'default_zoom_level' => 'nullable|numeric',
                'alt_text' => 'nullable|string|max:255',
                'display_order' => 'integer'
            ]);

            $product = Product::byStore($this->getStoreId())->find($validated['product_id']);
            
            if (!$product) {
                return $this->errorResponse('Product not found or does not belong to this store', 404);
            }

            DB::beginTransaction();

            try {
                $file = $request->file('asset_file');
                $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
                
                // ✅ FIXED: Remove 'storage/' prefix
                $assetTypeFolder = strtolower(str_replace('_', '-', $validated['asset_type']));
                $path = "stores/{$this->getStoreId()}/products/{$product->id}/{$assetTypeFolder}/{$fileName}";
                
                // Store file
                Storage::disk('public')->put($path, file_get_contents($file));

                // If this is set as primary, unset other primaries of same type
                if (isset($validated['is_primary']) && $validated['is_primary']) {
                    ProductAsset::byStore($this->getStoreId())
                               ->where('product_id', $product->id)
                               ->where('asset_type', $validated['asset_type'])
                               ->update(['is_primary' => false]);
                }

                $asset = ProductAsset::create([
                    'store_id' => $this->getStoreId(),
                    'product_id' => $product->id,
                    'asset_type' => $validated['asset_type'],
                    'file_name' => $fileName,
                    'file_path' => $path, // ✅ Without 'storage/' prefix
                    'file_size_kb' => round($file->getSize() / 1024),
                    'mime_type' => $file->getMimeType(),
                    'model_format' => $validated['model_format'] ?? null,
                    'is_ar_compatible' => $validated['is_ar_compatible'] ?? false,
                    'is_primary' => $validated['is_primary'] ?? false,
                    'display_order' => $validated['display_order'] ?? 0,
                    'default_camera_angle_x' => $validated['default_camera_angle_x'] ?? null,
                    'default_camera_angle_y' => $validated['default_camera_angle_y'] ?? null,
                    'default_zoom_level' => $validated['default_zoom_level'] ?? null,
                    'alt_text' => $validated['alt_text'] ?? null
                ]);

                DB::commit();

                // ✅ The 'url' will be automatically appended by the model
                return $this->successResponse(
                    $asset,
                    'Asset uploaded successfully',
                    201
                );

            } catch (\Exception $e) {
                DB::rollBack();
                
                if (isset($path) && Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
                
                throw $e;
            }

        } catch (ValidationException $e) {
            return $this->errorResponse(
                'Validation error',
                422,
                $e->errors()
            );
        } catch (\Exception $e) {
            Log::error('Failed to upload asset', [
                'store_id' => $this->getStoreId(),
                'user_id' => $this->getUserId(),
                'data' => $request->except('asset_file'),
                'error' => $e->getMessage()
            ]);
            
            return $this->errorResponse(
                'Failed to upload asset: ' . $e->getMessage(),
                500,
                [],
                $e
            );
        }
    }

    // ... rest of your methods remain the same
    
    /**
     * Get assets for a product.
     */
    public function getByProduct($productId)
    {
        try {
            $product = Product::byStore($this->getStoreId())->find($productId);
            
            if (!$product) {
                return $this->errorResponse('Product not found or does not belong to this store', 404);
            }

            $assets = ProductAsset::byStore($this->getStoreId())
                                 ->where('product_id', $productId)
                                 ->orderBy('asset_type')
                                 ->orderBy('display_order')
                                 ->orderBy('is_primary', 'desc')
                                 ->get();

            // ✅ URL will be automatically included via $appends
            $grouped = $assets->groupBy('asset_type');

            return $this->successResponse([
                'product_id' => (int) $productId,
                'total_assets' => $assets->count(),
                'assets_by_type' => $grouped,
                'all_assets' => $assets
            ], 'Assets retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Failed to retrieve assets', [
                'store_id' => $this->getStoreId(),
                'product_id' => $productId,
                'error' => $e->getMessage()
            ]);
            
            return $this->errorResponse(
                'Failed to retrieve assets: ' . $e->getMessage(),
                500,
                [],
                $e
            );
        }
    }
    /**
     * Display the specified asset.
     */
    public function show($id)
    {
        try {
            $asset = ProductAsset::byStore($this->getStoreId())
                                ->with('product:id,product_name,sku,category_id')
                                ->findOrFail($id);

            // Add file URL to response
            $assetData = $asset->toArray();
            $assetData['file_path'] = $asset->url;
            $assetData['thumbnail_url'] = $asset->thumbnail_url;

            return $this->successResponse($assetData, 'Asset retrieved successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->errorResponse('Asset not found', 404);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve asset', [
                'store_id' => $this->getStoreId(),
                'asset_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return $this->errorResponse(
                'Failed to retrieve asset',
                500,
                [],
                $e
            );
        }
    }

    /**
     * Update asset details.
     */
    public function update(Request $request, $id)
    {
        try {
            $asset = ProductAsset::byStore($this->getStoreId())->findOrFail($id);

            $validated = $this->validateRequest($request, [
                'is_primary' => 'boolean',
                'display_order' => 'integer',
                'default_camera_angle_x' => 'nullable|numeric',
                'default_camera_angle_y' => 'nullable|numeric',
                'default_zoom_level' => 'nullable|numeric',
                'alt_text' => 'nullable|string|max:255',
                'caption' => 'nullable|string'
            ]);

            DB::beginTransaction();

            try {
                // If setting as primary, unset other primaries
                if (isset($validated['is_primary']) && $validated['is_primary'] && !$asset->is_primary) {
                    ProductAsset::byStore($this->getStoreId())
                               ->where('product_id', $asset->product_id)
                               ->where('asset_type', $asset->asset_type)
                               ->where('id', '!=', $asset->id)
                               ->update(['is_primary' => false]);
                }

                $asset->update($validated);

                DB::commit();

                return $this->successResponse($asset, 'Asset updated successfully');

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (ValidationException $e) {
            return $this->errorResponse(
                'Validation error',
                422,
                $e->errors()
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->errorResponse('Asset not found', 404);
        } catch (\Exception $e) {
            Log::error('Failed to update asset', [
                'store_id' => $this->getStoreId(),
                'asset_id' => $id,
                'user_id' => $this->getUserId(),
                'data' => $request->all(),
                'error' => $e->getMessage()
            ]);
            
            return $this->errorResponse(
                'Failed to update asset: ' . $e->getMessage(),
                500,
                [],
                $e
            );
        }
    }

    /**
     * Remove the specified asset.
     */
    public function destroy($id)
    {
        try {
            $asset = ProductAsset::byStore($this->getStoreId())->findOrFail($id);

            DB::beginTransaction();

            try {
                // Delete file from storage
                if (Storage::disk('public')->exists($asset->file_path)) {
                    Storage::disk('public')->delete($asset->file_path);
                    
                    // Try to delete empty directory
                    $directory = dirname($asset->file_path);
                    if (Storage::disk('public')->files($directory) === []) {
                        Storage::disk('public')->deleteDirectory($directory);
                    }
                }

                $asset->delete();

                DB::commit();

                return $this->successResponse(null, 'Asset deleted successfully');

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->errorResponse('Asset not found', 404);
        } catch (\Exception $e) {
            Log::error('Failed to delete asset', [
                'store_id' => $this->getStoreId(),
                'asset_id' => $id,
                'user_id' => $this->getUserId(),
                'error' => $e->getMessage()
            ]);
            
            return $this->errorResponse(
                'Failed to delete asset: ' . $e->getMessage(),
                500,
                [],
                $e
            );
        }
    }

    /**
     * Reorder assets.
     */
    public function reorder(Request $request)
    {
        try {
            $validated = $this->validateRequest($request, [
                'product_id' => 'required|exists:products,id',
                'assets' => 'required|array',
                'assets.*.id' => 'required|exists:product_assets,id',
                'assets.*.display_order' => 'required|integer|min:0'
            ]);

            // Verify product belongs to store
            $product = Product::byStore($this->getStoreId())->find($validated['product_id']);
            
            if (!$product) {
                return $this->errorResponse('Product not found or does not belong to this store', 404);
            }

            DB::beginTransaction();

            try {
                foreach ($validated['assets'] as $item) {
                    $asset = ProductAsset::byStore($this->getStoreId())
                                        ->where('product_id', $validated['product_id'])
                                        ->find($item['id']);
                    
                    if ($asset) {
                        $asset->update(['display_order' => $item['display_order']]);
                    }
                }

                DB::commit();

                return $this->successResponse(null, 'Assets reordered successfully');

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (ValidationException $e) {
            return $this->errorResponse(
                'Validation error',
                422,
                $e->errors()
            );
        } catch (\Exception $e) {
            Log::error('Failed to reorder assets', [
                'store_id' => $this->getStoreId(),
                'user_id' => $this->getUserId(),
                'data' => $request->all(),
                'error' => $e->getMessage()
            ]);
            
            return $this->errorResponse(
                'Failed to reorder assets: ' . $e->getMessage(),
                500,
                [],
                $e
            );
        }
    }

    /**
     * Get assets for a product.
     */
    // public function getByProduct($productId)
    // {
    //     try {
    //         // Verify product belongs to store
    //         $product = Product::byStore($this->getStoreId())->find($productId);
            
    //         if (!$product) {
    //             return $this->errorResponse('Product not found or does not belong to this store', 404);
    //         }

    //         $assets = ProductAsset::byStore($this->getStoreId())
    //                              ->where('product_id', $productId)
    //                              ->orderBy('asset_type')
    //                              ->orderBy('display_order')
    //                              ->orderBy('is_primary', 'desc')
    //                              ->get();

    //         // Group by asset type
    //         $grouped = $assets->groupBy('asset_type')->map(function($items) {
    //             return $items->map(function($item) {
    //                 return [
    //                     'id' => $item->id,
    //                     'type' => $item->asset_type,
    //                     'url' => $item->url,
    //                     'thumbnail' => $item->thumbnail_url,
    //                     'is_primary' => $item->is_primary,
    //                     'display_order' => $item->display_order,
    //                     'model_format' => $item->model_format,
    //                     'ar_compatible' => $item->is_ar_compatible,
    //                     'alt_text' => $item->alt_text,
    //                     'camera_settings' => $item->camera_settings,
    //                     'created_at' => $item->created_at
    //                 ];
    //             });
    //         });

    //         return $this->successResponse([
    //             'product_id' => (int) $productId,
    //             'total_assets' => $assets->count(),
    //             'assets_by_type' => $grouped,
    //             'all_assets' => $assets
    //         ], 'Assets retrieved successfully');

    //     } catch (\Exception $e) {
    //         Log::error('Failed to retrieve assets', [
    //             'store_id' => $this->getStoreId(),
    //             'product_id' => $productId,
    //             'error' => $e->getMessage()
    //         ]);
            
    //         return $this->errorResponse(
    //             'Failed to retrieve assets: ' . $e->getMessage(),
    //             500,
    //             [],
    //             $e
    //         );
    //     }
    // }
}