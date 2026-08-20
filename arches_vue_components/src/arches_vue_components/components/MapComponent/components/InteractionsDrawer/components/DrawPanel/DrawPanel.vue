<script setup lang="ts">
import { useGettext } from "vue3-gettext";

import Button from "primevue/button";

import BufferControls from "@/arches_vue_components/components/MapComponent/components/InteractionsDrawer/components/DrawPanel/components/BufferControls.vue";
import DrawControls from "@/arches_vue_components/components/MapComponent/components/InteractionsDrawer/components/DrawPanel/components/DrawControls.vue";
import DrawnFeaturesList from "@/arches_vue_components/components/MapComponent/components/InteractionsDrawer/components/DrawPanel/components/DrawnFeaturesList.vue";
import ShapefileDropZone from "@/arches_vue_components/components/MapComponent/components/InteractionsDrawer/components/DrawPanel/components/ShapefileDropZone.vue";

import { useResolvedMapContext } from "@/arches_vue_components/components/MapComponent/composables/useMapContext.ts";

import type { MapContext } from "@/arches_vue_components/components/MapComponent/types.ts";

const { context: contextProp = undefined } = defineProps<{
    context?: MapContext;
}>();

const context = useResolvedMapContext(contextProp, "DrawPanel");
const { deleteSelectedDrawnFeature, deleteAllDrawnFeatures } = context;

const { $gettext } = useGettext();
</script>

<template>
    <ShapefileDropZone :context="context" />
    <DrawControls :context="context" />
    <BufferControls :context="context" />
    <DrawnFeaturesList :context="context" />
    <div class="clear-btns">
        <Button
            size="large"
            severity="secondary"
            @click="deleteSelectedDrawnFeature"
        >
            {{ $gettext("Remove Selected") }}
        </Button>
        <Button
            size="large"
            severity="secondary"
            @click="deleteAllDrawnFeatures"
        >
            {{ $gettext("Remove All") }}
        </Button>
    </div>
</template>

<style scoped>
.clear-btns {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    padding-block-start: 1rem;
}
</style>
