<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Core\Permission;        // ✅ Updated namespace
use App\Models\Core\NavigationItem;    // ✅ Updated namespace
use App\Models\Core\UserPermission;    // ✅ Updated namespace

class UserNavigationController extends Controller
{
    /**
     * Get user's navigation items and permissions based on their role
     */
    public function getUserNavigation(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Get user's role
        $roleId = $user->role_id ?? null;
        
        if (!$roleId) {
            return response()->json([
                'message' => 'User has no role assigned',
                'permissions' => [],
                'navigation' => []
            ], 403);
        }

        // Get all permissions for user's role
        $rolePermissions = DB::table('role_permissions')
            ->where('role_id', $roleId)
            ->pluck('permission_id')
            ->toArray();

        // Get user-specific permission overrides
        $userGrants = DB::table('user_permissions')
            ->where('user_id', $user->id)
            ->where('type', 'grant')
            ->pluck('permission_id')
            ->toArray();

        $userRevokes = DB::table('user_permissions')
            ->where('user_id', $user->id)
            ->where('type', 'revoke')
            ->pluck('permission_id')
            ->toArray();

        // Merge permissions
        $finalPermissionIds = array_diff(
            array_unique(array_merge($rolePermissions, $userGrants)),
            $userRevokes
        );

        // Get permission names
        $permissions = DB::table('permissions')
            ->whereIn('id', $finalPermissionIds)
            ->where('is_active', true)
            ->pluck('name')
            ->toArray();

        // Get navigation items
        $navigationItems = DB::table('navigation_items as ni')
            ->select(
                'ni.id',
                'ni.name',
                'ni.display_name',
                'ni.module',
                'ni.route_name',
                'ni.route_path',
                'ni.icon',
                'ni.parent_id',
                'ni.display_order',
                'ni.meta'
            )
            ->where('ni.is_active', true)
            ->whereExists(function ($query) use ($finalPermissionIds) {
                $query->select(DB::raw(1))
                    ->from('navigation_permissions as np')
                    ->whereColumn('np.navigation_item_id', 'ni.id')
                    ->whereIn('np.permission_id', $finalPermissionIds);
            })
            ->orderBy('ni.display_order')
            ->get()
            ->map(function ($item) {
                $item->meta = $item->meta ? json_decode($item->meta, true) : null;
                return $item;
            });

        return response()->json([
            'permissions' => $permissions,
            'navigation' => $navigationItems,
            'user' => [
                'id' => $user->id,
                'name' => ($user->first_name ?? '') . ' ' . ($user->last_name ?? ''),
                'email' => $user->email,
                'role' => $user->role ?? 'unknown'
            ]
        ]);
    }

    /**
     * Check if user has a specific permission
     */
    public function checkPermission(Request $request)
    {
        $request->validate([
            'permission' => 'required|string'
        ]);

        $user = $request->user();
        $permissionName = $request->input('permission');
        $roleId = $user->role_id ?? null;

        if (!$roleId) {
            return response()->json(['has_permission' => false]);
        }

        $permission = DB::table('permissions')
            ->where('name', $permissionName)
            ->where('is_active', true)
            ->first();

        if (!$permission) {
            return response()->json(['has_permission' => false]);
        }

        $hasRolePermission = DB::table('role_permissions')
            ->where('role_id', $roleId)
            ->where('permission_id', $permission->id)
            ->exists();

        $hasUserGrant = DB::table('user_permissions')
            ->where('user_id', $user->id)
            ->where('permission_id', $permission->id)
            ->where('type', 'grant')
            ->exists();

        $hasUserRevoke = DB::table('user_permissions')
            ->where('user_id', $user->id)
            ->where('permission_id', $permission->id)
            ->where('type', 'revoke')
            ->exists();

        $hasPermission = ($hasRolePermission || $hasUserGrant) && !$hasUserRevoke;

        return response()->json([
            'has_permission' => $hasPermission,
            'permission' => $permissionName
        ]);
    }
}