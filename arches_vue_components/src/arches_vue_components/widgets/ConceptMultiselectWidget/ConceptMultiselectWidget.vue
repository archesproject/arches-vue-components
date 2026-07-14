<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";

import ConceptMultiSelectWidgetEditor from "@/arches_vue_components/widgets/ConceptMultiselectWidget/components/ConceptMultiselectWidgetEditor.vue";
import ConceptMultiSelectWidgetViewer from "@/arches_vue_components/widgets/ConceptMultiselectWidget/components/ConceptMultiselectWidgetViewer.vue";

import { useConceptLabelsResolver } from "@/arches_vue_components/datatypes/concept-list/useConceptLabelsResolver.ts";
import { buildConceptListAliasedNodeData } from "@/arches_vue_components/datatypes/concept-list/utils.ts";

import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";

import type { ConceptListAliasedNodeData } from "@/arches_vue_components/datatypes/concept-list/types.ts";
import type { ConceptMultiselectWidgetProps } from "@/arches_vue_components/widgets/ConceptMultiselectWidget/types.ts";

const { aliasedNodeData, graphSlug, nodeAlias, value } = defineProps([
    "mode",
    "nodeAlias",
    "graphSlug",
    "cardXNodeXWidgetData",
    "aliasedNodeData",
    "value",
]) as ConceptMultiselectWidgetProps;

const emit: {
    (event: "update:isLoading", isLoading: boolean): void;
    (event: "update:value", updatedValue: string[] | null): void;
    (
        event: "update:aliasedNodeData",
        updatedValue: ConceptListAliasedNodeData,
    ): void;
    (event: "initialized", updatedValue: ConceptListAliasedNodeData): void;
} = defineEmits([
    "update:isLoading",
    "update:value",
    "update:aliasedNodeData",
    "initialized",
]);

const { resolvedItems, loading } = useConceptLabelsResolver(
    toRef(() => {
        if (!aliasedNodeData) {
            return value ?? null;
        }
        return null;
    }),
    graphSlug ?? "",
    nodeAlias ?? "",
);

const isEditorLoading = ref(false);

const resolvedAliasedNodeData = computed(() => {
    if (aliasedNodeData) {
        return aliasedNodeData;
    }
    if (loading.value) {
        return null;
    }

    return buildConceptListAliasedNodeData(value ?? null, resolvedItems.value);
});

watch([loading, isEditorLoading], ([resolverLoading, editorLoading]) =>
    emit("update:isLoading", resolverLoading || editorLoading),
);

function onUpdateAliasedNodeData(
    updatedAliasedNodeData: ConceptListAliasedNodeData,
) {
    emit("update:aliasedNodeData", updatedAliasedNodeData);
    emit("update:value", updatedAliasedNodeData.node_value);
}
</script>

<template>
    <ConceptMultiSelectWidgetEditor
        v-if="mode === EDIT"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :graph-slug="graphSlug"
        :node-alias="nodeAlias"
        :aliased-node-data="resolvedAliasedNodeData"
        @update:is-loading="isEditorLoading = $event"
        @update:aliased-node-data="onUpdateAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
    <ConceptMultiSelectWidgetViewer
        v-if="mode === VIEW"
        :aliased-node-data="resolvedAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
</template>
