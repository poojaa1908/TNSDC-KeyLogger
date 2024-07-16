const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: 'http://localhost:9200' }); // Replace with your Elasticsearch node

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Initialize personas with empty data array if they don't exist
const initialPersonas = [
  "manager",
  "developer",
  "code_reviewer",
  "release_coordinator",
  "psg",
  "pte",
  "dare"
];

(async () => {
  for (const persona of initialPersonas) {
    try {
      // Check if document already exists
      const { body: exists } = await client.exists({
        index: 'checklists',
        id: persona
      });

      if (!exists) {
        // Create document with empty data array
        await client.index({
          index: 'checklists',
          id: persona,
          body: {
            persona: persona,
            data: []
          }
        });
      }
    } catch (error) {
      console.error(`Error initializing persona ${persona}:`, error);
    }
  }
})();

// Insert checklist items for a specific persona
app.post('/checklists', async (req, res) => {
  const { persona } = req.query;
  const { data } = req.body;

  if (!Array.isArray(data)) {
    return res.status(400).send('Data should be an array of objects.');
  }

  try {
    // Fetch existing data for the persona
    const { body: existingDoc } = await client.get({
      index: 'checklists',
      id: persona
    });

    const updatedData = [...existingDoc._source.data, ...data];

    // Update the document with new data
    await client.update({
      index: 'checklists',
      id: persona,
      body: {
        doc: {
          data: updatedData
        }
      }
    });

    res.status(200).send('Data added successfully.');
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).send('Error inserting data.');
  }
});

// Fetch all data for all personas
app.get('/checklists', async (req, res) => {
  try {
    const { body } = await client.search({
      index: 'checklists',
      size: 100 // Adjust based on your needs
    });

    const checklists = body.hits.hits.map(hit => ({
      persona: hit._source.persona,
      data: hit._source.data
    }));

    res.status(200).json(checklists);
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).send('Error fetching all data.');
  }
});

// Fetch data for a specific persona
app.get('/checklists/:persona', async (req, res) => {
  const { persona } = req.params;

  try {
    const { body } = await client.get({
      index: 'checklists',
      id: persona
    });

    const { data } = body._source;

    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching data for persona ${persona}:`, error);
    res.status(500).send(`Error fetching data for persona ${persona}.`);
  }
});

// Update data for a specific persona
app.put('/checklists/:persona', async (req, res) => {
  const { persona } = req.params;
  const { oldData, newData } = req.body;

  try {
    // Fetch existing data for the persona
    const { body: existingDoc } = await client.get({
      index: 'checklists',
      id: persona
    });

    // Remove old data item
    const updatedData = existingDoc._source.data.filter(item => JSON.stringify(item) !== JSON.stringify(oldData));

    // Add new data item
    updatedData.push(newData);

    // Update the document with updated data
    await client.update({
      index: 'checklists',
      id: persona,
      body: {
        doc: {
          data: updatedData
        }
      }
    });

    res.status(200).send(`Data updated successfully for persona ${persona}.`);
  } catch (error) {
    console.error(`Error updating data for persona ${persona}:`, error);
    res.status(500).send(`Error updating data for persona ${persona}.`);
  }
});

// Delete data item for a specific persona
app.delete('/checklists/:persona', async (req, res) => {
  const { persona } = req.params;
  const { data } = req.body;

  try {
    // Fetch existing data for the persona
    const { body: existingDoc } = await client.get({
      index: 'checklists',
      id: persona
    });

    // Remove the specified data item
    const updatedData = existingDoc._source.data.filter(item => JSON.stringify(item) !== JSON.stringify(data));

    // Update the document with updated data
    await client.update({
      index: 'checklists',
      id: persona,
      body: {
        doc: {
          data: updatedData
        }
      }
    });

    res.status(200).send(`Data deleted successfully for persona ${persona}.`);
  } catch (error) {
    console.error(`Error deleting data for persona ${persona}:`, error);
    res.status(500).send(`Error deleting data for persona ${persona}.`);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
