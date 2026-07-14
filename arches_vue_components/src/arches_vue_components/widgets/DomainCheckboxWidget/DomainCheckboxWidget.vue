<script setup lang="ts">
import { computed } from "vue";

import DomainCheckboxWidgetEditor from "@/arches_vue_components/widgets/DomainCheckboxWidget/components/DomainCheckboxWidgetEditor.vue";
import DomainCheckboxWidgetViewer from "@/arches_vue_components/widgets/DomainCheckboxWidget/components/DomainCheckboxWidgetViewer.vue";

import { buildDomainListAliasedNodeData } from "@/arches_vue_components/datatypes/domain/utils.ts";
import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";

import type { DomainListAliasedNodeData } from "@/arches_vue_components/datatypes/domain/types.ts";
import type { DomainCheckboxWidgetProps } from "@/arches_vue_components/widgets/DomainCheckboxWidget/types.ts";

const { aliasedNodeData, cardXNodeXWidgetData, value } = defineProps([
    "mode",
    "nodeAlias",
    "graphSlug",
    "cardXNodeXWidgetData",
    "aliasedNodeData",
    "value",
]) as DomainCheckboxWidgetProps;

const emit: {
    (event: "update:value", updatedValue: string[] | null): void;
    (
        event: "update:aliasedNodeData",
        updatedValue: DomainListAliasedNodeData,
    ): void;
    (event: "initialized", updatedValue: DomainListAliasedNodeData): void;
} = defineEmits(["update:value", "update:aliasedNodeData", "initialized"]);

const resolvedAliasedNodeData = computed(
    () =>
        aliasedNodeData ??
        buildDomainListAliasedNodeData(
            value ?? null,
            cardXNodeXWidgetData?.node.config.options ?? [],
        ),
);

function onUpdateAliasedNodeData(
    updatedAliasedNodeData: DomainListAliasedNodeData,
) {
    emit("update:aliasedNodeData", updatedAliasedNodeData);
    emit("update:value", updatedAliasedNodeData.node_value);
}
</script>

<template>
    <DomainCheckboxWidgetEditor
        v-if="mode === EDIT"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :aliased-node-data="resolvedAliasedNodeData"
        @update:aliased-node-data="onUpdateAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
    <DomainCheckboxWidgetViewer
        v-if="mode === VIEW"
        :aliased-node-data="resolvedAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
</template>
