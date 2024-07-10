const express = require('express');
const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: 'http://localhost:9200' });
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to insert a single checklist item into a specific field
app.post('/insert', async (req, res) => {
  try {
    const { field, checklistItem } = req.body;

    if (!['admin', 'manager', 'developer'].includes(field)) {
      return res.status(400).json({ error: 'Invalid field specified' });
    }

    // Fetch the existing document
    const { body: searchBody } = await client.search({
      index: 'checklist',
      body: {
        query: {
          match_all: {}
        }
      }
    });

    let documentId;
    let existingChecklist = [];

    if (searchBody.hits.total.value > 0) {
      const existingDoc = searchBody.hits.hits[0];
      documentId = existingDoc._id;
      existingChecklist = existingDoc._source[field] || [];
    }

    // Add the new checklist item
    existingChecklist.push({ item: checklistItem });

    // Create or update the document
    const { body: response } = await client.index({
      index: 'checklist',
      id: documentId,
      body: {
        [field]: existingChecklist
      },
      refresh: true
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch existing checklists
app.get('/checklists', async (req, res) => {
  try {
    const { body } = await client.search({
      index: 'checklist',
      body: {
        query: {
          match_all: {}
        }
      }
    });

    res.json(body.hits.hits.map(hit => hit._source));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to update existing checklist
app.put('/update/:field', async (req, res) => {
  try {
    const { field } = req.params;
    const { checklist } = req.body;

    if (!['admin', 'manager', 'developer'].includes(field)) {
      return res.status(400).json({ error: 'Invalid field specified' });
    }

    // Fetch the existing document
    const { body: searchBody } = await client.search({
      index: 'checklist',
      body: {
        query: {
          match_all: {}
        }
      }
    });

    let documentId;

    if (searchBody.hits.total.value > 0) {
      const existingDoc = searchBody.hits.hits[0];
      documentId = existingDoc._id;
    }

    // Update the document
    const { body: response } = await client.index({
      index: 'checklist',
      id: documentId,
      body: {
        [field]: checklist.map(item => ({ item }))
      },
      refresh: true
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 
