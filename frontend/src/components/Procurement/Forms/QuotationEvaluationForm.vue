<script setup lang="ts">
import { reactive, computed } from 'vue';
import { SupplierQuotation } from '@/types/procurement';

const props = defineProps<{
  quotation: SupplierQuotation;
}>();

const emit = defineEmits<{
  submit: [data: { 
    quotation_id: number; 
    scores: Record<string, number>; 
    total_score: number; 
    recommendation: 'accept' | 'reject'; 
    notes: string;
  }];
  cancel: [];
}>();

// Evaluation criteria with weights
const criteria = {
  price: { label: 'Price Competitiveness', weight: 40, max: 100 },
  delivery: { label: 'Delivery Time', weight: 30, max: 100 },
  quality: { label: 'Quality & Specifications', weight: 20, max: 100 },
  supplier_history: { label: 'Supplier Performance History', weight: 10, max: 100 }
};

const formData = reactive({
  scores: {
    price: 0,
    delivery: 0,
    quality: 0,
    supplier_history: 0
  },
  recommendation: '' as 'accept' | 'reject' | '',
  notes: ''
});

const errors = reactive({
  recommendation: '',
  notes: ''
});

const calculateWeightedScore = (criterionKey: string, score: number): number => {
  const criterion = criteria[criterionKey as keyof typeof criteria];
  return (score / criterion.max) * criterion.weight;
};

const totalScore = computed(() => {
  return Object.keys(formData.scores).reduce((total, key) => {
    return total + calculateWeightedScore(key, formData.scores[key as keyof typeof formData.scores]);
  }, 0);
});

const scoreGrade = computed(() => {
  const score = totalScore.value;
  if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
  if (score >= 75) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
  if (score >= 60) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
});

const suggestedRecommendation = computed(() => {
  return totalScore.value >= 70 ? 'accept' : 'reject';
});

