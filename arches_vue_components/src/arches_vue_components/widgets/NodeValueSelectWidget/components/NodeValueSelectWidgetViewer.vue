<script setup lang="ts">
import { onMounted } from "vue";

import type { NodeValueAliasedNodeData } from "@/arches_vue_components/datatypes/node-value/types.ts";

const { aliasedNodeData } = defineProps(["aliasedNodeData"]) as {
    aliasedNodeData: NodeValueAliasedNodeData;
};

const emit = defineEmits(["initialized"]) as {
    (event: "initialized", updatedValue: NodeValueAliasedNodeData): void;
};

onMounted(() => {
    emit("initialized", aliasedNodeData);
});
</script>

<template>
    <div>{{ aliasedNodeData?.display_value }}</div>
</template>
