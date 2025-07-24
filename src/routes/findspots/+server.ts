import { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE } from '$env/static/private';
import { json } from '@sveltejs/kit';
import neo4j from 'neo4j-driver';

export async function GET({ url }) {
    console.log("Received findspot request:", url);

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
        'MATCH (f:Findspot)<-[:FOUND_IN]-(c:Coin) RETURN f, count(c)',
        {},
        { database: NEO4J_DATABASE }
    );

    driver.close();
    return json(records.map(record => [record.get('f'), Number(record.get('count(c)'))]));
}