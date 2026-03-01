<?php

namespace App\Models\Core;

use App\Models\ProductCatalog\Product;
use App\Models\Core\Role;
use App\Models\Hr\Employee;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Store\Store;
use App\Models\Store\Branch;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;

    protected $table = 'users';

    protected $fillable = [
        'fname',
        'lname',
        'email',
        'password',
        'role_id',
        'is_active',
        'phone_number',
        'otp_code',
        'otp_expires_at',
        'registered_by',
        'deleted_by',
        'store_id',
        'branch_id'
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'otp_code',
    ];

    protected $appends = ['full_name', 'role_name'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'otp_expires_at' => 'datetime',
            'deleted_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    // ✅ OTP Methods
    public function isValidOtp($otp): bool
    {
        if (!$this->otp_code || !$this->otp_expires_at) {
            return false;
        }

        if ($this->otp_code !== $otp) {
            return false;
        }

        if (now()->gt($this->otp_expires_at)) {
            return false;
        }

        return true;
    }

    public function clearOtp(): void
    {
        $this->update([
            'otp_code' => null,
            'otp_expires_at' => null,
        ]);
    }

    public function generateOtp(): string
    {
        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

        $this->update([
            'otp_code' => $otp,
            'otp_expires_at' => now()->addMinutes(15),
        ]);

        return $otp;
    }

    // ✅ Relationships
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function store()
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    public function createdProducts()
    {
        return $this->hasMany(Product::class, 'created_by');
    }

    public function employee()
    {
        return $this->hasOne(Employee::class, 'user_id');
    }

    // ✅ Fixed: Role Check Methods
    public function isSuperAdmin(): bool
    {
        // Method 1: Check role name directly
        if ($this->relationLoaded('role') && $this->role) {
            return $this->role->name === 'super_admin';
        }

        // Method 2: Check using role_id (assuming super_admin has ID = 1)
        return $this->role_id === 1;

        // Method 3: Use hasRole() method
        // return $this->hasRole('super_admin');
    }

    public function isStoreAdmin(): bool
    {
        // Method 1: Check role name directly
        if ($this->relationLoaded('role') && $this->role) {
            return $this->role->name === 'store_admin';
        }

        // Method 2: Check using role_id (assuming store_admin has ID = 2)
        return $this->role_id === 2;

        // Method 3: Use hasRole() method
        // return $this->hasRole('store_admin');
    }

    public function isEmployee(): bool
    {
        // Check if user has an employee record
        return $this->employee()->exists();
    }

    // ✅ Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole($query, $roleId)
    {
        return $query->where('role_id', $roleId);
    }

    public function scopeByRoleName($query, $roleName)
    {
        return $query->whereHas('role', function ($q) use ($roleName) {
            $q->where('name', $roleName);
        });
    }

    public function scopeInBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeInStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeSuperAdmins($query)
    {
        return $query->whereHas('role', function ($q) {
            $q->where('name', 'super_admin');
        });
    }

    public function scopeStoreAdmins($query)
    {
        return $query->whereHas('role', function ($q) {
            $q->where('name', 'store_admin');
        });
    }

    // ✅ Accessors (Computed Properties)
    public function getFullNameAttribute()
    {
        return trim("{$this->fname} {$this->lname}");
    }

    public function getRoleNameAttribute()
    {
        if ($this->relationLoaded('role')) {
            return $this->role ? $this->role->display_name : null;
        }

        // If relationship not loaded, try to get it
        if ($this->role_id && $role = Role::find($this->role_id)) {
            return $role->display_name;
        }

        return null;
    }

    // ✅ Helper Methods
    public function hasRole($roleName): bool
    {
        if ($this->relationLoaded('role')) {
            return $this->role && $this->role->name === $roleName;
        }

        return $this->role()->where('name', $roleName)->exists();
    }

    public function hasAnyRole(array $roleNames): bool
    {
        if ($this->relationLoaded('role')) {
            return $this->role && in_array($this->role->name, $roleNames);
        }

        return $this->role()->whereIn('name', $roleNames)->exists();
    }

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function getBranchInfoAttribute()
    {
        if (
            $this->relationLoaded('branch') && $this->branch &&
            $this->relationLoaded('store') && $this->store
        ) {
            return "{$this->store->store_name} - {$this->branch->branch_name}";
        }

        if ($this->relationLoaded('branch') && $this->branch) {
            return $this->branch->branch_name;
        }

        return 'No Branch Assigned';
    }

    // ✅ Route Model Binding Fix
    public function resolveRouteBinding($value, $field = null)
    {
        // For super admins, show soft-deleted users
        if (auth()->check() && $this->isSuperAdmin()) {
            return $this->withTrashed()->where($field ?? $this->getRouteKeyName(), $value)->firstOrFail();
        }

        // For others, only show non-deleted users
        return parent::resolveRouteBinding($value, $field);
    }

    // ✅ For dropdowns/selects
    public function toSelectOption()
    {
        return [
            'value' => $this->id,
            'text' => $this->full_name,
            'role' => $this->role_name,
            'email' => $this->email
        ];
    }

    // ✅ User ID Generation
    public static function generateUserId()
    {
        $currentYear = date('Y');
        $yearPrefix = $currentYear . '-';

        $lastUserId = DB::table('users')
            ->where('user_id', 'LIKE', $yearPrefix . '%')
            ->orderBy('user_id', 'desc')
            ->value('user_id');

        $newNumber = $lastUserId
            ? ((int) substr($lastUserId, 5)) + 1
            : 1;

        $formattedNumber = str_pad($newNumber, 7, '0', STR_PAD_LEFT);
        return $yearPrefix . $formattedNumber;
    }

    // ✅ Log Activity
    public function logActivity($action, $description = null)
    {
        if (class_exists('App\Models\Core\ActivityLog')) {
            \App\Models\Core\ActivityLog::create([
                'user_id' => $this->id,
                'action' => $action,
                'description' => $description,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return $this;
    }

    /**
     * Get user's permissions through role
     */
    public function permissions()
    {
        return $this->hasManyThrough(
            Permission::class,
            RolePermission::class,
            'role_id', // Foreign key on role_permissions table
            'id',      // Foreign key on permissions table
            'role_id', // Local key on users table
            'permission_id' // Local key on role_permissions table
        );
    }

    /**
     * Get user-specific permission overrides
     */
    public function userPermissions()
    {
        return $this->hasMany(UserPermission::class);
    }
}
