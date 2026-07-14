<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";

import ConceptRadioWidgetEditor from "@/arches_vue_components/widgets/ConceptRadioWidget/components/ConceptRadioWidgetEditor.vue";
import ConceptRadioWidgetViewer from "@/arches_vue_components/widgets/ConceptRadioWidget/components/ConceptRadioWidgetViewer.vue";

import { useConceptLabelResolver } from "@/arches_vue_components/datatypes/concept/useConceptLabelResolver.ts";
import { buildConceptAliasedNodeData } from "@/arches_vue_components/datatypes/concept/utils.ts";

import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";

import type { ConceptAliasedNodeData } from "@/arches_vue_components/datatypes/concept/types.ts";
import type { ConceptRadioWidgetProps } from "@/arches_vue_components/widgets/ConceptRadioWidget/types.ts";

const { aliasedNodeData, graphSlug, nodeAlias, value } = defineProps([
    "mode",
    "nodeAlias",
    "graphSlug",
    "cardXNodeXWidgetData",
    "aliasedNodeData",
    "value",
]) as ConceptRadioWidgetProps;

const emit: {
    (event: "update:isDirty", isDirty: boolean): void;
    (event: "update:isLoading", isLoading: boolean): void;
    (event: "update:value", updatedValue: string | null): void;
    (
        event: "update:aliasedNodeData",
        updatedValue: ConceptAliasedNodeData,
    ): void;
    (event: "initialized", updatedValue: ConceptAliasedNodeData): void;
} = defineEmits([
    "update:isDirty",
    "update:isLoading",
    "update:value",
    "update:aliasedNodeData",
    "initialized",
]);

const { resolved, loading } = useConceptLabelResolver(
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
    return buildConceptAliasedNodeData(
        value ?? null,
        resolved.value ? [resolved.value] : [],
    );
});

watch([loading, isEditorLoading], ([resolverLoading, editorLoading]) =>
    emit("update:isLoading", resolverLoading || editorLoading),
);

function onUpdateAliasedNodeData(
    updatedAliasedNodeData: ConceptAliasedNodeData,
) {
    emit("update:aliasedNodeData", updatedAliasedNodeData);
    emit("update:value", updatedAliasedNodeData.node_value);
}
</script>

<template>
    <ConceptRadioWidgetEditor
        v-if="mode === EDIT"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :graph-slug="graphSlug"
        :node-alias="nodeAlias"
        :aliased-node-data="resolvedAliasedNodeData"
        @update:is-loading="isEditorLoading = $event"
        @update:aliased-node-data="onUpdateAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
    <ConceptRadioWidgetViewer
        v-if="mode === VIEW"
        :aliased-node-data="resolvedAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
</template>
