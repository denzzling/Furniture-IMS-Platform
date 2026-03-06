<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { RequestForQuotation, Supplier, PurchaseRequisition } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

const props = defineProps<{
  rfq?: RequestForQuotation;
  purchaseRequisitions?: PurchaseRequisition[];
  suppliers?: Supplier[];
}>();

const emit = defineEmits<{
  submit: [data: Partial<RequestForQuotation>, action: 'draft' | 'send'];
  cancel: [];
}>();

const { canCreate, canUpdate } = useProcurementPermissions();

const formData = reactive({
  purchase_requisition_id: props.rfq?.purchase_requisition_id || null,
  title: props.rfq?.title || '',
  description: props.rfq?.description || '',
  issue_date: props.rfq?.issue_date ? new Date(props.rfq.issue_date) : new Date(),
  deadline_date: props.rfq?.deadline_date ? new Date(props.rfq.deadline_date) : null,
  items: props.rfq?.items || [],
  supplier_ids: props.rfq?.suppliers?.map(s => s.id) || []
});

const errors = reactive({
  title: '',
  deadline_date: '',
  items: '',
  supplier_ids: ''
});

const newItem = reactive({
  product_id: null,
  product_variation_id: null,
  quantity: 0,
  specifications: '',
  requirements: ''
});

const validateForm = (action: 'draft' | 'send'): boolean => {
  let isValid = true;
  
  // Clear previous errors
  Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '');

  if (!formData.title.trim()) {
    errors.title = 'Title is required';
    isValid = false;
  }

  if (action === 'send') {
    if (!formData.deadline_date) {
      errors.deadline_date = 'Deadline date is required when sending to suppliers';
      isValid = false;
    } else if (formData.deadline_date <= formData.issue_date) {
      errors.deadline_date = 'Deadline must be after issue date';
      isValid = false;
    }

    if (formData.items.length === 0) {
      errors.items = 'At least one item is required';
      isValid = false;
    }

    if (formData.supplier_ids.length < 3) {
      errors.supplier_ids = 'Minimum 3 suppliers required to send RFQ';
      isValid = false;
    }
  }

  return isValid;
};

const addItem = () => {
  if (!newItem.product_id || newItem.quantity <= 0) {
    return;
  }

  formData.items.push({
    product_id: newItem.product_id,
    product_variation_id: newItem.product_variation_id,
    quantity: newItem.quantity,
    specifications: newItem.specifications,
    requirements: newItem.requirements
  } as any);

  // Reset form
  newItem.product_id = null;
  newItem.product_variation_id = null;
  newItem.quantity = 0;
  newItem.specifications = '';
  newItem.requirements = '';
};

const removeItem = (index: number) => {
  formData.items.splice(index, 1);
};

const handleSubmit = (action: 'draft' | 'send') => {
  if (!validateForm(action)) return;
  
  const submitData = {
    ...formData,
    issue_date: formData.issue_date.toISOString().split('T')[0],
    deadline_date: formData.deadline_date ? formData.deadline_date.toISOString().split('T')[0] : null
  };

  emit('submit', submitData, action);
};

const selectedSuppliers = computed(() => {
  if (!props.suppliers) return [];
  return props.suppliers.filter(s => formData.supplier_ids.includes(s.id));
});
</script>

