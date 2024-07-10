const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: 'http://localhost:9200' }); // Replace with your Elasticsearch node

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Initialize personas and their checklists with empty arrays if they don't exist
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
        // Create document with empty checklist array
        await client.index({
          index: 'checklists',
          id: persona,
          body: {
            persona: persona,
            checklists: []
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
  const { checklist } = req.body;

  try {
    // Fetch existing checklists for the persona
    const { body: existingDoc } = await client.get({
      index: 'checklists',
      id: persona
    });

    const updatedChecklists = [...existingDoc._source.checklists, checklist];

    // Update the document with new checklists
    await client.update({
      index: 'checklists',
      id: persona,
      body: {
        doc: {
          checklists: updatedChecklists
        }
      }
    });

    res.status(200).send('Checklist added successfully.');
  } catch (error) {
    console.error('Error inserting checklist:', error);
    res.status(500).send('Error inserting checklist.');
  }
});

// Fetch all checklists for all personas
app.get('/checklists', async (req, res) => {
  try {
    const { body } = await client.search({
      index: 'checklists',
      size: 100 // Adjust based on your needs
    });

    const checklists = body.hits.hits.map(hit => ({
      persona: hit._source.persona,
      checklists: hit._source.checklists
    }));

    res.status(200).json(checklists);
  } catch (error) {
    console.error('Error fetching all checklists:', error);
    res.status(500).send('Error fetching all checklists.');
  }
});

// Fetch checklists for a specific persona
app.get('/checklists/:persona', async (req, res) => {
  const { persona } = req.params;

  try {
    const { body } = await client.get({
      index: 'checklists',
      id: persona
    });

    const { checklists } = body._source;

    res.status(200).json(checklists);
  } catch (error) {
    console.error(`Error fetching checklists for persona ${persona}:`, error);
    res.status(500).send(`Error fetching checklists for persona ${persona}.`);
  }
});

// Update checklists for a specific persona
app.put('/checklists/:persona', async (req, res) => {
  const { persona } = req.params;
  const { oldChecklist, newChecklist } = req.body;

  try {
    // Fetch existing checklists for the persona
    const { body: existingDoc } = await client.get({
      index: 'checklists',
      id: persona
    });

    // Remove old checklist item
    const updatedChecklists = existingDoc._source.checklists.filter(item => item !== oldChecklist);

    // Add new checklist item
    updatedChecklists.push(newChecklist);

    // Update the document with updated checklists
    await client.update({
      index: 'checklists',
      id: persona,
      body: {
        doc: {
          checklists: updatedChecklists
        }
      }
    });

    res.status(200).send(`Checklist updated successfully for persona ${persona}.`);
  } catch (error) {
    console.error(`Error updating checklists for persona ${persona}:`, error);
    res.status(500).send(`Error updating checklists for persona ${persona}.`);
  }
});

// Delete checklist item for a specific persona
app.delete('/checklists/:persona', async (req, res) => {
  const { persona } = req.params;
  const { checklist } = req.body;

  try {
    // Fetch existing checklists for the persona
    const { body: existingDoc } = await client.get({
      index: 'checklists',
      id: persona
    });

    // Remove the specified checklist item
    const updatedChecklists = existingDoc._source.checklists.filter(item => item !== checklist);

    // Update the document with updated checklists
    await client.update({
      index: 'checklists',
      id: persona,
      body: {
        doc: {
          checklists: updatedChecklists
        }
      }
    });

    res.status(200).send(`Checklist deleted successfully for persona ${persona}.`);
  } catch (error) {
    console.error(`Error deleting checklist for persona ${persona}:`, error);
    res.status(500).send(`Error deleting checklist for persona ${persona}.`);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});q
