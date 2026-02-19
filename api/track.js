module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event_source_url, event_id } = req.body;

  const cookies = Object.fromEntries(
    (req.headers.cookie || '').split('; ').filter(Boolean).map(c => c.split('='))
  );
  const spdt = cookies['spdt'] || null;

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  const payload = {
    data: [
      {
        event_name: 'PageView',
        event_time: Math.floor(Date.now() / 1000),
        event_id: event_id,
        action_source: 'website',
        event_source_url: event_source_url,
        user_data: {
          client_ip_address: ip,
          client_user_agent: userAgent,
          ...(spdt && { spdt }),
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://ads-api.spotify.com/conversions/v1/${process.env.SPOTIFY_CONNECTION_ID}/events`,
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
    console.error('Spotify CAPI error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
