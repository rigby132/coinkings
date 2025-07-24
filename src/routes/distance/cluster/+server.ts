import { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE } from '$env/static/private';
import { json } from '@sveltejs/kit';
import neo4j from 'neo4j-driver';

export async function GET({ url }) {
    console.log("Received distance clustering request:", url);

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

    let samples = Number(url.searchParams.get('samples'));
    if (samples == null || Number.isInteger(samples)) {
        samples = 10;
    }

    try {

        if (!(await driver.executeQuery("CALL gds.graph.exists('findspots') YIELD exists return exists;", {}, { database: NEO4J_DATABASE })).records[0].get('exists')) {
            await driver.executeQuery(
                `MATCH (f:Findspot) RETURN gds.graph.project('findspots', f, null, {sourceNodeProperties: f { .coordinates }, targetNodeProperties: {}})`,
                {},
                { database: NEO4J_DATABASE }
            );
        }

        let { records, summary } = await driver.executeQuery(
            `CALL gds.hdbscan.stream('findspots', {nodeProperty: 'coordinates', minClusterSize: 2, samples: toInteger($samples)}) YIELD nodeId, label RETURN elementId(gds.util.asNode(nodeId)) AS elementId, label AS cluster`,
            { samples: samples },
            { database: NEO4J_DATABASE }
        );

        let assignments = records.map((record) => { return { elmentId: record.get("elementId"), cluster: record.get("cluster") } });

        let clusters = new Set();
        assignments.forEach((assignment) => {
            clusters.add(Number(assignment.cluster));
        });

        // hdbscan returns -1 and some random integers for clusters -> map these integers to 0, 1, 2, 3, ...
        return json(assignments.map((assignment) => { return { elementId: assignment.elmentId, cluster: [...clusters].sort().findIndex((element) => element == assignment.cluster) } }));
    }
    finally {
        if ((await driver.executeQuery("CALL gds.graph.exists('findspots') YIELD exists return exists;", {}, { database: NEO4J_DATABASE })).records[0].get('exists')) {
            await driver.executeQuery(
                `CALL gds.graph.drop('findspots') YIELD graphName;`,
                {},
                { database: NEO4J_DATABASE }
            );
        }
        driver.close();
    }

}