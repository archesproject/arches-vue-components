<script setup lang="ts">
import { onMounted } from "vue";

import type { DateAliasedNodeData } from "@/arches_vue_components/datatypes/date/types.ts";

const { aliasedNodeData } = defineProps(["aliasedNodeData"]) as {
    aliasedNodeData: DateAliasedNodeData;
};

const emit = defineEmits(["initialized"]) as {
    (event: "initialized", updatedValue: DateAliasedNodeData): void;
};

onMounted(() => {
    emit("initialized", aliasedNodeData);
});
</script>

<template>
    <div>{{ aliasedNodeData?.display_value }}</div>
</template>
