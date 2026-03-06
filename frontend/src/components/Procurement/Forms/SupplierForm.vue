<template>
  <div class="supplier-form">
    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Basic Information -->
        <div class="col-span-full">
          <h3 class="text-lg font-semibold mb-4">Basic Information</h3>
        </div>

        <div>
          <label class="block mb-2 font-medium">Supplier Name *</label>
          <InputText
            v-model="formData.supplier_name"
            placeholder="Enter supplier name"
            class="w-full"
            :class="{ 'p-invalid': errors.supplier_name }"
          />
          <small v-if="errors.supplier_name" class="p-error">{{ errors.supplier_name }}</small>
        </div>

        <div>
          <label class="block mb-2 font-medium">Company Name</label>
          <InputText
            v-model="formData.company_name"
            placeholder="Enter company name"
            class="w-full"
          />
        </div>

        <div>
          <label class="block mb-2 font-medium">Supplier Type *</label>
          <Dropdown
            v-model="formData.supplier_type"
            :options="supplierTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Select type"
            class="w-full"
            :class="{ 'p-invalid': errors.supplier_type }"
          />
          <small v-if="errors.supplier_type" class="p-error">{{ errors.supplier_type }}</small>
        </div>

        <div>
          <label class="block mb-2 font-medium">Status</label>
          <Dropdown
            v-model="formData.status"
            :options="statuses"
            optionLabel="label"
            optionValue="value"
            placeholder="Select status"
            class="w-full"
          />
        </div>

        <!-- Contact Information -->
        <div class="col-span-full mt-4">
          <h3 class="text-lg font-semibold mb-4">Contact Information</h3>
        </div>

        <div>
          <label class="block mb-2 font-medium">Contact Person</label>
          <InputText
            v-model="formData.contact_person"
            placeholder="Enter contact person"
            class="w-full"
          />
        </div>

        <div>
          <label class="block mb-2 font-medium">Email</label>
          <InputText
            v-model="formData.email"
            type="email"
            placeholder="Enter email"
            class="w-full"
            :class="{ 'p-invalid': errors.email }"
          />
          <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
        </div>

        <div>
          <label class="block mb-2 font-medium">Phone *</label>
          <InputText
            v-model="formData.phone"
            placeholder="Enter phone number"
            class="w-full"
            :class="{ 'p-invalid': errors.phone }"
          />
          <small v-if="errors.phone" class="p-error">{{ errors.phone }}</small>
        </div>

        <div>
          <label class="block mb-2 font-medium">Mobile</label>
          <InputText
            v-model="formData.mobile"
            placeholder="Enter mobile number"
            class="w-full"
          />
        </div>

        <!-- Address Information -->
        <div class="col-span-full mt-4">
          <h3 class="text-lg font-semibold mb-4">Address</h3>
        </div>

        <div class="col-span-full">
          <label class="block mb-2 font-medium">Address</label>
          <Textarea
            v-model="formData.address"
            placeholder="Enter address"
            rows="2"
            class="w-full"
          />
        </div>

        <div>
          <label class="block mb-2 font-medium">City</label>
          <InputText
            v-model="formData.city"
            placeholder="Enter city"
            class="w-full"
          />
        </div>

        <div>
          <label class="block mb-2 font-medium">Province</label>
          <InputText
            v-model="formData.province"
            placeholder="Enter province"
            class="w-full"
          />
        </div>

        <div>
          <label class="block mb-2 font-medium">Country</label>
          <InputText
            v-model="formData.country"
            placeholder="Enter country"
            class="w-full"
          />
        </div>

        <!-- Business Information -->
        <div class="col-span-full mt-4">
          <h3 class="text-lg font-semibold mb-4">Business Terms</h3>
        </div>

        <div>
          <label class="block mb-2 font-medium">Payment Terms *</label>
          <Dropdown
            v-model="formData.payment_terms"
            :options="paymentTermsOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select payment terms"
            class="w-full"
            :class="{ 'p-invalid': errors.payment_terms }"
          />
          <small v-if="errors.payment_terms" class="p-error">{{ errors.payment_terms }}</small>
        </div>

        <div>
          <label class="block mb-2 font-medium">Credit Limit (₱)</label>
          <InputNumber
            v-model="formData.credit_limit"
            placeholder="Enter credit limit"
            mode="currency"
            currency="PHP"
            locale="en-PH"
            class="w-full"
          />
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
          :label="submitLabel"
          :loading="loading"
          type="submit"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import type { Supplier } from '@/types/procurement';

interface Props {
  modelValue?: Supplier;
  mode: 'create' | 'edit';
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'submit', data: Partial<Supplier>): void;
  (e: 'cancel'): void;
}>();

const formData = reactive<Partial<Supplier>>({
  supplier_name: '',
  company_name: '',
  supplier_type: undefined as any,
  status: 'active',
  contact_person: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  city: '',
  province: '',
  country: 'Philippines',
  payment_terms: undefined as any,
  credit_limit: 0,
});

const errors = reactive<Record<string, string>>({});

const supplierTypes = [
  { label: 'Manufacturer', value: 'manufacturer' },
  { label: 'Wholesaler', value: 'wholesaler' },
  { label: 'Distributor', value: 'distributor' },
  { label: 'Importer', value: 'importer' },
  { label: 'Local Artisan', value: 'local_artisan' },
];

const statuses = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Blacklisted', value: 'blacklisted' },
];

const paymentTermsOptions = [
  { label: 'Cash on Delivery (COD)', value: 'cash_on_delivery' },
  { label: 'Net 7 Days', value: 'net_7' },
  { label: 'Net 15 Days', value: 'net_15' },
  { label: 'Net 30 Days', value: 'net_30' },
  { label: 'Net 60 Days', value: 'net_60' },
  { label: 'Advance Payment', value: 'advance_payment' },
];

const submitLabel = computed(() => {
  return props.mode === 'create' ? 'Create Supplier' : 'Update Supplier';
});

const validate = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  
  if (!formData.supplier_name) {
    errors.supplier_name = 'Supplier name is required';
  }
  
  if (!formData.phone) {
    errors.phone = 'Phone number is required';
  }
  
  if (!formData.supplier_type) {
    errors.supplier_type = 'Supplier type is required';
  }
  
  if (!formData.payment_terms) {
    errors.payment_terms = 'Payment terms is required';
  }
  
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  return Object.keys(errors).length === 0;
};

const handleSubmit = () => {
  if (validate()) {
    emit('submit', { ...formData });
  }
};

// Initialize form with existing data in edit mode
watch(() => props.modelValue, (value) => {
  if (value) {
    Object.assign(formData, value);
  }
}, { immediate: true });
</script>
