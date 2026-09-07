import { MAX_TABLE_ROWS, tabulate } from "./dataTable";

describe("tabulate", () => {
    describe("flat arrays", () => {
        it("takes one row per element, with columns in first-appearance order", () => {
            const table = tabulate([
                { month: "Jan", flood: 12, fire: 3 },
                { month: "Feb", flood: 9, fire: 5 }
            ]);

            expect(table).toEqual({
                columns: ["month", "flood", "fire"],
                rows: [
                    ["Jan", "12", "3"],
                    ["Feb", "9", "5"]
                ],
                omitted: 0
            });
        });

        it("unions keys across rows, so a key absent from the first row still gets a column", () => {
            const table = tabulate([{ a: 1 }, { a: 2, b: 3 }]);

            expect(table?.columns).toEqual(["a", "b"]);
            // The gap is an empty cell rather than a missing one, so the row stays rectangular.
            expect(table?.rows).toEqual([
                ["1", ""],
                ["2", "3"]
            ]);
        });

        it("drops the widget's own row handle, which is not the user's data", () => {
            const table = tabulate([{ region: "North", value: 4, __mxRow: { guid: "1" } }]);

            expect(table?.columns).toEqual(["region", "value"]);
        });
    });

    describe("series arrays", () => {
        it("flattens to one row per point, with the series id leading", () => {
            const table = tabulate([
                {
                    id: "Motor",
                    data: [
                        { x: "Jan", y: 4 },
                        { x: "Feb", y: 6 }
                    ]
                },
                { id: "Property", data: [{ x: "Jan", y: 9 }] }
            ]);

            expect(table).toEqual({
                columns: ["Series", "x", "y"],
                rows: [
                    ["Motor", "Jan", "4"],
                    ["Motor", "Feb", "6"],
                    ["Property", "Jan", "9"]
                ],
                omitted: 0
            });
        });

        /*
         * The ordering bug this guards: a series object is ALSO a plain object, so testing the flat
         * shape first matches it and produces one row per series whose only real column is a
         * stringified data array — a table that renders, looks plausible and carries no values.
         */
        it("is not mistaken for a flat array of objects", () => {
            const table = tabulate([{ id: "Motor", data: [{ x: "Jan", y: 4 }] }]);

            expect(table?.columns).toEqual(["Series", "x", "y"]);
            expect(table?.columns).not.toContain("data");
        });

        it("returns undefined when every series is empty, rather than a headings-only table", () => {
            expect(tabulate([{ id: "Motor", data: [] }])).toBeUndefined();
        });
    });

    describe("shapes that are not tables", () => {
        it.each([
            ["a hierarchy", { name: "root", children: [{ name: "a", value: 1 }] }],
            ["a graph", { nodes: [{ id: "a" }], links: [] }],
            [
                "a numeric matrix",
                [
                    [1, 2],
                    [3, 4]
                ]
            ],
            ["an empty array", []],
            ["a primitive", 42],
            ["null", null],
            ["undefined", undefined]
        ])("declines %s", (_label, value) => {
            expect(tabulate(value)).toBeUndefined();
        });

        it("declines a mixed array rather than tabulating the objects it happens to contain", () => {
            expect(tabulate([{ a: 1 }, 7])).toBeUndefined();
        });
    });

    describe("the row cap", () => {
        it("caps the rows and reports how many were omitted", () => {
            const many = Array.from({ length: MAX_TABLE_ROWS + 25 }, (_, i) => ({ i }));
            const table = tabulate(many);

            expect(table?.rows).toHaveLength(MAX_TABLE_ROWS);
            expect(table?.omitted).toBe(25);
        });

        it("reports nothing omitted when the data fits", () => {
            expect(tabulate([{ a: 1 }])?.omitted).toBe(0);
        });
    });

    describe("cell values", () => {
        it("renders null and undefined as empty rather than as the words", () => {
            const table = tabulate([{ a: null, b: undefined, c: 0, d: false }]);

            // 0 and false are values and must survive; a falsy-strip here would repeat the bug that
            // dropped the first row's click handle.
            expect(table?.rows[0]).toEqual(["", "", "0", "false"]);
        });

        it("keeps a structured value as JSON rather than losing it", () => {
            const table = tabulate([{ point: { x: 1 } }]);

            expect(table?.rows[0]).toEqual(['{"x":1}']);
        });
    });
});
