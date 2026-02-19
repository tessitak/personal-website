module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event_source_url, event_id } = req.body;

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  const payload = {
    capi_connection_id: process.env.SPOTIFY_CONNECTION_ID,
    events: [
      {
        event_id: event_id,
        event_name: 'CUSTOM_EVENT_1', // used for page views
        event_time: new Date().toISOString(), // RFC 3339 format
        event_source_url: event_source_url,
        action_source: 'WEB',
        user_data: {
          ip_address: ip,
        },
      },
    ],
  };

  try {
    console.log('Connection ID:', process.env.SPOTIFY_CONNECTION_ID ? 'set' : 'MISSING');
    console.log('Auth Token:', process.env.SPOTIFY_AUTH_TOKEN ? 'set' : 'MISSING');

    const response = await fetch(
      'https://capi.spotify.com/capi-direct/events/',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SPOTIFY_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    console.log('Spotify CAPI response:', response.status, JSON.stringify(data));
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Spotify CAPI error:', err.message, err.cause);
    return res.status(500).json({ error: err.message, cause: String(err.cause) });
    console.log('Token preview:', process.env.SPOTIFY_AUTH_TOKEN?.slice(0, 10) + '...' + process.env.SPOTIFY_AUTH_TOKEN?.slice(-5));
  }
};
