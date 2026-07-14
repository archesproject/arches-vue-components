<script setup lang="ts">
import { computed } from "vue";

import DomainMultiselectWidgetEditor from "@/arches_vue_components/widgets/DomainMultiselectWidget/components/DomainMultiselectWidgetEditor.vue";
import DomainMultiselectWidgetViewer from "@/arches_vue_components/widgets/DomainMultiselectWidget/components/DomainMultiselectWidgetViewer.vue";

import { buildDomainListAliasedNodeData } from "@/arches_vue_components/datatypes/domain/utils.ts";
import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";

import type { DomainListAliasedNodeData } from "@/arches_vue_components/datatypes/domain/types.ts";
import type { DomainMultiselectWidgetProps } from "@/arches_vue_components/widgets/DomainMultiselectWidget/types.ts";

const { aliasedNodeData, cardXNodeXWidgetData, value } = defineProps([
    "mode",
    "nodeAlias",
    "graphSlug",
    "cardXNodeXWidgetData",
    "aliasedNodeData",
    "value",
]) as DomainMultiselectWidgetProps;

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
    <DomainMultiselectWidgetEditor
        v-if="mode === EDIT"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :aliased-node-data="resolvedAliasedNodeData"
        @update:aliased-node-data="onUpdateAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
    <DomainMultiselectWidgetViewer
        v-if="mode === VIEW"
        :aliased-node-data="resolvedAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
</template>
