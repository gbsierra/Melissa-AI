//
async function suggestAmountForSwap(originalName, substituteName, setLoading) {
  try {
    setLoading(true);
    const response = await fetch('http://10.0.0.23:3001/api/ingredient/swap-amount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalName,
        substituteName,
      }),
    });

    const data = await response.json();

    if (response.ok && data.adjustedAmount) {
      return data; // swap suggestion result
    }

    console.warn('⚠️ Unexpected response from backend:', data);
    return {
      adjustedAmount: '1 tsp',
      note: 'Fallback: using default amount',
    };
  } catch (err) {
    console.error('❌ Network or parsing error:', err.message);
    return {
      adjustedAmount: '1 tsp',
      note: 'Error fetching adjusted amount',
    };
  } finally {
    setLoading(false);
  }
}

module.exports = { suggestAmountForSwap };