# Arches Vue Components

A Vue 3 / PrimeVue component library for building custom applications with Arches versions 8.0.0+

## Installation

```
pip install arches-vue-components
```

## Project Configuration

1. If you do not already have an Arches project, create one by following the instructions in the Arches [documentation](http://archesproject.org/documentation/).

2. Add `arches_querysets` and `arches_vue_components` to `INSTALLED_APPS` below the name of your project but above `arches`:
```python
INSTALLED_APPS = (
    "my_project_name",
    ...
    "arches_querysets",
    "arches_vue_components",
    "arches",
    ...
)
```

3. Add `arches_vue_components` as a dependency in `package.json`:
```json
"dependencies": {
    "arches_vue_components": "archesproject/arches-vue-components#main"
}
```

4. Add the `arches_vue_components` URLs to `urls.py`:
```python
urlpatterns = [
    path("", include("arches_vue_components.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

5. Start your project and install frontend dependencies:
```
python manage.py runserver
```
```
npm install && npm run build_development
```

6. Check for missing `WidgetMapping` records:
```
python manage.py validate --codes 2001 --verbosity 2
```
See [Extending Arches Vue Components](#extending-arches-vue-components) if any are missing.


## Frontend API

### Bootstrapping an app

```typescript
import MyComponent from '@/my_project/MyComponent.vue';

import { createVueApplication } from '@/arches_vue_components/application';

createVueApplication({ component: MyComponent }).then(app => app.mount('#app'));
```

### Widgets

`GenericWidget` looks up the widget mapped to a node (see [Extending Arches Vue Components](#extending-arches-vue-components)) and resolves the real component at runtime. In `edit` mode it wraps the resolved widget in a `GenericFormField`, which registers the node as a PrimeVue Forms `FormField` keyed by `nodeAlias`, ties its dirty/touched state and validation errors into an ancestor `<Form>`, and renders those errors:

```vue
<script setup lang="ts">
import { ref } from 'vue';

import GenericWidget from '@/arches_vue_components/generics/GenericWidget/GenericWidget.vue';

import type { WidgetMode } from '@/arches_vue_components/widgets';
import type { AliasedNodeData } from '@/arches_vue_components/generics';

const MODE: WidgetMode = 'edit';
const nodeData = ref<AliasedNodeData | null>(null);
</script>

<template>
    <GenericWidget
        node-alias="my_text_node"
        graph-slug="my_graph"
        :mode="MODE"
        :aliased-node-data="nodeData"
        @update:aliased-node-data="nodeData = $event"
    />
</template>
```

`aliasedNodeData`/`value` are both optional. Without either, `GenericWidget` falls back to the node's configured default (`cardXNodeXWidgetData.config.defaultValue`, part of the widget config it already fetches), so it renders from just `graphSlug`/`nodeAlias`/`mode`:

```vue
<template>
    <GenericWidget
        node-alias="my_text_node"
        graph-slug="my_graph"
        mode="edit"
    />
</template>
```

Importing a widget directly skips the runtime resolution and the `FormField` integration described above. The widget emits `update:aliasedNodeData`/`update:value` on its own (some widgets also emit `update:isDirty`); the caller wires that into any surrounding form:

```vue
<script setup lang="ts">
import { ref } from 'vue';

import { TextWidget } from '@/arches_vue_components/widgets';

import type { WidgetMode } from '@/arches_vue_components/widgets';
import type { StringAliasedNodeData } from '@/arches_vue_components/datatypes';

const MODE: WidgetMode = 'edit';
const nodeData = ref<StringAliasedNodeData | null>(null);
</script>

<template>
    <TextWidget
        :mode="MODE"
        :aliased-node-data="nodeData"
        @update:aliased-node-data="nodeData = $event"
    />
</template>
```

### Cards

`GenericCard` renders a whole nodegroup. It fetches the tile (`fetchTileData`) and every node's widget config, then renders `GenericCardEditor` or `GenericCardViewer` depending on `mode`. The editor wraps a PrimeVue `Form` and renders one `GenericWidget` per node, and saves the collected tile with `upsertTile` — from its own save button, or by calling `.save()` on it directly (exposed via `defineExpose`).

```vue
<script setup lang="ts">
import { ref } from 'vue';

import GenericCard from '@/arches_vue_components/generics/GenericCard/GenericCard.vue';

import type { AliasedTileData } from '@/arches_vue_components/generics';

const tileData = ref<AliasedTileData>();
</script>

<template>
    <GenericCard
        graph-slug="my_graph"
        nodegroup-alias="my_nodegroup"
        :resource-instance-id="resourceInstanceId"
        :tile-id="tileId"
        :tile-data="tileData"
        mode="edit"
        @update:tile-data="tileData = $event"
        @save="tileData = $event"
        @reset="() => {}"
    />
</template>
```

### Reference

#### `@/arches_vue_components/widgets`

| Name | Type | Description |
|------|------|--------------|
| `WidgetMode` | `'edit' \| 'view' \| 'configure'` | The three states a widget can render in |
| `BaseWidgetProps` | `{ mode: WidgetMode; nodeAlias?: string; graphSlug?: string }` | Props every widget accepts |

Every widget's `aliasedNodeData`/`cardXNodeXWidgetData` prop is typed to one specific datatype. Where no widget-specific `cardXNodeXWidgetData` type is listed, the widget uses the base `CardXNodeXWidgetData` (no extra config fields). Both columns import from `@/arches_vue_components/datatypes`:

| Widget | `aliasedNodeData` type | `cardXNodeXWidgetData` type |
|--------|-------------------------|-------------------------------|
| `TextWidget`, `RichTextWidget` | `StringAliasedNodeData` | `StringCardXNodeXWidgetData` |
| `NonLocalizedTextWidget` | `NonLocalizedTextAliasedNodeData` | `CardXNodeXWidgetData` |
| `NumberWidget` | `NumberAliasedNodeData` | `NumberCardXNodeXWidgetData` |
| `DatePickerWidget` | `DateAliasedNodeData` | `DateCardXNodeXWidgetData` |
| `EDTFWidget` | `EDTFAliasedNodeData` | `CardXNodeXWidgetData` |
| `ConceptSelectWidget` | `ConceptAliasedNodeData` | `CardXNodeXWidgetData` |
| `ConceptRadioWidget` | `ConceptAliasedNodeData` | `ConceptCardXNodeXWidgetData` |
| `ConceptMultiselectWidget` | `ConceptListAliasedNodeData` | `CardXNodeXWidgetData` |
| `ConceptCheckboxWidget` | `ConceptListAliasedNodeData` | `ConceptCardXNodeXWidgetData` |
| `DomainSelectWidget`, `DomainRadioWidget` | `DomainAliasedNodeData` | `DomainCardXNodeXWidgetData` |
| `DomainCheckboxWidget`, `DomainMultiselectWidget` | `DomainListAliasedNodeData` | `DomainCardXNodeXWidgetData` |
| `LanguageSelectWidget` | `LanguageAliasedNodeData` | `CardXNodeXWidgetData` |
| `RadioBooleanWidget`, `SwitchWidget` | `BooleanAliasedNodeData` | `BooleanCardXNodeXWidgetData` |
| `ResourceInstanceSelectWidget` | `ResourceInstanceAliasedNodeData` | `ResourceInstanceCardXNodeXWidgetData` |
| `ResourceInstanceMultiselectWidget` | `ResourceInstanceListAliasedNodeData` | `ResourceInstanceListCardXNodeXWidgetData` |
| `FileListWidget` | `FileListAliasedNodeData` | `FileListCardXNodeXWidgetData` |
| `NodeValueSelectWidget` | `NodeValueAliasedNodeData` | `CardXNodeXWidgetData` |
| `URLWidget` | `URLAliasedNodeData` | `CardXNodeXWidgetData` |
| `MapWidget` | `GeoJSONFeatureCollectionAliasedNodeData` | `MapCardXNodeXWidgetData` |

#### `@/arches_vue_components/generics`

`GenericWidget`/`GenericCard` resolve their concrete component at runtime instead of being imported directly — that is the "generic" here, not a TypeScript `<T>`.

| Export | Description |
|--------|-------------|
| `GenericCard` | Card editor/viewer for a nodegroup |
| `GenericWidget` | Single widget resolved from widget config |
| `GenericCardProps`, `GenericWidgetProps` | Props interfaces |
| `AliasedNodeData`, `AliasedTileData` | Node/tile value types |

`GenericWidgetProps`:

| Name | Type | Description |
|------|------|--------------|
| `graphSlug` | `string` | Graph the node belongs to |
| `nodeAlias` | `string` | Node to render |
| `mode` | `WidgetMode` | `'edit'`, `'view'`, or `'configure'` |
| `aliasedNodeData` | `AliasedNodeData \| null` | Current value; takes priority over `value` |
| `value` | `unknown` | Raw value fallback, used only if `aliasedNodeData` is omitted |
| `cardXNodeXWidgetData` | `CardXNodeXWidgetData` | Pre-fetched widget config; skips `GenericWidget`'s own fetch |
| `cardXNodeXWidgetDataOverrides` | `Partial<CardXNodeXWidgetData>` | Merged into the fetched config after fetching |
| `isDirty` | `boolean` | Marks the field dirty on the surrounding `<Form>` |
| `shouldShowLabel` | `boolean` | Show the node's label (default `true`) |

`GenericCardProps`:

| Name | Type | Description |
|------|------|--------------|
| `graphSlug` | `string` | Graph the nodegroup belongs to |
| `nodegroupAlias` | `string` | Nodegroup to render |
| `mode` | `WidgetMode` | `'edit'`, `'view'`, or `'configure'` |
| `resourceInstanceId` | `string \| null` | Resource this tile belongs to, for a new tile |
| `selectedNodeAlias` | `string \| null` | Node to focus within the card |
| `shouldShowFormButtons` | `boolean` | Show the built-in save/reset buttons (default `true`) |
| `tileData` | `AliasedTileData` | Pre-fetched tile; skips `GenericCard`'s own fetch |
| `tileId` | `string \| null` | Tile to fetch when `tileData` is not provided |

#### `@/arches_vue_components/datatypes`

`*AliasedNodeData` types are listed in the widget table above. Supporting types:

| Export | Description |
|--------|-------------|
| `LanguageValue` | Per-language string value (`{ value: string; direction: 'ltr' \| 'rtl' }`) |
| `URLNodeValue` | URL node value (`{ url: string; url_label: string }`) |
| `FileReference` | File attachment reference |
| `ResourceInstanceReference` | Resource instance link reference |
| `DomainOption` | Domain value option |

#### `@/arches_vue_components/application`

| Name | Type |
|------|------|
| `createVueApplication` | `(options: CreateVueApplicationOptions) => Promise<App>` |
| `generateArchesURL` | `(urlName: string, urlParameters?: Record<string, string \| number>, queryParameters?: Record<string, string \| number>, languageCode?: string) => string` |
| `CreateVueApplicationOptions` | `{ component: Component; themeConfiguration?: ArchesThemeConfiguration; initialProps?: Record<string, unknown> }` |

#### `@/arches_vue_components/themes`

| Name | Type | Description |
|------|------|--------------|
| `DEFAULT_THEME` | `ArchesThemeConfiguration` | Theme `createVueApplication` uses when `themeConfiguration` is not passed |
| `ArchesThemeConfiguration` | — | PrimeVue theme configuration shape |


## Creating a Custom Widget

A widget is an editor/viewer pair plus a dispatcher that picks between them by `mode`. The example below, `RatingWidget`, is a new widget for the existing `number` datatype.

1. Create `widgets/RatingWidget/` with a `types.ts` extending `BaseWidgetProps`:
```ts
import type { BaseWidgetProps } from "@/arches_vue_components/widgets/types.ts";
import type {
    NumberAliasedNodeData,
    NumberCardXNodeXWidgetData,
} from "@/arches_vue_components/datatypes/number/types.ts";

export interface RatingWidgetProps extends BaseWidgetProps {
    cardXNodeXWidgetData?: NumberCardXNodeXWidgetData;
    aliasedNodeData?: NumberAliasedNodeData | null;
    value?: number | null;
}
```

2. Add `RatingWidget.vue`, the dispatcher — switches on `mode`, re-emits `update:aliasedNodeData`, `update:value`, `initialized`:
```vue
<script setup lang="ts">
import { computed } from "vue";

import RatingWidgetEditor from "@/arches_vue_components/widgets/RatingWidget/components/RatingWidgetEditor.vue";
import RatingWidgetViewer from "@/arches_vue_components/widgets/RatingWidget/components/RatingWidgetViewer.vue";

import { EDIT, VIEW } from "@/arches_vue_components/widgets/constants.ts";
import { buildNumberAliasedNodeData } from "@/arches_vue_components/datatypes/number/utils.ts";

import type { NumberAliasedNodeData } from "@/arches_vue_components/datatypes/number/types.ts";
import type { RatingWidgetProps } from "@/arches_vue_components/widgets/RatingWidget/types.ts";

const { aliasedNodeData, value } = defineProps<RatingWidgetProps>();

const emit = defineEmits<{
    "update:value": [updatedValue: number | null];
    "update:aliasedNodeData": [updatedValue: NumberAliasedNodeData];
    initialized: [updatedValue: NumberAliasedNodeData];
}>();

const resolvedAliasedNodeData = computed(
    () => aliasedNodeData ?? buildNumberAliasedNodeData(value ?? null),
);

function onUpdateAliasedNodeData(updated: NumberAliasedNodeData) {
    emit("update:aliasedNodeData", updated);
    emit("update:value", updated.node_value);
}
</script>

<template>
    <RatingWidgetEditor
        v-if="mode === EDIT"
        :card-x-node-x-widget-data="cardXNodeXWidgetData"
        :aliased-node-data="resolvedAliasedNodeData"
        @update:aliased-node-data="onUpdateAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
    <RatingWidgetViewer
        v-else-if="mode === VIEW"
        :aliased-node-data="resolvedAliasedNodeData"
        @initialized="emit('initialized', $event)"
    />
</template>
```

3. Add the editor and viewer. Both emit `initialized` on mount:
```vue
<!-- components/RatingWidgetEditor.vue -->
<script setup lang="ts">
import { onMounted } from "vue";
import Rating from "primevue/rating";

import { buildNumberAliasedNodeData } from "@/arches_vue_components/datatypes/number/utils.ts";

import type { NumberAliasedNodeData } from "@/arches_vue_components/datatypes/number/types.ts";

const { aliasedNodeData } = defineProps<{
    aliasedNodeData: NumberAliasedNodeData | null;
}>();

const emit = defineEmits<{
    (event: "update:aliasedNodeData", updatedValue: NumberAliasedNodeData): void;
    (event: "initialized", updatedValue: NumberAliasedNodeData): void;
}>();

onMounted(() => {
    emit("initialized", aliasedNodeData ?? buildNumberAliasedNodeData(null));
});

function onUpdateModelValue(updatedValue: number | null) {
    emit("update:aliasedNodeData", buildNumberAliasedNodeData(updatedValue));
}
</script>

<template>
    <Rating
        :model-value="aliasedNodeData?.node_value ?? null"
        @update:model-value="onUpdateModelValue($event)"
    />
</template>
```
```vue
<!-- components/RatingWidgetViewer.vue -->
<script setup lang="ts">
import { onMounted } from "vue";

import type { NumberAliasedNodeData } from "@/arches_vue_components/datatypes/number/types.ts";

const { aliasedNodeData } = defineProps<{ aliasedNodeData: NumberAliasedNodeData }>();

const emit = defineEmits<{ initialized: [updatedValue: NumberAliasedNodeData] }>();

onMounted(() => emit("initialized", aliasedNodeData));
</script>

<template>
    <div>{{ aliasedNodeData?.display_value }}</div>
</template>
```

4. Reuse an existing datatype module (`@/arches_vue_components/datatypes` — string, number, boolean, concept, domain, etc.) for the value shape, as above, or add a new one following the same `types.ts` + `build<Datatype>AliasedNodeData` `utils.ts` pattern.

5. If contributing to Arches Vue Components, export it from `widgets/index.ts`:
```ts
export { default as RatingWidget } from "@/arches_vue_components/widgets/RatingWidget/RatingWidget.vue";
export type { RatingWidgetProps } from "@/arches_vue_components/widgets/RatingWidget/types.ts";
```

6. Register it — see [Extending Arches Vue Components](#extending-arches-vue-components).

## Extending Arches Vue Components

Arches Vue Components uses the `WidgetMapping` model to map widgets to their Vue components. To check for missing mappings:
```
python manage.py widget check_mappings
```

To add a mapping:
```
python manage.py widget add_mapping -wn language-select -cp arches_vue_components/widgets/LanguageSelectWidget/LanguageSelectWidget.vue
```

## Migrating a `WidgetMapping` Migration from `arches-component-lab`

`arches_vue_components` is the renamed successor to `arches_component_lab`; the two are separate Django apps with independent migration histories, so a project migration that targets `arches_component_lab.WidgetMapping` (for example, a data migration registering a mapping for a custom widget) breaks once `arches_component_lab` is dropped from `INSTALLED_APPS`. Don't edit that migration in place to point at `arches_vue_components` — its slot in your migration history is already applied on real projects and can't be removed or repurposed. Instead:

1. Edit the existing migration to be a no-op, and comment where the replacement lives:
```python
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("my_project", "0004_some_prior_migration"),
    ]

    # RatingWidget's mapping is registered by 0011_add_rating_widget_mapping
    # instead, against arches_vue_components.WidgetMapping. This migration's
    # slot can't be removed since it's already applied on real projects, so
    # it's kept as a no-op.
    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
```

2. Create a new migration that depends on `arches_vue_components` and re-creates the mapping against it:
```python
import uuid

from django.db import migrations


def create_rating_widget_mapping(apps, schema_editor):
    WidgetMapping = apps.get_model("arches_vue_components", "WidgetMapping")

    # first delete old mapping if it exists
    WidgetMapping.objects.filter(widget_id="<widget-uuid>").delete()

    WidgetMapping.objects.create(
        id=uuid.uuid4(),
        widget_id="<widget-uuid>",
        component="my_project/widgets/RatingWidget/RatingWidget.vue",
    )


def revert_rating_widget_mapping(apps, schema_editor):
    WidgetMapping = apps.get_model("arches_vue_components", "WidgetMapping")
    WidgetMapping.objects.filter(widget_id="<widget-uuid>").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("my_project", "0010_some_later_migration"),
        ("arches_vue_components", "0002_populate_widget_mappings"),
    ]

    operations = [
        migrations.RunPython(
            create_rating_widget_mapping,
            revert_rating_widget_mapping,
        ),
    ]
```
