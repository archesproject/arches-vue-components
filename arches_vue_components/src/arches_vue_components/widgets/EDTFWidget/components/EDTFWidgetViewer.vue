<script setup lang="ts">
import { onMounted } from "vue";

import type { EDTFAliasedNodeData } from "@/arches_vue_components/datatypes/edtf/types.ts";

const { aliasedNodeData } = defineProps(["aliasedNodeData"]) as {
    aliasedNodeData: EDTFAliasedNodeData;
};

const emit = defineEmits(["initialized"]) as {
    (event: "initialized", updatedValue: EDTFAliasedNodeData): void;
};

onMounted(() => {
    emit("initialized", aliasedNodeData);
});
</script>

<template>
    <div>{{ aliasedNodeData?.display_value }}</div>
</template>
