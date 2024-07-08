const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

async function fetchSortedData() {
    try {
        const { body } = await client.search({
            index: 'your-index-name',
            body: {
                sort: [
                    {
                        _script: {
                            type: 'number',
                            script: {
                                lang: 'painless',
                                source: `
                                    if (doc['priority'].value == 1) {
                                        return 0;
                                    } else if (doc['priority'].value == 2) {
                                        return 1;
                                    } else {
                                        return 2; // In case there are other priorities
                                    }
                                `
                            },
                            order: 'asc'
                        }
                    },
                    { issue_end_date: { order: 'desc' } }
                ]
            }
        });

        console.log('Sorted data:', body.hits.hits.map(hit => hit._source));
    } catch (error) {
        console.error('Error fetching sorted data:', error);
    }
}

fetchSortedData();
