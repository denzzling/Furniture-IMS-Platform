<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductCatalog\CategoryController;
use App\Http\Controllers\Api\ProductCatalog\ProductController;
use App\Http\Controllers\Api\ProductCatalog\ProductAssetController;
use App\Http\Controllers\Api\ProductCatalog\TagController;
use App\Http\Controllers\Api\ProductCatalog\AttributeController;


// Product Catalog Routes
Route::prefix('product-catalog')->group(function () {

    // Categories
    Route::apiResource('categories', CategoryController::class);
    Route::get('categories/tree/all', [CategoryController::class, 'tree']);
    Route::post('categories/reorder', [CategoryController::class, 'reorder']);

    // Products
    Route::apiResource('products', ProductController::class);
    Route::get('products/{id}/3d-data', [ProductController::class, 'get3dData']);
    Route::post('products/bulk/status', [ProductController::class, 'bulkStatus']);

    // Product Assets (3D models, images, etc.)
    Route::prefix('assets')->group(function () {
        Route::post('/upload', [ProductAssetController::class, 'store']);
        Route::put('/{id}', [ProductAssetController::class, 'update']);
        Route::delete('/{id}', [ProductAssetController::class, 'destroy']);
        Route::post('/reorder', [ProductAssetController::class, 'reorder']);
    });

    // Attributes
    Route::apiResource('attributes', AttributeController::class);

    // Tags
    Route::apiResource('tags', TagController::class);
});


// Public routes (for 3D viewer, no auth required)
Route::prefix('public/product-catalog')->group(function () {
    Route::get('products/{id}/3d-view', [ProductController::class, 'get3dData']);
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{id}', [ProductController::class, 'show']);
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/tree', [CategoryController::class, 'tree']);
});
