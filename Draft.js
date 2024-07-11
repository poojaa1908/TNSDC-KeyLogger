   
    const channels = response.aggregations.channels.buckets;
    const result = [];

    channels.forEach(channel => {
      const counts = [0, 0, 0, 0]; // Initialize the counts for each severity level
      channel.severities.buckets.forEach(severity => {
        const severityIndex = parseInt(severity.key, 10) - 1;
        if (severityIndex >= 0 && severityIndex < 4) {
          counts[severityIndex] = severity.doc_count;
        }
      });
      result.push({ channel_name: channel.key, counts });
    });

    res.json(result);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).send('Error performing search'
