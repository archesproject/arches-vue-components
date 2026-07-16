type ArchesUrlFunction = (...args: Array<string | number>) => string;
type ArchesUrlValue = string | ArchesUrlFunction;

function parseArchesUrlsFromDOM(): Record<string, ArchesUrlValue> {
    const archesUrlElements = document.querySelectorAll(".arches-urls");
    const parsedArchesUrls: Record<string, ArchesUrlValue> = {};

    for (const archesUrlElement of archesUrlElements) {
        for (const attribute of archesUrlElement.attributes) {
            if (attribute.name === "style" || attribute.name === "class") {
                continue;
            }

            try {
                const functionFromString = new Function(
                    "return" + attribute.value,
                );
                let result = functionFromString();

                if (!result) {
                    result = "";
                }
                if (typeof result === "object") {
                    result = String(result);
                }

                parsedArchesUrls[attribute.name] = result;
            } catch {
                parsedArchesUrls[attribute.name] = attribute.value;
            }
        }
    }

    return parsedArchesUrls;
}

function getPositionalParameterNames(urlFunction: ArchesUrlFunction): string[] {
    const functionSource = urlFunction.toString();
    const parameterListMatch = functionSource.match(/^\(([^)]*)\)\s*=>/);

    if (!parameterListMatch) {
        return [];
    }

    return parameterListMatch[1]
        .split(",")
        .map((parameterName) => parameterName.trim())
        .filter((parameterName) => parameterName.length > 0);
}

export function generateArchesURL(
    urlName: string,
    urlParameters: Record<string, string | number> = {},
    queryParameters?: Record<string, string | number>,
    languageCode?: string,
): string {
    const routes = parseArchesUrlsFromDOM();
    const route = routes[urlName];

    if (route === undefined) {
        throw new Error(
            `Key '${urlName}' not found in .arches-urls attributes`,
        );
    }

    if (!languageCode) {
        languageCode = document.documentElement.lang;
    }

    const routeParameters: Record<string, string | number | undefined> = {
        ...urlParameters,
        language_code: languageCode.split("-")[0],
    };

    let url: string;

    if (typeof route === "function") {
        const parameterNames = getPositionalParameterNames(route);

        const positionalArguments = parameterNames.map((parameterName) => {
            const value = routeParameters[parameterName];

            if (value === undefined) {
                throw new Error(
                    `Missing required parameter '${parameterName}' for URL '${urlName}'`,
                );
            }

            return value;
        });

        url = route(...positionalArguments);
    } else {
        url = route;
    }

    if (queryParameters && Object.keys(queryParameters).length > 0) {
        const searchParameters = new URLSearchParams();
        Object.entries(queryParameters).forEach(([key, value]) => {
            searchParameters.set(key, String(value));
        });
        url = `${url}?${searchParameters.toString()}`;
    }

    return url;
}
