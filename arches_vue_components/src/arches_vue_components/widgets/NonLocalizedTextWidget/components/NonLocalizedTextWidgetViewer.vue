<script setup lang="ts">
import { onMounted } from "vue";

import type { NonLocalizedTextAliasedNodeData } from "@/arches_vue_components/datatypes/non-localized-text/types.ts";

const { aliasedNodeData } = defineProps(["aliasedNodeData"]) as {
    aliasedNodeData: NonLocalizedTextAliasedNodeData;
};

const emit = defineEmits(["initialized"]) as {
    (event: "initialized", updatedValue: NonLocalizedTextAliasedNodeData): void;
};

onMounted(() => {
    emit("initialized", aliasedNodeData);
});
</script>

<template>
    <div>{{ aliasedNodeData?.display_value }}</div>
</template>
