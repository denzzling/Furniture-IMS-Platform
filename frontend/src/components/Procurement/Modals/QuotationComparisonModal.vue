<script setup lang="ts">
import { ref, computed } from 'vue';
import { SupplierQuotation } from '@/types/procurement';

const props = defineProps<{
  visible: boolean;
  quotations: SupplierQuotation[];
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  select: [quotation: SupplierQuotation];
}>();

const selectedQuotation = ref<SupplierQuotation | null>(null);

const handleClose = () => {
  emit('update:visible', false);
  selectedQuotation.value = null;
};

const handleSelect = () => {
  if (selectedQuotation.value) {
    emit('select', selectedQuotation.value);
    handleClose();
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);
};

const getScoreSeverity = (score: number) => {
  if (score >= 90) return 'success';
  if (score >= 75) return 'info';
  if (score >= 60) return 'warning';
  return 'danger';
};

const sortedQuotations = computed(() => {
  return [...props.quotations].sort((a, b) => {
    // First by evaluation score (if exists), then by price
    const scoreA = a.evaluation_score || 0;
    const scoreB = b.evaluation_score || 0;
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // Higher score first
    }
    
    return a.total_amount - b.total_amount; // Lower price first
  });
});
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '900px' }"
    header="Compare Quotations"
  >
    <div class="space-y-4">
      <div v-if="quotations.length === 0" class="text-center py-8 text-gray-500">
        No quotations to compare
      </div>

      <DataTable
        v-else
        v-model:selection="selectedQuotation"
        :value="sortedQuotations"
        selectionMode="single"
        dataKey="id"
        responsiveLayout="scroll"
        class="text-sm"
        :rowClass="(data) => selectedQuotation?.id === data.id ? 'bg-blue-50' : ''"
      >
        <Column selectionMode="single" headerStyle="width: 3rem" />
        
        <Column header="Supplier">
          <template #body="{ data }">
            <div>
              <div class="font-medium">{{ data.supplier?.name }}</div>
              <div class="flex items-center gap-1 text-xs text-gray-500">
                <i class="pi pi-star-fill text-yellow-500"></i>
                <span>{{ data.supplier?.rating || 'N/A' }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column field="quotation_number" header="Quotation #" />

        <Column header="Total Amount" sortable :sortField="(data: SupplierQuotation) => data.total_amount">
          <template #body="{ data }">
            <span class="font-semibold">{{ formatCurrency(data.total_amount) }}</span>
          </template>
        </Column>

        <Column field="payment_terms" header="Payment Terms" />

        <Column field="delivery_days" header="Delivery">
          <template #body="{ data }">
            {{ data.delivery_days }} days
          </template>
        </Column>

        <Column header="Shipping">
          <template #body="{ data }">
            {{ formatCurrency(data.shipping_cost || 0) }}
          </template>
        </Column>

        <Column header="Evaluation" sortable :sortField="(data: SupplierQuotation) => data.evaluation_score || 0">
          <template #body="{ data }">
            <Tag
              v-if="data.evaluation_score"
              :value="`${data.evaluation_score.toFixed(1)} / 100`"
              :severity="getScoreSeverity(data.evaluation_score)"
            />
            <span v-else class="text-gray-400 text-xs">Not Evaluated</span>
          </template>
        </Column>

        <Column field="status" header="Status">
          <template #body="{ data }">
            <Tag
              :value="data.status"
              :severity="
                data.status === 'Accepted' ? 'success' :
                data.status === 'Rejected' ? 'danger' :
                data.status === 'Evaluated' ? 'info' :
                'secondary'
              "
            />
          </template>
        </Column>

        <Column header="Valid Until">
          <template #body="{ data }">
            <span class="text-xs">
              {{ new Date(data.valid_until).toLocaleDateString('en-PH') }}
            </span>
          </template>
        </Column>
      </DataTable>

      <!-- Detailed Comparison for Selected -->
      <div v-if="selectedQuotation" class="border rounded-lg p-4 bg-blue-50">
        <h4 class="font-semibold mb-3">{{ selectedQuotation.supplier?.name }} - Details</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span class="font-medium">Subtotal:</span>
            <span class="ml-2">{{ formatCurrency(selectedQuotation.subtotal) }}</span>
          </div>
          <div>
            <span class="font-medium">Shipping:</span>
            <span class="ml-2">{{ formatCurrency(selectedQuotation.shipping_cost || 0) }}</span>
          </div>
          <div>
            <span class="font-medium">Valid Until:</span>
            <span class="ml-2">{{ new Date(selectedQuotation.valid_until).toLocaleDateString('en-PH') }}</span>
          </div>
          <div>
            <span class="font-medium">Payment Terms:</span>
            <span class="ml-2">{{ selectedQuotation.payment_terms }}</span>
          </div>
        </div>

        <!-- Items Comparison -->
        <div v-if="selectedQuotation.items?.length > 0" class="mt-3">
          <h5 class="font-medium text-xs mb-2">Items ({{ selectedQuotation.items.length }})</h5>
          <div class="max-h-40 overflow-y-auto bg-white rounded p-2">
            <table class="w-full text-xs">
              <thead class="bg-gray-100 sticky top-0">
                <tr>
                  <th class="text-left p-1">Product</th>
                  <th class="text-right p-1">Qty</th>
                  <th class="text-right p-1">Unit Price</th>
                  <th class="text-right p-1">Disc %</th>
                  <th class="text-right p-1">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedQuotation.items" :key="item.id" class="border-b">
                  <td class="p-1">{{ item.product?.name }}</td>
                  <td class="text-right p-1">{{ item.quantity }}</td>
                  <td class="text-right p-1">{{ formatCurrency(item.unit_price) }}</td>
                  <td class="text-right p-1">{{ item.discount_percent || 0 }}%</td>
                  <td class="text-right p-1 font-semibold">
                    {{ formatCurrency(item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="selectedQuotation.notes" class="mt-3 text-xs">
          <span class="font-medium">Notes:</span>
          <p class="text-gray-600 mt-1">{{ selectedQuotation.notes }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          @click="handleClose"
        />
        <Button
          label="Select This Quotation"
          severity="success"
          @click="handleSelect"
          :disabled="!selectedQuotation"
        />
      </div>
    </template>
  </Dialog>
</template>
