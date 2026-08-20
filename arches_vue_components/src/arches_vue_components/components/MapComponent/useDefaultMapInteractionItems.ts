import { useGettext } from "vue3-gettext";

import BasemapPanel from "@/arches_vue_components/components/MapComponent/components/InteractionsDrawer/components/BasemapPanel.vue";
import DrawPanel from "@/arches_vue_components/components/MapComponent/components/InteractionsDrawer/components/DrawPanel/DrawPanel.vue";
import OverlayPanel from "@/arches_vue_components/components/MapComponent/components/InteractionsDrawer/components/OverlayPanel.vue";

import type { MapInteractionItem } from "@/arches_vue_components/components/MapComponent/types.ts";

export function useDefaultMapInteractionItems(): MapInteractionItem[] {
    const { $gettext } = useGettext();

    return [
        {
            name: $gettext("Draw"),
            header: $gettext("Draw"),
            component: DrawPanel,
            icon: "pi pi-pencil",
        },
        {
            name: $gettext("Basemap"),
            header: $gettext("Basemap"),
            component: BasemapPanel,
            icon: "pi pi-map",
        },
        {
            name: $gettext("Overlays"),
            header: $gettext("Overlays"),
            component: OverlayPanel,
            icon: "pi pi-globe",
        },
    ];
}
