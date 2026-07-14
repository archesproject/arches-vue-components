<script setup lang="ts">
import { computed } from "vue";

import DomainRadioWidgetEditor from "@/arches_vue_components/widgets/DomainRadioWidget/components/DomainRadioWidgetEditor.vue";
import DomainRadioWidgetViewer from "@/arches_vue_components/widgets/DomainRadioWidget/components/DomainRadioWidgetViewer.vue";

import { buildDomainAliasedNodeData } from "@/arches_vue_components/datatypes/domain/utils.ts";
import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";

import type { DomainAliasedNodeData } from "@/arches_vue_components/datatypes/domain/types.ts";
import type { DomainRadioWidgetProps } from "@/arches_vue_components/widgets/DomainRadioWidget/types.ts";

const { aliasedNodeData, cardXNodeXWidgetData, value } = defineProps([
    "mode",
    "nodeAlias",
    "graphSlug",
    "cardXNodeXWidgetData",
    "aliasedNodeData",
    "value",
]) as DomainRadioWidgetProps;

const emit: {
    (event: "update:value", updatedValue: string | null): void;
    (
        event: "update:aliasedNodeData",
        updatedValue: DomainAliasedNodeData,
    ): void;
    (event: "initialized", updatedValue: DomainAliasedNodeData): void;
} = defineEmits(["update:value", "update:aliasedNodeData", "initialized"]);

const resolvedAliasedNodeData = computed(
    () =>
        aliasedNodeData ??
        buildDomainAliasedNodeData(
            value ?? null,
            cardXNodeXWidgetData?.node.config.options ?? [],
        ),
);

function onUpdateAliasedNodeData(
    updatedAliasedNodeData: DomainAliasedNodeData,
) {
    emit("update:aliasedNodeData", updatedAliasedNodeData);
    emit("update:value", updatedAliasedNodeData.node_value);
}
</script>

<template>
    <DomainRadioWidgetEditor
        v-if="mode === EDIT"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :aliased-node-data="resolvedAliasedNodeData"
        @update:aliased-node-data="onUpdateAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
    <DomainRadioWidgetViewer
        v-if="mode === VIEW"
        :aliased-node-data="resolvedAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
</template>
