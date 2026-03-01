<?php
// app/Http/Controllers/Api/ProductCatalog/ProductAssetController.php

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
    /**
     * Store a newly uploaded asset.
     */
    public function store(Request $request)
    {
        try {
            $validated = $this->validateRequest($request, [
                'product_id' => 'required|exists:products,id',
                'asset_type' => 'required|in:3D_Model,3D_Thumbnail,Image_Main,Image_Gallery,Image_360,Video_Product,Video_Assembly,Manual_PDF,Texture_Map',
                'asset_file' => 'required|file|max:102400', // 100MB max
                'is_primary' => 'boolean',
                'model_format' => 'required_if:asset_type,3D_Model|in:glb,gltf,obj,fbx,usdz',
                'is_ar_compatible' => 'boolean',
                'default_camera_angle_x' => 'nullable|numeric',
                'default_camera_angle_y' => 'nullable|numeric',
                'default_zoom_level' => 'nullable|numeric',
                'alt_text' => 'nullable|string|max:255',
                'display_order' => 'integer'
            ]);

            // Check if product belongs to this store
            $product = Product::byStore($this->getStoreId())->find($validated['product_id']);
            
            if (!$product) {
                return $this->errorResponse('Product not found or does not belong to this store', 404);
            }

            DB::beginTransaction();

            try {
                $file = $request->file('asset_file');
                $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
                
                // Create directory structure: stores/{storeId}/products/{productId}/{assetType}
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
                    'file_path' => $path,
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

                return $this->successResponse(
                    $asset->makeHidden(['file_path']),
                    'Asset uploaded successfully',
                    201
                );

            } catch (\Exception $e) {
                DB::rollBack();
                
                // Delete uploaded file if database insert fails
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
    public function getByProduct($productId)
    {
        try {
            // Verify product belongs to store
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

            // Group by asset type
            $grouped = $assets->groupBy('asset_type')->map(function($items) {
                return $items->map(function($item) {
                    return [
                        'id' => $item->id,
                        'type' => $item->asset_type,
                        'url' => $item->url,
                        'thumbnail' => $item->thumbnail_url,
                        'is_primary' => $item->is_primary,
                        'display_order' => $item->display_order,
                        'model_format' => $item->model_format,
                        'ar_compatible' => $item->is_ar_compatible,
                        'alt_text' => $item->alt_text,
                        'camera_settings' => $item->camera_settings,
                        'created_at' => $item->created_at
                    ];
                });
            });

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
}