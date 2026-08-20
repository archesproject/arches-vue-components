<script setup lang="ts">
import Editor from "primevue/editor";

import FocusController from "@/arches_vue_components/components/RichTextComponent/components/FocusController.vue";

const {
    value = undefined,
    placeholder = undefined,
    required = undefined,
    fieldId = undefined,
} = defineProps<{
    value?: string | null;
    placeholder?: string;
    required?: boolean;
    fieldId?: string;
}>();

const emit = defineEmits<{
    "update:value": [value: string];
}>();

function onUpdateModelValue(updatedValue: string | undefined): void {
    emit("update:value", updatedValue ?? "");
}
</script>

<template>
    <FocusController :field-id="fieldId ?? ''">
        <Editor
            :fluid="true"
            :model-value="value ?? ''"
            :placeholder="placeholder ?? ''"
            :required="required"
            @update:model-value="onUpdateModelValue($event)"
        />
    </FocusController>
</template>