<template>
  <form @submit.prevent="handleSubmit('send')" class="space-y-6">
    <!-- Header Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Link to PR -->
      <div class="flex flex-col gap-2">
        <label for="pr" class="font-medium text-sm">Link to Purchase Requisition (Optional)</label>
        <Dropdown
          id="pr"
          v-model="formData.purchase_requisition_id"
          :options="purchaseRequisitions"
          optionLabel="pr_number"
          optionValue="id"
          placeholder="Select PR (optional)"
          :filter="true"
          class="w-full"
        >
          <template #option="slotProps">
            <div class="flex flex-col">
              <span class="font-medium">{{ slotProps.option.pr_number }}</span>
              <span class="text-xs text-gray-500">{{ slotProps.option.branch?.name }} - ₱{{ slotProps.option.estimated_total?.toLocaleString('en-PH') }}</span>
            </div>
          </template>
        </Dropdown>
      </div>

      <!-- Title -->
      <div class="flex flex-col gap-2">
        <label for="title" class="font-medium text-sm">
          Title <span class="text-red-500">*</span>
        </label>
        <InputText
          id="title"
          v-model="formData.title"
          placeholder="Enter RFQ title"
          :class="{ 'p-invalid': errors.title }"
        />
        <small v-if="errors.title" class="text-red-500">{{ errors.title }}</small>
      </div>
    </div>

    <!-- Description -->
    <div class="flex flex-col gap-2">
      <label for="description" class="font-medium text-sm">Description</label>
      <Textarea
        id="description"
        v-model="formData.description"
        rows="3"
        placeholder="Enter RFQ description"
      />
    </div>

    <!-- Dates -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <label for="issue-date" class="font-medium text-sm">Issue Date</label>
        <Calendar
          id="issue-date"
          v-model="formData.issue_date"
          dateFormat="yy-mm-dd"
          showIcon
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="deadline-date" class="font-medium text-sm">
          Deadline Date <span class="text-red-500">*</span>
        </label>
        <Calendar
          id="deadline-date"
          v-model="formData.deadline_date"
          dateFormat="yy-mm-dd"
          showIcon
          :minDate="formData.issue_date"
          :class="{ 'p-invalid': errors.deadline_date }"
        />
        <small v-if="errors.deadline_date" class="text-red-500">{{ errors.deadline_date }}</small>
      </div>
    </div>

    <!-- Items Section -->
    <div class="border rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Items</h3>
        <small v-if="errors.items" class="text-red-500">{{ errors.items }}</small>
      </div>

      <!-- Add Item Form -->
      <div class="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4 p-3 bg-gray-50 rounded">
        <div class="md:col-span-2">
          <Dropdown
            v-model="newItem.product_id"
            :options="[]"
            placeholder="Select Product"
            class="w-full"
          />
        </div>
        <div>
          <Dropdown
            v-model="newItem.product_variation_id"
            :options="[]"
            placeholder="Variation"
            class="w-full"
          />
        </div>
        <div>
          <InputNumber
            v-model="newItem.quantity"
            placeholder="Qty"
            :min="1"
            class="w-full"
          />
        </div>
        <div>
          <InputText
            v-model="newItem.specifications"
            placeholder="Specs"
            class="w-full"
          />
        </div>
        <div>
          <Button
            type="button"
            label="Add"
            icon="pi pi-plus"
            size="small"
            @click="addItem"
            class="w-full"
          />
        </div>
      </div>

      <!-- Items Table -->
      <DataTable
        :value="formData.items"
        responsiveLayout="scroll"
        class="text-sm"
      >
        <Column field="product.name" header="Product">
          <template #body="{ data }">
            {{ data.product?.name || 'Product #' + data.product_id }}
          </template>
        </Column>
        <Column field="product_variation.name" header="Variation">
          <template #body="{ data }">
            {{ data.product_variation?.name || '-' }}
          </template>
        </Column>
        <Column field="quantity" header="Quantity" />
        <Column field="specifications" header="Specifications">
          <template #body="{ data }">
            {{ data.specifications || '-' }}
          </template>
        </Column>
        <Column field="requirements" header="Requirements">
          <template #body="{ data }">
            {{ data.requirements || '-' }}
          </template>
        </Column>
        <Column header="Actions" style="width: 100px">
          <template #body="{ index }">
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="removeItem(index)"
            />
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-4 text-gray-500">
            No items added yet
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Suppliers Section -->
    <div class="border rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">
          Suppliers <span class="text-red-500">* (Min 3)</span>
        </h3>
        <small v-if="errors.supplier_ids" class="text-red-500">{{ errors.supplier_ids }}</small>
      </div>

      <MultiSelect
        v-model="formData.supplier_ids"
        :options="suppliers"
        optionLabel="name"
        optionValue="id"
        placeholder="Select suppliers (minimum 3)"
        :filter="true"
        class="w-full"
        :class="{ 'p-invalid': errors.supplier_ids }"
      >
        <template #option="slotProps">
          <div class="flex items-center justify-between w-full">
            <div>
              <div class="font-medium">{{ slotProps.option.name }}</div>
              <div class="text-xs text-gray-500">{{ slotProps.option.contact_person }}</div>
            </div>
            <div class="flex items-center gap-1">
              <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
              <span class="text-sm">{{ slotProps.option.rating || 'N/A' }}</span>
            </div>
          </div>
        </template>
      </MultiSelect>

      <!-- Selected Suppliers Display -->
      <div v-if="selectedSuppliers.length > 0" class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div
          v-for="supplier in selectedSuppliers"
          :key="supplier.id"
          class="flex items-center justify-between p-2 bg-blue-50 rounded"
        >
          <div class="flex-1">
            <div class="font-medium text-sm">{{ supplier.name }}</div>
            <div class="text-xs text-gray-600">{{ supplier.email }}</div>
          </div>
          <div class="flex items-center gap-1">
            <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
            <span class="text-sm">{{ supplier.rating || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3 pt-4 border-t">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        outlined
        @click="emit('cancel')"
      />
      <Button
        v-if="canCreate || canUpdate"
        type="button"
        label="Save as Draft"
        severity="info"
        outlined
        @click="handleSubmit('draft')"
      />
      <Button
        v-if="canCreate || canUpdate"
        type="submit"
        label="Send to Suppliers"
        icon="pi pi-send"
      />
    </div>
  </form>
</template>
