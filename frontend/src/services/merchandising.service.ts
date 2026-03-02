import axios from 'axios'

const API_BASE = '/api/merchandising'

// ==================== INTERFACES ====================
export interface Product {
  id: number
  store_id: number
  sku: string
  product_name: string
  description?: string
  category_id: number
  subcategory_id?: number
  brand?: string
  collection_name?: string
  base_price: string
  discounted_price?: string
  tax_rate?: string
  length_cm?: string
  width_cm?: string
  height_cm?: string
  weight_kg?: string
  assembly_required: boolean
  is_featured: boolean
  is_new_arrival: boolean
  is_bestseller: boolean
  is_active: boolean
  stock_status: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  published_at?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  variations_count?: number
  assets_count?: number
  category?: Category
  subcategory?: Category
  tags?: Tag[]
  attributes?: ProductAttributeValue[]
  assets?: ProductAsset[]
  variations?: ProductVariation[]
  related?: RelatedProduct[]
}

export interface Category {
  id: number
  store_id: number
  category_code: string
  category_name: string
  description?: string
  parent_category_id?: number
  level: number
  icon_path?: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  deleted_at?: string
  products_count?: number
}

export interface Tag {
  id: number
  store_id: number
  tag_name: string
  tag_type: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  pivot?: {
    product_id: number
    tag_id: number
    created_at: string
    updated_at: string
  }
}

export interface ProductAttribute {
  id: number
  store_id: number
  attribute_name: string
  attribute_type: string
  is_filterable: boolean
  display_order: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface ProductAttributeValue {
  id: number
  store_id: number
  product_id: number
  attribute_id: number
  attribute_value: string
  color_hex_code?: string
  texture_map_url?: string
  created_at: string
  updated_at: string
  attribute?: ProductAttribute
}

export interface ProductAsset {
  id: number
  store_id: number
  product_id: number
  asset_type: string
  file_name: string
  file_path: string
  file_size_kb?: number
  mime_type?: string
  model_format?: string
  is_ar_compatible?: boolean
  is_primary: boolean
  display_order: number
  default_camera_angle_x?: number
  default_camera_angle_y?: number
  default_zoom_level?: number
  alt_text?: string
  caption?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  url?: string
  thumbnail_url?: string
}

export interface ProductVariation {
  id: number
  store_id: number
  product_id: number
  variation_sku: string
  variation_name: string
  color?: string
  color_hex?: string
  size?: string
  material?: string
  price_adjustment: string
  stock_quantity: number
  custom_3d_model_id?: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  custom3d_model?: ProductAsset
}

export interface RelatedProduct {
  id: number
  store_id: number
  product_id: number
  related_product_id: number
  relation_type: string
  strength_score: string
  created_at: string
  updated_at: string
  related_product?: Product
}

export interface DashboardStats {
  totalProducts: number
  totalCategories: number
  lowStockItems: number
  totalValue: number
  topCategories: Array<{
    id: number
    name: string
    count: number
    value: number
  }>
  recentProducts: Product[]
  lowStockProducts: Product[]
}

class MerchandisingService {
  // ==================== DASHBOARD ====================
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await axios.get(`${API_BASE}/dashboard`)
    return response.data.data
  }

  // ==================== PRODUCTS ====================
  async getProducts(params?: {
    page?: number
    perPage?: number
    search?: string
    category_id?: number
    status?: string | boolean
    stock_status?: string
    featured_only?: boolean
    new_arrivals_only?: boolean
    in_stock_only?: boolean
  }) {
    const response = await axios.get(`${API_BASE}/products`, { params })
    return response.data
  }

  async getProduct(id: number): Promise<Product> {
    const response = await axios.get(`${API_BASE}/products/${id}`)
    return response.data.data
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await axios.post(`${API_BASE}/products`, data)
    return response.data.data
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const response = await axios.put(`${API_BASE}/products/${id}`, data)
    return response.data.data
  }

