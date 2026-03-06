<?php
// backend/app/Models/Inventory/InventoryTransaction.php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Store\Store;
use App\Models\Store\Branch;
use App\Models\ProductCatalog\Product;
use App\Models\ProductCatalog\ProductVariation;
use App\Models\Hr\Employee;

class InventoryTransaction extends Model
{
    protected $fillable = [
        'transaction_number',
        'store_id',
        'branch_id',
        'product_id',
        'variation_id',
        'transaction_type',
        'quantity_before',
        'quantity_change',
        'quantity_after',
        'related_branch_id',
        'reference_type',
        'reference_id',
        'notes',
        'unit_cost',
        'total_value',
        'created_by',
        'transaction_date',
    ];

    protected $casts = [
        'quantity_before' => 'integer',
        'quantity_change' => 'integer',
        'quantity_after' => 'integer',
        'unit_cost' => 'decimal:2',
        'total_value' => 'decimal:2',
        'transaction_date' => 'datetime',
    ];

    // Relationships
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class);
    }

    public function relatedBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'related_branch_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'created_by');
    }

    // Polymorphic reference (PO, Sale, Transfer, etc.)
    public function reference()
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }

    // Scopes
    public function scopeByType($query, string $type)
    {
        return $query->where('transaction_type', $type);
    }

    public function scopeByDateRange($query, $start, $end)
    {
        return $query->whereBetween('transaction_date', [$start, $end]);
    }

    public function scopePurchases($query)
    {
        return $query->where('transaction_type', 'purchase');
    }

    public function scopeSales($query)
    {
        return $query->where('transaction_type', 'sale');
    }

    public function scopeTransfers($query)
    {
        return $query->whereIn('transaction_type', ['transfer_in', 'transfer_out']);
    }
}