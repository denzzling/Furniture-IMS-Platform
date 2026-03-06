<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="!loading"
    :style="{ width: '40vw' }"
    @update:visible="handleClose"
  >
    <template #header>
      <h3 class="text-xl font-semibold">Pick Storage Location</h3>
    </template>

    <div>
      <!-- Warehouse Section -->
      <div class="mb-4">
        <label for="warehouse_section" class="block text-sm font-medium mb-2">
          Warehouse Section <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-2">
          <Select
            v-if="!showAddSection"
            id="warehouse_section"
            v-model="location.warehouse_section"
            :options="warehouseSections"
            placeholder="Select warehouse section"
            class="flex-1"
            show-clear
          />
          <InputText
            v-else
            v-model="newSection"
            placeholder="Enter new warehouse section..."
            class="flex-1"
          />
          <Button
            :label="showAddSection ? 'Cancel' : 'Add New'"
            :icon="showAddSection ? 'pi pi-times' : 'pi pi-plus'"
            :severity="showAddSection ? 'secondary' : 'success'"
            outlined
            @click="toggleAddSection"
          />
        </div>
      </div>

      <!-- Aisle -->
      <div class="mb-4">
        <label for="aisle" class="block text-sm font-medium mb-2">
          Aisle
        </label>
        <InputText
          id="aisle"
          v-model="location.aisle"
          placeholder="e.g., A, B, C"
          class="w-full"
        />
        <small class="text-gray-500">Aisle identifier (optional)</small>
      </div>

      <!-- Rack -->
      <div class="mb-4">
        <label for="rack" class="block text-sm font-medium mb-2">
          Rack
        </label>
        <InputText
          id="rack"
          v-model="location.rack"
          placeholder="e.g., 1, 2, 3"
          class="w-full"
        />
        <small class="text-gray-500">Rack number (optional)</small>
      </div>

      <!-- Shelf -->
      <div class="mb-4">
        <label for="shelf" class="block text-sm font-medium mb-2">
          Shelf
        </label>
        <InputText
          id="shelf"
          v-model="location.shelf"
          placeholder="e.g., A, B, C, 1, 2, 3"
          class="w-full"
        />
        <small class="text-gray-500">Shelf identifier (optional)</small>
      </div>

      <!-- Auto-generated Bin Code Preview -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">
          Bin Code <span class="text-gray-400">(Auto-Generated)</span>
        </label>
        <div class="p-3 bg-blue-50 border border-blue-200 rounded">
          <div class="flex items-center gap-2">
            <i class="pi pi-tag text-blue-600"></i>
            <span class="font-mono text-lg font-bold text-blue-900">
              {{ generatedBinCode || 'N/A' }}
            </span>
          </div>
          <small class="text-blue-700 block mt-1">
            Format: Section-Aisle-Rack-Shelf
          </small>
        </div>
      </div>

      <!-- Full Location Preview -->
      <Card class="bg-gray-50">
        <template #content>
          <div>
            <label class="block text-xs text-gray-600 mb-2">Full Location Preview</label>
            <div class="flex items-center gap-2 flex-wrap">
              <Tag
                v-if="location.warehouse_section || newSection"
                :value="`Section: ${location.warehouse_section || newSection}`"
                severity="info"
              />
              <Tag
                v-if="location.aisle"
                :value="`Aisle: ${location.aisle}`"
                severity="info"
              />
              <Tag
                v-if="location.rack"
                :value="`Rack: ${location.rack}`"
                severity="info"
              />
              <Tag
                v-if="location.shelf"
                :value="`Shelf: ${location.shelf}`"
                severity="info"
              />
              <span v-if="!hasAnyLocationData" class="text-sm text-gray-500 italic">
                No location data entered
              </span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          @click="handleClose"
          :disabled="loading"
        />
        <Button
          label="Select Location"
          icon="pi pi-check"
          severity="primary"
          @click="handleSelect"
          :loading="loading"
          :disabled="!isValid"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Select from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Button from 'primevue/button';

/**
 * Location data interface
 */
interface LocationData {
  warehouse_section: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin_code: string;
}

/**
 * Props interface
 */
interface Props {
  visible: boolean;
  initialLocation?: Partial<LocationData>;
}

/**
 * Emits interface
 */
interface Emits {
  (e: 'select', location: LocationData): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  initialLocation: () => ({}),
});

const emit = defineEmits<Emits>();

// Refs
const loading = ref(false);
const showAddSection = ref(false);
const newSection = ref('');

const location = ref<LocationData>({
  warehouse_section: '',
  aisle: '',
  rack: '',
  shelf: '',
  bin_code: '',
});

// Pre-defined warehouse sections
const warehouseSections = ref<string[]>([
  'Main Storage',
  'Cold Storage',
  'High-Value Items',
  'Bulk Storage',
  'Receiving Area',
  'Staging Area',
  'Returns Processing',
  'Damaged Goods',
]);

// Computed
const generatedBinCode = computed(() => {
  const section = showAddSection.value ? newSection.value : location.value.warehouse_section;
  const parts = [
    section ? section.substring(0, 3).toUpperCase() : '',
    location.value.aisle ? location.value.aisle.toUpperCase() : '',
    location.value.rack || '',
    location.value.shelf ? location.value.shelf.toUpperCase() : '',
  ].filter(Boolean);

  return parts.length > 0 ? parts.join('-') : '';
});

const hasAnyLocationData = computed(() => {
  return !!(
    location.value.warehouse_section ||
    newSection.value ||
    location.value.aisle ||
    location.value.rack ||
    location.value.shelf
  );
});

const isValid = computed(() => {
  return !!(location.value.warehouse_section || newSection.value);
});

/**
 * Toggle add new section
 */
const toggleAddSection = (): void => {
  showAddSection.value = !showAddSection.value;
  if (showAddSection.value) {
    location.value.warehouse_section = '';
  } else {
    newSection.value = '';
  }
};

/**
 * Handle select location
 */
const handleSelect = (): void => {
  if (!isValid.value) return;

  const selectedLocation: LocationData = {
    warehouse_section: showAddSection.value ? newSection.value : location.value.warehouse_section,
    aisle: location.value.aisle,
    rack: location.value.rack,
    shelf: location.value.shelf,
    bin_code: generatedBinCode.value,
  };

  // Add new section to the list if entered
  if (showAddSection.value && newSection.value) {
    warehouseSections.value.push(newSection.value);
  }

  loading.value = true;
  emit('select', selectedLocation);
};

/**
 * Handle close
 */
const handleClose = (): void => {
  if (!loading.value) {
    resetForm();
    emit('close');
  }
};

/**
 * Reset form
 */
const resetForm = (): void => {
  location.value = {
    warehouse_section: '',
    aisle: '',
    rack: '',
    shelf: '',
    bin_code: '',
  };
  showAddSection.value = false;
  newSection.value = '';
  loading.value = false;
};

// Watch visible prop to initialize or reset
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // Initialize with initial location if provided
    if (props.initialLocation) {
      location.value = {
        warehouse_section: props.initialLocation.warehouse_section || '',
        aisle: props.initialLocation.aisle || '',
        rack: props.initialLocation.rack || '',
        shelf: props.initialLocation.shelf || '',
        bin_code: props.initialLocation.bin_code || '',
      };
    }
  } else {
    resetForm();
  }
});
</script>
