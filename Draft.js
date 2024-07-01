const client = require('../models/incidentModel');

const getIncidentStats = async (req, res) => {
  const { filterAppName, filterSeverity, filterChannelName, startDate, endDate } = req.query;

  const queryObj = {
    bool: {
      must: [],
      filter: []
    }
  };

  // Adding filters
  if (filterAppName) queryObj.bool.must.push({ match: { app_name: filterAppName } });
  if (filterSeverity) queryObj.bool.must.push({ match: { severity: filterSeverity } });
  if (filterChannelName) queryObj.bool.must.push({ match: { channel_name: filterChannelName } });

  // Date range filter
  if (startDate || endDate) {
    const dateRange = {};
    if (startDate) dateRange.gte = startDate;
    if (endDate) dateRange.lte = endDate;
    queryObj.bool.filter.push({ range: { issue_start_date: dateRange } });
  }

  try {
    await client.indices.refresh({ index: 'incidents_v2' });

    const body = {
      size: 0,  // We're only interested in the aggregations
      query: queryObj,
      aggs: {
        total_incidents: {
          value_count: {
            field: 'issue_start_date'  // Counting the number of documents
          }
        },
        resolved_incidents: {
          filter: { term: { status: 'done' } },
          aggs: {
            count: {
              value_count: {
                field: 'issue_start_date'
              }
            }
          }
        },
        avg_resolution_time: {
          avg: {
            script: {
              source: `
                (doc['issue_end_date'].value.millis - doc['issue_start_date'].value.millis) / (1000 * 60 * 60 * 24)
              `
            }
          }
        }
      }
    };

    const response = await client.search({ index: 'incidents_v2', body });
    const summary = {
      total_incidents: response.aggregations.total_incidents.value,
      resolved_incidents: response.aggregations.resolved_incidents.count.value,
      avg_resolution_time: response.aggregations.avg_resolution_time.value
    };

    res.json(summary);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).send('Error performing search');
  }
};

module.exports = {
  getIncidentStats
};


