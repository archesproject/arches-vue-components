<script setup lang="ts">
import { computed } from "vue";

import EDTFWidgetEditor from "@/arches_vue_components/widgets/EDTFWidget/components/EDTFWidgetEditor/EDTFWidgetEditor.vue";
import EDTFWidgetViewer from "@/arches_vue_components/widgets/EDTFWidget/components/EDTFWidgetViewer.vue";

import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";
import { buildEDTFAliasedNodeData } from "@/arches_vue_components/datatypes/edtf/utils.ts";

import type { EDTFAliasedNodeData } from "@/arches_vue_components/datatypes/edtf/types.ts";
import type { EDTFWidgetProps } from "@/arches_vue_components/widgets/EDTFWidget/types.ts";

const { aliasedNodeData, value } = defineProps([
    "mode",
    "nodeAlias",
    "graphSlug",
    "cardXNodeXWidgetData",
    "aliasedNodeData",
    "value",
]) as EDTFWidgetProps;

const emit = defineEmits([
    "update:isDirty",
    "update:value",
    "update:aliasedNodeData",
    "initialized",
]) as {
    (event: "update:isDirty", isDirty: boolean): void;
    (event: "update:value", updatedValue: string | null): void;
    (event: "update:aliasedNodeData", updatedValue: EDTFAliasedNodeData): void;
    (event: "initialized", updatedValue: EDTFAliasedNodeData): void;
};

const resolvedAliasedNodeData = computed(
    () => aliasedNodeData ?? buildEDTFAliasedNodeData(value ?? null),
);

function onUpdateAliasedNodeData(updatedAliasedNodeData: EDTFAliasedNodeData) {
    emit("update:aliasedNodeData", updatedAliasedNodeData);
    emit("update:value", updatedAliasedNodeData.node_value);
}
</script>

<template>
    <EDTFWidgetEditor
        v-if="mode === EDIT"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :aliased-node-data="resolvedAliasedNodeData"
        @update:aliased-node-data="onUpdateAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
    <EDTFWidgetViewer
        v-if="mode === VIEW"
        :aliased-node-data="resolvedAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
</template>
