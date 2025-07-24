import { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE } from '$env/static/private';
import { json } from '@sveltejs/kit';
import neo4j from 'neo4j-driver';

export async function GET({ url }) {
    console.log("Received occ clustering request:", url);

    let driver = null;
    try {
        driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    } catch (err) {
        console.log("error:", err);
        if (driver !== null) {
            await driver.close();
        }
        return json([]);
    }

    try {
        const occTypes = url.searchParams.get('occTypes');
        if (occTypes == null) {
            return json([]);
        }

        if (!(await driver.executeQuery("CALL gds.graph.exists('shared_occs') YIELD exists return exists;", {}, { database: NEO4J_DATABASE })).records[0].get('exists')) {
            await driver.executeQuery(
                `MATCH (f0:Findspot)-[r:SHARES_TYPES]->(f1:Findspot) CALL(r){UNWIND $occTypes AS type RETURN sum(r[type]) AS shared}
                RETURN gds.graph.project('shared_occs', f0, f1, { relationshipProperties: r {shared: shared} }, { undirectedRelationshipTypes: ['*'] })`,
                { occTypes: occTypes.split(',') },
                { database: NEO4J_DATABASE }
            );
        }

        let { records, summary } = await driver.executeQuery(
            `CALL gds.modularityOptimization.stream('shared_occs', { relationshipWeightProperty: 'shared' }) YIELD nodeId, communityId RETURN elementId(gds.util.asNode(nodeId)) AS id, communityId AS cluster`,
            {},
            { database: NEO4J_DATABASE }
        );

        let assignments = records.map((record) => { return { elmentId: record.get("id"), cluster: record.get("cluster") } });

        let clusters = new Set();
        let sizes = new Map();
        clusters.add(0);
        sizes.set(0, 0);

        assignments.forEach((assignment) => {
            const index = Number(assignment.cluster);
            clusters.add(index);
            sizes.set(index, sizes.has(index) ? sizes.get(index) + 1 : 1);
        });

        // clustering returns 0 + some random integers for clusters -> map these integers to 0, 1, 2, 3, ... (0 first, then desc. size)
        const sortedClusters = [...clusters].sort((i0, i1) => { if (i0 == 0) { return -1; } else if (i1 == 0) { return 1; } else { return sizes.get(i1) - sizes.get(i0); } });
        return json(assignments.map((assignment) => { return { elementId: assignment.elmentId, cluster: sortedClusters.findIndex((element) => element == assignment.cluster) } }));
    }
    finally {

        if ((await driver.executeQuery("CALL gds.graph.exists('shared_occs') YIELD exists return exists;", {}, { database: NEO4J_DATABASE })).records[0].get('exists')) {
            await driver.executeQuery(
                `CALL gds.graph.drop('shared_occs') YIELD graphName;`,
                {},
                { database: NEO4J_DATABASE }
            );
        }
        driver.close();
    }
}