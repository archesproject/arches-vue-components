<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";

import ResourceInstanceSelectWidgetEditor from "@/arches_vue_components/widgets/ResourceInstanceSelectWidget/components/ResourceInstanceSelectWidgetEditor.vue";
import ResourceInstanceSelectWidgetViewer from "@/arches_vue_components/widgets/ResourceInstanceSelectWidget/components/ResourceInstanceSelectWidgetViewer.vue";

import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";
import { useResourceDisplayNameResolver } from "@/arches_vue_components/datatypes/resource-instance/useResourceDisplayNameResolver.ts";
import { buildResourceInstanceAliasedNodeData } from "@/arches_vue_components/datatypes/resource-instance/utils.ts";

import type {
    ResourceInstanceAliasedNodeData,
    ResourceInstanceReference,
} from "@/arches_vue_components/datatypes/resource-instance/types";
import type { ResourceInstanceSelectWidgetProps } from "@/arches_vue_components/widgets/ResourceInstanceSelectWidget/types.ts";

const {
    aliasedNodeData,
    mode,
    nodeAlias,
    graphSlug,
    cardXNodeXWidgetData,
    value,
    defaultTerm,
} = defineProps([
    "mode",
    "nodeAlias",
    "graphSlug",
    "cardXNodeXWidgetData",
    "aliasedNodeData",
    "value",
    "defaultTerm",
]) as ResourceInstanceSelectWidgetProps;

const emit: {
    (event: "update:isLoading", isLoading: boolean): void;
    (
        event: "update:value",
        updatedValue: ResourceInstanceReference | null,
    ): void;
    (
        event: "update:aliasedNodeData",
        updatedValue: ResourceInstanceAliasedNodeData,
    ): void;
    (event: "initialized", updatedValue: ResourceInstanceAliasedNodeData): void;
} = defineEmits([
    "update:isLoading",
    "update:value",
    "update:aliasedNodeData",
    "initialized",
]);

const isEditorLoading = ref(false);

const { displayValue: resolvedDisplayValue, loading } =
    useResourceDisplayNameResolver(
        toRef(() => {
            if (!aliasedNodeData) {
                return value ?? null;
            }
            return null;
        }),
        graphSlug ?? "",
        nodeAlias ?? "",
    );

const resolvedAliasedNodeData = computed(() => {
    if (aliasedNodeData) {
        return aliasedNodeData;
    }
    if (loading.value) {
        return null;
    }

    return buildResourceInstanceAliasedNodeData(
        value ?? null,
        resolvedDisplayValue.value ?? "",
    );
});

watch([loading, isEditorLoading], ([resolverLoading, editorLoading]) =>
    emit("update:isLoading", resolverLoading || editorLoading),
);

function onUpdateAliasedNodeData(
    updatedAliasedNodeData: ResourceInstanceAliasedNodeData,
) {
    emit("update:aliasedNodeData", updatedAliasedNodeData);
    emit("update:value", updatedAliasedNodeData.node_value?.[0] ?? null);
}
</script>

<template>
    <ResourceInstanceSelectWidgetEditor
        v-if="mode === EDIT"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :graph-slug="graphSlug"
        :node-alias="nodeAlias"
        :aliased-node-data="resolvedAliasedNodeData"
        :default-term="defaultTerm"
        @update:is-loading="isEditorLoading = $event"
        @update:aliased-node-data="onUpdateAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
    <ResourceInstanceSelectWidgetViewer
        v-if="mode === VIEW"
        :aliased-node-data="resolvedAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
</template>