  async deleteProduct(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/products/${id}`)
  }

  async deleteMultipleProducts(ids: number[]): Promise<void> {
    await axios.post(`${API_BASE}/products/bulk/delete`, { ids })
  }

  async bulkUpdateStatus(ids: number[], is_active: boolean): Promise<void> {
    await axios.post(`${API_BASE}/products/bulk/status`, { ids, is_active })
  }

  async exportProducts(format: 'csv' | 'excel' = 'csv') {
    const response = await axios.get(`${API_BASE}/products/export`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  }

  async get3dData(id: number) {
    const response = await axios.get(`${API_BASE}/products/${id}/3d-data`)
    return response.data.data
  }

  // ==================== CATEGORIES ====================
  async getCategories(params?: {
    page?: number
    perPage?: number
    search?: string
    parent_id?: number
  }) {
    const response = await axios.get(`${API_BASE}/categories`, { params })
    return response.data.data || []
  }

  async getCategory(id: number): Promise<Category> {
    const response = await axios.get(`${API_BASE}/categories/${id}`)
    return response.data.data
  }

  async getCategoryTree() {
    const response = await axios.get(`${API_BASE}/categories/tree/all`)
    return response.data.data
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    const response = await axios.post(`${API_BASE}/categories`, data)
    return response.data.data
  }

  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    const response = await axios.put(`${API_BASE}/categories/${id}`, data)
    return response.data.data
  }

  async deleteCategory(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/categories/${id}`)
  }

  async reorderCategories(categories: Array<{ id: number; display_order: number }>) {
    const response = await axios.post(`${API_BASE}/categories/reorder`, { categories })
    return response.data
  }

  // ==================== ATTRIBUTES ====================
  async getAttributes(params?: {
    page?: number
    perPage?: number
    search?: string
  }) {
    const response = await axios.get(`${API_BASE}/attributes`, { params })
    return response.data.data || []
  }

  async getAttribute(id: number): Promise<ProductAttribute> {
    const response = await axios.get(`${API_BASE}/attributes/${id}`)
    return response.data.data
  }

  async createAttribute(data: Partial<ProductAttribute>): Promise<ProductAttribute> {
    const response = await axios.post(`${API_BASE}/attributes`, data)
    return response.data.data
  }

  async updateAttribute(id: number, data: Partial<ProductAttribute>): Promise<ProductAttribute> {
    const response = await axios.put(`${API_BASE}/attributes/${id}`, data)
    return response.data.data
  }

  async deleteAttribute(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/attributes/${id}`)
  }

  // Product Attribute Values
  async getProductAttributeValues(productId: number) {
    const response = await axios.get(`${API_BASE}/attributes/product/${productId}`)
    return response.data.data
  }

  async addProductAttributeValue(data: {
    product_id: number
    attribute_id: number
    attribute_value: string
    color_hex_code?: string
    texture_map_url?: string
  }) {
    const response = await axios.post(`${API_BASE}/attributes/values`, data)
    return response.data.data
  }

  async updateProductAttributeValue(id: number, data: Partial<ProductAttributeValue>) {
    const response = await axios.put(`${API_BASE}/attributes/values/${id}`, data)
    return response.data.data
  }

  async deleteProductAttributeValue(id: number) {
    await axios.delete(`${API_BASE}/attributes/values/${id}`)
  }

  // ==================== VARIATIONS ====================
  async getVariations(productId: number) {
    const response = await axios.get(`${API_BASE}/variations/product/${productId}`)
    return response.data.data || []
  }

  async createVariation(data: Partial<ProductVariation>) {
    const response = await axios.post(`${API_BASE}/variations`, data)
    return response.data.data
  }

  async updateVariation(id: number, data: Partial<ProductVariation>) {
    const response = await axios.put(`${API_BASE}/variations/${id}`, data)
    return response.data.data
  }

  async deleteVariation(id: number) {
    await axios.delete(`${API_BASE}/variations/${id}`)
  }

  // ==================== TAGS ====================
  async getTags(params?: {
    page?: number
    perPage?: number
    search?: string
    tag_type?: string
  }) {
    const response = await axios.get(`${API_BASE}/tags`, { params })
    return response.data.data || []
  }

  async getTag(id: number): Promise<Tag> {
    const response = await axios.get(`${API_BASE}/tags/${id}`)
    return response.data.data
  }

  async createTag(data: Partial<Tag>) {
    const response = await axios.post(`${API_BASE}/tags`, data)
    return response.data.data
  }

  async updateTag(id: number, data: Partial<Tag>) {
    const response = await axios.put(`${API_BASE}/tags/${id}`, data)
    return response.data.data
  }

  async deleteTag(id: number) {
    await axios.delete(`${API_BASE}/tags/${id}`)
  }

  async attachTagToProduct(productId: number, tagId: number) {
    const response = await axios.post(`${API_BASE}/tags/attach`, {
      product_id: productId,
      tag_id: tagId
    })
    return response.data
  }

  async detachTagFromProduct(productId: number, tagId: number) {
    const response = await axios.post(`${API_BASE}/tags/detach`, {
      product_id: productId,
      tag_id: tagId
    })
    return response.data
  }

  // ==================== ASSETS ====================
  async getAssets(productId: number) {
    const response = await axios.get(`${API_BASE}/assets/product/${productId}`)
    return response.data.data || []
  }

  async uploadAsset(formData: FormData) {
    const response = await axios.post(`${API_BASE}/assets/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data
  }

  async updateAsset(id: number, data: Partial<ProductAsset>) {
    const response = await axios.put(`${API_BASE}/assets/${id}`, data)
    return response.data.data
  }

  async deleteAsset(id: number) {
    await axios.delete(`${API_BASE}/assets/${id}`)
  }

  async reorderAssets(assets: Array<{ id: number; display_order: number }>) {
    const response = await axios.post(`${API_BASE}/assets/reorder`, { assets })
    return response.data
  }

  // ==================== INVENTORY ====================
  async getInventory(params?: {
    page?: number
    perPage?: number
    search?: string
    low_stock_only?: boolean
  }) {
    const response = await axios.get(`${API_BASE}/inventory`, { params })
    return response.data.data || []
  }

  async updateStock(variationId: number, data: {
    stock_quantity: number
  }) {
    const response = await axios.put(`${API_BASE}/variations/${variationId}/stock`, data)
    return response.data.data
  }
}

export default new MerchandisingService()