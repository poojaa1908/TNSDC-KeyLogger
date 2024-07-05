const { Client } = require('@elastic/elasticsearch');

// Create a new ElasticSearch client
const client = new Client({ node: 'http://localhost:9200' }); // replace with your ElasticSearch URL

async function updateSeverity() {
    // This will update the severity field in all documents of the specified index
    const index = 'your-index-name'; // replace with your index name

    // Define the script to update severity
    const script = `
        if (ctx._source.severity == 2) {
            ctx._source.severity = 1;
        } else if (ctx._source.severity == 3) {
            ctx._source.severity = 2;
        } else if (ctx._source.severity == 4) {
            ctx._source.severity = 3;
        } else if (ctx._source.severity == 5) {
            ctx._source.severity = 4;
        }
    `;

    // Perform the update by query operation
    try {
        const response = await client.updateByQuery({
            index: index,
            body: {
                script: {
                    source: script,
                    lang: 'painless'
                },
                query: {
                    range: {
                        severity: {
                            gte: 2,
                            lte: 5
                        }
                    }
                }
            }
        });

        console.log(`Updated ${response.body.updated} documents.`);
    } catch (error) {
        console.error('Error updating documents:', error);
    }
}

updateSeverity();
