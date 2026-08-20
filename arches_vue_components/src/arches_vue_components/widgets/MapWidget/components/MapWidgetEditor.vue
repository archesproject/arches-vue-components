<script setup lang="ts">
import { computed, useTemplateRef } from "vue";

import MapComponent from "@/arches_vue_components/components/MapComponent/MapComponent.vue";

import { buildGeoJSONFeatureCollectionAliasedNodeData } from "@/arches_vue_components/datatypes/geojson-feature-collection/utils.ts";

import type { Component } from "vue";
import type { FeatureCollection } from "geojson";

import type { GeoJSONFeatureCollectionAliasedNodeData } from "@/arches_vue_components/datatypes/geojson-feature-collection/types.ts";
import type { MapInteractionItem } from "@/arches_vue_components/components/MapComponent/types.ts";
import type { MapCardXNodeXWidgetData } from "@/arches_vue_components/widgets/MapWidget/types.ts";

const {
    aliasedNodeData,
    cardXNodeXWidgetData = undefined,
    value = undefined,
    interactionItems = undefined,
    featurePopupComponent = undefined,
} = defineProps<{
    aliasedNodeData: GeoJSONFeatureCollectionAliasedNodeData | null;
    cardXNodeXWidgetData?: MapCardXNodeXWidgetData;
    value?: FeatureCollection | null;
    interactionItems?: MapInteractionItem[];
    featurePopupComponent?: Component;
}>();

const emit = defineEmits<{
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
}>();

const resolvedAliasedNodeData = computed(
    () =>
        aliasedNodeData ??
        buildGeoJSONFeatureCollectionAliasedNodeData(value ?? null),
);

const geometryTypes = computed(
    () =>
        cardXNodeXWidgetData?.config?.geometryTypes?.map((geometryType) =>
            geometryType.id.toLowerCase(),
        ) ?? undefined,
);

const componentRef =
    useTemplateRef<InstanceType<typeof MapComponent>>("component");

defineExpose({
    map: computed(() => componentRef.value?.map ?? null),
    context: computed(() => componentRef.value?.context ?? null),
});

function onValueUpdate(updatedValue: FeatureCollection): void {
    emit("update:value", updatedValue);
    emit(
        "update:aliasedNodeData",
        buildGeoJSONFeatureCollectionAliasedNodeData(updatedValue),
    );
}

function onInitialized(initialValue: FeatureCollection): void {
    emit(
        "initialized",
        buildGeoJSONFeatureCollectionAliasedNodeData(initialValue),
    );
}
</script>

<template>
    <MapComponent
        ref="component"
        :value="resolvedAliasedNodeData.node_value"
        :zoom="cardXNodeXWidgetData?.config?.zoom"
        :pitch="cardXNodeXWidgetData?.config?.pitch"
        :bearing="cardXNodeXWidgetData?.config?.bearing"
        :center-x="cardXNodeXWidgetData?.config?.centerX"
        :center-y="cardXNodeXWidgetData?.config?.centerY"
        :min-zoom="cardXNodeXWidgetData?.config?.minZoom"
        :max-zoom="cardXNodeXWidgetData?.config?.maxZoom"
        :basemap="cardXNodeXWidgetData?.config?.basemap"
        :geometry-types="geometryTypes"
        :interaction-items="interactionItems"
        :max-features="cardXNodeXWidgetData?.config?.maxDrawnFeatures"
        :feature-popup-component="featurePopupComponent"
        @update:is-loading="emit('update:isLoading', $event)"
        @update:value="onValueUpdate"
        @update:overlays="emit('update:overlays')"
        @initialized="onInitialized"
    />
</template>
