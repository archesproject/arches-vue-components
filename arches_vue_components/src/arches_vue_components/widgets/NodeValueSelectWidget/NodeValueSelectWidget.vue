<script setup lang="ts">
import { computed } from "vue";

import NodeValueSelectWidgetEditor from "@/arches_vue_components/widgets/NodeValueSelectWidget/components/NodeValueSelectWidgetEditor.vue";
import NodeValueSelectWidgetViewer from "@/arches_vue_components/widgets/NodeValueSelectWidget/components/NodeValueSelectWidgetViewer.vue";

import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";
import { buildNodeValueAliasedNodeData } from "@/arches_vue_components/datatypes/node-value/utils.ts";

import type { NodeValueAliasedNodeData } from "@/arches_vue_components/datatypes/node-value/types.ts";
import type { NodeValueSelectWidgetProps } from "@/arches_vue_components/widgets/NodeValueSelectWidget/types.ts";

const { aliasedNodeData, value } = defineProps([
    "mode",
    "nodeAlias",
    "graphSlug",
    "cardXNodeXWidgetData",
    "aliasedNodeData",
    "value",
]) as NodeValueSelectWidgetProps;

const emit = defineEmits([
    "update:value",
    "update:aliasedNodeData",
    "initialized",
]) as {
    (event: "update:value", updatedValue: string | null): void;
    (
        event: "update:aliasedNodeData",
        updatedValue: NodeValueAliasedNodeData,
    ): void;
    (event: "initialized", updatedValue: NodeValueAliasedNodeData): void;
};

const resolvedAliasedNodeData = computed(
    () => aliasedNodeData ?? buildNodeValueAliasedNodeData(value ?? null),
);

function onUpdateAliasedNodeData(
    updatedAliasedNodeData: NodeValueAliasedNodeData,
) {
    emit("update:aliasedNodeData", updatedAliasedNodeData);
    emit("update:value", updatedAliasedNodeData.node_value);
}
</script>

<template>
    <NodeValueSelectWidgetEditor
        v-if="mode === EDIT"
        :aliased-node-data="resolvedAliasedNodeData"
        @update:aliased-node-data="onUpdateAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
    <NodeValueSelectWidgetViewer
        v-if="mode === VIEW"
        :aliased-node-data="resolvedAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
</template>
