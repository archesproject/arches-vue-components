<script setup lang="ts">
import { computed, useTemplateRef } from "vue";

import MapWidgetEditor from "@/arches_vue_components/widgets/MapWidget/components/MapWidgetEditor/MapWidgetEditor.vue";
import MapWidgetViewer from "@/arches_vue_components/widgets/MapWidget/components/MapWidgetViewer.vue";

import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";
import { buildGeoJSONFeatureCollectionAliasedNodeData } from "@/arches_vue_components/datatypes/geojson-feature-collection/utils.ts";

import type { FeatureCollection } from "geojson";

import type { GeoJSONFeatureCollectionAliasedNodeData } from "@/arches_vue_components/datatypes/geojson-feature-collection/types.ts";
import type { MapWidgetProps } from "@/arches_vue_components/widgets/MapWidget/types.ts";

const { aliasedNodeData, value } = defineProps([
    "mode",
    "nodeAlias",
    "graphSlug",
    "renderContext",
    "cardXNodeXWidgetData",
    "aliasedNodeData",
    "value",
]) as MapWidgetProps;

const emit = defineEmits([
    "update:isLoading",
    "update:value",
    "update:overlays",
    "update:aliasedNodeData",
    "initialized",
]) as {
    (event: "update:isLoading", isLoading: boolean): void;
    (event: "update:value", updatedValue: FeatureCollection): void;
    (event: "update:overlays"): void;
    (
        event: "update:aliasedNodeData",
        updatedValue: GeoJSONFeatureCollectionAliasedNodeData,
    ): void;
    (
        event: "initialized",
        updatedValue: GeoJSONFeatureCollectionAliasedNodeData,
    ): void;
};

const resolvedAliasedNodeData = computed(
    () =>
        aliasedNodeData ??
        buildGeoJSONFeatureCollectionAliasedNodeData(value ?? null),
);

const editorRef =
    useTemplateRef<InstanceType<typeof MapWidgetEditor>>("editor");

defineExpose({
    map: computed(() => editorRef.value?.map ?? null),
});
</script>

<template>
    <MapWidgetEditor
        v-if="mode === EDIT"
        ref="editor"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :aliased-node-data="resolvedAliasedNodeData"
        :render-context="renderContext"
        @update:is-loading="emit('update:isLoading', $event)"
        @update:value="emit('update:value', $event)"
        @update:aliased-node-data="emit('update:aliasedNodeData', $event)"
        @update:overlays="emit('update:overlays')"
        @initialized="emit('initialized', $event)"
    />
    <MapWidgetViewer
        v-if="mode === VIEW"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :aliased-node-data="resolvedAliasedNodeData"
        @update:is-loading="emit('update:isLoading', $event)"
    />
</template>
