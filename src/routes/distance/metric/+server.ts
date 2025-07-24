import { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE } from '$env/static/private';
import { json } from '@sveltejs/kit';
import neo4j from 'neo4j-driver';

export async function GET({ url }) {
    console.log("Received distance metric request:", url);

    // TODO

    throw new Error('Not implemented!');
}