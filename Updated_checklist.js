const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');

const client = new Client({ node: 'http://localhost:9200' });

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

// Insert or update checklist items for a specific persona
app.post('/checklists', async (req, res) => {
  const { persona, issue_id, checklist } = req.body;

  if (!persona || !issue_id) {
    return res.status(400).send('Persona and issue_id are required.');
  }

  try {
    // Check if a document with the same persona and issue_id already exists
    const { body } = await client.search({
      index: 'checklists',
      body: {
        query: {
          bool: {
            must: [
              { match: { persona } },
              { match: { issue_id } }
            ]
          }
        }
      }
    });

    if (body.hits.total.value > 0) {
      // Document exists
      const existingDoc = body.hits.hits[0];

      if (checklist === "") {
        // If checklist is empty, delete the existing document
        await client.delete({
          index: 'checklists',
          id: existingDoc._id
        });
        return res.status(200).send('Existing document deleted successfully.');
      } else {
        // Update the existing document
        await client.update({
          index: 'checklists',
          id: existingDoc._id,
          body: {
            doc: { checklist }
          }
        });
        return res.status(200).send('Existing document updated successfully.');
      }
    } else {
      // Document does not exist, insert a new document
      await client.index({
        index: 'checklists',
        body: {
          persona,
          issue_id,
          checklist
        }
      });

      return res.status(200).send('Data added successfully.');
    }
  } catch (error) {
    console.error('Error handling data:', error);
    return res.status(500).send('Error handling data.');
  }
});

// Fetch and group data for a specific persona
app.get('/checklists/:persona', async (req, res) => {
  const { persona } = req.params;

  try {
    const { body } = await client.search({
      index: 'checklists',
      body: {
        size: 1000,
        query: {
          match: {
            persona
          }
        }
      }
    });

    const hits = body.hits.hits;
    const groupedData = hits.reduce((acc, hit) => {
      const { issue_id, checklist } = hit._source;
      const found = acc.find(item => item.checklist === checklist);
      if (found) {
        found.id.push(issue_id);
      } else {
        acc.push({ id: [issue_id], checklist });
      }
      return acc;
    }, []);

    res.status(200).json({ data: groupedData });
  } catch (error) {
    console.error(`Error fetching data for persona ${persona}:`, error);
    res.status(500).send(`Error fetching data for persona ${persona}.`);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
