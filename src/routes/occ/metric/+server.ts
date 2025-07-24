import { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE } from '$env/static/private';
import { json } from '@sveltejs/kit';
import neo4j from 'neo4j-driver';

export async function GET({ url }) {
    console.log("Received type metric request:", url);

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

        const parameter = url.searchParams.get('clustering');
        if (parameter == null) {
            return json([]);
        }
        const clustering = JSON.parse(parameter);

        if (!(await driver.executeQuery("CALL gds.graph.exists('shared_occs') YIELD exists return exists;", {}, { database: NEO4J_DATABASE })).records[0].get('exists')) {
            await driver.executeQuery(
                `WITH apoc.map.fromPairs($clustering) AS communities
                 MATCH (f0:Findspot)-[r:SHARES_TYPES]->(f1:Findspot) CALL(r){UNWIND $occTypes AS type RETURN sum(r[type]) AS shared}
                 RETURN gds.graph.project('shared_occs', f0, f1,
                 { sourceNodeProperties: f0 { community: toInteger(communities[elementId(f0)])},
                   targetNodeProperties: f1 { community: toInteger(communities[elementId(f1)])}, 
                   relationshipProperties: r {shared: shared} },
                 { undirectedRelationshipTypes: ['*'] })`,
                { occTypes: occTypes.split(','), clustering: clustering },
                { database: NEO4J_DATABASE }
            );
        }

        let { records, summary } = await driver.executeQuery(
            `CALL gds.modularity.stream('shared_occs', { communityProperty: 'community', relationshipWeightProperty: 'shared' })
             YIELD communityId, modularity RETURN communityId AS cluster, modularity ORDER BY cluster ASC`,
            {},
            { database: NEO4J_DATABASE }
        );

        return json(records.map((record) => { return { cluster: record.get("cluster"), modularity: record.get("modularity") } }));
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