const validateForm = (): boolean => {
  let isValid = true;
  
  Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '');

  if (!formData.recommendation) {
    errors.recommendation = 'Please select a recommendation';
    isValid = false;
  }

  if (!formData.notes.trim()) {
    errors.notes = 'Evaluation notes are required';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = () => {
  if (!validateForm()) return;
  
  emit('submit', {
    quotation_id: props.quotation.id,
    scores: formData.scores,
    total_score: totalScore.value,
    recommendation: formData.recommendation,
    notes: formData.notes
  });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Quotation Details -->
    <div class="border rounded-lg p-4 bg-gray-50">
      <h3 class="text-lg font-semibold mb-3">Quotation Details</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div>
          <span class="font-medium">Quotation #:</span>
          <span class="ml-2">{{ quotation.quotation_number }}</span>
        </div>
        <div>
          <span class="font-medium">Supplier:</span>
          <span class="ml-2">{{ quotation.supplier?.name }}</span>
        </div>
        <div>
          <span class="font-medium">Total Amount:</span>
          <span class="ml-2 font-semibold text-blue-600">{{ formatCurrency(quotation.total_amount) }}</span>
        </div>
        <div>
          <span class="font-medium">Payment Terms:</span>
          <span class="ml-2">{{ quotation.payment_terms }}</span>
        </div>
        <div>
          <span class="font-medium">Delivery Days:</span>
          <span class="ml-2">{{ quotation.delivery_days }} days</span>
        </div>
        <div>
          <span class="font-medium">Valid Until:</span>
          <span class="ml-2">{{ new Date(quotation.valid_until).toLocaleDateString('en-PH') }}</span>
        </div>
      </div>
    </div>

    <!-- Evaluation Criteria -->
    <div class="border rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-4">Evaluation Criteria</h3>
      
      <div class="space-y-6">
        <!-- Price Competitiveness (40%) -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="font-medium text-sm">
              {{ criteria.price.label }}
              <span class="text-gray-500 text-xs ml-1">(Weight: {{ criteria.price.weight }}%)</span>
            </label>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold">{{ formData.scores.price }}/{{ criteria.price.max }}</span>
              <span class="text-xs text-gray-500">
                = {{ calculateWeightedScore('price', formData.scores.price).toFixed(1) }} pts
              </span>
            </div>
          </div>
          <Slider
            v-model="formData.scores.price"
            :min="0"
            :max="criteria.price.max"
            :step="1"
            class="w-full"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Not Competitive</span>
            <span>Highly Competitive</span>
          </div>
        </div>

        <!-- Delivery Time (30%) -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="font-medium text-sm">
              {{ criteria.delivery.label }}
              <span class="text-gray-500 text-xs ml-1">(Weight: {{ criteria.delivery.weight }}%)</span>
            </label>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold">{{ formData.scores.delivery }}/{{ criteria.delivery.max }}</span>
              <span class="text-xs text-gray-500">
                = {{ calculateWeightedScore('delivery', formData.scores.delivery).toFixed(1) }} pts
              </span>
            </div>
          </div>
          <Slider
            v-model="formData.scores.delivery"
            :min="0"
            :max="criteria.delivery.max"
            :step="1"
            class="w-full"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Too Long</span>
            <span>Excellent</span>
          </div>
        </div>

        <!-- Quality & Specifications (20%) -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="font-medium text-sm">
              {{ criteria.quality.label }}
              <span class="text-gray-500 text-xs ml-1">(Weight: {{ criteria.quality.weight }}%)</span>
            </label>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold">{{ formData.scores.quality }}/{{ criteria.quality.max }}</span>
              <span class="text-xs text-gray-500">
                = {{ calculateWeightedScore('quality', formData.scores.quality).toFixed(1) }} pts
              </span>
            </div>
          </div>
          <Slider
            v-model="formData.scores.quality"
            :min="0"
            :max="criteria.quality.max"
            :step="1"
            class="w-full"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Below Spec</span>
            <span>Exceeds Spec</span>
          </div>
        </div>

        <!-- Supplier Performance History (10%) -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="font-medium text-sm">
              {{ criteria.supplier_history.label }}
              <span class="text-gray-500 text-xs ml-1">(Weight: {{ criteria.supplier_history.weight }}%)</span>
            </label>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold">{{ formData.scores.supplier_history }}/{{ criteria.supplier_history.max }}</span>
              <span class="text-xs text-gray-500">
                = {{ calculateWeightedScore('supplier_history', formData.scores.supplier_history).toFixed(1) }} pts
              </span>
            </div>
          </div>
          <Slider
            v-model="formData.scores.supplier_history"
            :min="0"
            :max="criteria.supplier_history.max"
            :step="1"
            class="w-full"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Poor History</span>
            <span>Excellent History</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Total Score Display -->
    <div :class="['border rounded-lg p-6 text-center', scoreGrade.bg]">
      <h3 class="text-sm font-medium text-gray-600 mb-2">Total Evaluation Score</h3>
      <div :class="['text-5xl font-bold mb-2', scoreGrade.color]">
        {{ totalScore.toFixed(1) }}
      </div>
      <div class="text-sm">
        <span class="font-semibold">Grade: </span>
        <span :class="scoreGrade.color">{{ scoreGrade.label }}</span>
      </div>
      <div class="mt-3 text-xs text-gray-600">
        <div>Price: {{ calculateWeightedScore('price', formData.scores.price).toFixed(1) }}</div>
        <div>Delivery: {{ calculateWeightedScore('delivery', formData.scores.delivery).toFixed(1) }}</div>
        <div>Quality: {{ calculateWeightedScore('quality', formData.scores.quality).toFixed(1) }}</div>
        <div>History: {{ calculateWeightedScore('supplier_history', formData.scores.supplier_history).toFixed(1) }}</div>
      </div>
    </div>

    <!-- Recommendation -->
    <div class="border rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-3">
        Recommendation <span class="text-red-500">*</span>
      </h3>
      
      <div v-if="suggestedRecommendation" class="mb-3 p-3 bg-blue-50 rounded text-sm">
        <i class="pi pi-info-circle mr-2"></i>
        Based on the total score ({{ totalScore.toFixed(1) }}), suggested recommendation:
        <span class="font-semibold ml-1">{{ suggestedRecommendation.toUpperCase() }}</span>
      </div>

      <div class="flex gap-4">
        <div class="flex items-center">
          <RadioButton
            inputId="accept"
            v-model="formData.recommendation"
            value="accept"
          />
          <label for="accept" class="ml-2 cursor-pointer">
            <span class="font-medium text-green-600">Accept Quotation</span>
          </label>
        </div>
        <div class="flex items-center">
          <RadioButton
            inputId="reject"
            v-model="formData.recommendation"
            value="reject"
          />
          <label for="reject" class="ml-2 cursor-pointer">
            <span class="font-medium text-red-600">Reject Quotation</span>
          </label>
        </div>
      </div>
      <small v-if="errors.recommendation" class="text-red-500 block mt-2">{{ errors.recommendation }}</small>
    </div>

    <!-- Evaluation Notes -->
    <div class="flex flex-col gap-2">
      <label for="notes" class="font-medium text-sm">
        Evaluation Notes <span class="text-red-500">*</span>
      </label>
      <Textarea
        id="notes"
        v-model="formData.notes"
        rows="4"
        placeholder="Provide detailed justification for your evaluation and recommendation..."
        :class="{ 'p-invalid': errors.notes }"
      />
      <small v-if="errors.notes" class="text-red-500">{{ errors.notes }}</small>
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
        type="submit"
        label="Submit Evaluation"
        icon="pi pi-check"
        :severity="formData.recommendation === 'accept' ? 'success' : formData.recommendation === 'reject' ? 'danger' : 'primary'"
      />
    </div>
  </form>
</template>
