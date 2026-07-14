<script setup lang="ts">
import { computed, onMounted } from "vue";

import DOMPurify from "dompurify";

import type { StringAliasedNodeData } from "@/arches_vue_components/datatypes/string/types.ts";

const { aliasedNodeData } = defineProps(["aliasedNodeData"]) as {
    aliasedNodeData: StringAliasedNodeData;
};

const emit = defineEmits(["initialized"]) as {
    (event: "initialized", updatedValue: StringAliasedNodeData): void;
};

onMounted(() => {
    emit("initialized", aliasedNodeData);
});

const cleanHtml = computed(() =>
    DOMPurify.sanitize(aliasedNodeData?.display_value ?? "", {
        USE_PROFILES: { html: true },
    }),
);
</script>

<template>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="cleanHtml"></div>
</template>
