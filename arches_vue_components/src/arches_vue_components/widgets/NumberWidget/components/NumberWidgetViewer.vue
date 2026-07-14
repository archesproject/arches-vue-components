<script setup lang="ts">
import { onMounted } from "vue";

import type { NumberAliasedNodeData } from "@/arches_vue_components/datatypes/number/types.ts";

const { aliasedNodeData } = defineProps(["aliasedNodeData"]) as {
    aliasedNodeData: NumberAliasedNodeData;
};

const emit = defineEmits(["initialized"]) as {
    (event: "initialized", updatedValue: NumberAliasedNodeData): void;
};

onMounted(() => {
    emit("initialized", aliasedNodeData);
});
</script>

<template>
    <div>{{ aliasedNodeData?.display_value }}</div>
</template>
