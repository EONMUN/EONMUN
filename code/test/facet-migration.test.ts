import { expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { readFile, readdir } from "node:fs/promises";

const directory = new URL("../drizzle/", import.meta.url);

test("facet migrations preserve memberships, specifications, and editor changes", async () => {
	const client = createClient({ url: "file::memory:" });
	const apply = async (file: string) => {
		for (const statement of (await readFile(new URL(file, directory), "utf8")).split("--> statement-breakpoint")) {
			if (statement.trim()) await client.execute(statement);
		}
	};
	try {
		await client.execute("PRAGMA foreign_keys = ON");
		const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
		for (const file of files.filter((file) => file < "0012")) await apply(file);
		await client.executeMultiple(`
			INSERT INTO artworks (id, title, slug, description, width, height, depth, created_at, updated_at) VALUES
			(1, 'Banc de Poissons', 'banc-de-poissons', 'Watercolor, rice paper\n12"x14"', 12, 14, 0.5, 1, 1),
			(2, 'Camelia', 'camelia', 'Artist revised this description', NULL, NULL, NULL, 1, 1),
			(3, 'Occullilium', 'occullilium', 'Watercolor, pencil, gold leaf, paper\n14"x18"', NULL, NULL, NULL, 1, 1),
			(4, 'Casa de Fuji', 'casa-de-fuji', 'Acrylic, watercolor, paper\n12"x14"', NULL, NULL, NULL, 1, 1),
            (5, 'Elephants', 'elephants-bw', 'Acrylic, canvas paper\n12”x9”', NULL, NULL, NULL, 1, 1);
			INSERT INTO facets (id, name, slug, type, created_at, updated_at) VALUES
			(1, 'Small', 'small', 'size', 1, 1), (2, ' small ', 'legacy-small', 'size', 1, 1),
			(3, 'Artist-confirmed medium', 'confirmed', 'material', 1, 1);
			INSERT INTO artworks_to_facets VALUES (1, 1, 1), (2, 2, 1), (4, 3, 1);
		`);
		for (const file of files.filter((file) => file >= "0012")) await apply(file);
		const small = await client.execute("SELECT id, namespace, key, value FROM facets WHERE key = 'size'");
		expect(small.rows).toEqual([{ id: 1, namespace: "artwork", key: "size", value: "Small" }]);
		expect((await client.execute("SELECT artwork_id FROM artworks_to_facets WHERE facet_id = 1 ORDER BY artwork_id")).rows).toEqual([{ artwork_id: 1 }, { artwork_id: 2 }, { artwork_id: 3 }, { artwork_id: 4 }, { artwork_id: 5 }]);
		const facts = async (id: number) => (await client.execute({ sql: "SELECT key, value FROM facets f JOIN artworks_to_facets af ON af.facet_id=f.id WHERE af.artwork_id=? AND key IN ('material','support') ORDER BY key,value", args: [id] })).rows;
		expect(await facts(1)).toEqual([{ key: "material", value: "Watercolor" }, { key: "support", value: "Rice paper" }]);
		expect(await facts(2)).toEqual([]);
		expect(await facts(3)).toEqual([{ key: "material", value: "Gold leaf" }, { key: "material", value: "Pencil" }, { key: "material", value: "Watercolor" }, { key: "support", value: "Paper" }]);
		expect(await facts(4)).toEqual([{ key: "material", value: "Artist-confirmed medium" }, { key: "support", value: "Paper" }]);
		const [artwork] = (await client.execute("SELECT description FROM artworks WHERE id=1")).rows;
		expect(artwork.description).toContain('Watercolor, rice paper\n12"x14"');
		expect((await client.execute("SELECT key,value FROM facets f JOIN artworks_to_facets af ON f.id=af.facet_id WHERE af.artwork_id=1 AND key IN ('width','height','depth','dimension-unit') ORDER BY key")).rows).toEqual([
 {key: 'depth', value: '0.5'}, {key: 'dimension-unit', value: 'in'}, {key: 'height', value: '14'}, {key: 'width', value: '12'}
 ]);
 expect((await client.execute("PRAGMA table_info(artworks)")).rows.map(row => row.name)).not.toContain('width');
		expect((await client.execute("SELECT description FROM artworks WHERE id=2")).rows[0].description).toBe("Artist revised this description");
        expect((await client.execute("SELECT key,value FROM facets f JOIN artworks_to_facets af ON f.id=af.facet_id WHERE af.artwork_id=5 AND key IN ('width','height','orientation') ORDER BY key")).rows).toEqual([{key:'height',value:'12'},{key:'orientation',value:'Portrait'},{key:'width',value:'9'}]);
        expect((await client.execute("SELECT key FROM facets f JOIN artworks_to_facets af ON f.id=af.facet_id WHERE af.artwork_id=2 AND key IN ('width','height','depth')")).rows).toEqual([]);
		expect((await client.execute("PRAGMA foreign_key_check")).rows).toEqual([]);
		await client.execute("SELECT * FROM user LIMIT 0");
		await expect(client.execute("INSERT INTO facets(namespace,key,value,created_at,updated_at) VALUES('artwork','size','SMALL',1,1)")).rejects.toThrow();
		await client.execute("INSERT INTO facets(namespace,key,value,created_at,updated_at) VALUES('shipping','size','Small',1,1)");
		// A data migration can be replayed safely without replacing new editor input.
		await apply("0014_artwork_material_facets.sql");
		expect(await facts(3)).toHaveLength(4);
	} finally {
		client.close();
	}
});
