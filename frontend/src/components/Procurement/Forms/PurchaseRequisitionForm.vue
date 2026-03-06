<template>
  <div class="pr-form">
    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block mb-2 font-medium">Branch *</label>
          <Dropdown
            v-model="formData.branch_id"
            :options="branches"
            optionLabel="name"
            optionValue="id"
            placeholder="Select branch"
            class="w-full"
            :class="{ 'p-invalid': errors.branch_id }"
          />
          <small v-if="errors.branch_id" class="p-error">{{ errors.branch_id }}</small>
        </div>

        <div>
          <label class="block mb-2 font-medium">Requisition Type *</label>
          <Dropdown
            v-model="formData.requisition_type"
            :options="requisitionTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Select type"
            class="w-full"
            :class="{ 'p-invalid': errors.requisition_type }"
          />
        </div>

        <div>
          <label class="block mb-2 font-medium">Required Date *</label>
          <Calendar
            v-model="formData.required_date"
            showIcon
            :minDate="new Date()"
            dateFormat="yy-mm-dd"
            class="w-full"
            :class="{ 'p-invalid': errors.required_date }"
          />
        </div>

        <div>
          <label class="block mb-2 font-medium">Priority (1-5) *</label>
         <Slider v-model="formData.priority" :min="1" :max="5" class="w-full mt-4" />
          <div class="text-center mt-2 font-semibold">{{ formData.priority }}</div>
        </div>

        <div class="col-span-full">
          <label class="block mb-2 font-medium">Reason *</label>
          <Textarea
            v-model="formData.reason"
            rows="3"
            placeholder="Enter reason for requisition"
            class="w-full"
            :class="{ 'p-invalid': errors.reason }"
          />
        </div>
      </div>

      <!-- Items Section -->
      <div class="mt-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Items</h3>
          <Button
            label="Add Item"
            icon="pi pi-plus"
            size="small"
            @click="addItem"
            type="button"
          />
        </div>

        <DataTable :value="formData.items" responsiveLayout="scroll">
          <Column header="Product *" style="min-width: 200px">
            <template #body="{ data, index }">
              <Dropdown
                v-model="data.product_id"
                :options="products"
                optionLabel="name"
                optionValue="id"
                placeholder="Select product"
                filter
                class="w-full"
                @change="onProductChange(index)"
              />
            </template>
          </Column>

          <Column header="Variation" style="min-width: 150px">
            <template #body="{ data }">
              <Dropdown
                v-model="data.variation_id"
                :options="getProductVariations(data.product_id)"
                optionLabel="sku"
                optionValue="id"
                placeholder="Select variation"
                class="w-full"
              />
            </template>
          </Column>

          <Column header="Quantity *" style="min-width: 120px">
            <template #body="{ data }">
              <InputNumber
                v-model="data.quantity_requested"
                :min="1"
                class="w-full"
              />
            </template>
          </Column>

          <Column header="Est. Unit Cost" style="min-width: 140px">
            <template #body="{ data }">
              <InputNumber
                v-model="data.estimated_unit_cost"
                mode="currency"
                currency="PHP"
                locale="en-PH"
                class="w-full"
              />
            </template>
          </Column>

          <Column header="Specifications" style="min-width: 200px">
            <template #body="{ data }">
              <Textarea
                v-model="data.specifications"
                rows="2"
                class="w-full"
              />
            </template>
          </Column>

          <Column header="" style="width: 80px">
            <template #body="{ index }">
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                @click="removeItem(index)"
                type="button"
              />
            </template>
          </Column>
        </DataTable>

        <div class="mt-4 flex justify-end">
          <div class="bg-gray-100 p-4 rounded">
            <div class="text-sm text-gray-600">Estimated Total Amount</div>
            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(estimatedTotal) }}</div>
            <div class="text-xs text-gray-500 mt-1">Route: {{ procurementRoute }}</div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <Button
          label="Cancel"
          severity="secondary"
          @click="$emit('cancel')"
          type="button"
        />
        <Button
          label="Save as Draft"
          severity="secondary"
          @click="handleSaveDraft"
          :loading="loading"
          type="button"
        />
        <Button
          label="Submit for Approval"
          :loading="loading"
          type="submit"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import Slider from 'primevue/slider';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import axios from '@/axios';

interface Props {
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'submit', data: any, submit: boolean): void;
  (e: 'cancel'): void;
}>();

const formData = reactive({
  branch_id: null as number | null,
  requisition_type: 'regular' as string,
  required_date: null as Date | null,
  priority: 3,
  reason: '',
  items: [] as any[],
});

const errors = reactive<Record<string, string>>({});
const branches = ref<any[]>([]);
const products = ref<any[]>([]);

const requisitionTypes = [
  { label: 'Regular', value: 'regular' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'New Product', value: 'new_product' },
  { label: 'Seasonal', value: 'seasonal' },
  { label: 'Emergency', value: 'emergency' },
];

const estimatedTotal = computed(() => {
  return formData.items.reduce((total, item) => {
    const cost = item.estimated_unit_cost || 0;
    const qty = item.quantity_requested || 0;
    return total + (cost * qty);
  }, 0);
});

const procurementRoute = computed(() => {
  if (estimatedTotal.value > 500000) return 'RFQ Required';
  if (estimatedTotal.value > 100000) return 'Centralized';
  return 'Branch Direct';
});

const loadBranches = async () => {
  try {
    const response = await axios.get('/api/branches');
    branches.value = response.data;
  } catch (error) {
    console.error('Failed to load branches:', error);
  }
};

const loadProducts = async () => {
  try {
    const response = await axios.get('/api/products');
    products.value = response.data;
  } catch (error) {
    console.error('Failed to load products:', error);
  }
};

const getProductVariations = (productId: number) => {
  const product = products.value.find(p => p.id === productId);
  return product?.variations || [];
};

const onProductChange = (index: number) => {
  const item = formData.items[index];
  const product = products.value.find(p => p.id === item.product_id);
  if (product) {
    item.estimated_unit_cost = product.unit_cost || 0;
  }
};

const addItem = () => {
  formData.items.push({
    product_id: null,
    variation_id: null,
    quantity_requested: 1,
    estimated_unit_cost: 0,
    specifications: '',
  });
};

const removeItem = (index: number) => {
  formData.items.splice(index, 1);
};

const validate = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  
  if (!formData.branch_id) errors.branch_id = 'Branch is required';
  if (!formData.requisition_type) errors.requisition_type = 'Type is required';
  if (!formData.required_date) errors.required_date = 'Required date is required';
  if (!formData.reason) errors.reason = 'Reason is required';
  if (formData.items.length === 0) errors.items = 'At least one item is required';
  
  return Object.keys(errors).length === 0;
};

const handleSubmit = () => {
  if (validate()) {
    emit('submit', { ...formData }, true);
  }
};

const handleSaveDraft = () => {
  emit('submit', { ...formData }, false);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value);
};

onMounted(() => {
  loadBranches();
  loadProducts();
});
</script>
