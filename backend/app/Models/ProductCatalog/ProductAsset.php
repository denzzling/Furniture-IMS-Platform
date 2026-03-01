<?php
// app/Models/ProductCatalog/ProductAsset.php

namespace App\Models\ProductCatalog;

use App\Models\Store\Store;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductAsset extends Model
{
    use SoftDeletes;

    protected $table = 'product_assets';
    
    protected $fillable = [
        'store_id',
        'product_id',
        'asset_type',
        'file_name',
        'file_path',
        'file_size_kb',
        'mime_type',
        'model_format',
        'is_ar_compatible',
        'is_primary',
        'display_order',
        'default_camera_angle_x',
        'default_camera_angle_y',
        'default_zoom_level',
        'alt_text',
        'caption'
    ];

    protected $casts = [
        'is_ar_compatible' => 'boolean',
        'is_primary' => 'boolean',
        'display_order' => 'integer',
        'file_size_kb' => 'integer',
        'default_camera_angle_x' => 'float',
        'default_camera_angle_y' => 'float',
        'default_zoom_level' => 'float'
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variation()
    {
        return $this->hasOne(ProductVariation::class, 'custom_3d_model_id');
    }

    // Scopes
    public function scopeByStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('asset_type', $type);
    }

    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    public function scope3dModels($query)
    {
        return $query->where('asset_type', '3D_Model');
    }

    public function scopeArCompatible($query)
    {
        return $query->where('is_ar_compatible', true);
    }

    // Accessors
    public function getUrlAttribute()
    {
        return asset('storage/' . $this->file_path);
    }

    public function getThumbnailUrlAttribute()
    {
        if ($this->asset_type === '3D_Model') {
            // Try to find associated thumbnail
            $thumbnail = $this->product->assets()
                              ->where('asset_type', '3D_Thumbnail')
                              ->first();
            return $thumbnail ? $thumbnail->url : null;
        }
        
        return $this->url;
    }

    public function getCameraSettingsAttribute()
    {
        if ($this->default_camera_angle_x !== null) {
            return [
                'angle_x' => $this->default_camera_angle_x,
                'angle_y' => $this->default_camera_angle_y,
                'zoom' => $this->default_zoom_level
            ];
        }
        
        return null;
    }
}