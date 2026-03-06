<script setup lang="ts">
import { ref, computed } from 'vue';
import { Supplier } from '@/types/procurement';

const props = defineProps<{
  visible: boolean;
  suppliers: Supplier[];
  selectedIds?: number[];
  minSuppliers?: number;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  select: [supplierIds: number[]];
}>();

const selectedSuppliers = ref<Supplier[]>([]);
const searchQuery = ref('');

const minRequired = computed(() => props.minSuppliers || 3);

const filteredSuppliers = computed(() => {
  if (!searchQuery.value) return props.suppliers;
  
  const query = searchQuery.value.toLowerCase();
  return props.suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(query) ||
    supplier.contact_person?.toLowerCase().includes(query) ||
    supplier.email?.toLowerCase().includes(query)
  );
});

const activeSuppliers = computed(() => {
  return filteredSuppliers.value.filter(s => s.status === 'Active');
});

const handleClose = () => {
  emit('update:visible', false);
};

const handleSubmit = () => {
  if (selectedSuppliers.value.length < minRequired.value) {
    return;
  }
  
  const supplierIds = selectedSuppliers.value.map(s => s.id);
  emit('select', supplierIds);
  emit('update:visible', false);
};

const getSupplierStatusSeverity = (status: string) => {
  const severities: Record<string, any> = {
    'Active': 'success',
    'Inactive': 'warning',
    'Blacklisted': 'danger'
  };
  return severities[status] || 'secondary';
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '900px' }"
    header="Select Suppliers for RFQ"
  >
    <div class="space-y-4">
      <!-- Instructions -->
      <div class="p-3 bg-blue-50 border border-blue-200 rounded">
        <div class="flex items-start gap-2">
          <i class="pi pi-info-circle text-blue-600 mt-1"></i>
          <div class="text-sm">
            <p class="font-medium text-blue-900">Supplier Selection Guidelines</p>
            <p class="text-blue-700 mt-1">
              Select at least {{ minRequired }} active suppliers to send this RFQ. 
              Choose suppliers with good ratings and relevant product expertise.
            </p>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="flex items-center gap-3">
        <IconField iconPosition="left" class="flex-1">
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText
            v-model="searchQuery"
            placeholder="Search suppliers by name, contact person, or email..."
            class="w-full"
          />
        </IconField>
        <div class="text-sm text-gray-600">
          Selected: <span class="font-semibold">{{ selectedSuppliers.length }}</span> / 
          Minimum: <span class="font-semibold">{{ minRequired }}</span>
        </div>
      </div>

      <!-- Suppliers Table -->
      <DataTable
        v-model:selection="selectedSuppliers"
        :value="activeSuppliers"
        selectionMode="multiple"
        dataKey="id"
        responsiveLayout="scroll"
        :paginator="activeSuppliers.length > 10"
        :rows="10"
        class="text-sm"
        :rowClass="(data) => selectedSuppliers.some(s => s.id === data.id) ? 'bg-blue-50' : ''"
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem" />
        
        <Column header="Supplier" style="min-width: 200px">
          <template #body="{ data }">
            <div>
              <div class="font-medium">{{ data.name }}</div>
              <div class="text-xs text-gray-500">{{ data.supplier_type }}</div>
            </div>
          </template>
        </Column>

        <Column field="contact_person" header="Contact Person" />

        <Column header="Contact Info" style="min-width: 180px">
          <template #body="{ data }">
            <div class="text-xs space-y-1">
              <div class="flex items-center gap-1">
                <i class="pi pi-envelope text-gray-400"></i>
                <span>{{ data.email }}</span>
              </div>
              <div class="flex items-center gap-1">
                <i class="pi pi-phone text-gray-400"></i>
                <span>{{ data.phone }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column header="Rating" style="width: 100px">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <i class="pi pi-star-fill text-yellow-500"></i>
              <span class="font-semibold">{{ data.rating || 'N/A' }}</span>
            </div>
          </template>
        </Column>

        <Column field="status" header="Status" style="width: 100px">
          <template #body="{ data }">
            <Tag 
              :value="data.status" 
              :severity="getSupplierStatusSeverity(data.status)"
            />
          </template>
        </Column>

        <Column header="Payment Terms" style="width: 120px">
          <template #body="{ data }">
            <span class="text-xs">{{ data.payment_terms || 'N/A' }}</span>
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-8 text-gray-500">
            <i class="pi pi-users text-4xl mb-2"></i>
            <p>No active suppliers found</p>
            <small v-if="searchQuery">Try adjusting your search criteria</small>
          </div>
        </template>
      </DataTable>

      <!-- Selected Suppliers Summary -->
      <div v-if="selectedSuppliers.length > 0" class="border-t pt-4">
        <h4 class="font-semibold mb-3">Selected Suppliers ({{ selectedSuppliers.length }})</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="supplier in selectedSuppliers"
            :key="supplier.id"
            class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded"
          >
            <div class="flex items-center gap-3">
              <div class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                {{ supplier.name.charAt(0) }}
              </div>
              <div>
                <div class="font-medium text-sm">{{ supplier.name }}</div>
                <div class="text-xs text-gray-600">{{ supplier.contact_person }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1 text-sm">
                <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
                <span>{{ supplier.rating || 'N/A' }}</span>
              </div>
              <Button
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                size="small"
                @click="selectedSuppliers = selectedSuppliers.filter(s => s.id !== supplier.id)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Validation Message -->
      <div 
        v-if="selectedSuppliers.length > 0 && selectedSuppliers.length < minRequired"
        class="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800"
      >
        <i class="pi pi-exclamation-triangle mr-2"></i>
        Please select at least {{ minRequired - selectedSuppliers.length }} more supplier(s)
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-600">
          {{ selectedSuppliers.length }} of {{ activeSuppliers.length }} suppliers selected
        </div>
        <div class="flex gap-2">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            @click="handleClose"
          />
          <Button
            label="Select Suppliers"
            icon="pi pi-check"
            @click="handleSubmit"
            :disabled="selectedSuppliers.length < minRequired"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>
