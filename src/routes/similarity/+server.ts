import { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE } from '$env/static/private';
import { json } from '@sveltejs/kit';
import neo4j from 'neo4j-driver';

export async function GET({ url }) {
    console.log("Received similarity edges request:", url);

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

    let { records, summary } = await driver.executeQuery(
        'MATCH (f0:Findspot)-[r:HAS_SIMILAR_COINS]->(f1:Findspot) RETURN elementId(f0) AS id0, elementId(f1) AS id1, r.score AS score',
        {},
        { database: NEO4J_DATABASE }
    );
    
    driver.close();
    return json(records.map(record => [record.get("id0"), record.get("id1"), Number(record.get("score"))]));
}