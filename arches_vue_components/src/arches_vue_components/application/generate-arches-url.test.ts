import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateArchesURL } from "@/arches_vue_components/application/generate-arches-url.ts";

const originalLang = document.documentElement.lang;

function mountArchesUrls(attributes: Record<string, string>) {
    const archesUrlsElement = document.createElement("div");
    archesUrlsElement.classList.add("arches-urls");

    Object.entries(attributes).forEach(([name, value]) => {
        archesUrlsElement.setAttribute(name, value);
    });

    document.body.appendChild(archesUrlsElement);

    return archesUrlsElement;
}

describe("generateArchesURL", () => {
    beforeEach(() => {
        mountArchesUrls({
            example_url:
                "(language_code, id) => `/${language_code}/admin/example/${id}`",
            another_url: "(id) => `/admin/another/${id}`",
            multi_interpolation_url:
                "(language_code, resource_id, field_id, version_id) => `/${language_code}/resource/${resource_id}/edit/${field_id}/version/${version_id}`",
            missing_required: "(id, value) => `/required/${id}/value/${value}`",
            duplicate_interpolation:
                "(language_code, id) => `/${language_code}/repeated/${id}/again/${id}`",
            plain_url: "/plain/url",
            extra_params:
                "(language_code, id) => `/${language_code}/extra/${id}`",
            multi_segment_literal_url: "/a/b",
        });
    });

    afterEach(() => {
        document.documentElement.lang = originalLang;
        document
            .querySelectorAll(".arches-urls")
            .forEach((element) => element.remove());
    });

    it("returns a valid URL with specified language code and parameters", () => {
        const result = generateArchesURL(
            "example_url",
            { id: "123" },
            undefined,
            "fr",
        );
        expect(result).toBe("/fr/admin/example/123");
    });

    it("uses the <html> lang attribute when no language code is provided", () => {
        document.documentElement.lang = "de-DE";
        const result = generateArchesURL("example_url", { id: "123" });
        expect(result).toBe("/de/admin/example/123");
    });

    it("throws an error if the URL name is not found", () => {
        expect(() =>
            generateArchesURL(
                "non_existent_url",
                { id: "123" },
                undefined,
                "fr",
            ),
        ).toThrowError(
            "Key 'non_existent_url' not found in .arches-urls attributes",
        );
    });

    it("replaces URL parameters correctly", () => {
        const result = generateArchesURL("another_url", { id: "456" });
        expect(result).toBe("/admin/another/456");
    });

    it("handles multiple interpolations in the URL", () => {
        const result = generateArchesURL(
            "multi_interpolation_url",
            {
                resource_id: "42",
                field_id: "name",
                version_id: "7",
            },
            undefined,
            "es",
        );
        expect(result).toBe("/es/resource/42/edit/name/version/7");
    });

    it("throws an error when required URL parameters are missing", () => {
        expect(() =>
            generateArchesURL("missing_required", { id: "123" }),
        ).toThrowError(
            "Missing required parameter 'value' for URL 'missing_required'",
        );
    });

    it("replaces duplicate interpolation keys correctly", () => {
        const result = generateArchesURL(
            "duplicate_interpolation",
            { id: "555" },
            undefined,
            "it",
        );
        expect(result).toBe("/it/repeated/555/again/555");
    });

    it("handles URLs with no placeholders", () => {
        const result = generateArchesURL("plain_url", {});
        expect(result).toBe("/plain/url");
    });

    it("ignores extra parameters not defined in the URL template", () => {
        const result = generateArchesURL(
            "extra_params",
            { id: "321", unused: "shouldBeIgnored" },
            undefined,
            "pt",
        );
        expect(result).toBe("/pt/extra/321");
    });

    it("falls back to the raw string for a multi-segment literal URL that would otherwise be parsed as an invalid expression", () => {
        const result = generateArchesURL("multi_segment_literal_url", {});
        expect(result).toBe("/a/b");
    });

    it("appends query parameters to the URL", () => {
        const result = generateArchesURL(
            "example_url",
            { id: "123" },
            { page: "2", limit: "10" },
            "en",
        );
        expect(result).toBe("/en/admin/example/123?page=2&limit=10");
    });

    it("does not append a query string when queryParameters is not provided", () => {
        const result = generateArchesURL(
            "example_url",
            { id: "123" },
            undefined,
            "en",
        );
        expect(result).toBe("/en/admin/example/123");
    });

    it("does not append a query string when queryParameters is an empty object", () => {
        const result = generateArchesURL(
            "example_url",
            { id: "123" },
            {},
            "en",
        );
        expect(result).toBe("/en/admin/example/123");
    });
});
