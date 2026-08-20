import {
    computed,
    inject,
    onMounted,
    onUnmounted,
    ref,
    shallowRef,
    watch,
} from "vue";

import MapboxDraw from "@mapbox/mapbox-gl-draw";
import geojsonExtent from "@mapbox/geojson-extent";
import maplibregl from "maplibre-gl";

import { uniqBy } from "es-toolkit";
import { useToast } from "primevue/usetoast";
import { useGettext } from "vue3-gettext";

import {
    fetchMapData,
    fetchDrawnFeaturesBuffer,
    fetchGeoJSONBounds,
} from "@/arches_vue_components/components/MapComponent/api.ts";

import {
    BUFFER_FILL_COLOR,
    BUFFER_FILL_OPACITY,
    BUFFER_LAYER_ID,
    DIRECT_SELECT,
    DRAW_CREATE_EVENT,
    DRAW_DELETE_EVENT,
    DRAW_LINE_STRING,
    DRAW_POINT,
    DRAW_POLYGON,
    DRAW_SELECTION_CHANGE_EVENT,
    DRAW_UPDATE_EVENT,
    GEOMETRY_TYPE_LINESTRING,
    GEOMETRY_TYPE_POINT,
    GEOMETRY_TYPE_POLYGON,
    IDLE,
    METERS,
    SEARCH_RENDER_CONTEXT,
    SIMPLE_SELECT,
    STYLE_LOAD_EVENT,
} from "@/arches_vue_components/components/MapComponent/constants.ts";

import type { InjectionKey, Ref } from "vue";
import type { Feature, FeatureCollection } from "geojson";
import type {
    AddLayerObject,
    GeoJSONSource,
    LngLat,
    Map as MaplibreMap,
    MapGeoJSONFeature,
    MapMouseEvent,
    Popup,
    SourceSpecification,
} from "maplibre-gl";

import type {
    Basemap,
    DrawMode,
    LayerDefinition,
    MapLayer,
    MapSource,
    MapContext,
    RawBasemap,
} from "@/arches_vue_components/components/MapComponent/types.ts";

interface DrawEvent {
    features: Feature[];
}

export interface MapComponentEmit {
    (event: "update:value", value: FeatureCollection): void;
    (event: "update:isLoading", isLoading: boolean): void;
    (event: "update:overlays"): void;
    (event: "initialized", value: FeatureCollection): void;
}

export const mapContextKey: InjectionKey<MapContext> = Symbol("mapContext");

export function useResolvedMapContext(
    contextProp: MapContext | undefined,
    componentName: string,
): MapContext {
    const context = contextProp ?? inject(mapContextKey);

    if (!context) {
        throw new Error(
            `${componentName} requires a MapContext: pass it via the \`context\` prop, or render this component inside a MapComponent's tree.`,
        );
    }

    return context;
}

