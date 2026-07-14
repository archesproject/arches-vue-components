<script setup lang="ts">
import { computed } from "vue";

import NumberWidgetEditor from "@/arches_vue_components/widgets/NumberWidget/components/NumberWidgetEditor.vue";
import NumberWidgetViewer from "@/arches_vue_components/widgets/NumberWidget/components/NumberWidgetViewer.vue";

import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";
import { buildNumberAliasedNodeData } from "@/arches_vue_components/datatypes/number/utils.ts";

import type { NumberAliasedNodeData } from "@/arches_vue_components/datatypes/number/types.ts";
import type { NumberWidgetProps } from "@/arches_vue_components/widgets/NumberWidget/types.ts";

const { aliasedNodeData, value } = defineProps([
    "mode",
    "nodeAlias",
    "graphSlug",
    "cardXNodeXWidgetData",
    "aliasedNodeData",
    "value",
]) as NumberWidgetProps;

const emit: {
    (event: "update:isDirty", isDirty: boolean): void;
    (event: "update:value", updatedValue: number | null): void;
    (
        event: "update:aliasedNodeData",
        updatedValue: NumberAliasedNodeData,
    ): void;
    (event: "initialized", updatedValue: NumberAliasedNodeData): void;
} = defineEmits([
    "update:isDirty",
    "update:value",
    "update:aliasedNodeData",
    "initialized",
]);

const resolvedAliasedNodeData = computed(
    () => aliasedNodeData ?? buildNumberAliasedNodeData(value ?? null),
);

function onUpdateAliasedNodeData(
    updatedAliasedNodeData: NumberAliasedNodeData,
) {
    emit("update:aliasedNodeData", updatedAliasedNodeData);
    emit("update:value", updatedAliasedNodeData.node_value);
}
</script>

<template>
    <NumberWidgetEditor
        v-if="mode === EDIT"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :aliased-node-data="resolvedAliasedNodeData"
        @update:aliased-node-data="onUpdateAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
    <NumberWidgetViewer
        v-if="mode === VIEW"
        :aliased-node-data="resolvedAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
</template>