// No explicit return type: annotating it (inline or via a named interface)
// makes vue-tsc report "Type instantiation is excessively deep and possibly
// infinite", coming from mapbox-gl-draw's overloaded method types. Left for
// inference as the one documented exception to always annotating returns.
export function useMapContext(
    props: {
        value: FeatureCollection | null;
        zoom?: number;
        pitch?: number;
        bearing?: number;
        centerX?: number;
        centerY?: number;
        minZoom?: number;
        maxZoom?: number;
        basemap?: string;
        geometryTypes?: string[];
        renderContext?: string;
        maxFeatures?: number;
    },
    emit: MapComponentEmit,
    mapContainer: Readonly<Ref<HTMLDivElement | null>>,
) {
    const toast = useToast();
    const { $gettext } = useGettext();

    const map = shallowRef<MaplibreMap | null>(null);
    const isLoading = ref(false);
    const selectedDrawnFeature: Ref<Feature | null> = ref(null);
    const drawnFeatures = shallowRef<Feature[]>([]);
    const basemaps = ref<Basemap[]>([]);
    const overlays = ref<MapLayer[]>([]);
    const popupFeatures = ref<MapGeoJSONFeature[]>([]);
    const popupContainer = ref<HTMLElement | null>(null);

    let activePopup: Popup | null = null;
    let draw: InstanceType<typeof MapboxDraw>;
    let mapSources: MapSource[] = [];
    let defaultBounds: [number, number, number, number] | null = null;
    let currentBufferData: FeatureCollection = {
        type: "FeatureCollection",
        features: [],
    };

    const overlayLayerIds = computed(() =>
        overlays.value
            .filter((overlay) => overlay.addtomap)
            .flatMap((overlay) =>
                overlay.layerdefinitions.map((layerDef) => layerDef.id),
            ),
    );

    const geometryTypes = computed(() => props.geometryTypes ?? null);

    watch(isLoading, (newValue) => {
        emit("update:isLoading", newValue);
    });

    watch(
        basemaps,
        (updatedBasemaps) => {
            const activeBasemap = updatedBasemaps.find(
                (basemap) => basemap.active,
            );

            if (activeBasemap && map.value) {
                map.value.setStyle(activeBasemap.url, { diff: false });
            }
        },
        { deep: true },
    );

    watch(
        overlays,
        (updatedOverlays) => {
            if (map.value?.isStyleLoaded()) {
                updateMapOverlays(updatedOverlays);
            }
        },
        { deep: true },
    );

    onMounted(async () => {
        map.value = new maplibregl.Map({
            container: mapContainer.value!,
            zoom: props.zoom ?? 2,
            center: [props.centerX ?? 0, props.centerY ?? 0],
            pitch: props.pitch ?? 0,
            bearing: props.bearing ?? 0,
            ...(props.minZoom != null ? { minZoom: props.minZoom } : {}),
            ...(props.maxZoom != null ? { maxZoom: props.maxZoom } : {}),
            attributionControl: { compact: true },
        });

        map.value.addControl(new maplibregl.NavigationControl(), "top-left");

        map.value.on("click", handleMapClick);
        map.value.on("mousemove", handleMapMousemove);

        map.value.once(STYLE_LOAD_EVENT, () => {
            setupDraw();

            if (defaultBounds) {
                const [west, south, east, north] = defaultBounds;
                map.value!.fitBounds(
                    [
                        [west, south],
                        [east, north],
                    ],
                    { padding: 20 },
                );
            }
        });
        map.value.on(STYLE_LOAD_EVENT, () => {
            map.value!.resize();

            addBufferLayer();
            updateMapOverlays(overlays.value);

            emit("update:overlays");
        });

        await loadMapData();
        emit(
            "initialized",
            props.value ?? { type: "FeatureCollection", features: [] },
        );
    });

    onUnmounted(() => {
        map.value?.remove();
    });

    function handleMapClick(event: MapMouseEvent): void {
        if (!overlayLayerIds.value.length) return;

        const features = map.value!.queryRenderedFeatures(event.point, {
            layers: overlayLayerIds.value,
        });

        if (!features.length) return;

        openFeaturePopup(deduplicateFeatures(features), event.lngLat);
    }

    function deduplicateFeatures(
        features: MapGeoJSONFeature[],
    ): MapGeoJSONFeature[] {
        const identifiableFeatures = features.filter(
            (feature) => feature.properties?.resourceinstanceid || feature.id,
        );

        return uniqBy(identifiableFeatures, (feature) =>
            String(feature.properties?.resourceinstanceid ?? feature.id),
        );
    }

    function openFeaturePopup(
        features: MapGeoJSONFeature[],
        lngLat: LngLat,
    ): void {
        activePopup?.remove();

        const container = document.createElement("div");
        container.style.height = "100%";

        activePopup = new maplibregl.Popup({
            maxWidth: "none",
            className: "feature-info-popup",
        })
            .setDOMContent(container)
            .setLngLat(lngLat)
            .addTo(map.value!);

        popupContainer.value = container;
        popupFeatures.value = features;

        activePopup.on("close", () => {
            popupContainer.value = null;
            popupFeatures.value = [];
            activePopup = null;
        });
    }

    function handleMapMousemove(event: MapMouseEvent): void {
        const canvas = map.value!.getCanvas();

        if (!overlayLayerIds.value.length) {
            canvas.style.cursor = "";
            return;
        }

        const features = map.value!.queryRenderedFeatures(event.point, {
            layers: overlayLayerIds.value,
        });

        canvas.style.cursor = features.length ? "pointer" : "";
    }

    async function loadMapData(): Promise<void> {
        isLoading.value = true;

        try {
            const mapData = await fetchMapData();

            type RawResourceSource = {
                name: string;
                source: MapSource["source"];
            };
            const rawResourceSources = (mapData?.resource_map_sources ??
                []) as RawResourceSource[];
            const resourceSources: MapSource[] = rawResourceSources.map(
                (raw) => ({
                    id: 0,
                    name: raw.name,
                    source: raw.source,
                }),
            );
            mapSources = [
                ...((mapData?.map_sources ?? []) as MapSource[]),
                ...resourceSources,
            ];

            basemaps.value = ((mapData?.basemaps ?? []) as RawBasemap[]).map(
                (layer) => ({
                    id: layer.name,
                    name: layer.title,
                    value: layer.name,
                    active: layer.addtomap,
                    url: layer.url,
                }),
            );

            const configuredOverlays = (
                (mapData?.map_layers ?? []) as MapLayer[]
            ).filter(
                (layer) =>
                    layer.isoverlay &&
                    layer.activated !== false &&
                    (!layer.searchonly ||
                        props.renderContext === SEARCH_RENDER_CONTEXT),
            );
            const resourceLayers = (mapData?.resource_map_layers ??
                []) as MapLayer[];
            const fetchedOverlays = [
                ...configuredOverlays,
                ...resourceLayers,
            ].sort(
                (overlayA, overlayB) =>
                    (overlayA.sortorder ?? 0) - (overlayB.sortorder ?? 0),
            );
            overlays.value = fetchedOverlays;

            if (mapData?.default_bounds) {
                defaultBounds = geojsonExtent(mapData.default_bounds);
            }

            const preferredBasemap =
                basemaps.value.find(
                    (basemap) => basemap.value === props.basemap,
                ) ?? null;
            const activeBasemap =
                preferredBasemap ??
                basemaps.value.find((basemap) => basemap.active);
            if (activeBasemap?.url) {
                map.value!.setStyle(activeBasemap.url);
            }
        } catch (error) {
            console.error("Error loading map data:", error);
        } finally {
            isLoading.value = false;
        }
    }

    function setupDraw(): void {
        draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                point: false,
                line_string: false,
                polygon: false,
                trash: false,
            },
        });

        map.value!.addControl(draw);

        if (props.value?.features?.length) {
            for (const feature of props.value.features) {
                draw.add(feature);
            }

            updateDrawnFeatures();
        }

        map.value!.on(DRAW_CREATE_EVENT, (drawEvent: DrawEvent) => {
            if (
                props.maxFeatures != null &&
                draw.getAll().features.length > props.maxFeatures
            ) {
                const rejectedIds = drawEvent.features.map(
                    (feature) => feature.id as string,
                );
                draw.delete(rejectedIds);
                notifyMaxFeaturesReached();
                updateDrawnFeatures();
                return;
            }

            selectNewlyDrawnFeature(drawEvent);
            updateDrawnFeatures();
        });
        map.value!.on(DRAW_UPDATE_EVENT, (drawEvent: DrawEvent) => {
            selectedDrawnFeature.value = drawEvent.features[0] ?? null;
            updateDrawnFeatures();
        });
        map.value!.on(DRAW_DELETE_EVENT, () => {
            selectedDrawnFeature.value = null;
            updateDrawnFeatures();
        });
        map.value!.on(DRAW_SELECTION_CHANGE_EVENT, () => {
            selectedDrawnFeature.value = draw.getSelected().features[0] ?? null;
        });
    }

    function addBufferLayer(): void {
        if (!map.value!.getSource(BUFFER_LAYER_ID)) {
            map.value!.addSource(BUFFER_LAYER_ID, {
                type: "geojson",
                data: currentBufferData,
            });
        }
        if (!map.value!.getLayer(BUFFER_LAYER_ID)) {
            map.value!.addLayer({
                id: BUFFER_LAYER_ID,
                type: "fill",
                source: BUFFER_LAYER_ID,
                layout: {},
                paint: {
                    "fill-color": BUFFER_FILL_COLOR,
                    "fill-opacity": BUFFER_FILL_OPACITY,
                },
            });
        }
    }

    function selectNewlyDrawnFeature(drawEvent: DrawEvent): void {
        const feature = drawEvent.features[0];
        const featureId = feature.id as string;

        map.value!.once(IDLE, () => {
            if (feature.geometry.type === GEOMETRY_TYPE_POINT) {
                draw.changeMode(SIMPLE_SELECT, { featureIds: [featureId] });
            } else if (
                feature.geometry.type === GEOMETRY_TYPE_LINESTRING ||
                feature.geometry.type === GEOMETRY_TYPE_POLYGON
            ) {
                draw.changeMode(DIRECT_SELECT, { featureId });
            }
        });
    }

    function notifyMaxFeaturesReached(): void {
        toast.add({
            severity: "error",
            summary: $gettext("Feature limit reached"),
            detail: $gettext(
                "Only %{max} feature(s) can be drawn on this map.",
                { max: String(props.maxFeatures) },
            ),
            life: 5000,
            group: "map-component",
        });
    }

    async function updateDrawnFeatures(): Promise<void> {
        const drawnFeatureCollection = draw.getAll() as FeatureCollection;
        drawnFeatures.value = drawnFeatureCollection.features as Feature[];

        for (const feature of drawnFeatureCollection.features) {
            feature.properties!.buffer_distance ??= 0;
            feature.properties!.buffer_units ??= METERS;
        }

        try {
            const featuresToBuffer: FeatureCollection = {
                ...drawnFeatureCollection,
                features: drawnFeatureCollection.features.filter(
                    (feature) => feature.properties!.buffer_distance,
                ),
            };

            let bufferedFeatures: FeatureCollection = {
                type: "FeatureCollection",
                features: [],
            };
            if (featuresToBuffer.features.length) {
                bufferedFeatures =
                    await fetchDrawnFeaturesBuffer(featuresToBuffer);
            }

            currentBufferData = bufferedFeatures;
            (map.value!.getSource(BUFFER_LAYER_ID) as GeoJSONSource)?.setData(
                currentBufferData,
            );

            if (drawnFeatureCollection.features.length) {
                const allFeatures: FeatureCollection = {
                    type: "FeatureCollection",
                    features: [
                        ...drawnFeatureCollection.features,
                        ...bufferedFeatures.features,
                    ],
                };

                const [west, south, east, north] =
                    await fetchGeoJSONBounds(allFeatures);
                map.value!.fitBounds(
                    [
                        [west, south],
                        [east, north],
                    ],
                    {
                        padding: { top: 50, right: 100, bottom: 50, left: 50 },
                    },
                );
            }
        } catch (error) {
            console.error("Error updating drawn features:", error);
        }

        emit("update:value", drawnFeatureCollection);
    }

    function addOverlayToMap(overlay: MapLayer): void {
        for (const layerDef of overlay.layerdefinitions) {
            try {
                if (layerDef.source && !map.value!.getSource(layerDef.source)) {
                    const sourceSpec = mapSources.find(
                        (mapSource) => mapSource.name === layerDef.source,
                    );
                    if (sourceSpec) {
                        map.value!.addSource(
                            layerDef.source,
                            sourceSpec.source as SourceSpecification,
                        );
                    }
                }
                if (!map.value!.getLayer(layerDef.id)) {
                    map.value!.addLayer(layerDef as AddLayerObject);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    function removeOverlayFromMap(overlay: MapLayer): void {
        const sourcesToRemove: Record<string, boolean> = {};

        for (const layerDef of overlay.layerdefinitions) {
            if (map.value!.getLayer(layerDef.id)) {
                map.value!.removeLayer(layerDef.id);
                if (layerDef.source) {
                    sourcesToRemove[layerDef.source] = true;
                }
            }
        }

        for (const layer of (map.value!.getStyle()?.layers ??
            []) as LayerDefinition[]) {
            const layerSource = layer.source;
            if (layerSource && sourcesToRemove[layerSource]) {
                delete sourcesToRemove[layerSource];
            }
        }

        for (const source of Object.keys(sourcesToRemove)) {
            if (map.value!.getSource(source)) {
                map.value!.removeSource(source);
            }
        }
    }

    function updateMapOverlays(overlaysToUpdate: MapLayer[]): void {
        for (const overlay of overlaysToUpdate) {
            for (const layerDef of overlay.layerdefinitions) {
                if (map.value!.getLayer(layerDef.id)) {
                    map.value!.removeLayer(layerDef.id);
                }
            }
        }
        for (const overlay of overlaysToUpdate) {
            if (overlay.addtomap) {
                addOverlayToMap(overlay);
            } else {
                removeOverlayFromMap(overlay);
            }
        }
    }

    function setDrawMode(mode: DrawMode | null): void {
        if (!mode || !draw) {
            if (map.value) {
                map.value.getCanvas().style.cursor = "";
            }
            return;
        }

        map.value!.getCanvas().style.cursor = "crosshair";

        if (mode === "point") {
            draw.changeMode(DRAW_POINT);
        } else if (mode === "line") {
            draw.changeMode(DRAW_LINE_STRING);
        } else if (mode === "polygon") {
            draw.changeMode(DRAW_POLYGON);
        }
    }

    function selectDrawnFeature(feature: Feature): void {
        selectedDrawnFeature.value = feature;
        draw?.changeMode(SIMPLE_SELECT, { featureIds: [String(feature.id)] });
    }

    function deleteSelectedDrawnFeature(): void {
        if (!draw) return;

        const selectedFeatures = draw.getSelected();
        if (selectedFeatures.features.length) {
            draw.delete(selectedFeatures.features[0].id as string);
            map.value!.fire(DRAW_DELETE_EVENT);
        }
    }

    function deleteAllDrawnFeatures(): void {
        if (!draw) return;

        draw.deleteAll();
        map.value!.fire(DRAW_DELETE_EVENT);
    }

    function setBufferForSelectedFeature(
        distance: number,
        units: string,
    ): void {
        const feature = selectedDrawnFeature.value;
        if (!feature || !draw) return;

        feature.properties!.buffer_distance = distance;
        feature.properties!.buffer_units = units;

        draw.add(feature);
        map.value!.fire(DRAW_UPDATE_EVENT, { features: [feature] });
    }

    function addFeatures(features: Feature[]): void {
        if (!draw || !features.length) return;

        const projectedCount = draw.getAll().features.length + features.length;
        if (props.maxFeatures != null && projectedCount > props.maxFeatures) {
            notifyMaxFeaturesReached();
            return;
        }

        for (const feature of features) {
            draw.add(feature);
        }

        updateDrawnFeatures();
    }

    const context: MapContext = {
        map,
        isLoading,
        basemaps,
        overlays,
        drawnFeatures,
        selectedDrawnFeature,
        geometryTypes,
        setDrawMode,
        selectDrawnFeature,
        deleteSelectedDrawnFeature,
        deleteAllDrawnFeatures,
        setBufferForSelectedFeature,
        addFeatures,
    };

    return { context, popupContainer, popupFeatures };
}
